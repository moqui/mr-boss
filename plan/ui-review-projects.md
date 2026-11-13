# IronStone BOSS — UI review: Projects

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Projects through the work of project managers, delivery teams, developers, consultants and their
clients: create a project, plan and deliver work, handle requests, review code, record and approve time, staff the
work, bill it and communicate the result. Aim for a comfortable daily workspace with understandable planning views,
clear next actions and trustworthy status, hours and money. Substantial layout and navigation refinements are allowed
where they improve an implemented workflow.

This is the next `ui-review-*.md` record after [drawers, Commons and Comms](ui-review-drawers-commons.md), following
the [document convention](design-doc-guide.md#ui-review-and-refinement-phase). Keep the inventory, activity coverage,
findings, decisions and bounded execution notes here throughout the review. Research records references, design
specifies behavior, implementation records construction, and this file records review and refinement.

**Execution authorized, 2026-11-09.** The user requested the complete review with three delegated workers,
independent review of corrections, and a local commit after each completed batch; the user will push at the end.
Run focused checks during the batches and defer `test-apps` and any applicable `test-framework` gate until the end
of the entire review. The eleven existing Projects acceptance specs in §5 are explicitly authorized. Live coverage
starts **pending** and changes only with observed evidence; earlier implementation and Commons results do not
establish this pass's coverage. The planning-only records below remain historical.

### Inputs and reference patterns

- [Projects design](design-projects.md), [implementation](impl-projects.md) and [research](research-projects.md):
  intended workflows, delivered phases, findings and historical deferrals.
- [Prior UI review](ui-review-drawers-commons.md), [framework UI review guide](../../../../../docs/dev/UI-Review.md)
  and [framework review](../../../../../plans/archive/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md) and [Commons design](design-drawers-commons.md): archetypes, shared records,
  calendar, knowledge, Chatter, approvals, files and shell contracts.
- Current `screen/Projects.xml`, `screen/Projects/`, mounted `screen/Shared/` and `screen/Commons/` screens,
  `screen/RequestIntake.xml` and its `.qvue` / `.tui.json` templates, `MoquiConf.xml`, `data/BossSetupData.xml`,
  `data/BossUsersDemoData.xml` (group grants), `data/BossProjectsDemoData*.xml` and `service/ironstone/projects/`;
  the demo accounts themselves in mr-mantle `data/ZbaOrganizationDemoData.xml` and webroot
  `data/WebrootSecurityDemoData.xml`. Current mounts and capabilities take precedence over historical tables when
  deciding what can be exercised.
- [Git hosting](../../../../../docs/interfaces/Git-Hosting.md), [revision management](../../../../../docs/data/Revision-Management.md)
  and the existing Projects specs: local code fixtures, resource storage, rule boundaries and available checks.

Use the existing research as a comparison lens: OpenProject for planning and capacity, Redmine for compact queries
and issue-to-release continuity, Odoo and ERPNext for time-to-invoice handoffs. These are patterns already documented
in the research, not new claims about current third-party products. This phase does not repeat the reference survey
or import their feature inventories.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Projects navigation, context, dialogs, custom views and settings | BOSS `screen/Projects/`, `service/ironstone/projects/` and the Projects shell providers; inspect both global lists and project-fixed mounts |
| Projects, work hierarchy, sprints, dependencies, requests, time, capacity, rates and billing rules | Mantle services and entities; corrections to business rules and their tests stay in Mantle, independent of BOSS |
| Work item and request detail | BOSS `Shared/WorkItemDetail.xml` and `Shared/RequestDetail.xml`; review Projects' full context, including peek and project-fixed entry, without copying the screens |
| Billing detail | BOSS `Shared/InvoiceDetail.xml` and `Shared/OrderDetail.xml`, mounted under Projects/Billing; inspect the project handoff, scoped client view and output, not a complete Accounting/Sales review |
| Docs, calendar, Chatter and files | Reused BOSS Commons/Shared screens and widgets, backed by Mantle and framework services; exercise the Projects mount and its record identity |
| Git hosting, diff resources, tokens and SSH keys | Framework Git/user services; Mantle work/code associations and review policy; BOSS presents the code workflow |
| Shell, list/board/tree widgets, charts, wizard, input and TUI rendering | Framework webroot/client/renderers; fix shared causes there and retest with Projects content |
| Restricted client and public request intake | Current BOSS client states and `/r/<token>`; the PASS Client migration in impl-projects §9 is planned, not part of this review |

Retest an affected shared component through a representative second consumer. WorkItemDetail is also used by
Commons, Customer Service and Manufacturing; RequestDetail by Commons and several operational apps; Chatter and
RecordFiles by all BOSS roots. Knowledge and Calendar have their Commons consumers. Projects' `Timeline.qvue` is
also used by Manufacturing's `Planning/ProductionSchedule.xml` in resource mode: preserve its preview/apply and
override behavior when changing the common timeline. This is a targeted compatibility check, not another app review.

Preserve routes, record keys, saved finds/columns, user preferences, entity/service contracts and authorization.
Record unavoidable compatibility changes and their handling before implementing them. Keep restricted data out of
server responses, including cost/pay, internal notes, hidden work, files, code and picker/search results. A hidden
button alone does not establish access control.

Do not build absent features to complete a journey. Full Commons/Comms, People, Sales, Accounting, Manufacturing,
Admin, PASS, desktop-shell and Git-protocol reviews are outside scope. Use those areas only for the existing handoff
or shared-fix retest. Real customer mail, production repositories and financial records are not review fixtures.

## 2. Review method and refinement criteria

### Environment and fixtures

Follow the [review guide](../../../../../docs/dev/UI-Review.md) and repository building/testing skills. Use an isolated
runtime and fresh disposable database. The guide's framework-only bootstrap leaves `component/` empty; Projects
also needs `mr-mantle` and `mr-boss` linked individually. Copy mutable configuration and keep database, uploads,
wiki resources, Git storage and scratch repositories separate from working data. A different HTTP port alone is not
isolation. PASS is not needed for the current BOSS client and request-token routes.

One coordinator owns runtime lifecycle. Record source/binary revisions, loaded components, actual runtime/database
locations, hostname, free listener ports, fixture setup and evidence directory in the first batch. Use independent
browser profiles or hostnames for identities; cookies are not isolated by port. If retaining the fixture runtime
across restarts, follow the guide's whole-runtime relocation procedure rather than serving a stale runner-owned
scratch path. Stop listeners and restore temporary preferences, keys and tokens at the end.

Reuse a suitable existing binary for application XML/QVue/script changes; rebuild when Rust or embedded renderer
modules change. Check loaded browser assets before diagnosing stale-template behavior. The code demo loader logs
and continues if Git support is unavailable: successful demo loading is not proof that `iron` or `acme-portal` exists.
Check Git capability and fixture content before the Code wave, or earlier if using Git-backed Docs. Use disposable
local repositories/remotes, controlled CI-status data and local captured mail; no external provider or webhook
delivery is inferred from a success toast.

There is no `ProjectsClientFixtures` spec or Projects browser golden path at planning time. Start from suitable demo
data; identify any missing roles before adding a small fixture. Do not use `CommonsClientFixtures` as an incidental
bootstrap: it lives in acceptance and is not authorized by this planning task. Record the chosen setup command and
suite when execution is planned; a new fixture or automated walk must name its suite before being written.

| Fixture role | Existing starting point and purpose |
| --- | --- |
| Delivery manager | `john.doe` / `EX_JOHN_DOE`, `BOSS_PROJECT_MANAGER`: create/plan projects, approve time and allocations, manage billing. This user has other grants; do not use it to prove a narrowly scoped permission |
| Two team members | `joe.developer` / `ORG_ZIZI_JD`, `bob.developer` / `ORG_ZIZI_BD`, `BOSS_PROJECT_TEAM`: assignment, code review, time and second-user observations |
| Client manager and other client | `sheldon.acme` / `ORG_ACME_SA` on ACME, `gob.bluth` / `ORG_BLUTH_GOB` on BLUTH; `BOSS_PROJECT_CLIENT` without `BOSS_USERS`: positive shared access and cross-client refusal |
| Limited internal roles | Prepare only missing fixtures: no-project staff, other-organization staff, narrow approver and project administrator (`BOSS_PROJECTS_ADMIN`); use ADMIN only for setup or an explicitly administrative action |
| Git administrator | Separate `ADMIN` fixture for PR-13's mirror configuration/fetch, storage collect/check and repository export/import; use the developer/repository lead for ordinary operations and pair administrative success with non-admin refusal. `BOSS_PROJECTS_ADMIN` alone does not satisfy these checks |
| Payroll-sensitive role | Narrow `PAYROLL_VIEW` / `PAYROLL_EDIT` fixture if worker pay is reviewed; `TIME_ENTRY_RATE` alone does not confer employee pay visibility. Pair the ordinary manager's restricted presentation with an authorized result |
| Anonymous requester | Token-only session for `/r/<token>`, separate from every authenticated session; retain no live token in notes |

`BossUsersDemoData.xml` grants the Projects groups only. The accounts come from other components' demo data:
`john.doe` from webroot `WebrootSecurityDemoData.xml`, the developers and client contacts from mr-mantle
`ZbaOrganizationDemoData.xml`. Check both are loaded before relying on a role.

Use IRON and its work hierarchy/sprints, ACME and child ACMEAPP, separate-client BLUTH, restricted HIRE, service
project SUPP and template TPLWEB as starting points, then create disposable records for changes. IRON-SP-1/2/3 give
completed/active/planned sprint states; ACME-6 supplies recurrence. Resource fixtures include part-time Ana, Bob's
leave and Joe's overbooking. Base planning dates are fixed in October 2026, while time/resource demo helpers derive
dates from the load week: record the actual windows and prepare relevant dates instead of assuming “today” matches.

Include empty and populated lists, long/localized titles, nested items, missing/deleted records, invalid values,
stale revisions, two user time zones and a DST boundary. Prepare an unshared record beside a shared one, approved and
returned timesheets, unbilled and already billed entries, and visible/hidden financial values. Use synthetic import
files with valid and invalid rows and unique external keys. Inspect actual downloaded bytes and printed pages.
Missing SMTP/PDF/Git/SSH/browser capabilities remain explicit blocked or unverified variants.

### Visual and interaction review

- Review Material `/qapps` in default light and dark, targeting **1920×1080**, with selected **1280px**, **390px**,
  keyboard-only and **actual 200% browser zoom** cases. Record measured DOM viewport and image dimensions. The prior
  pass's unsupported size/zoom requests are not evidence that these geometries are available or passed here.
- Inspect fresh embedded TUI launches and light/dark switches, including custom twins, focus, dialog actions and
  actual persisted mutations. An error-free JSON document is not a keyboard workflow. Standard `/apps` gets a brief
  functional check of main screens and exposed primary actions, not visual refinement. Where a rich view deliberately
  delegates to the browser, verify the notice and usable destination and record the limitation.
- Follow the archetype's hierarchy: name/key/status header, coherent sections, one primary action per form/dialog,
  useful empty state, named owners and units. Keep long descriptions and money summaries readable with drawers open.
- Measure actual composited contrast: ordinary text **4.5:1**, qualifying large text **3:1**, meaningful controls and
  states **3:1**. Inspect chips, chart canvas labels, dependency lines, selected cells, warnings and focus in both
  themes; do not use color alone for health, capacity, workflow or review status.
- Follow one find across List/Board/Calendar/Tree, Backlog/Timeline where supported, peek/detail and Back. Check sort
  direction, saved-find create/update/default/reset, selected columns, pagination and export independently. Project-
  fixed mounts must retain their project without confusing the selected child item with its parent.
- Exercise normal typing, blur/change, Enter/Escape, accessible control names, natural tab order and focus return.
  Test keyboard alternatives to drag/reorder/resize. Repeated-row actions must target their own record. Distinguish an
  automation input limitation from a reproducible application failure.
- Preserve unsaved wizard/grid/editor input and selected week/range through failed saves and navigation. A response
  acknowledges its submitted snapshot; late requests must not update a new view, project, week or merge request.
  Refused optimistic drags must restore the visible state and explain recovery.
- Compare displayed totals with their drill-throughs: work counts, sprint scope, capacity, timesheet hours, billable
  rows, invoice amounts and reports. Show dates in the user's zone, currencies/units explicitly, and raw values
  appropriately in exports. Distinguish no records, no matches, no access and failed loading.
- Check project context with the app drawer, Today/notifications and Assist open. Inspect provider actions and
  navigation; do not repeat the whole Assist or media review. Any unavailable model/provider branch stays unverified.
- Confirm status changes, publishing, deletion and financial actions with the selected record/count. Cancel must not
  write. Independently failing import/provider items should identify the item and allow unrelated work where the
  service contract permits; security checks and atomic financial operations stay strict.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Enter and establish a project | PR-01–04 | Role landing, contextual creation, lifecycle/team, Docs/files/Chatter under Projects |
| 2. Plan and deliver work | PR-05–10 | One find across views, detail, backlog/sprints, schedule, milestones/releases and work import |
| 3. Receive requests | PR-11–12 | Staff triage/conversion and anonymous intake with local mail |
| 4. Deliver code | PR-13–15 | Repository browsing, review/merge, personal access and repository controls |
| 5. Record and staff the work | PR-16–19 | Time/timers, approval/correction/import and resource allocation |
| 6. Account for delivery | PR-20–22 | Budgets/rates, unbilled-to-invoice, estimates and reports/outputs |
| 7. Configure and reconcile access | PR-23–25 and pending variants | Settings, restricted clients, cross-app/access, remaining modes and shared-fix retests |

IDs follow the waves. Establish permission pairs from the start, then complete the cross-route walk in Wave 7.
Use database-backed Docs for PR-04's initial pass; revisit its Git-backed variant with Code in Wave 4 unless its
prerequisites are established earlier. PR-09's tag/release continuation uses those Code fixtures; milestone billing
and estimates continue in Wave 6, and client decisions in Wave 7. PR-07's capacity interpretation is revisited with
PR-19, and PR-20's client estimate decision with PR-24. After initial execution, record PR-04, PR-07, PR-09 and PR-20
with status `exercised`, outcome `partial`, and their named outstanding continuations until those are observed. Do
not collapse an upstream activity's remaining work into a later activity's pass.

Each authorized batch follows observe → prioritize → refine → rerun affected activities → compare evidence → verify
→ update this record. Start with PR-01 and PR-02, establishing fixtures and measured browser/TUI baselines before
parallelizing dependent work. Delegated workers may own bounded source or evidence reviews; the coordinator owns
shared files, runtime lifecycle and integration. Confirm tool/identity availability before assigning live browsing.
The prior pass's coordinator-only browser limitation is a lesson to check, not an assumed limitation of this pass.

## 3. Screen and surface inventory

Routes are relative to `/qapps/` unless an absolute token route is shown. **B** means this component's `screen/`.
In the first table, append each listed name to the directory to obtain its route, and `.xml` to obtain its source
under B. Every name is a separate definition, not a claim that all names share one route. This covers **114 local XML
definitions**: `Projects.xml` and 113 below `Projects/`. Mounted sources outside that tree follow separately.

Ordinary definitions use XML widgets, often with inline qvt/tui status, chart or decorative fragments. Custom
templates, hidden helpers and output modes are listed below. Source existence does not prove effective reachability.
Container review includes navigation and default-child selection. The rows below map actual mode samples to §6;
this is not a claim that every definition or recovery variant passed interactively. Unstated manual modes remain
unverified. ProjectsServerStatic/ProjectsTui provide separate server render inspection, not browser interaction
evidence. §6 is the only activity-status ledger.

### Local routes

| Route prefix / source directory | XML definitions | Activities | Coverage / evidence |
| --- | --- | --- | --- |
| root | `Projects` | PR-01, 24, 25 | B/T navigation exercised; §6 PR-01/24/25 |
| `Projects/` | `Home` | PR-01, 16, 24 | B/T Home and role samples; PR-01/16/24 |
| `Projects/` | `QuickCreate`, `QuickProject` | PR-02, 06, 16 | B quick/wizard and T creation/time; PR-02/06/16 |
| `Projects/` | `Projects`, `WorkItems`, `Requests`, `Code`, `Time`, `Resources`, `Billing`, `Reports`, `Settings` | PR-01; respective sections below | B/T container/default-child samples across activities; §6 |
| `Projects/Projects/` | `List`, `NewProject`, `ProjectDetail` | PR-01–03, 24 | B/T list/detail/create; PR-01–03 |
| `Projects/Projects/NewProject/` | `Start`, `Team`, `Modules`, `Money`, `Review` | PR-02 | B all five wizard steps/draft; PR-02 |
| `Projects/Projects/ProjectDetail/` | `Overview`, `Team`, `Settings` | PR-03, 19, 23 | B/T lifecycle/team/settings; PR-03/19/23 |
| `Projects/Projects/ProjectDetail/` | `Plan` | PR-08 | T project plan and B wrapper; PR-08 |
| `Projects/Projects/ProjectDetail/Plan/` | `Calendar`, `CalendarTui` | PR-08 | T agenda/open record; Standard notice; B calendar mutation unverified |
| `Projects/Projects/ProjectDetail/` | `Code`, `Files` | PR-13–14, 24; PR-04 | T/B Code/files samples; PR-04/13/24 |
| `Projects/Projects/ProjectDetail/` | `Money`, `ClientHours` | PR-20–21; PR-24–25 | B/T Money; B client Hours and paired denials; PR-20/24/25 |
| `Projects/Projects/` | `Roadmap`, `MilestoneDetail`, `ReleaseDetail` | PR-09, 14, 21, 24 | T milestones/releases/client decisions; PR-09/21/24 |
| `Projects/Projects/` | `StatusReport`, `EstimatePrint` | PR-03, 20, 22, 24 | B actual status/estimate output; PR-03/20 |
| `Projects/WorkItems/` | `List` | PR-05 | B/T find/views/edits/export; PR-05 |
| `Projects/WorkItems/` | `Backlog`, `BacklogTui`, `SprintDetail`, `SprintReport` | PR-07, 22 | B drag/T sprint lifecycle; B printable report; PR-07 |
| `Projects/WorkItems/` | `Timeline`, `TimelineTui` | PR-08 | T scheduling and B mounted/shared checks; PR-08 |
| `Projects/WorkItems/` | `Import`, `ImportProgress` | PR-10 | B import/progress; T no-file/delegation; PR-10 |
| `Projects/WorkItems/Import/` | `Source`, `Mapping`, `Options`, `Preview`, `Result` | PR-10 | B all work-import steps; PR-10 |
| `Projects/Requests/` | `List` | PR-11–12, 24 | B/T triage/intake; PR-11/12/24 |
| `Projects/Code/` | `Repositories`, `RepositoryDetail`, `CommitDetail`, `Compare` | PR-13–14 | T repository paths and B/Standard content; PR-13/14 |
| `Projects/Code/RepositoryDetail/` | `Files`, `Commits`, `Branches`, `Tags`, `Activity`, `Settings` | PR-13, 15 | T all children/admin pairs; B file samples; PR-13/15 |
| `Projects/Code/` | `MergeRequests`, `MergeRequestDetail` | PR-14 | T/B review navigation and decisions; PR-14 |
| `Projects/Code/MergeRequestDetail/` | `Overview`, `Commits`, `Changes`, `ChangesTui` | PR-14 | B diff presentation/keyboard; T threads; PR-14 |
| `Projects/Code/` | `GitAccess` | PR-15 | T actual key/token flows and Git transport; PR-15 |
| `Projects/Time/` | `MyTime`, `MyTimeTui` | PR-16–17 | B grid/day and T timer/decisions; PR-16/17 |
| `Projects/Time/` | `Timesheets`, `TimesheetDetail`, `TeamTimesheet`, `TimesheetPrint` | PR-17–18, 22; TeamTimesheet is print output | T approval/detail; B actual Timesheet/TeamTimesheet output; PR-17/18 |
| `Projects/Time/` | `TimeEntries` | PR-16, 18 | B/T entries/filter/reset; PR-18 |
| `Projects/Time/TimeEntries/` | `EditEntry` | PR-16, 18 | T historical return/B entry samples; PR-16/18 |
| `Projects/Time/` | `Import`, `ImportProgress` | PR-18 | B time import/progress; PR-18 |
| `Projects/Time/Import/` | `Source`, `Preview`, `Result` | PR-18 | B source/preview/result; PR-18 |
| `Projects/Resources/` | `TeamPlanner`, `TeamPlannerTui`, `Allocations`, `PersonDetail` | PR-19 | T request/staff/person; B mounted planner checks; PR-19 |
| `Projects/Resources/Allocations/` | `EditAllocation`, `Staff` | PR-19 | T fitting staff/edit/move/restore; PR-19 |
| `Projects/Resources/PersonDetail/` | `Overview`, `Allocations`, `WorkItems`, `Time`, `Capacity` | PR-19; PR-18 time | T person tabs/current capacity; historical selector unavailable; PR-19 |
| `Projects/Billing/` | `Rates` | PR-20 | T rates/Which/payroll pair; PR-20 |
| `Projects/Billing/` | `Unbilled`, `Invoices`, `InvoicePrint` | PR-21, 24 | T/B invoice lifecycle/current print/PDF/client; PR-21/24 |
| `Projects/Billing/Unbilled/` | `CreateInvoice` | PR-21 | T actual selected manual sources; PR-21 |
| `Projects/Reports/` | `Index`, `Time`, `WorkItems`, `Sprints`, `Portfolio`, `Profitability`, `Utilization`, `Progress` | PR-22 | T all seven reports; actual CSV/XLSX/print samples; B chart variants unverified |
| `Projects/Settings/` | `Index`, `WorkItemTypes`, `Workflows`, `Labels`, `Templates` | PR-23; PR-02 template | T definitions/consumers, B row-dialog identity; PR-23 |
| `Projects/Settings/` | `Time`, `Billing`, `Code`, `Intake` | PR-23; PR-12, 15, 17, 20–21 | T/B bounded defaults/policy and restoration; PR-12/15/23 |

### Defaults, shared mounts and public routes

| Container route | Default child | Activities |
| --- | --- | --- |
| `Projects` | Home | PR-01, 24 |
| `Projects/Projects`, `Projects/WorkItems`, `Projects/Requests` | List | PR-01, 05, 11 |
| `Projects/Projects/NewProject` | Start | PR-02 |
| `Projects/Projects/ProjectDetail` | Overview | PR-03 |
| `Projects/Projects/ProjectDetail/Plan` | Timeline | PR-08 |
| `Projects/Code` | Repositories | PR-13 |
| `Projects/Code/RepositoryDetail` | Files | PR-13 |
| `Projects/Code/MergeRequestDetail` | Overview | PR-14 |
| `Projects/Time` | MyTime | PR-16 |
| `Projects/WorkItems/Import`, `Projects/Time/Import` | Source | PR-10, 18 |
| `Projects/Resources` | TeamPlanner | PR-19 |
| `Projects/Resources/PersonDetail` | Overview | PR-19 |
| `Projects/Billing` | Unbilled | PR-21 |
| `Projects/Reports`, `Projects/Settings` | Index | PR-22, 23 |

Record default-child selection on the container's row in the local-routes table; this table has no separate status.

In the next table **PD** abbreviates route `Projects/Projects/ProjectDetail`. These are real mounted routes, not
new copies to implement. Their consuming activity outcomes and exact evidence are in §6; inherited descendants
without an explicit observation remain unverified. For dynamic embedded content,
verify its actual resolved helper URL in the running app rather than inferring reachability from a filename.

| Route under the consuming app | Definition under B | Activities / context |
| --- | --- | --- |
| `Projects/Chatter`, `Projects/Chatter/ChatterTui` | `Shared/Chatter.xml`, `Shared/ChatterTui.xml` | PR-04, 06, 11, 24–25; hidden record panels |
| `Projects/RecordFiles`, `Projects/RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`, `Shared/RecordFilesTui.xml` | PR-04, 06, 11–12, 24–25; hidden record panels |
| `Projects/WorkItems/WorkItemDetail` | `Shared/WorkItemDetail.xml` | PR-05–06, 14, 16, 24; full and peek variants |
| `Projects/Requests/RequestDetail` | `Shared/RequestDetail.xml` | PR-11–12, 24 |
| `Projects/Billing/InvoiceDetail`, `Projects/Billing/OrderDetail` | `Shared/InvoiceDetail.xml`, `Shared/OrderDetail.xml` | PR-20–21, 24 |
| `PD/WorkItems` | `Projects/WorkItems/List.xml` | PR-05; project fixed |
| `PD/Backlog` | `Projects/WorkItems/Backlog.xml` | PR-07; project fixed |
| `PD/Plan/Timeline` | `Projects/WorkItems/Timeline.xml` | PR-08; project fixed |
| `PD/Roadmap` | `Projects/Projects/Roadmap.xml` | PR-09; project fixed |
| `PD/Requests` | `Projects/Requests/List.xml` | PR-11–12; project fixed and intake controls |
| `PD/Docs`, `PD/KnowledgeTui` | `Commons/Knowledge.xml`, `Commons/KnowledgeTui.xml` | PR-04, 09; project space and linked pages |
| `PD/Docs/Spaces`, `PD/Docs/SpaceDetail`, `PD/Docs/Review` | `Commons/Knowledge/Spaces.xml`, `Commons/Knowledge/SpaceDetail.xml`, `Commons/Knowledge/Review.xml` | PR-04; inherited children; inspect project return and actual access |
| `PD/Time`, `PD/Time/EditEntry` | `Projects/Time/TimeEntries.xml`, `Projects/Time/TimeEntries/EditEntry.xml` | PR-16, 18, 24–25; internal project-fixed time and inherited edit child; refused to clients |
| `PD/ClientHours` | `Projects/Projects/ProjectDetail/ClientHours.xml` | PR-24–25; `BossSetupData.xml` supplies the `BOSS_PROJECT_CLIENT`-only Hours tab through `SubscreensItem`; distinct from internal Time, subject to project hours sharing |
| `PD/Money/CreateInvoice` | `Projects/Billing/Unbilled/CreateInvoice.xml` | PR-21; selected project sources |
| `Projects/Resources/PersonDetail/EditAllocation` | `Projects/Resources/Allocations/EditAllocation.xml` | PR-19; person context |
| `Projects/Code/RepositoryDetail/MergeRequests` | `Projects/Code/MergeRequests.xml` | PR-14; repository fixed |
| `/r/<token>` | `RequestIntake.xml` | PR-12; public shell, token check and POST rate limit in MoquiConf |

### Custom modes, outputs and embedded surfaces

| Surface | Template / variant and supporting inspection | Activities | Coverage / evidence |
| --- | --- | --- | --- |
| Backlog, including project mount | `Projects/WorkItems/Backlog.qvue`; hidden `BacklogTui.xml` supports move and sprint decisions; inspect each mount's helper resolution | PR-07 | B drag/menu and T mutations; pr07-browser-drag-after.jpg |
| Timeline, including project Plan | `Projects/WorkItems/Timeline.qvue`; hidden `TimelineTui.xml` supports item moves and dependencies; plan/portfolio limitations separate | PR-08 | T dates/dependencies and mounted B async; B Manufacturing move; PR-08 |
| Project Calendar | `Commons/Calendar.qvue`; `Projects/Projects/ProjectDetail/Plan/CalendarTui.xml` read-only project-calendar twin | PR-08 | T agenda/open; Standard notice; B project-calendar mutation unverified |
| My time | `Projects/Time/MyTime.qvue`; `MyTimeTui.xml` supports entries, timer and decisions, not grid typing | PR-16–17 | B grid/day; T entries/timer/approval; PR-16/17 |
| Team planner | `Projects/Resources/TeamPlanner.qvue`; `TeamPlannerTui.xml` supports moves/decisions, with narrower request/staff controls | PR-19 | T request/staff/move; mounted B async; B drag unverified |
| Merge request Changes | `Projects/Code/MergeRequestDetail/Changes.qvue`; `ChangesTui.xml` supports diff reading, comments, replies and resolve/reopen; browser-specific diff presentation separate | PR-14 | B keyboard/unified/side-by-side; T threads; PR-14 |
| Merge request decisions | Parent `MergeRequestDetail.xml` supplies review/approve/request-changes, draft/ready, close/reopen and merge controls for browser and terminal inspection; template presence is not interaction evidence | PR-14 | T actual decisions/merge and separate state variants; PR-14 |
| Project Docs | `Commons/Knowledge.qvue` and hidden project `KnowledgeTui` mount; inspect save/history/review and browser delegation | PR-04, 09 | B database/Git save/history; T setup/read/release-publication; rich recovery variants unverified |
| Both import progress screens | `Commons/Contacts/ImportProgress.qvue` and `.tui.json`; operation context and result/retry links | PR-10, 18 | B actual work/time imports and repeat outcomes; PR-10/18 |
| Public request intake | `RequestIntake.qvue` is the submission form; `RequestIntake.tui.json` supplies a browser-delegation notice, not a terminal form | PR-12 | B submit/mail/token variants; T delegation only; PR-12 |
| Project and work lists | Projects List status board/portfolio link; WorkItems List board groupings, due-date calendar, tree, quick-add, peek, selection and bulk controls | PR-01, 05–06 | B/T view/find/bulk/hierarchy samples; PR-01/05/06 |
| Roadmap and Requests | Roadmap list/calendar; Requests list/status board and distinct staff/client create dialogs | PR-09, 11, 24 | T/B record and decision samples; PR-09/11/24 |
| Project creation and header | Wizard member/order/rate controls; Post update, Clone, Save as template; status confirmations | PR-02–03 | B full wizard; T clone/template/lifecycle; PR-02/03 |
| Project tabs and shared records | Description, team/client membership, allocation, repository setup/link, Docs/history/review, files and Chatter; work relations/recurrence/development/time; request triage/conversion/reply | PR-03–06, 11, 13–14, 19, 24 | B/T shared record samples with exact identity; PR-03–25 |
| Planning dialogs | Sprint create/edit/start/complete/carry-over; timeline move/dependency; milestone gate/share/deliverable/move unfinished; release notes/publish/tag | PR-07–09, 21 | T lifecycle/gates/releases, B drag/shared move; PR-07–09/21 |
| Time and staffing dialogs | Week/day/entry/timer; submit/return/reopen reasons; allocation request/detail/staff/decision, EditAllocation and Staff routes | PR-16–19 | B grid and T decision/staffing dialogs; PR-16–19 |
| Money and billing dialogs | Which rate/new/edit/end; budget/order/estimate approval; selected Unbilled/CreateInvoice; invoice line/status/send controls | PR-20–21, 24 | T budget/rates/invoice/client decisions, B outputs; PR-20/21/24 |
| Code dialogs | Repository create/mirror/link; branch/tag; rules/webhooks/deliveries; SSH keys/tokens; compare/work link; reviewers/review/merge/checkout and diff threads | PR-13–15 | T Git/admin/credentials/webhooks and B diff; PR-13–15 |
| Settings dialogs | Types/icons, workflow moves/statuses, labels/edit/merge, templates, time work types, intake addresses/categories | PR-23 | T definitions/consumers; B repeated rows/checkboxes; PR-23 |
| Reports and outputs | Chart/table/filter/drill-through; CSV/XLSX where offered; `StatusReport`, `EstimatePrint`, `SprintReport`, `TimesheetPrint`, `InvoicePrint` and report print views | PR-03, 07, 17, 20–22, 24 | T seven reports, B actual print/PDF, parsed CSV/XLSX; PR-03/07/17/20–22 |
| Shell in Projects | Quick-create workItem/time/project, Code palette, record search, go-to keys, timer/review/time/request Today rows, approval and notification return, Assist context | PR-01, 06, 14, 16–17, 19, 25 | B palette/Today/Assist/notification, T shell navigation; PR-01/25 |

There are five QVue files under `screen/Projects/`: Backlog, Timeline, MyTime, TeamPlanner and Changes, plus the separate
public intake component `screen/RequestIntake.qvue`. Calendar, Knowledge, import progress, Chatter and RecordFiles
reuse existing components. The rich wrappers differ in their plain modes: Timeline, MyTime and TeamPlanner list
`qvt,html` and show a browser notice. PR-UI-034 also makes Backlog and the project Calendar's already-authored
`html,qvt` notices reachable; actual Standard Timeline/Backlog/Calendar notices were inspected. Changes has neither
a notice nor qvt/html and remains unsupported in that plain mode. A notice is distinct from the mounted Material
experience and from supported terminal functionality.

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| Separate Portfolio/Program, Board, phase, Budgets and Expenses routes | Design §2 deliberately uses Projects list/Timeline portfolio, WorkItems board, milestones with a start/gate, Money/Profitability and Money's expense summary. Expense capture is People's. Review those surfaces, not invented routes |
| Project Docs, shared detail and progress routes | Current mounts reuse Commons Knowledge, Shared records and Commons import-progress templates; retain consuming-project context |
| Project quick-create in a single QuickCreate screen | Root providers now send workItem/time to QuickCreate and project to QuickProject; review both |
| Public RequestIntake | XML wrapper serves `RequestIntake.qvue`; `RequestIntake.tui.json` delegates to the browser, and plain html/qvt shows a JavaScript-browser notice |
| PASS Client portal and retirement of BOSS client mode | Planned impl-projects §9; current restricted BOSS client and `/r/<token>` remain review scope |
| Historical terminal/read-only and “Later” notes | Several were superseded by P11 or later code. Current twins support the operations listed above; record genuine limitations per activity, not blanket parity or blanket absence |
| Generic view-timeline, board WIP, timeline baselines, work-item custom fields, browser repository editing/repository-content search, forks and vendor time-import presets | Deferred capabilities in impl-projects; no implementation obligation from this review. Code palette repository/merge-request search is implemented and reviewed in PR-01 |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted records and a second identity where relevant. Services may prepare fixtures; they do not replace the
user's steps. A landing render, HTTP 200 or success message alone does not complete an activity.

**Modes:** browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief `/apps` functional/fallback check in §2. Targeted narrow/keyboard/zoom variants are named below. Inspect
print/export output where offered. Unsupported variants remain explicit rather than being treated as passes.

### PR-01 — Start and navigate a project workday

- **Actor/start:** manager and team member with assigned work, review/approval items and saved finds; empty-work fixture.
- **Objective/steps:** sign in → Projects Home → work/overdue/review/time/billing counters → filtered list → record →
  Back; use palette record keys and Code palette repository/merge-request search, Projects shortcuts, Today and
  notification links; open app drawer and Assist beside the selected record.
- **Expected:** each role gets useful permitted work; counts, filters, record identity and current context agree;
  returning preserves the find; one failed source does not hide unrelated work.
- **Recovery:** no matches, empty workday, deleted or inaccessible recent record, unavailable Code/Assist provider.
- **Screens/modes:** root/Home, shell providers and destination samples; browser/TUI/Standard, targeted keyboard/narrow.

### PR-02 — Create, clone and reuse a project

- **Actor/start:** manager, blank-project data and TPLWEB; a team member for refusal.
- **Objective/steps:** create one project directly through QuickProject; separately use More options → NewProject
  Start → Team → Modules → Money → Review → open the project. Repeat from a template; clone the result and save a
  disposable template; verify it through Settings/Templates and its resulting project. Inspect subproject creation.
- **Expected:** submitted choices persist, the result opens under the new identity, template work starts in its
  intended state and no stale source-project ID changes the wrong record; defaults and explicit overrides are clear.
- **Recovery:** duplicate key, missing name, invalid dates, Back after editing, cancel/reopen, failed step save and
  restricted creation. Start already creates an In Planning project; inspect the saved draft after leaving and
  resuming, distinguish it from unsaved input, and prevent a second project or another workflow's draft being reused.
- **Screens/modes:** QuickProject, NewProject and all five steps, ProjectDetail, Templates; browser/TUI/Standard,
  targeted phone wizard and keyboard focus/confirmation.

### PR-03 — Maintain project health, membership and lifecycle

- **Actor/start:** manager and member on a disposable project with work, plus an empty disposable project.
- **Objective/steps:** Overview → edit description/post health update → Team add/change/end member or client role →
  Settings visibility/modules → observe as the affected identity → hold/resume/close/reopen as allowed → print status
  report. Exercise empty-project deletion and nonempty-project refusal separately.
- **Expected:** header, counters, overview and report describe the saved state; published versus internal updates
  remain distinct; membership changes affect access; module settings and read-only ended states are understandable.
- **Recovery:** canceled status change, stale edit, invalid membership dates, revoked access and nonempty deletion.
- **Screens/modes:** ProjectDetail/Overview/Team/Settings, StatusReport; browser/TUI/Standard and printed output.

### PR-04 — Keep project knowledge, files and conversation together

- **Actor/start:** two permitted staff on a project with database or Git-backed Docs, plus a nonmember.
- **Objective/steps:** project Docs → set up/select space as permitted → create/edit/save/reopen page → history/review;
  inspect linked pages and Spaces/SpaceDetail/Review navigation without losing the project; Files upload/download;
  Chatter post/reply/mention/follow → recipient notification → same project. Verify saved content and downloaded bytes.
- **Expected:** every embedded action retains the project and resource identity, acknowledged content persists, and
  only permitted recipients/resources appear. A Git save is proven by its resource revision, not just an editor toast.
- **Recovery:** pending/failed save and navigation, unavailable space/repository, upload refusal, revoked membership,
  denied linked page and empty history. Preserve editor input and useful return paths.
- **Screens/modes:** ProjectDetail/Docs/KnowledgeTui/Files, inherited Knowledge children, Projects/Chatter/RecordFiles
  and their TUI helpers; browser and supported TUI, Standard exposed actions, targeted keyboard/narrow editor.

### PR-05 — Find and organize the same work across views

- **Actor/start:** team member and manager, IRON hierarchy and a project-fixed work list with enough rows to paginate.
- **Objective/steps:** WorkItems find → saved find/columns/sort → List/Board/Calendar/Tree → peek → full detail → Back;
  quick-add an item, then nest/move it, change grouping, bulk-edit selected work and move a subtree; repeat through ProjectDetail's
  WorkItems tab and compare the same records. Inspect export selection and columns.
- **Expected:** views describe one find, tree parentage and rollups are intelligible, selection/counts agree and Back
  retains context. Drag and keyboard/menu alternatives persist the same permitted operation.
- **Recovery:** no matches/reset, invalid workflow move, prohibited parent/cycle, hidden descendant, stale selection,
  canceled bulk action and refused optimistic drag.
- **Screens/modes:** WorkItems/List and its project mount, Shared WorkItemDetail peek; browser/TUI/Standard,
  targeted phone columns, keyboard tree/board and zoom.

### PR-06 — Complete and collaborate on a work item

- **Actor/start:** two team members, a disposable parent/child and recurrence patterned on ACME-6.
- **Objective/steps:** contextual QuickCreate → detail → edit type/owner/dates/estimate/labels → add sub-item and
  relation → assign/watch → description, Chatter and file → permitted workflow transitions → complete; inspect
  recurrence's resulting next item. Exercise clone, move-to-project and task/request conversion where offered.
- **Expected:** hierarchy, links, status, recurrence and notifications agree with stored work; project context survives
  quick creation and return; the Commons task consumer identifies the same record. Time and Development continue in
  PR-16 and PR-14 rather than being certified by opening their tabs.
- **Recovery:** invalid status skip, stale edits, cycle/self relation, unavailable assignee, wrong-project move,
  deletion with recorded time, cancel and nonmember refusal.
- **Screens/modes:** QuickCreate, Shared/WorkItemDetail (facts, sub-items, links, Development, time, files, Chatter);
  browser/TUI/Standard, targeted keyboard detail and narrow actions.

### PR-07 — Plan and finish a sprint

- **Actor/start:** manager and contributor with planned, active and completed sprints and unfinished work.
- **Objective/steps:** Backlog rank → select/move work → create/edit sprint → start → change scope → SprintDetail
  burndown and scope history → complete with explicit carry-over destination → SprintReport; compare project mount.
- **Expected:** ranking, sprint membership and remaining work persist, start/finish controls reflect current state,
  charts and tables explain scope changes; capacity is revisited with PR-19's availability data.
- **Recovery:** no project/empty backlog, incompatible active sprint, invalid dates, failed reorder, canceled completion,
  missing carry-over destination and permission loss.
- **Screens/modes:** Backlog/BacklogTui, SprintDetail/SprintReport and project Backlog; browser/TUI supported mutations,
  Standard fallback, targeted keyboard moves and narrow charts.

### PR-08 — Schedule dependencies and inspect the project calendar

- **Actor/start:** manager/member with dated nested work, lagged dependencies, milestones and calendar events.
- **Objective/steps:** Timeline filter/range/scale → move/resize item or subtree → add/edit/remove dependency and lag →
  inspect resulting dependent dates → project Plan toggle to Calendar → inspect/open an event/work item → return;
  compare project/plan/portfolio views and available keyboard alternatives.
- **Expected:** persisted dates and affected rows match the operation; dependency direction and warnings are legible;
  calendar identity, range and user zone agree. Read-only modes do not imply editable scheduling.
- **Recovery:** cycle/self/ancestor dependency, invalid range, unavailable record, refused/stale drag, DST/holiday
  boundary and navigation while loading a different range.
- **Screens/modes:** Timeline/TimelineTui, ProjectDetail/Plan/Timeline/Calendar/CalendarTui; browser and supported TUI,
  Standard fallback, targeted keyboard/zoom. Manufacturing resource-mode retest only if the shared timeline changes.

### PR-09 — Deliver milestones and publish a release

- **Actor/start:** manager, approver and release author with milestone/release work, unfinished items and Docs space.
- **Objective/steps:** Roadmap → create/edit milestone/release → add/remove work → move unfinished items → request and
  decide a milestone gate → record deliverables; release detail → generate/edit notes → publish to Docs → create/link
  tag → release. Repeat tag/commit outcomes with PR-13–14 and billing shares with PR-21; client decisions with PR-24.
- **Expected:** approval gates constrain completion, progress reflects linked work, release status differs from saved
  notes, and published wiki/repository revision and tag identify the intended content.
- **Recovery:** gate refusal/reason, premature completion, duplicate decision, missing Docs/repository, protected write,
  invalid share/deliverable state and canceled publication.
- **Screens/modes:** Roadmap list/calendar, MilestoneDetail, ReleaseDetail, Docs and print/estimate links;
  browser/TUI/Standard, targeted keyboard gate/dialog and chart readability.

### PR-10 — Import work and reconcile the result

- **Actor/start:** manager with disposable project and synthetic generic/Jira-style CSV including hierarchy and errors.
- **Objective/steps:** Import Source → Mapping → Options → Preview → confirm → progress/result → open imported work;
  retry/reimport using the offered existing-key policy and inspect parentage, labels and mapped values.
- **Expected:** mapping is understandable, preview explains affected rows, final counts match stored results and any
  refused row is identified. A repeat follows the chosen policy without accidental duplicate or overwritten work.
- **Recovery:** bad file/encoding, missing columns, unknown owner/status, invalid parent, one failed independent row,
  Back/cancel and navigation during progress; do not claim real vendor-export compatibility from synthetic data.
- **Screens/modes:** WorkItems/Import and all five steps, ImportProgress, resulting detail; browser/TUI/Standard
  supported import controls, targeted keyboard wizard. Unavailable fixture formats stay unverified.

### PR-11 — Triage a request into delivered work

- **Actor/start:** triager/manager, member and requester; submitted/accepted requests and a no-project triage request.
- **Objective/steps:** Requests list/board or project Requests → create/classify/assign → accept → create/link work
  or convert to a project → follow resulting work → resolve with an internal note → separately send an outward reply
  where offered → inspect requester-visible conversation;
  exercise return from detail to the original filtered list.
- **Expected:** request/work/project links are correct, conversion produces the intended record once, visible state
  and response describe the outcome, and internal conversation/files remain distinct from outward material.
- **Recovery:** missing project or required fields, rejected/deferred request, duplicate conversion, stale owner,
  invalid linked work, canceled resolve and inaccessible request.
- **Screens/modes:** Requests/List, project Requests, Shared/RequestDetail and linked detail; browser/TUI/Standard,
  targeted phone triage and keyboard dialogs.

### PR-12 — Receive public and local email intake

- **Actor/start:** manager/triager and anonymous requester, disposable intake token, allowed file and local mail fixture.
- **Objective/steps:** project intake and Settings/Intake → enable/configure → anonymous `/r/<token>` submit → inspect
  on-screen confirmation → staff triage; with an intake account and confirmation enabled, separately inspect the
  captured confirmation email, then compare the disabled-confirmation case. Deliver a local message through the
  configured intake rule and follow its request/thread and explicitly sent reply. Do not assume resolution
  automatically sends the anonymous requester a response. Rotate and disable the disposable token and revisit it.
- **Expected:** valid submission creates the intended request and permitted attachment once, public confirmation
  exposes no internal data, and email confirmation/routing/reply outcomes are evidenced independently of configuration
  success. A filled honeypot returns apparent success without creating a request; verify that no record was created.
- **Recovery:** malformed/unknown, rotated or disabled token; unavailable project (missing, template, completed,
  closed or cancelled); missing inputs, rejected file/type/size, rate limits and mail failure. Project
  `WstIntakeToken` has no timed expiry; expiring queue capabilities belong to another workflow. With CAPTCHA enabled
  and configured, check accepted/refused challenges and provider-load failure; leave unavailable provider cases
  explicitly blocked/unverified without making external access a prerequisite for the local review. Keep tokens,
  addresses and secrets out of retained evidence.
- **Screens/modes:** Settings/Intake, project Requests intake controls, RequestIntake XML/QVue, Shared/RequestDetail;
  public browser light/dark/narrow/keyboard, staff TUI/Standard controls; inspect the `RequestIntake.tui.json`
  browser-delegation notice separately, with no anonymous terminal submission flow.

### PR-13 — Browse and maintain a project repository

- **Actor/start:** developer and repository lead, verified local `iron`/`acme-portal` fixtures and disposable remote;
  separate Git administrator (`ADMIN`) for the administrative subcases.
- **Objective/steps:** project Code → Repositories → RepositoryDetail Files/revision/path → raw file/archive → Commits
  and CommitDetail → Branches/Tags → compare → Activity; create/link/unlink a disposable repository, branch and tag;
  inspect repository settings/storage and archive/unarchive. As the Git administrator, configure/fetch a disposable
  mirror and export/import a disposable repository through RepositoryDetail/Settings; verify non-admin refusal.
  Storage collect/check actions also require `ADMIN`. Repository deletion belongs to Tools Git and is outside this review.
- **Expected:** repository/project/revision context persists, downloaded content matches its revision, branch/tag and
  activity outcomes are real, and links back to work and release identify the same records.
- **Recovery:** absent Git fixture, nonexistent revision/path, unavailable remote, denied branch/tag operation,
  canceled archive/unarchive, denied administrative operation and revoked repository membership. Record unavailable
  capabilities explicitly.
- **Screens/modes:** project Code, all RepositoryDetail children, Repositories, CommitDetail, Compare;
  browser/TUI/Standard, targeted narrow file tree and keyboard revision controls.

### PR-14 — Review and merge a change into delivered work

- **Actor/start:** author and separate reviewer, disposable branches/commits and merge requests for browser and terminal
  mutations, required-approval rule and controlled CI state.
- **Objective/steps:** work item Development → create branch → local fixture commit/push → Compare → create merge
  request → add reviewer → Overview/Commits/Changes → line comment/reply/resolve → submit review → merge → inspect
  target revision, linked work status and notification; continue PR-09's release/tag path.
- **Expected:** diff, review and checks refer to the current head, unresolved/failed requirements explain refusal,
  only authorized decisions change state and actual merge/content is visible after success.
- **Recovery:** draft/close/reopen, changed-head invalidation, outdated thread, conflict, failed check, protected branch,
  stale diff load and canceled merge. A prepared fixture status is not proof of an external CI integration.
- **Screens/modes:** Development, Compare, MergeRequests (global and repository mount), MergeRequestDetail and all
  children, ChangesTui; browser and Standard exposed actions, targeted keyboard diff navigation and zoom. In the
  terminal, read the diff and comment/reply/resolve/reopen through ChangesTui; exercise the parent detail's review,
  approve/request-changes, draft/ready, close/reopen and merge controls with the appropriate identities and disposable
  records. Record actual outcomes separately from browser-specific side-by-side presentation; source availability
  alone proves no terminal interaction.

### PR-15 — Manage Git access and repository controls

- **Actor/start:** developer and repository lead with the required repository rights, project manager for
  Settings/Code, disposable credential and local repository/remote; keep PR-13's separate `ADMIN` fixture limited to
  its administrative subcases.
- **Objective/steps:** Commons Account link → Projects GitAccess → add/remove SSH key and create/revoke token → return;
  verify permitted local clone/push where transport is available; edit disposable repository branch rule and webhook,
  inspect a controlled delivery and failure, then revoke access and repeat the denied operation.
- **Expected:** copy/status/help text matches actual credentials and transport, revoked secrets stop working, protected
  branches still enforce policy, and webhook status distinguishes attempted from delivered work.
- **Recovery:** malformed/duplicate key, expired/revoked token, removed project role, rejected push and unreachable local
  receiver; preserve only redacted evidence and remove temporary credentials.
- **Screens/modes:** GitAccess, account handoff, RepositoryDetail/Settings and Settings/Code; browser/TUI/Standard
  exposed controls. UI success alone does not prove HTTP/SSH Git; missing transport stays unverified.

### PR-16 — Record a week of work and keep the timer consistent

- **Actor/start:** team member with work, week data and an empty day; second session for timer continuity.
- **Objective/steps:** QuickCreate Log time/work item Start timer → Home/Today/MyTime → stop → weekly grid entry/day
  detail → edit/delete/add/copy where offered → navigate weeks and reopen; compare project/work-item time totals.
- **Expected:** one active timer has one persisted outcome, correct day/week and work type, totals agree and newer
  unsaved edits survive an earlier response. Neither a navigation-free check nor a reload substitutes for the
  visible save.
- **Recovery:** running-entry conflict, invalid hours, midnight/week/DST boundary, failed save, navigate while loading,
  submitted or invoiced lock and canceled deletion.
- **Screens/modes:** QuickCreate, work item Time, Home/Today, MyTime/MyTimeTui, entry dialog/EditEntry;
  browser/TUI supported actions, Standard fallback, targeted keyboard grid and narrow day view.

### PR-17 — Submit, return and approve a timesheet

- **Actor/start:** worker and authorized approver, draft week with valid entries and one invalid/running-entry variant.
- **Objective/steps:** MyTime → submit → approver's Timesheets/Today → TimesheetDetail → return with
  reason → worker correct/resubmit → approve → reopen where allowed → inspect print and linked project totals.
- **Expected:** each identity sees the current state and reason, approval locks appropriate entries, notifications
  target the intended worker/approver and the same timesheet is shared with People where reached.
- **Recovery:** required work/note absent, running timer, stale or repeated decision, unauthorized approver, invalid
  reopening and canceled return; inputs and explanation remain usable.
- **Screens/modes:** MyTime, Timesheets, TimesheetDetail/TimesheetPrint, Today;
  browser/TUI/Standard supported operations and actual printed output.

### PR-18 — Correct and import time without losing its history

- **Actor/start:** worker/manager, editable and locked entries and CSV with unique external keys and one invalid row.
- **Objective/steps:** TimeEntries filters → EditEntry/bulk action → compare project Time and PersonDetail/Time →
  Import Source → Preview → result/progress → inspect created entries → repeat file and reconcile counts; use
  TimeEntries → Print to inspect the grouped TeamTimesheet output (it opens under `/apps` with
  `renderMode=html-print`, so this is a Standard-path print, also from the project-fixed mount).
- **Expected:** correction and duplicate handling follow the current policy, each refused row is identified, week
  and project totals agree and locked/invoiced work is not silently rewritten. Rate-only edits obey separate grants.
- **Recovery:** invalid row/range, unknown work item, duplicate key, independent row failure, running/invoiced lock,
  cancel/back and unsuccessful progress fetch.
- **Screens/modes:** TimeEntries/EditEntry and their `PD/Time`, `PD/Time/EditEntry` mounts, TeamTimesheet print,
  Time/Import and all steps/ImportProgress; browser/TUI/Standard supported controls, targeted keyboard
  preview/result.

### PR-19 — Request, staff and balance capacity

- **Actor/start:** resource manager, worker and approver; requested placeholder, part-time Ana, Bob's leave and overbooked Joe.
- **Objective/steps:** TeamPlanner → request allocation → inspect candidate fit → staff → approve/reject → move/resize
  or edit/end → PersonDetail Overview/Allocations/WorkItems/Time/Capacity → project Team; revisit sprint capacity.
- **Expected:** requested versus staffed/approved work is clear; hours/percent, leave/holiday availability and overload
  describe the same date window, and allocations persist on the correct person/project after movement.
- **Recovery:** no suitable candidates, invalid date/capacity, rejected request, stale drag, removed person/project,
  cancellation and read-only user. Do not imply that every overload must be refused if policy only warns.
- **Screens/modes:** TeamPlanner/TeamPlannerTui, Allocations/EditAllocation/Staff, PersonDetail and all tabs;
  browser, supported TUI move/decision controls, Standard fallback, targeted keyboard/narrow capacity presentation.

### PR-20 — Explain budgets, estimates and effective rates

- **Actor/start:** money manager, separate payroll-granted fixture and client approver; project budget/order and dated rates.
- **Objective/steps:** Money → budget/order-line association → estimate and approval request → client refusal/reason
  then approval as allowed → Rates add/edit/end effective row → Which rate → inspect affected work/billing totals.
- **Expected:** estimate revision and decision are identifiable, client charge differs from worker cost/pay, rate
  dates/currency/rounding are clear and ordinary manager sees payroll restrictions without receiving hidden pay.
- **Recovery:** missing/overlapping rate, invalid budget/range, stale estimate decision, canceled send, restricted worker
  rate and unavailable linked order. Pair authorized payroll read/edit with the same denied operation.
- **Screens/modes:** ProjectDetail/Money, Rates, Shared/OrderDetail, EstimatePrint and approval entry;
  browser/TUI/Standard, captured local mail and inspected estimate output; client continuation PR-24.

### PR-21 — Bill approved work and a reached milestone

- **Actor/start:** billing manager, approved billable time, eligible expenses/milestone share, already billed control rows.
- **Objective/steps:** Unbilled → select eligible rows → CreateInvoice → InvoiceDetail review/edit → permitted status
  change → print/PDF/time detail → local send → client reads sent invoice; separately gate/deliverable/share → milestone
  invoice. Inspect project Money, linked order and queue after cancellation/removal where allowed.
- **Expected:** selected rows and currency agree with invoice lines/totals, work is not billed twice, visibility changes
  at the correct invoice state and cancel/remove follows the service's release-of-source-work contract.
- **Recovery:** unapproved/unbillable row, missing rate, duplicate submit, invalid share, canceled confirmation, failed
  local send, denied team member and stale queue. Payments/adjustments remain the Accounting boundary.
- **Screens/modes:** Unbilled/CreateInvoice and Money alias, Invoices/InvoiceDetail/InvoicePrint, OrderDetail,
  MilestoneDetail; browser/TUI/Standard, actual PDF/print/file content and captured local send.

### PR-22 — Explain delivery through reports and exports

- **Actor/start:** manager and team member with known work/time/capacity/billing results and empty/zero-value controls.
- **Objective/steps:** Reports Index → Time, WorkItems, Sprints, Portfolio, Profitability, Utilization and Progress →
  adjust scope/range/grouping → table/chart/drill-through → export CSV/XLSX and print where offered; compare selected
  totals with their source records and project/sprint/person views.
- **Expected:** filters, units, date windows, counts and sums agree; labels explain zero or unavailable denominators;
  hidden costs and projects stay absent in both responses and downloaded output. Headers and data columns align.
- **Recovery:** empty result, missing rates, invalid range, restricted person/project, failed export and changed filter
  while loading. Inspect actual output rather than just a download event.
- **Screens/modes:** all seven reports and index, supporting print routes; browser/TUI/Standard, targeted dark charts,
  narrow/zoom tables and keyboard drill-through.

### PR-23 — Configure defaults and verify their effect

- **Actor/start:** appropriately granted project manager/administrator, disposable settings and before-value record.
- **Objective/steps:** Settings Index → WorkItemTypes/Workflows/Labels/Templates/Time/Billing/Code/Intake → change a
  bounded default or definition → reopen the consuming create/edit form → compare project override → restore.
  Exercise type disable/icon, workflow move, label merge, template use, time policy and request category as applicable.
- **Expected:** defaults and overrides are distinguishable, saved options appear with names in their consumers,
  in-use definitions remain coherent and the correct repeated row opens after an unrelated action.
- **Recovery:** in-use deletion, invalid workflow/range, duplicate definition, stale save, permission refusal and
  cancel/reopen; preserve invalid inputs for correction and restore temporary defaults after review.
- **Screens/modes:** Settings and all nine children plus consumer samples; browser/TUI/Standard,
  targeted keyboard repeated-row dialogs and narrow long forms.

### PR-24 — Work as a restricted project client

- **Actor/start:** Sheldon on ACME and Gob on BLUTH; shared/unshared work, outward/internal request files/messages,
  published/internal updates, approved/sent versus draft invoices and explicit Code/Hours sharing.
- **Objective/steps:** client Home → own project/work/roadmap → request create/reply/file/cancel where permitted →
  gate/estimate decision → sent invoice → shared repository and the group-specific ClientHours (Hours) tab; follow an
  outward notification back to the record. Manager changes sharing/membership; repeat read and direct resource request
  as the client. Verify the internal Time tab and its EditEntry route are refused to the client.
- **Expected:** only the client's shared part is returned, internal notes/files/rates/pay/person details stay absent,
  writes are limited to permitted client actions and cross-client access is refused. Verify attachment bytes and
  direct download authorization, not just the visible file list.
- **Recovery:** unshared/other-client/deleted record, revoked membership, closed request upload, invalid/duplicate
  approval, empty shared Code/Hours and direct denied mutations with otherwise valid parameters.
- **Screens/modes:** role variants of Home, project/detail/request/roadmap, ClientHours, Code and billing outputs;
  browser/TUI/Standard supported client operations, targeted narrow/keyboard client forms.

### PR-25 — Reconcile access, cross-app continuity and remaining modes

- **Actor/start:** team, manager, narrow approver/payroll/admin, client, no-project and other-organization identities.
- **Objective/steps:** pair allowed operations with forbidden records/roles through direct routes, palette/search,
  choices, drawers, shared panels, exports, print and files; revoke membership and retry; follow a Projects task,
  request, time approval and billing handoff through their existing consuming apps and back. Complete pending theme,
  viewport, keyboard, TUI and Standard variants and retest affected shared consumers. Pair the client-only ClientHours
  mount with internal Time access: internal users must not list/open ClientHours, and clients must not reach Time/EditEntry.
- **Expected:** authority comes from services and record scope, not the entry path; all links identify the same work,
  stale sessions do not retain forbidden content and supported modes have actual outcomes.
- **Recovery:** valid-parameter refusal, missing/deleted target, session/role change, stale response after navigation,
  unavailable dependency and explicit unsupported mode. Each negative case pairs with a successful authorized case.
- **Screens/modes:** inventory-wide boundary samples; browser/TUI/Standard and selected constrained cases. This is a
  manual review/access activity; any automation of the complete walk belongs in acceptance, not regression.

## 5. Existing checks and future verification

This is an available-test map, not a passing-results ledger. Paths are relative to the named component; spec names
omit `.spec.js`. Read the current assertions before choosing a focused run or extending a test. Existing historical
test breadth is not a reason to add duplicate rules, renders or scenarios.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Projects/` | ProjectsHome, Projects, NewProject, ProjectDetail, ProjectsSettings | PR-01–03, 23; source/service/render checks do not prove wizard, navigation or role UX |
| mr-boss regression `test/Projects/` | WorkItems, WorkItemDetail | PR-05–09; drag, keyboard, filter-return and custom-view outcomes need live evidence |
| mr-boss regression `test/Projects/` | ProjectRequests | PR-11–12; public/local-mail submission and file audiences need observed outcomes |
| mr-boss regression `test/Projects/` | Code, MergeRequests | PR-13–15; local transport, actual diff/review/merge and revision bytes remain separate |
| mr-boss regression `test/Projects/` | TimeEntries, Resources | PR-16–19; grid, timer, approval and capacity interaction remain separate |
| mr-boss regression `test/Projects/` | Billing, Reports | PR-20–22; actual invoice/estimate/report output and client reads need evidence |
| mr-boss regression `test/Projects/` | ProjectsAccess, ClientBilling | PR-24–25; selected rule refusals are not the complete access walk |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; Knowledge, KnowledgeReview, Calendar, QuickCreate, TodayPanel, Notifications | PR-01, 04, 06, 08, 11, 16–17, 25; reuse affected shared-rule checks without duplicating the Commons review |
| mr-boss regression `test/Commons/` | Tasks, Requests | PR-05–06, 11–12; the Commons consumers of Shared WorkItemDetail (as TaskDetail) and RequestDetail, for the shared-fix retest |
| mr-boss acceptance `test/acceptance/Projects/` | SprintWalk, TimelineWalk, ReleaseWalk | PR-07–10, 14; TimelineWalk includes import mapping/options/preview and row failure; server scenarios, not browser/terminal interaction evidence |
| mr-boss acceptance `test/acceptance/Projects/` | RequestWalk, CodeReviewWalk | PR-11–14; server scenarios with their own fixture/prerequisite scope |
| mr-boss acceptance `test/acceptance/Projects/` | TimeWalk, ResourceWalk, BillingWalk, MilestoneBillingWalk | PR-16–21; existing scenarios to reuse if execution is requested |
| mr-boss acceptance `test/acceptance/Projects/` | ProjectsServerStatic, ProjectsTui | Supporting render coverage; ProjectsTui also exercises selected transitions, not a live keyboard terminal walk |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Structural/shared coverage; do not add another sweep of the same app/mode |
| mr-mantle regression `test/work/` | WorkProjectFoundation, WorkProjectServices, WorkProjectHub, WorkProjectItems | PR-01–06; business rules belong here |
| mr-mantle regression `test/work/` | WorkProjectSprints, WorkProjectPlan, WorkProjectMilestones, WorkProjectReleases, BusinessTime | PR-07–09; planning/gates/releases/business dates |
| mr-mantle regression `test/work/` | WorkProjectRequests, WorkGit, WorkGitReview | PR-11–15; request and code rules |
| mr-mantle regression `test/work/` | WorkTimesheets, WorkTimeEntries, TimeImports, WorkResources | PR-16–19; time, duplicate import, approval and capacity rules |
| mr-mantle regression `test/work/` | WorkProjectBilling, WorkProjectReports, WorkProjectClients | PR-20–25; billing/projections/client visibility |
| mr-mantle regression `test/work/` | WorkPlanToCashBasicFlow, CommonsToday | PR-16–21 plan-to-cash time/expense invoicing; PR-01, 16–17 Today rows and shell counts |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootVue.qvt.markdown, WebrootTerminal, QvtKeys, Keys | Shared widget/shell/render fixes only; use existing focused assertions for the affected control |
| webroot acceptance `test/acceptance/client/` | ThemeLayout | Existing offline theme/geometry acceptance home for a reusable contrast/layout check; not a reason to run it during plan writing |

All eleven Projects acceptance files listed above are **server specs**. Neither BOSS `test/client/suite.js` nor
`test/acceptance/client/suite.js` currently includes a Projects browser walk. There is no `ProjectsClientFixtures` or
Projects golden-path browser spec. Record this as a coverage gap, not a plan-writing requirement to create tests.
If later automation is requested, name the activity and spec first, retain at most one regression golden-path client
walk for Projects and place additional complete journeys, phone/access walks and sweeps in acceptance. The old
`./moq test` example in ProjectsTui's header does not change its suite: it is an acceptance spec.

### Verification rules for later refinements

- Read the [testing skill](../../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Use affected regression specs while working, for example
  `./moq test mr-boss --spec WorkItemDetail --nobuild` or
  `./moq test mr-mantle --spec WorkProjectItems --nobuild`, with a suitable existing binary. Client specs run through
  Moqui, not Node; use `./moq test-client <component> --serve --spec <name>` for an existing served check.
- **User-directed cadence for this execution:** run focused tests and lint during each batch, then commit after
  independent review. Defer `./moq test-apps` until the end of this entire review, and run `./moq test-framework`
  there only if framework sources changed. This explicit instruction supersedes the default before-each-commit
  full-suite gate for this pass. A shared widget/renderer/Git correction is framework work even when found here;
  do not run framework specs, `cargo test` or `test-all` merely for application work.
- **Run acceptance only when requested or when adding/changing an acceptance test.** In the latter case run that
  test and its component's acceptance suite once written. For an authorized existing scenario the form is
  `./moq accept mr-boss --spec SprintWalk`. A plan entry, shared-code change or completion checkpoint is not permission
  to run acceptance. Do not run `accept-all` or add a blanket suite as a default completion step.
- Keep focused rules/bug regressions in the owning component. Render a screen at most once per mode across regression,
  combining checks; a second mode needs its own custom template. No regression screen sweeps, role×mode matrices,
  screenshot baselines or duplicate full journeys. An acceptance sweep is at most one per app per mode.
- Respect current BOSS regression budgets, **264 seconds server / 57 seconds client** in `test/budget`. A regression
  spec over 15 seconds fails; reduce duplication or move scenario coverage to acceptance instead of raising a budget.
  No budget increase is authorized.
- Lint changed screens with `moqui lint --screens <report-file>` using a separate output report: the argument is
  overwritten and must never be a source-screen path. Compare against the baseline; no new parse failures or idiom
  sites. This plan changes no screens and does not need a runtime lint pass.
- Framework template changes require their existing generated/precompiled checks and actual current assets; follow
  the building skill for embedded modules and Rust. Do not copy the Commons pass's desktop build obligations into
  Projects-only work. If a change reaches a bundled Comms/desktop surface, inspect its actual consumers and use the
  prior plan's documented propagation checklist for that change.
- Keep evidence under the framework's ignored `plans/ui-refinement-evidence/boss-projects/` (or a named equivalent),
  outside tracked source. Capture and inspect important before/after states at identical data, measured geometry and
  theme; retain relevant DOM/console/network results, persisted outcomes and redacted output checks. Do not commit
  screenshots, credentials, access tokens or private keys.
- Re-run affected activities after correction, including relevant negative/recovery cases and one other consumer of
  shared changes. Keep unsupported browser operations, external/local prerequisite failures, pre-existing failures
  and genuine product defects distinct. No silent skip closes coverage.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial result; **blocked** means a prerequisite prevents execution; **deferred**
means deliberately postponed with a reason and follow-up. Exercised does not itself mean passed. Use status
`exercised` with outcome `partial` and named outstanding continuations for an activity partly executed. Blocked/deferred
dispositions document unresolved coverage and never count as passed. Record recovery and mode gaps explicitly.
Source research for this plan does not advance live coverage to inspected or exercised.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| PR-01 — Workday navigation | exercised | primary paths exercised: manager/member Home, counter→find, Code palette, Today, app drawer and Assist; personal progress corrected to2done/9open; provider/deleted-source and additional geometry variants unverified | pr01-home-progress-after.jpg; pr01-palette-assist.txt; pr01-today-projects.txt; PR-UI-003,035 |
| PR-02 — Create/clone/template | exercised | primary paths exercised: quick create/duplicate recovery, all wizard steps and draft resume, clone/template reuse and subproject context persisted; phone wizard remains deferred with constrained variants | pr02-wizard-review-after.jpg; planning-tui-results.json; PR-UI-002 |
| PR-03 — Health/team/lifecycle | exercised | primary paths exercised: health/description, role add/end and separate-member revocation, lifecycle throughClosed/Re-open, empty deletion and readable status output; nonempty delete control absent, stale-edit variants unverified | planning-tui-primary-completion.txt; pr03-status-report.jpg; PR-UI-013,014,022 |
| PR-04 — Docs/files/conversation | exercised | named continuations observed: database save/history/review, Git save/history/publication and fetched revision, actual download bytes, two-staff mention→notification→same project and follow/reload/unfollow; rich-editor pending/failed-save variants unverified | pr04-db-docs-history.jpg; pr04-git-docs-history.jpg; pr04-mention-recipient.jpg; pr04-mention-return.txt |
| PR-05 — Work views/find | exercised | primary paths exercised: find/sort/saved columns, views, assignee board grouping, peek→full→Back, bulk cancel/apply, subtree move/restore and cycle refusal; CSV/XLSX and global/fixed reset corrected; forced pagination/hidden-descendant variants unverified | planning-export-live.json; pr05-board-peek.jpg; pr05-peek-full-back.txt; PR-UI-019,031,033 |
| PR-06 — Work item delivery | exercised | primary paths exercised: facts/type, assignment, labels, sub-item/relation, recurrence, clone/move/request conversion and Commons same-ID read; Owner remains displayed separately from editable Assignee; other boundary refusals unverified | pr06-edited-facts.jpg; pr25-commons-task-continuity.txt; planning-tui-primary-completion.txt |
| PR-07 — Sprint | exercised | named capacity continuation observed; rank/edit/start/scope history/complete/carry-over and printable report persisted; actual browser drag and keyboard move both persisted/restored; extra optimistic-refusal/narrow-chart variants unverified | pr07-browser-drag-after.jpg; pr07-sprint-report.jpg; planning-tui-primary-completion.txt; SprintWalk |
| PR-08 — Schedule/calendar | exercised | primary paths exercised: dependency add/edit/remove/lag, auto-rescheduled dates, project/plan/portfolio and calendar record navigation; actual Manufacturing move/preview/apply/reload passed; DST/holiday/drag-boundary variants unverified | planning-tui-primary-completion.txt; pr08-manufacturing-move-after.jpg; PR-UI-005,012; TimelineWalk |
| PR-09 — Milestone/release | exercised | named continuations observed: gates, deliverables, linked work, real Git tag, notes overwrite/edit/save/publish and release with explicit unfinished destination; client estimate/milestone billing completed later; extra duplicate/protected-write variants unverified | planning-tui-primary-completion.txt; code-tui-final.json; ReleaseWalk; financial-milestone-invoice-capture.json |
| PR-10 — Work import | exercised | primary paths exercised: generic CSV mapping/options/preview/result,2created hierarchy rows/label/3h, one refused row and repeat0create/2skip/1fail; vendor/encoding/progress-failure variants unverified | pr10-import-preview.jpg; pr10-import-result.jpg; pr10-repeat-skip-result.jpg |
| PR-11 — Request triage | exercised | primary paths exercised: classify/assign/accept→linked work→complete→canceled then successful resolve, internal note, separately captured outward reply and filtered detail/Back; conversion-to-project/duplicate recovery variants unverified | planning-tui-primary-completion.txt; pr12-outward-reply.jpg; RequestWalk; PR-UI-001,012 |
| PR-12 — Public/email intake | exercised | primary paths exercised: anonymous validation/file/submit, token rotate/disable, confirmation off0 versus enabled captured mail, SMTP intake/threaded reply; confirmationN/formoff restored; CAPTCHA provider unavailable, live honeypot/rate-limit variants unverified | pr12-public-success.jpg; planning-mail-protocol.json; planning-mail-final-capture.json; PR-UI-006 |
| PR-13 — Repository | exercised | primary paths exercised: revision/tree/content/download bytes, branch/tag, repository link and admin export/import/mirror failure/restoration/archive pairs; source archive absent from Files UI, extra denied-revision variants unverified | code-tui-final.json; pr13-standard-merged-file.jpg; PR-UI-010,011,026 |
| PR-14 — Review/merge | exercised | primary paths exercised: real commit/push, reviewer, keyboard line comment, both diff presentations, terminal threads/review/approval and real merge preserving Docs; separate draft/ready/close/reopen passed; conflict/changed-head/external CI variants unverified | pr14-diff-keyboard-dark.jpg; code-tui-final.json; CodeReviewWalk; PR-UI-007,021 |
| PR-15 — Git access/controls | exercised | primary paths exercised: one-time SSH/token access, actual Git read/push and denial after removal/revoke, required approval rule, signed local200/503 webhook outcomes/history/delete; account-handoff/protected-push/removed-role variants unverified | code-tui-final.json; code-shared-tui-checks.txt; PR-UI-023,028 |
| PR-16 — Time/timer | exercised | primary paths exercised: timer continuity/stop, grid typing and390px day dialog, week navigation and persisted totals; mounted failed/late saves retain drafts; midnight/DST and additional lock/theme variants unverified | pr16-week-grid-saved.jpg; pr16-time-390.jpg; time-terminal-results.md; PR-UI-008 |
| PR-17 — Timesheet approval | exercised | primary paths exercised: worker/narrow approver return validation→correction/resubmit→approve/lock→allowed reopen/reason/notification→resubmit/approve; actual printed0.5h matches; repeated/stale-decision variants unverified | time-tui-audit-session.txt; pr17-timesheet-print.jpg; TimeWalk |
| PR-18 — Time correction/import | exercised | primary paths exercised: historical person/week correction, editable/locked entries, actual time import/repeat0create/2skip/1fail and global/project-fixed grouped print2.5h; external-key mapping unsupported, failed-progress variants unverified | time-terminal-results.md; pr18-team-timesheet-print.jpg; pr18-project-fixed-print.txt; PR-UI-015,029,032,033 |
| PR-19 — Staffing/capacity | exercised | named sprint-capacity continuation observed; request/staff/approve-allocation/edit/move/restore, Ana32h and Bob14h leave/26h capacity versus32allocated, person tabs and dated headers observed; historical PersonCapacity selector unavailable, browser drag variants unverified | time-tui-audit-session.txt; time-terminal-results.md; PR-UI-009,010,014,027; ResourceWalk |
| PR-20 — Budget/estimate/rates | exercised | named client continuation observed: budget/order, estimate refusal/reason/revision/approval, captured mail and inspected HTML; rate add/edit/Which/end and payroll70→71→70 versus manager-hidden pay paired; extra overlap/stale-decision variants unverified | time-terminal-results.md; pr20-estimate-document.jpg; financial-estimate-capture.json; PR-UI-016; BillingWalk |
| PR-21 — Invoice work | exercised | primary paths exercised: manual-rate invoice100102187.50/source100104/unbilled0, approval/send/client read, current PDF and immutable-file presence; milestone100153250/captured PDF/order links; legacy multi/no-schedule date fallback and extra cancel/expense variants unverified | pr21-calendar-date-after.jpg; pr21-invoice-pdf-current.png; financial-milestone-invoice-capture.json; PR-UI-017,024,025; BillingWalk; MilestoneBillingWalk |
| PR-22 — Reports | exercised | primary paths exercised: all7 reports, scope/grouping/drill-through and reconciled totals, actual CSV/XLSX contents and supported print delegation; additional graphical/zero-denominator/failed-export variants unverified | time-terminal-results.md; time-tui-debug-session.txt; PR-UI-011,020 |
| PR-23 — Settings | exercised | primary paths exercised: Code inheritance/override, templates, type/icon, workflow-name consumer, label merge, Time policy/work types and Intake category selector; repeated browser rows retain identity; static browser Offer/Stop corrected and originals restored; Projects request-category consumer absent by design | code-settings-final.json; pr23-label-dialog.jpg; pr037-time-restored.jpg; PR-UI-030,036,037 |
| PR-24 — Restricted client | exercised | primary paths exercised: client file listing/direct bytes protected, ACME Hours1.5h without people/pay/comments, cross-client/internal-Time refusal, estimate/Sent invoice decisions, shared read-only repository then direct refusal after restoringN; further client request variants unverified | pr-ui-001-client-after.jpg; pr24-client-hours.jpg; pr24-client-code-readonly.jpg; pr24-client-code-revoked.txt; PR-UI-001 |
| PR-25 — Access/integration | exercised | primary boundary samples exercised: narrow roles/otherorg/revoked member, Commons same-task handoff, internal-only/client-only Hours pair, real embedded terminal keyboard in both themes, Standard notices and outputs, Manufacturing shared move; real zoom deferred by user and other unsampled variants unverified | pr25-commons-task-continuity.jpg; pr25-internal-client-hours-refused.txt; pr25-embedded-terminal-light.jpg; ProjectsServerStatic; ProjectsTui |

### Findings register

Allocate **PR-UI-001** onward when evidence exists. Keep observed defects, design judgments and static suspicions
distinct. P1 blocks work, risks data/privacy or makes essential information unusable; P2 causes substantial friction
or misleading behavior; P3 is localized refinement. Security/data findings take priority over visual polish and go
to the owning layer. A source lead below has no new observed finding number yet.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PR-UI-001 / observed / P1 | PR-11, 24–25: request files | Projects/Requests/RequestDetail, Files; staff and ACME client; light 1920×1080 | Client saw a staff attachment explicitly labelled Internal and downloaded its exact bytes | pr-ui-001-client-internal-before.jpg; paired route regression | BOSS shared files | Filter explicit outward content types before count/paging and direct resource lookup; leave internal, unclassified and case-summary files private; omit drive capabilities at service boundary | Client now sees only outward control file (pr-ui-001-client-after.jpg); staff and cross-client/refusal checks pass; remaining PR-24 variants are explicit in the activity ledger |
| PR-UI-002 / observed / P1 | PR-02: Start → Next | NewProject/Start; manager; light 1920×1080 | With Create now unchecked, Next created the draft then skipped the remaining wizard steps | browser activity; batch01-before.log | BOSS Projects | Replace ignored, schema-invalid conditional-response attribute with its condition/expression child | Focused regression passes; resumed saved draft progressed through Team, Modules, Money and Review and opened the same project |
| PR-UI-003 / observed / P2 | PR-01: empty workday | Home; no-project fixture; server route | Empty project list failed required-list validation and falsely added projects to failedParts | batch01-before.log | BOSS Projects | Accept an empty list in the internal project-row decorator | ProjectsHome verifies the first-run state with no failed parts; 3/3 Home features pass |
| PR-UI-004 / mounted reproduction / P2 | PR-07: completion summary and quick-add | Backlog; real mounted component with deferred responses | An older sprint summary replaced a newly opened dialog; successful quick-add erased a newer title | planning-before-sprint-summary / quick-add evidence; ProjectsPlanningResponses | BOSS Projects | Bind replies to their original dialog/visit and acknowledge only submitted text | Focused regressions pass, including leave/return and unmount; actual browser drag and keyboard move/reload pass; optimistic-refusal/narrow variants remain |
| PR-UI-005 / mounted reproduction / P2 | PR-08: dependencies; shared Manufacturing timeline | Timeline and ProductionSchedule resource mode | Late replies closed/replaced newer dialogs; later move/override edits were discarded; dependency drag retained window handlers after unmount | planning-before-dependency-drag evidence; ProjectsPlanningResponses | BOSS shared timeline | Bind replies to dialog/input/visit, invalidate old previews, rotate consumed operation keys and remove drag handlers on teardown | Focused actual-component checks cover Projects and Manufacturing; actual Manufacturing Move→Preview09–11/No conflict→Apply→reload retained times and zero conflicts |
| PR-UI-006 / source-confirmed content / P2 | PR-12: public intake confirmation | RequestIntake success panel | Always promised an email/reply path despite disabled confirmation or no intake account | source/contract comparison; RequestWalk | BOSS public intake | Say replies are possible if an email is received, without promising delivery | RequestWalk and actual confirmation-off/on browser+SMTP/captured outward reply pass; confirmationN and formoff restored |
| PR-UI-007 / mounted reproduction / P2 | PR-14: review threads/drafts and restricted read state | MergeRequestDetail/Changes; mounted deferred-response fixture, browser dark 1920×1080 | Acknowledgment erased newer drafts or navigated a replacement MR; open read-only view falsely said merged/closed; line comment action was unavailable by keyboard | ProjectsDiffState; pr14-diff-keyboard-dark.jpg | BOSS Code | Capture MR/view/lifecycle and submitted text; retain newer drafts; use actual open state; expose named line-comment actions on focus | Focused test passes; actual Tab → named action → Enter → typed comment persisted, shown in Unified and Side by side |
| PR-UI-008 / mounted reproduction / P1 | PR-16–17: grid, timer comment and decision drafts | MyTime; actual component with deferred replies; browser grid typing/Enter | Reload after an older/failed save erased unrelated/newer edits; failed timer comment was treated as acknowledged and could not retry | ProjectsTimeAsync; time-resources-before evidence | BOSS Time | Acknowledge submitted snapshots, serialize competing writes, retain failed inputs and stop departed-view callbacks | Focused regression passes; actual browser Tuesday 1.25 + Wednesday 2 persisted after reload (week total 3.27 h), 390px day view usable |
| PR-UI-009 / mounted reproduction / P2 | PR-19: staffing candidates and people | TeamPlanner; actual mounted component with deferred replies | Late candidate/people answers populated a replacement dialog; old decisions could reload another view | ProjectsResourcesAsync; time-resources-before evidence | BOSS Resources | Bind candidates/people/results to originating dialog and view; capture mounted endpoint and preserve later decision text | Focused regression and actual request/staff/approve-allocation continuation pass after the shared terminal corrections |

| PR-UI-010 / observed / P2 | PR-13, 19: nested list controls | Remote TUI, repository Files and Allocations | Container cells lost filenames and Staff/Edit/Approve controls | code-tui-observations.json; time-tui-session.txt | Framework ScreenTui | Flatten nested cell containers without losing actionable widgets | Debug live filenames, exact README download and requested allocation staffing now pass; focused render check passes |
| PR-UI-011 / observed / P2 | PR-13, 22: attachments | Remote TUI navigation and agent CLI | Download parsed attachment bytes as screen JSON; agent exports queued bytes without saving | code-tui-observations.json; report export observation | Framework host/TUI | Recognize successful attachment responses, retain screen/focus and drain agent downloads through existing safe writer | Live README bytes match disposable Git revision; focused raw/save/error/JSON-mode checks pass |
| PR-UI-012 / observed / P2 | PR-04, 08, 11, 14: canonical links | Remote TUI Calendar, request Work, MR Changes and release Docs | Browser-mount links opened blank Applications in terminal | planning-tui-results.json; code-tui-observations.json | Framework TUI | Normalize only local browser mount at terminal screen-navigation boundary | Actual debug Calendar/request/MR/Docs continuations reach intended records; external/other mount regression checks pass |
| PR-UI-013 / observed / P2 | PR-03: lifecycle header | Remote TUI parent/child cache | Saved project lifecycle changed while cached header retained old status even after F5 | planning-tui-session.txt | Framework TUI | Refresh parent levels after successful writes and explicit refresh | Debug Begin confirmation immediately shows In Progress in parent header |
| PR-UI-014 / observed / P2 | PR-03, 14, 19: row actions | Remote TUI F10 | Current-row End/resolve and other transition links were absent from action menu | planning-tui-debug-retest.txt; code-tui-observations.json | Framework TUI | Include current-row enabled write actions and retain confirmation semantics | Team End revoked Joe and fresh Joe refresh refused project; MR Reopen available; two-row focused checks pass |
| PR-UI-015 / observed / P2 | PR-18: edit from selected week | MyTimeTui → EditEntry; Joe and manager viewing Joe | Saving an historical entry returned to global current-week list and hid the corrected row | time-tui-session.txt | BOSS Time | Carry fixed MyTime person/week context through edit, rates and delete responses | Existing TimeEntries regression 7/7; debug member and manager Save + F5 retain Oct 19 and selected Joe identity; normal/project returns unchanged |
| PR-UI-016 / observed / P1 | PR-20: manual-rate actuals | Project Money; manager | Approved manual-rate time billed correctly but project actual client value remained zero | time-tui-session.txt; WorkManualTimeRates | Mantle work | Expose explicit hourly rates to rollup and use null-aware precedence, preserving zero | Standalone explicit/zero/fallback/delete rule checks pass; debug rate resave populates actuals; existing records require their normal update trigger |
| PR-UI-017 / observed / P1 | PR-21: grouped time billing | Unbilled → worker-grouped draft invoice | Manual-rate source contributed 375 to invoice but had no invoice source link, stayed eligible for duplicate billing | time-tui-session.txt; manual-billing-before/after | Mantle accounting | Track resolved rated contributors per group, link manual/zero/piece rates and leave unrated piece-only controls unbilled | Standalone grouping/retry/removal/rebuild/cancel checks9/9; live100102187.50 links1001041.25h, unbilled0; original100051 preserved |
| PR-UI-018 / measured / P2 | PR-07 and shared status labels | Browser Backlog, dark; composited actual fills | Planned grey text measured 2.34:1; blue 4.18:1; light-blue acceptance control also failed | pr07-backlog-dark.jpg; tonal-before/after | Framework webroot | Use theme-specific tonal foregrounds for grey/blue chips and badges | Existing ThemeLayout feature failed before and passed after; live dark4.63/5.41 and light5.24/4.84 contrast ratios pass; full component acceptance passed at the final phase (4/4 after the later journey move) |

| PR-UI-019 / observed / P2 | PR-05: project work counts | ProjectDetail WorkItems, browser dark1920×1080 | View pills showed Open40/All47 while the project had1 matching item | pr05-project-counters-before.jpg; WorkItems before/after | BOSS WorkItems | Apply fixed project context to the base shared by smart counts and rows; preserve exclusion of other find fields | Existing WorkItems check reproduced global27/project11 mismatch then passed9/9; independent code review clear; live restart retest shows Open3/All4/Done1 matching imported project records (pr05-project-counters-after.jpg) |

| PR-UI-020 / observed / P2 | PR-22: terminal Print | Time report Print, remote terminal | Explicit html-print URL gained tui and returned404 for mixed render mode | time-tui-debug-session.txt | Framework TUI | Delegate explicitly authored html-print destinations to browser, retaining filters/current terminal page | Existing shell check and actual debug report Print pass; actual browser invoice print inspected separately |
| PR-UI-021 / observed / P2 | PR-14: required review gate | MR100051, terminal Overview | Able to merge appeared beside0of1 approvals although Merge was unavailable | code-tui-retest.json | BOSS Code | Describe the conflict test as No merge conflicts without changing enum, policy or controls | MergeRequests6/6 and actual blocked gate text pass; committed54006f92 |
| PR-UI-022 / observed / P1 | PR-03/06: closed project | PRPLAN01 closed, terminal child Edit | Priority5→6 saved after Closed, contradicting documented read-only state | planning-tui-debug-retest.txt | Mantle work and BOSS access projection | Reusable owner guard for manual writes; preserve derived actuals, late billing and manager Re-open | Mantle11/11, BOSS18/18 and compatibility28/28 pass; actual Closed update refused PROJECT_CLOSED, creation/edit controls absent, Re-open restores Edit and priority5 |
| PR-UI-023 / observed / P2 | PR-15: one-time token | Remote TUI GitAccess | Created one-day token row but redirect never showed its one-time value | code-tui-retest.json | Framework remote TUI/authentication | Ephemeral HTTP cookie continuity with explicit key revalidation and matching identity/CSRF authority | Bounded auth/host controls pass; live one-time token read/push then revocation/denial pass; temporary keys/tokens removed |
| PR-UI-024 / observed / P1 | PR-21: narrow manager send | Invoice100102, narrow manager | Project detail/approval allowed but Send output refused generic Invoice view authority | time-tui-debug-session.txt | Mantle invoice and BOSS delivery adapter | Checked project-scoped output with generic finance authority and trusted-template boundaries retained | Billing6/6 and native12/12 pass; actual narrow Send100102 and milestone100153 reach Sent, local capture verified; no external delivery |

| PR-UI-025 / observed / P2 | PR-21: invoice dates | Berlin manager versus stored accounting day | Timestamp formatting displayed a different invoice day and excluded it from the intended day find | invoice-calendar-before/after; pr21-calendar-date-after.jpg | Mantle calendar helper and BOSS Billing | Use stored accounting DATE and single-schedule due day after record authorization; retain timestamp and legacy fallback | Two-zone service regression1/1, combined Billing7/7 and actual browser/current PDF pass; no historical rewrite or overdue-policy change |
| PR-UI-026 / observed / P2 | PR-13/25: authored browser destinations | Remote terminal Raw and document links | GET links with explicit browser target were treated as native screen navigation | code-tui-retest.json | Framework TUI and BOSS Files | Carry additive browser metadata for authored GET targets, retain native writes and true attachment downloads | Shell14/14, Agent11/11, core metadata and live paired Raw/Download pass; framework eb5fdee3 |
| PR-UI-027 / observed / P2 | PR-19: capacity window | TeamPlannerTui | W0–W5 headings concealed actual week dates | planner-week-labels-before/after | BOSS Resources | Put titles on default fields and hide unused columns | Existing Resources4/4 and actual dated two-week headers pass; BOSS1cc74657 |
| PR-UI-028 / observed / P2 | PR-15: webhook failure | Disposable review-code-admin, loopback receiver | Actual HTTP503/retrying row still produced Ping delivered toast and delivered=true | code-webhook-before/after; code-tui-retest.json | Framework Git hosting | Report exact SystemMessage persisted outcome and latest per-message error; retain retries | Existing signed-delivery regression1/1; actual200 delivered and503 failed, both signed payloads verified; hooks/receiver removed and config restored; framework6e715048 |

| PR-UI-029 / observed / P2 | PR-18: grouped time print | TimeEntries Print, remote terminal and browser | JS Date string coercion produced entryDate_thru=%7B%7D, corrupting the selected end date | time-tui-final-session.txt; pr18-team-timesheet-print.jpg | BOSS TimeEntries | Use JS Date.getTime while retaining numeric host timestamp fallback, then preserve inclusive last day | Existing TimeEntries7/7, actual Oct12–18 href and browser grouped Joe2.5h output pass |

| PR-UI-031 / observed / P2 | PR-05: work exports | WorkItems CSV and XLSX, same saved find | Title/Status/Priority were blank in CSV; rich/editable cells did not yield clean scalar export values | planning-export-live.json; planning-tui-export-after.txt | BOSS WorkItems | Export-only scalar Type/Status/Priority/Due fields and explicit Title anchor; retain shared escaping and saved columns | Existing WorkItems10/10, quoted/comma title control and actual parsed five-row CSV/XLSX pass; export covers whole find, not selection |

| PR-UI-030 / observed / P2 | PR-23: conditional settings actions | Remote terminal type and time-work-type rows | Sections inside table cells dropped Offer/Stop offering actions | code-tui-retest.json; core existing macro before/after | Framework ScreenTui/SRI | Capture the native section JSON value with its original guards/actions/fail and row context | Existing bounded two-row macro1/1 and actual Type/Time work-type consumers pass; choices appeared/disappeared and original settings restored; framework a90af8c3 |
| PR-UI-034 / observed / P3 | PR-07/08/25: Standard fallback | Standard Backlog and project Calendar | Authored html/qvt delegation notices were unreachable because their render-mode whitelist returned404 | pr25-standard-backlog-after.txt; pr25-standard-calendar-after.txt | BOSS screen declarations | Allow the two already-authored notice modes; no new editing mode | Independent review clear; XML parse and actual Standard notices pass; Changes plain mode remains explicitly unsupported |

| PR-UI-032 / observed / P2 | PR-18/19: recent person time | PersonDetail/Time, narrow manager | Last four weeks included future Nov10/11/16 entries because the rolling query had no upper bound | time-tui-final-window-retest.txt | BOSS Person Time | Retain lower bound and end at the next viewer-local day boundary | Existing Resources4/4, DST-safe today/future controls; actual total28.52h/12rows→23.27h/8rows, current/historical kept and future days excluded after F5 |

| PR-UI-033 / observed / P2 | PR-05: no-match recovery | WorkItems global/project-fixed, browser and terminal | Both Clear filters links inherited the active text/project filter and kept zero results | pr05-clear-filters-before/global-after/fixed-after.txt | BOSS WorkItems | Explicitly empty active find, page and saved-find URL parameters while preserving smart list and fixed project | Existing WorkItems10/10; actual global reset47rows and fixed PRPLAN02 reset5rows, correct context retained |

| PR-UI-035 / observed / P2 | PR-01: personal progress | Projects Home, manager browser | Header My open9 disagreed with progress5done/17open; direct aggregation included nonproject/ended or otherwise out-of-context assignments | pr01-home-progress-before/after.txt; WorkProjectHub before/after | Mantle Home counters and BOSS context | Count recent Complete/Closed work on the same current/visible/non-template project assignment base, consume both counters in BOSS | Owner7/7 and consumer3/3; actual header9/progress2done9open after restart; unavailable counters keep progress absent |

| PR-UI-036 / observed / P2 | PR-23/24: saved flags | Material project Client access, then Time policy | Checking repository sharing from initialN showed Settings saved but revertedN; merged form model retained non-optionN alongside selectedY | code-shared-tui-checks.txt; pr24-client-code-readonly.jpg; pr23-time-policy-restored.txt | Framework QVT generator | Filter initial check arrays to actual option keys, matching existing standalone/static renderers | Exact generator1/1 and mounted form1/1 pass; actual sharingN→Y/reload/read-onlyclientrepo→N/directdenial, second TimepolicyY→N→Y and validweekdaymulti preserved; framework8c558b44 |

| PR-UI-037 / observed / P2 | PR-23: static work-type actions | Material Settings/Time, John ADMIN, light1920×1080 | Every Offer/Stop offering action was disabled although other authorized controls and native terminal actions worked; nested section links lacked row availability keys | pr23-time-policy-before.txt; pr037-focused-results.md; pr037-time-consumer.jpg; pr037-time-restored.jpg | Framework server-static row projection | Traverse supported containers and action-free sections with native conditions and original assembled identities; preserve denied rows and fail-closed unsupported action scopes | Existing exact control failed before, then statics38/38 and core Clippy pass; actual General Office Offer→reload9→QuickTime choice→Stop→reload8; sibling merged WorkItemTypes Research→QuickCreate→restore6 passes; framework89391fd2; both full gates and closing lint pass; final record below |

### Static leads

Reproduce each lead in an authorized batch, then allocate a finding or close the lead with the reason. These do not
assert new runtime failures. Historical finding identifiers remain historical references.

| Lead | Source | Activity | Investigation / priority |
| --- | --- | --- | --- |
| Client request file audience | impl-projects F156/F159; `service/ironstone/shared/RecordFilesServices.xml` and `ChatterServices.xml` | PR-11, 24–25 | Closed as PR-UI-001: actual staff/client listing and direct-download bytes reproduced the privacy defect, followed by scoped correction and paired live denial/public-file success; cross-client checks pass |
| Project/child context and return | ProjectDetail's WorkItems/Backlog/Plan/Time mounts; Shared details; shell QuickCreate | PR-01, 05–08, 16, 18 | Resolved in sampled paths: PR-UI-015,019,033 correct historical person/week return, fixed-project counts and clear-filter context; actual peek→full→Back and Commons same-ID handoff preserve identity. Extra boundary variants remain in activity gaps |
| Repeated-row dialog identity | Settings WorkItemTypes `TypeIconDialog`, Labels `EditLabelDialog`, Workflows `EditStatusDialog`; repository Settings `EditRuleDialog`, `WebhookDeliveriesDialog`, `EditWebhookDialog` | PR-15, 23 | Sampled browser dialogs retain row identity in code-settings-final.json and label evidence; local webhook deliveries target the intended hook. No new duplicate-ID defect was observed; this does not claim every focus/reopen combination |
| Rich-view save and mutation parity | Backlog, Timeline, MyTime, TeamPlanner, Changes and their twins | PR-07–08, 14, 16–19 | Resolved as PR-UI-004,005,007,008,009 plus native renderer findings: bounded mounted deferred replies and actual supported mutation paths pass. Browser versus terminal evidence and unsampled variants remain distinct in activity rows |
| Financial visibility distinctions | `ironstone.projects.BillingServices`, client projections and rate views; impl-projects §4 payroll decision | PR-20–25 | Sampled boundaries pass: manager-hidden worker pay survives save, separate payroll70→71→70 readback, client Hours omits people/pay/comments and invoice outputs omit worker pay. Existing aggregate profitability policy is retained; no claim that aggregates make costs impossible to infer |
| Plain/Standard modes of rich views | `render-modes` and `html,qvt` text of Backlog, `ProjectDetail/Plan/Calendar`, Changes | PR-07–08, 14 | Closed for Backlog/Calendar by PR-UI-034: their existing notices are now reachable and observed in Standard; Timeline notice also observed. Changes plain mode remains unsupported, without claiming Standard diff presentation |
| Stale demo dates and optional Git | BossProjectsDemoData files and Time/Resource/CodeDemoServices | PR-01, 07–09, 13–22 | Resolved setup prerequisite: environment.json and retained fixture files identify the disposable runtime and dates; historical/current time windows were deliberately selected. Actual local Git clone/push/review/merge/tag/Docs operations proved capability rather than treating absent demo content as a defect |

### Bounded batch record

**Planning baseline:** current source and existing design/implementation/research records were inspected; the local
inventory, shared mounts, activities, roles and verification map were prepared. No runtime was started, no browser
or TUI activity executed, no tests run, and no product source changed. There are no review screenshots or pass claims.

**Document review:** corrected the public intake templates and token/confirmation contract, terminal merge-review
coverage, Git administrative roles, ClientHours mount, Code palette terminology and partial-coverage bookkeeping
against current source. Rechecked document links, local inventory and activity references. This was a plan-only edit:
no live UI finding IDs were allocated, no runtime was started or application tests run, and all live activity coverage
remains pending.

**Second document review:** checked the plan against current source again. Corrected the rich-view plain-mode
description (and added it as a static lead), the demo-account sources, PR-24/25 references on the ProjectDetail
Code/Time/ClientHours rows, PR-18's mount names and its Standard-path TeamTimesheet print, the duplicate
ClientBilling row, the missing Commons Tasks/Requests and Mantle WorkPlanToCashBasicFlow/CommonsToday checks, the
named partial-continuation rows and wording. Plan-only edit: no runtime, tests or finding IDs; coverage remains pending.

The proposed first execution batch is **PR-01 and PR-02**, plus setup/reproduction of the priority client-file lead.
Record actual fixture identities/permissions and measured geometry, then use those fixtures in later waves. Keep a
confirmed access defect ahead of visual refinements. A setup or reproduction attempt does not close PR-24.

For each later batch append:

- Authorized scope, PR IDs, mapped route/mode variants, coordinator/delegated ownership and prerequisites.
- Runtime/database, source/binary revisions, actual fixtures and measured environment; redacted evidence directory.
- Observations and finding IDs, before/after artifacts, decisions and owning repository for each correction.
- Focused checks and any required suite/lint results, with exact commands and failures/retests preserved separately.
- Independent review of corrected source and affected activity evidence where work was delegated; coordinator's
  integration/retest, outstanding variants and any explicitly authorized commits.
- Cleanup/restoration, stopped listeners, removed temporary credentials and intentionally retained disposable data.

**Batch 1 — execution baseline and priority corrections (2026-11-09).** Coordinator owns the runtime and this
record; three workers own planning/requests, code/settings and time/resources/billing/access. The user explicitly
authorized focused checks between reviewed local commits, full gates only at the end, and all eleven existing
Projects acceptance specs. Child agents checked CUA availability: each reported no browser surfaces, so the
coordinator owns live browser evidence; workers use isolated component fixtures, server scenarios and the actual
remote terminal client. File upload/download tools wait for user approval: those waits are not product timing evidence.

- Started from framework `33eac9d7`, BOSS `d375f61a`, Mantle `c7ba7015`; reused `target/release/moqui` maximal
  (Git, SSH, mail, PDF/print, TUI, client testing). The ignored `environment.json` records the exact revisions,
  binary identity and paths. The isolated bootstrap links tracked base/dev components individually and only
  `mr-mantle` and `mr-boss` addons; configuration is copied, mail captured, and all database/resources are disposable.
- Bootstrap: `MOQUI_RUNTIME="$PROJECTS_REVIEW_BOOTSTRAP" MOQUI_CONF=conf/MoquiLoadTestConf.xml instance_purpose=dev
  mail_capture_sends=true target/release/moqui test mr-boss --spec ProjectsHome --db fresh --keep
  --serve 127.0.0.1:8090`. Embedded Postgres required unsandboxed shared-memory access. The initial runtime was
  `/private/tmp/mt-20666-2bf86c88`; after stopping both client and server, the whole kept runtime moved to
  `/private/tmp/boss-projects-review-runtime`, outside the runner-owned namespace. Restarted with `--db existing`,
  explicit `--spec ProjectsHome --feature "a manager's Home"` and the same isolated configuration.
- Browser identities use separate hostnames (`projects-manager.localhost`, `projects-client.localhost`); measured
  DOM viewport 1920×1080, DPR 2; browser capture is JPEG 1905×1072 (recorded separately, not claimed as 1920×1080).
  Manager Home, QuickProject duplicate-key refusal with retained input and successful
  RVQUICK creation, RVWIZ draft creation/resumption and Team → Modules → Money → Review → detail were observed.
  Negative hours retained both entered budgets on refusal, then corrected values persisted (5 h, USD 500); Docs,
  Time and Money module choices and database documentation space RVWIZ appeared in Review. Clone/template, narrow,
  dark and keyboard variants remain open. Fresh remote TUI login and Home were exercised at 180×50; this is not yet
  the embedded-terminal light/dark check.
- Uploaded synthetic internal/outward attachments on `BOSS_DEMO_PREQ_ACME1`; Sheldon saw and downloaded the internal
  bytes before correction. After restart, the client lists exactly the outward file with its human-readable type;
  internal bytes are refused by the focused direct-download regression. Explicit outward types include standard
  request files, Customer Shared and Published RFQ. Unclassified and Case Summary files stay private; staff access
  is preserved. No routes or record keys changed; `get#ProjectRows`' `projectList` became optional (callers that pass
  it are unchanged).
- Focused before/after: `ProjectsHome,NewProject` reproduced two failures, then **8/8 passed**;
  `ProjectsAccess,RecordFiles` reproduced client audience leakage, then **20/20 passed**, including exact bytes,
  staff visibility, cross-client refusal, direct service projections and the Commons shared-files consumer.
  Commands use `target/release/moqui test mr-boss --spec <names> --db snapshot` with the isolated bootstrap;
  JUnit/logs and named screenshots are under ignored `plans/ui-refinement-evidence/boss-projects/`.
- Independent source review by the code/settings worker found a raw enum-label regression; corrected before commit
  and covered by the client type-label assertion. Screen lint scanned 1,276 definitions with **0 parse failures**;
  its 87 existing idiom/hazard sites are recorded in `lint-screens-current.txt`, not cleaned as unrelated work.
  Full `test-apps` and applicable `test-framework` remain pending
  until the end. The isolated runtime is intentionally retained for subsequent activities, with no production writes.

**Batch 2 — planning response ownership and intake wording.** The planning worker corrected Backlog/Timeline and
the public intake text. The code/settings worker independently reviewed the changes and requested fixes for
leave-and-return generations, newer Manufacturing input and consumed operation keys; the final diff has no
remaining blockers. Coordinator reviewed the integrated diff and registered `ProjectsPlanningResponses` as an
offline **regression** spec: it mounts actual QVue components and checks particular deferred-response bugs, not a
new journey or screen sweep. The original code failed five intended assertions; final **7/7 pass**, zero skips,
4.89 s feature time. Existing authorized acceptance `SprintWalk`, `TimelineWalk`, `ReleaseWalk`, `RequestWalk`
passed **25/25**, zero skips, on an independent fresh runtime. Evidence/JUnit is in the ignored review directory.
These results do not establish browser or embedded-terminal activity coverage. Shared Manufacturing move
preview/apply/override paths were exercised in the mounted fixture; an actual Manufacturing consumer retest is
still owed. No wire shapes, routes or service parameters changed. Full gates remain pending until the end.

Batch 1 committed in BOSS as `6d566f29` (Protect client request files and repair project entry flows).

**Batch 3 — merge-request response ownership and keyboard review.** The code/settings worker corrected the actual
Changes component and added offline **regression** `ProjectsDiffState`; the time/resources worker independently
reviewed it with no blockers. Baseline reproduced newer-comment loss and false read-only wording. Final **2/2
pass**, zero skips, 1.6 s feature time; positive unchanged acknowledgments and canceled-review behavior are included
so suppressing all responses cannot pass. Existing authorized `CodeReviewWalk` passed **6/6**, zero skips, on an
independent database; it proves service/transition outcomes, not transport or visual interaction.

The actual remote terminal created disposable repository `review-code-tui` linked to IRON and MR `100051`; a tiny
local fixture pushed main and review-code-feature over real loopback Git HTTP as Joe. Coordinator then opened the
same MR in the browser in dark mode, compared one-file/one-commit counts with displayed old/new content, tabbed from
Viewed to the visible named line-comment action, pressed Enter, typed and posted a comment, and saw the saved thread
in Unified and Side by side. Terminal reply/decision/merge continuation remains explicit. Repository browsing and
download TUI defects are separate findings under investigation, not covered by this correction. No service/API or
route changes. Full gates remain pending until the end. Batch 2 committed as `aa72afd9`.

**Batch 4 — time and staffing response ownership.** The time/resources worker corrected MyTime/TeamPlanner and
added offline **regression** specs `ProjectsTimeAsync` / `ProjectsResourcesAsync`. The planning worker independently
reviewed them, requested a decision-reason snapshot correction, and approved the final changes. Both original
component fixtures failed as intended; final **2/2 pass**, zero skips, 3.6 s feature time. Existing focused
`TimeEntries,Resources` passed **11/11**, and authorized acceptance `TimeWalk`, `ResourceWalk`, `BillingWalk`,
`MilestoneBillingWalk` passed **24/24** on independent disposable databases. These tests do not certify live approval,
staffing, billing or output activities by themselves.

Actual remote terminal work created PRTIME01 and PRTIME01-1, added Joe, saved 2 h on the Oct 12 week, retained invalid
25 h input, corrected to 2.5 h, canceled deletion and exercised worker/manager return → correction → resubmit →
approve → lock. A separate timer started and stopped once, then F5 showed exactly one 0.02 h entry and no running
timer. Coordinator used a separate browser identity for Joe, typed 1.25 h Tuesday and 2 h Wednesday, saved with
blur/Enter and verified them after reload (3.27 h total). At measured 390×844, document width remains 390, Day mode
shows the correct totals, and the Add time dialog opens/cancels without overflow. No service or route contracts
changed in this batch. Selected-week terminal return, shared row actions and manual-rate billing findings are
separate pending corrections. Full gates remain pending. Batch 3 committed as `3cfdc273`.

**Review of the committed batches (2026-11-09).** A code review of the unpushed commits found and fixed:
- key auth now falls back to anonymous when a rejected key has no conflicting session, with one lookup per request;
- a TUI save no longer fetches record headers twice;
- MyTime, TeamPlanner and Changes report failures that arrive after the view changed;
- closed projects can be reopened through `update#Project`, and the remaining manual-change paths are guarded,
  including the Overview description;
- the project invoice print screen comes from `OrgTemplateProjectInvoicePrint` instead of a hard-coded path;
- the CSV/XLSX work-item due date is a calendar date;
- one Mantle rule decides which request files a customer may see;
- client specs wait for a response to settle before checking that nothing happened;
- Mantle rules are tested in Mantle.

Follow-ups recorded rather than done:
- one shared stale-response helper for the five planning, time and code `.qvue` files, which still use three local
  patterns;
- invoice list day text mixes ISO days with formatted dates; Mantle should return the display text;
- `Changes.qvue` mounts a comment button on every diff line;
- `store#VoiceTrunk` may find no live SIP node to reload right after boot (the edge fixture waits for one).

### Completion

Mark an activity passed only with observed completion and relevant recovery outcomes. A blocked/deferred disposition
may close its work for a bounded batch, but leaves coverage unresolved and never counts as passed. A render, source
inspection or test pass alone does not prove usability. Close a wave when its mapped surfaces have outcomes,
findings are corrected and retested or explicitly deferred, and checks required for the
changes have passed. Report incomplete modes and prerequisites honestly; a bounded pass is not complete coverage
of every possible role, device and integration.

The final record includes changed behavior, route/activity coverage, resolved/outstanding findings, verification,
selected before/after evidence, compatibility decisions and cleanup. Update design/implementation records when
decided behavior changes; feed reusable patterns into the framework UI review guide and keep Projects findings here.

## 7. Decisions

- **Execution boundary:** the user authorized all 25 activities, corrections, three workers, reviewed local batch
  commits and the eleven existing Projects acceptance specs. No push or deployment is authorized by this pass.
- **Scope:** review current BOSS Projects, including Code, restricted clients and public request intake. No PASS Client
  migration, absent-feature implementation or full adjacent-app/desktop review.
- **Inventory authority:** current mounts and templates determine scope. Historical design and “Later” notes are
  reconciled separately; every current route/helper/dialog family has an activity or supporting inspection.
- **Sequence:** seven waves and PR IDs follow delivery dependencies; first batch PR-01/02 establishes the baseline,
  with early client-file lead reproduction. Cross-wave gate/release/capacity continuations remain explicit.
- **Status:** activity status lives only in §6; route/mode status in §3. Everything starts pending; existing tests and
  the Commons review provide useful context, not a Projects pass. Partial execution is `exercised` with outcome
  `partial` and named continuations; blocked/deferred coverage remains unresolved, never passed.
- **Modes:** Material `/qapps` is the visual target. Standard gets brief functional or intentional fallback checks;
  terminal operations and limitations are inspected separately. Record actual viewport and zoom capability.
- **Shared causes:** fix in the owning BOSS/Mantle/framework layer and retest a representative consumer; particularly
  preserve Manufacturing's use of the Projects timeline.
- **Verification:** focused checks before batch commits; full application and applicable framework gates at the
  end, as explicitly directed by the user. Preserve acceptance-run rules, budgets and the ban on duplicate sweeps
  and screenshot suites. If an acceptance spec changes, run it immediately and its component's suite at the end.
- **Fixtures:** isolated Mantle+BOSS runtime, local mail/Git and disposable records; no PASS dependency for existing
  client/token routes. Prepare only missing narrow roles; credentials and tokens never enter the record.
- **Browser automation gap:** Projects has server scenario coverage but no browser walk or dedicated client fixture.
  Select any new automation and its suite during the relevant implementation batch, not as unsolicited plan work.

### Open at execution setup

- **Measured browser/terminal capabilities:** try the target dimensions, real zoom and independent identities and
  record what the available tools actually provide. Preferred course: retain those targets and leave unsupported
  variants explicit, rather than redefining a requested size as a measured result.
- **Fixture bootstrap and optional dependencies:** choose the existing suitable binary, isolated demo bootstrap and
  narrowly missing fixture roles; verify local Git/SMTP/PDF/SSH before their waves. Preferred course: reuse demo data
  and local resources; name a new fixture's suite only if existing setup cannot support a required activity.
- **Execution/check cadence (resolved):** the user explicitly directed local/focused checks during batches and
  `test-apps` / applicable `test-framework` only at the end. Keep pending full-suite verification visible in batch notes.

**Batch 5 — historical time return and Mantle financial rules.** Batch 4 committed in BOSS as `d0952cde`.
Mantle actual-rate correction committed separately as `df7c770e`; focused standalone Mantle checks preserve explicit
zero, referenced fallback and deletion. The unrelated grouped-invoice defect remains a separately reviewed batch.
TimeEntries' fixed return destination carries optional MyTime person/week context without accepting an arbitrary
return URL. Independent planning review cleared the correction. Existing TimeEntries regression passes 7/7;
actual debug terminal member and manager edits retain Oct 19 and Joe after Save and F5, while global/project
returns remain their existing destinations. The shared TUI debug build is now serving the retained disposable
runtime on 8090; release binary remains unchanged. Full application/framework gates remain pending at the end.

**Batch 6 — project-scoped work counters and import review.** The coordinator observed global pill totals beside
one project-filtered row. The planning worker reproduced this in the existing WorkItems service spec, moved only
fixed project scope into the shared base, and preserved smart counts' independence from ordinary find fields.
The code/settings worker independently cleared the two-file correction. WorkItems passed9/9 after failing before;
RequestWalk passed6/6. Coordinator also removed the remaining unconditional email promise from public form intro;
planning review cleared this wording and the conditional success text. Browser work import into RVQUICK mapped
7fields, previewed2valid hierarchy rows and1missing-title failure, created RVQUICK-4/5 withparent/label and3h
rollup, then previewed repeat0create/2skip/1fail. Actual repeat result captured separately. This synthetic genericCSV
proves no vendor-export compatibility. Historical-week batch committed BOSS `05f1fce7`. Full gates pending.

**Batch 7 — grouped manual-rate billing and time import.** Mantle `0a4e1a4d` links only actual rated contributors
in each worker/all aggregate, including explicit zero and piece rates. An unrated piece-only control remains unbilled.
Coordinator found and requested that extra guard during review; planning independently reviewed the refined patch.
Standalone Mantle checks passed9/9. Live narrow-manager PRTIME02 control:1.25h at manual150 produced invoice100102
for187.50 with one source entry100104; fresh Money showed zero ready/unbilled after creation. Original broken
invoice100051 was preserved for evidence. No duplicate invoice was created. Existing invoice retry/removal/cancel
contracts are regression-tested. Actuals for the same control were exactly187.50.

Browser time import preview identified the ignored External key column and actual duplicate identity (person/item/start),
created2entries totaling2h and identified25h row refusal. Repeat preview0create/2skip/1fail and final warnings matched.
The fixture is synthetic, not proof of vendor export compatibility. All eleven named Projects acceptance specs have
passed (planning25, code6, time/billing24, static/TUI8 features), independently of these manual outcomes.
User explicitly deferred real200%/otherzoom tests and directed internal-browser-only review. Native desktop automation
was unavailable; it contributes no coverage. Invoice approval/send continuation awaits specific authorization after
automatic approval review rejected a combined approval/send action as potentially sending a financial document.
Full suites remain pending until review completion.

Project counter live retest after normal restart passed: RVQUICK Open3/All4/Done1, matching its four persisted
records and one completed recurrence original. Status contrast live composited measurements after correction:
dark Planned4.63:1 / UI5.41:1; light Planned5.24:1 / UI4.84:1. Shared webroot correction committed as `87c3cd7c`;
existing ThemeLayout feature passed immediately after the edit, and full webroot acceptance remains due at final gate.
Constrained-tab geometry measured1280×720/DPR2/scrollWidth1280; screenshots record measured geometry, not the
requested outer800height. User approved synthetic locally captured financial-document tests, resolving that earlier
approval block. Isolated listeners after restart: HTTP127.0.0.1:8090, SSH127.0.0.1:2222, SMTP127.0.0.1:19926.
Only the disposable runtime received14 additional mail/commercial/client fixtures; no production configuration changed.

**Batch 8 — shared terminal integration, real Git and local mail.** Framework terminal fixes committed `9ff43d2e`
after27focused checks, two independent source reviews and live repository/raw-byte, current-row staffing/End/MR,
canonical Calendar/request/Docs/Changes and immediate parent-header reruns. Explicit print mode delegates to browser
without adding tui; actual Time-report action now preserves filters and avoids the mixed-mode404. Embedded browser
terminal navigated Ctrl+K → Projects → Enter, then F5 retained Projects Home in light and dark. Its initial missing
xterm assets were a review-fixture static-path issue; materializing webroot assets in the isolated runtime resolved it.
No manual mail endpoint remains in repository source. The localhost ADMIN-only read hook lives solely in the copied
runtime webroot and will be removed at cleanup. New files in a component symlink must never be assumed isolated.

Real merge `d029b46509db54c1fa71b36aedaf0395c92d2ccc` preserves main's Docs `dd1d88b99b` and feature's value2.
The code/settings worker independently proved the resulting Git parents/content. Conflict-free wording no longer
implies approval eligibility: BOSS `54006f92` changes only the displayed label and extends the existing focused
MergeRequests assertion (6/6pass, peer review clear, live0of1/No merge conflicts). Temporary SSH read/push succeeded,
then key removal made the same operation fail. Token-session followup remains a separate confirmed correction.

Local SMTP accepted synthetic requests100022/100024; confirmation-off browser100023 and internal note emitted0
messages. Enabled SMTP100024 and browser100025 each emitted captured acknowledgments. A protocol follow-up using
that Message-ID joined request100024's existing thread. Browser staff explicitly sent100022's outward reply using
only the new capture account; the capture contained its exact text and no internal-only marker. TUI and browser
Chatter show Received/Note/Sent as distinct entries. Captured envelopes/bodies and threading evidence are retained
redacted; nothing was externally delivered. ConfirmationN and PRPLAN01 public-formoff were restored. Full gates pending.

**Batch 9 — scoped invoice delivery.** Mantle `2c6a26e0` adds an optional projectBilling output mode, checked by
existing side-editor/visible-linked-project/organization rules before replay and rendering. Default generic finance
read authority remains intact. Coordinator security review identified arbitrary custom rendering as an extra boundary:
project mode now rejects caller templates and accepts a custom XML print screen only when it equals the trusted
OrgTemplateProjectInvoicePrint configuration. BOSS seeds its existing print screen and passes the flag only after its
own invoice-change check. Code/settings independently reviewed the hardened patch. Existing Billing checks6/6 pass,
including generic-read, hidden-project, member/client and unregistered-template refusals, unchanged state on refusal,
issued immutable PDF and one captured synthetic-recipient email; native AccountingDelivery12/12 pass. Actual narrow
manager retry after normal restart reaches Sent, with a truthful queued-in-Outbox message because this review's
SYSTEM SMTP host is initially absent. Queued is not externally delivered or captured; local Outbox continuation is
separate fixture work. No broad invoice grant, artifact-authority bypass or payment action was added.

Commercial/client continuation: synthetic client selected through the normal chooser after its fixture owner was
corrected; client sign-in enabled only on PRTIME02. Estimate revision1 refused after empty-reason validation, reason
visible to manager, revision2 approved by the separate client. Linked order PRTIME_ORDER02 advanced to Approved.
A distinct delivery milestone PRTIME02-MS-2 with25% of1000 stayed awaiting approval with no Invoice action, then client
approval made it due; actual invoicing produced draft100153250 and marked the share billed, with its order/line links.
The original defective invoice100051 remains evidence. No duplicate milestone invoice or payment was attempted.

Shared timeline second-consumer continuation: a narrow released Manufacturing control was prepared in the disposable
runtime. Its initial03:00–05:00 local placement showed an outside-work-hours conflict. Browser Move→09:00→Preview
showed09:00–11:00/No conflict; Apply and reload retained exactly those times and zero conflicts. This is actual
resource-mode mutation evidence (pr08-manufacturing-move-after.jpg), distinct from the deferred-response checks.


**Batch 10 — Closed project manual-write boundary.** A live Closed task accepted priority5→6 before correction;
its priority was restored. Mantle now checks the source and requested destination project before manual task,
planning, member, content and recurrence mutations. Label/association changes preflight all affected records before
writing; derived rollups, time, late billing, Complete-project editing and cloning a Closed source remain supported.
BOSS projects this owner rule into editor controls and keeps Re-open available to managers. Coordinator and the
time/billing worker independently reviewed the final patch, including target-milestone and quick-add context guards.
Focused owner11/11, BOSS18/18 and compatibility28/28 checks passed. Actual terminal Closed task update returns
PROJECT_CLOSED, WorkItems shows neither quick-add nor New work item, Settings explains read-only state, and Re-open
restores Edit with priority5 unchanged. An unrelated empty project was deleted through its normal confirmation and
its direct URL became unavailable. Full suites remain pending at the user-directed final phase.


**Batch 11 — invoice calendar days.** Mantle `06141ca9` exposes batched stored accounting DATE values for
already authorized invoice IDs. BOSS uses them for project invoice labels, print/detail and date finds, without
rewriting numeric timestamp output, history, generic finance projections or the existing overdue policy. A single
due-schedule date supplies the due day; multiple/no-schedule legacy records retain their old fallback. Coordinator,
planning and time/billing reviews cleared the helper and final filter. The new bounded service regression failed
before, then passed in Berlin and Chicago, including a Nov9→10 find and missing/multiple/legacy helper controls;
combined Billing checks7/7 passed. Actual browser and current downloaded one-page PDF show Nov9 and Dec9 for
invoice100102, with187.50 total and no employee pay. PDF rendering was visually inspected, with no clipping. The
older immutable issued artifact was preserved. Fresh milestone100153 captured Invoice-100153.pdf locally; its
no-schedule due fallback still includes time and is not claimed as canonical single-schedule coverage. Full gates pending.


**Batch 12 — readable terminal staffing weeks.** TeamPlanner's field titles were authored only on conditional
variants, so the terminal table displayed W0–W5 rather than actual dates. Titles now live on default fields and
unused week columns are hidden. Coordinator and planning peer reviews cleared the two-file correction. The existing
Resources render was extended in place, failed before and passed4/4 afterward; actual terminal two-week headers
show their dates. No extra render journey or regression budget increase was added. Full gates pending.


**Batch 13 — terminal browser handoff and one-time credentials.** Framework `8f050b61` retains remote-session
cookies only in memory while revalidating the explicit device/login key and matching session identity before CSRF
continuity. Revoked, mismatched and expired keys do not gain authority from a cookie; cookie-only browser behavior
remains unchanged. Existing focused auth/host controls and live one-time token read/push passed, followed by revocation
and denial of the same Git operation. Temporary SSH and token rows were removed, and local device keys were forgotten.
Framework `eb5fdee3` carries authored GET browser targets through normal/menu/row links; write actions retain native
confirmation. The BOSS file Download links now use terminal attachment handling while Raw retains its browser target.
Paired actual Download/Raw and existing Code8/8 pass; shell14/14, agent11/11 and core metadata controls pass.
Source corrections received independent review. Full gates pending.


**Batch 14 — truthful webhook delivery and financial mail evidence.** Framework `6e715048` reports the persisted
SystemMessage result, not the wrapper call's normal return. A local HTTP503 previously showed delivered=true while
its delivery row was retrying; the extended existing signed/retry regression reproduced the failure then passed0.46s.
Coordinator independently reviewed the two-file fix. Actual debug200 and503 tests now show Delivered200 and failed
HTTP503 respectively. Both local payloads had event ping, the intended repository and valid HMAC. The two explicitly
authorized hooks were deleted, receiver stopped and the temporary private-network exception restored/reloaded.
No external service was contacted.

The isolated SYSTEM mail fixture now has a loopback SMTP configuration while capture remains enabled. Three known
Ready messages were selected through normal Data Find using exact synthetic subjects/recipient and empty CC/BCC;
each was retried individually through normal Service Run and became Sent. Browser-cookie read-only capture proved
the invoice100102 and both estimate revisions, all to prtime.client@example.invalid, with no attachments on those
older queued messages. Fresh milestone100153 separately captured Invoice-100153.pdf. Actual estimate HTML, generated
PDF layout and issued-file presence were inspected; queued, captured, current-generated and immutable-issued
artifacts remain distinct evidence. No queue-wide replay, external delivery or payment occurred.


**Batch 15 — keep the time print date range.** The final actual TimeEntries Print action emitted a malformed
end-date value because the exclusive upper bound was a JS Date, not a numeric host timestamp. The BOSS adapter
now uses getTime for that value and retains the native timestamp fallback. The same existing TimeEntries render
assertion reproduces the defect and passes7/7 after correction; coordinator independently reviewed the two-file patch.
After normal artifact-cache reload, the actual terminal emits Oct12–18 and Joe. Browser TeamTimesheet shows the
matching corrected PRTIME01-1 entry08:00–10:30,2.5h, by-person total2.5 and overall2.5, with readable aligned columns.
No extra journey, render sweep or budget increase was added. Full suites remain pending.


**Batch 16 — work-item export values.** Actual WorkItems CSV omitted title, status and priority despite visible
columns. BOSS now supplies scalar Type/Status/Priority/Due values in CSV/XLSX and marks the title link as an anchor,
leaving its normal destination intact. Shared escaping/formula protection and saved column preferences remain in use.
Coordinator independently reviewed the two-file correction. The existing WorkItems feature adds one bounded CSV
serialization control with a quoted/comma title; before9/10 and after10/10,3.9s feature time. Actual paired CSV/XLSX
downloads of the same PRPLAN02 find parsed five rows with populated title/status/priority, no raw enum or duplicate
editable values, and hidden Type respected. Export intentionally covers the full find rather than selected rows.
Full suites remain pending until the remaining final recovery checks are closed.


**Batch 17 — conditional terminal row actions.** Framework `a90af8c3` captures the existing native section render
as a JSON value for a terminal cell, preserving its condition, action frame, fail branch and security error. Captured
body output is removed before return, including on failure. Coordinator independently reviewed all five files. The
existing two-row macro control failed before and passes0.06s with row-specific actions, no context leak, inline
failure and an intact following cell. Actual WorkItemTypes Research Offer/Stop appeared in the correct row and its
QuickCreate consumer; Time General Office Offer/Stop likewise appeared/disappeared in QuickTime. Icon and all
preferences were restored. No app-specific workaround or regression sweep was introduced. Full gates pending.

**Batch 18 — reachable Standard notices.** Actual Standard Timeline displayed its authored browser notice, while
Backlog returned404 before reaching an equivalent existing notice. Backlog and project Calendar now allow html/qvt
so those existing fallback messages can render. Code/settings independently reviewed the two attribute edits. XML
parse and actual Standard Backlog and project Calendar notices pass after the normal restart; Material/terminal
paths and services are unchanged. Changes has no authored plain fallback and remains an explicit unsupported mode,
not a claim of full Standard diff presentation. No implementation-mirroring test was added for these two declarations.


**Batch 19 — bounded recent-person time.** PersonDetail's last-four-weeks projection included future entries
because only its lower bound was supplied. It now ends at the next viewer-local day boundary, keeping all of today
and the original rolling lower bound. Coordinator independently reviewed the two-file correction and requested a
DST-safe test fixture; the same existing Person Time render uses today's final second and a future calendar-day
control, with no extra render. Resources failed before then passed4/4. Actual narrow-manager Joe Time fell from
28.52h/12rows to23.27h/8rows: current-day0.02 and historical0.25 remained, Nov10/11/16 entries disappeared, and F5
retained the result. No entries were rewritten. Full suites remain pending.


**Batch 20 — effective no-match reset.** Actual browser and native Clear filters kept the same no-match text.
Shared URL construction intentionally inherits declared destination parameters, so the owning WorkItems reset now
explicitly empties active find/page/saved-find values and retains the smart list and fixed project context. Null is
not used because the existing URL API ignores it. Coordinator independently reviewed the two-file patch. The two
existing global/fixed QVT renders reproduce the failure and pass10/10 after correction, with no new QVT render.
Actual browser global reset drops text/project and restores47matching rows; embedded PRPLAN02 reset drops text and
retains only its fixed project/list, restoring5matching rows. Shared URL semantics and unrelated consumers are intact.
Full suites remain pending at the final phase.


**Batch 21 — consistent personal Home progress.** The browser showed9 personal open project items beside a
progress block with17open/5done. Mantle now counts recent Complete/Closed items with the same current assignment,
visible non-template project scope as its existing open counter; completion dates are bounded from seven days ago
through now. BOSS consumes those two nonnull counters and removes its separate unscoped assignment query. Coordinator
independently reviewed the four-file owner/consumer patch. Existing WorkProjectHub controls cover current versus
ended/nonproject/hidden/template and old/future completion;7/7 pass. Existing Home renders assert the shared counter
contract;3/3 pass. After the required normal service reload/restart, actual Home shows9open in both places and2recent
done. Failed counters still leave progress absent and unrelated Home parts usable. Full gates pending at the end.


**Batch 22 — save checkbox flags correctly.** Framework `8c558b44` removes initial values that are not options
from merged QVT checkbox arrays, matching its existing standalone/static paths. Previously initialN plus selectedY
submitted both values and a scalar flag savedN. Coordinator independently reviewed all five files, including only
expected golden changes. Exact generator1/1 and mounted m-check/m-form feature1/1 pass; all-checked, validmulti,
scalarY and unchecked absence are covered. Actual Material ACME sharing now savesY through reload; Sheldon reads
acme-portal's README without administrative/write controls. RestoringN makes that same direct repository URL
unavailable. A second Time-policy consumer savesY→N→Y through reload and preserves weekdays1–5; original values
were restored. The full debug client spec had34functional passes but failed its15s budget at23.14s; no baseline
cause or full-gate pass is claimed and no budget was raised. Final release gates will determine its disposition.

**Batch 23 — the same reset contract in time and billing.** The WorkItems reset cause also reproduced in actual
project Time and was identical in Invoices/Rates/Unbilled: omitted find keys are inherited by normal screen URLs.
Four owning reset maps now explicitly empty active keys, preserving list, fixed project or Rates purpose. Coordinator
review cleared the six-file followup; all assertions extend existing renders. Before controls failed as intended;
TimeEntries7/7 and Billing6/6 pass together after correction. Actual project Time reset removes dates/person while
retaining PRTIME01/listall; actual Invoice reset removes project/kind/date and restores4rows from the filtered2.
Column/view preferences and shared URL behavior remain intact. Full suites remain pending until the final phase.


**Final manual coverage reconciliation.** All25 activities have observed primary paths and the named PR-04/07/09/20
continuations are closed. This does not mark every recovery/mode variant passed: the activity rows identify their
remaining gaps. Internal-browser geometry measured1920×1080/DPR2,1280×720/DPR2 and390×844; requested outer geometry
and actual geometry remain distinct. Real zoom and further constrained variants remain deferred under the user's
internal-browser direction. External CAPTCHA/CI providers, absent category/source-archive controls and a historical
PersonCapacity selector were not invented or claimed. Mounted asynchronous controls remain separate evidence from
actual live browser/terminal mutation.

The final browser continuations changed board grouping to Assignee (same four RVQUICK records), selected its card
for peek, opened full detail and returned to the same find/peek identity. Status grouping/List/peekoff were restored.
RVQUICK-4's Type→Bug Fix, Assignee→Joe and added Docs label persisted through reload; Commons TaskDetail showed the
same ID/type/project, John Owner and Joe Assignee. Owner has no offered edit control and is not conflated with Assignee.
Actual sprint print reconciled committed1h/added2h/completed0h/carried3h across2items; both standalone and project-fixed grouped time
print retained Joe/Oct12–18/2.5h.

**Final verification started (pre-PR-UI-037 snapshot).** Source corrections through PR-UI-036 were locally committed
in their owning repositories. The maximal release build passed in4m48s; cargo lint and cargo lint-min passed. Only
then the deferred full gates began: application451specs/4workers, followed by framework and the required full webroot
acceptance. Completed results and the later renderer followup are recorded below. No regression budget has been raised.

**Cleanup checkpoint.** The isolated review HTTP/SSH/SMTP and webhook listeners are stopped. A temporary maintenance
component (inside the real owned runtime component directory, never through a source symlink) ended27 active issued
login keys and removed the review-only ACME HoursY and repository-sharingN overrides; its focused postconditions
proved zero active keys/overrides. The maintenance component and localhost ADMIN-only mail hook were removed after
logging counts only. Temporary Git tokens/SSH keys were revoked; child workers report SSH files removed and their
known local TUI key files absent. Exact earlier SSH basenames were not retained, so no independent path recheck is
claimed. Public forms/confirmation and global policies are restored, webhook configuration matches its backup, John
is back in light mode, board preferences and viewport override are reset. The disposable database/Git fixtures and
redacted ignored evidence remain available for inspection. No push was performed.


**Application gate — passed, pre-PR-UI-037 snapshot.** `CARGO_BUILD_JOBS=4 ./moq test-apps --nobuild` completed successfully on
that release binary. Server3420/3420 features across451specs passed with zero skipped in221.16s wall. Serial
feature time: Mantle388.2/393s, BOSS234.9/264s, Marble0.1/5s and PASS15.6/20s. Client30/30 features across16specs
passed with zero skipped in140.36s including served fixtures. BOSS client65.1s exceeds its57s target but remains
within the existing1.5× gate tolerance (85.5s); the runner reported an advisory and exited0. No budget was raised,
and no duplicate journey was added to eliminate the warning. This run predates PR-UI-037; final gates will be repeated
on the rebuilt release containing that correction.

Local source commits before this evidence-only checkpoint (oldest first; no pushes):

- Framework: `87c3cd7c`, `9ff43d2e`, `8f050b61`, `eb5fdee3`, `6e715048`, `a90af8c3`, `8c558b44`.

- BOSS: `6d566f29`, `aa72afd9`, `3cfdc273`, `d0952cde`, `05f1fce7`, `2ea31374`, `54006f92`, `6d100070`, `a98780db`, `5bc1663c`, `1cc74657`, `8ff471bd`, `3118b5f2`, `902eeb87`, `eb2d5450`, `43dd06d7`, `8c2d1dda`, `e94ba9cb`, `55abe0e4`.

- Mantle: `df7c770e`, `0a4e1a4d`, `2c6a26e0`, `06141ca9`, `ffddc349`, `25fcdaa2`.

**Final-gate correction — generated expectations.** The initial framework gate failed exactly two Core tests:
`golden_tui` and `the_qvt_fixture_screens_become_templates_that_compile`. Their expected outputs had not been updated
with the already-tested PR-UI-026 metadata slot and PR-UI-036 checkbox fixture. Independent inspection confirmed
only eight indentation-only generated blank lines in three TUI outputs and the three authored checkbox models/widgets
in the static fields fixture. Commit `3979b0d6` synchronizes those four generated expectations; both exact test
families pass without UPDATE_GOLDEN. No production behavior, assertions or budgets changed in this correction.
The initial framework run otherwise passed shell orchestration, server420/420, demo10/10, offline webroot418/418,
offline dev-aide48/48 and served149/149 features. Its failed Cargo gate remains recorded as failed, not relabeled.

**Requested acceptance — passed.** All eleven named Projects specs passed,63/63 features with zero skips:
SprintWalk5, TimelineWalk8, ReleaseWalk6, RequestWalk6, CodeReviewWalk6, TimeWalk6, ResourceWalk4, BillingWalk6,
MilestoneBillingWalk8, ProjectsServerStatic and ProjectsTui8 combined. Their retained JUnit is indexed in
`final-acceptance-index.json`. The final release support repeat passed8/8 in44.81s. The required full webroot
acceptance, following the earlier ThemeLayout acceptance change, passed3/3 in5.50s. No BOSS acceptance spec changed.

**Batch 24 — static nested-row availability.** Final browser audit exposed PR-UI-037 after the initial full gates
had started: Time settings' authorized Offer/Stop controls remained disabled in server-static QVT while their native
terminal equivalents worked. Framework `89391fd2` projects controls through supported containers and action-free
sections, preserving assembled ancestry, native conditions, denied rows and transition authority. Sections needing
new action scopes, nested forms and iterations remain fail-closed. Coordinator and time/billing peer independently
reviewed the correction. The existing exact feature failed before on its missing template key, then all38 existing
statics tests passed; core Clippy and the debug build passed. Actual General Office Offer→reload9→QuickTime choice
and Stop→reload8 pass. Sibling merged WorkItemTypes Research→QuickCreate choice→restore6 also passes; this is a
separate merged-renderer consumer, not a claim of a second affected static screen. Both original configurations were
restored, all remaining browser tabs closed, and the restarted review listeners stopped. No new TUI keys were created.
A second incremental maximal release build and both full regression gates are pending for this final source revision.

**Post-PR-UI-037 release and application gate — passed.** The incremental maximal release build passed in3m47s,
SHA256 `a9e5c6b54df3a4a9ae6f2ca03d37c499998fbe01b9b2fabccd6e370a7a83af16`. The first repeat could not start
embedded PostgreSQL because the sandbox denied shmget; no test features ran. The same authorized command with the
required local process permissions passed: server3420/3420 across451specs, zero skips,197.07s wall; Mantle370.9/393s,
BOSS223.5/264s, Marble0.1/5s and PASS14.7/20s serial feature time. Client30/30 across16specs passed with zero skips
in125.94s including fixtures. BOSS client64.7/57s is an advisory within the existing85.5s hard tolerance; no limit
was raised. The final rebuilt ProjectsServerStatic/ProjectsTui repeat passed8/8 in45.09s, and full webroot acceptance
passed3/3 in4.75s. Logs and selected eleven-spec/63-feature JUnit index are retained under ignored evidence.

**Second framework run — test-isolation followup.** Both previously stale renderer expectations now pass, but two
unchanged script-runtime memory checks failed: an exact process-global fragmentation count and a cache-stress
same-runtime assertion subject to the independent timed fragmentation policy. The focused five-test memory namespace
passes in1.24s; the parallel full Core run took52.84s. Source inspection is consistent with cross-test global-counter
interference and a wall-clock policy crossing; the fixture assumptions need isolation from those independent effects. The correction is being reviewed
as test-only isolation: retain the cache identity/20MiB checks, pressure/OOM handling and own fresh-runtime markers;
make production fragmentation policy unchanged. This second Cargo gate is still failed pending that correction
and the complete final rerun. No failure is called pre-existing merely because its source was unchanged.

**Final-gate followups — reviewed and committed.** Framework `9a5111da` makes the cache-stress fixture independent
of the separately tested timed-fragmentation heuristic through a thread-local, RAII-restored cfg(test) guard. Its
same-runtime and20MiB bounds remain intact; pressure/OOM relief still runs. The fragmentation fixture accepts an
increase in its process-global counter while retaining its own450survivors, discarded marker, fresh-runtime and
reserved-memory assertions. Coordinator and time/billing peer reviews cleared the20-line test-only addition.
Default-parallel full Core1636/1636 passed with4existing ignored,52.81s; the focused five-memory-test namespace
passed1.21s and core all-target Clippy passed. The extra loopback permission failure in an earlier local focused
attempt is retained separately; it is not represented as a functional pass.

The second framework run's offline webroot phase had418/418 functional passes but failed the unchanged15s spec
limit: WebrootVue.qvt15.22s. Framework `2bc33063` moves its existing longer routed-shell keyboard/focus/theme journey
into existing ThemeLayout acceptance, with every action/assertion unchanged and exactly one copy. Planning peer
independently compared the moved block. Focused regression33/33 passes,11.3s feature time/12.02s wall; the modified
acceptance test and full webroot acceptance component pass4/4 in7.81s. No budget, timeout or production behavior was
changed. These two followups affect tests only, so the reviewed release executable and successful application gate
remain applicable. The complete framework gate and both final lint aliases are now running on the closing source.

**Closing framework integration followup.** Core1675/1675 passed with4existing ignored, and the generated/memory
corrections passed in the workspace configuration. All non-Cargo phases passed: framework420, demo10, offline
webroot417 (the one keyboard journey now lives in acceptance), offline dev-aide48 and served149, all with zero
feature skips. The only Cargo failure was the isolated all-in-one SIP integration: its fake trunk received no
REGISTER. The same compiled all-features case passed alone in10.95s. Source inspection found latent fixture
readiness windows: a bound child socket does not await its asynchronous live SipNode registration, and the linked
local row keeper is likewise asynchronous; trunk reloads target only live rows. The original panic does not identify
which of its two trunks missed registration, so no exact failed branch is claimed. A bounded fixture-only wait for
the native VoiceStatus live row in each database is being independently reviewed. Production SIP code, scenario
assertions and the5s REGISTER deadline remain unchanged. This Cargo run remains failed pending correction/recheck.

**SIP fixture followup — committed.** Framework `40a55d36` adds only16 lines in the existing integration fixture:
wait up to5s for the real VoiceStatus live SipNode row on the child and linked local database before their respective
trunk stores. Coordinator and time/billing peer reviews confirmed the exact engine identity and output contract.
The real focused case passes1/1 in10.48s; host integration-target Clippy and diff checks pass. No production SIP
policy, existing deadline, assertion, regression budget or release executable changed. The complete framework gate
and final lint aliases are being repeated after this test-only correction.

**Retained disposable MR state.** MR100051 remains merged. The separate MR100102 remains Open after its exercised
Draft/Ready/Close/Reopen sequence. Automatic approval review rejected an additional optional cleanup re-close before
execution; no retry was made. Its detailed rejection reason was not retained, so no reason is invented here. The
restored Open state and disposable repository/database are retained as review fixtures, with access credentials revoked.


**Final verification — passed.** The closing `CARGO_BUILD_JOBS=4 ./moq test-framework --nobuild` completed with every
phase successful: Cargo workspace (including Core1675 passed/4existing ignored and host integration175 passed/23existing
ignored), shell orchestration342/342, framework server420/420 across66specs, demo10/10, offline webroot417/417 across20specs,
offline dev-aide48/48 and served framework149/149 across9specs. All JavaScript feature phases have zero skips.
The corrected SIP case passed inside the complete workspace run. Existing optional Rust ignores remain unchanged;
no new ignore, budget or timeout increase was introduced. The offline webroot serial feature time is42.0/44s and
no regression spec exceeds15s. Framework12.5/12s, tools3.2/3s and dev-aide37.6/30s retain component advisories within
the existing1.5× gate tolerance. Both final `cargo lint` (17.13s) and `cargo lint-min` (8.20s) passed.

Together with the post-PR-UI-037 application3420server+30client pass, the eleven requested Projects acceptance
specs63/63 and final full webroot acceptance4/4, all required final verification is complete. Earlier failed runs,
focused corrections and differing pre/post-change counts remain explicit above and in retained logs. The release
SHA is unchanged after the three test-only followups; its last production revision is89391fd2. The closing framework
head is40a55d36; Mantle25fcdaa2; BOSS production changes end at55abe0e4, followed by review-record commits.

**Final coverage and cleanup.** All25 activity primary paths and the four named continuations are reconciled;
all37 findings are corrected, independently reviewed and committed in their owning repositories. This is a bounded
review, with the recovery/mode gaps in each activity row retained. Real browser zoom/further constrained manual
variants remain deferred by the user; unavailable external providers, absent controls and other unsampled variants
remain unverified. No unsupported variant is promoted to passed by a test result.

A final lsof check finds no review HTTP8090/SSH2222/SMTP19926/webhook62867 listener. The mail hook and temporary
maintenance component remain absent, and the copied runtime configuration exactly matches its pre-webhook backup.
The previously verified27 issued-key revocations, Git-token/SSH-key removal and restored policies/preferences stand;
no new TUI key was created in the last browser rerun. All review browser tabs are closed. The disposable database,
Git fixtures (including the documented Open MR100102) and ignored evidence remain for inspection. No source
repository was pushed. The only pending operation is the user's eventual push, outside this execution scope.
