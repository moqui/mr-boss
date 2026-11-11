# IronStone BOSS — UI review: Warehouse

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review Warehouse through the work of receiving, storing, counting, moving and fulfilling physical goods. Follow a
purchase receipt into usable stock, a sales shipment from reserved stock to delivered packages, and a return or
production movement through its quality and financial handoffs. The daily workspace should make the facility,
physical identity, unit, quantity, stock state and next permitted action clear, including on a scanner-driven device.
A completed click must explain what moved, what remains, and how the operator resumes after a refusal or interruption.
Substantial layout and navigation refinements may be proposed where they improve an implemented workflow.

This follows [Accounting](ui-review-accounting.md), [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase). Keep Warehouse's current inventory,
activities, findings, coverage, decisions and bounded execution notes here. Research records references, design
specifies behavior, implementation records construction, and this document records review and refinement.

**Status: planning only, 2026-11-10 America/Chicago.** This document was researched from current sources as part of the
four-app documentation batch. All live activities and mode coverage start pending. No runtime was started, no stock
or financial record was changed, and no tests or walkthroughs were run to write it. Historical implementation results,
available tests and source inspection do not establish completed Warehouse review activities. This plan does not
start the live review or authorize acceptance runs.

### Inputs and reference patterns

Other review plans in this batch: [Manufacturing](ui-review-manufacturing.md),
[Purchasing](ui-review-purchasing.md) and [Customer Service](ui-review-customer-service.md).

- [Warehouse design](design-warehouse.md), [implementation](impl-warehouse.md), [research](research-warehouse.md) and
  [implementation notes](../docs/WarehouseImplementation.md).
- [Accounting review](ui-review-accounting.md), [Products review](ui-review-products.md),
  [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../plans/UI-Refinement.md).
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and current Purchasing, Manufacturing, Customer Service, Products and
  Accounting designs/contracts where their work enters or leaves Warehouse.
- Current `screen/Warehouse.xml`, `screen/Warehouse/`, the mounted `screen/Shared/` sources and their children,
  `template/Warehouse*.xml`, `service/ironstone/warehouse/`, `MoquiConf.xml`, `data/BossSetupData.xml`,
  `data/BossUsersDemoData.xml`, `data/BossWarehouseDemoData.xml` and `DemoServices.xml`.
- Current BOSS Warehouse regression and acceptance specs, client suite registrations and fixture helpers;
  Mantle's shipment/stock, facility, quality, count, traceability, production, return, purchasing and ledger services
  and their rule specs. Current grants, routes, outputs and service contracts take precedence over older prose.

Use the earlier research as a comparison lens: Odoo's receipt/delivery task continuity, ERPNext's stock and quality
work, Carbon's inventory and shop-floor patterns, and the Moqui baseline's stock and shipment contracts. These are
patterns documented in the existing research, not fresh claims about external products or a feature checklist to
import. Warehouse review is not a new warehouse management system design.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Warehouse navigation, task screens, Home, choices, facility selection, settings and shared context | BOSS Warehouse and its templates/services |
| Stock movements, reservations, receipt/issue guards, tracking, quality, counts and transfer records | Mantle; business-rule corrections and tests belong there and must work without BOSS |
| Product360 and InventoryAvailability | Products' shared context with Warehouse physical tabs, facilities and stock-policy capabilities; no catalog, method, price or cost authority inferred from mounting |
| FacilityDetail, EquipmentDetail, QualityInspection and InspectionTemplates | Shared sources; exercise Warehouse's context and a representative other consumer if a shared correction is later made |
| Purchase receipt, bill matching and supplier returns | Purchasing owns the commercial order and approval; Warehouse owns physical handling; Accounting owns bill/payment and valuation consequences |
| Production issue/return/output and vendor custody | Manufacturing owns run/operation/method state; Warehouse owns its physical execution surfaces; Mantle owns the guarded movements; Accounting owns financial cost close |
| Customer RMA and settlement | Customer Service owns authorization and customer communication; Warehouse receives/inspects or ships returned goods; Accounting owns settlement authority |
| Chatter, RecordFiles, Today, palette and notifications | Existing Commons/shared services; inspect record identity, audience, evidence and return path without repeating a full Commons review |
| Label, printer, carrier, export and print behavior | Warehouse/Mantle provider contracts and framework output/rendering; use local substitutes and inspect actual artifacts |
| Insights record fallback and neighboring-app links | Bounded context/authority/return checks; no full Insights, PASS, Commerce or neighboring-app review |

Preserve record keys, routes, entered units, operation identity, dates, saved finds/columns and preferences. Record
unavoidable compatibility changes before implementing them. Facility selection is a convenience, not authorization;
organization-owned stock in an inaccessible facility does not become visible because the user knows its identifier.
Financial read remains separate from stock handling, including exported bytes and shared details.

Do not build missing delivery trips, capacity planning, camera scanning, ZPL labels, external stock synchronization,
automatic waves or other deferred features to complete this review. Reconcile old deferrals against current sources:
other apps' production, purchasing and customer-service contracts have since been built, while Warehouse itself still
has no SupplyPlanning mount. A stock operation's finance effect is a required handoff, not permission to perform a
complete Accounting review. Later execution uses disposable stock and synthetic carriers; real shipping labels,
carrier charges, customer/supplier mail and physical printer jobs are not review fixtures.

## 2. Review method and refinement criteria

### Environment and fixtures

For later execution follow the review guide and repository building/testing skills. Use an isolated runtime and a
fresh disposable database with individually linked Mantle and BOSS components. The guide's framework bootstrap leaves
`component/` empty; add the required app components explicitly. Copy mutable configuration and keep database,
uploaded files, mail capture, labels and output artifacts separate from working data. A different listener port does
not isolate a database, and cookies are not isolated by port. Use separate hostnames for independent browser identities.
A symlink to a component is still a path to source; do not direct write tooling at it.

One coordinator owns runtime lifecycle and shared files. Record source and binary revisions, actual runtime/database
paths, components, fixture setup, hostnames, ports, date/zone, provider substitutions and evidence directory in the
first execution batch. Establish browser access, embedded Postgres permissions, loaded web assets and actual terminal
availability before assigning live work. Follow the guide's whole-runtime relocation procedure if keeping a
runner-created runtime across restarts. Stop review listeners and restore temporary grants/settings/preferences at end.

Use a suitable existing binary for XML/script work; rebuild only when required by Rust or embedded renderer changes.
Verify the actual loaded assets before diagnosing stale UI. Establish Chromium/PDF and label-artifact availability.
Capture mail locally; substitute the existing test shipping gateway or an explicit local provider fixture. A bought
label, printed flag or successful response is not proof of a correct file, printer delivery or carrier outcome.
A missing device/provider leaves that branch unverified.

Warehouse's principal demo scope is **`ORG_ZIZI_RETAIL` / `ZIRET_WH`**, with the second facility **`BOSS_WH_EAST`** and
the organization-owned vendor-custody facility **`BOSS_WH_VENDOR`**. `BOSS_PRD_WH` belongs to
`ORG_ZIZI_SERVICES` and supplies foreign-facility cases, including Retail-owned stock kept there. Accounting's
`BOSS_ACCT_ORG` is outside this hierarchy; do not combine its fixtures with Warehouse actors without preparing the
intended organization and policy. The standalone acceptance helper's `BOSS_P18_ORG` supplies a no-ProductStore model,
not an already-loaded fixture or authorization to run its walk.

| Actor fixture | Purpose and limit |
| --- | --- |
| `warehouse.read` | Root access and useful physical reads, no stock mutation or financial read |
| `warehouse.receive` | Purchase/customer-return receipt; not production output authority |
| `warehouse.move`, `warehouse.issue` | Move/putaway/container work versus issues and production output/unused material; keep these distinct |
| `warehouse.count`, `warehouse.countreview`, `warehouse.adjust` | Observation, variance review and posting/adjustment as separate capabilities |
| `warehouse.inspect`, `warehouse.quality` | Readings/submission versus verification/disposition/template work and expiry extension |
| `warehouse.pick`, `warehouse.picksupervisor` | Pick execution versus picklist/load composition and assignments |
| `warehouse.pack`, `warehouse.ship`, `warehouse.shippingmanager` | Packing versus labels/shipping/tracking; names do not grant carrier administration |
| `warehouse.planner`, `warehouse.manager`, `warehouse.facility` | Policy planning/management and facility maintenance; inspect actual grants per operation |
| `warehouse.admin` | Administrative setup and broad facility scope; unsuitable as the sole isolation counterpart |
| `warehouse.dispatch`, `warehouse.integration` | Existing user/group names, not evidence that deferred dispatch/integration functionality exists |
| Composed and neighboring actors | A narrowly composed stock-plus-financial reader; Purchasing receiver/buyer, Manufacturing material operator, Customer Service return agent and Accounting reviewer with explicit grants and matching organization |
| Outsiders | No-Warehouse user, capability-only user without root access, and second-organization Warehouse users; pair valid positive and negative requests |

`Warehouse.js` derives capabilities from permissions and root grants. `FacilityActive`, a client `appRoot`, a selected
organization and a record assignment cannot widen those grants. Area authorization is also significant: Inspection,
Counts and Picking have restricted entry, while the root's hidden QualityInspection can supply a permitted read.
Verify loaded memberships/permissions and organization relationships before interpreting a refusal. Do not use ADMIN
as the holder in every paired check, and do not treat a validation error as proof of permission enforcement.

Prepare independent, consumable fixture copies for the following families. Demo IDs are starting points; inspect their
current status and dates before choosing them for a run.

| Fixture family | Starting evidence and variations |
| --- | --- |
| Facilities/locations | `ZIRET_WH`, `BOSS_WH_EAST`, `BOSS_WH_ANNEX`; receiving `0801`, staging `0701`, quarantine `0901`, morgue `0991`, dock `0601`, closed `0199`; `BOSS_WH_FORKLIFT` |
| Physical identity | `BOSS_WH_LOTTED`, `BOSS_WH_SERIAL`, lots `BOSS_WH_LOT_A/B/C`, available/held/quarantined/morgue/east stock and serials `SCN-1001` onward; colliding or ambiguous codes and long labels |
| Receipt/putaway | `BOSS_WH_PO`, fresh receipt from its part, sealant and serial lines, `BOSS_WH_PR_SEAL`, pick/bulk bins `01020301/01020302`; mixed accepted/rejected, over-receipt and two-step receiving |
| Counts/corrections | `BOSS_WH_COUNT`, due schedules, blind/unblind counts, found stock, concurrent movement and `BOSS_WH_CLOSED_2024_06`; zero, blank, skipped and fractional observations |
| Picking/packing | Open demo picklist; `BOSS_WH_SHIP_PACK` / `BOSS_WH_SO_PACK`, `BOSS_WH_SHIP_KIT`, cartons `BOSS_WH_BOX_S/M`, stock and assembly components |
| Shipping | `BOSS_WH_SHIP_SHIP`, `BOSS_WH_SO_SHIP`, `BOSS_WH_INV_SHIP`, `BOSS_WH_LABEL_PRINTER`, test gateway/carrier; failed printer, manual tracking, canceled/unknown label outcome |
| Transfer/subcontract | `BOSS_WH_SHIP_TRANSFER`, `BOSS_WH_TRF_STOCK`, `BOSS_WH_REQ`, `BOSS_WH_VENDOR_STOCK`, `BOSS_WH_SHIP_SUB`, `BOSS_WH_SUB_PO`, `BOSS_WH_RUN` and `BOSS_WH_RUN_OP` |
| Quality/returns | `BOSS_WH_TMPL`, `BOSS_WH_INSP`, customer/supplier returns in current demo data and their shipments; independent submitted/verified/disposed copies |
| Reports | Lot and kilogram stock with movement history, incomplete historical opening, multiple units/currencies, scope-limited financial reader and unknown provenance |

Deliberately include dates on either side of a boundary, expired/near-expiry stock, dated policy precedence, closed
locations, open/locked periods and independently approved financial conditions. The old fixed due dates and expiration
dates in demo data are not reliable substitutes for recording the review clock. Use operation retries, stale previews,
revoked permission and another actor changing the record between display and confirmation. Include mixed-validity
batch inputs and inspect named per-item failures; an independent failure must not hide successful independent work.

### Visual and interaction review

- Primary target: Material `/qapps` in default light/dark at **1920×1080**; selected **1280px**, **390px**,
  keyboard-only and actual **200% browser zoom** checks. Record measured dimensions and tool limitations.
- Review handheld mounts separately from a desktop page merely narrowed to a phone: inherited density, compact
  header, 48px controls, readable scan/quantity fields, first/next focus, feedback after each scan and one clear action.
  Camera scanning is deferred; keyboard-wedge or typed input can exercise the supported path.
- Inspect actual embedded TUI launch, theme changes, scan inputs, choices, tabs, dialogs, confirmations and saved
  outcomes. JSON rendering is supporting evidence, not terminal interaction. Give Standard `/apps` a bounded
  functional/output/fallback check; visual refinement targets Material.
- Use meaningful name/key/status headers and clear read-only layouts. Keep facility, location, owner, product,
  lot/serial/container, entered unit and stock unit visible at decisions. Never add unlike quantities or currencies.
- Distinguish available, reserved, held, quarantine, in-transit, picked, packed, shipped and delivered; also separate
  a return's authorization, receipt, quality disposition and settlement. A state chip must not imply the next action
  has already happened.
- Apply contrast criteria to composited backgrounds: ordinary text **4.5:1**, qualifying large text **3:1**, meaningful
  controls/states **3:1**. Inspect warning quantities, negative stock, expiry, quality result, focus, disabled controls
  and changed-field fills in both themes. Color alone cannot communicate hold, shortage or failure.
- Follow finds through saved-find create/update/default/reset, offered sorting/views/columns, paging, selection,
  detail and Back. Read-only boards/calendars are not drag-to-change workflows. Facility changes must not retain an
  incompatible record, location or selection silently.
- Choose records through scoped, searchable choices; retain the selected label outside the first page. Scan the
  same code twice, an ambiguous code and a wrong-kind code. A scan is identification, not authority or proof of stock.
- Verify row dialogs with two rows, cancel/Escape/backdrop and reopen. Confirm the intended record/count and exact
  operation; repeated confirmation or lost response must not create an extra stock movement or carrier request.
- Inspect empty/loading/refused/unavailable states and retained input. Distinguish no work from a failed queue read,
  and incomplete history from zero. A repeated error must offer a usable recovery path, not require guessed IDs.
- Inspect actual CSV, XLSX, PDF and label bytes, pagination, units, names, dates, redaction and ordering. Keep physical
  label reprint distinct from buying another label; retain recorded provider attempts when the outcome is unknown.
- Check Chatter and files against the actual source record and current audience. A shipment, return, asset or work
  order that shares a visual panel must not share the wrong attachment identity or conversation.

### Waves

| Wave | Activities | Exit evidence for later execution |
| --- | --- | --- |
| W0 — Baseline and scope | WH-01–03, 35 | Isolated fixtures, role/facility boundaries, navigation and policy basis recorded; capability gaps named |
| W1 — Stock identity and handling | WH-04–09 | Traceable assets/lots/containers, moved and corrected quantities, reservations and operation retries |
| W2 — Receipt, quality and putaway | WH-10–14 | Purchase receipt/remainder handoff, tracked receipt, held stock disposition and physical destination |
| W3 — Counts and picking | WH-15–20 | Blind observations, reviewed/postable variances, picklist work, shortages and replenished pick faces |
| W4 — Pack and ship | WH-21–25 | Packages and kit issues, labels/outputs, shipment/invoice boundary and delivery evidence |
| W5 — Returns and production supply | WH-26–31 | RMA/supplier return boundaries, transfers, request allocations, vendor custody and production receipts |
| W6 — Reports and completion | WH-32–36 | Quantity/value explanations, handheld/TUI continuations, artifacts, shared handoffs and candid coverage ledger |

Exercise relevant evidence, recovery and permission branches in each wave, not only in W6. Do not consume a shared
demo record in two concurrent walks. Later review completion is assessed after the selected waves, not after every
small correction; verification cadence still follows the explicit scope and current repository rules in §5.

## 3. Screen and surface inventory

Paths below are relative to `/qapps/Warehouse`; Standard uses `/apps/Warehouse`. The source snapshot contains **89
Warehouse XML screen files including the root**, with **190 recursively reachable route instances** when physical
children and explicit local/shared mounts are enumerated: 89 local instances, seven additional Handheld aliases and
94 Shared-source instances. This is a source inventory, not a claim that every route appears in a menu or is admitted
to every role. Recompute after source changes and include any runtime screen extensions in execution reconciliation.

### Local routes and defaults

| Prefix | Local screens and section entry | Activities |
| --- | --- | --- |
| Root | `Warehouse` → `Home`; hidden `NewCount`, `InspectionCertificate` | WH-01, 13, 15, 34–35 |
| `Receiving` → `Receipts` | `Receipts`, `NewReceipt`, `Receive`, `Putaway`, `ReceiptDocument`, `PutawaySheet` | WH-10–14, 33–34 |
| `Inspection` → `Inspections` | `Inspections`, `TemplatePrint` | WH-13, 34–35 |
| `Inventory` → `Assets` | `Assets`, `AssetDetail`, `Movements`, `Lots`, `Containers`, `ContainerDetail`, `Traceability`, `Adjustments` | WH-04–08 |
| `Inventory/AssetDetail` → `Ledger` | `Ledger`, `Reservations`, `Audit`, `Files`, `Notes` | WH-04–05, 08, 34 |
| `Counts` → `Counts` | `Counts`, `CountDetail`, `CountEntry`, `CountReview`, `CountSheet` | WH-15–17, 33–34 |
| `Transfers` → `Move` | `Move`, `Repack`, `Transfers`, `NewTransfer`, `TransferSheet`, `StockRequests`, `NewStockRequest` | WH-07, 09, 28–30 |
| `Picking` → `Picklists` | `Picklists`, `PicklistDetail`, `CreatePicklists`, `Pick`, `PickLocationMoves`, `PickSheet` | WH-18–20, 33–34 |
| `Shipping` → `Shipments` | `Shipments`, `Pack`, `Ship`, `PackageTracking`, `PackingSlip`, `LabelSheet`, `Manifest` | WH-18, 21–25, 33–34 |
| `Returns` → `Returns` | `Returns`, `ReturnSlip` | WH-26–27, 34 |
| `Locations` → `Facilities` | `Facilities`, `PutawayRules`, `BoxTypes`, `Carriers`, `Printers`, `PrinterTestPage` | WH-02, 14, 21, 23–24 |
| `Handheld` → `Home` | `Home` plus the aliases below | WH-01, 33 |
| `Reports` → `ReportIndex` | `ReportIndex`, `CountVariance`, `OperationsHistory` | WH-17, 32 |
| `Settings` → `Index` | `Index`, `StockPolicies`, `ReservationPolicies`, `AssetPools` | WH-03 |
| `Settings/StockPolicies` → `OperationPolicy` | `OperationPolicy`, `TrackingPolicy`, `ProductTrackingExceptions`, `PolicyPreview`, `CountSchedule` | WH-03, 15 |
| `Settings/ReservationPolicies` → `FacilityReservation` | `FacilityReservation`, `StoreReservation`, `ReservationCheck` | WH-03, 07, 19 |
| `Settings/AssetPools` → `PoolList` | `PoolList`, `PoolDetail` | WH-03 |
| `Orders` → `OrderDetail` | Hidden section; both children are shared mounts below | WH-18, 25, 35 |

### Shared mounts, aliases and inherited children

A physical child or explicit mount is a route to inspect even when the context's tab list hides it. Review a valid
owning-app positive alongside direct-route and transition refusals. A removed tab is not the authorization boundary.
Where a nested shared tree appears twice, cover both consuming paths for context/return behavior without duplicating
all business-rule checks.

| Warehouse mount | Source and inherited surface | Activities / boundary |
| --- | --- | --- |
| `Receiving/ReceiptDetail` | `Shared/ShipmentDetail`; Warehouse purchase-receipt branch | WH-10–12, 35 |
| `Receiving/Supplier360` | `Shared/Supplier360`; physical children `Overview`, `Receiving`, `Documents`, `Conversation`, `Bills`, `Buying`, `Finance`, `PurchasingAgreements`, `PurchasingDropShip`, `PurchasingPerformance`, `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `SubcontractOrders`; explicit `Prices` → SupplierPrices and `InsightsRecord` | WH-10, 34–36; verify Warehouse's receiving/contact context and direct access to other contexts |
| `Inventory/Availability` | `Shared/InventoryAvailability` → `Summary`; children `Summary`, `Locations`, `Movements`, `Reservations`, `Projection`, `Policy` | WH-04, 07, 19, 32, 35 |
| `Inventory/Product360` | `Shared/Product360` → `Summary`; Warehouse tab set `Summary`, `Identifiers`, `Dimensions`, `Stock`, `Replenishment`, `Documents`, `History` | WH-04–05, 34–36; master read-only, stock-policy actions by grants |
| `Inventory/Product360` other inherited routes | `Associations`, `Categories`, `Connections`, `Equipment`, `Features`, `KitComponents`, `PaidAccess`, `Parties`, `PurchaseHistory`; explicit `Packaging`, `Prices`, `Suppliers`, `Costs`, `BOM`, `InsightsRecord` | WH-35–36 supporting scope inspection; tab omission does not make these sources disappear |
| `Inventory/Product360/Documents/Index` | `Shared/Documents` mounted inside `Documents` | WH-34–35; file identity and read scope |
| `Inventory/Product360/Stock` | Second mount of InventoryAvailability with its six children listed above | WH-04, 07, 32, 35–36; preserve product and facility through nested Back |
| `Inventory/Product360/BOM` | `Shared/BillOfMaterialsDetail` with `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | WH-35–36 supporting scope inspection; Warehouse context does not grant method/cost capabilities |
| `Inventory/MaterialIssueReceipt` | `Shared/MaterialIssueReceipt`, source `shipmentAssembly` or `productionRun` | WH-22, 31, 35; kit and run have different actions and valuation basis |
| `Locations/FacilityDetail` | `Shared/FacilityDetail` → `Overview`; `Overview`, `Locations`, `Children`, `Products`, `Policies`, `Schedules`, `BoxTypes`, `Printers`, `Files`, `Conversation`, `WorkCenter`, `InsightsRecord` | WH-02–03, 21, 23, 34–36; context determines offered tabs/actions |
| `Locations/EquipmentDetail` | `Shared/EquipmentDetail`, Warehouse equipment context | WH-02, 34–36; bounded operational read, no inferred asset-book authority |
| `Orders/OrderDetail` | `Shared/OrderDetail`, Warehouse fulfillment context | WH-18–19, 25, 35–36; inherited other-app transitions require their own authorization |
| `Orders/InvoiceDetail` | `Shared/InvoiceDetail`, Warehouse read/print context | WH-25, 34–36; financial details by separate read permission |
| `Shipping/ShipmentDetail` | `Shared/ShipmentDetail`, Warehouse outbound branch | WH-18–25, 35 |
| `Transfers/TransferShipmentDetail` | `Shared/ShipmentDetail`, transfer branch | WH-28, 35 |
| `Transfers/SubcontractShipmentDetail` | Same source, subcontract custody and Output receipt branch | WH-30–31, 35–36 |
| `Transfers/RequestDetail` | `Shared/RequestDetail`, stock-request branch | WH-29, 34–36; Purchasing, Projects and Customer Service transitions also exist in the shared source |
| `Returns/ReturnDetail` | `Shared/ReturnDetail`, Warehouse physical handling branch | WH-26–27, 34–36; authorization and settlement remain other capabilities |
| `Returns/ReturnReceipt`, `Returns/SupplierReturnShipment` | `Shared/ShipmentDetail`, customer-return and supplier-return branches | WH-26–27, 35–36 |
| `QualityInspection` | `Shared/QualityInspection`, hidden root read/inspection task | WH-13, 26–27, 30–31, 35 |
| `Inspection/InspectionTemplates` | `Shared/InspectionTemplates` | WH-13, 35 |
| `Reports/StockAtDate` | `Shared/StockAtDate` → `Places`; `Places`, `History` | WH-32, 35–36 |
| `Reports/InventoryValuation` | `Shared/InventoryValuation`, Warehouse options plus Accounting result template | WH-32, 35–36; no Warehouse revaluation/cost repair authority |
| `Chatter`, `Chatter/ChatterTui` | Shared Chatter browser surface and explicit terminal child | WH-34–35; record-linked discussions and activities |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared file browser surface and terminal child | WH-34–35; uploads, versions, picker and download |
| `Handheld/Move`, `/Receive`, `/Putaway` | Local aliases of `Transfers/Move`, `Receiving/Receive`, `Receiving/Putaway` | WH-07, 11, 14, 33 |
| `Handheld/Pick`, `/Pack`, `/Count`, `/PickFace` | Local aliases of `Picking/Pick`, `Shipping/Pack`, `Counts/CountEntry`, `Picking/PickLocationMoves` | WH-16, 19–21, 33 |

Hidden InsightsRecord routes are source-backed fallback surfaces, not a new Warehouse dataset or universal permission
to view a record. Inspect their current context and admitted-data behavior with the corresponding app grants in
WH-35–36. Keep unavailable/foreign-record behavior distinct from an empty permitted record.

### Dialogs, helpers, modes and outputs

| Surface family | Explicit inspection / activity |
| --- | --- |
| Root shell and quick creates | WH-01, 15, 28–29: facility picker, Home lookup, palette/record links, Today, `g q`, new receipt/count/transfer/stock request; cancel/reopen and stale IDs |
| Facility/stock dialogs | WH-02–09: create facility/location, close/reopen location, asset metadata, lot create/correction, container create/put-in/take-out/move, selected-stock Relocate, count request, adjustment preview/post, Scrap, repack |
| Receipt/quality/putaway helpers | WH-10–14: New receipt, source/line selection, generated lot/serial preview and use, ad-hoc receipt, finish/receive-all confirmations, assignment/reassignment, readings, submit/verify/dispose/reinspect/cancel, template versions, rule test/change/end |
| Count dialogs and downloads | WH-15–17: New/Edit/Cancel count, found stock, import counts and `importCountsResult`, review/recount/conflict resolution, post approved lines; blank versus zero |
| Pick and package dialogs | WH-18–22: New/Edit picklist, membership/bin/person/equipment, create wave, Short/Put back/Finish, package create/edit/move contents/reopen, complete pack and kit component packing |
| Shipping setup and task helpers | WH-23–25: carrier method/binding/test, box carrier codes, facility printer/test, address validation/rates, request/refund labels, manual tracking, print/reprint, ship confirmation, delivery recording |
| Return/transfer/request helpers | WH-26–31: new return/add eligible line/submit/create shipment, receive return, issue/ship supplier return, transfer create/pick/issue/dispatch/ship/receive, request items/approval/allocation, subcontract output and production issue/return/receive |
| Policy dialogs | WH-03, 15: tracking/product exceptions, effective operation/reservation policy, store overrides, pool members/stores, count schedule end, reservation repair preview/confirmation |
| Inline custom render modes | WH-01–36 as applicable: Counts/Counts, CountDetail, CountReview; Inspections; Assets, AssetDetail, ContainerDetail, Lots; Facilities, BoxTypes, PutawayRules; Picklists; Receipts, Putaway; Returns; PoolDetail; Shipments, LabelSheet; Move, StockRequests, Transfers |
| Template custom modes | WH-02, 10–12, 15–17, 26–31, 34–36: WarehouseCountParts, WarehouseEquipment, WarehouseReceiptDetail, WarehouseRequestDetail, WarehouseReturnDetail and WarehouseTransferDetail; inherited shared sources have their own qvt/tui behavior |
| Print documents | WH-10–36: ReceiptDocument, PutawaySheet, InspectionCertificate, TemplatePrint, CountSheet, PickSheet, PackingSlip, LabelSheet, Manifest, ReturnSlip, TransferSheet, PrinterTestPage and permitted invoice print |
| Non-page output paths | WH-04, 16, 24–25, 32, 34–35: count row-result download, Ship `labelPdf`, scoped list/report CSV; CSV/XLSX on `Inventory/Movements`, `Reports/OperationsHistory` and `Reports/StockAtDate/Places` and `/History`; printer/provider evidence, file download/version links and the `/fop` PDF route actually offered |
| Inherited price export variants | WH-35–36 supporting authorization/export inspection: `Inventory/Product360/Prices` → Shared/Prices, `Inventory/Product360/Suppliers` and `Receiving/Supplier360/Prices` → Shared/SupplierPrices declare CSV/XLSX. Pair Warehouse-context checks with valid authorized owning-app reads/exports; these sources confer no Warehouse price read/edit authority |

Warehouse has no local `.qvue` or `.tui.json` file in this snapshot. It still has mode-specific inline text, shared
browser/terminal widgets and different handheld behavior. Most local status blocks provide qvt/tui/html variants;
PoolDetail has qvt/tui, and LabelSheet has qvt/html/html-print/tui. Inspect the actual fallback for a mode rather than
infer it from plain XML. Supporting mode inspection does not require multiplying every activity by every viewport.

### Design-to-code reconciliation

| Earlier proposal or historical wording | Current treatment |
| --- | --- |
| Warehouse implementation's initial seven placeholders | Historical starting state; the full current tree and P0–P18 implementation supersede it |
| SupplyPlanning and transfer conversion listed as later | Planning services and neighboring Manufacturing/Purchasing mounts are built; Warehouse has no current SupplyPlanning route. Review the permitted handoff and transfer result; do not invent a Warehouse menu item |
| Other-app contexts/callers in Warehouse §7 | Inspect current Manufacturing material/quality, Purchasing receipt/return and Customer Service return/stock-at-date consumers; they are not all still deferred |
| TraceabilityGraph, DeliveryTrips/DeliveryTripDetail, Capacity, ExternalStockSync, automatic waves | Absent local screens; separate future work. Traceability's current bounded tree and manual picklist/wave task remain in scope |
| Camera scan, ZPL, handheld return receipt and Handheld/Repack | Not inferred from typed scan, PDF labels, mobile return layout or desktop Repack; record the actual supported route/device |
| Supplier return partial shipment, return putaway after quality release, kit unused-component return/breakdown | Check current guard and UI limits before attempting; do not promise these from neighboring production-return support |
| Stock/financial/report history | Unknown provenance and incomplete historical opening are explicit results; values and revaluation actions are independently guarded. Source/render success cannot certify completeness |
| Old spec names, locations and historical “passed” totals | Use current files and registrations in §5. Historical WarehouseShell/IsolationWalk/route-fixture statements are not proof that a same-named current spec exists |

## 4. End-to-end activities

Use visible controls and inspect intermediate states, confirmations, saved results and the next actor's view. A render,
HTTP 200 or direct service mutation is not completion. Browser means Material light/dark; TUI means actual supported
terminal interaction; Standard means the bounded functional/output/fallback check in §2. Record unattempted modes and
recovery branches. Supporting direct-route probes complement the activity, not replace it.

### WH-01 — Start a warehouse workday in the right facility

- **Actor/start:** reader and narrow operators, with one, several and no available facilities; populated and empty queues.
- **Objective/steps:** open Warehouse → select facility → inspect operation cards and Your work → follow a count,
  inspection or picklist assignment → detail/task → Back. Scan or type an asset, serial, lot, shipment and ambiguous
  code in Home; use palette, Today, record links and `g q`. Open/cancel/reopen permitted quick creates. Save and reset
  a representative find and move through offered list, board/calendar, columns, sort and pagination.
- **Expected:** current facility and queue basis are visible; destinations retain meaningful scope; inaccessible work
  is omitted; uncomputed queue measures say unavailable; new forms do not inherit another record's identifier.
- **Recovery:** no matches, lost facility access, failed independent queue source, deleted recent record, wrong-kind
  code and facility preference no longer in scope. Read-only users still get useful navigation.
- **Screens/modes:** Home, section defaults, shell, quick creates and Handheld/Home; browser/TUI/Standard,
  narrow/keyboard/zoom samples; continue individual records in their owning activities.

### WH-02 — Maintain a facility and inspect its equipment

- **Actor/start:** facility administrator and reader; facility tree, open/closed locations, stocked bin and empty bin.
- **Objective/steps:** Locations → Facilities list/tree → create a disposable facility → FacilityDetail → Overview,
  Locations and Children → add/edit locations and hierarchy → close an empty location and inspect its history.
  Read Products, Policies, Schedules, Box types and Printers, and follow the forklift to EquipmentDetail's operator,
  maintenance, files and conversation. Return through the originating facility.
- **Expected:** hierarchy, owner and effective status stay clear; readers see the same record with fewer actions;
  occupied locations cannot be closed as if empty; equipment is distinguishable from ordinary inventory stock.
- **Recovery:** inaccessible parent, duplicate/invalid location, attempted close with stock, expired facility/location,
  unavailable equipment and canceled edit. Hidden WorkCenter/InsightsRecord routes get bounded scope checks.
- **Screens/modes:** Locations/Facilities, FacilityDetail and all inherited tabs, EquipmentDetail; browser/TUI/Standard,
  phone tree/detail and keyboard navigation; outputs and evidence continue in WH-23/34.

### WH-03 — Explain and change stock policies without losing their basis

- **Actor/start:** planner, manager and reader; organization/facility defaults, store override and product exception.
- **Objective/steps:** Settings → Stock policies → inspect effective operation/tracking policy and source → change an
  allowed dated row → PolicyPreview → compare organization/facility/product precedence. Open ReservationPolicies,
  inspect facility timing and store override, preview ReservationCheck and confirm a permitted repair. Create a pool,
  add/change its party/store members, and return to a stock consumer using the resulting policy.
- **Expected:** the source/effective date of a decision is readable; edits preserve history; a store override applies
  only to its orders; repair names its affected work and outcome; pool membership stays in the user's organizations.
- **Recovery:** overlapping/expired rows, selected record outside first choice page, unsupported choice, stale repair,
  missing facility, canceled change and reader/direct-write refusal. Settings alone do not grant stock handling.
- **Screens/modes:** Settings/Index, all StockPolicies/ReservationPolicies/AssetPools children, FacilityDetail/Policies;
  browser/TUI/Standard, keyboard/zoom and wide-policy layout samples; count schedules continue in WH-15.

### WH-04 — Find physical stock and explain an asset's balance

- **Actor/start:** physical reader, adjuster and separately composed financial reader; stock across statuses/facilities.
- **Objective/steps:** Inventory → Assets → filter/group by product, lot and place → AssetDetail/Ledger → follow its
  receipt and issuance → Reservations/Audit → Back. Open Product360's physical tabs and Stock/Availability Summary,
  Locations, Reservations, Movements, Projection and Policy; vary the authorized facility and inspect units. Export
  Inventory/Movements as CSV and XLSX; inspect the files against the active filters, columns and permitted amounts.
- **Expected:** available/reserved/held/quarantine/in-transit meanings agree across lists and detail; restricted cost
  never appears in ordinary responses or exports; the physical Product360 context offers no master/price/method edits.
- **Recovery:** zero/missing stock, unavailable product, changed facility, empty projection, incomplete source history
  and a saved find whose selected value is no longer permitted. Edit metadata only with its allowed fields.
- **Screens/modes:** Assets, AssetDetail and five tabs, Product360, both Availability mounts and six children;
  browser/TUI/Standard, phone columns and wide/long names; WH-35 checks inherited non-Warehouse routes.

### WH-05 — Trace a lot or serial and correct its metadata deliberately

- **Actor/start:** reader, receiver and quality manager; purchased/sold lot, expired lot, serial and unknown provenance.
- **Objective/steps:** Lots → find by printed lot number → asset buckets → Traceability → expand upstream/downstream
  occurrences → open receipt, issue or source document → Back. Create a lot as receiver; correct permitted lot
  metadata/expiry with a reason as the proper holder; inspect correction history and expiry list.
- **Expected:** repeated nodes/cycles are bounded and understandable; each occurrence links to the right record;
  unknown provenance is explicit; quantities and identities survive a metadata correction; expiry authority is separate.
- **Recovery:** no original receipt, restricted neighbor node, excessively deep trace, ambiguous scan, unavailable lot,
  invalid expiry or unauthorized extension. Restricted nodes must not expose foreign names or values.
- **Screens/modes:** Lots, Traceability, Movements, AssetDetail/Audit, Product360/Identifiers and History;
  browser/TUI/Standard, keyboard tree and phone/zoom samples; export evidence in WH-34.

### WH-06 — Put stock in a container and move the whole container

- **Actor/start:** mover and reader; empty container, two contents, stock elsewhere and an incompatible destination.
- **Objective/steps:** Containers → New container → ContainerDetail → Put stock in → Take out part → reattach → Move
  container → inspect every content's new place and ledger. Scan container from Home or Move and return to its detail.
- **Expected:** container identity, place and contents remain coherent; adding stock requires the intended location;
  whole-container movement has a clear count/result and preserved ownership, tracking and restrictions.
- **Recovery:** stock at another location, capacity/closed destination, held/quarantined content, stale content list,
  canceled Move and repeat submit. An all-or-nothing container operation must not be described as an independent batch.
- **Screens/modes:** Containers, ContainerDetail, Move, Assets and Movements; browser/TUI/Standard,
  repeated row-dialog identities, phone controls and scanner focus.

### WH-07 — Move individual stock or relocate a mixed selection

- **Actor/start:** mover; available, reserved and quarantined stock, open and closed bins, one deliberately invalid row.
- **Objective/steps:** Transfers → Move → scan source asset/location → select destination → enter quantity/unit →
  review warnings → move → inspect recent movement and source/destination balances. From Assets or Availability select
  several records → Relocate → include one invalid item → inspect each result and retry only unresolved work.
- **Expected:** partial moves preserve tracking/owner/cost basis; reserved/held stock constraints are explained;
  repeated operation returns its first result; independent relocation failures name the row while others proceed.
- **Recovery:** wrong facility/kind scan, quantity above free stock, quarantined stock aimed at a pick bin, closed bin,
  concurrent reservation, stale page, lost response and canceled confirmation. Do not imply a move releases quality hold.
- **Screens/modes:** Move and Handheld/Move, Assets, Availability/Locations, ContainerDetail, Movements;
  browser/TUI/Standard, keyboard wedge, narrow and focus-after-success/refusal.

### WH-08 — Post a justified adjustment or scrap with an audit trail

- **Actor/start:** adjuster, financial reader and reader; one counted bucket, expired stock and open/locked dates.
- **Objective/steps:** AssetDetail or Inventory/Adjustments → preview a counted quantity → inspect difference/reason
  and permitted value → confirm post → inspect ledger/audit and remaining reservations. From Lots/Adjustments choose
  Scrap → review quantity, destination and reason → post → inspect morgue/disposition and financial handoff.
- **Expected:** count-to-quantity adjustment and scrap are distinct operations; reasons and dates persist; operation
  retry does not repost; restricted value is omitted; refused posting leaves balances and previous history intact.
- **Recovery:** negative/invalid quantity, stale preview after a second movement, closed fiscal date, missing mapping,
  insufficient authority and reserved stock after a decrease. Record any remaining reservation-repair limitation.
- **Screens/modes:** Adjustments, Lots, AssetDetail/Ledger/Audit, Movements and permitted Accounting source link;
  browser/TUI/Standard, confirmation/keyboard/zoom; no historical repair is implied.

### WH-09 — Repack between supported packaging units

- **Actor/start:** mover and financial reader; `BOSS_WH_SEAL_CASE` with lot/expiry and a supported pack hierarchy.
- **Objective/steps:** Transfers → Repack → scan stock → select unpack/pack direction and target level → review factor
  and quantity → confirm → inspect source/result stock, lot and ledger; return to the physical product identifiers.
- **Expected:** exact factor and entered/stock units are visible; ownership and tracking carry forward; value nets
  across the supported repack; repeating the same operation does not duplicate stock.
- **Recovery:** incompatible product/pack, fractional result that violates serial rules, missing conversion, held stock,
  shortage, stale source and canceled confirmation. Do not mistake kit breakdown for packaging repack.
- **Screens/modes:** Repack, Product360/Identifiers/Dimensions, Assets and Movements; browser/TUI/Standard,
  phone/keyboard samples. There is no separate Handheld/Repack route in this snapshot.

### WH-10 — Prepare a purchase receipt and follow supplier evidence

- **Actor/start:** receiver and reader; approved purchase part, second already-open receipt and supplier in scope.
- **Objective/steps:** Receiving → Receipts → New receipt → select order part/facility → Open receipt → inspect
  ReceiptDetail and expected lines → repeat New receipt for the same part → confirm it reopens the existing receipt.
  Follow Supplier360's receiving context and receipt/rejection evidence, then return. Repeat entry from quick create
  and the Purchasing Prepare receipt handoff with a properly composed actor.
- **Expected:** one open receipt is reused; source order/part, facility, due quantities and unit basis are clear;
  commercial purchasing authority is not inferred from Warehouse root access; supplier prices stay restricted.
- **Recovery:** completed/canceled/non-purchase order, nothing due, selected part outside first choice page,
  foreign supplier/facility and another actor creating the receipt first. New never means duplicate receipt.
- **Screens/modes:** Receipts, NewReceipt, ReceiptDetail, Supplier360/Overview/Receiving and permitted supporting tabs;
  browser/TUI/Standard, find dialog, keyboard and phone; receipt output in WH-12/34.

### WH-11 — Receive tracked goods, rejects or an ad-hoc delivery

- **Actor/start:** receiver; lot-tracked, serialized, plain and alternative-unit lines; rejected quantity with reason.
- **Objective/steps:** ReceiptDetail → Receive → choose/scan line → enter accepted/rejected quantities and unit →
  lot/expiry/serials and destination → receive → inspect receipt history and stock state. Preview generated serials/lots,
  inspect duplicates and use a valid selection. Receive an authorized ad-hoc stocked product with owner/reason, then
  inspect its stated cost source without exposing cost to the ordinary receiver.
- **Expected:** entered and stock units remain distinguishable; one serial per accepted unit and required lot/reason
  are enforced; accepted/rejected receipts explain their stock effect; repeated operation answers the first result.
- **Recovery:** wrong product, over-receipt, duplicate/missing serial, invalid conversion, expired/closed destination,
  refused supplied cost and a mixed generated range. Inspect each returned row rather than assume all lots succeeded.
- **Screens/modes:** Receive, Handheld/Receive, ReceiptDetail, Assets and QualityInspection where created;
  browser/TUI/Standard, scanner/keyboard, 390px and focus after success/error.

### WH-12 — Finish a short receipt or backorder its remainder

- **Actor/start:** receiver and buyer; partial receipt, untouched tracked line, distinct open/backorder copies.
- **Objective/steps:** ReceiptDetail/Receive → inspect accepted/rejected/due → Finish → choose close or backorder with
  reason → confirm → inspect old/new receipt, order remainder and exception notice. On separate plain-stock data use
  Receive all as expected and inspect its confirmation, delivered state and permitted self-billing/match consequence.
- **Expected:** close/backorder affect only the intended remainder; no received quantity disappears; the order and
  receipt states agree; receive-all refuses tracking it cannot obtain; self-billing depends on the supplier policy.
- **Recovery:** missing reason, nothing due, concurrent revision/receipt, tracked line in receive-all, canceled finish,
  closed date and lost response. Inspect the downstream bill/match with its authorized actor, not as the receiver.
- **Screens/modes:** Receive, ReceiptDetail, Receipts, ReceiptDocument, bounded Purchasing order/receipt and Accounting
  bill/match handoff; browser/TUI/Standard and actual print/PDF bytes.

### WH-13 — Inspect held stock and dispose it with the right authority

- **Actor/start:** inspector, quality manager and reader; draft template, published version and quarantined receipt.
- **Objective/steps:** Inspection → Inspections → assign/reassign → QualityInspection → record required readings and
  evidence → submit → independent verification → dispose accepted portion and scrap/return the rest → inspect stock,
  source receipt and remaining held quantity. Reinspect a supported case; create/change a template and inspect the
  new version's effect on a later inspection, then print certificate/template.
- **Expected:** sample and inspected quantities, units/tolerances, result, verification and disposition are separate;
  the inspector cannot act as verifier by changing the URL; published characteristics retain history; release is clear.
- **Recovery:** missing/out-of-range reading, incomplete sample, stale assignment, partial disposition, canceled
  inspection, another organization's source and reader opening hidden root detail without Inspection-area access.
- **Screens/modes:** Inspections, QualityInspection, InspectionTemplates, InspectionCertificate, TemplatePrint,
  receipt/return/production sources; browser/TUI/Standard, board/read-only behavior, phone and outputs.

### WH-14 — Put received stock away and explain the destination

- **Actor/start:** mover, facility administrator and reader; receiving-held stock, a full default bin and matching rule.
- **Objective/steps:** Receiving → Putaway → scan/filter stock → inspect suggested destination and rejected alternatives
  → accept suggestion → verify held stock's permitted release and balance. Try an allowed alternative with reason.
  Locations → PutawayRules → test a rule → add/change/end a dated rule → return to the queue and inspect its effect.
- **Expected:** the operator can explain why a bin was suggested or refused; capacity and product constraints are
  visible; successful putaway removes the right queued quantity and returns scan focus; retry moves nothing twice.
- **Recovery:** no fitting location, full/closed destination, unsupported stock state, changed capacity, missing
  override reason and lost permission. A customer-return inspection release is not silently a putaway workflow.
- **Screens/modes:** Putaway, Handheld/Putaway, PutawaySheet, PutawayRules, AssetDetail and facility locations;
  browser/TUI/Standard, phone/scan/keyboard and actual sheet output.

### WH-15 — Plan a count from due work or selected stock

- **Actor/start:** counter, planner/manager and reader; due schedule, selected asset set and a fresh empty-bin count.
- **Objective/steps:** Counts → Due saved find → New count → choose scope, assignee and blind setting → CountDetail →
  Edit/cancel a draft copy → Start intended count. Repeat creation from Assets' Request a count and root NewCount
  quick create. Change/end an allowed count schedule and inspect the resulting due-work explanation.
- **Expected:** scope and snapshot point are clear; NewCount uses count authority, not review-only area access;
  due work reaches the right actor through Home/Today; creating a count does not post an adjustment.
- **Recovery:** no matching stock, expired schedule, invalid scope/assignee, already-started count, canceled dialog and
  count-reviewer attempting quick create without count authority. Separate a legitimate empty-bin count from no scope.
- **Screens/modes:** Counts, CountDetail, NewCount, CountSheet, Assets, StockPolicies/CountSchedule, Home;
  browser/TUI/Standard, quick-create keyboard and print-sheet confidentiality.

### WH-16 — Enter a blind count and recover from row import errors

- **Actor/start:** counter; started blind count with two lines, empty bin, found stock and mixed-validity CSV.
- **Objective/steps:** CountDetail → CountEntry → scan location/product/asset → record quantity → distinguish zero,
  blank and skip with reason → add found stock → save several desk rows → import counts → inspect named row failures
  and download result → correct/retry unresolved rows → submit. Repeat representative entries on Handheld/Count.
- **Expected:** observations do not adjust stock; blind expected quantities are withheld from server responses,
  scans, print and exports; operation retry is one observation; successful independent rows survive an invalid row.
- **Recovery:** duplicate observation, wrong asset/location, unknown CSV column/value, canceled upload, stale count,
  revoked permission, concurrent physical movement and navigation away from an unsaved row.
- **Screens/modes:** CountEntry, Handheld/Count, importCountsResult, CountDetail and CountSheet;
  browser/TUI/Standard with explicit upload/download delegation where terminal needs it; 390px one-line navigation.

### WH-17 — Review count variance, recount conflicts and post approved lines

- **Actor/start:** reviewer and separate adjuster; submitted count with variance, held line and intervening movement.
- **Objective/steps:** Counts → CountReview → inspect expected/observed/variance basis → review or request recount →
  resolve a supported conflict → inspect returned observations → approve intended lines → adjuster previews date and
  confirms Post approved lines → inspect status, resulting ledger and CountVariance report.
- **Expected:** reviewer/adjuster responsibilities remain distinct; approved selection and posting date are named;
  conflict handling is explicit; posted lines cannot be counted twice through retry; report links explain the variance.
- **Recovery:** unresolved conflict, stale review, partly approved count, closed posting period, canceled post and
  reader/counter direct-write refusal. Refused dependent posting must not leave a half-applied count.
- **Screens/modes:** CountDetail, CountReview, CountEntry, CountVariance, Movements and permitted ledger handoff;
  browser/TUI/Standard, repeated Resolve dialogs, keyboard/zoom and actual report export.

### WH-18 — Prepare outbound work and organize a picklist

- **Actor/start:** pick supervisor, picker and reader; approved order with reservations and separate eligible shipments.
- **Objective/steps:** hidden OrderDetail through a legitimate order link → inspect fulfillment → create permitted
  outgoing shipment → Shipping/Shipments → Picking/CreatePicklists → choose eligible work and create wave → Picklists
  → PicklistDetail → add/remove shipment membership, set bin and assign person/equipment → inspect queued work.
- **Expected:** order part, shipment and load identities stay visible; selected quantities and reservations agree;
  manual wave creation is distinct from deferred automatic waves; assignments do not create stock authority.
- **Recovery:** held/canceled order, no reservation, no eligible work, stale selected shipment, invalid assignment,
  foreign facility and canceled membership change. Read-only board/calendar must not suggest unsupported dragging.
- **Screens/modes:** Orders/OrderDetail, Shipments, ShipmentDetail, Picklists, CreatePicklists, PicklistDetail,
  PickSheet and Home/Today; browser/TUI/Standard, long membership lists, keyboard and print.

### WH-19 — Pick, report a shortage and put stock back

- **Actor/start:** picker and customer-service continuation actor; picklist with reserved stock and a short location.
- **Objective/steps:** PicklistDetail → Pick → select/scan work and source → pick part → Short with reason → inspect
  short-pick result/recount work and unchanged on-hand for the shortage → Put back a picked quantity → finish the
  permitted work. Follow the affected order/change proposal with its separate actor, then return to fulfillment.
- **Expected:** picked, short, put-back and remaining quantities are distinct; stock is not decremented merely because
  a shortage was reported; next scan focus is stable; source reservation and any customer change remain traceable.
- **Recovery:** wrong location/product, held/expired stock, quantity above reservation, already-picked source, canceled
  finish and lost response. A customer substitution requires its guarded order-change flow, not a Warehouse edit.
- **Screens/modes:** Pick, Handheld/Pick, PicklistDetail, ShipmentDetail, OrderDetail and permitted Customer Service
  handoff; browser/TUI/Standard, 390px scan/keyboard and one-primary-action checks.

### WH-20 — Replenish the pick face without confusing movement and allocation

- **Actor/start:** mover; facility with a short pick face, eligible bulk stock and unavailable/held alternatives.
- **Objective/steps:** Picking → PickLocationMoves → inspect demand and available source → choose source/destination
  → move the suggested quantity → inspect pick-face balance and return to pick work. Repeat from Handheld/PickFace.
- **Expected:** the UI explains which stock physically moved and why; reservations/availability are preserved by the
  guard; destination is the intended pick bin; completing the task is not a new supply-plan purchase or make order.
- **Recovery:** no eligible source, full/closed pick bin, stock changed by another mover, expired lot, wrong unit,
  canceled confirmation and operation retry. An unavailable suggestion must leave the operator's work recoverable.
- **Screens/modes:** PickLocationMoves, Handheld/PickFace, Assets, Availability and Move history;
  browser/TUI/Standard, phone controls and keyboard scan sequence.

### WH-21 — Pack a shipment and handle a permitted reopening

- **Actor/start:** packer and reader; picked shipment, two cartons, partly packed copy and distinct invoice policies.
- **Objective/steps:** ShipmentDetail → Pack → select/scan work → pack quantities → create/edit packages and weights
  → move contents between packages → Complete pack → inspect package totals and invoice consequence. On a separate
  eligible draft-invoice fixture reopen a package, make a change and complete again; inspect a finalized-invoice refusal.
- **Expected:** source stock, package contents and packed total agree; packing does not silently buy carrier labels;
  invoice timing is explained by the organization's policy; reopen releases the permitted draft through its service.
- **Recovery:** not picked/overpacked stock, wrong carton/unit, zero/missing weight where required, changed invoice,
  canceled complete/reopen and repeat submit. A refused reopen preserves the package and financial document.
- **Screens/modes:** Pack, Handheld/Pack, ShipmentDetail, BoxTypes, PackingSlip and permitted InvoiceDetail;
  browser/TUI/Standard, two package-row dialogs, phone/keyboard/zoom and output inspection.

### WH-22 — Pack a kit from its component stock

- **Actor/start:** packer; kit shipment with required components, shortages and component-cost policy fixture.
- **Objective/steps:** Pack → open the kit's MaterialIssueReceipt → inspect required/packed/remaining components →
  pack each eligible component → return to shipment packing → inspect resulting kit/package and movement evidence.
- **Expected:** component quantities and units are clear; the kit is built through the supported guarded assembly
  path; component cost behavior follows the organization's policy; a retry does not issue components twice.
- **Recovery:** missing component, wrong facility/lot, held or insufficient stock, stale component quantity and canceled
  action. Do not imply that production unused-material returns provide kit breakdown or unused-component return.
- **Screens/modes:** MaterialIssueReceipt with shipment assembly source, Pack, AssetDetail/Movements, PackingSlip;
  browser/TUI/Standard and narrow/keyboard samples, with costs inspected only by their holder.

### WH-23 — Configure cartons, carriers and local printer behavior

- **Actor/start:** facility administrator, Warehouse administrator and reader; synthetic carrier account and local sink.
- **Objective/steps:** Locations → BoxTypes → add/edit a carton and carrier code → FacilityDetail/BoxTypes → verify
  consumer. Carriers → inspect masked binding → edit allowed method/gateway binding → test rates. FacilityDetail/Printers
  → configure supported printer → Printers → Test → inspect PrinterTestPage and the actual local delivery result.
- **Expected:** facility setup and carrier authority remain separate; credentials are masked and excluded from ordinary
  responses; carton dimensions/weight units and printer purpose are clear; failures preserve a usable test artifact.
- **Recovery:** unavailable carrier, invalid account/method, missing printer endpoint, failed delivery, stale binding,
  unauthorized setup and canceled change. A passing PDF render is not a successful physical printer test.
- **Screens/modes:** BoxTypes, Carriers, Printers, PrinterTestPage, FacilityDetail/BoxTypes/Printers;
  browser/TUI/Standard, keyboard/dialog layout and actual test-page bytes; no external charge or printer job.

### WH-24 — Buy synthetic labels, recover printing and ship once

- **Actor/start:** shipper; packed shipment, synthetic rate/label provider, valid/invalid address and failed local printer.
- **Objective/steps:** ShipmentDetail → Ship → inspect address/packages → Validate address → choose a rate → request
  labels → inspect attempt/status/artifacts → Print → handle failure with Reprint or LabelSheet/PDF → confirm Ship.
  Use a separate copy to refund a supported label and another for manual tracking. Inspect invoice finalization where
  the organization's ship-time policy applies and captured outbound notice evidence.
- **Expected:** rating, label purchase, printing and shipment completion are visibly separate; retry/unknown outcome
  does not buy another label blindly; package/shipment identity is on every artifact; shipping posts once.
- **Recovery:** invalid address, stale package/rate, provider decline/unknown result, failed printer, canceled ship,
  expired grant and lost response. Record unreconciled provider outcomes honestly and keep safe reprint available.
- **Screens/modes:** Ship, ShipmentDetail, LabelSheet, Manifest, `labelPdf`, InvoiceDetail and captured provider records;
  browser/TUI/Standard, keyboard/zoom and inspected PDF bytes, not filenames alone.

### WH-25 — Track delivery and follow shipment documents back to the order

- **Actor/start:** shipper, reader and separate financial reader; shipped multi-package shipment with partial delivery.
- **Objective/steps:** PackageTracking → find shipment/carrier/date → refresh supported tracking → record a delivery
  manually with its date/evidence where allowed → inspect package and overall shipment states → open ShipmentDetail,
  OrderDetail and InvoiceDetail → print permitted invoice/packing slip/manifest → return to the filtered tracking list.
- **Expected:** one package delivered is not the whole shipment until the defined completion condition; recorded and
  effective dates are understandable; physical readers see permitted document context without restricted amounts.
- **Recovery:** provider unavailable, missing/duplicate tracking, contradictory delivery, canceled manual entry,
  stale shipment, foreign record and a financial read grant removed before download.
- **Screens/modes:** PackageTracking, ShipmentDetail, Orders/OrderDetail/InvoiceDetail, PackingSlip, Manifest;
  browser/TUI/Standard, phone tracking rows, keyboard and exact exported/printed fields.

### WH-26 — Receive a customer RMA and hand it to quality and settlement

- **Actor/start:** receiver, inspector, customer-service authorizer and Accounting settlement holder; authorized RMA.
- **Objective/steps:** Returns → ReturnDetail → inspect authorized items/quantity and customer source → create/open
  ReturnReceipt → receive first box with accepted/rejected quantities, tracking, reason and quarantine location →
  receive remaining box → inspect separate receipts and inspections → quality disposition → view settlement progress
  with its authorized actor. For a draft, add an eligible order item and submit for authorization before receipt.
- **Expected:** physical receipt retains authorized quantity and cumulative received quantity; accepted stock is
  quarantined with inspection on the keyed Warehouse path; receiving/disposition does not automatically settle credit,
  refund or replacement. Warehouse presents settlement as read-only evidence.
- **Recovery:** excess receipt, wrong/closed item, missing quarantine/lot/serial, missing reason, settlement policy off,
  duplicate operation and partial arrival. Refused receipt cannot consume authorization or hide the second box.
- **Screens/modes:** Returns, ReturnDetail, ReturnReceipt, QualityInspection, ReturnSlip and bounded Customer Service/
  Accounting handoffs; browser/TUI/Standard and phone list. No Handheld/ReturnReceipt route is assumed.

### WH-27 — Send supplier-return stock back without settling it

- **Actor/start:** quality disposer, shipper and buyer; supplier return tied to an eligible receipt and held stock.
- **Objective/steps:** Returns → supplier ReturnDetail → add eligible receipt evidence and submit/obtain authorization
  through the proper actor → SupplierReturnShipment → select permitted stock → Send back → inspect issued quantity
  and disposition → ship with tracking → inspect ReturnShipped and Purchasing/Accounting continuation.
- **Expected:** stock, original receipt and supplier remain traceable; disposed/removed quantities affect matching
  consistently; shipping physical goods does not create a settlement or replacement order by itself.
- **Recovery:** stock not tied to the allowed disposition, wrong facility/owner, insufficient issued quantity,
  unauthorized approval, already-shipped return, partial shipment limit and canceled ship. Record unsupported partial
  shipment as a limit after current-source reconciliation, not a successful return.
- **Screens/modes:** Returns, ReturnDetail, SupplierReturnShipment, QualityInspection, ReturnSlip and permitted
  Purchasing receipt/return/match links; browser/TUI/Standard, repeated line dialogs and output inspection.

### WH-28 — Transfer stock between facilities and receive it in parts

- **Actor/start:** mover, issuer/shipper and destination receiver; two facilities of one owner and eligible source stock.
- **Objective/steps:** Transfers → New transfer → choose origin/destination/products → TransferShipmentDetail → pick
  if used → issue/send stock → Ship → inspect in transit → receive part at destination → receive remainder → inspect
  delivered state, source/destination stock and TransferSheet. Repeat create entry from quick create.
- **Expected:** sent, transit and received quantities derive from the same line's evidence; destination does not show
  available stock before receipt; tracking/owner and permitted cost basis carry forward; retry returns prior operation.
- **Recovery:** same/foreign/closed facility, held source, shortage, canceled shipment, receive before ship, over-receipt,
  missing reject reason and short-ship choice. A transfer is distinct from a custody movement with no transit step.
- **Screens/modes:** Transfers, NewTransfer, TransferShipmentDetail, TransferSheet, receiving queue and Assets;
  browser/TUI/Standard, board/calendar, keyboard and physical document signatures.

### WH-29 — Approve and allocate a stock request

- **Actor/start:** Warehouse requester, policy planner and mover; draft request with item at another facility.
- **Objective/steps:** StockRequests → New stock request → RequestDetail → add stocked items/quantities → submit →
  planner approves → mover allocates locally by move or from another facility by transfer → inspect requested,
  approved, allocated, sent, in-transit, received and remaining progress → complete when permitted.
- **Expected:** approval creates traceable requirements; allocation is distinguishable from physical receipt;
  Requirement/transfer links and current app context remain coherent; ordinary requesters cannot approve themselves
  merely because they created the record.
- **Recovery:** missing facility/items, non-stock product, closed request, duplicate allocation, quantity above approval,
  changed available stock and canceled approval/allocation. Inspect current buy/make planning links only where built.
- **Screens/modes:** StockRequests, NewStockRequest, RequestDetail, TransferShipmentDetail and relevant supply-plan
  continuation in its owning app; browser/TUI/Standard, quick-create and keyboard/phone samples.

### WH-30 — Dispatch vendor-custody material and receive subcontract output

- **Actor/start:** mover and production issuer, with Manufacturing/Purchasing counterparts; linked run/operation/service PO.
- **Objective/steps:** Transfers → subcontract dispatch → SubcontractShipmentDetail → inspect custodian and linked
  service line → move components to the vendor facility or use the supported transit path → inspect Custody at supplier.
  Output receipt → review quantity, material actuals where offered, destination/tracking and service acceptance →
  Receive and accept → inspect material issues, output receipt, inspection, ServiceAcceptance and accrual evidence.
- **Expected:** custody stock remains owned by the organization; a custody move is not consumption. The output path
  requires **STOCK_ISSUE**, issues vendor components and receives at the production basis, not the service PO price;
  service acceptance and outside-processing accrual occur once under the operation, pending financial cost close.
- **Recovery:** wrong custodian, canceled/non-service PO, missing component stock, over-output/acceptance, foreign run,
  invalid actual line and repeated request. A failed dependent transaction must not leave orphan acceptance or output.
- **Screens/modes:** Transfers, SubcontractShipmentDetail, MaterialIssueReceipt, inspection and bounded Manufacturing/
  Purchasing/Accounting links; browser/TUI/Standard, quantity/unit dialog, keyboard and trace evidence.

### WH-31 — Issue production material, return unused stock and receive output

- **Actor/start:** issuer/material operator and financial reader; released run with frozen material/output lines.
- **Objective/steps:** authorized run link → Inventory/MaterialIssueReceipt with production source → inspect method,
  operation and required/issued/returned/remaining → issue selected stock → receive partial output with lot/serials
  and destination → inspect tracking/inspection → return eligible unused material → inspect new receipt and remaining
  WIP/output basis. Follow Manufacturing run/cost evidence and Accounting's cost-close continuation as their actors.
- **Expected:** **STOCK_ISSUE** governs issue, unused return and production output; movement retains run/line/operation.
  Unused material creates a receipt linked to its issuance; it does not erase history. Standard/provisional basis and
  quality hold are visible as permitted; output receipt is not cost close and existing movements are not reposted there.
- **Recovery:** unreleased/closed run, wrong line/owner, held stock, over-issue/output, unavailable cost, provisional
  return limits, duplicate serial, changed run and operation retry. By-product or amendment limits are explicit.
- **Screens/modes:** MaterialIssueReceipt, AssetDetail/Movements, QualityInspection and bounded Manufacturing/
  Accounting continuation; browser/TUI/Standard, long line tables, repeated dialogs and keyboard/zoom.

### WH-32 — Explain quantity history and the permitted inventory value

- **Actor/start:** reader and separate financial reader; multi-unit stock, complete/incomplete history and dated movements.
- **Objective/steps:** Reports → StockAtDate → choose date/facility/product/lot → Places → History → open movement and
  source → return → compare opening/receipts/issues/adjustments/closing. OperationsHistory → choose movement/document
  date basis and operation → drill to shipment/movements. Open InventoryValuation with and without financial read,
  inspect valuation basis and allowed result links, and export the actual supported rows. Compare CSV and XLSX from
  OperationsHistory and both StockAtDate/Places and StockAtDate/History with their selected columns, date/facility
  filters, unit totals and permitted amounts. XLSX on these forms does not imply every report offers it.
- **Expected:** each unit totals separately; unknown opening is not zero; effective/recorded dates and truncation are
  explicit; Warehouse valuation omits revaluation/repair actions and refuses values without ACCOUNTING_VIEW.
- **Recovery:** future/inverted dates, missing prior audit history, foreign facility, expired grant before export,
  unavailable source document and a large paged result. Do not equate an inventory quantity report with book valuation.
- **Screens/modes:** ReportIndex, StockAtDate/Places/History, OperationsHistory, CountVariance, InventoryValuation,
  Assets/Movements and authorized journal/source links; browser/TUI/Standard, phone/zoom and inspected CSV/PDF, plus
  the XLSX workbooks offered by Movements, OperationsHistory and both StockAtDate tabs.

### WH-33 — Complete supported work at handheld density

- **Actor/start:** each required narrow operator on independent copies of the earlier activities; keyboard-wedge/typed scan.
- **Objective/steps:** Handheld/Home → choose facility → scan/choose task → Move, Receive, Putaway, Pick, Pack, Count and
  PickFace → perform the representative successful operation from its owning activity → trigger one meaningful refusal
  → recover → finish/back to Home. Include repeated scans, a two-match selector and switching tasks after a dialog.
- **Expected:** actual inherited handheld density supplies readable labels/quantities and 48px controls; next-scan
  focus is restored; status and feedback stay visible; stale scan or async response cannot act on the next task.
- **Recovery:** disconnected/lost response, ambiguous/wrong-kind scan, out-of-scope facility, unsubmitted quantity,
  keyboard overlap and canceled confirmation. No camera, return-receipt or Repack mount is invented.
- **Screens/modes:** all eight Handheld paths; Material light/dark at 390px and relevant narrow layout, keyboard and
  actual TUI scan/selection behavior. Mark any physical scanner/device check unavailable separately.

### WH-34 — Keep evidence and outputs attached to the correct record

- **Actor/start:** permitted reader/editor and outsider; asset, facility, shipment, return, count and production records.
- **Objective/steps:** from each relevant owning activity open Files/Conversation → add permitted evidence or note →
  inspect audience/record identity → version/download/reopen where supported → follow notification back. Inspect each
  listed print/helper from §3 and compare artifact identity, lines, units, scope and page breaks to the record shown.
  Open the Movements, OperationsHistory and StockAtDate/Places/History XLSX workbooks and their CSV counterparts;
  check actual rows/cells, selected columns, active filters and restricted-amount omission, not only the download
  name or extension. Inherited price-export authority is examined separately in WH-35–36.
- **Expected:** source and return links preserve the exact record; file/version controls and conversations honor its
  authority; outputs preserve columns, empty cells and ordering and omit restricted values and action-only fields.
- **Recovery:** removed/inaccessible record, denied download, unavailable renderer, failed upload, unsupported type,
  repeated attachment action and long/multipage document. A filename/notification alone does not prove its contents.
- **Screens/modes:** Chatter/ChatterTui, RecordFiles/RecordFilesTui, asset/facility/supplier/Product360 document mounts,
  all print/output paths; browser/TUI/Standard with actual bytes and terminal delegation limits recorded.

### WH-35 — Reconcile permission, organization and facility boundaries

- **Actor/start:** narrow holders/non-holders, no-root capability-only user and a second organization's valid records.
- **Objective/steps:** pair each selected positive activity with its meaningful refusal; check direct hidden/inherited
  routes and transitions, selected-value searches, scans, palette, record links, notices, files and exports. Switch
  FacilityActive and organization; test a foreign record and a missing record; inspect permitted read-only actions.
  Include CSV/XLSX on inherited Product360/Prices, Product360/Suppliers and Supplier360/Prices sources: pair each
  Warehouse-context refusal/omission check with an otherwise-valid authorized owning-app read/export. Inspect
  returned cells as well as controls; inherited sources do not grant Warehouse price reading or editing.
- **Expected:** root/area access and operation permissions remain independent; preferences/context do not grant scope;
  foreign identities and financial values stay out of responses; no Warehouse role gains return authorization,
  settlement, invoice release or revaluation from a shared route.
- **Recovery:** grant revoked after preview, moved record, inaccessible selected value and cached route/data after
  identity change. Use otherwise-valid requests and compare reason codes where available, not arbitrary errors.
- **Screens/modes:** inventory, hidden children and output paths in §3, including InsightsRecord fallbacks;
  browser/TUI/Standard samples. A full role/route isolation walk belongs in acceptance, not duplicated regressions.

### WH-36 — Preserve cross-app continuity and close remaining coverage gaps

- **Actor/start:** composed actors with only the needed app and operation grants, matched organization/facility fixtures.
- **Objective/steps:** follow Purchasing → receipt/inspection/return → matching; Manufacturing → stage/issue/vendor
  custody/output → cost close; Customer Service → RMA/quality → settlement; Products → stock/policy; and permitted
  Insights/source links. Use cold entry, Back/Forward, deep links and reopen. Reconcile every §3 surface, dialog,
  custom mode and output with its activity evidence or explicit unverified reason, including the inherited price
  CSV/XLSX source variants and their paired owning-app authority checks in WH-35.
- **Expected:** each app retains its own ownership and allowed actions; source/operation identity survives handoff;
  one Back returns to the origin when appropriate; no unmounted design route is treated as built or reviewed.
- **Recovery:** missing neighboring-app grant, different organization, unavailable integration, stale record and
  restricted inherited tab. Record blockers/deferrals without making them passes or expanding this review's scope.
- **Screens/modes:** all bounded handoffs and remaining inventory inspections; Material, actual TUI and Standard/output
  continuation as applicable. Update the pending ledger only from actual evidence during later execution.

## 5. Existing checks and future verification

These are source-inspected checks, not results from this planning task. BOSS currently has sixteen Warehouse server
regression specs, one golden-path client spec, three Warehouse server acceptance specs and seventeen Warehouse client
acceptance walks. Read their assertions and setup before selecting one: names and old implementation summaries can
cover less than a full activity, and their fixture consumption can conflict.

| Current check family | What its source covers / use in this review |
| --- | --- |
| `test/Warehouse/WarehouseAccess.spec.js` | Root grants/capabilities, organization/facility scope, record refusals, one valid move permission pair, raw Mantle/REST refusal and record-link routing; WH-01/35 |
| `WarehouseFacilities`, `WarehousePolicies` | Facility tree/locations/equipment and selected choice labels; effective policy, overrides/pools/tracking and reader/manager controls; WH-02–03 |
| `WarehouseInventory` | Assets/lot/ledger/trace, financial omission, metadata audit, Product360/Availability and export basics; WH-04–05 |
| `WarehouseMoves`, `WarehouseAdjustments` | Movement/retry, quarantine refusal, mixed Relocate results, container handling; adjustment/scrap/expiry/repack and locked period; WH-06–09 |
| `WarehouseReceiving`, `WarehousePutaway` | Receipt reuse/read context/line retry/finish and supplier context; suggestion/refusal/override/retry/rule access and two-step queue; WH-10–12/14 |
| `WarehouseInspections` | Reading/submission, inspector verification refusal, quality disposition, Today work and published template change; WH-13 |
| `WarehouseCounts` | Blind start/entry, review/post separation, due schedule, asset request, closed date and NewCount authorization; WH-15–17 |
| `WarehousePicking`, `WarehousePacking` | Pick work/short/finish context and OrderDetail fulfillment; package/kit/read context, carton setup and print basics; WH-18–22 |
| `WarehouseShipping` | Ship context, synthetic labels and failed-print recovery, carrier masking/setup, printers/outputs, invoice money gate; WH-23–25 |
| `WarehouseReturns`, `WarehouseTransfers` | RMA quarantine/read-only settlement, supplier issue/ship and no Warehouse return authorization; transfer/custody/request context; WH-26–30 |
| `WarehouseReports` | Dated stock/incomplete history, unit totals, valuation gate, choices/exports and Home cards; WH-01/32 |
| `test/client/Warehouse/WarehouseReceivingWalk.spec.js` | The registered golden path opens a purchase receipt and reopens the same one. It does not complete tracked receipt, short finish or handheld review; WH-10 |
| `acceptance/Warehouse/WarehouseAccessWalk.spec.js` | Standalone no-ProductStore receive-to-ship, app roots, two-organization route/output/search/file/notification/financial isolation; uses WarehouseStandaloneLib; WH-35–36 |
| `acceptance/Warehouse/WarehouseServerStatic.spec.js` | Full check of Warehouse XML and marked server-static correctness; source/render support, not observed browser usability |
| `acceptance/Warehouse/WarehouseProductionFixtures.spec.js` | Creates/releases a demo production run with frozen lines/standard for client work; fixture setup is not an observed production journey |

The abbreviated server spec names in the table are under `test/Warehouse/`. `WarehouseSpecLib.js` and
`WarehouseStandaloneLib.js` are helpers, not additional independent review proof. Shared suite acceptance checks such
as AppStructure/TuiRender, where currently registered, remain supporting sweeps; do not reintroduce them as regression
screen walks. A test that names a screen can be checking only its service context or one rendered state.

| Current Warehouse client acceptance walk | Covered branch and open continuation |
| --- | --- |
| `WarehouseFoundationWalk` | Facility/Home lookup and narrow layout; broader quick-create/saved-find/terminal work still needs WH-01 |
| `WarehouseFacilitiesWalk`, `WarehousePoliciesWalk` | Occupied-location refusal/read layout; policy/exception/store-source changes and reader layout; WH-02–03 |
| `WarehouseInventoryWalk` | Lot ledger, trace unknown provenance, metadata audit and narrow lists; containers and full hidden-mount scope need own evidence |
| `WarehouseMovesWalk`, `WarehouseAdjustmentsWalk` | Handheld move focus/refusal; adjustment/closed period/scrap and repack; mixed batch recovery remains explicit |
| `WarehouseReceiptFinishWalk` | Partial tracked receipt, short close and Handheld Receive; separate backorder/receive-all/ad-hoc branches remain WH-11–12 |
| `WarehouseInspectionWalk`, `WarehousePutawayWalk` | Readings/submit/verify/release and reader phone detail; handheld putaway/no-fit/suggestion; template/other dispositions still need evidence |
| `WarehouseCountsWalk` | Due find, blind count start/entry and handheld line; full review/recount/conflict/import/post continuation is WH-16–17 |
| `WarehousePickingWalk` | Partial pick/short, narrow focus and pick-face access; picklist composition, put-back and completed replenishment remain WH-18–20 |
| `WarehousePackingWalk` | Two-carton pack, finalized-invoice reopen refusal, kit and handheld layout; permitted draft reopen needs its own fixture |
| `WarehouseShippingWalk` | Test rates/labels/failed print/ship, manual delivery and phone tracking; provider unknown/refund and actual file contents remain WH-24–25 |
| `WarehouseReturnsWalk` | Two-box RMA quarantine and supplier issue/ship, narrow list; authorization/settlement handoff remains WH-26–27 |
| `WarehouseTransfersWalk` | Transfer issue/ship/partial receives, request approval/allocation and vendor custody; current commercial/production continuation remains explicit |
| `WarehouseProductionWalk` | Run context, subcontract output/service acceptance and unused return; independent issue/output/quality/cost-close continuations remain WH-30–31 |
| `WarehouseReportsWalk` | Dated stock, incomplete opening, unit totals/drill, valuation refusal and phone layout; financial-holder and exported-artifact branches remain WH-32 |

These walk files are under `acceptance/client/Warehouse/`. `acceptance/client/suite.js` registers them, places
WarehouseReceiptFinishWalk late because it consumes stock, and names WarehouseProductionFixtures among fixture setup.
`test/client/suite.js` registers WarehouseReceivingWalk separately. Inspect current setup ordering and dependencies;
reading a registration or using a fixture name does not authorize its acceptance run.

Mantle is the rule owner. Relevant current regression families include `test/shipment/WarehouseReceiving`,
`WarehouseAdjustments`, `WarehousePicking`, `WarehousePacking`, `WarehouseShipping`, `WarehouseReturns`,
`WarehouseTransfers`; `test/facility/WarehouseFacilities`, `WarehousePolicy`, `WarehouseOperationPolicy`,
`WarehousePutaway`; `test/product/WarehouseMoves`, `WarehouseExpiry`, `WarehouseCounts`, `WarehouseQuality`,
`WarehouseTraceability`, `WarehouseReports`, `WarehouseStockChecks`; `test/work/WarehouseProduction`,
`ProductionMaterials`, `ProductionQuality`, `ProductionCosts`, `ProductionSubcontract`; purchasing/return policy
specs under `test/order/`; and `test/ledger/ProductionCostClose`. These names omit the `.spec.js` suffix. Verify
current coverage before choosing a command; no new duplicate BOSS test should restate a Mantle rule.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Reuse appropriate current specs on a suitable binary, for example
  `./moq test mr-boss --spec WarehouseReceiving --nobuild` and the owning Mantle rule spec when that rule changes.
  The browser golden path uses `./moq test-client mr-boss --serve --spec WarehouseReceivingWalk --nobuild`.
- Follow supplied pre-commit rules: `./moq test-apps` for application work and `./moq test-framework` for framework
  work. No commit is part of this documentation task. Do not inherit a cadence exception from another review's log.
- **Acceptance runs require the user's request or an added/changed acceptance test.** If one is added/changed, run
  that test and its component's acceptance suite once written. An explicitly authorized existing scenario could use
  `./moq accept mr-boss --spec WarehouseTransfersWalk`. A plan, fixture dependency, shared-code change or completion
  checkpoint is not acceptance authorization. No `accept-all` is part of this plan.
- Regression checks rules/fixed bugs; full activities, device/access walks and screen sweeps belong to acceptance.
  Across regression render a screen at most once per mode, all checks together; a second mode requires its own
  custom template. No all-screen regressions, users×modes matrix or second Warehouse golden path.
- Respect current BOSS `test/budget`: **264 seconds server / 57 seconds client**, and the **15-second per-regression-
  spec** limit. Check other components' budgets separately. Remove duplication or move complete scenarios to
  acceptance; no budget increase is authorized.
- Lint changed screens with `moqui lint --screens <report-file>`; that argument is an overwritten output report,
  never a screen path. Compare against baseline. This Markdown-only task needs no screen lint or application tests.
- Shared renderer/widget changes are framework work; use the building skill and relevant embedded/precompiled-asset
  checks. Do not run framework specs, `cargo test` or `test-all` just because application files changed.
- Keep review evidence in ignored framework `plans/ui-refinement-evidence/boss-warehouse/` or an explicitly named
  equivalent outside tracked source. Compare before/after with the same data/theme/dimensions; include relevant
  DOM/console/network results, saved quantities, operation outcomes and inspected/redacted files. Do not commit
  credentials, tokens, customer details, captured mail or screenshots with this review record.
- Re-exercise changed activities and relevant recovery branches after correction, including a representative second
  consumer of a shared fix. Distinguish tool limitations, missing prerequisites, baseline failures and product defects.
  A silent skip, source inspection or passing suite cannot close live activity coverage.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
purposefully postponed with reason/follow-up. Exercised does not itself mean passed. Use `exercised / partial` with
remaining branches named. Source research for this plan does not advance live coverage. Blocked/deferred remains
unresolved, and a mode omission is recorded separately from a business-operation result.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| WH-01 — Workday/facility | pending | All live variants unreviewed | — |
| WH-02 — Facilities/equipment | pending | All live variants unreviewed | — |
| WH-03 — Policies/pools/reservations | pending | All live variants unreviewed | — |
| WH-04 — Stock/asset/product context | pending | All live variants unreviewed | — |
| WH-05 — Lots/serials/traceability | pending | All live variants unreviewed | — |
| WH-06 — Containers | pending | All live variants unreviewed | — |
| WH-07 — Moves/bulk relocation | pending | All live variants unreviewed | — |
| WH-08 — Adjustments/scrap | pending | All live variants unreviewed | — |
| WH-09 — Repack | pending | All live variants unreviewed | — |
| WH-10 — Prepare receipt/supplier | pending | All live variants unreviewed | — |
| WH-11 — Receive tracked/ad-hoc stock | pending | All live variants unreviewed | — |
| WH-12 — Finish/backorder receipt | pending | All live variants unreviewed | — |
| WH-13 — Quality/template/disposition | pending | All live variants unreviewed | — |
| WH-14 — Putaway/rules | pending | All live variants unreviewed | — |
| WH-15 — Plan/start count | pending | All live variants unreviewed | — |
| WH-16 — Count/import | pending | All live variants unreviewed | — |
| WH-17 — Review/recount/post | pending | All live variants unreviewed | — |
| WH-18 — Outbound/picklist preparation | pending | All live variants unreviewed | — |
| WH-19 — Pick/short/put-back | pending | All live variants unreviewed | — |
| WH-20 — Pick-face replenishment | pending | All live variants unreviewed | — |
| WH-21 — Pack/reopen | pending | All live variants unreviewed | — |
| WH-22 — Kit assembly | pending | All live variants unreviewed | — |
| WH-23 — Carton/carrier/printer setup | pending | Synthetic provider/local sink prerequisites | — |
| WH-24 — Label/print/ship | pending | Provider attempts and actual artifacts unverified | — |
| WH-25 — Delivery/document continuity | pending | All live variants unreviewed | — |
| WH-26 — Customer RMA | pending | Authorization/quality/settlement continuation unreviewed | — |
| WH-27 — Supplier return | pending | Physical/financial continuation unreviewed | — |
| WH-28 — Transfer | pending | All live variants unreviewed | — |
| WH-29 — Stock request | pending | All live variants unreviewed | — |
| WH-30 — Subcontract custody/output | pending | Run/service acceptance/accrual continuation unreviewed | — |
| WH-31 — Production stock | pending | Output/quality/cost-close continuation unreviewed | — |
| WH-32 — Reports/valuation | pending | All live variants and artifact contents unreviewed | — |
| WH-33 — Handheld | pending | All live/device variants unreviewed | — |
| WH-34 — Evidence/outputs | pending | All live variants and artifact contents unreviewed | — |
| WH-35 — Access/isolation | pending | No matrix or refusal outcome inferred | — |
| WH-36 — Cross-app/mode reconciliation | pending | Depends on prior activity continuations | — |

### Findings register

No runtime/UI defect has been established by this documentation task. Number later findings **WH-UI-001** onward.
Distinguish observed failures, source suspicions and design judgments. P1 blocks work or makes essential information
unusable; P2 causes substantial friction or misleading presentation; P3 is a localized refinement. Stock, financial
or access corruption takes priority regardless of the screen's visual quality.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Static concerns below are investigation inputs | — |

Source concerns to carry into later execution, without treating them as observed defects:

- Shared route trees contain more surfaces/transitions than Warehouse's visible tabs. Inherited catalog/method,
  supplier commercial, project billing and request-case transitions need paired context/authority checks; a hidden
  tab or branch condition is not the entire data boundary.
- The local inventory has no Warehouse SupplyPlanning mount, while old “Later” lists also name services/contexts
  now built elsewhere. Check the actual entry/return route and ownership before describing an implementation gap.
- Stock and commercial states have several independent steps: a received box is not released stock, a custody move
  is not consumed material, a packed shipment is not shipped, and return receipt is not settlement. Inspect captions,
  action hierarchy and persisted evidence where the same shared screen changes branch.
- Generated-lot receiving, CSV counts and selected-stock relocation require explicit partial-result inspection.
  Independent failures should name the item and allow independent work to finish; a dependent transfer/production
  transaction has its own atomic boundary and must not be presented as a partial batch.
- Old fixed demo dates, consumption order and financial policy differences can invalidate a scenario without a UI
  regression. The finalized-at-pack demo and ship-time invoice policy need separate fixtures; a return also needs
  the correct separate-settlement policy.
- Label purchase, provider uncertainty, failed printing and reprint span durable external-operation state. Inspect the
  current attempt and artifact, not only notification wording; keep synthetic-provider and physical-device gaps explicit.
- Historical locked-period repost/cost issues mentioned by Accounting/Manufacturing are investigation references,
  not newly observed Warehouse defects or authorization for repair. Reconcile current service flags and ownership
  before any isolated reproduction; preserve posted history on a refused replacement.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan — 2026-11-10 | Dedicated Warehouse author within the four-app documentation batch; current routes/mounts, workflows, grants, fixtures, tests and old deferrals researched | Source/document inspection only; 89 local XML files and 190 recursive route instances inventoried; no runtime, test, output or stock/financial mutation | Initial document written; independent document review and coordinator cross-app reconciliation are separate documentation checks; all WH activities pending |
| Document review — 2026-11-10 | Separate reviewer completed an initial source review with no required corrections; coordinator identified an omitted XLSX output variant | Author checked Movements and OperationsHistory form declarations and added their CSV/XLSX variants and workbook-content checks to §2–4; independent reviewer rechecked those corrections against both screens | Output omission corrected; independent source-review recheck passed with no further corrections; all WH live activities remain pending |
| Source addendum — 2026-11-10 | Coordinator identified further inherited CSV/XLSX variants on both StockAtDate tabs and the three Product360/Supplier360 price mounts | Author expanded §3 and WH-32/34–36; independent reviewer confirmed Shared/StockAtDate/Places and History, Shared/Prices and Shared/SupplierPrices declarations, mounts and paired authority checks | Inherited-output addendum passed independent recheck; prior review result retained and all WH live activities pending |
| Coordinator reconciliation — 2026-11-10 | Reconciled Purchasing receipt/return, Manufacturing material/custody, Customer Service RMA and Accounting valuation/settlement handoffs with the companion reviews and current sources | Independent reviews/rechecks complete; source inventories, relative links/anchors, activity IDs/ledgers and Markdown whitespace checked; only four new review documents changed | Documentation batch complete; source concerns remain investigation inputs and all live activities remain pending |

For each later execution batch append actor/fixture identities; source and binary revisions; actual runtime/clock/
modes/providers; activities and recovery branches attempted; findings and owning layer; important before/after evidence;
saved stock/operation outcomes and inspected artifacts; exact checks/results and skips; design/implementation updates;
commits when made; temporary state restored; and unresolved continuations. Keep notes bounded and reference evidence
files rather than copying logs.

## 7. Decisions

- **Current task:** write this review plan only, within the user-authorized four-app documentation batch, with a
  dedicated author and separate reviewer. No live walkthrough, application mutation, test, acceptance run or commit.
- **Pattern:** retain Accounting's seven-part structure and complete activities, explicit routes/mounts, pending
  ledger, findings and bounded records. Completed statuses, permissions and execution exceptions from earlier reviews
  do not carry over.
- **Source of truth:** current routes, grants, templates and service contracts govern scope. Reconcile historical
  placeholder/deferral prose here without editing the existing research/design/implementation files in this task.
- **Physical basis:** every movement receipt identifies facility, owner, record, tracking, quantity/unit and operation;
  record effective versus recorded date and policy source where relevant. Use disposable stock and synthetic providers.
- **Ownership:** Warehouse executes physical work, Mantle enforces record rules, Products owns shared physical product
  context, Purchasing owns buying, Manufacturing owns production and Accounting owns financial posting/settlement/cost
  close. Shared mounting does not confer another app's authority.
- **Modes:** Material is the visual target, actual TUI and bounded Standard/output checks remain explicit, and the
  seven handheld aliases require their actual inherited density/focus behavior. Unsupported devices/providers remain
  unresolved evidence gaps, not inferred passes.
- **Verification:** reuse existing coverage under §5; no new test, acceptance selection, budget increase or pre-commit
  exception is authorized by this plan. Future execution scope and cadence are recorded when the review begins.
- **Completion:** documentation completion requires independent source review and cross-app consistency, while later
  UI-review completion requires evidence for selected activities and candid remaining modes/recovery/blockers. A source
  inventory or passing suite alone does not establish a usable Warehouse workflow.
