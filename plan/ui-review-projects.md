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

**Execution: planning only.** The inventory and activity plan come from source inspection. All live screen and
activity coverage starts **pending**. No browser walk, application correction, test run, commit or deployment is
recorded by this task. Earlier Projects implementation results and the Commons pass do not establish this pass's
coverage or transfer its execution permissions.

### Inputs and reference patterns

- [Projects design](design-projects.md), [implementation](impl-projects.md) and [research](research-projects.md):
  intended workflows, delivered phases, findings and historical deferrals.
- [Prior UI review](ui-review-drawers-commons.md), [framework UI review guide](../../../../docs/dev/UI-Review.md)
  and [framework review](../../../../plans/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md) and [Commons design](design-drawers-commons.md): archetypes, shared records,
  calendar, knowledge, Chatter, approvals, files and shell contracts.
- Current `screen/Projects.xml`, `screen/Projects/`, mounted `screen/Shared/` and `screen/Commons/` screens,
  `screen/RequestIntake.xml` and its `.qvue` / `.tui.json` templates, `MoquiConf.xml`, `data/BossSetupData.xml`,
  `data/BossUsersDemoData.xml`, `data/BossProjectsDemoData*.xml` and `service/ironstone/projects/`: current mounts and capabilities take precedence
  over historical tables when deciding what can be exercised.
- [Git hosting](../../../../docs/interfaces/Git-Hosting.md), [revision management](../../../../docs/data/Revision-Management.md)
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

Follow the [review guide](../../../../docs/dev/UI-Review.md) and repository building/testing skills. Use an isolated
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
Check Git capability and fixture content before the Code wave, or earlier if using Git-backed Docs. Use disposable local repositories/remotes, controlled
CI-status data and local captured mail; no external provider or webhook delivery is inferred from a success toast.

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
prerequisites are established earlier. PR-09's tag/release continuation uses those Code fixtures; milestone billing and estimates continue in
Wave 6, and client decisions in Wave 7. PR-07's capacity interpretation is revisited with PR-19. After initial execution,
record those ledger rows with status `exercised`, outcome `partial`, and named outstanding continuations until those
are observed. Do not collapse an upstream activity's remaining work into a later activity's pass.

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
Container review includes navigation and default-child selection. Each route and mode is **pending**, evidence **—**;
split a grouped row as execution needs different outcomes. §6 is the only activity-status ledger.

### Local routes

| Route prefix / source directory | XML definitions | Activities | Coverage / evidence |
| --- | --- | --- | --- |
| root | `Projects` | PR-01, 24, 25 | pending / — |
| `Projects/` | `Home` | PR-01, 16, 24 | pending / — |
| `Projects/` | `QuickCreate`, `QuickProject` | PR-02, 06, 16 | pending / — |
| `Projects/` | `Projects`, `WorkItems`, `Requests`, `Code`, `Time`, `Resources`, `Billing`, `Reports`, `Settings` | PR-01; respective sections below | pending / — |
| `Projects/Projects/` | `List`, `NewProject`, `ProjectDetail` | PR-01–03, 24 | pending / — |
| `Projects/Projects/NewProject/` | `Start`, `Team`, `Modules`, `Money`, `Review` | PR-02 | pending / — |
| `Projects/Projects/ProjectDetail/` | `Overview`, `Team`, `Settings` | PR-03, 19, 23 | pending / — |
| `Projects/Projects/ProjectDetail/` | `Plan` | PR-08 | pending / — |
| `Projects/Projects/ProjectDetail/Plan/` | `Calendar`, `CalendarTui` | PR-08 | pending / — |
| `Projects/Projects/ProjectDetail/` | `Code`, `Files` | PR-13–14; PR-04 | pending / — |
| `Projects/Projects/ProjectDetail/` | `Money`, `ClientHours` | PR-20–21; PR-24 | pending / — |
| `Projects/Projects/` | `Roadmap`, `MilestoneDetail`, `ReleaseDetail` | PR-09, 14, 21, 24 | pending / — |
| `Projects/Projects/` | `StatusReport`, `EstimatePrint` | PR-03, 20, 22, 24 | pending / — |
| `Projects/WorkItems/` | `List` | PR-05 | pending / — |
| `Projects/WorkItems/` | `Backlog`, `BacklogTui`, `SprintDetail`, `SprintReport` | PR-07, 22 | pending / — |
| `Projects/WorkItems/` | `Timeline`, `TimelineTui` | PR-08 | pending / — |
| `Projects/WorkItems/` | `Import`, `ImportProgress` | PR-10 | pending / — |
| `Projects/WorkItems/Import/` | `Source`, `Mapping`, `Options`, `Preview`, `Result` | PR-10 | pending / — |
| `Projects/Requests/` | `List` | PR-11–12, 24 | pending / — |
| `Projects/Code/` | `Repositories`, `RepositoryDetail`, `CommitDetail`, `Compare` | PR-13–14 | pending / — |
| `Projects/Code/RepositoryDetail/` | `Files`, `Commits`, `Branches`, `Tags`, `Activity`, `Settings` | PR-13, 15 | pending / — |
| `Projects/Code/` | `MergeRequests`, `MergeRequestDetail` | PR-14 | pending / — |
| `Projects/Code/MergeRequestDetail/` | `Overview`, `Commits`, `Changes`, `ChangesTui` | PR-14 | pending / — |
| `Projects/Code/` | `GitAccess` | PR-15 | pending / — |
| `Projects/Time/` | `MyTime`, `MyTimeTui` | PR-16–17 | pending / — |
| `Projects/Time/` | `Timesheets`, `TimesheetDetail`, `TeamTimesheet`, `TimesheetPrint` | PR-17–18, 22; TeamTimesheet is print output | pending / — |
| `Projects/Time/` | `TimeEntries` | PR-16, 18 | pending / — |
| `Projects/Time/TimeEntries/` | `EditEntry` | PR-16, 18 | pending / — |
| `Projects/Time/` | `Import`, `ImportProgress` | PR-18 | pending / — |
| `Projects/Time/Import/` | `Source`, `Preview`, `Result` | PR-18 | pending / — |
| `Projects/Resources/` | `TeamPlanner`, `TeamPlannerTui`, `Allocations`, `PersonDetail` | PR-19 | pending / — |
| `Projects/Resources/Allocations/` | `EditAllocation`, `Staff` | PR-19 | pending / — |
| `Projects/Resources/PersonDetail/` | `Overview`, `Allocations`, `WorkItems`, `Time`, `Capacity` | PR-19; PR-18 time | pending / — |
| `Projects/Billing/` | `Rates` | PR-20 | pending / — |
| `Projects/Billing/` | `Unbilled`, `Invoices`, `InvoicePrint` | PR-21, 24 | pending / — |
| `Projects/Billing/Unbilled/` | `CreateInvoice` | PR-21 | pending / — |
| `Projects/Reports/` | `Index`, `Time`, `WorkItems`, `Sprints`, `Portfolio`, `Profitability`, `Utilization`, `Progress` | PR-22 | pending / — |
| `Projects/Settings/` | `Index`, `WorkItemTypes`, `Workflows`, `Labels`, `Templates` | PR-23; PR-02 template | pending / — |
| `Projects/Settings/` | `Time`, `Billing`, `Code`, `Intake` | PR-23; PR-12, 15, 17, 20–21 | pending / — |

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

In the next table **PD** abbreviates route `Projects/Projects/ProjectDetail`. These are real mounted routes, not
new copies to implement. All are pending / —, including inherited descendants. For dynamic embedded content,
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
| `PD/Time`, `PD/Time/EditEntry` | `Projects/Time/TimeEntries.xml`, `Projects/Time/TimeEntries/EditEntry.xml` | PR-16, 18, 25; internal project-fixed time and inherited edit child; refused to clients |
| `PD/ClientHours` | `Projects/Projects/ProjectDetail/ClientHours.xml` | PR-24–25; `BossSetupData.xml` supplies the `BOSS_PROJECT_CLIENT`-only Hours tab through `SubscreensItem`; distinct from internal Time, subject to project hours sharing |
| `PD/Money/CreateInvoice` | `Projects/Billing/Unbilled/CreateInvoice.xml` | PR-21; selected project sources |
| `Projects/Resources/PersonDetail/EditAllocation` | `Projects/Resources/Allocations/EditAllocation.xml` | PR-19; person context |
| `Projects/Code/RepositoryDetail/MergeRequests` | `Projects/Code/MergeRequests.xml` | PR-14; repository fixed |
| `/r/<token>` | `RequestIntake.xml` | PR-12; public shell, token check and POST rate limit in MoquiConf |

### Custom modes, outputs and embedded surfaces

| Surface | Template / variant and supporting inspection | Activities | Coverage / evidence |
| --- | --- | --- | --- |
| Backlog, including project mount | `Projects/WorkItems/Backlog.qvue`; hidden `BacklogTui.xml` supports move and sprint decisions; inspect each mount's helper resolution | PR-07 | pending / — |
| Timeline, including project Plan | `Projects/WorkItems/Timeline.qvue`; hidden `TimelineTui.xml` supports item moves and dependencies; plan/portfolio limitations separate | PR-08 | pending / — |
| Project Calendar | `Commons/Calendar.qvue`; `Projects/Projects/ProjectDetail/Plan/CalendarTui.xml` read-only project-calendar twin | PR-08 | pending / — |
| My time | `Projects/Time/MyTime.qvue`; `MyTimeTui.xml` supports entries, timer and decisions, not grid typing | PR-16–17 | pending / — |
| Team planner | `Projects/Resources/TeamPlanner.qvue`; `TeamPlannerTui.xml` supports moves/decisions, with narrower request/staff controls | PR-19 | pending / — |
| Merge request Changes | `Projects/Code/MergeRequestDetail/Changes.qvue`; `ChangesTui.xml` supports diff reading, comments, replies and resolve/reopen; browser-specific diff presentation separate | PR-14 | pending / — |
| Merge request decisions | Parent `MergeRequestDetail.xml` supplies review/approve/request-changes, draft/ready, close/reopen and merge controls for browser and terminal inspection; template presence is not interaction evidence | PR-14 | pending / — |
| Project Docs | `Commons/Knowledge.qvue` and hidden project `KnowledgeTui` mount; inspect save/history/review and browser delegation | PR-04, 09 | pending / — |
| Both import progress screens | `Commons/Contacts/ImportProgress.qvue` and `.tui.json`; operation context and result/retry links | PR-10, 18 | pending / — |
| Public request intake | `RequestIntake.qvue` is the submission form; `RequestIntake.tui.json` supplies a browser-delegation notice, not a terminal form | PR-12 | pending / — |
| Project and work lists | Projects List status board/portfolio link; WorkItems List board groupings, due-date calendar, tree, quick-add, peek, selection and bulk controls | PR-01, 05–06 | pending / — |
| Roadmap and Requests | Roadmap list/calendar; Requests list/status board and distinct staff/client create dialogs | PR-09, 11, 24 | pending / — |
| Project creation and header | Wizard member/order/rate controls; Post update, Clone, Save as template; status confirmations | PR-02–03 | pending / — |
| Project tabs and shared records | Description, team/client membership, allocation, repository setup/link, Docs/history/review, files and Chatter; work relations/recurrence/development/time; request triage/conversion/reply | PR-03–06, 11, 13–14, 19, 24 | pending / — |
| Planning dialogs | Sprint create/edit/start/complete/carry-over; timeline move/dependency; milestone gate/share/deliverable/move unfinished; release notes/publish/tag | PR-07–09, 21 | pending / — |
| Time and staffing dialogs | Week/day/entry/timer; submit/return/reopen reasons; allocation request/detail/staff/decision, EditAllocation and Staff routes | PR-16–19 | pending / — |
| Money and billing dialogs | Which rate/new/edit/end; budget/order/estimate approval; selected Unbilled/CreateInvoice; invoice line/status/send controls | PR-20–21, 24 | pending / — |
| Code dialogs | Repository create/mirror/link; branch/tag; rules/webhooks/deliveries; SSH keys/tokens; compare/work link; reviewers/review/merge/checkout and diff threads | PR-13–15 | pending / — |
| Settings dialogs | Types/icons, workflow moves/statuses, labels/edit/merge, templates, time work types, intake addresses/categories | PR-23 | pending / — |
| Reports and outputs | Chart/table/filter/drill-through; CSV/XLSX where offered; `StatusReport`, `EstimatePrint`, `SprintReport`, `TimesheetPrint`, `InvoicePrint` and report print views | PR-03, 07, 17, 20–22, 24 | pending / — |
| Shell in Projects | Quick-create workItem/time/project, Code palette, record search, go-to keys, timer/review/time/request Today rows, approval and notification return, Assist context | PR-01, 06, 14, 16–17, 19, 25 | pending / — |

There are five QVue files under `screen/Projects/`: Backlog, Timeline, MyTime, TeamPlanner and Changes, plus the separate
public intake component `screen/RequestIntake.qvue`. Calendar, Knowledge, import progress, Chatter and RecordFiles
reuse existing components. Rich wrappers for Backlog, Timeline, Calendar, MyTime and TeamPlanner deliberately delegate
plain qvt/html rendering to the browser component; distinguish that
notice from the mounted Material experience and from supported terminal functionality.

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

- **Actor/start:** developer and repository lead with the required repository rights, project manager for Settings/Code,
  disposable credential and local repository/remote; keep PR-13's separate `ADMIN` fixture limited to its administrative subcases.
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
  unsaved edits survive an earlier response. No-navigation or reload shortcut substitutes for the visible save.
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
  TimeEntries → Print to inspect the grouped TeamTimesheet output.
- **Expected:** correction and duplicate handling follow the current policy, each refused row is identified, week
  and project totals agree and locked/invoiced work is not silently rewritten. Rate-only edits obey separate grants.
- **Recovery:** invalid row/range, unknown work item, duplicate key, independent row failure, running/invoiced lock,
  cancel/back and unsuccessful progress fetch.
- **Screens/modes:** TimeEntries/EditEntry and aliases, TeamTimesheet print, Time/Import and all steps/ImportProgress;
  browser/TUI/Standard supported controls, targeted keyboard preview/result.

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
| mr-boss regression `test/Projects/` | Billing, ClientBilling, Reports | PR-20–22, 24; actual invoice/estimate/report output and client reads need evidence |
| mr-boss regression `test/Projects/` | ProjectsAccess, ClientBilling | PR-24–25; selected rule refusals are not the complete access walk |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; Knowledge, KnowledgeReview, Calendar, QuickCreate, TodayPanel, Notifications | PR-01, 04, 06, 08, 11, 16–17, 25; reuse affected shared-rule checks without duplicating the Commons review |
| mr-boss acceptance `acceptance/Projects/` | SprintWalk, TimelineWalk, ReleaseWalk | PR-07–10, 14; TimelineWalk includes import mapping/options/preview and row failure; server scenarios, not browser/terminal interaction evidence |
| mr-boss acceptance `acceptance/Projects/` | RequestWalk, CodeReviewWalk | PR-11–14; server scenarios with their own fixture/prerequisite scope |
| mr-boss acceptance `acceptance/Projects/` | TimeWalk, ResourceWalk, BillingWalk, MilestoneBillingWalk | PR-16–21; existing scenarios to reuse if execution is requested |
| mr-boss acceptance `acceptance/Projects/` | ProjectsServerStatic, ProjectsTui | Supporting render coverage; ProjectsTui also exercises selected transitions, not a live keyboard terminal walk |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Structural/shared coverage; do not add another sweep of the same app/mode |
| mr-mantle regression `test/work/` | WorkProjectFoundation, WorkProjectServices, WorkProjectHub, WorkProjectItems | PR-01–06; business rules belong here |
| mr-mantle regression `test/work/` | WorkProjectSprints, WorkProjectPlan, WorkProjectMilestones, WorkProjectReleases, BusinessTime | PR-07–09; planning/gates/releases/business dates |
| mr-mantle regression `test/work/` | WorkProjectRequests, WorkGit, WorkGitReview | PR-11–15; request and code rules |
| mr-mantle regression `test/work/` | WorkTimesheets, WorkTimeEntries, TimeImports, WorkResources | PR-16–19; time, duplicate import, approval and capacity rules |
| mr-mantle regression `test/work/` | WorkProjectBilling, WorkProjectReports, WorkProjectClients | PR-20–25; billing/projections/client visibility |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootVue.qvt.markdown, WebrootTerminal, QvtKeys, Keys | Shared widget/shell/render fixes only; use existing focused assertions for the affected control |
| webroot acceptance `acceptance/client/` | ThemeLayout | Existing offline theme/geometry acceptance home for a reusable contrast/layout check; not a reason to run it during plan writing |

All eleven Projects acceptance files listed above are **server specs**. Neither BOSS `test/client/suite.js` nor
`acceptance/client/suite.js` currently includes a Projects browser walk. There is no `ProjectsClientFixtures` or
Projects golden-path browser spec. Record this as a coverage gap, not a plan-writing requirement to create tests.
If later automation is requested, name the activity and spec first, retain at most one regression golden-path client
walk for Projects and place additional complete journeys, phone/access walks and sweeps in acceptance. The old
`./moq test` example in ProjectsTui's header does not change its suite: it is an acceptance spec.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Use affected regression specs while working, for example
  `./moq test mr-boss --spec WorkItemDetail --nobuild` or
  `./moq test mr-mantle --spec WorkProjectItems --nobuild`, with a suitable existing binary. Client specs run through
  Moqui, not Node; use `./moq test-client <component> --serve --spec <name>` for an existing served check.
- Follow the current supplied AGENTS instructions before each authorized commit: `./moq test-apps` for application
  changes; `./moq test-framework` for framework changes. A shared widget/renderer/Git framework correction is framework
  work even when discovered here. Do not run framework specs, `cargo test` or `test-all` merely for application work.
  The prior pass's end-of-pass full-suite exception is historical; this plan does not silently adopt it over the
  current before-commit instruction. Record any user-directed cadence change before executing the pass.
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
| PR-01 — Workday navigation | pending | All roles, routes and variants unverified | — |
| PR-02 — Create/clone/template | pending | Wizard, refusal and modes unverified | — |
| PR-03 — Health/team/lifecycle | pending | Membership, status and output unverified | — |
| PR-04 — Docs/files/conversation | pending | Saved content, resources, recovery and modes unverified | — |
| PR-05 — Work views/find | pending | View/return/selection and move variants unverified | — |
| PR-06 — Work item delivery | pending | Workflow, recurrence and shared context unverified | — |
| PR-07 — Sprint | pending | Planning, completion, capacity and modes unverified | — |
| PR-08 — Schedule/calendar | pending | Date/dependency changes and modes unverified | — |
| PR-09 — Milestone/release | pending | Gate/publication/tag/billing/client continuations unverified | — |
| PR-10 — Work import | pending | Mapping/result/repeat/recovery unverified | — |
| PR-11 — Request triage | pending | Conversion/response/audience/return unverified | — |
| PR-12 — Public/email intake | pending | Token, file, local delivery and recovery unverified | — |
| PR-13 — Repository | pending | Local Git prerequisites, resources and controls unverified | — |
| PR-14 — Review/merge | pending | Actual revision/review/merge and modes unverified | — |
| PR-15 — Git access/controls | pending | Credentials, local transport and revoke unverified | — |
| PR-16 — Time/timer | pending | Persisted grid/timer, locks and modes unverified | — |
| PR-17 — Timesheet approval | pending | Two-user return/resubmit/approve and output unverified | — |
| PR-18 — Time correction/import | pending | Locked rows, repeat import and totals unverified | — |
| PR-19 — Staffing/capacity | pending | Request/staff/decision, availability and modes unverified | — |
| PR-20 — Budget/estimate/rates | pending | Effective rates, approval and pay boundary unverified | — |
| PR-21 — Invoice work | pending | Eligible sources, duplication, output and send unverified | — |
| PR-22 — Reports | pending | All report/output/drill-through and role variants unverified | — |
| PR-23 — Settings | pending | Saved effect, restoration and refusals unverified | — |
| PR-24 — Restricted client | pending | Shared reads/actions/files and isolation unverified | — |
| PR-25 — Access/integration | pending | Cross-route/mount and remaining-mode matrix unverified | — |

### Findings register

Allocate **PR-UI-001** onward when evidence exists. Keep observed defects, design judgments and static suspicions
distinct. P1 blocks work, risks data/privacy or makes essential information unusable; P2 causes substantial friction
or misleading behavior; P3 is localized refinement. Security/data findings take priority over visual polish and go
to the owning layer. A source lead below has no new observed finding number yet.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | No findings observed in this planning task | — | — | — | — |

### Static leads

Reproduce each lead in an authorized batch, then allocate a finding or close the lead with the reason. These do not
assert new runtime failures. Historical finding identifiers remain historical references.

| Lead | Source | Activity | Investigation / priority |
| --- | --- | --- | --- |
| Client request file audience | impl-projects F156/F159; `service/ironstone/shared/RecordFilesServices.xml` and `ChatterServices.xml` | PR-11, 24–25 | Historical internal `RqCntInternal` exposure remains a priority source lead. Prepare outward/internal attachments on one visible request; compare list, direct download and bytes as client/nonclient. Reproduce early, before treating any client file flow as safe; do not defer a confirmed privacy defect to visual cleanup |
| Project/child context and return | ProjectDetail's WorkItems/Backlog/Plan/Time mounts; Shared details; shell QuickCreate | PR-01, 05–08, 16, 18 | Compare scoped tab/global list/palette/quick-create routes and saved-filter Back; parent project and selected child IDs must not replace one another |
| Repeated-row dialog identity | Settings WorkItemTypes `TypeIconDialog`, Labels `EditLabelDialog`, Workflows `EditStatusDialog`; repository Settings `EditRuleDialog`, `WebhookDeliveriesDialog`, `EditWebhookDialog` | PR-15, 23 | Fixed authored IDs warrant live repeated-row/focus/reopen checks; do not assume duplication is broken without inspecting rendered identity |
| Rich-view save and mutation parity | Backlog, Timeline, MyTime, TeamPlanner, Changes and their twins | PR-07–08, 14, 16–19 | Compare supported keyboard/menu/TUI operations with drag/grid results; inspect late responses after changing project/week/range and separate intentional delegation |
| Financial visibility distinctions | `ironstone.projects.BillingServices`, client projections and rate views; impl-projects §4 payroll decision | PR-20–25 | Ordinary money management must not expose employee worker pay; pair restricted “Set by payroll” presentation with separate payroll-holder read/edit, including exports and shared hours |
| Stale demo dates and optional Git | BossProjectsDemoData files and Time/Resource/CodeDemoServices | PR-01, 07–09, 13–22 | Fixed planning dates differ from relative week fixtures; Git loader can continue after failure. Establish dates/capabilities before calling an empty or missing surface a defect |

### Bounded batch record

**Planning baseline:** current source and existing design/implementation/research records were inspected; the local
inventory, shared mounts, activities, roles and verification map were prepared. No runtime was started, no browser
or TUI activity executed, no tests run, and no product source changed. There are no review screenshots or pass claims.

**Document review:** corrected the public intake templates and token/confirmation contract, terminal merge-review
coverage, Git administrative roles, ClientHours mount, Code palette terminology and partial-coverage bookkeeping
against current source. Rechecked document links, local inventory and activity references. This was a plan-only edit:
no live UI finding IDs were allocated, no runtime was started or application tests run, and all live activity coverage
remains pending.

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

- **Planning boundary:** this task prepares and reviews the plan only. Execution, product corrections, commits and acceptance
  runs are not inferred from this file or from the previous review's permissions.
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
- **Verification:** obey current before-commit gates and acceptance-run rules in §5. No inherited per-pass gate
  exception, budget increase, duplicate sweep or new screenshot suite.
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
- **Execution/check cadence:** apply the current AGENTS before-commit gates by default. If the user directs a bounded
  multi-wave pass with a different full-suite boundary, record that decision here before adopting it.
