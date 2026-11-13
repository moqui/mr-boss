# Warehouse implementation

The Warehouse app calls Mantle's stock services, which check their own permissions and organization. BOSS owns the
app's access (`ironstone.warehouse.AccessServices`), its routes, choices, Home and forms, and adds no same-named
pass-through of a Mantle service. P1 (the foundation), P2 (facilities and locations), P3 (policies), P4 (inventory and
traceability), P5 (the posting guard and moves), P6 (adjustments, scrap and repack), P7 (receiving), P8 (inspection), P9
(putaway), P10 (counts), P11 (picking), P12 (packing), P13 (shipping, labels and printers), P14 (returns), P15 (transfers
and requests), P16 (production runs and stock), P17 (reports) and P18 (the finish) are built: the build of
[impl-warehouse](../plan/impl-warehouse.md) is complete, and what is left is its §7 and §5. Other apps that mount Warehouse's
shared screens or call its Mantle contracts extend the contracts below and this file.

## Routes and users

| Area | Implemented destinations |
| --- | --- |
| Foundation | Home: the facility picker, the operation queues, the user's work and the lookup of a scanned or typed code |
| Locations | Facilities (list and tree, New facility), FacilityDetail (`Shared/FacilityDetail`, with its Box types tab, P12) and EquipmentDetail (`Shared/EquipmentDetail`), each with the Warehouse context; PutawayRules (P9: RuleList, RuleTest); BoxTypes (P12: BoxTypeList, CarrierBoxCodes); Carriers and Printers (P13), FacilityDetail's Printers tab; open to every Warehouse user, edits for the facility admin (carriers: the Warehouse admin) |
| Inventory | Assets (with Relocate), AssetDetail (Ledger, Reservations, Audit, Files, Notes; Move, Record adjustment, Scrap), Movements (Correct), Lots (Correct, corrections, Scrap of expiring stock), Containers, ContainerDetail (put in, take out, move the container), Traceability, Adjustments (P6, with Scrap); Products' Product360 and InventoryAvailability at `Inventory/Product360` and `Inventory/Availability` (Relocate on Locations and lots); `Shared/MaterialIssueReceipt` at `Inventory/MaterialIssueReceipt` (P12, a shipment's kit), out of the menu |
| Transfers | Transfers (list, board, calendar; custody at supplier; New transfer), TransferShipmentDetail and SubcontractShipmentDetail (`Shared/ShipmentDetail`), TransferSheet (print), StockRequests (New stock request), RequestDetail (`Shared/RequestDetail`), NewTransfer and NewStockRequest (quick creates) (P15); Move (P5, the default tab), Repack (P6) |
| Receiving | Receipts (list, board, calendar; New receipt), ReceiptDetail (`Shared/ShipmentDetail`), Receive (also at Handheld/Receive), Supplier360 (`Shared/Supplier360`), NewReceipt (quick create) and ReceiptDocument (print) (P7); Putaway (also at Handheld/Putaway) and PutawaySheet (print) (P9) |
| Handheld | `density="handheld"`: Home (facility, scan anything, tasks) and Move (Transfers/Move mounted here) (P5); Receive (Receiving/Receive mounted here) (P7); Putaway (Receiving/Putaway mounted here, P9); Count (Counts/CountEntry mounted here, P10); Pick (Picking/Pick) and PickFace (Picking/PickLocationMoves) (P11); Pack (Shipping/Pack) (P12) |
| Settings | The settings index, stock policies, reservation policies (with ReservationCheck's repair, P5) and asset pools (P3) |
| Counts | Counts (the list, the Due saved find, New count), CountDetail, CountEntry, CountReview, CountSheet (P10); for the count, count reviewer and adjust groups only (below) |
| Reports | ReportIndex (default), StockAtDate (`Shared/StockAtDate`: Places and History tabs), CountVariance (P10), OperationsHistory and InventoryValuation (Accounting's `Shared/InventoryValuation`, Warehouse branch) (P17). Open to every Warehouse user; each report's service decides what it shows (CountVariance: count reviewers and adjusters; valuation values: financial read) |
| Picking | Picklists (list, board, calendar; New picklist), PicklistDetail, CreatePicklists, Pick, PickLocationMoves and PickSheet (P11); for the pick, pick supervisor and move groups only (below) |
| Shipping | Shipments (list, board, calendar; New shipment) and ShipmentDetail (`Shared/ShipmentDetail`, outbound) (P11); Pack and PackingSlip (print: the slip, package contents, inserts) (P12); Ship, PackageTracking, LabelSheet and Manifest (prints) (P13). Open to every Warehouse user |
| Orders | Out of the menu: OrderDetail (`Shared/OrderDetail`, Warehouse branch) (P11); InvoiceDetail (`Shared/InvoiceDetail`, Warehouse branch, read and print) (P13) |
| Returns | Returns (list; New return), ReturnDetail (`Shared/ReturnDetail`), ReturnReceipt and SupplierReturnShipment (`Shared/ShipmentDetail`), ReturnSlip (print) (P14); open to every Warehouse user, each action's Mantle service checks its permission |
| Inspection | Inspections (list and board by status or inspector; Reassign) and InspectionTemplates (`Shared/InspectionTemplates`), TemplatePrint (P8); for the inspect and quality manager groups only (below). QualityInspection (`Shared/QualityInspection`) and InspectionCertificate are at the root (`Warehouse/QualityInspection`), hidden from the menu and open to every Warehouse user |

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
| `BOSS_WAREHOUSE_SHIPPING_MANAGER` | `SHIPMENT_SHIP` (P13); carrier setup (`SHIPPING_CARRIER_EDIT`) is `BOSS_WAREHOUSE_ADMIN`'s |
| `BOSS_WAREHOUSE_DISPATCH`, `_INTEGRATION_OPERATOR` | none yet: their phases add them |
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
| P9 | ZIRET_WH's `01020301` (the sealant's default location, ProductFacilityLocation, capacity 40 each) and `01020302` (capacity 200 each); the rule `BOSS_WH_PR_SEAL` (sealant from receiving to `01020302`); so `BOSS_WH_LOT_HOLD` is refused the pick bin for capacity and suggested the bay, and `BOSS_WH_SER_2` has no destination |
| P8 | Retail's published template `BOSS_WH_TMPL` (Sealant check, customer returns, so purchase receipts of the sealant are not inspected; Viscosity 40 to 60 and Seal intact) and the draft inspection `BOSS_WH_INSP` of the quarantined `BOSS_WH_LOT_QUARANTINE` (5, sample 2), assigned to warehouse.inspect |
| P12 | the cartons `BOSS_WH_BOX_S` and `BOSS_WH_BOX_M` (ZIRET_WH's box types; UPS code 02 on the medium); the picked shipment `BOSS_WH_SHIP_PACK` of order `BOSS_WH_SO_PACK` (four `BOSS_WH_PACKED` hinges, 0.5 lb, reserved on `BOSS_WH_PACK_STOCK` at 01020201); the kit shipment `BOSS_WH_SHIP_KIT` (one `BOSS_WH_KIT` zinc hinge kit from BOSS_WH_EAST, a pick assembly of `BOSS_WH_KIT_PLATE` and two `BOSS_WH_KIT_SCREW`, stocked as `BOSS_WH_KIT_ONE` and `BOSS_WH_KIT_TWO` at E0101; the demo's own products, since Mantle's flows count DEMO_PA's components); `kitCostFromComponents` on ORG_ZIZI_CORP's preference (Retail's rolls up to it) |
| P6 | the twelve-pack `BOSS_WH_SEAL_CASE` (packaging of `BOSS_WH_LOTTED`) with five cases `BOSS_WH_CASES` of lot `BOSS_WH_LOT_C`; ORG_ZIZI_RETAIL's closed fiscal month `BOSS_WH_CLOSED_2024_06` (June 2024); the scrap account 519200000 on ORG_ZIZI_CORP's AstTpInventory mappings (`ironstone.warehouse.DemoServices.load#WarehouseDemo`) |
| P13 | ZIRET_WH's dock label printer `BOSS_WH_LABEL_PRINTER` (package labels; no print server, so a print fails and offers its reprint); the packed shipment `BOSS_WH_SHIP_SHIP` of order `BOSS_WH_SO_SHIP` (two `BOSS_WH_SHIPPED` brackets in two small cartons, 1.5 and 2 lb, issued from `BOSS_WH_SHIP_STOCK`), routed by the Mantle test carrier (TEST_SHIPPING, TEST_CARRIER Ground) to CustJqp in 89119, and its in-process invoice `BOSS_WH_INV_SHIP` |
| P15 | the transfer demo filter `BOSS_WH_TRF` (30 at ZIRET_WH `01020401`, `BOSS_WH_TRF_STOCK`), 6 of it on `BOSS_WH_SHIP_TRANSFER`; the vendor-custody facility `BOSS_WH_VENDOR` (Retail's, custodian Ziddleman; `V0101`, 3 filters `BOSS_WH_VENDOR_STOCK`); the run `BOSS_WH_RUN` with its coating operation `BOSS_WH_RUN_OP`, the service order `BOSS_WH_SUB_PO` (OrderItemWorkEffort) and the subcontract dispatch `BOSS_WH_SHIP_SUB` (2 filters); the submitted stock request `BOSS_WH_REQ` (4 filters at BOSS_WH_EAST) |

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
`qualityVerify`, `qualityDispose`, `qualityTemplateEdit`, `policyPlan`, `policyManage`, `carrierEdit` (P13), `financialRead`. A phase that
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
  the Today source `HomeServices.get#TodayItems` and the WarehouseCountsDue topic (P10), the WarehouseShortPick topic (P11;
  picklists are the palette source's `load` kind, there is no DataDocument for them), the quick create
  `warehouseNewReceipt` (P7: `Receiving/NewReceipt`, opened to the receive group by `BOSS_WH_NEW_RECEIPT`) and the
  notification topic `WarehouseReceiptException` (P7), the quick creates `warehouseNewTransfer` (P15: `Transfers/NewTransfer`,
  the move group's by `BOSS_WH_NEW_TRANSFER`) and `warehouseNewStockRequest` (every Warehouse user), and the `warehouse` key
  scope (`g q`, Home). The count quick create comes with its phase, a screen whose authorization matches its create
  permission.
- **Record links** (`ironstone.commons.PaletteServices.get#RecordLink`): `MantleShipment`, `MantleAsset`, `MantleFacility`
  and the entities Shipment, Asset, Lot, Container, PhysicalInventory, ReturnHeader (Returns/ReturnDetail, P14) and Facility
  route through
  `Warehouse.js` `recordLink`, which answers a link only for a user who may open Warehouse and work with the record.
  A kind's destination is its entry in `destinations` (path and id parameter: asset, lot, container and product since P4);
  a kind without one opens Home's lookup
  (`Home?lookupType=<kind>&lookupId=<id>`, `lookupFacilityId` for a location). A phase that builds a detail screen adds
  its kind there.
- **Home** (`ironstone.warehouse.HomeServices.get#Home`): `queueRows` for receiving, putaway (move), inspection,
  picking, packing, shipping, returns, transfers and counts, each shown for the capabilities that reach it, with
  `readyCount`, `waitingCount`, `lateCount` and `backorderCount` (null, shown as Unavailable, where the queue is not counted:
  receiving's ready and backorder; shipping is P13's `get#ShippingQueue`); each queue is a number card linking its list (P17). `workRows` (Your
  work) are the Today source's items (`Today.js` `workRows`: title, url, step, due day, Overdue), so a phase's Today source
  shows on Home too: assigned counts (P10), inspections (P8), loads open from an earlier day (P11); there is no putaway
  assignment record (F42). `indicators` counts the selected facility's products in stock and stock lines on hold and in
  quarantine (never a quantity summed across units). QueueFilters has the facility only (owner and horizon: impl-warehouse
  §5).


## Facilities and locations (P2)

**Mantle** (`mantle.facility.FacilityServices`, script `FacilitySetup.js`; mr-mantle `test/Warehouse/WarehouseFacilities.spec.js`).
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
| `get#FacilityLocationBlockers` | What keeps a location from closing, by kind (`stock`, `equipment`, `container`, `reservation`, `count`, `productLocation`, `operationPolicy`, `putawayRule` (P9)) with the records it names (F43) |
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
`test/Warehouse/WarehouseReceiving.spec.js`). Each entry point takes the steps of "Posting guard and moves" (`posting.begin` accepts a
list of permissions, any one admitting); one lock order: the shipment, its sources by id, the order parts, the order header,
the destination location (`ensure#PurchaseReceipt`, with no shipment yet, starts at the part). A receipt's facility is its
last route segment with a destination (F55). Every answer is one `result` map. The receipts check the fiscal period of
today with `posting.period(..., {lock: false})`: high-volume entry points use the non-locking period check, so receipts do not
serialize on the TimePeriod rows (post#AcctgTrans's own guard still runs).

Order lines in another unit than the product's stock unit (F186): Mantle counts shipment sources, issuances and receipts in
the stock unit through `mantle.order.OrderServices.get#OrderItemStockFactor` (1 with no unit, the same unit or no
UomConversion) in `isFulfilled#OrderItem`, `cancel#OrderItem`, `create#OrderPartShipment`, `add#OrderPartToShipment` and
`update#ShipmentItem`.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `ensure#PurchaseReceipt` | ReceiptEnsure, `STOCK_RECEIVE` or `PURCHASE_ORDER_EDIT` | A purchase order part's one open receipt: its ShpTpPurchase shipment in Input or Scheduled (`EXISTING`), else `create#OrderPartShipment` to the facility (`CREATED`, the part's facility by default; its sources in stock units, F186); EXISTING answers that receipt's own facility; `excludeShipmentId` for a backorder. Refuses NOT_PURCHASE, ORDER_NOT_OPEN, RECORD_UNAVAILABLE, FACILITY_REQUIRED, NOTHING_TO_RECEIVE |
| `adjust#ExpectedReceipt` | ReceiptAdjust, `STOCK_RECEIVE` or `PURCHASE_ORDER_EDIT` | Purchasing's revision: each open receipt source of the order set to the line's new remainder (stock units), never below what was received; the receipt is locked first, so a revision waits for a receive in progress (F175) |
| `receive#ShipmentStock` | StockReceive, `STOCK_RECEIVE` | The receive guard over `receive#ShipmentProduct`: accepted and rejected in the entered unit (the order line's by default) or packs (`resolve#ScannedProduct`), converted and kept as entered on each receipt (F7 fields); a lot (LOT_REQUIRED for lot-tracked stock; the shelf life when no expiry), one unique serial per accepted unit, none on stock on hand (SERIAL_COUNT_MISMATCH, SERIAL_DUPLICATE; one call per serial, F183); a rejection needs a reason (REASON_REQUIRED) and with nothing accepted is written by the guard as an AssetReceipt with no stock, since `receive#Asset` writes nothing for a zero quantity (F177); the policy's over-receipt tolerance, zero by default (OVER_RECEIPT, F182); the receipt step's open destination (§4). Refuses RECEIPT_TYPE (not a purchase receipt), RECEIPT_CLOSED, PRODUCT_NOT_ON_RECEIPT, UNIT_CONVERSION, QUANTITY_INVALID; sends the exception notice for rejected units |
| `receive#ExpectedShipment` | ReceiptReceiveAll, `STOCK_RECEIVE` | "Receive all as expected", `confirmed` required (CONFIRMATION_REQUIRED): each line's remainder through `receive#ShipmentStock`, then `deliver#Shipment`, all or nothing; refuses a lot- or serial-tracked line (TRACKING_REQUIRED) and nothing left (NOTHING_TO_RECEIVE). Never `receive#EntireShipment` (F37) |
| `receive#AdHocStock` | StockReceiveAdHoc, `STOCK_RECEIVE` | AdHocReceipt over `receive#Asset`: a reason (REASON_REQUIRED, kept in `AssetReceipt.itemDescription`), an owner of the user's organizations (OWNER_UNAVAILABLE), a stocked product (NOT_STOCK), the unit, lot, serial and step rules above; a cost given needs ACCOUNTING_VIEW (COST_NOT_PERMITTED), else the product's approved standard cost, else its last acquire cost (the answer's `costSource`) |
| `close#ReceiptRemainder` | ReceiptClose, `STOCK_RECEIVE` | Finish a short receipt with a reason: `close` runs Purchasing's close (`PurchaseRemainders.js` `remainders()`) for each order on it, cancelling at most what this receipt expected and did not get (only its sources lowered; another open receipt's remainder stays) and completing only the parts it touched, `backorder` lowers this receipt's items to what was received (`update#ShipmentItem`; a receipt that received nothing is cancelled) and puts the remainder on the part's next receipt (`ensure#PurchaseReceipt`); then `deliver#Shipment` unless the receipt was cancelled, whose SECA bills a self-billing supplier's accepted quantity as Accounting conditioned it; the exception notice. Refuses CHOICE_INVALID, REASON_REQUIRED and as above |
| `generate#TrackingIdentities` | read only, `STOCK_RECEIVE` or `STOCK_ISSUE` | Serial or lot values from a first value counted up, or the tracking policy's pattern (`{seq}`, `{seq:N}`, `{yyyy}`, `{yy}`, `{MM}`, `{dd}`, `{product}`; the sequence goes on after the highest value made from it, or from `startNumber`), each flagged IN_STOCK, LOT_EXISTS or REPEATED; writes nothing |

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

## Putaway (P9)

**Mantle** (`mantle.facility.PutawayServices`, script `service/mantle/facility/Putaway.js`; the entry point
`mantle.shipment.WarehouseTaskServices.putaway#Stock`; mr-mantle spec `test/Warehouse/WarehousePutaway.spec.js`).

**Records** (`entity/PutawayEntities.xml`, seed `data/PutawayData.xml`). `mantle.facility.PutawayRule`: a dated row of a
facility (sequenced `putawayRuleId`, `organizationPartyId` the facility's owner, `previousPutawayRuleId`, key fields
audit-logged under `changeReason`). It applies to stock at `fromLocationSeqId` or of `fromLocationTypeEnumId` (a receipt
counts as receiving), of `productId`, `productCategoryId` or `storageTypeEnumId` (each optional, all given must match),
and names `toLocationSeqId`, or `toLocationTypeEnumId` with an optional `toAreaId` (the open locations of that type, in
pick sequence, at most 50); lower `priority` first; `capacity` with `capacityUomId` (empty: the stock unit) is the most it
fills a destination to. Storage types (`StorageType`: StgCold, StgFrozen, StgHazardous, StgOversize) on
`Product.storageTypeEnumId` (audit-logged; `CatalogRecordServices.store#Product`, a Products clone and variant creation
carry it) and `FacilityLocation.storageTypeEnumId` (`store#FacilityLocation` takes it).

| Contract | What it does |
| --- | --- |
| `store#PutawayRule` | FACILITY_EDIT (`PERMISSION_DENIED`) in the facility's organization (`FACILITY_UNAVAILABLE`, FacilityScope.js): a new rule, a change (`putawayRuleId`: the rule ends where the change starts, now or later, never at or after its scheduled end; a rule to come is changed in place at its own from date; a row already changed is `RULE_CHANGED`) or an end (`endNow`, never later than a scheduled end), with a product and category of the facility's organization and an area it has, `REASON_REQUIRED`, `RULE_INVALID`, `LOCATION_CLOSED` (a closed destination), `RULE_ENDED`, `RULE_CHANGED` (`expectedLastUpdatedStamp`); answers the rule with its texts |
| `find#PutawayRules` | A facility's rules in effect and to come (all with `includeHistory`) by priority, with `appliesText`, `fromText`, `toText`, `capacityText`, dates, `current`/`future`, and `canEdit` |
| `resolve#Destination` | An asset (or a product, quantity and source at a facility; another organization's product is PRODUCT_REQUIRED): only AstAvailable or AstOnHold stock (quarantined stock within quarantine; any other status answers `NOT_PUTAWAY` with no candidate); the product's default locations (ProductFacilityLocation, in pick sequence) first, then each applicable rule in effect at `asOfDate` by priority (a rule naming a default location applies its capacity there), at most 25 locations, each checked (with `explain` false it stops at the first that fits): `LOCATION_CLOSED`/`FACILITY_CLOSED`, `SAME_LOCATION`, `NOT_STORAGE` (receiving, staging, quarantine, morgue, ship dock) or, for quarantined stock, `QUARANTINE_ONLY`, `STATUS_FLOW` (a status change with no StatusFlowTransition), `STORAGE_TYPE`, `OTHER_OWNER`, `CAPACITY_EXCEEDED`, `RULE_CAPACITY`, `CAPACITY_UNMEASURED`. Answers `locationSeqId` (the first that fits), `source` (default or rule), `putawayRuleId`, `statusAfter`, `explanation`, every candidate with its `reasonCode` and `explanation` and fill, or `NO_DESTINATION` with `reasonText`. Reads only; the facility in the user's scope |
| `get#Capacity` | Per open location: capacity in its unit, occupied, incoming, remaining, unmeasured stock, `fits` for a product and quantity |
| `putaway#Stock` | StockPutaway, STOCK_MOVE, on StockPosting.js's steps: the asset locked; the suggestion (`plan`); the destination asked for needs a reason when it is not the suggestion (`REASON_REQUIRED`), none asked takes the suggestion (`NO_DESTINATION` names why, the stock stays); `posting.destination` locks the location and `recheck` runs the checks again under the lock; `NOT_PUTAWAY` for stock putaway does not take; `keepHeld`; `move#Asset`; a receiving hold (AstOnHold) of stock put away from a receiving or staging location is released to AstAvailable in storage through `update#mantle.product.asset.Asset` (its flow, so AssetStatusAvailableReservations runs); `recheckReservations`. `result`: `toLocationSeqId`, `suggestedLocationSeqId`, `suggested`, `source`, `putawayRuleId`, `statusId`, `warnings` |

**Capacity.** A location's or rule's capacity is in its unit: none or a count unit (each, count) is the stock quantity
(converted when the product's stock unit is of the capacity's kind); a weight or volume through the product's
`ProductUomDimension` (Weight or ShippingWeight; Volume or VolumeLiquid) per unit, converted by `convert#Uom`. Stock with
no such measure is unmeasured and the location cannot claim spare capacity. Incoming is the putaway queue's stock (on hand
in the facility's receiving and staging locations) with an earlier claim than the stock resolved (received before it, by
date then id; a receipt and `get#Capacity` count it all), of the products whose first default location (in pick sequence)
it is, less the assets being put away. No capacity is no limit. Queue locations, first defaults and incoming are read once
per resolution.

**Receipts.** Step 1 (Receiving.js `destination`) posts to `resolve#Destination`'s location for the accepted quantity and the
receipt's owner (stopping at the first fit), checked again once the bin is locked, else the receiving location; the receipt's answer carries `putawayExplanation` (why that location, or why none fit). Steps 2
and 3 are unchanged (receiving, quarantine). A putaway rule in effect or to come naming a location (source or destination)
blocks its close (`blockersOf` kind `putawayRule`).

**BOSS.** `ironstone.warehouse.PutawayServices` (`Putaway.js`, reads only):

| Part | Contract |
| --- | --- |
| `get#PutawayContext` | PutawayQueue (available and on-hold stock on hand in the facility's receiving, staging and quarantine locations, each row resolved with `explain` false, by product or source, a page at a time, oldest first then by the suggestion's pick sequence, each with `suggestionText`) and Destination (the chosen asset, `check#Record`, with every candidate and `resultText`) |
| `get#PutawayQueueCounts` | Home's putaway ready and late counts |
| `get#PutawayRuleContext` | RuleList (`find#PutawayRules` with states) and RuleTest (`resolve#Destination` in its own transaction, or `testError`) |
| `get#PutawayChoices` | `categories`, `areas` (of the facility) |
| `Warehouse/Receiving/Putaway.xml` | PutawayQueue (find by facility, source and product; Print putaway sheet), Destination (the explanation, Locations tried, Confirm move: `putawayStock` = `check#Record` asset with `move`, then `putaway#Stock` with the page's token or the handheld bin scan's id); `handheldMount`: the stock scan (`selectScan`), the suggestion, quantity, reason and the bin scan with confirm |
| `Warehouse/Receiving/PutawaySheet.xml` | The queue with suggestions as html-print (`renderMode=html-print&facilityId=`), at most 100 rows |
| `Warehouse/Locations/PutawayRules.xml` | RuleList (New rule, Change and End per row: `storeRule` = `check#Record` facility with `facilityEdit`, then `store#PutawayRule`), RuleTest |
| `Shared/FacilityDetail/Locations.xml` | The location's storage type (New and Edit location; `storageTypes` choice of `get#FacilityChoices`) |
| Receive | The receipt message adds the step-1 putaway explanation |

There is no putaway Today source: putaway has no assignment record (F42); its queue is on Home.

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

## Picking (P11)

**Mantle.** The pick entry points of `mantle.shipment.WarehouseTaskServices` (`service/mantle/shipment/Picking.js`), written on
StockPosting.js's steps; a pick moves no value (stock is issued at pack), so none checks the fiscal period. Lock order: the
shipment, its source line, a container, assets by id, the location. An outgoing shipment's facility is its first route segment's
origin (F55); incoming and drop shipments are never picked here. Spec `test/Warehouse/WarehousePicking.spec.js`.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `pick#ShipmentStock` | ShipmentPick, `SHIPMENT_PICK` | One source line through `pickMove#ShipmentProduct` with its new `shipmentItemSourceId` (only that line), `pickAssetId` (only the scanned asset's reservations) and `pickedMoveList`: the line's reserved stock at the scanned location (and asset; never held stock, HELD_STOCK) locked by asset id before the container's location, moved with its reservation into the pick container (`toContainerId`, else the shipment's `pickContainerId`) when there is one; the entered quantity fields; the answer keeps each move's `fromLocationSeqId` (resultEntityName ShipmentItemSource, resultId the line). Refuses SHIPMENT_NOT_PICKABLE, SOURCE_CANCELLED, QUANTITY_EXCEEDS_REMAINING, NOT_RESERVED_HERE, a closed container location, HELD_STOCK |
| `record#ShortPick` | ShipmentShortPick, `SHIPMENT_PICK` | A `mantle.shipment.ShipmentPickException` (quantity, unit, asset or location, reason ShortPickReason, resolution ShortPickResolution, recount, operation key, reporter) and the recount through Counts' `request#Count` (CntSrcShortPick: the asset, else the location; an open recount answers it), the `WarehouseShortPick` notice to the facility owner's SHIPMENT_LOAD_EDIT holders. On-hand, the reservation and the line are not changed: the exception is what shows a line as Short |
| `reverse#Pick` | ShipmentPickReverse, `SHIPMENT_PICK` | Put back, only when `confirmed` (CONFIRMATION_REQUIRED): the flagged `putBackQuantity` by default, else all picked and not packed, out of the pick container to where each guarded pick took it (or `toLocationSeqId`), each move naming the pick it consumed (`pickKey`); an unpick takes the line's reservation with the stock, a cancelled balance moves none and re-reserves the line's remainder on the stock still in the container (F262); quantity no recorded pick covers is UNTRACKED_PICK when the shipment has a pick container; lowers `quantityPicked`, clears the flag, a picked shipment short again goes back to Scheduled. ALREADY_PACKED (put back from Pack), NOTHING_TO_PUT_BACK, QUANTITY_EXCEEDS_PICKED, LOCATION_REQUIRED |
| `finish#Pick` | ShipmentPickFinish, `SHIPMENT_PICK` (a shipment) or `SHIPMENT_LOAD_EDIT` (a load) | A shipment: OUTSTANDING names what is not picked until `backorderRemaining` (each line lowered to what was picked through `update#ShipmentItem`, its short picks SpresBackorder), NOTHING_PICKED, then ShipPicked. A load: OUTSTANDING names its unpicked shipments until `acknowledged`, then `complete#ShipmentLoadShip` |
| `create#OutgoingShipment` | ShipmentCreate, `SHIPMENT_LOAD_EDIT` | `create#OrderPartShipment` (with a package) from the part's facility; ORDER_HELD, NOT_APPROVED, NOTHING_TO_SHIP |
| `find#PickFaceReplenishment` | read, `STOCK_MOVE`, `SHIPMENT_PICK` or `SHIPMENT_LOAD_EDIT` | ProductFacilityLocation rows of open pick locations with a `minimumStock` whose on-hand stock there (of available status) is below it, each with its bulk sources (available-to-promise stock at open bulk locations, earliest expiry first; a location closing in the future is open) and the suggested quantity (`moveQuantity`, else up to the minimum, at most what bulk holds), split over the sources so each source's `moveQuantity` is at most its own stock (F261); the first reader of these levels (F19) |

`move#Stock` takes an optional `assetReservationId` (a reservation on the asset that moves with the quantity), so a pick-face
move of reserved stock is the move guard (STOCK_MOVE). `cancel#OrderItem` flags `ShipmentItemSource.putBackQuantity` (and
`putBackDate`) when a cancelled balance leaves more picked than the line's quantity (Customer Service's `apply#OrderChange`
takes the same path), and, since the OrderItem update's SECA resets the item's reservations by the store's order, puts the
line's remaining reservation back on the stock picked into a pick container (F262); `reduce#AssetReservation` is unchanged.

The wave (`mantle.work.ShipmentWorkServices`, `service/mantle/work/ShipmentLoads.js`), each checking SHIPMENT_LOAD_EDIT and the
facility's organization, and checking again under its locks what a screen posts back:

| Service | Contract |
| --- | --- |
| `preview#ShipmentLoadsForOrders` | Read only: the order parts given (`orderParts`) or found (`find#ShipmentLoadCandidates`: the existing search over OrderPartFindView, approved or held parts), each evaluated (ORDER_HELD, NOT_APPROVED, OTHER_FACILITY, ON_PICKLIST, NOTHING_TO_SHIP, NOT_PARTLY_SHIPPED, NOT_RESERVED_AT_PICK with the shortfall, in stock units), the eligible in groups of `ordersPerPicklist` with their bins; `previewFingerprint` |
| `create#ShipmentLoadsForOrders` | Unchanged without `operationKey`. With it: ShipmentLoadWave, a retry answering the first; the `groups` posted back (or the preview's) each through `create#ShipmentLoadGroup` as its own operation and transaction (`posting.batch`): its parts locked (order part, then header) and evaluated again, the excluded named, a load with the eligible parts in bin order and the picker; a group none of whose parts is eligible fails (NOTHING_ELIGIBLE) and the others are created. Outs `groupResults`, `excludedParts`, `result` beside the unchanged `picklistsCreated` and `workEffortIdList` |
| `store#ShipmentLoad` | A manual load of a facility (create#ShipmentLoadShip, owned by the facility owner, with a picker), or an open load's name, dates and description (LOAD_CLOSED) |
| `edit#ShipmentLoadMember` | addOrder (evaluated like the wave), addShipment (leaving the load's facility, on no other load), remove (nothing picked: PICK_STARTED) or bin: the bin is on the shipment and on its lines, and a line's bin wins (F18), so a bin change sets the shipment's and every line's that has one |
| `store#ShipmentLoadAssignment` | A person of the facility owner as picker (Worker) or supervisor (Manager), or equipment (a non-stock asset of the facility that has not left, on no other open load: EQUIPMENT_BUSY), or an assignment ended now |

Records (`entity/ShipmentPickEntities.xml`): `ShipmentPickException` with the ShortPickReason and ShortPickResolution enumerations;
`ShipmentItemSource.putBackQuantity`, `putBackDate`; an index on `PostingOperation.resultId` for a line's pick operations. The
topic `WarehouseShortPick` (`data/ShipmentPickSetupData.xml`).

**BOSS.** `ironstone.warehouse.PickingServices` (`Picking.js`, reads only, limited in the query to the user's facilities):
`get#Picklists`, `get#PicklistDetail` (the bin with its source, line or shipment); for the Picking area's groups only, also
through the Handheld mounts (F263): `get#PickContext` (lines in pick-location order
with their reserved locations, short and put back; the desk and handheld Pick and the sheets), `get#PickFaceNeeds` (reservations
outside pick locations, and `find#PickFaceReplenishment` as a probe, flattened to `sourceRows`, one per bulk source), `get#Shipments` (outgoing, drop shipments only under the type
filter), `get#OutboundDetail`, `get#OrderFulfillment` (amounts only with financial read), `get#PickingChoices`, `get#PickingQueue`
(Home); `Today.js`'s `loads` source (the user's loads still open from an earlier day, F42). The transitions are
`template/WarehousePickParts.xml`'s: each `check#Record` (the shipment, load, asset or facility) with its capability, then the
Mantle service with the page's render token or the scan's id.

| Part | Contract |
| --- | --- |
| `Warehouse/Picking.xml` | Picklists (default), PicklistDetail, CreatePicklists, Pick, PickLocationMoves, PickSheet; the area grant of P1 (pick, pick supervisor, move) |
| `Picking/Pick.xml` | PickScan (`pickCurrent`: a scanned product other than the line's is PRODUCT_MISMATCH), ShortPick, PutBack (confirmed), FinishPick, PickLines; mounted at `Handheld/Pick` (location and product scans, the product scan's id the key) |
| `Picking/PickLocationMoves.xml` | BelowMinimum (a row and a Replenish per bulk source), PickFaceNeeds (Move with the reservation), QuickPickMove; mounted at `Handheld/PickFace` |
| `Shared/ShipmentDetail` | The outbound branch (`template/WarehouseShipmentDetail.xml`) beside the receipt branch: `get#OutboundDetail` runs when the shipment is not a receipt |
| `Shared/OrderDetail` | The Warehouse branch (`template/WarehouseOrderDetail.xml`, `get#OrderFulfillment`): holds banner, fulfillment in the line's unit, the shipments at the user's facilities, Create shipment (not for a held order; `check#Record` of the part's facility with loadEdit) |
| `Warehouse.js` | `destinations.load`, the `load` record kind and palette find, the P11 `sharedLinks`; an outgoing shipment's record link opens Shipping/ShipmentDetail; a load's link only for the Picking area's groups |

**For later phases.** P12 packs from Pick's picked lines and puts back packed stock from Pack (`reverse#Pick` refuses a packed
shipment); P13 ships; Customer Service's `apply#OrderChange` cancels a balance through `cancel#OrderItem`, which flags the line
for Put back, and its substitution replaces the line that Pick then picks; P15 picks a transfer's origin leg with the same entry
points (ShpTpTransfer is outgoing at its origin).
## Packing (P12)

**Mantle.** The pack entry points of `mantle.shipment.WarehouseTaskServices` (`service/mantle/shipment/Packing.js`), written on
StockPosting.js's steps; the shipment is Picking.js's `shipmentOf` (an outgoing shipment of a facility of the user's
organizations, F55). A pack issues stock and posts its cost of goods sold, so it checks the fiscal period without locking it
(`posting.period(..., {lock: false})`, as receipts do). Lock order: the shipment, its line, then the assets Mantle's pack locks
by id; reopen locks the order part and header after the shipment. Spec `test/Warehouse/WarehousePacking.spec.js`.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `pack#ShipmentStock` | ShipmentPack, `SHIPMENT_PACK` | PackScan: a line (`shipmentItemSourceId`, Mantle's `pack#ShipmentItemSource`), a product's lines (`productId`, `pack#ShipmentProduct`) or a scan (`scanInput`, resolved in the guard: a product on the shipment, else a kit's component, which packs through `pack#ShipmentAssemblyComponent`) into the given package, else the newest, else a new one. A named or scanned asset is locked and checked first (`Packing.js` `packAsset`, F285): the user's organizations, the shipment's facility (OTHER_FACILITY), available (HELD_STOCK), the line's product (PRODUCT_MISMATCH); without one the reservations Mantle issues by must be available stock of the facility. Refuses SHIPMENT_SHIPPED, PACK_CLOSED (packed: reopen a package), SOURCE_CANCELLED, PACKAGE_UNAVAILABLE, QUANTITY_INVALID, QUANTITY_EXCEEDS_REMAINING, HELD_STOCK (a reservation on quarantined stock), PERIOD_CLOSED, NOT_ON_SHIPMENT (a scan that packed nothing), RECORD_REQUIRED. `result`: `shipmentPackageSeqId`, `quantity`, `issuedQuantity` |
| `pack#ShipmentAssembly` | ShipmentPackAssembly, `SHIPMENT_PACK` | PackAssembly: a component through `pack#ShipmentAssemblyComponent`, which issues it to the shipment's assembly work effort and makes and packs the kit once its components are in (`produce#AvailableAssemblies`); unused components return at complete (`pack#Shipment`). `result.kits` (asset, quantity; `acquireCost` only with `ACCOUNTING_VIEW`) |
| `edit#ShipmentPackage` | ShipmentPackageEdit, `SHIPMENT_PACK` | `action` create (box type, weight, unit), update, weigh (`get#ShipmentPackageWeight`: the box type's weight and the contents' shipping weight), delete (an empty package; PACKAGE_NOT_EMPTY) or move (a product's quantity to another package or a new one); a box type in use and, when the facility names its box types (FacilityBoxType), one of them (BOX_TYPE_UNAVAILABLE); above the box type's `maxWeight` warns (OVER_MAX_WEIGHT); WEIGHT_INVALID, WEIGHT_UNAVAILABLE, QUANTITY_EXCEEDS_PACKED, ACTION_INVALID |
| `complete#Pack` | ShipmentPackComplete, `SHIPMENT_PACK` | CompletePack: NOTHING_PACKED, UNPACKAGED (issued but in no package), EMPTY_PACKAGE, WEIGHT_REQUIRED, PUT_BACK_FIRST (picked and not packed), OUTSTANDING until `acknowledged` (pack#Shipment lowers each line to what was packed); then Mantle's `complete#ShipmentPack` with `getLabels` and `getReturnLabels` false (F17): ShipPacked, and its SECA makes the sales invoice (in process until ship under D3's `salesInvoiceFinalizedAtShip`). `complete#ShipmentPack` packs in its own transaction, so the checks hold no lock across it (F276). `result`: `packageCount`, `invoices` (id and status only), `labelsRequested` false, `reduced` |
| `reopen#ShipmentPackage` | ShipmentPackReopen, `SHIPMENT_PACK` | ReopenPackage, once `confirmed` with a `reason`: a package's contents (or `productId` and `quantity` of one, or what it holds of a named `assetId`) back off a shipment that has not shipped; a product packed from several assets needs the asset named (ASSET_REQUIRED, F287). Locks: the shipment, the order parts, the headers, the invoices, then the lines and assets (F294). A final invoice keeps it closed (INVOICE_FINALIZED); an in-process one is released first through Accounting's `release#ShipmentInvoiceLines` (the release of `release#ShipmentDraftInvoice` without its RECEIVABLE_EDIT check, F275: the shipment's lines and billing links leave the invoice, which is cancelled when empty, and packing again bills again). Then a packed shipment goes back to Picked, its completed order parts back to Approved (F281; Mantle's OrderApproved rules run again: the notice, the store's approval email, subscriptions, F290), and `unpack#ShipmentItemIssuance` (with its new `quantity`) cancels each issued quantity, newest first, restoring the reservation on the same asset (never a reset); the package's content is lowered. The stock stays where it was packed, for another pack or Pick's Put back (a line the order then reduces is flagged by `cancel#OrderItem` and put back by `reverse#Pick`) |

**Kit cost** (F41): `PartyAcctgPreference.kitCostFromComponents` (`entity/ShipmentPackEntities.xml`, off by default; the
organization's own preference or the one it rolls up to) is read inside `mantle.work.ManufacturingServices.produce#AvailableAssemblies`
for every caller. `service/mantle/work/KitCost.js` `receiptLines` values the kits made now at the next slice of each component's
issuances to the work effort, in issue order, at each issuance's asset's acquireCost (skipping what earlier kit receipts used),
so the receipts add up to exactly what the issuances posted; the unit cost is that ÷ kits at four decimals rounded down, the last
kit apart at the remainder's cost (P6's rule, F166; F292). A later pack adds to the kit asset of the same cost, else receives its
own. The kits are packed into the packer's package (`produce#AvailableAssemblies`' new `shipmentPackageSeqId`, F286). A component
with no cost leaves the kit with none, as before. Flag off: unchanged (AtrNoAcquireCost).

**Box types** (`mantle.shipment.PackagingServices`, `FACILITY_EDIT`): `store#ShipmentBoxType` (description, dimensions and
unit, empty weight, `maxWeight`, retire by `thruDate`; a used type is never deleted), `store#CarrierShipmentBoxType` (a carrier's
package code; CARRIER_INVALID), `store#FacilityBoxType` (the facility's box types, facility in the user's scope). Box types are
shared by every organization (Mantle gives them no owner), so a change to a type another organization's facility or packages use
needs every organization's scope (BOX_TYPE_SHARED, F289).

Mantle fixes this phase needed: `unpack#ShipmentItemIssuance` takes a `quantity`; `cancel#OrderItem` leaves a reduced line's
handled quantity handled (it set `quantityNotHandled` to 0, F277); `issue#AnyAssetForShipmentItemSource` takes
`componentProductId`, which `pack#ShipmentAssemblyComponent` passes, and issues a work effort's component through
`issue#AssetToWorkEffort`, so a kit's component without a reservation is issued (it looked for the kit product's own stock and
called `issue#Asset`, which needs a shipment, F282).

**BOSS.** `ironstone.warehouse.PackingServices` (`Packing.js`, reads only, limited to the user's facilities): `get#PackContext`
(for the pack capability only, F291: the shipment's lines with picked, packed, left; its packages with box, weight and contents; the pick assemblies' components;
the facility's box options; the invoices' status; `canPack`, `canReopen`; without a shipment, the shipments to pack),
`get#BoxTypes`, `get#FacilityBoxTypes`, `get#PackingSlip`, `get#MaterialSource` and `get#MaterialAction` (MaterialIssueReceipt's
sources by `sourceType` and `sourceId`, each an entry of `Packing.js` `sources` with its read and its line action:
`shipmentAssembly` now, the production work effort with P16; values only with financial read) and
`get#PackingQueue` (Home). The transitions are `template/WarehousePackParts.xml`'s: `check#Record` of the shipment with `pack`,
then the entry point with the page's render token or the scan's id.

| Part | Contract |
| --- | --- |
| `Warehouse/Shipping/Pack.xml` | PackScan (into the active package), the lines with Pack per line, PackAssembly (kit components), PackageEditor (Add package, Edit, Weigh, Remove, Reopen), PackageContents (Move), CompletePack (primary); More: the packing slip, contents, inserts, the shipment, the kit's MaterialIssueReceipt, Put back in Pick. Mounted at `Handheld/Pack` (the shipment scan, the product scan with its id as the key) |
| `Warehouse/Shipping/PackingSlip.xml` | html-print: `document` slip (lines: ordered, shipped, to follow), contents (per package) or inserts (one per package, "package n of m") |
| `Warehouse/Locations/BoxTypes.xml` | BoxTypeList (New box type, Edit, Retire or Use again), CarrierBoxCodes (Add carrier code, Remove), the writes for facilityEdit; a link to the facility's Box types tab |
| `Shared/FacilityDetail/BoxTypes.xml` | The facility's box types (menu index 5): Add box type, Remove, for the facility admin |
| `Shared/MaterialIssueReceipt.xml` | The Warehouse context (crosscut §3.9), `sourceType` and `sourceId`: the header, links, lines and words from the source's entry, a line's posting through `materialAction` (`get#MaterialAction`, `check#Record`, the entry point it names); the shipment assembly source's components (needed, packed, left; Pack component), issues and kit receipts (value with financial read); other apps "not available" |
| `Shared/ShipmentDetail` | The outbound branch's header gains Pack and Packing slip; its Packages box shows box, weight and contents |
| Home, Handheld Home | The packing queue (picked to pack, scheduled, late); Handheld Home's Pack task and "Pack it" on a scanned shipment |

**For later phases.** P13 ships from a packed shipment (Ship buys labels; Complete pack never does) and finalizes the in-process
invoice at ship (D3's SECA); a change after ship is a return or credit memo. Customer Service's order change on a packed line
reopens the package first (`reopen#ShipmentPackage`), then reduces the line through `cancel#OrderItem`, which flags it for Pick's
Put back. P16 adds MaterialIssueReceipt's work effort source as one entry of `Packing.js` `sources` (its read and its line
action), with no change to the screen. Unused-component returns and kit
breakdowns cancel the oldest issuances first, so with one component issued at different costs a return can leave a WIP
difference (F283, §7).

## Shipping, labels and printers (P13)

**Mantle** (mr-mantle `service/mantle/shipment/Shipping.js`, `entity/ShippingGatewayEntities.xml`; spec
`test/Warehouse/WarehouseShipping.spec.js`). The shipment is an outgoing shipment of a facility of the user's organizations (its first route
segment's origin, F55). **A gateway is never called inside a transaction that could roll back after it**: each request to a
gateway (a label, a return label, a refund, a tracking refresh) is a `mantle.shipment.carrier.ShippingGatewayRequest`
(SgrLabel, SgrReturnLabel, SgrRefund, SgrTrack; Requested, No answer, Succeeded, Failed) recorded and committed first, in a
transaction that holds the shipment's lock and makes every check (`record#ShippingGatewayRequests`); then each package is sent
with no transaction of ours open, its gateway work in a transaction of its own (`CarrierServices.request#ShipmentLabels` with the
request id as `requestReference`). The gateway is worked out in the recording transaction from the segment as just written
(`gatewayFor`: Mantle's lookup order in code, writing nothing), recorded on the request, and its own services are called directly,
so the lookup after a timeout asks the gateway that sent; it must serve the segment's carrier (GATEWAY_NOT_FOR_CARRIER), and a
test-mode gateway buys only for an organization whose `ShippingTestGatewayAllowed` party setting is Y (TEST_GATEWAY). Before its
call each row is claimed (`claim#ShippingGatewayRequest`: locked, Requested at the planned attempt, not yet sent; `sentDate`
stamped), so a parallel retry never sends it too. A coded refusal (LABEL_REFUSED, ADDRESS_INVALID, WEIGHT_REQUIRED, ...) is Failed; a timeout or
an error with no answer is Unknown, and the next request for the package asks the gateway first (`find#ShippingLabels`) and buys
nothing when the label is there (a label reported but not given stays Unknown, FOUND_NOT_FILLED); a gateway with no lookup is sent
again only when a person says so (`sendAgain`; SEND_AGAIN_REQUIRED, Ship's Send again). A row recorded or sent within two minutes is
a call under way (REQUEST_IN_PROGRESS). The
operation (CX-POSTING) is stored only when every package has an answer (`finish#ShippingGatewayRequests`), so a retry under the
same key asks again.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `get#ShipmentRates` | read; `SHIPMENT_SHIP`, `SHIPPING_CARRIER_EDIT` or `FACILITY_EDIT` | Each gateway that serves the shipment (the one given; else the store's per carrier, the segment's, the shipper's default; Mantle's `get#ShipmentGatewayDetails`) through its `get#ShippingRatesBulk` (packages' weights, both addresses), else `get#ShippingRate` per method; the methods with no gateway through the local-rules adapter over `get#OrderShippingRateLocal` and the shipment's order part. `rateRows` (rateSource gateway or local, carrier, method, total, currency, days, canLabel, chosen), `providerErrors` named, the others go on |
| `request#PackageLabels` | ShipmentLabelRequest, `SHIPMENT_SHIP` | A packed shipment's labels (or one package's; `returnLabels` Y the return labels), the carrier and method chosen first when given (METHOD_INVALID). `result.packages` each done, skipped (LABEL_EXISTS), failed or unknown, with the tracking code and `recovered` when found after a timeout; `resultCode` LABELED, PARTIAL, FAILED, PENDING. SHIPMENT_NOT_PACKED, SHIPMENT_SHIPPED, NO_GATEWAY (record it by hand), WEIGHT_REQUIRED, PACKAGE_UNAVAILABLE. A refunded label is replaced |
| `refund#PackageLabels` | ShipmentLabelRefund, `SHIPMENT_SHIP` | The labels voided on the same path, before the shipment ships (SHIPMENT_SHIPPED: a shipped label was used); the shipment's status, packages, issued stock and invoices stay (a refund reverses no shipment). NO_LABEL, ALREADY_REFUNDED per package; NOTHING_TO_REFUND when none had a label |
| `track#PackageLabels` | `SHIPMENT_SHIP`, no key | Each shipment through its gateway's track service, each its own request row and transaction; NO_GATEWAY and RECORD_UNAVAILABLE named. Tracking never ships or reships; Mantle's ShipmentPackageDeliveredCheckShipment delivers what the carrier reports delivered |
| `record#ManualTracking` | ShipmentManualTracking, `SHIPMENT_SHIP` | For a method no gateway labels (GATEWAY_LABELS otherwise), with no gateway's label on a package (LABEL_EXISTS: refund it first; a label request changing the carrier is refused alike): the tracking code on the packages and the segment's `actualCost` (currency: the segment's, the shipment's, else the owner's base currency) through `update#ShipmentPackageAndRouteSeg` |
| `record#PackageDelivery` | ShipmentPackageDelivery, `SHIPMENT_SHIP` | A shipped package delivered by hand: ShTsDelivered with the date, `deliveryRecipientName`, `deliveryNote` and who recorded it, so Mantle delivers the shipment once every package is. EVIDENCE_REQUIRED, DATE_INVALID, NOT_SHIPPED, ALREADY_DELIVERED |
| `ship#OutgoingShipment`, `get#ShipReadiness` | ShipmentShip, `SHIPMENT_SHIP` | ShipConfirm through `ShipmentServices.ship#Shipment` after the blockers, each named: TRACKING_REQUIRED (a label not refunded or a code by hand on every package; none for ShMthPickUp), PACKAGE_TOTALS, EMPTY_PACKAGE, NO_PACKAGES, INSPECTION_HOLD (issued stock quarantined or held by an open inspection, or an open inspection of the shipment), ASSET_EXPIRED (P5b's gate, `check#AssetExpiryGate`); the period checked without locking (D3's ShipShipped SECA finalizes the invoice). SHIPPED_ELSEWHERE for a transfer or supplier return |
| `request#ReturnLabel` (P14) | ReturnLabelRequest | Now on the same path (F331): `record#ReturnLabelRequest` commits the package, segment and request, then the carrier is called; LABEL_REQUESTED, LABEL_PENDING (not stored, a retry asks), LABEL_FAILED, LABEL_EXISTS, LABEL_NOT_CONFIGURED; takes the package's `weight` and `weightUomId` |

**The Mantle test carrier** `mantle.shipment.carrier.TestGatewayServices` (`TestCarrier.js`; install data `TestCarrierData.xml`:
only the ShippingGatewayConfig `TEST_SHIPPING` in test mode; demo data `TestCarrierDemoData.xml`: the carrier `TEST_CARRIER` with
Ground, Second Day and Next Day and its binding to the gateway; its own `TestCarrierLabel` record) implements every carrier interface: rates by weight (rounded up to the pound) and a zone table (the
zone from the two postal codes' first digits), a 4×6 PDF label with the tracking number as Code 128 (the framework's
`barcodeSvg`, drawn into a hand-built PDF, so it needs no Chromium), refund, tracking (in transit with an estimate) and address
validation. Postal code 99901 issues the label and then times out (the label exists when asked), 99902 refuses the label, 99903
is an invalid address (validation sets CmtlInvalid). New interface pieces, compatible with existing gateways:
`CarrierServices.find#ShippingLabels` (ShippingGatewayConfig `findLabelServiceName`), `requestReference` on the label and refund
interfaces, the outputs of `get#ShippingRate`, `ShippingGatewayConfig.testMode`.

**Printing** (`mantle.facility.PrintServices`, `Printing.js`): `dispatch#Document` sends a shipment's label PDFs (or a screen
through `print#ScreenDocument`) to the printer the facility binds for the purpose (FacilityPrinter in effect, with its copies),
each print in its own transaction, never undoing what was posted; a shipment's labels are its first segment's, refunded ones
skipped, each printed in turn with its own result (`results`: a failure is named and the others still print); it answers
`printed`, or the reason (PRINTER_NOT_BOUND,
PRINTING_UNAVAILABLE when this build has no print client, PRINT_FAILED, NO_LABEL) with the kept print job for a reprint
(`printJobId`: `send#PrintJob`). `get#PrinterCapabilities` (PDF yes, ZPL no; the last job's availability), `store#FacilityPrinter`
(`FACILITY_EDIT`; copies 1 to 20, `fromDate`, `thruDate`, `endNow`). FacilityPrinter gains `copies`, `fromDate`, `thruDate`
(not in its key: one binding per purpose and facility), and the purposes PtpLotLabel, PtpLocationLabel, PtpCountDocuments.
Carrier setup: `mantle.shipment.carrier.CarrierSetupServices.store#CarrierShipmentMethod` and `store#ShippingGatewayCarrier`
(`SHIPPING_CARRIER_EDIT`, ShippingSetupData.xml). View `mantle.shipment.ShipmentPackageTracking` (a package's route segment with
its shipment and segment).

**BOSS.** `ironstone.warehouse.ShippingServices` (`Shipping.js`, reads only, limited in the query to the user's facilities):
`get#ShipContext` (the ship capability only), `get#LabelDocument`, `get#Tracking` (paged, filtered in the query), `get#CarrierSetup`
(an account masked to its last four characters, a credential only "set" or "not set"), `get#PrinterIndex`, `get#FacilityPrinters`, `get#LabelSheet`,
`get#Manifest`, `get#ShippingQueue` (Home), `get#InvoiceEvidence` (amounts only with financial read). The transitions are
`template/WarehouseShipParts.xml`'s: `check#Record` with the capability, then the Mantle service with the page's render token.

| Part | Contract |
| --- | --- |
| `Warehouse/Shipping/Ship.xml` | ShipmentAddress (Check address: only the shipment's origin or destination, through its own gateway), RateOptions (Buy labels per gateway rate), Labels (Buy labels, Return labels, Print labels, View PDF streamed with nothing written, Reprint after a failed print, Send again after an unanswered request to a gateway that cannot be asked, Refund before ship), ManualCarrier (Record tracking, for a method with no gateway), ShipConfirm (primary; the blockers named) |
| `Warehouse/Shipping/PackageTracking.xml` | TrackingFind (in transit, exceptions, every one; carrier, code, shipment), TrackingList (Refresh tracking on the selected rows, Record delivery), today's manifest |
| `Warehouse/Shipping/LabelSheet.xml`, `Manifest.xml` | html-print: location, lot, serial, container and box labels (Code 128 of what the scan resolver reads), from FacilityDetail's Locations tab, Lots, AssetDetail, Containers and BoxTypes; the carrier manifest of a facility's day |
| `Warehouse/Locations/Carriers.xml` | CarrierMethods (Add, Edit, Remove), shipping gateways (actions, test or live, carriers, credentials masked), carrier bindings (Bind, Remove), CarrierTest (a packed shipment's rates from one gateway) |
| `Warehouse/Locations/Printers.xml`, `PrinterTestPage.xml` | PrinterIndex across the user's facilities, PrinterTest (a marked sample page) |
| `Shared/FacilityDetail/Printers.xml` | The facility's bindings (menu index 6): Bind printer, End, Print a test page |
| `Shared/InvoiceDetail` | The Warehouse branch (`template/WarehouseInvoiceDetail.xml`) at `Warehouse/Orders/InvoiceDetail`: header, posting state, lines with their shipments and shipped quantities, shipments; amounts with financial read; Print |
| `Shared/ShipmentDetail` | The outbound header gains Ship (packed) and Tracking (shipped) |
| Home | The shipping queue: packed to ship, shipped in transit, packed and late |

**For later phases.** P18 checks the outbound flow end to end; Customer Service's Issue return label calls `request#ReturnLabel`; a
real carrier is a gateway implementing the interfaces (with `find#ShippingLabels` and the request reference so a timeout is
recovered); ZPL with FacilityPrinter's format is §7; packages for transfers (§5) can use the same label path.

## Inspection (P8)

Crosscut CX-QUALITY (design-crosscut §3.19, design-warehouse WH-QUALITY), built in Mantle for every app; Warehouse's context
on the two shared screens.

**The records** (mr-mantle `entity/QualityEntities.xml`, package `mantle.product.quality`; seed `data/QualityData.xml`):
`InspectionTemplate` (organization, context, product, category and facility applicability, sample policy, state QtDraft,
QtPublished, QtRetired), `InspectionTemplateItem` (effective-dated characteristics: a draft item has no `fromDate`;
publishing stamps it; a change to a published item ends it and starts a new row with the same `characteristicId` and its
`previousItemId`; key fields audit-logged), `QualityInspection` (source receipt, return, shipment, run or stock; product,
lot and held asset; quantity, `heldQuantity`, `disposedQuantity`, sample; template and `templateAsOfDate`, the inspection's
creation, as of which it reads its items; inspector, due date, pegged `demandOrderId`; result QirAccepted, QirPartial or
QirRejected with accepted and rejected quantities; submitted and verified by; statuses QiDraft, QiSubmitted, QiVerified,
QiDisposed, QiCancelled), `InspectionReading` (item, sample, value, pass, audit-logged), `QualityInspectionDisposition` (a
posting of its own: the decision, quantity, source and result asset, location, status after, the reservation Release made,
the scrap's PhysicalInventory; `assetStatusId` the stock's status after it) and `QualityInspectionContent` (files; a record host in `get#RecordLinkInfo`, visible under an
organization filter by the inspection's organization or facility owner). The disposition vocabulary (InspectionDisposition):
QdRelease, QdQuarantine, QdRework, QdReturnCustomer, QdReturnSupplier, QdScrap, QdUseAsIs. The tracking policy has
`inspectionRequired` (WarehousePolicy, extended here). Topic `QualityInspectionDecision`.

**Mantle** `mantle.product.QualityServices` (`Quality.js`):

| Service | Permission | What it does |
| --- | --- | --- |
| `store#InspectionTemplate` | QUALITY_TEMPLATE_EDIT | A draft or a change: the header when `templateName` is given, `itemList` changes, `action` publish or retire; a published template's change needs `changeReason` (REASON_REQUIRED); TEMPLATE_RETIRED, NO_ITEMS, ITEM_INVALID, ITEM_ENDED, LIMITS_INVALID, SAMPLE_INVALID |
| `get#InspectionTemplate`, `find#InspectionTemplates` | organization scope | Items as of `asOfDate`, draft items, revision rows and the header's audit log; the list a page at a time |
| `create#Inspection` | QUALITY_INSPECT | From an asset, a receipt (its own asset, VALUE_INVALID; one open inspection per receipt and per asset, INSPECTION_EXISTS), a disposed inspection whose stock is still held (`reinspectQualityInspectionId`: its receipt and held asset, the held quantity moved to the new one, `previousInspectionId`; NOT_HELD) or a facility and product; the demand peg the facility owner's sale of the product in the user's scope (DEMAND_INVALID); the template given (published, the facility owner's) or the one that applies (product, category, any; facility first; the context's); the sample by the policy; held when the asset is quarantined; a run's `OrderItemWorkEffort` as the demand |
| `assign#Inspection` | QUALITY_INSPECT, VERIFY or DISPOSE | Inspector (INSPECTOR_INVALID: a person of the organization who inspects), due date, and while a draft without readings the template; never the status |
| `save#InspectionReading` | QUALITY_INSPECT | A draft's reading of an item in effect at its creation, sample 1 to the sample size; pass computed from the limits |
| `submit#Inspection` | QUALITY_INSPECT | Mandatory items read (READINGS_REQUIRED), accepted plus rejected the quantity (QUANTITY_MISMATCH), a reason for a rejection; notifies the organization's QUALITY_VERIFY holders |
| `cancel#Inspection` | QUALITY_INSPECT or VERIFY | A draft or submitted inspection, with the reason (QiCancelled); the stock stays where it is |
| `verify#Inspection` | QUALITY_VERIFY | Verified, or returned to Draft with the reason; never by the submitter (SELF_VERIFY); notifies the inspector |
| `dispose#Inspection` | QUALITY_DISPOSE | The posting guard (begin, the inspection then its asset then the location locked, settled, complete): Release takes the accepted quantity, the others the rejected (QUANTITY_EXCEEDS_RESULT); VERIFICATION_REQUIRED. Release (and Use as is) splits the quantity off in place, reserves the pegged demand on it (checked again; the item's not-available reservation quantity reduced, then `reserve#AssetForOrderItem` with the asset, its other reservations kept), then `update#Asset` AstAvailable (the SECA gives the rest to waiting reservations), then moves it when a destination is given (LOCATION_INVALID for a held type); Scrap sets AstMorgue (a morgue destination: LOCATION_NOT_MORGUE) and calls `scrap#Asset` with `qualityInspectionId`; the others keep it quarantined (LOCATION_NOT_QUARANTINE). Each writes its disposition, lowers `heldQuantity` (Release, Use as is, Scrap), queues `InvoiceMatchServices.queue#MatchReevaluation` and notifies the inspector; Disposed when nothing is left |
| `get#Inspection`, `find#Inspections` | organization scope, `facilityIds` | The header, items as of the creation with their readings, readings, dispositions, what is left, history, capabilities; the list by status (or open), product, lot, inspector, source, shipment, receipt, due |
| `get#SourceInspectionStatus` | internal | Per receipt of a receipt, order line or shipment: accepted, dock rejected, held (its inspections' `heldQuantity`; a receipt with no inspection whose stock is quarantined is held whole), match-eligible (accepted less held), inspection-rejected (Scrap, Return to supplier); match-eligible is accepted less held less inspection-rejected; and totals. Accounting's `InvoiceMatch.js` `receiptsOf` reads it (F31; `inspectionCheck` is now `available`) |
| `create#InspectionContent` | any QUALITY_* | An inspection's file |

The receipt: `receive#ShipmentStock` (Receiving.js `plan`) treats a receipt as step 3 when the operation policy's step is 3, the
tracking policy's `inspectionRequired` is Y or a published receipt template applies (`Quality.js` `receiptNeedsInspection`),
so the accepted stock posts as AstQuarantine into the quarantine location, and creates an inspection of each accepted receipt
in the same operation (`receiptInspections`, the receipt's STOCK_RECEIVE check); the answer's `qualityInspectionIds`.
`receive#AdHocStock` is unchanged. `scrap#Asset` admits QUALITY_DISPOSE with `qualityInspectionId` for the result asset of
that inspection's scrap disposition only (F163).

**BOSS.** `ironstone.warehouse.InspectionServices` (`Inspections.js`, reads only): `get#InspectionList` (the Inspection area's
groups; open by default), `get#ReceiptInspections` (ReceiptDetail's Inspection part, every Warehouse user),
`get#InspectionDetail` (check#Record `inspection`, every Warehouse user; actions by capability), `get#TemplateList`,
`get#TemplateDetail`, `get#InspectionChoices` (inspectors, templates, products, categories, locations, statuses,
templateStatuses, dispositions, contexts, sourceTypes, samplePolicies, readingTypes, scrapReasons), `get#InspectionWork`
(Home's queue and Your work). The transitions are `template/WarehouseInspectionParts.xml`: `assignInspection`,
`moveInspection` (a board card to another inspector assigns it; to another status it goes back), `reassignInspections` (each
named), `saveReading`, `submitInspection` (inspect), `verifyInspection` (qualityVerify), `disposeInspection` (qualityDispose,
the page's key), `storeTemplate`.

| Part | Contract |
| --- | --- |
| `Warehouse/Inspection.xml` | Inspections (default), InspectionTemplates (`Shared/InspectionTemplates`), TemplatePrint; the area's grant `BOSS_WH_INSPECTION` |
| `Warehouse/QualityInspection` | `Shared/QualityInspection` at the root, hidden from the menu: the root's grant opens it to every Warehouse user (role app). The browser loads each level of a path as its own request, so a subscreen under the denied Inspection area cannot be opened by a grant of its own (F195) |
| `Shared/QualityInspection.xml` | Record header (Submit result, Verify, Dispose or Inspect again by status; Assign, Cancel inspection and Print certificate in More), panes Header, Readings (Record reading per characteristic), Result, Disposition, History, Evidence (record files), Conversation |
| `Shared/InspectionTemplates.xml` | Templates (list, New template) and the chosen template's Characteristics (Add, Change, End), Sampling and applicability, Revision history; Publish, Edit template, As of a date, Print, Retire |
| `Warehouse/InspectionCertificate.xml`, `Inspection/TemplatePrint.xml` | The inspection evidence and disposition certificate; a template as of a date (html-print) |
| Shell | Notification topic `QualityInspectionDecision` (link to QualityInspection), the Today source's inspections (Today.js: the drafts whose inspector the user is), the palette (`search#Records` kind `inspection`), record links (`get#RecordLink` for QualityInspection) |
| Home | The inspection queue (ready drafts, waiting submitted or verified, late past due) and the assigned inspections in Your work |
| ReceiptDetail | The receipt's inspections |

**For later phases.** P9's putaway moves released stock out of quarantine (a released asset is AstAvailable where it was
inspected); P14 calls `create#Inspection` for return receipts (source `QisReturn`) and ships Return to supplier stock, then
lowers its `heldQuantity`; P16 sets the demand peg through the run (`OrderItemWorkEffort`); Purchasing and Customer Service add
their contexts to the two shared screens; planning reads `get#SourceInspectionStatus`.

## Returns (P14)

Customer and supplier returns in the warehouse (design-warehouse §11, WH-RETURN; crosscut §3.8, §3.18). Customer Service
authorizes (RETURN_AUTHORIZE, which no Warehouse group holds), Warehouse receives, inspects, sends back and ships, Accounting
settles (`settle#Return`); Warehouse never settles. The organization must settle returns separately
(`PartyAcctgPreference.returnSettlementRequired`, D11): approval then only creates the return shipment, and Mantle's
`receive#ReturnItems` refuses otherwise (RETURN_SETTLEMENT_OFF), and ReturnDetail and ReturnReceipt read
`get#ReturnSettlementMode` and say why there is no Receive (impl-warehouse §5 asks about that path). The demo RMA is of the
Ziziwork Returns Center (`BOSS_WH_RETURNS`, a child of ORG_ZIZI_RETAIL so Retail's warehouse users work it, its own preference
with D11 on through `store#Preferences`); Retail itself, whose returns Mantle's own flows test, keeps D11 off (F326).

**Mantle** (mr-mantle `service/mantle/shipment/ReturnStock.js`; spec `test/Warehouse/WarehouseReturns.spec.js`):

| Contract | Permission | What it does |
| --- | --- | --- |
| `WarehouseTaskServices.receive#ReturnItems` with `operationKey` | STOCK_RECEIVE | The Warehouse return receipt on the posting guard (ReturnReceive): the shipment locked, a customer return still open (RETURN_SHIPMENT_REQUIRED, RECEIPT_CLOSED), its facility the user's (RECORD_UNAVAILABLE), then each return and item locked; the tracking policy's lot and serial rules (Receiving.js `tracking`: LOT_REQUIRED, SERIAL_COUNT_MISMATCH, SERIAL_DUPLICATE), a rejection's reason (REASON_REQUIRED); the accepted stock to a quarantine location (the receiver's, LOCATION_NOT_QUARANTINE for another type; the operation policy's; else the facility's first open one; LOCATION_REQUIRED), locked last; the non-locking period check; Accounting's receipt (ReturnSettlement.js `receive`, now passing `locationSeqId`, `serialNumber`, `expirationDate`) as AstQuarantine, a serialized line a unit at a time; an inspection of each accepted receipt (Quality.js `receiptInspections`: source QisReturn, context QicReturn, the return template that applies). `result`: locationSeqId, statusId, quantities, receivedItems, assetReceiptIds, qualityInspectionIds, shipmentDelivered. Without the key it is Accounting's receipt, unchanged (AstOnHold, no location) |
| `ReturnServices.find#ReturnableReceipts` | PURCHASE_ORDER_EDIT, QUALITY_DISPOSE or STOCK_ISSUE | Purchasing's eligibility (PUR-RETURN): purchase receipts of the user's organizations (the order part's buyer) by supplier, order, product or receipt (FILTER_REQUIRED), narrowed by lot or facility, all query conditions of `ReturnableReceiptView`, read a page at a time until 200 receipts with something to return (at most 5000, `receiptRowsTruncated`): accepted (available and quarantined alike) less earlier supplier returns linked to the receipt (`receiptEligibleQuantity`), capped at on hand (`eligibleQuantity`), and the assets that hold its stock now (its own and its inspections' disposition results, with what a Return to supplier disposition holds) |
| `ReturnServices.add#ReceiptToReturn` | PURCHASE_ORDER_EDIT or QUALITY_DISPOSE | A supplier return's item for part of a receipt, the return then the receipt then its lot locked and the eligibility counted again (QUANTITY_EXCEEDS_ELIGIBLE), the receipt's supplier and organization the return's (SUPPLIER_MISMATCH), the asset one holding the receipt's stock (VALUE_INVALID; default a Return to supplier disposition's), `ReturnItem.assetReceiptId` and `assetId` (F32) |
| `WarehouseTaskServices.issue#SupplierReturnStock` | QUALITY_DISPOSE or STOCK_ISSUE (held stock, quarantined or on hold, QUALITY_DISPOSE) | SupplierReturnIssue: the ShpTpPurchaseReturn shipment (SHIPMENT_CLOSED once packed), the item's source and the item (RETURN_NOT_APPROVED), the asset the item names (or another holding its receipt's stock) locked; issued through `AssetServices.issue#AnyAssetForShipmentItemSource` with its new `assetId` (that asset only, any status, reservations displaced), packed into the package (`add#ItemToPackage`); quarantined stock an inspection holds goes only as far as its Return to supplier dispositions cover (RETURN_NOT_DISPOSED), whose `returnedQuantity` rises while the inspection's `heldQuantity` falls, and the receipt's matches are queued. The expiry gate is off on a purchase return (F424) |
| `WarehouseTaskServices.ship#SupplierReturn` | SHIPMENT_SHIP | SupplierReturnShip: every source issued (OUTSTANDING names what is not), `pack#Shipment` and `ship#Shipment`, the tracking code on its packages; each item whose authorized quantity was issued to ReturnShipped and the return once all are (`checkUpdate#ReturnHeaderStatus`) |
| `WarehouseTaskServices.request#ReturnLabel` | SHIPMENT_SHIP or RETURN_AUTHORIZE | Customer Service's Issue return label: an approved customer return's open return shipment gets a package and its route segment; the label through `CarrierServices.request#ShipmentLabels` when a shipping gateway applies (LABEL_REQUESTED), else LABEL_NOT_CONFIGURED; a label already there LABEL_EXISTS; the operation key is the request's identity. P13's provider-request records take over the carrier call |
| `ReturnServices.create#ReturnContent`, `save#ReturnContentFile` | a return permission and the return's party in scope (`save#` internal) | `mantle.order.return.ReturnContent`, a return's files, registered in `get#RecordLinkInfo` (follows its return) |

Records (`entity/ReturnStockEntities.xml`): `ReturnItem.assetReceiptId`, `assetId`; `QualityInspectionDisposition.returnedQuantity`;
`ReturnContent` with the ReturnContentType enumeration. Permission RETURN_AUTHORIZE (MantleSetupData).

The return lot is the lot the item's order line was issued from, else one the product's stock was in (a given lot must hold
the product), and the receipt names it. The match base (`get#SourceInspectionStatus`, InvoiceMatch.js) is accepted less held less
`inspectionRemovedQuantity` (scrap and what Return to supplier sent back; the rest is still held, F325). `request#ReturnLabel` calls
the carrier inside its transaction; P13's provider-request records must commit first and ask before a retry (F331).

**The return's hold** (the P9 open question, §4): a return received through ReturnReceipt is quarantined with its inspection, and
the inspection's disposition releases it (Release to AstAvailable, Scrap, Return to customer); there is no putaway release of a
return. Stock received on hold outside the guard (Accounting's receipt, AstOnHold with no location) stays on hold until an
inspection of the asset (`create#Inspection` from the asset) is disposed.

**BOSS.** `ironstone.warehouse.ReturnServices` (`Returns.js`, reads only, limited in the query to the user's facilities, or for a
return with none to their organizations): `get#Returns` (direction, status, party, text; separate progress), `get#ReturnDetail`
(items, shipments, inspections, eligible items as probes of `find#ReturnableOrderItems` or `find#ReturnableReceipts`; amounts only
with financial read), `get#ReturnShipmentDetail` (a return's shipment; any other answers `returnShipmentFound` false),
`get#ReturnChoices`, `get#ReturnQueue` (Home). The transitions are `template/WarehouseReturnParts.xml`'s, each refusing another app root, then `check#Record` with
its capability, then the Mantle service.

| Part | Contract |
| --- | --- |
| `Warehouse/Returns.xml` | Returns (default), ReturnDetail (`Shared/ReturnDetail`), ReturnReceipt and SupplierReturnShipment (`Shared/ShipmentDetail` twice), ReturnSlip |
| `Returns/Returns.xml` | ReturnFind (header dialog) and ReturnList; New return (`newReturn`): a customer return from a sales order part (`create#ReturnFromOrder`, receive) or a supplier return from a facility (`create#Return`, its owner the customer, qualityDispose) |
| `Shared/ReturnDetail` | The Warehouse branch (`template/WarehouseReturnDetail.xml` WarehouseReturn): header (Receive or Send back, Submit for authorization `request#Return`, Create return shipment `create#ReturnShipment`), Eligible items with Add (`addReturnItem`: `add#OrderItemToReturn` or `add#ReceiptToReturn`), Items, Shipments and receipts, Inspection and disposition, Settlement (read only), Files (ReturnContent) and Conversation |
| `Shared/ShipmentDetail` | The return branch (WarehouseReturnShipment), tried after the transfer branch (P15) and before the receipt and outbound ones: Return items with Receive per item (`receiveReturn`: the box, lot, serials, quarantine location; none, with the reason, when D11 is off) or Send back (`issueSupplierReturn`; the facility's stock to choose for an item naming none), Ship (`shipSupplierReturn`, tracking code), Receipts or Pick and pack, Inspection and disposition, Tracking, Files, Conversation |
| `Returns/ReturnSlip.xml` | The RMA receiving slip and the supplier-return slip (html-print) |
| `Warehouse.js` | `destinations.return`; a customer return's shipment links to ReturnReceipt, a supplier return's to SupplierReturnShipment; the Returns `sharedLinks` |
| Home | The returns queue (ready: approved; waiting: created or requested) |

**For later phases.** Customer Service builds `authorize#Return` (RETURN_AUTHORIZE) and its Issue return label over
`request#ReturnLabel`; P13 replaces the label's carrier call with its provider-request records and adds return labels to Ship;
Purchasing's NewSupplierReturn calls `find#ReturnableReceipts` and `add#ReceiptToReturn`; a partial supplier return shipment
(`ship#SupplierReturn` of what is issued) and a return's putaway after release are §7.

## Transfers, requests and the subcontract dispatch (P15)

**Mantle** (mr-mantle `service/mantle/shipment/WarehouseTaskServices.xml` on StockPosting.js and `Transfers.js`;
`service/mantle/request/RequestServices.xml` on `InventoryRequests.js`; `entity/WarehouseTransferEntities.xml`; spec
`test/Warehouse/WarehouseTransfers.spec.js`). A transfer is a ShpTpTransfer shipment between two facilities of one owner, from the owner to
itself (so `get#ProductStockTotals`' `transitQuantity` counts it), its first route segment's origin and its last destination
(F55). A line's sent, received and in-transit quantities are each summed from its own rows (issuances, the dispatch moves,
receipts), never from ShipmentItemDetail or `receive#EntireShipment` (F37). One lock order: the shipment, its lines by id, the
request, assets by id, the destination location.

| Entry point | Type, permission | What it does |
| --- | --- | --- |
| `create#Transfer` | TransferCreate, `STOCK_MOVE` | `create#Shipment` (ShpTpTransfer, ShipInput) and a line per product and quantity (`create#ShipmentItem`); with `subcontractWorkEffortId`, `subcontractOrderId` and `subcontractOrderItemSeqId` a subcontract dispatch or return. Refuses RECORD_UNAVAILABLE, FACILITY_CLOSED, SAME_FACILITY, OWNER_MISMATCH, LINES_REQUIRED, NOT_STOCK, QUANTITY_INVALID; for a dispatch NOT_CUSTODY, SUBCONTRACT_KEYS, RUN_REQUIRED, RECORD_UNAVAILABLE (a run of another owner or outside the user's facilities, an order not bought by the facilities' owner), SUBCONTRACT_LINK (OrderItemWorkEffort), CUSTODIAN_MISMATCH (the order's supplier is the facility's Custodian), ORDER_CANCELLED, NOT_SERVICE |
| `issue#TransferStock` | TransferIssue, `STOCK_ISSUE` | Named stock (else what the line's guarded picks took, from each picked asset at most what its picks took and the line has not issued) issued to the line through `issue#Asset`, which posts to the inventory type's `transferGlAccountId`; the entered quantity (F7) and the line's not-handled quantity. TRANSFER_SHIPPED, SOURCE_CANCELLED, QUANTITY_EXCEEDS_REMAINING, ASSET_REQUIRED, OTHER_FACILITY, PRODUCT_MISMATCH, OWNER_MISMATCH, HELD_STOCK, STATUS_NOT_USABLE (only AstAvailable and AstOnHold), QUANTITY_EXCEEDS_AVAILABLE (reserved for orders), PERIOD_CLOSED (not locking) |
| `ship#Transfer` | TransferShip, `SHIPMENT_SHIP` or `STOCK_ISSUE` | Every line sent, or with `shipShort` each lowered to what was sent (nothing sent: cancelled); a picked transfer through `pack#Shipment` (F337), then `ship#Shipment`; a subcontract dispatch whose lines all went by moves is delivered at once (F347). NOTHING_SENT, OUTSTANDING |
| `receive#TransferStock` | TransferReceive, `STOCK_RECEIVE` | A shipped transfer at its destination, in parts: the accepted then rejected quantity taken from the lines' issuances in transit in order, each piece through `receive#Asset` with its issuance's cost, owner, lot, serial and expiry (`sourceAssetIssuanceId`; the cost currency set after, F336), to the receipt step's destination (Receiving.js: putaway, receiving, quarantine) and inspected as a purchase receipt would be (Quality.js); delivered when nothing is left in transit. TRANSFER_NOT_SHIPPED, RECEIPT_CLOSED, PRODUCT_NOT_ON_RECEIPT, QUANTITY_INVALID, OVER_RECEIPT, REASON_REQUIRED, the destination's refusals, PERIOD_CLOSED (not locking). The answer's `acquireCosts` only with ACCOUNTING_VIEW |
| `dispatch#SubcontractStock` | SubcontractDispatch, `STOCK_MOVE` | A subcontract dispatch's (or return's) line with no in-transit step: the asset, or part, through `move#Asset` to a location of the other facility, owner and cost unchanged, nothing posted; each move is its operation's answer (the line's moved quantity); shipped and delivered when every line went this way. NOT_SUBCONTRACT and as `issue#TransferStock` and `move#Stock` |
| `allocate#InventoryRequest` | InventoryRequestAllocate, `STOCK_MOVE` | An approved stock request: from another facility one transfer (`create#Transfer`'s checks) with a line per item, from the request's own facility a `move#Stock` per item of stock there (its own operation, `toFacilityId` the request's facility); an InventoryRequestAllocation per row. NOT_INVENTORY_REQUEST, NOT_APPROVED, DUPLICATE_ITEM, QUANTITY_EXCEEDS_APPROVED, ASSET_REQUIRED, OTHER_FACILITY |
| `pick#ShipmentStock` (P11) | ShipmentPick | A transfer line (no order, no reservation, F335): the scanned asset's or location's available stock, into the pick container when there is one (NOT_AVAILABLE_HERE) |

`mantle.request.RequestServices`: with the operation policy's `inventoryRequestCheck` (WarehousePolicy, off by default; on for
ORG_ZIZI_RETAIL in the demo), `create#Request` of RqtInventory, and `update#Request` making a request one or moving one to another
facility, need a facility of the user's organizations (FACILITY_REQUIRED, RECORD_UNAVAILABLE), and create makes its owner the
OrgInternal party; `add#InventoryRequestItem` (a stocked product
and quantity on a draft or submitted request: REQUEST_CLOSED, NOT_STOCK, QUANTITY_INVALID); `approve#InventoryRequest`
(InventoryRequestApprove, `STOCK_POLICY_PLAN`: each item an approved RqTpInventory Requirement linked by RequirementRequestItem,
the request ReqInProgress; NOT_SUBMITTED, NO_ITEMS, ITEM_INVALID); `get#InventoryRequestProgress` (per item requested,
approved, allocated, transferred, received, in transit and remaining, the requirement ids and each allocation's line or asset).
Records: `Shipment.subcontractWorkEffortId`, `subcontractOrderId`, `subcontractOrderItemSeqId`; `mantle.request.InventoryRequestAllocation`
(IratTransfer, IratMove); the Custodian RoleType (a FacilityParty of an organization-owned vendor-custody facility).

**BOSS.** `ironstone.warehouse.TransferServices` (`Transfers.js`, reads only, limited in the query to the user's facilities, no
cost): `get#Transfers` (from or to the user's facilities, kind, route, sent, in transit, received, due; custody at supplier and
the stock suppliers hold), `get#TransferDetail` (another kind of shipment answers `transferFound` false; lines, issuances, moves,
receipts, each end's actions by capability), `get#TransferChoices` (facilities, products, serviceItems, stock, lineStock,
requestStock, locations), `get#StockRequests`, `get#StockRequestDetail` (Mantle's progress, the capabilities), `get#TransferQueue`
(Home). The transitions are `template/WarehouseTransferParts.xml`'s: each `check#Record` with its capability, then the entry point
with the page's render token.

| Part | Contract |
| --- | --- |
| `Warehouse/Transfers/Transfers.xml` | TransferFind and TransferList (list, board by status, calendar by due day; custody at supplier with Stock at suppliers), New transfer for the move group |
| `Shared/ShipmentDetail` | The transfer branch (`template/WarehouseTransferDetail.xml`), tried before the receipt and outbound branches: header with the transfer sheet; Items (Mantle's `lineOf`); Origin pick and ship (Pick, Send stock, Move to the vendor facility for a dispatch, Ship); Transit (the transfer account's net value with financial read only, F346); Destination receive (Receive); Custody at supplier for a subcontract dispatch or return; files and conversation |
| `Warehouse/Transfers/TransferSheet.xml` | The transfer as html-print (lines, stock sent, signatures) |
| `Warehouse/Transfers/StockRequests.xml` | StockRequestFind and StockRequestList (list, board), New stock request |
| `Shared/RequestDetail` | The Warehouse branch (`template/WarehouseRequestDetail.xml`): Submit, Approve (`policyPlan`), Allocate (`move`), Complete, Cancel; Overview; Items and progress (InventoryRequestProgress, Add item); conversation and files |
| `Warehouse.js` | `sharedLinks` of the P15 screens; a transfer's record link opens TransferShipmentDetail, a subcontract dispatch's SubcontractShipmentDetail |
| Home | The transfers queue: to send from the facility, in transit to it, late |

**For later phases.** P12 and P13 may add packages and carriers to a transfer (§5); P16 receives a subcontract's output on the
run (`receive#SubcontractOutput`) and issues its material lines from the vendor-custody facility, reading the dispatch's
`subcontract*` keys; supply planning (CX-PLANNING) converts transfer suggestions through `create#Transfer` and writes
RequirementSupply for the requirements approval made; P17 reports transit (`get#ProductStockTotals`' `transitQuantity`) and the
transfer account.

## Production runs and stock (P16)

Manufacturing's runs and production stock guards (design-manufacturing §12 M2 and M4) and Purchasing's service acceptance
(PUR-RECEIPT), built in Mantle for every app; Warehouse's context on MaterialIssueReceipt and SubcontractShipmentDetail.
Manufacturing's own screens and its transition, change, loss and cost services stay Manufacturing's.

**Records** (mr-mantle `entity/ProductionEntities.xml`, seed `data/ProductionData.xml`): the run's audit-logged fields on
WorkEffort (`productionRevision`, `productionMethodDate`, `productionReleaseDate`, `productBomId`, `productionRoutingId`,
`productStandardCostId`, `demandOrderId`, `demandOrderItemSeqId`, `demandRequirementId`; on an operation child
`routingOperationWorkEffortId`, `operationSequenceNum`, `workCenterFacilityId`); `mantle.work.production.ProductionRunLine` (a
stable id, role PrlrOutput, PrlrMaterial or PrlrByproduct, product, quantity and unit, `stockQuantity` in the stock unit with the
exact `conversionFactor`, scrap factor, source `bomItemId` and BOM, the routing operation, the operation child from release,
`frozenDate`); the CX-PRODUCTION fields `AssetIssuance.productionMaterialLineId`, `AssetReceipt.productionOutputLineId`,
`operationWorkEffortId` on both and `AssetReceipt.costProvisional`; `mantle.order.purchase.ServiceAcceptance`;
`WorkEffort.productionMethodRefs` (the BOMs and routings a run was read from). No unrelease transition is seeded: the framework
accepts any flow's transition on any WorkEffort, so it comes with Manufacturing's guard (F366). Permissions PRODUCTION_VIEW and PRODUCTION_PLAN
(MantleSetupData, ADMIN; Manufacturing P1 grants them).

**Mantle** `mantle.work.ProductionServices` (`Production.js`; spec `test/work/WarehouseProduction.spec.js`). The guards take
StockPosting.js's steps (begin, the run's line and the stock locked, settled, the period without locking, the primitive,
complete); every movement carries the run's workEffortId, its line and operation.

| Service | Permission | What it does |
| --- | --- | --- |
| `create#ProductionOrder` | PRODUCTION_PLAN (and the method read the explosion checks) | A draft run (WepProductionRun, WeInPlanning, owned by the organization) through `create#ProductionRun` without the consume and produce products (no PatMfgBom row); its lines from `get#BomExplosion` as of the method date (now by default): the output, a material line per component required for production (non-phantom sub-assemblies stop the lines, phantoms are blown through with their routing), the by-products; the WeptConsume/WeptProduce rows. RECORD_UNAVAILABLE, FACILITY_OWNER, PRODUCT_REQUIRED, QUANTITY_INVALID, PRODUCT_NOT_USABLE, METHOD_REQUIRED, METHOD_AMBIGUOUS, METHOD_INVALID; a retry answers the draft (`existing`) |
| `release#ProductionOrder` | PRODUCTION_PLAN | A release of the run's BOM, a phantom's BOM or its routings since the method date refuses (METHOD_CHANGED) unless `reexplode`, which rewrites the lines and rows as of now and answers the draft for review (REEXPLODED, the next revision; a release with that revision follows); the BOMs and routings checked, and the routings the operations come from, are `productionMethodRefs`; operation children from the routings as of the method date; lines frozen on them; WorkEffortProduct rows rewritten; the effective approved standard frozen; release time; revision; WeApproved. RUN_NOT_DRAFT, REVISION_CHANGED, LINES_REQUIRED |
| `get#ProductionOrder` | PRODUCTION_VIEW or STOCK_ISSUE | The run, lines (issued, returned, remaining; received), operations, issuances (returnable) and receipts; a standard's cost and a movement's value only with ACCOUNTING_VIEW |
| `issue#ProductionMaterial` | STOCK_ISSUE | A new issuance per operation key and line (`issue#AssetToWorkEffort`'s `issuanceFields`, F356), the line's unit converted exactly; the run released (RUN_NOT_RELEASED), the line the run's (LINE_INVALID), the stock checked in the guard: the user's facilities, the product (PRODUCT_MISMATCH), AstAvailable (HELD_STOCK), the run's owner (OWNER_MISMATCH), free (QUANTITY_EXCEEDS_AVAILABLE), at most the line's remainder (QUANTITY_EXCEEDS_REMAINING); the expiry gate inside the issue |
| `return#UnusedMaterial` | STOCK_ISSUE | A new receipt (`receive#Asset`) into the original asset, or a new one at a location at the original cost, with `sourceAssetIssuanceId` and the run; never `cancel#AssetIssuance`. RUN_CLOSED, QUANTITY_EXCEEDS_ISSUED, OWNER_MISMATCH, the location's refusals; after a provisional output receipt PROVISIONAL_TRUE_UP (the rest of the output takes the lower WIP), once all the output was received provisionally PROVISIONAL_CLOSED |
| `receive#ProductionOutput` | STOCK_ISSUE | At the frozen standard unit cost, else the run's net WIP × the quantity ÷ what is left to receive (the last receipt the rest) (`costProvisional`, COST_UNAVAILABLE with neither), four decimals rounded down with the remainder on the last unit; into quarantine with an inspection (QisWorkEffort) when the tracking policy or a production template asks, else the location given or putaway's; serials given or generated from `firstSerialNumber`; OVER_RECEIPT, the tracking refusals; a by-product is refused (BYPRODUCT_NOT_COSTED) |
| `receive#SubcontractOutput` | STOCK_ISSUE | From a subcontract dispatch: the material lines of its operation issued at the vendor-custody facility (backflush share or reviewed `materialQuantities`, oldest stock first, MATERIAL_SHORT), the output received on the run, the ServiceAcceptance written with the receipt and inspection, in one transaction under sub-keys of its operation key. NOT_SUBCONTRACT, NOT_CUSTODY, CUSTODIAN_MISMATCH; the last of the output issues each line's remainder; reviewed actuals of other lines or above a remainder refused (LINE_INVALID, QUANTITY_EXCEEDS_REMAINING); the service accepted in the output's proportion unless `acceptedQuantity`; SHIPMENT_CANCELLED, RECORD_UNAVAILABLE for an order not bought by the run's owner |
| `mantle.order.OrderServices.accept#ServiceItem` | PURCHASE_ORDER_EDIT or STOCK_RECEIVE | A service line of the user's buying organization accepted at most as ordered (`ServiceAcceptance.js`): ORDER_CANCELLED, NOT_SERVICE, QUANTITY_INVALID, QUANTITY_EXCEEDS_ORDERED, UNIT_MISMATCH, ACCEPTOR_INVALID |

**BOSS.** `ironstone.warehouse` `Production.js` (reads only): `runSource` and `runAction`, MaterialIssueReceipt's `productionRun`
entry of `Packing.js` sources, and `subcontractOutput` for `get#TransferDetail`'s `outputReceipt`. A production run is a
Warehouse record kind (`run`, by its facility; its link opens MaterialIssueReceipt). Demo: `DemoServices.load#ProductionDemo`
(the DEMO_1_1 run, from the walk suite's server fixture WarehouseProductionFixtures) and BOSS_WH_RUN's lines in demo data.

| Part | Contract |
| --- | --- |
| `Shared/MaterialIssueReceipt.xml` | The source's `words` and `actionField`; for a run: Material lines with Issue from a chosen asset, Output with Receive, Tracking, Unused returns with Return, Posted issues and receipts (value with financial read), Files; `materialAction` passes `actionKind` (issue, return, receive) |
| `Shared/ShipmentDetail` | The transfer branch's Custody at supplier gains the Output receipt pane for a subcontract dispatch: received, left, accepted, components at the vendor; Receive output (`receiveSubcontractOutput`: `check#Record` of the shipment with issue, then `receive#SubcontractOutput`) |

**For later phases.** Manufacturing P1 grants the production permissions; P5 mounts MaterialIssueReceipt with its context and
builds `transition#ProductionOrder` (the unrelease guard), manual lines and the backflush preview; P6/P14 write the cost and
accrual events from these guards; Purchasing's RecordServiceAcceptance calls `accept#ServiceItem`.


## Reports (P17)

Mantle (`mantle.product.InventoryReportServices`), both read in the user's organizations (StockScope.js) narrowed to the
caller's `facilityIds`, with no cost and no stock read permission of their own:

| Service | Contract |
| --- | --- |
| `get#InventoryAtDate` (`InventoryAtDate.js`) | Stock at the end of `asOfDate` (a day in the user's zone; future refused, DATE_FUTURE) from the start of `fromDate` (the cut-off's month by default; after it, DATE_RANGE), by product, facility, location, lot and owner, the place at a time read from the asset's audit log (its create's rows are the starting values, F381; the opening one summed query): `stockRows` (opening, receipts, issues, adjustments, moves, closing), `historyRows` (effective and recorded dates, kind, source document, balance; a revaluation split's pair and a partial move within a row one row), `totalRows` per unit (no unit counts as each), `complete`, `historyIncomplete` (a quantity before a facility's first ledger row: null, never zero), `truncated`, `historyStartText`; both lists paged (`historyPageIndex` for the history) or all with `pageNoLimit` (5000) |
| `find#OperationsHistory` (`OperationsHistory.js`) | Receipts, shipments, returns and transfers of `fromDate`–`thruDate` (the last 30 days by default) by `dateBasis` movement (a receipt or issue in the period) or document (expected arrival or ship), filtered by operation, facility, party, product and carrier in the query: a row per document and product (expected, accepted, rejected, picked, shipped, delivered, expected and actual dates, days from expected) and `totalRows` per unit, never across units; delivered empty until the shipment is delivered; quantities are the whole document's |

`find#Movements` takes `shipmentId` (the history's drill). `EntityLib.js` `pageList` pages a list built in memory.

BOSS `ironstone.warehouse.ReportServices` (`Reports.js`; drop-downs through `template/WarehouseReportParts.xml`
`reportChoices`):

| Service | Contract |
| --- | --- |
| `get#StockAtDate` | `Shared/StockAtDate`'s Warehouse branch: Mantle's get#InventoryAtDate in the user's facilities (or the given one, FACILITY_UNAVAILABLE outside), with product, lot, asset and document links and `openingText`, `closingText`, `balanceText` (Unknown for null) |
| `get#OperationsHistory` | Mantle's find#OperationsHistory in the user's facilities, with the document's Warehouse screen (`recordUrl`), return, product and movements links |
| `get#ValuationScope` | InventoryValuation's Warehouse branch: the organization valued (the facility's owner, else the chosen, active or only organization; another is ORGANIZATION_UNAVAILABLE), the facility, the organization options and `financialRead`; reads no value |
| `get#ReportChoices` | facilities, owners, parties (another user's private contact left out) and carriers, searched ignoring case, with the selected label |

Shared screens: `Shared/StockAtDate` (Warehouse context only; Customer Service adds its branch and context service when built)
and Accounting's `Shared/InventoryValuation` with an `appRoot == 'Warehouse'` branch: `template/WarehouseReportParts.xml`
`WarehouseInventoryValuation` (header, options, the financial-read notice with the quantity reports) and Accounting's results
(`template/AccountingInventory.xml` `InventoryValuationResults`, shown after either context's header; each context sets
`productDetailUrl` and `journalDetailUrl`). Mantle's run#InventoryValuation refuses a user without ACCOUNTING_VIEW; the branch
does not call it for them. Revaluation, cost repair and journal links stay in Accounting's context.

## Finish (P18)

| Part | Contract |
| --- | --- |
| `Warehouse/NewCount` | Home's count quick create (`quick-create kind="warehouseNewCount"`): `template/WarehouseCountParts.xml` `NewCountForm` (also Counts' New count dialog) and `createCount`, which answers `//Warehouse/Counts/CountDetail`. Under the root with its own artifact group (BOSS_WH_NEW_COUNT: the count and admin groups), because the Counts area's ALWAYS grants to the reviewer and adjust groups would outrank a deny in it |
| Conditions | A widget shown on a condition is a `section` with the condition (also inside a list cell, evaluated per row; or a `conditional-field`): `condition` on `container-box`, `container`, `form-single`, `form-list` or `display` is not in the XSD and the renderers ignore it (F375, F398, F403) |
| Server-static | The screens the server-static full check finds clean are marked `server-static="qvt"` (Inventory, Handheld, Handheld/Home, Settings, Settings/Index, NewReceipt, NewTransfer, NewStockRequest, NewCount, Manifest, PrinterTestPage, CountSheet, and AssetDetail's Files and Notes), except one with a form field `hide`, whose static template keeps the hidden column's header (F396: Movements, Traceability). A new clean screen is marked; WarehouseServerStatic, an acceptance test, fails a marked screen that is not clean |
| Route fixtures | None: a screen sweep is an acceptance test, one per app per mode (AppStructure, TuiRender and WarehouseServerStatic in `test/acceptance/`) |
| Access walks | Acceptance tests. `test/Warehouse/WarehouseStandaloneLib.js` (design §19, crosscut §6): an organization with no ProductStore (BOSS_P18_ORG), its spec users of one capability each, receive to ship through the screens' transitions, and the routes that show its records with the user who may open each. `WarehouseAccessWalk`: the flow, no other app root, Retail's users seeing none of its records on the routes that show them to their owner (the Handheld and shared mounts and record panels among them, html and tui), no notice of its records to a Retail user; and its users seeing none of Retail's records on the routes, exports and prints, the palette, scans, links, search and drop-downs, no cost or price without financial read, settlement, invoice release and revaluation refused. A new Warehouse route with a record goes in `p18Routes` |

## Verification

P18, Oct 31, 2026: BOSS `WarehouseAccessWalk`, `WarehouseIsolationWalk` (after the review), `WarehouseAccess`, `WarehouseCounts` and `WarehouseShell` (the count quick
create), `AppStructure`, `TuiRender` (every Warehouse twin with its fixture's text; the F375 boxes), `WarehouseServerStatic` (every
Warehouse screen); mr-mantle `WarehousePacking` (F397); the walks over the screens changed. The counts are in the plan's §8
record.

P17, Oct 31, 2026: mr-mantle `WarehouseReports` (stock at a date on a pinned clock at a day boundary, the audit-log place,
the revaluation pair, incomplete history, totals by unit, operations history and its filters); BOSS `WarehouseReports`,
`WarehouseAccess` (the report services' reader and refusals, the reports filtered for a capability user), `AppStructure`,
`TuiRender` and `ClientIsolation` with the Reports mounts, and the walk `WarehouseReportsWalk` (Stock at date at 390 px). The
counts are in the plan's §8 record.

P13, Oct 31, 2026: mr-mantle `WarehouseShipping`; BOSS `WarehouseShipping`, `WarehouseAccess` (Ship for the ship capability, the
tracking list filtered for a capability user, another organization's shipment and facility refused, the shipping, printer and
carrier writes refused without the permission), `AppStructure` and `TuiRender` with the P13 screens and the Printers tab, and
the walk `WarehouseShippingWalk` (PackageTracking at 390 px). The counts are in the plan's §8 record.

P16, Oct 31, 2026: mr-mantle `WarehouseProduction`; BOSS `WarehouseAccess` (the run source refused without issue or for another
organization's run, the guards without the permission), `WarehouseProductionFixtures`, `AppStructure` and `TuiRender`, and the
walk `WarehouseProductionWalk`. The counts are in the plan's §8 record.

P12, Oct 31, 2026: mr-mantle `WarehousePacking`; BOSS `WarehousePacking`, `WarehouseAccess` (the packing reads, the shipments to
pack filtered for a capability user, forged shipments and facilities, the pack entry points and box type writes without the
permission), `AppStructure`, `TuiRender` and `ClientIsolation` with Pack, PackingSlip, BoxTypes, the Box types tab,
MaterialIssueReceipt and `Handheld/Pack`, and the walk `WarehousePackingWalk` (Handheld Pack at 390 px). The counts are in the
plan's §8 record.
P14, Oct 31, 2026: mr-mantle `WarehouseReturns`; BOSS `WarehouseReturns`, `WarehouseAccess` (a Returns list filtered for a
capability user, another organization's return and shipment refused, the return entry points refused without the permission),
`WarehouseShell` (the return's link), `AppStructure` and `TuiRender` with the Returns mounts, and the walk `WarehouseReturnsWalk`
(Returns at 390 px); the review fixes (F325–F332) with the same specs. The counts are in the plan's §8 record.

P11, Oct 31, 2026: mr-mantle `WarehousePicking`; BOSS `WarehousePicking`, `WarehouseAccess` (a Picking list filtered for a
capability user, the Picking area's groups and links, money only with financial read, the pick entry points refused without
the permission or for another organization), `WarehouseShell` (the outgoing shipment's link), `AppStructure` and `TuiRender`
with the Picking, Shipping, Orders and Handheld mounts, and the walk `WarehousePickingWalk` (Handheld Pick at 390 px). The
counts are in the plan's §8 record.

P9, Oct 31, 2026: mr-mantle `WarehousePutaway`; BOSS `WarehousePutaway`, `WarehouseAccess` (the putaway reads, the queue
filtered for a capability user, forged stock and facilities, the entry point and the rule store without the screens),
`AppStructure` and `TuiRender` with Putaway, PutawaySheet, PutawayRules and `Handheld/Putaway`, and the walk
`WarehousePutawayWalk` (Handheld Putaway at 390 px). The counts are in the plan's §8 record.
P8, Oct 31, 2026: mr-mantle `WarehouseQuality`; BOSS `WarehouseInspections`, `WarehouseAccess` (an Inspection list filtered
for a capability user, a forged inspection refused, QualityInspection open to a reader with no actions while the area is
refused), `AppStructure`, `TuiRender` and `ClientIsolation` with the inspection screens, and the walk
`WarehouseInspectionWalk` (the reader at 390 px). The counts are in the plan's §8 record.

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
