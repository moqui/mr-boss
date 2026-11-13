# IronStone BOSS — Insights app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).
Updated Oct 25, 2026 with references to the framework dashboards and reports tooling planned in
mr-moqui `plans/archive/Monitoring.md`.

Deeper research pass on the **IronStone Insights** app (initial-design sections: Dashboards
& KPIs · Report builder · Saved reports · Business flow map as clickable documentation),
cataloguing every relevant screen/page found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md); feeds the Insights row in
[initial-design.md](initial-design.md) and the decision that Marble's flow map becomes
clickable documentation in Insights. The **Dashboard widgets** (number cards, charts) are a
reused component: Insights includes them with the dashboards and widget builder, and every
app's landing page includes them too (crosscut §3); Insights adds cross-app dashboards and
the management digest (crosscut §4). Each app has its own landing page, and drill rows open
the reused record screens in an Insights context. Style mirrors
[research-maintenance.md](research-maintenance.md) and
[research-people.md](research-people.md).

**Framework tooling (planned).** mr-moqui `plans/archive/Monitoring.md` ("Dashboards and reports",
Oct 25, 2026) plans a framework dashboards and reports tool on the SearchFacade. It is drawn
from Grafana and OpenSearch Dashboards, and has its own Dashboards app in the tools component.
Monitor uses it first, and Insights can reuse its screens and widgets. It provides:
- datasets over DataDocuments
- report queries
- panels, and dashboards with library panels
- Explore
- alert rules
- scheduled dashboard reports

[Framework tooling planned in mr-moqui](#framework-tooling-planned-in-mr-moqui) maps it onto
the Insights screens and notes which open questions it answers. This file still records
findings; what Insights takes from the tool is for the Insights design file.

**Organization.** Sorted by functional area (not by app): all dashboard viewers together,
all report builders together, etc. Within each area, sub-tables per reference app.

**Scope.** Business-owner/management-facing analytics UI: dashboard lists and canvases, KPI
tiles, chart and query builders, pivot/graph views, canned report catalogs, saved reports
and views, scheduled delivery and alerts, sharing/embedding, analytics data sources and
permissions, and process/flow documentation. Per-app reports are covered only as the shape
of a report page or catalog; each business app's research file covers its own report list.
Module landing pages (workspaces) are covered where the same widgets (number cards, charts)
are reused, since the widgets are one component that Insights and every app's landing page
include.

**Path conventions.** Every backticked path resolves against the checkout of its row's
reference (crosscut §1). Checkouts are under `/home/jonesde/work/moquiwork/`. A tail in a
table row is relative to the directory named earlier in the same cell or row.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Frappe Insights** | `3p_other/frappe/insights` | Vue 3 SPA `frontend/src2/…` (dashboard, workbook, query, charts, data_source, data_store, settings, teams, islands); doctypes `insights/insights/doctype/…`; API and permission code one level up at `insights/api/…` and `insights/permissions.py`; glossary `CONTEXT.md`, feature list `docs/features.md`, ADRs `docs/adr/` |
| **Frappe framework** (desk) | `3p_other/frappe/frappe` | `frappe/<area>/…`: `frappe/desk/doctype/`, `frappe/core/doctype/`, `frappe/email/doctype/auto_email_report/`, desk JS `frappe/public/js/frappe/views/{reports,workspace,dashboard}/`, `frappe/public/js/frappe/widgets/` |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…`: `erpnext/<module>/report/`, `erpnext/<module>/dashboard_chart/`, `erpnext/<module>/dashboard_chart_source/`, `erpnext/<module>/number_card/`, `erpnext/<module>/<module>_dashboard/`, `erpnext/<module>/workspace/`, `erpnext/<module>/page/` |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (analytics addons `board`, `spreadsheet`, 13 `spreadsheet_dashboard*`, `digest`; generic views `odoo/addons/web/static/src/views/{pivot,graph}/`, search `odoo/addons/web/static/src/search/`; SQL-view report models `odoo/addons/<addon>/report/*_report.py`); core `odoo/odoo/addons/base/…` |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/…` (`modules/{page-layout,dashboards,side-panel/pages/page-layout,command-menu-item}/`), `packages/twenty-server/src/…` (`engine/metadata-modules/page-layout-widget/`), `packages/twenty-shared/src/…` |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (`routes/x+/reports+/`, `routes/x+/accounting+/reports.tsx`, KPI APIs `routes/api+/<module>.kpi.$key.ts`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…` (`dashboard/`, `reports/`), `packages/…` (widget registry `packages/ui-core/shared/src/lib/dashboard/`, contracts `packages/contracts/src/lib/`) |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.ui.web.base/…` (Java under `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/{dashboard,kpi}/`) |
| **Akaunting** | `3p_other/akaunting` | `app/…` (`app/Widgets/`, `app/Reports/`, `app/Abstracts/Report.php`), `resources/views/…` |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`htdocs/index.php` home board, `htdocs/core/boxes/` 65 boxes, `htdocs/core/customreports.php`, `htdocs/<module>/stats/`) |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` (widgets in `Filament/Widgets/` or `Filament/Admin/Widgets/`); `plugins/webkul/analytics/` is a record model only |
| **OpenProject** | `3p_other/openproject` | `modules/<module>/…` (`modules/{grids,overviews,my_page,reporting}/`), `frontend/src/app/…` |
| **coarchy**, **ServiceJobMonitor** | `3p_moqui/<component>` | `screen/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/…`, `component/mr-marble/screen/SimpleScreens/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `components/base/tools/screen/…`, `components/base/framework/{entity,service,data}/…`, `component/mr-boss/screen/…` |

**Not used here** (checked, nothing beyond what other files cover): Zimbra and Nextcloud have
no BI screens (Nextcloud's `server/apps/dashboard/` widget board is the personal start page,
covered in [research-drawers-commons.md](research-drawers-commons.md) §4); Redmine has only a
per-project issue summary (`app/views/reports/issue_report.html.erb`); Dolibarr community
modules ship no reporting module; Moqui Sales, WorkManagement, WeCreate and resistmanagement
have no analytics screens beyond small landing counters; ridgecrest's admin reports
(`screen/rcadmin/OrderReports.xml`, `OrderVelocity.xml`) are retailer-specific. Frappe CRM,
Frappe Helpdesk and Frappe HR dashboards are per-app and covered in their apps' research
files.

Sections: [1 home & dashboard list](#1-insights-home--dashboard-list) · [2 dashboard viewer & KPI tiles](#2-dashboard-viewer--kpi-tiles) · [3 dashboard builder](#3-dashboard-builder--layout) · [4 chart builder](#4-chart-builder--chart-types) · [5 query / report builder](#5-query--report-builder) · [6 pivot & graph views](#6-pivot--graph-views-over-list-data) · [7 canned report catalogs](#7-canned-report-catalogs--report-pages) · [8 saved reports & views](#8-saved-reports-views--favorites) · [9 scheduled delivery & alerts](#9-scheduled-delivery-digests--alerts) · [10 sharing & embedding](#10-sharing-public-links--embedding) · [11 data sources & data store](#11-data-sources-data-store--semantic-layer) · [12 analytics permissions](#12-analytics-content-permissions) · [13 flow map & process docs](#13-business-flow-map--process-documentation) · [14 AI & agents](#14-ai--agent-assisted-analytics) · [15 cross-app surfaces](#15-cross-app-surfaces) · [16 current Moqui baseline](#16-current-moqui-baseline-mr-marble--marbleerp--mantle) · [17 gaps & BOSS implications](#17-gaps--boss-implications)

---

## 1. Insights home & dashboard list

### Frappe Insights — home redirects to the dashboard list; workbooks are the authoring unit

Insights splits **reading** (Dashboards) from **authoring** (Workbooks). `/` redirects to
`/dashboards`; a workbook holds queries, charts and dashboards together and opens full
screen without the sidebar.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| App shell & routes | Sidebar app: Dashboards · Workbooks · Data Sources · Data Store · Settings; guest routes `/shared/chart/:chart_name` and `/shared/dashboard/:dashboard_name`; a Not Found page. "Not Permitted" is a card state (the card names the doctypes the reader lacks), not a page | `frontend/src2/router.ts`, `frontend/src2/App.vue`, `frontend/src2/components/AppSidebar.vue`, `frontend/src2/auth/NotFound.vue`, `frontend/src2/not_permitted.ts` |
| Home | A **New Workbook** quick action and a workbook list. The `/` route redirects to `/dashboards`, so in practice the dashboard list is the landing page | `frontend/src2/home/{Home,HomeQuickActions,HomeWorkbookList}.vue` |
| Dashboard list | Dashboards readable by the user, last opened first; filter by title, workbook, chart, data source or access; favorites (`dashboard.favorite`); preview image rendered by a headless browser with a one-time key (`dashboard.preview-image`); "Load more" paging; admins also list dashboards nobody gave them | `frontend/src2/dashboard/DashboardList.vue`, `frontend/src2/dashboard/dashboards.ts`; `insights/insights/doctype/insights_dashboard_v3/` (`preview_image`) |
| Workbook list | Workbooks the user created or was shared, modified-last first (`workbook.home-recent`); filter by title or by a query, chart, dashboard, data source or table inside; admins also list ones nobody gave them (`workbook.list-everyone`); read-only shield for viewers | `frontend/src2/workbook/WorkbookList.vue`, `frontend/src2/workbook/workbooks.ts` |

### Odoo — Dashboards app grouped by section

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboards root menu | **Dashboards** app opens the dashboard action; **Configuration** → Dashboards (list with access groups, allowed users, companies, **Published** toggle, grouped by section), Sections, Share links; technical **User-defined Dashboard Filters** | `odoo/addons/spreadsheet_dashboard/views/menu_views.xml`, `odoo/addons/spreadsheet_dashboard/views/spreadsheet_dashboard_views.xml` |
| Dashboard action (reader) | Left list of dashboards grouped by **section** (`spreadsheet.dashboard.group`), favorites on top, the selected spreadsheet dashboard rendered read-only on the right; mobile search panel | `odoo/addons/spreadsheet_dashboard/static/src/bundle/dashboard_action/` (`dashboard_action.{js,xml}`, `mobile_search_panel/`, `mobile_figure_container/`) |
| Shipped dashboards | Each `spreadsheet_dashboard_<app>` addon ships JSON spreadsheets (e.g. Sales, Product) plus a **sample** version shown until real data exists (`sample_dashboard_file_path`) | `odoo/addons/spreadsheet_dashboard_sale/data/{dashboards.xml,files/*.json}`; same pattern in `_account`, `_stock_account`, `_hr_expense`, `_hr_timesheet`, `_website_sale`, `_pos_hr`, `_event_sale`, … |
| My Dashboard (legacy board) | Per-user board of saved list/graph/pivot views added from any action via **Add to my dashboard** | `odoo/addons/board/static/src/{board_action.js,board_controller.*,add_to_board/}`, `views/board_views.xml` |

### ERPNext / Frappe framework — dashboards per module plus the Home workspace

| Screen/page | What it is | Key files |
| --- | --- | --- |
| ERPNext Home workspace | Org-wide landing: Profit and Loss chart; number cards Annual Sales, Annual Purchase, Total Stock Value | `erpnext/setup/workspace/home/home.json` |
| Frappe framework Dashboard view | Desk `/desk/dashboard-view/<name>`: number cards row then charts (Half/Full width per chart link), per-chart filters, timespan and interval; chart config saved per user | `frappe/public/js/frappe/views/dashboard/dashboard_view.js`, `frappe/desk/doctype/dashboard/`, `frappe/desk/doctype/dashboard_chart_link/` (`width`), `frappe/desk/doctype/dashboard_settings/` (`chart_config` per user) |
| ERPNext module dashboards | Shipped `Dashboard` records per module (Selling, Buying, Stock, Accounts, Manufacturing, Projects, CRM, Assets), built from 47 shipped number cards and 44 dashboard charts across 11 modules | `erpnext/{selling,buying,stock,accounts,manufacturing,projects,crm,assets}/*_dashboard/`, `erpnext/<module>/{number_card,dashboard_chart}/` |

### Ever Gauzy, metasfresh, Akaunting, Dolibarr — one home dashboard, switchable

| App | Screen/page | Key files |
| --- | --- | --- |
| Ever Gauzy | Dashboard with a **switcher** between built-in boards (Accounting, Human Resources, Project Management, Team, Employee charts) and **custom dashboards** (tab strip of user dashboards, default flag) | `apps/gauzy/src/app/pages/dashboard/{dashboard.component.*,dashboard-switcher/,accounting/,human-resources/,project-management/,team/,employee-charts/,custom-dashboard/}` |
| metasfresh | Home is a per-user dashboard of KPI and target-indicator widgets with a side nav to add more | `frontend/src/containers/Dashboard.js`, `frontend/src/components/dashboard/{DndWidget,DraggableWrapper,Sidenav,ChartWidget}.js` |
| Akaunting | Multiple named dashboards per company/user (create/edit/show), each a set of widget instances | `resources/views/common/dashboards/{index,create,edit,show}.blade.php`, `app/Widgets/` |
| Dolibarr | Home page = global **work board** (counts of items to process per module, late flags) + user-selected **boxes** | `htdocs/index.php` (`load_board()` per object), `htdocs/core/boxes/`, `htdocs/admin/boxes.php` |

---

## 2. Dashboard viewer & KPI tiles

### Frappe Insights — dashboard reader

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard page | Responsive grid of chart, filter and text items; refresh with/without cache (`dashboard.refresh`); export PNG; jump to workbook or to the chart in the workbook for users with access | `frontend/src2/dashboard/{Dashboard,DashboardPage,DashboardBody,StaticGridLayout,DashboardActions}.vue`, `view.ts` |
| Dashboard filters | Dashboard-level filter controls linked to columns of charts; default operator/value; icon; one **filter picker** (column → operator → value) used everywhere | `frontend/src2/dashboard/{DashboardFilter,DashboardFilterEditor,FilterIconPicker}.vue`, `filter_storage.ts`, `frontend/src2/components/filter_picker/` |
| Card filters & actions | Per-card filter, find rows in table cards, reset all filters reaching a card, expand full size, view SQL (authors), export rows CSV/XLSX (if permitted) | `frontend/src2/dashboard/{DashboardItemActions,TableCardActions}.vue`, `card_filters.test.ts`; chart features `charts.expand`, `charts.reset-filters`, `charts.export-rows` in `docs/features.md` |
| Number cards | One card per **reading**: value, format, **Period** comparison (`month to date`, `last 3 months`, …), target with gap, "negative is better", sparkline one grain finer | `frontend/src2/charts/components/{NumberCards,NumberReading,NumberValueContext,NumberWindowPicker}.vue`, `charts/window.ts`; ADR `docs/adr/a-number-card-groups-by-its-period.md` |
| Drill-down | Click a bar/wedge/point → **rows** behind the segment (ranked by the clicked measure) or **breakdown** by another dimension; breadcrumb levels; drilled rows link to the desk record; "open as query" | `frontend/src2/charts/drill/{ChartDrillDown,DrillDialog,DrillMenu,DrillBreakdown,DrillRowsView}.vue`, `drill_stack.ts`, `segment_click.ts`; `frontend/src2/charts/record_link.ts` |
| Text items | Markdown/text blocks between charts | `frontend/src2/dashboard/DashboardText.vue` |

### Frappe framework — Number Card and Dashboard Chart (reused on workspaces and dashboards)

| Widget | What it is | Key files |
| --- | --- | --- |
| Number Card | Type Document Type / Report / Custom: Count/Sum/Average/Minimum/Maximum over a DocType with filters (static + dynamic), or a Report field, or a custom method; **percentage stats** vs previous Daily/Weekly/Monthly/Yearly interval; color; currency; public flag. No threshold or alert fields | `frappe/desk/doctype/number_card/`, `frappe/public/js/frappe/widgets/number_card_widget.js` |
| Dashboard Chart | Chart type Count/Sum/Average/Group By/Custom/Report over a DocType or report; timeseries with timespan (Last Year/Quarter/Month/Week/Select Date Range) and interval; Line/Bar/Percentage/Pie/Donut/Heatmap; per-chart roles; last synced | `frappe/desk/doctype/dashboard_chart/`, `frappe/desk/doctype/dashboard_chart_source/`, `frappe/public/js/frappe/widgets/chart_widget.js` |
| ERPNext chart sources | Code-backed sources for charts that need logic: account balance timeline, stock value by item group, warehouse-wise stock value | `erpnext/accounts/dashboard_chart_source/account_balance_timeline/`, `erpnext/stock/dashboard_chart_source/{stock_value_by_item_group,warehouse_wise_stock_value}/` |

### Other KPI tiles

| App | Widget | Key files |
| --- | --- | --- |
| Odoo | Spreadsheet dashboards: KPI cells, pivots, charts, lists, all driven by **global filters** (date, relation, text) with a facet search bar and saved favorite filter sets per user | `odoo/addons/spreadsheet_dashboard/static/src/bundle/dashboard_action/{dashboard_date_filter,dashboard_facet,dashboard_filter_list,dashboard_search_bar}/`, `odoo/addons/spreadsheet_dashboard/static/src/bundle/{global_filter_widget,pivot,chart,list}/`, `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard_favorite_filters.py` |
| Carbon | Module home pages (Sales, Purchasing, Production, Quality, Resources) with a KPI selector (Sales: Quotes, RFQs, Sales Funnel, Sales Orders, Sales Revenue); date range, interval and CSV export | `apps/erp/app/routes/x+/{sales,purchasing,production,quality,resources}+/_index.tsx`, `apps/erp/app/routes/api+/{sales,purchasing,production,quality,resources}.kpi.$key.ts`, `apps/erp/app/modules/sales/sales.models.ts` (`KPIs`) |
| metasfresh | KPI = SQL or Elasticsearch datasource with chart type Area/Bar/Pie/**Metric**/URLs, comparison offset, allowed staleness, zoom-into-details window; dashboard widget types **KPI** and **Target indicator** | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/kpi/descriptor/{KPI,KPIChartType,KPIDatasourceType}.java`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/kpi/data/KPIZoomIntoDetailsInfo.java`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/dashboard/DashboardWidgetType.java`, `frontend/src/components/charts/{Indicator.js,BarChartComponent/,PieChartComponent/}` |
| Akaunting | Widgets: Account Balance, Bank Feeds, Cash Flow, Currencies, Expenses by Category, Payables, Profit & Loss, Receivables | `app/Widgets/*.php`, `resources/views/widgets/` |
| Dolibarr | 65 boxes: lists (last orders/invoices/tickets), graphs (invoices/orders per month/year, product distribution, tickets by severity, **funnel of prospection**), alerts (stock alert, invoices in dispute, customers over outstanding limit), state board | `htdocs/core/boxes/box_*.php`, `htdocs/core/boxes/box_dolibarr_state_board.php`, `htdocs/core/class/dolgraph.class.php` |
| AureusERP | Filament stats-overview and chart widgets per plugin (Projects task-by-stage/state, top assignees/projects; Inventories operation-type cards; Accounting journal charts; POS session stats/top products; Website blog stats; Recruitments job-position stats and applicant chart) | `plugins/webkul/{projects,inventories,accounting,recruitments}/src/Filament/Widgets/`, `plugins/webkul/{point-of-sale,website}/src/Filament/Admin/Widgets/` |
| Twenty | Dashboard GRAPH widget: AGGREGATE_CHART (single number), BAR, LINE, PIE over any object with filters and group-by; a limit banner when there are too many groups | `packages/twenty-server/src/engine/metadata-modules/page-layout-widget/enums/graph-type.enum.ts`, `packages/twenty-front/src/modules/page-layout/widgets/graph/`, `packages/twenty-front/src/modules/side-panel/pages/page-layout/components/ChartLimitInfoBanner.tsx` |
| OpenProject | **Work package graph** widget on My page and project Overview: bar, horizontal bar, line, pie, doughnut, radar, polar area over a saved work-package query grouped by an attribute; **Work package overview** widget (counts grouped by type) | `frontend/src/app/shared/components/grids/widgets/{wp-graph,wp-overview}/`, `frontend/src/app/shared/components/work-package-graphs/chart-type.ts` |

---

## 3. Dashboard builder & layout

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe Insights | Dashboard builder (in workbook) | Edit mode: add charts (chart selector with search, select all/none), filters, text; drag/resize with push-out; **breakpoints** (arrange per width, narrow grid stacks unarranged cells); number chart = one cell per reading; vertical compaction; discard layout changes | `frontend/src2/workbook/WorkbookDashboard.vue`, `frontend/src2/dashboard/{DashboardBuilder,EditableGridLayout,DashboardChartSelectorDialog,DashboardEditActions}.vue`, `grid_placement.ts`, `builder.ts` |
| Twenty | Dashboard page layout | Dashboards are records (`DASHBOARD` page-layout type) with **tabs**; edit mode via command menu (Edit / Save / Cancel / Duplicate dashboard); grid with drag selector and resize handles; side panel widget picker offers **Chart** (GRAPH), **View** (RECORD_TABLE), **iFrame**, **Rich Text** and app-supplied **Front Components**. The other widget types (fields, timeline, tasks, notes, files, emails) belong to record-page layouts, not dashboards | `packages/twenty-shared/src/types/page-layout/{WidgetType,PageLayoutType}.ts`, `packages/twenty-front/src/modules/page-layout/components/{PageLayoutGridLayout,PageLayoutGridLayoutDragSelector,PageLayoutGridResizeHandle,DashboardPageLayoutEditModeProvider,PageLayoutTabList}.tsx`, `packages/twenty-front/src/modules/side-panel/pages/page-layout/components/{SidePanelPageLayoutDashboardWidgetTypeSelect,ChartSettings,ChartTypeSelectionSection,ChartFiltersSettings}.tsx`, `packages/twenty-front/src/modules/side-panel/pages/page-layout/components/dashboard/`, `packages/twenty-front/src/modules/command-menu-item/engine-command/record/single-record/dashboard/components/` |
| OpenProject | My page and project Overview grids | Both are **grids**: a grid record (row count, column count, owner user or project, options) holding widgets with `identifier`, start/end row and column, and options (for example the saved query a table or graph reads). Each grid class registers its allowed widgets and permissions: Overview is viewed with `view_project` and edited with `manage_dashboards`; My page widgets include assigned/accountable/watched/created work packages, calendar, time entries, favorite projects, news, documents, custom text | `modules/grids/app/models/grids/{grid,widget}.rb`, `modules/grids/db/migrate/tables/{grids,grid_widgets}.rb`, `modules/grids/lib/grids/configuration/in_project_base_registration.rb`, `modules/my_page/lib/my_page/grid_registration.rb`, `modules/overviews/lib/overviews/grid_registration.rb`, `frontend/src/app/shared/components/grids/widgets/widgets.service.ts` |
| Ever Gauzy | Custom dashboard canvas | Tab strip of dashboards; **widget palette** fed by a registry (id, title, description, default/min/max size, supported widths, required context org/date range/employee, permission); widget config dialog; layout persisted to DB or local storage | `apps/gauzy/src/app/pages/dashboard/custom-dashboard/{dashboard-canvas,dashboard-tab-strip,widget-palette,widget-config-dialog}.component.ts`, `packages/ui-core/shared/src/lib/dashboard/widgets/{charts,hr,project-management,teams}/*.widgets.ts`, `concretes/strategies/{database,local-storage}-strategy.class.ts`, `packages/contracts/src/lib/dashboard{,-widget}.model.ts` |
| Frappe framework | Workspace editor | Block editor for module pages: header, paragraph, **shortcut** (with count badge), **number card**, **chart**, **quick list**, **links card**, onboarding, custom HTML block; public vs per-user workspaces; parent/child sidebar | `frappe/public/js/frappe/views/workspace/{workspace.js,blocks/}`, `frappe/public/js/frappe/widgets/{shortcut,number_card,chart,quick_list,links,custom_block,onboarding}_widget.js`, `frappe/desk/doctype/workspace/` |
| metasfresh | Dashboard edit | Drag widgets from side nav into the dashboard; per-item chart options (time range, caption) | `frontend/src/components/dashboard/{Sidenav,DndWidget,ChartOptions}.js`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/dashboard/{UserDashboardItemAddRequest,UserDashboardItemChangeRequest}.java` |
| Akaunting | Dashboard edit | Name, users who can see it, add/remove/reorder widgets with width | `resources/views/common/dashboards/edit.blade.php`, `resources/views/modals/` |
| Odoo | Spreadsheet dashboards (no editor in community) | Dashboards are spreadsheets (cells, charts, pivots with `ODOO.PIVOT` formulas, global filters) rendered by the `spreadsheet` engine. The community checkout has no spreadsheet editor (`spreadsheet_edition` is Enterprise and absent), so community dashboards are the JSON files the `spreadsheet_dashboard_*` addons ship; Configuration only sets access, companies, section and published flag | `odoo/addons/spreadsheet/static/src/`, `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard.py` (`is_published`, `group_ids`, `allowed_user_ids`, `company_ids`, `main_data_model_ids`) |
| Dolibarr | Box setup | Admin enables boxes and default positions; each user reorders/hides boxes on the home page | `htdocs/admin/boxes.php`, `htdocs/core/boxes/modules_boxes.php` |

---

## 4. Chart builder & chart types

### Frappe Insights — chart builder over a workbook query

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart builder | Pick query; pick type; dimensions (with **grain** day/week/month/quarter/year), measures (sum, count, avg, min, max, distinct count, expression), split-by, tooltip-only measures; preview with rows and SQL; style changes re-render without re-running | `frontend/src2/charts/{ChartBuilder,ChartView}.vue`, `frontend/src2/charts/components/{ChartQuerySelector,ChartTypeSelector,DimensionPicker,MeasurePicker,SplitByConfig,TooltipConfig,ChartFilterConfig,ChartSortConfig}.vue`, `frontend/src2/charts/chart_preview.ts` |
| Chart types | Number, Bar, Line, Row, Donut, Funnel, Table, Map, Bubble, Sankey, Heatmap | `frontend/src2/types/chart.types.ts` (`CHARTS`); config forms `frontend/src2/charts/components/*ChartConfigForm.vue` |
| Axis & series options | Secondary axis, data labels, axis min/max, stacked/normalized bars, smooth lines, **reference lines** (constant or avg/median/min/max/sum), **trend line**, sort, limit | `frontend/src2/charts/components/{XAxisConfig,YAxisConfig,ReferenceLinesConfig}.vue`; features `charts.series-align`, `charts.reference-lines`, `charts.bar-normalize` |
| Table chart | Rows × pivot columns × values; pinned and fixed-width columns; color scale; header sort; pager | `frontend/src2/charts/components/{TableChart,TableChartConfigForm}.vue` |
| Number format | Shorten large numbers, decimals, prefix/suffix; currency carried by the measure | `frontend/src2/charts/components/{NumberFormatFields,NumberFormatSection}.vue`, `frontend/src2/charts/number_format.ts` |
| Map | Region map with region-name mapping dialog | `frontend/src2/charts/components/{MapChart,MapChartConfigForm,RegionMappingDialog}.vue`, `insights/api/maps.py` |
| Description & info | Short description under the title; longer info behind a mark | `frontend/src2/charts/components/{TitleMark,ChartChrome}.vue` |

### Other chart builders

| App | Screen/page | Key files |
| --- | --- | --- |
| Frappe framework | Dashboard Chart form: source DocType or report, based on date field, value-based-on, group-by field + aggregate, number of groups, timespan/interval, heatmap year, color, show values | `frappe/desk/doctype/dashboard_chart/dashboard_chart.{json,js}` |
| Frappe framework | Query/Script report **Actions** menu: **Create Card**, **Set Chart**, **Add Chart to Dashboard** turn the report into a number card or chart on a desk Dashboard (`/desk/dashboard-view/<name>`); the Report Builder view has **Toggle Chart** | `frappe/public/js/frappe/views/reports/query_report.js` (`add_card_to_dashboard`, `add_chart_to_dashboard`), `frappe/public/js/frappe/views/reports/report_view.js` |
| OpenProject | Work package graph configuration: chart type, the saved query it reads, group-by attribute | `frontend/src/app/shared/components/work-package-graphs/{configuration-modal,configuration}/` |
| Twenty | Chart settings side panel: data source object + view, aggregate field/operation, group-by (primary + secondary), date granularity, filters, chart limit banner | `packages/twenty-front/src/modules/side-panel/pages/page-layout/components/{ChartSettings,ChartFiltersSettings,ChartLimitInfoBanner}.tsx`, `chart-settings/` |
| Odoo | Graph view: Bar/Line/Pie, measures, stacked, cumulative, sort ascending/descending, group-bys from search | `odoo/addons/web/static/src/views/graph/{graph_controller.xml,graph_renderer.js,graph_arch_parser.js}` |
| Akaunting | Report chart config (bar/donut) attached to each report class | `app/Abstracts/Report.php` (`chart` options) |
| Dolibarr | Custom report graph type and measures (see §5) | `htdocs/core/customreports.php` |

---

## 5. Query / report builder

### Frappe Insights — workbook query editor (builder, SQL, script)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Workbook shell | Tabs for queries, charts, dashboards; sidebar with folders; lineage graph of tables and queries (table → query) with search and jump to a query; duplicate; share; export to app | `frontend/src2/workbook/{Workbook,WorkbookNavbar,WorkbookSidebar,WorkbookSidebarFolders,WorkbookTabSwitcher,WorkbookLineageDialog,WorkbookShareDialog,WorkbookExportToAppDialog}.vue` |
| Query interface picker | New query opens as **builder**, **SQL** or **script** | `frontend/src2/query/components/{QueryBuilder,NativeQueryEditor,ScriptQueryEditor}.vue`; `CONTEXT.md` "Query interface" |
| Builder pipeline | Ordered **operations**: source (table or another query), join (inner/left/right/full, expression joins, suggested joins from table links), union, filter group (And/Or, relative dates incl. fiscal years), select/rename/remove/cast, mutate (calculated column), summarize (grain), order by, limit, window ops, pivot wider, custom (Python) operation, raw SQL column | `frontend/src2/types/query.types.ts`, `frontend/src2/query/components/{AddOperationPopover,QueryOperations,JoinSelectorDialog,UnionSelectorDialog,FiltersSelectorDialog,SummarySelectorDialog,PivotSelectorDialog,NewColumnSelectorDialog,ColumnsSelectorDialog}.vue` |
| Result grid | Paged result with row count; column header menu: quick filter, sort, rename, type change, remove; conditional formatting; schema explorer; view SQL | `frontend/src2/query/components/{QueryDataTable,QueryBuilderTable,ColumnFilter,ColumnSort,ColumnRename,ColumnTypeChange,ConditonalFormattingDialog,SchemaExplorer,ViewSQLDialog}.vue`, `frontend/src2/query/result_table.ts` |
| Expression editor | Ibis-based expressions with autocomplete and function list; period helpers (`previous_period_value`, `percentage_change`), `date_diff`; sandboxed, cannot write or reach files; only an Insights Admin adds scripts, SQL-running expressions or stored-procedure calls | `frontend/src2/query/components/{ExpressionEditor,InlineExpression}.vue`; `docs/adr/code-in-a-query-follows-the-server-script-model.md` |
| Source selector | Pick data source → table, or a workbook query | `frontend/src2/query/components/source_selector/{SourceSelectorDialog,DataSourceSelector,DataSourceTableList,WorkbookQueryList}.vue` |
| Query variables | Named secrets/values for script queries | `insights/insights/doctype/insights_query_variable/` |

### Frappe framework — Report Builder, Query Report, Script Report

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Report Builder (report view) | Any list as a grid: Pick Columns (incl. child-table fields), Add Column, Group By with aggregates, Show Totals, sort, filters, **Save As** named report, Export, Print, Setup Auto Email, Set Chart | `frappe/public/js/frappe/views/reports/report_view.js`, `frappe/core/doctype/report/` (`report_type` Report Builder/Query/Script/Custom) |
| Query/Script report page | Filter bar defined by the report, result grid with tree/indent, optional chart on top, totals row, print with letter head, export, **prepared report** (queued in background, Generate New Report) | `frappe/public/js/frappe/views/reports/query_report.js`, `frappe/core/doctype/prepared_report/` (status Queued/Started/Completed/Error, peak memory) |
| Report permissions | Report → roles; disabled flag; timeout; `add_total_row` | `frappe/core/doctype/report/report.json` |

### Other builders

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Dolibarr | **Custom reports** | Pick object type; measures (count/sum/avg of fields), X axis, group-by; table and graph modes; also embeddable as a tab on an object | `htdocs/core/customreports.php` (`search_measures`, `search_xaxis`, `search_groupby`, `search_graph`) |
| Akaunting | Custom report from report class | Name, class (Income, Expense, Income vs Expense, Profit & Loss, Tax, Discount), description, class-specific fields: date field/range, basis (cash/accrual), period (monthly/quarterly/yearly), group, filters (category, account, contact, item, tax, warehouse, currency) | `resources/views/common/reports/{create,edit,index}.blade.php`, `app/Abstracts/Report.php` (strip/display/filter sections), `app/Reports/*.php` |
| ERPNext | Financial Report Template | Row-based custom financial statements (account categories, formulas) feeding Custom Financial Statement report | `erpnext/accounts/doctype/{financial_report_template,financial_report_row,account_category}/`, `erpnext/accounts/report/custom_financial_statement/` |
| Moqui baseline | SimpleReport / Data Views | See §16: DataDocument-based "Edit and Report Builder" (fields with an optional min/max/sum/avg/count/count-distinct function, conditions) and DbViewEntity data views | `component/mr-marble/screen/SimpleScreens/SimpleReport/`, `components/base/tools/screen/Tools/Data/Views/` |

---

## 6. Pivot & graph views over list data

The design already calls for switchable views on every find screen (list, kanban,
calendar, pivot, graph), generalized in mr-moqui forms and lists (initial-design). Insights
reuses the same pivot/graph renderer for its widgets and adds "add to dashboard". Whether
the renderer is framework code or an Insights component was an open question (§17). mr-moqui
`plans/archive/Monitoring.md` now plans the panel renderers and the pivot transformation as framework
code; the find-screen view modes themselves are not in that plan.

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Pivot view | Row/column group-bys from search, Measures menu (incl. Count), Expand all / collapse, Flip axis, Download xlsx, totals; header click drills into the list | `odoo/addons/web/static/src/views/pivot/{pivot_controller.xml,pivot_model.js,pivot_renderer.js}` |
| Odoo | Graph view | Bar/Line/Pie, Stacked, Cumulative, sort, measures | `odoo/addons/web/static/src/views/graph/` |
| Odoo | Analysis report models | Each app's **Reporting** menu is pivot/graph over a SQL-view model: `sale.report`, `account.invoice.report`, `purchase.report`, `crm.activity.report`, `project.report`, `report.stock.quantity`, `pos.order.report`, `timesheets.analysis.report`, `hr.leave.report`, `mailing.trace.report`, `fleet.vehicle.cost.report`, `vendor.delay.report`, … | `odoo/addons/{sale,account,purchase,crm,project,stock,point_of_sale,hr_timesheet,hr_holidays,mass_mailing,fleet,purchase_stock}/report/*_report.py` (`_auto = False`) |
| Carbon | Analytics pivot reports | `/x/reports/analytics/<key>`: revenue (by customer), expenses/assets/inventory-change (by location), scrap (by scrap reason); up to 2 row dimensions, column axis by period (month/quarter/year) or dimension, measure amount/quantity/count, percent of column total, sort, filters, all in URL; saved **report views** (Private/Company); CSV export | `apps/erp/app/routes/x+/reports+/analytics.$reportKey.tsx`, `apps/erp/app/modules/accounting/accounting.models.ts` (`analyticsReports`, `pivotStateValidator`, `reportViewValidator`) |
| Frappe framework | Group-by sidebar & report view group-by | List sidebar counts by field; report view Group By with aggregates | `frappe/public/js/frappe/views/reports/report_view.js`, `frappe/desk/doctype/list_view_settings/` (`disable_sidebar_stats`) |
| Twenty | View aggregates | Per-column aggregate footer (count, sum, avg, min, max, percent empty) and group-by in record table views; kanban grouped by select field | `packages/twenty-front/src/modules/object-record/record-table/record-table-footer/`, `packages/twenty-shared/src/types/AggregateOperations.ts`, `packages/twenty-front/src/modules/views/` |
| Dolibarr | Module stats pages | Fixed per-module statistics: counts/amounts by month and year with graphs, filter by user/third party/status | `htdocs/{commande,comm/propal,compta/facture,expedition,reception,contrat,fichinter,ticket,projet,expensereport,salaries,don,adherents,product}/stats/` |
| OpenProject | Time and costs report | Filters (project, work package, user, activity, cost type, dates, custom fields, …); **group-bys as rows and as columns** (pivot) including week/month/year; units tabs (labor and each cost type); Save / Save as with a **public** option; XLS export and PDF timesheet export. In BOSS this report belongs to Projects; it is the only reference pivot over time and cost entries | `modules/reporting/app/controllers/cost_reports_controller.rb`, `modules/reporting/app/models/cost_query/{filter,group_by}/`, `modules/reporting/lib/widget/{filters,group_bys,table,cost_types}.rb`, `modules/reporting/lib/widget/controls/save_as.rb`, `modules/reporting/app/workers/cost_reports/{xls/export_job.rb,pdf/export_timesheet_job.rb}` |

---

## 7. Canned report catalogs & report pages

| App | Catalog | What's in it | Key files |
| --- | --- | --- | --- |
| ERPNext | Per-module report lists on workspaces (Card Breaks such as Sales Reports, Customer Reports, Sales Team Reports) | About 195 report directories: 56 Accounts (P&L, Balance Sheet, Cash Flow, Trial Balance, Financial Ratios, AR/AP aging, Gross Profit, Profitability Analysis, Budget Variance, consolidated statements, …), 55 Stock, 23 Selling (Sales Analytics with tree type Customer Group/Customer/Item Group/Item/Territory/…, Quotation Trends, Sales Order Analysis, target variance by person/partner/territory, inactive customers, …), 21 Manufacturing, 10 Buying, 9 CRM, 5 Projects, 4 Support, a few in Assets, Subcontracting, Regional | `erpnext/<module>/report/`, `erpnext/selling/workspace/selling/selling.json`, `erpnext/selling/report/sales_analytics/sales_analytics.js` |
| ERPNext | Analytic pages | Sales Funnel page; Stock Balance and Warehouse Capacity Summary pages; Production Plan visualizer; BOM comparison | `erpnext/selling/page/sales_funnel/`, `erpnext/stock/page/{stock_balance,warehouse_capacity_summary}/`, `erpnext/manufacturing/page/{production_plan_visualizer,bom_comparison_tool}/` |
| Carbon | **Reports hub** inside Accounting with **pins** (pin/unpin per report) and saved views; full-screen report pages: Income Statement, Balance Sheet, Trial Balance (drill to account), **Executive P&L**, AR/AP aging, Inventory valuation (+ reconcile), Purchases, Deferred Revenue Waterfall, Lease Liabilities, Net Investment in Leases, Rental Utilization, and the analytics pivots Revenue, Expenses, Assets, Inventory, Scrap (§6) | `apps/erp/app/routes/x+/accounting+/reports.tsx` (`getReportPins`, `upsertReportPin`, `getReportViews`), `apps/erp/app/routes/x+/reports+/*.tsx` |
| Ever Gauzy | Reports menu | All reports, time reports, weekly time, manual time, time-limit, apps & URLs (activity), amounts owed, payment, expenses, project budgets, client budgets | `apps/gauzy/src/app/pages/reports/*/` |
| Akaunting | Reports index | Income Summary, Expense Summary, Income vs Expense, Profit & Loss, Tax Summary, Discount Summary; each with chart, filter bar, print, export | `app/Reports/*.php`, `resources/views/common/reports/index.blade.php`, `resources/views/reports/` |
| Dolibarr | Accounting results & turnover | Results (client/supplier, by project), turnover by product/service, by user, by customer, by country/VAT rate, supplier turnover by product/third party | `htdocs/compta/resultat/{index,clientfourn,projects,result}.php`, `htdocs/compta/stats/*.php` |
| Odoo | App **Reporting** menus | Pivot/graph analysis per app (see §6) plus PDF/QWeb printable reports | `odoo/addons/*/report/` |

---

## 8. Saved reports, views & favorites

| App | Feature | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Favorites (`ir.filters`) | Save current search (domain, group-by, sort, context) as a favorite on an action; private or shared with users; default filter | `odoo/odoo/addons/base/models/ir_filters.py`, `odoo/addons/web/static/src/search/{custom_favorite_item,search_bar_menu}/` |
| Odoo | Add to my dashboard | Push the current list/graph/pivot (with its search) onto the user's board | `odoo/addons/board/static/src/add_to_board/` |
| Odoo | Dashboard favorite filters | Named global-filter sets per dashboard; default; shared with users | `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard_favorite_filters.py` |
| Frappe framework | Saved reports & list settings | Report Builder **Save As** creates a `Report` (type Report Builder, JSON settings); per-user list view settings; sidebar saved filters; kanban boards saved per DocType | `frappe/core/doctype/report/`, `frappe/desk/doctype/{list_view_settings,list_filter,kanban_board}/` |
| Frappe Insights | Favorites & folders | Favorite dashboards; folders inside workbooks for queries and charts | `frontend/src2/dashboard/DashboardList.vue`, `insights/insights/doctype/insights_folder/` |
| Carbon | Report views & pins | Named pivot configs, Private or Company visibility; pinned reports on the hub | `apps/erp/app/modules/accounting/accounting.models.ts` (`reportViewValidator`, `reportPinValidator`, `reportViewVisibilities`), `apps/erp/app/routes/x+/reports+/views.$viewId.delete.tsx` |
| OpenProject | Saved cost reports | Save / Save as a cost report query, private or public | `modules/reporting/lib/widget/controls/{save,save_as}.rb` |
| Twenty | Views | Saved views per object (table/kanban/calendar), filters, sorts, visible fields, group-by; views feed dashboard widgets (VIEW, RECORD_TABLE) | `packages/twenty-front/src/modules/views/` |
| Moqui baseline | Saved finds | `form-list saved-finds="true"` stores column sets and parameters as `FormListFind` per user/group; `FormConfig` per user | `components/base/framework/entity/ScreenEntities.xml` (`FormListFind*`, `FormConfig*`) |

---

## 9. Scheduled delivery, digests & alerts

| App | Feature | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | **Auto Email Report** | Report + filters + dynamic date period (Daily, Weekly, Monthly, Quarterly, Half Yearly, Yearly; first day of period), frequency Daily/Weekdays/Weekly/Monthly, day of week, format HTML/XLSX/CSV/PDF, row limit, **send only if data**, recipients, sender account | `frappe/email/doctype/auto_email_report/auto_email_report.json` |
| Frappe Insights | **Alerts** | On a query: frequency Hourly/Daily/Weekly/Monthly/Cron, condition (builder or custom code), Markdown message with field tokens, channel **Email/Telegram/Webhook** (versioned payload, token header, row cap), runs with the permissions of whoever enabled it; last/next execution | `insights/insights/doctype/insights_alert/`, `frontend/src2/query/components/{AlertSetupDialog,QueryAlerts,QueryAlertsDialog}.vue`, `frontend/src2/query/alert.ts`; ADR `docs/adr/outbound-http-to-user-chosen-urls.md` |
| Odoo | **Digest emails** | Periodic KPI email (daily/weekly/monthly/quarterly) to selected users; KPIs are Boolean fields, each with a compute method in code, contributed by modules: Revenue, All Sales, eCommerce Sales, POS Sales, New Leads, Opportunities Won, New Employees, Open Tasks, Deliveries, Receipts, Visitors, Tracked Page Views, Livechat conversations / % of happiness / time to answer, event registrations and attendees, survey participants, Connected Users, Messages Sent; subscribe/unsubscribe; tips | `odoo/addons/digest/models/digest.py`, `odoo/addons/digest/views/{digest_views,digest_templates}.xml`, `odoo/addons/digest/data/ir_cron_data.xml`; KPI fields in `odoo/addons/{account,crm,event,hr_recruitment,im_livechat,point_of_sale,sale_management,stock,survey,website,website_sale,website_slides}/models/digest.py` and `odoo/addons/project/models/digest_digest.py` |
| metasfresh | KPI staleness | `KPI_AllowedStaledTimeInSec` cache; websocket push of dashboard updates | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/dashboard/websocket/` |
| Moqui baseline | **ScreenScheduled** | Scheduled render of a report screen (with a saved find) by cron to CSV (default), xlsx or PDF (`xsl-fo`), email to a user or user group via `EmailTemplate`, or save to a resource location; skip if no results. A ServiceJob runs `render#ScheduledScreens` every 15 minutes | `components/base/framework/entity/ScreenEntities.xml` (`ScreenScheduled`, `ScreenScheduledLock`), `components/base/framework/service/org/moqui/impl/ScreenServices.xml` (`render#ScheduledScreens`, `render#ScheduledScreen`), `components/base/framework/data/MoquiSetupData.xml` (`render_ScheduledScreens_frequent`) |
| ServiceJobMonitor | Monitor bounds & alerts | Watches ServiceJob results against bounds (`ServiceJobMonitorBounds`); alerts with notified parties and issue URLs; charts | `screen/MonitorAdmin/{Alerts,Charts,Monitor}.xml`, `entity/` |

---

## 10. Sharing, public links & embedding

| App | Feature | What it is | Key files |
| --- | --- | --- | --- |
| Frappe Insights | Visibility & share dialog | Chart/dashboard **Visibility** Private/Roles/Everyone/Public; share to named users (read); copy public link or iframe snippet; only workbook editors can widen; visitors get no drill, rows or files; amounts in site currency | `frontend/src2/dashboard/DashboardShareDialog.vue`, `frontend/src2/charts/components/{ChartShareDialog.vue,chart_share.ts}`, `frontend/src2/workbook/WorkbookShareDialog.vue`, `frontend/src2/{dashboard/SharedDashboard,charts/SharedChart}.vue`; `insights_dashboard_v3.visibility` |
| Frappe Insights | **Islands** | Insights dashboards/charts mount inside desk Dashboards/Dashboard Charts and workspace pages (shadow root), so the module dashboard can be an Insights one | `frontend/src2/islands/{DashboardIsland,ChartIsland}.vue`, `docs/features.md` §desk |
| Odoo | Dashboard share links | Token links (`spreadsheet.dashboard.share`) with frozen Excel export; public dashboard page | `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard_share.py`, `static/src/public/public_dashboard.{js,xml}` |
| Odoo | Dashboard access | Per dashboard: access groups, allowed users, companies, published flag | `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard.py` |
| Twenty | Dashboard iframe widget | IFRAME widget embeds external pages into dashboards | `packages/twenty-front/src/modules/page-layout/widgets/iframe/`, `side-panel/pages/page-layout/components/dashboard/SidePanelDashboardIframeSettings.tsx` |
| Akaunting | Dashboard users | Dashboards assigned to users | `resources/views/common/dashboards/edit.blade.php` |

---

## 11. Data sources, data store & semantic layer

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe Insights | Data source list & connect dialogs | Site DB plus external databases; the doctype allows MariaDB, PostgreSQL (schema), SQLite, DuckDB, BigQuery, ClickHouse and a **REST API** type (auth: none, API key / bearer token, basic), but the SPA has connect dialogs only for MariaDB, PostgreSQL, ClickHouse and DuckDB; test connection; SSL with CA; credentials never reach non-admins; upload a CSV, Excel or JSON file as a table | `frontend/src2/data_source/{DataSourceList,Connect*Dialog,UploadCSVFileDialog}.vue`, `insights/insights/doctype/insights_data_source_v3/` |
| Frappe Insights | Tables & links | Table list per source with search and re-sync; **table links** (stored joins) suggest joins | `frontend/src2/data_source/{DataSourceTableList,DataSourceTable}.vue`, `insights/insights/doctype/insights_table_v3/`, `insights/insights/doctype/insights_table_link_v3/` |
| Frappe Insights | **Data store** | Site-local DuckDB copy of source tables with cron import schedule, scripted import jobs (sandboxed), atomic import, compaction; settings for max memory/records | `frontend/src2/data_store/{DataStoreList,ImportTableDialog}.vue`, `insights/insights/doctype/insights_table_import_job/`, `insights/insights/doctype/insights_table_import_log/`, `frontend/src2/settings/DataStoreSettings.vue` |
| Frappe Insights | Settings | Auto-execute, query result limit/expiry, subquery, permissions toggle, allow download + max export rows, fiscal year start, week start, max execution time, Telegram token, allowed embed origins | `insights/insights/doctype/insights_settings/`, `frontend/src2/settings/{GeneralSettings,PermissionsSettings,UsersSettings}.vue` |
| metasfresh | KPI definition | SQL from/where/group-and-order, details where clause, source table, Elasticsearch index/query/time range, apply security settings | `backend/de.metas.ui.web.base/src/main/java-gen/de/metas/ui/web/base/model/{I_WEBUI_KPI,I_WEBUI_KPI_Field}.java` |
| Odoo | Reporting models | Analysis = SQL views registered as read-only models (see §6); spreadsheet data sources reference models + domains | `odoo/addons/*/report/*_report.py`, `odoo/addons/spreadsheet/` |
| Moqui baseline | Data documents, data views, OLAP tables | `DataDocument` (primary entity + field paths with optional aggregate function + conditions + links, per user group), queryable as a dynamic view entity `DataDocument.<id>`; `DbViewEntity` (user-built joins and aliases with functions); `moqui.olap.DateDayDimension` and `CurrencyDimension` exist but nothing populates or reads them. The Mantle `*Dimension` entities (`ProductDimension`, `PartyDimension`, `MarketSegmentDimension`, …) are measurement values (size, weight, counts with a UOM), not analytics dimensions | `components/base/framework/entity/{EntityEntities,OlapEntities}.xml`, `component/mr-marble/screen/SimpleScreens/SimpleReport/ViewReport.xml` |

---

## 12. Analytics content permissions

| App | Model | Key files |
| --- | --- | --- |
| Frappe Insights | Roles Insights Admin / User; **teams** granted data sources and tables (table restrictions); workbook share as viewer/editor; member write follows workbook; **Run as owner** check on charts (rows filtered by owner vs reader); permlevel columns "held back"; denied = Not Found; viewers get no operations/SQL | `insights/insights/doctype/{insights_team,insights_team_member,insights_resource_permission}/`, `frontend/src2/teams/{TeamList,CreateTeamDialog,ManageTeamDialog,TeamResourceSelector}.vue`, `insights/permissions.py`, `docs/features.md` §permissions |
| Frappe framework | Report → roles; Dashboard Chart → roles; Number Card is_public; workspace roles; user permissions applied to report rows | `frappe/core/doctype/report/`, `frappe/desk/doctype/{dashboard_chart,number_card,workspace}/` |
| Odoo | Dashboard groups/users/companies; record rules apply to pivots | `odoo/addons/spreadsheet_dashboard/models/spreadsheet_dashboard.py` |
| Carbon | `requirePermissions(view: "accounting")` on reports; report view Private/Company | `apps/erp/app/routes/x+/reports+/*.tsx` |
| metasfresh | KPI permissions provider + "apply security settings" | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/kpi/data/KPIPermissionsProvider.java` |
| Moqui baseline | `DataDocumentUserGroup`; artifact authz on screens; `EntityFilterSet` row filters | `components/base/framework/entity/{EntityEntities,SecurityEntities}.xml` |

---

## 13. Business flow map & process documentation

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Moqui baseline | **MarbleERP dashboard flow map** | Top: search box and quick counters (Sales Placed/Approved/Held orders by `entity-find-count` on `OrderPart`; customer Requests Submitted/In Progress on `RequestAndParty`), each a link into the filtered find screen. Body: three **sequence diagrams** (actor + arrowed items): **Customers** (with a Marketing link) → Customer Requests, Sales Orders & Quotes, Sales Shipments, Shipping pick & pack, Receivable Invoices, Customer Credit Memos, Customer Payments, Sales Returns & RMA, Customer Return Shipments, Payable Return Invoices, Outgoing Refund Payments; **Internal** → HR/Employees, Requests, Products/Catalog, Assets/Inventory, Manufacturing, Projects/Tasks, All Parties, Facilities, Stores, Content (Wiki, Blogs, Surveys), Accounting/Reports, Custom Reports/Report Builder; **Suppliers** → Purchase Requests, Purchase Orders & Quotes, Purchase Shipments, Payable Invoices, Supplier Credit Memos, Supplier Payments, Purchase Returns, Supplier Return Shipments, Receivable Return Invoices, Incoming Refund Payments. Every item is a link with a parameter map into a find screen; the steps themselves show no counts | `component/mr-marble/screen/marble/dashboard.xml` (styles `diagram-sequence`, `diagram-sequence-actor`, `diagram-sequence-item`) |
| coarchy | **Process stories** | Nested process stories (substories, show/hide), activities with actor and action, value statements, checklists, recurrence (every day, Mon–Fri, monthly), copy/move between organizations | `screen/coarchy/cointernal/{Process.xml,Process/,Actor.xml,ViewActors.xml,ValueStatements.xml,Checklist.xml}` |
| Frappe framework / ERPNext | Module onboarding, workspace link cards and shortcuts | Onboarding steps per module and link-card groups act as a map of what to do in what order; workspace **shortcuts** carry a live count badge (`stats_filter`, `format` such as "{} Open") | `frappe/desk/doctype/{module_onboarding,onboarding_step,workspace_shortcut}/`, `erpnext/selling/workspace/selling/selling.json` |
| Frappe Insights | Lineage graph | Workbook dialog: table → query graph with search and click-to-open (a data-flow map); the agent lineage API also walks to the charts, dashboards and filter links that read a query | `frontend/src2/workbook/WorkbookLineageDialog.vue`, `insights/api/ai/lineage.py` |

No reference app ships a clickable business-process map with live counts on each step.
The Marble diagram is the closest (links on every step, counts only in its header strip);
Frappe workspace shortcuts show that a link with a live count badge is cheap to define as
data.

---

## 14. AI & agent-assisted analytics

| App | Feature | Key files |
| --- | --- | --- |
| Frappe Insights | Agent tooling: workbook skill, run an unsaved pipeline, profile a column (row/null/distinct counts, range, top values), verify a workbook (every query/chart runs, every dashboard item readable), query lineage in one call; all respect caller access | `insights/api/ai/{lineage,search,verify}.py`, `skills/insights-workbook-cli/`, `docs/features.md` §tooling |
| Twenty | AI agent chat over CRM data | `packages/twenty-front/src/modules/ai/`, `packages/twenty-front/src/pages/ai-chat/` |
| Carbon | ERP agent module | `apps/erp/app/modules/agent/` |

---

## 15. Cross-app surfaces

| Reused screen or link | Use in Insights | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Dashboard widgets** (crosscut §3) | The number card, chart, table, text and link-list widget types and their builder; Insights dashboards are built from them, and the same definition renders on an Insights dashboard and on a landing page | Every app's landing page | Frappe framework Number Card and Dashboard Chart reused on workspaces and desk dashboards; Insights islands render Insights charts inside desk dashboards; OpenProject one grid/widget model for My page and project Overview; Twenty widgets shared by dashboards and record pages |
| **Landing pages & KPIs** (crosscut §4) | Cross-app dashboards and the management digest, over the same widget types the landing pages use | Every app (its own landing page) | ERPNext module workspaces and Home workspace; Carbon module homes with a KPI selector; Dolibarr home work board |
| **Drill to records** | Drill rows and table cells open the reused record screen with an Insights context: Order detail, Customer 360, Supplier 360, Product 360, Request / case, Task / work item, Shipment detail, Employee 360, Facility & equipment record | The apps crosscut §3 lists for each screen (for example Order detail: Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce; Customer 360: Sales, Customer Service, Marketing, Accounting, Commerce) | Insights `charts.drill-record-link` and `charts.table-record-link` open desk documents; Odoo pivot header click opens the list; metasfresh KPI zoom-into-details window |
| **Per-app reports** | One report catalog listing every app's report pages with pins and saved views, and scheduling them | Each app (its own report pages: Accounting financial reports, Sales reports, …) | Carbon reports hub with pins inside Accounting; ERPNext workspace report card breaks; Odoo per-app Reporting menus |
| **Switchable views on find screens** | The same chart renderer for widgets, plus **Add to dashboard** | Every find screen, through the mr-moqui form-list (initial-design "Switchable views") | Odoo pivot/graph on every action plus board **Add to my dashboard**; Frappe query report Create Card / Add Chart to Dashboard; Twenty views feed dashboard widgets |
| **Header Notifications & Today panel** | KPI alerts post to the header Notifications panel; header counts (tasks due, overdue) are readings the same widget definition can feed | The header in every app | Insights alerts; Mantle `get#UserNoticeCounts`; framework `NotificationMessage` |
| **Email sending** (crosscut §4) | Scheduled reports, alerts and the digest send through Comms accounts and templates | Comms (accounts, sending, tracking); Marketing; Customer Service; Admin (relay) | Frappe Auto Email Report sender account; Odoo digest; Moqui `ScreenScheduled` with `EmailTemplate` |
| **User groups, log retention, settings index** | Dataset and dashboard access by user group; retention of query run logs and `ArtifactHit`; the Insights settings section, linked from the settings index | Admin (groups, log settings, settings index) | Insights teams and table restrictions; Insights execution-log retention through Log Settings (`data-store.execution-log-retention`); tools ArtifactHit and Visit screens |
| **Time and cost report** | A pivot Insights could reuse | Projects | OpenProject time and costs report |
| **Assist** | Assist answers analytics questions over the same datasets and reads dashboards through `screen_use` | Assist in every app | Insights agent APIs (profile, verify, lineage); Twenty AI chat; Carbon agent module |

**BOSS implications.** The evidence casts Insights as a provider more than a destination: the
widget component it includes is also on every landing page, its catalog fronts reports the
apps include, and its drill rows hand off to the reused record screens. What the references
put in the analytics app itself is the dashboards, the builders, the catalog, delivery and
alerts, datasets, and (for BOSS) the flow map.

---

## 16. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline has hand-written report screens, a DataDocument report builder, saved finds and
scheduled renders, but no dashboard object, widget definition, chart builder or alert. All
paths are relative to `mr-moqui-base/runtime`.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Marble dashboard | Search, five header counters and the clickable flow map (§13) | `component/mr-marble/screen/marble/dashboard.xml` |
| Marble root | Mounts SimpleScreens apps (Accounting, Asset, Catalog, Customer, Facility, HumanRes, Manufacturing, Order, Party, Project, ProductStore, Gateway, Request, Return, Shipment, Shipping, Supplier, Survey, Task, Wiki) | `component/mr-marble/screen/marble.xml` |
| Accounting report list | Balance Sheet, Income Statement, Cash Flow, Retained Earnings, Financial Ratios, Sales Summary, Sales Order Analysis, Sales Invoice Analysis, Customer Statement PDF, Order Item Summary, Order Issued and Invoiced, Invoice Item Summary, Quick Aging, Invoice Aging Detail, AR Aging Summary, Invoice Reconciliation, Account Ledger, Account Balance History (year/quarter/month), Posted Amount/Balance Summary, Inventory Valuation, Receipt Transactions, Status by Receipt, On Hand, On Hand Summary, Shipment Package Summary | `component/mr-marble/screen/SimpleScreens/Accounting/Reports/ReportList.xml`, `component/mr-marble/screen/SimpleScreens/Accounting/Reports/*.xml` |
| Sales summary charts | Chart and stats panels on the sales summary, over `get#SalesOrderSummary` | `component/mr-marble/screen/SimpleScreens/Accounting/Reports/SalesSummary{Charts,Stats}.html.{ftl,fancy}`, `component/mr-marble/template/account/LedgerCharts.xml` |
| Accounting dashboard | Org internal summary | `component/mr-marble/screen/SimpleScreens/Accounting/{dashboard.xml,dashboard/OrgInternalSummary.xml}` |
| Other module dashboards | Link pages for HumanRes, Asset, Manufacturing, Catalog, Shipping | `component/mr-marble/screen/SimpleScreens/{HumanRes,Asset,Manufacturing,Catalog,Shipping}/dashboard.xml` |
| Budget report, project progress | Single-purpose reports | `component/mr-marble/screen/SimpleScreens/Accounting/Budget/BudgetReport.xml`, `component/mr-marble/screen/SimpleScreens/Project/ProjectProgressReport.xml` |
| **SimpleReport** (Edit and Report Builder) | Find/create a report = `DataDocument` (name, primary entity, user group); edit field paths with optional function (min, max, sum, avg, count, count-distinct, upper, lower) and conditions; view as a dynamic form-list over the `DataDocument.<id>` view with CSV/XLSX export and saved finds; quick view | `component/mr-marble/screen/SimpleScreens/SimpleReport/{FindReport,EditReport,EditReport/FieldList,ViewReport,QuickViewReport}.xml` |
| Tools Data Views | Build a `DbViewEntity` (member entities, aliases with functions, key maps) and view results | `components/base/tools/screen/Tools/Data/Views/{FindDbView,EditDbView,ViewDbView}.xml` |
| System Data Documents | Edit/search/export data documents; feed index | `components/base/tools/screen/System/DataDocument/{Edit,Search,Index,ViewDocument}.xml`, export in `components/base/tools/screen/Tools/Data/Export.xml` |
| System usage stats | Artifact hit summary and bins, visits (tools screens, also in Admin) | `components/base/tools/screen/System/{ArtifactHitSummary,ArtifactHitBins,Visit}.xml` |
| Scheduled finds (My Account) | The user's scheduled report renders: screen path + saved find, cron (with picker and description), render mode, email template/subject, save-to location, no-results skip, from/thru | `component/mr-marble/screen/MyAccount/User/{ScheduledFinds.xml,ScheduledFinds/EditScheduledFind.xml}` (copied to `component/mr-boss/screen/Base/User/ScheduledFinds/`) |
| IronStone BOSS today | The BOSS root screen mounts QuickSearch, Search, QuickLookup and **SalesSummary**; copies of SalesAnalysis and SimpleReport are in the component but not mounted yet | `component/mr-boss/screen/boss.xml`, `component/mr-boss/screen/{Reports,SimpleReport}/` |

### Data model available

| Entity | What it gives Insights | Key files |
| --- | --- | --- |
| `moqui.entity.document.DataDocument` (+ `DataDocumentField` with `functionName`, `DataDocumentCondition`, `DataDocumentRelAlias`, `DataDocumentLink`, `DataDocumentUserGroup`) | A named, permissioned dataset over a primary entity with relationship paths and aggregate functions; links per document | `components/base/framework/entity/EntityEntities.xml` |
| `moqui.entity.feed.DataFeed`, `DataFeedDocument` | Push of changed documents to a service (search index, document notifications) | same |
| `moqui.entity.view.DbViewEntity` (+ Member, Alias with `functionName`, KeyMap) | User-defined joins and aliases | same |
| `moqui.screen.form.FormListFind` (+ Field, User, UserDefault, UserGroup), `FormConfig` (+ Field, User, UserGroup) | Saved finds (columns, parameters, sort) per user or group | `components/base/framework/entity/ScreenEntities.xml` |
| `moqui.screen.ScreenScheduled`, `ScreenScheduledLock` | Scheduled report renders to email (user or user group) or a resource location | same |
| `moqui.security.user.NotificationTopic`, `NotificationMessage` (+ `NotificationTopicUser`, `NotificationMessageUser`) | Topic-based notifications for alerts | `components/base/framework/entity/SecurityEntities.xml` |
| `moqui.security.EntityFilterSet`, `EntityFilter` | Row-level filters that apply to a viewer's queries | same |
| `moqui.basic.email.EmailTemplate` | Email layout for scheduled reports and digests | `components/base/framework/entity/BasicEntities.xml` |
| `moqui.olap.DateDayDimension`, `CurrencyDimension` | Date and currency dimension tables; defined, never populated or read | `components/base/framework/entity/OlapEntities.xml` |
| `moqui.server.ArtifactHit`, `ArtifactHitBin`, `Visit` | Usage stats (retention settings are in Admin) | `components/base/framework/entity/ServerEntities.xml` |
| Mantle flow-map counts: `OrderPart` (`statusId`), `Request` (and view `RequestAndParty`), `Shipment`, `Invoice`, `Payment`, `ReturnHeader` | The records whose status counts a live flow map shows per step | `component/mr-mantle/entity/{OrderEntities,RequestEntities,ShipmentEntities,AccountingAccountEntities}.xml`, `component/mr-mantle/entity/RequestViewEntities.xml` |

Missing: any dashboard, widget, widget placement, KPI/number-card definition, alert or flow-map
record. The Mantle `*Dimension` entities are measurements, not analytics dimensions (§11).
mr-moqui `plans/archive/Monitoring.md` plans the dashboard, panel and alert definitions; the flow map is
not part of it (see
[Framework tooling planned in mr-moqui](#framework-tooling-planned-in-mr-moqui)).

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `org.moqui.impl.EntityServices.{create,update,clone}#DataDocument`, `{create,update}#DataDocumentField`, `create#DbViewEntity` | Report builder writes (used by SimpleReport) | `components/base/framework/service/org/moqui/impl/EntityServices.xml` |
| `org.moqui.impl.EntityServices.send#DataDocumentNotifications` | DataFeed receiver: a `NotificationMessage` per changed document to the users named in it (change-triggered, not threshold) | same |
| `org.moqui.search.SearchServices.{index,search}#DataDocuments` | Index and search documents | `components/base/framework/service/org/moqui/search/SearchServices.xml` |
| `org.moqui.impl.ScreenServices.render#ScheduledScreens`, `render#ScheduledScreen` | Run due `ScreenScheduled` rows (CSV, xlsx, PDF) and email or save them; ServiceJob `render_ScheduledScreens_frequent` every 15 minutes | `components/base/framework/service/org/moqui/impl/ScreenServices.xml`, `components/base/framework/data/MoquiSetupData.xml` |
| `mantle.sales.SalesReportServices.get#SalesOrderSummary`, `get#SalesInvoiceSummary`, `get#SalesTopProduct`, `get#InvoicesByCustomerClass` | Sales KPIs and chart data | `component/mr-mantle/service/mantle/sales/SalesReportServices.xml` |
| `mantle.ledger.LedgerReportServices.run#{IncomeStatement,BalanceSheet,CashFlowStatement,RetainedEarningsStatement,FinancialRatios,PostedAmountSummary}`, `get#PeriodSeriesSummary`, `get#AccountLedgerInfo` | Financial statements and period series (the report pages are in Accounting) | `component/mr-mantle/service/mantle/ledger/LedgerReportServices.xml` |
| `mantle.other.BudgetReportServices.run#BudgetExpenseReport`, `run#BudgetExpenseDetailReport` | Budget vs actual | `component/mr-mantle/service/mantle/other/BudgetReportServices.xml` |
| `mantle.work.ProjectServices.get#ProjectStats`, `get#ProjectMilestoneSummary`, `get#WorkEffortChildStats` | Project progress figures | `component/mr-mantle/service/mantle/work/ProjectServices.xml` |
| `mantle.party.PartyServices.get#UserNoticeCounts` | Notification, message, event and task counts for the header | `component/mr-mantle/service/mantle/party/PartyServices.xml` |

Missing: services to evaluate a widget definition (dataset + measure + grain + period +
comparison), to check alert conditions, and to count flow-map steps. The mr-moqui plan covers
the first two, with a generic report query service and alert rule evaluation.

---

## 17. Gaps & BOSS implications

### Gaps in the reference set

- **No community spreadsheet dashboard editor in Odoo.** `spreadsheet_edition` is Enterprise
  and absent; community Odoo ships the dashboard reader, the engine and per-app JSON
  dashboards only. Odoo financial reports (`account_reports`) are Enterprise too.
- **No process map with live step counts.** No reference has it (§13); Marble has links on
  every step and counts only in the header; Frappe shortcuts show count badges on plain links.
- **No alert on the same KPI definition a landing page shows.** Insights alerts sit on a
  query, Frappe Number Cards have no threshold or alert fields, and Odoo digest KPIs are fields
  computed in code. BOSS would have to join these itself.
- **Narrow pivots.** Carbon's analytics pivots run only over GL accounts (`accountScope`), and
  OpenProject's pivot only over time and cost entries; only Odoo pivots any model, and only
  Insights has a general query builder.
- **Insights data sources.** The doctype allows SQLite, BigQuery and REST API sources, but the
  SPA ships connect dialogs only for MariaDB, PostgreSQL, ClickHouse and DuckDB.
- **No Moqui-native reference** beyond ServiceJobMonitor (alerts and charts over ServiceJob
  results) and coarchy (process stories).

### Notable gaps in the Moqui baseline

- **No dashboard object.** Module dashboards are hand-written screens; there is no
  user-arrangeable dashboard, no widget registry, no number-card or chart definition stored
  as data.
- **No chart builder.** Charts exist only in a few FTL templates; nothing lets a manager
  turn a list into a chart (Frappe Create Card / Add Chart to Dashboard, Odoo graph view,
  Twenty GRAPH widget, OpenProject work package graph).
- **Report builder has aggregates but no analysis.** SimpleReport (DataDocument) has fields,
  per-field functions (sum, count, …, grouping by the other fields), conditions, CSV/XLSX and
  saved finds, but no date grain, pivot, calculated measure, period comparison, totals or
  chart.
- **No pivot/graph view mode** on find screens.
- **No alerts.** ScreenScheduled can email a report on cron (My Account → Scheduled Finds),
  but it is per user and buried in My Account; DataDocument notifications fire on record
  changes, not on a measured condition (compare Insights alerts, Odoo digest).
- **Flow map is static XML** with five hand-coded header counters; it is not data-driven, not
  editable, and shows no count on each step.
- **OLAP tables are empty.** `DateDayDimension` and `CurrencyDimension` are defined but never
  filled or used.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Frappe Insights | Reader vs author split (dashboards vs workbooks); query as operation pipeline; chart types incl. Number readings with period, comparison, target and sparkline; drill rows/breakdown with record links; dashboard filters linked to chart columns; visibility Private/Roles/Everyone/Public + run-as-owner; alerts over email/Telegram/webhook; data store; agent verify/profile/lineage APIs; ship standard workbooks as files, read-only on the site |
| Frappe framework / ERPNext | Number Card and Dashboard Chart as reusable data definitions placed on workspaces and dashboards; workspace block editor; shortcuts with count badges; Report Builder (save as, group by, totals); query reports with prepared (background) runs and Create Card / Add Chart to Dashboard; Auto Email Report with "send only if data" |
| Odoo | Pivot/graph on every list; SQL-view analysis models per app; favorites and "add to my dashboard"; dashboards in sections with sample data until real data exists; global filters with saved sets; digest email with module-contributed KPIs; token share links |
| Twenty | Dashboards as records with tabs; widget side panel (chart, view, iframe, rich text, app components); chart over a saved view |
| Carbon | Pinned reports hub; URL-encoded pivot state with saved views (Private/Company); executive P&L and revenue waterfall pages; per-module KPI selector |
| OpenProject | One grid/widget model (grid rows × columns, widgets with start/end row/column and options) for personal and project pages, with a per-grid widget registry and edit permission; pivot with row and column group-bys and public saved reports |
| Ever Gauzy | Widget registry with size constraints, supported widths, required context and permission; multiple custom dashboards per user; layout stored in DB or local storage |
| metasfresh | KPI with comparison offset and allowed staleness; target indicator widget; zoom-into-details |
| Dolibarr | Global work board ("to process / late" counts per module) as the owner's first screen; custom report screen embeddable as a tab |
| Akaunting | Small-business report set with basis/period/grouping and a filter bar |
| coarchy | Process stories with actors and substories as editable process documentation |
| ServiceJobMonitor | Moqui-native bounds and alert records with notified parties |

### Candidate screen inventory (IronStone Insights)

| Area | Screens |
| --- | --- |
| Home | Insights home: favorite and recent dashboards, pinned reports, cross-app "needs attention" board (counts to process / late per app, Dolibarr-style), digest preview |
| Dashboards | Dashboard list (sections, favorites, search); dashboard viewer (filters, number cards with period/comparison/target/sparkline, charts, tables, text, drill); dashboard editor (grid, breakpoints, add widget from registry, link filters) |
| Widgets | **Dashboard widgets** **(reused: every app's landing page)**: number card editor and chart editor over a dataset (entity, DataDocument or report service); chart types Number, Bar, Line, Row, Donut, Funnel, Table/pivot, Heatmap, Map as a later candidate; **Add to dashboard** from any find screen; each app's landing page includes the same widgets with its own context |
| Drill | Drill dialog (rows, breakdown, breadcrumbs); rows open the reused record screens: Order detail **(reused: Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce)**, Customer 360 **(reused: Sales, Customer Service, Marketing, Accounting, Commerce)**, Supplier 360 **(reused: Purchasing, Accounting, Products, Warehouse)**, Product 360 **(reused: Products, Commerce, Purchasing, Manufacturing, Warehouse, Accounting, Sales)**, Request / case **(reused: Customer Service, Purchasing, Maintenance, Projects, Sales, Warehouse, Commons)**, Task **(reused: Projects, Commons, Customer Service, Sales, People)**, Shipment detail **(reused: Warehouse, Customer Service, Sales, Purchasing, Commerce, Accounting)**, Employee 360 **(reused: People, Admin, Projects, Commons)**, Facility & equipment record **(reused: Maintenance, Warehouse, Manufacturing, Commons, Accounting)** |
| Report builder | Dataset editor (primary entity + related fields, functions, conditions, calculated fields, date grain); analysis view (group-by, measures, pivot, totals, chart); SQL/script mode for admins only, a later candidate |
| Saved reports | Report catalog by app with pins; saved views (private / group / everyone); each app's canned reports registered into the catalog (each app includes its own report pages) |
| Delivery & alerts | Scheduled report (a promoted Scheduled Finds: cron, format, recipients incl. groups, send only if data, sent through Comms); KPI alert (condition on a reading → header notification, email, chat, webhook); management digest (periodic KPI email) |
| Sharing | Share dialog (users, groups, embed; public link with token as a later candidate) and a read-only shared dashboard page |
| Flow map | Business flow map viewer (actors, steps, live counts, links into apps) and editor (steps as data, linked to find screens and saved views); process story pages linked from steps |
| Data | Datasets admin (DataDocuments, view entities, user groups); data refresh jobs |
| Settings | Insights settings section (week start, export limits, public links on/off), linked from the Admin settings index |

### Data-model findings

- **Records that fit:** `DataDocument` (with `DataDocumentField.functionName`,
  `DataDocumentCondition`, `DataDocumentLink`, `DataDocumentUserGroup`) and `FormListFind`
  could be the dataset and saved-view basis instead of a new query store; they lack date
  grain, calculated fields and pivot settings. `ScreenScheduled` + `EmailTemplate` fit
  scheduled reports, `NotificationTopic` / `NotificationMessage` alert delivery,
  `EntityFilterSet` row rules (run as the viewer by default), and `UserGroup` access.
- **Where new records look necessary** (none exist in the framework or Mantle): dashboard
  (title, section, visibility, owner); dashboard widget placement (dashboard, widget,
  start/end row and column per breakpoint, options; OpenProject's grid widget is the closest
  model); widget definition (type, dataset, measures, dimension and grain, period,
  comparison, target, format), one option being a single definition used by dashboards and
  landing pages; dashboard filter and filter-to-column links; KPI alert (widget or dataset,
  condition, frequency, channel, recipients, run-as user, last/next run); report catalog
  entry and pin (screen path, app, user pins); flow map → lane (actor) → step (label, target
  screen + parameter map or saved find, count definition, sequence).
- **Planned in mr-moqui:** `plans/archive/Monitoring.md` plans one saved-definition entity, holding JSON
  definitions with versions and named references. It covers:
  - the dashboard, with widget placement in its layout tree
  - the widget definition, as a library panel
  - dashboard filters, as variables
  - the KPI alert, as an alert rule
  - the dataset, and scheduled reports

  The report catalog entry, pins and the flow map are not in it.
- **Flow-map counts** can read Mantle status fields: `OrderPart.statusId`, `Request.statusId`
  (`RequestAndParty` for the customer role), `Shipment`, `Invoice`, `Payment`, `ReturnHeader`.
  Marble's three lanes are candidate seed data.
- `moqui.olap` dimension tables are needed only if the report builder needs a date
  dimension; date grain can be computed in the query instead.

### Sequencing notes

- **Cheap on the baseline:** datasets and saved views (DataDocument with functions and
  `FormListFind` exist); scheduled reports (Scheduled Finds already render on cron, though
  per user and buried in My Account); report catalog entries for the SimpleScreens
  accounting reports (the report screens exist); flow-map counts (status fields exist; the
  Marble map gives the steps).
- **Dependencies:** dashboards, the widget component on landing pages and "add chart/card to
  dashboard" from find screens all depend on the new dashboard and widget records; the
  find-screen entry point also depends on the framework form-list's switchable views; drill
  rows depend on the reused record screens accepting an Insights context; KPI alerts depend
  on widget definitions and on notification topics; the management digest depends on
  scheduled delivery and widget readings. In the mr-moqui plan's milestones, panels and frames
  are M2, dashboards and widget records are M3, alerts are M6, and scheduled dashboard reports
  are M7.
- **Expensive:** SQL/script queries, external data sources and a data store, map, sankey and
  bubble charts, public links, alert conditions beyond thresholds, and agent APIs have no
  baseline support.

### Framework tooling planned in mr-moqui

mr-moqui `plans/archive/Monitoring.md`, section "Dashboards and reports" (Oct 25, 2026), plans the
tooling below as framework pieces. It has its own **Dashboards** app in the tools component, at
menu-index 96, with these screens:
- dashboard
- Dashboard
- Explore
- Panels
- Datasets
- Alerts
- Reports
- Annotations

The concepts come from Grafana (ideas only, since it is AGPL) and OpenSearch Dashboards.
Monitor uses the tool first. A business dashboard on `mantle_sales`, shipped from mr-mantle, is
its check that business reporting works. Section names in the table are those of
`plans/archive/Monitoring.md`.

| Insights area | Planned framework piece | Plan section | Milestone | Not covered by the plan |
| --- | --- | --- | --- | --- |
| Dashboards | Dashboard list (starred, recent, folders, tags) and Dashboard view and edit with versions; `m-dashboard`; panels kept apart from a layout tree (24-column grid, auto grid, rows, tabs); variables (query, custom, ad hoc filters, group-by) synced to the URL; relative and fiscal time ranges; kiosk mode and playlists | Dashboards | M3 | Per-breakpoint arrangements |
| Widgets | Panels: stat (sparkline, percent change against the previous period), time series, bar, pie, gauge, table (footer totals), heatmap, text. Field config: units (currency from `Uom`), thresholds, value mappings from StatusItem/Enumeration, entity lookups for id keys, data links. **Library panels** as the one widget registry. An XML element that places a saved panel or dashboard on any screen (landing pages, record pages) | Panels, Dashboards | M2 (time series, stat, table), M3 (the rest) | Number-card target and gap; funnel and map are later; "Add to dashboard" from find screens |
| Drill | Click-to-filter on bars, slices and cells; data links to record and find screens; Explore with "add to dashboard" | Report queries, Panels, Explore | M3 | A drill dialog with rows, breakdown and breadcrumbs |
| Report builder | Datasets over DataDocuments (field defaults, `DataDocumentUserGroup`, row filters added on the server); report queries as an ordered aggregation list (metric, x-axis, split series, split rows) with date grain; server-side transformations (group by, calculated fields, pivot with totals, compare to the previous period); a service source for computed reports such as the ledger statements | Datasets, Report queries, Frames and transformations | M3 (telemetry datasets in M2) | SQL or script queries; joins across datasets beyond join by time |
| Saved reports | Saved definitions (dashboards, library panels, saved searches) with versions, references, export and import; components ship definitions read-only, changed by "save as copy" | Definitions | M3 | Report catalog with pins |
| Delivery & alerts | Scheduled dashboard reports extending `ScreenScheduled` (several dashboards with their own time and variables, PDF/PNG/CSV/xlsx, send only if data, preview, send now). Alert rules on report queries (pending period, recovery threshold, No Data state) routed to NotificationMessage topics, email and webhook, with silences and mute timings; "New alert rule" from a panel | Alerts, Scheduled reports and sharing | M6 (alerts), M7 (reports) | The management digest as its own feature; Telegram |
| Sharing | Links with an absolute time range; embeds in other screens | Scheduled reports and sharing | M7 | Public links (deferred) |
| Data | Datasets screen; queries run on the SearchFacade indexes the DataFeeds fill (`mantle_sales`, `mantle_inventory`, `mantle`), through an authorized generic report query service | Datasets, Report queries | M3 | `moqui.olap` tables stay unused |
| Flow map, Home board | None | | | Not covered |

### Open questions

- Is the Insights widget the same object as each app's landing-page tile (one registry), or
  do apps have hand-built landing screens that embed widgets? This file assumes one
  registry. *The mr-moqui plan takes one registry:* library panels, placed on any screen by
  an XML element.
- Pivot and graph view modes on find screens: initial-design puts switchable views in the
  framework form-list; should the pivot/graph renderer be framework code that Insights reuses,
  or an Insights component the framework loads? (Not settled in crosscut §3–§4.) *The mr-moqui
  plan makes the renderers framework code* (`m-report-panel`, the pivot transformation). It
  does not plan the find-screen view modes.
- How far does the report builder go: DataDocument + functions + grain, or a pipeline model
  like Insights operations? *The mr-moqui plan uses a dataset over a DataDocument, an
  aggregation list with date grain, and a pipeline of server-side transformations.* It has no
  SQL or script mode.
- Do we need a site-local analytics store (DuckDB-like) for heavy reports, or are view
  entities on the main DB enough for target businesses? Should the empty `moqui.olap` tables
  be filled or ignored? *The mr-moqui plan reads the SearchFacade indexes that DataFeeds fill*,
  on Postgres or OpenSearch, and does not use `moqui.olap`.
- Should the flow map be one fixed suite map, or editable per business (coarchy-style
  process stories) with the suite map as the default?
- Does the cross-app "needs attention" board on the Insights home duplicate the header Today
  panel and each app's landing page, or is it the business owner's view across them?
- Public/anonymous dashboard links: allowed at all given the self-hosting audience? *The
  mr-moqui plan defers them.*

### Checkout path quirks

- Frappe Insights backend: doctypes are at `insights/insights/doctype/`, but the API and
  permission code sit one level up (`insights/api/`, `insights/permissions.py`).
- Frappe framework desk routes are `/desk/…` in this checkout (for example
  `/desk/dashboard-view/<name>`), not `/app/…`.
- AureusERP puts most plugin widgets in `src/Filament/Widgets/`, but POS and website widgets
  in `src/Filament/Admin/Widgets/`.
- metasfresh generated model interfaces live under `src/main/java-gen/`, separate from
  `src/main/java/`.

**Bottom line.** The references agree on the shape: number cards and charts as stored
definitions placed on many pages, a query or dataset under them, drill to rows, saved views,
and scheduled delivery. Moqui already has the dataset (DataDocument with functions), saved
finds and scheduled renders, so the gap the research finds is mostly new dashboard and widget
records plus their screens, with drill handing off to the reused record screens. mr-moqui's
planned dashboards and reports tool supplies most of those records and screens as framework
pieces ([Framework tooling planned in mr-moqui](#framework-tooling-planned-in-mr-moqui)).
