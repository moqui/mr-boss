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
clear, including when a reader cannot change the record or see its financial values.

This follows [Products](ui-review-products.md), [Accounting](ui-review-accounting.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase). Keep the current inventory, activities,
coverage, findings, decisions and bounded execution notes here. Research records comparison patterns, design specifies
behavior, implementation records construction, and this document plans the review of the implemented experience.

**Status: planning only, 2026-11-10 America/Chicago.** This document was written from source and existing records as
part of the four-app documentation batch. All live activity and mode coverage starts pending. No review runtime,
browser or terminal walkthrough, test, build, production mutation or commit was performed to write it. Historical
implementation results and existing tests establish useful starting points; they do not establish review outcomes.

### Inputs and reference patterns

Other review plans in this batch: [Warehouse](ui-review-warehouse.md),
[Purchasing](ui-review-purchasing.md) and [Customer Service](ui-review-customer-service.md).

- [Manufacturing design](design-manufacturing.md), [implementation](impl-manufacturing.md),
  [research](research-manufacturing.md) and [implementation notes](../docs/ManufacturingImplementation.md).
- [Accounting review](ui-review-accounting.md), [Products review](ui-review-products.md),
  [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../plans/UI-Refinement.md).
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and current Products, Warehouse, Purchasing, Accounting and Projects contracts
  where they supply methods, physical movements, service purchase orders, financial authority or time records.
- `screen/Manufacturing.xml`, `screen/Manufacturing/`, its mounted `screen/Shared/` sources and descendants,
  `template/Manufacturing*.xml`, applicable Warehouse quality/material templates, `service/ironstone/manufacturing/`,
  Products' shared context, `MoquiConf.xml`, `data/BossSetupData.xml`, `data/BossUsersDemoData.xml`,
  `data/BossManufacturingDemoData.xml` and the Manufacturing demo-loader services.
- Current Manufacturing regression and acceptance specs, their helpers and client registrations; Mantle's production,
  method, work-center, planning, quality, timesheet, stock and cost-close services/entities/rule tests. Current source
  takes precedence over older proposed routes, superseded role descriptions and broad “Later” paragraphs.

Use the earlier research as a comparison lens: Carbon's production/operator separation, ERPNext's material and
work-order continuity, Odoo's method-to-operation navigation, and the Moqui baseline's records and services. These
are patterns documented in that research, not fresh claims about external products or a requirement to build their
feature inventories. A comfortable operator workflow and a trustworthy handoff matter more than matching a screen
count or introducing a new board.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Manufacturing shell, plant choice, lists, forms, shop floor, reports and app-specific context | BOSS Manufacturing; `AccessServices` and its shared context establish app entry and record scope |
| BOM, routing, operation templates, released methods and cost estimates | Mantle owns the rules; Products' existing shared screens/context serve the Manufacturing mounts; preserve the same dated method identity |
| Work orders, production operations, quantities, changes, planning, downtime and production cost facts | Mantle `ProductionServices`, `ProductionPlanningServices`, `ProductionReportServices`, `RoutingServices`, `WorkCenterServices` and `SupplyPlanningServices`; BOSS supplies presentation and app context |
| Staging, issues, unused returns, output receipts, held stock and vendor custody | Warehouse's existing guards and shared MaterialIssueReceipt; Manufacturing's mount supplies the run context and its own record checks, not new stock authority |
| Inspections, templates, verification and disposition | Shared quality screens/templates and Mantle quality/production rules; review production gates and the inspection-station mount, with a second consumer for a shared correction |
| Subcontract demand, agreement, service PO and shipment | Manufacturing owns operational demand/status; Purchasing owns order placement/approval/change and acceptance reconciliation; Warehouse owns physical dispatch/return and output receiving. Mantle's `receive#SubcontractOutput` atomically records custody issues, output receipt, service acceptance and accrual under `STOCK_ISSUE` |
| Cost estimates, actual WIP, requested review and cost close | Manufacturing owns operational facts and review requests; Accounting owns financial authority and costing policies; shared ProductionCostClose and Mantle own preview, posting and return-to-production |
| Time, follow-up tasks and maintenance requests | Existing Projects/Commons/Mantle services; production operations remain production work, never ordinary tasks or calendar events |
| Chatter, RecordFiles, approvals, notifications, palette and Today | Existing Commons/shared surfaces; inspect Manufacturing identity, audience and return routes without repeating a complete Commons review |
| Timeline, calendar, station, handheld widgets, print and TUI | Existing framework/Projects/Commons components plus Manufacturing's adapters; shared causes belong at their owner |

Preserve routes, record keys, operation identity, expected revisions, method dates, preferences and service/entity
contracts. Record unavoidable compatibility changes before implementation. An app mount is a presentation context,
not permission: restricted costs, rates, supplier prices, foreign plant records and private evidence must be absent
from responses, choices, files and outputs, not merely hidden by the screen.

Do not build absent features to finish this review. AssemblyViewer, WallDisplay, general manufacturing unbuild,
Nonconformances/Gauges, forecasts/master/finite scheduling, customer-material jobs, batches and a shared-station
operator switch remain outside this pass. Kit disassembly, controlled amendments, live scheduling, supply planning
and cost close are built and remain in scope. There is no Manufacturing-owned PASS app: supplier-portal steps belong
to Purchasing's bounded external handoff and are included here only when needed to explain a subcontract's status.

## 2. Review method and refinement criteria

### Environment and fixtures

For later execution follow the UI review guide and repository building/testing skills. Use an isolated runtime and
fresh disposable database with individually linked Mantle and BOSS components. The framework-only bootstrap leaves
the addon directory empty, so explicitly supply these applications. Copy mutable configuration and isolate stock,
files, mail capture and output artifacts from working data. Different ports do not isolate a database or browser
cookies; give independent browser identities separate hostnames. A component symlink still points at source files.

One coordinator owns runtime lifecycle and shared settings. Record source and binary revisions, loaded components,
actual runtime/database paths, hostnames, ports, fixture setup, clock/zone and evidence directory at the first live
batch. Check browser and actual terminal access before delegating an activity. Use a suitable existing binary for
screen/script work; rebuilding embedded renderers is a separate framework concern. Check loaded assets and PDF
availability before interpreting a stale page or failed output as an application defect.

Manufacturing's main demo plant is **`ZIRET_WH`**, owned by **`ORG_ZIZI_RETAIL`**, with lines **`BOSS_MFG_LINE_A`**
and **`BOSS_MFG_LINE_B`**. The method is **`BOSS_MFG_BOM_PILOT`** for **`DEMO_1_1`**, with routing
**`BOSS_MFG_ROUTING_A`**; the draft run is **`BOSS_MFG_RUN_A`**. **`BOSS_MFG_RUN_Q`**, its weld gate and
**`BOSS_MFG_INSP`** supply production-quality context. Warehouse's **`BOSS_WH_RUN`**, operation **`BOSS_WH_RUN_OP`**,
service order **`BOSS_WH_SUB_PO`**, dispatch **`BOSS_WH_SHIP_SUB`** and vendor facility **`BOSS_WH_VENDOR`** supply the
subcontract starting point. Preserve a baseline and clone/create disposable records for steps that consume them.

**`BOSS_MFG_SVC_PLANT`**, **`BOSS_MFG_SVC_LINE`** and **`BOSS_MFG_SVC_RUN`**, in **`ORG_ZIZI_SERVICES`**, supply
foreign-scope counterparts. The standalone helper constructs another isolated organization and capability-specific
users; inspect its setup before borrowing it. Accounting's `BOSS_ACCT_ORG` is not Retail. A finance actor without the
run's organization scope is not a valid positive for a production-cost permission check.

| Fixture role | Existing starting point and purpose |
| --- | --- |
| Production reader | `manufacturing.read`; root plus production read, with no neighboring launcher |
| Planner and scheduler | `manufacturing.plan`, `manufacturing.schedule`; distinguish planning/release and schedule changes |
| Method engineer and approver | `manufacturing.method`, `manufacturing.methodapprove`; draft/publish preparation versus release decision |
| Operator and supervisor | `manufacturing.operate`, `manufacturing.supervise`; execution versus overrides and exceptions |
| Material handler | `manufacturing.material`; operator composed with Warehouse issue/move groups; useful for movements, not a narrow operator negative |
| Inspector, verifier and template administrator | `manufacturing.inspect`, `manufacturing.verify`, `manufacturing.qualityadmin`; actual inspection, verification/disposition and template permissions differ |
| Estimator and financial reader | `manufacturing.cost`, `manufacturing.finance`; estimated method costs versus actual financial evidence |
| Cost-close approver | `manufacturing.costclose`; Accounting's approval authority without its launcher, with the run's organization scope |
| Buyer | `manufacturing.buyer`; Purchasing's buyer grant for outside-processing conversion and permitted price reads |
| Resource administrator | `manufacturing.resource`; work-center/resource and production-policy configuration |
| Administrator and foreign reader | `manufacturing.admin` reaches all plants; `manufacturing.services` reads Services; the administrator is unsuitable as a scope negative |
| Display-only outsider | `manufacturing.display` has the display group without root access; WallDisplay remains unbuilt |

Verify the loaded users' current groups, permissions and organization relationships. Root access and a capability
are separate. `STOCK_ISSUE`/`STOCK_MOVE`, `PURCHASE_ORDER_EDIT`, `ACCOUNTING_VIEW` and `PRODUCTION_COST_POST` are
composed grants, not consequences of being a Manufacturing supervisor. Pair refusals with the same otherwise-valid
request by a holder; a missing field, invalid status or wrong organization is not proof of a permission refusal.

Prepare representative data deliberately:

- Simple and routed orders, an empty draft, an ordinary release, staged shortage, partial good output, rework,
  scrap, held output, secondary output, completed and cost-closed runs. Retain separate records for cancellation,
  splitting, kit reversal and a retry after an uncertain response.
- Two effective method dates, released and draft lines, a non-phantom subassembly, a phantom, missing/cyclic method
  findings, incompatible units, and instruction content published before/after release. A method change must not
  silently rewrite a released order's facts.
- Available, reserved, held, expired and counted stock; tracked lots/serials, fractional units, supplier custody,
  two candidate lots and a same-looking asset in another plant. Stock quantities and cost layers are separate facts.
- Working hours, shutdown/offline time, alternate centers, limited slots, predecessor conflicts, an unscheduled
  operation, missing calendar/rate, a stale move preview and an explicit override decision.
- Dated policy/rate boundaries, long/localized names, empty/filtered/paged lists, multiple repeated row dialogs,
  missing/inaccessible records, and two actors changing one reviewed record. Inspect fixture dates against the
  execution date; a fixed demo week is not necessarily a useful current schedule.
- Mixed-validity BOM/routing CSV, an invalid instruction attachment, output labels and multipage travelers, captured
  approval notifications and synthetic integration failures. Hardware printing and a real carrier are not needed
  to review the local content; missing hardware/output support remains an explicit gap.

### Visual and interaction review

- Material `/qapps` is the visual target in light and dark at **1920×1080**, with selected **1280px**, **390px**,
  keyboard-only and actual **200% zoom** cases. Give the shop floor, scan inputs, quantity dialogs, split wizard,
  timeline and inspection station deliberate narrow/touch coverage instead of multiplying every screen by every mode.
- Inspect real TUI launch, light/dark changes, focus, pickers, forms, confirmations and saved results. Station's JSON
  board and the two XML terminal twins are distinct interactions, not proof supplied by a successful JSON render.
  Give Standard `/apps` a brief functional/output/fallback check; a qvue-only calendar need not become a new HTML UI.
- Keep work-order, operation, product, plant and release/method date visible. Distinguish required, issued, returned,
  remaining, produced, received, held, scrapped and accepted quantities. An operation complete, a work order complete
  and a financial close are different outcomes.
- Use the established record header, one primary action, grouped fields, clear read-only states and discoverable
  secondary actions. Explain blocked actions with the specific shortage, predecessor, inspection, instruction,
  revision or authority issue and a useful path to resolve it.
- Check ordinary text at **4.5:1**, qualifying large text at **3:1**, and meaningful controls/state indicators at
  **3:1**, against the actual composited background. Inspect state chips, timeline bars, conflict shading, disabled
  controls, quantities, negative variances and selected cards in both themes; never rely on color alone.
- Follow filters, saved finds, supported boards/calendars, columns, sorting, paging and Back. Compare counts and
  selected records before and after changing plant, view or scope. Export only the scope actually offered by the UI.
- Test native typing, blur/change, Enter/Escape, accessible scan/button names, keyboard card selection and focus
  return. Scan empty, unknown, ambiguous and foreign codes; a physical scanner's terminator and repeated scan should
  not submit a stale operation. Keep gloves/touch density and long operator instructions readable.
- A drag previews; a deliberate confirmation commits. Cancellation, Escape and backdrop dismissal change nothing.
  Check late asynchronous responses, rapid plant changes, navigation while loading and permission/revision loss after
  opening a dialog. A reviewed operation cannot silently become a different row or plant.
- Inspect persisted stock, quantity/time/cost events, revision, approval and linked ledger effects after each action.
  An unchanged operation retry must not duplicate facts. Independent batch/import/conversion failures name their
  item and leave successes usable; a single coordinated stock or cost operation remains atomic.
- Inspect actual CSV/XLSX, print HTML/PDF and label bytes: units, identity, dates, source revision, held warnings, page
  breaks, barcode/text identity, totals and restricted values. “Downloaded” or “printed” is not evidence of correct
  content or physical delivery. Record output modes that need browser delegation from terminal.
- Inspect palette, quick create, Today and approval links in their app context. Manufacturing's Today operation is
  not a Commons task with Mark done; the generic Assist context does not imply a production action integration.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Establish methods and plant context | MFG-01–06 | Workday, released methods, resources and effective policy |
| 2. Plan and supply a work order | MFG-07–09, 22–24 | Draft/release, scheduling, requirements, make conversion and materials |
| 3. Execute and reconcile the floor | MFG-10–13, 18–21 | Partial output, loss, quality, scan/instructions, time and downtime |
| 4. Recover controlled changes | MFG-14–17 | Substitution/amendment, split/backorder, cancellation and supported kit reversal |
| 5. Follow outside processing | MFG-25–26 | Buyer handoff, vendor custody, accepted service and returned output |
| 6. Explain and close production | MFG-27–30 | Cost facts/review, financial close, reports and actual outputs |
| 7. Reconcile evidence and boundaries | MFG-31–32 and open continuations | Shared surfaces, permission/scope pairs, return routes and remaining modes |

Permission pairs, evidence and recovery run through every wave. Important continuations are method release → run
release → frozen instruction; plan → make/subcontract demand → stock; operation/time/inspection → partial output →
completion; subcontract service acceptance → matching/cost facts; downtime → maintenance request → scheduling;
quantity and material corrections → cost review → financial close and reports. Keep each unfinished continuation in
its originating ledger row. Start with MFG-01 and a disposable MFG-07/08 path to establish identities and modes.

Later authorized execution follows observe → prioritize → refine → rerun affected activities → compare evidence →
verify → update this record. Serialize shared policy changes, stock fixtures, accounting locks and runtime lifecycle.
Do not borrow Products' or Projects' earlier execution exceptions as authority for this pass.

## 3. Screen and surface inventory

Paths below are relative to `/qapps/Manufacturing`, with `/apps/Manufacturing` for applicable Standard/print entry.
Inventory current physical files and explicit mounts together: there are **70 local XML screens including the root**,
and many more route instances through shared descendants. The same source mounted twice is two consuming contexts.
Section roots and their defaults are included; a trailing `/` may render the default child instead of its parent.

### Local routes

| Path prefix | Local screens / surfaces | Activities |
| --- | --- | --- |
| App root | `Manufacturing`, `Home`, `ReportDowntime` | MFG-01, 21, 31–32 |
| Section roots | `WorkOrders`, `ShopFloor`, `BillsOfMaterials`, `Routings`, `WorkCenters`, `Quality`, `Planning`, `Subcontracting`, `Settings`, `Approvals`, `Reports` | MFG-01 and the section's activities below |
| `BillsOfMaterials/` | `Find` | MFG-02, 04, 30 |
| `Routings/` | `Find`, `OperationTemplates` | MFG-03, 18–19, 30 |
| `WorkCenters/` | `Centers`, `Equipment`, `ResourceCalendar`, `ResourceCalendarTui`, `Downtime` | MFG-05, 21–22 |
| `Settings/` | `ProductionSettings`, `ReasonCodes` | MFG-06, 11, 21, 28 |
| `WorkOrders/` | `Find`, `NewWorkOrder`, `QuickCreate`, `WorkOrderDetail`, `Disassembly` | MFG-07–08, 17 |
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
| `Approvals/Notifications` | Commons Notifications; method/routing, release, shortage, loss, quality, schedule and change topics return to their authoritative records | MFG-02–03, 08, 11, 13–14, 22, 31 |
| `BillsOfMaterials/BillOfMaterialsDetail` | Shared BillOfMaterialsDetail, default `Overview`; explicit `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | MFG-02–04, 14, 30 |
| `BillsOfMaterials/WhereUsed`, `BillsOfMaterials/CostRollup`, `Routings/RoutingDetail` | Shared standalone method/cost routes in Manufacturing context; method and cost permissions remain independent | MFG-03–04, 27, 30 |
| `BillsOfMaterials/Product360` | Shared Product360, default `Summary`; Manufacturing offers `Summary`, `Identifiers`, `Dimensions`, `BOM`, `Costs` when allowed, `Stock`, `KitComponents`, `Documents` | MFG-04, 09, 17, 27, 31–32 |
| `BillsOfMaterials/Product360/BOM` | The same BOM detail/default and all five children listed above, under the product mount | MFG-02–04, 14, 32 |
| `BillsOfMaterials/Product360/Stock` | Shared InventoryAvailability and `Summary`, `Locations`, `Movements`, `Reservations`, `Projection`, `Policy`; inspect each inherited route against the offered context | MFG-09, 23, 32 |
| `BillsOfMaterials/Product360/Documents/Index` | Shared Documents through the Documents tab; document identity and file authority remain the product's | MFG-04, 31–32 |
| `Planning/InventoryAvailability` | The same Shared InventoryAvailability and six children; direct planning context differs from the Product360 stock mount | MFG-09, 23–24, 32 |
| `Planning/SupplyPlanning` | Shared SupplyPlanning; parameters, schedule, suggestions, held quantity, demand/supply, conversion and snapshot links | MFG-23–25, 30, 32 |
| `WorkOrders/WorkOrderDetail/MaterialIssueReceipt` | Shared MaterialIssueReceipt in production-run context; issue, backflush, receive output and return unused, plus Stage stock to Warehouse | MFG-09–11, 26, 32 |
| `WorkOrders/WorkOrderDetail/ProductionCostClose` | Shared ProductionCostClose in the run's Manufacturing mount; Accounting's queue is a separate consumer | MFG-27–28, 32 |
| `Quality/QualityInspection`, `Quality/InspectionStation/Inspection` | Shared QualityInspection in full and operator/handheld contexts; each has its own entry and return route | MFG-13, 30–32 |
| `Quality/InspectionTemplates` | Shared InspectionTemplates with Manufacturing context; dated template and characteristic dialogs | MFG-12–13, 32 |
| `WorkCenters/FacilityDetail` | Shared FacilityDetail, default `Overview`; Manufacturing offers `Overview`, `WorkCenter`, `Files`, `Conversation` | MFG-05, 21–22, 31–32 |
| `WorkCenters/EquipmentDetail` | Shared EquipmentDetail with Manufacturing equipment/downtime/maintenance sections; financial book content is separately protected | MFG-05, 21, 27, 32 |
| `WorkCenters/RequestDetail`, `WorkCenters/WorkItemDetail` | Shared maintenance request and its follow-up task; embedded tabs/panels rather than physical child routes; production operations are rejected as ordinary tasks | MFG-21, 31–32 |
| `Subcontracting/Supplier360` | Shared Supplier360, default `Overview`; Manufacturing's `SubcontractOrders`, `Documents`, `Conversation` and contact summary | MFG-25–26, 31–32 |
| `Subcontracting/OrderDetail`, `Subcontracting/ShipmentDetail` | Shared read-only Manufacturing sections: supplying production links and service PO evidence, or subcontract shipment/custody facts; order/physical execution stays with its owning app | MFG-24–26, 32 |

Hidden from Manufacturing's tab menu does not establish that an inherited URL is safe or absent. Keep these
supporting source/direct-route inspections with MFG-32 and the relevant permitted counterpart:

- Product360 additionally inherits `Features`, `Categories`, `Packaging`, `Prices`, `Suppliers`, `Equipment`,
  `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PurchaseHistory`, `PaidAccess` and hidden
  `InsightsRecord`. Prices/supplier tabs use their shared source screens; they are not Manufacturing capabilities.
- FacilityDetail additionally inherits `Children`, `Locations`, `Products`, `Policies`, `Printers`, `BoxTypes`,
  `Schedules` and hidden `InsightsRecord`. Manufacturing's work-center calendar and offline forms do not make every
  facility-administration tab available.
- Supplier360 additionally inherits `Prices`, `Buying`, `Finance`, `Bills`, `Receiving`, `PurchasingAgreements`,
  `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `PurchasingDropShip`, `PurchasingPerformance` and
  hidden `InsightsRecord`; inspect their direct helpers, including inherited supplier approval/invitation transitions.
- Inherited price outputs include CSV and XLSX at `BillsOfMaterials/Product360/Prices`,
  `BillsOfMaterials/Product360/Suppliers` and `Subcontracting/Supplier360/Prices`, declared by Shared Prices and
  SupplierPrices. These are supporting MFG-32 authorization/export checks, not Manufacturing price authority.
  Pair an authorized owning-app export with an otherwise-valid denied Manufacturing-context request; inspect any
  returned bytes/workbook cells for restricted-value omission as well as the response's refusal.
- InventoryAvailability's inherited `Policy` and other tabs must be assessed separately at both stock mounts.
  A product/method context, production read or selected plant must not grant stock policy changes.

### Dialogs, custom modes, outputs and embedded surfaces

| Surface family | Inspect with its activity; include cancel/reopen/recovery | Activities |
| --- | --- | --- |
| BOM/routing lists and detail | New/clone, legacy and CSV import, header/component/operation/resource edits, validation, request/approve release, copy operations; import preview/result errors | MFG-02–04 |
| Operation templates | New/edit/archive template, publish dated instruction, instruction-file response and selected-template choices | MFG-03, 19, 30–31 |
| Work-center detail | Make/edit center, capacities/rates/alternates and End, offline preview/apply/withdraw, affected-operation reschedule | MFG-05, 22 |
| Policy/reasons | Consumption, Time and cost, Planning; add/edit/deactivate/reactivate reason, effective date and change reason | MFG-06 |
| Work orders | New wizard/quick create, edit/assign person/equipment, lifecycle and bulk actions, clone, material/substitute, quantity/output/loss, amendment reviews, split/backorder and close-out | MFG-07–16 |
| Material task | Asset/lot choice, issue, explicit backflush preview/confirm, output/tracking receipt, unused return; Stage stock and return from Warehouse Move | MFG-09–11, 26 |
| Shop floor | Scan ambiguity and selected operation, timer switch, Start/Pause/Complete/Override, runtime, instruction acknowledgment/evidence, timesheet Submit/Approve/Reopen | MFG-18–20 |
| Quality | Template publish/retire, reading, assign/submit/verify/dispose/reinspect/cancel, handheld characteristic forms, gate checklist/certificate | MFG-12–13 |
| Downtime | Report/End/Correct/Approve stop, maintenance request and equipment-bound quick create | MFG-21 |
| Planning/subcontract | Move preview/apply/unschedule, override request/decision, schedule config, suggestion conversion and per-row results, request outside processing/edit agreement | MFG-22–26 |
| Costs | Request review, close preview, Post cost close/adjustment, Return to production; linked Accounting costing policy | MFG-27–28 |
| Station | `ShopFloor/Station.qvue` with `Station.tui.json`; `queueRows`, `scanOperation`, `startOperation`; Standard/qvt fallback text is not the operator board | MFG-18–20, 32 |
| Schedule | Projects `WorkItems/Timeline.qvue` resource mode; `schedule`, `moveOperation`, `decideOverride`; `ProductionScheduleTui` supplies the terminal forms | MFG-22, 32 |
| Resource calendar | Commons `Calendar.qvue` read-only resource mode; `calendarSetup`, `calendarEvents`, `eventSummary`; `ResourceCalendarTui` supplies an agenda | MFG-05, 22, 32 |
| Inline mode sections | State/quality/cost chips, reason/template flags, row actions, label/traveler barcodes, production time and capacity; shared screens/templates add their own qvt/tui/html sections | MFG-01–32, at their owning screens |
| Physical outputs | Traveler, PickSheet, OutputLabels, QualityChecklist, InstructionsPrint, QualityCertificate and dispatch/return SubcontractInstructions | MFG-30 |
| Analytical outputs | Eight report CSV/XLSX/print views, Capacity CSV/print, PlanSnapshot/ScheduleSnapshot CSV/print, method/explosion/compare/roll-up outputs actually offered | MFG-04, 22–24, 27–30 |
| Evidence and shell | Chatter/files, notes, template attachments, approval topics, palette, Today, quick create and generic screen context | MFG-01, 19, 21, 31–32 |

Explicitly inspect custom `render-mode` sections in the local lists, detail tabs, operations, inspection list,
equipment/center lists, capacity, reason/template screens and printed labels/traveler. Do not infer their terminal
content from the default XML renderer. Standard fallback text on Station/Schedule and supported-mode limits on
ResourceCalendar remain truthful limitations to record, not missing features to implement under this plan.

### Design-to-code reconciliation

| Design or historical statement | Current review treatment |
| --- | --- |
| `WorkOrders` list, `ShopFloor` board and work-order `Time` | Actual entries are `WorkOrders/Find`, `ShopFloor/Station` and `ShopFloor/ProductionTime`; retain real routes in activities |
| “Today” placeholder paragraphs in implementation introduction | Historical pre-build state; the built local tree and current services govern the inventory |
| BOM/routing “versions” and production snapshots | Read effective-dated method lines, release time, run-owned lines/revision and immutable instruction content; do not invent the dropped version entities |
| ResourceCalendar and ProductionSchedule described as qvue screens | Their XML mounts reuse Commons Calendar and Projects Timeline; only Station has an app-local qvue; both shared components have local XML TUI twins |
| ProductionCostClose/CostingPolicies formerly deferred | Shared cost-close tab is built; ProductionSettings links to `/qapps/Accounting/Settings/CostingPolicies`, a separate Accounting route rather than a Manufacturing child |
| Purchasing supply-plan mount, buy conversion and service PO caller listed in old §7 | Purchasing's Replenishment/SupplyPlanning and order workflow are now built; review the current handoff. Warehouse transfer-plan adoption still needs its actual source checked, not inferred from a shared comment |
| `ManufacturingIsolationWalk` and `ManufacturingCostIsolationWalk` names in historical verification prose | Their coverage is in current `ManufacturingAccessWalk`; there are no separate files with those names in the current inventory |
| AssemblyViewer, WallDisplay, Nonconformances, Gauges, DemandForecasts, MasterSchedule, FiniteSchedule, CustomerMaterialJobs, Batches/BatchDetail | Unmounted designed work remains deferred, with no live activity falsely assigned to it |
| General unbuild, merging compatible drafts, variant-applicability editor, WhereUsed replacement revisions and compare ChangeNotices navigation | Remain separate unless current source establishes a built path; supported kit reversal and actual amendment input are reviewed as implemented |
| Shared station identity switching and device credentials | Deferred; review the authenticated operator's own timer and session, not an invented kiosk sign-in flow |

## 4. End-to-end activities

These are instructions for later authorized review, not reports of executed work. Each activity carries its own
actor, starting state, visible path, result and recovery. Common mode criteria in §2 apply; the named modes below
identify additional distinctions. Keep missing prerequisites and tool limits in the ledger instead of silently
reducing an activity to a landing-page render or service call.

### MFG-01 — Start a production workday in the right plant

- **Actor/start:** production reader, planner and operator; one-plant, multiple-plant and empty authorized scopes.
- **Objective/steps:** open Manufacturing → choose plant → inspect summary, due work, shortages and permitted KPI
  links → follow a filtered list → open a record → Back. Use the palette, Today operation and `g q` shortcut; open,
  cancel and reopen the work-order and downtime quick creates where authorized.
- **Expected:** plant and organization remain recognizable; Home and destination filters agree; absent information
  is distinct from zero; reader navigation remains useful. Quick create does not inherit an unrelated record key.
  Today opens the operation in Manufacturing and does not offer an ordinary task completion action.
- **Recovery:** no plant, stale saved plant, no matches, inaccessible recent record, failed independent Home source,
  changed active organization and plant choice during loading. A preference never widens the actor's scope.
- **Screens/modes:** Home, all section defaults, WorkOrders/Find, quick creates and shell providers; Material light/
  dark, actual TUI, brief Standard, keyboard/zoom and phone samples.

### MFG-02 — Create and release a dated bill of materials

- **Actor/start:** method engineer, separate method approver and method reader; an owned product, existing released
  BOM, draft change, eligible component units and current organization.
- **Objective/steps:** BillsOfMaterials/Find → New BOM or Clone → BillOfMaterialsDetail → edit draft header and
  add/change components → Validate draft → Request release → approver follows Approvals to the record → approve →
  inspect release history and the effective component set. Separately preview/import legacy components and CSV.
- **Expected:** draft versus released lines and effective date are clear; approval returns to the method; old
  released lines remain readable. Import results name each rejected version/item while valid independent work remains
  usable. A released production order continues to reference its released method basis.
- **Recovery:** duplicate/cyclic component, invalid unit/date, missing product, stale draft, canceled release,
  mixed-validity CSV, repeated import and revoked method authority. Retain entered values and actionable findings.
- **Screens/modes:** BOM list, detail/Overview, Approvals/Notifications and selected Product360/BOM counterpart;
  browser/TUI/Standard, two-row dialogs, keyboard and actual import/output content.

### MFG-03 — Prepare routing operations and immutable instructions

- **Actor/start:** method engineer, method approver, resource/cost editor only where their separate fields need it;
  operation templates, work centers and an existing routing with released and draft operations.
- **Objective/steps:** Routings/OperationTemplates → create/edit a template → publish an instruction attachment and
  evidence/skill requirements → Routings/Find → New routing or CSV import → RoutingDetail → copy/add operations,
  dependencies and resource requirements → validate → request/approve release → reopen the dated routing.
- **Expected:** template and routing operation identities remain distinct; instruction publication ends the prior
  dated content without changing its bytes. Released operations preserve their source; cost/rate editing requires
  its own grants. An archived template remains understandable on work that already references it.
- **Recovery:** missing work center/instruction, invalid dependency or unit, stale draft, mixed-invalid import,
  failed file read, canceled publish/release and change after release. Do not substitute a current file for historical
  instruction content when checking MFG-19.
- **Screens/modes:** Routings/Find, OperationTemplates, RoutingDetail, approvals and instruction-file response;
  browser/TUI/Standard, wide dialogs, keyboard and upload/download delegation where necessary.

### MFG-04 — Explain a method from product through explosion and comparison

- **Actor/start:** method reader/engineer and permitted estimator; dated method changes, non-phantom and phantom
  subassemblies, a kit and a constrained stock example.
- **Objective/steps:** Product360 → identity/units/kit/BOM → explosion with quantity, facility and as-of date →
  inspect levels, requirements, buildable quantity and findings → compare two dates → WhereUsed → affected method
  or released-run amendment link → return. Open CostRollup where permitted and inspect its offered preview/output.
- **Expected:** tree depth and net requirements are explained: a non-phantom subassembly's stock counts before its
  shortage is exploded, while a phantom is blown through. Comparison identifies dated header, material and operation
  changes; prices/actual financial data do not appear merely because a method is readable.
- **Recovery:** missing method/date, cyclic/deep path, missing conversion/rate, unavailable product, no where-used
  rows and foreign organization. Compare controls must retain both dates and quantity across navigation and output.
- **Screens/modes:** both BOM mounts and their Explosion/Compare/WhereUsed/RoutingDetail children, Product360's
  offered tabs, standalone WhereUsed/CostRollup; browser/TUI/Standard, wide tree/phone and exact CSV/print where offered.

### MFG-05 — Maintain usable work centers and equipment context

- **Actor/start:** resource administrator, operator and cost reader; two lines with calendars, product capacities,
  slots, an alternate center and equipment assigned to a line.
- **Objective/steps:** WorkCenters/Centers → New work center or FacilityDetail/WorkCenter → edit center facts →
  add/end capacity and alternate → permitted hourly rate → inspect load. Open Equipment → EquipmentDetail → inspect
  location/production/maintenance context. Open ResourceCalendar and its terminal agenda, then return to the center.
- **Expected:** a facility becoming a work center is explicit; capacity unit, slots, effective date and calendar basis
  are understandable. Rates appear only to authorized readers; the operator can identify the equipment and useful
  maintenance information without seeing financial book amounts.
- **Recovery:** wrong-plant center/equipment, invalid capacity/rate/interval, overlapping or expired row, missing
  calendar and canceled edit. A read-only resource calendar cannot accidentally create or move a Commons event.
- **Screens/modes:** Centers, FacilityDetail/Overview/WorkCenter, Equipment/EquipmentDetail, ResourceCalendar and
  ResourceCalendarTui; browser/TUI, two-row dialogs, long names and date/time-zone samples.

### MFG-06 — Change production policy and reasons with visible effective scope

- **Actor/start:** resource administrator and reader; organization defaults, a plant override, a released run and a
  new draft, with prior settings captured for restoration.
- **Objective/steps:** Settings/ProductionSettings → choose organization/default or plant → inspect value/source
  trace → change one Consumption, Time and cost or Planning group with effective date/reason → reload → inspect a
  consuming new release and the prior run. ReasonCodes → add/edit → deactivate/reactivate → inspect the chooser.
- **Expected:** inherited, overridden and unset values differ; a dated change preserves history; a released order
  keeps its release-time policy. Reason types, approval thresholds and active status make their operational effect
  clear. Accounting's overhead/co-product policy is identifiable as a separate authority and route.
- **Recovery:** stale effective row, invalid tolerance/horizon, wrong organization, inactive reason used by a new
  action, canceled save and missing policy permission. A failed edit retains input and cannot change another group.
- **Screens/modes:** ProductionSettings, ReasonCodes and consuming release/loss/downtime/supply-plan dialogs;
  browser/TUI/Standard, long forms, keyboard/phone and date-boundary checks. Restore fixture policy afterwards.

### MFG-07 — Create, inspect and clone a draft work order

- **Actor/start:** planner and production reader; released product method, authorized plant, optional requirement
  and equipment/person choices, with a separate empty-state fixture.
- **Objective/steps:** WorkOrders/Find → New work order → choose product, method/date, plant, quantity and due date →
  inspect producible-now and draft review → create → Overview edit/assign person/equipment → Components/Operations →
  return to Find. Repeat through shell quick create; clone an eligible order and inspect the new draft's identity.
- **Expected:** the created draft retains the chosen scope and method basis; stock availability is explanatory,
  not an issue or reservation. Clone is a new draft with no copied execution facts. List, board, calendar and detail
  show compatible identity, state and quantities; reader sees useful detail without edit controls.
- **Recovery:** missing/rejected product or method, invalid quantity/date, stale choice, another plant's assignment,
  canceled wizard/clone, failed save and Back with entered values. A retry does not accidentally create another draft.
- **Screens/modes:** Find, NewWorkOrder, QuickCreate, WorkOrderDetail/Overview/Components/Operations; browser/TUI/
  Standard, list view changes, keyboard and the existing phone-layout distinctions.

### MFG-08 — Release work and explain its lifecycle or shortage block

- **Actor/start:** planner, supervisor and reader; ready draft, short draft, released no-fact order and a running
  order, with policy determining ordinary/staged release.
- **Objective/steps:** WorkOrderDetail → inspect lifecycle checks → confirm Release → inspect frozen lines,
  operations, dates and notifications. On the short draft inspect the reason and permitted staged-release request/
  decision. Exercise offered hold/resume/unrelease/cancel actions on separate eligible records and inspect a small
  mixed-eligibility bulk action from Find.
- **Expected:** the primary action reflects actual state; release is separate from issue/start; a staged short line
  remains blocked until available stock covers its rule. Frozen method/policy and expected revision are consistent;
  batch results identify each success/refusal instead of treating every selected order as changed.
- **Recovery:** missing method/instruction/stock, stale order, approval refusal, canceled confirmation, changed
  permission and duplicate request. Unrelease or simple cancel must refuse after incompatible facts exist.
- **Screens/modes:** Find board/bulk controls, detail header/Lifecycle, Overview, Materials and approvals; browser/
  TUI/Standard, explicit confirmation, selection persistence and phone status/action layout.

### MFG-09 — Stage, issue and return the right production material

- **Actor/start:** material handler plus operator without stock issue; released run with two lines/lots, partial
  stock, held/reserved stock and a separate active physical-count fixture.
- **Objective/steps:** WorkOrderDetail/Components → Materials → inspect required/issued/returned/left/short/held →
  Stage stock into Warehouse Move with run context where authorized → return → select line/asset/quantity → issue →
  inspect movement/history. For a backflush policy inspect proposed lots/quantities and confirm; return unused stock.
- **Expected:** stage changes location, issue consumes against the run, and return references the original issue;
  none is a generic inventory adjustment. Lot/unit/run identity survives handoff. Backflush uses the displayed
  preview; a partial issue and return reconcile, with exactly one persisted movement per operation identity.
- **Recovery:** held/expired/reserved/count-conflicted stock, short staged line, wrong lot/plant, excess return,
  changed preview, canceled issue and retry. A refused line must not leave an unreported issue or ledger side effect.
- **Screens/modes:** Components, MaterialIssueReceipt, InventoryAvailability at both mounts and Warehouse/Transfers/
  Move; browser/TUI/Standard, selected-value labels, two-row dialogs and scanner/phone input where offered.

### MFG-10 — Record partial and secondary output with traceable receipt

- **Actor/start:** operator/material handler and supervisor where needed; running simple/routed order with partial
  good quantity, required tracking, a secondary-output line and an inspection policy.
- **Objective/steps:** Quantities → Record quantities → inspect event and remaining work → Materials → Receive output
  with lot/serial and location → inspect received/held quantity and labels. By-products → add permitted output or
  inspect planned secondary lines → receive through the same guard → follow the output and its genealogy.
- **Expected:** recording quantity and receiving stock remain distinguishable; good/rework/scrap are not silently
  added together as available stock. Required identities and ownership survive receipt; held output is visibly held.
  Secondary output with no valid cost basis has a named block rather than an invented value.
- **Recovery:** excess/negative/fractional quantity rule, duplicate serial, wrong output product, missing tracking,
  pending inspection, missing secondary cost, canceled receipt and replay. Completion is not implied by any receipt
  except the explicit release-time policy's supported atomic final-receipt path.
- **Screens/modes:** Quantities, ByProducts, MaterialIssueReceipt, OutputLabels and related stock evidence; browser/
  TUI/Standard, mobile tracking fields and actual labels. Continue quality and completion in MFG-11/13.

### MFG-11 — Resolve loss and overproduction before completing the order

- **Actor/start:** operator and independent supervisor; partial run, reason codes, overproduction/loss approval
  threshold, unused material and good/scrap/rework quantities that initially do not reconcile.
- **Objective/steps:** Quantities → Record loss or Change quantity → inspect pending exception → supervisor approves/
  refuses on the record → Quality/ScrapLoss inspect source → resolve remaining material/output/quality blockers →
  review Complete → confirm → reload completed order and its quantities.
- **Expected:** approved exception, scrap and rework have distinct meaning, actor/reason and cost facts; approval
  does not make rejected output available stock. Completion explains reconciliation and pending gates; accepted
  material variance is explicit where offered. Operational completion still leaves financial close separate.
- **Recovery:** invalid reason/type, stale quantity/revision, refused approval, loss beyond available quantity,
  unreconciled output, unreturned material, canceled Complete and duplicate event. Preserve original facts when a
  correction requires a linked reversal rather than rewriting history.
- **Screens/modes:** Quantities, ScrapLoss, ByProducts, quality/material tabs, notifications and resulting reports;
  browser/TUI/Standard, two-row decisions, phone totals and readable refusal messages.

### MFG-12 — Publish the inspection template used by production

- **Actor/start:** quality-template administrator, inspector and reader; draft/current templates with multiple
  characteristic types, required readings and effective dates.
- **Objective/steps:** Quality/InspectionTemplates → New template → add/change characteristics → inspect draft →
  Publish → inspect current and as-of versions/history → assign the intended template through production setup →
  create an inspection on a disposable run. Retire a separate template and inspect its selection behavior.
- **Expected:** published characteristic definitions are traceable to the inspection; changing the current template
  does not rewrite previous readings. Required, optional and pass/fail/numeric characteristics have readable units,
  bounds and instructions; draft publication and inspection verification are separate authorities.
- **Recovery:** missing/invalid characteristic bounds, incompatible units, stale version, canceled publish/retire,
  inactive template and foreign template key. An existing inspection retains its historical template evidence.
- **Screens/modes:** InspectionTemplates and its dialogs/chooser, run Quality and selected inspection; browser/TUI/
  Standard, wide characteristic rows, keyboard and two distinct row dialogs.

### MFG-13 — Inspect a production gate and disposition held output

- **Actor/start:** inspector → verifier/disposition holder; in-process gate and final-output gate, held receipt,
  required characteristic evidence and a separate rejected/reinspection example.
- **Objective/steps:** WorkOrderDetail/Quality → Inspect → QualityInspection → record readings → submit → verifier
  follows notification → verify → disposition → inspect gate, stock status and allowed next operation. Repeat entry
  through Quality/Inspections and InspectionStation scan → characteristic-by-characteristic operator form.
- **Expected:** sample/readings, submission, verification and stock disposition remain distinct. Pending/rejected
  gates explain their block; accepted output becomes available only through the authorized disposition, retaining
  the pegged source where applicable. Reinspection links to the earlier evidence rather than erasing it.
- **Recovery:** missing reading/evidence, invalid value, wrong inspection scan, unauthorized self/other decision
  under the current rule, canceled disposition, stale revision and retry. Follow scrap/rework back to the production
  loss/quantity outcome, not just an inspection status chip.
- **Screens/modes:** Quality tab/checklist, Inspections, both QualityInspection mounts, InspectionStation/Scan and
  certificate; browser/TUI/Standard, 390px operator input and actual print evidence.

### MFG-14 — Substitute a component and amend only remaining released work

- **Actor/start:** planner/method engineer, method approver and production supervisor; released order with a shortage,
  approved substitute and a later method whose changes affect both executed and unexecuted work.
- **Objective/steps:** Components → Substitute → inspect/request/decide → issue the approved substitute through
  Materials. Compare method dates → Changes → choose method date → inspect remap → Request amendment → method and
  supervisor reviews → inspect applied revision, retained executed facts and remaining lines/operations.
- **Expected:** substitution is explicit and bounded to the intended line; arbitrary product issue remains refused.
  The amendment names what changes, preserves material/time/output already recorded and applies once both required
  reviews exist. Strict-release policy explains the linked-new-order alternative.
- **Recovery:** unapproved substitute, stale preview, missing second review, refused request, incompatible remaining
  unit/operation, changed source after preview and canceled confirmation. A changed-input retry cannot reuse an old
  approval or operation identity to change another set of lines.
- **Screens/modes:** Components, Materials, BOM Compare, Changes and notifications; browser/TUI/Standard, two-row
  review dialogs, narrow remap display and retained input after a stale refusal.

### MFG-15 — Split remaining demand or create a linked backorder

- **Actor/start:** planner with an eligible partially completed or released run, demand links, quantities left and
  chosen disposition of remaining material; supervisor composition if the selected completion rule requires it.
- **Objective/steps:** WorkOrderDetail → Split → Allocation choose split/backorder, quantity, facility/due date and
  reason → Disposition inspect lines, demand and material effects → Confirm → open new order → follow parent link.
  Exercise the offered complete-original option only after its reconciliation preview permits it.
- **Expected:** only eligible remaining demand moves; both orders and requirement/supply links identify their
  relationship. Already-recorded quantities and facts stay on their source. The preview and confirmation agree on
  allocated quantity, disposition and whether the original completes.
- **Recovery:** quantity beyond remainder, wrong plant, changed revision, consumed demand, unresolved material/
  quality block, canceled wizard and retry. Back preserves entered allocation/reason; repeat confirms return the
  existing linked order rather than creating another backorder.
- **Screens/modes:** SplitWorkOrder's Allocation/Disposition/Confirm steps, resulting Overview/Components/Quantities
  and demand links; browser/TUI/Standard, keyboard, phone and long finding lists.

### MFG-16 — Cancel or close out a run without losing recorded facts

- **Actor/start:** planner/supervisor with separate no-fact draft/released orders and a run with material/time/output
  facts; open and locked accounting-date cases for any resulting movement.
- **Objective/steps:** inspect the eligible simple lifecycle cancellation → confirm and reload. On the fact-bearing
  run open Changes → inspect cancellation preview with return-unused choice → distinguish reversal from residual
  close → confirm → follow returned issues, completed/canceled state, retained evidence and cost-close continuation.
- **Expected:** a no-fact cancel and a posted reversal/close-out are visibly different. Physical returns use stock
  guards; historical posted facts remain; residual work reaches the intended financial review. The confirmation
  names the order and consequences, and its operation identity survives a safe retry.
- **Recovery:** unavailable return stock, consumed output, lock/date block, stale preview, changed facts, canceled
  confirmation and partial-looking response. Inspect the persisted outcome before repeating an uncertain request.
- **Screens/modes:** detail Lifecycle, Changes, Materials, ProductionCosts/ProductionCostClose and linked history;
  browser/TUI/Standard, keyboard and explicit before/after quantities and ledger evidence.

### MFG-17 — Reverse a supported kit assembly

- **Actor/start:** supervisor with an eligible pick-assembly kit still on hand; separate sold/held/counted kits and
  Accounting's forward issuance/receipt repost flags configured only in the disposable owner organization.
- **Objective/steps:** WorkOrders/Disassembly → choose kit and quantity → Preview → inspect component issue slices,
  lots, status and permitted values → give reason → Reverse the kit → inspect components returned to stock and the
  dated reversing entries. Follow Product360/KitComponents as the structural reference.
- **Expected:** the screen clearly describes supported pick-assembly reversal, not general manufacturing unbuild.
  Current open-period reversing deltas preserve posted history and match the quantity actually assembled/issued.
  Financial values remain absent for the supervisor without financial read.
- **Recovery:** non-kit, consumed/sold/held/counted stock, changed method/cost slices, disabled owner flag, closed
  period, stale preview, canceled confirmation and replay. A refused reversal leaves original stock and entries intact.
- **Screens/modes:** hidden Disassembly route, kit choice, Product360/KitComponents and resulting stock/financial
  evidence; browser/TUI/Standard, localized quantities and explicit refusal messages.

### MFG-18 — Find the right operation at the shop-floor station

- **Actor/start:** operator and supervisor; released/running/paused/blocked operations in two plants, personal
  assignments, an unknown code, an ambiguous work-order scan and a timer on another operation.
- **Objective/steps:** ShopFloor/Station → choose plant/My work → scan or choose card → inspect readiness, due date,
  center and running timer → Open or Instructions → Back. Use Refresh and choose an ambiguity result; start through
  the card only after reviewing the separate timer-switch confirmation.
- **Expected:** selected operation and work-order identity remain visible; empty and failed loading states differ;
  a scan result outside the loaded board still opens the correct operation. Keeping the existing timer changes
  nothing; confirming the switch stops that timer and starts the intended one once.
- **Recovery:** invalid/foreign scan, repeated scan, stale card, changed plant while loading, lost authority, failed
  request and navigation before its response. Inspect keyboard access to cards and ambiguity choices directly.
- **Screens/modes:** Station.qvue and its transitions, actual Station.tui.json board to OperationExecution, browser
  fallback where offered; 390px/touch, keyboard, light/dark and live theme changes.

### MFG-19 — Read the released instruction and execute an operation

- **Actor/start:** operator, supervisor for explicit overrides, predecessor-dependent operations and an output
  operation; required skill, instruction acknowledgment and evidence configured on selected templates.
- **Objective/steps:** OperationExecution → inspect start checks → Instructions read released content → record the
  required step/evidence → return → Start → Pause/resume where offered → Complete with good/scrap quantities and
  output details → inspect predecessor/successor state and output receipt. Review a justified supervisor override.
- **Expected:** the operation uses the instruction content effective at run release; later publication does not
  change it. Configured checks block and name the reason; an override records actor/reason. Completing an output
  operation produces the supported receipt atomically and does not duplicate facts on retry.
- **Recovery:** missing content/skill/acknowledgment, unfinished predecessor, pending quality, wrong serial/quantity,
  canceled override/completion and stale operation. The operator can correct input without losing entered evidence.
- **Screens/modes:** OperationExecution, Instructions, InstructionsPrint, Station and resulting quality/material
  tabs; browser/TUI/Standard, handheld touch targets, keyboard and long instruction/attachment content.

### MFG-20 — Reconcile labor time and machine runtime

- **Actor/start:** operator and timesheet approver; timer entries on two operations, a week to submit, machine
  runtime with an effective rate and another with no rate; financial reader for the valued outcome.
- **Objective/steps:** OperationExecution → start/stop timer → record machine runtime separately → ProductionTime
  inspect entries → Submit week → independent Approve → inspect labor cost event → permitted Reopen → inspect its
  reversal and resubmission path. Follow a missing-rate runtime into the cost exceptions and review.
- **Expected:** labor and machine time retain distinct hours, dates and basis; approval is not implied by stopping
  a timer. Reopening approved time records the required financial correction without rewriting history. An unvalued
  machine fact remains visible and blocks a cost close until resolved through the current services.
- **Recovery:** overlapping/stale timer, wrong user's week, invalid hours, missing rate, canceled approval/reopen,
  revoked timesheet authority and duplicate runtime request. Users without financial read see the operational time
  facts without amounts or rates they cannot read.
- **Screens/modes:** OperationExecution, ProductionTime, Costs and close preview; browser/TUI/Standard, user-zone/
  week boundary, phone time dialogs and displayed versus persisted durations.

### MFG-21 — Report downtime and follow maintenance without conflating completion

- **Actor/start:** operator and supervisor; line equipment, reason with approval threshold, non-equipment stop and
  maintenance follow-up task linked to the intended plant.
- **Objective/steps:** quick create or WorkCenters/Downtime → Report stop with equipment/reason → request maintenance
  where offered → open RequestDetail → inspect equipment/stop/production links → follow WorkItemDetail task → return
  → End stop → supervisor Correct/Approve → inspect history and calendar/load effects.
- **Expected:** reason and interval explain the lost capacity; correction retains the original. Ending downtime
  does not close the maintenance request or its task automatically. Production run/operation links open production
  screens; an operation cannot be edited as a generic follow-up task.
- **Recovery:** invalid/end-before-start interval, missing equipment where required, wrong-plant request, stale
  correction, canceled maintenance creation, failed notification and already-ended stop. A non-equipment reason
  should not imply a maintenance action with no target.
- **Screens/modes:** ReportDowntime, Downtime, EquipmentDetail, RequestDetail, WorkItemDetail, calendar and reports;
  browser/TUI/Standard, two-row correction dialogs, phone, long reason and date/time-zone boundaries.

### MFG-22 — Schedule operations against real capacity

- **Actor/start:** scheduler, independent supervisor for override, resource administrator for offline intervals and
  reader; two centers, predecessor/conflict cases, alternate center, unscheduled work and closed calendar time.
- **Objective/steps:** Planning/ProductionSchedule → inspect lanes/load/conflicts → drag or keyboard/form Move →
  Preview → choose free time or Request override → supervisor decides → Apply → reload. Reschedule from Operations;
  preview/apply a center's offline interval and affected moves; inspect Capacity and ResourceCalendar.
- **Expected:** drag only opens/prepares the move; confirmation applies its exact revision and target. Calendar,
  slots, downtime, booked and available hours explain conflicts; missing basis is named. ResourceCalendar remains a
  read-only view; ProductionScheduleTui performs the same guarded change through its forms.
- **Recovery:** predecessor/closed-time/capacity conflict, stale run/operation, invalid date/span, refused override,
  canceled move/offline action, unschedule and late response after navigation. A retry does not apply another move.
- **Screens/modes:** ProductionSchedule/ProductionScheduleTui, Operations, FacilityDetail/WorkCenter, Capacity,
  ResourceCalendar/ResourceCalendarTui and ScheduleSnapshot; browser/TUI, keyboard drag alternative, zoom and zone/DST.

### MFG-23 — Calculate and explain a supply plan

- **Actor/start:** supply planner and schedule-only reader; current plant demand, stock/inbound supply, an expired
  planning run, non-phantom/phantom methods and held quantity with an inspection due date.
- **Objective/steps:** Planning/SupplyPlanning → choose plant/horizon/product → Recalculate → inspect version,
  as-of/freshness, exceptions and buy/make/transfer suggestions → select a suggestion → trace demand/supply → compare
  held pending-release rows → Schedule effective cadence/net-held option → inspect saved schedule and snapshot.
- **Expected:** suggestions explain their source and quantity/unit; held stock is separately visible and excluded
  from netting by default, included only under the configured rule. Changing parameters or recalculation produces
  a distinguishable plan; the reader can inspect without calculation/conversion controls.
- **Recovery:** no plant, missing method/unit/lead-time data, failed independent calculation item, stale plan,
  invalid schedule, canceled change and another organization's suggestion. Empty demand differs from failed planning.
- **Screens/modes:** SupplyPlanning, InventoryAvailability/Projection, PlanSnapshot and PlanningReport;
  browser/TUI/Standard, dense-table phone/keyboard, date basis and actual CSV/print filters.

### MFG-24 — Convert a valid suggestion and retain its demand relationship

- **Actor/start:** production planner and buyer with distinct permissions; make, ordinary buy, outside-processing
  and transfer suggestions in a current plan, plus one invalid/stale selected item.
- **Objective/steps:** SupplyPlanning → select make suggestions → review method date/run facility → Convert → inspect
  each result → open created draft → inspect source demand and remaining supply → repeat conversion → recalculate
  and inspect the prior plan's stale state. Follow ordinary buys to Purchasing's current replenishment workflow;
  outside processing continues in MFG-25.
- **Expected:** make conversion creates a draft rather than releasing/issuing; unchanged retry returns existing
  coverage. Each independent failure names the suggestion, while successful conversions remain linked. Purchasing
  buy conversion and Warehouse transfer work are explicit owner handoffs, not extra authority on this mount.
- **Recovery:** expired plan, demand already covered, wrong plant or method, one denied selection, canceled action
  and changed-input retry. Check that the created record and its link retain the current organization's scope.
- **Screens/modes:** SupplyPlanning selection/results, NewWorkOrder/Overview and Purchasing's Replenishment/
  SupplyPlanning counterpart; browser/TUI/Standard, selection/pagination and recovery after partial results.

### MFG-25 — Request outside processing and hand purchasing authority to a buyer

- **Actor/start:** planner and buyer; released subcontractable operation, supplier, service product, required date
  and custody facility; a reader without price access.
- **Objective/steps:** SubcontractOperations → New outside processing or operation → Request outside processing →
  SubcontractDetail inspect agreement → SupplyPlanning buyer converts its requirement to draft service PO line →
  inspect OrderDetail and Supplier360/SubcontractOrders → buyer continues in Purchasing for placement/approval/change
  → return to the operation's procurement status.
- **Expected:** requested, draft ordered, placed/approved and accepted service states are distinct. Quantity,
  supplier, due date and linked run/operation agree; permitted agreement edits use the current revision. Prices and
  price-basis notes stay absent for the production-only reader. Manufacturing's order view remains read-only.
- **Recovery:** inactive/foreign supplier or facility, missing service product, stale agreement/plan, buyer grant
  absent, canceled conversion and retry. A draft PO result does not imply that Purchasing approved or sent it.
- **Screens/modes:** SubcontractOperations/SubcontractDetail, SupplyPlanning, Supplier360, OrderDetail and bounded
  Purchasing continuation; browser/TUI/Standard, phone and two-role price comparisons.

### MFG-26 — Follow subcontract material custody through accepted output

- **Actor/start:** material/warehouse operator with `STOCK_ISSUE`, planner, buyer for reconciliation and quality actor;
  placed service PO, owned components, vendor-custody facility, partial dispatch/return and an inspected output example.
- **Objective/steps:** SubcontractDetail → inspect material list → dispatch instructions → Warehouse subcontract
  shipment execute dispatch → Manufacturing ShipmentDetail inspect in-transit/vendor stock → receive through the
  owning Warehouse entry to Mantle `receive#SubcontractOutput` → inspect output/genealogy, already-created
  ServiceAcceptance and accrual → reconcile that acceptance in Purchasing → return to SubcontractDetail and related
  bill/cost evidence. There is no second manual acceptance step for the subcontract output.
- **Expected:** ownership is distinct from custody; component dispatch is distinct from the atomic receipt operation,
  which issues vendor-custody materials, receives output, records service acceptance with receipt/inspection evidence
  and writes its outside-processing accrual. Accepted/rejected/held quantities reconcile to the run. Accounting
  matching follows that evidence, not the mere presence of a service PO or a shipped component.
- **Recovery:** wrong supplier/run/custody facility, incomplete dispatch, rejected output, excess receipt, missing
  acceptance prerequisites/inspection, stale action, canceled return and replay. Retry the same receipt operation key
  and verify no extra custody issue, output receipt, ServiceAcceptance or accrual. Shared read-only views must not
  offer physical execution the actor cannot perform; failure preserves the transaction's coordinated outcome.
- **Screens/modes:** SubcontractDetail/Instructions, shared ShipmentDetail/OrderDetail, Warehouse subcontract and
  receipt routes, Purchasing's existing acceptance/order evidence, production material/quality tabs; browser/TUI and
  actual documents.

### MFG-27 — Explain estimated and actual production costs and request review

- **Actor/start:** estimator, financial reader and production cost reviewer; run with material, approved labor,
  machine runtime, subcontract/loss events and an unvalued or unapproved fact.
- **Objective/steps:** WorkOrderDetail/ProductionCosts → compare frozen standard/estimate with permitted actual WIP
  and cost events → follow source and exceptions → resolve rate/time/quantity issue through its owning activity →
  Request cost review → inspect request state and Accounting queue continuity. Compare an estimator without
  financial read to the same run's authorized actual-cost reader.
- **Expected:** estimate, actual, absorbed/unabsorbed and variance are distinct, with currency, date and source.
  Review resolves supported unvalued facts once; requesting financial close does not post it. Operational users
  retain useful missing-information explanations without receiving restricted amounts in JSON, HTML or exports.
- **Recovery:** missing rate, unapproved time, changed source, wrong organization, canceled request, repeated review
  and unavailable source record. A current rate must not silently value a past event at the wrong effective date.
- **Screens/modes:** ProductionCosts, CostRollup/StandardCosts where allowed, ProductionTime, SubcontractDetail,
  close queue and cost report; browser/TUI/Standard, currency/negative values and narrow source-detail layouts.

### MFG-28 — Review and post or return a production cost close

- **Actor/start:** scoped financial reader, GL preview holder and cost-close approver; completed run with requested
  review, a blocked run, a stale preview, a closed period and an adjustment after a prior close.
- **Objective/steps:** Manufacturing Cost close tab or Accounting's Inventory/ProductionCostClose queue → inspect
  absorption, overhead, scrap, output allocation, variance and proposed ledger → resolve blockers → choose accounting
  date → confirm Post cost close → inspect closed order/posted allocation. Separately Return to production with reason;
  inspect later adjustment mode and repeat the same confirmed request.
- **Expected:** financial read alone does not grant preview/post; preview needs `ACCOUNTING_GL_POST` or
  `PRODUCTION_COST_POST`, and post/return needs `PRODUCTION_COST_POST`. The input fingerprint binds the shown facts;
  material/output movements are not posted twice. An authorized zero-entry close explains its result.
- **Recovery:** incomplete run, unvalued event, missing mapping/policy, wrong currency basis, changed fingerprint,
  date lock, canceled post, denied authority and repeated request. A failed close preserves original history.
- **Screens/modes:** shared ProductionCostClose through both consumers, ProductionSettings read-only policy link
  to Accounting CostingPolicies and source report/ledger evidence; browser/TUI/Standard, phone and actual posted result.

### MFG-29 — Explain an operational result from report to source

- **Actor/start:** production reader and financial reader where required; populated/empty plant/date ranges,
  completed and open orders, incomplete calendar/rate data and a known quality/loss event.
- **Objective/steps:** Home KPI or Reports/ReportIndex → choose plant/date/product/center as offered → inspect report
  basis and completeness → drill source work order/operation/loss/inspection/plan → return to the same filter.
  Compare WorkOrderStatus, Material, OperationPerformance, Loss, Quality, ProductionCost, BOM variance and Planning.
- **Expected:** periods, units, denominators and as-of state explain the result; performance factors and missing
  basis are readable rather than falsely precise. Reports do not mix incompatible units/currencies. Cost readers
  receive only their allowed values; source links choose the Manufacturing mount and scope.
- **Recovery:** no matches, missing capacity/calendar, partial source failure, unavailable drill record, restricted
  money, changed filters and stale async result. A failed source is named without hiding independent results.
- **Screens/modes:** all eight reports, ReportIndex, Home, Capacity and actual source details; browser/TUI/Standard,
  chart/table readability, keyboard, zoom/phone and output continuation in MFG-30.

### MFG-30 — Produce a readable, scoped traveler, label and snapshot

- **Actor/start:** permitted operational/financial reader with long names, many lines, fractional quantities,
  historical instruction, tracked and held output, dispatch/return records and a known filtered report/plan.
- **Objective/steps:** open each offered traveler, pick sheet, labels, quality checklist/certificate, instruction
  print and subcontract instruction variant → inspect preview → download/print locally → read actual bytes/pages.
  Export reports as CSV and XLSX, Capacity as CSV, and plan/schedule/applicable method data in their offered formats
  → compare filter, identity, date/revision, selected columns and rows in the actual files/workbooks.
- **Expected:** repeated headers, units, quantities, source keys and page breaks support real use. HELD labels remain
  visibly held; barcode and text name the same identity. Subcontract instructions disclose no restricted cost.
  Workbook headers, typed cell values, units and filtered rows agree with the authorized report; restricted amount
  columns and values remain absent from the exported workbook, including sheets/cells not visible in the browser.
  Snapshot labels describe the actual queried/stored basis; a current plan print is not assumed immutable history.
- **Recovery:** unavailable renderer/file, empty dataset, Unicode/long rows, page break at a critical total, foreign
  output key, expired source and canceled print. No download event alone closes this activity or proves a physical
  printer received the job.
- **Screens/modes:** every output in §3 and its originating activity; actual html-print/PDF/CSV/XLSX/label content,
  Standard entry and explicit terminal delegation. Distinguish unsupported hardware from bad generated content.

### MFG-31 — Keep evidence and approval decisions on the right record

- **Actor/start:** scoped operators, method/quality approvers and reader; two similar run/operation/method records,
  allowed/forbidden attachments and a notification that changes state after it is opened.
- **Objective/steps:** Notes, facility/supplier Conversation/Documents or shared files → add permitted discussion/file
  → reload/download → follow record link → open approval notification → inspect authoritative current record →
  decide where offered → follow resulting notice and return. Trace instruction evidence and maintenance files too.
  In actual terminal, open Chatter/ChatterTui to log a permitted note/read the timeline, and RecordFiles/RecordFilesTui
  to inspect the file list and follow its download with the required output delegation.
- **Expected:** canonical entity/key and audience remain correct across app mounts; operation and work-order context
  do not collapse into one identity. Approval is recorded on the authoritative method/run/inspection/change, not
  inferred from marking a notice read. Restricted financial or foreign evidence remains absent.
- **Recovery:** wrong/foreign host key, lost permission, deleted record, disallowed attachment, failed upload,
  stale notice and canceled decision. Retained published instruction content is distinct from ordinary editable
  supporting files. Duplicate notification delivery does not repeat the underlying approval.
- **Screens/modes:** root Chatter and Chatter/ChatterTui, RecordFiles and RecordFiles/RecordFilesTui, Notes,
  product/facility/supplier documents/conversation, request/task attachments and Approvals/Notifications;
  browser/actual TUI with upload/output delegation and keyboard focus return; direct twin access is included in MFG-32.

### MFG-32 — Reconcile access, neighboring apps and remaining modes

- **Actor/start:** narrow Manufacturing users, explicit Warehouse/Purchasing/Accounting/Products counterparts and
  foreign-organization users; otherwise-valid positive/negative payloads and incomplete mode/recovery rows.
- **Objective/steps:** follow method → production → physical stock → subcontract order → financial close and their
  return links. Probe direct inherited children, choices/selected labels, palette/scans, print/export/file helpers and
  forged context using scoped counterparts, including the three inherited CSV/XLSX price routes in §3: pair permitted
  owning-app output with the denied consuming context and inspect bytes for restricted values. Change one grant after
  opening a form, then restore it. Revisit shared
  corrections in a second consumer and reconcile actual terminal/Standard/phone/zoom gaps.
- **Expected:** app context cannot widen record or amount access; a composed business permission does not imply a
  neighboring launcher. Cold cross-app navigation returns with one Back and preserves appropriate record/scope.
  Hidden product/facility/supplier children remain protected independently of tab visibility.
- **Recovery:** lost grant, wrong plant/owner, missing launcher, deleted destination, failed provider, late response
  and interrupted confirmation. Refusals identify the intended rule or use the same valid successful counterpart;
  invalid input is not access evidence. Tool-blocked variants remain unresolved rather than called passed.
- **Screens/modes:** every mapped surface and bounded shared continuation; actual browser/TUI/Standard as applicable,
  supporting server responses and files. This activity does not prescribe a users × routes × modes regression matrix.

## 5. Existing checks and future verification

This maps available checks, not passing results. Spec names omit `.spec.js`; paths are relative to the component
named. Read the current assertions before selecting a later run. A file called Walk can inspect a few states rather
than execute the whole business operation, and a render cannot establish browser or terminal interaction.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Manufacturing/` | ManufacturingAccess | MFG-01, 06, 32; root/capability/plant/record checks, choices, guarded areas and protection against treating production as generic tasks/REST work |
| mr-boss regression `test/Manufacturing/` | ManufacturingMethods | MFG-02–04; dated instruction/routing/BOM release, retained lines, where-used and partial CSV import results |
| mr-boss regression `test/Manufacturing/` | ManufacturingWorkCenters | MFG-05, 22; capacities, resource context/calendar, rates and action visibility |
| mr-boss regression `test/Manufacturing/` | ManufacturingWorkOrders | MFG-07–08; create/release and lifecycle/links; not all cancellation, split or phone branches |
| mr-boss regression `test/Manufacturing/` | ManufacturingMaterials | MFG-09; stock/material context, backflush preview, staged shortage, manual line and held-stock visibility |
| mr-boss regression `test/Manufacturing/` | ManufacturingShopFloor | MFG-18–20; station/scan/instruction/start, machine time, predecessor/output completion, timesheet approval/reopen and Today; selected terminal renders are supporting evidence |
| mr-boss regression `test/Manufacturing/` | ManufacturingDowntime | MFG-21; maintenance linkage, correction/history, threshold approval and follow-up versus production task distinction |
| mr-boss regression `test/Manufacturing/` | ManufacturingSchedule | MFG-22; preview/commit, conflicts/offline context, Capacity and terminal form contract |
| mr-boss regression `test/Manufacturing/` | ManufacturingPlanning | MFG-23–24; suggestion context, make conversion/retry/stale plan, reader actions and plan snapshot |
| mr-boss regression `test/Manufacturing/` | ManufacturingSubcontracting | MFG-25–26; request, buyer conversion, price omission and shared order/supplier/shipment context |
| mr-boss regression `test/Manufacturing/` | ManufacturingReports | MFG-29–30; Home/report basis, financial visibility and selected print/filter contracts |
| mr-boss regression `test/client/Manufacturing/` | ManufacturingWorkOrdersWalk | MFG-07–08; the existing single browser golden path; reuse it rather than adding another |
| mr-boss acceptance `acceptance/Manufacturing/` | ManufacturingAccessWalk | MFG-07–13, 23–24, 27–32; standalone plan-to-stock, app isolation, actions/outputs/search/notices and cost boundaries; broad server execution is not a live terminal/browser pass |
| mr-boss acceptance `acceptance/Manufacturing/` | ManufacturingServerStatic | Current plain XML/static-render checks; its old `moq test` comment does not change the file's acceptance classification |
| mr-boss acceptance `acceptance/Manufacturing/` | ManufacturingPlanningFixtures, ManufacturingSubcontractFixtures, ManufacturingScheduleFixtures, ManufacturingShopFloorFixtures | Setup for selected acceptance clients; fixture existence or registration does not authorize execution |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingMethodsWalk, ManufacturingWorkCentersWalk, ManufacturingPolicyWalk | MFG-02–06; instruction/routing, center and policy/reason workflows plus selected narrow layouts |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingWorkOrdersPhone, ManufacturingMaterialsWalk | MFG-07–09; work-order/material states and 390px layout; material walk does not complete every physical issue/return |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingQuantitiesWalk, ManufacturingQualityWalk | MFG-10–13; quantity/loss form and gate/inspection/operator states; not complete loss approval, disposition and receipt coverage |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingChangesWalk | MFG-14–17; remap, split steps and disassembly entry/layout; not proof that every change or kit reversal was committed |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingShopFloorWalk | MFG-18–20; actual scan/start/instruction/timer/output completion and week approval, including refused input recovery |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingDowntimeWalk, ManufacturingScheduleWalk | MFG-21–22; stop/maintenance, drag-preview-confirm and conflicts with selected phone checks |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingPlanningWalk, ManufacturingSubcontractWalk | MFG-23–25; make and service-PO conversion, reader/buyer differences and narrow worklists; does not execute the whole vendor-custody round trip |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingCostsWalk, ManufacturingCostCloseWalk | MFG-27–28; estimated/actual read and request, blocked close/queue and 390px states; CostCloseWalk does not post a successful close or later adjustment |
| mr-boss acceptance `acceptance/client/Manufacturing/` | ManufacturingReportsWalk | MFG-29; KPI drill, permitted amount columns and selected phone report |
| mr-boss regression `test/Accounting/`, `test/Warehouse/` | AccountingProductionCostClose; WarehouseCounts | MFG-09, 28; neighboring app context/queue and physical count contract; use only for an affected shared correction |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | MFG-01, 21, 31; shared identity and entry/return behavior, not a second Commons review |
| mr-boss acceptance root | AppStructure, TuiRender, ServerStatic | Existing broad route/render support; reconcile overlap before changing a sweep; no separate current ManufacturingScreens file |
| mr-mantle regression `test/product/` | ProductMethods, SupplyPlanning, WarehouseCounts | MFG-02–04, 09, 23–24; owning method/planning rules and count cutoff interactions |
| mr-mantle regression `test/work/` | MethodTemplates, WorkCenters, ProductionPolicy | MFG-03, 05–06; instruction/template, resources and effective policy rules |
| mr-mantle regression `test/work/` | ProductionOrders, ProductionMaterials, WarehouseProduction, ProductionQuantities, ProductionQuality | MFG-07–13; lifecycle, guarded stock, partial quantities/reconciliation and production gates |
| mr-mantle regression `test/work/` | ProductionChanges, ProductionShopFloor, ProductionDowntime, ProductionSchedule | MFG-14–22; controlled changes, kit reversal, execution/time, maintenance and scheduling rules |
| mr-mantle regression `test/work/` | ProductionSubcontract, ProductionCosts, ProductionReports | MFG-25–29; outside-processing facts, costing evidence and report basis |
| mr-mantle regression `test/ledger/` | ProductionCostClose | MFG-28; allocation, posting/retry, locks and adjustment; business rules stay in Mantle |

The current app has **11 server regression specs**, **one browser regression golden path**, **six server acceptance
files** (four fixture specs, the access walk and server-static check) and **16 registered browser acceptance specs**.
`test/client/suite.js` registers ManufacturingWorkOrdersWalk; `acceptance/client/suite.js` registers the other walks
and their server fixtures. `test/Manufacturing/ManufacturingSpecLib.js` supplies demo IDs/users and route examples;
`ManufacturingStandaloneLib.js` supplies the isolated organization and broader routes. Inspect their actual setup and
dependencies rather than guessing generated IDs or running acceptance fixtures as a convenient bootstrap.

Historical `ManufacturingIsolationWalk` and `ManufacturingCostIsolationWalk` names refer to coverage consolidated in
ManufacturingAccessWalk. Existing root AppStructure/TuiRender sweeps use shared route knowledge; inventory their
current overlap before adding coverage. Old broad assertions or comments are not instructions to duplicate a sweep
in regression or introduce a new route-fixture spec. No test is added or changed by this documentation task.

Available tests leave important review work: actual TUI input/focus/confirmations, complete light/dark/zoom sampling,
successful financial close and adjustment in the browser, end-to-end subcontract physical custody and service
acceptance, output bytes/page quality, partial/retry recovery and shared-child authorization. Several acceptance
walks deliberately stop at form visibility or a blocked record. Neither their names nor historical passes close
these activities. Review hardware/tool limits separately from product defects.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from mr-moqui. Use affected regression specs with a suitable binary, for example
  `./moq test mr-boss --spec ManufacturingSchedule --nobuild`; use the owning Mantle spec when its business rule changes.
  The golden path runs through Moqui, not Node:
  `./moq test-client mr-boss --serve --spec ManufacturingWorkOrdersWalk --nobuild`.
- Follow the supplied pre-commit rules: `./moq test-apps` for application work, `./moq test-framework` for framework
  work. No commit or suite run is part of writing this plan. Record later explicit user-directed review cadence here;
  prior Products/Projects execution exceptions do not transfer automatically.
- **Acceptance runs require the user's request or an added/changed acceptance test.** After changing one, run that
  test and its component's acceptance suite once written. An explicitly authorized existing journey could use
  `./moq accept mr-boss --spec ManufacturingShopFloorWalk`. A plan entry, shared-code change, fixture dependency or
  completion checkpoint is not authorization. No `accept-all` belongs to this plan.
- A focused rule/bug check belongs in regression; additional complete jobs, access/isolation, phone, terminal and
  screen sweeps belong in acceptance. Reuse the existing golden path and sweep. Render a screen at most once per mode
  across regression, combining checks; a second mode needs its own custom template. No role × route × mode matrix,
  screenshot baseline or duplication of Mantle rules through app wrappers.
- Respect current component budgets. BOSS currently allows **264 seconds server / 57 seconds client**; an individual
  regression spec over **15 seconds** fails. Remove duplication or move a scenario to acceptance; this plan authorizes
  no budget increase. Read other components' budgets if a later correction touches them.
- Lint changed screens with `moqui lint --screens <report-file>`; the argument is an overwritten report path, never
  a screen path. Compare parse/idiom findings to baseline. Markdown-only documentation needs no screen lint.
- Shared renderer/widget changes are framework work and require their own relevant checks and embedded/precompiled
  asset handling. Do not run framework specs, `cargo test` or `test-all` solely because application files changed.
- Keep future evidence in ignored framework `plans/ui-refinement-evidence/boss-manufacturing/` or a named equivalent
  outside tracked source. Inspect captures and outputs; compare before/after with matching data, theme and geometry.
  Record relevant console/network errors, persisted quantity/time/cost facts and redacted artifacts. Do not commit
  credentials, private production records, captured mail or screenshots with the plan.
- Re-exercise changed activities and relevant recovery branches after corrections, with a representative second
  consumer of shared changes. Distinguish baseline failure, missing prerequisite, tool limitation and product defect.
  Passing tests or a source inventory alone do not establish a usable production workflow.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason/follow-up. Exercised is not synonymous with passed. Name remaining continuations,
recovery and mode gaps on partially exercised rows. Source research and document review do not advance live coverage.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| MFG-01 — Workday/plant scope | pending | All live variants unreviewed | — |
| MFG-02 — BOM release | pending | All live variants unreviewed | — |
| MFG-03 — Routing/templates/instructions | pending | All live variants unreviewed | — |
| MFG-04 — Product/explosion/compare | pending | All live variants unreviewed | — |
| MFG-05 — Work centers/equipment | pending | All live variants unreviewed | — |
| MFG-06 — Policy/reasons | pending | All live variants unreviewed | — |
| MFG-07 — Draft/clone | pending | All live variants unreviewed | — |
| MFG-08 — Release/lifecycle | pending | All live variants unreviewed | — |
| MFG-09 — Material stage/issue/return | pending | Warehouse handoff and count/stock variants unreviewed | — |
| MFG-10 — Partial/secondary output | pending | All live variants unreviewed | — |
| MFG-11 — Loss/reconciliation/completion | pending | All live variants unreviewed | — |
| MFG-12 — Inspection templates | pending | All live variants unreviewed | — |
| MFG-13 — Inspection/disposition | pending | Full and handheld mounts unreviewed | — |
| MFG-14 — Substitution/amendment | pending | All live variants unreviewed | — |
| MFG-15 — Split/backorder | pending | All live variants unreviewed | — |
| MFG-16 — Cancel/close out | pending | All live variants unreviewed | — |
| MFG-17 — Supported kit reversal | pending | Requires explicit eligible kit and owner flags | — |
| MFG-18 — Station/scan | pending | Browser and actual terminal board unreviewed | — |
| MFG-19 — Instructions/operation execution | pending | All live variants unreviewed | — |
| MFG-20 — Labor/machine time | pending | Approval, correction and valuation continuations unreviewed | — |
| MFG-21 — Downtime/maintenance | pending | All live variants unreviewed | — |
| MFG-22 — Scheduling/capacity | pending | Timeline, calendar and both terminal twins unreviewed | — |
| MFG-23 — Supply plan | pending | All live variants unreviewed | — |
| MFG-24 — Suggestion conversion | pending | Make/buy owner handoffs unreviewed | — |
| MFG-25 — Outside-processing procurement | pending | Buyer/Purchasing continuation unreviewed | — |
| MFG-26 — Subcontract custody/output | pending | Warehouse/service-acceptance continuations unreviewed | — |
| MFG-27 — Cost facts/review request | pending | All live variants unreviewed | — |
| MFG-28 — Cost close/adjustment | pending | Financial scope, successful posting and recovery unreviewed | — |
| MFG-29 — Reports/drill | pending | All live variants unreviewed | — |
| MFG-30 — Outputs | pending | Actual bytes/pages/labels and terminal delegation unreviewed | — |
| MFG-31 — Evidence/approvals | pending | All live variants unreviewed | — |
| MFG-32 — Boundaries/continuity/modes | pending | Paired checks and remaining-mode reconciliation unreviewed | — |

### Findings register

No runtime/UI defects have been established by this documentation task. Number later findings **MFG-UI-001** onward.
Distinguish observed failures, source suspicions and design judgments. P1 blocks work or makes essential information
unusable; P2 causes substantial friction or misleading presentation; P3 is localized refinement. Stock, authority or
financial-history corruption takes priority regardless of visual severity.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into execution, without treating them as observed defects:

- Station uses asynchronous requests and timer-switch confirmation. Inspect rapid plant/record changes, navigation
  before completion and focus/keyboard selection; source alone cannot establish the resulting user-visible race.
- Shared product/facility/supplier child routes and inherited transitions outnumber visible tabs. Inspect current
  server context and otherwise-valid direct requests, with owning-app positives; menu exclusion is not evidence.
- Several Manufacturing client acceptance walks inspect only form/state/layout. In particular cost-close, materials,
  quantities and changes need their full persisted outcomes and recovery branches, rather than inherited “walk passed.”
- Fixed demo calendars, due dates and instruction publication times may no longer exercise the intended condition.
  Record the actual date/zone and prepare a bounded current fixture before calling a source stale or missing.
- Standard/fallback versus qvue/terminal rendering differs for Station, schedule and resource calendar. Inspect the
  real launch/mount and actual supported modes; do not diagnose an intentionally limited output as a blank board.
- Historical Manufacturing/Accounting receipt-repost concerns require current flag/service reconciliation before
  isolated reproduction. A kit reversal's forward repost flags do not authorize general historical financial repair.
- Supply-plan and Purchasing additions supersede parts of Manufacturing's older Later list. Reconcile current owner
  handoffs explicitly; do not turn a stale deferral into a new Manufacturing feature or assume Warehouse transfer
  conversion exists because a shared comment names it.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan — 2026-11-10 | Manufacturing author in the four-app documentation batch; current routes/mounts, workflows, permissions, fixtures, custom modes, tests and historical deferrals | Source/document inspection only; no live runtime, tests, outputs or production mutations | Initial document written; all MFG activities pending; independent document review is separate from live coverage |
| Document review corrections — 2026-11-10 | Independent reviewer identified subcontract acceptance sequencing, omitted shared terminal twins and omitted XLSX/Capacity CSV outputs; author corrected the affected ownership, inventory and activities | Independent reviewer rechecked current ProductionServices/OrderServices contracts, Chatter/RecordFiles mounts and report/Capacity declarations; source inspection only | All three source corrections resolved; independent recheck passed with no new contradiction in the revised areas; all live MFG activities remain pending |
| Inherited-output addendum — 2026-11-10 | Explicitly inventoried CSV/XLSX on the three inherited price routes under MFG-32, with paired owner/denied-context checks and restricted-byte omission | Independent reviewer confirmed Shared Prices/SupplierPrices declarations, mounts and Manufacturing context restrictions; documentation only | Addendum passed independent recheck; prior three-correction recheck remains passed and all live MFG activities remain pending |
| Coordinator reconciliation — 2026-11-10 | Reconciled Products methods, Warehouse movements/custody, Purchasing atomic service acceptance and Accounting cost-close handoffs with the companion reviews and current sources | Independent reviews/rechecks complete; source inventories, relative links/anchors, activity IDs/ledgers and Markdown whitespace checked; only four new review documents changed | Documentation batch complete; source concerns remain investigation inputs and all live activities remain pending |

Source baseline supplied for this batch: mr-moqui `73c8a8945abff9709260e922b4ba6c348ee903b3`, mr-boss
`1f6fde4e450a1e4b79773e4a4e5d8de3dad0eebf`, mr-mantle `aa702d05da2b12932abf788a7c12a428b388ced6`, with clean
working trees at batch start. These identify source research, not a binary or test result. Later execution records its
own revisions and environment.

For each later execution batch append: actors/fixtures; source/binary/runtime/clock/modes; attempted activities and
branches; findings/owners; important before/after evidence; persisted results and inspected outputs; exact checks and
skips; design/implementation changes and commits when made; restored temporary state and unresolved continuations.
Keep notes bounded and reference evidence rather than pasting logs.

## 7. Decisions

- **Current task:** create this review plan as one of four independently authored and reviewed documents. Only the
  new Markdown document is edited. No implementation, live walkthrough, test, build, runtime or commit is included.
- **Pattern:** retain Accounting's seven-part structure, complete screen/mount inventory, detailed activities,
  pending ledger, findings and bounded records. Completed Products/Projects coverage and execution permissions do
  not transfer to Manufacturing.
- **Source of truth:** current mounted sources, service contracts, grants and test locations govern scope. Record
  design/build discrepancies here without rewriting existing documents or constructing deferred features.
- **Production basis:** distinguish method/release date, run/operation identity, plant/owner/custodian, unit, quantity
  stage and financial authority. Use disposable local stock, orders, time, files and posting fixtures; preserve
  operation identities, revisions, immutable instruction evidence and historical entries.
- **Shared ownership:** use Warehouse guards for physical facts, Purchasing for service-order/acceptance work,
  Accounting for financial close and Products/Mantle for methods. Verify the consuming Manufacturing route and one
  appropriate second consumer when a future shared correction requires it.
- **Modes:** Material is the visual target; actual TUI and narrow operator work are explicit. Standard/output checks
  respect implemented mode limits. A JSON render, phone screenshot or historical test does not establish interaction.
- **Testing/cadence:** follow §5; no acceptance selection, new test, suite run, budget increase or exception to
  pre-commit rules is authorized by this plan. Record later execution scope and explicit cadence decisions here.
- **Completion:** documentation completion means the source-grounded plan and independent document corrections are
  complete. Later UI-review completion requires evidence for its selected activities, resolved or explicitly accepted
  findings and a candid ledger of remaining modes, recovery, blockers and deferred work.
