# IronStone BOSS — Warehouse implementation

Oct 31, 2026 — P0–P18 built; P18 finish reviewed (F403–F405); its open questions, the shared party-role and
effective-date rules, the organization filters and the Mantle boundary decided (§4); what remains is §7

How [design-warehouse.md](design-warehouse.md) gets built, in phases from the foundation to the reports, each ending
tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md) and
[impl-accounting.md](impl-accounting.md) are: each phase names its scope by the design's sections and §17 needs rather
than restating them, and the design stays the place for screen and record detail. During the build this file is the
log: phase status and what each built, the decisions made, open questions, findings against the code, and what is
deferred.

Before P0, `screen/Warehouse/` held seven placeholders, and the root mounted only Chatter and RecordFiles. BossSetupData
had the root's admin authz and the admin, stock planner, manager and facility admin groups, but no root user group (F1,
F33). None of the design's proposed services, entities, fields or status items existed in Mantle or BOSS beyond what
Products and Accounting built first.
Warehouse was built after both (§4), so these were there to extend:
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
    `Shared/InventoryAvailability`; the groups its P1 seeds.
  - [impl-accounting.md](impl-accounting.md): the shared screens and the Warehouse contract it builds, its posting and
    adoption rules, and its findings that recur here (F4, F5, F25, F27).
  - [impl-projects.md](impl-projects.md): OrderDetail, InvoiceDetail and RequestDetail.
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28) and
  [review-core-apps/warehouse.md](review-core-apps/warehouse.md), which explain the design's D- and R- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8 (the §8.1 element
  checklist and the §8.2 handheld density), and [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- Inventories: [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md).
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/components/base`)
  - `runtime/components/addon/mr-mantle`
  - `runtime/components/addon/mr-boss`

  `runtime/components/addon/mr-marble` is read only, for the baseline Asset, Facility, Shipment, Shipping, Return and
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

  The walks are on Products' pattern (impl-products §2): one golden-path walk in `test/client/`, the rest acceptance
  tests. No screenshots.
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
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle, their users in spec-local
      groups that hold the permissions, never a BOSS group, and BOSS's in mr-boss;
    - the regression suites of mr-mantle and mr-boss passing within their budget;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `WarehouseAccess` (one holder and one non-holder on one verb, and another
    organization's record refused), not every service and mount;
  - its row and **Built** note here.

  The phase's "usable when" and its §8 scenario are acceptance tests to write (`test/acceptance/Warehouse/`,
  `test/acceptance/client/Warehouse/`, the handheld mounts at 390 px among them), named in the phase; running them is not
  part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Oct 31 (§6 F1–F34, F35–F46); see P0 verification below |
| P1 Foundation | Mantle, BOSS | the Warehouse root and menu, Home | built Oct 31, 2026; see build record below |
| P2 Facilities and locations | Mantle, BOSS | Facilities, FacilityDetail, EquipmentDetail | built Oct 31, 2026; see build record below |
| P3 Policies | Mantle, BOSS | Settings, StockPolicies, ReservationPolicies, AssetPools | built Oct 31, 2026; see build record below |
| P4 Inventory and traceability | Mantle, BOSS | Availability, Product360, Assets, AssetDetail, Movements, Lots, Containers, ContainerDetail, Traceability | built Oct 31, 2026; see build record below |
| P5 Posting guard and moves | mr-moqui, Mantle, BOSS | Move, HandheldHome, HandheldMove | P5a (framework) built Oct 31, mr-moqui `7a547fba`; P5b built Oct 31, 2026; see build record below |
| P6 Adjustments, scrap and repack | Mantle, BOSS | Adjustments, Repack | built Oct 31, 2026; see build record below |
| P7 Receiving | Mantle, BOSS | Receipts, ReceiptDetail, Receive, Supplier360, HandheldReceive | built Oct 31, 2026; see build record below |
| P8 Inspection | Mantle, BOSS | Inspections, QualityInspection, InspectionTemplates | built Oct 31, 2026; see build record below |
| P9 Putaway | Mantle, BOSS | Putaway, PutawayRules, HandheldPutaway | built Oct 31, 2026; see build record below |
| P10 Counts | Mantle, BOSS | Counts, CountDetail, CountEntry, CountReview, CountVariance, HandheldCount | built Oct 31, 2026; see build record below |
| P11 Picking | Mantle, BOSS | Shipments, ShipmentDetail, OrderDetail, Picklists, PicklistDetail, CreatePicklists, Pick, PickLocationMoves, HandheldPick, HandheldPickFace | built Oct 31, 2026; see build record below |
| P12 Packing | Mantle, BOSS | Pack, BoxTypes, MaterialIssueReceipt (kits), HandheldPack | built Oct 31, 2026; see build record below |
| P13 Shipping, labels and printers | Mantle, BOSS | Ship, PackageTracking, Carriers, Printers, InvoiceDetail | built Oct 31, 2026; see build record below |
| P14 Returns | Mantle, BOSS | Returns, ReturnDetail, ReturnReceipt, SupplierReturnShipment | built Oct 31, 2026; see build record below |
| P15 Transfers and requests | Mantle, BOSS | Transfers, TransferShipmentDetail, SubcontractShipmentDetail, StockRequests, RequestDetail | built Oct 31, 2026; see build record below |
| P16 Production runs and stock | Mantle, BOSS | MaterialIssueReceipt (work efforts), SubcontractShipmentDetail's output receipt | built Oct 31, 2026; see build record below |
| P17 Reports | Mantle, BOSS | Reports, StockAtDate, OperationsHistory, InventoryValuation | built Oct 31, 2026; see build record below |
| P18 Finish | Mantle, BOSS | NewCount (the count quick create) | built Oct 31, 2026; see build record below |

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
  - `WarehouseAccess`: the app's one access spec, about seven features run once with authorization on: facility scope
    and groups through the services, and the refused REST paths (MANTLE_API stays ADMIN-only for the Warehouse
    groups); an empty organization list is no facility, and an active organization the user does not belong to never
    widens the scope (F58). A later phase adds a case only for an access rule it adds.
- **Usable when** (the acceptance test `WarehouseFoundationWalk`): the menu renders for each group, and quick create
  offers only what the group may create. A reader sees their organization's facilities, stock and shipments but not
  another organization's, in lists, the palette and record links. A forged facility or asset ID is refused.

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
  - The seeded `WeApproved`→`WeInPlanning` transition, for an unrelease while no stock fact exists. (Not seeded: P16 review
    B4, F366; it comes with Manufacturing's guard.)
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

- The terminal twins, and the server-static sweep, an acceptance test.
- The design §19 acceptance review and crosscut §6 standalone operation, acceptance tests (`WarehouseAccessWalk`,
  `WarehouseIsolationWalk`). A Warehouse user with no other launcher, and an organization with no ProductStore, run
  receive to ship. That user is refused cost, settlement and other organizations' facilities, through URLs, shared
  contexts, handheld mounts, exports, the palette and search.
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
| Oct 31, 2026 | P3: the operation and reservation policies are `policyType` families of the one WarehousePolicy entity (fields added beside tracking's), dated and audit-logged the same way, through one dated-row writer in `WarehousePolicy.js`. Operation and reservation rows have organization and facility scope only (no product scope); tracking keeps its product exceptions. Default locations are a facility's and must be of the step's location type (receiving, quarantine, staging); unset, `resolve#WarehousePolicy` answers the facility's first location of that type, with source "location type". The short-quantity choice is a new `WarehouseBackorder` enumeration (backorder, cancel the remainder, ask), defaulting to backorder, Mantle's behavior | (agent's call, for review) P0 found tracking is WarehousePolicy, not its own entity; a second entity per family would repeat the dating and audit |
| Oct 31, 2026 | P3: the facility reservation default holds the reservation order and the automatic timing, and Mantle's reservation reads it (`get#ReservationDefault`, in `reserve#AssetsForOrder`, `checkReserve#AssetForOrderItem` and `reserve#AssetForOrderItem`) where the order part and its store leave the setting unset. With no row reservation is unchanged, and it refuses nothing, so it has no flag. "Partial allocation" and "require stock" are not in the facility default (F99): Mantle has no partial-allocation choice, and require-inventory stays the store's, edited on StoreReservation | (agent's call, for review) Without a consumer the default would be decoration; the alternatives were no Mantle change (the policy only shown) or a flag |
| Oct 31, 2026 | P3: the store override is the ProductStore's own fields (inventory facility, reservation order, timing, require inventory), changed through the field-scoped `WarehousePolicyServices.update#StoreReservation` with STOCK_POLICY_MANAGE in the store's organization, its fields now audit-logged; it wins for that store's orders only | (agent's call, for review) Design: "entity ProductStore through field-scoped service". It sits in WarehousePolicyServices beside the default it overrides rather than in StoreServices |
| Oct 31, 2026 | P3: pool members (AssetPoolParty, AssetPoolStore) gain audit-logged from and thru dates that `get#AssetPools` honors (undated rows always qualify); a membership in effect keeps its start, a new one starts now or later and an end is now or later, so no change reaches back. The pool itself has no dates and keeps the owner it was created for; a pool with the `_NA_` owner is a system administrator's. Ending a member moves no reservation; PoolDetail previews those it leaves unqualified, and re-reserving is P5's guarded action, as ReservationCheck's repair is | (agent's call, for review) The design's "active dates" are kept on the members, where qualification is decided |
| Oct 31, 2026 | P3: StockPolicies and FacilityReservation open on the organization's default and a facility is chosen in the scope form (an empty facility is the organization); ReservationCheck opens on the selected facility. FacilityDetail's Policies tab is its own subscreen file, `screen/Shared/FacilityDetail/Policies.xml`, taking `facilityId` and `appRoot` and checking the facility itself, wired into P2's FacilityDetail at merge | (agent's call, for review) |
| Oct 31, 2026 | P3 review: a pool member's key has no date, so re-adding an ended member reuses its row with a new period; the earlier period stays readable in the audit log of its dates. An empty end keeps a scheduled end | (agent's call, for review) A dated key would change get#AssetPools' readers and mr-marble's forms |
| Oct 31, 2026 | P4: the asset metadata allowlist is the name and comments only, now audit-logged (`enable-audit-log="true"`, F115), through a new `mantle.product.AssetRecordServices.update#AssetMetadata` over `update#Asset` that checks `STOCK_ADJUST` and the organization; serial, lot and expiry corrections stay P6's documented corrections | (agent's call, for review) Design AssetHeader's "metadata-only allowlist". `STOCK_ADJUST`, since a metadata edit corrects the record; the alternative was any stock permission |
| Oct 31, 2026 | P4: `create#Lot` (LotMetadata for a new lot) checks `STOCK_RECEIVE` and `create#Container` (NewContainer) `STOCK_MOVE`, both in `mantle.product.AssetRecordServices` with `create#AssetContent`, a new file so the phases extending AssetServices.xml do not collide | (agent's call, for review) Receiving makes lots; containers belong to the move role (design §1) |
| Oct 31, 2026 | P4: Mantle has no stock read permission, so `TraceabilityServices.find#Movements` and `get#Traceability` check the organization by party relationship (`StockScope.js`: an asset whose owner or facility owner is one of the user's organizations) and narrow to the caller's `facilityIds`; the app's access check decides who calls them. Cost only with `ACCOUNTING_VIEW` | (agent's call, for review) A reader holds no `STOCK_*` permission and must read the ledger and Traceability |
| Oct 31, 2026 | P4: a lot with no stock anywhere (a new lot) is open to every Warehouse user (`check#Record`, LotList), since it names no organization's stock; a lot with stock follows its stock's facilities | (agent's call, for review) Otherwise a lot just created would vanish until something is received into it |
| Oct 31, 2026 | P4: Warehouse's Availability counts held as on hand less the available-status quantity (every status but AstAvailable, F39), and shows in transit, from two new compatible outputs of `get#ProductStockTotals`: `quantityByStatus` and `transitQuantity` (the owner's shipped transfers to the facility, issued less received). Products' Held (quarantine only) is unchanged | (agent's call, for review) F39 |
| Oct 31, 2026 | P4: AssetDetail serves every asset in the Inventory lists; the asset record link keeps AssetDetail for inventory and, once P2's `Locations/EquipmentDetail` is merged, sends a non-inventory asset (equipment) there; resolved in the merge of `destinations` | (agent's call, for review) The coordinator's merge note with P2 |
| Oct 31, 2026 | P4: Availability's Locations and lots, Reservations and Movements tabs show in the Warehouse context only (their screen condition); Product360's Replenishment tab is listed by Warehouse's branch only and placed last (menu index 19); Product360's tag and label links and Documents' translation and datasheet links show only when the context has their route | (agent's call, for review) The Products context is unchanged |
| Oct 31, 2026 | P5b: the posting guard is `service/mantle/shipment/StockPosting.js`, the steps every WarehouseTaskServices entry point takes in order (begin: permission then operation key; stock; destination; keepHeld and expiry; the primitive and dependent writes; complete), each entry point inline XML Actions calling them; one out-parameter `result` with `operationKey`, `operationType`, `resultCode`, `alreadyApplied`, `postedDate`; a batch runs each row through the single-row entry point in its own transaction under `"<batch key>/<row key>"` | (agent's call, for review) A small reusable pattern later phases follow (WarehouseImplementation.md "Posting guard and moves") |
| Oct 31, 2026 | P5b: the single move is `move#Stock` and the bulk one `relocate#Assets`, not a `move#Asset` of WarehouseTaskServices beside AssetServices' | (agent's call, for review) A same-named entry point reads as a copy of Mantle's primitive |
| Oct 31, 2026 | P5b: held stock is AstQuarantine only: AstOnHold (receiving) is released by putaway into a pick or bulk location, AstMorgue by scrap (P6). The guard refuses a move that would change a quarantined asset's status, and (P5b review, F419) any status change with no StatusFlowTransition from the current status to the new one | (agent's call, for review) §2 names quarantine; a receiving hold is the normal putaway path |
| Oct 31, 2026 | P5b: moves post no value, so `move#Stock` has no period check; the value-posting entry points (P6 on) add a step that refuses a closed fiscal period of the effective date, as `PostingGuard.js` checks `post#AcctgTrans` | (agent's call, for review) A within-facility move changes no account |
| Oct 31, 2026 | P5b: `repair#FacilityReservations` takes `STOCK_POLICY_MANAGE` (the warehouse manager's, who owns ReservationPolicies) and the preview's fingerprint (`preview#FacilityReservations` answers `previewFingerprint`); each finding is its own transaction and result | (agent's call, for review) The alternative was `STOCK_MOVE` |
| Oct 31, 2026 | P5b: the expiry gate's policy organization is the facility owner's: the inventory facility owner (else the order's vendor) for reservation, the asset's facility owner (else its owner) for issue and moves (P5b review, F423); `issue#Asset` refuses a named expired asset and skips expired stock it chooses itself, except on a purchase-return shipment (F424) | (agent's call, for review) The organization whose facility holds the stock and whose tracking policy holds the flag |
| Oct 31, 2026 | P5b: Move moves one chosen asset (MoveContents), not a product quantity across assets (`move#Product`); the desk MoveConfirm chooses a location, a container being the handheld bin scan's other type or ContainerDetail's; RecentMoves are the user's own move operations from PostingOperation | (agent's call, for review) Every move names its stock; design's "product-level moves show the selected asset allocation first" |
| Oct 31, 2026 | P5b: a handheld task is the desk task's screen mounted under `Warehouse/Handheld` (Move at `Handheld/Move`), which reads the area's `handheldMount` and shows one form whose confirmed bin scan id is the operation key; it submits normally and the page comes back with the scan focused, rather than a background JSON answer (F137) | (agent's call, for review) One transition and one posting identity for both mounts (design HandheldMove) |
| Oct 31, 2026 | P5b: a desk form's operation key is a render token (`ec.user.randomString`, not a record id), so a double submit of the page's form is one operation | (agent's call, for review) |
| Oct 31, 2026 | P10: a count line is one asset of the scope at the snapshot (location, lot, owner, pool, status, container, quantity, time), and stock found that the snapshot did not hold is an extra line by product, location and lot (a snapshot line of the same stock refuses it: count it there). Review approves a counted line with observed less snapshot when the asset neither moved nor changed since the snapshot; otherwise it is a conflict, resolved by a recount (a new snapshot where the asset is now, the old observation kept in the audit log) or by carrying observed less the balance at the time counted, with a reason. Review skips uncounted lines as not counted | (agent's call, for review) Design CountEntry, CountReview; the per-asset line makes F5's once-per-asset posting hold by construction |
| Oct 31, 2026 | P10: `post#Count` posts each stock bucket (an asset; stock found by product, location and lot) in its own transaction (`post#CountLines`, lines then asset then location locked), refusing a move or change since the review (`STOCK_MOVED`, back to conflict); a failed bucket is named and the rest post; posted lines are skipped by a later attempt; with all lines posted or skipped the count completes and FacilityLocation and ProductFacility take the count time as `lastCountDate` (a one-location count dates its location even with no line). A closed period refuses the whole post before anything is written (PostingGuard.js's `fiscal` on the effective date, a Timestamp), and each bucket checks it again under the period lock (StockPosting.js's `period`) in case it closes meanwhile; once a line posts, the count's date is fixed | (agent's call, for review) Design PostCount; the operation key answers a retry of the same post |
| Oct 31, 2026 | P10: blind counts: expected quantities, variances and values are in the server's answers for a count that is not blind, and for a blind one only once submitted and only to reviewers and adjusters; CountVariance needs count review or adjust and leaves out counts not submitted. The blind default is the operation policy's `blindCount` (F101) | (agent's call, for review) Design CountDetail States |
| Oct 31, 2026 | P10: the count schedule is its own effective-dated entity `mantle.facility.CountSchedule` (a sequenced id, `previousCountScheduleId`), written by `WarehousePolicyServices.store#CountSchedule` (CountSchedule.js over WarehousePolicy.js's guard), not a `policyType` of WarehousePolicy, whose key holds one row per facility and product. A row counts locations (type, area, location) or products (category, ABC class), not both; zero confirmation counts locations. Next date: periodic is last count plus days (never counted: the row's start), annual is the first occurrence of the date after the last count (never counted: on or after the start), the earliest of all rows wins and on the same day zero, then periodic, then annual. Products come due only while stocked at the facility | (agent's call, for review) §4's schedule; WH-COUNT |
| Oct 31, 2026 | P10: "scrapped stock" a count leaves out is stock awaiting scrap (AstMorgue) and, for zero confirmation, a location emptied by a scrap PhysicalInventory (P6's `scrapIndicator`, read when the field exists) | (agent's call, for review) P6 coordination |
| Oct 31, 2026 | P10: `request#Count` is the ad hoc due: Request a count (STOCK_COUNT) and P11's short-pick recount (`countSourceEnumId` CntSrcShortPick, STOCK_COUNT or SHIPMENT_PICK, joining an open recount of the same stock); a planned spot count dated now, listed by `find#DueCounts` until it starts. Request a count on Assets and Availability makes one count per facility of the selected assets | (agent's call, for review) A picker reports the short pick without count authority |
| Oct 31, 2026 | P10: the Warehouse Today source is `ironstone.warehouse.HomeServices.get#TodayItems` over `Today.js`'s table of sources, with the assigned counts; P8 adds inspections and P11 overdue loads as sources (F42 gave it to P8, not built yet). Due counts notify through the nightly `notify#DueCounts` (WarehouseCountsDue, once a day per facility, to the organization's STOCK_COUNT users and the assignees) | (agent's call, for review) |
| Oct 31, 2026 | P6: the entry points are `preview#StockAdjustment` and `adjust#Stock` (Adjustment), `scrap#Asset`, `correct#LotMetadata`, `preview#Repack` and `repack#Asset` in `mantle.shipment.WarehouseTaskServices`, on StockPosting.js's steps with the bucket, lot and pack rules in `service/mantle/shipment/StockAdjustments.js`; the previews are read-only services the screens call, and the posting compares the preview's fingerprint (`PREVIEW_CHANGED`) | (agent's call, for review) The design names `scrap#Asset`, `repack#Asset` and `correct#LotMetadata`; an adjustment needed a name beside Mantle's record services |
| Oct 31, 2026 | P6: AdjustmentScope's None and Any are a location's and a lot's (blank is None, Any is chosen), as Mantle's `strictLocation` and `strictLot` express; pool and status are a value or Any; the owner is the facility owner unless given, as `record#PhysicalInventoryChange` takes it (F156). Every adjustment (P6 review, F165) posts the change computed from the locked plan through `record#PhysicalInventoryChange` with the plan's assets in its order, on a PhysicalInventory the entry point makes (F157); a scrap reason is refused (Scrap's, F168). A count that matches posts nothing (`NO_CHANGE`) | (agent's call, for review) Mantle's services cannot express None for an owner, pool or status without making every selector None (`strictAll`) |
| Oct 31, 2026 | P6: the period step is `StockPosting.js` `period(organizations, date)`, which reads `PostingGuard.js`'s exported `fiscal` periods (for update) of each organization the posting reaches and refuses a closed one (`PERIOD_CLOSED`); the adjustment checks its effective date, scrap and repack today. FixedAssets.js's `checkOpen` is the same rule but not exported | (agent's call, for review) F155 |
| Oct 31, 2026 | P6: a lot correction needs `STOCK_ADJUST`, except extending its expiry (a later date, or none), which needs `LOT_EXPIRY_EXTEND`; the entry point admits either permission at `begin` and checks each change after the lot is locked, so a retry of a quality manager's extension is answered. An earlier expiry is a correction (`STOCK_ADJUST`). An asset whose expected end of life was the old expiry follows the lot (F158) | (agent's call, for review) The design gives the extension to the quality manager and the other corrections to the adjuster's documented correction |
| Oct 31, 2026 | P6: scrap takes free stock only: quarantined stock is refused (`HELD_STOCK`, its inspection's disposition scraps it, P8) and reserved stock beyond what is free (`RESERVED_STOCK`); the morgue location is optional and must be of the morgue type; the dialog proposes InVrExpired for expired stock and InVrScrap otherwise | (agent's call, for review) Design: "Scrap is the one path for free stock that leaves as waste" |
| Oct 31, 2026 | P6: a repack's work effort is a `WetTask` of purpose `WepAssembling` owned by the stock's owner at its facility, created in progress and completed in the same operation; the target is received with the location type's status (or the source's), the source's lot, expiry, manufactured date and pool, and `acquireCost` = issued cost ÷ target quantity at the four decimals `acquireCost` keeps, the last unit received apart at the remainder's cost so the receipts carry the issued value exactly (P6 review, F166); the receipt keeps the entered source quantity and `appliedConversionFactor` (target per source). Only available or on-hold stock (`HELD_STOCK`, F167) with an owner (`OWNER_REQUIRED`, F173) that is free to issue is repacked (`RESERVED_STOCK`) | (agent's call, for review) Design Repack |
| Oct 31, 2026 | P6: Adjustments (Inventory) and Repack (Transfers) are open to every Warehouse user, as Move is, with their actions for the adjust and move capabilities and a "needs the permission" line for others; the demo's closed fiscal month is June 2024 of ORG_ZIZI_RETAIL, a month no other demo posts in | (agent's call, for review) |
| Oct 31, 2026 | P7: the receive guard is `WarehouseTaskServices.receive#ShipmentStock` (over `receive#ShipmentProduct`), the ad hoc receipt `receive#AdHocStock` (over `receive#Asset`) and "Receive all as expected" `receive#ExpectedShipment`, which accepts each line's remainder through the guard and then delivers, all or nothing, refusing a lot- or serial-tracked line (TRACKING_REQUIRED); `receive#EntireShipment` is not called (it ignores the receipt steps and the tracking policy, F37) | (agent's call, for review) No entry point is named like the Mantle primitive it guards (P5b's `move#Stock` rule) |
| Oct 31, 2026 | P7: Purchasing's close is `PurchaseRemainders.js`: `close#PurchaseRemainders` checks PURCHASE_ORDER_EDIT and runs `remainders()`, which `close#ReceiptRemainder` runs inside its own STOCK_RECEIVE operation (§2), so nothing checks its caller. The Requirement allocation released is `RequirementOrderItem.quantity`, lowered by the cancelled quantity (the requirement's status is unchanged); the reason is an internal OrderNote and the operation's answer | (agent's call, for review) |
| Oct 31, 2026 | P7: a completed or cancelled order's commitments are released by the new internal `BudgetServices.release#ClosedSourceCommitments` (no permission of its own, as `reverse#InvoiceActuals`; it refuses a source that is not closed), since `release#Commitment` needs a finance permission neither a receiver nor a buyer holds (F179) | (agent's call, for review) The alternative was to leave the commitment open for finance |
| Oct 31, 2026 | P7: `adjust#ExpectedReceipt` admits PURCHASE_ORDER_EDIT beside STOCK_RECEIVE, as `ensure#PurchaseReceipt` does: it is Purchasing's revision call | (agent's call, for review) The plan named STOCK_RECEIVE only, which a buyer lacks |
| Oct 31, 2026 | P7: `ensure#PurchaseReceipt` puts the part's whole remainder on its one open receipt (Mantle's `create#OrderPartShipment`); a partial expected receipt (an ASN of some lines) is §7. Its new receipt's sources of a line in another unit are converted to the stock unit (F176) | (agent's call, for review) |
| Oct 31, 2026 | P7: receipt steps at posting: step 1 to the receiver's location, else the product's first open ProductFacilityLocation, else the receiving location; step 2 to the receiver's location, else the receiving location; step 3 always to a quarantine location (the receiver's, if it is one, else the policy's), AstQuarantine. The over-receipt tolerance counts every receipt of the product on the shipment (F182). A pack has no unit of its own: its receipts keep `enteredQuantityUomId` empty and the pack's contents as the factor | (agent's call, for review) |
| Oct 31, 2026 | P7: Receive takes purchase receipts only (RECEIPT_TYPE): a customer return is received on ReturnReceipt (`receive#ReturnItems`, P14) and a transfer on Transfers (P15). Receipts lists all three kinds received at the user's facilities, and NewReceipt for a return opens the shipment its approval created | (agent's call, for review) |
| Oct 31, 2026 | P7: ReceiptDetail's Warehouse branch is boxes (lines, receipts, files, conversation) under the record header, with Receive (primary), Finish receipt and Receive all as expected beside it and the supplier and the two documents in More; its Inspection (P8) and Tracking (P13) parts come with those phases. The Receipts board and calendar read only (a receipt's status changes by receiving and finishing it) | (agent's call, for review) |
| Oct 31, 2026 | P7: the receipt exception notice (rejected units, a remainder closed or backordered) goes to the facility owner's users holding STOCK_POLICY_MANAGE (the warehouse managers), through Payables.js's `notify`; a notice that fails is logged and the receipt stands | (agent's call, for review) There is no receiving-supervisor permission |
| Oct 31, 2026 | P7: Home counts the receiving queue (the selected facility's open purchase receipts: late when overdue, waiting otherwise); ready and backorder stay unavailable | (agent's call, for review) |
| Oct 31, 2026 | P7: Supplier360's Warehouse branch reads `ReceiptServices.get#SupplierReceiving` in place of Products' `get#SupplierDetail` (which needs supplier-price read) and adds the Receiving and Conversation tabs; the Products & prices tab's condition leaves it empty there (F178) | (agent's call, for review) |
| Oct 31, 2026 | P7 review (A1): Mantle counts an order line in another unit than its product's stock unit in stock units through the line's factor (`OrderServices.get#OrderItemStockFactor`): `isFulfilled#OrderItem`, `cancel#OrderItem` (issued and the source reduction), `create#OrderPartShipment`, `add#OrderPartToShipment` and `update#ShipmentItem`'s increase. The factor is 1 when the line has no unit, the same as the product's (create#OrderItem's default) or no UomConversion relates them, so existing orders and the flow specs are unchanged; Receiving.js no longer converts a receipt itself (F186) | (agent's call, for review) The review's preferred fix; the fallback (refusing another unit) was not needed |
| Oct 31, 2026 | P7 review (B1): one lock order, the shipment, then the order parts, then the order header, then the destination location: `adjust#ExpectedReceipt` finds the open receipts without locks and locks them before the parts, and Purchasing's close locks the parts before the header, the order Mantle's completion updates them in (complete#OrderPart, then the header) | (agent's call, for review) The review named header before part; part first is Mantle's own update order, so a receive completing a part elsewhere cannot cross a close (F187) |
| Oct 31, 2026 | P7 review (B2): the receipts check the fiscal period of today for the facility owner (PERIOD_CLOSED) without serializing on the TimePeriod rows: `posting.period(..., {lock: false})` in `receive#ShipmentStock`, `receive#AdHocStock` and `receive#ExpectedShipment`; post#AcctgTrans's own guard still runs | The coordinator's call |
| Oct 31, 2026 | P7 review (C6): `receive#AdHocStock` takes a given cost only with ACCOUNTING_VIEW (COST_NOT_PERMITTED); with none it uses the product's approved standard cost for the owner and facility (Costs.js `effective`), else its latest acquire cost there, else none; the answer names the source, never the value. Receive shows the cost field only with financial read | (agent's call, for review) |
| Oct 31, 2026 | P9: a putaway rule is its own dated record, `mantle.facility.PutawayRule` (sequenced id, `previousPutawayRuleId`, key fields audit-logged under the reason), as CountSchedule is, written by `PutawayServices.store#PutawayRule` (FACILITY_EDIT in the facility's organization). There is no draft status: a rule with a later from date is the draft, and RuleTest tries it with "As of" (`resolve#Destination`'s `asOfDate`); a change ends the rule in effect where the next starts, End ends it now | (agent's call, for review) The shared effective-date rule (impl-drawers-commons §4); design RuleList's "save draft/activate" maps to the from date |
| Oct 31, 2026 | P9: storage type is a `StorageType` enumeration (refrigerated, frozen, hazardous, oversize; extended as data) on `Product.storageTypeEnumId` (audit-logged) and `FacilityLocation.storageTypeEnumId`; they must match both ways (a typed location takes only its products, a typed product goes only to its locations), and a rule may apply to a storage type. FacilityDetail's location forms set a location's; a product's has no screen yet (§5) | (agent's call, for review) Design WH-PUTAWAY's "storage-type applicability"; Mantle had no storage type (F215) |
| Oct 31, 2026 | P9: `resolve#Destination` tries the product's default locations (ProductFacilityLocation, in pick sequence) first, then the destinations of the rules in effect that apply, by priority, at most 25 locations, every one under the same checks (open, not where it is, a storage location, quarantined stock only in quarantine, the status flow, storage type, one owner, the location's and the rule's capacity with what is coming); "within the rules" is those checks: a rule adds destinations and does not exclude the default, and a rule naming a default location applies its capacity there (P9 review, F225). Only available and on-hold stock is put away (F224). Receiving, staging, quarantine, morgue and ship-dock locations are never a putaway destination (quarantine is the only one for quarantined stock), and with nothing that fits the stock stays where it is with the reasons (`NO_DESTINATION`), never overflowing | (agent's call, for review) Design PutawayRules "ProductFacilityLocation defaults are tried within applicable explicit constraints" |
| Oct 31, 2026 | P9: capacity is measured in the location's (or rule's) unit: none or a count unit is the stock quantity, a weight or volume is the product's ProductUomDimension per unit converted by `convert#Uom`, and stock with no such measure is unmeasured and keeps the location from claiming spare capacity. What is coming to a location ("incoming reservations") is the putaway queue's stock (on hand in the facility's receiving and staging locations) with an earlier claim (received before the stock resolved, by date then id; a receipt comes last) of the products whose first default location it is (P9 review, F226) | (agent's call, for review) There is no record of stock promised to a location (F218); design Capacity's "Unmeasured" |
| Oct 31, 2026 | P9: putaway is its own entry point, `WarehouseTaskServices.putaway#Stock` (StockPutaway, STOCK_MOVE) on StockPosting.js's steps, not `move#Stock`: it takes the suggestion or another location with a reason (REASON_REQUIRED), checks the destination again once `check#FacilityLocationOpen` has locked it, and releases a receiving hold (AstOnHold) to AstAvailable in storage through `update#mantle.product.asset.Asset` by its status flow, since `move#Asset` keeps the hold where the location type has no status (F217), only for stock put away from a receiving or staging location (P9 review, F223). A one-step receipt (Receiving.js step 1) posts to the resolver's location, checked again once locked (F229), else the receiving location with the reason in the answer (`putawayExplanation`) | (agent's call, for review) The brief's "move#Stock or a putaway entry point on the same pattern"; P5b's §4 row (a receiving hold is released by putaway) |
| Oct 31, 2026 | P9: the putaway queue is the available and on-hold stock on hand in the facility's receiving and staging locations and in its quarantine locations (released by a disposition), oldest first by received date and on each page by the suggestion's pick sequence; Putaway, the sheet and PutawayRules are open to every Warehouse user, with Confirm move for the move capability and the rule changes for the facility admin (Mantle's reads need the facility in FacilityScope, as the policy reads do); Home counts ready (the queue) and late (received before today); HandheldPutaway scans the stock (which reloads with its suggestion), then the bin with confirm, whose scan id is the operation key | (agent's call, for review) Design Putaway "queue list ordered by age and destination pick sequence"; P5b's handheld pattern |
| Oct 31, 2026 | P11: the guarded pick is `WarehouseTaskServices.pick#ShipmentStock`, one shipment source line through Mantle's `pickMove#ShipmentProduct` with two new optional parameters (`shipmentItemSourceId`, only that line; out `pickedMoveList`, each reservation moved with its from-location), so Mantle's own callers are unchanged; on the handheld the scanned product must be the line's (a BOSS check in Pick's `pickCurrent` transition, PRODUCT_MISMATCH; the desk form picks the line's own product), and a scanned asset narrows the pick to that asset's reservations (`pickMove#ShipmentProduct`'s `pickAssetId`, P11 review B2) | (agent's call, for review) The plan names no entry point for PickScan; design §9 says pickMove through the guard. The line identity keeps short picks and put backs on the same line |
| Oct 31, 2026 | P11: a put back returns stock to where each guarded pick took it, read from the pick operations' stored answers on the CX-POSTING record (PostingOperation of type ShipmentPick with the line as resultId, an index added), each put back naming the pick it consumed; quantity picked without a container moves nothing (`untrackedQuantity`), and a shipment with a pick container refuses quantity no recorded pick covers (UNTRACKED_PICK). `putBackQuantity` is set by `cancel#OrderItem` where it lowers a source line below what was picked. The OrderItem update's SECA (OrderItemUpdateCheckReserve) resets the item's reservations by the store's order, so `cancel#OrderItem` then puts the line's remaining reservation back on the stock picked into the container (`reserve#AssetForOrderItem` with its `assetIdList`), and a cancelled balance's put back moves no reservation and re-reserves the same way afterwards, since `move#Asset` carries reservations into a pick location (P11 review B1, F262); an unpick still takes the reservation with the stock | (agent's call, for review) No new pick record; the alternative, a pick-line entity, duplicates what the operation already keeps |
| Oct 31, 2026 | P11: `finish#Pick` finishes a shipment with SHIPMENT_PICK (backordering what is outstanding through `update#ShipmentItem`, then ShipPicked) and a picklist with SHIPMENT_LOAD_EDIT (LoadCompletion: acknowledged, then `complete#ShipmentLoadShip`); a pick, short pick, put back and finish post no value, so none checks the period | (agent's call, for review) Completing a load takes shipments off it, a supervisor's change |
| Oct 31, 2026 | P11: PicklistDetail's edits and NewOutgoing are Mantle services with SHIPMENT_LOAD_EDIT and the facility's organization (`ShipmentWorkServices.store#ShipmentLoad`, `edit#ShipmentLoadMember`, `store#ShipmentLoadAssignment`; `WarehouseTaskServices.create#OutgoingShipment`, which refuses a held order), not entity writes from the screens; the standalone source of NewOutgoing (`create#Shipment`) is §7 | (agent's call, for review) Design §9 says entity for LoadPeople and LoadEquipment; §2 puts permissions in Mantle |
| Oct 31, 2026 | P11: the wave preview evaluates every candidate the search finds, held parts included, so it names why each is excluded; CreatePicklists posts the previewed groups back (JSON) and each group is its own operation and transaction, its parts locked (order part, then header) and evaluated again | (agent's call, for review) |
| Oct 31, 2026 | P11: the picklist palette type is the Warehouse palette source's `load` kind (Mantle has no DataDocument for shipment loads; a WetEvent indexes as MantleEvent, which opens Commons); a load's record link and Today item open PicklistDetail, for the Picking area's groups only. OrderDetail is mounted at `Warehouse/Orders/OrderDetail` under an Orders area out of the menu; Shipping gets Shipments and ShipmentDetail now, Pack and Ship with P12 and P13 | (agent's call, for review) |
| Oct 31, 2026 | P8: QualityInspection (role app) is mounted at the Warehouse root, `Warehouse/QualityInspection`, hidden from the menu, with its certificate `Warehouse/InspectionCertificate` beside it, so the root's grant opens it to every Warehouse user; the Inspection area (Inspections, InspectionTemplates, TemplatePrint) stays for the inspect and quality manager groups. P1's own artifact group under the denied area does not work in the browser, which loads each level of a path as its own request (F195) | (agent's call, for review) Design path `Warehouse/Inspection/QualityInspection`; the alternatives were opening the Inspection area to every Warehouse user, or a framework change |
| Oct 31, 2026 | P8: a disposition is its own record, `QualityInspectionDisposition` (decision, quantity, source and result asset, location, status after, the reservation Release made, the scrap's PhysicalInventory), beside the five records the plan names: a posting with an identity, which the shared rule keeps as a record. Release takes the accepted quantity and every other disposition the rejected (QUANTITY_EXCEEDS_RESULT); the inspection is Disposed when nothing is left. `heldQuantity` falls with Release, Use as is and Scrap; Quarantine, Rework and the two returns keep the stock quarantined and held until their own process (P14's return, a rework) moves it, or until Inspect again (`create#Inspection` with `reinspectQualityInspectionId`, QUALITY_INSPECT) moves the held quantity to a new inspection of the same receipt and asset, whose own disposition releases or scraps it (P8 review B3). One open inspection holds an asset (INSPECTION_EXISTS); a draft or submitted inspection may be cancelled with a reason (`cancel#Inspection`) | (agent's call, for review) Crosscut §3.19 InspectionDisposition |
| Oct 31, 2026 | P8: customer demand is `QualityInspection.demandOrderId`/`demandOrderItemSeqId`, filled from a run's `OrderItemWorkEffort` or given to `create#Inspection`; Release reserves it on the released stock first (`reserve#AssetForOrderItem` with the asset, before AstAvailable), then `update#Asset` AstAvailable runs AssetStatusAvailableReservations, which gives the rest to waiting reservations by priority. Since the P8 review the peg must be the facility owner's sale of the inspected product in the user's organizations (DEMAND_INVALID, at create and again at Release), and Release keeps the item's reservations: only its not-available quantity, up to the released quantity, is reduced, then the item is reserved with the released asset first (A1, B1). A purchase receipt has no demand provenance until RequirementSupply (§7), so its release reaches the waiting order through the SECA | (agent's call, for review) Design §5 QualityInspection; F197 |
| Oct 31, 2026 | P8: verification is required before any disposition (VERIFICATION_REQUIRED), never by the user who submitted (SELF_VERIFY, always: no organization flag yet, §5); a verifier returning it sends it back to Draft with the reason, its readings kept. Readings are saved only while a draft; a mandatory characteristic needs one reading (of any sample) before submitting | (agent's call, for review) Crosscut §3.19 Actions and States |
| Oct 31, 2026 | P8: a purchase receipt needs inspection when the operation policy's step is 3, the tracking policy's new `inspectionRequired` is Y, or a published template of the facility owner applies to the product in the receipt context (product, category or any; facility or any); it then posts as step 3 (quarantine) and creates one inspection per accepted receipt row in the receipt's operation. `receive#AdHocStock` is unchanged (F198) | (agent's call, for review) Design §4 Receive |
| Oct 31, 2026 | P8: `get#SourceInspectionStatus` per receipt: held is its inspections' `heldQuantity`, and a receipt with no inspection whose stock is quarantined is held whole (the stand-in's rule, kept for stock quarantined before CX-QUALITY or outside it); match-eligible is accepted less held and, since the P8 review, less inspection-rejected (below). Bill matching's `inspectionCheck` answers `available` | (agent's call, for review) Design WH-QUALITY keys; F31 |
| Oct 31, 2026 | P8 review (B2): inspection-rejected quantity (Scrap, Return to supplier) leaves match-eligible, so a bill for scrapped or returned goods does not match fully (design-accounting: an unbilled supplier return reduces the match-eligible receipt); Quarantine and Rework stay held. `get#SourceInspectionStatus` and `InvoiceMatch.js` agree: the match base is accepted less held less inspection-rejected | The orchestrator's call, for review |
| Oct 31, 2026 | P12: the pack entry points are `WarehouseTaskServices.pack#ShipmentStock` (PackScan: a line, a product or a scan through Mantle's three pack services), `pack#ShipmentAssembly` (PackAssembly), `edit#ShipmentPackage` (PackageEditor and PackOptions: create, update, weigh, delete, move), `complete#Pack` and `reopen#ShipmentPackage`, all `SHIPMENT_PACK`, on StockPosting.js with `Packing.js`; a pack checks the period without the lock, as receipts do (it posts cost of goods sold at the issue) | (agent's call, for review) The plan names CompletePack's guard, `reopen#ShipmentPackage` and PackAssembly's guard; PackScan and the package edits are entry points too so their permission is in Mantle (§2) |
| Oct 31, 2026 | P12: ReopenPackage releases the in-process invoice through a new internal `InvoiceServices.release#ShipmentInvoiceLines` (the body of `release#ShipmentDraftInvoice`, which keeps its RECEIVABLE_EDIT check and operation key and calls it), no permission of its own, as P7's `release#ClosedSourceCommitments`; the reopen's SHIPMENT_PACK and its own operation key guard it (F275). Reopening one package releases the shipment's lines from the invoice, so the next Complete pack bills the whole shipment again | (agent's call, for review) The alternative, release#ShipmentDraftInvoice as is, would let only a user who also holds RECEIVABLE_EDIT reopen a package; the plan's "the release succeeds" reads as the packer's reopen |
| Oct 31, 2026 | P12: a reopen takes a package's contents (or a product's quantity in it) off the shipment's issuances of the product, newest first, since a package's content names no source and an issuance no package (F278); it returns a packed shipment to Picked and its completed order parts and header to Approved by their status flows (F281), and leaves the stock where it was packed: a line the order then reduces (`cancel#OrderItem`, flagged `putBackQuantity`) is put back by Pick's `reverse#Pick`, so P11's put back and its reservation rule are reused unchanged (never a reset). Since the review: a product packed from several assets is reopened by naming the asset (ASSET_REQUIRED, F287); the re-approval runs Mantle's OrderApproved rules again (notify, the approval email, subscriptions, F290); the locks are taken shipment, order parts, headers, invoices, lines and assets (F294) | (agent's call, for review) |
| Oct 31, 2026 | P12: Complete pack requires every packed product in a package, no empty package, a weight on each package (labels need it, P13), picked stock packed or put back, and an acknowledgement for what is left unpacked (pack#Shipment lowers the lines to what was packed) | (agent's call, for review) Design CompletePack "check packed quantities ... shortfall decision" |
| Oct 31, 2026 | P12: with `kitCostFromComponents`, each kit batch is costed at the next slice of the component issuances in issue order (exact, no averaging), the unit at four decimals rounded down with the remainder on its own unit (F166's rule; F292); a later pack adds to the kit asset only when its unit cost is the same, else receives its own asset, so earlier kit issuances never re-value; a component with no cost leaves the kit uncosted, as before | (agent's call, for review) F41 said the cost goes to `update#AssetAndReceipt` when a later pack adds; a re-averaged asset would re-post its earlier issuances and could not net exactly |
| Oct 31, 2026 | P12: box types are shared by every organization (Mantle's ShipmentBoxType has no owner); their writes need FACILITY_EDIT (`mantle.shipment.PackagingServices`), a facility's box types also the facility in scope; a facility that names box types packs only those, one that names none any type in use; a retired type (`thruDate`) is refused for new packages and kept on old ones; since the review a type another organization's facility or packages use is changed only with every organization's scope (BOX_TYPE_SHARED, F289) | (agent's call, for review) Design BoxTypes "a used type is retired, not removed" |
| Oct 31, 2026 | P12: `Shared/MaterialIssueReceipt` is mounted at `Warehouse/Inventory/MaterialIssueReceipt` out of the menu (opened from Pack), with `sourceType` and `sourceId`, driven by its source's entry in `Packing.js` `sources` (the header, links, lines and words from `get#MaterialSource`; a line's posting from `get#MaterialAction`, which the screen's one `materialAction` transition runs after `check#Record`), so P16 adds only an entry for the work effort; the demo's kit flag is on ORG_ZIZI_CORP's preference, where Retail's rolls up; Zizi's invoices stay final at pack (D3 off), so the demo shows a closed package and the Mantle spec the in-process reopen | (agent's call, for review) |
| Oct 31, 2026 | P14: a return's hold (the P9 open question) is released by an inspection's disposition. Every return received through ReturnReceipt goes as AstQuarantine into a quarantine location (the receiver's, the operation policy's, else the facility's first open one) with a QisReturn inspection of each accepted receipt, whatever the receipt step or template (a return template that applies is used); Release makes it available where it is, and putaway never releases a return (F223). Stock received on hold outside the guard (Accounting's receipt, AstOnHold with no location) stays on hold until an inspection of the asset is disposed | (agent's call, for review) Design §11 ReturnReceipt "quarantine; inspect and release"; crosscut §3.18 "settlement happens only after inspection and disposition". The alternatives were a putaway release or an explicit release step on the return |
| Oct 31, 2026 | P14: `receive#ReturnItems` (Accounting P17's) takes an optional `operationKey`: with it, it is Warehouse's guarded receipt (ReturnStock.js: begin, the shipment and items locked, scope, tracking rules, the quarantine location locked last, the non-locking period check, Accounting's receipt, the inspections, complete), with the facility, lot, serials and location it names; without it, Accounting's receipt unchanged (AccountingReturns, the Accounting demo). Warehouse's receipt still needs the organization's `returnSettlementRequired` (RETURN_SETTLEMENT_OFF), as D11 has it; the demo leaves it off for Retail (F321) | (agent's call, for review) "Extend it with a parameter" over a second receipt service; a same-named wrapper would be a pass-through |
| Oct 31, 2026 | P14: a supplier return's stock goes out through `issue#SupplierReturnStock` (QUALITY_DISPOSE or STOCK_ISSUE; quarantined stock QUALITY_DISPOSE) over `issue#AnyAssetForShipmentItemSource`'s new `assetId`; stock an inspection holds goes only as far as its Return to supplier dispositions cover (RETURN_NOT_DISPOSED), and at the issue (when the stock leaves) their new `returnedQuantity` rises and the inspection's `heldQuantity` falls, so `get#SourceInspectionStatus` counts the returned quantity once (inspection-rejected, out of match-eligible). `ship#SupplierReturn` (SHIPMENT_SHIP) ships only a fully issued shipment (OUTSTANDING) and sets ReturnShipped on each fully issued item and then the header | (agent's call, for review) Design SupplierReturnShipment; P8's dispositions keep Return to supplier stock held until its process moves it |
| Oct 31, 2026 | P14: Purchasing's eligibility is per receipt: accepted (available and quarantined alike; a dock rejection is no stock) less the earlier supplier returns linked to that receipt (`ReturnItem.assetReceiptId`, not cancelled); the return, the receipt and its lot are locked in `add#ReceiptToReturn`, which needs PURCHASE_ORDER_EDIT or QUALITY_DISPOSE; on hand is answered apart (`issuableQuantity`). A supplier return of an order line with no receipt link (Purchasing's or Accounting's `add#OrderItemToReturn`) is not counted against a receipt | (agent's call, for review) design-purchasing PUR-RETURN |
| Oct 31, 2026 | P14: NewReturn is gated in BOSS by capability (a customer return needs receive, a supplier return qualityDispose, `check#Record` of the facility): Mantle's `create#Return`, `create#ReturnFromOrder`, `add#OrderItemToReturn` and `request#Return` check no permission and keep their callers (F323); `add#ReceiptToReturn` is new and checks its own. Warehouse offers Submit for authorization (`request#Return`) and Create return shipment for an approved return without one; authorization (RETURN_AUTHORIZE, seeded for ADMIN, no Warehouse group) and settlement stay with Customer Service and Accounting | (agent's call, for review) |
| Oct 31, 2026 | P14: `request#ReturnLabel` (SHIPMENT_SHIP or RETURN_AUTHORIZE) records the request as its CX-POSTING operation, ensures the return shipment's package and route segment, and calls the existing `CarrierServices.request#ShipmentLabels` when a shipping gateway applies (LABEL_REQUESTED), else answers LABEL_NOT_CONFIGURED; a label already bought answers LABEL_EXISTS. P13's provider-request records replace the carrier call | (agent's call, for review) The phase prompt's choice: the request and contract here, the gateway P13's |
| Oct 31, 2026 | P14: ReturnDetail's Warehouse branch and the return shipment branch of ShipmentDetail are boxes under the record header (P7's ReceiptDetail layout), not tabs; ShipmentDetail chooses the return branch by shipment type before the receipt and outbound ones, so a customer return's shipment opened from Receipts shows it too, and record links open Returns/ReturnReceipt and Returns/SupplierReturnShipment | (agent's call, for review) Crosscut §3.18's tabs are a layout; the boxes carry the same panes |
| Oct 31, 2026 | P8: the Inspections board groups by status or by inspector (`group-fields`); moving a card to another inspector assigns it (`assign#Inspection`), a move to another status goes back with the reason. Template header and applicability changes are audit-logged fields of the template (a published template's change needs a reason); only the characteristics are effective-dated rows | (agent's call, for review) Design §5 Inspections Views; the shared rule |
| Oct 31, 2026 | P15: a transfer's origin leg is `issue#TransferStock` (STOCK_ISSUE: named stock, else the stock the line's guarded picks took, issued to the line through `issue#Asset`) and `ship#Transfer` (SHIPMENT_SHIP or STOCK_ISSUE; `shipShort` lowers each line to what was sent). P11's `pick#ShipmentStock` takes a transfer line too: a transfer has no order and so no reservation (F335), so it picks the scanned asset's or location's available stock and moves it into the pick container when there is one. Pack (P12) is not part of a transfer | (agent's call, for review) Design §8 "the origin picks and ships"; P12's packing is for sales |
| Oct 31, 2026 | P15: the destination receives through its own entry point `receive#TransferStock` (STOCK_RECEIVE) on the receive guard's parts (Receiving.js `policyOf` and `destination`: the receipt step and the putaway resolver; Quality.js: quarantine and the inspection; `stamp`), not by widening `receive#ShipmentStock`, which stays purchase-only (RECEIPT_TYPE, P7 §4). Each receipt is a piece of one issuance still in transit, received with `receive#Asset` at that issuance's cost, owner, lot, serial and expiry and linked by `AssetReceipt.sourceAssetIssuanceId`; a line in transit is its issuances less their receipts (F37); the transfer is delivered when nothing is left in transit | (agent's call, for review) The plan's "the guard copies the source issuance's acquireCost and owner" |
| Oct 31, 2026 | P15: a transfer is between two facilities of one owner (OWNER_MISMATCH otherwise); moving stock between organizations is a sale and a purchase | (agent's call, for review) |
| Oct 31, 2026 | P15: a stock request is approved by `approve#InventoryRequest` under STOCK_POLICY_PLAN: each item an approved RqTpInventory Requirement of the request's facility linked by RequirementRequestItem, and the request ReqInProgress (Request has no approved status, and crosscut §3.11 says Reviewed is not approval, F339). Allocation needs the request in progress and stays within the approved quantity; each allocation is an InventoryRequestAllocation (a transfer line or a move). Submit, Complete and Cancel are Mantle's status flow after the request's own read allows the move | (agent's call, for review) Design §8 RequestDetail "approve under stock authority" |
| Oct 31, 2026 | P15 review (B3): the stock request check (a RqtInventory request names a facility of the user's organizations, whose owner becomes its OrgInternal party) is a new refusal for existing callers (Commons' quick create and Requests offer every request type), so it sits behind the operation policy's `inventoryRequestCheck` (off by default, on for ORG_ZIZI_RETAIL in BOSS's demo) and applies to `create#Request` and to `update#Request` making a request a stock request or moving one to another facility. The policy is the facility's when it is in the user's scope, else any of the user's organizations' (`resolve#WarehousePolicy` refuses another organization's) | The reviewer's call; replaces P15's "no flag" row. §2 "Mantle rule changes keep Mantle's default"; F344 |
| Oct 31, 2026 | P15: a subcontract dispatch is always a ShpTpTransfer shipment carrying the production work and the service order item (`Shipment.subcontractWorkEffortId`, `subcontractOrderId`, `subcontractOrderItemSeqId`, checked against OrderItemWorkEffort and the custodian); with no in-transit step its lines go by `dispatch#SubcontractStock` (`move#Asset`, posts nothing; each move the stored answer of its operation), the shipment shipped and delivered once every line went that way; unused components return on a subcontract transfer from the vendor facility, by the same entry points | (agent's call, for review) Design §8 SubcontractShipmentDetail |
| Oct 31, 2026 | P13: each request to a shipping gateway is a `mantle.shipment.carrier.ShippingGatewayRequest` committed before the call (`record#ShippingGatewayRequests` holds the shipment's lock and makes every check); the entry points run with `transaction="ignore"` and each package's gateway call in a transaction of its own, so nothing rolls back after a gateway answered; a coded refusal is Failed, anything else Unknown, and the next request asks the gateway (`find#ShippingLabels`, a new interface with `ShippingGatewayConfig.findLabelServiceName`) before buying; the request id goes to the gateway as `requestReference`; the CX-POSTING operation is stored only when every package has an answer | (agent's call, for review) The phase prompt's ask-before-retry; Accounting's `settle#Return` gateway refunds are the pattern |
| Oct 31, 2026 | P13: the local-rules provider is an adapter that calls Mantle's `get#OrderShippingRateLocal` with the shipment's order part and packages (no copy of its logic); a shipment with no order part has no local rate (NO_ORDER, named) | (agent's call, for review) Mantle's local rule rates zero today (F295) |
| Oct 31, 2026 | P13: carrier methods and which gateway serves a carrier take a new permission, `SHIPPING_CARRIER_EDIT` (the shipping manager and the Warehouse admin), not FACILITY_EDIT: they are shared by every organization; the printer bindings take FACILITY_EDIT as planned | (agent's call, for review) Design §12 Carriers; P12's shared box types (F289) |
| Oct 31, 2026 | P13: FacilityPrinter's `fromDate` and `thruDate` are not in its key (facility and purpose): one binding per purpose and facility, changed in place and ended by `thruDate` | (agent's call, for review) Changing the key of an existing table needs a migration (F298) |
| Oct 31, 2026 | P13: InvoiceDetail is mounted at `Warehouse/Orders/InvoiceDetail` beside OrderDetail (design: `Warehouse/Records/InvoiceDetail`), so no new root area is added; rates and label charges show to shippers (operational quotes, RateOptions' rate column), while invoice totals, payments and line amounts need financial read | (agent's call, for review) |
| Oct 31, 2026 | P13: the test carrier and its config (`TEST_SHIPPING`, `TEST_CARRIER`, TestCarrierLabel) are install data in Mantle beside Accounting's test payment gateways, marked `testMode`; its reserved postal codes are 99901 (timeout after issuing), 99902 (refused) and 99903 (invalid address); its label PDF is built by hand from the framework's Code 128 so it needs no Chromium | (agent's call, for review) §4's test carrier decision |
| Oct 31, 2026 | P13: Ship ships only sales-type outgoing shipments; a transfer ships by `ship#Transfer` and a supplier return by `ship#SupplierReturn` (SHIPPED_ELSEWHERE); dispatch's "tracking totals" are a tracking code on every package (none for a customer pick-up) and packages holding exactly the issued quantities | (agent's call, for review) Design Ship "Dispatch requires tracking totals" |
| Oct 31, 2026 | P13 review A2: a shipping gateway in test mode buys labels only for an organization whose party setting `ShippingTestGatewayAllowed` is Y (PartySettingType in ShippingSetupData, default N; the BOSS demo sets it for ORG_ZIZI_RETAIL, the Mantle spec for its organization); a label request refuses a gateway that does not serve the segment's carrier (ShippingGatewayCarrier or the store's binding; GATEWAY_NOT_FOR_CARRIER). Install data keeps only the TEST_SHIPPING config; the TEST_CARRIER party, its methods and its binding are demo data (TestCarrierDemoData.xml), which specs and demos load | (agent's call, for review) The review's A2 |
| Oct 31, 2026 | P13 review: carrier methods and gateway bindings are the Warehouse administrator's (SHIPPING_CARRIER_EDIT only for BOSS_WAREHOUSE_ADMIN and ADMIN); a label is refunded only before the shipment ships; a request to a gateway that cannot be asked after a timeout is sent again only by a person (`sendAgain`, Ship's Send again) | (agent's call, for review) The review's B1, B6, B7; supersedes the P13 row's shipping manager grant |
| Oct 31, 2026 | P15: the Transfers area keeps Move as its default tab, with Transfers first in the menu; NewTransfer (quick create) is the move group's (BOSS_WH_NEW_TRANSFER), NewStockRequest every Warehouse user's; Accounting P19's readiness already blocks without `transferGlAccountId` (AccountingActivation.js WIP_TRANSFER, F21), so nothing was added there | (agent's call, for review) |
| Oct 31, 2026 | P16a: a run line's operation is the routing operation at create (`routingOperationWorkEffortId`) and the run's operation child from release (`operationWorkEffortId`); the output line sits on the last operation; a run's routings are its BOM's (or the one given) after its phantoms', each operation child a `WetTask` in WeApproved with no purpose, its routing operation, `operationSequenceNum` and `workCenterFacilityId` audit-logged. The revision counts 1 at create, then up at release and at a re-explosion; a method released again since the method date refuses release (METHOD_CHANGED); `reexplode` rewrites the draft as of now and answers it for review (REEXPLODED, still WeInPlanning, the next revision), and a release with that `expectedRevision` follows (P16 review B7). The methods checked and the routings the operations come from are those the run was read from (`productionMethodRefs`, P16 review B3) | (agent's call, for review) Design WorkOrderDetail's "returns a finding and offers a re-explosion" |
| Oct 31, 2026 | P16a: create with no released BOM is refused (METHOD_REQUIRED); manual lines are Manufacturing P5b's `store#ProductionMaterial`. The unrelease guard and its transition are not built: the WeApproved→WeInPlanning transition comes with Manufacturing P5a's `transition#ProductionOrder` (P16 review B4, F366) | (agent's call, for review) The plan's P16a bullet named the seed |
| Oct 31, 2026 | P16b: the four guards check STOCK_ISSUE (the plan's words, receive#ProductionOutput too); over-issue of a line (QUANTITY_EXCEEDS_REMAINING) and over-receipt of an output line (OVER_RECEIPT) are refused until Manufacturing's scrap-allowance and overproduction policy; with no approved standard the output's cost is the run's net WIP (issued less returned less output already received) over the quantity, provisional (`AssetReceipt.costProvisional`) | (agent's call, for review) §5 asks about the policy |
| Oct 31, 2026 | P16b: return#UnusedMaterial with no location returns into the original asset (receive#Asset with its assetId, no WeptProduce row added); with a location, a new asset there at the original cost, lot, owner and serial. Quantity returnable per issuance is its quantity less the receipts made from it (`sourceAssetIssuanceId`) | (agent's call, for review) Design MaterialIssueReceipt names both |
| Oct 31, 2026 | P16b: receive#SubcontractOutput is keyed by the subcontract dispatch (P15's Shipment.subcontract* keys and its vendor-custody destination): it backflushes the material lines of the dispatch's operation (all the run's when the dispatch names the run) at the output's share, or takes reviewed actuals (`materialQuantities`), from the run owner's available stock at the vendor facility oldest first (MATERIAL_SHORT), through issue#ProductionMaterial and receive#ProductionOutput under sub-keys of its operation key, then writes the ServiceAcceptance (output quantity unless `acceptedQuantity`) with the output receipt and its inspection, under its own STOCK_ISSUE check | (agent's call, for review) The accrual cost event is Manufacturing P14's |
| Oct 31, 2026 | P16b: Purchasing's `accept#ServiceItem` checks PURCHASE_ORDER_EDIT or STOCK_RECEIVE, a buying organization of the user's, a service (or non-product) line, at most the ordered quantity net of cancelled (QUANTITY_EXCEEDS_ORDERED); its logic is `service/mantle/order/ServiceAcceptance.js`, which receive#SubcontractOutput calls in its own operation | (agent's call, for review) |
| Oct 31, 2026 | P16: MaterialIssueReceipt's production source reads Mantle's get#ProductionOrder (PRODUCTION_VIEW or STOCK_ISSUE), so a Warehouse user without issue sees "not available" for a run; a run is a Warehouse record kind (`run`, by its facility) whose link opens MaterialIssueReceipt; the screen takes its column words and its line action's field (package or asset) from the source | (agent's call, for review) |
| Oct 31, 2026 | P16 review A1: with no approved standard a part of the output takes net WIP × its quantity ÷ the output line's quantity left to receive (rounded down), the last receipt the rest, so WIP nets to zero. A material return after a provisional receipt lowers the WIP the rest of the output takes and answers PROVISIONAL_TRUE_UP naming the earlier provisional receipts (they stay `costProvisional` for the cost close's true-up); once all the output was received provisionally a return is refused (PROVISIONAL_CLOSED) | (agent's call, for review) The alternative was refusing every return after a provisional receipt |
| Oct 31, 2026 | P16 review B1: a by-product is not received here (BYPRODUCT_NOT_COSTED) until Accounting's co-product allocation exists (design ByProducts, D12); MaterialIssueReceipt offers no Receive for it | (agent's call, for review) The alternative was an explicit cost with ACCOUNTING_VIEW |
| Oct 31, 2026 | P16 review B5: receive#SubcontractOutput accepts the service line's quantity in the output's proportion (ordered net of cancelled × output received ÷ the output line's planned quantity; all that is left with the last of the output), at most what is left to accept, or the `acceptedQuantity` given (SubcontractShipmentDetail's Service accepted field); `accept#ServiceItem` refuses a unit other than the order item's (UNIT_MISMATCH) and an acceptor who is neither the user nor a party related to the buying organization (ACCEPTOR_INVALID) | (agent's call, for review) |
| Oct 31, 2026 | P17: `get#InventoryAtDate` reads an asset's facility, location, lot and owner at a time from its audit log (Asset's `enable-audit-log="update"` fields: the value the first later change replaced, else the current one), so a whole asset moved or relabelled moves its stock between rows; the assets read are those holding stock now or with a ledger row since the opening day whose place matches now or matched before. The opening day defaults to the first of the cut-off's month; days are calendar days in the user's zone; a facility's history starts at its first ledger row (the asset's current facility), and a quantity before it is unknown (null, "Unknown"), never zero. Up to 2000 assets and 5000 history rows, else truncated. A product with no stock unit counts in each (OTH_ea) | (agent's call, for review) F119, F376. A facility go-live date would be a better start than the first ledger row (§5) |
| Oct 31, 2026 | P17: OperationsHistory is Mantle's `InventoryReportServices.find#OperationsHistory` (OperationsHistory.js): one row per shipment and product (receipts, sales shipments, returns, transfers; drop shipments left out) with the document's whole quantities, the period selecting documents by a receipt or issue in it (movement, the default) or by their expected date (document); totals per unit over every row, never across units; up to 1000 documents | (agent's call, for review) The design's "entity" read is a Mantle service so the unit rule is tested there; the drill to movements is `find#Movements`' new `shipmentId` |
| Oct 31, 2026 | P17: InventoryValuation's Warehouse branch values the selected facility's owner (else the chosen organization, the active one, or the only one; a choice when the user has several, the New pool pattern), runs Mantle's `run#InventoryValuation` only for a user with financial read (Mantle refuses others) and shows Accounting's results section (`AccountingInventory.xml` `InventoryValuationResults`, split out of Accounting's section); without financial read it says values need it and links the quantity reports. Revaluation, cost repair and journal entry links stay in Accounting's context | (agent's call, for review) crosscut §3.25 |
| Oct 31, 2026 | P17: Home's Your work is the Today source's items (`Today.js` `workRows`: step, due day, Overdue), so a phase that adds a Today source adds to Your work; each queue is a number card linking its list; the KPI strip is counts (products in stock, stock lines on hold and quarantined) of the selected facility, never quantities across units, and valuation is in Reports | (agent's call, for review) design §3 |
| Oct 31, 2026 | P18: the access walk is a server spec, `test/Warehouse/WarehouseAccessWalk.spec.js`, on AccountingAccessWalk's pattern (the browser adds no access path: the menus are server-derived and every read and write checks in its service); its own organization with no ProductStore (BOSS_P18_ORG, one facility) and spec users in the Warehouse root group and one capability group each run receive to ship, and its records carry "P18 secret" for the refusal checks both ways (agent's call, for review) | It does not change Retail's demo users; the P18 organization's users are the spec's own |
| Oct 31, 2026 | P18: Home's count quick create is `Warehouse/NewCount`, under the root and not in Counts: the Counts area's AUTHZT_ALWAYS grants to the count reviewer and adjust groups outrank the deny of NewCount's own artifact group (BOSS_WH_NEW_COUNT, the count and admin groups), so under Counts the shell offered it to them; the form is Counts' New count, one section (agent's call, for review) | createCount answers `//Warehouse/Counts/CountDetail` for both |
| Oct 31, 2026 | P18: a widget shown on a condition is a `section` with the condition (F375), never a `condition` on container-box, container, form-list or display, which the XSD does not have and the server-static template, html and tui renderers ignore | The F375 sites fixed (F398) |
| Oct 31, 2026 | P18: the Warehouse screens the server-static full check finds clean are marked `server-static="qvt"`, except those with a form field `hide` (Movements, Traceability), whose static template keeps the hidden column's header (F396) | 12 marked (with NewCount), Accounting's pattern |
| Nov 11, 2026 | Owner contract built by impl-maintenance P2's review (R8, the user's call): a facility with no owner of its own (a room loaded without one) is its nearest owning ancestor's in Mantle's facility checks: FacilityScope.js `facilityOrganization` and `ownsFacility`, used by FacilitySetup.js's `facilityOf` (the facility, location and room-feature saves). store#Facility keeps such a facility ownerless when no owner is given, and naming the organization it already takes from its ancestor needs no reason; a new facility still names its owner. Owned facilities are unchanged (WarehouseFacilities' existing features; its new ownerless-room feature). The stock guards (StockPosting, Putaway, InventoryCounts, Printing, ShipmentLoads) still read the facility's own owner, since their postings name it as the organization, so stock at an ownerless facility stays refused there. |
| Nov 12, 2026 | Owner contract built by impl-maintenance P3 (F13): Warehouse's equipment read (Facilities.js) shows "In maintenance" for an AssetMaintenance in process, not any open one, so a planned maintenance work order shows no warning; WarehouseFacilities passes unchanged |
| Nov 12, 2026 | Owner contract built by impl-maintenance P5: Warehouse's equipment read (Facilities.js) shows "Out of service" for equipment with an open outage in force (ResourceUnavailability, which Manufacturing's equipment-fault stop or Maintenance records and only Maintenance's restoration ends), before an assignment or "In maintenance"; WarehouseFacilities passes unchanged |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |
| Blind counting is enforced on the count screens only: the Inventory area (Assets, AssetDetail, Availability) and Home's and Handheld Home's scans show on-hand to every Warehouse user, counters included. Should a user of BOSS_WAREHOUSE_COUNT alone see stock quantities elsewhere in Warehouse? | P10, P18 | P10 review A1. The count screens' scan (`resolve#CountScan`) names no quantity; Inventory's access is unchanged until decided. P18: left open for the user (a product decision); the count screens' rule stands |
| A skip-locked find for scripts (the entity facade's `skip_locked`), so `adjust#ExpectedReceipt` can answer ReceiptInProgress at once instead of waiting for the receive (F175) | mr-moqui, P7 | A framework change; today the revision waits and then applies to what was received |
| Whether a subscreen's `<condition>` should leave it out of the menu data, and `disable-when` see the parent's always-actions (F178) | mr-moqui | Supplier360's prices tab shows, empty, in Warehouse |
| A customer return received on hold (ReturnSettlement.js, AstOnHold, often with no location): is it released by putting it away, by an inspection, or by the return's own decision | P14 | Decided Oct 31 (P14, §4): by its inspection's disposition |
| An organization that does not settle returns separately (D11 off) has no Warehouse way to receive a customer return: Mantle receives it when the return shipment is delivered (ShipmentDeliveredReturnReceive), with no quarantine or inspection. Should Warehouse receive such returns through the guard too (and Mantle skip its delivery receipt), or should D11 be required for Warehouse returns? | P14, Accounting | P14 review B2: ReturnReceipt says why there is no Receive (F326) |
| Accounting's `settle#Return` may credit what was received before its inspection is disposed (F319): should settlement wait for the disposition (design §11 "settlement happens only after inspection and disposition")? | Accounting | P14 review C; receipt settles nothing, but nothing stops an early settle |
| Which app edits a product's storage type (`Product.storageTypeEnumId`, P9): Products' product detail (Product is its master) or Warehouse's Product360 | Products, P18 | Until then it is set by data or import; a location's is on FacilityDetail (F215). P18: left open (Products owns Product; no Warehouse edit built) |
| Whether a putaway rule should be able to exclude a product's default location (a rule that sends stock elsewhere first), or the default always come first as built | P9 review | §4 P9 row; Odoo applies its rules over the product's default, ERPNext has no default |
| Inspector and verifier separation is organization policy (crosscut §3.19): P8 always refuses self-verification. Should a small organization be able to allow it (a flag on the operation policy)? | P8, Purchasing | SELF_VERIFY today |
| "An unavailable mandatory template blocks release, not receipt into quarantine" (crosscut §3.19): what makes a template mandatory for an inspection (the tracking policy's `inspectionRequired` with no published template)? | P8, Manufacturing | Not built: an inspection with no template is submitted on its result alone, and released |
| A package reopened after Complete pack releases the whole shipment's lines from its in-process invoice (F275). Should the release take only the reopened package's lines (a partial release), so the rest of the invoice stays as made? | P12, Accounting | Today the next Complete pack bills the shipment again in full |
| Should ShipmentBoxType get an owner (organization) so each organization keeps its own box types? | P12, Products | Shared today; FACILITY_EDIT of any organization edits them. P18's access walk reads them as shared (another organization's label sheet of box types names Retail's) |
| QueueFilters' owner: the stock owner (`Asset.ownerPartyId`, which may differ from the facility owner where `assetAllowOtherOwner` is set) or the facility owner | Home, P4 | P1 left the filter out; with owner pools (P3) the stock owner is the likelier meaning |
| A transfer's remainder lost in transit (shipped, never received), and its rejected units: cancel or write them off with a reason and a posting from the transfer account | P17, Accounting | The issue posts the full quantity at cost to `transferGlAccountId` and a receipt credits it for the accepted quantity only, so a rejected unit's value stays at the transfer account (WarehouseTransfers pins it; TransferShipmentDetail shows the account's value with financial read, F346); nothing writes off what never arrives |
| Packages, carriers and labels for a transfer (crosscut §3.8 transfer row has Origin pick/ship only) | P12, P13 | P15 ships a transfer without packages; P13's label path takes any outgoing shipment with packages, but Ship refuses a transfer (SHIPPED_ELSEWHERE) |
| A real carrier gateway that cannot be asked what it did (no `find#ShippingLabels`) leaves a timed-out label request to be sent again with the same `requestReference`: is that enough, or should such a request wait for a person to check with the carrier? | P13, P18 | The test carrier keeps references, so it never buys twice. P18: left open until a real gateway adapter is added (§7) |
| Should shipping rates and label charges be restricted values (financial read), or stay operational quotes the shipper sees? | P13, Accounting | Shown today (§4 P13 row) |
| Over-issue of a production line beyond its required quantity, and output beyond the run's target: refused today (QUANTITY_EXCEEDS_REMAINING, OVER_RECEIPT); which policy (ProductionPolicy's scrap allowance, overproduction approval) admits them | Manufacturing P4, P7 | §4 P16b row |
| Should receive#SubcontractOutput complete the subcontract operation, or update the service order item's status, once the output is all received and accepted? | Manufacturing P14, Purchasing | Nothing changes status today; OrderItemWorkEffortCheckComplete waits for the operation |
| Should a facility carry a stock history start (its go-live or migration cut-over) for StockAtDate, instead of its first ledger row? A migration that loads stock as receipts dated at the cut-over gives the same answer; one that loads it with no ledger does not | P17, P18 | Today history before a facility's first AssetDetail row is incomplete (Unknown). P18: left open (a data-model change for Mantle; StockAtDate flags the gap) |
| Home's count quick create (design §3: receipt, transfer, count and stock request): Counts' New count form as a quick-create screen under its own artifact group for STOCK_COUNT, as NewTransfer is | P18 | Decided Oct 31 (P18, §4): built as `Warehouse/NewCount` for the count group |

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
| F37 | P0, Oct 31: F10 holds (Mantle `test/product/WarehouseStockChecks.spec.js`). On a transfer with two issuances and two receipts of a product, ShipmentItemDetail reads 6 accepted for 3 and 12 issued for 6, and `receive#EntireShipment` then receives nothing and delivers the transfer 3 short. Before any receipt it receives the ShipmentItem quantity, not what was issued. Purchase and return shipments have no issuances, so only shipments with both are affected | P15 sums issuances and receipts apart and receives through the receive guard; neither the view nor `receive#EntireShipment` is used for a transfer, and P7 keeps "Receive all as expected" to receipts without issuances. Written into design §15.2 and Transfers. The spec is kept for P7 and P15 |
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
| F150 | P5b: `mantle.product.AssetServices.move#Asset` declares no out-parameters, and a service with none answers nothing to a caller (not its whole context): the asset a partial move made or merged into is not returned | P5b review: `move#Asset` declares `newAssetId` (compatible: it answered nothing before), set on both paths; the guard's newest-detail lookup is gone |
| F151 | P5b: `move#Asset` takes the destination location type's `autoStatusId` only when the facility maps one: a quarantined asset moved to a location type with none (bulk) stays AstQuarantine, and one moved whole to a pick bin becomes AstAvailable through a valid StatusFlowTransition | The held-stock rule refuses only a status change (`keepHeld`): quarantined stock moves to bulk or another quarantine location and is refused a pick bin (`HELD_STOCK`); the attach and detach refuse any status change (`STATUS_CHANGE`) |
| F152 | P5b: `PostingOperation.operationKey` is the record's one 40-character primary key across users and operations, and `EntityLib.operation` refuses another user's key as a conflict, so a client-chosen scan id would collide across users | (agent's call, for review) The guard stores `"WH"` and 38 characters of the hash of user, operation type and the client's key (at most 200 characters), so the lookup is scoped per user and operation (F143); the client's key is in the stored answer |
| F153 | P5b: a script cannot read the info and warning messages of `ec.message` (only errors), and `reserve#AssetForOrderItem` declared no out-parameters, so the expiry gate's shortfall had no answer a caller or spec could read | `reserve#AssetForOrderItem` declares `expiredShortfall` and `expiredSkipped` (it answered nothing before, so no caller changes) besides the `EXPIRED_SHORTFALL` warning the user sees |
| F154 | P5b: a refusal thrown in a Mantle script (`denied`) inside a screen transition answers 500 with the error as the notification (as P2's close refusal), not the transition's error-response | Kept as the other Warehouse transitions do; WarehouseMovesWalk allows the refusal's 500 like WarehouseFacilitiesWalk |
| F415 | P5b: the tracking policy's `expiryBlock` ("Block expired stock", Products P7) had no Mantle reader | It is the expiry gate's flag (§4): `get#ExpiryGate` reads it cached, layered as `resolve#WarehousePolicy` does, a narrower row never lifting a wider block |
| F416 | P5b: Availability's Locations and lots rows are buckets of `AssetQuantitySummary` (facility, location, lot, status), with no asset ids for Relocate | Each row carries its bucket's asset ids (`get#ProductStock` locations, at most 2,000 assets), and Relocate posts them comma-separated |
| F417 | P5b: the Warehouse groups have no artifact authorization for `mantle.shipment.WarehouseTaskServices` (F3), so the entry points are reached only through a Warehouse screen's transition, whose authorization the call inherits | Kept: WarehouseAccess checks a direct call is not authorized, and with authorization disabled that the entry points refuse another organization's stock and a user without the permission |
| F418 | P5b review (B6): a refused Warehouse transition answered the JSON client with 500, whether the refusal was thrown (`denied`) or `<return error>`: both reach the transition as message errors and take its error-response, which for a JSON request (the m-form's `Accept: application/json`) is `send_json_redirect` (mr-moqui `crates/moqui-core/src/screen/render.rs` ~2185), sent through `web::send_json_response`, which sends any JSON answer with errors as status 500 (`crates/moqui-core/src/web/mod.rs` 927-941). The screen test renders the same refusal as a 302 | For the framework (not edited here): `send_json_redirect` sends the transition's error-response with a client status (400, or 422 for a refusal) rather than 500, e.g. a status argument to `send_json_response` used by that one caller; m-form already notifies the errors from the JSON. Until then the walk allows that refusal's 500, documented in WarehouseImplementation.md "Refusals" |
| F419 | P5b review (A1): `move#Asset` checks a StatusFlowTransition only on a whole move; a partial move sets the new asset to the location type's status unchecked, so part of morgue (AstMorgue, flow only to AstIncoming) or defective stock moved to a pick bin became AstAvailable while the whole move was refused | `keepHeld` refuses any status change with no StatusFlowTransition from the current to the new status (`HELD_STOCK`), besides the quarantine rule; a receiving hold still puts away (AstOnHold to AstAvailable). Spec: a partial move out of the morgue is refused |
| F420 | P5b review (B1): a concurrent double submit of one operation passed `begin` in both sessions; the second, after waiting on the lock, failed on what the first changed (SAME_LOCATION) or on the duplicate operation key, not `alreadyApplied` | A guard step `settled(op)` after the locks reads the key again (with the stored row's type, user and request compared, C2) and answers the first result |
| F421 | P5b review (B2): `move#Container` locked container, location, contents and `move#Stock` asset, container, location, so a container move and a move into that container could deadlock | One order everywhere: containers (moved or target), then assets by id, then the location; `move#Stock` locks a target container before the asset, `move#Container` its contents before the location |
| F422 | P5b review (B3): the issue services called `check#AssetExpiryGate`, which read the asset and lot uncached on every issuance even with the gate off | `check#AssetExpiryGate` takes the asset the caller holds, reads the cached facility and `get#ExpiryGate`, and returns when the policy does not block; `issue#Asset` checks a named asset only with the gate on |
| F423 | P5b review (B4): reservation read the order vendor's expiry policy, issue and moves the facility owner's | Reservation reads the inventory facility owner's (else the vendor's); §4's row revised |
| F424 | P5b review (B5): with the gate on, `issue#Asset` refused expired stock on a purchase-return shipment, though returns are to work | The gate is off for a ShpTpPurchaseReturn shipment; WarehouseExpiry specs it |
| F425 | P5b review (B7): `move#Stock` into a container skipped the one-owner check `attach#AssetToContainer` made | `destination` refuses a target container holding another owner's stock (`CONTAINER_OWNER`) for both; WarehouseMoves specs it |
| F426 | P5b review (C3–C7): a relocation's batch request was not fingerprinted; the repair's wording claimed only previewed reservations move; Availability's capped rows posted nothing silently; Mantle descriptions named BOSS screens; Take out's message named the page's container | `relocate#Assets` is an operation of its own (StockRelocate: the sorted assets and destination; a retry answers the first results, a changed request is refused); the repair's description says the product's not-available reservations move, the previewed ones among them; `relocateAssets` warns of rows with no assets; the descriptions name no screen; the message uses the answer's container |
| F95 | P3: Mantle's reservation read the reservation order and automatic timing only from the order part and its ProductStore, so an order without a store was always FIFO by received date and reserved at placement, whatever its facility | `get#ReservationDefault` supplies the facility (else organization) default where both are unset (§4); Mantle's specs are unchanged (no row) and WarehouseOperationPolicy checks LIFO at a policy facility beside FIFO at a facility with none |
| F96 | P3: `checkReserve#AssetForOrderItem` read `productStore?.reservationAutoEnumId` without ever setting `productStore`, so a store's automatic timing was ignored when an unreserved item changed | It now reads the order's store before the facility default; no Mantle or BOSS data sets the store field, so the flow specs are unchanged |
| F97 | P3: AssetPool, AssetPoolParty and AssetPoolStore had no dates, and mr-marble edits them raw (F36) | Members gain dates honored by `get#AssetPools`; the writes go through `mantle.product.AssetPoolServices` (§4) |
| F98 | P3: the framework's `enable-audit-log="update"` does not log a field's first non-null value (`moqui-entity` `field_rw.rs`), so a store's first reservation setting would leave no audit row | The ProductStore reservation fields use `enable-audit-log="true"` |
| F99 | P3: Mantle has no partial-allocation choice (reservation always reserves what it can and records the rest as not available), and require-inventory is read only from the store, at placement and at item changes (`OrderServices`) | The facility default holds order and timing only (§4); partial allocation and a storeless require-stock are left to the order phases if wanted |
| F100 | P3: P2's `FacilityLocation.thruDate` is not on wh/p3, so a default location is checked for its facility and type only | At merge, `validators.operation` in `WarehousePolicy.js` should also refuse a closed location (thruDate at or before now), as P2's guards do |
| F101 | P3: the operation policy's steps, tolerances, short-quantity choice, blind counts and auto-print have no Mantle reader yet | Their readers are P7 (receipt steps, over-receipt, short receipts), P9 (putaway after receiving), P10 (blind counts), P11–P13 (delivery steps, over-shipment, backorder, auto-print), each through `resolve#WarehousePolicy`'s `operationPolicy`, applied at posting |
| F102 | P3: ClientWrites fails on wh/p3 for P1's `AccessServices.select#Facility`, since master's BossSetupData added `warehouse` to the client deny pattern after this branch was cut (5f25c36) | No P3 change: the P3 ironstone services are all `get#` reads; the merge brings master's pattern |
| F103 | P3 review: `get#ReservationDefault` ran an uncached query on every reservation. (The review also named `get#AssetPools`' `date-filter` on its cached finds; checked: XmlActions.js `findCondition` leaves a date-filter out of a cached find's query and filters the cached list with `filterByDate`, so its cache key holds no time) | `get#ReservationDefault` is a cached find on organization, type and product, the date and facility applied to the cached list; `get#AssetPools` unchanged |
| F104 | P3 review: with a store and no facility, `get#PolicyContext` passed the active organization, so Mantle did not take the store's inventory facility, and a store of the user's other organization was refused or misread | The organization follows from the store, checked against all the user's organizations (STORE_UNAVAILABLE); WarehousePolicies checks a store with its timing unset takes the facility default, named as source |
| F105 | P3 review: the facility default's automatic timing and F96 had no spec of their condition and unchanged default (§2) | WarehouseOperationPolicy: AsResAutoApproved at a facility holds a placed storeless order (and Mantle's placement reservation at a facility without one); a store's AsResAutoNone is honored by `checkReserve#AssetForOrderItem` and a storeless order still reserves |
| F106 | P3 review: the three reservation services passed different facility and organization fallbacks to `get#ReservationDefault` | All pass `orderPart.facilityId` else the store's inventory facility, and the vendor else the store's organization |
| F107 | P3 review: a dated change copied the values of the row in effect now, so a change starting after a scheduled row dropped that row's values | It copies the row in effect at its own start; WarehouseOperationPolicy checks it |
| F108 | P3 review: a pool could take a store of another of the user's organizations | `store#AssetPoolStore` requires the store's organization to be the pool's owner |
| F109 | P3 review: re-saving a member in effect without an end cleared its scheduled end | An empty end keeps it; `clearThruDate` reopens it; the edit form shows the end. Re-adding an ended member reuses its row (§4) |
| F110 | P3 review: the pool party choice lists customers, vendors and suppliers of every organization, not only parties related to the user's | Left as is: Mantle's customers and vendors are shared and often carry no owner or relationship; private contacts are excluded, and membership grants only consumption of the pool's stock, no read of the party |
| F111 | P3 review: the build record's wiring note named a `subscreens-item`; P2's FacilityDetail discovers its tabs from the `FacilityDetail/` directory | Corrected in the build record: Policies.xml (default-menu-index 7) drops in with no wiring |
| F112 | P3 review (B4), after P2's merge: the first-location-of-type default could name a closed location, a closed location could be newly named, and a location named by an operation policy could close | `layered()` skips closed locations; `validators.operation` calls P2's `check#FacilityLocationOpen` (closed location or facility) for a location newly named or changed, not for one carried over from the row before, so an unrelated change is not refused; `resolve#WarehousePolicy` warns (LOCATION_CLOSED) of a named location closed since; P2's `blockersOf` (`FacilitySetup.js`) adds `operationPolicy`: a current or future operation row naming the location blocks its close |
| F113 | P3, merge of P2: P2 made `WarehousePolicy.js`'s guard use `FacilityScope.js` (`scope()`, `owns()`; FACILITY_ALL_ORGANIZATIONS for the admin group; F58's active-organization rule) | The guard keeps P3's store fallback on P2's helper (`memberPartyIds` for the default organization); `AssetPools.js` reads the same scope, so the admin group reaches every organization's pools |
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
| F235 | P10: PhysicalInventory has no mark of a counted document: Mantle's immediate postings (`record#PhysicalInventoryChange` creates one PIComplete), P6's scrap records and a count all share it | A count of InventoryCountServices has a `countModeEnumId`; every Mantle count read, list and due find requires one, so scrap (`scrapIndicator`) and immediate postings never show among counts; P6 keeps scrap out of `Warehouse.js` `recordOf` (agent's call, for review) |
| F236 | P10: `post#PhysicalInventoryVariance` takes the transaction date from `PhysicalInventory.physicalInventoryDate` before the AssetDetail's date; `update#PhysicalInventoryDate` reposts every line of the record | `post#Count` sets the count's date to the effective date (its own transaction) before any line posts; a count is never redated afterwards |
| F237 | P10: `change#AssetQuantity` answers nothing (no AssetDetail id), and `move#Asset` of a whole asset writes no AssetDetail | `post#CountLines` reads the asset's AssetDetail of the count after posting (one per asset per count); review and posting compare the asset's location and container with the line as well as its movements, so a whole move during counting is a conflict |
| F238 | P10: an entity-auto `update#` with a changed `statusId` requires a `StatusFlowTransition`, and the four PhysicalInventory statuses had none (F4) | `data/InventoryCountData.xml` seeds the count's flow (planning, progress, validation, complete; recount back to progress) with a new PICancelled, and the line statuses' flow (PicOpen to PicPosted) |
| F239 | P10: P2's location close blocker named any count "not PIComplete" (F78) | An open count is neither PIComplete nor PICancelled (`FacilitySetup.js` `blockersOf`) |
| F240 | P10: `post#AcctgTrans` sends a closed-period posting to the error journal rather than refusing it (P6's F155), so a count posted into a closed period would change stock with its GL entry parked | After merging P6: each bucket of `post#Count` calls StockPosting.js's `posting.period` for the facility's and the asset's owner in its own transaction, after locking the asset (the guard's lock order), so a closed period fails the bucket with `PERIOD_CLOSED` and nothing posts; WarehouseCounts (BOSS) posts into ORG_ZIZI_RETAIL's closed June 2024, then now |
| F241 | P10: `ProductFacility.abcClassEnumId`, the AbcClass enumeration and its write through `store#ProductFacilityPolicy` were built by Products P7 | Nothing to add; the count schedule reads them |
| F242 | P10: a count's record link opened `Counts/CountDetail` for every Warehouse user, but the Counts area is denied to those outside the count, count review and adjust groups (P1) | `recordUrl` gives such a user Home's lookup of the count (`countAreaOpen`); WarehouseAccess checks both |
| F243 | P10: the spec party prefix WHC_ was WarehouseStockChecks' | The counts spec uses WCN_ |
| F244 | P10: in an XML service's `<script>`, `ec.context.put` is not a function in the script engine | Out-parameters set one by one |
| F245 | P10 review (A1): HandheldCount's scan used `resolve#Scan`, whose asset detail is "On hand N", so a blind counter saw the expected quantity on a scan | The count screens' scan is `CountServices.resolve#CountScan`: an asset's serial or lot and location only; whether counters see stock elsewhere is an open question (§5) |
| F246 | P10 review (A2): the period check ran only per bucket, on the effective date as an ISO string (PostingGuard's `fiscal` takes a string's day as written, the UTC day), after the count was redated | `post#Count` refuses a closed period first, with the Timestamp, before anything is written; each bucket checks again under the period lock; a later attempt under another key keeps the count's date (DATE_FIXED for another; F236) |
| F247 | P10 review (A3): `record#CountLine`, the grid and `resolve#CountConflict` took a client's line id while BOSS checked only the count id, and `lineOf` checked only the organization | `physicalInventoryId` is required and `lineOf` refuses a line of another count (RECORD_UNAVAILABLE); the transitions pass it |
| F248 | P10 review (B1, B2): carrying the variance of an asset moved whole looped (the post refused it as moved, and it went back to conflict); move detection read AssetDetail dates only, missing a backdated posting | Carry refuses a moved asset (MOVED_RECOUNT: count it again); review and post also compare the asset's quantity with its snapshot plus the movements seen (a backdated change is a conflict, STOCK_MOVED at post) |
| F249 | P10 review (B3): `post#CountLines` and `fail#CountLines` could be called for any count's lines | Both are internal to `post#Count`: the count named, under review at the version reviewed (`post#CountLines`), lines of that count only (both) |
| F250 | P10 review (B4): due counts read each location's stock and movements one location at a time, Home built every due row for two totals, and the location limit cut silently | Zero confirmation reads three queries per facility (`zeroDaysOf`); Home asks `summaryOnly`; `truncated` says when a facility had more than 2000 open locations |
| F251 | P10 review (B5, B6): a picker's short-pick recount took any scope, mode and assignee; `recordOf("count")` admitted P6 adjustment records and immediate postings | Without STOCK_COUNT the recount names the stock or one location, a spot count with the policy's blind default and no assignee; `recordOf` requires a count mode |
| F252 | P10 review (C): re-entering a reviewed line after a recount of another failed on the status flow; the time counted was unbounded; an empty post answered POSTED; Today ignored its user and dates; Home counted late requests twice; Count now read the first page only; an assignee or schedule could be another organization's; a planned count of a location did not block its close | LINE_REVIEWED and COUNT_DATE_INVALID; NOTHING_TO_POST; Today answers its own user's items due by `thruDate`; late requests counted once; Count now reads the selected rows from every page (`rowKeys`); an assignee is of the organization with STOCK_COUNT (ASSIGNEE_INVALID; the schedule's too), a schedule the facility's organization's; a count scoped to a location blocks its close. A full count holds at most 5000 assets (SCOPE_TOO_LARGE): a larger facility is counted by area or location type |
| F155 | P6: `post#AcctgTrans` does not refuse a posting into a closed fiscal period: it sends it to the error journal with a danger message, and `PostingGuard.js` `check` refuses only for an organization with `postingGuardEnabled`; so a backdated variance would leave stock changed and its value unposted | StockPosting.js's `period` step refuses before the stock changes (§4), reading `PostingGuard.js`'s exported `fiscal` periods of the organization and those it rolls up to |
| F156 | P6: `record#PhysicalInventoryChange` sets a blank owner to the facility owner before it finds the assets, while `record#PhysicalInventoryQuantity`'s own on-hand query takes a blank owner as Any; Mantle's None is only for location and lot (`strictLocation`, `strictLot`), or for every selector at once (`strictAll`) | The adjustment always passes the owner (the facility owner unless given), so the count and the change see the same stock; AdjustmentScope's None and Any are a location's and a lot's (§4) |
| F157 | P6: `record#PhysicalInventoryQuantity` calls `record#PhysicalInventoryChange` without an out-map, so its `physicalInventoryId` out-parameter is empty unless one was passed in | `adjust#Stock` makes the PhysicalInventory (PIComplete, the effective date, the comment) and passes it, so the answer names it and a retry answers it |
| F158 | P6: `receive#Asset` copies a lot's expiry onto `Asset.expectedEndOfLife`, and `get#AssetExpiry` takes the earlier of the two, so a corrected lot alone would not extend its stock's expiry | `correct#LotMetadata` moves the assets whose expected end of life was the old expiry; `Lot.manufacturedDate` and `Asset.expectedEndOfLife` are now audit-logged on update, with the correction's reason |
| F159 | P6: the demo's stock is class `AsClsInventoryFin`, and `get#AssetTypeGlAccount` finds ORG_ZIZI_CORP's type-and-class row before its type row; the rows `init#PartyAccountingConfiguration` copied have sequenced ids, which a data file cannot name | `ironstone.warehouse.DemoServices.load#WarehouseDemo` (BossWarehouseDemoData.xml) sets `scrapGlAccountId` 519200000 on each of ORG_ZIZI_CORP's AstTpInventory rows that has none, not only the type row F40 named |
| F160 | P6: a reduction does not move reservations: `record#PhysicalInventoryChange` lowers on hand and ATP and leaves the asset's reservations, so a count below the reserved quantity leaves negative ATP, as Mantle does | Scrap takes only free stock and repack only what is free to issue (§4); re-reserving after an adjustment that goes below the reserved quantity is §7 (a count is a fact, so it is not refused) |
| F161 | P6: `resolve#ScannedProduct` reads through the catalog scope: it needs `PRODUCT_CATALOG_VIEW` and the product's owner among the user's catalog organizations, and it flattens a pack of packs to its deepest base | `repack#Asset` and `preview#Repack` call it as the user (the Warehouse groups hold `PRODUCT_CATALOG_VIEW`, F56; Mantle's spec group does too); a repack converts a pack and its base contents, so a pallet of cases unpacks into units |
| F162 | P6: `find#Movements` and `get#Traceability` reach a repack through its work effort (the issuance into it and the receipt from it); `AssetReceipt.sourceAssetIssuanceId` is written but read by neither | P16 (production) and P17 (`get#InventoryAtDate`) may follow the direct link; the work effort path already shows the lineage |
| F163 | P6: `scrap#Asset` refuses quarantined stock (HELD_STOCK), so a disposition of an inspection that scraps cannot call it as it stands | P8's `dispose#Inspection` scraps through its own disposition (quarantine → morgue) and then `scrap#Asset`, or passes a disposition parameter that P8 adds |
| F164 | P6: one `moqui test` run shares its database across specs, and WarehouseInventory counts the demo sealant's total and finds BOSS_WH_SER_1 on the first page of Assets ordered by product name | P6's fixtures use their own product, case and lots, named to sort after the demo's; the demo case product is "Twelve-pack of lot-tracked sealant" with its own lot SEAL-2026-C. A later phase adding stock before "Serialized scanner" moves that check |
| F165 | P6 review (B3): `record#PhysicalInventoryQuantity` finds its assets with no order, so a count's reduction could fall on other assets than the preview named | `adjust#Stock` posts every adjustment through `record#PhysicalInventoryChange` with the locked plan's change and its assets in the preview's order (`changeOrder`: oldest received first); WarehouseAdjustments checks a count takes from the older of two assets |
| F166 | P6 review (B1): repack's unit cost divided to six places left a WIP remainder (a case of 7 at 10.00 received 9.999997), which the close check PccOpenWip flags exactly; and `Asset.acquireCost` is a currency-amount that keeps four decimals | The unit cost is divided to four places and, when that leaves a remainder, the last unit is received apart (a second receipt and asset) at the remainder's cost, so issue and receipts net exactly; `result.receipts` names both. PccOpenWip unchanged; spec with a case of 7 |
| F167 | P6 review (A1): `repack#Asset` issued quarantined, morgue or defective stock (`keepHeld` refuses only a status change, `issue#AssetToWorkEffort` checks expiry and ATP), leaving the new asset held with no inspection | A source that is not AstAvailable or AstOnHold is `HELD_STOCK`, checked right after `settled` |
| F168 | P6 review (B2): `adjust#Stock` accepted InVrScrap and InVrExpired, bypassing scrap's refusals and `scrapIndicator` | A reason of enumCode scrap is `REASON_INVALID` ("use Scrap"); Adjustments' reasons leave them out (`adjustReasons`) |
| F169 | P6 review (C1): Repack's target options came from one level of ProductAssoc, not the resolver the repack posts with | `StockAdjustments.js` `repackTargets` (the unpack target and the packs of every level, at most five, each checked by `resolve#ScannedProduct`) feeds `get#RepackContext` |
| F170 | P6 review (C2): `preview#Repack` locked the asset (for update) and showed nothing when the source has no cost | The preview reads it unlocked (`posting.stock(..., false)`) and answers `costAvailable` false, shown as "Unit cost unavailable" |
| F171 | P6 review (C3): the period step reads the organization's and its rollup parents' TimePeriod rows for update, so concurrent postings of one organization queue behind each other for the transaction | Kept for the rare value postings of P6 (it serializes with a period close); a high-volume entry point (receipts, picks) takes it only with a decision (WarehouseImplementation.md) |
| F172 | P6 review (C4): `adjust#Stock` adjusted equipment (any asset type) | A bucket with a non-stock asset, or an empty bucket of a non-stock product, is `NOT_STOCK` |
| F173 | P6 review (C5): a repack of an asset with no owner made a work effort owned by the facility owner, so the issue would post to cost of goods sold, not WIP | An ownerless source is `OWNER_REQUIRED` |
| F174 | P6 review (C6): a lot with no stock anywhere is open to every Warehouse user (P4's rule), so any adjuster or quality manager may correct a new lot of another organization | Recorded; a lot has no organization of its own. A lot owner (or the creating organization) would close it, for a later phase |
| F175 | P7: the entity facade's `skip_locked` is not exposed to scripts, so a revision cannot tell that a receive holds the receipt without waiting for it | `adjust#ExpectedReceipt` locks the open receipts first, as the receive guard does, so it waits for the receive and then sets the sources to the new remainder never below what was received; ReceiptInProgress is §5's framework question |
| F176 | P7: `create#OrderPartShipment` copies the order line's quantity into the source and shipment item with no unit, so a line ordered in another unit than the product's stock unit leaves the receipt in the line's unit while receipts are in stock units | `ensure#PurchaseReceipt` converts its new receipt's sources and items to stock units (`convert#Uom` of the line's `quantityUomId`); `close#PurchaseRemainders` compares the received stock quantity in the line's unit. A receipt Mantle made otherwise keeps the line's quantity |
| F177 | P7: `receive#Asset` returns at once for a zero quantity, so `receive#ShipmentProduct` writes no AssetReceipt for a line that is only rejected, though it lowers the source's quantity not handled | The guard writes a rejection with nothing accepted itself (Receiving.js `rejectOnly`): an AssetReceipt with no stock on the product's sources in order. Spec: a reject-only serialized line |
| F178 | P7: the menu data leaves a subscreen in whatever its screen `<condition>`, and a subscreens-item's `disable-when` does not see the parent's always-actions, so Supplier360's Products & prices tab is listed in Warehouse | The tab's condition (`appRoot != 'Warehouse'`) renders it empty: no price reaches Warehouse; §5 |
| F179 | P7: `release#Commitment` checks INVOICE_APPROVE, BUDGET_EDIT or ACCOUNTING_ADMIN through `ProductAccess.has`, which disabled authorization does not bypass, so a receiver's or buyer's close could not release the order's commitment | The internal `release#ClosedSourceCommitments` (§4) |
| F180 | P7: `cancel#OrderItem` lowers `OrderItem.quantity` as it raises `quantityCancelled`, so the quantity is already net of what was cancelled; the plan's "quantity less what was cancelled and received" would subtract it twice | The remainder is quantity less what was received, accepted and rejected (design-purchasing ClosePurchaseOrders' formula is meant the same way) |
| F181 | P7: `isFulfilled#OrderItem` counts only accepted receipts, so a purchase part whose short remainder was closed with units rejected never completes | `close#PurchaseRemainders` completes a part when every product line's received quantity, accepted and rejected, reaches its quantity (`complete#OrderPart`), then `checkCancelComplete#Order` |
| F182 | P7: `receive#ShipmentProduct` receives what is beyond the product's sources "outside the order", with no `shipmentItemSourceId`, so a tolerance checked by source misses the excess | The over-receipt check counts every receipt of the product on the shipment against what its sources expect plus the policy's percentage (default zero) |
| F183 | P7: `receive#Asset` makes a serial number one unit (quantity 1, or rejected 1), while `receive#ShipmentProduct` counts the quantity it passed against the sources | The guard posts serialized stock one serial per call with quantity 1, after checking the serial count against the accepted units and that none is given twice or already in stock |
| F184 | P7: there was no PURCHASE_ORDER_EDIT permission | MantleSetupData, with ADMIN's grant; no BOSS group holds it until Purchasing |
| F185 | P7: BossWarehouseDemoData had no purchase order, and ORG_ZIZI_RETAIL does not set `receiptInvoiceSelfBilledOnly`, so a demo receipt bills its supplier on delivery as Mantle does | `BOSS_WH_PO` (Ziddleman, sealant and scanner) for the walk; the self-billing rule is checked in mr-mantle's WarehouseReceiving with a spec-local organization |
| F186 | P7 review (A1): F176 converted only the receipt: `isFulfilled#OrderItem`, `create#OrderPartShipment` and `cancel#OrderItem` still compared stock-unit receipts and sources with the line-unit `OrderItem.quantity`, so a 2-dozen line completed on receiving 1 dozen and close and backorder were refused | Mantle's comparisons take the line's factor (§4); WarehouseReceiving's dozens case checks the part stays open after a dozen and closes half a dozen, and a line in the stock unit or an unrelated unit has factor 1 |
| F187 | P7 review (B1): `adjust#ExpectedReceipt` locked the order part before the shipments while receive and close lock the shipment first, and close locked the header before the parts | One lock order (§4) |
| F188 | P7 review (B2): the receipt entry points checked no period | The non-locking period check (§4) |
| F189 | P7 review (B3): generating from the tracking pattern always started at 1 (Receive passes no start number), so a second generation repeated the first's values | The sequence goes on after the highest value made from the pattern (the product's serials or the lots, by the pattern's prefix); `startNumber` still starts where asked |
| F190 | P7 review (C1): the reject-only receipt writes AssetReceipt itself beside receive#ShipmentProduct | Kept (F177), documented in `receive#ShipmentStock`'s description and WarehouseImplementation.md: Mantle's `receive#Asset` returns before writing for a zero quantity |
| F191 | P7 review (C2): `ensure#PurchaseReceipt` answered an existing receipt with the facility asked for, and a backorder of a receipt with nothing received delivered it empty | EXISTING answers the receipt's own facility; such a receipt is cancelled (`cancel#Shipment`) and the remainder goes to the next receipt |
| F192 | P7 review (C3): a close at a receipt cancelled the line's whole remainder (including what another open receipt of the part expected) and could complete parts it did not touch | A close at a receipt cancels at most what that receipt expected and did not get, passing its sources to `cancel#OrderItem` (`fullShipmentItemSourceList`), and completes only the parts it touched |
| F193 | P7 review (C4): step 2 with no receiving location posted no location and took any location asked for; SERIAL_DUPLICATE counted every asset ever with the serial | Step 2 takes the receiver's location only when it is a receiving one, else the policy's, else LOCATION_REQUIRED; a serial is a duplicate when stock with it is on hand (the generation preview the same) |
| F194 | P7 review (C5, C7, C8): the list's overdue condition used the timestamp now while rows and Home used the calendar day; the list matched any route segment's destination; Supplier360's receipts read each shipment's receipts apart; long lines; the prices tab | Overdue is before the start of today in the user's zone everywhere; a receipt's facility is its last segment with a destination (of at most 2000 candidates, `receiptRowsTruncated`); the receipt rows of several shipments are one read; lines wrapped; WarehouseReceiving checks a direct Prices request shows no supplier offers. The ad hoc cost (C6) and Handheld's Receive index 3 are §4 and the screens |
| F215 | P9: Mantle had no storage type on Product or FacilityLocation, and nothing read `FacilityLocation.capacity` | P9 adds the `StorageType` enumeration and both fields (§4), and `get#Capacity` reads the capacity; a product's storage type has no screen yet (§5) |
| F216 | P9: Receiving.js's step 1 took the product's first ProductFacilityLocation by location id with no check but closed, before putaway rules existed | Step 1 now posts to `resolve#Destination`'s location (default locations in pick sequence, then the rules, each checked), else the receiving location with the reason |
| F217 | P9: `move#Asset` gives moved stock its location type's `autoStatusId` only; ZIRET_WH's bulk type has none, so a receiving hold (AstOnHold) moved into bulk stays on hold | `putaway#Stock` releases a hold to AstAvailable in storage through `update#mantle.product.asset.Asset` (its status flow, so the reservation SECA runs); `move#Stock` is unchanged |
| F218 | P9: nothing records stock promised to a location (ShipmentItemSource has no location; putaway has no task record, F42) | "Incoming" is the putaway queue of the products whose default location it is (§4) |
| F219 | P9: Putaway's Destination box had a second `box-body` after a `box-body-nopad`, which is invalid per the XSD (a `container-box` allows one `box-body`, in order) and was not flagged by the screen lint; the html render dropped it | Putaway's Destination puts the candidates in a box of their own; the lint gap goes to mr-moqui |
| F220 | P9: a one-step receipt resolves its destination without locking the candidate locations (only the chosen one is locked, by `posting.destination`), so two receipts at once could each fit the last space of a bin | Closed by the P9 review (C1, F229): once the bin is locked the receipt checks it again and goes to the receiving location with the reason when it no longer fits; `putaway#Stock` checks its destination again under the lock |
| F221 | P9: Mantle's ZIRET_WH demo locations have no capacity and no product default location | BossWarehouseDemoData sets the sealant's pick bin `01020301` (40 each, its default) and the bay `01020302` (200 each) and the rule `BOSS_WH_PR_SEAL` |
| F222 | P9: ss-inventory has no mr-marble form designed for Putaway, PutawayRules or HandheldPutaway (MoveAsset's forms are Move's) | No Implemented-in cell to fill; usl-inventory's `move#Asset` and `check#ScanLocation` rows and the new services are filled |
| F223 | P9 review (B1): `putaway#Stock` released any AstOnHold stock in storage, and an asset with no location counted as coming from receiving, so a customer return received on hold with no location (ReturnSettlement.js) became available through Handheld Putaway | The hold is released only for stock put away from a receiving or staging location; an asset with no location has no source type; other holds stay (WarehousePutaway: a hold with no location stays on hold in bulk). The return's hold is §5 (P14) |
| F224 | P9 review (B2): the resolver and the queue offered storage bins to morgue, defective and other stock that is not sold | Putaway takes AstAvailable and AstOnHold stock only (quarantined stock within quarantine); others answer NOT_PUTAWAY with no candidate, `putaway#Stock` refuses NOT_PUTAWAY, and the queue and Home's counts leave them out |
| F225 | P9 review (B3): candidates were kept by location with the default first, so a rule naming a product's default location lost its capacity there, and the recheck saw no rule | The rule that also names a default location is attached to that candidate (its capacity checked, "(rule N)" in the explanation, its `putawayRuleId`); the recheck keeps the candidate's source and rule |
| F226 | P9 review (B4): "incoming" counted the whole queue of the products defaulting to a location, so queued stock blocked itself (two 3-unit assets for a bin at 36 of 40 both refused), and a product with several default locations charged its queue to each | Incoming counts only queue stock with an earlier claim (received before the stock resolved, by date then id; a receipt and get#Capacity count it all), charged to the product's first default location in pick sequence only |
| F227 | P9 review (B5): the queue, the sheet and receipts explained every candidate, reading queue locations and incoming per candidate, and the rules were filtered by date in memory | `resolve#Destination` takes `explain` (false stops at the first that fits; the queue rows, the sheet and receipts use it, the chosen stock and RuleTest explain all); queue locations, first defaults and incoming are read once per resolution; rules are found by from and thru date in the query |
| F228 | P9 review (B6, B7): `Product.storageTypeEnumId` was not in `store#Product`'s fields, a Products clone or variant creation; the step-1 receipt did not pass the ad hoc receipt's owner to the resolver | It is in CatalogRecords.js's `masterFields` (checked as a StorageType), Products' clone (`Catalog.js`) and variant creation (`Variants.js`), noted in design-products Product360; Receiving.js `destination()` takes the owner and `receive#AdHocStock` passes it |
| F229 | P9 review (C1): see F220 | Receiving.js re-runs the resolver's check of the chosen bin once it is locked (the receiving location is locked after it, the one order), and falls back to the receiving location naming why |
| F230 | P9 review (C2, C3, C4): `store#PutawayRule` could change a row that already had a successor and move a scheduled end later; the change dialog sent no stamp and a rule to come could not be edited before its start; the resolver and rules took a product or category of another organization and any area | A row with a successor is RULE_CHANGED, a change at or after its scheduled end is refused and End never moves it later; ChangeRule sends `expectedLastUpdatedStamp` and a rule to come is changed in place at its own from date; `resolve#Destination` refuses another organization's product (PRODUCT_REQUIRED), rules refuse another organization's category and an area the facility does not have, and the category choice lists the user's organizations' |
| F231 | P9 review (C5, C7): no spec followed a two-step receipt into the queue; a 204-character description line | BOSS WarehousePutaway receives at a two-step facility (BOSS_WH_EAST, the spec's own dated policy, ended after) and finds the stock in the queue at receiving; `receive#ShipmentStock`'s description is wrapped |
| F255 | P11: `move#Asset` cleared the container of the whole source asset before splitting a part off to a location, so a partial move out of a container (a put back, or P5b's `detach#AssetFromContainer` of a part) emptied the container | Only a whole move clears the container now (`AssetServices.xml`); the part becomes its own asset at the target and the rest stays in the container. WarehousePicking's put back covers it; F28's specs pass |
| F256 | P11: `update#ShipmentItem` with a `shipmentItemSourceId` set the source's quantity to the item's new quantity plus the change (its `entity-set` copied the item's quantity first), so lowering a one-source item doubled the reduction | The source's own quantities change by the item's change. No Mantle service passed a source id (only mr-marble screens); `finish#Pick`'s backorder does |
| F257 | P11: `create#ShipmentLoadsForOrders` reads `vendorPartyId` and `productStoreId` that it never sets, so its loads have no owner; and it reads `inputFieldsMap` from the request by default | Unchanged for its callers; the guarded path makes each load the facility owner's and passes its own inputs |
| F258 | P11: Mantle's pick (`pickMove#ShipmentProduct`) only raises `quantityPicked` (moving stock only into a pick container) and never sets ShipPicked; packing does (`pack#ShipmentItemSource`) | `finish#Pick` sets ShipPicked through `update#mantle.shipment.Shipment` (the load's status follows by the SECA); a pick into a container checks the container's location open (StockPosting `destination`) |
| F259 | P11: `create#OrderPartShipment` admits a part in OrderApproved under a held header (it tests the part or the header), and `cancel#OrderItem` sets `quantityNotHandled` to zero on every source it lowers, even partly | Kept (Mantle's behavior): `create#OutgoingShipment` and the wave refuse a held header or part (ORDER_HELD); Pick reads what is left to pick as quantity less picked, not `quantityNotHandled` |
| F260 | P11: `get#ShipmentLoadPickInfo` sums by product and location without the line identity, short picks or put backs | Not called: Pick's lines are `PickingServices.get#PickContext` |
| F261 | P11 review (A1): BelowMinimum suggested the face's whole quantity (at most the sum of the bulk stock) and Replenish posted it against the first source asset only, so bulk split over several assets failed with QUANTITY_EXCEEDS_ON_HAND | `find#PickFaceReplenishment` splits the suggestion over the sources in order, each source's `moveQuantity` at most its own available stock; BelowMinimum lists a row per source with its own Replenish (one `move#Stock` each). Spec: two 5-unit bulk assets refill 8 as 5 and 3 |
| F262 | P11 review (B1): after `cancel#OrderItem`, Mantle's OrderItemUpdateCheckReserve SECA resets the item's reservations by the store's order, so the line's reservation could leave the picked asset in the cart; a put back then carried a reservation back to the shelf, and `move#Asset` moves reservations along into a pick location; pack issues by reservation, so it could issue the shelf stock while the cart held the picked units | `cancel#OrderItem` re-reserves the line's remainder on the stock in the pick container; a cancelled balance's put back moves no reservation and re-reserves on the container afterwards. Spec: the reservation is on the cart asset after the cancel and after the put back, and pack issues from it |
| F263 | P11 review (A2): Handheld/Pick and Handheld/PickFace are under the Handheld area, open to every Warehouse user, and `get#PickContext` and `get#PickFaceNeeds` checked only the facility, so a reader saw a picklist's orders, locations and lots | Both refuse a user without the pick, pick supervisor or move capability (PERMISSION_DENIED), as `get#PicklistDetail` does; WarehouseAccess covers both Handheld paths |
| F264 | P11 review (B2, B3, C): `pick#ShipmentStock` took a scanned asset but `pickMove#ShipmentProduct` ignored it; it locked the destination location before the assets; a put back to a chosen location did not count against its pick; held stock was refused only with a container; Create shipment did not check the part's facility in BOSS; OrderDetail listed shipments outside the user's facilities and mixed stock and line units; the shipment list kept the oldest candidates when truncating; BelowMinimum read a future close date as closed | `pickMove#ShipmentProduct` takes `pickAssetId`; assets are locked before the location and `keepHeld` checked after; put backs name the pick they consumed (`pickKey`); HELD_STOCK always; `createOutgoing` checks the part's facility with loadEdit; OrderDetail's shipments are scoped and its quantities are in the line's unit (`get#OrderItemStockFactor`, F186); the newest candidates are kept; a location closing in the future is open |
| F195 | P8: the browser client loads each level of a screen path as its own request (`/apps/Warehouse/Inspection.qvt`), where that level is the last screen and needs authorization, so an always grant on a subscreen does not open it under an area that denies the user; only the server render of the whole path (the specs' `page`) passes | QualityInspection is mounted at the Warehouse root (§4); P1's per-screen artifact group was dropped. A framework question for mr-moqui: whether a level loaded for a deeper path should take the deeper screen's grant |
| F196 | P8: `ec.context.put` is not a function in an XML Actions `<script>` of a service, and an entity find cannot be counted and then listed (`entity find was already used`) | Out-parameters set one by one; each list builds its find twice (`lib.page(query(), p, ..., query().count())`), as P10 does |
| F197 | P8: a purchase receipt carries no customer-demand provenance (RequirementSupply is §7; `RequirementOrderItem` links a requirement to the PO line, not to a sales line) | Release's demand peg comes from a run's OrderItemWorkEffort or the caller; a receipt's release reaches the waiting order through AssetStatusAvailableReservations (§4) |
| F198 | P8: `receive#AdHocStock` in a step-3 facility posts into quarantine with no inspection | Recorded; the inspection is created on its stock with `create#Inspection` (Mantle; no screen yet, §7) |
| F199 | P8 review (A1): the demand peg was checked only to exist, so a forged peg reached another organization's order item and reset its reservations | `checkDemand`: the OrderItem's product is the inspected one and its OrderPart's vendor is the facility owner in the user's scope (DEMAND_INVALID), for a given peg and one from a run's OrderItemWorkEffort, at create and again at Release |
| F200 | P8 review (B1): Release reserved with `resetReservations: true`, dropping all the order item's reservations (picklisted ones too) and offering the freed stock to others | `reservePeg`: `reduce#AssetReservation` of the item's not-available quantity only, up to the released quantity, without `reserveIncreasedAsset`, then `reserve#AssetForOrderItem` with the asset and `resetReservations: false`; spec: a pegged order holding reservations keeps them |
| F201 | P8 review (B2): scrapped or returned-to-supplier quantity stayed match-eligible | Leaves the match base in `get#SourceInspectionStatus` and `InvoiceMatch.js` (§4) |
| F202 | P8 review (B3): stock kept held by Quarantine, Rework or a return had no way out | Inspect again on QualityInspection (`reinspectInspection`, `create#Inspection` with `reinspectQualityInspectionId`, `previousInspectionId`), moving the held quantity so the source counts it once; Cancel inspection for a draft or submitted one (`cancel#Inspection`, QiCancelled) |
| F203 | P8 review (B4, C): `create#Inspection` took any asset with a receipt, and two open inspections on one asset; `storeTemplate` posted an empty unit, so a change to a published item with a unit made a spurious revision; the nested scrap key could pass 200 characters; the disposition's status field was named like a record status | VALUE_INVALID for an asset that is not the receipt's; INSPECTION_EXISTS per asset; the transition leaves the unit out; the nested key is hashed past 200 (`nestedKey`); `QualityInspectionDisposition.assetStatusId`; lines over 130 wrapped |
| F204 | P8 review (B5): the tracking policy's `inspectionRequired` had no form | StockPolicies' TrackingPolicy tab: Inspect on receipt (`saveTracking` passes it; Policies.js labels and fields) |
| F275 | P12: `release#ShipmentDraftInvoice` requires RECEIVABLE_EDIT, which no Warehouse group holds, so a packer could not reopen a package | Its body is the new internal `release#ShipmentInvoiceLines`, which it and `reopen#ShipmentPackage` call after their own checks (§4) |
| F276 | P12: `complete#ShipmentPack` runs `update#ShipmentAndRouteSegment` and `pack#Shipment` each in a new transaction (and the invoice SECA in its own), so a guard holding the shipment or its lines for update would wait on itself | `complete#Pack` reads the shipment unlocked and checks before the call; a retry is answered by the operation key and Mantle's own status check |
| F277 | P12: `cancel#OrderItem` set a reduced shipment line's `quantityNotHandled` to 0 (Moqui's original), so the rest of a partly cancelled line could not be packed | It lowers `quantityNotHandled` by the reduced quantity (both copies, cancel and reject); a full cancel is unchanged. P11's WarehousePicking packs after a cancel and still passes |
| F278 | P12: `unpack#ShipmentItemIssuance` takes a whole issuance and leaves the package contents; a package's content is per product with no source line, and an issuance names no package | `unpack#ShipmentItemIssuance` takes an optional `quantity`; a reopen unpacks the package's quantity of each product from the shipment's issuances, newest first, and lowers the content |
| F279 | P12: ShipmentBoxType has no owner, retire date or most weight; CarrierShipmentBoxType has no "preferred" | `ShipmentBoxType.thruDate` (audit-logged) and `maxWeight` (`entity/ShipmentPackEntities.xml`); box types stay shared (§4, §5); "preferred" is left out |
| F280 | P12: ShipmentDetail's outbound Packages box read `boxTypeEnumId`, which ShipmentPackage does not have | It shows the box type's description, the weight and the contents |
| F281 | P12: `pack#Shipment` completes the order parts it fills, and Mantle reserves nothing for a completed order, so an unpacked issuance's reservation was not restored | A reopen returns the parts (then header) of the stock it unpacks to Approved by their flows; the next Complete pack completes them again |
| F282 | P12: `pack#ShipmentAssemblyComponent` without a reservation issued through `issue#AnyAssetForShipmentItemSource`, which looked for the kit product's own stock, and with `workEffortOnly` called `issue#Asset`, which requires a shipment, so a kit with unreserved components could not be packed | `issue#AnyAssetForShipmentItemSource` takes `componentProductId`, which the assembly pack passes, and with `workEffortOnly` issues through `issue#AssetToWorkEffort`; the Mantle spec packs a kit with its reservations removed, the walk the demo kit (unreserved) |
| F283 | P12: an unused component's return (`pack#Shipment`) and a kit's breakdown (`unissue#Component`) cancel the oldest issuances first, while kits are costed from the issuances in issue order, so with one component issued at different costs a return or breakdown can leave a WIP difference of the cost difference | Recorded (§7): returning the newest issuances first under the flag would close it |
| F284 | P12: Inventory's Assets list orders by product name, 20 to a page, so a demo product named before "Serialized scanner" pushes `BOSS_WH_SER_1` off the first page AppStructure and WarehouseInventory read | The kit demo's products are named "Zinc ..."; AppStructure checks the pack demo's `BOSS_WH_PACK_STOCK` (named before it) |
| F285 | P12 review (A1): `pack#ShipmentStock` and `pack#ShipmentAssembly` passed a named or scanned asset to Mantle unchecked (`get#ShipmentProductByScan` has no facility, owner or status filter; `pack#ShipmentItemSource` displaces reservations onto it and `issue#Asset` takes it first), and only the order item's held reservations were refused, so a packer could issue another facility's, another organization's or quarantined stock | `Packing.js` `packAsset`: the asset locked and scoped by `posting.stock`, in the shipment's facility (OTHER_FACILITY), available (HELD_STOCK), of the line's product (PRODUCT_MISMATCH), before Mantle sees it; a scan is resolved in the guard (`resolveScan`: the shipment's products, else a kit's components) and packs through `pack#ShipmentProduct` or `pack#ShipmentAssemblyComponent`; without an asset, the reservations Mantle issues by must be on available stock of the facility. Specs: Mantle (another organization's, another facility's, quarantined, another product's, a scanned quarantined asset) and WarehouseAccess |
| F286 | P12 review (B1): every kit pack left an empty package: the guard created the package, and `produce#AvailableAssemblies` packed each kit with no package, so `add#ItemToPackage` made a new one each call (two with a cost remainder) | `produce#AvailableAssemblies` takes an optional `shipmentPackageSeqId` (empty: Mantle's new package as before), which `pack#ShipmentAssemblyComponent` passes; the kit spec has one package and completes |
| F287 | P12 review (B2): a reopen took a product's newest issuances, so with the product packed from several assets (lots, serials, locations) the books could take back other units than those that leave the box | A product packed from more than one asset needs the asset named (ASSET_REQUIRED); Reopen offers the package's assets; from one asset the newest issuances are that asset's. Spec: two assets, refused unnamed, the named one unpacked |
| F288 | P12 review (B3): a reopen or a move lowers a package's contents; its weight must not stay | Mantle's `update#ShipmentPackageContent` and `add#ItemToPackage` already clear the package's weight when its contents change; the reopen spec now checks the weight is gone |
| F289 | P12 review (B4): box types are shared by every organization, and their writes checked only FACILITY_EDIT; the BOSS transitions checked no capability | `Packing.js` `requireBoxTypeOwned`: a change to a type that a FacilityBoxType or a package of another organization's facility uses is BOX_TYPE_SHARED unless the user has every organization's scope (`store#ShipmentBoxType` on an existing type, `store#CarrierShipmentBoxType`); BoxTypes' transitions refuse without facilityEdit |
| F290 | P12 review (C): re-approving the order on a reopen (F281) runs Mantle's OrderApproved rules again: the part's OrderApprovedNotify, and on the header OrderApprovedReserveAssets (nothing to reserve while the stock is issued), OrderApprovedSendEmail (the store's approval email again) and OrderApprovedFulfillSubscriptions | Recorded (§4); a reopen of a subscription order or one whose store sends approval emails repeats them. Not changing the status leaves Mantle reserving nothing for the unpacked stock |
| F291 | P12 review (C): `get#PackContext` answered every Warehouse user, so Handheld/Pack (under the open Handheld area) showed a reader the shipment's lines and stock (P11's F263 rule) | It refuses a user without the pack capability (PERMISSION_DENIED); Pack shows "Packing needs the pack permission"; the packing slip and MaterialIssueReceipt read through the internal `contextOf`. WarehouseAccess covers the desk and Handheld mounts |
| F292 | P12 review (C): the kit unit cost was rounded half up, so the remainder unit could cost less than the others | Rounded down: the last unit carries the remainder and is never below the unit cost; a spec packs the same kit later at another unit cost (its own asset, WIP still nets) |
| F293 | P12 review (C): the demo's `kitCostFromComponents` is on ORG_ZIZI_CORP's preference, so every Zizi organization's kits are costed | Kept there: the Warehouse demo users work only for Ziziwork Retail, whose preference rolls up to Corp; a Retail row of its own would cut its inheritance of Corp's finance settings, and no BOSS demo organization with its own preference (BOSS_ACCT_ORG) has Warehouse users or the kit's stock |
| F294 | P12 review (C): `reopen#ShipmentPackage` locked the invoices (the release) before the order parts and header | One lock order: the shipment, the order parts, then the headers (`Packing.js` `lockOrders`), then the invoices, then the lines and assets of the unpack |
| F315 | P14: Accounting P17's `receive#ReturnItems` was not on the posting guard: no operation key (a double submit received twice), no facility scope beyond the organization, and the stock AstOnHold with no location and no inspection | An optional `operationKey` runs Warehouse's guarded receipt into quarantine with an inspection per receipt (ReturnStock.js, §4); without it Accounting's receipt is unchanged (WarehouseReturns, AccountingReturns) |
| F316 | P14: `issue#AnyAssetForShipmentItemSource` issues AstAvailable stock only, so a supplier return could not send back the quarantined asset its disposition held | Its new `assetId` issues that asset only, any status, up to its on-hand, its other reservations displaced; without it unchanged (ShipmentReturnMisc) |
| F317 | P14: an inspection created from a customer return's receipt was typed QicReceipt and QisReceipt with no return (Quality.js took the context from the receipt alone) | A receipt with a return gives QicReturn, QisReturn and its return item; a return template applies (WarehouseReturns) |
| F318 | P14: `get#SourceInspectionStatus` subtracts Return to supplier quantity twice while the stock is still held (it stays in `heldQuantity` and counts as inspection-rejected), so match-eligible is understated until the stock leaves | Recorded, not changed (InvoiceMatch.js agrees with it; it errs low): `issue#SupplierReturnStock` lowers `heldQuantity` when the stock leaves, after which it is counted once; a disposition's `returnedQuantity` would let the formula subtract only the shipped part, for review |
| F319 | P14: Mantle's `headerReceived` moves a fully received customer return on from ReturnReceived to ReturnManResp (Accounting's settlement worklist), so a return Warehouse finished receiving shows "Waiting for settlement" | Kept (Accounting P17's design); Returns' status filter names it so |
| F320 | P14: a screen template that section-includes a section of its own file makes the screen loader recurse ("screen includes are nested too deeply") | The shared inspection list is in WarehouseReturnParts.xml; for the framework (not edited): a self-include could resolve within the file |
| F321 | P14: ORG_ZIZI_RETAIL does not settle returns separately (`returnSettlementRequired`), so Mantle's `receive#ReturnItems` refuses the Warehouse demo's returns (RETURN_SETTLEMENT_OFF); turning it on in the demo breaks Mantle's ReturnToResponseBasicFlow and ShipmentReturnMisc, which run on Retail and load BOSS's demo data | The demo leaves it off; WarehouseSpecLib.js `returnSettlement` turns it on for the returns spec (put back after) and the walk's fixture spec WarehouseReturnsFixtures (client suite.js). A demo organization of its own for returns would settle this, for review |
| F322 | P14: the demo's quarantined assets have no available-to-promise quantity (availableToPromiseDiff 0), though `receive#Asset` into quarantine keeps it; `issue#Asset` issues by it, so such an asset cannot be sent back to a supplier (ISSUE_FAILED) | The supplier return demo's stock has its ATP; recorded for whoever corrects the older demo rows |
| F323 | P14: Mantle's `create#Return`, `create#ReturnFromOrder`, `add#OrderItemToReturn` and `request#Return` check no permission | Kept (a permission goes on a new entry point only, §2); Warehouse gates NewReturn and its items by capability in `check#Record` (§4); Customer Service's `authorize#Return` will check RETURN_AUTHORIZE |
| F324 | P14: a supplier return shipment ships whole: `ship#SupplierReturn` refuses one with items not fully issued (OUTSTANDING), and a remainder would need its own shipment | §7: shipping what is issued and leaving the rest to a new shipment |
| F325 | P14 review (B1, F318): match-eligible subtracted Return to supplier quantity twice while the stock was still held (in `heldQuantity` and in inspection-rejected), in `get#SourceInspectionStatus` and InvoiceMatch.js alike | `get#SourceInspectionStatus` answers `inspectionRemovedQuantity` (scrap plus each Return to supplier disposition's `returnedQuantity`; the unshipped part is in held), match-eligible is accepted less held less it, and InvoiceMatch.js's base uses it; WarehouseReturns: 10 accepted, 6 released, 4 for the supplier is 6 eligible before the return ships, and 0 held and the 4 removed after |
| F326 | P14 review (B2, F321): WarehouseSpecLib.js `returnSettlement` updated ORG_ZIZI_CORP's preference (Retail inherits it), turning D11 on for every Ziziwork organization, and the walk's fixture never put it back; the shipped demo could not receive its own RMA | The demo RMA is of `BOSS_WH_RETURNS` (Ziziwork Returns Center), a child of Retail so Retail's warehouse users work it at ZIRET_WH, with its own preference and D11 on through `store#Preferences` (`load#WarehouseReturnsDemo`); the helper and the fixture spec are gone; ReturnDetail and ReturnReceipt read `get#ReturnSettlementMode` and say why there is no Receive for an organization with D11 off (§5) |
| F327 | P14 review (B3): `find#ReturnableReceipts` limited (500 orders by string order, 200 receipts) before filtering the shipment type, organization, supplier, facility, lot and what was returned | The query is `ReturnableReceiptView` (receipt, shipment, order line and part, the receipt's asset) with type, buying organization, supplier, lot and facility as conditions, read a page at a time until 200 receipts with something to return, at most 5000 (`receiptRowsTruncated`) |
| F328 | P14 review (B4): a supplier return item that names no asset (an order-line return) could not be sent back (ASSET_REQUIRED) | SupplierReturnShipment's Send back offers the product's stock of the returning organization at the origin facility (`assetOptions`); with none, no Send back and the reason |
| F329 | P14 review (B5): AstOnHold stock under an open inspection could be sent back with STOCK_ISSUE alone | Held stock is quarantined or on hold: QUALITY_DISPOSE and the Return to supplier coverage (RETURN_NOT_DISPOSED) apply to both |
| F330 | P14 review (C): the return lot took any lot of the number and a given lot was not checked; eligibility could exceed the stock on hand; a receipt could name another facility than the shipment's; any owner's stock could be sent back; ReturnContent had no permission or scope check and RecordFiles no create service for it; the named-asset branch ignored `workEffortOnly`; the Warehouse transitions included in shared screens had no app guard | The lot the item's order line was issued from first, a given lot must hold the product (LOT_INVALID); `eligibleQuantity` is capped at on hand (`receiptEligibleQuantity` the receipt's basis); OTHER_FACILITY; OWNER_MISMATCH; `create#ReturnContent` needs a return permission and the return's party in scope, `save#ReturnContentFile` checks its row, RecordFilesServices maps ReturnHeader; the assetId branch refuses `workEffortOnly`; each Warehouse return transition refuses another appRoot |
| F331 | P14 review (C): `request#ReturnLabel` calls the carrier inside its transaction, so a timeout after the carrier bought the label rolls back the request record and a retry may buy a second | Recorded for P13: its provider-request records commit the request first and ask the provider before any retry (WH-LABEL) |
| F332 | P14 (F320 for mr-moqui): `crates/moqui-core/src/screen/definition.rs` `pull_section_include` (about line 1349) follows a section-include into the location it names even when that is the including file, so a template whose section includes another section of the same file recurses until "section includes are nested too deeply" (definition.rs ~817, ~1399) | For the framework (not edited): resolve a section-include of the same location from the file already parsed, without loading it again |
| F335 | P15: Mantle's `pickMove#ShipmentProduct` picks only reservations, and reservations are order items: a transfer line has none, so P11's pick found nothing to pick on a transfer | `pick#ShipmentStock` takes a line with no order through Picking.js `transferStockAt`/`pickTransfer`: the scanned asset's or location's available stock (never held stock; NOT_AVAILABLE_HERE), moved into the pick container when there is one |
| F336 | P15: `receive#Asset` creates the asset with `acquireCostUomId` from the order header only (its `Object.assign` overrides the parameter), so stock received with no order has no cost currency | `receive#TransferStock` sets the received asset's `acquireCostUomId` to the issuance's stock's |
| F337 | P15: `pack#ShipmentItemSource` and a guarded pick leave a shipment ShipPicked, and Mantle's shipment flow has no Picked to Shipped | `ship#Transfer` moves a picked transfer through Packed (no SECA acts on a transfer there) |
| F338 | P15: `issue#Asset` with a named asset goes on to the facility's other available assets when the named one's available to promise is short, and adds to an existing issuance of the same asset and line | `issue#TransferStock` refuses more than the named asset's available to promise first (QUANTITY_EXCEEDS_AVAILABLE), so the issue takes it from that asset; receipts are matched to issuances by `sourceAssetIssuanceId`, so a merged issuance is still one piece |
| F339 | P15: Request has no approved status (Draft, Submitted, Reviewed, In Progress, Completed, Cancelled) | Approval is the RqTpInventory requirements and ReqInProgress (§4) |
| F340 | P15: an incoming transfer was ReceiptDetail's receipt branch (`get#ReceiptDetail` lists transfers) and an outgoing one the outbound branch, at whichever mount opened it | Shared/ShipmentDetail tries the transfer branch first and the receipt and outbound branches only when it is not one; WarehouseReceiptDetail's "not available" waits for all three; a transfer's record link opens TransferShipmentDetail or SubcontractShipmentDetail |
| F341 | P15: a string literal inside a screen `${}` expression cannot span lines ("unexpected end of string" rendering the section), and an EntityFind is spent by `count()` ("entity find was already used") | Literals kept on one line; list reads build the find for its count and again for its page |
| F342 | P15 review (A1): `allocate#InventoryRequest`'s move within the facility checked only the asset's product, so stock of another facility moved inside it and was recorded as an IratMove at the request's facility, counted transferred and received | OTHER_FACILITY for stock not at the request's facility, and `move#Stock` gets `toFacilityId` (it refuses another facility too) |
| F343 | P15 review (B2): two rows of one item could allocate past the approved quantity, and shared a nested operation key | DUPLICATE_ITEM; the row index is in the nested key |
| F344 | P15 review (B3): the RqtInventory validation of `create#Request` was a new refusal for existing callers | Behind the operation policy's `inventoryRequestCheck`, also on `update#Request` (§4); spec: refused with it, unchanged without it, a request switched to RqtInventory with another organization's facility refused |
| F345 | P15 review (B4): the subcontract keys did not check the buyer, the run's scope, a cancelled order or that the item is a service | The order's part bought by the facilities' owner and the run the owner's, its facility in scope (RECORD_UNAVAILABLE); ORDER_CANCELLED; NOT_SERVICE (PtService) |
| F346 | P15 review (B5): a rejected transfer receipt leaves its issued value at the transfer account (the receipt posts the accepted quantity only) | Kept until a write-off (§5); TransferShipmentDetail's Transit shows the transfer account's net value with financial read only; spec: the account keeps the rejected unit's cost |
| F347 | P15 review (B6): a subcontract dispatch sent partly by move and shipped short stayed ShipShipped with nothing in transit | `ship#Transfer` delivers at once when no line has an issuance (`delivered` in its answer) |
| F295 | P13: Mantle's `get#OrderShippingRateLocal` counts a part's items, quantity, weight and amount but always rates 0 (its rules were never written), and the commented-out `CarrierServices.get#ShipmentRates` was never built | `get#ShipmentRates` is WarehouseTaskServices'; the local-rules provider calls `get#OrderShippingRateLocal` as it is, so a rule added there shows in Ship (§4) |
| F296 | P13: Mantle's `get#ShippingRate` interface had no outputs, the label and refund interfaces no request identity, and nothing asked a gateway what it did after a lost answer | Added, compatible with existing gateways: the outputs, `requestReference`, `find#ShippingLabels` with `ShippingGatewayConfig.findLabelServiceName`, `testMode` |
| F297 | P13: `print#Document` creates its PrintJob in a transaction of its own and then sends it; a failure leaves the job PtjSendFailed with the error, and this build has no print client ("not installed") | `dispatch#Document` runs each print as a probe after the posting, answers PRINTING_UNAVAILABLE or PRINT_FAILED with the kept job, and reprints by `send#PrintJob`; Ship shows each package's last print and Reprint |
| F298 | P13: FacilityPrinter's key is facility and purpose | `copies`, `fromDate`, `thruDate` are plain fields (§4) |
| F299 | P13: `create#ShipmentAutoPackages` deletes and recreates packages with contents but issues nothing, while P12's pack issues as it packs | Package suggestions are not built (§7, as P12 recorded); the test carrier implements no `get#AutoPackageInfo` |
| F300 | P13: `get#ShipmentGatewayDetails` writes the route segment's gateway when it finds one, and errors with none | The shipping reads and entry points call it as a probe |
| F301 | P13: `complete#ShipmentPack` with getLabels and `print#ShipmentLabels` (which downloads a label URL) run the carrier and the printer inside the caller's transaction | Not used by Warehouse: Complete pack requests no label (F17) and labels print through `dispatch#Document` |
| F302 | P13: P14's `request#ReturnLabel` requested an outbound label on the ShpTpSalesReturn shipment (its route runs from the customer), not `getReturnLabels` | Kept on the new path (F331 resolved): recorded first, the carrier outside the transaction, a weight given for the package |
| F303 | P13: a label request on a route segment with no carrier but a store gateway takes the store's gateway (Mantle's lookup order: store by carrier, segment, shipper, preference) | Ship's Buy labels per rate row sets the carrier, method and gateway on the segment first |
| F304 | P13: an XML attribute wrapped over lines keeps its indentation in the rendered text (only the newline becomes a space) | Specs check short phrases of wrapped texts |
| F305 | P13 review (A1): `record#ShippingGatewayRequests` wrote the segment's carrier, method and gateway uncommitted, then looked the gateway up through `get#ShipmentGatewayDetails` in a transaction of its own, which read the old committed segment (NO_GATEWAY for a new carrier, or the request recorded against one gateway while Mantle bought through another, so the lookup after a timeout asked the wrong one); the return label and manual tracking did the same | Shipping.js `gatewayFor` works out Mantle's lookup order in the caller's transaction from the segment as written, writing nothing; the gateway is recorded on the request and its own services are called directly (the store label markup of `CarrierServices.request#ShipmentLabels` is a selling-side charge and is not applied on this path). Spec: a carrier and gateway chosen on a segment that had none, timed out and asked of the same gateway |
| F306 | P13 review (A2): a test-mode gateway or one bound to no carrier could buy labels for any shipment, and the test carrier's party and methods were install data in every production's carrier choices | §4 review row: GATEWAY_NOT_FOR_CARRIER, TEST_GATEWAY behind `ShippingTestGatewayAllowed`, the carrier in demo data. Spec: UPS through TEST_SHIPPING refused; the setting off refused |
| F307 | P13 review (B1): a request row was stamped when recorded, not when sent, and two retries could both send a package; a gateway that cannot be asked was sent again silently | `claim#ShippingGatewayRequest` locks the row and claims it (Requested, the planned attempt, not yet sent) before the call, stamping `sentDate`; the in-flight window reads `sentDate`; with no `find#ShippingLabels` the request stays Unknown (SEND_AGAIN_REQUIRED) until `sendAgain`. Spec: WSH_NOFIND |
| F308 | P13 review (B2): `ship#OutgoingShipment`, `record#ManualTracking` and `record#PackageDelivery` checked the status before `posting.settled`, so a concurrent repeat of a done operation was refused instead of answered | `settled` right after the shipment's lock |
| F309 | P13 review (B3): `dispatch#Document` printed refunded labels, every segment's, and stopped at the first failure | The first segment's labels not refunded; each printed in turn with its result (`results`), the failures named |
| F310 | P13 review (B4, B5, B6): Ship's address check took any contact mech and gateway posted; the carrier could change, or tracking be recorded by hand, while a package held a gateway's label; a label could be refunded after ship | Only the shipment's origin or destination through its own gateway (ADDRESS_UNAVAILABLE); LABEL_EXISTS until refunded; refunds before ship only (SHIPMENT_SHIPPED) |
| F311 | P13 review (B7, B8): the shipping manager could edit carrier setup shared by every organization; credential values showed their last characters | SHIPPING_CARRIER_EDIT for the Warehouse admin only; credentials say "set" or "not set" (an account keeps its last four) |
| F312 | P13 review (B9): the label preview wrote the PDF to a DbResource on every view; the framework has no byte response for a script (`ec.web` sends text or a resource) | An all-ASCII label (the test carrier's) streams as `application/pdf` text, a carrier's label URL opens directly, and a binary label with no URL says it cannot be shown (LABEL_BINARY). For mr-moqui (not edited): a `sendBytesResponse(bytes, contentType, fileName)` would serve any label |
| F313 | P13 review (C): a refund with every package NO_LABEL answered REFUNDED; `returnLabels` was not in the request hash; a lookup that found a label without filling it led to buying another; a future-dated printer binding could replace the one in effect; `get#PrinterCapabilities` listed every printer; ReturnStock.js kept the pre-P13 comment; the invoice totals had stray spaces | NOTHING_TO_REFUND; `returnLabels` and `sendAgain` hashed; FOUND_NOT_FILLED leaves the request Unknown; BINDING_IN_EFFECT; capabilities of the printers bound at the user's facilities; the comment removed; the totals one service text |
| F314 | P13 review: Prettier joined a spec line beginning with `[` to the line before (`x == false[...]`), so two conditions of the first WarehouseShipping commit were not the checks they read as | Rewritten as plain comparisons; spec lines checked for a leading `[` or `(` (Practices-App-Dev §7) |
| F348 | P15 review (C): Picked to Packed was a raw status update; a transfer took stock of any owner; an unnamed send took one picked asset only; BOSS summed a line's movements its own way; long lines. Also noted: a transfer pick into a pick container standing at a FltPick location goes through `move#Asset`, which carries reservations along when stock enters a pick location from elsewhere (Picking.js F262), so an order's reservation could follow the transfer's stock into the container | `mantle.shipment.ShipmentServices.pack#Shipment`; OWNER_MISMATCH in `stockToSend` and the transfer pick (a location sweep leaves another owner's stock alone); an unnamed send takes from each picked asset at most what its picks took and the line has not issued; TransferShipmentDetail's lines are Mantle's `lineOf`; lines wrapped. The FltPick edge is left for P17 (a transfer's pick container is normally at staging) |
| F355 | P16: no production permission existed (Manufacturing P1 is not built) | mr-mantle seeds `PRODUCTION_VIEW` and `PRODUCTION_PLAN` in MantleSetupData, granted to ADMIN only; no BOSS group holds them until Manufacturing P1. `get#ProductionOrder` admits `STOCK_ISSUE`, so the warehouse's issuers read the runs they issue to without a production grant |
| F356 | P16: `issue#AssetToWorkEffort` adds to an earlier issuance of the same asset to the work effort, and an update of a posted issuance re-posts it (AssetIssuanceGlRePost), against D13 | New parameter `issuanceFields` (the line, the operation, the entered quantity): always a new issuance written with them; out-parameter `assetIssuanceId`. Without it Mantle's behaviour is unchanged |
| F357 | P16: `receive#Asset` with a workEffortId adds a WeptProduce row for the product by default (`noProduceProduct` add), so a material return would make the component a product of the run | return#UnusedMaterial passes `ignore`; receive#ProductionOutput keeps the default (the output line's product is already a WeptProduce row) |
| F358 | P16: `receive#Asset` takes the cost's currency from an order only (as F336) | The output and return receipts set `acquireCostUomId` after, from the standard's price unit, the first issued asset's, or the original asset's |
| F359 | P16: the `<seed-data>` of a new entity file was not loaded into the test database (the line-role enumerations' foreign key failed) | The roles and the unrelease transition are in `data/ProductionData.xml` (seed) |
| F360 | P16: Quality.js types an inspection made from a receipt as a receipt's (QicReceipt, QisReceipt) even when the receipt is a run's | `outputInspections` (with `outputNeedsInspection`: the tracking policy's `inspectionRequired` or a published production template) passes QicProduction and QisWorkEffort with the run |
| F361 | P16: DEMO_1_1's released BOM exists only through Products' server fixture (ProductsMethodFixtures), not demo data, and a run's id is sequenced | The demo run is made by `DemoServices.load#ProductionDemo` from the walk suite's server fixture WarehouseProductionFixtures (after ProductsMethodFixtures; it approves a DEMO_1_1 standard first); the walk works the subcontract run BOSS_WH_RUN, whose lines are demo data as P15 wrote the run (it has no BOM) |
| F362 | P16: MaterialIssueReceipt was kit-specific in its column words, history words and its dialog's Package field, though P12 recorded the sources as pluggable with no screen change | The screen takes `words` and `actionField` (package or asset) from the source; the kit source names its own; the production source adds Output, Tracking, Unused returns and Files boxes |
| F363 | P16: SubcontractShipmentDetail's location choice offered closed locations (the walk's first pick, 0199, is closed in the demo), refused at posting | The Output receipt pane lists only open locations (no `thruDate` passed) |
| F364 | P16: a subcontract's service quantity is taken as the output quantity, and no cost event is written (ProductionCostEvent is Manufacturing P6/P14) | `acceptedQuantity` overrides; the accrual and price-variance events stay with Manufacturing P14 and the bill match |
| F365 | P16 review (A1, A2): with no approved standard a partial output receipt took all the net WIP, and the half-up unit cost could leave the last unit negative (1000 units of 12.36) | The share of net WIP by what is left to receive, the last receipt the rest; the unit cost rounded down so the remainder is never below it, serials too; a quantity of one or less one line; a return after a provisional receipt trued up or refused (§4) |
| F366 | P16 review (B4): the framework accepts a transition of any status flow on any WorkEffort (call.rs `check_status` ignores `statusFlowId`), so the seeded WeApproved→WeInPlanning in the Default flow widened tasks and projects (Projects' menus read the Default flow) and let any path unrelease a run with stock facts; a flow of its own would still be accepted everywhere and would show in Projects' flow settings | Not seeded; Manufacturing's `transition#ProductionOrder` brings it with its guard |
| F367 | P16 review (B1, B2, B3, B6, B7): a by-product took the main product's standard or the WIP; return#UnusedMaterial's owner check compared the asset's owner; release rebuilt the routings from the lines' operations only, dropping a phantom's routing no line names; reviewed actuals above a line's remainder were capped and unknown lines ignored; a re-explosion released lines nobody reviewed | BYPRODUCT_NOT_COSTED; the facility's owner against the run's (OWNER_MISMATCH); `WorkEffort.productionMethodRefs` keeps the BOMs and routings the run was read from (operations and METHOD_CHANGED read it); LINE_INVALID and QUANTITY_EXCEEDS_REMAINING; REEXPLODED answers the draft for review |
| F368 | P16 review (B5, C): the subcontract's accepted quantity was the output in stock units (a per-batch service line refused and rolled the receipt back); the last receipt left a rounding residue on the material lines; a return into the original asset made the run its acquiring work effort; a cancelled dispatch and an order not bought by the run's owner were accepted; the acceptor was any party; the fixture swallowed a failed approval; the Output receipt pane showed to every Warehouse user | The proportional default with a Service accepted field; the last receipt issues each line's remainder; `acquireWorkEffortId` kept; SHIPMENT_CANCELLED and RECORD_UNAVAILABLE; ACCEPTOR_INVALID; the fixture asserts DEMO_1_1's frozen standard whenever a PDF renderer exists; the pane for issue or receive only. BOSS_WH_RUN stays demo data (F361): P15's dispatch and service order name its operation by a fixed id, which a run made by the service would not have |
| F375 | P17: `container-box` has no `condition` attribute in the XSD; the browser client renders the box whatever the condition (StockAtDate's notice showed on a complete report). Used with one at Picking/PickLocationMoves, Picking/CreatePicklists, Transfers/Transfers, Transfers/Repack, `template/WarehouseOrderDetail.xml` and Accounting's DepreciationRunDetail | StockAtDate wraps its notice in a section; the others are left for P18 (or a framework attribute) |
| F376 | P17: F119's movement facility: StockAtDate reads a row's place from the asset's audit log at the row's time, but chooses the assets to read, and checks the organization scope, by the asset's current facility (StockScope), so a whole asset moved out of the user's facilities, or one whose facility `update#AssetAndReceipt` changed to another organization's, drops from their report | Accepted: a whole move stays within a facility; transfers are an issue and a receipt (P17 review C3) |
| F377 | P17: a template's `section-include` of a section of the same template (and a chain back to it) fails every screen that includes the template with "screen includes are nested too deeply" | The shared valuation results are included by InventoryValuation itself, after Accounting's and Warehouse's headers |
| F378 | P17: Home's Your work was built per source (counts and inspections in get#Home) and missed P11's loads, which were in Today only | Your work is now Today.js's items (one source) |
| F379 | P17: Home's shipping queue had no counts (ready, waiting, late) until P13 built Ship, the task list it counts | P13's `get#ShippingQueue` counts it; the card links Shipping/Ship (after the merge with P13) |
| F380 | P17: a product with no `amountUomId` and one in OTH_ea gave two totals for each | Both count in each (OTH_ea), Mantle's stock factor rule |
| F381 | P17 review (A1): Asset `facilityId`, `locationSeqId`, `lotId` and `ownerPartyId` were `enable-audit-log="update"`, and the framework does not log a first value set by an update (null to a value), so a one-step receipt with no location later moved read at its current location for all earlier times | The four fields are `enable-audit-log="true"`; `get#InventoryAtDate` reads the rows an asset's create wrote (each field's first row with no old value, from the same call within a second of the first) as its starting values. Cost, beside F127: up to four more EntityAuditLog rows per asset created (the place fields set), and one per first location or lot set later; stock created before this change keeps the old gap |
| F382 | P17 review (B1, B2, C6): the opening read every ledger row before the cut-off of up to 2000 assets; the earlier-value audit lookup limited without an order and without marking the report truncated; revaluationPairs read one IN of every asset | One summed query (AssetDetailSummary) for the openings and the period's rows only; the lookup ordered and truncation marked; revaluationPairs in parts of 500 |
| F383 | P17 review (C2, C4): the incomplete notice named the facilities' overall start; OperationsHistory's movement basis read receipts and issues of every facility, a transfer's document basis used another date than its row, and delivered showed 0 before delivery | The notice names the latest start among the incomplete rows; receipts (AssetReceiptDetail) and issues filtered by facility in the query; each row's own expected date; delivered empty until delivered; the screen says a row's quantities are its whole document's |
| F384 | P17 review (C5, valuation): Counts.js and Inspections.js kept Home work rows no longer read, and a count's Today title repeated its status; InventoryValuation's Warehouse branch turned a failure of its scope or of Mantle's valuation into "not available" | The dead rows removed (the status is the item's step); the branch's calls show their errors |
| F395 | P18: the framework (mr-moqui) issues the Warehouse phases recorded, collected for the user; none is edited here. (1) F137: a transition with `default-response type="none"` sends no messages to a background `m-form` submit (`crates/moqui-core/src/screen/render.rs` ~2044, the `ResponseKind::None` branch); answer the messages as JSON for an `Accept: application/json` request. (2) F138: `scan-input` in a `multi` form-list row gets no row suffix on its companion names (`ScreenQvt.js` ~363, ~533 `scanInput`); suffix them as the row's other fields. (3) F175: the entity find's `skip_locked` (`crates/moqui-entity/src/entity/find.rs` 212) has no script binding (`crates/moqui-core/src/script/runtime/entities.rs` ~418 has `forUpdate` only); add `skipLocked(flag)`. (4) F178: the menu data lists a subscreen whatever its screen `<condition>`, and `disable-when` does not see the parent's always-actions (`crates/moqui-core/src/screen/menu.rs` ~120). (5) F195: the client loads each level of a path as its own request that authorizes that level as the last screen (`render.rs` `push_screen` ~1436), so an always grant on a deeper screen does not open it under an area that denies the user; a level loaded for a deeper path could take the deeper screen's grant. (6) F219: the screen lint does not flag a container-box's children out of the XSD order (a second `box-body` after `box-body-nopad`), which the html render drops (`crates/moqui-devkit/src/screen_lint.rs`). (7) F320, F332, F377: `crates/moqui-core/src/screen/definition.rs` `pull_section_include` (~1349) loads the location a section-include names even when it is the including file, so a template whose section includes a section of the same file recurses to "nested too deeply" (~817, ~1399); resolve it from the file already parsed. (8) F375, F398, F403: widget attributes not in the XSD are accepted silently (`condition` on container-box, container, form-single, form-list, display): either add `condition` to them in `xml-screen-3.xsd`/`xml-form-3.xsd` and honor it in every renderer, or have the screen lint flag unknown attributes. (9) F418: a refused JSON transition answers HTTP 500 (`render.rs` `send_json_redirect` ~2186 through `crates/moqui-core/src/web/mod.rs` `send_json_response` 906, status 500 at ~941); answer 400/422. (10) F312: no byte response for a script (`crates/moqui-core/src/script/runtime/facades.rs` has `sendTextResponse` ~780 and `sendResourceResponse` ~813); add `sendBytesResponse(bytes, contentType, fileName)`. (11) F366: `crates/moqui-core/src/service/call.rs` `check_status` (1488) finds StatusFlowTransition by status pair only, ignoring `statusFlowId` (as Moqui Java does); check the record's flow (its `statusFlowId`, else Default). (12) F98, F381: `enable-audit-log="update"` does not log a field's first non-null value set by an update (`crates/moqui-entity/src/entity/field_rw.rs` ~349): deliberate, as Moqui Java does (an initial set is not a change); worth considering a divergence (or a third mode) so a first value set after create keeps its time, since Warehouse had to switch four Asset fields to `true`. (13) F396: the server-static template does not hide a hidden field's column header (`ScreenQvtStatic.js` `cellBody` ~1357 wraps only the cells). (14) F397: `ec.message.getMessages()` of Moqui Java's MessageFacade is missing (`crates/moqui-core/src/script/runtime/tools_host.rs` ~835 defines `messageInfos` only). (15) F399: a `scan-input`'s terminal twin shows its field title, not its placeholder (`ScreenTui.js` ~444) | Reported for mr-moqui; the Warehouse workarounds are in each finding |
| F396 | P18: the server-static qvt template of a form-list wraps a field's cells in its `hide` condition but keeps the column header, so Movements and Traceability (found clean by the static check) showed a reader the "Unit cost" and "Correct" headers with empty cells (WarehouseInventoryWalk); no value reached the page | Those two are not marked server-static (§4); the framework gap is F395 (13) |
| F397 | P18: Mantle's `edit#ShipmentPackage` weigh read `ec.message.getMessages()`, which MR Moqui's message facade does not have, so weighing a package with no box type failed with "not a function" instead of WEIGHT_UNAVAILABLE naming why | It reads the messages `get#ShipmentPackageWeight` added (`ec.message.messageInfos` after the count before the call, P18 review), not the request's earlier ones; mr-mantle WarehousePacking checks the refusal, that an earlier message is not the reason, and a weight entered by hand completing the pack |
| F398 | P18 (F375): only `ScreenQvt.js` reads `condition` on `container-box` and `container`; the server-static template (`ScreenQvtStatic.js` 2347, 2349), html (`ScreenHtml.js` 2068) and tui (`ScreenTui.js` 1458) ignore it, `form-list`'s is read by html-print alone and `display`'s by none. Warehouse also had it on Receive's finish actions (container), CountSheet's two lists (a blind sheet's twin showed the variance columns), Counts' due-row link and display, and Shared/EquipmentDetail's account link | Each is a section with the condition (a conditional-field in a list); TuiRender checks four of them stay out of the twin and the page. Accounting's form-lists with one were wrapped too: `template/AccountingRecords.xml`'s return payments (~1042, inside Shared/ReturnDetail), Tax/TaxRates' simulation rows and Payables/LandedCosts' allocation findings. Left, outside Warehouse and Accounting: Commons/Search.xml's facet container, and `display` conditions at Commons/CalendarTui.xml:77, Projects/Projects/List.xml:257, Projects/Resources/Allocations/Staff.xml:65, Projects/Reports/Profitability.xml:142, Shared/WorkItemDetail.xml:862 and 869, Shared/RequestDetail.xml:640 and template/ContactRecord.xml:440–449 |
| F399 | P18: the terminal twin of a `scan-input` shows the field's title and not its placeholder ("Scan the bin"), so a route fixture's text from the html render is not in the twin | The fixture's `tuiText` (WarehouseSpecLib); F395 (15) |
| F400 | P18 access walk: box types (ShipmentBoxType) are shared by every organization, so another organization's label sheet of box types lists Retail's; a supplier is a party organizations share, so Supplier360 of Retail's supplier names it to another organization's user (with none of Retail's receipts) | As decided (§5 box type owner; parties shared, as AccountingAccessWalk); the walk reads them so |
| F401 | P18: the Warehouse route fixtures were in AppStructure, with TuiRender keeping a second, partial copy (its FacilityDetail tabs without Policies) and checking no text in the twins; Handheld Pick, Pack and PickFace, ShipmentDetail, OrderDetail, InvoiceDetail and MaterialIssueReceipt had fixtures but no mount pushed for them | One place, `WarehouseSpecLib.routeFixtures()` (routes and mounts) for AppStructure, TuiRender and ServerStatic; TuiRender checks each twin's text and that every fixture is rendered |
| F402 | P18 §16 check: not built are the receipt confirmation email (P7: the receipt document prints, the exception is a notification), exception notices from CountReview and Ship (Receive, Pick and QualityInspection notify), the external stock snapshot (ExternalStockSync, `later`) and the delivery trip manifest (DeliveryTripDetail, `later`) | §7 |
| F403 | P18 review (C): `form-single` has no `condition` attribute in the XSD either, and no renderer reads it: Ship showed every package Reprint, Send again and Refund (and Print labels, Return labels and Check address whatever their conditions), Printers and FacilityDetail's Printers tab offered Test page to a reader and End to anyone | Each is a section with the condition, in the list cells too (a section in a cell is evaluated per row); TuiRender checks Send again and Reprint stay out of the demo's packed shipment |
| F404 | P18 review (B1): `get#PickFaceNeeds` did not declare `sourceRows` (P11 review A1 added the flattened bulk rows without the out-parameter), so PickLocationMoves and Handheld PickFace counted "Below minimum · 1" and listed no row ("No pick face is below its minimum…") | Declared; the access walk requires Handheld PickFace to show the organization's face |
| F405 | P18 review (B1, B2, B4, C): the access walk counted its positive control over all routes (more than 20 of 41), posted no screen transition, swept eleven Retail users, ran later features on a failed flow and checked no notices | Per route: the owner who may open it (a capability user for a task screen) must see the record, the routes the plan names (the Handheld and shared mounts, the record panels) must be among them, and a Retail leak is counted on those routes; receive, pack, weigh, complete, tracking, ship and the count go through the screens' transitions with the pack, ship and queue renders error-free; own-side CSV and print controls, and the other roots open for a user granted them; the organization has a count, a putaway rule, a pick face below its minimum and its invoice; the flow is `test/Warehouse/WarehouseStandaloneLib.js`, and the walk is split in two (WarehouseAccessWalk, WarehouseIsolationWalk) of about 9 and 7 s of features, sweeping the Retail reader, receiver, picker and shipper; features after the flow say when its records are missing; no Retail user got a notice of the organization's records, its manager and quality manager did |

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
  - a partial supplier return shipment (F324), the return receipt at handheld density, and a return's putaway once its
    inspection releases it (it is available where it was inspected);
  - re-reserving an order whose reserved stock an adjustment counted below the reservation (F160), and Repack at
    handheld density (`Handheld/Repack`; P6 builds the desk task, which works on a phone);
  - camera scanning;
  - automatic package suggestions (PackOptions' `create#ShipmentAutoPackages` writes contents without issuing, F299),
    carrier box codes' "preferred" flag, and a kit's unused-component return and breakdown that
    cancel the newest issuances first under `kitCostFromComponents` (F283);
  - ZPL labels, with FacilityPrinter's `labelFormatEnumId` and label-printer capability;
  - facilities owned by a third party that hold the organization's stock;
  - count schedules by accuracy or by movement, and ABC classes computed from value or movement;
  - the receipt confirmation email, and exception notices from CountReview and Ship (design §16, F402);
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
  - Customer Service: `authorize#Return` (RETURN_AUTHORIZE), `apply#OrderChange` (the substitute on a short pick, and
    the cancelled balance) and "Issue return label" (over P14's `request#ReturnLabel`);
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

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo warehouse user, and walk each built phase's
  "usable when" in order.
- **Design §19's acceptance review and crosscut §6,** scenario by phase. The walks named are acceptance tests, run with
  `./moq accept mr-boss` when asked, except `WarehouseReceivingWalk`, the app's one golden-path client walk in the
  regression suite:

| Scenario | Phase | Covered by (checked in P18) |
| --- | --- | --- |
| Purchase receipt, partial inspection, putaway | P7, P8, P9 | mr-mantle WarehouseReceiving, WarehouseQuality (part released, part scrapped), WarehousePutaway; BOSS WarehouseReceiving, WarehouseInspections, WarehousePutaway, WarehouseAccessWalk; the Receiving, Inspection and Putaway walks |
| Short receipt closed or backordered before delivery | P7 | mr-mantle WarehouseReceiving (backorder, close, nothing received); BOSS WarehouseReceiving (Finish with a reason) |
| Reservation, shortage, recount | P11 (the short pick), P10 (the recount) | mr-mantle WarehousePicking (Short, a recount, on-hand unchanged), WarehouseCounts; BOSS WarehousePicking |
| Pick and pack into several packages, label timeout and retry, ship | P11, P12, P13 | mr-mantle WarehousePacking (two boxes), WarehouseShipping (timeout asks the carrier, no second label; a gateway that cannot be asked); BOSS WarehouseShipping; WarehouseAccessWalk (manual tracking) |
| Reopen a package after pack | P12, on Accounting P17 | mr-mantle WarehousePacking (invoice in process, final invoice, two assets) |
| Customer and supplier returns, partly received and settled, one in two boxes | P14; settlement is Accounting's P17 | mr-mantle WarehouseReturns (the RMA in two boxes, restock and scrap, the supplier return); BOSS WarehouseReturns; Accounting's settlement specs |
| Subcontract dispatch and output receipt | P15, P16 | mr-mantle WarehouseTransfers (dispatch, custody), WarehouseProduction (subcontract output, the service line accepted once) |
| Repack | P6 | mr-mantle WarehouseAdjustments; BOSS WarehouseAdjustments; WarehouseAdjustmentsWalk |
| Transfer in transit | P15 | mr-mantle WarehouseTransfers (in transit, received in two parts) |
| Blind count with a concurrent receipt or issue, and failed independent lines | P10 | mr-mantle WarehouseCounts (a move during counting found at review and recounted; blind quantities withheld; named line failures) |
| Lot expiry change | P6 (the correction), P5 (the gate) | mr-mantle WarehouseAdjustments (LOT_EXPIRY_EXTEND, old and new kept), WarehouseExpiry |
| Invalid serial or unit | P7 | mr-mantle WarehouseReceiving (one unique serial per unit; a unit with no conversion) |
| Mixed owners and pools | P3 (pools), P5 (moves) | mr-mantle WarehousePolicy (pools), WarehouseMoves (another owner's container refused), WarehouseTransfers (two owners refused) |
| Unauthorized financial fields | `WarehouseAccess` for each access rule a phase adds; P18 | BOSS WarehouseAccess; WarehouseAccessWalk (no cost or price on 13 routes and their CSV without financial read; settlement, release and revaluation refused) |
| Closed-period correction | P6 | mr-mantle and BOSS WarehouseAdjustments (a backdated adjustment into a closed period refused) |
| Standalone Warehouse, with no ProductStore and no other app's grant | P18 (`WarehouseAccess` for each access rule) | WarehouseAccessWalk (BOSS_P18_ORG with no ProductStore, receive to ship, users of one capability with no other launcher) |
| Crosscut sales order fulfillment | P11–P13; the substitute through Customer Service is §7 | WarehouseAccessWalk (an order with no store reserved, shipped by its users); the Picking, Packing and Shipping specs |
| Crosscut count with moving stock | P10 | mr-mantle WarehouseCounts |

- **Phone width.** The handheld mounts at 390 px are acceptance tests; no screenshots.

### Overall verification

The full suites after each wave of merged phases (standalone mr-mantle; mr-boss; the BOSS client walks):
- Baseline, Oct 31, 2026 (master before Warehouse): Mantle 1,190 passed, 1 failed (AccountingPaymentRuns' due schedule
  of a term), 6 skipped; BOSS 1,266 passed, 1 failed (ProductsPricing's price notice), 5 skipped.
- Wave 1 (P0, P1, P5a): Mantle 1,195 passed, 1 failed (the baseline), 6 skipped; BOSS 1,339 passed, 1 failed
  (ClientWrites: the client deny pattern did not list `ironstone.warehouse`, fixed), 5 skipped; walks 67 passed, 1
  skipped.
- Wave 2 (P2, P3, P4): Mantle 1,242 passed, 1 failed (the baseline), 6 skipped; BOSS 1,414 passed, 0 failed, 5
  skipped; walks 79 passed, 1 skipped. `moqui lint --screens`: no flagged site in Warehouse or the Shared screens it
  touches (only the information-level extension anchors).
- Wave 3 (P5b): Mantle 1,258 passed, 1 failed (the baseline), 6 skipped; BOSS 1,427 passed, 0 failed, 5 skipped;
  walks 83 passed, 1 skipped.
- Wave 4 (P6, P7, P10): Mantle 1,285 passed, 1 failed (the baseline), 6 skipped; BOSS 1,459 passed, 0 failed, 5
  skipped; walks 93 passed, 1 skipped. Screen lint: no flagged site in Warehouse or the Shared screens it touches.
- Wave 5 (P8, P9, P11), with the day-boundary fixes (fiscal months of a day when only later periods were made,
  bounded and never inside a closed span; term lines by book day; specs in the acting user's zone): run at 01:13 UTC
  on Nov 1 (Oct 31 in Central). Mantle 1,316 passed, 1 failed (FinancialAccountServices' statement print, the same
  UTC/local day class, fixed after), 2 skipped — the AccountingPaymentRuns baseline now passes; BOSS 1,488 passed, 1
  failed (AccountingTax's month statement, the same class, fixed after), 7 skipped; walks 102 passed, 1 skipped.
  Screen lint: no flagged site in Warehouse.
- Wave 6 (P12, P14, P15), run at 02:11 UTC on Nov 1: Mantle 1,341 passed, 0 failed; BOSS 1,521 passed, 1 failed
  (WarehouseInspections' New template: P14's BOSS_WH_RETURNS child organization gives Retail's warehouse users two
  organizations, and the form sent none; fixed with an organization choice), 5 skipped; walks 111 passed, 2 failed
  (WarehouseFacilitiesWalk's Owner default, the same cause, fixed; AccountingTaxWalk's period taken in another zone than
  the invoice's book day, fixed), 1 skipped. Screen lint: no flagged site in Warehouse.
- Wave 7 (P13, P16, P17), run at 03:31 UTC on Nov 1: Mantle 1,367 passed, 0 failed; BOSS 1,547 passed, 0 failed, 5
  skipped; walks 124 passed, 0 failed, 1 skipped. Screen lint: no flagged site in Warehouse.
- Final `./moq test-all` (no `--slow`), after P18 and the test-all fixes, run at 08:38–09:07 UTC on Nov 1:
  - `moqui test` (all components) 3,504 passed, 0 failed, 3 ignored, 7 skipped.
  - `moqui test demo`, opt-in host tests, `scripts/moq-test.sh`, and the webroot and dev-aide offline client tests
    passed.
  - cargo: only the two l10n catalog tests failed, because mr-l10n is not in this runtime (environment).
  - `moqui test-client --serve` 354 passed, 1 failed: Monitoring's copy hit a race, posting before the qvt page set
    its session token. Fixed in mr-moqui (`wh/mon`); Monitoring then passed 19 of 19.
  - Earlier runs crossed local midnight and then the end of daylight saving in US Central. The fixes, all merged before
    this run:
    - Book days and tax months by the user's day.
    - Demo specs find rows by filter.
    - A fiscal period term finds a period by id and makes none; before, it cloned the parent's first month.
    - OrderBulk's random order uses its own product.
    - Invoice due dates are counted on calendar days, not with the script engine's local Date setters, which are an
      hour off on a change day.
  - A full mr-boss run in the DST fix's worktree also had one order-dependent WarehouseIsolationWalk failure
    (`warehouse.read` scanned record 100053), which passed alone and did not recur in this run.
- `./moq test-all` again after merging origin's Comms changes and rebuilding, 10:20–10:48 UTC on Nov 1:
  - Every step passed except cargo. `moqui test` had 3,553 passed, 0 failed, 3 ignored and 7 skipped; the
    `--serve` client tests had 360 passed and 0 failed.
  - cargo's one failure was moqui-git's large-object push: the connection was reset once under the workspace's
    parallel load. It passed in 8 later runs (5 alone, 3 with all of moqui-git).
  - The run before it had three failures, each fixed:
    - mr-l10n is missing from the runtime: the catalog tests now skip with a note.
    - The Rust service registry test lacked origin's four new services.
    - AccountingTermDueDays' bank account was made current from the real time, so it was not yet current at the
      spec's pinned clock.
    - webroot's Chromium was killed at startup; all 358 passed when run again.

### P0 verification — Oct 31, 2026

The remaining P0 checks, F35–F46. Mantle paths are under `runtime/components/addon/mr-mantle/`, BOSS paths under
`runtime/components/addon/mr-boss/`.

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
### P3 build — Oct 31, 2026

**Built.**
- Mantle, WH-POLICY the rest (`mantle.facility.WarehousePolicyServices`, `WarehousePolicy.js`): the operation and
  reservation families on WarehousePolicy (receipt and delivery steps, receiving, quarantine and staging locations,
  over-receipt and over-shipment percent defaulting to zero, the `WarehouseBackorder` choice, blind counts, auto-print;
  reservation order and automatic timing), all audit-logged; `store#OperationPolicy` and `store#ReservationPolicy`
  (STOCK_POLICY_MANAGE, one dated-row writer shared with `store#TrackingPolicy`); `resolve#WarehousePolicy` answering
  every family with `trace` (each value's level: organization, facility, store, product, facility product, location type,
  default), `warnings` and `canManage`, its tracking answer unchanged for Products; `update#StoreReservation` (the
  field-scoped ProductStore override); `preview#FacilityReservations` (what `check#FacilityReservations` would repair,
  read only); `get#ReservationDefault`, read by Mantle's reservation where the store leaves the setting unset (F95, F96).
- Mantle asset pools (`mantle.product.AssetPoolServices`, `AssetPools.js`): find, get, store pool, store party and
  store members with dates (`get#AssetPools` honors them, F97), `preview#AssetPoolReservations`.
- BOSS: Warehouse/Settings (Index), StockPolicies (OperationPolicy, TrackingPolicy, ProductTrackingExceptions,
  PolicyPreview), ReservationPolicies (FacilityReservation, StoreReservation, ReservationCheck), AssetPools (PoolList,
  PoolDetail), and `screen/Shared/FacilityDetail/Policies.xml`; `ironstone.warehouse.PolicyServices` (reads and shapes,
  `Policies.js`); `template/WarehousePolicyParts.xml` (the change transitions after `check#Record` with policyManage or
  policyPlan, the scope form, the operation and reservation forms, the trace and history lists).
- Demo: Retail's organization operation policy (three-step delivery) and the KEY-ACCOUNTS pool (CustJqp, POPC_DEFAULT).
- The inventories' Implemented-in cells for the AssetPool forms and the policy and pool services.

**For later phases.** Read the operation policy through `resolve#WarehousePolicy`'s `operationPolicy` at posting (F101):
P7 receipt steps, receiving and quarantine locations, over-receipt and short receipts; P9 putaway after a receiving
location; P10 blind counts; P11–P13 delivery steps, staging, over-shipment, backorder and auto-print. P5 builds the
ReservationCheck and pool repairs under its guard. P2's merge: wire the Policies tab (below) and add the closed-location
refusal to `validators.operation` (F100). P10 adds CountSchedule as another tab of StockPolicies.

**Wiring at merge.** None: P2's FacilityDetail discovers its tabs from the `screen/Shared/FacilityDetail/` directory, so
`Policies.xml` (default-menu-index 7, after Printers and before Schedules) drops in (F111); the tab declares `facilityId`
(required) and `appRoot`, which FacilityDetail passes, and checks the facility itself (`get#PolicyContext`). It includes its own transitions
(`storeOperationPolicy`, `storeReservationPolicy`), so it needs nothing else from the parent; its standalone render is in
WarehousePolicies.

**Verified.** Mantle: WarehouseOperationPolicy and WarehousePolicy 22/22; F28's ShipmentReturnMisc, ShipmentPick,
ShipmentLoads, CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow,
ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices, OrderToCashTime and
WarehouseStockChecks 127/127. BOSS: WarehousePolicies, WarehouseAccess, WarehouseShell, AppStructure, TuiRender,
ProductsInventory, ProductsAccess and ProductsSharedContext pass; ClientWrites fails only on P1's `select#Facility`
(F102, fixed on master). Client: WarehousePoliciesWalk 4/4. Screen lint: no flagged site in the new screens
(information-level extension anchors only).

**Commits.** mr-mantle `f13b3987`, `21bcca66`; mr-boss `3b08816` and `cd60210`.

**Review fixes** (Oct 31, F103–F113). Step 1: the reservation default cached with one facility and organization
fallback in all three reservation services; dated changes copy the row in effect at their start; a pool's stores are its
organization's; an empty member end keeps a scheduled one (`clearThruDate` reopens); a store's policy follows its
organization and inventory facility; specs of the facility default's timing and of F96. Step 2, after merging master (P2):
the guard and pools on P2's `FacilityScope.js`; closed locations (F112), with `operationPolicy` among P2's close
blockers. The Policies tab drops into P2's FacilityDetail directory with no wiring (F111); AppStructure renders it among
FacilityDetail's tabs. Verified: WarehouseOperationPolicy, WarehousePolicy and WarehouseFacilities 42/42; F28 with
WarehouseStockChecks 127/127; BOSS WarehousePolicies, WarehouseAccess, ClientWrites (now passing), AppStructure, TuiRender, WarehouseFacilities, WarehouseShell and ProductsInventory 164/164; client WarehousePoliciesWalk and WarehouseFacilitiesWalk 8/8. Commits: mr-mantle `db1801f9`, the merge, `83315e18`;
mr-boss `4aafa77`, the merge and the step 2 commit.

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
WarehouseFacilities, ClientWrites, AppStructure, TuiRender and ProductsInventory. Master (P3) merged again after the fixes;
then Mantle WarehouseTraceability, WarehouseFacilities, WarehouseOperationPolicy, WarehousePolicy, WarehouseStockChecks,
ProductStockTotals, F28's specs and AccountingFixedAssets 192/192; BOSS WarehouseInventory, WarehouseAccess, WarehouseShell,
WarehouseFacilities, WarehousePolicies, ClientWrites, AppStructure, TuiRender, ProductsInventory, ProductsSharedContext,
ProductsAccess, RecordFiles and AccountingFixedAssets 232/232; walks WarehouseInventoryWalk, WarehouseFoundationWalk,
WarehouseFacilitiesWalk, WarehousePoliciesWalk and ProductsInventoryWalk 17/17. Commits: mr-mantle `ef5c0a1a` (scope on
FacilityScope), `a5b68676` (review), and the merges; mr-boss `bdfd505` and `0e5f87e` (the merges, with the routing and
exports resolution) and `41d83d3` (review).

### P5b build — Oct 31, 2026

The Mantle and BOSS part of P5 (P5a, the framework, is above).

**Built.**
- Mantle, WH-POST: the posting guard `service/mantle/shipment/StockPosting.js` (begin: permission, then the operation key on
  PostingOperation scoped per user and operation, answering a retry first; stock; destination with
  `check#FacilityLocationOpen`; `keepHeld`; expiry warnings; `movedTo`; `recheckReservations` (F38); `complete`; `batch`) and
  the entry points of `mantle.shipment.WarehouseTaskServices`: `move#Stock`, `relocate#Assets`, `attach#AssetToContainer`,
  `detach#AssetFromContainer`, `move#Container` (all or nothing) and `repair#FacilityReservations`, each checking
  `STOCK_MOVE` (the repair `STOCK_POLICY_MANAGE`) and answering one `result`. The CX-POSTING fields `enteredQuantity`,
  `enteredQuantityUomId`, `appliedConversionFactor` on AssetReceipt, AssetIssuance and ShipmentItemSource (F7,
  `entity/WarehouseTaskEntities.xml`). `preview#FacilityReservations` answers `previewFingerprint`.
- Mantle, WH-EXPIRY: `WarehousePolicyServices.get#ExpiryGate`, `get#AssetExpiry`, `check#AssetExpiryGate` over the tracking
  policy's `expiryBlock` (F415), off by default; `reserve#AssetForOrderItem` skips expired stock and names the shortfall
  (`expiredShortfall`, `expiredSkipped`, the `EXPIRED_SHORTFALL` warning; F153); `issue#AssetReservation`,
  `issue#AssetToWorkEffort` and `issue#Asset` refuse an expired asset with its date.
- BOSS: the Transfers area with Move (MoveSelect with a scan, MoveContents with reserved and available, MoveConfirm,
  RecentMoves; a production run's staging context; Transfers for another facility); the Handheld area at
  `density="handheld"` with HandheldHome and Move mounted as HandheldMove (the bin scan's id is the operation key);
  `AccessServices.resolve#Scan`, the resolver of every Warehouse scan, with Home's ScanOrPack a scan input; Relocate on
  Assets and on Availability's Locations and lots (`template/WarehouseMoveParts.xml`, a result per asset; F416);
  ContainerDetail's AddOrRemoveAsset (Put stock in, Take out) and MoveContainer; ReservationCheck's repair; a Move link on
  AssetDetail; `ironstone.warehouse.MoveServices` (`Moves.js`). `Warehouse.js` gains only the `Transfers/Move` shared link.
- docs/WarehouseImplementation.md "Posting guard and moves (P5)": how a later entry point is written; the inventories'
  Implemented-in cells (the MoveAsset, SelectAsset, MoveContainer, EditContainer and BasicHandheld forms; `move#Asset`,
  `check#ScanLocation`, `get#ScannedIdGeneral`, `check#FacilityReservations` and the new services).

**Not built.** Product-level moves (`move#Product`; Move chooses an asset, §4); a container as the desk MoveConfirm's
destination (the handheld bin scan and ContainerDetail take one); PackShipment on HandheldHome (P12) and the other handheld
tasks (their phases); transfers between facilities (P15: `Transfers/Transfers` says so); the period step of value postings
(P6, with its first caller, §4).

**For later phases.** Write each stock task as a WarehouseTaskServices entry point with StockPosting.js's steps and its
transition as Move's (`check#Record`, then the entry point with the scan id or a render token); a handheld task is the desk
screen mounted under `Warehouse/Handheld` reading `handheldMount`. P6 adds the period step and writes the entered-quantity
fields' first users with P7; P8's `dispose#Inspection` is the only way out of AstQuarantine; P15 receives a move to
another facility as a transfer.

**Verified.** Mantle: WarehouseMoves 8/8 and WarehouseExpiry 5/5; with F28's ShipmentReturnMisc, ShipmentPick,
ShipmentLoads, CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow,
ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and
WarehouseStockChecks, WarehousePolicy, WarehouseOperationPolicy, WarehouseFacilities, WarehouseTraceability,
ProductStockTotals and AccountingValuation, 209/209. BOSS: WarehouseMoves, WarehouseAccess, ClientWrites, ClientIsolation,
WarehouseInventory, WarehousePolicies, WarehouseShell, WarehouseFacilities, ProductsInventory, ProductsSharedContext,
ProductsAccess, AppStructure and TuiRender 247/247. Client: WarehouseMovesWalk 4/4 (Handheld Move at 390 px), with
WarehouseFoundationWalk (its lookup now a scan), WarehouseInventoryWalk, WarehousePoliciesWalk and ProductsInventoryWalk
17/17. Screen lint: no flagged site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `8753ef6a`; mr-boss `4b840b1`, `a68caf3` and the docs commit.

**Review fixes** (Oct 31, F418–F426): master merged into wh/p5b in both repositories (docs only). Status changes only by a
flow (a partial move out of the morgue is refused); `settled` after the locks; one lock order (containers, assets by id,
the location); `move#Asset`'s `newAssetId`; the stored row's type and user compared; the expiry gate cached before any
asset read, the facility owner's policy for reservation, off for purchase returns; the one-owner container check in
`destination`; `relocate#Assets` an operation of its own; descriptions without screens; Relocate's empty rows warned;
Take out's message. The refused transition's 500 is the framework's JSON rule (F418), reported for mr-moqui. Verified:
Mantle WarehouseMoves 10/10 and WarehouseExpiry 6/6, with F28's specs and the Warehouse, ProductStockTotals and
AccountingValuation specs 212/212; BOSS the same 13 specs 247/247; walks WarehouseMovesWalk, WarehouseFoundationWalk,
WarehouseInventoryWalk, WarehousePoliciesWalk and ProductsInventoryWalk 17/17; screen lint with no flagged site in the
Warehouse screens. Commits: the merges and `fix(warehouse): P5b review: ...` in both repositories.

### P6 build — Oct 31, 2026

**Built.**
- Mantle (`mantle.shipment.WarehouseTaskServices`, on StockPosting.js; rules in `service/mantle/shipment/StockAdjustments.js`):
  - Adjustments: `preview#StockAdjustment` (read only; the exact bucket of `define#AdjustmentScope`, location and lot each a
    value, None or Any, F156; before, change and after as of the effective date; the assets reached; `previewFingerprint`;
    value only with `ACCOUNTING_VIEW`, unavailable when a reached asset has no cost) and `adjust#Stock` (`STOCK_ADJUST`; the
    bucket's assets locked by id, `PREVIEW_CHANGED` after a movement, the period step, then `record#PhysicalInventoryQuantity`
    or `record#PhysicalInventoryChange` on a PhysicalInventory of its own, F157; a retry answers the first).
  - WH-SCRAP: `scrap#Asset` (`STOCK_ADJUST`; free stock only; an optional morgue location first through `move#Asset`; a scrap
    reason; `PhysicalInventory.scrapIndicator` on one PhysicalInventory per operation, F5, posting by its reason through
    Accounting P13's poster).
  - WH-EXPIRY corrections: `correct#LotMetadata` (number, manufacturer, dates, expiry; old and new values, reason and user in
    the audit log; `LOT_EXPIRY_EXTEND` for an extension, `STOCK_ADJUST` otherwise; the lot's assets follow, F158; no
    quarantine released). `Lot.manufacturedDate` and `Asset.expectedEndOfLife` audit-logged on update.
  - Repack: `preview#Repack` and `repack#Asset` (`STOCK_MOVE`; Products' packaging through `resolve#ScannedProduct`, F161;
    `issue#AssetToWorkEffort` into an organization-owned WepAssembling work effort and `receive#Asset` out of it with the lot
    and the issued cost ÷ target quantity, netting to zero through the GL SECAs; CX-PRODUCTION's
    `AssetReceipt.sourceAssetIssuanceId`, with the entered quantity and conversion factor).
  - The period step `StockPosting.js` `period` (PostingGuard.js's `fiscal`; F155) and an any-of permission in `begin`.
- BOSS: `Warehouse/Inventory/Adjustments` (AdjustmentScope, Adjustment with Preview and Post adjustment, the Scrap dialog,
  recent adjustments), `Warehouse/Transfers/Repack` (RepackSource with a scan, the target and quantity, RepackConfirm,
  recent repacks), Lots' Correct dialog and corrections list, and the Record adjustment, Scrap and Correct actions P4 left
  (AssetDetail, Move's Scrap instead, Movements' Correct, the Lots expiry list's Scrap), over
  `ironstone.warehouse.AdjustmentServices` (`Adjustments.js`: `get#AdjustmentContext`, `get#RepackContext`,
  `get#LotCorrections`). `Warehouse.js`: a scrap's PhysicalInventory is not a count record; `sharedLinks` gains
  `Inventory/Adjustments` and `Transfers/Repack`. Demo: the twelve-pack `BOSS_WH_SEAL_CASE` of the sealant with five cases of
  lot SEAL-2026-C (`BOSS_WH_CASES`), the closed fiscal month June 2024 of ORG_ZIZI_RETAIL, and the scrap account on
  ORG_ZIZI_CORP's inventory mapping (`DemoServices.load#WarehouseDemo`, F159).
- docs/WarehouseImplementation.md "Adjustments, scrap and repack (P6)"; the inventories' Implemented-in cells (FindSummary
  PhysicalManualChange, PhysicalChange RecordChange, PhysicalQuantity RecordQuantity, EditLots LotList; the record services,
  `issue#AssetToWorkEffort`, `resolve#ScannedProduct` and the new entry points).

**Not built.** Repack at handheld density (§7); re-reserving after an adjustment below the reserved quantity (F160, §7);
an owner other than the facility owner as Any in AdjustmentScope (F156); a pool selector on AdjustmentScope (the entry
point takes `assetPoolId`; no pool choice source exists in the Inventory choices); lot labels (P13).

**For later phases.** A value-posting entry point (P7 receive, P10 `post#Count`, P11 issue, P16) calls `posting.period` with
the organizations it posts to and its effective date. P10's Counts, CountVariance and `post#Count` leave out
`PhysicalInventory.scrapIndicator = 'Y'`; `record#PhysicalInventory*` stay compatible (adjust#Stock passes its own
PhysicalInventory). P8's scrap disposition needs a way past scrap's quarantine refusal (F163). P16 and P17 may read
`sourceAssetIssuanceId` (F162).

**Verified.** Mantle: WarehouseAdjustments 6/6; with F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads,
CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow,
ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and WarehouseMoves,
WarehouseExpiry, WarehouseStockChecks, WarehouseTraceability, WarehouseFacilities, AccountingValuation and
ProductStockTotals, 191/191. BOSS: WarehouseAdjustments, WarehouseAccess, AppStructure, TuiRender, ClientWrites,
ClientIsolation, WarehouseInventory, WarehouseMoves, WarehouseShell, WarehousePolicies, WarehouseFacilities,
ProductsInventory, ProductsSharedContext, ProductsAccess and AccountingValuation 263/263. Client: WarehouseAdjustmentsWalk
4/4, with WarehouseFoundationWalk, WarehouseInventoryWalk and WarehouseMovesWalk 15/15. Screen lint: no flagged site in
the new or changed Warehouse screens.

**Commits.** mr-mantle `a781658d`; mr-boss `eec4610` and the docs commit.

**Review fixes** (Oct 31, F165–F174): master merged into wh/p6 (docs only). Repack refuses held (F167) and ownerless (F173)
stock and receives the issued value exactly, the last unit at the remainder's cost (F166); every adjustment posts the locked
plan through `record#PhysicalInventoryChange` in the preview's order (F165), refusing scrap reasons (F168) and equipment
(F172); Repack's targets come from the repack's resolver at every level (F169); `preview#Repack` reads unlocked and shows an
unknown cost as unavailable (F170); the period step's locks are documented (F171); the unused-lot gap recorded (F174).
Verified: Mantle WarehouseAdjustments 8/8, with F28's specs and the Warehouse, AccountingValuation and ProductStockTotals
specs 193/193, and AccountingPeriodClose 8/8; BOSS WarehouseAdjustments, WarehouseAccess, AppStructure, TuiRender,
ClientWrites, WarehouseInventory and WarehouseMoves 132/132, and WarehouseShell, WarehousePolicies, WarehouseFacilities,
ClientIsolation, ProductsInventory, ProductsSharedContext, ProductsAccess and AccountingValuation 132/132; walks
WarehouseFoundationWalk, WarehouseInventoryWalk, WarehouseMovesWalk and WarehouseAdjustmentsWalk 15/15; screen lint with no
flagged Warehouse site. Commits: the merge and `fix(warehouse): P6 review: ...` in both repositories.

### P10 build — Oct 31, 2026

**Built.**
- Mantle, WH-COUNT: PhysicalInventory's count fields (mode, blind flag, assignee, planned date, source, schedule, the scope by
  location type, area, location, product, category, lot and ABC class, scope and review versions, started, submitted, reviewed
  and completed) and PhysicalInventoryCount's (status, exact asset identity, snapshot quantity and time, counter, skip reason,
  recount number, count-time balance, movements since, conflict, approved delta and reason, reviewer, posted delta, asset,
  AssetDetail and outcome), `FacilityLocation.lastCountDate`, `ProductFacility.lastCountDate` (`entity/InventoryCountEntities.xml`,
  its own extend blocks beside P6's); the count and line status flows with PICancelled, CountMode, CountSource,
  CountScheduleKind and CountSkipReason (`data/InventoryCountData.xml`); the WarehouseCountsDue topic and the nightly
  `notify_DueCounts` job (`data/InventoryCountSetupData.xml`).
- `mantle.product.InventoryCountServices` (`InventoryCounts.js`): `create#`, `update#`, `start#Count` (the scope snapshotted,
  AstMorgue left out), `record#CountLine` (observation only; found stock; increment with an operation key), `submit#`,
  `cancel#Count`, `review#`, `recount#Count`, `resolve#CountConflict`, `post#Count` through StockPosting.js (`begin`,
  buckets via `post#CountLines`/`fail#CountLines`, `complete`; the `posting.period` slot), `get#Count` and `find#Counts`
  (blind quantities withheld, values with ACCOUNTING_VIEW), `find#DueCounts`, `notify#DueCounts`, `request#Count`,
  `import#CountLines` (row results as CSV), `find#CountVariance`. `record#PhysicalInventoryQuantity` is unchanged.
- The count schedule: `mantle.facility.CountSchedule`, `WarehousePolicyServices.store#CountSchedule` and
  `find#CountSchedules` (`CountSchedule.js`, STOCK_POLICY_MANAGE, dated rows, audit-logged under the reason). P2's close
  blockers take the count statuses (F239).
- BOSS: the Counts area (Counts with the Due saved find, New count and Count now; CountDetail; CountEntry, the desk grid, found
  stock and the CSV import with its row-result file, mounted as HandheldCount at `Handheld/Count` with one line at a time;
  CountReview with Review, ResolveConflict, Recount and PostCount; CountSheet, the blind and variance sheets), Reports with
  CountVariance (linked from Counts), StockPolicies' Count schedule tab, Request a count on Assets and on Availability's
  Locations and lots, Handheld Home's Count task, Home's count queue and the assignee's counts, the Warehouse Today source
  (`HomeServices.get#TodayItems`, `Today.js`), the WarehouseCountsDue link; `ironstone.warehouse.CountServices`
  (`Counts.js`) and `template/WarehouseCountParts.xml`; `Warehouse.js` gains `destinations.count`, two `sharedLinks` and the
  count link rule (F242). Demo: BOSS_WH_COUNT a planned blind cycle count, ZIRET_WH's three schedule rows.
- docs/WarehouseImplementation.md "Counts (P10)"; the inventories' Implemented-in cells.

**Not built.** The count quick create; the calendar view of Counts; Clone; the handheld scan-quantity mode in the screen
(the service takes `increment` with an operation key); a value total in PostCount (a page's sum would not be the count's).

**Review fixes** (Oct 31, F245–F252): the count scan without quantities (A1, an open question on Inventory in §5); the closed
period refused before anything is written, with a Timestamp, each bucket checking again under the lock, and the count's date
fixed once a line posts (A2); a line refused unless it is of the count named (A3); carry refuses a moved asset, and a quantity
changed since the snapshot or review is a conflict or STOCK_MOVED (B1, B2); the internal bucket services checked (B3); due
counts in three queries per facility, Home's totals only, `truncated` (B4); the picker's recount bounded (B5); `recordOf`
counts only (B6); the C items. Verified: Mantle WarehouseCounts 7/7 (with the STOCK_MOVED-at-post case) with F28's specs, the
Warehouse specs, AccountingValuation and AccountingPeriodClose 234/234; BOSS WarehouseCounts 6/6 (the closed-period post refused
whole, the count scan) with WarehouseAdjustments, WarehouseAccess, WarehouseShell, ClientWrites, ClientIsolation, AppStructure,
TuiRender, WarehouseInventory, WarehousePolicies, WarehouseFacilities, WarehouseMoves, ProductsInventory, ProductsSharedContext,
TodayPanel and Shell 259/259; walks (Counts, Adjustments, Moves, Inventory, Policies, Foundation) 22/22; screen lint with no
flagged site in Warehouse.

**Merge with P6** (Oct 31): master (P6) merged into wh/p10 in both repositories, keeping both sides of the demo data,
WarehouseAccess, the client suite, `Warehouse.js`'s shared links, the plan and docs/WarehouseImplementation.md. Each
`post#Count` bucket now calls P6's `posting.period` (F240) and zero confirmation reads `scrapIndicator` directly. Verified:
Mantle WarehouseCounts and WarehouseAdjustments with F28's specs, the Warehouse specs, AccountingValuation and
AccountingPeriodClose 233/233; BOSS WarehouseCounts (with the closed-period post) and WarehouseAccess 91/91, and with
WarehouseAdjustments, WarehouseShell, ClientWrites, ClientIsolation, AppStructure, TuiRender, WarehouseInventory,
WarehousePolicies, WarehouseFacilities, WarehouseMoves, ProductsInventory, ProductsSharedContext, TodayPanel and Shell;
walks WarehouseCountsWalk, WarehouseAdjustmentsWalk, WarehouseMovesWalk, WarehouseInventoryWalk, WarehousePoliciesWalk and
WarehouseFoundationWalk 22/22.

**For later phases.** P11 calls `request#Count` with `countSourceEnumId` CntSrcShortPick (and `sourceReference`) in its
short pick; P8 and P11 add their Today items as sources of `Today.js`; P17's reports join `Reports.xml` beside CountVariance.
The period step is in place since the merge with P6 (below).

**Verified.** Mantle: WarehouseCounts 6/6; with F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices,
AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices,
InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and WarehouseStockChecks, WarehousePolicy,
WarehouseOperationPolicy, WarehouseFacilities, WarehouseTraceability, WarehouseMoves, WarehouseExpiry, AccountingValuation
and AccountingPeriodClose, 224/224. BOSS: WarehouseCounts, WarehouseAccess, WarehouseShell, ClientWrites, ClientIsolation,
AppStructure, TuiRender, WarehouseInventory, WarehousePolicies, WarehouseFacilities, WarehouseMoves, ProductsInventory,
ProductsSharedContext, TodayPanel and Shell 243/243. Client: WarehouseCountsWalk 3/3 (Handheld Count at 390 px) with
WarehouseMovesWalk, WarehouseInventoryWalk, WarehousePoliciesWalk and WarehouseFoundationWalk, 18/18. Screen lint: no flagged
site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `bd5c188f`, `089f33d1`, `39ae3200`; mr-boss `afef006`, `78ccf02` and the docs commit.

### P7 build — Oct 31, 2026

**Built.**
- Mantle, WH-POST's receipt entry points (`mantle.shipment.WarehouseTaskServices`, on StockPosting.js, whose `begin` now takes
  a list of permissions, and the new `Receiving.js`): `ensure#PurchaseReceipt` (one open receipt per PO part, STOCK_RECEIVE or
  PURCHASE_ORDER_EDIT, a line in another unit converted to stock units, F176), `adjust#ExpectedReceipt` (Purchasing's
  revision, never below what was received; it waits for a receive in progress, F175), `receive#ShipmentStock` (the receive
  guard over `receive#ShipmentProduct`: the entered unit kept on each receipt, the order line's unit converted, a pack through
  `resolve#ScannedProduct`, lot and serial rules, a dock rejection with nothing accepted, the over-receipt tolerance, the
  receipt step at posting), `receive#ExpectedShipment` ("Receive all as expected", confirmed, through the guard),
  `receive#AdHocStock` (over `receive#Asset`, with a reason), `close#ReceiptRemainder` (close or backorder, then
  `deliver#Shipment`) and `generate#TrackingIdentities` (the uniqueness preview). Purchasing's
  `mantle.order.OrderServices.close#PurchaseRemainders` (`PurchaseRemainders.js`, PURCHASE_ORDER_EDIT) with the internal
  `mantle.other.BudgetServices.release#ClosedSourceCommitments`. The PURCHASE_ORDER_EDIT permission and the
  WarehouseReceiptException topic (MantleSetupData). The incoming bill SECA is Accounting's, unchanged; the AssetReceipt
  match EECA exists (P0), nothing built there.
- BOSS: the Receiving area (placeholder replaced): Receipts (ReceiptFind, ReceiptList as list, board and calendar, New
  receipt), ReceiptDetail as `Shared/ShipmentDetail`'s Warehouse branch (`template/WarehouseReceiptDetail.xml`: header with
  Receive, Finish receipt, Receive all as expected, the supplier and the receipt and rejected-goods documents; lines,
  receipts, files, conversation), Receive (ReceiveSource, ReceiveLine, GenerateTracking, AdHocReceipt, ReceiveRemaining),
  HandheldReceive (Receive at `Handheld/Receive`, the receipt and product scans), NewReceipt (quick create), ReceiptDocument
  (print); Supplier360's Warehouse branch (Receiving and Conversation tabs, no price); `ironstone.warehouse.ReceiptServices`
  (`Receipts.js`, reads only) and `template/WarehouseReceiptParts.xml`; `Warehouse.js`: the Receiving `sharedLinks` and a
  purchase or return shipment's record link to ReceiptDetail; Products' `SharedContext.js`: the ReceiptDetail link of
  Warehouse's Supplier360; Home counts the receiving queue; the quick create's artifact group `BOSS_WH_NEW_RECEIPT`
  (BossSetupData). Demo: `BOSS_WH_PO` (BossWarehouseDemoData).
- docs/WarehouseImplementation.md "Receiving (P7)"; design-warehouse §4 Receive's as-built note; the inventories'
  Implemented-in cells (ReceiveForm, ReceiveAssetForm, NewIncomingShipment, ShipmentList; `receive#ShipmentProduct`,
  `receive#Asset`, `create#OrderPartShipment`, `update#ShipmentItem`, `deliver#Shipment`, `cancel#OrderItem`,
  `receive#EntireShipment` as not called, and the new services).

**Not built.** The inspection of a step-3 receipt (P8: it posts into quarantine) and ReceiptDetail's Inspection and Tracking
parts (P8, P13); receiving a return's or transfer's lines (P14, P15: Receive refuses them, RECEIPT_TYPE); a partial expected
receipt of some lines (§4); ReceiptInProgress at once (F175, §5); hiding Supplier360's prices tab from the menu (F178, §5);
dragging on the Receipts board and calendar (read only, §4); the receipt confirmation email of design §16 (the documents
print; the exception is a notification).

**For later phases.** P8 calls `create#Inspection` in `receive#ShipmentStock`'s step 3 (Receiving.js `destination`) and adds
ReceiptDetail's Inspection part; P9 replaces step 1's product location with `resolve#Destination`; P14's ReturnReceipt opens
from Receipts (a return's NewReceipt opens its shipment); P15 receives a transfer's leg through the guard, summing issuances
and receipts apart (F37); Purchasing calls `ensure#PurchaseReceipt`, `adjust#ExpectedReceipt` and `close#PurchaseRemainders`
and gives its groups PURCHASE_ORDER_EDIT; Manufacturing's ReceiveOutput uses `generate#TrackingIdentities`.

**Verified.** Mantle: WarehouseReceiving 9/9; with OrderProcureToPayBasicFlow, AccountingPayables, AccountingMatching,
AccountingBudgets, F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices, AssetReservationMisc,
OrderToCashBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and
OrderToCashTime, and WarehouseMoves, WarehouseExpiry, WarehouseStockChecks, WarehouseOperationPolicy, WarehousePolicy,
WarehouseFacilities and WarehouseTraceability, 240/240. BOSS: WarehouseReceiving 5/5; with WarehouseAccess, WarehouseShell,
AppStructure, TuiRender, ClientWrites, ClientIsolation, WarehouseMoves, WarehouseInventory, WarehouseFacilities,
WarehousePolicies, ProductsSuppliers, ProductsSharedContext, ProductsAccess, ProductsInventory, AccountingPayables,
AccountingScreens, AccountingMatching, QuickCreate and Shell, 316/316. Client: WarehouseReceivingWalk 3/3 (Handheld Receive
at 390 px), with WarehouseMovesWalk, WarehouseFoundationWalk and ProductsSupplierWalk 12/12. Screen lint: no flagged site
in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `0ea9c85a`; mr-boss `7fc83f6`, `7e77fd4` and the docs commit.

**Review fixes** (Oct 31, F186–F194): master merged into wh/p7 twice in both repositories (P6, then P10), keeping both sides
(one `requirePermission`, both WarehouseTaskServices blocks, `Warehouse.js`'s link paths and record links, Handheld at
Receive 3 and Count 7, the Tasks label, Home's queue rows as copies, the client suite, the plan, the inventories and
docs/WarehouseImplementation.md). A1 Mantle's order quantities in stock units through the line's factor; B1 one lock order;
B2 the non-locking period check in the receipts; B3 pattern sequences go on; C2 EXISTING's facility, the empty backorder
cancelled; C3 the close scoped to its receipt; C4 the step 2 location and serials on hand; C5 the calendar-day overdue, the
last destination, one read of receipt rows; C6 the ad hoc cost; C7 long lines; C8 the prices tab checked. Verified: Mantle
WarehouseReceiving 12/12 (the dozens close, factor 1 by default, the empty backorder, the scoped close, the step 2 refusal,
the sequence, the cost and the closed period) with OrderProcureToPayBasicFlow, AccountingPayables, AccountingMatching,
AccountingBudgets, AccountingPeriodClose, AccountingValuation, F28's specs, WarehouseCounts, WarehouseAdjustments, the other
Warehouse specs and ProductPackaging 290/290; BOSS WarehouseReceiving, WarehouseCounts, WarehouseAdjustments,
WarehouseAccess, WarehouseShell, AppStructure, TuiRender, ClientWrites, ClientIsolation, WarehouseMoves, WarehouseInventory,
WarehouseFacilities, WarehousePolicies, ProductsSuppliers, ProductsSharedContext, ProductsAccess, ProductsInventory,
AccountingPayables, AccountingScreens, AccountingMatching, QuickCreate, Shell and TodayPanel 348/348; walks
WarehouseReceivingWalk, WarehouseCountsWalk, WarehouseAdjustmentsWalk, WarehouseMovesWalk, WarehouseFoundationWalk and
ProductsSupplierWalk 19/19; screen lint with no flagged Warehouse site. Commits: the merges, mr-mantle and mr-boss
`fix(warehouse): P7 review: ...`.

### P9 build — Oct 31, 2026

**Built.**
- Mantle, WH-PUTAWAY (`entity/PutawayEntities.xml`, `data/PutawayData.xml`, `mantle.facility.PutawayServices` over
  `service/mantle/facility/Putaway.js`): `mantle.facility.PutawayRule`, dated and audit-logged, with storage-type,
  product, category and source applicability and a location or a location type (and area) as destination, priority and an
  optional capacity; the `StorageType` enumeration on `Product` and `FacilityLocation`; `store#PutawayRule` (FACILITY_EDIT
  in the facility's organization) and `find#PutawayRules`; `resolve#Destination` (the default location first, then the
  rules by priority, every candidate checked for open, storage location and quarantine, status flow, storage type, owner
  and capacity with what is coming, and explained; NO_DESTINATION with the reasons); `get#Capacity` (capacity in the
  location's unit, occupied, incoming, remaining, unmeasured).
- Mantle, the putaway entry point `WarehouseTaskServices.putaway#Stock` (StockPutaway, STOCK_MOVE) on StockPosting.js's
  steps: the suggestion or another location with a reason, the destination checked again under its lock, quarantined stock
  only within quarantine, the receiving hold released in storage through `update#Asset` by its flow. A one-step receipt
  (Receiving.js step 1, `receive#ShipmentStock` and `receive#AdHocStock`) posts to the resolved destination, else the
  receiving location, with `putawayExplanation`. A putaway rule naming a location blocks its close (`blockersOf`
  `putawayRule`); `store#FacilityLocation` takes the storage type.
- BOSS: Receiving/Putaway (PutawayQueue by age and the suggestion's pick sequence with each suggestion or reason;
  Destination with the explanation, Locations tried and Confirm move: `check#Record` asset with move, then
  `putaway#Stock`), mounted at Handheld/Putaway (the stock scan, the suggestion, the bin scan with confirm as the operation
  key); Receiving/PutawaySheet (html-print); Locations/PutawayRules (RuleList with New rule, Change, End; RuleTest);
  `ironstone.warehouse.PutawayServices` (`Putaway.js`, reads); the location's storage type on FacilityDetail's Locations
  tab; Home's putaway ready and late counts; Receive's step-1 putaway message; `Warehouse.js` sharedLinks
  `Receiving/Putaway` and `Locations/PutawayRules`. Demo: the sealant's default pick bin `01020301` (capacity 40), the bay
  `01020302` (200) and the rule `BOSS_WH_PR_SEAL`.
- docs/WarehouseImplementation.md "Putaway (P9)"; usl-inventory's Implemented-in cells (`move#Asset`,
  `check#ScanLocation`, `store#FacilityLocation` and the new services); ss-inventory has no form designed for these
  screens (F222).

**Not built.** The Capacity screen (§7; `get#Capacity` is there); a putaway Today source (no assignment record, F42); a
screen for a product's storage type (§5); a rule that excludes the default location (§5); the putaway part of transfers
and returns (P14, P15 put away through the same entry point).

**For later phases.** P8's released quarantine stock joins the putaway queue (not AstQuarantine in a quarantine
location) and moves within quarantine before release; P11 reads ProductFacilityLocation's `minimumStock` and
`moveQuantity` as before (P9 sets no levels and reads only the location); P14 and P15 put received stock away with
`putaway#Stock`; P17's Capacity screen reads `get#Capacity`; a later Receive could show the step-1 suggestion before
posting through `resolve#Destination`.

**Verified.** Mantle: WarehousePutaway 6/6; with WarehouseReceiving, WarehouseFacilities, WarehouseMoves,
WarehouseOperationPolicy, WarehouseStockChecks and F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices,
AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices,
InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, 191/191. BOSS: WarehousePutaway 4/4; with
WarehouseAccess, AppStructure, TuiRender, WarehouseFacilities, WarehouseReceiving, WarehouseShell, WarehouseMoves,
WarehouseInventory, WarehouseCounts, WarehouseAdjustments, WarehousePolicies, ClientWrites, ClientIsolation,
ProductsInventory, ProductsAccess, QuickCreate, Shell and TodayPanel, 314/314. Client: WarehousePutawayWalk 3/3 (Handheld
Putaway at 390 px), with WarehouseFacilitiesWalk, WarehouseMovesWalk and WarehouseReceivingWalk 14/14. Screen lint: no flagged site in the new or changed screens (information-level
extension anchors only).

**Commits.** mr-mantle `3feb52db`; mr-boss `6a4a89d`, `b92a5f1` and the docs commit.

**Review fixes** (Oct 31, F223–F231): master merged into wh/p9 in both repositories (mr-boss: docs and Comms only). B1 the
hold released only from receiving or staging; B2 only available and on-hold stock (NOT_PUTAWAY); B3 a rule's capacity at a
default location it names; B4 incoming by earlier claim and first default; B5 `explain` false and reads once per
resolution, rules dated in the query; B6 the product's storage type in `store#Product`, clone and variants (design-products);
B7 the receipt's owner; C1 the receipt's bin checked again under its lock (F220 closed); C2 no change of a changed row or
later end; C3 the change dialog's stamp and a rule to come changed in place; C4 product, category and area scoped; C5 the
two-step receipt into the queue; C7 the description wrapped; F219 reworded. Verified: Mantle WarehousePutaway 8/8, with
WarehouseReceiving, WarehouseFacilities, WarehouseMoves, WarehouseOperationPolicy, WarehouseStockChecks, ProductCatalogImport
and F28's specs 203/203; BOSS WarehousePutaway 5/5, with WarehouseAccess, AppStructure, TuiRender, WarehouseFacilities,
WarehouseReceiving, WarehouseShell, WarehouseMoves, WarehouseInventory, WarehouseCounts, WarehouseAdjustments,
WarehousePolicies, ClientWrites, ClientIsolation, ProductsInventory, ProductsAccess, ProductsCatalog, ProductsVariants,
QuickCreate, Shell and TodayPanel 335/335; walks WarehouseReceivingWalk and WarehousePutawayWalk 6/6; screen lint with no
flagged site in the changed screens. Commits: the merges and `fix(warehouse): P9 review: ...` in both repositories.

### P11 build — Oct 31, 2026

**Built.**
- Mantle, WH-PICK (`mantle.shipment.WarehouseTaskServices`, `service/mantle/shipment/Picking.js`, on StockPosting.js):
  `pick#ShipmentStock` (one line through `pickMove#ShipmentProduct`, which gains `shipmentItemSourceId` and `pickedMoveList`),
  `record#ShortPick` (the new `mantle.shipment.ShipmentPickException` with ShortPickReason and ShortPickResolution, a recount
  through P10's `request#Count` with CntSrcShortPick, the WarehouseShortPick notice; on-hand unchanged), `reverse#Pick`
  (confirmed, to where each pick took it, the reservation travelling), `finish#Pick` (a shipment with backorder, or a load with
  acknowledgement), `create#OutgoingShipment`, `find#PickFaceReplenishment` (the first reader of the pick-face levels, F19);
  `move#Stock` takes `assetReservationId`; `cancel#OrderItem` flags `ShipmentItemSource.putBackQuantity`. The wave and loads
  (`mantle.work.ShipmentWorkServices`, `service/mantle/work/ShipmentLoads.js`): `preview#ShipmentLoadsForOrders`,
  `find#ShipmentLoadCandidates`, `create#ShipmentLoadsForOrders` with an operation key (a result per group through
  `create#ShipmentLoadGroup`; unchanged without one), `store#ShipmentLoad`, `edit#ShipmentLoadMember` (the bin of F18),
  `store#ShipmentLoadAssignment` (people and equipment, P2's left-over). Fixes F255 (`move#Asset` partial out of a container)
  and F256 (`update#ShipmentItem` with a source id). `entity/ShipmentPickEntities.xml`, `data/ShipmentPickSetupData.xml`.
- BOSS: the Picking area (Picklists, PicklistDetail, CreatePicklists, Pick, PickLocationMoves, PickSheet), Handheld/Pick and
  Handheld/PickFace with Handheld Home's tasks, the Shipping area's Shipments (NewOutgoing) and ShipmentDetail (the outbound branch,
  `template/WarehouseShipmentDetail.xml`, beside P7's receipt branch), OrderDetail's Warehouse branch at Warehouse/Orders
  (`template/WarehouseOrderDetail.xml`, money only with ACCOUNTING_VIEW, a held order no new shipment),
  `ironstone.warehouse.PickingServices` (`Picking.js`), `template/WarehousePickParts.xml`, the Today source of overdue picks
  (`Today.js` `loads`), Home's picking queue, the short-pick topic, the `load` record kind (palette, record link, check#Record)
  and the outgoing shipment's link in `Warehouse.js`. Demo: the picklist BOSS_WH_LOAD of the shipment BOSS_WH_SHIP_PICK of order
  BOSS_WH_SO (product BOSS_WH_PICKED, reserved at 01020201), assigned to warehouse.pick.
- docs/WarehouseImplementation.md "Picking (P11)"; the inventories' Implemented-in cells.

**Not built.** Substitution on a short pick (Customer Service's `apply#OrderChange`, later); NewOutgoing from a standalone source
(`create#Shipment`); lot or serial choice on a pick (the reserved asset's is picked); the entered unit other than the stock unit on
a pick; Pack's put back of packed stock (P12); Shipping's Pack, Ship and PackageTracking (P12, P13); a picklist board or calendar
that drags (read only); WH-WAVE's recurring wave rules (§7).

**For later phases.** P12 packs from the picked lines and puts back packed stock (`reverse#Pick` refuses a packed shipment); P13
ships; Customer Service's cancel goes through `cancel#OrderItem` (the line is then flagged for Put back) and its substitution
replaces the line Pick picks; P15 picks a transfer's origin leg with the same entry points.

**Verified.** Mantle: WarehousePicking 7/7; with F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices,
AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices,
InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and WarehouseMoves, WarehouseCounts, WarehouseReceiving,
WarehouseAdjustments, WarehouseStockChecks and WarehouseExpiry, 177/177. BOSS: WarehousePicking 3/3, WarehouseAccess (four P11
features), WarehouseShell, AppStructure and TuiRender; with ClientWrites, ClientIsolation, WarehouseReceiving, WarehouseCounts,
WarehouseInventory, WarehouseMoves, WarehouseFacilities, WarehouseAdjustments, WarehousePolicies, TodayPanel, AccountingScreens,
Billing, Shell and ProductsSharedContext, 271/271. Client: WarehousePickingWalk 3/3 (Handheld Pick at 390 px), with
WarehouseFoundationWalk, WarehouseReceivingWalk, WarehouseInventoryWalk and WarehouseMovesWalk, 17/17. Screen lint: no flagged
site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `80e17d44` and `a5a48660`; mr-boss `9f2b366` and the
docs commit.

**Review fixes** (Oct 31, F261–F264): master merged into wh/p11 in both repositories (P9 Putaway and a design commit), keeping
both sides (Handheld at Putaway 4, Pick 5, Count 7, PickFace 8; `Warehouse.js`'s shared links; the demo data, WarehouseAccess,
the client suite, the plan, docs/WarehouseImplementation.md and usl-inventory). A1 one Replenish per bulk source within its
stock; A2 Handheld Pick and PickFace refused without the Picking capabilities; B1 the line's reservation kept on the picked stock
after a cancel and a cancelled balance's put back; B2 the scanned asset filters the pick; B3 assets locked before the location;
C put backs keyed by their pick, UNTRACKED_PICK, HELD_STOCK always, Create shipment's facility check, OrderDetail's scoped
shipments and line units, the newest shipment candidates, future close dates open, wording. Verified: Mantle WarehousePicking
8/8 with F28's specs, the Warehouse specs (WarehousePutaway included) and OrderLifecycle, 189/195: the six others
(OrderProcureToPayBasicFlow's current fiscal month and WarehouseCounts' annual due date) fail the same without these changes,
run as the day turned in UTC (Nov 1 00:18 UTC). BOSS WarehouseAccess, WarehousePicking, WarehouseShell, AppStructure and
TuiRender 149/151, the two being Accounting's BalanceSheet, CashFlow and FinancialRatios renders at the same UTC day boundary;
ClientWrites, ClientIsolation, WarehouseReceiving, WarehouseCounts, WarehouseInventory, WarehouseMoves, WarehouseFacilities,
WarehouseAdjustments, WarehousePolicies, WarehousePutaway, TodayPanel, AccountingScreens, Billing, Shell and ProductsSharedContext
133/134 (AccountingScreens' BalanceSheet, the same boundary); walks WarehousePickingWalk, WarehousePutawayWalk,
WarehouseFoundationWalk, WarehouseReceivingWalk and WarehouseMovesWalk 16/16; screen lint with no flagged Warehouse site.
Commits: the merges and `fix(warehouse): P11 review: ...` in both repositories.
### P8 build — Oct 31, 2026

**Built.**
- Mantle, CX-QUALITY (`entity/QualityEntities.xml`, `data/QualityData.xml`): InspectionTemplate, InspectionTemplateItem
  (effective-dated characteristics: publishing stamps `fromDate`, a change to a published item ends it and starts a new row with
  its `characteristicId` and `previousItemId`, key fields audit-logged), QualityInspection (source, held asset, quantity,
  `heldQuantity`, sample, template and `templateAsOfDate`, inspector, demand peg, result, verification), InspectionReading,
  QualityInspectionDisposition (§4) and QualityInspectionContent; the template and inspection status flows, the disposition
  vocabulary (Release, Quarantine, Rework or repair, Return to customer, Return to supplier, Scrap, Use as is), contexts,
  sources, reading types, sample policies, results, file types; the tracking policy's `inspectionRequired`; the
  QualityInspectionDecision topic.
- `mantle.product.QualityServices` (`Quality.js`): `store#InspectionTemplate` (QUALITY_TEMPLATE_EDIT), `get#`/`find#`
  templates, `create#Inspection`, `assign#Inspection`, `save#InspectionReading`, `submit#Inspection` (QUALITY_INSPECT),
  `verify#Inspection` (QUALITY_VERIFY, never the submitter), `dispose#Inspection` (QUALITY_DISPOSE, on StockPosting.js: Release
  reserves the pegged demand on the released stock, then `update#Asset` AstAvailable, the only path out of quarantine; Scrap to
  the morgue status, then P6's `scrap#Asset`, which admits the disposition (F163); every disposition queues
  `queue#MatchReevaluation`), `get#`/`find#Inspections`, `get#SourceInspectionStatus` (held, match-eligible, rejected), which
  Accounting's `InvoiceMatch.js` now reads in place of its quarantine stand-in (F31), and `create#InspectionContent`. A receipt
  that needs inspection (step 3, `inspectionRequired`, a published receipt template) posts into quarantine and creates its
  inspections in `receive#ShipmentStock`'s operation (Receiving.js `plan`, one contiguous hook). QualityInspection is a record
  host in `get#RecordLinkInfo`.
- BOSS: the Inspection area (Inspections: list and board by status or inspector, a card moved to another inspector assigns it,
  Reassign names each result; InspectionTemplates with Characteristics, Sampling and applicability, Revision history, As of a
  date, Publish, Retire; TemplatePrint), `Shared/QualityInspection` at `Warehouse/QualityInspection` for every Warehouse user
  (F195, §4: Header, Readings, Result, Disposition, History, Evidence, Conversation; Submit result, Verify, Dispose, Assign),
  the inspection certificate `Warehouse/InspectionCertificate`; `ironstone.warehouse.InspectionServices` (`Inspections.js`) and
  `template/WarehouseInspectionParts.xml`; `Warehouse.js` the `inspection` kind (destination, palette find, record check, scan
  lookup, shared links); `get#RecordLink` for QualityInspection; the Today source's inspections (`Today.js`); Home's inspection
  queue and assigned inspections; ReceiptDetail's Inspection part; the topic's link and shell provider. Demo: `BOSS_WH_TMPL` and
  the draft inspection `BOSS_WH_INSP`.
- docs/WarehouseImplementation.md "Inspection (P8)"; as-built notes in design-warehouse §5 and design-crosscut §3.19; the
  inventories' Implemented-in cells (usl-inventory: `update#Asset` and the QualityServices rows; no mr-marble form maps to
  inspection, so ss-inventory is unchanged).

**Not built.** A New inspection screen action (inspections come from receipts; `create#Inspection` takes an asset, F198, §7);
the template-required release rule and an organization flag for self-verification (§5); Supplier360's rejection evidence;
inspection at handheld density (design §19 Devices; the screen fits a phone).

**For later phases.** P9's putaway moves released stock out of the quarantine location (it is AstAvailable where it was
inspected); P14 creates return inspections (`QisReturn`) and ships Return to supplier stock, lowering its `heldQuantity`; P16 pegs
a run's output through OrderItemWorkEffort; Purchasing, Manufacturing and Customer Service add their contexts to the two shared
screens; planning reads `get#SourceInspectionStatus`.

**Verified.** Mantle: WarehouseQuality 5/5; with AccountingMatching, AccountingPayables, F28's ShipmentReturnMisc, ShipmentPick,
ShipmentLoads, CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow,
ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, the
Warehouse specs (Receiving, Adjustments, Policy, OperationPolicy, Moves, Expiry, Counts, StockChecks, Traceability,
Facilities), RecordLinks, RecordVisibility, AccountingValuation and AccountingPeriodClose, 305/305 (and WarehouseQuality, AccountingMatching,
WarehouseReceiving, WarehouseAdjustments, RecordLinks, RecordVisibility and WarehousePolicy 75/75 after the find fix). BOSS: WarehouseInspections, WarehouseAccess, AppStructure, TuiRender, ClientIsolation, ClientWrites,
WarehouseReceiving, WarehouseShell, WarehouseCounts, WarehouseAdjustments, WarehouseMoves, WarehouseInventory,
WarehousePolicies, WarehouseFacilities, TodayPanel, Shell, AccountingMatching, AccountingPayables, ProductsSharedContext and
QuickCreate 293/293. Client: WarehouseInspectionWalk 3/3 (the reader at 390 px), with WarehouseReceivingWalk, WarehouseFoundationWalk and
WarehouseCountsWalk 12/12. Screen lint: no flagged site in the new or changed screens (information-level extension
anchors only).

**Commits.** mr-mantle `cf47e66e`, `c1b82883`; mr-boss `d83ebbf` and the docs commit.

**Review fixes** (Oct 31, F199–F204): master merged into wh/p8 in both repositories (P9 putaway: Receiving.js `plan()` keeps P9's
`destination(...)` call with P8's step-3 override, both receive#ShipmentStock descriptions, the BOSS files unioned). A1 the demand
peg checked (product, the facility owner's sale, the user's scope) at create and at Release; B1 Release keeps the order item's
reservations; B2 inspection-rejected quantity leaves match-eligible (§4, the orchestrator's call); B3 Inspect again and Cancel
inspection; B4 the receipt's own asset; B5 Inspect on receipt on the tracking form; B6 the self-verification rule kept (§5); C the
unit not posted, the nested key, one open inspection per asset, the re-inspection's held quantity counted once,
`assetStatusId`, long lines. Verified: Mantle WarehouseQuality 8/8 (the forged peg, kept reservations, the receipt's own asset, re-inspection
and cancel), with AccountingMatching, AccountingPayables, WarehouseReceiving, WarehousePutaway, F28's specs, the Warehouse specs,
RecordLinks, RecordVisibility, AccountingValuation and AccountingPeriodClose 301/315: the failures are OrderProcureToPayBasicFlow's
depreciation and inventory features and WarehouseCounts' due dates, which fail the same on master after the run crossed into
November 1 (date-dependent), and WarehousePutaway's setup when run beside WarehousePolicy (both create WHP_ORG; it passes alone,
P9's); BOSS WarehouseInspections, WarehouseAccess, AppStructure, TuiRender, ClientIsolation, ClientWrites, WarehouseReceiving,
WarehousePutaway, WarehouseShell, WarehouseCounts, WarehousePolicies, TodayPanel, Shell, AccountingMatching and
AccountingPayables 227/229 (the two failures are Accounting's financial reports with no November period, date-dependent);
walks WarehouseInspectionWalk, WarehouseReceivingWalk, WarehousePutawayWalk and WarehousePoliciesWalk 13/13; screen lint with
no flagged site in the inspection screens. Commits: the merges and `fix(warehouse): P8 review: ...` in both
repositories.

### P12 build — Oct 31, 2026

**Built.**
- Mantle, the pack entry points of `mantle.shipment.WarehouseTaskServices` (`service/mantle/shipment/Packing.js`, on
  StockPosting.js; `SHIPMENT_PACK`): `pack#ShipmentStock` (PackScan: a line, a product or a scan through Mantle's
  `pack#ShipmentItemSource`, `pack#ShipmentProduct`, `pack#ShipmentProductScan`; the period checked without the lock),
  `pack#ShipmentAssembly` (PackAssembly over `pack#ShipmentAssemblyComponent`), `edit#ShipmentPackage` (create, update, weigh,
  delete, move; box types of the facility), `complete#Pack` (the reconciliation, then `complete#ShipmentPack` with no labels,
  F17; the pack SECA's invoice kept) and `reopen#ShipmentPackage` (Accounting's release first, F275, then
  `unpack#ShipmentItemIssuance`, F11; order parts back to Approved, F281; a final invoice keeps it closed). The kit cost:
  `PartyAcctgPreference.kitCostFromComponents` (off by default) read inside `produce#AvailableAssemblies` through
  `service/mantle/work/KitCost.js` (F41: the issuances' slice, the remainder on its own unit, F166's rule). Box types:
  `mantle.shipment.PackagingServices` (`store#ShipmentBoxType` with `maxWeight` and `thruDate`, `store#CarrierShipmentBoxType`,
  `store#FacilityBoxType`; `FACILITY_EDIT`), `entity/ShipmentPackEntities.xml`. Accounting's `release#ShipmentInvoiceLines`
  (internal; `release#ShipmentDraftInvoice` calls it). Mantle fixes: `unpack#ShipmentItemIssuance`'s `quantity` (F278),
  `cancel#OrderItem`'s handled quantity (F277), `issue#AnyAssetForShipmentItemSource`'s component and work effort issue
  (F282). The preference is in `store#Preferences` and Accounting's preferences form (Kit cost).
- BOSS: `Warehouse/Shipping/Pack` (PackScan, the lines, PackAssembly, PackageEditor, PackageContents, CompletePack,
  ReopenPackage) also at `Handheld/Pack` (menu index 6), `Shipping/PackingSlip` (slip, contents, inserts),
  `Locations/BoxTypes` (BoxTypeList, CarrierBoxCodes), FacilityDetail's Box types tab (`Shared/FacilityDetail/BoxTypes.xml`,
  index 5), `Shared/MaterialIssueReceipt` with the Warehouse context and the shipment assembly source at
  `Inventory/MaterialIssueReceipt` (sources pluggable for P16), ShipmentDetail's outbound Pack and Packing slip and its
  Packages box (F280), Home's packing queue, Handheld Home's Pack; `ironstone.warehouse.PackingServices` (`Packing.js`),
  `template/WarehousePackParts.xml`; `Warehouse.js` the P12 shared links. Demo: the cartons `BOSS_WH_BOX_S` and `_M` (ZIRET_WH's
  box types, UPS code 02), the picked shipment `BOSS_WH_SHIP_PACK`, the kit shipment `BOSS_WH_SHIP_KIT` (`BOSS_WH_KIT`, the
  demo's own products, F284), the kit flag on ORG_ZIZI_CORP's preference.
- docs/WarehouseImplementation.md "Packing (P12)"; the inventories' Implemented-in cells (ss-inventory: the pack, box type
  and assembly forms; usl-inventory: the pack services and the new entry points).

**Not built.** PackOptions' automatic package suggestions (`create#ShipmentAutoPackages` needs a gateway's packing rules,
P13's test carrier) and `reset#ShipmentPackage` (Move covers it); carrier codes' "preferred"; a dimensional box-type print and
box labels (P13's labels); the in-process reopen in the BOSS demo (Zizi's invoices are final at pack; the Mantle spec shows
it); a newest-first component return under the kit flag (F283, §7).

**For later phases.** P13 ships a packed shipment (Ship buys labels; D3's ShipShipped SECA finalizes the invoice); a change
after ship is a return. Customer Service's order change on a packed line reopens the package (`reopen#ShipmentPackage`),
then `cancel#OrderItem` flags the line and Pick's Put back returns it. P16 adds MaterialIssueReceipt's work effort source
(`Packing.js` `sources`). P14's supplier return packs through the same entry points (ShpTpPurchaseReturn is outgoing).

**Verified.** Mantle: WarehousePacking 6/6 (two boxes with weights, complete with the in-process invoice and no label, the
reopen and the reduced line's put back, the final invoice closed, the DEMO_PA kit at 12.01 with no WIP and the remainder,
the flag off with an unreserved kit, box types); with F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads,
CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow,
ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, and AccountingReturns,
AccountingSetup, AccountingPeriodClose, AccountingReceivables, WarehousePicking, WarehouseMoves, WarehouseAdjustments,
WarehouseReceiving, WarehouseQuality, WarehouseStockChecks and WarehouseExpiry, 230/236: the six are
OrderProcureToPayBasicFlow's depreciation and inventory features (the known UTC date-change transient) and
AssetReservationMultipleThreads, which counted the first kit demo's DEMO_1_1 stock and passes since (F284; with
OrderToCashBasicFlow and WarehousePacking 43/48, the five OrderProcureToPayBasicFlow's). BOSS: WarehousePacking 4/4,
WarehouseAccess (the P12 cases), AppStructure, TuiRender, ClientWrites, ClientIsolation, WarehousePicking, WarehouseShell,
WarehouseInventory, WarehouseFacilities, WarehouseMoves, WarehouseReceiving, WarehouseCounts, WarehouseAdjustments,
WarehousePutaway, WarehouseInspections, WarehousePolicies, AccountingShell, AccountingScreens, AccountingValuation,
TodayPanel, Shell, ProductsSharedContext and ProductsInventory 356/361, then WarehouseInventory, AppStructure, WarehousePacking
and WarehouseAccess 147/148 after the demo rename: the failures are Accounting's financial report renders (AppStructure,
TuiRender, AccountingScreens) and AccountingValuation's current fiscal month, the date-change transient. Client:
WarehousePackingWalk 4/4 (Handheld Pack at 390 px), with WarehousePickingWalk, WarehouseInventoryWalk,
WarehouseFoundationWalk, WarehouseFacilitiesWalk, WarehouseMovesWalk and AccountingSettingsWalk, 23/23. Screen lint: no flagged site
in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `53b85789` and `a55cdc64`; mr-boss `74549a2` and the docs commit.

**Review fixes** (Oct 31, F285–F294): A1 a named or scanned asset is checked in the guard (scope, facility, available,
product) before Mantle sees it, and a scan is resolved there; B1 the kits go into the packer's package
(`produce#AvailableAssemblies` takes the package); B2 a product packed from several assets is reopened by its named asset;
B3 the lowered package's weight is cleared (Mantle already did; spec'd); B4 a box type another organization uses is
BOX_TYPE_SHARED, and BoxTypes' transitions need facilityEdit; C the re-approval's side effects recorded (F290), Pack and
Handheld Pack for the pack capability only (F291), MaterialIssueReceipt driven by its source entry (`sourceType`,
`sourceId`, `get#MaterialAction`), the kit unit rounded down with a later pack at another cost spec'd (F292), the demo flag
kept on Corp with the reason (F293), the reopen's lock order (F294), the long lines. Master is not merged (the coordinator
merges P14 and P15 first). Verified: Mantle WarehousePacking 8/8, with OrderToCashBasicFlow, ShipmentPick,
AssetReservationMultipleThreads, ManufacturingServices, WarehousePicking and AccountingReturns 81/86 (the five are
OrderProcureToPayBasicFlow's date-change transient, a dependency); BOSS WarehousePacking, WarehouseAccess, AppStructure,
TuiRender, ClientWrites, ClientIsolation, WarehouseShell and WarehousePicking 189/191 (Accounting's report renders, the
transient); WarehousePackingWalk 4/4; screen lint with no flagged Warehouse site. Commits: `fix(warehouse): P12 review: ...`
in both repositories.

**Master merged** (Oct 31, after P14 and P15): `issue#AnyAssetForShipmentItemSource` keeps P14's named `assetId` (which refuses
`workEffortOnly`, so it compares the source's own product) beside P12's `componentProductId` and work-effort issue; every block
of WarehouseTaskServices.xml (P14, P15, P12) kept; the shared links, the client suite, WarehouseAccess, the docs, the plan and
the inventories unioned; ShipmentDetail's outbound branch (the last of transfer, return, receipt, outbound) keeps Pack, the
packing slip and the Packages box. Verified: Mantle WarehousePacking, WarehouseReturns, WarehouseTransfers, WarehousePicking,
OrderToCashBasicFlow, AssetReservationMultipleThreads, ManufacturingServices and ReturnToResponseBasicFlow with their
dependencies 91/91; BOSS WarehousePacking, WarehouseReturns, WarehouseTransfers, WarehouseInventory, AppStructure, TuiRender,
WarehouseAccess, ClientIsolation and ClientWrites 189/189 (Inventory's first page still shows `BOSS_WH_PACK_STOCK` and
`BOSS_WH_SER_1`, F284); walks WarehousePackingWalk, WarehouseReturnsWalk, WarehouseTransfersWalk, WarehousePickingWalk and
WarehouseInventoryWalk 18/18.
### P14 build — Oct 31, 2026

**Built.**
- Mantle (`service/mantle/shipment/ReturnStock.js`, `entity/ReturnStockEntities.xml`): `receive#ReturnItems` with an operation key is
  the guarded return receipt (ReturnReceive: the shipment, returns and items locked, the facility's scope, the tracking rules, the
  rejection reason, a quarantine location locked last, the non-locking period check, Accounting's receipt as AstQuarantine there,
  a serialized line a unit at a time, the lot the product was sold from, then a QisReturn inspection of each accepted receipt;
  without the key Accounting's receipt is unchanged); Purchasing's `mantle.order.ReturnServices.find#ReturnableReceipts` and
  `add#ReceiptToReturn` with `ReturnItem.assetReceiptId` and `assetId` (F32); `issue#SupplierReturnStock` over
  `issue#AnyAssetForShipmentItemSource`'s new `assetId` (F316), held stock under its Return to supplier dispositions
  (`QualityInspectionDisposition.returnedQuantity`, the inspection's `heldQuantity` lowered); `ship#SupplierReturn` (ReturnShipped);
  `request#ReturnLabel` (the request as its operation, the package and route segment, `CarrierServices.request#ShipmentLabels` when
  a gateway applies); `mantle.order.return.ReturnContent` registered in `get#RecordLinkInfo` with `create#ReturnContent`; Quality.js
  types a return's receipt inspection QicReturn and QisReturn (F317); ReturnSettlement.js passes location, lot, serial and expiry;
  permission RETURN_AUTHORIZE (no Warehouse group).
- BOSS: the Returns area (placeholder replaced): Returns (ReturnFind, ReturnList with separate authorization, physical, settled and
  disposition progress, New return), ReturnDetail as `Shared/ReturnDetail`'s Warehouse branch (header with Receive or Send back,
  Submit for authorization, Create return shipment; Eligible items with Add; Items; Shipments and receipts; Inspection and
  disposition; Settlement read only; Files; Conversation), ReturnReceipt and SupplierReturnShipment as `Shared/ShipmentDetail`'s return
  branch (Receive per item into quarantine, Send back, Ship, receipts or issues, inspections, tracking), ReturnSlip (the RMA receiving
  slip and the supplier-return slip); `ironstone.warehouse.ReturnServices` (`Returns.js`), `template/WarehouseReturnParts.xml`,
  `template/WarehouseReturnDetail.xml`; `Warehouse.js` the return destination, return shipment links and sharedLinks; Home's returns
  queue. Demo: the RMA `BOSS_WH_RMA` with its shipment, the supplier return `BOSS_WH_SRET` of the gasket lot `BOSS_WH_LOT_R` an
  inspection disposed of as Return to supplier; WarehouseSpecLib.js `returnSettlement` and the walk's fixture spec
  WarehouseReturnsFixtures (F321).
- docs/WarehouseImplementation.md "Returns (P14)"; as-built notes in design-warehouse §11; the contract's name in design-purchasing
  and design-crosscut §3.18; the inventories' Implemented-in cells (usl-inventory: the return services, `issue#AnyAssetForShipmentItemSource`,
  `pack#`/`ship#Shipment` and the new services; ss-inventory: AddOrderItems, EditReturnItems, FindReturn, ShipmentItems).

**Not built.** Authorization (Customer Service's `authorize#Return`, RETURN_AUTHORIZE) and Customer Service's Issue return label
screen action; a partial supplier return shipment (F324), the return receipt at handheld density and a return's putaway after
release (§7); editing a return's header and items (UpdateReturn, AuditLogList) beyond adding eligible items; Purchasing's own
NewSupplierReturn.

**For later phases.** P13 replaces `request#ReturnLabel`'s carrier call with its provider-request records and shows return labels on
Ship; Customer Service authorizes and issues the label; Purchasing calls `find#ReturnableReceipts` and `add#ReceiptToReturn`; F318 (the
match base while Return to supplier stock is held) and F321 (a demo organization of its own for returns) are for review.

**Verified.** Mantle: WarehouseReturns 4/4; with AccountingReturns, AccountingMatching, WarehouseQuality, WarehouseReceiving,
WarehouseExpiry, RecordLinks, RecordVisibility and F28's ShipmentReturnMisc, ShipmentPick, ShipmentLoads, CarrierServices,
AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow, ManufacturingServices,
InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime 205/210: the five failures are OrderProcureToPayBasicFlow's
depreciation and inventory features, the known UTC/local day-boundary failure (they pass on master after its date fix). BOSS:
WarehouseReturns 5/5 (and with WarehouseReturnsFixtures 6/6 after the settlement fix); WarehouseReturns, WarehouseAccess,
AppStructure, TuiRender, WarehouseShell, ClientWrites, ClientIsolation, WarehouseReceiving, WarehousePicking, WarehouseInspections,
WarehouseInventory, WarehouseCounts, WarehousePutaway, AccountingSettlement, AccountingAccess, AccountingScreens, AccountingMatching
and TodayPanel 295/300: the five failures are Accounting's financial reports with no November period (AccountingScreens, AppStructure,
TuiRender) and AccountingAccess' payment run pay date, date-dependent. Client: WarehouseReturnsWalk 3/3 (Returns at 390 px), with
WarehouseReceivingWalk, WarehouseInspectionWalk and WarehousePickingWalk 12/12. Screen lint: no flagged site in the new or changed
screens (information-level extension anchors only).

**Commits.** mr-mantle `69a19d05`, `0b7c11bc`; mr-boss `6b4fb1c`, `f925488` and the docs commit.

**Review fixes** (Oct 31, F325–F332): master merged into wh/p14 in both repositories (the date fixes and docs). B1 the match
base subtracts what Return to supplier sent back, not what it still holds (`inspectionRemovedQuantity`, InvoiceMatch.js too); B2
the demo RMA is of the Ziziwork Returns Center (`BOSS_WH_RETURNS`, a child of Retail with its own D11 preference through
`store#Preferences`), the settlement helper and fixture spec are gone, and ReturnDetail and ReturnReceipt say why there is no
Receive when D11 is off (§5); B3 `find#ReturnableReceipts` queries `ReturnableReceiptView` and pages until 200 receipts; B4 Send
back offers the facility's stock for an item naming none; B5 on-hold stock is held stock; C the lot of the order line's issue,
eligibility capped at on hand, the receipt's facility, the stock's owner, ReturnContent's permission and scope (and RecordFiles'
create service), the `workEffortOnly` guard, the app guard on the return transitions; F331 (the label inside the transaction,
for P13) and F332 (the self-include recursion, for mr-moqui) recorded. Verified: Mantle WarehouseReturns 5/5 (the partial
release, the lot and facility filters, on-hold stock) with AccountingReturns, AccountingMatching, WarehouseQuality,
ReturnToResponseBasicFlow, ShipmentReturnMisc, WarehouseReceiving, RecordLinks and the rest of F28's specs 194/194; BOSS
WarehouseReturns 6/6 (D11 off, the stock choice) with WarehouseAccess, WarehouseShell, AppStructure and TuiRender 159/159; walks
WarehouseReturnsWalk, WarehouseReceivingWalk and WarehouseInspectionWalk 9/9. Commits: the merges and `fix(warehouse): P14
review: ...` in both repositories.

**After P15** (Oct 31): master (P15) merged into wh/p14 in both repositories: Shared/ShipmentDetail's Warehouse branches in one
order (transfer, return, receipt, outbound; each tried only when no earlier one found it, every flag defined), the receipt's
not-available condition with all four, `Warehouse.js` the return shipment links before P15's transfer fallback, WarehouseTaskServices,
Home's queues, the demo, the client suite, WarehouseAccess, the plan and docs unioned. Verified: Mantle WarehouseReturns,
WarehouseTransfers, AccountingReturns, AccountingMatching, WarehouseQuality, ReturnToResponseBasicFlow, ShipmentReturnMisc,
WarehouseReceiving and WarehousePicking 132/132; BOSS WarehouseReturns, WarehouseTransfers, WarehouseReceiving, AppStructure,
TuiRender, WarehouseAccess, WarehouseShell, ClientWrites and WarehousePicking 181/181; walks WarehouseReturnsWalk,
WarehouseTransfersWalk, WarehouseReceivingWalk and WarehouseInspectionWalk 13/13.

### P15 build — Oct 31, 2026

**Built.**
- Mantle (`service/mantle/shipment/Transfers.js`, `entity/WarehouseTransferEntities.xml`): the transfer entry points of
  `mantle.shipment.WarehouseTaskServices` on StockPosting.js's steps: `create#Transfer` (STOCK_MOVE, over `create#Shipment` with
  ShpTpTransfer, one owner, a subcontract dispatch with its keys checked against OrderItemWorkEffort and the custodian),
  `issue#TransferStock` (STOCK_ISSUE, `issue#Asset` of named or picked stock, within its available to promise), `ship#Transfer`
  (SHIPMENT_SHIP or STOCK_ISSUE, ship short), `receive#TransferStock` (STOCK_RECEIVE, in parts, each receipt a piece of one
  issuance at its cost, owner, lot, serial and expiry, `sourceAssetIssuanceId`, through Receiving.js's receipt step and putaway
  and Quality.js's inspection; delivered when nothing is in transit), `dispatch#SubcontractStock` (STOCK_MOVE, `move#Asset` to or
  from a vendor-custody facility, nothing posted) and `allocate#InventoryRequest` (STOCK_MOVE, a transfer or a guarded move per
  item, InventoryRequestAllocation); `pick#ShipmentStock` picks a transfer line's scanned available stock (F335). A line's
  remaining quantity is its issuances less its receipts, each summed apart (F37). `mantle.request.RequestServices`: the RqtInventory
  validation of `create#Request`, `add#InventoryRequestItem`, `approve#InventoryRequest` (STOCK_POLICY_PLAN, approved RqTpInventory
  Requirements by RequirementRequestItem) and `get#InventoryRequestProgress` (`InventoryRequests.js`). Records: the Shipment
  subcontract keys, `InventoryRequestAllocation`, the Custodian RoleType.
- BOSS: Transfers (TransferFind with custody at supplier, TransferList with the two-leg progress, board and calendar, Stock at
  suppliers, NewTransfer), Shared/ShipmentDetail's transfer branch (`template/WarehouseTransferDetail.xml`) at
  `Transfers/TransferShipmentDetail` and `Transfers/SubcontractShipmentDetail` (Items, Origin pick and ship, Transit, Destination
  receive, Custody at supplier, files, conversation), the transfer sheet (`Transfers/TransferSheet`), StockRequests
  (StockRequestFind, StockRequestList, NewStockRequest), Shared/RequestDetail's Warehouse branch (`template/WarehouseRequestDetail.xml`:
  Submit, Approve, Allocate, Complete, Cancel; the InventoryRequestProgress panel; Add item), the quick creates NewTransfer (move
  group, `BOSS_WH_NEW_TRANSFER`) and NewStockRequest, Home's transfers queue; `ironstone.warehouse.TransferServices` (`Transfers.js`)
  and `template/WarehouseTransferParts.xml`; `Warehouse.js` the P15 shared links and a transfer's record link. The placeholder
  `Transfers/Transfers` Move linked to is the list now. Demo: the transfer demo filter on `BOSS_WH_SHIP_TRANSFER`, the
  vendor-custody facility `BOSS_WH_VENDOR` (custodian Ziddleman) with stock, the run `BOSS_WH_RUN`, the service order
  `BOSS_WH_SUB_PO`, the subcontract dispatch `BOSS_WH_SHIP_SUB` and the stock request `BOSS_WH_REQ`.
- docs/WarehouseImplementation.md "Transfers, requests and the subcontract dispatch (P15)"; as-built notes in design-warehouse §8;
  the inventories' Implemented-in cells (usl-inventory: the new entry points and request services, `create#Request`,
  `update#Request`, `issue#Asset`, `move#Asset`, `receive#Asset`, `create#Shipment`, `create#ShipmentItem`, `ship#Shipment`,
  `deliver#Shipment`, `receive#EntireShipment`; ss-inventory: FindShipment NewTransferShipment and ShipmentList, ShipmentDetail
  PickScanForm).

**Not built.** Cancelling or writing off a transfer's remainder lost in transit, and packages and carriers for a transfer (§5);
RequirementSupply and the SupplyPlanning conversion (CX-PLANNING, §7); the subcontract output receipt (P16); a handheld mount for
transfers (design §8 gives none).

**For later phases.** P16 receives a subcontract's output on the run and issues its material lines from the vendor-custody
facility, reading the dispatch's `subcontract*` keys; P12 and P13 may add packages and carriers to a transfer; P17 reports transit
(`transitQuantity`) and the transfer account; supply planning converts transfer suggestions through `create#Transfer` and links
RequirementSupply to the requirements approval made.

**Verified.** Mantle: WarehouseTransfers 7/7; with WarehouseStockChecks (F37), WarehousePicking, WarehouseReceiving,
WarehouseMoves, WarehouseQuality, WarehousePutaway, ProductStockTotals, F28's ShipmentPick, ShipmentReturnMisc, ShipmentLoads,
CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow,
ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime, AccountingValuation, AccountingSetup
(readiness's WIP_TRANSFER) and the `create#Request` callers CrmMiscServices, WorkPlanToCashBasicFlow, WorkProjectRequests and
WorkTimeEntries, 233/238: the 5 failures are OrderProcureToPayBasicFlow's depreciation and inventory features, the known
date-change transient (the run crossed into November 1 UTC). BOSS: WarehouseTransfers, WarehouseAccess, AppStructure,
ClientWrites, ClientIsolation, TuiRender, QuickCreate, WarehouseShell, WarehouseReceiving, WarehousePicking, WarehouseMoves,
WarehouseCounts, ProjectRequests and TimeEntries 236/238: the 2 failures are Accounting's financial report renders in AppStructure
and TuiRender, the same transient; WarehouseTransfers, WarehouseReceiving and WarehouseAccess 118/118 after the demo order fix.
Client: WarehouseTransfersWalk 4/4, with WarehouseFoundationWalk, WarehouseMovesWalk, WarehousePickingWalk 10/10 and
WarehouseReceivingWalk 3/3 (after the demo service order was placed rather than approved, so NewReceipt does not list it). Screen
lint: no flagged site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `62840022`; mr-boss `65d8966`, `47a130a` and the docs commit.

**Review fixes** (Oct 31, F342–F348): master merged into wh/p15 in both repositories (the date fixes and docs; no conflicts). A1
the within-facility allocation refuses stock of another facility and passes `toFacilityId`; B2 DUPLICATE_ITEM and the row index
in the nested key; B3 the stock request check behind `inventoryRequestCheck` on create and update (on in the demo for Retail);
B4 the subcontract buyer, run scope, cancelled order and service item; B5 the transfer account's value on TransferShipmentDetail
for financial read and the §5 write-off row naming the posting; B6 a moves-only dispatch shipped short is delivered; C
`pack#Shipment`, owner checks, unnamed sends across picked assets, Mantle's `lineOf` for the detail lines, the FltPick note,
long lines. Verified: Mantle WarehouseTransfers 8/8 (the policy flag on and off, the switched request, OTHER_FACILITY,
DUPLICATE_ITEM, NOT_SERVICE, the moves-only dispatch, the rejected value, the two-asset send) with WarehouseStockChecks,
WarehousePicking, WarehouseReceiving, WarehousePolicy, WarehouseOperationPolicy, ProductStockTotals, F28's list,
AccountingValuation, AccountingSetup and the `create#Request` callers (CrmMiscServices, WorkPlanToCashBasicFlow,
WorkProjectRequests, WorkTimeEntries), 241/241; BOSS WarehouseTransfers, WarehouseAccess, AppStructure, ClientWrites, TuiRender,
QuickCreate, WarehouseShell, WarehouseReceiving, WarehousePicking, WarehousePolicies, ProjectRequests, Requests and RequestWalk
238/238; walks WarehouseTransfersWalk, WarehouseReceivingWalk, WarehousePickingWalk, WarehouseFoundationWalk and
WarehousePoliciesWalk 17/17. Commits: the merges, mr-mantle `80d24514` and mr-boss `26c5f05` (`fix(warehouse): P15 review:
...`), and this docs commit.

### P13 build — Oct 31, 2026

**Built.**
- Mantle (`service/mantle/shipment/Shipping.js`, `entity/ShippingGatewayEntities.xml`): the shipping entry points of
  `mantle.shipment.WarehouseTaskServices`: `get#ShipmentRates` (the configured gateways' `get#ShippingRatesBulk` or `get#ShippingRate`,
  and the local-rules adapter over `get#OrderShippingRateLocal`, F14, F295), `request#PackageLabels` and `refund#PackageLabels` on
  durable `ShippingGatewayRequest` records committed before each gateway call, a timeout asked about (`find#ShippingLabels`) before
  any retry (internal `record#ShippingGatewayRequests`, `finish#ShippingGatewayRequests`), `track#PackageLabels`,
  `record#ManualTracking`, `record#PackageDelivery`, `ship#OutgoingShipment` and `get#ShipReadiness` (tracking totals, package totals,
  inspection release, P5b's expiry gate); `request#ReturnLabel` moved onto the same path (`record#ReturnLabelRequest`, F331). The test
  carrier `mantle.shipment.carrier.TestGatewayServices` (`carrier/TestCarrier.js`, `entity/TestCarrierEntities.xml`,
  `data/TestCarrierData.xml`: TEST_SHIPPING, TEST_CARRIER; rates by weight and zone, a PDF label with a Code 128 tracking number,
  its own TestCarrierLabel record, refund, tracking, address validation, postal codes 99901/99902/99903). `mantle.facility.PrintServices`
  (`Printing.js`: `dispatch#Document`, `get#PrinterCapabilities`, `store#FacilityPrinter`); FacilityPrinter `copies`, `fromDate`,
  `thruDate` and PtpLotLabel, PtpLocationLabel, PtpCountDocuments (F15, F16); `carrier/CarrierSetupServices` (store#CarrierShipmentMethod,
  store#ShippingGatewayCarrier, SHIPPING_CARRIER_EDIT in `data/ShippingSetupData.xml`); the interface additions of F296; the view
  `ShipmentPackageTracking`; ShipmentPackageRouteSeg's delivery fields.
- BOSS: `Warehouse/Shipping/Ship` (ShipmentAddress, RateOptions, Labels, ManualCarrier, ShipConfirm), `Shipping/PackageTracking`
  (TrackingFind, TrackingList, RecordDelivery), `Shipping/LabelSheet` and `Shipping/Manifest` (prints), `Locations/Carriers`
  (CarrierMethods, gateways with credentials masked, bindings, CarrierTest), `Locations/Printers` (PrinterIndex, PrinterTest) and
  `PrinterTestPage`, FacilityDetail's Printers tab (`Shared/FacilityDetail/Printers.xml`, index 6), `Shared/InvoiceDetail`'s Warehouse
  branch at `Orders/InvoiceDetail` (`template/WarehouseInvoiceDetail.xml`); ShipmentDetail's Ship and Tracking; label links from
  FacilityDetail's Locations, Lots, AssetDetail, Containers and BoxTypes; Home's shipping queue; `ironstone.warehouse.ShippingServices`
  (`Shipping.js`), `template/WarehouseShipParts.xml`; `Warehouse.js` the `carrierEdit` capability and the P13 shared links; the
  shipping manager's SHIPMENT_SHIP and SHIPPING_CARRIER_EDIT. Demo: the dock label printer `BOSS_WH_LABEL_PRINTER` on ZIRET_WH, the
  packed shipment `BOSS_WH_SHIP_SHIP` (order `BOSS_WH_SO_SHIP`, invoice `BOSS_WH_INV_SHIP`).
- docs/WarehouseImplementation.md "Shipping, labels and printers (P13)"; the inventories' Implemented-in cells.

**Not built.** Automatic package suggestions (F299, §7); ZPL (§4, §7); a manifest close or carrier pickup booking; address validation
in CarrierTest (Ship checks the address); packages and labels for transfers (§5); Today items for shipping (no assignment record).

**For later phases.** P18 reviews the outbound flow end to end (pick, pack, labels, ship, delivery); Customer Service's Issue return
label calls `request#ReturnLabel`; a real carrier implements the interfaces with `find#ShippingLabels` and keeps `requestReference`.
P16 and P17 may add Home cards in HomeServices' existing places (P13 added the shipping queue there).

**Verified.** Mantle: WarehouseShipping 8/8 (a two-package shipment rated by the test carrier and the local rules; labels once with
a retry answered; a timeout asked about and no second label; a refused label and an invalid address; a method with no gateway
shipped with a manual code and cost and its deliveries recorded; an open inspection holding dispatch and a refund reversing no
shipment; a print failure keeping the posted result with a reprint; the return label on the same path), with CarrierServices,
OrderToCashBasicFlow, ShipmentPick, WarehouseReturns, WarehousePacking, ShipmentReturnMisc, ShipmentLoads, AssetReservationMisc,
ReturnToResponseBasicFlow, ContactAndFacilityServices, InvoiceOrderApply, OrderToCashTime, OrderProcureToPayBasicFlow,
ManufacturingServices, AssetReservationMultipleThreads, WarehouseFacilities and WarehousePicking: 166/166. BOSS: WarehouseShipping,
WarehouseAccess, AppStructure, TuiRender, ClientWrites, ClientIsolation, WarehousePacking, WarehousePicking, WarehouseShell,
WarehouseFacilities, WarehouseInventory and WarehouseReturns 248/248. Client: WarehouseShippingWalk 3/3 (PackageTracking at 390 px).
Screen lint: no flagged site in the new or changed screens (information-level extension anchors only).

**Commits.** mr-mantle `26043a34`, `359d79fc`; mr-boss `a2645d6` and the docs commit.

**Review fixes** (Oct 31, F305–F314): master merged into wh/p13 (mr-boss; mr-mantle was current). A1 the gateway worked out in the
recording transaction from the segment as written (`gatewayFor`), recorded on the request and called directly, the return label and
manual tracking alike; A2 GATEWAY_NOT_FOR_CARRIER, test gateways behind `ShippingTestGatewayAllowed` (demo: Retail), the test
carrier's party, methods and binding demo data; B1 `claim#ShippingGatewayRequest` and `sentDate`, `sendAgain` for a gateway that
cannot be asked; B2 `settled` before the status checks; B3 printing skips refunded labels, takes the first segment and reports each
package; B4 the address check limited to the shipment's addresses and gateway; B5 LABEL_EXISTS before a carrier change or manual
tracking; B6 refunds before ship only; B7 carrier setup for the Warehouse admin only; B8 credentials "set" or "not set"; B9 the
preview streamed (binary labels need a framework byte response, F312); C NOTHING_TO_REFUND, the hash fields, FOUND_NOT_FILLED,
BINDING_IN_EFFECT, capabilities scoped, the stale comment, the totals text; F314 two spec conditions Prettier had joined.
Verified: Mantle WarehouseShipping 9/9 (a new carrier and gateway timed out and asked of the same gateway, UPS through the test
gateway refused, the setting off refused, the carrier change and manual tracking refused while labelled, a refund before ship and
after ship, WSH_NOFIND sent again only with `sendAgain`, NOTHING_TO_REFUND, printing per package) with CarrierServices,
OrderToCashBasicFlow, ShipmentPick, WarehouseReturns and the rest of F28's list, WarehousePacking, WarehouseFacilities and
WarehousePicking 167/167; BOSS WarehouseShipping, WarehouseAccess, AppStructure, TuiRender, ClientWrites, ClientIsolation,
WarehousePacking, WarehousePicking, WarehouseShell, WarehouseFacilities, WarehouseInventory and WarehouseReturns 248/248; walks
WarehouseShippingWalk and WarehousePackingWalk 7/7. Commits: the master merge (mr-boss `80848ea`), mr-mantle `77ad8456` and mr-boss
`b8cd142` (`fix(warehouse): P13 review: ...`), and this docs commit.

### P16 build — Oct 31, 2026

**Built.**
- P16a, Mantle (`service/mantle/work/ProductionServices.xml` on `Production.js`; `entity/ProductionEntities.xml`;
  `data/ProductionData.xml`): `create#ProductionOrder` (PRODUCTION_PLAN; `check#ProductUsable` Produce; Mantle's
  `create#ProductionRun` without the consume and produce products, so no PatMfgBom row; the run owned by the organization;
  `ProductionRunLine` output, material and by-product lines from `get#BomExplosion` as of the method date, stopping at
  non-phantom sub-assemblies and blowing phantoms through with their routing; the WeptConsume/WeptProduce rows; a retry
  answers the first draft), `release#ProductionOrder` (PRODUCTION_PLAN; a method released again since the method date is
  METHOD_CHANGED unless `reexplode`; operation children with routing operation, sequence, work center and owner; lines frozen
  on them; WorkEffortProduct rows rewritten; the approved standard in effect frozen as `productStandardCostId`; release time
  and revision), `get#ProductionOrder` (PRODUCTION_VIEW or STOCK_ISSUE). The run's audit-logged fields (revision, method date,
  release time, BOM, routing, standard, demand links; on operations the routing operation, sequence and work center); the
  PRODUCTION_VIEW and PRODUCTION_PLAN (F355); no unrelease transition (review B4, F366). BOSS: `DemoServices.load#ProductionDemo`
  and the server fixture WarehouseProductionFixtures (F361).
- P16b, Mantle: `issue#ProductionMaterial`, `return#UnusedMaterial`, `receive#ProductionOutput`, `receive#SubcontractOutput`
  (STOCK_ISSUE, on StockPosting.js; stock validated in the guard), the CX-PRODUCTION fields (`AssetIssuance.productionMaterialLineId`,
  `AssetReceipt.productionOutputLineId`, `operationWorkEffortId` on both, `AssetReceipt.costProvisional`), `issue#AssetToWorkEffort`'s
  `issuanceFields` (F356), Quality.js `outputNeedsInspection`/`outputInspections` (F360); Purchasing's
  `mantle.order.OrderServices.accept#ServiceItem` over `mantle.order.purchase.ServiceAcceptance` (`ServiceAcceptance.js`).
- P16b, BOSS: `Shared/MaterialIssueReceipt`'s production run source (`Packing.js` sources' `productionRun`,
  `ironstone.warehouse` `Production.js`): Source (frozen standard or provisional basis, stage and dispatch links), Material lines
  with Issue from a chosen asset, Output with Receive (first serial, lot, location), Tracking, Posted issues and receipts, Unused
  returns with Return, Files; SubcontractShipmentDetail's Output receipt pane (`receiveSubcontractOutput`, `get#TransferDetail`'s
  `outputReceipt`); `Warehouse.js` the `run` record kind and its link. Demo: BOSS_WH_RUN released with its lines and the coated
  filter product. docs/WarehouseImplementation.md "Production runs and stock (P16)"; the inventories' Implemented-in cells.

**Not built.** Manufacturing's screens (WorkOrders, NewWorkOrder, WorkOrderDetail), `transition#ProductionOrder` with the
unrelease guard, manual material lines, backflush preview, `record#ProductionLoss`, the cost events (ProductionCostEvent) and
the subcontract accrual (Manufacturing P5, P6, P7, P14); a GenerateTracking preview dialog on MaterialIssueReceipt (Receive
generates from a first serial in the guard); RecordServiceAcceptance on OrderDetail (Purchasing); a BOSS grant of the
production permissions (Manufacturing P1).

**For later phases.** Manufacturing P1 grants PRODUCTION_* to its groups; P5a's `transition#ProductionOrder` calls
`release#ProductionOrder` and seeds the unrelease transition with its guard; P5b mounts MaterialIssueReceipt with its context over
the same guards; P14 adds the accrual event to `receive#SubcontractOutput`; Purchasing's RecordServiceAcceptance calls
`accept#ServiceItem`; InvoiceMatch reads ServiceAcceptance; P17 reports WIP from the run's issuances and receipts.

**Verified.** Mantle: WarehouseProduction 6/6 (lines from the released BOM with a phantom and a sub-assembly, no PatMfgBom;
release with operations and the frozen standard; a later BOM release leaves the released lines, a draft re-explodes; two
operations as two issuances, the retry, held, foreign-owned and wrong-product stock refused; returns into the asset and to a
new location at the cost; output into quarantine with generated serials at the standard, inspected; subcontract output from
the vendor facility at the provisional cost with the remainder carried, accepted once); with F28's ShipmentReturnMisc,
ShipmentPick, ShipmentLoads, CarrierServices, AssetReservationMisc, OrderToCashBasicFlow, OrderProcureToPayBasicFlow,
ReturnToResponseBasicFlow, ManufacturingServices, InvoiceOrderApply, ContactAndFacilityServices and OrderToCashTime,
AccountingPeriodClose, AccountingValuation, ProductStandardCosts, ProductMethods, WarehousePacking, WarehouseAdjustments,
WarehouseQuality, WarehouseTransfers and WarehouseReceiving 230/230; WarehouseExpiry with the related set 78/78. BOSS:
WarehouseAccess (the P16 cases), AppStructure, ClientWrites, WarehouseTransfers, WarehousePacking and TuiRender 160/160
(127/127 WarehouseAccess after the fixture fix); ProductsMethodFixtures, WarehouseProductionFixtures, ProductsMethods,
AccountingValuation, WarehouseInventory, WarehouseShell, ClientIsolation and WarehouseReceiving 80/80. Client:
WarehouseProductionWalk 3/3, with WarehouseTransfersWalk and WarehousePackingWalk 11/11. Screen lint: no flagged site in the
changed screens (information-level extension anchors only).

**Commits.** mr-mantle `f6d9cbee` (P16a), `a01a0e66` (P16b); mr-boss `a44285e` (P16a), `5d22938` (P16b) and the docs commit.

**Review fixes** (Oct 31, F365–F368): master merged into wh/p16 (mr-boss; mr-mantle was up to date). A1 provisional output in
parts takes its share of net WIP and the last the rest, a return after it trued up or refused (§4); A2 cost lines round the unit
down (serials too, quantities of one or less); B1 by-products refused until the allocation; B2 the return's owner check on the
facility; B3 `productionMethodRefs` keeps the run's BOMs and routings for its operations and METHOD_CHANGED; B4 no unrelease
seed (F366); B5 the proportional accepted quantity with a Service accepted field, UNIT_MISMATCH; B6 reviewed actuals checked;
B7 a re-explosion answers the draft for review; C the last receipt's material remainders, `acquireWorkEffortId` kept,
SHIPMENT_CANCELLED and the buyer check, ACCEPTOR_INVALID, the fixture's standard asserted, the pane for issue or receive, the
long line. Verified: Mantle WarehouseProduction 8/8 (with net WIP in parts and the true-up, the by-product, the phantom's
routing, cost lines, the reviewed re-explosion, actuals refused) with ManufacturingServices, AccountingPeriodClose,
AccountingValuation, F28's list, WorkMyTasks, WorkProjectFoundation, WorkProjectItems, WorkProjectPlan, WorkProjectMilestones,
WorkProjectReleases, WarehouseTransfers, WarehousePacking and WarehouseQuality 219/219; BOSS WarehouseAccess,
WarehouseTransfers, AppStructure, Projects, ProjectDetail, ProjectsSettings, ProductsMethodFixtures, WarehouseProductionFixtures
and ClientWrites 174/174; walks WarehouseProductionWalk and WarehouseTransfersWalk 7/7. Commits: `fix(warehouse): P16 review:
...` in both repositories.

### P17 build — Oct 31, 2026

**Built.**
- Mantle: `mantle.product.InventoryReportServices.get#InventoryAtDate` (`InventoryAtDate.js`), beside
  `get#InventoryProjectedInfo` (F23): the AssetDetail ledger by effective date by product, facility, location, lot and owner
  (each from the asset's audit log at the time, §4), each row's opening, receipts, issues, adjustments, moves and closing,
  the history of the period with recorded dates, source documents and each row's balance, a revaluation split's pair (F34,
  told apart by Traceability.js's exported `revaluationPairs`, F121) and a partial move within a row read as one history row,
  history before a facility's first ledger row incomplete (null), totals by unit, `complete`, `historyIncomplete` and
  `truncated`; organization scope through StockScope.js (FacilityScope) narrowed to the caller's `facilityIds`; days in the
  user's zone. `find#OperationsHistory` (`OperationsHistory.js`): receipts, shipments, returns and transfers by movement or
  document date with expected, accepted, rejected, picked, shipped and delivered quantities, days from expected and totals
  per unit. `find#Movements` takes `shipmentId`; `EntityLib.js` `pageList` pages a list in memory (with `noLimitCap`).
- BOSS: the Reports area with ReportIndex (default), `Shared/StockAtDate` (Places and History tabs; the Warehouse context through
  `ironstone.warehouse.ReportServices.get#StockAtDate`, the appRoot pattern, "not available" elsewhere), OperationsHistory, and
  Accounting's `Shared/InventoryValuation` with an `appRoot == 'Warehouse'` branch (`get#ValuationScope`; values only with
  financial read; Accounting's results in the new shared `InventoryValuationResults` section; no revaluation or repair).
  Exports: both StockAtDate tabs and OperationsHistory (CSV and XLSX, the find's filters, `pageNoLimit` capped at 5000); the
  Movements, Assets, Lots, Containers and Traceability exports were P4's, and Movements now drills by shipment. Drop-downs:
  `get#ReportChoices` (facilities, owners, parties, carriers) through `template/WarehouseReportParts.xml`. Home: a number card
  per queue linking its list, the queue table's operations linked, Your work from the Today source (Today.js `workRows`, F378)
  with step, due and exception, and the facility's quantity indicators. `Warehouse.js` link paths for the reports and the
  inventory screens they link. Demo: the sheet by weight (`BOSS_WH_SHEET`, kilograms) with lot `BOSS_WH_LOT_SHEET` and its
  dated receipts, issue and scrap on `BOSS_WH_SHIP_SHEET_IN`/`_OUT`.
- Specs: Mantle WarehouseReports; BOSS WarehouseReports, WarehouseAccess (the report services' reader and refusals, the lists
  filtered for a capability user with authorization on and off), AppStructure, TuiRender, ClientIsolation; the walk
  WarehouseReportsWalk (suite.js).

**Usable when.** The demo lot from September 10 through 30 opens at 50 kg, receives 20, issues 12, adjusts -0.5 and closes at
57.5, and from 2009 its opening is Unknown and the history flagged incomplete (ZIRET_WH's first movement is Mantle's 2010
demo); OperationsHistory totals kilograms apart from each; warehouse.read is told values need financial read while
StockAtDate and OperationsHistory answer in full.

**Not built.** Home's count quick create and QueueFilters' owner and date horizon (§5); the shipping queue's counts (P13,
F379); Capacity (design §12, which P9 left to P17; not in this phase's list, so P18 or §7); writing off a transfer's lost
remainder (§5). The other `container-box condition` sites (F375).

**For later phases.** Customer Service mounts `Shared/StockAtDate` with its own branch and context service over
`get#InventoryAtDate`. A phase's Today source shows in Home's Your work too. P13 counts the shipping queue in get#Home's
existing place. The reports read the ledger through `InventoryReportServices` with the caller's `facilityIds`.

**Verified.** Mantle: WarehouseReports 9/9; with WarehouseTraceability, ProductStockTotals, AccountingValuation,
WarehouseStockChecks and F28's list, 163/163. BOSS: WarehouseReports 7/7; WarehouseAccess, ClientWrites, WarehouseShell,
WarehouseCounts, WarehouseInventory, WarehousePicking, AccountingValuation, AccountingScreens, ProductsInventory,
ProductsSharedContext, TodayPanel, WarehouseReceiving, WarehouseReturns, WarehouseTransfers, WarehousePutaway,
WarehousePacking, WarehouseMoves, WarehouseAdjustments, WarehousePolicies, WarehouseFacilities, Shell, ClientIsolation,
ProductsAccess, AccountingFixedAssets, AppStructure and TuiRender all pass except WarehouseInspections' "a change to a
published characteristic" feature, which fails the same at the base commit. Client: WarehouseReportsWalk 5/5, with
ProductsCostWalk, AccountingValuationWalk, WarehouseAdjustmentsWalk, WarehouseInspectionWalk, WarehouseFoundationWalk,
WarehouseInventoryWalk and WarehouseCountsWalk 19/19. Screen lint: no flagged site in the new or changed screens.

**Commits.** mr-mantle `df01817e`, `d0cf0b94`; mr-boss `256f9ca`, `2d9fa70` and the docs commit.

**Review fixes** (Oct 31, F381–F384): master merged into wh/p17 in both repositories (wave 6 and its fixes; no conflicts). A1
the Asset place fields audit-logged on create, the create's rows read as starting values, and the spec's hand-written audit
row replaced by a receipt with no location and `move#Asset`; B1 the opening summed in one query and only the period's rows
read; B2 the audit lookup ordered and truncation marked; C1 WarehouseInventory's asset page filtered by product; C2 the
notice's start; C3 F376; C4 OperationsHistory's facility filter, expected dates, delivered and screen note; C5 the dead work
rows and doubled status; C6 revaluationPairs in parts; the valuation branch shows its failures. Verified: Mantle
WarehouseReports 9/9 with WarehouseTraceability, ProductStockTotals, AccountingValuation, the audit-reading specs
(WarehouseAdjustments, WarehouseOperationPolicy, WarehousePutaway, WarehouseFacilities, WarehousePolicy,
AccountingFixedAssets), WarehouseStockChecks, WarehouseMoves, WarehouseReceiving, WarehouseTransfers and F28's list, 262/262;
BOSS WarehouseReports, WarehouseAccess, WarehouseInventory, AccountingValuation, AccountingAccessWalk, WarehouseCounts,
WarehouseInspections, WarehouseShell, ClientWrites, ClientIsolation, AppStructure, TuiRender, TodayPanel,
AccountingFixedAssets and ProductsInventory 267/267; walks WarehouseReportsWalk, WarehouseFoundationWalk and
AccountingValuationWalk 9/9. Commits: the merges, mr-mantle `cc87e274` and mr-boss `fix(warehouse): P17 review: ...`.

**Merges with P16 and P13** (Oct 31): master merged into wh/p17 twice in both repositories. Both sides kept: the plan, docs,
WarehouseAccess (the P16 feature's closing restored), suite.js (WarehouseShippingWalk, WarehouseProductionWalk,
WarehouseReportsWalk), `Warehouse.js` link paths (P13's, then P17's) and the demo data. P16's CX-PRODUCTION fields extend
AssetIssuance and AssetReceipt, apart from the Asset audit fields (F381). Home's shipping card links Shipping/Ship (P13's
`get#ShippingQueue` counts it, F379). Verified: Mantle WarehouseReports, WarehouseShipping and WarehouseProduction 26/26; BOSS
WarehouseReports, WarehouseShipping, WarehouseAccess, AppStructure and TuiRender 168/168; walks WarehouseReportsWalk,
WarehouseFoundationWalk, WarehouseShippingWalk and WarehouseProductionWalk 14/14.

### P18 build — Oct 31, 2026

**Built.**
- **Terminal twins and server-static.** TuiRender renders every Warehouse screen and mount and now checks each twin shows its
  demo record's text: the Warehouse route fixtures moved from AppStructure into one place, `WarehouseSpecLib.routeFixtures()`
  (routes with parameters, text and a `tuiText` where the twin shows another; the shared and Handheld mounts), which
  AppStructure, TuiRender and ServerStatic read (F401); TuiRender fails a fixture no screen renders. The pass found the twins
  of the F375 boxes showing (a blind count sheet's twin showed the variance columns) and the scan fields' twins without their
  placeholder (F399). ServerStatic reports every Warehouse XML screen on its fixture: 16 of 88 are clean, and 14 are marked
  `server-static="qvt"` (12 in P18, with AssetDetail's Files and Notes from P4); Movements and Traceability stay unmarked because the
  static template keeps a hidden field's column header (F396).
- **The §19 acceptance review and crosscut §6 standalone operation**, `test/Warehouse/WarehouseAccessWalk.spec.js` (7 features, the
  longest under 5 s, about 29 s in all with the database load), on AccountingAccessWalk's pattern (§4): an organization with no
  ProductStore, BOSS_P18_ORG, with one facility, runs receive (into quarantine, receipt step 3) → inspection (submitted,
  verified, released) → putaway (the suggestion) → a sales order with no store, reserved → shipment → pick → pack (the weight
  entered) → ship (manual tracking), each step by a spec user in the Warehouse root group and one capability group; each of
  those users and eleven of Retail's demo Warehouse users opens Warehouse and none of eight other app roots; Retail's users
  never see the organization's records ("P18 secret") on 41 routes (detail, task, Handheld, report and print screens) in html
  (and the terminal for the reader) nor in Chatter and RecordFiles on its shipments, asset and facility, while its own reader
  sees them on more than 20; its users never see Retail's records on any route fixture with a demo record; CSV exports and prints of each side
  hold only its rows; the palette, scans, record links, universal search and the facility drop-down keep each side to its
  records (each finding its own); no purchase cost, sales price or their totals on 13 routes (and their CSV) without financial
  read, while a user with it sees them; Accounting's `settle#Return`, `release#ShipmentDraftInvoice` and `preview#Revaluation`
  refuse them for the permission or the organization. The §8 scenario table now names the spec or walk covering each §19
  scenario; none was uncovered.
- **Live UI issues (F375, F398).** Every Warehouse widget shown on a condition the renderers do not read is a section with the
  condition: PickLocationMoves (two boxes), CreatePicklists (two), Transfers' custody box, Repack's stock box, Receive's
  finish actions, CountSheet's two lists, Counts' due-row link (a conditional-field), WarehouseOrderDetail's hold banner,
  Accounting's DepreciationRunDetail and Shared/EquipmentDetail's account link. TuiRender checks four stay out of the twin and
  the page.
- **§5 for P18.** Home's count quick create, `Warehouse/NewCount` (§4): Counts' New count form as `NewCountForm`, offered to
  the count group only. Capacity stays `later` (design §2, §7; P9's `get#Capacity` is there). The other §5 questions marked P18
  (blind quantities outside the count screens, the storage type's editor, a gateway with no label lookup, a facility's
  history start, the box type owner) are product or data-model decisions, left open with a P18 note.
- **§16 outputs.** Each output is built (receipt document, putaway and transfer sheets, pick and combined pick/pack sheets,
  packing slip with contents and inserts, carrier labels and the guarded return-label path (`request#ReturnLabel`, P14; the
  customer return-label request is Customer Service's, §7), the manifest, location/lot/serial/container/box labels,
  stock at date and the quantity, movement, history and lineage CSVs, blind and variance count sheets, the inspection
  certificate, the RMA and supplier-return slips, the count import and its row-result CSV, the receipt, short-pick and
  inspection notices) except the receipt confirmation email, CountReview's and Ship's exception notices, and the `later`
  ExternalStockSync and DeliveryTripDetail outputs (F402, §7).
- **Mantle.** `edit#ShipmentPackage` weighing a package with no box type failed with "not a function" (F397); it now answers
  WEIGHT_UNAVAILABLE naming why.
- **Inventories and design.** ss-inventory and usl-inventory: Implemented in for every Warehouse row (177 and 102; a function
  not built is `—` with what the screen does instead or its §7 item); design-warehouse's §2 Impl names the building phase or
  §7; docs/WarehouseImplementation.md "Finish (P18)" and final. The framework issues the phases recorded are F395, with each
  one's place in mr-moqui and the proposed fix.

**Not built.** Capacity, and the §16 outputs of F402 (§7); the §5 decisions left open above.

**For later.** Each new Warehouse screen adds its route fixture to `WarehouseSpecLib.routeFixtures()` and its record route to
WarehouseAccessWalk's `p18Routes`; a clean screen without a hidden field is marked server-static. Other apps' contexts and
callers are §7.

**Verified** (runtime of wh/p18; no full suite run): BOSS WarehouseAccessWalk, WarehouseAccess, TuiRender, AppStructure,
ServerStatic, WarehouseCounts, WarehouseShell, ClientWrites and AccountingFixedAssets 206/206, and ServerStatic with
WarehouseShell again after NewCount was marked 26/26; mr-mantle WarehousePacking 9/9. Client walks over the changed screens:
WarehousePickingWalk, WarehouseTransfersWalk, WarehouseAdjustmentsWalk, WarehouseReceivingWalk, WarehouseCountsWalk,
WarehouseInventoryWalk, WarehouseFoundationWalk, WarehousePoliciesWalk, WarehouseShippingWalk, WarehouseMovesWalk and
AccountingFixedAssetsWalk 35/36 (WarehouseInventoryWalk saw Traceability's "Unit cost" header once it was server-static, F396:
unmarked), then WarehouseCountsWalk, WarehouseInventoryWalk and WarehousePackingWalk 11/11 and WarehouseFoundationWalk with
WarehouseCountsWalk 6/6. `moqui lint --screens`: 129 flagged sites as on master, none in Warehouse or the Shared screens
touched.

**Commits.** mr-mantle `a37f2cea`; mr-boss `4d38d61`, `c26af18`, `7c2ab14`, `a37e979`, `aa73895` and the docs commit.

**Review fixes** (Oct 31, F403–F405): master merged into wh/p18 (the wave 7 docs commit; no conflict). B1 the walk's owner
control per route with the routes the plan names, the organization's count, putaway rule, pick face below its minimum and
invoice, and Retail leaks counted on the routes the owner sees; the Below minimum rows were never returned (F404); B2 receive,
pack, ship and the count through the screens' transitions, with the pack, ship and queue renders error-free; B4 the walk split
over `WarehouseStandaloneLib.js` into WarehouseAccessWalk (the flow, the roots, the route sweep, notices) and
WarehouseIsolationWalk (the other side's routes, exports, palette and search, cost and settlement), sweeping four Retail users;
B5 StockAtDate's Places and History fixtures back to their data texts, rendered with `lastStandalone: "true"` (at the shell's -2
the level is StockAtDate's header, whose tab pane the client fills); C F395's item 12 as a Java-compatible behaviour, F398's
Accounting form-lists wrapped and the other sites listed, form-single conditions (F403), F397's reason scoped to the weight
service's messages, the quick creates' grants in WarehouseAccess's filter check (17), guards on the features after the flow,
the notice check, and the §16 note on the customer return label. B3: mr-moqui's `plans/Remaining-Work.md` Warehouse row was
committed by the orchestrator from this record's text. Verified: BOSS WarehouseAccessWalk (4 features, about 9 s of its
own), WarehouseIsolationWalk (4, about 7 s), WarehouseAccess, AppStructure, TuiRender, ServerStatic, WarehouseShipping,
WarehousePicking, WarehouseFacilities, AccountingTax, AccountingPayables and ClientWrites 220/220; mr-mantle WarehousePacking
9/9; walks WarehouseShippingWalk, WarehousePickingWalk, WarehouseFacilitiesWalk, AccountingTaxWalk, AccountingPayablesWalk and
AccountingReturnsWalk 15/15; screen lint 129 flagged sites as on master. Commits: the merge, mr-mantle `c48d4ecc`, mr-boss
`ba9ab71`, `8ba9bed` and the docs commit.

