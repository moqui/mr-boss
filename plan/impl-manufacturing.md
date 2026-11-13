# IronStone BOSS — Manufacturing implementation

Nov 4, 2026 — built: P0–P17 done (§3), what is left is §7. Nov 1, 2026 — plan; P0 partly done (F1–F24, found while writing it); the phase order, supply planning, held quantity,
the shared party-role and effective-date rules, the organization filters, the Mantle boundary, the explosion depth and
its open questions decided (§4); consistency pass: brought in line with the Accounting, Warehouse and Products builds
and the Nov 1 decisions

How [design-manufacturing.md](design-manufacturing.md) gets built, in phases from the foundation to the reports, each
ending tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md),
[impl-accounting.md](impl-accounting.md) and [impl-warehouse.md](impl-warehouse.md) are: each phase names its scope by
the design's sections and §12 needs rather than restating them, and the design stays the place for screen and record
detail. During the build this file is the log: phase status and what each built, the decisions made, open questions,
findings against the code, and what is deferred.

Today `screen/Manufacturing/` holds six placeholders, and the root mounts only Chatter and RecordFiles. The
`BOSS_MANUFACTURING` artifact group has only the admin authz (F1). None of the design's proposed
services, entities, fields or status items exist in Mantle or BOSS beyond what Products, Accounting and Warehouse build
first. Manufacturing is built after all three and before Purchasing (§4), so these are there to extend:
- from Products: the four Manufacturing groups its P1 seeds; `check#ProductUsable` and the kit components (P2);
  Product360, Supplier360 and InventoryAvailability; the dated methods of M3 (impl-products §4), `WorkCenter`, `WorkCenterRate`,
  `get#OperationCostBasis` and the five shared method screens with the Products context (P8); approved standard costs
  and CostRollup, the explosion's requirements and buildable quantity, and the method and cost permissions on the
  Manufacturing groups (P9; F22, F24); the barcodes, GS1 parse and labels (P11);
- from Accounting: the AC-06 guard in `post#AcctgTrans` and `repost#AssetIssuance`'s dated reversing delta (P2a); the
  CX-POSTING operation record (P2); EquipmentDetail and ShipmentDetail; InventoryValuation; the production GL account
  types and the scrap account (P13); Setup's WIP account check (P19);
- from Warehouse: facility scope and `AccessServices` (P1); FacilityDetail (P2); the posting guard, `scan-input`,
  `density="handheld"` and Move with a run context (P5); `scrap#Asset` and `AssetReceipt.sourceAssetIssuanceId` (P6);
  `generate#TrackingIdentities` (P7); crosscut CX-QUALITY with QualityInspection and InspectionTemplates (P8); the
  vendor-custody facility and SubcontractShipmentDetail (P15); and Manufacturing's own contracts it builds (P16): the
  runs and their own lines (`create#ProductionOrder`, `release#ProductionOrder`), the stock guards
  (`issue#ProductionMaterial`, `return#UnusedMaterial`, `receive#ProductionOutput`, `receive#SubcontractOutput`) and
  `Shared/MaterialIssueReceipt`'s work-effort source;
- from Projects: the timers, timesheets and their approval, the WorkItems Timeline, RequestDetail, WorkItemDetail and
  OrderDetail.

**Inputs.**
- Designs:
  - [design-manufacturing.md](design-manufacturing.md)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4, §3.3, §3.5–§3.15, §3.17, §3.19,
    §3.20, §3.23, §3.24, §4.1–§4.3, §6 and §7.1
  - [design-products.md](design-products.md): PRD-COST, the kit components and `check#ProductUsable`
  - [design-warehouse.md](design-warehouse.md): MaterialIssueReceipt, SubcontractShipmentDetail, WH-POST and
    WH-HANDHELD
  - [design-accounting.md](design-accounting.md): ProductionCostClose, CostingPolicies, AC-06 and AC-07
  - [design-purchasing.md](design-purchasing.md): SupplyPlanning, and PUR-RECEIPT's `accept#ServiceItem`
  - [design-projects.md](design-projects.md): §5 Timeline, and time and timesheets
- Plans:
  - [impl-products.md](impl-products.md): the pattern; P8, which builds the methods, the five shared method screens
    and the costing part of the work centers; P9's standard costs; the groups its P1 seeds.
  - [impl-accounting.md](impl-accounting.md): the posting guard and the dated issuance reversal (P2a), the production
    GL account types (P13), and its decision that ProductionCostClose and CostingPolicies are built with Manufacturing.
  - [impl-warehouse.md](impl-warehouse.md): P16, which builds the runs, their lines and the stock guards; P5's scan
    input and handheld density; P8's shared quality model; P15's subcontract dispatch.
  - [impl-projects.md](impl-projects.md): the time, timesheet, Timeline, RequestDetail, WorkItemDetail and OrderDetail
    it built.
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28, and the §4.1 plan, make, stock and cost
  steps), [review-core-apps/manufacturing.md](review-core-apps/manufacturing.md) and
  [review-core-apps/seam-make.md](review-core-apps/seam-make.md), which explain the design's D-, R-MFG- and R-SA- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8 (the §8.1 element
  checklist and the §8.2 handheld density), and [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- Inventories: [ss-inventory.md](ss-inventory.md) (its Manufacturing section, 23 forms) and
  [usl-inventory.md](usl-inventory.md).
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

  `runtime/components/addon/mr-marble` is read only, for the baseline `SimpleScreens/Manufacturing/Run` screens and the
  Catalog association forms that design §10.2 maps.
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §12 needs they use: M1–M8, M10 and M11. M9 (batches) is
    `later`.
  - The parts of other apps' needs that Manufacturing depends on (§4):
    - Accounting's ProductionCostClose and CostingPolicies: `mantle.ledger.ProductionCostServices` with BOSS's queue
      read `ironstone.accounting.ProductionCostServices.find#CostCloseQueue`, `ProductionAllocationPolicy`, and the
      ProductionCostReview notice topic in mr-mantle's data (impl-accounting §4);
    - Projects' side of the labor cost, in mr-mantle: the production approver rule in
      `mantle.work.TimesheetServices.get#TimesheetApprovers`, and the hook on its `approve#Timesheet` that calls
      `mantle.work.ProductionServices.record#ProductionCostEvent`;
    - crosscut CX-PLANNING (§4): PlanningRun, PlanningSuggestion and RequirementSupply,
      `mantle.product.SupplyPlanningServices` with the make conversion and the buy conversion of an outside-processing
      requirement, and `Shared/SupplyPlanning`. Purchasing's and Warehouse's mounts, and their other buy and transfer
      conversions, stay theirs.
  - The shared screens no app has built: `Shared/ProductionCostClose`, with the Accounting and Manufacturing contexts,
    and `Shared/SupplyPlanning` with the Manufacturing context.
  - Manufacturing's context on shared screens other apps built:
    - Products' Product360, Supplier360 and InventoryAvailability, and the five method screens (BillOfMaterialsDetail,
      BillOfMaterialsExplosion, BillOfMaterialsCompare, WhereUsed and RoutingDetail);
    - Warehouse's FacilityDetail, MaterialIssueReceipt, QualityInspection and InspectionTemplates;
    - Accounting's EquipmentDetail and ShipmentDetail;
    - Projects' OrderDetail, RequestDetail and WorkItemDetail;
    - Commons' Calendar, Approvals, Chatter and RecordFiles.
  - §7 holds the `later` rows and needs, and the rest of the other apps' needs.
- **Order** (decided Oct 28, 2026), the method and the run first, then what happens to a run, then what plans and
  closes it:
  1. the foundation;
  2. methods, then work centers and equipment, then the production policy and reasons;
  3. work orders: the runs and their lifecycle, then their materials and stock;
  4. cost evidence, so every later fact writes its cost event as it is built;
  5. quantities, by-products and loss, then quality;
  6. controlled changes: substitutes, amendments, splits and disassembly;
  7. the shop floor and time, then downtime;
  8. scheduling and capacity;
  9. supply planning, then subcontracting;
  10. the cost close;
  11. reports;
  12. the finish.

  The operator phases (P5, P7, P10, P11) bring their handheld mounts, on Warehouse P5's `scan-input` and
  `density="handheld"`.

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
- **Production rows through services.** No entity filter covers WorkEffort, so nothing scopes a run, operation or
  routing by organization (F3). Manufacturing reads and writes them only through services:
  `ironstone.manufacturing.AccessServices` checks the user's organizations, the plant facility (through Warehouse's
  facility scope), the run's owner and the capability group, then the screen or mount calls the
  `mantle.work.ProductionServices`, `BomServices` or `RoutingServices` verb, which checks its own permission, the
  organization by party relationship and the facility by its owner. No same-named ironstone service passes it
  through, and other apps call the Mantle name.
  - `entity` in a design form summary means that guarded path, never a bare entity form (design §1.1).
  - Grants are checked in the services, so they hold for exports, search, the palette, the shop floor, handheld mounts
    and shared mounts. `appRoot=Manufacturing`, an assignment or a hidden column is never authorization (design §1.1).
  - A stock action also needs `STOCK_ISSUE`, which Warehouse grants and its guards check with the facility; an
    operator's assignment grants none.
- **One guarded path for each production fact.**
  - Stock moves only through the guards Warehouse P16 built and WH-POST. BOSS never calls
    `set#ProducedProductQuantity`, `create#ProductionRun` with a produce or consume product, `cancel#AssetIssuance` on a
    posted production issuance, or a generic WorkEffort status update (design §13, D13; F8, F9).
  - Every lifecycle change is `transition#ProductionOrder`, from the Lifecycle dialog, the board, a bulk action, the
    shop floor and the cost close alike.
  - Each mutation takes the expected revision and an operation key on Accounting's CX-POSTING record, and a retry
    answers the first result (design §1.1, M2).
  - Released work is immutable. A method, policy or estimate change reaches a released run only through
    `amend#ProductionOrder`, an audit-logged change to the run's remaining lines and operations (M4, §4).
- **One cost event writer.** `record#ProductionCostEvent` writes every cost fact inside the posting transaction that
  causes it, keyed by source, component and revision. Issues and receipts post through the existing hooks once; labor,
  machine, overhead and outside processing reach the GL only through `post#CostClose` (D12, §12.2).
- **Restricted values stay on the server.** A service leaves out any cost, rate, value, supplier price or person's
  rate the user may not read. Money columns need `ACCOUNTING_VIEW`, which Accounting grants its groups; frozen
  estimates need `PRODUCT_COST_VIEW`, which `BOSS_MANUFACTURING_COST` holds. Nothing is fetched and then hidden, and a
  value withheld is omitted, never zero (design §1.1).
- **Shared screens.** Manufacturing builds `Shared/ProductionCostClose` with the Accounting and Manufacturing contexts,
  and `Shared/SupplyPlanning` with the Manufacturing context. It adds its context to the shared screens
  of §1. Each takes `appRoot` and server-derived capabilities, on `Shared/RequestDetail`'s pattern.
- **Owner contracts.** A contract built here for another app follows that app's design: its record and service names,
  its Shared screen and its capability groups, with its logic in the Mantle package of its records (the rules above)
  and its permissions granted to the owner's groups. A change found while building it is written into the owner's
  design. The owner's own screens stay with the owner.
- **Mantle rule changes keep Mantle's default.** A change to an existing Mantle service, such as the production approver
  rule in `get#TimesheetApprovers`, sits behind its own ProductionPolicy flag, off by default (impl-accounting §4).
  Each ships with a test of its condition and of its unchanged default. A new permission check goes on a new Mantle
  service only; an existing one gains a refusal only behind its flag.
- **Mantle callers stay compatible.** Existing callers of these keep working:
  - `mantle.work.ManufacturingServices`, unchanged (R-MFG-35): `create#ProductionRun`, `get#ProductBomDetail` for kits
    and migration comparison, `breakDown#Assembly` and the display and pick queries;
  - `produce#AvailableAssemblies` and the kit components;
  - the Projects timers and the timesheet approval flow.

  Mantle's ManufacturingServices spec passes unchanged (F20), and so do the specs of Products P8, Warehouse P16 and
  Projects' time.
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle without mr-boss, their users in
      spec-local groups that hold the permissions, and BOSS's in mr-boss;
    - the regression suites of mr-mantle and mr-boss passing within their budget;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `ManufacturingAccess` (one holder and one non-holder on one verb, and
    another organization's record refused), not a section per phase;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`test/acceptance/Manufacturing/`, `test/acceptance/client/Manufacturing/`, the
  handheld mounts at 390 px among them), named in the phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 3 (§6 F1–F41) |
| P1 Foundation | Mantle, BOSS | the Manufacturing root and menu, Home | built Nov 3 |
| P2 Methods | Mantle, BOSS | BillsOfMaterials, the five method screens, Routings, OperationTemplates, Product360, Approvals | built Nov 3 |
| P3 Work centers and equipment | Mantle, BOSS | WorkCenters, FacilityDetail, Equipment, EquipmentDetail, ResourceCalendar | built Nov 3 |
| P4 Policy and reasons | Mantle, BOSS | ProductionSettings, ReasonCodes | built Nov 3 |
| P5 Work orders | Mantle, BOSS | WorkOrders, NewWorkOrder, WorkOrderDetail, Overview, Operations, Components, MaterialIssueReceipt, InventoryAvailability | P5a built Nov 3 (the runs and their lifecycle); P5b built Nov 3 (materials and stock) |
| P6 Cost evidence | Mantle, BOSS | ProductionCosts | built Nov 3 |
| P7 Quantities, by-products and loss | Mantle, BOSS | Quantities, ByProducts, ScrapLoss | built Nov 3 |
| P8 Quality | Mantle, BOSS | QualityGates, Inspections, QualityInspection, InspectionTemplates | built Nov 3 |
| P9 Controlled changes | Mantle, BOSS | Components' Substitute, SplitWorkOrder, Disassembly, BillOfMaterialsCompare's amendment | built Nov 3 |
| P10 Shop floor and time | Mantle, BOSS | ShopFloor, OperationExecution, Instructions, ProductionTime | built Nov 4 |
| P11 Downtime and maintenance | Mantle, BOSS | Downtime, EquipmentDetail's request, RequestDetail, WorkItemDetail | built Nov 3 |
| P12 Scheduling and capacity | Mantle, BOSS | ProductionSchedule, Capacity, Operations' Reschedule | built Nov 3 |
| P13 Supply planning | Mantle, BOSS | SupplyPlanning | built Nov 3 |
| P14 Subcontracting | Mantle, BOSS | SubcontractOperations, SubcontractDetail, Supplier360, OrderDetail, ShipmentDetail | built Nov 3, reviewed |
| P15 Cost close | Mantle, BOSS | ProductionCostClose (both mounts), CostingPolicies | built Nov 4 |
| P16 Reports | Mantle, BOSS | Reports and its eight reports, Home's Kpis | built Nov 4 (on P10; P15's cost close read through P6's allocation record), reviewed |
| P17 Finish | BOSS | PlanSnapshot; the reports' and Capacity's prints | built Nov 4 |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F24 were found on Oct 28 while writing this plan. The design edits that §4's
decisions call for were made in the Oct 28 design sweep. Still to check:

- **The other apps' state.** Products, Accounting and Warehouse are built; what each left in its §7 for Manufacturing
  is read when the phase that uses it starts.
- **Disassembly's two reposts** (F15): whether Accounting P2a's `repost#AssetIssuance` delta makes the issuance cancels
  of `breakDown#Assembly` safe, and what its `update#AssetAndReceipt` → `repost#Asset` does to the kit receipt's posted
  transaction in an open and a closed period (design Disassembly), for P9's dated delta (§4).
- **The timesheet hook point.** How `approve#Timesheet`, its return and reopen, and a rate change can call
  `record#ProductionCostEvent` without changing Projects' behavior; and whether the production approver rule is only
  the run as the operations' root with the supervisor in a Manager role (F17).
- **Other paths to a run's status.** Which BOSS groups reach `update#WorkEffort`, `add#WorkEffortProduct` or the
  Mantle REST paths for a WepProductionRun, for example through Projects' work-item services (F9, F10).
- **Commons approvals and Today.** The notification-topic approval contract (impl-accounting F43) for the production
  topics, and the Today provider for assigned operations.

**Done Nov 3.** The five checks above are F25–F41 in §6. Their resolutions bind the phases that read them: P9's
Disassembly needs Accounting's `forwardIssuanceRepostEnabled` and a new `forwardReceiptRepostEnabled` on the kit owner's
PartyAcctgPreference, not ProductionPolicy flags (F29–F32); P10 changes no `get#TimesheetApprovers` rule (F33) and hooks
labor cost at `post#WorkEffortCost`'s call sites (F34, F35); P1 built the task and event guards (F37–F39); P15 adds
Accounting's two PeriodCloseCheck rows and MyFinanceWork's runs awaiting close (F26).

Answered by the Warehouse build: a draft's material and output lines are the run's own `ProductionRunLine` rows from
create, each with its routing operation, then the run's operation child from release, and the guards key an issuance
or receipt by operation key and line (impl-warehouse §4); P16b's issue guard refuses a held asset (HELD_STOCK) and a
shortfall (QUANTITY_EXCEEDS_AVAILABLE), also at a facility that allows issue beyond quantity on hand (F12).

### P1 — Foundation

- **Access** (design §1.1, crosscut §1.4 and CX-ACCESS).
  - The groups of design §1.1. `BOSS_MANUFACTURING_READ`, `_METHOD`, `_METHOD_APPROVE` and `_RESOURCE_ADMIN` exist
    from Products P1 and its organization-filter commit, and `_COST` from Products P9 (F22); their descriptions become
    the design's (F2). The new ones are `_PLAN`, `_SCHEDULE`, `_OPERATE`, `_SUPERVISE`, `_QUALITY_INSPECT`,
    `_QUALITY_VERIFY`, `_QUALITY_ADMIN` and `_DISPLAY`, with `BOSS_MANUFACTURING` as the root user group and
    `BOSS_MANUFACTURING_ADMIN` as the admin group (§4).
  - The permissions (§2). Warehouse P16a seeded `PRODUCTION_VIEW` and `PRODUCTION_PLAN` in mr-mantle; P1 seeds the other
    five, `PRODUCTION_SCHEDULE`, `PRODUCTION_OPERATE`, `PRODUCTION_SUPERVISE`, `PRODUCTION_COST_REVIEW` and
    `PRODUCTION_POLICY_EDIT`, and `SUPPLY_PLAN_RUN`, beside them. BossSetupData grants them with `UserGroupPermission`
    rows: `PRODUCTION_VIEW` to every Manufacturing group but `_DISPLAY`; `PRODUCTION_PLAN` and `SUPPLY_PLAN_RUN` to
    `_PLAN`; `PRODUCTION_SCHEDULE`, `PRODUCTION_OPERATE` and `PRODUCTION_SUPERVISE` to the group of that name;
    `PRODUCTION_COST_REVIEW` to `_COST`; `PRODUCTION_POLICY_EDIT` to `_RESOURCE_ADMIN`. It grants `METHOD_VIEW` to the
    new groups but `_DISPLAY`, and Warehouse P8's `QUALITY_INSPECT` to `_QUALITY_INSPECT`, `QUALITY_VERIFY` and
    `QUALITY_DISPOSE` to `_QUALITY_VERIFY`, and `QUALITY_TEMPLATE_EDIT` to `_QUALITY_ADMIN`. `BOSS_MANUFACTURING_ADMIN`
    holds every one. The method and cost permissions of the method groups, `_COST` and the admin are Products P9's
    grants (F22). `STOCK_ISSUE` and `ACCOUNTING_VIEW` stay Warehouse's and Accounting's grants.
  - The artifact group has only the admin authz (F1); P1 adds the root user group and its `MANTLE_USER_ORG` authz,
    as Warehouse's `BOSS_WAREHOUSE_ROOT`, with the organization filters of impl-drawers-commons §4. `MANTLE_USER_ORG`'s
    Facility filter is the plant scope, as Warehouse's facility scope.
  - `ironstone.manufacturing.AccessServices`: the user's organizations, the plants they may work in, their capability
    groups, and a run's or method's owner and facility. Every Manufacturing screen, mount and shared mount calls it
    before the Mantle verb, which checks its permission and organization again. A supplied run, operation, method,
    work center or asset is checked against it (F3).
  - No artifact authorization for the raw ManufacturingServices verbs or their REST paths, nor for `update#WorkEffort`
    on a run (F9, F10).
- **The Manufacturing root.**
  - The menu of design §1.2: the six placeholders renamed, and Routings, WorkCenters, Quality, Subcontracting,
    Approvals and Reports added (F1). Batches is `later` and left out. Each area shows for its groups only.
  - The plant selector, kept as a user preference that never widens authorization.
  - `<shell-providers>` (M1, CX-SHELL): the palette types (runs, product and method IDs, scoped equipment), quick
    create, the Today sources and the notification topics grow phase by phase, as their records are built.
  - The `manufacturing` key scope.
  - `ironstone.commons.PaletteServices.get#RecordLink` opens runs, BOM versions, routings and work centers under
    Manufacturing for its users.
- **Home** (design §3): Summary and Queue, with the counts of later phases null; Kpis comes with P16.
- **Manufacturing demo data.**
  - `BossManufacturingDemoData.xml` builds on Products P8's released methods for DEMO_1_1, Warehouse P16's demo runs,
    ZIRET_WH and the EQUIP_AB4 assembly robots (F19). It adds two line work centers (FcTpLine) whose parent is
    ZIRET_WH, so a run on a line nets against the warehouse (F16); skill types, operators' PartySkill rows and the
    operation templates' skill standards (F18); and a second organization's plant for isolation, as the phases need
    them. Each demo run has the organization as its owner (F14).
  - `BossUsersDemoData.xml` gains a user per capability, a production reader with no other launcher, and a plant
    display user.
- **Specs.**
  - `ManufacturingShell`: the menu per group, the palette, record links, quick create.
  - `ManufacturingAccess`: the app's one access spec, about seven features run once with authorization on:
    organization and plant scope and the groups' permissions through the services. A later phase adds a case only for
    an access rule it adds.
- **Usable when** (an acceptance test to write): the menu renders for each group, and quick create offers only what the
  group may create. A reader sees their organization's runs and methods but not another organization's, in lists, the
  palette and record links. A forged run, facility or asset ID is refused.

**Built Nov 3 (P1).**
- Mantle: `MantleSetupData.xml` seeds `PRODUCTION_SCHEDULE`, `_OPERATE`, `_SUPERVISE`, `_COST_REVIEW`, `_POLICY_EDIT` and
  `SUPPLY_PLAN_RUN` beside `PRODUCTION_VIEW` and `_PLAN`, each with its ADMIN grant. No service changed.
- BOSS access: the eight new groups and the root user group `BOSS_MANUFACTURING`, the READ, RESOURCE_ADMIN and COST
  descriptions of design §1.1 (F2); the root authz `BOSS_MANUFACTURING_ROOT` (`MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`) and
  the `ironstone\.manufacturing\..*` service pattern on the `BOSS_MANUFACTURING` artifact group; the grants of the plan
  (and `FACILITY_ALL_ORGANIZATIONS` to the admin, as Warehouse's); `manufacturing` added to the client deny pattern; the
  area groups `BOSS_MFG_SHOP_FLOOR`, `_QUALITY`, `_PLANNING`, `_SUBCONTRACTING`, `_SETTINGS`, `_APPROVALS` and the record
  link group `BOSS_MFG_RECORD_LINK`.
- `ironstone.manufacturing.AccessServices` (`get#SharedContext`, `check#Record`, `select#Plant`, `get#Choices`,
  `search#Records`) over `Manufacturing.js`, whose tables later phases extend: `capabilityPermissions`, `recordKinds` (run,
  operation, method, routing, workCenter, asset, facility; a `destination` once a screen is built), `searchFinds`,
  `choiceSources` (plants, workCenters) and `linkPaths`. `HomeServices.get#Home` (all counts null).
- The root: the menu of design §1.2 (the six placeholders retitled and Routings, WorkCenters, Quality, Subcontracting,
  Approvals and Reports added as placeholders, each file's comment naming what its phase builds), `<shell-providers>` with
  the palette source and the `manufacturing` keymap; `template/ManufacturingParts.xml`; Home (plant picker, Summary
  unavailable, Queue empty state, record lookup); `get#RecordLink` for runs, operations and work centers (methods and
  routings once they have a destination).
- F38, F39 guards (BOSS only): `get#TaskAccess` and `check#TaskUpdate` refuse changes to a production run's operation and
  Projects does not find it; `get#EventAccessInfo` does not find a run, so EventDetail and `duplicate#Event` refuse it; a
  run's record link is never a Commons task or event.
- Demo: `BossManufacturingDemoData.xml` (lines `BOSS_MFG_LINE_A`, `_B` under ZIRET_WH with WorkCenter rows, the draft run
  `BOSS_MFG_RUN_A`, skill types, Services' plant `BOSS_MFG_SVC_PLANT`, line `BOSS_MFG_SVC_LINE`, run `BOSS_MFG_SVC_RUN`);
  BossUsersDemoData's `manufacturing.*` users (docs/ManufacturingImplementation.md).
- Specs: `test/Manufacturing/ManufacturingSpecLib.js` (ids, users, `routeFixtures`), `ManufacturingShell` (20 features with their rows)
  and `ManufacturingAccess` (48, sectioned by phase); AppStructure and TuiRender render Manufacturing
  (Manufacturing is in AppStructure's non-placeholder list: its placeholders are found by their label and stay in the
  placeholder feature); WarehouseFacilities' tree expects the two lines under ZIRET_WH.
- Tests run: ManufacturingShell, ManufacturingAccess, AppStructure, TuiRender, WarehouseShell, WarehouseFacilities,
  WarehouseAccess, WarehouseInventory, Tasks, TodayPanel, Calendar, EventDetail, TimeEntries, ClientWrites, ProductsCosts,
  ProductsMethods (BOSS, 412 features, all pass); ManufacturingServices, WarehouseProduction, ProductMethods (Mantle, 26
  pass). `moqui lint --screens`: no idiom or hazard site in the Manufacturing screens.
- Decisions: the restricted areas and their groups above (Home, Work orders, BOMs, Routings, Work centers and Reports open
  to every Manufacturing user); a plant is a facility of type FcTpPlant or the parent of a work center, kept as the
  `ManufacturingPlantActive` preference; the display user is in `_DISPLAY` alone, with no root; no quick create in P1 (P5
  adds the draft work order); methods and routings keep their Products link until P2 gives them a Manufacturing screen.
- Findings (provisional):
  - **F42** Products P8's released methods for DEMO_1_1 are not demo data: ProductsMethodFixtures makes them in specs.
    P1's demo cannot build on them; P2 seeds a released demo method (or the walks load the fixtures).
  - **F43** Warehouse's demo run `BOSS_WH_RUN` is WetTask, while `create#ProductionRun` makes WetEvent (F7). The F38/F39
    guards key on `purposeEnumId`, so both are covered; P1's demo runs are WetEvent. P5 may align the Warehouse demo.
  - **F44** F38's Projects guard also refuses time on an operation through Projects' timers and TimeEntries
    (`TimeServices` checks `get#TaskAccess` need update, app projects). P10's ProductionTime needs its own path or an
    exception for `PRODUCTION_OPERATE` holders on their assigned operations.
  - **F45** Before P1 a run's record link fell through to Commons (WetEvent to EventDetail, WetTask to TaskDetail).
    It now opens Manufacturing, else Warehouse's MaterialIssueReceipt, else nothing.
  - **F46** A Projects team user (joe.developer) has no authorization for `get#RecordLink`; no artifact group grants
    it to the Projects groups. Not changed here.
- **Review (Nov 3).** Checked: the grants match the Access list (PRODUCTION_VIEW to the eleven groups but `_DISPLAY`,
  METHOD_VIEW to the seven new ones but `_DISPLAY`, the admin every production and quality permission);
  `FACILITY_ALL_ORGANIZATIONS` for the admin is §4's "the admin group works in every plant" carried into Mantle's facility
  and stock scope, as `BOSS_WAREHOUSE_ADMIN` (impl-warehouse F84), and gives no stock action without Warehouse's
  `STOCK_ISSUE`. The area groups only deny the root user group and let the capability groups back in with the root's
  filter sets; `rootGrants` reads only root screen rows, so they widen nothing. `recordOf` checks every owner and facility a
  kind names (methods and routings have no facility; an asset is checked by its facility only, stricter than Mantle's
  StockScope). The plant preference is re-checked on every read. Fixes:
  - **R1** (medium) F38: `decorate#TaskRows` still gave an assigned operation `canUpdate` true, so the Commons task list,
    Today's rows and TaskDetail's row offered Mark done, due and priority that the services then refused. It now sets it
    false for a WetTask under a WepProductionRun (the run lookup is authz-free for the purpose only; project names keep
    their authz).
  - **R2** (low) F36: Commons `get#TaskAccess` returned the operation's `actualCost` and client cost (the task roll-up's
    pay-rate cost) to anyone who sees it; the production branch now drops them. ManufacturingAccess's F38 feature checks
    both.
  - F44 also covers Commons' `clockIn#Task` and `add#TimeOnTask`, which check `get#TaskAccess` need update. Timesheet
    views and approval do not check the item, so production time logged elsewhere still shows and is approved in Projects.
  - Specs: ManufacturingAccess, ManufacturingShell, Tasks, TodayPanel, Requests, WorkItems, WorkItemDetail, TimeEntries,
    EventDetail, AppStructure, WarehouseAccess (BOSS, 294 features), ManufacturingServices, WarehouseProduction,
    ProductMethods (Mantle, 26), all pass.
- **Wave 1 suites (Nov 3, on master after the merge):** standalone mr-mantle 1,437 passed, 2 failed (the baseline
  WorkTimeEntries and WorkTimesheets), 11 skipped; mr-boss 1,643 passed; `moqui lint --screens` clean; BOSS client walks
  125 passed.
- **Wave 2 suites (Nov 3, on master after P2, P3 and P4 merged):** standalone mr-mantle 1,454 passed, 2 failed (the
  baseline WorkTimeEntries and WorkTimesheets), 11 skipped; mr-boss 1,668 passed, 1 failed: WarehouseFacilities expected
  ZIRET_WH's exact children and met ManufacturingWorkCenters' spec cell, so it now checks the demo children are there
  (fixed); `moqui lint --screens` clean; BOSS client walks 135 passed.
- **Wave 3 suites (Nov 4, on master after P5a, P6 and P13 merged):** standalone mr-mantle 1,480 passed, 2 failed (the
  baseline), 11 skipped; mr-boss 1,685 passed, 1 failed: ClientIsolation found `Shared/SupplyPlanning` unclassified, now
  in its refused list (a client is refused it); `moqui lint --screens` clean; BOSS client walks 143 passed.
- **Wave 4 suites (Nov 4, on master after P5b, P7 and P11 merged):** standalone mr-mantle 1,501 passed, 2 failed (the
  baseline), 11 skipped; mr-boss 1,704 passed, 1 failed: ManufacturingShell expected the demo's released run among Home's
  first ten due work orders, which other specs' runs can fill, so it now checks a due row is listed (fixed);
  `moqui lint --screens` clean; BOSS client walks 150 passed.
- **Wave 5 suites (Nov 4, on master after P8, P12 and P14 merged):** standalone mr-mantle 1,521 passed, 3 failed (the
  baseline two, and AccountingCollections' credit aging read 9 overdue days for 10 when run at 23:37 CST, after UTC
  midnight: a date-boundary issue in Accounting's Credit.js, which Manufacturing does not touch), 13 skipped; mr-boss
  1,724 passed, 1 failed: ManufacturingWorkOrders' find by product paged past its run once other specs' DEMO_1_1 runs
  filled the first page (it now asks for a larger page; fixed); `moqui lint --screens` clean; BOSS client walks 159
  passed, 1 failed (AccountingCloseWalk's dialog timed out; it passed alone).
- **Wave 6 suites (Nov 4, on master after P9 and P10 merged):** standalone mr-mantle 1,549 passed, 3 failed (the
  baseline two, and InvoicePaymentMisc: its spec moved a payment past midnight while its application stayed on the day
  before, when run between 00:15 and 00:30; fixed in the spec), 11 skipped; mr-boss 1,734 passed, 2 failed: ManufacturingMethods
  and ManufacturingShopFloor published instructions on the same demo template (each now checks its own; fixed);
  `moqui lint --screens` clean; BOSS client walks 165 passed, 1 failed: ManufacturingShopFloorWalk could not complete a
  lot-required output (F145; fixed).
- **Wave 7 suites (Nov 4, on master after P15 and P16 merged):** standalone mr-mantle 1,567 passed, 2 failed (the
  baseline), 11 skipped; mr-boss 1,745 passed, 1 failed: AccountingAccessWalk's section map did not have P15's approver
  read of Inventory (F133; the map now does); `moqui lint --screens` clean; BOSS client walks 173 passed.
- **test-all (Nov 4, after P17 merged):** `cargo test --workspace` 1,431 passed, 3 failed: the screen goldens of mr-moqui
  477f9e89's column chooser fix (F141), whose only change is the fields' hide condition, regenerated (mr-moqui 17cdb779);
  the opt-in host tests, the `moq` tests, the demo specs and the webroot and dev-aide offline client specs passed; `moqui
  test` 4,009 passed, 1 failed: ManufacturingShopFloor's labor event took ProductionShopFloor's costing rate, a Mantle spec
  rate of no position class that costs any component's production time (RateAmount names no organization), so the Mantle
  spec's rates now take a position class of its own (fixed; the two pass together); `moqui test-client --serve` 419
  passed, 3 failed: basic-comms' CallFlow, CallGuestFlow and EncryptedCallFlow time out on Runtime.evaluate, alone too and
  with 477f9e89 reverted, so they are not from this build.

### P2 — Methods

The rest of M3 and CX-METHOD (design §5, crosscut §3.23), over Products P8's records and services.

- **`mantle.work.RoutingServices`, the rest:** `find#Routings`, `find#OperationTemplates`, `store#OperationTemplate` (a
  WepRoutingTask with its standards, center requirement and quality template), and `store#OperationInstruction`, which
  publishes an instruction as a dated `WorkEffortContent` row on the template, its file immutable with a checksum
  (§4); `WorkEffortContent` gains audit-logged `fromDate` and `thruDate`. The required evidence and the quality
  template are audit-logged template fields. Copy operations from another routing makes draft copies with their
  source identity.
- **Permissions:** the method verbs, Products' and these, check `METHOD_VIEW`, `METHOD_EDIT` and `METHOD_APPROVE`, and
  cost read for the estimate (`PRODUCT_COST_VIEW` or `ACCOUNTING_VIEW`), through `MethodPolicy.js`, which Products P9
  moved from group names to permissions (F22).
- **Screens:**
  - BillsOfMaterials: Find, the list over `find#Boms` with kits left out (D15), and NewBillOfMaterials. Clone revision,
    and the legacy import Products P8 built.
  - The Manufacturing context on the five shared method screens: BillOfMaterialsDetail with its Header, Components,
    Operations (the RoutingDetail mount), By-products, Instructions, Cost estimate (Products' CostRollup for this
    version), Where used, Revision history and Notes tabs, and ValidateRelease; BillOfMaterialsExplosion;
    BillOfMaterialsCompare (its amendment action is P9); WhereUsed, with kit usage read only; RoutingDetail.
  - Routings: Find, the list, NewRouting.
  - OperationTemplates: Templates, EditTemplate and InstructionVersion. Archive blocks new use only.
  - Product360: Products' `Shared/Product360` with the Manufacturing row of crosscut §3.5. The BOM tab mounts the method
    screens; cost estimates show only with cost read (R-MFG-37).
  - Approvals: the Commons Notifications mount at `Manufacturing/Approvals` (crosscut §3.15), filtered by its approval topics
    (impl-accounting §4, F43), with method release as its first topic when the organization separates drafting
    from release. Later phases add their topics.
- **Chatter and files** on the BOM (ProductBomContent, from Products P8), the routing and the operation
  template (WorkEffortContent), registered in `get#RecordLinkInfo`.
- **Outputs** (design §11): the BOM and routing print, the explosion and compare as print and CSV, and the BOM and
  routing CSV import with its preview. Each version imports atomically, a bad one is named and skipped, kit rows are
  left out, and release stays explicit.
- **Palette:** BOMs and routings.
- **Usable when:**
  - a method engineer builds a routing from two operation templates, one with a published instruction, and a
    BOM version for DEMO_1_1 whose component is consumed at the second operation;
  - validation names a cycle and an overlapping effective window; the engineer cannot release, and the approver
    releases;
  - released lines cannot be edited, and a change is a draft of new lines that a release stamps;
  - WhereUsed shows the component's parents, and DEMO_PA's kit read only with its link to the Kit components pane;
  - an import of two versions with one bad unit applies the good one and names the other.

**Built Nov 3 (P2).**
- Mantle: `WorkEffort` gains the audit-logged `methodSourceWorkEffortId`, `methodRequiredEvidence`,
  `methodInspectionTemplateId` and `methodArchived`; `WorkEffortContent` gains audit-logged `fromDate`, `thruDate` and
  `contentChecksum`, with the `WectInstruction` content type. `OperationTemplates.js` (an operation template is a
  WepRoutingTask with no routing): `find#OperationTemplates`, `store#OperationTemplate`, `store#OperationInstruction`
  (stored once under `dbresource://mantle/content/workEffort/`, SHA-256 checksum, a publish ends the one in effect) and
  `copy#RoutingOperations` (draft copies with their source, standards, evidence, inspection template and resources;
  predecessors follow; archive blocks new copies). `MethodReleases.js`: `request#BomRelease`, `request#RoutingRelease`
  (checks first; notifies METHOD_APPROVE holders of the organization through `Payables.js` notify) and the release's
  clearing of the notices (added to `release#BomDraft` and `release#RoutingDraft`); topics `BomRelease` and `RoutingRelease`
  in `MethodNotificationSetupData.xml`. `MethodTransfer.js`: `clone#Bom`, `import#BomCsv` and `import#RoutingCsv` with
  preview, each version in its own transaction (`import#BomVersion`, `import#RoutingVersion`), kits skipped, nothing
  released. `find#Boms` and `find#Routings` take `text` (in the query) and leave kits out quietly; `find#Routings` rows have
  their last release and operation counts; `validate#BomDraft` names an overlapping effective window. Every verb checks
  `METHOD_VIEW`, `METHOD_EDIT` or `METHOD_APPROVE` and the organization through `MethodPolicy.js`.
- BOSS: Products' `SharedContext.js` `manufacturingContext()` (read with METHOD_VIEW, product master read only, the
  crosscut tabs, Costs with cost read, Kit components read only, Manufacturing `sharedLinks`); `Methods.js` takes a routing
  with no product (Manufacturing's Routings) and routes `copy#RoutingOperations`, `request#BomRelease` and
  `request#RoutingRelease`. Screens: `BillsOfMaterials` (Find list, New BOM, Clone, legacy and CSV import; mounts
  BillOfMaterialsDetail, WhereUsed, Product360 and CostRollup), `Routings` (Find list, New routing, CSV import; RoutingDetail;
  OperationTemplates with Publish instruction, Edit, Archive, instruction history and file, notes and files), `Approvals`
  (Commons Notifications with `BomRelease`, `RoutingRelease`; BOSS `linkTemplate`s and the root's `<notification-topic>`).
  Shared method screens: Request release for an editor without release authority, Print (html-print) on the method, routing,
  explosion and compare, Copy operations and Notes and files on RoutingDetail, and where used's kit rows link to Kit
  components. `ironstone.manufacturing.MethodServices` (`get#BomList`, `get#RoutingList`, `get#TemplateList`) adds display
  text and paging over the Mantle finds. `Manufacturing.js`: methods and routings (and operations, templates) have their
  destinations, so the palette and `get#RecordLink` open them in Manufacturing; choices `products`, `operationSources`,
  `inspectionTemplates`.
- Demo (F42): operation templates `BOSS_MFG_OPT_ASSEMBLE`, `BOSS_MFG_OPT_TEST`, the released routing `BOSS_MFG_ROUTING_A`
  copied from them and the released BOM `BOSS_MFG_BOM_PILOT` of DEMO_1_1 (method code PILOT), DEMO_RM_1 at the second
  operation, with their release decisions and the audit rows they name.
- Specs: rule tests Mantle `MethodTemplates` (4) and BOSS `ManufacturingMethods` (6, the rules of the "usable when"
  items), `ManufacturingAccess` P2 section (8 more); no route fixtures. Acceptance test: the client walk
  `ManufacturingMethodsWalk` (5, with the 390 px lists). Tests run: Mantle MethodTemplates, ProductMethods,
  ManufacturingServices, WarehouseProduction (30, pass); BOSS ManufacturingMethods, ManufacturingAccess,
  ManufacturingShell, AppStructure, TuiRender, ProductsSharedContext, ProductsAccess, ProductsScreens,
  ProductsInventory, Notifications, Files, WarehouseShell, WarehouseAccess, ProductsMethodFixtures, ProductsMethods,
  ProductsCosts, ProductsShell (422, pass), WarehouseProductionFixtures (pass); client ManufacturingMethodsWalk and
  ProductsMethodWalk (pass). `moqui lint --screens`: no idiom or hazard site in the changed screens.
- Decisions: two release topics, `BomRelease` and `RoutingRelease` (a topic has one `linkTemplate`); Request release is
  offered to a method editor without METHOD_APPROVE, as no setting says whether an organization separates drafting from
  release (a ProductionPolicy flag is P4's to add if wanted); a request whose checks fail is answered with its findings as
  warnings and sends nothing; the BOM's notes and files stay in Overview (Products P8 put them there), so no Notes tab;
  Copy operations shows in the Manufacturing context only; the demo method's code is PILOT so Products' MAIN fixture
  method of DEMO_1_1 stays its own.
- Deferred: an operator's acknowledgment and a run's instruction as of release (P10); editing a template's equipment and
  skill standards (the demo has one; `store#RoutingResource` is for routing operations); templates in the palette; a "Not
  available" state for a missing routing in RoutingDetail; where used's bulk replacement (`later`).
- Findings (provisional):
  - **F47** Products' `Methods.js` stored a routing with no `workEffortId` into the method's routing (native's fallback),
    so "New routing" for a product whose method has one edited that routing; ProductsMethodFixtures did that to the demo
    routing. A routing stored with no id is now new.
  - **F48** Products' specs assume DEMO_1_1's MAIN and DEMO_3_1 have no method (ProductsMethodFixtures, ProductsMethodWalk),
    so the demo method is DEMO_1_1's PILOT; `find#Boms` now orders by product and method code, so Product360 opens MAIN
    first when there is one. AppStructure's BillOfMaterialsDetail text is now one the seeded method shows.
  - **F49** DEMO_1_1, DEMO_SA_1, DEMO_SA_2 and DEMO_RM_1 have no `amountUomId`, so `store#Bom` and `store#BomItem` need
    an explicit unit for them; the CSV import asks for `baseUomId` then.
  - **F50** Manufacturing users reach the Mantle method verbs and Products' `ironstone.products.MethodServices` only
    through the screens' inherited authorization (no artifact group grants them directly); the specs call them with
    authorization off, where each service's permission check refuses.
  - **F51** A screen-local variable named `selected` is passed to the shared `choices` transition (`in-map="context"`) as
    the selected value; OperationTemplates' selected template is `selectedTemplate` for that reason.
- Review (Nov 3):
  - Fixed: the `operationSources` choice left every template out when given the routing (`parentWorkEffortId <> ?` drops
    the templates' null parent), so Copy operations offered other routings' operations only; it now keeps a null parent,
    and the P2 method choices answer nothing to a user without METHOD_VIEW. ManufacturingMethods checks the templates are
    offered.
  - Fixed: a published instruction was immutable only in `store#OperationInstruction`; its publisher could remove it (row
    and file) from the template's Files, and the generic WorkEffortContent services could replace its file. Mantle's
    `WorkEffortInstructionImmutable` EECA (Work.eecas.xml, `OperationTemplates.js` `guardInstruction`) now refuses a
    delete, a change of its file, checksum, type, template or start, a reopened end, and a create without a checksum under
    the instruction store; RecordFiles lists it as not removable and refuses its removal. MethodTemplates covers each.
  - Fixed: Products' `Methods.js` opened a product's first method by method code (F48's sort), so an `ALT` method came
    before MAIN; it opens MAIN when there is one, as Mantle's cost roll-up picks.
  - Spec: a METHOD_APPROVE holder of another organization gets no release notice (MethodTemplates).
  - Checked, no change: F47 (every Products caller of `store#Routing` that edits passes `workEffortId`; New routing shows
    only without one); the overlap finding (release already refused a date before the latest approval, so only
    `validate#BomDraft` and the request show it); the CSV imports (each version in its own transaction through
    `import#…Version`, which checks METHOD_EDIT again; kits skipped; nothing released); `clone#Bom`; the Manufacturing
    context (each capability is the user's own CatalogAccess capability, Costs only with cost read); F50 (the Mantle and
    Products method services are `allow-remote="false"` and check their permissions, and the palette reads through
    `search#Records`, so no REST or palette path reaches them).
  - Specs run: Mantle MethodTemplates, ProductMethods, ManufacturingServices, WarehouseProduction (30, pass); BOSS
    ManufacturingMethods, ManufacturingAccess, ProductsMethods, ProductsMethodFixtures, ProductsSharedContext,
    ProductsCosts, Files (123, pass), RecordFiles, AccountingIssuedFiles, AccountingPaymentFiles (20, pass); client
    ManufacturingMethodsWalk and ProductsMethodWalk (6, pass).

### P3 — Work centers and equipment

The rest of M5 and CX-WORKCENTER (design §6), over Products P8's `WorkCenter` and `WorkCenterRate`.

- **Records:** `WorkCenterCapacity` (by product or type, quantity and unit per duration, or parallel slots, dated) and
  `WorkCenterAlternate`, with the WorkCenter fields P8 left out: plant, calendar, efficiency, OEE target and scheduling
  policy. Facility.capacity stays people capacity.
- **Services:** `store#WorkCenter` extended, under `METHOD_RESOURCES`, and its rate under `METHOD_COST_EDIT` and
  `METHOD_COST_APPROVE`, as built; `mantle.work.ProductionPlanningServices.get#WorkCenterLoad` (`PRODUCTION_VIEW`),
  first from capacity and released operations only; P12 adds the calendar, downtime and the schedule.
- **Screens** (design §6):
  - WorkCenters: Find, Centers and NewCenter, on an existing facility or a new FcTpLine;
  - FacilityDetail: Warehouse's `Shared/FacilityDetail` with the Manufacturing context: the WorkCenter extension,
    calendar, equipment, capacities, efficiency, the rate with cost read only, alternates, and Chatter and files;
  - Equipment: Find and the list over Asset and WorkEffortAssetAssign;
  - EquipmentDetail: Accounting's `Shared/EquipmentDetail` with the Manufacturing row of crosscut §3.10: assignments,
    qualifications, maintenance history and documents, and safe-use instructions for a read-only operator. Its
    downtime and request maintenance come with P11;
  - ResourceCalendar: Commons Calendar with the plant and work-center resources, read only.
- **Usable when:**
  - a resource administrator makes a facility a line work center with two parallel slots, a capacity per hour for
    DEMO_1_1 and a dated rate, and a rate needs cost authority;
  - the facility's people capacity is unchanged;
  - an operator reads the center without its rate, and the calendar shows its work hours and holidays.

**Built Nov 3 (P3).**
- Mantle records (`entity/WorkCenterEntities.xml`): WorkCenter gains `plantFacilityId` and `schedulingPolicyEnumId`
  (WorkCenterSchedulingPolicy: forward, backward, manual), audit-logged; `WorkCenterCapacity` (WorkCenterCapacityBasis
  `WccbRate`, a quantity in a unit per a time, or `WccbSlots`, parallel slots; for a product, a product type or every
  product; dated) and `WorkCenterAlternate` (another center of the organization, for a product or every one, with sequence
  and qualification; dated). Dated rows are never changed except to end them.
- Mantle services: `WorkCenters.js` behind `RoutingServices.store#WorkCenter` (extended: plant, scheduling policy, and with
  no facility a new FcTpLine under the plant; Facility.capacity is never written; Routings.js's `center` delegates to it) and
  the new `mantle.work.WorkCenterServices` (`get#WorkCenter`, `store#WorkCenterCapacity`, `store#WorkCenterAlternate`):
  writes under `METHOD_RESOURCES` in the facility's organization (MethodPolicy), reads with a production or method read
  permission and the facility scope, the rates only with cost read (left out, not empty, without it). The rate stays
  `store#WorkCenterRate` as built (resources and `METHOD_COST_EDIT`/`METHOD_COST_APPROVE`). `ProductionPlanningServices`
  `get#WorkCenterLoad` (`ProductionPlanning.js`, `PRODUCTION_VIEW`): per center its slots and rate capacities, nominal hours
  (slots × range × efficiency) and the standard hours of its released operations over the range (machine time, else labor,
  for the run's output quantity), with a finding per operation whose hours do not read.
- BOSS: `ironstone.manufacturing.WorkCenterServices` over `WorkCenters.js` (FacilityDetail's Manufacturing header,
  `find#Equipment`, `get#Equipment`, `get#ResourceCalendarEvents`); Manufacturing.js's P3 block (destinations: a work center
  and a facility open FacilityDetail, an asset EquipmentDetail; the sharedLinks; the choices centerFacilities, calendars,
  products, quantityUnits, timeUnits, schedulingPolicies, capacityBases, equipmentTypes, rateComponents, currencies).
- Screens: WorkCenters (tabs Centers with Find and New work center, Equipment, Calendar; FacilityDetail and EquipmentDetail
  mounted hidden); `Shared/FacilityDetail` with the Manufacturing context (the header without Edit facility, Overview, the new
  Work center tab with the extension, capacities, rates for cost readers, alternates and load, Files and Conversation; the
  Warehouse tabs hidden there); `Shared/EquipmentDetail`'s Manufacturing context (`template/ManufacturingEquipment.xml`:
  availability with a do-not-use warning, safe use, identity without book or cost, production assignments, qualified
  operations, maintenance history); ResourceCalendar, Commons `Calendar.qvue` in a new read-only resource mode, with its
  terminal twin ResourceCalendarTui.
- Demo: line A's calendar (a weekday day shift, a shutdown day), two slots, 30 DEMO_1_1 an hour, line B as its alternate and
  an approved machine rate; both lines' plant and scheduling policy.
- Specs: rule tests Mantle `WorkCenters` (5 features) and BOSS `ManufacturingWorkCenters` (5, the rules of the "usable
  when" items), ManufacturingAccess's P3 section (3 features, 4 cases), ManufacturingShell's link rows and the mounts in
  ManufacturingSpecLib; no route fixtures. Acceptance test: the client walk `ManufacturingWorkCentersWalk` (3, with
  390 px).
- Tests run: Mantle WorkCenters, ManufacturingServices, WarehouseProduction, ProductMethods, ProductStandardCosts (56, pass);
  BOSS ManufacturingWorkCenters, ManufacturingAccess, ManufacturingShell, AppStructure, TuiRender, WarehouseFacilities,
  WarehousePolicies, WarehouseAccess, Calendar, AccountingFixedAssets, TimelineWalk, ProductsMethods (all pass); the client walk
  (3, pass). `moqui lint --screens`: no flagged site in the changed screens.
- Decisions: capacities, alternates and the center read are a new `mantle.work.WorkCenterServices` rather than
  RoutingServices, which P2 extends (written into design §12.1); a center with no slots capacity counts as one slot; a new
  center's plant defaults to the facility's parent; a dated capacity starts now or later (a day given as today starts now)
  and ends the row of the same basis and product in effect; FacilityDetail's identity is edited in Warehouse only; the
  ResourceCalendar is the Commons component's resource mode (design ResourceCalendar).
- Findings (provisional):
  - **F52** The cost estimator (`BOSS_MANUFACTURING_COST`: `METHOD_COST_EDIT`, no `METHOD_RESOURCES`) cannot add a rate:
    Products P8's `store#WorkCenterRate` needs the resources capability and the cost one. Only a user with both (the admin)
    adds one; the plan's "a rate needs cost authority" holds. Granting `METHOD_RESOURCES` to `_COST`, or a rate scope of its
    own, is a decision for the cost phases (P6, P15).
  - **F53** The Mantle verbs the screens call are authorized through the screen they run in (the root's inherited authz),
    not the `BOSS_MANUFACTURING` artifact group, so a spec calls them as a user with artifact authorization disabled, as the
    Mantle specs do; the Mantle permission checks are what refuse.
  - **F54** `Calendar.qvue` found its transitions by a path element named `Calendar`; it now also takes `ResourceCalendar`.
  - **F55** A released operation copies its run's estimated dates (Warehouse P16a), so the calendar and the load place each
    operation over its whole run until P12 schedules operations; work hours on a shutdown day show beside it, and the load's
    nominal hours do not subtract work hours, holidays or downtime (P12).
  - **F56** ProductMethods' record-callback feature read "the" WorkCenterRate audit row without its key, so a rate made by
    another spec earlier in the same run (WorkCenters) broke it; it now reads its own rate's row.
  - **F57** Centers has no next-available or offline-reason columns and Equipment no downtime action: they come with P11
    and P12. P1's ManufacturingAccess `store` helper and ManufacturingShell's `outsider` line are not Prettier-clean; left so
    as not to conflict.
- **Review (Nov 3).** Checked against the scope, §2 and the usable-when items; the rate is omitted (not zeroed) for a
  non-cost reader and no screen fetches it to hide it; the Warehouse and Accounting actions and values stay out of the
  Manufacturing contexts; the Commons calendar's own modes are unchanged. Fixed:
  - ending a dated capacity or alternate could set an end before now (rewriting what was in effect), and ending a row that
    had not started failed ("end before the start"); an end is now or later (a day given as today is now), and a future row
    ends at its start, withdrawn, so the same row can be added again (a Mantle WorkCenters feature);
  - a new center's plant defaulted to its parent even when that parent was another organization's, which then refused
    store#WorkCenter for a facility Products P8 accepted; it now defaults only to a parent of the same organization;
  - get#ResourceCalendarEvents read the holidays of a given plant's owner without checking the plant was the user's;
  - the Add rate dialog offered Approve to a user without the approval authority (Mantle refused it).

  F52 is agreed: the plan keeps `store#WorkCenterRate` "as built" (resources and the cost authority), and the
  usable-when's "a rate needs cost authority" holds (the resource administrator alone is refused). Left: the load counts
  the whole hours of an operation that overlaps the range, not the part inside it, with the run's dates on each operation
  (F55), until P12 schedules operations; store#WorkCenter's new line has no operation key, so a double submit makes two
  lines (as P8's verb, no key).
  Tests: Mantle WorkCenters (6), ProductMethods, ManufacturingServices, WarehouseProduction, ProductStandardCosts (57,
  pass); BOSS ManufacturingWorkCenters, ManufacturingAccess, ProductsMethods, Calendar (92, pass); `moqui lint --screens`
  flags none of the changed screens.

### P4 — Policy and reasons

- **Records:** `mantle.work.production.ProductionPolicy`, effective-dated rows with their key fields audit-logged
  (impl-drawers-commons §4), with an organization default
  and an explicit plant override (design ProductionSettings): consumption (manual or backflush, issue point,
  over-consumption and overproduction tolerances, substitute approval, quality defaults), time and cost (time-log
  enforcement, machine runtime, work type, piece rate, estimate refresh), and planning (horizon, time fence, shortage
  release policy, calendar, lead-time basis, freshness limit). The production reason codes (design ReasonCodes), with
  category, equipment fault, planned stop and approval threshold, effective-dated. A run keeps the policy row it was
  released under.
- **Services:** `store#ProductionPolicy` and `store#ProductionReasons` under `PRODUCTION_POLICY_EDIT`, and
  `get#ProductionPolicy` with the source of each value.
- **The issue guard's scrap allowance:** `issue#ProductionMaterial` admits an issue beyond the line's remainder up to
  the over-consumption tolerance, which Warehouse P16b refuses today (QUANTITY_EXCEEDS_REMAINING; impl-warehouse §5).
- **Screens:** ProductionSettings (Consumption, TimeAndCost with a read-only link to CostingPolicies, Planning) and
  ReasonCodes. The shortage release policy defaults to all components usable, with staged release by supervisor
  approval (design §13).
- **Usable when:**
  - an administrator sets an organization default and a plant override of the overproduction tolerance, and the
    resolved policy names each value's source;
  - a referenced reason can be deactivated, not deleted;
  - a policy change reaches no released run (checked in P5);
  - an issue within the over-consumption tolerance passes, and one beyond it is refused.

**Built Nov 3 (P4).**
- Mantle: `entity/ProductionPolicyEntities.xml` (a new file, so it merges apart from `ProductionEntities.xml`):
  `mantle.work.production.ProductionPolicy`, keyed by organization, facility (`_NA_` for the organization's default) and
  `fromDate`, every field audit-logged; and `ProductionReason`, keyed by organization, `reasonCode` and `fromDate`
  (name, category, `equipmentFault`, `plannedStop`, `approvalThreshold`, sequence). The seeded enumerations:
  ProductionConsumption, ProductionIssuePoint, ProductionTimeLog, ProductionMachineRuntime, ProductionShortageRelease
  (`PsrAllUsable`, the default: all components usable, with staged release by supervisor approval; `PsrStaged`),
  ProductionLeadTimeBasis and ProductionReasonCategory.
  - Policy fields: consumption (`consumptionMethodEnumId`, `issuePointEnumId`, `overConsumePercent`,
    `overProducePercent`, `substituteApproval`, `outputInspection`, `firstPieceInspection`, and the flags
    `completeOnFinalReceipt` for P7 and `strictRelease` for P9); time and cost (`timeLogEnforcementEnumId`,
    `machineRuntimeEnumId`, `workTypeEnumId`, `pieceRate`, `laborCostSync` (the F34 hook flag P10 reads), `estimateRefresh`,
    `closeApproval`); planning (`planningHorizonDays`, `timeFenceDays`, `shortageReleaseEnumId`, `calendarId`,
    `leadTimeBasisEnumId`, `freshnessLimitHours`). The built-in defaults are Mantle's behavior with no row, and every
    flag is N.
  - `service/mantle/work/ProductionPolicy.js`, with four services appended to `ProductionServices.xml`:
    `get#ProductionPolicy` (PRODUCTION_VIEW or PRODUCTION_POLICY_EDIT). It resolves the built-in defaults, then the
    organization's row, then each facility's row from the topmost down to the given facility. So a line inherits its
    plant's override. It answers each value's source (`sources`, and `traceRows` with display text), the row at the exact
    scope with its `expectedFromDate`, the history and `canEdit`. With `workEffortId` it reads the run's owner and facility
    as of its release time; with `asOfDate`, any other time.
  - `store#ProductionPolicy` (PRODUCTION_POLICY_EDIT) makes a dated change of the given fields. With `policyGroup` it
    changes only that form's group. It refuses a stale `expectedFromDate` (POLICY_CHANGED), a start before now, a second
    row at the same time and invalid values (POLICY_INVALID).
  - `find#ProductionReasons`: the active codes, or with `includeInactive` the inactive ones too; `reasonCode` gives that
    code's history.
  - `store#ProductionReasons` takes a list. It adds, changes (by a dated row) or deactivates each reason on its own,
    and names a refused row in `results` while it stores the others. Nothing is deleted.
  - Internal helpers for later phases: `effective(org, facility, at)`, `runPolicy(run)`, `overConsumeAllowance(run, line)`
    and `activeReason(org, code, at)`.
  - The issue guard (`Production.js` `issuePlan`, a local edit): a line may be issued up to its quantity plus
    `overConsumePercent` of it, minus what was already issued net. The percent comes from the policy as of the run's
    release. With no row the allowance is zero, and QUANTITY_EXCEEDS_REMAINING is unchanged. Subcontract output's own
    remainder check (`subcontractPlan`) is unchanged.
- BOSS: `Settings` became the tab parent of `Settings/ProductionSettings` and `Settings/ReasonCodes`, behind P1's
  BOSS_MFG_SETTINGS area. ProductionSettings has a plant and organization picker and three boxes (Consumption, Time and
  cost, Planning). Each box lists its values with their sources and has a Change dialog that saves its own `policyGroup`.
  Below them is the history of the dated rows. ReasonCodes has an organization picker, an Active or All filter, Add reason
  (the primary action), and Edit, Deactivate (danger, confirmed) and Reactivate on each row. `Manufacturing.js` gained the
  `organizations` choice. BossManufacturingDemoData seeds six Retail reasons and no policy row, so the demo runs keep
  Mantle's issue guard.
- Specs: Mantle `test/work/ProductionPolicy.spec.js` (7 features, about 3 s). It covers the defaults; an organization
  default and a plant override of the overproduction tolerance with their sources, and a line's inheritance; stale,
  back-dated, invalid and unpermitted changes; a group-only change; an issue within the 10% allowance passing and one
  beyond it refused, alongside a run released before any policy keeping the default; a run keeping the policy of its release
  through a later change, with a run released afterwards taking the change (P5's check, ready for it); and reasons stored,
  changed, refused, deactivated and kept.
  - ManufacturingAccess gained a P4 section (3 features: the resource administrator against a reader and the other
    organization; the Settings pages with authz enabled).
  - ManufacturingSpecLib's routes cover the three Settings paths in AppStructure and TuiRender.
  - Client walk `test/client/Manufacturing/ManufacturingPolicyWalk.spec.js` (2 features), added to `suite.js`.
- Tests run: Mantle ProductionPolicy, ManufacturingServices, WarehouseProduction and ProductMethods (33 features, all
  pass). BOSS ManufacturingAccess, ManufacturingShell, AppStructure, TuiRender, WarehouseProductionFixtures and
  WarehouseAccess (230 features, all pass). The walk ManufacturingPolicyWalk passes (2). `moqui lint --screens` shows only
  informational anchor rows for the new screens.
- Decisions:
  - Reason codes are an organization's own dated rows keyed by code, not Enumerations. An event names the code and
    copies the classification of the row in effect at its date, so later changes apply going forward. There is no delete
    service, so "referenced" needs no check. Translated labels are not built.
  - Reasons are edited with row dialogs. The design's editable grid is not built.
  - The resolution walks the facility's parents, so an override on a line under a plant works too. The screen offers
    plants only.
  - TimeAndCost's link to CostingPolicies is a note until P15 builds that screen. P15 replaces the note with the
    read-only link.
- Findings (provisional):
  - **F58** The design's TimeAndCost "production approver rule" flag is not built: F33 dropped it, since the run's
    supervisor in a Manager role is enough under the default timesheet policy. The design's TimeAndCost row and Actions
    now name the labor cost flag in its place.
  - **F59** F38's optional Mantle refusal in `update#Task` and `set#TaskStatus` behind a ProductionPolicy flag is not
    built. P1's BOSS guards cover the paths, and no phase asked for it.
  - **F60** The walks' database outlives a `test-client --serve` run, so a walk that adds a record by a fixed code
    fails on its second run. ManufacturingPolicyWalk uses a code made for each run.
  - **F61** For P5: `release#ProductionOrder` already stamps `productionReleaseDate`, and no policy row can start
    before now. So `ProductionPolicy.js` `runPolicy(run)`, or `get#ProductionPolicy` with `workEffortId`, is the policy
    the run keeps, with no copy on the run. P5's release gate reads `shortageReleaseEnumId` there. P7 reads
    `overProducePercent` and `completeOnFinalReceipt`, P9 `strictRelease` and `substituteApproval`, and P10
    `laborCostSync`, `pieceRate` and `timeLogEnforcementEnumId`.
- **Review (Nov 3).** Checked: no overlapping rows from either store path; the as-of read at the release time; the
  organization and facility checks (a plant of another organization refused, read and change); the permission checks;
  the issue guard (equal to the old refusal with no policy, the exact allowance passing, a retry answered before the
  plan); nothing deleted. Fixed:
  - `store#ProductionPolicy` read now before taking the organization lock. A change that waited on another could then
    start before it, end that change ms later and so lose its own values silently, and start before a release that
    committed while it waited, against F61. Now is read after the lock.
  - A reason's deactivation ended the row in effect now, even with a later start, which could stretch that row over a
    later one. It also left a scheduled change to start the reason again. It now ends the row in effect at its start and
    is refused (REASON_INVALID) while a later change is scheduled.
  - The spec covers a plant of another organization (read and change refused, no row) and the deactivation before a
    scheduled change. The ProductionSettings dialog forms are indented under their `form-single`.
  - Left: F61 holds for the services only. A data load or a direct entity write can still back-date a row, so a P5
    copy on the run would be the stricter choice. The policy and reason saves take `expectedFromDate`, not an operation
    key, as Warehouse's policy saves do, so a retry after success answers POLICY_CHANGED.
  - Specs: Mantle ProductionPolicy, WarehouseProduction and ManufacturingServices (22, pass). BOSS ManufacturingAccess,
    AppStructure and TuiRender (72, pass). `moqui lint --screens` is clean for the Settings screens.

### P5 — Work orders

Design §3 WorkOrders, NewWorkOrder, WorkOrderDetail, Overview, Operations, Components and MaterialIssueReceipt, and the
parts of M1, M2 and M4 Warehouse P16 left. Built in two parts: P5a the runs and their lifecycle, then P5b their
materials and stock.

- **P5a, the runs.**
  - `mantle.work.ProductionServices`:
    - `find#ProductionOrders` (`PRODUCTION_VIEW`), and `store#ProductionOrder` (the draft header) and
      `store#ProductionEquipment` (`PRODUCTION_PLAN`);
    - people through the existing `add#` and `remove#WorkEffortParty`, behind a guarded assignment;
    - `transition#ProductionOrder`: release through P16a's `release#ProductionOrder`, whose release time now reads
      the P4 policy rows as of it; unrelease while no fact exists; start; hold and resume; cancel of an unposted draft. Complete needs P7's
      reconciliation and close is P15's. Each guard checks its design state, refuses the generic `WeInPlanning` →
      `WeComplete` and `WeClosed` transitions, and checks its own permission (R-MFG-11): `PRODUCTION_PLAN` to release
      and unrelease, `PRODUCTION_SUPERVISE` to start, hold, resume, cancel and complete;
    - the release gate: a valid method, `check#ProductUsable`, a later release of the method found with a re-explosion
      offered,
      and the shortage policy, with staged release by supervisor approval (design §13);
    - `batch#ProductionAction`, a result per run;
    - `get#ProductionOperations`, with readiness and its reason.
  - The seeded `WeApproved` → `WeInPlanning` transition with its unrelease guard (Warehouse P16a left it, impl-warehouse
    §4), `WeApproved` → `WeOnHold`, and `WeOnHold` → `WeApproved` so a hold before start resumes as released rather
    than started (F9). The framework accepts every flow's transitions on any WorkEffort, so the guard
    is the only path.
  - **Screens:**
    - WorkOrders: Find, the list, Selection, `view-board` by status or facility whose move calls
      `transition#ProductionOrder`, `view-calendar` over the estimated dates, and the saved finds Ready, Late, Blocked,
      Mine and By product;
    - NewWorkOrder: Identity, Method and Review, with the producible-now column from `get#BomExplosion`'s buildable
      quantity at the run's facility, over `get#AvailableInventory` (R-MFG-30; F24). Its requirements stop at
      non-phantom sub-assemblies, so their stock counts, and phantoms are blown through (§4, Q8);
    - WorkOrderDetail: Header, the Lifecycle dialog with its impact preview, Overview, Operations (no Reschedule until
      P12) and Notes and files;
    - Product360's Open runs link.
  - **Outputs:** the production traveler and pick sheet (design §11), with the run's revision, operation sequence,
    material and lot needs and a QR identity from Products P11; the release notice.
  - **Shell:** the run palette type; quick create draft work order.
- **P5b, materials and stock.**
  - `get#ProductionMaterials`, and `store#ProductionMaterial` for manual draft lines under `PRODUCTION_PLAN`.
  - Components: the list and AddMaterial. Stage opens Warehouse's Move with the run fixed; there is no WIP location
    (R-MFG-03). Substitute is P9.
  - MaterialIssueReceipt: Warehouse's `Shared/MaterialIssueReceipt` with the Manufacturing row of crosscut §3.9, over
    P16b's guards: issue, return unused, receive output and preview backflush. Backflush follows the policy and issues
    the run lines' exact quantities from chosen lots, or none. A held asset or a shortfall is refused, even at a facility
    that allows issue beyond quantity on hand (F12).
  - InventoryAvailability: Products' `Shared/InventoryAvailability` with the Manufacturing row of crosscut §3.7, at
    `Manufacturing/Planning/InventoryAvailability`; held quantity by status, apart (R-MFG-24).
  - The shortage notice and Home's shortage queue.
- **Usable when** (design §10.3, cancellation and retry):
  - a planner creates a draft run for DEMO_1_1 from the released BOM and releases it, and the run keeps the policy
    of its release time after P4's policy changes;
  - a second run with a short component is refused release until a supervisor approves a staged release, and the
    short line's issue stays blocked;
  - a board move to Released runs the same guard, and a bulk release of three runs names the blocked one;
  - a released run is held before start and resumes as released; an unrelease after an issue is refused; an unposted
    draft is cancelled;
  - two components are issued at two operations through the Manufacturing mount, an operator without `STOCK_ISSUE`
    for the facility is refused, and a backflush preview shows its lots and issues once.

**Built Nov 3 (P5a, the runs).**
- Mantle (`service/mantle/work/ProductionOrders.js`, ten services appended to `ProductionServices.xml`):
  - `transition#ProductionOrder`, the one path to a run's status, by `action` or a board's `toStatusId`, with an operation
    key (StockPosting's `begin`/`settled`/`complete`) and the required expected revision. Release (PRODUCTION_PLAN) runs the
    gate, then P16a's `release#ProductionOrder`: `check#ProductUsable` (Produce), the method valid as of the method date
    (`get#BomExplosion` findings, METHOD_INVALID), a later release of its methods (METHOD_CHANGED with `reexplodeOffered`;
    `reexplode` answers REEXPLODED, a draft at the next revision to review), and the shortage policy in effect at the
    release time (ProductionPolicy `effective`, F61): every material line covered by the run owner's free stock at the
    run's facility and, for a line, its plant (F16), else SHORTAGE unless a supervisor approved a staged release at this
    revision (PsrAllUsable) or the policy is PsrStaged. A staged release stamps each short line's `stagedShortQuantity`;
    `issue#ProductionMaterial` (Production.js `issuePlan`, a local edit) refuses that line (LINE_STAGED_SHORT) until the
    stock covers what it has left, then clears it. Release notifies the organization's PRODUCTION_SUPERVISE holders
    (ProductionRelease). Unrelease (PRODUCTION_PLAN, no issuance, receipt or time entry: RUN_HAS_FACTS) cancels the operation
    children, unfreezes the lines and clears the release time and standard; start, hold (a reason or an active reason code),
    resume (to WeApproved before a start, WeInProgress after), cancel (a reason; a draft, released or held run with no fact)
    need PRODUCTION_SUPERVISE; complete is refused (COMPLETE_UNAVAILABLE) until P7, close (CLOSE_BY_COST_CLOSE) is P15's,
    and a generic move such as In Planning to Complete is TRANSITION_INVALID. `requestStaged` (PRODUCTION_PLAN) notifies the
    supervisors (ProductionStagedRelease, in Approvals); `approveStaged` (PRODUCTION_SUPERVISE) stamps the approval at the
    next revision. Status reasons go on the audit log (`statusId_changeReason`).
  - `batch#ProductionAction` (each run its own transaction under `key/run`, a result per run: success, blocked or failed),
    `get#ProductionLifecycle` (the run, each action open from its status with its impact or refusal, shortages, facts,
    the status history), `find#ProductionOrders` (paged, display text, the saved finds' filters ready, late, blocked, mine,
    product, and `demandOrderId`), `store#ProductionOrder` (the draft header), `store#ProductionEquipment` (blocked,
    stock and overlapping equipment refused), `store#ProductionParty` (the guarded `add#`/`remove#WorkEffortParty`: a
    supervisor or operator who is a person of the run's organization; a missing skill a warning), `get#ProductionResources`,
    `get#ProductionOperations` (readiness and its reason; a draft's routing operations to come) and `get#ProductionPickList`.
  - `entity/ProductionOrderEntities.xml` (the staged approval on WorkEffort, `stagedShortQuantity` on ProductionRunLine);
    `data/ProductionOrderData.xml`: the WorkEffortProduction flow's WeApproved→WeInPlanning (PRODUCTION_PLAN),
    WeApproved→WeOnHold and WeOnHold→WeApproved (PRODUCTION_SUPERVISE), each with its `userPermissionId`, which the
    framework's status check honors, so a task or a user without the permission cannot take them; the two topics in
    `ProductionNotificationSetupData.xml`. Production.js exports `laterReleases` and `routingsOf`.
- BOSS: `WorkOrders` (Find by default): Find (WorkOrderList with the list, a board by status whose move posts
  transition#ProductionOrder at the card's revision, a calendar, the saved finds Ready, Late, Blocked, Mine and the product
  filter, the Selection's Release, Hold and Cancel with confirmations and a message per run); NewWorkOrder (Identity, Method,
  Review with each requirement's free stock and short quantity and Producible now from `buildableQuantity` at the plant;
  the operation key made at Identity answers a second Create); QuickCreate (the shell's quick create); WorkOrderDetail (record
  header, the primary action by status with its impact, the Lifecycle dialog of every action, More: traveler, pick sheet,
  product, BOM) with Overview (details, Edit for a draft, shortages, history, lines, equipment, people), Operations, P6's
  Costs (ProductionCosts, index 6) and Notes and files; Traveler (with a QR of the run and revision) and PickSheet as
  html-print. `template/ManufacturingWorkOrderParts.xml` (the lifecycle transition and row, and OrderRuns: a sales order's
  supplying work orders, included in `Shared/OrderDetail` for PRODUCTION_VIEW holders in any context). Product360's Open
  runs link (Manufacturing context). Manufacturing.js P5a block: run and operation destinations (so the palette, record
  links and P13's converted runs open WorkOrderDetail), the routes, the choices madeProducts, releasedBoms, runFacilities,
  runEquipment, runPeople, holdReasons (`get#Choices` takes `productId`). BossSetupData: `BOSS_MFG_NEW_WORK_ORDER`
  (NewWorkOrder and QuickCreate for PLAN and ADMIN) and the two topics' links; the root's quick create and topics;
  Approvals lists ProductionStagedRelease.
- P6's F74 done: ProductionCosts is WorkOrderDetail's Costs tab (the root's item, Manufacturing.js's P6 link path and
  ManufacturingSpecLib's `moved` removed, its title row dropped and its review dialog no longer a second primary), and
  ManufacturingCostsWalk and ManufacturingAccess's P6 pages open the tab.
- Specs: Mantle `test/work/ProductionOrders.spec.js` (11 features, about 5 s: the release with its retry and the policy
  kept; the staged release, its approval and the blocked issue; the PsrStaged line; the later method release and
  re-explosion; hold before start and resume; unrelease, cancel, refused complete, close, generic move and stale
  revision; the guarded seeded transitions on a task; the bulk release; another organization and a reader; the header,
  equipment and people; operations' readiness and the pick list). BOSS `ManufacturingWorkOrders` (4, the rules of the
  "usable when" items through the screens and verbs), ManufacturingAccess's P5a section (4), ManufacturingShell's quick
  create, palette and links; no route fixtures. The client walk `ManufacturingWorkOrdersWalk` (2) is the app's one
  golden-path walk in the regression suite; its 390 px check is an acceptance test.
- Tests run: Mantle ProductionOrders, SupplyPlanning, ProductionCosts, WarehouseProduction, ManufacturingServices,
  ProductionPolicy, ProductMethods, MethodTemplates, WorkCenters (69, pass); BOSS ManufacturingWorkOrders,
  ManufacturingAccess, ManufacturingShell, AppStructure, TuiRender, ManufacturingMethods, ManufacturingWorkCenters,
  ManufacturingPlanning, ProductsSharedContext, WarehouseShell, WarehousePicking, AccountingPayables, ClientBilling,
  Notifications (193, pass); walks ManufacturingWorkOrdersWalk, ManufacturingCostsWalk, ManufacturingPlanningWalk (8,
  pass). `moqui lint --screens`: only informational anchor rows for the new screens.
- Decisions:
  - The seeded transitions live in their own status flow with `userPermissionId` (Warehouse P16 review B4's concern),
    rather than an EECA guard; transition#ProductionOrder checks the state and facts.
  - A staged release under PsrAllUsable is a supervisor's approval on the run at its revision (approveStaged), which the
    planner's release then uses; any later change of the draft asks for it again. requestStaged notifies the supervisors.
  - Cancel takes a draft, released or held run that has not started and has no fact; a run with facts waits for P9's
    reviewed reversal. Unrelease cancels the operation children rather than deleting them.
  - store#ProductionOrder edits a draft only; a released run's dates change with P12's schedule.
  - The run nets against its facility and, for a line, the plant above it (F16), for the gate, the shortages, the pick
    list and Producible now.
  - batch#ProductionAction takes each run's revision from `expectedRevisions` or its current one (a row selection posts
    ids only).
  - OrderDetail's supplying work orders show in every context to a PRODUCTION_VIEW holder (§4's decision), before P14's
    Manufacturing mount.
- Deferred: Home's counts and queue (P16; P5b fills open, in progress, late and short), Reschedule (P12), the start checks
  (P10, P8), Components, materials, stock and the shortage notice (P5b); a copy of the policy on the run (F61 holds: no service back-dates a row).
- Findings (provisional):
  - **F62** A section-include of a template section that itself section-includes another section of the same template
    fails ("screen includes are nested too deeply"); WorkOrderDetail includes LifecycleActionRow directly.
  - **F63** A tab's content is not in a qvt render with `lastStandalone: -2` (the tab loads apart), so the tab routes'
    texts are the header's, as FacilityDetail's are; the specs render a tab with `lastStandalone: "true"`.
  - **F64** Product360 under Manufacturing failed for the Manufacturing groups ("Catalog read access is required"):
    Products' services need PRODUCT_CATALOG_VIEW, which no Manufacturing group held. Fixed in the review (below).
  - **F65** `get#AvailableInventory` and `get#BomExplosion`'s buildable quantity read one facility; P5a passes the
    plant for a line's run (stockFacilityIds). P13 nets by line and plant on its own.
  - **F66** StockPosting's `reasonOf` reads only codes with an underscore, so a batch row refused SHORTAGE read FAILED;
    batch#ProductionAction reads the code itself.
  - **F67** For the merge: Production.js gained two exports and a staged-short check in `issuePlan` (P5b, P7 and P9
    edit it too); BossSetupData's new artifact group sits before the record-link group.
  - **F68** Warehouse's BOSS_WH_RUN is still WetTask (F43); left, since the guards key on the purpose.
- **Review Nov 3 (P5a).** Checked against the phase scope, §2 and design §1.1, §3; the ten verbs' permissions, operation keys and
  revisions, the release gate, the staged block, batch results and the screens' record checks hold. Fixed:
  - (medium) cancel took a run held after its start (no fact yet), against the decision "has not started": now RUN_STARTED
    (blocked in a batch); ProductionOrders' hold feature covers it.
  - (medium, F64) BossSetupData grants PRODUCT_CATALOG_VIEW to every Manufacturing group that reads methods (not the plant
    display), as Warehouse's groups hold it; ManufacturingWorkOrders opens Product360 as the production reader.
  - (low) a staged short line was not visible: get#ProductionOrder's material lines carry `stagedShort` and Overview's lines
    show it; Overview's storeHeader, storeEquipment and storeParty refuse a run the record check did not find, as
    lifecycleAction does.
  - Left: the three seeded transitions carry their permission, so a holder calling a generic update#WorkEffort directly
    (authorization disabled) could still skip the guard's state and fact checks (a supervisor resuming a started run to
    Approved, a planner unreleasing a run with facts). No BOSS path does (Commons' set#TaskStatus refuses runs and reads the
    task's own flow); closing it needs a framework hook on the status check. WorkOrders' Find has no organization or date
    period filter and the board groups by status only (design §3 also names the facility); the service takes dueFrom and
    dueThru. Equivalent scope: bulk actions skip check#Record, but Mantle's runOf checks the same organizations.
  - Tests: Mantle ProductionOrders, WarehouseProduction, ManufacturingServices (26, pass); BOSS ManufacturingWorkOrders,
    ManufacturingAccess, ManufacturingShell, ProductsAccess, ProductsSharedContext, AppStructure, TuiRender,
    ManufacturingMethods (154, pass); `moqui lint --screens` clean for the P5a screens.

**Built Nov 3 (P5b, materials and stock).**
- Mantle (`service/mantle/work/ProductionMaterials.js`, five services appended to `ProductionServices.xml`;
  `entity/ProductionMaterialEntities.xml`: `manualLine`, `sourceFacilityId` and `instructionText` on ProductionRunLine, audit-logged):
  - `get#ProductionMaterials` (PRODUCTION_VIEW or STOCK_ISSUE): each material line's operation, required quantity with the
    policy's scrap allowance, issued, returned and remaining, the free stock at the run's facility and plant (F16) shared in
    line order, the short quantity, the owner's held stock there by status apart (AstQuarantine, AstOnHold, AstDefective;
    R-MFG-24), the staged short quantity, manual or method; `withStock` the available assets to issue from (oldest lot expiry,
    then oldest receipt); the run's consumption policy, a draft's routing operations, `canAdd` and `canIssue`.
  - `store#ProductionMaterial` (PRODUCTION_PLAN, operation key, expected revision): add, change or remove a manual line of a
    draft (a stocked product of the organization's or a shared one, not the output, in its stock unit, a routing operation of
    the draft, a source facility of the run owner's); method lines refused (LINE_NOT_MANUAL). It rewrites the WeptConsume rows
    and counts the revision up, so a staged approval is asked again. Production.js's re-explosion keeps manual lines (a local
    edit) and exports `writeProducts` and `lineAnswer`.
  - `preview#ProductionBackflush` and `backflush#ProductionMaterials` (STOCK_ISSUE): the preview gives each line's exact
    remaining quantity (one operation's lines or all) with the lots chosen oldest expiry first, expired stock left out, and its
    findings (BACKFLUSH_NOT_POLICY when the run's policy issues by hand, SHORTFALL, LINE_STAGED_SHORT, NOTHING_TO_ISSUE) and a
    previewKey over the revision and every pick; the confirmation makes the preview again, refuses a changed one
    (PREVIEW_CHANGED) and issues each pick through `issue#ProductionMaterial` (its key under the backflush's) in its own
    transaction, so any refusal issues nothing; a retry answers the first. Held stock is never chosen, also where the facility
    allows issue beyond on hand (F12).
  - `get#ProductionShortages` (PRODUCTION_VIEW): the open runs at a facility and its lines, earliest due first (100 checked),
    with their short lines (ProductionOrders.js `shortagesOf`). The shortage notice: a release that stamps staged short lines
    sends `ProductionShortage` (seeded in `ProductionNotificationSetupData.xml`) to the organization's PRODUCTION_PLAN holders
    (`notifyShortage`, called from ProductionOrders.js's release, a one-line local edit).
- BOSS:
  - WorkOrderDetail's Components tab (`WorkOrders/WorkOrderDetail/Components.xml`, index 2): the lines with state chips (covered,
    short, released short) and held by status; Add material, Edit and Remove of a manual line for a planner on a draft; Issue and
    return opens the Materials tab; Stage stock opens Warehouse's Move with the run and facility (STOCK_MOVE, the new `move`
    capability); Availability opens Planning's InventoryAvailability for planners, schedulers and supervisors.
  - The Materials tab (index 3): Warehouse's `Shared/MaterialIssueReceipt` mounted in WorkOrderDetail's subscreens with its
    Manufacturing context: `ironstone.manufacturing.MaterialServices.get#MaterialSource` (Materials.js) reads Warehouse's run
    source with the Manufacturing scope and record check (Production.js `runSource` takes the app, a local edit) and replaces its
    material lines with get#ProductionMaterials' (returned and stock apart; a staged short line offered once stock covers it), Stage for STOCK_MOVE
    holders and, when the policy backflushes, the Backflush box with its lots and Confirm backflush; `get#MaterialAction` maps
    issue, return, receive (Warehouse's run actions) and backflush, which the screen's materialAction runs after Manufacturing's
    check#Record with `issue` (STOCK_ISSUE). The forms carry `workEffortId` for WorkOrderDetail.
  - Products' `Shared/InventoryAvailability` at `Manufacturing/Planning/InventoryAvailability` (not in the menu; opened from
    Components): Inventory.js counts held by status for Manufacturing with Quarantine, On hold and Defective columns in Summary,
    and the Policy tab is not shown (crosscut §3.7's row: Summary, Projection, lots).
  - Home: get#Home's P5b block (Materials.js `home`): Open, In progress, Late (linked to the filtered Find) and Short counted
    for production readers; the queue lists the earliest due open work orders and the short ones with their shortage, a short
    one opening Components. The ProductionShortage topic in the root and its link to Components.
  - Manufacturing.js P5b block: `move` (STOCK_MOVE), the routes, the choices `materialProducts` and `stockFacilities`. Demo user
    `manufacturing.material` (operator with BOSS_WAREHOUSE, _ISSUE and _MOVE).
- Specs: Mantle `test/work/ProductionMaterials.spec.js` (4 features, about 3 s: the lines' quantities, free, short and held by
  status; manual lines with their refusals and release keeping them; the backflush preview's lots, the confirmation once and its
  retry, a stale preview and a manual policy; the shortfall with held stock at a facility allowing issue beyond on hand, the
  staged line, the notice and get#ProductionShortages). BOSS `ManufacturingMaterials` (5: two components issued at two
  operations through the Manufacturing mount and the operator without STOCK_ISSUE refused the same posting; the backflush preview
  and Confirm once; the short line blocked after the staged release with the notice and Home's counts and queue; a manual line
  on Components; InventoryAvailability held by status), ManufacturingAccess's P5b section (3), the route fixtures (Components,
  MaterialIssueReceipt, InventoryAvailability and Projection), ManufacturingShell's Home feature updated for the counts; client
  walk `ManufacturingMaterialsWalk` (2, with 390 px).
- Tests run: Mantle ProductionMaterials, ProductionOrders, ProductionCosts, WarehouseProduction, ManufacturingServices,
  ProductionPolicy, ProductMethods, SupplyPlanning (63, pass); BOSS ManufacturingMaterials, ManufacturingAccess,
  ManufacturingWorkOrders, AppStructure, TuiRender (104, pass), ProductsInventory, ProductsSharedContext, ProductsAccess,
  ClientIsolation, ManufacturingShell, ManufacturingPlanning, WarehouseAccess, WarehousePacking, WarehouseProductionFixtures,
  WarehouseMoves, WarehouseShell (258, pass after the two fixes below); walks ManufacturingMaterialsWalk,
  ManufacturingWorkOrdersWalk, WarehouseProductionWalk (7, pass). `moqui lint --screens`: informational anchors only.
- Decisions:
  - Backflush is a confirmed action: the preview chooses the lots, the confirmation issues exactly that preview (previewKey) or
    nothing. It is offered only under the PcmBackflush policy; issuing it at the policy's issue point (operation start or
    completion, output receipt) is the phase that builds that event's caller (P10, P7), which calls backflush#ProductionMaterials
    with the operation.
  - A manual line is entered in the component's stock unit; another unit is refused (UNIT_CONVERSION). An empty field of an edit
    keeps the line's value.
  - The shortage notice goes to the planners when a release leaves lines short; the planner who released is the actor and is not
    notified (Payables `notify`). Home counts drafts among the short runs, as planning does.
  - InventoryAvailability is opened from a work order's component with the plant, not a menu tab, since the shared screen needs a
    product; the reader groups (no Planning area) do not see the link.
  - Warehouse's run source is shared, its app (scope, record check, stock options) a parameter, rather than copied.
- Deferred: ReceiveOutput's GenerateTracking dialog (F27) stays with P7, which changes receive#ProductionOutput and owns the output
  quantities; the receive dialog keeps Warehouse's first serial and lot. Substitute is P9's; loss columns are P7's; completed this
  month is P16's.
- Fixed along the way: ClientIsolation did not classify P13's `Shared/SupplyPlanning` (refused to clients now); ManufacturingShell's
  Home feature expected the P1 empty queue.
- Findings (provisional):
  - **F84** Declared but absent in-parameters arrive as null in a JS service module, so `p.field !== undefined` cannot tell
    "not given" from "cleared"; store#ProductionMaterial treats an empty field as "keep", unless `clearEmpty` (review, below).
  - **F85** Payables `notify` leaves the actor out of the recipients, so a planner's own staged release does not notify that
    planner; the spec checks a second planner.
  - **F86** The method's material lines come from the explosion in no fixed order (lineSeqNum follows it), so specs find a
    line by product, not position.
  - **F87** For the merge: Production.js (re-explosion keeps manual lines; two exports), ProductionOrders.js (the notice call in
    release's apply), Warehouse's Production.js (`runSource(p, app)`), Products' Inventory.js and InventoryAvailability Summary and
    Policy, Shared/MaterialIssueReceipt (the Manufacturing branch), WorkOrderDetail's subscreens, Home.xml and HomeServices.xml's
    P5b block, the ManufacturingShell Home feature, ClientIsolation's Shared list. P7 edits receive#ProductionOutput and may add
    WorkOrderDetail tabs; P11 nothing of these.
- **Review Nov 3 (P5b).** Checked against the P5b scope, §2 and design §3, §13: backflush is policy-gated
  (BACKFLUSH_NOT_POLICY), issues the previewed picks or none in one transaction (issue#ProductionMaterial has no
  require-new; a refusal rolls back), a retry answers the first, held stock is never chosen and the guard refuses it
  (HELD_STOCK) also at an over-on-hand facility; STOCK_ISSUE through Manufacturing's check#Record (owner-scoped as Warehouse's
  facility scope) and Mantle; store#ProductionMaterial drafts and manual lines only; the Shared screens' Manufacturing branches
  leave Warehouse's and Products' contexts as they were; Home's counts use find#ProductionOrders' open statuses and the
  plant with its lines; the notice goes to the organization's PRODUCTION_PLAN holders. Fixed:
  - (medium) the Materials tab never offered a line released short, even once stock covered it, and only its first issue
    clears the block, so it could not be issued from Manufacturing: it is offered once `short` is gone (Materials.js).
  - (medium, F84) an edit could not clear a line's operation, source facility or instruction: store#ProductionMaterial
    takes `clearEmpty`, which Components' Edit dialog posts with every field (Staged from added to it); without it an empty
    field still keeps the value. ProductionMaterials and ManufacturingMaterials cover keep and clear.
  - (low) Confirm backflush's operation key was the preview key, so a second backflush after a full return (same picks,
    same revision) answered the first and issued nothing: the key is the page's.
  - (low, spec gap) the re-explosion keeping a manual line had no spec: ProductionOrders' later-release feature adds one,
    checks it survives the re-explosion beside the method's lines, and removes it before release.
  - Left: Components' chip still reads "Released short" for a covered staged line until its first issue (the block
    stands until then); get#ProductionShortages' count is a lower bound past 100 runs (truncated); a nested failure in
    the middle of a backflush has no spec of its own (the preview recheck refuses most changes first).
  - Tests: Mantle ProductionMaterials, ProductionOrders, WarehouseProduction, ManufacturingServices (30, pass); BOSS
    ManufacturingMaterials, ManufacturingAccess, ManufacturingWorkOrders, ManufacturingShell, ClientIsolation,
    ProductsInventory, ProductsSharedContext, WarehouseProductionFixtures, WarehousePacking, AppStructure, TuiRender (167,
    pass); walks ManufacturingMaterialsWalk, WarehouseProductionWalk (5, pass); `moqui lint --screens` clean for P5b's screens.
  - Merged with master (P7) Nov 3; F97 decided: change#ProductionQuantity leaves a manual material line's quantity as
    the planner entered it (a quantity for the run, not per unit made) unless `scaleManual`; ProductionMaterials' target change
    feature covers both. After the merge: Mantle ProductionMaterials, ProductionQuantities, ProductionOrders,
    WarehouseProduction, ManufacturingServices (40, pass); BOSS ManufacturingMaterials, ManufacturingAccess,
    ManufacturingWorkOrders, ManufacturingShell, ClientIsolation, AppStructure, TuiRender (145, pass); walks
    ManufacturingMaterialsWalk, ManufacturingQuantitiesWalk (5, pass).

### P6 — Cost evidence

M8's evidence, before the phases whose facts write it (design §3 ProductionCosts; crosscut §4.1 CX-COST; review §4.1
steps 19 and 20).

- **Records:** `mantle.work.production.ProductionCostEvent` (unique by source, component and revision) and
  `ProductionCostAllocation`; the cost-review status, an audit-logged field of the run.
- **`mantle.work.ProductionServices`:**
  - `record#ProductionCostEvent`, internal, called inside the transaction that causes the fact. Here its callers are
    P16b's issue, return-unused and output guards, and the material part of `receive#SubcontractOutput`. Each material
    event references the hook's transaction and posts nothing again. An output or return receipt without
    `acquireCost` would post nothing (F13), so the guard refuses it. Later phases add loss (P7), labor and machine
    (P10), and outside processing (P14);
  - `get#ProductionCosts`, and `review#ProductionCosts` under `PRODUCTION_COST_REVIEW`, which sets the review status
    and notifies Accounting on the `ProductionCostReview` NotificationTopic, seeded in mr-mantle's data. Accounting
    Home and the queue that read it are P15's.
- **Screens:** ProductionCosts: Costs and CloseReview. The frozen estimate shows with `PRODUCT_COST_VIEW`, actual
  values and ledger links with `ACCOUNTING_VIEW`.
- **Usable when:**
  - two issues, a return of one unused component and an output receipt each write one event linked to the hook's
    transaction, and a retried issue writes none;
  - a cost estimator sees the frozen estimate and no actuals, and a financial reader sees both;
  - a review request notifies Accounting with the run and source revision.

**Built Nov 3 (P6).**
- Mantle records (`entity/ProductionCostEntities.xml`, a new file): `mantle.work.production.ProductionCostEvent`, unique by
  source entity, source id, cost component and source revision (PRODCOSTEVT_SOURCE), with the organization, run, operation,
  line, event type, component, product, quantity and unit, the rate and its rate row (`rateEntityName`, `rateId`: the asset's
  cost, the frozen standard; later a WorkCenterRate or RateAmount), the amount signed for the run's WIP, the valuation
  (`PcvValued`, `PcvUnvalued`) and ledger state (`PclPosted` by its movement's hook, `PclNotPosted`, `PclAwaitingClose`,
  `PclClosePosted`), the hook's `acctgTransId` and P15's `closeAcctgTransId`, the stock, time, order and invoice references,
  `originalCostEventId` for a delta or reversal, `reasonCode`, the event and accounting dates and `afterClose`;
  `ProductionCostAllocation` (event, output line and receipt, policy row, destination, amount, operation key, ledger and
  reversal links), with no writer until P15; the run's audit-logged `productionCostReviewStatusId`, date, user, revision,
  proposed accounting date and note. `data/ProductionCostData.xml`: the event types (issue, return, output), the components
  (`ProductionCostComponent`: material, labor, machine, outside processing, output), the valuation, ledger and destination
  enumerations, the ProductionCostReview status type (`PcrRequested`) and the `ProductionCostReview` NotificationTopic.
- Mantle services (`ProductionCosts.js`, three services appended to `ProductionServices.xml`):
  `record#ProductionCostEvent` (internal, no permission: it derives the event from the source record alone, from a sources
  table that P7, P10 and P14 extend; a second call answers the first event); `get#ProductionCosts` (PRODUCTION_VIEW,
  PRODUCTION_COST_REVIEW or ACCOUNTING_VIEW): the events, the frozen estimate for the output quantity with its components
  (PRODUCT_COST_VIEW or ACCOUNTING_VIEW), the actuals by component, issued, returned, output relief and WIP balance
  (ACCOUNTING_VIEW), the estimate against the actual (both), the exceptions (unvalued, not posted, awaiting close) and the
  review state; amounts, rates and ledger links are left out of each event row without ACCOUNTING_VIEW; `review#ProductionCosts`
  (PRODUCTION_COST_REVIEW, operation key and expected revision): sets the review fields and sends ProductionCostReview with the
  run, its revision, the accounting date and the exception counts to the organization's PRODUCTION_COST_POST holders
  (Payables.js `notify`), a closed period of the accounting date a warning.
- The hooks (`ProductionServices.xml` only; `Production.js` unchanged): issue#ProductionMaterial, return#UnusedMaterial and
  receive#ProductionOutput call `recordAll` after their movement, inside its transaction, and answer `productionCostEventId(s)`;
  return#UnusedMaterial refuses material without a cost before it posts (`requireCost`, COST_UNAVAILABLE). receive#SubcontractOutput
  issues and receives through those guards, so its material and output write their events with no change.
- BOSS: `screen/Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts.xml` (Costs: the title row with the review chip and the
  primary Request cost review dialog, CloseReview, with the accounting date, the note, the exception counts and a closed-period
  warning; Frozen estimate; Actual cost with the estimate against it; Cost events with state chips, amounts and journal entry
  links for financial readers; the not-available state), mounted hidden at the root as `Manufacturing/ProductionCosts`;
  Manufacturing.js's P6 block (the link path); the demo user `manufacturing.finance` (Manufacturing reader and
  `BOSS_ACCOUNTING_READ`).
- Specs: Mantle `test/work/ProductionCosts.spec.js` (4 features, about 1.5 s: the issue, return, output and retry events with
  their transactions; material without a cost unvalued, its return and an output receipt without a cost refused; the reads of
  the estimator, finance reader, reader, another organization and no permission; the review with its refusals, audit row and
  notice); WarehouseProduction's subcontract feature checks its events. ManufacturingAccess's P6 section (2 features: the three
  readers through Mantle and the screen with authz enabled, the other organization; the review by the estimator and its refusal
  for a reader, through check#Record and the verb). ManufacturingSpecLib's route `ProductionCosts` and `moved`, which
  AppStructure and TuiRender apply to the file walk's path. Client walk `ManufacturingCostsWalk` (3, with 390 px), in suite.js.
- Tests run: Mantle ProductionCosts, ManufacturingServices, WarehouseProduction, ProductMethods, ProductionPolicy (37, pass);
  BOSS ManufacturingAccess, AppStructure, TuiRender (78, pass), ManufacturingShell, WarehouseAccess, WarehousePacking,
  ClientIsolation, ManufacturingWorkCenters (181, pass); walks WarehouseProductionWalk (3) and ManufacturingCostsWalk (3), pass.
  `moqui lint --screens`: ProductionCosts shows only informational anchor rows.
- Decisions:
  - An event is derived from its source, never from values a caller passes, so the internal writer needs no permission and a
    repeated call is harmless; amounts are the hook transaction's debit total (the quantity times the asset's cost when it posted
    nothing), signed for WIP.
  - The output's relief is its own component (`PrcOutput`), so the unique key holds for every source; the other components are
    the frozen estimate's, so estimate and actual compare by component.
  - The estimate is read with Products' cost read (PRODUCT_COST_VIEW or ACCOUNTING_VIEW among it; the review aligned it with
    CostPolicy), so a financial reader sees both.
  - ProductionCostReview goes to the run organization's PRODUCTION_COST_POST holders, Accounting's cost close posters (F40).
    It is decided on the record, so it has no approve service.
  - A review needs a released, started, held or completed run with at least one event; a second request at the same revision
    is refused until Accounting decides (P15) or the revision changes (P9).
- Findings (provisional):
  - **F69** ProductionCostReview has no BOSS `linkTemplate` and no `<notification-topic>` in a root: its readers are
    Accounting's posters, who need not open Manufacturing. P15 sets the link to `Accounting/Inventory/ProductionCostClose`, lists
    the topic in Accounting's shell, and adds the review decisions (returned, closed) to the ProductionCostReview status type.
  - **F70** An issue of material without a cost is not refused (the plan names only output and return receipts): it posts
    nothing (AtrNoAcquireCost) and its event is unvalued and not posted. P15's close should refuse a run with one, as it does
    unvalued machine runtime.
  - **F71** receive#ProductionOutput always has a cost (the frozen standard, else the WIP to date, COST_UNAVAILABLE without),
    so the F13 output refusal is the event writer's backstop for another path; the return is refused before it posts.
  - **F72** An output receipt that costLines splits (the last unit at the remainder) is two AssetReceipts with two
    transactions, so it writes two events.
  - **F73** Movements made before P6 (Warehouse's demo, earlier runs) have no events. Since an event derives from its source
    alone, a backfill could call record#ProductionCostEvent per movement; not built.
  - **F74** For the merge with P5a: ProductionCosts sits in `WorkOrders/WorkOrderDetail/`, so WorkOrderDetail's directory
    mounts it as its Costs tab (`default-menu-index="6"`). Then remove the root's `ProductionCosts` item, Manufacturing.js's P6
    link path and ManufacturingSpecLib's `moved`, move the route fixture to `WorkOrders/WorkOrderDetail/ProductionCosts`, drop
    the page's own title row for WorkOrderDetail's header, and point ManufacturingCostsWalk at the tab.
  - **F75** ManufacturingCostsWalk reads BOSS_WH_RUN, whose costs come from WarehouseProductionWalk earlier in the suite; run
    alone it sees no costs and checks the empty state instead of the review request.

- **Review (Nov 3).** Checked: each guard's operation-key replay returns before the hook, so a retry writes no event;
  `record#ProductionCostEvent` runs in the causing transaction, a refusal rolling back the movement; the unique key; each
  material event's `acctgTransId` with nothing posted again; the WIP sign; the omitted values; review#ProductionCosts's
  permission, organization, operation key and revision; the recipients (F40). Decided: the estimate's readers are Products'
  cost read (CostPolicy: `PRODUCT_COST_VIEW`, `_ESTIMATE`, `_APPROVE`, `ACCOUNTING_VIEW`, `ACCOUNTING_GL_POST`), as
  ProductStandardCost's owner reads it; BOSS's Accounting readers hold `PRODUCT_COST_VIEW` as well, so §2 holds there. An issue of
  material without a cost stays unvalued and not posted (F70): the plan refuses only receipts, §2 lets an existing service gain
  a refusal only behind a flag, and §4 records unvalued facts for P15 to refuse. Fixed: the estimate left out overhead, so its
  components did not add to its total; it now lists `PrcOverhead` (seeded, estimate only) and leaves it out of the comparison;
  the estimate's read widened to CostPolicy's set; the spec checks another organization's poster gets no notice. Left: a zero
  acquire cost is unvalued on an issue (the hook posts nothing) but valued at zero on a return (the hook posts zero), a
  difference of Mantle's hooks. Specs: Mantle ProductionCosts, WarehouseProduction, ManufacturingServices (19, pass); BOSS
  ManufacturingAccess, AppStructure, TuiRender (78, pass).

### P7 — Quantities, by-products and loss

Design §3 Quantities and ByProducts, §6 ScrapLoss and §12.2; M2, M4, M6 and M8.

- **Records:** `ProductionQuantityEvent` and `mantle.work.production.ProductionLoss`.
- **`mantle.work.ProductionServices`:**
  - `get#ProductionQuantities` and `store#ProductionOutput` (draft outputs and by-products);
  - `record#ProductionQuantity`: good, pending, process loss, scrap and rework, in one orchestration with the output
    receipt when they are coupled;
  - `change#ProductionQuantity`: a target delta that rewrites the WeptConsume and WeptProduce rows and cannot go below
    the facts;
  - `record#ProductionLoss` by its three paths (R-MFG-20): issued components (a scrap cost event, no stock), received or
    held output of an open run (the asset issued back to the run), and process loss (a quantity only). Free stock is
    scrapped in Warehouse;
  - `find#ProductionLosses`;
  - complete in `transition#ProductionOrder`: the reconciliation of §12.2, the settled operations and material
    disposition. Where ProductionPolicy's flag allows it (§4), the final output receipt reconciles and completes in
    the same service. Partial completion offers Finish remainder with approved loss; Backorder is P9's;
  - `record#ProductionQuantity` and `record#ProductionLoss` check `PRODUCTION_OPERATE`, `change#ProductionQuantity`
    `PRODUCTION_PLAN`, and complete `PRODUCTION_SUPERVISE`;
  - `receive#ProductionOutput` admits output beyond the target within the overproduction tolerance, and above it with
    a supervisor's approval, which Warehouse P16b refuses today (OVER_RECEIPT; impl-warehouse §5). A by-product stays
    refused until P15's allocation (BYPRODUCT_NOT_COSTED).
- **Screens:** Quantities (OutputPlan, AddOutput, Reconcile, ChangeQuantity), ByProducts (with AllocationReview's
  estimate; its actual allocation is P15's), and ScrapLoss (Find, Losses, RecordLoss).
- **Approvals:** exceptional loss and overproduction above the policy, by `PRODUCTION_SUPERVISE`.
- **Outputs:** finished, secondary and WIP labels on Products P11's label contract; no label claims acceptance before
  disposition.
- **Usable when** (design §10.3, partial production):
  - a run for 10 receives 6 good, records 1 process loss and the scrap of an issued component (a cost event and no stock
    movement), and shows 3 remaining;
  - scrapping a received output asset of the open run issues it back to the run, not to shrinkage;
  - a target cut below the good quantity is refused, and a cut to 9 writes a delta;
  - overproduction above the tolerance waits for a supervisor;
  - complete is refused until the quantities reconcile, then succeeds; a retry posts nothing twice.

**Built Nov 3 (P7).**
- Mantle records (`entity/ProductionQuantityEntities.xml`, a new file): `ProductionQuantityEvent` (good, produced-held,
  process loss, scrap, rework, target change with the targets before and after, and an overproduction request with its
  approval), `ProductionLoss` (its type, line, product, asset and lot, quantity, the reason's code, name and category as
  recorded, whether the output was held, its status PlsPending/PlsApproved/PlsRefused with the approver, the issuance of an
  output scrapped back, the rework order), `AssetIssuance.productionLossId` and the output line's audit-logged
  overproduction approval (`overApprovedQuantity`, by, date). `data/ProductionQuantityData.xml`: the event, loss type and
  approval enumerations, the loss status flow (its two transitions carry PRODUCTION_SUPERVISE), the cost event types
  PcetMaterialScrap and PcetOutputScrap, and the ProductionLossApproval and ProductionOverproduction topics.
- Mantle services (`ProductionQuantities.js`, seven services appended to `ProductionServices.xml`):
  - `get#ProductionQuantities` (PRODUCTION_VIEW or _OPERATE): per output line target, received, accepted good and
    produced-held (each receipt's asset by its status now, less what was scrapped back), approved process loss, scrap,
    rework, losses waiting, remaining, over, the policy's tolerance, the supervisor's approval and what it may still take;
    per material line required, issued, returned, net, scrapped and to issue; the events and losses (cost with
    ACCOUNTING_VIEW only); the reconciliation; the by-products' allocation estimate by quantity (Products' cost read only);
    what the user may do;
  - `store#ProductionOutput` (PLAN): a draft's secondary output or by-product line, never the run's own product
    (OUTPUT_PRIMARY);
  - `record#ProductionQuantity` (OPERATE): process loss, scrap and rework through their losses, then good and pending output
    through `receive#ProductionOutput` (pending with the new `hold`: quarantine and an inspection), each under a sub-key of
    the operation, with its event; beyond the target, tolerance and approval it records only an overproduction request
    (APPROVAL_REQUESTED) and notifies the supervisors;
  - `change#ProductionQuantity` (PLAN): the target delta event, never below good + held + loss + losses waiting
    (TARGET_BELOW_FACTS); materials and by-products scale, never below what each issued or received; `writeProducts`
    rewrites the Wept rows; the revision counts up; `set#ProducedProductQuantity` is never called (F8);
  - `record#ProductionLoss` (OPERATE) by R-MFG-20's paths: PltComponentScrap (no stock moves; `record#ProductionCostEvent`
    from the loss, PcetMaterialScrap at the asset's or the line's issued unit cost, PclAwaitingClose), PltOutputScrap of an
    output asset of the open run (STOCK_ISSUE; `issue#AssetToWorkEffort` with `productionLossId`, so the hook posts it back
    into WIP and its event is PcetOutputScrap/PrcOutput) or before receipt (no asset), PltProcessLoss and PltRework; above
    the reason's `approvalThreshold` (percent of the line) it waits (PlsPending, ProductionLossApproval) unless a supervisor
    records it;
  - `approve#ProductionException` (SUPERVISE): a pending loss approved (applied then) or refused with a reason, an
    overproduction request approved (the line's approval grows) or refused; marks the notices read;
  - `find#ProductionLosses` (VIEW or OPERATE, paged, each run checked) and `get#ProductionLabels` (VIEW or STOCK_ISSUE).
- The edits to shared files: `transition#ProductionOrder` complete (ProductionOrders.js `check`/`apply`): each output line
  reconciled (QUANTITIES_UNRECONCILED, with `finishRemainder` writing the rest as an approved PltProcessLoss), nothing held
  (OUTPUT_HELD), no loss waiting (LOSS_PENDING), no operation running or held (OPERATION_OPEN; the operations not reported
  are completed with the run), material issued (MATERIAL_UNISSUED unless `acceptMaterialVariance`), then WeComplete at the
  next revision; `factsOf` counts quantity events and losses. `receive#ProductionOutput` (Production.js `outputPlan`): its
  limit is the line's target + tolerance + approval − what it accounts for (OVER_RECEIPT, unchanged with no policy and no
  loss), `hold`, and after the receipt `afterReceipt` completes a running run that reconciles under
  `completeOnFinalReceipt` (`completed` in the result). ProductionCosts.js: the ProductionLoss source, the output scrap's
  issuance event, and actuals that show `scrapped` apart from the WIP balance.
- BOSS: WorkOrderDetail's Quantities tab (index 5: the reconciliation line, Record quantities (primary), Record loss,
  Change quantity, Add output on a draft, Complete with Finish remainder and the material variance, the supervisor's
  decisions, Output plan, Materials, Losses, Quantity events) and By-products tab (index 7: the lines, editable on a draft,
  and the allocation estimate); OutputLabels (html-print: finished, secondary and WIP labels, a held one "HELD: not
  accepted"); Quality now a parent with ScrapLoss (Find, Losses, RecordLoss, the decisions; its placeholder replaced);
  Manufacturing.js's P7 block (links, `lossTypes`, `lossReasons`); the two topics in the root, Approvals and BossSetupData's
  links to the Quantities tab.
- Specs: Mantle `test/work/ProductionQuantities.spec.js` (9 features, about 5 s: the run for 10 with 6 good, 1 process loss and
  a component scrap with its event and no stock movement, 3 remaining; a received and a held output asset scrapped back to
  the run, with the labels; the target cut refused below the facts and to 9 as a delta with the lines and Wept rows; the
  overproduction within and beyond tolerance with the supervisor's approval; the threshold loss approved and refused;
  complete refused then done, a retry posting nothing; Finish remainder and the material variance; the completeOnFinalReceipt
  flag and its default; the draft by-product, its refused receipt and the allocation estimate); ProductionOrders' preview
  expects QUANTITIES_UNRECONCILED. BOSS ManufacturingAccess P7 (2: each verb's permission and the other organization; the
  tabs and ScrapLoss with authz enabled), the route fixtures, AppStructure's floor 65; client walk
  `ManufacturingQuantitiesWalk` (3, with 390 px).
- Tests run: Mantle ProductionQuantities, ProductionOrders, ProductionCosts, WarehouseProduction, ManufacturingServices,
  ProductionPolicy, ProductMethods (57, pass); BOSS ManufacturingAccess, AppStructure, TuiRender (94, pass),
  ManufacturingWorkOrders, ManufacturingShell, ManufacturingPlanning, WarehouseAccess, Notifications (174, pass); walk
  ManufacturingQuantitiesWalk (3, pass). `moqui lint --screens`: only informational anchor rows for the P7 screens.
- Decisions:
  - Quantities derive from the receipts and losses, never a stored counter: good and held by each receipt asset's status now,
    so an inspection's disposition (P8) moves held to good or loss without a quantity write.
  - Complete needs nothing held, no loss waiting and no operation running; operations never reported (no P10 yet) are
    completed with the run; unissued material blocks unless the supervisor accepts the variance; by-products do not block
    (received only after P15).
  - A component scrap's event carries its value awaiting the close and is left out of the WIP balance (the issue already put
    it in WIP); an output scrap's issuance is the event, so WIP rises by what the receipt relieved.
  - An exceptional loss is one above its reason's `approvalThreshold` as a percent of the line's quantity; a supervisor's own
    loss is approved as recorded. Overproduction approval is a quantity on the output line, so later receipts use it.
  - record#ProductionQuantity's expected revision is optional (a station scan has none); its receipts and losses do not
    count the revision up, change and store#ProductionOutput do.
  - Labels use Products P11's 50 x 30 template and a Code 128 of the asset id; `prepare#ProductLabels` is not called, since
    its items carry no lot, run or hold state (F91).
- Deferred: the backorder (P9); a by-product's receipt and the actual allocation (P15); an inspection's scrap disposition
  calling record#ProductionLoss (P8); operation-level quantity reporting (P10's complete#ProductionOperation); a handheld
  mount of Reconcile (P10's shop floor).
- Findings (provisional):
  - **F88** A status field on a new record needs its StatusFlowTransition rows: the framework's status check refused
    PlsPending → PlsApproved until `ProductionLoss`'s flow was seeded.
  - **F89** receive#ProductionOutput's limit now counts losses (a process loss or a loss waiting lowers what may be
    received; an output scrapped back stays counted, as scrap in place of good, so it frees nothing); with no policy row and
    no loss it is the old target − received (WarehouseProduction's over-receipt case, which has no policy row).
  - **F90** Nothing completes an operation before P10, so complete closes the untouched operations with the run; P10's
    `complete#ProductionOperation` should make OPERATION_OPEN the usual refusal.
  - **F91** Products' label contract (`prepare#ProductLabels`) labels a product by its identifier for catalog scope; a
    production label needs the asset, lot, run and hold state, so `get#ProductionLabels` follows its template and barcode and
    Products could add an item `caption` to share the print.
  - **F92** `find#ProductionLosses` checks each loss's run (no WorkEffort filter, F3) and pages in memory, capped at 2000.
  - **F93** For the merge: Production.js (`outputPlan`'s limit and `hold`, the `writeProducts` export), ProductionCosts.js
    (sources, `issuanceEvent`, `actualsOf`), ProductionOrders.js (complete, `factsOf`, `blockedReasons`, the request fields),
    ProductionServices.xml (`receive#ProductionOutput`, `transition#ProductionOrder`'s two parameters, the appended section),
    Quality.xml (now a parent: P8's Inspections and P11's Downtime add files under `Quality/`), Approvals.xml, the root's
    topics, BossSetupData's topic links, ManufacturingSpecLib, AppStructure's floor (65) and suite.js.
  - **F94** ManufacturingAccess's P7 tab feature reads the process loss its first P7 feature records.
- **Review (Nov 3).** Verified against the "usable when" items, R-MFG-20's three paths, F8 (no
  set#ProducedProductQuantity), the change floor and its Wept delta, the §12.2 refusals, the completeOnFinalReceipt flag (one
  transaction, off by default, both tested), the tolerance and approval, BYPRODUCT_NOT_COSTED and the permissions. Fixed:
  approve#ProductionException takes the `workEffortId` the screen checked and refuses a loss or overproduction request of
  another work order (RECORD_UNAVAILABLE; Quantities and ScrapLoss pass it), so the record check and the decision are of the
  same run (low: Mantle still checked the organization). Specs added: a retry of record#ProductionLoss writes no second loss
  or cost event; record#ProductionQuantity refused for a reader and another organization; the overproduction notice reaches
  the supervisor and not the operator or the other organization; a decision naming another work order is refused;
  WarehouseProduction's over-receipt case named as F89's no-policy test. F89's wording corrected. Left, for later
  phases:
  - **F95** (P10) Complete marks operations never reported WeComplete with no time, which reports (P16) and scheduling
    (P12) would read as done work. Once complete#ProductionOperation exists, completeCheck should refuse an operation not
    complete (or offer an explicit "close unreported operations" the supervisor accepts, as with the material variance)
    rather than closing them silently.
  - **F96** Good and pending output need STOCK_ISSUE (Warehouse's grant, §2 P1), which BOSS_MFG_OPERATOR lacks: an
    operator alone can record losses but not receive output; the Quantities dialog still offers good and pending. Either the
    operator holds the Warehouse issue group or the dialog hides the receipt fields without `can.issue` (P10's shop floor).
  - **F97** (P5b merge) change#ProductionQuantity scales every PrlrMaterial line, so P5b's manual material lines scale
    too; the merge should decide whether a manual line keeps its quantity. Decided at the merge: it keeps it unless `scaleManual` (P5b review). The Mantle collisions with P5b are append-only
    (Production.js's export list, ProductionServices.xml's appended sections); BOSS collides with master (P11) only in
    appended blocks (Manufacturing.js, ManufacturingAccess, ManufacturingSpecLib, suite.js).
  - Review specs: Mantle ProductionQuantities, ProductionOrders, ProductionCosts, WarehouseProduction (32, then the two
    touched again, 17, pass); BOSS ManufacturingAccess (73, pass); `moqui lint --screens` informational anchors only.

### P8 — Quality

Design §3 QualityGates and §6 Inspections, QualityInspection and InspectionTemplates; M6's inspection part, over
Warehouse P8's CX-QUALITY and its `QUALITY_*` permissions, which P1 grants to the quality groups.

- **Gates:** `get#SourceInspectionStatus` answers for the run, operation and output-line sources; the start and
  complete guards and dependent operations read it. Each released operation keeps its template as of its release time.
- **Templates:** in-process and final applicability, the sampling basis, and the method or operation they attach to.
- **Held output:** P16b receives it AstQuarantine and creates the inspection in the same operation.
  `dispose#Inspection` releases it, reserving it first to a pegged order item (R-SA-10); a scrap disposition of an open
  run's output takes P7's loss path.
- **Screens:** QualityGates; Inspections in the production context; QualityInspection and InspectionTemplates
  (Warehouse's shared screens) with the Manufacturing context, the operator mode with sequential controls and the scan
  field.
- **Outputs:** the quality checklist and the quality certificate; the quality-block notice.
- **Usable when** (design §10.3, quality hold):
  - output of a run whose final template applies is received held, and complete is refused while it is pending;
  - an inspector records and submits, cannot verify, and a verifier verifies;
  - a disposition releases five units and scraps one through the loss path; held quantity never counts as good;
  - an in-process failure blocks the dependent operation's start, naming the inspection;
  - a template revision leaves the released run's gate as it was.

**Built Nov 3 (P8).**
- Mantle records (`entity/ProductionQualityEntities.xml`, a new file): `ProductionQualityGate` (a released run's gate: the
  operation (in-process) or output line (final), the template and `templateAsOfDate` = the release time, the sample policy,
  size, percent and basis as of then, where the template came from, ended by an unrelease); `InspectionTemplate` gains
  `productionStageEnumId` (QpsInProcess, QpsFinal), `sampleBasisEnumId` (QsbReceipt, QsbRun), `productBomId` and
  `operationWorkEffortId` (attachment); `QualityInspection` gains the operation, output line and gate;
  `QualityInspectionDisposition.productionLossId`; `WorkEffort.productionGatesDate`. `data/ProductionQualityData.xml`: the
  stage, basis and gate source enumerations and the ProductionQualityBlock topic.
- Mantle logic (`ProductionQuality.js`, new): at release the gates (an operation's from its routing operation's
  `methodInspectionTemplateId`, copied from P2's operation template, or a production template attached to the operation; an
  output line's final gate from a template attached to the run's BOM, else one that applies by product, category and
  facility), refusing a named template that is not published (TEMPLATE_UNAVAILABLE, in the release gate's preview too); each
  gate's state from its inspections (required, pending, failed, passed; an in-process gate by its latest inspection, a
  reinspection superseding with the failure kept in history; a final gate by the worst of its receipts'); the guards: start and
  resume refuse a failed in-process gate (QUALITY_BLOCKED, naming the inspection), complete refuses a final inspection pending
  or failed and an in-process gate not passed (INSPECTION_PENDING, INSPECTION_FAILED, QUALITY_GATE_OPEN; first in
  completeCheck, so the completeOnFinalReceipt path obeys it too), and an operation after an in-process gate not passed is not
  ready, naming the inspection (`operationBlocks`; `operationGate` for P10's start); `create#ProductionInspection`
  (QUALITY_INSPECT) for an in-process gate; the output receipt's gate (`outputInspection`, `inspectionPlan`); the
  quality-block notice to the run's supervisors when a production inspection is verified with a rejection; and a scrap
  disposition of an open run's output through P7's loss path (`scrapToRun`: an approved PltOutputScrap loss, `applyLoss`).
- Edits to shared Mantle files: `Quality.js` (applicableTemplate leaves out in-process and attached templates; createInspection
  takes a gate: its template as of the release, sample and links, and the run's own `demandOrderId` as the peg when no
  OrderItemWorkEffort; a reinspection keeps the gate; outputInspections passes the gate; verify calls `afterVerify`; Scrap of an
  open run's output takes `scrapToRun` instead of the morgue and `scrap#Asset`; get#SourceInspectionStatus answers a run,
  operation or output line; find#Inspections filters by run, operation, gate and context; store#InspectionTemplate takes the
  production fields only with `productionApplicability`); `QualityServices.xml` (the parameters, descriptions);
  `Production.js` (release writes the gates; outputPlan holds a gated line's output; `operationsOf` exported);
  `ProductionOrders.js` (release gate, start and resume, unrelease ends the gates, inspections count as facts, operations
  readiness); `ProductionQuantities.js` (completeCheck's gate first; outputFigures: an inspected receipt is held by its
  inspections' heldQuantity, so a part released from a held asset counts good at once; `applyLoss` exported);
  `ProductionServices.xml` (release and transition descriptions, the appended `create#ProductionInspection`).
- BOSS: WorkOrderDetail's Quality tab (index 8; Gates with state, template as of the release, sample, inspection, held,
  disposition, Inspect, Checklist; the run's inspections) and `WorkOrderDetail/QualityChecklist` (html-print, open to the
  floor); the Quality area now defaults to Inspections (Find and list; the station link), with Templates (`Shared/
  InspectionTemplates`, index 2) and, hidden, `Shared/QualityInspection`, `InspectionStation` (density handheld, a scan-input
  over `resolve#InspectionScan`, the assigned inspections, and the shared inspection in operator mode: one characteristic and
  sample at a time with Pass and Fail or the value) and `QualityCertificate` (html-print; "evidence, not verified" until
  verified). `ironstone.manufacturing.QualityServices` (`Quality.js`): get#QualityGates, get#InspectionList,
  get#InspectionDetail, get#QualityChecklist, get#QualityCertificate, get#TemplateList, get#TemplateDetail,
  get#InspectionChoices, resolve#InspectionScan. Manufacturing.js's P8 block (record kinds inspection and inspectionTemplate,
  links). The shared screens' Manufacturing context: `Shared/QualityInspection` (detail, run and operation links, gate text,
  the certificate, operator steps), `Shared/InspectionTemplates` (list and detail, the stage, basis, method and operation
  fields, a production new template); `template/WarehouseInspectionParts.xml`'s transitions check the record through
  Manufacturing's check#Record under the Manufacturing root (Warehouse's otherwise) and take its choices. The root's
  ProductionQualityBlock topic and BossSetupData's link to the Quality tab. Demo: the weld template `BOSS_MFG_QTMPL`, the
  running work order `BOSS_MFG_RUN_Q` (Weld then Pack) with its gate and the draft inspection `BOSS_MFG_INSP`.
- Specs: Mantle `test/work/ProductionQuality.spec.js` (6 features, about 5 s: the held receipt with its gate's inspection and
  INSPECTION_PENDING, held never good; the inspector submits and cannot verify, the verifier verifies, the block notice; Release
  of 5 reserved to the pegged order item and Scrap of 1 through the loss path, good 5, scrap 1, complete; the in-process
  failure blocking Assemble's readiness and start status, the resume and the completion, cleared by Rework; the template
  revision leaving the released gate's items and sample; the unpublished template blocking the release). BOSS
  ManufacturingAccess P8 (2: each verb's permission and organization on the demo gate; the screens by role with authz on),
  the route fixtures (AppStructure, TuiRender), client walk `ManufacturingQualityWalk` (3, 390 px).
- Tests run: Mantle ProductionQuality, ProductionQuantities, ProductionOrders, WarehouseProduction, WarehouseQuality,
  ManufacturingServices, ProductionPolicy, ProductMethods, ProductionCosts, MethodTemplates (74, pass); BOSS ManufacturingAccess,
  AppStructure, TuiRender, WarehouseInspections, WarehouseAccess, ManufacturingWorkOrders, ManufacturingShell, Notifications
  (276, pass); walks ManufacturingQualityWalk, ManufacturingQuantitiesWalk, WarehouseInspectionWalk (9, pass). `moqui lint
  --screens`: only informational anchor rows for the P8 screens. No new Shared screen (ClientIsolation unchanged).
- Decisions:
  - A gate is a snapshot record (`ProductionQualityGate`) written at release with the template id, the release time as the
    items' as-of and the header's sample plan, rather than reading the template's audit log: the header fields are not
    effective-dated, so a later sample change would otherwise reach a released run.
  - A run released under P8 reads its gates only (`productionGatesDate`), so a template published after its release adds no
    gate; the tracking policy's `inspectionRequired` still holds output (a facility rule, not a template). A run released
    before P8 keeps P16's rule (a production template that applies now).
  - In-process failure holds the run (start, resume) and the operations after the gate; a final failure holds the output
    only (it is received held) and the completion. "After" is the routing's predecessors when the routing names any, else
    the sequence.
  - A verified rejection is failed until its rejected quantity is disposed (scrapped, reworked, used as is) or a later
    inspection passes; a final inspection is pending while any of its stock is still held.
  - The dispose#Inspection change (Scrap through the loss path) is behind its condition, a production run's open output
    (the asset is a receipt of the run's output line), not a ProductionPolicy flag: the plan's P8 makes it the rule, and stock
    of a closed run or any other source still scraps as before (WarehouseQuality unchanged).
  - The pegged order item is the run's OrderItemWorkEffort, else its own demand (`demandOrderId`, create#ProductionOrder's
    sourceOrderId).
- Deferred: the operation start itself (P10's start#ProductionOperation calls `operationGate`; the readiness and
  get#SourceInspectionStatus's `startAllowed` name the inspection now); a gauge on a reading (later, Gauges); the
  Purchasing and Customer Service contexts of the shared screens.
- Findings (provisional):
  - **F104** There is no operation start before P10, so "an in-process failure blocks the dependent operation's start" is
    the operation's readiness and its `startAllowed` (and the run's resume); P10's start must call `operationGate`. The spec
    marks an operation done directly, as P10 would (F90).
  - **F105** (fixed in review) QualityInspectionDecision had one link template, Warehouse's (`/qapps/Warehouse/QualityInspection`), so a
    production inspection's decision notice opens Warehouse, which a Manufacturing inspector may not reach. The topic could
    carry the app in its message, or Manufacturing could seed its own decision topic.
  - **F106** RequirementSupply has no sales order item, so a planned run's demand cannot be pegged from it; R-SA-10 reads
    OrderItemWorkEffort and the run's own demand fields. A make suggestion converted from an order's demand should carry it
    to the run (P13's conversion).
  - **F107** P7's get#ProductionQuantities counted a receipt held by its asset's status; a partial Release splits the
    released units off and leaves the receipt's asset quarantined, so they counted held. An inspected receipt is now held by
    its inspections' heldQuantity (bounded by what is left after scrap).
  - **F108** store#InspectionTemplate takes every header field when templateName is given, an empty one clearing it; the
    production fields are taken only with `productionApplicability`, so Warehouse's form, which does not show them, never
    clears them (the template revision spec checks it).
  - **F109** For the merge: Quality.js and QualityServices.xml (Warehouse P8's; P14's subcontract receipt holds output
    through `outputInspections`, which now takes a gate argument), Production.js (`release`, `outputPlan`, `postOutput`, the
    export list), ProductionOrders.js (releaseGate, check, apply, factsOf, operations), ProductionQuantities.js
    (completeCheck, outputFigures, exports), ProductionServices.xml (two descriptions, the appended section),
    WarehouseInspectionParts.xml, Shared/QualityInspection and Shared/InspectionTemplates, Quality.xml (default item
    Inspections), Manufacturing.js, Manufacturing.xml, BossSetupData's topic link, BossManufacturingDemoData, ManufacturingSpecLib,
    ManufacturingAccess and suite.js. P12's scheduling reads operations; the readiness text now can name an inspection.
- **Review (Nov 3).** Verified against the "usable when" items, §2 and the design's R-MFG-20:
  - The dispose#Inspection change has no ProductionPolicy flag, and that stands: design-manufacturing Quantities and
    ScrapLoss make the loss path the rule for held output of an open run ("not a Warehouse adjustment"), the old path
    booked a run's scrap to shrinkage, and Warehouse's own scrap (receipts, returns, a closed run's stock) is unchanged (WarehouseQuality and
    WarehouseReturns pass). A flag off would also need outputFigures to subtract a disposition's scrap, which only the loss
    path records. The loss is approved by the disposer (QUALITY_DISPOSE after a verified rejection), not a supervisor.
  - F105 fixed: Mantle's decision notice carries the inspection's context, and BOSS's QualityInspectionDecision link
    opens a production inspection at Manufacturing/Quality/QualityInspection and any other in Warehouse; the Manufacturing
    shell lists the topic. The submit notice still goes to every QUALITY_VERIFY holder of the organization, Warehouse's
    quality managers too, who get the Manufacturing link.
  - Specs added to ProductionQuality: the peg now comes from create#ProductionOrder's sourceOrderId through the receipt's
    inspection (the spec had written the inspection's demand itself); the older-run branch (no productionGatesDate: P16's
    applicable template holds the output, no gate) and a gated run whose final gate is gone (not held); unrelease refused
    with the inspection as a fact (RUN_HAS_FACTS), then allowed once it is cancelled, ending the gates and clearing
    productionGatesDate; the decision notice's context and link.
  - Left: create#ProductionInspection has no operation key (as Warehouse's create#Inspection); a retry is refused
    INSPECTION_EXISTS rather than answering the first. A P7 loss recorded from held output outside a disposition does not
    lower the inspection's heldQuantity, so its gate stays pending (outputFigures bounds the held count, so it is never
    good twice).
  - Tests run: Mantle ProductionQuality (8), WarehouseQuality, ProductionQuantities, ProductionOrders, WarehouseProduction
    (43, pass), WarehouseReturns; BOSS ManufacturingAccess, WarehouseInspections, WarehouseAccess, AppStructure, Notifications (249, pass);
    walk ManufacturingQualityWalk (3, pass).

### P9 — Controlled changes

Design §3 Components' Substitute, SplitWorkOrder, Disassembly and WorkOrderDetail's cancellation and clone, §5
BillOfMaterialsCompare's amendment action; M4.

- **`mantle.work.ProductionServices`:**
  - `substitute#ProductionMaterial`: a candidate from the BOM item's substitution rule (Products' PatEquivalent rows
    only when the rule allows), with supervisor approval (`PRODUCTION_SUPERVISE`). It adds a WeptConsume row and
    reduces the original's; after release it is an amendment;
  - `amend#ProductionOrder` (design §12.1): an audit-logged change that remaps only unexecuted lines and operations and
    keeps the original facts' links, under the amendment policy (§4), checking `METHOD_APPROVE` and
    `PRODUCTION_SUPERVISE`;
  - `preview#ProductionSplit` and `split#ProductionOrder` (`PRODUCTION_PLAN`), split and backorder, conserving
    remaining demand;
  - cancellation after postings as a reviewed reversal or residual plan; clone through `create#ProductionOrder`;
  - `reverse#SupportedAssembly` over `breakDown#Assembly`, for a PtPickAssembly kit only. The kit receipt's reduction is
    a dated reversing delta in an open period, not `repost#Asset`'s unpost and re-post (§4; F15). Both reposts change
    Mantle, so each sits behind its flag (impl-accounting §4): Disassembly needs Accounting P2a's issuance flag and
    this receipt flag on, and is refused naming the flag otherwise. `breakDown#Assembly` unissues by the kit's
    current PatMfgBom quantities, so the guard checks them against the quantities actually issued and refuses a
    difference.
- **Screens:** Components' Substitute; SplitWorkOrder (Allocation, Disposition, Confirm); Disassembly (Assembly,
  Preview, Confirm); BillOfMaterialsCompare's Request amendment.
- **Approvals:** substitution and amendment.
- **Usable when** (design §10.3, released method change):
  - an approved substitute is issued, the original's demand drops, and an arbitrary product is refused;
  - after the first operation, an amendment to a later BOM release remaps the remaining operations only, and the issued
    facts keep their lines;
  - a split moves 4 of 10 remaining to a backorder on the same method revision, and a retry answers the same IDs;
  - a DEMO_PA kit assembly is reversed with dated reversing entries in an open period, and a kit unit already sold is
    refused.

**Built Nov 3 (P9).**
- Mantle records (`entity/ProductionChangeEntities.xml`, a new file): `ProductionChange` (a substitution or an amendment
  request: the run's revision and preview key it was asked at, the line, substitute, quantity and factor, or the method date,
  change notice and the remap as JSON; the requester, the method approver's and the supervisor's reviews, a refusal, the
  applied date and revision; status PchRequested, PchApplied or PchRefused), `ProductionRunLine.substituteOfLineId` and
  `productionChangeId`, and `WorkEffort.productionSourceRunId`/`productionSourceEnumId` (PsoSplit, PsoBackorder, PsoClone),
  all audit-logged. `data/ProductionChangeData.xml`: the enumerations, the change status flow and the ProductionSubstitution
  and ProductionAmendment topics.
- Mantle services (`ProductionChanges.js`, `SupportedAssembly.js`; eleven services appended to `ProductionServices.xml`):
  - `get#ProductionChanges` (VIEW): the requests with their reviews and who may decide, the substitutes each material line
    allows, what the user may ask.
  - `substitute#ProductionMaterial` (request: PLAN or SUPERVISE; approve, refuse: SUPERVISE): a candidate only from the BOM
    line's rule (BsrEquivalent: the component's active PatEquivalent rows; SUBSTITUTE_NOT_ALLOWED otherwise), at most what
    the line has left, a factor in the substitute's stock unit (UNIT_INCOMPATIBLE without one across units). Applying adds the
    substitute's line beside the original (its operation and BOM line), lowers the original, rewrites WeptConsume and counts
    the revision up (on a released run, an amendment of its lines). A supervisor's own request, or the policy's
    `substituteApproval` N, applies at once; else the supervisors are told and the decision revalidates the request
    (CHANGE_STALE). Strict release refuses it on a released run.
  - `preview#ProductionAmendment` and `amend#ProductionOrder` (request: PLAN or METHOD_EDIT; approve, refuse: METHOD_APPROVE or
    SUPERVISE): the method as of a date (Production.js `method`, a new export) remaps only unexecuted work: an operation with
    facts or started is kept, others follow the routing (kept, changed, added, cancelled); a method line issued, scrapped or on
    an executed operation is kept with its facts (LINE_EXECUTED_KEPT), others change by BOM lineage (`replacesBomItemId`),
    less what substitutes took, never below what was issued; manual and substitute lines stay. Each reviewer revalidates the
    remap (PREVIEW_CHANGED); the method approvers are told first, then the supervisors; both reviews apply it, rewriting the
    Wept rows and the run's method date, routing and refs at the next revision with the amendment as the audit reason.
    `strictRelease` refuses (STRICT_RELEASE); a draft is AMEND_NOT_RELEASED.
  - `preview#ProductionSplit` and `split#ProductionOrder` (PLAN; a completing backorder SUPERVISE): a quantity of what is left
    moves with each line's share up to what it has left to issue (issued material stays as WIP, MATERIAL_STAYS), the
    RequirementSupply links ended and started again so the sums stay, a target-change event on the source; the new run has the
    source's method date, BOM, routing, refs and demand links, and a released source's is released at the same method date
    (Production.js `release` takes `keepMethod`, a local edit), with its own operations. A backorder with `complete` completes
    the running source in the same transaction (P7's Backorder option). A retry answers the same runs.
  - `preview#ProductionCancellation` and `cancel#ProductionOrder` (SUPERVISE; returns STOCK_ISSUE): a reversal (each issue
    returned through `return#UnusedMaterial`, then cancelled) when nothing was received, lost or timed, else a residual close
    (unused issues returned when asked, the rest finished as an approved loss, the material variance accepted, completed for the
    cost close); NO_FACTS sends a run without postings to the lifecycle's cancel.
  - `clone#ProductionOrder` (PLAN): `create#ProductionOrder` from the run's product, quantity, facility and method as of now
    (PsoClone); no posting, manual line or timer.
  - `preview#SupportedAssemblyReversal` and `reverse#SupportedAssembly` (SUPERVISE) per F29–F32: a PtPickAssembly kit of a
    WepPickAssembly effort on hand; `breakDown#Assembly` without its unissue, then the kit slices cancelled newest first with
    their quantities; refused naming each flag that is off (FORWARD_REPOST_REQUIRED), KIT_SOLD, KIT_HELD, KIT_COUNTED,
    PERIOD_CLOSED, BOM_MISSING, BOM_CHANGED and COST_SLICE_MISMATCH (the slices' value must equal the kits').
  - Accounting's receipt delta: `ReceiptAdjustments.js` in `repost#AssetReceipt` (a two-line local edit) behind
    `PartyAcctgPreference.forwardReceiptRepostEnabled` (AccountingControlEntities.xml, audit-logged, default N; added to
    AccountingSetup.js and SetupServices.xml's flag list; BOSS AccountingPreferences shows it); a never-posted receipt or a
    moved received date keeps the legacy path.
- BOSS: Components' Substitute row dialog and the substitution requests with Approve and Refuse; WorkOrderDetail's Changes tab
  (index 11: the amendment remap with a method date and Request amendment, the requests with their reviews, Cancel with
  postings by its plan); SplitWorkOrder (Allocation, Disposition, Confirm, under the header); WorkOrders/Disassembly (Assembly,
  Preview, Confirm; linked from Find for supervisors); WorkOrderDetail's More: Split or backorder, Clone; Quantities' Backorder
  remainder; `Shared/BillOfMaterialsCompare`'s Manufacturing section of released work orders with Request amendment (to the
  Changes tab at the compare's later date). Manufacturing.js P9 block (links, `kitAssets`), the two topics in the root,
  Approvals and BossSetupData's links.
- Specs: Mantle `test/work/ProductionChanges.spec.js` (8 features, about 3 s), `test/work/SupportedAssembly.spec.js` (4,
  about 1 s: two DEMO_PA packs at 4 and 6, both flags named, the older kit refused, the newest reversed with dated entries and
  the original posting kept, WIP 0 after each reversal, a kit unit sold refused), `test/ledger/ReceiptAdjustments.spec.js` (3:
  flag off legacy, on in an open period, on under a hard lock of the receipt's day). BOSS ManufacturingAccess P9 section (2),
  route fixtures (Changes, SplitWorkOrder, Disassembly); client walk `ManufacturingChangesWalk` (4, with 390 px).
- Tests run: Mantle ProductionChanges, SupportedAssembly, ReceiptAdjustments (15, pass), ManufacturingServices,
  WarehouseProduction, ProductionOrders, ProductionQuantities, ProductionMaterials, AccountingControls, WarehousePacking,
  AccountingSetup, ProductionCosts (94, pass); BOSS ManufacturingAccess, AppStructure, TuiRender, ManufacturingShell,
  ProductsMethodFixtures (125, pass), ManufacturingWorkOrders, ManufacturingMaterials, ManufacturingMethods,
  ProductsSharedContext, Notifications (116 with ManufacturingAccess, pass), AccountingShell, AccountingAccessWalk (60, pass);
  walks ManufacturingChangesWalk, ManufacturingQuantitiesWalk, ManufacturingWorkOrdersWalk, ManufacturingMaterialsWalk,
  ManufacturingMethodsWalk (16, pass). `moqui lint --screens`: informational anchors only for the P9 screens.
- Decisions:
  - Substitutions and amendments are one record, ProductionChange, decided on the run (F40); an amendment applies once a
    method approver and a supervisor have each reviewed it (one user holding both gives both), each review revalidating the
    remap; the method approvers are told first.
  - "No change after any fact by default" reads as: nothing reaches a released run but the reviewed amendment; with
    `strictRelease` not even that. A draft takes method changes by its release's re-explosion, not an amendment.
  - The amendment's review reads the method (METHOD_VIEW, which every Manufacturing group holds).
  - A split's or backorder's new run of a released source is released in the same transaction at the source's method date,
    so it keeps the method revision; a draft source's stays a draft.
  - A cancellation with postings is a reversal only when nothing was received, lost or timed; otherwise a residual close that
    completes the run (WeComplete) for the cost close, never WeCancelled with WIP left.
  - The kit reversal refuses any difference between the kits' value and their slices' (no tolerance), so WIP nets to zero;
    a batch whose cost was split (KitCost's remainder kit) is reversed whole.
  - The change notice is stored on the amendment as given: Products' ChangeNotices is not built (§7, R-MFG-32).
- Deferred: the demo data keeps both forward flags off for Retail (other specs post receipts there), so the demo's Disassembly
  answers FORWARD_REPOST_REQUIRED until Accounting turns them on; a substitute's issue at a backflush follows P5b's lines as
  they are; merging drafts stays §7.
- Findings (provisional):
  - **F120** A `link` to a transition that has actions (a wizard's Next) navigates the client to the transition's URL and
    renders an empty page; SplitWorkOrder's Back and Next link to the screen with the step, and its forms post to `toStep`,
    as NewWorkOrder does.
  - **F121** With `postingGuardEnabled`, the legacy receipt repost under a hard lock of the receipt's day does not fail: it
    deletes the posted transaction and leaves the new one unposted in the error journal, so the history is lost (F31 expected
    an error); ReceiptAdjustments' spec asserts the forward delta posts and the legacy path keeps no posted history.
  - **F122** `Production.js` `release` (the method's routings) and `get#BomExplosion` need METHOD_VIEW, so a split's
    internal release and an amendment's review need it too; a planner or supervisor without it is refused METHOD_INVALID.
  - **F123** For the merge: Production.js (`keepMethod` in `release`, the `method` export), ProductionServices.xml (the
    appended P9 section), AssetAutoPostServices.xml (`repost#AssetReceipt`'s first two actions), AccountingControlEntities.xml,
    AccountingSetup.js, SetupServices.xml; BOSS Components.xml, Quantities.xml (a link beside Labels), WorkOrderDetail.xml
    (a transition, two actions, two More items), Find.xml, Shared/BillOfMaterialsCompare.xml (an appended section),
    Approvals.xml, Manufacturing.xml's topics, BossSetupData's topic links, Manufacturing.js (a block before `operations`),
    ManufacturingSpecLib's routes, ManufacturingAccess (appended), suite.js, AccountingPreferences.xml.
- Review (Nov 3): checked substitution (candidates only from the BOM line's rule, PatEquivalent only under BsrEquivalent, the
  supervisor's decision revalidating revision, candidate and quantity), the amendment (only unexecuted lines and operations
  remapped, issued facts keeping their links, both reviews, strictRelease), split and backorder (RequirementSupply conserved,
  retry answering the same runs; `keepMethod` is honored only as a JS `true`, so the release service's paths are unchanged),
  cancellation and the kit reversal against F29–F32. Fixed:
  - (medium) a released run's substitute applied at once under the policy's `substituteApproval` N, a method change after
    release with no review (§4); it now always waits for a supervisor after release, N applying to drafts only (spec: a draft's
    applies, a released run's is REQUESTED).
  - (medium) `reverse#SupportedAssembly` refused only components issued short of the kits' BOM quantities; it now refuses any
    difference (BOM_CHANGED), since with `kitCostFromComponents` N no value check catches a lowered BOM; and a breakdown
    that lowers fewer kits than asked is refused (BREAKDOWN_SHORT) rather than cancelling the whole slices.
  - (low) an amendment removing a method line that has an applied substitute deleted it under the substitute; it is kept now,
    with a finding.
  - (low) ReceiptAdjustments' spec named the flag-off hard lock case "refused"; it loses the posting (F121).
  - F121 is Accounting's, not P9's: `PostingGuard.assertMutable` deliberately lets an unpost through and an automatic
    source's refused posting goes to the error journal, so the unchanged legacy `repost#AssetReceipt` loses the locked day's
    posting. Recorded in impl-accounting §7; the forward flag avoids it.
  - (medium, after the merge with master) cancellation counted only issues, output receipts, time and losses, while the
    lifecycle's cancel also refuses P7's quantity events and P8's inspections and a started run (RUN_STARTED): a split's
    source (its target change), an inspected run or a started run with no fact could be cancelled by neither. The plan now
    counts the same facts, reverses a started run with none, and keeps the inspections as records (spec: all three
    cancelled, a plain released run still NO_FACTS).

### P10 — Shop floor and time

Design §4 ShopFloor, OperationExecution and Instructions, §3 ProductionTime; M7, and review §4.1 steps 17 and 18.

- **Records and seeds:** `MachineRuntimeEvent`, the instruction step acknowledgment, and the WorkType seeds
  `WktpProductionSetup`, `WktpProductionRun` and `WktpProductionRework` (F18).
- **`mantle.work.ProductionServices`:**
  - `get#ShopFloorQueue`, `get#ProductionOperation`, `get#ProductionInstructions` and `record#InstructionStep`;
  - `complete#ProductionOperation`: the operation event and any coupled material and output posting atomically, and
    `TimeEntry.pieceCount` under the piece-rate policy (R-MFG-28);
  - `record#MachineRuntime`, whose closed interval writes the machine cost event at the effective WorkCenterRate. With
    no effective rate it is recorded unvalued and listed for review, and P15's close refuses the run until it is
    valued (§4);
  - `complete#ProductionOperation`, `record#MachineRuntime` and `record#InstructionStep` check `PRODUCTION_OPERATE`.
- **Projects' side** (§4), in mr-mantle's `mantle.work.TimesheetServices`, calling no ironstone service:
  - the production approver rule in `get#TimesheetApprovers`: the run's supervisor or the person's line manager
    (R-MFG-22). Its project rule already takes an item's root, or the item itself, as the project, so the operations
    carry the run as their root and the supervisor's assignment counts as a manager's (F17);
  - the hook on `approve#Timesheet`, calling `record#ProductionCostEvent`: a labor event per entry under a
    WepProductionRun, at the class and work-type costing rate (`RateAmount` by `emplPositionClassId` and
    `workTypeEnumId`), its `rateAmountId` as the rate identity; an entry with none is unvalued and blocks cost close
    (design Y2). Reopening writes a reversal, and a rate change after approval a delta, caught on the TimeEntry in
    Mantle, not in BOSS's rate form (F23; R-SA-09).
- **Screens:**
  - ShopFloor: the `.qvue` manager board and operator card (Station, Queue, Actions) with its `tui` twin;
  - OperationExecution (Work, PersonTimer, MachineRuntime, CompleteStep) and Instructions (Steps, Evidence), at
    `density="handheld"` with `scan-input`;
  - ProductionTime: the Projects time surface filtered to the run and its operations.
- **Checks:** start checks the predecessors, the operator's authorization and skills (blocking when the template requires them, advisory otherwise; §4), equipment
  restrictions and the configured material and inspection gates.
- **Shell and outputs:** Today's assigned due operations; the operator instructions print.
- **Usable when** (design §4):
  - an operator at phone width scans an operation, starts it with the person timer (switching from another timer with
    a confirmation), acknowledges a required instruction step, records machine runtime apart from labor, and completes
    5 good and 1 scrap with the coupled output receipt;
  - completion before a predecessor is refused, naming it, and keeps what was entered; a timed-out retry answers the
    first result;
  - the run's supervisor approves the operator's timesheet, which writes the labor event; reopening it writes the
    reversal;
  - the same flow completes in the terminal twin.

**Built Nov 4 (P10).**
- Mantle records (`entity/ProductionShopFloorEntities.xml`, new): `mantle.work.production.MachineRuntimeEvent` (run, operation,
  work center, optional equipment, mode, from and thru, hours, the WorkCenterRate it was valued at with rate, amount and
  currency, valuation, its cost event) and `InstructionAcknowledgment` (run, operation, the WorkEffortContent row, step kind
  IstAcknowledge or IstEvidence, person, user, date, value and unit, file reference, note); on WorkEffort the operation's
  audit-logged `productionGoodQuantity`, `productionLossQuantity` and the start override (`productionStartOverride`, `...Checks`,
  `...ByUserId`, `...Date`). Seeds (`data/ProductionShopFloorData.xml`): the WorkTypes `WktpProductionSetup`, `WktpProductionRun`
  and `WktpProductionRework` (F18), the RatePurpose `RaprProductionCost` (the costing rate, design Y2), MachineRuntimeMode,
  InstructionStepType and the cost event types `PcetLabor` and `PcetMachine`.
- Mantle services (`ProductionShopFloor.js`, eleven appended to `ProductionServices.xml`): `get#ShopFloorQueue` (the open runs'
  operations at a plant or center by state: running, ready, paused, blocked, done; readiness from `get#ProductionOperations`;
  mine; at most 100 runs), `get#ProductionOperation` (the start checks, timer, runtime, evidence, quantities and what the user may
  do; values only with ACCOUNTING_VIEW), `get#ProductionInstructions` and `record#InstructionStep` (the instruction rows of the
  routing operation and its template in effect at the release, a revision warning when a newer one is published; acknowledgment
  once per person; the evidence of `methodRequiredEvidence`), `override#ProductionOperationStart` (PRODUCTION_SUPERVISE),
  `start#`, `pause#` and `complete#ProductionOperation`, `record#MachineRuntime`, `sync#ProductionLaborCost` (internal) and
  `get#ProductionTime`. Start checks (§4): the run running, the operation open, its predecessors started, the in-process gate
  (P8's `operationGate`, F104), a staged short line, the run's equipment (blocked status or an open outage), the operator
  assigned when the run names assignees (or a supervisor), and the required skills and instruction acknowledgment, blocking
  unless overridden, with an advisory when neither is configured; then TimesheetServices' `start#Timer`, a timer elsewhere only
  with `confirmSwitch` (TIMER_SWITCH_REQUIRED). Complete: the predecessors complete (PREDECESSOR_OPEN, naming them), the evidence
  recorded, no machine runtime open, then `record#ProductionQuantity` under the operation's key (the output operation receives
  good and pending output; any operation records loss), the user's timer stopped, `TimeEntry.pieceCount` = good under the
  `pieceRate` policy, and the operation Complete; one transaction, a retry answers the first. Machine runtime: start, stop or a
  past interval, valued at the center's approved PccMachine WorkCenterRate in effect at its start, else PcvUnvalued; its
  PcetMachine event awaits the close. `ProductionCosts.js` gained the TimeEntry and MachineRuntimeEvent sources and a source
  that answers no event (a labor delta of nothing); `record#ProductionCostEvent` takes `sourceRemoved`.
- The labor hook (F34, F35): `TimesheetServices.approve#` and `reopen#Timesheet` and `TimeServices.store#` and `delete#TimeEntry`
  call `sync#ProductionLaborCost` beside `post#WorkEffortCost`: per entry on a production run whose owner's policy has
  `laborCostSync`, the delta between its hours while its week is approved and what its labor events recorded (approval at the
  costing RateAmount by position class and work type, else unvalued; reopen and deletion the reversal; an hours change a delta at
  the first rate). Other entries are passed over after one read; an entry that fails is logged and named. No
  `get#TimesheetApprovers` change (F33).
- Mantle's Today (F41): `get#UserTodayItems` leaves out a WepProductionRun and the WetTask operations under one.
- F90/F95: `transition#ProductionOrder` complete refuses operations not completed on the shop floor (OPERATION_UNREPORTED, after
  the material check) unless `closeUnreportedOperations`; `completeOnFinalReceipt` counts as that acceptance. ProductionQuantities
  and ProductionQuality's completing features pass it; WorkOrderDetail's Complete dialog has the checkbox.
- BOSS: the Shop floor area (`ShopFloor.xml`, its placeholder replaced): `Station` (`Station.qvue`: scan, plant, My work, the
  selected card with Open, Start and Instructions, the board by state, stacked at phone width; `Station.tui.json`, the board
  component opening OperationExecution), `OperationExecution` and `Instructions` (density handheld, scan-input), `ProductionTime`
  and `InstructionsPrint` (html-print); `ironstone.manufacturing.ShopFloorServices` (`get#Station`, `resolve#OperationScan`) and
  `HomeServices.get#TodayItems` over `ShopFloor.js`; the root's `<today-source>`; Manufacturing.js's P10 block (routes, the
  `productionWorkTypes` choice). Demo: line A's policy row (machine runtime recorded, piece rate, `laborCostSync`), Retail's
  costing rate `BOSS_MFG_RATE_RUN`, the material handler's assembly skill.
- Specs: Mantle `test/work/ProductionShopFloor.spec.js` (7 features, about 2 s: the queue by state; the skill override and the
  acknowledgment blocking the start; the timer switch with its confirmation and a retry; overlap with completion refused before
  the predecessor; machine runtime valued and unvalued, apart from labor; the evidence; 6 good at Assemble with its piece count,
  then 5 good and 1 scrap at Pack with the coupled receipt and a retry; STOCK_ISSUE_REQUIRED; the supervisor's approval writing
  the labor event and the reopen its reversal, the flag off at a second plant and a plain task writing none; OPERATION_UNREPORTED
  then closed; Today leaving out a run and its operation and keeping a plain task; the reads refused). BOSS
  `ManufacturingShopFloor` (6, through the screens' transitions and pages with authz on, and the tui twins),
  ManufacturingAccess's P10 section (2), the route fixtures (AppStructure, TuiRender; AppStructure's placeholder floor 63),
  ManufacturingSpecLib's `shopFloorFixture`, `ManufacturingShopFloorFixtures` and the client walk `ManufacturingShopFloorWalk`
  (2, at 390 px), both in `suite.js`.
- Tests run: Mantle ProductionShopFloor (7), and ManufacturingServices, WarehouseProduction, ProductMethods, ProductionQuantities,
  ProductionQuality, ProductionOrders, ProductionCosts, ProductionSchedule, ProductionMaterials, ProductionPolicy,
  ProductionSubcontract, ProductionDowntime, WorkTimeEntries, WorkTimesheets, CommonsToday (122, all pass; no baseline failure
  of the time specs showed in this runtime); BOSS ManufacturingShopFloor (6), AppStructure and TuiRender (21), ManufacturingAccess,
  ManufacturingShell, TodayPanel, ManufacturingWorkOrders, ManufacturingDowntime, ManufacturingMaterials, TuiRender (135),
  TimeEntries, Billing, ClientBilling, ManufacturingSchedule, ManufacturingSubcontracting (31), all pass; the walk
  ManufacturingShopFloorWalk (2, pass). `moqui lint --screens`: only informational anchor rows for the Shop floor screens.
- Decisions:
  - An operation may start once the operations before it have started (overlapping work), and completes only after they have
    completed; the readiness text still says "Waiting for" until they complete.
  - The supervisor's override waives the required skills and, only when asked, the instruction acknowledgment; it is recorded on
    the operation (audit-logged) for every operator of it, and no other check is overridable.
  - The required acknowledgment is the instruction in effect at the release (the template's or the routing operation's), and the
  required evidence (`methodRequiredEvidence`) is asked for at completion, not at start.
  - F96: the coupled output receipt needs STOCK_ISSUE (§2), refused before anything posts with STOCK_ISSUE_REQUIRED and its
    advice; a plain operator records only loss at the output operation. The demo's material handler holds both.
  - Machine runtime follows the policy: none where `machineRuntimeEnumId` is Not recorded, the built-in default (F125).
  - The labor event names its entry by `sourceId` and `timeEntryId` (no foreign key, F129), and freezes the rate at the
    approval; a RateAmount correction reaches a run through P15's review, while a change of what chooses the rate (work type,
    position class, date) or of the entry's operation or run reverses the recording and records it again (review).
  - Pause is the operation's own On hold with its reason and an optional timer stop; a stop of the line is reported apart in
    Downtime (Report stop), which carries the run and operation.
  - ProductionTime is the whole work order's time (no operation filter on the screen), with Projects' submit, approve and reopen.
- Deferred: Home's work list reusing Today's items (F41's "Home's work list reuses it"); the time-log enforcement policy
  (`timeLogEnforcementEnumId` PtlWarn, PtlRequired) at completion; backflush at the policy's operation issue points (P5b named P10
  its caller); the shared-station device credential (CX-DEVICE, §7); WorkOrderDetail Operations' link to the shop floor.
- Findings (provisional):
  - **F124** ProductionOrders.js's `missingSkills` (P5a) and ProductionSchedule.js (P12) read `mantle.party.PartySkill`, which
    is no entity (`mantle.humanres.ability.PartySkill`), so an assignment's or a schedule's skill check errored once a template
    had a skill standard. Fixed in both.
  - **F125** The built-in ProductionMachineRuntime default is Not recorded, so `record#MachineRuntime` is refused
    (MACHINE_RUNTIME_OFF) until a policy row records it; the demo's line A row does.
  - **F126** A Projects timer stopped within a minute is discarded (deleted, `stop#Timer`), so a start then an immediate
    completion leaves no time: the specs move a timer's start back, and the walk's fixture records earlier time.
  - **F127** Release copies the run's dates to its operations (F55, F112), so an operation's due date in Today and the queue
    is the run's end until it is scheduled.
  - **F128** (F90, F95) Complete now refuses unreported operations (OPERATION_UNREPORTED); the opt-in completeOnFinalReceipt
    closes them as before.
  - **F129** ProductionCostEvent.timeEntryId was a foreign key to TimeEntry, so a labor event naming it kept a reopened
    week's entry from being deleted (`delete#TimeEntry` runs the reversal, then deletes the entry its events name). The
    review made the relationship `one-nofk`: the events keep the entry's id as their source after it is deleted.
  - **F130** The labor hook runs in the approval's transaction: an entry whose event cannot be computed is logged and passed
    over, but a failure of the event's write would roll back the approval.
  - **F131** For the merge: ProductionServices.xml (`record#ProductionCostEvent`'s `sourceRemoved`, `transition#ProductionOrder`'s
    `closeUnreportedOperations` and its description, the appended section), ProductionCosts.js (the sources and `record`'s
    null event), ProductionQuantities.js (`completeCheck`, `afterReceipt`), ProductionOrders.js (`blockedReasons`, the request
    field, the PartySkill name), ProductionSchedule.js (PartySkill), TimesheetServices.xml, TimeServices.xml,
    WorkEffortServices.xml (`get#UserTodayItems`), the P7 and P8 specs' complete calls; BOSS: Manufacturing.xml (today-source),
    Manufacturing.js, HomeServices.xml, Quantities.xml (the checkbox), BossManufacturingDemoData, BossUsersDemoData,
    ManufacturingSpecLib (routes, `shopFloorFixture`), ManufacturingAccess, AppStructure's floor (62), suite.js and
    docs/ManufacturingImplementation.md. P9 (in parallel) edits ProductionOrders.js and the Components screens.
- **Review (Nov 4).** Findings and fixes:
  - Medium: the labor spec's costing rate lost to BOSS's demo `BOSS_MFG_RATE_RUN` in a runtime with BOSS data (RateAmount names
    no organization; the later started wins), so the labor feature failed there. The spec's rates now start yesterday.
  - Medium: F129 fixed properly rather than leaving `timeEntryId` empty: `ProductionCostEvent`'s TimeEntry relationship is
    `one-nofk` and labor events set `timeEntryId`; a reversal, a deletion and the delete of the reopened week's entry
    tested.
  - Medium: the labor delta covered only an hours change (F35 names work type, position class, from date and work effort
    too): a recording that no longer fits (the frozen rate row no longer matches the entry, or another operation or run) is
    now reversed on its own run and recorded again; an entry moved off a run, or a run whose flag was turned off, still has
    its recorded labor brought to it. The delta's rate and original event are the current recording's (since its net was
    last nothing), not the entry's first event ever.
  - Low: `get#ShopFloorQueue`'s `mine` (Today's source) filtered after the 100 work order limit, so an assignee's
    operations could be missed; it now limits to the user's work orders before the limit.
  - Verified: F124's PartySkill checks had no spec; a new feature covers the assignment's warning and the schedule
    preview's SKILLS conflict, with and without the skill. Machine runtime's Not recorded default stands (P4's policy
    default, consistent with §2's off by default; design TimeAndCost names no default).
  - Left: PmrRequired and the time-log enforcement are not enforced at completion (deferred above); completion does not
    check the operator's assignment (start does); the costing rate takes no currency or organization match (RateAmount has
    no organization).
  - Specs: Mantle ProductionShopFloor (9, pass), WorkTimeEntries, WorkTimesheets, CommonsToday, ProductionCosts,
    ProductionOrders, ProductionQuantities, ProductionQuality, ProductionSchedule (69, pass); BOSS ManufacturingShopFloor,
    ManufacturingAccess, TodayPanel (103, pass).
  - Merge with master (P9): P9's backorder completion of the source and its close-out of a cancelled run with postings
    pass `closeUnreportedOperations` (the backorder or the close-out takes the rest of the work), so OPERATION_UNREPORTED
    does not refuse them. After the merge: Mantle ProductionShopFloor, ProductionChanges, ProductionOrders,
    ProductionQuantities, ProductionQuality, ProductionSchedule, ProductionCosts, WorkTimeEntries, WorkTimesheets,
    CommonsToday (88, pass); BOSS ManufacturingShopFloor, ManufacturingAccess, ManufacturingWorkOrders, TodayPanel,
    AppStructure (placeholders 63), TuiRender (130, pass).

### P11 — Downtime and maintenance

Design §6 Downtime, Equipment, RequestDetail and WorkItemDetail; M6's downtime part; D24.

- **Records and seeds:** `mantle.work.production.ProductionDowntime`, with its correction chain; the request type
  `RqtMaintenance` and the maintenance type `MntTpCorrective` (F18).
- **Maintenance's outage fact** (design Y3), its contract under its names: a minimal `ResourceUnavailability` (the
  asset, kind actual, from and thru, the source downtime) and
  `mantle.work.ResourceBookingServices.record#ResourceUnavailability`, which Maintenance MT-07 later extends with
  bookings, `end#ResourceUnavailability` and corrections.
- **`mantle.work.ProductionServices`:** `store#ProductionDowntime` (open, close, correct), `find#ProductionDowntime`,
  and `request#ProductionMaintenance`: an AssetMaintenance through
  `mantle.product.EquipmentServices.create#AssetMaintenance`, and when wanted a Request linked to the downtime and the
  asset through `mantle.request.RequestServices.link#RequestRecord`, not Commons' same-named service. Recording checks
  `PRODUCTION_OPERATE`, and a correction `PRODUCTION_SUPERVISE`. An equipment-fault downtime on an asset creates one
  ResourceUnavailability, or links the open one for that asset, in the same transaction.
- **Screens:** Downtime (the list, ReportStop, Maintenance); OperationExecution's Pause opens it; EquipmentDetail's
  Request maintenance action and downtime (design §14's missing pane; §4); RequestDetail and WorkItemDetail, Projects'
  shared screens, with the Manufacturing context.
- **Shell:** quick create downtime report.
- **Usable when:**
  - an operator reports an equipment fault on a line with a maintenance request, which makes an AssetMaintenance and a
    linked Request;
  - the fault records one outage for the asset, and a second fault on it links the same outage;
  - closing the downtime leaves the request, maintenance and outage open and starts no timer;
  - a no-material stop suggests no maintenance;
  - a supervisor's correction keeps the original interval and actor.

**Built Nov 3 (P11).**
- Mantle records: `entity/ProductionDowntimeEntities.xml` (new) `mantle.work.production.ProductionDowntime`: organization,
  work center, optional asset, run and operation, status (PdtOpen, PdtClosed, PdtCorrected), the reason code with the
  category, equipment fault and planned stop of the reason row in effect at its start, from and thru, note, revision, the
  reporter and closer, the correction chain (`originalDowntimeId`, `correctionOfDowntimeId`, `supersededByDowntimeId`, the
  corrector and `changeReason`) and its outage, AssetMaintenance and Request, key fields audit-logged.
  `entity/ResourceBookingEntities.xml` (new) Maintenance's minimal `mantle.work.effort.ResourceUnavailability` (design Y3,
  design-maintenance MT-07): kind (ResourceUnavailabilityKind RukActual, RukPlanned for MT-07), asset or facility,
  organization, from and thru, description, `sourceProductionDowntimeId`. Seeds (`data/ProductionDowntimeData.xml`): the
  ProductionDowntime statuses and flow, the kinds, `RqtMaintenance` and `MntTpCorrective` (F18).
- Mantle services: `mantle.work.ResourceBookingServices.record#ResourceUnavailability` (new file; XML Actions): with the asset
  locked, the open actual outage of the asset is linked, else one is created; internal, its caller checks. Appended to
  `ProductionServices.xml` over `ProductionDowntime.js`: `store#ProductionDowntime` (open, close, correct; operation key;
  PRODUCTION_OPERATE or PRODUCTION_SUPERVISE to open and close, PRODUCTION_SUPERVISE to correct; the center, equipment, run,
  operation, reason, interval and revision checks of its description), `find#ProductionDowntime` (PRODUCTION_VIEW, OPERATE or
  SUPERVISE; the user's organizations; filters, paging, display text, what the user may do, and a stop's correction history)
  and `request#ProductionMaintenance` (operation key; an AssetMaintenance through `EquipmentServices.create#AssetMaintenance`
  with AsMntCreated and MntTpCorrective; with createRequest a submitted RqtMaintenance Request at the stop's center with the
  organization as OrgInternal, linked through `RequestServices.link#RequestRecord` to the stop, the equipment, the maintenance
  and the stopped operation or run). An equipment-fault stop of an asset records or links the outage in its transaction;
  closing changes the stop only.
- BOSS: `screen/Manufacturing/WorkCenters/Downtime.xml` (the list with Find, Report stop as the primary action, the selected
  stop's Request maintenance, each row's End stop, Request maintenance for an equipment fault and Correct for supervisors,
  the correction history); `template/ManufacturingDowntime.xml` (the transitions and the ReportStop and Maintenance forms,
  included by Downtime, EquipmentDetail and quick create); `screen/Manufacturing/ReportDowntime.xml`, quick create's
  Downtime report (JSON answer with a link to the stop), behind the new `BOSS_MFG_REPORT_DOWNTIME` artifact group and the root's
  `<quick-create kind="manufacturingReportDowntime">`; EquipmentDetail's Manufacturing context gains Report stop, Request
  maintenance (for its open fault stop when there is one) and a Downtime pane, and `WorkCenters.js` availability reads the
  open outage ("Out of service", blocked); Projects' `Shared/RequestDetail` and `Shared/WorkItemDetail` mounted under
  WorkCenters with the Manufacturing context: the Commons request or task plus a Production box
  (`template/ManufacturingRequestParts.xml`, `ironstone.manufacturing.DowntimeServices` `get#RequestContext` and
  `get#WorkItemContext` over `Downtime.js`), for a maintenance request of the user's plants and its follow-up tasks; a
  production operation is not a follow-up task there (F38) and links to its work order. `Manufacturing.js`: the `downtime`
  record kind (destination Downtime), the P11 link paths, the `downtimeReasons` and `equipment` choices (`get#Choices` takes
  `facilityId`). Demo: line A's closed changeover `BOSS_MFG_DT_1`.
- OperationExecution (P10) does not exist yet: its Pause opens `WorkCenters/Downtime` with `workEffortId`,
  `operationWorkEffortId`, `facilityId`, `assetId` and `_openDialog=ReportStopDialog`, and the report carries the run and
  operation (hidden fields of ReportStopForm); P10 may instead include `ReportStopForm` and the `reportStop` transition with
  its own `reportStopValues`.
- Specs: Mantle `test/work/ProductionDowntime.spec.js` (6 features, about 1 s: the five usable-when items and the refusals,
  spec-local users); BOSS `ManufacturingDowntime` (5, the usable-when items through the screens' calls and pages, and the
  follow-up task), `ManufacturingAccess` P11 section (3: the permission refusals on the same parameters, the other
  organization's reads and choices, quick create and the list with authz enabled), ManufacturingShell's quick-create rows,
  ManufacturingSpecLib's routes (Downtime, ReportDowntime, RequestDetail, WorkItemDetail); client walk
  `ManufacturingDowntimeWalk` (2, with 390 px), added to `suite.js`.
- Tests run: Mantle ProductionDowntime, ManufacturingServices, WarehouseProduction, ProductMethods, ProductionPolicy,
  ProductionCosts (43 features, pass); BOSS ManufacturingDowntime, ManufacturingAccess, ManufacturingShell, AppStructure,
  TuiRender (114, pass), ManufacturingMethods, ManufacturingWorkCenters, WarehouseAccess, WarehouseShell (172, pass), and the
  shared-screen specs Requests, ProjectRequests, WorkItemDetail, WorkItems, Tasks, TodayPanel, QuickCreate,
  AccountingFixedAssets, WarehouseTransfers, WarehouseFacilities, ServerStatic, ClientWrites, Shell (128, pass); the walk
  ManufacturingDowntimeWalk (2, pass). `moqui lint --screens`: no idiom or hazard site in the new or changed screens.
- Decisions:
  - Downtime is `Manufacturing/WorkCenters/Downtime`, not `Quality/Downtime` (design §6 and §1.2 updated): a stop is a work
    center's and its equipment's availability, every Manufacturing user reads it, and operators, who have no Quality area,
    report it. RequestDetail and WorkItemDetail are mounted under WorkCenters too.
  - A stop names an organization's reason code of category PrcDowntime or PrcHold; only an equipment fault with an asset
    records an outage and suggests maintenance (the Request maintenance action of a row). Supervisors may report and close
    stops as well as correct them.
  - A correction keeps the stop's request, maintenance and outage on the new row; it records or links an outage when it
    becomes an equipment fault of an asset and leaves an existing outage to Maintenance.
  - Operation keys: a report's is made per form render; End stop and Correct key on the stop and its revision, and a stop's
    maintenance on the stop, so a double submit answers the first.
  - `record#ResourceUnavailability` is internal for now (no permission of its own), as `record#ProductionCostEvent`; MT-07
    gives it Maintenance's entry point.
- Findings (provisional):
  - **F98** Commons' RequestDetail lets only the request's people (reporter, assignee, customer) comment and add tasks. A
    plant supervisor sees a maintenance request (its facility is theirs) but cannot add its follow-up tasks; the spec adds
    them as the reporter. Triage of maintenance requests (assign, accept, resolve) waits for Maintenance or a Projects
    intake that triages RqtMaintenance.
  - **F99** `_openDialog` does not open a `container-dialog` inside a form-list row in qvt; Downtime answers a report with
    the new stop selected and a top-level Maintenance dialog for it instead.
  - **F100** (resolved in review) A reason's `approvalThreshold` (minutes for a stop) was not applied. The review built it:
    see the review note below. How an unapproved stop counts in OEE and the downtime reports stays P12's and P16's.
  - **F101** A correction does not move or end the outage it carries: MT-07's `correct#` and `end#ResourceUnavailability`
    own that. There is no `find#ResourceUnavailability` yet, so `WorkCenters.js` reads the open outage directly for the
    equipment's availability; P12's load and calendar should read it (with the stops) when they subtract downtime.
  - **F102** The maintenance request's RequestWorkEffort link to the stopped operation makes the operation a row of the
    Commons and Projects request's Tasks or Work tab; F38's guards refuse its changes there, and the Manufacturing context
    links it to its work order instead.
  - **F103** F57's Centers columns (next available, offline reason) are not built; P12 adds them with the load.
- **Review (Nov 3).** Checked against the P11 scope and usable-when items, §2 and the design: the correction chain, the
  permissions and organization checks, the one-outage rule (the asset row locked before the open-outage read), the
  ResourceUnavailability names (design-maintenance MT-07, Y3; internal, allow-remote false), Mantle's
  `create#AssetMaintenance` and `RequestServices.link#RequestRecord`, and the Shared screens' Manufacturing branches (gated
  by `appRoot`). Fixed:
  - Retry under concurrency: close, approve, correct and request#ProductionMaintenance now lock the stop (or the equipment)
    in the service and call `posting.settled`, as the other production verbs do, so a double submit that waited on the lock
    answers the first instead of REVISION_CHANGED or MAINTENANCE_REQUESTED.
  - Downtime's `reportStop` and quick create's ReportDowntime check the equipment and the run or operation through
    `check#Record`, not only the work center (Mantle checked them already).
  - F100 built (the plan does not name it in P11, but the design's Downtime has "supervisors may correct and approve" and
    P4 seeded the threshold): ProductionDowntime keeps `approvalThreshold` from its reason row and sets `approvalRequired`
    when an ended stop is longer; `store#ProductionDowntime` action `approve` (PRODUCTION_SUPERVISE; DOWNTIME_OPEN,
    APPROVAL_NOT_REQUIRED, DOWNTIME_APPROVED); `find#` `needsApproval`, `approvalText` and `canApprove`; Downtime's row
    Approve and the Approval filter (`approveStop` in the template). A correction recomputes the need and is not an approval.
  - Design: RequestDetail and WorkItemDetail routes are WorkCenters' (built), and the Downtime note describes the approval.
  - Specs: Mantle ProductionDowntime gains the approval feature (7); BOSS ManufacturingDowntime gains it (6).
  - Ran: Mantle ProductionDowntime, ManufacturingServices, WarehouseProduction, ProductionPolicy (29, pass); BOSS
    ManufacturingDowntime, ManufacturingAccess, ManufacturingShell, ManufacturingWorkCenters, AppStructure, TuiRender,
    Requests, ProjectRequests, WorkItemDetail, WorkItems, Tasks, AccountingFixedAssets, QuickCreate (199, pass); the walk
    ManufacturingDowntimeWalk (2, pass); `moqui lint --screens` clean for the touched screens.
  - Merge with master (P5a, P6, P13): Mantle merges clean. BOSS conflicts are both-sides appends: AccessServices
    `get#Choices` parameters (keep `productId` and `facilityId`), ManufacturingAccess sections, suite.js walks,
    ManufacturingImplementation.md sections, ManufacturingSpecLib (take master's WorkOrderDetail ProductionCosts route and
    drop this branch's root `ProductionCosts`/`moved`, then add P11's routes and mounts), and ManufacturingShell's quick
    kinds: plan and admin get `manufacturingWorkOrder`, operate, supervise and admin `manufacturingReportDowntime` (the admin
    both, by sequence 85 then 95). Quick create screens differ in place (P5a's `WorkOrders/QuickCreate`, P11's root
    `ReportDowntime`); both are behind their own artifact groups, which is consistent enough to leave.

### P12 — Scheduling and capacity

Design §7 ProductionSchedule and Capacity, §3 Operations' Reschedule; M5, the scheduling part of M10, and M11.

- **`mantle.work.ProductionPlanningServices`:** `get#ProductionSchedule`; `schedule#ProductionOperation`
  (`PRODUCTION_SCHEDULE`), a preview, then a commit that rechecks calendar, skills and equipment, capacity,
  predecessors, quantity and version, with a conflict override only by `PRODUCTION_SUPERVISE`; and
  `get#WorkCenterLoad` completed with the calendar, downtime and bookings.
- **M11:** the Projects WorkItems Timeline component extended with resource lanes, offline shading and a preview-only
  drag, whose commit is the Move form (F4). Projects' own Timeline keeps its behavior and specs.
- **Screens:** ProductionSchedule, the `.qvue` timeline with its `tui` twin (Preview, Apply, Unschedule, Show
  conflicts); Capacity (Parameters, Load); Operations' Reschedule; FacilityDetail's offline change with its preview.
- **Approvals and outputs:** the schedule override topic; the schedule-change notice; the plan snapshot print and CSV.
- **Usable when:**
  - a scheduler drags an operation to the second line, sees the conflict in the preview, and commits through the Move
    form;
  - an override needs a supervisor and changes no capacity;
  - an offline interval on a line previews the operations it moves;
  - Capacity shows nominal, calendar-adjusted, downtime, booked and available hours, and names missing data;
  - the terminal twin makes the same move.

**Built Nov 3 (P12).**
- Mantle records (`entity/ProductionScheduleEntities.xml`, new): WorkEffort `scheduleRevision` (an operation's, audit-logged)
  and `mantle.work.production.ProductionScheduleChange` (an operation's move or unschedule, applied or requested: from and to
  center and dates, the revisions it was made at, reason, conflicts JSON, `overrideApplied`, requester and decider).
  `data/ProductionScheduleData.xml` (statuses SchApplied, SchRequested, SchRefused; kinds SckMove, SckUnschedule) and
  `ProductionScheduleNotificationData.xml` (topics ProductionScheduleOverride, an approval decided on the schedule, and
  ProductionScheduleChange).
- Mantle services (`ProductionPlanningServices.xml`): `ProductionCalendar.js` (new) is a center's time: work hours from its
  calendar's WetAvailable efforts expanded by `get#EventInstances`, less the holidays of its calendar and organization; offline
  intervals from its stops (not corrected; an open stop until now) and the ResourceUnavailability of the center or equipment
  located at it (an open outage to the range's end, F101); slots, efficiency, an operation's standard hours, the open
  operations, the end of given hours over free time and the next free time. `get#WorkCenterLoad` (`ProductionPlanning.js`)
  completed: per center and period (range, day or week) nominal, calendar-adjusted, downtime, available and booked hours
  (prorated over the work hours of each operation's dates: P3's open item), overload, utilization, missing data, next
  available and the offline reason; `loadHours` is the booked hours. New over `ProductionSchedule.js`:
  `get#ProductionSchedule` (lanes with closed, holiday and offline times; operations with predecessors, lock, revisions and
  current conflicts; unscheduled; conflicts; override requests; rights), `schedule#ProductionOperation` (preview, apply,
  unschedule, request, approve, refuse; the refusals and conflicts of the design note; operation key; the operation's and the
  run's expected revisions) and `store#WorkCenterOffline` (preview of the operations a block moves, apply with or without
  the moves, withdraw). F82: SupplyPlanning's routing lead time counts each operation's hours in its center's work hours a
  day (the week's average by its calendar; 24 without one).
- BOSS: `Planning/ProductionSchedule` (Projects' `Timeline.qvue` in a new resource mode: lanes, shading, bars by hour,
  predecessor arrows, a preview-only drag that opens the Move dialog, the dialog's Preview, Apply, Request override and
  Unschedule, Show conflicts, the override requests with Approve and Refuse; the work-item modes are untouched),
  `Planning/ProductionScheduleTui` (its terminal twin: the resource and date table, Move with the same preview and
  commands, Show conflicts, Decide override), `Planning/ScheduleSnapshot` (the plan snapshot print, CSV of its operations),
  `Planning/Capacity` (Parameters, Load by period with CSV, missing data); `template/ManufacturingSchedule.xml` (the move
  transitions and the MovePreview section); WorkOrderDetail Operations' Reschedule (a row dialog that previews; the preview
  box applies, requests or unschedules); FacilityDetail's Work center tab (the completed load, Offline times, Take offline
  with its preview, Withdraw); Centers' Available hours, Next available and Offline reason (F57, F103). Manufacturing.js P12
  block (the `scheduleChange` record kind and the routes); the topics on the root and in Approvals, with their links
  (BossSetupData).
- Specs: Mantle `test/work/ProductionSchedule.spec.js` (6 features, about 1.5 s: the load by day, the override request and
  approval with unchanged capacity, the refusals and conflicts, the offline preview, move and withdraw, the schedule's lanes
  and unschedule, the work hours a day of F82). BOSS `ManufacturingSchedule` (6: the usable-when items through the screens'
  transitions and pages), `ManufacturingScheduleFixtures` (the walk's runs), ManufacturingAccess's P12 section (3),
  ManufacturingSpecLib's `scheduleFixture` and routes; client walk `ManufacturingScheduleWalk` (3, with 390 px).
- Tests run: Mantle ProductionSchedule, WorkCenters, SupplyPlanning, ProductionOrders, ProductionDowntime,
  ManufacturingServices, WarehouseProduction, ProductMethods (67 features, pass); BOSS ManufacturingSchedule,
  ManufacturingScheduleFixtures, ManufacturingAccess, AppStructure, TuiRender, ManufacturingWorkCenters,
  ManufacturingWorkOrders, ManufacturingShell, ManufacturingDowntime, ManufacturingPlanning, TimelineWalk, ProjectsTui,
  ServerStatic (160 features, pass); walks ManufacturingScheduleWalk and ManufacturingWorkCentersWalk (6, pass), and a
  one-off browser check that Projects' Timeline still draws its work items. `moqui lint --screens`: no flagged site in the
  new or changed screens (informational anchors only).
- Decisions:
  - Refusals are never overridden (qualification, started work, dates, revisions); calendar, offline, capacity,
    predecessor, successor, equipment and skills conflicts are, by PRODUCTION_SUPERVISE with a reason. Moving needs
    PRODUCTION_SCHEDULE; deciding a request needs PRODUCTION_SUPERVISE only, so the BOSS supervisor (no SCHEDULE) decides
    requests and the administrator may override at once.
  - "Quantity and version" are the run's revision (its quantity and method) and the operation's schedule revision.
  - A stop or outage takes the whole center; an open stop counts until now, an open outage until the range's end; a stop
    awaiting approval counts as downtime and is named (F100).
  - An operation with no dates counts whole in the load's first period, named; Unschedule clears its dates.
  - A planned offline block is a ResourceUnavailability RukPlanned of the facility, written by store#WorkCenterOffline (the
    minimal record; Maintenance MT-07 adopts it); recording needs PRODUCTION_SCHEDULE or METHOD_RESOURCES, the moves
    PRODUCTION_SCHEDULE, each its own schedule#ProductionOperation.
  - The schedule-change notice goes to the run's people, else the organization's supervisors; a refusal notifies no one.
- Findings (provisional):
  - **F110** A center's recurring work hours expand in the viewing user's time zone (the BOSS demo shift's recurrence has
    no `timeZone`), so users in two zones see a plant's shift at different wall times, and the BOSS spec reads the shift's
    start in the scheduler's zone. A plant calendar should carry its zone (WorkEffortRecurrence.timeZone, or a plant zone).
    Review: holidays now start in `Calendar.timeZone`; the demo data's zone is still open.
  - **F111** A transition that answers JSON must call a Mantle verb that may refuse in a new transaction
    (`requireNewTransaction`): a refusal marks the transition's transaction rollback-only and the screen answers an
    exception, not the JSON.
  - **F112** Release still copies the run's dates to every operation (F55), so a released run's operations overlap and
    show predecessor conflicts until they are scheduled; release places nothing forward by the center's scheduling policy.
    The offline change's forward placement is the only automatic one; a finite proposal is FiniteSchedule's (later).
  - **F113** A refused override request leaves the requester no notice (it leaves the schedule's request list);
    Capacity's list pages by work center (the service's center paging set on its rows); "include tentative" is not offered
    (drafts have no operations); the terminal Move was verified by server renders and transition posts, not in the
    `moqui tui` client.
  - F57 and F103 (Centers' columns), F101 (the load reads stops and outages) and F82 (lead time on work days) are done.
- Review (Nov 3): checked the commit's rechecks (refusals never overridden; conflicts only with PRODUCTION_SUPERVISE and a
  reason, recorded on the change, no capacity written), both revisions and the operation key on every write, the request,
  approve and refuse flow and its topics and recipients (F40), the offline block as a RukPlanned ResourceUnavailability of
  the facility, the JSON transitions' new transactions (F111, used throughout) and the Timeline's work-item modes.
  Fixed in Mantle: get#WorkCenterLoad prorated an operation that runs past the range over only its work hours inside the
  range (the calendar was read for the range alone), so it counted whole; the calendar is now read over the operation's
  dates. F110 partly fixed: a holiday's day now starts in the calendar's zone (`Calendar.timeZone`, else the user's); a
  recurring shift already expands in its recurrence's zone, which the calendar services write. The BOSS demo shift and
  calendar still carry no zone (seed data), so they read in the viewer's zone; giving them a plant zone needs
  ManufacturingSchedule's clock reads in that zone. New Mantle feature (7 now): the part of an operation inside the range
  and a zoned holiday. Reran Mantle ProductionSchedule, WorkCenters, SupplyPlanning (24); BOSS ManufacturingSchedule,
  ManufacturingAccess, ManufacturingWorkCenters, ProjectsTui, ServerStatic, TimelineWalk, AppStructure, TuiRender (125);
  walk ManufacturingScheduleWalk (3): all pass.
- For the merge: shared files touched append-only where possible: `ProductionPlanningServices.xml` (header and
  get#WorkCenterLoad changed, three services appended), `SupplyPlanning.js` (`leadDaysOf`), `Manufacturing.js` (P12 block),
  `Manufacturing.xml` (two topics), `Approvals.xml` (topic list), `BossSetupData.xml` (two links at the end),
  `ManufacturingSpecLib.js` (P12 routes; `scheduleFixture` and the export line), `ManufacturingAccess.spec.js` (P12
  section), `suite.js` (the walk and fixture), WorkOrderDetail's `Operations.xml` (P5b and P7 may edit it), FacilityDetail's
  `WorkCenter.xml`, Centers and Projects' `Timeline.qvue`.

### P13 — Supply planning

Crosscut CX-PLANNING and §3.20, with design §7 SupplyPlanning (§4). These are a shared contract: crosscut's record
and service names, and `Shared/SupplyPlanning`, which Purchasing mounts when it is built and Warehouse from its §7.

- **Records:** `mantle.request.requirement.PlanningRun`, `PlanningSuggestion` and `RequirementSupply`. A
  requirement's organization (R-SA-15) is a RequirementParty in the OrgInternal role, not a new field
  (impl-drawers-commons §4); `Requirement.quantityUomId` (crosscut §3.20).
- **`mantle.product.SupplyPlanningServices`:**
  - `run#SupplyPlan`, under `SUPPLY_PLAN_RUN`: one current run per organization and facility set; it nets
    `get#InventoryProjectedInfo`, drafts' WeptConsume and WeptProduce rows included, by the run's line and its parent
    warehouse, with kit assemblies told apart from production (F16); it explodes make demand through
    `get#BomExplosion`'s requirements and nets level by level (§4, Q8; F24): a non-phantom sub-assembly nets against
    its own stock and supply before its shortage is exploded, and a phantom is blown through; it dates releases from
    the version's lead and preparation days (R-MFG-31), shows held receipts and output as a pending-release line with
    the inspection's due date, left out of netting (§4), and calls `check#ProductUsable`;
  - `get#SupplyPlan`, and `store#PlanSchedule` under `SUPPLY_PLAN_RUN`, the one schedule. The schedule carries the
    organization's option to net held quantity whose inspection is due within the lead time (§4); off by default;
  - `convert#PlanningSuggestions`: make through `create#ProductionOrder`, under `PRODUCTION_PLAN`, with the method as
    of the plan date, the RequirementSupply link and WorkRequirementFulfillment `WrfDelivers`, under lock and
    operation identity, a result per group. P14 adds the outside-processing buy conversion; ordinary buy and transfer
    suggestions are shown with their links, and their conversion waits for Purchasing and Warehouse (§7).
- **Screens:** `Shared/SupplyPlanning` (PlanParameters, PlanSuggestions, DemandSupply, PlanSchedule,
  ConvertSuggestions) with the Manufacturing row of crosscut §3.20, at `Manufacturing/Planning/SupplyPlanning`. Home's
  shortages open it with the same organization, plant and date.
- **Usable when** (design §10.3, shortage to finished stock):
  - a sales demand for DEMO_1_1 yields a make suggestion and a buy suggestion for its component;
  - converting the make suggestion creates a draft run with its RequirementSupply and lines, and a second conversion
    of the same demand answers the existing run;
  - a stale run is refused conversion until recalculated, and an obsolete product is an exception.

**Built Nov 3 (P13).**
- Mantle records (`entity/SupplyPlanningEntities.xml`, a new file): `PlanningRun` (organization, facility set key, plan
  date, horizon, time fence, freshness limit, whether held stock was netted, `isCurrent`, revision, superseded by, counts,
  findings), `PlanningRunFacility`, `PlanningSuggestion` (requirement, product, facility, method PsmMake/PsmBuy/PsmTransfer,
  state PssProposed/Partial/Converted/Exception/Superseded, net, gross and available quantity, pending-release quantity
  and date, required and release dates, lead and preparation days, level, parent suggestion, BOM, routing, supplier or
  source facility, exception code and message, warnings, provenance JSON), `RequirementSupply` (RstProductionRun,
  RstPurchaseOrder, RstPurchaseRequest, RstTransfer; quantity, operation key, dated) and `PlanSchedule` (one per
  organization, audit-logged); `Requirement.quantityUomId`. The organization is a RequirementParty OrgInternal row.
- `mantle.product.SupplyPlanningServices` over `SupplyPlanning.js`:
  - `run#SupplyPlan` (SUPPLY_PLAN_RUN): under the organization's lock, supersedes the current run of the facility set
    (its open suggestions PssSuperseded; their still-proposed requirements reused for the same facility and product, the
    rest RqmtStRejected). Each facility of the set nets with the facilities under it (its lines). Demand: open firm sales
    lines less cancelled, issued and reserved-against-stock (a kit's line as its kit components'), each production run's
    remaining WeptConsume (drafts too), the minimum stock and the planned makes of the level above; supply: available
    stock, remaining WeptProduce and open purchase lines; a kit assembly run's rows are shown, not netted; held
    (quarantined) stock is a pending-release line with its inspection's due date, netted only by the schedule's option
    when due within the lead time. Levels from each product's structure (the deepest parent plus one), each product netted
    once; a shortage is a transfer from another facility of the set with a surplus, else make (released BOM; its
    `get#BomExplosion` requirements, stopping at non-phantom sub-assemblies and blowing phantoms through, become the next
    level's demand at its release date), else buy (a current purchase price of another party), else NO_SOURCE. Release
    date = required date less the BOM's lead and preparation days, or with PltRouting the routing's standard hours as
    days of 24 hours rounded up; LATE_RELEASE and INSIDE_TIME_FENCE warn. `check#ProductUsable` (Replenish, Produce,
    Purchase) gives PRODUCT_NOT_USABLE; a cycle BOM_CYCLE, an explosion finding METHOD_INVALID, several released BOMs
    METHOD_AMBIGUOUS. Horizon and fence from the schedule or the production policy (P4).
  - `get#SupplyPlan` (SUPPLY_PLAN_RUN, PRODUCTION_PLAN or PRODUCTION_VIEW): the given or current run with stale (superseded
    or past the freshness limit) and its reason, the suggestions with covered and remaining quantity, supply links and
    `canConvert`, the held lines, a selected suggestion's demand and supply, the schedule and the user's actions.
  - `store#PlanSchedule` (SUPPLY_PLAN_RUN) and `run#ScheduledSupplyPlans` with the `run_ScheduledSupplyPlans` job
    (`data/SupplyPlanningSetupData.xml`, every 15 minutes): each due active schedule runs as the user who last kept it,
    one failure named on its schedule.
  - `convert#PlanningSuggestions` (PRODUCTION_PLAN for make): each suggestion its own transaction
    (`convert#PlanningSuggestion`, key `operationKey/suggestion`): the requirement locked; covered already answers its
    run (EXISTING, whoever covered it); otherwise PLAN_STALE, SUGGESTION_EXCEPTION, SUGGESTION_CLOSED and
    PRODUCT_NOT_USABLE are refused, then `create#ProductionOrder` for the remaining quantity (method as of the plan date
    or the given date, on the routing's last work center under the facility, else its only work center, else the
    facility, with the requirement and its single sales line), RequirementSupply, WorkRequirementFulfillment WrfDelivers,
    the requirement Approved then Ordered, the suggestion PssConverted. Buy and transfer: METHOD_NOT_CONVERTED.
- BOSS: `Shared/SupplyPlanning` (PlanParameters as Recalculate, PlanSchedule as Schedule, PlanSuggestions with a filter and
  the row selection's Convert (ConvertSuggestions), Held for inspection, DemandSupply for the product link chosen), taking
  `appRoot`, its Manufacturing branch checking `ironstone.manufacturing.AccessServices` (`get#SharedContext` with the
  plant, `check#Record` facility with `supplyPlan` or `plan`) before the Mantle verb; mounted as `Planning`'s default tab
  at `Manufacturing/Planning/SupplyPlanning`. A converted suggestion links its work order to Home's lookup until
  `WorkOrders/WorkOrderDetail` is in sharedLinks (P5a), then to it. `Manufacturing.js` P13 block: the route and the
  `planningMethods` choice. Home's Due work and shortages box links Supply planning for SUPPLY_PLAN_RUN holders with the
  plant; P5b's shortage rows link it the same way (the hook is commented in Home.xml).
- Specs: Mantle `test/product/SupplyPlanning.spec.js` (9 features, about 9 s): make, sub-assembly and buy suggestions
  with levels, the lead-time release date, the phantom blown through, the kit's demand and the kit run not netted,
  pending release; obsolete and no-source exceptions; demand and supply; conversion with its run, lines,
  RequirementSupply and WrfDelivers, the second conversion EXISTING and buy refused; permissions and the other
  organization; a new run netting the draft on the line, superseding and PLAN_STALE; the held-quantity option on and off;
  a transfer between two facilities; the scheduled run. BOSS `ManufacturingPlanning` (4: the usable-when items through the
  screen and its transition), `ManufacturingPlanningFixtures` (the walk's demand), ManufacturingAccess's P13 section (2),
  ManufacturingSpecLib's `planningFixture` and routes; the walk `ManufacturingPlanningWalk` (3, with 390 px).
- Tests run: Mantle SupplyPlanning, ManufacturingServices, WarehouseProduction, ProductMethods, ProductionPolicy,
  ReportLookups (47 features, pass); BOSS ManufacturingPlanning, ManufacturingPlanningFixtures, ManufacturingAccess,
  ManufacturingShell, ManufacturingWorkCenters, AppStructure, TuiRender, WarehouseProductionFixtures, WarehouseAccess
  (246 features, pass); the walk ManufacturingPlanningWalk (3, pass, also on a rerun over the kept database).
  `moqui lint --screens`: no flagged site in the changed screens (informational anchors only). No `ss-inventory.md` row
  maps to SupplyPlanning; `usl-inventory.md` gained the five services.
- Decisions:
  - Netting reads the sources `get#InventoryProjectedInfo` sums from the entities, in the run's transaction, rather than
    calling it (F76); the formula is the same (available − open demand not reserved − remaining consumption +
    remaining output), plus open purchase lines and the minimum stock.
  - One requirement per facility and product while it is only proposed: a later run reuses it, so a requirement's
    identity (and its RequirementOrderItem lines) survives recalculation; one no longer needed is rejected, never deleted.
  - The held-quantity option is the schedule's only (not a run parameter), as §4 has it; it applies to a manual run too.
  - A transfer suggestion comes only from the surplus of another facility of the same run's set.
  - The schedule runs as the user who last kept it, with that user's permissions, so no system path skips the checks.
  - Readers are SUPPLY_PLAN_RUN, PRODUCTION_PLAN or PRODUCTION_VIEW holders (`readPermissions`, which Purchasing and
    Warehouse extend with their view permissions); converters by method in `convertPermissions` (P14 adds the
    outside-processing buy).
  - F27: Product360's Replenishment suggestions are not P13's. That tab is the Warehouse context; it reads
    `get#SupplyPlan` with `productId` when Warehouse mounts SupplyPlanning (§7).
- Findings (provisional):
  - **F76** `get#InventoryProjectedInfo` reads the search index (available in specs on the Postgres search backend, but
    filled by the data feed after commit, so a spec must index by hand). It is not called: the index lags the commit, so
    a run just converted would be suggested again; its run documents carry no purpose, so kit assemblies cannot be told
    apart; it files a run under its facility's parent, so a run on the warehouse itself is missed; it counts every sales
    line not completed, quotes and carts too, and no purchase supply. Design §7 SupplyPlanning and crosscut §3.20 now
    say netting reads those sources directly.
  - **F77** `create#ProductionOrder` takes `planningSuggestionId` but stores only `demandRequirementId` (and the
    order line); the suggestion's run is RequirementSupply's `workEffortId`, with its `planningSuggestionId`.
  - **F78** `create#ProductionOrder`'s operation key is scoped per user (StockPosting `storedKey`), so it cannot keep
    two users from covering one demand; the requirement's lock and covered quantity do.
  - **F79** No supplier lead time exists to date a buy suggestion; its release date is its required date until
    Purchasing adds supplier lead times (impl-purchasing).
  - **F80** A kit assembled for an open order has issued its components (stock is lower) while its order is still
    demand, so the components count twice until the order ships; kit assemblies are made at packing, so the window is
    short. Left.
  - **F81** In a form-list row, a link to `.` carries the row's field of the same name as a screen parameter
    (`methodEnumId`), which made Explain filter the list to the row's method; the link passes the filter values
    explicitly (an empty value clears).
  - **F82** The routing lead time (PltRouting) is the standard hours as days of 24 hours, rounded up, until P12
    brings the work calendar; the time fence only warns (INSIDE_TIME_FENCE).
  - **F83** `ManufacturingPlanningFixtures` runs in the whole mr-boss suite as Warehouse's fixtures do, adding a
    Retail sales order of its own product at ZIRET_WH (a new order id per load, since the walks' database outlives a
    run, F60).
- **Review (Nov 3).** Fixed (mr-mantle `Manufacturing P13 review` commit, BOSS screen in this one):
  - (high) A sales line's reservation was subtracted less its unavailable part, which reserve#AssetForOrderItem already
    leaves as a negative available to promise, so a backordered quantity counted twice (10 ordered on 6 in stock planned
    8); the whole reservation not issued is subtracted now, as `get#InventoryProjectedInfo`'s orderNotReserved does.
  - (medium) A kit's line subtracted its components' reservations (component units) and its own issuances from the kit
    quantity; issuances are now taken in kit units and reservations from each component's demand.
  - (medium) Transfers in transit were not supply: the origin's stock leaves its available to promise at issue, so a
    transfer on its way to a planned facility was suggested again. Each ShpTpTransfer line to a facility of the node now
    counts its issuances less its receipts (accepted and rejected) as supply ("Transfer in transit").
    `get#InventoryProjectedInfo` counts no transfer.
  - (medium) `run#ScheduledSupplyPlans`: a schedule whose user could not sign in (disabled, terminated, password to
    change) left the login's error on the job's messages, so the next write threw and the whole job failed and rolled
    back, every 15 minutes, with no message kept; the login is in its own error frame now (SCHEDULE_USER_UNAVAILABLE on
    that schedule, the others run), and the job logs out after the last schedule when it had no user of its own.
  - (low) `Shared/SupplyPlanning` showed Recalculate, Schedule and Convert from Mantle's answer only; on the Manufacturing
    mount they also need the context's server-derived capabilities (`supplyPlan`, `plan`) its transitions check.
  - Specs: SupplyPlanning gained the reservation-and-transfer and the schedule-user features (11, pass; both fail
    without the fixes); ManufacturingPlanning and ManufacturingAccess (61, pass); the walk ManufacturingPlanningWalk (3,
    pass); `moqui lint --screens` informational only.
  - Left: the identity of a scheduled run is the user who last kept the schedule. It re-checks that user's
    SUPPLY_PLAN_RUN and organization at run time, but the run stops (named on the schedule) when that user is disabled,
    leaves or must change a password, and whoever saves the schedule takes it over; a planner should re-save it then.
    The Warehouse kit assembly (WepAssembling) is not shown with the kit runs; a transfer line not yet issued is
    neither demand nor supply (its stock is still at the origin).

### P14 — Subcontracting

Design §7 SubcontractOperations, SubcontractDetail, Supplier360, OrderDetail and ShipmentDetail; crosscut
CX-SUBCONTRACT; review §4.1 steps 26–31.

- **Records:** `ProductionSubcontract`.
- **`mantle.work.ProductionServices`:** `request#SubcontractService` (`PRODUCTION_PLAN`; an `RqTpProduct` Requirement
  for the service product, with a RequirementSupply demand link to the operation), `store#ProductionSubcontract`,
  `get#SubcontractMaterials`, `get#SubcontractStatus` and `find#SubcontractOperations`. P16b's
  `receive#SubcontractOutput` gains the outside-processing accrual event at service acceptance; the bill match writes
  the price-variance event through Accounting's match, `mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch`.
- **Accounting's contract** (PUR-MATCH): `evaluate#InvoiceMatch` reads ServiceAcceptance under the match policy's
  service-acceptance rule, so a service line matches against its accepted quantity (Accounting P7 left it;
  impl-accounting §7). Purchasing P6 checks it is there.
- **The outside-processing buy conversion** (§4), in P13's `convert#PlanningSuggestions`, to design-purchasing's
  Subcontracting and SupplyPlanning rules (R-PUR-22): a draft PO per supplier group, with the service OrderItem at the
  requirement's quantity and unit and the supplier price from Products' resolver, its `OrderItemWorkEffort` to the
  operation (`requiredWork` Y), and a RequirementSupply row. Conversion never places or approves the PO; that stays
  Purchasing's, and until Purchasing is built the walk's demo service places it.
  - The conversion checks `PURCHASE_ORDER_EDIT` (Warehouse P7 seeded it). P14 seeds `SUPPLIER_PROFILE_EDIT` in
    mr-mantle; `PAYABLE_IMPORT` and `RETURN_AUTHORIZE` exist. BossSetupData grants `PURCHASE_ORDER_EDIT` to
    `BOSS_PURCHASING_BUYER`, seeded here without Purchasing's launcher, as Products P1 seeded the other apps' groups,
    with three of the group's other permissions (`PAYABLE_IMPORT`, `SUPPLIER_PROFILE_EDIT` and `RETURN_AUTHORIZE`),
    and all four to `BOSS_PURCHASING_ADMIN`; Purchasing P1 adds `SUPPLIER_SCORECARD_EDIT`. The action shows on the
    Manufacturing mount to a holder of that group, which crosscut §3.20's Manufacturing row gains.
- **Screens:**
  - SubcontractOperations and SubcontractDetail (Agreement, Materials, Acceptance);
  - Supplier360: Products' screen with the Manufacturing row of crosscut §3.3, its subcontract orders filtered (design
    §14's pane; §4);
  - OrderDetail: Projects' screen with the Manufacturing row of crosscut §3.6, its items showing production and
    subcontract links;
  - ShipmentDetail: Accounting's screen with the Manufacturing row of crosscut §3.8, read only.
- **Outputs:** the dispatch and return instructions.
- **Usable when** (Warehouse's subcontract walk, from the Manufacturing side):
  - a planner requests outside processing for an operation, and a buyer's conversion on the Manufacturing mount makes a
    draft service PO line with OrderItemWorkEffort and RequirementSupply; the planner cannot convert it, and a second
    conversion answers the same line;
  - components dispatched to the vendor-custody facility stay the organization's;
  - the output receipt issues the components, holds the output, accepts the service line once and writes the accrual
    event once; the supplier's bill matches against the accepted quantity and writes the price variance;
  - a run reader without the buyer grant sees no PO price.

**Built Nov 3 (P14).**
- Mantle records (`entity/ProductionSubcontractEntities.xml`, `data/ProductionSubcontractData.xml`, new files):
  `mantle.work.production.ProductionSubcontract` (organization, run, operation, requirement, supplier, service product,
  quantity and unit, required date, lead time, vendor-custody facility, price basis note, the purchase line once converted,
  status PscRequested → PscOrdered, revision; key fields audit-logged); RequirementSupply type `RstOperationDemand` (the
  demand link to the operation, which covers nothing: `coveredOf` leaves it out); planning method `PsmOutside` (outside
  processing); cost event types `PcetOutsideAccrual` and `PcetOutsideVariance` (component PrcOutside, awaiting the close);
  `InvoiceMatchPolicy.serviceAcceptanceRequired` (the service-acceptance rule, Y by default, `store#MatchPolicy` takes it);
  `SUPPLIER_PROFILE_EDIT` in MantleSetupData.
- Mantle services (`ProductionSubcontracts.js`, appended to `ProductionServices.xml`): `request#SubcontractService`
  (PRODUCTION_PLAN, operation key: the subcontract, an RqTpProduct Requirement of the service at the run's facility with its
  OrgInternal and Supplier parties, the RstOperationDemand link, and the request put into the organization's current plans
  covering the facility; refuses a run not released, an operation already subcontracted or on a service line, a non-service,
  a non-supplier, a facility not in custody or not the supplier's), `store#ProductionSubcontract` (the planner's fields before
  the order, then only lead time, vendor facility and the buyer's price note; revision, SUBCONTRACT_ORDERED),
  `get#SubcontractMaterials` (components with owner, sent, at the supplier, consumed, returned; the dispatches and returns),
  `get#SubcontractStatus` (agreement, service lines with accepted, billed, remaining and match exceptions, output receipts
  with their hold, state, outside cost events), `find#SubcontractOperations` (the worklist, paged), `get#SubcontractOrder`
  and `get#SubcontractShipment` (OrderDetail's and ShipmentDetail's Manufacturing reads). Prices (unit, amount, price note)
  only for `PURCHASE_ORDER_EDIT`, `SUPPLIER_PRICE_VIEW`/`EDIT` or `ACCOUNTING_VIEW`; cost amounts only with ACCOUNTING_VIEW.
- `receive#SubcontractOutput` records the accrual event of its ServiceAcceptance (accepted quantity × order price,
  PclAwaitingClose) through `record#ProductionCostEvent`, whose sources table gained ServiceAcceptance and
  InvoiceMatchLine (`ProductionCosts.js`, two lines); a retry answers the first, so the accrual is written once.
- Accounting's match (`InvoiceMatch.js`): a PtService line's base on the received basis is its ServiceAcceptance total
  (MISSING_RECEIPT "no accepted service" without), ordered with the rule off; proposals take it too; `apply#InvoiceMatch`
  records the price variance ((bill unit − order unit) × matched quantity) of a line whose order item has an
  OrderItemWorkEffort to a production run, in its transaction.
- Supply planning (`SupplyPlanning.js`): `convertPermissions.PsmOutside = PURCHASE_ORDER_EDIT`, readers gain it;
  `run#SupplyPlan` writes a PsmOutside suggestion for each open outside-processing requirement under the set (never netted,
  never rejected at supersede); `planOutside` adds or updates it in the current runs; `convertOutside`: one draft (OrderOpen)
  PO per supplier in the call, the service OrderItem at the requirement's remaining quantity and unit and the resolver's
  supplier price (`get#ProductPrice` with the organization as buyer; PERMISSION_DENIED without supplier-price read,
  PRICE_UNAVAILABLE), OrderItemWorkEffort to the operation with requiredWork Y, RequirementSupply RstPurchaseOrder, the
  requirement Ordered, the subcontract PscOrdered; never placed or approved; a second conversion answers EXISTING with the
  line. The currency is the organization's (or an ancestor's) accounting preference.
- BOSS: `BOSS_PURCHASING_BUYER` (seeded without Purchasing's launcher) with PURCHASE_ORDER_EDIT, PAYABLE_IMPORT,
  SUPPLIER_PROFILE_EDIT and RETURN_AUTHORIZE, all four to BOSS_PURCHASING_ADMIN (and SUPPLIER_PRICE_VIEW to both, review); the buyer's authz on BOSS_MFG_PLANNING and
  BOSS_MFG_SUBCONTRACTING; the demo buyer `manufacturing.buyer` (BOSS_MANUFACTURING, _READ and BOSS_PURCHASING_BUYER); Ziddleman's price of BOSS_WH_COATING (BossWarehouseDemoData, after the
  product). Manufacturing.js P14 block: the `buy` capability, the routes, choices `subcontractOperations`,
  `serviceProducts`, `suppliers`, `vendorFacilities`. Screens: `Subcontracting` (placeholder replaced),
  `Subcontracting/SubcontractOperations` (worklist, New outside processing), `SubcontractDetail` (header with state and
  More; Agreement, Materials, Acceptance; Edit agreement), `SubcontractInstructions` (the dispatch and return instructions,
  html-print, no cost), `template/ManufacturingSubcontractParts.xml` (requestService, storeSubcontract, the OrderDetail and
  ShipmentDetail sections); Shared/Supplier360's Manufacturing branch (`SubcontractServices.get#SupplierContext`, the
  Subcontract orders tab, Conversation; Products & prices left out), Shared/OrderDetail and Shared/ShipmentDetail's
  Manufacturing branches (read only), Shared/SupplyPlanning's buyer conversion on the Manufacturing mount (Convert per
  method and capability; the PO link). `DemoServices.place#SubcontractOrder` places a draft service PO for the walk.
- Specs: Mantle `test/work/ProductionSubcontract.spec.js` (8 features, about 2 s of features): request and refusals; the
  buyer's conversion to one PO of two lines, planner refused, second EXISTING, replanned not suggested or rejected; store
  rules; dispatch stays the organization's; output receipt with hold, acceptance once and accrual once; bill match against
  accepted quantity with the variance event; price reads; the rule off. WarehouseProduction's subcontract feature now checks
  the accrual. BOSS `ManufacturingSubcontracting` (5), ManufacturingAccess's P14 section (2), the route fixtures,
  `ManufacturingSubcontractFixtures` and the walk `ManufacturingSubcontractWalk` (4, with 390 px) in suite.js.
- Tests run: Mantle ProductionSubcontract, SupplyPlanning, AccountingMatching, WarehouseProduction, ManufacturingServices,
  ProductionCosts, ProductMethods, WarehouseTransfers (71 features, pass after WarehouseProduction's accrual check); BOSS
  ManufacturingSubcontracting, ManufacturingAccess, AppStructure, TuiRender, ClientIsolation, ManufacturingPlanning,
  ManufacturingShell, ManufacturingWorkOrders, ProductsSuppliers, AccountingCollections, AccountingPayables, ClientBilling,
  WarehouseAccess, WarehouseReceiving, WarehouseTransfers, WarehousePicking, WarehouseShell (362 features, pass); walks
  ManufacturingSubcontractWalk (4) and ManufacturingPlanningWalk (3), pass. `moqui lint --screens`: the new screens show only informational anchor rows. No
  `ss-inventory.md` row maps to Subcontracting; `usl-inventory.md` gained the seven services and the match notes.
- Decisions:
  - The outside-processing request is a planning suggestion of its own method (PsmOutside), not PsmBuy, so Purchasing's
    later buy conversion keeps PsmBuy and its own permission; it is not netted, and a stale plan does not refuse it (its
    quantity is the request's).
  - A request joins the current plans at once (`planOutside`) and every later calculation, so the buyer converts it
    without waiting for a recalculation; supersede never rejects it.
  - The buyer prices the line through the shared resolver with the buyer's own reads: supplier prices need
    SUPPLIER_PRICE_VIEW. The review grants it to BOSS_PURCHASING_BUYER and BOSS_PURCHASING_ADMIN (pricing a PO line is
    the buyer's own work, and the group alone must convert what its mount offers it), and the demo buyer is in the buyer
    group alone.
  - The price variance is written at `apply#InvoiceMatch` (evaluate reads, apply records the match); a zero variance is no
    event.
  - SubcontractDetail is keyed by the operation (design §2), so an operation bought before P14 (the Warehouse demo's) reads
    without a subcontract record; a new request is refused while a service line is open.
  - The demo places the order (`place#Order`) and leaves its approval (ORDER_APPROVE) to an approver; placed is what
    Warehouse's dispatch needs; Purchasing replaces it.
  - The Supplier360 tab and the Subcontracting area are for the planner, supervisor, administrator and buyer groups
    (BOSS_MFG_SUBCONTRACTING); a production reader reads the same records through Mantle, not the screens.
- Findings (provisional):
  - **F114** BossManufacturingDemoData loads before BossWarehouseDemoData (alphabetical), so a Manufacturing demo row
    on a Warehouse demo product fails its foreign key and skips the whole file, and the user file after it; the coating price
    is at the end of BossWarehouseDemoData.
  - **F115** `unapply#InvoiceMatch` and `reevaluate#InvoiceMatch` write no reversal of the variance event; P15's cost close
    should reverse a variance whose match line is reversed (the event names its match line).
  - **F116** ORG_ZIZI_RETAIL has no PartyAcctgPreference of its own; a currency read of an organization must take
    `find#PartyAcctgPreference`'s ancestor walk.
  - **F117** `approve#Order` needs ORDER_APPROVE, which no Manufacturing or buyer group holds; a converted service order
    is placed and approved in Purchasing (and the bill match needs an approved order).
  - **F118** Shared/Supplier360's subscreen tabs render client side in qvt, so AppStructure checks the root mount and the
    Subcontract orders tab is checked by ManufacturingSubcontracting's html render.
- **Review (Nov 3).** Findings and fixes:
  - (medium, fixed) The service-acceptance rule, Y by default, took over every PtService line, also one received with an
    AssetReceipt, whose receipt rules changed. It now applies only to a service line with no receipt, so the default
    changes nothing for existing data: without a ServiceAcceptance (written only by `accept#ServiceItem` and
    `receive#SubcontractOutput`, which name the rule) the line is refused as before, and the ordered basis is unchanged.
    The default stays Y, since it is Accounting's planned contract (PUR-MATCH), not a new refusal. ProductionSubcontract's
    rule feature now checks the default's refusal (MISSING_RECEIPT with nothing accepted) before the rule is turned off.
  - (medium, fixed) BOSS_PURCHASING_BUYER alone could not convert: the resolver withheld the supplier price, so every
    conversion the mount offered it was refused. SUPPLIER_PRICE_VIEW is granted to the buyer and Purchasing admin groups,
    and the demo buyer's borrowed Products group is dropped (F119).
  - Checked and left: the accrual is written once per acceptance (a retry answers the first through the operation key);
    the variance only on `apply#InvoiceMatch` for a line with an OrderItemWorkEffort to a run; the conversion makes one
    draft PO per supplier, never places or approves it, answers EXISTING the second time and refuses the planner;
    PsmOutside as its own method keeps Purchasing's PsmBuy conversion free (crosscut §3.20); the Supplier360, OrderDetail
    and ShipmentDetail branches leave the Products, Projects, Accounting and Warehouse paths as they were;
    `run#SupplyPlan` carries open requests forward and supersede never rejects them. `outsideRequirements` reads every
    OrgInternal requirement id of the organization before filtering; fine at demo scale, a candidate for a join later.
  - **F119** A group whose mount offers an action must hold every permission the action's Mantle service checks; here
    the conversion's supplier-price read. Purchasing P1 keeps SUPPLIER_PRICE_VIEW on its buyer group.

### P15 — Cost close

Accounting's contracts (§4), built to design-accounting ProductionCostClose and AC-07 and crosscut §3.24; review §4.1
steps 20–23.

- **Records:** `mantle.work.production.ProductionAllocationPolicy`, effective-dated rows with their key fields
  audit-logged; a cost close keeps the row it applied.
- **`mantle.ledger.ProductionCostServices`** (new), each checking its permission and the organization:
  - `store#AllocationPolicy` (`ACCOUNTING_ADMIN`): the overhead basis and the co-product method, defaulting to
    work-center hours and normalized quantity (§4);
  - `preview#CostClose` (`ACCOUNTING_GL_POST`): the absorption of the events not yet in the GL (Dr WIP; Cr applied
    labor, applied machine and overhead, and the outside-processing accrual), overhead from the policy, the co-product
    reallocation, and the residual WIP to variance. It blocks while an entry on the run is on an unapproved timesheet,
    and needs an open period;
  - `post#CostClose` (`PRODUCTION_COST_POST`, which Accounting seeded and granted to `BOSS_ACCOUNTING_APPROVE` and
    `BOSS_ACCOUNTING_ADMIN`): one run-level transaction that calls `transition#ProductionOrder` (Close). After
    close a late event is an adjustment, which `preview#CostClose` picks up in adjustment mode (R-SA-11).
- **`ironstone.accounting.ProductionCostServices.find#CostCloseQueue`**, BOSS's read for the queue: the runs P6's
  review request queued.
- **By-product receipt:** `receive#ProductionOutput` takes a by-product at its co-product allocation, which Warehouse
  P16b refuses today (BYPRODUCT_NOT_COSTED).
- **Screens:** `Shared/ProductionCostClose`, mounted at `Accounting/Inventory/ProductionCostClose` and
  `Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose`, the second needing the finance groups and not the
  Accounting launcher;
  CostingPolicies at `Accounting/Settings/CostingPolicies`; ByProducts' actual allocation; the queue on Accounting Home
  and CloseChecks, which read P6's ProductionCostReview topic.
- **Usable when** (design-accounting §16.3 production-to-GL, the cost close):
  - a by-product is received as its own stock at its allocated cost;
  - a completed run with material, labor, machine and outside-processing events previews its absorption, co-product
    split and variance, and posts once, closing the run in the same transaction;
  - a retry answers the first post, and a closed period is refused;
  - a labor event after close is previewed as an adjustment;
  - a cost estimator can request review but not preview or post.

**Built Nov 4 (P15).**
- Mantle records (`entity/ProductionCostCloseEntities.xml`, `data/ProductionCostingData.xml`, new files):
  `mantle.work.production.ProductionAllocationPolicy` (organization, from/thru, overhead basis PobWorkCenterHour /
  PobLaborPercent / PobNone, fallback overhead rate and currency, labor percent, co-product method PcmQuantity /
  PcmFixedShare / PcmSalesValue, explicit output weights allowed, scrap to variance, variance account; key fields
  audit-logged); P6's ProductionCostAllocation extended (organization, component, account, accounting date, adjustment,
  basis quantity and rate, share, description); the run's audit-logged `productionCostClosedDate`,
  `productionCostCloseTransId` and `productionAllocationPolicyId` (the row the close applied); destination PcdScrap; the
  review decisions PcrReturned and PcrClosed (F69); the PeriodCloseCheck rows PccProductionWip and PccProductionCostClose
  (F26). The data file loads after ProductionCostData, whose enumeration types it extends.
- `mantle.ledger.ProductionCostServices` (`ProductionCostClose.js`): `get#AllocationPolicies` (finance reads; PRODUCTION_VIEW
  without rates), `store#AllocationPolicy` (ACCOUNTING_ADMIN: a change ends the row in effect, POLICY_CHANGED on a stale
  form), `preview#CostClose` (ACCOUNTING_GL_POST or PRODUCTION_COST_POST), `post#CostClose` (PRODUCTION_COST_POST),
  `get#CostClose`, `return#CostReview` and `check#ProductionClose`. The preview absorbs every valued event awaiting the
  close by its cost component (PrcLabor to GatLaborApplied, PrcMachine and overhead to GatOverheadApplied, PrcOutside to
  GatOutsideProcessAccrued), so P10's PcetLabor and PcetMachine events are absorbed with no change; overhead per work-center
  hour on each operation's machine hours (its labor hours with no machine runtime) at the center's approved PccOverhead
  WorkCenterRate on the event's date, else the policy's rate, or a percentage of labor; the scrap of issued material out of
  WIP (asset type scrap account, else variance); the co-product split of the run's cost over the output lines (quantity in
  the primary's unit, fixed BOM shares, list-price sales value, or explicit weights where allowed) with each line's variance;
  the residual WIP to variance. It blocks on a run not complete, unvalued events (F70, P10's unvalued machine runtime; a
  later revision of the source clears one), movements that posted nothing, another currency, time on the run or its
  operations not on an approved timesheet (read from mantle.work.time directly), a closed or missing period, unmapped or
  inactive accounts. After the run's close it previews the late events as an adjustment (R-SA-11). The post: one
  AttManufacturing AcctgTrans with the run's workEffortId, events PclClosePosted with closeAcctgTransId, an allocation per
  line under the policy row, the run's close fields and PcrClosed, then `transition#ProductionOrder` close in the same
  transaction; review notices marked read; a retry answers the first post (EntityLib operation key); a stale preview is
  STALE_PREVIEW.
- Shared-file edits: ProductionOrders.js (`close` action, PRODUCTION_COST_POST, refused COST_CLOSE_NOT_POSTED until the
  close is posted, CLOSE_BY_COST_CLOSE for a user without the permission, left out of the Lifecycle dialog);
  Production.js (`outputPlan`: a by-product at its share of the frozen estimate under the policy in effect,
  BYPRODUCT_NOT_COSTED without a standard); ProductionCosts.js (a source takes the revision as a third argument; a bill
  match line's later revision is the reversal of its variance once the match is unapplied, F115); ProductionQuantities.js
  (the completion impact text); ProductionServices.xml descriptions.
- BOSS: `Shared/ProductionCostClose` (queue in Accounting with no run; record header with the state chip, Post cost close
  primary dialog, More / Return to production; accounting-date preview; findings; evidence absorbed, overhead, scrap,
  output allocation, proposed journal entry; posted allocations), mounted at `Accounting/Inventory/ProductionCostClose`
  and as WorkOrderDetail's Cost close tab (index 9), classified in ClientIsolation; `Accounting/Settings/CostingPolicies`;
  `ironstone.accounting.ProductionCostServices.find#CostCloseQueue` (`ProductionCosts.js`: reviews requested, completed
  runs not closed, closed runs with late events); Home MyFinanceWork's "Production runs awaiting cost close";
  PeriodCloseDetail's productionCostClose route; the ProductionCostReview linkTemplate and the topic in Accounting's shell
  (F69); BOSS_ACCOUNTING_APPROVE on Accounting Inventory; ProductionCostServices in BOSS_ACCOUNTING_ACCESS; the two
  enumeration types in Accounting's choices; ProductionSettings shows the costing policy in effect read only and links
  CostingPolicies for the finance administrator; ByProducts' Actual allocation; Warehouse's MaterialIssueReceipt offers
  the by-product receipt; demo: Retail's four production cost accounts and `manufacturing.costclose` (production reader
  and BOSS_ACCOUNTING_APPROVE, no Accounting launcher).
- Specs: Mantle `test/ledger/ProductionCostClose.spec.js` (10 features, about 3 s of features: policy store and
  refusals with its audit row; the by-product at its share; a completed run with material, labor, P10 machine runtime
  through its MachineRuntimeEvent source and outside accrual previewing absorption 15/20/30, overhead 20, split 87.5/17.5
  and variance 45 (after the review); closed period refused and the run not closable outside the close; estimator and GL poster refusals,
  another organization; one post closing the run, the retry, the notices read; the adjustment; unapproved time and unvalued
  machine runtime blocking; the F115 reversal; the close-check rows); ProductionQuantities' by-product now received at 5 (after the review);
  ProductionSubcontract's variance counts scoped to its organization. BOSS `test/Accounting/AccountingProductionCostClose`
  (3: queue, Home and checklist; preview and post through the Accounting screen closing the run, GL poster without post;
  CostingPolicies and ProductionSettings' read only policy), ManufacturingAccess P15 (2), AccountingShell (approver menu),
  route fixtures; walk `ManufacturingCostCloseWalk` (4, with 390 px) in suite.js.
- Tests run (after merging master with P9 and P10): Mantle ProductionCostClose, ProductionShopFloor, ProductionChanges,
  ProductionCosts, ProductionOrders, ProductionQuantities, ProductionSubcontract, WarehouseProduction,
  ManufacturingServices, AccountingSetup, AccountingPeriodClose, ProductionPolicy (98, pass); before the merge also
  AccountingMatching and ProductMethods (pass). BOSS AccountingProductionCostClose, ManufacturingAccess, AppStructure,
  TuiRender, ClientIsolation, AccountingShell, ManufacturingWorkOrders (181, pass); before the merge also
  ManufacturingShell, AccountingPeriodClose, AccountingValuation, AccountingAccess, WarehouseAccess, Notifications,
  ManufacturingSubcontracting (pass). Walk ManufacturingCostCloseWalk (4, pass). `moqui lint --screens`: the new and
  changed screens show only informational anchor rows.
- Decisions:
  - Absorption is generic by cost component, so any later event kind of a known component is absorbed; an unknown
    component blocks (COMPONENT_UNMAPPED). Revisions are deltas: every valued revision counts.
  - The co-product reallocation is reported per output line and booked as variance by line; receipts and stock are never
    revalued (ByProducts: no retroactive edits of receipts). A by-product is received at its share of the frozen estimate
    (the share rounded to the currency), refused without an approved standard.
  - Overhead hours are the machine events' (else the labor events') of each operation, valued at the rate of the event's
    date, so an adjustment applies overhead only to its own hours.
  - The preview also takes PRODUCTION_COST_POST, since BOSS_ACCOUNTING_APPROVE (which posts) holds no ACCOUNTING_GL_POST;
    the estimator holds neither.
  - F52: the cost estimator still adds no WorkCenterRate; overhead rates are the resource administrator's WorkCenterRate
    rows (PccOverhead) and Accounting's fallback policy rate, so the cost group needs no new grant.
  - CostingPolicies stays the finance administrator's (Accounting Settings); Manufacturing reads the policy in effect
    without rates on ProductionSettings.
- Review (Nov 4): checked the GL entries (each absorption, overhead, scrap and residual line is its own balanced pair; the
  per-line variances sum to the residual, so the run's WIP nets to zero, now asserted by a preview after the close), the
  co-product split booked as variance by line against design ByProducts' "never retroactive edits of receipts" (kept), the
  §4 default allocation (machine hours else labor hours per operation: setup labor on an operation with machine runtime
  takes no overhead unless the runtime covers it, left as built), the policy's effective dating and the kept row, the
  preview's blocks, the single transaction through `transition#ProductionOrder`, the retry and the closed period, the
  preview's PRODUCTION_COST_POST (design ProductionCostClose: "GL/finance approvers preview, approve and post"; the
  estimator holds neither) and BOSS_ACCOUNTING_APPROVE on Inventory (it holds ACCOUNTING_VIEW; revaluation and cost repair
  still need glPost and ACCOUNTING_ADMIN in Mantle, so it adds only reads). Fixed F137 to F139. Not covered by a spec:
  PcmFixedShare and PcmSalesValue in a close. Specs rerun: Mantle ProductionCostClose, ProductionQuantities, ProductionCosts,
  WarehouseProduction (31, pass); BOSS AccountingProductionCostClose, ManufacturingAccess (95, pass); walk
  ManufacturingCostCloseWalk (4, pass); lint shows only anchor rows for the screen.
- Deferred: CostingPolicies' LaborCostingRates form (People's get#CostingRate; P10 values labor with its own rate rows;
  picked up in impl-people P10, §7);
  posted allocations' reversal actions; a demo run awaiting the close (the walk reads the released Warehouse demo run).
- Findings (provisional):
  - **F132** The cost close data file sorted before ProductionCostData (alphabetical load order) and failed on the
    missing enumeration type, skipping the whole file; it is `ProductionCostingData.xml`.
  - **F133** BOSS_ACCOUNTING_APPROVE (PRODUCTION_COST_POST) had no authz on Accounting Inventory; granted, so the
    approvers' menu shows Inventory (AccountingShell updated).
  - **F134** The Accounting demo users work in BOSS_ACCT_ORG, not Retail, where the Manufacturing demo runs are; the
    BOSS spec makes Retail finance users of its own, and the demo adds `manufacturing.costclose` for the Manufacturing mount.
  - **F135** A Mantle spec that counts every event of a type (ProductionSubcontract's variances) breaks when another
    spec of the run writes one; scoped to its organization.
  - **F137** (review) The by-product was received at its share of the primary's standard × target (2/12 of 50 = 4.165 a
    unit), but Products' rollup already nets the primary's standard of the by-products' shares (Costs.js scales its lines by
    the main share) and the primary is received at that standard, so receipts relieved more than the estimate and a
    quantity-method by-product unit cost less than a primary unit. `byproductCost` now shares the run's whole estimate (the
    primary's target at its standard over the primary's weight): 5 a unit, as the primary; P7's AllocationReview estimate
    (`allocationEstimate`) shows the same whole (60, not 50).
  - **F138** (review) PcmFixedShare gave the primary `100 −` the others' shares, but a BOM line's `allocationShare` is a
    fraction of one (Boms.js, Costs.js), so a 0.2 by-product took 0.2 % of the cost; the primary now takes `1 −` the others.
  - **F139** (review) An adjustment after the close defaulted to the review's proposed accounting date (the close's,
    likely a closed period by then), and the screen hid the date after the close; an adjustment is now dated today unless
    given, and ProductionCostClose offers the date in adjustment mode too. The overhead rate lookup takes only approved
    WorkCenterRate rows, as P10's machine rate does (a row with no state was taken as approved).
  - **F136** For the merge: ProductionOrders.js (close action), ProductionCosts.js (the source signature now
    `(id, removed, revision)`), Production.js (`outputPlan`), BossAccountingSetupData (Inventory authz, artifact group,
    topic link), BossManufacturingDemoData and BossUsersDemoData (appended), ManufacturingAccess and ManufacturingSpecLib
    (appended P15 blocks), AppStructure and TuiRender (the Accounting Inventory mount), suite.js.

### P16 — Reports

Design §9; the reporting part of M10.

- **`mantle.work.ProductionReportServices`:** the eight report services of design §9, and `get#ProductionDashboard`.
  Each checks `PRODUCTION_VIEW` and returns its scope, as-of time, units and currency, and the partitions it could not
  read; money columns need `ACCOUNTING_VIEW`. OEE is availability × performance × quality, with downtime unioned and
  reworked units counted once, and "Not calculable" where data is missing.
- **Screens:** Reports, and WorkOrderStatusReport, MaterialReport, OperationPerformanceReport, LossReport,
  QualityReport, ProductionCostReport, BillOfMaterialsVarianceReport and PlanningReport (over P13's runs). Home
  complete, its Kpis as dashboard widget providers (crosscut §3.17) opening their reports with the same filters.
- **Exports:** each report as CSV with its screen's filters and columns.
- **Usable when:**
  - OEE for a line shows its three factors from P10's events and P11's downtime;
  - a reader without financial read gets the quantities and no money columns, on screen and in the export;
  - a failed partition is named and the total marked incomplete, never zero.

**Built Nov 4 (P16).**
- Mantle (new files, nothing shared edited): `service/mantle/work/ProductionReportServices.xml` (`define#ReportParameters`:
  organization, facility, period, page; and the nine services) over `ProductionReports.js`:
  `get#ProductionStatusReport`, `get#ProductionMaterialReport`, `get#OperationPerformanceReport`, `get#ProductionLossReport`,
  `get#ProductionQualityReport`, `get#ProductionCostReport`, `get#BomVarianceReport`, `get#ProductionPlanningReport` and
  `get#ProductionDashboard`. Each checks PRODUCTION_VIEW and the user's organizations and facilities (FacilityScope; a run
  by owner and facility), refuses an organization or facility outside them as missing (RECORD_UNAVAILABLE) and a period
  over 366 days (PERIOD_TOO_LONG), and answers `scope`, `asOf`, `unitList`, `currencyUomIds` (financial read only),
  `partitions` (name and message), `complete`, `financialRead` and `withheldText`. Each independent source and each run,
  work center or plan is read in its own `partition`: a failure is logged, named and left out of the totals. A source
  another phase builds is read only when its entity is defined (`plannedSource`), else named "Not available in this build".
  Money (amounts, WIP, allocations, variance, the loss's cost, the usage variance, the frozen estimate with Products' cost
  read too) only with ACCOUNTING_VIEW: left out of rows and totals, never zero. Totals per unit and per currency. Lists page
  from the service (`lib.pageList`, export up to 2000 rows); more than 2000 runs is a named partition. The status report
  reuses `find#ProductionOrders`, the material and cost reports `Production.js materialTotals` and `ProductionQuantities.js
  outputFigures`, OEE `ProductionCalendar.js` (work hours, holidays, offline intervals, `operationHours`), the utilization
  Kpi `get#WorkCenterLoad`, and planning `SupplyPlanning.js coveredOf`/`staleOf`.
- OEE (design OperationPerformanceReport), per work center over the period (7 days by default): planned production time =
  work hours less planned stops (plannedStop Y) and planned outages (RukPlanned), × slots; downtime = unplanned stops and
  outages unioned within the planned time; run time = the machines' runtime (MachineRuntimeEvent, unioned per machine)
  within the planned time and outside the downtime when any is recorded, else planned time less downtime (named);
  availability = run / planned; performance = the ideal hours of the units counted (the routing operation's standard
  hours for its run's output quantity, machine time where it has any) / run time; quality = good / every unit counted,
  weighed by ideal hours (by count when the units share one unit); OEE = the product. The units: an operation's own
  completion counts (P10's `productionGoodQuantity` and `productionLossQuantity`) when it has them, else its run's quantity
  events in the period (good, held, scrap, process loss, rework), each unit once; a rework run's (a loss's
  `reworkWorkEffortId`) output is left out, its units counted as rework where they were made. Missing figures (no planned
  time, no units, an operation without standards, mixed units without standards) make a factor "Not calculable" with its
  reason. The plant's factors sum the calculable centers' hours. Downtime by reason (planned ones marked excluded).
- BOSS: `screen/Manufacturing/Reports.xml` (placeholder replaced: tab panel, ReportIndex by default) with `ReportIndex`
  and the eight report screens under `Reports/` (parameters form with server-search drop-downs, ReportStatus, totals, the
  rows with CSV and XLSX export, the report's other lists); `template/ManufacturingReportParts.xml` (ReportStatus: as of,
  scope, units, currency, what is withheld, the incomplete warning naming the partitions). A list with money columns is
  two form-lists by `financialRead` (with them, and without them), so the columns are absent for a reader in qvt, html,
  tui and the export alike. Home: the Kpis box (number cards: completed, on-time completion, OEE, utilization, scrap rate
  and, with financial read, WIP value at the plant this month, each linking to its report with the same filters), and
  "Completed this month" counted (`get#Home`'s P16 block over `get#ProductionDashboard`; its link opens the status report
  of the month's completions). Manufacturing.js P16 block: the report routes in sharedLinks, the `workOrders` choice.
- Specs: Mantle `test/work/ProductionReports.spec.js` (5 features, under 1 s of features; spec-local organizations, users
  and a released method; two runs, quantities, rework, three stops): OEE of a work center (planned 7 h, downtime 1.5 h
  unioned, run 5.5 h, availability 78.6%, performance 90.9%, quality 80%, OEE 57.1%, 10 units counted with the redone
  rework unit not again); a reader's cost, loss and variance rows without money and a financial reader's with it; a work
  center whose calendar's time zone is not known named as a partition, the report incomplete and the center not shown;
  every report's scope and figures, the dashboard's Kpis and its WIP value withheld; refusals (no PRODUCTION_VIEW, another
  organization, a facility outside the scope, a long period). BOSS `ManufacturingReports` (3: Home's Kpis and completed
  count, the cost report's columns on screen and in the CSV for a reader and a financial reader, each report's render),
  ManufacturingAccess's P16 section (2: every report service refused for the plant display on the parameters a reader
  passes, the other organization's reader, the money, the work order choice; the Reports area by role with authz on),
  the route fixtures (AppStructure, TuiRender), ManufacturingShell's Home check (completed is counted now), and the walk
  `ManufacturingReportsWalk` (3: Home's OEE card opens the performance report; a reader's and a financial reader's cost
  columns; 390 px) in suite.js. AppStructure's placeholder floor is 62 after the merge with P10.
- Tests run: Mantle ProductionReports with ProductionCosts (9 features, pass); BOSS ManufacturingReports,
  ManufacturingAccess, AppStructure, TuiRender, ManufacturingShell (passing after the fixes below: 93 features for Reports
  and Access, 23 for Reports and Shell, AppStructure and TuiRender in a 44-feature run); walk ManufacturingReportsWalk (3,
  pass). `moqui lint --screens`: the new screens show only informational anchor rows. `ss-inventory.md`'s RunList row
  names Home and the status report; no `usl-inventory.md` row is called (the report services are new).
- Merged with master after P9 and P10 (Nov 4): OEE reads P10's records directly: `MachineRuntimeEvent` (unioned per
  machine and asset at the work center; `MrmSetup` the machine setup hours), the operations' `productionGoodQuantity`
  (good with the held, as complete#ProductionOperation writes it) and `productionLossQuantity`, and labor hours from the
  TimeEntry rows on the operations (`WktpProductionSetup` the setup hours); P10's labor and machine cost events sum into
  the cost report's labor and machine columns by component. ProductionReports records the machine's runtime through
  `record#MachineRuntime` (the organization's policy PmrOptional, the run started) and expects the report complete with
  3.5 run hours (6 machine hours less the planned changeover and the unioned downtime): availability 50%, performance
  71.4%, quality 80%, OEE 28.6%. Conflicts kept both sides (Manufacturing.js's P10 and P16 blocks, suite.js's two walks,
  AppStructure's comment), and the placeholder floor is 62 with ShopFloor and Reports both replaced.
- After the merge: Mantle ProductionReports, ProductionShopFloor and ProductionCosts (18 features, pass); BOSS
  ManufacturingReports, ManufacturingAccess, ManufacturingShopFloor, AppStructure, TuiRender and ManufacturingShell on a
  fresh load (142 features, pass); walks ManufacturingReportsWalk and ManufacturingShopFloorWalk (5, pass).
- Re-verify after P15 merges (done in the review, below): the cost report reads ProductionCostAllocation's P6 fields (`destinationEnumId`,
  `allocatedAmount`, `acctgTransId`; output and by-product to output, variance to variance) and the events'
  `closeAcctgTransId`; a closed run shows "Closed". No spec covers a posted close here; P15's cost close spec or a P17 walk
  should read one through the report. MyFinanceWork's runs awaiting close stay P15's.
- Decisions:
  - `get#ProductionDashboard` is in `mantle.work.ProductionReportServices` (this plan), not ProductionServices (design
    Home's table, corrected there); it is the Kpi provider Insights registers (crosscut §3.17).
  - The Kpis are completed, on-time completion (completed by the due date), OEE, utilization (booked over available
    hours, Capacity's measure, not OEE), scrap rate (scrap, process loss and rework over all output; component scrap is
    apart, in the material's units) and WIP value (the open runs' events, financial read only, left out otherwise).
  - Without P10's completion counts, each operation of a run is credited with the run's output quantities in the period, so
    a center is measured on the units that passed through it; the row names it.
  - A report's parameters default the facility to the selected plant, as Warehouse's reports do; the lot filter is a
    service parameter only (no lot drop-down), and the design's shift filter is not built (no shift record).
- Findings (provisional):
  - **F140** A center whose machines record no runtime (a manual line, or a policy of PmrNotRecorded) has run time =
    planned time less downtime, named on its row; P10's completion counts count held output as good
    (`productionGoodQuantity` = good + pending), so a center's quality from completions is above the receipts' until the
    held output is disposed.
  - **F141** In a first try, a field's `hide="!financialRead"` left a money column's header in the reader's html render
    of a report; not investigated further: the reports use two form-lists by financial read instead. P6's ProductionCosts
    tab uses `hide` on its amount and ledger columns and may want the same check.
  - **F142** Home's Kpis read the OEE, loss, load and (financial read) cost reports on each render; fine at demo scale,
    a cache or a scheduled snapshot (Insights) later.
  - **F143** Insights' catalog registration (design Z10) waits for Insights; the report services and the dashboard are
    the providers it registers.
  - **F144** For the merge: Manufacturing.js (P16 block before `operations`), HomeServices.xml (the P16 block where
    the "later phases" comment was), Home.xml (Kpis section after the Summary), ManufacturingSpecLib.js (P16 routes at
    the end of routeFixtures), ManufacturingAccess.spec.js (P16 section at the end), suite.js (the walk after
    ManufacturingShopFloorWalk), AppStructure's floor (62), ManufacturingShell's Home check.

- **Review (Nov 4).** Findings and fixes:
  - (Medium, fixed) OEE's quality counted held output as good on P10's completion counts (`productionGoodQuantity` = good +
    pending), against design §3 Quantities (produced-held is outside accepted good), and on the quantity-event path a unit
    held and then scrapped from held was counted twice (its pending and its scrap event). Now a unit still held, or
    scrapped from held, is counted but not good (its scrap event not again), a released one is good (Quantities'
    `outputFigures` held now and the approved `fromHeld` scrap of the output line), with a note on the center's row; spec
    "OEE's quality does not count held output as good" (a shop-floor completion of 1 good and 1 held: 12 counted, 9 good,
    quality 75%). F140's second half is resolved by it.
  - (Low, fixed) The loss, quality and planning reads and the work centers were capped (5000, 2000, 500 rows) silently;
    a read over its cap is now a named partition (`cappedList`), the report incomplete.
  - (Low, fixed; framework issue recorded) F141 investigated: `hide` works for the table header, cells, csv, xlsx and
    tui, but with `select-columns="true"` the column chooser lists every field, a hidden one under "Do Not Display" with
    its title: `runtime/components/base/framework/template/screen/ScreenHtml.js` `allFields` (about line 2029, used by
    `columnsDialog` about line 1164) and `ScreenQvt.js` `allFields` (about line 2600, `m-form-column-config` about line
    1460) do not filter on the field's `hide`, as `shown` does; the tui chooser the same. The values never show. Not
    changed here (mr-moqui). P6's ProductionCosts tab (no select-columns) does not leak: its spec now checks a reader's
    qvt, html, tui and csv renders have no Amount or Ledger column. P14's SubcontractOperations did leak the Price title to
    a reader without supplier prices: its list is now two form-lists by `priceRead` (the second `extends` the first with the
    price field ignored), checked in ManufacturingAccess's Subcontracting feature (planner none, buyer has it in qvt, html
    and tui). ScrapLoss, Quantities and SubcontractDetail use `hide` without select-columns and do not leak.
  - Checked, no change: each report's PRODUCTION_VIEW, organization and facility scope (`begin`, `runsOf`, `centersOf`);
    money left out of rows, totals and currencies without ACCOUNTING_VIEW; the cost, loss and BOM variance reports render no
    money column for a reader in html, qvt, tui and csv (ManufacturingReports now checks qvt, tui and the variance report
    too; xlsx is the same widget tree as csv); OEE's downtime union and planned stops; "Not calculable" with reasons; the
    Kpi links' filters (facility, period; Completed and On-time by completion date) read by the reports' parameters; Home's
    Completed this month (Unavailable, never zero, when the dashboard fails). Left: the Utilization card opens the
    performance report, which does not show utilization (Capacity does); no BOSS spec renders a report's incomplete warning
    (the Mantle spec covers the partition).
  - Merged master again after P15 (conflicts kept both sides: the phase table's P15 and P16 rows, ManufacturingAccess's P15
    and P16 sections). The re-verify above, done: the cost report's variance now adds P15's scrap of issued material
    (PcdScrap) to the production variance, a run cost-closed but not yet closed reads "Cost closed"
    (productionCostClosedDate), and ProductionCostClose's spec reads the posted close through get#ProductionCostReport
    (Closed, the output and by-product allocation, the variance and the close's transaction).
  - Specs run: Mantle ProductionReports, ProductionShopFloor, ProductionCosts (19 features), and after the P15 merge on a
    fresh load ProductionCostClose, ProductionReports, ProductionCosts (21 features), all pass; BOSS ManufacturingReports,
    ManufacturingAccess, ManufacturingSubcontracting, AppStructure, TuiRender (121 features), and after the merge on a fresh
    load with ManufacturingShell (143 features), all pass; walk ManufacturingReportsWalk (3, pass); `moqui lint --screens`
    unchanged (informational anchors only).

### P17 — Finish

- The terminal twins, and the server-static sweep, an acceptance test.
- The design §10.3 acceptance review and crosscut §6 standalone operation, acceptance tests (`ManufacturingAccessWalk`,
  `ManufacturingIsolationWalk`, `ManufacturingCostIsolationWalk`). A Manufacturing user with no other launcher plans,
  makes and receives through the shared mounts. That user is refused cost, finance, other organizations' runs and stock
  actions without `STOCK_ISSUE`, through URLs, shared contexts, the shop floor, exports, the palette and search.
- The §11 outputs not built earlier.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work.

**Built Nov 4 (P17).**
- **Terminal twins and server-static.** Every Manufacturing screen, its shared mounts and the record panels render in tui
  with their route fixture's text (TuiRender), and TuiRender now fails a Manufacturing route fixture that no screen renders;
  the three `.qvue` screens' twins are checked to name their source (Station's `board` over `queueRows`, ResourceCalendar's
  and ProductionSchedule's plain twin screens, which have their own fixtures). No screen lacked a usable twin. ManufacturingServerStatic
  (review: split from ServerStatic) reports every Manufacturing XML screen on its route fixture: `ironstone.manufacturing.AccessServices.check#Record` is
  `read-only="true"` (it only reads), so the root's and WorkOrderDetail's always-actions are no side effect and the Notes
  tab P5a marked is clean again (F146); InspectionStation, its Scan, NewWorkOrder and QuickCreate are marked
  `server-static="qvt"` (with ReportDowntime and Notes, 6 of 89). The others keep a list's condition outside its form-list
  (the form-list-key rule) or a `#` link, as most Warehouse screens do; Disassembly reported clean but its static template
  failed AppStructure's qvt render (F147), so it stays unmarked.
- **§10.3 acceptance and crosscut §6 standalone operation**, `test/Manufacturing/ManufacturingAccessWalk.spec.js` (5
  features), `ManufacturingIsolationWalk.spec.js` (3) and `ManufacturingCostIsolationWalk.spec.js` (2, split from it in the review) over `ManufacturingStandaloneLib.js`, on WarehouseAccessWalk's
  pattern: an organization of its own, BOSS_P17_ORG (a plant, a line, a released routing of one operation and a BOM of one
  part, each setup its own made product and sales demand), with Manufacturing users of one capability group each and no
  other launcher (the material handler holds Warehouse's issue group without the Warehouse root), plans (SupplyPlanning's
  Recalculate and Convert), releases, starts, issues (MaterialIssueReceipt, refused to the operator without STOCK_ISSUE),
  operates on the shop floor (OperationExecution's start, and Complete with two good, which receives them and is refused to
  the operator without STOCK_ISSUE: STOCK_ISSUE_REQUIRED), receives the third (MaterialIssueReceipt) and completes
  (Quantities), all through the screens' transitions, while a blind count of the component's stock is open (its review finds
  the issue as a conflict). Every P17 user and twelve of Retail's demo Manufacturing users open Manufacturing and none of
  eight other roots; Retail's users never see the organization's records on the routes (of 43: work order tabs and prints, shop
  floor, method, work center, planning, report screens, the station's board and the record panels' twins) that show them to
  its own users in html, and the reader
  also in tui; Retail's users are refused 13 actions and reads of its records by transition and by Mantle
  verb (RECORD_UNAVAILABLE), the run unchanged; its notices (ProductionRelease) reach its own supervisor only. The isolation
  walk: its users see none of Retail's records on every route fixture with a demo record (over 60) (html, the reader also tui); CSV exports and the
  prints (traveler, pick sheet, labels, instructions, schedule and plan snapshots, the status report) of each side hold only
  its rows; record links, the palette, operation scans, the station's board, universal search and the plant, work center,
  product and released-method drop-downs keep each side to its records; no component cost or issue value shows without
  financial read on the work order, its tabs, the reports and Home (html, and tui and csv for the reader) while john.doe
  sees it; the cost close's preview and post and Accounting's cost close queue refuse both sides' Manufacturing users; and
  Warehouse's MaterialIssueReceipt, Commons' TaskDetail and EventDetail, Products' BOM tab and Accounting's
  ProductionCostClose show the organization's run, operation and method to none of Retail's users of those apps. No access
  hole was found (F148). §8's table now names what covers each scenario.
- **§11 outputs.** Built earlier: the traveler and pick sheet (P5a), labels (P7), the instructions print and quality checklist
  and certificate (P8, P10), the BOM and routing prints and CSVs with the explosion and compare and the CSV import with its
  preview (P2), the dispatch and return instructions (P14), the schedule snapshot (P12), the reports' CSVs (P16) and the
  notices. Built here: `Planning/PlanSnapshot` (html-print: the supply plan's version, its suggestions with what covers
  them, the held stock; CSV), linked as Snapshot from Shared/SupplyPlanning's header on a mount that has the route
  (`sharedLinks`); a Print link on every report (ReportStatus) and on Capacity, the screen as html-print with the same
  parameters. The calibration evidence waits for Gauges (§7).
- **Inventories and design.** ss-inventory: every form with a Manufacturing Designed in path names its Manufacturing screen
  (26, checked); usl-inventory: the seven Manufacturing-designed services whose cell lacked Manufacturing are filled (the
  root's `setup#UserOrganizationInfo`, `get#AvailableInventory`, `receive#Asset` through the output receipt) or `—` with what
  is called instead (`issue#AnyAssetToWorkEffort`, `get#ProductionRunDisplayInfo`, `get#ProductBomDetail`, `update#Timer`);
  design-manufacturing §2's Impl names the building phase (and the built path where it differs) or §7; docs/
  ManufacturingImplementation.md rewritten complete and short.
- Specs run (this runtime; no full suite): BOSS ManufacturingAccessWalk and ManufacturingIsolationWalk (10, the longest
  feature about 11 s), ManufacturingReports and ManufacturingPlanning with the new print and snapshot features (9 and 5),
  ServerStatic, TuiRender, AppStructure, ManufacturingAccess, ManufacturingShell (all pass); ClientIsolation with both walks on a fresh load (26, pass; F149).
  Walks ManufacturingWorkOrdersWalk, ManufacturingQualityWalk, ManufacturingPlanningWalk, ManufacturingReportsWalk and
  ManufacturingScheduleWalk (14, pass). `moqui lint --screens`: no Manufacturing site flagged, no Manufacturing tui worklist
  item; the new screen shows only informational anchors.
- Findings (provisional):
  - **F146** ServerStatic never covered Manufacturing, so P5a's `server-static="qvt"` on WorkOrderDetail/Notes was not
    checked: the static report counted the parent's always-actions `check#Record` as a side effect the form request repeats.
    `check#Record` only reads and is now `read-only="true"`; ServerStatic includes Manufacturing.
  - **F147** `ec.screen.staticReport` reported Disassembly clean, but marked `server-static="qvt"` its static qvt render
    failed in AppStructure ("cannot read property 'componentRows' of null"). The form-list ReversalComponents has
    `list="reversal.componentRows"`, a path through `reversal`, inside section PreviewStep (condition `canReverse && reversal`);
    the form's package evaluates that list without the section's condition, where `reversal` is null. The report's
    `form-list-key` rule (`scan_definition` in mr-moqui `crates/moqui-core/src/screen/statics/report.rs`) only looks for a
    condition or label outside the form that names the whole list (`reversal.componentRows`), so a list path whose base a
    section's condition guards passes. A framework item: the rule should flag a form-list whose `list` is a path in a
    conditioned section (or the package evaluate the path null-safe). Disassembly stays unmarked; not changed here.
  - **F148** No access hole found: every route, transition, verb, export, print, palette, link, scan, board, search,
    drop-down, notice and other app's shared context checked refuses the other organization, and money is left out without
    financial read. A production reader cannot open Planning (the P13 area grant), so InventoryAvailability under it is the
    planners', schedulers' and supervisors' (design §7 lists it for the app); a Components shortage links it.
  - **F149** ClientIsolation failed twice on a reused `--db snapshot` database: its secret `7777` is a substring of the
    snapshot's load time (a timeline `dateMillis` of 1793777737346), not P17's change; on a fresh load it passes, with both walks
    (26 features). ServerStatic now takes about 55 s with the Manufacturing screens (over 30 s, not marked slow). Both fixed in
    the review.
  - **F150** A `sharedLinks` link (`//Manufacturing/...`) renders disabled (`href="#"`) under a test's Manufacturing root
    screen, so the specs check the Snapshot and Print links by their text or `renderMode`.

- **Review (Nov 4).** Findings and fixes:
  - (Medium, fixed) ServerStatic took about 55 s, and 47 s of it before Manufacturing was added (426 screens of six apps), over
    the 30 s of AGENTS.md. Split, the check in `test/ServerStaticLib.js` (`screens`, `check`, `unclean`): ServerStatic keeps
    Commons, Comms and Products (102 screens, 11.5 s), with ProjectsServerStatic (103, 11.5 s), AccountingServerStatic (133,
    16.5 s), WarehouseServerStatic (88, 8.4 s) and ManufacturingServerStatic (66, 8.1 s, at least the 6 marked); feature times,
    each spec 14 to 23 s with its start. The same verdicts.
  - (Medium, fixed) ClientIsolation's amount sentinels (`7777`, `8888`, `43210` and the others) matched digits inside a longer
    number, such as a reused snapshot's `dateMillis` (F149): `leaksOf` now takes a numeric sentinel only as a number of its
    own (no digit before or after it), so `7777.77` and `$7,777.77` still count and `1793777737346` does not. Passes on a
    reused `--db snapshot` and on a fresh load.
  - (Low, fixed) ManufacturingIsolationWalk had vacuous controls: the other apps' contexts needed only two of five mounts to
    open for john.doe, and costShown one route. Now Warehouse's MaterialIssueReceipt, Commons' TaskDetail and Products' BOM tab
    must show the organization's records to john.doe, and the cost tab, the Materials tab and the cost report its cost; the
    drop-downs' own plants and Retail's station's own queue are positive controls too. Commons' EventDetail shows no production
    run and Accounting's ProductionCostClose only an organization of the user's (john.doe is not BOSS_P17_ORG's agent), so those
    two are refusals without a control, and the cost close refusals are all by permission (PERMISSION_DENIED,
    ACCESS_DENIED), none by organization. Universal search answers nothing for either side in a test runtime (no index), so its
    check is vacuous; the palette's `search#Records`, with its own-side control, is the one that counts. The P17 station check is
    one-sided (the organization's run is complete, so its queue is empty); AccessWalk's `queueRows` route covers the other side.
    BillsOfMaterials/WhereUsed of the part shows no P17 record to its own reader (logged, not required).
  - Checked, sound: AccessWalk's flow asserts each refusal by its code (PERMISSION_DENIED, STOCK_ISSUE_REQUIRED) and the
    success of each step; its 13 refusals match RECORD_UNAVAILABLE or PLANT_UNAVAILABLE (a status refusal would not), with the
    same transitions succeeding in the flow and the run unchanged; the route sweep requires 12 routes to show the records to
    their owner (42 of the 43 did). Feature times 0 to 10.3 s; AccessWalk about 15 s, IsolationWalk about 23 s with setup.
  - (Low, fixed) ManufacturingIsolationWalk took 32 s with its start (about 26 s of its own): the cost, cost close and other
    apps' features are ManufacturingCostIsolationWalk now (2 features, 16 s with its start), the isolation walk 3 (25 s).
  - Not split, older than P17: AppStructure (37 s, one feature 29 s) and TuiRender (28 s, one feature 21 s) render every
    app's screens; they want the same per-app split.
  - F147 recorded precisely (above); F141 (§6) fixed in mr-moqui 477f9e89.
  - After merging master: ClientIsolation (16, fresh load 21 s and reused snapshot 13 s), ServerStatic (1, 17.6 s),
    ProjectsServerStatic (1, 17.6 s), AccountingServerStatic (1, 23.0 s), WarehouseServerStatic (1, 14.4 s),
    ManufacturingServerStatic (1, 14.0 s), TuiRender (3, 27.9 s), AppStructure (18, 37.1 s), ManufacturingAccessWalk (5,
    22.7 s), ManufacturingIsolationWalk (3, 24.9 s), ManufacturingCostIsolationWalk (2, 16.1 s), ColumnChooser (3, 6.8 s): all
    pass (times with each spec's start of about 6 s).

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-manufacturing.md, or into the owner's design.

Decided in the other apps' plans, and binding here:

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Products builds Manufacturing's methods (M3), effective-dated as below, `WorkCenter`, `WorkCenterRate` and `get#OperationCostBasis`, with the five shared method screens in the Products context (impl-products P8). Capacity, alternates and load, and Manufacturing's own method screens, stay Manufacturing's | The user's call, in impl-products §4 |
| Oct 28, 2026 | Accounting builds ProductionCostClose and CostingPolicies with Manufacturing's cost events, output receipt and run close. Its P13 seeds the production GL account types and the scrap account, and its P19 readiness checks the WIP and transfer accounts | The user's call, in impl-accounting §4. Here: P15 |
| Oct 28, 2026 | Warehouse builds crosscut CX-QUALITY (its P8), and Manufacturing's runs and their lines (`create#ProductionOrder`, `release#ProductionOrder` and `ProductionRunLine`) and stock guards with the CX-PRODUCTION fields (its P16). The rest of M4 and M2, and Manufacturing's screens, stay Manufacturing's | The user's call, in impl-warehouse §4 |
| Oct 28, 2026 | The shared screens an app builds first carry its context only; another app's context is added when that app is built | As in each plan |

Made for this plan:

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Manufacturing is built after Products, Accounting and Warehouse, and before Purchasing. It extends what those three built for it, and Purchasing later adds its context and conversions to what Manufacturing builds: SupplyPlanning and the outside-processing PO lines | The user's call. The three plans assume the first; [impl-purchasing.md](impl-purchasing.md) now follows it |
| Oct 28, 2026 | The shared rules of impl-drawers-commons §4 apply: parties by role, and changes by effective date and the audit log. Here: ProductionPolicy, the reason codes and ProductionAllocationPolicy are effective-dated rows with audit-logged key fields, and a requirement's organization is a RequirementParty role. The methods and runs follow it too, as decided below | The user's call, in the Purchasing plan review (impl-purchasing §4) |
| Oct 28, 2026 | The root: `BOSS_MANUFACTURING` as root user group and artifact group. Its groups take `MANTLE_USER_ORG`, and `BOSS_MANUFACTURING_ADMIN`, with all authz on the root, `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` (impl-drawers-commons §4). Products P1's work-center group is `BOSS_MANUFACTURING_RESOURCE_ADMIN` (renamed), the design's production and resource administrator (F2) | The user's call (§5 review), for every BOSS root |
| Oct 28, 2026 | Plant scope is Warehouse's facility scope: `MANTLE_USER_ORG`'s Facility filter, `ownerPartyId` in `filterOrgIds`, for production facilities too; the admin group works in every plant | Follows from the root decision and impl-warehouse §4 |
| Oct 28, 2026 | Methods and runs under the shared rule (impl-products §4, impl-warehouse §4): a `ProductBom` header with effective-dated `ProductBomItem` lines of stable ID; routings on Mantle's WepRouting templates with dated `WeatRoutingComp` rows; a release is a decision that stamps the lines' dates. A run has its own `ProductionRunLine` rows from create, frozen at release, with its revision, release time and frozen standard as audit-logged run fields; an amendment is an audit-logged change to its remaining lines. In this plan a method "version" is the method as of a release date, and a run's "snapshot" is its lines and release time. M3's version and M4's snapshot records are dropped | The user's call (§5 review), in impl-products §4. It answers the draft-lines check (P0) too |
| Oct 28, 2026 | Production instructions under the shared rule (P2): a published instruction is a `WorkEffortContent` row of an instruction content type on the operation template, its file stored immutably with a checksum. `WorkEffortContent` gains audit-logged `fromDate` and `thruDate`, so a publish ends the previous row and starts the next. The required evidence and the quality template are audit-logged fields of the operation template, and a run's operation shows the instruction as of its release time. An operator's acknowledgment stays a record of its own (who, when, which content row). `ProductionInstructionVersion` is dropped | The user's call (§5 review), raised by the shared rule. The alternative was the designed version record as an exception |
| Oct 28, 2026 | Completion with no formal inspection (P7): explicit final reconciliation by default. A ProductionPolicy flag, off by default, lets the final output receipt reconcile and complete in the same atomic service with the same evidence | The user's call (§5 review): design §14's recommendation, with its opt-in built now. The alternatives were the opt-in later, and auto-completion |
| Oct 28, 2026 | The released-run amendment policy (P9) as design §14 recommends: no method change after any material, time or output fact by default; a controlled amendment of the remaining lines and operations, reviewed by the method approver and the production supervisor, linked to a change notice when Products ChangeNotices is on; and a ProductionPolicy flag for strict release that refuses amendments and needs a linked new run | The user's call (§5 review). The alternatives were never amending, and amending only until the first fact |
| Oct 28, 2026 | Kit disassembly ships in P9 (F15). P9 makes the kit receipt's reduction a dated reversing delta in an open period, as Accounting P2a does for issuances, in place of `repost#Asset`'s unpost, delete and re-post; the guard checks the quantities actually issued and refuses a difference. General manufacturing unbuild stays §7 | The user's call (§5 review). The alternatives were enabling it only if P0 found both reposts already safe, and §7 |
| Oct 28, 2026 | Skill certification and safety acknowledgment (P10) as design §14 recommends: an operation template's required skills (`WorkEffortSkillStandard` against `PartySkill`) or required acknowledgment block Start, with a supervisor override and its reason recorded; with none configured the check is a visible advisory | The user's call (§5 review). The alternatives were always advisory, and always blocking |
| Oct 28, 2026 | Machine runtime with no effective WorkCenterRate (P10) is recorded with its hours and no value, marked unvalued, and listed in the cost exceptions and P15's queue. A review writes its cost event once a rate is effective on its date, and P15 refuses to close a run that still has one | The user's call (§5 review), as Accounting splits guard failures by source (impl-accounting §4). The alternative was refusing the entry |
| Oct 28, 2026 | The three panes design §14 found missing are built, each in its phase with the Manufacturing context and written into crosscut (the Oct 28 design sweep): EquipmentDetail's Request maintenance (P11), Supplier360's subcontract orders (P14), and OrderDetail's production links, a sales order's supplying runs (P5) and a service PO's run and operation (P14) | The user's call (§5 review) |
| Oct 28, 2026 | The default allocation (P15): overhead at a rate per work-center hour, from WorkCenterRate's overhead component, times the run's actual setup and run hours; co-products by quantity normalized to a common unit. CostingPolicies also offers fixed shares on the BOM's output lines and relative sales value for co-products, and a percentage of direct labor or none for overhead | The user's call (§5 review): the review's recommendation, with the alternatives selectable. It is in crosscut §8 and design-accounting since the Oct 28 design sweep. The alternatives were the defaults alone, and relative sales value by default |
| Oct 28, 2026 | Held quantity in planning (design §14, crosscut §9): a pending-release line with the inspection's due date, left out of netting by default; the plan schedule's organization option nets held quantity whose inspection is due within the lead time (P13) | The user's call, in the Purchasing plan review (impl-purchasing §4, answer 12); the design's recommendation |
| Oct 28, 2026 | Phase order: methods, work centers and the production policy first; then the runs and their materials; cost evidence early, so each later fact writes its event as it is built; then quantities and quality, controlled changes, the shop floor and downtime, scheduling, supply planning, subcontracting, the cost close and reports | The user's call. The alternative was the run first (P5 before P2–P4), on Products P8's methods and a default policy |
| Oct 28, 2026 | Manufacturing builds crosscut CX-PLANNING (P13): PlanningRun, PlanningSuggestion and RequirementSupply, `run#SupplyPlan`, `get#SupplyPlan`, `store#PlanSchedule` and `convert#PlanningSuggestions`, and `Shared/SupplyPlanning` with the Manufacturing context. It converts make suggestions (P13) and outside-processing requirements to draft service PO lines (P14), the second for `BOSS_PURCHASING_BUYER` on the Manufacturing mount, which crosscut §3.20's Manufacturing row gains; the Mantle service checks `PURCHASE_ORDER_EDIT`, which that group holds (the plan review Q2 row below). Purchasing adds its mount and buy conversion when it is built, and Warehouse its mount and transfer conversion from its §7 | The user's call. The alternative was to wait for Purchasing, with SupplyPlanning, make conversion and the service PO conversion in §7. Warehouse had left CX-PLANNING for its owner (impl-warehouse §4) |
| Oct 28, 2026 | Mantle stands without BOSS, and business logic leans to Mantle. No Mantle service, SECA, EECA, script, data file or spec here calls `ironstone.*`, reads a BOSS screen, entity or setting, or names a BOSS group; each checks its Moqui permission and the organization itself, and a BOSS screen calls it after `ironstone.manufacturing.AccessServices`, with no pass-through. Moved: Accounting's cost close core to `mantle.ledger.ProductionCostServices` (`store#AllocationPolicy`, `preview#CostClose`, `post#CostClose`), with only `find#CostCloseQueue` left in `ironstone.accounting`; the ProductionCostReview topic to mr-mantle's data. `mantle.work`'s production, planning and report services and the timesheet hook, `mantle.product`'s methods and supply planning, and `mantle.request`'s requirement records stay Mantle, checking permissions in place of BOSS groups; record links route through Commons' `get#RecordLink`. P1 seeds the other five `PRODUCTION_*` permissions (Warehouse P16a seeded `PRODUCTION_VIEW` and `PRODUCTION_PLAN`) and `SUPPLY_PLAN_RUN`, and grants the seven, with `METHOD_VIEW` and the `QUALITY_*` permissions, to the Manufacturing groups; P14 seeds `SUPPLIER_PROFILE_EDIT` and grants `BOSS_PURCHASING_BUYER` four, and Purchasing P1 adds `SUPPLIER_SCORECARD_EDIT` | The user's call (plan review Q2): both rules are in impl-drawers-commons §4. The owner designs' names follow in the design sweep |
| Nov 3, 2026 | Disassembly needs `forwardIssuanceRepostEnabled` and `forwardReceiptRepostEnabled` on the kit owner's PartyAcctgPreference (Accounting's flags, F29–F32), not ProductionPolicy flags; §2's "behind its own ProductionPolicy flag" reads as Accounting's flag for these two reposts | F32's resolution, built in P9; written into design Disassembly and design-accounting's SECA table |
| Oct 28, 2026 | Explosion depth (P5, P13): the tree shows every level, but requirements and buildable quantity stop at a non-phantom sub-assembly, so its stock counts, and a phantom is blown through with its routing. P5's producible-now reads `get#BomExplosion`'s buildable quantity at the run's facility; P13 nets level by level, a sub-assembly's stock and supply before its own shortage is exploded. `fullBlowThrough` keeps the full depth for a caller that wants it; neither phase passes it | The user's call (plan review Q8), as Odoo does. Products P9 built it (F24) |
| Nov 12, 2026 | Owner contract built by impl-maintenance P3 (§4 there, F13, F49): "in maintenance" is an AssetMaintenance in process, in Mantle's `store#ProductionEquipment` guard (`EQUIPMENT_BLOCKED`) and WorkCenters.js' availability, not any open one dated now or earlier, so a planned maintenance work order and a maintenance request not yet started block nothing; the outage is Maintenance P5's. No Manufacturing spec asserted the open-record half; ProductionOrders, ManufacturingWorkCenters, ManufacturingDowntime and ManufacturingWorkOrders pass unchanged, and mr-boss MaintenanceWorkOrders checks the rule. The maintenance status flow's WeApproved and WeOnHold rows need MAINTENANCE_SUPERVISE, so the union of flows still refuses those moves to a user with neither that nor PRODUCTION_SUPERVISE (ProductionOrders' "seeded transitions carry their permission") |
| Nov 12, 2026 | Owner contract built by impl-maintenance P4 (its F25): `request#ProductionMaintenance` adopts its new AssetMaintenance into a Maintenance work order and links its request when the organization's MaintenancePolicy manages production requests (off by default: unchanged); the result names `workEffortId`. A maintenance request has one Asset or Facility target (`link#RequestRecord` refuses a second, `ONE_TARGET`). Its triage is Maintenance's Requests (closing this plan's F98), and the triage notice goes to the organization's maintenance planners. ProductionDowntime and ManufacturingDowntime pass unchanged; Mantle's MaintenanceIntake checks the handoff |
| Nov 12, 2026 | Owner contract built by impl-maintenance P5 (F14): ResourceUnavailability gains Maintenance's fields (reason and planned classification, work and step source, correction chain, revision, restoration) and `record#ResourceUnavailability` checks its caller by data: Manufacturing's entry is the equipment-fault stop it names (PRODUCTION_OPERATE or _SUPERVISE in the stop's organization; the P5 review: a stop not corrected and with no outage yet, the outage from its start, open), so `store#ProductionDowntime` calls it as before; a corrected (superseded) outage row is history, so ProductionShopFloor, ProductionCalendar, ProductionSchedule and WorkCenters.js read the row in force; `store#ProductionEquipment` also refuses equipment with an open outage (`EQUIPMENT_BLOCKED`, "in maintenance or out of service"; ProductionOrders gains the case in the P5 review); Downtime shows the outage's restoration ("Restored … by …", through the correction chain). ProductionDowntime, ProductionOrders, ProductionShopFloor, ProductionSchedule, ProductionReports, ManufacturingDowntime, ManufacturingWorkCenters, ManufacturingShopFloor and ManufacturingSchedule pass unchanged. Planned blocks (`store#WorkCenterOffline`) are left to Maintenance P15 |
| Nov 12, 2026 | Owner contract built by impl-maintenance P15 (F14): `store#WorkCenterOffline`'s planned block is written by `record#ResourceUnavailability` (kind RukPlanned, reason RurOffline, a new seed), which admits a scheduler or method engineer (PRODUCTION_SCHEDULE or METHOD_RESOURCES) of the work center's organization by data and, for Manufacturing, does not lock the facility (the moves after it run in their own transactions); a Maintenance resource administrator or supervisor may correct the block (`correct#`, replacing the P5 review's KIND_INVALID), and the withdraw ends the row in force of the block it names; ProductionCalendar's offline time includes a blackout or outage of a facility above the work center (its plant or building). ProductionSchedule, ProductionDowntime, ProductionShopFloor, ProductionOrders, ProductionReports, ProductionPolicy, ManufacturingServices, WorkCenters, ManufacturingDowntime, ManufacturingWorkCenters and ManufacturingSchedule pass unchanged |
| Nov 12, 2026 | Owner contract built by impl-maintenance P16 (its F171): `store#WorkCenterOffline`'s `record#` locks the WorkCenter row of its center (`ResourcePolicy.js` lockCenters), which the operation moves (transactions of their own after it) never write, and a booking of a facility locks the WorkCenter rows of it and the facilities above it before its own row, so a booking of the center, or of a facility inside it, cannot land under a new offline block unseen; the moves do not wait on it (the P15 hang was the Facility row, which the moves reference). The organizers of bookings a new offline block covers are told (`ResourceBookingNotice`). ProductionSchedule, ProductionShopFloor, ProductionDowntime, ProductionOrders, ProductionReports, ProductionPolicy, ManufacturingServices, WorkCenters, ManufacturingDowntime, ManufacturingWorkCenters and ManufacturingSchedule pass unchanged |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |

The design's other §14 items are `later` there and in §7.

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Manufacturing/` has six placeholders: Home, WorkOrders, ShopFloor, BillsOfMaterials, Planning and Settings. There are no Routings, WorkCenters, Quality, Subcontracting, Approvals or Reports areas; the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. The `BOSS_MANUFACTURING` artifact group has only the admin authz (`BOSS_MANUFACTURING_ADMIN` for ADMIN, `BOSS_MANUFACTURING_APPADMIN` for the admin group) | P1 adds the root user group and its `MANTLE_USER_ORG` authz |
| F2 | P0: Products P1 seeds `BOSS_MANUFACTURING_READ` as "Method reader" and `BOSS_MANUFACTURING_RESOURCE_ADMIN` as "Work-center administrator", beside `_METHOD`, `_METHOD_APPROVE` and `BOSS_MANUFACTURING_ADMIN` ("Manufacturing administrator"), and Products P9 seeds `_COST`. The design's are production reader and production/resource administrator, and eight more are unseeded | P1 corrects the two descriptions and seeds the eight |
| F3 | P0: neither `MANTLE_USER_ORG` nor `MANTLE_ACTIVE_ORG` filters WorkEffort, WorkEffortProduct, Asset or AssetIssuance; Facility's filter is in `MANTLE_USER_ORG` only (impl-warehouse F2) | Production rows through services (§2); plant scope through Warehouse's facility filter (P1) |
| F4 | P0: the Projects WorkItems `Timeline.qvue` lanes are sprints and milestones; a drag commits the move at once (`moveBar`); there are no resource lanes or offline shading | P12 extends it with a preview-only resource mode (M11), leaving Projects' behavior as it is |
| F5 | P0: the form XSD has `view-board`, `view-calendar` and `view-tree`, and the screen XSD `dashboard` and `number-card` (R-MFG-12) | WorkOrders' board and calendar (P5); the explosion and where-used trees; Home's Kpis (P16) |
| F6 | P0: BOSS has no `Shared/ProductionCostClose` or `Shared/SupplyPlanning`; impl-accounting §7 and impl-warehouse §7 each leave theirs for later | P15 builds the first, and P13 the second (§4) |
| F7 | P0: `create#ProductionRun` sets WetEvent, WepProductionRun, WeInPlanning and hours, requires a facility, and never sets `ownerPartyId` (Marble's NewRunForm and the spec pass none). With a produce product it writes WeptConsume rows from `get#ProductBomDetail`, which is single level and reads PatMfgBom with no date filter, so expired lines count | Warehouse P16a calls it with neither product (D15); P0 confirms. Legacy BOM reads stay for kits and migration comparison only |
| F8 | P0: `set#ProducedProductQuantity` always resets the run's status: WeComplete when every estimate is produced, otherwise WeInProgress, so on a draft or released run it starts the run. Its `recreate#ConsumeProductsFromProduce` deletes every WeptConsume row and rebuilds them from the WorkEffortProductAssoc view, which joins ProductAssoc of any type, not only PatMfgBom | Never called by BOSS (§2); `change#ProductionQuantity` (P7) is the target change |
| F9 | P0: the Default WorkEffort flow has no WeApproved → WeOnHold or WeApproved → WeInPlanning, and allows WeInPlanning → WeComplete, WeComplete → WeInProgress and WeClosed → WeInPlanning; WorkEffortOther adds → WeClosed from every open status. The framework's status check (`moqui-core` `service/call.rs` `check_status`) matches StatusFlowTransition by from and to only, ignoring `statusFlowId`, and skips a record with no status, so any `update#WorkEffort` accepts all three flows' transitions. Nothing leads from WeOnHold back to WeApproved, so a hold before start could only resume by starting | `transition#ProductionOrder` is the only path to a run's status (§2, P5); P5a seeds WeApproved → WeInPlanning with its unrelease guard (Warehouse P16a did not; impl-warehouse §4), and WeApproved → WeOnHold and WeOnHold → WeApproved, the last written into the design; P1 grants no raw update |
| F10 | P0: Mantle REST has `workEfforts` PATCH as an entity update, PUT `add#WorkEffortProduct`, POST `create#ProductionRun`, and the run display, produce-consume and pick reads. Marble's `updateRun` calls plain `update#WorkEffort` | P1 grants the Manufacturing groups no REST run path; P0 checks the other groups |
| F11 | P0: WorkEffortProduct is keyed by run, product and from date, with no unit, so it cannot hold two lines of one product. WorkEffort's `estimatedCost` is commented out; `ownerPartyId`, `actualCost` and the setup times exist. ProductionEstimate exists and is unused | Snapshot lines are the execution identity and the Wept rows a per-product aggregate in the stock unit (design M4); no write to `estimatedCost`; ProductionEstimate stays unused (R-MFG-27) |
| F12 | P0: `issue#AssetToWorkEffort` does not check the asset's status; it checks available to promise, and quantity on hand unless the facility's `assetAllowIssueOverQoh` is Y, which it is for ZIRET_WH. `issue#AnyAssetToWorkEffort` picks AstAvailable assets only | The production issue guard checks status and quantity itself: Warehouse P16b's refuses a held asset (HELD_STOCK) and a shortfall (QUANTITY_EXCEEDS_AVAILABLE) (P5b) |
| F13 | P0: `receive#Asset` takes `acquireCost` from its parameter, else the order item's standard cost or price, so production output without one has none (a TODO names the work effort's cost). The owner defaults to the order's customer, then the work effort's owner, then the facility's; the status to AstAvailable, overridden by the location type's `autoStatusId`. `post#AssetReceipt` with a null cost records AtrNoAcquireCost and posts nothing; a zero cost posts zero | Output and return receipts always pass `acquireCost` (design D12); P6's guard refuses one without it |
| F14 | P0: an issuance posts to WIP only when the work effort's `ownerPartyId` equals the asset's, otherwise to COGS; a receipt with a work effort credits WIP whatever the owner. A run with no owner, as Marble and the spec make them, books issues to COGS and output against WIP | `create#ProductionOrder` sets the owner (Warehouse P16a) and release sets it on the operations; stock carries the run's ID, never an operation's (R-SA-03, R-SA-07). P5 checks the demo runs |
| F15 | P0: `breakDown#Assembly` lowers the kit receipt through `update#AssetAndReceipt`, which calls `repost#Asset` (unpost, delete and re-post) when quantity or cost changes. `unissue#AssemblyComponents` unissues by the kit's current, date-filtered PatMfgBom quantities, and `unissue#Component` cancels the run's issuances in ID order through `cancel#AssetIssuance`, an update that fires AssetIssuanceGlRePost | P9 makes the kit receipt's reduction a dated reversing delta (§4) |
| F16 | P0: `get#InventoryProjectedInfo` reads production demand and supply from the MantleInventoryRunConsume and RunProduce documents: WorkEffortProduct rows of any purpose (pick assemblies too) on work efforts not Complete, Closed or Cancelled, so drafts count. Its facility is the run's facility's parent, meaning a run sits on a line under its warehouse; a run placed on the warehouse itself is missed. It needs search | P1's demo lines sit under ZIRET_WH, and NewWorkOrder puts a run on a line (P5); P13 nets by line and warehouse and tells kits apart |
| F17 | P0: `get#TimesheetApprovers` follows ProjTimesheetPolicy: by default the ProjectManager or Manager WorkEffortParty rows of each entry's project, where the project is the item if a WetProject, else its root, else the item itself; `line` uses the PrtManager relationship; `any` the TIMESHEET_APPROVE holders. `approve#Timesheet` needs an approver other than the owner on a completed sheet. The timers take a work type and a rate type | P10: operations carry the run as root and the supervisor's assignment counts as a manager's; the production rule is written into the design if it reduces to that |
| F18 | P0: the WorkTypes are management, labor, office, breaks, development, design, testing, meeting, support, project management, consulting and travel (the demo adds programming); no production work type. SkillType is seeded with no values. There is no RqtMaintenance request type; the maintenance types are vehicle, HVAC and cleaning, with no corrective type. AsMntCreated exists, and `create#AssetMaintenance` sets no status | P10 seeds the three work types; P1's demo the skill types; P11 RqtMaintenance and MntTpCorrective, and `request#ProductionMaintenance` passes AsMntCreated |
| F19 | P0: Mantle's demo has no production run, routing, line, work center, product maintenance or asset maintenance. ZIRET_WH (owner ORG_ZIZI_RETAIL) is the only facility. PatMfgBom rows exist for DEMO_1_1 and DEMO_3_1 (DEMO_SA_1, DEMO_SA_2, DEMO_RM_1) and DEMO_PA, the only PtPickAssembly kit (DEMO_1_1, DEMO_2_1). EQUIP_AB4 "Assembly Bot 4000" has two assets at ZIRET_WH | P1's demo builds on them |
| F20 | P0: Mantle's `ManufacturingServices.spec.js` (seven features) creates an ownerless run with a produce product, sets the produced quantity, issues, unissues, cancels and breaks down an assembly; it asserts no GL, transition or exact consume quantity. OrderToCashBasicFlow packs DEMO_PA through the pick-assembly services | Both pass unchanged, since ManufacturingServices keeps its behavior (§2) |
| F21 | P0: Marble's Manufacturing has 12 screen files and 23 forms (16 single, 7 list), matching ss-inventory; RunPickDocument is the print. `addRunProduct` calls `add#WorkEffortProduct` | Each maps to design §10.2's destination (P5, P7, P17) |
| F22 | P0: `MethodPolicy.js` reads only permissions, through `ProductAccess.js` (Products P9). Products P9's BossSetupData seeds `BOSS_MANUFACTURING_COST` and grants `METHOD_VIEW` to `_READ`, `_METHOD`, `_METHOD_APPROVE`, `_RESOURCE_ADMIN` and `_COST`; `METHOD_EDIT` to `_METHOD`, `METHOD_APPROVE` to `_METHOD_APPROVE`, `METHOD_RESOURCES` to `_RESOURCE_ADMIN`; `PRODUCT_COST_VIEW` and `METHOD_COST_EDIT` to `_COST`; and all of them with `METHOD_COST_APPROVE` to `BOSS_MANUFACTURING_ADMIN` | P1 adds only the new groups' grants and the production permissions. A cost estimator's cost read and the admin's method rights are these grants, so review I-MFG-09 needs no script change |
| F23 | P0: Projects' timesheet approval is Mantle's (`mantle.work.TimesheetServices` `get#TimesheetApprovers`, `approve#`, `return#` and `reopen#Timesheet`), which `ironstone.projects.TimeServices` calls. A rate changes through BOSS's `store#TimeEntryRates`, a plain `update#mantle.work.time.TimeEntry`, or `get#TimeEntryRate` with reset, so no Mantle timesheet service sees it | P10's hooks are in mr-mantle, the rate delta on the TimeEntry itself; nothing calls `ironstone.projects` |
| F24 | P0: Products P9's `get#BomExplosion` (`Boms.js` `explode`) returns `requirements` that stop at a non-phantom sub-assembly (`planningBoundary`) and, given a facility, a `buildableQuantity` from `get#AvailableInventory` for the BOM's organization; `fullBlowThrough` blows through every level. The tree rows still show every level | P5's producible-now reads `buildableQuantity`; P13 nets from `requirements` level by level (§4) |
| F25 | P0: Products §7 leaves for Manufacturing: its context on Product360, InventoryAvailability and Supplier360 (crosscut §3.5, §3.7, §3.21, §3.23); `check#ProductUsable` callers `run#SupplyPlan`, `convert#PlanningSuggestions`, `create#ProductionOrder`, `release#ProductionOrder`; production's use of released versions (snapshots, `create#ProductionOrder` off `get#ProductBomDetail`); WorkCenter capacity, alternates and load; the BillsOfMaterials, Routings and OperationTemplates screens. Warehouse P16 already built the first two callers: `Production.js` `usable()` calls `check#ProductUsable` (Produce) and `method()` reads ProductBom, not `get#ProductBomDetail` | Product360 → P2; InventoryAvailability → P5; Supplier360 → P14; the planning callers → P13; snapshot use and the create/release callers are done (P5 confirms in its spec); capacity and load → P3 (records) and P12 (load, alternates); the three screens → P2 |
| F26 | P0: Accounting §7 leaves for Manufacturing: ProductionCostClose and CostingPolicies (`mantle.ledger.ProductionCostServices` `store#AllocationPolicy`, `preview#CostClose`, `post#CostClose`; `find#CostCloseQueue`), ProductionAllocationPolicy, the ProductionCostReview topic (not seeded yet in mr-mantle data), Accounting's side of D12 and the cost-close part of §16.3; MyFinanceWork's runs awaiting cost close (from P16); the P11 period-close checks "WIP tie-out against the WIP account and open production runs" and "production runs awaiting cost close", each a `PeriodCloseCheck` row; Manufacturing on EquipmentDetail. Projects' cost posting already excludes production time (`ProjectCosts.js` `projectOf` returns null for a run's operations) | The topic → P6; the rest of the cost close, MyFinanceWork's runs and both PeriodCloseCheck rows → P15 (the plan's P15 names neither the period-close checks nor MyFinanceWork; add them); EquipmentDetail → P3, its Request maintenance → P11. Nothing for P10's labor side beyond F33–F35 |
| F27 | P0: Warehouse §7 leaves for Manufacturing: FacilityDetail, MaterialIssueReceipt, QualityInspection and InspectionTemplates contexts; the Components Stage action (Move) and ReceiveOutput's GenerateTracking; `amend#ProductionOrder`, `ProductionQuantityEvent`, instruction versions, `transition#ProductionOrder` with its hold; the guards' cost events; `record#ProductionLoss`, `request#SubcontractService`, SubcontractDetail; WorkOrders, NewWorkOrder, WorkOrderDetail; CX-PLANNING records and `run#SupplyPlan`/`store#PlanSchedule`; the suggestions on Product360's Replenishment tab; and the kit unused-component return and breakdown that cancel the newest issuances first under `kitCostFromComponents` (F283). The production pick mode stays §7; held quantity in planning is decided | FacilityDetail → P3; MaterialIssueReceipt, Stage, GenerateTracking, the lifecycle and the three WorkOrder screens → P5; cost events → P6; `ProductionQuantityEvent` and `record#ProductionLoss` → P7; QualityInspection and InspectionTemplates → P8; amendments and F283 → P9 (F30); instruction versions are P2's WorkEffortContent rows (§4, no version record); CX-PLANNING records and services → P13, which should also say whether Product360's Replenishment suggestions are its or §7 (unassigned today); subcontracting → P14 |
| F28 | P0: Projects §7 names nothing for Manufacturing. Adjacent items: `view-timeline` and Timeline baselines (P12 extends the `.qvue` Timeline, F4, and Projects' P4c leaves its terminal moves for later); clock-in for another (Time P6a/P6b), which the shared-station operator switch would need; `post#WorkEffortCost` is Accounting's and excludes production | None picked up; P12 keeps Projects' Timeline behavior (F4); the operator switch stays Manufacturing §7 (CX-DEVICE) |
| F29 | P0: with the asset owner's `PartyAcctgPreference.forwardIssuanceRepostEnabled` = Y (`entity/AccountingControlEntities.xml`, default N, audit-logged), every `cancel#AssetIssuance` that `breakDown#Assembly` makes is safe: the `AssetIssuanceGlRePost` SECA calls `repost#AssetIssuance`, whose `IssuanceAdjustments.js` leaves the posted history alone and posts one AcctgTrans dated now for (what should be posted − what was posted), idempotent by its `ia:` operation key, so it works in an open period and after the issue's period is closed or locked (AccountingControls spec covers the hard lock). The delta is a full recomputation: the debit account comes from the current mapping and the work effort's current owner, the cost from `ForwardInventoryCosts.at(asset, issuedDate)`, so any other drift is swept into it. With the flag off, the legacy path unposts and deletes the original and re-posts it at its old date, and `unpost#AcctgTrans` errors in a closed period, so the breakdown rolls back | P9's guard needs the flag on for the issuances' owner (as §4 says) and refuses naming it otherwise; nothing more on the issuance side |
| F30 | P0: the issuance side has two quantity problems. `unissue#Component` cancels a component's issuances oldest first, while `KitCost.js` values each kit at the next slice of issuances in issue order, so reversing a later kit at different component costs leaves a WIP residue when `kitCostFromComponents` = Y (Warehouse §7, F283). Its shipment branch (`assemblySisList`) takes `min(sis.quantity, quantityRemaining)` per ShipmentItemSource, mixing the kit's quantity with the component's and not bounding it by the issuance, so with several issuances a cancel can exceed one issuance's quantity and `cancel#AssetIssuance` errors ("Quantity to cancel … is greater than"). Also it unissues by the kit's current, date-filtered PatMfgBom (F15) | `reverse#SupportedAssembly` calls `breakDown#Assembly` with `unissueAssemblyComponents=false` and makes the cancels itself: the issuances of the slices KitCost used for the kits reversed, newest first, each `cancel#AssetIssuance` with an explicit quantity, and refuses when the issued quantities differ from those slices. A P9 spec with two packs at different component costs checks WIP nets to zero (not run here) |
| F31 | P0: `breakDown#Assembly` lowers `quantityAccepted` through `update#AssetAndReceipt`, which calls `repost#Asset` (receipts, then issuances, then physical-inventory variances of the kit asset). `repost#AssetReceipt` has no delta: it unposts and deletes the kit receipt's AcctgTrans and posts a new one at the receipt's `receivedDate`. In an open period the original transaction is gone and the new one is back-dated to the receipt day (no reversing pair, a new ID). In a closed period `unpost#AcctgTrans` errors ("time period closed") and the breakdown rolls back. The same call re-posts the kit's other issuances (a delta with F29's flag, else unpost/re-post) and its count variances (always unpost/re-post). With `kitCostFromComponents` = N the kit was received without cost (AtrNoAcquireCost), posted nothing, and the receipt repost is a no-op | P9 adds F32's receipt delta. Its guard refuses a kit asset with physical-inventory variances (no delta for them) and runs only with both flags on |
| F32 | P0: what P9 adds: a forward delta in `mantle.ledger.AssetAutoPostServices.repost#AssetReceipt`, `ReceiptAdjustments.js` beside `IssuanceAdjustments.js`, which posts (quantityAccepted × acquireCost, Dr inventory / Cr WIP for a work-effort receipt, else the receipt account) − the posted history as one AcctgTrans dated today with an operation key, leaving the original. The flag is Accounting's: `forwardReceiptRepostEnabled` on `PartyAcctgPreference` (AccountingControlEntities.xml, audit-logged, default N, added to `AccountingSetup.js` and `SetupServices.xml`'s preference lists), read for the asset owner, like `forwardIssuanceRepostEnabled` and per impl-accounting's Oct 28/Oct 30 rows (Accounting's flags live on PartyAcctgPreference). It is not a ProductionPolicy flag, since `repost#AssetReceipt` serves every receipt correction (also F39's `update#AssetAcquireCost`). A `receivedDate` change keeps the legacy path | Write into §4 and design Disassembly: "Disassembly needs `forwardIssuanceRepostEnabled` and `forwardReceiptRepostEnabled` on the kit owner's PartyAcctgPreference". §2's "behind its own ProductionPolicy flag" reads as Accounting's flag for these two. The receipt delta's spec tests the flag off (unchanged legacy) and on (open and locked period) |
| F33 | P0: the production approver rule already reduces as F17 hoped. `release#ProductionOrder` (`Production.js`) creates the operations as WetTask with `parentWorkEffortId` and `rootWorkEffortId` = the run, so under the default `project` policy `get#TimesheetApprovers` takes the run as the operations' project, and time on the run itself takes the run. Its ProjectManager or Manager WorkEffortParty rows approve. The supervisor in a Manager role on the run is enough, with no change to `get#TimesheetApprovers`. It does not reduce to the design's union, "the run's supervisor or the person's line manager": `line` uses PrtManager and falls back to the run managers only when the person has none, and `any` uses TIMESHEET_APPROVE holders. Approval is per week, so any approver of any project in the week approves all its entries (a project manager approves production time, and a run supervisor approves project time) | Write the design rule as "the organization's timesheet policy, the run being its operations' project and the supervisor a Manager on the run". Drop the ProductionPolicy approver flag and the `get#TimesheetApprovers` change. The line-manager union and per-entry approval go to §7, or get a flagged change if the user wants them |
| F34 | P0: the hook point has a precedent. `approve#Timesheet` and `reopen#Timesheet` call `mantle.ledger.OtherAutoPostServices.post#WorkEffortCost` after the status update; `TimeServices.store#TimeEntry` calls it for an entry of an approved week or one already posted; `delete#TimeEntry` calls it to reverse. `ProjectCosts.js` posts per entry (what should be posted while the sheet is approved − what was posted, keyed `wec:` + entry), so approve, reopen and edits are one idempotent delta. `return#Timesheet` is Completed → In-Process and had nothing approved, so it needs no hook. Approval reaches `update#Timesheet` only through these services (BOSS `ironstone.projects.TimeServices` calls them too) | P10: `mantle.work.ProductionServices.sync#ProductionLaborCost` (timesheetId, or timeEntryIdList and deleting) at the same four call sites, writing `record#ProductionCostEvent` deltas per entry whose work effort is a WepProductionRun or its operation, keyed by entry and revision. It does nothing for other entries, so Projects' behavior is unchanged. A missing costing rate records unvalued and adds no error. It sits behind a ProductionPolicy flag of the run's owner (§2). Alternative without touching TimesheetServices: an EECA on Timesheet `statusId` to or from TmshApproved (get-original-value) plus an EECA on TimeEntry when a cost field changes (F35), both in the same transaction |
| F35 | P0: the labor event's value never depends on the TimeEntry rate fields. Design Y2 values it at a `RateAmount` by `emplPositionClassId` and `workTypeEnumId`, never `vendorHourRate`, so F23's rate paths (`store#TimeEntryRates`, a plain `update#TimeEntry` of client and vendor rates, and `get#TimeEntryRate` with reset, which resets the rateAmountIds and rates) change no production cost. What changes it: `hours`, `breakHours`, `fromDate`, `workTypeEnumId`, `emplPositionClassId`, `workEffortId` and `partyId`. These change through `store#TimeEntry` and `delete#TimeEntry`, which refuse a submitted or approved week under the default lock, or through a plain entity update. A costing RateAmount correction is no TimeEntry change at all | F23's "rate delta on the TimeEntry itself" narrows to those fields (F34's call sites, or the TimeEntry EECA for plain updates). The event freezes `rateAmountId` and amount at approval. A RateAmount correction reaches a run through P15's review re-recording it, as unvalued machine runtime does (§4). Write into design ProductionTime |
| F36 | P0: `TimeEntryUpdateTask` (`entity/Work.eecas.xml`) runs `update#TaskFromTime` on every time change, which sets the operation's `actualWorkTime`, `actualCost` (hours × vendorRateAmount, the pay rate) and `actualClientCost`. `WorkEffortUpdateProject` (any WetTask with a root) then runs `update#ProjectTimeFromTask`, which overwrites the run's `actualWorkTime`, `estimatedWorkTime`, `remainingWorkTime`, `actualCost` and `actualClientCost` with the TaskTimeSummary of its operations. Commons `get#TaskAccess` returns those fields to anyone who sees the operation (only clients lose them) | Production never reads or writes WorkEffort `actualCost` or the work times of a run (extends F11). F38's guard keeps operations off the task surfaces, which also stops that read |
| F37 | P0: no BOSS group reaches a run through REST or `add#WorkEffortProduct`. `/mantle` (MANTLE_API) is authorized for ADMIN only, and `/mantle/my` has no work-effort path. No BOSS screen or service calls `add#WorkEffortProduct`, `create#ProductionRun` or a raw run update. The ironstone `update#mantle.work.effort.WorkEffort` calls are on projects (`get#ProjectAccess` requires WetProject), events and calendar items | F10 closes for REST; P1's ManufacturingAccess spec asserts a Manufacturing or Projects user gets 403 on `/rest/s1/mantle/workEfforts` |
| F38 | P0: a run's operations are tasks to Commons and Projects. They are WetTask, rooted at the run and owned by its organization. Commons (every internal user, `BOSS_USERS`; `ALL_USERS` until Nov 5): `check#TaskUpdate` and `get#TaskAccess` let an Assignee (or the owner party) Mark done from Today (`update#Task` → WeComplete), reschedule, `set#TaskStatus` to In Planning, In Progress, On Hold, In Review, In Testing, Complete or Cancelled, and `update#TaskField`. Projects (`Shared/WorkItemDetail`, `WorkItemServices.update#WorkItemField`, bulk `moveToProject`) also gives canUpdate to any non-client WorkEffortParty of the root run (a supervisor, or operators assigned on the run) and to a Manager on the operation: any status of the flow, estimates, parent, and `rootWorkEffortId` (moving it out of the run). `mantle.work.TaskServices.update#Task` and `set#TaskStatus` check no type. So a Projects or Commons user assigned to an operation can change its status, past `complete#ProductionOperation` and `PRODUCTION_OPERATE`. The run itself is WetEvent: `get#TaskAccess` refuses it, and Commons event edits need the organizer (owner = the organization) or a calendar editor, so its status is out of reach unless a run is put in a calendar | P1 (before P5's assignments): `get#TaskAccess` and `check#TaskUpdate` (BOSS, no Mantle change) treat a WetTask whose root is a WepProductionRun as not a task: found false for Projects, canUpdate false and a message pointing to the shop floor in Commons. P10 (F41) keeps Mark done off them in Today. Optional: a Mantle refusal in `update#Task` and `set#TaskStatus` behind a ProductionPolicy flag. P12 adds no run to a calendar (CalendarWorkEffort). ManufacturingAccess covers each path |
| F39 | P0: Commons `duplicate#Event` (EventServices) needs only view access. A run is visible to every user of its owner organization (`get#RecordLinkInfo`: ownerPartyId of it or its root) and to its parties. The copy goes through `clone#WorkEffort`, whose `copyProduct` defaults to true, so the result is a new WetEvent WepProductionRun owned by the user, In Planning, with WeptConsume and WeptProduce rows. `get#InventoryProjectedInfo` counts those (F16). Runs also show as events in Commons Calendar, EventDetail and Today to their parties | P1: `get#EventAccessInfo` (BOSS) treats a WepProductionRun as not an event (not found), so EventDetail, duplicate and the event edits refuse it. P5 checks that Today and Calendar leave runs out, through F41's exclusion |
| F40 | P0: the approval contract (impl-accounting F43, F132; impl-drawers-commons M2). A topic is a framework `NotificationTopic` seeded in mr-mantle data, with `inboxEnumId` NinNotifications. It counts as an approval (`get#UserNotifications` `approvals: true`, the tray's decide buttons, `approvalCount`) only when it has `approveServiceName`, with `refuseServiceName` and `refuseReasonRequired` as options, like TimesheetApproval. Accounting's BillApproval-style topics have none and are decided on the record, whose service marks the notification read. An app's Approvals screen (`Accounting/Approvals.xml`) sets `notificationTopics` and mounts `Commons/Notifications.xml`, which passes them as `topicList`. The root's `<shell-providers><notification-topic topic=…/>` lists them for the shell. BOSS data sets `linkTemplate` (BossAccountingSetupData). The sender notifies only the organization's users holding the deciding permission (`request#PayableApproval`) | P2 (method approval), P6 (ProductionCostReview), P9 (substitution, amendment), P14 if any: neutral topic names in mr-mantle data, sent by the Mantle verb to holders of the deciding permission. `Manufacturing/Approvals.xml` mounts Notifications with its topics, BOSS `linkTemplate`s go to WorkOrderDetail or the method, and the topics go in Manufacturing.xml's `<notification-topic>`. Decide on the record (no approveServiceName), since substitution and amendment need a preview; the decision service marks them read. Production timesheets stay on Projects' TimesheetApproval topic |
| F41 | P0: the Today provider is `<today-source service=… label="Manufacturing"/>` in the app root's shell-providers (`crates/moqui-core/src/screen/shell.rs`). `get#UserTodayItems` calls it in its own transaction with userId, partyId, fromDate and thruDate. It returns `{items, label}`, each item carrying the base fields (workEffortId, requestId, dueDate, startDate, endDate, allDay, priority, statusId, assignees, canUpdate, hasCallLink) plus kind, title and url. A failing source is logged and named. The pattern is `ironstone.warehouse.HomeServices.get#TodayItems` with `Today.js` (scope check, own user only, a source per kind, each failure-tolerant, the same rows as Home's Your work). The catch: Today's built-in group already lists an assigned operation (WetTask with the user's WorkEffortParty and a due date) with canUpdate, so the operations would appear twice and offer Mark done (F38). A run the user is a party on shows as an event | P10: `ironstone.manufacturing.HomeServices.get#TodayItems` lists the user's due operations (kind `productionOperation`, canUpdate false, url to OperationExecution, the run as record), and Home's work list reuses it. `get#UserTodayItems` (Mantle) leaves out WetTask rows rooted at a WepProductionRun and WetEvent rows with that purpose. That changes only what is displayed, and plain Mantle runs have no WetTask operations, but it is a Mantle change, so it gets a test of plain Mantle's unchanged output |
| F42 | P1: Products P8's released methods for DEMO_1_1 are spec fixtures (ProductsMethodFixtures), not demo data | P2 seeds a released demo method |
| F43 | P1: Warehouse's demo run `BOSS_WH_RUN` is WetTask, while `create#ProductionRun` makes WetEvent (F7) | The F38/F39 guards key on `purposeEnumId`, so both are covered; P5 may align the Warehouse demo |
| F44 | P1: F38's guard also refuses time on an operation through Projects' timers and TimeEntries and Commons' `clockIn#Task` and `add#TimeOnTask` | P10's ProductionTime provides the production time path |
| F45 | P1: a run's record link fell through to Commons (EventDetail or TaskDetail) | It opens Manufacturing, else Warehouse's MaterialIssueReceipt, else nothing |
| F46 | P1: Projects team users have no authorization for `get#RecordLink` | Unchanged; outside Manufacturing |
| F47 | P2: Products' `Methods.js` stored a routing with no `workEffortId` into the method's routing (native's fallback), so "New routing" for a product whose method has one edited that routing | P2 Built note |
| F48 | P2: Products' specs assume DEMO_1_1's MAIN and DEMO_3_1 have no method (ProductsMethodFixtures, ProductsMethodWalk), so the demo method is DEMO_1_1's PILOT | P2 Built note |
| F49 | P2: DEMO_1_1, DEMO_SA_1, DEMO_SA_2 and DEMO_RM_1 have no `amountUomId`, so `store#Bom` and `store#BomItem` need an explicit unit for them | P2 Built note |
| F50 | P2: Manufacturing users reach the Mantle method verbs and Products' `ironstone.products.MethodServices` only through the screens' inherited authorization (no artifact group grants them directly) | P2 Built note |
| F51 | P2: A screen-local variable named `selected` is passed to the shared `choices` transition (`in-map="context"`) as the selected value | P2 Built note |
| F52 | P3: The cost estimator (`BOSS_MANUFACTURING_COST`, no `METHOD_RESOURCES`) cannot add a work-center rate; only the admin can | Kept as built (resources plus cost authority); P6 or P15 decides whether the cost group adds rates |
| F53 | P3: The Mantle verbs the screens call are authorized through the screen they run in (the root's inherited authz), not the `BOSS_MANUFACTURING` artifact group, so a spec calls them as a user with artifact authorization disabled, as the Mantle specs do | P3 Built note |
| F54 | P3: `Calendar.qvue` found its transitions by a path element named `Calendar` | It also takes `ResourceCalendar` |
| F55 | P3: A released operation copies its run's estimated dates (Warehouse P16a), so the calendar and the load place each operation over its whole run until P12 schedules operations | P3 Built note |
| F56 | P3: ProductMethods' record-callback feature read "the" WorkCenterRate audit row without its key, so a rate made by another spec earlier in the same run (WorkCenters) broke it | P3 Built note |
| F57 | P3: Centers has no next-available or offline-reason columns and Equipment no downtime action | P11 and P12 |
| F58 | P4: The design's TimeAndCost "production approver rule" flag is not built (F33 dropped it) | The labor-cost flag is named instead in the design |
| F59 | P4: F38's optional Mantle refusal in `update#Task` and `set#TaskStatus` behind a ProductionPolicy flag is not built. | P4 Built note |
| F60 | P4: The walks' database outlives a `test-client --serve` run, so a walk that adds a record by a fixed code fails on its second run. | P4 Built note |
| F61 | P4: no policy row can start before now, so a run keeps its release-time policy without a copy on the run | P5 reads `get#ProductionPolicy` with the run; P4 Built note |
| F62 | P5a: A section-include of a template section that itself section-includes another section of the same template fails ("screen includes are nested too deeply"); WorkOrderDetail includes LifecycleActionRow directly. | P5a Built note |
| F63 | P5a: A tab's content is not in a qvt render with `lastStandalone: -2` (the tab loads apart), so the tab routes' texts are the header's, as FacilityDetail's are; the specs render a tab with `lastStandalone: "true"`. | P5a Built note |
| F64 | P5a: Product360 under Manufacturing failed for the Manufacturing groups ("Catalog read access is required"): Products' services need PRODUCT_CATALOG_VIEW, which no Manufacturing group held. | P5a Built note |
| F65 | P5a: `get#AvailableInventory` and `get#BomExplosion`'s buildable quantity read one facility; P5a passes the plant for a line's run (stockFacilityIds). | P5a Built note |
| F66 | P5a: StockPosting's `reasonOf` reads only codes with an underscore, so a batch row refused SHORTAGE read FAILED; batch#ProductionAction reads the code itself. | P5a Built note |
| F67 | P5a: For the merge: Production.js gained two exports and a staged-short check in `issuePlan` (P5b, P7 and P9 edit it too); BossSetupData's new artifact group sits before the record-link group. | P5a Built note |
| F68 | P5a: Warehouse's BOSS_WH_RUN is still WetTask (F43); left, since the guards key on the purpose. | P5a Built note |
| F69 | P6: ProductionCostReview has no BOSS `linkTemplate` and no `<notification-topic>` in a root: its readers are Accounting's posters, who need not open Manufacturing. | P6 Built note |
| F70 | P6: An issue of material without a cost is not refused (the plan names only output and return receipts): it posts nothing (AtrNoAcquireCost) and its event is unvalued and not posted. | P6 Built note |
| F71 | P6: receive#ProductionOutput always has a cost (the frozen standard, else the WIP to date, COST_UNAVAILABLE without), so the F13 output refusal is the event writer's backstop for another path; the return is refused before it posts. | P6 Built note |
| F72 | P6: An output receipt that costLines splits (the last unit at the remainder) is two AssetReceipts with two transactions, so it writes two events. | P6 Built note |
| F73 | P6: Movements made before P6 (Warehouse's demo, earlier runs) have no events. | P6 Built note |
| F74 | P6: For the merge with P5a: ProductionCosts sits in `WorkOrders/WorkOrderDetail/`, so WorkOrderDetail's directory mounts it as its Costs tab (`default-menu-index="6"`). | P6 Built note |
| F75 | P6: ManufacturingCostsWalk reads BOSS_WH_RUN, whose costs come from WarehouseProductionWalk earlier in the suite; run alone it sees no costs and checks the empty state instead of the review request. | P6 Built note |
| F76 | P13: `get#InventoryProjectedInfo` reads the search index (available in specs on the Postgres search backend, but filled by the data feed after commit, so a spec must index by hand). | P13 Built note |
| F77 | P13: `create#ProductionOrder` takes `planningSuggestionId` but stores only `demandRequirementId` (and the order line); the suggestion's run is RequirementSupply's `workEffortId`, with its `planningSuggestionId`. | P13 Built note |
| F78 | P13: `create#ProductionOrder`'s operation key is scoped per user (StockPosting `storedKey`), so it cannot keep two users from covering one demand; the requirement's lock and covered quantity do. | P13 Built note |
| F79 | P13: No supplier lead time exists to date a buy suggestion; its release date is its required date until Purchasing adds supplier lead times (impl-purchasing). | P13 Built note |
| F80 | P13: A kit assembled for an open order has issued its components (stock is lower) while its order is still demand, so the components count twice until the order ships; kit assemblies are made at packing, so the window is short. | P13 Built note |
| F81 | P13: In a form-list row, a link to `.` carries the row's field of the same name as a screen parameter (`methodEnumId`), which made Explain filter the list to the row's method; the link passes the filter values explicitly (an empty value clears). | P13 Built note |
| F82 | P13: The routing lead time (PltRouting) is the standard hours as days of 24 hours, rounded up, until P12 brings the work calendar; the time fence only warns (INSIDE_TIME_FENCE). | P13 Built note |
| F83 | P13: `ManufacturingPlanningFixtures` runs in the whole mr-boss suite as Warehouse's fixtures do, adding a Retail sales order of its own product at ZIRET_WH (a new order id per load, since the walks' database outlives a run, F60). | P13 Built note |
| F84 | P5b: Declared but absent in-parameters arrive as null in a JS service module, so `p.field !== undefined` cannot tell "not given" from "cleared"; store#ProductionMaterial treats an empty field as "keep", unless `clearEmpty` (review, below). | P5b Built note |
| F85 | P5b: Payables `notify` leaves the actor out of the recipients, so a planner's own staged release does not notify that planner; the spec checks a second planner. | P5b Built note |
| F86 | P5b: The method's material lines come from the explosion in no fixed order (lineSeqNum follows it), so specs find a line by product, not position. | P5b Built note |
| F87 | P5b: For the merge: Production.js (re-explosion keeps manual lines; two exports), ProductionOrders.js (the notice call in release's apply), Warehouse's Production.js (`runSource(p, app)`), Products' Inventory.js and InventoryAvailability Summary and Policy, … | P5b Built note |
| F88 | P7: A status field on a new record needs its StatusFlowTransition rows: the framework's status check refused PlsPending → PlsApproved until `ProductionLoss`'s flow was seeded. | P7 Built note |
| F89 | P7: receive#ProductionOutput's limit now counts losses (a process loss or a loss waiting lowers what may be received; an output scrapped back stays counted, as scrap in place of good, so it frees nothing); with no policy row and no loss it is the old target − … | P7 Built note |
| F90 | P7: Nothing completes an operation before P10, so complete closes the untouched operations with the run; P10's `complete#ProductionOperation` should make OPERATION_OPEN the usual refusal. | P7 Built note |
| F91 | P7: Products' label contract (`prepare#ProductLabels`) labels a product by its identifier for catalog scope; a production label needs the asset, lot, run and hold state, so `get#ProductionLabels` follows its template and barcode and Products could add an item … | P7 Built note |
| F92 | P7: `find#ProductionLosses` checks each loss's run (no WorkEffort filter, F3) and pages in memory, capped at 2000. | P7 Built note |
| F93 | P7: For the merge: Production.js (`outputPlan`'s limit and `hold`, the `writeProducts` export), ProductionCosts.js (sources, `issuanceEvent`, `actualsOf`), ProductionOrders.js (complete, `factsOf`, `blockedReasons`, the request fields), ProductionServices.xml … | P7 Built note |
| F94 | P7: ManufacturingAccess's P7 tab feature reads the process loss its first P7 feature records. | P7 Built note |
| F95 | P7: (P10) Complete marks operations never reported WeComplete with no time, which reports (P16) and scheduling (P12) would read as done work. | P7 Built note |
| F96 | P7: Good and pending output need STOCK_ISSUE (Warehouse's grant, §2 P1), which BOSS_MFG_OPERATOR lacks: an operator alone can record losses but not receive output; the Quantities dialog still offers good and pending. | P7 Built note |
| F97 | P7: (P5b merge) change#ProductionQuantity scales every PrlrMaterial line, so P5b's manual material lines scale too; the merge should decide whether a manual line keeps its quantity. | P7 Built note |
| F98 | P11: Commons' RequestDetail lets only the request's people (reporter, assignee, customer) comment and add tasks. | P11 Built note |
| F99 | P11: `_openDialog` does not open a `container-dialog` inside a form-list row in qvt; Downtime answers a report with the new stop selected and a top-level Maintenance dialog for it instead. | P11 Built note |
| F100 | P11: (resolved in review) A reason's `approvalThreshold` (minutes for a stop) was not applied. | P11 Built note |
| F101 | P11: A correction does not move or end the outage it carries: MT-07's `correct#` and `end#ResourceUnavailability` own that. | P11 Built note |
| F102 | P11: The maintenance request's RequestWorkEffort link to the stopped operation makes the operation a row of the Commons and Projects request's Tasks or Work tab; F38's guards refuse its changes there, and the Manufacturing context links it to its work order … | P11 Built note |
| F103 | P11: F57's Centers columns (next available, offline reason) are not built; P12 adds them with the load. | P11 Built note |
| F104 | P8: There is no operation start before P10, so "an in-process failure blocks the dependent operation's start" is the operation's readiness and its `startAllowed` (and the run's resume); P10's start must call `operationGate`. | P8 Built note |
| F105 | P8: (fixed in review) QualityInspectionDecision had one link template, Warehouse's (`/qapps/Warehouse/QualityInspection`), so a production inspection's decision notice opens Warehouse, which a Manufacturing inspector may not reach. | P8 Built note |
| F106 | P8: RequirementSupply has no sales order item, so a planned run's demand cannot be pegged from it; R-SA-10 reads OrderItemWorkEffort and the run's own demand fields. | P8 Built note |
| F107 | P8: P7's get#ProductionQuantities counted a receipt held by its asset's status; a partial Release splits the released units off and leaves the receipt's asset quarantined, so they counted held. | P8 Built note |
| F108 | P8: store#InspectionTemplate takes every header field when templateName is given, an empty one clearing it; the production fields are taken only with `productionApplicability`, so Warehouse's form, which does not show them, never clears them (the template … | P8 Built note |
| F109 | P8: For the merge: Quality.js and QualityServices.xml (Warehouse P8's; P14's subcontract receipt holds output through `outputInspections`, which now takes a gate argument), Production.js (`release`, `outputPlan`, `postOutput`, the export list), … | P8 Built note |
| F110 | P12: A center's recurring work hours expand in the viewing user's time zone (the BOSS demo shift's recurrence has no `timeZone`), so users in two zones see a plant's shift at different wall times, and the BOSS spec reads the shift's start in the scheduler's zone. | P12 Built note |
| F111 | P12: A transition that answers JSON must call a Mantle verb that may refuse in a new transaction (`requireNewTransaction`): a refusal marks the transition's transaction rollback-only and the screen answers an exception, not the JSON. | P12 Built note |
| F112 | P12: Release still copies the run's dates to every operation (F55), so a released run's operations overlap and show predecessor conflicts until they are scheduled; release places nothing forward by the center's scheduling policy. | P12 Built note |
| F113 | P12: A refused override request leaves the requester no notice (it leaves the schedule's request list); Capacity's list pages by work center (the service's center paging set on its rows); "include tentative" is not offered (drafts have no operations); the … | P12 Built note |
| F114 | P14: BossManufacturingDemoData loads before BossWarehouseDemoData (alphabetical), so a Manufacturing demo row on a Warehouse demo product fails its foreign key and skips the whole file, and the user file after it; the coating price is at the end of … | P14 Built note |
| F115 | P14: `unapply#InvoiceMatch` and `reevaluate#InvoiceMatch` write no reversal of the variance event; P15's cost close should reverse a variance whose match line is reversed (the event names its match line). | P14 Built note |
| F116 | P14: ORG_ZIZI_RETAIL has no PartyAcctgPreference of its own; a currency read of an organization must take `find#PartyAcctgPreference`'s ancestor walk. | P14 Built note |
| F117 | P14: `approve#Order` needs ORDER_APPROVE, which no Manufacturing or buyer group holds; a converted service order is placed and approved in Purchasing (and the bill match needs an approved order). | P14 Built note |
| F118 | P14: Shared/Supplier360's subscreen tabs render client side in qvt, so AppStructure checks the root mount and the Subcontract orders tab is checked by ManufacturingSubcontracting's html render. | P14 Built note |
| F119 | P14: A group whose mount offers an action must hold every permission the action's Mantle service checks; here the conversion's supplier-price read. | P14 Built note |
| F120 | P9: A `link` to a transition that has actions (a wizard's Next) navigates the client to the transition's URL and renders an empty page; SplitWorkOrder's Back and Next link to the screen with the step, and its forms post to `toStep`, as NewWorkOrder does. | P9 Built note |
| F121 | P9: With `postingGuardEnabled`, the legacy receipt repost under a hard lock of the receipt's day does not fail: it deletes the posted transaction and leaves the new one unposted in the error journal, so the history is lost (F31 expected an error); … | P9 Built note |
| F122 | P9: `Production.js` `release` (the method's routings) and `get#BomExplosion` need METHOD_VIEW, so a split's internal release and an amendment's review need it too; a planner or supervisor without it is refused METHOD_INVALID. | P9 Built note |
| F123 | P9: For the merge: Production.js (`keepMethod` in `release`, the `method` export), ProductionServices.xml (the appended P9 section), AssetAutoPostServices.xml (`repost#AssetReceipt`'s first two actions), AccountingControlEntities.xml, AccountingSetup.js, … | P9 Built note |
| F124 | P10: ProductionOrders.js's `missingSkills` (P5a) and ProductionSchedule.js (P12) read `mantle.party.PartySkill`, which is no entity (`mantle.humanres.ability.PartySkill`), so an assignment's or a schedule's skill check errored once a template had a skill standard. | P10 Built note |
| F125 | P10: The built-in ProductionMachineRuntime default is Not recorded, so `record#MachineRuntime` is refused (MACHINE_RUNTIME_OFF) until a policy row records it; the demo's line A row does. | P10 Built note |
| F126 | P10: A Projects timer stopped within a minute is discarded (deleted, `stop#Timer`), so a start then an immediate completion leaves no time: the specs move a timer's start back, and the walk's fixture records earlier time. | P10 Built note |
| F127 | P10: Release copies the run's dates to its operations (F55, F112), so an operation's due date in Today and the queue is the run's end until it is scheduled. | P10 Built note |
| F128 | P10: (F90, F95) Complete now refuses unreported operations (OPERATION_UNREPORTED); the opt-in completeOnFinalReceipt closes them as before. | P10 Built note |
| F129 | P10: ProductionCostEvent.timeEntryId was a foreign key to TimeEntry, so a labor event naming it kept a reopened week's entry from being deleted (`delete#TimeEntry` runs the reversal, then deletes the entry its events name). | P10 Built note |
| F130 | P10: The labor hook runs in the approval's transaction: an entry whose event cannot be computed is logged and passed over, but a failure of the event's write would roll back the approval. | P10 Built note |
| F131 | P10: For the merge: ProductionServices.xml (`record#ProductionCostEvent`'s `sourceRemoved`, `transition#ProductionOrder`'s `closeUnreportedOperations` and its description, the appended section), ProductionCosts.js (the sources and `record`'s null event), … | P10 Built note |
| F132 | P15: The cost close data file sorted before ProductionCostData (alphabetical load order) and failed on the missing enumeration type, skipping the whole file; it is `ProductionCostingData.xml`. | P15 Built note |
| F133 | P15: BOSS_ACCOUNTING_APPROVE (PRODUCTION_COST_POST) had no authz on Accounting Inventory; granted, so the approvers' menu shows Inventory (AccountingShell updated). | P15 Built note |
| F134 | P15: The Accounting demo users work in BOSS_ACCT_ORG, not Retail, where the Manufacturing demo runs are; the BOSS spec makes Retail finance users of its own, and the demo adds `manufacturing.costclose` for the Manufacturing mount. | P15 Built note |
| F135 | P15: A Mantle spec that counts every event of a type (ProductionSubcontract's variances) breaks when another spec of the run writes one; scoped to its organization. | P15 Built note |
| F136 | P15: For the merge: ProductionOrders.js (close action), ProductionCosts.js (the source signature now `(id, removed, revision)`), Production.js (`outputPlan`), BossAccountingSetupData (Inventory authz, artifact group, topic link), BossManufacturingDemoData and … | P15 Built note |
| F137 | P15: (review) The by-product was received at its share of the primary's standard × target (2/12 of 50 = 4.165 a unit), but Products' rollup already nets the primary's standard of the by-products' shares (Costs.js scales its lines by the main share) and the … | P15 Built note |
| F138 | P15: (review) PcmFixedShare gave the primary `100 −` the others' shares, but a BOM line's `allocationShare` is a fraction of one (Boms.js, Costs.js), so a 0.2 by-product took 0.2 % of the cost; the primary now takes `1 −` the others. | P15 Built note |
| F139 | P15: (review) An adjustment after the close defaulted to the review's proposed accounting date (the close's, likely a closed period by then), and the screen hid the date after the close; an adjustment is now dated today unless given, and ProductionCostClose … | P15 Built note |
| F140 | P16: A center whose machines record no runtime (a manual line, or a policy of PmrNotRecorded) has run time = planned time less downtime, named on its row; P10's completion counts count held output as good (`productionGoodQuantity` = good + pending), so a … | P16 Built note |
| F141 | P16: In a first try, a field's `hide="!financialRead"` left a money column's header in the reader's html render of a report; the P16 review found the column chooser (`select-columns`) listed a hidden field's title | Fixed in mr-moqui 477f9e89: the column chooser leaves out a field its `hide` hides, in html, qvt and tui; mr-boss `test/Projects/ColumnChooser.spec.js` checks it. The reports keep their two form-lists by financial read |
| F142 | P16: Home's Kpis read the OEE, loss, load and (financial read) cost reports on each render; fine at demo scale, a cache or a scheduled snapshot (Insights) later. | P16 Built note |
| F143 | P16: Insights' catalog registration (design Z10) waits for Insights; the report services and the dashboard are the providers it registers. | P16 Built note |
| F144 | P16: For the merge: Manufacturing.js (P16 block before `operations`), HomeServices.xml (the P16 block where the "later phases" comment was), Home.xml (Kpis section after the Summary), ManufacturingSpecLib.js (P16 routes at the end of routeFixtures), … | P16 Built note |
| F145 | W6: the shop floor's Complete form had no Lot field, so a lot-required output (WarehousePoliciesWalk makes DEMO_1_1 lot required) could not be completed from OperationExecution (LOT_REQUIRED) | The form takes the lot on the output operation, as Quantities does |
| F146 | P17: ServerStatic never covered Manufacturing, so P5a's `server-static="qvt"` on WorkOrderDetail/Notes was not checked: the static report counted the parent's always-actions `check#Record` as a side effect the form request repeats. | P17 Built note |
| F147 | P17: `ec.screen.staticReport` reported Disassembly clean, but marked `server-static="qvt"` its static qvt render failed in AppStructure ("cannot read property 'componentRows' of null"). | P17 Built note |
| F148 | P17: No access hole found: every route, transition, verb, export, print, palette, link, scan, board, search, drop-down, notice and other app's shared context checked refuses the other organization, and money is left out without financial read. | P17 Built note |
| F149 | P17: ClientIsolation failed twice on a reused `--db snapshot` database: its secret `7777` is a substring of the snapshot's load time (a timeline `dateMillis` of 1793777737346), not P17's change; on a fresh load it passes, with both walks (26 features). | P17 Built note |
| F150 | P17: A `sharedLinks` link (`//Manufacturing/...`) renders disabled (`href="#"`) under a test's Manufacturing root screen, so the specs check the Snapshot and Print links by their text or `renderMode`. | P17 Built note |

## 7. Later

Designed, not in this build:

- **The design's `later` rows:**
  - AssemblyViewer and WallDisplay (the `BOSS_MANUFACTURING_DISPLAY` group is seeded in P1, with nothing to open);
  - Nonconformances and Gauges, with crosscut CX-QUALITY's NCR, CAPA and calibration;
  - DemandForecasts, MasterSchedule and FiniteSchedule;
  - CustomerMaterialJobs (inward processing);
  - Batches and BatchDetail (M9).
- **Other design items:**
  - merging compatible drafts (R-MFG-40);
  - WhereUsed's Draft replacement revisions, and the ChangeNotices link from compare (R-MFG-32);
  - the variant-applicability editor (Products P8 adds `applicabilityFeatureIds`, which the explosion reads);
  - the design §14 items: component reservation and a production pick mode with `AssetReservation.workEffortId`,
    general unbuild of produced output, a shared-station operator switch (decided, design §13 L5; it waits on the
    framework device credential, CX-DEVICE), and deferred cost posting;
  - General manufacturing unbuild; kit disassembly is P9's (§4).
- **The rest of supply planning (CX-PLANNING):** Purchasing's mount and its conversion of ordinary buy suggestions to
  POs or purchase requests, Warehouse's mount and its transfer conversion, and RequestDetail's buy and make
  requirements with their RequirementSupply links (impl-warehouse §7).
- **Other apps' contexts:** Purchasing, Warehouse and Customer Service on the shared screens Manufacturing builds first
  (ProductionCostClose, SupplyPlanning), beyond Accounting's on ProductionCostClose.
- **Other apps' callers:** Purchasing placing and approving the service PO, and its supplier portal's subcontract view
  (design SubcontractDetail, External access); the Maintenance app adopting the AssetMaintenance records (picked up
  in impl-maintenance P3).
- **The labor costing purpose (Nov 11, 2026; the user's call):** there is one labor costing purpose, `RaprCost`.
  impl-people P10 seeds it, builds `mantle.humanres.RateServices.get#CostingRate` and Accounting's deferred
  LaborCostingRates form, and changes what P10 here built to it: the `RaprProductionCost` rows (the seed in mr-mantle
  data/ProductionShopFloorData.xml, the demo's rates, a deployment's rows by a data update) become `RaprCost` and the
  lookup in `ProductionShopFloor.js` calls `get#CostingRate`. It is an owner contract with Manufacturing, whose specs
  are kept passing (impl-people §4, its F34).

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo production user, and walk each built phase's
  "usable when" in order.
- **Design §10.3's acceptance review and crosscut §6,** scenario by phase. The walks named are acceptance tests, run
  with `./moq accept mr-boss` when asked, except `ManufacturingWorkOrdersWalk`, the app's one golden-path client walk
  in the regression suite:

| Scenario | Phase | Covered by (checked in P17) |
| --- | --- | --- |
| Product variant to supplier price, partial receipt and failed inspection | P5b and P8 (held stock is never issued); the receipt, bill and payment are Purchasing's, Warehouse's and Accounting's | mr-mantle WarehouseProduction and ProductionMaterials (held stock refused, HELD_STOCK; a shortfall with held stock issues nothing), ProductionQuality (output received held, complete refused while pending); BOSS ManufacturingMaterials, ManufacturingQualityWalk |
| Shortage to buy, make or transfer, partial production, finished stock and GL | P13 (conversion), P5 (release and issue), P7 (partial output, loss and returns), P6 and P15 (cost and GL) | mr-mantle SupplyPlanning, ProductionQuantities, ProductionCosts, ProductionCostClose (the posted close read through the cost report); BOSS ManufacturingPlanning, ManufacturingAccessWalk (plan, convert, release, issue, partial receipt on the shop floor, the rest received, complete), the Planning, Quantities, Costs and CostClose walks |
| Order reservation, pick shortfall, substitute or replan | P9 (substitute), P8 (pegged reservation at release); shipment and invoice are Warehouse's and Accounting's | mr-mantle ProductionChanges (an approved substitute issued, an arbitrary product refused), ProductionQuality (a disposition reserves the pegged order item first); BOSS ManufacturingChangesWalk |
| Customer return, inspection, rework or scrap | P7 (rework and scrap), P8 (disposition); credit and refund are Accounting's | mr-mantle ProductionQuantities (rework and scrap, a held output scrapped back to the run), ProductionQuality (disposition through the loss path); BOSS ManufacturingQuantitiesWalk |
| Physical count while production issues and receives | P5b's movements under Warehouse's count cutoff (its P10) | BOSS ManufacturingAccessWalk (a blind count open while the component is issued: the review finds the issue, a conflict to recount, nothing posted); mr-mantle WarehouseCounts (a move during counting) |
| Intake, assignment, reopen and resolution | P11 (downtime and quality requests); SLA and CSAT are Customer Service's | mr-mantle ProductionDowntime (a fault with its maintenance request; closing the stop leaves the request open); BOSS ManufacturingDowntime, ManufacturingDowntimeWalk |
| Released BOM or routing changes; missing instruction | P9 (amendment), P10 (the instruction gate); the gauge is §7 | mr-mantle ProductionChanges (amendment, strict release), ProductionShopFloor (a start waits for the acknowledgment); BOSS ManufacturingMethods, ManufacturingShopFloor, ManufacturingChangesWalk, ManufacturingShopFloorWalk |
| Cancellation, partial completion and retry | P5 (cancel and retry), P7 (partial), P9 (split); batches are §7 | mr-mantle ProductionOrders (cancel, unrelease, retries), ProductionChanges (split, a posted run reversed or closed out), ProductionQuantities (complete refused until reconciled, a retry posts nothing twice); BOSS ManufacturingWorkOrders |
| Unauthorized action and standalone app | `ManufacturingAccess` for each access rule a phase adds; P17 | BOSS ManufacturingAccess, ManufacturingAccessWalk, ManufacturingIsolationWalk and ManufacturingCostIsolationWalk (P17) |
| Subcontract dispatch and output receipt | P14, on Warehouse P15 and P16 | mr-mantle ProductionSubcontract; BOSS ManufacturingSubcontracting, ManufacturingSubcontractWalk |
| Production cost close (design-accounting §16.3 production-to-GL) | P15 | mr-mantle ProductionCostClose; BOSS ManufacturingAccess (P15), ManufacturingCostCloseWalk |

- **Phone width.** The handheld mounts at 390 px are acceptance tests; no screenshots.
