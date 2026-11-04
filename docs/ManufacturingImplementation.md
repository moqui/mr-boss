# Manufacturing implementation

The Manufacturing app calls Mantle's production, method, quality and stock services, which check their own permissions
and organization. BOSS owns the app's access (`ironstone.manufacturing.AccessServices`), its routes, choices, Home and
forms, and adds no same-named pass-through of a Mantle service. P1 (the foundation), P2 (methods), P3 (work centers and
equipment), P4 (policy and reasons), P6 (cost evidence), P11 (downtime and maintenance) and P13 (supply planning) of
[impl-manufacturing](../plan/impl-manufacturing.md) are built; each later phase extends the tables and sections below.

## Routes and users

| Area | Implemented destinations |
| --- | --- |
| Home | The plant picker, the Summary (open, in progress, late, short, completed this month: each "Unavailable" until its phase counts it), the Queue of due work and shortages (empty until P5) and the lookup of a record (`lookupType`, `lookupId`) |
| BOMs | `BillsOfMaterials/Find` (the list, New BOM, Clone, legacy and CSV import), and Products' shared `BillOfMaterialsDetail` (with its explosion, compare, where used and routing tabs), `WhereUsed`, `Product360` and `CostRollup` with the Manufacturing context |
| Routings | `Routings/Find` (the list, New routing, CSV import), `Routings/OperationTemplates` (the catalogue, instructions, archive) and the shared `RoutingDetail` (copy operations, release request, notes) |
| Approvals | Commons Notifications with the `BomRelease` and `RoutingRelease` topics, for the approval groups (below) |
| Work centers | `WorkCenters/Centers` (Find, the load, New work center), `Equipment`, `ResourceCalendar` (and `ResourceCalendarTui`), `Downtime` (P11: the stops, Report stop, End stop, Request maintenance, Correct); `FacilityDetail` and `EquipmentDetail`, and Projects' `RequestDetail` and `WorkItemDetail` (P11), the shared screens with the Manufacturing context, hidden from the menu |
| Quick create | `ReportDowntime` (P11), the downtime report of the + menu, for the operators and supervisors (`BOSS_MFG_REPORT_DOWNTIME`) |
| Settings | `Settings/ProductionSettings` (the organization default and plant overrides) and `Settings/ReasonCodes`, for the settings group (below) |
| Planning | `Planning/SupplyPlanning` (the default tab), the shared supply plan with the Manufacturing context; `Planning/ProductionSchedule` (P12, with `ProductionScheduleTui` and `ScheduleSnapshot`) and `Planning/Capacity`; for the planner, scheduler and supervisor groups |
| Work orders, Reports | Placeholders, open to every Manufacturing user |
| Quality | `Quality/Inspections` (the default), `Quality/InspectionTemplates`, `Quality/ScrapLoss` (P7); hidden `Quality/QualityInspection`, `Quality/InspectionStation` and `Quality/QualityCertificate` (P8); for the quality groups and the supervisor (below) |
| Shop floor, Subcontracting | Placeholders, for their groups only (below) |

All routes are under `/qapps/Manufacturing`, in design §1.2's order by `default-menu-index`. The root
(`screen/Manufacturing.xml`) runs `get#SharedContext` in its always-actions into `manufacturing` (capabilities, the
selected plant, `sharedLinks`) and sets `appRoot` to `Manufacturing`. Shared screen parts are in
`template/ManufacturingParts.xml`: the `choices` and `selectPlant` transitions and the `PlantPicker` section.

Methods (P2). The shared method screens take the Manufacturing context from Products' `SharedContext.js`
(`manufacturingContext()`: read with `METHOD_VIEW`, the product master read only, tabs Summary, Identifiers, Dimensions,
BOM, Costs with cost read, Stock, Kit components and Documents). The lists read `ironstone.manufacturing.MethodServices`
(`get#BomList`, `get#RoutingList`, `get#TemplateList`) over Mantle's finds; the screens' writes call the Mantle verbs
(`store#Bom`, `clone#Bom`, `import#BomCsv`, `store#Routing`, `import#RoutingCsv`, `store#OperationTemplate`,
`store#OperationInstruction`) after the root's access check, and the shared screens call Products' method layer
(`ironstone.products.MethodServices`). A method engineer without `METHOD_APPROVE` asks for a release (`request#BomRelease`,
`request#RoutingRelease`), which notifies the organization's approvers; the release on the method marks it read.

Groups (data/BossSetupData.xml). `BOSS_MANUFACTURING` is the root user group: its authorization on the root
(`BOSS_MANUFACTURING_ROOT`) has `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and the artifact group covers
`ironstone\.manufacturing\..*`. `BOSS_MANUFACTURING_ADMIN` has every authorization with `MANTLE_ACTIVE_ORG`. The capability
groups hold no root authorization of their own (a member is also in `BOSS_MANUFACTURING`), so Products' method users
open no Manufacturing launcher. Their grants:

| Group | Permissions |
| --- | --- |
| every group but `_DISPLAY` | `PRODUCTION_VIEW`; `METHOD_VIEW` (the method groups and `_COST` from Products P9) |
| `BOSS_MANUFACTURING_PLAN` | `PRODUCTION_PLAN`, `SUPPLY_PLAN_RUN` |
| `_SCHEDULE`, `_OPERATE`, `_SUPERVISE` | `PRODUCTION_SCHEDULE`, `PRODUCTION_OPERATE`, `PRODUCTION_SUPERVISE` |
| `_COST` | `PRODUCTION_COST_REVIEW`, with Products P9's `PRODUCT_COST_VIEW` and `METHOD_COST_EDIT` |
| `_RESOURCE_ADMIN` | `PRODUCTION_POLICY_EDIT`, with Products P9's `METHOD_RESOURCES` |
| `_METHOD`, `_METHOD_APPROVE` | Products P9's `METHOD_EDIT`, `METHOD_APPROVE` |
| `_QUALITY_INSPECT`, `_QUALITY_VERIFY`, `_QUALITY_ADMIN` | `QUALITY_INSPECT`; `QUALITY_VERIFY` and `QUALITY_DISPOSE`; `QUALITY_TEMPLATE_EDIT` |
| `_DISPLAY` | none: it opens nothing until WallDisplay (impl-manufacturing §7) |
| `BOSS_MANUFACTURING_ADMIN` | every permission above, the method and cost ones, and `FACILITY_ALL_ORGANIZATIONS` |

The production permissions are Mantle's (`MantleSetupData.xml`). `STOCK_ISSUE` stays Warehouse's grant and
`ACCOUNTING_VIEW` Accounting's. The restricted areas deny `BOSS_MANUFACTURING` and allow their groups
(`BOSS_MFG_<AREA>` artifact groups): Shop floor (operate, supervise), Quality (the three quality groups, supervise),
Planning (plan, schedule, supervise), Subcontracting (plan, supervise; P14 adds the buyer), Settings (resource admin),
Approvals (method approve, supervise). No Manufacturing group has authorization for the raw `ManufacturingServices`
verbs, `update#WorkEffort` or the `/mantle` REST run paths (F10, F37).

Demo users (BossUsersDemoData.xml, password `moqui`), agents of Ziziwork Retail: `manufacturing.plan`, `.schedule`,
`.method`, `.methodapprove`, `.operate` (assembly and coating skills), `.supervise`, `.inspect`, `.verify`,
`.qualityadmin`, `.cost`, `.resource`, the reader `manufacturing.read` (no other business launcher) and
`manufacturing.admin`; `manufacturing.display` (the display group alone, no root); `manufacturing.services`, a reader of
Ziziwork Services; `manufacturing.finance`, a reader who is also in `BOSS_ACCOUNTING_READ` (the financial reader of a work
order's costs).

Demo records (BossManufacturingDemoData.xml):

| Record | Ids |
| --- | --- |
| Retail's plant | Mantle's `ZIRET_WH`, a plant by its lines; lines `BOSS_MFG_LINE_A`, `BOSS_MFG_LINE_B` (FcTpLine under ZIRET_WH, with WorkCenter rows); equipment `EQUIP_AB4_1`, `EQUIP_AB4_2` (Mantle) |
| Runs | the draft `BOSS_MFG_RUN_A` on line A; Warehouse's released `BOSS_WH_RUN` with its operation `BOSS_WH_RUN_OP` |
| Skill types | `BOSS_MFG_SKILL_ASSEMBLY`, `_COATING`, `_INSPECTION` |
| Line A's resources (P3) | calendar `BOSS_MFG_CAL_LINE_A` (the weekday `BOSS_MFG_LINE_A_SHIFT`, the shutdown day `BOSS_MFG_LINE_A_SHUTDOWN` on 2026-11-27), capacities `BOSS_MFG_LINE_A_SLOTS` (2 slots) and `BOSS_MFG_LINE_A_RATE` (30 DEMO_1_1 an hour), alternate `BOSS_MFG_LINE_A_ALT_B`, approved machine rate `BOSS_MFG_LINE_A_MACHINE` |
| Methods (P2) | operation templates `BOSS_MFG_OPT_ASSEMBLE`, `BOSS_MFG_OPT_TEST`; the released routing `BOSS_MFG_ROUTING_A` (operations `_10`, `_20`); the released BOM `BOSS_MFG_BOM_PILOT` of DEMO_1_1 (method code PILOT) |
| Downtime (P11) | the closed changeover `BOSS_MFG_DT_1` of line A |
| Ziziwork Services (isolation) | plant `BOSS_MFG_SVC_PLANT` (FcTpPlant), line `BOSS_MFG_SVC_LINE`, run `BOSS_MFG_SVC_RUN` |

## Access contract

`ironstone.manufacturing.AccessServices` (service script `Manufacturing.js`), every service `allow-remote="false"`:

| Service | Contract |
| --- | --- |
| `get#SharedContext` | Refuses a user without Manufacturing (`MANUFACTURING_UNAVAILABLE`), another `appRoot` (`MANUFACTURING_CONTEXT`), a given plant outside the scope (`PLANT_UNAVAILABLE`). Answers `capabilities`, `organizationPartyIds`, `activeOrganizationPartyId`, `allPlants`, `plantCount`, `plantId`/`plantName` (the given one, else the preference in scope, else the only plant), `appRoot`, `linkBase`, `webBase`, `sharedLinks` |
| `check#Record` | `recordType` (run, operation, method, routing, workCenter, asset, facility), `recordId`, optional `capability`. Answers `kindName`, `facilityId`, `facilityName`, `label`, `detail`. A missing record and one outside the scope are refused alike (`RECORD_UNAVAILABLE`); a missing capability is `PERMISSION_DENIED`; an unknown capability throws |
| `select#Plant` | Keeps a plant in scope as the `ManufacturingPlantActive` preference, or clears it; refuses another (`PLANT_UNAVAILABLE`) |
| `get#Choices` | `plants`; `workCenters` (under `plantId` when given); searched by term ignoring case, with the selected one's label. An unknown choice throws |
| `search#Records` | The palette's Manufacturing group: runs, methods (id, name, code, product), routings, work centers and equipment, scoped in the query and checked again |

`ironstone.manufacturing.HomeServices.get#Home` answers Home's `summary` (each count null until counted) and
`queueRows`; each phase appends its block.

**Scope.** As Warehouse's: who may open Manufacturing, and their organizations, are read from the authorizations of the
user's groups on the root, so disabled artifact authorization widens nothing. A record is in scope when every owner it
names (a run's and a routing's `ownerPartyId`, a method's `organizationPartyId`) and every facility it is at (a run's,
an operation's run's, a work center, an asset's) is the user's organizations'; a record with neither is the admin's only.
An operation is checked through its run (`rootWorkEffortId`). A plant is a facility of type FcTpPlant or the parent of a
work center.

**Tables to extend** (`Manufacturing.js`): `capabilityPermissions` (`productionRead`, `plan`, `schedule`, `operate`,
`supervise`, `costReview`, `policyEdit`, `supplyPlan`, `methodRead`, `methodEdit`, `methodApprove`, `methodResources`,
`costRead`, `inspect`, `qualityVerify`, `qualityDispose`, `qualityTemplateEdit`, `issue`, `financialRead`);
`recordKinds` (a kind's name, icon, `destination` and read; a phase that builds a record screen sets its destination);
`searchFinds`; `choiceSources`; `linkPaths`.

## Shell, links and Home

The root's `<shell-providers>`: the palette source (`search#Records`) and the `manufacturing` keymap (`g q`). No quick
create, Today source or notification topic yet: P5 adds the draft work order, P10 the Today source, P11 the downtime
report.

`ironstone.commons.PaletteServices.get#RecordLink` (by `recordEntityName`): a run, its operation and a work center open
under Manufacturing for a user who may work with them (a work center its FacilityDetail, the others Home's lookup until
their screens are built); a method or routing
opens there once `recordKinds` gives it a destination (`hasScreen`), else in Products as before. A run or operation is
never a Commons task or event: without Manufacturing, a run opens Warehouse's MaterialIssueReceipt for a Warehouse user
who may work with it, else nothing.

A production run's operation is no task: Commons' `get#TaskAccess` answers `canUpdate` false and refuses an update, and
`check#TaskUpdate` (Today's Mark done and Reschedule) refuses it; Projects (`app` projects) does not find it (F38). A
production run is no event: `get#EventAccessInfo` does not find it, so EventDetail, its edits and `duplicate#Event` refuse
it (F39).

## Work centers (P3)

The screens call `ironstone.manufacturing.AccessServices.check#Record` (facility or workCenter, `methodResources` for a
change), then Mantle: `mantle.work.RoutingServices.store#WorkCenter` (also a new FcTpLine under a plant) and
`store#WorkCenterRate`, `mantle.work.WorkCenterServices` (`get#WorkCenter`, `store#WorkCenterCapacity`,
`store#WorkCenterAlternate`) and `mantle.work.ProductionPlanningServices.get#WorkCenterLoad`. BOSS's
`ironstone.manufacturing.WorkCenterServices` (`WorkCenters.js`) reads FacilityDetail's header, the Equipment list,
EquipmentDetail's Manufacturing context (`template/ManufacturingEquipment.xml`) and the calendar's items; none reads a cost,
rate or book value. A rate shows only to a reader of costs (`get#WorkCenter` leaves `rateList` out otherwise) and is added
by a user with `METHOD_RESOURCES` and the cost authority. In FacilityDetail the Manufacturing context has Overview, Work
center, Files and Conversation; the Warehouse tabs say `appRoot != 'Manufacturing'`. ResourceCalendar is
`screen/Commons/Calendar.qvue` in its resource mode (setup answers `resource`), read only. Manufacturing.js's P3 block sets
the work center, facility and asset destinations, the `WorkCenters/*` sharedLinks and the forms' choices.

## Cost evidence (P6)

ProductionCosts (`screen/Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts.xml`) takes `workEffortId`, checks the run
with `check#Record` and reads `mantle.work.ProductionServices.get#ProductionCosts`: the frozen estimate shows with
`PRODUCT_COST_VIEW` or `ACCOUNTING_VIEW`, the actual cost, amounts and ledger links (to Accounting's JournalEntryDetail) with
`ACCOUNTING_VIEW` only, as Mantle leaves them out. Its Request cost review dialog (CloseReview) checks `costReview`, then calls
`review#ProductionCosts`, which notifies Accounting on ProductionCostReview. Until WorkOrderDetail (P5) exists the root mounts
it hidden at `Manufacturing/ProductionCosts`; then the WorkOrderDetail directory makes it that screen's Costs tab and the root
item, the `ProductionCosts` link path and ManufacturingSpecLib's `moved` path go.

## Supply planning (P13)

`screen/Shared/SupplyPlanning.xml`, mounted at `Planning/SupplyPlanning`, plans the selected plant (or `plantId`) with the
lines under it. Its Manufacturing branch runs `get#SharedContext` with the plant, and its transitions
`check#Record` (facility, `supplyPlan` to recalculate and schedule, `plan` to convert), then Mantle's
`mantle.product.SupplyPlanningServices`: `run#SupplyPlan`, `get#SupplyPlan`, `store#PlanSchedule` and
`convert#PlanningSuggestions` (make suggestions to draft work orders through `create#ProductionOrder`; buy and transfer
are shown, for Purchasing and Warehouse to convert). Home's Due work and shortages box links it for SUPPLY_PLAN_RUN
holders. Manufacturing.js's P13 block adds the route and the `planningMethods` choice.

## Downtime and maintenance (P11)

Downtime (`screen/Manufacturing/WorkCenters/Downtime.xml`) reads `mantle.work.ProductionServices.find#ProductionDowntime`;
its forms and transitions are `template/ManufacturingDowntime.xml` (`downtimeChoices`, `reportStop`, `closeStop`,
`approveStop`, `correctStop`, `requestMaintenance`, the `ReportStopForm` and `MaintenanceForm` sections), which EquipmentDetail and
`ReportDowntime` include too. Each transition checks the work center, equipment or stop with `check#Record` (the `downtime`
kind, `supervise` for an approval or a correction), then calls `store#ProductionDowntime` or `request#ProductionMaintenance` with the form's
operation key. A report answers Downtime with the new stop selected, and an equipment fault with its Request maintenance
dialog open (`_openDialog=MaintenanceDialog`). OperationExecution's Pause (P10) opens Downtime with `workEffortId`,
`operationWorkEffortId`, `facilityId` and `assetId` and `_openDialog=ReportStopDialog`. EquipmentDetail's Manufacturing
context has Report stop, Request maintenance and a Downtime pane, and its availability reads the open outage (Out of
service). RequestDetail and WorkItemDetail take the Commons context with a Production box
(`template/ManufacturingRequestParts.xml`, `ironstone.manufacturing.DowntimeServices` `get#RequestContext` and
`get#WorkItemContext`): a maintenance request of the user's plants, and a follow-up task of one; any other request or
task, and a production operation, are not available there.

## Quality (P8)

A release keeps the run's quality gates (`mantle.work.production.ProductionQualityGate`, Mantle's `ProductionQuality.js`):
an operation's in-process gate and an output line's final gate, each with its template as of the release and its sample
plan. `mantle.product.QualityServices.get#SourceInspectionStatus` answers a run, operation or output line with each gate's
state (required, pending, failed, passed) and the inspection that decides it; the run's start and resume, its completion
and the operations' readiness read the same. Output of a line with a final gate is received held with its inspection;
`dispose#Inspection` releases it (reserving the pegged order item first) and scraps an open run's output through the loss
path.

WorkOrderDetail's Quality tab (`WorkOrders/WorkOrderDetail/Quality.xml`) reads
`ironstone.manufacturing.QualityServices.get#QualityGates`; Inspect (an in-process gate) checks the run with `check#Record`
(`inspect`) and calls `mantle.work.ProductionServices.create#ProductionInspection`; Checklist prints
`WorkOrderDetail/QualityChecklist`. The Quality area: `Inspections` (the default), `InspectionTemplates`
(`Shared/InspectionTemplates`), and hidden `QualityInspection` (`Shared/QualityInspection`), `InspectionStation` (density
handheld; its `Inspection` mount sets `operatorMode`) and `QualityCertificate`. The shared screens' Manufacturing branches
read `ironstone.manufacturing.QualityServices`; `template/WarehouseInspectionParts.xml`'s transitions check the record with
Manufacturing's `check#Record` (the `inspection` kind: a production inspection of the user's organizations) under the
Manufacturing root and call the same Mantle verbs. The quality-block notice is ProductionQualityBlock, linked to the
Quality tab.

## Scheduling and capacity (P12)

`Planning/ProductionSchedule.xml` serves Projects' `screen/Projects/WorkItems/Timeline.qvue` in its resource mode (the
component finds its transitions by a path element named `ProductionSchedule`): `schedule` (Mantle's
`mantle.work.ProductionPlanningServices.get#ProductionSchedule` for the plant and days, with the operations' links),
`moveOperation` (`schedule#ProductionOperation` preview, apply, unschedule or request) and `decideOverride` (approve or
refuse), each after `check#Record` (the `operation` kind, `schedule` to commit; the `scheduleChange` kind, `supervise` to
decide), each call in its own transaction so a refusal answers JSON. A drag only opens and previews the Move dialog. The
terminal twin `ProductionScheduleTui` and Operations' Reschedule use `template/ManufacturingSchedule.xml` (`previewMove`,
`applyMove`, `requestOverride`, `unscheduleOperation`, `decideOverride` and the `MovePreview` section, by the screen's
`move*` parameters). `ScheduleSnapshot` is the plan snapshot print with the CSV of its operations. `Planning/Capacity`
reads `get#WorkCenterLoad` by day, week or the range. FacilityDetail's Work center tab has the completed load, Offline
times and Take offline (`store#WorkCenterOffline` preview, then apply with or without the moves) and Withdraw; Centers
shows next available and the offline reason. Approvals lists `ProductionScheduleOverride`; its link opens the schedule on
the request, and `ProductionScheduleChange` (to the run's people, else the supervisors) opens the operation.

## Verification

`./moq test mr-boss --spec ManufacturingShell,ManufacturingAccess,ManufacturingWorkCenters,ManufacturingPlanning,
ManufacturingDowntime,ManufacturingSchedule` (and `TimelineWalk` and `ProjectsTui` for the shared Timeline component), `./moq test mr-mantle --spec WorkCenters,ProductionCosts,SupplyPlanning,ProductionDowntime,ProductionSchedule`, the walks
`ManufacturingWorkCentersWalk`, `ManufacturingCostsWalk`, `ManufacturingPlanningWalk`, `ManufacturingDowntimeWalk` and
`ManufacturingScheduleWalk`; AppStructure
and TuiRender cover the built screens and the area
placeholders.
`./moq test mr-mantle --spec ProductionQuality` and the walk `ManufacturingQualityWalk` (P8).
`./moq test mr-boss --spec ManufacturingShell,ManufacturingAccess,ManufacturingMethods`; AppStructure and TuiRender cover
the built routes (ManufacturingSpecLib's `routeFixtures`) and the area placeholders; `./moq test mr-mantle --spec
MethodTemplates`; the walk `./moq test-client mr-boss --serve -- --spec ManufacturingMethodsWalk`.
