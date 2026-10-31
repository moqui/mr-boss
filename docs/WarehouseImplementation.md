# Warehouse implementation

The Warehouse app calls Mantle's stock services, which check their own permissions and organization. BOSS owns the
app's access (`ironstone.warehouse.AccessServices`), its routes, choices, Home and forms, and adds no same-named
pass-through of a Mantle service. P1 (the foundation) and P3 (policies) are built; each later phase of
[impl-warehouse](../plan/impl-warehouse.md) extends the contracts below and this file.

## Routes and users

| Area | Implemented destinations |
| --- | --- |
| Foundation | Home: the facility picker, the operation queues, the user's work and the lookup of a scanned or typed code |
| Settings | The settings index, stock policies, reservation policies and asset pools (P3) |
| Receiving, Inventory, Transfers, Shipping, Returns, Locations, Handheld, Reports | Placeholders, open to every Warehouse user, replaced by their phases |
| Inspection, Counts, Picking | Placeholders for their capability groups only (below) |

All routes are under `/qapps/Warehouse`. The root (`screen/Warehouse.xml`) runs `get#SharedContext` in its always-actions
into `warehouse` (capabilities, the selected facility, `sharedLinks`) and sets `appRoot` to `Warehouse`. Shared screen
parts are in `template/WarehouseParts.xml`: the `choices` and `selectFacility` transitions and the `FacilityPicker`
section.

Groups (data/BossSetupData.xml). `BOSS_WAREHOUSE` is the root user group: its authorization on the root has
`MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and it covers `ironstone\.warehouse\..*`. `BOSS_WAREHOUSE_ADMIN` has
every authorization with `MANTLE_ACTIVE_ORG`. Every grant on an area carries the root's filter sets too, since entity filters come from the
record that authorizes the screen (F59). The capability groups of design-warehouse §1 hold no root authorization of
their own (a member is also in `BOSS_WAREHOUSE`), so Products' stock planner opens no Warehouse launcher. Their grants:

| Group | Permissions |
| --- | --- |
| `BOSS_WAREHOUSE_RECEIVE`, `_ISSUE`, `_MOVE`, `_ADJUST`, `_COUNT` | `STOCK_RECEIVE`, `STOCK_ISSUE`, `STOCK_MOVE`, `STOCK_ADJUST`, `STOCK_COUNT` |
| `BOSS_WAREHOUSE_PICK`, `_PACK`, `_SHIP`, `_INSPECT` | `SHIPMENT_PICK`, `SHIPMENT_PACK`, `SHIPMENT_SHIP`, `QUALITY_INSPECT` |
| `BOSS_WAREHOUSE_COUNT_REVIEWER`, `_PICK_SUPERVISOR` | `STOCK_COUNT_REVIEW`, `SHIPMENT_LOAD_EDIT` |
| `BOSS_WAREHOUSE_QUALITY_MANAGER` | `QUALITY_VERIFY`, `QUALITY_DISPOSE`, `QUALITY_TEMPLATE_EDIT`, `LOT_EXPIRY_EXTEND` |
| `BOSS_WAREHOUSE_FACILITY_ADMIN` | `FACILITY_EDIT`, with Products P9's `STOCK_POLICY_PLAN` and `STOCK_POLICY_MANAGE` |
| `BOSS_WAREHOUSE_MANAGER`, `_STOCK_PLANNER` | Products P9's `STOCK_POLICY_MANAGE` and `STOCK_POLICY_PLAN` |
| `BOSS_WAREHOUSE_DISPATCH`, `_SHIPPING_MANAGER`, `_INTEGRATION_OPERATOR` | none yet: their phases add them |
| `BOSS_WAREHOUSE_ADMIN` | every permission above |
| `BOSS_WAREHOUSE`, `BOSS_WAREHOUSE_ADMIN` | `PRODUCT_CATALOG_VIEW`: product names on stock and scans (F56) |

The permissions are Mantle's (`MantleSetupData.xml`; `STOCK_RECEIVE` in `AccountingAccessData.xml`). Financial read is
Accounting's `ACCOUNTING_VIEW` (capability `financialRead`), never a Warehouse grant. No Warehouse group has artifact
authorization for the raw Mantle stock services or the `/mantle` REST paths (F3, F36). The Inspection, Counts and
Picking (with the move group) areas deny `BOSS_WAREHOUSE` and allow their groups (`BOSS_WH_<Area>` artifact groups); a new restricted area
follows that pattern.

Demo users (BossUsersDemoData.xml, password `moqui`), agents of Ziziwork Retail: `warehouse.receive`, `.inspect`,
`.issue`, `.move`, `.count`, `.countreview`, `.adjust`, `.pick`, `.picksupervisor`, `.pack`, `.ship`, `.dispatch`,
`.shippingmanager`, `.planner`, `.manager`, `.quality`, `.facility`, `.integration`, the reader `warehouse.read` (no other
business launcher) and `warehouse.admin`.

Demo records (BossWarehouseDemoData.xml), over Mantle's ZIRET_WH (ORG_ZIZI_RETAIL):

| Record | Ids |
| --- | --- |
| Locations added to ZIRET_WH | `0701` staging, `0901` quarantine, `0991` morgue (with Mantle's `0801` receiving) |
| Second warehouse | `BOSS_WH_EAST` (E0101 pick, E0801 receiving, E0901 quarantine; tote `BOSS_WH_TOTE_E1`) |
| Products | `BOSS_WH_LOTTED` (lot required, shelf life), `BOSS_WH_SERIAL` (serial required): WarehousePolicy tracking rows |
| Lots | `BOSS_WH_LOT_A` (expires 2027-12-31), `BOSS_WH_LOT_B` (expired 2026-01-31) |
| Stock | `BOSS_WH_LOT_AVAIL`, `_HOLD`, `_QUARANTINE`, `_MORGUE`, `_EAST`; units `BOSS_WH_SER_1` (SCN-1001), `_2` (on hold), `_3` (east) |
| Documents | shipments `BOSS_WH_SHIP_OUT`, `_IN`, `_TRANSFER`, and `BOSS_WH_SHIP_OTHER` of ORG_ZIZI_SERVICES' `BOSS_PRD_WH`; return `BOSS_WH_RETURN`; count `BOSS_WH_COUNT` |

Another organization's records, which Retail's warehouse users never reach: `BOSS_PRD_WH` and its stock
(BossProductsDemoData.xml), including `BOSS_PRD_FOREIGN_STOCK`, Retail-owned stock in that facility (third-party
facilities are later, impl-warehouse §4).

## Access contract

`ironstone.warehouse.AccessServices` (service script `Warehouse.js`), every service `allow-remote="false"`:

| Service | Contract |
| --- | --- |
| `get#SharedContext` | Refuses a user without Warehouse (`WAREHOUSE_UNAVAILABLE`), another `appRoot` (`WAREHOUSE_CONTEXT`), a given facility outside the scope (`FACILITY_UNAVAILABLE`). Answers `capabilities`, `organizationPartyIds`, `activeOrganizationPartyId`, `allFacilities`, `facilityCount`, `facilityId`/`facilityName` (the given one, else the preference in scope, else the only facility), `appRoot`, `linkBase`, `webBase`, `sharedLinks` |
| `check#Record` | `recordType` (facility, location with `facilityId`, asset, container, lot, shipment, return, count), `recordId`, optional `capability`. Answers the record's `facilityId`, `facilityIds`, `facilityName`, `label`, `detail`. A missing record and one outside the scope are refused alike (`RECORD_UNAVAILABLE`); a missing capability is `PERMISSION_DENIED` |
| `select#Facility` | Keeps a facility in scope as the `FacilityActive` preference (Mantle's key), or clears it; refuses another (`FACILITY_UNAVAILABLE`) |
| `get#Choices` | `choice` `facilities`: the user's, searched by term ignoring case, with the selected one's label. An unknown choice throws |
| `search#Records` | The palette's Warehouse group: facilities, shipments, assets (id, serial), lots, containers, returns and counts by id, ignoring case, scoped in the query |
| `get#ScannedRecord` | Home's lookup (reads only): `get#ScannedIdGeneral` in the given or selected facility (as a probe, with `_NA_` when none, so its preference fallback never applies), a unit by serial number, and shipments, returns, counts, lots and facilities by id; with `recordType` only that kind |

**Scope.** Who may open Warehouse, and their facilities, are read from the authorizations of the user's groups on the
root (`ArtifactAuthzCheckView`), not from the entity filters of the current find, so disabled or inherited artifact
authorization widens nothing. When every authorization that lets the user in has a filter set with a
`mantle.facility.Facility` filter (`MANTLE_USER_ORG`), the user works in the facilities whose `ownerPartyId` is in
`filterOrgIds`, kept to the organizations they belong to (a grant without MANTLE_ACTIVE_ORG is limited this way even
with no filter at all, so a misconfigured grant fails closed: F62) (an active organization they do not belong to, which Mantle
allows an ADMIN or ACCOUNTING_ADMIN to choose, is set aside: F58). An empty organization list is no facility (F35). An
authorization with no Facility filter (`BOSS_WAREHOUSE_ADMIN`, `ADMIN`) is every facility of every organization.

**Record scope.** A facility by its owner; a location, asset, container or count by its facility; a lot by the
facilities of its stock; a shipment by the origin and destination facilities of its route segments (F55), or with no
facility by its from or to party; a return by its facility, or with none by its vendor or customer.

**Capabilities.** `read` and, from the permission through `ProductAccess.has()`: `receive`, `issue`, `move`, `adjust`,
`count`, `countReview`, `lotExpiryExtend`, `pick`, `loadEdit`, `pack`, `ship`, `facilityEdit`, `inspect`,
`qualityVerify`, `qualityDispose`, `qualityTemplateEdit`, `policyPlan`, `policyManage`, `financialRead`. A phase that
needs a new one adds it to `capabilityPermissions`.

**For later phases.**
- A screen or mount calls `check#Record` (with the capability its action needs) before the Mantle service, and reads its
  list rows with the facility condition of the scope (`facilityIds` in `Warehouse.js`), never by filtering after a limit.
- The Mantle service checks its own permission and organization again; `check#Record` adds the facility.
- A shared screen mounted under Warehouse needs its own `appRoot == 'Warehouse'` branch: Accounting's shared screens and
  Products' `get#SharedContext` refuse any root but their own.
- Keep `Warehouse.js` for access. A phase puts its own logic in its own module (a screen module beside its services, or
  Mantle for business rules) and touches `Warehouse.js` only by small additions to `destinations`, `searchFinds` and
  `capabilityPermissions`.
- The CX-POSTING record is Accounting's `PostingOperation` through `mantle/ledger/EntityLib.js` (`operation`, `complete`,
  `previous`); there is no service for it.

## Shell, links and Home

- **Providers** (`Warehouse.xml`): the palette source `search#Records`, palette types `MantleShipment` and `MantleAsset`,
  and the `warehouse` key scope (`g q`, Home). No quick create, Today source or notification topic yet: receipt,
  transfer, count and stock request quick creates come with their phases, each a screen whose authorization matches its
  create permission.
- **Record links** (`ironstone.commons.PaletteServices.get#RecordLink`): `MantleShipment`, `MantleAsset`, `MantleFacility`
  and the entities Shipment, Asset, Lot, Container, PhysicalInventory, ReturnHeader and Facility route through
  `Warehouse.js` `recordLink`, which answers a link only for a user who may open Warehouse and work with the record.
  A kind's destination is its entry in `destinations` (path and id parameter); a kind without one opens Home's lookup
  (`Home?lookupType=<kind>&lookupId=<id>`, `lookupFacilityId` for a location). A phase that builds a detail screen adds
  its kind there.
- **Home** (`ironstone.warehouse.HomeServices.get#Home`): `queueRows` for receiving, putaway (move), inspection,
  picking, packing, shipping, returns, transfers and counts, each shown for the capabilities that reach it, with
  `readyCount`, `waitingCount`, `lateCount` and `backorderCount` null until the phase that builds the task list counts
  them (shown as Unavailable, never zero; drop shipments left out). `workRows` is empty: the Today and MyWork sources are
  the loads still open from earlier days (WorkEffortParty on WepShipmentShip loads), assigned counts (P10) and assigned
  inspections (P8); there is no putaway assignment record (F42). QueueFilters has the facility only; owner and date
  horizon come with the counts.

## Policies (P3)

Mantle owns the policy and every write; BOSS reads, shapes and posts to it.

| Contract | What it does |
| --- | --- |
| `mantle.facility.WarehousePolicyServices.resolve#WarehousePolicy` | The policy at a date for an organization, facility, store and product: `trackingPolicy`, `operationPolicy`, `reservationPolicy`, and `trace` (each field's value and level: organization, facility, store, product, facility product, location type, default), `warnings`, `canPlan`, `canManage`; `configuredPolicy` and `history` for `policyType` at the exact scope. Later phases read `operationPolicy` at posting |
| `store#OperationPolicy`, `store#ReservationPolicy`, `store#TrackingPolicy` | Dated rows (`expectedFromDate` of the row in effect, a start now or later, a reason); operation and reservation take STOCK_POLICY_MANAGE, tracking product exceptions STOCK_POLICY_PLAN too |
| `update#StoreReservation` | A store's inventory facility, reservation order, timing and require-inventory (the override for its orders), STOCK_POLICY_MANAGE |
| `preview#FacilityReservations` | Reservations a repair would change, by reason code (ASSET_NOT_AVAILABLE, OTHER_FACILITY, POOL_NOT_QUALIFIED, AVAILABLE_ELSEWHERE); read only |
| `get#ReservationDefault` | The facility default Mantle's reservation reads where the store leaves a setting unset; internal, no permission |
| `mantle.product.AssetPoolServices` | `find#AssetPools`, `get#AssetPool`, `store#AssetPool`, `store#AssetPoolParty`, `store#AssetPoolStore` (dates, `endNow`), `preview#AssetPoolReservations` |
| `ironstone.warehouse.PolicyServices` | `get#PolicyContext` (labels, value texts, sources, form values, options), `get#TrackingExceptions`, `get#ReservationCheck`, `get#Pools`, `get#PoolDetail`, `get#SettingsIndex`, `get#PolicyChoices` (organizations, stores, products, parties); each checks Warehouse access and the facility first |

Screens: `Warehouse/Settings` (Index, StockPolicies, ReservationPolicies, AssetPools) and FacilityDetail's Policies tab
(`screen/Shared/FacilityDetail/Policies.xml`, parameters `facilityId` and `appRoot`). The forms and change transitions
are in `template/WarehousePolicyParts.xml`; a change transition calls `check#Record` of the facility with `policyManage`
(`policyPlan` for a product exception) and then the Mantle service. Every Warehouse user reads; managers change.

## Verification

P1, Oct 31, 2026: `WarehouseAccess` and `WarehouseShell` (both with artifact authorization enabled; the scope
features also disabled), `AppStructure` and `TuiRender` with the Warehouse screens, and the client walk
`WarehouseFoundationWalk` (Home at 1280 and 390 px). The counts are in the plan's §8 record.
