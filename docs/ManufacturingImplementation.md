# Manufacturing implementation

The Manufacturing app calls Mantle's production, method, planning, quality, cost and stock services, which check their
own permissions and organization. BOSS owns the app's access (`ironstone.manufacturing.AccessServices`), its routes,
choices, Home and forms, and adds no same-named pass-through of a Mantle service. P1 to P17 of
[impl-manufacturing](../plan/impl-manufacturing.md) are built: the build is complete, and what is left is its §7. The design
is [design-manufacturing](../plan/design-manufacturing.md); its §2 Impl column names the phase that built each screen.

## Routes

All routes are under `/qapps/Manufacturing`. The root (`screen/Manufacturing.xml`) runs `get#SharedContext` in its
always-actions into `manufacturing` (capabilities, the selected plant, `sharedLinks`) and sets `appRoot` to
`Manufacturing`; Chatter and RecordFiles are mounted at the root.

| Area | Destinations |
| --- | --- |
| Home | The plant picker, Summary, the queue of due work and shortages, Kpis (P16), the lookup of a record |
| Work orders | `Find` (list, board, calendar, bulk), `NewWorkOrder` and its quick create, `Disassembly`; `WorkOrderDetail` with Overview, Components, Materials (`Shared/MaterialIssueReceipt`), Operations, Quantities, By-products, Quality, Costs, Cost close (`Shared/ProductionCostClose`), Changes, SplitWorkOrder, Notes; prints Traveler, PickSheet, OutputLabels, QualityChecklist |
| Shop floor | `Station` (a `.qvue` board with `Station.tui.json`), `OperationExecution` (handheld), `Instructions` and `InstructionsPrint`, `ProductionTime` |
| BOMs, Routings | `BillsOfMaterials/Find` (CSV import), `Routings/Find` (CSV import), `Routings/OperationTemplates`; Products' shared BillOfMaterialsDetail (explosion, compare), WhereUsed, Product360, CostRollup and RoutingDetail with the Manufacturing context |
| Work centers | `Centers`, `Equipment`, `ResourceCalendar` (a `.qvue` with `ResourceCalendarTui`), `Downtime`; shared FacilityDetail, EquipmentDetail, RequestDetail and WorkItemDetail |
| Quality | `Inspections`, `ScrapLoss`, `InspectionStation` (handheld), `QualityCertificate`; shared QualityInspection and InspectionTemplates |
| Planning | Shared `SupplyPlanning` with its `PlanSnapshot`, shared InventoryAvailability, `ProductionSchedule` (Projects' Timeline `.qvue` with `ProductionScheduleTui`) with `ScheduleSnapshot`, `Capacity` |
| Subcontracting | `SubcontractOperations`, `SubcontractDetail`, `SubcontractInstructions`; shared Supplier360, OrderDetail and ShipmentDetail |
| Reports | `ReportIndex` and the eight reports of design §9, each with CSV and Print |
| Settings, Approvals | `ProductionSettings`, `ReasonCodes`; Commons Notifications with the production topics |

Shell providers: the palette source (`search#Records`), the quick creates (work order, downtime report), the Today source
(`HomeServices.get#TodayItems`) and the notification topics (method and routing release, release, staged release,
shortage, loss approval, overproduction, quality block and inspection decision, substitution, amendment, schedule change
and override).

## Access

Groups (`data/BossSetupData.xml`): `BOSS_MANUFACTURING` is the root user group (`MANTLE_USER_ORG`,
`MANTLE_PRIVATE_CONTACT`); `BOSS_MANUFACTURING_ADMIN` has every authorization with `MANTLE_ACTIVE_ORG`. The capability
groups hold no root authorization of their own, so a member opens Manufacturing only with the root group.

| Group | Permissions |
| --- | --- |
| every group but `_DISPLAY` | `PRODUCTION_VIEW`; `METHOD_VIEW` for the method and cost groups |
| `_PLAN` | `PRODUCTION_PLAN`, `SUPPLY_PLAN_RUN` |
| `_SCHEDULE`, `_OPERATE`, `_SUPERVISE` | `PRODUCTION_SCHEDULE`, `PRODUCTION_OPERATE`, `PRODUCTION_SUPERVISE` |
| `_COST` | `PRODUCTION_COST_REVIEW`, `PRODUCT_COST_VIEW`, `METHOD_COST_EDIT` |
| `_RESOURCE_ADMIN` | `PRODUCTION_POLICY_EDIT`, `METHOD_RESOURCES` |
| `_METHOD`, `_METHOD_APPROVE` | `METHOD_EDIT`, `METHOD_APPROVE` |
| `_QUALITY_INSPECT`, `_QUALITY_VERIFY`, `_QUALITY_ADMIN` | `QUALITY_INSPECT`; `QUALITY_VERIFY`, `QUALITY_DISPOSE`; `QUALITY_TEMPLATE_EDIT` |
| `_DISPLAY` | none (WallDisplay is §7) |

`STOCK_ISSUE` and `STOCK_MOVE` stay Warehouse's grants (its issue and move groups, which work without the Warehouse
root), `ACCOUNTING_VIEW` and `PRODUCTION_COST_POST` Accounting's, `PURCHASE_ORDER_EDIT` Purchasing's buyer group. The
restricted areas deny `BOSS_MANUFACTURING` and allow their groups (`BOSS_MFG_<Area>`): Shop floor, Quality, Planning,
Subcontracting, Settings, Approvals, NewWorkOrder and ReportDowntime. No group reaches the raw `ManufacturingServices`
verbs, `update#WorkEffort` or the `/mantle` REST run paths.

`ironstone.manufacturing.AccessServices` (`Manufacturing.js`):

| Service | Contract |
| --- | --- |
| `get#SharedContext` | Refuses a user without Manufacturing, another `appRoot` and a plant outside the scope; answers the capabilities, organizations, selected plant and `sharedLinks` |
| `check#Record` | Read only. A run, operation, method, routing, work center, asset, facility, inspection, inspection template, downtime or schedule change (`recordKinds`), with an optional capability; a missing record and one outside the scope are refused alike (`RECORD_UNAVAILABLE`), a missing capability is `PERMISSION_DENIED` |
| `select#Plant`, `get#Choices`, `search#Records` | The plant preference (never widening the scope), the drop-downs and the palette's records, each scoped in the query and checked again |

Scope is read from the grants on the root, so disabled artifact authorization widens nothing. A record is in scope when
every owner it names and every facility it is at is one of the user's organizations'. A screen calls `check#Record`
first, then the Mantle verb, which checks its permission and the organization again; restricted values (costs, rates,
supplier prices) are left out by Mantle, never fetched and hidden. A run's operation is no Commons task and a run no event
(F38, F39); the palette's record link opens them under Manufacturing only.

## Mantle

New services, each over its own script module: `mantle.work.ProductionServices` (`Production*.js`: orders, materials,
quantities, quality, changes, shop floor, downtime, subcontracts, costs, policy), `ProductionPlanningServices` (schedule,
calendar, load), `ProductionReportServices` (the reports and the dashboard), `RoutingServices` and `WorkCenterServices`,
`mantle.product.BomServices` and `SupplyPlanningServices`, and `mantle.ledger.ProductionCostServices` (the cost close).
Every mutation takes an operation key and the run's expected revision; every lifecycle change is
`transition#ProductionOrder`; stock moves only through Warehouse's guards (`issue#ProductionMaterial`,
`return#UnusedMaterial`, `receive#ProductionOutput`, `receive#SubcontractOutput`); every cost fact is
`record#ProductionCostEvent`. A rule change to an existing Mantle service is behind its own ProductionPolicy flag, off by
default.

## Outputs (design §11)

| Output | Where |
| --- | --- |
| Traveler and pick sheet | `WorkOrderDetail/Traveler`, `WorkOrderDetail/PickSheet` |
| Operator instructions and quality checklist | `ShopFloor/InstructionsPrint`, `WorkOrderDetail/QualityChecklist` |
| Finished, secondary and WIP labels | `WorkOrderDetail/OutputLabels` (a held unit is labelled HELD) |
| BOM and routing print and CSV, explosion and compare | the shared method screens' Print and CSV |
| BOM and routing import with its preview | `BillsOfMaterials/Find` and `Routings/Find` (`import#BomCsv`, `import#RoutingCsv`) |
| Quality certificate | `Quality/QualityCertificate` |
| Dispatch and return instructions | `Subcontracting/SubcontractInstructions` (`kind` dispatch or return; no cost) |
| Reports and plan snapshots | each report's CSV and Print; `Planning/ScheduleSnapshot`, `Planning/PlanSnapshot` and Capacity's Print, each with CSV |
| Notices | the notification topics above |

The calibration evidence waits for Gauges (§7).

## Demo

Users (`data/BossUsersDemoData.xml`, password `moqui`), agents of Ziziwork Retail: `manufacturing.read` (a reader with no
other launcher), `.plan`, `.schedule`, `.method`, `.methodapprove`, `.operate`, `.supervise`, `.inspect`, `.verify`,
`.qualityadmin`, `.cost`, `.resource`, `.admin`; `.material` (an operator with Warehouse's issue and move groups),
`.finance` (Accounting read), `.buyer` (Purchasing's buyer), `.costclose` (Accounting's approver); `.display` (no root);
`manufacturing.services`, a reader of Ziziwork Services. Records (`data/BossManufacturingDemoData.xml`): Retail's plant
`ZIRET_WH` with lines `BOSS_MFG_LINE_A` and `_B`, the released BOM `BOSS_MFG_BOM_PILOT` of DEMO_1_1 and routing
`BOSS_MFG_ROUTING_A`, the draft run `BOSS_MFG_RUN_A`, the running quality run `BOSS_MFG_RUN_Q`, Warehouse's released
`BOSS_WH_RUN` with its subcontracted coating; Ziziwork Services' plant `BOSS_MFG_SVC_PLANT` and run `BOSS_MFG_SVC_RUN`.

## Tests

Run from mr-moqui: `./moq test mr-mantle --spec <name>` and `./moq test mr-boss --spec <name>` while working, and
`./moq test-apps` before a commit; the acceptance suite with `./moq accept mr-boss`, when asked.

- Mantle: `test/work/Production*.spec.js`, `WorkCenters`, `MethodTemplates`, `WarehouseProduction`;
  `test/product/ProductMethods`, `SupplyPlanning`; `test/ledger/ProductionCostClose`.
- BOSS regression: `test/Manufacturing/*.spec.js` (one per area; `ManufacturingAccess`, the app's one access spec),
  and the golden-path client walk `test/client/Manufacturing/ManufacturingWorkOrdersWalk.spec.js`.
- BOSS acceptance (`test/acceptance/Manufacturing/`, `test/acceptance/client/Manufacturing/`): the standalone walk
  `ManufacturingAccessWalk` (access, isolation and cost isolation)
  (`ManufacturingStandaloneLib.js`: an organization of its own plans, makes and receives with users of one capability;
  the other organization's users are refused its records and actions by URL, transition, service, export, print,
  palette, scan, search, notice and the other apps' shared contexts, and no cost shows without financial read),
  ManufacturingServerStatic, one screen sweep per mode, and the other client walks.

No route fixtures: a screen sweep is an acceptance test, one per app per mode. A new screen that shows a record goes in
the standalone lib's `p17Routes`; a screen ManufacturingServerStatic reports clean is marked `server-static="qvt"`.
