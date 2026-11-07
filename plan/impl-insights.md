# IronStone BOSS — Insights implementation

Nov 7, 2026 — plan, before Insights starts. P0 partly done: F1–F25 found while writing it, from the code as Commerce,
Customer Service and the framework's report engine left it (§6). Insights and Admin are the next two apps built, after
Commerce, in one build order kept in [impl-admin.md](impl-admin.md) §1. The parts of design-insights that wait on
People, Maintenance, Sales and Marketing, which are not built, are left out of this build (§4, §7). The plan's open
questions were answered the same day (§4 here and in impl-admin: recipient caps of 50 and 200, shared devices and wall
displays in a second Insights release).

How [design-insights.md](design-insights.md) gets built, in phases from the foundation to flow maps, each ending tested
and usable. This file is kept at a high level, as [impl-commerce.md](impl-commerce.md) and the other core-app plans
are: each phase names its scope by the design's sections and §15 needs rather than restating them, and the design stays
the place for screen and record detail. During the build this file is the log: phase status and what each built, the
decisions made, open questions, findings against the code, and what is deferred.

Today `screen/Insights/` is a mixture (F20): Dashboards and Dashboard wrap the framework's screens but still send edit,
new and explore to the Tools Dashboards app; ReportBuilder is the copied SimpleReport builder over every non-framework
entity with raw entity transitions; Reports is the legacy saved-report picker; ScheduledReports holds the copied
personal scheduled finds; Home, FlowMap and Settings are placeholders. The `BOSS_INSIGHTS` artifact group is live for
`ADMIN` and `BOSS_INSIGHTS_ADMIN` (F1). The framework's report engine is built, but its screens and services are granted
to `ADMIN` only (F2), every shipped business dataset is `ADMIN`'s only and unfiltered by organization (F9, F10), and a
group schedule sends the owner's result to every recipient in one message (F6). Insights is built on what is there (as
found in the code, §6):
- from the framework: the `moqui-report` engine (definitions with versions, references and git sync; datasets with row
  filters; dashboards, library panels and the funnel, node-graph and geomap panels with their terminal twins; Explore;
  alerts; schedules; annotations; playlists), the Tools Dashboards screens, Monitor's Business operations dashboard,
  the ScreenScheduled scheduler and DataFeed indexing;
- from Mantle: the sales datasets, dashboard and alert template, the `MantleSales`, `MantleInventoryData` and
  `MantleSearch` feeds, the domain report services (Sales, Ledger, Finance, Budget, Inventory, Project), and
  `get#PartyOrganizationInfo` for organization scope;
- from the apps: Customer Service's and Commerce's report catalogues already in Insights' contract
  (impl-customer-service F189, impl-commerce F142), Accounting's report catalog, the report areas of Warehouse,
  Manufacturing and Projects (impl-manufacturing F143), Customer Service's and Commerce's shipped datasets, dashboard
  and alert templates waiting for admission (impl-customer-service F191, F212), each built app's Home work cards, and
  the shared record screens;
- from Admin, built beside it (impl-admin): the readiness and refresh registries (Admin P2), the capability registry
  (Admin P3), the lifecycle participants (Admin P6), the instance ceiling for group recipients (Admin P8) and device
  credentials for wall displays (Admin P18).

**Inputs.**
- Designs:
  - [design-insights.md](design-insights.md)
  - [design-admin.md](design-admin.md) §14 (the readiness provider and its freshness facet, the refresh operation, the
    lifecycle participant, shared devices) and §4.1 (offboarding's pause and transfer)
  - [design-crosscut.md](design-crosscut.md) §1.4 (the Insights capability rows), §1.5 (CX-ASSIST, CX-OPS-REPORTS), §2
    (the shared-screen registry: Dashboard, Reports, Drill and the record screens), §3.2–§3.6, §3.8, §3.10 and §3.16
    (the shared record screens' Insights rows; RequestDetail's and WorkItemDetail's are in design-projects §5 and §6),
    §3.17 (the widget contract) and §7.11 (Insights' needs)
  - the built owners' designs for the entries, metrics and providers Insights registers:
    [design-accounting.md](design-accounting.md) §13, [design-customer-service.md](design-customer-service.md) §7,
    [design-commerce.md](design-commerce.md) §3, [design-products.md](design-products.md),
    [design-warehouse.md](design-warehouse.md), [design-manufacturing.md](design-manufacturing.md),
    [design-projects.md](design-projects.md) §11, [design-purchasing.md](design-purchasing.md), and
    [design-drawers-commons.md](design-drawers-commons.md) Knowledge (ProcessStory)
  - mr-moqui `plans/Monitoring.md` (dashboards and reports) and `docs/tools/Monitoring.md` (the built reporting guide,
    "Security")
- Plans:
  - [impl-admin.md](impl-admin.md), its companion, which holds the one build order.
  - [impl-customer-service.md](impl-customer-service.md) P14 (F189–F191, F212), [impl-commerce.md](impl-commerce.md)
    P11 (F22, F142), [impl-manufacturing.md](impl-manufacturing.md) P16 (F142, F143),
    [impl-accounting.md](impl-accounting.md) (its Reports), [impl-warehouse.md](impl-warehouse.md) P17,
    [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- The suite-app design review, which explains the design's X, Z, L and R-INS IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md`.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8,
  mr-moqui `docs/dev/Practices-App-Dev.md`.
- Inventories: [ss-inventory.md](ss-inventory.md) (the SimpleReport and MyAccount scheduled-find rows) and
  [usl-inventory.md](usl-inventory.md) (the report services of design §13.2), which carry the design's **Designed in**
  paths.
- mr-moqui: `plans/Remaining-Work.md` ("IronStone framework asks": the report engine row) and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/moqui-report`, `crates/moqui-tui`, `runtime/base-component`): the Dashboards screens mountable
    under an app root (INS-04), dataset admission and its row-filter parameters (INS-03), owner-equivalent delivery
    with occurrences and recipient deliveries and the ownership services (INS-06), owner-equivalent business alerts
    (INS-07), drill resolution and the business annotation source;
  - `runtime/component/mr-mantle`: the organization row filter, the row filters of its shipped datasets, an inventory
    dataset, and the post-commit annotations of its owners' events;
  - `runtime/component/mr-boss`: the Insights app, `ironstone.insights` (ContextServices, RegistryServices,
    FlowMapServices), the catalog, metric, attention and flow-target registrations of the built apps, the Insights
    context on the shared record screens, Insights' `report/` and `skill/` files.

  `runtime/component/mr-marble` is read only, for the SimpleReport and MyAccount scheduled-find forms ss-inventory maps.
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §15 needs they use, as changed by §6, with the first release's
    delivery of design §7.1 and §8.1 (personal, and owner-equivalent groups as separate messages), except what waits
    on People, Maintenance, Sales and Marketing (§4, the user's call):
    - the Employee360 record mount and People's report services, metrics and attention providers;
    - Marketing's visits and attribution metrics, its campaign reports, the campaign-sent annotation, and the funnel
      that needs visits;
    - Sales' own catalog entries (SalesSummary), pipeline and forecast measures, and its attention providers;
    - Maintenance's reports and its context on EquipmentDetail.
  - The registrations of the built apps (owner contracts, §2): catalog entries, metrics, attention providers and
    annotation sources of Customer Service, Commerce, Accounting, Products, Purchasing, Warehouse, Manufacturing and
    Projects; the orders metric over Mantle's sales services, which Commerce and Accounting already read (§4); Monitor's
    Business operations dashboard as an attention source.
  - The admission of the shipped datasets (design §5's backlog): Mantle's sales datasets with their row filter, a
    filtered inventory dataset, and Customer Service's and Commerce's datasets.
  - Shared screens: Insights' read-only context on the shared record screens of design §10 (P6), each owner's crosscut
    row checked against what is built.
  - The legacy screens replaced as design §13.2 maps them, their saved finds and schedules kept (P3, P4, P7, P12).
  - §7 holds design §12 (CashForecast, the funnel, multi-touch attribution, recipient execution and the other later
    items), the open items of design §17, and the parts waiting on unbuilt apps.
- **Order** (decided Nov 7, impl-admin §4): the one order of both plans is impl-admin §1. Insights' phases are P1–P5
  in stage 1 (interleaved with Admin P1–P7), P6–P10 in stage 2, its first release (beside Admin's stage 3), and P11 in
  stage 5, its second release, after Admin P18's device credential; P12 finishes with Admin P19.

## 2. Ground rules

- **The Commons rules hold** (impl-drawers-commons §4, as listed in impl-admin §2). The walks are on Commerce's
  pattern: one golden-path walk in `test/client/Insights/`, `InsightsDashboardsWalk` (P2), registered in
  `test/client/suite.js`; the others are acceptance tests.
- **One engine, the framework's.** Definitions, panels, queries, transformations, schedules, alerts, annotations and
  renderers stay in `moqui-report` and the shared widgets; Insights adds no BOSS analytics engine (design §15.2),
  private renderer (INS-04), layout format (DashboardEditor), formula store (§6.1) or second readiness registry (§11).
  An extension the design needs is made in the framework, for every app root, with Tools' own mounts unchanged.
- **Viewer execution and two kinds of grant.** Live results run as the viewer. `ironstone.insights` services and
  screens check the `INSIGHTS_*` permissions; the engine checks its own artifacts: the ReportServices operations, each
  dataset's `org.moqui.report.dataset.<id>` artifact and its documents' DataDocumentUserGroup rows (F4). BossSetupData
  grants the Insights groups exactly the artifacts their capability needs, never `DASHBOARDS_APP` or
  `REPORT_DATASETS_ADMIN` (F2; §4). A definition share, a catalog entry, a supplied organization or another app's edit
  permission grants no data.
- **Admitted business data only.** A business dataset reaches an Insights user only once admitted: on a registered
  DataFeed, with its index built and a registered `rowFilterService` bound (design §5). Until then it stays as shipped
  (`ADMIN`'s, F9, F10) and shows as needs review, never as an empty source.
- **Domain meaning stays with its owner.** A metric's formula, scope and private-field projection are its owner's
  dataset or Mantle service; Insights stores the versioned descriptor and the catalog entry and calls the owner. One
  owner per catalog report (design §6.1, Z10) and per metric (§6.2, X11).
- **The comparison rules** (design §6.3, §6.2's Warehouse row and §13.3 "Source quality"): native currencies apart
  unless a named conversion; ratios from their parts; snapshots never summed across dates; recurring base orders never
  orders (X5); fiscal ranges from the organization's calendar; zero, empty, denied, stale, incomplete, unavailable and
  failed told apart in every output.
- **Restricted values stay on the server**: costs (`PRODUCT_COST_VIEW`), supplier prices, payroll and private contacts
  are absent from answers, not zero; an MCP tool never reads a cost or People dataset (design §1.2).
- **No recipient receives more than they may see** (design §7.1): personal delivery, or a group whose every recipient's
  scope fingerprint equals the owner's, checked at save and at each run, one message each.
- **Owner contracts.** A registration or a shared-screen branch built here for another app follows that app's design
  and is written into it; the owner's routes, services and permissions stay the owner's, and a registration adds no
  right.
- **Independent failures.** A failing provider, panel, source, recipient or flow-map count is named and the others go
  on; a reconciliation-critical composition cannot claim complete success.
- **Existing callers stay compatible.** Tools' Dashboards, Explore, Monitor and Alerts for `ADMIN`; Monitor's own
  dashboards and its owner-mode alerts; Tools' `create#Schedule` and the legacy screen schedules (owner-mode, personal);
  Mantle's sales report services and their Commerce and Accounting callers; Customer Service's and Commerce's Reports
  areas and their catalogue services; the shared record screens' existing branches. The framework regression suite,
  mr-mantle's sales and report specs and the earlier apps' BOSS regression suite pass unchanged.
- **Done for a phase** is impl-admin §2's, with `InsightsAccess` as the access spec (one holder and one non-holder on
  one verb, and another organization's rows refused).

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 7 (§6 F1–F31) |
| P1 Foundation | BOSS | the Insights root and menu | built and reviewed Nov 7, merged |
| P2 Dashboards and Explore in Insights | mr-moqui, BOSS | Dashboards, Dashboard, DashboardEditor, Panels, PanelDetail, Playlists, Explore | built and reviewed Nov 7, merged |
| P3 Dataset admission | mr-moqui, Mantle, BOSS | Datasets, DatasetDetail, DatasetFields, DatasetView | built and reviewed Nov 7, merged |
| P4 Report catalog and metrics | BOSS | Reports, SavedReports; Dashboard's meaning, PanelDetail's measure and target | built and reviewed Nov 7, merged |
| P5 Home and attention | BOSS | Home | built and reviewed Nov 7 (branch `ins/p5`) |
| P6 Analysis, drill and record contexts | mr-moqui, Mantle, BOSS | Analysis, Drill, the Records mounts | — |
| P7 Scheduled delivery and digests | mr-moqui, BOSS | ScheduledReports, ScheduledReportDetail, ReportDelivery, ManagementDigest | — |
| P8 Business alerts | mr-moqui, BOSS | Alerts, AlertDetail | — |
| P9 Flow maps | BOSS | FlowMaps, FlowMap, FlowMapEditor, ProcessStory | — |
| P10 Settings, data readiness and Assist | BOSS | Settings, DataReadiness | — |
| P11 Wall displays on shared devices | BOSS | Playlists on a registered device | — |
| P12 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F25 were found on Nov 7 while writing this plan; the design edits they call for
were made then. Still to check:

- **The flow-map body** (design §17 Q1): whether the node-graph panel (WebrootReport.js and the terminal's
  `report/graph.rs`) reads the suite's customer, internal and supplier lanes as node groups at phone width and in the
  terminal, and the frame shape `get#Map` must return for it (the server's graph frames are span-based, F12).
- **The Dashboards screens' other escapes** (F3): the panel menu's edit, library-panel edit, new alert rule and the
  `e` key, and what the browser and terminal report components need to post to the mounted screen.
- **The legacy data:** the ScreenScheduled and FormListFind rows the demo and an upgraded instance hold, and the screens
  they name, for P7's and P12's compatibility mapping.
- **The reports to register for Products and Purchasing**, which have no Reports area (CatalogChecks; supplier
  scorecards and purchasing history), and **each built app's Home work cards** usable as attention providers (the
  same query as the worklist they open).
- **The organization field of each shipped dataset:** Commerce's documents by their store's organization, Customer
  Service's clocks by their queue's, and whether each document carries it.
- **Mantle's annotation writes:** that a Mantle service may call the framework's `create#Annotation` after its commit
  (price list published, period closed) with an organization and a link, and Commerce's promotion start.

### P1 — Foundation

Design §1.1, §1.2 and §1.3's legacy screens; INS-01, INS-10 (the shell part).

- **Access** (design §1.1).
  - The groups on Commerce's pattern (impl-commerce F45): `BOSS_INSIGHTS` as the root user group beside the artifact
    group of that name, and `_READ`, `_AUTHOR`, `_DATA`, `_DISTRIBUTE` and `_FLOW`; `BOSS_INSIGHTS_ADMIN` keeps its
    row. An area only some groups see is an artifact group that denies the root group and allows its capability groups.
  - The permissions `INSIGHTS_VIEW`, `_AUTHOR`, `_DATASET_VIEW`, `_DATASET_EDIT`, `_SCHEDULE`, `_DISTRIBUTE`,
    `_FLOW_EDIT`, `_SETTINGS_VIEW` and `_SETTINGS_EDIT`, seeded in BossSetupData with their ADMIN grants and granted by
    design §1.1's table (§4).
  - The engine's artifacts per capability (F2, F4): artifact groups granting the ReportServices operations a reader,
    author, steward and distributor use (query, render, definitions, copies, versions; dataset saves for the steward;
    schedules for the distributor), and none of Tools' screens, telemetry datasets or git sync.
  - The ordinary groups' authz on the root with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT` and the
    `ironstone\.insights\..*` service pattern; `insights` in the client deny pattern comes from Admin P1 (impl-admin
    F14). Its capability rows go into Admin P3's registry, which Admin P3 fills (impl-admin §4).
  - `ironstone.insights.ContextServices.get#Context` (design §15.2): organizations, capabilities, safe defaults and
    canonical links, over one module `Insights.js` whose tables later phases extend.
- **The Insights root** (design §1.2): Home and the menu groups Dashboards and KPIs, Report builder, Reports, Delivery
  and alerts, Business flows and Settings, each entry added by the phase that builds it. Until their phases replace them
  the copied ReportBuilder, Reports and ScheduledReports screens stay open only to `ADMIN` and `BOSS_INSIGHTS_ADMIN`, as
  now (F20), and the placeholders are removed. `<shell-providers>` with the `insights` keymap; palette and quick create
  sources arrive with their records. The stale grant comment fixed (F1).
- **Demo data.** BossUsersDemoData gains a user per group (`insights.reader`, `.author`, `.steward`, `.distributor`,
  `.flow`, `.admin`), a reader of ORG_ZIZI_SERVICES only, and a reader with and one without financial read, for design
  §13.3's two-organization and confidential-field scenarios.
- **Specs.**
  - `test/Insights/InsightsSpecLib.js` (ids, users, `shell`, `page`).
  - `InsightsAccess`: the app's one access spec, about six features with authorization on: each group's permissions
    and engine artifacts (a reader cannot save a dataset definition; nobody but `ADMIN` reaches Tools' Dashboards), the
    menu and providers per group, the copied builder refused to the ordinary groups, and the refused raw entity
    transitions. A later phase adds a case only for an access rule it adds.
- **Usable when** (an acceptance test to write, `acceptance/Insights/InsightsFoundationWalk`): the menu renders for each
  group; `insights.reader` opens Insights but not the report builder; a Projects client and a PASS account are refused
  the root and every `ironstone.insights` service.

**Built Nov 7 (P1).**
- Access (`data/BossSetupData.xml`, appended but for F1's root row, now `AUTHZT_ALLOW`, F36):
  - the groups `BOSS_INSIGHTS` (root user group) and `_READ`, `_AUTHOR`, `_DATA`, `_DISTRIBUTE`, `_FLOW`; on the
    `BOSS_INSIGHTS` artifact group (a second element of the same id) the `ironstone\.insights\..*` service pattern and the
    root authz `BOSS_INSIGHTS_ROOT` (`MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`); the deny pattern untouched (`insights` is
    in it since Admin P1);
  - `BOSS_INS_LEGACY`: the copied Dashboards, Dashboard, ReportBuilder, Reports and ScheduledReports denied to
    `BOSS_INSIGHTS`, `ALLOW` for `BOSS_INSIGHTS_ADMIN` (F20, F35; `ALWAYS` until review R2); ADMIN keeps them through the
    root's ALWAYS;
  - the nine `INSIGHTS_*` permissions with their ADMIN grants, and design §1.1's table: every group `INSIGHTS_VIEW`; the
    author `_AUTHOR`; the steward `_DATASET_VIEW`, `_DATASET_EDIT`; the distributor `_SCHEDULE`, `_DISTRIBUTE`; the flow
    editor `_FLOW_EDIT`; the administrator `_SETTINGS_VIEW`, `_SETTINGS_EDIT`;
  - the engine's artifacts (F2, F4, F32, F33): `BOSS_INS_REPORT_READ` (the `/moqui/reports` REST path and
    `query#Documents`, `run#Query`, `list#Datasets`, `get#Dataset`, `render#Dashboard`, `get#Definition`,
    `list#Definitions`, `versions#Definition`, `find#DefinitionUses`, `get#DefinitionDiff`, `preview#Report`,
    `audit#Export`; ALLOW for the six groups); `BOSS_INS_REPORT_AUTHOR` (`save#`, `copy#`, `restore#`, `delete#Definition`;
    DENY for `BOSS_INSIGHTS` and `BOSS_INSIGHTS_ADMIN`, ALWAYS for the author and steward); `BOSS_INS_DATASET_EDIT`
    (`org.moqui.report.dataset`, the engine's dataset-save check; the steward); `BOSS_INS_REPORT_SCHEDULE` (`create#`,
    `list#`, `pause#Schedule`, `send#Report`; the same denies, ALWAYS for the distributor); `BOSS_INS_REPORT_TOOLS`
    (`import#Definitions`, `create#Annotation`, `evaluate#Alerts`, the four git sync operations; denied to the root user
    group and the administrator). No `DASHBOARDS_APP`, `REPORT_DATASETS_ADMIN`, Tools screen, telemetry dataset or dataset
    artifact; P3's admission grants the datasets.
- `ironstone.insights.ContextServices.get#Context` (in: `appRoot`, `organizationPartyId`) over
  `service/ironstone/insights/Insights.js`, whose tables later phases extend: `capabilityPermissions` (the nine), `areas`
  (`legacy`, read from `BOSS_INS_LEGACY`), `linkPaths` (Home). Opening Insights is the root grant read from the user's own
  groups (impl-admin F35's way); a Projects client and a PASS account never. It answers the capabilities, the organization
  choices (the user's, or every internal one for the administrator with none active), the organization in scope (the
  requested one only when it is the user's, `ORGANIZATION_UNAVAILABLE` otherwise, forged or not; else the active one, else
  the only one), the safe defaults (`now-30d` to `now`, currencies native, F38) and `sharedLinks`; refusals
  `INSIGHTS_UNAVAILABLE`, `INSIGHTS_CONTEXT`.
- Screens: the root (`screen/Insights.xml`: `get#Context` and `sharedLinks` in always-actions; `<shell-providers>` with
  the `insights` keymap, `g s` Insights home, F34; the stale grant comment replaced, F1); Home rewritten as its frame
  (the scope, read only; the first-use state "No dashboards or reports are shared with you yet."; the root group alone told
  why); the FlowMap and Settings placeholders removed. The reader's menu is Home; the administrator's and ADMIN's add the
  copied screens.
- Demo (`data/BossUsersDemoData.xml`, appended): `insights.reader`, `.author`, `.steward`, `.distributor`, `.flow` (each in
  `BOSS_USERS`, `BOSS_INSIGHTS` and its group, an agent of Retail), `insights.admin` (`BOSS_INSIGHTS_ADMIN` alone),
  `insights.services` (a reader of ORG_ZIZI_SERVICES only) and `insights.finance` (a Retail reader in
  `BOSS_ACCOUNTING_READ`, the financial read `insights.reader` lacks); none in `ADMIN`.
- Specs: `test/Insights/InsightsSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`,
  `screenRefusal`, `shell`) and `InsightsAccess` (6 features, 2.5 s feature time, the slowest 0.65 s: the context, the
  Services reader refused Retail and a forged organization, another app's user, a client and a PASS account refused the
  context and Home; the menu and keys of the reader, the administrator and ADMIN, the launcher; Home's one qvt render;
  the capabilities of every user; the engine's artifacts (the reader and the administrator refused `save#Definition`, the
  author saving a dashboard but refused a dataset, the steward saving it; schedules the distributor's; `otel_spans` refused
  to the steward and read by ADMIN; git sync refused to the administrator; Tools' Dashboards refused to the administrator and
  the author); the copied builder refused to the reader and its raw `createDataDocumentCondition` transition to the author,
  opened to the administrator). A throwaway probe screen under the root, not kept, confirmed F32's deny: from an Insights
  screen the reader and the administrator are refused `save#Definition` and the author saves. Acceptance, written and not
  run: `acceptance/Insights/InsightsFoundationWalk` (3 features: every group's menu with each entry opened and the others
  refused; the reader's Home without the builder, its dataset screens and transitions; the client and the PASS account
  refused the root and `get#Context`).
- Tests run (release binary, `--nobuild`, this worktree's runtime): InsightsAccess 6 of 6; AdminAccess 7, ProjectsAccess 8,
  CommerceAccess 15 and Chatter 27 (57 of 57, the deny-pattern feature among them). `moqui lint --screens`: 132 sites, as
  before, none in the Insights screens. Prettier clean on the new JavaScript. Not run: `./moq test-apps`, the acceptance
  suite (AppStructure and TuiRender list the copied screens, rendered as ADMIN, unchanged; the removed placeholders are found by
  label).
- Budget: mr-boss's measured share is InsightsAccess's 2.5 s server (no client spec).
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (the SimpleReport and MyAccount rows are P3's and
  P7's).
- Design edits: §1.1 (the root user group and the engine's denies), §1.2 (`g s`).
- Findings (provisional, numbered by the lead): F32 to F38 in §6.
- Decisions (§4 rows added): opening Insights with the root grant alone; the engine's artifacts by group and the
  administrator's read only; the copied screens with Dashboards; the financial reader's group.
- For the lead:
  - the budget: mr-boss's share is InsightsAccess's 2.5 s;
  - P2's mounts inherit the root's ALLOW: a mounted Tools Dashboards screen opens to every Insights user unless denied as
    Admin's System is (impl-admin F34); the administrator's root grant is ALLOW so such a deny applies to them;
  - Admin P3's capability registry gets Insights' rows (the nine permissions and six groups above);
  - `test/Shared/Chatter.spec.js`'s comment that Insights and Admin have no grant was stale and is corrected (F37).

**Review Nov 7 (P1).** Checked the BOSS diff against this section, §2, §4, §6, design §1.1–§1.3, impl-admin F34, F35 and its
P1 review, AGENTS.md, the testing skill and Practices-App-Dev, with the engine's checks read in moqui-report and authz.rs:
- The engine's grants: every ReportServices operation enumerated from ReportServices.xml. Direct calls need an explicit grant
  (no service is open by inheritance outside a screen), so a reader calls only `BOSS_INS_REPORT_READ`'s. Under an Insights
  screen the root's ALLOW reaches any operation without a row of the user's: `save#`, `copy#`, `restore#`, `delete#Definition`,
  the schedule operations, `import#Definitions`, `create#Annotation`, `evaluate#Alerts` and the git sync operations are denied
  to `BOSS_INSIGHTS` and `BOSS_INSIGHTS_ADMIN`, with `pull#DefinitionGitSyncs` added (R1); `export#Definitions` stays open that
  way, a read of definitions the viewer may read (`read_optional`); `run#ScheduledReport` is `anonymous-all`, outside
  authorization. The engine's own checks (`authorize_own`: each dataset, the dataset save, git sync, alert evaluation,
  webhooks, annotations) take nothing from an ancestor's ALLOW or ALWAYS, so the telemetry datasets stay `ADMIN`'s from any
  screen or the REST path. `/moqui/reports` has only reading verbs (`query`, `documents` POST, `datasets` GET); annotations
  are another path no Insights group holds. No Insights group has `DASHBOARDS_APP`, `REPORT_DATASETS_ADMIN` or a Tools screen.
  The groups' operations match design §1.1 and §4's row (the steward's authoring is the dataset save's carrier).
- The copied screens: denied to `BOSS_INSIGHTS`, so to every capability group, including the raw entity transitions
  (`ancestor_deny`); the administrator's grant there was an inheritable ALWAYS, which passed the engine's denies from those
  screens (R2). With ALLOW the administrator still opens them and posts the raw DataDocumentCondition transition (a probe,
  not kept).
- get#Context and Insights.js: scope from `MANTLE_USER_ORG` organizations, unrestricted only on a `MANTLE_ACTIVE_ORG` root
  grant; a forged and an out-of-scope organization refused alike (`ORGANIZATION_UNAVAILABLE`); a Projects client by
  `PROJECT_CLIENT`, a PASS account by holding no group; capabilities from the `INSIGHTS_*` permissions, no group name.
- BossSetupData appends only, but for F1's row (and its comment); the demo users as P1 lists, each internal one in
  `BOSS_USERS`, none in `ADMIN`. Screens: `moqui lint --screens` 132 sites, as before, the Insights screens only in the
  information lists. Specs: InsightsAccess 6 features, each under 0.65 s; Home one qvt render (the html renders are refusals).
- Fixes: **R1** (medium, security) `pull#DefinitionGitSyncs`, which has no check of its own, was open to every Insights user
  from an Insights screen; it joins `BOSS_INS_REPORT_TOOLS`, and InsightsAccess calls `save#Definition`, `create#Schedule`,
  `import#Definitions` and `pull#DefinitionGitSyncs` under the root as the reader, `save#Definition` as the administrator and
  the author (the F32 denies had no regression check; the direct calls pass without them) (mr-boss b2064085). **R2** (low,
  security) `BOSS_INS_LEGACY_ADMIN` is ALLOW, not ALWAYS; InsightsAccess checks the administrator refused `save#Definition`
  under the copied Dashboards; the Built note and F36 corrected (mr-boss 74f55764).
- Tests run (release binary, `--nobuild`, this worktree's runtime): InsightsAccess, AdminAccess, ProjectsAccess,
  CommerceAccess and Chatter 63 of 63 (mr-boss 12.8 s feature time); InsightsAccess 2.5 s, the engine feature 0.6 s. Each
  fix's new case seen failing without it. Prettier clean. Not run: `./moq test-apps`, the acceptance walk.
- For the lead:
  - the denies are per operation, so an operation the framework adds to ReportServices is open from any Insights screen
    that calls it until named here; a pattern deny of `org.moqui.report.ReportServices` for the root user group and the
    administrator, with the reading grants made ALWAYS, would fail closed (P2, when the mounts arrive);
  - `run#ScheduledReport` (`anonymous-all`, `allow-remote="false"`) delivers any schedule by id to any caller; harmless while
    no screen calls it, a framework note for P7;
  - the root user group alone (no capability group) reaches the reading operations from an Insights screen by the root's
    ALLOW; the engine's dataset checks still hold, and Home shows such a user nothing.

- **Wave 2 suites (Nov 7, on master after P1 merged; the Admin P2 and Insights P2 workers ran at the same time):**
  `mail_capture_sends=true ./moq test-apps` 3,324 server features and 17 client features passed, none failed; feature
  time mr-mantle 344.5 of 393 s, mr-boss 197.3 of 264 s server and 49.4 of 57 s client, mr-pass 14.3 of 20 s. No budget
  raised.

### P2 — Dashboards and Explore in Insights

Design §4 Dashboards, Dashboard, DashboardEditor, Panels, PanelDetail and Playlists, §5 Explore; INS-04 (a
first-release framework need).

- **The framework** (F3): Home, Dashboard, Definition, Panels, Explore, Split and Playlist mountable under an app root:
  links and transitions relative to the mount in the screens, in WebrootReport.js (the Definition and AlertRule links,
  the panel posts) and in the terminal's report components; dataset choices from the author's dataset artifacts, not
  `DASHBOARDS_APP` or `REPORT_DATASETS_ADMIN`; Tools' own mounts unchanged.
- **The Insights mounts**: Dashboards (definition type dashboard, the transitions the list posts, REPORT_RECENT and
  REPORT_STARRED as they are); Dashboard with BusinessContext (organization scope from `get#Context`; user variables
  never replace a scope predicate) and ShareDashboard (private or an authorized group); DashboardEditor; Panels;
  PanelDetail (the framework editor; its measure and target forms in P4); Playlists (as the signed-in viewer; on a
  registered device in the second release, P11); Explore with Split. A panel over a dataset the viewer may not read
  says so (P3 admits them).
- **Specs:** framework `ReportMounts` (a mounted Definition editor saves and returns under its mount; an author without
  `DASHBOARDS_APP` edits with the dataset grant; Tools' screens unchanged); BOSS `InsightsDashboards` (Dashboard's one
  qvt render); the golden walk `InsightsDashboardsWalk` (open a dashboard, copy it, add a library panel, save, all in
  Insights).
- **Usable when:** `insights.author` copies the shipped Store operations dashboard, edits and saves it without leaving
  Insights, and shares it with a group; its panels over datasets not yet admitted say not available, never zero; the
  Tools Dashboards app is unchanged for `ADMIN`; a playlist of two dashboards plays in kiosk mode.

**Built Nov 7 (P2).** mr-moqui e6e91427, mr-boss 1aa05e91 (branch `ins/p2`).
- **The framework** (F3, F27; mr-moqui `docs/tools/Monitoring.md` "Mounting the report screens"): the mounting app's root
  sets `reportLinks` in `always-actions` (screen URLs for `dashboards`, `dashboard`, `definition`, `panel`, `explore`,
  `split`, `playlist`, `alertRule`, `logContext`, `import`, `share`; a key left out or null is not offered), and Home,
  Dashboard, Definition, Explore, Playlist, Reports' playlist transitions and Datasets send their transitions and links by
  it, falling back to `//apps/dashboards/...` so Tools and Monitor (which include Dashboard.xml under `/apps/monitor`) are
  unchanged (F39). Dashboard.xml sends `appLinks` (server paths of the editor, panel editor, Explore, alert rules and the
  Dashboard whose transitions duplicate and remove) beside `screenUrl`; WebrootReport.js (`report.serverLink`,
  `report.appLink`) and moqui-tui `components/report.rs` (`app_link`) build Edit, Explore, a filter outside a dashboard, the
  duplicate and remove posts, New alert rule, the library panel's edit link and `e` from them and hide what is null.
  `reportFixedVariables` (a viewer's `var-` never replaces one; shown as a constant), `reportHiddenComponents` (the list
  leaves out a component's shipped definitions) and `reportDefinitionTypes` (an editor's types). Under a mount the
  editor's datasets are `list#Datasets` (each dataset's own artifact, no `DASHBOARDS_APP` or `REPORT_DATASETS_ADMIN`), a
  new panel starts on the first, Explore and Split open on a readable dataset (Split's request charts only with
  `otel_metrics`), import is offered only with an `import` link and the group field is hidden (kept) with a `share` link.
  A panel the viewer may not read says "Not available: <reason>" in the browser and the terminal, and Dashboard keeps the
  dataset refusal out of the page's messages (F40). Dashboard already had `duplicatePanel` and `removePanel`; BOSS's
  copy lacked them (F3) and the new mount takes them in.
- **The Insights mounts** (each a BOSS screen that includes the framework screen and takes in its transitions):
  `Dashboards` (Home, type dashboard), `Panels` ("Library panels", the framework Panels), `Playlists` ("Wall display": the
  playlists the viewer may read, New playlist for authors through Reports' `createPlaylist`, one played by Playlist when
  chosen), `Dashboard` (hidden; BusinessContext: the organization from `get#Context`, a forged one refused, fixed as the
  `organizationPartyId` variable, the user's organizations when none is chosen (F43); the range from Insights'
  defaults; ShareDashboard for the owner who authors), `DashboardEditor` and `PanelDetail` (hidden; the framework
  Definition with types dashboard and report, or panel; only save, copy, restore, delete, export, reference and dashboard
  taken in), `ReportBuilder/Explore` (Report builder's default, every Insights user) and `ReportBuilder/Split` (hidden).
  The copied Dashboards and Dashboard are replaced (F35); the menu is Home, Dashboards, Library panels, Wall display,
  Report builder (then the copied Reports and Scheduled reports for the administrator and ADMIN). The root sets
  `reportLinks` from `get#Context` (no editor for a user without `INSIGHTS_AUTHOR` or `INSIGHTS_DATASET_EDIT`, no alert
  rules, log context or import) and hides Tools' telemetry dashboards (F44).
- **ShareDashboard**: `ironstone.insights.DashboardServices.get#ShareGroups` (the user's own groups, never `ALL_USERS`) and
  `share#Dashboard` (an author, the owner, one of their groups or private, the engine's version check;
  `INSIGHTS_AUTHOR_REQUIRED`, `SHARE_GROUP_UNAVAILABLE`, `DASHBOARD_REQUIRED`, `DASHBOARD_NOT_OWNED`), over Insights.js
  `shareGroups`, `shareDashboard`; `get#Context` adds `reportLinks` and the P2 `sharedLinks`.
- **Access** (`data/BossSetupData.xml`): `BOSS_INS_REPORT_ENGINE` denies `org\.moqui\.report\.ReportServices\..*` to
  `BOSS_INSIGHTS` and `BOSS_INSIGHTS_ADMIN` (the P1 review's ask: a new operation fails closed); `BOSS_INS_REPORT_READ`'s
  grants are ALWAYS and add `export#Definitions`; the per-operation denies of `_AUTHOR` and `_SCHEDULE` are gone (`_TOOLS`
  kept as it was); `BOSS_INS_AUTHORING` denies DashboardEditor and PanelDetail to the root user group and the
  administrator and gives the author and steward ALWAYS (F45); `BOSS_INS_LEGACY` names the copied builder's Datasets,
  DatasetDetail and DatasetView with Reports and ScheduledReports, and Insights.js reads the legacy capability from
  `ReportBuilder/Datasets` (F47). The rest are appends. No dataset artifact, `DASHBOARDS_APP` or Tools screen for any
  Insights group; P3 admits the datasets.
- **Specs.**
  - mr-moqui `tools/test/ReportMounts.spec.js` over the test mount `tools/test/screen/ReportMount.xml` (2 features: a
    mounted editor offers `otel_metrics` by its artifact alone, not `otel_logs`, starts a new panel on it, offers no
    import, saves and returns under the mount; a mounted dashboard's `appLinks` and its fixed variable over a forged one;
    Tools' Dashboard keeps Tools' links and Home's edit goes to Tools' editor). The browser case `a dashboard mounted under
    another app ...` in webroot `WebrootReport.page.js`; the moqui-tui test
    `a_mounted_dashboard_links_its_apps_screens_and_an_unreadable_panel_says_so`.
  - BOSS `InsightsDashboards` (3 features: Dashboard's one qvt render as the author, under the webroot so the links
    resolve: the organization fixed over a forged `var-organizationPartyId`, Insights' links and no Tools or alert-rule
    link, Share, the library panel's dataset refusal named; the mounted editor's copy and save return under Insights; the
    sharing rule, holder and non-holders). `InsightsAccess`: the reader's and the administrator's menus, the copied
    builder in place of the copied Dashboards, the reader reading a definition under the root (the pattern deny passed
    by the reading grant), DashboardEditor refused to the reader and the administrator and opened to the author.
  - The golden walk `test/client/Insights/InsightsDashboardsWalk` (registered in `test/client/suite.js`, its data
    `test/Insights/InsightsClientFixtures`, a server spec of the suite): the author opens a shared dashboard from Dashboards,
    saves a copy in DashboardEditor, adds a library panel, saves, opens the copy in Dashboard where the panel says not
    available; every URL under `/qapps/Insights` (F41 for why it is not Store operations).
  - Acceptance, written and not run: `acceptance/client/Insights/InsightsDashboardsUsable` (in `acceptance/client/suite.js`,
    with InsightsClientFixtures): the "usable when" (Store operations copied, edited, saved and shared; not available, never
    zero; Tools unchanged for ADMIN; a two-dashboard playlist plays). Its copy of Store operations passes once P3 admits
    the sales datasets (F41).
- **Tests run.** Cargo: `cargo test -p moqui-tui` (all pass, the new test among them), `cargo clippy -p moqui-tui
  --all-targets -D warnings` clean; no goldens changed. On the Debug binary (this worktree, `--nobuild`): InsightsAccess,
  InsightsDashboards (9 of 9), the tools specs (39 of 39), the walk (3.2 s). On the main checkout's release binary over this
  worktree's runtime (the screens and scripts are runtime files): the tools specs 39 of 39 (tools 2.5 s of 3 s);
  InsightsAccess, InsightsDashboards, AdminAccess, CommerceAccess, Chatter 58 of 58; ProjectsAccess 8 of 8 (no F37
  overflow on Debug either); webroot `WebrootReport` offline 49 of 49; the walk 3.0 s. `moqui lint --screens` (Debug): 132
  sites, as before; the Insights and Dashboards screens only in the information lists. Prettier clean on the new and
  changed BOSS JavaScript and ReportMounts. Not run: `./moq test-apps`, `./moq test-framework`, moqui-host's
  integration tests (monitor_edge, monitor_tui and report_documents read Tools' Dashboards pages, whose Tools links are
  unchanged: Panels' New panel link checked to render as before), the acceptance suite (AppStructure and TuiRender list
  the Insights menu as ADMIN; InsightsFoundationWalk reads `ids.legacyMenu`, now with the P2 entries).
- **Budget shares**: framework server (tools) ReportMounts 0.1 s (tools 2.5 s of 3 s); framework client (webroot) the new
  case under 0.01 s; mr-boss server InsightsDashboards 0.34 s and InsightsAccess +0.45 s (2.95 s, release); mr-boss client
  InsightsDashboardsWalk 3.0 s (release; 3.2 s Debug).
- Inventories: no ss-inventory or usl-inventory row is implemented by P2 (its usl rows naming Insights/Dashboard and
  PanelDetail are P4's measure sources).
- Design edits: §1.1 (every engine operation denied unless granted; the editors the authors' area), §2 (PanelDetail at
  `Insights/PanelDetail`), §4 Dashboard (the fixed organization variable, `reportLinks`; ShareDashboard's service and
  groups), §4 Panels (PanelDetail's route).
- Findings (provisional, for the lead to number): F39 to F47 in §6. Decisions: §4 rows of Nov 7 (P2).
- For the lead:
  - budget shares as above: framework 0.1 s server, about 0 s client; mr-boss 0.8 s server, 3.0 s client;
  - F42's framework ask (an owner shares a definition only with a group they belong to, in `save#Definition`) is in
    Remaining-Work's report-engine row; until then a crafted post to DashboardEditor/save can share with any group
    (definitions only, never data);
  - F41: the "usable when" acceptance test needs P3's admission of `mantle-sales-orders` before it can pass;
  - the editors' ALWAYS area passes every deny below it (F45): a transition added to DashboardEditor or PanelDetail runs
    any engine operation it calls for an author, so add only authoring transitions there;
  - Explore's trace, user, visit and log-context transitions are taken in but lead to Monitor and System, which refuse
    Insights users; they show only for telemetry fields, which no Insights group reads.

**Review Nov 7 (P2).** Checked the mr-moqui and BOSS diffs against this section, §2, §4, §6 (F3, F27, F32–F36, F39–F47),
design §1.1, §4, §5, impl-admin F34, AGENTS.md, the testing skill, Practices-App-Dev and Practices-Rust, with authz.rs's
`is_permitted` and the engine's `save`, `copy`, `restore` read, and probed as the reader, author, steward, distributor and
administrator (a throwaway spec, not kept):
- The pattern deny: every ReportServices operation (30, from ReportServices.xml) falls in `BOSS_INS_REPORT_ENGINE`; the
  reading ones are ALWAYS for every Insights group, saving for the author and steward, the schedule operations for the
  distributor alone (ALWAYS wins over the root group's deny at the same artifact; a service grant is not inheritable, so it
  opens nothing below it). As the reader, Dashboard's duplicatePanel, Wall display's createPlaylist, Explore's saveSearch
  and the editors' save are refused (the engine deny or the editors' deny); the author is refused `list#Schedules` and
  `create#Schedule` from any screen and directly. `/moqui/reports` (ALWAYS, inheritable) has only `run#Query`,
  `query#Documents` and `list#Datasets`, whose dataset checks are `authorize_own` (no ancestor counted). No reading
  operation a screen calls is left out; `run#ScheduledReport` stays `anonymous-all`.
- The editors (F45): DashboardEditor and PanelDetail take in save, copy, restore, delete, export, reference and
  dashboard, each an authoring or reading operation; an included screen's other transitions (import) are not reachable.
  Their inheritable ALWAYS still passed every deny below it, and save took any `definitionType` (an author could save a
  search, alert, contact point or silence definition, or copy a shipped alert, from DashboardEditor) (R3, R2).
- ShareDashboard (F42): a crafted post to `DashboardEditor/save` with `definitionUserGroupId=BOSS_ADMIN_ADMIN` stored
  that group (R1). `share#Dashboard` keeps to the user's groups, never `ALL_USERS`; `copy#Definition` keeps the source's
  group, one the author reads it through.
- BusinessContext: a forged organization is refused by `get#Context`; the page render keeps the fixed organization over
  `var-` and a carried value, and the terminal reads the same variable values (shown as a constant). The scope was set in
  `actions`, so the panel export and inspect transitions (the browser's and the terminal's) took the request's variables,
  and a user of no organization got an empty fixed list, which filters nothing (R2).
- Mounted screens and links: Insights users reach Tools, Monitor and System screens only through Explore's telemetry links,
  which those apps refuse; ADMIN's Tools Dashboards and Monitor keep Tools' links (the fallback). `appLinks` come from the
  server's `reportLinks`, but request parameters are context names in a render (render.rs), so under Tools, which sets no
  map, a JSON request with a `reportLinks` map sent `edit` (and `reference`, `dashboard`) to a path it chose (same host,
  `buildUrl` keeps the path) and into the dashboard's links (R4). WebrootReport.js and moqui-tui accept only a single-slash
  path. Framework code: `app_link`, `unavailable_notice` and the JS helpers are small and tested; no goldens changed.
- Fixes:
  - **R1** (medium, security; F42) Under a mount whose `reportLinks` has `share`, Definition.xml's save keeps the saved
    definition's group (read as the viewer) and never takes a posted one; ReportMounts and InsightsDashboards post a
    group and find it unchanged (mr-moqui d76c0b39, mr-boss 64a86fe0).
  - **R2** (medium, security) The mount's names are read by transitions only when set in `always-actions`: DashboardEditor
    and PanelDetail set `reportDefinitionTypes` there and Definition.xml's save and copy refuse another type
    ("This editor saves only …"); Insights › Dashboard computes the scope and `reportFixedVariables` there, Dashboard.xml's
    exportPanel and inspectPanel put the fixed variables over the ones sent and setVariable refuses a fixed one; a user of
    no organization is fixed to `_NA_` (no record) (mr-moqui d76c0b39, mr-boss 64a86fe0).
  - **R3** (medium, security; F45) `BOSS_INS_AUTHORING` is `inheritAuthz="N"` on the editors and names their
    transitions (`AT_XML_SCREEN_TRANS`, `(DashboardEditor|PanelDetail)\.xml/(save|copy|restore|delete|export|reference|
    dashboard)`): a transition not named is refused, and each engine operation under them is checked by its own grant
    (a probe transition calling `list#Schedules` as the author was refused by the engine deny; the editors render and
    save as before) (mr-boss 64a86fe0).
  - **R4** (low, security) Tools' Dashboards and Monitor roots set the four names to null in `always-actions`; ReportMounts
    sends a forged `reportLinks` to Tools' Dashboard and Home's edit; Monitoring.md says these names are set only by
    screens and how to grant an area that must not pass the engine's denies (mr-moqui d76c0b39).
- Tests run: each new check seen failing without its fix (ReportMounts against the old screens: the kept group, the inspect's
  fixed variable). Debug, `--nobuild`: ReportMounts 2 of 2 (0.06 s, 0.11 s), InsightsDashboards 3 of 3 (0.14, 0.21,
  0.29 s), InsightsAccess, AdminAccess. The main checkout's release binary over this worktree's runtime: InsightsAccess,
  InsightsDashboards, AdminAccess, ProjectsAccess 24 of 24 (mr-boss 10.2 s feature time); the tools specs 39 of 39 (tools
  2.5 s of 3 s); webroot WebrootReport 49 of 49; InsightsDashboardsWalk 2.8 s. `moqui lint --screens`: 132 sites, as before,
  none in the Insights or Dashboards screens. Prettier clean on the two changed specs. moqui-tui not touched (its cargo
  tests not rerun). Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- For the lead:
  - ProjectsAccess fails 4 of 8 on this worktree's Debug binary ("Maximum call stack size exceeded", as F37), with or
    without the review's changes; it passes on the release binary;
  - the fixed organization is not a boundary until P3's row filter: `/moqui/reports` runs any query over a readable
    dataset, a query's `ignoreVariables` opts out of a variable, and Wall display (Playlist) renders its dashboards without
    the scope;
  - a transition added to DashboardEditor or PanelDetail must be named in `BOSS_INS_AUTHORING` (refused until it is);
  - `restore#Definition` brings back an old version's group (the owner's earlier choice); the engine check of F42 stays
    the framework ask.

- **Wave 3 suites (Nov 7, on master after Admin P2 and Insights P2 merged and the release binary rebuilt; the Admin P3
  reviewer and the Insights P3 worker ran and built at the same time, load average about 7):** `./moq test-framework`:
  every feature passed; cargo failed only F38's known test (impl-admin); the framework's server specs (15.9 of 12 s),
  webroot's client (50.5 of 44 s) and basic-comms' client (7.2 of 7 s) over budget under the load (Wave 1 had the
  framework at 9.7 s; P2's ReportMounts adds 0.1 s), to be measured on a quiet run before any raise. Standalone mr-mantle
  1,902 passed, 2 failed (the baseline WorkTimeEntries and WorkTimesheets), 11 skipped. `mail_capture_sends=true ./moq
  test-apps` 3,331 server and 18 client features passed, none failed; mr-mantle 389.1 of 393 s, mr-boss 223.4 of 264 s
  server and 53.1 of 57 s client (InsightsDashboardsWalk 3.0 s), mr-pass within budget. `moqui lint --screens` 132 sites.
  No budget raised.

### P3 — Dataset admission

Design §5 Datasets, DatasetDetail, DatasetFields and DatasetView, its admission and scope policy; INS-03, INS-09 (the
index's freshness).

- **The framework's ReportServices**: `create#`, `store#`, `validate#`, `find#` and `index#BusinessDataset`,
  `store#BusinessDatasetFields` and `store#BusinessDatasetConditions`. Admission needs a registered DataFeed, a built
  index and a bound `rowFilterService`; `index#BusinessDataset` runs `index#DataFeedDocuments` for the dataset's feed
  and document only (F15), guarded by the dataset's update artifact (§4); the `rowFilterService` is called with the
  dataset's id and its `rowFilterParameters` beside `userId` (F5, §4), and applies to rows, suggestions, value counts,
  aggregates and exports alike.
- **Mantle**: `mantle.party.PartyServices.get#OrganizationRowFilter` (F11; the viewer's organizations as
  `get#PartyOrganizationInfo` computes them, the active one when set, on the dataset's organization field); the row
  filter on `mantle-sales-orders` and `mantle-sales-items`; a `mantle_inventory` dataset with its filter from the start;
  the invoice documents' grants, which none has (F9).
- **The BOSS datasets admitted** (owner contracts, F10): Customer Service's clocks and breaches (impl-customer-service
  F191, F212) and Commerce's checkouts, payment attempts and feed builds, each on its organization field (P0), their
  grants widened from `ADMIN` to the owners' report groups and the Insights groups.
- **Readiness:** each admitted dataset's freshness provider (index lag, last build) and its index refresh registered in
  Admin P2's registries, the refresh guarded by the dataset's own grant.
- **Screens**, replacing the copied builder (design §13.2, F20): Datasets (DatasetFind, DatasetList with admitted, needs
  review and unavailable views, CreateDataset over registered sources only); DatasetDetail (EditDataDocument,
  DatasetScope, DatasetIndex, DatasetValidation, DatasetUses); DatasetFields (FieldList, AddCondition, ConditionList
  through the guarded services; the raw entity transitions removed); DatasetView (DatasetOptions, DataViewList,
  ExportDocuments through the scoped export adapter and `audit#Export`).
- **Specs:** framework `BusinessDatasets` (an unregistered feed or an unbuilt index refused admission; one feed indexed;
  the row filter on rows, suggestions and export; a stale field change refused while a metric uses it); Mantle
  `test/party/OrganizationRowFilter` (two organizations, the active one, a child organization); BOSS `InsightsDatasets`
  (DatasetView's one qvt render; a reader of ORG_ZIZI_SERVICES sees only its own sales rows).
- **Usable when** (design §13.3 "Dataset admission", "Two organizations and confidential fields", its dataset half): the
  steward admits the sales datasets once their filter is bound, after Admit was refused for the unbuilt inventory
  index; the Sales dashboard shows `insights.reader` ORG_ZIZI_RETAIL's orders and the ORG_ZIZI_SERVICES reader only
  theirs; a rebuild shows its lag on the dataset; the CSV holds the same rows.

**Built Nov 7 (P3).** mr-moqui d8302df5, mr-mantle 816dc6fd, mr-boss 589b2240 (branch `ins/p3`).
- **The framework** (mr-moqui `crates/moqui-report/src/business.rs`, `docs/tools/Monitoring.md` "Business datasets"):
  - admission is a record, `moqui.report.BusinessDataset` (admitted, retired, steward, last build and count, last field change,
    version), and an engine rule: a dataset whose definition says `signal: "business"` is read only once admitted, except by its
    steward, who holds the dataset's update artifact (`ADMIN` all, through `REPORT_DATASETS_ADMIN`); a reader is refused "dataset …
    is not admitted" (F48);
  - `find#BusinessDatasets` (the datasets the viewer reads, and a steward's waiting ones, each with its checks and state: admitted,
    review, retired, unavailable), `validate#BusinessDataset`, `create#BusinessDataset` (a registered feed's document, a registered
    policy, owned by the steward, in review), `store#BusinessDataset` (title, time field, policy and parameters of a saved dataset,
    which return it to review; steward; admit, refused while a check fails; retire; `expectedVersion`), `index#BusinessDataset`
    (`index#DataFeedDocuments` for the dataset's feed and document only, F15, under the dataset's update artifact),
    `store#BusinessDatasetFields` (plain paths only; unique names; removing or renaming a field any definition over the dataset
    names refused with their names; a stale version refused; the index then stale until rebuilt) and
    `store#BusinessDatasetConditions` (a field of the document, an operator of the list, no post-query expression);
  - scope policies are `ReportScopePolicy` enumerations (`enumCode` the service, F50): the framework's `ReportUserGroups`
    (`get#UserGroupRowFilter`) and Mantle's `MantleOrganization`; a `rowFilterService` is called with the dataset's id and its
    `rowFilterParameters` beside `userId` (F5, §4), a registered policy without a grant of its own (F49). The filter is in the
    dataset's resolution, so rows, suggestions, value counts, aggregates, panel exports and playlists all carry it, and a fixed
    variable, `ignoreVariables` or a direct `/moqui/reports` query cannot widen an admitted dataset (the P2 review's three gaps).
- **Mantle** (816dc6fd): `PartyServices.get#OrganizationRowFilter` (F11; the viewer's organizations by
  `get#PartyOrganizationInfo`, the active one when set, every one or the active one for a system administrator, nothing for a
  viewer of none; another `userId` refused) on the field the dataset names; `mantle-sales-orders` and `mantle-sales-items` bound to
  it on `vendorPartyId` (the field the documents already carry, so no reindex, F55); `mantle-inventory` (MantleInventoryAsset,
  `ownerPartyId`, receivedDate) with its filter from the start; the sales invoice and inventory documents granted to `ADMIN` (F9);
  StoreCheckout's ProductStore alias and a `productStore` relationship on PortalPaymentAttempt (F30).
- **The BOSS datasets** (F10, F30): `organizationPartyId` added to BossStoreCheckout and BossStorePaymentAttempt (through
  `productStore`) and BossStoreFeedBuild (through `store`); the five datasets bound to the organization filter, with an
  organization lookup; admitted by setup (BossSetupData's BusinessDataset rows). Mantle's sales datasets and the inventory dataset
  wait for the steward (the "usable when").
- **Access** (`data/BossSetupData.xml`, appended but for BOSS_INS_LEGACY narrowed to Reports and ScheduledReports):
  `BOSS_INS_DATASETS` (the eight business datasets' artifacts and `org\.moqui\.report\.dataset\.insights-.*`: view for the reader,
  author, distributor and flow editor, all for the steward; the administrator none) and the documents' DataDocumentUserGroup rows
  for those groups; the owners' report groups (owner contracts): `BOSS_COM_DATASETS` and the store documents for Commerce's
  managers and administrators, `BOSS_CS_DATASETS` and the clock document for Customer Service's managers and administrators;
  `BOSS_INS_DATASET_READ` (`find#BusinessDatasets`, author and steward) and `BOSS_INS_DATASET_STEWARD` (the six steward operations),
  ALWAYS past BOSS_INS_REPORT_ENGINE; the screens' areas `BOSS_INS_DATASET_SCREENS` (Datasets, DatasetView: the author and
  steward) and `BOSS_INS_DATASET_STEWARDSHIP` (DatasetDetail, DatasetFields: the steward), each denying the root user group and the
  administrator, a non-inheritable ALWAYS with its transitions named, as BOSS_INS_AUTHORING.
- **Readiness** (F50, F53): a ReadinessProvider `insights.dataset.<id>` (instance scope, `INSIGHTS_VIEW`, every 1,440 minutes,
  fix path DatasetDetail) and a RefreshOperation `insights.dataset.<id>.index` (`INSIGHTS_DATASET_EDIT`, index source) per business
  dataset, over `ironstone.insights.DatasetServices.check#DatasetReadiness` (admitted and passing is ready, review a warning naming
  what fails; the watermark the last build; a dataset the viewer neither reads nor stewards refused, so omitted) and
  `refresh#DatasetIndex` (the dataset is the registration's source; `index#BusinessDataset` as the viewer, so the dataset's update
  artifact guards it). Registry.js's `request#Refresh` passes the registration's `refreshKey` to the owner's service (F52).
  `BOSS_INS_READINESS` grants `get#Readiness` and `request#Refresh` to the author, steward and administrator; the providers are
  instance-scoped, so no organization scope is needed for a user without the Admin root (F53).
- **Screens** (replacing the copied builder, F20; each over `ironstone.insights.DatasetServices` and `Datasets.js`):
  `ReportBuilder/Datasets` (DatasetFind, DatasetList with state chips and the admitted, needs review, unavailable and retired
  views, CreateDataset for the steward: a registered feed's document and a registered policy, named `insights-<name>`, F51);
  `ReportBuilder/DatasetDetail` (record header with Admit as the primary while in review, else Rebuild index; More: Fields and
  conditions, Preview rows, Retire; DatasetValidation, Index (feed, last build, lag), EditDataDocument and DatasetScope in one
  form, read only for a shipped dataset; DatasetUses); `ReportBuilder/DatasetFields` (FieldList, AddField, AddCondition,
  ConditionList through the guarded services); `ReportBuilder/DatasetView` (DatasetOptions, DataViewList of each row's title and
  fields, ExportDocuments through `export#Dataset`, the scoped export adapter: CSV or JSON to 10,000 rows, `audit#Export`). The
  copied FieldList and the raw DataDocument transitions are removed; Reports keeps its copy of the old ViewReport section until P4.
- **Specs.**
  - framework `BusinessDatasets` (5 features, 0.4 s: one feed's document indexed for its steward and refused to a reader;
    admission refused for an unregistered feed, an unbuilt index and an unbound filter and the reader refused before; the row
    filter on rows, a forged query, value counts and a panel's CSV; a field a panel uses not removed, a stale version and an
    expression path refused, the index then stale).
  - Mantle `test/party/OrganizationRowFilter` (4 features, 0.7 s: two organizations and a child, the active one alone, nothing for
    a user of none, everything for a system administrator, another user and an expression field refused).
  - BOSS `InsightsDatasets` (5 features, 0.6 s: admitted by the steward, not by a reader or author, unreadable before; the
    ORG_ZIZI_SERVICES reader reads only its own sales row and the Retail reader only Retail's, a forged filter and the value counts
    too; DatasetView's one qvt render as the author and the CSV of the same rows, the reader refused the export; readiness and the
    refresh through Admin's registries, the author refused). `InsightsAccess` follows the areas (the capabilities `datasets` and
    `stewardship`; Datasets refused to a reader, DatasetDetail to the author and the administrator, opened to the steward; the
    administrator's engine deny checked from the copied Reports); `InsightsDashboards`' unreadable panel now says not admitted.
  - Acceptance, written and not run: `acceptance/Insights/InsightsDatasetsUsable` (5 features, the "usable when");
    AppStructure, TuiRender and InsightsFoundationWalk updated to the new screens and parameters, not run.
- **Tests run** (Debug, `--nobuild`, this worktree): cargo `clippy -p moqui-report --all-targets -D warnings` clean, `cargo test -p
  moqui-report` 77 of 77, moqui-host `--test it report_` 9 of 9 (3 ignored); framework BusinessDatasets 5 of 5; tools 39 of 39 (tools
  8.5 s of 3 s on Debug, DataViews' "Edit DB View" 4.75 s, not P3's); Mantle OrganizationRowFilter and SalesReports 8 of 8,
  SalesReportStoreScope's setup fails on Debug with "Maximum call stack size exceeded" in an OrderHeader EECA (F37, F56); BOSS
  InsightsDatasets, InsightsAccess, InsightsDashboards, AdminRegistries, CommerceAccess, CustomerServiceAccess and CommerceReports
  54 of 54 (mr-boss 27.1 s feature time). The four screens rendered once by hand in qvt, tui and html with a create, a condition
  and a field posted (a throwaway spec, not kept). `moqui lint --screens`: 132 sites, as before, none in Insights. Prettier clean
  on the new and changed JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- **Budget shares**: framework server 0.4 s (BusinessDatasets); mr-mantle 0.7 s (OrganizationRowFilter); mr-boss server 0.6 s
  (InsightsDatasets) and InsightsAccess about the same (3.0 s), Debug.
- Inventories: ss-inventory's SimpleReport builder rows (EditReport, FieldList, FindReport, ViewReport) implemented in the dataset
  screens; QuickViewReport waits for P4. No usl-inventory row (the services are new).
- Design edits: design-insights §5 Datasets, DatasetDetail, DatasetFields, DatasetView (as built), §17 item 6 (field and use
  classes); design-commerce §1.4 and design-customer-service §1 (the datasets' scope and readers, owner contracts).
- Findings (provisional, for the lead to number): F48 to F57 in §6. Decisions: §4 rows of Nov 7 (P3).
- For the lead:
  - budget shares as above: framework 0.4 s, mr-mantle 0.7 s, mr-boss 0.6 s server; no client change;
  - Registry.js now passes `refreshKey` to a refresh owner's service (Admin's code, F52); Admin P3 appends to BossSetupData too,
    and P3's block is one append at the end;
  - InsightsDashboardsUsable (acceptance, P2) copies Store operations, which needs `mantle-sales-orders` admitted (F41): run it after
    InsightsDatasetsUsable, or admit the sales datasets on the instance first;
  - an existing instance must rebuild the three Commerce indexes for the new `organizationPartyId` (Rebuild index on each, or the
    feeds), and load ReportSetupData and MonitoringSalesSecurityData for the policy registry (Monitoring.md "Upgrading");
  - DatasetScope's permitted fields and uses and classification are not built (design §17 item 6); readers see every field of an
    admitted dataset's document, rows scoped;
  - never grant an Insights group `org.moqui.report.dataset.*` or a DataDocument-by-id or `index:` dataset artifact: those resolve
    without the admission rule and the row filter (F53).

**Review Nov 7 (P3).** A fresh review of mr-moqui d8302df5, mr-mantle 816dc6fd and mr-boss 589b2240/6e0c0ef6, weighted on the row
filter and admission.
- **Checked, holds:** every read (rows, suggestions, value counts, aggregates, panel CSV, playlists, alerts, Explore's query,
  `export#Dataset`, readiness) goes through `resolve_dataset`, so the admission check and the row filter apply to all; a query
  string or `ignoreVariables` is ANDed under the trusted predicate; a registered policy runs without the viewer's grant only by an
  `enumCode` of a `ReportScopePolicy` enumeration (ADMIN data), with `userId` the signed-in viewer and `rowFilterParameters` from the
  definition body only (each policy also refuses another `userId` and a non-name field); `get#OrganizationRowFilter`'s system
  administrator is `ADMIN` membership (ProductAccess.js `systemAdmin`), a viewer of no organization matches nothing, and children are
  `get#PartyInternalOrgIds`' direct ones; `index#BusinessDataset` checks the dataset's update artifact and indexes its one document of
  one feed; Registry.js's `refreshKey` is reserved from scope parameters and R1's organization check is unchanged (AdminRegistries
  passes); creation is over a document of a registered feed only, and a steward's dataset over any other document reaches no Insights
  reader, since no Insights group has its DataDocumentUserGroup row (only the eight documents'); BOSS rows are appended but for the
  BOSS_INS_LEGACY narrowing; the owners' report groups get their own datasets only; Mantle's seeds name no BOSS group; the copied
  builder and its raw entity transitions are gone; DatasetView's export is capped at 10,000 and audited; `moqui lint --screens` has no
  flagged Insights site; the specs' features are under 0.75 s each with one DatasetView qvt render.
- **Fixes:**
  - R1 (high, mr-moqui fd8e7830): F53 was convention only. A dataset that is not a business one (a DataDocument by id, an
    `index:` alias, or a saved definition without the signal, which a steward could save as `insights-raw` through `save#Definition`
    and every reader would read by the `insights-.*` pattern) over a document a business dataset reads now opens only to a holder of
    its update artifact (`business::check_governed`).
  - R2 (high, mr-moqui fd8e7830): `save#Definition` (and copy, restore, import, git pull) could change an admitted dataset's body,
    dropping its `rowFilterService` or swapping its document, and it stayed admitted. A changed body now returns it to review;
    deleting the definition deletes its admission (a later definition of the id started admitted); `create#BusinessDataset` starts in
    review whatever row the id had.
  - R3 (medium, mr-moqui fd8e7830): an admitted dataset was read whatever its definition later said (a shipped definition changes
    with a component update). Reading needs a registered policy still bound; a business body naming `indexName` or `serviceName` (which
    read past the admitted document, the service unfiltered) is refused; `signal: "business"` alone makes a dataset business, so a body
    without `documentType` cannot skip admission.
  - R4 (medium, mr-moqui fd8e7830): `store#BusinessDatasetFields` checked only secret names, so an encrypted entity field
    (`AgentRemoteA2a.authJson`, a card number) could be added and indexed decrypted. The document is refused while it holds an
    encrypted field (the change rolls back, the cached definition is dropped); removing or renaming a field that a business dataset
    over the same document names (its row filter's field, its time field) is refused as a definition's use is.
  - R5 (medium, mr-mantle 560e153f): `get#OrganizationRowFilter` took `get#PartyOrganizationInfo`'s active organization, which a
    finance administrator (`ACCOUNTING_ADMIN`) may set to any internal organization, so they read that organization's dataset rows. The
    active organization counts only when it is one of the viewer's own, or for a system administrator.
  - docs/tools/Monitoring.md "Business datasets" and BossSetupData's F53 comment follow (mr-boss, this commit).
- **Tests** (Debug, `--nobuild`, after the fixes): framework BusinessDatasets 6 of 6 (a new feature: the document by id, its index and
  a copy without the signal refused to a reader, a definition saved without its filter back in review, an encrypted field refused;
  and the row filter's field kept), 0.5 s; Mantle OrganizationRowFilter (a new feature: the finance administrator's selection, failing
  before R5) and SalesReports 9 of 9, 1.0 s; SalesReportStoreScope's setup still fails with "Maximum call stack size exceeded"
  (F37, F56); BOSS InsightsDatasets, InsightsAccess, InsightsDashboards, AdminRegistries, CommerceAccess and CustomerServiceAccess
  55 of 55; tools 39 of 39 (6.5 s of 3 s on Debug, as before); cargo `clippy -p moqui-report --all-targets -D warnings` clean, `test
  -p moqui-report` 77 of 77, moqui-host `--test it report_` 9 of 9; `moqui lint --screens` 132 sites, none in Insights; Prettier clean.
  Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- **For the lead:**
  - BossSetupData conflicts with master (Admin P3's block and P3's both append at the end): keep both;
  - the grant warning (F53) is now a rule: a view grant on a raw document or `index:` dataset of a business document is refused,
    but an update grant reads it unfiltered, so keep `org.moqui.report.dataset.*` update `ADMIN`'s alone;
  - a steward's field changes edit the shared DataDocument (a field added to `insights-x` over MantleSalesOrderPart shows in
    `mantle-sales-orders` after a rebuild, without review) and may add any plain non-secret, non-encrypted path through relationships
    (a customer's birth date): until design §17 item 6's field classes, the steward role is the guard; consider returning the datasets
    over a document to review on a field change;
  - `store#BusinessDataset`'s `stewardUserId` is a label, not checked against a user or a grant.

- **Wave 4 suites (Nov 7, on master after Admin P3 and Insights P3 merged and the release binary rebuilt; the Admin P4
  reviewer and the Insights P4 worker ran at the same time):** `./moq test-framework`: every spec feature passed; cargo
  failed F38's known test and `loader_filters_types_holds_services_and_reads_zip` (the EntityAuditLog sequence on the
  test's empty driver, from Admin P3's audit log on UserGroupPermission); framework 10.7 of 12 s, webroot's client 46.4 of
  44 s under the load. Standalone mr-mantle 1,906 passed, 3 failed: the baseline two and SitePages' scheduled publication
  (`update#UserGroupPermission` with `fromDate: 0` on Postgres, the same audit log's read of the epoch key); a framework
  follow-up fixes both. `mail_capture_sends=true ./moq test-apps` 3,341 server features passed, 2 failed: SitePages as
  above and ProjectsAccess (Insights P3's `refresh#DatasetIndex` verb not in the client deny pattern; `refresh` added,
  mr-boss 7fc702b6); 18 client features passed. mr-mantle 407.6 of 393 s and mr-boss 261.6 of 264 s server under the two
  agents' load (Wave 2: 344.5 and 197.3 s), mr-boss client 52.3 of 57 s; measured on a quiet run before any raise.
  `moqui lint --screens` 132 sites.

### P4 — Report catalog and metrics

Design §6.1, Reports and SavedReports, §6.2 for the built owners, §4 MeasureMeaning and PanelDetail's measure and
target; INS-02, INS-05.

- **`ironstone.insights.ReportCatalogEntry`** (design §6.1's fields) seeded by each owner (§4): whether a viewer may
  read an entry is its owner's catalogue service where one exists (Customer Service's and Commerce's
  `get#ReportCatalogue`; Accounting's `get#Catalog`, adapted by its registration, F17), and otherwise the route's own
  screen authorization.
- **The entries** (owner contracts): Customer Service's six and Commerce's four; Accounting's statements, aging, partner
  ledger, reconciliation, trial balance, general ledger, posted summary, budget variance, stock transactions and
  inventory valuation (Warehouse mounts it, crosscut §3.25); Warehouse's stock at date, operations history and count
  variance; Manufacturing's reports with OEE (impl-manufacturing F143); Projects' portfolio, profitability, progress,
  sprints, time, utilization and work items; Products' and Purchasing's from P0. SalesAnalysis is one entry owned by
  Sales, opening Accounting's built report until Sales is built (F18, §4).
- **Metric registrations:** a versioned business descriptor on admitted dataset and panel definitions and on the
  registered domain report services (design §6.1): orders (Sales, over Mantle's `SalesReportServices` and the admitted
  sales datasets, recurring base orders excluded; §4; Commerce reads it cut by `productStoreIds`, never redefined per
  store, design §6.2), invoiced revenue (Accounting), Customer Service's backlog and service levels, Warehouse's on hand
  and stock at date, Manufacturing's OEE, Projects' utilization.
- **`ironstone.insights.RegistryServices`** `find#Reports`, `get#Metric`, `get#ReportOptions` (the entry's own options
  service; no report run on a catalog read), `store#ReportPins` (the `InsightsHome` UserPreference) and
  `find#SavedReports` (Definitions and FormListFinds apart).
- **Screens:** Reports (ReportFind, ReportCatalog, ReportContext); SavedReports (SavedFind, SavedReportList, SaveAs),
  replacing the legacy saved-report picker (design §13.2); Dashboard's MeasureMeaning; PanelDetail's BusinessMeasure,
  Target (design §4's typed input, a missing target or zero denominator unavailable) and Dependencies; the palette's
  dashboards and saved reports.
- **Specs:** BOSS `InsightsCatalog` (a reader sees only the entries their owner grants; SalesAnalysis has one entry;
  a pin edits a preference only; `get#Metric` answers basis, grain and denominator; a mixed-currency target refused).
- **Usable when** (design §13.3 "Single report owner", "Same metric on many surfaces", its dashboard half): a Customer
  Service manager finds and pins Service level compliance and opens it in Customer Service; a warehouse reader finds
  Stock at date and not the Accounting statements; the orders panel's meaning shows its basis and that bases are
  excluded, and agrees with Commerce's OnlineSales for the same store and period.

**Built Nov 7 (P4).** mr-boss c7a56dd2 (branch `ins/p4`), BOSS only.
- **Records** (§4; `entity/AdminEntities.xml`, the registry entity file Admin P2 made, its Insights block at the end):
  `ironstone.insights.ReportCatalogEntry` (entry id, version, owner, title, description, purpose, basis, route, definition,
  parameter contract, source, metrics, the owner's catalogue service and its key, options service, export formats, schedule
  adapter, readiness provider) and `ironstone.insights.MetricRegistration` (metric id, version, owner, service, datasets, catalog
  entry, grain, record key, date and status basis, aggregation, numerator, denominator, unit policy, additive and non-additive
  dimensions, allowed dimensions, filters, exclusions, drill, scope, freshness, an optional permission). A panel names its
  measure in its body (`business: {metricId, metricVersion, target}`); a dataset body may carry its own descriptor (F59).
- **The entries** (BossSetupData, an owner block each; 53): Customer Service's six through its `get#ReportCatalogue`, Commerce's
  four through its own, Accounting's statements (balance sheet, income, cash flow, retained earnings, ratios), aging, partner
  ledger, reconciliation, trial balance, general ledger, posted amounts, budget variance and stock transactions through
  `get#Catalog` by `reportId` (F17, F60) and inventory valuation by its route; `Sales.SalesAnalysis`, one entry, Sales', opening
  `Accounting/Reports/SalesAnalysis` and read through Accounting's catalogue (F18); Warehouse's stock at date, operations history and
  count variance; Manufacturing's eight with operation performance (OEE); Projects' seven; Products' catalog checks, price history,
  cost history and cost roll-up; Purchasing's scorecards, spend, commitments, procurement tracker, purchase history and supplier
  statement (F29); the last five owners by their routes' screen authorization.
- **The metrics** (8): `Sales.Orders` over `SalesReportServices.get#SalesOrderSummary` and the sales datasets (placed orders, open,
  proposed and recurring base orders excluded, native currency, store cuts by `productStoreIds`), `Accounting.InvoicedRevenue`
  (`get#SalesInvoiceSummary`), `CustomerService.Backlog` (snapshot) and `.ServiceLevelCompliance` (ratio), `Warehouse.OnHand` and
  `.StockAtDate` (snapshots), `Manufacturing.Oee` and `Projects.Utilization` (ratios). The comparison rules of §2 are their unit,
  aggregation and exclusion fields, which `get#Metric` states as sentences.
- **`ironstone.insights.RegistryServices`** over `Registry.js`: `find#Reports` (each owner's catalogue once per call as the viewer,
  in its own transaction; a refusal hides its entries, any other failure names the owner as unavailable; else Admin.js
  `destinationOpens` on the route with the viewer's own grants; pinned first, then purpose and the owners' order; no report runs),
  `store#ReportPins` (the `InsightsHome` preference `{organizationPartyId, dashboardDefinitionId, orderedPanelIds, pinnedReportIds,
  revision}`; only an entry the user reads; `PINS_CHANGED` on a stale revision), `get#ReportOptions` (the contract's typed fields: the
  organization from `get#Context`, a default range, the organization's fiscal periods; the owner's options service when registered),
  `get#ReportLink` (the owner route with the contract's parameters only), `get#Metric` (by id or by panel, a dashboard's panel placed
  by reference read through its library panel; version change; the target comparison: a missing or zero target unavailable, gap and
  ratio in decimals), `find#Metrics`, `find#PanelMeasures` (MeasureMeaning), `store#PanelMeasure` and `store#PanelTarget` (design §4's
  typed input; a money target names one currency and the panel must be filtered to it, F62), `find#SavedReports` (definitions,
  saved finds and pins apart) and `copy#SavedReport` (SaveAs through `save#Definition` as the author, private or an own group).
  `ContextServices.search#Records` is the palette's dashboards and saved reports. Insights.js exports `grants` and lists Reports and
  SavedReports among the shared links; its legacy area reads ScheduledReports.
- **Screens.** `Reports` replaces the copied legacy picker (F20; the copied ViewReport section with it): ReportFind, ReportCatalog
  (Open to the owner route, Options, Pin/Unpin), ReportContext (a section opened by Options, Open through `openReport`), the
  unavailable owners named; `SavedReports` (SavedFind, SavedReportList, SaveAs dialog for an author, Unpin); Dashboard's
  MeasureMeaning (a Meaning dialog of the measured panels); PanelDetail's BusinessMeasure, Target and Dependencies above the
  framework editor, its `storeMeasure` and `storeTarget` named in BOSS_INS_AUTHORING (an appended artifact row); the root's palette
  source. Menu: Home, Dashboards, Library panels, Wall display, Report builder, Reports, Saved reports (then Scheduled reports for the
  administrator and ADMIN).
- **Access.** BOSS_INS_LEGACY narrowed to ScheduledReports (F65); everything else appended. No new grant: RegistryServices is in
  the root's `ironstone\.insights\..*` pattern, the owners' catalogue services check their own app, and PanelDetail's two
  transitions are the authors'.
- **Commerce's Store operations dashboard** (owner contract): its orders panel names `Sales.Orders` and excludes recurring base
  orders by a negated filter (F61).
- **Demo** (BossUsersDemoData, appended): `insights.servicemanager` (an Insights reader and Customer Service manager) and
  `insights.warehouse` (an Insights reader and Warehouse user), for the catalog's "usable when".
- **Specs.** BOSS `InsightsCatalog` (5 features, 0.66 s, each under 0.2 s: the reader, the service manager, the warehouse reader and
  the financial reader see only their owners' entries, SalesAnalysis one entry, Sales'; a pin edits the preference only, a stale
  revision and an unreadable entry refused, Reports' one qvt render; `get#Metric`'s basis, grain, denominator and rules by id and by
  the Store operations panel; a target refused for mixed currencies, both kinds' values, another basis and a reader (also through
  PanelDetail's transition), a missing and a zero target unavailable, PanelDetail's one qvt render; SaveAs private and shared, another
  group and a reader refused, SavedReports' one qvt render). `InsightsDashboards`' Dashboard render checks MeasureMeaning (its spec
  panel names `Sales.Orders`); `InsightsAccess` follows the menu (Reports and Saved reports for every user) and the legacy area
  (ScheduledReports). Acceptance, written and not run: `acceptance/Insights/InsightsCatalogUsable` (3 features, `dependsOn`
  InsightsDatasetsUsable: the service manager finds, pins and opens Service level compliance in Customer Service; the warehouse
  reader finds Stock at date and not the statements, SalesAnalysis once; the orders panel's meaning, and its count of a store's
  month agreeing with OnlineSales).
- **Tests run** (the shared release binary, `--nobuild`, this worktree's runtime): InsightsCatalog, InsightsAccess,
  InsightsDashboards, InsightsDatasets, AdminRegistries, CommerceReports and CustomerServiceReports 29 of 29 (mr-boss 7.6 s feature
  time); CustomerServiceAccess passed beside them. `moqui lint --screens`: 132 sites, as before, none in the Insights screens.
  Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite (AppStructure and TuiRender find
  Reports and SavedReports by their files; InsightsFoundationWalk reads the new menus from the spec lib).
- **Budget share**: mr-boss server InsightsCatalog 0.66 s; no client change.
- Inventories: ss-inventory's QuickViewReport row implemented by Reports and SavedReports; usl-inventory notes that the registered
  report services are registrations, not calls (Implemented in unchanged).
- Design edits: design-insights §1.2 (palette), §4 Dashboard (MeasureMeaning), §4 PanelDetail (as built, the one-currency rule),
  §6.1 (the records and where descriptors live), §6 Reports and SavedReports (as built); the owners' registration lines:
  design-customer-service §7, design-commerce §3, design-accounting §13, design-warehouse §14, design-manufacturing §9,
  design-projects §11, design-products §1.3, design-purchasing §11.
- Findings (provisional, for the lead to number): F59 to F65 in §6. Decisions: §4 rows of Nov 7 (P4).
- For the lead:
  - the budget: mr-boss's share is InsightsCatalog's 0.66 s server;
  - ~~an existing instance must delete BOSS_INS_LEGACY's earlier pattern rows~~ (review R2: the seed reloads them as plain names, F65);
  - Mantle's `mantle-sales` dashboard counts orders without excluding recurring base orders (F61): a Mantle fix;
  - BossSetupData's P4 block is one append at the end, and AdminEntities.xml's Insights block too (its header comment names it);
  - the catalog's readiness (`readinessProviderKey`) and schedule (`scheduleAdapter`) fields are unused until P10 and P7.

**Review Nov 7 (P4).** Fresh review of mr-boss c7a56dd2..9b074415; fixes 1ebf36ac, cf178a69, 876a0d6d (branch `ins/p4`).
- Checked and kept: an entry is read only through its owner's catalogue as the viewer or its route's screen authorization
  (a probe: `catalog.reader` does not see Products' cost history or cost roll-up, `catalog.cost.read` does; a Projects team member
  does not see Profitability or Utilization), so no restricted report's name reaches someone who cannot open it; F63's wider
  routes (CountVariance, Manufacturing's cost reports) only name reports the user can open, accepted. No report runs on a catalog
  read; `get#ReportOptions` calls only the entry's own options service; `get#ReportLink` builds the seeded route with the
  contract's parameters, URL-encoded, so no arbitrary route. `store#ReportPins` writes only the caller's `InsightsHome`.
  `find#SavedReports` lists the engine's definitions as the viewer and the saved finds of the viewer and their groups. SaveAs keeps
  F42: `copy#SavedReport` takes only one of the user's own groups (never `ALL_USERS`), the same set as `share#Dashboard` and the
  dialog's choices, so it does not bypass P2's R1. `store#PanelMeasure`/`store#PanelTarget` need authoring and the panel's owner;
  the transitions are named in BOSS_INS_AUTHORING. Mixed currency refused, missing or zero target unavailable, ratio, snapshot and
  base-order rules stated by `get#Metric` with basis, grain, denominator and version. No MCP or Assist exposure (every service
  `allow-remote="false"`). The two records are configuration rows with no organization, and pins are a user preference, so the
  Nov 7 view-entity pattern (impl-admin §4) does not apply.
- Fixes:
  - **R1** (medium, meaning) `Sales.Orders` was a count with a currency unit policy, so a target on Store operations' orders panel
    (a count) needed a currency and a panel filtered to one. `Sales.Orders` is now a count (no currency) and `Sales.OrderValue`
    the value in each order's currency (Commerce's OnlineSales names both); the spec's money target uses the value and checks a
    count target without a currency (1ebf36ac). Nine metrics.
  - **R2** (medium, access) F65: the seed reloads BOSS_INS_LEGACY's P1, P2 and P3 pattern rows with `nameIsPattern="N"`; no
    screen location equals those names, so an existing instance no longer denies Reports (or, from P1's row, Dashboards and
    ReportBuilder) and needs no manual delete (cf178a69).
  - **R3** (low, efficiency) MeasureMeaning described each panel's registration instead of reading the dashboard again per panel
    through `get#Metric` (876a0d6d).
- Recorded: F61's Mantle fix covers the `mantle-sales` dashboard's items panels as well as its orders panel (both over datasets
  that keep recurring base orders); Mantle adds the negated `orderPurposeEnumId` filter to each, as Commerce's panel has.
  ProjectsAccess's one failure (`DatasetServices.refresh#DatasetIndex` outside the client deny pattern) is P3's and already fixed
  on master (`refresh` in the verb rows); it passes after the merge.
- Tests run (shared release binary, `--nobuild`, this worktree's runtime): InsightsCatalog (0.66 s → 1.03 s, each feature under
  0.4 s), InsightsAccess, InsightsDashboards, InsightsDatasets, AdminRegistries, CommerceReports, CustomerServiceReports,
  CustomerServiceAccess, ProjectsAccess: 58 of 59 (the failure above). `moqui lint --screens`: nothing in the Insights screens.
  Prettier clean. Acceptance not run (unchanged).

- **Wave 5 suites (Nov 7, on master after Admin P4, Insights P4, the audit fix (F79) and Mantle's F61 merged and the
  release binary rebuilt; Admin P5's and the P4 follow-up's reviewers and the Insights P5 worker ran at the same time):**
  `./moq test-framework`: every spec feature passed; cargo failed F38's known test and
  `chat_tests::an_agent_member_gets_each_message_through_its_entry_point` (passed in Wave 4; under investigation in the
  adm/fw1 follow-up); webroot's client 45.9 of 44 s under the load. Standalone mr-mantle: the baseline two and
  WorkPlanToCashBasicFlow (10 features: its expected audit rows meet P4's audited `requirePasswordChange`, F67), fixed in
  adm/fw1. `mail_capture_sends=true ./moq test-apps` 3,348 server features passed, 10 failed (WorkPlanToCashBasicFlow
  only); the client run's mr-marble BrowserSmoke server did not start behind that failure, 16 client features passed.
  mr-mantle 428.2 of 393 s, mr-boss 250.0 of 264 s server and 58.5 of 57 s client (AdminUsersWalk 3.1 s added) under the
  load; the budgets are measured on a quiet run at gate 1 before any raise. `moqui lint --screens` 132 sites.

### P5 — Home and attention

Design §3 Home; INS-01, INS-02 (attention providers), INS-09, INS-10. Insights' last phase of stage 1, which ends
with Admin P7 (gate 1).

- **Attention providers** (BOSS seed `ironstone.insights.AttentionProvider`, §4: key, owner, count service running the
  worklist's own query, route with its filter, organization scope), registered by the built apps (owner contracts,
  P0 names them), and Monitor's Business operations dashboard (F19) as a source: failed or rolled-back operations,
  opening Monitor's Operations under Monitor's own grants.
- **RegistryServices** `get#Home` and `get#Attention` (each provider as the viewer; an unreadable one omitted; a failure
  on its own card; no summed total of work).
- **The suite dashboard** `report/insights-suite.json`: a few library panels over the admitted sources (orders and
  invoiced revenue by currency, the service backlog, store checkouts), shipped read only.
- **Screens:** Home (HomeContext, FavoritesAndRecents, ManagementPanels, Attention, PinnedReports; DigestPreview in P7)
  with the `InsightsHome` preference and the first-use state.
- **Specs:** BOSS `InsightsHome` (Home's one qvt render; a failing provider affects its card only; an unreadable one
  omitted).
- **Usable when** (`acceptance/Insights/InsightsHomeUsable`; rewritten in the P5 review to what is registrable, F-P5-3):
  `insights.reader` opens Home and sees ORG_ZIZI_RETAIL's orders and order value by currency (invoiced revenue waits for
  an admitted invoice dataset, F-P5-2) and no count from an app they cannot read; a Warehouse user with a selected
  facility sees the receipts waiting there, late ones as overdue, as a count equal to the receipts list's own that opens
  that list on that facility; every administrator card opens its owner's worklist with its filter; a failed provider
  names itself while the others show. Purchase approvals, put-away and past-due cases join when their owners count them
  by their lists' query (F29).

**Built Nov 7 (P5).** mr-boss, branch `ins/p5`, BOSS only.
- **The record** (§4; `entity/AdminEntities.xml`, appended after P4's): `ironstone.insights.AttentionProvider` holds:
  - the provider key, version, owner and label;
  - the owner's count service, its fixed parameters (JSON) and the count's path in the answer: `a.b`, `rows[key=value].field`,
    and paths joined by `+`, which are added;
  - an overdue path;
  - the organization parameter the provider honors, or the scope it keeps;
  - the worklist's route and filter, and an optional permission.

  These are configuration rows with no organization, so the Nov 7 view-entity pattern (impl-admin §4) does not apply.
- **The providers** (BossSetupData, the P5 block at the end; owner contracts): 27 in all.
  - The F29 cards whose count is their list's own query, 26 in all:
    - Commerce's To approve, Payment holds, Placements waiting and Open carts (`get#StoreWorkSummary`), and Integration errors
      (`get#ChannelHealth`, `COMMERCE_CHANNEL_OPERATE`);
    - Accounting's draft and posted entries (`find#Records`), bills awaiting approval (`INVOICE_APPROVE`) and on hold
      (`find#Payables`), and the cost close queue, each the list's own find for the organization in scope;
    - Products' Active SKUs, Variants and Ending in 30 days;
    - Purchasing's Draft orders, Approved not sent, Unacknowledged, Late receipts, Held bills and Quotes expiring;
    - Manufacturing's Open, In progress and Late;
    - Projects' Reviews waiting, Approve time and Allocation requests;
    - Warehouse's Receiving, with its late receipts as the overdue part.
  - `Monitor.OperationFailures`, Monitor's Business operations dashboard (F19), through `get#OperationFailures`.
  - Left out: Purchasing's Approvals waiting, Projects' Unbilled, Commerce's To fulfill and Unpaid, and Customer Service's
    queue cards (F29, F-P5-3).
- **`RegistryServices`** (Registry.js):
  - `get#Attention`:
    - A provider shows only when its route opens to the viewer (Admin.js `destinationOpens`) and they hold its permission.
    - Its count service is called as the viewer in its own transaction and error frame, once per distinct call per board, so
      Purchasing's six cards make one call.
    - An owner's refusal (the catalog's refusal codes) or a null count leaves the provider out.
    - Any other error, or a missing count field, is a failed card naming its owner; the others go on.
    - Cards are grouped by owner, with no total. Each opens its route with the filter, plus the organization for a provider
      that honors it, and says the scope it keeps.
    - An `ownerApp` filter is available.
  - `get#OperationFailures` runs the shipped `monitor-operations` dashboard's "Rollbacks and retries" query, read as the viewer,
    over the last day. An error notice from the engine is a refusal (`OPERATIONS_UNAVAILABLE`, not authorized) or a failure,
    never a zero (F-P5-5).
  - `get#Home` returns:
    - the scope, from `get#Context` (a saved organization no longer the user's falls back);
    - the dashboard variables that keep the panels to that scope;
    - starred and recent dashboards the user reads (REPORT_STARRED, REPORT_RECENT);
    - the chosen dashboard, else `insights-suite`, with at most six panels in the saved order;
    - the dashboards and panels to arrange;
    - the pinned reports, with only the pinned entries checked;
    - `firstUse`.
  - `store#HomeLayout` saves the organization, the dashboard and at most six of its panels in `InsightsHome`, keeping the pins.
    It refuses `HOME_CHANGED`, `ORGANIZATION_UNAVAILABLE`, `DASHBOARD_UNAVAILABLE`, `DASHBOARD_REQUIRED`, `PANEL_UNAVAILABLE` and
    `HOME_PANELS_LIMIT`.
- **The suite dashboard** (`report/insights-suite.json`, "Suite overview", read only as shipped): four library panels placed by
  `panelRef`, each its own file (the framework ships one definition per file):
  - `insights-suite-orders`: orders by currency, `Sales.Orders`, recurring base orders excluded;
  - `insights-suite-order-value`: the sum of part totals by currency, `Sales.OrderValue`;
  - `insights-suite-service-backlog`: open resolution clocks by organization, `CustomerService.Backlog`, panel time now-5y;
  - `insights-suite-checkouts`: checkouts by state.

  The dashboard's hidden `organizationPartyId` and `vendorPartyId` variables keep the panels to the organization in scope; the
  sales queries ignore the first and the others the second. Invoiced revenue has no admitted dataset (F-P5-2).
- **Screen.** Home replaces P1's frame:
  - a header with Open a dashboard (primary), New dashboard for authors, and Arrange (a dialog over `store#HomeLayout`);
  - HomeContext: organization and period;
  - the first-use box;
  - Attention: per owner, number cards linking each worklist, the scope it keeps, failures named;
  - ManagementPanels: a `report-embed` per panel, as the viewer, in the scope and period;
  - FavoritesAndRecents and PinnedReports, with phone columns.

  The root's header comment was updated.
- **Specs.** BOSS `InsightsHome`, 4 features, 0.6 to 0.8 s, each under 0.4 s:
  - Home's one qvt render: the reader's scope, first use, the suite panels, the spec's failed provider named on its card beside
    the one that answers, and the refusing and unreadable ones absent. No owner card for a reader of no app.
  - `get#Attention` with the spec's providers:
    - a failing call and a missing count field are each their own failed card;
    - a refusing owner and an unopened route are left out;
    - a permission's holder sees its card and a non-holder does not;
    - no total;
    - the organization is passed to the route;
    - another organization is refused.
  - The registered providers are exactly the F29 set plus Monitor, each naming an existing service and an owner screen. A
    Warehouse user with a selected facility sees Receiving and nothing else. Monitor's count is answered to ADMIN and refused
    to a reader.
  - The arrangement: suite panels in layout order, the stored order, first use ended, and the five refusals.

  `InsightsAccess` lost its Home feature, because Home's one render is now InsightsHome's.

  Acceptance, written and not run: `acceptance/Insights/InsightsHomeUsable`, 4 features, `dependsOn` InsightsDatasetsUsable:
  - the reader sees Retail's orders and order value by currency and no app's counts;
  - the Warehouse user's Receiving equals the receipts list's own count and opens it;
  - every administrator card opens its worklist;
  - a broken provider names itself while the panels show.
- **Tests run** (the shared release binary, `--nobuild`, this worktree's runtime): InsightsHome, InsightsAccess,
  InsightsCatalog, InsightsDashboards, InsightsDatasets and ProjectsAccess, 30 of 30 (mr-boss 10.2 s feature time;
  ProjectsAccess's write-verb rule kept by naming the Monitor count a `get#`). A probe as ADMIN (all 26 owner providers but
  Warehouse's, which has no selected facility) answered every card in 0.8 s, each URL its owner's list. `moqui lint --screens`:
  132 sites, as before, none in the Insights screens. Prettier clean. Not run: `./moq test-apps`, the acceptance suite.
- **Budget share**: mr-boss server, InsightsHome's 0.8 s; no client change.
- Inventories: no ss-inventory or usl-inventory row maps to Home (unchanged).
- Design edits:
  - design-insights §3 Home (as built);
  - the owners' attention lines: design-commerce §3, design-accounting §13, design-products §1.3, design-purchasing §11,
    design-manufacturing §9, design-projects §11, design-warehouse §14.
- Findings (provisional): F-P5-1 to F-P5-6 in §6. Decisions: the §4 rows of Nov 7 (P5).
- For the lead:
  - the budget: mr-boss's share is InsightsHome's 0.8 s server;
  - the owners' Home summaries used as count services are heavy (F-P5-1); light per-card count services are the owners' fixes;
  - the usable-when's purchase approvals, put-away and past-due cases are not registered (F-P5-3);
  - BossSetupData's P5 block and AdminEntities.xml's entity are single appends at the end;
  - DigestPreview is P7's.

**Review Nov 7 (P5).** Fresh review of mr-boss 5afb001d; fixes caa3c006, b21e6792 and this note (branch `ins/p5`).
- Checked and kept: every count service is called as the viewer (`ownerCall`, no `disableAuthz`, its own transaction and
  error frame); a provider shows only when its route opens (`destinationOpens`) and its permission holds; no total; a request
  steers only `organizationPartyId`, checked by `get#Context`, while `countParameters`, the route and the filter are the seed's.
  `get#OperationFailures` reads the shipped `monitor-operations` definition and runs its query as the viewer, an engine error
  notice being a refusal or a failure, never a zero (F-P5-5); the provider opens only where `monitor/Operations` opens, so no
  telemetry reaches a non-Monitor user. `get#Home` reads every definition as the viewer; the panels' variables come from
  `get#Home` on the server (`report-embed` takes no request value), and the datasets' row filters apply under them.
  `store#HomeLayout` writes only the caller's `InsightsHome`, with the revision check, refusing another organization. The suite
  is read only, its panels over admitted datasets, the orders panel without recurring base orders. Home is rendered once in
  the regression suite (InsightsHome). The owners' scopes (F-P5-4) were read service by service: each counts the viewer's own
  organizations, stores, plants, facilities or projects and no parameter widens them.
- Fixes:
  - **R1** (medium, F29) Manufacturing's counts are of the selected plant and Warehouse's Receiving of the selected facility,
    but their lists open across every plant or facility. A filter value `{path}` now comes from the owner's answer
    (`facilityId={plantId}`, `facilityId={facilityId}`), left out when it has none; Manufacturing's cards open WorkOrders › Find
    (caa3c006).
  - **R2** (medium, refusal and failure) Payables' `ORGANIZATION_REQUIRED` (no organization chosen or active) and the
    framework's "is not authorized for" were failed cards; they are refusals and leave the card out (caa3c006).
  - **R3** (low, scope text) with no plant Manufacturing counts every plant of the user's organizations and Products counts the
    shared catalog too; the cards say so (caa3c006).
  - **R4** (low, F-P5-6) Insights' Dashboard fixes `vendorPartyId` with `organizationPartyId` when the dashboard declares it over
    Mantle's sales datasets; Home sets it only for such a dashboard, never for an arranged dashboard's supplier variable
    (b21e6792).
  - F-P5-3: the usable-when is rewritten above to what is registrable, as InsightsHomeUsable checks it.
- Recorded: F-P5-7 (Manufacturing's own Home cards), F-P5-8 (the refusal pattern is wide); F-P5-4 corrected (Manufacturing
  without a plant counts every plant, it is not left out); F-P5-6 done.
- Tests run (shared release binary, `--nobuild`, this worktree's runtime): InsightsHome (0.7 s), InsightsAccess, InsightsCatalog,
  InsightsDashboards, InsightsDatasets, ProjectsAccess, AdminRegistries, 34 of 34; InsightsHomeUsable (changed: the receipts
  route) with its dependency InsightsDatasetsUsable, 9 of 9; mr-boss's whole acceptance suite not run. `moqui lint --screens`:
  132 sites as before. Prettier clean.

### P6 — Analysis, drill and record contexts

Design §5 Analysis, §4 Drill and business annotations, §10; INS-02 (annotation sources), INS-03 (semantic guards),
INS-04 (drill).

- **Analysis** (AnalysisSource, AnalysisSteps, AnalysisResult, SaveAnalysis) on the framework query and definition
  editor; the semantic guards in the framework's validation of an admitted metric's query: money only with currency
  grouping or a named conversion, ratios by their registered rule, nonadditive dimensions declared, a bounded result
  never a population count.
- **Drill**: the framework resolves design §4's drill request to the authorized saved query, reapplies the source scope
  and returns source rows through `query#Documents` or a registered domain drill service, never a client-supplied
  entity or service name; the BOSS dialog (DrillMeaning, Breakdown, SourceRows).
- **The record contexts** (owner contracts, F16): an Insights branch, read only with report return navigation, on
  Shared/OrderDetail, Customer360, Supplier360, Product360 (Products' SharedContext.js admitting Insights read only),
  RequestDetail, WorkItemDetail, ShipmentDetail, FacilityDetail, EquipmentDetail and InvoiceDetail, mounted under
  `Insights/Records/`; each owner's crosscut row checked against what is built. Employee360 waits for People (§7).
- **Business annotations** (F13): a `business` source in the framework's annotations, with an organization and a link
  resolved by the viewer's permissions and no amounts; written after commit by Products' price-list publication,
  Commerce's promotion start and Accounting's period close (P0). Marketing's campaign sends wait (§7).
- **Specs:** framework `ReportDrill` (scope reapplied; an "other" bucket's predicates kept; an aggregate readable while
  its rows are not returns no rows); framework annotations (the business source refused without its grant); BOSS
  `InsightsRecords` (OrderDetail under Insights, its one qvt render, no action).
- **Usable when** (design §13.3 "Reconcile domain results", "Money, units and calendars"): drilling an orders bar to
  ORG_ZIZI_RETAIL's orders opens one in Insights' OrderDetail with no Approve; an analysis summing amounts across
  currencies is refused until grouped by currency; the price-list publication shows as a marker on the revenue panel.

### P7 — Scheduled delivery and digests

Design §7.1, §7.3, ScheduledReports, ScheduledReportDetail, ReportDelivery and ManagementDigest, §3 DigestPreview;
INS-06 (its first release), INS-11 (legacy schedules).

- **The framework** (F6): `ReportOccurrence` and `ReportRecipientDelivery`; `check#ReportAudience` (the scope
  fingerprint of design §7.1) at save and at each run, a changed recipient skipped with `scope-differs`; one message per
  recipient in place of the one comma-joined send; one render per definition version, fingerprint and locale; the
  recipient cap from Insights Settings (50 until P10 builds them) under Admin's instance ceiling (200 until Admin P8);
  `store#Schedule` checking the recipients `create#Schedule` copies unchecked today; `find#ReportOccurrences`,
  `get#ReportOccurrence`, `get#RecipientReport` and `retry#ReportRecipients` (failed recipients only, an uncertain
  outcome to reconciliation); the admin-callable `pause#OwnedSchedules` and `transfer#DefinitionOwner`; a legacy screen
  or saved-find schedule admitted for a group only through a registered adapter, and personal otherwise. Technical
  owner-mode schedules are unchanged.
- **Admin's lifecycle:** `pause#OwnedSchedules` and `transfer#DefinitionOwner` registered as an Admin P6 participant
  (design-admin §14).
- **Screens:** ScheduledReports (ScheduleFind, ScreenScheduledList with Mine, Shared administration and Received views,
  NewSchedule); ScheduledReportDetail (EditScreenScheduled, ReportAudience with each recipient's result, OwnPreview,
  ScheduleRuns); ReportDelivery (Occurrence, RecipientOutcomes, OwnArtifact, RetryRecipients); ManagementDigest
  (DigestComposition, DigestPreview); Home's DigestPreview. The copied personal scheduled finds become personal
  schedules, their rows kept (design §13.2).
- **Specs:** framework `ReportAudience` (a recipient with another row filter refused at save and skipped at run; one
  message per recipient with no shared address line; one render per fingerprint and locale; the cap; a disabled owner's
  schedule paused until transferred; a retry sends only the failed recipient); BOSS `InsightsDelivery`
  (ScheduledReportDetail's one qvt render).
- **Usable when** (design §13.3 "Owner equivalence", "Independent retry", "Lifecycle during rendering", "Legacy schedule
  boundary"; impl-admin's Offboarding, its schedules half): `insights.distributor` schedules the weekly digest to two
  ORG_ZIZI_RETAIL managers, each gets their own message, and an ORG_ZIZI_SERVICES reader is refused with the reason;
  disabling the distributor in Admin pauses it until a qualified owner accepts it; one failed delivery is retried alone.

### P8 — Business alerts

Design §8; INS-07 (its first release), INS-03.

- **The framework** (F8): a business rule evaluated once as its owner, its audience checked by `check#ReportAudience`
  and each recipient notified separately, `scope-differs` skipped; `find#AlertDeliveries`; P7's recipient cap; contacts
  limited to in-app notification and approved account email for business rules (no arbitrary address or webhook); the
  notification's link to the mounting app's AlertDetail; No Data, Error, stale and incomplete never Normal. Owner-mode
  technical alerts unchanged.
- **The business-alert topic:** a private, actionable NotificationTopic seeded by mr-boss beside `ReportAlert`, its
  payload the rule and instance IDs.
- **The shipped templates:** Mantle's daily sales floor, Customer Service's SLA breach and Commerce's three, copied to
  an owner and activated only after validation.
- **Screens:** Alerts (the framework list with the business filter and own states); AlertDetail (BusinessAlertBasis,
  AlertAudience, OwnAlertState, AlertDeliveryStatus); New alert from a panel.
- **Specs:** framework `BusinessAlerts` (one evaluation and two notifications for equivalent recipients; a narrower
  recipient skipped; No Data not Normal; no value in the administrative history); BOSS `InsightsAlerts`.
- **Usable when** (design §13.3 "Business alert semantics"): a manager copies the SLA breach template for their queue,
  adds an equivalent colleague, and each gets their own notification with the value; the ORG_ZIZI_SERVICES reader
  cannot be added; a source outage shows Error, not recovered.

### P9 — Flow maps

Design §9; INS-08.

- **`ironstone.insights.FlowMapServices`** `validate#Map` (each step's target and typed parameters against the
  registrations), `get#Map` (validated again at render; the node-graph frames of P0's shape and the ordered list; counts
  from the registered metrics and attention providers as the viewer; no count or live link on a step the viewer cannot
  read), `copy#Map` (the source and version recorded) and `store#Map`; listing, versions, diff and restore are the
  framework's definition operations (a `report` Definition of kind `flowmap`, F7).
- **Flow targets** (BOSS seed `ironstone.insights.FlowTarget`, §4): the built apps' worklist routes with their typed
  parameters, beside the catalog entries and attention providers a step may name.
- **The suite templates** `report/insights-flowmap-customer.json`, `-internal.json` and `-supplier.json`, from Marble's
  lanes extended with the apps' handoffs; a step of an app not built (Sales, Marketing, People, Maintenance) is
  informational until its owner registers a target.
- **Screens:** FlowMaps (MapFind, MapList, CopyMap); FlowMap (MapContext, ProcessLanes on the node-graph panel per P0,
  with its ordered list twin, StepDetail); FlowMapEditor (MapIdentity, Lanes, Steps, MapVersions); ProcessStory, the
  Commons Knowledge mount with the map and step return context. A bespoke `.qvue` lane view only if P0 rejects the node
  graph (design §17 Q1).
- **Specs:** BOSS `InsightsFlowMaps` (a copy keeps its provenance; a stale version refused; a map saved through Tools
  with an unregistered target renders that step informational; FlowMap's one qvt render).
- **Usable when** (design §13.3 "Editable map copies"): `insights.flow` copies the customer template for
  ORG_ZIZI_RETAIL, renames a step and links a Knowledge page; a reader sees each step's count and opens Commerce's
  orders and Customer Service's cases from it; a later template change leaves the copy alone; the Sales steps read as
  information.

### P10 — Settings, data readiness and Assist

Design §11 Settings and DataReadiness, §1.2 Assist and MCP analytics; INS-09, INS-10. Ends stage 2.

- **ContextServices `store#Settings`** (design §11's input): the organization's analytics defaults as registered
  PartySetting types seeded by mr-boss (§4), the recipient cap no higher than Admin's ceiling; fiscal start stays
  Accounting's.
- **DataReadiness** over Admin's `get#Readiness` (the freshness facet of Insights' sources) and `request#Refresh`, the
  refresh checked by each registration's own permission; Insights' row in Admin's settings index (design-admin §14.2).
- **Assist:** the `insights-analyst` skill with `screens:` on Dashboard, Explore and Reports; the prompts "Explain this
  number", "Compare with last period" and "Which source is stale?"; the response action "Add to my dashboard"; the READ
  exposures `RegistryServices.find#Reports`, `get#Metric` and `ReportServices.run#Query` limited to admitted datasets,
  `exposeMcp` by the dataset's class (no for cost data).
- **Screens:** Settings (AnalyticsDefaults, ScopeAndDelivery, SourceOwners); DataReadiness (ReadinessFind,
  SourceReadiness, RefreshRequest).
- **Specs:** BOSS `InsightsSettings` (a cap above the ceiling refused; a refresh without the source's grant refused;
  a stale source shows its lag).
- **Usable when** (design §13.3 "Source quality", "Assist and MCP"): the steward sees the inventory index an hour behind
  and requests its refresh; Assist answers "orders last month by currency" with the dashboard's numbers and an MCP
  client is refused a cost dataset.

### P11 — Wall displays on shared devices

Design §4 Playlists with CX-DEVICE; design-admin §6 Devices and §14 shared-device registration; INS-04, Admin's
ADM-DEVICES. Insights' second release, stage 5, after Admin P18 (impl-admin §4).

- **The Playlists route group:** the playlist route and the Dashboard renders it plays registered in Admin P18's device
  registry, with the idle timeout a wall display needs; a device registered for it opens nothing else.
- **What the display reads as:** the device's display account (impl-admin P18's proposal, settled there), so a playlist
  shows only what that account may read; a dashboard outside it is skipped and logged by name, as the framework's
  Playlist does, and a panel without data says so.
- **Kiosk play:** the registered playlist chosen at registration (one per device), its dashboards rotated at the
  playlist's seconds, each panel refreshed without a user session to time out; a revoked device stops at once.
- **Screens:** Playlists gains Register as display (opening Admin's RegisterDevice with the route group and playlist,
  for a holder of `ADMIN_ACCESS_MANAGE`, Admin P18) and the devices showing each playlist, read only; both, and the
  playlist chosen at registration, are in design §4 Playlists and design-admin §6 RegisterDevice.
- **Specs:** BOSS `InsightsWallDisplay` (a device credential plays its playlist and is refused another route; a
  dashboard outside the display account's grants skipped).
- **Usable when:** a plant wall screen registered for ORG_ZIZI_RETAIL's operations playlist plays it with no one signed
  in, shows that organization's numbers only, and opens nothing else; revoking the device in Admin ends the display.

### P12 — Finish

With Admin P19.

- The tui and server-static screen sweeps of Insights, one acceptance test per mode.
- The design §13.3 review, acceptance tests (§8): a user of each Insights group with no other launcher is refused other
  organizations' rows, costs and private fields through dashboards, Explore, suggestions, drill, exports, embeds,
  schedules, alerts, the palette, Assist and direct services.
- The §14 outputs not built earlier: definitions bundles imported inactive and admitted; the business map's print and
  ordered list; the delivery audit export.
- The legacy mapping of design §13.2: saved finds and schedules inventoried by ID, owner, route and sharing, references
  rewritten by a deliberate migration, an unsupported one shown invalid; no hidden alias routes.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work; the mr-boss README's
  Insights line.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into design-insights.md
or the owner's design. The decisions both plans share (the next apps, what is left out, one order) are impl-admin §4's.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 7, 2026 | `INSIGHTS_*` permissions are mr-boss's, checked by `ironstone.insights` services and screens; the engine's guards stay its own artifacts (ReportServices operations, `org.moqui.report.dataset.<id>`, dataset saves, DataDocumentUserGroup), which BossSetupData grants to the Insights groups by capability, never `DASHBOARDS_APP` or `REPORT_DATASETS_ADMIN`; `index#BusinessDataset` is guarded by the dataset's update artifact, not `INSIGHTS_DATASET_EDIT` | F2, F4: the framework may not name a BOSS permission; design §1.1 and §5 changed |
| Nov 7, 2026 | A `rowFilterService` is called with the dataset's id and its body's `rowFilterParameters` beside `userId`, so one organization service serves every dataset by naming its organization field | F5; the plan's choice over one service per field; design §5 changed |
| Nov 7, 2026 | The registries are BOSS seed records each owner fills: ReportCatalogEntry, AttentionProvider and FlowTarget; metric descriptors live on the definitions and the domain service registrations | The plan's choice under design §6.1 |
| Nov 7, 2026 | Whether a viewer may read a catalog entry is decided by its owner's catalogue service where it has one (Customer Service, Commerce, Accounting), otherwise by the route's screen authorization | F17; the built catalogues already answer by their app's grants |
| Nov 7, 2026 | SalesAnalysis is one catalog entry owned by Sales, opening Accounting's built report until Sales is built and Accounting mounts Sales' | F18; design §6.2's one-owner rule kept without waiting for Sales |
| Nov 7, 2026 | The orders metric is registered for Sales over Mantle's `SalesReportServices` and the admitted sales datasets (owner contract, X11); Sales' own entries and measures wait for Sales | Commerce and Accounting already read it; the services are Mantle's, not the Sales app's |
| Nov 7, 2026 | Organization analytics defaults are registered PartySetting types seeded by mr-boss | The plan's choice: design §11 names "organization settings"; PartySetting is Mantle's typed per-organization store |
| Nov 7, 2026 | Business annotations get a framework `business` source with an organization and a resolvable link, written after commit by their owners | F13: today's sources are deploy, config, release and user, under `MONITOR_INGEST` |
| Nov 7, 2026 | The group recipient cap is 50 per business schedule or alert rule by default, an Insights Settings value, under an instance ceiling of 200 (Admin P8's InstancePreference; 200 until it exists) | The user's call (answer 1, design §17 Q5); design §16 changed |
| Nov 7, 2026 | Insights has a second release, stage 5: wall displays on shared devices (P11), after Admin P18's device credential | The user's call (impl-admin answer 2); design §16 changed |
| Nov 7, 2026 | Opening Insights needs the root grant alone, no permission; `INSIGHTS_VIEW` decides what Home and later screens show | P1, as Admin (impl-admin §4); a member of `BOSS_INSIGHTS` alone opens Home and is told why it shows nothing |
| Nov 7, 2026 | The engine's operations by group: reading for every group, authoring for the author and steward, the dataset save for the steward, scheduling for the distributor; the administrator reads only (its business data and authoring stay separate grants); import, annotations, alert evaluation and git sync no Insights group's | P1 (F2, F4, F32); bundles in P12, the business annotation source in P6 |
| Nov 7, 2026 | Dashboards and Dashboard stay with the copied screens, the administrator's and ADMIN's, until P2 mounts the framework screens | F35 |
| Nov 7, 2026 | The framework report screens are mounted by a `reportLinks` map the app's root sets, sent to the clients as `appLinks`; a null link is not offered; Tools' screens without a map | P2, F39 (the plan's `appBase` generalized); mr-moqui docs/tools/Monitoring.md |
| Nov 7, 2026 | Every ReportServices operation is denied to the root user group and the administrator by one pattern; the capability groups' grants are ALWAYS | P2, the P1 review's ask; a new framework operation fails closed |
| Nov 7, 2026 | DashboardEditor and PanelDetail are the author's and steward's (a non-inheritable ALWAYS area, its transitions named); Dashboards, Dashboard, Library panels, Wall display, Explore and Compare every Insights user's | P2, design §1.1, §2 roles; F45 |
| Nov 7, 2026 | The organization in scope is a fixed dashboard variable (`organizationPartyId`) until P3's row filter carries it | P2, design §4 Dashboard ("user variables never replace a scope predicate"); F43 |
| Nov 7, 2026 | A dashboard is shared with one of the owner's own groups or kept private, through `share#Dashboard` | P2, design §4 ShareDashboard; F42 |
| Nov 7, 2026 | The demo reader with financial read is in Accounting's `BOSS_ACCOUNTING_READ` (`ACCOUNTING_VIEW`, `PRODUCT_COST_VIEW`, `CUSTOMER_CREDIT_VIEW`), the owner's group, not an Insights one | P1 (design §13.3's confidential-field scenario) |
| Nov 7, 2026 | Admission is a framework record (`moqui.report.BusinessDataset`) and an engine rule: a dataset of signal `business` is read only once admitted, or by its steward (the dataset's update artifact) | P3, F48; design §5 changed |
| Nov 7, 2026 | A registered `rowFilterService` is a `ReportScopePolicy` enumeration and runs without a grant of the viewer's; the framework ships `ReportUserGroups`, Mantle `MantleOrganization` | P3, F49, F50 |
| Nov 7, 2026 | BOSS's five datasets are admitted by setup; Mantle's sales datasets and the inventory dataset wait for the steward's Admit | P3; the "usable when" scenario; the demo shows the sales panels not available until admitted |
| Nov 7, 2026 | The owners' report groups that read their datasets: Commerce's store managers and administrators, Customer Service's managers and administrators; store-scoped operators keep Commerce's own Reports | P3, owner contracts (design-commerce §1.4, design-customer-service §1) |
| Nov 7, 2026 | A steward's dataset is named `insights-<name>`, whose artifacts setup grants by pattern | P3, F51 |
| Nov 7, 2026 | One readiness provider (instance scope, `INSIGHTS_VIEW`, omitted when unreadable) and one index refresh (`INSIGHTS_DATASET_EDIT` and the dataset's update artifact) per business dataset; Admin's two registry services granted to the author, steward and administrator | P3, impl-admin F50, F53 |
| Nov 7, 2026 | The catalog and metric registrations are `ironstone.insights.ReportCatalogEntry` and `MetricRegistration` in mr-boss's registry entity file (Admin P2's); a panel names its metric and target in its body (`business`), and a dataset body may carry its own descriptor | P4, the §4 row on registries; F59; design §6.1 changed |
| Nov 7, 2026 | An entry with an owner's catalogue service is read by it (called as the viewer with the route's app as `appRoot`, once per call); without one, by whether its route opens to the viewer's own groups (Admin.js `destinationOpens`); SalesAnalysis is read through Accounting's catalogue, its route's | P4, F17, F60, F63 |
| Nov 7, 2026 | A money target names one currency and is refused unless every query of the panel is filtered to that currency; a measure target shares the measure's unit and aggregation | P4, F62; design §4 PanelDetail changed |
| Nov 7, 2026 | An attention provider is shown only when its route opens to the viewer and they hold its permission; its count service is called as the viewer, once per distinct call per board; an owner's refusal or a null count leaves it out, any other failure is its own named card; counts are grouped by owner and never totalled | P5; design §3 changed |
| Nov 7, 2026 | Owner Home summaries serve as count services where they compute the card with its list's query (F29); only Accounting's list finds take Insights' organization, the others keep the owner's scope (active organization, selected plant or facility, the user's stores), which the card says | P5, F-P5-1, F-P5-4 |
| Nov 7, 2026 | Monitor's Business operations source is `RegistryServices.get#OperationFailures`, running the shipped dashboard's own rollbacks query as the viewer, so Monitor's grants decide | P5, F19 |
| Nov 7, 2026 | The suite dashboard `insights-suite` places four shipped library panels by reference; its organization scope is two hidden variables (`organizationPartyId`, `vendorPartyId`) that Home sets; Home's arrangement is `store#HomeLayout` in `InsightsHome`, at most six panels | P5, F-P5-2, F-P5-6 |
| Nov 7, 2026 | SaveAs copies a definition through `save#Definition` as the author (one save with the chosen group) rather than `copy#Definition` (which keeps the source's group, F42); a saved find has no SaveAs in Insights | P4; design §6 SavedReports changed |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the plan's open question as written (Q1, the recipient cap) was answered on Nov 7 and is in §4 |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F25 were found on Nov 7, 2026, while writing this plan, F26–F31 in P0's remaining checks, F32–F38 in P1, F39–F47 in P2, the provisional F48 to F57 in P3, F59 to F65 in P4, F-P5-1 to F-P5-6 in P5 and F-P5-7, F-P5-8 in its review the same day.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: the root's comment says the grant is commented out; in fact `BOSS_INSIGHTS` (BossSetupData.xml:246-252) grants `ADMIN` and `BOSS_INSIGHTS_ADMIN` with `MANTLE_ACTIVE_ORG`; there is no root user group or other Insights group | P1 |
| F2 | P0: Tools Dashboards (Dashboards.xml, inheritable), the `/moqui/reports` REST path and `org.moqui.report.ReportServices.*` are guarded by `DASHBOARDS_APP`, and `org.moqui.report.dataset.*` by `REPORT_DATASETS_ADMIN`, both `ADMIN` only (MonitoringSecurityData.xml:15-24); also `REPORT_GIT_SYNC_ADMIN`, `REPORT_CONTACT_ADMIN`, `REPORT_ALERT_EVALUATION` and the `REPORT_SAVE_LOCATION` permission | P1 grants the engine's artifacts by capability (§4) |
| F3 | P0: the Dashboards screens' links are hard-coded to `//apps/dashboards/…` (Home.xml:16-18, Definition.xml:5-38, Explore.xml:22, 55, 57, Playlist.xml:23-35, Dashboard.xml:76), as are WebrootReport.js's (1115, 1385, 1398, 1410, 1450, 1626) and the terminal's (moqui-tui `components/report.rs`); BOSS Insights' Dashboards still sends edit, new and explore to the Dashboards app, and Dashboard lacks `duplicatePanel` and `removePanel` | P2 (INS-04) |
| F4 | P0: reading a dataset needs its artifact `org.moqui.report.dataset.<id>` (lib.rs:163-174) and a DataDocumentUserGroup row of the viewer's for each document (:264-277); a service dataset needs the service's grant (:224-233); saving a dataset definition needs `org.moqui.report.dataset` update (definitions.rs:259-261) | P1's grants; P3's admission grants (§4) |
| F5 | P0: a `rowFilterService` is called with only `userId` and returns `filter` (lib.rs:302-321); listing adds a match-nothing filter (:298-301); `contextFilters` keys are only `userId`, `username`, `userGroupIds` and `userAccount.*` (:339-382) | P3 passes the dataset and its parameters (§4) |
| F6 | P0: `create#Schedule` (schedule.rs:63-121) copies `userId` and `userGroupId` unchecked; a schedule renders as its owner (:1082-1107); recipients are the user and the group's members, deduplicated (:1162-1228), sent one email with comma-joined addresses (:1254-1258); `pause#Schedule` and `list#Schedules` are owner-only; none of design §7's services or records exist | P7 |
| F7 | P0: Definition types are dashboard, panel, dataset, search, alert, report, contactPoint, silence and muteTiming (definitions.rs:249-254); a `report` body is not validated in Rust (alert.rs:862-881), the playlist's shape only in Playlist.xml; component `report/*.json` load read only with `component` and version 0, the first id winning (definitions.rs:60-143); shipped alerts are never evaluated (:119-123); `copy#Definition` makes an editable copy (:512-528) | P9 validates flow maps in FlowMapServices at save and render, as designed |
| F8 | P0: an alert rule runs as its owner (alert.rs:1361-1385) with at most 500 series (:272); its contacts are notification (topic `ReportAlert`, link `/apps/dashboards/Alerts`), email (`toAddresses`) and webhook (:561-654) | P8 |
| F9 | P0: Mantle ships `mantle-sales-orders` and `mantle-sales-items`, the `mantle-sales` dashboard and the `mantle-sales-daily-floor` alert, none with a row filter; their documents are granted to `ADMIN` only (MonitoringSalesSecurityData.xml:4-5), the invoice documents to no one; the feeds are `MantleSales` (`mantle_sales`), `MantleInventoryData` (`mantle_inventory`) and `MantleSearch` (`mantle`); no inventory dataset is shipped | P3 |
| F10 | P0: mr-boss ships five datasets (Commerce's checkouts, payment attempts and feed builds; Customer Service's clocks and breaches), Commerce's Store operations dashboard and four alert templates, all `ADMIN`'s only and unfiltered (BossCommerceReportData.xml, BossCustomerServiceReportData.xml; impl-customer-service F190, F191) | P3, P8 |
| F11 | P0: there is no organization row-filter service; `get#PartyInternalOrgIds` (PartyServices.xml:563-603) computes the organizations (agent, employee and member relationships to OrgInternal parties and their direct children), and `get#PartyOrganizationInfo` (:604-639) adds the active one from the `ACTIVE_ORGANIZATION` preference | P3's `get#OrganizationRowFilter` |
| F12 | P0: the funnel, node-graph and geomap panels are built in the browser (WebrootReport.js:459, 474, 599) and the terminal (report/graph.rs:50, 108, 329); the server's graph frames are span-based (graph.rs:49, 112) | P9 builds its frames in `get#Map` (P0's shape) |
| F13 | P0: `create#Annotation` needs `MONITOR_INGEST` or the `monitor_annotations` dataset's create, takes the sources deploy, config, release or user, and indexes into `monitor_annotations` (annotations.rs:4-60) | P6's business source (§4) |
| F14 | P0: the framework keeps REPORT_RECENT (20), REPORT_STARRED (500), `REPORT_PINNED_<dataset>` and `REPORT_HISTORY_<dataset>` preferences | Reused; catalog pins are the `InsightsHome` preference (P4) |
| F15 | P0: `SearchServices.index#DataFeedDocuments` (SearchServices.xml:43-53) indexes one feed, optionally one document, with `authenticate="false"` | P3's `index#BusinessDataset` calls it under the dataset's grant |
| F16 | P0: the shared record screens choose their context inline by `appRoot`, and none knows Insights: Product360 throws for another root (SharedContext.js:379-386); Customer360 falls to Accounting's context, OrderDetail and InvoiceDetail to Projects', Supplier360 to Products'; FacilityDetail answers only Warehouse and Manufacturing, EquipmentDetail Accounting, Warehouse and Manufacturing; ShipmentDetail says not available | P6 adds read-only Insights branches |
| F17 | P0: Customer Service's (Reporting.js:1176-1257) and Commerce's (:528-569, 628-636) `get#ReportCatalogue` answer Insights' contract; Accounting's `ReportServices.get#Catalog` answers another shape (reportId, title, area, description, period and comparison flags; no route or owner); Warehouse, Manufacturing and Projects have index screens only; Products and Purchasing have no Reports area | P4 (§4) |
| F18 | P0: Accounting's SalesAnalysis is not a mount of Sales': it calls `SalesReportServices.run#SalesAnalysis` itself; Sales' is a legacy screen over OrderItemSalesSummary in a placeholder app | §4; design §6.2 changed |
| F19 | P0: Monitor's Business operations dashboard is shipped (tools `report/monitor-operations.json`, over `moqui.operation.duration` and `moqui.operation.runs`) and mounted by Tools Monitor/Operations | P5's attention source |
| F20 | P0: BOSS Insights' ReportBuilder is the copied SimpleReport builder, listing every entity outside `moqui.*` with raw entity transitions (DataDocumentCondition create, update and delete; DataDocumentField delete); DatasetView relies on a DataDocument group check alone; Reports is the legacy picker; ScheduledReports the copied owner-only scheduled finds; Home, FlowMap and Settings are placeholders | P1 keeps them to the admin group; P3, P4, P7 replace them |
| F21 | P0: Manufacturing's Home KPIs read its reports on each render, a cache or snapshot later (impl-manufacturing F142), and its catalog waits for Insights' registration (F143); Customer Service's catalogue waits likewise (impl-customer-service F189) | P4, P5 |
| F22 | P0: Commerce left Insights its catalogue registration (impl-commerce F142) and its attention provider (its §7) | P4, P5 |
| F23 | P0: no People, Marketing, Maintenance or Sales report service the design names exists (PeopleReportServices, Marketing's projections, Maintenance's work status); the Sales app is a placeholder with two ported reports | §1 scope, §7 |
| F24 | P0: the framework's regression budget is 12 s server and 6 s client (impl-admin F30) | impl-admin §4: raised per phase |
| F25 | P0: `insights` is not in the client deny pattern | impl-admin P1 adds it with `admin` (impl-admin F14) |
| F26 | P0: the node graph has no groups: the browser lays nodes in columns by longest path in a fixed-width SVG with raw ids and a click hard-coded to Explore (WebrootReport.js:474-515, 1498-1499); the terminal prints an adjacency list by count (moqui-tui report/graph.rs:108-160) | P9: the ordered list is the body at phone width and in the terminal; the lanes need a framework `nodeGraph` group, label and link option in both renderers, or the `.qvue`; `get#Map` returns one row per edge (source, target, count, errors, labels, groups, orders, link) and the lanes list; design §17 Q1 answered so |
| F27 | P0: beyond F3, `report.appPath` (WebrootReport.js:150) only swaps `/apps` for `/qapps`; `screenUrl` (Dashboard.xml:132) is used by `panelRequest` alone; hard-coded paths at WebrootReport.js :154, :666, :1115, :1385, :1398 (duplicate and remove post to `/apps/dashboards/Dashboard/`), :1450, :1626 (`e`), moqui-tui components/report.rs :945, :1035, :1156, :1178, :1203, :1217, :1546-1548, and Alerts.xml, AlertRule.xml, AlertShared.xml, Datasets.xml, Reports.xml and Definition.xml | P2: Dashboard.xml sends an `appBase` (the mounted Dashboards root) beside `screenUrl`, both report components build Definition, AlertRule, Explore and the panel actions from it, and the screens use relative transitions |
| F28 | P0: the only ScreenScheduled row is BOSS_DEMO_MY_TASKS (BossDemoData.xml:63-70, Commons Tasks, paused); FormListFinds are Projects' three and Products' six in BossSetupData and Marble's seven Accounting finds | P7's mapping covers Commons Tasks; the saved finds stay list views (P12) |
| F29 | P0: Products' report candidates are CatalogChecks, the price audit and history and cost history; Purchasing's the eight `ironstone.purchasing.ReportServices` reads under Performance; the Home cards whose count is the query of the list they open: Commerce's To approve, Payment holds, Placements waiting, Open carts, Integration errors; Accounting's draft and posted entries, bills awaiting approval or on hold, cost close; Products' active SKUs, variants, ending soon; Purchasing's draft, approved not sent, held bills, late receipts, quotes expiring, unacknowledged; Manufacturing's open, in progress, late; Projects' reviews, time to approve, allocation requests, unbilled; Warehouse's receiving. Customer Service's queue cards and the others do not match their lists | P4 registers the Products and Purchasing entries; P5 registers only the matching cards; the others are their owners' fixes (one query for card and list) |
| F30 | P0: Customer Service's clock document carries `organizationPartyId`; Commerce's three documents carry only `productStoreId` (ProductStore has the organization; PortalPaymentAttempt has no ProductStore relationship); Mantle's sales documents none (OrderPart `vendorPartyId`, Invoice `fromPartyId`) | P3 adds an `organizationPartyId` field through those paths to the five documents (a relationship for PortalPaymentAttempt, or its invoice's `fromPartyId`) and reindexes |
| F31 | P0: `create#Annotation` copies a whitelist of fields (annotations.rs:38-54), so an organization and link would be dropped, and indexes at once; a Mantle service can write after commit with `registerOnCommit` (tools_host.rs:328); hooks are `publish#ProductPriceList`, `close#Period` and `store#Promotion` (no start event: the annotation spans `fromDate` to `thruDate`) | P6's business source adds `organizationPartyId` and `link` to the whitelist; Mantle registers the writes on commit |
| F32 | P1: the root's inheritable ALLOW reaches every ReportServices operation an Insights screen or transition calls (impl-admin F35), so without more a reader could save, copy, delete, schedule or import from any Insights screen that calls them | `BOSS_INS_REPORT_AUTHOR`, `_SCHEDULE` and `_TOOLS` deny the root user group and the administrator; the capability groups pass with ALWAYS; confirmed with a probe screen (not kept) |
| F33 | P1: the browser report panels post to `/rest/s1/moqui/reports/query` (WebrootReport.js:1004), the REST path `DASHBOARDS_APP` guards (moqui.rest.xml:23-27), so reading needs the REST path's grant beside the operations | `BOSS_INS_REPORT_READ` grants `/moqui/reports` (its query, documents and datasets) |
| F34 | P1: Comms' keymap binds `g i` globally (Comms.xml:52), and a scope key shadows a global one while its app is current | Insights home is `g s`; design §1.2 changed |
| F35 | P1: F20's list of copied screens kept to the administrator leaves out Dashboards and Dashboard, whose edit, new and explore open Tools' Dashboards, which only ADMIN opens | Kept with the copied screens (`BOSS_INS_LEGACY`) until P2 |
| F36 | P1: `BOSS_INSIGHTS_ADMIN`'s root grant was an inheritable ALWAYS (F1), which overrides any deny below it: F32's and those P2 puts on mounted Tools screens | ALLOW, as impl-admin F34; the copied screens' area gives it ALLOW too (an ALWAYS there passed the engine's denies from those screens, review R2) |
| F37 | P1: test/Shared/Chatter.spec.js said Insights and Admin have no grant | Comment corrected; its filter (Commons and Comms) unchanged |
| F38 | P1: no organization analytics defaults exist until P10 (PartySetting types, §4) | `get#Context`'s defaults are a relative range (`now-30d` to `now`) and native currencies, never a default currency |
| F39 | P2: F27's `appBase` alone cannot carry Insights' route names (DashboardEditor, PanelDetail, ReportBuilder/Explore are not Tools' Definition and Explore), and Monitor's screens include Dashboard.xml under `/apps/monitor`, so a base relative to the including screen would break them | The mounting root's `reportLinks` map (screen URLs, null not offered), read by the screens' transitions with Tools' paths as the fallback; Dashboard.xml sends it as `appLinks` (server paths) beside `screenUrl` |
| F40 | P2: Dashboard.xml's dataset-fields read left a dataset refusal in the page's messages (an error on every dashboard over a dataset the viewer may not read), and the browser and terminal panels said "No data in this time range" for a panel whose query was refused | The read runs as a probe; both panels say "Not available: <reason>" for an incomplete error notice |
| F41 | P2: `save#Definition` (and `copy#Definition`, which saves) checks every dataset a definition references as the viewer (definitions.rs `references`), so an author cannot copy or save Store operations until P3 grants `mantle-sales-orders` | Kept (a definition never names a source its author cannot read); the walk copies a shared fixture dashboard and adds a library panel by reference; the "usable when" acceptance test passes after P3 |
| F42 | P2: `save#Definition` takes any `userGroupId`, so an owner can share a definition with a group they do not belong to (definitions only, never data) | Insights shares through `share#Dashboard` (the owner's own groups) and the mounted editor keeps the group (hidden, and its save takes no posted group: review R1); the engine check is a framework ask (Remaining-Work's report-engine row) |
| F43 | P2: `get#Context` resolves no single organization for a user of several organizations with none active (the demo author) | The fixed scope is the chosen organization, else the user's organization list; none for the administrator in every organization |
| F44 | P2: shipped definitions are readable by every viewer, so Insights' Dashboards listed Tools' telemetry dashboards (Monitor), every panel of which no Insights group reads | `reportHiddenComponents` (`tools`) under Insights; the admitted-business filter of design §4 Dashboards comes with P3 |
| F45 | P2: an area that denies the root user group and allows the authors cannot use ALLOW (DENY wins over ALLOW at the same artifact, authz.rs), and an inheritable ALWAYS on a screen passes every deny below it, the engine's included | The editors' area is ALWAYS for the author and steward, as Commerce's areas (F45), not inheritable, with the authoring transitions named (review R3), so the engine's denies hold under it |
| F46 | P2: design §2's `Insights/Panels/PanelDetail` would make Panels a parent whose widgets must render the child | PanelDetail is the hidden root route `Insights/PanelDetail`; design §2 changed |
| F47 | P2: design §1.2 puts Explore at `ReportBuilder/Explore`, but ReportBuilder was the copied builder denied to the root user group (F20) | `BOSS_INS_LEGACY` names the copied children; ReportBuilder opens on Explore for every Insights user |
| F48 | P3: the framework kept no admission state, and shipped datasets are read-only definitions, so "admitted" could not be written on them | `moqui.report.BusinessDataset` keyed by dataset id and the engine rule on signal `business` (§4); setup admits BOSS's own |
| F49 | P3: a `rowFilterService` ran with the viewer's authorization, and no Insights group holds Mantle's service (BOSS_INS_REPORT_ENGINE's model grants operations, not policies) | A registered policy is the engine's own reviewed code and runs without the viewer's grant; an unregistered one keeps the viewer's call |
| F50 | P3: "a registered rowFilterService" had no registry, and a framework spec cannot define a service outside a component's service directory | `ReportScopePolicy` enumerations; the framework's `ReportUserGroups` policy, which its spec uses |
| F51 | P3: `index#BusinessDataset` and reading are guarded by the dataset's own artifact, which no group holds for a dataset a steward creates | Created datasets are `insights-<name>` and BossSetupData grants that pattern (steward all, readers view) |
| F52 | P3: `request#Refresh` passes the owner's service no registration key, so one service for several dataset indexes cannot tell which | Registry.js passes `refreshKey` (reserved from the scope parameters); refresh#DatasetIndex reads the registration's source |
| F53 | P3: a DataDocument-by-id dataset (`org.moqui.report.dataset.MantleSalesOrderPart`) and an `index:` alias resolve without the dataset definition, so without the admission rule and its row filter | No Insights group holds those artifacts (ADMIN alone, through REPORT_DATASETS_ADMIN); noted for the lead and in BossSetupData |
| F54 | P3: grants in the owners' report data files cannot name BOSS groups, which BossSetupData defines and loads later | The owners' document grants are in BossSetupData's P3 block |
| F55 | P3: Mantle's sales documents already carry the organization (`vendorPartyId`), Commerce's three only the store | The sales filter names `vendorPartyId` (no reindex); Commerce's documents gain `organizationPartyId` through the store (an existing instance rebuilds their indexes) |
| F56 | P3: on Debug, mr-mantle SalesReportStoreScope's setup fails with "Maximum call stack size exceeded" in an OrderHeader EECA (as F37) | Not P3's; it passes on the release binary per earlier waves |
| F57 | P3: with Mantle's sales datasets waiting for the steward, P2's InsightsDashboardsUsable (acceptance) cannot copy Store operations on a fresh instance (F41) | Run InsightsDatasetsUsable first, or admit on the instance; the regression walk's panel stays "Not available" |
| F58 | P3 (review): a steward's field change edits the shared DataDocument, so a plain, non-secret field added to one dataset appears in every admitted dataset over that document after a rebuild, without review; `stewardUserId` is a label only | Open: until design §17 item 6's field classes exist the steward role is the guard; a document's datasets returning to review on any field change is the proposed fix (P10 or the framework's next report work) |
| F59 | P4: Mantle's shipped sales and inventory datasets are Mantle's files, read only from BOSS, so a metric descriptor cannot be written on their definitions | The metric is a `MetricRegistration` naming the datasets; a dataset body's own `business` descriptor is read when present (none shipped) |
| F60 | P4: Accounting's `get#Catalog` refuses another `appRoot` ("Accounting context is not available") and lists no inventory valuation (its Inventory area's) | The catalog read passes the route's app as `appRoot`; inventory valuation is read by its route |
| F61 | P4: the Store operations orders panel (Commerce's) and Mantle's `mantle-sales` dashboard counted orders over `mantle-sales-orders` without excluding recurring base orders (X5) | Commerce's panel gains a negated `orderPurposeEnumId` filter and names `Sales.Orders`; Mantle's dashboard is Mantle's to fix: the same filter on its orders and items panels (review). Done (mr-mantle c7f2e989): MantleSalesOrderPart carries `orderHeader:orderPurposeEnumId`, without which the orders panels' negated filter excluded nothing, and `mantle-sales`' three panels filter; an existing instance rebuilds `mantle_sales` |
| F62 | P4: a panel has no unit or currency of its own, so "a target in the same unit" had nothing to compare | The panel's currency is the `currencyUomId` equality filter on every query; without it the panel shows every currency apart and takes no money target (TARGET_CURRENCY_MIXED) |
| F63 | P4: a route's screen authorization can be wider than its owner's index: Warehouse's CountVariance opens to every Warehouse user (its index shows it to count reviewers and adjusters, whose service decides), Manufacturing's cost reports to every Manufacturing user (money only with financial read) | Kept (§4: route authorization where there is no catalogue service); an owner that wants a narrower catalog registers a catalogue service |
| F64 | P4: under the shared release binary over a worktree runtime, a service file that does not parse loses its services silently ("no service named …"), with nothing in the test log | Found by a probe spec (a wrapped `from` attribute); a framework note: name a service file's registration failure in the log or the refusal |
| F65 | P4: BOSS_INS_LEGACY's artifact is a pattern row whose name is its key, so narrowing it adds a row and leaves the old one on an existing instance (P3's narrowing too) | The seed narrows to ScheduledReports and reloads the earlier rows (P1, P2, P3) with `nameIsPattern="N"`, which match no screen (review R2) |
| F-P5-1 | P5: the owners' Home summaries that compute the F29 cards also compute the whole landing: Products' `get#CatalogSummary` loads every product five times, Warehouse's, Manufacturing's and Projects' `get#Home` every queue or KPI, Commerce's `get#ChannelHealth` per-store message rows; the board for an all-app administrator took 0.8 s on the demo data | Kept (one call per summary per board, each in its own transaction); each owner's light count service per card, the same query as its list, is the owner's fix, and the registration then names it |
| F-P5-2 | P5: there is no admitted invoice dataset (`Accounting.InvoicedRevenue` is a service metric over `get#SalesInvoiceSummary`), so the suite dashboard cannot show invoiced revenue by currency as a panel | The suite shows order value by currency (`Sales.OrderValue`) and orders; a Mantle invoice dataset admitted under §5, or a service-source panel, is needed for invoiced revenue |
| F-P5-3 | P5: the "usable when" names open purchase approvals, receipts to put away and cases past due, which do not match a worklist's query (F29: Purchasing's Approvals waiting counts unread notifications; Warehouse's Putaway was not checked by P0; Customer Service's Overdue sums per-queue counts with no list of that filter) | Not registered; InsightsHomeUsable uses Warehouse's Receiving; each owner's one query for card and list registers them |
| F-P5-4 | P5: only Accounting's list finds take an organization; the other owners' counts keep their own scope (active organization, selected plant or facility, the user's stores), and a Warehouse or Manufacturing user with no selected facility or plant gets no count | The card says the scope it keeps; Insights' organization narrows Accounting's cards and the panels. Review: each owner counts only the viewer's own scope; without a selection Warehouse answers no count (left out), Manufacturing counts every plant of the user's organizations, Products adds the shared catalog, Commerce, Purchasing and the journals answer 0 for a user with no store or organization, and Payables refuses with no organization (left out, R2); the cards' route carries the plant or facility counted (R1) |
| F-P5-5 | P5: `run#Query` answers a dataset the viewer may not read as an error notice with no frames, not as an error, so a caller summing frames reads a zero | `get#OperationFailures` reads the notices (refused or failed, never zero); a framework note: an unauthorized dataset could refuse the call |
| F-P5-6 | P5: a dashboard variable names one field, and the suite's datasets name the organization differently (`vendorPartyId` for the sales orders), while Insights' Dashboard fixes only `organizationPartyId` | The suite has two hidden variables, which Home sets together; done in review (R4): Insights' Dashboard fixes `vendorPartyId` too where it is over Mantle's sales datasets |
| F-P5-7 | P5 review: Manufacturing's own Home cards (Open, In progress, Late) count the selected plant but open WorkOrders without it, so their list is wider than their count | Manufacturing's fix (its links to carry `facilityId`); Insights' cards carry it (R1) |
| F-P5-8 | P5 review: the refusal pattern shared with the catalog (`not available`, `is required`) also matches genuine failures such as a resource "is not available" or a service's "X is required", which then leave a card out instead of naming a failure | Kept (a quiet omission, never a zero or another's count); the owners' coded refusals (`CODE: message`) would allow a strict match once Products' and Accounting's uncoded "... is required" are coded |

## 7. Later

Designed, not in this build:

- **Design §12:** CashForecast and `mantle.ledger.CashForecastServices` (INS-12); the funnel, after Marketing's visit
  capture; multi-touch attribution over Marketing's metric; recipient execution of reports and alerts (design §7.2,
  §8.1 later); generic pivot and graph on any list and "Add to my dashboard" from any list; analysis notebooks; query
  result caching; SQL, script or warehouse sources; public dashboard links and external delivery; advanced forecasting
  and cross-dataset joins; richer per-breakpoint arrangement.
- **What waits on People:** the Employee360 record mount and its crosscut row, PeopleReportServices, People's metrics,
  attention providers and confidential-dataset classes.
- **What waits on Marketing:** visits and attribution metrics, CampaignPerformance, DeliveryAnalysis, AudienceGrowth and
  Attribution entries, the campaign-sent annotation, the funnel.
- **What waits on Sales:** SalesSummary and Sales' own catalog entries, pipeline and forecast measures, Sales' attention
  providers, and SalesAnalysis moving to Sales' route with Accounting mounting it (§4).
- **What waits on Maintenance:** WorkStatus, PreventiveCompliance and cost entries and their metrics; Maintenance's
  context on EquipmentDetail.
- **Design §17's other open items:** usage analytics for stewards (Q3), alerts to a Comms chat room (Q4).

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Insights user and walk each built phase's "usable when" in
  order, in the browser, at phone width and in the terminal.
- **Design §13.3 scenarios,** each an acceptance test (`./moq accept mr-boss`, when asked):

| Scenario | Phase |
| --- | --- |
| Reader versus author/steward/distributor | P1; each phase's affordances; P12's walk |
| Two organizations and confidential fields | P3 (datasets), P4 (catalog), P6 (drill), P10 (Assist); P12's walk |
| Reconcile domain results | P4 (metrics), P6; the campaign and maintenance roots later (§7) |
| Money, units and calendars | P4 (targets), P6 |
| Same metric on many surfaces | P4, P5; P7 (digest), P8 (alert) |
| Source quality | P2, P5, P10 |
| Owner equivalence | P7 |
| Recipient differences | later (§7) |
| Spoofed recipient principal | P7 (group delivery); recipient execution later (§7) |
| Lifecycle during rendering | P7, with Admin P6 |
| Independent retry | P7 |
| Legacy schedule boundary | P7; P12's migration |
| Business alert semantics | P8 |
| Dataset admission | P3 |
| Single report owner | P4 |
| Editable map copies | P9 |
| Definition and source change | P2, P3; P12 (bundles) |
| Assist and MCP | P10 |
| Device and output | each phase; P11 (wall displays); P12's sweeps |

- **Walks.** One golden-path client walk for Insights in the regression suite (InsightsDashboardsWalk, from P2); the
  others are acceptance tests. No screenshots.
