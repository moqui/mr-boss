# IronStone BOSS — Insights design

Oct 31, 2026 — final design; source-checked against the current framework reporting engine and the other BOSS application designs. This is a design specification, not an implementation-completion claim.

IronStone Insights serves owners, management and authorized analysts. It brings together dashboards and KPIs, a report builder, saved and scheduled reports, management digests, business alerts and clickable documentation of business flows. Each application remains the owner of its business rules, operational reports and measures. Insights makes those measures useful together and makes their meaning, scope and source visible.

**Inputs.** [research-insights.md](research-insights.md); [initial-design.md](initial-design.md); [design-doc-guide.md](design-doc-guide.md); [style-guide.md](style-guide.md); [design-crosscut.md](design-crosscut.md); [design-drawers-commons.md](design-drawers-commons.md); the Sales, Marketing, Customer Service, Commerce, Products, Purchasing, Warehouse, Manufacturing, Maintenance, Accounting, People and Projects designs; [design-admin.md](design-admin.md); [ss-inventory.md](ss-inventory.md); [usl-inventory.md](usl-inventory.md); the framework [Monitoring design](../../../../plans/Monitoring.md#dashboards-and-reports) and [built reporting guide](../../../../docs/tools/Monitoring.md); [application practices](../../../../docs/dev/Practices-App-Dev.md).

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home-and-management-attention) · [4 dashboards](#4-dashboards-and-panels) · [5 builder](#5-exploration-and-report-builder) · [6 catalog and measures](#6-report-catalog-and-domain-metrics) · [7 delivery](#7-scheduled-reports-and-management-digests) · [8 alerts](#8-business-alerts) · [9 flows](#9-business-flow-maps) · [10 shared records](#10-shared-screen-contexts) · [11 settings](#11-settings-and-data-readiness) · [12 later](#12-later-capabilities) · [13 coverage](#13-coverage-and-acceptance) · [14 outputs](#14-documents-and-outputs) · [15 needs](#15-framework-and-data-needs) · [16 decided](#16-decided) · [17 open](#17-open)

## 1. Shell

### 1.1 Root, roles and authority

Root `screen/Insights.xml`, route `Insights`, uses `sym_o_insights` and the existing `BOSS_INSIGHTS` artifact group. The current `BOSS_INSIGHTS_ADMIN` and ADMIN grants in BossSetupData are active; the root's comment saying the grant is commented out is stale. Existing routes are a mixture of working framework mounts, copied baseline screens and placeholders. None establishes that the business contracts below are already implemented.

The root retains existing `mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed `ironstone.insights.ContextServices.get#Context` returns authorized organization choices, capabilities, safe shell context and canonical links. Permissions are checked in the services as well as the screen root. Application access, dashboard sharing, a supplied organization or another app's edit permission never grants underlying record or field access.

| App term | Proposed group or existing administrator | Permissions and responsibility |
| --- | --- | --- |
| reader (R) | BOSS_INSIGHTS_READ | INSIGHTS_VIEW; read permitted definitions, catalog entries and scoped results; each source still requires its domain view permission |
| author (A) | BOSS_INSIGHTS_AUTHOR | INSIGHTS_VIEW, INSIGHTS_AUTHOR; create own analyses, panels and dashboards from admitted sources; share with an authorized group |
| dataset steward (D) | BOSS_INSIGHTS_DATA | INSIGHTS_VIEW, INSIGHTS_DATASET_VIEW, INSIGHTS_DATASET_EDIT; manage admitted business datasets and their documented scope; no unrestricted entity, service or telemetry access |
| distributor (S) | BOSS_INSIGHTS_DISTRIBUTE | INSIGHTS_VIEW, INSIGHTS_SCHEDULE and INSIGHTS_DISTRIBUTE; schedule to approved internal users/groups and inspect safe delivery outcomes; personal scheduling adds INSIGHTS_SCHEDULE to the reader's grants |
| flow editor (F) | BOSS_INSIGHTS_FLOW | INSIGHTS_FLOW_EDIT with INSIGHTS_VIEW; copy and maintain maps for authorized organizations; no operational action permission |
| app administrator (C) | BOSS_INSIGHTS_ADMIN | INSIGHTS_VIEW, INSIGHTS_SETTINGS_VIEW, INSIGHTS_SETTINGS_EDIT and explicitly granted app capabilities; business data, payroll, costs and account administration remain separate grants |

Groups map to permissions and framework artifact grants in setup data; services never test group names. Insights grants only the shared framework screen/service artifacts its capabilities require; using a mount does not require another app's launcher grant or broad `DASHBOARDS_APP`/Tools access. Dataset artifacts, definition ownership and source authorization remain enforced. Do not give business authors `REPORT_DATASETS_ADMIN`, broad System access or the telemetry dataset pattern merely to make an editor work. A domain service-source adapter independently enforces its view and export permissions.

Private definitions are owner-readable; group sharing uses the framework's existing group grant. Sharing does not share the source data. First-release individual collaboration uses an explicitly managed group; a separate per-user definition ACL is not invented. All live queries run as the viewer. BOSS scheduled outputs and value-bearing business alerts run separately as each internal recipient (§§7–8). General external delivery and anonymous dashboard links are later.

### 1.2 Menu, presentation and shell providers

- Home — `Home`.
- Dashboards & KPIs — `Dashboards`.
  - Library panels — `Panels`; contextual `Dashboard`, `DashboardEditor`, `PanelDetail` and `Drill`.
- Report builder — `ReportBuilder/Explore`.
  - Analysis — `Analysis`; Datasets — `Datasets`; contextual dataset detail, fields and preview.
- Reports — `Reports`.
  - Saved reports — `SavedReports`; owner application reports open their canonical routes.
- Delivery & alerts — `ScheduledReports`.
  - Management digest — `ManagementDigest`; Business alerts — `Alerts`; contextual schedule, delivery and alert records.
- Business flow map — `FlowMap`.
  - Maps — `Flows/FlowMaps`; contextual editor and ProcessStory.
- Settings — `Settings`.
  - Data readiness — `Settings/DataReadiness`.

Later screens are absent from released menus until built. Home shows favorites, recently opened dashboards, pinned reports and an organizational attention board. A first-use state offers an authorized shipped dashboard and report catalog; it does not fill empty business data with sample numbers.

XML is the default. Framework report editor/dashboard widgets remain framework widgets with their existing TUI twins; they do not become BOSS `.qvue` forks. The business map has a custom visual layout with an ordered accessible list/tree equivalent. Lists use server paging, names, useful mobile columns and selected-row context. Each record has one primary action and a More menu; destructive or wide effects name the affected definition, schedule or recipient count in confirmation.

Palette contributions find authorized dashboards, saved reports and flow maps. Quick create offers Dashboard, Analysis and Schedule by capability. Today receives only a person's actionable report failure or review assignment, not every KPI reading. Business alert and report-completion topics use the Commons Notifications/Updates distinction; general completion belongs in Updates. The management attention board is not a second personal Today queue. Assist receives safe definition IDs, filters, metric descriptions and authorized frames; it uses the same report services and never inherits the schedule owner's authority. **Needs:** INS-01, INS-10.

### 1.3 Verified foundation and automation

The research's Oct 25 description of the reporting tool as planned is superseded by built source, not by a second design of that engine.

| Verified source | Existing capability and design consequence |
| --- | --- |
| Framework `entity/ReportEntities.xml` | `moqui.report.Definition`, DefinitionVersion, DefinitionReference, DefinitionGitSync/DefinitionGitFile, AlertInstance, AlertRuleLock and AlertNotification exist. Reuse them; no parallel BOSS dashboard or alert-rule store. |
| Framework `service/org/moqui/report/ReportServices.xml` | Existing `org.moqui.report.ReportServices` supplies queries, documents, datasets, dashboard rendering, definitions and versions, dependency uses, import/export, schedules and alerts. Called **ReportServices** below after this full qualification. |
| Tools `screen/Dashboards/` | Home, Dashboard, Definition, Explore, Split, Panels, Datasets, Alerts, AlertRule, AlertShared, Reports, Annotations, Playlist and GitSync exist. Framework editors include `m-report-definition-editor` and `m-report-composition-editor`. |
| Framework widgets and guide | `<report-embed>` and the dashboard/panel widgets render authorized frames in browser, TUI and outputs. Funnel, geomap and node graph already exist alongside stat/table/time-series/bar/pie/gauge/heatmap. They are not missing dependencies. |
| BOSS `screen/Insights/` | Dashboards and Dashboard wrap the framework screens; existing edit/Explore links escape to Tools. ReportBuilder contains DataDocument authoring; Reports is a legacy document selector; ScheduledReports contains copied personal scheduled finds. Replace their behavior deliberately, with compatibility mapping in §13. |
| Framework `entity/ScreenEntities.xml`, `crates/moqui-report/src/schedule.rs` | ScreenScheduled and ScreenScheduledLock are the scheduler foundation. Current report execution renders as owner once and sends the same output to recipients. Recipient execution and durable child outcomes in §7 are proposed extensions. |
| Framework report dataset security | Dataset artifacts, DataDocumentUserGroup and server row filters exist. Existing EntityFilterSet filters are **not** automatically translated into SearchFacade filters; INS-03 is a release dependency. |
| Mantle `report/mantle-sales*.json` | Shipped business datasets, dashboard and daily-sales alert template demonstrate reuse. Their measures need business admission: an ungrouped mixed-currency sum displaying as a plain number is not an acceptable management total. |
| Current Mantle report services | SalesReportServices, LedgerReportServices, FinanceReportServices, BudgetReportServices and ProjectReportServices exist. Use the authorized domain projection appropriate to the measure; older summary functions are not automatically authoritative because they exist. |

Existing jobs and rules stay visible in the design:

| Job/rule | Existing behavior | Disposition |
| --- | --- | --- |
| `render_ScheduledScreens_frequent` → `org.moqui.impl.ScreenServices.render#ScheduledScreens` | Finds due ScreenScheduled rows; `render#ScheduledScreen` dispatches reportDefinitionId rows to `ReportServices.run#ScheduledReport`, other rows to legacy rendering | Keep one scheduler. Add the explicit recipient mode and route both definition and admitted legacy-find schedules through its checks; no second BOSS cron engine. |
| `evaluate_ReportAlerts_minute` → `ReportServices.evaluate#Alerts` | Evaluates saved alert rules; shipped rules become active only after copying to an owner | Keep job and per-rule claims. Extend business mode with recipient-scoped evaluation/state, retaining existing technical owner mode. |
| `FrameworkPullDefinitionGitSyncs`, `service/Git.gitecas.xml` | Git ref updates pull registered definition folders; committed saves can push their files | Keep optional framework behavior. Admin/Tools owns setup and credentials; imported/pulled business definitions pass admission checks and never activate distribution implicitly. |
| DataFeed/DataFeedDocument source indexing | Changed business documents feed SearchFacade indexes | Keep domain feed registration and after-commit processing. Expose source-specific readiness; failed indexing does not roll back an independent business commit. |
| `ReportAlert` topic and existing email delivery | The current topic is private and in Updates; technical alert contacts support notification/email/webhook | Keep technical policy. Business topics and contacts use §8; do not copy owner values into ordinary group notifications. |

No additional broad EECA, wildcard SECA or entity write guard is introduced by this design. Domain services retain their own posting, lifecycle and notification rules; report reads do not trigger business mutations. **Needs:** INS-03, INS-06, INS-07, INS-09, INS-11.

## 2. Screens

Paths are relative to BOSS. `parity` preserves baseline capability, not an implementation claim. Role letters are §1.1; all rows additionally require their source's view permission. Framework reuse rows have a Context passed block below; forms describe the BOSS-specific additions only. Form dialogs without their own subscreens remain on their parent.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Insights/Home | landing | xml | Show management priorities and frequently used analysis | scoped provider results | own §3 | R | new | organization, period, authorized selection |
| Dashboards | Insights/Dashboards | list | xml | Find and favorite dashboards | moqui.report.Definition | framework Home, §4 | R,A | new | definition filters |
| Dashboard | Insights/Dashboard | report | xml | Read a dashboard with consistent filters | moqui.report.Definition | framework Dashboard, §4 | R,A | new | definition, version, range, variables |
| DashboardEditor | Insights/DashboardEditor | editor | xml | Compose panels and layouts | moqui.report.Definition | framework Definition, §4 | A | new | definition, expected version |
| Panels | Insights/Panels | list | xml | Find reusable number cards and charts | panel Definition | framework Panels, §4 | R,A | new | panel filters |
| PanelDetail | Insights/Panels/PanelDetail | editor | xml | Configure and inspect one library panel | panel Definition | framework Definition, §4 | A; R view | new | panel, metric, range |
| Drill | Insights/Drill | dialog | xml | Explain a selected value and reach source rows | authorized frame/query | own §4 | R | new | metric, bucket, original query scope |
| Explore | Insights/ReportBuilder/Explore | report | xml | Explore an admitted dataset | dataset and saved search Definition | framework Explore, §5 | A; R saved | new | dataset, query, range |
| Analysis | Insights/ReportBuilder/Analysis | editor | xml | Build aggregates, pivot and comparison | panel/search Definition | framework query/editor widgets, §5 | A | new | query, measures, dimensions |
| Datasets | Insights/ReportBuilder/Datasets | list | xml | Find approved business data sources | DataDocument, dataset Definition | own §5 | A,D | parity | dataset filters |
| DatasetDetail | Insights/ReportBuilder/DatasetDetail | settings | xml | Maintain a governed dataset | DataDocument, dataset Definition | own §5 | D | parity | dataset, scope policy, version |
| DatasetFields | Insights/ReportBuilder/DatasetFields | settings | xml | Define allowed fields and conditions | DataDocumentField/Condition | own §5 | D | parity | dataDocumentId, field selection |
| DatasetView | Insights/ReportBuilder/DatasetView | report | xml | Preview authorized detail rows | admitted dataset | own §5 | A,D | parity | dataset, filters, range |
| Reports | Insights/Reports | list | xml | Index every permitted application report | proposed ReportCatalogEntry | own §6 | R | parity | app, report, filters |
| SavedReports | Insights/SavedReports | list | xml | Find named analyses, saved finds and pins | Definition, FormListFind | own §6 | R,A | parity | type, owner, selected saved report |
| ScheduledReports | Insights/ScheduledReports | list | xml | Manage personal and approved group delivery | ScreenScheduled | own §7; framework services | R with schedule right; S | parity | schedule filters |
| ScheduledReportDetail | Insights/ScheduledReports/ScheduledReportDetail | detail | xml | Configure recipients, timing and output | ScreenScheduled | own §7 | owner/S | parity | schedule, definition, safe audience summary |
| ReportDelivery | Insights/ScheduledReports/ReportDelivery | detail | xml | Inspect an occurrence and retry failed recipients | proposed report occurrence/delivery | own §7 | owner/S; recipient own result | new | occurrence, own delivery or safe status |
| ManagementDigest | Insights/ManagementDigest | editor | xml | Compose a recurring management summary | report Definition | framework composition, §7 | A,S | new | definition, range, selected panels |
| Alerts | Insights/Alerts | list | xml | Find and manage scoped business alerts | alert Definition | framework Alerts, §8 | R; A/S edit | new | authorized rule filters |
| AlertDetail | Insights/Alerts/AlertDetail | detail | xml | Define a condition and inspect own state | alert Definition, AlertInstance | framework AlertRule, §8 | A/S; R own state | new | rule, own series, scope |
| FlowMaps | Insights/Flows/FlowMaps | list | xml | Select suite templates and organization copies | proposed BusinessFlowMap | own §9 | R,F | new | organization, map filters |
| FlowMap | Insights/FlowMap | report | qvue | Explain business flows with authorized links and counts | proposed BusinessFlowMap/version | own §9 | R | parity | map, organization, period, selected step |
| FlowMapEditor | Insights/Flows/FlowMapEditor | editor | xml | Edit lanes, steps and documentation links | proposed BusinessFlowMap/version | own §9 | F | new | map, expected version |
| ProcessStory | Insights/Flows/ProcessStory | editor | qvue | Read a step's existing process documentation | WikiPage | Commons Knowledge, §9 | page readers; separately authorized authors | parity | wikiPageId, map/step return context |
| OrderDetail | Insights/Records/OrderDetail | detail | xml | Inspect a permitted source order | OrderHeader | crosscut §3.6 | domain readers | parity | orderId, part, report return |
| Customer360 | Insights/Records/Customer360 | 360 | xml | Explain a customer measure | Party | crosscut §3.2 | domain readers | parity | partyId, period, report return |
| Supplier360 | Insights/Records/Supplier360 | 360 | xml | Explain supplier activity | Party | crosscut §3.3 | domain readers | parity | partyId, period, report return |
| Product360 | Insights/Records/Product360 | 360 | xml | Explain a product measure | Product | crosscut §3.5 | domain readers | parity | productId, organization, report return |
| RequestDetail | Insights/Records/RequestDetail | detail | xml | Inspect an authorized case/request source | Request | crosscut §3.11; Projects §6 | domain readers | parity | requestId, report return |
| WorkItemDetail | Insights/Records/WorkItemDetail | detail | xml | Inspect an authorized work source | WorkEffort | crosscut §3.12; Projects §5 | domain readers | parity | workEffortId, report return |
| ShipmentDetail | Insights/Records/ShipmentDetail | detail | xml | Explain a logistics measure | Shipment | crosscut §3.8 | domain readers | parity | shipmentId, report return |
| Employee360 | Insights/Records/Employee360 | 360 | xml | Inspect permitted employment context | Party, Employment | People §4; crosscut §3.4 | authorized People readers | parity | party/employment, report return |
| FacilityDetail | Insights/Records/FacilityDetail | detail | xml | Inspect a measured facility | Facility | crosscut §3.10 | domain readers | parity | facilityId, report return |
| EquipmentDetail | Insights/Records/EquipmentDetail | detail | xml | Inspect a measured asset | Asset | crosscut §3.10 | domain readers | parity | assetId, report return |
| InvoiceDetail | Insights/Records/InvoiceDetail | detail | xml | Explain a permitted invoice/bill value | Invoice | crosscut §3.16 | financial readers | parity | invoiceId, report return |
| Settings | Insights/Settings | settings | xml | Set organization analytics defaults | organization settings | own §11 | C; R safe defaults | new | organization, setting version |
| DataReadiness | Insights/Settings/DataReadiness | list | xml | Explain source readiness and failures | provider status/provenance | own §11 | A,D,C | new | source, organization, as-of |
| CashForecast | Insights/Reports/CashForecast | report | xml | Compare explicitly assumed cash scenarios | proposed domain forecast projection | own §12 | financial readers | later | organization, horizon, currency, scenario |

Chatter and RecordFiles remain hidden app-root mounts of the Commons shared definitions. Insights does not create generic comment/file access to report-result artifacts; those use the recipient ownership rules in §7. An organizational map may link existing Commons content without duplicating its attachment system.

## 3. Home and management attention

### Home

**Layout.** Landing: organization and period, favorites/recents, four to six selected library panels, attention groups and pinned reports. The user's saved arrangement changes references/order, not underlying source scope. Initial content is a small authorized suite dashboard, not every report in the catalog.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| HomeContext | find | Select management scope | organization, from, thru, fiscal period, currency grouping | authorized choices; shared time picker | proposed ContextServices.get#Context | app landing pattern; ERPNext Home workspace |
| FavoritesAndRecents | list, read | Resume work | title, app/folder, kind, last opened | links; star toggle | ReportServices.list#Definitions; proposed RegistryServices.get#Home | framework Home; research §1 |
| ManagementPanels | component | Show agreed measures | panel reference, scope, source/as-of, result state | report-embed; table alternative | ReportServices.render#Dashboard | framework widgets; research §2 |
| Attention | list, read | Show operational bottlenecks | source, label, eligible count, overdue count, as-of, target | grouped links; unavailable state | proposed RegistryServices.get#Attention | Dolibarr work board; domain Home providers |
| PinnedReports | list, read | Open useful reports | report title, owner app, description | catalog links | proposed RegistryServices.find#Reports | Carbon report pins |

**Actions.** Open a dashboard is primary; authors also have New dashboard. Attention rows open the exact domain filter that produced the count. A shared-screen action is reached through that domain flow, not executed from a generic number card. Pin/unpin is personal. The full new personal arrangement is `{organizationPartyId, dashboardDefinitionId, orderedPanelIds, pinnedReportIds, expectedRevision}`; IDs are chosen from authorized definitions/entries, and preferences never grant access.

**States/devices.** An inaccessible source is omitted without revealing a sensitive title/count. An admitted but unavailable source names the missing prerequisite. A provider failure affects its own card; others continue. Cards stack on phones and TUI presents the same ordered values and links. No summed cross-app “total work” is displayed: the same source may appear in more than one workflow.

**Source.** Research §§1–2,15; Commons Today; all domain Home designs. **Needs:** INS-01, INS-02, INS-09, INS-10.

## 4. Dashboards and panels

### 4.1 One framework model

A library panel is the reusable widget. It may appear on an app landing, an Insights dashboard, a record page and a digest without a copied query. A dashboard's by-value panels remain useful for private composition; publishing a reusable business KPI creates a library-panel reference. Metric ownership stays with the source application (§6).

Existing `number-card`/`m-chart` screens remain valid operational UI. They adopt registered measures as those sources become available; this design does not require rewriting every landing before Insights can ship. The shared widget contract in crosscut §3.17 points here and to the framework reporting guide.

### Dashboards

**Context passed.** Reuse Tools `Dashboards/Home.xml` with definitionType fixed to dashboard, an admitted-business definition filter, appRoot=Insights and canonical same-app links. Include its dashboard/star/edit/new/explore transitions so a shared link does not accidentally post elsewhere. Authorization is enforced by ReportServices, not the business filter. Existing REPORT_RECENT and favorite preference behavior is reused; catalog pins are a different preference over report routes.

**Actions/states.** R opens/favorites; A creates or copies. An unavailable definition is not named in a list. Framework paging/filter controls retain folder, tag and starred-only behavior. **Source:** research §§1,8; current framework Home and BOSS Dashboards. **Needs:** INS-01, INS-04.

### Dashboard

**Context passed.** Reuse Tools `Dashboards/Dashboard.xml` with definitionId, validated variable values, absolute/relative range, permitted filter pills, appRoot and sharedLinks. The mount adds organization scope from the context service and a business provenance/meaning drawer; user variables cannot replace scope predicates. Data links resolve registered routes and carry the selected bucket and range. Definition sharing never supplies execution authority.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessContext | find | Select permissible common scope | organization, reporting range, currency mode | registered scope choices | proposed ContextServices.get#Context | Accounting report options; framework variables |
| MeasureMeaning | display | Explain a selected panel | metric/version, grain, basis, denominator, exclusions, source/as-of | inspector tab; source links | proposed RegistryServices.get#Metric; report metadata | Marketing and Maintenance metric explanations |
| ShareDashboard | dialog | Share definition access | definitionId, private or authorized group, expected version | group search; copy authenticated link | ReportServices.save#Definition | framework definition userGroupId; research §10 |

**Actions.** Refresh is primary for readers, Edit for authorized owners. More offers Copy, Versions, Share, authorized Export, Schedule and New alert. A copied link freezes the time range but carries no access token. Share/restore confirms the named definition and impact; the engine's optimistic version check refuses stale writes. Inspect cannot expose restricted fields, server predicates, credentials or another user's query plan.

**States/devices.** A panel reports unavailable/stale/incomplete/failure explicitly and retains its last-good timestamp where allowed. Missing data is never a zero or a healthy alert state. Phone and TUI read the same panels in layout order. **Source:** research §§2,10,12; framework Dashboard. **Needs:** INS-01, INS-03, INS-04, INS-09.

### DashboardEditor

**Context passed.** Reuse Tools Definition's dashboard editor, fixing type=dashboard and business-admitted dataset/panel choices. The existing framework model supplies layout tree, panel placement, variables, query/transformations, copies, versions, dependency uses, import/export and restore. BOSS provides labels and scoped route choices; it adds no competing layout format.

**Actions.** Save version is primary; Save as copy for shipped definitions. Add panel selects an admitted library panel or opens the same framework panel editor. Common filters declare which panel field they bind; an incompatible panel visibly remains unfiltered and cannot be presented as included in a filtered total. Per-panel overrides are visible. A referenced library change shows affected dashboards/digests/alerts before publication. Deletion is refused while referenced. Advanced JSON remains an authoring representation, with the same server validation as the visual editor; it cannot insert an arbitrary service name, dataset row-filter override or unsafe route.

**Devices/source.** Framework editor and TUI twin; phone users can read and make simple ordered edits. Research §3; current Definition. **Needs:** INS-03, INS-04, INS-09.

### Panels

**Context passed.** Reuse framework Panels, definitionType=panel, business admission, authorized metric catalog and same-app PanelDetail/Drill links. List title, metric/source, visualization and authorized “used in” references; no titles of inaccessible consumers. **Actions:** New panel for A; copy shipped panel; open existing. **Source:** research §§2–4; framework Panels. **Needs:** INS-02, INS-04.

### PanelDetail

**Context passed.** Reuse the framework Definition editor with type=panel. Fix the allowed source list, field projection and service-source registration. The existing query editor supplies dimension/measure, grain, filters, server transformations, visualization, units, thresholds and data links; preview invokes the same execution path as the published panel. Number-card target/gap is added as a typed business option over a registered target measure or an explicitly entered target in the same unit, not another KPI store.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessMeasure | single | Attach meaning to a reusable panel | metricId/version, source reference, organization/range bindings | registered metric picker; read-only basis | proposed RegistryServices.get#Metric; ReportServices.save#Definition | domain report definitions; framework panel editor |
| Target | dialog | Configure target comparison | target metric or constant, unit, period, better direction | compatible target choice; preview | ReportServices.run#Query; proposed semantic validation | Frappe number reading target/gap |
| Dependencies | list, read | Review reuse before change | consuming definition, kind, version, access | framework used-in list | ReportServices.find#DefinitionUses | framework DefinitionReference |

New target input is exactly `{panelId, targetKind, targetMetricId, targetValue, targetUnitId, periodBinding, betterDirection, expectedVersion}`; targetKind selects a metric or constant and only the corresponding value is accepted. Missing target or zero comparison denominator produces unavailable comparison, not infinity. Cost/HR targets retain their source access. **Source:** research §§2,4; framework Definition. **Needs:** INS-02, INS-03, INS-04.

### Drill

**Layout.** XML dialog with Meaning, Breakdown and Source rows sections; selection breadcrumbs preserve the original report's scope and time. The framework's click-to-filter and document-query machinery supplies the data; this is the shared business drill presentation.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DrillMeaning | display | Explain the clicked value | metric/version, group, basis, denominator, unit, as-of | inline source/exclusion text | proposed RegistryServices.get#Metric | research §2; domain explanations |
| Breakdown | find | Add one permitted dimension | dimension, selected bucket, original scope | approved dimension lookup; breadcrumbs | ReportServices.run#Query | framework filter pills; Frappe breakdown |
| SourceRows | list, read | Inspect contributing records | source key/name, relevant date/state/value, unit, contribution | paged table; canonical record links | ReportServices.query#Documents or registered domain drill service | Frappe drill rows; crosscut shared records |

The new drill request is `{definitionId, panelId, metricId, metricVersion, queryReference, range, variables, selectedBuckets, breakdownDimension, pageIndex, pageSize}`. The server resolves queryReference to the authorized saved/request query, reapplies fixed source scope, validates dimension and bucket predicates and returns display rows, page metadata and provenance. It never trusts a client-supplied entity/service name. Aggregation access may permit a summary while individual records remain restricted; those records are not fetched then hidden. “Other”/missing buckets retain their exact original predicates, and truncated samples are labelled rather than mistaken for all source rows.

**Actions/navigation.** Open source uses §10. Open as analysis is available to A and copies query meaning, not a privileged result. Export uses the same authorized source projection. **States/devices.** No source access returns a useful authorized explanation without identifying hidden records. The same dialog is a linear task in TUI and a full-width page on a phone. **Source:** research §§2,15; framework Explore and source queries. **Needs:** INS-02, INS-03, INS-04, INS-09.

## 5. Exploration and report builder

### Explore

**Context passed.** Reuse framework Explore with an admitted dataset, safe query/filter pills, range, appRoot and business record links. Split comparison is its included region, not a duplicate query engine. An ordinary author cannot choose telemetry/index-wide/private payroll datasets by supplying an ID directly. Dataset choices, field suggestions, value counts and lookups are scoped before being returned.

**Actions.** Run/refresh, Save search, Open analysis and Add to dashboard use existing ReportServices query/definition operations. Saved searches preserve query meaning and display options, not computed results. CSV/XLSX require the source's export grant. Framework row/bucket/time limits remain visible, and a bounded result never claims a complete population count. **Source:** research §§5–6,8; framework Explore/Split. **Needs:** INS-02, INS-03, INS-04.

### Analysis

**Context passed.** Use the same framework query/definition editor and panel renderer as PanelDetail: dataset or registered report service, aggregate roles, grain, group-by, transformation pipeline, pivot/totals, visualization and time comparison. The saved result is an ordinary search or panel Definition; no new workbook/query language is added.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AnalysisSource | single | Select a governed starting point | dataset or catalog source, metric, range, organization | source/measure picker | proposed RegistryServices.find#Reports/get#Metric; ReportServices.get#Dataset | research §5; framework datasets |
| AnalysisSteps | component | Build the calculation | permitted fields, aggregates, grain, transformations | framework definition editor | ReportServices.run#Query | framework aggregation/transform pipeline |
| AnalysisResult | component | Inspect result and provenance | frames, totals, unit, notices, as-of | report panel with accessible table | same query result | framework panel and inspector |
| SaveAnalysis | dialog | Save or place the definition | title, private/group, kind, dashboard target | authorized definition choices | ReportServices.save#Definition | research §8; framework Add to dashboard |

An analysis over monetary fields must carry currency grouping or a registered conversion measure. The server refuses semantically invalid operations rather than merely removing the currency symbol. A ratio aggregates its numerator/denominator according to its registered rule; it is not an average of row percentages. Distinct counts, balances and snapshot measures declare nonadditive dimensions. Calculated fields use the bounded framework expression/transform vocabulary; no raw SQL, JavaScript or arbitrary service invocation is exposed.

Generic `form-list` pivot/graph adapters remain later; eligible existing reports/lists may offer Add to dashboard through a registered source adapter. A list's currently loaded page is never treated as its entire dataset. **Source:** research §§5–6; Sales/Purchasing analytics decisions. **Needs:** INS-02, INS-03, INS-04, INS-12.

### Datasets

**Layout.** XML list with admitted, needs review and unavailable views. Show business name, owner domain, grain, source type, available scope, freshness and permitted uses; stewardship details appear only to D.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DatasetFind | find | Find an admitted source | domain, name, source type, readiness | server filters | ReportServices.list#Datasets plus proposed admission projection | SimpleReport FindReport; framework Datasets |
| DatasetList | list, read | Explain source suitability | name, grain, scope, source/as-of, status | detail and preview links | same | SimpleReport DataDocumentList |
| CreateDataset | dialog | Start a stewarded source | name, registered primary entity/source, organization policy, permitted group | allowed-source lookup | proposed ReportServices.create#BusinessDataset, using existing org.moqui.impl.EntityServices.create#DataDocument when applicable | SimpleReport CreateDataDocument |

New creation input is `{documentName, sourceKind, registeredSourceId, primaryEntityName, timeField, userGroupId, scopePolicyId, organizationPartyId}`. SourceKind selects a permitted DataDocument/entity projection or registered service source; names/policies come from steward-authorized choices. Creation yields an unadmitted source until scope, grain, projection and validation are complete. Service-source datasets use the existing framework definition format and an allowlisted adapter, not a DataDocument with a fake entity. **Source:** research §§5,11,16. **Needs:** INS-03, INS-09.

### DatasetDetail

**Layout.** Settings/detail: Identity, Fields/conditions, Scope and permitted uses, Readiness, Used in. Technical metadata is appropriate here because the steward is making a data-governance decision; it is not shown as a normal manager's report form.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EditDataDocument | single | Maintain the source description | name, primary entity, time field, group, grain | registered source choice | proposed ReportServices.store#BusinessDataset; existing org.moqui.impl.EntityServices.update#DataDocument within guarded mutation | SimpleReport EditDataDocument |
| DatasetScope | single | Bind business authorization | scopePolicyId, permitted fields/uses, classification, steward | approved policy selector; no editable security expression | proposed ReportServices.store#BusinessDataset | framework dataset row filters; research §12 |
| DatasetValidation | list, read | Review admission checks | check, outcome, source, explanation | authorized drill; no private fixture values | proposed ReportServices.validate#BusinessDataset | framework inspector; Frappe workbook verification |
| DatasetUses | list, read | Assess a change | dashboard/panel/report/alert, version | framework dependency links | ReportServices.find#DefinitionUses | framework definitions |

New scope input is `{datasetId, scopePolicyId, permittedFieldIds, permittedUseIds, classificationEnumId, stewardUserId, expectedVersion}`. Policies are deployed, reviewed code/configuration supplied by the domain, not scripts typed by a business user. Changing entity, grain, time basis or field meaning is a new dataset/metric version; dependent definitions must be validated before publication. A primary entity change cannot reinterpret saved field paths in place. Copy uses existing `org.moqui.impl.EntityServices.clone#DataDocument` only inside the guarded dataset workflow and preserves no admission assertion by implication.

**Actions.** Validate then Admit is primary for D; Revise/Retire confirm the dataset and affected consumers. Retirement stops new authoring, preserves historical explanation and shows dependency blockers. Raw reindex/delete-index operations link to authorized Admin/Tools. **Source:** research §§11–12,16; SimpleReport EditReport. **Needs:** INS-03, INS-09, INS-11.

### DatasetFields

**Layout.** XML tree of allowed relationships beside editable field and condition lists. Only fields in the approved source projection can be selected; unrestricted entity browsing remains Tools.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FieldList | list, editable rows | Define result fields | fieldPath, alias, function, sequence, display/unit metadata | approved field tree; unique alias validation | proposed ReportServices.store#BusinessDatasetFields using existing org.moqui.impl.EntityServices.create#DataDocumentField/update#DataDocumentField | SimpleReport FieldList |
| AddCondition | dialog | Add a source condition | field alias, operator, value, ignore case | typed value input | same guarded mutation | SimpleReport AddCondition |
| ConditionList | list, editable rows | Revise or remove source conditions | condition key, field, operator, value | row actions | same guarded mutation | SimpleReport ConditionList |

Conditions narrow a source; they cannot replace security scope. Aggregate functions, field paths and relationship cardinalities are checked against the declared grain. Removing a field required by an admitted metric is blocked until its consumers are revised. Deletes use entity services only after the same admission/ownership checks as add/update; no unguarded generic entity transition remains. **Source:** research §16; current copied FieldList. **Needs:** INS-03, INS-11.

### DatasetView

**Layout.** Report with source/meaning, find form, permitted dynamic columns and bounded detail results. It replaces the legacy dynamic entity view as a business preview; a DataDocument group check alone is insufficient for row/field scope.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DatasetOptions | find | Select authorized rows | dataset, range, registered source filters | typed field filters; saved find | ReportServices.get#Dataset | SimpleReport ViewReport |
| DataViewList | list, read | Inspect source records | approved projected fields, source ID/link | dynamic columns; paging; accessible table | ReportServices.query#Documents or registered service projection | SimpleReport DataViewList |
| ExportDocuments | dialog | Export the same authorized projection | format, range, pretty JSON, row limit | format choices; scope/limit explanation | ReportServices.query#Documents and existing ReportServices.audit#Export through proposed scoped export adapter | SimpleReport ExportDocuments |

New export input is `{datasetId, savedQueryId, from, thru, filters, format, prettyPrint, requestedRowLimit}`. Server policy caps rows and applies identical source scope; a raw DataDocument export URL cannot bypass it. JSON is retained for admitted data projections; low-level entity/data export stays in separately privileged Tools, linked by Admin, while Admin's business export uses registered domain projections. **Source:** research §§5,16; SimpleReport ViewReport. **Needs:** INS-03, INS-09, INS-11.

## 6. Report catalog and domain metrics

### 6.1 Ownership and registration contract

The catalog is a route/definition index, not another business data model. Proposed `ironstone.insights.ReportCatalogEntry` stores stable entryId, owner app, title/description, canonical route or definitionId, parameter contract, source/metric references, required view/export/schedule capabilities and readiness. Component setup contributes entries; an app-only report points to its owning route. Proposed `ReportPin` stores a user's entry reference and order. These BOSS records hold navigation/personalization only; no Mantle service depends on them.

Business metric metadata extends admitted dataset/panel definitions with a versioned `business` descriptor; a registered domain report service returns the same metadata with its frames. It supplies metricId/version, owner, description, source reference, record grain/key, date/status basis, numerator/denominator or aggregation rule, additive dimensions, unit/currency policy, allowed dimensions, supported filters, drill contract, permission/scope policy and freshness contract. The actual formulas and authorization remain in the domain service/dataset, not in a second Insights formula store.

Proposed `ironstone.insights.RegistryServices` validates and reads these registrations, resolves links, pins and safe status. It does not wrap each Mantle service to rename it. Framework service-source registration binds an explicit service and parameter/output contract; ordinary authors choose the registration, never a service name. Returned frame metadata carries effective organization/filter/range, metric and definition versions, source watermark, completeness, source counts where permitted and warnings.

A saved query and its drill/export/alert must share this contract. Unit conversion, privacy and business rules are not inferred from column names. Unknown metadata blocks admission for a published business KPI; a private exploratory result is visibly an analysis, not a certified domain measure. Schema validation and a successful query are necessary but do not prove semantic correctness.

### Reports

**Layout.** List/index grouped by app and business purpose, with pinned reports first. Report pages keep their canonical owner; Insights passes validated context and return navigation rather than reproducing forms.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportFind | find | Find a permitted report | app, purpose, text, pinned, readiness | filters; domain choices | proposed RegistryServices.find#Reports | Carbon reports hub; ERPNext catalogs |
| ReportCatalog | list, read | Explain and open a report | title, owner, basis, source, available formats | canonical links; pin | same | research §7; existing application report indexes |
| ReportContext | dialog | Supply required shared parameters | organization, range/period, currency, source-specific options | registered typed fields | registered owner options service; no report execution on catalog read | Accounting report quick options |

**Actions.** Open is primary. Pin/unpin input is `{entryId, pinned, sequenceNum, expectedRevision}`; ownership is the authenticated user. Schedule appears only when an admitted schedule adapter exists; a raw arbitrary screen path is never enough. Reports not implemented remain described in the owning design and are omitted from the usable catalog; an unavailable configured source reports its missing prerequisite without pretending there are no records. **Source:** research §§7–8,15. **Needs:** INS-02, INS-05, INS-09.

### SavedReports

**Layout.** XML list with separate types: named analyses/searches, saved finds, dashboards and pinned catalog entries. They share an index, not one misleading storage identity.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SavedFind | find | Select personal/shared work | kind, title, owner/group, source app | typed filters | proposed RegistryServices.find#SavedReports | research §8 |
| SavedReportList | list, read | Resume a saved definition or find | title, kind, source, sharing, changed date | resolved route; unavailable state | ReportServices.list#Definitions; authorized FormListFind projection | SimpleReport QuickViewReport; framework saved finds |
| SaveAs | dialog | Copy authorized query configuration | source ID, title, private/group, expected version | safe target choices | ReportServices.copy#Definition or existing form-list saved-find behavior | framework Definition; Frappe Save As |

Deleting a personal pin removes no report. Deleting a find checks schedules that reference it. Deleting a definition uses ReportServices.delete#Definition and its dependency guard. A copied search retains no cached result or broadened grant; source authorization is checked when opened. **Source:** research §§8,16. **Needs:** INS-01, INS-05, INS-11.

### 6.2 Domain contribution register

Each row names the canonical owner. Registration is the additional Insights integration; it does not promote a proposed domain capability to implemented. Existing forms remain in their owner's design and inventories. Sources listed here feed business panels/Analysis through registered service adapters only after their domain access and semantic checks pass.

| Owner | Initial contribution and authoritative meaning | Boundary and reuse |
| --- | --- | --- |
| Sales | Placed/approved order value, invoiced sales, pipeline/forecast by declared stage and date; existing `mantle.sales.SalesReportServices.run#SalesAnalysis`, get#SalesOrderSummary, get#SalesInvoiceSummary, get#SalesTopProduct and get#InvoicesByCustomerClass as appropriate to their verified contract | Ordered, invoiced and collected are separate measures. Sales owns forecast cohorts/targets; old summaries must gain any missing source scope before admission. |
| Marketing | CampaignPerformance, DeliveryAnalysis, AudienceGrowth, Attribution and their proposed Marketing report projections | Preserve accepted versus confirmed delivered, consent/tracking coverage, unique-recipient denominators, late receipts, recorded primary attribution and separate influence. Parent campaigns deduplicate descendant sources. |
| Customer Service | Case backlog/age, response/resolution/SLA and satisfaction from its report services | Eligible case cohorts and business-calendar basis belong to Customer Service; Requests without a case extension are not silently support cases. |
| Commerce | Store/channel order/cart/conversion and publishing/channel readiness from its design | Public visits, carts, accepted orders, completed payments and refunds are distinct. PASS contributes permitted events through shared sources, never through a BOSS dependency on a public session. |
| Products | Catalog completeness, lifecycle, price-list coverage and allowed cost/price projections | Restricted supplier prices and costs stay out of ordinary product datasets; variant parents and SKUs have distinct grain. |
| Purchasing | Replenishment, supplier delivery/quality and purchasing history | PO commitment, receipt, accepted quantity and billed quantity are stages linked by source identity; no sum treating them as separate purchases. |
| Warehouse | On-hand/availability, stock-at-date, movements, counts, receiving and shipping | Physical quantity and Accounting valuation are separate. Snapshot balances are not summed across dates; lot/serial/facility scope applies to every result. |
| Manufacturing | Production plan/run state, yield, material/time/variance and OperationPerformanceReport including OEE, with the release scope decided by Manufacturing | Production run, operation, output and material movement have declared grain. Manufacturing owns OEE exposure and production denominator; maintenance intervals are an input. An unavailable source waits for admission without changing the domain report's release classification. |
| Maintenance | WorkStatus, PreventiveCompliance, cost and later reliability projections | Count execution roots, exclude templates/steps, preserve due-obligation exclusions and unknown evidence; union overlapping outage intervals per resource. |
| Accounting | Statements, aging, ledger, trial balance, budget variance and valuation via domain services: `mantle.ledger.LedgerReportServices.run#IncomeStatement`, run#BalanceSheet, run#CashFlowStatement, run#RetainedEarningsStatement, run#FinancialRatios, run#PostedAmountSummary, get#PeriodSeriesSummary; `mantle.ledger.FinanceReportServices.run#TrialBalance`, run#GeneralLedger; `mantle.other.BudgetReportServices.run#BudgetVariance` | Posted financial facts and period-close policy stay Accounting-owned. Prefer these authorized service-source frames to eventually consistent search data for authoritative statements. Cash forecasting is the separate later Insights capability (§12). |
| People | Proposed PeopleReportServices: headcount/turnover, recruiting, attendance/leave, payroll, expenses, qualifications, review completion | Person versus employment grain and headcount as-of are explicit. Payroll/private review datasets need distinct grants and projections; management access alone exposes neither. |
| Projects | Existing `mantle.work.ProjectReportServices.get#TimeReport`, get#WorkItemSummary, get#PortfolioStatus, get#ProjectProfitability, get#Utilization, get#ProgressBreakdown, get#SprintBurndown and get#SprintVelocity | Projects owns utilization/capacity, billable value, costing, sprint commitment and subtree rules. Cross-project dashboards belong here; no second capacity or billing calculation. |
| Commons/Comms | Authorized workload and delivery readiness summaries | Personal Today, mailbox unread and approval counts remain their owners' services. No cross-user message-body dataset or sum of duplicated task sources. |
| Admin/Monitor | Safe integration/data-refresh/recipient-delivery readiness references | Infrastructure diagnosis, logs, secrets, jobs and recovery stay Admin/Tools. Management sees a source readiness state and authorized link, not telemetry or credentials by implication. |

### 6.3 Rules for cross-app comparison

- Use canonical source identity and explicit grain. Order header/parts/items, invoice items/applications and source allocations cannot be naively joined into multiplied totals. A composite key stays composite in source metadata and drill links.
- A target is comparable only with the same basis, unit and cohort. Rates expose numerator/denominator and missing coverage; averages and percentages are recomputed from their defined components, not summed.
- Keep native currencies separate. An optional converted measure names reporting currency, rate source, effective date, rounding and missing-rate behavior supplied by the owning domain. No default USD or fixed decimal precision is introduced.
- Fiscal ranges come from the chosen organization's fiscal calendar. Resolve to explicit bounds before invoking the framework engine; its instance-wide fiscal-start configuration does not define every legal organization's year. Cross-organization comparison names the common calendar basis.
- Historical “as of” requires an actual historical source. A current snapshot queried with an old date filter is not historical state. Partial periods, late facts, corrections and source watermarks remain visible across all output modes.
- Aggregate privacy is a domain rule, not an Insights workaround. Protected fields are absent from source answers. A People dataset may expose only approved aggregates; repeated filtering/drill cannot reconstruct denied personal values.
- Source services return display labels and date/amount text as appropriate; client JSON does not manufacture date types or business names. All calculations use decimal semantics and domain rounding.

**Source.** Domain report sections, particularly Marketing §11, People §12, Projects §11, Maintenance §8 and Accounting §13. **Needs:** INS-02, INS-03, INS-09.

## 7. Scheduled reports and management digests

### 7.1 Recipient execution contract

The user-facing promise is precise: **each internal recipient receives the report they are authorized to see**. The schedule owner administers the composition and timing; the owner is not the data principal for recipients. This applies to inline images, titles containing values, attachments, previews, links and later stored downloads alike.

Extend the framework schedule model with explicit execution mode `recipient` for BOSS-created business schedules. Existing technical Tools owner-mode schedules remain owner-mode; opening one from an administrative index does not convert it. Insights permits no owner-mode business distribution. Converting a legacy schedule is a reviewed operation with visible recipients and source compatibility; incompatible old finds remain personal until admitted.

Only the trusted scheduler selects the execution principal from that validated occurrence's active internal recipient set. Public query, preview, screen and export requests cannot supply `runAs`, an arbitrary execution user ID or a forged delivery ID to obtain another principal's result. The recipient worker is an internal non-remote service; its caller is not accepted as authorization evidence without the persisted occurrence/recipient claim.

At creation/change, validate the owner's schedule/distribution authority, definition and referenced-source access, permitted internal audience and template/profile. At run time:

1. Claim a single occurrence through the existing ScreenScheduled/ScreenScheduledLock machinery. Pin the schedule revision, definition/dependency versions, intended organization scope and an absolute reporting period. Expand effective internal group membership into user IDs and deduplicate IDs; selecting a user and a group containing them creates one delivery.
2. Check the owner is active and still authorized to administer/distribute this definition. Resolve each recipient's current active account, effective membership, approved organization relationship and address. Newly added group members start at the next occurrence; removed members cannot receive a pending/retried occurrence.
3. For each recipient, enter a fresh authenticated context and authorize the definition, each dependency, dataset/service source, row/field scope and output action. Fixed report filters narrow this view; they never add authority. A selected recipient who lacks definition/source access is skipped with a safe reason; selection itself creates no sharing grant.
4. Render under that recipient with their locale/time display preferences and the occurrence's fixed reporting boundaries. No shared owner frame or attachment cache is reused. Cache/staging identity includes recipient, effective scope, source watermark and definition version.
5. Immediately before an external effect, recheck the lease, schedule revision/state, owner authority, recipient eligibility/address and their current authorization. If authorization/scope changed since rendering, discard the staged output and rerender; if it is now denied, skip. A fresh identity plus a framework scope revision/fingerprint or equivalent full authorization revalidation is required; a stale session capability map is insufficient.
6. Deliver one separately addressed message per recipient through the existing email/template transport. Never place differently authorized recipients on one To/CC/BCC message. Persist the result and continue other independent recipients when one fails. Owner loss, schedule cancellation or an invalid shared definition blocks remaining delivery for the occurrence.

Proposed framework `moqui.report.ReportOccurrence` and `ReportRecipientDelivery` records track occurrence key/time, pinned versions/period, schedule owner/revision, recipient/channel, state, safe reason, attempt identity, message ID, provenance and private artifact reference. Their uniqueness is occurrence plus recipient plus channel. Use status/enumeration data for pending, rendering, ready, sent, skipped, failed and uncertain. Existing schedule leases remain the outer claim; per-recipient claims/outbox identity prevent competing workers sending the same child.

Retry only failed recipients; never replay sent recipients. Recheck current eligibility and authority and keep the same reporting period and definition versions. If the source cannot reproduce its old watermark, rerender with a new disclosed watermark; do not claim an identical historical snapshot. An ambiguous transport outcome is uncertain and requires reconciliation before resend; SMTP does not provide an exactly-once promise. Safe reason codes distinguish no address, removed audience, denied source, empty, source failure, paused, transport failure and uncertain delivery.

An empty result is assessed per recipient. A recipient with no readable panels is skipped, not sent a blank report that reveals denied titles. A configured composition may deliver independent permitted panels when another source fails, but marks the output incomplete; sections requiring complete reconciliation block that recipient's composition. Partial/unknown data cannot satisfy “only send when data” by masquerading as a valid zero.

### 7.2 Artifact, privacy and lifecycle boundaries

Private report artifacts are readable only by their recipient while current authorization still permits the stored content. Downloads require authentication and recheck definition/source scope; a changed scope invalidates the stored artifact and offers a newly rendered result instead of releasing old broader content. No bearer/public URL or generic shared save-to location is offered by Insights. Recipient access is not inherited from a shared Commons folder. Expiration and retention use Admin policy; immutable delivery evidence can outlive content without retaining its values.

An owner/distributor sees recipient identity where allowed, status, time and safe reason codes, not another recipient's frames, attachments or private query diagnostics. Preview is the caller's own authorized view. A “check recipients” action reports eligibility, never impersonates them to show content. Admin may pause/transfer administration under its audited lifecycle contract but does not gain recipient data access. A transfer checks the new owner and leaves the schedule paused until validated; it does not rerun already delivered occurrences.

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
| ReportAudience | single | Select permitted internal recipients | users/groups, organization scope, sending profile/template | authorized lookups; audience count | proposed ReportServices.store#Schedule/check#ReportAudience | framework userId/userGroupId; research §9 |
| OwnPreview | component | Preview the caller's result | own frames/output, period, completeness | framework PDF/table preview | ReportServices.preview#Report | framework Reports |
| ScheduleRuns | list, read | Follow occurrences | time, period, sent/skipped/failed/uncertain totals | ReportDelivery links | proposed ReportServices.find#ReportOccurrences | framework job result pattern |

The new/edit schedule input is `{screenScheduledId?, definitionId or registeredReportId plus formListFindId, organizationPartyIds, variables, filters, cronExpression, timeZone, fromDate, thruDate, renderMode, noResultsAbort, recipientUserIds, recipientGroupIds, emailTemplateId, sendingProfileId, emailSubject, expectedRevision}`. ExecutionMode is server-fixed to recipient. Definition and registered legacy source are mutually exclusive. Templates/profiles come from Comms-approved business choices; relay credentials stay Admin-owned. Explicit timeZone determines cron and DST behavior: execute once per intended local occurrence, skip nonexistent local instants to the next valid instant and do not duplicate a repeated local time. The persisted absolute occurrence key makes retry independent of a clock change.

**Actions.** Save is primary; activate/resume only after eligibility checks. Pause, Send now, change audience and transfer administration confirm consequences. Changing a running schedule cancels not-yet-delivered children of the old revision; already sent evidence remains. **Source:** research §9; baseline and framework schedule controls. **Needs:** INS-06, INS-11.

### ReportDelivery

**Layout.** Detail with occurrence period/version, source readiness, own result where eligible and safe recipient outcomes. A recipient who is not an administrator sees only their own delivery.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Occurrence | display | Explain what ran | schedule/revision, period, definition versions, completion state | provenance and safe counters | proposed ReportServices.get#ReportOccurrence | framework schedule audit; domain batch outcomes |
| RecipientOutcomes | list, read | Explain independent results | eligible recipient, state, safe reason, attempt time | scoped row retry; no payload preview | same safe projection | Admin import/job outcome pattern |
| OwnArtifact | display | Access one's output | format, generated time, source watermark, expires | authenticated download; rerender notice | proposed ReportServices.get#RecipientReport | framework preview/export |
| RetryRecipients | list, bulk | Retry known failed deliveries | selected failed child IDs, reason | confirmed count | proposed ReportServices.retry#ReportRecipients | independent-row retry pattern |

Retry input is `{occurrenceId, deliveryIds, expectedRevision, reason}`; recipients and content cannot be replaced in a retry request. Uncertain rows offer reconciliation and an explicitly authorized new attempt, not a blind Retry button. **Source:** research §9; current scheduler's lease/failure behavior. **Needs:** INS-06, INS-09, INS-11.

### ManagementDigest

**Context passed.** Reuse framework report composition editor with a report Definition. The digest selects registered library panels or dashboards, their order, range/variable bindings and brief explanatory text. The schedule is the same ScheduledReportDetail in recipient mode; it has no separate timer, metric snapshot or mailer.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DigestComposition | component | Choose a management summary | title, panel/dashboard references, sequence, period bindings, commentary | framework composition editor | ReportServices.save#Definition | Odoo digest; framework composition |
| DigestPreview | component | Review own result before scheduling | values, changes, meaning, as-of, missing sections | same rendered report/table | ReportServices.preview#Report | framework reports |

Period comparison and commentary distinguish facts from authored explanation; an Assist draft is reviewed under the same author permission. A digest does not add per-recipient values into a shared summary, since recipient scopes may overlap. Preferences and unsubscribe/pause use the common delivery policy. **Source:** research §§9,15. **Needs:** INS-02, INS-06, INS-09.

## 8. Business alerts

### 8.1 Query, state and confidentiality

An alert references the same versioned metric/query used by its panel. For value-bearing business alerts, the framework evaluates the query and condition independently as each eligible internal recipient, with the same scope/field and lifecycle checks as scheduled delivery. State, pending/recovery durations, series identity, deduplication, silences and output are keyed by recipient as well as rule/series. A narrow recipient can satisfy a condition when the owner's wider aggregate does not; therefore an owner-fired event is not the trigger for recipient evaluation.

Extend the current framework alert model with explicit business recipient mode and recipient identity on its state/notification keys; preserve technical owner mode for Monitor/Tools. Shared contact points, mute timings and silences remain framework definitions. A business author can silence their own recipient state; organizational suppression needs authorized rule administration and is audited. It does not erase state or change another person's data authority.

No Data, Error, insufficient coverage, incomplete source and stale source are distinct from Normal. Only a valid scoped reading moves a rule through its configured condition/recovery logic. A missing series follows the declared pruning/resolution rule with a neutral explanation, not a fabricated recovered value. Repeated notification follows framework grouping/repeat timing and per-recipient idempotency; one failed contact does not stop other recipients.

Notifications and email contain only that recipient's permitted metric label, value, unit, range and authenticated link. A recipient who cannot evaluate receives no value-bearing alert. Default BOSS channels are private in-app notification and approved account email; general external addresses, Telegram and business webhooks are deferred. Operational Admin/Monitor alerts may remain owner-evaluated, but notifications to other users disclose only authorized redacted incident state/link; broader values, dimensions and diagnostics require their own permission. The existing technical webhook capability remains Admin/Tools, not an Insights grant.

The current private `ReportAlert` topic is in Updates. Register a separate private actionable business-alert topic where intervention is expected, with canonical definition/own-instance IDs and minimal payload; informational recoveries/digests follow Commons topic policy. Topic subscription is never metric access. Alert values are not copied into general Chatter, group chat, public spaces or header counters. **Needs:** INS-03, INS-07, INS-10.

### Alerts

**Context passed.** Reuse framework Alerts with business-recipient rule filter, own recipient-state projection, permitted rules/contacts and same-app links. Rule administrators can see safe counts of evaluations/delivery failures, not recipients' private series/value lists.

**Actions.** New from panel preselects its registered query; A/S may save a rule template, and a distribution-qualified owner activates its eligible audience. Copying a shipped rule is inactive until validated. Pause/resume, silence and deletion confirm the rule and intended scope. **Source:** research §9; framework Alerts and AlertShared. **Needs:** INS-01, INS-07.

### AlertDetail

**Context passed.** Reuse framework AlertRule query, reduce, threshold, pending period, recovery threshold, No Data/Error policy, shared contact/silence/mute references and history. The BOSS mount fixes execution to recipient mode and removes arbitrary-address/contact creation. Owners see their own values and safe audience readiness; authorization is checked again in the evaluator and delivery path.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BusinessAlertBasis | single | Select the authoritative reading | panel/metric version, scope, range, reduction, threshold/unit | registered metric picker | ReportServices.save#Definition; proposed business-rule validation | framework AlertRule; research §9 |
| AlertAudience | single | Select internal delivery | users/groups, profile, permitted channel | authorized lookups; eligibility | extended ReportServices.save#Definition | §7 recipient audience contract |
| OwnAlertState | list, read | Explain one's evaluated condition | permitted series, value, state, first/last time, coverage | history/annotations; scoped drill | extended ReportServices.evaluate#Alerts and state read | framework AlertInstance |
| AlertDeliveryStatus | list, read | Follow failures without sharing values | recipient or own delivery, state, safe reason | retry/reconcile links | proposed recipient outcome projection | framework AlertNotification |

New audience fields are `{recipientUserIds, recipientGroupIds, channels, emailTemplateId, sendingProfileId, expectedVersion}`; no raw recipient address or credential is accepted. Conditions use the framework bounded vocabulary and compatible units. “Test” evaluates only the caller's scope and never sends; “Send test to me” is a separately confirmed own delivery. Alert history is not publicly readable annotation data: classification and recipient scope carry into history/export. **Source:** research §§9,12; built framework alert states and contacts. **Needs:** INS-03, INS-07, INS-09.

## 9. Business flow maps

### 9.1 Suite templates and organization copies

The map is clickable documentation, not an executable workflow or a new source of business state. Ship read-only suite templates from Marble's customer, internal and supplier lanes, extended with the final application ownership/handoffs. An organization can make an editable copy. Suite updates never overwrite local edits; the copy records its source template/version and can compare/reapply selected changes explicitly.

Proposed BOSS `ironstone.insights.BusinessFlowMap` and version records store app navigation metadata: mapId, organizationPartyId or suite template identity, title/description, owner, sourceMapId/sourceVersion, current version, sharing group and status. Version content holds stable lane/step IDs, actor/title, order, description, registered target and typed parameters, optional catalog/metric count reference and optional Commons wikiPageId. No arbitrary JavaScript, SQL, HTML, service call or public URL execution is stored in a step.

A target resolver uses report/shell route registration and current permissions. No-access steps keep neutral process explanation if the map itself is readable but omit sensitive counts and active record links; unauthorized record names are never materialized. Missing/unimplemented targets are visibly informational and do not become broken links. Count definitions are the same domain queries as the target worklist, with organization, period and source basis fixed. A count failure affects that step only. Sequential arrows express normal business relationships, not a promise every organization performs every step or a sum of unique cases.

### FlowMaps

**Layout.** List of suite templates and organization maps, with source/version and last changed. A user's default is a preference pointing to an accessible map; the organization's default is an authorized setting.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapFind | find | Select scope and template | organization, name, template/copy, state | safe choices | proposed FlowMapServices.find#Maps | research §13; app lists |
| MapList | list, read | Open a map | title, organization, source/version, updated | map/editor links | same | Marble flow map; coarchy stories |
| CopyMap | dialog | Make an organization copy | source map/version, destination organization, title, group | organization and group lookups | proposed FlowMapServices.copy#Map | coarchy copy; framework read-only template pattern |

Copy input is `{sourceMapId, sourceVersion, organizationPartyId, title, userGroupId}`; owner and new ID come from the server. Clone copies references, not the referenced reports/content or their permissions. **Actions:** Open; F can Copy, set default and retire a local map. **Source:** research §§13,17. **Needs:** INS-08.

### FlowMap

**Layout.** `.qvue` visual lanes with connected step cards, an organization/time bar and a selected-step explanation. Use `m-*` inputs and existing report panels/count styling. The TUI twin and narrow-screen mode show the same ordered actor/step list, count, state and links; no spatial interaction is required to read or navigate.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapContext | find | Select an authorized map view | map, organization, period, counts on/off | authorized selectors | proposed FlowMapServices.get#Map | Marble dashboard; research §13 |
| ProcessLanes | component | Explain the flow | actor, step, description, source count/state, next link | lane diagram; list/tree twin | same with registered count providers | Marble sequence diagrams |
| StepDetail | display | Explain a handoff | owning app, prerequisite, target meaning, source/as-of, article | worklist and article links | same permitted projection | coarchy process stories |

**Actions/navigation.** Open worklist and Read procedure are primary for the selected step according to available targets. A report count can open Drill; operational decisions remain on the owning screen. F can open the editor or copy a suite template. The map never completes tasks, posts accounting or changes order status. **Source:** research §§13,15; Marble dashboard. **Needs:** INS-02, INS-08, INS-09.

### FlowMapEditor

**Layout.** XML editor with map identity, ordered lane/step lists, target selection, preview and versions. Direct list editing/reorder controls suffice; no new freeform diagram-authoring engine is required.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MapIdentity | single | Name and share a copy | title, description, organization, group | organization/group choices | proposed FlowMapServices.store#Map | app settings; template-copy pattern |
| Lanes | list, editable rows | Arrange actors | laneId, title, description, sequence | move up/down; named remove confirmation | same | Marble customer/internal/supplier actors |
| Steps | list, editable rows | Define documentation and target | stepId, lane, title, order, target, count, article | registered route/metric/page selectors | same | coarchy nested activities; research §13 |
| MapVersions | list, read | Compare and restore | version, note, author, date, source version | diff/restore preview | proposed FlowMapServices.get#Versions/restore#Map | framework definition history pattern |

New map input is `{mapId, title, description, organizationPartyId, userGroupId, lanes:[{laneId,title,description,sequenceNum}], steps:[{stepId,laneId,title,description,sequenceNum,targetRegistrationId,targetParameters,countMetricId,wikiPageId}], expectedVersion, versionNote}`. IDs are stable within the map; parameters are validated against the target registration. Organization cannot be reassigned across scopes by editing a hidden field. Referenced content is checked but not automatically shared. Restoring creates a new current version; deleting a used step/map reports affected defaults/links. Publication/revision confirms the organization and map; concurrent edits are refused by version. **Source:** research §13; coarchy copy/story pattern. **Needs:** INS-08.

### ProcessStory

**Context passed.** Mount Commons Knowledge, designed in [design-drawers-commons Knowledge](design-drawers-commons.md#knowledge), with wikiPageId, its existing space context and a map/step return link. Use its version/history/review, file and co-editing implementation and terminal/Markdown fallback. Map-read permission grants no wiki-page access; editing requires the existing Commons page/space capability. The map holds a link, not a copied article body or a separate review workflow. **Source:** research §13; Commons Knowledge. **Needs:** INS-08, INS-10.

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

These are Context passed definitions for every reused record row in §2; the owning forms are not copied here. Chatter/RecordFiles use the host's canonical access checks and never expose inaccessible source identities. Missing source records show Not available with a return to the report, without revealing whether a denied key exists. **Source:** research §15; crosscut §§3.2–3.12,3.16; People §4 and Projects §§5–6. **Needs:** INS-01, INS-02, INS-04.

## 11. Settings and data readiness

### Settings

**Layout.** Settings index and organization form, linked from Admin's settings index through its single owner registration. Personal favorites/layout belong to the user, organization defaults to Insights, and instance limits/credentials to Admin/Tools.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AnalyticsDefaults | single | Set organizational defaults | default map/dashboard, display zone/week start, default digest, freshness policy | authorized definition/map choices | proposed ContextServices.store#Settings | research §11; app settings pattern |
| ScopeAndDelivery | display | Explain effective controls | organization calendar, export cap, recipient mode, retention, sending readiness | canonical Admin/Comms links | ContextServices.get#Context; registered Admin readiness | Admin settings index |
| SourceOwners | list, read | Find accountable stewards | source, domain owner, status, permitted maintenance link | DataReadiness links | proposed RegistryServices.get#DataReadiness | research dataset settings |

New settings input is `{organizationPartyId, defaultMapId, defaultDashboardId, displayTimeZone, weekStart, defaultDigestDefinitionId, freshnessPolicyId, expectedRevision}`. Defaults come from effective organization/user settings; an empty choice remains empty. Fiscal start is not independently editable here: Accounting's organization calendar is authoritative. Instance resource/export ceilings can only be narrowed by business policy, never raised by an app form. No “disable permissions,” public links toggle or arbitrary recipient address field exists. **Source:** research §§11–12,17. **Needs:** INS-01, INS-06, INS-09; Admin ADM-SETTINGS.

### DataReadiness

**Layout.** List of sources needed by permitted catalog entries/dashboards, with last successful watermark, lag, coverage, validation and owner. A detail dialog shows safe checks and related definitions; it is not a replacement for Monitor.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReadinessFind | find | Select source health | organization, domain, source, state | status filters | proposed RegistryServices.get#DataReadiness | Admin operations/readiness pattern |
| SourceReadiness | list, read | Explain data availability | source, watermark, expected frequency, lag, completeness, owner | authorized diagnostics link | same; domain provider metadata | research §11; Marketing watermark contract |
| RefreshRequest | dialog | Request an admitted refresh | source, organization, requested scope, reason | registered operation only | registered Admin/domain refresh service | framework DataFeed/jobs |

New refresh input is `{sourceRegistrationId, organizationPartyId, scopeParameters, reason, operationKey}`; this is a request to the owning registered operation, never a user-selected service/index. The actor needs its existing operational permission. Display delayed/failed/unknown separately; no broad “refresh all” hides partial failures. One source failure is logged by name while independent sources continue. Existing after-commit feed failures remain recoverable without rolling back business records. **Source:** research §§11,17; framework reporting security/monitoring; domain readiness contracts. **Needs:** INS-03, INS-09; Admin ADM-OPERATIONS.

## 12. Later capabilities

Later is a decided release boundary, not an unresolved choice. These items do not block the initial catalog, governed builder, recipient delivery or flow-map capability.

### CashForecast

Accounting explicitly leaves cash forecast to Insights. Its later screen is an XML report with declared scenarios; the business forecast calculations belong in proposed `mantle.ledger.CashForecastServices`, alongside the source financial policies, not a BOSS-only arithmetic script.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ForecastOptions | single | Choose horizon and basis | organizations, starting as-of, horizon/grain, native/reporting currency, scenario | fiscal/period inputs; assumption disclosure | proposed CashForecastServices.get#Options | Accounting cash handoff; research financial dashboard patterns |
| ForecastAssumptions | list, editable rows | State scenario timing | source class, shift/probability, confidence, explanation | bounded typed assumptions | proposed CashForecastServices.preview#Scenario | explicit scenario comparison |
| CashProjection | list, read | Explain expected movements | period, opening cash, expected inflow/outflow, closing cash, uncertainty | table-backed graph; source drill | proposed CashForecastServices.run#Forecast | financial report archetype |

Complete scenario input is `{organizationPartyIds, asOf, horizonEnd, grain, currencyMode, reportingCurrencyUomId, ratePolicyId, includeCommittedOrders, includePlannedPayroll, assumptions:[{sourceClassEnumId,dateShiftDays,realizationPercent,reason}], scenarioId?, expectedVersion?}`. Start with authorized reconciled bank/cash balances and open invoice/payment obligations; optional commitments, payroll and scenarios are explicitly separated. Deduplicate an order commitment once its invoice/payment replaces that exposure. Missing due dates, rate data or payroll authority produce excluded/unknown exposure, never zero obligations. Actual receipts/payments and projected movements remain separate. No forecast posts, schedules payments or promises funding. **Source:** Accounting Decided, research §§7,15. **Needs:** INS-12, INS-02, INS-03.

### Other deferred items

| Capability | Decision and dependency |
| --- | --- |
| Generic pivot/graph on arbitrary form-list | Extend framework list metadata/renderers only with admitted measure/grain and full-query adapters; retain current domain report/table fallbacks. Add to dashboard is available first for registered supported sources. |
| SQL/script query mode, external warehouse and analytics data store | No first-release execution surface. A later design must supply isolation, authorization, provenance and source operations; do not fill unused moqui.olap dimensions or deploy a warehouse merely to match a reference product. |
| Public/anonymous dashboard links and general external report/alert delivery | Deferred. Signed-in embeds and internal recipient identity are the initial contract; PASS receives no public reporting capability by implication. |
| Advanced forecasting and cross-dataset joins | Require domain-owned grains/source reconciliation and resource limits; arbitrary joins and inferred correlations are not admitted business metrics. |
| Rich per-breakpoint dashboard arrangement | Reuse current framework layouts/responsive stacking; richer arrangement is framework work if needed, not a private BOSS layout format. |

## 13. Coverage and acceptance

### 13.1 Research candidate disposition

| Research candidate or open question | Decision and destination |
| --- | --- |
| Home/favorites/recents/needs attention/digest preview | Home §3; organizational attention complements personal Commons Today. |
| Dashboard list/view/editor, filters, targets, drill | §4 framework mounts plus typed target and Drill; one library-panel model. |
| Number/chart widgets and Add to dashboard | Framework panel/editor/embeds; §4 and eligible §5 registered source adapters. Existing funnel/geomap are reused; no separate chart library. |
| Dataset/report builder, analysis/pivot | §5 DataDocument parity plus admitted framework query/transform pipeline. Raw SQL/script remains §12 later. |
| Catalog/saved reports/views/pins | §6; owner reports stay canonical; FormListFind remains distinct from report Definition. |
| Scheduled delivery, KPI alerts, management digest | §§7–8; recipient execution is explicit and required, with per-recipient state/failure/retry. |
| Share dialog/read-only shared dashboard/embed | Dashboard sharing form and ordinary authenticated Dashboard route; same definition/source checks. No separate anonymous page. |
| Business flow viewer/editor/process stories | §9 suite templates plus organization copies; Commons owns story content. |
| Data administration/refresh | Datasets and DataReadiness; Admin/Tools owns raw index/job/credential operations. |
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
| Marble dashboard | flow-map sequence diagrams and counters, not independent inventory forms | Insights/FlowMap; Home management attention; global search remains the shell palette |

Mantle services explicitly selected in §6.2 for admitted business panels are mapped to `Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest`; their business formulas remain with the owner. Record-mount services stay traced through the shared owner's design; do not add every service reachable through a link. The root's setup#UserOrganizationInfo is mapped to Insights context if the inventory records setup callers. Framework ReportServices, EntityServices, ScreenServices and Wiki services are outside the Mantle USL inventory and are traced here instead. Proposed services never receive an Implemented in claim.

Legacy saved finds/schedules are inventoried by ID, owner, source route and sharing. Preserve their data and personal delivery where valid; route migration rewrites registered references and bookmarks through a deliberate migration, with a visible invalid-source state for unsupported definitions. Do not keep hidden alias routes or silently broaden a private find into a group dataset. No migration auto-activates a previously inactive alert or copied digest.

### 13.3 Acceptance scenarios

| Scenario | Required result |
| --- | --- |
| Reader versus author/steward/distributor | Each UI affordance has a successful authorized case and an otherwise valid denied direct-service case. Editing alone grants no source read. |
| Two organizations and confidential fields | Dataset choices, suggestions, aggregates, raw rows, labels, inspection, export, embeds, Assist and drill all retain source scope. People/payroll/cost fields never reach an unauthorized response. |
| Reconcile domain results | Split orders, invoice credits/refunds, partially received POs, source allocations, parent/child campaigns, project subtrees and maintenance roots reconcile to their owning reports without duplicate facts. |
| Money, units and calendars | Mixed currency/UOM is grouped or explicitly converted; ratios use correct denominators; organization fiscal periods and DST boundaries match displayed scope; a current snapshot cannot masquerade as historical. |
| Same metric on many surfaces | Landing, dashboard, analysis, alert, digest and CSV/XLSX/PDF use the same authorized query/metadata for a fixed range; allowed display formatting does not change totals. |
| Source quality | Zero, empty, denied, stale, incomplete, unavailable and failed remain distinct. One failed provider/panel does not suppress independent results; a reconciliation-critical composition cannot claim complete success. |
| Recipient differences | Two recipients with different organization and finance rights receive their own correct values; no owner frame, address-deduplicated attachment or shared cache leaks the broader result. Owner preview shows only their own view. |
| Spoofed recipient principal | Client-supplied runAs/user ID, another person's delivery ID and direct internal-worker calls cannot select an execution principal or retrieve another recipient's result. Only a valid claimed occurrence child can run as its approved recipient. |
| Lifecycle during rendering | Owner/recipient disablement, group expiry, scope revocation, address change, schedule edit/pause and definition access loss are rechecked before effect; stale staged output is discarded. |
| Independent retry | One recipient succeeds and another fails; retry sends only the failed child after rechecks. Concurrent workers do not duplicate known success; ambiguous transport is uncertain, not automatically resent. |
| Legacy schedule boundary | An admitted saved find honors recipient scope; arbitrary screenPath/direct older services cannot bypass mode; unsupported old definitions remain personal or unavailable. |
| Business alert semantics | Recipient condition/state can differ from owner and other recipients; No Data/Error is not healthy; private values are absent from safe administrative history and general notification payloads. |
| Editable map copies | Copy preserves suite provenance; local edits survive template updates; stale version fails; an unauthorized/missing target exposes no count or live link; map actions cannot mutate business records. |
| Definition and source change | Version conflicts, retired fields, changed metric grain and removed references give actionable blockers; restore creates a new version; import/Git sync does not activate delivery or bypass admission. |
| Device and output | Browser, narrow phone and TUI can read/use every screen; chart/map has a table/list alternative; exported documents retain filters, units, basis, versions and as-of. |

Implementation tests should be small service/query/state-machine fixtures with a few targeted browser/TUI walks. Documentation completion requires link/anchor, table, source-name and inventory checks only; it does not authorize running slow scenarios. No slow test is required to review these documents.

## 14. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Dashboard/report snapshot | html-print/PDF; PNG where supported | Dashboard, ManagementDigest, ScheduledReportDetail | Existing framework Chromium renderer and composition; include title, organization, range, versions, units, meaning/as-of and incomplete warnings |
| Result tables | CSV/XLSX; admitted JSON detail | Analysis, Drill, DatasetView, owner report routes | Same authorized frames/source query; framework per-table export, not the browser's loaded rows |
| Scheduled report/digest | separate email per internal recipient with their own attachments/image | ScheduledReports, ManagementDigest | Recipient execution §7; Comms-approved template/profile and framework transport |
| Business alert | private in-app/email | AlertDetail/evaluator | Recipient-scoped condition and payload; owner operational alert policy is separate |
| Definitions bundle | JSON import/export | DashboardEditor, PanelDetail, authorized dataset/alert editor | Existing DefinitionReference bundle/remapping; exclude credentials/results and require admission; imported schedules/rules stay inactive |
| Business map | html-print/PDF or accessible ordered list; versioned configuration export | FlowMap, FlowMapEditor | The same map version with authorized links/counts; no hidden source names or operational execution |
| Delivery audit | authorized status export | ReportDelivery, Admin audit link | Occurrence/recipient state and safe reasons; other recipients' report contents excluded |

Exports and delivery are audited through the existing `moqui.report.audit` target plus proposed occurrence/recipient records. No new ArtifactHit/ArtifactHitBin logging model is introduced. Stored business outputs use Admin retention/classification policy; their access remains recipient/domain scoped. Bundle import is configuration work, distinct from Admin's business-data import and its row outcomes. **Needs:** INS-06, INS-09, INS-11.

## 15. Framework and data needs

### 15.1 Consolidated needs

Existing engine capabilities are foundation, not proposed work. The following extensions are the remaining contracts required by this design; the crosscut roll-up references these IDs.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| INS-01 Access and context | service type, seed data | ironstone.insights.ContextServices; permission/group/artifact mappings; shared-context integration | all Insights surfaces | Separate read/author/steward/distribution/flow/settings grants; server-derived scope and canonical links; source permissions hold for direct calls, downloads and Assist. |
| INS-02 Business report and metric registration | data model, service type, seed data | BOSS ReportCatalogEntry; RegistryServices; versioned business metadata on framework definitions and domain service frames | Home, catalog, panels, Drill, flow counts, digest | Domain-owned grain/basis/denominator/unit/scope/drill/freshness contract; registered service adapters only; no duplicate formula store. |
| INS-03 Dataset admission and semantic guards | service type, seed data | Extend ReportServices with business dataset mutation/validation/admission; domain scope policies and approved projections | builder, every query/output | Entity filters are not inferred; apply server source scope before aggregation/suggestions/export; guard protected fields, incompatible units and nonadditive measures; direct JSON/services cannot bypass. |
| INS-04 Shared analytics mounts and drill | XML Screen element, service type | Reuse framework editors/report-embed/panels; context-aware links and business drill presentation | Dashboards, panels, Analysis, other app embeds | Same engine/definition; registered filter and source links; full-query drill with provenance; browser/TUI/phone alternatives. No private renderer. |
| INS-05 Catalog personalization and saved-work index | data model, service type | ReportPin and authorized RegistryServices projection over Definition/FormListFind | Reports, SavedReports, Home | Per-user pins/preferences; distinct underlying kinds; source access on every open; dependencies on finds checked before deletion. |
| INS-06 Recipient report delivery | data model, service type, seed data | Extend ScreenScheduled/ReportServices with recipient mode, ReportOccurrence and ReportRecipientDelivery, transport/outbox identity | schedules, digest, Admin lifecycle | Separate owner/recipient principals; effective group expansion, pinned period/versions, fresh pre-effect authorization, private artifacts, independent retry/uncertain outcome; existing technical owner mode preserved. |
| INS-07 Recipient business alerts | data model, service type, seed data | Extend framework alert definitions/state/contact execution with recipient identity and business mode; private topics | Alerts, panels, Admin safe status | Evaluate condition per recipient; recipient-keyed state/deduplication; no owner-value disclosure; technical alerts retain explicitly redacted authorized notification policy. |
| INS-08 Business flow documentation | data model, service type, Vue component | BOSS BusinessFlowMap/version; FlowMapServices; visual map and TUI/list twin | FlowMaps, FlowMap, editor, ProcessStory | Read-only suite templates plus organization copies; stable step IDs, typed registered links/counts, Commons article references; optimistic versions; no workflow execution. |
| INS-09 Provenance and readiness | service type, data model | Source metadata/validation contract on registered report results and delivery records | all analytical results, DataReadiness | Explicit watermarks, scope/calendar, metric/definition versions, completeness and reconciliation evidence; independent source failures; unavailable is not zero. |
| INS-10 Shell and Assist integration | shell item, service type | Existing provider registrations and screen context for Insights | palette, quick create, Today, notifications, Assist | Safe IDs/filters/frames only; same query authority and bounds; organizational attention distinct from personal Today; proposed output reviewed before sharing/activation. |
| INS-11 Outputs and legacy compatibility | service type, render mode | Extend authorized export/admission and registered legacy schedule adapters; route/reference migration | outputs, saved finds, imports, schedules | Existing renderers/audit reused; preserve legacy IDs/history without bypasses; no silent group sharing or activation; access-checked recipient artifact lifecycle. |
| INS-12 Later analyses | service type, XML Form element | Mantle CashForecastServices; later generic list-source pivot/graph adapters and explicitly designed external/public capabilities | CashForecast, future list views | Scenario sources, deduplication, currency/calendar and uncertainty before forecasting; no raw-query escape or implicit public distribution in initial release. |

### 15.2 Service boundary and minimum interfaces

Names in this table are proposed unless explicitly marked existing. The form summaries use these short families; fields passed as context still must be declared in service parameters.

| Family | Operations and minimum contract | Ownership |
| --- | --- | --- |
| `ironstone.insights.ContextServices` | get#Context(organization/range/record) → authorized choices, capabilities, safe links/defaults; store#Settings(§11 input) → revision and validated settings | BOSS access/navigation/settings only |
| `ironstone.insights.RegistryServices` | get#Home, get#Attention, find#Reports, find#SavedReports, get#Metric, store#ReportPin, get#DataReadiness; authorized filters/paging → display projection, metadata and canonical references | BOSS catalog/composition; calls registered owners without reimplementing their calculations |
| `ironstone.insights.FlowMapServices` | find#Maps, get#Map, copy#Map, store#Map, get#Versions, restore#Map; §9 typed input → versioned map and authorized targets/counts | BOSS documentation/navigation data; Commons owns linked content |
| Existing `org.moqui.report.ReportServices` | run#Query, query#Documents, list#Datasets, get#Dataset, render#Dashboard; get#Definition, list#Definitions, save#Definition, copy#Definition, versions#Definition, get#DefinitionDiff, restore#Definition, delete#Definition, find#DefinitionUses, export#Definitions, import#Definitions; preview#Report, send#Report, create#Schedule, list#Schedules, pause#Schedule, evaluate#Alerts | Framework engine, definitions and scheduling; extend contracts without BOSS role tests |
| Proposed ReportServices dataset extensions | create/store/validate#BusinessDataset, store#BusinessDatasetFields; §5 inputs → admitted source/version/check results | Framework mutation/admission mechanics with domain-supplied source policy; existing EntityServices used where applicable |
| Proposed ReportServices delivery extensions | store#Schedule, check#ReportAudience, find#ReportOccurrences, get#ReportOccurrence, get#RecipientReport, retry#ReportRecipients; §7 inputs → safe status or caller-owned content | Framework principal/lease/outbox/artifact lifecycle; business mode cannot be bypassed by direct services |
| Existing domain report service families | §6.2 registered inputs and declared outputs → rows/frames plus versioned business metadata; add missing authorization/semantics where necessary | Mantle owns calculations, dates, units, private-field projection and source evidence; BOSS owns view adapters |
| Proposed `mantle.ledger.CashForecastServices` | get#Options, preview#Scenario, run#Forecast; §12 input → authorized source movements, scenario projection and uncertainty | Later Accounting-domain calculation, presented in Insights |

Framework functions remain in the current `moqui-report` crate and shared webroot/TUI widgets; domain services stay in Mantle and run without BOSS installed. Generic reusable widget changes follow style-guide §8.1 across XSD, renderers/static mirror, browser wrapper and TUI/fallback. This design neither adds a BOSS Rust analytics engine nor a new external datastore.

## 16. Decided

| Decision | Notes |
| --- | --- |
| Insights composes domain-owned business meaning | Catalogs, dashboards and flow maps join the suite; formulas, source authorization and operational report forms remain with their domain. |
| Built reporting tooling is the foundation | Research's planned dashboard/widget/alert gaps are reconciled against current source; Definition, library panels, queries, transformations, exports and widgets are reused. |
| One panel/metric definition across surfaces | Landing, dashboard, alert, digest, export and Assist use the same admitted query and semantic contract. Existing operational cards can adopt it incrementally. |
| Viewer execution for live results | Definition/group sharing grants no data access. Report dataset row filters are explicitly supplied; EntityFilterSet is not presumed to apply to SearchFacade. |
| Recipient execution for business delivery | Each internal recipient receives their own authorized result; separate occurrences/child outcomes support rechecks, independent retry and private artifacts. Existing technical Tools schedules retain explicit owner mode. |
| Recipient-scoped value-bearing business alerts | Evaluate each recipient's condition/state, not an owner trigger with a redacted payload. Operational alerts retain authorized redacted incident notifications. |
| General external/public reporting later | No anonymous dashboard, bearer output link, arbitrary external address, Telegram or business webhook in the initial surface. Signed-in embeds use viewer authority. |
| Management attention is organizational | It exposes cross-app bottlenecks through owner providers; Commons Today remains personal work, and duplicate source counts are not summed into a suite total. |
| Organization copies of suite flow maps | Read-only suite seeds, editable copies, preserved provenance and explicit revision comparison. The map documents and links; it does not execute business processes. |
| Commons owns process-story content | Reuse Knowledge/wiki with its own access, history and review. Maps store references, not duplicate content or attachment grants. |
| Report builder uses framework query pipeline | Dataset/service source, aggregation roles, server transformations, pivot and comparison; no general SQL/script engine or separate OLAP store. |
| Generic arbitrary-list pivot/graph remains later | Existing framework report rendering is reused now; all-list integration requires source adapters and cannot aggregate only visible rows. |
| Mixed money, units and dates are governed | Separate currencies/units or named domain conversion; organization calendar and historical source basis are explicit. An unlabelled mixed-currency number is not acceptable. |
| Legacy reports/finds retain distinct identities | Catalog links do not relocate owner reports; FormListFind and Definition remain distinct. Scheduled-find parity gains the same business delivery guard. |
| Accounting's cash forecast handoff is accepted | Later CashForecast is designed in §12; it does not change current Accounting statement or payment ownership. |
| Dataset/index operations have one owner | Stewards maintain approved definitions; raw indexes/jobs/credentials and retention remain Admin/Tools. Insights readiness links into those surfaces. |
| Audit and failure tolerance reuse the platform | Report audit goes through Monitor; independent panels/sources/recipients continue after named failures. Security/data-authority failures remain strict. |

## 17. Open

None for the initial design. Later capabilities and their prerequisites are explicitly assigned in §12. Deployment-specific choices—approved audiences, source freshness limits, retention, sending profiles, fiscal calendars and data classifications—are configuration inputs owned by the named applications, not unresolved alternatives in this design. Implementation must satisfy the admission and recipient-execution dependencies before enabling those user-facing capabilities.
