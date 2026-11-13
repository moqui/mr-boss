# IronStone BOSS — UI review: Manufacturing

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Manufacturing through the work of method engineers, planners, operators, supervisors, quality
staff and production accountants: prepare a released method, plan and release work, supply the floor, record what
happened, resolve exceptions and explain the completed order's cost. Follow the same work order across those roles.
The daily workspace should make its plant, product, method date, operation, quantity basis and next permitted action
clear, including when a reader cannot change the record, open an area or see its financial values.

This follows [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase); it is the plan and running record of the
Manufacturing review: inventory, activities, coverage, findings, decisions and bounded execution notes.

**Status: planning only.** Written 2026-11-10 America/Chicago in the four-app documentation batch and checked against
source on 2026-11-11 (§6). All live activity and mode coverage is pending. No review runtime, browser or terminal
walkthrough, test, build, production mutation or commit was performed to write or check it. Historical implementation
results and existing tests are starting points; they do not establish review outcomes.

### Inputs and reference patterns

- [Manufacturing design](design-manufacturing.md), [implementation](impl-manufacturing.md) (built P0–P17; what is left
  is its §7), [research](research-manufacturing.md) and [implementation notes](../docs/ManufacturingImplementation.md).
- Companion reviews [Accounting](ui-review-accounting.md), [Warehouse](ui-review-warehouse.md),
  [Purchasing](ui-review-purchasing.md) and [Customer Service](ui-review-customer-service.md);
  [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../../plans/archive/UI-Refinement.md).
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and current Products, Warehouse, Purchasing, Accounting, Projects and
  [Maintenance](impl-maintenance.md) contracts where they supply methods, physical movements, service purchase orders,
  financial authority, time records or the planned adoption of maintenance records.
- `screen/Manufacturing.xml`, `screen/Manufacturing/`, its mounted `screen/Shared/` sources and descendants,
  the eight `template/Manufacturing*.xml`, the Warehouse transfer/quality templates it reaches, `service/ironstone/manufacturing/`,
  Products' `SharedContext.js`, `data/BossSetupData.xml` (the `BOSS_MFG_<Area>` artifact groups), `data/BossUsersDemoData.xml`,
  `data/BossManufacturingDemoData.xml`, `data/BossWarehouseDemoData.xml` and Mantle `ZcaProductDemoData.xml`.
- Current Manufacturing regression and acceptance specs, `ManufacturingSpecLib.js`, `ManufacturingStandaloneLib.js` and
  the client suite registrations; Mantle's `test/work`, `test/product` and `test/ledger` production specs. Current
  source takes precedence over older proposed routes, superseded role descriptions and broad "Later" paragraphs.

Use the earlier research as a comparison lens: Carbon's production/operator separation, ERPNext's material and
work-order continuity, Odoo's method-to-operation navigation, and the Moqui baseline's records and services. These
are patterns documented in that research, not fresh claims about external products or a requirement to build their
feature inventories. A comfortable operator workflow and a trustworthy handoff matter more than matching a screen
count or introducing a new board.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Manufacturing shell, plant choice, lists, forms, shop floor, reports and app-specific context | BOSS Manufacturing; `AccessServices.get#SharedContext` and `check#Record` establish app entry, plant and record scope; the `BOSS_MFG_<Area>` artifact groups close six areas to the root group (§2) |
| BOM, routing, operation templates, released methods and cost estimates | Mantle owns the rules; Products' shared screens and `SharedContext.js` (`manufacturingTabs`, `manufacturingPaths`) serve the Manufacturing mounts; preserve the same dated method identity |
| Work orders, production operations, quantities, changes, planning, downtime and production cost facts | Mantle `ProductionServices`, `ProductionPlanningServices`, `ProductionReportServices`, `RoutingServices`, `WorkCenterServices` and `SupplyPlanningServices`; BOSS supplies presentation and app context |
| Staging, issues, unused returns, output receipts, held stock and vendor custody | Warehouse's guards, `Warehouse/Transfers/Move` and shared MaterialIssueReceipt; Manufacturing's mount supplies the run context and its own record checks, not new stock authority |
| Inspections, templates, verification and disposition | Shared QualityInspection/InspectionTemplates and Mantle quality/production rules; review production gates and the inspection-station mount, with a second consumer for a shared correction |
| Subcontract demand, agreement, service PO and shipment | Manufacturing owns operational demand/status; Purchasing owns placement/approval/change and acceptance evidence (`Purchasing/Orders/OrderDetail`); Warehouse owns dispatch/return and the output receipt (`Warehouse/Transfers/SubcontractShipmentDetail`). Mantle's `receive#SubcontractOutput` atomically records custody issues, output receipt, service acceptance and accrual under `STOCK_ISSUE` |
| Cost estimates, actual WIP, requested review and cost close | Manufacturing owns operational facts and review requests; Accounting owns financial authority and costing policies; shared ProductionCostClose and Mantle `mantle.ledger.ProductionCostServices` own preview, posting and return-to-production |
| Time and follow-up tasks | Projects' timesheet services and Commons request/task screens; production operations remain production work, never ordinary tasks or calendar events |
| Maintenance requests from downtime | Mantle `request#ProductionMaintenance` makes an AssetMaintenance (`AsMntCreated`) and an `RqtMaintenance` Request shown through Manufacturing's RequestDetail/WorkItemDetail mounts. The Maintenance app (`screen/Maintenance`) is a placeholder with its grant commented out; adopting these records is [impl-maintenance](impl-maintenance.md)'s later work |
| Chatter, RecordFiles, approvals, notifications, palette and Today | Existing Commons/shared surfaces; inspect Manufacturing identity, audience and return routes without repeating a complete Commons review |
| Timeline, calendar, station, handheld widgets, print and TUI | Existing framework/Projects/Commons components plus Manufacturing's adapters; shared causes belong at their owner |

Preserve routes, record keys, operation identity, expected revisions, method dates, preferences and service/entity
contracts. Record unavoidable compatibility changes before implementation. An app mount is a presentation context,
not permission: restricted costs, rates, supplier prices, foreign plant records and private evidence must be absent
from responses, choices, files and outputs, not merely hidden by the screen.

Do not build absent features to finish this review. AssemblyViewer, WallDisplay, general manufacturing unbuild,
Nonconformances/Gauges, forecasts/master/finite scheduling, customer-material jobs, batches, component reservation with
a production pick mode, deferred cost posting and a shared-station operator switch remain outside this pass. Kit
disassembly, controlled amendments, live scheduling, supply planning and cost close are built and remain in scope.
There is no Manufacturing-owned PASS app: the supplier portal's subcontract view (mr-pass
`Supplier/OrderAcknowledgement`, service lines and components in custody) is Purchasing's bounded external handoff and
is included here only to explain a subcontract's status.

## 2. Review method and refinement criteria

The generic method is the [UI review guide](../../../../../docs/dev/UI-Review.md):
[preparing an isolated review](../../../../../docs/dev/UI-Review.md#prepare-an-isolated-review), activities and coverage,
[judging the result](../../../../../docs/dev/UI-Review.md#judge-the-result) (viewports, themes, keyboard, contrast,
terminal) and [recording, fixing and verifying](../../../../../docs/dev/UI-Review.md#record-fix-and-verify). Products
shows it executed: its [§2](ui-review-products.md#2-review-method-and-refinement-criteria) and
[execution setup dispositions](ui-review-products.md#execution-setup-dispositions). This section keeps only what is
specific to Manufacturing.

### Environment

- **Bootstrap.** Link Mantle and BOSS individually into an isolated runtime with copied configuration, a fresh
  disposable database, captured mail and local outputs; the guide's framework-only bootstrap leaves `component/` empty
  and is not enough. A linked component is source: uploads, issued files and exports land in the disposable runtime.
  Fixture specs beyond demo data run as focused acceptance runs (§5). Use the release binary and embedded Postgres;
  the coordinator starts further instances as needed (§7).
- **Prerequisites seen in executed reviews.** Embedded Postgres may need host (unsandboxed) shared memory, with every
  runner at one process-visibility level; delegated agents may have no browser tools; an isolated runtime may need
  webroot assets materialized before the terminal works; an automated tool-approval review may block a posting or
  send. Choose a free non-default port (another local Moqui may hold the defaults and is not stopped; Products used
  57820) and a hostname per browser identity. Record which apply in the first batch.
- **Shared runtime and concurrency.** The coordinating agent decides whether the five companion reviews share one
  runtime and manages the concurrent review agents (user decision, 2026-11-11). In a shared one it owns the lifecycle,
  no demo record is consumed by two reviews, and Retail-wide changes (PUR-27's purchasing policy rows, CS-21/22's
  `returnSettlementRequired`, MFG-06's production policy, MFG-17's forward repost flags) stay in their own batch and
  are restored, or isolated in another organization, before another review's dependent activity. In separate runtimes
  a review prepares the other side of a handoff as setup without reviewing it. Orderings: "Fixtures a wave consumes"
  below.

### Organizations, plants and records

- **Retail** (`ORG_ZIZI_RETAIL`) owns the plant **`ZIRET_WH`** with lines **`BOSS_MFG_LINE_A`** (calendar
  `BOSS_MFG_CAL_LINE_A`, two slots, 30 `DEMO_1_1`/hour, approved machine rate `BOSS_MFG_LINE_A_MACHINE`, alternate line
  B) and **`BOSS_MFG_LINE_B`** (no calendar or slots: Capacity names them missing), equipment `EQUIP_AB4_1`/`_2`
  (Mantle demo robots) and the line A shop-floor policy (piece rate, `laborCostSync`, optional machine runtime).
- Method: **`BOSS_MFG_BOM_PILOT`** of **`DEMO_1_1`** (components `DEMO_SA_1`, `DEMO_SA_2`, `DEMO_RM_1`), routing
  **`BOSS_MFG_ROUTING_A`** (operations `_10`, `_20`) from templates `BOSS_MFG_OPT_ASSEMBLE` and `BOSS_MFG_OPT_TEST`;
  reasons `SCRAP_DAMAGE`, `PROCESS_LOSS`, `ROBOT_FAULT`, `CHANGEOVER`, `MATERIAL_HOLD`, `METHOD_CHANGE`; no
  ProductionPolicy row at the organization or plant (every value inherited), and line A's own row.
- Runs: draft **`BOSS_MFG_RUN_A`** (no lines); running **`BOSS_MFG_RUN_Q`** with weld template `BOSS_MFG_QTMPL`, gate
  `BOSS_MFG_QGATE_1` and draft inspection **`BOSS_MFG_INSP`** assigned to the inspector; closed changeover stop
  `BOSS_MFG_DT_1`. Warehouse's released **`BOSS_WH_RUN`** (operation **`BOSS_WH_RUN_OP`**, coating at Ziddleman; a
  `WetTask`, impl F43/F68), its placed service order **`BOSS_WH_SUB_PO`**, dispatch **`BOSS_WH_SHIP_SUB`** and the
  vendor-custody facility **`BOSS_WH_VENDOR`** are Warehouse's subcontract fixture, shared with Warehouse's WH-30/31 and
  several Manufacturing walks. Kit: `DEMO_PA` (Retail) or `BOSS_WH_KIT`; no assembled kit is seeded on hand.
- Foreign scope: **`BOSS_MFG_SVC_PLANT`**, **`BOSS_MFG_SVC_LINE`** and **`BOSS_MFG_SVC_RUN`** in
  **`ORG_ZIZI_SERVICES`**, read by `manufacturing.services`. `ManufacturingStandaloneLib.js` builds the isolated
  `BOSS_P17_ORG` and capability-specific users for the access walk; inspect its setup before borrowing it. Accounting's
  `BOSS_ACCT_ORG` (with `finance.approve`) is not Retail and sees no Retail run.
- Acceptance fixtures (`ManufacturingPlanning/Subcontract/Schedule/ShopFloorFixtures`) create their own runs each load;
  they are not an authorized bootstrap (§7).

### Identities and grants

All nineteen `manufacturing.*` users are Retail agents except `manufacturing.services`, carry `BOSS_USERS`, and have no
user time zone. Groups and permissions as seeded (verify in the loaded fixture):

| User | Groups beyond the root `BOSS_MANUFACTURING` | Permissions that matter here |
| --- | --- | --- |
| `manufacturing.read` | `_READ` | `PRODUCTION_VIEW`, `METHOD_VIEW`, `PRODUCT_CATALOG_VIEW`; no other launcher |
| `manufacturing.plan` | `_PLAN` | `PRODUCTION_PLAN`, `SUPPLY_PLAN_RUN` |
| `manufacturing.schedule` | `_SCHEDULE` | `PRODUCTION_SCHEDULE` |
| `manufacturing.method` / `.methodapprove` | `_METHOD` / `_METHOD_APPROVE` | `METHOD_EDIT` / `METHOD_APPROVE` |
| `manufacturing.operate` | `_OPERATE` | `PRODUCTION_OPERATE`; assembly (3) and coating (2) skills; no `STOCK_ISSUE` |
| `manufacturing.material` | `_OPERATE`, `BOSS_WAREHOUSE`, `BOSS_WAREHOUSE_ISSUE`, `BOSS_WAREHOUSE_MOVE` | `PRODUCTION_OPERATE`, `STOCK_ISSUE`, `STOCK_MOVE`, Warehouse launcher; assembly skill (2) |
| `manufacturing.supervise` | `_SUPERVISE` | `PRODUCTION_SUPERVISE` (not `PRODUCTION_PLAN`, not `STOCK_ISSUE`) |
| `manufacturing.inspect` / `.verify` / `.qualityadmin` | `_QUALITY_INSPECT` / `_QUALITY_VERIFY` / `_QUALITY_ADMIN` | `QUALITY_INSPECT` / `QUALITY_VERIFY` + `QUALITY_DISPOSE` / `QUALITY_TEMPLATE_EDIT` |
| `manufacturing.cost` | `_COST` | `PRODUCT_COST_VIEW`, `METHOD_COST_EDIT`, `PRODUCTION_COST_REVIEW`; no `ACCOUNTING_VIEW` |
| `manufacturing.finance` | `_READ`, `BOSS_ACCOUNTING_READ` | `ACCOUNTING_VIEW`, `PRODUCT_COST_VIEW`; no Accounting launcher |
| `manufacturing.costclose` | `_READ`, `BOSS_ACCOUNTING_APPROVE` | `PRODUCTION_COST_POST`, `ACCOUNTING_VIEW` and Accounting's other approvals (`FISCAL_CLOSE`, `INVOICE_APPROVE`, `PAYMENT_RUN_APPROVE`, ...); no Accounting launcher |
| `manufacturing.buyer` | `_READ`, `BOSS_PURCHASING_BUYER` | `PURCHASE_ORDER_EDIT`, `SUPPLIER_PRICE_VIEW` and the buyer's other grants; **no Purchasing launcher** |
| `manufacturing.resource` | `_RESOURCE_ADMIN` | `METHOD_RESOURCES`, `PRODUCTION_POLICY_EDIT`; no cost write, so no rate edit |
| `manufacturing.admin` | `_ADMIN` | every Manufacturing permission and `FACILITY_ALL_ORGANIZATIONS`; still no `STOCK_ISSUE`, `ACCOUNTING_VIEW`, `PURCHASE_ORDER_EDIT` or `PRODUCTION_COST_POST` |
| `manufacturing.services` | `_READ` (Services agent) | the foreign-scope reader |
| `manufacturing.display` | `BOSS_MANUFACTURING_DISPLAY` only | no root access; WallDisplay is unbuilt |

**Area access.** Home, Work orders, BOMs, Routings, Work centers and Reports are open to every root member. The
`BOSS_MFG_<Area>` groups deny the root group and allow: Shop floor (and ReportDowntime) to operate, supervise and admin;
Quality to inspect, verify, quality admin, supervise and admin; Planning to plan, schedule, supervise, the Purchasing
buyer group and admin; Subcontracting to plan, supervise, the buyer group and admin; Settings to the resource
administrator and admin; Approvals to the method approver, supervise and admin; NewWorkOrder/QuickCreate to plan and
admin. So the reader, finance reader, estimator and cost-close approver cannot open Shop floor (including
ProductionTime), Planning (including Capacity and the snapshots), Subcontracting or Settings.

**Composite grants no demo user holds.** Prepare and record each one an activity needs (§7): `PRODUCTION_SUPERVISE` +
`STOCK_ISSUE` (a fact-bearing cancellation that returns issues, MFG-16); `PRODUCTION_PLAN` + `PRODUCTION_SUPERVISE`
(backorder-and-complete, MFG-15; only `manufacturing.admin`); `METHOD_RESOURCES` + cost write (a work-center rate,
MFG-05; only `manufacturing.admin`); `PRODUCTION_SCHEDULE` + `PRODUCTION_SUPERVISE` (a direct override apply, MFG-22;
only admin); `retail.manufacturing.gl`, a Retail `ACCOUNTING_GL_POST` holder with the Manufacturing root
(preview-only, MFG-28), one of the prepared Retail finance identities of
[Accounting §2](ui-review-accounting.md#prepared-retail-finance-identities); an `ACCOUNTING_ADMIN` holder to see
ProductionSettings' CostingPolicies link. The Accounting queue's Retail approver (`retail.finance.approve`) is
ACC-24's. The cross-app counterparts are `purchasing.buyer` (Purchasing launcher, buyer of Ziddleman; no
Manufacturing root) and Warehouse's own users.

Verify loaded memberships, permissions and organizations before interpreting a refusal. Pair each refusal with an
otherwise-valid success by a holder and name the grant the refused fixture lacks; a missing field, invalid status or
wrong organization is not permission evidence. `manufacturing.admin` is neither a scope negative nor a universal
positive.

### Dates and zones

- Use the real clock in the review machine's current zone (America/Chicago on current machines; it will vary) and
  record both; no DST or second-zone checks (user decision, 2026-11-11). Demo timestamps carry no zone and the users
  none, so the server's zone applies.
- Seeded dates: methods, capacities and the line A rate from 2026-11-01; line A's weekday 06:00–14:00 shift recurs from
  2026-11-02; shutdown day 2026-11-27; `BOSS_MFG_RUN_A` planned 2026-11-10 08:00 to 2026-11-12 17:00 and
  `BOSS_MFG_RUN_Q` due 2026-11-06 (both overdue at execution); `BOSS_WH_RUN` released 2026-10-25 and
  `BOSS_WH_SHIP_SUB` due 2026-11-03; the weld template and reasons from 2026-01-01. The schedule fixtures place runs on
  a Monday a week or more ahead.
- Prepare dated policy, rate and instruction boundaries relative to the execution date; a fixed demo week is not a
  useful current schedule.

### Representative data

- Simple and routed orders, an empty draft, an ordinary release, staged shortage, partial good output, rework, scrap,
  held output, secondary output, completed and cost-closed runs. Retain separate records for cancellation, splitting,
  kit reversal and a retry after an uncertain response.
- Two effective method dates, released and draft lines, a non-phantom subassembly, a phantom, missing/cyclic method
  findings, incompatible units, and instruction content published before/after release. A method change must not
  silently rewrite a released order's facts.
- Available, reserved, held, expired and counted stock; tracked lots/serials, fractional units, supplier custody,
  two candidate lots and a same-looking asset in another plant. Stock quantities and cost layers are separate facts.
- Working hours, shutdown/offline time, alternate centers, limited slots, predecessor conflicts, an unscheduled
  operation, missing calendar/rate, a stale move preview and an explicit override decision.
- Long/localized names, multiple repeated row dialogs, two actors changing one reviewed record; mixed-validity BOM and
  routing CSV, an invalid instruction attachment, output labels and multipage travelers, captured approval
  notifications. Hardware printing and a real carrier are not needed to review the local content.

### Fixtures a wave consumes

Preserve a baseline and clone or create disposable records; record which of these a batch changed.

- `BOSS_MFG_RUN_A` is the specs' and access walk's draft: create new drafts for MFG-07/08 rather than releasing it.
- `BOSS_MFG_INSP` is the Quality walk's and specs' draft inspection: MFG-13 uses an inspection on a disposable run.
- `BOSS_WH_RUN`, `BOSS_WH_SUB_PO` and `BOSS_WH_SHIP_SUB` are Warehouse's WH-30/31 fixtures and the Changes,
  Quantities and Costs walks read them: record nothing on them; MFG-26 uses the subcontract MFG-25 creates.
- Across reviews: PUR-21 places MFG-25's draft before MFG-26 dispatches and reads its acceptance after MFG-26's
  receipt (in separate runtimes this review places it as `purchasing.buyer` as setup); MFG-27's requested review on
  one completed run is ACC-24's queue entry, and MFG-28 closes a different run.
- A maintenance request from downtime leaves an open AssetMaintenance, which blocks assigning that equipment to a run
  (`EQUIPMENT_BLOCKED`); no built Manufacturing surface is known to complete it (to verify at execution). Use
  `EQUIP_AB4_2` or disposable equipment for MFG-21 and keep `EQUIP_AB4_1` for MFG-07/22.
- MFG-06 policy changes and MFG-17's forward repost flags change later releases and postings for the whole
  organization: serialize them, restore policy before Wave 2, and set the flags only for MFG-17's batch.
- MFG-28's post closes the run (`WeClosed`); MFG-29/30 need both a closed and an open completed run.

### Manufacturing criteria

Apply the guide's judging criteria; these are the area's distinctions.

- Material `/qapps` in light and dark is the target, at the guide's sizes. Give the shop floor, scan inputs, quantity
  dialogs, split wizard, timeline and inspection station deliberate narrow/touch and keyboard coverage instead of
  multiplying every screen by every mode.
- Station (`Station.qvue`, `Station.tui.json`), ProductionSchedule (Projects' Timeline, `ProductionScheduleTui`) and
  ResourceCalendar (Commons' Calendar, `ResourceCalendarTui`; no html mode) each have a browser board and a distinct
  terminal path; a successful JSON render is not the terminal interaction. Standard `/apps` shows fallback text for
  Station and Schedule: a truthful limitation, not a blank board.
- Keep work order, operation, product, plant and release/method date visible. Distinguish required, issued, returned,
  remaining, produced, received, held, scrapped and accepted quantities; an operation complete, a work order complete
  and a financial close are different outcomes.
- Explain blocked actions with the specific code the service gives (shortage, predecessor, inspection gate,
  instruction acknowledgment, revision, equipment block, area or permission) and a useful path to resolve it.
- Inspect state and quality chips, timeline bars, conflict shading, disabled controls, negative variances and selected
  cards in both themes; never rely on color alone.
- Scan empty, unknown, ambiguous ("The code names several operations") and foreign codes; a physical scanner's
  terminator and a repeated scan must not submit a stale operation. Keep gloves/touch density and long operator
  instructions readable.
- A drag previews; a deliberate confirmation commits. Cancel, Escape and backdrop dismissal change nothing. A reviewed
  operation cannot silently become a different row or plant after a late response, plant change or permission loss.
- After each action inspect persisted stock, quantity/time/cost events, revision, approval and ledger effects. An
  unchanged retry with the same operation key answers the first result; independent conversion, import or offline-move
  failures name their item and leave successes usable; a coordinated stock or cost operation stays atomic.
- Restricted costs, rates and supplier prices are absent, not zero, in HTML, JSON, CSV/XLSX cells and prints. Inspect
  actual bytes: units, identity, dates, source revision, HELD warnings, page breaks, barcode/text identity and totals.
- Manufacturing's Today operation opens the operation, not a Commons task with Mark done; Manufacturing declares no
  Assist prompt, so expect only generic page context.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Establish methods and plant context | MFG-01–06 | Workday and area access, released methods, resources and effective policy |
| 2. Plan and supply a work order | MFG-07–09, 22–24 | Draft/release, scheduling, requirements, make conversion and materials |
| 3. Execute and reconcile the floor | MFG-10–13, 18–21 | Partial output, loss, quality, scan/instructions, time and downtime |
| 4. Recover controlled changes | MFG-14–17 | Substitution/amendment, split/backorder, cancellation and supported kit reversal |
| 5. Follow outside processing | MFG-25–26 | Buyer handoff, Purchasing placement, vendor custody and returned output |
| 6. Explain and close production | MFG-27–30 | Cost facts/review, financial close, reports and actual outputs |
| 7. Reconcile evidence and boundaries | MFG-31–32 and open continuations | Shared surfaces, permission/scope pairs, return routes and remaining modes |

Start with MFG-01 and a disposable MFG-07/08 path to establish identities, area access and modes. Permission pairs,
evidence and recovery run through every wave. Continuations, each kept in its originating ledger row:

- MFG-02/03 method release → MFG-08 run release → MFG-19 frozen instruction; MFG-12 template → MFG-08 gate → MFG-13.
- MFG-23 plan → MFG-24 make draft → MFG-08; MFG-23 → MFG-25 outside-processing request.
- MFG-19/20 operation, time and MFG-13 inspection → MFG-10/11 output and completion → MFG-27/28.
- MFG-25 draft service PO → Purchasing placement (PUR-21, through PUR-11–13's controls) → MFG-26 dispatch and
  receipt → MFG-27 accrual.
- MFG-21 downtime/maintenance → MFG-22 capacity and conflicts, and MFG-07 equipment assignment.
- MFG-14–16 quantity and material corrections and MFG-16's residual close → MFG-27/28 → MFG-29/30.

### Review and refinement phases

Execution runs as the guide's [two separate passes](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)
(user decision, 2026-11-11):

1. **Review pass.** Concurrent review agents under one coordinating agent execute every activity in the waves above
   and record each outcome, its evidence and every finding in §6. They change no source and no design or
   implementation record, and they correct nothing. A defect that stops a step is recorded; the walk continues from a
   disposable workaround named in the finding, or the step is marked blocked. The coordinator assigns activities,
   owns the runtime or runtimes, sequences fixture consumption and temporary setting changes, and restores them (§2).
   The pass ends when every activity of this review and of its companion reviews has a ledger outcome.
2. **Refinement pass.** Only after the review pass ends, the coordinator triages the whole findings register together
   with the companion reviews' registers: merge duplicates and shared causes, assign the owning layer (BOSS, Mantle or
   framework) and order by severity. Findings are then addressed in bounded batches: correct → rerun the affected
   activities → verify (§5) → record the retest in the finding. A deferred or accepted finding keeps its reason.

## 3. Screen and surface inventory

Paths below are relative to `/qapps/Manufacturing`, with `/apps/Manufacturing` for applicable Standard/print entry.
There are **70 local XML screens including the root** (plus `ShopFloor/Station.qvue` and `Station.tui.json`), and many
more route instances through shared descendants. The same source mounted twice is two consuming contexts. Section
roots and their defaults are included; a trailing `/` may render the default child instead of its parent.

### Local routes

| Path prefix | Local screens / surfaces | Activities |
| --- | --- | --- |
| App root | `Manufacturing`, `Home`, `ReportDowntime` | MFG-01, 21, 31–32 |
| Section roots | `WorkOrders`, `ShopFloor`, `BillsOfMaterials`, `Routings`, `WorkCenters`, `Quality`, `Planning`, `Subcontracting`, `Settings`, `Approvals`, `Reports` | MFG-01, 32 (area access) and the section's activities below |
| `BillsOfMaterials/` | `Find` | MFG-02, 04, 30 |
| `Routings/` | `Find`, `OperationTemplates` | MFG-03, 12, 19, 30 |
| `WorkCenters/` | `Centers`, `Equipment`, `ResourceCalendar`, `ResourceCalendarTui`, `Downtime` | MFG-05, 21–22 |
| `Settings/` | `ProductionSettings`, `ReasonCodes` | MFG-06, 11, 21, 28 |
| `WorkOrders/` | `Find`, `NewWorkOrder`, `QuickCreate`, `WorkOrderDetail`, `Disassembly` | MFG-01, 07–08, 17 |
| `WorkOrders/WorkOrderDetail/` | `Overview`, `Components`, `Operations`, `Quantities`, `ByProducts`, `Quality`, `ProductionCosts`, `Changes`, `SplitWorkOrder`, `Notes` | MFG-07–16, 22, 27, 31 |
| `WorkOrders/WorkOrderDetail/` | `Traveler`, `PickSheet`, `OutputLabels`, `QualityChecklist` | MFG-09–13, 30 |
| `ShopFloor/` | `Station`, `OperationExecution`, `Instructions`, `InstructionsPrint`, `ProductionTime` | MFG-18–20, 30 |
| `Quality/` | `Inspections`, `ScrapLoss`, `InspectionStation`, `InspectionStation/Scan`, `QualityCertificate` | MFG-11–13, 30 |
| `Planning/` | `ProductionSchedule`, `ProductionScheduleTui`, `Capacity`, `ScheduleSnapshot`, `PlanSnapshot` | MFG-22–24, 30 |
| `Subcontracting/` | `SubcontractOperations`, `SubcontractDetail`, `SubcontractInstructions` | MFG-25–26, 30 |
| `Reports/` | `ReportIndex`, `WorkOrderStatusReport`, `MaterialReport`, `OperationPerformanceReport`, `LossReport`, `QualityReport`, `ProductionCostReport`, `BillOfMaterialsVarianceReport`, `PlanningReport` | MFG-29–30 |

### Defaults and shared mounts

Root → `Home`; WorkOrders → `Find`; ShopFloor → `Station`; BillsOfMaterials/Routings → `Find`; WorkCenters →
`Centers`; Quality → `Inspections`; Planning → `SupplyPlanning`; Subcontracting → `SubcontractOperations`; Settings →
`ProductionSettings`; Approvals → `Notifications`; Reports → `ReportIndex`; WorkOrderDetail → `Overview`;
InspectionStation → `Scan`. Check defaults through navigation and a direct URL, not source order alone.

| Consuming route | Source / descendants / context | Activities |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | Shared browser panel and hidden XML terminal twin, including note/timeline interaction, AJAX helpers and canonical host keys | MFG-31–32 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared browser panel and hidden XML terminal twin; file listing/download and browser delegation where needed retain the same host key and authority | MFG-31–32 |
| `Approvals/Notifications` | Commons Notifications filtered to the eight decision topics: `BomRelease`, `RoutingRelease`, `ProductionStagedRelease`, `ProductionLossApproval`, `ProductionOverproduction`, `ProductionScheduleOverride`, `ProductionSubstitution`, `ProductionAmendment`. The root's other topics (`ProductionRelease`, `ProductionShortage`, `ProductionQualityBlock`, `QualityInspectionDecision`, `ProductionScheduleChange`) reach the shell notifications only; `ProductionCostReview` has no Manufacturing topic (impl F69) | MFG-02–03, 08, 11, 13–14, 22, 31 |
| `BillsOfMaterials/BillOfMaterialsDetail` | Shared BillOfMaterialsDetail, default `Overview`; explicit `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | MFG-02–04, 14, 30 |
| `BillsOfMaterials/WhereUsed`, `BillsOfMaterials/CostRollup`, `Routings/RoutingDetail` | Shared standalone method/cost routes in Manufacturing context; method and cost permissions remain independent | MFG-03–04, 27, 30 |
| `BillsOfMaterials/Product360` | Shared Product360, default `Summary`; Manufacturing's `productTabs` are `Summary`, `Identifiers`, `Dimensions`, `BOM`, `Costs` (cost read only), `Stock`, `KitComponents` (pick assemblies only), `Documents` | MFG-04, 09, 17, 27, 31–32 |
| `BillsOfMaterials/Product360/BOM` | The same BOM detail/default and its four children, under the product mount | MFG-02–04, 14, 32 |
| `BillsOfMaterials/Product360/Stock` | Shared InventoryAvailability: `Summary` and `Projection` serve Manufacturing; `Locations`, `Movements` and `Reservations` are conditioned to Warehouse, and `Policy` excludes Manufacturing | MFG-09, 23, 32 |
| `BillsOfMaterials/Product360/Documents/Index` | Shared Documents through the Documents tab; document identity and file authority remain the product's | MFG-04, 31–32 |
| `Planning/InventoryAvailability` | The same Shared InventoryAvailability and conditions; direct planning context differs from the Product360 stock mount | MFG-09, 23–24, 32 |
| `Planning/SupplyPlanning` | Shared SupplyPlanning (`runPlan`, `storeSchedule`, `convertSuggestions`); parameters, schedule, suggestions, held quantity, demand/supply and snapshot links. On this mount a planner converts make and a buyer outside processing; buy and transfer rows are shown, not convertible | MFG-23–25, 30, 32 |
| `WorkOrders/WorkOrderDetail/MaterialIssueReceipt` | Shared MaterialIssueReceipt as the Materials tab; issue, backflush preview/confirm, receive output and return unused, plus Components' Stage stock to `/qapps/Warehouse/Transfers/Move` | MFG-09–11, 14, 32 |
| `WorkOrders/WorkOrderDetail/ProductionCostClose` | Shared ProductionCostClose as the "Cost close" tab; Accounting's `Inventory/ProductionCostClose` queue is a separate consumer | MFG-27–28, 32 |
| `Quality/QualityInspection`, `Quality/InspectionStation/Inspection` | Shared QualityInspection in full and operator (handheld) contexts; each has its own entry and return route | MFG-13, 30–32 |
| `Quality/InspectionTemplates` | Shared InspectionTemplates (tab "Templates") with Manufacturing context; dated template and characteristic dialogs | MFG-12–13, 32 |
| `WorkCenters/FacilityDetail` | Shared FacilityDetail, default `Overview`; Manufacturing's `facilityTabs` are `Overview`, `WorkCenter`, `Files`, `Conversation` | MFG-05, 21–22, 31–32 |
| `WorkCenters/EquipmentDetail` | Shared EquipmentDetail with the Manufacturing equipment context and `reportStop`/`requestMaintenance`; financial book content is separately protected | MFG-05, 21, 27, 32 |
| `WorkCenters/RequestDetail`, `WorkCenters/WorkItemDetail` | Shared maintenance request and its follow-up task; embedded tabs/panels rather than physical child routes; production operations are rejected as ordinary tasks | MFG-21, 31–32 |
| `Subcontracting/Supplier360` | Shared Supplier360, default `Overview`; Manufacturing's `SubcontractOrders`, `Documents`, `Conversation` and contact summary | MFG-25–26, 31–32 |
| `Subcontracting/OrderDetail`, `Subcontracting/ShipmentDetail` | Shared read-only Manufacturing sections (`get#SubcontractOrder`, `get#SubcontractShipment`): supplying production links and service PO evidence, or dispatch/custody facts; order and physical execution stay with their owning apps | MFG-24–26, 32 |

Hidden from Manufacturing's tab menu does not establish that an inherited URL is safe or absent. Keep these
supporting direct-route inspections with MFG-32 and a permitted counterpart:

- Product360 additionally inherits `Features`, `Categories`, `Packaging`, `Prices`, `Suppliers`, `Equipment`,
  `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PurchaseHistory`, `PaidAccess` and hidden
  `InsightsRecord`; each tab screen checks the server-derived `product360Tabs`.
- FacilityDetail additionally inherits `Children`, `Locations`, `Products`, `Policies`, `Printers`, `BoxTypes`,
  `Schedules` and hidden `InsightsRecord`; its tab screens admit tabs by `appRoot`.
- Supplier360 additionally inherits `Prices` (Shared SupplierPrices), `Buying`, `Finance`, `Bills`, `Receiving`,
  `PurchasingAgreements`, `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `PurchasingDropShip`,
  `PurchasingPerformance` and hidden `InsightsRecord`. The Purchasing and Warehouse tabs carry `appRoot` conditions,
  and SupplierPrices' condition excludes Warehouse and Manufacturing; `Documents` carries none. Inspect the direct
  routes, their transitions and exports and the inherited supplier approval/invitation transitions anyway: a screen
  condition is not evidence that a transition or export refuses.
- Inherited price outputs include CSV and XLSX at `BillsOfMaterials/Product360/Prices`,
  `BillsOfMaterials/Product360/Suppliers` and `Subcontracting/Supplier360/Prices`, declared by Shared Prices and
  SupplierPrices. Pair an authorized owning-app export with an otherwise-valid denied Manufacturing-context request;
  inspect any returned bytes/workbook cells for restricted-value omission as well as the response's refusal.
- InventoryAvailability's `Policy`, `Locations`, `Movements` and `Reservations` are assessed by direct URL at both
  stock mounts. A product/method context, production read or selected plant must not grant stock policy changes.

### Dialogs, custom modes, outputs and embedded surfaces

| Surface family | Inspect with its activity; include cancel/reopen/recovery | Activities |
| --- | --- | --- |
| BOM/routing lists and detail | `createBom`, `cloneBom`, `importLegacy`, `importCsv`, `createRouting`, header/component/operation/resource edits, validation, request/approve release, copy operations; import preview/result errors | MFG-02–04 |
| Operation templates | `storeTemplate` (new/edit/archive, evidence, production inspection template), `publishInstruction`, `instructionFile` response | MFG-03, 12, 19, 30–31 |
| Work-center detail | `createCenter`, capacities/rates/alternates and End, offline preview/apply/withdraw, affected-operation moves | MFG-05, 22 |
| Policy/reasons | Change consumption / time and cost / planning dialogs; `storeReason`, `setReasonActive`, effective date and change reason | MFG-06 |
| Work orders | `createDraft` wizard/quick create, `storeHeader`/`storeEquipment`/`storeParty`, `lifecycleAction`, list/board/calendar views, `moveCard`, `bulkAction`, `cloneOrder`, `storeMaterial`/`substituteMaterial`, `recordQuantity`/`recordLoss`/`changeQuantity`/`storeOutput`/`completeRun`/`decide`, `amendOrder`, `confirmSplit`, `closeOut` | MFG-07–16 |
| Material task | Asset/lot choice, issue, explicit backflush preview/confirm, output/tracking receipt, unused return; Stage stock and return from Warehouse Move | MFG-09–11, 14 |
| Shop floor | Scan ambiguity and selected operation, timer switch, `startOperation`/`overrideStart`/`pauseOperation`/`completeOperation`/`machineRuntime`, `recordStep`, `submitWeek`/`approveWeek`/`reopenWeek` | MFG-18–20 |
| Quality | Template publish/retire, `createInspection`, reading, submit/verify/dispose/reinspect/cancel, handheld characteristic forms, `openScanned`, gate checklist/certificate | MFG-12–13 |
| Downtime | `reportStop`, `closeStop`, `correctStop`, `approveStop`, `requestMaintenance` and the equipment-bound report | MFG-21 |
| Planning/subcontract | `previewMove`/`applyMove`/`requestOverride`/`unscheduleOperation`/`decideOverride`, schedule config, suggestion conversion and per-row results, `requestService`, `storeSubcontract` | MFG-22–26 |
| Costs | `requestReview`, close preview, Post cost close/adjustment, Return to production; Accounting costing policy link | MFG-27–28 |
| Station | `ShopFloor/Station.qvue` with `Station.tui.json`; `queueRows`, `scanOperation`, `startOperation`; Standard/qvt fallback text is not the operator board | MFG-18–20, 32 |
| Schedule | Projects `WorkItems/Timeline.qvue`; `schedule`, `moveOperation`, `decideOverride`; the tui mode embeds `ProductionScheduleTui`'s forms | MFG-22, 32 |
| Resource calendar | Commons `Calendar.qvue` read-only; `calendarSetup`, `calendarEvents`, `eventSummary`; the tui mode embeds `ResourceCalendarTui`'s two-week agenda | MFG-05, 22, 32 |
| Physical outputs | Traveler, PickSheet, OutputLabels (output and secondary), QualityChecklist, InstructionsPrint, QualityCertificate and dispatch/return SubcontractInstructions, all html-print | MFG-30 |
| Analytical outputs | The eight reports' CSV/XLSX lists and Print; Capacity CSV/print; PlanSnapshot and ScheduleSnapshot CSV/print; list CSV on WorkOrders/Find, BillsOfMaterials/Find, Routings/Find, OperationTemplates and ScrapLoss; method/explosion/compare/roll-up outputs actually offered | MFG-04, 22–24, 27–30 |
| Evidence and shell | Chatter/files, Notes, template attachments, approval topics, palette (`search#Records`), Today (`get#TodayItems`), both quick creates, `g q` and generic screen context | MFG-01, 19, 21, 31–32 |

Custom `render-mode` sections are in 25 local screens (`WorkOrderDetail` and its `Components`, `Operations`,
`Quality`, `ProductionCosts`, `Changes`, `Traveler`, `OutputLabels`; `WorkOrders/Find`; `BillsOfMaterials/Find`;
`Routings/Find`, `OperationTemplates`; `Centers`, `Equipment`, `Downtime`, `ResourceCalendar`; `ReasonCodes`;
`Station`, `OperationExecution`, `ProductionTime`; `Inspections`; `Capacity`, `ProductionSchedule`;
`SubcontractOperations`, `SubcontractDetail`) and four templates (`ManufacturingDowntime`, `ManufacturingEquipment`,
`ManufacturingSchedule`, `ManufacturingSubcontractParts`). Inspect each in its owning activity; do not infer terminal
content from the default XML renderer. Standard fallback text on Station/Schedule and ResourceCalendar's missing html
mode are truthful limitations to record, not missing features.

### Design-to-code reconciliation

| Design or historical statement | Current review treatment |
| --- | --- |
| Design §2 paths `WorkOrderDetail/Time`, `QualityGates`, `ShopFloor` (qvue), `WorkCenters/Equipment/EquipmentDetail`, `WorkCenters/Calendar`, `Manufacturing/Settings`, `Products/Product360` | Actual routes are `ShopFloor/ProductionTime`, `WorkOrderDetail/Quality`, `ShopFloor/Station`, `WorkCenters/EquipmentDetail`, `WorkCenters/ResourceCalendar` (menu "Calendar"), `Settings/ProductionSettings` and `BillsOfMaterials/Product360`; activities use the real routes |
| "Today" placeholder paragraph in the implementation introduction | Historical pre-build state; the built local tree and current services govern the inventory |
| BOM/routing "versions" and production snapshots | Read effective-dated method lines, release time, run-owned frozen lines/revision and immutable instruction content (stored once with its checksum; a newer publication shows a revision warning); do not invent the dropped version entities |
| ResourceCalendar and ProductionSchedule described as qvue screens | Their XML screens reuse Commons Calendar and Projects Timeline; only Station has an app-local qvue; both have local XML terminal twins |
| ProductionCostClose/CostingPolicies formerly deferred | Built: the Cost close tab and `Accounting/Inventory/ProductionCostClose`; ProductionSettings links to `/qapps/Accounting/Settings/CostingPolicies` only for `ACCOUNTING_ADMIN` |
| impl §7 still lists Purchasing's supply-plan mount, its buy conversion and Purchasing placing the service PO as later | Built since (`Purchasing/Replenishment/SupplyPlanning`, Purchasing's order workflow); review the current handoff. Warehouse has no SupplyPlanning mount and Mantle refuses transfer conversion (`METHOD_NOT_CONVERTED`), so transfer adoption is still later |
| `ManufacturingIsolationWalk` and `ManufacturingCostIsolationWalk` in impl §8 | Their coverage is in `ManufacturingAccessWalk`; no files with those names exist |
| Maintenance adoption of the AssetMaintenance and requests downtime makes (impl §7); design's Nov 11 rule that only maintenance in process or an open outage blocks equipment | The Maintenance app is unbuilt; current source blocks assigning equipment with any open, due AssetMaintenance (`openMaintenance`, `EQUIPMENT_BLOCKED`). Review the current rule; the new one is Maintenance's to build |
| AssemblyViewer, WallDisplay, Nonconformances, Gauges, DemandForecasts, MasterSchedule, FiniteSchedule, CustomerMaterialJobs, Batches/BatchDetail | Unmounted designed work remains deferred, with no live activity falsely assigned to it |
| General unbuild, merging compatible drafts, variant-applicability editor, WhereUsed replacement revisions, compare ChangeNotices navigation, component reservation/production pick mode, deferred cost posting | Remain separate unless current source establishes a built path; supported kit reversal and actual amendment input are reviewed as implemented |
| Shared station identity switching and device credentials | Deferred; review the authenticated operator's own timer and session, not an invented kiosk sign-in flow |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant; a render, HTTP 200 or service-only mutation does not complete
an activity. Browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief functional/output/fallback check. Record unattempted modes and recovery branches in §6. Actors are §2's users.

### MFG-01 — Start a production workday in the right plant

- **Actor/start:** `manufacturing.read`, `.plan` and `.operate`; one-plant, multiple-plant and empty authorized scopes.
- **Objective/steps:** open Manufacturing → choose plant (`selectPlant`) → inspect summary, due work, shortages and
  permitted KPI links → follow a filtered list → open a record → Back. Inspect each section default the actor's areas
  allow, and a closed area (for the reader: Shop floor, Quality, Planning, Subcontracting, Settings, Approvals) by menu
  and direct URL. Use the palette, the operator's Today operation and `g q`; open, cancel and reopen the work-order
  quick create (planner) and downtime quick create (operator).
- **Expected:** plant and organization remain recognizable; Home and destination filters agree; absent information
  is distinct from zero; reader navigation remains useful and a closed area is absent rather than broken. Quick create
  does not inherit an unrelated record key. Today opens the operation in Manufacturing with no task completion action.
- **Recovery:** no plant, stale saved plant, no matches, inaccessible recent record, failed independent Home source,
  changed active organization and plant choice during loading. A preference never widens the actor's scope.
- **Screens/modes:** Home, the section defaults, WorkOrders/Find, quick creates and shell providers; Material light/
  dark, actual TUI, brief Standard, keyboard and phone samples.

### MFG-02 — Create and release a dated bill of materials

- **Actor/start:** `manufacturing.method`, `manufacturing.methodapprove` and a method reader; an owned product,
  existing released BOM, draft change, eligible component units and current organization.
- **Objective/steps:** BillsOfMaterials/Find → New BOM or Clone → BillOfMaterialsDetail → edit draft header and
  add/change components → Validate draft → Request release → approver follows Approvals (`BomRelease`) to the record →
  approve → inspect release history and the effective component set. Separately preview/import legacy components and CSV.
- **Expected:** draft versus released lines and effective date are clear; the engineer's own release is refused and
  requested; approval returns to the method; old released lines remain readable. Import results name each rejected
  version/item while valid independent work remains usable. A released production order keeps its frozen method basis.
- **Recovery:** duplicate/cyclic component, invalid unit/date, missing product, stale draft, canceled release,
  mixed-validity CSV, repeated import and revoked method authority. Retain entered values and actionable findings.
- **Screens/modes:** BOM list, detail/Overview, Approvals/Notifications and the Product360/BOM counterpart;
  browser/TUI/Standard, two-row dialogs, keyboard and actual import/output content.

### MFG-03 — Prepare routing operations and immutable instructions

- **Actor/start:** `manufacturing.method` and `.methodapprove`; `manufacturing.resource` only for resource
  requirements; a cost reader for standard times. Operation templates, work centers and a routing with released and
  draft operations.
- **Objective/steps:** Routings/OperationTemplates → create/edit a template → publish an instruction (file or text) and
  evidence/skill requirements → Routings/Find → New routing or CSV import → RoutingDetail → copy/add operations,
  dependencies and resource requirements → validate → request/approve release (`RoutingRelease`) → reopen it.
- **Expected:** template and routing operation identities remain distinct; a publication ends the prior dated
  instruction without changing its stored bytes. Standard times show only to an editor or cost reader. An archived
  template blocks new copies and stays understandable on routings that copied it.
- **Recovery:** missing work center/instruction, invalid dependency or unit, stale draft, mixed-invalid import,
  failed file read, canceled publish/release and change after release. Do not substitute a current file for historical
  instruction content when checking MFG-19.
- **Screens/modes:** Routings/Find, OperationTemplates, RoutingDetail, approvals and the instruction-file response;
  browser/TUI/Standard, wide dialogs, keyboard and upload/download delegation where necessary.

### MFG-04 — Explain a method from product through explosion and comparison

- **Actor/start:** method reader/engineer and `manufacturing.cost` for the roll-up; dated method changes, non-phantom
  and phantom subassemblies, a kit and a constrained stock example.
- **Objective/steps:** Product360 → identity/units/kit/BOM → explosion with quantity, facility and as-of date →
  inspect levels, requirements, buildable quantity and findings → compare two dates → WhereUsed → affected method
  or released-run amendment link → return. Open CostRollup with cost read and inspect its offered preview/output.
- **Expected:** a non-phantom subassembly is a planning boundary (its stock counts before its shortage is exploded),
  while a phantom is blown through. Comparison identifies dated header, material and operation changes; Product360's
  Costs tab and amounts appear only with cost read.
- **Recovery:** missing method/date, cyclic/deep path, missing conversion/rate, unavailable product, no where-used
  rows and foreign organization. Compare controls must retain both dates and quantity across navigation and output.
- **Screens/modes:** both BOM mounts and their Explosion/Compare/WhereUsed/RoutingDetail children, Product360's
  offered tabs, standalone WhereUsed/CostRollup; browser/TUI/Standard, wide tree/phone and exact CSV/print where offered.

### MFG-05 — Maintain usable work centers and equipment context

- **Actor/start:** `manufacturing.resource` (centers, capacities, alternates), `.operate` (read) and `.cost` or
  `.finance` (rate read); rate edit needs `METHOD_RESOURCES` plus cost write, which only `manufacturing.admin` holds
  (record that limit). Line A's calendar, slots, rate and alternate, line B's gaps and `EQUIP_AB4_1`.
- **Objective/steps:** WorkCenters/Centers → New work center or FacilityDetail/WorkCenter → edit center facts →
  add/end capacity and alternate → inspect load. With the composed or admin identity, add a dated rate. Open Equipment →
  EquipmentDetail → inspect location/production/maintenance context. Open ResourceCalendar and its terminal agenda,
  then return to the center.
- **Expected:** a facility becoming a work center is explicit; capacity unit, slots, effective date and calendar basis
  are understandable; the resource administrator sees no rate action. Rates appear only to cost readers; the operator
  identifies the equipment and its maintenance state without seeing financial book amounts.
- **Recovery:** wrong-plant center/equipment, invalid capacity/rate/interval, overlapping or expired row, missing
  calendar and canceled edit. A read-only resource calendar cannot accidentally create or move a Commons event.
- **Screens/modes:** Centers, FacilityDetail/Overview/WorkCenter, Equipment/EquipmentDetail, ResourceCalendar and
  ResourceCalendarTui; browser/TUI, two-row dialogs, long names and date/time-zone samples.

### MFG-06 — Change production policy and reasons with visible effective scope

- **Actor/start:** `manufacturing.resource` (`PRODUCTION_POLICY_EDIT`); `manufacturing.read` as the area refusal;
  organization defaults (none seeded), a plant override, line A's row, a released run and a new draft, with prior
  settings captured for restoration.
- **Objective/steps:** Settings/ProductionSettings → choose organization/default or plant → inspect value/source
  trace → change one Consumption, Time and cost or Planning group with effective date/reason → reload → inspect a
  consuming new release and the prior run. ReasonCodes → add/edit → deactivate/reactivate → inspect the chooser in a
  loss, downtime or quantity-change dialog. The reader's direct Settings URL is refused.
- **Expected:** inherited, overridden and unset values differ; a dated change preserves history; a released order
  keeps its release-time policy. Reason types, approval thresholds and active status make their operational effect
  clear. Overhead and co-product allocation are named as Accounting's costing policies.
- **Recovery:** stale effective row, invalid tolerance/horizon, wrong organization, inactive reason used by a new
  action, canceled save. A failed edit retains input and cannot change another group.
- **Screens/modes:** ProductionSettings, ReasonCodes and consuming release/loss/downtime/supply-plan dialogs;
  browser/TUI/Standard, long forms, keyboard/phone and date-boundary checks. Restore fixture policy before Wave 2.

### MFG-07 — Create, inspect and clone a draft work order

- **Actor/start:** `manufacturing.plan` and `.read`; released method, authorized plant, optional requirement and
  equipment/person choices, an equipment item with open maintenance, and a separate empty-state fixture.
- **Objective/steps:** WorkOrders/Find → New work order → choose product, method/date, plant, quantity and due date →
  inspect producible-now and draft review → create → Overview edit/assign person/equipment → Components/Operations →
  return to Find in list, board and calendar views. Repeat through quick create; clone an eligible order and inspect the
  new draft's identity. Leave `BOSS_MFG_RUN_A` untouched.
- **Expected:** the draft retains the chosen scope and method basis; stock availability is explanatory, not an issue
  or reservation. Clone is a new draft with no copied execution facts. List, board, calendar and detail show compatible
  identity, state and quantities; the reader sees useful detail without edit controls or New work order.
- **Recovery:** missing/rejected product or method, invalid quantity/date, stale choice, another plant's assignment,
  equipment under open maintenance (`EQUIPMENT_BLOCKED`), canceled wizard/clone, failed save and Back with entered
  values. A retry does not create another draft.
- **Screens/modes:** Find, NewWorkOrder, QuickCreate, WorkOrderDetail/Overview/Components/Operations; browser/TUI/
  Standard, list view changes, keyboard and the existing phone-layout distinctions.

### MFG-08 — Release work and explain its lifecycle or shortage block

- **Actor/start:** `manufacturing.plan` (release, unrelease), `.supervise` (staged-release approval, hold, resume,
  cancel) and `.read`; ready draft, short draft, a draft whose method was released again after drafting, released
  no-fact order and a running order, with policy determining ordinary/staged release.
- **Objective/steps:** WorkOrderDetail → inspect lifecycle checks → confirm Release → inspect frozen lines,
  operations, dates and the `ProductionRelease` notice. On the short draft inspect the reason and the supervisor's
  staged release from Approvals. Exercise hold/resume/unrelease/cancel on separate eligible records and a small
  mixed-eligibility bulk action and board move from Find.
- **Expected:** the primary action reflects actual state; release is separate from issue/start; a staged short line
  remains blocked for issue until stock covers it. Frozen method/policy and expected revision are consistent; batch
  results name each success/refusal instead of treating every selected order as changed.
- **Recovery:** `SHORTAGE`, `METHOD_INVALID`, `METHOD_CHANGED` with its re-explode offer, stale order, approval
  refusal, canceled confirmation, changed permission and duplicate request. Unrelease (`RUN_HAS_FACTS`) and simple
  cancel refuse after incompatible facts exist.
- **Screens/modes:** Find board/bulk controls, detail header/Lifecycle, Overview, Materials and Approvals; browser/
  TUI/Standard, explicit confirmation, selection persistence and phone status/action layout.

### MFG-09 — Stage, issue and return the right production material

- **Actor/start:** `manufacturing.material` (`STOCK_ISSUE`, `STOCK_MOVE`) plus `manufacturing.operate` as the
  non-holder; a released run of this review with two lines/lots, partial stock, held/reserved stock and a separate
  active physical-count fixture.
- **Objective/steps:** WorkOrderDetail/Components → Materials → inspect required/issued/returned/left/short/held →
  Stage stock into `Warehouse/Transfers/Move` with run context → return → select line/asset/quantity → issue →
  inspect movement/history. For a backflush policy inspect proposed lots/quantities and confirm; return unused stock.
- **Expected:** stage changes location, issue consumes against the run, and return references the original issue;
  none is a generic inventory adjustment. Lot/unit/run identity survives handoff. Backflush uses the displayed
  preview; a partial issue and return reconcile, with exactly one persisted movement per operation identity.
- **Recovery:** held (`HELD_STOCK`)/expired/reserved/count-conflicted stock, short staged line, wrong lot/plant,
  excess return, changed preview, canceled issue and retry. A refused line leaves no unreported issue or ledger effect.
- **Screens/modes:** Components, MaterialIssueReceipt, InventoryAvailability at both mounts and Warehouse/Transfers/
  Move; browser/TUI/Standard, selected-value labels, two-row dialogs and scanner/phone input where offered.

### MFG-10 — Record partial and secondary output with traceable receipt

- **Actor/start:** `manufacturing.material` records good and pending output (receipts need `STOCK_ISSUE`);
  `manufacturing.operate` as the refused counterpart (the dialog still offers good and pending, impl F96);
  `manufacturing.plan` for by-product lines; a running simple/routed order with partial good quantity, required
  tracking, a secondary-output line and an inspection policy.
- **Objective/steps:** Quantities → Record quantities → inspect event and remaining work → Materials → Receive output
  with lot/serial and location → inspect received/held quantity and labels. By-products → add a permitted output line
  or inspect planned secondary lines → receive through the same guard → follow the output and its genealogy.
- **Expected:** recording quantity and receiving stock remain distinguishable; good/rework/scrap are not silently
  added together as available stock. Required identities and ownership survive receipt; held output is visibly held.
  Secondary output with no valid cost basis has a named block rather than an invented value.
- **Recovery:** excess/negative/fractional quantity rule, overproduction (`APPROVAL_REQUESTED`), duplicate serial,
  wrong output product, missing tracking, pending inspection, missing secondary cost, canceled receipt and replay.
  Completion follows a receipt only under the release-time `completeOnFinalReceipt` flag.
- **Screens/modes:** Quantities, ByProducts, MaterialIssueReceipt, OutputLabels and related stock evidence; browser/
  TUI/Standard, mobile tracking fields and actual labels. Continue quality and completion in MFG-11/13.

### MFG-11 — Resolve loss and overproduction before completing the order

- **Actor/start:** `manufacturing.operate` or `.material` (record loss; output scrap needs `STOCK_ISSUE`),
  `manufacturing.plan` (change target quantity) and `manufacturing.supervise` (decide, complete); a partial run, reason
  codes with an approval threshold, unused material and good/scrap/rework quantities that initially do not reconcile.
- **Objective/steps:** Quantities → Record loss above the threshold → supervisor approves/refuses from Approvals or the
  record → planner's Change quantity with a reason → supervisor inspects Quality/ScrapLoss → resolve remaining
  material/output/quality blockers → review Complete → confirm → reload the completed order and its quantities.
- **Expected:** approved exception, scrap and rework have distinct meaning, actor/reason and cost facts; approval
  does not make rejected output available stock. Completion explains reconciliation and pending gates; accepted
  material variance is explicit where offered. Operational completion still leaves financial close separate.
- **Recovery:** invalid reason/type, `TARGET_BELOW_FACTS`, stale revision, refused approval, loss beyond issued
  quantity, `QUANTITIES_UNRECONCILED`, `OUTPUT_HELD`, `LOSS_PENDING`, `OPERATION_OPEN`, unissued material, canceled
  Complete and duplicate event. A correction uses a linked event rather than rewriting history.
- **Screens/modes:** Quantities, ScrapLoss, ByProducts, quality/material tabs, Approvals and resulting reports;
  browser/TUI/Standard, two-row decisions, phone totals and readable refusal messages.

### MFG-12 — Publish the inspection template used by production

- **Actor/start:** `manufacturing.qualityadmin` (`QUALITY_TEMPLATE_EDIT`), `manufacturing.method` (assigns the
  production template on an operation template), `manufacturing.inspect` and a reader; draft/current templates with
  several characteristic types, required readings and effective dates.
- **Objective/steps:** Quality/InspectionTemplates → New template → add/change characteristics → inspect draft →
  Publish → inspect current and as-of rows/history → method engineer sets it on an operation template → release a
  disposable run so its gate takes the template → create an inspection on that run. Retire a separate template.
- **Expected:** a published item is never edited in place (a change ends it and starts a new row); previous readings
  keep their template evidence. Required, optional and pass/fail/numeric characteristics have readable units, bounds
  and instructions; template edit, method edit and inspection are separate authorities.
- **Recovery:** `LIMITS_INVALID`, `NO_ITEMS`, `TEMPLATE_PUBLISHED`, `REASON_REQUIRED`, stale row, canceled
  publish/retire, retired template (`TEMPLATE_RETIRED`) and foreign template key.
- **Screens/modes:** InspectionTemplates and its dialogs/chooser, OperationTemplates, run Quality and the inspection;
  browser/TUI/Standard, wide characteristic rows, keyboard and two distinct row dialogs.

### MFG-13 — Inspect a production gate and disposition held output

- **Actor/start:** `manufacturing.inspect` → `manufacturing.verify` (verify and dispose); MFG-12's gate on a
  disposable run (not `BOSS_MFG_INSP`), a final-output gate with a held receipt, required characteristic evidence and a
  separate rejected/reinspection example.
- **Objective/steps:** WorkOrderDetail/Quality → Inspect → QualityInspection → record readings → submit → verifier
  follows the `QualityInspectionDecision`/record link → verify → disposition → inspect gate, stock status and allowed
  next operation. Repeat entry through Quality/Inspections and InspectionStation scan → characteristic-by-characteristic
  operator form.
- **Expected:** sample/readings, submission, verification and stock disposition remain distinct. Pending/rejected
  gates explain their block (`QUALITY_BLOCKED`, the `ProductionQualityBlock` notice); accepted output becomes available
  only through the authorized disposition, retaining the pegged source where applicable. Reinspection links to the
  earlier evidence.
- **Recovery:** missing reading/evidence, invalid value, wrong inspection scan, unauthorized self/other decision
  under the current rule, canceled disposition, stale revision and retry. Follow scrap/rework back to the production
  loss/quantity outcome, not just an inspection status chip.
- **Screens/modes:** Quality tab/checklist, Inspections, both QualityInspection mounts, InspectionStation/Scan and
  certificate; browser/TUI/Standard, 390px operator input and actual print evidence.

### MFG-14 — Substitute a component and amend only remaining released work

- **Actor/start:** `manufacturing.plan` (substitute request, amendment request), `.supervise` (substitute decision,
  supervisor review), `.methodapprove` (method review) and `.material` (issue); a released order of this review with a
  shortage, a BOM line whose rule allows an equivalent, and a later method changing executed and unexecuted work.
  Avoid `manufacturing.admin`, whose one review gives both.
- **Objective/steps:** Components → Substitute → request → supervisor decides from Approvals (`ProductionSubstitution`)
  → issue the substitute through Materials. Compare method dates → Changes → choose method date → inspect remap →
  Request amendment → method approver and supervisor reviews (`ProductionAmendment`) → inspect the applied revision,
  retained executed facts and remaining lines/operations.
- **Expected:** substitution is explicit and bounded to the intended line; an arbitrary product is refused
  (`SUBSTITUTE_NOT_ALLOWED`). The amendment names what changes, preserves recorded material/time/output and applies
  once both reviews exist. Strict release (`STRICT_RELEASE`) explains the linked-new-order alternative.
- **Recovery:** unapproved substitute, `CHANGE_STALE`, `PREVIEW_CHANGED`, missing second review, refused request,
  `UNIT_INCOMPATIBLE`, `CHANGE_PENDING` and canceled confirmation. A changed-input retry cannot reuse an old approval
  or operation identity to change another set of lines.
- **Screens/modes:** Components, Materials, BOM Compare, Changes and Approvals; browser/TUI/Standard, two-row review
  dialogs, narrow remap display and retained input after a stale refusal.

### MFG-15 — Split remaining demand or create a linked backorder

- **Actor/start:** `manufacturing.plan` with an eligible released or running run of this review, demand links,
  quantities left and a chosen material disposition. Backorder-and-complete needs `PRODUCTION_PLAN` and
  `PRODUCTION_SUPERVISE` in one user: a prepared composite, or `manufacturing.admin` with that limit recorded.
- **Objective/steps:** WorkOrderDetail → Split → Allocation choose split/backorder, quantity, facility/due date and
  reason → Disposition inspect lines, demand and material effects → Confirm → open new order → follow parent link.
  Exercise the complete-original option only after its reconciliation preview permits it.
- **Expected:** only eligible remaining demand moves; both orders and requirement/supply links identify their
  relationship; receipts, issues, time and WIP stay on the source. A released source's new run is released at the same
  method date. Preview and confirmation agree on allocated quantity, disposition and whether the original completes.
- **Recovery:** quantity beyond remainder, wrong plant (`FACILITY_OWNER`), changed revision, consumed demand,
  unresolved material/quality block, `PREVIEW_CHANGED`, canceled wizard and retry. Back preserves entered
  allocation/reason; a repeat confirm returns the existing linked order rather than another backorder.
- **Screens/modes:** SplitWorkOrder's Allocation/Disposition/Confirm steps, resulting Overview/Components/Quantities
  and demand links; browser/TUI/Standard, keyboard, phone and long finding lists.

### MFG-16 — Cancel or close out a run without losing recorded facts

- **Actor/start:** `manufacturing.supervise` cancels a no-fact draft/released order (lifecycle cancel); the
  fact-bearing reversal or residual close (`cancel#ProductionOrder`) needs `PRODUCTION_SUPERVISE` and `STOCK_ISSUE`
  for its returns, a prepared composite; `manufacturing.plan` as the refused counterpart. Open and locked accounting
  dates for the resulting movements.
- **Objective/steps:** inspect the eligible simple cancellation → confirm and reload. On the fact-bearing run open
  Changes → inspect the cancellation preview with the return-unused choice → distinguish reversal from residual close
  (`closeOut`) → confirm → follow returned issues, canceled or completed state, retained evidence and the cost-close
  continuation.
- **Expected:** a no-fact cancel and a posted reversal/close-out are visibly different. Returns use stock guards, each
  with its own cost event; nothing is deleted; a residual close completes the run for MFG-28. The confirmation names
  the order and consequences, and its operation key survives a safe retry.
- **Recovery:** unavailable return stock, consumed output, lock/date block, `PREVIEW_CHANGED`, changed facts,
  returns without `STOCK_ISSUE`, canceled confirmation and a partial-looking response. Inspect the persisted outcome
  before repeating an uncertain request.
- **Screens/modes:** detail Lifecycle, Changes, Materials, ProductionCosts/ProductionCostClose and linked history;
  browser/TUI/Standard, keyboard and explicit before/after quantities and ledger evidence.

### MFG-17 — Reverse a supported kit assembly

- **Actor/start:** `manufacturing.supervise` (reverse), `manufacturing.finance` for the valued preview; a pick-assembly
  kit still on hand, prepared for the review (none is seeded; how to assemble one in the UI is to verify at execution),
  separate sold/held/counted kits, and the kit owner's `forwardIssuanceRepostEnabled` and `forwardReceiptRepostEnabled`
  set in the disposable database for this batch only.
- **Objective/steps:** WorkOrders/Disassembly → choose kit and quantity → Preview → inspect component issue slices,
  lots, status and permitted values → give reason → Reverse the kit → inspect components returned to stock and the
  dated reversing entries. Follow Product360/KitComponents as the structural reference.
- **Expected:** the screen describes supported pick-assembly reversal, not general unbuild. Open-period reversing
  deltas preserve posted history; slices are cancelled newest first and WIP nets to zero. Values are absent for the
  supervisor without `ACCOUNTING_VIEW`.
- **Recovery:** `ASSEMBLY_UNSUPPORTED`, `KIT_SOLD`, `KIT_HELD`, `KIT_COUNTED`, `BOM_CHANGED`, `COST_SLICE_MISMATCH`,
  `FORWARD_REPOST_REQUIRED` (naming the flag), `PERIOD_CLOSED`, `PREVIEW_CHANGED`, canceled confirmation and replay. A
  refused reversal leaves original stock and entries intact.
- **Screens/modes:** Disassembly (hidden from the menu), kit choice, Product360/KitComponents and resulting stock/
  financial evidence; browser/TUI/Standard, localized quantities and explicit refusal messages.

### MFG-18 — Find the right operation at the shop-floor station

- **Actor/start:** `manufacturing.operate`, `.material` (whose My work the shop-floor fixture assigns) and
  `.supervise`; `manufacturing.read` as the Shop floor refusal; released/running/paused/blocked operations in two
  plants, an unknown code, an ambiguous scan and a timer on other work.
- **Objective/steps:** ShopFloor/Station → choose plant/My work → scan or choose card → inspect readiness, due date,
  center and running timer → Open or Instructions → Back. Use Refresh and choose among several scan matches; start from
  the card only after reviewing the timer-switch confirmation ("Switch your timer?").
- **Expected:** selected operation and work-order identity remain visible; empty and failed loading states differ;
  a scan result outside the loaded board opens the correct operation. Keep it changes nothing; Stop it and start stops
  that timer and starts the intended one once.
- **Recovery:** invalid/foreign scan, repeated scan, stale card, changed plant while loading, lost authority, failed
  request and navigation before its response. Inspect keyboard access to cards and scan choices directly.
- **Screens/modes:** Station.qvue and its transitions, actual Station.tui.json board to OperationExecution, browser
  fallback text; 390px/touch, keyboard, light/dark and live theme changes.

### MFG-19 — Read the released instruction and execute an operation

- **Actor/start:** `manufacturing.material` completes the output operation (its receipt needs `STOCK_ISSUE`);
  `manufacturing.operate` runs a non-output operation and is refused the output completion
  (`STOCK_ISSUE_REQUIRED`); `manufacturing.supervise` for an explicit start override; predecessor-dependent and
  output operations with required skill, instruction acknowledgment and evidence.
- **Objective/steps:** OperationExecution → inspect start checks → Instructions read released content → record the
  required step/evidence → return → Start → Pause/resume where offered → Complete with good/scrap quantities and
  output details → inspect predecessor/successor state and the coupled output receipt. Review a justified override.
- **Expected:** the operation shows the instructions in effect at run release, with a revision warning when a newer
  one was published. Configured checks block and name the reason; an override records actor/reason. Completing the
  output operation receives output in the same transaction and a retry answers the first.
- **Recovery:** missing content/skill/acknowledgment, `PREDECESSOR_OPEN` (naming it), `EVIDENCE_REQUIRED`,
  `MACHINE_RUNNING`, pending quality, wrong serial/quantity, canceled override/completion and stale operation. The
  operator can correct input without losing entered evidence.
- **Screens/modes:** OperationExecution, Instructions, InstructionsPrint, Station and resulting quality/material
  tabs; browser/TUI/Standard, handheld touch targets, keyboard and long instruction/attachment content.

### MFG-20 — Reconcile labor time and machine runtime

- **Actor/start:** `manufacturing.material`/`.operate` (time, runtime, Submit) and `manufacturing.supervise` assigned
  as the run's Manager, the week's approver under the organization's timesheet policy (impl F33); timer entries on two
  operations, a week to submit, machine runtime on line A (rated) and on line B (no rate); `manufacturing.finance`
  reads the valued result in ProductionCosts (ProductionTime is in the Shop floor area, closed to it).
- **Objective/steps:** OperationExecution → start/stop timer → record machine runtime separately → ProductionTime
  inspect entries → Submit week → supervisor Approve → inspect the labor cost event → Reopen → inspect its reversal and
  resubmission path. Follow the unrated runtime into the cost exceptions (MFG-27).
- **Expected:** labor and machine time keep distinct hours, dates and basis; stopping a timer is not approval.
  Approval writes labor cost events and reopening their reversal without rewriting history. An unvalued machine fact
  stays visible as an exception that blocks the close preview.
- **Recovery:** overlapping/stale timer, another user's week, invalid hours, missing rate, canceled approval/reopen,
  an approver who is not the run's Manager and duplicate runtime request. Users without financial read see the time
  facts without amounts or rates.
- **Screens/modes:** OperationExecution, ProductionTime, ProductionCosts and close preview; browser/TUI/Standard,
  user-zone/week boundary, phone time dialogs and displayed versus persisted durations.

### MFG-21 — Report downtime and follow maintenance without conflating completion

- **Actor/start:** `manufacturing.operate` (report, end, request maintenance) and `.supervise` (approve, correct); a
  line, `EQUIP_AB4_2` or disposable equipment (§2), a reason with an approval threshold, a non-equipment stop and a
  follow-up task of the request.
- **Objective/steps:** quick create, WorkCenters/Downtime or EquipmentDetail → Report stop with equipment/reason →
  Maintenance dialog → open RequestDetail → inspect equipment/stop/production links → follow WorkItemDetail → return →
  End stop → supervisor Approve or Correct → inspect history, calendar/load effects and the equipment's blocked state.
- **Expected:** reason and interval explain lost capacity; an equipment fault records one outage; correction keeps
  the original row. Ending downtime leaves the request, maintenance and outage open and starts no timer. Run/operation
  links open production screens; an operation is never edited as a follow-up task. Equipment with the open request is
  refused for a work order (`EQUIPMENT_BLOCKED`) under the current rule.
- **Recovery:** invalid/end-before-start interval, `ASSET_REQUIRED` and `ASSET_INVALID`, wrong-plant request,
  `MAINTENANCE_REQUESTED`, `DOWNTIME_CORRECTED`, canceled maintenance, failed notification and already-ended stop. A
  non-equipment reason offers no maintenance.
- **Screens/modes:** ReportDowntime, Downtime, EquipmentDetail, RequestDetail, WorkItemDetail, calendar and reports;
  browser/TUI/Standard, row dialogs (impl F99: the qvt Maintenance dialog is top-level), phone, long reason and
  date/time-zone boundaries.

### MFG-22 — Schedule operations against real capacity

- **Actor/start:** `manufacturing.schedule` (preview, apply, request override, unschedule), `.supervise` (approve or
  refuse an override), `.resource` (offline preview and block; moving affected operations needs
  `PRODUCTION_SCHEDULE`) and `.read` (WorkCenters calendar only; Planning refused); two centers, predecessor/conflict
  cases, alternate center, unscheduled work and closed calendar time.
- **Objective/steps:** Planning/ProductionSchedule → inspect lanes/load/conflicts → drag or keyboard/form Move →
  Preview → choose free time and Apply, or Request override → supervisor approves (which applies it) or refuses →
  reload. Reschedule from Operations; preview/apply a center's offline interval and affected moves; inspect Capacity,
  ResourceCalendar and the ScheduleSnapshot print.
- **Expected:** a drag only prepares the move; confirmation applies its exact revisions and target. Calendar, slots,
  downtime, booked and available hours explain conflicts; missing basis is named. Freshly released operations may all
  carry the run's dates and show predecessor conflicts until scheduled (impl F55/F112). An override changes no
  capacity. ProductionScheduleTui performs the same guarded change through its forms.
- **Recovery:** `SCHEDULE_CONFLICT`, `CENTER_NOT_QUALIFIED`, `OPERATION_LOCKED`, `REVISION_CHANGED`, `DATES_INVALID`,
  refused override, `CHANGE_DECIDED`, canceled move/offline action, unschedule and a late response after navigation.
  Independent offline moves name their failures. A retry does not apply another move.
- **Screens/modes:** ProductionSchedule/ProductionScheduleTui, Operations, FacilityDetail/WorkCenter, Capacity,
  ResourceCalendar/ResourceCalendarTui and ScheduleSnapshot; browser/TUI, keyboard drag alternative.

### MFG-23 — Calculate and explain a supply plan

- **Actor/start:** `manufacturing.plan` (`SUPPLY_PLAN_RUN`) and `manufacturing.schedule` (reads with no Recalculate);
  `manufacturing.read` as the Planning refusal; plant demand, stock/inbound supply, an expired planning run,
  non-phantom/phantom methods and held quantity with an inspection due date.
- **Objective/steps:** Planning/SupplyPlanning → choose plant/horizon/product → Recalculate → inspect revision,
  as-of/freshness, exceptions and buy/make/transfer/outside suggestions → select a suggestion → trace demand/supply →
  compare held pending-release rows → Schedule cadence/net-held option → inspect saved schedule and PlanSnapshot.
- **Expected:** suggestions explain their source and quantity/unit; held stock is separately visible and netted only
  under the configured rule. Recalculation produces a distinguishable plan and marks the last one stale; the scheduler
  inspects without calculation or conversion controls.
- **Recovery:** no plant, missing method/unit/lead-time data, a failed independent item, stale plan, invalid schedule,
  canceled change and another organization's suggestion. Empty demand differs from failed planning.
- **Screens/modes:** SupplyPlanning, InventoryAvailability/Projection, PlanSnapshot and PlanningReport;
  browser/TUI/Standard, dense-table phone/keyboard, date basis and actual CSV/print filters.

### MFG-24 — Convert a valid suggestion and retain its demand relationship

- **Actor/start:** `manufacturing.plan` converts make suggestions; make, buy, outside-processing and transfer
  suggestions in a current plan, plus one stale or covered selection.
- **Objective/steps:** SupplyPlanning → select make suggestions → review method date/run facility → Make draft work
  orders → inspect each result → open created draft → inspect source demand and remaining supply → repeat the
  conversion → recalculate and inspect the prior plan's stale state. Confirm buy rows are shown but not convertible
  here and follow one to Purchasing's `Replenishment/SupplyPlanning` mount (PUR-17); select a transfer row and record
  the refusal and the confirmation text ("left for Purchasing and Warehouse", though Warehouse has no such mount);
  outside processing continues in MFG-25.
- **Expected:** make conversion creates a draft, never releases or issues; a repeat answers the existing run
  (`EXISTING`). Each independent failure names its suggestion while successful conversions stay linked. Buy conversion
  is Purchasing's; transfer suggestions are not converted anywhere (`METHOD_NOT_CONVERTED`).
- **Recovery:** `PLAN_STALE`, `SUGGESTION_CLOSED`, `SUGGESTION_EXCEPTION`, wrong plant or method, canceled action and
  changed-input retry. The created record and its link keep the current organization's scope.
- **Screens/modes:** SupplyPlanning selection/results, the new draft's Overview and the Purchasing counterpart route;
  browser/TUI/Standard, selection/pagination and recovery after partial results.

### MFG-25 — Request outside processing and hand purchasing authority to a buyer

- **Actor/start:** `manufacturing.plan` (request, agreement edits before the order; no price read),
  `manufacturing.buyer` (conversion and price basis on the Manufacturing mounts; no Purchasing launcher) and
  `purchasing.buyer` (placement in Purchasing; no Manufacturing root); a released run of this review, Ziddleman as
  supplier, a service product, required date and the vendor-custody facility; `manufacturing.read` as the
  Subcontracting refusal.
- **Objective/steps:** SubcontractOperations → New outside processing → Request → SubcontractDetail inspect
  agreement → Planning/SupplyPlanning: the buyer converts it to a draft service PO line → inspect Subcontracting/
  OrderDetail and Supplier360/SubcontractOrders → (PUR-21: `purchasing.buyer` places, approves and sends it at
  `Purchasing/Orders/OrderDetail`) → return to the operation's procurement status.
- **Expected:** requested, draft ordered, placed/approved and accepted states are distinct. Quantity, supplier, due
  date and linked run/operation agree; agreement edits use the current revision, and once ordered only lead time,
  vendor facility and price basis change. The planner sees the order without price or price basis; Manufacturing's
  order view stays read-only.
- **Recovery:** `SUBCONTRACT_EXISTS`, `NOT_SERVICE`, `SUPPLIER_INVALID`, `NOT_CUSTODY`, `CUSTODIAN_MISMATCH`,
  `PRICE_UNAVAILABLE`, stale agreement (`REVISION_CHANGED`), `SUBCONTRACT_ORDERED`, buyer grant absent, canceled
  conversion and retry. A draft PO line does not imply that Purchasing approved or sent it.
- **Screens/modes:** SubcontractOperations/SubcontractDetail, SupplyPlanning, Supplier360, OrderDetail and the bounded
  Purchasing continuation; browser/TUI/Standard, phone and two-role price comparisons.

### MFG-26 — Follow subcontract material custody through accepted output

- **Actor/start:** `manufacturing.material` (Warehouse launcher; `STOCK_MOVE` dispatches, `STOCK_ISSUE` receives),
  `manufacturing.plan` and a quality actor; MFG-25's placed service PO
  (not `BOSS_WH_SUB_PO`/`BOSS_WH_SHIP_SUB`), owned components, the vendor-custody facility, partial dispatch/return and
  an inspected output example. Where a new subcontract dispatch is created in the UI (Warehouse `create#Transfer` with
  the subcontract keys) is to verify at execution.
- **Objective/steps:** SubcontractDetail → inspect materials → Print dispatch instructions → dispatch and later
  receive output on the Warehouse `Transfers/SubcontractShipmentDetail` route as the step this subcontract needs (the
  route's own review is WH-30) → Manufacturing ShipmentDetail inspect in-transit/vendor stock → inspect
  output/genealogy, the ServiceAcceptance the receipt made and the accrual → return to SubcontractDetail's
  Acceptance and bill/cost evidence (Purchasing's view of the acceptance is PUR-21's). There is no second manual
  acceptance of subcontract output.
- **Expected:** ownership is distinct from custody; dispatch is distinct from the atomic receipt, which issues
  vendor-custody materials, receives output, records service acceptance with receipt/inspection evidence and writes the
  accrual once. Accepted/rejected/held quantities reconcile to the run. Matching follows that evidence, not the mere
  presence of a service PO or a shipped component.
- **Recovery:** rejected output, missing inspection, stale action and canceled return as Manufacturing shows them;
  the route's refusals (`NOT_SUBCONTRACT`, `NOT_CUSTODY`, `CUSTODIAN_MISMATCH`, `MATERIAL_SHORT`,
  `QUANTITY_EXCEEDS_ORDERED`) and same-key replay are WH-30's. Read-only views offer no physical execution.
- **Screens/modes:** SubcontractDetail/SubcontractInstructions, shared ShipmentDetail/OrderDetail, Warehouse
  subcontract route, Purchasing's order evidence, production material/quality tabs; browser/TUI and actual documents.

### MFG-27 — Explain estimated and actual production costs and request review

- **Actor/start:** `manufacturing.cost` (estimate read, `PRODUCTION_COST_REVIEW`; no actuals) and
  `manufacturing.finance` (`ACCOUNTING_VIEW`); a released run with material, approved labor, machine runtime,
  subcontract accrual and loss events, plus an unvalued or unapproved fact.
- **Objective/steps:** WorkOrderDetail/ProductionCosts → compare the frozen estimate with permitted actual WIP and cost
  events → follow source and exceptions → resolve rate/time/quantity issues through their owning activities → the
  estimator requests the cost review with a proposed accounting date → inspect the review state (its Accounting queue
  entry is ACC-24's). Compare the two readers on the same run.
- **Expected:** estimate, actual, absorbed/unabsorbed and variance are distinct, with currency, date and source;
  restricted values are left out, never zero, in HTML, JSON and exports. Requesting review notifies
  `PRODUCTION_COST_POST` holders (`ProductionCostReview`, no Manufacturing topic) and posts nothing. An unvalued event
  stays an exception until valued at its source; whether review re-records a corrected rate is to verify at execution.
- **Recovery:** `NO_COST_EVENTS`, `REVIEW_REQUESTED`, `RUN_NOT_RELEASED`, `RUN_CLOSED`, `REVISION_CHANGED`, the
  `PERIOD_CLOSED` warning, wrong organization, canceled request and unavailable source record. A current rate must not
  value a past event at the wrong effective date.
- **Screens/modes:** ProductionCosts, CostRollup/Product360 Costs where allowed, ProductionTime, SubcontractDetail
  and cost report; browser/TUI/Standard, currency/negative values and narrow source-detail layouts.

### MFG-28 — Review and post or return a production cost close

- **Actor/start:** `manufacturing.costclose` (preview, post, return); `manufacturing.finance` (evidence, no
  preview); the prepared `retail.manufacturing.gl` (preview only, §2). A completed run with requested review (not
  the one ACC-24 closes), a blocked run, a stale preview, a closed period and a late event after a prior close. The
  Accounting `Inventory/ProductionCostClose` queue is ACC-24's (`finance.approve` is `BOSS_ACCT_ORG`'s and sees no
  Retail run).
- **Objective/steps:** WorkOrderDetail's Cost close tab → inspect absorption, overhead, scrap, output allocation,
  variance and proposed ledger → resolve blockers → choose accounting date → confirm Post cost close → inspect the
  closed order and posted allocation. Separately Return to production with a reason; inspect the later adjustment mode
  and repeat the same confirmed request.
- **Expected:** financial read alone does not grant preview or post; preview needs `ACCOUNTING_GL_POST` or
  `PRODUCTION_COST_POST`, post and return `PRODUCTION_COST_POST`. The input fingerprint binds the shown facts;
  material/output movements are not posted twice; the post closes the run (`WeClosed`). An authorized zero-entry close
  explains its result.
- **Recovery:** `RUN_NOT_COMPLETE`, `UNVALUED_EVENTS`, `TIME_UNAPPROVED`, unmapped account or missing policy, another
  currency, `STALE_PREVIEW`, `PERIOD_CLOSED`, `POSTING_REFUSED`, canceled post, denied authority and repeated request.
  A failed close preserves original history.
- **Screens/modes:** shared ProductionCostClose on the Manufacturing mount (Accounting's is the second consumer of a
  shared fix), ProductionSettings' policy text (its
  CostingPolicies link shows only to `ACCOUNTING_ADMIN`) and source report/ledger evidence; browser/TUI/Standard, phone
  and actual posted result.

### MFG-29 — Explain an operational result from report to source

- **Actor/start:** `manufacturing.read` and `.finance`; populated/empty plant/date ranges, completed (closed and open)
  and open orders, incomplete calendar/rate data (line B) and a known quality/loss event.
- **Objective/steps:** Home KPI or Reports/ReportIndex → choose plant/date/product/center as offered → inspect report
  basis, as-of time and completeness → drill source work order/operation/loss/inspection/plan → return to the same
  filter. Compare WorkOrderStatus, Material, OperationPerformance, Loss, Quality, ProductionCost, BOM variance and Planning.
- **Expected:** periods, units, denominators and as-of state explain the result; performance factors and missing
  basis are readable rather than falsely precise; totals leave out unreadable values rather than counting them as zero.
  Reports do not mix incompatible units/currencies. Source links choose the Manufacturing mount and scope.
- **Recovery:** no matches, missing capacity/calendar, partial source failure, unavailable drill record (including a
  Planning-area link for the reader), restricted money, changed filters and stale result. Home KPIs compute on each
  render (impl F142); note slow loads separately from defects.
- **Screens/modes:** all eight reports, ReportIndex, Home, Capacity and actual source details; browser/TUI/Standard,
  chart/table readability, keyboard, phone and output continuation in MFG-30.

### MFG-30 — Produce a readable, scoped traveler, label and snapshot

- **Actor/start:** an operational reader for prints, a Planning-area user for snapshots, a Subcontracting-area user
  for subcontract instructions and `manufacturing.read`/`.finance` for reports; long names, many lines, fractional
  quantities, historical instruction, tracked and held output, dispatch/return records and a filtered report/plan.
- **Objective/steps:** open each offered traveler, pick sheet, output and secondary labels, quality checklist and
  certificate, instruction print and subcontract dispatch/return instructions → inspect preview → download/print
  locally → read actual bytes/pages. Export the reports as CSV and XLSX, Capacity and the list CSVs (§3), and
  plan/schedule snapshots → compare filter, identity, date/revision, selected columns and rows in the actual files.
- **Expected:** repeated headers, units, quantities, source keys and page breaks support real use. HELD labels stay
  visibly held; barcode/QR and text name the same identity. Subcontract instructions disclose no restricted cost.
  Workbook headers, typed cells, units and filtered rows agree with the authorized report; restricted amount columns
  and values are absent from every sheet and cell. A snapshot's label describes its queried basis; a current plan
  print is not immutable history; a pick sheet moves nothing.
- **Recovery:** unavailable renderer/PDF, empty dataset, Unicode/long rows, a page break at a critical total, foreign
  output key, expired source and canceled print. A download event alone does not close this activity or prove a
  printer received the job.
- **Screens/modes:** every output in §3 and its originating activity; actual html-print/PDF/CSV/XLSX/label content,
  Standard entry and explicit terminal delegation. Distinguish unsupported hardware from bad generated content.

### MFG-31 — Keep evidence and approval decisions on the right record

- **Actor/start:** scoped operators, method/quality approvers and a reader; two similar run/operation/method records,
  allowed/forbidden attachments and a notification whose record changes state after it is opened.
- **Objective/steps:** WorkOrderDetail/Notes, facility/supplier Conversation/Documents or shared files → add permitted
  discussion/file → reload/download → follow the record link → open an approval notification → inspect the
  authoritative current record → decide where offered → follow the resulting notice and return. Trace instruction
  evidence and maintenance files too. In the actual terminal open Chatter/ChatterTui to log a note and read the timeline,
  and RecordFiles/RecordFilesTui to inspect the file list and follow its download with the required delegation.
- **Expected:** canonical entity/key and audience remain correct across mounts; operation and work-order context do
  not collapse into one identity. A decision is recorded on the authoritative method/run/inspection/change and marks
  its notices read; marking a notice read decides nothing. Restricted financial or foreign evidence stays absent.
- **Recovery:** wrong/foreign host key, lost permission, deleted record, disallowed attachment, failed upload, stale
  notice and canceled decision. Published instruction content is distinct from ordinary editable files. Duplicate
  notification delivery does not repeat the underlying approval.
- **Screens/modes:** root Chatter and Chatter/ChatterTui, RecordFiles and RecordFiles/RecordFilesTui, Notes,
  product/facility/supplier documents/conversation, request/task attachments and Approvals/Notifications;
  browser/actual TUI with upload/output delegation and focus return; direct twin access is in MFG-32.

### MFG-32 — Reconcile access, neighboring apps and remaining modes

- **Actor/start:** narrow Manufacturing users, `manufacturing.services`, the `BOSS_P17_ORG` standalone users where
  borrowed, and explicit Warehouse/Purchasing/Accounting/Products counterparts; otherwise-valid positive/negative
  payloads and incomplete mode/recovery rows.
- **Objective/steps:** follow method → production → physical stock → subcontract order → financial close and their
  return links. Probe each area's denial for the root group and allowance for its groups (§2), direct inherited
  children (§3), hidden JSON helpers (`choices`, `downtimeChoices`, `inspectionChoices`, `openScanned`, `queueRows`,
  `scanOperation`, `schedule`, `calendarEvents`, `eventSummary`, `instructionFile`), selected labels, palette/scans,
  print/export/file helpers and forged context, including the three inherited CSV/XLSX price routes: pair permitted
  owning-app output with the denied consuming context and inspect bytes for restricted values. Change one grant after
  opening a form, then restore it. Revisit shared corrections in a second consumer and reconcile remaining
  terminal/Standard/phone gaps.
- **Expected:** app context cannot widen record or amount access; a composed business permission does not imply a
  neighboring launcher (the buyer and cost-close users open neither Purchasing nor Accounting). Cold cross-app
  navigation returns with one Back and preserves record/scope. Hidden children stay protected independently of tabs.
- **Recovery:** lost grant, wrong plant/owner, missing launcher, deleted destination, failed provider, late response
  and interrupted confirmation. Refusals identify the intended rule against a valid successful counterpart; invalid
  input is not access evidence. Tool-blocked variants remain unresolved rather than called passed.
- **Screens/modes:** every mapped surface and bounded shared continuation; actual browser/TUI/Standard as applicable,
  supporting server responses and files. This activity does not prescribe a users × routes × modes regression matrix.

Handoffs with the companion reviews; each side is exercised once, by the activity named, and the other review
only opens it as far as the handoff:

| Handoff | Counterpart side (review) | Manufacturing side |
| --- | --- | --- |
| Released methods on Products' shared screens | Products PRD-13–15 | MFG-02–04 |
| Stage components into Move (`workEffortId`) | Warehouse WH-07: Move itself | MFG-09: `manufacturing.material` from Components to Move and back, on its own run |
| Production issue, unused return and output (Shared MaterialIssueReceipt) | Warehouse WH-31 on Warehouse's mount | MFG-09/10 on WorkOrderDetail's mount |
| Shared quality screens | Warehouse WH-13 | MFG-12–13 |
| Buy suggestion conversion | Purchasing PUR-17 (`purchasing.buyer` on Purchasing's SupplyPlanning) | MFG-24 shows buy rows only; it observes the transfer refusal (`METHOD_NOT_CONVERTED`) |
| Outside-processing service PO (`Purchasing/Orders/OrderDetail`) | Purchasing PUR-21: `purchasing.buyer` places, approves and sends MFG-25's draft through PUR-11–13's controls, and later reads its acceptance | MFG-25: request and `manufacturing.buyer`'s conversion; status only after |
| Subcontract custody and output (`receive#SubcontractOutput`) | Warehouse WH-30: the route's review on `BOSS_WH_SUB_PO` | MFG-26: drives the route for MFG-25's subcontract and reads Manufacturing's evidence |
| Cost review and close (Shared ProductionCostClose) | Accounting ACC-24: the queue with the prepared Retail finance identities | MFG-27 requests review; MFG-28 on the Cost close tab |
| Supplier portal order view | Purchasing PUR-28 | cited only, to explain a subcontract's status |

## 5. Existing checks and future verification

This maps available checks, not passing results. Spec names omit `.spec.js`; paths are relative to the component
named. Read the current assertions before selecting a later run: several walks deliberately record nothing because
their demo records are shared (impl F60), and a render cannot establish browser or terminal interaction.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Manufacturing/` | ManufacturingAccess | MFG-01, 06, 32; root/capability/plant/record checks, forged ids, guarded areas, one refused write, and production kept from REST run paths and from Commons/Projects tasks and events |
| mr-boss regression `test/Manufacturing/` | ManufacturingMethods | MFG-02–04; routing from two templates, BOM release refused/requested/approved, retained lines, where-used and a CSV import with one bad unit |
| mr-boss regression `test/Manufacturing/` | ManufacturingWorkCenters | MFG-05, 22; new center, capacity, offline preview, rate by reader, calendar and screen visibility |
| mr-boss regression `test/Manufacturing/` | ManufacturingWorkOrders | MFG-07–08; review/create/release, staged release, board move, bulk, Product360 and palette links; hold, unrelease and cancel are Mantle's |
| mr-boss regression `test/Manufacturing/` | ManufacturingMaterials | MFG-01, 08–09; issue at two operations, the non-holder refused, backflush once, staged short line, manual line, held stock, Home counts |
| mr-boss regression `test/Manufacturing/` | ManufacturingShopFloor | MFG-18–20; station/scan/instruction/start with timer switch, machine time, predecessor refusal, F96 receipt refusal, coupled output completion, week approval/reopen, Today and terminal twin renders |
| mr-boss regression `test/Manufacturing/` | ManufacturingDowntime | MFG-21; robot fault with maintenance request, no-material stop, correction history, approval threshold and the follow-up task in WorkItemDetail |
| mr-boss regression `test/Manufacturing/` | ManufacturingSchedule | MFG-22; drag preview/commit, supervisor override, Capacity, terminal twin move and Operations' Reschedule |
| mr-boss regression `test/Manufacturing/` | ManufacturingPlanning | MFG-23–24; recalculation, make conversion/retry, stale plan and the scheduler's read |
| mr-boss regression `test/Manufacturing/` | ManufacturingSubcontracting | MFG-25–26; request, buyer conversion, price omission and shared order/supplier/shipment context; the spec places the order itself |
| mr-boss regression `test/Manufacturing/` | ManufacturingReports | MFG-01, 29–30; Home KPIs, cost report money columns by reader on screen and in export, scope and as-of time |
| mr-boss regression `test/client/Manufacturing/` | ManufacturingWorkOrdersWalk | MFG-07–08; the app's one browser golden path (New work order → release); reuse it rather than adding another |
| mr-boss acceptance `test/acceptance/Manufacturing/` | ManufacturingAccessWalk | MFG-07–13, 23–24, 27–32; standalone `BOSS_P17_ORG` plan-to-stock, app isolation, exports/prints, palette/scans/station, cost boundaries; server-side, not a live terminal/browser pass |
| mr-boss acceptance `test/acceptance/Manufacturing/` | ManufacturingServerStatic | Server-static qvt of plain XML Manufacturing screens; its `./moq test` Run comment does not change its acceptance classification |
| mr-boss acceptance `test/acceptance/Manufacturing/` | ManufacturingPlanningFixtures, ManufacturingSubcontractFixtures, ManufacturingScheduleFixtures, ManufacturingShopFloorFixtures | Setup for the client walks, each making new runs per load; the client suite's server also loads Products, Warehouse, Accounting and Insights fixtures. Registration does not authorize execution |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingMethodsWalk, ManufacturingWorkCentersWalk, ManufacturingPolicyWalk | MFG-02–06; instruction/routing release, center/capacity with no rate action, policy override trace and reason deactivation, 390px |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingWorkOrdersPhone, ManufacturingMaterialsWalk | MFG-07–09; list/detail and Components/Materials at 390px; the materials walk opens the tabs and posts nothing |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingQuantitiesWalk, ManufacturingQualityWalk | MFG-10–13; dialogs and states only, nothing recorded (shared `BOSS_WH_RUN`, `BOSS_MFG_INSP`) |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingChangesWalk | MFG-14–17; remap, split steps and Disassembly entry at 390px; nothing confirmed |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingShopFloorWalk | MFG-18–20; the material handler's scan/start/instruction/timer/output completion, refused-input recovery and the supervisor's week approval/reopen |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingDowntimeWalk, ManufacturingScheduleWalk | MFG-21–22; robot fault with its maintenance request (it leaves equipment under open maintenance), drag-preview-confirm and conflicts, 390px |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingPlanningWalk, ManufacturingSubcontractWalk | MFG-23–25; make conversion, service-PO line conversion, buyer/planner price difference, 390px; no vendor-custody round trip |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingCostsWalk, ManufacturingCostCloseWalk | MFG-27–28; estimate/actual read and review request (after the Warehouse production walk issues), blocked close findings, Accounting queue as `finance.approve` (empty of Retail runs), 390px; no successful post or adjustment |
| mr-boss acceptance `test/acceptance/client/Manufacturing/` | ManufacturingReportsWalk | MFG-29; OEE KPI drill, money columns by reader and a phone report |
| mr-boss regression `test/Accounting/`, `test/Warehouse/` | AccountingProductionCostClose; WarehouseCounts | MFG-09, 28; neighboring queue and count contract; use only for an affected shared correction |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | MFG-01, 21, 31; shared identity and entry/return behavior, not a second Commons review |
| mr-boss acceptance root | AppStructure, TuiRender, ServerStatic | Existing broad route/render sweeps; reconcile overlap before changing one; there is no separate ManufacturingScreens sweep |
| mr-mantle regression `test/product/` | ProductMethods, SupplyPlanning, WarehouseCounts | MFG-02–04, 09, 23–24; owning method/planning rules and count cutoff interactions |
| mr-mantle regression `test/work/` | MethodTemplates, WorkCenters, ProductionPolicy | MFG-03, 05–06; instruction/template, resources and effective policy rules |
| mr-mantle regression `test/work/` | ProductionOrders, ProductionMaterials, WarehouseProduction, ProductionQuantities, ProductionQuality | MFG-07–13; lifecycle, guarded stock, partial quantities/reconciliation and production gates |
| mr-mantle regression `test/work/` | ProductionChanges, SupportedAssembly | MFG-14–17; substitution, amendment, split, cancellation/close-out; kit reversal and its flags |
| mr-mantle regression `test/work/` | ProductionShopFloor, ProductionDowntime, ProductionSchedule | MFG-18–22; execution/time, downtime/maintenance and scheduling rules |
| mr-mantle regression `test/work/` | ProductionSubcontract, ProductionCosts, ProductionReports | MFG-25–29; outside-processing facts, costing evidence and report basis |
| mr-mantle regression `test/ledger/` | ProductionCostClose | MFG-28; allocation, posting/retry, locks and adjustment |

The app has **11 server regression specs**, **one browser regression golden path** (registered in
`test/client/suite.js`), **six server acceptance files** (four fixture specs, the access walk and the server-static
check) and **16 browser acceptance specs** registered in `test/acceptance/client/suite.js` (ManufacturingWorkOrdersPhone
last). `ManufacturingSpecLib.js` supplies demo IDs, users and route fixtures; `ManufacturingStandaloneLib.js` the
isolated organization. Inspect their setup rather than guessing generated IDs or running acceptance fixtures as a
convenient bootstrap.

Available tests leave important review work: actual TUI input/focus/confirmations, light/dark sampling, a
successful financial close and adjustment in the browser, the vendor-custody round trip and service acceptance,
output bytes/page quality, partial/retry recovery and shared-child authorization. Neither walk names nor historical
passes close these activities. No test is added or changed by this documentation task.

### Verification rules for later refinements

These rules govern the refinement pass, and the commit rule applies in both; the review pass corrects nothing and
commits no source (§2). The suite rules are the [testing skill](../../../../../.agents/skills/testing/SKILL.md) and
[Build-Test](../../../../../docs/Build-Test.md#the-two-suites) with [rendering screens in
tests](../../../../../docs/Build-Test.md#rendering-screens-in-tests). Manufacturing specifics:

- **While working.** From the mr-moqui root on a built binary: `./moq test mr-boss --spec ManufacturingSchedule
  --nobuild`, the owning Mantle spec when its rule changes, and the golden path
  `./moq test-client mr-boss --serve --spec ManufacturingWorkOrdersWalk --nobuild`.
- **Before a commit (user decision, 2026-11-11).** Before each commit, in either pass, run only the local, focused
  checks for what changed: the specs it touched, the owning Mantle spec, the golden path and lint, as listed here. Run
  `./moq test-apps` once at the end of the refinement pass, and `./moq test-framework` as well if the pass changed
  framework code (a shared renderer/widget correction, under the building skill). Never `cargo test`, framework specs
  or `test-all` for application work. Commits follow the user's execution authorization.
- **Acceptance (user decision, 2026-11-11).** Along the way, in either pass, run the focused acceptance walks and
  fixture specs of what is being reviewed or changed; an added or changed acceptance test always runs, then its
  component's acceptance suite. At the end, after the final `./moq test-apps`, run the full acceptance suites of the
  application components (`./moq accept mr-mantle mr-boss mr-pass mr-marble`), or `./moq accept-all` if framework
  code changed. A focused walk runs as
  `./moq accept mr-boss --spec ManufacturingShopFloorWalk`.
- **Rendering.** The sweeps stay in acceptance (AppStructure, TuiRender, ServerStatic). Across regression a screen
  renders at most once per mode with all its checks, in a second mode only where it has its own qvt/tui template
  (Station, ProductionSchedule, ResourceCalendar and the `render-mode` screens of §3). No role × route × mode matrix,
  second golden path, Mantle rule retested through a BOSS wrapper or screenshot baseline.
- **Budgets.** BOSS `test/budget` 264 s server / 57 s client, Mantle 393 s server; a component over 1.5 times its
  budget or one regression spec over 15 s fails the run. Cut duplication or move a scenario to acceptance; no budget
  is raised without the user's agreement.
- **Lint.** `moqui lint --screens <report-file>` for changed screens (the argument is an overwritten output report,
  never a screen path), compared with the baseline; Markdown-only edits need none.
- **Evidence** stays in ignored `plans/ui-refinement-evidence/boss-manufacturing/` in the framework repository, with
  persisted quantity/time/cost facts and redacted outputs; never commit screenshots, credentials or captured mail.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not by itself mean passed: use `exercised / partial`
and name the open continuations, recovery and mode gaps. Blocked and deferred coverage remains unresolved. Source
research and document review do not advance this ledger; record actual modes and results, not only a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| MFG-01 — Workday/plant scope | pending | All live variants unreviewed, including area denials | — |
| MFG-02 — BOM release | pending | All live variants unreviewed | — |
| MFG-03 — Routing/templates/instructions | pending | All live variants unreviewed | — |
| MFG-04 — Product/explosion/compare | pending | All live variants unreviewed | — |
| MFG-05 — Work centers/equipment | pending | Rate edit needs the admin or a composed identity | — |
| MFG-06 — Policy/reasons | pending | All live variants unreviewed | — |
| MFG-07 — Draft/clone | pending | All live variants unreviewed | — |
| MFG-08 — Release/lifecycle | pending | All live variants unreviewed | — |
| MFG-09 — Material stage/issue/return | pending | Warehouse handoff and count/stock variants unreviewed | — |
| MFG-10 — Partial/secondary output | pending | All live variants unreviewed | — |
| MFG-11 — Loss/reconciliation/completion | pending | All live variants unreviewed | — |
| MFG-12 — Inspection templates | pending | All live variants unreviewed | — |
| MFG-13 — Inspection/disposition | pending | Full and handheld mounts unreviewed | — |
| MFG-14 — Substitution/amendment | pending | All live variants unreviewed | — |
| MFG-15 — Split/backorder | pending | Backorder-and-complete needs a composed identity | — |
| MFG-16 — Cancel/close out | pending | Fact-bearing cancellation needs a supervisor with `STOCK_ISSUE` | — |
| MFG-17 — Supported kit reversal | pending | Requires a prepared kit on hand and the owner's forward repost flags | — |
| MFG-18 — Station/scan | pending | Browser and actual terminal board unreviewed | — |
| MFG-19 — Instructions/operation execution | pending | All live variants unreviewed | — |
| MFG-20 — Labor/machine time | pending | Approval, correction and valuation continuations unreviewed | — |
| MFG-21 — Downtime/maintenance | pending | All live variants unreviewed | — |
| MFG-22 — Scheduling/capacity | pending | Timeline, calendar and both terminal twins unreviewed | — |
| MFG-23 — Supply plan | pending | All live variants unreviewed | — |
| MFG-24 — Suggestion conversion | pending | Make conversion and Purchasing buy handoff unreviewed | — |
| MFG-25 — Outside-processing procurement | pending | Buyer/Purchasing continuation unreviewed | — |
| MFG-26 — Subcontract custody/output | pending | Warehouse/service-acceptance continuations unreviewed | — |
| MFG-27 — Cost facts/review request | pending | All live variants unreviewed | — |
| MFG-28 — Cost close/adjustment | pending | Financial scope, successful posting and recovery unreviewed | — |
| MFG-29 — Reports/drill | pending | All live variants unreviewed | — |
| MFG-30 — Outputs | pending | Actual bytes/pages/labels and terminal delegation unreviewed | — |
| MFG-31 — Evidence/approvals | pending | All live variants unreviewed | — |
| MFG-32 — Boundaries/continuity/modes | pending | Paired checks and remaining-mode reconciliation unreviewed | — |

### Findings register

No runtime/UI defect has been established by this planning work. The review pass records findings with Owner /
correction / retest empty; the refinement pass fills them in. Number later findings **MFG-UI-001** onward with the
guide's fields and severities ([record, fix and verify](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)): P1
blocks work or makes essential information unusable, P2 causes substantial friction or misleading presentation, P3 is
a localized refinement. Distinguish observed failures, source suspicions and design judgments. Stock, authority or
financial-history corruption takes priority regardless of visual severity.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into execution, labelled as source suspicions and not observed defects:

- **Station requests (source suspicion).** `Station.qvue` sends scans and board loads with no request-generation
  guard, so a late response after another scan or plant change could select a stale operation; its Start makes a new
  operation key per click (`sf-start-<id>-<random>`), so a repeat after an uncertain response is protected only by
  `start#ProductionOperation`'s state answer (`JOINED`/`RESUMED`), not by key replay; and the timer-switch prompt is a
  Quasar `$q.dialog`, not `moqui.confirmAction` in the app's dialog stack. Inspect focus, Escape and stale results.
- **Operator output (historical, impl F96).** The Quantities dialog offers good and pending output to an operator
  who lacks `STOCK_ISSUE`; inspect whether the refusal is explained before submission.
- **Operation dates after release (historical, impl F55/F112).** Release copies the run's dates to every operation,
  so fresh runs show overlapping operations and predecessor conflicts until scheduled; judge whether the schedule and
  Capacity make that understandable.
- **Equipment left blocked (source suspicion).** A maintenance request from downtime leaves an open AssetMaintenance
  that blocks equipment assignment, and no built Manufacturing surface was found that completes it; confirm the path
  (if any) before treating a blocked robot as a fixture problem or a defect.
- **Locked-day receipt repost (historical, impl-manufacturing F121; open in impl-accounting §7 "From Manufacturing
  P9").** With `postingGuardEnabled` and the forward flags off, the legacy receipt repost under a hard lock loses the
  posted history. MFG-17 runs with both flags on; do not reproduce this outside a disposable owner and a bounded batch.
- **Inherited children.** Product360, FacilityDetail and Supplier360 inherit more children and transitions than their
  tabs show; most carry `appRoot` or `product360Tabs` conditions, Supplier360's `Documents` none. Inspect
  otherwise-valid direct requests, transitions and exports with owning-app positives; menu exclusion is not evidence.
- **Walk depth.** Several client acceptance walks inspect only form/state/layout and record nothing; cost close,
  materials, quantities, quality and changes need their persisted outcomes and recovery branches.
- **Mode differences.** Standard/fallback versus qvue/terminal rendering differs for Station, schedule and resource
  calendar; inspect the real launch and supported modes before diagnosing a blank board.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan and document review — 2026-11-10 | Manufacturing author in the four-app documentation batch; current routes/mounts, workflows, permissions, fixtures, custom modes, tests and historical deferrals; an independent reviewer and the coordinator corrected subcontract acceptance sequencing, the shared terminal twins, the XLSX/Capacity CSV and inherited price outputs, and reconciled the companion handoffs | Source/document inspection and independent rechecks only; no live runtime, tests, outputs or production mutations | Initial document written and corrected; all MFG activities pending |
| Source check — 2026-11-11 | Rechecked every route, mount, default, dialog, render-mode screen, fixture, user grant, area authz, spec and link against mr-moqui `aac9182a8f3d`, mr-boss `5fbf075926b6`, mr-mantle `9555048e60d6` | Read-only source and document inspection; no runtime, tests or mutations | Corrected the Approvals topics, InventoryAvailability tabs, actor grants (STOCK_ISSUE output, supervisor/planner splits, rates, timesheet approver, buyer without Purchasing launcher, cost-close scope), area access, transfer conversion, maintenance block and outputs; condensed §2/§5 to Manufacturing specifics; all live activities remain pending |
| Cross-review reconciliation — 2026-11-11 | The five companion reviews reconciled with one another and with source: handoff sides, shared fixtures, prepared identities, the shared-runtime disposition and the method wording | Source and document inspection only | Placement of MFG-25's PO cited as PUR-21 (not PUR-13); MFG-26 leaves the Warehouse route's review to WH-30 and MFG-28 the Accounting queue to ACC-24; transfer refusal observed in MFG-24; handoff table added (MFG-32); all MFG activities pending |

The first batch's source baseline was mr-moqui `73c8a8945abff9709260e922b4ba6c348ee903b3`, mr-boss
`1f6fde4e450a1e4b79773e4a4e5d8de3dad0eebf`, mr-mantle `aa702d05da2b12932abf788a7c12a428b388ced6`. These identify source
research, not a binary or test result.

For each execution batch append: its pass (review or refinement); actor and fixture identities; source and binary
revisions; runtime, clock and modes; activities and branches attempted; findings and owning layer; important
before/after evidence; persisted outcomes and inspected artifacts; exact checks, results and skips;
design/implementation updates; commits when made; temporary grants, settings and policy rows restored; unresolved
continuations. Keep notes bounded and refer to evidence files rather than pasting logs or tokens.

## 7. Decisions

- **Planning record and method:** planning only, written 2026-11-10, checked against source and reconciled with the
  four companion reviews on 2026-11-11; no runtime, walkthrough, test, build, application change or commit, and every
  activity pending. Products' seven-part structure; §2 and §5 keep only Manufacturing specifics and link the guide and
  Products for the generic method (user decision, 2026-11-11); earlier reviews' statuses, authorizations and
  exceptions do not carry over.
- **Source and handoffs:** current mounts, services and grants govern scope, and older records are reconciled here
  without being rewritten. Each side of a cross-app handoff is exercised once, by the activity the handoff tables name
  (MFG-32 here); the other review opens it only as far as the handoff.
- **Production basis:** distinguish method/release date, run/operation identity, plant/owner/custodian, unit, quantity
  stage and financial authority. Use disposable local stock, orders, time, files and posting fixtures; preserve
  operation identities, revisions, immutable instruction evidence and historical entries.
- **Actors follow the grants, not the role names:** output receipts and output-operation completion are the material
  handler's (`STOCK_ISSUE`), the supervisor neither plans nor issues, the buyer has no Purchasing launcher and the
  cost-close user no Accounting launcher. Where an activity needs a grant combination no demo user holds (§2), prepare
  a named composite rather than borrowing `manufacturing.admin`, or record the admin's limit.
- **Own subcontract for the custody walk:** MFG-26 follows the subcontract MFG-25 creates and PUR-21 places, so
  Warehouse's shared `BOSS_WH_SUB_PO`/`BOSS_WH_SHIP_SUB` stay intact for WH-30 and the walks.
- **Modes and completion:** Material is the visual target; actual TUI and brief Standard/output checks stay explicit.
  Narrow operator work is deliberate, and implemented mode limits are respected. Completion needs evidence for the
  selected activities, resolved or accepted findings and a candid ledger of what remains; a source inventory or
  passing suite is not a usable workflow.
- **Phases (user decision, 2026-11-11):** a complete review pass with concurrent agents comes first and corrects
  nothing; all findings are triaged together and addressed in a separate refinement pass (§2).

### Execution setup dispositions

The user decided every setup question on 2026-11-11. Record the actual values (instances, paths, ports, hostnames and
dates) in the first live batch and whenever an instance is added, as Products did:

- **Bootstrap and instances (decided):** the release binary, embedded Postgres and disposable databases throughout.
  The coordinator decides which agents share an instance and which get their own, and when (major data staging or a
  conflicting setup), and starts further instances on the fly on free non-default ports with their own hostnames (user
  decision, 2026-11-11). Record each instance's runtime and database paths, linked components, loaded demo data and
  any selected fixture specs; listener ports and hostnames.
- **Shared runtime (decided):** the coordinating agent decides whether the five reviews share one runtime and
  manages the concurrent agents, the cross-review order and the restore of Retail-wide changes (§2).
- **Dates and zones (decided):** the real clock in the machine's current zone, recorded with the execution date, and
  no DST or second-zone checks (user decision, 2026-11-11); the fixtures re-dated relative to it (§2).
- **Tool capability:** measured viewports, terminal keyboard and Chromium/PDF. 200% browser zoom is not checked
  (user decision, 2026-11-11).
- **Posting and mutation extent (decided):** postings and temporary setting, grant and policy changes in the
  disposable runtime are allowed (user decision, 2026-11-11); the coordinator sequences them and restores the changes.
- **Prepared fixtures (decided):** prepared users may be created for testing (user decision, 2026-11-11): §2's
  composite identities (including `retail.manufacturing.gl`), and the kit and forward repost flags for MFG-17.
- **Automation selection (decided):** focused acceptance walks and fixture specs along the way, and the full
  application acceptance run after the final `./moq test-apps` (§5; user decision, 2026-11-11). The client suite's
  server also loads Products, Warehouse, Accounting and Insights fixtures.
- **Test cadence (decided):** local, focused checks before each commit in either pass, and one `./moq test-apps`
  (with `./moq test-framework` if framework code changed) at the end of the refinement pass (§5; user decision,
  2026-11-11).
