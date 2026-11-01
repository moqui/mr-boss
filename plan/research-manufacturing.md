# IronStone BOSS — Manufacturing app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Manufacturing** app, covering the four sections
initial-design gives it: **Work orders and production runs**, **BOMs & routings**,
**Planning (MRP)** and **Shop floor (material issue, time)**. It catalogues every relevant
screen/page found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md); feeds the Manufacturing row in
[initial-design.md](initial-design.md) and the Manufacturing versions of the reused
screens (crosscut §3–§4) that Manufacturing includes: **Product 360** (BOM tab,
where-used), **Inventory availability** (component availability), **Material issue /
receipt** (issue to and receipt from a run), **Facility & equipment record** (work
centers, production equipment, downtime) and **Quality inspection** (in-process and final
inspection gates).

**Organization.** Sorted by functional area (not by app): all BOM screens together, all
shop-floor screens together, etc. Within each area, sub-tables per reference app. Style
mirrors [research-warehouse.md](research-warehouse.md) and
[research-accounting.md](research-accounting.md).

**Scope.** Business UI only: screens, lists, forms, kanban/calendar boards, dialogs,
scan flows and report pages a production planner or shop-floor user actually touches.
Scheduling algorithms, MRP netting logic and costing math are noted only where they shape
a screen (statuses, quantity fields, exceptions, validation gates). Purchasing,
warehouse receiving/picking and accounting valuation screens are covered only where
Manufacturing includes or links into them.

**Path conventions.** Every backticked path resolves against the checkout for its prefix
(per [research-crosscut.md](research-crosscut.md) §1; checkouts under
`/home/jonesde/work/moquiwork/`). A tail such as `bom_card.php` is relative to the
directory named earlier in the same cell or row. `$id`-style route parameters and `x+/`
folders are literal parts of Carbon file names.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (`mrp`, `mrp_subcontracting`, `mrp_account`, `mrp_repair`, `stock`) |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…`: `erpnext/manufacturing/` (doctype, page, report, workspace), `erpnext/stock/doctype/quality_inspection*/`, `erpnext/quality_management/`, `erpnext/subcontracting/`, shop-floor client code in `erpnext/public/js/` |
| **Carbon** (Carbon MES for `apps/mes`) | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…`, MES `apps/mes/app/…`, planning engine `packages/planning/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/manufacturing/src/Filament/…`; in AureusERP rows `.../` elides the `Clusters/<cluster>/Resources/` folders down to the named one |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/{mrp,bom,workstation}/…` |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.manufacturing*/…`, mobile web UI `misc/services/mobile-webui/mobile-webui-frontend/src/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/template/…`, `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/{service,test}/…` |

**Not used here:** checked and found no production or manufacturing UI in Twenty,
Akaunting, Ever Gauzy, Ever Teams, Nextcloud, Zimbra, Signal, OpenProject, Redmine,
Dolibarr community modules, and the Frappe apps other than ERPNext (CRM, Helpdesk, HR,
Insights, LMS, Wiki, Gameplan, suite, Central, lending, payments). Of the Moqui
components, Sales, WorkManagement, WeCreate, coarchy, ServiceJobMonitor and ridgecrest
have no manufacturing screens; resistmanagement only mounts the SimpleScreens
`Manufacturing.xml` tree (`3p_moqui/resistmanagement/screen/resistadmin.xml`), the same
screens as the Moqui baseline.

Sections: [1 home & work queues](#1-manufacturing-home--work-queues) · [2 BOMs](#2-boms-product-structures) · [3 routings, operations & work centers](#3-routings-operations--work-centers) · [4 work orders / production orders](#4-work-orders--production-orders) · [5 shop floor execution](#5-shop-floor-execution) · [6 planning & mrp](#6-planning--mrp) · [7 subcontracting](#7-subcontracting) · [8 quality, downtime & scrap](#8-quality-downtime--scrap) · [9 costing & variance](#9-costing--variance) · [10 reports & analytics](#10-reports--analytics) · [11 configuration & settings](#11-configuration--settings) · [12 cross-app surfaces](#12-cross-app-surfaces) · [13 current Moqui baseline](#13-current-moqui-baseline-mr-marble--marbleerp--mantle) · [14 gaps & BOSS implications](#14-gaps--boss-implications)

---

## 1. Manufacturing home & work queues

### Odoo — menu tree, no dashboard; the MO list is the home

Manufacturing is a standard app with five top-level menus and no landing dashboard. The
default entry is the manufacturing-order list; work is found by filtering that list or the
work-order planning board.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manufacturing root menu | **Operations** (Manufacturing Orders, Work Orders, Unbuild, Scrap, Lots/Serial Numbers) · **Planning** · **Products** (Bills of Materials) · **Reporting** (Work Orders, work-center productivity/OEE) · **Configuration** (Settings, Work Centers, Operations); whole app gated to `group_mrp_user` / `group_mrp_manager` | `odoo/addons/mrp/views/mrp_views_menus.xml` (menuitems `menu_mrp_root`, `menu_mrp_manufacturing`, `mrp_planning_menu_root`, `menu_mrp_bom`, `menu_mrp_reporting`, `menu_mrp_configuration`); `mrp/views/stock_move_views.xml` adds Scrap + Lots; `mrp/views/mrp_workcenter_views.xml` and `mrp/views/mrp_routing_views.xml` add Configuration items |
| Manufacturing Orders list | `mrp.production` list/card/kanban/calendar/pivot/graph over one dataset; filters for To Do, state, MO readiness, late, component availability, starred, My MOs; list exposes product, quantity, BOM, assigned user, components availability, scheduled date, deadline, state | `odoo/addons/mrp/views/mrp_production_views.xml` (`mrp_production_tree_view`, `mrp_production_card_view`, `mrp_production_kanban_view`, `view_production_calendar`, `view_production_pivot`, `view_production_graph`, `view_mrp_production_filter`, actions `mrp_production_action`, `mrp_production_action_picking_deshboard`) |
| Work Orders planning board | `mrp.workorder` in list, kanban, form, calendar, pivot and graph; the kanban defaults grouped by work center and is the planner's board; search defaults to work center + ready/blocked/planned/in-progress | `odoo/addons/mrp/views/mrp_workorder_views.xml` (`workcenter_line_kanban`, action `action_mrp_workorder_workcenter`, filters `view_mrp_production_workorder_form_view_filter`) |
| Work-center load | Pivot and graph over work orders (expected vs real duration, cost) plus a **Workcenter Load** report action | `odoo/addons/mrp/views/mrp_workorder_views.xml` (`view_workcenter_load_pivot`, `view_work_center_load_graph`, `action_mrp_workcenter_load_report_graph`, `action_mrp_workcenter_load_report_pivot`) |
| Unbuild orders | Separate list/kanban/form for disassembly; source MO or manual, quantity, destination location, stock moves | `odoo/addons/mrp/views/mrp_unbuild_views.xml` (`mrp_unbuild_tree_view`, `mrp_unbuild_kanban_view`, `mrp_unbuild_form_view`) |

### ERPNext — workspace with KPI strip, chart and report cards

The Manufacturing workspace is a proper landing page: onboarding, one analysable chart,
three number cards and six link cards. The cards are navigation, not widgets.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manufacturing workspace | Onboarding block, **Work Order Analysis** chart, number cards **Open Work Orders**, **WIP Work Orders**, **Monthly Completed Work Order**; cards **Production Reports**, **Planning Reports**, **BOM Reports**, **Planning**, **Tools**, **Setup** | `erpnext/manufacturing/workspace/manufacturing/manufacturing.json` |
| Production Reports card | Work Order Summary, Open Work Orders, Work Orders in Progress, Completed, Consumed Materials, Stock Report, Issued Items, Job Card Summary, Downtime Analysis, Process Loss, Cost of Poor Quality, Quality Inspection Summary | same workspace; report dirs under `erpnext/manufacturing/report/` |
| Planning Reports card | Production Planning Report, Production Plan Summary, Material Requirements Planning Report, Exponential Smoothing Forecasting | same workspace; `erpnext/manufacturing/report/` |
| BOM Reports card | BOM Search, BOM Explorer, BOM Stock Analysis, BOM Variance, BOM Operations Time | same workspace; `erpnext/manufacturing/report/` |
| Planning card | **Master Production Schedule**, **Sales Forecast**, both DocTypes | `erpnext/manufacturing/doctype/master_production_schedule/`, `sales_forecast/` |
| Tools card | **Visual Plant Floor**, **BOM Comparison Tool** pages | `erpnext/manufacturing/page/visual_plant_floor/`, `bom_comparison_tool/` |
| Setup card | Workstation Type, Item, Warehouse | `erpnext/manufacturing/doctype/workstation_type/` |

### AureusERP — four clusters, MO list as the operational home

Manufacturing is a Filament plugin with clusters **Operations**, **Products**,
**Configurations** and **Settings**. The manufacturing-order resource is the working
list; a separate read-only **Overview** page is the record's production dashboard.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Operations cluster | Manufacturing Orders, Work Orders, Transfers; each resource has list/view/edit plus record actions | `plugins/webkul/manufacturing/src/Filament/Clusters/Operations.php`, `.../Operations/Resources/{ManufacturingOrderResource,WorkOrderResource,TransferResource}.php` |
| Manufacturing Orders list | Columns: reference, start, end, deadline, product, lot/serial, BOM, source/origin, responsible, MO readiness, component status, quantity, UoM, consumption efficiency, expected/real duration, company, state; group by state/product/BOM/responsible/deadline; bulk delete | `.../ManufacturingOrderResource/Tables/ManufacturingOrdersTable.php` |
| Manufacturing Order overview | Read-only dashboard for one MO: product/UoM, available and on-hand quantity, receipt date, order status, component rows (reserved, status available/waiting, receipt label, unit/total/real cost), work-order rows (unit cost) | `.../ManufacturingOrderResource/Pages/OverviewManufacturingOrder.php`, `resources/views/filament/clusters/operations/resources/manufacturing-order/pages/overview-manufacturing-order.blade.php` |
| Work Orders list/form | Operation, work center, product, quantity remaining/produced, start/end, expected/real duration, status; form has time tracking, components, work instruction, blocked-by | `.../WorkOrderResource/Tables/WorkOrdersTable.php`, `.../Schemas/WorkOrderForm.php` |
| Products cluster | Bills of Materials, Lots, Products; BOM has a read-only **Bill of Material Overview** page in addition to the form | `.../Products/Resources/BillsOfMaterialResource/Pages/BillOfMaterialOverview.php` |
| Configurations cluster | Operations and Work Centers, with **Manage Operations** on a work center | `.../Configurations/Resources/{OperationResource,WorkCenterResource}.php` |

### Carbon — production dashboard plus separate ERP and MES navigation

Carbon's ERP sidebar groups **Production** (Jobs, Batches), **Planning** (Demand
Forecasts, Material Planning, Resource Planning), **Scheduling** (Forecast, Priorities,
Outbound), **Work Instructions** (Assemblies, Procedures) and **Configure** (Scrap
Reasons). The MES app is a second nav surface for operators.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Production dashboard `/x/production` | Landing page: counts of active jobs, jobs assigned to the current user, unbatched batchable operations, work-center blocking state, and a stream of active production events; KPI chart switches **Work Center Utilization / Estimates vs Actuals / Completion Time** over week/month/quarter/year with CSV export | `apps/erp/app/routes/x+/production+/_index.tsx`, `apps/erp/app/modules/production/production.models.ts` (`KPIs`), `apps/erp/app/routes/api+/production.kpi.$key.ts` |
| Production navigation | Module map used by the sidebar: Production, Planning, Scheduling, Work Instructions, Configure | `apps/erp/app/modules/production/ui/useProductionSubmodules.tsx` |
| Jobs list `/x/production/jobs` | Work-order table with item revision, tracking, status, batches, customer, sales order, assignee, dates, and order/inventory/production/scrap/completed/shipped/received quantities | `apps/erp/app/routes/x+/production+/jobs.tsx`, `apps/erp/app/modules/production/ui/Jobs/JobsTable.tsx` |
| Batches list `/x/production/batches` | Batch status, process, work center, member count, summed quantity, last activity; release/unrelease/dissolve actions | `apps/erp/app/routes/x+/production+/batches.tsx`, `apps/erp/app/modules/production/ui/Batches/BatchesTable.tsx` |
| MES queue home `/x/operations` | Operator landing Kanban by work center with batch cards collapsed and live status | `apps/mes/app/routes/x+/operations.tsx`, `apps/mes/app/components/AppSidebar.tsx` |

### Dolibarr — two separate modules, MO list is the home

Dolibarr splits manufacturing across **MRP** (manufacturing orders) and **BOM**
(bills of materials), each with its own list/card. There is no combined landing page.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manufacturing Orders list | Searchable, column-configurable list with status filters (including "late"), mass actions, category filter, export; link to cards | `htdocs/mrp/mo_list.php`, `htdocs/mrp/class/mo.class.php` |
| Manufacturing Order card | Header plus cost summary, notes, documents, and a link into the **Production** screen; actions Validate, Cancel, Clone, Delete, Close | `htdocs/mrp/mo_card.php`, `htdocs/mrp/mo_production.php` |
| BOM list/card | Separate module; list with type/status filters, card with components, costing and **Net Needs** | `htdocs/bom/bom_list.php`, `htdocs/bom/bom_card.php`, `htdocs/bom/bom_net_needs.php` |
| Workstations list/card | Separate module enabled beside MRP; workstation type, operators required, hourly operator/machine cost, enabled/disabled | `htdocs/workstation/workstation_list.php`, `htdocs/workstation/workstation_card.php` |

### metasfresh — the PP Order Candidate window is the planner's home

metasfresh has no React production module; manufacturing screens are metadata-defined
windows rendered by the generic document-list shell. The one dedicated planning surface
is the **PP Order Candidate** window (ID `541316`), with a custom header that aggregates
selected rows.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PP Order Candidate window | Master-planning candidate list; header shows selected **Number of Resources**, **Qty to Process** and **Qty Processed** per UoM (summed over the current page/selection) | `frontend/src/components/ppOrderCandidate/PPOrderCandidateViewHeader.js` (`PP_ORDER_CANDIDATE_WINDOW_ID = '541316'`) |
| Candidate processes | **Set Start Date** and **Set Workstation** processes invoked from the candidate window | `backend/de.metas.manufacturing.webui/src/main/java/de/metas/manufacturing/webui/process/PP_Order_Candidate_SetStartDate.java`, `PP_Order_Candidate_SetWorkstation.java` |
| Manufacturing order windows | Standard document windows over `PP_Order` / `PP_Order_BOM` / `PP_Order_Workflow`; no custom React page, so list/detail layout comes from the generic window container | `frontend/src/containers/DocumentListContainer.js`, `MasterWindowContainer.js`, `frontend/src/components/window/`; business objects in `backend/de.metas.manufacturing/src/main/java/de/metas/manufacturing/order/` |

**BOSS implications.** No reference lands on a chart wall: Odoo and Dolibarr land on the
MO list, ERPNext on a KPI/report workspace, metasfresh on the planning-candidate window.
One option for IronStone Manufacturing combines the two in one root: a queue board (work
orders by status / work center, with ready, late, blocked, pending counts) plus a small
KPI strip (open, WIP, completed this month, component shortages). Odoo's action contexts
and AureusERP's grouped tables show the queue deep-linking into pre-filtered lists through
screen parameters; none of the references builds the landing page as a separate
aggregation table.

---

## 2. BOMs (product structures)

### Odoo — one BOM form, operations inline, structure report

A BoM is a header (product, quantity, type) plus components, operations and by-products.
There is no separate "routing" document: operations are rows on the BoM, each naming a
work center. Two types matter: **Manufacture this product** (`normal`) and **Kit**
(`phantom`; exploded into components instead of being produced).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bills of Materials list | Editable multi-edit list: product, code, type, variant, company, quantity, UoM; filters Manufacture/Kit/Archived; group by product/type/UoM; kanban card shows product + quantity and code | `odoo/addons/mrp/views/mrp_bom_views.xml` (`mrp_bom_tree_view`, `mrp_bom_kanban_view`, `view_mrp_bom_filter`, action `mrp_bom_form_action`) |
| BoM form | Header: product/variant, quantity + UoM, reference code, radio type (normal/phantom), company. Smart buttons: **Components** + **Sub Assemblies** count, **Operations Performance**, **BoM Overview** | `odoo/addons/mrp/views/mrp_bom_views.xml` (`mrp_bom_form_view`, `action_mrp_routing_time`, `action_report_mrp_bom`) |
| Components tab | Editable bottom list: component, quantity, UoM, consumed-in-operation, apply-on-variant, cost share; catalog button; optional zero-quantity lines | same view, page `components` |
| Operations tab | Operation rows (`mrp.routing.workcenter`) with an inline shop-floor diagram annotation (time clock, quality control, feedback loop) when empty; per-operation duration/time mode | same view, page `operations`; `odoo/addons/mrp/views/mrp_routing_views.xml` |
| By-Products tab | Additional outputs with product, quantity, UoM, operation, cost share | `odoo/addons/mrp/views/mrp_bom_views.xml` (`mrp_bom_byproduct_form_view`), group `group_mrp_byproducts` |
| Miscellaneous tab | Manufacturing lead time (`produce_delay`), days to prepare MO, batch size, readiness (`all_available` vs `asap`), operation dependencies, internal note; chatter | same view, page `miscellaneous` |
| BoM Structure & Cost report | Client action rendering the multi-level BOM tree with quantities and costs; also the **BoM Overview** report | `odoo/addons/mrp/report/mrp_report_bom_structure.xml`, `mrp_report_views_main.xml`; action `action_report_mrp_bom` |
| Used-in-BOMs / exploded lines | List of BOM lines using a component, plus an exploded-components list and pivot (quantity, cost) | `odoo/addons/mrp/views/mrp_bom_views.xml` (`mrp_bom_line_action_used_in_boms`, `mrp_bom_line_view_list_exploded_components`, `mrp_bom_line_view_pivot`) |

### ERPNext — deepest BOM model: costing, explosion, website, BOM Creator

ERPNext separates **BOM**, **Routing**, **Operation**, **Workstation** and **Workstation
Type**, and adds a BOM Creator builder plus a comparison tool.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| BOM form | Header: item to manufacture, image, UoM, output quantity, active/default, **With Operations**, **Inspection Required**, alternative items, quality-inspection template. Cost section: company, transfer material against (Work Order / Job Card), currency, rate basis, buying price list | `erpnext/manufacturing/doctype/bom/bom.json`, `bom.js` |
| Components table | `BOM Item`: item, operation, quantity/percentage, UoM, rate/amount, source warehouse, `include_item_in_manufacturing`, `do_not_explode`, alternative item, sub-assembly/phantom flags | `erpnext/manufacturing/doctype/bom_item/bom_item.json` |
| Operations table | `BOM Operation`: operation, workstation, description, hour rate, time in minutes + fixed time, operating cost, batch size, sequence, subcontracted, quality inspection required, WIP/FG warehouses | `erpnext/manufacturing/doctype/bom_operation/bom_operation.json` |
| Tabs | **Costing** (operating, raw material, total, base totals, project), **Exploded Items**, **Website** (publish, route, images, descriptions), **Connections**, **More Info** (process loss, semi-finished tracking), **BOM Configuration** (backflush basis) | `erpnext/manufacturing/doctype/bom/bom.json` |
| BOM Creator | Tree-building page to assemble a new multi-level BOM from items; saves `BOM Creator` / `BOM Creator Item` | `erpnext/manufacturing/doctype/bom_creator/`, `erpnext/manufacturing/doctype/bom_creator_item/` |
| BOM Comparison Tool | Page that compares two BOMs line by line (quantity/rate/cost differences) | `erpnext/manufacturing/page/bom_comparison_tool/bom_comparison_tool.js` |
| BOM update batch/log | Tracked bulk updates of BOMs (rate/quantity) with a log per batch | `erpnext/manufacturing/doctype/bom_update_tool/`, `erpnext/manufacturing/doctype/bom_update_batch/`, `bom_update_log/` |

### AureusERP — Odoo-shaped BOM form in Filament

The BOM resource mirrors Odoo's model closely: general section, tabs for Components,
Operations and By-products, a Miscellaneous area with readiness/routing/consumption, and a
separate read-only overview page.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bills of Materials list | Reference, product, quantity, UoM, type, company, updated-at; filters product/type/company; view/edit/delete + restore | `plugins/webkul/manufacturing/src/Filament/Clusters/Products/Resources/BillsOfMaterialResource/Tables/BillsOfMaterialTable.php` |
| BOM form | **General**: reference, product, variant, quantity, UoM, type (normal/phantom), company. **Miscellaneous**: kit information, manufacturing lead time (days), days to prepare MO | `.../Schemas/BillOfMaterialForm.php`; labels in `resources/lang/en/filament/clusters/products/resources/bill-of-material.php` |
| Components tab | Repeater: component, apply-on-variants, consumed-in-operation, highlight-consumption, quantity, UoM; validation that component ≠ product | same form, `Repeater::make('lines')` |
| Operations tab | Repeater: operation, work center, duration computation (auto/manual), computed on last N, company, apply-on-variants, duration (minutes); **Copy Existing Operations** action; per-line edit action | same form, `Repeater::make('operations')` |
| By-products tab | Repeater: product, quantity, UoM, produced-in-operation | same form, `Repeater::make('byproducts')` |
| BOM Overview page | Read-only overview built from the BOM and its lines/operations | `.../BillsOfMaterialResource/Pages/BillOfMaterialOverview.php` |
| Product → BOMs | Product record page with a **Bills of Materials** management tab | `.../ProductResource/Pages/ManageBillsOfMaterials.php` |

### Carbon — versioned make method with Bill of Process and Bill of Material

Carbon splits the BOM into a **make method** (a versioned manufacturing definition). Each
method has a **Bill of Process** (routing) and a **Bill of Material**; only `Draft` is
editable, and `Active`/`Archived` are read-only until a new version is created.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Part method page `/x/part/:itemId/make/:makeMethodId` | Master page: method/version switcher (`MakeMethodTools`), Bill of Process, Bill of Material, item CAD model | `apps/erp/app/routes/x+/part+/$itemId.make.$makeMethodId.tsx`, `apps/erp/app/modules/items/ui/Item/{MakeMethodTools,BillOfProcess,BillOfMaterial}.tsx` |
| Bill of Material editor | Sortable material rows with a material drawer: part, quantity, UoM, sourcing type, method type, location + storage unit (WIP vs default), optional operation association, per-step assignment, configuration rules | `apps/erp/app/modules/items/ui/Item/BillOfMaterial.tsx` |
| BoM explorer | Multi-level method tree with search, expand/collapse, CSV/JSON export, Onshape sync entry, per-method version status | `apps/erp/app/modules/items/ui/Item/BoMExplorer.tsx`, `apps/erp/app/components/BoMExplorer/BoMExplorer.tsx` |
| Make-method versions | Create/activate/delete versions; `Draft → Active → Archived`; draft-only editing | `apps/erp/app/modules/items/ui/Item/{MakeMethodTools,MakeMethodVersionStatus}.tsx`, `apps/erp/app/modules/items/items.service.ts` |
| Job BOM/BoP editors | The same editors applied to a job's copied method, with job-specific steps, slides, tools, procedure/assembly sync and batch badges | `apps/erp/app/modules/production/ui/Jobs/{JobBillOfMaterial,JobBillOfProcess,JobMakeMethodTools}.tsx` |
| Procedures / assembly instructions | Versioned rich-text work instructions (Draft / Active / Archived) and 3D assembly instructions (Draft / Published / Archived) attached to operations | `apps/erp/app/routes/x+/procedure+/$id.tsx`, `x+/assembly+/$id.tsx`, `apps/erp/app/modules/production/ui/Procedures/*`, `ui/Assemblies/*` |

### Dolibarr — BOM module with net-needs explosion

| Screen/page | What it is | Key files |
| --- | --- | --- |
| BOM list | Reference, label, type (Manufacturing / Disassemble), product, quantity, status (Draft/Enabled/Disabled), user/date; category filter and mass actions | `htdocs/bom/bom_list.php`, `htdocs/bom/class/bom.class.php` |
| BOM card | Header with product, quantity, type, warehouse, estimated duration, cost summary; component lines (quantity, frozen quantity, efficiency, disable stock change, child BOM); a separate **Services** list whose lines carry a default workstation (shown when the Workstation module is on) and add workstation hourly cost; validate/cancel actions | `htdocs/bom/bom_card.php`, `htdocs/bom/class/bom.class.php`, `htdocs/bom/tpl/objectline_view.tpl.php` |
| BOM Net Needs | Multi-level explosion against stock: grouped **by product** or **tree view**, columns quantity, physical stock, virtual stock, produced-by; expand/collapse all; warning where BOM supply is insufficient | `htdocs/bom/bom_net_needs.php` |
| BOM documents/notes/agenda | Standard Dolibarr tabs beside the card | `htdocs/bom/bom_document.php`, `bom_note.php`, `bom_agenda.php` |

### metasfresh

No BOM editor UI in the React frontend; BOMs are `PP_Order_BOM` / `PP_Order_BOMLine`
records managed in metadata windows. Planning candidates carry the resulting BOM
explosion. Treat metasfresh as a planning reference only.

**BOSS implications.** The useful consensus is a BOM header + three line collections
(components, operations, by-products) with a read-only exploded view and a cost roll-up.
Odoo and AureusERP prove the form layout; ERPNext proves the fields that make it usable
(operation binding per component, phantom/kit, lead times, inspection requirement,
exploded-items table); Dolibarr's net-needs tree is the cheapest usable MRP view and maps
directly onto a Moqui screen with a recursive service call. BOM version/status is a gap
in the references (none of Odoo community or AureusERP exposes a clean version lifecycle;
ERPNext uses active/default + amendment), and it matters because a production order needs
the BOM revision it was created from. Odoo's product stat buttons and AureusERP's product
**Bills of Materials** tab place the BOM editor on the product; in BOSS terms that is the
BOM tab of the **Product 360** that Manufacturing includes **(reused: Products, Commerce,
Purchasing, Warehouse, Accounting, Sales)**, where the Manufacturing version shows BOM and
where-used. The Mantle line record is
`ProductAssoc` type `PatMfgBom`, which already has quantity, scrap factor, instruction,
consuming operation and effective dates.

---

## 3. Routings, operations & work centers

### Odoo — operations live on the BoM; work centers are resources with calendars

Odoo has no standalone routing document. Each **operation** (`mrp.routing.workcenter`) is
a BoM line naming a work center; sequencing comes from the line order, and optional
blocked-by dependencies express precedence.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Operations on a BoM | Editable list ordered by sequence: operation name, work center, duration, total duration, blocked-by operations; **Add a line**, **Copy Existing Operations**; drag handle for order | `odoo/addons/mrp/views/mrp_routing_views.xml` (`mrp_routing_workcenter_tree_view`, `mrp_routing_workcenter_bom_tree_view`, `mrp_routing_workcenter_kanban_view`, `mrp_routing_workcenter_filter`) |
| Operation form | Operation name, work center, cost mode, blocked-by, time mode (manual vs auto from last N work orders), default cycle time, computed total duration; chatter | `odoo/addons/mrp/views/mrp_routing_views.xml` (`mrp_routing_workcenter_form_view`) |
| Work Centers list/kanban | Name, code, tags, alternative work centers, calendar, time efficiency, OEE target, cost/hour; kanban shows status color and OEE % against target | `odoo/addons/mrp/views/mrp_workcenter_views.xml` (`mrp_workcenter_tree_view`, `mrp_workcenter_view_kanban`, `mrp_workcenter_action`, `mrp_workcenter_kanban_action`) |
| Work Center form | Smart buttons **Operations**, **OEE %**, **Lost hours**, **Load minutes**, **Performance %**; general info (efficiency, OEE target, start/stop times, cost/hour); **Product Capacities** tab (product or all products, capacity, UoM, setup/cleanup windows) | `odoo/addons/mrp/views/mrp_workcenter_views.xml` (`mrp_workcenter_view`) |
| OEE reports | OEE pie, productivity-loss form/list/kanban, OEE search/form/tree/graph/pivot over `mrp.workcenter.productivity.loss` (productive, blocked, performance losses) | `odoo/addons/mrp/views/mrp_workcenter_views.xml` (`oee_pie_view`, `oee_loss_form_view`, `oee_loss_tree_view`, `oee_loss_kanban`, `oee_search_view`, `oee_form_view`, `oee_tree_view`, `oee_graph_view`, `oee_pivot_view`) |

### ERPNext — standalone Routing, Operation, Workstation, Plant Floor

ERPNext normalizes the concepts: operations are master data (optionally with
sub-operations and a work instruction), routings are reusable ordered lists of
operations, workstations are resources, and plant floors group workstations visually.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Operation form | Workstation default, description, rich **work instruction**, sub-operations, total operation time, batch size, create-job-card-per-batch, corrective-operation flag, quality-inspection template | `erpnext/manufacturing/doctype/operation/operation.json`, `operation.js`; `sub_operation/` |
| Routing form | Named ordered list of **BOM Operation** rows; disabled flag | `erpnext/manufacturing/doctype/routing/routing.json` |
| Workstation form | Workstation name, type, plant floor, warehouse, production capacity, hour rate, working hours (child table), holiday list, status (Production / Off / Idle / Problem / Maintenance / Setup) with on/off images, cost rows | `erpnext/manufacturing/doctype/workstation/workstation.json`, `erpnext/manufacturing/doctype/workstation/workstation.js`, `workstation_cost/`, `workstation_working_hour/` |
| Workstation Type | Shared hour rate and cost rows; groups workstations | `erpnext/manufacturing/doctype/workstation_type/workstation_type.json` |
| Plant Floor | Named floor with a **plant dashboard** (HTML/visual layout), warehouse link, stock summary; feeds **Visual Plant Floor** page | `erpnext/manufacturing/doctype/plant_floor/plant_floor.json`; page `erpnext/manufacturing/page/visual_plant_floor/` |
| Visual Plant Floor | Visual grid of workstations/floors showing live status; rendered by `frappe.ui.VisualPlantFloor` | `erpnext/manufacturing/page/visual_plant_floor/visual_plant_floor.js`, `erpnext/public/js/plant_floor_visual/visual_plant.js` |

### AureusERP — Operations and Work Centers as configuration resources

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Operations list/form | Operation, BoM, work center, apply-on-variants, company, blocked-by; **Settings** (duration computation auto/manual, based on last N work orders, default duration); **Work Sheet** (PDF, Google Slide link, description) | `plugins/webkul/manufacturing/src/Filament/Clusters/Configurations/Resources/OperationResource/Schemas/OperationForm.php`, `Tables/OperationsTable.php`; labels `resources/lang/en/filament/clusters/configurations/resources/operation.php` |
| Work Centers list/form | Name, code, tags/color, alternative work centers, working-hours calendar, company, note; **General Information** (default capacity, time efficiency, OEE target, cost/hour, setup/cleanup minutes); **Specific Capacity** repeater (product, UoM, capacity, setup, cleanup) | `.../WorkCenterResource/Schemas/WorkCenterForm.php`, `plugins/webkul/manufacturing/src/Filament/Clusters/Configurations/Resources/WorkCenterResource/Tables/WorkCentersTable.php`; labels `.../work-center.php` |
| Work Center → Operations | Managed tab on the work-center record listing its operations with a **Create** action | `.../WorkCenterResource/Pages/ManageOperations.php` |

### Carbon — Bill of Process, operation dependencies and work-center masters

Carbon keeps the routing in a **Bill of Process** on the make method. Operations are
ordered rows with an explicit type (Process / Assembly / Inspection / Outside
Processing), optional procedure/assembly/inspection pointer, and step/parameter editors.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bill of Process editor | Sortable operation list with **Add Operation**; per operation tabs **Instructions / Parameters / Steps** (badges show inheritance from a Procedure, Assembly Instruction or Inspection Plan); fields Process, Operation Type, Work Center, Description, Operation Order (`After Previous` / `With Previous`), Setup/Labor/Machine time + unit, outside-processing supplier/cost/lead time | `apps/erp/app/modules/items/ui/Item/BillOfProcess.tsx` |
| Operation steps | Step types `Task, Value, Measurement, Checkbox, Timestamp, Person, List, File, Inspection`, with min/max, list options, slides, parts, tools; parameters are key/value rows | `apps/erp/app/modules/items/ui/Item/BillOfProcess.tsx`, `apps/erp/app/modules/shared/shared.models.ts` |
| Operation DAG | React-Flow graph of operations and dependency edges; used on the job detail (`/dag`) and MES job view | `apps/erp/app/routes/x+/job+/$jobId.dag.tsx`, shared `JobDag` |
| Work Center master `/x/resources/work-centers` | Name, processes, location, department, default unit, description; labor/machine/overhead rates; capital-cost table (asset, NBV, monthly depreciation); scheduling mode (lights-out vs shifts) with shifts; batching capacity and minimum batch quantity | `apps/erp/app/routes/x+/resources+/work-centers.$id.tsx`, `apps/erp/app/modules/resources/ui/WorkCenters/WorkCenterForm.tsx` |
| Process master `/x/resources/processes` | Process name/type, default unit, allowed work centers, **Requires Ability**, **Batchable**, kanban scan-completes-all; batch type and property compatibility rules; supplier processes | `apps/erp/app/routes/x+/resources+/processes.$processId.tsx`, `apps/erp/app/modules/resources/ui/Processes/ProcessForm.tsx` |
| Scheduling availability | Work-center shift mode, location shifts, maintenance downtime and a shared availability ladder consumed by the scheduler, Gantt shading and capacity series | `apps/erp/app/modules/production/ui/Schedule/{ForecastHeader,WorkCenterAvailabilityPopover}.tsx`, `packages/planning/src/scheduling/machine-availability.ts` |

### Dolibarr — workstation is a lightweight resource, not a routing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Workstation list/card | Reference, label, type **HUMAN / MACHINE / BOTH**, operators required, estimated hourly operator and machine cost, enabled/disabled, user groups/resources | `htdocs/workstation/workstation_list.php`, `htdocs/workstation/class/workstation.class.php` |
| Workstation use in production | The MO production screen lets each produced/consumed line pick a workstation and computes line cost from `thm_operator_estimated + thm_machine_estimated` | `htdocs/mrp/mo_production.php` (workstation selects around the production line table) |

Dolibarr has no routing entity. The nearest thing to operations is the BOM's **Services**
list: service lines ordered by position, each with a default workstation whose hourly
rates feed cost. On the MO the workstation is an attribute of a production line. That is
the minimum viable model and a possible fallback where no routing is defined.

### metasfresh

No routing master UI; work centers are resources (`S_Resource`) selected on planning
candidates through the **Set Workstation** process and carried onto `PP_Order_Workflow`
nodes.

**BOSS implications.** Odoo's "operations are BoM lines" and ERPNext's "routing is
reusable master data" are the two viable shapes. Mantle already carries the second one in
its data model, unused by any screen: a routing is a `WorkEffort` with purpose
`WepRouting`, its operations are `WepRoutingTask` WorkEfforts joined by `WorkEffortAssoc`
type `WeatRoutingComp` (with `sequenceNum`), the product points at its routing through
`WorkEffortProduct` type `WeptRouting`, and a BOM line can name the operation that
consumes it (`ProductAssoc.routingWorkEffortId`). One option is to edit that routing from
the product (one routing per product feels like Odoo's operations-on-the-BoM) while still
allowing several products to share a routing when a business needs it; Odoo and AureusERP
both cover the common case with a "copy operations from another product" action. The
references' operation catalogues carry name, default work center, work instruction,
standard setup and run time (`estimatedSetupTime`, `estimatedWorkTime`) and
setup/cleanup. Work centers carry calendar, capacity, efficiency and cost/hour because
scheduling, OEE and costing all read them. In Mantle a work center is a `Facility` of
type `FcTpLine` (Production Line) with its equipment `Asset`s, so the evidence favors the
work center being the **Facility & equipment record (reused: Maintenance, Warehouse,
Commons, Accounting)** as Manufacturing includes it (capacity, calendar, cost rates,
equipment, load) rather than a separate Manufacturing master.

---

## 4. Work orders / production orders

### Odoo — `mrp.production` is the order, `mrp.workorder` its operations

A manufacturing order is one document covering the finished product, components and
(sub)operations. The order header owns the lifecycle; work orders are generated from the
BoM operations and scheduled separately.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| MO list views | List/card/kanban/calendar/pivot/graph. List header actions **Plan**, **Reserve**, **Cancel**; columns priority, reference, scheduled/end/deadline (late highlighted), product, lot/serial, BoM, next activity, origin, responsible, **components availability** (available/expected/late/not available), readiness, quantity, UoM, expected/real duration, state | `odoo/addons/mrp/views/mrp_production_views.xml` (`mrp_production_tree_view`, `mrp_production_card_view`, `mrp_production_kanban_view`, `view_production_calendar`, `view_production_pivot`, `view_production_graph`, `view_mrp_production_filter`) |
| MO form header | Status bar **Draft → Confirmed → In Progress → To Close → Done** (without work orders: Draft → Confirmed → In Progress → Done). Buttons **Confirm**, **Plan/Unplan**, **Start**, **Produce**, **Cancel**, **Reset to Draft**, **Set to In Progress**; Produce hotkey `g` | `odoo/addons/mrp/views/mrp_production_views.xml` (`mrp_production_form_view`, header) |
| MO smart buttons | Allocation, Child MO, Source MO, Backorders, Unbuilds, Scraps, Transfers, **Overview**, Product Moves, Traceability, Detailed Operations, Packages, Serial Numbers | same view, `oe_button_box` |
| MO header fields | Product, optional variant description, BoM (+ **Generate BOM**, **Update BoM** when outdated), quantity / quantity producing + UoM, scheduled or actual dates, responsible, origin, lot/serial generation (Generate Lot Number / Generate Serial Numbers / Clear) | same view, sheet groups |
| Components tab | Editable raw-move list: component, required vs consuming quantity, lot/serial, source location, availability decorations; catalog/add line; show-details dialog; reserve/unreserve | same view, page `components`; actions `action_reserve`, `action_unreserve_tree` |
| Work Orders tab | Inline work-order list with operation, work center, expected/real duration, status/start/pause/done controls; same rows also served by the planning board | same view, page `operations`; `odoo/addons/mrp/views/mrp_workorder_views.xml` |
| By-Products tab / Miscellaneous | By-product moves (product, quantity, operation) behind `group_mrp_byproducts`; miscellaneous picking type, source/destination locations, deadline, company, note; chatter | same view, pages `finished_products`, `miscellaneous` |
| MO Overview | Printable/client report that lays out the order, component availability and cost summary | `odoo/addons/mrp/report/mrp_report_mo_overview.xml`, `mrp_report_mo_overview.py`; action `action_report_mo_overview` |
| Split / merge / backorder | Wizards for changing quantity, splitting an MO, creating backorders, generating serial numbers, consumption warnings, insufficient-stock warning | `odoo/addons/mrp/wizard/{change_production_qty,mrp_production_split,mrp_production_backorder,mrp_production_serial_numbers,mrp_consumption_warning,stock_warn_insufficient_qty}.*` |

### ERPNext — Work Order with explicit material-transfer and finish steps

ERPNext's Work Order is submit-based and deliberately stages material movement:
**Material Transfer for Manufacture** into WIP, then **Manufacture** to finish goods.
Job Cards are separate documents per operation.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Work Order form | Tabs **Production Item** (item, BOM, qty, produced qty, material transferred, WIP/FG/scrap warehouses, required items, planned/actual dates, operations, costs) · **More Info** (description, material request, sales order/project/production plan links, batch/serial, process loss) · **Connections** · **Scheduling & Costing** (MPS, subcontracting, max producible) · **Job Cards** · **Material Requests** · **Stock Entries** | `erpnext/manufacturing/doctype/work_order/work_order.json`, `work_order.js` |
| Work Order list/report | Status filter covers Draft, Submitted, Not Started, In Process, Stock Reserved, Stock Partially Reserved, Completed, Stopped, Closed, Cancelled; list shows progress and material status | `erpnext/manufacturing/doctype/work_order/work_order_list.js`, `.../work_order/work_order.json` |
| Work Order actions | Submit → **Start** → **Stop/Re-open** → **Finish** (posts Manufacture stock entry) → **Close**; **Pick List**, **Material Request**, **Additional Material Transfer**, **Material Consumption**, **Operator Dashboard**, **Alternate Item**, **Return Components**, **Change Finished Item**, make Job Cards, make BOM, make disassembly | `erpnext/manufacturing/doctype/work_order/work_order.js` (`erpnext.work_order.set_custom_buttons`, `add_start_button`, `make_job_card`, `make_consumption_se`), `erpnext/manufacturing/doctype/work_order/work_order.py` |
| Job Card form | Work order, final BOM, workstation, operation, posting date, qty to manufacture, WIP warehouse, **Time Logs** (from/to, minutes, completed qty, employee), **Items** (required, transferred, consumed), status, operation row, quality inspection, sub-operations, corrective-job-card fields, scheduled time logs, actual dates | `erpnext/manufacturing/doctype/job_card/job_card.json`, `erpnext/manufacturing/doctype/job_card/job_card.js` |
| Job Card operator dashboard | Embedded HTML dashboard with a live stopwatch, Start/Pause/Complete, employee selection, and **Make Stock Entry**; completion dialog captures completed, pending and process-loss quantity plus end time | `erpnext/manufacturing/doctype/job_card/job_card.js` (`start_job`, `complete_job_card`, `start_timer`, `pause_job`, `job_card_dashboard`) |
| Material Request Plan / Production links | Work Order can be created from Production Plan, Sales Order, Material Request, or MPS; the source fields stay on the form | `erpnext/manufacturing/doctype/work_order/work_order.json` (`production_plan`, `production_plan_item`, `sales_order`, `material_request`, `mps`) |

### Carbon — Job (work order) with method explorer and execution tabs

Carbon's **Job** is the work order. The detail page is a three-pane record: method tree on
the left, route content in the middle, properties on the right. Scheduling fields are
server-owned; planners move dates/priorities, they do not type start times.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Jobs list `/x/production/jobs` | Job ID + item thumbnail, item (readable ID + revision), tracking, status, batches, quantity, customer, sales order, assignee, start/due, deadline type, tags, order/inventory/production/scrap/completed/shipped/received quantities, location | `apps/erp/app/routes/x+/production+/jobs.tsx`, `apps/erp/app/modules/production/ui/Jobs/JobsTable.tsx` |
| Job detail shell `/x/job/:jobId` | Header actions: status change, release, complete/receive, cancel, delete, read-only expedite forecast, audit log. Left `JobBoMExplorer`, right `JobProperties`, middle `RecordOutlet` | `apps/erp/app/routes/x+/job+/$jobId.tsx`, `modules/production/ui/Jobs/JobHeader.tsx` |
| Job details tab `/details` | Make-method tools, notes, **Bill of Process**, **Bill of Material**, purchase-orders card, **Estimates vs Actuals** (time per operation, issued material qty/cost), documents, risk register | `apps/erp/app/routes/x+/job+/$jobId.details.tsx`, `apps/erp/app/modules/production/ui/Jobs/JobEstimatesVsActuals.tsx` |
| Job execution tabs | `/materials` (required, on storage unit, on hand, incoming PO, shortfall), `/operations` (status control, MES deep link, target/complete/scrap/rework), `/quantities` (Production/Scrap/Rework records with scrap reason), `/events` (Setup/Labor/Machine), `/dag` (operation dependency graph), `/make/:makeMethodId` (subassembly method) | `apps/erp/app/routes/x+/job+/$jobId.{materials,operations,quantities,events,dag,make.$methodId}.tsx` |
| Job status | `Draft → Planned → Ready → In Progress → Paused → Completed → Closed → Cancelled`; UI renders `Ready` as **Released**; Completed/Closed/Cancelled are locked | `apps/erp/app/modules/production/production.models.ts` (job status map), `ui/Jobs/JobStatus.tsx` |
| Batches | First-class grouping of job operations: list/detail, batch builder (candidate operations, material-property compatibility, due windows, capacity), release/unrelease/dissolve; member jobs stay independent | `apps/erp/app/routes/x+/production+/batches*.tsx`, `apps/erp/app/modules/production/ui/Batches/*` |

### AureusERP — Odoo-shaped MO with record actions and a read-only overview

| Screen/page | What it is | Key files |
| --- | --- | --- |
| MO form | **General**: product, BoM, quantity, UoM, scheduled start/end, responsible. Tabs **Components** (raw-material moves: from/to, to-consume, quantity, UoM, forecast), **Work Orders** (operation, work center, product, qty remaining/produced, start/end, expected/real duration, status), **By-products**, **Miscellaneous** (operation type, source/finished locations, company) | `plugins/webkul/manufacturing/src/Filament/Clusters/Operations/Resources/ManufacturingOrderResource/Schemas/ManufacturingOrderForm.php` |
| MO actions | **Confirm**, **Plan**, **Unplan**, **Start**, **Done** (consumption-check dialog), **Cancel**, print MO, print labels | `.../Operations/Actions/{ConfirmAction,PlanAction,UnplanAction,StartAction,DoneAction,CancelAction}.php`, `.../Actions/Print/` |
| MO overview | Read-only production dashboard: product/UoM, available/on-hand qty, receipt date, order status, component rows (reserved, available/waiting, receipt, unit/total/real cost), work-order rows with unit cost | `.../ManufacturingOrderResource/Pages/OverviewManufacturingOrder.php` |
| Work Order form | General section (operation, work center, dates, expected duration, product, quantity, lot/serial, parent MO); tabs **Time Tracking** (productivity logs: user, duration, start/end, productivity, loss), **Components**, **Work Instruction**, **Blocked By** | `.../WorkOrderResource/Schemas/WorkOrderForm.php` |
| Transfers | Material-transfer records linked to MOs, with edit/view and move management | `.../TransferResource.php`, `plugins/webkul/manufacturing/src/Filament/Clusters/Operations/Resources/TransferResource/Pages/ManageMoves.php` |

### Dolibarr — MO card plus a dedicated consumption/production screen

| Screen/page | What it is | Key files |
| --- | --- | --- |
| MO list | Reference, BOM, type (Manufacturing / Disassemble), product, quantity, label, warehouse, planned start/end, status (Draft / Validated / In Progress / Produced / Canceled); "late" filter, mass cancel/close, date changes | `htdocs/mrp/mo_list.php`, `htdocs/mrp/class/mo.class.php` |
| MO card | Header and actions **Validate**, **Cancel**, **Clone**, **Delete**, **Close**, **Reopen**; public/private notes, documents, project/category classification | `htdocs/mrp/mo_card.php` |
| Production screen | Two side-by-side tables: **Consumption** (products to consume) and **Production** (products to produce). Columns product, qty, UoM, already consumed/produced, warehouse or workstation, stock (warning when short), batch; per-line action and **split**; global **Consume or produce** and **Consume and produce all** dialogs | `htdocs/mrp/mo_production.php` |
| Production dialog | Source warehouse (or workstation), quantity, lot/batch, cost; posts stock movements and advances the MO to In Progress/Produced | `htdocs/mrp/mo_production.php` (consume/produce action handling) |

### metasfresh

Manufacturing orders are metadata-defined windows; the operational list/detail shell is
the generic document window. Planning candidates are converted to orders and then
scheduled/issued through REST workflows. No custom order form to catalogue.

**BOSS implications.** Odoo is the cleanest record shape: one order header, four line
collections (components, work orders, by-products, misc), a status bar, and smart buttons
for every linked document. ERPNext is the strongest process gate: material transfer and
manufacture are explicit stock postings, and the UI tells the user which one is next.
Carbon's execution tabs (`materials`, `operations`, `quantities`, `events`, `dag`) are the
best decomposition seen for a work-order detail page, and they map onto sub-screens rather
than tabs that fetch everything at once. The minimum workflow the references share is
Confirm → Plan → Start → Issue/Consume → Produce → Close, with backorder/split and scrap as
wizards. Two further needs follow from the evidence: the order recording the BOM and
routing revision it was created from, and every quantity field having a pending/remaining
companion so partial production is first-class.

---

## 5. Shop floor execution

### ERPNext — a dedicated, keyboard-first Shop Floor app

ERPNext has the most complete standalone shop-floor surface in the checkout. It is a
single page with two role-dependent views over the same data: a **manager board** of work
orders and an **operator** view of job cards at a workstation or work order.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Shop Floor page | Kiosk-style page (`hide_sidebar`), full-screen body class, loaded through `frappe.ui.ShopFloor`; route options select workstation/work-order; role view comes from `get_shop_floor_context` (`manager` if allowed, else `operator`) | `erpnext/manufacturing/page/shop_floor/shop_floor.{js,py,json}`; `erpnext/public/js/shop_floor/shop_floor.js` |
| Manager board | Two buckets **Pending / In Progress** and **Completed** with counts; debounced work-order search; **With job cards only** toggle; paginated 20-per-page cards showing item, reference, progress, operation chips, planned date, material status | `erpnext/public/js/shop_floor/shop_floor.js` (`MANAGER_BUCKETS`, `render_shell_controls`, `load_bucket`, `render_board`, `work_order_card`) |
| Work-order detail pane | Drilling into a card opens the work order's job cards in the operator pane; current operation is the first not-completed operation in the routing | `erpnext/public/js/shop_floor/shop_floor.js` (`open_wo`, `compute_state`); `erpnext/manufacturing/page/shop_floor/shop_floor.py` (`get_work_orders`, `_count_work_orders`) |
| Operator view | Workstation/work-order mode; slots for active jobs with **Start / Pause / Resume / End Session / Submit / Make Entry / Transfer**; live timers; summary counts (active, paused, completed); **OEE** panel | `erpnext/public/js/shop_floor/shop_floor.js` (`load_operator`, `render_operator`, `bind_events`), `erpnext/public/js/templates/shop_floor_template.html` |
| Materials panel | Per-job collapsible material list with ready/available/short dots, quantities and **Transfer** action to move materials to WIP | template `mes-materials-*`; `erpnext/public/js/shop_floor/shop_floor.js` (`transfer_materials`) |
| Work instructions panel | Per-job collapsible instructions with description and rich work-instruction HTML | template `mes-instructions-*` |
| End-session dialog | Captures **Qty to Manufacture in this Cycle**, **Completed**, **Pending** and **Process Loss** quantities (they must reconcile), end time, and optional employees; then posts completion | `erpnext/public/js/shop_floor/shop_floor.js` (`end_session`, `prompt_manufacture_entry`, `submit_job_card`, `make_manufacture_entry`) |
| Quality check | Inline **QC Required / QC Available / QC Passed / QC Rejected** pills; dialog runs the inspection and blocks completion when required | `erpnext/public/js/shop_floor/shop_floor.js` (`run_quality_check`, `show_qc_dialog`) |
| Scanner | Scan button/shortcut opens a job-card scanner; scanned cards route to start/resume/complete depending on state | `erpnext/public/js/shop_floor/shop_floor.js` (`open_scanner`, `handle_scanned_job_card`, `route_scanned_action`) |
| Keyboard model | `?` help, `/` search, `r` refresh, `b` scan, `1` / `2` switch buckets, `g m`/`g o` switch manager/operator, arrows/`j k` move focus, Enter activate, `s` start, `p` pause, `e` end session, `t` transfer, `Shift+S` submit | `erpnext/public/js/shop_floor/shop_floor.js` (`bind_keys`, `handle_key`, `show_help`) |

### Carbon MES — a separate operator app with queue, execution and transactions

Carbon goes further: MES is its own React Router app with queue Kanbans, operation/
assembly/inspection execution, material issue, picking, timecard, maintenance and
wall displays.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Operations queue `/x/operations` | Kanban by work center (empty centers included), search and filters (process, work center, customer, assignee, tag, material), display settings; batched operations collapse into one card with member count and summed quantity | `apps/mes/app/routes/x+/operations.tsx`, `apps/mes/app/components/AppSidebar.tsx` |
| Assigned / Active / Recent | Personal queues: assigned operations, live active operations with durations, recently touched | `apps/mes/app/routes/x+/{assigned,active,recent}.tsx` |
| Jobs + DAG `/x/jobs`, `/x/job/:jobId` | Open-job list; job view renders the operation dependency DAG with a status legend | `apps/mes/app/routes/x+/{jobs,job.$jobId}.tsx` |
| Operation view `/x/operation/:operationId` | Primary operator screen. Tabs **Details / Model / Instructions / Chat**; quantity progress, Setup/Labor/Machine meters with Start/Pause; completed/scrapped/due cards; step list; parameters; materials with **Issue Material**; files; serial numbers with Scan/Select; bottom **Log completed** / **Complete batch**; **More actions** for Complete Batch, Scrap, Rework, Mark as Done, Maintenance, Quality Issue | `apps/mes/app/routes/x+/operation.$operationId.tsx`, `components/JobOperation/JobOperation.tsx` |
| Assembly view `/x/assembly/:operationId` | 3D animated build with step rail, reference slides, per-step parts/tools, record modal; Space/Enter fire the step, arrows navigate; completing a step auto-advances and starts labor | `apps/mes/app/routes/x+/assembly.$operationId.tsx`, `components/AssemblyView.tsx` |
| Inspection view `/x/inspection/:operationId` | Sampling plan, inspection document with balloons, gauges, measurements, sample/disposition actions | `apps/mes/app/routes/x+/inspection.$operationId.tsx` + `inspection-lot.$id.*` |
| Picking `/x/picking` | Assigned picking lists grouped into kits; per-line Pick / Short / Scan / Unpick, tracked-lot picker, substitute notice, no-stock warning; Start/Finish list controls | `apps/mes/app/routes/x+/picking*` |
| Material issue `/x/issue` | Tracked/untracked issue flow: serial/batch tabs, scan/select, quantity per lot, expiry policy (`Warn` / `Block` / `BlockWithOverride`), scrap/unconsume/adjustment tabs; FEFO/FIFO auto-seed | `apps/mes/app/routes/x+/{issue,issue-tracked-entity,unconsume,adjustment,event}.tsx`, `components/JobOperation/components/IssueMaterialModal.tsx` |
| Scrap / rework / complete / finish | Quantity-modal transactions: scrap posts a production-quantity row, backflush, tracked-entity terminal status and WIP→scrap journal; complete/rework post non-scrap quantities; finish ends active events; warnings for unissued tracked material, short quantity, missing steps | `apps/mes/app/routes/x+/{scrap,rework,complete,finish}.tsx`, `components/JobOperation/components/QuantityModal.tsx` |
| Timecard | "My Hours" week view with total hours, Clock In/Out, per-entry edit/delete, active badge | `apps/mes/app/routes/x+/timecard.tsx` |
| Maintenance | All / Today / Assigned / Blocking dispatch tabs; dispatch detail with time entries, spare parts, procedure, Complete | `apps/mes/app/routes/x+/maintenance.tsx`, `dispatch.$dispatchId.tsx` |
| Wall displays | Chrome-free `/display/:workCenterId/work` and `/maintenance` boards for work centers | `apps/mes/app/routes/display+/$workCenterId.{work,maintenance}.tsx` |
| Scanning / shortcuts | Global keyboard-wedge accepts MES/ERP URLs; operation/assembly watch the kanban `completedBarcodeOverride`; labels PDF/ZPL; `alt+1…7` queues, Space/Enter primary step, arrows navigate | `apps/mes/app/routes/x+/_layout.tsx`, `apps/mes/app/shortcuts.ts`, `apps/mes/app/utils/path.ts` |

### Odoo — work-order list controls, no community shop-floor app

Odoo Community has no dedicated Shop Floor kiosk (the enterprise app is absent from this
checkout). Execution happens in the **Work Orders** list/form: each row has Start, Pause
and Done buttons and a live timer, and the form has a **Time Tracking** tab.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Work Orders list | Editable list with operation, work center, product, quantity/to produce/produced/remaining, start/end dates, expected/real duration (timer widget), state, planning-conflict icon; buttons **Start** (red when the work center is blocked, green otherwise), **Pause**, **Done** | `odoo/addons/mrp/views/mrp_workorder_views.xml` (`mrp_production_workorder_tree_editable_view`, `mrp_production_workorder_to_plan_list`) |
| Work Order form | Product, parent MO, produced/to-produce quantity, start/end, work center, operation, state; **Time Tracking** tab (user, duration, start/end, productivity loss) for managers; **Components** tab; **Blocked By** tab; conflict/planning-issue banners linking to planning | `odoo/addons/mrp/views/mrp_workorder_views.xml` (`mrp_production_workorder_form_view_inherit`, pages `time_tracking`, `components`, `dependencies`) |
| Work Orders planning board | Kanban grouped by work center with remaining time in red when negative, scheduled date color-coded, last working user avatar and status bubble; list/calendar/pivot/graph also available | `odoo/addons/mrp/views/mrp_workorder_views.xml` (`workcenter_line_kanban`, `action_mrp_workorder_workcenter`) |

### AureusERP — work order with a time-tracking tab, no kiosk

The Work Order form carries a **Time Tracking** tab with productivity logs (user,
duration, start/end, productivity, loss) and a components tab. Execution is record-based;
there is no dedicated operator page or scanner. Useful as the minimal model.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Work Order form / time tracking | Productivity-log repeater and components repeaters inside the Work Order form | `plugins/webkul/manufacturing/src/Filament/Clusters/Operations/Resources/WorkOrderResource/Schemas/WorkOrderForm.php` |
| Manufacturing Order "Done" action | Completion dialog checks consumption issues before posting | `.../Operations/Actions/DoneAction.php` |

### Dolibarr — production screen is the shop-floor UI

No kiosk, scanner or time clock. The operator opens the MO and uses the **Production**
screen: per-line consume/produce actions, global consume/produce-all, warehouse or
workstation selection, quantity and batch fields. Workstation hourly rates feed cost.

### metasfresh — scan-driven mobile manufacturing jobs

The shop floor is the metasfresh **mobile web UI** (a separate React app under
`misc/services/mobile-webui/mobile-webui-frontend/src/`), not the desktop WebUI. A
manufacturing job is a workflow of activities served by REST activity handlers:
raw-material issue, issue-only-what-was-received, issue adjustment, material receipt,
HU QR-code generation/printing, locator validation, scale scanning, work report and
confirmation. The operator picks a job from the generic workflow launcher list
(`containers/wfLaunchersScreen/`) and steps through each activity by scanning. Business
commands live under
`backend/de.metas.manufacturing.rest-api/src/main/java/de/metas/manufacturing/job/service/commands/`.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Raw-material issue workflow | Activity handler for issuing materials to a manufacturing job (including "issue only what was received" and adjustments) | `backend/de.metas.manufacturing.rest-api/src/main/java/de/metas/manufacturing/workflows_api/activity_handlers/issue/RawMaterialsIssueActivityHandler.java`, `.../issue/RawMaterialsIssueAdjustmentActivityHandler.java` |
| Goods receipt / work report / confirmation | Receive finished goods, report work, confirm activity; HU QR generation and printing; scale/locator validation | `backend/de.metas.manufacturing.rest-api/src/main/java/de/metas/manufacturing/workflows_api/activity_handlers/receive/MaterialReceiptActivityHandler.java`, `.../work_report/WorkReportActivityHandler.java`, `.../confirmation/ConfirmationActivityHandler.java`, `.../generateHUQRCodes/`, `.../printReceivedHUQRCodes/` |
| Raw-material issue screens | Activity → line (product, **qty to issue target / remaining / issued**, scan QR) → step → scan screen; emptying-confirmation prompt when the scanned HU is used up | `misc/services/mobile-webui/mobile-webui-frontend/src/containers/activities/manufacturing/issue/{RawMaterialIssueActivity,RawMaterialIssueLineScreen,RawMaterialIssueStepScreen,RawMaterialIssueLineScanScreen}.jsx`, `step_scan/` |
| Issue adjustment screens | Correct an issued quantity by scanning the HU again | `misc/services/mobile-webui/mobile-webui-frontend/src/containers/activities/manufacturing/issue_adjustment/` |
| Material receipt screens | Line shows **qty to receive target / to receive / received**; **Receive target** picks an existing LU or a **new HU**; scan screen; pick-quantity button | `misc/services/mobile-webui/mobile-webui-frontend/src/containers/activities/manufacturing/receipt/{MaterialReceiptLineScreen,ReceiptReceiveTargetScreen,ReceiptNewHUScreen,ManufacturingReceiptScanScreen}.jsx` |
| Workstation / workplace assignment | Operator scans a workstation QR code (or picks a workplace) to bind the device session to it | `misc/services/mobile-webui/mobile-webui-frontend/src/apps/{workstationManager,workplaceManager}/` |

**BOSS implications.** In every reference with one, the shop floor is a different surface
from the planner's screens, not a tab on the work-order form. ERPNext shows the minimum:
queue board + operator card with Start/Pause/End, live timer, material panel with a transfer
action, instructions, quantity reconciliation (completed + pending + process loss), and a
scanner. Carbon shows the next tier: operation DAG, per-unit tracking, assembly and
inspection execution, material-issue modal, wall displays, and a keyboard-wedge that
accepts scanned URLs. The ERPNext-shaped kiosk (one screen, two views, keyboard + scanner,
large touch targets) is the smaller of the two, and Carbon's operation-DAG and issue-modal
patterns layer onto it. metasfresh shows the same issue and receipt steps can run on a
phone as scan-per-line screens with target / remaining / issued quantities. In ERPNext and
Carbon, quantity reconciliation and material availability are visible before the operator
starts, and each action posts on the server and returns the updated state rather than
changing rows client-side. The issue and receipt dialogs are the **Material issue /
receipt** screens (reused: Warehouse) as Manufacturing includes them, opened from the
work order and the kiosk with the run as context and posting through
`mantle.product.AssetServices.issue#AssetToWorkEffort` and `receive#Asset`, as the
baseline run screens already do; the same screen and services serve both apps.

---

## 6. Planning & MRP

### ERPNext — Production Plan, MPS, forecast, MRP report and a visualizer

ERPNext has the broadest planning surface: a demand document (Production Plan), a master
schedule (MPS), sales forecasts, a bucket-view MRP report, and a Gantt-like visualizer.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Production Plan form | **Get Items From** Sales Order or Material Request; filters item/customer/warehouse/project/date; **Get Sales Orders**, **Get Finished Goods**; **Assembly Items** table (planned/ordered/produced/pending qty, planned start/end, BOM, warehouse); **Raw Materials** table (required/qty, ordered, projected); sub-assembly tables; **Get Items for Purchase Only**, **Get Items for Purchase / Transfer**, **Get Sub Assembly Items**; options include safety stock, projected qty, minimum order qty, reserve stock, shifts | `erpnext/manufacturing/doctype/production_plan/production_plan.json`, `production_plan.js` |
| Production Plan status | Draft → Submitted → Not Started → In Process → Completed / Closed / Cancelled / Material Requested | `erpnext/manufacturing/doctype/production_plan/production_plan.json` |
| Production Plan Visualizer | Page that picks one plan and renders a **Finished Goods** pane plus a timeline grouped **By Workstation** or by supplier, with schedule blocks, status badges, progress and detail; backed by `Production Plan Schedule` rows (row type, planned row, operation, workstation, supplier, from/to, duration) | `erpnext/manufacturing/page/production_plan_visualizer/production_plan_visualizer.js`; `.../doctype/production_plan_schedule/` |
| Master Production Schedule | Items table with item, warehouse, delivery date, planned qty, **order release date**, BOM, cumulative lead time; **Get Actual Demand** (sales orders) and **Get Forecast Demand**; demand tabs for sales orders and material requests | `erpnext/manufacturing/doctype/master_production_schedule/master_production_schedule.json`, `erpnext/manufacturing/doctype/master_production_schedule_item/` |
| Sales Forecast | Item/UoM/delivery date/demand qty/warehouse rows feeding forecast demand | `erpnext/manufacturing/doctype/sales_forecast/`, `erpnext/manufacturing/doctype/sales_forecast_item/` |
| Material Requirements Planning Report | Bucketed report (daily/weekly) with filters including MPS, type of material, warehouse, from/to date; columns cover projected qty, actual/planned orders, shortfall; optional chart | `erpnext/manufacturing/report/material_requirements_planning_report/material_requirements_planning_report.{py,js}` |
| Production Planning Report / Summary | Additional planning reports linked from the workspace | `erpnext/manufacturing/report/production_planning_report/`, `erpnext/manufacturing/report/production_plan_summary/` |

### Carbon — MRP planning grid and a finite scheduler

Carbon separates **MRP** (what to make/buy) from **finite scheduling** (when/where it
runs). Both engines are server-only; the UI exposes the resulting actions and boards.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Material Planning `/x/production/planning` | Item × week grid over 48 periods. Row action **Make N** opens the order drawer; bulk **Create Jobs** and **Apply Suggested Changes**; location picker and **Recalculate** (MRP). Grid shows time fence, first negative date, latest order date, on-hand and planning actions | `apps/erp/app/routes/x+/production+/planning.tsx`, `modules/production/ui/Planning/ProductionPlanningTable.tsx`, `apps/erp/app/modules/production/ui/Planning/planningColumns.tsx` |
| Planning order drawer | Planning-policy summary and editable time fence; **Suggested Jobs** (quantity + Start By) from open Make actions; **Open Jobs** change actions; **Plan** a Draft job or **Make** a new one; "N More After <fence>" | `apps/erp/app/modules/production/ui/Planning/ProductionPlanningOrderDrawer.tsx`, `apps/erp/app/modules/production/ui/Planning/PlanningDrawerParts.tsx`, `PlanningActionLines.tsx` |
| Demand Forecasts `/x/production/demand-forecasts` | 52-week demand per item/location, editable weekly columns with summary chart and quarter grouping; behind a hosted-plan gate (`usePlanGate({ feature: "FORECAST" })` shows an upgrade overlay) | `apps/erp/app/routes/x+/production+/demand-forecasts.tsx`, `apps/erp/app/modules/production/ui/DemandProjection/*` |
| Forecast (Gantt) `/x/scheduling/forecast` | Resource timeline of capacity reservations per work center; Day/Week/Shift, Compact/Detailed, non-working shading, maintenance downtime, empty lanes for every work center; **Regenerate** runs the scheduler; same `FORECAST` plan gate as Demand Forecasts (code is in the checkout) | `apps/erp/app/routes/x+/scheduling+/forecast.tsx`, `apps/erp/app/modules/production/ui/Schedule/{ForecastHeader,TimelineDetail}.tsx`, `resourceTimeline.ts`, `packages/planning/src/scheduling/` |
| Priorities — job dates `/x/priority/dates` | Job cards across date columns (week/month) plus **unscheduled / next-week / next-month** sentinels; drag to set/reschedule | `apps/erp/app/routes/x+/priority+/dates.tsx`, `apps/erp/app/modules/production/ui/Schedule/Kanban/DateKanban.tsx` |
| Priorities — operations `/x/priority/operations` | Operation cards across work-center columns; drag reassigns work center and priority; batch cards move as a unit | `apps/erp/app/routes/x+/priority+/operations.tsx`, `apps/erp/app/modules/production/ui/Schedule/Kanban/Kanban.tsx` |
| Resource Planning | People board (people × work centers, drag assignment, absences, overtime/time off), matrix, and capacity table with Scheduled/Available/Load/Due series | `apps/erp/app/routes/x+/priority+/people.tsx`, `apps/erp/app/modules/production/ui/Schedule/People/*` |
| Outbound `/x/scheduling/outbound` | Sales-order jobs projected to complete, with promised vs completion lateness and progress | `apps/erp/app/routes/x+/scheduling+/outbound.tsx` |
| Engines | `runMrp` (72-week horizon, BOM explosion, netting, forecast consumption, supply dates, planning actions) and `runLocationSchedule` (deterministic forward-ASAP finite scheduler; availability ladder lights-out → work-center shifts → location shifts → Mon–Fri 8 h) | `packages/planning/src/mrp/mrp.ts`, `planning-actions.ts`, `scheduling/run-schedule.ts`, `packages/planning/src/scheduling/machine-availability.ts`, `slot-allocator.ts` |

### Dolibarr — BOM net needs is the whole MRP story

No MRP run, no master schedule, no capacity board. **BOM Net Needs** explodes the BOM
against stock and marks shortages; the MO list's planned dates and "late" filter are the
rest of the planning UI.

### Odoo — no MRP engine in community; planning is reordering + the work-order board

Odoo's **Planning** menu is effectively empty in this checkout (only a hidden scheduler
cron is attached); master production scheduling is an enterprise add-on. Planning in
practice is:

- Inventory → Operations → **Replenishment** (orderpoints, with an optional BOM column),
  driven by stock rules; a BOM can be attached to an orderpoint.
- The **Work Orders** planning board (kanban grouped by work center) and its
  **has_conflicts** / **has_planning_issues** indicators, plus **Plan/Unplan** on the MO
  and work-order rows.
- MO list filters for late/today and the rescheduling popover.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Replenishment / orderpoints | Editable list with an optional BOM column, forecast warning links, snooze; the orderpoint is the only "what to make" trigger | `odoo/addons/stock/views/stock_orderpoint_views.xml`, `mrp/views/stock_orderpoint_views.xml` |
| Work-order planning indicators | `has_conflicts` (overlapping work orders in a work center) and `has_planning_issues` (planned before a blocking work order) with link to the planning board; `remaining_time` | `odoo/addons/mrp/models/mrp_workorder.py`, `mrp/views/mrp_workorder_views.xml` |
| MRP cron | Hidden server action; no user-facing MRP screen | `odoo/addons/mrp/views/stock_move_views.xml` (`menu_procurement_compute_mrp`, `groups="base.group_no_one"`) |

### AureusERP — no planning module, only lead-time settings

AureusERP ships no MRP, MPS or scheduling screens. The only planning surface is the
settings page **Manage Planning** (manufacturing lead time) and per-BOM lead-time fields.
The MO list and work-order list are the queues. Treat it as an execution-only reference.

### metasfresh — PP Order Candidate as the planning worklist

Planning is candidate-driven: MRP produces `PP_Order_Candidate` rows, the planner edits
start date and workstation, then converts candidates to manufacturing orders. The header
aggregates selected candidates (resource count, qty to process, qty processed).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PP Order Candidate window | Candidate list with aggregated selection header; process actions **Set Start Date**, **Set Workstation** | `frontend/src/components/ppOrderCandidate/PPOrderCandidateViewHeader.js`, `backend/de.metas.manufacturing.webui/src/main/java/de/metas/manufacturing/webui/process/PP_Order_Candidate_SetStartDate.java`, `backend/de.metas.manufacturing.webui/src/main/java/de/metas/manufacturing/webui/process/PP_Order_Candidate_SetWorkstation.java` |
| Manufacturing mobile/workflow | Job creation/issue/receive commands used by the mobile workflows | `backend/de.metas.manufacturing.rest-api/src/main/java/de/metas/manufacturing/job/service/commands/{create_job,issue,issue_what_was_received,receive}/` |

**BOSS implications.** The references separate two screens: **MRP** answers "what do we
need, and by when" (Carbon's planning grid, ERPNext's Production Plan/MPS, metasfresh's
candidate list), while **scheduling** answers "which work center and when" (Carbon's
Gantt/kanban and Odoo's work-order board). The ERPNext/metasfresh shape is the simpler
planning candidate: a worklist of suggested make/buy actions with a time fence, age,
required date and a single **Create work order** action, with a work-center timeline as a
separate screen. A full finite scheduler is server-side work in every reference that has
one (Carbon). Dolibarr's net-needs explosion is the smallest useful planning view and is
cheap on Moqui; Odoo Community shows the cost of having none, since its users get no MRP
screen at all.

---

## 7. Subcontracting

### Odoo — BOM type `subcontract`, simplified MO, portal

Installing `mrp_subcontracting` adds a third BoM type, **Subcontract**, with one or more
subcontractors on the BoM. The resulting manufacturing order is deliberately reduced: no
operations, by-products or miscellaneous tab; it records component transfers to the
subcontractor and receipt of the finished product.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Subcontract BoM | BoM form gains `subcontractor_ids` (required when type = subcontract); operations/readiness hidden | `odoo/addons/mrp_subcontracting/views/mrp_bom_views.xml` |
| Subcontract MO form | Reduced form: status bar Draft → Confirmed → Done; smart buttons only Transfers and Overview; raw components shown as move lines; no work orders/by-products/misc | `odoo/addons/mrp_subcontracting/views/mrp_production_views.xml` (`mrp_production_subcontracting_form_view`) |
| Subcontracting portal | Customer-facing **My Productions** list and subcontracting view for portal users | `odoo/addons/mrp_subcontracting/views/subcontracting_portal_templates.xml`, `subcontracting_portal_views.xml` |
| Subcontractor partner/product setup | Subcontractor flag on partner, subcontracting supplier info on products | `odoo/addons/mrp_subcontracting/views/res_partner_views.xml`, `supplier_info_views.xml` |

### ERPNext — two directions: subcontracting out and inward processing

ERPNext separates buying a subcontract service (Subcontracting Order/Receipt) from doing
work on a customer's material (Subcontracting Inward Order).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Subcontracting Order | Purchase-order-like document: supplier, supplier warehouse, PO link, items, **service items**, **supplied items**, reserve stock, status/per-received, additional costs, project | `erpnext/subcontracting/doctype/subcontracting_order/subcontracting_order.json` |
| Subcontracting Receipt | Receipt of finished goods with accepted/rejected warehouse, items, **supplied items**, status, return fields | `erpnext/subcontracting/doctype/subcontracting_receipt/subcontracting_receipt.json` |
| Subcontracting Inward Order | Customer-owned material processing: customer, items, service items, received items, per-delivered/per-produced/per-process-loss/per-raw-material-returned, delivery warehouse | `erpnext/subcontracting/doctype/subcontracting_inward_order/subcontracting_inward_order.json` |
| Job Card / Work Order links | Job Card has `is_subcontracted` and subcontracting fields; Work Order action **Make Subcontracting PO** | `erpnext/manufacturing/doctype/job_card/job_card.json`; `manufacturing/doctype/work_order/work_order.js` |
| Material transfer | Subcontracting stock entries move supplied components to the supplier warehouse | `erpnext/subcontracting/doctype/subcontracting_order/`, stock entry mapping in `subcontracting/` |

### Carbon — Outside Processing is an operation type

Carbon models subcontracting as an operation, not a document type: `Outside Processing`
operations carry supplier, minimum cost, unit cost and lead time, and are mixed freely
with in-house operations in the Bill of Process. This is the simplest integration with
routing, scheduling and costing.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bill of Process — Outside Processing | Operation type `Outside Processing`; supplier + minimum/unit cost + lead time fields; switching an operation in/out of outside processing changes the form | `apps/erp/app/modules/items/ui/Item/BillOfProcess.tsx`, `apps/erp/app/modules/shared/shared.models.ts` (operation type enum) |

**BOSS implications.** The references model subcontracting as an operation with a
supplier (Carbon) or a BoM type (Odoo), not as a separate order app. The screens they need
are a supplier-assigned operation on the routing, a component-transfer document to the
supplier, and a finished-goods receipt with accepted/rejected quantities. ERPNext's inward
order is a different business (customer-owned material) and a separate document there.
Subcontracting depends on the in-house order lifecycle (routing operations, issue and
receipt) being in place.

---

## 8. Quality, downtime & scrap

### ERPNext — Quality Inspection is a first-class document wired into Job Cards

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quality Inspection form | Inspection type **Incoming / Outgoing / In Process**; reference type/name (Purchase Receipt, Purchase Invoice, Subcontracting Receipt, Delivery Note, Sales Invoice, Stock Entry, **Job Card**), item, serial/batch, sample size, inspection template, readings, status **Accepted / Rejected / Cancelled**, inspected/verified by, manual-inspection flag, remarks. It lives in the Stock module, not Manufacturing | `erpnext/stock/doctype/quality_inspection/quality_inspection.json` |
| Quality Inspection Template | Named checklist of readings/parameters reused by inspections | `erpnext/stock/doctype/quality_inspection_template/` |
| Job Card QC | `quality_inspection` link, `quality_inspection_template`, `quality_inspection_required` on BOM operation; Job Card blocks completion until inspection passes when required | `erpnext/manufacturing/doctype/job_card/job_card.json`, `erpnext/manufacturing/doctype/bom_operation/bom_operation.json`; Shop Floor QC pills in `public/js/shop_floor/shop_floor.js` |
| Non-conformance / quality management | Separate module: Non Conformance, Quality Action (+ resolutions), Quality Review (+ objectives), Quality Feedback (+ template/parameters), Quality Goal, Quality Meeting (+ agenda/minutes), Quality Procedure (+ processes) | `erpnext/quality_management/doctype/` |
| Quality reports | **Quality Inspection Summary** and **Cost of Poor Quality** reports linked from the Manufacturing workspace | `erpnext/manufacturing/report/quality_inspection_summary/`, `cost_of_poor_quality_report/` |
| Downtime Entry | Workstation/operation downtime with reason, from/to; feeds **Downtime Analysis** report and the Visual Plant Floor status | `erpnext/manufacturing/doctype/downtime_entry/downtime_entry.json`; `manufacturing/report/downtime_analysis/` |
| Process loss / scrap | Process loss quantity on Job Card, Work Order and Production Plan; **Process Loss Report**; scrap warehouse on Work Order | `erpnext/manufacturing/doctype/job_card/job_card.json`, `erpnext/manufacturing/doctype/work_order/work_order.json`, `manufacturing/report/process_loss_report/` |

### Carbon — full quality module plus MES inspection execution

Carbon's quality module is the widest in the checkout and is linked to items, lots and
production operations.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inspections `/x/quality/inspections`, `/x/inspection/:id` | Inspection list and execution: sample, measurement, gauge, document, accept/reject/partial; readings against an inspection document; status **Pending / In Progress / Passed / Failed / Partial** | `apps/erp/app/routes/x+/quality+/inspections.tsx`, `x+/inspection+/$id*.tsx`; `modules/quality/ui/Inspections/*` |
| Inspection plans | Plan per item/operation defining characteristics, sample size and gauges | `apps/erp/app/routes/x+/quality+/inspection-plans.tsx`, `inspection-plans.new.tsx` |
| Inbound inspections | Receiving-side inspection queue and detail | `apps/erp/app/routes/x+/quality+/inbound-inspections.tsx`, `inbound-inspections.$id.tsx` |
| Item/tool/material quality views | Quality tab on part/material/tool/service records (inspection plans, documents, history) | `apps/erp/app/routes/x+/part+/$itemId.quality.tsx`, `material+/$itemId.quality.tsx`, `tool+/$itemId.quality.tsx`, `service+/$itemId.quality.tsx` |
| Gauges and calibrations | Gauge master, gauge types, calibration records with status | `apps/erp/app/routes/x+/quality+/{gauges,gauge-types,calibrations}*` |
| Issues / issue types / workflows / required actions / risks | Quality issue tracking, issue-type config, workflow, corrective actions, risk register | `apps/erp/app/routes/x+/quality+/{issues,issue-types,issue-workflows,required-actions,risks}*`; `modules/quality/ui/*` |
| Quality documents / inspection documents | Controlled documents and drawing/balloon inspection documents | `apps/erp/app/routes/x+/quality-document+`, `x+/inspection-document+`; `modules/quality/ui/{Documents,InspectionDocument}/*` |
| MES inspection execution | Operator-side inspection route; sample/measurement/gauge/disposition/complete-passed steps | `apps/mes/app/routes/x+/inspection.$operationId.tsx`, `inspection-lot.$id.{sample,measurement,gauge,disposition,complete-passed}.tsx` |
| Scrap / rework from the floor | Scrap reasons config; operation **More actions → Scrap / Rework / Quality Issue**; scrap quantity and reason on production-quantity rows | `apps/erp/app/routes/x+/production+/scrap-reasons*`; `apps/mes/app/components/JobOperation/components/{QuantityModal,ScrapTab,ScrapEntityModal,ReworkModal}.tsx` |

### Odoo — only scrap and OEE loss reasons; no quality module

No `quality*` addon is present in this community checkout. The available controls are:

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Scrap | Stock scrap action registered under Manufacturing → Operations; scrap moves counted on the MO smart button | `odoo/addons/mrp/views/stock_move_views.xml`, `mrp_production_views.xml` (`action_see_move_scrap`) |
| Productivity loss / OEE | Work-center productivity-loss records (productive, blocked, performance) feed OEE reports and the lost-time smart button | `odoo/addons/mrp/models/mrp_workcenter.py`, `mrp/views/mrp_workcenter_views.xml` |

### AureusERP, Dolibarr, metasfresh

No production quality-inspection or downtime screens. AureusERP has no quality cluster in
the manufacturing plugin; Dolibarr relies on generic notes/documents; metasfresh's
manufacturing mobile workflows have no inspection activity in this checkout.

**BOSS implications.** Both full references keep the inspection record outside
production: ERPNext's Quality Inspection is a Stock document referenced from receipts,
deliveries, stock entries and Job Cards; Carbon's inspections and inspection plans live
in its Quality module and are reached from the operation. In BOSS terms (crosscut §4) the
inspection is one **Quality inspection** screen and record (reused: Warehouse,
Purchasing), and the Manufacturing version is the **in-process and final inspection
gates**: an operation (or the BOM/routing) marked "inspection required" with a template,
the QC state shown on the job on the shop floor (ERPNext's QC Required / QC Available / QC
Passed / QC Rejected pills), the inspection screen opened from the operation, and the
operation or the finished-goods receipt held until the required inspection is accepted.
Non-conformance and corrective action are a further quality function (crosscut §8). In
ERPNext and Carbon, scrap and process loss sit on the quantity dialog, not a separate app:
scrap quantity, reason, disposition (scrap/rework), and a backflush-aware stock posting.
Downtime carries a reason code and from/to interval because it feeds OEE; Odoo's
productivity-loss model is the minimum seen. Equipment downtime is a record on the
**Facility & equipment record** (reused: Maintenance, Warehouse, Commons, Accounting);
the Manufacturing version lets shop-floor users report downtime and request maintenance
from the operation and shows offline windows to scheduling and OEE. Full gauge
calibration and risk registers are Carbon-only.

---

## 9. Costing & variance

| App | Screen | What it shows | Key files |
| --- | --- | --- | --- |
| Odoo | BoM Structure & Cost | Multi-level component costs, by-product cost, BOM total and per-unit cost in the BOM currency | `odoo/addons/mrp/report/mrp_report_bom_structure.{xml,py}` |
| Odoo | MO Overview | Unit cost and MO cost, split into component cost and operation cost; cost breakdown per component/operation when the MO is done | `odoo/addons/mrp/report/mrp_report_mo_overview.{xml,py}` |
| Odoo | Work center | `costs_hour` and time efficiency feed operation cost; OEE/productivity losses explain lost time | `odoo/addons/mrp/models/mrp_workcenter.py`, `mrp/views/mrp_workcenter_views.xml` |
| Odoo | Valuation | `mrp_account` posts manufacturing valuation entries; no user-facing cost screen in this module | `odoo/addons/mrp_account/` |
| ERPNext | BOM **Costing** tab | Operating cost, raw-material cost, total/base totals, project; rate basis (valuation/last purchase/price list) | `erpnext/manufacturing/doctype/bom/bom.json` |
| ERPNext | Work Order cost fields | Planned/actual/additional/total operating cost; consumed material cost; finished-goods valuation | `erpnext/manufacturing/doctype/work_order/work_order.json`, `erpnext/manufacturing/doctype/work_order/work_order.js` (`calculate_total_cost`) |
| ERPNext | BOM Variance / Process Loss reports | Planned vs actual BOM cost and quantity loss | `erpnext/manufacturing/report/bom_variance_report/`, `process_loss_report/` |
| Carbon | Job **Estimates vs Actuals** | Estimated vs actual time per operation, estimated vs issued material quantity and cost | `apps/erp/app/modules/production/ui/Jobs/JobEstimatesVsActuals.tsx` |
| Carbon | Work center rates | Labor, machine, overhead rates and capital-cost/depreciation table | `apps/erp/app/modules/resources/ui/WorkCenters/WorkCenterForm.tsx` |
| Dolibarr | BOM card / MO production | BOM `calculateCosts()` unit cost; MO line cost from workstation hourly rates; optional cost columns in the production table | `htdocs/bom/class/bom.class.php`, `htdocs/mrp/mo_production.php` |
| AureusERP | MO Overview | Component unit/total/real cost and work-order unit cost | `.../Pages/OverviewManufacturingOrder.php` |
| metasfresh | No cost UI in this checkout | Costing is backend/accounting; not a planning screen | — |

**BOSS implications.** The references show cost where decisions happen: a BOM cost
roll-up on the BOM overview, and a work-order cost panel split into material vs operation.
Odoo's two-report split (BOM structure cost vs MO overview) is the clearest. Odoo keeps
valuation posting in `mrp_account` and metasfresh in its accounting backend; one option is
valuation posting in Accounting with only estimates and actuals in Manufacturing, where a
variance column is the smallest useful view.

---

## 10. Reports & analytics

| App | Reports / analytics surface | Key files |
| --- | --- | --- |
| ERPNext | 21 manufacturing report definitions: Production Analytics, Work Order Summary, Open/In Progress/Completed, Work Order Consumed Materials, Work Order Stock, Issued Items, Job Card Summary, Downtime Analysis, Process Loss, Cost of Poor Quality, Quality Inspection Summary, Production Planning, Production Plan Summary, MRP, Exponential Smoothing Forecasting, BOM Explorer/Stock Analysis/Variance/Operations Time, plus dashboards | `erpnext/manufacturing/report/`, `workspace/manufacturing/manufacturing.json` |
| Odoo | Pivot/graph views over MOs and work orders; **BoM Overview**; **MO Overview**; **Workcenter Load** pivot/graph; OEE pie/form/list/graph/pivot; traceability; lots/serials | `odoo/addons/mrp/views/mrp_production_views.xml`, `mrp_workorder_views.xml`, `mrp_workcenter_views.xml`, `mrp/report/` |
| Carbon | Production dashboard with **Work Center Utilization**, **Estimates vs Actuals**, **Completion Time** KPIs (week/month/quarter/year) and CSV export; capacity Load/Due series; OEE machine-time review (Enterprise-edition `.ee` files under `apps/erp/app/modules/production/ui/MachineTime/`, plan-gated route `/x/production/machine-time`) | `apps/erp/app/routes/x+/production+/_index.tsx`, `apps/erp/app/modules/production/production.models.ts` (`KPIs`), `ui/Schedule/People/PeopleCapacity.tsx`, `ui/MachineTime/*` |
| AureusERP | No report pages; the MO Overview page is the only analytical surface. Lists support column selection/grouping/filters. | `.../Pages/OverviewManufacturingOrder.php`, `plugins/webkul/manufacturing/src/Filament/Clusters/Operations/Resources/ManufacturingOrderResource/Tables/ManufacturingOrdersTable.php` |
| Dolibarr | No manufacturing report pages; list exports, status filters, BOM net needs and cost cards | `htdocs/mrp/mo_list.php`, `htdocs/bom/bom_net_needs.php` |
| metasfresh | Candidate header aggregates only (resources, qty to process, qty processed); reporting is generic/backend | `frontend/src/components/ppOrderCandidate/PPOrderCandidateViewHeader.js` |

**BOSS implications.** ERPNext's report taxonomy is a ready naming scheme, and most of
its reports are saved finds over the same entities. Five recur across the references:
open/late work orders, work-order material status, operation load by work center, OEE/lost
time, and scrap/process loss. Carbon's dashboard KPIs are landing-page material. Since
these are finds over the same records, one option is normal Moqui find screens with saved
parameters rather than a separate report engine.

---

## 11. Configuration & settings

| App | Screen | Contents | Key files |
| --- | --- | --- | --- |
| Odoo | Manufacturing Settings | **Work Orders** (routings group), subcontracting module, barcode module, **Quality Control** module + worksheet, unlocked quantity edits, by-products group, MPS module | `odoo/addons/mrp/views/res_config_settings_views.xml` |
| Odoo | Work Centers / Operations | Capacity, efficiency, OEE target, cost/hour, calendars, alternatives; operation time modes | `odoo/addons/mrp/views/mrp_views_menus.xml` (`menu_mrp_configuration`), `mrp_workcenter_views.xml`, `mrp_routing_views.xml` |
| ERPNext | Manufacturing Settings | Overtime/holiday production, capacity planning days, minutes between operations, overproduction % (sales order/work order), backflush basis, material consumption, auto-update BOM costs, disable capacity planning, serial/batch from work order, corrective operation cost, job-card excess transfer, RM cost from consumption, component quantity validation, enforce time logs, extra material %, edit items/quantities in WO, alternative finished goods, sub-assembly cost | `erpnext/manufacturing/doctype/manufacturing_settings/manufacturing_settings.json` |
| ERPNext | Masters | Operation, Routing, Workstation, Workstation Type, Plant Floor, BOM Update Tool | `erpnext/manufacturing/doctype/{operation,routing,workstation,workstation_type,plant_floor,bom_update_tool}/` |
| Carbon | Configure | Scrap Reasons; work centers and processes under Resources | `apps/erp/app/modules/production/ui/useProductionSubmodules.tsx`, `routes/x+/resources+/{work-centers,processes}*` |
| AureusERP | Configurations + Settings | Operation and Work Center resources; **Manage Operations**, **Manage Planning** (manufacturing lead time), **Manage Operations** settings page | `plugins/webkul/manufacturing/src/Filament/Clusters/{Configurations,Settings}/` |
| Dolibarr | Module setup | Enable MRP/BOM/Workstation modules, numbering models, extrafields, default warehouses | `htdocs/core/modules/{mrp,bom,workstation}/`, `htdocs/admin/` |
| metasfresh | Metadata windows | Work centers/resources, BOM/order windows, planning candidate processes | `backend/de.metas.manufacturing*`, `frontend/src/components/window/` |

**BOSS implications.** The settings the references share are few and explicit: enable
operations/work centers, default backflush/consumption policy, overproduction tolerance,
auto-update BOM cost, capacity planning horizon, and time-log enforcement. Odoo, ERPNext,
Carbon and AureusERP keep manufacturing master data (operation catalogue, scrap reasons)
in the app's own configuration area, not in system administration; they are operational
settings, which suggests the same for the Manufacturing settings section. Work
centers can be listed there too, with the record itself being the **Facility & equipment
record** (reused: Maintenance, Warehouse, Commons, Accounting) as Manufacturing includes
it.

---

## 12. Cross-app surfaces

| Reused screen or link | Use in Manufacturing | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Product 360** | BOM tab: components with quantity, scrap factor and consuming operation; routing/operations; by-products; exploded view and cost roll-up; **where-used**; open work orders for the product | Products (master data, variants, prices, costs); Commerce; Purchasing; Warehouse; Accounting; Sales | Odoo product stat buttons **Bill of Materials**, **Used In** and manufactured quantity over 365 days (`odoo/addons/mrp/views/product_views.xml`); AureusERP Product → **Bills of Materials** tab (`.../ProductResource/Pages/ManageBillsOfMaterials.php`); Carbon item make-method page (`apps/erp/app/routes/x+/part+/$itemId.make.$makeMethodId.tsx`) |
| **Inventory availability** | Component availability on the work order, the kiosk materials panel and the planning worklist; shortfall per component; reservation for a released work order | Warehouse (full stock by facility, location, lot); Customer Service; Purchasing; Sales; Commerce | Odoo MO **components availability** column; Carbon job `/materials` shortfall (`apps/erp/app/routes/x+/job+/$jobId.materials.tsx`); ERPNext Shop Floor materials dots; Dolibarr production screen stock warning |
| **Material issue / receipt** | Issue components to the run, return unused, receive finished goods and by-products, move to and from WIP; opened from the work order and the kiosk with the run as context, posting through `issue#AssetToWorkEffort` / `receive#Asset` | Warehouse (receiving, issue and stock moves) | Carbon MES material issue (`apps/mes/app/routes/x+/issue.tsx`); ERPNext Material Transfer for Manufacture / Manufacture stock entries (`work_order.js`); metasfresh mobile issue/receipt screens; Dolibarr consumption/production tables (`mo_production.php`) |
| **Quality inspection** | In-process and final inspection gates: operation or BOM marked inspection-required with a template; QC state on the job; inspection opened from the operation; operation or finished-goods receipt held until accepted | Warehouse (receiving and returns inspection, templates); Purchasing (supplier quality score) | ERPNext Job Card `quality_inspection` + Shop Floor QC pills; Carbon MES inspection execution (`apps/mes/app/routes/x+/inspection.$operationId.tsx`) |
| **Facility & equipment record** | Work centers (Production Line facilities) with capacity, calendar and cost rates; production equipment on runs; offline windows read by scheduling; downtime reports and maintenance requests raised from the floor | Maintenance (equipment register, maintenance history, downtime); Warehouse (storage locations); Commons (booking); Accounting (fixed-asset books) | Carbon work-center master + MES maintenance + `takesWorkCenterOffline` in scheduled maintenance (`apps/erp/app/routes/x+/resources+/scheduled-maintenance.new.tsx`); ERPNext Workstation status and Downtime Entry; Odoo work-center productivity loss |
| **Order detail** | Sales order line creates or links a work order (make to order) and its promise date drives priority; subcontract purchase order from an outside-processing operation | Sales; Purchasing; Customer Service; Warehouse; Accounting; Commerce | ERPNext Work Order `sales_order` and **Make Subcontracting PO**; Carbon jobs list customer / sales order and **Outbound** screen; Odoo MO `origin` |
| **Purchase requirement** (link) | MRP worklist "buy" suggestions become `Requirement` rows that Purchasing turns into POs | Purchasing (requirements to POs) | ERPNext Production Plan **Get Items for Purchase Only** / Material Request; Carbon planning actions; Odoo orderpoints |
| **Supplier 360** | Subcontractors and outside-processing suppliers with cost and lead time | Purchasing; Accounting; Products; Warehouse | Carbon Outside Processing operation (supplier, minimum/unit cost, lead time); Odoo `subcontractor_ids` on the BoM |
| **Time entry & timesheets** | Operator time per operation (start/pause/end), piece counts, labour cost; the same entries appear in timesheets | Projects (entry, approval); People (attendance, pay hours); Accounting (billing) | ERPNext Job Card Time Logs (employee); Carbon MES timecard and Setup/Labor/Machine events; Odoo work-order time tracking |
| **Accounting** (link) | WIP and finished-goods valuation from issue and receipt postings; estimate vs actual and variance shown read-only in Manufacturing | Accounting (valuation and posting) | Odoo `mrp_account`; ERPNext stock entries and BOM Variance report; Carbon Estimates vs Actuals |
| **Chatter & activities** | Notes, files and activities on work orders, BOMs and work centers | Every app (one component on record screens; Commons and Comms) | Odoo chatter on BoM/MO/work center; Carbon job notes/documents; baseline run notes (`WorkEffortNote`) |
| **Dashboard widgets** | OEE, utilization, completion time, scrap rate, on-time completion, WIP value as widgets on the Manufacturing landing page | Insights (dashboards, cross-app KPIs); every app's landing page | Carbon production dashboard KPIs; Odoo OEE / work-center load; ERPNext workspace chart and number cards |

**BOSS implications.** The screens particular to Manufacturing in the references are work
orders, the shop floor and planning. The rest of what a production user touches is reused
screens that Manufacturing includes with a production context: the Product 360 BOM tab,
Inventory availability, Material issue / receipt, Quality inspection, and the Facility &
equipment record for work centers, equipment and downtime. Shop-floor users report
downtime and request maintenance from the operation, and scheduling reads the same
offline windows that Maintenance plans; the records and services are shared, so stock,
value and equipment state agree across apps. Cross-app KPIs are Insights widgets, which
suggests Manufacturing supplying counts rather than charts beyond its landing strip.

---

## 13. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The existing implementation is a production-run worklist with asset-based issue and
receipt, not a manufacturing app. MarbleERP adds no manufacturing screens of its own: it
mounts the SimpleScreens tree as its **Manufacturing** menu item
(`component/mr-marble/screen/marble.xml`). The Mantle data model is wider than the
screens: routings, routing tasks, subcontracting and assembling purposes, production
lines and production estimates exist with no screen or service using them.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manufacturing root | Top-level **Manufacturing** (icon `fa-industry`) with a popup subscreen panel; default item is the dashboard | `component/mr-marble/screen/SimpleScreens/Manufacturing.xml` |
| Manufacturing dashboard | Three links: **Production Runs**, **Inventory Assets** (Asset summary filtered to `AstTpInventory`), **Equipment Assets** (`AstTpEquipment`) | `component/mr-marble/screen/SimpleScreens/Manufacturing/dashboard.xml` |
| Runs shell | Tab panel, default Find Run | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run.xml` |
| Find Run | `WorkEffortProductionRunFind` list; default status filter In Planning / Approved / In Progress / On Hold; **WH/Line** filter limited to facility types `FcTpLine`, `FcTpPlant`, `FcTpWarehouse`; start date, produce/consume product columns; **New Production Run** dialog (name, WH/Line, run date, est. hours, product to produce, est. quantity) calling `create#ProductionRun`; saved finds, column selection | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/FindRun.xml` |
| Edit Run | Header (name, WH/Line, start, est. hours), status change and history (`StatusChangeAndHistorySection`), **Clone Run** (`clone#WorkEffort`, copies equipment), **Run Pick PDF**, notes (`WorkEffortNote`), equipment assignments with status (`WorkEffortAssetAssign`), parties assigned | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/EditRun.xml`, `component/mr-marble/template/basic/StatusWidgets.xml` |
| Run Products | **Products to Produce** (add product, receive/produce asset, ATP/QOH, estimated vs produced) and **Products to Consume** (BOM suggestion with remaining quantity, add/issue asset, over-consumption warning) | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/RunProducts.xml`, `RunProducts/{ConsumeAsset,ConsumeProduct,ProduceAsset}.xml` |
| Assets Consumed / Produced | Issued-asset list (issue any asset or a chosen asset, return) and received-asset list (receive, issue back) per run | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/{RunConsumed,RunProduced}.xml` |
| Pick document | Printable run pick sheet (HTML / XSL-FO) | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/RunPickDocument.xml`, `component/mr-marble/template/work/ProductionRunPick.{print.html.fancy,xsl-fo.ftl}` |
| BOM editing | Generic product associations: add (product, type defaulting to **Manufacturing Bill of Materials** `PatMfgBom`, quantity), a "to" list (components) and a "from" list (where-used). No scrap factor, instruction, operation link or effective-date editing | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditAssocs.xml` |
| Production lines and equipment | Generic Facility edit (type can be Production Line) and Facility calendar; equipment through the Asset screens shared with Maintenance | `component/mr-marble/screen/SimpleScreens/Facility/{EditFacility,FacilityCalendar}.xml`, `component/mr-marble/screen/SimpleScreens/Asset/Asset/FindAsset.xml` |
| Time entry | Time entries exist for tasks, projects and parties, not for runs or operations | `component/mr-marble/screen/SimpleScreens/Task/EditTimeEntries.xml`, `component/mr-marble/screen/SimpleScreens/Party/PartyTimeEntries.xml` |

### Data model available

| Entity / enum | What it gives Manufacturing | Key files |
| --- | --- | --- |
| `WorkEffort` purposes under **Manufacturing** (`WepManufacturing`) | `WepProductionRun` (used), `WepRouting` and `WepRoutingTask` (unused), `WepAssembling` (unused), `WepPickAssembly` (kit assembly at shipment pick); `WepSubcontracting` exists as a top-level purpose, unused | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| `WorkEffort` fields | `parentWorkEffortId` / `rootWorkEffortId` (operations under a run), `facilityId` (line or warehouse), `priority`, `revisionNumber`, estimated/actual start and completion, `estimatedWorkTime`, `estimatedSetupTime`, `actualWorkTime`, `actualSetupTime`, `remainingWorkTime`, `percentComplete`, `actualCost`; production runs are created as type `WetEvent` | same |
| WorkEffort status | Generic flow `WeInPlanning` → `WeApproved` → `WeInProgress` ↔ `WeOnHold` → `WeComplete` → `WeClosed`, plus `WeCancelled` and re-open; no manufacturing-specific statuses | same |
| `WorkEffortAssoc` | Types `WeatRoutingComp` (routing → routing task), `WeatDependsOn` (blocked by), `WeatIndependentOf`, `WeatComponent`; `sequenceNum` and from/thru | same |
| `WorkEffortProduct` | Types `WeptProduce`, `WeptConsume` (used), `WeptRouting` (product's routing, unused); status `WepdCreated` / `WepdCompleted` / `WepdCancelled`; `estimatedQuantity`, `estimatedCost`; relationships to `AssetReceipt` and `AssetIssuance` | same |
| `WorkEffortAssetAssign`, `WorkEffortAssetNeeded`, `WorkEffortSkillStandard` | Equipment on a run (status Requested / Assigned / Arrived / Departed / Request Denied); equipment product needed with estimated quantity, duration and cost; skills needed with people, duration, cost | same |
| `WorkEffortFacility` | Extra facilities on a run: `WeftOrigin` (inventory origin, set by `create#ProductionRun`), `WeftUsed` | same |
| `TimeEntry` | `workEffortId`, `partyId`, from/thru, `hours`, `breakHours`, **`pieceCount`** and piece rates, `facilityId` | same |
| `Measurement` | Typed value + UOM per `workEffortId`, `assetId`, `productId`, with reason and user; a possible basis for inspection readings | same |
| `ProductionEstimate` (+ `ProductionEstimateWorkEff`, `ProductionEstimateAsset`) | Planned output per product, facility, destination and ready date; only a DataDocument and a view entity use it | same; `component/mr-mantle/entity/WorkEffortViewEntities.xml` |
| `ProductAssoc` | BOM line: `PatMfgBom` (and `PatEngBom`, `PatMfgAs`, `PatUsedToProduce`) with `quantity`, **`scrapFactor`**, **`instruction`**, **`routingWorkEffortId`** (consuming operation), `sequenceNum`, from/thru effective dates. No BOM header, so no BOM revision or status | `component/mr-mantle/entity/ProductDefinitionEntities.xml` |
| Product type `PtPickAssembly` | Kit product: availability computed from `PatMfgBom` components; assembled during shipment pick | same |
| `Facility` | Types `FcTpLine` (**Production Line**) and `FcTpPlant`, with `parentFacilityId`; no capacity, efficiency or cost-rate fields | `component/mr-mantle/entity/FacilityEntities.xml` |
| `Requirement` | Planning output that becomes a PO | `component/mr-mantle/entity/RequestEntities.xml` |
| GL account type `GatWipInventory` | WIP account used when posting issuance to and receipt from a run | `component/mr-mantle/data/ZaaGlAccountsInstallData.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#ProductionRun` (with BOM-driven consume lines), `set#ProducedProductQuantity`, `recreate#ConsumeProductsFromProduce`, `get#ProductBomDetail` (single level; reads `PatMfgBom` plus `PatVariant` substitutes; ignores scrap factor and effective dates), `get#ProductionRunProduceConsumeDetail`, `get#ConsumedAssetRemaining`, `get#ProducedProductComplete`, `get#ProductionRunDisplayInfo`, `get#ProductionRunPickInfo` | Production-run lifecycle and display | `component/mr-mantle/service/mantle/work/ManufacturingServices.xml` |
| `create#ShipmentAssemblyWorkEffort`, `produce#AvailableAssemblies`, `breakDown#Assembly`, `unissue#AssemblyComponents`, `unissue#Component`, `cancel#AssemblyWorkEffort` | Kit/assembly produce, break-down and undo | same |
| `issue#AssetToWorkEffort`, `issue#AnyAssetToWorkEffort`, `receive#Asset`, `get#AvailableInventory` (adds `PtPickAssembly` availability from components) | Material issue, finished-goods receipt, availability; issue and receipt add `WeptConsume` / `WeptProduce` rows when missing | `component/mr-mantle/service/mantle/product/AssetServices.xml` |
| `post#AssetIssuance`, `post#AssetReceipt` | GL posting to and from `GatWipInventory` when the issuance or receipt has a `workEffortId` | `component/mr-mantle/service/mantle/ledger/AssetAutoPostServices.xml` |
| `clone#WorkEffort` (`deepClone`, `copyAssoc`, `copyAssetNeeded`, `copySkillStandard`, `copyProduct`), `add#WorkEffortProduct` | Clone a run, or a routing template with its tasks | `component/mr-mantle/service/mantle/work/WorkEffortServices.xml` |
| `store#TimeEntry`, `create#TimeEntryClockIn`, `store#TimeEntryWorkEffort` | Time entry against a WorkEffort | `component/mr-mantle/service/mantle/work/TimeServices.xml` |
| (none) | No routing, operation, work-center, scheduling, MRP, scrap, downtime or inspection services | — |

The spec `component/mr-mantle/test/ManufacturingServices.spec.js` exercises BOM
lookup, run creation, quantity change, issue/receive, break-down, unissue and cancel.

---

## 14. Gaps & BOSS implications

### Gaps in the reference set

- **Odoo Community**: no shop-floor kiosk, no quality-control addon (`quality_control` is
  Enterprise and absent), no MPS (`mrp_mps` absent; the Planning menu holds only a hidden
  scheduler action), no reusable routing document. The app is an order/work-order manager
  plus reporting.
- **ERPNext**: broadest end-to-end coverage, but MRP is a report rather than a persisted
  planning engine and finite scheduling is absent (the Production Plan Visualizer renders
  planned rows; it does not solve capacity). Quality Inspection sits in Stock, not
  Manufacturing.
- **Carbon**: deepest execution and scheduling, but ERP and MES are separate apps, the
  scheduler is server-only, the Forecast Gantt and Demand Forecasts sit behind a hosted
  plan gate, and OEE machine-time review is Enterprise-edition code.
- **AureusERP**: execution and master data only; no planning, quality, downtime or
  subcontracting screens.
- **Dolibarr**: no routing entity (BOM service lines with a default workstation are the
  nearest thing), no shop floor, no MRP engine; BOM net needs and the production screen
  are the whole story.
- **metasfresh**: planning is candidate- and metadata-driven; no custom production form in
  the desktop WebUI. The shop floor is the mobile web UI's scan-driven job activities.
- **Enterprise or optional pieces.** Odoo work orders and routings need the
  `group_mrp_routings` setting; Dolibarr workstations are a separate module; ERPNext
  operations appear only on BOMs with **With Operations** ticked.

### Notable gaps in the Moqui baseline

- **No BOM header.** BOM lines are `ProductAssoc` rows (`PatMfgBom`) edited in the generic
  associations screen, so there is no BOM revision or status, no by-products, and no way to
  copy or version a BOM as a unit. The rows already carry `scrapFactor`, `instruction`,
  `routingWorkEffortId` and from/thru dates, but no screen edits them and
  `get#ProductBomDetail` ignores scrap and dates and explodes one level only.
- **Routings exist only in the data model.** `WepRouting` / `WepRoutingTask` WorkEfforts,
  `WeatRoutingComp` assocs and `WeptRouting` product links are defined, but no screen or
  service creates them, and production runs have no operation rows.
- **Work centers are bare facilities.** A Production Line (`FcTpLine`) facility can be
  chosen as the run's WH/Line, but it has no capacity, calendar, efficiency, cost/hour or
  OEE target, and no operation sequence, blocked-by dependency, standard duration or
  scheduling uses it.
- **No planning.** No MRP, net-needs explosion, master schedule, forecasting or planning
  worklist; `ProductionEstimate` and `Requirement` are unused by any manufacturing screen.
- **No shop-floor surface.** No operator queue, start/pause timer, per-operation
  completion, scan-driven issue, scrap/rework dialog, QC gate or wall display. Time
  entries exist for tasks, not for runs or operations.
- **No scrap, process-loss, downtime or inspection records.** `Measurement` could hold
  readings, but nothing links it to a run.
- **Kits only at shipment.** `PtPickAssembly` kits assemble during pick; there is no
  phantom BOM that explodes into a parent production run.
- **No subcontracting** (`WepSubcontracting` unused), no WIP location concept beyond the
  GL account, no cost roll-up or estimate-vs-actual view.
- **UI** is form/list-centric with no kanban, calendar or timeline and no kiosk.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | Order record shape: header + Components / Work Orders / By-Products tabs, status bar, smart buttons for every linked document; work-order board grouped by work center with conflict flags; BoM Structure & Cost vs MO Overview split; "outdated BoM" warning; product stat buttons for BOM / Used In / manufactured quantity |
| ERPNext | Process gating (material transfer → manufacture → finish, next action always visible); Shop Floor kiosk (manager board + operator view, timers, materials, instructions, completed + pending + process-loss reconciliation, scanner, keyboard); QC pills gating completion; Production Plan / MPS / MRP report; report taxonomy |
| Carbon | Execution decomposition into `materials`, `operations`, `quantities`, `events`, DAG and subassembly method routes; MES operation view with Setup/Labor/Machine meters, issue modal, scrap/rework; versioned make method (Draft / Active / Archived); outside processing as an operation type; material planning grid with time fence; work-center timeline and date/priority kanbans |
| AureusERP | Confirms the Odoo shape works in a simpler stack; copy-existing-operations action; read-only MO and BOM overview pages |
| Dolibarr | BOM net-needs tree (by product or tree, physical vs virtual stock) as the cheapest MRP view; side-by-side consume/produce screen; service lines with workstation rates as minimal operations |
| metasfresh | Planning candidate worklist with Set Start Date / Set Workstation and a selection-summing header; scan-per-line mobile issue and receipt with target / remaining / issued quantities; operator binds the device to a workstation by QR code |

### Candidate screen inventory (IronStone Manufacturing)

The screens the research points to for a production planner and shop-floor user. Reused
screens are those crosscut §3–§4 lists for other apps too; the Manufacturing version is
described here.

| Area | Screens |
| --- | --- |
| Landing | Manufacturing home: KPI strip (open, WIP, late, component-short, completed this month), work-order queue grouped by status or work center, **Component shortages** list; counts deep-linking into a pre-filtered Work Orders find |
| Work orders | Work Orders find (list, board by status / work center, calendar; saved filters ready, late, blocked, mine, by product); Work Order detail with sub-screens Overview, Components (required / issued / remaining / availability from **Inventory availability (reused: Warehouse, Customer Service, Purchasing, Sales, Commerce)**), Materials (issued, returned and received assets for the run through **Material issue / receipt (reused: Warehouse)**), Operations (sequence, work center, status, expected vs actual), Quantities (completed, scrap, rework), Time (**Time entry (reused: Projects, People, Accounting)**), By-products, Quality gates, Notes and files (**Chatter & activities (reused: every app)**); wizards for change quantity, split, backorder |
| Shop floor | Kiosk with manager board (pending / in progress / completed) and operator view (start / pause / end, timer, materials, instructions, QC state, quantity reconciliation), scanner and keyboard input, large touch targets; material issue, return and finished-goods receipt dialogs **(Material issue / receipt, reused: Warehouse)**; inspection screen opened from the operation **(Quality inspection, reused: Warehouse, Purchasing)**; report downtime and request maintenance on the line's equipment **(Facility & equipment record, reused: Maintenance, Warehouse, Commons, Accounting)** |
| BOMs & routings | BOM find (products with `PatMfgBom` lines); BOM and routing editor as the BOM tab of the **Product 360 (reused: Products, Commerce, Purchasing, Warehouse, Accounting, Sales)**: components with scrap factor and consuming operation, operations, by-products, exploded view, cost roll-up, where-used, copy operations from another product |
| Work centers & equipment | Work center list; work center detail as the **Facility & equipment record (reused: Maintenance, Warehouse, Commons, Accounting)** with production emphasis: Production Line facility with capacity, calendar, efficiency, cost/hour, alternatives, equipment, offline windows, load, and the line's downtime and maintenance history |
| Quality | In-process and final inspection list for runs and operations, and inspection templates attached to operations or BOMs **(Quality inspection, reused: Warehouse, Purchasing)**; scrap and process-loss list by reason |
| Planning | Net-needs / MRP worklist (item, required date, on hand, incoming, shortfall, suggested make/buy quantity, time fence; **Create work order**, **Create purchase requirement**); demand/supply per item by week; work-center load / timeline (needs work-center capacity and calendar) |
| Configuration | Operation catalogue, scrap reasons, downtime reasons, inspection-required defaults, settings (backflush / consumption policy, overproduction tolerance, auto-update BOM cost, planning horizon, time-log enforcement) |
| Further candidates | Subcontracting operation with component transfer and receipt; batches; non-conformance and corrective action (crosscut §8); finite scheduling |

### Data-model findings

- `WorkEffort` with purpose `WepProductionRun` fits as the work-order header; it already
  carries facility, dates, status, parties, equipment, notes and produce/consume lines.
  The work-order states seen in the references map onto the generic WorkEffort flow
  (Draft = `WeInPlanning`, Released = `WeApproved`, In Progress / Paused = `WeInProgress`
  / `WeOnHold`, Done = `WeComplete`, Closed = `WeClosed`), so new statuses may not be
  needed.
- Mantle's routing model fits without inventing one: routing template `WorkEffort`
  (`WepRouting`) with `WepRoutingTask` children joined by `WorkEffortAssoc`
  `WeatRoutingComp` (`sequenceNum`), linked to the product by `WorkEffortProduct`
  `WeptRouting`. Standard times fit `estimatedSetupTime` / `estimatedWorkTime`, the work
  center the task's `facilityId`, equipment `WorkEffortAssetNeeded`, skills
  `WorkEffortSkillStandard`.
- One option on release is copying the routing tasks into child WorkEfforts of the run
  (`parentWorkEffortId`, precedence by `WeatDependsOn`) with `clone#WorkEffort` and
  `deepClone`, and recording time per operation in `TimeEntry` (`workEffortId`, `partyId`,
  from/thru, `pieceCount`).
- BOM: `ProductAssoc` `PatMfgBom` fits as the line, and already has `scrapFactor`,
  `instruction`, `routingWorkEffortId` and from/thru dates for an editor to expose. A BOM
  header for revision and status (product, quantity, revision, status, effective dates)
  looks necessary, as do by-product lines; a header is what would let a run pin the BOM
  revision and routing it was released from and show an "outdated BOM" warning like Odoo.
- Kits: either `PtPickAssembly` (assembled at pick) also serves as the phantom BOM inside
  production, or a phantom flag on the BOM is needed.
- Work centers: a `FcTpLine` `Facility` lacks capacity, calendar, efficiency, cost/hour and
  OEE target. The options are new Facility fields or a work-center extension record; since
  the Facility & equipment record is reused by Maintenance, Warehouse, Commons and
  Accounting, either choice touches those apps' versions too (Open questions).
- Produce/consume lines as `WorkEffortProduct` (`WeptProduce` / `WeptConsume`) posted
  through `issue#AssetToWorkEffort` / `receive#Asset` are what keep Warehouse and
  Accounting (`GatWipInventory`) on the same stock and value.
- Quantity companions recur in the references: estimated, issued/consumed, completed,
  pending, scrapped, reworked, with partial completion possible without closing the run.
- Scrap and process loss have no Mantle record; a new record (run, operation, product, lot
  asset, quantity, reason, disposition) looks necessary rather than only negative
  quantities. Inspection results have no Mantle entity yet (crosscut §4); the record would
  serve the Quality inspection screen in Manufacturing, Warehouse and Purchasing alike,
  and `Measurement` is a candidate for readings. Equipment downtime has no record either;
  it would sit with the Facility & equipment record that Manufacturing and Maintenance
  both include.
- Planning: suggested makes can use `ProductionEstimate` or a new suggestion record;
  suggested buys fit `Requirement` rows.

### Sequencing notes

- The work-order lifecycle on `WepProductionRun` (release, start, issue, produce,
  complete, close) is cheap: `create#ProductionRun`, `set#ProducedProductQuantity`, the
  issue and receive services, the WorkEffort status flow and the baseline run screens
  already exist. Split and backorder are new.
- Operations on the work order depend on routings. Mantle defines `WepRouting` /
  `WepRoutingTask` but no screen or service creates them, so per-operation detail, time per
  operation and the shop-floor operator view all depend on the routing editor.
- The BOM tab depends on the Product 360 screen (research-products.md). Exposing the
  existing `ProductAssoc` fields is cheap; exploded view and where-used extend
  `get#ProductBomDetail`, which today is single-level and ignores scrap and dates; BOM
  revision depends on the new BOM header; cost roll-up depends on where product costs are
  kept (the Mantle cost entities are commented out, research-products.md).
- Scheduling, work-center load, OEE and operation costing all depend on the work-center
  attributes (capacity, calendar, cost/hour), and so on the Facility extension question.
- In the shop-floor kiosk, material issue and receipt are cheap (the services and baseline
  dialogs exist) and time entry against a WorkEffort exists (`store#TimeEntryWorkEffort`);
  QC state depends on the inspection record, and downtime reporting on a downtime record,
  neither of which Mantle has.
- A net-needs worklist is cheap on Moqui (a recursive BOM explosion over
  `get#AvailableInventory`, with `Requirement` for buys); MPS, forecasting and finite
  scheduling have nothing in the baseline to build on.
- Scrap and process loss on the quantity dialog depend on the new scrap record and scrap
  reasons.
- Subcontracting depends on routing operations with a supplier and on purchase orders;
  batches, non-conformance and corrective action, 3D assembly instructions, gauge
  calibration and multi-level planning beyond net needs have no baseline support.

### Open questions

- Does a work order always have operations, or is a no-routing "simple production run"
  still first-class? Dolibarr and the current Mantle model say yes; Odoo hides work orders
  unless routings are enabled. One option is supporting both and letting the product's
  routing decide.
- Is a "production run" one work order, or a batch of work orders sharing a setup? Carbon
  makes batches first-class; Odoo/ERPNext do not, which suggests one run = one work order
  as the common case, with batching where a setup-saving case appears.
- Is scheduling a Manufacturing screen, or a reused planning screen that Purchasing and
  Warehouse also include? The references keep it in Manufacturing; crosscut §8 lists
  replenishment and MRP planning over the same requirements as a cross-app question.
- Which quantity is authoritative for completion: produced good quantity, or issued
  material? ERPNext's reconciliation (completed + pending + process loss) is one answer,
  and it never lets one silently overwrite the other.
- Quality inspection is one reused screen (Manufacturing, Warehouse, Purchasing). Does one
  screen with per-app context cover in-process inspection with measured characteristics
  and sampling (Carbon's MES inspection), or does the Manufacturing version need an
  operator execution view of the same record?
- Operator-reported downtime that is not an equipment fault (no material, no operator,
  waiting on QC) feeds OEE but is not maintenance. Is it the same downtime record with a
  non-equipment reason, or a separate productivity-loss record (crosscut §8)?
- Do the work-center fields (capacity, calendar, efficiency, cost/hour) go on `Facility`
  for every app that includes the Facility & equipment record, or in an extension record
  shown only in the Manufacturing version?
- Phantom/kit BOMs: reuse `PtPickAssembly`, or add a phantom flag? Either is cheap and
  prevents fake assemblies.

**Bottom line.** Mantle already has much of what work orders need (production runs, BOM
lines with scrap and operation links, routing purposes and assocs, time entries, WIP
posting); what the research finds missing is screens, a BOM header, work-center
attributes, scrap, downtime and inspection records, and an operation-level shop floor.
Beyond work orders, the shop floor and planning, most of what a production user touches
is reused screens (Product 360, Inventory availability, Material issue / receipt, Quality
inspection, Facility & equipment record) that Manufacturing would include with its own
context.
