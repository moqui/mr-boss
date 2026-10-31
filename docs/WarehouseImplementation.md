# Warehouse implementation

The Warehouse app calls Mantle's stock services, which check their own permissions and organization. BOSS owns the
app's access (`ironstone.warehouse.AccessServices`), its routes, choices, Home and forms, and adds no same-named
pass-through of a Mantle service. P1 (the foundation), P2 (facilities and locations), P3 (policies), P4 (inventory and
traceability), P5 (the posting guard and moves), P6 (adjustments, scrap and repack), P7 (receiving) and P10 (counts) are
built; each later phase of
[impl-warehouse](../plan/impl-warehouse.md) extends the contracts below and this file.

## Routes and users

| Area | Implemented destinations |
| --- | --- |
| Foundation | Home: the facility picker, the operation queues, the user's work and the lookup of a scanned or typed code |
| Locations | Facilities (list and tree, New facility), FacilityDetail (`Shared/FacilityDetail`) and EquipmentDetail (`Shared/EquipmentDetail`), each with the Warehouse context; open to every Warehouse user, edits for the facility admin |
| Inventory | Assets (with Relocate), AssetDetail (Ledger, Reservations, Audit, Files, Notes; Move, Record adjustment, Scrap), Movements (Correct), Lots (Correct, corrections, Scrap of expiring stock), Containers, ContainerDetail (put in, take out, move the container), Traceability, Adjustments (P6, with Scrap); Products' Product360 and InventoryAvailability at `Inventory/Product360` and `Inventory/Availability` (Relocate on Locations and lots) |
| Transfers | Move (P5), Repack (P6); `Transfers/Transfers`, out of the menu, where a move to another facility leads until P15 builds transfers |
| Receiving | Receipts (list, board, calendar; New receipt), ReceiptDetail (`Shared/ShipmentDetail`), Receive (also at Handheld/Receive), Supplier360 (`Shared/Supplier360`), NewReceipt (quick create) and ReceiptDocument (print) (P7) |
| Handheld | `density="handheld"`: Home (facility, scan anything, tasks) and Move (Transfers/Move mounted here) (P5); Receive (Receiving/Receive mounted here) (P7); Count (Counts/CountEntry mounted here, P10) |
| Settings | The settings index, stock policies, reservation policies (with ReservationCheck's repair, P5) and asset pools (P3) |
| Counts | Counts (the list, the Due saved find, New count), CountDetail, CountEntry, CountReview, CountSheet (P10); for the count, count reviewer and adjust groups only (below) |
| Reports | CountVariance (P10); the other reports come with P17. Open to every Warehouse user; each report's service decides what it shows |
| Shipping, Returns | Placeholders, open to every Warehouse user, replaced by their phases |
| Inspection, Picking | Placeholders for their capability groups only (below) |

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
| `BOSS_WAREHOUSE_ADMIN` | every permission above, and `FACILITY_ALL_ORGANIZATIONS` (Mantle's guards in every organization, P2) |
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
| P2 | ZIRET_WH's `0601` shipping dock and `0199` (closed June 30, 2026); `BOSS_WH_ANNEX` inside ZIRET_WH; the forklift `BOSS_WH_FORKLIFT` at `0601` (operator `warehouse.move`, a scheduled oil change) |
| Products | `BOSS_WH_LOTTED` (lot required, shelf life), `BOSS_WH_SERIAL` (serial required): WarehousePolicy tracking rows |
| Lots | `BOSS_WH_LOT_A` (expires 2027-12-31), `BOSS_WH_LOT_B` (expired 2026-01-31) |
| Stock | `BOSS_WH_LOT_AVAIL`, `_HOLD`, `_QUARANTINE`, `_MORGUE`, `_EAST`; units `BOSS_WH_SER_1` (SCN-1001), `_2` (on hold), `_3` (east) |
| Documents | shipments `BOSS_WH_SHIP_OUT`, `_IN`, `_TRANSFER`, and `BOSS_WH_SHIP_OTHER` of ORG_ZIZI_SERVICES' `BOSS_PRD_WH`; return `BOSS_WH_RETURN`; count `BOSS_WH_COUNT` |
| P6 | the twelve-pack `BOSS_WH_SEAL_CASE` (packaging of `BOSS_WH_LOTTED`) with five cases `BOSS_WH_CASES` of lot `BOSS_WH_LOT_C`; ORG_ZIZI_RETAIL's closed fiscal month `BOSS_WH_CLOSED_2024_06` (June 2024); the scrap account 519200000 on ORG_ZIZI_CORP's AstTpInventory mappings (`ironstone.warehouse.DemoServices.load#WarehouseDemo`) |

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
| `resolve#Scan` | The resolver of every Warehouse `scan-input` (P5): `get#ScannedRecord`'s matches of the field's allowed types as `{identityType, id, label, detail}` (a location's id is its `locationSeqId` in the facility). Its `facilityId` and the text are client input, so each scan is checked again: a facility outside the scope is `FACILITY_UNAVAILABLE`, records outside it are left out |

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

## Inventory (P4)

`ironstone.warehouse.InventoryServices` (`Inventory.js`; drop-downs through `template/WarehouseInventoryParts.xml`
`inventoryChoices`) reads every list in the query limited to the user's facilities (the chosen one, refused outside the
scope with `FACILITY_UNAVAILABLE`) and answers cost (`acquireCost`, `unitCost`, `costIncluded`) only with financial read:

| Service | Contract |
| --- | --- |
| `find#Assets` | Assets by product, lot, serial, owner, pool, status, location, container and text; depleted stock with `showEmpty`; with `groupBy` (product, lot, location, owner) the groups' totals and filters |
| `get#AssetDetail`, `get#AssetAudit`, `store#AssetMetadata` | One asset's header and reservations; its audit trail (cost and book fields only with financial read, left out in the query); its name and comments, for adjust, through Mantle's `update#AssetMetadata` |
| `find#Movements`, `get#Traceability` | Mantle's `TraceabilityServices` with the user's `facilityIds`, plus Warehouse links |
| `find#Lots`, `get#LotDetail`, `create#Lot` | Lots with stock in the user's facilities and lots with no stock anywhere; a lot's stock and products; a new lot for receive |
| `find#Containers`, `get#ContainerDetail`, `create#Container` | Containers with their asset counts; one container's contents; a new empty container for move |
| `get#ProductStock` | A product's Replenishment levels, Locations and lots, and Reservations for the Warehouse tabs of Product360 and Availability |
| `get#InventoryChoices` | products, lots, locations (of a facility), manufacturers, containerTypes, varianceReasons, assetStatuses |

Mantle contracts (mr-mantle): `mantle.product.TraceabilityServices.find#Movements` (each ledger row's source, document,
reason, user, correction chain and revaluation split or partial move) and `get#Traceability` (bounded, cycle-safe nodes,
edges and occurrence-keyed tree rows; Unknown provenance; restricted unnamed nodes), both scoped by organization through
`StockScope.js` and narrowed by `facilityIds`; `mantle.product.AssetRecordServices.update#AssetMetadata` (`STOCK_ADJUST`),
`create#Lot` (`STOCK_RECEIVE`), `create#Container` (`STOCK_MOVE`) and `create#AssetContent`; `get#ProductStockTotals`'
`quantityByStatus` and `transitQuantity`.

Products' mounts: `ironstone.products.CatalogServices.get#SharedContext` with `appRoot` Warehouse (`SharedContext.js`
`warehouseContext`) answers the Warehouse tabs (Summary, Identifiers, Dimensions, Stock, Replenishment, Documents, History),
read capabilities only (no catalog, price or cost edit), the stock policy capabilities from `policyPlan`/`policyManage`,
and `facilityIds`, which Products' `Inventory.js` uses for the facilities; Availability's Summary counts held by status and
shows in transit there. A Warehouse-only user's product record link opens `Inventory/Product360`.

Record hosts: `AssetContent` holds an asset's files (AssetDetail's Files tab, EquipmentDetail); an unbooked asset is a
record of its owner's or facility owner's organizations under an organization filter (`get#RecordLinkInfo`).

## Shell, links and Home

- **Providers** (`Warehouse.xml`): the palette source `search#Records` (lots and containers have no DataDocument and come
  from it), palette types `MantleShipment` and `MantleAsset`,
  the Today source `HomeServices.get#TodayItems` and the WarehouseCountsDue topic (P10), the quick create
  `warehouseNewReceipt` (P7: `Receiving/NewReceipt`, opened to the receive group by `BOSS_WH_NEW_RECEIPT`) and the
  notification topic `WarehouseReceiptException` (P7), and the `warehouse` key scope (`g q`, Home). Transfer, count and
  stock request quick creates come with their phases, each a screen whose authorization matches its create permission.
- **Record links** (`ironstone.commons.PaletteServices.get#RecordLink`): `MantleShipment`, `MantleAsset`, `MantleFacility`
  and the entities Shipment, Asset, Lot, Container, PhysicalInventory, ReturnHeader and Facility route through
  `Warehouse.js` `recordLink`, which answers a link only for a user who may open Warehouse and work with the record.
  A kind's destination is its entry in `destinations` (path and id parameter: asset, lot, container and product since P4);
  a kind without one opens Home's lookup
  (`Home?lookupType=<kind>&lookupId=<id>`, `lookupFacilityId` for a location). A phase that builds a detail screen adds
  its kind there.
- **Home** (`ironstone.warehouse.HomeServices.get#Home`): `queueRows` for receiving, putaway (move), inspection,
  picking, packing, shipping, returns, transfers and counts, each shown for the capabilities that reach it, with
  `readyCount`, `waitingCount`, `lateCount` and `backorderCount` null until the phase that builds the task list counts
  them (shown as Unavailable, never zero; drop shipments left out). `workRows` is empty: the Today and MyWork sources are
  the loads still open from earlier days (WorkEffortParty on WepShipmentShip loads), assigned counts (P10) and assigned
  inspections (P8); there is no putaway assignment record (F42). QueueFilters has the facility only; owner and date
  horizon come with the counts.

## Facilities and locations (P2)

**Mantle** (`mantle.facility.FacilityServices`, script `FacilitySetup.js`; mr-mantle `test/WarehouseFacilities.spec.js`).
Each write checks `FACILITY_EDIT` and the organization through `service/mantle/facility/FacilityScope.js`, the one scope
of the Mantle facility and stock guards (`WarehousePolicy.js` too; P5 on call it): every organization for a system
administrator or `FACILITY_ALL_ORGANIZATIONS` (granted to `BOSS_WAREHOUSE_ADMIN`), else the user's organizations,
narrowed to the active one when it is theirs. BOSS's `canEdit` and `canPlan` follow the same scope. Refusals carry reason
codes.

| Service | Contract |
| --- | --- |
| `store#Facility` | Create, or change one of the user's: owner in their scope (`OWNER_UNAVAILABLE`), a name, a parent that is theirs and never the facility or one under it (`PARENT_CYCLE`, ancestors locked), close not before open; contact through `create#`/`update#Facility`; a changed owner needs `changeReason`, audit-logged. A blank parent keeps the stored one unless `clearParent`; an unchanged parent is not checked again |
| `store#FacilityLocation` | Create (`isNew` refuses an id in use: `LOCATION_EXISTS`) or change an open location (`LOCATION_CLOSED`): type, description, area through position (the id is made from them when not given), `capacity` with `capacityUomId`, `sequenceNum` (pick sequence) |
| `store#FacilityLocationType` | The facility's `autoStatusId` for a location type (an asset status, or none), audit-logged with the required `changeReason` |
| `get#FacilityLocationBlockers` | What keeps a location from closing, by kind (`stock`, `equipment`, `container`, `reservation`, `count`, `productLocation`) with the records it names (F43) |
| `close#FacilityLocation` | Sets the audit-logged `FacilityLocation.thruDate` now, with the required reason, only when there are no blockers; else `LOCATION_IN_USE` naming each |
| `reopen#FacilityLocation` | Clears `thruDate`, with the required reason |
| `check#FacilityLocationOpen` | For the destination guards, inside their own transaction: locks the location row (serializing with a close); `LOCATION_UNAVAILABLE` for a missing location, `LOCATION_CLOSED` for a closed one, `FACILITY_CLOSED` for a location of a closed facility; no permission check of its own |

The blockers (F43): stock (`AstTpInventory`, `AstTpSupplies` or no type) with on-hand or available-to-promise not zero
(a depleted asset does not block); any other asset (equipment) that is not `AstDelivered` or `AstDeactivated`, has
no `actualEndOfLife` and is not counted by quantity with nothing on hand; a container; a reservation with `quantityNotIssued` above zero on an asset there; a count line
there on a count not `PIComplete`; a `ProductFacilityLocation` naming it. `store#ProductFacilityPolicy` takes
`removeLocation` with `locationSeqId` to remove a product's location policy, and refuses a new policy at a closed
location. The shipping-dock location type is `FltShipDock` (F8).

**For later phases.** P5's move, P7's receive and P9's putaway guards call `check#FacilityLocationOpen` on the
destination inside their operation (`receive#Asset` and `move#Asset` do not read `thruDate`). P9 adds its putaway rule to
the blockers (`blockersOf` in `FacilitySetup.js`) when it builds the rule. P10 replaces the "not `PIComplete`" test with
its count statuses. A location picker uses the `locations` choice (open locations only) or the same
`thruDate` condition.

**BOSS reads** (`ironstone.warehouse.FacilityServices`, script `Facilities.js`): `get#Facilities` (the user's
facilities, searched ignoring case, a page at a time, with type, parent in scope, owner, state, child and open location
counts), `get#FacilityDetail` (header, overview, contact, children in scope, equipment there that has not left, `canEdit`
from `facilityEdit` and `canPlan` from the policy capabilities), `get#FacilityLocations` (open locations in pick order,
or every one with `includeClosed`, and each location type's status), `get#FacilityProducts` (ProductFacility and
ProductFacilityLocation rows), `get#FacilitySchedule` (the next two weeks' bookings from
`mantle.work.EventServices.get#FullCalendarData`), `get#Equipment` (EquipmentDetail's Warehouse context) and
`get#FacilityChoices` (`facilityTypes`, `locationTypes`, `reorderMethods`, `abcClasses`, `assetStatuses`, `owners`,
`parents`, `capacityUoms`, `locations`, `products`). Each checks the facility (or asset) through `check#Record` first.
`Warehouse.js` exports `required`, `inScope` and `facilityIds` for a phase's own module; `destinations.facility` opens
FacilityDetail, and `sharedLinks` has `Locations/Facilities`, `Locations/FacilityDetail` and `Locations/EquipmentDetail`.

**Screens.** `Warehouse/Locations.xml` mounts the area's tabs: `Locations/Facilities.xml` (default) and the shared
FacilityDetail and EquipmentDetail (hidden from the menu); putaway rules, carriers, box types and printers are new files
under `Locations/`. `template/WarehouseFacilityParts.xml` holds the `facilityChoices` and `createFacility` transitions
and the `NewFacility` dialog (shown when `canEdit` is in the context). Every write transition calls `check#Record` with
`facilityEdit` (or `policyPlan` for product policies) and then the Mantle service.

`Shared/FacilityDetail.xml` reads the header (Warehouse context only, else "not available") and holds Edit facility;
its tabs are the files of `Shared/FacilityDetail/`, ordered by `default-menu-index`:

| Index | Tab | Built by |
| --- | --- | --- |
| 1 | `Overview.xml` (Overview and contact, equipment here) | P2 |
| 2 | `Children.xml` (facilities inside, New facility inside) | P2 |
| 3 | `Locations.xml` (location types and statuses, locations with Edit, Close, Reopen) | P2 |
| 4 | `Products.xml` (product and location policies) | P2 |
| 5 | `BoxTypes.xml` | P12 |
| 6 | `Printers.xml` | P13 |
| 7 | `Policies.xml` | P3 |
| 8 | `Schedules.xml` (bookings) | P2 |
| 9 | `Files.xml` (record files of the Facility) | P2 |
| 10 | `Conversation.xml` (chatter of the Facility) | P2 |

A new tab is a file there with its `default-menu-index`, its own transitions (a form posts to its own screen), and the
read it needs in its `actions`, guarded by `appRoot == 'Warehouse'` and failing to "nothing shown" (`recordFound`), since
the client loads a tab alone after the header; it needs no change to `FacilityDetail.xml`.

`Shared/EquipmentDetail.xml` reads `get#Equipment` when `appRoot == 'Warehouse'`; its Warehouse widgets are the
`WarehouseEquipment` section of `template/WarehouseEquipment.xml`: identity, maintenance summary, assignments to people
and work, bookings, and the book (net book, in service, cost) only for `financialRead`. Stock is refused as equipment.
Assigning equipment to a load comes with P11; its files with P4's AssetContent.

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

## Posting guard and moves (P5)

Every stock mutation of Warehouse is an entry point of `mantle.shipment.WarehouseTaskServices`
(`service/mantle/shipment/WarehouseTaskServices.xml`), never a Mantle primitive alone (impl-warehouse §2 WH-POST). An
entry point is inline XML Actions that take the steps of `service/mantle/shipment/StockPosting.js` in this order; P6
(adjust, scrap, repack), P7 (receive), P9 (putaway), P10 (count posting), P11 (pick) and the rest are written the same way.

**How an entry point is written.**

1. **Permission and operation key, first.** `posting.begin(context, '<OperationType>', '<PERMISSION>', [request fields])`
   checks the Mantle permission (`ProductAccess.has`; `PERMISSION_DENIED`) and then looks up the operation on the CX-POSTING
   record (`mantle.ledger.transaction.PostingOperation`) before any other check. The client's `operationKey` (a scan's
   `scanId`, or a form's render token; at most 200 characters, `OPERATION_KEY_REQUIRED`) is stored as `"WH"` and 38
   characters of the hash of user, operation type and key, so the lookup is scoped per user and operation (F143): another
   user's or another operation's same key is its own operation. The request hash covers the named fields (numbers in a
   canonical form). A retry with the same request answers `begun.previous`, the stored answer with `alreadyApplied: true`,
   and the entry point returns it at once; a different request, operation type or user on the stored row is
   `OPERATION_KEY_CONFLICT`.

   ```xml
   <set field="posting" from="ec.resource.script('component://mr-mantle/service/mantle/shipment/StockPosting.js')"/>
   <set field="begun" from="posting.begin(context, 'StockMove', 'STOCK_MOVE', ['assetId', 'quantity', 'toLocationSeqId'])"/>
   <if condition="begun.previous"><set field="result" from="begun.previous"/><return/></if>
   ```
2. **The records, locked and scoped.** `posting.scope()` is `FacilityScope.js`'s organizations (never computed apart);
   `posting.stock(userScope, assetId, quantity)` locks the asset (for update) and refuses one outside a facility of those
   organizations (`RECORD_UNAVAILABLE`, a forged id alike), equipment (`NOT_STOCK`), nothing on hand (`NO_STOCK`), a quantity
   that is not above zero (`QUANTITY_INVALID`) or above on hand (`QUANTITY_EXCEEDS_ON_HAND`); `posting.container` and
   `posting.facility` do the same for a container and a facility. **One lock order everywhere:** containers first (the
   container moved, or the target container of a move or attach), then assets by id (the asset moved, or a container's
   contents), then the destination location (`check#FacilityLocationOpen`). So a container move and a move into that
   container never wait on each other in opposite orders.
   Then `posting.settled(op)` reads the operation key again: a concurrent submit of the same operation waited on these
   locks, and now finds the first one's row and answers it (`alreadyApplied`) rather than failing on what it changed.

   ```xml
   <set field="result" from="posting.settled(begun.op)"/>
   <if condition="result"><return/></if>
   ```
3. **The destination.** `posting.destination(userScope, facilityId, {toLocationSeqId, toContainerId, toFacilityId})`:
   another facility is `OTHER_FACILITY` (a transfer, P15); a container gives its location (`LOCATION_REQUIRED` without
   one, and one owner's stock: `CONTAINER_OWNER` when the target container holds another owner's, given `ownerPartyId`);
   the location goes through `mantle.facility.FacilityServices.check#FacilityLocationOpen` inside the entry point's
   transaction (locked; `LOCATION_UNAVAILABLE`, `LOCATION_CLOSED`, `FACILITY_CLOSED`); the answer carries the location
   type's `autoStatusId`, the status `receive#Asset` and `move#Asset` give stock there.
4. **Status, expiry and policy.** `posting.keepHeld(asset, target)` answers the status the stock has after the move and
   refuses one that would release quarantined stock (`HELD_STOCK`, F8: only `dispose#Inspection`, P8, releases it) and
   any other status change with no `moqui.basic.StatusFlowTransition` from the current status to the new one (also
   `HELD_STOCK`: `move#Asset` checks the flow on a whole move only, so a part of the morgue or of defective stock moved to a
   pick bin would otherwise become available; F418). A location type with no `autoStatusId` keeps the status, so
   quarantined stock may move to a bulk location, and a receiving hold (AstOnHold) is put away to AstAvailable by its flow.
   `posting.expiryWarnings(assetId)` gives the stock's expiry as warnings (`EXPIRED`, `NEAR_EXPIRY`, each with its
   `expiryDate`); the refusals of the expiry gate are in Mantle's reservation and issue themselves (below). Operation
   settings come from `WarehousePolicyServices.resolve#WarehousePolicy`'s `operationPolicy` (F101); the period: an entry
   point that posts value (a receipt, issuance or variance) calls `posting.period(organizationPartyIds, effectiveDate)`
   (P6), which refuses a closed fiscal period of the date for each organization (and those it rolls up to), read for update
   from `PostingGuard.js`'s `fiscal` (`PERIOD_CLOSED`), since `post#AcctgTrans` itself only sends such a posting to the
   error journal (F155); a move posts no value and has none. The step locks the organization's and its rollup parents'
   TimePeriod rows for the transaction, so postings of one organization queue behind each other while it runs: fine for
   the rare value postings of P6; a high-volume entry point (receipts, picks) takes it only with a decision (F171).
5. **The posting and its dependent writes**, in the one transaction: the Mantle primitive (`move#Asset`, `receive#Asset`,
   `issue#...`), called with `disable-authz="true"` since the entry point checked the user. `move#Asset` answers
   `newAssetId`, the asset the moved quantity is in (F150). `posting.recheckReservations(assetId)`
   checks the reservations carried onto stock that is not available (F38: a partial move into a held location carries the
   quantity beyond the source's ATP), so the order is re-reserved on available stock.
6. **The answer.** `posting.complete(op, organizationPartyId, resultEntityName, resultId, answer)` stores the answer with
   the operation (its organization is the facility owner) and returns it. Every entry point has one out-parameter,
   `result`: `operationKey` (the client's), `operationType`, `resultCode`, `alreadyApplied`, `postedDate` and its own fields
   (ids, quantities as text, from and to, statuses, `warnings`).

**A batch** (`relocate#Assets`) is an operation of its own (`begin` with the batch's request: the sorted assets and the
destination), so a retry answers the first batch's results and a changed request under the key is refused; it then runs
each row through the single-row entry point with `posting.batch(context, rows, rowKey, service, parametersOf)`: each row
in its own transaction (a probe) under the operation `"<batch key>/<row key>"`, so a row that fails is named with its
`reasonCode` and message and the others go on, and completes the batch operation with the results.

**Refusals** are `CODE: message` errors, raised one way in the guard's steps: `denied(code, message)` (EntityLib.js) in
StockPosting.js, and `<return error="true" message="CODE: ...">` for a check written in the entry point's XML. The service
layer turns both into the call's errors, so a caller compares the code (`reasonCode`), never the wording; a thrown one
reads "Error: CODE: ..." and `reasonOf` finds the code after any prefix. A refused screen transition answers the JSON
client with status 500 whichever way the refusal was raised: the framework sends any JSON answer with errors as a 500
(F418); a walk allows that refusal's 500 until the framework answers it otherwise.

**The entry points of P5.**

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `move#Stock` | StockMove, `STOCK_MOVE` | An asset, or part of it, to a location or container of its facility through `move#Asset` (a part becomes its own asset there; the reservations travel as Mantle moves them); refuses the place it is (`SAME_LOCATION`) and a container of another owner's stock (`CONTAINER_OWNER`). `workEffortId` (a production run being staged) is kept in the answer |
| `relocate#Assets` | StockRelocate (each row StockMove), `STOCK_MOVE` | Whole assets to one location, each its own `move#Stock`; `results` (key, ok, resultCode and result, or reasonCode and message), `movedCount`, `failedCount` |
| `attach#AssetToContainer` | StockAttach, `STOCK_MOVE` | An asset (or part) into a container where both are, through `move#Asset` at the container's own location, so nothing moves (F9): refuses an asset away from it (`ASSET_AWAY_FROM_CONTAINER`), in another container (`IN_OTHER_CONTAINER`), already in it, another owner's stock in it (`CONTAINER_OWNER`), a status change (`STATUS_CHANGE`) |
| `detach#AssetFromContainer` | StockDetach, `STOCK_MOVE` | An asset (or part) out of its container at the same location (`NOT_IN_CONTAINER`, `STATUS_CHANGE`) |
| `move#Container` | ContainerMove, `STOCK_MOVE` | A container with all its contents, all or nothing: every content asset checked first (`HELD_STOCK` names it), then the container's location (Mantle's `ContainerAssetLocation`) and each asset through `move#Asset` at the container, which applies the location type's status |
| `repair#FacilityReservations` | ReservationRepair, `STOCK_POLICY_MANAGE` | What `preview#FacilityReservations` named, as previewed (its `previewFingerprint`; `PREVIEW_CHANGED`): `check#AssetReservationValid` per finding; for a not-available one, `reserve#IncreasedAsset` on the product's available stock, which moves the product's not-available reservations at the facility (the previewed ones among them, in its own order), each previewed one reported repaired or still not available; each in its own transaction |

The CX-POSTING movement fields (F7, `entity/WarehouseTaskEntities.xml`): `enteredQuantity`, `enteredQuantityUomId` and
`appliedConversionFactor` on AssetReceipt, AssetIssuance and ShipmentItemSource, written by the receive, issue and pick
entry points (P7, P11, P16) with what the person entered and the conversion applied; the stock quantity stays in the
existing fields.

**The expiry gate** (WH-EXPIRY, F12) is the tracking policy's `expiryBlock` (WarehousePolicy, Products P7's field), off by
default, the policy of the stock's facility owner: `WarehousePolicyServices.get#ExpiryGate` (cached; a narrower row cannot
lift a wider block) and `get#AssetExpiry`
(the earlier of the asset's expected end of life and its lot's expiration, expired when that calendar day has passed,
near expiry within `nearExpiryDays`). With it on, `reserve#AssetForOrderItem` skips expired stock (explicit assets, the
pick and other locations, and the single-lot and newer-inventory lot queries) and names the shortfall
(`EXPIRED_SHORTFALL` warning; out-parameters `expiredShortfall`, `expiredSkipped`); `issue#AssetReservation`,
`issue#AssetToWorkEffort` and `issue#Asset` with a named asset refuse an expired asset with its date
(`check#AssetExpiryGate`, `ASSET_EXPIRED`), and `issue#Asset` skips expired stock it chooses. `check#AssetExpiryGate` reads
the cached facility and policy from the asset the caller holds and stops there when the policy does not block, so an
issuance with no policy reads nothing more. Quarantine, returns (a purchase-return shipment ships expired stock: the gate
is off for it), disposal and moves are unchanged; a move warns with the date. With no policy row Mantle reserves and issues as before.

**BOSS.** A write transition calls `AccessServices.check#Record` with the capability (the Warehouse facility scope, which
may be narrower than Mantle's organizations), then the entry point with the form's operation key; a refusal answers the
transition's errors (500 with the error, as other refused transitions). The Warehouse groups have no artifact
authorization for the entry points themselves (F3): they reach them through the screens.

| Part | Contract |
| --- | --- |
| `Warehouse/Transfers/Move.xml` | MoveSelect (ScanSelect's scan, or facility, location and product), MoveContents, MoveConfirm (the page's operation key, a render token), RecentMoves; `moveStock` and `selectScan`; `workEffortId` stages for a production run; a link to `Transfers/Transfers` for another facility |
| `Warehouse/Handheld.xml` | `density="handheld"`; sets `handheldMount`, so a desk task's screen mounted under it shows its handheld form (Move at `Handheld/Move`: the stock scan, the quantity and the bin scan with `confirm`, whose `scanId` is the operation key); the request keeps the same transition |
| `Warehouse/Handheld/Home.xml` | The facility picker, Scan anything (`resolve#Scan`, the record found with its Move link), Tasks |
| `ironstone.warehouse.MoveServices` (`Moves.js`) | `get#MoveContext` (the stock at a location, in a container or of a product in one of the user's facilities, reserved and available, the chosen asset, a run's products), `find#RecentMoves` (the user's move operations in their facilities' organizations, with each stored answer) |
| `template/WarehouseMoveParts.xml` | `relocateAssets`: each selected asset (Availability's rows carry their bucket's ids) checked with `move`, then `relocate#Assets`; a message per asset |
| ContainerDetail | `attachAsset`, `detachAsset`, `moveContainer` (MoveContainer and Put stock in dialogs; Take out per row) |
| ReservationCheck | `repairReservations` with the preview's fingerprint, for `policyManage` |

**For later phases.** Write each stock task as an entry point here with StockPosting.js's steps, and its screen
transition as Move's: `check#Record` with the capability, then the entry point with the scan id or a render token as the
operation key. A handheld task is the desk screen mounted under `Warehouse/Handheld` (it reads `handheldMount`), with
`scan-input`s through `AccessServices.resolve#Scan` and the confirmed scan's id as the operation key. P6's value postings
add the period step. P8's `dispose#Inspection` is the one way out of quarantine. P15 replaces `Transfers/Transfers` and
receives a move to another facility as a transfer.

## Adjustments, scrap and repack (P6)

The entry points of `mantle.shipment.WarehouseTaskServices` for P6, written on StockPosting.js's steps; the bucket, lot and
pack rules are `service/mantle/shipment/StockAdjustments.js` (`bucketOf`, `assetsOf`, `plan`, `previewOf`,
`postingOrganizations`, `lotScope`, `repackPlan`).

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `preview#StockAdjustment` | read, `STOCK_ADJUST` | The bucket of `define#AdjustmentScope`: one asset, or a product at a facility with a location and a lot each a value, None (blank) or Any (`locationScope`/`lotScope` `any`), the owner (the facility owner unless given, F156), pool and status a value or Any, received by the effective date. `mode` count or delta and `quantity` give the before, change and after as of the date (text), the assets reached, `previewFingerprint`, and `valueChange` only with `ACCOUNTING_VIEW` (`valueAvailable` false when a reached asset has no cost). Refuses a future date, a negative count, a zero change, a reduction beyond what was on hand, more than 500 assets |
| `adjust#Stock` | StockAdjust, `STOCK_ADJUST` | As previewed (`previewFingerprint`; `PREVIEW_CHANGED`), stock only (`NOT_STOCK`), with a variance reason that is not a scrap reason (`REASON_REQUIRED`, `REASON_INVALID`: Scrap's) and the period step on the date: a PhysicalInventory of its own (F157), then the locked plan's change through `record#PhysicalInventoryChange` with the plan's assets in the preview's order (oldest received first, F165) and the bucket's fields for a new asset; `NO_CHANGE` posts nothing. `result`: `physicalInventoryId`, `quantityBefore`, `quantityChange`, `quantityAfter`, `assetIds` |
| `scrap#Asset` | StockScrap, `STOCK_ADJUST` | Free stock (not quarantined, `HELD_STOCK`; not reserved, `RESERVED_STOCK`) with a scrap reason (enumCode scrap, or InVrDamaged; `REASON_INVALID`), optionally moved first to a morgue location (`LOCATION_NOT_MORGUE`), out of stock through `record#PhysicalInventoryChange` on one PhysicalInventory per operation with `scrapIndicator` Y; posts by its reason (the organization's VarianceReasonGlAccount, then `scrapGlAccountId`). `result`: `scrappedAssetId`, `physicalInventoryId`, `locationSeqId`, `statusId`, `warnings` (expiry) |
| `correct#LotMetadata` | LotCorrect, `STOCK_ADJUST` or `LOT_EXPIRY_EXTEND` | Only the fields given (`clearExpirationDate` removes the expiry), each audit-logged with `changeReason` (`REASON_REQUIRED`); an extension needs `LOT_EXPIRY_EXTEND`, any other change `STOCK_ADJUST`; a lot whose stock is also another organization's is `LOT_SHARED`; `NO_CHANGE`, `LOT_EXISTS`; assets whose expected end of life was the old expiry follow (F158); no quarantine released. `result`: `changes` (field, oldValue, newValue), `expiryExtended`, `assetIds` |
| `preview#Repack` | read (the asset not locked), `STOCK_MOVE` | The conversion by Products' packaging (`resolve#ScannedProduct`, F161): `direction` unpack (the source is a pack of the target; an empty target is its contents) or repack (whole packs, `QUANTITY_NOT_WHOLE_PACKS`), `targetQuantity`, `factor`, the lot; with `ACCOUNTING_VIEW` `costAvailable` and the unit costs (none when the source has no cost); `PACK_UNDEFINED`. `StockAdjustments.js` `repackTargets(asset)` lists what an asset can become by the same resolver (the unpack target, and packs of every level) |
| `repack#Asset` | StockRepack, `STOCK_MOVE` | Available or on-hold stock (`HELD_STOCK`, F167) with an owner (`OWNER_REQUIRED`) that is free to issue (`RESERVED_STOCK`), the destination (the source's location by default) and status by the guard, the period step; a WetTask/WepAssembling work effort of the stock's owner; `issue#AssetToWorkEffort` and `receive#Asset` with the lot, expiry, pool and the issued cost ÷ target quantity at four decimals (the last unit received apart at the remainder's cost, so the receipts carry the issued value exactly, F166), netting to zero through AssetIssuanceGlPost and AssetReceiptGlPost; the receipt's `sourceAssetIssuanceId`, `enteredQuantity` and `appliedConversionFactor`. `result`: `toAssetId`, `receipts` (one, or two with the remainder), `workEffortId`, `assetIssuanceId`, `assetReceiptId` |

Entity changes (`entity/WarehouseTaskEntities.xml`): `PhysicalInventory.scrapIndicator`, `AssetReceipt.sourceAssetIssuanceId`
(CX-PRODUCTION, relationship `sourceAssetIssuance`). `Lot.manufacturedDate` and `Asset.expectedEndOfLife` are audit-logged on
update.

**BOSS.** `ironstone.warehouse.AdjustmentServices` (`Adjustments.js`) shapes the screens and runs the Mantle previews as probes
(a refusal is the preview's message, nothing posted):

| Part | Contract |
| --- | --- |
| `get#AdjustmentContext` | The facility and a fixed asset (on hand, reserved, free, expiry), the adjustment reasons (no scrap reason), scrap reasons, morgue locations, the Correct movement, the preview with `summaryText` and (financial read) `valueText`, or `previewError`; the user's recent adjustments, scraps and lot corrections |
| `get#RepackContext` | The facility, a product's stock there, the selected asset's targets (Mantle's `repackTargets`), the preview as `previewText` and (financial read) `costText`, or `previewError`; recent repacks |
| `get#LotCorrections` | A lot's audit-logged corrections, newest first |
| `Warehouse/Inventory/Adjustments.xml` | AdjustmentScope and Adjustment (GET form; Preview), Before and after with Post adjustment (`adjustStock`: `check#Record` asset or facility with `adjust`, then `adjust#Stock` with the fingerprint and a render token), the Scrap dialog (`scrapAsset`, `_openDialog=ScrapDialog` from AssetDetail, Move and Lots) |
| `Warehouse/Transfers/Repack.xml` | RepackSource (scan of an asset or product, or facility and product; the stock), RepackTarget (Into, Quantity; Preview), RepackConfirm (`repackStock`: `check#Record` asset with `move`, then `repack#Asset`) |
| Lots | Correct (`correctLot`: `check#Record` lot, then `correct#LotMetadata`), the corrections list, Scrap on an expiring lot's stock |

A scrap's PhysicalInventory is not a count record (`Warehouse.js` `recordOf`), so the palette, the lookup and record links
leave it out; P10's count lists leave out `scrapIndicator` Y the same way.

## Receiving (P7)

**Mantle** (mr-mantle `service/mantle/shipment/WarehouseTaskServices.xml` on StockPosting.js and `Receiving.js`; spec
`test/WarehouseReceiving.spec.js`). Each entry point takes the steps of "Posting guard and moves" (`posting.begin` accepts a
list of permissions, any one admitting); one lock order: the order part, the shipment, its sources by id, the destination
location. A receipt's facility is its route segment's destination (F55). Every answer is one `result` map.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `ensure#PurchaseReceipt` | ReceiptEnsure, `STOCK_RECEIVE` or `PURCHASE_ORDER_EDIT` | A purchase order part's one open receipt: its ShpTpPurchase shipment in Input or Scheduled (`EXISTING`), else `create#OrderPartShipment` to the facility (`CREATED`, the part's facility by default) with a line in another unit converted to the stock unit (F176); `excludeShipmentId` for a backorder. Refuses NOT_PURCHASE, ORDER_NOT_OPEN, RECORD_UNAVAILABLE, FACILITY_REQUIRED, NOTHING_TO_RECEIVE |
| `adjust#ExpectedReceipt` | ReceiptAdjust, `STOCK_RECEIVE` or `PURCHASE_ORDER_EDIT` | Purchasing's revision: each open receipt source of the order set to the line's new remainder (stock units), never below what was received; the receipt is locked first, so a revision waits for a receive in progress (F175) |
| `receive#ShipmentStock` | StockReceive, `STOCK_RECEIVE` | The receive guard over `receive#ShipmentProduct`: accepted and rejected in the entered unit (the order line's by default) or packs (`resolve#ScannedProduct`), converted and kept as entered on each receipt (F7 fields); a lot (LOT_REQUIRED for lot-tracked stock; the shelf life when no expiry), one unique serial per accepted unit (SERIAL_COUNT_MISMATCH, SERIAL_DUPLICATE; one call per serial, F183); a rejection needs a reason (REASON_REQUIRED) and with nothing accepted is written by the guard (F177); the policy's over-receipt tolerance, zero by default (OVER_RECEIPT, F182); the receipt step's open destination (§4). Refuses RECEIPT_TYPE (not a purchase receipt), RECEIPT_CLOSED, PRODUCT_NOT_ON_RECEIPT, UNIT_CONVERSION, QUANTITY_INVALID; sends the exception notice for rejected units |
| `receive#ExpectedShipment` | ReceiptReceiveAll, `STOCK_RECEIVE` | "Receive all as expected", `confirmed` required (CONFIRMATION_REQUIRED): each line's remainder through `receive#ShipmentStock`, then `deliver#Shipment`, all or nothing; refuses a lot- or serial-tracked line (TRACKING_REQUIRED) and nothing left (NOTHING_TO_RECEIVE). Never `receive#EntireShipment` (F37) |
| `receive#AdHocStock` | StockReceiveAdHoc, `STOCK_RECEIVE` | AdHocReceipt over `receive#Asset`: a reason (REASON_REQUIRED, kept in `AssetReceipt.itemDescription`), an owner of the user's organizations (OWNER_UNAVAILABLE), a stocked product (NOT_STOCK), the unit, lot, serial and step rules above, an optional cost |
| `close#ReceiptRemainder` | ReceiptClose, `STOCK_RECEIVE` | Finish a short receipt with a reason: `close` runs Purchasing's close (`PurchaseRemainders.js` `remainders()`) for each order on it, `backorder` lowers this receipt's items to what was received (`update#ShipmentItem`) and puts the remainder on the part's next receipt (`ensure#PurchaseReceipt`); then `deliver#Shipment` (not when the close cancelled a receipt that received nothing), whose SECA bills a self-billing supplier's accepted quantity as Accounting conditioned it; the exception notice. Refuses CHOICE_INVALID, REASON_REQUIRED and as above |
| `generate#TrackingIdentities` | read only, `STOCK_RECEIVE` or `STOCK_ISSUE` | Serial or lot values from a first value counted up, or the tracking policy's pattern (`{seq}`, `{seq:N}`, `{yyyy}`, `{yy}`, `{MM}`, `{dd}`, `{product}`), each flagged IN_STOCK, LOT_EXISTS or REPEATED; writes nothing |

Purchasing's contract: `mantle.order.OrderServices.close#PurchaseRemainders` (PURCHASE_ORDER_EDIT in the buying
organization; `PurchaseRemainders.js`): per product line the quantity less what was received, accepted and rejected (F180),
cancelled through `cancel#OrderItem` with that explicit cancelQuantity, the line's `RequirementOrderItem` quantity lowered
by it, the reason as an internal OrderNote; a part with every line received (accepted and rejected) completed (F181); a
completed or cancelled order's open budget commitments released by the internal
`mantle.other.BudgetServices.release#ClosedSourceCommitments` (F179). Permission `PURCHASE_ORDER_EDIT` and the topic
`WarehouseReceiptException` (to the facility owner's STOCK_POLICY_MANAGE holders) are in MantleSetupData.

**BOSS.** `ironstone.warehouse.ReceiptServices` (`Receipts.js`, reads only): `get#Receipts` (incoming purchase, return and
transfer shipments received at the user's facilities, open by default, by supplier, status, source type, overdue and text, a
page at a time, with expected, accepted, rejected and due), `get#ReceiptDetail` (header, lines, receipts with lot, serial,
location, status, reason and the quantity as entered, the receipt step, `canReceive`/`canFinish`), `get#ReceiveContext` (and
the chosen line's units and tracking), `get#ReceiptChoices` (purchaseParts, returns, suppliers, receiptProducts,
rejectionReasons, units, products), `get#ReturnReceipt` (a return's shipment, RETURN_NO_SHIPMENT), `get#SupplierReceiving`
(contact, open orders, receipts, rejections, returns; no price). No cost is read.

| Part | Contract |
| --- | --- |
| `Warehouse/Receiving.xml` | Receipts (default), ReceiptDetail (`Shared/ShipmentDetail`) and Supplier360 (`Shared/Supplier360`) mounts; Receive, NewReceipt and ReceiptDocument out of the menu |
| `Receiving/Receipts.xml` | ReceiptFind (header dialog), ReceiptList with list, board by status and calendar by expected day (both read only), New receipt for receive |
| `Receiving/Receive.xml` | ReceiveSource, ReceiveLine (`receiveLine`: check#Record with receive, then `receive#ShipmentStock` with the page's token or the handheld product scan's id), GenerateTracking (a preview through the screen's own parameters, then `receiveLine` for serials or `receiveLots` for a lot range under the page's one key), Finish receipt and Receive all as expected, AdHocReceipt (`receiveAdHoc`); `handheldMount` shows the scans (receipt, then product with confirm) |
| `template/WarehouseReceiptParts.xml` | `receiptChoices`, `ensureReceipt` (the part's facility unless another is chosen), `closeRemainder`, `receiveAll`; sections NewReceiptForm, ReceiptLines, ReceiptRows, FinishReceipt |
| `template/WarehouseReceiptDetail.xml` | ShipmentDetail's Warehouse branch (`WarehouseReceipt`): the record header, lines, receipts, files and conversation |
| `Shared/Supplier360` | `appRoot == 'Warehouse'` reads `get#SupplierReceiving`; tabs Overview, Documents, Receiving and Conversation (Warehouse only); Products & prices renders nothing there (F178) |
| Record links | A purchase or customer return shipment opens `Receiving/ReceiptDetail` (`recordUrl`); others as before |
| Home | The receiving queue's waiting and late counts (the selected facility's open purchase receipts) |

**For later phases.** P8 creates the inspection in a step-3 receipt (it posts into quarantine today) and adds ReceiptDetail's
Inspection part; P9 replaces step 1's product location with the putaway rule; P13 adds the receipt's tracking; P14 receives
returns on ReturnReceipt (Receive refuses them, RECEIPT_TYPE); P15 receives a transfer's leg; Purchasing calls
`ensure#PurchaseReceipt` for its expected receipt, `adjust#ExpectedReceipt` from its revision and `close#PurchaseRemainders`
from ClosePurchaseOrders; Manufacturing's ReceiveOutput uses `generate#TrackingIdentities`.

## Counts (P10)

Mantle owns counts (`mantle.product.InventoryCountServices`, `InventoryCounts.js`; the schedule in
`mantle.facility.WarehousePolicyServices`, `CountSchedule.js`); BOSS reads and shapes through `ironstone.warehouse.CountServices`
(`Counts.js`) with the user's facilities, and posts through `template/WarehouseCountParts.xml`'s transitions, each
`check#Record` (the count, facility or asset) with its capability, then the Mantle service.

**The records.** A count is a PhysicalInventory with a `countModeEnumId` (full, cycle, spot); Mantle's immediate postings and
P6's scrap records have none and are never listed (F235). Statuses: PIInPlanning, PIInProgress, PIInValidation, PIComplete and
PICancelled, by `StatusFlowTransition`. Its lines (PhysicalInventoryCount) are one asset each from the snapshot of the scope at
start, plus extra lines for stock found; line statuses PicOpen, PicCounted, PicSkipped, PicConflict, PicApproved, PicPosted,
PicFailed. `quantityOnHand` is the observation.

| Contract | What it does |
| --- | --- |
| `create#Count`, `update#Count`, `cancel#Count` | A planned count: facility, scope or assets, mode, blind (default the operation policy's `blindCount`), assignee, date; STOCK_COUNT |
| `start#Count` | Fixes and snapshots the scope (stock with a quantity, not AstMorgue; a zero confirmation also its emptied stock) |
| `record#CountLine` | An observation or a skip with its reason of a line of the count named (another count's: RECORD_UNAVAILABLE), or stock found (`LINE_EXISTS` for stock the snapshot holds); `increment` with an operation key; LINE_REVIEWED for a reviewed line, COUNT_DATE_INVALID outside snapshot..now |
| `submit#Count` | To review; entry stops |
| `review#Count`, `recount#Count`, `resolve#CountConflict` | STOCK_COUNT_REVIEW: approve or name the conflict (movements or a move since the snapshot), skip the uncounted; recount re-snapshots; carry posts observed less the balance when counted, with a reason |
| `post#Count` | STOCK_ADJUST through StockPosting.js: each bucket (an asset, or stock found) in its own transaction (`post#CountLines`), its summed delta once through `change#AssetQuantity` (found: a new asset); `STOCK_MOVED` returns a line to conflict, other failures are named; successes skipped by a later attempt; `lastCountDate` on the location and product facility; complete when every line is posted or skipped. A closed fiscal period refuses the whole post first (PostingGuard.js `fiscal`, the date a Timestamp); each bucket checks again with StockPosting.js's `posting.period` under its lock (F240, F246); the asset's quantity must be its snapshot plus the movements the review saw (STOCK_MOVED); once a line posts the count's date is fixed (DATE_FIXED); `post#CountLines` and `fail#CountLines` are internal to it |
| `get#Count`, `find#Counts`, `find#CountVariance` | Reads with `facilityIds`; expected quantities only for a count not blind, or a submitted blind one to reviewers and adjusters; values with ACCOUNTING_VIEW; the variance report needs count review or adjust |
| `find#DueCounts` | Each location or product at the earliest next date of the schedule rows reaching it (periodic, annual, zero confirmation), and the planned ad hoc counts |
| `request#Count` | Request a count (STOCK_COUNT) and the short-pick recount (`CntSrcShortPick`, STOCK_COUNT or SHIPMENT_PICK; joins an open one) |
| `import#CountLines` | CSV rows through `record#CountLine`, each on its own, `resultCsv` the row results |
| `notify#DueCounts` | Nightly: WarehouseCountsDue once a day per facility to its organization's counters and the assignees |
| `store#CountSchedule`, `find#CountSchedules` | Dated `mantle.facility.CountSchedule` rows (STOCK_POLICY_MANAGE): scope, kind, mode, blind, assignee |

**BOSS.** `Warehouse/Counts.xml` and its screens; `Warehouse/Reports/CountVariance.xml`;
`Warehouse/Settings/StockPolicies/CountSchedule.xml`; Request a count on Assets and Availability's Locations and lots
(`requestCount`); `Handheld/Count`; Home's count queue (ready: planned or counting; waiting: submitted; late: overdue dues and
past-dated plans) and the assignee's counts (`get#CountWork`); the Today source `HomeServices.get#TodayItems` over `Today.js`,
where P8 and P11 add their sources. HandheldCount's scan is `CountServices.resolve#CountScan`, which names an asset's serial or lot and location, never its quantity or status (F245). A full count holds at most 5000 assets. A count's record link opens CountDetail for the count groups and Home's lookup for
anyone else (F242).

## Verification

P10, Oct 31, 2026: mr-mantle `WarehouseCounts`; BOSS `WarehouseCounts`, `WarehouseAccess` (a Counts list filtered for a
capability user, another organization's count refused, readers and counters refused what they lack, the count link),
`AppStructure` and `TuiRender` with the count screens and `Handheld/Count`, and the walk `WarehouseCountsWalk`. The counts
are in the plan's §8 record.

P7, Oct 31, 2026: mr-mantle `WarehouseReceiving`; BOSS `WarehouseReceiving`, `WarehouseAccess` (the receipt reads, a
Receipts list filtered for a capability user, forged receipts and suppliers, the entry points without the screens),
`WarehouseShell` (the receipt quick create), `AppStructure` and `TuiRender` with the Receiving and Handheld mounts, and the
walk `WarehouseReceivingWalk` (Handheld Receive at 390 px). The counts are in the plan's §8 record.

P6, Oct 31, 2026: mr-mantle `WarehouseAdjustments`; BOSS `WarehouseAdjustments`, `WarehouseAccess` (the P6 reads, forged
records, the guarded entry points without the screens, the mounts filtered), `AppStructure` and `TuiRender` with Adjustments
and Repack, and the walk `WarehouseAdjustmentsWalk`. The counts are in the plan's §8 record.

P5, Oct 31, 2026: mr-mantle `WarehouseMoves` and `WarehouseExpiry`; BOSS `WarehouseMoves`, `WarehouseAccess` (the Move
reads, the resolver, forged records, the entry points without the screens, the Handheld area filtered), `AppStructure` and
`TuiRender` with the Move and Handheld mounts, and the walk `WarehouseMovesWalk` (Handheld Move at 390 px). The counts are
in the plan's §8 record.

P4, Oct 31, 2026: Mantle `WarehouseTraceability`; `WarehouseInventory`, `WarehouseAccess`, `WarehouseShell`, `AppStructure`,
`TuiRender` and the walk `WarehouseInventoryWalk` (the lists at 390 px). The counts are in the plan's §8 record.


P1, Oct 31, 2026: `WarehouseAccess` and `WarehouseShell` (both with artifact authorization enabled; the scope
features also disabled), `AppStructure` and `TuiRender` with the Warehouse screens, and the client walk
`WarehouseFoundationWalk` (Home at 1280 and 390 px). The counts are in the plan's §8 record.

P2, Oct 31, 2026: mr-mantle `WarehouseFacilities`; BOSS `WarehouseFacilities`, `WarehouseAccess` and `WarehouseShell`,
`AppStructure` and `TuiRender` with the facility and equipment mounts, and the client walk `WarehouseFacilitiesWalk`.
