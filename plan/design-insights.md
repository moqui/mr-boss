# IronStone BOSS — Insights design

Nov 12, 2026 — the leftovers of the screens move below (mr-moqui plans/archive/Admin-Screens-Down.md, Leftovers): what the grants decide of scheduling and setting an alert (§7, §8), what `reportLinks` and `reportPolicy` pass (§4, §8), an owner-mode schedule's timing changed, the framework's default alert email, playlist creation held by the editor link and Analysis' calendar from the policy. Nov 11, 2026 — the generic screens are the framework's Dashboards screens, shown under Insights' root ([mr-moqui plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md), Track I): §4.2 says which and how each is shown, and §4, §5, §7, §8, §11, §14 and §15.2 are corrected to it. Nov 7, 2026 — implementation plan written ([impl-insights.md](impl-insights.md)), built with Admin in one order ([impl-admin.md](impl-admin.md) §1); the corrections its P0 found are made here (impl-insights F2, F4, F5, F18), and those of its review the same day (SalesAnalysis, valuation and stock transactions as Accounting's sources, the recipient cap defaults, wall-display registration). Nov 1, 2026 — draft; reviewed against research-insights.md, the reference apps and the other designs (review-suite-apps.md, removed in mr-boss bd74564: `git show bd74564^:plan/review-suite-apps.md`).

IronStone Insights serves owners, management and authorized analysts. It brings together dashboards and KPIs, a report builder, saved and scheduled reports, management digests, business alerts and clickable documentation of business flows. Each application remains the owner of its business rules, operational reports and measures. Insights makes those measures useful together and makes their meaning, scope and source visible. The first release delivers personal schedules and alerts, and group delivery only to recipients whose data scope equals the owner's (§7.1).

**Inputs.** [research-insights.md](research-insights.md); [initial-design.md](initial-design.md); [design-doc-guide.md](design-doc-guide.md); [style-guide.md](style-guide.md); [design-crosscut.md](design-crosscut.md); [design-drawers-commons.md](design-drawers-commons.md); the Sales, Marketing, Customer Service, Commerce, Products, Purchasing, Warehouse, Manufacturing, Maintenance, Accounting, People and Projects designs; [design-admin.md](design-admin.md); [ss-inventory.md](ss-inventory.md); [usl-inventory.md](usl-inventory.md); the framework [Monitoring design](../../../../../plans/archive/Monitoring.md#dashboards-and-reports) and [built reporting guide](../../../../../docs/tools/Monitoring.md); [application practices](../../../../../docs/dev/Practices-App-Dev.md).

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home-and-management-attention) · [4 dashboards](#4-dashboards-and-panels) · [5 builder](#5-exploration-and-report-builder) · [6 catalog and measures](#6-report-catalog-and-domain-metrics) · [7 delivery](#7-scheduled-reports-and-management-digests) · [8 alerts](#8-business-alerts) · [9 flows](#9-business-flow-maps) · [10 shared records](#10-shared-screen-contexts) · [11 settings](#11-settings-and-data-readiness) · [12 later](#12-later-capabilities) · [13 coverage](#13-coverage-and-acceptance) · [14 outputs](#14-documents-and-outputs) · [15 needs](#15-framework-and-data-needs) · [16 decided](#16-decided) · [17 open](#17-open)

## 1. Shell

### 1.1 Root, roles and authority

Root `screen/Insights.xml`, route `Insights`, uses `sym_o_insights` and the existing `BOSS_INSIGHTS` artifact group. The current `BOSS_INSIGHTS_ADMIN` and ADMIN grants in BossSetupData are active; the root's comment saying the grant is commented out is stale. Existing routes are a mixture of working framework mounts, copied baseline screens and placeholders.

The root retains existing `mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed `ironstone.insights.ContextServices.get#Context` returns authorized organization choices, capabilities, safe shell context and canonical links. Permissions are checked in the services as well as the screen root. Application access, dashboard sharing, a supplied organization or another app's edit permission never grants underlying record or field access.

| App term | Proposed group or existing administrator | Permissions and responsibility |
| --- | --- | --- |
| reader (R) | BOSS_INSIGHTS_READ | INSIGHTS_VIEW; read permitted definitions, catalog entries and scoped results; each source still requires its domain view permission |
| author (A) | BOSS_INSIGHTS_AUTHOR | INSIGHTS_VIEW, INSIGHTS_AUTHOR; create own analyses, panels and dashboards from admitted sources; share with an authorized group |
| dataset steward (D) | BOSS_INSIGHTS_DATA | INSIGHTS_VIEW, INSIGHTS_DATASET_VIEW, INSIGHTS_DATASET_EDIT; manage admitted business datasets and their documented scope; no unrestricted entity, service or telemetry access |
| distributor (S) | BOSS_INSIGHTS_DISTRIBUTE | INSIGHTS_VIEW, INSIGHTS_SCHEDULE and INSIGHTS_DISTRIBUTE; schedule to approved internal users/groups and inspect safe delivery outcomes; personal scheduling adds INSIGHTS_SCHEDULE to the reader's grants |
| flow editor (F) | BOSS_INSIGHTS_FLOW | INSIGHTS_FLOW_EDIT with INSIGHTS_VIEW; copy and maintain maps for authorized organizations; no operational action permission |
| app administrator (C) | BOSS_INSIGHTS_ADMIN | INSIGHTS_VIEW, INSIGHTS_SETTINGS_VIEW, INSIGHTS_SETTINGS_EDIT and explicitly granted app capabilities; business data, payroll, costs and account administration remain separate grants |

These groups and permissions are rows of crosscut §1.4's capability table, beside every other app's. Groups map to permissions and framework artifact grants in setup data; services never test group names. The `INSIGHTS_*` permissions are BOSS's, checked by `ironstone.insights` services and screens; the framework engine checks its own artifacts (the ReportServices operations, each dataset's `org.moqui.report.dataset.<id>`, dataset saves, DataDocumentUserGroup rows), which setup grants to these groups by capability ([impl-insights](impl-insights.md) §4, F2, F4). Every Insights user is in the root user group `BOSS_INSIGHTS` (the launcher, navigation only) and a capability group; because the root's inheritable grant reaches every service an Insights screen calls, every engine operation is denied to the root user group and the app administrator, and only the capability groups' grants (reading, authoring, scheduling) pass that deny, so an operation the framework adds fails closed (impl-insights P1, P2). The dashboard and panel editors are the author's and steward's area (denied to the root user group and the administrator). Insights grants only the shared framework screen/service artifacts its capabilities require; using a mount does not require another app's launcher grant or broad `DASHBOARDS_APP`/Tools access. Dataset artifacts, definition ownership and source authorization remain enforced. Do not give business authors `REPORT_DATASETS_ADMIN`, broad System access or the telemetry dataset pattern merely to make an editor work. A domain service-source adapter independently enforces its view and export permissions.

Private definitions are owner-readable; group sharing uses the framework's existing group grant. Sharing does not share the source data. First-release individual collaboration uses an explicitly managed group; a separate per-user definition ACL is not invented. All live queries run as the viewer. BOSS scheduled outputs and value-bearing business alerts go only to recipients who may see exactly what the owner sees, one message each, in the first release; execution as each recipient is later (§§7–8). General external delivery and anonymous dashboard links are later.

### 1.2 Menu, presentation and shell providers

- Home — `Home`
- Dashboards and KPIs
  - Dashboards — `Dashboards`; Library panels — `Panels`; Wall display — `Playlists`
- Report builder
  - Explore — `ReportBuilder/Explore`; Analysis — `ReportBuilder/Analysis`; Datasets — `ReportBuilder/Datasets`
- Reports
  - Reports — `Reports`; Saved reports — `SavedReports`
- Delivery and alerts
  - Scheduled reports — `ScheduledReports`; Management digest — `ManagementDigest`; Business alerts — `Alerts`
- Business flows
  - Flow map — `Flows/FlowMap`; Maps — `Flows/FlowMaps`
- Settings
  - Settings — `Settings`; Data readiness — `Settings/DataReadiness`

As in the other apps, a top-level entry with no path is a menu group, and each child names its own path. Detail and contextual routes (Dashboard, DashboardEditor, PanelDetail, Drill, dataset detail, fields and preview, schedule, delivery and alert records, FlowMapEditor, ProcessStory) are hidden from the menu. Owner application reports open their canonical routes. Later screens are absent from released menus until built. Home shows favorites, recently opened dashboards, pinned reports and an organizational attention board. A first-use state offers an authorized shipped dashboard and report catalog; it does not fill empty business data with sample numbers.

XML is the default. Framework report editor/dashboard widgets remain framework widgets with their existing TUI twins; they do not become BOSS `.qvue` forks. The business map draws its body with the framework node-graph panel beside an ordered accessible list/tree equivalent (§9). Lists use server paging, names, useful mobile columns and selected-row context. Each record has one primary action and a More menu; destructive or wide effects name the affected definition, schedule or recipient count in confirmation.

The `insights` keymap starts with `g s` for Home (`g i` is Comms' global Inbox key); each phase adds the keys of what it builds. Palette contributions find authorized dashboards, saved reports (P4: `ContextServices.search#Records`) and flow maps, with `recordEntity` and `recordId` on each row. Quick create offers Dashboard, Analysis and Schedule by capability. Today receives only a person's actionable report failure or review assignment, not every KPI reading. Business alert and report-completion topics use the Commons Notifications/Updates distinction; general completion belongs in Updates. Push titles carry the rule or report name, never a value. The management attention board is not a second personal Today queue. **Needs:** INS-01, INS-10.

**Stack contributions** (crosscut §1.5):
- **Assist and MCP analytics (CX-ASSIST).** Assist answers analytics questions over admitted metrics and draws charts from the same authorized query, through `write_ui` canvases.
  - mr-boss ships an `insights-analyst` procedure skill with `screens:` on Dashboard, Explore and Reports.
  - The Insights root's `shell-providers` declare `assist-prompt` chips: "Explain this number", "Compare with last period", "Which source is stale?". A `response-action` "Add to my dashboard" saves an Assist-drawn panel as the user's own panel Definition.
  - `AgentToolExposure` READ rows: proposed `ironstone.insights.RegistryServices.find#Reports` and `get#Metric`, and existing `org.moqui.report.ReportServices.run#Query` limited to admitted datasets. Each runs as the user, so a tool never sees more than the user's screens. `exposeMcp` is Y for datasets classified as business operations and N for People, payroll and cost datasets.
  - Assist receives safe definition IDs, filters, metric descriptions and authorized frames, and never inherits a schedule owner's authority.
  - Prerequisites: the Mantle active-organization user-facts provider ([Remaining-Work](../../../../../plans/Remaining-Work.md) "Apps"), so Assist knows the organization a query is about, and the framework per-field AI opt-out for confidential text.
  - **As built (impl-insights P10, Nov 10, 2026).** The skill is `skill/insights-analyst.md`; the three prompts and the response action are on the root. The tools are `AgentToolExposure` READ rows, each run as the user: `insights_find_reports` and `insights_get_metric` (`find#Reports`, `get#Metric`; Assist and MCP), and `ironstone.insights.AssistServices`: `insights_panel` (`run#PanelQuery`: a saved dashboard panel's own result by definition and panel id, the dashboard's number with its exclusions), `insights_datasets` and `insights_query` (`find#QuerySources`, `run#DatasetQuery`: one aggregate from Analysis' typed choices, never a query language). The engine's `run#Query` itself is not exposed: an exposure row is per service, so a raw query could not be held to a dataset's class. Each dataset has a class (`ironstone.insights.DatasetClass`, its owner's seed row: business operations, costs and margins, People and payroll); an unclassified one answers neither surface. Assist reads a cost dataset and a cost or margin field only for a holder of `PRODUCT_COST_VIEW`; the MCP twins (`insights_operations_panel`, `insights_operations_datasets`, `insights_operations_query`) never do, whatever the user holds. A saved panel is checked before it runs (the P10 review): every dataset any of its queries names is held to its class and a panel that names a cost or margin field in its queries or transformations is refused, since a panel's result is all of its queries' frames under names its author chose; a repeated panel and one whose query takes a name from a variable are not read by a tool. "Add to my dashboard" opens `Insights/AddToDashboard` with the answer; the query the answer ends with (its `Panel:` line, typed choices only) is saved through `AnalysisServices.store#Analysis` as the author's library panel, optionally on a dashboard of their own, so it needs Insights authoring; a reader is told so.
- **Shipped report definitions (CX-OPS-REPORTS).** Insights admits each app's shipped `report/*.json` datasets, dashboards and alert templates (§5, §6.1). It ships its own suite dashboard and flow-map templates.
- **Wall display.** Playlists rotate dashboards in kiosk mode (§4).
- **Comms hooks, Sync, mail intake and devices.** None.

### 1.3 Verified foundation and automation

The research's Oct 25 description of the reporting tool as planned is superseded by built source, not by a second design of that engine.

| Verified source | Existing capability and design consequence |
| --- | --- |
| Framework `entity/ReportEntities.xml` | `moqui.report.Definition`, DefinitionVersion, DefinitionReference, DefinitionGitSync/DefinitionGitFile, AlertInstance, AlertRuleLock and AlertNotification exist. Reuse them; no parallel BOSS dashboard or alert-rule store. |
| Framework `service/org/moqui/report/ReportServices.xml` | Existing `org.moqui.report.ReportServices` supplies queries, documents, datasets, dashboard rendering, definitions and versions, dependency uses, import/export, schedules and alerts. Called **ReportServices** below after this full qualification. |
| Tools `screen/Dashboards/` | Home, Dashboard, Definition, Explore, Split, Panels, Datasets, Alerts, AlertRule, AlertShared, Reports, Annotations, Playlist and GitSync exist. Framework editors include `m-report-definition-editor` and `m-report-composition-editor`. |
| Framework widgets and guide | `<report-embed>` and the dashboard/panel widgets render authorized frames in browser, TUI and outputs. Funnel, geomap and node graph already exist alongside stat/table/time-series/bar/pie/gauge/heatmap. They are not missing dependencies. |
| BOSS `screen/Insights/` | Dashboards and Dashboard wrap the framework screens; existing edit/Explore links escape to Tools. ReportBuilder contains DataDocument authoring; Reports is a legacy document selector; ScheduledReports contains copied personal scheduled finds. Replace their behavior deliberately, with compatibility mapping in §13. |
| Framework `entity/ScreenEntities.xml`, `crates/moqui-report/src/schedule.rs` | ScreenScheduled and ScreenScheduledLock are the scheduler foundation. Current report execution renders as owner once and sends the same output to all recipients in one message. The first release adds the owner-equivalence check and separate messages (§7.1); execution as each recipient is later (§7.2). |
| Framework report dataset security (`crates/moqui-report/src/lib.rs`; [Monitoring guide](../../../../../docs/tools/Monitoring.md) "Security") | Dataset artifacts, DataDocumentUserGroup and server row filters exist: `rowFilter`, `contextFilters` from the signed-in identity, and `rowFilterService`. The framework says application organization ACLs belong in `rowFilterService`. Existing EntityFilterSet filters are **not** translated into SearchFacade filters, so each business dataset needs its filter (INS-03). |
| Framework `report` Definition kinds | Definition types are dashboard, panel, dataset, search, alert, report, contactPoint, silence and muteTiming (`definitions.rs`). A `report` carries a `body.kind`, as Tools `Dashboards/Playlist.xml` uses kind `playlist`. Flow maps use the same mechanism (§9). |
| Mantle `report/` and DataFeeds | Shipped: datasets `mantle-sales-orders` (MantleSalesOrderPart) and `mantle-sales-items`, dashboard `mantle-sales`, and alert template `mantle-sales-daily-floor`. None has a row filter. DataFeeds `MantleSales`, `MantleInventoryData` and `MantleSearch` fill the `mantle_sales`, `mantle_inventory` and `mantle` indexes; no inventory dataset definition is shipped yet. Their measures need business admission: an ungrouped mixed-currency sum displaying as a plain number is not an acceptable management total. |
| Current Mantle report services | SalesReportServices (`run#SalesAnalysis`, `get#SalesOrderSummary`, `get#SalesInvoiceSummary` with `productStoreIds`), LedgerReportServices (statements, `run#Aging`, `run#PartnerLedger`, `run#InvoiceReconciliation`), FinanceReportServices, BudgetReportServices, ProjectReportServices and `mantle.product.InventoryReportServices` (`run#InventoryValuation`, `run#StockTransactions`, `get#InventoryProjectedInfo`, and Warehouse P17's `get#InventoryAtDate` and `find#OperationsHistory`) exist. Use the authorized domain projection appropriate to the measure; older summary functions are not automatically authoritative because they exist. |
| Framework `ReportServices.create#Annotation`; Tools `Dashboards/Annotations.xml` | Time-series annotations exist. Insights uses them for business events (§4). |

Existing jobs and rules stay visible in the design:

| Job/rule | Existing behavior | Disposition |
| --- | --- | --- |
| `render_ScheduledScreens_frequent` → `org.moqui.impl.ScreenServices.render#ScheduledScreens` | Finds due ScreenScheduled rows; `render#ScheduledScreen` dispatches reportDefinitionId rows to `ReportServices.run#ScheduledReport`, other rows to legacy rendering | Keep one scheduler. Add the owner-equivalence check and separate messages for business schedules (§7.1), and route both definition and admitted legacy-find schedules through it; no second BOSS cron engine. |
| `evaluate_ReportAlerts_minute` → `ReportServices.evaluate#Alerts` | Evaluates saved alert rules as their owner; shipped rules become active only after copying to an owner | Keep job and per-rule claims. A business group alert evaluates once as owner, which is valid for owner-equivalent recipients, and notifies each separately; recipient-scoped evaluation is later. Technical owner mode is unchanged. |
| `FrameworkPullDefinitionGitSyncs`, `service/Git.gitecas.xml` | Git ref updates pull registered definition folders; committed saves can push their files | Keep optional framework behavior. Admin/Tools owns setup and credentials; imported/pulled business definitions pass admission checks and never activate distribution implicitly. |
| DataFeed/DataFeedDocument source indexing; `org.moqui.search.SearchServices.index#DataFeedDocuments` | Changed business documents feed SearchFacade indexes after commit | Keep domain feed registration and after-commit processing. A dataset is admitted only on a registered feed with a built index (§5). Readiness shows index lag. Failed indexing does not roll back an independent business commit. |
| `ReportAlert` topic and existing email delivery | The current topic is private and in Updates; technical alert contacts support notification/email/webhook | Keep technical policy. Business topics and contacts use §8; do not copy owner values into ordinary group notifications. |

No additional broad EECA, wildcard SECA or entity write guard is introduced by this design. Business annotations (§4) are written by owner post-commit hooks the owning apps register; they are reads of committed facts and change no business state. Domain services retain their own posting, lifecycle and notification rules; report reads do not trigger business mutations. **Needs:** INS-03, INS-06, INS-07, INS-09, INS-11.

## 2. Screens

Paths are relative to BOSS. Role letters are §1.1; all rows additionally require their source's view permission. Framework reuse rows have a Context passed block below; forms describe the BOSS-specific additions only. Form dialogs without their own subscreens remain on their parent. How each framework screen is shown (by location, a wrapper, or Insights' own screen around its sections) is §4.2.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Insights/Home | landing | xml (built P1; panels, attention and pins P5) | Show management priorities and frequently used analysis | scoped provider results | own §3 | R | new | organization, period, authorized selection |
| Dashboards | Insights/Dashboards | list | xml (built P2) | Find and favorite dashboards | moqui.report.Definition | framework Home, §4 | R,A | new | definition filters |
| Dashboard | Insights/Dashboard | report | xml (built P2; meaning P4) | Read a dashboard with consistent filters | moqui.report.Definition | framework Dashboard, §4 | R,A | new | definition, version, range, variables |
| DashboardEditor | Insights/DashboardEditor | editor | xml (built P2) | Compose panels and layouts | moqui.report.Definition | framework Definition, §4 | A | new | definition, expected version |
| Panels | Insights/Panels | list | xml (built P2) | Find reusable number cards and charts | panel Definition | framework Panels, §4 | R,A | new | panel filters |
| PanelDetail | Insights/PanelDetail | editor | xml (built P2; measure, target and dependencies P4) | Configure and inspect one library panel | panel Definition | framework Definition, §4 | A; R view | new | panel, metric, range |
| Playlists | Insights/Playlists | list | xml (built P2; wall displays P11) | Rotate dashboards in kiosk mode on a wall display | `report` Definition, kind `playlist` | framework Playlists and Playlist, §4 | R; A edit | new | playlist definition |
| WallDisplay | Insights/WallDisplay | report (hidden; a bare page) | xml (built P11) | Play a playlist on a wall display, a registered device's page | `report` Definition, kind `playlist` | framework WallDisplay, §4 | R; a display account | new | playlist (a device's registered one) |
| Drill | Insights/Drill | detail (a hidden page; a linear task in the terminal) | xml (built P6) | Explain a selected value and reach source rows | authorized frame/query | own, around framework Drill, §4 | R | new | metric, bucket, original query scope |
| Explore | Insights/ReportBuilder/Explore | report | xml (built P2) | Explore an admitted dataset | dataset and saved search Definition | framework Explore, §5 | A; R saved | new | dataset, query, range |
| Analysis | Insights/ReportBuilder/Analysis | editor | xml (built P6) | Build aggregates, pivot and comparison | panel/search Definition | own, around framework Analysis, §5 | A | new | query, measures, dimensions |
| Datasets | Insights/ReportBuilder/Datasets | list | xml (built P3) | Find approved business data sources | DataDocument, dataset Definition | framework Datasets, §5 | A,D | parity | dataset filters |
| DatasetDetail | Insights/ReportBuilder/DatasetDetail | settings | xml (built P3) | Maintain a governed dataset | DataDocument, dataset Definition | framework DatasetDetail, §5 | D | parity | dataset, scope policy, version |
| DatasetFields | Insights/ReportBuilder/DatasetFields | settings | xml (built P3) | Define allowed fields and conditions | DataDocumentField/Condition | framework DatasetFields, §5 | D | parity | dataDocumentId, field selection |
| DatasetView | Insights/ReportBuilder/DatasetView | report | xml (built P3) | Preview authorized detail rows | admitted dataset | framework DatasetView, §5 | A,D | parity | dataset, filters, range |
| Reports | Insights/Reports | list | xml (built P4) | Index every permitted application report | proposed ReportCatalogEntry | own §6 | R | parity | app, report, filters |
| SavedReports | Insights/SavedReports | list | xml (built P4; a legacy find shown not valid P12) | Find named analyses, saved finds and pins | Definition, FormListFind, pins (UserPreference) | own §6 | R,A | parity | type, owner, selected saved report |
| ScheduledReports | Insights/ScheduledReports (the list is its default subscreen, `Schedules`) | list | xml (built P7) | Manage personal and approved group delivery | ScreenScheduled | framework Schedules, §7 | R with schedule right; S | parity | schedule filters |
| ScheduledReportDetail | Insights/ScheduledReports/ScheduledReportDetail | detail | xml (built P7) | Configure recipients, timing and output | ScreenScheduled | framework ScheduledReportDetail, §7 | owner/S | parity | schedule, definition, safe audience summary |
| ReportDelivery | Insights/ScheduledReports/ReportDelivery | detail | xml (built P7; Export status P12) | Inspect an occurrence and retry failed recipients | proposed report occurrence/delivery | framework ReportDelivery, §7 | owner/S; recipient own result | new | occurrence, own delivery or safe status |
| ManagementDigest | Insights/ManagementDigest | editor | xml (built P7) | Compose a recurring management summary | report Definition | framework composition, §7 | A,S | new | definition, range, selected panels |
| Alerts | Insights/Alerts (the list is its default subscreen, `Rules`) | list | xml (built P8) | Find and manage scoped business alerts | alert Definition | framework Alerts, §8 | R; A/S edit | new | authorized rule filters |
| AlertDetail | Insights/Alerts/AlertDetail | detail | xml (built P8) | Define a condition and inspect own state | alert Definition, AlertInstance | framework AlertRule, §8 | A/S; R own state | new | rule, own series, scope |
| FlowMaps | Insights/Flows/FlowMaps | list | xml (built P9) | Select suite templates and organization copies | `report` Definition, kind `flowmap` | own §9 | R,F | new | organization, map filters |
| FlowMap | Insights/Flows/FlowMap | report | xml (built P9; Print P12) | Explain business flows with authorized links and counts | `report` Definition, kind `flowmap`, and its versions | own §9 | R | parity | map, organization, period, selected step |
| FlowMapEditor | Insights/Flows/FlowMapEditor | editor | xml (built P9) | Edit lanes, steps and documentation links | `report` Definition, kind `flowmap` | own §9 | F | new | map, expected version |
| ProcessStory | Insights/Flows/ProcessStory | editor | qvue (built P9: an xml mount of Commons Knowledge's qvue) | Read a step's existing process documentation | WikiPage | Commons Knowledge, §9 | page readers; separately authorized authors | parity | wikiPageId, map/step return context |
| OrderDetail | Insights/Records/OrderDetail | detail | xml (built P6, read only: InsightsRecord) | Inspect a permitted source order | OrderHeader | crosscut §3.6 | domain readers | parity | orderId, part, report return |
| Customer360 | Insights/Records/Customer360 | 360 | xml (built P6, read only: InsightsRecord) | Explain a customer measure | Party | crosscut §3.2 | domain readers | parity | partyId, period, report return |
| Supplier360 | Insights/Records/Supplier360 | 360 | xml (built P6, read only: InsightsRecord) | Explain supplier activity | Party | crosscut §3.3 | domain readers | parity | partyId, period, report return |
| Product360 | Insights/Records/Product360 | 360 | xml (built P6, read only: InsightsRecord) | Explain a product measure | Product | crosscut §3.5 | domain readers | parity | productId, organization, report return |
| RequestDetail | Insights/Records/RequestDetail | detail | xml (built P6, read only: InsightsRecord) | Inspect an authorized case/request source | Request | crosscut §3.11; Projects §6 | domain readers | parity | requestId, report return |
| WorkItemDetail | Insights/Records/WorkItemDetail | detail | xml (built P6, read only: InsightsRecord) | Inspect an authorized work source | WorkEffort | crosscut §3.12; Projects §5 | domain readers | parity | workEffortId, report return |
| ShipmentDetail | Insights/Records/ShipmentDetail | detail | xml (built P6, read only: InsightsRecord) | Explain a logistics measure | Shipment | crosscut §3.8 | domain readers | parity | shipmentId, report return |
| Employee360 | Insights/Records/Employee360 | 360 | xml (with People, impl-people P2) | Inspect permitted employment context | Party, Employment | People §4; crosscut §3.4 | authorized People readers | parity | party/employment, report return |
| FacilityDetail | Insights/Records/FacilityDetail | detail | xml (built P6, read only: InsightsRecord) | Inspect a measured facility | Facility | crosscut §3.10 | domain readers | parity | facilityId, report return |
| EquipmentDetail | Insights/Records/EquipmentDetail | detail | xml (built P6, read only: InsightsRecord) | Inspect a measured asset | Asset | crosscut §3.10 | domain readers | parity | assetId, report return |
| InvoiceDetail | Insights/Records/InvoiceDetail | detail | xml (built P6, read only: InsightsRecord) | Explain a permitted invoice/bill value | Invoice | crosscut §3.16 | financial readers | parity | invoiceId, report return |
| Settings | Insights/Settings | settings | xml (built P10, at `Insights/Settings/AnalyticsSettings`) | Set organization analytics defaults | organization settings | own §11 | C; R safe defaults | new | organization, setting version |
| DataReadiness | Insights/Settings/DataReadiness | list | xml (built P10) | Explain source readiness and failures | provider status/provenance | own §11 | A,D,C; as built (P10) R reads the sources they read, the refresh is D's | new | source, organization, as-of |
| CashForecast | Insights/Reports/CashForecast | report | xml (later, impl-insights §7) | Compare explicitly assumed cash scenarios | proposed domain forecast projection | own §12 | financial readers | later | organization, horizon, currency, scenario |

Chatter and RecordFiles remain hidden app-root mounts of the Commons shared definitions. Insights does not create generic comment/file access to report-result artifacts; those use the recipient ownership rules in §7. An organizational map may link existing Commons content without duplicating its attachment system.

## 3. Home and management attention

### Home

**Layout.** Landing: organization and period, favorites/recents, four to six selected library panels, attention groups and pinned reports. The user's saved arrangement changes references/order, not underlying source scope. Initial content is a small authorized suite dashboard, not every report in the catalog.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| HomeContext | find | Select management scope | organization, from, thru, fiscal period, currency grouping | authorized choices; shared time picker | proposed ContextServices.get#Context | app landing pattern; ERPNext Home workspace |
| FavoritesAndRecents | list, read | Resume work | title, app/folder, kind, last opened | links; star toggle | ReportServices.list#Definitions; proposed RegistryServices.get#Home | framework Home; research §1 |
| ManagementPanels | component | Show agreed measures | panel reference, scope, source/as-of, result state | report-embed; table alternative | ReportServices.render#Dashboard | framework widgets; research §2 |
| Attention | list, read | Show operational bottlenecks | source, label, eligible count, overdue count, as-of, target | grouped links; unavailable state | proposed RegistryServices.get#Attention over registered AttentionProviders | Dolibarr work board; domain Home providers |
| PinnedReports | list, read | Open useful reports | report title, owner app, description | catalog links | proposed RegistryServices.find#Reports (pinned entries from the user's pins preference) | Carbon report pins |
| DigestPreview | component | Preview the user's default management digest | digest title, period, values, changes, missing sections, as-of | rendered report with table alternative; Open digest link | existing `org.moqui.report.ReportServices.preview#Report` for the default digest Definition | Odoo digest; framework report preview |

**Attention providers (review Z9).** Each app registers an AttentionProvider under INS-02. A registration has a key, the owning app, a count service that runs the same query as the worklist it opens, the worklist route with its filter, and the organization scope it honors. `get#Attention` calls each provider as the viewer and shows its counts; a provider the viewer cannot read is omitted. Monitor's Operations dashboard (business operation runs, rollbacks and retries per operation) is a registered source, so failed postings and placements show without a new provider. Each app's Home section names its providers.

**Actions.** Open a dashboard is primary; authors also have New dashboard. Attention rows open the exact domain filter that produced the count. A shared-screen action is reached through that domain flow, not executed from a generic number card. Pin/unpin is personal. The personal arrangement and pins are one UserPreference, key `InsightsHome`, holding JSON `{organizationPartyId, dashboardDefinitionId, orderedPanelIds, pinnedReportIds, revision}`; the framework's REPORT_RECENT and starred preferences stay as they are. IDs are chosen from authorized definitions/entries, and preferences never grant access.

**States/devices.** An inaccessible source is omitted without revealing a sensitive title/count. An admitted but unavailable source names the missing prerequisite. A provider failure affects its own card; others continue. Cards stack on phones and TUI presents the same ordered values and links. No summed cross-app “total work” is displayed: the same source may appear in more than one workflow.

**Source.** Research §§1–2,15; Commons Today; all domain Home designs. **Needs:** INS-01, INS-02, INS-09, INS-10.

**As built (impl-insights P5, Nov 7, 2026).**
- `ironstone.insights.AttentionProvider` (mr-boss's registry entity file) holds key, owner, label, the owner's count service and
  its fixed parameters, the count's path in its answer (and an overdue part), the organization parameter it honors or the scope
  it keeps, and the worklist's route and filter (a filter value may be taken from the answer, such as the plant counted).
  Providers that share an owner's Home summary share one call per board.
  `get#Attention` shows a provider only when its route opens to the viewer and they hold its permission; an owner's refusal or a
  null count leaves it out, and any other failure is a card that names its owner. The counts are grouped by owner and never
  totalled.
- The built apps register only the Home cards whose count is their list's own query (impl-insights F29), 26 of them.
  Monitor's Business operations dashboard is a source through `get#OperationFailures`, which runs the dashboard's own rollbacks
  query as the viewer over the last day and opens Monitor's Operations under Monitor's grants.
- ManagementPanels shows at most six panels of the user's chosen dashboard, else of the shipped `insights-suite` ("Suite
  overview"): orders and order value by currency (`Sales.Orders`, `Sales.OrderValue`), open cases by organization
  (`CustomerService.Backlog`) and store checkouts by state, as library panels. Each panel is a `report-embed` rendered as the
  viewer, kept to the organization in scope by the dashboard's `organizationPartyId` and `vendorPartyId` variables; Insights'
  Dashboard fixes both, `vendorPartyId` only where it is over Mantle's sales datasets (the selling organization).
- Invoiced revenue waits for an admitted invoice dataset (F-P5-2).
- Arrange (`store#HomeLayout`) saves the organization, the dashboard and its panels in `InsightsHome`.
- Favorites are the framework's starred and recent dashboards.
- The first-use state shows while the user has no stars, recents, pins or saved arrangement.

## 4. Dashboards and panels

### 4.1 One framework model

A library panel is the reusable widget. It may appear on an app landing, an Insights dashboard, a record page and a digest without a copied query. A dashboard's by-value panels remain useful for private composition; publishing a reusable business KPI creates a library-panel reference. Metric ownership stays with the source application (§6).

Existing `number-card`/`m-chart` screens remain valid operational UI. They adopt registered measures as those sources become available; this design does not require rewriting every landing before Insights can ship. The shared widget contract in crosscut §3.17 points here and to the framework reporting guide.

### 4.2 Framework screens shown under Insights

Since Nov 11, 2026 the screens with no business model in them are the framework's Dashboards screens (mr-moqui `runtime/components/base/tools/screen/Dashboards/`), shown under Insights' root in one of three ways: mounted by location (the area's `subscreens-item` names the framework file, and Insights has no file); a thin wrapper at Insights' own location, which includes the framework screen and takes in only the transitions Insights offers, so a transition not taken in does not exist on Insights' route; or Insights' own screen around the framework screen's named sections, where Insights adds business parts. The rule for choosing, the two maps and the framework's side are in [mr-moqui plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md) (Track I), the [reporting guide](../../../../../docs/tools/Monitoring.md#mounting-the-report-screens) and the [tools README](../../../../../runtime/components/base/tools/README.md); they are not repeated here.

| Insights screen | Framework Dashboards screen | How it is shown | What Insights keeps or adds |
| --- | --- | --- | --- |
| Dashboards | Home | wrapper: `dashboard`, `star`, `edit`, `new`, `explore` | the definition type fixed to dashboard |
| Dashboard | Dashboard | wrapper: `edit`, `setVariable`, `exportPanel`, `inspectPanel`, `duplicatePanel`, `removePanel`, `share` | the organization in scope as fixed variables, MeasureMeaning |
| DashboardEditor, PanelDetail | Definition | wrapper: `save`, `copy`, `restore`, `delete`, `export`, `reference`, `dashboard` | the type; PanelDetail's BusinessMeasure, Target and Dependencies |
| Panels | Panels | by location | nothing (the menu title and index are the item's) |
| Playlists | Playlists, and Playlist when one is chosen | Insights' own screen around the framework's list; `createPlaylist`, `play`, `edit`, `sharePlaylist` and Playlist's `data` taken in | the wall displays' share links, the devices showing each playlist, Register as display |
| WallDisplay | WallDisplay | wrapper: `data` | its location, which the route group and the display account's grant name |
| Drill | Drill | Insights' own screen around the framework's sections (it has no transition) | `DrillServices.get#Drill` (the reader check, the scope, the range, the cost filter), the header, DrillMeaning, the organization in the Breakdown form, the record links |
| ReportBuilder/Explore, Split | Explore, Split | by location | nothing |
| ReportBuilder/Analysis | Analysis | Insights' own screen around the framework's sections | `AnalysisServices` (the admitted datasets, the author check; the organization's calendar from Insights' `reportPolicy`) and its own `saveAnalysis`, which its grant names |
| ReportBuilder/Datasets | Datasets | wrapper: `createDataset` | its location and transition, which the grants name |
| ReportBuilder/DatasetDetail | DatasetDetail | wrapper: `storeDataset`, `admitDataset`, `retireDataset`, `rebuildIndex` | the same |
| ReportBuilder/DatasetFields | DatasetFields | wrapper: `storeFields`, `storeConditions` | the same |
| ReportBuilder/DatasetView | DatasetView | wrapper: `exportDocuments` | the same |
| ScheduledReports/Schedules, ScheduledReportDetail, ReportDelivery | Schedules, ScheduledReportDetail, ReportDelivery | by location | the area adds the organization's recipient cap to the policy |
| Alerts/Rules | Alerts | wrapper: `copyAlert`, `pauseAlerts`, `deleteAlert` | the area adds the recipient cap |
| Alerts/AlertDetail | AlertRule | wrapper: `recipientChoices`, `storeAlert`, `storeAudience`, `pauseAlert`, `testAlert`, `copyAlert`, `deleteAlert` | the same |

Of the framework's alert and delivery screens, AlertShared and Reports (the owner-mode schedule form) are not shown. Insights' own, with nothing of the framework's screens in them: the root, Home, Reports (the catalog), SavedReports, AddToDashboard, ManagementDigest, Records, Flows and Settings.

**The two maps.** The root's `always-actions` set `reportLinks` (where each report link goes under Insights) and `reportPolicy` (Insights' policy for the screens), both answered by `ContextServices.get#Context`. The policy holds the features (setting an alert for a holder of `INSIGHTS_AUTHOR` or `INSIGHTS_DISTRIBUTE`, sharing for a holder of `INSIGHTS_AUTHOR`), the 30 day range, the `insights-` dataset prefix with the words of the organization field, `INSIGHTS_VIEW` as the recipients' permission, the report email template, the alert audience (Insights' topic, template and link), the wall displays as a share group and the organization's calendar. The Scheduled reports and Alerts areas add the organization's recipient cap in their own `always-actions` (`ContextServices.get#DeliveryPolicy`, then the framework's `policyWith`). Both maps are data and never authority: the framework's own roots null them, a posted one is overwritten before a transition runs, and each value is enforced by the transition that reads it or by the engine. Insights' root grant is an allow, and the engine's operations stay denied to the root group but for each capability group's grants, so a screen mounted by location opens and every operation it calls is still checked.

### Dashboards

**Context passed.** Reuse Tools `Dashboards/Home.xml` with definitionType fixed to dashboard, an admitted-business definition filter, appRoot=Insights and canonical same-app links. Include its dashboard/star/edit/new/explore transitions so a shared link does not accidentally post elsewhere. Its transitions answer the root's `reportLinks` (Nov 12, 2026): a dashboard opens in Insights' Dashboard, edit and new in DashboardEditor or PanelDetail (`definition` and `panel`, set for an author or a steward and null otherwise, so a reader is offered neither) and explore in ReportBuilder › Explore; none opens the Tools Dashboards app, and Insights does not grant `DASHBOARDS_APP`. Authorization is enforced by ReportServices, not the business filter. Existing REPORT_RECENT and favorite preference behavior is reused; catalog pins are the `InsightsHome` UserPreference over catalog entries (§3).

**Actions/states.** R opens/favorites; A creates or copies. An unavailable definition is not named in a list. Framework paging/filter controls retain folder, tag and starred-only behavior. **Source:** research §§1,8; current framework Home and BOSS Dashboards. **Needs:** INS-01, INS-04.

### Dashboard

**Context passed.** Reuse Tools `Dashboards/Dashboard.xml` with definitionId, validated variable values, absolute/relative range, permitted filter pills, appRoot and sharedLinks. The mount adds organization scope from the context service and a business provenance/meaning drawer; user variables cannot replace scope predicates: the organization in scope (the chosen one, else the user's organizations) is the dashboard's fixed `organizationPartyId` variable (the framework's `reportFixedVariables`), which a viewer's `var-` value never replaces (impl-insights P2). Its links to the editor, Explore and the panel actions are Insights' routes through the framework's `reportLinks` map (Nov 12, 2026): `definition` and `panel` for an author or a steward, `explore`, `dashboard`, `drill` (Insights' Drill) and `alertRule` (AlertDetail), which a panel's New alert rule follows only where `reportPolicy.features.alert` holds (an author or a distributor); the policy also gives the default range, and Share's `features.share` (an author) and `shareGroups` (the wall displays). Data links resolve registered routes and carry the selected bucket and range. Definition sharing never supplies execution authority.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessContext | find | Select permissible common scope | organization, reporting range, currency mode | registered scope choices | proposed ContextServices.get#Context | Accounting report options; framework variables |
| MeasureMeaning | display | Explain a selected panel | metric/version, grain, basis, denominator, exclusions, source/as-of | a Meaning dialog listing each measured panel (impl-insights P4) | RegistryServices.find#PanelMeasures over get#Metric; report metadata | Marketing and Maintenance metric explanations |
| ShareDashboard | dialog | Share definition access | definitionId, private or authorized group (one of the owner's own groups, or the wall displays for an author), expected version | group choice; copy authenticated link | the framework Dashboard's `share` transition (tools `template/ReportShare.js`) over ReportServices.find#ShareGroups and save#Definition, which checks the group | framework definition userGroupId; research §10 |

**Actions.** Refresh is primary for readers, Edit for authorized owners. More offers Copy, Versions, Share, authorized Export, Schedule and New alert. A copied link freezes the time range but carries no access token. Share/restore confirms the named definition and impact; the engine's optimistic version check refuses stale writes. Inspect cannot expose restricted fields, server predicates, credentials or another user's query plan.

**States/devices.** A panel reports unavailable/stale/incomplete/failure explicitly and retains its last-good timestamp where allowed. Missing data is never a zero or a healthy alert state. Phone and TUI read the same panels in layout order.

**Business annotations.** Time series show domain events as markers through the existing `ReportServices.create#Annotation`: price list published (Products), campaign sent (Marketing), promotion start (Commerce) and period close (Accounting). Each owner registers its annotation source under INS-02 and writes the annotation after its commit. An annotation carries the event's name, time, organization and a link the viewer's permissions resolve; it carries no amounts. **Source:** research §§2,10,12; framework Dashboard and Annotations. **Needs:** INS-01, INS-02, INS-03, INS-04, INS-09.

As built (impl-insights P6): the framework's annotations take the source `business` (an organization, an event type, the record behind it or a link, a name and a time, no amount), written only by a holder of `org.moqui.report.annotation.business`. Mantle's `mantle.party.BusinessEventServices.record#BusinessEvent` makes the marker from the stored record and is registered to run after the commit of `publish#ProductPriceList` (Products), `store#Promotion` when a promotion's dates or name change (Commerce; the dated promotion is a band, since there is no start event) and `close#Period` (Accounting); a failure is logged and never fails the owner's change. Mantle's dataset `mantle-business-events`, scoped to the viewer's organizations, is the registered source (`ReportAnnotationSource`) a dashboard over business data reads for its viewer; BossSetupData grants the Insights groups its view. Marketing's campaign sends wait for Marketing.

As it is now (Nov 11, 2026; §4.2): ShareDashboard is the framework screen's own dialog and `share` transition, taken in by the wrapper; `ironstone.insights.DashboardServices` is gone. Share is offered where the root's `reportPolicy.features.share` holds (an author), for the owner's own groups and the wall displays, which the framework's `find#ShareGroups` names. The group rule is the engine's, at every `save#Definition`: a group the saver belongs to by their own membership (never `ALL_USERS`), or one whose share artifact `org.moqui.report.share.<userGroupId>` their own grant holds, which `BOSS_INS_SHARE_DISPLAY` gives the author for the wall displays; a group kept as stored is not asked again. The default range is the policy's.

### DashboardEditor

**Context passed.** Reuse Tools Definition's dashboard editor, fixing type=dashboard and business-admitted dataset/panel choices. It mounts under Insights through INS-04: the editor's transitions become appRoot-relative and its dataset choices come from the author's dataset grants, not from `DASHBOARDS_APP` or `REPORT_DATASETS_ADMIN`. INS-04 is a first-release framework need; without it authors cannot edit inside Insights. The existing framework model supplies layout tree, panel placement, variables, query/transformations, copies, versions, dependency uses, import/export and restore. BOSS provides labels and scoped route choices; it adds no competing layout format. Under Insights (Nov 12, 2026) it opens through `reportLinks.definition` and `panel`, set for an author or a steward only; `reportLinks.share` names Insights' Dashboard, so the editor's save keeps a definition's group as stored and Share changes it; its dashboard and Explore links are Insights' routes.

**Actions.** Save version is primary; Save as copy for shipped definitions. Add panel selects an admitted library panel or opens the same framework panel editor. Common filters declare which panel field they bind; an incompatible panel visibly remains unfiltered and cannot be presented as included in a filtered total. Per-panel overrides are visible. A referenced library change shows affected dashboards/digests/alerts before publication. Deletion is refused while referenced. Advanced JSON remains an authoring representation, with the same server validation as the visual editor; it cannot insert an arbitrary service name, dataset row-filter override or unsafe route.

**Devices/source.** Framework editor and TUI twin; phone users can read and make simple ordered edits. Research §3; current Definition. **Needs:** INS-03, INS-04, INS-09.

### Panels

**Context passed.** Reuse framework Panels, definitionType=panel, business admission, authorized metric catalog and same-app PanelDetail/Drill links. PanelDetail is the hidden route `Insights/PanelDetail` (a mount of the framework editor beside DashboardEditor), not a child of Panels (impl-insights P2). List title, metric/source, visualization and authorized “used in” references; no titles of inaccessible consumers. **Actions:** New panel for A; copy shipped panel; open existing. **Source:** research §§2–4; framework Panels. **Needs:** INS-02, INS-04. As it is now (Nov 11, 2026; §4.2): the framework's Panels is mounted by location, and Insights' wrapper is gone.

### PanelDetail

**Context passed.** Reuse the framework Definition editor with type=panel. Fix the allowed source list, field projection and service-source registration. The existing query editor supplies dimension/measure, grain, filters, server transformations, visualization, units, thresholds and data links; preview invokes the same execution path as the published panel. Number-card target/gap is added as a typed business option over a registered target measure or an explicitly entered target in the same unit, not another KPI store.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessMeasure | single | Attach meaning to a reusable panel | metricId/version, source reference, organization/range bindings | registered metric picker; read-only basis | proposed RegistryServices.get#Metric; ReportServices.save#Definition | domain report definitions; framework panel editor |
| Target | dialog | Configure target comparison | target metric or constant, unit, period, better direction | compatible target choice; preview | ReportServices.run#Query; proposed semantic validation | Frappe number reading target/gap |
| Dependencies | list, read | Review reuse before change | consuming definition, kind, version, access | framework used-in list | ReportServices.find#DefinitionUses | framework DefinitionReference |

As built (impl-insights P4): BusinessMeasure, Target and Dependencies sit above the framework editor for a saved library panel; the measure and target are stored in the panel's body (`business`) through `save#Definition` as the author (`RegistryServices.store#PanelMeasure`, `store#PanelTarget`, transitions named in the editors' area). A money target names one currency, and the panel's every query must be filtered to that currency (a `currencyUomId` equality filter), else it is refused as mixed currencies; a measure target must share the measure's unit and aggregation.

New target input is exactly `{panelId, targetKind, targetMetricId, targetValue, targetUnitId, periodBinding, betterDirection, expectedVersion}`; targetKind selects a metric or constant and only the corresponding value is accepted. Missing target or zero comparison denominator produces unavailable comparison, not infinity. Cost/HR targets retain their source access. **Source:** research §§2,4; framework Definition. **Needs:** INS-02, INS-03, INS-04.

### Playlists

**Context passed.** Reuse Tools `Dashboards/Playlist.xml`: a `report` Definition with `body.kind` `playlist`, its dashboard list and seconds per dashboard, played in kiosk mode for a management or plant wall display. The mount builds dashboard links to Insights' Dashboard instead of the Dashboards app (INS-04). The display runs as the signed-in viewer; a wall screen signs in as a user whose grants fit what the room may see. Once CX-DEVICE ships, a registered device credential limited to the playlist route serves instead (Admin Devices), in Insights' second release ([impl-insights](impl-insights.md) P11): Playlists offers Register as display to a holder of Admin's `ADMIN_ACCESS_MANAGE`, opening Admin's RegisterDevice with the route group and the playlist (one per device), and lists the devices showing each playlist, read only. The device reads as its display account ([design-admin](design-admin.md) §6 Devices, settled in impl-admin P18): an account nothing signs in, with the reader and wall display bundles and the organizations its registrar gave it, so a playlist shows what that account may read and no more; the framework fixes the device's playlist (`definitionId`) whatever its browser asks for, and refuses it everything outside the Playlists route group, which Insights P11 completed (the wall display's page and its data, below). A dashboard the viewer cannot read is skipped and its failure logged by name, as the framework screen does. **Actions:** Play is primary; A creates and orders playlists through the framework Definition editor. **Source:** review R-INS-W02; framework Playlist. **Needs:** INS-04.

As built (impl-insights P11, Nov 11, 2026): a device plays its playlist on `Insights/WallDisplay`, a hidden standalone page (the route group's `homePath`) and not the `/qapps` shell, which a device may not load: its html is a bare document (no navigation, menu, account or instance header) that loads the qvt client's files and mounts the screen's own qvt render as an island, `m-report-playlist` in kiosk mode, which rotates the dashboards at the playlist's seconds, loads a playlist of one again at each turn, retries a failed load at the next turn, offers no link out, and reloads the page when a request is refused, so a revoked or stopped device gets the framework's plain page (not registered, revoked, ended or refused, nothing of the instance) at its next turn. Each turn asks the screen's `data` transition (since Nov 11, 2026 the framework WallDisplay's, taken in by the wrapper) for one dashboard of the stored playlist by its index; the playlist is the registration's (the framework's fixed `definitionId`), and the dashboards come from it, each read as the display account; no dataset or definition is taken from the request, and nothing is written. The route group `INSIGHTS_PLAYLISTS` admits WallDisplay's render and its `data` transition alone (artifact group `BOSS_DEV_INS_WALL`), idle timeout a week. A display account holds the reader bundle (`BOSS_INSIGHTS_READ`: the engine's reads, the admitted datasets, `INSIGHTS_VIEW`), which opens no screen, and the wall display bundle (`BOSS_INSIGHTS_DISPLAY`), which opens WallDisplay and its data transition, view only, and no other Insights screen: the Insights root is the launcher group's, and its context service is not called for a device's request. What the display shows is the display account's: its organizations through the row filters (with its membership ended it shows no one's numbers), its dataset grants (a panel it may not read says not available), the definitions shared with it. A playlist and its dashboards reach the displays by being shared with the wall displays (`BOSS_INSIGHTS_DISPLAY`, a share target every author may choose, since Nov 11, 2026 through the framework's `share` and `sharePlaylist` transitions; Playlists' Share with wall displays): a definition has one group, so a playlist shared with the displays is read by its owner and the displays. Playlists offers Play full screen (WallDisplay, as the viewer), Register as display to a holder of `ADMIN_ACCESS_MANAGE` (Admin's Security › Devices with the route group and the playlist) and lists the devices showing each playlist to a holder of `ADMIN_ACCESS_VIEW` (Mantle's `find#SharedDevices`, within their identity scope).

As built (impl-insights P12, Nov 11, 2026): a definition has one group (`userGroupId`), so sharing a dashboard with the wall displays takes it from the author's team, and Share with wall displays on a playlist already shared with a group moves it from that group. The screens say so before it moves: Dashboard's Share dialog names the group the dashboard is shared with now and that another choice, the wall displays among them, replaces it; Playlists names a playlist's other group and asks before Share with wall displays takes it from that group.

As it is now (Nov 11, 2026; §4.2): Playlists is Insights' own screen around the framework's Playlists, with the framework's Playlist included when one is chosen; the list, New playlist and the share are the framework's (`template/ReportPlaylists.js`, `ReportShare.js`), and Insights adds the wall displays' share links, the devices and Register as display. New playlist and `createPlaylist` are held by the editor link (Nov 12, 2026): the transition refuses where `reportLinks.definition` is null, so a distributor, who holds the engine's save for alert rules, makes no playlist by a hand-made post. The framework's share takes any group it offers, the sharer's own among them, under the engine's group rule (Dashboard, above). WallDisplay is a thin wrapper over the framework's WallDisplay at Insights' own location, which `BOSS_DEV_INS_WALL` and `BOSS_INS_WALL_DISPLAY` still name, taking in `data` alone; its range is the root's policy's, never the request's.

### Drill

**Layout.** XML dialog with Meaning, Breakdown and Source rows sections; selection breadcrumbs preserve the original report's scope and time. The framework's click-to-filter and document-query machinery supplies the data; this is the shared business drill presentation.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DrillMeaning | display | Explain the clicked value | metric/version, group, basis, denominator, unit, as-of | inline source/exclusion text | proposed RegistryServices.get#Metric | research §2; domain explanations |
| Breakdown | find | Add one permitted dimension | dimension, selected bucket, original scope | approved dimension lookup; breadcrumbs | ReportServices.run#Query | framework filter pills; Frappe breakdown |
| SourceRows | list, read | Inspect contributing records | source key/name, relevant date/state/value, unit, contribution | paged table; canonical record links | ReportServices.query#Documents or registered domain drill service | Frappe drill rows; crosscut shared records |

The new drill request is `{definitionId, panelId, metricId, metricVersion, queryReference, range, variables, selectedBuckets, breakdownDimension, pageIndex, pageSize}`. The server resolves queryReference to the authorized saved/request query, reapplies fixed source scope, validates dimension and bucket predicates and returns display rows, page metadata and provenance. It never trusts a client-supplied entity/service name. Aggregation access may permit a summary while individual records remain restricted; those records are not fetched then hidden. “Other”/missing buckets retain their exact original predicates, and truncated samples are labelled rather than mistaken for all source rows.

**Actions/navigation.** Open source uses §10. Open as analysis is available to A and copies query meaning, not a privileged result. Export uses the same authorized source projection. **States/devices.** No source access returns a useful authorized explanation without identifying hidden records. The same dialog is a linear task in TUI and a full-width page on a phone. **Source:** research §§2,15; framework Explore and source queries. **Needs:** INS-02, INS-03, INS-04, INS-09.

As built (impl-insights P6): the route is `Insights/Drill`, a hidden screen each panel's menu opens (Drill; the root's `reportLinks.drill`) in the browser and the terminal, over `ironstone.insights.DrillServices.get#Drill` and the framework's `ReportServices.get#Drill` (mr-moqui docs/tools/Monitoring.md "Drill"). The request is `{definitionId, panelId, queryReference, from, thru, variablesJson, bucketsJson, breakdownDimension, pageIndex, organizationPartyId}`; `metricId` and `metricVersion` are read from the panel, not sent. The engine reads the saved panel again as the viewer and takes each bucket's predicate from its own result; Insights fixes the organization in scope over any variable sent, as on Dashboard. Breakdown lists the panel's own buckets to choose and adds one of the dataset's dimensions; a breakdown bucket is shown, not chosen (only the saved panel's buckets resolve to predicates). SourceRows shows the query's own time, group and measured fields of each record, never the whole document, each opening its Insights record screen (§10); a cost or margin field is neither a column nor a breakdown dimension for a viewer without `PRODUCT_COST_VIEW` (by the field's name, until datasets have field classes). A dataset whose definition says `rows: "restricted"` gives totals and no record without `org.moqui.report.rows.<id>`, which no Insights group holds. A registered domain drill service for a service-source panel is not built: such a panel answers that its value has no drill. Export of the drilled records is DatasetView's. As it is now (Nov 11, 2026; §4.2): the screen is Insights' own around the framework Drill's sections; Insights' `get#Drill` keeps the reader check, the scope, the default range, the cost filter, the meaning and the record screens, and the engine call, the buckets, the breakdown and the rows are the framework's `template/ReportDrill.js`.

## 5. Exploration and report builder

### Explore

**Context passed.** Reuse framework Explore, mounted under Insights through INS-04, with an admitted dataset, safe query/filter pills, range, appRoot and business record links. Split comparison is its included region, not a duplicate query engine. An ordinary author cannot choose telemetry/index-wide/private payroll datasets by supplying an ID directly. Dataset choices, field suggestions, value counts and lookups are scoped before being returned.

**Actions.** Run/refresh, Save search, Open analysis and Add to dashboard use existing ReportServices query/definition operations. Saved searches preserve query meaning and display options, not computed results. CSV/XLSX require the source's export grant. Framework row/bucket/time limits remain visible, and a bounded result never claims a complete population count. **Source:** research §§5–6,8; framework Explore/Split. **Needs:** INS-02, INS-03, INS-04. As it is now (Nov 11, 2026; §4.2): the framework's Explore and Split are mounted by location in the Report builder and Insights' wrappers are gone; the sentence for a viewer who reads no dataset and the default range (the root's `reportPolicy.range`) are the framework screens' own.

### Analysis

**Context passed.** Use the same framework query/definition editor and panel renderer as PanelDetail: dataset or registered report service, aggregate roles, grain, group-by, transformation pipeline, pivot/totals, visualization and time comparison. The saved result is an ordinary search or panel Definition; no new workbook/query language is added.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AnalysisSource | single | Select a governed starting point | dataset or catalog source, metric, range, organization | source/measure picker | proposed RegistryServices.find#Reports/get#Metric; ReportServices.get#Dataset | research §5; framework datasets |
| AnalysisSteps | component | Build the calculation | permitted fields, aggregates, grain, transformations | framework definition editor | ReportServices.run#Query | framework aggregation/transform pipeline |
| AnalysisResult | component | Inspect result and provenance | frames, totals, unit, notices, as-of | report panel with accessible table | ReportServices.run#Query | framework panel and inspector |
| SaveAnalysis | dialog | Save or place the definition | title, private/group, kind, dashboard target | authorized definition choices | ReportServices.save#Definition | research §8; framework Add to dashboard |

An analysis over monetary fields must carry currency grouping or a registered conversion measure. The server refuses semantically invalid operations rather than merely removing the currency symbol. A ratio aggregates its numerator/denominator according to its registered rule; it is not an average of row percentages. Distinct counts, balances and snapshot measures declare nonadditive dimensions. Calculated fields use the bounded framework expression/transform vocabulary; no raw SQL, JavaScript or arbitrary service invocation is exposed.

Generic `form-list` pivot/graph adapters remain later; eligible existing reports/lists may offer Add to dashboard through a registered source adapter. A list's currently loaded page is never treated as its entire dataset. **Source:** research §§5–6; Sales/Purchasing analytics decisions. **Needs:** INS-02, INS-03, INS-04, INS-12.

As built (impl-insights P6): `Insights/ReportBuilder/Analysis`, the author's and the steward's (`BOSS_INS_ANALYSIS`), over `ironstone.insights.AnalysisServices` (`get#AnalysisOptions`, `get#AnalysisResult`, `store#Analysis`). AnalysisSource is typed choices: an admitted dataset, how a measure is aggregated (count, sum, average, least, greatest, distinct), up to two groups, a time grain, one equality filter and the range; each field is one of the dataset's own. AnalysisResult runs them through `run#Query` as the author and shows the engine's count of the records behind the result. SaveAnalysis saves a library panel (private or one of the author's groups, optionally placed on one of their own dashboards by reference) and opens it in PanelDetail, the framework definition editor, which is AnalysisSteps (transformations, pivot, totals, the time comparison). The semantic guards are the framework's, for every caller (mr-moqui docs/tools/Monitoring.md "Semantic guards"), from what a dataset's `fieldDefaults` declare: `unitField` (`UNIT_MIXED` until grouped by the unit field or filtered to one unit; refused when the records hold several units, so a single-currency organization's sums are unchanged), `ratio` (`RATIO_AGGREGATE`), `nonAdditive` (`NONADDITIVE`), and a bounded page of records (`BOUNDED_RESULT`, a `bounded_result` notice). A catalog report source and a registered conversion measure as a starting point are not built: the starting point is a dataset. As it is now (Nov 11, 2026; §4.2): the screen is Insights' own around the framework Analysis' sections; `AnalysisServices` and Insights' own `saveAnalysis` stay, over the framework's `template/ReportAnalysis.js` for the choices' lists, the fields, the query and the result's rows. Since Nov 12, 2026 a time grain's calendar is `reportPolicy.calendar` of Insights' context for the organization in scope, through the framework's `calendarParameters`, as Tools' Analysis reads a mount's; Insights no longer reads its settings a second time for it.

### Datasets

**Layout.** XML list with admitted, needs review and unavailable views. Show business name, owner domain, grain, source type, available scope, index and feed, freshness and permitted uses; stewardship details appear only to D.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DatasetFind | find | Find an admitted source | domain, name, source type, readiness | server filters | — | SimpleReport FindReport; framework Datasets |
| DatasetList | list, read | Explain source suitability | name, grain, scope, index/feed, source/as-of, status | detail and preview links | `org.moqui.report.ReportServices.list#Datasets`; proposed ReportServices `find#BusinessDatasets` (admission state) | SimpleReport DataDocumentList |
| CreateDataset | dialog | Start a stewarded source | name, index (`mantle`, `mantle_sales`, `mantle_inventory`) or registered feed, primary entity/source, row filter service, permitted group | allowed-source lookup; index and feed pickers list only registered ones | proposed ReportServices.create#BusinessDataset, using existing org.moqui.impl.EntityServices.create#DataDocument when applicable | SimpleReport CreateDataDocument |

New creation input is `{documentName, sourceKind, registeredSourceId, indexName, dataFeedId, primaryEntityName, timeField, userGroupId, scopePolicyId, organizationPartyId}`. SourceKind selects a permitted DataDocument/entity projection or a registered service source; names and policies come from steward-authorized choices. Service-source datasets use the existing framework definition format and an allowlisted adapter, not a DataDocument with a fake entity. As built (impl-insights P3): CreateDataset takes a name, a document of a registered feed (the source), a time field, a registered scope policy and the field that carries the organization; the dataset is named `insights-<name>`, whose artifacts the steward and reader groups are granted by pattern, and waits for review. Service sources are not offered yet. The pattern grants the dataset the steward names and nothing under it (impl-insights P3 follow-up, Nov 11, 2026; impl-admin F277): a steward's dataset is a business dataset over a registered feed's document under a registered policy. A definition saved another way that reads a telemetry index (`indexName: otel_logs`), or a business dataset's document without the business signal, is an alias, and the engine asks for the source's own artifact (`org.moqui.report.dataset.<index or document>`) when it is saved and when it is read: of the saver; for a telemetry index of the reader or the definition's owner (so an instance administrator's alias stays a narrowed view for its readers, and a shipped alias such as `mantle-business-events` reads by its own grant); for a business document of every reader. The steward holds neither, so the steward's save is refused and a stored row answers nobody.

As it is now (Nov 11, 2026; §4.2): Datasets, DatasetDetail, DatasetFields and DatasetView are thin wrappers over the framework's Dashboards screens of the same names, each taking in only the transitions its grants name, so Tools' explore and definition transitions are not on Insights' route. The screens read through the framework's `get#BusinessDataset` and `get#BusinessDatasetOptions` (rows of `BOSS_INS_DATASET_READ`, beside `find#BusinessDatasets`); the six screen services of `ironstone.insights.DatasetServices` are gone, and it keeps `check#DatasetReadiness` and `refresh#DatasetIndex`, which the readiness and refresh registrations name. The `insights-` prefix and the words of the organization field are the root's `reportPolicy`; the prefix gives no right, since `create#BusinessDataset` asks the update artifact of the dataset named beside the dataset-save artifact. New dataset is offered by the engine's answer (the dataset-save artifact by the caller's own grant).

**Admission (review Z8).** A DataDocument dataset is admitted only when three things hold:
- its DataDocument is in a registered DataFeed (a DataFeedDocument row, added by the owning component's seed or by the steward through `create#BusinessDataset`);
- the feed's index has been built;
- `scopePolicyId` names a registered `rowFilterService`.

Until then the dataset is "needs review", never an empty admitted source: the framework refuses a reader's query of a dataset of signal `business` that is not admitted (the `moqui.report.BusinessDataset` admission record), and only its steward (the dataset's update artifact) reads it before. BOSS's own datasets are admitted by setup; Mantle's sales datasets and the inventory dataset wait for the steward. The steward builds or rebuilds the index with `ReportServices.index#BusinessDataset`. It is guarded by the dataset's update artifact (`org.moqui.report.dataset.<id>`), which setup grants to the steward group with `INSIGHTS_DATASET_EDIT`, runs `org.moqui.search.SearchServices.index#DataFeedDocuments` for that dataset's feed only, and is registered as a refresh operation in the framework's registry (Admin §14; `insights.dataset.<id>.index`, beside the dataset's readiness provider `insights.dataset.<id>`: its admission and the lag since its last build). DataReadiness shows index lag. Deleting an index stays a Tools operation.

**Admission backlog.** The first release admits, in this order:
1. the shipped `mantle-sales-orders` and `mantle-sales-items` datasets on `mantle_sales`, with the `mantle-sales` dashboard and the `mantle-sales-daily-floor` alert template, after their row filter is added;
2. a `mantle_inventory` dataset with its filter from the start;
3. each app's shipped `report/*.json` (CX-OPS-REPORTS) as the app ships them.

**Source:** research §§5,11,16; review R-INS-02, R-INS-W04. **Needs:** INS-03, INS-09.

### DatasetDetail

**Layout.** Settings/detail: Identity, Fields/conditions, Scope and permitted uses, Readiness, Used in. Technical metadata is appropriate here because the steward is making a data-governance decision; it is not shown as a normal manager's report form.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EditDataDocument | single | Maintain the source description | name, primary entity, time field, group, grain | registered source choice | proposed ReportServices.store#BusinessDataset; existing org.moqui.impl.EntityServices.update#DataDocument within guarded mutation | SimpleReport EditDataDocument |
| DatasetScope | single | Bind business authorization | scopePolicyId (a registered `rowFilterService`), permitted fields/uses, classification, steward | approved policy selector; no editable security expression | proposed ReportServices.store#BusinessDataset | framework `rowFilterService`; research §12 |
| DatasetIndex | display; dialog | Build or rebuild the dataset's index | feed, index, last build, documents, lag | Rebuild confirmation | proposed ReportServices.index#BusinessDataset | framework DataFeed indexing |
| DatasetValidation | list, read | Review admission checks | check, outcome, source, explanation | authorized drill; no private fixture values | proposed ReportServices.validate#BusinessDataset | framework inspector; Frappe workbook verification |
| DatasetUses | list, read | Assess a change | dashboard/panel/report/alert, version | framework dependency links | ReportServices.find#DefinitionUses | framework definitions |

New scope input is `{datasetId, scopePolicyId, permittedFieldIds, permittedUseIds, classificationEnumId, stewardUserId, expectedVersion}`. As built (impl-insights P3): `store#BusinessDataset` takes the scope policy and its `rowFilterParameters` (the organization field), the title and time field of a saved dataset (a shipped dataset's are its component's), the steward, admit and retire, with `expectedVersion`; permitted fields and uses and the classification are not built (§17).

**Scope policy (review Z8).** `scopePolicyId` names a registered `rowFilterService`, the framework's own row filter hook, and is not a second policy model. The organization policy is proposed `mantle.party.PartyServices.get#OrganizationRowFilter`. It returns the row filter for the viewer's permitted organizations with `MANTLE_USER_ORG` semantics, and the active organization when `MANTLE_ACTIVE_ORG` applies; the dataset names the field that carries the organization in its `rowFilterParameters`, which the framework passes to the service with `userId` and the dataset's id (today it passes `userId` alone; impl-insights F5). Other policies (private contacts, People confidentiality) are domain `rowFilterService`s registered the same way. Policies are deployed, reviewed code supplied by the domain, not scripts typed by a business user. Changing entity, grain, time basis or field meaning is a new dataset/metric version; dependent definitions must be validated before publication. A primary entity change cannot reinterpret saved field paths in place. Copy uses existing `org.moqui.impl.EntityServices.clone#DataDocument` only inside the guarded dataset workflow and preserves no admission assertion by implication.

**Actions.** Validate then Admit is primary for D; Admit is refused until the feed is registered, the index built and the row filter bound. Rebuild index runs `index#BusinessDataset`. Revise/Retire confirm the dataset and affected consumers. Retirement stops new authoring, preserves historical explanation and shows dependency blockers. Delete-index and raw feed configuration stay in Tools. **Source:** research §§11–12,16; SimpleReport EditReport. **Needs:** INS-03, INS-09, INS-11.

### DatasetFields

**Layout.** XML tree of allowed relationships beside editable field and condition lists. Only fields in the approved source projection can be selected; unrestricted entity browsing remains Tools.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FieldList | list, editable rows | Define result fields | fieldPath, alias, function, sequence, display/unit metadata | approved field tree; unique alias validation | proposed ReportServices.store#BusinessDatasetFields using existing org.moqui.impl.EntityServices.create#DataDocumentField/update#DataDocumentField | SimpleReport FieldList |
| AddCondition | dialog | Add a source condition | field alias, operator, value, ignore case | typed value input | proposed ReportServices.store#BusinessDatasetConditions | SimpleReport AddCondition |
| ConditionList | list, editable rows | Revise or remove source conditions | condition key, field, operator, value | row actions | proposed ReportServices.store#BusinessDatasetConditions | SimpleReport ConditionList |

Conditions narrow a source; they cannot replace security scope. As built (impl-insights P3), a new field is a plain path of the source's entity and its relationships (no expression, no secret field), its function one of the aggregate and case functions, and a condition a field of the document with an operator of the list (never a post-query expression); a change leaves the index to be rebuilt before the dataset is admitted again. Aggregate functions, field paths and relationship cardinalities are checked against the declared grain. Removing a field required by an admitted metric is blocked until its consumers are revised. Deletes use entity services only after the same admission/ownership checks as add/update; no unguarded generic entity transition remains. **Source:** research §16; current copied FieldList. **Needs:** INS-03, INS-11.

### DatasetView

**Layout.** Report with source/meaning, find form, permitted dynamic columns and bounded detail results. It replaces the legacy dynamic entity view as a business preview; a DataDocument group check alone is insufficient for row/field scope.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DatasetOptions | find | Select authorized rows | dataset, range, registered source filters | typed field filters; saved find | ReportServices.get#Dataset | SimpleReport ViewReport |
| DataViewList | list, read | Inspect source records | approved projected fields, source ID/link | dynamic columns; paging; accessible table | ReportServices.query#Documents or registered service projection | SimpleReport DataViewList |
| ExportDocuments | dialog | Export the same authorized projection | format, range, pretty JSON, row limit | format choices; scope/limit explanation | ReportServices.query#Documents and existing ReportServices.audit#Export through proposed scoped export adapter | SimpleReport ExportDocuments |

New export input is `{datasetId, savedQueryId, from, thru, filters, format, prettyPrint, requestedRowLimit}`. As built (impl-insights P3; since Nov 11, 2026 the framework DatasetView's `exportDocuments` transition, taken in by the wrapper, §4.2): the export takes the dataset, range, query, format (CSV or JSON), pretty print and row limit (1,000 by default, 10,000 at most), reads through `query#Documents` and records `audit#Export`; DataViewList shows each row's title and fields as text, a page at a time. Server policy caps rows and applies identical source scope; a raw DataDocument export URL cannot bypass it. JSON is retained for admitted data projections; low-level entity/data export stays in separately privileged Tools. This is the one export surface for datasets and reports: Admin DataExport covers domain formats (vCard, payroll exchange, ledger) and links here for dataset exports. **Source:** research §§5,16; SimpleReport ViewReport. **Needs:** INS-03, INS-09, INS-11.

## 6. Report catalog and domain metrics

### 6.1 Ownership and registration contract

The catalog is a route/definition index, not another business data model. Proposed `ironstone.insights.ReportCatalogEntry` stores stable entryId, owner app, title/description, canonical route or definitionId, parameter contract, source/metric references, required view/export/schedule capabilities and readiness. Component setup contributes entries; an app-only report points to its owning route. Each catalog report has one owner and one entry (review Z10); another app that shows it mounts the owner's route. A user's pins and their order are the `InsightsHome` UserPreference (§3), not a record of their own. These BOSS records hold navigation only; no Mantle service depends on them.

**What apps register under INS-02.** Each app registers four kinds of entry:
- catalog entries for its reports;
- metric registrations for the measures it owns;
- AttentionProviders for its Home worklists (§3);
- annotation sources for its business events (§4).

Each app's shipped `report/*.json` datasets, dashboards and alert templates (CX-OPS-REPORTS) are loaded by the framework read-only and admitted under §5 before they appear in Insights. Long-running domain jobs that declare `operation` and `operation-ref` appear in Monitor's Operations dashboard, which Home reads as an attention source.

Business metric metadata extends admitted dataset/panel definitions with a versioned `business` descriptor; a registered domain report service returns the same metadata with its frames. It supplies metricId/version, owner, description, source reference, record grain/key, date/status basis, numerator/denominator or aggregation rule, additive dimensions, unit/currency policy, allowed dimensions, supported filters, drill contract, permission/scope policy and freshness contract. The actual formulas and authorization remain in the domain service/dataset, not in a second Insights formula store.

Proposed `ironstone.insights.RegistryServices` validates and reads these registrations, resolves links, pins and safe status. It does not wrap each Mantle service to rename it. Framework service-source registration binds an explicit service and parameter/output contract; ordinary authors choose the registration, never a service name. Returned frame metadata carries effective organization/filter/range, metric and definition versions, source watermark, completeness, source counts where permitted and warnings.

As built (impl-insights P4, §4): the catalog is `ironstone.insights.ReportCatalogEntry` and the domain service registrations are `ironstone.insights.MetricRegistration`, BOSS seed records in mr-boss's registry entity file, each owner's rows in a block of its own in BossSetupData. An entry names its owner's catalogue service (Customer Service's and Commerce's `get#ReportCatalogue`, Accounting's `get#Catalog` by `reportId`) or none, in which case the route's screen authorization decides; one entry, SalesAnalysis, is Sales' and opens Accounting's route, whose catalogue decides, until impl-sales P19 moves it to Sales' route. A panel names its measure in its body (`business: {metricId, metricVersion, target}`); a dataset definition may carry its own descriptor (`body.business` with its grain), though Mantle's shipped datasets carry none (they are Mantle's files), so their metrics are registrations naming the dataset. `RegistryServices.get#Metric` answers the descriptor with the comparison rules as sentences (native currencies apart, ratios from their parts, snapshots not summed, recurring base orders excluded) and a panel's version change.

As built (impl-people P29, an owner contract): People's eight entries (`People.Headcount`, `.Recruiting`, `.Attendance`,
`.LeaveBalances`, `.Expenses`, `.Qualifications`, `.Reviews`, `.PayrollRegister`) are read through Mantle's
`PeopleReportServices.get#Options` as their catalogue (the report's id its `catalogueKey`; the payroll register a payroll reader's
alone) and open one route, People's Reports, with the report chosen: an entry's `routePath` may carry fixed parameters after a `?`
(`People/Reports?reportId=headcount`), and `get#ReportLink` adds the context after them. People's datasets are class `InsDcPeople`,
which Assist and MCP never admit, read in Insights only with People's Insights bundle (`BOSS_PEOPLE_INSIGHTS`); the Insights data
steward stewards them (their update artifact alone, the user's call of Nov 12, 2026) and reads no row without the bundle.

Planned (Nov 11, 2026): the `Sales.SalesAnalysis` entry's route moves from Accounting's to Sales' own, with Sales' catalogue service, and `Accounting/Reports/SalesAnalysis` becomes a mount of it with Accounting's finance columns (impl-sales P19).

A saved query and its drill/export/alert must share this contract. Unit conversion, privacy and business rules are not inferred from column names. Unknown metadata blocks admission for a published business KPI; a private exploratory result is visibly an analysis, not a certified domain measure. Schema validation and a successful query are necessary but do not prove semantic correctness.

### Reports

**Layout.** List/index grouped by app and business purpose, with pinned reports first. Report pages keep their canonical owner; Insights passes validated context and return navigation rather than reproducing forms.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportFind | find | Find a permitted report | app, purpose, text, pinned, readiness | filters; domain choices | proposed RegistryServices.find#Reports | Carbon reports hub; ERPNext catalogs |
| ReportCatalog | list, read | Explain and open a report | title, owner, basis, source, available formats | canonical links; pin | proposed RegistryServices.find#Reports; RegistryServices.store#ReportPins | research §7; existing application report indexes |
| ReportContext | dialog | Supply required shared parameters | organization, range/period, currency, source-specific options | registered typed fields | proposed RegistryServices.get#ReportOptions, which calls the entry's registered options service; no report execution on catalog read | Accounting report quick options |

As built (impl-insights P4): ReportFind filters by text, app, purpose and pinned; ReportCatalog opens each report's owner route and pins it; ReportContext is a section of Reports opened by a row's Options (the entry's contract fields: organization, fiscal period, from and through), whose Open sends only the contract's parameters (`get#ReportLink`); owners whose catalogue fails are named above the list. A report opened from a record (CaseAnalytics) is listed without Open.

**Actions.** Open is primary. Pin/unpin input is `{entryId, pinned, sequenceNum, expectedRevision}`, stored by proposed RegistryServices.store#ReportPins in the caller's `InsightsHome` UserPreference; ownership is the authenticated user. Schedule appears only when an admitted schedule adapter exists; a raw arbitrary screen path is never enough. Reports not implemented remain described in the owning design and are omitted from the usable catalog; an unavailable configured source reports its missing prerequisite without pretending there are no records. **Source:** research §§7–8,15. **Needs:** INS-02, INS-05, INS-09.

### SavedReports

**Layout.** XML list with separate types: named analyses/searches, saved finds, dashboards and pinned catalog entries. They share an index, not one misleading storage identity.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SavedFind | find | Select personal/shared work | kind, title, owner/group, source app | typed filters | proposed RegistryServices.find#SavedReports | research §8 |
| SavedReportList | list, read | Resume a saved definition or find | title, kind, source, sharing, changed date | resolved route; unavailable state | ReportServices.list#Definitions; authorized FormListFind projection | SimpleReport QuickViewReport; framework saved finds |
| SaveAs | dialog | Copy authorized query configuration | source ID, title, private/group, expected version | safe target choices | ReportServices.copy#Definition or existing form-list saved-find behavior | framework Definition; Frappe Save As |

As built (impl-insights P4): `RegistryServices.find#SavedReports` lists the dashboards, library panels, saved searches and playlists the user reads that are not shipped, the saved finds of the user and their groups (opening their mr-boss form-list screen with `formListFindId` when it opens to the user) and the pinned entries, each with why it does not open when it does not; SaveAs (`copy#SavedReport`) saves a copy of a definition through `save#Definition` as the user, private or for one of their own groups, and is the author's; a saved find has no SaveAs here (its own screen's save).

Deleting a personal pin removes no report; it edits the user's preference only. Deleting a find checks schedules that reference it. Deleting a definition uses ReportServices.delete#Definition and its dependency guard. A copied search retains no cached result or broadened grant; source authorization is checked when opened. **Source:** research §§8,16. **Needs:** INS-01, INS-05, INS-11.

### 6.2 Domain contribution register

Each row names the canonical owner. Registration is the additional Insights integration; it does not promote a proposed domain capability to implemented. Existing forms remain in their owner's design and inventories. Sources listed here feed business panels/Analysis through registered service adapters only after their domain access and semantic checks pass. Each owner's Reports section carries a registration line naming its catalog entries, metrics and attention providers.

**Metric owners (review X11).** Each cross-app measure is defined once, with one owner; other apps reference its metric ID.

| Metric | Owner | Definition |
| --- | --- | --- |
| Orders (count and value) | Sales | Placed orders: excludes open (draft), proposed (quotes) and recurring base orders (`orderPurposeEnumId` RecurringTemplate, review X5). Store and channel cuts use the same metric with `productStoreIds`. |
| Invoiced revenue | Accounting | Finalized sales invoice amounts by invoice date, net of credit memos, in native currency. |
| Visits and attribution | Marketing | Visits captured through MKT-TRACKING (review X10); recorded primary attribution and separate influence. |
| Funnel | Insights | Visits → carts → placed orders → invoiced, each step the owner's metric above (Commerce carts); §12. |

Registered metric IDs: Sales' `Sales.Orders` and `Sales.OrderValue` and Accounting's `Accounting.InvoicedRevenue` (impl-insights P4). Marketing registers `Marketing.Visits` and `Marketing.AttributedOrders` (impl-marketing P20).

| Owner | Initial contribution and authoritative meaning | Boundary and reuse |
| --- | --- | --- |
| Sales | Orders metric; pipeline/forecast by declared stage and date. Catalog owner of SalesAnalysis (`mantle.sales.SalesReportServices.run#SalesAnalysis`) and SalesSummary; also `get#SalesOrderSummary`, `get#SalesTopProduct`, `get#InvoicesByCustomerClass` as appropriate to their verified contract | Ordered, invoiced and collected are separate measures; invoiced revenue is Accounting's metric. Sales owns forecast cohorts/targets; old summaries must gain any missing source scope before admission. Accounting's Reports › SalesAnalysis is a mount of the Sales report, not a second catalog entry. As built, Accounting's SalesAnalysis calls `run#SalesAnalysis` itself and is no mount; until Sales is built the one SalesAnalysis entry, owned by Sales, opens it (impl-insights F18), and impl-sales P19 then moves the entry to Sales' route. |
| Marketing | Visits and attribution metrics; CampaignPerformance, DeliveryAnalysis, AudienceGrowth, Attribution and their proposed Marketing report projections | Preserve accepted versus confirmed delivered, consent/tracking coverage, unique-recipient denominators, late receipts, recorded primary attribution and separate influence. Parent campaigns deduplicate descendant sources. Multi-touch attribution is §12. |
| Customer Service | Case backlog/age, response/resolution/SLA, satisfaction and returns: ServiceLevelCompliance, ResponseTimes, CaseVolumes, SatisfactionResults, CaseAnalytics, ReturnAnalysis | Eligible case cohorts and business-calendar basis belong to Customer Service; Requests without a case extension are not silently support cases. Customer Service registers these entries. |
| Commerce | A Commerce Reports area of four reports, OnlineSales, CartRecovery, PromotionUse and ChannelHealth ([design-commerce §3](design-commerce.md#3-home-reports-and-stores)) over `SalesReportServices` and Commerce's own summaries: store and channel orders (the Sales orders metric, filtered by store), carts and recovery, promotion use and channel health; store readiness is the Admin §14 readiness provider, not a report | Public visits, carts, accepted orders, completed payments and refunds are distinct; orders are never redefined per store. PASS contributes permitted events through shared sources, never through a BOSS dependency on a public session. Commerce registers these entries. |
| Products | Catalog completeness (CatalogChecks), lifecycle, price-list coverage and allowed cost/price projections | Restricted supplier prices and costs stay out of ordinary product datasets; variant parents and SKUs have distinct grain. Products registers these entries. |
| Purchasing | Replenishment, supplier delivery/quality and purchasing history | PO commitment, receipt, accepted quantity and billed quantity are stages linked by source identity; no sum treating them as separate purchases. |
| Warehouse | On-hand/availability, stock-at-date, movements, counts, receiving and shipping; existing `mantle.product.InventoryReportServices.get#InventoryProjectedInfo`, `get#InventoryAtDate` (StockAtDate) and `find#OperationsHistory` (OperationsHistory), built in Warehouse P17 | Physical quantity and Accounting valuation are separate. Snapshot balances are not summed across dates; lot/serial/facility scope applies to every result. |
| Manufacturing | Production plan/run state, yield, material/time/variance and OperationPerformanceReport including OEE, with the release scope decided by Manufacturing | Production run, operation, output and material movement have declared grain. Manufacturing owns OEE exposure and production denominator; maintenance intervals are an input. An unavailable source waits for admission without changing the domain report's release classification. Manufacturing registers these entries. |
| Maintenance | WorkStatus, PreventiveCompliance, cost and later reliability projections | Count execution roots, exclude templates/steps, preserve due-obligation exclusions and unknown evidence; union overlapping outage intervals per resource. |
| Accounting | Invoiced revenue metric; statements, aging, partner ledger, invoice reconciliation, ledger, trial balance, budget variance and valuation via domain services: `mantle.ledger.LedgerReportServices.run#IncomeStatement`, run#BalanceSheet, run#CashFlowStatement, run#RetainedEarningsStatement, run#FinancialRatios, run#PostedAmountSummary, get#PeriodSeriesSummary, run#Aging, run#PartnerLedger, run#InvoiceReconciliation; `mantle.ledger.FinanceReportServices.run#TrialBalance`, run#GeneralLedger; `mantle.other.BudgetReportServices.run#BudgetVariance`; `mantle.product.InventoryReportServices.run#InventoryValuation` (Warehouse mounts it, crosscut §3.25) and `run#StockTransactions` (design-accounting StockTransactions) | Posted financial facts and period-close policy stay Accounting-owned. Prefer these authorized service-source frames to eventually consistent search data for authoritative statements. Until Sales is built, Accounting's SalesAnalysis is the report the Sales-owned entry opens (impl-insights F18). Cash forecasting is the separate later capability (§12). |
| People | Proposed PeopleReportServices: headcount/turnover, recruiting, attendance/leave, payroll, expenses, qualifications, review completion | Person versus employment grain and headcount as-of are explicit. Payroll/private review datasets need distinct grants and projections; management access alone exposes neither. |
| Projects | Existing `mantle.work.ProjectReportServices.get#TimeReport`, get#WorkItemSummary, get#PortfolioStatus, get#ProjectProfitability, get#Utilization, get#ProgressBreakdown, get#SprintBurndown and get#SprintVelocity | Projects owns utilization/capacity, billable value, costing, sprint commitment and subtree rules. Cross-project dashboards belong here; no second capacity or billing calculation. |
| Commons/Comms | Authorized workload and delivery readiness summaries | Personal Today, mailbox unread and approval counts remain their owners' services. No cross-user message-body dataset or sum of duplicated task sources. |
| Admin/Monitor | Safe integration/data-refresh/recipient-delivery readiness references | Infrastructure diagnosis, logs, secrets, jobs and recovery stay Admin/Tools. Management sees a source readiness state and authorized link, not telemetry or credentials by implication. |

### 6.3 Rules for cross-app comparison

- Use canonical source identity and explicit grain. Order header/parts/items, invoice items/applications and source allocations cannot be naively joined into multiplied totals. A composite key stays composite in source metadata and drill links.
- A recurring base order (`orderPurposeEnumId` RecurringTemplate) is a template, not a sale: every order measure and order dataset excludes it (review X5); its renewals count as orders when placed.
- A target is comparable only with the same basis, unit and cohort. Rates expose numerator/denominator and missing coverage; averages and percentages are recomputed from their defined components, not summed.
- Keep native currencies separate. An optional converted measure names reporting currency, rate source, effective date, rounding and missing-rate behavior supplied by the owning domain. No default USD or fixed decimal precision is introduced.
- Fiscal ranges come from the chosen organization's fiscal calendar. Resolve to explicit bounds before invoking the framework engine; its instance-wide fiscal-start configuration does not define every legal organization's year. Cross-organization comparison names the common calendar basis.
- Historical “as of” requires an actual historical source. A current snapshot queried with an old date filter is not historical state. Partial periods, late facts, corrections and source watermarks remain visible across all output modes.
- Aggregate privacy is a domain rule, not an Insights workaround. Protected fields are absent from source answers. A People dataset may expose only approved aggregates; repeated filtering/drill cannot reconstruct denied personal values.
- Source services return display labels and date/amount text as appropriate; client JSON does not manufacture date types or business names. All calculations use decimal semantics and domain rounding.

**Source.** Domain report sections, particularly Marketing §11, People §12, Projects §11, Maintenance §8 and Accounting §13. **Needs:** INS-02, INS-03, INS-09.

## 7. Scheduled reports and management digests

### 7.1 First-release delivery

The user-facing promise is precise: **no internal recipient receives more than they are authorized to see**. The first release keeps that promise without running the report once per recipient (review Z7):

- **Personal.** The owner is the only recipient. The framework's owner render is already the owner's own authorized result. Any reader with `INSIGHTS_SCHEDULE` may schedule a report for themselves; setting an alert is an author's or a distributor's (§8).
- **Owner-equivalent group.** A distributor (S) adds internal users and groups only when proposed `ReportServices.check#ReportAudience` shows that each recipient's scope fingerprint equals the owner's for this definition.
  - The scope fingerprint is a hash of the recipient's grants on the definition and on every dataset and service source it reads, the resolved row filters of those sources (`rowFilter`, `contextFilters` and `rowFilterService` results) and the organization scope.
  - At save, a recipient with a different fingerprint is refused, with the reason shown to the distributor without the other person's grants. Group members are expanded and checked one by one.
  - At each run, the check repeats. A recipient whose scope changed is skipped with the safe reason `scope-differs`; the others are delivered.
- **Separate messages.** Each recipient gets a separately addressed message through the existing email/template transport. No two recipients share a To, CC or BCC line. Each delivery has its own outcome row and retry (`ReportRecipientDelivery`).
- **Render reuse.** One render serves every recipient with the same definition version, scope fingerprint and locale. Owner equivalence means one fingerprint, so a group usually needs one render per locale.
- **Caps.** A business schedule or business alert rule has a recipient cap, an Insights Settings value (50 by default) under an Admin instance ceiling (200 by default); each default holds until its setting exists (§16). The ceiling exists (impl-admin P8): the framework instance preference `report.groupRecipientCeiling`, read with `org.moqui.admin.ConfigurationServices.get#InstancePreference` (its `numberValue`; no Mantle or BOSS needed), 200 by default, 1 to 500. An alert rule keeps the framework's 500-series cap. A group alert evaluates once, as owner, because equivalence makes that evaluation valid for every recipient; it then notifies each recipient separately.
- **Ownership.** If the owner is disabled, their schedules and rules pause. Admin's lifecycle calls the admin-callable proposed `ReportServices.pause#OwnedSchedules(userId)`. They stay paused until proposed `transfer#DefinitionOwner` moves them to a qualified owner, who must pass the same audience check (Admin §14 Lifecycle participant; review Z3).

Audiences whose scopes differ, such as a regional report to each regional manager, wait for full recipient execution (§7.2), which is later. Until then such a report is a personal schedule each manager sets up.

### 7.2 Recipient execution (later)

The later contract removes the owner-equivalence limit: **each internal recipient receives the report they are authorized to see**, computed as that recipient. The schedule owner administers the composition and timing; the owner is not the data principal for recipients. This applies to inline images, titles containing values, attachments, previews, links and later stored downloads alike.

Extend the framework schedule model with explicit execution mode `recipient` for BOSS-created business schedules. Existing technical Tools owner-mode schedules remain owner-mode; opening one from an administrative index does not convert it. Converting a legacy schedule is a reviewed operation with visible recipients and source compatibility; incompatible old finds remain personal until admitted.

Only the trusted scheduler selects the execution principal from that validated occurrence's active internal recipient set. Public query, preview, screen and export requests cannot supply `runAs`, an arbitrary execution user ID or a forged delivery ID to obtain another principal's result. The recipient worker is an internal non-remote service; its caller is not accepted as authorization evidence without the persisted occurrence/recipient claim.

At creation/change, validate the owner's schedule/distribution authority, definition and referenced-source access, permitted internal audience and template/profile. At run time:

1. Claim a single occurrence through the existing ScreenScheduled/ScreenScheduledLock machinery. Pin the schedule revision, definition/dependency versions, intended organization scope and an absolute reporting period. Expand effective internal group membership into user IDs and deduplicate IDs; selecting a user and a group containing them creates one delivery.
2. Check the owner is active and still authorized to administer/distribute this definition. Resolve each recipient's current active account, effective membership, approved organization relationship and address. Newly added group members start at the next occurrence; removed members cannot receive a pending/retried occurrence.
3. For each recipient, enter a fresh authenticated context and authorize the definition, each dependency, dataset/service source, row/field scope and output action. Fixed report filters narrow this view; they never add authority. A selected recipient who lacks definition/source access is skipped with a safe reason; selection itself creates no sharing grant.
4. Render under that recipient with their locale/time display preferences and the occurrence's fixed reporting boundaries. No owner frame is reused. A render is shared only by recipients with the same definition version, scope fingerprint, locale and source watermark, as in §7.1.
5. Immediately before an external effect, recheck the lease, schedule revision/state, owner authority, recipient eligibility/address and their current authorization. If authorization/scope changed since rendering, discard the staged output and rerender; if it is now denied, skip. A fresh identity plus a framework scope revision/fingerprint or equivalent full authorization revalidation is required; a stale session capability map is insufficient.
6. Deliver one separately addressed message per recipient through the existing email/template transport. Never place differently authorized recipients on one To/CC/BCC message. Persist the result and continue other independent recipients when one fails. Owner loss, schedule cancellation or an invalid shared definition blocks remaining delivery for the occurrence.

Proposed framework `moqui.report.ReportOccurrence` and `ReportRecipientDelivery` records, which the first release already uses for separate messages, track occurrence key/time, pinned versions/period, schedule owner/revision, recipient/channel, state, safe reason, attempt identity, message ID, provenance and private artifact reference. Their uniqueness is occurrence plus recipient plus channel. Use status/enumeration data for pending, rendering, ready, sent, skipped, failed and uncertain. Existing schedule leases remain the outer claim; per-recipient claims/outbox identity prevent competing workers sending the same child.

Retry only failed recipients; never replay sent recipients. Recheck current eligibility and authority and keep the same reporting period and definition versions. If the source cannot reproduce its old watermark, rerender with a new disclosed watermark; do not claim an identical historical snapshot. An ambiguous transport outcome is uncertain and requires reconciliation before resend; SMTP does not provide an exactly-once promise. Safe reason codes distinguish no address, removed audience, denied source, empty, source failure, paused, transport failure and uncertain delivery.

An empty result is assessed per recipient. A recipient with no readable panels is skipped, not sent a blank report that reveals denied titles. A configured composition may deliver independent permitted panels when another source fails, but marks the output incomplete; sections requiring complete reconciliation block that recipient's composition. Partial/unknown data cannot satisfy “only send when data” by masquerading as a valid zero.

### 7.3 Artifact, privacy and lifecycle boundaries

Private report artifacts are readable only by their recipient while current authorization still permits the stored content. Downloads require authentication and recheck definition/source scope; a changed scope invalidates the stored artifact and offers a newly rendered result instead of releasing old broader content. No bearer/public URL or generic shared save-to location is offered by Insights. Recipient access is not inherited from a shared Commons folder. Expiration and retention use Admin policy; immutable delivery evidence can outlive content without retaining its values.

An owner/distributor sees recipient identity where allowed, status, time and safe reason codes, not another recipient's frames, attachments or private query diagnostics. Preview is the caller's own authorized view. A “check recipients” action reports eligibility, never impersonates them to show content. Admin may pause and transfer administration under its audited lifecycle contract, through `pause#OwnedSchedules` and `transfer#DefinitionOwner`, but gains no recipient data access. A transfer checks the new owner and leaves the schedule paused until validated; it does not rerun already delivered occurrences.

Legacy ScreenScheduled screenPath/FormListFind rendering must obey the same policy when admitted for group distribution. The source is a registered screen/report adapter, not an arbitrary URL; its saved find must be readable by each recipient. Personal legacy schedules can continue as self-delivery with current authorization. Direct calls to older ScreenServices or generic entity writes must not bypass the business mode. **Needs:** INS-01, INS-03, INS-06, INS-11; Admin ADM-LIFECYCLE, ADM-RETENTION, ADM-AUDIT.

### ScheduledReports

**Layout.** List with Mine, Shared administration and Received views. Existing framework schedule services remain the execution source; proposed safe projections distinguish administrator metadata from the recipient's content.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ScheduleFind | find | Find permitted schedules | owner, definition, state, delivery window | typed filters | extended ReportServices.list#Schedules | MyAccount ScheduledFinds |
| ScreenScheduledList | list, read | Show schedule and readiness | name/source, timing/zone, mode, audience count, next/last result | status chips; detail links | same; proposed ReportServices.find#ReportOccurrences | baseline ScreenScheduledList; framework Reports |
| NewSchedule | dialog | Start personal or group delivery | report reference, schedule, format, audience | registered reports; user/group search | extended ReportServices.create#Schedule | framework Reports |

**Actions.** New schedule is primary. Pause/resume and Send now confirm the report and eligible recipient count; Send now creates a separate explicit occurrence, not a replay of an uncertain attempt. Bulk pause returns per-schedule results. A reader without schedule rights still sees Received links for their own results. **Source:** research §9; existing scheduled finds. **Needs:** INS-06, INS-11.

### ScheduledReportDetail

**Layout.** Detail header and tabs Composition, Delivery, Eligibility, Runs. The framework report composition is reused; the recipient controls are proposed extensions.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EditScreenScheduled | single | Set timing and output | definition, cron/preset, zone, format, active interval, skip-empty | human schedule description; preview | proposed ReportServices.store#Schedule; existing create#Schedule/pause#Schedule extended | MyAccount EditScreenScheduled; framework Reports |
| ReportAudience | single | Select permitted internal recipients | users/groups, organization scope, sending profile/template, equivalence result per recipient | authorized lookups; audience count; recipients outside the owner's scope listed as refused | proposed ReportServices.check#ReportAudience, store#Schedule | framework userId/userGroupId; research §9 |
| OwnPreview | component | Preview the caller's result | own frames/output, period, completeness | framework PDF/table preview | ReportServices.preview#Report | framework Reports |
| ScheduleRuns | list, read | Follow occurrences | time, period, sent/skipped/failed/uncertain totals | ReportDelivery links | proposed ReportServices.find#ReportOccurrences | framework job result pattern |

The new/edit schedule input is `{screenScheduledId?, definitionId or registeredReportId plus formListFindId, organizationPartyIds, variables, filters, cronExpression, timeZone, fromDate, thruDate, renderMode, noResultsAbort, recipientUserIds, recipientGroupIds, emailTemplateId, sendingProfileId, emailSubject, expectedRevision}`. The server sets the delivery mode: personal when the owner is the only recipient, owner-equivalent group otherwise (§7.1); recipient mode is later. Definition and registered legacy source are mutually exclusive. Templates/profiles come from Comms-approved business choices; relay credentials stay Admin-owned. Explicit timeZone determines cron and DST behavior: execute once per intended local occurrence, skip nonexistent local instants to the next valid instant and do not duplicate a repeated local time. The persisted absolute occurrence key makes retry independent of a clock change.

**Actions.** Save is primary; activate/resume only after eligibility checks. Pause, Send now, change audience and transfer administration confirm consequences. Changing a running schedule cancels not-yet-delivered children of the old revision; already sent evidence remains. **Source:** research §9; baseline and framework schedule controls. **Needs:** INS-06, INS-11.

### ReportDelivery

**Layout.** Detail with occurrence period/version, source readiness, own result where eligible and safe recipient outcomes. A recipient who is not an administrator sees only their own delivery.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Occurrence | display | Explain what ran | schedule/revision, period, definition versions, completion state | provenance and safe counters | proposed ReportServices.get#ReportOccurrence | framework schedule audit; domain batch outcomes |
| RecipientOutcomes | list, read | Explain independent results | eligible recipient, state, safe reason (including `scope-differs`), attempt time | scoped row retry; no payload preview | proposed ReportServices.get#ReportOccurrence | Admin import/job outcome pattern |
| OwnArtifact | display | Access one's output | format, generated time, source watermark, expires | authenticated download; rerender notice | proposed ReportServices.get#RecipientReport | framework preview/export |
| RetryRecipients | list, bulk | Retry known failed deliveries | selected failed child IDs, reason | confirmed count | proposed ReportServices.retry#ReportRecipients | independent-row retry pattern |

Retry input is `{occurrenceId, deliveryIds, expectedRevision, reason}`; recipients and content cannot be replaced in a retry request. Uncertain rows offer reconciliation and an explicitly authorized new attempt, not a blind Retry button. **Source:** research §9; current scheduler's lease/failure behavior. **Needs:** INS-06, INS-09, INS-11.

### ManagementDigest

**Context passed.** Reuse framework report composition editor with a report Definition. The digest selects registered library panels or dashboards, their order, range/variable bindings and brief explanatory text. The schedule is the same ScheduledReportDetail, personal or owner-equivalent group (§7.1); it has no separate timer, metric snapshot or mailer.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DigestComposition | component | Choose a management summary | title, panel/dashboard references, sequence, period bindings, commentary | framework composition editor | ReportServices.save#Definition | Odoo digest; framework composition |
| DigestPreview | component | Review own result before scheduling | values, changes, meaning, as-of, missing sections | same rendered report/table | ReportServices.preview#Report | framework reports |

Period comparison and commentary distinguish facts from authored explanation; an Assist draft is reviewed under the same author permission. A digest does not add per-recipient values into a shared summary, since recipient scopes may overlap. Preferences and unsubscribe/pause use the common delivery policy. **Source:** research §§9,15. **Needs:** INS-02, INS-06, INS-09.

### As built (impl-insights P7, Nov 10, 2026)

- **The framework** (mr-moqui `crates/moqui-report/src/delivery.rs`, docs/tools/Monitoring.md "Report delivery"): the services
  of §15.2's delivery row are built, with `reconcile#ReportRecipient` and `find#OwnedSchedules` beside them. The scope
  fingerprint is a hash of what the user reads of the definition and everything it references, the documents of each dataset
  they may read, each dataset's resolved row filter and, where a dataset's records are restricted, whether they hold them, and of what a dashboard reads without naming it (a query's default telemetry dataset, the change markers and,
  over a business dataset, each registered source of business events); it
  is computed in a context of its own signed in as that user. The organization scope is in it through the organization row
  filter of each dataset, not as a value of its own. A definition over a service source is not comparable (the service decides
  its scope in its own code), so it is delivered to its owner alone until a service source can declare its scope.
- **Which schedules.** One saved by `store#Schedule` (`deliveryMode` personal or group), and any report schedule whose
  definition reads a business dataset or another whose rows depend on the viewer (a `rowFilterService` or `contextFilters`:
  `mantle-business-events`), whatever wrote its row (the "direct calls must not bypass the business mode" of §7.3):
  one made by Tools' `create#Schedule` is checked recipient by recipient at each run. Technical schedules are unchanged.
- **Records.** `moqui.report.ReportScheduleRecipient`, `ReportOccurrence` (keyed by the schedule and the cron instant, or a
  Send now) and `ReportRecipientDelivery` (unique by occurrence, recipient and channel; pending, sending, sent, skipped, failed,
  uncertain, with a safe reason code). No row keeps a report: OwnArtifact is the report rendered again as its recipient
  (`get#RecipientReport`), released only while their fingerprint is the one the delivery was sent under. Stored private
  artifacts with retention wait for Admin's retention policy.
- **The cap** is `recipientCap` on the schedule, 50 from Insights until Settings holds it (P10), held by the engine under
  Admin's instance preference `report.groupRecipientCeiling`. A group that grows past it is sent to in user order up to the
  cap, the rest skipped (`over-cap`). An occurrence that runs again (a run that ended before the schedule's last run time was kept) sends to nobody
  whose delivery is sent or not known.
- **Group delivery** needs the engine's artifact `org.moqui.report.delivery.group`, which setup grants the distributor; the
  five reading groups hold `INSIGHTS_SCHEDULE` and the engine's own-schedule operations, so every reader schedules for
  themselves: the grants decide it (`BOSS_INS_REPORT_OWN` and `INSIGHTS_SCHEDULE` for each of the five, as §1.1 says
  personal scheduling adds to the reader's grants). A distributor proposes Insights readers (holders of `INSIGHTS_VIEW`) and groups they belong to; the check
  decides. A recipient must read the report itself as well as its data: a private dashboard or digest is refused for
  anyone else (`not-shared`) until its owner shares it with a group they are in. A named recipient who may not receive refuses the save; a group's member without an address or an active account
  is skipped at each run instead.
- **Retry** needs the schedule and the definition unchanged since the occurrence (else send a new occurrence) and renders
  again: the period is the definition's relative range at the retry, not the occurrence's instant (a schedule's own time zone
  and a pinned reporting period are not built; the scheduler's zone applies).
- **Ownership.** A run that finds its owner inactive pauses the schedule (`owner-disabled`); Admin's lifecycle participant
  `insights.schedules` is the engine's `find#OwnedSchedules`, `pause#OwnedSchedules` and `transfer#DefinitionOwner`
  (`REPORT_OWNER_CHANGE`, the identity operator's and the administrator's). A transfer moves the schedule with the
  definitions it needs that the leaving owner owns, to an owner who may schedule, reads every source and, for a group
  schedule, may deliver to a group; it stays paused (`transfer-pending`) until the new owner resumes it, which checks the
  recipients against the new owner's scope. An owner who is active again may resume a schedule paused for them.
- **Legacy.** A screen schedule (`screenPath`, a saved find) the user set up for themselves is listed under Mine and its
  timing, format and subject changed in ScheduledReportDetail, its row kept; it takes no other recipient. The framework sends
  a screen schedule to a user group only when its screen path is a registered `ReportLegacyAdapter`, one message a member the
  saved find is shared with; none is registered, so every legacy schedule is personal.
- **Screens.** `Insights/ScheduledReports` is a parent whose default is the list `Schedules` (ScheduleFind with Mine, Shared
  administration and Received; ScreenScheduledList; NewSchedule), with the hidden ScheduledReportDetail (one page of boxes,
  not tabs: EditScreenScheduled, ReportAudience with each recipient's result, OwnPreview, ScheduleRuns) and ReportDelivery
  (Occurrence, RecipientOutcomes with RetryRecipients as the list's selection action and Reconcile on an uncertain row,
  OwnArtifact). `Insights/ManagementDigest` lists the digests the viewer reads, with DigestComposition as a form (name, one
  to six dashboards the composer reads, one period, a commentary, a share group) saved through `store#Digest` as a report
  definition of kind digest, not the framework's composition editor, and DigestPreview as the caller's own panels and file.
  The author and the distributor compose; mr-boss ships `insights-weekly-digest` over the suite dashboard. Home's DigestPreview
  shows the digest the user chose (Show on Home, the `InsightsDigest` preference) until Settings names an organization default
  (P10). Period comparison is each panel's own; an Assist draft of the commentary waits for P10.
- **The message** is the `BOSS_INSIGHTS_REPORT` template, whose link opens Insights' Dashboard; sending profiles and
  Comms-approved templates are not built (one template, the instance's mail server).
- **As it is now** (Nov 11, 2026; §4.2). Schedules, ScheduledReportDetail and ReportDelivery are the framework's Dashboards screens,
  mounted by location under `Insights/ScheduledReports`, whose `always-actions` add the organization's recipient cap to the root's
  policy. The people and groups a distributor proposes and names are accepted by the framework's `find#ReportRecipients` under the
  policy's permission (`INSIGHTS_VIEW`), and the transitions write the policy's email template and cap on every save, never a
  request's. What a viewer is offered is their own grant of each engine operation: the `INSIGHTS_SCHEDULE` and
  `INSIGHTS_DISTRIBUTE` checks of Insights' own delivery services went with them. `ironstone.insights.DeliveryServices` keeps
  `preview#Report` and the four digest services, and `template/InsightsDeliveryTransitions.xml` keeps `previewFile` for
  ManagementDigest. A schedule made in owner mode is listed under Mine and paused, resumed and sent, and since Nov 12, 2026 its timing and
  output change there too (the engine's `store#Schedule` with no recipient list), its recipients, message and location
  kept as they were made; a refusal is the transition's error.

## 8. Business alerts

### 8.1 Query, state and confidentiality

An alert references the same versioned metric/query used by its panel.

**First release (review Z7).** Business alerts are personal, or go to an owner-equivalent group (§7.1). The framework evaluates the rule once, as its owner; each recipient's fingerprint equals the owner's, so that one state is valid for all of them. Each recipient is notified separately. A recipient whose scope changed is skipped with `scope-differs` at the next notification, and the recipient cap of §7.1 applies.

**Later.** For audiences whose scopes differ, the framework evaluates the query and condition independently as each eligible internal recipient, with the same scope/field and lifecycle checks as scheduled delivery. State, pending/recovery durations, series identity, deduplication, silences and output are then keyed by recipient as well as rule/series. A narrow recipient can satisfy a condition when the owner's wider aggregate does not, so an owner-fired event cannot trigger recipient evaluation. The framework alert model gains business recipient mode and recipient identity on its state/notification keys, and technical owner mode for Monitor/Tools stays as it is. Shared contact points, mute timings and silences remain framework definitions. A business author can silence their own recipient state; organizational suppression needs authorized rule administration and is audited. It does not erase state or change another person's data authority.

No Data, Error, insufficient coverage, incomplete source and stale source are distinct from Normal. Only a valid scoped reading moves a rule through its configured condition/recovery logic. A missing series follows the declared pruning/resolution rule with a neutral explanation, not a fabricated recovered value. Repeated notification follows framework grouping/repeat timing and per-recipient idempotency; one failed contact does not stop other recipients.

Notifications and email contain only that recipient's permitted metric label, value, unit, range and authenticated link. A recipient who cannot evaluate receives no value-bearing alert. Default BOSS channels are private in-app notification and approved account email; alerts to a Comms chat room are in Open (§17), and general external addresses, Telegram and business webhooks are deferred. Operational Admin/Monitor alerts may remain owner-evaluated, but notifications to other users disclose only authorized redacted incident state/link; broader values, dimensions and diagnostics require their own permission. The existing technical webhook capability remains Admin/Tools, not an Insights grant.

The current private `ReportAlert` topic is in Updates. Register a separate private actionable business-alert topic where intervention is expected, with canonical definition/own-instance IDs and minimal payload; informational recoveries/digests follow Commons topic policy. Topic subscription is never metric access. Alert values are not copied into general Chatter, group chat, public spaces or header counters. **Needs:** INS-03, INS-07, INS-10.

### As built (impl-insights P8, Nov 10, 2026)

- **The framework** (mr-moqui `crates/moqui-report/src/alert_delivery.rs` with `alert.rs`, docs/tools/Monitoring.md
  "Business alerts"). A rule is a business one when its body names an `audience` or its query reads a business dataset or
  another whose rows depend on the viewer (as a schedule, §7 "As built"), whatever wrote its row. It is evaluated once, as
  its owner; it takes `audience` (`recipientUserIds`, `recipientGroupIds`, `channels` notification and email, a topic, an
  email template, a cap) in place of contact points, and a contact point, a webhook or an address refuses the save; the
  engine sets `deliveryMode`. An active rule is saved only when every recipient passes `check#ReportAudience`'s check for the
  rule and the audience is within §7.1's cap; at each notification every recipient is checked again and told separately, one
  whose scope differs skipped with `scope-differs`, a failed one tried again at the next evaluation, nobody told a state
  twice within the repeat interval. Each recipient's last outcome is a `moqui.report.AlertRecipientDelivery` row (the state's
  name and a safe reason code, no value); `find#AlertDeliveries` reads them (the owner's rules, the caller's own, or for
  `ADMIN_TRANSFER_VIEW` counters by rule with no title, series, recipient or value). `get#AlertState` answers each series'
  state and last value to the owner and to a recipient whose fingerprint equals the owner's now. A source whose index is
  older than its fields is Error; a business rule writes no marker on the shared time series and opens no incident. The new
  audience fields are those of AlertDetail's table but `sendingProfileId` (one template, the instance's mail server, as §7).
- **Who is told.** Those the audience names: the owner is told when named, or alone when nobody is. A recipient must read
  the rule itself as well as its data (`not-shared` otherwise), so a group audience's rule is shared with a group they are in.
- **Who sets one** (§1.1, §2: A/S edit; R own state). Setting, copying, changing, activating and deleting a rule need
  `INSIGHTS_AUTHOR` or `INSIGHTS_DISTRIBUTE`; other people and groups need `INSIGHTS_DISTRIBUTE` (a person an Insights reader,
  a group one the distributor belongs to) and the engine's group delivery artifact. A plain reader sets none, and the grants
  decide it: the engine's `save#Definition` is `BOSS_INS_REPORT_AUTHOR`'s and `BOSS_INS_REPORT_DISTRIBUTE`'s, and the root's
  `reportPolicy.features.alert` is an author's or a distributor's, so §7.1's "any reader with `INSIGHTS_SCHEDULE`" holds for
  scheduling, not for alerts.
- **Inactive until validated.** A rule made from a panel and a copy start paused (`not-validated`). Activate runs the rule's
  reading as its owner, then saves it active, which is the engine's check of the owner's sources and of every recipient. The
  shipped templates (Mantle's `mantle-sales-daily-floor`; mr-boss's `boss-service-sla-breach` and Commerce's three, which no
  longer carry a contact point) are listed under Templates, each copied only over a dataset its copier reads.
- **The topic and the message.** mr-boss seeds `InsightsBusinessAlert` (private, in Notifications); its message is the rule
  id, the series ids, their states and the recipient's own permitted values, linked to AlertDetail, and it goes to that one
  user whatever subscriptions the topic has (a subscription to all of a topic's messages receives none; review R2). A series
  removed after going missing is not told as Normal (review R4). The email is the
  `BOSS_INSIGHTS_ALERT` template to the recipient's account address. The topic, the template, the link and the cap (50 until
  Settings holds it, P10) are Insights', not a caller's.
- **Screens.** `Insights/Alerts` is a parent whose default is the list `Rules` (AlertFind with Mine, Received and Templates;
  Pause, Activate, Delete and a bulk pause that answers each rule), with the hidden AlertDetail: one page of boxes
  (BusinessAlertBasis as a form over the saved query's measures, AlertAudience with each recipient's result, OwnAlertState,
  AlertDeliveryStatus), the same form creating a rule from a dashboard panel's New alert rule (offered where the
  root's `reportPolicy.features.alert` holds: one who may set an alert; `reportLinks.alertRule` is where a rule opens for any
  reader). Since Nov 11, 2026 (§4.2) Rules and AlertDetail are thin wrappers over the framework's Alerts and AlertRule, one
  list and one editor for Tools and Insights: under Insights' policy they list and open business rules only, a rule watches a
  panel's saved query, and every save writes Insights' topic, template, link and cap. Insights' own alert services are gone.
  AlertShared is not mounted, and the contact point, silence, mute timing, shared item and evaluation transitions are not
  taken in: no contact point, silence or mute timing is edited in Insights. "Test" runs the reading as the caller and sends nothing; "Send test to me", silences and a
  manual retry of one notification are not built.
- **Ownership.** Admin's lifecycle participant `insights.alerts` is the engine's `find#OwnedAlertRules`,
  `pause#OwnedAlertRules` and `transfer#AlertRuleOwner` (`REPORT_OWNER_CHANGE`); a rule whose owner cannot sign in pauses at
  its next evaluation, and a transferred rule stays paused until its new owner activates it.

### Alerts

**Context passed.** Reuse framework Alerts with business-recipient rule filter, own recipient-state projection, permitted rules/contacts and same-app links. Rule administrators can see safe counts of evaluations/delivery failures, not recipients' private series/value lists. Under Insights (Nov 12, 2026) `reportLinks.alertRule` opens a rule in AlertDetail for every reader and `alertShared` is null (no shared items); `reportPolicy.features.alert` (an author or a distributor) decides whether Mine and Templates, Copy, Pause and Delete are offered, and `alertAudience` keeps the list to business rules.

**Actions.** New from panel preselects its registered query; A/S may save a rule template, and a distribution-qualified owner activates its eligible audience. Copying a shipped rule is inactive until validated. Pause/resume, silence and deletion confirm the rule and intended scope. **Source:** research §9; framework Alerts and AlertShared. **Needs:** INS-01, INS-07.

### AlertDetail

**Context passed.** Reuse framework AlertRule query, reduce, threshold, pending period, recovery threshold, No Data/Error policy, shared contact/silence/mute references and history. The BOSS mount sets the delivery mode from the audience (personal or owner-equivalent group, §7.1) and removes arbitrary-address/contact creation. Owners see their own values and safe audience readiness; authorization is checked again in the evaluator and delivery path. Under Insights (Nov 12, 2026) `reportPolicy.alertAudience` is what every save writes (the `InsightsBusinessAlert` topic, the `BOSS_INSIGHTS_ALERT` email template, the link to AlertDetail), `recipientPermissionId` (`INSIGHTS_VIEW`) whom a distributor may name, `features.alert` who may save at all, and the Alerts area adds the organization's recipient cap. With no mount an audience told by email that names no template is sent the framework's `REPORT_ALERT`.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessAlertBasis | single | Select the authoritative reading | panel/metric version, scope, range, reduction, threshold/unit | registered metric picker | ReportServices.save#Definition; proposed business-rule validation | framework AlertRule; research §9 |
| AlertAudience | single | Select internal delivery | users/groups, profile, permitted channel, equivalence result per recipient | authorized lookups; eligibility | proposed ReportServices.check#ReportAudience; extended ReportServices.save#Definition | §7.1 audience contract |
| OwnAlertState | list, read | Explain one's evaluated condition | permitted series, value, state, first/last time, coverage | history/annotations; scoped drill | extended ReportServices.evaluate#Alerts and state read | framework AlertInstance |
| AlertDeliveryStatus | list, read | Follow failures without sharing values | recipient or own delivery, state, safe reason | retry/reconcile links | proposed ReportServices.find#AlertDeliveries | framework AlertNotification |

New audience fields are `{recipientUserIds, recipientGroupIds, channels, emailTemplateId, sendingProfileId, expectedVersion}`; no raw recipient address or credential is accepted. Conditions use the framework bounded vocabulary and compatible units. “Test” evaluates only the caller's scope and never sends; “Send test to me” is a separately confirmed own delivery. Alert history is not publicly readable annotation data: classification and recipient scope carry into history/export. **Source:** research §§9,12; built framework alert states and contacts. **Needs:** INS-03, INS-07, INS-09.

## 9. Business flow maps

### 9.1 Suite templates and organization copies

The map is clickable documentation, not an executable workflow or a new source of business state. Ship read-only suite templates from Marble's customer, internal and supplier lanes, extended with the final application ownership/handoffs. An organization can make an editable copy. Suite updates never overwrite local edits; the copy records its source template/version and can compare/reapply selected changes explicitly.

**Storage (review Z11).** A flow map is a framework `moqui.report.Definition` of type `report` with `body.kind` `flowmap`, as a playlist is `report` kind `playlist`. There is no BOSS map record. This gives maps, with no new store:
- versions with diff and restore (DefinitionVersion);
- references and "used in" lists (DefinitionReference);
- owner and group sharing;
- export and import;
- git sync of a folder.

The suite templates ship as mr-boss `report/insights-flowmap-*.json`. The framework loads them read-only, and an organization's editable copy is a saved copy through `ReportServices.copy#Definition`.

The body holds:
- organizationPartyId;
- sourceDefinitionId and sourceVersion, recorded by the copy;
- stable lane IDs and step IDs, each step with actor/title, order and description;
- each step's registered target and typed parameters;
- an optional catalog or metric count reference and an optional Commons wikiPageId.

No arbitrary JavaScript, SQL, HTML, service call or public URL execution is stored in a step. Proposed `ironstone.insights.FlowMapServices.validate#Map` checks a body against the target registrations before `ReportServices.save#Definition`. `get#Map` validates again at render, so a definition saved through Tools cannot add an unregistered target.

A target resolver uses report/shell route registration and current permissions. No-access steps keep neutral process explanation if the map itself is readable but omit sensitive counts and active record links; unauthorized record names are never materialized. Missing/unimplemented targets are visibly informational and do not become broken links. Count definitions are the same domain queries as the target worklist, with organization, period and source basis fixed. A count failure affects that step only. Sequential arrows express normal business relationships, not a promise every organization performs every step or a sum of unique cases.

### FlowMaps

**Layout.** List of suite templates and organization maps, with source/version and last changed. A user's default is a preference pointing to an accessible map; the organization's default is an authorized setting.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapFind | find | Select scope and template | organization, name, template/copy, state | safe choices | — | research §13; app lists |
| MapList | list, read | Open a map | title, organization, source/version, updated | map/editor links | existing `org.moqui.report.ReportServices.list#Definitions` (type `report`, kind `flowmap`) | Marble flow map; coarchy stories |
| CopyMap | dialog | Make an organization copy | source map/version, destination organization, title, group | organization and group lookups | proposed `ironstone.insights.FlowMapServices.copy#Map`, which calls `ReportServices.copy#Definition` and records the source | coarchy copy; framework read-only template pattern |

Copy input is `{sourceDefinitionId, sourceVersion, organizationPartyId, title, userGroupId}`; owner and new ID come from the server. Clone copies references, not the referenced reports/content or their permissions. **Actions:** Open; F can Copy, set default and retire a local map. **Source:** research §§13,17. **Needs:** INS-08.

### FlowMap

**Layout.** XML report: a map and organization bar, the map body, and a selected-step explanation beside an ordered lane/step list. The map body is the lanes as columns of their steps in order, each step with its count, what it leads to and Information where it has nothing to open, drawn with the screen's own XML widgets: the evaluation of §17 item 1 rejected the framework node-graph panel (no groups, names or links, and a panel reads the report engine's queries, not a service), and the widgets need no `.qvue`. They stack at phone width and read in the same order in the TUI and in print; `get#Map` still answers the handoffs as edge rows (source, target, names, lanes, count) for a node graph that learns groups. Narrow screens and the TUI show the same ordered actor/step list, count, state and links; no spatial interaction is required to read or navigate.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapContext | find | Select an authorized map view | map, organization, period, counts on/off | authorized selectors | — | Marble dashboard; research §13 |
| ProcessLanes | component | Explain the flow | actor, step, description, source count/state, next link | lanes as columns of step rows (XML widgets); ordered list twin (StepList) | `ironstone.insights.FlowMapServices.get#Map` with registered count providers | Marble sequence diagrams |
| StepDetail | display | Explain a handoff | owning app, prerequisite, target meaning, source/as-of, article | worklist and article links | `FlowMapServices.get#Map` (selected step) | coarchy process stories |

**Actions/navigation.** Open worklist and Read procedure are primary for the selected step according to available targets. A report count can open Drill; operational decisions remain on the owning screen. F can open the editor or copy a suite template. The map never completes tasks, posts accounting or changes order status. **Source:** research §§13,15; Marble dashboard. **Needs:** INS-02, INS-08, INS-09.

### FlowMapEditor

**Layout.** XML editor with map identity, ordered lane/step lists, target selection, preview and versions. Direct list editing/reorder controls suffice; no new freeform diagram-authoring engine is required.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapIdentity | single | Name and share a copy | title, description, organization, group | organization/group choices | proposed `FlowMapServices.store#Map` (validate#Map, then `ReportServices.save#Definition`) | app settings; template-copy pattern |
| Lanes | list, editable rows | Arrange actors | laneId, title, description, sequence | move up/down; named remove confirmation | `FlowMapServices.store#Map` | Marble customer/internal/supplier actors |
| Steps | list, editable rows | Define documentation and target | stepId, lane, title, order, target, count, article | registered route/metric/page selectors | `FlowMapServices.store#Map` | coarchy nested activities; research §13 |
| MapVersions | list, read | Compare and restore | version, note, author, date, source version | diff/restore preview | existing `ReportServices.versions#Definition`, `get#DefinitionDiff`, `restore#Definition` | framework definition history |

New map input is `{definitionId, title, description, organizationPartyId, userGroupId, lanes:[{laneId,title,description,sequenceNum}], steps:[{stepId,laneId,title,description,sequenceNum,targetRegistrationId,targetParameters,countMetricId,wikiPageId}], expectedVersion, versionNote}`. IDs are stable within the map; parameters are validated against the target registration. Organization cannot be reassigned across scopes by editing a hidden field. Referenced content is checked but not automatically shared. Restoring creates a new current version; deleting a used step/map reports affected defaults/links. Publication/revision confirms the organization and map; concurrent edits are refused by version. **Source:** research §13; coarchy copy/story pattern. **Needs:** INS-08.

### ProcessStory

**Context passed.** Mount Commons Knowledge, designed in [design-drawers-commons Knowledge](design-drawers-commons.md#knowledge), with wikiPageId, its existing space context and a map/step return link. Use its version/history/review, file and co-editing implementation and terminal/Markdown fallback. Map-read permission grants no wiki-page access; editing requires the existing Commons page/space capability. The map holds a link, not a copied article body or a separate review workflow. **Source:** research §13; Commons Knowledge. **Needs:** INS-08, INS-10.

### As built (impl-insights P9, Nov 10, 2026)

- **Storage and templates.** As designed: a `report` Definition of kind `flowmap`. The suite ships `report/insights-flowmap-customer.json`, `-internal.json` and `-supplier.json` (Marble's three actors, each now a map of its own with the built apps as lanes). A shipped definition's engine version is always 0, so a template carries `templateVersion` in its body, which a copy records as `sourceVersion`; a map whose source has since changed says so and is left as it is. Comparing is opening both; reapplying selected changes is not built.
- **Registrations.** A step names a flow target (`ironstone.insights.FlowTarget`, mr-boss seed, one row a built app's worklist: its route and its parameter contract, each parameter a `choice` of listed values or the `organization` of the map's scope, which is set when the map is read and never stored), an attention provider for its count (`countProviderKey`, the same registry as Home's board), a metric and a catalog entry for its meaning and its report, and a Knowledge page. A metric registration computes no value (§6.1), so a step's count is always a provider's. Sales, Marketing, People and Maintenance have no registration yet and their steps are information.
- **Validation.** `validate#Map`'s check runs in `store#Map`, `store#MapLane`, `store#MapStep` and `copy#Map` (a save with a problem is refused, each named with a reason code) and in `get#Map` at every read (a reference that does not hold is cleared, so the step reads as information; the problems are listed for flow editors only). Only the fields the check knows are read or saved, so a stored URL or script is ignored. Text is shown as text: a `${` is refused at save and broken at read, and no stored text is ever expanded.
- **Reading.** `get#Map` answers a worklist link only when its route opens to the viewer's own groups (and they hold its permission), a count through the attention board's own rules (the owner's count service as the viewer, left out when refused, Unavailable for that step alone when it fails), a report by its owner's catalogue and a Knowledge page only when the viewer's own grants open Commons Knowledge and the wiki lets them read it. The engine answers a definition to its owner and the group it is shared with; Insights adds that an organization's map is read only by one who sees its organization.
- **Editing.** A map is changed by its owner (the engine's rule), a flow editor, with the version read; another flow editor copies it. A map starts as a copy (`copy#Map`: one engine save, the caller's, with the source and its version; nothing of the source's sharing goes with it). Lanes and steps are edited a row at a time; versions, what a version changed (by lane and step) and Restore are the engine's. Saved reports' SaveAs does not copy a flow map.
- **Defaults.** A user's default map is the `InsightsFlowMap` preference (`store#DefaultMap`); the organization's default is an Insights setting (§11, built with P10), opened when the viewer has none of their own and reads it.
- **ProcessStory** mounts Commons Knowledge (and its terminal twin) under `Insights/Flows/ProcessStory`, with the way back to the map and step above it. Nothing below the mount is served unless the viewer's own grants open Commons Knowledge, since the Insights root's grant would otherwise cover Knowledge's transitions.
- **Grants.** No screen grant: every Insights user opens Business flows and each service checks `INSIGHTS_VIEW` or `INSIGHTS_FLOW_EDIT`. The flow editor's group holds no engine authoring operation: its grant is on FlowMapServices' six writing operations (`BOSS_INS_REPORT_FLOW`, an inheritable ALWAYS), so the engine's save, restore and delete are reached only below them, after their checks, and a flow editor saves no playlist, search or dashboard (the P9 review).

## 10. Shared screen contexts

All mounts use crosscut §1.1: the server resolves shared capabilities from permissions and record scope; appRoot supplies navigation only. Report return context contains permitted definition/metric IDs, filters and range, never frames, recipient artifacts or client-supplied authority. The default Insights action set is read-only. A user who needs an operational action follows the authorized owning-app route, preserving source identity and filters.

| Screen | Context passed | Tabs, emphasis and action boundary |
| --- | --- | --- |
| OrderDetail | orderId, orderPartSeqId where relevant, direction, organization, report return | Read canonical order/part quantities and amounts, source shipments/invoices and permitted conversation/files. Commercial changes remain Sales/Purchasing; a report link cannot approve an order. |
| Customer360 | partyId, authorized customer relationship, period and report return | Customer facts and permitted Sales/service/financial summaries; each tab independently scoped. Insights access exposes no receivable, private contact or marketing audience by itself. |
| Supplier360 | partyId, authorized supplier relationship and report return | Supplier performance and permitted orders/receipts/bills; no supplier-price or payment authority inferred from a count. |
| Product360 | productId, organization/facility where applicable and report return | Product identity, relevant operational connections, authorized prices/costs; cost fields omitted without their separate grant. |
| RequestDetail | requestId, registered request/case kind and report return | Projects-owned shared request screen with the domain's authorized extension. Customer Service SLA/claim behavior stays with that owner; no task or case completion from analytics. |
| WorkItemDetail | workEffortId, project/process scope and report return | Projects' shared task/work record. Private project/review/payroll context is never exposed through a generic WorkEffort query. |
| ShipmentDetail | shipmentId, direction, facility scope and report return | Shipment/receipt facts and permitted sources; Warehouse owns receiving/picking/shipping actions. |
| Employee360 | partyId and eligible employment key, as-of, report return | People-owned permitted employment/directory panes; aggregate access does not grant individual payroll, medical, review or document access. |
| FacilityDetail | facilityId, authorized organization and report return | Facility identity and permitted operational use; room booking/maintenance policy remains its owner. |
| EquipmentDetail | assetId, authorized owner/custody relation and report return | Equipment identity, availability/maintenance summary and permitted book context; no inventory or financial mutation. |
| InvoiceDetail | invoiceId, payable/receivable direction and report return | Accounting's authorized invoice/source/payment projection. Different financial-read permissions remain distinct; posting/payment/credit actions link to Accounting. |

These are Context passed definitions for every reused record row in §2; the owning forms are not copied here. Each owner's per-app table carries a read-only Insights row (report return, no actions): crosscut §3.2, §3.3, §3.4 (Employee360), §3.5, §3.6, §3.8, §3.10, §3.16, Projects §5 and §6, and People §4 (review Z10). Chatter/RecordFiles use the host's canonical access checks and never expose inaccessible source identities. Missing source records show Not available with a return to the report, without revealing whether a denied key exists. **Source:** research §15; crosscut §§3.2–3.12,3.16; People §4 and Projects §§5–6. **Needs:** INS-01, INS-02, INS-04.

As built (impl-insights P6): each mount is the shared record screen under `Insights/Records/` with `appRoot` Insights; the screen's condition fails for Insights, so none of the owners' reads or widgets runs, and it shows `template/InsightsRecord.xml` (for Customer360, Supplier360, Product360 and FacilityDetail, whose tabs are the owners', the one subscreen `InsightsRecord` that Insights' links name). Insights holds no domain permission, so what it shows of a record is what the admitted datasets the viewer reads say of it (`ironstone.insights.DrillServices.get#Record`, Records.js): each source read through the report engine as the viewer, its admission and row filter deciding, with named columns only and never a cost. Today's sources: the sales orders and items (OrderDetail; Customer360's orders; Product360's order items; FacilityDetail's shipping parts), the inventory dataset (Product360, FacilityDetail) and the service clocks (RequestDetail). Supplier360, WorkItemDetail, ShipmentDetail, EquipmentDetail and InvoiceDetail have no admitted source yet and say not available. Beside the sources are the owners' screens of the record, each only where its route opens to the viewer and only for a record a source showed. Product360 does not use Products' shared context (which would read the catalog by Products' permission), so SharedContext.js still refuses Insights. The mount is read only by its path (the P6 review): `Insights/Records` serves a record screen and its `InsightsRecord` subscreen and refuses everything below them (`RECORD_READ_ONLY`), so no transition of a shared screen and no owner's tab runs under Insights for any user, whatever the owner's service would decide; a user who also holds the owner's permission follows the owner's link. A read-only mount declared in the screen definition, in place of the path check, is a framework ask. As built (People P2, an owner contract): `Insights/Records/Employee360` mounts People's `Shared/Employee360` with Insights' row of its per-app context (`ironstone.people`'s `employee360Apps`): the person's Overview alone, read only, as People's scope admits the person to the viewer (a viewer People does not admit sees "Not available"), with the return to the report (Records.js `returnOf`, the drill's own parameters) and an "Open employee record" link where the viewer's own grants open People or Commons. It does not use `InsightsRecord`, since no admitted dataset describes a person until People's datasets (impl-people P29), which also add the drill mapping of a People document to this screen; the Records path check serves it no transition.

## 11. Settings and data readiness

### Settings

**Layout.** Settings index and organization form, linked from Admin's settings index through its single owner registration. Personal favorites/layout belong to the user, organization defaults to Insights, and instance limits/credentials to Admin/Tools.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AnalyticsDefaults | single | Set organizational defaults | default map/dashboard, display zone/week start, default digest, freshness policy, recipient cap for group delivery | authorized definition/map choices; cap at most the Admin instance ceiling | proposed ContextServices.store#Settings | research §11; app settings pattern |
| ScopeAndDelivery | display | Explain effective controls | organization calendar, export cap, delivery modes (personal, owner-equivalent group), retention, sending readiness | canonical Admin/Comms links | proposed ContextServices.get#Context; the framework's `org.moqui.admin.ReadinessServices.get#Readiness` | Admin settings index |
| SourceOwners | list, read | Find accountable stewards | source, domain owner, status, permitted maintenance link | DataReadiness links | `org.moqui.admin.ReadinessServices.get#Readiness` (freshness facet) | research dataset settings |

New settings input is `{organizationPartyId, defaultMapId, defaultDashboardId, displayTimeZone, weekStart, defaultDigestDefinitionId, freshnessPolicyId, groupRecipientCap, expectedRevision}`. Defaults come from effective organization/user settings; an empty choice remains empty. Fiscal start is not independently editable here: Accounting's organization calendar is authoritative. Instance resource/export ceilings can only be narrowed by business policy, never raised by an app form. No “disable permissions,” public links toggle or arbitrary recipient address field exists. **Source:** research §§11–12,17. **Needs:** INS-01, INS-06, INS-09; Admin ADM-SETTINGS.

### DataReadiness

**Layout.** List of sources needed by permitted catalog entries/dashboards, with last successful watermark, lag, coverage, validation and owner. A detail dialog shows safe checks and related definitions; it is not a replacement for Monitor.

**One readiness contract (review Z9).** DataReadiness has no registry of its own. It reads the readiness providers of Admin §14, the framework's registry since Nov 11, 2026 (`org.moqui.admin.ReadinessServices`), through their freshness facet: watermark, expected frequency, lag and coverage. Refresh goes through the same registry's refresh-operation contract. A domain registers its sources once, and Admin Health and Insights both show them. Each dataset's index lag comes from the provider that `index#BusinessDataset` registers.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReadinessFind | find | Select source health | organization, domain, source, state | status filters | — | Admin operations/readiness pattern |
| SourceReadiness | list, read | Explain data availability | source, watermark, expected frequency, lag, completeness, owner | authorized diagnostics link | `org.moqui.admin.ReadinessServices.get#Readiness` (freshness facet, Insights sources) | research §11; Marketing watermark contract |
| RefreshRequest | dialog | Request an admitted refresh | source, organization, requested scope, reason | registered operation only | `org.moqui.admin.ReadinessServices.request#Refresh` | framework DataFeed/jobs |

New refresh input is `{refreshKey, scopeParameters, reason, operationKey}` (a scope is the registration's own parameters); this is a request to the owning registered operation, never a user-selected service/index. The service checks the registration's own permission, so an Insights steward or author does not need an Admin permission. The actor needs its existing operational permission. Display delayed/failed/unknown separately; no broad “refresh all” hides partial failures. One source failure is logged by name while independent sources continue. Existing after-commit feed failures remain recoverable without rolling back business records. **Source:** research §§11,17; framework reporting security/monitoring; domain readiness contracts. **Needs:** INS-03, INS-09; Admin ADM-OPERATIONS.

## 12. Later capabilities

Later is a decided release boundary, not an unresolved choice. These items do not block the initial catalog, governed builder, first-release delivery or flow-map capability.

### CashForecast

Accounting explicitly leaves cash forecast to Insights. Its later screen is an XML report with declared scenarios; the business forecast calculations belong in proposed `mantle.ledger.CashForecastServices`, alongside the source financial policies, not a BOSS-only arithmetic script. INS-12 owns that Mantle service as a work item, with Accounting reviewing its source rules (cash balances, due obligations, settlement evidence), so Accounting's needs table carries no separate row (review R-INS-08).

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ForecastOptions | single | Choose horizon and basis | organizations, starting as-of, horizon/grain, native/reporting currency, scenario | fiscal/period inputs; assumption disclosure | proposed CashForecastServices.get#Options | Accounting cash handoff; research financial dashboard patterns |
| ForecastAssumptions | list, editable rows | State scenario timing | source class, shift/probability, confidence, explanation | bounded typed assumptions | proposed CashForecastServices.preview#Scenario | explicit scenario comparison |
| CashProjection | list, read | Explain expected movements | period, opening cash, expected inflow/outflow, closing cash, uncertainty | table-backed graph; source drill | proposed CashForecastServices.run#Forecast | financial report archetype |

Complete scenario input is `{organizationPartyIds, asOf, horizonEnd, grain, currencyMode, reportingCurrencyUomId, ratePolicyId, includeCommittedOrders, includePlannedPayroll, assumptions:[{sourceClassEnumId,dateShiftDays,realizationPercent,reason}], scenarioId?, expectedVersion?}`. Start with authorized reconciled bank/cash balances and open invoice/payment obligations; optional commitments, payroll and scenarios are explicitly separated. Deduplicate an order commitment once its invoice/payment replaces that exposure. Missing due dates, rate data or payroll authority produce excluded/unknown exposure, never zero obligations. Actual receipts/payments and projected movements remain separate. No forecast posts, schedules payments or promises funding. **Source:** Accounting Decided, research §§7,15. **Needs:** INS-12, INS-02, INS-03.

### Other deferred items

| Capability | Decision and dependency |
| --- | --- |
| Funnel (review X11) | Insights owns the funnel metric: visits (Marketing, MKT-TRACKING) → carts (Commerce) → placed orders (Sales) → invoiced (Accounting), each step the owner's registered metric, drawn by the framework funnel panel with the store and period filters fixed. Each step keeps its owner's exclusions, and the funnel never recounts. It ships once Marketing's visit capture (review X10) is admitted; until then Commerce and Sales measures stand alone. |
| Multi-touch attribution | Marketing records touches and owns the attribution model service; Insights presents a multi-touch view over Marketing's registered metric beside its recorded primary attribution. No Insights-side model or weights. |
| Recipient execution (§7.2, §8.1 later) | Full per-recipient report and alert execution for audiences whose scopes differ; framework INS-06/INS-07. |
| Generic pivot/graph on arbitrary form-list and "Add to my dashboard" from any list | Extend framework list metadata/renderers only with admitted measure/grain and full-query adapters; retain current domain report/table fallbacks. Add to dashboard is available first for registered supported sources (review INS-F05). |
| Analysis notebooks | Text plus panels as a standalone document, reusing the ManagementDigest composition (review INS-F02). |
| Query result caching | Interactive results cached by definition version and scope fingerprint, beyond the delivery render reuse of §7.1 (review INS-F04). |
| SQL/script query mode, external warehouse and analytics data store | No first-release execution surface. A later design must supply isolation, authorization, provenance and source operations; do not fill unused moqui.olap dimensions or deploy a warehouse merely to match a reference product. |
| Public/anonymous dashboard links and general external report/alert delivery | Deferred. Signed-in embeds and internal recipient identity are the initial contract; PASS receives no public reporting capability by implication. |
| Advanced forecasting and cross-dataset joins | Require domain-owned grains/source reconciliation and resource limits; arbitrary joins and inferred correlations are not admitted business metrics. |
| Rich per-breakpoint dashboard arrangement | Reuse current framework layouts/responsive stacking; richer arrangement is framework work if needed, not a private BOSS layout format. |

## 13. Coverage and acceptance

### 13.1 Research candidate disposition

| Research candidate or open question | Decision and destination |
| --- | --- |
| Home/favorites/recents/needs attention/digest preview | Home §3 with registered AttentionProviders and the DigestPreview card; organizational attention complements personal Commons Today. |
| Assist answering analytics questions; lineage, verify and profile tools (research §§14–15) | §1.2 Assist and MCP analytics: the `insights-analyst` skill and READ tools over admitted metrics and datasets; lineage is the metric's source reference and DatasetUses; verify is DatasetValidation. |
| Dashboard list/view/editor, filters, targets, drill | §4 framework mounts plus typed target and Drill; one library-panel model. |
| Number/chart widgets and Add to dashboard | Framework panel/editor/embeds; §4 and eligible §5 registered source adapters. Existing funnel/geomap are reused; no separate chart library. |
| Dataset/report builder, analysis/pivot | §5 DataDocument parity plus admitted framework query/transform pipeline. Raw SQL/script remains §12 later. |
| Catalog/saved reports/views/pins | §6; owner reports stay canonical; FormListFind remains distinct from report Definition. |
| Scheduled delivery, KPI alerts, management digest | §§7–8; personal and owner-equivalent group delivery with separate messages and per-recipient outcome/retry first; recipient execution later. |
| Share dialog/read-only shared dashboard/embed | Dashboard sharing form and ordinary authenticated Dashboard route; same definition/source checks. No separate anonymous page. |
| Business flow viewer/editor/process stories | §9 suite templates plus organization copies; Commons owns story content. |
| Data administration/refresh | Datasets (admission, `index#BusinessDataset`) and DataReadiness over the Admin readiness and refresh contracts; Tools owns index deletion, raw feeds, jobs and credentials. |
| Insights settings linked from Admin | §11; organization fiscal policy remains Accounting-owned. |
| Separate OLAP/store or date dimension | Not needed for initial SearchFacade/service-source reporting; computed grain and explicit calendar bounds suffice. |
| Pivot/graph ownership | Framework renderers now; generic find-screen adapters explicitly later. |
| Cash forecasting handed off by Accounting | CashForecast §12; a designed later capability with sources and uncertainty stated. |

### 13.2 Baseline forms and service coverage

Add these mappings to the inventories' Designed in columns without replacing other owners or changing Implemented in. A catalog link alone does not make Insights the designer of the linked report's forms.

| Baseline section/screen | Forms | Designed destination |
| --- | --- | --- |
| SimpleReport / FindReport | CreateDataDocument; DataDocumentList | Insights/ReportBuilder/Datasets |
| SimpleReport / EditReport | EditDataDocument | Insights/ReportBuilder/DatasetDetail |
| SimpleReport / FieldList | AddCondition; ConditionList; FieldList | Insights/ReportBuilder/DatasetFields |
| SimpleReport / QuickViewReport | DataDocumentList | Insights/Reports; Insights/SavedReports |
| SimpleReport / ViewReport | ExportDocuments; DataViewList | Insights/ReportBuilder/DatasetView |
| MyAccount / ScheduledFinds | ScreenScheduledList | Insights/ScheduledReports |
| MyAccount / EditScheduledFind | EditScreenScheduled | Insights/ScheduledReports/ScheduledReportDetail |
| Marble dashboard | flow-map sequence diagrams and counters, not independent inventory forms | Insights/Flows/FlowMap; Home management attention; global search remains the shell palette |

Mantle services explicitly selected in §6.2 for admitted business panels are mapped to `Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest`; their business formulas remain with the owner. Record-mount services stay traced through the shared owner's design; do not add every service reachable through a link. The root's setup#UserOrganizationInfo is mapped to Insights context if the inventory records setup callers. Framework ReportServices, EntityServices, ScreenServices and Wiki services are outside the Mantle USL inventory and are traced here instead. Proposed services never receive an Implemented in claim.

Legacy saved finds/schedules are inventoried by ID, owner, source route and sharing. Preserve their data and personal delivery where valid; route migration rewrites registered references and bookmarks through a deliberate migration, with a visible invalid-source state for unsupported definitions. Do not keep hidden alias routes or silently broaden a private find into a group dataset. No migration auto-activates a previously inactive alert or copied digest.

### As built (impl-insights P12, Nov 11, 2026): the legacy mapping

- **Inventoried by ID, owner, route and sharing.** SavedReports lists the user's and their groups' saved finds with the route each opens or why not (P4); `RegistryServices.migrate#LegacySavedFinds`, an instance administrator's upgrade step, answers every saved find of an Insights list (FormListFind under `screen/Insights/`) and every schedule of an Insights screen (ScreenScheduled) by ID, owners, groups and list or path, with what the mapping does to it, and writes nothing unless asked to apply.
- **Rewritten by a deliberate migration.** Two lists of the copied screens have a registered successor: the copied builder's FieldList (DatasetDetail/FieldList's FieldList and ConditionList, now DatasetFields') and the copied scheduled finds' list (ScheduledReports' ScreenScheduledList, now Scheduled reports' Schedules). With apply, a find on one is moved to its successor with its owners, groups and fields (a field the new list lacks is named), and a schedule of the old screen path takes the new one. P7 converted the copied personal scheduled finds themselves.
- **An unsupported one shown invalid; no alias routes.** A find on a list that is gone with no successor (the copied builder's raw document list, the legacy report picker's) stays as it is, and SavedReports shows it as not valid, with no link: no hidden route sends it to another screen, and nothing widens a private find into a group's.

### As built (impl-insights P10, Nov 10, 2026)

- **The defaults are PartySetting types** mr-boss seeds for internal organizations (`InsightsDefaultDashboard`, `InsightsDefaultMap`, `InsightsDefaultDigest`, `InsightsDisplayTimeZone`, `InsightsWeekStart`, `InsightsFreshnessPolicy`, `InsightsGroupRecipientCap`), so Admin's OrganizationDefaults lists them too. `ContextServices.store#Settings` writes them for an organization in the caller's scope at the revision read (`INSIGHTS_SETTINGS_EDIT`); the input is §11's with `organizationPartyId` and `expectedRevision`. The week start and the freshness policy are enumerations, which Admin may also change as any typed default; the others carry no pattern, so Admin shows them as set by Insights and the cap has one path. `get#Settings` (added) answers the form, its choices and SourceOwners to a holder of `INSIGHTS_SETTINGS_VIEW`, and ScopeAndDelivery to every reader.
- **Where each default applies.** The dashboard: Home, when the viewer has arranged none and reads it, before the suite overview. The flow map: Business flows, after the viewer's own default. The digest: Home's preview, after the viewer's own. The time zone and week start: the time grains of Insights' own typed queries (Analysis, Assist) for that organization, and `get#Context`'s defaults; a saved dashboard's buckets stay the viewer's zone and the instance's week start, which are the engine's. The freshness policy: DataReadiness. The cap: every save and check of a schedule's or an alert rule's audience (`Insights.js recipientCap`), which the engine keeps under Admin's `report.groupRecipientCeiling` and stores on the schedule or rule, so a lowered cap reaches an existing one at its next save. A caller of several organizations with none active gets the lowest of their caps and the strictest of their freshness policies.
- **A cap above the ceiling is refused** (`RECIPIENT_CAP_CEILING`) and nothing is stored; the ceiling itself is Admin's instance setting. A default definition is chosen among what the saver reads and is shown only to a viewer who reads it. Fiscal start is not here.
- **ScopeAndDelivery** is a read: the fiscal calendar (Accounting's), the display zone and week, delivery modes and the groups that may schedule and distribute as their permissions stand, the cap and the ceiling, the export limit, what is kept, report mail's readiness for one who may read that check, and the freshness policy, each with its owner's screen when the viewer's own groups open it.
- **DataReadiness** is `RegistryServices.find#SourceReadiness` over the framework's `org.moqui.admin.ReadinessServices.get#Readiness` (Admin's registry until Nov 11, 2026) as the viewer (the providers of owner Insights: one per business dataset), with each source's domain owner and class (`ironstone.insights.DatasetClass`) and the organization's policy applied: ready and older than the policy allows is Stale, with its lag; Needs review, Failed and Unavailable stay apart. `get#Readiness` is any signed-in user's and every reading group holds the engine's dataset listing, so a reader sees the sources they read; the refresh is `request#Refresh` of one of Insights' registrations with a reason, offered and run only where the registration's permission (`INSIGHTS_DATASET_EDIT`) and the dataset's own update grant hold. The settings index holds one entry, `insights.settings`.

### 13.3 Acceptance scenarios

Each scenario is an acceptance test to write (`test/acceptance/Insights/`, `test/acceptance/client/Insights/`), named in the
implementation plan; the rules it relies on get their own regression tests. No route fixtures: a screen sweep is an
acceptance test, one per app per mode.

| Scenario | Required result |
| --- | --- |
| Reader versus author/steward/distributor | Each UI affordance has a successful authorized case and an otherwise valid denied direct-service case. Editing alone grants no source read. |
| Two organizations and confidential fields | Dataset choices, suggestions, aggregates, raw rows, labels, inspection, export, embeds, Assist and drill all retain source scope. People/payroll/cost fields never reach an unauthorized response. |
| Reconcile domain results | Split orders, invoice credits/refunds, partially received POs, source allocations, parent/child campaigns, project subtrees and maintenance roots reconcile to their owning reports without duplicate facts. |
| Money, units and calendars | Mixed currency/UOM is grouped or explicitly converted; ratios use correct denominators; organization fiscal periods and DST boundaries match displayed scope; a current snapshot cannot masquerade as historical. |
| Same metric on many surfaces | Landing, dashboard, analysis, alert, digest and CSV/XLSX/PDF use the same authorized query/metadata for a fixed range; allowed display formatting does not change totals. |
| Source quality | Zero, empty, denied, stale, incomplete, unavailable and failed remain distinct. One failed provider/panel does not suppress independent results; a reconciliation-critical composition cannot claim complete success. |
| Owner equivalence (first release) | A group schedule refuses a recipient whose dataset grants or row filters differ from the owner's, at save and at run (`scope-differs`); equivalent recipients each get a separate message; one render serves a fingerprint and locale; the recipient cap holds. Disabling the owner pauses the schedule until a qualified owner accepts it. |
| Recipient differences (later) | Two recipients with different organization and finance rights receive their own correct values; no owner frame, address-deduplicated attachment or shared cache leaks the broader result. Owner preview shows only their own view. |
| Spoofed recipient principal | Client-supplied runAs/user ID, another person's delivery ID and direct internal-worker calls cannot select an execution principal or retrieve another recipient's result. Only a valid claimed occurrence child can run as its approved recipient. |
| Lifecycle during rendering | Owner/recipient disablement, group expiry, scope revocation, address change, schedule edit/pause and definition access loss are rechecked before effect; stale staged output is discarded. |
| Independent retry | One recipient succeeds and another fails; retry sends only the failed child after rechecks. Concurrent workers do not duplicate known success; ambiguous transport is uncertain, not automatically resent. |
| Legacy schedule boundary | An admitted saved find honors recipient scope; arbitrary screenPath/direct older services cannot bypass mode; unsupported old definitions remain personal or unavailable. |
| Business alert semantics | A group alert reaches only owner-equivalent recipients, each separately; later, recipient condition/state can differ from owner and other recipients. No Data/Error is not healthy; private values are absent from safe administrative history and general notification payloads. |
| Dataset admission | A dataset whose feed is unregistered or whose index is unbuilt cannot be admitted; the shipped sales datasets return only the viewer's organizations once their `rowFilterService` is bound; `index#BusinessDataset` rebuilds one dataset's index and shows lag. |
| Single report owner | SalesAnalysis has one catalog entry (Sales); Accounting's route opens it until impl-sales P19 moves it to Sales' route; order metrics exclude recurring base orders. |
| Editable map copies | Copy preserves suite provenance; local edits survive template updates; stale version fails; an unauthorized/missing target exposes no count or live link; a flow-map Definition saved through Tools with an unregistered target renders that step as informational; map actions cannot mutate business records. |
| Definition and source change | Version conflicts, retired fields, changed metric grain and removed references give actionable blockers; restore creates a new version; import/Git sync does not activate delivery or bypass admission. |
| Assist and MCP | Assist's answers and charts come from the same authorized query as the dashboard; an MCP client cannot read a People, payroll or cost dataset. |
| Device and output | Browser, narrow phone and TUI can read/use every screen (one sweep per mode); chart/map has a table/list alternative; exported documents retain filters, units, basis, versions and as-of. |

## 14. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Dashboard/report snapshot | html-print/PDF; PNG where supported | Dashboard, ManagementDigest, ScheduledReportDetail | Existing framework Chromium renderer and composition; include title, organization, range, versions, units, meaning/as-of and incomplete warnings |
| Result tables | CSV/XLSX; admitted JSON detail | Analysis, Drill, DatasetView, owner report routes | Same authorized frames/source query; framework per-table export, not the browser's loaded rows |
| Scheduled report/digest | separate email per internal recipient with their own attachments/image | ScheduledReports, ManagementDigest | Personal or owner-equivalent group delivery §7.1 (recipient execution later); Comms-approved template/profile and framework transport |
| Business alert | private in-app/email | AlertDetail/evaluator | Owner-equivalent condition and payload, one notification per recipient; owner operational alert policy is separate |
| Definitions bundle | JSON import/export | DashboardEditor, PanelDetail, authorized dataset/alert editor | Existing DefinitionReference bundle/remapping; exclude credentials/results and require admission; imported schedules/rules stay inactive |
| Business map | html-print/PDF or accessible ordered list; versioned configuration export | FlowMap, FlowMapEditor | The same map version with authorized links/counts; no hidden source names or operational execution |
| Delivery audit | authorized status export | ReportDelivery, Admin audit link | Occurrence/recipient state and safe reasons; other recipients' report contents excluded |

As built (impl-insights P12, Nov 11, 2026), output by output:
- **Dashboard/report snapshot:** a schedule's and ScheduledReportDetail's preview formats (P7: PDF, Excel workbook, CSV, picture, the framework's renderer); Dashboard and ManagementDigest have no print action of their own (the browser's print).
- **Result tables:** DatasetView's export (P3; the framework DatasetView's `exportDocuments` transition, the same scoped query, audited); a drill's records are not exported apart (DatasetView serves), and Analysis' result is saved as a panel, not exported.
- **Scheduled report/digest and business alert:** P7 and P8.
- **Definitions bundle:** the export is the mounted editor's (the engine's `export#Definitions`, every reading group's). Import stays Tools', an instance administrator's (`import#Definitions` is denied to every Insights group): the engine already keeps an imported alert rule inactive (it notifies nobody until its owner activates it), saves each definition through the same save as any (the alias and dataset checks), and an imported dataset is a new id, never admitted until a steward admits it; a bundle holds no schedule. An author's import waits on the engine refusing a share with a group the owner is not in (F42, Remaining-Work's report engine row), since a bundle names each definition's group.
- **Business map:** FlowMap's Print (the page in `html-print`, to PDF where the server has one: the same version, its lanes in order and the Steps in order list, with the links and counts the viewer reads); the ordered list is FlowMap's StepList (P9). A versioned configuration export of a map is the engine's definition export (a map is a `report` definition); Insights offers no button of its own for it.
- **Delivery audit:** ReportDelivery's Export status (the framework ReportDelivery's `exportAudit` transition): one run's statuses as CSV, as the page shows them to the caller (the owner every recipient's result, safe reason and attempts; a recipient their own row), no address or content, audited as `delivery-audit`. Admin's administrative read of deliveries is Admin P16's.

Exports and delivery are audited through the existing `moqui.report.audit` target plus proposed occurrence/recipient records. No new ArtifactHit/ArtifactHitBin logging model is introduced. Stored business outputs use Admin retention/classification policy; their access remains recipient/domain scoped. Bundle import is configuration work, distinct from Admin's business-data import and its row outcomes. **Needs:** INS-06, INS-09, INS-11.

## 15. Framework and data needs

### 15.1 Consolidated needs

Existing engine capabilities are foundation, not proposed work. The following extensions are the remaining contracts required by this design; the crosscut roll-up references these IDs. Each stub names its layer: framework (mr-moqui, linked from [Remaining-Work](../../../../../plans/Remaining-Work.md)), Mantle or mr-boss.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| INS-01 Access and context | service type, seed data | ironstone.insights.ContextServices; permission/group/artifact mappings; shared-context integration | all Insights surfaces | Separate read/author/steward/distribution/flow/settings grants; server-derived scope and canonical links; source permissions hold for direct calls, downloads and Assist. Layer: mr-boss. |
| INS-02 Business report and metric registration | data model, service type, seed data | BOSS ReportCatalogEntry; RegistryServices; versioned business metadata on framework definitions and domain service frames; AttentionProvider and annotation-source registrations | Home, catalog, panels, Drill, flow counts, digest | Domain-owned grain/basis/denominator/unit/scope/drill/freshness contract; one owner per metric (orders Sales, invoiced revenue Accounting, visits and attribution Marketing, funnel Insights) and per catalog report; AttentionProvider = key, owner, count service (the worklist's own query), route, scope; annotation source = owner post-commit `create#Annotation`; registered service adapters only; no duplicate formula store. Layer: mr-boss, each app's seed. |
| INS-03 Dataset admission and semantic guards | service type, seed data | Extend ReportServices with `create#`, `store#`, `validate#`, `find#` and `index#BusinessDataset`, `store#BusinessDatasetFields`, `store#BusinessDatasetConditions`; proposed Mantle `mantle.party.PartyServices.get#OrganizationRowFilter`; row filters on the shipped `mantle-sales-orders` and `mantle-sales-items` datasets and a filtered `mantle_inventory` dataset | builder, every query/output | Admission needs a registered DataFeed, a built index and a registered `rowFilterService` as scopePolicyId (`MANTLE_USER_ORG` semantics for organizations); `index#BusinessDataset` rebuilds one dataset's feed index for its steward; entity filters are not inferred; apply server source scope before aggregation/suggestions/export; guard protected fields, incompatible units and nonadditive measures; direct JSON/services cannot bypass. Layer: framework (dataset mutation, indexing), Mantle (row filter service, dataset filters). |
| INS-04 Shared analytics mounts and drill | XML Screen element, service type | Framework: the Definition editor, Explore, Dashboards Home and Playlist mountable under an app root with appRoot-relative transitions and dataset-scoped grants (no `DASHBOARDS_APP`); BOSS: context-aware links and business drill presentation | Dashboards, DashboardEditor, panels, Explore, Analysis, Playlists, other app embeds | Same engine/definition; registered filter and source links; full-query drill with provenance; browser/TUI/phone alternatives. No private renderer. First-release framework need. Layer: framework, mr-boss. |
| INS-05 Catalog personalization and saved-work index | service type | `InsightsHome` UserPreference (arrangement and pins, JSON with revision) through `RegistryServices.store#ReportPins`; authorized RegistryServices projection over Definition/FormListFind | Reports, SavedReports, Home | Per-user pins/preferences with no pin record; distinct underlying kinds; source access on every open; dependencies on finds checked before deletion. Layer: mr-boss. |
| INS-06 Report delivery | data model, service type, seed data | First release: ReportServices `check#ReportAudience` (scope fingerprint equal to the owner's), separate messages, render reuse per definition version + scope fingerprint + locale, recipient cap, ReportOccurrence and ReportRecipientDelivery; admin-callable `pause#OwnedSchedules(userId)` and `transfer#DefinitionOwner` for Admin lifecycle. Later: recipient execution mode | schedules, digest, Admin lifecycle | Owner-equivalence checked at save and run; one message per recipient; independent retry/uncertain outcome; owner loss pauses until transfer. Later: separate owner/recipient principals, fresh pre-effect authorization, private artifacts. Existing technical owner mode preserved. Layer: framework. |
| INS-07 Business alerts | data model, service type, seed data | First release (built, impl-insights P8; §8 "As built"): owner-equivalent group alerts (one evaluation as owner, separate notifications, `find#AlertDeliveries`) and a private business-alert topic. Later: recipient identity and business mode on alert state/contact execution | Alerts, panels, Admin safe status | No owner-value disclosure beyond equivalent recipients; recipient cap; later per-recipient condition and recipient-keyed state/deduplication; technical alerts retain explicitly redacted authorized notification policy. Layer: framework. |
| INS-08 Business flow documentation | service type, seed data | Flow maps as `report` Definitions with `body.kind` `flowmap`; FlowMapServices `validate#Map`, `get#Map`, `copy#Map`, `store#Map`; the `ironstone.insights.FlowTarget` registrations; shipped `report/insights-flowmap-*.json` templates; map body as lanes of XML widgets (the node-graph panel rejected, §17 item 1; built in impl-insights P9) | FlowMaps, FlowMap, editor, ProcessStory | Read-only suite templates plus organization copies through Definition copy/versions/git sync; stable step IDs, typed registered links/counts, Commons article references; validation at save and render; no workflow execution. A bespoke Vue map only if the node graph is rejected (Open). Layer: mr-boss. |
| INS-09 Provenance and readiness | service type, data model | Source metadata/validation contract on registered report results and delivery records; readiness and refresh through the registries of Admin §14, the framework's (freshness facet, refresh operation) | all analytical results, DataReadiness | Explicit watermarks, scope/calendar, metric/definition versions, completeness and reconciliation evidence; independent source failures; unavailable is not zero; no second readiness registry. Layer: mr-boss, framework report metadata. |
| INS-10 Shell and Assist integration | shell item, service type, seed data | Existing provider registrations and screen context; `insights-analyst` skill; `assist-prompt` and `response-action`; `AgentToolExposure` READ rows for `RegistryServices.find#Reports`, `get#Metric` and dataset-scoped `ReportServices.run#Query` (`exposeMcp` by dataset class) | palette, quick create, Today, notifications, Assist, MCP | Safe IDs/filters/frames only; same query authority and bounds; organizational attention distinct from personal Today; proposed output reviewed before sharing/activation. Prerequisites: the Mantle active-organization user-facts provider and the framework per-field AI opt-out. Layer: mr-boss seed. |
| INS-11 Outputs and legacy compatibility | service type, render mode | Extend authorized export/admission and registered legacy schedule adapters; route/reference migration | outputs, saved finds, imports, schedules | Existing renderers/audit reused; preserve legacy IDs/history without bypasses; no silent group sharing or activation; access-checked artifact lifecycle. Layer: framework, mr-boss. |
| INS-12 Later analyses | service type, XML Form element | Mantle `mantle.ledger.CashForecastServices` (owned here, Accounting reviews source rules); the funnel and multi-touch attribution views; later generic list-source pivot/graph adapters and explicitly designed external/public capabilities | CashForecast, funnel, future list views | Scenario sources, deduplication, currency/calendar and uncertainty before forecasting; funnel steps are owners' metrics; no raw-query escape or implicit public distribution. Layer: Mantle, framework, mr-boss. |

### 15.2 Service boundary and minimum interfaces

Names in this table are proposed unless explicitly marked existing. The form summaries use these short families; fields passed as context still must be declared in service parameters.

| Family | Operations and minimum contract | Ownership |
| --- | --- | --- |
| `ironstone.insights.ContextServices` | get#Context(organization/range/record) → authorized choices, capabilities, safe links/defaults; get#Settings(organization) → the controls in effect and, for a settings reader, the defaults, their revision and choices; store#Settings(§11 input) → revision and validated settings; get#ShareGroups → the caller's own groups, for Insights' own forms; get#DeliveryPolicy → the recipient cap a delivering area adds to `reportPolicy`. get#Context also answers `reportLinks` and `reportPolicy` (§4.2) | BOSS access/navigation/settings only |
| `ironstone.insights.AssistServices` (built with impl-insights P10) | run#PanelQuery, find#QuerySources, run#DatasetQuery for Assist and run#OperationsPanel, find#OperationsSources, run#OperationsQuery for MCP; a saved panel or typed choices → the viewer's own frames as rows, by the dataset's class; add#AssistPanel(answer, title, dashboard) → the author's library panel through AnalysisServices | BOSS tool surface over the engine as the viewer; no query language and no engine grant |
| `ironstone.insights.RegistryServices` | get#Home, get#Attention, find#Reports, find#SavedReports, get#Metric, get#ReportOptions, store#ReportPins (the `InsightsHome` UserPreference); authorized filters/paging → display projection, metadata and canonical references | BOSS catalog/composition; calls registered owners without reimplementing their calculations; readiness comes from the framework's `org.moqui.admin.ReadinessServices.get#Readiness` and refresh from its `request#Refresh` (Admin §14) |
| `ironstone.insights.FlowMapServices` | validate#Map, get#Map, copy#Map, store#Map; §9 typed input → validated `report`/`flowmap` Definition and authorized targets/counts. Listing, versions, diff and restore are the existing ReportServices definition operations, called as the viewer by find#Maps, get#MapEditor, restore#Map and delete#Map, which add the kind, organization and owner checks; store#MapLane and store#MapStep change one row; store#DefaultMap, find#MapPages and get#StoryAccess serve the screens (§9 "As built") | BOSS documentation/navigation validation over framework Definitions; Commons owns linked content |
| Existing `org.moqui.report.ReportServices` | run#Query, query#Documents, list#Datasets, get#Dataset, render#Dashboard; get#Definition, list#Definitions, save#Definition, copy#Definition, versions#Definition, get#DefinitionDiff, restore#Definition, delete#Definition, find#DefinitionUses, export#Definitions, import#Definitions; create#Annotation; preview#Report, send#Report, create#Schedule, list#Schedules, pause#Schedule, evaluate#Alerts | Framework engine, definitions and scheduling; extend contracts without BOSS role tests |
| Proposed ReportServices dataset extensions | create/store/validate/find/index#BusinessDataset, store#BusinessDatasetFields, store#BusinessDatasetConditions; §5 inputs → admitted source/version/check results | Framework mutation/admission/index mechanics with domain-supplied `rowFilterService`; existing EntityServices and `SearchServices.index#DataFeedDocuments` used where applicable |
| ReportServices delivery extensions (built with impl-insights P7; `find#AlertDeliveries`, `get#AlertState`, `find#OwnedAlertRules`, `pause#OwnedAlertRules` and `transfer#AlertRuleOwner` with P8) | check#ReportAudience, store#Schedule, find#ReportOccurrences, get#ReportOccurrence, get#RecipientReport, retry#ReportRecipients, reconcile#ReportRecipient, find#AlertDeliveries, find#OwnedSchedules, pause#OwnedSchedules, transfer#DefinitionOwner; §7 inputs → safe status or caller-owned content | Framework audience/lease/outbox/artifact lifecycle; `pause#OwnedSchedules` and `transfer#DefinitionOwner` are callable by Admin's lifecycle coordinator (Admin §14); business mode cannot be bypassed by direct services Admin's Exports (impl-admin P16) reads the two administrative finds for its status list, and its export targets link Insights for dataset rows and reports (`insightsDatasetRows`, `insightsReports`). |
| ReportServices operations for the screens (Nov 11, 2026; [mr-moqui plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md), Track I) | get#BusinessDataset, get#BusinessDatasetOptions, find#ReportRecipients, find#ScreenSchedules, store#ScreenSchedule, find#ShareGroups; `ownerName` in the answers of get#ReportOccurrence and get#AlertState; save#Definition's group rule; create#BusinessDataset asks the update artifact of the dataset named | Framework: what the Dashboards screens read and write as the viewer. They replace Insights' own screen services for datasets, delivery, alerts and sharing (`DashboardServices`, `AlertServices`, six of `DatasetServices`, twelve of `DeliveryServices`), which are deleted; Insights grants each to the capability group that uses it |
| Proposed `mantle.party.PartyServices.get#OrganizationRowFilter` | viewer, dataset organization field → row filter for the viewer's permitted organizations (`MANTLE_USER_ORG`, `MANTLE_ACTIVE_ORG` semantics) | Mantle; registered as a `rowFilterService` for business datasets |
| Existing domain report service families | §6.2 registered inputs and declared outputs → rows/frames plus versioned business metadata; add missing authorization/semantics where necessary | Mantle owns calculations, dates, units, private-field projection and source evidence; BOSS owns view adapters |
| Proposed `mantle.ledger.CashForecastServices` | get#Options, preview#Scenario, run#Forecast; §12 input → authorized source movements, scenario projection and uncertainty | Later Accounting-domain calculation, owned as INS-12 and presented in Insights |

Framework functions remain in the current `moqui-report` crate and shared webroot/TUI widgets; domain services stay in Mantle and run without BOSS installed. Generic reusable widget changes follow style-guide §8.1 across XSD, renderers/static mirror, browser wrapper and TUI/fallback. This design neither adds a BOSS Rust analytics engine nor a new external datastore.

## 16. Decided

| Decision | Notes |
| --- | --- |
| Insights composes domain-owned business meaning | Catalogs, dashboards and flow maps join the suite; formulas, source authorization and operational report forms remain with their domain. |
| Built reporting tooling is the foundation | Research's planned dashboard/widget/alert gaps are reconciled against current source; Definition, library panels, queries, transformations, exports and widgets are reused. |
| One panel/metric definition across surfaces | Landing, dashboard, alert, digest, export and Assist use the same admitted query and semantic contract. Existing operational cards can adopt it incrementally. |
| Viewer execution for live results | Definition/group sharing grants no data access. Report dataset row filters are explicitly supplied; EntityFilterSet is not presumed to apply to SearchFacade. |
| No recipient receives more than they may see | Business delivery never sends an owner's broader result to a narrower recipient. The first release delivers only to owner-equivalent recipients; later, each recipient's own result. Separate occurrences and child outcomes support rechecks and independent retry. Existing technical Tools schedules retain explicit owner mode. |
| Value-bearing business alerts are never redacted owner triggers | First-release group alerts reach owner-equivalent recipients only; later, each recipient's condition/state is evaluated. Operational alerts retain authorized redacted incident notifications. |
| General external/public reporting later | No anonymous dashboard, bearer output link, arbitrary external address, Telegram or business webhook in the initial surface. Signed-in embeds use viewer authority. |
| Management attention is organizational | It exposes cross-app bottlenecks through owner providers; Commons Today remains personal work, and duplicate source counts are not summed into a suite total. |
| Organization copies of suite flow maps | Read-only suite seeds, editable copies, preserved provenance and explicit revision comparison. The map documents and links; it does not execute business processes. |
| Commons owns process-story content | Reuse Knowledge/wiki with its own access, history and review. Maps store references, not duplicate content or attachment grants. |
| Report builder uses framework query pipeline | Dataset/service source, aggregation roles, server transformations, pivot and comparison; no general SQL/script engine or separate OLAP store. |
| Generic arbitrary-list pivot/graph remains later | Existing framework report rendering is reused now; all-list integration requires source adapters and cannot aggregate only visible rows. |
| Mixed money, units and dates are governed | Separate currencies/units or named domain conversion; organization calendar and historical source basis are explicit. An unlabelled mixed-currency number is not acceptable. |
| Legacy reports/finds retain distinct identities | Catalog links do not relocate owner reports; FormListFind and Definition remain distinct. Scheduled-find parity gains the same business delivery guard. |
| Accounting's cash forecast handoff is accepted | Later CashForecast is designed in §12; it does not change current Accounting statement or payment ownership. |
| Dataset/index operations have one owner | Stewards maintain approved definitions and rebuild their dataset's index (`index#BusinessDataset`); index deletion, raw feeds, jobs, credentials and retention remain Admin/Tools. |
| Audit and failure tolerance reuse the platform | Report audit goes through Monitor; independent panels/sources/recipients continue after named failures. Security/data-authority failures remain strict. |
| First-release delivery (Nov 1, 2026; review Z7) | Personal schedules and alerts, and group delivery only when each recipient's grants and row filters equal the owner's, sent as separate messages; renders reused per definition version, scope fingerprint and locale, with recipient caps. Full recipient execution is later (§7). |
| Dataset admission (Nov 1, 2026; review Z8) | A dataset is admitted only with a registered feed and a built index; the steward reindexes with `index#BusinessDataset`; scopePolicyId is a registered `rowFilterService`, proposed `mantle.party.PartyServices.get#OrganizationRowFilter`; the shipped sales datasets get filters first (§5). |
| Readiness, refresh and attention (Nov 1, 2026; review Z9) | DataReadiness reads Admin §14's readiness provider through its freshness facet and refreshes through its refresh-operation contract; AttentionProvider registration under INS-02 feeds Home (§3, §11). |
| Registry and report owners (Nov 1, 2026; review Z10) | Insights mounts Employee360 and has a read-only row in each owner table; each catalog report has one owner (SalesAnalysis is Sales'; Accounting's is a mount, and until Sales is built the Sales entry opens Accounting's report, impl-insights F18, until impl-sales P19 moves it to Sales' route); Customer Service, Commerce, Products, Manufacturing and Marketing register their reports; pins are a UserPreference, not a ReportPin record (§3, §6, §10). InventoryReportServices and Accounting's `run#Aging`, `run#PartnerLedger` and `run#InvoiceReconciliation` are named sources (§6.2). |
| Flow maps are report Definitions (Nov 1, 2026; review Z11) | A flow map is a `report` Definition with `body.kind` `flowmap`, with versions, read-only shipped templates and save-as-copy, and git sync; no BusinessFlowMap record. The map body uses the node-graph panel unless the evaluation in Open rejects it (§9). Evaluated Nov 10, 2026 (impl-insights P9): rejected; the lanes are XML widgets, with no `.qvue`. |
| Ownership transfer (Nov 1, 2026; review Z3) | Admin's lifecycle calls admin-callable proposed `ReportServices.pause#OwnedSchedules` and `transfer#DefinitionOwner` (§7). |
| Metric owners and the funnel (Nov 1, 2026; review X11) | Sales owns orders, Accounting invoiced revenue, Marketing visits and attribution, Insights the funnel; Commerce reports store cuts of the Sales metric through `productStoreIds`. The funnel is later, after Marketing's visit capture (§6.2, §12). |
| Recurring base orders are excluded (Nov 1, 2026; review X5) | Every order measure and dataset excludes `orderPurposeEnumId` RecurringTemplate orders (§6.3). |
| Stack contributions (Nov 1, 2026; review L1, L6) | Insights ships the `insights-analyst` skill, prompt chips and READ tool exposures with `exposeMcp` by dataset class, requiring the Mantle active-organization provider; it admits each app's shipped `report/*.json` (§1.2, §5). |
| Cash forecast service owner (Nov 1, 2026; review R-INS-08) | INS-12 owns proposed `mantle.ledger.CashForecastServices`; Accounting reviews its source rules (§12). |
| Easy wins (Nov 1, 2026; review R-INS-W01, W02) | Business annotations on time series (§4) and wall-display playlists (§4) are in the design. |
| Reference features (Nov 1, 2026; review §6) | Notebooks, result caching and "add to my dashboard" from any list are later (§12); usage analytics and alerts to chat are Open. |
| Releases and recipient caps (Nov 7, 2026) | Insights is built with Admin in one order ([impl-admin](impl-admin.md) §1): its first release is this design's first release; a second release adds wall displays on shared devices (Playlists with a CX-DEVICE credential, after Admin's Devices). The group recipient cap is 50 per business schedule or alert rule, under an Admin instance ceiling of 200 (§17 Q5). The parts that wait on People, Sales, Marketing and Maintenance are later ([impl-insights](impl-insights.md) §7). |
| Generic screens are the framework's (Nov 11, 2026) | Dataset stewardship, scheduled delivery, the alert list and editor, sharing, playlists, the wall display, drill and analysis are the framework's Dashboards screens, which Insights shows under its root by `reportLinks` and `reportPolicy` (§4.2; [mr-moqui plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md)). Insights keeps its root, Home, the catalog, the record contexts, flow maps, digests, settings and the business parts around the framework's sections. |

## 17. Open

Deployment-specific choices (approved audiences, source freshness limits, retention, sending profiles, fiscal calendars and data classifications) are configuration inputs owned by the named applications. The review's Open items on first-release delivery, dataset indexing owner, flow-map storage, pins, Assist analytics tools and ownership transfer are decided in §16 (review Z3, Z7, Z8, Z10, Z11, L1).

1. **Flow-map body: node graph or bespoke view** (review R-INS-L04, Z11). Answered Nov 10, 2026 (impl-insights P9, F26): the node-graph panel is rejected as it is. It lays nodes in columns by longest path in a fixed-width drawing (220 px a layer, so a lane of ten steps is wider than four phones), shows raw ids cut at 28 characters, has no groups, labels or links (a click opens Explore on `service.name`), words its counts as calls and errors, prints an adjacency list by count in the terminal, and reads its rows from the report engine's queries, which a BOSS service does not feed. The lanes did not need a `.qvue` either: FlowMap draws them with XML widgets (§9 FlowMap), and `get#Map` keeps the edge rows for a node graph with groups, a framework ask. *Recommendation as it was:* evaluate the framework node-graph panel first, with the suite's customer, internal and supplier lanes as node groups. If lanes and step cards read clearly at phone width and in the TUI, FlowMap stays an XML report on it and gains the framework's print and TUI twins. Build a `.qvue` lane view only if the evaluation shows lanes are unreadable, and keep the list twin either way.
2. **Multi-touch attribution handoff** (review R-INS-07). *Recommendation:* Marketing records touches and owns the attribution model service, extending its Attribution report. Insights adds a later multi-touch view over that registered metric (§12) and keeps no model or weights of its own. Marketing's design names this handoff instead of "later Insights work".
3. **Usage analytics** (review INS-F01). *Recommendation:* after the first release, ship a steward-only dashboard over request spans (Monitor Artifacts, `otel_spans`) narrowed to Insights routes. It shows views per dashboard and report and the definitions nobody opened in 90 days, so stewards can retire them. It counts by definition, not by person; per-user detail stays with Monitor's own grants.
4. **Alerts to a Comms chat room** (review INS-F03). *Recommendation:* later, as a contact point on an approved internal room, allowed only when every room member passes the owner-equivalence check, rechecked as membership changes. A room with a narrower member gets a "rule fired" notice with a link and no value.
5. **Group recipient cap default.** Decided Nov 7, 2026 as recommended (§16). *Recommendation:* 50 recipients per business schedule or alert rule as the Insights default, under an Admin instance ceiling of 200. A larger audience is better served by a shared dashboard each person opens with their own authority.
6. **Dataset field and use classes** (impl-insights P3; P10 built a dataset class for Assist and MCP only, as a BOSS registration, and reads a cost or margin field by its name). DatasetScope's permitted fields and uses, classification and the confidential-field projection are not built: the first release scopes rows by the registered policy and leaves fields to the dataset's document. *Recommendation:* build them with the first confidential dataset (People or costs, §7), as a framework field-projection in the dataset definition the engine applies before frames, with MCP exposure by class (P10).
