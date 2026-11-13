# IronStone BOSS — Insights implementation

Nov 11, 2026 — after the build, the screens with no business model in them moved to the framework's Dashboards app and
Insights shows them under its root (mr-moqui `plans/archive/Admin-Screens-Down.md`, Track I). The phase entries below are the
record of what was built then; §9 says what they name that is gone or is the framework's now.
Nov 11, 2026 — gate 5 built: every phase of both plans (Admin P1–P19, Insights P1–P12), each reviewed by a fresh agent
and merged on its focused specs. Next: the full suites and the acceptance suite, run once (the user's call); their
results go in a Final suites note under P12.
Nov 10, 2026 — gate 2 built: P6–P10 (stage 2), Insights' first release, beside Admin's stage 3 (impl-admin P8–P14), each phase
reviewed by a fresh agent and merged on its focused specs; the full suites run once at the end of the build (the user's
call). Next: P11 (wall displays) after Admin P18, then P12 with Admin P19.
Nov 7, 2026 — gate 1 built: P1–P5 with Admin P1–P7 in the one build order (impl-admin §1, stage 1), each phase reviewed
by a fresh agent and merged in waves with the full suites after each; the gate's suites are under P5. Next: stage 2
(P6–P10).
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
  - mr-moqui `plans/archive/Monitoring.md` (dashboards and reports) and `docs/tools/Monitoring.md` (the built reporting guide,
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

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification) · [9 moved to the framework](#9-screens-moved-to-the-framework-nov-11-2026)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/moqui-report`, `crates/moqui-tui`, `runtime/components/base`): the Dashboards screens mountable
    under an app root (INS-04), dataset admission and its row-filter parameters (INS-03), owner-equivalent delivery
    with occurrences and recipient deliveries and the ownership services (INS-06), owner-equivalent business alerts
    (INS-07), drill resolution and the business annotation source; since Nov 11, 2026 also the generic screens
    themselves, in Dashboards (§9);
  - `runtime/components/addon/mr-mantle`: the organization row filter, the row filters of its shipped datasets, an inventory
    dataset, and the post-commit annotations of its owners' events;
  - `runtime/components/addon/mr-boss`: the Insights app, `ironstone.insights` (ContextServices, RegistryServices,
    FlowMapServices), the catalog, metric, attention and flow-target registrations of the built apps, the Insights
    context on the shared record screens, Insights' `report/` and `skill/` files. Its wrappers of the framework's
    screens and what its services keep are in §9.

  `runtime/components/addon/mr-marble` is read only, for the SimpleReport and MyAccount scheduled-find forms ss-inventory maps.
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
  An extension the design needs is made in the framework, for every app root, with Tools' own mounts unchanged. Since
  Nov 11, 2026 a screen with no business model in it is the framework's too, shown under Insights' root (§9).
- **Viewer execution and two kinds of grant.** Live results run as the viewer. `ironstone.insights` services and
  screens check the `INSIGHTS_*` permissions; the engine checks its own artifacts: the ReportServices operations, each
  dataset's `org.moqui.report.dataset.<id>` artifact and its documents' DataDocumentUserGroup rows (F4). BossSetupData
  grants the Insights groups exactly the artifacts their capability needs, never `DASHBOARDS_APP` or
  `REPORT_DATASETS_ADMIN` (F2; §4). A definition share, a catalog entry, a supplied organization or another app's edit
  permission grants no data. Under the framework's screens (§9) what an `INSIGHTS_*` permission decided is a feature of
  the root's `reportPolicy` (setting an alert, sharing) or the user's own grant of the engine's operation.
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
| P5 Home and attention | BOSS | Home | built and reviewed Nov 7, merged |
| P6 Analysis, drill and record contexts | mr-moqui, Mantle, BOSS | Analysis, Drill, the Records mounts | built and reviewed Nov 10, merged |
| P7 Scheduled delivery and digests | mr-moqui, BOSS | ScheduledReports, ScheduledReportDetail, ReportDelivery, ManagementDigest | built and reviewed Nov 10, merged |
| P8 Business alerts | mr-moqui, BOSS | Alerts, AlertDetail | built and reviewed Nov 10, merged |
| P9 Flow maps | BOSS | FlowMaps, FlowMap, FlowMapEditor, ProcessStory | built and reviewed Nov 10, merged |
| P10 Settings, data readiness and Assist | BOSS | Settings, DataReadiness | built and reviewed Nov 10, merged |
| P11 Wall displays on shared devices | BOSS | Playlists on a registered device | built and reviewed Nov 11, merged |
| P12 Finish | all | the sweeps and the review walk (acceptance) | built and reviewed Nov 11, merged |

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
- **Usable when** (an acceptance test to write, `test/acceptance/Insights/InsightsFoundationWalk`): the menu renders for each
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
  run: `test/acceptance/Insights/InsightsFoundationWalk` (3 features: every group's menu with each entry opened and the others
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
  - Acceptance, written and not run: `test/acceptance/client/Insights/InsightsDashboardsUsable` (in `test/acceptance/client/suite.js`,
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
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsDatasetsUsable` (5 features, the "usable when");
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

**Follow-up Nov 11 (dataset aliases need their index's own grant, impl-admin F277).** mr-moqui fbb2d3da and mr-boss (branch `ins/fix1`;
Mantle is not touched). Rust changed: a Debug binary built in the worktree; the shared release binary does not carry it.
- **What was found** (Admin P17's review, R1's "For the lead"; run there as `insights.steward`): a holder of
  `org.moqui.report.dataset` update who is granted the datasets they name by a pattern (the steward, `insights-.*`, F51) saved
  `insights-…` with `indexName: otel_logs` and `rowFilter: {match_all: {}}` and read every log line: the engine asked a telemetry
  alias only for some row filter, and the alias's artifact was the steward's own. Read from the code here, the same reasoning held
  two more ways (F143, F144): a definition without the business signal over a business dataset's document (P3 review R1's
  `check_governed` asked for the alias's own update artifact, which the pattern gives the steward, so `insights-raw` over
  `MantleSalesOrderPart` read every organization's rows without the registered policy), and a body of signal `business` naming a
  telemetry index as its `documentType` (the steward passes admission). Neither was run before the fix; both are refused after it.
- **The rule built** (one place, `crates/moqui-report/src/alias.rs`, asked by `resolve_dataset`, which every read goes through
  (P3 review), and by `save_definition_as`, which every save does: `save#Definition`, copy, restore, import, git pull,
  `create#BusinessDataset`). A dataset definition is an alias when it reads a source that has a dataset artifact of its own
  (`org.moqui.report.dataset.<index or document>`), and the source's own artifact is asked for, not only the alias's:
  - **a telemetry index** (any signal; view): to save, the saver holds it; to read, the reader holds it, or the saved
    definition's owner does, asked as the owner at each read (`user::as_user`, authorization on), or the definition is a
    component's shipped file (reviewed code, never a saved row: a save cannot take a shipped id). The owner clause is what keeps
    an administrator's shared alias a narrowed view for readers who do not hold the index (the framework's annotation source
    datasets are that: ReportAnnotations); a reader-only rule would have refused those and Mantle's `mantle-business-events`;
  - **a business dataset's document, read without the signal** (update): the saver and every reader, shipped or saved, beside
    the alias's own update artifact (R1). No owner clause: others read a business document through an admitted dataset.
  A row written past the save (an entity write, an older row) meets the same rule at read. Authorization off (an owner's
  service after its own check) passes as it passes every engine check.
- **Each shipped alias under the rule:** `admin-access-log` (`otel_logs`, shipped): unchanged; its artifact is granted to no
  group and `get#AccessLog` reads it with authorization off after `ADMIN_AUDIT_VIEW` (AdminAudit's access log feature passes,
  the audit reader still refused by the engine). `mantle-business-events` (`monitor_annotations`, shipped): unchanged, read by
  its own grant under Mantle's organization filter (Mantle BusinessEvents, InsightsRecords' marker feature). Monitor's and
  Tools' telemetry datasets are the indexes' own, not aliases; `ADMIN` holds every dataset artifact. The five BOSS datasets and
  Mantle's sales and inventory datasets are business datasets over their own documents, not aliases. A steward's
  `create#BusinessDataset` (`insights-<name>`, a registered feed's document, a registered policy) is a business dataset and
  saves and reads as before (the framework spec's steward does so).
- **mr-moqui:**
  - `moqui-report` `alias.rs` (new; `opens`, the rule as a pure function; `target`, what a body reads, now shared with
    `resolve_dataset`; `check_telemetry` at read; `check_save`; `governed_opens`) and `alias_tests.rs` (4 tests: the steward's
    alias, the holder, the owner's holding, the shipped file, the business document under no owner or file, what a body reads);
    `lib.rs` (`resolve_dataset` asks after the row-filter check, so that refusal keeps its words); `business.rs`
    (`check_governed` also asks for each governed document's own update artifact); `definitions.rs` (`is_shipped`; `check_save`
    for a dataset before anything is written).
  - `docs/tools/Monitoring.md` ("Dataset aliases", new, with the Business datasets and Security bullets),
    `docs/security/Attack-Surface.md` (P17's bullet: closed, and how), `plans/Remaining-Work.md` (the report engine row: built;
    left, a dataset's field list). No Parity-Diffs row (no Java behavior to differ from).
  - `framework/test/BusinessDatasets.spec.js`: one feature (0.21 s): a steward as an application grants one (dataset save, a
    name pattern, the document's group) is refused the save of a log alias, of the same by a business body, of the fixture
    document without its signal and of its index; the two written past the save are refused at read; the administrator's
    alias is read by the steward under its filter; the steward's own business dataset is created in review and read.
- **mr-boss:** `InsightsDatasets` gains one feature (0.08 s, no render): `insights.steward`'s two saves refused and nothing
  stored; BossSetupData's comment on `BOSS_INS_DATASETS`; design-insights §5 Datasets. No grant changed: the steward holds
  neither `org.moqui.report.dataset.otel_*` nor a document's own artifact, which is what the rule needs.
- **Tests** (Debug, `--nobuild`, this worktree's runtime): `cargo test -p moqui-report` 94 of 94, `cargo clippy -p moqui-report
  --all-targets -D warnings` clean; framework BusinessDatasets, ReportDrill, ReportAudience, BusinessAlerts, ReportAnnotations
  24 of 24 (4.3 s); tools ReportMounts 2 of 2; mr-mantle SalesReports, SalesReportStoreScope, OrganizationRowFilter,
  ReportLookups 17 of 17 and BusinessEvents 1 of 1; mr-boss InsightsDatasets, InsightsAccess, InsightsDashboards, InsightsHome,
  InsightsSettings, AdminAudit 28 of 28 (14.7 s) and InsightsRecords 5 of 5. Prettier clean on the two specs; rustfmt on the
  two new files only. Not run: the full suites, moqui-host's `report_` integration tests, any acceptance test; the attack was
  not run again on a served instance (the specs make the same calls as the same users).
- **Findings** (provisional, for the lead to number):
  - F143 (high, closed here): the steward's dataset without the signal over a business document read it unfiltered across
    organizations, R1's check being satisfied by the steward's own pattern.
  - F144 (high, closed here): a body of signal `business` with a telemetry index as its `documentType` reached the index for
    the steward through `save#Definition`; `create#BusinessDataset` alone refused a telemetry source.
  - F145 (design, open): a saved telemetry alias now answers by its owner's grant. One whose owner leaves `ADMIN`, or that
    is handed to an owner without the index, stops answering its readers (it fails closed, with the reason in the error); a
    disabled owner who still holds the grant still vouches (`as_user` reads grants, not the account's state).
  - F146 (open, the framework's, as F265): a dataset has no field list, so a reader of a telemetry alias reads each
    matching line whole; a shipped alias is trusted as its component's code, with no registration.
  - F147 (low, open): `business_documents` counts a business dataset's `documentType` only; a business body with none reads
    the document of its own id, which is then not counted governed (such a dataset is never admissible and its steward's alone).
  - F148 (low, open): the owner's grant is read in a context of its own at each read of a saved telemetry alias by a
    non-holder (and for each such dataset in `list#Datasets`), not cached.
- **For the lead:**
  - numbering: impl-admin's F277 is this note's subject; F143 to F148 above; a §4 row if wanted: "an alias needs its
    source's own grant, of its saver and its reader or owner; a shipped alias is its component's";
  - the user's call: whether a disabled owner's alias should stop (F145), and whether a shipped telemetry alias should need
    a registration as a scope policy does (F146);
  - an existing instance: a saved dataset over a telemetry index whose owner does not hold the index, and a saved dataset
    without the signal over a business document, now answer only an instance administrator; none is shipped or seeded;
  - merge: mr-moqui touches `moqui-report` (`lib.rs` two hunks, `business.rs` `check_governed`, `definitions.rs`
    `save_definition_as`), Monitoring.md, Attack-Surface (P17's bullet) and the Remaining-Work report engine row, which Admin
    P18 or a later Insights phase may also edit; mr-boss touches BossSetupData (a comment in P3's block, not an append),
    InsightsDatasets, design-insights §5 and this note. impl-admin.md is not edited (its P17 "For the lead" item is closed by this).

**Review Nov 11 (P3 follow-up, F277).** A fresh review of mr-moqui fbb2d3da and mr-boss 116edd3e, as an attack on the rule; fixes in
mr-moqui and mr-boss ("Insights follow-up review: …") and this note (branch `ins/fix1`). Each shape below was run on the Debug
binary as a steward of the application's kind (dataset save, a name pattern, the document's group; a throwaway spec, not kept).
- **Fixes:**
  - R1 (high, mr-moqui): the business signal was itself a way past the row filter. The steward saved `{signal: "business",
    documentType: <a business dataset's document>}` with no `rowFilterService` through `save#Definition` and read every row of
    the document (run: 3 of 3 fixture rows, across both scope groups): admission lets a steward read before admitting, and
    `check_governed` passed any body with the signal. With a `rowFilterService` that is not a registered policy the steward's
    own service would have chosen the filter. A business body is now past `check_governed` only with a registered scope policy
    bound; without one it is an alias of its document (the document's own update artifact, saved and read).
    `create#BusinessDataset` and `store#BusinessDataset` bind a registered policy, so the steward's flow is unchanged.
  - R2 (medium, mr-moqui; F145 decided, fail closed): a disabled or terminated owner who still held the index still vouched
    for an alias's readers (run: both read). The owner clause now needs the owner's account open
    (`user::user_account_closed`: disabled for good or past the end date, as a session's refresh, a schedule and an alert rule
    stop; a tarpit lock does not close it).
  - R3 (medium, mr-moqui): the owner clause could be turned around by a hand-over. `transfer#DefinitionOwner` (Admin's
    offboarding, `REPORT_OWNER_CHANGE`, or an owner's own schedule) moves every definition a schedule references that the
    leaving owner owns, a dataset too: a steward's alias of `otel_logs` that had stopped answering (a row older than the rule,
    a grant since withdrawn) would become an administrator's and answer its group again under the steward's filter. A telemetry
    alias now goes only while the owner it leaves holds the index (their account may be closed: a departed holder's alias is
    what a hand-over is for); left behind, it answers a holder only, and the transfer is refused when the new owner cannot
    read it. Read from the code before the fix; after it, run both ways (the steward's alias stays theirs and refused while
    the schedule and its dashboard go to the administrator; a closed holder's alias goes and answers its group again).
  - R4 (low, mr-moqui; F147 closed): `business_documents` counts the document of a business dataset's own id when it names
    none, as the engine reads it. It was not a bypass (such a dataset is never admissible, and its reader needs the document's
    DataDocumentUserGroup row), but the governed set now follows `alias::target`.
  - mr-boss: `InsightsDatasets`' feature also refuses `insights.steward` the business body with no policy over
    `MantleSalesOrderPart`. Monitoring "Dataset aliases" and Attack-Surface say R1 to R3.
- **Checked, holds** (each run unless marked read):
  - what a body reads is decided once (`alias::target`) for the save, the read and the search, and the search runs over the
    resolved documents, never the body's text: `indexName` as a list, `OTEL_LOGS`, `otel_*`, `*`, `otel_logs,otel_spans`, a
    leading space, `documentType` as a list, `OTEL_LOGS`, a lower-cased document id, another dataset's id or an alias's id as
    the document: each saves and reads nothing ("viewer may not read dataset"); `monitor_annotations` as a document,
    `otel_errors`, `browser_replays`, both `indexName` and `documentType`, the business index in another case
    (`documents_in_index` folds case), an unfed business document: refused at save; `index:otel_logs`, `index:<business
    index>`, the document and `otel_logs` by their own ids, another's dataset and `admin-access-log`: refused by their own
    artifacts; a business body with no document: saved, reads nothing;
  - saves: a non-owner's save over a holder's alias ("only the owner"), a copy of it, a restore of a version older than the
    rule, an import: refused; a git pull is the same `save` as the sync's user (read); a row written past the save is refused
    by `query#Documents`, `run#Query` and `get#Dataset`, and left out of `list#Datasets`;
  - reads (read): every reader calls `dataset`/`resolve_dataset` (rows, aggregations, drill, exports, schedules' scope and
    render as the owner, alert evaluation as the owner, annotation sources, `find#BusinessDatasets`); the incident, regression
    and replay services read fixed indexes under their own permissions; `get#AccessLog` reads the constant `admin-access-log`
    with authorization off (AdminAudit passes); no Insights service turns authorization off;
  - the shipped clause is the id of a file in a component's `report/` (`is_shipped`), read before any saved row, and no save
    takes a shipped id: a row's `component` or `readOnly` column is not read for it (a stored row marked read-only and
    `framework` over `otel_logs` is refused to a non-holder as any other);
  - the owner is the row's `ownerId` column, which only the owner's own save, `transfer#DefinitionOwner` (R3) and
    `transfer#AlertRuleOwner` (silences and mute timings only, by type) set; an unknown or empty owner holds nothing;
  - no `unwrap` or panic on a database path; the refusals name only the index or document the caller named.
- **Tests** (Debug, rebuilt after the fixes, `--nobuild`): `cargo test -p moqui-report` 94 of 94, `cargo clippy -p moqui-report
  --all-targets -D warnings` clean; framework BusinessDatasets (its alias feature now also the business body with no policy,
  saved and stored, and a closed holder's alias), ReportDrill, ReportAudience, BusinessAlerts, ReportAnnotations 24 of 24
  (4.1 s); tools ReportMounts 2 of 2; mr-mantle SalesReports and BusinessEvents 5 of 5; mr-boss InsightsDatasets, InsightsAccess,
  InsightsDashboards, InsightsSettings, InsightsAlerts, InsightsDelivery and AdminAudit 31 of 31 (14.5 s). Prettier clean on the two specs; rustfmt on `alias.rs`
  only. Not run: the full suites, moqui-host's `report_` tests, any acceptance test.
- **For the lead:**
  - F145 is decided as R2 (the user may still want it otherwise: an alias a departed administrator shared now stops for
    its group until `transfer#DefinitionOwner` or a copy by a holder); F147 closed (R4); F146 and F148 stay open
    (R2 adds one account read by key to the uncached owner check: acceptable until a dataset list is slow);
  - behaviour change: a saved business dataset with no registered policy bound (in review, never admissible) is now read and
    saved only by a holder of its document's own update artifact (`ADMIN`), not by a pattern steward; none is shipped;
  - R3's refusal reads "the new owner may not read this report or one of its sources" when a left-behind alias is not shared
    with the new owner: correct, but the offboarding screen could name the dataset;
  - open, the steward's by design: a steward picks any registered policy and its field for a registered feed's document, so
    `MantleOrganization` over a field other than the owning organization scopes rows by that field; the registered policies
    refuse expressions, and design §17 item 6 (field and use classes) is where a per-document policy would go;
  - merge: mr-moqui touches `alias.rs`, `business.rs` (`check_admitted`, `check_governed`), `definitions.rs`
    (`business_documents`), `delivery.rs` (one hunk in `transfer_definition_owner`), Monitoring.md, Attack-Surface and
    BusinessDatasets.spec.js; mr-boss InsightsDatasets.spec.js and this note.

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
  (ScheduledReports). Acceptance, written and not run: `test/acceptance/Insights/InsightsCatalogUsable` (3 features, `dependsOn`
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
- **Usable when** (`test/acceptance/Insights/InsightsHomeUsable`; rewritten in the P5 review to what is registrable, F68):
  `insights.reader` opens Home and sees ORG_ZIZI_RETAIL's orders and order value by currency (invoiced revenue waits for
  an admitted invoice dataset, F67) and no count from an app they cannot read; a Warehouse user with a selected
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
    queue cards (F29, F68).
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
    never a zero (F70).
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
  sales queries ignore the first and the others the second. Invoiced revenue has no admitted dataset (F67).
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

  Acceptance, written and not run: `test/acceptance/Insights/InsightsHomeUsable`, 4 features, `dependsOn` InsightsDatasetsUsable:
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
- Findings (provisional): F66 to F71 in §6. Decisions: the §4 rows of Nov 7 (P5).
- For the lead:
  - the budget: mr-boss's share is InsightsHome's 0.8 s server;
  - the owners' Home summaries used as count services are heavy (F66); light per-card count services are the owners' fixes;
  - the usable-when's purchase approvals, put-away and past-due cases are not registered (F68);
  - BossSetupData's P5 block and AdminEntities.xml's entity are single appends at the end;
  - DigestPreview is P7's.

**Review Nov 7 (P5).** Fresh review of mr-boss 5afb001d; fixes caa3c006, b21e6792 and this note (branch `ins/p5`).
- Checked and kept: every count service is called as the viewer (`ownerCall`, no `disableAuthz`, its own transaction and
  error frame); a provider shows only when its route opens (`destinationOpens`) and its permission holds; no total; a request
  steers only `organizationPartyId`, checked by `get#Context`, while `countParameters`, the route and the filter are the seed's.
  `get#OperationFailures` reads the shipped `monitor-operations` definition and runs its query as the viewer, an engine error
  notice being a refusal or a failure, never a zero (F70); the provider opens only where `monitor/Operations` opens, so no
  telemetry reaches a non-Monitor user. `get#Home` reads every definition as the viewer; the panels' variables come from
  `get#Home` on the server (`report-embed` takes no request value), and the datasets' row filters apply under them.
  `store#HomeLayout` writes only the caller's `InsightsHome`, with the revision check, refusing another organization. The suite
  is read only, its panels over admitted datasets, the orders panel without recurring base orders. Home is rendered once in
  the regression suite (InsightsHome). The owners' scopes (F69) were read service by service: each counts the viewer's own
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
  - **R4** (low, F71) Insights' Dashboard fixes `vendorPartyId` with `organizationPartyId` when the dashboard declares it over
    Mantle's sales datasets; Home sets it only for such a dashboard, never for an arranged dashboard's supplier variable
    (b21e6792).
  - F68: the usable-when is rewritten above to what is registrable, as InsightsHomeUsable checks it.
- Recorded: F72 (Manufacturing's own Home cards), F73 (the refusal pattern is wide); F69 corrected (Manufacturing
  without a plant counts every plant, it is not left out); F71 done.
- Tests run (shared release binary, `--nobuild`, this worktree's runtime): InsightsHome (0.7 s), InsightsAccess, InsightsCatalog,
  InsightsDashboards, InsightsDatasets, ProjectsAccess, AdminRegistries, 34 of 34; InsightsHomeUsable (changed: the receipts
  route) with its dependency InsightsDatasetsUsable, 9 of 9; mr-boss's whole acceptance suite not run. `moqui lint --screens`:
  132 sites as before. Prettier clean.

- **Gate 1 suites (Nov 7, on master after Admin P1–P7, Insights P1–P5, the framework follow-ups and every review merged,
  the release binary rebuilt; nothing else running):** `./moq test-framework`: every spec feature passed; cargo failed
  only F38's known test (failing on master before this build); the framework's server specs 10.8 of 12 s, tools 2.6 of
  3 s, basic-comms 5.0 of 8 s; webroot's client specs 46.9 of 44 s, over its budget on a quiet run too (it was 45.9 s in
  Wave 1, before any Admin or Insights change reached webroot; Insights P2 added one browser case), so the budget is the
  user's call and not raised here. Standalone mr-mantle 1,934 passed, 2 failed (the baseline WorkTimeEntries and
  WorkTimesheets), 11 skipped. `mail_capture_sends=true ./moq test-apps` 3,394 server and 19 client features passed, none
  failed; feature time mr-mantle 353.0 of 393 s, mr-boss 206.2 of 264 s server and 54.9 of 57 s client, mr-pass 14.4 of
  20 s, within every budget, so none raised. `moqui lint --screens` 132 sites, as before. The acceptance tests each
  phase wrote are not run (two were changed and run alone in review: AdminInvitationsUsable, InsightsHomeUsable with
  InsightsDatasetsUsable); `./moq accept mr-boss` is owed for them when asked.

- **Acceptance (Nov 7, after gate 1):** `mail_capture_sends=true ./moq accept mr-boss` on master (branch `adm/accept`), the
  first run of the acceptance tests the Admin and Insights phases wrote: server 517 features, 68 passed, 52 failed, 397
  skipped, 105 setup or cleanup failures; client 172, 170 passed, 2 failed. The cascade: AdminGroupsWalk's last feature
  gave john.doe a TOTP factor and set ADMIN's `requireAuthcFactor` and then signed in again with a password, which a
  factor refuses, so its cleanup (also a password login first) never put them back and every later spec's
  `login("john.doe")` failed with "a second factor is required"; the walk now signs in by `internalLoginUser` (as one who
  passed the factor) and restores the factor state in a `finally` and in a cleanup that restores before it logs in. With
  that, the rest were spec bugs, none a product bug but Insights F74: AdminGroupsWalk's second feature began with the
  first's membership still current (ended tomorrow by design), so it now starts from none; AdminFoundationWalk took the
  palette source's outright refusal for a failure (refused or no rows now both pass); AdminUsersUsable signed shared.staff
  in by password after giving it a factor (now `internalLoginUser`), found its users in an unfiltered page of 50 by name
  (now by username) and reset a demo identity with no email address (Identity.js NO_EMAIL; the spec gives it one and
  takes it back); AppStructure's placeholder floor 39 to 30 (Admin's Home, Users, Settings, Data, Integrations and
  Organizations, Insights' Home, Settings and FlowMap replaced); InsightsFoundationWalk read P1's Home empty text, which
  P5 replaced, and found insights.admin's Report builder failing (F74, fixed); InsightsDashboardsUsable expected no
  "No data" anywhere though P3 admitted the Commerce panels' datasets (now the orders panel alone, which says not
  available), could not save its copy because the served demo leaves `mantle-sales-orders` waiting for review (F41: the
  steward now admits it in the walk) and filled "Copy title" for "Title" (exact label). Two were time of day, not this
  build: CustomerServiceAssignmentWalk's agents work on the team's weekday hours (CS P4), so on a Saturday evening neither
  was in hours (the walk now gives them an around-the-clock calendar and puts them back), and CustomerServiceOrdersWalk
  computed StockAtDate's day under two users' zones, a day apart after 18:00 Chicago (now once). ManufacturingScheduleWalk's
  drag (the dialog still fading in when its buttons were counted) failed once and passed on both reruns, unchanged.
  Fixed in mr-boss on `adm/accept` (one commit, "Admin and Insights acceptance: ..."). Final: server 517 of 517 passed,
  client 172 of 172; the regression InsightsAccess and InsightsDashboards pass; `mail_capture_sends=true ./moq
  test-apps` 3,394 server and 19 client features passed; `moqui lint --screens` flags nothing in Insights.

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

**Built Nov 10 (P6).** mr-moqui 64aabb1c, mr-mantle 47a6d628, mr-boss 70304a0a (branch `ins/p6`).
- **The framework** (mr-moqui `docs/tools/Monitoring.md` "Business events", "Semantic guards", "Drill"):
  - **Business events** (`crates/moqui-report/src/annotations.rs`; F13, F31): `create#Annotation` takes the source `business`
    with `organizationPartyId`, `event`, `recordType`, `recordId`, `link` (a path on this server) and `eventKey` (one marker per
    key and time), a text of at most 255 bytes and no technical scope. It needs the artifact
    `org.moqui.report.annotation.business` (`ADMIN`'s, `REPORT_BUSINESS_ADMIN` in MonitoringSecurityData); `MONITOR_INGEST` does
    not write one. Reading is by registered sources: a `ReportAnnotationSource` enumeration names a dataset over the
    annotations, and a dashboard with a panel over a business dataset reads each source as the viewer (its artifact and row
    filter decide; only `business` markers are taken) and adds the markers to its panels. The technical marker query leaves
    business events out. The annotations mapping gains four fields (moqui-core `search/telemetry.rs`, added to an existing
    table in place).
  - **Semantic guards** (`semantics.rs`; INS-03), for a business dataset's query from what its `fieldDefaults` declare, for
    every caller: `unitField` (`UNIT_MIXED` when the records hold several units and the query neither groups by the unit field
    nor is filtered to one; a count is exempt), `ratio` (`RATIO_AGGREGATE` for a sum or an average), `nonAdditive`
    (`NONADDITIVE` for a sum across a listed dimension that is neither a group nor pinned), and a bounded page of records
    (`bounded_result` notice; `BOUNDED_RESULT` for a total, reduce, groupBy or pivot of it). A dataset whose definition says
    `rows: "restricted"` gives aggregates to its readers and records only to a holder of `org.moqui.report.rows.<id>`
    (`ROWS_RESTRICTED`; query#Documents, a documents query, top-hits and a drill's records).
  - **Drill** (`drill.rs`; INS-04): `ReportServices.get#Drill` takes a definition, a panel, a query index, the range, the
    variables and the buckets chosen, never a query. It runs the panel as its dashboard does, takes each bucket's predicate from
    the engine's own result (`config.bucket.filters`, so "Other" and missing keep theirs) and answers the saved query narrowed
    by them: the panel's frames, the dataset's dimensions, a breakdown, and a page of records with the query's columns, total
    and bounded. No record is fetched for a viewer without the records; an unread panel answers unavailable with its reason.
  - **The mount** (P0's "other escapes", the drill part): `reportLinks.drill` reaches the dashboard as `appLinks.drill`, and
    each panel's menu offers Drill in the browser (WebrootReport.js) and the terminal (moqui-tui `components/report.rs`),
    opening the app's drill screen with the dashboard, the panel, the range and the variable values. Tools mounts none.
- **Mantle**: `mantle.party.BusinessEventServices.record#BusinessEvent` over `BusinessEvents.js` makes a marker from the stored
  record (PriceListPublished: a published list with an organization; PromotionStart: a dated promotion, a band, in its store's
  organization; PeriodClosed: a closed run, named by the period), never from its caller, and writes it with authorization off;
  a failure is logged and answered. `publish#ProductPriceList`, `store#Promotion` (a start date set, or dates or description
  changed) and `close#Period` register it on commit through `register`, which never fails the owner. The dataset
  `mantle-business-events` (the annotations, `business` only, scoped by `get#OrganizationRowFilter` on `organizationPartyId`)
  is registered as the `ReportAnnotationSource` MantleBusinessEvents (MonitoringSalesSecurityData).
- **BOSS services** (`service/ironstone/insights/`, each `allow-remote="false"`):
  - `DrillServices.get#Drill` (Drill.js): `INSIGHTS_VIEW`; the organization in scope fixed over any variable sent
    (Insights.js `scopeVariables`, the rule of Insights › Dashboard), a requested organization only when it is the user's; the
    engine's answer with the measure's registered meaning (`get#Metric`), the panel's buckets with the link that chooses each,
    the breakdown, and each record's query columns and Insights record screen. A refusal that would say whether a definition or
    dataset exists is "not available".
  - `DrillServices.get#Record` (Records.js): the record contexts' one read (F16). Each record type names its admitted sources
    (dataset, key field, shown columns) and its owners' screens; a source is read through `query#Documents` as the viewer in
    its own transaction, an unread dataset is omitted, and owner links are offered only where the route opens
    (Admin.js `destinationOpens`) and only for a record a source showed.
  - `AnalysisServices.get#AnalysisOptions`, `get#AnalysisResult`, `store#Analysis` (Analysis.js): `INSIGHTS_AUTHOR` or
    `INSIGHTS_DATASET_EDIT`; typed choices checked against the dataset's own fields, run through `run#Query` as the author; a
    guard's refusal is the answer's code and reason; a saved analysis is a library panel (private or one of the author's own
    groups, as ShareDashboard), optionally placed on one of their own dashboards by reference.
- **Screens.**
  - `Insights/Drill` (hidden; DrillMeaning, Breakdown with the panel's buckets and one more dimension, SourceRows with paging,
    Back to the dashboard, Clear the selection, Open as analysis for authors).
  - `Insights/ReportBuilder/Analysis` (the second tab, Datasets now third; AnalysisSource, the refusal box, AnalysisResult, the
    SaveAnalysis dialog, whose save opens PanelDetail, the framework editor, as AnalysisSteps).
  - `Insights/Records` (hidden) mounting Shared/OrderDetail, Customer360, Supplier360, Product360, RequestDetail,
    WorkItemDetail, ShipmentDetail, FacilityDetail, EquipmentDetail and InvoiceDetail. Each shared screen gains a screen
    condition (`appRoot != 'Insights'`) and fail-widgets showing `template/InsightsRecord.xml`: the header, the sources as
    lists, the owners' links and Back to the report; no form, transition or action. The four tabbed screens show it as the
    subscreen `Shared/InsightsRecord.xml`, which Insights' links name, and Product360 and Supplier360 skip their catalog context
    for Insights. The owners' widgets are untouched.
- **Access** (`data/BossSetupData.xml`, one block appended): `BOSS_INS_REPORT_DRILL` (`get#Drill`, ALWAYS for the six groups
  that read, past BOSS_INS_REPORT_ENGINE's deny), `BOSS_INS_EVENTS` (the `mantle-business-events` dataset, view, for the five
  groups that read data), `BOSS_INS_ANALYSIS` (Analysis and its `saveAnalysis`: the root user group and the administrator
  denied, a non-inheritable ALWAYS for the author and steward). Insights.js: the capability `analysis`, the links of Analysis,
  Drill, PanelDetail and the ten record screens, `reportLinks.drill`. No Insights group holds the business annotation
  artifact or any records artifact.
- **Specs.**
  - framework `ReportDrill` (4 features, 0.5 s: the fixtures; the chosen bucket's records in the viewer's scope, an Other
    bucket, a breakdown, a bounded page, a bucket not in the result and a field that is no dimension refused; restricted
    records and an unadmitted panel; the four guards with their passing forms) and `ReportAnnotations` (2 features, 0.1 s,
    `dependsOn` ReportDrill: the business source refused to a holder of `MONITOR_INGEST`, its checks, one marker per key; a
    registered source's markers on a dashboard in the viewer's scope only).
  - moqui-report unit tests `semantics::tests` (3); moqui-tui `a_mounted_dashboard_links_...` and webroot's
    `a dashboard mounted under another app ...` extended with Drill.
  - Mantle `test/party/BusinessEvents` (1 feature, 0.3 s: the three events from their records, one marker, a draft, a list
    without an organization and a missing record write nothing).
  - BOSS `InsightsRecords` (5 features, 1.8 s, `dependsOn` InsightsDatasets: the drill's scope for a Retail and a Services
    reader, a forged variable and another organization; OrderDetail's one qvt render under Insights, another organization's
    and a missing order alike, the order's own Approve refused; Analysis' one qvt render with the mixed-currency refusal, the
    grouped result, a reader, a foreign field and a foreign group refused, the saved panel; a business event's marker by
    organization and the write refused to an author). `InsightsAccess`: the `analysis` capability by group.
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsDrillUsable` (3 features, `dependsOn`
    InsightsDatasetsUsable: the "usable when").
- **Tests run** (this worktree's Debug binary, `--nobuild`): framework ReportDrill, ReportAnnotations, BusinessDatasets and
  tools ReportMounts, DocumentExport 15 of 15 (framework 1.3 s of 12 s); webroot WebrootReport offline 49 of 49; Mantle
  BusinessEvents, OrganizationRowFilter, SalesReports 10 of 10, and AccountingPeriodClose, ProductPriceLists, StorePromotions
  26 of 26 with BusinessEvents (the hooks' owners); BOSS InsightsAccess, InsightsDashboards, InsightsDatasets, InsightsCatalog,
  InsightsHome, InsightsRecords, ProjectsAccess, AdminRegistries and sixteen owners' specs of the shared screens
  (PurchasingOrders, CommerceOrders, CustomerServiceOrders, PurchasingSuppliers, ProductsSharedContext, CommerceAssortment,
  ProjectRequests, CustomerServiceCases, WorkItemDetail, PurchasingReceiving, WarehouseFacilities, ManufacturingWorkCenters,
  AccountingFixedAssets, Billing, AccountingReceivables) 152 of 155: CustomerServiceOrders' three fail on Debug only (its
  demo order is not made, "stack overflow", F37) and pass 6 of 6 on the shared release binary. Cargo: `clippy -p moqui-report
  -p moqui-tui --all-targets -D warnings` clean, `test -p moqui-report` 80 of 80, `test -p moqui-tui` all pass, moqui-host
  `--test it report_` 9 of 9. `moqui lint --screens`: 132 sites, as before, none in Insights or the shared record screens.
  Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- **Rendered by hand** (a throwaway spec, not kept): the ten record screens under Insights in qvt and tui; Drill in qvt, tui
  and html; Analysis in qvt and tui; Insights › Dashboard's `appLinks.drill`. A probe after the owners' specs found the
  on-commit markers of eight price lists and six period closes.
- **Budget shares**: framework server 0.6 s (ReportDrill 0.5, ReportAnnotations 0.1); mr-mantle 0.3 s; mr-boss server 1.8 s
  (InsightsRecords); no client spec added (webroot's case grew by one click).
- Inventories: no ss-inventory or usl-inventory row is implemented by P6 (the services are new).
- Design edits: design-insights §2 (Drill's archetype), §4 Business annotations and Drill, §5 Analysis, §10 (each "As built");
  design-crosscut §3.6 (the Insights rows as built); the owners' annotation lines in design-products §1.3, design-commerce §3
  and design-accounting §13. mr-moqui `plans/Remaining-Work.md` (the report-engine row).
- **Findings** (provisional, for the lead to number):
  - F75: the annotations index keeps a typed column per mapped field, so an organization could not be filtered until it
    was mapped. Four fields added (the framework adds columns to an existing table in place); `link` stays unmapped.
  - F76: `registerOnCommit` checks the caller's authorization for the registered service at once, and BossSetupData denies
    `create#Annotation` to every member of `BOSS_INSIGHTS`, so an owner registering it directly would fail its own change for
    a user who is also in Insights. Mantle registers its own service, which writes with authorization off, and a failed
    registration or write is logged, never thrown.
  - F77: there is no promotion start event (F31) and the annotations are kept by id and time, so a promotion whose start is
    moved leaves its earlier band. Kept; a delete of a keyed business marker would close it.
  - F78: the engine already records each bucket's exact predicate in its frames, so the drill takes predicates from the
    engine's own result and needs none from the client. A breakdown's buckets are therefore shown, not chosen.
  - F79: before P6 an amount summed across currencies lost its unit and showed a number. A static refusal would have
    refused every shipped panel that sums an amount without its currency (Mantle's `mantle-sales`, Commerce's Store
    operations) even with one currency in use, so the guard refuses only when the records hold several units. On an instance
    with a second currency those panels now say `UNIT_MIXED`; grouping them by currency is their owners' fix.
  - F80: Insights holds no domain permission, so an "Insights branch" over an owner's read would show nothing to a plain
    reader. The record contexts read the admitted datasets instead; five record types have no admitted source yet, and
    Products' SharedContext.js is not changed (the plan named it).
  - F81: a shared screen's transitions are authorized by the screen's location, not its mount, so they cannot be denied
    for the Insights mount without denying them in the owner's app. They, and the owners' tabs, stay reachable by URL under
    `Insights/Records/` and are refused or scoped by their owners' own checks (InsightsRecords posts Approve as the reader).
    A read-only mount is a framework ask (Remaining-Work).
  - F82: a screen's default subscreen is chosen from the request before the root's always-actions set `appRoot`, so a
    `conditional-default` cannot see Insights (Customer360's own works only where `appRoot` is sent as a parameter). Insights'
    links name the `InsightsRecord` subscreen.
  - F83: `mantle-sales-items` carries cost and margin fields (`acquireCost`, the issued cost and margin totals), which every
    reader of the admitted dataset reads in Explore and a direct query (P3's note: no field classes). The drill and the record
    contexts show named columns only; the dataset itself is F58's open item.
  - F84: a registered domain drill service (design §4) is not built: a service-source panel answers that its value has no
    drill, and `MetricRegistration.drill` is unused.
  - F85: a record's status and type show as their ids (the documents' values); names need the datasets' lookups applied
    to document rows.
  - F86: the framework's `ReportUserGroups` policy has no administrator bypass, so `ADMIN` reads no row of a dataset
    scoped by it; Mantle's organization policy has one.
  - F87: the bar of a chart still filters the dashboard when clicked; Drill is the panel menu's item, with the buckets
    chosen on the drill page.
- **Decisions** (for §4): the business source is its own artifact and is read through registered source datasets, on
  dashboards over business data only; the semantic guards are declared in `fieldDefaults` and the unit guard is decided on the
  records; a dataset's records can be restricted apart from its aggregates; `get#Drill` is a reading operation of every group
  that reads; the record contexts' authority is the admitted datasets; Drill is a page, not a dialog; an analysis is typed
  choices saved as a library panel, with the framework editor as its steps.
- **For the lead:**
  - budget shares as above: framework 0.6 s, mr-mantle 0.3 s, mr-boss 1.8 s server;
  - merge: BossSetupData's P6 block is one append at the end (Admin P8 appends there too: keep both); mr-moqui's
    `ReportSetupData.xml` and `MonitoringSecurityData.xml` each gain one block (the first at the end, the second before the
    permissions); `ReportServices.xml` gains `get#Drill` after `create#Annotation`; `Datasets.xml`'s menu index is 3;
  - an existing instance loads ReportSetupData, MonitoringSecurityData, Mantle's MonitoringSalesSecurityData and BossSetupData
    again (Monitoring.md "Upgrading");
  - the user's call: F79 (refusing mixed currencies only when the records mix them, or always); F80 (the record
    contexts from admitted datasets, with supplier, work item, shipment, equipment and invoice not available until a dataset
    is admitted for each, or owner reads behind owner permissions); F81 (owner transitions reachable under the Insights
    mount for a user who holds the owner's permission);
  - not built: a registered domain drill service (F84), a catalog report or a conversion measure as an analysis' starting
    point, the drilled records' export (DatasetView's export serves), a marker's link resolved to a screen in the browser's
    marker list (the marker carries `recordType` and `recordId`);
  - `cargo fmt` on moqui-core reformats some sixty files this build did not touch; only the files changed here were
    formatted.

**Review Nov 10 (P6).** Fresh review of mr-moqui 64aabb1c, mr-mantle 47a6d628 and mr-boss 70304a0a/136f77f6; fixes mr-moqui
599f0b65, mr-mantle 9b6fa188, mr-boss fc1d926c and this note (branch `ins/p6`).
- Checked and kept:
  - **`get#Drill`** (drill.rs): the definition is read as the viewer (`definitions::read`), the panel is run by
    `dashboard_frames_filtered` as its dashboard runs it, and the request gives only ids, a range, variable values, bucket
    names and values, one dimension name and a page. A bucket's predicate is the engine's own `config.bucket.filters` entry of
    the row the name and value match; a value that matches no row is refused; nothing sent is parsed as a query. The narrowed
    query keeps the saved `datasetId`, `query`, `queryString` and `filters` and only adds predicates. The dataset is resolved
    again (`dataset`: its artifact, admission and row filter as the viewer) and `documents_of` applies that filter, so a
    Services reader drills the same panel to Services' orders (InsightsRecords). `check_rows` runs before any record is
    fetched, in `documents_of`, in a documents query and for a top-hits aggregation, so an aggregate readable while its rows
    are not answers no row (ReportDrill). A breakdown dimension must be one of the dataset's mapped sortable fields. Selection
    8 buckets, span 200, page 100 (BOSS asks 20).
  - **BOSS `get#Drill`** (Drill.js): `INSIGHTS_VIEW`; the organization through `get#Context` (another organization refused);
    `scopeVariables` laid over the request's variables; a refusal that would name a definition or dataset is "not
    available"; rows carry named columns, never the document body.
  - **The semantic guards**: in `execute_query_inner`, so a panel, Explore, a direct `run#Query`, the drill's breakdown, an
    alert and a schedule are all held to them. The unit guard is decided on the records (F79): with one currency in the
    records no shipped panel changes: every refusal needs two units found in the query's records, the review's additions
    included (InsightsDashboards passes on the rebuilt binary; the other dashboards' specs were not run). Ratio and nonadditive are static; a bounded page refuses totals,
    reduce, groupBy and pivot.
  - **Business annotations**: the `business` source needs `org.moqui.report.annotation.business` (ADMIN only; no wildcard grant
    reaches it; `MONITOR_INGEST` does not write one; BOSS denies every ReportServices operation to the Insights groups, so an
    author is refused, InsightsRecords). Mantle writes from the stored record (name, time, organization, key; no amount, no
    caller text) with authorization off, after the commit, in a transaction of its own; `register` and `record` catch and log,
    so the owner's change stands (the owners' specs pass unchanged, 26 of 26). Reading is through registered source datasets
    as the viewer, `source = business` forced, fixed fields copied (no `created_by`); `mantle-business-events` is scoped by
    `get#OrganizationRowFilter` on `organizationPartyId`; the technical marker query leaves business events out. A marker
    carries `recordType` and `recordId`, no link: the app resolves it by the viewer's permissions.
  - **Mantle's hooks**: one `register` call at the end of `publish#ProductPriceList`, `store#Promotion` (dates or description
    changed, or created with a start) and `close#Period`; no parameter, result or refusal of those services changed.
  - **Access rows**: `BOSS_INS_REPORT_DRILL` is ALWAYS on the one service `get#Drill`, not inheritable to anything else of
    note (it is a service, and what it calls it calls natively, checking each dataset itself); `BOSS_INS_EVENTS` is view on
    one dataset; `BOSS_INS_ANALYSIS` is the non-inheritable ALWAYS over the root deny, as the editors. No Insights group holds
    a rows or business-annotation artifact.
  - **Analysis**: `INSIGHTS_AUTHOR` or `INSIGHTS_DATASET_EDIT` on each service; every field is checked against the dataset's
    own fields; the query is built from typed choices and run as the author; a share group must be the author's; a dashboard
    target must be the author's own.
  - **Spec leanness**: InsightsRecords renders `Records/OrderDetail` once (qvt) and `ReportBuilder/Analysis` once (qvt); no
    other regression spec renders either under Insights; the refused paths are posts that never reach a screen. Its five
    features are kept: the first is the fixture, the marker feature checks BOSS's own grant and deny (the engine's rule is
    ReportAnnotations'). 1.9 s.
- Fixes:
  - **R1** (high, access; F81) The ten record mounts were read only by their widgets only. The Insights root's grant is an
    inheritable ALLOW (`BOSS_INSIGHTS_ROOT`, with `MANTLE_USER_ORG`), which covers every screen, transition and service call
    below it, so `Insights/Records/<screen>/<transition>` ran the owner's transition with only the owner service's own check
    in the way (some 170 transitions and includes across the ten screens, none audited for a caller without the owner's app),
    and `Insights/Records/<screen>/<owner tab>` rendered the owner's tab through the fail-widgets' `subscreens-active` with the
    parent's actions skipped (in the probe: blank shells, one null error in Supplier360/Overview, the catalog's own refusal on
    Prices; nothing leaked in the sixteen paths tried, by each tab's incidental conditions, not by a rule). No authz row can
    close it: a transition's artifact is the shared screen's location, so a deny for an Insights group would deny it in the
    owner's app too. `screen/Insights/Records.xml` now refuses, in its always-actions (which run before any transition or
    render below it), every path below a record screen but the `InsightsRecord` subscreen, with `RECORD_READ_ONLY`, for every
    user. Probed as `insights.reader`: the ten record contexts render in qvt (the four tabbed ones as `InsightsRecord`;
    Customer360's also in tui and html), the menu data builds, and the owner tabs tried (twelve, of Customer360, Product360,
    FacilityDetail and Supplier360), `facilityChoices`, `confirmationFile`, `updateFacility`, `cancelOrder` and `approveOrder`
    are refused before they run. A tabbed record screen opened without
    `InsightsRecord` (its default tab is chosen before the app is known, F82) is refused too, where it was blank.
    InsightsRecords asserts a transition and a tab. Design §10's "As built" and the block comment in BossSetupData say so.
  - **R2** (medium, INS-03) The unit guard passed a sum beside the unit's group instead of under it (the raw `aggs` form:
    `{currency: terms, total: sum}`), a group of another field that only carried the unit field's id, and, once grouped, the
    rows added again by `subtotals`, a footer `totals`, or a `reduce`, `groupBy` or `pivot` step. `check_units` now takes the
    groups above each measure, counts a column's per-row units as units, and refuses those derived sums (`UNIT_MIXED`); count,
    first and last pass, as does a groupBy or pivot that keeps the unit and totals nothing across it. Unit tests and two
    assertions in ReportDrill. Only where the records hold two units.
  - **R3** (medium, restricted values; F83) A drill's columns are the saved query's measured fields, so a panel that sums
    `itemCostTotal` or a margin gave every reader the cost of each record, and any cost field could be asked as the breakdown
    dimension. Drill.js drops cost and margin fields from the columns and the dimensions and refuses such a breakdown unless
    the viewer holds `PRODUCT_COST_VIEW`. By field name (`/cost|margin/i`), since a dataset has no field classes (F58). Not
    covered by a spec: no admitted fixture dataset carries a cost field.
  - **R4** (low) `get#Drill` paged without a bound on the offset; it now pages through the first 10,000 records.
  - **R5** (low) `record#BusinessEvent` looked its event up with `events[p.event]`, which finds `constructor`; own names only.
- Recorded, not fixed:
  - F83 remains for Explore, a direct query, Analysis' measure list and a panel's own aggregate: an admitted
    `mantle-sales-items` gives its readers `acquireCost`, `itemCostTotal` and the margins (F58's field classes).
  - The unit guard does not see a `calculate`, `runningTotal` or `percentOfTotal` step across rows of several units, an
    expression over two queries, or a sum the browser's stat reduction makes; a `filter` aggregation to one unit is refused
    (conservative). `distinct_units` failing leaves the fallback unit and no refusal (logged).
  - Chatter and RecordFiles are mounted under the Insights root since P1 (`Insights.xml`), with the same inheritable grant
    and the hosts' own access checks; not P6's, and not narrowed here.
  - A drill's variables other than the fixed scope are the viewer's, as on Dashboard; the row filter is the guard.
- Tests run (this worktree's Debug binary, rebuilt for R2 and R4, `--nobuild`): framework ReportDrill, ReportAnnotations,
  BusinessDatasets 12 of 12 (1.2 s); `cargo test -p moqui-report` 81 of 81, clippy `-D warnings` clean; Mantle BusinessEvents,
  ProductPriceLists, StorePromotions, AccountingPeriodClose 26 of 26; BOSS InsightsRecords, InsightsAccess, InsightsDashboards
  with InsightsDatasets 18 of 18 (InsightsRecords 1.9 s); `moqui lint --screens`: none flagged in Insights or the shared record
  screens. Prettier clean on the changed JavaScript. A throwaway probe spec (not kept) for R1. Not run: the suites, any
  acceptance test (InsightsDrillUsable is unchanged and its Approve check still holds: the post is refused earlier).
- For the lead:
  - F81 is closed by R1 for every user, which also settles its user's-call item the conservative way: a user who holds
    the owner's permission works in the owner's app, by the link. A read-only mount in the screen definition (in place of the
    path check) stays a framework ask;
  - R2 widens what `UNIT_MIXED` refuses on an instance with a second currency: a table grouped by currency with a footer sum
    is refused whole, not shown without its footer. With F79, the user's call;
  - R3's name pattern is a stopgap for F58;
  - merge: `Records.xml`, Drill.js, Records.js, the P6 block's comment in BossSetupData, design-insights §4 and §10; mr-moqui
    semantics.rs, drill.rs, one line of lib.rs, Monitoring.md, ReportDrill.

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

**Built Nov 10 (P7).** mr-moqui b0668cf9 and mr-boss (branch `ins/p7`; Mantle is not touched).
- **Checked first** (P0's "The legacy data", and the plan against the code): F28 holds (one ScreenScheduled row,
  BOSS_DEMO_MY_TASKS, john.doe's saved find of Commons Tasks, ended; no schedule names a group; the FormListFinds are list
  views); F6 as found (`create#Schedule` copies its recipients unchecked, one comma-joined message); the instance ceiling is
  Admin P8's `report.groupRecipientCeiling` through `get#InstancePreference` (the plan's "200 until Admin P8" is past); Admin
  P6's owned-resource contract and `LifecycleParticipant` rows are as its Built note says.
- **The framework** (mr-moqui `crates/moqui-report/src/delivery.rs`, `schedule.rs`; docs/tools/Monitoring.md "Report
  delivery"; F6, INS-06, INS-11):
  - **The scope fingerprint** (`scope`, `scope_as`): a hash of what the user reads of the definition and everything it
    references (each named read or unread), the documents of each dataset they may read, each dataset's resolved row filter
    (`rowFilter`, `contextFilters`, the `rowFilterService`'s answer, in a form that does not depend on the order of its
    values) and, for a dataset whose records are restricted, whether they hold them. It is computed in a context of its own
    signed in as that user, the owner's too, so a screen's inheritable grant or a disabled authorization never enters it. A
    service source is not comparable.
  - **`check#ReportAudience`**: the named users and the members in date of the named groups, each eligible or not with a
    reason code and words (`not-shared`, `scope-differs`, `not-comparable`, `denied-source`, `inactive`, `external`,
    `no-address`), never the other user's grants; the cap asked (50 without one) held under the instance ceiling. Recipients
    other than the viewer need the engine's own artifact `org.moqui.report.delivery.group` (`REPORT_DELIVERY_ADMIN`, ADMIN's).
  - **`store#Schedule`**: a business schedule of the viewer's own, email only; the server sets `deliveryMode` (personal or
    group, recipients in `ReportScheduleRecipient`); an active group schedule is saved only when every recipient passes
    (`RECIPIENT_REFUSED`, naming each with its code; a group's member without an address or an active account is skipped at
    the run instead) and within the cap (`RECIPIENT_CAP`); `expectedRevision` (`STALE_REVISION`); pending deliveries of the
    earlier revision are cancelled. `pause#Schedule` resumes a business schedule only when its recipients pass again;
    `list#Schedules` answers the mode, recipients, revision, pause reason and last run (its earlier fields kept).
  - **The run** (`schedule.rs` `deliver`, `delivery.rs` `send_each`): a schedule is a business one when `store#Schedule`
    saved it or its definition reads a business dataset, whatever wrote its row, so `create#Schedule` and an entity write do
    not bypass it. It opens a `ReportOccurrence` (keyed by the schedule and the cron instant, or a Send now; an earlier run's
    unsettled deliveries become uncertain), and for each recipient, just before their message, checks the lease, the owner
    and the schedule again and the recipient's fingerprint again, then sends one message to their one address or records why
    not in a `ReportRecipientDelivery` (sent, skipped with `scope-differs` and the other safe codes, failed, uncertain by the
    transport's `deliveryOutcome`). One recipient's failure does not stop the others. One render a locale serves every
    recipient (`renderCount`). The owner goes first under the cap; the rest past it are `over-cap`. A technical schedule
    takes the old path unchanged (its mail call is the one shared function).
  - **Reads**: `find#ReportOccurrences` (the viewer's own schedules'; `received`, the deliveries to the viewer;
    `administrative`, every owner's for a holder of `ADMIN_TRANSFER_VIEW`, status and counters without titles, for Admin
    P16), `get#ReportOccurrence` (each recipient's outcome to the owner and that administrator; a recipient their own
    delivery alone), `get#RecipientReport` (no row keeps a report: rendered again as the recipient, and only while their
    fingerprint is the one the delivery was sent under; another's delivery id reads as missing).
  - **`retry#ReportRecipients`** (failed deliveries only, at the occurrence's revision, each recipient checked again; a
    changed schedule or definition is `DEFINITION_CHANGED`) and **`reconcile#ReportRecipient`** (an uncertain delivery
    settled by a person as sent, or failed and so retryable).
  - **Ownership**: a business schedule whose owner is inactive pauses at its run (`owner-disabled`); `find#OwnedSchedules`,
    `pause#OwnedSchedules` and `transfer#DefinitionOwner` carry the owned-resource contract, for the user themselves or a
    holder of `REPORT_OWNER_CHANGE` (new, ADMIN's). A transfer moves the schedule and the definitions it needs that the
    leaving owner owns to an active internal user who may store a schedule, reads every source and, for a group schedule,
    may deliver to a group (`NEW_OWNER_REFUSED`); it stays paused (`transfer-pending`), Send now and retry refused
    (`SCHEDULE_PAUSED`), until the new owner resumes it.
  - **Legacy** (`org.moqui.impl.ScreenServices.render#ScheduledScreen`): a screen schedule's user group is sent to only
    when its screen path is a registered `ReportLegacyAdapter` enumeration, then one message a member the saved find is
    shared with; the user's own delivery is as before.
  - A report's `commentary` prints under its title. Entities: `ScreenScheduled` gains `deliveryMode`, `recipientCap`,
    `pausedReason`, `versionNumber`; `moqui.report.ReportScheduleRecipient`, `ReportOccurrence`, `ReportRecipientDelivery`.
    Seed: the occurrence and delivery states, `REPORT_OWNER_CHANGE`, the `ReportLegacyAdapter` type (ReportSetupData);
    `REPORT_DELIVERY_ADMIN` (MonitoringSecurityData).
- **BOSS services** (`service/ironstone/insights/DeliveryServices.xml` over `Delivery.js`, each `allow-remote="false"`):
  `find#Schedules`, `get#Schedule`, `store#Schedule`, `pause#Schedules`, `send#Schedule`, `check#Audience`,
  `find#RecipientChoices`, `get#Delivery`, `retry#Recipients`, `reconcile#Recipient`, `get#OwnReport`, `preview#Report`,
  `get#Digest`, `store#Digest`, `store#DefaultDigest`, `get#DigestPreview`. Reading is `INSIGHTS_VIEW`, a schedule of one's
  own `INSIGHTS_SCHEDULE`, other people `INSIGHTS_DISTRIBUTE` (a person an Insights reader, a group one the distributor
  belongs to), a digest `INSIGHTS_AUTHOR` or `INSIGHTS_DISTRIBUTE`. The cap is 50 here until P10. Every write answers a
  refusal as `applied` false with `reasonCode` and `reason` (the engine's codes pass through; a refusal without a code is
  logged and shown as a plain sentence), so a screen shows it.
- **Screens.** `Insights/ScheduledReports` (a parent; its default `Schedules`: ScheduleFind with Mine, Shared administration
  and Received, ScreenScheduledList with Pause, Resume, Send now and a bulk pause that answers each schedule, NewSchedule),
  the hidden `ScheduledReportDetail` (the record header, EditScreenScheduled, ReportAudience with each recipient's result,
  OwnPreview as the caller's own panels and file, ScheduleRuns) and `ReportDelivery` (Occurrence, RecipientOutcomes with
  RetryRecipients as the selection action and Reconcile on an uncertain row, OwnArtifact); `Insights/ManagementDigest`
  (the digests, DigestComposition, DigestPreview, Schedule, Show on Home); Home's DigestPreview. The copied
  ScheduledReports and its detail are replaced; john.doe's copied scheduled find is listed under Mine and its timing,
  format and subject changed in ScheduledReportDetail, its row kept. `template/InsightsDeliveryTransitions.xml` (the
  recipient choices, the preview file, the own report file), `template/InsightsReportEmail.xml` (the message's body).
- **Data** (`data/BossSetupData.xml`, one block appended): BOSS_INS_LEGACY's last pattern row reloaded as a plain name (it
  denies nothing; as F65); `INSIGHTS_SCHEDULE` for the reader, author, steward and flow groups with their capability rows;
  `BOSS_INS_REPORT_OWN` (store, list, pause, send, retry, reconcile: ALWAYS for the five reading groups),
  `BOSS_INS_REPORT_DELIVERY` (the three reads, the administrator too), `BOSS_INS_REPORT_DISTRIBUTE` (`check#ReportAudience`
  and `save#Definition`, the distributor's), `BOSS_INS_GROUP_DELIVERY` (the engine's group artifact, the distributor's);
  the `BOSS_INSIGHTS_REPORT` email template; the lifecycle participant `insights.schedules` with `REPORT_OWNER_CHANGE` and
  `BOSS_INS_LIFECYCLE` for the identity operator and the administrator. `report/insights-weekly-digest.json` (a digest
  over the suite dashboard). `data/BossUsersDemoData.xml` (appended): mail addresses for seven Insights demo users.
  Insights.js: no legacy area left; four links. Registry.js: a digest opens in ManagementDigest from SavedReports.
- **Specs.**
  - framework `ReportAudience` (6 features, 1.0 s, `dependsOn` ReportDrill: the fixtures; a recipient whose row filter
    differs refused at save with a code, a private report `not-shared`, the cap, the group grant, a stale revision; one
    message a recipient with no shared address line, two renders for four recipients of two locales, a member who joined
    after the save skipped at the run, a recipient's own delivery and report and never another's, the administrative list
    without titles; a retry to the failed recipient alone, an uncertain one reconciled; a disabled owner's schedule paused
    at its run, the lookup and pause, a transfer refused to one who may not schedule and to a caller without the
    permission, accepted by a qualified owner, and resumed only once the recipients pass; a `create#Schedule` schedule
    over a business dataset held to the check). moqui-report unit tests: `delivery::tests` (3).
  - BOSS `InsightsDelivery` (4 features, 1.5 to 1.8 s, `dependsOn` InsightsDatasets: a reader's personal schedule and the
    same save with another person refused, the distributor's group, the Services reader refused as an answer naming them
    and the code, a foreign group and a person outside Insights refused, the administrator refused, the choices; Send now's
    two messages linking to Insights, the reader's own delivery and report, the author's delivery, the schedule and a
    Services reader refused, ScheduledReportDetail's one qvt render; a digest composed by the distributor and refused to a
    reader, an unread dashboard and a foreign group, Home's preview; Admin's `find#OwnedResources` with the participant's
    resource and steps, the pause, a reader refused the participant's services and as a new owner). `InsightsAccess`: the
    menu (nine entries, every user's), `schedule` for every reading group, list#Schedules and check#ReportAudience by
    group; its copied-screen cases removed with the screen. `AdminLifecycle` (Admin's): a disable now has Insights' pause
    step.
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsDeliveryUsable` (4 features, `dependsOn`
    InsightsDatasetsUsable: the "usable when", with a leaving and a succeeding distributor made there). The sweeps
    `AppStructure` and `TuiRender` gain the new screens' entries; `InsightsFoundationWalk` walks the one menu.
- **Tests run** (this worktree's Debug binary, `--nobuild`): framework ReportAudience, ReportDrill, ReportAnnotations,
  BusinessDatasets, ScreenQvt 36 of 36 (ReportAudience 1.0 s; framework 2.3 s of 12 s for the four report specs); tools
  ReportMounts, DocumentExport 3 of 3; BOSS InsightsDelivery, InsightsAccess, InsightsHome, InsightsCatalog,
  InsightsDashboards, InsightsRecords (with InsightsDatasets), AdminLifecycle, AdminAccess, AdminRegistries,
  AdminCapabilities 51 of 51. Cargo: `clippy -p moqui-report --all-targets -D warnings` clean, `test -p moqui-report` 84
  of 84, moqui-host `--test it report_` 9 of 9 and `scheduled_reports` 1 of 1 (the technical schedule's path).
  `moqui lint --screens`: 132 sites, as before, none in the new screens. Prettier clean on the new and changed JavaScript;
  rustfmt on the two Rust files. Not run: `./moq test-apps`, `./moq test-framework`, any acceptance test.
- **Rendered by hand** (throwaway probe specs, not kept): Schedules (each view, as the distributor, a reader and the
  administrator), ScheduledReportDetail (the owner's, another's, the legacy one), ReportDelivery (the owner, a recipient, an
  outsider), ManagementDigest (the list, a digest, a reader) and Home with a digest, each in qvt, tui and html; every
  transition as a post, with the rows after it; the preview and own-report files; a digest's commentary in the printed
  document; Admin's real disable of a throwaway distributor (the pause step done, the transfer step waiting, a reader
  refused as the new owner with the reason, a second distributor accepted, Send now refused until they resumed, then two
  messages); and a screen schedule with a group (nobody but its user without an adapter; with one, only the member the
  find is shared with, in a message of their own).
- **Budget shares**: framework server 1.0 s (ReportAudience); mr-boss server 1.5 to 1.8 s (InsightsDelivery; InsightsAccess
  is as it was); no client spec.
- Inventories: ss-inventory's MyAccount ScheduledFinds and EditScheduledFind rows are implemented. No usl-inventory row.
- Design edits: design-insights §2 (the list's route), §7 "As built", §15.2 (the delivery row); design-admin §4.1 (the
  participant as built). mr-moqui docs/tools/Monitoring.md ("Report delivery", Security, Upgrading) and
  `plans/Remaining-Work.md` (the report-engine row). mr-boss README's Insights line.
- **Findings** (provisional, for the lead to number):
  - F88: a row filter that names the viewer's own groups (the framework's `ReportUserGroups`) differs between users of
    different groups whose rows are the same, so they are not owner-equivalent; only users of the same groups are. Kept (the
    design compares resolved filters); Mantle's organization policy gives every user of the same organizations one filter.
  - F89: a service source decides its scope in its own code, which no fingerprint sees. A definition over one is not
    comparable and goes to its owner alone; a declared scope for a service source is a framework ask.
  - F90: a recipient must read the report itself, not only its data: a private dashboard or digest is refused for
    everyone else. The check says `not-shared`, apart from `scope-differs`, so its owner knows to share it.
  - F91: the Insights demo users had no mail address, so nobody could be delivered to; added. The demo has one
    distributor, so the acceptance test makes the one who leaves and the one who takes over.
  - F92: with the mail capture on no recipient's send can be made to fail, so the specs set a delivery to failed
    themselves; on a transport failure `send#EmailTemplate` answers `deliveryOutcome` (retryable, permanent or uncertain)
    and no message id, which the new path reads to tell a failure from an outcome that is not known.
  - F93: a definition's ranges are relative to the render, and the engine has no pinned clock, so a retry renders the
    period again and is refused when the schedule or the definition changed; a schedule has no time zone of its own (the
    scheduler's applies). Design §7's absolute period and explicit zone are not built.
  - F94: the engine's link in a report's message is Tools' `/apps/dashboards/Dashboard`; Insights' template rewrites
    it to its own Dashboard. A link base on the schedule or the mount is a framework ask.
  - F95: no report is stored, so OwnArtifact is a new render as the recipient, and "expires" and retention have nothing
    to apply to; stored private artifacts wait for Admin's retention policy.
  - F96: Admin's `AdminLifecycle` spec listed a disable's exact steps; Insights' participant adds a pause step to
    every disable, so its expectation gained `pause:UlstDone`.
  - F97: P1's `BOSS_INS_REPORT_SCHEDULE` still grants the distributor `create#Schedule` (owner mode) on an existing
    instance and a fresh one; no Insights screen calls it and a schedule it makes over business data is checked at each
    run. BOSS_INS_LEGACY keeps its group and its denies over a name that matches nothing.
  - F98: the design's ScheduledReports as a list with child routes would make the list render its children (F46), so
    it is a parent whose default is `Schedules`; ScheduledReportDetail is one page of boxes, not tabs; DigestComposition
    is a form, not the framework's composition editor (an author still opens a digest in DashboardEditor).
  - F99: a form posts an emptied field as no value, and the engine keeps a value not sent, so `store#Schedule` takes
    `clearFields` and Insights' timing form says which it posted (`timingGiven`); likewise recipients (`recipientsGiven`).
  - F100: a schedule paused for its owner's sake is resumed by that owner once they are active again, not only by a
    new owner after a transfer (the engine has no administrator's resume).
  - F101: P5's and P6's screens read `ec.message` after an `ignore-error` call for a failure text that is no longer
    there; P7's screens take refusals as answers and a missing record as a not-available state. Home's own captures are
    left as they are.
- **Decisions** (for §4): a business schedule is one `store#Schedule` saved or one whose definition reads a business
  dataset; group delivery is its own engine artifact; the cap is a field of the schedule a caller supplies under the
  ceiling, 50 from Insights; no report is stored and a recipient's report is a new render under an unchanged fingerprint;
  the administrative read is `ADMIN_TRANSFER_VIEW`'s; every reading group schedules for itself and the administrator does
  not; the distributor saves definitions through the engine (for digests); recipients are proposed among Insights readers
  and the distributor's own groups; a qualified owner may store a schedule, reads every source and, for a group, may
  deliver to one; legacy schedules are personal in Insights; Home's digest is the user's own choice until P10.
- **For the lead:**
  - budget shares: framework 1.0 s server, mr-boss 1.8 s server;
  - merge: BossSetupData's P7 block is one append at the end, BossUsersDemoData's too (Admin P10 appends there: keep
    both); mr-moqui `ReportSetupData.xml` gains one block at the end, `MonitoringSecurityData.xml` one before the
    permissions, `ReportServices.xml` the delivery services in place of the two one-line schedule services after
    `create#Schedule`, `ScreenEntities.xml` four fields on ScreenScheduled, `ScreenServices.xml` the group block of
    `render#ScheduledScreen`; Insights.js (areas, linkPaths), Registry.js (one branch), Home.xml (one box);
  - the other track's files touched: `test/Admin/AdminLifecycle.spec.js` (F96, one expectation) and design-admin §4.1
    (one "As built" sentence); `test/acceptance/AppStructure.spec.js` and `TuiRender.spec.js` (the new screens' entries);
  - an existing instance loads ReportSetupData, MonitoringSecurityData and BossSetupData again (Monitoring.md
    "Upgrading"), and sets the `BOSS_INSIGHTS_REPORT` template's mail server and from address. From then on an owner-mode
    schedule over a business dataset sends each recipient their own message and only to owner-equivalent ones, and a
    screen schedule that names a group stops sending to the group until its path is a registered adapter;
  - the user's call: F88 (equivalence by resolved filter, strict for group-scoped policies); F100 (an owner
    resuming a schedule Admin paused); the distributor's `save#Definition` grant; refusing a retry after a change rather
    than sending the changed report; legacy group schedules stopping until registered;
  - not built: a legacy adapter registration (none is registered, so no catalog report is scheduled for a group); a
    schedule's own time zone and the pinned reporting period; stored artifacts and expiry; sending profiles and
    Comms-approved templates; quick create's Schedule; the delivery audit export (P12); business alerts in the
    participant (P8); a period comparison of the digest's own; an Assist draft of the commentary (P10);
  - `find#ReportOccurrences` with `administrative: true` is Admin P16's read (status and counters, no title, no content).

**Review Nov 10 (P7).** Fresh review of mr-moqui b0668cf9 and mr-boss 380f0bf6; fixes mr-moqui 4dd40dfe, mr-boss 18adcaa2 and
this note (branch `ins/p7`).
- Checked and kept:
  - **The scope fingerprint** (delivery.rs `scope`, `scope_as`): the definition and every definition it reaches by
    `panelRef`, `dashboardRef` or `definitionId` (the engine's own reference keys, definitions.rs), read or not as that user
    (`definitions::read`: owner or share group, not an authorization a disabled check could pass); every `datasetId` at any
    depth (a library panel's, a query variable's), each resolved as that user by `resolve_dataset`: its artifact
    (`authorize_own`), admission, the documents their groups read, and `rowFilter`, `contextFilters` and the
    `rowFilterService`'s answer in a canonical form; the rows artifact of a restricted dataset. It runs in a context of its
    own signed in as the user, so no screen grant and no disabled authorization enters it. A filter that names the viewer
    (`userId`, their groups, an account field, the active organization Mantle's policy narrows to) is in the resolved filter,
    so it differs: strict, never loose (F88). A service source is not comparable, and a business dataset cannot be one
    (`check_admitted`). An organization fixed by a dashboard variable narrows inside the row filter and is the same for
    everyone. The engine has no field permission: a restricted value (`PRODUCT_COST_VIEW`) reaches a report only through an
    owner's service, which is a service source. The locale is not in the hash; a render is reused only within a locale.
  - **Save and run**: `store#Schedule` and a resume refuse an active schedule with a blocking recipient; `send_each` computes
    the owner's scope and each recipient's again just before their message, with the lease, the owner and the schedule
    checked again; a recipient who cannot sign in (disabled, terminated) is `inactive`, an external one `external`, an id
    that is no account is left out. The owner's render is made in a context signed in as the owner, authorization on.
  - **The send**: `mail` is called with one address; no cc or bcc; no message names another recipient (the template has the
    title, the link and the picture). `get#RecipientReport` takes only the caller's own sent delivery and renders as the
    caller.
  - **The caps**: `caps` in the engine (50 without one, clamped to 1..ceiling, the ceiling from `get#InstancePreference`,
    200 when it cannot be read), at the save (`RECIPIENT_CAP`) and by position at the run (`over-cap`), also for a
    `create#Schedule` row.
  - **The old paths**: `list#Schedules`, `pause#Schedule` and `send#Report` are the owner's own; Tools' screens need
    `DASHBOARDS_APP`; `render#ScheduledScreen` sends to a group only through a registered adapter (none is); `clearFields`
    empties three named fields. A technical schedule takes the old code unchanged: moqui-host `report_` 9 of 9 and
    `scheduled_reports` pass after the fixes.
  - **Retry and reconcile**: the owner only, failed rows only, the occurrence's revision, the schedule's revision and the
    definition's version unchanged; an uncertain row is refused until reconciled, with a reason.
  - **Ownership**: `owner_authority` (the user themselves or `REPORT_OWNER_CHANGE`); a transfer needs an active internal
    user who holds `store#Schedule` by their own grants, reads every source and, for a group, holds the group artifact; it
    stays paused, and the resume is the new owner's with the recipients checked against their scope. The services are not
    remote, so an identity operator reaches them only through Admin's lifecycle, which scopes the leaver and the new owner
    (`identityLib.identity`). `AdminLifecycle`'s changed expectation is right: the participant has a pause service, so every
    disable records its pause step after the drive's transfer step.
  - **`find#ReportOccurrences` administrative**: `ADMIN_TRANSFER_VIEW`; ids, states and counters, no title and no recipient.
    `get#ReportOccurrence` gives that administrator each recipient's name and outcome, as the plan says.
  - **BOSS**: every transition reaches a `DeliveryServices` operation (`allow-remote="false"`) that checks its permission;
    a group must be one the distributor belongs to and a person an Insights reader before the engine is asked; the
    distributor's `save#Definition` is reachable only through `store#Digest`, which builds the definition itself (the
    editors stay denied). Refusals are answers (`applied`, `reasonCode`, `reason`), not `ec.message` after `ignore-error`.
  - **The acceptance edits** (read, not run): `AppStructure`'s five entries and `TuiRender`'s one name screens and texts
    that exist; `InsightsFoundationWalk` walks `readerMenu`, which now has every entry.
  - **Spec leanness**: `InsightsDelivery` renders ScheduledReportDetail once (qvt) and no other screen; `ReportAudience`
    renders none.
- Fixes:
  - **R1** (high, delivery; mr-moqui) A cron occurrence is run again under its own key when the run before it ended before
    the schedule's last run time was kept (a process that died, a failure before the first message), and `send_each` then
    sent to every recipient again: one already sent got a second message, and one whose outcome was not known was sent
    again without a person's word. Two retries read before either ran did the same to a failed one. A recipient whose
    delivery stands as sent or uncertain is now passed over, their row left as it is.
  - **R2** (high, access; mr-moqui) "Business" was the dataset's `signal` alone. `mantle-business-events` (the annotations
    scoped by the viewer's organizations, every reading group's) has none, so a schedule the distributor makes with
    `create#Schedule` (F97) over a dashboard of it alone took the technical path: one message to any `userId` and
    `userGroupId`, unchecked. A schedule is now held to the check when its definition reads any dataset whose rows depend
    on the viewer (a `rowFilterService` or `contextFilters`), whatever its signal. No shipped technical dataset has either.
  - **R3** (medium, access; mr-moqui) The fingerprint left out what a dashboard reads without naming it: the change
    markers (`monitor_annotations`), each registered business event source (read as the viewer over a business dataset), and
    the telemetry dataset of a query or query variable that names none. An owner who reads one of these and a recipient
    who does not had equal fingerprints. They are counted now (the markers as read or unread, without making the report
    denied); no shipped definition has a query without a dataset.
  - **R4** (low; mr-moqui) A walk past 500 definitions stopped without a word, so what lay beyond was in nobody's
    fingerprint; it is now marked unread, and nobody is equivalent.
  - **R5** (medium, injection; mr-boss) A copied screen schedule's subject is expanded by `render#ScheduledScreen` when it
    runs (`ec.resource.expand`), and P7 opened the subject to every reader who has such a schedule. `storeLegacy` refuses
    a changed subject that holds `${` or is over 255 characters.
- Tests (this worktree's Debug binary, rebuilt): framework ReportAudience 7 of 7 (1.1 s; the new feature, an occurrence
  run again, 0.09 s), ReportDrill, ReportAnnotations, BusinessDatasets; tools ReportMounts, DocumentExport; BOSS
  InsightsDelivery 4 of 4 (2.0 s on this run), InsightsAccess, InsightsHome, InsightsDashboards, AdminLifecycle (with
  InsightsDatasets) 25 of 25. Cargo: moqui-report 86 of 86 (`delivery::tests` 5), clippy clean, moqui-host `--test it report_`
  9 of 9 and `scheduled_reports` 1 of 1. Prettier and rustfmt on what changed. Not run: the full suites, any acceptance
  test. R1's check was not seen failing against the old binary.
- For the lead:
  - budget share: framework ReportAudience 1.1 s (was 1.0);
  - the user's call: every reading group holds `INSIGHTS_SCHEDULE` (design §1.1's table gives it to the distributor and
    says personal scheduling "adds" it to a reader; §7 "As built" now says it is open); F100 and the worker's other items
    stand;
  - findings: a skipped recipient sees the run in Received with its safe reason (their own delivery row; no content); a
    digest's definition id carries its title's slug, which the administrative list shows as an id; the old owner still
    lists a transferred schedule's past occurrences (counters only) and cannot open them;
  - `create#Schedule` stays the distributor's (F97): with R2 nothing Insights reads goes out unchecked through it, and
    removing the row is P1's block to change;
  - an existing instance: an owner-mode schedule over a dataset with a `rowFilterService` or `contextFilters` (none shipped
    outside the business ones and the events) now sends each recipient their own message, checked.

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

**Built Nov 10 (P8).** mr-moqui c8ed67a7 and mr-boss (branch `ins/p8`; Mantle is not touched).
- **Checked first** (the plan against the code): F8 as found (a rule runs as its owner, alert.rs `evaluate_rule`; its contacts
  are a notification to a user or a whole group on `ReportAlert`, an email to `toAddresses` and a webhook; the link is Tools'
  `/apps/dashboards/Alerts`; 500 series). P7's pieces are as its notes say and are reused as they are: `judge` and `scope_as`
  (the fingerprint with R2's viewer-scoped datasets and R3's implicit sources), `expand`, `audience`, `refuse`, `caps`, the
  group artifact, `owner_authority`, the delivery states. The five shipped templates each carried one contact point, a
  notification to `ADMIN` as a group. The Insights reading groups read mr-boss's five admitted datasets by P3's grants, each
  their own organizations' rows, so a Retail distributor reads Customer Service's breaches and can copy its template.
- **The framework** (mr-moqui `crates/moqui-report/src/alert_delivery.rs`, with edits to `alert.rs`, `delivery.rs`,
  `definitions.rs` and `business.rs`; docs/tools/Monitoring.md "Business alerts"; F8, INS-07):
  - **A business rule** names an `audience` or reads a dataset whose rows depend on the viewer (`delivery::body_reads_business`,
    the same test as a schedule's), whatever wrote its row. `save#Definition` (and so restore, the editors and a pulled git
    file) refuses its contact points, shared contact references and any audience field but the known ones
    (`BUSINESS_CONTACT_REFUSED`, `BUSINESS_AUDIENCE_REFUSED`), keeps `recipientUserIds`, `recipientGroupIds`, `channels`
    (`notification`, `email`), `topic`, `emailTemplateId` (both must exist), `recipientCap`, `groupBy`, `groupWaitSeconds` and
    `repeatSeconds`, and sets `deliveryMode` itself. After the row is written and before the save commits, the audience is
    checked by P7's `audience` against the rule as it stands: an active rule with a blocking recipient or over the cap is
    refused (`RECIPIENT_REFUSED`, `RECIPIENT_CAP`; `GROUP_DELIVERY_DENIED` without the group artifact), a paused one may be
    saved to be mended. `check#ReportAudience` takes an alert rule. `detailLink` (a plain path on this server) is where a
    rule's notifications link, for any rule.
  - **The evaluation** is the one there was, once, as the owner. For a business rule the contacts are one a channel of its
    audience, never what its row holds; each notification group goes through `Pass::send`: the audience expanded, the owner
    first under the cap, each recipient judged again (one verdict a recipient a pass) and told separately on the topic as that
    one user, or at their own account address; `scope-differs` and the other safe codes skip, a failure is recorded and puts
    the group back for the next pass, and a recipient whose row says they were told this state within the repeat interval is
    passed over. A stale source (the index older than its fields, `business::index_stale`) is Error. A business rule's state
    changes write no `monitor_annotations` marker and open no incident, and its notification row keeps no payload. An owner
    who cannot sign in pauses the rule (`owner-disabled`) instead of failing every minute. Technical rules take the old
    path: the one changed line for them is `AlertInstance.lastValue`.
  - **Copies** (`copy#Definition`, `import#Definitions`) of a business rule drop its contact points and are saved paused
    (`not-validated`); activating is the owner's save with `paused` false.
  - **Reads**: `get#AlertState` (each series' labels, state, times and last value to the owner and to a recipient of the
    audience whose fingerprint equals the owner's now; a reason code otherwise; a non-business rule to a reader of the rule
    and its sources) and `find#AlertDeliveries` (the owner's rules with recipients by name; `received`; `administrative` for
    `ADMIN_TRANSFER_VIEW` as counters by rule with no title, series, recipient or value).
  - **Ownership**: `find#OwnedAlertRules`, `pause#OwnedAlertRules`, `transfer#AlertRuleOwner` (the owned-resource contract;
    `REPORT_OWNER_CHANGE`; the new owner active, internal, holding `save#Definition`, reading the sources and, for a group
    audience, the group artifact; paused `transfer-pending` until they save it active). `definitions::engine_revise` is the
    engine's own versioned change of a definition for these.
  - Entities: `moqui.report.AlertRecipientDelivery` (unique by rule, channel, group and recipient); `AlertInstance.lastValue`.
    No seed data: the delivery states are P7's and `ADMIN` holds the new services by `DASHBOARDS_APP`'s pattern.
- **BOSS services** (`service/ironstone/insights/AlertServices.xml` over `Alerts.js`, each `allow-remote="false"`):
  `find#Alerts`, `get#Alert`, `store#Alert`, `copy#Alert`, `pause#Alerts`, `test#Alert`, `delete#Alert`. Reading is
  `INSIGHTS_VIEW` (the alerts one received, one's own state); setting, copying, changing, activating and deleting need
  `INSIGHTS_AUTHOR` or `INSIGHTS_DISTRIBUTE` (`INSIGHTS_ALERT_REQUIRED`); other people `INSIGHTS_DISTRIBUTE` (a person an
  Insights reader, a group one the distributor belongs to: Delivery.js's `proposable`, now exported with its engine call and
  display helpers). The topic, template, link and cap are constants here. A new rule is the saved query of a panel the caller
  reads (never a typed query), with the panel's `business` descriptor; it and a copy start paused, and Activate runs the
  reading as the caller (`run#Query`) before the engine's save. Every write answers a refusal as `applied` false.
- **Screens.** `Insights/Alerts` (a parent, "Business alerts", after Management digest; its default `Rules`: AlertFind with
  Mine, Received and Templates, the list with Pause, Activate, Delete and a bulk pause, Templates with Copy) and the hidden
  `AlertDetail` (the record header with Activate as the primary action while inactive, Test, Pause, Delete, Copy for a rule
  that is not the caller's; BusinessAlertBasis; AlertAudience in a dialog with each recipient's result beside it;
  OwnAlertState; AlertDeliveryStatus). With `dashboardId` and `panelId` and no rule it is New alert from a panel, which the
  framework panel menu's New alert rule opens (`reportLinks.alertRule`, null for one who may set none).
  `template/InsightsAlertEmail.xml` is the email's body.
- **Data** (`data/BossSetupData.xml`, one block appended): the `InsightsBusinessAlert` topic (private, Notifications); the
  `BOSS_INSIGHTS_ALERT` email template; `BOSS_INS_ALERT_READ` (`get#AlertState`, `find#AlertDeliveries`: ALWAYS for the five
  reading groups and the administrator), `BOSS_INS_ALERT_DISTRIBUTE` (`delete#Definition`, the distributor's own rules); the
  lifecycle participant `insights.alerts` with `BOSS_INS_ALERT_LIFECYCLE` for the identity operator and the administrator.
  The four shipped templates (`report/boss-service-sla-breach.json`, `boss-commerce-*.json`) lose their contact point and
  say how they are used. Insights.js: `reportLinks.alertRule`, two links.
- **Specs.**
  - framework `BusinessAlerts` (4 features, 0.85 s, `dependsOn` ReportAudience: a contact point, an address, a webhook
    channel and a bad link refused, a narrower recipient and the cap refused at save, the group grant, a personal rule's
    mode, `check#ReportAudience` for a rule; one evaluation and three notifications of one user each with the value and the
    rule's link, a narrower member who joined later skipped `scope-differs`, a disabled one `inactive`, no value in the
    delivery rows or the administrative list, a recipient's state and a non-equivalent reader's refusal; the same state not
    told twice, a stale source Error for every series and told as Error, an empty result No Data; a copy paused, an owner who
    cannot sign in paused at the evaluation, the lookup, pause and transfer with their refusals, a resume refused until the
    recipients pass the new owner's check). moqui-report unit tests: `alert_delivery::tests` (3).
  - BOSS `InsightsAlerts` (3 features, 1.5 to 2.0 s, `dependsOn` InsightsDatasets: a reader refused, an author's rule from
    a panel inactive and personal and refused other people, the distributor's group audience activated, the Services reader
    refused as an answer naming them and the code, a foreign group, another's rule and a private one; one evaluation's
    notifications to the two named on Insights' topic with the link and the value, a recipient's own state and delivery, the
    Services reader's none, AlertDetail's one qvt render; the five templates, one unreadable, the breach template copied
    inactive without a contact point, a fractional threshold, the activation, Admin's `find#OwnedResources` with the
    participant, a reader refused its services and as a new owner, the delete). `InsightsAccess`: the menu (ten entries),
    `get#AlertState` for a reader and `find#OwnedAlertRules` refused to the distributor. `AdminLifecycle` (Admin's): a disable
    now has a second pause step.
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsAlertsUsable` (4 features: the "usable when", with a
    breach made on a Retail case's clock and the rule deleted at the end). The sweeps `AppStructure` and `TuiRender` gain the
    new screens' entries; `InsightsFoundationWalk` walks the one menu.
- **Tests run** (this worktree's Debug binary, `--nobuild`): framework BusinessAlerts, ReportAudience, ReportDrill,
  ReportAnnotations, BusinessDatasets 23 of 23 (framework 3.1 s of 12 s for the five); BOSS InsightsAlerts, InsightsAccess,
  InsightsDelivery, InsightsDashboards, InsightsHome (with InsightsDatasets), AdminLifecycle, AdminRegistries,
  CustomerServiceReports, CommerceReports 39 of 39. Cargo: `clippy -p moqui-report --all-targets -D warnings` clean,
  `test -p moqui-report` 89 of 89, moqui-host `--test it report_` 9 of 9 (the technical rules' path: timers, workers, real SMTP and webhooks). `moqui lint --screens`: 132 sites, as before,
  none in the new screens. Prettier clean on the new and changed JavaScript; rustfmt on the Rust files changed. Not run:
  `./moq test-apps`, `./moq test-framework`, any acceptance test.
- **Rendered by hand** (a throwaway probe spec, not kept): Rules (Mine as the distributor in qvt, tui and html; Templates;
  Received as a reader and as the administrator), AlertDetail (the owner's in the three modes, a recipient's, the Services
  reader's, a template, a missing one, New from a panel as an author and refused to a reader), the Dashboard panel menu's
  link for an author and none for a reader; every transition as a post with the rows after it (create from a panel with a
  range condition, Test, the audience with email, a group refused to an author, activate, pause, delete, copy from the list
  and from the detail, a reader's pause and delete refused); and the email channel with the mail capture: a body that did
  not render was recorded as failed for each recipient and tried again, then one message each ("currency USD — Firing: 8").
- **Budget shares**: framework server 0.85 s (BusinessAlerts); mr-boss server 1.5 to 2.0 s (InsightsAlerts; InsightsAccess
  gains two calls); no client spec.
- Inventories: no ss-inventory or usl-inventory row is P8's.
- Design edits: design-insights §2 (the list's route), §8 "As built", §15.1 (INS-07), §15.2 (the delivery row);
  design-admin §4.1 (the participant as built). mr-moqui docs/tools/Monitoring.md ("Business alerts", Security, Upgrading)
  and `plans/Remaining-Work.md` (the report-engine row). mr-boss README's Insights line.
- **Findings** (provisional, for the lead to number):
  - F102: the shipped templates told `ADMIN` as a group in one notification with the owner's values. mr-boss's four
    lose the contact point. Mantle's `mantle-sales-daily-floor` still has one in its file (mr-mantle is read only here): the
    engine drops it from a copy and never delivers to one, so it is harmless; removing it and its "contact points" wording is
    Mantle's.
  - F103: the owner is told only when named, or alone when nobody is, as a schedule's owner is (P7): "adds an equivalent
    colleague" names both. Kept for one rule in both.
  - F104: a recipient must read the rule itself (F90's `not-shared`), so a group audience's rule is shared with a group
    its recipients are in; AlertAudience's form carries the share group. A rule its audience reads without a share would
    need the engine to treat an audience as a reading grant.
  - F105: the engine had no per-recipient memory of a notification, so a group put back after one failure would have
    told everyone again; `AlertRecipientDelivery` keeps the state each recipient was told. It keeps each recipient's last
    outcome only, an alert email's outcome is sent or failed (the alert contact sender does not tell "not known" apart, as
    P7's report mail does), and there is no manual retry or reconciliation: a failure is tried again at each evaluation.
  - F106: "stale" as the engine can know it is the index older than its fields. A feed that has stopped indexing leaves
    the last documents in place and the rule reads them as current; index lag is P10's readiness, and a rule that reads it
    is a framework ask.
  - F107: `AlertInstance` kept no reading, so OwnAlertState had no value to show; `lastValue` is written for every rule.
  - F108: an alert's history was its markers in `monitor_annotations` (any reader of that dataset) and Monitor's
    incidents. A business rule writes neither, so its history is its state and each recipient's last delivery; design §8's
    history, annotations and scoped drill in OwnAlertState are not built.
  - F109: a series pruned after going missing is told as Normal with no value and `pruned` true (the engine's rule for
    every alert). Design §8.1 asks for a neutral explanation: a wording of its own in the notification is a framework ask.
  - F110: the engine answers a fractional number of a definition's body to a script as a decimal, which `Number()`
    refuses, and `JSON.stringify` does not write as a number. Alerts.js and the email template read them through their text
    and `clone` writes them as numbers; any script that changes and saves a definition body with a fractional number has the
    same hazard.
  - F111: a rule made from a panel reads its owner's whole scope: the panel's dashboard variables (Insights' fixed
    organization) do not exist in a rule. "For their queue" is the series of the queues the owner reads; a rule narrowed to
    one organization or queue needs a filter on its query, which BusinessAlertBasis does not offer.
  - F112: `AdminLifecycle` (Admin's) lists a disable's exact steps; the second participant adds a second
    `pause:UlstDone` (as F96).
  - F113: alert.rs is 1,531 lines with P8's fifty (Practices-Rust §2's 1,500): its contact sending and shared-item
    validation can move to a module of their own; not done here, to keep the diff the phase's.
  - F114: `get#AlertState` is a new read; Tools' Alerts still lists `AlertInstance` by entity for its `ADMIN` users, a
    business rule's series labels among them.
- **Decisions** (for §4): a business rule is one with an audience or over a viewer-scoped dataset, whatever wrote it; an
  audience replaces contact points and anything else refuses the save rather than being dropped; the channels are the in-app
  notification and the account's email; the owner is told when named; a copy and an import are paused until their owner's
  save activates them; a business rule writes no shared marker and opens no incident; a stale index is Error; the
  administrative read is `ADMIN_TRANSFER_VIEW`'s, counters only; alert rules are a second lifecycle participant with
  services of their own (a participant has one resource parameter); setting an alert is the author's and the distributor's,
  not every reader's; Insights names the topic, the template, the link and the cap, and sets no grouping wait; AlertDetail is
  Insights' own screen over the saved query of a panel, not a mount of Tools' AlertRule; the shipped templates carry no
  contact point.
- **For the lead:**
  - budget shares: framework 0.85 s server, mr-boss 2.0 s server;
  - merge: BossSetupData's P8 block is one append at the end (Admin P11 appends there: keep both); mr-moqui
    `ReportEntities.xml` gains one field on AlertInstance and one entity at the end, `ReportServices.xml` five services
    before `preview#Report` and one sentence of `check#ReportAudience`; no framework seed file changes; Insights.js
    (`reportLinks`, `linkPaths`), Delivery.js (its exports), InsightsSpecLib (`readerMenu`);
  - the other track's files touched: `test/Admin/AdminLifecycle.spec.js` (F112, one expectation) and design-admin §4.1
    (one "As built" sentence in place of "Alert rules join with Insights P8"); `test/acceptance/AppStructure.spec.js` and
    `TuiRender.spec.js` (the new screens' entries);
  - an existing instance: the entity check adds the table and the field; load BossSetupData again and set the
    `BOSS_INSIGHTS_ALERT` template's mail server and from address. From then on a saved rule over a business dataset tells
    its owner alone in the app until it is saved with an audience, its stored contact points are not delivered to, and a save
    that still names one is refused (Monitoring.md "Upgrading");
  - the user's call: who sets a personal alert (built: the author and the distributor; design §7.1 would let every reader
    with `INSIGHTS_SCHEDULE`, which P7 gave every reading group: open with P7's question, and one line in Alerts.js's
    `author` either way); F103 (the owner told only when named); F104 (a recipient must read the rule); a business rule
    leaving no marker on the time series (F108); the distributor's `delete#Definition` (their own definitions only);
  - Mantle's: F102 (its template's contact point and wording);
  - not built: silences, mute timings and shared contact points in Insights (Tools' AlertShared is not mounted); "Send test
    to me"; a registered metric picker (the basis is a panel's saved query with its descriptor); a filter of the rule's own
    (F111); a delivery history and a manual retry (F105); sending profiles; alerts to a chat room (design §17 Q4);
    recipient evaluation (§8.1 later); an Insights Settings cap (P10); the delivery audit export (P12);
  - `find#AlertDeliveries` with `administrative: true` is Admin P16's read (counters by rule, no title, no value).

**Review Nov 10 (P8).** Fresh review of mr-moqui c8ed67a7 and mr-boss 8d1907e1; fixes in mr-moqui and mr-boss ("Insights P8
review: …") and this note (branch `ins/p8`).
- Checked and kept:
  - **What makes a rule business** (`alert_delivery::is_business`, asked of the stored body at every evaluation and of the
    new body at every save): an `audience` object, or any `datasetId` at any depth of the body, or reached by a `panelRef`,
    `dashboardRef` or `definitionId` in it, whose dataset is viewer-scoped (P7 R2's test). So a row written past the save
    (Tools' entity screens, an entity data file, an older stored rule), a rule edited later, and a dataset that became scoped
    after the rule was saved are all held to it: `evaluate_claimed` replaces whatever contact points and shared contact
    references the row holds by one contact a channel of its audience (`contact_body`; an unknown channel is dropped), and
    nobody named is the owner alone on the in-app channel. A query that names no dataset reads the telemetry metrics, which
    no Insights group reads. Every shipped component dataset has a `rowFilterService`, so nothing Insights reads takes the
    technical path.
  - **The saves**: only the owner saves (`save_definition_as`), so the viewer the audience is checked against is the owner;
    `prepare` runs for every alert save (the editors, `restore#Definition`, `copy#Definition`, `import#Definitions`, a
    pulled file) before the row is written and `check_saved` after it, in the save's transaction, which BOSS's `engine`
    opens new, so a refusal leaves no row (the spec counts them).
  - **The notification**: `Pass::send` judges each recipient with P7's `judge` against the owner's scope computed once a
    pass (not a copy of the check), owner first under P7's `caps`, the group artifact asked of the owner by their own
    grants; `inactive`, `external`, `not-shared`, `scope-differs`, `over-cap` and `owner-unauthorized` send nothing. The
    message (title, series labels, values, link) goes to one user id or one account address a call. The
    `AlertNotification` row of a business rule keeps the rule id alone; no marker and no incident is written.
  - **Repeat runs** (P7 R1's lesson): the group's row is put back after a failure, and the next pass passes over everyone
    whose own row says sent for that state within the repeat interval, so only the failed one is tried again.
  - **States**: an empty result is No Data, a failed, incomplete or stale reading Error for every series; an owner who
    cannot sign in pauses the rule in a transaction of its own and tells nobody.
  - **Reads**: `get#AlertState` gives instances to the owner and to a recipient the audience names whose verdict is clean
    now; `find#AlertDeliveries` gives the owner's rules, the caller's own rows, or for `ADMIN_TRANSFER_VIEW` counters.
  - **Ownership**: `owner_authority` (the user themselves or `REPORT_OWNER_CHANGE`); the services are not remote, and BOSS
    grants them to the identity operator and the administrator, who reach them through Admin's lifecycle as P7's are
    reached; the new owner must be active, internal, hold `save#Definition` by their own grants, read every source and, for
    a group audience, hold the group artifact. `AdminLifecycle`'s second `pause:UlstDone` is right: each participant with a
    pause service records its step.
  - **Technical rules**: the old path but for `lastValue`; moqui-host `--test it report_` (timers, workers, real SMTP and
    webhooks, markers and incidents) passes after the fixes.
  - **BOSS**: every transition of Rules and AlertDetail reaches an `AlertServices` operation (`allow-remote="false"`) that
    checks `INSIGHTS_VIEW` or author-or-distributor itself, and a refusal is an answer; a person proposed is an Insights
    reader and a group one of the caller's own before the engine is asked; the three artifact groups name six engine
    operations and nothing else; `delete#Definition` deletes only the caller's own definition (the engine's owner check);
    the four templates carry no contact point; New alert from a panel takes the saved query of a panel the caller reads.
  - **Spec leanness**: `InsightsAlerts` renders AlertDetail once (qvt) and no other screen; `BusinessAlerts` renders none.
- Fixes:
  - **R1** (high, injection; mr-moqui) A notification's title is a template, expanded as a script when it is sent
    (`NotificationMessage::title`), and the engine gave it the rule's title. P8 opens rule titles to Insights authors and
    distributors (`store#Alert`, `copy#Alert`), so a title holding `${...}` ran server-side script at each notification. A
    title with a `$` is now taken from the message by name (`${title}`, expanded once), for every rule; the link is checked
    again as a server path when it is built.
  - **R2** (high, access; mr-moqui) A user with a `NotificationTopicUser` row saying `allNotifications` receives every
    message of a topic whoever it is addressed to, a private topic too, so each business alert (title, labels, values) also
    went to such a subscriber, unchecked. mr-marble's MyAccount › Notifications stores that row from the request's
    parameters for any topic, so a customer account can make one. `NotificationMessage::direct_only` (moqui-core) sends to
    the named users alone, and a business rule's notifications use it. Seen failing before the fix
    (`RDA_EQUAL+RDA_OTHER`).
  - **R3** (medium, access; mr-moqui) A transferred rule kept its `AlertInstance` rows, so the new owner (qualified, not
    equivalent) read the leaving owner's series labels and last values through `get#AlertState`, and the first evaluations
    told those series on as No data. A transfer now deletes the rule's instances and notification rows and releases its
    claim.
  - **R4** (medium; mr-moqui) A series removed after going missing was told as Normal (F109), which a business recipient
    reads as a recovery nobody observed. A business rule's recipients are told nothing more of a removed series.
  - **R5** (low, access; mr-moqui, mr-boss) A skipped recipient's delivery row kept the state's name, which they read as
    their own (`find#AlertDeliveries` received, Rules' Received). It is kept only for one sent or failed; Received says
    "Nothing" for one skipped.
  - **R6** (low; mr-moqui) A git sync's pull saved a business rule active as its file said. One not already active here
    is saved paused (`not-validated`), as a copy and an import (design §13.3 "Definition and source change").
  - **R7** (low; mr-moqui) A technical rule paused by the lifecycle kept `pausedReason` after its owner resumed it; a
    save with `paused` false clears it for every rule.
- Tests (this worktree's Debug binary, rebuilt): framework BusinessAlerts 4 of 4 (0.96 s; the subscriber, the title, the
  removed series and the transfer's reset added to its features), ReportAudience, ReportDrill 15 of 15; BOSS InsightsAlerts,
  InsightsAccess, InsightsDelivery, AdminLifecycle (with InsightsDatasets) 21 of 21. Cargo: `clippy -p moqui-report -p moqui-core --all-targets -D warnings` clean, `test -p moqui-report` 89 of 89,
  `test -p moqui-core notify` 18 of 18, moqui-host `--test it report_` 9 of 9 (mr-moqui 9fe34142). Prettier and
  rustfmt on what changed. Not run: the full suites, any acceptance test. R1's and R4's checks were not seen failing
  against the old binary (the spec stopped at R2's).
- For the lead:
  - budget share: framework BusinessAlerts 0.96 s (was 0.85); mr-boss unchanged;
  - merge: mr-moqui `crates/moqui-core/src/notify/message.rs` gains `direct_only` (one field, one builder, one parameter of
    `resolve_users`); docs/tools/Monitoring.md "Business alerts";
  - **mr-marble's** (not this phase's repo): `MyAccount/User/Notifications.xml` `topicSubscriptions` stores
    `NotificationTopicUser` from the whole request context, so any account sets `allNotifications` on any topic, private or
    not, and receives the technical `ReportAlert` messages and every other topic's. R2 closes it for business alerts only;
    the transition should name its fields, and `resolve_users` could refuse `allNotifications` on a private topic;
  - a notification title is a script template for every caller of `NotificationMessage::title` (and of the script API):
    any other sender that passes stored text as a title has R1's hazard; P7's report mail subject was R5 there;
  - findings kept as they are: a dataset whose rows differ by the documents a group reads (DataDocumentUserGroup) and by
    nothing else is not "viewer-scoped" (P7 R2's boundary, the same here); an owner whose own scope narrows still reads
    the series of the wider scope until they are removed (ten evaluations), and their recipients must equal the narrower
    scope by then; the placeholder series of a rule that had no data is told as Normal once real series exist; a process
    that dies between a group's sent mark and its last recipient leaves the rest untold until the repeat interval (as a
    technical contact); the administrative list and Admin's lookup show a rule's id, which carries its title's slug, and
    the lookup its title (the contract's `resourceName`); F114 stands (Tools' Alerts lists `AlertInstance` labels of
    the rules its `ADMIN` viewer reads: their own and those shared with a group they are in, whatever their scope); an
    Insights author holds `save#Definition` for the editors, so a rule saved past `store#Alert` (if the mounted editor
    takes an alert's body: not tried) could name any existing topic or email template, for an alert to themselves alone;
  - the worker's user's-call items stand.

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

**Built Nov 10, 2026 (P9).** BOSS only (branch `ins/p9`), on the shared release binary; no framework or Mantle change.

- **P0's open check, the flow-map body** (design §17 Q1; F26 as the code is now). The node-graph panel is rejected as it
  stands, and no `.qvue` is built either: the lanes are XML widgets.
  - The browser's (`WebrootReport.js` `report.nodeGraph` and its drawing): nodes in layers by longest path, 220 px a layer
    in a fixed-width SVG (a lane of ten steps is 2,200 px, scrolled sideways at phone width); a node is a circle with the
    raw id cut at 28 characters; no group, label or link field, a click opens Explore filtered to `service.name`; a node's
    number is the sum of its incoming edges and the hover text says calls and errors. The terminal's
    (`moqui-tui` `components/report/graph.rs` `node_graph`) prints an adjacency list by count. Neither has changed since
    F26.
  - A panel's rows come from the report engine's queries over a dataset; `get#Map`'s rows are a BOSS service's, computed as
    the viewer from registrations, so the panel could not be fed without a service dataset and its grant for every reader.
  - What the lanes need (a column a lane, a step's name, count, link and next step) is what `container`, `container-box`,
    `link` with a badge and `label` draw, in qvt, tui and print alike, stacking at phone width. So FlowMap is an XML screen
    with no `.qvue` and no second template, and its ordered list (StepList) is a form-list.
  - `get#Map` still answers the frame of F26 (`edges`: source, target, sourceLabel, targetLabel, sourceGroup, targetGroup,
    count, order) beside the lanes and the list, for a node graph that learns groups (a framework ask, not this phase's).
- **Checked first:** `report` definitions are saved, read and listed by the engine as F7 says (owner or group reads, only
  the owner saves, a shipped one is read only with version 0); `references` reads only the keys `definitionId`, `panelRef`,
  `datasetId` and `dashboardRef`, none of which a map body holds; Insights' Playlists, digests and schedules each filter
  their own kind; no REST path saves a definition; the flow editor's group read the engine but could not save; Home's
  attention board computes each card as the viewer and could be asked for a subset; Commons Knowledge is mounted by
  Customer Service the same way and every BOSS user opens it (`BOSS_USERS`); the demo has Knowledge pages.
- **Services** (`service/ironstone/insights/FlowMapServices.xml` over `FlowMaps.js`, each `allow-remote="false"`):
  - `validate#Map` (a body or a readable map against the registrations: each problem with `reasonCode`, `message`, `stepId`
    and `field`), `get#Map` (the lanes with their steps, the ordered list, the edges and the selected step; validated again
    at every read; a template's counts for the organization asked, one of the viewer's; without an id the viewer's default,
    else a map of the organization in scope, else the customer flow), `copy#Map` (the source and its version recorded, the
    organization one of the caller's, the group one of theirs) and `store#Map` (the typed input of design §9, the version
    read checked);
  - around them: `find#Maps` (the engine's `list#Definitions` kept to flow maps the viewer's organizations see),
    `store#MapLane` and `store#MapStep` (one row added, changed, moved or removed, through the same check and save),
    `restore#Map` and `delete#Map` (the engine's restore and delete after the kind, owner and version checks),
    `store#DefaultMap` (a preference), `get#MapEditor` (the stored references with what is wrong with each, the
    registrations to choose from, the engine's versions and what one changed, by lane and step), `find#MapPages` (the
    wiki's own search as the caller) and `get#StoryAccess` (whether the caller's own grants open Commons Knowledge).
  - Reading is `INSIGHTS_VIEW`; copying and changing are `INSIGHTS_FLOW_EDIT` on one's own map (`FLOW_EDIT_REQUIRED`,
    `MAP_READ_ONLY`, `MAP_NOT_OWNED`, `MAP_CHANGED`); a map the viewer does not read, of another organization or of another
    kind is one refusal (`MAP_UNAVAILABLE`). Every write answers a refusal as `applied` false with `reasonCode` and `reason`.
  - A step answers its worklist link only when the target's route opens to the viewer's own groups (`destinationOpens`) and
    they hold its permission; its count from Registry.js `attention`, now taking the providers to ask (no service
    parameter), so the board's rules hold and only those owners are called; its report by the catalog's reader; its
    measure by the registration's permission; its Knowledge page only when the viewer's own grants open Commons Knowledge
    and `get#PageRef` finds it for them. A step with nothing left reads "Information".
  - Registry.js also: `definitionRoute` and the palette (`search#Records`) know a flow map, Saved reports lists one only to
    those who see its organization and does not copy it (`COPY_UNAVAILABLE`). Insights.js: four links.
- **Data.** `ironstone.insights.FlowTarget` (the registry entity file, at the end): `targetId`, owner, title, description,
  `routePath`, `parameterContract` (JSON: a parameter is a `choice` of listed values or the `organization` of the map's
  scope), `requiredPermission`. `data/BossSetupData.xml`, one block appended: 34 flow targets of Commerce (3), Customer
  Service (2), Warehouse (8), Accounting (6), Purchasing (7), Manufacturing (2), Products (2) and Projects (4), each an
  existing owner route with the values its screen reads; `BOSS_INS_REPORT_FLOW` (the engine's `save#Definition`,
  `restore#Definition` and `delete#Definition`, ALWAYS for `BOSS_INSIGHTS_FLOW`).
- **Templates** (`report/insights-flowmap-customer.json`, `-internal.json`, `-supplier.json`, each `templateVersion` 1):
  Marble's three actors, each now a map with the built apps as lanes. Customer flow: 5 lanes, 14 steps (Marketing's and
  Sales' steps information; Commerce's carts, orders, payment holds and approvals with their counts; Warehouse's picking,
  shipping and returns; Accounting's invoices and payments; Customer Service's cases and returns). Internal flow: 7 lanes,
  16 steps (Products, Manufacturing, Warehouse, Projects, Accounting; People and Maintenance information). Supplier flow:
  4 lanes, 12 steps (Purchasing, the supplier's own step as information, Warehouse, Accounting).
- **Screens.** `Insights/Flows` (a parent, "Business flows", after Business alerts; tabs Flow map and Maps):
  - `FlowMap` (MapContext: the map, the organization a template's counts are for, counts shown or hidden; ProcessLanes;
    StepDetail with Open worklist as the primary action, the count's own list, the report and Read procedure; StepList;
    Copy for an organization, Edit map for its owner, Open here by default);
  - `FlowMaps` (MapFind, MapList with Copy in a dialog, Edit, Open by default and Remove with a named confirmation);
  - the hidden `FlowMapEditor` (MapIdentity; Lanes with Add, Edit, Up, Down, Remove; Steps with Add, one Edit dialog opened
    on the row chosen, Up, Down, Remove; the parameters each worklist takes; MapVersions with What changed and Restore; a
    template or another's map read only);
  - the hidden `ProcessStory` (Commons Knowledge and its terminal twin mounted, with "Back to <map> › <step>" above; its
    always-actions refuse everything below it unless `get#StoryAccess` answers true).
  - The root: the palette's label, the key `g m`.
- **Specs.**
  - BOSS `InsightsFlowMaps` (6 features, 0.1 to 0.45 s each, 1.8 s: the three templates valid and every target's route a
    screen; a copy's provenance, organization and owner, read by its organization's reader and refused the Services reader
    in the shared group, a reader's copy, another organization, a stale source version and a foreign group refused; a
    rename at the version read, then the stale save, an unregistered target, a value outside the choices, an unknown
    parameter, the organization set on a step, an expression in a name, a page that is not there, a template and a
    reader's save refused; a map saved through the engine with an unregistered target and count, a stored URL, an extra
    parameter and `${}` in its texts: FlowMap's one qvt render and the answers, nothing run, no foreign URL, three steps of
    which one links, the problems for the owner and none for a reader; a link with its parameters, the count and its
    list, the edges, the organization parameter and counts off for an administrator, no link or count for a reader, a
    foreign organization refused; a step's page by its title for one who reads it, none for an Insights reader who is not
    a BOSS user, to whom the mount is refused).
  - `InsightsAccess`: the menu (eleven entries), the keys, and the flow editor refused the engine's `copy#Definition`.
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsFlowMapsUsable` (6 features: the "usable when" through
    the screens' transitions, the template's later version made by lowering the copy's recorded one, the copy removed at
    the end). `AppStructure` and `TuiRender` gain the new screens' entries.
- **Tests run** (the shared release binary, `--nobuild`): InsightsFlowMaps, InsightsAccess, InsightsCatalog, InsightsHome,
  InsightsDashboards, InsightsDelivery, InsightsRecords (with InsightsDatasets) 37 of 37, mr-boss 10.2 s of 264 s for the
  eight. `moqui lint --screens`: 132 sites, as before, none in the new screens; `moqui lint` of FlowMapServices.xml clean.
  Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, any acceptance test, any client spec.
- **Rendered by hand** (throwaway probe specs, not kept): FlowMap (the supplier template with a step selected as an
  administrator, and the default map as a reader, in qvt, tui and html), FlowMaps and FlowMapEditor as the flow editor in
  the three modes (the editor with a version's changes and a step's Edit dialog), the editor refused to a reader,
  ProcessStory's return link in qvt and tui (html is not a mode of Knowledge's), a name holding `{{ }}` (escaped by the
  qvt renderer) and one holding HTML (refused by the service layer); every transition as a post with the row after it
  (copy, name and sharing, a lane added, moved and refused removal while it holds steps, a step added with a page and two
  handoffs, a bad parameter refused, a step moved and removed, restore, a stale save, a reader's save and delete refused,
  the default, the page choices, Knowledge's `page` under the mount, delete). Not opened in a browser: Knowledge's
  component under the ProcessStory mount (it is Customer Service's mount pattern), and the lanes at phone width.
- **Budget shares**: mr-boss server 1.8 s (InsightsFlowMaps; InsightsAccess gains one call); no client spec.
- Inventories: ss-inventory's note on the Marble dashboard names the three maps; no usl-inventory row is P9's.
- Design edits: design-insights §9 (FlowMap's layout and ProcessLanes, "As built"), §15.1 (INS-08), §15.2 (the service
  row), §16 (the storage row), §17 item 1 (answered). mr-boss README's Insights line.
- **Findings** (provisional, for the lead to number):
  - F115: the node-graph panel reads engine queries, not a service's rows, beside F26's missing groups, names and
    links; rejected for the map body, and the lanes are XML widgets, not a `.qvue` (design §17 item 1).
  - F116: a shipped definition's version is always 0 (F7), so a copy could not record which template it came from; the
    templates carry `templateVersion`, raised by hand when one changes. Reapplying selected changes of a newer template
    (design §9.1) is not built: the map says its source changed and both can be opened.
  - F117: the engine saves a definition only for its owner and shares it with one group, so an organization's map is
    its copier's: another flow editor of the organization reads it and copies it, and nobody takes it over when its owner
    leaves (the lifecycle's participants are schedules and alert rules). "Maintain maps for authorized organizations"
    (design §1.1) by any of its flow editors needs an owner transfer or a group edit in the engine.
  - F118: the engine knows no organization on a definition; the organization is the body's, checked by `get#Map`,
    `find#Maps` and Saved reports. Tools' definition list and an Insights author's DashboardEditor still open a shared
    map's body by id for a member of its group who does not see its organization: its texts and registration keys, no
    data.
  - F119: a metric registration computes no value (P4), so "counts from the registered metrics" has nothing to call: a
    step's count is an attention provider's, and a step's metric gives its name.
  - F120: Customer Service's cases, Warehouse's picking and shipping and Accounting's receivables have no registered
    attention provider (F29, F68), so those steps link and show no count; "each step's count" holds where an owner
    registered one. Only Accounting's counts take the map's organization (F69): the others keep their owner's scope, which
    StepDetail says.
  - F121: the flow editor's group had no engine save. The grant is the operation's (as the distributor's since P7), so a
    flow editor can also save a playlist or a saved search from the Insights screens every user opens, and remove a panel
    from a dashboard of their own; no data.
  - F122: Saved reports' SaveAs would have copied a flow map for any author, without provenance or the flow editor's
    permission; it refuses a flow map now.
  - F123: `get#DefinitionDiff` answers a list as one value, so a version's change of one step read as the whole
    `steps` array; MapVersions compares the two snapshots by lane and step itself.
  - F124: text safety as found: a screen attribute's `${}` is expanded once (a stored `${1+1}` stays text), the qvt
    renderer escapes `{{`, and the service layer refuses HTML in a parameter; FlowMaps.js still refuses `${` at save and
    breaks it at read, so no later renderer or message that expands a text is handed one.
  - F125: a page's title is its first heading, which only reading the page's text gives (`get#PageView` would also
    record it as recently opened); `get#Map` reads the text through `get#PageRef`'s reference, once a step with a page.
  - F126: ProcessStory's return link is the wrapper's, from the `definitionId` and `stepId` it was opened with;
    whether Knowledge's component keeps them in the URL while the reader moves between pages was not checked in a browser.
  - F127: the organization's default map (design §9 FlowMaps) is a setting, which waits for P10's Settings; a map made
    from nothing (New map) is not offered: a map starts as a copy.
  - F128: no demo user reads Insights and opens Commerce, so the acceptance test opens Commerce's orders as the system
    administrator and Customer Service's cases as insights.servicemanager.
  - F129: a spec that makes a party cannot delete it after that user signs in: the forum's ForumTrackingMode row is
    made at first sign-in; InsightsFlowMaps deletes it first.
- **Decisions** (for §4): the map body is XML widgets, with neither the node-graph panel nor a `.qvue`; a step names a
  FlowTarget with typed parameters (a choice or the map's organization), an attention provider, a metric, a catalog entry
  and a Knowledge page, and nothing else of it is read; an invalid reference is refused at save and cleared at read, its
  problems shown to flow editors only; a copy is one engine save by the caller (as P4's SaveAs), not `copy#Definition`; a
  shipped template's version is its `templateVersion`; an organization's map is read by those who see its organization and
  changed by its owner; Business flows opens to every Insights user and the services check; the flow editor's engine
  operations are a grant, not a call past the engine's authorization; ProcessStory serves Knowledge only to a user whose
  own grants open Commons Knowledge, and then all of it; the palette finds flow maps; Saved reports does not copy one.
- **For the lead:**
  - budget shares: mr-boss 1.8 s server;
  - merge: BossSetupData's P9 block and the FlowTarget entity in `entity/AdminEntities.xml` are each one append at the end
    (Admin P12 may append to both: keep both); `test/acceptance/AppStructure.spec.js` and `test/acceptance/TuiRender.spec.js` gain
    entries after P8's; `test/Insights/InsightsSpecLib.js` (`readerMenu`) and `InsightsAccess` (the keys, one case);
    Registry.js, Insights.js and `screen/Insights.xml` are Insights' own;
  - not verified: the acceptance test (written, not run); Knowledge's component under the mount and the lanes at phone
    width in a browser;
  - the user's call: whether an organization's map should be editable by every flow editor of the organization (F117:
    a framework change) or stay its owner's; whether the flow editor's engine grant (F121) should instead be a call
    FlowMapServices makes past the engine's authorization after its own check, which would keep the group to flow maps; a
    demo user who reads Insights and opens Commerce (F128); the wording and steps of the three templates;
  - the next phase: P10 (the organization's default map is a setting; the `insights-analyst` skill may name FlowMap).

**Review Nov 10 (P9).** Fresh review of mr-boss fd3dbab9; fixes in mr-boss ("Insights P9 review: …") and this note (branch
`ins/p9`).
- Checked and kept:
  - **Stored text** (F124, confirmed by running it): a map saved through the engine as Tools saves one, with
    `<img src=x onerror=…>`, `</script>`, `<b>`, quotes and `{{7*7}}` in its title, description, lane and step names and
    descriptions, rendered in FlowMap, FlowMaps and FlowMapEditor (with a step's Edit dialog and a version's changes) in
    qvt, html and tui. No raw tag in qvt or html: every text is entity-escaped, in text nodes, in plain attributes (a box
    title, a dialog's title and button, a confirmation) and in the script attributes (`:options`, `:fields-initial`, where
    the quote is escaped too). In a qvt text node the braces are `&#123;&#123;`; they stay raw only inside attribute
    values, which the browser's template compiler does not interpolate, and in html and tui, which have no template. The
    tui output is JSON text. `${` is refused at save and broken at read (the spec).
  - **Why a name with a tag "came back unsaved"**: the service layer's own check of a text parameter ("HTML not allowed
    including less-than (<), greater-than (>), etc symbols"), on `store#MapStep`, `store#MapLane`, `store#Map`'s title and
    `copy#Map`'s title; the transition stops there and shows it. It does not reach inside `store#Map`'s `lanes` and
    `steps` lists (a tag in a step's name was saved through them) nor the engine's save, an import or a pull; those are
    held by the escaping above, which is the control. `restore#Map` restores what an earlier save held.
  - **Links**: a worklist link is `/qapps/` + the FlowTarget row's `routePath` + its contract's parameters only (a
    `choice` value from the registered list, the map's organization set at read), each name and value URL-encoded; a
    stored `url`, an unknown parameter or a value outside the choices leaves the step with no link (the spec); a count's
    and a report's link are their registrations'; a procedure's is ProcessStory with an id matching `pagePattern`. The
    registrations are read into Maps, so no inherited name is found.
  - **As the viewer**: `get#Map` checks the body again at each read; the count is Registry.js `attention` with the
    viewer's grants, route and permission per provider, a refusal left out, a failure named on its own card and the
    others going on; nothing is kept between calls (no module state); a template's organization is one of the viewer's
    (`ORGANIZATION_UNAVAILABLE`); problems go to flow editors only.
  - **Scope and ownership**: every operation of FlowMapServices starts at `readMap` (the engine's read as the viewer, the
    kind, and `sees` of the body's organization; a map with no organization is nobody's but an unrestricted viewer's), so
    another organization's map is `MAP_UNAVAILABLE` to read, copy, change, restore, delete and set as default; a change
    also needs the owner. The version read is checked by `ownMap` and again by the engine's save under its row lock; the
    screens always send it. `copy#Map` records the source and its version and saves a new definition, so nothing later
    reaches the copy.
  - **ProcessStory**, by URL in qvt and tui: an Insights reader who is not a BOSS user is refused
    (`PROCESS_STORY_UNAVAILABLE`) on the mount, Knowledge, KnowledgeTui, `setup`, `page`, `history`, `search`, `children`,
    `attachment`, `savePage`, `deletePage`, `uploadAttachment` and the Spaces subscreen; a BOSS user reads a page they may
    view and, with the page restricted, gets "Page not found" from `page`, `history`, `savePage` and `deletePage` and does
    not find it in `search`. For a BOSS user the mount serves what Commons/Knowledge serves them (a transition's artifact
    is its screen's location).
  - **The palette, Saved reports, the key**: the palette's shipped rows are the business dashboards and the templates, an
    organization's map comes through `find#SavedReports`, which keeps it to those who see its organization; SaveAs refuses
    a flow map; `g m` is used by no other keymap.
  - **Spec leanness**: `InsightsFlowMaps` renders FlowMap once (qvt) and one refusal; no other screen.
- Fixes:
  - **R1** (medium, access; F121) `BOSS_INS_REPORT_FLOW` gave the flow editor's group the engine's `save#Definition`,
    `restore#Definition` and `delete#Definition`. The engine holds a save to the definition's owner and nothing else, so
    a flow editor who is not an author could make a definition of any type but a dataset; from the Insights screens every
    user opens that was a playlist (Playlists' `createPlaylist`) and a saved search (Explore's `saveSearch`), and changing
    a dashboard of their own (`addPanel`, `duplicatePanel`, `removePanel`); called directly, also a dashboard and a
    flow map naming another organization and a group they are not in (both seen) and, by the engine's code, an alert rule. Design §1.1 gives the flow editor
    maps only. The group's grant is now an inheritable ALWAYS on FlowMapServices' six writing operations (`copy#Map`,
    `store#Map`, `store#MapLane`, `store#MapStep`, `restore#Map`, `delete#Map`): the engine call each makes after its own
    checks passes `BOSS_INS_REPORT_ENGINE`'s deny, and the engine's operations are refused to the group anywhere else.
    Seen: the flow editor's copy, lane, restore and delete through the screens' transitions, a reader's change refused,
    `createPlaylist` and the direct saves refused. Nothing else those six call is denied to the group.
  - **R2** (low) A copy's "Copied from <source's title>" took the source's title as stored; it is cut and broken as
    every other text.
- Tests (the shared release binary, `--nobuild`): InsightsFlowMaps 6 of 6 (1.7 s; the map saved through the engine now
  holds a tag and braces in a name, checked on the one render) and InsightsAccess 5 of 5 (the flow editor refused the
  engine's `save#Definition`, in place of `copy#Definition`). Throwaway probe specs for the renders, the write paths, the
  mount and the grant, not kept. Prettier clean. Not run: the full suites, any acceptance test, lint (no screen changed).
- For the lead:
  - R1 answers the worker's user's-call item on the grant; design-insights §9 "As built" (Grants) says so.
  - Open, as the worker found, unchanged: F117 (a map is its copier's); F118 (the engine knows no organization).
    To F118 add: an Insights author, who holds the engine's save, can still make a `report` of kind `flowmap` in the
    definition editor, with any organization id and shared with any group (the engine checks no membership); it is read
    in Business flows only by members of that group who see that organization, checked and escaped as any map, with
    "Shared" as its owner. Holding a map to `INSIGHTS_FLOW_EDIT` there needs the engine to know the kind.
  - Low, left: `expectedVersion` is optional on the services (as on P4's, the screens always send it); the engine's
    restore brings back the group a version was shared with, also one the owner has since left.
  - `test/Insights/InsightsAccess.spec.js` changed again (one case), for the merge.

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

**Built Nov 10 (P10).** mr-boss 2729337a (branch `ins/p10`; one repository, no framework or Mantle change).
- **Checked first** (the plan against the code as it is):
  - the cap: the engine takes a schedule's or a rule's own `recipientCap` (`delivery.rs` `caps`: 50 without one, held to
    1..ceiling, the ceiling `get#InstancePreference` `report.groupRecipientCeiling`), and BOSS passed the constant 50 from
    Delivery.js and Alerts.js. So the organization's setting is the value BOSS passes; the framework is unchanged and names
    neither Mantle nor BOSS (F130);
  - Admin's registries as built (`get#Readiness`, `request#Refresh`, `find#Settings`; impl-admin P2) and P3's eight dataset
    providers and refreshes; `store#OrganizationDefault` changes only a typed or validated type (impl-admin F104);
  - Assist: an `AgentToolExposure` row is one service with one `exposeMcp` flag, and a READ tool runs as the user under the
    read fence after the user's own service authorization (`tools/catalog.rs` `user_permitted`); three exposures existed, none
    of the report engine (F131);
  - no dataset or field class exists (design §17 item 6), and `mantle-sales-orders` carries no cost field: the item cost and
    margin totals are the items document's (F132, F133).
- **Settings** (`service/ironstone/insights/Settings.js`, the readers in `Insights.js`):
  - seven PartySetting types for the OrgInternal role, seeded by mr-boss (§4): `InsightsDefaultDashboard`, `InsightsDefaultMap`,
    `InsightsDefaultDigest`, `InsightsDisplayTimeZone`, `InsightsWeekStart` and `InsightsFreshnessPolicy` (an enumeration each,
    the offset and the minutes in `enumCode`) and `InsightsGroupRecipientCap` (default 50); the freshness default is a day,
    every other empty;
  - `ContextServices.get#Settings` (added): the controls in effect for every reader (ScopeAndDelivery) and, for
    `INSIGHTS_SETTINGS_VIEW`, the defaults with their revision, the choices and SourceOwners;
  - `ContextServices.store#Settings`: `INSIGHTS_SETTINGS_EDIT` (`INSIGHTS_SETTINGS_REQUIRED`), an organization in the caller's
    scope (`ORGANIZATION_UNAVAILABLE`, forged or not), the revision read (`SETTINGS_CHANGED`; the revision covers a change made
    in Admin's OrganizationDefaults too), each value as it will be read (`VALUE_INVALID`: a definition of its kind the saver
    reads, a zone the server knows, a value of its enumeration), the cap a whole number from 1 to the instance ceiling
    (`RECIPIENT_CAP_CEILING` above it, nothing stored). Only a changed value is written, through Mantle's `store#PartySetting`;
    an emptied one removes the organization's own. A refusal is the answer (`applied`, `reasonCode`, `reason`). Fiscal start
    is not here;
  - applied: the cap in `Delivery.js` and `Alerts.js` at every save and audience check (`Insights.js recipientCap`: the active
    organization's, else the lowest of the caller's, under the ceiling; a rule saved without its audience keeps its cap no
    higher than the setting); the dashboard in `get#Home` (after the viewer's own, before the suite's, when they read it); the
    map in FlowMap's opening choice (F127 closed); the digest in `get#DigestPreview`; the zone and week start as `time_zone`
    and `offset` of a time grain in Analysis and Assist, and in `get#Context`'s defaults; the freshness policy in DataReadiness.
- **DataReadiness** (`RegistryServices.find#SourceReadiness`, in Settings.js): Admin's `get#Readiness` as the viewer for the
  providers of owner Insights, each row with its domain owner and class and the organization's policy applied (ready and older
  than allowed is Stale, with its lag; Needs review, Failed, Unavailable apart; a failed provider named). Admin's
  `Registry.js present` answers `lagMinutes` beside `lagText` (two additive lines in Admin's module). No registry here. The
  refresh is Admin's `request#Refresh`, called by the screen for one of Insights' registrations with a reason.
- **Assist** (`service/ironstone/insights/Assist.js`, `AssistServices.xml`; `skill/insights-analyst.md` with `screens:` on
  Dashboard, Explore and Reports, two rows in `skill/aliases.json`, four cases in `test/skill-retrieval.json`):
  - the root's `shell-providers`: the prompts "Explain this number" (Dashboard), "Compare with last period" and "Which source is
    stale?" (Insights), and the response action "Add to my dashboard" (`Insights/AddToDashboard`, `answerText`);
  - READ exposures: `insights_find_reports` and `insights_get_metric` (`RegistryServices.find#Reports`, `get#Metric`; Assist and
    MCP: navigation and wording, no figure), and for the numbers, a pair per tool since a row is offered to one surface or the
    other (F131): `insights_panel` / `insights_operations_panel` (`run#PanelQuery`, `run#OperationsPanel`: a saved panel's
    own result by definition and panel id through Drill.js, so the dashboard's number with its exclusions and its registered
    meaning; no record), `insights_datasets` / `insights_operations_datasets` (`find#QuerySources`, `find#OperationsSources`)
    and `insights_query` / `insights_operations_query` (`run#DatasetQuery`, `run#OperationsQuery`: Analysis' typed choices run
    by `Analysis.js run` as the viewer, an organization asked for narrowing under the row filter). The engine's `run#Query`
    is not exposed;
  - the class: `ironstone.insights.DatasetClass` (entity added to the registry entity file; one seed row per shipped dataset:
    sales items is costs and margins, the other seven business operations). An unclassified dataset answers neither surface;
    a cost dataset and a field named for a cost or a margin answer Assist only for a holder of `PRODUCT_COST_VIEW` and the MCP
    twins never (`DATASET_RESTRICTED`, `FIELD_RESTRICTED`); the engine still decides admission, the dataset's artifact and the
    row filter, and an organization that is not the caller's is `ORGANIZATION_UNAVAILABLE`;
  - `add#AssistPanel`: the typed choices of the answer's last `Panel:` line (own names of the list only) saved through
    `AnalysisServices.store#Analysis` as the caller, in a transaction of its own: Insights authoring, the dataset, its class,
    every field and the engine's guards are checked there; no engine grant is added and a reader is refused
    (`INSIGHTS_AUTHOR_REQUIRED`).
- **Screens** (each over the services above; every Insights user opens the group, each transition reaching a service that
  checks its own permission): `Insights/Settings` (menu 12, tabs) with `Settings/AnalyticsSettings` (the organization choice;
  AnalyticsDefaults, one primary Save for a settings editor, read only for a settings reader; ScopeAndDelivery with each
  owner's link when it opens to the viewer; SourceOwners) and `Settings/DataReadiness` (ReadinessFind, SourceReadiness with
  state chips and phone columns, RefreshRequest as a row dialog only where the registry offers the refresh);
  `Insights/AddToDashboard` (hidden; the response action's frame). `Insights.js` `linkPaths` gains the two settings routes.
- **Access** (`data/BossSetupData.xml`, one block appended): the setting types and enumerations; Insights' settings index
  entry `insights.settings` (`INSIGHTS_SETTINGS_VIEW`; design-admin §14.2's row); `BOSS_INS_READINESS_READ` (`get#Readiness`
  for the reader, distributor and flow editor) and three more rows on `BOSS_INS_DATASET_READ` (the engine's
  `find#BusinessDatasets`, which each source's readiness check reads, for the same groups); the dataset classes; the eight
  exposures. No screen area: the services check `INSIGHTS_VIEW`, `INSIGHTS_SETTINGS_VIEW` and `INSIGHTS_SETTINGS_EDIT`.
- **Specs.**
  - BOSS `InsightsSettings` (6 features, 2.2 s, the slowest 0.85 s; after InsightsDatasets, whose sales dataset and orders it
    reads): the administrator's save with a reader, a forged organization, a cap above the ceiling and a stale revision
    refused and nothing stored before; the cap and the display zone used by that organization's delivery and context and no
    other's, a reader reading the controls and no form; a source two hours behind ready under the default policy and Stale
    with its lag under an hour's, an unadmitted source not listed for a reader, the refresh refused to an author
    (`REFRESH_DENIED`) and a reader and run by the steward; Assist's query (each reader's own organization's rows, a forged
    organization, an unadmitted, an unclassified and a cost dataset and a cost field refused, the cost dataset read by the
    financial reader on Assist and refused on the MCP twin, the suite panel's own result with its measure, no exposure of
    the engine, the rows' surface flags); Add to my dashboard (a reader, an answer without a query and a cost dataset
    refused; the author's panel saved, private, theirs); one render each of AnalyticsSettings (qvt, the administrator),
    DataReadiness (qvt, a reader) and AddToDashboard (html, a reader). It puts the organization's settings back.
  - `InsightsSpecLib` `readerMenu` gains Settings (InsightsAccess's menu feature follows).
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsSettingsUsable` (5 features, the "usable when", after
    InsightsDatasetsUsable); AppStructure (four rows) and TuiRender (one parameter row), beside Insights P9's rows.
- **Tests run** (the shared release binary, `--nobuild`, this phase's runtime): InsightsSettings, InsightsAccess,
  InsightsDelivery, InsightsAlerts, InsightsHome, InsightsFlowMaps, InsightsDatasets, InsightsCatalog, InsightsDashboards,
  InsightsRecords, AdminRegistries, AdminOrganizations, AdminAccess, AdminSettings, ProjectsAccess, CommerceAccess and
  CustomerServiceAccess, 109 of 109 (mr-boss 37.4 s feature time); `moqui test mr-boss --skills` 24 of 24 (it caught the
  skill's description over 160 characters, which leaves a skill out); `moqui lint --screens` 132 sites, as before, none in
  the new screens; Prettier clean on the new and changed JavaScript. The four screens rendered by hand in qvt, tui and html
  (the administrator, a reader, the steward, the author), with the shell providers, the settings index as `insights.admin`, a
  week-grain query with the organization's zone and week start, and Admin's OrganizationDefaults listing the seven types (a
  throwaway spec, not kept). Not run: `./moq test-apps`, the acceptance suite. Not verified: a live Assist or MCP turn (no
  model in a spec): the tools' services were called directly as each user.
- **Budget share**: mr-boss server 2.2 s (InsightsSettings); no client change.
- Inventories: no ss-inventory or usl-inventory row (the services are new).
- Design edits: design-insights §1.2 (Assist as built), §2 (DataReadiness's readers), §9 "As built" (the organization's
  default map), §11 "As built", §15.2 (get#Settings, AssistServices), §17 item 6; design-admin §14.2 (Insights' row, one
  line of Admin's design).
- Findings (provisional, for the lead to number):
  - F130: the engine keeps the cap a schedule or rule was saved with and knows no organization, so the organization's cap
    is applied by BOSS at each save and check; a lowered cap reaches an existing schedule or rule at its next save, not at
    its next run (ScopeAndDelivery says so). Applying it at each run needs the schedule to carry its organization (as F118).
  - F131: "`exposeMcp` by the dataset's class" cannot be a flag on `run#Query`: an exposure is per service and a service
    cannot tell the surface. Built as a service per surface over typed choices and saved panels; the engine's query stays
    unexposed.
  - F132: no dataset or field class in the framework (design §17 item 6): the class is a BOSS registration read by the
    Assist services only, and a cost or margin field is told by its name, as P6's drill (F83). F83 itself is unchanged for
    Explore, a direct query, Analysis' measure list and a panel's own aggregate, and so for Assist's built-in `screen` tool,
    which reads what the user's own screens show.
  - F133: `mantle-sales-orders` has no cost field; `mantle-sales-items` is the one shipped cost dataset, and
    `mantle-inventory` carries none.
  - F134: a reader could read no source's readiness: `check#DatasetReadiness` reads the engine's `find#BusinessDatasets`,
    which P3 granted the author and the steward only. The reading groups now hold that listing and `get#Readiness`.
  - F135: from an Insights screen the root's inheritable grant reaches Admin's `request#Refresh` for every Insights user,
    so the registration's permission (and the dataset's update grant below it) is the check, as design §11 says;
    DataReadiness's transition takes only Insights' registrations (`insights.`), so it is no second door to another owner's.
  - F136: no provider registers `maxLagMinutes`, so nothing was stale by Admin's rule; Insights applies the
    organization's policy from `lagMinutes`. A dataset's watermark is its last rebuild (`index#BusinessDataset`), not its
    feed's last write, so an index fed as records are written reads Stale a day after its last rebuild. A feed watermark is
    a framework ask.
  - F137: a typed query cannot say a panel's exclusions (the orders panel leaves out recurring base orders, X5), so "orders
    last month" from typed choices would not be the dashboard's number: `run#PanelQuery` asks the saved panel instead and the
    skill sends a dashboard number there.
  - F138: the response action hands over the answer's text only, so "an Assist-drawn panel" is the query the answer ends
    with (the `Panel:` line the skill asks for), not a canvas; an answer from `insights_panel` has nothing to save (it is on
    a dashboard already).
  - F139: the display zone and week start reach Insights' own typed queries; a saved dashboard's buckets follow the
    viewer's zone and the instance's `report` week start, the engine's rule. An organization calendar for every panel is a
    framework ask.
  - F140: a user of several organizations with none active has no organization in scope: Settings asks them to choose
    one, the cap is the lowest of theirs and the freshness policy the strictest.
  - F141: a settings index entry names one readiness provider and Insights has one a source, so `insights.settings`
    names none; its sources' readiness is the tab beside it.
  - F142: the Insights administrator is not in the root user group that holds the `ironstone.insights` service pattern,
    so Assist offers them no Insights tool: as their role, which reads no business data.
  - F58 (a steward's field change reaching every dataset over the document) is not taken up here; it stays open for the
    framework's next report work.
- Decisions:
  - the cap, the default definitions and the time zone are plain setting types Insights alone changes (one path for the
    ceiling rule); the week start and the freshness policy are enumerations Admin may change too;
  - Settings opens for every Insights user: ScopeAndDelivery is every reader's, the form and SourceOwners a settings
    reader's, so the tab needs no screen area;
  - DataReadiness is every reader's for the sources they read (design §2 gave it to the author, steward and administrator);
  - a dataset's class is a BOSS registration, fail closed; Assist reads costs only with `PRODUCT_COST_VIEW`, MCP never;
  - "Add to my dashboard" is an author's, through `store#Analysis`.
- For the lead:
  - budget share: mr-boss 2.2 s server;
  - merge: `data/BossSetupData.xml` and `entity/AdminEntities.xml` are one append each at the end;
    `test/acceptance/AppStructure.spec.js` and `test/acceptance/TuiRender.spec.js` rows are beside Insights P9's (not at the end of the
    maps); `skill/aliases.json` and `test/skill-retrieval.json` are appended at their ends (the Admin track may append there
    too: keep both); `service/ironstone/admin/Registry.js` gains two lines in `present` (Admin's module);
    `plan/design-admin.md` §14.2's Insights row is edited (Admin's design);
  - an existing instance loads BossSetupData for the setting types, the classes and the exposures; nothing to migrate;
  - user's call, built as the default:
    - P7's question stands: every reading group holds `INSIGHTS_SCHEDULE`; ScopeAndDelivery shows who may schedule and
      distribute from the permissions as they are;
    - a lowered cap holds from a schedule's or rule's next save (F130): whether lowering it should also pause or cut
      the existing ones;
    - readers read DataReadiness and ask "Which source is stale?" (F134): or keep it to the author, steward and
      administrator as design §2 had it;
    - a reader cannot keep an Assist answer (Home arranges a dashboard's panels, it adds none): whether readers get a
      personal panel;
  - not built: an Assist draft of a digest's commentary (P7's list), usage analytics (design §17 item 3), quick create
    (Dashboard, Analysis, Schedule by capability, design §1.2), which no phase names;
  - the Assist prerequisites of design §1.2 stay open (Remaining-Work): the active-organization user-facts provider, so a
    question without an organization is answered for the caller's organizations together, and the per-field AI opt-out.

**Review Nov 10 (P10).** Fresh review of mr-boss 2729337a and 202d9f2b; fixes in mr-boss ("Insights P10 review: …") and
this note (branch `ins/p10`).
- Checked and kept:
  - **The typed query tools** (`run#DatasetQuery`, `run#OperationsQuery`, `find#QuerySources`, `find#OperationsSources`):
    only the eleven typed choices are read from a request; the dataset is classed before anything else (no row, a disabled
    row or a People row answers `DATASET_UNAVAILABLE`; a cost row needs the Assist surface and `PRODUCT_COST_VIEW`), then
    `Analysis.js run` finds it among `find#BusinessDatasets {status: admitted}` as the viewer, takes every field from the
    dataset's own list (`find`, never an index into an object), and the engine's `run#Query` runs as the viewer with no
    authorization switched off anywhere on the path (`asViewer`, `asViewerApart` are plain service calls; the engine's
    operations are denied to the root group and pass only by each capability group's ALWAYS, so the inheritable
    `ironstone.insights` grant does not carry them). An organization is checked by `insights.context` (forged or not:
    `ORGANIZATION_UNAVAILABLE`) and only adds a filter under the row filter. 500 rows at most, 20 terms a group. The
    surface is the service, not a parameter. The cost name rule is Drill.js's own expression (`/cost|margin/i`); no shipped
    operations dataset has a field it would have to catch (sales orders, inventory, the Commerce and Customer Service
    ones carry none), and the one cost dataset (sales items) is closed by its class, so the rule only matters for a
    steward's new dataset, which has no class until its owner gives one.
  - **`get#Metric` and `find#Reports` as tools**: wording and navigation only; a definition is read as the viewer, a
    measure's `requiredPermission` is checked, an inherited panel key finds no measure.
  - **The exposure rows**: eight, all `AgclRead` (the row's class is the one the catalog uses, so each runs fenced),
    `previewMode` none; the three Assist number tools `exposeMcp` N, their twins `exposeAssistant` N; no row names an
    engine service. A tool is offered to a user who holds the service (the root group's `ironstone.insights` pattern), so
    the administrator, outside that group, gets none (F142: as their role). The descriptions, the skill and the
    prompts name no field, dataset or person that is restricted and tell the model to give a refusal as the answer.
  - **Add to my dashboard**: own names of the choice list only, each a short scalar; the class and the name rule, then
    `store#Analysis` as the caller in its own transaction (author check, dataset, fields, the guards by running it, a
    private panel, a dashboard only when the caller owns it). A filter value is data to the engine (a whole-string
    `$name` would be the viewer's own dashboard variable, as from Analysis); the title is the user's own field. The
    answer's text is never rendered back by the screen.
  - **`store#Settings`**: `INSIGHTS_SETTINGS_EDIT` through the root grant, the organization through `insights.context`
    (the administrator's active organization, or any internal one with none active; anyone else's own), the revision over
    the organization's own rows of the seven types whoever wrote them, each value from a list read for the saver (ids,
    the server's zones, the two enumerations, a whole number from 1 to the ceiling): no free text is stored, so nothing
    is expanded later. The cap type has no pattern, so Admin's OrganizationDefaults shows it and cannot change it. No
    Insights screen or service takes a cap from a request: Delivery.js and Alerts.js set `insights.recipientCap()` at
    every save and audience check, and a default dashboard, map or digest is used only where the viewer reads it (the
    map through FlowMaps' own `readableMaps`; a user's own default stays P9's `store#DefaultMap`).
  - **DataReadiness for a reader** (F134, F135): `get#Readiness` answers a provider only with its
    `requiredPermission` and each Insights provider only a dataset the engine lists to the viewer (admitted and theirs to
    read; the spec's unadmitted inventory is absent); a row is the source's title, state, last rebuild, lag and expected
    frequency. `request#Refresh` checks the registration's `INSIGHTS_DATASET_EDIT` before the owner's service, which
    takes the dataset from the registration and runs `index#BusinessDataset` as the viewer; a reader calling it directly
    is not authorized, and through the transition gets `REFRESH_DENIED`; the transition takes `insights.` keys only. The
    engine's `find#BusinessDatasets`, now the reading groups' too, answers a non-steward only admitted datasets they read.
  - Admin's `Registry.js` `present`: `lagMinutes` beside `lagText`, null without a watermark; AdminRegistries passes.
- Fixes:
  - **R1, High.** `run#PanelQuery` and `run#OperationsPanel` classed one dataset and returned every query's frames. The
    engine's drill answers the dataset of the one query a request refers to (`queryReference`, the first by default) and
    `panelFrames` is the result of all of the panel's queries together, so a panel whose first query reads sales orders
    and whose second reads sales items gave an MCP client the cost dataset's sums, whatever the class said (confirmed by
    running it: `available` true before the fix). The measure filter did not hold either: a frame's field is named by the
    aggregation's id or a transformation's name, which the panel's author chooses, not by the dataset field, so "a cost
    or margin measure is left out" was true only for an author who named it so. Now the saved panel is read first, as the
    viewer (the dashboard's panel by its own key, or the library panel it references), and checked before anything runs:
    every dataset any of its queries names is held to its class, a query that names none (the engine's telemetry default)
    is refused, a name taken from a variable (`"$…"`) or a repeated panel is not read by a tool, and a cost or margin
    name anywhere in the queries, transformations, footer or the dashboard's filters and variables is `FIELD_RESTRICTED`
    unless the surface reads costs for the viewer. The left-out-measure code is gone. Spec case added.
  - **R2, Low.** A forged organization on a panel is refused before the panel is read (it was, by the drill; kept first
    so the answer does not depend on the panel).
  - **R3, Low.** `recipientCap` for a viewer of every organization with none active (ADMIN, the administrator) took the
    type's default, which can be above an organization's own cap; it is now the lowest of the organizations in scope, as
    F140 has it for everyone else.
  - **R4, Low.** A dataset's readiness told every reader "N documents at the last rebuild", the index's size over every
    organization. The count is now the author's and the steward's; a reader's row has freshness only. Spec assertion added.
- Spec: `InsightsSettings` is 7 features, 2.3 s, the slowest 0.60 s (the Assist feature had grown to 1.06 s with the
  panel cases; they are a feature of their own, and three redundant reads were dropped). One render a screen, no second mode.
- Tests (the shared release binary, `--nobuild`, this phase's runtime): InsightsSettings, InsightsDatasets,
  InsightsAccess, InsightsDelivery, InsightsAlerts, InsightsHome and AdminRegistries, 33 of 33; InsightsSettings again
  after the last edit. Prettier clean. Not run: the acceptance suite, the full suites, a live Assist or MCP turn.
- For the lead:
  - user's call, as the worker left them: readers reading DataReadiness (now freshness only, R4); every reading group
    holding `INSIGHTS_SCHEDULE`; a lowered cap reaching a schedule at its next save;
  - the organization's cap is BOSS's to apply (F130): the engine's `store#Schedule` and a rule's definition, which the
    reading and authoring groups hold directly, are held to the instance ceiling only. No Insights screen passes them a
    cap, but an organization cap the engine enforces needs the schedule to carry its organization (framework, with F118);
  - a tool's saved panel is now refused where it could have answered in part (a mixed panel, a variable in a query, a
    repeat): an attribution of frames to datasets in the engine's drill answer would let it answer the open part
    (framework ask; no shipped panel is affected);
  - the name rule stays a stopgap for field classes (F58, F83): a cost a steward names otherwise in an operations dataset
    is not caught; the class row is the owner's statement that the dataset holds none;
  - a reader's readiness read logs an ERROR for each dataset they may not read (`RECORD_UNAVAILABLE`, from P3's check);
    noise, not a fault;
  - design-insights §1.2 "As built" gains the panel check (one sentence).

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

**Built Nov 11 (P11).**
- Checked first (the phase against the code as Admin P18 left it; impl-admin F285, F286, F289):
  - A device cannot load the `/qapps` shell (its menu, shell data and `actions` are in no route group), and admitting the
    shell would admit what every app's page asks for. So a wall display gets a page of its own, `Insights/WallDisplay`
    (below), and the route group admits that screen's render and its `data` transition by name, nothing else: not
    Playlists, not the Dashboard screens, not a pattern (F149).
  - The display account's authorization: the Insights root is the launcher group's (`BOSS_INSIGHTS`), whose inheritable
    grant opens every Insights screen, so a display account must not hold it; and the root's always-actions call
    `get#Context`, which refuses a user without the root grant (INSIGHTS_UNAVAILABLE), so even an admitted Insights screen
    failed for a display account (F150). The reader bundle reads (engine operations, admitted datasets, documents) and
    opens no screen; a new registered bundle opens the wall display's page alone; the root calls no Insights service for
    a device's request.
  - A playlist and its dashboards are read by the display account only if shared with a group it is in, and
    `share#Dashboard` shared only with the author's own groups (a definition has one group), so no author could make a
    playlist reach a display (F151). The wall displays (`BOSS_INSIGHTS_DISPLAY`) are a share target for any author,
    playlists too.
  - P18's "removing the display account's organization membership leaves the device working and shows that organization
    nothing": confirmed in the code. A device's request runs as the display account (`ec.user.userId`), and Mantle's
    `get#OrganizationRowFilter` computes the organizations of `ec.user` (`get#PartyOrganizationInfo`): with none it
    answers the match-nothing filter, and a display account can hold no privileged group (the system-administrator
    branch) nor set its active organization (the preference transitions are outside its route group). Written into the
    acceptance walk.
  - The framework Playlist's `data` transition takes `index` (a dashboard of the stored playlist) and `from`/`thru`, and
    renders that dashboard's own panels as the viewer: no dataset, query or definition from the request beyond the
    playlist, which the framework forces on a device. It is no general query endpoint and is kept; a range from the
    request changes when, not what (F152). A playlist of one dashboard was never refreshed (the timer moved to the same
    index, which loaded nothing), and a failed load paused the playlist until someone pressed Retry (F153).
  - Device answers and caching: every screen and transition answer of a device carries the conf's `screen-render`
    `Cache-Control: no-cache, no-store, must-revalidate, private` (qvt `private, no-store`); only the static files are
    public, and those carry no device cookie (P18 R1's rotation skips a public answer). The plain page sets
    `private, no-store` itself (checked over HTTP in SecurityDevice).
- mr-moqui (Rust changed: a Debug build in the worktree; no release build):
  - `crates/moqui-core/src/user/device.rs`: `Refusal::page_text`, `refusal_page`, `OUTSIDE_PAGE_TEXT`, `FAILED_PAGE_TEXT`:
    the plain page of a refused display (not registered, revoked, ended, refused for now) and of a device's page outside
    its route group or that failed: one sentence and a link to `/Device`, nothing of the instance (no host, title, theme,
    script, style sheet, route group, device, account or error text). `screen/mod.rs`: `handle` answers a refused device
    whose client takes html with it (an API client keeps the JSON 403), and `error_page` answers a device's page with it
    instead of the instance's error screen (which its route group refuses anyway), with `Cache-Control: private, no-store`.
  - `webroot/js/WebrootReport.js`: `m-report-playlist` takes `kiosk` (no link out, a dashboard's panels with no controls
    through the dashboard's new `display` flag, a failed load retried at the next turn, a 401 or 403 reloading the page so
    the server's plain page replaces it, `report.reloadPage`); a playlist of one loads its dashboard again at each turn,
    keeping the frames shown until the new ones come, for every playlist.
  - `tools/screen/Dashboards/Playlist.xml`: the `data` transition answers a dashboard the viewer may not read with its
    refusal instead of a TypeError (F155).
  - Docs: `docs/security/Shared-Devices.md` (the plain page, a device's page reloading on a refusal, the client spec),
    `Attack-Surface.md` (one sentence), `docs/tools/Monitoring.md` (the kiosk playlist), `plans/Remaining-Work.md` (the
    device row: the "bare 403" item done).
- BOSS:
  - `screen/Insights/WallDisplay.xml` (new, hidden, standalone): html is a bare document (the theme's style sheets, the qvt
    client's files, `WebrootPublic.qvt.js`) with the screen as an island; qvt is `m-report-playlist` in kiosk mode on the
    playlist (as the viewer: a definition that is no playlist or not readable is "not available to this display"), each
    dashboard read as the viewer and one it may not read left out and logged by name, as the framework Playlist does; tui
    the framework's `report-playlist` component; the `data` transition is the framework Playlist's. Nothing writes.
  - `screen/Insights.xml`: for a device's request (`UserSecurityChecks.currentDevice()`) the root sets the defaults only and
    calls no `get#Context`.
  - `screen/Insights/Playlists.xml`: Play full screen (WallDisplay as the viewer, in a new window); the owner's Share with
    wall displays and Stop sharing (`sharePlaylist`, `share#Dashboard`); Register as display (Admin's Security › Devices
    with `newRouteGroupId` `INSIGHTS_PLAYLISTS` and `newParameterValue` the playlist) for a holder of
    `ADMIN_ACCESS_MANAGE`; the devices showing each playlist with their state, read only, for a holder of
    `ADMIN_ACCESS_VIEW` or `ADMIN_ACCESS_MANAGE` (one `find#SharedDevices` call per render, within their identity scope).
  - `service/ironstone/insights/Insights.js` (`shareDashboard`, `shareGroups`) and `DashboardServices.xml` share#Dashboard:
    a playlist as well as a dashboard, and `BOSS_INSIGHTS_DISPLAY` ("Wall displays") as a target beside the author's own
    groups.
  - `data/BossSetupData.xml` (the P18 block): the route group `INSIGHTS_PLAYLISTS` now names `BOSS_DEV_INS_WALL`
    (WallDisplay's render and `WallDisplay.xml/data`, by name, not inheritable) with `homePath` `/apps/Insights/WallDisplay`,
    the idle timeout a week; P18's `BOSS_DEV_INS_PLAYLISTS` rows are gone from the seed (an instance that loaded them keeps
    them in a group nothing names). Appended: the group `BOSS_INSIGHTS_DISPLAY`, its artifact group `BOSS_INS_WALL_DISPLAY`
    (the same two artifacts, ALLOW, VIEW, with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`) and its `CapabilityBundle`
    row (Insights, no permission, so `ADMIN_ACCESS_MANAGE` assigns it).
- Specs (feature time; BOSS on the shared release binary, the framework's on the Debug one):
  - BOSS `Insights/InsightsWallDisplay` (3 features, 0.15 to 0.26, 0.02 to 0.07, 0.07 to 0.09 s): sharing with the wall
    displays (the owner, an author; another group and a reader refused); a display account with the reader and wall
    display bundles registered and redeemed; as the device, the bare page, the island of the registered playlist whatever
    the browser asks for (kiosk, its seconds, the private dashboard left out), the data of the registered playlist's
    dashboard by index, the private one refused, and Playlists, Playlists' data, Dashboard and `/qapps` refused by the
    route group; Playlists (qvt, once, under the webroot) with the device showing the playlist and Register as display.
  - BOSS `Admin/AdminDevices`: its route-group request is now `WallDisplay/data` (its display account holds the reader
    bundle alone and is refused by authorization: F286 as it stands).
  - framework client `SecurityDevice` (+1 feature, 0.00 s on Debug): a revoked device's page and a device's page outside
    its route group are the plain page (403, html, `no-store`, the cookie removed for the revoked one, nothing of the
    instance, a link to `/Device`).
  - framework client `WebrootReport` (+1 feature, 0.00 s): a kiosk playlist of one loads again at each turn without
    clearing what is shown, its panels have no export, inspect or menu and no link out, a failure is retried at the next
    turn, and a 403 reloads the page.
  - cargo `user::device::tests` (+1 test): the plain page of each refusal, nothing of the instance, the text encoded.
  - Acceptance, written and not run: `test/acceptance/Insights/InsightsWallDisplayUsable.spec.js` (the "usable when": the
    author's playlist over store checkouts by organization shared with the wall displays, the display account made in
    Users, the device registered with Playlists' values and its code read once in Devices, the wall playing Retail's
    numbers only with no one signed in and opening nothing else, Playlists listing it, the membership ended showing no
    one's numbers, the revocation in Admin refusing its next request). `test/acceptance/AppStructure.spec.js` gains
    WallDisplay's row; `test/acceptance/Admin/AdminDevicesUsable.spec.js` its two paths now `WallDisplay/data` (not run).
- Tests run: the specs above; BOSS `InsightsDashboards`, `InsightsAccess`, `AdminAccess`, `AdminDevices`; framework
  `DeviceCredential`; cargo `-p moqui-core --lib user::device` (4) and `screen::` (459 passed), clippy of `moqui-core`
  (nothing in the files touched), rustfmt of them; `moqui lint --screens` (no parse failure; WallDisplay's and the root's
  flags are the `static-class` and `catch-bare` notes of any screen script naming `WebUtilities` or a host global). No
  suite, no acceptance test.
- Rendered by hand, in a real browser (a throwaway client spec and fixture, deleted, under `./moq test-client mr-boss
  --serve --debug`): `/Device`, the code, the redirect to `/apps/Insights/WallDisplay`, the playlist playing (title,
  1 / 1, the dashboard's text panel, no panel controls or links), `/apps/Insights/Playlists` answered with the plain page
  (403, "This page is not part of this display."), and the wall again. No server was run by hand (the worktree path).
- Inventories: none names Playlists' device parts or WallDisplay (design §2's WallDisplay row is new); nothing to mark.
- Design edits: design-insights §2 (the WallDisplay row) and §4 Playlists (the bundles; "As built" P11); design-admin §6
  Devices (its "As built": Insights' wall display); design-crosscut CX-DEVICE's need row.
- Findings:
  - F149: a device cannot load `/qapps` (impl-admin F285). Resolved: a page of its own, `Insights/WallDisplay`, the island
    of its own qvt render; the route group names it and its data transition alone.
  - F150: the Insights root's `get#Context` refuses a user without the root grant, so a display account (which must not
    hold it) failed on any Insights screen, and the reader bundle opens no screen (impl-admin F286). Resolved:
    `BOSS_INSIGHTS_DISPLAY` opens WallDisplay and its data alone; the root calls no Insights service for a device's request.
  - F151: a definition has one group and `share#Dashboard` took only the author's own, so no playlist could reach a display
    account. Resolved: the wall displays are a share target for every author, a playlist too; a playlist shared with them is
    read by its owner and the displays only, so an access administrator who is not its owner registers it in Admin's
    Devices by its id rather than from Playlists (Register as display is on the rows the viewer reads).
  - F152: the framework Playlist's data transition takes `from` and `thru` from the request; on a device they change
    when, not what (the stored dashboard's own panels, as the display account). Kept.
  - F153: a playlist of one dashboard never refreshed, and a failed load paused a wall display until someone pressed
    Retry. Fixed in the framework playlist (every playlist; the retry in kiosk mode).
  - F154: a refused device got a bare 403 JSON, and a device's page outside its route group the same (impl-admin F289).
    Resolved: the plain page, for a browser's page only.
  - F155: the framework Playlist's data transition answered a dashboard the viewer may not read with a TypeError
    ("cannot set property 'definitionId' of undefined") after the refusal. Fixed: its refusal is the answer.
- Decisions made here:
  - A wall display plays on a page of its own, `Insights/WallDisplay`, not the shell: a bare html document whose island is
    the screen's qvt render; the route group admits that render and its `data` transition by name.
  - A display account holds two registered bundles: the Insights reader (the reading) and the wall display (WallDisplay and
    its data, view only). Neither opens another Insights screen.
  - The wall displays are a share target every author may choose for a dashboard or a playlist (definitions only).
  - A refused device's browser, and a device's page that is refused or fails, get a fixed plain page; an API client the JSON.
  - A kiosk playlist retries a failure at its next turn and reloads its page on a refusal; any playlist of one refreshes at
    each turn.
  - The idle timeout stays a week (a display asks at every turn; a week ends one switched off or replaced).
- For the lead:
  - Budgets (feature time): BOSS server +0.3 s (InsightsWallDisplay); framework client +0.01 s (one feature each in
    SecurityDevice and WebrootReport).
  - Merge: `BossSetupData.xml` (the P18 block's route group rows replaced, the P11 rows appended at the end);
    `test/acceptance/AppStructure.spec.js` one row after AddToDashboard; mr-moqui `WebrootReport.js` and its page test,
    `Playlist.xml`, `screen/mod.rs` and `user/device.rs`, `Remaining-Work.md` (the device row), `Shared-Devices.md`.
    `test/client/suite.js` and `TuiRender.spec.js` unchanged.
  - An instance that loaded P18's seed keeps `BOSS_DEV_INS_PLAYLISTS` and its two members in a group no route group names
    (harmless; deleting them is the lead's call).
  - The user's call: whether an access administrator should see the playlists shared with the wall displays in Playlists
    without owning them (F151; today they register by the playlist's id in Admin › Devices); whether a person may be
    given `BOSS_INSIGHTS_DISPLAY` (it is meant for display accounts; a person with it alone gets no Insights context).
  - Not verified: the acceptance tests (not run); a real wall display over a day (the daily secret's replacement on a
    kiosk's answers is P18's); two servers.

**Review Nov 11 (P11).** Fresh review of mr-moqui dc7d01f4 and mr-boss 50e41d1c; fixes in mr-moqui and mr-boss ("Insights
P11 review: …") and this note (branch `ins/p11`).
- Checked and kept:
  - **Confinement, as a device over HTTP** (a throwaway client spec and fixture under `./moq test-client mr-boss --serve
    --debug`, deleted: a display account with the reader and wall display bundles, a device redeemed by its code, 36
    requests). Admitted: WallDisplay's html (the bare page), its `.qvt` (the island's one load; `private, no-store`), its
    tui, text, csv and xml renders (the screen's own render, empty in the modes it has no template for) and `data`.
    Refused with the plain page (403, `private, no-store`): the Insights root, Home, Dashboards, Dashboard, Playlists and
    its `data`, Reports, ScheduledReports, Drill, Records, Chatter, `/qapps`, `/qapps/Insights/WallDisplay`,
    `/qapps/menuData`, `/apps/getPreferences`, WallDisplay's `actions`; 404 plain for `/vapps`, `/apps/menuData`,
    `WallDisplay.js`, `WallDisplay/menuData`, `WallDisplay/Chatter` (WallDisplay has no subscreen or include); REST the
    JSON 403. The island needs nothing else: the qvt client's files are static (`check_route` admits a static file no
    render requires authentication for), and WebrootPublic asks the screen's `.qvt` alone (no `actions`, `menuData`).
  - **The forced playlist**: `definitionId` in the query string, an extra path segment (`data/OTHER`) or the form is the
    registration's (`screen::handle` puts it over the merged parameters, the JSON body's included); the transition is GET
    only (a POST is 405). The index is an integer within the stored playlist (7, -1, 0.5 refused). Each dashboard and each
    panel's datasets are read as the display account (`get#Definition`, `render#Dashboard`, no authorization switched off
    on the path), so the row filters and the alias rule hold as for a person; an unreadable dashboard is left out of the
    page and named in the log, and refused by the data transition.
  - **The root's skip**: `UserSecurityChecks.currentDevice()` is `user::device::current_scope()`, set only by
    `begin_request` for a valid device cookie; a person's request cannot set it. A person holding `BOSS_INSIGHTS_DISPLAY`
    alone still runs `get#Context`, which refuses them, so WallDisplay fails for them.
  - **The plain page**: one sentence and a link to `/Device`, no script, style sheet, title of the instance, route group,
    device or error text; `private, no-store`. A refused device's answer returns before the daily rotation and removes the
    cookie only when the device is no more (revoked, ended, unknown); a page outside the route group carries the day's
    new secret as any whole answer does (P18 R1). Revoked and ended are told only after the secret matched, Unknown for a
    wrong secret or no device alike: the page tells an html client nothing the JSON did not.
  - **Framework playlist changes for ordinary viewers**: outside kiosk the only changes are a playlist of one reloading
    its dashboard at each turn (keeping the frames shown) and the turn's ceiling (R3); the Playlist screen's `data`
    answers an unreadable dashboard with its refusal. `InsightsDashboards` and `WebrootReport` (50 features) pass.
  - **Upgrade**: an instance that loaded P18's seed keeps `BOSS_DEV_INS_PLAYLISTS` and its two members; no
    `ArtifactAuthz` ever named it (it was only a route group's allow-list) and the seed's `INSIGHTS_PLAYLISTS` row (same
    key) now names `BOSS_DEV_INS_WALL`, so it grants and admits nothing. Harmless.
  - **Playlists**: Share with wall displays posts to `share#Dashboard` (owner and authoring checked there), Register as
    display is a link to Admin (its service checks `ADMIN_ACCESS_MANAGE`), the devices column one `find#SharedDevices`
    in the viewer's identity scope with its failure logged.
  - **Specs**: InsightsWallDisplay three features (0.20, 0.05, 0.09 s), WallDisplay rendered once in html and once in
    qvt, Playlists once in qvt and nowhere else in the regression suite; the client features 0.00 s.
- Fixes:
  - **R1, Medium.** WallDisplay took the framework Playlist's `data` transition, which read `from` and `thru` from the
    request: anyone at an unattended wall's browser could make every panel of the playlist query decades
    (`from=now-40y` was honored), and a panel's failure went to the wall in full: "User 100000 is not authorized for
    AT_SERVICE [org.moqui.report.dataset.otel_spans] action view" (the display account's id and the dataset's service).
    WallDisplay's `data` is now its own: the page's range (now-30d to now) whatever the request says, a dashboard of the
    playlist only (type checked), each error notice replaced by "This panel is not available to this display." with its
    text logged by playlist, dashboard and panel, no inspection or request detail, and any failure one fixed message.
    InsightsWallDisplay asks for 30 years and a panel over a dataset the account may not read, and checks both.
  - **R2, Medium.** The kiosk's reload on a 401 or 403 had no limit: a refused data request under a page that still
    renders (a route group admitting the page and not its data, an authorization the page does not need) reloaded the
    page, scripts and all, as fast as it loaded, for good. `report.reloadPage` now reloads at most once a minute (the
    time in the tab's `sessionStorage`) and answers false otherwise, and the playlist then goes on to its next turn. And a
    kiosk whose playlist was reordered under it paused for a Reload button no one presses (the wall froze until someone
    came): it reloads the page instead, on the same limit. WebrootReport's kiosk test covers both.
  - **R3, Low.** A playlist's seconds went to `setInterval` unbounded; past about 24.8 days the timer fires at once, so
    an author's large number made a wall ask for data every millisecond. The player holds a turn to 5 s to a day, and
    WallDisplay the page's seconds to 5 to 3600.
- Tests: InsightsWallDisplay, AdminDevices, InsightsDashboards (9 features pass, Debug); client SecurityDevice (6) and
  WebrootReport (50, offline); `moqui lint --screens` (no parse failure; WallDisplay's flag is the `WebUtilities` note).
  No cargo test (no `.rs` changed), no suite, no acceptance test.
- For the lead:
  - Budgets: unchanged in substance (InsightsWallDisplay 0.34 s of feature time; the client's kiosk test 0.00 s).
  - The user's call, `BOSS_INSIGHTS_DISPLAY` held by a person: it opens nothing for them (WallDisplay fails without the
    root grant; with it, WallDisplay shows only what Playlists already plays for them), but membership makes them read
    every definition shared with the wall displays, every organization's authors' (titles, panels, text panels; the
    numbers stay row-filtered to their own organizations). Access cannot refuse it today: a display account must hold a
    registered bundle, and no bundle field says "display accounts only". The fix, if wanted, is framework: a
    `CapabilityBundle` flag that `storeMembership` and `bundleOptions` refuse to a non-display account (and Mantle's
    `create#DisplayAccount` allows). Left as is; Low.
  - The user's call, F151 across organizations: the wall displays are one group, so a playlist or dashboard shared
    with it is readable by every organization's display accounts. No author pushes onto another organization's wall
    by sharing alone: a wall plays only the playlist its registration fixed, chosen by an access administrator within
    their identity scope. But a registrar of organization B may register organization A's shared playlist by its id, and
    then A's author's later edits (titles, text panels, which dashboards) appear on B's wall with B's numbers; and an
    author may put any wall-shared dashboard of another organization in their own playlist. Options: refuse on a device
    a playlist or dashboard whose owner shares no organization with the display account, or one display group per
    organization. Recorded, not changed.
  - Finding: a definition has one group, so sharing a dashboard with the wall displays takes it from the author's team
    (and Share with wall displays on a playlist shared with a group moves it silently). Worth a line in design §4.
  - Low, not fixed: under the dev conf's boundary comments WallDisplay's html begins with a comment before
    `<!DOCTYPE html>`, which puts the page in quirks mode (dev only; production writes no boundary comment).

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

**Built Nov 11 (P12).** mr-boss and mr-moqui (branch `ins/p12`; Mantle is not touched; no Rust, on the shared release binary).
- **Checked first** (the phase against the code and the earlier phases' open items): the copied report screens are all
  replaced (P7 the last), so the legacy mapping is the saved finds and schedules of their lists; TuiRender already swept
  Insights in tui as john.doe with authorization off, and no sweep covered it in server-static; the framework's
  `import#Definitions` already keeps an imported alert rule inactive (`prepare_copy`) and saves each definition through the
  same save (an imported dataset is a new id, never admitted), and Insights denies import to every group (P1); FlowMap
  already had the ordered list (StepList, P9); every Insights demo user is in `BOSS_USERS`, so the Chatter and RecordFiles
  mounts gave them nothing Commons does not, but the root's inheritable grant opened their writes to a user given Insights
  without Commons (F156).
- **Acceptance** (written, not run; the lead runs the suite at the end of the build):
  - `test/acceptance/Insights/InsightsTui.spec.js`: every Insights screen file and the ten record mounts (the tabbed ones by
    their `InsightsRecord` subscreen) render in tui as a model document with no error node, as john.doe with authorization
    on, on the demo's records; a second feature checks three twins' data (the supplier flow's steps, the shipped alert rule,
    Retail's settings). `test/acceptance/TuiRender.spec.js` no longer sweeps Insights (its Insights rows removed): one sweep per
    app per mode.
  - `test/acceptance/Insights/InsightsServerStatic.spec.js`: ServerStaticLib's full check of every plain XML Insights screen (no
    Insights screen is marked server-static yet; none errors).
  - WallDisplay is in neither sweep: a device's bare page, not a shell screen, with no terminal twin; it is left to the
    regression InsightsWallDisplay and the acceptance InsightsWallDisplayUsable, and the review walk's last feature.
  - `test/acceptance/Insights/InsightsReviewWalk.spec.js` (design §13.3, §8), `dependsOn` InsightsDatasetsUsable, nine features:
    rows (each group's Retail user and the Services reader through Explore's page and its value suggestions, the engine's
    direct query with a forged filter, a terms aggregate and the export, the administrator reading none); dashboards, an
    embed (`render#Dashboard` of the suite panel with forged variables), Home, the Home layout and the context for another
    organization; drill (refused for another organization, forged variables reach no other organization's orders) and the
    record context of another organization's order; costs (Assist refuses `mantle-sales-items` to every user without
    `PRODUCT_COST_VIEW`, MCP to the financial reader too); Assist (another organization refused, the typed answer of the
    reader's organization only); schedules and alerts (the Services reader refused with a reason that names no
    organization, a reader refused the audience check); the palette, saved reports and flow maps (a Retail copy shared with
    every Insights user is not listed or read for the Services reader); the dataset-alias attack (the steward's alias over
    `otel_logs`, over the sales document without its signal, and with the business signal over the log index; an author's
    log alias; the steward's direct log query: all refused, nothing kept); and the wall display (a device plays its
    registered playlist whatever its request names, reads its organization's numbers only, opens nothing else of Insights,
    Chatter and the record mounts included, and is refused after revocation).
- **The §14 outputs:**
  - **Delivery audit** (built): `DeliveryServices.export#DeliveryAudit` over `Delivery.js deliveryAudit`: one run's statuses
    as CSV for whom `get#Delivery` answers it (the owner each recipient's result, safe reason and attempts; a recipient their
    own row, named), no address or content, a formula-leading cell made text, audited by the engine as `delivery-audit`;
    ReportDelivery's Export status (`exportAudit`).
  - **Business map print** (built): FlowMap's Print opens the page in `html-print` (to PDF where the server has one) for the
    same map, organization, counts and step; checked by hand as `insights.reader` (200, no error, the lanes and the steps in
    order). The ordered list is P9's StepList.
  - **Definitions bundles** (recorded, not built): the export is already every reading group's (the mounted editor's
    `export#Definitions`); import stays Tools' and an instance administrator's. The engine already keeps an imported rule
    inactive and a dataset unadmitted and holds no schedule in a bundle; an author's import waits on `save#Definition`
    refusing a group the owner is not in (F42), since a bundle names each definition's group (F159).
- **The legacy mapping** (design §13.2): `RegistryServices.migrate#LegacySavedFinds` (Registry.js), an instance
  administrator's upgrade step (`ADMIN_REQUIRED` otherwise): every saved find of an Insights list and every schedule of an
  Insights screen by ID, owners, groups and list or path, with its action (moved, kept, invalid); with `apply` the moved ones
  are rewritten (DatasetDetail/FieldList's FieldList and ConditionList to DatasetFields', the copied scheduled finds' list to
  Scheduled reports' Schedules, and a schedule's old path), each find keeping its owners, groups and fields (a field the new
  list lacks is named). SavedReports shows a find whose list is gone as "Not valid" with no link (`findList`, `invalid`);
  no alias route. The demo has no such find (F28); P7 converted the copied scheduled finds.
- **Loose ends:**
  - **Chatter and RecordFiles under the Insights mount** (fixed, F156): the root's always-actions serve its Chatter and
    RecordFiles mounts only to a user whose own grants open Commons (`DrillServices.get#RecordPanelAccess`, Records.js:
    `destinationOpens(grants, "Commons")`), who reaches the same transitions in Commons under the same filters; else
    `RECORD_PANEL_UNAVAILABLE` before any transition runs. ProcessStory's Knowledge pages, the only Insights screen that shows
    a panel, are a Commons user's already.
  - **The `ignore-error` capture** (fixed for Insights, impl-admin F129, F101): `Insights.js answering` answers a read's
    refusal as `refusalCode` and `refusal` when the caller passes `answerRefusal` (any other failure as `FAILED` with a plain
    sentence, logged); `find#SavedReports`, `find#Reports`, `get#ReportOptions`, `get#Home`, `get#Attention`, `get#Drill`,
    `get#AnalysisOptions` and `get#AnalysisResult` take it, and SavedReports, Reports, Home, Drill and Analysis pass it and show
    the reason (Home's attention line now says why). Other callers are unchanged (they still get the error). The other
    `ignore-error` sites of Insights read no message (they show a not-available state).
  - **The organization's recipient cap** (recorded, F157): BOSS applies it (`Insights.js recipientCap` at every save and
    check of a schedule's or rule's audience); the engine's `store#Schedule` and an alert rule's definition, which the reading
    and authoring groups hold directly, hold the instance ceiling only. The engine holding it needs a schedule and a rule to
    carry their organization (framework, with F118); Remaining-Work's report engine row says so.
  - **Wall-display sharing across organizations** (recorded, §5): a registrar of organization B may register A's wall-shared
    playlist; A's later edits show on B's wall with B's numbers; an author may put another organization's wall-shared
    dashboard in their own playlist. The two options are in §5 for the user; nothing changed.
  - **A definition has one group** (done): design §4 says so (As built, P12); Dashboard's Share dialog names the group the
    dashboard is shared with now and that another choice replaces it; Playlists names a playlist's other group and asks before
    Share with wall displays takes it from that group.
- **Specs** (regression, assertions in existing specs only): InsightsRecords' OrderDetail feature (the record panels: a note
  and the files refused with the reader's Commons membership ended, the panel answering before; 0.39 s) and its drill
  feature (the refusal answered with `answerRefusal`; 0.28 s); InsightsDelivery's Send now feature (the status export of the
  owner, the reader's own row, the outsider refused; 0.51 s); InsightsCatalog gains one feature (a legacy find not valid, the
  migration's dry run, refusal and apply; 0.10 s, no render).
- **Tests run** (release binary, `--nobuild`, this phase's runtime): InsightsRecords, InsightsDelivery, InsightsCatalog,
  InsightsDatasets, InsightsHome, InsightsAccess, InsightsDashboards, InsightsWallDisplay, InsightsFlowMaps, InsightsSettings,
  InsightsAlerts and ProjectsAccess: 55 of 55 (mr-boss 16.8 s of feature time); `moqui lint --screens` clean (no parse
  failure; the one Insights flag is P11's). By hand: FlowMap in html-print, Playlists, ReportDelivery. Not run: any
  acceptance test, the full suites.
- **Records:** design-insights §2's Impl column names each screen's phase; §4 (one group), §13.2 (the legacy mapping) and §14
  (each output) gain As built notes; ss-inventory's Insights line and usl-inventory's Insights rows (`setup#UserOrganizationInfo`,
  `get#PartyOrganizationInfo`, `store#PartySetting`, the attention counts `find#Payables` and `find#Records`, and a note of the
  newer Mantle services Insights calls that have no row); mr-moqui `plans/Remaining-Work.md`'s report engine row (field
  classes, an organization on a schedule and a rule, authors' bundle import, more than one group or a per-organization wall
  share); the mr-boss README's Insights sentence.
- **Findings** (provisional):
  - F156 (medium, fixed): the Chatter and RecordFiles mounts under the Insights root opened their writes (log a note,
    message, upload, remove) to a user given Insights without Commons, by the root's inheritable grant (the P6 R1 lesson).
  - F157 (open, framework): the organization's recipient cap is BOSS's alone; the engine holds the ceiling.
  - F158 (open, F83 and F58 restated by the review walk): an admitted `mantle-sales-items` gives every reader its cost and
    margin fields in Explore, a direct query, an analysis's measure list and a panel's own aggregate; design §13.3's "cost
    fields never reach an unauthorized response" holds in Assist, MCP and drill only. The walk does not assert it. Until
    field classes (Remaining-Work), the alternatives are granting `mantle-sales-items` to cost holders only, or a cost-free
    items dataset for readers: the user's call.
  - F159 (open): an author's bundle import waits on F42; the export is every reader's.
  - F160 (low): `get#Delivery`'s own delivery, as a recipient reads it, did not carry their name in the export (the
    engine's row is the recipient's own), so the export names the caller from their account.
- **For the lead:**
  - Budgets: mr-boss server +0.1 s (InsightsCatalog's feature; the other assertions sit in features already timed).
  - Merge: shared with Admin P19: `test/acceptance/TuiRender.spec.js` (the header, the app list, the feature title and the
    removed Insights rows), the mr-boss README (the Insights sentence of the paragraph Admin's sentence opens; "They are built
    in one order" left as it was), mr-moqui `plans/Remaining-Work.md` (the report engine row only), usl-inventory's
    `setup#UserOrganizationInfo` row (Admin may add its root to the same cell: keep both). Not touched: AppStructure,
    BossSetupData (no grant changed; the new services' verbs `export`, `migrate` and `get` pass ProjectsAccess).
  - An existing instance: run `ironstone.insights.RegistryServices.migrate#LegacySavedFinds` once as an administrator
    (first without `apply` to read the inventory); nothing else to load.
  - The user's call: §5's wall-display sharing across organizations; F158 (costs to readers in Explore until field
    classes); P10's open items stand (readers reading DataReadiness, every reading group holding `INSIGHTS_SCHEDULE`, a lowered
    cap at a schedule's next save).
  - The acceptance suite: InsightsReviewWalk, InsightsTui and InsightsServerStatic are new and unrun; InsightsReviewWalk
    creates a display account and device per run (revoked at its end) and an alert rule and flow map copy (removed).

**Review Nov 11 (P12).** Fresh review of mr-moqui e81b6c1b and mr-boss fcad146e; fixes in mr-boss ("Insights P12 review: …")
and this note (branch `ins/p12`).
- Checked and kept:
  - **The record panels under Insights (F156)**, by URL (a throwaway spec, deleted) as insights.reader with their
    `BOSS_USERS` membership ended: every Chatter transition tried (chatterData, timeline, searchRecords, downloadFile, logNote,
    sendMessage, deleteEntry), ChatterTui, and RecordFiles' upload, download, remove, addFromFiles, the file picker's
    pickerData and RecordFilesTui are refused `RECORD_PANEL_UNAVAILABLE` before the transition runs; with the membership each
    reaches its own service (a validation error for the missing input). The check is the server's, at every request, in the
    root's always-actions on the resolved path: a render-mode suffix (`Chatter.qvt`) is resolved to `Chatter` before it,
    subscreen names are matched exactly, Insights has no no-sub-path wrapper, `/qapps/Insights/…` is the shell (no transition
    runs), and no other path reaches the two screens below Insights (Records' mounts serve no transition, P6; ProcessStory's
    Knowledge its own check, P9). A device's request skips it; its route group admits WallDisplay alone.
  - **`answerRefusal`**, probed on the services refused (get#Home and get#Attention for another organization, as the reader
    and the Services reader; get#ReportOptions of an unknown entry; get#AnalysisOptions and get#AnalysisResult as a reader):
    every data out-parameter is null beside `refusalCode` and `refusal`, and the refusal is the default's own message without
    its code, so a caller learns nothing the error did not carry; without the flag each fails as before. Of the eight only
    `find#Reports` is an agent tool (Assist and MCP); with the flag it answers the same code and text, and any other failure
    a fixed sentence. Each screen shows the refusal or a fixed sentence and drops the answer's data (`!refusalCode`).
  - **`export#DeliveryAudit`**: the owner every recipient's row, a recipient their own (F160: the name is the caller's own
    account's, which they read anyway; the owner's rows carry the names ReportDelivery already shows them); the columns are
    the run's title, date, kind, mode and state and each recipient's name, result, safe reason, attempt and count, no address
    or content; audited through `audit#Export` (kind, format, row count; the engine's audit names no run, as Explore's);
    a cell beginning `=`, `+`, `-`, `@`, tab or CR made text; bounded by the run's recipients (the organization's cap under
    the instance ceiling); another's run refused `DELIVERY_UNAVAILABLE` (InsightsDelivery). The GET transition's audit
    write is allowed (the read fence is an agent render's only).
  - **`migrate#LegacySavedFinds`**: ADMIN only (`access.systemAdmin`, the `ADMIN` group), not remote; an inventory unless
    `apply`; it writes only a find on one of the three replaced lists whose list is gone and a schedule of the two replaced
    paths. A second apply changes nothing: a moved find's new location is not a replaced list and exists (kept), a moved
    schedule's new path is not a replaced path (kept). SavedReports shows a find on a list that is gone "Not valid" with no
    link; no alias route.
  - **FlowMap's Print**: html-print escapes the map's text (a map titled with `&` and quotes rendered `&amp;`, `&quot;`; a
    title refuses `<` and `>` at input); the link's parameters are encoded.
  - **One group**: Dashboard's Share dialog names the current group before a choice; Playlists asks, naming the other group,
    before Share with wall displays; both post to `share#Dashboard`, which checks authoring and the owner
    (`DASHBOARD_NOT_OWNED`). Playlists reads the descriptions of only the groups its listed playlists are shared with.
  - **The acceptance specs** (read, not run; their services and parameters checked against the definitions): TuiRender sweeps
    no Insights screen and keeps no Insights parameter; InsightsTui walks every Insights screen file but WallDisplay and
    Records, and the ten record mounts in Insights' read-only context (the same files TuiRender's Shared sweep renders
    outside it); InsightsServerStatic checks each plain XML screen once. InsightsReviewWalk covers design §13.3 and §8 as the
    phase lists: rows and a forged filter, terms (the value counts), the export, dashboards and an embed with forged
    variables, Home, its layout and the context, drill and a record of another organization, costs through Assist and MCP,
    Assist for another organization, a schedule's audience and an alert rule's, the palette, saved reports, flow maps, the
    alias attack and the wall display. It does not call `store#Schedule` itself (`check#Audience` is the engine's same
    check) and does not assert F158.
  - **F158, on the current code** (mr-boss master has no Insights change since the branch's base; the engine is master's
    release binary): with `mantle-sales-items` admitted, insights.reader (no `PRODUCT_COST_VIEW`) read `itemCostTotal`,
    `itemMarginTotal` and each issuance's `acquireCost`, `issuedCostTotal` and margins in `query#Documents`' rows, and a
    `run#Query` sum of `itemCostTotal`; insights.author (no `PRODUCT_COST_VIEW`) was offered the cost and margin fields among
    Analysis' measures and ran a sum of `itemCostTotal` by currency. A panel's own aggregate is the same `run#Query`. Assist
    and MCP refuse it (InsightsSettings). It holds as written; nothing changed.
  - **Records**: design §2's Impl column, §4, §13.2 and §14 match the code; the inventories' rows; the README sentence; the
    Remaining-Work row.
- Fixes:
  - **R1, Low.** `Insights.js answering` took any `WORD:` prefix for a refusal's code, so an exception's text beginning
    `ERROR:` (a database's), `URL:` or `JSON:` reached the screen as a reason. A refusal's code now has an underscore (every
    Insights and engine refusal's does) and its text is at most 300 characters; anything else is `FAILED` with a fixed
    sentence, as Admin P19's review made `AdminCalls.read`.
  - **R2, Low.** `Registry.js findList` compared a dynamic form's find location (`…form_list$Name#extension`, the framework's
    `saved_find_location`) with the form's name, so such a find would show "Not valid" in SavedReports (no mr-boss list is
    dynamic today). The extension is dropped before the check.
  - **R3, Low.** `migrate#LegacySavedFinds` wrote its rows in a loop with no tolerance: a row that cannot be written is now
    answered `failed` and logged by its id, and the others go on (AGENTS.md).
  - **R4, Low.** InsightsTui's second feature rendered FlowMap, AlertDetail and Settings again in tui; it now reads the
    sweep's renders, so each screen is rendered once per mode.
- Tests: InsightsRecords, InsightsCatalog, InsightsDelivery, InsightsHome, InsightsDashboards (and InsightsDatasets, their
  dependency): 28 of 28, 5.6 s of feature time, release binary. No screen changed, so no lint; no acceptance test, no suite.
- For the lead:
  - Budgets: unchanged.
  - The user's call: F158 confirmed on the current code (above); §5's wall sharing across organizations as the Built note.
  - Merge: the README's "They are built in one order, and the rest of each is next" now follows "Insights is built"; worth a
    word when Admin P19's sentence is merged beside it.

**Acceptance Nov 11 (after gate 5).** `mail_capture_sends=true ./moq accept mr-boss` on master, release binary, the first
run after the whole Admin and Insights build; this note is Insights' failures and the screen sweeps' (branch `acc/insights`;
Admin's are impl-admin's). All the Insights failures were spec bugs; none is a product defect:
- InsightsReviewWalk "schedules and alerts reach only owner-equivalent recipients" stored the Services reader on a copied
  rule and expected `RECIPIENT_REFUSED`. Checked as a possible security defect first: a copy is paused (not validated), and
  a paused rule's audience is a draft that tells nobody; the engine checks every recipient when the rule is saved active
  (`alert_delivery.rs` `refuse`, BusinessAlerts) and again before each notification (`scope-differs`), as AlertServices
  documents. The walk now stores the draft (applied, paused), activates it (`pause#Alerts`), which is refused
  `RECIPIENT_REFUSED` naming the Services reader, and checks the rule stayed paused. The walk's `attempt` also called every
  service twice (a refusal check, then the call), so each copy was made twice and one left behind (the palette found two
  maps); it calls once now. Its wall display feature registered the device with a code and then asked `reveal#SharedDeviceCode`
  for one (refused, so no device cookie): it registers with `issueCode: false`, as Admin's Devices does.
- InsightsFlowMapsUsable read Commerce's own count by calling `get#StoreWorkSummary` directly as john.doe, a service granted
  through Commerce Home's screen and not to a direct call; the flow map's count itself is right (the attention board calls the
  provider inside Insights' service). It reads it with the artifact check off (the service scopes by the user's stores);
  ProcessStory was rendered as the leaf in qvt, whose default subscreen (Commons Knowledge) is a .qvue screen with no qvt:
  it is rendered from its own level (`lastStandalone` -4), as the shell loads it.
- InsightsSettingsUsable expected a 200 from the refused post (a transition redirects, 302); it now checks the redirect and the
  service's `RECIPIENT_CAP_CEILING`. Its Assist feature read the suite panel from a `Definition` row (a shipped definition is a
  file: read through `get#Definition`) and the frame by field names the frames do not use (they are the aggregations' ids).
- InsightsWallDisplayUsable rendered Playlists' `sharePlaylist` (a post transition) as a page, so nothing was shared; it posts
  now. It then expected john.doe's Playlists to list the device, though he reads only his own playlists and those shared with
  his groups (a definition has one group): it checks the author's Playlists shows the playlist on the wall displays (the
  regression InsightsWallDisplay lists devices for an owner who registers them). Its revoke came after the display account's
  Retail membership was ended, which puts the device outside admin.access's organization scope (`DEVICE_UNAVAILABLE`); the
  instance administrator revokes it.
- AppStructure swept Insights' Records group with no record: it is reached from a drill with an order, so the sweep gives it
  one (`Insights/Records` with `orderId`).
- Not this build's, upstream of it: TuiRender (Commons and Customer Service ContactDetail) and CommerceTui (Merchandising
  Reviews) "A dialog of a list row did not render": a `section` in a list row's container-dialog was an error node by design
  (ScreenTui.js, Oct 21); ContactRecord's contact info dialog has had one since Oct 19 and only renders since mr-moqui
  9ff43d2e (Nov 9) rendered a container's widgets in a list cell, and Reviews has one since mr-boss dc419165 (Nov 10).
  Fixed in mr-moqui (ScreenTui.js): a section or section-iterate inside a captured row dialog is its nodes as a value
  (`sri.renderSectionValue`, Nov 9, which a section in a cell already uses); an include or subscreen there stays an error
  node. Cargo `a_container_dialog_in_a_list_cell_is_a_dialog_of_its_row` (the section's condition and fail-widgets per row)
  and the `tui/structure` golden; moqui-core `screen::tests` 365 passed. WarehouseServerStatic is left failing, recorded for
  the user: mr-boss 35223fd6 (Nov 10) made AssetDetail's Move link a screen path from an expression
  (`${sharedLinks['Transfers/Move']}`, no longer `url-type="plain"`), which the server-static check reports as
  `[disable-link] link # is not a screen or transition` for AssetDetail and its marked subscreens Files and Notes (with
  `url-type="plain"` back the sweep passes); whether to keep the screen path and unmark them, or keep them static, is the
  app's call. Reviews renders a row dialog only when a review exists (after the Commerce walks), so CommerceTui passes alone.
- Runs: each fixed spec alone; then the thirteen Insights acceptance specs with AppStructure and WarehouseServerStatic
  together (release); CommerceTui, TuiRender and InsightsTui on the Debug binary with the fix (no error node). On Debug the
  Customer Service demo order `BOSS_CS_SO_DELIVERED` and its texts are missing from TuiRender, AppStructure and CommerceTui's
  second feature (qvt too, so not the tui change; the release binary shows them). A server suite run by mistake (release, the
  fixes without the tui one) passed every Insights spec but InsightsCatalogUsable (panel 17 orders against OnlineSales 15 in
  the latest month, after the other walks' orders; it passes alone and passed in the lead's run): open, order-dependent.
  Resolved: 17 was right (the store's 17 placed orders that month, as the database and the order-part index have them); a
  spec artifact, not a disagreement of the two definitions. CommerceReviewsScenario writes its buyers' delivered orders as
  records (header, part and item created OrderOpen, then header and part set OrderCompleted within milliseconds), and the
  sales feed left some of those orders' `MantleSalesOrderItem` documents at OrderOpen for good (no pending row, still stale
  later; which order varies by run), so get#SalesOrderSummary, which needs a placed status on the item document, missed
  them while the panel's `MantleSalesOrderPart` documents had them (reproduced with CommerceReviewsScenario alone before the
  spec: 6 against 5). The spec now indexes the month's sales part and item documents again before counting, and passes the
  panel's range inside the query (beside it, it was ignored and the engine counted the default last 7 days), in the
  reporting user's calendar month as OnlineSales does. For the lead: the feed leaving an item document behind its order's
  later status change is a framework finding (moqui-core `search/feed.rs`, a related record's update soon after the
  primary's create), not fixed here.
- For the lead: findings, each one line: admin.access cannot revoke a device whose display account has left its organization
  (out of scope reads as not available; the instance administrator can); Playlists lists a playlist's devices only to a
  reader of the playlist who holds `ADMIN_ACCESS_VIEW`, so a playlist shared with the wall displays shows its devices to its
  owner alone (with §5's wall-sharing question).

**Final suites (Nov 11, at the end of the build).** Recorded in full in impl-admin under P19's "Final suites": the framework,
app and acceptance runs are one for both apps. For Insights: every Insights regression spec passed in
`mail_capture_sends=true ./moq test-apps` (3,526 server and 35 client features, all passed); the Insights acceptance specs
and the review walk pass in `./moq accept mr-boss` after the fixes above (InsightsCatalogUsable's full-run failure was the
search feed's stale item document, fixed in the spec, mr-boss f49c227b; the feed itself is the framework's, recorded
above). The framework's report specs passed; its server feature time is 16.8 s of 12 s, of which this build's specs
(ReportDrill, ReportAnnotations, ReportAudience, BusinessAlerts and the Admin specs) are 4.4 s: no budget raised, the user's call.

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
| Nov 7, 2026 | Owner Home summaries serve as count services where they compute the card with its list's query (F29); only Accounting's list finds take Insights' organization, the others keep the owner's scope (active organization, selected plant or facility, the user's stores), which the card says | P5, F66, F69 |
| Nov 7, 2026 | Monitor's Business operations source is `RegistryServices.get#OperationFailures`, running the shipped dashboard's own rollbacks query as the viewer, so Monitor's grants decide | P5, F19 |
| Nov 7, 2026 | The suite dashboard `insights-suite` places four shipped library panels by reference; its organization scope is two hidden variables (`organizationPartyId`, `vendorPartyId`) that Home sets; Home's arrangement is `store#HomeLayout` in `InsightsHome`, at most six panels | P5, F67, F71 |
| Nov 7, 2026 | SaveAs copies a definition through `save#Definition` as the author (one save with the chosen group) rather than `copy#Definition` (which keeps the source's group, F42); a saved find has no SaveAs in Insights | P4; design §6 SavedReports changed |
| Nov 10, 2026 | Flow-map authorization stays as P9 built it: the flow editor's grant is FlowMapServices' six writing operations, the engine knows no organization or kind on a definition, and an Insights author can still create a `flowmap` definition in the definition editor with any organization and share group. The flow editor will likely be refactored and generalized, and its authorization is revisited then | The user's call (Nov 10), F118, F121 (P9 and its review R1) |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the plan's open question as written (Q1, the recipient cap) was answered on Nov 7 and is in §4 |
| Should a wall display read only the playlists and dashboards of its own organizations? The wall displays are one group (`BOSS_INSIGHTS_DISPLAY`): a registrar of organization B may register organization A's wall-shared playlist by its id, and A's author's later edits (titles, text panels, which dashboards) then show on B's wall with B's numbers; and an author may put another organization's wall-shared dashboard into their own playlist | the user (P11 review; recorded in P12, not changed) | Options: refuse on a device a playlist or dashboard whose owner shares no organization with the display account; or one display group per organization. No author pushes onto another organization's wall by sharing alone (a wall plays the playlist its registration fixed) |
| Should an organization's flow map be editable by every flow editor of that organization, or taken over from its owner? Today a map is its copier's: the engine saves only for the owner, another editor copies it, and there is no ownership transfer | a later review of flow maps (with the editor's refactoring, §4) | F117 (P9); left open by the user on Nov 10 for future review |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F25 were found on Nov 7, 2026, while writing this plan, F26–F31 in P0's remaining checks, F32–F38 in P1, F39–F47 in P2, the provisional F48 to F57 in P3, F59 to F65 in P4, F66 to F71 in P5 and F72, F73 in its review the same day. F74 is under P5's acceptance note (impl-admin P7); P6's F75 to F87 (Nov 10, 2026) are in its Built and Review notes, as are P7's F88 to F101, P8's F102 to F114, P9's F115 to F129 and P10's F130 to F142; F143 to F148 (Nov 11) are in P3's Follow-up note (dataset aliases, impl-admin F277), and P11's F149 to F155 in its Built and Review notes, and P12's F156 to F160 in its.

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
| F66 | P5: the owners' Home summaries that compute the F29 cards also compute the whole landing: Products' `get#CatalogSummary` loads every product five times, Warehouse's, Manufacturing's and Projects' `get#Home` every queue or KPI, Commerce's `get#ChannelHealth` per-store message rows; the board for an all-app administrator took 0.8 s on the demo data | Kept (one call per summary per board, each in its own transaction); each owner's light count service per card, the same query as its list, is the owner's fix, and the registration then names it |
| F67 | P5: there is no admitted invoice dataset (`Accounting.InvoicedRevenue` is a service metric over `get#SalesInvoiceSummary`), so the suite dashboard cannot show invoiced revenue by currency as a panel | The suite shows order value by currency (`Sales.OrderValue`) and orders; a Mantle invoice dataset admitted under §5, or a service-source panel, is needed for invoiced revenue |
| F68 | P5: the "usable when" names open purchase approvals, receipts to put away and cases past due, which do not match a worklist's query (F29: Purchasing's Approvals waiting counts unread notifications; Warehouse's Putaway was not checked by P0; Customer Service's Overdue sums per-queue counts with no list of that filter) | Not registered; InsightsHomeUsable uses Warehouse's Receiving; each owner's one query for card and list registers them |
| F69 | P5: only Accounting's list finds take an organization; the other owners' counts keep their own scope (active organization, selected plant or facility, the user's stores), and a Warehouse or Manufacturing user with no selected facility or plant gets no count | The card says the scope it keeps; Insights' organization narrows Accounting's cards and the panels. Review: each owner counts only the viewer's own scope; without a selection Warehouse answers no count (left out), Manufacturing counts every plant of the user's organizations, Products adds the shared catalog, Commerce, Purchasing and the journals answer 0 for a user with no store or organization, and Payables refuses with no organization (left out, R2); the cards' route carries the plant or facility counted (R1) |
| F70 | P5: `run#Query` answers a dataset the viewer may not read as an error notice with no frames, not as an error, so a caller summing frames reads a zero | `get#OperationFailures` reads the notices (refused or failed, never zero); a framework note: an unauthorized dataset could refuse the call |
| F71 | P5: a dashboard variable names one field, and the suite's datasets name the organization differently (`vendorPartyId` for the sales orders), while Insights' Dashboard fixes only `organizationPartyId` | The suite has two hidden variables, which Home sets together; done in review (R4): Insights' Dashboard fixes `vendorPartyId` too where it is over Mantle's sales datasets |
| F72 | P5 review: Manufacturing's own Home cards (Open, In progress, Late) count the selected plant but open WorkOrders without it, so their list is wider than their count | Manufacturing's fix (its links to carry `facilityId`); Insights' cards carry it (R1) |
| F73 | P5 review: the refusal pattern shared with the catalog (`not available`, `is required`) also matches genuine failures such as a resource "is not available" or a service's "X is required", which then leave a card out instead of naming a failure | Kept (a quiet omission, never a zero or another's count); the owners' coded refusals (`CODE: message`) would allow a strict match once Products' and Accounting's uncoded "... is required" are coded |
| F74 | Acceptance after gate 1: Report builder › Explore for insights.admin, who reads no business dataset (design §1.1), fell to the framework Explore's default `otel_logs` and showed its refusal ("not authorized for AT_SERVICE org.moqui.report.dataset.otel_logs") as the page's error, so InsightsFoundationWalk found the administrator refused the Report builder in their own menu | Insights' Explore (screen/Insights/ReportBuilder/Explore.xml) says "No dataset is admitted for you to read" when the viewer reads no dataset and none is chosen; the regression InsightsAccess checks it. Done (adm/accept) |

## 7. Later

Designed, not in this build:

- **Design §12:** CashForecast and `mantle.ledger.CashForecastServices` (INS-12); the funnel, after Marketing's visit
  capture; multi-touch attribution over Marketing's metric; recipient execution of reports and alerts (design §7.2,
  §8.1 later); generic pivot and graph on any list and "Add to my dashboard" from any list; analysis notebooks; query
  result caching; SQL, script or warehouse sources; public dashboard links and external delivery; advanced forecasting
  and cross-dataset joins; richer per-breakpoint arrangement.
- **What waits on People:** the Employee360 record mount and its crosscut row, PeopleReportServices, People's metrics,
  attention providers and confidential-dataset classes.
  - Picked up by [impl-people.md](impl-people.md) (Nov 11, 2026): all in its P29, except the Employee360 record mount
    and its crosscut row, P2.
  - Built by impl-people P29 (Nov 12, 2026): Mantle's `PeopleReportServices` (get#Options, People's catalogue; run#Report), the
    eight catalog entries opening People's Reports with the report chosen (a route's fixed parameters, `Registry.js reportLink`),
    the measures `People.Headcount` and `People.Turnover`, three attention providers (`People.NoManager`, `.Vacancies`,
    `.Decisions`), three admitted `InsDcPeople` datasets (employments, the leave ledger, qualifications) with their readiness and
    refresh rows, read only with People's Insights bundle (`BOSS_PEOPLE_INSIGHTS`), a dashboard, the qualifications expiring alert
    template, and the flow target `People.Employees`, which the internal flow map's People step opens (template version 3);
    InsightsHome's provider list gained the three keys.
- **What waits on Marketing:** visits and attribution metrics, CampaignPerformance, DeliveryAnalysis, AudienceGrowth and
  Attribution entries, the campaign-sent annotation, the funnel.
  - Picked up by [impl-marketing.md](impl-marketing.md) (Nov 11, 2026), its P20: the metrics `Marketing.Visits` and
    `Marketing.AttributedOrders`, the four catalog entries, the annotation, and Marketing's datasets and alert
    templates. The funnel stays Insights' (above), over these.
- **What waits on Sales:** SalesSummary and Sales' own catalog entries, pipeline and forecast measures, Sales' attention
  providers, and SalesAnalysis moving to Sales' route with Accounting mounting it (§4).
  - Picked up by [impl-sales.md](impl-sales.md) (Nov 11, 2026): the pipeline dataset and the funnel panel, its P6;
    SalesAnalysis moving to Sales' route with Accounting mounting it, Sales' catalog entries, metrics, flow targets,
    alert templates and digest, P19.
- **What waits on Maintenance:** WorkStatus, PreventiveCompliance and cost entries and their metrics; Maintenance's
  context on EquipmentDetail.
  - Picked up by [impl-maintenance.md](impl-maintenance.md) (Nov 11, 2026): the entries, metrics, datasets
    (`report/boss-maintenance-*.json`) and the internal flow map's flow target, its P17; EquipmentDetail's context,
    P2.
  - Built by impl-maintenance P17 (Nov 12, 2026): the entries `Maintenance.WorkStatus`, `Maintenance.PreventiveCompliance`
    (through Maintenance's `get#ReportCatalogue`), the measures `Maintenance.Backlog`, `.OverduePm` and `.OnTimePm`, three
    attention providers, three admitted operations datasets with their readiness and refresh rows, a dashboard, three alert
    templates and the flow target `Maintenance.WorkOrders`, which the internal flow map's Maintenance step opens (template
    version 2); InsightsHome's provider list gained the three keys; the `Maintenance.Cost` entry (P11's report) is the cost
    reader's alone (MAINTENANCE_COST_VIEW).
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

## 9. Screens moved to the framework (Nov 11, 2026)

After both apps were built, the screens with no business model in them moved from Insights into the framework's
Dashboards app (mr-moqui `runtime/components/base/tools/screen/Dashboards/`), and Insights shows them under its root. The
plan, the record of each phase with its findings, and the tables of where each deleted service's work went are mr-moqui
[plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md) (Track I, I0 to I4; A6 for the registries); how a
screen is shown under another root is in mr-moqui
[docs/tools/Monitoring.md](../../../../../docs/tools/Monitoring.md#mounting-the-report-screens) and the
[tools README](../../../../../runtime/components/base/tools/README.md). [design-insights.md](design-insights.md) §4.2 has
the screens as they are now. The phase entries of §3 are left as they were written; this section is for a reader who
follows one and looks for what it names.

| Phase | What moved |
| --- | --- |
| I0 Contract | The root sets `reportPolicy` beside `reportLinks` (`get#Context` answers both). Panels, Explore and Split are the framework's screens, mounted by location. |
| I1 Datasets | Datasets, DatasetDetail, DatasetFields and DatasetView are thin wrappers over the framework's screens, taking in eight transitions; the screens' six services leave `DatasetServices`. |
| I2 Delivery | Schedules, ScheduledReportDetail and ReportDelivery are the framework's, mounted by location; the Scheduled reports area adds the recipient cap to the policy; eleven services leave `DeliveryServices`. |
| I3 Alerts | Rules and AlertDetail are thin wrappers over the framework's one alert list and one editor (Alerts, AlertRule), taking in ten transitions; the Alerts area adds the recipient cap; Insights' alert services are deleted. |
| I4 Share, playlists, the wall display, drill and analysis | Dashboard takes in the framework's `share`; WallDisplay is a thin wrapper; Playlists, Drill and Analysis are Insights' own screens around the framework's sections; `DashboardServices` is deleted. |
| A6 Registries | The readiness, refresh and settings registries Insights registers in are the framework's. |

| Named in the phases | Now |
| --- | --- |
| P2: `screen/Insights/Panels.xml`, `ReportBuilder/Explore.xml` and `ReportBuilder/Split.xml`, wrappers of the framework's screens | Deleted. The items of `Insights.xml` and `ReportBuilder.xml` name the framework's files; the sentence for a viewer who reads no dataset and the default range are the framework screens' own, under the root's policy |
| P2: `reportLinks` set by the root | Still the root's, with `reportPolicy` beside it (the features, the range, the dataset prefix and scope words, the recipients' permission, the email template, the alert audience, the wall displays' share group, the calendar); the keys `playlists`, `wallDisplay`, `alerts`, `alertShared`, `drill` and `analysis` are in the contract. The framework's `tools/template/ReportMount.js` is the one reader of both maps |
| P2, P11, P12: `DashboardServices.xml` (`share#Dashboard`, `get#ShareGroups`), `Insights.js` `shareDashboard`, Dashboard's own share dialog | Deleted. The framework Dashboard's `share` and Playlists' `sharePlaylist` (`tools/template/ReportShare.js`), offered by `reportPolicy.features.share`; the groups by name from `ReportServices.find#ShareGroups` (a row of `BOSS_INS_REPORT_AUTHOR`). `ContextServices.get#ShareGroups` answers the caller's own groups for Insights' own forms (a saved report's copy, an analysis, a flow map, a digest), without the wall displays |
| P2, P11: the share group rule in `share#Dashboard` (the sharer's own groups, or the wall displays) | The engine's, at every `save#Definition`: a group the saver belongs to by their own membership (never `ALL_USERS`), or one whose share artifact `org.moqui.report.share.<userGroupId>` their own grant holds; `BOSS_INS_SHARE_DISPLAY` gives the author the wall displays'. `SHARE_GROUP_UNAVAILABLE` is the engine's; the other reason codes of `share#Dashboard` are gone |
| P3: `DatasetServices` and `Datasets.js` `find#Datasets`, `get#Dataset`, `get#DatasetChoices`, `create#Dataset`, `get#DatasetView`, `export#Dataset` | Deleted. The framework's `tools/template/ReportDatasets.js` over `find#BusinessDatasets`, `get#BusinessDataset`, `get#BusinessDatasetOptions`, `create#BusinessDataset`, `query#Documents` and `audit#Export`; the export is DatasetView's `exportDocuments` transition. `DatasetServices` keeps `check#DatasetReadiness` and `refresh#DatasetIndex` |
| P3: the `insights-` prefix written in `Datasets.js`; New dataset by `INSIGHTS_DATASET_EDIT` | The prefix is `reportPolicy.datasetIdPrefix`, written once in `Insights.js`, and gives no right: `create#BusinessDataset` asks the update artifact of the dataset named. New dataset is offered by the engine's answer (the dataset-save artifact by the caller's own grant) |
| P3, P10: the `ReadinessProvider`, `RefreshOperation` and `SettingsEntry` rows of Admin's registries; `ironstone.admin.RegistryServices.get#Readiness`, `request#Refresh` and `find#Settings`; `BOSS_INS_READINESS`, `BOSS_INS_READINESS_READ` | The rows are the framework's `moqui.server` entities, a fix place and a destination named as route keys (`insightsDataset`, `insightsSettings`) that Admin's mount resolves. The services are `org.moqui.admin.ReadinessServices`, any signed-in user's by a grant that is not inheritable, so the two artifact groups are deleted, a registered service is authorized for its caller as a direct call is, and `refresh#DatasetIndex` asks its registration's permission itself. A refresh takes `refreshKey`, `scopeParameters`, `reason` and `operationKey` |
| P6: `Drill.js`, `Analysis.js` and the Drill and Analysis screens | Insights' own screens around the framework's sections. `Drill.js` keeps the reader check, the scope, the default range, the cost filter, the meaning and the record screens over `tools/template/ReportDrill.js`; `Analysis.js` keeps the author check, the admitted datasets, the organization's calendar, the narrowing for Assist, its reason codes and `store#Analysis` over `ReportAnalysis.js`. Insights' own `saveAnalysis` stays (`BOSS_INS_ANALYSIS` names it) |
| P7: `screen/Insights/ScheduledReports/Schedules.xml`, `ScheduledReportDetail.xml`, `ReportDelivery.xml` | Deleted. The area's items name the framework's files, and its `always-actions` add the recipient cap (`ContextServices.get#DeliveryPolicy`, then the framework's `policyWith`) |
| P7, P12: `DeliveryServices` and `Delivery.js` `find#Schedules`, `get#Schedule`, `store#Schedule`, `pause#Schedules`, `send#Schedule`, `check#Audience`, `get#Delivery`, `export#DeliveryAudit`, `retry#Recipients`, `reconcile#Recipient`, `get#OwnReport`, and (with I3) `find#RecipientChoices` | Deleted. The framework's `tools/template/ReportDelivery.js` over the engine's `list#Schedules`, `store#Schedule`, `pause#Schedule`, `send#Report`, `check#ReportAudience`, `find#ReportOccurrences`, `get#ReportOccurrence`, `retry#ReportRecipients`, `reconcile#ReportRecipient`, `get#RecipientReport` and the three added for the screens, `find#ReportRecipients`, `find#ScreenSchedules` and `store#ScreenSchedule` (rows of `BOSS_INS_REPORT_OWN`). `DeliveryServices` keeps `preview#Report`, `get#Digest`, `store#Digest`, `store#DefaultDigest` and `get#DigestPreview` |
| P7: `template/InsightsDeliveryTransitions.xml` (the recipient choices, the preview file, the own report file) | Keeps `previewFile`, for ManagementDigest |
| P7, P8: the `INSIGHTS_SCHEDULE`, `INSIGHTS_DISTRIBUTE` and `INSIGHTS_AUTHOR` checks of the delivery and alert services; "an Insights reader" and "a group the distributor belongs to" as Insights' rules for recipients | What a viewer is offered is their own grant of each engine operation, and setting an alert is `reportPolicy.features.alert`, which every transition that sets a rule holds first. The recipients are accepted by `find#ReportRecipients` under `reportPolicy.recipientPermissionId` (`INSIGHTS_VIEW`), the caller's own groups always |
| P7, P8: the email template, the alert topic, template and link, and the cap, sent by Insights' services with every save | Written once, in `Insights.js` `reportPolicy`, and put on every save by the framework's transitions; the cap is the area's addition. A posted value is not read |
| P7, P8: a write answering `applied` false with a `reasonCode` and `reason` | A refusal is the transition's error, the engine's sentence. The reason codes of the deleted services are gone |
| P8: `AlertServices.xml` and `Alerts.js` (`find#Alerts`, `get#Alert`, `store#Alert`, `copy#Alert`, `pause#Alerts`, `test#Alert`, `delete#Alert`) | Deleted. The framework's `tools/template/ReportAlerts.js` over `list#Definitions`, `save#Definition`, `get#AlertState` (which answers the owner's name), `find#AlertDeliveries`, `check#ReportAudience` and `run#Query` |
| P8: "Tools' Alerts, AlertRule and AlertShared are not mounted" | Rules and AlertDetail are wrappers over the framework's Alerts and AlertRule, which under Insights' policy show business rules only; AlertShared is not mounted, and the contact point, silence, mute timing, shared item and evaluation transitions are not taken in. `reportLinks.alertRule` is where a rule opens for any reader |
| P11: WallDisplay's own page and `data` transition | The framework's `WallDisplay.xml` and `tools/template/ReportPlaylists.js`, included at Insights' own location with `data`, which `BOSS_DEV_INS_WALL` and `BOSS_INS_WALL_DISPLAY` still name; the range is the root's policy's, never the request's |
| P11: Playlists' list, its share with the wall displays and its devices | Insights' own screen around the framework's Playlists, with Playlist included when one is chosen: the list, New playlist and the share are the framework's; the wall displays' share links, the devices and Register as display stay |
| P12: the legacy mapping's reading of an Insights list (`migrate#LegacySavedFinds`) | It reads the framework screen a wrapper includes too; the entry for the copied scheduled list is dropped, so such a saved find shows as not valid |
| P12: the sweeps' screen lists (InsightsTui, InsightsServerStatic) | They take the screens mounted by location from `InsightsSpecLib.mountedScreens` |
