# IronStone BOSS — Warehouse implementation

Oct 28, 2026 — plan; P0 partly done (F1–F34); its open questions, the shared party-role and effective-date rules, the
organization filters and the Mantle boundary decided (§4)

How [design-warehouse.md](design-warehouse.md) gets built, in phases from the foundation to the reports, each ending
tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md) and
[impl-accounting.md](impl-accounting.md) are: each phase names its scope by the design's sections and §17 needs rather
than restating them, and the design stays the place for screen and record detail. During the build this file is the
log: phase status and what each built, the decisions made, open questions, findings against the code, and what is
deferred.

Today `screen/Warehouse/` holds seven placeholders, and the root mounts only Chatter and RecordFiles. BossSetupData has
the root's admin authz and the admin, stock planner, manager and facility admin groups, but no root user group (F1,
F33). None of the design's proposed services, entities, fields or status items exist in Mantle or BOSS beyond what
Products and Accounting build first.
Warehouse is built after both (§4), so these are there to extend:
- from Products: Product360, Supplier360 and InventoryAvailability; `store#ProductFacilityPolicy` and the TrackingPolicy
  records (its P7); the kit components (P2); the released BOM and routing versions (P8) and approved standard costs
  (P9); `resolve#ScannedProduct`, packaging, the GS1 parse and the barcodes (P11);
- from Accounting: ShipmentDetail, ReturnDetail, EquipmentDetail and InventoryValuation; the posting guard in
  `post#AcctgTrans`; `receive#ReturnItems`, `release#ShipmentDraftInvoice` and `queue#MatchReevaluation`; the conditioned
  SECAs.

**Inputs.**
- Designs:
  - [design-warehouse.md](design-warehouse.md)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4, §3.3, §3.5–§3.11, §3.16, §3.18,
    §3.19, §3.25, §3.26, §4.3, §4.4, §6 and §7.1
  - [design-manufacturing.md](design-manufacturing.md): MaterialIssueReceipt, SubcontractDetail, and M2 of §12
  - [design-purchasing.md](design-purchasing.md): PUR-RECEIPT (`accept#ServiceItem`), ClosePurchaseOrders and
    PUR-RETURN
  - [design-products.md](design-products.md): PRD-PACKAGING, the kit components and `resolve#ScannedProduct`
  - [design-accounting.md](design-accounting.md): InventoryValuation, AC-02 and AC-07
  - [design-customer-service.md](design-customer-service.md): StockAtDate and Returns
- Plans:
  - [impl-products.md](impl-products.md): the pattern; P7, which builds Warehouse's facility and tracking policy and
    `Shared/InventoryAvailability`; the groups its P1 seeds; the BOSS client screenshot spec (its F23).
  - [impl-accounting.md](impl-accounting.md): the shared screens and the Warehouse contract it builds, its posting and
    adoption rules, and its findings that recur here (F4, F5, F25, F27).
  - [impl-projects.md](impl-projects.md): OrderDetail, InvoiceDetail and RequestDetail.
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28) and
  [review-core-apps/warehouse.md](review-core-apps/warehouse.md), which explain the design's D- and R- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8 (the §8.1 element
  checklist and the §8.2 handheld density), and [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- Inventories: [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md).
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/base-component`)
  - `runtime/component/mr-mantle`
  - `runtime/component/mr-boss`

  `runtime/component/mr-marble` is read only, for the baseline Asset, Facility, Shipment, Shipping, Return and
  BasicHandheld screens that design §15.1 maps.
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §17 needs they use, except SupplyPlanning and WH-PLAN, which
    wait for CX-PLANNING (§4).
  - The parts of other apps' needs that Warehouse depends on (§4):
    - crosscut CX-QUALITY: the shared inspection records, `mantle.product.QualityServices`, and
      `Shared/QualityInspection` and `Shared/InspectionTemplates`;
    - Manufacturing's production runs and their lines (part of M4): `create#ProductionOrder`,
      `release#ProductionOrder`, and the run's own material and output lines (§4);
    - Manufacturing's production stock guards (M2): `issue#ProductionMaterial`, `return#UnusedMaterial`,
      `receive#ProductionOutput` and `receive#SubcontractOutput`, with the CX-PRODUCTION movement fields;
    - Purchasing's `mantle.order` contracts (§4): `accept#ServiceItem` over `ServiceAcceptance`,
      `close#PurchaseRemainders`, and `find#ReturnableReceipts` with its receipt link.
  - The shared screens no app has built, with the Warehouse context only: FacilityDetail, MaterialIssueReceipt,
    QualityInspection, InspectionTemplates and StockAtDate (F29).
  - Warehouse's context on shared screens other apps built:
    - Products' Product360, Supplier360 and InventoryAvailability;
    - Accounting's ShipmentDetail (six mounts), ReturnDetail, EquipmentDetail and InventoryValuation;
    - Projects' OrderDetail, InvoiceDetail and RequestDetail.
  - §7 holds the `later` rows and needs, supply planning (CX-PLANNING, with the SupplyPlanning mount), and the rest of
    the other apps' needs.
- **Order** (decided Oct 28, 2026), the stock ledger first:
  1. the foundation;
  2. facilities and locations, then policies;
  3. inventory and traceability, then the posting guard with moves, then adjustments, scrap and repack;
  4. receiving, inspection, then putaway;
  5. counts;
  6. picking, packing, then shipping;
  7. returns;
  8. transfers and requests;
  9. production runs and stock;
  10. reports;
  11. the finish.

  Each task phase brings its handheld mount, on the scan input and handheld density that P5 adds.

## 2. Ground rules

- **The Commons rules hold.** These are impl-drawers-commons §4:
  - failure tolerance;
  - the Mantle-free framework;
  - Mantle stands without BOSS;
  - business logic leans to Mantle;
  - the new XML element checklist of style-guide §8.1;
  - libraries through `libs/refresh.mjs`, and crates against `deny.toml`;
  - the `.qvue` gallery pattern;
  - parties by role;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  Screenshots come from the BOSS `test/client` spec that Products adds (impl-products §2).
- **Stock rows through services.** `MANTLE_USER_ORG` filters Facility by owner, but nothing filters Asset, AssetDetail
  or PhysicalInventory, and nothing filters by facility (F2). Warehouse reads and writes them only through services.
  A Warehouse screen or mount calls `ironstone.warehouse.AccessServices`, which checks the user's organizations, the
  facility and owner, and the capability group, and then calls the Mantle service itself; no same-named ironstone
  pass-through is built. The Mantle service checks its own permission (§4) through Products P9's `ProductAccess.js`
  `has()`, and the organization by party relationship (`mantle.party.PartyServices.get#PartyOrganizationInfo`): a
  facility is in scope when its owner is. Products P7's `WarehousePolicy.js` already checks `STOCK_POLICY_PLAN` and
  `STOCK_POLICY_MANAGE` (Products P9's conversion).
  - `entity` in a design form summary means that guarded path, never a bare entity form (the design's service
    notation).
  - Permissions are checked in the Mantle services, so they hold for exports, search, the palette, handheld mounts and
    shared mounts. The `BOSS_WAREHOUSE_*` groups get no artifact authorization for the raw Mantle stock services or
    their REST paths (F3).
- **One posting guard.** Every stock mutation is a `mantle.shipment.WarehouseTaskServices` entry point or another
  proposed guard of the design, never the Mantle primitive alone (WH-POST). Each takes an operation identity and
  answers the first result on a retry, checks its permission (a `STOCK_*` or `SHIPMENT_*` one, §4), the facility,
  status, expiry, policy and the open period, and writes its dependent movements atomically. A batch names each failure
  and goes on. The operation record is Accounting P2's one CX-POSTING record (impl-accounting §4); the period check is
  Accounting's AC-06 guard inside `post#AcctgTrans`. A contract another entry point calls in its operation, such as
  `close#PurchaseRemainders` from `close#ReceiptRemainder`, takes that entry point's check.
- **Held stock stays held.** `move#Asset` and `receive#Asset` apply the destination location type's `autoStatusId`
  (F8). So the guard refuses a move that would change a quarantined asset's status: only `dispose#Inspection` releases
  it (P8).
- **Restricted values stay on the server.** A service leaves out of its answer any cost, value or invoice amount the
  user may not read. Financial read is the `ACCOUNTING_VIEW` permission, which Accounting's groups hold, not a
  Warehouse grant (design §1). Blind count quantities never reach a counter, and nothing is fetched and then hidden.
- **Shared screens.** Warehouse builds these with the Warehouse context only:
  - `Shared/FacilityDetail` and `Shared/MaterialIssueReceipt`;
  - `Shared/QualityInspection` and `Shared/InspectionTemplates`;
  - `Shared/StockAtDate`.

  It adds its context to the shared screens of §1. Each takes `appRoot` and server-derived capabilities, on
  `Shared/RequestDetail`'s pattern.
- **Owner contracts.** A contract built here for another app follows that app's design: its record and service names,
  in the Mantle package of its records (§4), its Shared screen and its permissions. A change found while building it is
  written into the owner's design. The owner's own screens stay with the owner.
- **Mantle rule changes keep Mantle's default.** A new refusal in a Mantle service, such as the expiry gate (F12),
  sits behind its own WarehousePolicy flag, off by default (impl-accounting §4). A permission check goes on a new Mantle
  entry point only. Each ships with a test of its condition and of its unchanged default.
- **Mantle callers stay compatible.** Existing callers of these keep working:
  - `record#PhysicalInventoryQuantity`, which stays an immediate posting (design §15.2);
  - `receive#ShipmentProduct`, `receive#EntireShipment`, `move#Asset` and `reserve#AssetForOrderItem`;
  - `create#ShipmentLoadsForOrders`, whose current result stays as it is;
  - `complete#ShipmentPack`, with its label parameters;
  - the SECAs that design §15.2 keeps.

  Mantle's stock specs pass unchanged (F28), with the flow specs' SECA invoices (impl-accounting F27).
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the new Mantle specs passing under `./moq test mr-mantle`, their users in spec-local groups that hold the
      permissions, never a BOSS group;
    - `./moq test mr-boss` passing, with AppStructure covering the new screens and Warehouse in its non-placeholder
      list;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the `test/client` walks passing, with the handheld mounts at 390;
    - the inventories' **Implemented in** columns;
  - the `WarehouseAccess` spec extended to the phase's services and mounts;
  - the phase's walk in §8;
  - its row and **Built** note here.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Oct 31 (§6 F1–F34, F35–F46); see P0 verification below |
| P1 Foundation | Mantle, BOSS | the Warehouse root and menu, Home | built Oct 31, 2026; see build record below |
| P2 Facilities and locations | Mantle, BOSS | Facilities, FacilityDetail, EquipmentDetail | built Oct 31, 2026; see build record below |
| P3 Policies | Mantle, BOSS | Settings, StockPolicies, ReservationPolicies, AssetPools | — |
| P4 Inventory and traceability | Mantle, BOSS | Availability, Product360, Assets, AssetDetail, Movements, Lots, Containers, ContainerDetail, Traceability | built Oct 31, 2026; see build record below |
| P5 Posting guard and moves | mr-moqui, Mantle, BOSS | Move, HandheldHome, HandheldMove | P5a (framework) built Oct 31, mr-moqui `7a547fba`; P5b — |
| P6 Adjustments, scrap and repack | Mantle, BOSS | Adjustments, Repack | — |
| P7 Receiving | Mantle, BOSS | Receipts, ReceiptDetail, Receive, Supplier360, HandheldReceive | — |
| P8 Inspection | Mantle, BOSS | Inspections, QualityInspection, InspectionTemplates | — |
| P9 Putaway | Mantle, BOSS | Putaway, PutawayRules, HandheldPutaway | — |
| P10 Counts | Mantle, BOSS | Counts, CountDetail, CountEntry, CountReview, CountVariance, HandheldCount | — |
| P11 Picking | Mantle, BOSS | Shipments, ShipmentDetail, OrderDetail, Picklists, PicklistDetail, CreatePicklists, Pick, PickLocationMoves, HandheldPick, HandheldPickFace | — |
| P12 Packing | Mantle, BOSS | Pack, BoxTypes, MaterialIssueReceipt (kits), HandheldPack | — |
| P13 Shipping, labels and printers | Mantle, BOSS | Ship, PackageTracking, Carriers, Printers, InvoiceDetail | — |
| P14 Returns | Mantle, BOSS | Returns, ReturnDetail, ReturnReceipt, SupplierReturnShipment | — |
| P15 Transfers and requests | Mantle, BOSS | Transfers, TransferShipmentDetail, SubcontractShipmentDetail, StockRequests, RequestDetail | — |
| P16 Production runs and stock | Mantle, BOSS | MaterialIssueReceipt (work efforts), SubcontractShipmentDetail's output receipt | — |
| P17 Reports | Mantle, BOSS | Reports, StockAtDate, OperationsHistory, InventoryValuation | — |
| P18 Finish | BOSS | — | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F34 were found on Oct 28 while writing this plan. The design edits that F9, F10
and F13 call for, and those of §4's earlier Oct 28 decisions, were made in the Oct 28 design sweep. The rest were
checked on Oct 31, with Mantle's `WarehouseStockChecks` spec and the "P0 verification" record in §8:

- **An empty organization list** (F35): no facility, never every one (§4).
- **REST and baseline writes** (F36): no BOSS group reaches the Mantle REST stock mutators of F3; the mr-marble Asset
  and Shipment screens' raw writes are listed, and no Warehouse screen maps them.
- **A transfer's receipt totals** (F10, F37): ShipmentItemDetail multiplies receipts and issuances, so a transfer is
  received from separate sums (P7, P15).
- **Quarantine and reservations** (F13, F38, F39): a whole held asset is re-reserved elsewhere; a partial move carries
  a reservation onto the held asset, which P5's guard re-checks; a held asset keeps its ATP.
- **Scrap posting** (F5, F21, F40): Accounting P13's poster reads the reason as §4 decides.
- **Kit cost** (F41): Mantle sets none; an organization flag read inside `produce#AvailableAssemblies` costs the kit
  (P12).
- **Today sources** (F42): loads open from an earlier day, assigned counts and assigned inspections; no putaway.
- **Open work on a location** (F43): the blockers a close names, and closed locations refused as destinations (P2).
- **The other apps' state** (F44, F45): all built; the services and screens later phases extend are in §8.

### P1 — Foundation

- **Access** (design §1, crosscut CX-ACCESS).
  - The groups of design §1, with `BOSS_WAREHOUSE` as the root user group and `BOSS_WAREHOUSE_ADMIN` as the admin
    group (§4). `BOSS_WAREHOUSE_STOCK_PLANNER` and `BOSS_WAREHOUSE_MANAGER` exist from Products P1,
    `BOSS_WAREHOUSE_FACILITY_ADMIN` from Products P9 (F33), and `BOSS_ACCOUNTING_READ` from Accounting P1.
  - The root user group's authz joins the admin rows BossSetupData already has (F33), with the organization filters of
    impl-drawers-commons §4 and the service checks of §2 (F2).
  - The grants (§4): BossSetupData's `UserGroupPermission` rows for the Mantle permissions that Warehouse's services
    check, with their `UserPermission` rows in mr-mantle's MantleSetupData, beside `ORDER_APPROVE`:
    - `STOCK_RECEIVE`, `STOCK_ISSUE`, `STOCK_MOVE`, `STOCK_ADJUST`, `STOCK_COUNT`, `SHIPMENT_PICK`, `SHIPMENT_PACK`,
      `SHIPMENT_SHIP` and `QUALITY_INSPECT` to the receive, issue, move, adjust, count, pick, pack, ship and inspect
      groups;
    - `STOCK_COUNT_REVIEW` to the count reviewer, `SHIPMENT_LOAD_EDIT` to the pick supervisor and `FACILITY_EDIT` to
      the facility admin;
    - `QUALITY_VERIFY`, `QUALITY_DISPOSE`, `QUALITY_TEMPLATE_EDIT` and `LOT_EXPIRY_EXTEND` to the quality manager;
    - every one of them to `BOSS_WAREHOUSE_ADMIN`.

    Products P9 already grants `STOCK_POLICY_PLAN` and `STOCK_POLICY_MANAGE` (F33). Financial read is
    `ACCOUNTING_VIEW` through Accounting's groups, and `SUPPLY_PLAN_RUN` comes with CX-PLANNING (§7).
  - Facility scope as Moqui has it (§4): `MANTLE_USER_ORG`'s Facility filter, `ownerPartyId` in `filterOrgIds`, on
    the Warehouse groups. The admin group's `MANTLE_ACTIVE_ORG` has no Facility filter, so it works in every facility
    of every organization.
  - `ironstone.warehouse.AccessServices`: the user's organizations, the facilities they may work in (read through
    that filter), and their capabilities. Every later Warehouse screen and shared mount calls it before the Mantle
    service (§2). A supplied facility, asset, shipment, count or return is checked against it, and stock rows are
    scoped by their facility.
  - No artifact authorization for the raw stock services or their REST paths (F3).
- **The Warehouse root.**
  - The menu of design §1: the placeholders renamed, and Inspection, Counts, Transfers, Picking, Handheld and Reports
    added (F1). Each area shows for its groups only.
  - The facility selector, kept as a user preference that never widens authorization.
  - `<shell-providers>` (WH-SHELL): the palette types and quick create grow phase by phase, as their records are built,
    and so do the Today sources and notification topics.
  - The `warehouse` key scope.
  - `ironstone.commons.PaletteServices.get#RecordLink` opens shipments, assets, lots, containers, counts and returns
    under Warehouse for its users.
- **Home** (design §3): QueueFilters and OperationQueues, with the counts of later phases null; MyWork with no sources
  yet; ScanOrPack over `get#ScannedIdGeneral`, as a lookup only.
- **Warehouse demo data.**
  - `BossWarehouseDemoData.xml` builds on Mantle's ZIRET_WH (F27). It adds quarantine, staging and morgue locations,
    and a second warehouse for transfers. It adds a lot-tracked and a serialized product with lots and expiry dates, and
    stock in each status, as the phases need them.
  - `BossUsersDemoData.xml` gains a user per capability, and a warehouse reader with no other launcher.
- **Specs.**
  - `WarehouseShell`: the menu per group, the palette, record links, quick create.
  - `WarehouseAccess`: started, covering facility scope and groups through the services, and the refused REST paths
    (MANTLE_API stays ADMIN-only for the Warehouse groups); an empty organization list is no facility, and an active
    organization the user does not belong to never widens the scope (F58).
- **Usable when:** the menu renders for each group, and quick create offers only what the group may create. A reader
  sees their organization's facilities, stock and shipments but not another organization's, in lists, the palette and
  record links. A forged facility or asset ID is refused.

### P2 — Facilities and locations

- **Screens** (design §12):
  - Facilities: FacilityList as a tree by parent, and NewFacility. A parent cycle is refused.
  - `Shared/FacilityDetail` (crosscut §3.10) with the Warehouse context:
    - Overview and contact, Children, and Schedules on the existing Commons definition;
    - Locations and types: locations with capacity and pick sequence, and each location type's `autoStatusId` (F8);
    - Products: ProductFacility and ProductFacilityLocation through Products P7's `store#ProductFacilityPolicy`;
    - Files and Chatter, on the existing Facility host.

    P3 adds Policies, P12 Box types and P13 Printers.
  - EquipmentDetail: Accounting's `Shared/EquipmentDetail` with the Warehouse row of crosscut §3.10: identity,
    assignments, availability and the maintenance summary. Its Files tab comes with P4's AssetContent.
- **WH-POLICY, the location part:** the shipping-dock location type (F8).
- A location with stock or open work is not closed. It closes by a new audit-logged `FacilityLocation.thruDate`, and
  the close names each blocker of F43: an inventory asset there with on-hand or ATP not zero, equipment there that has
  not left, a container, an unissued reservation (an open pick), a count line on an open count, and a
  ProductFacilityLocation or putaway rule naming it. Relocate (P5) is how it is emptied. A closed location is left out
  of location pickers, and the receive, move and putaway guards (P5, P7, P9) refuse it as a destination, since
  `receive#Asset` and `move#Asset` do not read the date.
- The facility and location saves, with the cycle and close checks, are Mantle services that check `FACILITY_EDIT`.
- **Usable when:**
  - a facility admin builds a facility with an area, receiving, quarantine, staging and pick locations and their
    statuses;
  - a cycle is refused;
  - closing a location that holds stock is refused, naming the stock;
  - an operator reads the facility but cannot edit it.

### P3 — Policies

- **WH-POLICY, the rest.** Products P7 built the tracking records and `store#TrackingPolicy`. Here, in
  `mantle.facility.WarehousePolicyServices` beside them, each write checking `STOCK_POLICY_MANAGE` as
  `WarehousePolicy.js` does:
  - the operation policy: receipt and delivery steps 1–3 (design StockPolicies), default locations, over-receipt and
    over-shipment tolerances defaulting to zero, the backorder choice, blind counts and auto-print, through
    `store#OperationPolicy`;
  - the facility reservation default without a store, through `store#ReservationPolicy`;
  - `resolve#WarehousePolicy` and its trace: organization, facility, store override, product exception;
  - effective-dated rows with their key fields audit-logged (impl-drawers-commons §4): a change ends one row and
    starts the next, applies at posting and rewrites no history.
- **Screens** (design §14):
  - Settings;
  - StockPolicies: OperationPolicy, TrackingPolicy, ProductTrackingExceptions (the records Product360/Stock shows) and
    PolicyPreview;
  - ReservationPolicies: FacilityReservation, StoreReservation through a field-scoped ProductStore service, and
    ReservationCheck's preview. Its repair posts under P5's guard;
  - AssetPools: PoolList, PoolHeader, PoolParties and PoolStores, with a preview of the open reservations a change
    affects;
  - FacilityDetail's Policies tab.
- **Usable when:**
  - a warehouse manager sets a facility to two-step receipt, a product to lot required, and a facility reservation
    default with no store;
  - PolicyPreview names the source of each value, and a store override wins for that store's orders only;
  - an operator reads the effective policy but cannot save it.

### P4 — Inventory and traceability

- **Screens** (design §6), all reading through AccessServices (F2):
  - Assets: AssetFind and AssetList, grouped by product, lot, location or owner;
  - AssetDetail: AssetHeader with the metadata allowlist over `update#Asset`, Reservations, AssetLedger and AssetAudit;
  - Movements: MovementFind and MovementList with each source, correction chain and revaluation split (F34), and
    export;
  - Lots: LotList, LotStock, and LotMetadata for a new lot. Correcting a posted lot is P6;
  - Containers (ContainerList, NewContainer), and ContainerDetail's header and contents. Its moves are P5.
  - Availability: Products' `Shared/InventoryAvailability` with the Warehouse row of crosscut §3.7. That is Summary,
    Locations/lots, Reservations, Projection, Policy and the Movements tab (D28), with holds and transit apart. Held
    stock is counted by status, since a held asset keeps its ATP (F39).
  - Product360: Products' `Shared/Product360` with the Warehouse row of crosscut §3.5. That is Summary, Identifiers,
    Dimensions/units, Stock/locations, Documents and History, master read-only. The Replenishment tab (D28) shows the
    facility levels; its planning suggestions are §7.
  - Products' `get#SharedContext` admits only the Products root, so these two Warehouse mounts take an
    `appRoot == 'Warehouse'` branch with their own context, as Accounting's do (F44).
- **WH-RECORD-HOSTS, the asset part:** `mantle.product.asset.AssetContent`, registered in `get#RecordLinkInfo`, for
  Files and Chatter on AssetDetail and EquipmentDetail (F22).
- **WH-TRACE:** `mantle.product.TraceabilityServices.get#Traceability`, bounded and cycle-safe, with pages of nodes and
  edges, Unknown provenance for a gap, a revaluation split crossed by its `otherAssetId` link (F34), and cost fields
  only with `ACCOUNTING_VIEW`. Traceability shows it as a list and a tree, on Products P3's `view-tree` occurrence keys
  (F26).
- **Palette:** lots, assets and containers.
- **Usable when:**
  - an operator finds a lot's assets across locations and follows one asset's ledger to its receipt;
  - a Traceability walk from a received lot reaches its shipment, and a missing link shows Unknown;
  - a reader without financial read sees no cost in lists, exports or Traceability;
  - a metadata edit is audited, and no quantity, location or cost edit is offered.

### P5 — Posting guard and moves

- **Framework** (style-guide §8.1 checklist; F24).
  - `scan-input` (WH-SCAN): keyboard-wedge and manual input, a resolver, the allowed identity types, an ambiguity
    chooser, explicit confirmation and deduplicated scan intent, in qvt, html and tui, with the gallery's Views.
    Products P11's GS1 parse reads the codes. html and tui fall back to a text input with the same resolver.
  - `density="handheld"` on a screen (WH-HANDHELD, style-guide §8.2): 48 px controls, 18 px text, no drawer, a reduced
    header. The attribute wins over the user's density preference (§4).
- **WH-POST.**
  - The entry-point pattern of §2 in `mantle.shipment.WarehouseTaskServices`, on the CX-POSTING record.
  - CX-POSTING's `enteredQuantity`, `enteredQuantityUomId` and `appliedConversionFactor` on AssetReceipt, AssetIssuance
    and ShipmentItemSource (F7).
  - The held-stock rule of §2 (F8), and container attachment that never moves stock (F9).
  - A move into a held location calls `check#AssetReservations` on the held asset: a partial move carries the
    reservation beyond the source's ATP onto it, and Mantle checks only on a facility or pool change (F38).
  - `attach#AssetToContainer`, `detach#AssetFromContainer` and `move#Container`.
  - The move guard and the container services check `STOCK_MOVE`.
- **WH-EXPIRY, the gate,** inside Mantle behind its WarehousePolicy flag (§4; F12): reservation skips expired stock
  and names a shortfall, and issue refuses it, while quarantine, return and disposal still work; near-expiry warnings
  show the date.
- **Screens:**
  - Move (design §8): MoveSelect, MoveContents, MoveConfirm and RecentMoves. Reserved stock keeps its reservation or the
    move is refused, and a cross-facility move opens Transfers (P15). Move takes a run context, which Manufacturing's
    Stage action uses later.
  - Relocate on Assets and Availability, a result per row.
  - ContainerDetail's AddOrRemoveAsset and MoveContainer.
  - ReservationPolicies' ReservationCheck repair.
  - HandheldHome (design §13), and HandheldMove. Home's ScanOrPack takes `scan-input`.
- **Usable when:**
  - a mover scans an asset and a bin and moves part of it, and a retry with the same operation answers the first
    move;
  - a move of quarantined stock into a pick bin is refused;
  - a relocation of five assets with one invalid names it and moves the other four;
  - a container moves with all its contents or not at all;
  - at handheld density on a phone, the task keeps scan focus and 48 px controls.

### P6 — Adjustments, scrap and repack

- **Adjustments** (design §6): AdjustmentScope for an exact bucket (None differs from Any) and Adjustment, a delta or a
  count with a before-and-after preview. Both go through the guard to `record#PhysicalInventoryQuantity` or
  `record#PhysicalInventoryChange`. A movement after the preview invalidates it, a closed period fails, and a repeated
  operation answers the first adjustment. The guard checks `STOCK_ADJUST`.
- **WH-SCRAP:** `scrap#Asset` (`STOCK_ADJUST`) and `PhysicalInventory.scrapIndicator`, with Accounting P13's InVrScrap
  and InVrExpired reasons (F6, F40). It may move the stock to a morgue location first. Scrap posts by its reason,
  through Accounting P13's poster change (§4; F5, F40), one PhysicalInventory per operation. The demo sets
  `scrapGlAccountId` (519200000) on ORG_ZIZI_CORP's own AstTpInventory AssetTypeGlAccount row, which ZIRET's postings
  read through its rollup, so a scrap posts apart from shrinkage. DefaultSettings' row is only copied when an
  organization is initialized, so changing it reaches no demo organization. AssetDetail, Move and the Lots expiry list open it.
- **WH-EXPIRY, the corrections:** `correct#LotMetadata`, with old and new values, reason and actor. Extending an expiry
  needs `LOT_EXPIRY_EXTEND` (the quality manager's) and releases no quarantine.
- **Repack** (design §8): RepackSource and RepackConfirm over `repack#Asset` (`STOCK_MOVE`), in an organization-owned
  WepAssembling WorkEffort.
  - The issue and the receipt net to zero through the existing GL SECAs.
  - The lot carries over. The receipt links to its source issuance through CX-PRODUCTION's
    `AssetReceipt.sourceAssetIssuanceId`, added here.
  - The pack direction is Products' PRD-PACKAGING, and a scan resolves through Products P11's
    `mantle.product.ProductServices.resolve#ScannedProduct`.
- **Usable when:**
  - an adjuster previews and posts a count of one lot bucket with a reason;
  - a backdated adjustment into a closed period is refused;
  - a scrapped expired lot posts once and is left out of Counts;
  - unpacking 2 cases into 24 units carries the lot and the unit cost and nets to zero in the ledger;
  - a retry posts nothing twice.

### P7 — Receiving

- **WH-POST, the receipt entry points,** each checking `STOCK_RECEIVE` (`ensure#PurchaseReceipt` also admits
  `PURCHASE_ORDER_EDIT`, for Purchasing's PrepareReceipt):
  - `ensure#PurchaseReceipt`: one open receipt per PO part.
  - `adjust#ExpectedReceipt`: Purchasing's revision call, refused with ReceiptInProgress while a receive holds the
    source.
  - `close#ReceiptRemainder`. Close calls Purchasing's Mantle `close#PurchaseRemainders` (below). Backorder calls
    `ensure#PurchaseReceipt` and `update#ShipmentItem`. Only then does it call `deliver#Shipment`.
- **Purchasing's contract** (§4, design-purchasing ClosePurchaseOrders):
  `mantle.order.OrderServices.close#PurchaseRemainders`, checking `PURCHASE_ORDER_EDIT`, or inside
  `close#ReceiptRemainder` that service's check (§2). Per item, the remainder is the quantity less what was cancelled
  and received (accepted and rejected). It records that through `cancel#OrderItem` with an explicit cancelQuantity,
  releases the Requirement allocation, calls `mantle.other.BudgetServices.release#Commitment` where the PO has a
  commitment (impl-accounting P15), and completes the order when nothing is open. Purchasing's ClosePurchaseOrders
  screen stays Purchasing's.
  - `generate#TrackingIdentities`, with the TrackingPolicy pattern and a uniqueness preview.
  - The receive guard over `receive#ShipmentProduct`. It keeps the entered unit and converts a PO line's unit. A pack
    scan resolves through Products' Mantle `resolve#ScannedProduct` (P6).
  - AdHocReceipt over `receive#Asset`.
- **Receipt steps** (P3): step 1 posts to the product's default location until P9's rules, step 2 to receiving, step 3
  to quarantine (P8).
- **Screens** (design §4):
  - Receipts: ReceiptFind, ReceiptList (list, board and calendar), NewReceipt. A return opens the shipment its approval
    created; a transfer's leg comes with P15.
  - ReceiptDetail: Accounting's `Shared/ShipmentDetail` with crosscut §3.8's receipt row, and `close#ReceiptRemainder`.
  - Receive: ReceiveSource, ReceiveLine, GenerateTracking, AdHocReceipt and ReceiveRemaining. "Receive all as expected"
    needs explicit confirmation.
  - Supplier360: Products' `Shared/Supplier360` with the Warehouse row of crosscut §3.3: Contact, Orders, Receipts,
    Returns, rejections, Files and Chatter, on its own `appRoot == 'Warehouse'` branch (F44).
  - HandheldReceive.
- **Around the receipt:** the incoming bill SECA runs only for a self-billing supplier, as Accounting conditioned it in
  its P6, and the AssetReceipt EECA, in mr-mantle, calls `mantle.account.InvoiceMatchServices.queue#MatchReevaluation`
  (its P7).
- **Outputs and shell:** the receipt and rejected-goods receipt; the receipt exception notification; the shipment
  palette type; quick create receipt.
- **Usable when** (design §19, short receipt):
  - a receiver receives part of a PO part with one rejected unit and a generated lot range;
  - they close the remainder with a reason, or backorder it;
  - the bill is created only for a self-billing supplier, for the accepted quantity;
  - a second NewReceipt for the part opens the same receipt;
  - a double submit answers the first receipt, and a serial count that does not match is refused.

### P8 — Inspection

These are crosscut CX-QUALITY (§4), built to crosscut §3.19 and WH-QUALITY.

- **Records:** `mantle.product.quality.InspectionTemplate` and `InspectionTemplateItem`, `QualityInspection`,
  `InspectionReading` and `QualityInspectionContent`. The one disposition vocabulary is seeded: Release, Quarantine,
  Rework or repair, Return to customer, Return to supplier, Scrap, Use as is.
  - Template revisions follow the shared rule (impl-drawers-commons §4), not version records: template items are
    effective-dated rows with their key fields audit-logged. Publishing stamps their from date; a change to a published
    item ends it and starts a new row, never editing it in place. An inspection keeps its template and the time it was
    created, and reads the items as of then; Revision history reads the rows and the audit log, and the template
    prints as of a date.
- **`mantle.product.QualityServices`:**
  - `store#InspectionTemplate` (`QUALITY_TEMPLATE_EDIT`); `create#Inspection`, `save#InspectionReading` and
    `submit#Inspection` (`QUALITY_INSPECT`); and `verify#Inspection`, which a separate permission, `QUALITY_VERIFY`,
    runs;
  - `dispose#Inspection` (`QUALITY_DISPOSE`). Release first reserves stock that has customer demand to its order item,
    then sets AstAvailable. Scrap goes through P6's `scrap#Asset`. Each disposition calls
    `mantle.account.InvoiceMatchServices.queue#MatchReevaluation`;
  - `get#SourceInspectionStatus`: held, match-eligible and rejected. It replaces the reading Accounting used before
    CX-QUALITY existed (F31).
- **On receipt:** when TrackingPolicy or a published template applies, Receive posts the accepted quantity as
  AstQuarantine into a quarantine location and creates the inspection in the same operation.
- **Screens:**
  - Inspections: InspectionFind and InspectionList. Moving a board card assigns work only, and a bulk reassignment
    names each result.
  - `Shared/QualityInspection` (Header, Readings, Result, Disposition, History) and `Shared/InspectionTemplates`
    (Templates, Characteristics, Sampling, Applicability, Revision history), with the Warehouse context.
- **Outputs and shell:** the inspection evidence and disposition certificate; the inspection-decision notification;
  and the Warehouse today-source, created here in `ironstone.warehouse` with the inspections whose inspector the user
  is (F42). P10 and P11 extend it.
- **Usable when** (design §19, receipt to partial inspection):
  - a receipt that needs inspection lands in quarantine, and its held quantity shows to matching;
  - an inspector saves readings and submits;
  - a quality manager releases part, which is reserved first to the waiting order, and scraps the rest;
  - an inspector cannot verify; a change to a published template item starts a new row, and an earlier inspection
    still shows the items it used.

### P9 — Putaway

- **WH-PUTAWAY:**
  - `mantle.facility.PutawayRule`, with storage-type applicability;
  - `mantle.facility.PutawayServices.store#PutawayRule`, checking `FACILITY_EDIT`; putaway itself is a move
    (`STOCK_MOVE`);
  - `resolve#Destination`. It tries the ProductFacilityLocation default first, within the rules, and checks compatible
    units, owner, status and capacity with incoming reservations. It explains each chosen and rejected destination;
  - `get#Capacity`, which the resolver uses. The Capacity screen is §7.
- **Screens** (design §4, §12):
  - Putaway: PutawayQueue by age and pick sequence, and Destination. A destination other than the suggestion needs a
    reason, and quarantined stock moves only within quarantine.
  - PutawayRules: RuleList and RuleTest.
  - HandheldPutaway.
- Receive's step 1 now posts to the resolved destination.
- **Outputs and shell:** the putaway sheet. Putaway has no assignment, so it has no Today source; its queue is on Home
  (F42).
- **Usable when:**
  - a two-step receipt queues its stock in receiving;
  - Putaway suggests the rule's bin, and explains another bin's refusal for capacity;
  - when no bin fits, the stock stays in staging with the reason named.

### P10 — Counts

- **WH-COUNT, the records.** The PhysicalInventory and PhysicalInventoryCount fields of the design's need, and the
  status transitions of the four PI statuses (F4).
- **The count schedule** (§4), as count-schedule rows of WarehousePolicy, `mantle.facility.CountSchedule`:
  - scope: organization, facility, location type, area or location, product category, and ABC class;
  - kind:
    - periodic, every N days (Odoo's location frequency);
    - annual, on a month and day (Odoo's company count date);
    - zero confirmation, when a location's stock reaches zero (OCA's stock_cycle_count);
  - the count mode (full, cycle or spot), the blind default and the assignee, with effective dates.

  `FacilityLocation.lastCountDate` and `ProductFacility.lastCountDate` are written by `post#Count`.
  `ProductFacility.abcClassEnumId` (the `AbcClass` enumeration: A, B, C; §4) is set by hand through
  `store#ProductFacilityPolicy`. The schedule's rows are written with `STOCK_POLICY_MANAGE`.
  `find#DueCounts` gives each location, or product at a facility, its next date: the last count plus the frequency,
  or the annual date, whichever is earlier, as Odoo does. Ad hoc dues are the short-pick recount (P11) and Request a
  count. That is Odoo's wizard: on selected Assets or Availability rows it opens NewCount with that scope, a date, an
  assignee and the blind flag.
- **`mantle.product.InventoryCountServices`,** checking `STOCK_COUNT` to create, start, record and submit,
  `STOCK_COUNT_REVIEW` to review, recount and resolve, and `STOCK_ADJUST` to post:
  - `create#`, `update#` and `start#Count`, which snapshots the scope;
  - `record#CountLine`, which saves an observation only;
  - `submit#`, `review#` and `recount#Count`, and `resolve#CountConflict`;
  - `post#Count`. It sums the approved deltas per asset for the variance SECA (F5) and locks disjoint buckets. It
    records each line's outcome, and a retry skips the successes;
  - `find#DueCounts`.
- **Screens** (design §7, §14):
  - Counts, with the Due saved find, CountDetail and CountEntry. CountEntry has a desktop grid and one line at a time
    on a handheld, and the server withholds blind quantities.
  - The count schedule under StockPolicies, and Request a count on Assets and Availability.
  - CountReview: VarianceReview, ResolveConflict and PostCount. Its valuation basis shows with financial read only.
  - CountVariance, under Reports with a link from Counts.
  - HandheldCount.
- **Outputs and shell:**
  - the blind count sheet and the reviewed variance sheet;
  - the count-entry CSV import and its row-result CSV;
  - due counts on Home, as a notification, and the counts assigned to the user in P8's Warehouse today-source (F42).
- **Usable when** (crosscut §6, count with moving stock):
  - a pick-face location type counted every 30 days, the facility's annual date and a location that just reached zero
    each show as due, with the earlier date winning;
  - a blind count snapshots its scope, a move during counting is found, and a recount resolves it;
  - the approved lines post, an uncounted line stays unchanged, a failed line is named, and a retry posts nothing
    twice;
  - a counter never receives an expected quantity.

### P11 — Picking

- **WH-PICK:**
  - `ShipmentWorkServices.preview#ShipmentLoadsForOrders`;
  - `create#ShipmentLoadsForOrders` with a result per group and a retry identity, its current result unchanged;
  - `WarehouseTaskServices.record#ShortPick`, writing the new `mantle.shipment.ShipmentPickException` and a recount;
  - `finish#Pick` and `reverse#Pick`;
  - `find#PickFaceReplenishment`, the first reader of the pick-face levels (F19);
  - the flag on a ShipmentItemSource whose balance was cancelled through `cancel#OrderItem` and
    `reduce#AssetReservation`. Customer Service's `apply#OrderChange` uses the same path later.

  The preview and the guarded wave create check `SHIPMENT_LOAD_EDIT`, the pick services `SHIPMENT_PICK`, and a
  pick-face move `STOCK_MOVE`.
- **Screens** (design §9, §10):
  - Shipments: ShipmentFind with drop shipments read-only under the type filter, ShipmentList, NewOutgoing.
  - ShipmentDetail: Accounting's `Shared/ShipmentDetail` with crosscut §3.8's outbound row.
  - OrderDetail: Projects' `Shared/OrderDetail` with the Warehouse row of crosscut §3.6, money with financial read
    only. A held order gets no new shipment.
  - Picklists, and PicklistDetail with LoadHeader, LoadShipments, LoadPeople, LoadEquipment and LoadCompletion.
    `binLocationNumber` is on both the shipment and its source (F18).
  - CreatePicklists: selection, preview and create.
  - Pick: PickLines, PickScan, ShortPick, FinishPick and PutBack.
  - PickLocationMoves: PickFaceNeeds, QuickPickMove and BelowMinimum.
  - HandheldPick and HandheldPickFace.
- **Outputs and shell:** the picklist and the combined pick and pack sheets; P8's Warehouse today-source gains the
  user's loads open from an earlier day (the shell's Today shows a load as an event on its start day only, F42);
  the short-pick notification; the picklist palette type.
- **Usable when** (crosscut §6, sales order fulfillment, Warehouse's part):
  - a wave from three ready orders previews one excluded order and creates two loads, each with its result;
  - a picker picks one line and short-picks another. It shows Short and opens a recount, and on-hand is unchanged;
  - a cancelled balance shows in Put back, and nothing moves until the picker confirms;
  - a pick face below its minimum lists its bulk source and is replenished.

### P12 — Packing

- **Pack** (design §10): PackScan, PackageEditor, PackageContents, PackOptions, PackAssembly and CompletePack.
  - CompletePack calls `complete#ShipmentPack` with getLabels and getReturnLabels false (F17). The pack SECA creates
    the sales invoice, which BOSS keeps.
  - ReopenPackage calls the entry point `mantle.shipment.WarehouseTaskServices.reopen#ShipmentPackage`. It calls
    Accounting's `mantle.account.InvoiceServices.release#ShipmentDraftInvoice` first (impl-accounting P17), then
    `unpack#ShipmentItemIssuance` (F11). Behind D3's flag the pack invoice stays in process until the shipment ships
    (impl-accounting §4), so the release succeeds. The same steps put back a reduced line that is already packed.
  - CompletePack's guard, `reopen#ShipmentPackage` and PackAssembly's guard check `SHIPMENT_PACK`.
- **`Shared/MaterialIssueReceipt`** (crosscut §3.9) with the Warehouse context, first with the shipment-assembly source.
  PackAssembly runs `pack#ShipmentAssemblyComponent`, which calls `produce#AvailableAssemblies`, through the guard.
  The kit receipt carries the issued component cost ÷ kit quantity, from Products P2's kit components, so no WIP
  remains: Mantle has no kit cost (F41), so a new organization flag, `PartyAcctgPreference.kitCostFromComponents` (off
  by default), read inside `produce#AvailableAssemblies`, costs the kit from its work effort's component issuances for
  every caller, `pack#ShipmentProductScan` included. P16 adds the work-effort source.
- **BoxTypes** (design §12): BoxTypeList and CarrierBoxCodes. FacilityDetail gains its Box types tab (FacilityPackaging).
- **HandheldPack.**
- **Outputs:** the packing slip, the package contents and inserts.
- **Usable when** (design §19, multiple packages and the reopened package):
  - a shipment packs into two boxes with their weights;
  - complete pack creates the sales invoice and requests no label;
  - a package is reopened while its invoice is in process, and a reduced line is put back;
  - a package whose invoice is final stays closed;
  - the DEMO_PA kit packs at its components' cost and leaves no WIP.

### P13 — Shipping, labels and printers

- **WH-LABEL:**
  - `WarehouseTaskServices.get#ShipmentRates`. It calls the configured implementations of the `get#ShippingRate` and
    `get#ShippingRatesBulk` interfaces, and a local-rules provider over the `get#OrderShippingRateLocal` logic (F14);
  - durable provider-request records for label request, tracking and refund. After a timeout, the provider is asked
    before any retry;
  - the Mantle test carrier (§4; F14): rates, PDF labels, refund, tracking and address checks, with a timeout, a
    refused label and an invalid address set off by reserved postal codes;
  - FacilityPrinter's `copies`, `fromDate` and `thruDate`, and the PtpLotLabel, PtpLocationLabel and PtpCountDocuments
    purposes (F15);
  - `mantle.facility.PrintServices.dispatch#Document` and `get#PrinterCapabilities`, over the framework's
    `print#Document` and NetworkPrinter (F16);
  - PDF labels only, through Products P11's barcodes. ZPL, with FacilityPrinter's `labelFormatEnumId`, is §7 (§4).
- **WH-POST, shipping:** `record#PackageDelivery`. Dispatch requires tracking totals, inspection release and unexpired
  lots. Labels, delivery and ship check `SHIPMENT_SHIP`, and the printer bindings `FACILITY_EDIT`.
- **Screens** (design §10, §12):
  - Ship: ShipmentAddress, RateOptions, Labels, ManualCarrier and ShipConfirm.
  - PackageTracking: TrackingFind, TrackingList and RecordDelivery.
  - Carriers: CarrierMethods, GatewayBindings with credentials masked, and CarrierTest.
  - Printers: PrinterIndex and PrinterTest. FacilityDetail gains its Printers tab (FacilityPrinters).
  - InvoiceDetail: `Shared/InvoiceDetail` with the Warehouse row of crosscut §3.16, read and print only, with financial
    read.
- **Labels and outputs:** location, lot, serial, container and box labels from FacilityDetail, Lots, Containers and
  BoxTypes; carrier labels, return labels and manifests.
- **Usable when** (design §19, label timeout and retry):
  - a two-package shipment is rated by local rules and by the test gateway;
  - a label timeout asks the provider before retrying and buys no second label;
  - a method with no gateway ships with a manual tracking code and cost;
  - a label refund reverses no shipment;
  - a print failure leaves the posted result and offers a reprint.

### P14 — Returns

- **WH-RETURN.**
  - ReturnReceipt runs Accounting P17's `receive#ReturnItems` (`STOCK_RECEIVE`). Quarantine and inspection are P8's.
  - `ship#SupplierReturn` sets ReturnShipped.
  - A supplier return issues the specific quarantined asset through `issue#AnyAssetForShipmentItemSource`, with
    `QUALITY_DISPOSE`. Purchasing's `find#ReturnableReceipts` gives the returnable receipts and lots.
- **Purchasing's contract** (§4, PUR-RETURN): `mantle.order.ReturnServices.find#ReturnableReceipts`, with
  PUR-RETURN's link from a ReturnItem to the AssetReceipt and asset it returns (F32). Eligibility is the accepted plus
  quarantined quantity less earlier supplier returns, locked per receipt and lot. Warehouse's NewReturn uses it for a
  supplier return; Purchasing's NewSupplierReturn and `create#ReplacementOrder` stay Purchasing's.
  - `mantle.shipment.WarehouseTaskServices.request#ReturnLabel`, for Customer Service's "Issue return label".
- **WH-RECORD-HOSTS, the return part:** `mantle.order.return.ReturnContent`, registered in `get#RecordLinkInfo`.
- **Screens** (design §11):
  - Returns: ReturnFind, ReturnList, and NewReturn over `create#Return` and `create#ReturnFromOrder`. Authorization is a
    separate right, `RETURN_AUTHORIZE`, which no Warehouse group holds, and `receive#ReturnWithoutShipment` is not
    offered.
  - ReturnDetail: Accounting's `Shared/ReturnDetail` with the Warehouse row of crosscut §3.18: Overview, Eligible items,
    Shipments/receipts, Inspection/disposition, Settlement (read only), Files and Chatter.
  - ReturnReceipt and SupplierReturnShipment: `Shared/ShipmentDetail` with their crosscut §3.8 rows.
- **Outputs:** the RMA receiving slip and the supplier-return slip.
- **Usable when** (crosscut §6, customer and supplier returns; design §19, the return in two boxes):
  - part of an RMA is received in one box with one unit rejected at the dock, and the rest in a second box;
  - receipt settles nothing; inspection restocks one unit and scraps another;
  - a supplier return of a rejected lot issues the quarantined asset and ships, setting ReturnShipped;
  - a Warehouse user cannot settle.

### P15 — Transfers and requests

- **Transfers** (design §8): TransferFind with the "custody at supplier" filter, TransferList with each leg's progress,
  and NewTransfer over `create#Shipment` with ShpTpTransfer.
  - TransferShipmentDetail: `Shared/ShipmentDetail` with crosscut §3.8's transfer row and its Transit pane. The origin
    picks and ships; the destination receives, inspects and puts away.
  - The guard copies the source issuance's acquireCost and owner into the destination receipt. Accounting's P19
    readiness checks `transferGlAccountId` (F21).
  - A line's remaining quantity is its issuances less its receipts, each summed apart: `ShipmentItemDetail` multiplies
    them, so neither it nor `receive#EntireShipment` receives a transfer (F37; Mantle's `WarehouseStockChecks`).
- **WH-REQUEST:**
  - RqtInventory validation on `create#Request`;
  - `mantle.request.RequestServices.get#InventoryRequestProgress`;
  - `WarehouseTaskServices.allocate#InventoryRequest` (`STOCK_MOVE`): a transfer, or a guarded move within one
    facility;
  - the Requirement link through the existing RequirementRequestItem (F22). RequirementSupply waits for CX-PLANNING
    (§7).
- **Screens:**
  - StockRequests: StockRequestFind, StockRequestList and NewStockRequest;
  - RequestDetail: Projects' `Shared/RequestDetail` with the InventoryRequestProgress panel of crosscut §3.11;
  - quick create transfer and stock request.
- **WH-SUBCONTRACT, the dispatch:**
  - the Custodian FacilityParty role (F22), and an organization-owned vendor-custody facility in the demo;
  - SubcontractShipmentDetail: `Shared/ShipmentDetail` with crosscut §3.8's subcontract row. Components go by
    `move#Asset` or a ShpTpTransfer, with the run, operation and service PO item fixed (OrderItemWorkEffort exists,
    F22). Unused components come back the same way. The output receipt is P16.
- **Outputs:** the transfer sheet.
- **Usable when** (design §19, transfer in transit):
  - a transfer ships at the origin, shows in transit and not usable at the destination, and is received in two parts
    at the origin's cost and owner;
  - a stock request is approved, allocated by transfer, and shows requested, allocated, transferred and received;
  - components dispatched to a vendor-custody facility stay the organization's and show under custody at supplier.

### P16 — Production runs and stock

These are Manufacturing's contracts (§4), built to design-manufacturing NewWorkOrder, WorkOrderDetail,
MaterialIssueReceipt and SubcontractDetail, and M2 and M4 of its §12; and Purchasing's service acceptance, built to
design-purchasing PUR-RECEIPT. They use Products P8's released BOM and routing and P9's approved standard costs.
Built in two parts: P16a the runs and their lines, then P16b the stock guards. Under the shared effective-date rule
(§4) a run has its own lines, written at create and frozen at release, in place of the designed snapshot records.

- **P16a, the runs (part of M4).**
  - The run's own fields, audit-logged: its revision counter, its release time (which reads the BOM, routing and
    production policy as of that time), the frozen standard cost (its effective-dated `productStandardCostId`,
    Products P9) and its demand links.
  - `mantle.work.production.ProductionRunLine`: the run's material and output lines by role, each with a stable
    line ID, its source `bomItemId`, product, quantity and unit, exact stock conversion, and operation. Key fields
    are audit-logged; the lines are written at create and frozen at release. They are records of their own because
    issuances and receipts reference them (the shared rule's exception).
  - Each operation child WorkEffort carries its routing operation, sequence and work center, audit-logged.
  - `mantle.work.ProductionServices`, whose create and release check `PRODUCTION_PLAN` and whose read
    `PRODUCTION_VIEW` or `STOCK_ISSUE` (Manufacturing P1 grants the production permissions):
    - `create#ProductionOrder`, to design-manufacturing §12's contract. It calls `create#ProductionRun` without the
      legacy consume and produce products, so no `PatMfgBom` row is read or written. It sets the run's
      `ownerPartyId` to the organization, writes the draft lines and `WeptConsume`/`WeptProduce` rows from the BOM
      and routing as of the chosen date, and calls `check#ProductUsable` with usage Produce. The lines stop at
      non-phantom sub-assemblies and blow phantoms through with their routing (§4);
    - `release#ProductionOrder`: it freezes the lines, stamps the release time and revalidates against any later
      release of the method. It creates the operation children with their owner, and rewrites the
      WorkEffortProduct rows from the lines;
    - `get#ProductionOrder`, the read MaterialIssueReceipt shows.
  - The seeded `WeApproved`→`WeInPlanning` transition, for an unrelease while no stock fact exists.
  - Manufacturing's WorkOrders, NewWorkOrder and WorkOrderDetail screens stay Manufacturing's. A demo service creates
    and releases the runs the walks need.
- **P16b, the stock guards (M2).**
  - CX-PRODUCTION's fields: `AssetIssuance.productionMaterialLineId`, `AssetReceipt.productionOutputLineId`, and
    `operationWorkEffortId` on both (F7), each a run line or operation. `sourceAssetIssuanceId` came with P6.
  - `mantle.work.ProductionServices`, each guard checking `STOCK_ISSUE`:
    - `issue#ProductionMaterial`: a new AssetIssuance per operation key and material line. It refuses an asset that
      is not AstAvailable, or whose owner is not the run's owner;
    - `return#UnusedMaterial`: a new receipt fact at the original acquireCost. It never calls
      `cancel#AssetIssuance`;
    - `receive#ProductionOutput`: acquireCost is the run's frozen standard unit cost. With no approved standard
      it is the issued cost to date ÷ quantity, marked provisional. Output is AstQuarantine when an inspection applies,
      with GenerateTracking (P7);
    - `receive#SubcontractOutput`. In one transaction it issues the run's material lines from the vendor-custody
      facility, receives the output with the run's workEffortId and no transfer shipment, and calls
      `accept#ServiceItem`.
  - Purchasing: `mantle.order.OrderServices.accept#ServiceItem`, over `mantle.order.purchase.ServiceAcceptance`,
    checking `PURCHASE_ORDER_EDIT` or `STOCK_RECEIVE`, or inside `receive#SubcontractOutput` that service's check (§2).
- **Screens:**
  - `Shared/MaterialIssueReceipt` gains the work-effort source: Source, Material lines, Tracking, Posted
    issues/receipts, Unused returns and Files;
  - SubcontractShipmentDetail's Output receipt pane.
- **Usable when** (design §19, subcontract output):
  - a run for DEMO_1_1 is created from Products P8's released BOM and released, with its lines and its frozen
    standard; a later release of the BOM leaves the released run's lines as they were;
  - two components are issued to a run in two operations as two issuances, and a retried issue answers the first;
  - one unused component returns as a new receipt at its cost;
  - output is received into quarantine with generated serials, at the run's frozen standard cost;
  - subcontract output is received from the vendor-custody facility: its components are issued and the service line is
    accepted once;
  - a quarantined component is refused.

### P17 — Reports

- **WH-REPORT:** `mantle.product.InventoryReportServices.get#InventoryAtDate`, beside the existing
  `get#InventoryProjectedInfo` (F23). It reads the AssetDetail ledger by effective date, with facility, location, lot
  and owner scope, reads a revaluation split's pair of rows as one (F34), and flags history that is incomplete.
- **Screens** (design §14):
  - Reports;
  - StockAtDate: `Shared/StockAtDate` (crosscut §3.26). Customer Service mounts it later;
  - OperationsHistory;
  - InventoryValuation: Accounting's `Shared/InventoryValuation`, with the Warehouse row of crosscut §3.25. It shows
    values with financial read, and revaluation (`mantle.ledger.AssetBookServices.preview#Revaluation` and
    `post#Revaluation`, §4) stays in Accounting's context.
- **Exports:** stock at date, and quantities, movements, history and lineage, each with its screen's filters.
- **Home complete:** every card and MyWork source of design §3.
- **Usable when:**
  - stock at a past date for a lot shows its opening, receipts, issues, adjustments and closing, and flags history from
    before the demo's first movement as incomplete;
  - OperationsHistory never adds incompatible units;
  - a Warehouse user without financial read is refused InventoryValuation's values, and the quantity reports are
    complete.

### P18 — Finish

- The terminal twins, and the server-static pass.
- The design §19 acceptance review and crosscut §6 standalone operation. A Warehouse user with no other launcher, and an
  organization with no ProductStore, run receive to ship. That user is refused cost, settlement and other
  organizations' facilities, through URLs, shared contexts, handheld mounts, exports, the palette and search.
- The §16 outputs not built earlier.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-warehouse.md, or into the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Warehouse is built after Accounting. It adds its context to Accounting's ShipmentDetail, ReturnDetail, EquipmentDetail and InventoryValuation, and uses Accounting's `receive#ReturnItems`, `release#ShipmentDraftInvoice`, `queue#MatchReevaluation`, posting guard and conditioned SECAs | The user's call. The alternative was Warehouse first, building those screens, with impl-accounting changed to extend them |
| Oct 28, 2026 | Phase order: the stock ledger first. That is the foundation, facilities and policy, and inventory with the posting guard; then receiving, inspection, putaway, counts, picking, packing, shipping, returns, transfers and requests, production stock and reports | The user's call. The alternatives were the outbound flow first, and the inbound flow first |
| Oct 28, 2026 | Warehouse builds the parts of other needs it depends on: crosscut CX-QUALITY with its two shared screens (P8); Manufacturing's production stock guards with the CX-PRODUCTION fields (P16); Purchasing's `accept#ServiceItem` (P16). These keep the owner's names and Shared screens, in Mantle's packages (the boundary row below). Supply planning (CX-PLANNING) waits for its owner, so SupplyPlanning and RequirementSupply are §7 | The user's call, as Products and Accounting decided for theirs |
| Oct 28, 2026 | The shared screens Warehouse builds first carry the Warehouse context only. Another app's context is added when that app is built | Follows from the above, as in Products and Accounting |
| Oct 28, 2026 | Each task phase brings its handheld mount, on P5's `scan-input` and `density="handheld"` | The plan's choice: a handheld phase at the end would test each task twice |
| Oct 28, 2026 | Facility scope follows Moqui's organization filters. A user works in the facilities their organizations own (`Facility.ownerPartyId`): the active organization's when one is set, or else those of every organization they belong to (`filterOrgIds`, with direct child organizations). A user whose Warehouse authz has no organization filter works in every facility of every organization. Facilities owned by a third party that hold the organization's stock are §7 | The user's call. Vendor-custody facilities are organization-owned, so they are in scope (F2) |
| Oct 28, 2026 | Warehouse builds Purchasing's `close#PurchaseRemainders` (P7) and `find#ReturnableReceipts` with its receipt link (P14), as Purchasing's contracts. Purchasing is built later | The user's call, since both are small. Each is one service, over `cancel#OrderItem` or receipt and return reads |
| Oct 28, 2026 | The cycle-count schedule is flexible (P10): CountSchedule rows of WarehousePolicy by facility, location type, area or location, product category or ABC class, each periodic every N days, annual on a date, or zero confirmation. Last count dates are kept on FacilityLocation and ProductFacility; the next date is the earlier of the periodic and annual dates; the short-pick recount and Request a count are ad hoc dues. Accuracy- and movement-based frequencies, and computed ABC classes, are §7 | The user's call, from the common options. Odoo: a location's frequency in days with last and next dates, the company's annual count date, and Request a count with a date and assignee. OCA's stock_cycle_count for Odoo (not in the checkouts): periodic, zero-confirmation, accuracy and turnover rules. SAP and NetSuite: ABC classes with a frequency per class. ERPNext has no schedule; its counts are Stock Reconciliation entries. Carbon scopes counts by storage unit, item type, storage type and tags, with no schedule. Ever Gauzy has full, cycle, spot and recount modes |
| Oct 28, 2026 | Labels are PDF only in the first release; ZPL, with FacilityPrinter's format field, is §7 | The user's call. The design's §19 recommendation, without its ZPL option |
| Oct 28, 2026 | Warehouse also builds Manufacturing's production runs and their lines (P16a): `create#ProductionOrder`, `release#ProductionOrder` and the run's lines of M4. The guards key those lines, and output takes the frozen standard cost. Manufacturing's screens, and the rest of M4 and of M2, stay Manufacturing's | The user's call, to the existing design. It removes the stand-in line keys that P16 would otherwise need. The snapshot form became the run's own lines by the shared rule (below) |
| Oct 28, 2026 | The shared rules of impl-drawers-commons §4 apply: parties by role, and changes by effective date and the audit log. Here: WarehousePolicy and CountSchedule are effective-dated rows with audit-logged key fields; inspection templates change by effective-dated items (P8); the Custodian FacilityParty role stays (P15). Mantle's existing audit-logged Asset, Shipment, Lot and ReturnItem fields are kept | The user's call, in the Purchasing plan review (impl-purchasing §4) |
| Oct 28, 2026 | The root: `BOSS_WAREHOUSE` as root user group and artifact group. Its groups take `MANTLE_USER_ORG`, whose Facility filter is the facility scope above, and `BOSS_WAREHOUSE_ADMIN`, with all authz on the root, `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` (impl-drawers-commons §4) | The user's call (§5 review), for every BOSS root |
| Oct 28, 2026 | `scan-input` is a new form field element (style-guide §8.1). Its `resolver` names a service: in `scanText`, `allowedTypes`, the screen's context (facility, task) and a client `scanId`; out `matches` (`identityType`, `id`, `label`, `detail`) and `parsed` GS1 fields from Products P11's parser. One match fills the field and submits with the `scanId`, several open the chooser, none names the failure and keeps focus. The transition uses the `scanId` as its operation key on the CX-POSTING record, so a double scan answers the first. html and tui fall back to a text input posting to the same resolver (F24) | The user's call (§5 review). The alternatives were a mode of `text-line`, and a mode of drop-down's server search |
| Oct 28, 2026 | On a `density="handheld"` screen the attribute wins over the user's comfortable or compact preference; the preference applies everywhere else (F24). Manufacturing's screens follow | The user's call (§5 review). Each task has its own handheld mount, so desk users take the desktop screen. The alternative was handheld density by device width |
| Oct 28, 2026 | The expiry gate is inside Mantle, behind its WarehousePolicy flag (F12): reservation skips assets whose own or lot expiry has passed and names a shortfall, and issue (sales and production) refuses an expired asset with its date. Quarantine, return, disposal and moves are unchanged | The user's call (§5 review). Mantle's own SECAs reserve on order placement and approval, which BOSS guards never see. The alternative was the guards only |
| Oct 28, 2026 | Scrap's account goes by its reason (F5, F21): `post#PhysicalInventoryVariance` reads the organization's `VarianceReasonGlAccount` row for the reason, then for a scrap reason with none the asset type's `scrapGlAccountId`, and otherwise found or shrinkage by sign as before. With nothing mapped it posts as Mantle does, so it needs no flag. Accounting P13 builds the poster change and seeds the scrap reasons' rows | The user's call (§5 review). Mantle's unused VarianceReasonGlAccount, so damage, theft and expiry can post apart. The alternative was scrap as shrinkage |
| Oct 28, 2026 | ABC classes (P10) are per product at a facility: an audit-logged `ProductFacility.abcClassEnumId` over a new `AbcClass` enumeration seeded A, B and C, extended as data. An unclassed product is counted by the schedule's other scopes | The user's call (§5 review). The alternatives were a class on Product, and a Product default with a facility override |
| Oct 28, 2026 | A Mantle test carrier for specs and demos (P13; F14): `mantle.shipment.carrier.TestGatewayServices`, a seeded ShippingGatewayConfig implementing every carrier interface deterministically: rates by weight and a zone table, a PDF label with a tracking number, refund, tracking and address validation. Reserved ship-to postal codes set off a timeout (the label exists when asked later), a refused label and an invalid address. It keeps its own record of the labels it issued, so ask-before-retry and refunds check something real. Real carriers are later gateways | The user's call (§5 review). The alternatives were a carrier's sandbox, which needs keys and network, and stubs in the specs only |
| Oct 28, 2026 | Production runs under the shared rule (P16a): the run's revision, release time and frozen standard are audit-logged fields of the run, its material and output lines are `ProductionRunLine` records with stable IDs, written at create and frozen at release, and its operation children carry their routing operation, sequence and work center. ProductionRunSnapshot, ProductionMaterialSnapshot and ProductionOperationSnapshot are dropped | The user's call, with Products' methods (impl-products §4). The lines stay records because issuances and receipts reference them; WorkEffortProduct, keyed by run, product and date with no unit (impl-manufacturing F11), stays the per-product aggregate. The alternatives were WorkEffortProduct rows with a sequence and unit added, and the designed snapshots |
| Oct 28, 2026 | The Mantle boundary. Warehouse's stock, quality, count, putaway, print and production services were Mantle already and stay so; each new entry point checks its own Moqui permission and the organization by party relationship (§2). Purchasing's three contracts built here move to `mantle.order`: `OrderServices.close#PurchaseRemainders` (P7) and `accept#ServiceItem` (P16b), and `ReturnServices.find#ReturnableReceipts` (P14). Mantle's own calls take Mantle names: `mantle.other.BudgetServices.release#Commitment` (P7), `mantle.account.InvoiceMatchServices.queue#MatchReevaluation` from the AssetReceipt EECA and `dispose#Inspection` (P7, P8), `mantle.account.InvoiceServices.release#ShipmentDraftInvoice` from the new `WarehouseTaskServices.reopen#ShipmentPackage` (P12), and `mantle.product.ProductServices.resolve#ScannedProduct` (P6, P7). `ironstone.warehouse` keeps AccessServices, the screens' reads and shapes and the settings forms; Commons' `PaletteServices.get#RecordLink` routes the records (P1). P1 grants the Warehouse groups `STOCK_RECEIVE`, `STOCK_ISSUE`, `STOCK_MOVE`, `STOCK_ADJUST`, `STOCK_COUNT`, `STOCK_COUNT_REVIEW`, `LOT_EXPIRY_EXTEND`, `SHIPMENT_PICK`, `SHIPMENT_LOAD_EDIT`, `SHIPMENT_PACK`, `SHIPMENT_SHIP`, `FACILITY_EDIT`, `QUALITY_INSPECT`, `QUALITY_VERIFY`, `QUALITY_DISPOSE` and `QUALITY_TEMPLATE_EDIT`; Products P9 grants `STOCK_POLICY_PLAN` and `STOCK_POLICY_MANAGE`, and financial read is Accounting's `ACCOUNTING_VIEW`. A contract another entry point calls in its operation takes that entry point's check, so a receiver closes a PO remainder and an issuer accepts a subcontract line | The user's call (plan review Q2): Mantle stands without BOSS, so no Mantle service, SECA, EECA, script, data file or spec calls `ironstone.*`, reads a BOSS screen, entity or setting, or names a BOSS group; and business logic leans to Mantle, in the package of the records it changes (impl-drawers-commons §4). The owner designs' names follow in the design sweep |
| Oct 28, 2026 | Revaluation changes forward cost (Products P9 builds Accounting's AC-07 `mantle.ledger.AssetBookServices.post#Revaluation`): it sets the on-hand assets' `acquireCost` from the effective date and splits a partly issued asset, without reposting history. Warehouse's Movements, AssetLedger and `get#Traceability` (P4) and `get#InventoryAtDate` (P17) follow the split (F34); revaluation itself stays in Accounting's context | The user's call (plan review Q7), as ERPNext and Odoo work. It replaces "value only" |
| Oct 28, 2026 | A run's lines (P16a) stop at non-phantom sub-assemblies, whose on-hand counts, and blow phantoms through with their routing, as `get#BomExplosion`'s requirements do; the full blow-through stays a parameter of the explosion | The user's call (plan review Q8), with Products P8's explosion |
| Oct 31, 2026 | P1: facility scope is read from the authorizations of the user's groups on the Warehouse root (`ArtifactAuthzCheckView` and their filter sets), not from the entity filter of the find at hand: when every authorization that lets the user in has a Facility filter, the owners are `filterOrgIds`; one with none (the admin group, ADMIN) is every facility. Disabled or inherited artifact authorization widens nothing, and an empty organization list is no facility | (agent's call, for review) Products' `mayOpen` reads root grants the same way. The alternative, the live Facility filter of the find, is absent when authorization is disabled and depends on which record authorized the frame |
| Oct 31, 2026 | P1: the facility owners are `filterOrgIds` kept to the organizations the user belongs to; an active organization they do not belong to (which Mantle lets an ADMIN or ACCOUNTING_ADMIN choose) is set aside for their own organizations (F58) | (agent's call, for review) The coordinator's question from the P0 review. Only the admin group's authorization, with no Facility filter, reaches other organizations |
| Oct 31, 2026 | P1: the Inspection, Counts and Picking areas show for their capability groups only (inspect and quality manager; count, count reviewer and adjust; pick, pick supervisor and move, for PickLocationMoves and HandheldPickFace), each grant with the root's filter sets (F59, F60); QualityInspection, whose role is `app`, is opened to every Warehouse user by an artifact group of its own when P8 builds it; the other areas, whose lists design §2 gives to `app`, show for every Warehouse user. Unbuilt areas keep the BOSS placeholder page (its `Placeholder:` label, which AppStructure counts) until their phase | (agent's call, for review) From design §2's Roles column |
| Oct 31, 2026 | P1: a record link of a kind whose Warehouse screen is not built yet opens Home's lookup of the record (`Home?lookupType=&lookupId=`); `Warehouse.js` keeps a `destinations` table each phase fills as it builds the kind's detail screen. The facility preference is Mantle's `FacilityActive` key, which `get#ScannedIdGeneral` reads | (agent's call, for review) The links work, scoped, from P1 on. The alternative, no link until each detail screen exists, leaves the palette and record links untestable in P1 |
| Oct 31, 2026 | P1: `BOSS_WAREHOUSE` and `BOSS_WAREHOUSE_ADMIN` hold `PRODUCT_CATALOG_VIEW` (F56). The dispatch, shipping manager and integration operator groups exist with no permission until their phases. `STOCK_RECEIVE` stays in Mantle's AccountingAccessData.xml beside its first checker; the other fifteen are in MantleSetupData.xml | (agent's call, for review) Warehouse users read their organization's products on every stock row and scan; the Products app stays closed to them |
| Oct 31, 2026 | P1: Home's queues all answer null counts (Unavailable) until the phase that builds each task list counts it; QueueFilters has the facility only, the owner and date horizon coming with the counts; no quick create, since no Warehouse record can be created yet | (agent's call, for review) The plan's "counts of later phases null" |
| Oct 31, 2026 | P2: a location closes now (no future-dated close), and `reopen#FacilityLocation` clears the date with a reason. Stock is an asset of type `AstTpInventory`, `AstTpSupplies` or none, which blocks only with on-hand or ATP not zero; every other asset type is equipment for the close. Until P10's count statuses, a count blocks while it is not `PIComplete` | (agent's call, for review) F43's blockers with the simplest dates; a scheduled close could be refused later by stock received after it was set |
| Oct 31, 2026 | P2 review: Mantle's facility and stock scope is one helper, `service/mantle/facility/FacilityScope.js` (`scope()`, `owns()`): every organization (`organizationPartyIds` null) for a system administrator or the new Mantle permission `FACILITY_ALL_ORGANIZATIONS` (MantleSetupData, granted to ADMIN and, in BossSetupData, to `BOSS_WAREHOUSE_ADMIN`), else the user's organizations narrowed to the active one when it is theirs (`filterOrgIds` within `userOrgIds`; F58's rule). `FacilitySetup.js` and `WarehousePolicy.js`'s guard both use it, and the stock guards from P5 on call it; BOSS's `canEdit` and `canPlan` follow it, so no action is shown that Mantle refuses | (agent's call, for review) §4's facility scope (the admin group works in every facility of every organization) carried into Mantle on `ACCOUNTING_ADMIN`'s precedent; the name is generic because the stock guards use the same scope (F75, F84) |
| Oct 31, 2026 | P2: the facility and location writes are new entry points of `mantle.facility.FacilityServices` (`store#Facility`, `store#FacilityLocation`, `store#FacilityLocationType`, `close#`/`reopen#FacilityLocation`) in `FacilitySetup.js`, checking `FACILITY_EDIT` and the organization by `userOrgIds` (all for ADMIN); `create#`/`update#Facility` and `create#FacilityLocation` keep their callers unchecked (§2) and are called inside `store#Facility` for the contact | (agent's call, for review) §2: a permission check goes on a new entry point only |
| Oct 31, 2026 | P2: `Shared/FacilityDetail`'s tabs are the files of `Shared/FacilityDetail/` ordered by menu index (Overview 1, Children 2, Locations 3, Products 4, Box types 5 for P12, Printers 6 for P13, Policies 7 for P3, Schedules 8, Files 9, Conversation 10); each tab reads what it shows and holds its own transitions, so a later tab is one new file. The chatter tab is titled Conversation, as Accounting's | (agent's call, for review) Products' and Accounting's tab pattern; P3's Policies tab needs no change to `FacilityDetail.xml` |
| Oct 31, 2026 | P2: the facility forms' choices are `ironstone.warehouse.FacilityServices.get#FacilityChoices` (its own `facilityChoices` transition in `template/WarehouseFacilityParts.xml`), not new sources of `AccessServices.get#Choices`; `Warehouse.js` only gains `destinations.facility`, three `sharedLinks` paths and the exports `required`, `inScope` and `facilityIds` | (agent's call, for review) Keeps the merge hotspot small |
| Oct 31, 2026 | P2: EquipmentDetail's Warehouse context is read-only: identity, assignments to people (`AssetPartyAssignment`) and work (`WorkEffortAssetAssign`), availability, bookings, maintenance summary and, with `financialRead`, the book through Accounting's `get#AssetBook`. Assigning equipment to a load comes with P11's PicklistDetail, its files with P4's AssetContent | (agent's call, for review) Design §12 EquipmentDetail; nothing in P2 assigns equipment |
| Oct 31, 2026 | P4: the asset metadata allowlist is the name and comments only, now audit-logged (`enable-audit-log="true"`, F115), through a new `mantle.product.AssetRecordServices.update#AssetMetadata` over `update#Asset` that checks `STOCK_ADJUST` and the organization; serial, lot and expiry corrections stay P6's documented corrections | (agent's call, for review) Design AssetHeader's "metadata-only allowlist". `STOCK_ADJUST`, since a metadata edit corrects the record; the alternative was any stock permission |
| Oct 31, 2026 | P4: `create#Lot` (LotMetadata for a new lot) checks `STOCK_RECEIVE` and `create#Container` (NewContainer) `STOCK_MOVE`, both in `mantle.product.AssetRecordServices` with `create#AssetContent`, a new file so the phases extending AssetServices.xml do not collide | (agent's call, for review) Receiving makes lots; containers belong to the move role (design §1) |
| Oct 31, 2026 | P4: Mantle has no stock read permission, so `TraceabilityServices.find#Movements` and `get#Traceability` check the organization by party relationship (`StockScope.js`: an asset whose owner or facility owner is one of the user's organizations) and narrow to the caller's `facilityIds`; the app's access check decides who calls them. Cost only with `ACCOUNTING_VIEW` | (agent's call, for review) A reader holds no `STOCK_*` permission and must read the ledger and Traceability |
| Oct 31, 2026 | P4: a lot with no stock anywhere (a new lot) is open to every Warehouse user (`check#Record`, LotList), since it names no organization's stock; a lot with stock follows its stock's facilities | (agent's call, for review) Otherwise a lot just created would vanish until something is received into it |
| Oct 31, 2026 | P4: Warehouse's Availability counts held as on hand less the available-status quantity (every status but AstAvailable, F39), and shows in transit, from two new compatible outputs of `get#ProductStockTotals`: `quantityByStatus` and `transitQuantity` (the owner's shipped transfers to the facility, issued less received). Products' Held (quarantine only) is unchanged | (agent's call, for review) F39 |
| Oct 31, 2026 | P4: AssetDetail serves every asset in the Inventory lists; the asset record link keeps AssetDetail for inventory and, once P2's `Locations/EquipmentDetail` is merged, sends a non-inventory asset (equipment) there; resolved in the merge of `destinations` | (agent's call, for review) The coordinator's merge note with P2 |
| Oct 31, 2026 | P4: Availability's Locations and lots, Reservations and Movements tabs show in the Warehouse context only (their screen condition); Product360's Replenishment tab is listed by Warehouse's branch only and placed last (menu index 19); Product360's tag and label links and Documents' translation and datasheet links show only when the context has their route | (agent's call, for review) The Products context is unchanged |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |
| QueueFilters' owner: the stock owner (`Asset.ownerPartyId`, which may differ from the facility owner where `assetAllowOtherOwner` is set) or the facility owner | Home, P4 | P1 left the filter out; with owner pools (P3) the stock owner is the likelier meaning |

The design's other §19 items are `later` there and in §7.

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Warehouse/` has seven placeholders: Home, Inventory, Locations ("Locations & facility setup"), Receiving, Returns ("Returns receiving"), Settings and Shipping. There are no Inspection, Counts, Transfers, Picking, Handheld or Reports areas; the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. The `BOSS_WAREHOUSE` authz is in BossSetupData's commented block. Products P1 seeds the `BOSS_WAREHOUSE_STOCK_PLANNER` and `BOSS_WAREHOUSE_MANAGER` groups | P1 |
| F2 | P0: `MANTLE_USER_ORG` filters Facility by `ownerPartyId`; `MANTLE_ACTIVE_ORG`'s Facility filter is commented out. Neither set filters Asset, AssetDetail or PhysicalInventory, and nothing filters by facility. Shipment (from or to party) and ReturnHeader (vendor or customer) are filtered in both. `filterOrgIds` is the active organization, or else every organization the user belongs to with direct child organizations | Stock rows through services (§2); facility scope through Mantle's Facility filter (§4, P1) |
| F3 | P0: Mantle REST posts `record#PhysicalInventoryQuantity`, `record#PhysicalInventoryChange`, `receive#Asset`, `issue#Asset`, `move#AssetReservation`, `receive#ShipmentProduct` and `receive#EntireShipment` with no BOSS guard | P1 grants the Warehouse groups no REST stock path; P0 checks the rest |
| F4 | P0: `record#PhysicalInventoryQuantity` given a count line writes the line's `quantityOnHand` and posts the delta at once; with no `physicalInventoryId` it creates one already PIComplete. PhysicalInventoryCount has no status, counter, reason or snapshot. Nothing in Mantle or Marble creates count lines. The four PI statuses have no transitions, and only PIComplete is used. Only AssetReservationMisc tests counts | P10's records and services; the immediate service stays for its callers |
| F5 | P0: `post#PhysicalInventoryVariance` (SECA `AssetDetailPhysicalVarianceGlPost`) posts once per asset per PhysicalInventory, and answers a message for a second delta, which never reaches the GL. It values the delta at the asset's acquireCost; a null cost is AtrNoAcquireCost and posts nothing. It picks the found or shrinkage account by the delta's sign. It never reads `varianceReasonEnumId`, and `VarianceReasonGlAccount` is unused | P10's per-asset sums (design CountReview); a scrap PhysicalInventory per operation (P6); scrap's account goes by its reason (§4) |
| F6 | P0: the variance reasons are InVrLost, InVrStolen, InVrFound, InVrDamaged, InVrIntegration, InVrSample, InVrMisShipOrdered and InVrMisShipShipped; there is no InVrScrap or InVrExpired | P6 seeds them |
| F7 | P0: AssetReceipt has `quantityAccepted`, `quantityRejected` and `rejectionReasonEnumId`. None of the CX-POSTING or CX-PRODUCTION fields exist on AssetReceipt, AssetIssuance or ShipmentItemSource | P5 (entered quantity), P6 (`sourceAssetIssuanceId`), P16 (the production lines) |
| F8 | P0: the location types are FltPick, FltBulk, FltReceiving, FltStaging, FltQuarantine and FltMorgue. There is no shipping-dock type; FcTpDock is a facility type. FacilityLocationType's per-facility `autoStatusId` is applied by `receive#Asset` and `move#Asset`. ZIRET_WH maps receiving to AstOnHold, quarantine to AstQuarantine and morgue to AstMorgue, and so a plain move of quarantined stock into a pick bin makes it AstAvailable | The held-stock rule (§2, P5); P2 adds the dock type; P1's demo adds the locations |
| F9 | P0: the EECA `AssetLocationFromContainer` copies a container's facility and location onto an asset whose `containerId` is set, so attaching an asset that is elsewhere moves it outside `move#Asset`. `ContainerAssetLocation` moves every asset of a container whose location changes | `attach#AssetToContainer` refuses an asset away from its container (P5); `move#Container` moves the contents through the guard. Written into design ContainerDetail |
| F10 | P0: `receive#EntireShipment` accepts each ShipmentItemDetail row's quantity less what was accepted and rejected, sets nothing short, then delivers the shipment. The view joins receipts and issuances on shipment and product, so a transfer's receipt totals may be multiplied (not yet tested) | P0 checks it with a spec; Finish never uses it for a short receipt (design). Written into design §15.2 if it holds |
| F11 | P0: `unpack#ShipmentItemIssuance` refuses an issuance whose source is on an invoice, and the pack SECA finalizes the invoice at pack (impl-accounting F25) | Behind D3's flag the invoice is finalized at ship (impl-accounting §4), so ReopenPackage releases it (P12) |
| F12 | P0: `reserve#AssetForOrderItem` reads the CustomerSingleLot and CustomerNewerInventory party settings and the last issued lot's expiry, and a store's reservation order can sort by end of life. Expired stock is never excluded | P5's gate inside Mantle, behind its flag (§2, §4) |
| F13 | P0: the 16 SECAs of design §15.2 exist under those names, all SECAs; the two emails run on commit. Not in the design: `AssetStatusNotAvailableReservations`, which checks reservations when an asset leaves AstAvailable, and the asset EECAs of F9. `ReturnApprovedProcess` runs `create#ReturnShipment` and then `process#ReturnItemResponses` | Written into design §15.2; P0 checks what quarantine does to a reservation before P8 |
| F14 | P0: `CarrierServices.get#ShipmentRates` is commented out. The active interfaces are `get#ShippingRatesBulk`, `get#ShippingRate`, the label request, refund and track services and `validate#ShippingPostalAddress`. The only implementation is `get#OrderShippingRateLocal` (NA_LOCAL, ShGtwyLocal). Neither Mantle nor the framework has a carrier integration, and CarrierServices.spec stubs the labels | P13's adapter and local-rules provider; the Mantle test carrier (§4) |
| F15 | P0: FacilityPrinter has only `facilityId`, `printerPurposeEnumId` and `networkPrinterId`. The purposes are PtpContainerLabel, PtpPackageLabel, PtpPickingDocuments, PtpPackingDocuments and PtpShipmentDocuments | P13 |
| F16 | P0: `print#Document` is a Rust service behind the moqui-host `print` feature, in the enterprise and maximal builds only; without it a call answers "not installed". NetworkPrinter exists, with Mantle's `assetId`. There is no ZPL. The framework draws Code 128 as SVG only, with no GS1 parse; Products P11 adds the rest | P13 over Products P11, PDF only (§4) |
| F17 | P0: `complete#ShipmentPack` takes getLabels and getReturnLabels (default false), a carrier and method, `networkPrinterId` and `makeDefaultPrinter` | CompletePack passes false for both (P12) |
| F18 | P0: `binLocationNumber` is on Shipment and on ShipmentItemSource, and the source's value wins | LoadShipments edits the right one (P11) |
| F19 | P0: ProductFacilityLocation's `minimumStock` and `moveQuantity`, and ProductFacility's `minimumStock` and `reorderQuantity`, are read by no service; Marble only edits them | `find#PickFaceReplenishment` is the first reader (P11); Products P7 is the one writer |
| F20 | P0: Lot has no `productId`, and is unique by manufacturer and lot number. FacilityLocation has `capacity` and `capacityUomId`, but no count schedule | Lots open Product360 from an asset (design); P10's count schedule (§4) |
| F21 | P0: `AssetTypeGlAccount.transferGlAccountId` exists; there is no scrap account in Mantle | Transfers need the account (P15, Accounting P19); Accounting P13 adds the scrap account |
| F22 | P0: none of AssetContent, ReturnContent, RequirementSupply, PlanningRun, PutawayRule, WarehousePolicy, ShipmentPickException, DeliveryStop, InspectionTemplate or QualityInspection exists. RequirementRequestItem and OrderItemWorkEffort do. FacilityParty is generic, and there is no Custodian role | Each record in its phase; RequirementSupply is §7 |
| F23 | P0: `get#InventoryProjectedInfo` is in `mantle.product.InventoryReportServices`, not AssetServices | `get#InventoryAtDate` joins it there (P17) |
| F24 | P0: the framework has no scan widget; drop-down search already recognizes a scanner's fast keystrokes ending in Enter or Tab. There is no screen density attribute: density is the shell's comfortable or compact user preference | P5's framework work, as §4 decides |
| F25 | P0: the form-list views are board, calendar and tree; there is no pivot or graph | Pivot and graph views stay §7 |
| F26 | P0: `view-tree` keys a row by its first key field (impl-products F9) | Traceability's tree uses Products P3's occurrence keys (P4) |
| F27 | P0: Mantle's only demo warehouse is ZIRET_WH, owned by ORG_ZIZI_RETAIL, with pick and bulk locations and one receiving location | P1's demo adds the rest; P15's the vendor-custody facility |
| F28 | P0: the Mantle specs over stock: ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices, AssetReservationMisc, AssetReservationMultipleThreads, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime | They pass unchanged (§2) |
| F29 | P0: BOSS has `Shared/OrderDetail`, `InvoiceDetail` and `RequestDetail` (Projects) and `Product360` (Products). Products adds Supplier360 and InventoryAvailability, and Accounting ShipmentDetail, ReturnDetail, EquipmentDetail and InventoryValuation (impl-accounting F4). No plan builds FacilityDetail, MaterialIssueReceipt, QualityInspection, InspectionTemplates or StockAtDate | Warehouse builds them (§2) |
| F30 | P0: Delivery has no status and no driver; ShipmentRouteSegment links to it | WH-TRIP is §7 |
| F31 | P0: Accounting reads "open inspection" with a stand-in before CX-QUALITY exists (impl-accounting P0) | P8's `get#SourceInspectionStatus` replaces it |
| F32 | P0: ReturnItem has an order item but no AssetReceipt, asset or lot, so nothing says which receipt a supplier return sends back | P14 adds PUR-RETURN's receipt link with `find#ReturnableReceipts` |
| F33 | P0: BossSetupData has no commented Warehouse block any more. The `BOSS_WAREHOUSE` artifact group has its ADMIN and `BOSS_WAREHOUSE_ADMIN` authz with the organization filters, and no root user group. Products P9's working tree adds `BOSS_WAREHOUSE_FACILITY_ADMIN` and grants `STOCK_POLICY_PLAN` to the stock planner, and both it and `STOCK_POLICY_MANAGE` to the manager, facility admin and admin groups, the permissions `WarehousePolicy.js` now checks | P1 adds the root user group and the other groups and grants the rest (§4) |
| F34 | P0: Products P9's `ForwardInventoryCosts.js` splits a partly issued asset at revaluation. A new Asset takes the on-hand quantity through a pair of AssetDetail rows linked by `otherAssetId`, copies the source's AssetTypeGlAccount rows, and takes over its open reservations | Movements, AssetLedger and `get#Traceability` follow the link (P4), and `get#InventoryAtDate` reads the pair as one (P17; §4) |
| F35 | P0, Oct 31: `get#PartyOrganizationInfo` answers an empty `filterOrgIds` for a user with no agent, employee or member relationship to an OrgInternal party. `MANTLE_USER_ORG_F`'s `{ownerPartyId: filterOrgIds}` is then `IN ()`, which the framework renders `1 = 0` (`moqui-db` `sql/condition.rs`), so that user sees no facility. Where `setup#UserOrganizationInfo` has not run (Warehouse.xml's always-actions runs it), `filterOrgIds` is unset and the map fails closed or reads null (`ownerPartyId IS NULL`): never every facility | No facility. P1's AccessServices reads an empty list the same way, never as "all"; only an authz with no organization filter (`BOSS_WAREHOUSE_ADMIN`) works in every facility (§4). Written into design §1 |
| F36 | P0, Oct 31: `/mantle` REST (MANTLE_API) is authorized to ADMIN only, and `/mantle/my` (ALL_USERS) has no stock path. No BOSS group has REST-path or service authz on F3's services, `update#AssetAndReceipt`, `displace#`/`reduce#AssetReservation(s)` or `pack#ShipmentProduct`, and no BOSS screen calls them (only Accounting's `Demo.js` loader), so a BOSS user reaches them only as an ADMIN member. The mr-marble Asset and Shipment screens write raw: ShipmentDetail sets `Shipment.statusId` to ShipScheduled, ShipPicked and (unship) ShipPacked through `update#mantle.shipment.Shipment`; EditContainer writes `Asset.containerId` (F9's EECA moves the asset) and Container's location (ContainerAssetLocation moves its contents), as MoveContainer does; AssetDetail's `update#Asset` changes `statusId` freely, so a quarantined asset can become AstAvailable; EditLots creates and updates Lot (expiry); FindPhysicalInventory creates a PhysicalInventory; AssetPool, its parties and stores, AssetMeter, AssetRegistration, AssetPartyAssignment and AssetMaintenance are entity-auto writes. They also call `receive#Asset`, `move#Asset`, `record#PhysicalInventoryQuantity`/`Change`, `receive#EntireShipment` and `update#AssetAcquireCost` directly | Nothing to change in the grants: P1 gives the Warehouse groups no MANTLE_API and no mr-marble authz, and `WarehouseAccess` checks a Warehouse user is refused a `/mantle` stock path. No Warehouse screen maps a raw write (design §15.1): status through P11–P13's guards, containers through P5, lots through P6's `correct#LotMetadata`, asset status through P8's dispositions |
| F37 | P0, Oct 31: F10 holds (Mantle `test/WarehouseStockChecks.spec.js`). On a transfer with two issuances and two receipts of a product, ShipmentItemDetail reads 6 accepted for 3 and 12 issued for 6, and `receive#EntireShipment` then receives nothing and delivers the transfer 3 short. Before any receipt it receives the ShipmentItem quantity, not what was issued. Purchase and return shipments have no issuances, so only shipments with both are affected | P15 sums issuances and receipts apart and receives through the receive guard; neither the view nor `receive#EntireShipment` is used for a transfer, and P7 keeps "Receive all as expected" to receipts without issuances. Written into design §15.2 and Transfers. The spec is kept for P7 and P15 |
| F38 | P0, Oct 31 (WarehouseStockChecks): moving a whole reserved AstAvailable asset into a quarantine location runs `update#Asset`, so AssetStatusNotAvailableReservations calls `check#AssetReservations`: each reservation is reduced and `reserve#AssetForOrderItem` re-reserves the order on other available stock, or as not available. A partial move makes a new held asset and, when the quantity exceeds the source's ATP, moves that much of the reservations onto it; the facility did not change, so nothing re-checks, and 2 of 4 stay reserved on the quarantined asset | P5's move guard calls `check#AssetReservations` on the destination asset when its status is not AstAvailable. P8's receipt into quarantine makes new unreserved assets, and its Release reserves first as planned. Written into design §15.2 |
| F39 | P0, Oct 31 (WarehouseStockChecks): a held asset keeps its available-to-promise total (10 on the whole move; 8 less the 2 reserved on the partial one). Mantle's ATP does not look at status | P4's Availability, AccessServices' stock reads and P17 count held stock by status, never from ATP alone |
| F40 | P0, Oct 31: `post#PhysicalInventoryVariance` reads the organization's `VarianceReasonGlAccount` row for the reason, then for a reason with enumCode `scrap` the `AssetTypeGlAccount.scrapGlAccountId` that Accounting P13 added (ValuationEntities), else found or shrinkage by sign, as §4 decides; AccountingValuation's spec covers it. P13 seeded InVrScrap and InVrExpired (enumCode scrap, ValuationData.xml). No setup or demo data maps a scrap account or a reason row, and the once per asset per PhysicalInventory posting of F5 stands | P6 seeds no reasons (F6 is done) and uses one PhysicalInventory per scrap operation. Its demo sets `scrapGlAccountId` (519200000, a cost of goods sold child) on ORG_ZIZI_CORP's own AstTpInventory AssetTypeGlAccount row, which `get#AssetTypeGlAccount` reaches from ZIRET through its PrtOrgRollup parent; not on DefaultSettings (`ZaaGlAccountsInstallData.xml`), whose rows `init#PartyAccountingConfiguration` copied when ZIZI was loaded and which posting never reads |
| F41 | P0, Oct 31: `produce#AvailableAssemblies` takes no acquireCost. It calls `receive#Asset` with the work effort and no order, so the kit gets no cost (receive#Asset's own TODO), the receipt is AtrNoAcquireCost, and issuing the kit to the shipment posts no cost of goods sold, leaving the components in WIP. It runs inside `pack#ShipmentAssemblyComponent` after each component pack, which `pack#ShipmentProductScan` also calls (with `in-map="context"`), and a later pack adds to the first kit asset through `update#AssetAndReceipt`, so a guard around one caller cannot pass a cost | (agent's call, for review; revised in the P0 review) P12 adds an organization flag, `PartyAcctgPreference.kitCostFromComponents`, off by default like D2's and D3's flags so Mantle's default and specs are unchanged, read inside `produce#AvailableAssemblies` so every caller is covered. The kit's acquireCost is the issued component cost ÷ kit quantity, the cost being each AssetIssuance's quantity × its source asset's acquireCost (AssetIssuance has no cost field; the posted issuance amount is the same figure). It is passed to `receive#Asset`, or to `update#AssetAndReceipt`, which already takes acquireCost and reposts the change, when a pack adds to the kit asset. Written into design §10 and Kits |
| F42 | P0, Oct 31: `get#UserTodayItems` already lists WetEvent work efforts with a WorkEffortParty row for the user, and `create#ShipmentLoadShip` makes a load a WetEvent of purpose WepShipmentShip: an assigned load shows as an event on its start day, never overdue, and drops off after it. A count's assignee and an inspection's inspector are P10's and P8's (crosscut §3.19). `PhysicalInventory.partyId` exists, set by `record#PhysicalInventoryQuantity` to the recording user. Putaway has no assignment record, and the design adds none | (agent's call, for review) The Warehouse today-source, created in `ironstone.warehouse` by P8, the first phase that needs it, and extended by P10 and P11, lists the user's loads still open from an earlier day as overdue picks, P10's counts by assignee and P8's inspections by inspector; no putaway Today source (its queue is on Home). Written into design §1 (shell providers) |
| F43 | P0, Oct 31: FacilityLocation has no status or end date. `locationSeqId` is on Asset, Container, PhysicalInventoryCount and ProductFacilityLocation only; a reservation or pick reaches a location through its asset (ShipmentItemSource has no location) | (agent's call, for review) P2 adds an audit-logged `FacilityLocation.thruDate`. The close refuses, naming each: an inventory asset there with on-hand or ATP not zero (a depleted asset stays AstAvailable at zero and does not block), a non-inventory asset (equipment) there that has not left (not AstDelivered or AstDeactivated, and no `actualEndOfLife`, which Accounting P12's disposal sets; Asset has no disposed status), a container there, an unissued reservation on an asset there (an open pick), a count line there on a count not posted or cancelled (until P10, any PhysicalInventory not PIComplete), and a ProductFacilityLocation or P9 putaway rule naming it. A closed location is hidden from pickers and refused as a destination by the receive, move and putaway guards (P5, P7, P9), since `receive#Asset` and `move#Asset` do not read the date. Written into design Facilities |
| F44 | P0, Oct 31: Products P3, P7 and P11 and Accounting P2, P6, P7, P12, P13, P17 and P19 are built (their §3 rows). Differences from this plan's wording: CX-POSTING has no service; it is `EntityLib.js`'s `operation`/`complete`/`previous` over `PostingOperation`. `receive#ReturnItems` is in `mantle.shipment.WarehouseTaskServices`, the file P5 extends. There is no TrackingPolicy or ProductFacilityPolicy entity (tracking is `WarehousePolicy` with `policyType` tracking) and no GS1 service (`ec.resource.parseGs1`). `resolve#WarehousePolicy` exists, tracking only. InventoryValuation runs `mantle.product.InventoryReportServices.run#InventoryValuation`. Both `queue#MatchReevaluation` EECAs exist (`entity/InvoiceMatch.eecas.xml`: AssetReceiptQueueMatchReevaluation and InvoiceItem's), so P7 builds nothing there. Accounting's ShipmentDetail, ReturnDetail, EquipmentDetail and OrderDetail declare no `appRoot` parameter and show "not available" for any root but Accounting; InvoiceDetail does not branch; Products' Product360, Supplier360 and InventoryAvailability take `appRoot` but `get#SharedContext` refuses any root but Products | The names and paths are in §8 "P0 verification". Each Warehouse mount adds an `appRoot == 'Warehouse'` branch with its own context (P4, P7, P11, P14, P17), and design §15.2 and §14 now use the built names |
| F45 | P0, Oct 31: design-warehouse still named ironstone services for contracts that are Mantle's (§4) or built there: `close#PurchaseRemainders`, `queue#MatchReevaluation`, `run#InventoryValuation`, `import#Bill`, `release#ShipmentDraftInvoice`, `refund#OrderPayment`, `settle#Return`, `post#Revaluation`, `accept#ServiceItem` and `find#ReturnableReceipts` | Renamed there to `mantle.order.OrderServices.close#PurchaseRemainders` and `accept#ServiceItem` (proposed), `mantle.account.InvoiceMatchServices.queue#MatchReevaluation`, `mantle.product.InventoryReportServices.run#InventoryValuation`, `mantle.account.InvoiceServices.import#Bill` and `release#ShipmentDraftInvoice`, `mantle.account.PaymentServices.refund#OrderPayment`, `mantle.order.ReturnServices.settle#Return` and `find#ReturnableReceipts` (proposed), and `mantle.ledger.AssetBookServices.post#Revaluation`. Customer Service's `apply#OrderChange` keeps its owner's name |
| F46 | P0, Oct 31: `receive#EntireShipment` and the partial-move reservation carry-over (F37, F38) are Mantle behaviors that the existing flow specs do not reach | Mantle's `WarehouseStockChecks` spec records them as they are, so a later change to either shows |
| F55 | P1: Shipment has no facility fields; a shipment's origin and destination facilities are on its ShipmentRouteSegment rows (`originFacilityId`, `destinationFacilityId`). A shipment with no segment has no facility | AccessServices scopes a shipment by its segments' facilities, else by its from or to party; later phases' shipment lists and queues join ShipmentRouteSegment. Intended (facility scope, §4): another organization's shipment routed through the user's facility is visible to them (its id, type and status), and their own organization's shipment whose only segment facility is another owner's is refused until third-party facilities (§7) |
| F56 | P1: `get#ScannedIdGeneral` calls `resolve#ScannedProduct`, which refuses a user without `PRODUCT_CATALOG_VIEW` ("Catalog read authority is required"), so a Warehouse user without a Products grant could not scan | `BOSS_WAREHOUSE` and its admin hold `PRODUCT_CATALOG_VIEW` (§4); the lookup runs it as a probe, so its failure leaves the matches by id |
| F57 | P1: `get#ScannedIdGeneral` does not match `Asset.serialNumber`, falls back to the unvalidated `FacilityActive` preference when given no facility, and adds an informational message when it finds nothing | `get#ScannedRecord` passes the validated facility or `_NA_` and matches serial numbers in the user's facilities; P5's resolver takes the same care |
| F58 | P1: `get#PartyOrganizationInfo` lets an ADMIN or ACCOUNTING_ADMIN make any internal organization active, and `filterOrgIds` is then that organization alone, so a Warehouse user who is also a finance administrator would work in another organization's facilities through the Facility filter | AccessServices keeps the owners to the user's own organizations (§4); WarehouseAccess tests it |
| F59 | P1 review: the ALWAYS grants of the capability groups and the admin group on the Inspection, Counts and Picking areas had no filter sets. Entity filters come only from the record that authorized the top frame, so everything under those areas would have run without MANTLE_USER_ORG and MANTLE_PRIVATE_CONTACT | Each grant carries the root's sets (MANTLE_USER_ORG or, for the admin group, MANTLE_ACTIVE_ORG, with MANTLE_PRIVATE_CONTACT); WarehouseAccess reads every area grant's sets, since the areas read no entity until their phases |
| F60 | P1 review: design §2 gives PickLocationMoves and HandheldPickFace to the move role, under Picking, and QualityInspection to every Warehouse user, under Inspection | The move group is on Picking; P8 opens QualityInspection by an artifact group of its own (§4) |
| F61 | P1 review: with `PRODUCT_CATALOG_VIEW` on `BOSS_WAREHOUSE` (F56), `get#RecordLink`'s catalog branch linked Warehouse-only users to Products screens they cannot open | The catalog branch requires a Products root grant (`SharedContext.js` `mayOpen`, now exported); Warehouse's product route comes with P4's Product360 mount |
| F62 | P1 review: `rootGrants` counted any allowing root grant with no Facility filter as every facility, so a grant set up without filters would fail open | Only a system administrator or a grant whose sets name MANTLE_ACTIVE_ORG with no Facility filter reaches every facility; WarehouseAccess adds a bare grant and checks the scope stays the user's organizations |
| F63 | P1 review: the party fallback of shipments and returns used every member organization, not the narrowed owners; the palette found no shipment without a route segment, caught failures per kind, and passed `%` and `_` through to LIKE; Commons' `search#Records` fell back to the search's own screen when a Warehouse link was null | The fallback uses the owners (the active organization when it is the user's); a party find joins the palette; failures are caught per row; `%`, `_` and backslash are escaped; Warehouse kinds get no fallback link |
| F64 | P1 review: usl-inventory's `get#ScannedIdGeneral` row had five cells; the no-organization fixture left its user in `BOSS_WAREHOUSE`; BossSetupData had new lines over 130 characters | Fixed. A per-request cache of the scope is not added: `ec.user.context` outlives a request in the spec harness and across sign-ins, and a cache keyed by user alone would miss a group or active-organization change; `search#Records` already computes the scope once per call |
| F75 | P2: Mantle's facility writes scope by `get#PartyOrganizationInfo` `userOrgIds` (the system administrator excepted), so `BOSS_WAREHOUSE_ADMIN`, whose Warehouse scope is every facility (§4), opens another organization's FacilityDetail but cannot edit it | Fixed in the P2 review (F84): `FACILITY_ALL_ORGANIZATIONS` and `FacilityScope.js` (§4). WarehouseFacilities checks the administrator edits another organization's facility and the facility admin is refused it |
| F76 | P2: `create#Facility`, `update#Facility` and `create#FacilityLocation` check no permission and have callers (`mantle.rest.xml`, ADMIN only; specs); FacilityLocation had no end date | New `store#` entry points check `FACILITY_EDIT` (§4); the audit-logged `FacilityLocation.thruDate` is added |
| F77 | P2: `store#ProductFacilityPolicy` could create or change a `ProductFacilityLocation` but not remove one, so a location named by a policy could never close (F43) | It takes `removeLocation` with `locationSeqId`, and refuses a new location policy at a closed location; FacilityDetail's Products tab offers Remove |
| F78 | P2: there is no putaway rule record yet (P9) and no count status beyond `PIComplete` (P10) | `blockersOf` in `FacilitySetup.js` names counts not `PIComplete`; P9 adds its rule to the blockers, P10 its statuses (WarehouseImplementation.md) |
| F79 | P2: `get#FacilitiesByOwner` includes the owner's parent organization's facilities and checks no user scope | Not used: Facilities reads through the AccessServices scope (`get#Facilities`) |
| F80 | P2: a transition's response carries the declared parameters of its screen, so a list filter named like a form field (`locationTypeEnumId`) filtered the Locations tab after a save | The filter is `filterTypeEnumId` |
| F81 | P2: the Files and Conversation tabs are server-static: their template is sent whatever the facility check found, and the record files and chatter read the Facility through their own record-host checks | Their header and data come only after `get#FacilityDetail`; the record hosts' own visibility of `mantle.facility.Facility` under the Warehouse root (MANTLE_USER_ORG's Facility filter) is relied on and not tested apart in P2 |
| F82 | P2: ClientIsolation classifies every Shared screen for Projects clients | `Shared/FacilityDetail` is in its refused list |
| F83 | P2: ClientWrites fails on this branch for P1's `AccessServices.select#Facility`, since `warehouse` joined the client deny pattern on master after the branch was cut (5f25c36) | Resolved by the merge; P2 adds only `get#` services to `ironstone.warehouse` |
| F84 | P2 review (A1, C7): F75 contradicted §4, BOSS showed edit actions Mantle then refused, and `FacilitySetup.js` scoped by every member organization while `WarehousePolicy.js` narrowed to the active one (any internal one for a finance administrator, F58) | `FacilityScope.js` with `FACILITY_ALL_ORGANIZATIONS` (§4); both modules use it; `canEdit`/`canPlan` and the `owners` choice follow it |
| F85 | P2 review (B1): editing a facility whose parent is outside the user's scope posted an empty parent and cleared it | The form keeps the stored parent and posts `originalParentFacilityId`; `store#Facility` keeps the parent on a blank unless `clearParent`, and checks a parent only when it differs from the stored one |
| F86 | P2 review (B2): `removeLocation` deleted the ProductFacilityLocation with no audit record | The fields are first cleared through the audited update with the reason, then the row is deleted |
| F87 | P2 review (B3, C8): `check#FacilityLocationOpen` read without a lock and ignored a closed facility | It locks the location row (guards call it inside their own transaction, which serializes with a close) and refuses a location of a facility whose `closedDate` has passed (FACILITY_CLOSED) |
| F88 | P2 review (C1, C6): the parent-cycle walk read the ancestors unlocked, and an owner could change with no reason | The ancestors are read for update; an owner change needs `changeReason` (REASON_REQUIRED) and is written through the entity's own update so the audit log keeps the reason |
| F89 | P2 review (C2, C3): a quantity-counted asset with nothing on hand blocked as equipment, and the blockers loaded every asset of the location into an IN list | An asset counted by quantity with on-hand and ATP zero never blocks; each blocker is one filtered find (reservations through `AssetAndReservation`), counted, naming its first ten |
| F90 | P2 review (C4, C5): `FacilityLocationType.autoStatusId` audited updates only, and `store#FacilityLocation` created through the entity, beside `create#FacilityLocation` | `enable-audit-log="true"`; a new location goes through `create#FacilityLocation` (the id is still made first, to lock and check it) |
| F135 | P5a: the qvt goldens `cells` and `containers`, and one containers assertion, were stale at master since c98df6a7 (the m-link-form class) | Fixed in P5a |
| F136 | P5a: the shell page spec's call-dock assertion was stale since 45ab9425 (Comms W1) | Fixed on master (c16478e5) and in P5a; one copy kept at the merge |
| F137 | P5a: a transition with `default-response type="none"` sends no messages to a background `m-form` submit | A handheld transition that shows its result answers `ec.web.sendJsonResponse({messageInfos: [...]})` (the gallery's pattern) |
| F138 | P5a: `scan-input` in a `multi` form-list row is not supported: the companion names get no row suffix | Open; form-single and plain rows work |
| F139 | P5a: in tui only the id and the scan id post, not `name_type` or `name_scanText` | Transitions must not require them for tui use |
| F140 | P5a review: the tui fallback never reached the resolver: the host fetches options with GET and `scanResolve` was POST-only | `scanResolve` takes any method (it only reads, as dynamic-options do); a POST must carry the session token, now checked; `tui_screens` drives a search to a choice and a save |
| F141 | P5a review: `confirm` moved focus to the Confirm button, so the next scan's Enter confirmed the old match | The focus stays in the field; Enter on the same text or the button confirms, other text is a new scan; html fills its hidden inputs only on Confirm |
| F142 | P5a review: a new scan left the previous match's id, type and scan id in the form | A new intent clears them, in qvt and html |
| F143 | P5a review: the scan id outlived its submit, so a resubmit with a changed quantity was answered by the first operation; two scan inputs shared `scanId` | A form answer without errors empties the scan's fields; distinct `scan-id-field` names are required (an assembly error log and a 400). P5b scopes the operation-key lookup of a client-chosen scan id per user and operation |
| F144 | P5a review: late resolver answers were not discarded | Answers for a non-current intent are dropped |
| F145 | P5a review: resolver parameters are taken back from the request, and the resolver runs even when a condition hides the field | Documented in the XSD and Qvt-Client: resolvers re-check permission, facility and task |
| F146 | P5a review: the scan id fallback on plain-http origins was weak | `moqui.randomId`: `randomUUID`, else a v4 UUID from `getRandomValues` (the html client keeps its own copy) |
| F147 | P5a review: repeat scans were dropped silently, with a sliding window | "Already scanned", with the window measured from the first scan |
| F148 | P5a review: cancelling the chooser did not refocus after the first scan | Refocus unless the current intent was filled or waits for Confirm |
| F149 | P5a review: `gs1_value` lived in the script runtime with a `pub` re-export | `Gs1Data::to_value` in `moqui_lib::barcode` |
| F115 | P4: `enable-audit-log="update"` does not log a field's first non-null value (Java's rule, `field_rw.rs`), so a name or comment set on an asset that had none left no audit row | `assetName` and `comments` are `enable-audit-log="true"`; an asset created with a name logs it too |
| F116 | P4: `get#RecordLinkInfo` gave an asset with no book only its entity filters, and none covers Asset (F2), so Files and Chatter would have opened any organization's stock | Under an organization filter an unbooked asset (and its AssetContent) is seen by its owner's or facility owner's organizations, unless it has neither or the user has an entity authorization for Asset; WarehouseAccess checks the files panel |
| F117 | P4: the BOSS Warehouse groups have no service authorization for `ironstone.products.*`: Products' shared services are reached only through the mounted screens' inherited authorization | Intended. WarehouseInventory calls them with authorization disabled (they check the user themselves) and renders the mounts with it enabled |
| F118 | P4: a form-list's `select-columns` dialog lists a hidden column's title, so a reader would see "Unit cost" offered (with no values) | Assets and Movements have no `select-columns`; their cost column is hidden and its values are never answered without financial read |
| F119 | P4: `AssetFindView` inner-joins Facility and Product, so an asset with no facility or product is not in AssetList; `AssetAndDetail` gives a movement its asset's current facility, not the facility at the time | Accepted for P4 (stock assets have both); P17's StockAtDate reads the movement's own history |
| F120 | P4: AssetDetail has no user; a movement's user is its receipt's `receivedByUserId` or issuance's `issuedByUserId`, and an adjustment's none | MovementList shows the user where Mantle has it; P5's operation records add it to every posting |
| F121 | P4: a revaluation split and a partial move are both AssetDetail pairs linked by `otherAssetId` | Told apart by the AbeInventoryRevaluation AssetBookEvent from `sourceAssetId` to `assetId` (F34) |
| F122 | P4: `palette-type` names a search DataDocument, and lots and containers have none | Their palette rows come from `search#Records` (`searchFinds`), now linking to their detail screens; no DataDocument added |
| F123 | P4 review (A1): `get#Traceability` blanked only a restricted edge's key and event id, so another organization's product, quantity, date and (for financial read) cost reached the trace and its export | Stock outside the scope is one restricted node; a visible node's edges to it are one edge with no product, quantity, date, cost or reason; cost is computed only for stock in the scope; `restrictedCount` is 0 or 1. WarehouseTraceability checks a finance user's edges |
| F124 | P4 review (B1): `EntityLib.page` ignores `pageNoLimit`, so a list's export held one page | `page` takes an optional `noLimitCap` (its default unchanged for Accounting); `find#Movements`, `get#Traceability` and the Inventory finds accept `pageNoLimit` up to 5000 rows, and the screens pass it |
| F125 | P4 review (B2, B3, B6): the transit total loaded every route segment ever ending at the facility; LotList built IN and NOT IN lists of every lot; a trace's neighbor queries were not bounded by `maxNodes` | Transit reads the owner's shipped transfers first, then their segments; LotList is one query over the new `LotAndAsset` view (a lot with an asset in the facilities, or with none); each neighbor query reads at most the nodes still allowed plus one, setting `truncated` |
| F126 | P4 review (B4, B5, C): `update#AssetMetadata` cleared the comments when only a name was given; the palette and Traceability found a lot only by its internal id; a shipment root missed receipts that also name a work effort; a facility with only in-transit stock had no Availability row; ContainerDetail's contents were not limited to the user's facilities; an equipment asset (no facility or product) failed AssetDetail | Only the fields given change (an empty one clears); a lot is found by its lot number (palette, `lotNumber` find checked by `recordOf`) and traced by it; a root document wins over the record's other documents; the transfer destinations join the Availability rows; contents are scoped; AssetDetail reads such an asset from Asset alone, and its record link opens EquipmentDetail |
| F127 | P4 review: `assetName` and `comments` with `enable-audit-log="true"` add an audit row on each ordered receipt (receive#Asset names the asset from the order item) | Kept (agent's call, for review): with "update" the first name or comment given to an unnamed asset, the usual metadata edit, would not be audited (F115); the receipt row is the cost |

## 7. Later

Designed, not in this build:

- **The design's `later` rows:**
  - TraceabilityGraph (WH-GRAPH);
  - DeliveryTrips and DeliveryTripDetail (WH-TRIP);
  - Capacity;
  - ExternalStockSync (WH-SYNC);
  - automatic waves (WH-WAVE).
- **Other design items:**
  - the Age column and age buckets on Availability;
  - pivot and graph views (WH-REPORT; F25);
  - CSV mass moves;
  - camera scanning;
  - ZPL labels, with FacilityPrinter's `labelFormatEnumId` and label-printer capability;
  - facilities owned by a third party that hold the organization's stock;
  - count schedules by accuracy or by movement, and ABC classes computed from value or movement;
  - the §19 items: a production pick mode with `AssetReservation.workEffortId`, and owner-stock portals and storage
    fees. Held quantity in planning is decided (impl-manufacturing §4).
- **Supply planning (CX-PLANNING, with WH-PLAN):**
  - PlanningRun, PlanningSuggestion and RequirementSupply, `run#SupplyPlan` and `store#PlanSchedule`;
  - the SupplyPlanning mount and its transfer conversion;
  - RequestDetail's buy and make requirements with their RequirementSupply links;
  - the suggestions on Product360's Replenishment tab.
- **Other apps' contexts:**
  - Customer Service: StockAtDate, QualityInspection and ReturnReceipt;
  - Manufacturing: FacilityDetail, MaterialIssueReceipt, QualityInspection and InspectionTemplates;
  - Purchasing: Inspections and QualityInspection.
- **Other apps' callers:**
  - Purchasing: PrepareReceipt (`ensure#PurchaseReceipt`) and `apply#PurchaseRevision` (`adjust#ExpectedReceipt`);
  - Customer Service: `authorize#Return`, `apply#OrderChange` (the substitute on a short pick, and the cancelled
    balance) and "Issue return label";
  - Manufacturing: the Components Stage action (Move) and ReceiveOutput's GenerateTracking.
- **The rest of the other apps' needs:**
  - Manufacturing:
    - the rest of M4: amendments (`amend#ProductionOrder`), `ProductionQuantityEvent`, instruction versions, and the
      lifecycle beyond release (`transition#ProductionOrder`, with its hold transition);
    - the cost events of the guards (`record#ProductionCostEvent`, M8);
    - `record#ProductionLoss`, `request#SubcontractService` and SubcontractDetail;
    - its WorkOrders, NewWorkOrder and WorkOrderDetail screens;
  - Purchasing: the service PO, ClosePurchaseOrders, NewSupplierReturn, `create#ReplacementOrder`, and the rest of
    PUR-RECEIPT and PUR-RETURN;
  - CX-QUALITY's later NCR, CAPA and gauges.

## 8. Verification

- **Per phase,** the "Done" rule of §2 and the phase's "usable when".
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo warehouse user, and walk each built phase's
  "usable when" in order.
- **Design §19's acceptance review and crosscut §6,** scenario by phase:

| Scenario | Phase |
| --- | --- |
| Purchase receipt, partial inspection, putaway | P7, P8, P9 |
| Short receipt closed or backordered before delivery | P7 |
| Reservation, shortage, recount | P11 (the short pick), P10 (the recount) |
| Pick and pack into several packages, label timeout and retry, ship | P11, P12, P13 |
| Reopen a package after pack | P12, on Accounting P17 |
| Customer and supplier returns, partly received and settled, one in two boxes | P14; settlement is Accounting's P17 |
| Subcontract dispatch and output receipt | P15, P16 |
| Repack | P6 |
| Transfer in transit | P15 |
| Blind count with a concurrent receipt or issue, and failed independent lines | P10 |
| Lot expiry change | P6 (the correction), P5 (the gate) |
| Invalid serial or unit | P7 |
| Mixed owners and pools | P3 (pools), P5 (moves) |
| Unauthorized financial fields | `WarehouseAccess` in every phase; P18 |
| Closed-period correction | P6 |
| Standalone Warehouse, with no ProductStore and no other app's grant | P18 (`WarehouseAccess` in every phase) |
| Crosscut sales order fulfillment | P11–P13; the substitute through Customer Service is §7 |
| Crosscut count with moving stock | P10 |

- **Screenshots** through the BOSS client spec of §2, light and dark, and the handheld mounts at phone width.

### Overall verification

The full suites after each wave of merged phases (standalone mr-mantle; mr-boss; the BOSS client walks):
- Baseline, Oct 31, 2026 (master before Warehouse): Mantle 1,190 passed, 1 failed (AccountingPaymentRuns' due schedule
  of a term), 6 skipped; BOSS 1,266 passed, 1 failed (ProductsPricing's price notice), 5 skipped.
- Wave 1 (P0, P1, P5a): Mantle 1,195 passed, 1 failed (the baseline), 6 skipped; BOSS 1,339 passed, 1 failed
  (ClientWrites: the client deny pattern did not list `ironstone.warehouse`, fixed), 5 skipped; walks 67 passed, 1
  skipped.

### P0 verification — Oct 31, 2026

The remaining P0 checks, F35–F46. Mantle paths are under `runtime/component/mr-mantle/`, BOSS paths under
`runtime/component/mr-boss/`.

- **Checked:** the empty organization list (F35); REST and baseline writes (F36); a transfer's receipt totals (F37);
  quarantine and reservations (F38, F39); scrap posting (F40); kit cost (F41); Today sources (F42); open work on a
  location (F43); the other apps' state (F44, F45).
- **Design edits** (design-warehouse.md): §1's facility scope and shell providers, Facilities, the Transfers value
  paragraph, Kits and PackAssembly, the §14 valuation note, §15.2's `receive#EntireShipment` note and
  AssetStatusNotAvailableReservations row, and the Receive paragraph's names.
- **The other apps' contracts later phases extend** (all built, F44):
  - Shared screens (BOSS `screen/Shared/`). Accounting's branch on `appRoot == 'Accounting'` and show "not available"
    otherwise; Products' take an `appRoot` parameter and `ironstone.products.CatalogServices.get#SharedContext`
    (`service/ironstone/products/SharedContext.js`) admits only Products; that file's header expects another app to
    add its authorized branch, tab names and mounts there. A Warehouse mount adds its own branch.
    - `ShipmentDetail.xml`, context `ironstone.accounting.PayableScreenServices.get#ShipmentContext`: P7, P11, P14,
      P15.
    - `ReturnDetail.xml`, context `ironstone.accounting.ReturnScreenServices.get#ReturnContext`: P14.
    - `EquipmentDetail.xml`, over `mantle.ledger.AssetBookServices` (`get#AssetBook`, `capitalize#Asset`,
      `dispose#Asset` and the rest): P2.
    - `InventoryValuation.xml`, over `mantle.product.InventoryReportServices.run#InventoryValuation` and
      `mantle.ledger.AssetBookServices.preview#`/`post#Revaluation`: P17.
    - `InventoryAvailability.xml` (`ironstone.products.InventoryServices.get#InventoryContext`) and `Product360.xml`:
      P4. `Supplier360.xml` (`ironstone.products.SupplierServices.get#SupplierDetail`): P7.
    - `OrderDetail.xml`, context `ironstone.accounting.PayableScreenServices.get#OrderContext`: P11.
      `InvoiceDetail.xml` (no branch): P13. `RequestDetail.xml`, a Projects screen that branches on
      `appRoot === 'Projects'`: P15.
  - CX-POSTING (Accounting P2): `mantle.ledger.transaction.PostingOperation` (`entity/AssetBookEntities.xml`, extended
    in `entity/InvoiceWorkflowEntities.xml`), written through `service/mantle/ledger/EntityLib.js` `operation(p, type,
    organizationPartyId, request)`, `complete` and `previous`. The period guard is `PostingGuard.js` `check` inside
    `mantle.ledger.LedgerServices.post#AcctgTrans` (`service/mantle/ledger/LedgerServices.xml`).
  - `mantle.shipment.WarehouseTaskServices` (`service/mantle/shipment/WarehouseTaskServices.xml`) holds Accounting
    P17's `receive#ReturnItems` (`service/mantle/order/ReturnSettlement.js`). P5 adds its entry points to this file.
  - `mantle.account.InvoiceServices.release#ShipmentDraftInvoice` (`service/mantle/account/InvoiceServices.xml`,
    P17). D3's flag is `PartyAcctgPreference.salesInvoiceFinalizedAtShip`, read by the pack invoice SECA
    (`service/AccountingInvoice.secas.xml`). D2's is `receiptInvoiceSelfBilledOnly` with
    `SupplierProfile.selfBillingIndicator`, read by `ShipmentIncomingDeliveredCreateInvoices` (Accounting P6).
  - `mantle.account.InvoiceMatchServices.queue#MatchReevaluation` (`service/mantle/account/InvoiceMatchServices.xml`,
    P7), called by both EECAs of `entity/InvoiceMatch.eecas.xml`: AssetReceiptQueueMatchReevaluation and InvoiceItem's.
  - Valuation (Accounting P13): `mantle.ledger.AssetAutoPostServices.post#PhysicalInventoryVariance`
    (`service/mantle/ledger/AssetAutoPostServices.xml`), `AssetTypeGlAccount.scrapGlAccountId`
    (`entity/ValuationEntities.xml`), `mantle.ledger.config.VarianceReasonGlAccount`, and the InVrScrap and
    InVrExpired reasons (`data/ValuationData.xml`). `mantle.ledger.AssetBookServices.post#Revaluation` (Products P9)
    with `service/mantle/ledger/ForwardInventoryCosts.js` (`at`, `split`, `apply`).
  - Transfers (Accounting P19): `AssetTypeGlAccount.transferGlAccountId`, checked in
    `service/mantle/ledger/AccountingActivation.js`.
  - Products: `mantle.product.ProductServices.resolve#ScannedProduct` (`service/mantle/product/ProductServices.xml`,
    P11) with `ec.resource.parseGs1` (`Packaging.js`); `store#KitComponent` (P2);
    `mantle.product.BomServices.get#BomExplosion` (P8);
    `mantle.facility.FacilityServices.get#`/`store#ProductFacilityPolicy` and
    `mantle.facility.WarehousePolicyServices.resolve#WarehousePolicy` and `store#TrackingPolicy` (P7), over
    `service/mantle/facility/WarehousePolicy.js` `execute(op, p)` and `mantle.facility.WarehousePolicy`
    (`entity/WarehousePolicyEntities.xml`); permissions through `service/mantle/product/ProductAccess.js` `has`.
- **Verified with:** `MOQUI_RUNTIME=<runtime> ./moq test mr-mantle --spec WarehouseStockChecks`, 5 features passed.
- **Commits:** mr-mantle `7ec7496b` test(warehouse): P0 checks of transfer receipt totals and quarantined
  reservations; mr-boss: the plan and design commit on `wh/p0`.
- **P0 review fixes** (Oct 31): both `queue#MatchReevaluation` EECAs exist, so P7 builds none (F44); the kit cost is an
  organization flag read inside `produce#AvailableAssemblies` (F41); a depleted inventory asset does not block a close,
  and a closed location is refused as a destination (F43); P8 creates the Warehouse today-source (F42); the scrap
  account goes on ORG_ZIZI_CORP's row (F40); seven more design names renamed (F45).

### P1 build — Oct 31, 2026

**Built.**
- Mantle: the fifteen permissions beside `ORDER_APPROVE` in MantleSetupData.xml (with ADMIN grants); `STOCK_RECEIVE` stays in
  AccountingAccessData.xml.
- Access (BossSetupData.xml): `BOSS_WAREHOUSE` (the root user group, `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`,
  covering `ironstone.warehouse`) beside the existing admin authorization; the capability groups of design §1 with their
  permissions, all of them to `BOSS_WAREHOUSE_ADMIN`; `PRODUCT_CATALOG_VIEW` to the root and admin groups; the Inspection,
  Counts and Picking areas for their groups; `get#RecordLink` authorized for Warehouse users. No artifact authorization
  for the raw stock services or REST paths.
- `ironstone.warehouse.AccessServices` (`Warehouse.js`): `get#SharedContext`, `check#Record`, `select#Facility`,
  `get#Choices`, `search#Records`, `get#ScannedRecord`; `HomeServices.get#Home`. The scope from the root grants (§4).
- The root: the thirteen areas of design §1 (placeholders renamed and reordered; Inspection, Counts, Transfers, Picking,
  Handheld and Reports added), `<shell-providers>` (palette source and types, the `warehouse` key scope),
  `template/WarehouseParts.xml` (choices, the facility picker). `get#RecordLink` routes shipments, assets, lots,
  containers, counts, returns and facilities through `Warehouse.js`.
- Home: the facility picker, the operation queues (null counts), Your work (empty), Scan or look up.
- Demo: BossWarehouseDemoData.xml and twenty warehouse users in BossUsersDemoData.xml.
- Specs: WarehouseShell (menu per group, providers, palette, record links per kind, Home), WarehouseAccess (context,
  capabilities per user, admin scope, facilities with authorization on and off, forged ids per kind, locations, named
  capabilities, the preference, the lookup, a user in no organization, a finance administrator's active organization,
  the REST stock paths); AppStructure and TuiRender cover the Warehouse screens; the walk WarehouseFoundationWalk.
- docs/WarehouseImplementation.md with the contracts; the inventories' Implemented-in cells for FacilitySummary and
  `get#ScannedIdGeneral`.

**For later phases.** Call `check#Record` with the action's capability before the Mantle service, and scope list finds
by the facility condition in the query; add each built detail screen's kind to `destinations` in `Warehouse.js`, each
quick create, Today source and notification topic to the root's providers, and each queue's counts to `get#Home`; a new
restricted area follows the `BOSS_WH_<Area>` artifact groups; shipments are scoped through their route segments (F55);
a shared screen mounted under Warehouse needs its own `appRoot == 'Warehouse'` branch.

**Verified.** BOSS: WarehouseAccess 47/47 and WarehouseShell 23/23; AppStructure and TuiRender 20/20; ProductsAccess,
AccountingAccess, ProductsSharedContext, ProductsShell, AccountingShell, Shell, QuickCreate, AppOrganizationFilters,
ClientAccessInternal and TodayPanel 211/211. Mantle: ShipmentPick, AssetReservationMisc, ContactAndFacilityServices and
ShipmentReturnMisc with their dependencies, 77/77 (the Mantle change is permission data only). Client:
WarehouseFoundationWalk 3/3. Screen lint: no flagged site in the Warehouse screens (information-level extension anchors
only, as elsewhere).

**Commits.** mr-mantle `aaa107e6`; mr-boss `6204fc5`, `155ada7`, `9bb9c3a` and `590db0c`.

**Review fixes** (Oct 31, F59–F64): master merged into wh/p1 in both repositories (P0, and the client suite's mail
capture); the area grants carry the root's filter sets and Picking holds the move group; catalog record links need a
Products root grant; every-facility scope only through MANTLE_ACTIVE_ORG or system administration; the party fallback on
the narrowed owners, the palette's party find, per-row failures, LIKE escaping and no search fallback for Warehouse
kinds; the inventory row, fixture cleanup and line lengths. Verified: WarehouseAccess 50/50 and WarehouseShell 23/23;
with AppStructure, ProductsAccess, ProductsShell, Shell, AccountingShell and ProductsSharedContext 185/185;
WarehouseFoundationWalk 3/3. Commits: mr-mantle `ad50351e` and mr-boss `c7be669` (the merges), and mr-boss's
`fix(warehouse): P1 review: ...`.

### P2 build — Oct 31, 2026

**Built.**
- Mantle (`mantle.facility.FacilityServices`, `FacilitySetup.js`): `store#Facility` (owner one of the user's internal
  organizations, parent one of their facilities, parent cycle refused), `store#FacilityLocation` (type, place,
  capacity with unit, pick sequence), `store#FacilityLocationType` (each type's audit-logged `autoStatusId`),
  `get#FacilityLocationBlockers`, `close#FacilityLocation` and `reopen#FacilityLocation` over the new audit-logged
  `FacilityLocation.thruDate` (the blockers of F43, each named), and `check#FacilityLocationOpen` for the destination
  guards; every write checks `FACILITY_EDIT` and the organization. The shipping-dock location type `FltShipDock` (F8).
  `store#ProductFacilityPolicy` removes a location policy (`removeLocation`) and refuses one at a closed location (F77).
- BOSS: the Locations area (`Warehouse/Locations.xml`) with Facilities (list and tree by parent, New facility) and the
  mounts of `Shared/FacilityDetail` (new) and `Shared/EquipmentDetail` (its Warehouse branch, in
  `template/WarehouseEquipment.xml`). FacilityDetail's header (Edit facility) and tabs as files of
  `Shared/FacilityDetail/`: Overview and contact (with the equipment there), Children (New facility inside), Locations
  (location types and their statuses; locations with New, Edit, Close and Reopen; closed ones only on request),
  Products (product and location policies through `store#ProductFacilityPolicy`), Schedules (the Commons calendar's
  bookings), Files and Conversation on the Facility host. Reads in `ironstone.warehouse.FacilityServices`
  (`Facilities.js`); every write transition runs `check#Record` with its capability, then the Mantle service.
  `Warehouse.js`: `destinations.facility`, the Locations `sharedLinks`, and the exports `required`, `inScope`,
  `facilityIds`.
- Demo: ZIRET_WH's shipping dock `0601` and closed `0199`, the annex `BOSS_WH_ANNEX`, the forklift `BOSS_WH_FORKLIFT`
  with its operator and a scheduled oil change.
- docs/WarehouseImplementation.md "Facilities and locations (P2)"; the inventories' Implemented-in cells.

**For later phases.** P3 adds `Shared/FacilityDetail/Policies.xml` (menu index 7), P12 `BoxTypes.xml` (5) and P13
`Printers.xml` (6), each with its own transitions and reads; no change to `FacilityDetail.xml`. P5, P7 and P9 call
`check#FacilityLocationOpen` on a destination inside their operation, and location pickers offer open locations only
(the `locations` choice). P9 adds its putaway rule to `blockersOf`, P10 its count statuses (F78). P11 assigns equipment
to loads from PicklistDetail; P4's AssetContent gives EquipmentDetail its files.

**Verified.** Mantle: WarehouseFacilities 12/12; with WarehousePolicy, ContactAndFacilityServices, ShipmentPick,
AssetReservationMisc, ShipmentReturnMisc and ShipmentLoads 104/104 (with their dependencies). BOSS: WarehouseFacilities
24/24, WarehouseAccess and WarehouseShell (with WarehouseFacilities 100/100); with AppStructure, TuiRender,
AccountingFixedAssets, AccountingAccessWalk, ClientIsolation, ProductsInventory and ProductsAccess 191/191 after
ClientIsolation classified the new shared screen (F82). ClientWrites 1 failure on this branch, P1's `select#Facility`,
fixed on master (F83). Client: WarehouseFacilitiesWalk 4/4 (the build, the refused close, the reader, 390 px). Screen
lint: no flagged site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `52ebf0ff`; mr-boss `dce260c` and `737ad96`.

**Review fixes** (Oct 31, F84–F90): master merged into wh/p2 in both repositories; `FACILITY_ALL_ORGANIZATIONS` and the
shared `FacilityScope.js` (used by `FacilitySetup.js` and `WarehousePolicy.js`, followed by BOSS's `canEdit`/`canPlan`),
F75 closed; an unchanged or hidden parent is kept; the audited location-policy removal; the locked open check with the
closed facility; locked ancestors, the owner-change reason, the quantity rule and database-side blockers, the audited
first status, `create#FacilityLocation`. Verified: Mantle WarehouseFacilities 15/15 and, with WarehousePolicy,
ContactAndFacilityServices, ShipmentPick, AssetReservationMisc, ShipmentReturnMisc, ShipmentLoads and
WarehouseStockChecks, 112/112; BOSS WarehouseFacilities, WarehouseAccess, WarehouseShell, ClientWrites,
ClientIsolation, ProductsInventory and ProductsAccess 161/161, AppStructure, TuiRender, ProductsSharedContext and
ProductsShell 41/41; WarehouseFacilitiesWalk 4/4. Commits: the merges, mr-mantle and mr-boss `fix(warehouse): P2
review: ...`.

### P5a build — Oct 31, 2026

The framework part of P5, in mr-moqui (F24; §4's `scan-input` and handheld density rows).

**Built.**
- `scan-input` (`xml-form-3.xsd`): `resolver` (required), `allowed-types`, `scan-id-field` (default `scanId`, distinct
  per form), `auto-submit` (default true), `confirm`, `placeholder`, `size`, `maxlength`; `parameter` (the screen's
  context) and `depends-on` children.
- The implicit `scanResolve` transition on every screen (`crates/moqui-core/src/screen/scan.rs`): the screen's view
  authorization; any method, since it only reads, with the session token checked on a POST. It finds the field by
  `scanForm` and `scanField`; the service, allowed types and context names come from the screen definition, never the
  request. The resolver gets `scanText`, `allowedTypes`, `scanId` and the declared names, and answers `matches`
  (`identityType`, `id`, `label`, `detail`) and `parsed`, which the framework fills from Products P11's parse
  (`moqui_lib::barcode::Gs1Data::to_value`) when the resolver gives none. At most 50 matches, of allowed types only.
- qvt `m-scan-input`: Enter or a scanner's Tab resolves; one match fills and submits (or waits for Confirm with the
  focus in the field); several open a chooser; none is named and keeps focus. A scan intent's id is `moqui.randomId`;
  the same text within 2 s of its first scan answers "Already scanned"; a new intent clears the last one's fields,
  late answers are dropped, and a form answer without errors empties the scan's fields. Server-static as qvt; html in
  `moqui-html.js` by the same rules; tui a search drop-down over `scanResolve` with a scan id made at render.
- `density="handheld"` (`xml-screen-3.xsd`): in the menu data and `sri.getScreenUrlInfo().density`, the deepest screen
  on the path winning; 48 px controls and 18 px text, no drawer, footer or other header buttons, the user's compact
  preference off while it shows. html puts `density-handheld` on its body.
- The gallery's Handheld screen with `example.ExampleServices.resolve#GalleryScan`, the HandheldScan walk, and docs
  (Qvt-Client's Scan input section and density, TUI, the webroot js README).

**For later phases.**
- The scan id is the CX-POSTING operation key; for this client-chosen id the lookup is scoped per user and operation
  (F143). Transitions read GS1 fields again from `name_scanText` with `ec.resource.parseGs1`.
- Every Warehouse resolver checks permission, facility and task itself: its parameters are client input and it runs
  even when a condition hides the field (F145). Transitions must not require `_type` or `_scanText` (tui, F139).
- Put `density="handheld"` on `Warehouse/Handheld`; the screens below inherit it. A background-submitted transition
  answers its messages as JSON `messageInfos` (F137). `scan-input` is not for `multi` form-list rows (F138).

**Decisions (agent's call, for review).** `scanResolve` takes any method with the token on POST (F140); one implicit
transition per screen, looked up by form and field, with no `parameter-map`; the framework fills `parsed`; the density
attribute takes only `handheld`; "Already scanned" clears the field.

**Verified.** moqui-core lib 1232 passed (the 2 l10n catalog tests need `mr-l10n`, absent from the worktree);
moqui-lib (but the corpus test, which needs components); `cargo lint`; clippy with no default features; `tui_screens`
with the drive through the scan drop-down; `moqui test-client webroot --offline` 348/348; `moqui test framework`
89/89; `moqui test example` 89 passed, 2 skipped; HandheldScan 3/3 at 390 px. Reviewed (F140–F149) and fixed.

**Commits.** mr-moqui `8f5dd299`, `4148ac9f`, `43c75124`, `3a0303ee` (merge of master), `a478fff5` (review fixes),
merge `7a547fba`.

### P4 build — Oct 31, 2026

**Built.**
- Mantle: `mantle.product.TraceabilityServices` (`Traceability.js`): `find#Movements`, the ledger with each row's source,
  document, variance reason, user, correction chain (the later rows of a receipt or issuance) and revaluation split or
  partial move (F121); `get#Traceability`, the bounded (depth 1–10, nodes ≤ 1000), cycle-safe lineage of an asset, lot,
  shipment, work effort, return or order as pages of nodes and edges and a tree keyed by occurrence (F26), Unknown
  provenance for a gap, restricted unnamed nodes outside the scope, cost only with `ACCOUNTING_VIEW`.
  `mantle.product.AssetRecordServices`: `update#AssetMetadata`, `create#Lot`, `create#Container`, `create#AssetContent`
  (§4). `StockScope.js` (the organization scope). `AssetContent` with its content types, registered in
  `get#RecordLinkInfo`, and the unbooked asset rule (F116). `get#ProductStockTotals`' `quantityByStatus` and
  `transitQuantity`. Asset `assetName` and `comments` audit-logged (F115).
- BOSS: the Inventory area (placeholder renamed) with Assets, AssetDetail (Ledger, Reservations, Audit, Files, Notes),
  Movements, Lots, Containers, ContainerDetail and Traceability, over `ironstone.warehouse.InventoryServices`
  (`Inventory.js`) and `template/WarehouseInventoryParts.xml`; Products' Product360 and InventoryAvailability mounted at
  `Inventory/Product360` and `Inventory/Availability` with a Warehouse branch in `SharedContext.js` (and `facilityIds` in
  `get#SharedContext`), Product360's Replenishment tab, Availability's Locations and lots, Reservations and Movements tabs,
  held by status and in transit in its Summary (`Inventory.js` of Products). Files and Notes on EquipmentDetail (its own
  section, outside any context's). `Warehouse.js`: `destinations` for asset, lot, container and product, the product
  record kind, a lot with no stock, and its helpers exported; `get#RecordLink` sends a Warehouse-only user's product to
  Warehouse's Product360 (B2). Demo: the available sealant's receipt on BOSS_WH_SHIP_IN and an issuance to
  BOSS_WH_SHIP_OUT.
- Specs: Mantle WarehouseTraceability; BOSS WarehouseInventory, WarehouseAccess (an Inventory list filtered for a capability
  user with authorization on and off, the Inventory services' reader and refusals, forged records, the files panel of
  another organization's stock, the product link), WarehouseShell (links), AppStructure and TuiRender; the walk
  WarehouseInventoryWalk.

**Not built.** ContainerHeader's metadata edit (the header is read only) and the container moves (P5); bulk Relocate and
row Move and Count (P5, P10); Correct and Scrap from Movements and Lots (P6); lot labels (P13); Movements' group-by views
and the Availability Age column (§7).

**For later phases.** Read the ledger and lineage through `TraceabilityServices` with the caller's `facilityIds`; P5 and P6
link corrections so `find#Movements`' chain follows them (`sourceAssetIssuanceId` and the like); P17's
`get#InventoryAtDate` reuses the revaluation-pair rule. At the merge with P2: keep one set of `Warehouse.js` exports and
route non-inventory assets to `Locations/EquipmentDetail` (§4).

**Verified.** Mantle: WarehouseTraceability 9/9; with F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads,
CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow,
ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and ProductStockTotals,
WarehouseStockChecks, AccountingFixedAssets and ProductContents, 158/158. BOSS: WarehouseInventory, WarehouseAccess,
WarehouseShell, AppStructure, TuiRender, ProductsInventory, ProductsAccess, ProductsSharedContext, ProductsShell,
ProductsScreens, RecordFiles, Chatter, AccountingFixedAssets, AccountingScreens, AccountingValuation, Shell, QuickCreate,
AppOrganizationFilters and ClientAccessInternal 305/305; ClientWrites passes with master's deny pattern (which lists
`warehouse`). Client: WarehouseInventoryWalk 4/4 with WarehouseFoundationWalk and ProductsInventoryWalk (9/9). Screen lint:
no flagged site in the new or changed screens.

**Commits.** mr-mantle `fb74e7d6`; mr-boss `d0418a0` and the docs commit.

**Merge with P2 and review fixes** (Oct 31): master (P2) merged into wh/p4 in both repositories; `Warehouse.js` keeps one set of
exports (P2's `required`, `inScope`, `facilityIds` with P4's `scope`, `recordOf`, `recordUrl`) and one `destinations`, and an
asset that is not inventory or supplies links to `Locations/EquipmentDetail`; EquipmentDetail's Files and Notes show once
in every context; `StockScope.js` rests on P2's `FacilityScope.js`. Review findings F123–F127 fixed. Verified: Mantle
WarehouseTraceability 11/11 and WarehouseFacilities; BOSS WarehouseInventory, WarehouseAccess, WarehouseShell,
WarehouseFacilities, ClientWrites, AppStructure, TuiRender and ProductsInventory, and the walks (counts in the final run
below). Commits: mr-mantle `ef5c0a1a` and the review fix; mr-boss `bdfd505` (the merge) and the review fix.
