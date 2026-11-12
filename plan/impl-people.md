# IronStone BOSS — People implementation

Nov 12, 2026 — gate 3 built: P15–P19 and P21 (stage 3), expenses, recruiting, development and cases, each phase reviewed by
a fresh agent and merged on its focused specs, with the Commons calendar follow-up (view-only attendee links, app-managed
events). Next: P20 beside P22, then P23, and stage 4.
Nov 12, 2026 — gate 2 built: P9–P14 (stage 2), time and leave, each phase reviewed by a fresh agent and merged on its
focused specs, P12 and P13 with their framework parts (the per-field AI opt-out, a quick create's condition service). Next:
stage 3 (P15 beside P16, then P17 beside P18, P19 beside P21, P20 beside P22, P23).
Nov 11, 2026 — gate 1 built: P1–P8 (stage 1), People's first release (the employee record), each phase reviewed by a fresh
agent and merged on its focused specs; the full suites and the acceptance suite run once at the end of the build (the
user's call). Next: stage 2 (P9 beside P10, then P11–P14), time and leave.
Nov 11, 2026 — P0 done: the checks left after the plan's review, F55–F71, against the code as Admin P17–P19 and Insights
P11–P12 left it. P30 no longer waits: Admin P18 is built, and the kiosk is a page of its own that a device reads as a
display account (F55). People registers no audit projection (F56). P10's time mounts change more of Projects' code than
§4 had (F57). P1, P2, P3, P6, P7, P8, P12, P14, P15, P16, P27 and P29 take the contracts as found. §5 Q3, Q6, Q7 and Q8
are answered as recommended. The People acceptance tests run once, after the full suites at the end of the build. At
most two phase workers run at once (§4).
Nov 11, 2026 — the open questions answered (§4): the budgets may rise by the plan's estimates as its phases land, the
import targets name `PEOPLE_IMPORT`, the one costing purpose is `RaprCost` and P10 moves Manufacturing to it, P27
builds AC-23 and external payroll processing waits on it, a hire's provisioning proposes `BOSS_USERS` and
`BOSS_PEOPLE_SELF`, and payroll stays generic in this build.
Nov 11, 2026 — reconciled with impl-maintenance, impl-sales and impl-marketing: P7's process policy carries a
guards-execution flag and the managed-work rule reads as Maintenance's does, the import targets name People's
permissions alone (§4, §5 Q10), the deny pattern's splits are Maintenance's (F26), Q2 and Q9 read as the other plans'
do, and §7 names the phase of each plan that picks up a link.
Nov 11, 2026 — reviewed against the design, the code and the other three plans: F34 and F39 corrected (Manufacturing
built a costing rate purpose; the PrtEmployee filter of `MANTLE_USER_ORG` is commented out), F19 and F26 completed,
F49–F54 added; P7 builds MT-03's two policy records in the form Maintenance extends; P16 makes the survey builder
work for a second app; P4 follows P3, and P19 and P20 follow P16; the outputs, hosts and shell entries the phases had
left out are in their phases; §5 gains Q9 and Q2 the purpose question; §7 names what Maintenance, Sales and Marketing
pick up.
Nov 11, 2026 — plan, before People starts. P0 partly done: F1–F48 found while writing it, from the code as Admin
P1–P16 and Insights P1–P10 left it (mr-moqui 16828c5f, mr-boss f1bf2a95, mr-mantle 0048667f; §6). People is the first
of the four apps built next (People, Maintenance, Sales, Marketing), each with its own plan and order (§4), so it uses
nothing from the other three: what joins People to them is built by their plans and listed in §7. This plan picks up
what the built apps left waiting on People (§1 scope). Admin P17–P19 and Insights P11–P12 are not built; what depends
on them is planned from the designs and marked (P0, P30). The plan's open questions are in §5, each with the answer it
recommends.

How [design-people.md](design-people.md) gets built, in phases from the foundation to the kiosk, each ending tested and
usable. This file is kept at a high level, as [impl-admin.md](impl-admin.md) and the core-app plans are: each phase
names its scope by the design's sections and §16 needs rather than restating them, and the design stays the place for
screen and record detail. During the build this file is the log: phase status and what each built, the decisions made,
open questions, findings against the code, and what is deferred.

Today `screen/People/` holds eight flat placeholders (Home, Employees, Positions, Time, Payroll, Training, Reviews,
Settings), and the root mounts only Chatter and RecordFiles, with no `<shell-providers>`. The `BOSS_PEOPLE` artifact
group is live for `ADMIN` and `BOSS_PEOPLE_ADMIN` (F1), who also hold `PAYROLL_VIEW` and `PAYROLL_EDIT` (F2); there
is no root user group and no other People group. Mantle has no `PeopleServices` or any of the service families of
design §16.2: `mantle.humanres` is EmploymentServices, PositionServices (one service), RateServices and the historical
payroll services (F3–F6, F32). People is built on what is there (as found in the code, §6):
- from the framework: the shell providers (palette, quick create, Today, notification topics, `record-lookup`,
  `create-from`, `assist-prompt`, `response-action`), `view-tree`, `view-board`, `scan-input` and
  `density="handheld"`, tx-commit SECAs, `AiTaskServices.run#Extract`, `CallServices.create#CallLink`, mail rule
  actions, the barcode tool, and Admin's `org.moqui.admin.DataTransferServices` with its `TransferTarget`
  registrations (F16, F25); not yet the per-field AI opt-out, the decimal evaluator or the device credential (F24);
- from Mantle: Party, PartyRelationship and the roles (`PrtEmployee`, `PrtManager`, `PrtOrgRollup`, `PrtMember`,
  `OrgDepartment`, `OrgTeam`), Employment, EmploymentSalary, EmplPosition and its class, PayGrade, RateAmount,
  PartySkill, EmploymentApplication, `get#PayRateAccess` (the built pay-rate masking), TimesheetServices,
  TimeServices and ResourceServices, EventServices' reminders, invitations and business days, the CalDAV task write
  path, `create#ProjectExpenseInvoice` and the invoice, payment and payment-run services, AssetPartyAssignment,
  Request and its rules, and `mantle.party.IdentityServices` (accounts, invitations, lifecycle operations);
- from the apps: Projects' time screens and Rates (mounted as they are, F17), Commons' Notifications as Approvals,
  Calendar, Chatter and RecordFiles, the survey builder's four shared screens, which today answer Customer Service
  alone (F51), the shared WorkItemDetail, RequestDetail, EquipmentDetail and InvoiceDetail (F19), Projects' Timeline
  in its resource mode (F53), Accounting's ExpensePosting, Admin's registries, lifecycle coordinator and
  Shared/DataImport, and Insights' catalog, metric, attention, dataset-class and flow-target registries (F27).

**Inputs.**
- Designs:
  - [design-people.md](design-people.md), with its payroll correction: the Mantle payroll code is an incomplete
    historical implementation, and the design supersedes the research on it
  - [design-crosscut.md](design-crosscut.md) §1.3's automation register (People's rows), §1.4 (capability groups, the
    People rows and the pay-rate rule), §1.5 (CX-ASSIST, CX-SYNC, CX-MAIL-INTAKE, CX-DEVICE, CX-OPS-REPORTS), §3.4
    (Employee360 and SelfService), §3.10, §3.11, §3.12, §3.14, §3.15, §3.16 and §3.31 (People's rows of the shared
    screens), §4.5 (People, time, payroll and expenses) and §7.5 (People's needs)
  - [design-admin.md](design-admin.md) §4.1 (provisioning from People), §11.1 (the `employees` and time-and-attendance
    import targets, the payroll exchange export), §14 (lifecycle participant, shared-device registration) and §14.2
    (People's settings row)
  - [design-accounting.md](design-accounting.md) §5 (ExpensePosting), AC-23 (the payroll-origin projection) and its
    LaborCostingRates form; [design-projects.md](design-projects.md) §8 (time), §10 (Rates) and §15 (capacity);
    [design-drawers-commons.md](design-drawers-commons.md) §4 (Notifications), §7 (Calendar), §9 and §15 (RecordFiles,
    Chatter); [design-insights.md](design-insights.md) (the catalog, metric, attention and dataset contracts);
    [design-maintenance.md](design-maintenance.md) MT-03, Teams and TechnicianKiosk, for what People leaves to it (§7)
- Plans:
  - [impl-admin.md](impl-admin.md): the pattern; its §7 "What waits on People"; the Built and Review notes of P2
    (registries), P3 and P9 (capability bundles), P6 (lifecycle), P15 and P16 (transfer targets), P17 (audit
    projections) and P18 (shared devices).
  - [impl-insights.md](impl-insights.md) §7 "What waits on People", the Built notes of its registries and P11's (the
    wall display, a device's page of its own).
  - [impl-projects.md](impl-projects.md) (time and capacity), [impl-accounting.md](impl-accounting.md) P6
    (ExpensePosting), [impl-manufacturing.md](impl-manufacturing.md) (its deferred LaborCostingRates and the
    shared-station operator switch), [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- Research: [research-people.md](research-people.md), as the design corrects it.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8,
  mr-moqui `docs/dev/Practices-App-Dev.md`, `.agents/skills/testing/SKILL.md`, `docs/Build-Test.md`,
  `docs/security/Attack-Surface.md`.
- Inventories: [ss-inventory.md](ss-inventory.md) (the HumanRes, Party and MyAccount/Expense rows) and
  [usl-inventory.md](usl-inventory.md) (HumanRes), which carry the design's **Designed in** paths; design §14.2 traces
  the baseline forms.
- mr-moqui: `plans/Remaining-Work.md` ("IronStone framework asks": the per-field AI switch, the decimal evaluator,
  the device credential).

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/base-component`): the per-field AI opt-out (PE-21, P12) and the decimal
    evaluator `org.moqui.impl.ExpressionServices` (PE-09, P22), and nothing of People's own: its rows in the
    framework's registries are seeded by Mantle and BOSS. The device credential is Admin P18's, not this plan's;
  - `runtime/component/mr-mantle`: the `mantle.humanres` service families of design §16.2 and their records, the
    `PEOPLE_*` permissions and `PAYROLL_APPROVE`, the People notification topics, People's transfer targets
    (`moqui.server.TransferTarget` rows), the extensions of `mantle.work` (capacity, working days, the template
    process and its two policy records, the CalDAV collections), `mantle.request` (the confidential case type),
    `mantle.account` (the claim on `create#ProjectExpenseInvoice`, the payroll source checks) and `mantle.party`
    (the provisioning kind of the lifecycle operation, the HR content hosts, the form definition services under the
    survey builder);
  - `runtime/component/mr-boss`: the People app, `Shared/Employee360` and `Shared/PeopleSelfService`,
    `ironstone.people` (ContextServices and the screens' presentation), the tx-commit SECA, People's `report/` and
    `skill/` files, its capability bundles and its registrations in Admin's and Insights' registries, and the
    owner-contract changes in the built apps (§2).

  `runtime/component/mr-marble` is read only, for the baseline HumanRes, Party and MyAccount/Expense forms that
  ss-inventory maps. mr-pass is not changed: the careers page is later (§7).
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §16 needs they use, as changed by §6. The `later` rows
    (TalentPool, TravelRequests, PayrollStatements) and the later capabilities of design §17 and §18 are in §7.
  - Payroll as design §8 decides it: the native engine in preview mode. Finalization creates obligations only for a
    pay group that is live-enabled, and no group can be until a localization exists (none is in this build) and the
    payroll-origin projection is in place (P27 builds it, §4).
  - What the built apps left waiting on People, each in the phase where its records exist:
    - Admin (impl-admin §7): `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd`, the
      tx-commit SECA on `hire#Employee` and `apply#EmploymentChange`, and the IT checklist task's operation link (P7);
      UserDetail's Employee360 link (P2); the `employees` import target (P7) and the time-and-attendance target (P13);
      the payroll exchange export (P28); People's settings row (P1), readiness provider (P1, growing by phase),
      capability bundles (P1), lifecycle participant (P5) and ClockingKiosk route group (P30). The privacy provider
      waits on Admin's own later PrivacyServices (§7).
    - Insights (impl-insights §7): the Employee360 record mount and its crosscut row (P2); PeopleReportServices, the
      catalog entries, metrics, attention providers and the People dataset class's datasets (P29); the People step of
      the internal flow map, information only today (P29).
    - Projects: the People mounts of its time screens and Rates (P10), capacity and working days reading People's
      schedules (P9), and PersonDetail's Employee360 link (P2).
    - Accounting: ExpensePosting reading a claim's business approval (P15); the LaborCostingRates form Manufacturing
      deferred on People's `get#CostingRate` (P10); the payroll-origin projection, AC-23, if the user agrees (P27, §5).
    - Customer Service (impl-customer-service §7): People's mount of the survey builder (P16). People is the
      second app to mount it, so P16 makes its four screens take their context from the mounting app's registration
      (F51, §4); Marketing's plan then adds its own registration, the public purposes and the publication
      services (impl-marketing P12).
  - Shared screens: People builds `Shared/Employee360` (P2) and `Shared/PeopleSelfService` (P8). Employee360 reads
    its regions and actions from a per-app context table with the People, Commons, Projects and Insights rows;
    Maintenance's row is Maintenance's (§7), and an app with no row (Sales, Admin) links the People or Commons mount.
  - §7 holds the design's `later` rows, the links to Maintenance, Sales and Marketing with the plan that builds each,
    and what waits on a localization.
- **Order** (the plan's choice, §4, on design §14.4). Five stages, each ending at a gate. Framework and Mantle work
  goes in the phase that first needs it.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | P1 Foundation | 1 |
  | 2 | P2 Employees and Employee360 | |
  | 3 | P3 Organization and reporting | |
  | 4 | P4 Job classes, positions and pay grades | |
  | 5 | P5 Approval rules and Approvals | |
  | 6 | P6 Hire and employment change | |
  | 7 | P7 Checklists, equipment return, provisioning and employee import | |
  | 8 | P8 Self-service, MyTeam and Home | gate 1: People's first release (the employee record) |
  | 9 | P9 Working schedules, holidays and capacity | 2 |
  | 10 | P10 Time mounts, rates and labor costing | |
  | 11 | P11 Leave policies, allocations and balances | |
  | 12 | P12 Leave requests and the team calendar | |
  | 13 | P13 Attendance and time import | |
  | 14 | P14 Shift roster | gate 2: time and leave |
  | 15 | P15 Expense claims and advances | 3 |
  | 16 | P16 Openings and applicants | |
  | 17 | P17 Offers and hire from an offer | |
  | 18 | P18 Skills and qualifications | |
  | 19 | P19 Training | |
  | 20 | P20 Reviews and goals | |
  | 21 | P21 Grievances | gate 3: expenses, recruiting, development and cases |
  | 22 | P22 Pay components, structures and groups | 4 |
  | 23 | P23 Pay assignments and compensation | |
  | 24 | P24 Pay inputs and hours for pay | |
  | 25 | P25 Pay runs | |
  | 26 | P26 Payslips and corrections | |
  | 27 | P27 Accounting handoff and settlement | |
  | 28 | P28 Payroll exchange | gate 4: payroll in preview mode |
  | 29 | P29 Reports, Insights and settings | 5 |
  | 30 | P30 Clocking kiosk | |
  | 31 | P31 Finish | gate 5: People built |

  Each phase starts after the one above it, except these, which may run side by side because neither uses the other's
  work: P9 beside P10; in stage 3 the four tracks P15, P16–P17, P18 and P21, with P19 and P20 after both P16 and P18;
  and P22–P23 beside stage 3, since pay configuration needs only employment and P4's grades. The dependencies that fix
  the rest: P4 needs P3's departments (a position's department and its choices); P6 needs P3's units, P4's positions and
  P5's approvals; P7 needs P6's services and Admin P6 and P15 (built); P11 and P12 need P9's schedules for durations;
  P13's corrections and P15's claims need P5; P17 consumes P6's hire; P19 grants P18's qualifications; P19's results and
  P20's assessments are responses of P16's forms; P16's scorecards, P20's review text and P21's cases need P12's AI
  opt-out; P24 needs P10–P13 and P15 (the sources it reserves); P27 needs P15 (the claim's payroll route) and P25–P26;
  P30 needs P13's punches and Admin P18's device credential, which is built (F55); P29's datasets wait for nothing in
  Insights P11–P12. A phase of a side-by-side pair that appends to the same file as the other (BossSetupData.xml,
  BossUsersDemoData.xml, mr-mantle's setup data) rebases on it before merging.

## 2. Ground rules

- **The Commons rules hold.** These are impl-drawers-commons §4:
  - failure tolerance;
  - the Mantle-free framework;
  - Mantle stands without BOSS;
  - business logic leans to Mantle;
  - the new XML element checklist of style-guide §8.1;
  - libraries through `libs/refresh.mjs`, and crates against `deny.toml`;
  - the `.qvue` gallery pattern;
  - parties by role;
  - organization filters;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Commerce's pattern: one golden-path walk in `test/client/People/`, `PeopleHireWalk` (P6),
  registered in `test/client/suite.js`; the others are acceptance tests.
- **Two layers, and a third only where the design names it.**
  - Mantle `mantle.humanres.*`: every record, rule, approval decision, calculation and scoped projection of design
    §16.2. Each service checks its own permission, organization, employment, relationship and participant scope, and
    reads and writes with authorization disabled after that check (Practices-App-Dev §4).
  - BOSS `ironstone.people`: ContextServices (`get#SharedContext`, `check#Record`, `get#Choices`, `search#Records`,
    over one module `People.js` whose tables later phases extend), the shell providers' services, and the screens.
  - Framework: only PE-21 and PE-09, which no component could hold (design §16.1).

  No same-named `ironstone` pass-through over a Mantle service is built; a screen calls the Mantle service after the
  app's access check.
- **Permissions, not group names.** Services check `ec.user.hasPermission` and scope, never a BOSS group name, a
  calling screen or a supplied `appRoot`; a write permission is not a view permission. Mantle seeds the `PEOPLE_*`
  permissions and `PAYROLL_APPROVE`, each granted to `ADMIN`, as it seeds `PAYROLL_VIEW` and `PAYROLL_EDIT` (F2);
  BossSetupData grants them to the groups of design §1.1. Mantle specs grant them to spec-local groups, never a
  `BOSS_*` group.
- **Scope is the intersection** (design §1.1): permission, organization (`MANTLE_USER_ORG`, F39), employment and its
  dates, the live reporting relationship, record participation and field category. A supplied `partyId` never
  widens self scope. Missing and unauthorized records both answer "Not available". Restricted values (pay, private
  contact, identity numbers, case existence, review notes, leave reasons) are left out of the answer by the service,
  never fetched and hidden by a screen; counts, search, choices, exports, notifications and Assist tools use the same
  projections.
- **No self-approval, no approval by default.** A decision service rechecks the decider's authority and the source's
  revision; an unresolved route waits; changed terms invalidate a pending approval (design §12 ApprovalPolicies).
- **Pay never leaves its lane.** Pay amounts never enter shell context, palette rows, notification titles, Chatter
  or a shipped dataset (design §2, §1.4); no HR, payroll or grievance service is exposed to MCP.
- **The legacy payroll services are not called.** `process#TimePeriodPay`, `process#EmploymentPay`,
  `reopen#PayrollPeriod`, the period invoice and payment services and `PayrollDocumentServices` stay as they are for
  their specs and history (design §8.4, F32); no People screen or service calls them, and the new engine reads no
  `PayrollAdjustment` row.
- **Calculation changes no money.** Preview, preparation, calculation and approval create no invoice or payment;
  only `finalize#Run` creates draft obligations, through Mantle's invoice services, for a live-enabled group; posting,
  payment authorization and settlement stay Accounting's services and SECAs (design §8.3).
- **Records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - dated rows, ended and never deleted, for assignments, memberships, reporting lines, policies, schedules, pay
    terms and position occupancy; history stays readable;
  - the audit log on the key fields the build changes (assignment department, position and manager; salary amount,
    already audit-logged; policy terms; a qualification's verification; a review's state), with a change reason as
    the audit row's (`<field>_changeReason`);
  - records of their own only where a fact has its own identity (design §17 "Dates and documents"): an employment
    assignment, a leave request and its ledger entries, an attendance punch, an approval decision, a pay run, a
    payslip, an obligation link, an offer; never a generic snapshot or version table;
  - prints and exports take an effective date and time; an issued document is stored and not re-rendered.
- **Revisions and operations.** Every write names the revision it read (`lastUpdatedStamp`) and is refused naming
  the current one when stale; a hire, an employment change, a provisioning request, a punch, an import row, an
  accrual, a pay run unit and an exchange batch carry an operation or source key, so a retry answers the first
  result. A batch (allocation, accrual, bulk stage change, import, calculation) names each failure and goes on, each
  item in its own transaction (design §16.2).
- **Owner contracts.** A change built here in another app's screen, service or registry row (Admin's lifecycle entry
  and UserDetail link, Projects' time screens and PersonDetail, Accounting's ExpensePosting and LaborCostingRates,
  Commons' mount of SelfService, Insights' Records mount) follows that app's design and is written into it. The
  owner's screens and services stay the owner's; a mount or registration names them and adds no right.
- **Existing callers stay compatible.** `create#Employment`, `update#Employment` and `create#PersonEmployee` for
  their callers; Projects' time, timesheet, capacity and staffing services for Projects and Manufacturing (people with
  no People schedule keep today's capacity, F23); `create#ProjectExpenseInvoice` for project expenses; the Request
  rules for Projects, Purchasing and Customer Service; Customer Service's FeedbackForms and SatisfactionResults
  mounts and `CaseFeedbackServices` under the survey builder's change (P16); Manufacturing's labor valuation under
  the one costing purpose (P10); `replace#AssetPartyAssignment` for Warehouse; Mantle's HumanResServices,
  PayrollServices and PayrollAdjustments specs, the Work, Timesheet, Party and CaseFeedback specs, and the earlier
  apps' BOSS regression suite pass unchanged.
- **Done for a phase** means all of these:
  - impl-drawers-commons §4 "Done" (as impl-projects §2 applies it):
    - cargo tests for the touched crates, with goldens reviewed (P12 and P22 only);
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle (`test/humanres/`, passing
      under `./moq test mr-mantle` alone), BOSS's in mr-boss (`test/People/`), the framework's in
      `runtime/base-component/framework/test`;
    - `./moq test-apps`, and `./moq test-framework` for P12 and P22, each suite within its budget; a budget is
      raised by the phase's measured share, up to the plan's estimate for the suite, which the user approved (§4);
      a raise beyond the estimate needs the user's agreement again, and until it is given a phase that would pass
      the budget cuts a duplicate or moves a scenario to acceptance; no spec passes 15 seconds;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `PeopleAccess` (one holder and one non-holder on one verb, with the
    same parameters, and another organization's record refused), not every service and mount; ProjectsAccess passing
    with the new package (F26);
  - a screen rendered at most once in each mode across the regression suite, with all of its checks on that render,
    and in a second mode only where it has its own template (the `.qvue` screens and their TUI twins);
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`acceptance/People/`, `acceptance/client/People/`), named in the phase;
  running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 11 (§6 F1–F71) |
| P1 Foundation | Mantle, BOSS | the People root and menu, Home (frame), Settings (frame) | built and reviewed Nov 11, merged |
| P2 Employees and Employee360 | Mantle, BOSS | Employees, Employee360, Chatter, RecordFiles; Insights' and Admin's links | built and reviewed Nov 11, merged |
| P3 Organization and reporting | Mantle, BOSS | OrgStructure, OrgChart | built and reviewed Nov 11, merged |
| P4 Job classes, positions and pay grades | Mantle, BOSS | JobClasses, JobClassDetail, Positions, PositionDetail, PayGrades | built and reviewed Nov 11, merged |
| P5 Approval rules and Approvals | Mantle, BOSS | ApprovalPolicies, Approvals, Lookups | built and reviewed Nov 11, merged |
| P6 Hire and employment change | Mantle, BOSS | HireEmployee, EmploymentChange | built and reviewed Nov 11, merged |
| P7 Checklists, equipment return, provisioning and employee import | Mantle, BOSS | ChecklistTemplates, WorkItemDetail, EquipmentDetail, EmployeeImport | built and reviewed Nov 11, merged |
| P8 Self-service, MyTeam and Home | Mantle, BOSS | SelfService (People and Commons), MyTeam, Home | built and reviewed Nov 11, merged |
| P9 Working schedules, holidays and capacity | Mantle, BOSS | WorkingSchedules, WorkingScheduleDetail, HolidayCalendars | built and reviewed Nov 11, merged |
| P10 Time mounts, rates and labor costing | Mantle, BOSS | MyTime, Timesheets, TimesheetDetail, TimeEntries, Rates; Accounting's LaborCostingRates | built and reviewed Nov 11, merged |
| P11 Leave policies, allocations and balances | Mantle, BOSS | LeavePolicies, LeavePolicyDetail, LeaveAllocations, LeaveBalances | built and reviewed Nov 11, merged |
| P12 Leave requests and the team calendar | mr-moqui, Mantle, BOSS | LeaveRequests, LeaveRequestDetail, TeamCalendar | built and reviewed Nov 11, merged |
| P13 Attendance and time import | Mantle, BOSS | Attendance, TimeImport; SelfService's Clock | built and reviewed Nov 11, merged |
| P14 Shift roster | Mantle, BOSS | ShiftRoster | built and reviewed Nov 11, merged |
| P15 Expense claims and advances | Mantle, BOSS | ExpenseClaims, ExpenseClaimDetail, EmployeeAdvances, InvoiceDetail; Accounting's ExpensePosting | built and reviewed Nov 11, merged |
| P16 Openings and applicants | Mantle, BOSS | Openings, ApplicantPipeline, ApplicantDetail, InterviewsCalendar, Forms (the survey builder for a second app) | built and reviewed Nov 11, merged |
| P17 Offers and hire from an offer | Mantle, BOSS | OfferDetail | built and reviewed Nov 11, merged |
| P18 Skills and qualifications | Mantle, BOSS | SkillsMatrix, Qualifications | built and reviewed Nov 11, merged |
| P19 Training | Mantle, BOSS | Training, TrainingDetail | built and reviewed Nov 11, merged |
| P20 Reviews and goals | Mantle, BOSS | ReviewCycles, Reviews, ReviewDetail, Goals | — |
| P21 Grievances | Mantle, BOSS | Grievances, RequestDetail | built and reviewed Nov 11, merged |
| P22 Pay components, structures and groups | mr-moqui, Mantle, BOSS | PayComponents, PayComponentDetail, PayStructures, PayStructureDetail, PayGroups | — |
| P23 Pay assignments and compensation | Mantle, BOSS | PayAssignments; Employee360's Compensation | — |
| P24 Pay inputs and hours for pay | Mantle, BOSS | HoursForPay, PayAdjustments | — |
| P25 Pay runs | Mantle, BOSS | PayRuns, PayRunDetail (to Approval) | — |
| P26 Payslips and corrections | Mantle, BOSS | Payslips, PayslipDetail | — |
| P27 Accounting handoff and settlement | Mantle, BOSS | PayRunDetail's Finalize and Settlement, InvoiceDetail; Accounting's finance screens | — |
| P28 Payroll exchange | Mantle, BOSS | PayrollExchange | — |
| P29 Reports, Insights and settings | Mantle, BOSS | Reports, Settings | — |
| P30 Clocking kiosk | Mantle, BOSS | ClockingKiosk | — (Admin P18 built; no longer waits, F55) |
| P31 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F54 were found on Nov 11 while writing and reviewing this plan; the design
edits they call for in design-people were made then (F11, F20, F34, F51).

**Done Nov 11.** The checks left after the review, read in the code as Admin P17–P19 and Insights P11–P12 left it,
are F55–F71: Admin P18's device credential, on which P30 is replanned and no longer waits (F55); Admin P17's audit
projections, of which People needs none (F56); Projects' time screens under another root (F57); the readiness contract
(F58); the directory across employers (F59); the return task's link (F60); the costing purpose (F61); the survey
builder's generic part (F62); the team's from-role (F63); Commons' Home and Today (F64); mail rule actions (F65);
`get#RecordLinkInfo` and RecordFiles' sharing (F66); the projected calendar kind (F67); the resource-lane timeline
(F68); payment runs for employee payees (F69); Insights' admission of an `InsDcPeople` dataset (F70); legacy rows on
the demo instance (F71). The phases they change say so (P1, P2, P3, P6, P7, P8, P10, P12, P14, P15, P16, P27, P29,
P30, §7). Design-people changed: §1.4 (mail intake, devices), ClockingKiosk, §13 RecordFiles and PE-01.

### P1 — Foundation

Design §1.1, §1.2, §1.4 (the root's providers), §3 Home (its frame), §12 Settings (its frame); PE-01 (groups,
permissions, scope), PE-18 (the root).

- **Access** (design §1.1, crosscut §1.4).
  - Mantle seeds `PEOPLE_DIRECTORY_VIEW`, `PEOPLE_SELF_SERVICE`, `PEOPLE_TEAM_VIEW`, `PEOPLE_REQUEST_APPROVE`,
    `PEOPLE_HR_VIEW`, `PEOPLE_HR_EDIT`, `PEOPLE_RECRUIT_VIEW`, `PEOPLE_RECRUIT_EDIT`, `PEOPLE_DEVELOP_VIEW`,
    `PEOPLE_DEVELOP_EDIT`, `PEOPLE_CASE_HANDLE`, `PEOPLE_IMPORT`, `PEOPLE_CONFIGURE` and `PAYROLL_APPROVE`, each
    granted to `ADMIN`, beside `PAYROLL_VIEW` and `PAYROLL_EDIT` (F2). `PEOPLE_IMPORT` is the app's own import
    permission, which People's import targets name (P7, P13; §4); BossSetupData grants it to `BOSS_PEOPLE_HR`, who
    run both imports.
  - The groups of design §1.1 on Commerce's pattern: `BOSS_PEOPLE` as the root user group beside the artifact group
    of that name, and `_READ`, `_SELF`, `_MANAGER`, `_HR`, `_RECRUIT`, `_PAYROLL`, `_PAYROLL_APPROVE`, `_DEVELOP` and
    `_CASE`; `BOSS_PEOPLE_ADMIN` keeps its row and gains `PEOPLE_CONFIGURE` (F1). An area only some groups see is an
    artifact group that denies the root group and allows its capability groups; the ordinary groups' authz carries
    `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`. `BOSS_PEOPLE_SELF` gets no root grant: its routes are P8's.
  - The `ironstone\.people\..*` service pattern on the artifact group, and `people` added to the client deny pattern,
    with no row split: the longest becomes 244 of 255 characters (F26). No artifact authorization for the raw
    `mantle.humanres` entities or their REST paths (PE-01).
  - `ironstone.people.ContextServices`: `get#SharedContext` (capabilities from the permissions, the employers and
    units the user may see, own party and employments, `appRoot`, `sharedLinks`), `check#Record`, `get#Choices`
    (a table of named sources; the first: employers, units, people in scope) and `search#Records`.
- **Mantle `mantle.humanres.PeopleServices`** starts with `get#Scope` (the caller's employers, employments, live
  reports and capabilities, one query each; every later service's scope check), `get#Home` (counts of what is built,
  nothing for what is not) and `get#Readiness` (the checks of what is built: an employer with no department, an
  employee with no manager; later phases add theirs). `get#Readiness` answers the registry's contract with no adapter
  (F58): called with `providerKey` and an `organizationPartyId`, it returns `checks` of `checkKey`, `title`, `state`,
  `reasonCode`, `message` and `fixRoute` (a route key the app showing it resolves), and refuses an organization outside the caller's scope by reason code.
- **Admin's registries** (owner contracts, F27): People's capability bundles from crosscut §1.4's rows, as the
  built apps' are (BossSetupData.xml:2676-2687), `PEOPLE_IMPORT` in the HR bundle; the settings entry
  `people.settings` to `People/Settings` (the pattern of :2553-2556) and the readiness provider `people.setup` over
  `get#Readiness`, scope `AdmScOrganization`, with `PEOPLE_CONFIGURE` and `fixRoute` `peopleSettings` (the row of
  :2550-2552; Accounting's and Products' services have adapters, People's answers the contract, F58).
- **The People root** (design §1.2): the menu areas Home and Settings; each later phase adds its entries, and
  `later` entries stay absent. The eight placeholders are removed (each area's phase builds its real screens); the
  stale grant comment fixed (F1). `<shell-providers>` with the `people` keymap scope; the palette, quick create and
  Today sources arrive with their records.
- **Home** (design §3): Summary and DueWork over `get#Home`, each count of a later phase absent, the empty state
  linking Settings. **Settings**: SetupReadiness over `get#Readiness`; PeoplePreferences is P29's.
- **Demo data.** `BossPeopleDemoData.xml`: ORG_ZIZI_RETAIL and ORG_ZIZI_SERVICES as employers (F12), a dozen
  employees with employments, managers and work contacts, one person employed by both, one contractor (`PrtAgent`)
  who is not an employee, and an ended employment. BossUsersDemoData gains a user per group (`people.reader`,
  `.employee`, `.manager`, `.hr`, `.recruiter`, `.payroll`, `.payapprover`, `.develop`, `.case`, `.admin`, none in
  `ADMIN`), the manager and the employee being demo employees, and an HR officer for ORG_ZIZI_RETAIL only.
- **Specs.**
  - `test/People/PeopleSpecLib.js` (ids, users, `shell`, `page`), the one place for them.
  - `PeopleAccess`: the app's one access spec, about seven features with authorization on: each group's
    permissions, the menu per group, an HR officer of one employer refused the other's employee with the same
    parameters, a holder of `PEOPLE_HR_EDIT` alone reading nothing, the refused raw `mantle.humanres` entity paths,
    Home's one qvt render. A later phase adds a case only for an access rule it adds.
  - Mantle `test/humanres/PeopleScope` (scope by organization, employment dates and reporting line; a supplied
    party outside scope refused by reason code).
- **Usable when** (an acceptance test to write, `acceptance/People/PeopleFoundationWalk`): the menu renders for each
  group; `people.hr` opens Home with ORG_ZIZI_RETAIL's counts and not ORG_ZIZI_SERVICES'; `people.employee` is
  refused the root; a Projects client and a PASS public account are refused the root and every `ironstone.people`
  service; Admin's Health shows People's setup check and SettingsHome People's entry, each only to a user who may
  open it.

**Built Nov 11 (P1).** mr-mantle 5095ffb4, mr-boss (branch `ppl/p1`).
- Checked first (the code over the plan): F1 (the root grant is live for `ADMIN` and `BOSS_PEOPLE_ADMIN`, ALWAYS, and the
  root's comment said otherwise), F2 (`PAYROLL_VIEW` and `PAYROLL_EDIT` in Mantle), F26 (the deny rows; there are thirteen,
  not twelve: Admin P6's `pause|reconcile|retry|transfer` row at the end of BossSetupData names the packages too), F27 and F58
  (the readiness contract: Registry.js then, the framework's Readiness.js now, reads a provider's `checks` list and leaves out a refusal whose
  code is in its list, `ORGANIZATION_DENIED` among them), F39 and F49 (no PartyRelationship filter; `userOrgIds` reaches the
  direct `PrtOrgRollup` children only), F50 (manager to report), F59 (Party owner `_NA_`).
- Access (`data/BossSetupData.xml`, appended but for the deny rows and the registry comment):
  - the groups `BOSS_PEOPLE` (root user group) and `_READ`, `_SELF`, `_MANAGER`, `_HR`, `_RECRUIT`, `_PAYROLL`,
    `_PAYROLL_APPROVE`, `_DEVELOP`, `_CASE`; on the `BOSS_PEOPLE` artifact group (a second element of the same id) the
    `ironstone\.people\..*` service pattern and the root authz `BOSS_PEOPLE_ROOT` (ALLOW, `MANTLE_USER_ORG`,
    `MANTLE_PRIVATE_CONTACT`); `BOSS_PEOPLE_ADMIN` keeps its ALWAYS row (AppOrganizationFilters asks ALWAYS of every app
    administrator but Admin's and Insights') and gains `PEOPLE_CONFIGURE`; `BOSS_PEOPLE_SELF` has no root grant;
  - `BOSS_PPL_SETTINGS`: the Settings area denied to `BOSS_PEOPLE`, so only the People administrator and `ADMIN` (through
    their ALWAYS on the root) open it;
  - design §1.1's grants; `PEOPLE_IMPORT` to `BOSS_PEOPLE_HR`;
  - `people` in all thirteen client deny rows (the longest 244 of 255, the next 240); no grant of a `mantle.humanres` entity
    or REST path.
- Mantle (`data/MantleSetupData.xml`): the thirteen `PEOPLE_*` permissions and `PAYROLL_APPROVE`, each granted to `ADMIN`,
  beside `PAYROLL_VIEW` and `PAYROLL_EDIT`. `mantle.humanres.PeopleServices` over `People.js` (tables `capabilityPermissions`,
  `homeCounts`, `readinessChecks` for later phases):
  - `get#Scope`: capabilities (sixteen, and `staff`: a view of an employer from `PEOPLE_DIRECTORY_VIEW`, `_HR_VIEW`,
    `_RECRUIT_VIEW`, `_DEVELOP_VIEW`, `_CASE_HANDLE`, `_CONFIGURE` or `PAYROLL_VIEW`; an edit, import or approve permission
    alone reads nothing); a staff reader's employers (their `userOrgIds` holding `OrgInternal`, only the active one when it is
    theirs; every internal organization, or the active one, for `ADMIN`); `unitPartyIds` (the `OrgDepartment` and `OrgTeam`
    organizations rolling up to them, walked level by level, at most twelve); own current employments; a holder of
    `PEOPLE_TEAM_VIEW`'s live reports. With `organizationPartyId`, narrows and refuses one outside (`ORGANIZATION_DENIED`);
    with `partyId`, answers `partyAccess` (self with `PEOPLE_SELF_SERVICE`, team, staff: an employment by an employer in scope,
    in effect on `asOfDate` for a directory reader, any for an HR reader) and the employments it shows, and refuses as a
    missing person (`RECORD_UNAVAILABLE`);
  - `get#Home`: refused without a staff read (`PERMISSION_DENIED`); headcount (distinct people) and employments for a staff
    reader, joins and exits of 30 days for an HR reader, `hasEmployees`, and the due work an HR reader clears (employees with no
    live manager, the first 20 by name, with `dueWorkCount`); no pay;
  - `get#Readiness`: the registry's contract with no adapter, `PEOPLE_CONFIGURE`, per employer in scope (or the one asked,
    `ORGANIZATION_DENIED` outside): for an employer with current employees, `people.departments` (warning
    `NO_DEPARTMENT`) and `people.managers` (warning `EMPLOYEE_NO_MANAGER` with the count), `fixRoute` `peopleSettings`, each check
    that fails shown unavailable and the others going on; an employer with no employees answers no check.
- BOSS `ironstone.people.ContextServices` over `service/ironstone/people/People.js` (tables `areas`, `recordKinds`,
  `searchFinds`, `choiceSources`, `linkPaths`): `get#SharedContext` (the root grant read from the user's own groups, as
  Insights.js; Mantle's scope, the Settings area, employer options, units, own party and employments, `sharedLinks`; refusals
  `PEOPLE_UNAVAILABLE`, `PEOPLE_CONTEXT`), `check#Record` (`organization`, `person` through `get#Scope`; `RECORD_UNAVAILABLE`),
  `get#Choices` (`employers`, `units`, `people`: current employees of the employers, live reports and self, by name in the
  query ignoring case, a person employed by two employers once) and `search#Records` (no source yet: P2's directory).
  `template/PeopleParts.xml` holds the `choices` transition.
- Screens: the root (`get#SharedContext` in always-actions; `<shell-providers>` with the `people` keymap, `g p` People home;
  the stale comment replaced, F1); Home (HomeScope: employer and as-of date; Summary's number cards; DueWork, an HR reader's;
  the first-use state linking Settings for the administrator; a user who reads no employer is told so); Settings, a parent
  with SettingsHome (SetupReadiness over `get#Readiness`, by employer, state chips with tui texts). The six other placeholders
  are removed. Menus: a staff group's is Home; the administrator's and `ADMIN`'s Home and Settings.
- Admin's registries (owner contracts): People's ten capability bundles (sequence 1100–1200; the launcher's artifact with the
  root's filter sets; private person data, pay and cases as sensitive), the readiness provider `people.setup` (business,
  organization scope, `PEOPLE_CONFIGURE`, fix People/Settings) and the settings entry `people.settings` (People/Settings,
  view `PEOPLE_CONFIGURE`); the registry comment no longer lists People as left out.
- Demo: `data/BossPeopleDemoData.xml` (Retail: Greta Haugen leading Hannah Okafor, who leads Tomas Lindqvist, Ines Varga and
  Rafael Mbeki, joined Oct 26; Leon Ferreira with no manager; Walter Pruitt's employment ended Jun 30; Priya Natarajan employed
  by Retail and Services; Services: Amara Diallo leading Kenji Arakawa, Sofia Brandt and Owen Castillo; each with a work email
  and phone; Nadia Kowal a contractor of Retail by `PrtAgent`; no department). `BossUsersDemoData`: `people.reader`, `.hr`
  (Retail only), `.recruiter`, `.payroll`, `.payapprover`, `.develop`, `.case` (Retail agents in `BOSS_PEOPLE` and their
  group), `people.manager` (Hannah) and `people.employee` (Tomas, `BOSS_PEOPLE_SELF` alone), `people.admin`
  (`BOSS_PEOPLE_ADMIN` alone, Retail and Services); each in `BOSS_USERS`, none in `ADMIN`.
- Specs: `test/People/PeopleSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`, `screenRefusal`,
  `hit`, `shell`); `PeopleAccess` (7 features, 2.1 to 3.8 s feature time over five runs, the slowest feature 0.6 s: the context and its refusals; the
  menu, keys and launcher; each group's capabilities exactly, with a spec-local user in `BOSS_PEOPLE` holding `PEOPLE_HR_EDIT`
  alone reading no employer, person or choice; the HR officer refused Services' employee and employer with Retail's
  parameters, the manager refused a colleague; the raw `mantle.humanres` REST paths and `get#Home` called directly refused;
  Home's one qvt render as `people.hr` and Settings' one html render as `people.admin`, the HR officer's a refusal; Admin's
  `get#Readiness` reading `people.setup` for Retail and `find#Settings` showing `people.settings` to the administrator and not
  the HR officer). Mantle `test/humanres/PeopleScope` (4 features, 1.1 to 1.8 s: employers and units, another and a forged
  employer refused, an edit permission alone reading nothing; a person admitted by employment and its dates, the reporting line
  and self, refused by reason code otherwise; Home's distinct headcount against employments, joins, exits and due work; the
  readiness contract and its refusals). Acceptance, written and not run: `acceptance/People/PeopleFoundationWalk` (4 features:
  every group's menu with each entry opened and the other refused; `people.hr`'s Home of Retail and not Services, the
  administrator's of Services, the manager's notice, `people.employee` refused; the client and the PASS account refused the
  root and every `ironstone.people` service; Admin's Health and settings index showing People's rows to `ADMIN` and not to the
  Admin reader).
- Tests run (release binary, `--nobuild`, this worktree's runtime): PeopleScope 4 of 4 and PeopleAccess 7 of 7; the shared
  files' specs: ProjectsAccess (the deny rows), AdminAccess, AdminRegistries, AdminCapabilities, AdminGroups,
  AdminOrganizations, AdminUsers, AdminLifecycle, AppOrganizationFilters, InsightsAccess, CommerceAccess, Contacts and Resources
  (the demo's new employees), 120 of 120 with PeopleAccess (mr-boss 25.9 s feature time); Mantle's HumanResServices,
  PayrollServices, PayrollAdjustments, InternalOrganizations, OrganizationRowFilter, ContactBooks, StaffIdentity, UserLifecycle,
  WorkResources, WorkTimeEntries, UniversalSearch, MantleSearch, BusinessTime and TimeImports with PeopleScope, 115 of 115.
  `moqui lint --screens`: 135 flagged sites, as on master, none in the People screens. Prettier clean on the new JavaScript.
  Not run: `./moq test-apps`, the acceptance suite (AppStructure renders the People root's default screen, and TuiRender and
  the sweeps find no People placeholder now).
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (HumanRes/dashboard has no form; the HumanRes rows
  are P4, P10 and P23's).
- Design edits: design-people §1.1 (the root user group, the Settings area, the employers and units of a staff reader), §1.2
  (the `people` keymap), §3 Home (Summary's counts and DueWork from `get#Home`).
- Findings, numbered by the lead F72 to F75 in order:
  - the client deny pattern has thirteen rows, not twelve (F26): Admin P6's transfer row at the end of BossSetupData names the
    packages too; `people` is in it, and Maintenance's split should count it (226 characters with `people`);
  - a comparison condition (`>`, `<=`) on a timestamp field is not converted from a number of milliseconds, which reaches
    Postgres as text ("date/time field value out of range"), though docs/dev/JS-Globals.md "Dates and times" says a find
    condition on a date field takes one; `conditionDate` does convert it. People passes a JavaScript `Date`, as
    ReturnPolicies.js's `stamp` does. A framework note: the conversion, or the reference;
  - Warehouse's returns organization `BOSS_WH_RETURNS` (OrgInternal, rolling up to Retail) is among a Retail staff reader's
    employers, as F49's one level of children makes it in every app; it has no employees, so it counts nothing and has no
    readiness check, but it is an employer choice. P3's OrgStructure shows it as a legal organization under Retail (§5 Q6);
  - People has no all-organizations permission: a People administrator who is not `ADMIN` works in the organizations they are
    a member of, whatever their root grant's `MANTLE_ACTIVE_ORG` (Mantle reads no BOSS grant), where Commerce and Warehouse have
    `COMMERCE_ALL_ORGANIZATIONS` and `FACILITY_ALL_ORGANIZATIONS`. The demo administrator is an agent of Retail and Services.
- For the lead:
  - the budget: mr-boss's share is PeopleAccess's 2 to 4 s server (no client spec), mr-mantle's PeopleScope's 1 to 2 s, within
    §4's estimates;
  - merge hot spots: `data/BossSetupData.xml` (the thirteen deny rows, the registry comment near the capability bundles, and
    the People block appended at the end), `data/BossUsersDemoData.xml` (appended at the end), mr-mantle
    `data/MantleSetupData.xml` (after `PAYROLL_EDIT`); Maintenance's P1 adds `maintenance` to the same deny rows;
  - the user's call: whether People gets an all-organizations permission for its administrator (the last finding), and
    whether an OrgInternal child organization with no employees should be an employer choice;
  - Commons' palette has a "People" group (contacts); P2's directory source needs another group name.

**Review Nov 11 (P1).** A fresh review of `git diff master...ppl/p1` in mr-mantle and mr-boss against the phase's text, §2,
§4, design §1.1, §1.2, §1.4, §3 Home, §12 Settings and crosscut §1.4, access and scope first; fixes committed apart per
repository ("People P1 review: …"; mr-mantle 07c5e38b).
- Checked and found sound:
  - Permissions and groups. Mantle seeds the thirteen `PEOPLE_*` permissions and `PAYROLL_APPROVE`, each granted to `ADMIN`,
    beside `PAYROLL_VIEW` and `PAYROLL_EDIT`, and names no BOSS group. BossSetupData's grants are design §1.1's table exactly;
    no group outside People holds a People or payroll permission. The root user group on Commerce's pattern (ALLOW with
    `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, the `ironstone\.people\..*` service pattern on the same artifact group),
    `BOSS_PEOPLE_ADMIN`'s ALWAYS kept, `BOSS_PEOPLE_SELF` with no root grant, Settings denied to the root user group, no
    `mantle.humanres` entity or REST grant. `people` is in all thirteen client deny rows; the longest is 244 characters.
  - Mantle's scope (`People.js`). Capabilities come from permissions through `ProductAccess.has` (a Projects client contact
    holds none); `staff` only from a view permission, so an edit, import or approve permission alone reads no employer. A
    staff reader's employers are their `userOrgIds` holding `OrgInternal` (the active one when theirs); units are walked by
    `PrtOrgRollup`, bounded at twelve levels. A person is admitted as self (own party and `PEOPLE_SELF_SERVICE`; a supplied
    party never widens it), team (a live `PrtManager` from the caller, for `PEOPLE_TEAM_VIEW`) or staff (an employment by an
    employer in scope: current on the date for a directory reader, any for an HR reader), else refused as a missing one
    (`RECORD_UNAVAILABLE`); another and a forged organization are both `ORGANIZATION_DENIED`. Reads run with authorization off
    only after the check. `get#Home` refuses a caller who reads no employer, gives joins, exits and due work to an HR reader
    only and counts no pay. `get#Readiness` asks `PEOPLE_CONFIGURE`, answers the contract's fields, refuses an organization
    by a code the framework's Readiness.js leaves out (`refusalCodes`), and shows a failing check unavailable by name.
  - BOSS (`People.js`, ContextServices). The root grant is read from the user's own groups (ALWAYS over DENY over ALLOW);
    another `appRoot` is refused and the answer's `appRoot` is always People; `check#Record` admits a person through
    Mantle's `get#Scope` and refuses a missing and an unauthorized record alike; `get#Choices` is a table of named sources
    (an unknown one throws), searches in the query ignoring case and admits a selected value only in scope; the palette
    returns nothing. No pay value is in the shared context or any answer.
  - Screens. The root calls `get#SharedContext` in always-actions; Home and SettingsHome read their Mantle service in
    `actions` (`force-new`, `ignore-error`) and show a refusal as "not available"; no count of a later phase; the state
    chips have qvt and tui texts (`JSON.stringify`); DueWork has phone columns. Chatter and RecordFiles under the root are
    now open to People users: that adds no reach beyond Commons' mounts of the same screens, open to every BOSS user; the
    HR hosts' branches are P2's (F66).
  - Registries and demo. Ten capability bundles matching the grants, the readiness provider `people.setup` and the
    settings entry `people.settings` as the phase says. The demo's thirteen people, the dual employment, the contractor,
    the ended employment and the users (none in `ADMIN`) are as designed.
  - Specs. PeopleAccess has seven features with authorization on, renders Home once in qvt and Settings once in html (the
    other renders are refusals for other users), and each negative case has a positive twin with the same parameters.
    PeopleScope is standalone (spec-local organizations, people, groups and users).
- Fixes:
  - **R1 (the user's call 1).** `PEOPLE_ALL_ORGANIZATIONS`: Mantle seeds it granted to `ADMIN`; `get#Scope` takes every
    internal organization, or the active one, as a staff reader's employers for its holder (capability `allOrganizations`,
    which reads nothing by itself; `ADMIN` holds it through every permission, as before); BossSetupData grants it to
    `BOSS_PEOPLE_ADMIN` and puts it in that group's bundle; the demo administrator now reads every employer. PeopleScope
    checks an agent of one organization holding it with an HR read (both organizations, `allOrganizations`, the other's
    employee admitted) and the permission alone (no employer); PeopleAccess's capability table has it for the administrator
    and its first feature checks the administrator's `allOrganizations`. §4, design §1.1 and crosscut §1.4 say so.
  - **R2 (medium).** `get#Scope` with `organizationPartyId` narrowed the employers it returned but admitted `partyId` by the
    whole scope and returned every employer's units: an HR reader of A and B asking within A was told B's employee was in
    `staff` scope, with no employment shown. The units and a staff admission are now the asked organization's (scope is the
    intersection, §2); PeopleScope checks the refusal and the same person admitted without the organization.
  - **R3 (low).** PeopleAccess's raw REST check passed any answer but 200, so a missing path passed; it now requires a
    refusal (401, 403 or not authorized), which holds for the three paths.
  - **R4 (low).** Headcount read every employment row of the employers to count people; it and the employees without a
    manager now read the people's ids distinct in the query (Practices-App-Dev §4 Queries). The readiness counted an
    organization's employees outside the per-check `try`; an organization that fails there is logged by name and the others
    go on.
- Findings, numbered by the lead F76 to F78 in order:
  - a date-only as-of (Home's "As of") is the start of that day, so an employment beginning that day (the demo's rows start
    at 09:00) is neither current nor a join on it; `conditionDate` reads every as-of so. Whether People takes a date-only
    as-of as the end of its day is for P2's directory, which takes the same parameter;
  - the demo's dated rows age: Rafael's join (Oct 26, 2026) leaves Home's 30-day joins after Nov 25 and Walter's exit
    (Jun 30) already has; no regression spec counts them (PeopleScope dates its own rows from now), but an acceptance check
    of a demo join or exit count would need dates relative to the load;
  - `get#Scope`'s capability `allOrganizations` (the permission) sits beside its out-parameter `allOrganizations` (every
    employer now, no active organization); both are documented, and a later reader should not take one for the other.
- Tests (release binary, `--nobuild`, this runtime): before the fixes PeopleScope 4 of 4 (2.5 s feature time) and
  PeopleAccess 7 of 7 (2.3 s); after, PeopleScope 4 of 4 (1.4 s), PeopleAccess 7 of 7 (2.4 s) and AdminCapabilities 4 of 4
  (1.7 s; the bundle row). Prettier clean on the changed JavaScript. No screen changed, so no lint run. Not run: the
  acceptance PeopleFoundationWalk (its administrator still reads Services), `./moq test-apps`.
- For the lead:
  - budget share unchanged: PeopleScope 1.4 to 2.5 s on mr-mantle, PeopleAccess about 2.4 s on mr-boss;
  - merge hot spots beside the Built note's: mr-mantle `data/MantleSetupData.xml` (after `PEOPLE_CONFIGURE`), BossSetupData's
    People block (one grant, one bundle row), design-crosscut's header and §1.4 People row, and §4's three new rows;
  - the user's calls are in §4: 1 built (R1), 2 left as built, 3 recorded for P10, whose text already lists the work.

### P2 — Employees and Employee360

Design §4 Employees and Employee360 (Overview, EmploymentHistory, PersonalInfo, FilesAndActivity), §15 (the
directory export); PE-01 (projections, the employment content host), PE-02 (history), PE-18 (the registry).

- **Mantle PeopleServices:** `find#Employees` (the public work projection; HR columns with `PEOPLE_HR_VIEW`; search
  in the query, ignoring case; paged), `get#Employee360` (regions by capability, an omitted region absent from the
  answer), `get#EmploymentHistory` and `store#PersonalInfo` (self for the permitted fields, HR for the rest; tax and
  bank fields refused here). These read Party with the filters off after `get#Scope` and answer by employment, so a
  reader of one employer sees that employment and the public work identity of a person employed by two, nothing of
  the other (F59). The employment content host (employment content keyed by `partyRelationshipId`), registered as
  each HR host is (F66): an entry in `get#RecordLinkInfo`'s map with a visibility branch by People's scope, an entry
  in RecordFiles' `get#ContentType`, and no Records-drive folder. `get#EmploymentHistory` lists employments until P6
  adds their assignments.
- **`Shared/Employee360.xml`** (crosscut §3.4): takes `partyId`, an optional employment and `appRoot`; capabilities
  from the service; regions, fixed scope and actions from a per-app context table in People.js keyed by `appRoot`,
  which a later app adds its row to. Mounted at `People/Employees/Employee360`, at `Commons/People/Employee360` (own
  or public card; the first screen of Commons' People area, F46), and at `Insights/Records/Employee360` (Overview
  only, read), beside the record screens Insights mounts (F40). Projects' PersonDetail and Admin's UserDetail gain
  a link for the audience `get#Employee360` admits (F41); they and any app with no row link the People mount for a
  People user and the Commons mount otherwise. Each is an owner contract.
- **Chatter and RecordFiles** (design §13): the root's two mounts stay; under People they open only a host the
  HR services admit (the employment here, each later host with its phase), with no public sharing (RecordFiles has
  none, and an HR host has no Records-drive folder for Files to share, F66), and a person's Party timeline carries no
  HR child's content.
- **Screens:** Employees (FindEmployees, EmployeeList with phone columns, the scoped CSV); Employee360 with the
  record header and the four regions; the later regions arrive with their phases (Compensation P23, TimeAndLeave
  P12, SkillsAndReviews P18 and P20, AssignedEquipment P7). The palette's directory source (rows with `recordEntity`
  and `recordId`) and the Person `record-lookup`.
- **Specs:** Mantle `test/humanres/PeopleDirectory` (a reader's answer holds no private contact, identity or pay
  field; self edits only the permitted fields; a second employer's HR sees its own employment only); BOSS
  `PeopleEmployees` (Employee360's one qvt render as HR; the directory export's columns).
- **Usable when** (`acceptance/People/PeopleDirectoryUsable`; design §14.3 "Confidentiality across every path", its
  directory half): `people.reader` finds a colleague and sees work identity only, through the list, the palette, the
  export and a forged Employee360 link; `people.hr` corrects a home address; the employee corrects their own
  preferred name; Insights opens the Overview from a drill-down; Admin's UserDetail link opens Employee360 only for
  a user who may read it.

**Built Nov 11 (P2).** mr-mantle 10fa737c, mr-boss (branch `ppl/p2`).
- Checked first (the code over the plan): F59 (Party owner `_NA_`, no PrtEmployee filter: every read is by employment after
  `get#Scope`), F66 (`get#RecordLinkInfo`'s literal content map with a visibility branch per entity, RecordFiles' own map in
  `get#ContentType`, the Records drive's folder map leaving employments out), F40 (Insights/Records mounts no person; its path
  check serves a record screen and `InsightsRecord` only), F41 (UserDetail has no link), F46 (no Commons/People), F76 (a date-only
  as-of). Also: Mantle has no emergency contact record and no `EmailWork` purpose (the demo's work email is `EmailPrimary`); the
  `record-lookup` hook gives each record the first provider's info and card (`ChatScreenServices.lookup#Records`), and Comms'
  `boss.records` answers every visible Party; RecordFiles and Chatter render in qvt and tui only; a probe's error text is
  "Error: CODE: message", which EntityLib's `reasonCode` does not read; the `ironstone.people` services are People's artifact
  group, so a shared screen under Commons or Insights reaches them through that root's inherited grant only.
- Mantle (`mantle.humanres.PeopleServices` over a new module `Employees.js`; People.js exports its scope pieces):
  - `find#Employees`: one row per employment the scope reaches as of the date (a staff reader's employers, current, or with
    `includeEnded` any for an HR reader; a live report's; the caller's own with self-service; `PERMISSION_DENIED` for no reach):
    name, preferred name (`Person.nickname`), employer, job title (position class title, P4's), manager (live `PrtManager`), work
    email (`EmailPrimary`), phone (`PhoneWork`) and location (`PostalWork` city), state; for HR the employment's id, dates and
    termination reason. Search by name, preferred name or id in the query ignoring case; employer (refused outside,
    `ORGANIZATION_DENIED`) and manager filters; `EntityLib.page`, an export (`pageNoLimit`) up to 2000;
  - `get#Employee360`: the regions the scope admits, each other absent from the answer: `overview` for any reader (work identity,
    the employments it shows, HR's with dates, managers); `personalInfo` and `employmentHistory` for the person and HR of an
    employer of theirs; `filesAndActivity` (`hostEmploymentId`) for HR of the opened employment's employer. `partyRelationshipId`
    opens an employment the scope shows (else `RECORD_UNAVAILABLE`); a directory or team reader gets no employment id;
  - `get#EmploymentHistory` (HR's of the employers in scope, any dates; the person's all; else `PERMISSION_DENIED`);
  - `store#PersonalInfo`: the person changes preferred name, home and mobile phones; an HR editor these and legal names, birth
    date, gender and home address; `FIELD_NOT_PERMITTED` for another field changed, `NAME_REQUIRED`, `REVISION_CHANGED` at a
    revision other than the one read (a hash of the personal information), contacts by date through
    `ContactServices.store#PartyContactInfo` (`replaceByPurpose`); no tax or bank parameter;
  - the employment content host (PE-01): `EmploymentContent` (keyed by `employmentContentId`, `partyRelationshipId`, the
    `EmploymentContentType` enumeration), `check#EmploymentAccess` (an HR reader of the employer in scope, `canEdit` with
    `PEOPLE_HR_EDIT`; never refuses), `create#EmploymentContent` and `save#EmploymentContentFile`; `get#RecordLinkInfo` gains the
    content map entry and a visibility branch for `Employment` and `EmploymentContent` by `check#EmploymentAccess`, for every
    caller, authorization off too;
  - a date-only as-of is the end of that day (People.js `asOfMillis`, F76), for Home too.
- BOSS:
  - Screens: `People/Employees` (menu index 4, every People user's) with `Employees/List` (FindEmployees: name, employer, manager,
    as-of, HR's "Ended employments"; EmployeeList with phone columns, the state as a chip with its tui text, HR's dates by
    `hide`, `select-columns` and the CSV) and `Employees/Employee360`; `Shared/Employee360.xml` (the record header with the
    opened employment's state, Edit personal information for the fields the user may change there, the employment choices, and
    the boxes Overview, Personal information, Employment history and Files and activity, the last the employment's
    `record-files` and `chatter`); `Commons/People.xml` (out of the menu) mounting it; `Insights/Records/Employee360`. Home's
    Headcount and Employments cards open the directory and each due person their Employee360. The People root's Chatter and
    RecordFiles serve People's hosts only (`RECORD_PANEL_UNAVAILABLE` for another record), with the palette's "Employees" group
    (`search#Records` over `find#Employees`, rows with `recordEntity` `mantle.party.Party` and `recordId`), the
    `people.records` record-lookup (`lookup#Records`: search, info, card, links) and the `g e` key.
  - `ironstone.people.ContextServices`: `get#Employee360Context` (People.js `employee360Apps`, the per-app context: People
    every admitted region, Commons the Overview and the user's own personal information with their own corrections, Insights the
    Overview, read only, with the return; another root `PEOPLE_CONTEXT`; a person out of scope `recordFound` false),
    `get#Employee360Link` (the People mount for a People user whose scope admits the person as staff or team, the Commons mount
    for the person, else none) and `lookup#Records`. No Projects row: Projects mounts nothing (§1's "Projects row" is the link).
  - Owner contracts: Projects' PersonDetail and Admin's UserDetail headers link Employee360 (`get#Employee360Link`); Insights'
    Records mounts Employee360, `Records/Employee360` in its links and Records.js's return parameters exported (`returnOf`);
    Commons' `get#RecordInfo` names an employment ("Tomas Lindqvist at …"), `get#RecordLink` links it under People for an HR
    reader (People.js `employmentLink`), RecordFiles' `get#ContentType` adds `create#EmploymentContent` with an HR editor's
    change right.
- Specs: Mantle `test/humanres/PeopleDirectory` (4 features, 1.5 to 2.7 s feature time: a reader's rows exactly the public
  fields, search ignoring case, the manager filter, HR's columns and ended rows, another employer refused; Employee360's regions
  for reader, HR, a second employer's HR and the person, a forged employment refused; the person's preferred name and not legal
  name, a stale revision and a reader refused, HR's home address by date, the history HR's and the person's; the employment host
  for HR of its employer only, edited with `PEOPLE_HR_EDIT`, through `get#RecordLinkInfo` too). BOSS `test/People/PeopleEmployees`
  (4 features, 0.8 to 1.8 s: Employee360's one qvt render as HR; the CSV export's columns for the reader and HR; the per-app
  context for Commons, Insights, People and another root; the PersonDetail and UserDetail link, the palette rows, the lookup's
  search and card, and Commons' mount rendered once in html for the employee). `PeopleAccess` gains one feature (0.2 s: the
  employment's notes and files an HR officer's of its employer and not the reader's or another employer's, through the panels'
  record check; the People panels' files data opening the employment and refusing a Party), and its menus and keys now hold
  Employees and `g e` (PeopleSpecLib `staffMenu`, `adminMenu`). Acceptance, written and not run:
  `acceptance/People/PeopleDirectoryUsable` (5 features: the reader through list, palette, export and a forged link with a
  private phone and passport never shown; HR corrects a home address by the transition; the employee's preferred name and not
  legal name in Commons; Insights' Overview from a drill with the return and its transition refused; UserDetail's and
  PersonDetail's link for ADMIN and not for the identity operator or another app's user).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleScope, PeopleDirectory, RecordLinks,
  RecordVisibility, HumanResServices and PayrollServices, 56 of 56 (mr-mantle 6.0 s feature time); BOSS PeopleAccess (8 of 8),
  PeopleEmployees (4 of 4), Resources, AdminUsers, InsightsAccess, InsightsRecords, RecordFiles, Chatter, Contacts and
  ProjectsAccess, 125 of 125 (mr-boss 19.2 s). `moqui lint --screens`: 135 flagged sites, as on master, none in the changed
  screens; no TUI-text finding in them. Prettier clean on the new and changed JavaScript but Insights.js, which was not clean on
  master (one line added). Not run: `./moq test-apps`, the acceptance suite (PeopleFoundationWalk now walks Employees too, through
  `ids.adminMenu`).
- Inventories: ss-inventory's FindParty search and list forms and EditParty's person, identification, phone and postal purpose,
  note and content forms name the People screens; usl-inventory gains an Added table of the PeopleServices with their screens
  (P1's and P2's) and `store#PartyContactInfo` and `get#RecordLinkInfo` name Employee360.
- Design edits: design-people (header, §1.4 palette and Comms hooks, §4 Employees and Employee360 as built, §13 Chatter and
  RecordFiles, §15 the directory export); design-crosscut §3.4 and header; the owner designs: design-insights §10 (the Records
  mount), design-admin UserDetail, design-projects PersonDetail, design-drawers-commons (Commons/People, the record panels, the
  palette groups).
- Findings, numbered by the lead F79 to F84 in order:
  - Mantle has no `EmailWork` contact purpose; the directory takes `EmailPrimary` as the work email, as P1's demo stores it, which
    would publish a person's own address where their primary email is personal. A seeded `EmailWork` (and the demo on it) would
    make the work identity unambiguous;
  - Mantle has no emergency contact record; design §4 PersonalInfo names one. P2 shows none; a relationship type or entity is
    needed before SelfService (P8);
  - a manager is any live `PrtManager` and team access shows all of a report's current employments (P1's `partyAccess`), so a
    reader of one employer sees, in the Overview, a manager the person has at another employer, and a manager of a dual employee
    sees both employments; P3's reporting lines (and P6's assignments) are where a manager is per employment;
  - the `record-lookup` hook takes the first provider's info and card per record, and Comms' `boss.records` answers every
    visible Party, so People's Person card and info show only where Comms' does not answer; its search and links add People's
    rows. Comms' provider could defer an employee's card to People, or the hook prefer the more specific provider;
  - EntityLib's `reasonCode` reads `CODE:` at the start of a message only, and a probe's error is "Error: CODE: message"; People.js
    reads it with its own `codeOf`. A Mantle refusal a caller expects is still logged at ERROR with its stack by the service
    call (every "Not available" view of a person writes one);
  - the directory's department and location columns and filters, design §4's, wait for P3's units and P6's assignments; the
    identification write (AddIdentificationForm) is not built, identifications being read only here.
- For the lead:
  - the budget: mr-mantle's share PeopleDirectory 1.5 to 2.7 s; mr-boss's PeopleEmployees 0.8 to 1.8 s and PeopleAccess's new
    feature 0.2 s, within §4's estimates (no client spec);
  - merge hot spots: mr-mantle `service/mantle/party/CommunicationServices.xml` (the content map's end and the visibility branch
    before `financeEntity`), `entity/HumanResourcesEntities.xml` (after Employment), `People.js` (its exports); mr-boss
    `service/ironstone/shared/RecordFilesServices.xml` (the map's end, a branch before Party's), `ChatterServices.xml`
    (`get#RecordInfo`'s type chain), `commons/PaletteServices.xml` (`get#RecordLink`'s head), `insights/Insights.js` (linkPaths)
    and `Records.js`, `screen/Insights/Records.xml` (subscreens), `Admin/Users/UserDetail.xml` and
    `Projects/Resources/PersonDetail.xml` (the header actions), `test/People/PeopleSpecLib.js` (menus);
  - the user's call: whether Mantle seeds an `EmailWork` purpose for the work identity (the first finding), and whether the
    person may see their own employment's files (P2 gives them to HR only; the design's Commons row lists none).

**Review Nov 11 (P2).** A fresh review of `git diff master...ppl/p2` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §4 Employees and Employee360, §13, §15, §14.3 "Confidentiality across every path" (its directory half) and crosscut §3.4,
confidentiality first; fixes committed apart per repository ("People P2 review: …"; mr-mantle 42b38ad2).
- Checked and found sound:
  - Every Mantle service checks its own permission and scope after `get#Scope` and reads with authorization off only then;
    a supplied party, employment or `appRoot` grants nothing: `find#Employees` reaches only its staff, team and self rows and
    refuses another employer by code; `get#Employee360` opens only an employment the scope shows; `store#PersonalInfo` takes
    the person's three fields or an HR editor's, refuses another field unless unchanged, and checks the revision read (a hash of
    the personal information); `get#EmploymentHistory` is HR's of their employers and the person's own; `check#EmploymentAccess`
    and `create#EmploymentContent` admit an HR reader (editor) of the employer only. Missing and unauthorized answer alike
    (`RECORD_UNAVAILABLE`, "Not available").
  - Restricted values are left out by the service on every path: no private contact, identification, birth date, home address
    or pay in the list, the CSV (the same projection), the palette, the record-lookup card, Employee360's Overview or the
    Insights and Commons mounts (each narrows Mantle's answer and adds nothing); identifications are HR's, masked, never tax
    ones; no tax or bank parameter. The employment content host is in `get#RecordLinkInfo`'s map with a visibility branch that
    holds with authorization off and for no user, and in RecordFiles' map with an HR editor's change right; the People root's
    panels refuse any other record; a Party's timeline carries none of it.
  - Owner contracts: PersonDetail and UserDetail only add a header link from `get#Employee360Link` (in an error frame, no link
    on a refusal); Insights' Records mount stays read only by its path check (no transition of Employee360 is served there);
    Commons' `get#RecordInfo`, `get#RecordLink` and RecordFiles' `get#ContentType` gain an employment branch after the
    existing visibility check; `Records.js`' `returnOf` is a pure extraction.
  - Screens: no route fixture; Employee360 rendered once in qvt (People) and once in html (Commons), its own `render-mode`
    section allowing the second mode; specs well under 15 s.
- Fixes:
  - **R1 (the user's call 1).** Mantle seeds `EmailWork` ("Email - Work", PartyEntities); `Employees.js` reads the work email
    from it alone, so `EmailPrimary` (perhaps personal) reaches no People projection; People's demo stores the twelve
    employees' work emails under it (the contractor keeps her `EmailPrimary`). PeopleDirectory stores a personal `EmailPrimary`
    beside the work one and checks the list and Employee360 never show it. No other app's spec reads the demo employees'
    emails; Commons' contact purpose drop-down now offers "Email - Work". §4, design §4 Employees.
  - **R2 (medium, the worker's flag).** A manager was any live `PrtManager`, so a reader (or HR) of one employer saw, in the
    list and the Overview, the manager a person employed by two has at the other employer, and the manager filter matched rows
    of an employer the manager does not work for. A manager is now shown on an employment when employed by its employer or by
    none (`managersAt`), and the filter keeps the manager's employers. PeopleDirectory: B's HR sees the dual employee with no
    manager of A's.
  - **R3 (medium).** HR's columns (the employment's id, dates and termination reason) and Employee360's employment ids were
    given for every row an HR reader reached, also a report's employment at an employer outside their scope (team reach). They
    are now per row, for an employment by an employer in the HR reader's scope (the person still sees their own ids).
    PeopleDirectory: an HR officer of A who manages a person employed by A and B gets the dates and id of A's employment only,
    in the list and Employee360.
  - **R4 (low, the worker's flag).** An expected "no" was a refusal thrown by a Mantle service, logged at ERROR with its stack
    on every Projects PersonDetail and Admin UserDetail view of a person the viewer may not read, every record-lookup card of
    such a Party and every "Not available" Employee360. `get#Scope` and `get#Employee360` take `checkOnly` (as
    `get#RecordLinkInfo` does): a person or employment missing or outside the scope answers no access instead, alike either
    way; `get#Employee360Context`, `get#Employee360Link` and the lookup use it. PeopleDirectory checks both answers; a
    PeopleEmployees run now logs only its deliberate `PEOPLE_CONTEXT` refusal.
  - **R5 (low, the worker's flag).** The record-lookup answered `visible: false` for a person People does not admit; the hook
    keeps the first provider's answer per record, so placed first it would hide Comms' answer for every customer and contact.
    It now leaves such a person out (PeopleEmployees checks it). Its order behind Comms' `boss.records` is left as it is (a
    provisional finding).
  - **R6 (low).** `capabilities.selfFields` listed every field for a reader who may change nothing; it is now empty unless the
    caller is the person (three fields) or an HR editor (all). `get#Employee360Link` labelled the Commons link "My employee
    record" for anyone but a People user; it says so only for the person.
  - **R7 (low, conventions).** PeopleEmployees rendered `Employees/List` twice in csv (reader and HR); it renders it once, as the
    reader (the public columns, no dates); HR's columns are Mantle's PeopleDirectory.
- Findings, numbered by the lead F85 to F88 in order:
  - the record-lookup hook keeps the first provider's info and card, and Comms' `boss.records` (sequence 0) comes before
    `people.records` (30) and answers every visible Party, so People's Person info and card never show; its search and links do.
    Putting People first (a negative sequence) now leaves non-employees to Comms (R5) but changes Comms' room titles and cards
    for every employee a People user reads: an owner decision with Comms, not made here;
  - team access (P1's `partyAccess`) shows a manager every current employment of a report, at any employer, and Home's due work
    counts a person managed at one employer as managed at both; P3's reporting lines per employment should settle both, with
    `managersAt` (R2) replaced by them;
  - every refusal a JavaScript service throws is logged at ERROR with its stack (`core::service::call` `record_failure`), across
    the apps; People now avoids it where a "no" is expected (R4), but a framework note (a refusal with a reason code logged at
    INFO or WARN without the stack) would serve every app;
  - `create#EmploymentContent` takes `userId` and `contentDate` from the caller, as Mantle's other `create#*Content` services do
    (auto-parameters `nonpk`); the uploader recorded is the caller's word.
- Tests (release binary, `--nobuild`, this runtime): before the fixes PeopleDirectory and PeopleScope 8 of 8 (mr-mantle 4.9 s
  feature time), PeopleEmployees and PeopleAccess 12 of 12 (mr-boss 5.7 s). The new PeopleDirectory checks failed on the
  unfixed `Employees.js` (the manager across employers, the reader's field list) and pass after. After: PeopleDirectory and PeopleScope 8 of 8 (mr-mantle 3.0 s; PeopleDirectory 1.7 s), PeopleEmployees and
  PeopleAccess 12 of 12 (mr-boss 3.5 s; PeopleEmployees 0.9 s, PeopleAccess 2.6 s); the
  touched specs: Mantle RecordLinks, RecordVisibility, HumanResServices, ContactBooks, PartyServices and StaffIdentity 76 of 76
  (7.2 s); BOSS Resources, AdminUsers, InsightsRecords, InsightsAccess, Contacts, Chatter and RecordFiles (with a dependency) 104
  of 104 (13.6 s). Prettier clean on the changed JavaScript. No screen changed, so no lint run. Not run: `./moq test-apps`, the
  acceptance PeopleDirectoryUsable.
- For the lead:
  - budget share: PeopleDirectory gains a person, a user and five calls (about 0.1 s); PeopleEmployees renders one csv fewer;
    both within §4's estimates;
  - merge hot spots beside the Built note's: mr-mantle `entity/PartyEntities.xml` (the email purposes' seed),
    `People.js` (`checkedAccess` and its export), `PeopleServices.xml` (`get#Scope`'s and `get#Employee360`'s `checkOnly`);
    mr-boss `data/BossPeopleDemoData.xml` (the purposes), §4's two new rows and design-people's header and §4;
  - the user's calls are in §4: 1 built (R1), 2 left as built (design §4 Employee360 says so).

### P3 — Organization and reporting

Design §4 OrgStructure and OrgChart; PE-03 (units, teams, reporting).

- **Mantle `mantle.humanres.OrganizationServices`:** `find#Units` (the tree, lazy children, as-of counts),
  `store#Unit` (a department with the `OrgDepartment` role or a team with `OrgTeam`, a dated `PrtOrgRollup` to its
  parent; cycles, moves across legal employers and stale dates refused; F11), `store#Membership` (a dated
  `PrtMember` row; never an employment; from role `Assignee` for a member, as Mantle's demo, and `Manager` for the
  team's lead, which BusinessTime's hours access reads, F63), `get#ReportingTree` and `change#Manager`
  (a dated `PrtManager` row from the manager to the report, as the time services read it, F50; self and cyclic
  reporting refused; people with no manager listed, not lost).
- **Screens:** OrgStructure (OrganizationTree on `view-tree`, EditUnit, TeamMembers); OrgChart (ReportingTree with
  `views="tree,list"`, ChangeManager). The first choices sources for units and managers.
- **Demo data:** departments under ORG_ZIZI_RETAIL and ORG_ZIZI_SERVICES with the `OrgDepartment` role; Mantle's demo
  units that are `OrgInternal` stay legal organizations (F12, §5 Q6); the two demo teams keep their members.
- **Specs:** Mantle `test/humanres/PeopleOrganization` (a cycle refused; a reparent dated, the old row ended; a
  team membership changes no employment; a manager change dated and refused when cyclic).
- **Usable when** (`acceptance/People/PeopleOrganizationUsable`): `people.hr` adds a department and a team, moves
  the department from a date and sees both parents by as-of date; changes a manager from next month; `people.reader`
  walks the chart one level at a time in the browser and the terminal and edits nothing.

**Built Nov 11 (P3).** mr-mantle f1339a6a, mr-boss (branch `ppl/p3`).
- Checked first (the code over the plan): F11 and F12 (`OrgDepartment` exists; Mantle's demo departments ORG_ZIZI_HR and ORG_ZIZI_SALES
  are `OrgInternal` under ORG_ZIZI_CORP; its two `OrgTeam` teams have no rollup at all, so no employer's tree held them), F13 and F63
  (Mantle's demo members are from role `Assignee`; BusinessTime reads a `Manager` from role; Customer Service's service teams are
  `OrgTeam` parties with `PrtServiceTeam` memberships, roles `Agent` and `Manager`, written by `SupportCaseServices.save#ServiceTeam`, with
  no rollup), F49 (`get#PartyInternalOrgIds` adds an internal organization's direct `PrtOrgRollup` children of any role to `userOrgIds`, so
  a department directly under an employer would join every app's organization scope: the shell's organization list, Accounting's
  organization options, Commerce's owners), F50 (the line runs from the manager to the report; Projects' demo line from John Doe, an
  agent and no employee, to Ana), F81 and F86 (a manager was any live `PrtManager`, and team reach every employment of a report), §5 Q6.
  Also: a `view-tree` row fetched as its parent opens is drawn from its fields' text, with no link or dialog (WebrootVue.qvt.js
  `m-list-tree` `cellText`; only the page's rows have their template); `container-dialog`'s `type` defaults to primary; `container-box`
  takes no condition.
- Mantle:
  - reporting lines per employment (People.js `linesOf`, `managersByEmployment`, `employersOfParties`): a line's employers are those of the
    report that employ the manager too, a manager employed by no one being a line at each of the report's employers (as P2's
    `managersAt`). `get#Scope`'s reports are the caller's lines (and their employers, `reportLines`), so a team reader sees a report's
    employments at those employers only (F86); `get#Home`'s due work and the `people.managers` readiness count an employment with no
    line at its employer, so a person managed at one employer is due at the other. Employees.js reads the managers of each employment
    from the lines (`managersAt` replaced), its manager filter keeps the line's employers, and a team reader's directory rows are the
    report's employments at the line's employers;
  - `mantle.humanres.OrganizationServices` over a new module `Organization.js`: `find#Units` (the tree a level at a time as of a date:
    the top, the children of a parent, or units found by name ignoring case; each row's kind, parent and since when, employer, lead,
    people, children shown, `canEdit` and revision), `get#Unit` (one unit: its row, its dated parents with reasons, its dated
    memberships), `store#Unit` (a department or team under a parent from a date, owned by its employer; a rename, a move from a date
    ending the rollup in effect, a new lead; refusals `KIND_INVALID`, `NAME_REQUIRED`, `PARENT_REQUIRED`, `RECORD_UNAVAILABLE`,
    `NOT_A_UNIT` for an internal organization, `PARENT_KIND` for a department under a team, `EMPLOYER_CHANGE`, `PARENT_CYCLE`,
    `DATE_STALE`, `PARENT_SCHEDULED`, `REVISION_CHANGED`), `store#Membership` (a member from role `Assignee` or the lead from `Manager`
    from a date, an employee of the unit's employer then; a role change ends the other row; a new lead's predecessor stays a member;
    an end at the row's revision; `NOT_EMPLOYED`, `ALREADY_MEMBER`, `MEMBERSHIP_SCHEDULED`, `MEMBERSHIP_ENDED`, `DATE_STALE`),
    `get#ReportingTree` (a node per current employment under its line's manager at that employer; the top the employments with no
    manager there, `noManager`; a manager's reports, a node's (`parentNodeId`), a person's own nodes or a name search; the directory's
    public work identity and the report count; an HR editor's `lineRevision`; paged) and `change#Manager` (the line at an employer
    ends on a date and the new one starts, or none; `SELF_REPORTING`, `REPORTING_CYCLE` up the lines at that employer,
    `MANAGER_NOT_EMPLOYED`, `MANAGER_UNCHANGED`, `MANAGER_SCHEDULED`, `NOT_EMPLOYED`, `ORGANIZATION_REQUIRED`, `REVISION_CHANGED`).
    Reads need a staff read of an employer, changes `PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT`; a change reason is the ended row's audit
    (`thruDate_changeReason`) and the new row's comment; nothing is deleted;
  - `PartyServices.get#PartyInternalOrgIds` takes an internal organization's direct children only when they are internal too (F49): a
    department or team is never one of a user's organizations. No row of the existing data is another kind of child.
- BOSS:
  - Screens: `People/Employees` is a menu group (Employees, the list, now in the menu at index 1; Organization; Org chart), the keys `g o`
    and `g c`. `Employees/OrgStructure`: New unit (the one primary), FindUnits (employer, unit name, as of), OrganizationTree
    (`views="tree,list"`, `view-tree` with `children-transition="unitChildren"`; kind chips with tui texts), and the unit opened by
    `unitPartyId`: its facts and dated parents, Edit (EditUnit, with a confirmation), TeamMembers with Add member and End (a danger
    submit with a confirmation naming the person). `Employees/OrgChart`: FindChart, the level (Up to the manager, Top), ReportingTree
    (`views="tree,list"`, `reportChildren`, paged by the service; "No manager" chip with its tui text; the reports count opens the next
    level), and Change manager per row for an HR editor (back to the new manager's level after the change).
  - `ironstone.people`: the `employees` choice (one employer's current employees, `choiceOrganizationPartyId` through PeopleParts'
    `choices`), `sharedLinks` for the two screens. No new access rule in BOSS: both screens are Employees', open to every People user,
    and Mantle checks every read and change.
  - Demo (`BossPeopleDemoData.xml`, appended): Retail's Store Operations (lead Hannah; Tomas, Ines, Rafael) with its Sales Floor team
    (lead Ines; Tomas) and Merchandising (lead Priya; Leon); Services' Service Delivery (lead Amara; Kenji, Sofia, Owen), with Mantle's
    two demo teams rolled up under it and keeping their members; Priya reports to Amara at Services as well as to Greta at Retail.
    People's setup readiness now has each employer's departments ready.
- Specs: Mantle `test/humanres/PeopleOrganization` (4 features, 2.3 s feature time: the units, a cycle, a department under a team,
  another employer, a stale date and revision, a reader and an internal organization refused, a move dated with both parents read by
  as-of date and a later move refused; a team's members and lead, the predecessor a member, no employment changed, a person of another
  employer refused, an end at a stale revision refused; a manager change from next month with the line before ended, self, cyclic and
  outside managers, a stale line and the unchanged manager refused, the people with no manager at the top; the line per employment for
  the team reader's scope and directory, the other employer's Home due work, tree, manager column and manager filter). BOSS
  `test/People/PeopleOrganization` (3 features, 0.5 s: OrgStructure's one qvt render as HR with Store Operations open; the tree's next
  level and another employer's refused; OrgChart's one qvt render as the reader, no Change manager, and a level per employment).
  `PeopleAccess` gains one feature (0.3 s: a unit's members and a reporting line, HR of Retail answered for what it asks with the
  parameters the reader is refused with `PERMISSION_DENIED`, Services' unit and employee refused to Retail's HR) and its keys and
  readiness expectations follow the demo (`ids.keys`; departments ready). Acceptance, written and not run:
  `acceptance/People/PeopleOrganizationUsable` (3 features: HR adds a department and a team through `storeUnit`, moves the department
  from next month and sees both parents by date; HR changes Rafael's manager from next month through `changeManager`; the reader walks
  the chart top, Greta, Hannah in qvt and tui with no change offered, and a forged change and unit refused).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleScope, PeopleDirectory, PeopleOrganization,
  InternalOrganizations, OrganizationRowFilter, HumanResServices, PayrollServices, WorkResources, BusinessTime, WorkTimeEntries,
  StaffIdentity, UserLifecycle, PartyServices, SharedDevices, RecordLinks, RecordVisibility, ContactBooks, CalendarChanges,
  SupportAssignment, UniversalSearch and MantleSearch, 165 of 165 (mr-mantle 21.2 s feature time); BOSS PeopleAccess (9 of 9),
  PeopleEmployees, PeopleOrganization, ProjectsAccess, Resources, TimeEntries, AppOrganizationFilters, AdminOrganizations,
  CustomerServiceCases, InsightsAccess, InsightsRecords and Contacts (with a dependency), 112 of 112 (mr-boss 22.4 s); the People
  specs again after the last screen change, 16 of 16. A one-off tui and html render of both screens (not kept) found the Top and Close
  links carrying the level, fixed. `moqui lint --screens`: 135 flagged sites, as on master, none in the People screens; no TUI-text
  finding in them. Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: ss-inventory's EditParty EditOrganizationForm and PartyRelated's four relationship forms name OrgStructure and OrgChart;
  usl-inventory's People Added table gains the six OrganizationServices, and PartyServices `create#Organization` and `ensure#PartyRole`
  name OrgStructure and OrgChart.
- Design edits: design-people (header; §1.2 the keys and the Employees group; §4 departments never a user's organization; §4
  Employees' manager column; OrgStructure and OrgChart as built).
- Findings, numbered by the lead F89 to F94 in order:
  - `get#PartyInternalOrgIds` admitted every direct rollup child into `userOrgIds` and so `filterOrgIds` (F49), which would have put
    People's departments into every app's organization scope; P3 admits internal children only. A Mantle change outside `humanres`,
    with no effect on the existing data, for the reviewer's eye;
  - a `view-tree` row fetched as its parent opens has its fields' text and no link, dialog or Enter target: OrgStructure and OrgChart
    open a unit or a level from the page's rows and links instead. A framework note: the page's row template for a fetched row would
    make a tree's links and row actions work at every level;
  - a reporting line names no employer, so P3 reads its employers from the employments. Left for P6: two people both employed by the
    same two employers share one line at both (a change at one changes the other); P6's assignment should carry the manager per
    employment, and `linesOf` read it;
  - memberships are open to departments as well as teams here; once P6's assignments carry an employee's department, a department's
    member rows are the assignment's (one projection) and `store#Membership` should take only a department's lead, or the assignment
    write the row. Closing a unit with its employees' reassignment waits on P6 too;
  - Customer Service's service teams are `OrgTeam` parties written by its own `save#ServiceTeam` with `PrtServiceTeam` memberships and
    no rollup, where design §4 has teams written only by People: they are not in OrgStructure, and Projects' planner lists every
    `OrgTeam` party (its first 200) as a team, Customer Service's among them. An owner question for Customer Service and Projects;
  - `container-dialog`'s `type` defaults to primary, so a screen's every untyped dialog button is a primary one; People's secondary
    dialogs say `type="default"`. Many built screens have several primary dialogs.
- For the lead:
  - the budget: mr-mantle's share PeopleOrganization about 2.3 s; mr-boss's PeopleOrganization about 0.5 s and PeopleAccess's new feature
    0.3 s, within §4's estimates (no client spec);
  - merge hot spots: mr-mantle `People.js` (the lines, `scopeOf`, `partyAccess`, `withoutManager`, `home`, the exports), `Employees.js`
    (the managers and the manager filter, its exports), `party/PartyServices.xml` (`get#PartyInternalOrgIds`); mr-boss
    `service/ironstone/people/People.js` (`linkPaths`, `choiceSources`), `ContextServices.xml` (`get#Choices`), `template/PeopleParts.xml`,
    `screen/People.xml` (the keymap), `screen/People/Employees.xml` and `Employees/List.xml` (the menu), `data/BossPeopleDemoData.xml`
    (appended), `test/People/PeopleSpecLib.js` (ids, keys) and `PeopleAccess.spec.js` (keys, readiness, the appended feature),
    design-people's header, §1.2 and §4, and the inventories' People rows;
  - the user's call: whether `get#PartyInternalOrgIds` should admit internal children only (built so here; the alternative leaves every
    department directly under an employer in every app's organization scope), and whether department memberships stay open until P6
    or wait for its assignments.

**Review Nov 11 (P3).** A fresh review of `git diff master...ppl/p3` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §4 OrgStructure and OrgChart, PE-03 and F11–F13, F49, F50, F63, F81, F86, scope and data integrity first; fixes committed
apart per repository ("People P3 review: …"; mr-mantle f0d07655).
- Checked and found sound:
  - Every OrganizationServices read checks a staff read of an employer (`readerScope`) and every change `PEOPLE_HR_VIEW` and
    `PEOPLE_HR_EDIT` (`editorScope`) before reading with authorization off; a supplied unit, parent, person, manager or node is
    admitted only through the caller's employers (`visibleParty` by the employer the unit's rollups reach, `requireOrganization`
    on a node's employer, a person by an employment by an employer in scope), and a missing and an outside record answer alike
    (`RECORD_UNAVAILABLE`). No `ironstone` pass-through; the screens call Mantle after the root's check.
  - Dated rows only: a move ends the rollup in effect and starts one, a role or lead change ends the membership and starts one,
    a manager change ends the line and starts one, each with the reason as the ended row's audit (`thruDate_changeReason`, an
    audit-logged field) and the new row's comment; nothing is deleted, and `get#Unit`'s parents and memberships and the tree's
    `asOfDate` read history as of a date. Cycles (a unit under itself or below it, a manager below the person at that employer),
    a department under a team, a move to another employer, self reporting, a manager or member the employer does not employ
    then, a later move or line already set and a stale revision are refused; a membership is never an employment.
  - F63 and F50: a member is from role `Assignee` and a lead from `Manager` (BusinessTime's hours access reads a `Manager` from
    the lead to the unit, so a lead may change the unit's hours, nothing of a member's); a line runs from the manager to the
    report. Projects' planner and the readers of `PrtMember` as staff relationships (calendars, contact books, lifecycle,
    purchasing) look for internal organizations or the team itself, so People's department memberships widen none of them.
  - People.js and Employees.js: the lines per employment (`linesOf`) replace P2's `managersAt` with P1–P2's scope rules kept: a
    team reader reaches a report's employments at the line's employers only, the directory's manager column and filter,
    Employee360's managers and Home's due work read the same lines; PeopleScope and PeopleDirectory pass unchanged.
  - F49, `get#PartyInternalOrgIds`: no data or spec of any component has a rollup child of an internal organization that is not
    internal itself (Mantle's ZbaOrganizationDemoData, Warehouse's returns center and every spec's children are `OrgInternal`;
    the customer account rollups `AccountServices` writes are between accounts), so before P3 the change altered nothing; the shell's organization list,
    Commerce's owners and the row filters (`filterOrgIds`) keep every internal child. AppOrganizationFilters, OrganizationRowFilter
    and AdminOrganizations pass. It had no spec of its own (R4 adds one).
  - Screens: no route fixture; OrgStructure rendered once in qvt (HR) and OrgChart once in qvt (reader), the tree levels as
    transition answers; actions conditioned on Mantle's `canEdit`; one primary (New unit); End is a danger submit with a
    confirmation naming the person; dialog ids carry the row's key. Specs well under 15 s. The worker's provisional findings
    stand as written.
- Fixes:
  - **R1 (high, scope).** `change#Manager` ended every line in effect at the employer and started the new one, but a line names no
    employer: a line between two people both employed by A and B (or from a manager employed by no one) is the line at both, so
    an HR editor of A alone ended or wrote B's reporting line, outside their scope. It now refuses `LINE_SHARED` when a line ended
    or started would also be the line at an employer the editor does not read; an editor of both still changes both (the worker's
    P6 finding). PeopleOrganization: A's HR refused both ways (a new manager employed by A and B, and ending such a line).
  - **R2 (medium, stale write).** A unit's revision was its name and rollups only, and EditUnit always posts the lead it read, so
    saving a rename after another editor changed the lead put the old lead back without a refusal. The revision now covers the
    lead rows. PeopleOrganization: a `store#Unit` at the revision read before a new lead is `REVISION_CHANGED`.
  - **R3 (low).** `change#Manager` compared the expected revision with the first line in effect in no order, where the tree gives
    the newest (`linesOf`); with two lines in effect at an employer (a pre-People line beside a new one) the change could be
    refused forever. The lines in effect are now read newest first.
  - **R4 (medium, owner contracts; the user's call 1).** P3's demo puts departments directly under Retail and Services, and three
    readers took every rollup child for an internal organization: Admin's Organizations counted and listed Store Operations and
    Merchandising as Retail's child organizations; Accounting's and Purchasing's cost-centre choices offered them, and a purchase
    line accepted one, which the ledger's dimension rule (`AccountingPolicy.js` `dimensions`, `OrgInternal` only) then refuses at
    posting. Admin's `find#InternalOrganizations` and `get#InternalOrganization`, `PurchaseOrders.costCenterOf` (mr-mantle) and
    Accounting's `rollupChildren` and Purchasing's `costCenterChoices` (mr-boss) take internal children only. InternalOrganizations:
    a department under the organization is in neither the operator's `userOrgIds` nor its children; PurchaseRequests: a department
    refused as a cost centre (`COST_CENTER_INVALID`).
  - **R5 (low, specs).** PeopleSpecLib's `employeesMenu` was unused: PeopleAccess's menu feature now checks the Employees group
    (List, OrgStructure, OrgChart) through the shell's menu data.
- Findings, numbered by the lead F95 to F99 in order:
  - the cycle checks of `store#Unit` and `change#Manager` walk the parents and lines in effect on the change's date; a move or line
    already set for a later date on the chain above can still close a loop from that later date. Walking every row in effect on
    or after the date would refuse it;
  - `store#Unit` and `change#Manager` take a past date inside the row in effect (a retroactive move or line, with its reason in
    the audit log), where Admin's `store#OrganizationParent` refuses a past date; the phase's "stale dates refused" is read as a
    date before the row in effect or after a later change. Whether People should refuse a past date is the lead's;
  - a unit's rename overwrites `Organization.organizationName`, so the tree as of an earlier date shows today's name;
  - OrgChart's level header reads the manager's own node; for a manager outside the scope (a pre-People line from an agent) that
    read is a refusal, logged at ERROR with its stack (F87's class);
  - the `employees` choice limits rows before collapsing a person employed by two employers, so it may offer fewer than its limit.
- Tests (release binary, `--nobuild`, this runtime): before the fixes PeopleOrganization 4 of 4 (2.3 s). The new checks failed on
  the unfixed code (`LINE_SHARED`, the stale lead, the department in `userOrgIds` with master's `get#PartyInternalOrgIds`) and pass
  after. After: Mantle PeopleOrganization, PeopleScope, PeopleDirectory, InternalOrganizations, OrganizationRowFilter,
  WorkResources, BusinessTime, PurchaseRequests and PurchaseOrders 45 of 45 (mr-mantle 13.0 s feature time; PeopleOrganization 2.5 s,
  InternalOrganizations 0.5 s, PurchaseRequests 2.6 s); BOSS PeopleOrganization, PeopleAccess, PeopleEmployees,
  AppOrganizationFilters, AdminOrganizations, AccountingAccess, PurchasingRequests and PurchasingOrders 42 of 42 (mr-boss 14.4 s;
  PeopleOrganization 0.5 s, PeopleAccess 2.3 s). Prettier clean on the changed JavaScript. No screen changed, so no lint run. Not
  run: `./moq test-apps`, the acceptance PeopleOrganizationUsable (its changes involve no line kept at two employers).
- For the lead:
  - budget share: PeopleOrganization gains two people, two refusals and a stale-lead call (about 0.2 s); InternalOrganizations and
    PurchaseRequests a department and one call each; PeopleAccess one menu-data render; within §4's estimates;
  - merge hot spots beside the Built note's: mr-mantle `party/Organizations.js` (find and get of internal organizations),
    `order/PurchaseOrders.js` (`costCenterOf`), `test/party/InternalOrganizations.spec.js`, `test/order/PurchaseRequests.spec.js`;
    mr-boss `accounting/Accounting.js` (`rollupChildren`), `purchasing/Orders.js` (`costCenterChoices`), §4's three new rows, P6's
    and P8's new bullets, design-people's header, §4, Employee360, OrgStructure and OrgChart;
  - the user's calls are in §4: 1 kept as built and carried to Admin's, Accounting's and Purchasing's readers (R4); 2 written
    into P6; 3 written into P8.

### P4 — Job classes, positions and pay grades

Design §5 JobClasses, JobClassDetail (JobProfile; Requirements' levels are P18's), Positions, PositionDetail (terms
and holders; Requisition is P5's), PayGrades; PE-03, PE-08 (grades). After P3: a position's department is one of
P3's units.

- **Mantle PositionServices** (extended beside its one built service): `find#JobClasses`, `store#JobClass`,
  `store#JobRequirement` (class and skill only until P18), `find#Positions`, `get#Position`, `store#Position` (new
  `EmplPosition.departmentPartyId`, checked to roll up to the employer; vacancy computed from holders at a date;
  a single-holder seat refuses an overlapping holder; an ended position checks future occupancy; F10).
- **`mantle.humanres.PayrollSetupServices`** starts with `find#PayGrades` and `store#PayGrade` (dated
  PayGradeSalary rows, minimum ≤ reference ≤ maximum with currency and frequency required, the reference being
  `amount`; `PAYROLL_VIEW` and `PAYROLL_EDIT`; F4).
- **Screens:** JobClasses, JobClassDetail, Positions (list and board by status), PositionDetail (PositionTerms,
  Holders), PayGrades (no amounts in shell context). The `assist-prompt` "Draft a job description" waits for P16's
  skill file.
- **Specs:** Mantle `test/humanres/PeoplePositions` (a department outside the employer refused; vacancy at a date;
  a band out of order refused; a grade's amounts absent without `PAYROLL_VIEW`); BOSS `PeoplePositions`
  (PositionDetail's one qvt render).
- **Usable when** (`acceptance/People/PeoplePositionsUsable`): `people.hr` defines a job class, plans two seats in
  a department and sees them vacant; `people.payroll` sets a grade band; `people.hr` sees the grade's name and no
  amounts.

**Built Nov 11 (P4).** mr-mantle 2b1f361a, mr-boss (branch `ppl/p4`).
- Checked first (the code over the plan): F4 (PayGradeSalary's `amount`, `minAmount`, `maxAmount`, `currencyUomId` and `timePeriodTypeId`;
  PayGrade has a description and no organization), F10 (EmplPosition has the employer, class, grade, status, dates, hours and flags, and
  no department; its `minimumHourlyWage` is a pay value), F35 (PositionServices' one service). Also: EmplPositionClass has no dates, so a
  class could not be ended; a seat's occupancy has two records in the code, `EmplPositionParty` (the design's dated holders, read by
  Manufacturing's shop floor and Projects' resources) and `Employment.emplPositionId` (which `create#Employment` takes and TimeServices,
  Commons' contacts and P2's directory read); no demo data writes either; the Payroll `TimePeriodType`s are the pay frequencies; a declared
  service parameter not passed reaches a script service as null, not undefined.
- Mantle (`entity/HumanResourcesEntities.xml`: `EmplPosition.departmentPartyId`, audited, and `EmplPositionClass.thruDate`):
  - `mantle.humanres.PositionServices`, extended beside its one service, over a new module `Positions.js`: `find#JobClasses` (title search
    ignoring case, current unless asked, paged; skills, the positions of the class the reader reads), `get#JobClass` (skills, work types),
    `store#JobClass` (title, description, work types replaced as a set, an end; `TITLE_REQUIRED`, `WORK_TYPE_INVALID`, `CLASS_ENDED`,
    `REVISION_CHANGED`) and `store#JobRequirement` (a skill added or removed; `SKILL_INVALID`, `ALREADY_REQUIRED`), classes shared by every
    employer, read by any staff reader and changed by an HR editor; `find#Positions` (as of a date: employer, department, class, grade,
    status, vacancy and name filters, the state and vacancy of each seat, the holder, the vacant count, paged with an export),
    `get#Position` (the seat and every dated holding with the person's employment then), `store#Position` (a new seat, planned, of an
    employer in scope, `ORGANIZATION_DENIED`; a current class, `CLASS_REQUIRED`, `CLASS_ENDED`; a department, `NOT_A_DEPARTMENT`, whose
    rollups in effect from the later of the seat's start and today reach the employer, `DEPARTMENT_OUTSIDE`; dates, `DATES_INVALID`; hours,
    `HOURS_INVALID`; new terms at the revision read, `EMPLOYER_CHANGE`, `OCCUPIED_AFTER_END`, `OCCUPIED_BEFORE_START`; the department,
    class and grade audited with the change reason) and `store#PositionHolder` (a dated `EmplPositionParty` row in role `Employee`, the
    occupancy P6's hire and change write, or its end: `POSITION_NOT_IN_EFFECT`, `POSITION_INACTIVE`, `NOT_EMPLOYED`, `POSITION_OCCUPIED`, one
    holder at a time). A seat's holders are its occupancy rows and an employment that names it for a person with no such row; vacancy is
    computed from them at a date (filled or vacant while planned or active). Positions are read by an HR, recruiting, payroll or People
    configuration reader of the employer and by a manager (`PEOPLE_TEAM_VIEW`) for the units they lead (a current `Manager` membership, P3)
    and those under them (People.js `unitsUnder`, exported); a directory reader reads none. No pay value is in any answer: a grade is its
    name;
  - `mantle.humanres.PayrollSetupServices` over a new module `PayrollSetup.js`: `find#PayGrades` (names and comments for any staff reader;
    for `PAYROLL_VIEW` the band in effect, its count, the revision and, for a grade asked for, every band; `amountsShown`) and
    `store#PayGrade` (`PAYROLL_VIEW` and `PAYROLL_EDIT`: a grade, a rename, and a band from a date that ends the band in effect, changing no
    salary; `CURRENCY_REQUIRED`, `CURRENCY_INVALID`, `FREQUENCY_REQUIRED`, `FREQUENCY_INVALID` (a Payroll period only), `AMOUNT_REQUIRED`,
    `AMOUNT_INVALID`, `CURRENCY_PRECISION`, `BAND_ORDER`, `BAND_SCHEDULED`, `REVISION_CHANGED`);
  - `Employees.js` `titlesOf`: the job title is the class of the seat the person holds at that employer on the date (an occupancy row), else
    of the seat the employment names, so the directory, Employee360 and the palette show it.
- BOSS:
  - Screens: `People/Staffing` (menu "Positions & recruiting", index 6, every People user's; the key `g s`) with `Staffing/Positions` (the
    default: FindPositions, PositionList as `views="list,board"`, the board by status with no move, state and vacancy chips with tui texts,
    the CSV; New position, the one primary, an HR editor's, opening the seat), `Staffing/PositionDetail` (record header with state and
    vacancy; Terms; Holders read only; Edit terms, the primary, and End position under More, a danger dialog with a confirmation),
    `Staffing/JobClasses` (FindJobClasses, JobClassList; New job class), `Staffing/JobClassDetail` (header; Job profile; Requirements with Add
    skill and Remove; Edit profile, the primary; End job class under More) and `Staffing/PayGrades` (Grades with the band's columns hidden
    unless the service answered amounts; New pay grade, the payroll editor's primary, and New band per grade; a grade opened shows its
    bands to payroll). Each reads its Mantle service in `actions` and shows "Not available" or "not open to you" on a refusal.
  - `ironstone.people`: the choices `departments` (one employer's, `choiceOrganizationPartyId`, through `get#Scope`'s units), `jobClasses`
    (current) and `payGrades` (names only); `sharedLinks` for the six routes. No new access rule in BOSS: the screens are every People
    user's and Mantle checks every read and change; no amount enters the shared context, a choice or the palette.
  - Demo (`BossPeopleDemoData.xml`, appended): four skills; the classes Store manager, Sales associate, Merchandiser and Service technician;
    the grades Associate, Lead and Manager with a monthly USD band each; Retail's store manager seat (Hannah), three sales associate seats
    (Tomas, Rafael, one vacant) and a planned seasonal one in Store Operations and the merchandiser seat (Leon); Services' two technician
    seats (Kenji, one vacant).
- Specs: Mantle `test/humanres/PeoplePositions` (4 features, 2.5 s feature time, 0.6 s each: a class's work types and skills, its refusals,
  a partial change keeping the description, an ended class listed only when asked and refused for a new seat; two planned seats vacant in
  a department, another employer's department, a team, another employer, a reader, dates, hours and no class refused, a manager reading
  their department's seats only and another employer's HR refused; vacancy before and after a holder's start, a second holder and a person
  not employed refused, the directory's job title from the seat held, an end before the holder's last day refused and allowed after the
  holding ends, a stale revision and another employer refused; a grade's band, its order, currency, frequency and amounts refused, a raise
  from next month ending the band before, a band already set refused, the salary on the grade unchanged, and HR answered the name with no
  band, amount, currency or frequency, on the grade and on the position). BOSS `test/People/PeoplePositions` (3 features, 0.5 s:
  PositionDetail's one qvt render as HR, a filled seat with its grade's name and no amount; the choices `departments`, `jobClasses` and
  `payGrades`, each with a selected value off the page; PayGrades' one html render as HR, the names and nothing of the bands).
  `PeopleAccess` gains one feature (0.5 s: a position's and a job class's change, HR of Retail answered for what it asks with the parameters
  the reader is refused with, Services' position refused to Retail's HR, a manager reading Store Operations' seat and not Merchandising's,
  a grade's change payroll's and refused to HR, payroll's answer with the band and HR's without) and its menu feature checks the Staffing
  group (PeopleSpecLib `staffingMenu`, the menus and keys). Acceptance, written and not run: `acceptance/People/PeoplePositionsUsable`
  (3 features: HR defines a class with a skill and plans two seats in Merchandising through the transitions and sees them vacant in the list,
  the seat in tui and the class; payroll sets a grade's band and a raise from next month through PayGrades and reads both, a band out of
  order refused; HR puts the grade on a seat and sees its name and no amount on PayGrades, the grade opened, PositionDetail, the service's
  answer and the choice, and a forged grade refused).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeoplePositions, PeopleScope, PeopleDirectory, PeopleOrganization,
  HumanResServices, PayrollServices, PayrollAdjustments, WorkTimeEntries, ProductionShopFloor and WorkResources, 66 features, 65 passing on
  the first run (PeoplePositions searched a title the BOSS demo also has; made spec-unique) and PeoplePositions 4 of 4 after (mr-mantle 14.5 s
  feature time); BOSS PeopleAccess (10 of 10), PeopleEmployees, PeopleOrganization, PeoplePositions, Resources, ManufacturingShopFloor,
  Contacts, InsightsRecords, AppOrganizationFilters and ProjectsAccess (with a dependency), 100 of 100 (mr-boss 19.2 s). A one-off qvt, tui
  and html render of the five screens for HR, the reader, the manager and payroll and a post to each of their transitions (not kept) found
  nothing to fix. `moqui lint --screens`: 135 flagged sites, as on master, none in the People screens; no TUI-text finding in them. Prettier
  clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added table gains the six PositionServices and two PayrollSetupServices with their screens
  (`store#PositionHolder` has none until P6). ss-inventory has no HumanRes position or grade form (its two HumanRes rows are the rates, P10).
- Design edits: design-people (header; §1.2 the Staffing group and `g s`; §5 the holders, vacancy, readers and the grades' lane, and
  JobClasses, JobClassDetail, Positions, PositionDetail and PayGrades as built).
- Findings, numbered by the lead F100 to F105 in order:
  - a seat's occupancy has two records in the code: the design's dated `EmplPositionParty` rows (Manufacturing's shop floor and Projects'
    resources read them) and `Employment.emplPositionId` (`create#Employment` takes it; TimeServices' rate lookup, Commons' contact card and
    P2's directory read it). P4 reads both, the occupancy row winning, and writes only the row (`store#PositionHolder`); P6's hire and change
    should write the row and decide whether `Employment.emplPositionId` follows it (TimeServices reads a worker's class from it);
  - pay grades and job classes have no organization in Mantle, so both are shared by every employer: a payroll operator of Retail reads and
    changes the bands of a grade Services' seats name. A grade per employer needs `PayGrade.organizationPartyId` (a Mantle entity change);
  - design §1.1 says payroll configuration needs `PAYROLL_EDIT` and `PEOPLE_CONFIGURE`; the plan's `store#PayGrade`, built as written, asks
    `PAYROLL_VIEW` and `PAYROLL_EDIT` (the usable-when's `people.payroll` holds no `PEOPLE_CONFIGURE`);
  - a new seat is planned and nothing in P4 activates one (the demo's seats are seeded active): P5's `decide#PositionApproval` is the first
    writer of `EmpsActive`; a seat is filled only by `store#PositionHolder`, which no screen calls until P6;
  - a declared service parameter not passed arrives in a script service as null, so People's partial updates take null as "unchanged" and
    an empty text as "clear"; a form cannot clear a Timestamp (an empty date posts null), so an ended seat or class is not reopened;
  - not built: a seat's budget reference (`EmplPosition.budgetId`), a class's classifications (`EmplPositionClassPtyClsTp`) and
    responsibilities (`EmplClassResponsibility`, `EmplPositionResponsibility`), and Positions' cost estimate (compensation, P23);
    `EmplPosition.minimumHourlyWage`, a pay value, is neither read nor written by People.
- For the lead:
  - the budget: mr-mantle's share PeoplePositions about 2.5 s; mr-boss's PeoplePositions about 0.5 s and PeopleAccess's new feature 0.5 s,
    within §4's estimates (no client spec);
  - merge hot spots: mr-mantle `entity/HumanResourcesEntities.xml` (EmplPosition, EmplPositionClass), `PositionServices.xml` (appended),
    `Employees.js` (`titlesOf`), `People.js` (the exports); mr-boss `service/ironstone/people/People.js` (`linkPaths`, `choiceSources`),
    `ContextServices.xml` (`get#Choices`' description), `template/PeopleParts.xml`, `screen/People.xml` (the keymap and comment),
    `data/BossPeopleDemoData.xml` (appended), `test/People/PeopleSpecLib.js` (ids, menus, keys), `PeopleAccess.spec.js` (header, menu
    feature, the appended feature), `plan/usl-inventory.md` (the People Added table), design-people's header, §1.2 and §5;
  - the user's call: whether pay grades (and job classes) stay shared by every employer or a grade gets an employer (the second finding),
    and whether a grade's band also needs `PEOPLE_CONFIGURE` (the third).

**Review Nov 11 (P4).** A fresh review of `git diff master...ppl/p4` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §5 JobClasses, JobClassDetail, Positions, PositionDetail and PayGrades, PE-03, PE-08, F4 and F10, access, scope and pay's
lane first; fixes committed apart per repository ("People P4 review: …"; mr-mantle 8b889cc1).
- Checked and found sound:
  - Positions.js: every read goes through `positionReader` (an HR, recruiting, payroll or configuration reader of the employers in
    scope, and a manager for the units they lead now, a current `Manager` membership, and those under them); a position outside the
    reach and a missing one answer alike (`RECORD_UNAVAILABLE`), an employer filter outside the scope is `ORGANIZATION_DENIED`, a
    directory reader reads none. `store#Position` and `store#PositionHolder` ask `PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT` and an
    employer in scope, never a supplied record's employer: the department is an `OrgDepartment` whose rollups in effect reach the
    position's own employer (`NOT_A_DEPARTMENT` for a team, `DEPARTMENT_OUTSIDE` for another employer's), the employer never
    changes (`EMPLOYER_CHANGE`), an end before a holder's last day and a start after a holder's first are refused, and the
    department, class and grade are audited with the reason.
  - Vacancy is computed from the holders at the date (occupancy rows and an employment naming the seat), filled or vacant only
    while planned or active; a single seat refuses an overlapping holder (half-open periods), and a holding needs the employer's
    employment at its start. Dated rows: holdings, bands and classes are ended, never deleted; a new band ends the one in effect
    and rewrites no `EmploymentSalary` (spec). A class's work types and skills are configuration sets without dates until P18.
    Revisions: a position's stamp, a class's stamps with its work types and skills, a grade's with its bands.
  - Pay's lane: no position, choice, shell context or palette answer has an amount (a grade is its name; `minimumHourlyWage` is
    neither read out nor written); `find#PayGrades` adds the band, currency and frequency only for `PAYROLL_VIEW` (the spec checks
    the JSON); Positions' CSV is the rows' fields; PayGrades has no export; the shared context adds only the six links.
  - The directory's job title (`titlesOf`): the class of the seat the person holds at that employment's employer on the date,
    else the seat the employment names; P2's scope rules are untouched and PeopleDirectory, PeopleEmployees and PeopleScope pass
    unchanged.
  - Existing callers: the two entity fields are additive; HumanResServices, PayrollServices, PayrollAdjustments,
    ProductionShopFloor, WorkResources and WorkTimeEntries pass unchanged. Screens: PositionDetail rendered once (qvt) and
    PayGrades once (html) in the regression suite, no route fixture, specs under 15 s.
- Fixes:
  - **R1 (high, scope; the user's call 1).** Pay grades had no owner, so a payroll editor of Retail read and changed the bands of
    a grade Services' seats name, and any HR editor put any grade on a seat. `PayGrade.organizationPartyId` (Mantle entity field):
    `find#PayGrades` answers the shared grades and those of an employer in scope (with `organizationPartyId`, the ones that
    employer's seats take), each with its owner and a per-grade `canEdit`; `store#PayGrade` creates a grade of an employer in
    scope (`ORGANIZATION_DENIED` outside) or, with no owner, a shared one only for a payroll editor holding
    `PEOPLE_ALL_ORGANIZATIONS`, refuses another employer's grade as a missing one, a shared grade's change without
    `PEOPLE_ALL_ORGANIZATIONS` (`PERMISSION_DENIED`) and an owner change (`OWNER_CHANGE`); `store#Position` takes only the
    employer's own grades and the shared ones. BOSS: the `payGrades` choice follows the same scope and the seat's employer
    (PositionDetail passes it, Positions' New position depends on the employer field); PayGrades shows each grade's employer or
    "Shared", New pay grade gains the employer, and New band shows only on the grades the user changes; the demo's Associate
    and Manager are Retail's, Lead shared. Specs: Mantle PeoplePositions' new feature (Retail's payroll refused a shared grade,
    new and a band; Services' payroll refused Retail's grade's band as missing and refused creating one for Retail; the
    administrator's band on the shared grade; each user's list; Services' seat refused Retail's grade and given the shared one);
    PeopleAccess (Retail's payroll refused the shared Lead, the People administrator answered with the same parameters);
    PeoplePositions (a Services seat's grade choice is Lead alone). The acceptance PeoplePositionsUsable creates its grade as
    Retail's (changed, not run).
  - **R2 (medium, data integrity).** Ending a holding (`store#PositionHolder` with `holderFromDate`) took any end after its
    start: a holding ended in the future could be moved past the next holder's start (two holders at once) or past the seat's
    end. A later end is now capped at the seat's end and refused `POSITION_OCCUPIED` when it reaches another holder's period.
    PeoplePositions: a later holder, then the first holding's end moved into it refused.
  - **R3 (low, confidentiality).** `NOT_EMPLOYED` named the supplied party, so an HR editor learned the name of any party id.
    The refusal no longer names the person. PeoplePositions: the refusal does not carry the name.
  - **R4 (low).** A person whose employment names the seat (`Employment.emplPositionId`) was refused their own occupancy row,
    `POSITION_OCCUPIED` naming themselves; their employment's holding is no longer another holder. No spec: nothing writes
    `Employment.emplPositionId` until P6.
  - The user's call 2: design-people §1.1 now says a pay grade is changed with `PAYROLL_VIEW` and `PAYROLL_EDIT` alone and
    `PEOPLE_CONFIGURE` is for P22's components, structures and groups; the worker's holder-records finding is a note in P6.
- Findings, numbered by the lead F106 to F109 in order:
  - a manager (`PEOPLE_TEAM_VIEW` alone) reads their department's seats and each seat's class title, but `find#JobClasses` and
    `get#JobClass` admit staff readers only, so PositionDetail's link to the class is "not open" to them;
  - the job title of an ended employment in Employee360's history and OrgChart's members as of an earlier date read the seat
    held now (`titlesOf` is called with now there), falling back to `Employment.emplPositionId`;
  - PositionDetail's Edit terms posts the start as a date alone, so a seat planned with no date (now, with a time) moves its
    start to that midnight on its first save of terms, unasked;
  - a holding may run past its holder's employment (the employment is checked at its start only); P6's separation should end
    it (written into P6's note).
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle PeoplePositions 5 of 5 (3.4 s feature time; with
  Positions.js and PayrollSetup.js as built the vacancy and owned-grade features fail on the new checks, and pass after), then PeoplePositions,
  PeopleScope, PeopleDirectory, PeopleOrganization, HumanResServices, PayrollServices, PayrollAdjustments, ProductionShopFloor,
  WorkResources and WorkTimeEntries 67 of 67 (mr-mantle 15.4 s); BOSS PeoplePositions, PeopleAccess, PeopleEmployees,
  PeopleOrganization, Resources, ManufacturingShopFloor, Contacts, InsightsRecords and AppOrganizationFilters (with a dependency)
  91 of 91 (mr-boss 14.1 s; PeopleAccess and PeoplePositions 3.7 s together). A one-off html and qvt render of PayGrades for
  payroll, the People administrator and HR (not kept): New band on Retail's two grades for payroll, on all three for the
  administrator, none for HR, no errors. `moqui lint --screens`: 135 flagged sites as before, none in the People screens.
  Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- For the lead:
  - budget share: Mantle PeoplePositions gains a feature (about 0.8 s, 3.4 s in all); BOSS PeopleAccess two calls and
    PeoplePositions one choice (under 0.1 s); within §4's estimates;
  - merge hot spots beside the Built note's: mr-mantle `entity/HumanResourcesEntities.xml` (PayGrade), `PayrollSetup.js` and
    `PayrollSetupServices.xml`, `Positions.js` (`checkGrade`, `storePositionHolder`); mr-boss `People.js` (`payGrades`),
    `Staffing/PayGrades.xml`, `PositionDetail.xml`, `Positions.xml`, `BossPeopleDemoData.xml` (the grades),
    `PeopleSpecLib.js` (`sharedPayGradeId`), design-people's header, §1.1 and §5, §4's two new rows and P6's new bullet;
  - the user's calls are in §4: 1 built (R1); 2 kept as built and written into design §1.1; the holder-records finding is in P6.

### P5 — Approval rules and Approvals

Design §12 ApprovalPolicies, Lookups, §13 Approvals, §5 PositionDetail's Requisition; PE-15, PE-18 (topics), PE-03
(lookup seeds).

- **Mantle `PeopleApprovalPolicy`** and its decisions, and `mantle.humanres.PeopleApprovalServices`: `find#Policies`,
  `store#Policy` (dated rules), `resolve#Approvers` (employee override, department or type rule, manager, HR
  fallback, alternate; never the requester) and the shared `record#Decision` the domain decision services call.
  The approval topics of design §12, seeded in Mantle with their `approveServiceName` and `refuseServiceName`
  (F42); each is seeded with the phase that builds its decision service, the first here:
  `PeoplePositionApproval` over `PositionServices.request#PositionApproval` and `decide#PositionApproval`.
- **Lookups:** PeopleServices `find#Lookups` and `store#Lookup` over a whitelist of HR families (termination
  reasons, skill types and levels; later families by phase), values ended and not deleted.
- **People's lifecycle participant** (owner contract, the pattern of BossSetupData.xml:4041-4044):
  `people.approvals`, the open People decisions and the policy rows that name the user, with
  `find#OwnedApprovals` and `transfer#ApprovalOwner` on the framework's owned-resource contract; later phases'
  records (openings, review steps) join the same lookup.
- **Screens:** ApprovalPolicies (Policies, ApprovalRule, ResolvePreview); Approvals, the Commons Notifications mount
  with People's topics (the pattern of Accounting/Approvals.xml:28-36, F18); Lookups; PositionDetail's Requisition.
- **Specs:** Mantle `test/humanres/PeopleApprovals` (routing order; self never an approver; no approver waits; a
  changed source invalidates the pending decision; a decision retried answers the first); BOSS `PeopleApprovals`
  (the mount lists only People's topics for the approver).
- **Usable when** (`acceptance/People/PeopleApprovalsUsable`): `people.admin` sets a rule that a position needs the
  department head; `people.hr` requests a seat's activation and cannot approve it; the head approves it from
  Approvals and from the notification tray; ResolvePreview explains the route.

**Built Nov 11 (P5).** mr-mantle 03b6a241, mr-boss (branch `ppl/p5`).
- Checked first (the code over the plan): F18 (Accounting's and Purchasing's Approvals mount `Commons/Notifications.xml` with
  `notificationTopics`), F42 (a topic's `approveServiceName` and `refuseServiceName`, seeded in Mantle beside the service, and the
  app's link in BossSetupData), F27 (the lifecycle participant rows and the owned-resource contract), F50 (a line from the manager to
  the report) and P3's leads (a `Manager` membership from the lead to the unit). Also: the framework's `decide#NotificationMessage`
  calls a topic's service with `recordEntityName`, `recordId`, `message`, `notificationMessageId` and, for a refusal, `reason`, and
  no action, so one decision service cannot be both the approve and the refuse service (Purchasing names `approve#` and
  `refuse#PurchaseSource`); an `update#` of a `statusId` with no `StatusFlowTransition` row is refused, and `EmplPosition` had none,
  so nothing could activate a planned seat; `moqui.basic.Enumeration` has no date to end a value by; a retried tray decision calls
  the topic's service again (the recipient's row stays, read).
- Mantle (`entity/PeopleApprovalEntities.xml`, `data/PeopleApprovalSetupData.xml`, `PEOPLE_APPROVAL_OWNER_CHANGE` in
  MantleSetupData):
  - the records: `mantle.humanres.approval.PeopleApprovalPolicy` (a dated step of an employer and a kind, `PeopleApprovalKind`, only
    `PakPosition` now, for the whole employer, a department or one employee, decided by a role, `PeopleApproverRole`: `ParDepartmentHead`,
    `ParManager`, `ParPerson`, `ParHr`, with an alternate; a `ParHrFallback` row names the employer's HR fallback for the kind; the key
    fields audit-logged), `PeopleApproval` (a request of a source at its revision, the requester, the employer and department it routes
    by, the person it is about, the effective date and why; `PapPending`, `PapApproved`, `PapRefused`, `PapSuperseded` with their
    transitions) and `PeopleApprovalDecision` (actor, step, rule row, role, revision, time, reason); `EmplPosition`'s `EmpsPlanned` to
    `EmpsActive` transition; `Enumeration.thruDate` (an HR vocabulary value ended, a Mantle extension of the framework's entity);
  - `mantle.humanres.PeopleApprovalServices` over a new module `Approvals.js`: `find#Policies` (the rows of the employers in scope,
    current or with ended ones; the People administrator and an HR reader), `store#Policy` (`PEOPLE_CONFIGURE`: a new row, a dated
    change that ends the row in effect and starts the next, a change in place of a row not yet in effect, an end; refusals
    `ORGANIZATION_REQUIRED`, `ORGANIZATION_DENIED`, `KIND_INVALID`, `ROLE_INVALID`, `APPROVER_REQUIRED`, `STEP_INVALID`, `NOT_A_DEPARTMENT`,
    `DEPARTMENT_OUTSIDE`, `NOT_EMPLOYED` (an employee not employed, an approver or alternate who does not work for the employer),
    `SELF_APPROVAL`, `STEP_EXISTS`, `DATES_INVALID`, `RULE_ENDED`, `REVISION_CHANGED`; the employer's waiting requests of the kind are routed
    again), `resolve#Approvers` (the route explained step by step: the basis, each step's role, who decides and how, or why no one may),
    `record#Decision` (the shared decision the domain services call: `PEOPLE_REQUEST_APPROVE` or `PEOPLE_HR_EDIT`; the caller's earlier
    decision of the request answers the first, `ALREADY_DECIDED` for another; `NOT_PENDING`, `REVISION_CHANGED` for a notice of an earlier
    revision, `SOURCE_CHANGED` for a source changed since the request, `REASON_REQUIRED`, `SELF_APPROVAL`, `NOT_APPROVER`; the request row
    locked; the last approval approves it, a refusal refuses it, either reads its notices, an earlier step's approval sends the next
    step's) and People's lifecycle participant on the owned-resource contract, `find#OwnedApprovals` (the rule rows naming the user as
    approver, alternate or HR fallback, transferable, and the requests waiting for their decision, listed and not transferable) and
    `transfer#ApprovalOwner` (a rule row ends and its copy names the new approver, who must work for the employer; `NOT_TRANSFERABLE`,
    `OWNER_INVALID`, `RECORD_UNAVAILABLE`; `PEOPLE_APPROVAL_OWNER_CHANGE` for another user's). Routing: the rules naming the request's
    employee, else those of the nearest department at or above the source's department, else the employer's; with none, the person's
    manager at the employer, or for a request about no one (a position) the head of its department, the nearest lead up the
    departments. A step's approvers hold `PEOPLE_REQUEST_APPROVE` (HR's roles also `PEOPLE_HR_EDIT`) through an active group and an
    enabled account, never the requester or the person it is about nor one who decided another step; none: the alternate, then the HR
    fallback, else the step is unresolved and the request waits. Authority is recomputed at the decision from the rules and lines in
    effect then. The step waiting gets one `PeoplePositionApproval` notice (reason approval, the position's name, employer, department
    and step; no pay), sent again only when its approvers change;
  - `PositionServices` (Positions.js): `request#PositionApproval` (`PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT`, a planned seat in scope at the
    revision read, a justification; `NOT_PLANNED`, `JUSTIFICATION_REQUIRED`, `REVISION_CHANGED`, `APPROVAL_PENDING`; an operation key's
    retry answers the first), `decide#PositionApproval` (over `record#Decision`; the last approval sets the seat `EmpsActive`, a retry
    activates nothing again), the topic's `approve#PositionApproval` and `refuse#PositionApproval` (the message's request and revision);
    `store#Position`'s change supersedes a request waiting at the earlier revision and reads its notices; `get#Position` answers the
    latest request (`approval`: state, who asked, why, each step with who decides and why, the decisions, `canDecide`) and the seat's
    `canRequestApproval`;
  - the `PeoplePositionApproval` topic (refusal reason required, a title naming the position and step) and the `SkillLevel` family
    (1 Basic to 5 Expert, each `enumCode` its number) in `PeopleApprovalSetupData.xml`;
  - `PeopleServices.find#Lookups` and `store#Lookup` over a new module `Lookups.js`: the whitelist (termination reasons, termination
    types, skill types, skill levels), each value's use counted from the fields that hold it, a value added, renamed, reordered or
    ended, never deleted (`FAMILY_INVALID`, `DESCRIPTION_REQUIRED`, `DUPLICATE_VALUE`, `SEQUENCE_INVALID`, `VALUE_ENDED`,
    `REVISION_CHANGED`); read by the administrator and an HR reader, changed with `PEOPLE_CONFIGURE`.
- BOSS:
  - Screens: `People/Approvals` (menu index 3, key `g a`, every People user's: Commons' Notifications with `notificationTopics`
    `PeoplePositionApproval`; the root registers the topic as a `notification-topic`); `Settings/ApprovalPolicies` (tab "Approval rules":
    FindPolicies, Policies with each row's Change and End dialogs, New rule the one primary, and "Who would decide", the ResolvePreview
    over `resolve#Approvers`) and `Settings/Lookups` (FindLookups, LookupValues with Edit and End, Add value the one primary), both the
    People administrator's under BOSS_PPL_SETTINGS; PositionDetail's Requisition: Request activation (the primary while the seat is
    planned and nothing waits; Edit terms then a default button), the Approval box (state, who asked, why, the route's steps while it
    waits, the decisions), and for an approver of the step waiting Approve (the primary) and Refuse under More.
  - `ironstone.people`: the choice `staff` (one employer's current employees and agents, who a rule names), `sharedLinks` for the three
    routes. No new BOSS access rule: Approvals lists the user's own notices, Settings is the administrator's area, and Mantle checks every
    read, change and decision.
  - BossSetupData: the topic's link to PositionDetail; People's lifecycle participant `people.approvals` (sequence 70) and
    `PEOPLE_APPROVAL_OWNER_CHANGE` for the identity operator and the administrator. No demo rule: with none, a Retail seat goes to its
    department's head (Store Operations' Hannah, `people.manager`).
- Specs: Mantle `test/humanres/PeopleApprovals` (7 features, 3.0 s feature time: the routing order with the manager, the employer's rule,
  the department's (a department without a lead taking its parent's head), an employee's override, the requester excluded and the
  request waiting, the HR fallback and the alternate, the store refusals, the dated change and the HR reader's list; HR's request with
  its refusals and retry, HR, another person and a reader refused the decision, the head's approval through `approve#NotificationMessage`
  activating the seat, the same notice and a direct decision answering the first, one decision kept; new terms superseding a waiting
  request and its notice, the old notice `NOT_PENDING`, a source changed outside the service `SOURCE_CHANGED`; an unresolved request
  waiting with no notice and sent once its rule names an alternate; a two-step rule, the second approver refused early, the head's retry
  answering the first, a refusal needing its reason; the lookups' whitelist, duplicate, permission and order refusals, a value renamed and
  ended, kept and listed only with ended ones, the skill levels; the owner lookup and transfer, a waiting request not transferable,
  another user's refused). BOSS `test/People/PeopleApprovals` (3 features, 0.3 s: Approvals' one qvt render as Hannah, the People notice
  listed and another app's approval sent to her absent; Approval rules' one qvt render with the preview, the department head; Lookups' one
  qvt render with the skill levels; the request refused and the other notice read at the end). `PeopleAccess` gains one feature (0.3 s:
  a rule's and a lookup's change, the administrator answered for what they ask with the parameters HR is refused with, a route read by
  Retail's HR and refused to the reader and for Services' position, a decision past the manager's permission and refused to the reader)
  and its menu feature checks Approvals, `g a` and Settings' tabs (PeopleSpecLib `staffMenu`, `adminMenu`, `settingsMenu`, `keys`,
  `plannedPositionId`). Acceptance, written and not run: `acceptance/People/PeopleApprovalsUsable` (3 features: the administrator's rule
  through Approval rules, the preview in html and tui and Hannah's own request waiting; HR's request of the seasonal seat through
  PositionDetail, HR's decision refused, the reader and HR with no notice, Hannah's approval from People's Approvals activating it and
  PositionDetail in tui; a second seat approved from the tray, Commons' `Panel/Notifications`, twice, one decision kept).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleApprovals, PeoplePositions, PeopleScope, PeopleDirectory,
  PeopleOrganization, HumanResServices, PayrollServices, PayrollAdjustments and WorkResources, 57 of 57 (mr-mantle 12.4 s feature time);
  BOSS PeopleApprovals, PeopleAccess (11 of 11), PeoplePositions, PeopleEmployees, PeopleOrganization, AdminLifecycle, InsightsAlerts,
  InsightsDelivery (with InsightsDatasets) and PurchasingAccess, 66 of 66 (mr-boss 15.2 s), and after Prettier PeopleApprovals,
  PeoplePositions (Mantle) and PeopleApprovals, PeopleAccess, PeoplePositions, KnowledgeReview and TodayPanel (BOSS), 43 of 43. A one-off
  qvt, tui and html render of PositionDetail (HR before and after the request, Hannah with Approve), Approvals in tui, Approval rules and
  Lookups in tui and html, and a post to each new transition (not kept) found nothing to fix. `moqui lint --screens`: 135 flagged sites,
  as on master, none in the People screens. Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance
  suite.
- Inventories: usl-inventory's People Added table gains the four PositionServices, six PeopleApprovalServices and two PeopleServices of
  P5 and `get#Position`'s Approval box. ss-inventory has no HumanRes approval or vocabulary form.
- Design edits: design-people (header; §1.2 Approvals, `g a` and Settings' tabs; §5 PositionDetail's Requisition as built; §12
  ApprovalPolicies and Lookups as built and the topic's handlers; §13 Approvals as built); design-admin §14 (People's participant as
  built); design-drawers-commons §4 (the `PeoplePositionApproval` row: its approve and refuse handlers).
- Findings, numbered by the lead F110 to F116 in order:
  - a topic's service gets no action from `decide#NotificationMessage`, so design §12's one decision service per topic cannot be both
    services: P5 names `approve#` and `refuse#PositionApproval` over `decide#PositionApproval`, and each later People topic needs the same
    pair (design-drawers-commons' table, written for the position topic only, says otherwise for the others);
  - `EmplPosition` had no status transitions, and the framework refuses a status change without one: P5 seeds `EmpsPlanned` to
    `EmpsActive` only; a seat is still closed by its end date, never `EmpsInactive`, and nothing reopens one;
  - `Enumeration.thruDate` is a Mantle extension of a framework entity; no built choice reads it yet: JobClassDetail's skill drop-down
    (an `entity-options` of `SkillType`) still offers an ended skill type and `store#JobRequirement` takes it; each later phase's
    vocabulary choice should leave ended values out;
  - authority is recomputed when the decision is made, so a rule or reporting-line change between the request and the decision moves
    the step to its new approvers (routed again on a rule change; on a manager change, P3's `change#Manager`, only at the next read or
    rule change, the old approver's notice staying until then);
  - a waiting request is listed by the lifecycle lookup and not transferred (it follows its route); a leaver's waiting requests move
    only when their rule or reporting line changes, which P6's separation should do;
  - a named approver or HR fallback who is not the department's lead reads no position (P4's reach), so a notice's link opens "Not
    available" for them and they decide from Approvals or the tray only;
  - not built: a backfill request (a vacant active seat refilled, with P16's openings), the Requisition's budget, the effective date's
    use (an approval activates the seat at once; the date is kept on the request), a request's withdrawal, and a readiness check of an
    employer's routes;
  - People's demo has no approval rule: a Retail seat's request goes to its department's head by the default route.
- For the lead:
  - the budget: mr-mantle's share PeopleApprovals about 3.0 s; mr-boss's PeopleApprovals about 0.3 s and PeopleAccess's new feature 0.3 s,
    within §4's estimates (no client spec);
  - merge hot spots: mr-mantle `Positions.js` (the header, `getPosition`, `storePosition`'s hook, the new operations),
    `PositionServices.xml` and `PeopleServices.xml` (appended), `data/MantleSetupData.xml` (the permission); mr-boss
    `service/ironstone/people/People.js` (`linkPaths`, `choiceSources`, `employeeOptions`), `screen/People.xml` (the comment, keymap and
    providers), `screen/People/Settings.xml`, `Staffing/PositionDetail.xml`, `data/BossSetupData.xml` (appended at its end),
    `test/People/PeopleSpecLib.js` (menus, keys, ids) and `PeopleAccess.spec.js` (header, menu feature, the appended feature),
    `plan/usl-inventory.md` (the People Added table), design-people's header, §1.2, §5, §12 and §13, design-admin §14,
    design-drawers-commons §4;
  - the user's call: whether an HR vocabulary is ended by a Mantle extension of the framework's `Enumeration` (built) or by a People
    record of its own; whether offboarding should hand a leaver's waiting requests to a delegate rather than leave them to their route;
    and whether HR officers decide HR-routed steps with `PEOPLE_HR_EDIT` (built) or need `PEOPLE_REQUEST_APPROVE` as managers do.

**Review Nov 11 (P5).** A fresh review of `git diff master...ppl/p5` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §12 ApprovalPolicies and Lookups, §13 Approvals, §5 PositionDetail's Requisition, design-admin §14 and F18, F27 and F42,
self-approval, authority, revisions and scope first; fixes committed apart per repository ("People P5 review: …"; mr-mantle
6a0b8752).
- Checked and found sound:
  - Approvals: Commons' Notifications with `notificationTopics` set in `always-actions` (not a request parameter) over the
    framework's list of the user's own `NotificationMessageUser` rows, so it lists People's topic only and only to the users a
    notice is addressed to (the spec shows another app's approval sent to Hannah absent). The tray's `approve#` and
    `refuse#NotificationMessage` check the recipient and call the topic's `approve#` and `refuse#PositionApproval`, which go
    through `decide#PositionApproval` and `record#Decision` with the notice's request and revision: the same checks as
    PositionDetail's `decideApproval`.
  - Self-approval: the requester and the person a request is about are excluded by party (a second account of the same person
    alike), and one who approved a step from every other step, in the route, the alternate and the fallback; `record#Decision`
    answers `SELF_APPROVAL` before `NOT_APPROVER`; `store#Policy` refuses an employee's rule naming them. No approval by
    default: a route always has a step, an unresolved step waits with no notice, and only a decision of the last step approves.
  - Revisions: a request is bound to the seat's `lastUpdatedStamp`; `store#Position`'s change supersedes it and reads its
    notices; a change outside the service answers `SOURCE_CHANGED`, an old notice `NOT_PENDING` or `REVISION_CHANGED`; a
    decision retried by the same user answers the first and activates nothing again.
  - Scope: `find#Policies`, `store#Policy` and `resolve#Approvers` read and change only the employers in the caller's People scope
    (another employer's rule is `RECORD_UNAVAILABLE`, its employer `ORGANIZATION_DENIED`; PeopleAccess covers HR and Services'
    seat); rule rows are dated, ended not deleted, their key fields audited with the reason. Notices hold the seat's name,
    employer, department and step, no pay. Lookups are a whitelist, changed only with `PEOPLE_CONFIGURE`.
  - `Enumeration.thruDate`: the framework's `alias-all` skips a name already used (the first member wins), so the framework's
    `EnumAndGroup` and `EnumGroupEnumAndParent` keep the group member's `thruDate`; `ParentEnum`, `EnumAndParent` and Mantle's two
    work-type views only gain a column; no spec or screen compares Enumeration's columns (the framework's DataGrid,
    BusinessDatasets and ReportDrill name theirs). Mantle's `PartyIdentAndEnumGroup` was the one view whose `thruDate` changed
    meaning (R7).
- Fixes:
  - **R1 (high, authority; the user's call 3).** An HR-routed step and the HR fallback were decided with `PEOPLE_HR_EDIT` in place
    of `PEOPLE_REQUEST_APPROVE`, and `record#Decision` admitted either, so an HR editor named on a step (or every HR editor of the
    employer, for HR with no designated officer) decided it without the approval permission. Every step, alternate and fallback
    now needs `PEOPLE_REQUEST_APPROVE`, which `record#Decision` alone asks; BossSetupData grants it to `BOSS_PEOPLE_HR` and its
    capability bundle; design §1.1 and §12. Specs: Mantle PeopleApprovals' new feature (an HR editor without the permission
    designated for an HR step: the request waits unresolved and their decision is `PERMISSION_DENIED`; the spec's HR and fallback
    users hold it, so HR's own decision stays `SELF_APPROVAL`); BOSS PeopleAccess's capability table (HR holds `requestApprove`).
  - **R2 (medium, concurrency).** `record#Decision` locked the request but checked the status it had read before the lock, so a
    second approver waiting on the lock saw "waiting" after a refusal or the last approval committed, and recorded a decision on
    a closed request (then failed on the status transition, or kept a step decision of a dead request). The request is read again
    under the lock. No spec: it needs two transactions at once.
  - **R3 (medium, offboarding scope).** `transfer#ApprovalOwner` let a rule's own approver hand it to any colleague (the contract's
    "by fromUserId"), choosing who decides in their place without `PEOPLE_CONFIGURE`. A rule is now handed over only with
    `PEOPLE_APPROVAL_OWNER_CHANGE` or by a People administrator of its employer (`PERMISSION_DENIED`). The lookup and the transfer
    also take a rule naming the user that starts later (changed in place), which the lookup left out. Spec: the approver's own
    hand-over refused.
  - **R4 (medium, routing; the user's call 2).** A named approver, designated HR officer, alternate or HR fallback who had left the
    employer still decided while their account stayed enabled. A step's approvers are now only people who work for the employer
    now (a current employee or agent), so a leaver's step goes to the alternate, then the fallback, else waits; `Approvals.js`
    exports `reroute(organizationPartyId[, approvalKindEnumId])`, every kind when none is given, for P6's separation (P6's text
    gains it). Spec: a named approver whose employment ends: the route names the alternate, the leaver's decision is
    `NOT_APPROVER`, and the request's notice goes to the alternate.
  - **R5 (low, dated rows).** `store#Policy` took a change or an end dated in the past, rewriting the period a row was in effect
    (the row the decisions made under it name). A change or end now takes effect no earlier than now (the screens' date-only
    "today" included). Spec: an end dated 2001 ends now.
  - **R6 (low; the user's call 1).** JobClassDetail's skill drop-down offered an ended skill type and `store#JobRequirement` took it:
    the drop-down leaves ended values out (no longer cached, as its condition holds the time) and the service refuses one
    (`VALUE_ENDED`; removing an ended one still works). Spec: Mantle PeopleApprovals' lookups feature; a one-off html and qvt
    render of JobClassDetail as HR (an ended skill type absent, a current one listed; not kept).
  - **R7 (low, compatibility).** Mantle's `PartyIdentAndEnumGroup` aliased the enumeration before the group member, so its
    `thruDate` became `Enumeration.thruDate` in place of the member's: the enumeration's `alias-all` excludes it. Nothing reads
    the view today.
  - Small: the supersession feature's `then` named an `unread` its `when` does not return.
- Findings, numbered by the lead F117 to F120 in order:
  - a request's decisions are matched to its route's steps by sequence number, so a rule change after an approval that leaves
    only steps already approved leaves the request waiting with no step and no notice: never approved, but stuck until another
    rule change, and a request cannot be withdrawn yet;
  - other apps' choices of the vocabularies People ends (Projects' Team, TeamPlanner and EditAllocation skills, Products'
    Methods, Mantle's ResourceServices and Routings) still offer and take an ended skill type (the user's call 1 is People's);
  - `get#Position`'s Approval box (who asked, why, each step's approvers and why others may not decide) is read by every reader
    of the seat, a manager of its department included; names only, no pay;
  - `find#OwnedApprovals` reads up to 500 waiting requests of every employer and recomputes each route for one user: cheap at
    the demo's size, a cost to watch as the later kinds join;
  - the worker's findings stand (one approve and one refuse handler per topic; `EmplPosition`'s single transition; a named approver
    who reads no seat deciding from Approvals or the tray only).
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleApprovals 8 of 8 (3.9 s feature time; with
  Approvals.js and Positions.js as built 4 of 8, the new checks failing), then PeopleApprovals, PeoplePositions,
  HumanResServices and PeopleScope 25 of 25 (mr-mantle 8.6 s); BOSS PeopleApprovals, PeopleAccess, PeoplePositions and
  AdminLifecycle 21 of 21 (mr-boss 4.7 s). `moqui lint --screens`: 135 flagged sites as before, none in the People screens.
  Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- For the lead:
  - budget share: Mantle PeopleApprovals gains a feature (about 0.9 s, 3.9 s in all); BOSS none measurable; within §4's estimates;
  - merge hot spots beside the Built note's: mr-mantle `Approvals.js` (`resolve`'s pick, `reroute`, `recordDecision`, `storePolicy`,
    the lifecycle functions, the exports), `Positions.js` (`storeJobRequirement`), `PeopleApprovalServices.xml` and
    `PositionServices.xml` (descriptions), `entity/PartyViewEntities.xml`; mr-boss `data/BossSetupData.xml` (HR's grant and
    bundle row), `Staffing/JobClassDetail.xml`, `PeopleAccess.spec.js` (the capability table), design-people §1.1 and §12,
    design-admin §14, §4's three new rows and P6's new bullet here;
  - the user's calls are in §4: 1 built for P5's choice and service (R6), later phases' vocabularies the same; 2 written into P6,
    with the leaver rule and `reroute` built (R4); 3 built (R1). The acceptance PeopleApprovalsUsable still expects HR's own
    decision refused `SELF_APPROVAL`, which holds with HR holding the permission (not run).

### P6 — Hire and employment change

Design §4 (the employment model), HireEmployee, EmploymentChange; PE-02.

- **Mantle `EmploymentAssignment`** (dated: department, primary position, manager, work location, schedule; inside
  the employment; one primary at a time) and PeopleServices `preview#Hire`, `hire#Employee` (one transaction: person
  chosen or created, the Employee role, exactly one employment through `create#Employment`, the first assignment,
  position occupancy; an orphan `PrtEmployee` relationship completed, not duplicated; an operation key; the
  person's `ownerPartyId` left as it is, and `preview#Hire`'s person match People's own, with the filters off and
  public identity only, so a second employer finds the person and does not make a second one, F59),
  `preview#EmploymentChange`, `apply#EmploymentChange` (transfer, manager change, leave of absence, separation; the
  role and relationship projections maintained by the same service) and `decide#EmploymentChange` on
  `PeopleEmploymentChangeApproval`.
- **`create#Employment` and `update#Employment`** narrow their overlap check to `PrtEmployee` (F3); every other
  caller keeps its behavior. People calls neither `delete#Employment` nor `create#PersonEmployee` (F5).
- **The two holder records** (P4's finding, noted in P4's review for P6 to settle): a seat's occupancy has two records in
  the code, the design's dated `EmplPositionParty` rows (P4's `store#PositionHolder`; Manufacturing's shop floor and Projects'
  resources read them) and `Employment.emplPositionId` (`create#Employment` takes it; TimeServices' rate lookup reads a
  worker's class from it, as do Commons' contact card and the fallback of the directory's job title). P4 reads both, the
  occupancy row winning, and writes only the row. P6's hire and change write the occupancy row with the assignment's
  primary position and decide whether `Employment.emplPositionId` follows it (kept equal to the primary seat, or left for
  the legacy readers alone), and end a holding with the separation that ends its employment (P4 checks the employment only
  at a holding's start).
- **An approver's separation** (§4, the user's call from P5's review): the separation (and a manager change that ends a
  reporting line) routes each People decision waiting on the leaver again, so the step goes to its alternate, then the HR
  fallback, else waits, and the new approver is notified: after ending the employment, its assignment, the lead membership and
  the reporting lines, call `Approvals.js`'s `reroute(organizationPartyId)` (every kind of the employer; built in P5's review)
  for each employer whose employment ended. Routing already skips one who no longer works for the employer. Admin's lifecycle
  transfer (`transfer#ApprovalOwner`) stays for an explicit hand-over of a rule naming the leaver.
- **Department memberships from the assignment** (§4, the user's call from P3's review): the assignment's department is
  written as the person's dated `PrtMember` row to that department (from role `Assignee`), by the hire and the employment
  change in the same transaction, ended when the assignment's department ends; OrgStructure becomes read only for a
  department's memberships (`store#Membership` refuses a department), a team's staying editable there. P3's open department
  memberships (the demo's among them) become the assignments' or are ended, not left beside them. Closing a unit with its
  employees' reassignment is built here.
- **Screens:** HireEmployee (Identity, EmploymentTerms, ConfirmHire) and EmploymentChange (Change,
  ImpactAndConfirm, the impact list holding what later phases add). Quick create "Hire employee".
- **Specs:** Mantle `test/humanres/PeopleEmployment` (a contractor hired; an overlapping employment refused; a
  retry with the key answers the first hire; a rehire keeps the old employment; a transfer ends the old assignment
  from its date; a separation leaves another employer's employment alone; a stale stamp refused). BOSS
  `PeopleHire` (HireEmployee's one qvt render). The golden walk `PeopleHireWalk` (find a person, hire, open
  Employee360, transfer).
- **Usable when** (`acceptance/People/PeopleHireUsable`; design §14.3 "Hire, complete a legacy relationship and
  rehire" and "Transfer, manager change and separation", without tasks and access): `people.hr` hires the demo
  contractor, completes an orphan relationship without a second one, rehires a leaver, transfers an employee after
  approval, and separates one whose other employment stays.

**Built Nov 11 (P6).** mr-mantle af3bbb29, mr-boss (branch `ppl/p6`).
- Checked first (the code over the plan): F3 (`create#Employment` and `update#Employment` refused any overlapping relationship of the
  two, a contractor's `PrtAgent` and a contact's included), F5 (`create#PersonEmployee` makes no Employment), F59 (a Person's owner and
  the Party filters), F81, F86 and F91 (a reporting line names no employer: P3's `linesOf` reads its employers from the employments, so
  two people both employed by the same two employers shared one line at both, and P3's `change#Manager` refused `LINE_SHARED`), P4's
  holder records (`EmplPositionParty` rows and `Employment.emplPositionId`, which TimeServices' rate lookup and the contact card read)
  and P5's `reroute`, `record#Decision` and the topic pattern (one approve and one refuse service per topic, F110). Also: a declared
  date parameter left out reaches a script as null, so an assignment's term not passed is kept and an empty one cleared; a wizard step
  the client loads on its own runs its parents' `always-actions` only, and its form posts its own fields, not the parent's URL
  parameters; `ec.user.nowTimestamp` is not a JavaScript `Date`.
- Mantle (`entity/HumanResourcesEntities.xml`: `EmploymentAssignment` and `EmploymentChange` with their kinds, states and status flow;
  `PakEmploymentChange` and the `PeopleEmploymentChangeApproval` topic in the approval seed):
  - `mantle.humanres.PeopleServices` over a new module `Employment.js`: `preview#Hire` and `hire#Employee` (the HR editor's of the
    employer: the person found among everyone People knows by name or email, with the filters off and public identity only and their
    relationships with this employer alone, so a person employed by another employer is found and not made again; a new person someone
    matches refused until confirmed, `PERSON_MATCHES`; one transaction for the Person (owner left as it is), the Employee role, exactly
    one employment, new through `create#Employment`, an orphan `PrtEmployee` relationship completed with its Employment row, or a rehire
    beside the ended one (`EMPLOYMENT_OVERLAP` otherwise), the work email (`EmailWork`) and phone, the first assignment and its
    projections, and the hire's change row with its operation key, a retry answering the first; never `create#PersonEmployee`; the
    terms' refusals `NOT_A_DEPARTMENT`, `DEPARTMENT_OUTSIDE`, `POSITION_NOT_IN_EFFECT`, `POSITION_INACTIVE`, `POSITION_DEPARTMENT`,
    `POSITION_OCCUPIED`, `MANAGER_NOT_EMPLOYED`, `SELF_REPORTING`, `REPORTING_CYCLE`, `FACILITY_OUTSIDE`), `preview#EmploymentChange` and
    `apply#EmploymentChange` (a transfer, manager change, leave of absence with an optional return, return and separation from a date, at
    the employment's revision read: the terms now and after, the impact list and the route; a transfer and a separation wait for approval
    on the new topic, routed by the employer's rules, the person's manager by default, and are applied by the last approval; the others
    are applied at once; a new change supersedes a waiting one, its request and notices; refusals `REVISION_CHANGED`, `KIND_INVALID`,
    `DATE_OUTSIDE`, `ASSIGNMENT_SCHEDULED`, `NOTHING_CHANGES`, `REASON_REQUIRED`, `ALREADY_ON_LEAVE`, `NOT_ON_LEAVE`, `VALUE_INVALID`,
    `VALUE_ENDED` and the terms'), `decide#EmploymentChange` over `record#Decision` with the topic's `approve#` and
    `refuse#EmploymentChange` (the change checked again when applied), and `find#EmploymentChanges` (HR's of their employers, and a
    waiting one to the approver of its step);
  - the assignment is the source of three projections written in the same transaction: the department membership (an `Assignee`
    `PrtMember` row, P3's call), the seat held (`EmplPositionParty` through Positions.js `holdSeat` and `endHolding`, the checks of
    `store#PositionHolder` without its caller check, so an approver applies a transfer) and the reporting line (a `PrtManager` row,
    ended only when no other employment of the person uses it). The two holder records are settled: the occupancy rows are the dated
    truth and `Employment.emplPositionId` follows the newest primary seat for its legacy readers (kept as the last seat at a
    separation). A separation ends the employment (thruDate audited with the reason, its termination reason and type), the assignment
    and its projections (the holding with it), the leaver's lead and team memberships at the employer and the lines they manage there
    (each report's assignment continues with no manager, a reorganization of its own), leaves another employer's employment alone and
    calls Approvals.js `reroute` for the employer, so a decision waiting on the leaver goes to the step's alternate, the HR fallback, or
    waits; a manager change does too;
  - People.js: `linesOf` reads the assignments (`assignmentsAt`): at an employer whose employment has an assignment the line is there only
    when the assignment names its manager, and a line an assignment names is that employment's alone, never also the line at an employer
    with no assignment (F81, F86, F91); `employmentRevision` (the relationship, Employment row and assignments); Approvals.js's
    `PakEmploymentChange` kind (its revision the change's and the employment's; the notice names a separation's person nowhere in the
    title);
  - OrganizationServices: `change#Manager` is the employment's assignment change (the first assignment of an employment written before
    People, from the date), so another employer's line never changes, its revision for an assigned employment the employment's
    (`get#ReportingTree`'s `lineRevision`); `LINE_SHARED` is left for an orphan relationship with no Employment row; `store#Membership`
    refuses a department (`DEPARTMENT_MEMBERSHIP`), a department's lead staying the unit's and not touching its members; `store#Unit`
    with `close` closes a unit from a date no earlier than now (`UNIT_HAS_CHILDREN`, `UNIT_HAS_POSITIONS`, `MEMBERSHIP_SCHEDULED`), a
    department's people moved to another department of the employer (`REASSIGNMENT_REQUIRED`, `REASSIGNMENT_INVALID`, `ASSIGNMENT_SCHEDULED`),
    its memberships and rollup ended; `get#Unit`'s `membersEditable` (a team's);
  - Employees.js: each employment row's department (the assignment's, public work identity), an HR row's `onLeave`, the history's dated
    assignments and Employee360's `changeEmployment` capability; EmploymentServices' overlap checks of `PrtEmployee` alone (F3).
- BOSS:
  - Screens: `Employees/HireEmployee` (a wizard: Identity, EmploymentTerms, ConfirmHire; the draft and its operation key in the session;
    Hire opens Employee360) and `Employees/EmploymentChange` (a wizard for one employment and kind: Change, ImpactAndConfirm; Apply or
    Ask for approval), both HR's by a new grant `BOSS_PPL_EMPLOYMENT` (denied to `BOSS_PEOPLE`, ALWAYS for `BOSS_PEOPLE_HR`); the
    directory's Hire employee (the one primary) and department column; Employee360's Change employment menu (Transfer, Manager change,
    Leave of absence, Return from leave, Separation), Employment changes (Approve, the primary, and Refuse for the step's approver,
    `decide#EmploymentChange`), the Overview's department and the history's assignments; OrgStructure's department members read only
    and Close unit; Approvals lists the new topic.
  - `ironstone.people`: the capability `employment` (the wizards' grant), the choices `hirePeople` (Mantle's matches, an HR editor's),
    `positions` (an employer's seats in effect, vacant first, by department), `workLocations` and `terminationReasons` and
    `terminationTypes` (ended values left out), `changeParameters` for the change wizard, `canChangeEmployment` and `showsChanges` in
    Employee360's context, `sharedLinks` for the two wizards; the root's quick create `peopleHireEmployee` (Hire employee) and
    notification topic; BossSetupData the topic's link (the person's Employee360) and the grant.
  - Demo (`BossPeopleDemoData.xml`, appended): the seven employees P3 made department members get the assignment those rows describe,
    from the same date (Tomas, Ines, Rafael in Store Operations under Hannah; Leon in Merchandising; Kenji, Sofia, Owen in Service
    Delivery under Amara; the seats held), so P3's department memberships are the assignments'; the heads keep their lines.
- Specs: Mantle `test/humanres/PeopleEmployment` (6 features, 2.4 s feature time: a contractor hired beside the contractor relationship,
  a reader and another employer refused, the retry, the overlap, `create#Employment` beside a contact relationship; a person employed by
  B found by A's HR by name alone and hired with no second Person, a new person matching refused until confirmed, an orphan completed,
  a rehire, a new person's work email and a match by it; a transfer waiting for the manager, its stale revision, missing reason, preview,
  route and impact, HR's own decision `SELF_APPROVAL`, the manager's approval through the notice applying it from its date with the
  assignment, membership, seat, line and `Employment.emplPositionId` moved, a later transfer superseded by a manager change; the manager
  per employment and the chart's change of an assigned employment; a separation with the leaver's lead membership, report and waiting
  activation moved to the alternate; a leave and its return, a department's membership refused and a team's taken, a unit closed with
  its seat ended first and its person moved). PeopleOrganization's two `LINE_SHARED` refusals become a feature of A's changes leaving B's
  lines (0.2 s); PeopleDirectory's public fields gain `departmentName`. BOSS `test/People/PeopleHire` (3 features, 0.5 s: the hire
  wizard's Identity step, one qvt render as HR, the person search finding Services' Kenji and the contractor with her relationship and
  nothing for the reader; the change wizard's Change step, one qvt render for Tomas's transfer with his terms now, Services' employment
  refused; the choices `positions`, `workLocations` and `terminationTypes` with a selected value off the page). `PeopleAccess` gains one
  feature (0.35 s: the wizards opened to HR and refused to the reader, `preview#Hire` and `preview#EmploymentChange` answered for HR with
  the parameters the reader is refused with, Services' employer and employment refused to Retail's HR), its menu feature the quick create
  (HR's `peopleHireEmployee`, the reader's none) and its capability table `employment`; PeopleEmployees' Employee360 render checks the
  department, the assignments and Change employment (and Commons' render its absence); PeopleOrganization's OrgStructure render a
  department's members read only and Close unit. Client walk `test/client/People/PeopleHireWalk` (registered in `suite.js`; 8.9 s, two
  runs 8.9 to 9.1 s): the HR officer finds no one in the directory, hires a new person through the wizard into Store Operations under
  Hannah, lands on Employee360 with the department, and asks for the transfer to Merchandising, which waits for Hannah. Acceptance,
  written and not run: `acceptance/People/PeopleHireUsable` (3 features: the contractor hired into the vacant seat beside her contractor
  relationship with a second Hire answering the first and no login made, the orphan completed, Walter rehired, an overlap refused; Tomas's
  transfer asked by HR, refused to HR's own decision, listed in Hannah's Approvals and on his record with Approve, approved from her
  notice and applied, a looping manager change refused; Priya separated from Retail after the administrator names Hannah the HR
  fallback, the impact keeping her Services employment and naming the unit she leads, her Services line kept, her record in the
  terminal).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleEmployment, PeopleOrganization, PeopleApprovals,
  PeoplePositions, PeopleScope, PeopleDirectory, HumanResServices, PayrollServices, PayrollAdjustments, WorkResources, BusinessTime,
  ProductionShopFloor, WorkTimeEntries, InternalOrganizations and UserLifecycle, 95 of 95 (mr-mantle 22.7 s feature time); BOSS
  PeopleHire, PeopleAccess (12 of 12), PeopleEmployees, PeopleOrganization, PeoplePositions, PeopleApprovals, AdminLifecycle, Resources,
  Contacts, InsightsRecords, ManufacturingShopFloor, AppOrganizationFilters, ProjectsAccess and TimeEntries (with a dependency), 119 of
  119 (mr-boss 23.7 s); the client walk PeopleHireWalk with `./moq test-client mr-boss --serve --spec PeopleHireWalk`, 1 of 1 (8.9 s).
  `moqui lint --screens`: 135 flagged sites, as on master, none in the People screens. Prettier clean on the new and changed
  JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's HumanRes rows `create#Employment` and `update#Employment` (F3) and the People Added table's eight
  PeopleServices of P6 and the changed `store#PositionHolder`, `store#Unit`, `store#Membership`, `change#Manager` and
  `get#EmploymentHistory`; ss-inventory's FindParty CreateEmployeeForm names HireEmployee.
- Design edits: design-people (header; §1.4 the quick create; §4 the employment model as built; Employees, Employee360, HireEmployee,
  EmploymentChange, OrgStructure and OrgChart as built; §12 the topic's handlers; §13 Approvals' topics); design-drawers-commons §4 (the
  `PeopleEmploymentChangeApproval` row: its approve and refuse handlers).
- Findings, numbered by the lead F121 to F130 in order:
  - only a transfer and a separation wait for approval (design §12's topic: transfer, pay change, separation); a manager change, a leave
    of absence and a return are HR's at once, as P3's chart change was. The pay change waits for P23;
  - `Employment.emplPositionId` follows the newest primary seat when a change is applied, also a change dated later, so TimeServices'
    rate lookup reads the new class before the date; the dated truth is the occupancy rows;
  - a separation (or a manager change) dated later calls `reroute` when it is applied, when the leaver still works for the employer:
    their waiting decisions move at the next read or rule change after the date, not on it (F120's class);
  - the hire's person search reads every Person by name or email (customers and contacts too) for an HR editor of any employer, their
    name and preferred name and their relationships with that employer only: what F59 needs, and a confidentiality point for the review;
  - the wizards keep their drafts in the session (the gallery's pattern), not a draft record (style-guide §3.10): a hire or change left
    unfinished is lost with the session;
  - the hire wizard defaults the employer to the HR officer's first organization, which for `people.hr` is Warehouse's returns center
    under Retail (§4's call on internal children): it should prefer an employer with employees (the walk chooses Retail);
  - a seat moved to another department (`store#Position`) leaves its holder's assignment in the old one, and closing a department is
    refused while a seat is in it; a closure is HR's and asks no approval (design §4 OrgStructure says "and approvals");
  - the assignment's schedule (design §4) waits for P9's schedules; the demo's heads (Greta, Hannah, Priya, Amara) have no assignment
    until their next change, and no demo `Employment.emplPositionId` is set;
  - `TerminationReason` has no seeded value, so the separation's reason drop-down is empty until the administrator adds one (Lookups);
  - a department's lead assigned to it is listed twice in OrgStructure (as lead and member).
- For the lead:
  - the budget: mr-mantle's share PeopleEmployment about 2.4 s and PeopleOrganization's new feature 0.2 s; mr-boss's PeopleHire about
    0.5 s and PeopleAccess's new feature 0.35 s; the client walk PeopleHireWalk about 9 s, a little over §4's estimate of 8 s for
    People's client budget (its steps: the directory search, three hire steps, Employee360, two change steps);
  - merge hot spots: mr-mantle `entity/HumanResourcesEntities.xml` (after EmploymentContent), `entity/PeopleApprovalEntities.xml` and
    `data/PeopleApprovalSetupData.xml` (the kind and topic), `People.js` (`linesOf`, the exports), `Approvals.js` (the kinds table,
    `revisionOf`), `Positions.js` (`storePositionHolder` split, the exports), `Organization.js` (`addMembership`, `storeMembership`,
    `storeUnit`, `changeManager`, `reportingTree`), `Employees.js` (`employmentRows`, `employmentHistory`), `PeopleServices.xml` and
    `OrganizationServices.xml` (appended and descriptions), `EmploymentServices.xml`; mr-boss `service/ironstone/people/People.js`
    (`areas`, `linkPaths`, `choiceSources`, `employee360`, the exports), `ContextServices.xml`, `template/PeopleParts.xml`,
    `screen/People.xml` (providers), `People/Approvals.xml`, `Employees.xml`, `Employees/List.xml`, `Employees/OrgStructure.xml`,
    `Shared/Employee360.xml`, `data/BossSetupData.xml` and `BossPeopleDemoData.xml` (appended), `test/People/PeopleAccess.spec.js`
    (header, menu and capability features, the appended feature), `PeopleEmployees.spec.js`, `PeopleOrganization.spec.js`,
    `test/client/suite.js`, the inventories' HumanRes and People rows, design-people's header and §4, §12, §13, design-drawers-commons §4;
  - the user's calls: which changes wait for approval (built: transfer and separation); whether `Employment.emplPositionId` follows the
    newest seat (built) or only one in effect; whether the wizards keep a draft record rather than the session's; how wide the hire's
    person search may look (built: everyone People knows, by name, public identity only).

**Review Nov 11 (P6).** A fresh review of `git diff master...ppl/p6` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §4 (HireEmployee, EmploymentChange, OrgStructure), §12's topic and F3, F5, F59, F81, F86 and F91, with access, scope,
self-approval, revisions and the callers of `create#Employment` first; the user's four calls of Nov 11 (§4) built here; fixes
committed apart per repository ("People P6 review: …"; mr-mantle 20797e1b).
- Checked and found sound:
  - The hire: one service transaction for the person, the Employee role, exactly one employment (`create#Employment`, or an orphan
    `PrtEmployee` relationship completed with its Employment row, never a second relationship; a rehire beside the ended one, which
    is not touched), the first assignment and its three projections and the change row; a retry with the operation key answers the
    first hire, scoped to the requester and an employer still in their scope; the Party owner is left as it is; no
    `create#PersonEmployee`.
  - F3: `create#Employment` and `update#Employment` narrowed to `PrtEmployee` only. Their callers are Mantle's specs and People's
    hire (no screen or other component calls them, mr-boss or otherwise); HumanResServices, PayrollServices, PayrollAdjustments,
    PeoplePositions, PeopleDirectory, PeopleApprovals, PeopleOrganization and PeopleScope pass unchanged with them, and an
    overlapping employment is still refused.
  - Approvals: a transfer and a separation are requests on `PakEmploymentChange` bound to the change row and the employment's
    revision (relationship, Employment row and assignments), so any change of the employment meanwhile supersedes them;
    `record#Decision` refuses the requester and the person (`SELF_APPROVAL`), anyone not the step's approver and a superseded
    request; the notice path passes the message's revision and Employee360's Approve pins the request it read; the last approval
    applies the change after checking its terms again; a refusal needs a reason; a decision retried applies nothing again.
  - Separation: ends the employment (thruDate audited with the reason, its termination reason and type), the assignment, the
    department membership, the seat holding and the line; another employer's employment and a line another employment uses are
    left alone; the leaver's lead and team memberships at the employer end; each report's assignment continues with no manager (a
    change row of its own); `reroute` sends the employer's waiting decisions to the alternate, the HR fallback or waits.
  - The assignment as the per-employment manager: `linesOf` keeps a line at an employer only when that employment's assignment
    names it, and an employment with no assignment keeps P3's reading; the P1–P5 specs (PeopleScope, PeopleDirectory,
    PeopleOrganization, PeoplePositions, PeopleApprovals, BOSS PeopleAccess, PeopleEmployees, PeopleOrganization) pass.
  - Stale stamps: `apply#EmploymentChange` names the employment's revision (`REVISION_CHANGED`), `change#Manager` the employment's for
    an assigned line, `store#Unit`'s close the unit's. Screens: the two wizards are `BOSS_PPL_EMPLOYMENT`'s, denied to the People root
    group and ALWAYS for HR (the People administrator through the root's ALWAYS), and Mantle checks `PEOPLE_HR_VIEW` and
    `PEOPLE_HR_EDIT` and the employer again; PeopleAccess covers HR and the reader. No pay is read or written.
- Fixes:
  - **R1 (medium, confidentiality; the user's call 4).** The hire's person search read every Person by name (customers and contacts
    of any organization) for an HR editor of any employer; `preview#Hire` and `hire#Employee` took any supplied `partyId` and answered
    the person's name; and the `hirePeople` choice labelled any selected id with the person's name. A name now finds only people with
    a relationship to one of the caller's employers (either way, any type and dates, or an application to one of their positions);
    anyone else is found only by an exact email (the work email given, or a searched term that is an email); a person chosen by id
    is admitted only when related or matched by the email given, else `RECORD_UNAVAILABLE`; the choice labels a selected id only when
    Mantle admits it, and Identity names the chosen person through `preview#Hire` with the draft's email. Specs: Mantle
    PeopleEmployment's second feature (B's employee not found by name, found by email, refused by id alone; A's contractor found by
    name; the spec's people have work emails, which the hire helper gives); BOSS PeopleHire (Kenji none by name, found by his email,
    his id unnamed).
  - **R2 (medium, legacy readers; the user's call 2).** `Employment.emplPositionId` followed a change dated later at once, so
    TimeServices' rate lookup read the new class before the date. It is set at once only by a change in effect now; the daily
    ServiceJob `apply_EmploymentDueAssignments` (`PeopleServices.apply#DueAssignments`, seed data with the topic) sets each employment
    whose assignment in effect names another seat, each in its own transaction, a failure logged by its employment, a rerun changing
    nothing. A seat named only by `Employment.emplPositionId` (written before People) gets its dated occupancy row to the change's
    date, so the seat is free from then while the Employment still names it. Spec: the transfer feature (the yard seat until the
    date, the job changing nothing; at the date, by effective time, the job sets the office; a rerun nothing); it fails on the code as
    built.
  - **R3 (medium, the user's call 3).** The wizards kept their drafts in the session, lost with it. New Mantle
    `mantle.humanres.employment.EmploymentDraft` (dated, owned by its user) with `get#`, `store#` and `delete#EmploymentDraft`: the
    caller's own only (another's is `RECORD_UNAVAILABLE`, a change's draft of an employment in scope), the kind's preview fields only,
    an operation key `DRAFT-<id>` made once; HireEmployee and EmploymentChange read it in `always-actions`, keep it at each step,
    show "A hire (change) you started …, resumed" with Discard it, and discard it when the hire or change is made. Specs: Mantle
    PeopleEmployment's draft feature; BOSS PeopleHire's Identity render resumes a draft left.
  - **R4 (low, data; the user's request).** `TerminationReason` had no value, so a separation's reason list was empty: Mantle's seed
    adds Resignation, End of contract, Dismissal, Retirement and Redundancy. Spec: PeopleHire's choice lists them.
  - **R5 (low, usability; the worker's finding).** The hire wizard defaulted the employer to the officer's first organization
    (Warehouse's returns center for `people.hr`): now the active one, else the first with someone employed.
  - **R6 (low, dated rows).** A separation ended only the lead and team memberships started before its date: one starting on or
    after it stayed open past the employment. It is now ended on its own start. No spec.
  - The client walk: 8.8 to 9.1 s as built, now 7.26 s (two runs, 7.26 and 7.26 s) with its golden path whole (the directory search,
    the hire's three steps, Employee360, the transfer's two steps): the employer is the default (R5), a drop-down's choice no longer
    waits for its menu to close (the next action waits for its element), shorter search terms.
- Findings, numbered by the lead F131 to F136 in order:
  - a change applied with a later date (an approved transfer, a leave's return date) refuses every change dated before it,
    a separation included (`ASSIGNMENT_SCHEDULED`), and an applied future assignment cannot be withdrawn: a person who resigns before
    an approved transfer's date cannot be separated until after it, and a return from leave cannot come early;
  - `hire#Employee`'s overlap check reads without a lock: two hires of one person at once with different operation keys could both
    make an employment (P5's `record#Decision` locks its request; `create#Employment` does not);
  - a draft write names no revision: two tabs of one HR user overwrite each other's draft (the owner's alone, no one else's);
  - a separation dated later calls `reroute` when applied (the worker's finding stands); the new daily job could route on the date;
  - the `positions` choice marks a seat held only through `Employment.emplPositionId` (no occupancy row) vacant;
  - the email match reads the `EmailWork` and `EmailPrimary` purposes only;
  - the worker's other findings stand (a closure asks no approval; a seat moved to another department leaves its holder's assignment;
    the demo heads have no assignment; a department's lead listed twice in OrgStructure).
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleEmployment, PeopleOrganization, PeopleApprovals,
  PeoplePositions, PeopleScope, PeopleDirectory, HumanResServices, PayrollServices, PayrollAdjustments, WorkResources, BusinessTime,
  ProductionShopFloor, WorkTimeEntries, InternalOrganizations and UserLifecycle 96 of 96 (mr-mantle 23.4 s), then after the last
  fix PeopleEmployment, PeopleOrganization, PeopleApprovals and PeopleScope 24 of 24 (10.9 s; PeopleEmployment 7 features, 3.1 s; its
  seat check failing on the code as built); BOSS PeopleHire, PeopleAccess, PeopleEmployees, PeopleOrganization, PeoplePositions,
  PeopleApprovals, AdminLifecycle, Resources, Contacts, InsightsRecords, ManufacturingShopFloor, AppOrganizationFilters,
  ProjectsAccess and TimeEntries 119 of 119 (mr-boss 23.8 s), PeopleHire again 3 of 3 (0.8 s); the client walk PeopleHireWalk
  (`./moq test-client mr-boss --serve --spec PeopleHireWalk`) 1 of 1, 7.26 s twice. `moqui lint --screens`: 135 flagged sites as
  before, none in the People screens. Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, the acceptance suite
  (PeopleHireUsable hires only related people, so R1 leaves it as written).
- For the lead:
  - budget share: Mantle PeopleEmployment 3.1 s (about 0.7 s more than built: the draft feature and the job's check); BOSS
    PeopleHire 0.8 s; the client walk 7.3 s, under §4's 8 s estimate;
  - merge hot spots beside the Built note's: mr-mantle `Employment.js` (`project`, `moveSeat`, `applyDueAssignments`, `separate`,
    `matchesOf` and its helpers, `planHire`, the draft functions, the operations), `PeopleServices.xml` (four services appended),
    `HumanResourcesEntities.xml` (`EmploymentDraft`, the TerminationReason values), `PeopleApprovalSetupData.xml` (the job);
    mr-boss `People.js` (`hirePeople`), the wizards' screens, `PeopleHire.spec.js`, `PeopleHireWalk.spec.js`, design-people §4,
    HireEmployee and EmploymentChange, usl-inventory's People rows, §4's four new rows;
  - the user's calls are in §4 (four rows), all built here (1 as built).

### P7 — Checklists, equipment return, provisioning and employee import

Design §4 (checklists, equipment, provisioning), §12 ChecklistTemplates and EmployeeImport, §13 WorkItemDetail and
EquipmentDetail, Employee360's AssignedEquipment; PE-02, PE-19 (the `employees` target), MT-03 (its People part, §4).

- **Mantle `mantle.work.ProcessServices`** (new; the first part of MT-03, under its names, §4, F14, F54):
  - `WorkEffortProcessPolicy` and `WorkEffortStepPolicy` (design-maintenance §4.1), dated and minimal, with the
    fields a checklist needs: on the process its using policy (People's here) and a guards-execution flag, false
    for People's checklists; on the step the required flag, the assignable role and the due offset. Maintenance's
    P6 extends both records (publication, approval and applicability on the first; the response kind, measurement,
    evidence and waiver fields on the second) and sets the flag for its procedures.
  - `store#ProcessStep` (a step of a template tree and its step policy) and `instantiate#WorkProcess`: the
    two-pass copy of design-maintenance §4.2 in its own module (an ID map, fields reset, dependencies remapped, one
    `WeatBasedOn` link per node, from each task to its template step), one tree in one transaction, an operation
    key answering the first root, under a lifecycle root of purpose `WepPrOrgMgmt` with no documentation space, due
    dates from offsets, assignees by role. `clone#Project` and `clone#WorkEffort` are not changed. Maintenance's P6
    adds the checked path of design-maintenance §4.2 (approval and effectivity) for a process whose policy guards
    execution, and leaves this path as it is.
  - Managed work (the same rule in impl-maintenance §4): the generic task and work-effort services refuse a root
    that has a MaintenanceWorkOrder row and its steps, and work whose process policy guards execution; People's
    checklist tasks stay ordinary tasks. People's policy asks for no evidence, readings or waivers, so
    `update#Task` and `set#TaskStatus` complete a checklist task, from a screen or a phone, before and after
    Maintenance is built.
- **Checklists:** PeopleServices `find#Checklists` and `store#Checklist` (over `store#ProcessStep`; the source link,
  visibility and protected flag of design §12 are People's, on the step); `hire#Employee` and
  `apply#EmploymentChange` instantiate after commit, each template on its own. Offboarding, separation and goal
  tasks are left out of `get#TaskObjectTags` (PE-01, F22); P21 adds the tasks linked to a case.
- **Equipment** (review Y6): `get#AssignedEquipment`; a separation raises one return task per current
  AssetPartyAssignment, each naming its assignment by a `WorkEffortAssetAssign` row of the asset and a `WorkEffortParty`
  of the holder in the assignment's role, since the assignment's key is four fields and no record link can name it
  (F60). The return is `replace#AssetPartyAssignment` to the receiving custodian, which the service requires (F52),
  after People's scope check; a Mantle EECA on AssetPartyAssignment's update that sets `thruDate` (the service ends a
  row so and never deletes) completes the open return tasks of that asset, party and role, so Warehouse's and, later,
  Maintenance's custody changes complete them too (F45). Maintenance's P2 adds only its guard and an effective date to
  `replace#AssetPartyAssignment`.
- **Provisioning** (Admin's entry, owner contract; F15): Mantle's lifecycle operation gains a provisioning kind and
  its steps (account or invitation, organization membership, approved grants, notification);
  `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd`, keyed by party, organization,
  employment, grant proposal and operation key, over `invite#User`, `create#StaffAccount` and `start#Lifecycle`;
  the mr-boss SECA (`when="tx-commit"`) on `hire#Employee` and `apply#EmploymentChange`; the IT checklist task
  carrying the `operationId`. The grant proposal is BOSS's: `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default, the
  account request optional on ConfirmHire (design: no login merely for payroll); anything more is chosen by HR from
  the bundles HR may grant, and Admin's delegation rules decide (§4). A failed call is logged against the employment
  and retried by key; it never undoes the hire.
- **The `employees` import target** (owner contract, F16): a `rows` target seeded in Mantle on the pattern of
  staffInvitations (mr-mantle data/PartyInvitationData.xml:48-61), its row services over `preview#Hire` and
  `hire#Employee`, password, group and pay columns refused; `get#ImportMount` learns People's mount
  (DataImport.js:39-59 knows Admin and the catalog apps), and Data.js's owner routes its place. Its import
  permissions are `PEOPLE_IMPORT` and `PEOPLE_HR_EDIT`, its view permission `PEOPLE_HR_VIEW`, and it names no
  `ADMIN_*` permission: a target's permissions are all required, so `ADMIN_TRANSFER_RUN` beside them would shut HR
  out of EmployeeImport (§4).
- **Screens:** ChecklistTemplates; `People/Tasks/WorkItemDetail` and `People/Employees/EquipmentDetail` with
  People's context branches (F19); Employee360's AssignedEquipment; EmployeeImport, the Shared/DataImport mount.
- **Specs:** Mantle `test/work/WorkProcess` (a template instantiated once per key, its dependencies remapped and
  each task linked to its step; a step that fails rolls back its tree and leaves the hire; a checklist task
  completed by `set#TaskStatus`; ending an assignment completes its return task), which must pass unchanged after
  Maintenance's P6 and its `test/work/MaintenanceProcesses`;
  `test/party/UserProvisioning` (one operation per key; an access end for one employer keeps the other's access);
  BOSS `PeopleLifecycle` (a hire's SECA requests provisioning after commit and a failure leaves the hire; the
  import refuses a password column and a holder of `PEOPLE_HR_EDIT` without `PEOPLE_IMPORT`, and applies valid
  rows).
- **Usable when** (`acceptance/People/PeopleLifecycleUsable`; design §14.3 "Separation and equipment" and "Pay
  rates and phones", its phone half; design-admin §15.3 "Hire and invitation", its People half): a hire starts its
  onboarding tasks and one invitation; the IT task shows Admin's outcome; the new employee's phone lists the
  onboarding task and completes it, and lists no offboarding task; a separation raises a return task per held
  asset, and ending the assignment from EquipmentDetail completes it; a CSV of five employees, one a duplicate,
  hires four and names the one, and Admin's Imports lists the run for a data operator who also holds
  `PEOPLE_HR_VIEW`.

**Built Nov 11 (P7).** mr-mantle 603f448a, mr-boss (branch `ppl/p7`).
- Checked first (the code over the plan): F14, F15, F16, F22, F45, F49, F52, F54, F60 as P0 found them, and P6's F121 to F136. Also:
  Admin's invitation needs a real inviter holding `ADMIN_IDENTITY_MANAGE` (acceptance rechecks the inviter from the records), and
  an HR officer holds none, so People cannot invite as itself nor as the system; `start#Lifecycle`'s organization removal refuses an
  account whose employment relationship the separation has already ended (`NOT_A_MEMBER`); a `tx-commit` rule runs on a service
  worker as the caller, after the commit; a `WetProject` root lists in Projects for an all-projects reader; a separation and a
  transfer are applied by `decide#` or `approve#EmploymentChange`, not by `apply#EmploymentChange`; Shared/DataImport's mount knew
  Admin and the catalog only; a then-block line that starts with a regular expression continues the line before it.
- Mantle:
  - MT-03's first part, under its names (§4, F14, F54): `entity/WorkProcessEntities.xml` `WorkEffortProcessPolicy` (dated; the using
    policy, a new WorkProcessPolicy type with `WppPeopleChecklist`; `guardsExecution`, N for People; an execution's operation key)
    and `WorkEffortStepPolicy` (dated; required, the role, `dueOffsetDays`); `mantle.work.ProcessServices` over `WorkProcesses.js`:
    `store#ProcessStep`, `instantiate#WorkProcess` (the two-pass copy: definition fields, template flag, status and actuals reset,
    due dates from the offsets, `WeatDependsOn` remapped, one `WeatBasedOn` per node, the policies copied, each step assigned to the
    party named for its role; one transaction; the key answers the first root) and `check#ManagedWork` (`MANAGED_WORK` for work whose
    own, root's or parent's policy guards execution, and a root with a MaintenanceWorkOrder row once the entity exists), called by
    `TaskServices` `update#Task`, `set#TaskDates`, `set#TaskStatus`, `move#Task`, `set#TaskRecurrence` and `WorkEffortServices`
    `delete#WorkEffort`, `add#`, `remove#` and `replace#WorkEffortParty`; the services ask the policy's permission (`policies` table),
    and People calls the module after its own checks; `clone#WorkEffort` and `clone#Project` unchanged;
  - checklists (`entity/PeopleChecklistEntities.xml` `ChecklistTemplate`, `ChecklistStep`, `EmploymentChecklist`; `Checklists.js`):
    PeopleServices `find#Checklists`, `store#Checklist`, `store#ChecklistStep` (an HR editor of the employer; roles Employee,
    Manager, HumanResourcesManager, else a named person employed by the employer), `start#Checklists` (Mantle's tx-commit rules,
    `service/PeopleChecklists.secas.xml`, on `hire#Employee` and an applied `apply#`, `decide#` and `approve#EmploymentChange`; each
    template of the employer and kind in its own transaction through `start#Checklist`, a failure logged by employment and template;
    the change's record decides, so an approving manager starts a transfer's checklist), the root a `WetTask` of purpose
    `WepPrOrgMgmt` named for the person, offboarding tasks protected and left out of `CalendarDavServices.get#TaskObjectTags` (F22),
    and `get#ChecklistTask` (the People box: its people, an HR reader of the employment's employer, the employee when theirs to see);
    `preview#Hire` notes the onboarding checklists that will start;
  - equipment: `start#EquipmentReturn` (a separation's return task per holding on its date, under a root of its own, protected,
    assigned to the HR officer who asked, naming the holding by `WorkEffortAssetAssign` and a `WorkEffortParty` of the holder in its
    role, F60), `entity/PeopleChecklist.eecas.xml` on an `AssetPartyAssignment` update that sets `thruDate` calling
    `complete#ReturnTasks` (never refusing; Warehouse's `replace#AssetPartyAssignment` unchanged and completing them too, F45, F52),
    `get#AssignedEquipment` (the person and HR of their employer), `get#EquipmentCustody` and `return#Equipment` (an HR editor; the
    receiving custodian employed now by one of the caller's employers, `CUSTODIAN_INVALID`);
  - provisioning (owner contract, F15): `IdentityServices.request#Provisioning` and `request#AccessEnd` in `Lifecycle.js` over an
    applied hire (with `accessRequested`) or separation, admitted for the change's requester, an HR editor of the employer, the one
    whose decision applied it or an identity operator; one operation keyed by the change (Provisioning, kind `UlkProvision`: membership,
    invite, grants, notify; access end: the employer's other relationships and, with no internal organization left, sessions and
    memberships, else the memberships step skipped naming the other employer), run at once for an identity operator of the
    organization and otherwise waiting (`OPERATOR_REQUIRED`) for one, who runs each from LifecycleDetail (`retry#LifecycleStep`
    knows the new steps); the change records the operation and its IT tasks are linked (`ChecklistStep.operationId`); the
    operation's records written with authorization off after the check. `hire#Employee` takes `requestAccount`;
    `note#AccessRequestFailure` keeps a failure on the change; LifecycleOperations' texts name a step waiting for an operator;
  - the `employees` import (F16): `data/PeopleLifecycleSetupData.xml` seeds the `rows` target (fields of the hire, keyed by person and
    work email; password, group, permission, user id, salary, wage, pay, tax, bank and IBAN columns refused; `PEOPLE_IMPORT` and
    `PEOPLE_HR_EDIT` to import, `PEOPLE_HR_VIEW` to view, no `ADMIN_*`), its row services in `PeopleImport.js`
    (`validate#` over `preview#Hire`, `apply#` over `hire#Employee` under the row's key, `find#EmployeeImportScopes`), callable by any
    user as Mantle's identity row services are, each checking `PEOPLE_IMPORT` and the hire's own rules;
  - F131 and F134: `withdraw#EmploymentChange` (an HR editor; an applied transfer, manager change, leave, return or reorganization set
    for a later date: its assignments end on their own start, the assignment before continues, the membership, seat and line it would
    have moved stay as they were; `EchWithdrawn` with when, who and why; a begun leave loses only its return; `CHANGE_IN_EFFECT`,
    `LATER_CHANGE_SCHEDULED`, `NOT_WITHDRAWABLE`, `REASON_REQUIRED`, `POSITION_OCCUPIED`); a separation dated before scheduled changes
    withdraws them on its application and records itself on them (`supersededByChangeId`; its preview lists them), and a return
    withdraws the leave's scheduled return, so it can come early; `apply#DueAssignments` routes an employer's waiting decisions on the
    date a later separation, manager change, transfer or reorganization comes (`EmploymentChange.reroutedDate`), each employer in its
    own transaction.
- BOSS:
  - `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd` (`Provisioning.js`; BOSS's proposal `BOSS_USERS`
    and `BOSS_PEOPLE_SELF`, any other bundle only one the caller may give; a failure noted on the change and answered, never thrown);
    `service/PeopleLifecycle.secas.xml` (tx-commit on `hire#Employee` with an account asked and on an applied separation through
    `apply#`, `decide#` and `approve#EmploymentChange`); the `BOSS_PPL_ACCESS_REQUEST` grant (any user; Mantle admits only the change's
    own people);
  - screens: `People/Settings/ChecklistTemplates` (Templates, Steps; New checklist, Rename, End, Add step, Edit, End);
    `People/Settings/EmployeeImport` (Shared/DataImport, the `employees` target; `get#ImportMount`'s People mount and the owner route
    `peopleEmployeeImport`); `People/Tasks/WorkItemDetail` (WorkItemDetail's People branch: the Commons rule, Overview, Files and
    Chatter only, no clone, request or delete, the People box `template/PeopleWorkItem.xml`, read only for an HR reader);
    `People/Employees/EquipmentDetail` (EquipmentDetail's People context `template/PeopleEquipment.xml`: Custody and End assignment;
    no files or notes); Employee360's Assigned equipment, Withdraw (or Withdraw the return) and Request access again in Employment
    changes; ConfirmHire's Request an account; Settings opened to the HR officers (`BOSS_PPL_SETTINGS_HR`, ALWAYS);
  - demo: Retail's New starter and Leaver checklists and Ines Varga's laptop (`BossPeopleDemoData.xml`, appended).
- Specs: Mantle `test/work/WorkProcess` (5 features, 1.1 s: a template instantiated once per key with offsets, assignees, a remapped
  dependency, `WeatBasedOn` links and an ended step left out, the reader refused; a tree failing part way leaving nothing; a checklist
  task completed by `set#TaskStatus` and a guarded process's task refused `MANAGED_WORK` by `update#Task`, `set#TaskStatus` and
  `add#WorkEffortParty`; a hire starting its checklist after commit while a failing template leaves the hire; a separation's return
  task completed by `replace#AssetPartyAssignment`; written with People's policy and the generic services only, so it passes
  unchanged after Maintenance's P6), `test/party/UserProvisioning` (2 features, 0.3 s: one operation per key waiting for an operator,
  a reader, no account asked and an unregistered bundle refused, the operator's retry inviting the work address once; an access end
  for one employer keeping the other's access, the last employer's waiting for and then ending the memberships, no account
  `NO_ACCOUNT`), `test/humanres/PeopleChecklists` (3 features, 1.5 s: templates HR's, the reader and Services' HR refused; the onboarding
  task on the employee's phone and opened under People, the offboarding task off it; equipment read and returned, a custodian
  outside refused, the return task completed) and `test/humanres/PeopleScheduledChanges` (4 features, 1.2 s: a scheduled transfer
  withdrawn with its terms kept, the reader, Services' HR, a change in effect refused; a separation withdrawing a later transfer; an
  early return; the job routing on the date). BOSS `test/People/PeopleLifecycle` (3 features, 1.35 s: the SECA's provisioning with
  its proposal and IT task, a failure noted and asked again from Employee360; the import refusing a password column, an HR editor
  without `PEOPLE_IMPORT` and the reader, hiring two rows and naming the repeat; ChecklistTemplates', EquipmentDetail's and
  WorkItemDetail's People renders, one qvt each); `PeopleAccess` gains one feature (0.46 s: the checklist and equipment rules and the
  two Settings screens) and its menu, capability and Settings cases follow HR's opened Settings; PeopleEmployees' Employee360 render
  checks Assigned equipment. Acceptance, written and not run: `acceptance/People/PeopleLifecycleUsable` (4 features).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle WorkProcess, UserProvisioning, PeopleChecklists,
  PeopleScheduledChanges, PeopleEmployment, PeopleOrganization, PeopleApprovals, PeoplePositions, PeopleScope, PeopleDirectory,
  HumanResServices, PayrollServices, PayrollAdjustments, UserLifecycle, StaffIdentity, StaffInvitation, StaffInvitationImport, Dav,
  CalendarServices, WorkMyTasks, WorkProjectItems, WorkProjectServices, WorkProjectPlan, WorkResources, ProductionShopFloor,
  WorkTimeEntries, InternalOrganizations and ContactBooks 206 of 206 (mr-mantle 35.5 s), and after Prettier the eight touched 43 of 43;
  BOSS PeopleHire, PeopleAccess, PeopleEmployees, PeopleOrganization, PeoplePositions, PeopleApprovals, PeopleLifecycle,
  AdminLifecycle, AdminImports, AdminRegistries, AdminUsers, WarehouseFacilities, WarehouseInventory, Tasks, WorkItemDetail, WorkItems,
  ProjectsAccess, ManufacturingWorkCenters, ManufacturingDowntime, AccountingFixedAssets, ProductsImport, InsightsRecords, Resources,
  Contacts, AppOrganizationFilters and TimeEntries 221 of 221 (mr-boss 38.6 s), PeopleLifecycle 3 of 3 again after its last fix; the
  client walk PeopleHireWalk 1 of 1 (7.1 s). `moqui lint --screens`: 135 flagged sites as before, none in the screens P7 touched, and
  no new TUI worklist entry. Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added table (P1 to P7: the new PeopleServices, ProcessServices and IdentityServices rows) and
  the `replace#AssetPartyAssignment` and `set#TaskStatus` rows; ss-inventory's note (no baseline form maps to P7's screens).
- Design edits: design-people (header; §4 as built; HireEmployee, EmploymentChange, EmployeeImport, ChecklistTemplates,
  WorkItemDetail and EquipmentDetail as built); design-admin §4.1 Provisioning from People as built (owner design); design-maintenance
  §4.1 MT-03's first part as built; design-crosscut §3.10's People row.
- Findings, numbered by the lead F137 to F147 in order:
  - People's provisioning and access end wait for an identity operator unless the HR officer is one: Admin's invitation needs an
    inviter with `ADMIN_IDENTITY_MANAGE` at sending and acceptance, so neither HR nor the system can send it. Nothing notifies the
    operators: they find the operation in LifecycleOperations' Needs attention, and the IT task shows it waiting;
  - the rules on `decide#` and `approve#EmploymentChange` join those on `hire#Employee` and `apply#EmploymentChange` (design: the
    latter two) because a transfer and a separation are applied by their last approval;
  - `create#StaffAccount` is not used: a hire is invited to the work email (a person with none fails the invite step until one is
    added and the step retried); the provisioning is the default proposal only from ConfirmHire (the service takes more bundles the
    caller may give; no screen offers them);
  - an access end records no participant steps (owned drives, calendars, Projects assignments): those are offered by Admin's own
    disable; the memberships end at the separation's date and the person keeps a membership while employed elsewhere;
  - a return task is assigned to the HR officer who asked for the separation (design: "the asset's custodian role", which names no
    one); the receiving custodian is chosen at the return, an employee of the employer;
  - Settings is opened to the HR officers (ALWAYS) for Checklists and Employee import, so HR also opens Approval rules and Lookups,
    whose changes Mantle refuses without `PEOPLE_CONFIGURE` (P1's note foresaw an editor's group allowed there);
  - a scheduled separation cannot be withdrawn (`NOT_WITHDRAWABLE`), and a report's assignment set for after a leaver's separation
    keeps naming them;
  - the import takes the department, position, manager and work location by id, a date as yyyy-MM-dd, and requests no account;
  - the exit interview is a link kind only until P16's forms;
  - the managed-work check adds one or two reads to each generic task write;
  - the job's first run marks every earlier separation and manager change (their `reroutedDate` empty), routing each employer once.
- For the lead:
  - budget share: mr-mantle about 4.1 s (WorkProcess 1.1, UserProvisioning 0.3, PeopleChecklists 1.5, PeopleScheduledChanges 1.2);
    mr-boss about 1.8 s (PeopleLifecycle 1.35, PeopleAccess's feature 0.46); the client walk unchanged (7.1 s);
  - merge hot spots: mr-mantle `Employment.js` (statusTexts, assignmentsOf, checkDate and the superseding, withdrawScheduled,
    applyChange, applyDueAssignments, planHire's note, impactOf, changeRow, the exports), `PeopleServices.xml` (hire#Employee,
    approve#EmploymentChange and apply#DueAssignments parameters; services appended), `HumanResourcesEntities.xml` (EmploymentChange's
    fields and status), `Lifecycle.js` and `IdentityServices.xml` (appended), `IdentityEntities.xml`, `PartyLifecycleData.xml`,
    `PeopleApprovalSetupData.xml` (the job), `TaskServices.xml` and `WorkEffortServices.xml` (the guard lines), `CalendarDavServices.xml`;
    mr-boss `BossSetupData.xml` and `BossPeopleDemoData.xml` (appended), `People.js` (linkPaths, employee360), `ContextServices.xml`,
    `Shared/Employee360.xml`, `Shared/WorkItemDetail.xml`, `Shared/EquipmentDetail.xml`, `Shared/DataImport.xml`, `DataImport.js`,
    `LifecycleServices.xml` (appended), `People/Settings.xml`, `People/Employees.xml`, `ConfirmHire.xml`, `PeopleSpecLib.js`,
    `PeopleAccess.spec.js`, `PeopleEmployees.spec.js`, the inventories, design-people's header and §4, design-admin §4.1,
    design-maintenance §4.1, design-crosscut §3.10;
  - the user's calls: whether HR may open Settings (built) or its editors move out of it; whether a hire's default proposal may be
    sent without an identity operator (built: it waits for one); who a return task is assigned to (built: the HR officer who asked);
    whether a scheduled separation is withdrawable (built: no).

**Review Nov 11 (P7).** A fresh review of `git diff master...ppl/p7` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §4 (checklists, equipment, provisioning), §12 ChecklistTemplates and EmployeeImport, §13, design-admin §4.1, design-maintenance
§4.1 and F14, F15, F16, F22, F45, F52, F54, F60, F131, F134, with the managed-work guard's callers, protected tasks, the custody rule,
the access requests and the import first; the user's four calls of Nov 11 (§4) built here; fixes committed apart per repository
("People P7 review: …"; mr-mantle 929d6b62).
- Checked and found sound:
  - The managed-work guard (`check#ManagedWork` in `update#Task`, `set#TaskDates`, `set#TaskStatus`, `move#Task`, `set#TaskRecurrence`,
    `delete#WorkEffort` and the WorkEffortParty writers) reads the work and its process policies with authorization off and refuses
    only a policy that guards execution (none is seeded: People's is N) or a root with a MaintenanceWorkOrder (not yet defined), so
    ordinary work answers as before. Callers searched (Commons, Projects, Customer Service, Manufacturing, Purchasing, Git, production
    services, the EECAs): the Work, Projects, Customer Service, Manufacturing, Commons and Purchasing task specs listed below pass.
  - `instantiate#WorkProcess`: the two-pass copy, the key answering the first root (read back from the `WeatBasedOn` links), one tree
    in the caller's transaction; `start#Checklists` runs each template in its own transaction after the hire's or change's commit, so a
    failing step rolls back its tree and leaves the hire (WorkProcess's second and fourth features).
  - The custody EECA completes only the open return tasks whose `WorkEffortAssetAssign` and holder `WorkEffortParty` name that asset,
    holder and role; Warehouse's `replace#AssetPartyAssignment` is unchanged and completes them (WorkProcess's last feature).
  - Provisioning and access end: one operation per key (a key of another request `KEY_IN_USE`), steps run only for an identity
    operator of the employer and otherwise wait, a failure noted on the change in its own transaction and never undoing the hire, an
    access end for one employer skipping the memberships while another employs the person (UserProvisioning). BOSS's proposal adds
    only bundles the caller may give, by Admin's delegation rule.
  - The `employees` target: `PEOPLE_IMPORT` and `PEOPLE_HR_EDIT` to import, `PEOPLE_HR_VIEW` to view, no `ADMIN_*`; password, group,
    permission, user id and pay columns refused; each row validated by `preview#Hire` and applied by `hire#Employee` as the importer
    with their own permission, employer and person checks (a row naming another employer refused).
  - `withdraw#EmploymentChange` (an HR editor of the employer, the revision, a reason; a change in effect or followed by a later one
    refused) and the separation's superseding of the scheduled changes it overtakes (recorded on them, listed by its preview).
- Fixes:
  - **R1 (high, confidentiality).** Checklist executions and equipment return tasks were owned by the employer
    (`ownerPartyId`), and `get#RecordLinkInfo`'s work effort rule shows work owned by one of the user's organizations to everyone of
    it: any colleague at the employer read "Offboarding: …" and "Return … from …" by id in Commons, on the leaver's contact page and
    in search. Checklist templates, executions and return work now have no owner (`clearOwners` after the copy, for templates written
    with one as the demo's are); the employer stays on `ChecklistTemplate` and `EmploymentChecklist`. Spec: PeopleChecklists' equipment
    feature (a reader of the employer does not reach the task).
  - **R2 (high, confidentiality, F22).** A protected task was reached outside CalDAV: the return task's holder (the leaver, a
    `WorkEffortParty` in the holding's role) listed it in Commons' Tasks, Today, `get#MyTasks` and search and opened it, and
    `get#ChecklistTask` gave them People's read-only box. Mantle's `Checklists.js hiddenTaskIds`: a protected task is reached only by
    a current Assignee who is not the person it is about (unless its step is the employee's to see); applied in `get#RecordLinkInfo`
    (before the staff rule), `search#Universal`, Commons `find#TaskRows`, `get#UserTodayItems` and `get#ChecklistTask`;
    `get#MyTasks` (other instances' tools) and `TaskServices.get#FullCalendarData` leave every protected task out, as CalDAV does.
    Spec: PeopleChecklists (the manager assigned reaches it; the holder and a reader neither by the record rule, nor in `get#MyTasks`,
    nor in People's box); it fails on the code as built.
  - **R3 (medium, data).** A withdrawn transfer's seat holding (ended on its own start) still counted in `Positions.holdersOf`, so the
    seat read as held by the person for good (`POSITION_OCCUPIED` on the next hire into it). `holdersOf` leaves such a row out. Spec:
    PeopleScheduledChanges' last feature hires into the seat feature one's withdrawn transfer named; it fails on the code as built.
  - **R4 (medium, failure tolerance).** `complete#ReturnTasks`, run by the custody EECA inside the custody change's transaction, called
    `set#TaskStatus` there: a task that could not be completed marked the custody change's transaction for rollback, and its catch
    cleared the caller's messages. Each task is now completed in its own transaction and error frame (`probe`), a failure logged by
    task. No spec (no failing task can be made through the services).
  - **R5 (medium, access).** Mantle's `request#Provisioning`, callable by any user, accepted any registered bundle, so a direct caller
    could propose a bundle BOSS's entry would refuse for an operator to give on retry. It now applies Admin's delegation rule itself
    (the delegable permission held; never ADMIN or a privileged group): `GRANT_NOT_YOURS`. Spec: UserProvisioning's first feature.
  - **R6 (low, managed work).** `create#Task` added a step under work whose policy guards execution. It now asks
    `check#ManagedWork` of the parent and root it names. Spec: WorkProcess's managed-work feature.
  - **R7 (the user's call 1).** ChecklistTemplates and EmployeeImport moved under Employees (`People/Employees/ChecklistTemplates`, and
    `People/Employees/EmployeeImport` wrapping Shared/DataImport as Products' ProductImport does, so the grant sits on People's own
    screen), opened to the HR officers by `BOSS_PPL_HR_AREA` (ALWAYS for `BOSS_PEOPLE_HR`, DENY for the root group); P7's Settings grant
    to HR removed; menus, `linkPaths`, the import mount (`downloadBase`, `selfLink`) and owner route `peopleEmployeeImport`,
    PeopleAccess (HR's Employees group with the two, the reader's without; HR refused Settings again) and the PeopleLifecycle and
    acceptance paths follow.
  - **R8 (the user's call 2).** Mantle seeds `IdentityOperatorRequest` (PartyLifecycleData.xml, with the lifecycle services) and
    `request#Provisioning` and `request#AccessEnd` notify, when a step waits for an operator, the users holding
    `ADMIN_IDENTITY_MANAGE` through a group (not ADMIN's every permission), usable, whose organizations include the employer, never the
    requester or the person; title "An account to set up (or Access to end): person (employer)"; BossSetupData links it to
    LifecycleDetail. A failure is logged and never the request's. Spec: UserProvisioning (the operator told once, the HR officer not).
  - **R9 (the user's call 3).** A return task is assigned to the leaver's manager at that employment, from the assignment in effect the
    instant before the separation's date (else the line), falling back to the HR officer who asked; an offboarding step of the Manager
    role likewise (it was left unassigned). Specs: WorkProcess's last feature, PeopleScheduledChanges' last feature.
  - **R10 (the user's call 4).** A separation set for a later date is withdrawable (`withdraw#EmploymentChange`, `withdrawSeparation`):
    the employment's end goes back to `EmploymentChange.priorThruDate` (new, recorded when a separation is applied), the termination
    reason clears, the assignment, department membership, seat and line it ended continue, so do unit memberships ended on its date,
    each report's manager change it made (`causedByChangeId`, new; not withdrawable alone) is withdrawn and a line it ended goes on;
    `Lifecycle.js withdrawAccessEnd` makes its access end `UlopWithdrawn` (waiting steps skipped, memberships and relationships ended
    at the date continued, never a privileged group's) and `cancelChecklists` cancels its checklist and return tasks. Employee360's
    Withdraw shows for it. Spec: PeopleScheduledChanges' last feature.
- Findings, numbered by the lead F148 to F155 in order:
  - `instantiate#WorkProcess` reads its key without a lock: two first runs of one key at once could each make a tree; a key reused for
    another template answers the first template's root;
  - a custody change rolled back after its EECA leaves the return task completed (R4's own transaction); the manager assigned a
    return task cannot end the holding (`return#Equipment` is HR's): HR, Warehouse or the manager's own completion closes it;
  - a withdrawn separation leaves withdrawn the scheduled changes it withdrew when applied (made again if wanted), and a unit
    membership starting after its date, ended on its own start, stays so; its access end's undo writes memberships with authorization
    off (only rows ended exactly at the date, no privileged group);
  - operators are told only when one holds `ADMIN_IDENTITY_MANAGE` through a group and works for the employer; with none, the
    operation waits in LifecycleOperations' Needs attention as before;
  - an offboarding step of the Employee role with staff visibility is assigned to the leaver, who then does not reach it (R2's rule);
    ChecklistTemplates offers that combination;
  - `get#RecordLinkInfo`'s protected rule comes before the staff rule: an ADMIN user reaches a protected task through People's screens
    only;
  - the worker's other findings stand (no participant steps on an access end, the import takes ids and creates no account, the exit
    interview a link kind until P16, the guard's one or two reads per generic task write, the job's first run marking earlier changes);
    their "HR opens Settings", "nothing notifies the operators", "a return task is the HR officer's" and "a scheduled separation is not
    withdrawable" are the user's calls R7 to R10.
- Tests (release binary, `--nobuild`, this worktree's runtime), as built first for the guard's callers: Mantle CalendarChanges,
  CommonsToday, WorkPlanToCashBasicFlow, WorkProjectHub, SupportCases, PurchaseRequests, ProductionOrders, WorkGit, WorkGitReview,
  WorkProjectItems, WorkProjectServices, WorkMyTasks, CalendarServices, Dav and WorkProcess with their dependencies 197 of 197
  (25.8 s); BOSS Projects, WorkItems, WorkItemDetail, ProjectDetail, Tasks, TodayPanel, QuickCreate, Requests, Calendar,
  CustomerServiceCases, CustomerServiceAssignment, ManufacturingWorkOrders, ManufacturingShopFloor and Chatter with theirs 164 of 164
  (17.6 s). After the fixes: Mantle WorkProcess, UserProvisioning, PeopleChecklists, PeopleScheduledChanges, PeopleEmployment,
  PeoplePositions, PeopleOrganization, PeopleApprovals, PeopleScope, PeopleDirectory, HumanResServices, UserLifecycle, StaffIdentity,
  StaffInvitation, RecordVisibility, RecordLinks, Dav, CalendarServices, CommonsToday, WorkMyTasks, WorkProjectItems,
  WorkProjectServices, WorkProjectHub, WorkPlanToCashBasicFlow, SupportCases, PurchaseRequests, ProductionOrders, UniversalSearch and
  ContactBooks with their dependencies 302 of 302 (mr-mantle 50.6 s; WorkProcess 5 features 1.16 s, UserProvisioning 2 0.35 s,
  PeopleChecklists 3 1.74 s, PeopleScheduledChanges 5 1.73 s); BOSS PeopleAccess, PeopleLifecycle, PeopleEmployees, PeopleHire, PeopleOrganization,
  PeoplePositions, PeopleApprovals, Tasks, TodayPanel, Contacts, AdminImports, AdminLifecycle, AdminUsers, WorkItemDetail, WorkItems,
  Projects, ProjectsAccess, QuickCreate, CustomerServiceCases, ManufacturingWorkOrders, WarehouseFacilities, WarehouseInventory,
  Notifications and ProductsImport with their dependencies 233 of 233 (mr-boss 32.5 s; PeopleLifecycle 3 features 1.13 s,
  PeopleAccess's P7 feature 0.46 s). `moqui lint --screens` (release binary): 135 flagged
  sites as before, none in the People screens. Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, the acceptance
  suite (PeopleLifecycleUsable's two paths changed only; AGENTS.md asks a changed acceptance test to be run, the brief not to: for the
  lead).
- For the lead:
  - budget share: mr-mantle about 5.0 s (WorkProcess 1.2, UserProvisioning 0.35, PeopleChecklists 1.75, PeopleScheduledChanges 1.75;
    about 0.9 s over the Built note's, the separation withdrawal feature and the reach checks); mr-boss unchanged from the Built note (PeopleLifecycle 1.13 s, PeopleAccess's feature 0.46 s);
  - merge hot spots beside the Built note's: mr-mantle `Checklists.js` (owners, roleParties, completeReturnTasks, hiddenTaskIds,
    cancelChecklists, getChecklistTask), `Employment.js` (withdrawableKinds, withdrawSeparation, applyChange's priorThruDate, separate's
    causedByChangeId, changeRow), `Lifecycle.js` (delegation check, notifyOperators, withdrawAccessEnd, statusNames),
    `Positions.js holdersOf`, `CommunicationServices.xml` (the work effort visibility dispatch), `UniversalSearchServices.xml`,
    `TaskServices.xml` (`create#Task`, `get#MyTasks`, `get#FullCalendarData`), `WorkEffortServices.xml` (`get#UserTodayItems`),
    `HumanResourcesEntities.xml` (EmploymentChange's two fields), `PartyLifecycleData.xml`; mr-boss `BossSetupData.xml`
    (`BOSS_PPL_HR_AREA`, the topic's link), `People/Employees/` (ChecklistTemplates moved, EmployeeImport new), `People/Settings.xml`,
    `People/Employees.xml`, `commons/TaskServices.xml find#TaskRows`, `People.js`, `DataImport.js`, `PeopleSpecLib.js`,
    `PeopleAccess.spec.js`, design-people, design-admin §4.1, usl-inventory, design-crosscut;
  - the user's calls are in §4 (four rows), all built here (R7 to R10).

### P8 — Self-service, MyTeam and Home

Design §3 Home, MyTeam, SelfService, §1.2 (the Commons mount), §1.4 (Today, quick create, palette); PE-18. Ends
stage 1.

- **Mantle PeopleServices:** `get#SelfService` (own party and employments only; no supplied party), `find#MyRequests`,
  `get#Team` (current reports within granted scope) and `find#DueWork`; the cards of later phases (balances, clock,
  payslips, missing time) arrive with them.
- **`Shared/PeopleSelfService.xml`**, mounted at `People/SelfService` and `Commons/People/SelfService` (owner
  contract, F46). `BOSS_PEOPLE_SELF`'s grants: the two mounts, the parent context artifacts and the self routes,
  non-inheritable, as the settings index is granted to every BOSS user (BossSetupData.xml:2528-2535, F28); the staff
  launcher and the rest of the People tree stay refused.
- **Shell:** the Today source (decisions waiting on me) on the People root, and People's self source declared on
  Commons' root too (owner contract, the pattern of Commons.xml:70), since a self-service employee opens no People
  root and the shell gathers sources only from the roots a user may open (F64); it answers nothing without
  `PEOPLE_SELF_SERVICE`, and Home takes each service once. Commons Home has no card registry, so it gains one People
  card over `get#SelfService` (owner contract, design-drawers-commons §5), linking `Commons/People/SelfService`,
  which stays out of Commons' menu. The notification topic `PeopleTaskAssigned`.
- **Emergency contacts** (§4, the user's call from P2's F80): each contact is a Person party with its name and phone (a
  contact's own contact mechanisms), linked to the employee by a dated `PartyRelationship` of a new type Mantle seeds
  (an emergency contact, from the employee to the contact, its relationship such as spouse or parent in the row); added,
  changed and ended (never deleted) by the person in SelfService and by HR in Employee360's PersonalInfo through
  `store#PersonalInfo`'s scope, and private contact (design §1.1): never in the directory, the palette or a team reader's
  answer.
- **Screens:** SelfService (MySummary, MyRequests; Clock is P13's), MyTeam (Team, Decisions), Home complete for the
  phases built.
- **Specs:** BOSS `PeopleSelfService` (the self group opens SelfService under Commons and is refused
  `People/Employees`; a supplied `partyId` changes nothing; the one qvt render); Mantle `PeopleScope` gains the
  manager's team case.
- **Usable when** (`acceptance/People/PeopleSelfServiceUsable`): `people.employee`, with no People launcher, opens
  SelfService from Commons Home, sees their employment and requests, and opens their own Employee360;
  `people.manager` sees their reports and waiting decisions in MyTeam and no one else's.

**Built Nov 11 (P8).** mr-mantle 733251b6, mr-boss (branch `ppl/p8`).
- Checked first (the code over the plan): F28 (BossSetupData's settings-index grant, non-inheritable on the screen, its root's
  context and its services), F46 (Commons/People out of the menu, Employee360 its only screen), F64 (Commons Home has no card
  registry; `get#UserTodayItems` calls each `today-source` the shell gathers from the roots a user may open, and Home and the Today
  panel take each service once by name), P6's per-employment lines (`linesOf`, `reportLines`), P7's `hiddenTaskIds`, protected
  steps and the checklist roots with no owner, and P2's private-contact category. Also: every party reader that hides a personal
  contact does so by `Party.privateOwnerUserId` (the entity filters, `find#Party`, contact books, Commons' contacts and contact page,
  the palette, `search#Universal`, `get#RecordLinkInfo`, mail matching), a field with a foreign key to UserAccount; a checklist step's
  assignment (`create#WorkEffortParty`) is told on the generic `WorkItemAssigned`, whose title names the task and its root
  ("Offboarding: <person>", "Return … from <person>"), and `instantiate#WorkProcess` wrote the execution's policy after the
  assignments; the shell filters a key by whether its screen opens; a service-call's authorization under a non-inheritable screen
  grant is the service's own.
- Mantle:
  - `PeopleServices` over `Employees.js`, `Approvals.js`, `Checklists.js` and `People.js`: `get#SelfService` (`PEOPLE_SELF_SERVICE`,
    no party parameter: the caller's current and coming employments with employer, title, department, manager and work location,
    their emergency contacts, and the counts of their open requests and People tasks; `checkOnly` answers available false);
    `find#MyRequests` (the caller's own PeopleApproval requests: kind, what, dates, state, who decides the step waiting or that no
    one may yet, a refusal's reason; paged); `get#Team` (`PEOPLE_TEAM_VIEW`: the caller's live lines, one row per employment at an
    employer the line is at, the public work identity with department, work location and Working or On leave, no employment id;
    no manager or party parameter); `find#DueWork` (kinds `decision`: the requests whose step waiting the caller may decide now,
    read from the notices sent to them and checked against the route; `noManager` and `checklistTask`: an HR reader's employees with
    no manager and the open lifecycle tasks of the employers in scope; `myTask`: the caller's own open People tasks under P7's
    `hiddenTaskIds`; a protected task about the caller never shown, as HR either; paged; `KIND_INVALID`, `PERMISSION_DENIED`,
    `ORGANIZATION_DENIED`); `get#Home` adds `vacancies` (a position reader's, through `find#Positions`) and `decisions`, a count that
    fails logged and left out;
  - emergency contacts (the user's call on F80): `store#EmergencyContact` (the person or an HR editor of their employer, as
    `store#PersonalInfo`; add, change at the contact's revision, end, never delete; `NAME_REQUIRED`, `PHONE_REQUIRED`,
    `REVISION_CHANGED`, `CONTACT_LIMIT` at five), each contact a Person party with its `PhonePrimary` phone, linked by a dated
    `PrtEmergencyContact` relationship (the relation in `relationshipName`), the party held by a new account `_PEOPLE_PRIVATE_`
    (`privateOwnerUserId`; disabled, no password, no group) and owned by the employee, so no reader shows it to anyone; read with
    `get#Employee360`'s personal information (the person and HR), each with its own revision;
  - `PeopleTaskAssigned` (seeded in `PeopleLifecycleSetupData.xml` with `notify#PeopleTaskAssigned`; title "<who> assigned you a
    People task, due <day>"): `TaskServices.notify#TaskAssigned` hands a task whose root's process policy is People's to it, so
    `WorkItemAssigned` is never sent for People's work; `WorkProcesses.js instantiate` writes the execution's policy before pass two.
- BOSS:
  - `Shared/PeopleSelfService.xml`, mounted at `People/SelfService` and `Commons/People/SelfService` (owner contract, F46), out of
    both menus: MySummary (the counts, My employment), My People tasks (each a Commons task), My requests, Emergency contacts, and
    Open my employee record (primary; `get#SelfServiceContext`: People's Employee360 for a People user who reads them, else
    Commons'); `template/PeopleEmergencyContacts.xml` (its transition and section, also in Employee360's Personal information,
    changed wherever the personal information is: People's mount and Commons' own record);
  - `People/MyTeam` (menu 2, `g m`; Team over `get#Team`, Decisions over `find#DueWork` with All approvals), the managers' by
    `BOSS_PPL_TEAM` (DENY the root group, ALWAYS `BOSS_PEOPLE_MANAGER`); People.js's area `myTeam`;
  - Home: Hire employee primary for HR and My self-service for a self-service user, Vacant positions and Decisions waiting cards,
    DueWork over `find#DueWork` (paged, persons and tasks linked), and for a People user who reads no employer their decisions
    waiting and My team;
  - `BOSS_PPL_SELF` (F28): non-inheritable ALLOW for `BOSS_PEOPLE_SELF` on the shared screen (one location for both mounts), its
    contact transition, `get#SharedContext` and `get#SelfServiceContext`, and `get#SelfService`, `find#MyRequests`, `find#DueWork`
    and `store#EmergencyContact`; `get#SharedContext` answers such a user `{read: false, self: true}`, their employments and the
    SelfService link alone; the launcher and every other People screen stay refused;
  - Today (F64): `ironstone.people.ContextServices.get#TodayItems` (the decisions waiting, `PEOPLE_REQUEST_APPROVE`, each opening
    PositionDetail or the person's Employee360) on the People root and on Commons' root (owner contract); the root's
    `PeopleTaskAssigned` topic, its link (BossSetupData) Commons' TaskDetail;
  - Commons Home (owner contract, design-drawers-commons §5): one card, My employment, over `get#SelfService` with `checkOnly`,
    linking `Commons/People/SelfService`.
- Specs: Mantle `PeopleScope` gains the manager's team case (0.28 s: the lines' employments at their employers, a report employed by
  two at the line's alone, a supplied party and manager dropped, the reader refused; self-service the caller's own; no requests);
  `PeopleDirectory` gains the emergency contacts (0.45 s: the person adds, HR of A changes at its revision, a stale revision, a
  phone missing and the reader refused, the reader reads none, no party search or record link finds the party, ended and kept);
  `PeopleApprovals`' activation feature checks the decision waiting on the head alone and the requester's own request waiting for
  them (+0.1 s); `PeopleChecklists`' offboarding feature checks the assignee told on `PeopleTaskAssigned` and not `WorkItemAssigned`
  with a title naming no one, the leaver's due work and self-service count leaving out the protected task and HR's reading it
  (+0.1 s). BOSS `test/People/PeopleSelfService` (5 features, 0.43 s: a supplied partyId changing nothing, another person's contacts
  refused; SelfService's one qvt render under Commons as the employee; Commons Home's People card in html; My team's one qvt render
  as the manager, Leon and Kenji absent; Today's source for the manager and nothing for the employee); `PeopleAccess` gains one
  feature (0.42 s: the employee opens SelfService under People, the one html render, and is refused Employees, My team and
  Approvals; My team the manager's, the html render, the reader refused), its context feature the employee's own context and its
  menu feature the manager's menu (`managerMenu`; `adminMenu` gains My team). Acceptance, written and not run:
  `acceptance/People/PeopleSelfServiceUsable` (2 features); `PeopleFoundationWalk`'s manager Home check follows Home's new text.
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleScope, PeopleDirectory, PeopleApprovals,
  PeopleChecklists, PeopleEmployment, PeopleScheduledChanges, PeopleOrganization, PeoplePositions, WorkProcess, UserProvisioning,
  HumanResServices, WorkMyTasks, WorkProjectItems, WorkProjectServices, CommonsToday, CalendarServices, Dav, RecordLinks,
  RecordVisibility, UniversalSearch, ContactBooks, PartyServices, WorkProjectHub and SupportCases 206 of 206 (mr-mantle 39.0 s),
  PeopleChecklists 3 of 3 again after its last check; BOSS PeopleSelfService, PeopleAccess, PeopleEmployees, PeopleHire,
  PeopleLifecycle, PeopleApprovals, PeopleOrganization, PeoplePositions, CommonsSettings, TodayPanel, Tasks, QuickCreate,
  Notifications, Contacts, AdminCapabilities, AdminRegistries, AdminLifecycle, AdminUsers, AdminAccess, AdminGroups, ProjectsAccess,
  AppOrganizationFilters, InsightsRecords, InsightsAccess, Resources, Chatter, RecordFiles, WorkItemDetail and CommerceAccess 277 of
  277 (mr-boss 40.8 s), then PeopleSelfService, PeopleAccess, WorkItems and Projects 34 of 34; the client walk PeopleHireWalk 1 of 1
  (7.1 s). `moqui lint --screens`: 135 flagged sites as before, none in the screens P8 touched, no new TUI worklist entry. Prettier
  clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People rows (`get#SelfService`, `find#MyRequests`, `get#Team`, `find#DueWork`,
  `store#EmergencyContact`, `notify#PeopleTaskAssigned`; `get#Home`'s counts); ss-inventory's P8 note (no baseline form maps to
  SelfService, MyTeam or Home's due work; the emergency contacts are People's own record).
- Design edits: design-people (header; §1.2 the menu; §1.4 Today and the topic; §3 Home, MyTeam and SelfService as built; §4
  Employee360's emergency contacts); design-drawers-commons (header; §5 Home's People card and SelfService, owner contract).
- Findings, numbered by the lead F156 to F164 in order:
  - the emergency contact's party is hidden by a new system account, `_PEOPLE_PRIVATE_`, as its `privateOwnerUserId` (the field
    has a foreign key to UserAccount, and the employee may have no account); an ADMIN user sees the account in Admin's users, as
    `_EDGE_` and `_AGENT_ASSIST_`. A party-level private flag would need a Mantle entity change and every reader's condition;
  - before P8 a checklist step's or return task's assignee was told on `WorkItemAssigned` with "Offboarding: <person>" or "Return …
    from <person>" in the title, a lock-screen leak of a separation (P7 left it); P8's topic replaces it for People's work;
  - the decisions waiting are read from the notices sent to the user (up to 200, newest first), each checked against its route now: a
    request rerouted to the user without a notice is not listed until one is sent (P5's notify sends one on every reroute);
  - My team lists direct reports only (the expansion of the hierarchy within team scope, design §3, is later); Remind missing time
    waits on P10's timesheets;
  - My requests holds only the People approval requests the user asked for: a plain employee has none until leave (P12) and claims
    (P15); a change about them that HR asked is not theirs to see;
  - Today's People source answers decisions only, to `PEOPLE_REQUEST_APPROVE`; its self items (leave starting, a qualification
    expiring) come with P12 and P18, so "nothing without `PEOPLE_SELF_SERVICE`" holds trivially now; a decision's link opens People's
    screens, which a decider without the People root (a ParPerson approver who is only a self-service employee) cannot open, though
    the tray and Commons' Notifications decide it;
  - the self-service employee who opens `People/SelfService` gets People's frame with an empty menu (the launcher hides People);
    Commons' mount is the one linked;
  - the demo manager (`people.manager`, Hannah) has no self-service: the groups are not nested, so an employee who manages needs
    `BOSS_PEOPLE_SELF` too (a hire's default proposal gives it);
  - Home's Vacant positions reads `find#Positions` for a count, which builds every position row in reach up to its cap.
- For the lead:
  - budget share: mr-mantle about 0.95 s (PeopleScope's team feature 0.28, PeopleDirectory's contacts 0.45, PeopleApprovals' and
    PeopleChecklists' checks about 0.2); mr-boss about 0.85 s (PeopleSelfService 0.43, PeopleAccess's feature 0.42); the client walk
    unchanged (7.1 s);
  - merge hot spots: mr-mantle `Employees.js` (personalOf, the operations table, the appended functions), `People.js` (homeCounts,
    home's loop, dueWork, the exports), `Approvals.js` (the appended section, operations, exports), `Checklists.js`
    (lifecycleTasks, exports), `WorkProcesses.js` (instantiate's policy write), `TaskServices.xml` (`notify#TaskAssigned`),
    `PeopleServices.xml` (header, get#Home, get#Employee360, appended services), `PeopleLifecycleSetupData.xml` (appended); mr-boss
    `BossSetupData.xml` (appended), `People.js` (areas, linkPaths, sharedContext, the appended functions and operations),
    `ContextServices.xml` (appended), `screen/People.xml` (subscreens, keymap, providers), `People/Home.xml`, `Shared/Employee360.xml`,
    `Commons.xml`, `Commons/Home.xml`, `Commons/People.xml`, `PeopleSpecLib.js` (menus), `PeopleAccess.spec.js`, the inventories,
    design-people's header, §1.2, §1.4, §3, §4 and design-drawers-commons §5;
  - gate 1: the acceptance tests to run with the full suites are PeopleSelfServiceUsable (new) and PeopleFoundationWalk (its
    manager Home check changed; AGENTS.md asks a changed acceptance test to be run, the brief not to);
  - the user's call: whether an emergency contact's party may be held by the `_PEOPLE_PRIVATE_` account (built) or wants a
    party-level private flag.

**Review Nov 11 (P8).** A fresh review of `git diff master...ppl/p8` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §3 (Home, MyTeam, SelfService), §1.2, §1.4, design-drawers-commons §5 and F28, F46, F64, F80, with self scope, the self grant,
the team and decisions, protected tasks and the emergency contacts' privacy first; the user's call of Nov 11 (§4) recorded; fixes
committed apart per repository ("People P8 review: …"; mr-mantle 0dc6354c).
- Checked and found sound:
  - Self scope: `get#SelfService`, `find#MyRequests` and `find#DueWork` take no party or user (a supplied `partyId` is dropped:
    PeopleSelfService's first feature); `store#EmergencyContact` admits the person (`PEOPLE_SELF_SERVICE`, own party) or an HR editor
    of an employer of theirs through `personAccess`, a contact of another person refused as missing; `get#SelfServiceContext` and
    the self branch of `get#SharedContext` answer the user's own party and employments and links alone.
  - The self grant (`BOSS_PPL_SELF`, non-inheritable), probed as `people.employee` with authorization on: SelfService opens under
    People and Commons; People's Home and root, Employees, Employee360 (their own too), Settings, Staffing, Approvals, MyTeam and
    HireEmployee are refused by screen, through the web root and by transition (Employee360's `storeEmergencyContact` and
    `storePersonalInfo` under People refused before they run); the self-service transition with Ines's `partyId` is refused by the
    service and writes nothing; `get#Team`, `find#Employees`, `get#Employee360`, `get#Home`, `get#Scope`, `find#Positions`, People's
    `search#Records` and `get#TodayItems` called directly are refused by authorization; `find#DueWork` answers `myTask` only.
  - `get#Team` reads the caller's live lines (`scopeOf().reportLines`, `linesOf` now) and only the employments at the line's
    employers, no employment id, private contact or pay; `waitingFor` (the decisions) lists only requests pending now whose current
    step the caller is an approver of, by user and party, on a route that already leaves out the requester, the subject and the
    deciders of other steps (`resolve`), so every row is one `recordDecision` would accept.
  - Protected tasks: `myTasks` applies `hiddenTaskIds`; HR's `checklistTask` leaves out the reader's own protected work; the
    self-service count is `myTaskCount`. The PeopleTaskAssigned title names who assigned and the due day only (the email template's
    subject is the title, its body the message's three fields).
  - `notify#TaskAssigned` hands a task to People only when its root's process policy is `WppPeopleChecklist`; other work keeps
    `WorkItemAssigned` unchanged. `instantiate#WorkProcess` writing the policy before pass two changes nothing for a guarding policy:
    pass two writes by entity-auto services, which `check#ManagedWork` does not guard. WorkProjectItems, WorkProcess, WorkMyTasks
    (Mantle) and WorkItems, Projects, Tasks, CustomerServiceCases and CustomerServiceAssignment (BOSS) pass.
  - Emergency contacts' party, probed as HR, the manager, the reader, the People administrator, an ADMIN user and an Insights
    administrator: Commons' ContactDetail of the party and of the employee (relationships go through `visibleParty`), the Contacts
    list searched by the contact's name, Commons' Employee360, Chatter's `get#RecordInfo` and `get#RecordLinkInfo` show nothing of
    it; People's Employee360 shows it to HR of the employer and ADMIN only. `search#Universal` and `find#Party` filter
    `privateOwnerUserId` in the query.
  - The Commons root's Today source answers nothing without `PEOPLE_REQUEST_APPROVE` or for another user's Today; Commons Home's
    card asks `get#SelfService` with `checkOnly` and links `Commons/People/SelfService`, out of the menu.
- Fixes:
  - **R1 (high, install).** Mantle seeded the `_PEOPLE_PRIVATE_` account in `PeopleLifecycleSetupData.xml` (type seed). The Login
    screen and `UserServices.create#InitialAdminAccount` offer a fresh install its first administrator only while no account exists
    but `_NA_`, `_EDGE_` and the agents' chat users, so a production install with Mantle's seed could no longer create its first
    administrator. The account (the user's call: kept) is now made with the first emergency contact, in its own transaction
    (`Employees.js privateHolderId`; disabled, no password, no group), and is no longer seeded. Spec: PeopleDirectory's contacts
    feature checks the account disabled with no password and no group (the seeded test database cannot show the first-run case).
  - **R2 (medium, integrity and access).** `emergencyLinks` took any current `PrtEmergencyContact` relationship from the person,
    and Commons' `add#ContactRelationship` writes any relationship type (with `reverse`, from any party the user sees to their own
    personal contact; a contact administrator from an employee to any directory person). Such a row put a directory party or
    someone's personal contact in the person's emergency contacts, and `store#EmergencyContact` then let the person or HR rename that
    party and replace its primary phone with authorization off. Only a party held by `_PEOPLE_PRIVATE_` and owned by the person is
    now an emergency contact. Spec: PeopleDirectory's contacts feature (a row to a directory person is not listed and changing it
    is RECORD_UNAVAILABLE, the party unchanged); it fails on the code as built.
  - **R3 (the worker's finding, the lead's instruction).** The demo manager (`people.manager`, Hannah) is in `BOSS_PEOPLE_SELF`
    too (BossUsersDemoData; groups are not nested). PeopleAccess's capabilities table gives the manager `self`.
  - PeopleAccess's self-service feature now also checks the employee refused People's Home and their own Employee360 under People,
    Employee360's emergency-contact transition under People, and `get#Team`, `get#Employee360` and `get#Home` called directly.
- Findings, numbered by the lead F165 to F168 in order:
  - Commons' Add a relationship still offers the Emergency Contact type (it offers every `PartyRelationshipType`); a row made there is
    inert since R2 but visible as a relationship to whoever sees both parties. Leaving the type out of Commons' choice is an owner
    contract on ContactServices;
  - an offboarding step of the Employee role assigned to the leaver (P7's finding) also sends them a PeopleTaskAssigned notice
    (neutral title) for a task they cannot open: at the assignment, inside `instantiate#WorkProcess`, the step's protection and the
    execution's `EmploymentChecklist` are not yet written, so `hiddenTaskIds` cannot tell;
  - an ADMIN user reads emergency contacts in People's Employee360 (ADMIN holds every People permission) and in Mantle's ledger
    party lookups (`EntityLib` shows personal contacts to a system administrator), as every personal contact;
  - two first emergency contacts at once on a fresh install: the second's account create fails in its own transaction and is read
    again, so neither fails unless the account cannot be made at all.
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleScope, PeopleDirectory, PeopleApprovals,
  PeopleChecklists, PeopleEmployment, PeopleScheduledChanges, WorkProcess, WorkProjectItems, WorkMyTasks, RecordLinks,
  RecordVisibility, ContactBooks, PartyServices, UniversalSearch, HumanResServices, UserProvisioning, UserLifecycle and CommonsToday
  147 of 147 (48.5 s; mr-mantle 24.8 s of features; PeopleDirectory's contacts feature 0.50 s); BOSS PeopleAccess, PeopleSelfService,
  PeopleEmployees, PeopleLifecycle, PeopleHire, PeopleApprovals, PeopleOrganization, PeoplePositions, WorkItems, Projects,
  CustomerServiceAssignment, CustomerServiceCases, Contacts, AdminUsers, AdminGroups, AdminCapabilities, AdminLifecycle, TodayPanel,
  Tasks, CommonsSettings, Notifications, InsightsRecords and Chatter with their dependencies 204 of 204 (50.5 s; mr-boss 27.7 s of
  features; PeopleAccess's P8 feature 0.54 s). The R2 check fails on the code as built. Prettier clean on the changed JavaScript. No
  screen changed: `moqui lint --screens` not run. Not run: `./moq test-apps`, the acceptance suite (the user's call).
- For the lead:
  - budget share: mr-mantle about +0.05 s over the Built note (PeopleDirectory's contacts feature); mr-boss about +0.15 s
    (PeopleAccess's P8 feature 0.54 s);
  - merge hot spots beside the Built note's: mr-mantle `Employees.js` (emergencyLinks, privateHolderId), `PeopleLifecycleSetupData.xml`
    (the account no longer seeded), `PeopleDirectory.spec.js`; mr-boss `BossUsersDemoData.xml` (the manager's membership),
    `PeopleAccess.spec.js`, design-people §4;
  - the user's call is in §4: the emergency contacts stay hidden through the disabled system account `_PEOPLE_PRIVATE_` as
    `privateOwnerUserId`, not a party-level flag (made with the first contact since R1);
  - gate 1's acceptance tests are the Built note's (PeopleSelfServiceUsable, PeopleFoundationWalk); the demo manager's new
    self-service membership leaves their checks as written.

### P9 — Working schedules, holidays and capacity

Design §6 (schedules), WorkingSchedules, WorkingScheduleDetail, §7 HolidayCalendars; PE-06.

- **Mantle `WorkingSchedule`**, its lines and dated assignments, and `mantle.humanres.ScheduleServices`:
  `find#Schedules`, `store#Schedule`, `store#ScheduleLine`, `assign#Schedule`, `get#Holidays` and `store#Holiday`
  (WepHoliday events through the Commons event services; no employer assigned a seeded category by default).
- **Capacity** (owner contract with Projects): `ResourceServices.get#PartyCapacity` and
  `TimesheetServices.get#WeekDays` read the People schedule first and keep the WetAvailable and policy fallback for
  a person with none (F23); cross-midnight and DST shifts by actual instants, days by the schedule's zone.
- **Screens:** WorkingSchedules, WorkingScheduleDetail (Week, Assignments, CapacityPreview), HolidayCalendars.
- **Specs:** Mantle `test/humanres/PeopleSchedules` (overlapping intervals refused; a person with a schedule gets
  its hours and one without today's; a holiday of the schedule's category takes the day; a DST week's hours);
  Mantle's Work capacity specs unchanged.
- **Usable when** (`acceptance/People/PeopleSchedulesUsable`): `people.hr` defines a four-day week in another zone,
  assigns it from a date, adds a holiday, and CapacityPreview and Projects' PersonDetail show the same hours.

**Built Nov 11 (P9).** mr-mantle effe0fa8, mr-boss (branch `ppl/p9`).
- Checked first (the code over the plan): F23 (ResourceServices' header names People's schedule as the replacement of the
  WetAvailable source and nothing else); `TimesheetServices.get#WeekDays` with a person already reads `get#PartyCapacity`, so one
  change serves both; F31 (HolidayUsaData is install data, its categories `WcatHoliday` WorkEffortCategories linked by
  `WorkEffortCategoryAppl`; only `get#NextBusinessDay` reads categories, while capacity, BusinessTime and Projects' planner read the
  employer-owned `WepHoliday` convention for everyone of the organization); P6's finding that the assignment has no schedule field
  (added here); P6's `termFields` (every change copies the terms in effect to the next assignment, so the schedule must be a term or a
  transfer would drop it) and `checkDate` (no change on or before a later assignment's start); `create#Event` defaults the owner to
  the user and takes no category; `ec.l10n.parseTimestamp` and `format` take an IANA zone and `getAvailableTimeZones` lists them; and
  the framework's authorization: an inherited ALWAYS is not overridden by a more specific DENY of another group the user is in, so an
  area's own grant must be non-inheritable to keep a child screen from it.
- Mantle:
  - `entity/PeopleScheduleEntities.xml`: `mantle.humanres.schedule.WorkingSchedule` (an employer's dated week: name, IANA zone,
    holiday calendar, from and through, `copiedFromScheduleId`; name, zone, calendar and end audit-logged) and `WorkingScheduleLine`
    (dated weekly intervals: ISO day, local start and end, an end at or before the start ending the next day, unpaid break);
    `EmploymentAssignment` and `EmploymentChange` gain `workingScheduleId` and `holidayCategoryId` (audit-logged on the assignment),
    and the change kind `EckSchedule` (Working schedule);
  - `mantle.humanres.ScheduleServices` over a new module `Schedules.js`: `find#Schedules` (a staff reader's employers' schedules and
    those a manager's live reports follow; weekly hours, calendar, dates, state, HR's count of followers; paged), `get#Schedule`
    (every dated line, who follows it now or later: all for HR of the employer, a manager their reports), `store#Schedule` (new, copy,
    change at the schedule's revision, end; `ORGANIZATION_REQUIRED`, `ORGANIZATION_DENIED`, `NAME_REQUIRED`, `ZONE_INVALID`,
    `CALENDAR_UNAVAILABLE`, `OWNER_CHANGE`, `ZONE_IN_USE` once anyone followed it, `DATE_PAST`, `SCHEDULE_ASSIGNED`,
    `REVISION_CHANGED`), `store#ScheduleLine` (added, changed or ended from a date; before the line's start in place, after it ended
    and restarted; `DAY_INVALID`, `TIME_INVALID`, `BREAK_INVALID`, `OVERLAP` across midnight and the week's end, `DATE_OUTSIDE`,
    `LINE_ENDED`), `get#Holidays`, `store#HolidayCalendar` (an employer's, or shared with `PEOPLE_ALL_ORGANIZATIONS`),
    `store#Holiday` (a no-owner all-day `WepHoliday` in the calendar; `DAY_TAKEN`, `HOLIDAY_PAST`, `DATE_REQUIRED`) and
    `get#CapacityPreview` (a person HR reads or a manager's report, up to 62 days, over `get#PartyCapacity` with each day's schedule);
  - `assign#Schedule` is Employment.js's `assignSchedule`: an HR editor of the employer; the schedule the employer's and in effect
    (`SCHEDULE_OUTSIDE`, `SCHEDULE_NOT_IN_EFFECT`), the calendar the employer's or shared, an empty schedule ending the following;
    a change of its own applied at once (`EckSchedule`, operation key, withdrawable while to come) that starts the next assignment
    with the other terms and state as they were (an employment with no assignment gets its first); `NOTHING_CHANGES`,
    `SCHEDULE_REQUIRED`, `ASSIGNMENT_SCHEDULED`, `DATE_OUTSIDE`, `REVISION_CHANGED` when a revision is given. `termFields` carries the
    schedule and calendar, so a transfer, manager change, leave or reorganization keeps them; `termTexts` and the assignment history
    name the schedule; `get#Team` rows carry the schedule a report follows now (MyTeam's column; P8's note left it for P9);
  - capacity (owner contract with Projects, F23): `get#PartyCapacity` reads `Schedules.js scheduledDays` once for all its parties:
    each day planned by the schedule in effect at noon of that day in its zone; an interval's hours are its actual instants less
    the break, counted on the day it starts (a night shift across a daylight saving change has its true length); two employments'
    overlapping intervals count once; the planned days replace the WetAvailable and policy hours (`source` `schedule`, each day's
    `workingScheduleId`), the policy organization's holidays still apply and the schedule's calendar (the assignment's, else the
    schedule's) adds its own. People with no schedule are not touched (the WetAvailable read is skipped only when every day is
    planned); a failure is logged and the person keeps today's capacity. `get#WeekDays` is unchanged but its description.
- BOSS:
  - `screen/People/Time.xml` (Time & leave, menu 7, `g w`), `Time/WorkingSchedules` (list, New schedule the primary, Copy),
    `Time/WorkingScheduleDetail` (record header; Assign the primary; More: Edit schedule, End schedule; Week with Add working hours,
    Change and End; Assignments with End for employee; Capacity preview over `get#CapacityPreview`) and `Time/HolidayCalendars`
    (Holidays, menu 9: calendars, the holidays of a year, New calendar the primary, Add holiday, Rename, Change, Remove), HR's own
    editor under Time rather than Settings (the user's call of Nov 11 on HR's editors, recorded as a design edit);
  - `BOSS_PPL_TIME` (Time.xml non-inheritable, WorkingSchedules and WorkingScheduleDetail inheritable: ALWAYS `BOSS_PEOPLE_HR` and
    `BOSS_PEOPLE_MANAGER`, DENY `BOSS_PEOPLE`) and `BOSS_PPL_HOLIDAYS` (HolidayCalendars: ALWAYS HR, DENY `BOSS_PEOPLE`);
    `ironstone.people` People.js: area `schedules` (Time), link paths for the three screens, choices `workingSchedules`,
    `holidayCalendars`, `timeZones` and `employments`; MyTeam's Working schedule column;
  - Projects' PersonDetail (owner contract, design-projects §15): the overview's source text "Their working schedule (People)";
  - demo (`BossPeopleDemoData.xml`, appended): Retail's Store week (America/Chicago, Monday to Thursday 8 h, Saturday 4 h) with
    Retail's holiday calendar (two 2027 holidays), followed by nobody, so every demo person keeps the capacity Projects' and
    Manufacturing's demo and specs read; no seeded calendar is assigned (F31).
- Specs: Mantle `test/humanres/PeopleSchedules` (4 features, stepwise, 2.7 s: overlapping intervals refused on a day and across
  midnight, a break too long, a bad time, a stale revision, a reader, another employer's HR; a person following the four-day Berlin week
  from a date gets its hours from then and the policy's before, one following none today's, a holiday of the schedule's calendar takes
  the day and another calendar's not, the assignment's calendar replacing the schedule's, the operation-key retry, `NOTHING_CHANGES`,
  `ASSIGNMENT_SCHEDULED`, `ZONE_IN_USE`, `SCHEDULE_ASSIGNED`, a manager reading the schedule their report follows and not another;
  a line changed from a date keeps the weeks before it and a leave carries the schedule; a New York night shift 7 h across the spring
  change and 9 h across the fall change, and `get#WeekDays`' week of 7 h). BOSS `test/People/PeopleSchedules` (4 features, 0.6 s:
  WorkingScheduleDetail's one html render as HR with a follower and their preview, HolidayCalendars' one html render, the four choices
  with a selected value off the page and the reader given no employments, Projects' `get#PersonOverview` source text); `PeopleAccess`
  gains one feature (0.34 s: Retail's schedule changed by Retail's HR, the reader refused with the same parameters, Services'
  schedule refused to Retail's HR, WorkingSchedules' one html render as HR, the reader refused the screen, the manager refused
  Holidays), its menu feature the HR, manager, reader and administrator menus and the Time group (`hrMenu`, `hrTimeMenu`,
  `managerTimeMenu`; `adminMenu` and `managerMenu` gain Time, `keys` `g w`) and its capability table `schedules`. Acceptance, written
  and not run: `acceptance/People/PeopleSchedulesUsable` (2 features: people.hr's Berlin four-day week, calendar, holiday and
  assignment through the screens' transitions; the preview and Projects' PersonDetail giving Rafael 40 h and 30 h for the same weeks
  from the schedule); `PeopleFoundationWalk` reads `ids.adminMenu`, which now has Time, unchanged as a file.
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleSchedules, PeopleEmployment, PeopleScheduledChanges,
  PeopleOrganization, PeopleScope, PeopleDirectory, PeopleChecklists, PeopleApprovals, PeoplePositions, WorkResources, WorkTimesheets,
  BusinessTime, WorkTimeEntries, WorkProjectReports, ProductionShopFloor, HumanResServices and WorkProcess 102 of 102 (mr-mantle
  34.5 s of features; PeopleSchedules 2.8 s: 1.26, 1.12, 0.23, 0.15), then PeopleScope and PeopleDirectory 10 of 10 after My team's
  schedule; BOSS PeopleSchedules, PeopleAccess, PeopleEmployees, PeopleHire, PeopleLifecycle, PeopleOrganization, PeoplePositions,
  PeopleApprovals, PeopleSelfService, Resources, TimeEntries, Reports, Projects, ProjectsAccess, ProjectsHome, ManufacturingSchedule,
  ManufacturingWorkCenters, ManufacturingAccess, Schedules, AppOrganizationFilters, InsightsRecords, AdminCapabilities, TodayPanel,
  QuickCreate, Notifications and CommonsSettings with their dependencies 175 of 175 (mr-boss 34.6 s), then PeopleSelfService and
  PeopleAccess 20 of 20; the client walk PeopleHireWalk 1 of 1 (7.0 s). The three new screens rendered once more by hand in qvt and
  tui as HR without errors (not kept in the suite). `moqui lint --screens`: 135 flagged sites as before, none in the screens P9
  touched, no TUI worklist entry. Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's `get#PartyCapacity` row and the People Added table's ScheduleServices rows; ss-inventory's P9 note (no
  baseline form maps to the three screens).
- Design edits: design-people (header; §1.2 Time & leave; §2 HolidayCalendars' path; §3 MyTeam's schedule; §6, WorkingSchedules,
  WorkingScheduleDetail and HolidayCalendars as built); design-projects (header; §15 PersonDetail's capacity, owner contract).
- Findings, numbered by the lead F169 to F175 in order:
  - a holiday is written by `store#Holiday` directly, with no owner, not through Commons' `create#Event` (which makes the HR user its
    owner and takes no category): with an owner of the employer, the old convention would make a regional calendar every employee's.
    The employer-owned `WepHoliday` convention still applies to everyone of the policy organization, scheduled or not; the design's
    "applicable organization" of a holiday is its calendar's employer;
  - a schedule assignment is a change applied to the employment, so by P6's rule it supersedes a transfer or separation of that
    employment waiting for approval (the waiting change carries the old schedule in its terms, so applying it later would undo the
    assignment); assigning schedules to many people would supersede their pending transfers;
  - a schedule cannot be assigned on the start of the assignment in effect nor before a change set for a later date
    (`ASSIGNMENT_SCHEDULED`, P6's `checkDate`): it is set from a later day, or after withdrawing the scheduled change;
  - dates are entered in the HR user's zone, and a schedule's day is planned when the assignment is in effect at noon of that day in
    the schedule's zone: for a zone more than twelve hours ahead of the HR user's (Tokyo from Chicago), the first day of an assignment
    from midnight is not planned;
  - holidays of a recurring series (`recurStartCron`, HolidayUsaData's Columbus Day) are not read, as `get#NextBusinessDay` and
    capacity never read them;
  - a schedule is an employer's (no shared schedule, unlike pay grades and calendars); its zone is fixed once followed (a copy is the
    way to another zone);
  - the preview of a change's impact on leave and shifts (design WorkingScheduleDetail) waits for P11, P12 and P14; Employee360 and
    HireEmployee do not show or take the schedule yet (the assignment history carries its name).
- For the lead:
  - budget share: mr-mantle about 2.7 s (PeopleSchedules); mr-boss about 0.95 s (PeopleSchedules 0.6, PeopleAccess's feature 0.34);
    the client walk unchanged;
  - merge hot spots with P10 (the second to merge rebases): mr-mantle `service/mantle/work/ResourceServices.xml` (`get#PartyCapacity`:
    the header comment, the description, `entryOf` and the loop before it), `service/mantle/work/TimesheetServices.xml` (`get#WeekDays`'
    description only), `entity/HumanResourcesEntities.xml` (EmploymentAssignment and EmploymentChange fields, the `EckSchedule` enum),
    `Employment.js` (`termFields`, `kindTexts`, `withdrawableKinds`, `termTexts`, `applyChange`'s `EckSchedule` branch, the appended
    `assignSchedule`, operations), `Employees.js` (`team`), `PeopleServices.xml` (`get#Team`'s description); no Mantle setup data
    changed; mr-boss `screen/People/Time.xml` (new here: P10 mounts its time screens under `People/Time` too and must open the area to
    its users, Time.xml's own grant being non-inheritable and denied to `BOSS_PEOPLE`; menu indexes 2 and 9 taken),
    `data/BossSetupData.xml` (appended `BOSS_PPL_TIME`, `BOSS_PPL_HOLIDAYS`), `data/BossPeopleDemoData.xml` (appended),
    `service/ironstone/people/People.js` (`areas`, `linkPaths`, the choice sources' comment and four appended sources),
    `screen/People.xml` (the keymap and comment), `screen/People/MyTeam.xml`, `service/ironstone/projects/ResourceServices.xml`
    (`get#PersonOverview`'s source text), `test/People/PeopleSpecLib.js` (menus, keys, ids), `test/People/PeopleAccess.spec.js`
    (header, menu and capability features, the appended feature), the inventories, design-people's header, §1.2, §2, §3, §6, §7 and
    design-projects' header and §15;
  - the user's call: HolidayCalendars is built under Time & leave (HR's), not Settings as designed, following the call of Nov 11 that
    put HR's editors out of the People administrator's Settings.

**Review Nov 11 (P9).** A fresh review of `git diff master...ppl/p9` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §6 (WorkingSchedules, WorkingScheduleDetail), §7 HolidayCalendars and F23, F31, with capacity, holidays and their scope, and
the schedule as an employment change first; the lead's call on HolidayCalendars recorded in §4; fixes committed apart per repository
("People P9 review: …"; mr-mantle a65a0d3c).
- Checked and found sound:
  - Capacity (F23): `get#PartyCapacity` reads `Schedules.js scheduledDays` once for its parties; a person with no schedule takes the
    same path as before (the WetAvailable read and the policy, `source` unchanged; the day rows only gain `workingScheduleId: null`),
    and a failure of the schedule read is logged and leaves today's capacity. Projects' and Manufacturing's specs pass unchanged.
  - Cross-midnight and DST: an interval's hours are the instants between its local start and end in the schedule's zone (the end on
    the next day when at or before the start) less the break, counted on the day it starts; a day is planned by the schedule and
    assignment in effect at its noon in the schedule's zone; two employments' overlapping intervals count once.
  - Holidays: a calendar's holiday has no owner, and every other holiday reader (BusinessTime, ProductionCalendar, Projects'
    planner, `get#WeekDays`' policy days, `get#NextBusinessDay`, Manufacturing's work centers) asks for an owner or a category, so it
    counts only on the days of a person whose assignment or schedule names its calendar; `checkCalendar` lets a schedule or an
    assignment name only its employer's calendar or a shared one, so another employer's never applies. Calendars are read (`get#Holidays`,
    the `holidayCalendars` choice) only as shared or of the reader's employers, and changed only by an HR editor of the owner (a
    shared one with `PEOPLE_ALL_ORGANIZATIONS`); a holiday is changed through its calendar's owner alone.
  - Schedules are an employer's: changed and assigned only by its HR editors (`canEditAt`), assigned only to its employments
    (`SCHEDULE_OUTSIDE`), the owner never changed (`OWNER_CHANGE`); a manager reads only the schedules their live reports follow and
    of the followers only their reports. Overlapping lines are refused on a day, across midnight and the week's end, among lines in
    effect together; the zone is refused once anyone has followed the schedule (`ZONE_IN_USE`); every write names the revision.
  - The access grants: Time.xml's own grant non-inheritable, Holidays HR's alone, the root group denied; PeopleAccess's feature
    checks the holder, the reader and another employer's schedule.
- Fixes:
  - **R1 (high, integrity; the worker's finding 2, the lead's instruction).** A schedule assignment was an employment change applied
    at once, so P6's rule superseded the employment's transfer or separation waiting for approval (and its request, bound to the
    employment's revision, went stale): assigning schedules to many people would wipe their pending transfers, and a waiting
    transfer carried the old schedule in its terms. Now `assign#Schedule` (and the withdrawal of a scheduled `EckSchedule`) leaves
    the waiting changes as they are: `Approvals.js keepWaiting` binds each request that was current to the employment's new
    revision and sends its step again (the earlier notice, naming the old revision, read); the waiting change carries the schedule
    in effect on its date; and `applyChange` gives a transfer or manager change the schedule in effect on its date, never the one it
    was asked with (the schedule is assign#Schedule's alone). A schedule from the waiting change's date or later is refused
    (`CHANGE_WAITING`), since the change, once approved, could not apply before a later assignment. Spec: PeopleSchedules' fifth
    feature (a transfer waiting, a schedule assigned before its date, the transfer still waiting with its approval and one fresh
    notice, approved through it and applied with the schedule; `CHANGE_WAITING` from its date); fails on the code as built.
  - **R2 (medium; the worker's finding 3).** A date-boundary bug: `checkDate` counts an assignment starting on the change's date
    as a later one, so a schedule could not be assigned from the day the assignment in effect starts (a hire's first day, or the
    date of the person's first schedule). A schedule from that day now changes that assignment's schedule and calendar in place
    (audited with the reason; the `EckSchedule` change names it), unless it is a change set for a later date HR may still withdraw
    (then `ASSIGNMENT_SCHEDULED` stands: withdraw it first). An empty date is the start of today, or of the employment or the
    assignment in effect when it began later today, as the screen's "Today when empty" says (it was the current instant). Spec:
    the fifth feature (an assignment from a past date given a calendar from the same date: one row, changed in place).
  - **R3 (medium, history).** `store#ScheduleLine` took any date, so a line added, changed in place or ended from a past date
    rewrote weeks people had been planned by, and `store#Holiday` added a holiday on a past day while refusing to change one
    (design: no historical recomputation; a retrospective edit is reported and corrected). A schedule anyone has followed now changes
    from today on (`DATE_PAST`, on the date the hours actually change in each branch), and a holiday is added for today or later
    (`HOLIDAY_PAST`). Spec: the fifth feature; fails on the code as built.
  - **R4 (low, scope).** `get#CapacityPreview` named every schedule planning the person's days, so an HR officer of one employer
    previewing a person employed by two read the other employer's schedule name. The preview names only the schedules the caller
    reads (the hours still count, as in Projects). Spec: the fifth feature.
  - ScheduleServices' descriptions and design-people §6 and §7's As built say so.
- Findings, numbered by the lead F176 to F179 in order:
  - changing a followed schedule's holiday calendar (`store#Schedule` `holidayCategoryId`) applies to its past days too (the change
    is audited, not dated); a dated calendar is the assignment's override, from a date;
  - a person on a leave of absence (an `EasLeave` assignment, which carries the schedule) is planned the schedule's hours, as
    capacity planned the policy's hours before P9; leave enters capacity with P12;
  - a schedule set in place on a hire's first day that is still to come is not withdrawn by withdraw#EmploymentChange (its change
    has no assignment of its own: `CHANGE_IN_EFFECT`); another assignment from that day changes it again;
  - the withdrawal of a scheduled `EckSchedule` beside a waiting transfer (R1's second path) is not in a spec;
  - the worker's findings 1 and 4 to 7 stand as written (holidays written without Commons' event services, with no owner, as the
    review checked above; the noon rule across zones; recurring holidays; no shared schedule; leave, shifts, Employee360 and
    HireEmployee later).
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle PeopleSchedules, PeopleEmployment, PeopleScheduledChanges,
  PeopleApprovals, PeopleChecklists, PeopleOrganization, PeoplePositions, WorkResources, WorkTimesheets, BusinessTime and
  HumanResServices 63 of 63 (47.2 s; mr-mantle 23.4 s of features; PeopleSchedules 3.3 s: 1.16, 1.12, 0.22, 0.15 and the fifth
  feature 0.61); BOSS PeopleSchedules, PeopleAccess, PeopleLifecycle, PeopleHire, Resources and ProjectsAccess 38 of 38 (34.4 s;
  mr-boss 13.8 s of features). The fifth feature's checks were run on the code as built: every one fails there. Prettier clean on
  the changed JavaScript. No screen changed: `moqui lint --screens` not run. Not run: `./moq test-apps`, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about +0.6 s over the Built note (PeopleSchedules' fifth feature); mr-boss unchanged;
  - merge hot spots beside the Built note's (P10 rebases): mr-mantle `Employment.js` (`applyChange`, `withdrawEmploymentChange`,
    `assignSchedule` and its helpers), `Approvals.js` (`keepWaiting` and the exports), `Schedules.js`, `ScheduleServices.xml`,
    `PeopleSchedules.spec.js`; mr-boss design-people §6 and §7, §4 here;
  - the lead's call is in §4: HolidayCalendars stays under Time & leave as HR's own screen, not Settings;
  - nothing waits on the user's decision.

### P10 — Time mounts, rates and labor costing

Design §13 MyTime, Timesheets, TimesheetDetail, TimeEntries and Rates, §6 (pay rates on time), MyTeam's "Remind
missing time"; PE-18, PE-23.

- **The mounts** (owner contract, crosscut §3.31; F17): Projects' four time screens at `People/Time/*` and
  Billing/Rates at `People/Payroll/Rates`, with People's filters: no rate column without `PAYROLL_VIEW`, client
  rates hidden without Projects' billing grants. What the screens and `ironstone.projects.TimeServices` assume of
  Projects changes with them (F57), Projects' specs passing unchanged:
  - the links the services build (`/qapps/Projects/...`) from the mount's root, and the screens' `Projects/Time`
    paths (MyTime's tui container, TimeEntries' import, EditEntry's responses, the print URLs) relative;
  - the checks of the group name `BOSS_PROJECT_MANAGER` as the permissions Mantle reads (`TIME_ENTRY_RATE` for
    money, `TIMESHEET_APPROVE` for everyone's time), as §2 asks;
  - the person pickers and the missing-time list take a manager's live reports (`PrtManager`) beside the time keepers
    of the projects the user manages;
  - Rates' pay rows for a holder of `PAYROLL_VIEW` without `TIME_ENTRY_RATE` (`check#Money` admits neither today),
    and its read-only `RaprCost` rows beside RaprClient and RaprVendor;
  - a line manager approves a week only under the organization's `line` policy (the PartySetting
    `ProjTimesheetPolicy`; the default is `project`): People's demo sets `line` on its employers, after checking that
    Projects' demo and specs do not read theirs. A deployment chooses its policy in Projects' settings, as today.
- **PE-23:** RatePurpose `RaprCost` seeded, the one labor costing purpose (§4);
  `RateServices.get#CostingRate` (the most specific dated rate by position class and work type; never a person's
  rate; none answers unpriced), Rates' read-only Labor costing rows, and Accounting's LaborCostingRates form on
  CostingPolicies, which Manufacturing deferred (F34; owner contract). Manufacturing values production labor from a
  purpose of its own, `RaprProductionCost` (F34), and this phase changes its built code and data to the one purpose
  (owner contract, §4): the `RaprProductionCost` rows (the seed in mr-mantle data/ProductionShopFloorData.xml, the
  demo's rates in mr-boss data/BossManufacturingDemoData.xml, and rows a deployment holds, by a data update) become
  `RaprCost`, the `RaprProductionCost` value is removed, and the lookup in mr-mantle
  service/mantle/work/ProductionShopFloor.js calls `get#CostingRate`, so the form's rates are the ones every app
  reads. `get#CostingRate` takes that lookup's rules unchanged and its `laborFits` re-check by rate id stays (F61).
  Manufacturing's specs are kept passing, changed only where they name the purpose (mr-mantle
  test/work/ProductionShopFloor.spec.js alone). Maintenance reads
  `get#CostingRate` only (its P11); the switch of Projects' cost reports is its owner's (§7).
- **Screens:** the five mounts; MyTeam's and Timesheets' missing-time reminder over `send#MissingTimeReminders`;
  SelfService's and Home's missing-week cards; the Today source "my week not submitted".
- **Specs:** BOSS `PeopleTime` (a time approver without Projects opens Timesheets under People; Rates lists pay
  rates for `people.payroll` and none for `people.hr`); Mantle `test/humanres/LaborCostingRate` (the most specific
  rate; no rate is unpriced, never a pay rate; a production labor event priced from a `RaprCost` row).
- **Usable when** (`acceptance/People/PeopleTimeUsable`; design §14.3 "Pay rates and phones", its rates half): an
  employee submits a week from People; their manager approves it there; `people.payroll` sets a pay rate that a
  Projects manager with `TIME_ENTRY_RATE` cannot see; a finance administrator sets a costing rate that People shows
  read only.

**Built Nov 11 (P10).** mr-mantle 00765bfd, mr-boss (branch `ppl/p10`).
- Checked first (the code over the plan): F57's list as found (the ten `BOSS_PROJECT_MANAGER` checks of
  `ironstone.projects.TimeServices`, its links to `/qapps/Projects/...`, MyTime.qvue finding its path by `lastIndexOf`, the
  `Projects/Time` paths of MyTime's terminal container, TimeEntries' import, EditEntry's three returns and the two prints, Rates'
  `check#Money`); F61's lookup (rows with no party or work effort, work type and class matching or empty, most specific, then
  newest; `laborFits` by rate id); `get#PayRateAccess` (no organization scope); `find#Timesheets`' missing list (the time keepers of
  the managed projects only); how the shell calls a `today-source` (under the root that declares it, so its grant decides);
  P9's worktree untouched so far. The `line` policy: Projects' demo keeps time at Services (Joe and Bob Developer, Ana Designer),
  Joe has a line manager (Bob, BossDemoData), and TimeEntries and WorkTimesheets read john.doe as the approver of Joe's week, so
  `line` on Services would change Projects; Retail holds only People's employees and Manufacturing's demo, whose operators have
  no line manager (the policy falls back to the project rule; ManufacturingShopFloor passes). `line` is set on Retail alone.
- Mantle:
  - RatePurpose `RaprCost` seeded with RateAmount (HumanResourcesEntities); `RateServices` over a new module `CostingRates.js`:
    `get#CostingRate` (Manufacturing's lookup rules unchanged; a class or a person's class at a date; priced false when no row
    applies; reads no pay, checks no permission), `find#CostingRates` (`ACCOUNTING_ADMIN`, `ACCOUNTING_VIEW`, `PAYROLL_VIEW` or
    `TIME_ENTRY_RATE`), `store#CostingRate` and `end#CostingRate` (`ACCOUNTING_ADMIN`; a change ends the row of the same scope
    in effect and starts the next from now or later; `RATE_INVALID`, `RATE_COMING`, `REVISION_CHANGED`, `RATE_ENDED`,
    `RECORD_UNAVAILABLE`), and `migrate#ProductionCostRates` (the data update: `RaprProductionCost` rows moved to `RaprCost`, each
    in its own transaction, then the value removed; called from ProductionShopFloorData in place of the old value's seed);
    `create#` and `update#RateAmount` refuse a `RaprCost` row without `ACCOUNTING_ADMIN`;
  - ProductionShopFloor.js's `costingRate` calls `get#CostingRate` (`laborFits` stays); ProductionServices' description and the
    one spec line name `RaprCost`;
  - TimesheetServices: `get#LineReports` (the user's live reports by `PrtManager`, persons only), added to `find#Timesheets`'
    missing list beside the managed projects' time keepers; `find#WeeksToSubmit` (the user's own weeks to submit, the rule of
    Projects' Today, which `ProjectServices.get#ProjectTodayItems` now calls, unchanged);
  - `PeopleServices.get#SelfService` answers `weeksToSubmit` (a probe; a failure logged and the card left out).
- BOSS:
  - `screen/People/Time.xml` (Time & leave, menu 8: Timesheets the default, My time, Time entries; TimesheetDetail, the prints,
    the team timesheet, the terminal twin and the import out of the menu) and `screen/People/Payroll.xml` (Payroll, menu 10:
    Rates), each mounting Projects' screens as they are; `BOSS_PPL_TIME` (an inheritable ALLOW on the area for
    `BOSS_PEOPLE_SELF`, so the self-service employee keeps and submits their own week; every People user opens it through the
    root) and `BOSS_PPL_PAYROLL` (denied to the root user group, ALWAYS for the payroll operator and approver); People.js's area
    `payroll`, its link paths, the self-service context's `Time/MyTime` link; the keys `g t` and `g r`; the four timesheet topics on
    the People root;
  - Projects' owner contract (design-projects §8 "As built for People"): `TimeServices.get#TimeLinks` (the mount's time links from
    `appRoot`; a work item's or project's link only for a user who opens Projects, read from their own grants), `appRoot` on
    `get#MyWeek`, `find#TimesheetRows`, `get#TimesheetDetail` and `find#TimeEntryRows`, the screens' paths from `appRoot`, the ten
    group checks as `TIME_ENTRY_RATE` (money) and `TIMESHEET_APPROVE` (a manager's visible projects, the approver's default
    list), `get#TimePeople` with the live reports (MyWeek's pickers through it); BillingServices' `check#RateAccess` (client
    billing with money, worker pay with money or `PAYROLL_VIEW`, labor costing read only to either) and `get#PayrollEmployees`
    (payroll without money reads and sets only the pay rates of the employees of their People employers, on no project);
    Rates' third chip Labor costing (read only), client billing and Which rate hidden from payroll, its person picker People's
    employees under People;
  - Accounting's owner contract (design-accounting §15 "As built"): CostingPolicies' Labor costing rates box (New rate, a row's
    Change and End; the rows shared by every organization);
  - MyTeam: each report's Last week (from the missing list) and Remind missing time on the selected people over
    `send#MissingTimeReminders`; Home: Weeks not submitted for a manager or time approver, opening Timesheets' Missing;
    SelfService: My time and Weeks to submit (`get#SelfServiceContext`'s `myTimeUrl`); Today: `get#TodayItems` adds the user's own
    weeks to submit (kind `timesheet`, opening People's My time) for one who keeps time under People and does not open Projects;
  - Commons' owner contract (design-drawers-commons): `get#TodayView` keeps a timesheet item's own link; a timesheet's record link
    opens People's TimesheetDetail for a user with People's time area and not Projects;
  - Manufacturing's demo rate `BOSS_MFG_RATE_RUN` is `RaprCost`; People's demo sets `{"ap":"line"}` on Retail.
- Specs: Mantle `test/humanres/LaborCostingRate` (3 features, 0.65 s: the most specific dated row, a person's class, an ended row
  and a row on a person unpriced, never the person's RaprVendor rate; store ending the rate in effect, a stale form, a coming
  rate, no currency, payroll refused store and `create#RateAmount` with the same scope, payroll reading the rows read only, a
  reader without a grant refused, a coming rate ended at its start, a pay rate not a costing rate; the data update moving a row
  and removing the value, then nothing). The production labor event priced from a `RaprCost` row is ProductionShopFloor's labor
  features (their rates `RaprCost` rows since this phase; one line changed). BOSS `test/People/PeopleTime` (4 features, 0.7 to
  1.05 s: Remind missing time from My team reaching the manager's report and skipping Services' employee, Retail `line` and
  Services `project`; the employee's week to submit as their Today item and self-service card under People, none for HR; the
  manager approving the submitted week from People's Timesheets (its one html render under People: People's links, none to
  Projects) and TimesheetDetail, HR refused; payroll setting and reading Tomas's pay rate, refused Kenji's and a client rate,
  reading the costing row read only, People's Rates' one html render, HR's rows refused). `PeopleAccess` gains a feature (0.15 s:
  the employee opens My time under People by the area's grant and is refused Payroll and Employees; HR refused Rates), its menu
  feature the payroll operator's menu and the Time group, its capabilities the `payroll` area, its context feature the
  employee's My time link; `PeopleSpecLib`'s menus and keys; `PeopleSelfService`'s SelfService render checks My time and Weeks to
  submit, its My team render Last week and Remind missing time. Acceptance, written and not run: `acceptance/People/PeopleTimeUsable`
  (3 features); `PeopleFoundationWalk` walks the admin menu, which now holds Time and Payroll.
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle LaborCostingRate, ProductionShopFloor,
  HumanResServices, PayrollServices, PeopleChecklists, PeopleScope, PeopleDirectory, CommonsToday, WorkManualTimeBilling,
  WorkManualTimeRates, WorkPlanToCashBasicFlow, WorkProjectBilling, WorkProjectMilestones, WorkProjectReports, WorkResources,
  WorkTimeEntries, WorkTimesheets, AccountingProjectCost and WorkProjectHub with their dependencies 184 of 184 (mr-mantle 23.5 s
  of features); BOSS PeopleAccess, PeopleSelfService, PeopleTime, PeopleEmployees, PeopleHire, PeopleLifecycle, PeopleApprovals,
  TimeEntries, Billing, ClientBilling, Reports, ProjectRequests, ProjectsAccess, Projects, ProjectsHome, WorkItemDetail,
  Resources, ManufacturingShopFloor, ManufacturingAccess, AccountingProductionCostClose, TodayPanel, Notifications, Tasks, Chatter
  and AppOrganizationFilters with their dependencies 196 of 196 (mr-boss 35.7 s of features). `moqui lint --screens`: 135 flagged
  sites as before, none in the screens P10 touched, no new TUI worklist entry. Prettier clean on the new and changed JavaScript.
  Not run: `./moq test-apps`, the acceptance suite.
- Inventories: ss-inventory's P10 note and the TimeEntries, EditTimeEntry, PartyTimeEntries and EditRateAmounts rows (People's
  mounts); usl-inventory's RateServices, TimeServices and TimesheetServices rows with People's mounts, and the new services.
- Design edits: design-people (header; §1.2 the menu; §1.4 Today; §3 Home, MyTeam, SelfService; §13's as-built block; PE-23);
  design-projects §8 "As built for People" (owner contract); design-accounting §15 LaborCostingRates as built; design-manufacturing
  §3's costing rate; design-drawers-commons (header, §5 Home).
- Findings, numbered by the lead F180 to F189 in order:
  - `line` is set on Retail alone: Services is Projects' demo organization, where Joe's line manager (Bob) would replace john.doe
    as his approver, which Projects' specs read; People's Services employees (Amara's team) keep the project rule in the demo;
  - the timesheet topics' links (BossSetupData's `TimesheetApproval`, `TimesheetReturned`, `TimesheetApproved`, `TimesheetMissing`)
    open Projects' screens, one template per topic, so a People-only approver's email opens a screen they are refused; the tray
    opens the record by `get#RecordLink` (now People's TimesheetDetail for them), but `TimesheetMissing` for a week with no
    timesheet has no record;
  - an employee without Projects logs time only on a work item of a project they are on or a task they may update in Projects
    (`check#TimeItem`), else on no work item; People's demo employees are on no project, so their weeks are entries with no item;
  - the labor costing rates carry no organization (RateAmount has none and the lookup reads none, F61), so CostingPolicies' box
    is every organization's and design-accounting's "organization" field is not built; `get#CostingRate` ignores currency, as
    production did, so rows in several currencies are the reader's to convert;
  - People's Rates limits payroll's pay rows to the employees of their People employers (`get#PayrollEmployees`), but Mantle's
    `get#PayRateAccess` has no organization scope, so a holder of both `TIME_ENTRY_RATE` and `PAYROLL_VIEW` in Projects' Rates
    reads any employee's pay rate (as before);
  - `get#CostingRate` takes a person's class from their dated occupancy row (EmplPositionParty), production's rule, not from
    `Employment.emplPositionId` (P6's seat in effect); a person seated only on the employment gets no class;
  - My team's Last week lists every live report as Not submitted when they keep no time (the missing list is every report, not
    only time keepers); Remind skips those whose week the manager does not approve (a `project`-policy employer);
  - Today's week items come from People only for a user who does not open Projects; a user of both gets Projects' item, opening
    Projects' My time;
  - Home's Weeks not submitted runs the missing list (each person's expected hours) on every manager's Home render;
  - `ironstone.projects.TimeServices.get#TimePeople` still reads `isInGroup('ADMIN')` for every time keeper (Mantle's convention
    for ADMIN), as `find#Timesheets` and `get#TimesheetAccess` do.
- For the lead:
  - budget share: mr-mantle about 0.65 s (LaborCostingRate); mr-boss about 1.0 s (PeopleTime 0.7 to 1.05 s, PeopleAccess's new
    feature 0.15 s, its menu feature about +0.05 s); the client walk unchanged;
  - merge hot spots (P9 runs beside): mr-mantle `TimesheetServices.xml` (P9 changes `get#WeekDays`; P10 adds `get#LineReports`
    before `find#Timesheets`, `find#WeeksToSubmit` before `send#MissingTimeReminders` and changes `find#Timesheets`' missing
    list), `ProjectServices.xml` (`get#ProjectTodayItems`' timesheets part), `Employees.js` (`selfService`, `weeksToSubmit`),
    `PeopleServices.xml` (`get#SelfService`), `HumanResourcesEntities.xml` (the RatePurpose seed), `RateServices.xml`,
    `ProductionShopFloorData.xml`, `ProductionShopFloor.js`; mr-boss `screen/People/Time.xml` (new here; P9 puts Working
    schedules under Time & leave and will likely make the same file), `screen/People.xml` (header comment, keymap, topics),
    `People/MyTeam.xml` (Team's columns, P9's schedule), `People/Home.xml`, `Shared/PeopleSelfService.xml`, `People.js` (areas,
    linkPaths, sharedContext's self links, today, selfServiceContext and the new functions), `ContextServices.xml`,
    `BossSetupData.xml` (appended block), `BossPeopleDemoData.xml` (appended block), `BossManufacturingDemoData.xml`,
    `PeopleSpecLib.js` (menus, keys: P9 adds its entries to `staffMenu`, `adminMenu`, `timeMenu`, `settingsMenu`),
    `PeopleAccess.spec.js`, `PeopleSelfService.spec.js`, the inventories, design-people's header, §1.2, §1.4, §3, §13 and PE-23;
    Projects' `TimeServices.xml`, `BillingServices.xml`, the time screens and Rates, Accounting's CostingPolicies, Commons'
    `CommonsServices.xml` and `PaletteServices.xml`;
  - acceptance to run with the full suites: PeopleTimeUsable (new) and PeopleFoundationWalk (the admin menu gains Time and
    Payroll);
  - the user's call: whether the timesheet topics' links should open People's screens for a People-only user (a per-app
    template is not available: one link template per topic), and whether My team's Last week should list only reports who keep
    time.

**Review Nov 11 (P10).** A fresh review of `git diff master...ppl/p10` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §13 (MyTime, Timesheets, TimesheetDetail, TimeEntries, Rates), §3 MyTeam, PE-23 and F17, F34, F57, F61, with the Projects
owner contract, the group checks as permissions, the time approver's reach, Rates' pay and client rows, the costing lookup and
its migration first; the user's three calls of Nov 11 built and recorded in §4; fixes committed apart per repository ("People P10
review: …").
- Rebased first: P9 (working schedules), built beside P10, merged to master in both repositories, and `ppl/p10` was rebased onto
  it (mr-mantle cleanly; mr-boss with the conflicts resolved in the rebased P10 commit, so both phases' work stands):
  - Time & leave is one area (`People/Time`, menu 7 and P9's icon) holding P10's time screens (Timesheets the default, My time,
    Time entries, menu 1 to 3) and P9's Working schedules (menu 5, was 2) and Holidays (9). The group names collided (both phases
    made `BOSS_PPL_TIME`): `BOSS_PPL_TIME` is now the area's (Time.xml inheritable, every People user's through the root and a
    self-service employee's by its ALLOW, P10's), and P9's schedules group is `BOSS_PPL_SCHEDULES` (WorkingSchedules and
    WorkingScheduleDetail: ALWAYS HR and the managers, denied to the root user group and, new, to `BOSS_PEOPLE_SELF`, whom the
    area's inheritable ALLOW would otherwise let in); `BOSS_PPL_HOLIDAYS` denies `BOSS_PEOPLE_SELF` too. P9's Time.xml grant
    (non-inheritable, the root group denied) is gone: every People user opens the area. People.js's `schedules` area reads
    `Time/WorkingSchedules`, so the capability is still HR's and the managers'. PeopleSpecLib's menus (Time in every People
    user's menu; `timeMenu`, `hrTimeMenu`, `managerTimeMenu` by group) and keys (`g w` then `g t`); PeopleAccess's menu feature
    checks the HR officer's, the manager's and the reader's Time groups, and P10's feature also refuses the self-service employee
    Working schedules and Holidays. People.xml's keymap and header, MyTeam (P9's schedule column and P10's last week), the demo
    and setup data's appended blocks, design-people's header, §1.2 and §3, and usl-inventory's rows are merged.
  - Run after the rebase, before the review: Mantle PeopleSchedules, LaborCostingRate, ProductionShopFloor 17 of 17; BOSS
    PeopleSchedules, PeopleTime, PeopleAccess 24 of 24.
- Checked and found sound:
  - Projects' owner contract: the ten `BOSS_PROJECT_MANAGER` checks of `TimeServices` are `TIME_ENTRY_RATE` (money, which was
    the group or ADMIN) and `TIMESHEET_APPROVE`; BossSetupData grants both only to `BOSS_PROJECT_MANAGER`, and Mantle to ADMIN, so
    no Projects user gains or loses money or reach (ADMIN's Timesheets now opens on To approve, where it opened on Mine; its
    projects were every project already). The links follow `appRoot` for links only; the screens' paths follow the mount.
    ProjectsAccess, TimeEntries, Billing, ClientBilling, ProjectsSettings, ProjectsHome, Reports, Resources,
    ManufacturingShopFloor, ManufacturingAccess, AccountingProductionCostClose pass, and Mantle's time, timesheet, billing,
    production and project cost specs.
  - A time approver under People reads only the weeks `get#TimesheetAccess` admits (the week's person, its approvers by the
    organization's policy, ADMIN): `get#MyWeek` answers no week otherwise, Timesheets' lists are filtered by it, and a line
    manager decides a report's week only under `line`. The pickers list the user's live reports, whose weeks are checked again.
  - Rates: pay rows only for `PAYROLL_VIEW` holders, of the employees of their People employers (`get#PayrollEmployees`), set
    with `PAYROLL_EDIT` on no project; client billing and Which rate only with money; the services check it again.
  - `get#CostingRate` is production's lookup (the same rows, filter and order, the class from the same EmplPositionParty rule;
    `laborFits` re-checks by rate id); `migrate#ProductionCostRates` moves each row in its own transaction and removes the old
    value only when none is left; RaprCost writes need `ACCOUNTING_ADMIN` on every path (`store#`, `end#`, `create#`,
    `update#RateAmount`).
- Fixes:
  - **R1 (low, owner contract).** TimeEntries.xml's Update rates button still read the group (`isMoneyManager`, BOSS_PROJECT_MANAGER
    or ADMIN); it is `TIME_ENTRY_RATE`, as its service checks.
  - **R2 (the user's call 1).** The four timesheet topics link through a record-link resolver: Commons' `openRecord` transition
    (`/apps/Commons/openRecord?recordEntityName=…&id=…` or `?docType=MantleTimesheetWeek&id=<day>`; a browser's GET of the
    `/apps` path runs it and redirects to the `/qapps` screen, a GET of a `/qapps` path loading the shell) over
    `PaletteServices.get#RecordLink`, which gains `MantleTimesheetWeek` (the user's own week in My time: Projects' for a Projects
    user, else People's for a People user or a self-service employee, else none). TimesheetApproval opens the timesheet, Returned,
    Approved and Missing the person's week (a missing week with no timesheet too); `decorate#Notifications` resolves the same
    link in the tray. Projects users' links still open Projects. Spec: PeopleTime's third feature (the reminder's link, the
    employee's and john.doe's resolution, the transition's redirect).
  - **R3 (the user's call 2).** `get#LineReports` answers `keeperIdList`: the live reports who logged time this week or in the
    eight before, or whose organization's policy says every employee keeps a weekly timesheet (a new policy key `rq`, `required`,
    default N; Projects' TimeSettings offers it as a check box, owner contract; Retail's demo sets it). `find#Timesheets`' missing
    list adds only those (so Home's Weeks not submitted and Timesheets' Missing too), and My team shows Last week only for them,
    nothing for the others. Spec: PeopleTime's third feature (Hannah's three reports with Retail's `rq`; without it only Tomas,
    who kept time, and Ines and Rafael out of the missing list).
  - **R4 (the user's call 3).** `RateAmount.organizationPartyId` (Mantle entity field). `get#CostingRate` takes `organizationPartyId`
    (else the person's employers at the date, PrtEmployee) and prefers that organization's rows, by the same rules, then the
    shared ones, so production (which now passes the person) is unchanged where no organization keeps rows; `laborFits` also
    re-checks an organization's row against the employer. `find#CostingRates` lists the shared rows and those of the reader's
    organizations (every one for `ACCOUNTING_ADMIN` or `PEOPLE_ALL_ORGANIZATIONS`), or of `organizationPartyId` (another refused,
    `ORGANIZATION_DENIED`), with canChange by row; `store#`, `end#CostingRate` and `create#`/`update#RateAmount` of a RaprCost row
    scope by organization as Accounting scopes finance administration (`AccountingPolicy.access` admin: every internal
    organization, the active one when chosen): another organization's row is refused (`ORGANIZATION_DENIED`; End answers it as
    missing), and a shared row is changed only working for every organization (no active organization) or by ADMIN, as a shared
    pay grade needs `PEOPLE_ALL_ORGANIZATIONS`. A rate of another purpose carries no organization (`create#RateAmount` clears it),
    so Projects' rows are unchanged. Accounting's box lists the chosen organization's rows and the shared ones with an
    Organization column and New rate's For; Rates' Labor costing rows are those `find#CostingRates` gives the user. Spec:
    LaborCostingRate's fourth feature (the employer's row, another organization's when asked, the shared row without either,
    the shared fallback; working for A: A's row stored, B's and a shared one refused, B's End missing, A's list; a shared row with
    none chosen; a reader of A seeing A's and the shared rows, refused B's).
  - design-accounting §15, design-people (§3 MyTeam, §13, PE-23), design-projects §8 and usl-inventory say so.
- Findings, numbered by the lead F190 to F193 in order:
  - Accounting has no organization-scoped finance administration (`ACCOUNTING_ADMIN` is every internal organization, narrowed only
    by the active organization), so the "all-organizations grant" a shared costing row needs is read as finance administration
    working for every organization (no active organization chosen), and an organization's row as one in that scope; Accounting's
    CostingPolicies sets the active organization when one is chosen there, so a shared row is changed with none chosen (the box
    says so). A dedicated `ACCOUNTING_ALL_ORGANIZATIONS` would be the user's call;
  - `get#CostingRate` with a person employed by two organizations that both keep a matching row takes the most specific, then the
    newest, of either;
  - a database loaded with P9's data before this rebase keeps P9's `BOSS_PPL_TIME` rows (`BOSS_PPL_TIME_HR`, `_MANAGER`, `_DENY` and
    the WorkingSchedules pattern member); a reload does not remove them, and the DENY then refuses Time & leave to the directory
    reader. Nothing is released; a dev database is rebuilt from the data;
  - My team's keepers and the missing list read each report's policy (`get#TimesheetPolicy` per report without recent time) on every
    render, beside Home's missing list (the Built note's finding);
  - the worker's findings stand otherwise: the timesheet topics' and Last week's are built (R2, R3); the costing rows' organization
    is built (R4).
- Tests (release binary, `--nobuild`, this worktree's runtime): Mantle LaborCostingRate (4 features: 0.01, 0.49, 0.17 and the new
  0.84 s), ProductionShopFloor, WorkTimesheets 21 of 21; WorkTimeEntries, WorkManualTimeRates, WorkManualTimeBilling,
  WorkProjectBilling, HumanResServices, PayrollServices, AccountingProjectCost, PeopleSchedules, ProductionCostClose 56 of 56;
  BOSS PeopleTime (5 features; the new one 0.31 to 0.35 s), PeopleAccess, PeopleSelfService, CommonsSettings, Tasks, QuickCreate
  75 of 75; AccountingProductionCostClose (CostingPolicies' render) 3 of 3; ProjectsAccess, TimeEntries, Billing, ClientBilling, ProjectsSettings, ProjectsHome,
  Reports, Resources, ManufacturingShopFloor, ManufacturingAccess, TodayPanel, Notifications, PeopleSchedules 86 of 86. The new
  features fail on the code as built (no organization field, no `keeperIdList`, no `MantleTimesheetWeek`, the old links).
  `moqui lint --screens`: 135 flagged sites as before, none in the screens touched. Prettier clean on the changed JavaScript.
  Not run: `./moq test-apps`, the acceptance suite (PeopleTimeUsable's costing rate is a shared row, set with no organization
  chosen, as before).
- For the lead:
  - budget share: mr-mantle about +0.85 s (LaborCostingRate's fourth feature); mr-boss about +0.35 s (PeopleTime's third feature);
  - merge hot spots: the rebase is done; mr-mantle `HumanResourcesEntities.xml` (RateAmount), `TimesheetServices.xml` (policy,
    `get#LineReports`), `CostingRates.js`, `RateServices.xml`; mr-boss `BossSetupData.xml` (the Time groups, the topics),
    `Commons.xml`, `CommonsServices.xml`, `PaletteServices.xml`, `CostingPolicies.xml`, `Projects/Settings/Time.xml`;
  - the user's calls are in §4; the all-organizations reading for a shared costing row (the first finding) may want the user's
    word.

### P11 — Leave policies, allocations and balances

Design §7 (the model), LeavePolicies, LeavePolicyDetail, LeaveAllocations, LeaveBalances; PE-07.

- **Mantle** LeaveType, LeavePolicy and its accrual rules, policy assignments, blocked and mandatory intervals,
  LeaveAllocation and LeaveLedgerEntry (append-only, each with its source), and `mantle.humanres.LeaveServices`:
  `find#Policies`, `store#Policy`, `store#AccrualRule`, `assign#Policy`, `store#BlockedInterval`,
  `preview#Allocation`, `allocate#Leave`, `get#Balances`, `find#Ledger`, and the accrual job (a unique employment,
  policy and period key; one failure logged, the rest continue; marked with `operation`).
- **Screens:** LeavePolicies, LeavePolicyDetail (PolicyTerms, AccrualAndCarry, AssignPolicy, BlockedDays),
  LeaveAllocations, LeaveBalances with its ledger drill-down and export; `LeaveServices.get#Balances` exposed to
  the Assistant for self scope only (`exposeMcp` N).
- **Specs:** Mantle `test/humanres/LeaveLedger` (an allocation posts once per key; a duplicate period grant
  refused; accrual run twice posts once; a policy change keeps posted entries; a balance as of a date).
- **Usable when** (`acceptance/People/PeopleLeavePoliciesUsable`; design §14.3 "Accrual and schedule changes"):
  `people.hr` defines an annual-leave policy with monthly accrual and a blocked week, assigns it, allocates to a
  department with one row refused and named, runs accrual twice, and reads each balance's movements.

**Built Nov 11 (P11).** mr-mantle 6d7ec7b2, mr-boss (branch `ppl/p11`).
- Checked first (the code over the plan): P9's Built and Review notes (`Schedules.js` exports `scheduledDays` and `holidaysOf` for
  durations, which only requests need: P11's accrual is by calendar periods and reads no schedule, so P12 takes the durations); F33
  and F71 (`EmploymentLeave` keyed by employment and start day, its own `EmploymentLeaveType` values; no data file makes a row, so
  the spec makes its own); `Lookups.js`'s families table, which named leave types as a later family; People.js's scope pieces
  (`scopeOf`, `reportLines`, `unitsUnder`, `assignmentsAt`) and the assignment's department for a department's employees; the
  built Assistant exposures (`admin_find_users`, Insights' tools: `AgentToolExposure` rows in BossSetupData, `exposeMcp` N for
  staff data) and that a tool's arguments are the model's (the framework does not hold a call to a schema override); the service
  `operation` attribute (service-definition-3.xsd: a metric by name for a service that owns its transaction, as
  `MessageServices.attempt#Delivery`); `ec.transaction.runRequireNew` and the per-item probe of `apply#DueAssignments`; §4's call
  putting HR's editors out of Settings (P7) and the lead's on Holidays (P9).
- Mantle:
  - `entity/PeopleLeaveEntities.xml` (`mantle.humanres.leave`): `LeavePolicy` (an employer's, for a leave type of the new HR
    vocabulary `PeopleLeaveType`, seeded Annual, Sick, Parental, Bereavement, Unpaid and added to Lookups' families; its unit days or
    hours, paid, entitlement required, negative limit, evidence, accrual frequency monthly, quarterly, yearly or none; dated, its terms
    audited), `LeaveAccrualRule` (dated steps by months of service: amount a period, cap, carry-over limit, rounding),
    `LeavePolicyAssignment` (one policy of a type for an employment at a time, an opening balance), `LeaveBlockedInterval` (blocked or
    mandatory days of the employer, a department or a leave type, override allowed, reason; cancelled, kept), `LeaveAllocation` (a
    grant for an entitlement period with an optional expiry day, or a reasoned adjustment; its operation key) and `LeaveLedgerEntry`
    (opening, grant, accrual, consumption, expiry, adjustment, reversal; its source and a unique `sourceKey`; never changed or deleted);
  - `mantle.humanres.LeaveServices` over a new module `Leave.js`: `find#Policies` and `get#Policy` (an HR reader of the employer),
    `store#Policy` (new, change at the revision, close; `ORGANIZATION_REQUIRED`, `ORGANIZATION_DENIED`, `NAME_REQUIRED`,
    `TYPE_INVALID`, `UNIT_INVALID`, `LIMIT_INVALID`, `FREQUENCY_INVALID`, `OWNER_CHANGE`, `TYPE_CHANGE`, `UNIT_IN_USE` and
    `FREQUENCY_IN_USE` once posted, `DATE_PAST`, `REVISION_CHANGED`), `store#AccrualRule` (added, changed or ended from a date at the
    policy's revision; `FREQUENCY_REQUIRED`, `OVERLAP`, `DATE_PAST` before today once accruals were posted, `SERVICE_INVALID`,
    `AMOUNT_INVALID`, `CAP_INVALID`, `CARRY_INVALID`, `ROUNDING_INVALID`, `RULE_ENDED`), `assign#Policy` (named employments, a
    department's with the units under it, or the employer's current employees, at most 500, each in its own transaction under the
    employment's lock; `EMPLOYMENT_OUTSIDE`, `DATE_OUTSIDE`, `ASSIGNMENT_OVERLAP`, `UNIT_MISMATCH` named per row; preview; an operation
    key's retry repeated; end of one assignment at its revision), `store#BlockedInterval` (`overlappingRequests` empty until P12),
    `preview#Allocation` and `allocate#Leave` (`NOT_ASSIGNED`, `DUPLICATE_PERIOD`, `NEGATIVE_LIMIT` named per row, the count and
    total; posted once per operation key and employment, a retry answered as repeated; `OPERATION_REQUIRED`, `REASON_REQUIRED`,
    `PERIOD_REQUIRED`, `EXPIRY_INVALID`), `get#Balances` (as of a date: the caller's own, a manager's live reports at the line's
    employers, an HR reader's employers'; by employment, person, employer, department, leave type; movements by kind, balance,
    pending (zero until P12) and available; paged by employment), `get#MyBalances` (its self-scope form, no party parameter),
    `find#Ledger` (the person and HR; newest first with the balance after each and its source; an export of up to 5,000 rows; the
    employment's legacy `EmploymentLeave` rows as historical, dates, type and approval, never the reason, in no balance),
    `run#Accrual` (an HR editor's, by a date never later than now), `run#AccrualJob` (the daily `run_LeaveAccrual` job,
    `data/PeopleLeaveSetupData.xml`) and `accrue#Assignment` (internal, force-new, `operation="people.leave.accrual"`): each ended
    calendar period of the frequency in the runner's zone, in arrears, keyed by employment, policy and period, the step in effect on its
    last day for the months of service then, prorated by the time covered, rounded and capped (a capped period posts its zero entry,
    so it is decided once); at a year's end the balance above the carry-over limit expires once (keyed by employment, type and year);
    what is left of a grant after its expiry day expires once (keyed by the allocation), as far as the balance holds it; each
    assignment in its own transaction, a failure logged with its employment and policy and the rest going on.
- BOSS:
  - `People/Time/LeavePolicies` (menu 10; New policy the primary), `Time/LeavePolicyDetail` (record header; Assign the primary; More:
    Allocate leave, Run accrual, Edit terms, Close policy; Policy terms, Accrual and carry-over with Add step, Change and End,
    Assignments with End, Blocked days with Add and Cancel), `Time/LeaveAllocations` (menu 11; a policy, then an employee, a
    department or the employer, a grant or adjustment; Preview with each outcome and why; Allocate the primary, confirmed with the
    count and total) and `Time/LeaveBalances` (menu 7; by employer, department, person, leave type and as-of date; an employee's
    movements with the CSV export and historical leave for HR); SelfService's My leave balances over `get#MyBalances`;
  - grants: `BOSS_PPL_LEAVE` (LeavePolicies, LeavePolicyDetail, LeaveAllocations: ALWAYS `BOSS_PEOPLE_HR`, DENY `BOSS_PEOPLE` and
    `BOSS_PEOPLE_SELF`, so a later grant of Time to self-service employees opens none of HR's editors), `BOSS_PPL_LEAVE_BALANCES`
    (ALWAYS HR and `BOSS_PEOPLE_MANAGER`, DENY `BOSS_PEOPLE`), `BOSS_PPL_LEAVE_SELF` (`get#MyBalances`, non-inheritable ALLOW for
    `BOSS_PEOPLE_SELF`: SelfService's screen grant is non-inheritable); the Assistant's `people_my_leave_balances` over
    `get#MyBalances` (`exposeAssistant` Y, `exposeMcp` N); the key `g b`; People.js's link paths and the choices `leaveTypes` and
    `leavePolicies`;
  - demo (`BossPeopleDemoData.xml`, appended): Retail's Annual leave (days, monthly 1.75, 2 from 60 months, cap 30, 5 carried over)
    with nobody under it, so no balance exists until HR assigns it.
- Specs: Mantle `test/humanres/LeaveLedger` (5 features, stepwise, 2.3 s: 0.96, 0.25, 0.15, 0.55, 0.37: a policy with two service
  steps, assignment, a second policy of the type refused, a blocked week, the reader, another employer's HR and a stale revision
  refused; an allocation with one employee refused and named, its retry repeated, a second grant for the period refused, an
  adjustment without a reason refused; the accrual run three times with a fault of the spec's own on one employment's first key: 16
  posted and that one failed and named, then its 7, then nothing; the service steps, a part period (15 of 30 days), the cap, a
  year's carry-over and a grant's expiry; a step changed from today and refused from a posted past, the unit and frequency fixed,
  posted totals unchanged; balances as of two dates, the person's own movements, the manager's balance without movements, the reader
  refused, the legacy row historical without its reason); `PeopleApprovals`' families include `PeopleLeaveType`. BOSS `PeopleAccess`
  gains one feature (0.62 s: Retail's policy changed by Retail's HR, the reader refused with the same parameters, Services' policy
  refused to Retail's HR, LeavePolicyDetail's one html render as HR, the reader, manager and employee refused LeavePolicies, the
  manager's LeaveBalances html render, the employee's `get#MyBalances` under authorization and `get#Balances` refused them, the two
  choices with a selected value off the page and Services' policy not offered), its menu feature the Time group (`hrTimeMenu`,
  `managerTimeMenu`) and keys (`g b`). Acceptance, written and not run: `acceptance/People/PeopleLeavePoliciesUsable` (4 features:
  people.hr's policy with monthly accrual and a blocked week through LeavePolicies and LeavePolicyDetail, assigned to Tomas and Ines;
  five days allocated to Store Operations through Allocations, Rafael refused and named, a double submit posting nothing; the accrual
  run twice, six then none; each balance's movements on LeaveBalances, 9.5 days).
- Tests run (release binary, `--nobuild`, this worktree's runtime): Mantle LeaveLedger, PeopleApprovals, PeopleSchedules, PeopleScope,
  HumanResServices and PeopleDirectory 36 of 36 (mr-mantle 13.6 s of features); BOSS PeopleAccess, PeopleSelfService,
  PeopleSchedules, PeopleApprovals, PeopleEmployees, InsightsSettings and ProjectsAccess with their dependencies 54 of 54 (mr-boss
  18.1 s), then PeopleAccess, PeopleSelfService and PeopleSchedules 25 of 25 after the self-service deny. The four new screens and
  SelfService (under Commons, as the employee) rendered once more by hand in html, qvt and tui without errors (not kept in the suite).
  `moqui lint --screens`: 135 flagged sites as before, none in the screens P11 touched, no TUI worklist entry. Prettier clean on the
  new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added rows (LeaveServices); ss-inventory's P11 note (no baseline form maps to the four
  screens; Marble's HumanRes has no leave form).
- Design edits: design-people (header; §1.2 Time & leave; §1.4 Assist's tool; §2 the three paths under Time and the Settings
  sentence; §3 SelfService; §7 the model as built, LeaveBalances, LeaveAllocations, LeavePolicies and LeavePolicyDetail as built).
- Findings, numbered by the lead F194 to F201 in order:
  - a leave type is an HR vocabulary (`PeopleLeaveType`, Lookups), not a LeaveType record: the unit, paid meaning and evidence are the
    policy's (design §7 put them on the type); an employment's balance of a type is kept in one unit (`UNIT_MISMATCH`), so a type's
    policies at one employer should share it;
  - the Assistant's tool is `get#MyBalances`, the self-scope form of `get#Balances` with no party parameter: a tool's arguments are
    the model's, and `get#Balances` answers an HR officer or a manager about other people;
  - accrual periods are calendar months, quarters and years in the zone of whoever runs it (the job: the server's), not the
    employer's or a schedule's; the carry-over is at the calendar year's end by the step in effect on its last day (no fiscal or
    anniversary year); a grant's expiry takes what is left of the balance up to the grant (not lots by grant), and months of service
    count from the current employment's start;
  - an employee on a leave of absence (`EasLeave`) accrues as when working; there is no rule on the assignment's state;
  - an ended assignment is looked at by the accrual for a year after its end: a period left unposted longer (the job stopped for a
    year) is not posted by either run;
  - a manager reads their reports' balances but not their movements (design "manager aggregates"); a self-service employee reads their
    own on SelfService (balances only; no movements page outside LeaveBalances, which their groups do not open on master);
  - allocations are HR's at once after a preview: no People approval kind for a grant, and no row selection on the preview (an
    employee is chosen in the form); AccrualAndCarry's schedule preview and validation against examples are not built (the steps say
    what they post in words);
  - blocked days are entered on a policy for its employer and refuse nothing until requests exist (P12), when
    `overlappingRequests` gets its rows;
  - People's Settings no longer holds any leave editor: Leave policies and Allocations are HR's under Time, as Holidays (the user's
    call of Nov 11 on HR's editors, applied as the lead applied it in P9).
- For the lead:
  - budget share: mr-mantle about 2.3 s (LeaveLedger); mr-boss about 0.6 s (PeopleAccess's feature 0.62 s); the client walk
    unchanged;
  - merge hot spots (P10 merges first; the reviewer rebases): mr-boss `screen/People/Time.xml` (the header comment's appended
    sentence and the subscreens comment; P10 rewrites the file's subscreens and menu indexes: Leave balances is 7, Leave policies 10,
    Allocations 11, and P10's Timesheets 1, My time 2 and Time entries 3 share index 2 with Working schedules already), the P11
    blocks appended at the end of `data/BossSetupData.xml` (`BOSS_PPL_LEAVE`, `BOSS_PPL_LEAVE_BALANCES`, `BOSS_PPL_LEAVE_SELF`, the
    `people_my_leave_balances` exposure) beside P10's appended `BOSS_PPL_TIME` change (P10 makes Time an inheritable ALLOW for
    `BOSS_PEOPLE_SELF`: `BOSS_PPL_LEAVE` already denies them; LeaveBalances would then open to them with their own balances, which
    `get#Balances` scopes, and PeopleAccess's employee case should be read again), the P11 block appended to
    `data/BossPeopleDemoData.xml`, `service/ironstone/people/People.js` (`linkPaths`' P11 entries after P9's, the choices comment and the
    two sources appended after `employments`), `service/ironstone/people/ContextServices.xml` (`get#Choices`' description),
    `screen/People.xml` (the header comment, the keymap comment and the `g b` key after `g w`), `screen/Shared/PeopleSelfService.xml`
    (the header comment, an `if` and two `set`s appended to the actions, the My leave balances box before Emergency contacts),
    `test/People/PeopleSpecLib.js` (`hrTimeMenu`, `managerTimeMenu`, `keys`, `leavePolicyId`), `test/People/PeopleAccess.spec.js`
    (the header's P11 sentence, the feature appended at the end), the inventories (usl-inventory's Added header "P1 to P11" and the
    LeaveServices rows after ScheduleServices'; ss-inventory's P11 note), design-people's header, §1.2, §1.4, §2, §3 SelfService and
    §7; mr-mantle `service/mantle/humanres/Lookups.js` (the families table) and `test/humanres/PeopleApprovals.spec.js` (the families
    check); P12 extends `Leave.js` and `LeaveServices.xml` and takes `overlappingRequests`, `pending` and the consumption and reversal
    entry types;
  - the acceptance test to run with the full suites is PeopleLeavePoliciesUsable (new);
  - nothing waits on the user's decision; the lead may record in §4 that Leave policies and Allocations are HR's under Time, as P9's
    Holidays.

**Review Nov 11 (P11).** A fresh review of `git diff master...ppl/p11` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §7 (LeavePolicies, LeavePolicyDetail, LeaveAllocations, LeaveBalances), §3 SelfService, §1.4's Assist tool and PE-07, with
the ledger, allocation and accrual keys, the scope of policies, balances and movements, the Assistant tool and the legacy rows
first; the user's and the lead's calls of Nov 11 recorded in §4; fixes committed apart per repository ("People P11 review: …").
- Rebased first: P10 (time mounts, rates and labor costing) merged to master in both repositories, and `ppl/p11` was rebased onto
  it (mr-mantle cleanly; mr-boss with the conflicts resolved in the rebased P11 commit, so both phases' work stands):
  - Time & leave keeps P10's subscreens and default (Timesheets 1, My time 2, Time entries 3, P9's Working schedules 5 and
    Holidays 9) with P11's files by their own menu indexes (Leave balances 7, Leave policies 10, Allocations 11; LeavePolicyDetail
    out of the menu); Time.xml's header names P11's groups. People.xml's keymap is `g w`, `g t`, `g r`, `g b`; PeopleSpecLib's
    `hrTimeMenu` and `managerTimeMenu` are P10's lists with P11's screens in menu order, and the HR officer's keys end `g w`, `g t`,
    `g b`; `costingRateId` and `leavePolicyId` both kept. People.js's `linkPaths` (P10's then P11's), the demo data's appended blocks
    (Retail's timesheet policy, then the annual leave policy), SelfService's header and actions (P10's weeks to submit and P11's
    balances), PeopleAccess's header and both features (P10's self-service Time feature, then P11's), usl-inventory's rows (P10's
    then the LeaveServices rows) and design-people's §1.2 and §3 are merged.
  - P10's `BOSS_PPL_TIME` is now an inheritable ALLOW of the area for `BOSS_PEOPLE_SELF`. P11's `BOSS_PPL_LEAVE` already denied
    them (policies, a policy's detail and allocations stay refused), but `BOSS_PPL_LEAVE_BALANCES` did not: R1.
  - Run after the rebase, before the review: Mantle LeaveLedger 5 of 5 (2.2 s); BOSS PeopleAccess, PeopleSelfService, PeopleTime,
    PeopleSchedules 31 of 31 (8.8 s).
- Checked and found sound:
  - The ledger is append-only in code: `Leave.js` creates `LeaveLedgerEntry` rows and never updates or deletes one; every entry has
    a source (allocation, assignment, accrual rule and period, reversed entry) and a key under the unique index `LEAVE_LEDGER_KEY`
    (`opening:<assignment>`, `allocation:<operation>:<employment>`, `accrual:<employment>:<policy>:<period>`,
    `carry:<employment>:<type>:<year>`, `expire:<allocation>`). Every write to an employment's entitlement locks its relationship
    row first, so the checks and the key hold under concurrency.
  - An allocation posts once per operation key and employment (checked before and again under the lock); a second grant of the
    policy for an overlapping period is refused (`DUPLICATE_PERIOD`, under the lock, whatever the key); an adjustment needs a
    reason. The accrual takes each assignment in its own transaction (`accrue#Assignment`, `force-new`, called with
    `requireNewTransaction`), logs a failure by employment and policy and goes on; a second run posts nothing (the spec's fault
    rolls back the faulted employment's whole run and the others post). A policy change never touches posted entries (the unit
    and frequency fixed once posted, a step changed from today once accruals were posted). A balance as of a date sums the entries
    effective by then.
  - Scope: policies, blocked days, assignments, allocations and the accrual are an HR reader's or editor's of the employer
    (`editablePolicy`, `canEditAt`), another employer's answered as missing; balances are the person's own, a manager's live
    reports' at the line's employers (balances alone, `canSeeLedger` false and `find#Ledger` refused) and an HR reader's
    employers'; a supplied person, employer, department or employment only narrows. `run#AccrualJob` and `accrue#Assignment` are
    `anonymous-all` and not remote, as `apply#DueAssignments`.
  - The Assistant tool: `people_my_leave_balances` over `get#MyBalances` (`exposeAssistant` Y, `exposeMcp` N, `AgclRead`, no schema
    override); the service declares only `leaveTypeEnumId` and `asOfDate`, so the framework drops anything else, and
    `getMyBalances` passes only those two to `getBalances` in self scope (`selfOnly` is not reachable from parameters). The
    framework runs a tool only for a user its `AT_SERVICE` authz admits (`BOSS_PPL_LEAVE_SELF`).
  - Legacy `EmploymentLeave` rows are read only in `find#Ledger` (dates, type, approval, a "Historical" label), counted in no
    balance; `leaveReasonEnumId` is read nowhere in either repository's diff, and the spec checks the reason is absent.
- Fixes:
  - **R1 (medium, access, from the rebase).** With P10's inheritable ALLOW on Time & leave, a self-service employee opened Leave
    balances (the screen's `get#Balances` inheriting the grant and answering their own balances, and the menu listing it), where
    design §7 keeps it HR's and the managers' and the employee's own balances on SelfService. `BOSS_PPL_LEAVE_BALANCES` denies
    `BOSS_PEOPLE_SELF` too (`BOSS_PPL_LEAVE_BALANCES_SELF`; the managers' and HR's ALWAYS still open it). Spec: PeopleAccess's P11
    feature refuses the employee Allocations and Leave balances (Leave balances opened on the code as rebased).
  - **R2 (low, scope).** `assign#Policy`, `preview#Allocation` and `allocate#Leave` named the person of an employment of another
    employer in their rows (refused `EMPLOYMENT_OUTSIDE`, but `withTexts` read the person), while a missing one was named by its
    id: an HR editor could tell another employer's employment exists and whose it is. Only an employment of the policy's employer
    is read (`policyEmployment`); another is answered as a missing one. Spec: LeaveLedger's first feature (Eve's employment at B and
    a missing id answered alike; Eve was named on the code as built).
  - **R3 (low, revisions).** Ending an assignment (`assign#Policy` with `end`) accepted no `expectedRevision`; it is required, as
    blocked days and policies require theirs (LeavePolicyDetail's End passes it). Spec: LeaveLedger's first feature.
  - **R4 (low, query).** `run#Accrual` without a policy listed every leave policy and filtered by employer in JavaScript; it finds
    the editor's employers' policies in the query.
  - LeaveLedger's fifth feature also passes another person's employment and party to `get#MyBalances` and still reads Ana's
    balance alone.
- Findings, numbered by the lead F202 to F205 in order:
  - `find#Ledger` shows the person HR's adjustment and grant reasons in each movement's "From" (an allocation's `reason`); no BOSS
    path gives a self-service employee their movements today (`BOSS_PPL_LEAVE_SELF` covers `get#MyBalances` alone), so this
    decides nothing yet; P12, if the employee reads their movements, should say whether HR's reasons are theirs to read;
  - an assignment may be ended from a past date (no `DATE_PAST`, as a policy's close has), leaving accruals posted after its end in
    place (posted entries never change); blocked days may be added to a closed policy;
  - `allocate#Leave`'s operation key is not bound to the previewed terms: a resubmit under the same key with other terms answers
    the posted rows as repeated (nothing posts twice, but the answer shows the new amount);
  - `get#Balances` pages by employment while LeaveBalances lists a row per employment and leave type, so its page counts are
    employments';
  - the worker's findings stand otherwise.
- Tests (release binary, `--nobuild`, this worktree's runtime): after the rebase, Mantle LeaveLedger 5 of 5 (2.2 s) and BOSS
  PeopleAccess, PeopleSelfService, PeopleTime, PeopleSchedules 31 of 31 (8.8 s); after the fixes, LeaveLedger 5 of 5 (2.4 s; the
  first feature 1.05 s) and the four BOSS specs 31 of 31 (9.7 s; PeopleAccess's P11 feature 0.73 s). The new checks fail on the
  code as rebased (LeaveLedger's first feature on Eve's name; PeopleAccess's P11 feature on "the employee opens
  Time/LeaveBalances"). No screen changed, so no `moqui lint --screens` run. Prettier clean on the changed JavaScript. Not run:
  `./moq test-apps`, the acceptance suite (PeopleLeavePoliciesUsable as built).
- For the lead:
  - budget share: mr-mantle about +0.1 s over the Built note (LeaveLedger's first feature, 1.05 s); mr-boss about +0.1 s
    (PeopleAccess's P11 feature, 0.71 s);
  - the rebase rewrote the phase commits: mr-mantle's P11 commit is f6af4cb3 (the Built note's 6d7ec7b2), mr-boss's 1730e6f4;
  - merge hot spots: the rebase onto P10 is done; mr-mantle `Leave.js` (`policyEmployment`, the assignment end, `runAccrual`); mr-boss
    `BossSetupData.xml` (`BOSS_PPL_LEAVE_BALANCES`), `PeopleAccess.spec.js` (the P11 feature's employee loop);
  - the user's call on the shared costing rate (P10's first finding) and the lead's call on Leave policies and Allocations under
    Time & leave are recorded in §4; nothing waits on the user's decision.

### P12 — Leave requests and the team calendar

Design §7 LeaveRequests, LeaveRequestDetail, §13 TeamCalendar, Employee360's TimeAndLeave; PE-07, PE-21, PE-24
(projected calendars).

- **Framework PE-21** (mr-moqui, Remaining-Work's ask; F24): an attribute on a field or screen that turns off
  inline text actions, dictation and Update with AI there, honored by the rich-text toolbar and Assist's screen and
  data tools; the XSD, both renderers and their goldens (style-guide §8.1). The leave reason is its first user.
- **LeaveServices** `find#Requests`, `preview#Request` (duration from the schedule and holiday calendar, blocked
  days, reserved balance), `submit#Request`, `get#Request` and `decide#Request` on `PeopleLeaveApproval` (under
  lock: recomputed duration, overlap, balance with other reservations, then consumption posted once; cancellation
  reverses once). Approved leave publishes a WetTimeOff projection with a leave-start reminder, counted once by
  capacity (P9).
- **TeamCalendar:** Commons' Calendar mounted with the absence projection, reasons omitted; the content host of a
  leave request.
- **Projected calendars** (CX-SYNC, PE-24; F22): `CalendarDavServices.get#DavCollections` gains the projected
  kind, which is generic: a registration names an owner service, which answers a read-only collection for the users
  it admits, and the kind itself reads no People record. There is no registry today and the four DAV services branch
  on a fixed `tasks` collection (F67), so the kind is a registration Mantle seeds (the owner service, a title) and a
  branch on its own collection-id prefix in `get#DavCollections` and `get#DavObjects`, with `readOnly` set, which
  the DAV server already enforces before the adapter; no Rust. Team absence is the first; published shifts (P14), my
  interviews (P16), Maintenance's two collections (impl-maintenance P19) and Marketing's campaign calendar
  (impl-marketing P21) register the same way.
- **Screens:** LeaveRequests (with RequestLeave), LeaveRequestDetail (the decision notice and the balance
  statement of design §15), TeamCalendar; SelfService's and MyTeam's leave cards; quick create "Request leave";
  the palette's own leave requests, the LeaveRequest `record-lookup`, the Today source "leave starting for my
  team"; the `people-leave-balance` skill and "Explain my balance" prompt.
- **Specs:** framework `AiOptOut` (an opted-out field's text reaches no model tool); Mantle
  `test/humanres/LeaveRequests` (two requests on one day; an approval that would overspend refused; cancel reverses
  once; a blocked day refused); BOSS `PeopleLeave` (LeaveRequestDetail's one qvt render; the calendar shows no
  reason).
- **Usable when** (`acceptance/People/PeopleLeaveUsable`; design §14.3 "Partial-day leave and simultaneous
  requests"): an employee requests a morning and an afternoon on one day from their phone; their manager approves
  from Approvals; the team calendar and Projects' capacity show the absence without its reason; cancelling restores
  the balance.

**Built Nov 11 (P12).** mr-moqui 798fe1fd (framework part, branch `ppl/p12`), mr-mantle and mr-boss (branch `ppl/p12`).
- Checked first (the code over the plan): P11's Built and Review notes (`Leave.js`, its ledger with unique source keys, `lockEmployment`,
  `get#MyBalances` the self-scope tool, `overlappingRequests` and `pending` left for P12, `find#Ledger` showing HR's allocation
  reasons, F202); P9's `Schedules.js` exports (`scheduledDays` by party, primary assignments, and `holidaysOf` by calendar) and
  capacity's own reading of WetTimeOff (an all-day event the day, a timed one its hours, `ResourceServices.get#PartyCapacity`); P5's
  approval kinds (`Approvals.js` `kinds`, `request`, `sourceSummary`, `sourceChanged`, `record#Decision` at the source's revision,
  the topic's approve and refuse services through `decide#NotificationMessage`, `waitingFor` read from notices) and P6's decide
  pattern (`decide#EmploymentChange`); F22 and F67 (`CalendarDavServices`: four services branching on a fixed `tasks` collection, the
  DAV server refusing a read-only collection before the adapter); `store#WorkEffortReminders` (the caller's own reminders only, so an
  approver cannot set the person's); Manufacturing's ResourceCalendar (Commons' `Calendar.qvue` in its read-only resource mode, the
  pattern TeamCalendar follows); the time area's grants (P10's inheritable ALLOW for self-service; P11's denials of HR's editors);
  §5 Q8 (legacy `EmploymentLeave` read only).
- Framework (mr-moqui 798fe1fd, PE-21, F24): `ai-opt-out="true"` on a form field, `section`, `section-iterate`, `screen` and an entity
  field (xml-form-3, xml-screen-3, entity-definition-3). An agent's render (`RenderOrigin::Agent`: the Assist screen sessions, the data
  tool's screen lists, the canvas read proxy; `agent-apps`; `sri.isAgentRender()`, also inside a render one of these started) writes
  "Not shared with AI" in place of an opted-out field's value (a form field as a display, a list cell, a board or calendar card's
  field), posts no hidden value of it, has no find field for it and runs nothing of an opted-out section or screen (`ScreenTui.js`);
  `data` names a list's opted-out fields (`aiOff`) and refuses a `where` or `order` on one (`ai_opt_out`), and its entity reads never
  read, find or sort by an opted-out entity field; Update with AI (`propose#AiFieldValue`) refuses one before any model call and leaves
  opted-out fields out of the record it sends and of an approval's snapshot. In the browser the qvt and server-static qvt macros mark
  an opted-out field's box or list cell (`data-ai-opt-out="field"`, `data-ai-field`) and wrap a section or screen in a
  `display: contents` div; `m-rich-text` offers no text actions inside one (or with its `ai-opt-out` prop), the drawer leaves those
  fields out of its page state and never fills them, and it does not dictate on an opted-out screen. `makeTest().agent()` renders as
  an agent's screen session. docs/ai/Assist.md "AI opt-out", the JS-* references, `moqui-host.d.ts`, the gallery's
  `textRichPrivate`, Remaining-Work's row built; not built: routing to a local model.
- Mantle:
  - `entity/PeopleLeaveEntities.xml`: `LeaveRequest` (its own id; the employment, person, employer, department on the first day,
    leave type, policy, unit; `LeaveRequestStatus` waiting, approved, refused, withdrawn, cancellation asked, cancelled; first and last
    day; what it charges; the person's `reason`, `ai-opt-out`; `overrideBlocked`; the consumption and reversal entries; an operation
    key) and `LeaveRequestSegment` (days, a whole day or the morning or afternoon of one day, `LeaveDayPart`; its projection's work
    effort); `PakLeave` in `PeopleApprovalKind`; the `PeopleLeaveApproval` topic (approve and refuse services, its title naming the
    person and days, never the type or reason) and `PeopleLeaveDecision` (the person's decision notice); `CalendarProjection`
    (mantle.work.calendar, the projected CalDAV kind) seeded with Team absence;
  - `LeaveServices` over `Leave.js`: `preview#Request` (the employment's schedule days by `scheduledDays`, none: Monday to Friday 8
    hours; holidays of the schedule's calendar and the employer's WepHoliday rows; a whole working day 1 day or its hours, a half day
    half; the balance (every posted entry), the other requests waiting, available and left; blocked and mandatory days of the employer,
    its department or a unit above it and the type; the approvers by `Approvals.js previewRoute`; problems `NO_POLICY`,
    `NOTHING_CHARGED`, `BALANCE_INSUFFICIENT` (a policy needing an entitlement, below the negative limit), `OVERLAP` (another request of
    the person holding the day and part), `BLOCKED_DAY`, `DATE_OUTSIDE`, `NO_APPROVER`; warnings `BLOCKED_OVERRIDABLE`, `MANDATORY_DAYS`,
    `EVIDENCE_REQUIRED`), `submit#Request` (assessed again under the employment's lock; the person, or an HR editor for an employee;
    a People approval of `PakLeave` with no justification; an operation key's retry answers the first), `get#Request` (the person,
    who asked, HR, the manager at the employer and the approvers; the days, the balance statement, blocks, the approval, the decision
    notice, the reason only to the person, who asked, the approvers and HR, what the caller may do), `decide#Request` (approve and
    refuse through `record#Decision`; the last approval recounts, checks overlaps and the balance with the other reservations and posts
    the leave taken once, `leave:<id>`, only when the policy needs an entitlement, then projects it: one "Out of office" WetTimeOff
    work effort a segment, all day for whole days, 08:00 or 13:00 for half the day's hours for a half day, with a reminder a day
    before for the person; withdraw by the person or who asked; cancel: the person asks it of approved leave, decided by the same
    route, an HR editor cancels at once with a reason; a cancellation reverses once, `leave-reversal:<id>`, and cancels the
    projection; the person and who asked are told by `PeopleLeaveDecision`), `approve#Request` and `refuse#Request` (the topic's),
    `find#Requests` (own, a manager's reports', those the user decides, an HR reader's employers'; never a reason), `get#TeamAbsences`
    and `get#AbsenceProjection` (approved leave of the people the user sees, "{person} · Out", never the type or reason);
    `get#Balances` reads pending from the requests waiting; `store#BlockedInterval` answers `overlappingRequests`; `find#Ledger`
    names a taken or reversed leave by its days and gives an allocation's or adjustment's reason to HR alone (F202, decided here:
    HR's working note, not the employee's to read);
  - `CalendarDavServices`: `define#ProjectionOwner`, `get#ProjectionObjects`, and `get#DavCollections` and `get#DavObjects` listing and
    answering `projected-{projectionId}` (VEVENT, read only) for a user its owner admits; `put#` and `delete#DavObject` refuse it (403).
    No Rust.
- BOSS:
  - `People/Time/LeaveRequests` (menu 4, key `g l`; Mine, To decide, All I see; Request leave in two steps, the terms then the preview
    with the reason, never in the URL, and Request leave), `Time/LeaveRequestDetail` (the record header; the decision notice; Request
    and balance; the reason in a section and field opted out of AI; the approval; Approve the primary and Refuse, Withdraw, Ask to
    cancel, Cancel leave by what the user may do), `Time/TeamCalendar` with `TeamCalendarTui` (Commons' calendar, read only, over
    `get#TeamAbsences`; an absence the user reads opens its request); all under the time area's grants (every People user, a
    self-service employee by BOSS_PPL_TIME), with no group of their own;
  - SelfService's Request leave and My leave requests (`find#Requests` added to BOSS_PPL_LEAVE_SELF), MyTeam's Who is out and a leave
    decision opening LeaveRequestDetail; Approvals lists `PeopleLeaveApproval`; People.xml's quick create `peopleRequestLeave`, the two
    topics, "Explain my balance" on LeaveRequestDetail and LeaveBalances; People.js: the links, the palette's own leave requests, the
    LeaveRequest record-lookup (person, days, charge, state), Today's leave starting for my team (a manager's reports, today or
    tomorrow), a leave decision's link; the self-service context's three leave links; the topics' links in BossSetupData; the skill
    `people-leave-balance` with the alias `leave` and three retrieval cases.
- Specs: framework `AiOptOut` (4 features, 0.1 s); Mantle `test/humanres/LeaveRequests` (5 features, stepwise, 2.0 s: 0.40, 0.50,
  0.38, 0.46, 0.30: a morning and an afternoon of one day, a second morning refused, a preview over the weekend and the employer's
  holiday; an approval the balance cannot hold with the other reservations refused and nothing recorded, the refusal freeing its
  reservation, an approval posting once with its projection and reminder; the reason read by the person, the approver and HR and
  absent from the list, the calendar, the projection, the CalDAV collection (read only, put refused) and the notices; a cancellation
  asked and approved reversing once and HR's at once; a blocked day refused, an overridable one a warning, the review list of a
  block); BOSS `test/People/PeopleLeave` (2 features, stepwise, 0.7 s: LeaveRequestDetail's one qvt render as the deciding manager
  and its agent render with "Not shared with AI" in place of the reason; the team calendar's events and Leave requests' list without
  the reason or type, and the employee told another's request is not available); PeopleAccess's menu and context features updated
  (the Time group's two new screens, the key `g l`, Request leave in quick create, the self-service context's leave links).
  Acceptance, written and not run: `acceptance/People/PeopleLeaveUsable` (3 features: Tomas asks a morning and an afternoon of one
  day at phone width through the preview and Request leave; Hannah approves both from Approvals; the team calendar shows both without
  the reason or type and capacity takes the day; Tomas cancels the afternoon, Hannah approves, the half day back once).
- Tests run (this worktree's Debug binary, `--debug --nobuild`, this phase's runtime): cargo tests of the framework's touched crates
  (moqui-core 1720, moqui-llm 339, moqui-db, moqui-entity, moqui-tools, moqui-devkit; goldens reviewed); framework AiOptOut 4 of 4,
  WebrootAssist 58 of 58, WebrootVue.qvt 36 of 36; Mantle LeaveRequests, LeaveLedger, PeopleApprovals, PeopleChecklists, WorkResources
  and PeopleSchedules 27 of 27 then 18 of 18 after formatting; BOSS PeopleAccess, PeopleSelfService, PeopleApprovals, PeopleTime,
  PeopleSchedules, PeopleEmployees and PeopleLeave 40 of 40 (mr-boss 15.4 s of features), then PeopleLeave, PeopleAccess and
  PeopleSelfService 24 of 24 after formatting (PeopleAccess ran 33.8 s, over 15 s, with the machine at a load average of 40 to 46
  from other builds; 148 s for its 17 features alone at that load, 4.4 s its longest); skill retrieval recall@3 1.00 (27 of 27);
  `moqui lint --screens`: 135 flagged sites as before, none in the screens P12 touched, no TUI worklist entry. Prettier clean on the
  changed JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- Inventories: usl-inventory's People Added rows (P1 to P12: the leave request services); ss-inventory's P12 note.
- Design edits: design-people (header; §1.4 Today, Quick create, Palette, Comms hooks; §3 MyTeam and SelfService; §7 LeaveRequests
  and LeaveRequestDetail as built; §13 TeamCalendar as built; PE-21 as built); design-crosscut CX-SYNC (the projected kind as built).
- Findings, numbered by the lead F206 to F215 in order:
  - a request's supporting file is not built: there is no LeaveRequest content host (PE-01 Y9), so a policy needing evidence is a
    warning to give it to HR;
  - Leave requests asks one segment at a time (`submit#Request` takes several), so a morning and an afternoon of a day are two
    requests, as design §14.3 wants;
  - with no working schedule a day is a standard Monday-to-Friday 8-hour day, not the timesheet policy's week; holidays are the
    schedule calendar's and the employer's own WepHoliday rows;
  - the leave taken is posted only when the policy needs an entitlement (`allocationRequired`); unpaid or sick leave under a policy
    without it is approved and projected with no ledger entry; the balance checked is every posted entry (an accrual dated later
    counts), less the other requests waiting;
  - a half day is projected at 08:00 or 13:00 for half the day's planned hours (the schedule's own interval times are not read), so
    capacity takes the right hours but the calendar's times are nominal;
  - the leave-start reminder is written directly for the person (a day before, by notification): `store#WorkEffortReminders` sets
    only the caller's own;
  - the team calendar shows the user's own leave, a manager's reports' and an HR reader's employers'; an employee sees no colleague's
    absence (no team scope beyond a manager's lines), waiting requests are not shown, and its `.ics` export is not built;
  - To decide reads the user's notices (`Approvals.js waitingFor`): a request whose step no one may decide is in no one's list (it
    cannot be made: `NO_APPROVER` refuses it, but a route can lose its approver later);
  - a cancellation after payroll finalization, the paid and unpaid payroll inputs, and Employee360's TimeAndLeave are not built (P24,
    P26 and later);
  - F202 decided: an allocation's and an adjustment's reason is HR's working note; `find#Ledger` gives it to HR of the employer alone;
  - the framework part's own: a service tool's result, the search index, a `section-include` of an opted-out section and a `screen`
    `go` query's find parameter are not covered by the opt-out (docs/ai/Assist.md); a canvas reads as the agent and shows the
    placeholder too.
- For the lead:
  - budget share: framework about 0.1 s (AiOptOut); mr-mantle about 2.0 s (LeaveRequests); mr-boss about 0.7 s (PeopleLeave), the
    PeopleAccess features' times unchanged in kind (two menu and context lists longer); the client walk unchanged. PeopleAccess as a
    whole should be timed again on a quiet machine: it passed 15 s under this run's load;
  - merge hot spots: mr-mantle `Leave.js` (the P12 block before `operations`, the balance rows' pending, `sourceText` and
    `findLedger`'s HR reasons, `storeBlockedInterval`'s `overlappingRequests`), `LeaveServices.xml` (the header and the services
    appended), `PeopleLeaveEntities.xml` (the two entities appended), `Approvals.js` (the `PakLeave` kind and `previewRoute`),
    `PeopleApprovalEntities.xml` (the kind), `data/PeopleApprovalSetupData.xml` (the topic before the P6 job comment),
    `data/PeopleLeaveSetupData.xml`, `CalendarDavServices.xml`, `WorkEffortEntities.xml` (CalendarProjection after
    CalendarWorkEffort); mr-boss `data/BossSetupData.xml` (BOSS_PPL_LEAVE_SELF's added service and the P12 block appended at the end),
    `screen/People.xml` (the header, the key `g l`, the shell providers appended), `People.js` (linkPaths, the self-service links,
    searchFinds, lookup, today, selfServiceContext), `ContextServices.xml`, `screen/Shared/PeopleSelfService.xml`, `screen/People/MyTeam.xml`,
    `screen/People/Approvals.xml`, `screen/People/Time.xml` (the header), `test/People/PeopleSpecLib.js` (the Time menus, keys,
    `reportEmploymentId`), `test/People/PeopleAccess.spec.js` (the self-service context's links, quick create), `skill/aliases.json`,
    `test/skill-retrieval.json`, the inventories, design-people (§1.4, §3, §7, §13, PE-21), design-crosscut CX-SYNC; mr-moqui the
    framework commit (the screen macros, `WebrootAssist.js`, `m-rich-text`, the data tool, `screen/definition.rs`, the shared golden
    fixtures);
  - the acceptance test to run with the full suites is PeopleLeaveUsable (new); the framework part adds no acceptance test;
  - for the user's call: F202 decided as above (HR's allocation reasons not shown to the employee); whether an employee should see
    their colleagues' absences on the team calendar (built: only a manager's reports and HR's employers').

**Review Nov 11 (P12).** A fresh review of `git diff master...ppl/p12` in mr-moqui (the framework part, PE-21), mr-mantle and mr-boss
against the phase's text, §2, §4, design §7 LeaveRequests and LeaveRequestDetail, §13 TeamCalendar, PE-21 and PE-24, with the
reason's confidentiality on every path, the opt-out's reach, the decide service's lock, consumption and reversal, and scope first;
the user's two calls of Nov 11 built or recorded in §4; fixes committed apart per repository ("People P12 review: …").
- Rebased first: master had moved in all three repositories (mr-moqui: Admin screens down's System and Dashboards screens, the Assist
  evaluation rounds, Terminal fixes; mr-boss and mr-mantle: Admin and Insights onto the framework's screens and registries). `ppl/p12`
  rebased onto master cleanly in each, with no conflict (the framework's P12 commit is 6773098c, the Built note's 798fe1fd; mr-mantle
  d9c2034e; mr-boss 00bd36d5), and the goldens needed nothing (the cargo tests pass on the rebased tree). The opt-out over the moved
  screens: System's and Dashboards' screens an agent reads render through the same tui agent render (`RenderOrigin::Agent`,
  `ScreenTui.js`), so a field, section or screen they mark is covered as any other; none is marked today. Master's agent changes (the
  data tool's whole-value hint and date spans, the screen session's closed-find and row opening) add no path around it: a find field
  of an opted-out column is still left out of the agent's render, and a row is found by the text the render shows.
- Checked and found sound:
  - The framework part is generic: the attribute, `agent_render()` (any agent frame on the render stack, so a render an agent's
    render starts is covered), the tui branches, the data tool's `aiOff` refusal and entity reads, `propose#AiFieldValue`'s refusal
    and the approval snapshot name no People record; the person's own tui render is unchanged (`$isAgent()` false) and their qvt
    render only gains the markers and a `display: contents` wrapper (WebrootVue.qvt passes); goldens reviewed (node literals with
    the attribute, the new branches).
  - The reason: `LeaveRequest.reason` is `ai-opt-out`; `get#Request` gives it to the person, who asked, HR of the employer and the
    approvers alone; no list (`find#Requests`), calendar, projection, CalDAV object, notice title or message, approval label, palette
    row, record-lookup card, Today item, MyTeam row or skill has it; LeaveRequestDetail's section and field are opted out; the
    agent render of PeopleLeave shows the placeholder.
  - Decide: every decision locks the employment first; the last approval recounts, checks overlaps and the balance with the other
    reservations and posts `leave:<id>` once (a refused check rolls the decision back with it); a cancellation reverses
    `leave-reversal:<id>` once and cancels the projection; Approvals' route excludes the person and the requester (no self-approval,
    an HR editor who asked for someone is not their approver); a blocked day is refused at submit and again at the last approval.
  - The projected calendar kind is generic: `CalendarProjection` names an owner service, `get#ProjectionObjects` calls it as the user
    and reads no owner record; put and delete answer 403 (after the DAV server's own read-only refusal).
  - Scope: `find#Requests` and the calendar reach the user's own, a manager's live reports at the line's employers and an HR
    reader's employers; a supplied person or employer only narrows; another employer's HR gets `RECORD_UNAVAILABLE`.
- Fixes:
  - **R1 (medium, AI opt-out).** An agent's screen session could read an opted-out column through the list's Text export: an export
    is the session's raw request (`lookups.raw`), rendered as the agent in the mode its URL names, and the text and csv macros have
    no opt-out branch; the tui session shows a text export's body as a dialog. An agent's render of a list with an `ai-opt-out` field
    now offers no export but Show all (`ScreenTui.js`); a navigation is always rendered in tui, so no other agent path asks another
    mode. Spec: AiOptOut's first feature (the agent's list has no exports, the person's has CSV and Text; failed on the code as
    rebased); docs/ai/Assist.md.
  - **R2 (medium, no self-approval).** An HR editor cancelled their own approved leave at once (their `hrEdit` kind on their own
    request), giving the days back with no one else deciding. HR cancels another person's leave at once, never their own, which
    they ask to cancel as anyone does (`canCancel` false). Spec: LeaveRequests' fourth feature (HR's own leave, approved by Max,
    refused `NOT_YOURS`).
  - **R3 (low, record).** HR's cancellation at once required a reason and kept none, and the person's decision notice then named the
    earlier approval's decider and date as who cancelled it. The request records who and why (`cancelledByUserId`, `cancelReason`)
    and the notice shows them. Spec: LeaveRequests' fourth feature (the notice names Leave HR and "Shop closed").
  - **R4 (low, scope).** `decide#Request`'s approve and refuse went to `record#Decision` with no read check, which told one who reads
    nothing of a request that it exists (`PERMISSION_DENIED`, `NOT_APPROVER`, `NOT_PENDING` against `RECORD_UNAVAILABLE` for a
    missing one). It is answered as missing first. Spec: LeaveRequests' second feature (an outsider on a real and a missing id).
  - **R5 (low, operations).** `submit#Request` looked its operation key up only before the employment's lock, so a retry waiting on
    the lock made a second request; it looks again under the lock (as `allocate#Leave` does). No spec: a race of two
    transactions.
  - The user's call 1 built: `get#TeamAbsences` and `get#AbsenceProjection` add an employee's colleagues (`colleaguesOf`: a current
    `PrtMember` of the same department or team, or a live line of the same manager, at an employer of both), their approved days
    alone, never openable; MyTeam's Who is out and Today's leave starting for my team keep to what they open (the reports, an HR
    reader's employers'), so a manager's own peers stay on the calendar only. Spec: LeaveRequests' third feature (Col by the manager
    and Tea by a team see Ana's approved morning, not her waiting afternoon, the type or the reason, and do not open it; Out sees
    nothing). The user's call 2 recorded, with LeaveLedger's fifth feature checking it (HR reads "First quarter", the person does
    not).
  - PeopleAccess timed on quiet runs (load 3 to 4): 9.5 s and 8.2 s of features with the Debug binary, under 15 s, so it is not
    split; the Built note's 33.8 s was the load.
- Findings, numbered by the lead F216 to F220 in order:
  - the opt-out's remaining gaps beside docs/ai/Assist.md's: a dynamic drop-down's options and a dialog body the agent's session
    looks up run as the agent but answer whatever their transition writes (a transition that names an opted-out field's text is not
    marked), and the canvas read proxy's transition reads answer service results as they are;
  - Approvals' `record#Decision` answers an outsider `NOT_APPROVER` or `NOT_PENDING` for every kind (P5's), telling them a request
    exists; R4 closes it for leave only;
  - a blocked interval added after a request was made refuses that request's last approval (`BLOCKED_DAY`), with no override
    (`store#BlockedInterval` lists it for review); HR withdraws or the person does;
  - HR's cancellation reason is told to the person (as a refusal's is); a manager also sees their own colleagues' days on the
    team calendar, as an employee;
  - the worker's findings stand otherwise.
- Tests (this worktree's Debug binary, `--debug --nobuild`, this phase's runtime): cargo tests of moqui-core (1761), moqui-llm (344),
  moqui-db, moqui-entity, moqui-tools and moqui-devkit, all passing, no golden changed; framework AiOptOut 4 of 4 (0.2 s; its new
  check failed on the code as rebased); WebrootAssist and WebrootVue.qvt 94 of 94 (offline, 15.2 s); Mantle LeaveRequests,
  LeaveLedger, PeopleApprovals, PeopleSchedules, PeopleChecklists, WorkResources and Dav 40 of 40 (LeaveRequests 2.6 s, LeaveLedger
  2.8 s); BOSS PeopleLeave, PeopleAccess, PeopleSelfService, PeopleApprovals, PeopleTime, PeopleSchedules and PeopleEmployees 40 of
  40 (15.3 s then 13.0 s of features; PeopleAccess 8.2 s). The new checks fail on the code as rebased (each run against the phase's
  Leave.js: R2's on HR's own cancel, R3's on the notice naming Leave MAX, R4's on `PERMISSION_DENIED`, F202's on the person reading
  the reason, the colleague's on an empty calendar). `moqui lint --screens`: 135 flagged sites as
  before, none in People. Prettier clean on the changed Mantle and BOSS JavaScript. Not run: `./moq test-apps`,
  `./moq test-framework`, the acceptance suite.
- For the lead:
  - budget share: framework unchanged (AiOptOut 0.2 s); mr-mantle about +0.6 s over the Built note (LeaveRequests 2.6 s with the
    colleagues and HR's own leave, LeaveLedger's F202 check); mr-boss unchanged;
  - the rebase rewrote the phase commits (mr-moqui 6773098c, mr-mantle d9c2034e, mr-boss 00bd36d5); the review commits are mr-moqui
    ea6b53ee, mr-mantle b057d0df, mr-boss 0da5fad4;
  - merge hot spots beside the Built note's: mr-moqui `ScreenTui.js` (`exportsOff` in the form-list's exports block); mr-mantle
    `Leave.js` (`colleaguesOf` before `absences`, `submitRequest`, `getRequest`'s notice, `decideRequest`, `cancelTaken`),
    `PeopleLeaveEntities.xml` (LeaveRequest's two fields); mr-boss `People.js` (`today`), `MyTeam.xml`;
  - the user's two calls of Nov 11 are in §4 (the colleagues' days built, F202 as built); nothing waits on the user.

### P13 — Attendance and time import

Design §6 (attendance), Attendance, TimeImport, SelfService's Clock; PE-05 (without the kiosk), PE-19.

- **Mantle** AttendancePunch (raw, immutable, with source and external key), AttendanceDay and corrections, and
  `mantle.humanres.AttendanceServices`: `record#Punch` (self, online, the worker from the session and never a
  parameter), `find#Attendance`, `request#Correction`, `decide#Correction` on `PeopleAttendanceApproval`,
  `preview#Import` and `import#Records` (each row its own transaction, known source keys skipped).
- **The time-and-attendance import target** (owner contract): TimeImport keeps its wizard and registers as a
  `wizard` target with its `findService`, as Accounting's statement imports do (mr-mantle
  data/AccountingSetupData.xml:33-38), so Admin's Imports lists its batches. Like them it names no Admin
  permission; its import permission is `PEOPLE_IMPORT`, which `preview#Import` and `import#Records` check beside
  People's own permission and scope, and its `findService` answers by People's view permission and scope (§4).
- **Screens:** Attendance (AttendanceDays, CorrectAttendance, AttendanceDecision, the attendance export of design
  §15), TimeImport, SelfService's Clock and quick create "Clock in" where the employment has clocking on.
- **Specs:** Mantle `test/humanres/Attendance` (a duplicate source key ignored; a missing out-punch flagged; a
  correction keeps the raw punches; an overnight shift on its start day); BOSS `PeopleAttendance`.
- **Usable when** (`acceptance/People/PeopleAttendanceUsable`; design §14.3 "Attendance, timesheets and DST", its
  evidence half): an employee clocks in and out from SelfService; a missed punch is corrected and approved by the
  manager; a device file imported twice adds its rows once and names the bad one.

**Built Nov 11 (P13).** mr-mantle 4d67437a, mr-boss (branch `ppl/p13`).
- Checked first (the code over the plan): P5's approval kinds and `record#Decision` (a kind with its topic, `describe`, the request
  at the source's revision; the topic's approve and refuse services through `decide#NotificationMessage`), P12's decide pattern
  (`decide#Request`: answered as missing before `record#Decision`, under the employment's lock) and its `waitingFor` To decide; P9's
  schedules (the zone is the schedule's, a primary assignment's `workingScheduleId`; `Schedules.js` exports no zone helper, so
  `Attendance.js` reads the assignment and schedule itself); P10's time area grants (BOSS_PPL_TIME's inheritable ALLOW opens Time's
  screens to a self-service employee; SelfService's own grant is non-inheritable, so its transitions and services need their own);
  the framework's transfer imports (a `wizard` target is listed only, `find#Transfers` skips it for a caller without its
  `viewPermission`, the `runs` contract `targetId`, `scopeKey`, `fromDate`, `thruDate`, `maxRows` answering `runList`;
  `DataTransferLib.parseDelimited` the bounded reader) and Accounting's statement imports (their own batch, `find#StatementImportRuns`);
  the shell's quick create (offered by the screen's grant alone, `shell.rs link_entry`: no condition; the first finding) and Commons' root
  declaring People's Today source for a self-service employee (F64). No clocking setting existed (design §12's PeoplePreferences is
  P29's).
- Mantle:
  - `entity/PeopleAttendanceEntities.xml`: `AttendancePunch` (an employment's raw event: `AttendanceDirection` in or out, the instant,
    the zone it was read in and its local time as given, `AttendanceSource` self-service, imported or kiosk, the source system and its
    event key, a unique `sourceKey`, the import, the work location of the assignment, who recorded it; never changed or deleted),
    `AttendanceDay` (one an employment and day, in the zone of the working schedule, else the recorder's: first in, last out, count,
    the minutes between paired punches, `flagsText` MISSING_OUT, MISSING_IN, REPEATED, `AttendanceDayStatus` recorded, correction asked,
    corrected, and the approved correction in effect), `AttendanceCorrection` with `AttendanceCorrectionInterval` (the intervals and
    minutes of a day, the reason, `AttendanceCorrectionStatus`), `AttendanceImport` and `AttendanceImportRow` (a file's employer,
    source system, zone, worker naming and columns; each row's values, what it resolved to and its outcome); `PakAttendance` in
    `PeopleApprovalKind`; `Employment.clockingEnabled` (audit-logged);
  - `AttendanceServices` over `Attendance.js`: `record#Punch` (PEOPLE_SELF_SERVICE: the session's worker, never a parameter, the
    server's time, the employment only chosen among the caller's own current ones and one with clocking on, `CLOCKING_OFF`,
    `EMPLOYMENT_REQUIRED`, `ALREADY_IN`, `NOT_IN`; an operation key's retry answers the first punch, checked again under the employment's
    lock), `get#MyClock` (no party: each own employment's clocking, state, last punch, today's time and the action), `store#Clocking`
    and `find#Clocking` (an HR editor turns it on or off with a reason; who clocks, for an HR reader), `find#Attendance` (own, a manager's
    reports' at the line's employers, an HR reader's employers', or toDecide from the user's notices; a person, an employer, days,
    exceptionsOnly; paged in the query, an export up to 5000), `get#Day` (the punches, the corrections with their approval, canCorrect,
    canDecide, canWithdraw), `request#Correction` (the person, their manager or an HR editor; intervals as times of the day, a To at or
    before the From the next day, at most a day; a day with no punch by employment and date; `REASON_REQUIRED`, `DATE_FUTURE`,
    `DATE_OUTSIDE`, `TIME_INVALID`, `INTERVALS_OVERLAP`, `CORRECTION_PENDING`; a People approval of kind PakAttendance, the person's
    manager by default), `decide#Correction` (approve and refuse through `record#Decision`, the last approval making it the day's time,
    the punches unchanged; withdraw by the person or who asked; answered as missing for one who reads nothing of it) with
    `approve#Correction` and `refuse#Correction`, `preview#Import` (PEOPLE_IMPORT, PEOPLE_HR_VIEW and PEOPLE_HR_EDIT of the employer;
    the framework's `parseDelimited`, 5000 rows and 1 MiB; a worker by People id or work email, `EmailWork`; each row resolved to the
    worker's one employment by the employer at that instant and its source key, the employer, source system and event id or else the
    worker, instant and direction: ready, known, duplicate or refused with `WORKER_UNKNOWN`, `WORKER_AMBIGUOUS`, `NOT_EMPLOYED`,
    `EMPLOYMENT_AMBIGUOUS`, `TIME_INVALID`, `TIME_FUTURE`, `DIRECTION_INVALID`, `ROW_INVALID`; nothing recorded), `import#Records` (the
    batch locked; ready rows in time order by employment, each in its own transaction, a key recorded meanwhile skipped, a failure
    named and the rest going on; an import done answers as it ended), `get#Import` (an HR reader of the employer; all rows, an outcome
    or the problems) and `find#ImportRuns` (the `runs` contract: an HR reader's employers' imports with `ownerParameters`);
  - `data/PeopleAttendanceSetupData.xml`: the `PeopleAttendanceApproval` topic (approve and refuse services, a title naming the person,
    the day and the hours, never the reason), the `wizard` target `timeAndAttendance` (`importPermission` PEOPLE_IMPORT,
    `viewPermission` PEOPLE_HR_VIEW, no ADMIN_* permission, owner route `peopleTimeImport`) and `find#ImportRuns` granted to every user
    (it checks PEOPLE_HR_VIEW and the scope itself, as the employees target's row services).
- BOSS:
  - `People/Time/Attendance` (menu 8, key `g d`; Mine, To decide, All I see, Missing punches only, the list's CSV export; a day opened
    above the list with its punches and corrections; Correct, the primary while no correction waits; Approve and Refuse for an approver,
    Withdraw; Approve selected on To decide; Correct a missed day; HR's Who clocks with Turn clocking on and Turn off), `Time/TimeImport`
    (out of the menu: FileAndMapping, the file or pasted rows; ImportResults with Import, all rows or the problems and their CSV),
    `Time/Clock` (out of the menu: the quick create's screen, the user's own clock or why there is none) and `template/PeopleClock.xml`
    (the clock section and its transition); all under the time area's grants, Time import HR's (`BOSS_PPL_TIME_IMPORT`: ALWAYS HR, DENY
    the root user group and self-service);
  - SelfService: the Clock where an employment has clocking on, then the page's primary (Open my employee record a plain button), and
    My attendance; `BOSS_PPL_CLOCK_SELF` (the clock transition, `get#MyClock` and `record#Punch`, non-inheritable, for the self-service
    employee); `get#SelfServiceContext`'s `attendanceUrl`; the self-service context's Attendance and Clock links;
  - the quick create Clock in (`peopleClockIn`) on Commons' root (owner contract, as F64's Today source); People's root: the key `g d`
    and the attendance topic; Approvals lists `PeopleAttendanceApproval`, whose link opens the day on Attendance; People.js: the link
    paths, the decision link to Attendance's To decide; Admin's mount route `peopleTimeImport` (owner contract with Admin);
  - demo: clocking on for Tomas (people.employee); no punch is seeded.
- Specs: Mantle `test/humanres/Attendance` (5 features, stepwise, 1.4 s: 0.34, 0.07, 0.44, 0.36, 0.15: a file imported twice records its
  rows once, a row repeated in the file skipped, the unknown worker and a bad direction named, the import retried answering as it
  ended, an in-punch with no out flagged and the only exception, the runs listed; an overnight shift 22:00 to 06:15 one day of 495
  minutes on its start day; a correction asked by the person with two intervals, its retry answering the first, a second one
  refused while it waits, the person refused `SELF_APPROVAL`, another employer's HR refused the day and the decision as missing, the
  manager's To decide, a refusal without a reason refused, the approval correcting the day to 7:30 with its one raw punch kept; the
  self-service clock refused with clocking off and for another's employment, HR turning it on and a manager refused, in, a retry,
  in again refused, the clock's state, out, out again refused; an import refused without PEOPLE_IMPORT and for another employer, whose
  runs show none). BOSS `test/People/PeopleAttendance` (3 features, stepwise, 0.4 s: Attendance's one qvt render as the manager with
  Tomas's imported day open, its punch, what is missing, his correction and Approve, approved from her notice through the tray's
  approve service, the notice's title without the reason; Time import's one html render as HR with the problem rows; Admin's
  Imports (the framework's `find#ImportRuns`) listing the run with `peopleTimeImport`; the employee's shell offering Clock in from
  Commons, Clock's one html render as the employee, the reader's `get#MyClock` with no clocking). PeopleAccess gains one feature
  (0.35 s: the employee clocking in and out through SelfService's transition under Commons by its own grant, the reader refused
  `record#Punch` with the same parameters; Time import opened by HR and refused to the reader, the manager and the employee, the
  reader refused `preview#Import` with the parameters HR is answered, Services' employer refused to Retail's HR) and its context
  feature the employee's Attendance and Clock links; PeopleSpecLib's Time menus and keys; PeopleSelfService's SelfService render
  checks the clock and My attendance. Acceptance, written and not run: `acceptance/People/PeopleAttendanceUsable` (3 features: Tomas
  clocks in and out from SelfService at phone width and his attendance shows the day; a door file has his in-punch of a past day with
  no out, his attendance names it, he asks a correction through Attendance and Hannah approves it from Approvals, the punch kept; a
  device file imported twice through Time import adds its rows once and names the bad one).
- Tests run (release binary, `--nobuild`, this phase's runtime): Mantle Attendance, PeopleApprovals, LeaveRequests, PeopleScope,
  HumanResServices and PeopleEmployment 38 of 38 (mr-mantle 11.0 s of features), then Attendance, PeopleApprovals, LeaveRequests and
  HumanResServices 26 of 26 after formatting; BOSS PeopleAttendance, PeopleAccess, PeopleSelfService, PeopleApprovals, PeopleLeave,
  PeopleTime, AdminImports and TodayPanel 48 of 48 (mr-boss 12.2 s of features), then PeopleAttendance, PeopleAccess (18 of 18), PeopleSelfService, PeopleApprovals,
  PeopleLeave, PeopleTime, AdminImports, QuickCreate and PeopleEmployees 67 of 67 after formatting (mr-boss 11.8 s). `moqui lint --screens`: 135 flagged
  sites as before, none in the screens P13 touched, no TUI worklist entry. Prettier clean on the new and changed JavaScript. Not
  run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added rows (the AttendanceServices) and `import#TimeEntryCsv`'s note; ss-inventory's P13 note
  (no baseline form is mapped; PartyTimeEntries' ClockInForm stays Projects' and blank).
- Design edits: design-people (header; §1.2 Time & leave; §1.4 Quick create; §3 SelfService; §6 Attendance and TimeImport as
  built); design-admin §11.1 (the time-and-attendance target as built); design-drawers-commons §1.5 (People's Clock in on Commons'
  root).
- Findings, numbered by the lead F221 to F230 in order:
  - the quick create Clock in is offered to every user the time area opens to, clocking on or not: the shell offers a quick create by
    its screen's grant alone (`shell.rs link_entry`), so "only where the employment has clocking on" holds for SelfService's clock and
    not for the + menu, whose Clock screen says clocking is not on; a condition on a quick create (a provider service or a condition
    the shell evaluates) is a framework ask;
  - Clock in is declared on Commons' root, not People's (a self-service employee, the one who clocks, opens no People root; one
    declaration avoids a People user's second entry);
  - clocking is a flag of the employment (`Employment.clockingEnabled`, audit-logged), not a dated term of the assignment nor an
    employer policy; design §12 PeoplePreferences' clocking and attendance zone policy are P29's;
  - a day's zone is the employment's working schedule's at the punch, else the recorder's (the user's for a self punch, the file's for
    an import); an out-punch joins the employment's punch just before it within a day when that is an in-punch, so punches imported out
    of order across files are attributed as they arrive (within a file they are recorded in time order by employment);
  - a day flags a missing out-punch (shown as clocked in while the in is under 16 hours old), an out with no in, and a repeated punch;
    overlapping intervals of one person's two employments are not flagged, and employment ambiguity is an import refusal
    (`EMPLOYMENT_AMBIGUOUS`), not a day's flag;
  - a day is not approved as a whole: an uncorrected day stays Recorded and a correction approved makes it Corrected; what P24 counts as
    approved attendance (corrected, or past and unflagged) is P24's to decide;
  - the person is not told a correction's decision (no decision topic as leave has; they see the day's state), and a correction a
    manager asks for their report goes to the alternate or HR fallback, else waits (the requester never decides);
  - an import names workers by People id or work email only (badge or device ids are P30's); a preview is a new batch each time
    (it records no punch; no operation key), and import batches are kept with no retention;
  - To decide reads the user's notices (`Approvals.js waitingFor`), as leave: a correction whose step no one may decide is in no one's
    list;
  - the form's file field cannot be posted by a spec's render, so TimeImport also takes the rows pasted (the acceptance posts them).
- For the lead:
  - budget share: mr-mantle about 1.4 s (Attendance); mr-boss about 0.8 s (PeopleAttendance 0.4 s, PeopleAccess's new feature 0.35 s,
    PeopleSelfService's checks on its one render); the client walk unchanged;
  - merge hot spots: mr-mantle `Approvals.js` (the `ATTENDANCE_CORRECTION` constant and `PakAttendance` after `PakLeave` in `kinds`),
    `PeopleApprovalEntities.xml` (the kind), `HumanResourcesEntities.xml` (Employment's field); mr-boss `data/BossSetupData.xml` (the P13
    block appended at the end), `BossPeopleDemoData.xml` (appended), `screen/People.xml` (the header, the key `g d`, the topic),
    `screen/Commons.xml` (the quick create), `screen/People/Approvals.xml`, `screen/People/Time.xml` (the header),
    `screen/Shared/PeopleSelfService.xml`, `People.js` (linkPaths, the self-service links, `decisionUrl`, `selfServiceContext`),
    `ContextServices.xml`, `Admin.js` (`mountRoutes`), `test/People/PeopleSpecLib.js` (the Time menus, keys, ids),
    `PeopleAccess.spec.js` (the context's links, the appended feature), `PeopleSelfService.spec.js`, the inventories, design-people
    (header, §1.2, §1.4, §3, §6), design-admin §11.1, design-drawers-commons §1.5;
  - acceptance to run with the full suites: PeopleAttendanceUsable (new);
  - for the user's call: whether the + menu's Clock in may show to users without clocking until the shell can condition a quick
    create (a framework ask), and whether clocking stays a per-employment flag or becomes an employer setting with per-employment
    exceptions (P29).

**Review Nov 12 (P13).** A fresh review of `git diff master...ppl/p13` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §6 Attendance and TimeImport, §3 SelfService's Clock and §1.4, and design-admin §11.1, with the clock's worker and time, the
raw punches, the import's transactions and the target's permissions against the framework's current
`org.moqui.admin.DataTransferServices` first; the user's two calls of Nov 12 built and recorded in §4 (a framework change in a fresh
mr-moqui worktree on `ppl/p13`); fixes committed apart per repository ("People P13 review: …"). The branches were on master's tips
(mr-moqui d37d29df, mr-mantle and mr-boss as merged after P12), so nothing was rebased.
- Checked and found sound:
  - `record#Punch`: the worker is the session's (`scopeOf().employments`, the session's party's own); `partyRelationshipId` only
    chooses among those (another, or a forged one, is `RECORD_UNAVAILABLE`), the time is `ec.user.nowTimestamp` (no request sets an
    effective time), clocking on is checked again under the employment's lock with the operation key, in twice or out while out
    refused. `BOSS_PPL_CLOCK_SELF` opens the clock transition and the two services that take no party, non-inheritable, and nothing
    else.
  - Punches are only created (no update or delete path in the services); a correction is its own record and the day's minutes
    become its approved one's with every punch kept; a known source key answers the first (self: the user's operation key; import:
    the employer, source system and event key, else the worker, instant and direction), looked up again inside each row's
    transaction; an out-punch joins the in-punch before it within a day, so a night shift is its start day's.
  - Import: `preview#Import` and `import#Records` check `PEOPLE_IMPORT`, `PEOPLE_HR_VIEW`, `PEOPLE_HR_EDIT` and the employer; each ready
    row runs in `runRequireNew` with its failure named on the row and the rest going on; the batch is locked and a finished import
    answers as it ended. `AttendancePunch` has no foreign key to the locked `AttendanceImport`, so a row's transaction does not wait
    on the batch's lock. The target against the framework's `DataTransferImports.js`: a `wizard` target is listed only (never
    dispatched), `find#Transfers` skips it for a reader without its `viewPermission` and calls its `findService` as the reader
    (`find#ImportRuns`, granted to every user, answers only an HR reader's employers, a `scopeKey` narrowing them); its permissions
    are comma lists all of which are required (`holdsAll`).
  - Corrections: `record#Decision` excludes the person and the requester (`SELF_APPROVAL`), checks the step's approvers and the
    correction's revision (a withdrawal supersedes the approval); `decide#Correction` answers one who reads nothing of it as missing
    before `record#Decision` (P12's R4 applied from the start) and locks the employment; the notice names the person, day and hours,
    never the reason.
  - Scope: `find#Attendance` reaches the user's own days, a manager's live reports at the line's employers and an HR reader's
    employers', a supplied person or employer only narrowing; `get#Day` the same plus an approver of its correction;
    `request#Correction` the person, their manager or an HR editor; another employer's HR is refused the day and the decision.
- Fixes:
  - **R1 (the user's call 1, framework).** A quick create can carry a condition the shell checks: `quick-create`'s
    `condition-service` (xml-screen-3.xsd, with its documentation), a service implementing the new interface
    `org.moqui.ui.ShellServices.offer#QuickCreate` that the shell (`screen/shell.rs` `Shell::offered`, from `link_entry`) calls as the
    app root that declares the kind (`run_in_app`: its authorization and entity filters), in a transaction of its own, with `kind`;
    `offer` true offers the kind, and false, no answer, or a service that fails or is missing leaves out that kind alone, logged with
    the app, kind and service. Every client reads the server's shell data, so the browser, terminal and desktop shells follow with no
    change of their own. Style-guide §8.1 for an attribute that renders nothing: the XSD, docs/ui/Qvt-Client.md "Shell data and
    providers", the gallery's `galleryTask` (offered unless the user's preference `GALLERY_QUICK_TASK` is N,
    `example.ExampleServices.offer#GalleryQuickCreate`), cargo's `a_quick_create_with_a_condition_is_offered_only_where_its_service_says_so_and_a_failing_one_hides_only_itself`
    and the framework spec `ShellQuickCreate` (a spec-local user who opens the gallery alone; fails on master's binary). People's
    Clock in names `mantle.humanres.AttendanceServices.get#ClockOffer` (whether the caller clocks for a current employment of their
    own; it reads only those), so the + menu offers it only to someone who clocks. Spec: PeopleAttendance's third feature (the
    employee offered, the reader not; fails on master's framework).
  - **R2 (the user's call 2).** Clocking is an employer's default with per-employment exceptions: the employer's `PartySetting`
    `PeopleClocking` (its `PartySettingType` seeded in `PeopleAttendanceEntities.xml`; Y on, none or N off) unless
    `Employment.clockingEnabled` says Y or N (empty follows the employer). `Attendance.js isClockingOn` (exported with the module) is
    the one rule `record#Punch`, `get#MyClock`, `find#Clocking` and `get#ClockOffer` read; `store#Clocking` takes Y, N or empty and
    answers the effective clocking, the employment's own setting and the employer's default; `find#Clocking` lists the employments
    that clock and those set apart, each with how ("Employer's default", "On for this employee", "Off for this employee"); Who clocks
    shows it with Turn off and Follow the employer. The employer setting's screen is P29's (its text gains it). Spec: Attendance's
    fifth feature (the default on: Bob offered and clocking; set apart N: refused `CLOCKING_OFF`, listed off; followed again; the
    default off: Ana's own Y still clocks, alone in Who clocks; fails on the phase's code).
  - **R3 (low, scope).** The import resolved a worker among every person: an HR importer of one employer learned whether a person id
    or a work email belonged to anyone (`NOT_EMPLOYED` against `WORKER_UNKNOWN`), and a work email shared with someone at another
    employer was `WORKER_AMBIGUOUS`. A worker is now resolved among the people the employer employs or employed; anyone else is
    `WORKER_UNKNOWN` as one who does not exist. Spec: Attendance's last feature (B's HR officer in A's file is `WORKER_UNKNOWN`;
    `NOT_EMPLOYED` on the phase's code).
  - **R4 (low, registration).** The `timeAndAttendance` target named `PEOPLE_IMPORT` alone though its services require
    `PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT` too; a target's permissions are all required, so it names all three (design-admin §11.1).
    Nothing in the framework dispatches a `wizard` target's import, so no behavior changed; no spec.
- Findings, numbered by the lead F231 to F235 in order:
  - `import#Records` keeps every ready row's outcome and the batch's counts in its own transaction around the rows' (up to 5000):
    each punch commits on its own, but if that outer transaction fails or times out on a large file the rows stay ready and the
    batch previewed, and a rerun records nothing new and reports those rows as already recorded;
  - the employer's `PeopleClocking` is a plain `PartySetting`, not dated or audit-logged as design §12's "dated organization
    preferences" asks; P29 decides it with PeoplePreferences (its text says so);
  - a quick create's condition is asked on each shell data load and kept with the tray's providers up to ten minutes, so a change of
    clocking reaches the + menu at the next page load and the tray within ten minutes;
  - a self-service punch of an employment with no working schedule is attributed to a day in the user's own time zone (their
    preference), so the user can move the day it counts on, though not its instant (the server's);
  - Who clocks lists every current employment of an employer whose default is on (up to 5000, paged after reading);
  - the worker's findings stand otherwise; their first (the + menu) and third (clocking a flag of the employment) are answered by
    the user's calls of Nov 12.
- Tests (release binary from the main checkout unless named; the framework part and the specs that need it on this worktree's
  Debug binary, `--debug --nobuild`): cargo moqui-core lib 1721 passed, 4 ignored (the shell tests 20 of 20); framework
  ShellQuickCreate 1 of 1 (0.9 s, Debug; fails on the release binary, which has master's framework); Mantle Attendance 6 of 6 (2.8 s
  of features at a load of about 15; the fifth feature 0.7 s); BOSS PeopleAttendance, PeopleAccess, PeopleSelfService,
  PeopleApprovals, AdminImports and QuickCreate 56 of 56 (Debug; 26.6 s of features while cargo's tests ran beside them, when
  PeopleAccess took 16.9 s and was flagged over 15 s; alone at a load of 11 to 18 it took 10.2 s); PeopleAccess and PeopleSelfService
  23 of 23 (release, 12.5 s). The new checks fail on the code before them (each run against it). A one-off render of Who clocks
  (qvt and html, as HR, with Retail's default on and Tomas set apart) and its Follow the employer post, not kept. `moqui lint
  --screens` (Debug): 135 flagged sites as before, none in the screens touched. Prettier clean on the changed JavaScript, rustfmt on
  the changed Rust. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- For the lead:
  - budget share: framework about +0.9 s (ShellQuickCreate, Debug); mr-mantle about +0.7 s (Attendance's fifth feature); mr-boss
    about +0.15 s (one shell data render in PeopleAttendance's third feature);
  - merge order: mr-moqui's commit before or with mr-boss's (an older binary ignores `condition-service`, offering Clock in to every
    user the time area opens to, and PeopleAttendance's third feature fails);
  - merge hot spots beside the Built note's: mr-moqui `screen/shell.rs` (`ShellLink`, `link_entry`, `offered`),
    `screen/tests/shell.rs` (Open.xml's quick creates and the expected list), xml-screen-3.xsd `quick-create`, `ShellServices.xml`,
    docs/ui/Qvt-Client.md, the example's `Gallery.xml` and `ExampleServices.xml`; mr-mantle `Attendance.js` (the clocking section,
    `storeClocking`, `findClocking`, `workerResolver`), `AttendanceServices.xml`, `PeopleAttendanceEntities.xml`'s seed,
    `HumanResourcesEntities.xml`; mr-boss `Commons.xml`, `Attendance.xml`'s Who clocks, design-people (header, §1.4, §6),
    design-drawers-commons §1.5, design-admin §11.1, §4 and P29 here;
  - PeopleAccess is near 15 s under load on the Debug binary (P12's review measured 8 to 9.5 s quiet);
  - the user's two calls of Nov 12 are in §4 and built; nothing waits on the user.

### P14 — Shift roster

Design §6 ShiftRoster, §15 (the roster print); PE-06 (shifts), PE-20 (its roster part). Ends stage 2.

- **Mantle** ShiftAssignment and ScheduleServices `get#Roster` and `store#Shift` (overlaps, ended employments and
  approved leave refused; publishing notifies, updates capacity and the projected shift collection).
- **Screens:** ShiftRoster over the shared resource-lane timeline, Projects' Timeline.qvue in its resource mode as
  ProductionSchedule mounts it (F53), one lane per person, with its TUI person and date table, its own as
  ProductionScheduleTui is; drag previews and the dialog commits.
- **The timeline's resource mode** (owner contract with Projects and Manufacturing; F68): it is entered today only
  under a path segment named `ProductionSchedule`, with production transitions, lanes keyed by facility and plant and
  work-center wording. This phase makes the mode the mount's choice, the lanes and bars generic keys with their
  labels and wording from the schedule answer, and the move and decision transitions named by the mount;
  ProductionSchedule answers the same, and Manufacturing's specs pass unchanged.
- **Specs:** Mantle `test/humanres/ShiftRoster` (an overlap and a leave conflict refused; a published shift
  changes capacity once); BOSS `PeopleRoster` (the qvt render and the TUI twin, each for its own template).
- **Usable when** (`acceptance/People/PeopleRosterUsable`): a manager rosters a week for their team, is refused a
  shift over approved leave, publishes, and the workers see the shifts in SelfService and on the team calendar; the
  terminal makes the same change.

**Built Nov 12 (P14).** mr-mantle bea7ed7d, mr-boss (branch `ppl/p14`).
- Checked first (the code over the plan): F53 and F68 against `Timeline.qvue` as built (resource mode entered only under a path
  segment `ProductionSchedule`; lanes keyed by `facilityId`, bars by operation fields, the wording, the plant filter and the
  transitions `schedule`, `moveOperation` and `decideOverride` fixed in the component) and its callers: ManufacturingSchedule reads the
  answer's `laneList[].facilityId` and `operationList` and posts `moveOperation` with production parameters, ProductionScheduleTui is
  its own table, and the client regression ProjectsPlanningResponses drives the component's resource methods directly; P9's
  `Schedules.js scheduledDays` (one read for capacity's parties, the WetAvailable read skipped only when every day is planned) and
  `get#PartyCapacity`'s holiday and leave arithmetic (leave `min(base, leave)`, so an approved leave's projection counts once);
  P12's approved-leave states and segments, its `colleaguesOf` (not exported), the projected kind (`CalendarProjection`,
  `define#ProjectionOwner`) and Commons' `Calendar.qvue` kinds (`workHours` drawn as work hours with no change); P13's `accessKinds`
  (a manager's write on a live line with PEOPLE_TEAM_VIEW, P13's corrections) and its zone rule (the working schedule's, else the
  user's); the time area's grants (Time.xml's inheritable ALLOW for self-service, `BOSS_PPL_SCHEDULES` HR's and the managers') and
  SelfService's non-inheritable grant. §15 names the roster print ("Shift/attendance/timesheet" from ShiftRoster).
- Mantle:
  - `entity/PeopleScheduleEntities.xml`: `mantle.humanres.schedule.ShiftAssignment` (an employment's shift: person, employer,
    `ShiftAssignmentStatus` draft, published, removed (audit-logged), start and end instants (audit-logged), the zone its day is
    attributed in and that day (`shiftDate`), break, work location, comments, who created and published it and when, an operation
    key); never deleted;
  - `ScheduleServices` over a new module `Shifts.js`: `get#Roster` (the employments a manager's live lines reach at their employers
    and an HR reader's employers' overlapping the days, at most 200 by name, each with whether the caller rosters it, its zone and
    schedule, the schedule's working intervals (`Schedules.js plannedIntervals`, factored out of `scheduledDays`), holidays and
    approved leave by half day, never its type or reason; the draft and published shifts with their conflicts now; the drafts the
    caller may publish; the employers and work locations), `store#Shift` (preview, apply, remove; times as wall times in a given zone;
    `TIME_INVALID`, `TOO_LONG`, `DATE_PAST`, `BREAK_INVALID`, `DATE_OUTSIDE`, `EMPLOYMENT_ENDED`, `OVERLAP` across the person's
    employments, `LEAVE_CONFLICT` on the half day an approved leave holds; warnings `LEAVE_REQUESTED`, `HOLIDAY`; assessed again under
    the person's Party row lock; an operation key's retry answers the first; a change at the shift's revision, `REVISION_CHANGED`,
    `SHIFT_STARTED`, `SHIFT_REMOVED`, `PERSON_CHANGE` for a published shift), `publish#Shifts` (the drafts of the days or named, each
    assessed again in its own transaction, a refused one named and left a draft; each worker told once), `get#MyShifts` (the caller's
    own, no party), `get#TeamShifts` (the published shifts of the people the team calendar's absences reach: own, colleagues'
    (`Leave.js colleaguesOf`, now exported), a manager's reports' at the line's employers, an HR reader's employers'), and
    `get#ShiftProjection` (`define#ProjectionOwner`: the user's own published shifts); a manager (PEOPLE_TEAM_VIEW, a live line at the
    employer) or an HR editor (PEOPLE_HR_VIEW and PEOPLE_HR_EDIT) rosters, an HR reader reads; no permission of its own;
  - capacity (owner contract with Projects): `Schedules.js scheduledDays` overlays each person's published shifts (`Shifts.js
    shiftDays`) on the days they count on, in place of the schedule's hours (`shift: true`), and `get#PartyCapacity` lets no holiday
    take a shift's day; a person with shifts and no schedule keeps the WetAvailable or policy hours on the other days; a failure to
    read the shifts is logged and the schedule's days stay;
  - `data/PeopleRosterSetupData.xml`: the `PeopleShiftChange` topic (the worker's: "Your shifts {days}: {n shifts published | a shift
    changed | a shift removed}", never who rostered or why) and the `PeopleMyShifts` projection ("My shifts").
- BOSS:
  - Projects' `Timeline.qvue` (owner contract with Projects and Manufacturing, F68): resource mode is any mount's (a screen other than
    Projects' own Timeline and ProjectDetail's Plan tab), transitions relative to the mount's own screen; the lanes, bars, shades,
    notices and conflicts generic keys, and the wording, legend, filter, print link, dialog fields, header actions, create on a free
    time, keep-length moves and the move and decide transitions from the answer's `resource` (the contract in its header);
    `ProductionSchedule.xml` answers it beside its own fields (`barList` the operations with `moveParameters`, `noticeList` the override
    requests, conflicts by `barId`, its wording) and `moveOperation` takes `laneId` and `remove`; its screens, specs and terminal twin
    unchanged; ProjectsPlanningResponses sets the mount's resource on the component it drives;
  - `People/Time/ShiftRoster` (menu 12, key `g h`; the timeline over `get#Roster`, `moveShift` over `store#Shift` and `publishShifts`
    over `publish#Shifts`; Add shift, Publish (n) the primary while drafts wait, Print), `Time/ShiftRosterTui` (a person and day table a
    week, the shifts of the days, Shift with the preview box and Save shift, Remove shift, Publish, week before and after),
    `Time/ShiftRosterPrint` (html-print, as of now) and `template/PeopleRoster.xml` (the table both include); all in
    `BOSS_PPL_SCHEDULES` (HR's and the managers'; the root user group and self-service denied);
  - SelfService's My shifts (`get#MyShifts` through `BOSS_PPL_SHIFTS_SELF`, shown when there are any, linking the team calendar;
    `get#SelfServiceContext`'s `teamCalendarUrl`); TeamCalendar and TeamCalendarTui show the published shifts beside the absences ("Who
    is out and on shift"); People's root: the key `g h` and the topic; the topic's link opens the team calendar on its first day;
    People.js: link paths.
- Specs: Mantle `test/humanres/ShiftRoster` (2 features, stepwise, 1.4 s: 0.70, 0.69: a preview writing nothing, a draft and its
  retry, an overlap, approved leave, an ended employment, a past start and a shift over a day refused, waiting leave a warning; the
  person refused `PERMISSION_DENIED`, an HR reader and another employer's HR `RECORD_UNAVAILABLE`, HR of the employer rostering; the
  manager's, reader's and B's rosters; drafts plan nothing, a published 10-hour Monday replacing the schedule's 8 (not 18), Tuesday
  4, Saturday 4, the leave day 0; the worker told once of three, their shifts, team calendar and projection, B's HR not admitted; a
  later draft changing nothing, a published shift shortened and another removed changing capacity again, a stale revision refused,
  told twice more). BOSS `test/People/PeopleRoster` (2 features, stepwise, 0.33 s: the schedule transition's contract as the manager
  (wording, transitions, fields, legend, her reports as lanes), a drop on Tomas previewed and saved through moveShift, the draft bar,
  Publish (1) and its post, Tomas's own shift; ShiftRosterTui's one tui render as HR with the table, the shift and the commands).
  PeopleAccess gains one feature (0.30 s: ShiftRoster opened by the manager and HR, refused to the reader and the employee; Tomas's
  shift rostered by his manager, the reader refused `PERMISSION_DENIED` with the same parameters, Services' employee
  `RECORD_UNAVAILABLE` to Retail's HR; the employee's `get#MyShifts` by its own grant) and its menus and keys (`hrTimeMenu`,
  `managerTimeMenu`, `g h`). Acceptance, written and not run: `acceptance/People/PeopleRosterUsable` (3 features: Tomas's Wednesday
  asked and approved; Hannah rosters his week through the timeline's transitions, a preview and Save shift each, the Wednesday refused
  `LEAVE_CONFLICT` and shaded without its reason; she publishes, Tomas's SelfService (under Commons) and the team calendar show the
  four shifts and he is told once; HR changes his Friday through ShiftRosterTui's Shift, preview and Save shift, and he is told).
- Tests run (release binary, `--nobuild`, this phase's runtime): Mantle ShiftRoster, PeopleSchedules, WorkResources, LeaveRequests,
  WorkTimesheets, Dav, BusinessTime, Attendance and ProductionSchedule 50 of 50 (mr-mantle 14.5 s of features); BOSS PeopleRoster,
  PeopleAccess, PeopleLeave, PeopleSelfService, PeopleSchedules and ManufacturingSchedule 38 of 38 (mr-boss 11.1 s of features),
  then after formatting Mantle ShiftRoster, PeopleSchedules, WorkResources and LeaveRequests 18 of 18 (mr-mantle 8.3 s) and BOSS
  PeopleRoster, PeopleAccess, PeopleLeave, PeopleSelfService, PeopleSchedules, ManufacturingSchedule, Resources and PeopleTime 47 of
  47 (mr-boss 13.6 s); the client regression ProjectsPlanningResponses 7 of 7 offline (4.2 s; run on a copy of this runtime whose
  parent holds a `Cargo.toml`, as the offline `/files/` root needs). One-off checks, not kept: the component mounted offline as
  ShiftRoster with a roster answer (lanes, a dashed draft, shades, the dialog's post with the bar's parameters and fields, Publish's
  post) and ProductionSchedule's schedule and moveOperation answers in the generic contract over Manufacturing's fixture; the print,
  SelfService's My shifts, ShiftRoster's tui container and TeamCalendarTui rendered. `moqui lint --screens`: 135 flagged sites as
  before, none in the screens P14 touched, no TUI worklist entry. Prettier clean on the new and changed JavaScript
  (ProjectsPlanningResponses was not clean on master and is left so). Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People rows (ScheduleServices' six P14 services) and `get#PartyCapacity`'s; ss-inventory's P14 note (no
  baseline form is mapped).
- Design edits: design-people (header; §1.2; §3 SelfService; §6 ShiftRoster as built; §13 TeamCalendar; §15 the roster print);
  design-projects (header; §5 Timeline, the resource mode as a contract); design-manufacturing (ProductionSchedule as changed);
  design-crosscut CX-SYNC (My shifts).
- Findings, numbered by the lead F236 to F248 in order:
  - a manager rosters their live reports with PEOPLE_TEAM_VIEW, a view permission, as P13's correction requests do; there is no
    roster permission, so an employer cannot keep its managers from rostering (HR rosters with PEOPLE_HR_EDIT);
  - a published shift changed stays published and is told to its worker at once (no state of unpublished changes); a draft is never
    shown to the worker, on the team calendar or in capacity;
  - a published shift on a holiday counts its hours (no holiday takes a rostered day); the preview warns of it;
  - leave approved after a shift was published neither refuses the approval nor removes the shift: capacity takes the leave once,
    and the roster marks the shift's conflict for the rosterer to remove (leave's decision does not read shifts);
  - the team calendar shows the published shifts of the people its absences reach, colleagues included (the user's call of Nov 11 on
    absences); the My shifts collection is the worker's own alone;
  - a shift's day is attributed in the employment's working schedule's zone at its start, else the rostering user's; the roster
    draws every lane in the viewer's wall time (one frame), with a lane's own local times in the bar's tip and the dialog only;
  - a lane is an employment, so a person employed by two employers the user reads has two lanes; overlaps are checked across both;
  - Publish publishes every draft the user rosters on the days shown (narrowed by the employer filter); the browser does not publish
    one person or one shift alone (the service takes shift ids);
  - the roster print is html-print, a week a table; design §15's CSV and XLSX of the roster are not built;
  - ProductionSchedule's answer carries its operations twice (`operationList` for its specs and readers, `barList` for the
    component), up to 300 operations;
  - Shift roster is menu 12, last in Time & leave (design §1.2 places it after Working schedules; the indexes between are taken);
  - no demo shift is seeded;
  - tooling: an offline client spec (`server: false`) run against a phase worktree's runtime finds no `/files/` (the runtime's parent
    is the repo only when it holds `crates/` or `Cargo.toml`), so the Projects client regressions fail there and pass on master's
    runtime or a copy whose parent has the marker.
- For the lead:
  - budget share: mr-mantle about 1.4 s (ShiftRoster); mr-boss about 0.6 s (PeopleRoster 0.33 s, PeopleAccess's feature 0.30 s); the
    client walk unchanged; ProjectsPlanningResponses' time unchanged;
  - merge hot spots: mr-mantle `Schedules.js` (`plannedIntervals` factored out of `scheduledDays`, the overlay, the exports),
    `ResourceServices.xml` (`get#PartyCapacity`'s description, comment and holiday line), `Leave.js` (the module value exports
    `colleaguesOf`), `ScheduleServices.xml` (the header and the services appended), `PeopleScheduleEntities.xml` (the entity appended);
    mr-boss `screen/Projects/WorkItems/Timeline.qvue` (the resource mode rewritten: its template block, the r* computed and methods, the
    data, the watchers, the styles), `screen/Manufacturing/Planning/ProductionSchedule.xml`, `test/client/Projects/ProjectsPlanningResponses.spec.js`,
    `data/BossSetupData.xml` (`BOSS_PPL_SCHEDULES`' pattern; the P14 block appended at the end), `screen/People.xml` (the header, the key
    `g h`, the topic), `screen/People/Time.xml` (the header), `TeamCalendar.xml`, `TeamCalendarTui.xml`, `screen/Shared/PeopleSelfService.xml`,
    `People.js` (`areas`' comment, `linkPaths`, `selfServiceContext`), `ContextServices.xml`, `test/People/PeopleSpecLib.js` (the Time
    menus, keys), `PeopleAccess.spec.js` (the header, the appended feature), the inventories, design-people (header, §1.2, §3, §6, §13,
    §15), design-projects (header, §5), design-manufacturing (ProductionSchedule), design-crosscut CX-SYNC;
  - acceptance to run with the full suites: PeopleRosterUsable (new) and Manufacturing's ManufacturingScheduleWalk (its component
    changed under it);
  - for the user's call: whether rostering needs a permission of its own (the first finding); nothing else waits on the user.

**Review Nov 12 (P14).** A fresh review of `git diff master...ppl/p14` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §6 ShiftRoster, §13 TeamCalendar, §3 SelfService, §15, design-projects §5 (the timeline's resource mode) and
design-manufacturing ProductionSchedule, with Timeline.qvue's owner contract and its callers first; the user's call of Nov 12 built
and recorded in §4; fixes committed apart per repository ("People P14 review: …"). mr-boss's branch was rebased onto master's tip
(82343f6b: the archived Admin-Screens-Down plan's path edits), cleanly; mr-mantle's already sat on master's tip (236800d9).
- Checked and found sound:
  - The timeline's owner contract: Timeline.qvue enters resource mode only where the path has no `Timeline` segment and is not
    under ProjectDetail (Projects' own Timeline, `WorkItems/Timeline`, and ProjectDetail's Plan tab, whose default is Timeline, keep
    the work-item modes; no other screen serves the component), and in it every request and post goes to the mount's own screen
    (`ownPath`, the mount's path): `schedule`, the move and decide transitions and the header actions the mount's answer names, so
    the contract reaches no other app's transitions and adds no right (each mount's transitions check their own access:
    ProductionSchedule's `AccessServices.check#Record` and Mantle's checks, ShiftRoster's ScheduleServices). ProductionSchedule's
    answer keeps its own fields beside the generic ones (ManufacturingSchedule's specs and its terminal twin unchanged),
    `moveOperation` takes `laneId` and `remove` beside `targetFacilityId` and `unschedule`, and a commit carries the preview's
    revisions as before (`moveParameters`). ProjectsPlanningResponses' Manufacturing features drive the generic methods with the
    same assertions.
  - store#Shift: the employment is the caller's to roster or `RECORD_UNAVAILABLE` (a supplied employment, shift or person never
    widens scope: a manager's live line at the employment's own employer, an HR editor of that employer); a change re-reads the
    shift under the person's Party lock and checks its revision, removed and started states; an apply takes the lock, looks up the
    operation key again and assesses again (overlap across the person's employments, approved leave by half day, the employment's
    dates, a past start, a day's length, the break) before writing; preview writes nothing; a published shift does not move to
    another person; rows are cancelled, never deleted; the audit log on the status and the instants.
  - Capacity: `scheduledDays` replaces a day's planned hours by the person's published shifts of that day (drafts and removed
    ones never), summed when split; `get#PartyCapacity` takes no holiday from a shift's day and leave once (`min(base, leave)`, a
    whole-day leave 24 h), so a shift counts once with the schedule and with leave; a failure to read the shifts leaves the
    schedule's days.
  - Publishing: each draft in its own `runRequireNew`, assessed again under the person's lock, a refused one named with its code and
    left a draft, the rest going on; each worker told once per publish, by `PeopleShiftChange`, whose title names the days and the
    count only (never who rostered or why), to the worker's own accounts.
  - Self and team: `get#MyShifts` and `get#ShiftProjection` take no party and read the caller's own published shifts only (the
    projection admits a self-service user with a person); `get#TeamShifts` reaches exactly the people `absences` reaches (own,
    `colleaguesOf` at shared employers, a manager's live reports at the line's employers, an HR reader's employers), published shifts
    only, never opening anything, consistent with the user's call of Nov 11 on absences.
  - Scope by reporting line per employment and employer: `accessKinds` and `rosterEmployments` take a line's employers from
    `reportLines` (the intersection of the manager's and the report's employers, the assignment's manager where there is one), so a
    person employed by two employers is two lanes and a manager rosters only the employment at their line's employer.
- Fixes:
  - **R1 (the user's call of Nov 12).** Rostering gets its own permission, `PEOPLE_ROSTER_EDIT`. Mantle seeds it granted to `ADMIN`
    (`MantleSetupData.xml`); People.js's capabilities read it (`rosterEdit`); Shifts.js's `rosters` needs it beside the manager's
    line or HR's employer, and `store#Shift` (preview included) and `publish#Shifts` refuse `PERMISSION_DENIED` without it, while
    `get#Roster` answers the manager or HR without it the same lanes, each read only (`canRoster` false, no drafts to publish), so
    ShiftRoster's Add shift, Save shift and Publish and ShiftRosterTui's Shift, Remove shift and Publish are not offered (the
    screens follow `canRoster`; their headers say so). BossSetupData grants it to `BOSS_PEOPLE_MANAGER` and `BOSS_PEOPLE_HR` and adds
    it to both capability bundles. Specs: Mantle ShiftRoster (the manager's and the HR officer's accounts without it refused the
    same shift the holders are accepted with, preview included, the manager the same publish too and reading the roster read only; the HR reader given it
    still `RECORD_UNAVAILABLE` without PEOPLE_HR_EDIT); PeopleAccess (the capability `rosterEdit` held by the manager and HR alone;
    Hannah's roster and publish accepted, a spec-local account of hers without the permission reading the same roster read only and
    refused the same shift and publish; the account is hers only inside that feature, so no other feature meets a second account of
    the demo manager). Both fail on the phase's code.
  - **R2 (low, confidentiality).** The rosterer's comments (the dialog's and the terminal's Reason, which may say why someone
    covers) were in `get#MyShifts`' rows, the worker's own answer; they are left out there. Spec: ShiftRoster (a Saturday shift saved
    with a reason; the worker's rows carry none).
  - **R3 (low, confidentiality; the user's call of Nov 11 on absences).** The team calendar titled a colleague's shift with its
    work location; a colleague's shift is now its times alone ("{person} · Shift"), the work location kept for the user's own, a
    report's and an HR reader's (`get#TeamShifts`). Spec: ShiftRoster (Leo, a colleague by the same manager, sees Ana's three shifts
    as "Shift ANA · Shift"; Ana sees her shop).
  - **R4 (low, scope).** `store#Shift` took any `facilityId` and the roster then showed its name: a rosterer could store another
    organization's facility and read its name. A work location must now be the employer's own or the employment's assignment's
    (`FACILITY_INVALID`; one kept unchanged is not asked again). Spec: ShiftRoster (B's shop for an A shift refused).
  - **R5 (low, scope).** `OVERLAP` named the other shift's times even when that shift was at an employer the rosterer does not read
    (a person employed twice); such an overlap is now "It overlaps another shift of the same person". Spec: ShiftRoster (Ana also
    employed by B: B's HR over A's Monday told without its times; the manager at A with them).
  - **R6 (low, publishing).** `publish#Shifts` counted a draft as published (and told its worker) before its transaction had
    committed; it is now kept only after `runRequireNew` returns. No spec (a commit failure after the update is not reproducible
    in a spec).
- Findings, numbered by the lead F249 to F252 in order:
  - approved leave at another employer of the person shades the roster's lane and refuses a shift there (`LEAVE_CONFLICT`, "on
    approved leave"), so a manager or HR of one employer learns that the person is away from the other on those half days (never its
    type or reason); the overlap check across employments (R5) has the same shape, now without the other shift's times;
  - the dialog's work location choices are every facility of the roster's employers and the lanes' assignments, so on a roster of
    two employers a lane is offered the other's shops, which `store#Shift` then refuses (`FACILITY_INVALID`);
  - `get#Roster` reads at most 600 employments before sorting by name and cutting to 200, so a truncated roster is not the first
    200 by name;
  - an HR editor who is also the worker (their own employer) may roster and publish their own shift; it is not an approval, and
    the notice skips the caller;
  - the worker's findings stand otherwise; their first (no roster permission) is answered by the user's call of Nov 12.
- Tests (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle ShiftRoster, ProductionSchedule,
  WorkProjectPlan, PeopleSchedules, WorkResources, LeaveRequests, Dav, Attendance, WorkTimesheets and BusinessTime 60 of 60 (mr-mantle
  17.5 s of features; ShiftRoster 1.8 s: 1.02 and 0.78); BOSS PeopleAccess, PeopleRoster, PeopleSelfService, PeopleLeave,
  PeopleSchedules, ManufacturingSchedule, ProjectsAccess, WorkItems, ProjectDetail, Resources and PeopleTime 74 of 74 (mr-boss 27.5 s
  of features; PeopleAccess's roster feature 0.48 s); the client regression ProjectsPlanningResponses 7 of 7 offline (4.6 s; this
  phase's runtime with a `Cargo.toml` placed for the run in the worktrees' folder, its parent, and removed after). The new checks
  fail on the code before them (ShiftRoster at the permission and at `FACILITY_INVALID`, each run against it; PeopleAccess's roster
  feature against the phase's Shifts.js). Prettier clean on the changed JavaScript. `moqui lint --screens` not run: the screens
  touched (ShiftRoster.xml, TeamCalendar.xml) changed in their header comments only. Not run: `./moq test-apps`, the acceptance
  suite (PeopleRosterUsable needs no change: its manager and HR hold the permission by their groups).
- For the lead:
  - budget share beside the Built note's: mr-mantle about +0.4 s (ShiftRoster's new checks); mr-boss about +0.2 s (PeopleAccess's
    roster feature);
  - merge hot spots beside the Built note's: mr-mantle `MantleSetupData.xml` (the People permissions), `People.js`
    (`capabilityPermissions`), `Shifts.js` (`rosters`, `rosterScope`, `assess`, `publishShifts`, `getMyShifts`, `getTeamShifts`),
    `ScheduleServices.xml` (the P14 descriptions), `test/humanres/ShiftRoster.spec.js`; mr-boss `BossSetupData.xml` (the People
    grants and bundles), `PeopleAccess.spec.js` (the setup, the capability list, the roster feature), design-people (header, §1.1,
    §6 ShiftRoster, §13), §4 here;
  - the user's call of Nov 12 is in §4 and built; nothing waits on the user.

### P15 — Expense claims and advances

Design §9 ExpenseClaims, ExpenseClaimDetail, EmployeeAdvances, §13 InvoiceDetail (claims); PE-13, PE-24
(`createExpenseLine`).

- **Mantle** ExpenseClaim (keyed by `invoiceId`), its decisions and reservation, EmployeeAdvance, and
  `mantle.humanres.ExpenseServices`: `find#Claims`, `store#Claim`, `store#ClaimItem`, `submit#Claim`,
  `decide#Claim` on `PeopleExpenseApproval` (business approval leaves InvoiceReceived), `get#Claim`,
  `find#Advances`, `request#Advance`, `decide#Advance` on `PeopleAdvanceApproval`, `create#ClaimLineFromEmail`.
  `create#ProjectExpenseInvoice` gains employer authorization, self scope and the claim write (F21).
- **Accounting** (owner contract): ExpensePosting lists claims whose business state is approved; the claim's AP
  route only, the payroll route being P27's.
- **Screens:** ExpenseClaims, ExpenseClaimDetail ("Read receipt" over `run#Extract`, reviewed before save; the
  claim's PDF and evidence bundle of design §15), EmployeeAdvances, `People/Payroll/InvoiceDetail` with People's
  context branch (F19); quick create "New claim";
  the "Add to my claim" `create-from` and the mail rule action.
- **The mail rule action** (F65): an `EmailRuleAction` Enumeration `createExpenseLine` whose `optionValue` names
  `create#ClaimLineFromEmail`, which takes the five parameters `run#EmailRules` passes, runs with authorization off,
  so it checks itself what it does, and answers a message once. The claimant is the person whose employment's work
  address sent it; the line is a draft for the claimant to review, never submitted by mail, so a forged sender adds
  at most a draft line.
- **Specs:** Mantle `test/humanres/ExpenseClaims` (a claimant creates only their own; manager approval leaves
  InvoiceReceived; a claim reserved for one route refused the other; an advance's outstanding from delivered less
  applied); BOSS `PeopleExpenses`.
- **Usable when** (`acceptance/People/PeopleExpensesUsable`; design §14.3 "Expense reimbursement and advances",
  its AP half): an employee photographs a receipt, submits; the manager approves; finance codes and approves it in
  ExpensePosting; an approved advance is paid by Accounting and applied to the claim, and People shows what is
  outstanding.

**Built Nov 12 (P15).** mr-mantle 88af970a, mr-boss (branch `ppl/p15`).
- Checked first (the code over the plan): P5's approval kinds and `record#Decision` (a kind with its topic and `describe`, the
  request at the source's revision, the topic's approve and refuse services, `waitingFor` for To decide), P12's and P13's decide
  pattern (answered as missing before `record#Decision`, under the source's lock), P8's self-service grants and P13's Commons quick
  create with its `condition-service`; F21 (`create#ProjectExpenseInvoice`: no check; its callers Mantle's
  `WorkPlanToCashBasicFlow` and Marble's MyAccount/Expense, no BOSS caller), F65 (`run#EmailRules` calls the action's service with
  the five parameters, authorization off), F19 (InvoiceDetail's per-app branches); Accounting's ExpensePosting (`find#Payables`'
  expenses queue: a person's incoming or received bills, over the `InvoiceFinance` view), `approve#Payable` and `change#InvoiceState`
  (InvoiceWorkflow.js `issue`), `apply#InvoicePayment` (a payable applied only once approved), `create#Payment` (delivered posts
  through the SECA; `PtPrePayment` maps to prepaid expenses in DefaultSettings); `run#Extract` (text only, wrapped as untrusted;
  refused in a transaction unless `allowInTransaction`), `ec.resource.extractText` (a PDF's or text file's text), `writeZip`,
  `xslFoTransform`; the chat's create-from hook (every provider of a mutation is called, so a new kind goes through BOSS's
  `create#FromChat`, as Customer Service's case does) and `ChatAttachment`. No expense permission exists.
- Mantle:
  - `entity/PeopleExpenseEntities.xml`: `ExpenseClaim` (keyed by `invoiceId`: employment, claimant, employer, department, project,
    purpose, `ExpenseClaimStatus` draft, waiting, returned, approved, refused, cancelled, audit-logged; `ExpenseClaimRoute` accounts
    payable or payroll, the route reserved with its reference, date and user; the decider's reason; who made it; an operation key),
    `ExpenseClaimItem` (a line's merchant, the tax it includes, its receipt `InvoiceContent`, `ExpenseLineSource` entered, mail or
    chat with a unique source key, to review), `EmployeeAdvance` (employment, purpose, amount and currency, needed by, settled by,
    `EmployeeAdvanceStatus`, the payment finance made); `PakExpenseClaim` and `PakAdvance` (seeded with the entities);
    `InvoiceFinance` joins the claim's state, route and reservation;
  - `create#ProjectExpenseInvoice` gains `expenseClaim` (F21): the claimant's own (PEOPLE_SELF_SERVICE), or an HR editor's of the
    employer for them, recorded (another reader `PERMISSION_DENIED` before anything of the person is read); the employer of the
    claimant's current employment (named, else the one with `toPartyId`, else the only one: `EMPLOYMENT_REQUIRED`, `NOT_EMPLOYED`);
    a project only one the claimant works on (`PROJECT_UNAVAILABLE`); the invoice and the claim written; an operation key's retry
    answers the first. Without it, unchanged;
  - `ExpenseServices` over `Expense.js`: `find#Claims`, `get#Claim` (the claimant, a manager's live reports, HR and payroll readers
    of the employer, the approvers; the lines with receipts, the approval, the finance state and settlement, payments applied, the
    claimant's advances outstanding, what the caller may do), `store#Claim`, `store#ClaimItem` (an ItemExpense-family type, a
    positive amount to the currency, the tax within the line, a receipt file of at most 10 MB, a photo, PDF or text; saving is the
    line's review), `read#Receipt` (`run#Extract` over the text given, else the receipt file's; nothing saved; unavailable said
    so), `submit#Claim` (lines, none to review, each with an amount; the invoice received; `PakExpenseClaim`), `decide#Claim`
    (approve: the last approval is the business approval and leaves InvoiceReceived; return for correction; refuse, the invoice
    cancelled; withdraw; cancel) with `approve#Claim` and `refuse#Claim`, `get#ClaimReceipt`, `get#ClaimEvidence`,
    `get#ClaimOptions`, `get#ClaimOffer`, `reserve#ClaimSettlement`, `find#Advances` (and, with finance, an organization's approved
    advances for a finance reader), `request#Advance`, `decide#Advance` with `approve#Advance` and `refuse#Advance`, `pay#Advance`
    (PAYMENT_EDIT: a `PtPrePayment` from the employer, delivered), `apply#Advance` (to the employee's claim approved for payment,
    through `apply#InvoicePayment`, at most the outstanding and the unpaid), `create#ClaimLineFromEmail` and
    `create#ClaimLineFromChat`;
  - `data/PeopleExpenseSetupData.xml`: the two topics (titles naming the claim or advance, the person and employer, never an
    amount) and `ErActCreateExpenseLine`;
  - Accounting's owner contract: the expenses queue lists a claim once approved, on the accounts payable route; `issue` refuses a
    claim before its business approval (`CLAIM_NOT_APPROVED`) or reserved for payroll (`CLAIM_RESERVED`) and reserves an approved one
    for accounts payable (`Expense.js financeApproval`); Approvals.js's two kinds.
- BOSS:
  - `People/Expenses` (menu 11, key `g x`): Expense claims (the default; New claim the primary, the claimant's own or HR's for an
    employee), `ExpenseClaimDetail` (ClaimHeader, ClaimItems with receipts, Read receipt into the line's form, Submit, Approve,
    Return, Refuse, Withdraw, Cancel claim, FinanceAndSettlement, Print, Download PDF and Evidence bundle), `ExpenseClaimPrint`
    (html-print and its PDF) and Advances (Request advance, Approve and Refuse in the row, Withdraw); `Expenses.js` (the printed page
    and the evidence zip); `BOSS_PPL_EXPENSES` (the area's inheritable ALLOW for self-service, as Time's);
  - `People/Payroll/InvoiceDetail`: the shared InvoiceDetail's People branch (`template/PeopleInvoiceDetail.xml`, F19), a claim's
    invoice for a payroll reader;
  - Accounting's ExpensePosting (owner contract): the Employee advances tab (`template/AccountingAdvances.xml`: Pay, Apply);
  - the quick create New claim on Commons' root (`peopleNewClaim`, its condition `get#ClaimOffer`); "Add to my claim" (screen-extend
    Chat.xml, `create#FromChat` kind `claimLine`); the two topics on People's root and Approvals, their links (BossSetupData);
    SelfService's My expenses and My advances; People.js: the link paths, the self-service links, `decisionUrl`.
- Specs: Mantle `test/humanres/ExpenseClaims` (6 features, stepwise, 2.6 s: 0.41, 0.56, 0.56, 0.43, 0.52, 0.21: a claimant's own claim,
  its retry, another employee refused for the permission, HR's for her recorded and cancelled, Services' HR refused, a project not
  worked on and an employer not hers refused; a mail line made once from the work address, a stranger's adding nothing, submit refused
  with no line and with a line to review, a tax above the line refused, Services' HR refused the claim, the claim locked once
  submitted, the manager reading it; finance refused before business approval, her own decision `SELF_APPROVAL`, an outsider as
  missing, the manager's To decide, the approval leaving InvoiceReceived, the queue listing it only then, finance approving and
  reserving accounts payable, a return with its reason, the stages; a payroll reservation refused to a payroll reader, then
  refusing finance's approval and an accounts payable reservation, the finance-approved claim refused to payroll, the queue without
  it; an advance asked and retried, asked for another refused, paid only once approved and by finance, outstanding 40, applied to the
  100 claim, 60 unpaid and the advance settled; a chat message of her own a line once, another's `NOT_YOURS`, a non-member's room
  `RECORD_UNAVAILABLE`). BOSS `test/People/PeopleExpenses` (4 features, stepwise, 1.3 s: ExpenseClaimDetail's one qvt render as the
  manager, the notice naming no amount, approved from it through the tray's service, the invoice received; Expense claims' one html
  render as the employee with the new claim's form and his claim with finance, Advances' one html render as the manager with the
  advance to decide; Payroll's InvoiceDetail's one html render as the payroll operator, the print as the employee, the evidence zip
  as the manager; New claim offered to the employee from Commons and not to the reader). PeopleAccess gains one feature (0.34 s:
  Expense claims opened to the employee by the area's grant and refused another app's user; a claim read by its claimant and manager
  and refused to the reader with the same parameters; HR's claim for Retail's employee accepted and Services' refused; Payroll's
  InvoiceDetail refused to HR) and its context feature the employee's three expenses links; PeopleSpecLib's menus (Expenses) and keys
  (`g x`). Acceptance, written and not run: `acceptance/People/PeopleExpensesUsable` (3 features: Tomas asks an advance on his phone,
  Hannah approves it from her notice, finance pays it in Expense posting; he makes a claim, adds a hotel with its receipt and a taxi
  after Read receipt, submits; Hannah approves from her notice, finance sees it in Expense posting, approves it for payment and applies
  the advance, People shows 60 left and the advance settled).
- Tests run (release binary, `--nobuild`, this phase's runtime): Mantle ExpenseClaims, WorkPlanToCashBasicFlow, AccountingPayables,
  AccountingMatching, AccountingBudgets, PeopleApprovals, Attendance, LeaveRequests and HumanResServices with their fixtures (13 specs,
  128 of 128), then ExpenseClaims, AccountingReceivables and WorkPlanToCashBasicFlow after formatting (94 of 94, mr-mantle 8.7 s); BOSS
  PeopleExpenses, PeopleAccess (19 of 19), PeopleSelfService, PeopleApprovals, PeopleAttendance, PeopleLeave, AccountingPayables,
  AccountingAccess, PurchasingBills, Billing, CustomerServiceOrders, WarehouseShipping, Chat, QuickCreate, TodayPanel and
  ProjectsAccess (135 of 135, in two runs), then PeopleExpenses, PeopleAccess, AccountingReceivables and PeopleSelfService after formatting (40 of
  40, mr-boss 13.1 s). `moqui lint --screens`: 135 flagged sites as before, none in the screens P15 touched, no TUI worklist entry.
  Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: ss-inventory's five MyAccount/Expense claim rows and the P15 note; usl-inventory's `create#ProjectExpenseInvoice` and
  the People Added rows (the ExpenseServices).
- Design edits: design-people (header; §1.2 Expenses; §1.4 Quick create, Comms hooks, Mail intake; §3 SelfService; §9 ExpenseClaims,
  ExpenseClaimDetail and EmployeeAdvances as built; §13 InvoiceDetail as built); design-accounting (header; §5 ExpensePosting as
  built); design-drawers-commons (header; §1.5 the New claim quick create).
- Findings, numbered by the lead F253 to F263 in order:
  - Read receipt reads text only: `run#Extract` takes a text, and the server reads no photo (no OCR or image input), so a PDF's or text
    file's receipt is read from the file and a photo's needs its text typed or pasted; a vision or OCR input is a framework ask;
  - there is no expense permission: "HR expense authority" (acting for an employee) is PEOPLE_HR_VIEW with PEOPLE_HR_EDIT of the
    employer, and "finance by grant" in People is a payroll reader (PAYROLL_VIEW) of the employer; Accounting's finance acts through its
    own permissions in Expense posting and BillDetail;
  - a decider returns a claim for correction (the claimant edits and submits again) or refuses it (closed, its invoice cancelled); the
    tray's Refuse is the final refusal;
  - the approval notices name the claim or advance, the person and the employer, never an amount or the purpose;
  - every claim's route is accounts payable in this build: finance's approval reserves it; `reserve#ClaimSettlement` is built for P27's
    payroll route (a payroll editor, while the invoice is received; released while not approved for payment). A claim reserved for
    payroll never reaches InvoiceApproved through accounts payable, so PaymentRuns.js is unchanged; P27 keeps a payroll-reserved claim
    out of payment runs when it approves one;
  - finance pays and applies advances in Accounting's Expense posting (an Employee advances tab, owner contract) with PAYMENT_EDIT: the
    payment is a `PtPrePayment` created delivered at once, outside payment runs and payment authorization; an employee's repayment is
    counted when Accounting applies it to the advance's payment, with no People action; recovery by payroll deduction waits on P24 and
    a localization;
  - mail intake takes the claimant from a current EmailWork address of exactly one person employed now (the rule's value names the
    employer of one employed by several) and checks nothing of the rule's owner or account: any rule with the action adds at most a
    draft line to the sender's own claim; the message's files, else its text, are the receipts, and the line's amount is empty until
    reviewed;
  - "Add to my claim" takes only the user's own message; like the other chat message actions it is shown to every chat user and
    refused to one without an employment;
  - Read receipt brings its proposal to the line's form through the page's parameters (the day, amount, tax, merchant and description of
    the user's own expense), as Leave requests carries its terms;
  - the evidence bundle and its PDF are written under `runtime://tmp/people-claims` on each request and not cleaned up (the claim's PDF
    is the html page when the server has no PDF engine); a printed claim is rendered, not issued and stored (design §15's issued
    documents are not built for claims);
  - a line without a receipt is counted on submit, not refused (no receipt policy); receipts are read by the claim's readers in People and
    by finance as any bill's content in Accounting;
  - a claim's currency is the employer's (create#Invoice's default), changed only while it has no line; an advance's defaults to the
    employer's accounting currency (its parent's when it has none);
  - the expenses queue keeps a person's other bills (a contractor's, a worker's time) as before.
- For the lead:
  - budget share: mr-mantle about 2.6 s (ExpenseClaims); mr-boss about 1.7 s (PeopleExpenses 1.3 s, PeopleAccess's new feature 0.34 s);
    the client walk unchanged;
  - merge hot spots (P14 is merged first; the reviewer rebases): mr-mantle `Approvals.js` (the two constants and kinds after
    `PakAttendance`), `InvoiceServices.xml` (`create#ProjectExpenseInvoice`), `InvoiceWorkflow.js` (`issue`), `Payables.js` (the
    expenses queue), `InvoiceWorkflowEntities.xml` (`InvoiceFinance`); mr-boss `data/BossSetupData.xml` (the P15 block appended at the
    end, after P14's), `screen/People.xml` (the header, the key `g x`, the two topics), `screen/Commons.xml` (the quick create),
    `screen/People/Approvals.xml`, `screen/People/Payroll.xml`, `screen/Shared/InvoiceDetail.xml`, `screen/Shared/PeopleSelfService.xml`,
    `People.js` (`linkPaths`, the self-service links, `decisionUrl`, `expensesAreaOpens`, `selfServiceContext`), `ContextServices.xml`,
    `ChatServices.xml`, screen-extend `Chat.xml`, Accounting's `ExpensePosting.xml` (its queue box moved under a section),
    `test/People/PeopleSpecLib.js` (the menus with Expenses after Time or Payroll, the keys with `g x` last), `PeopleAccess.spec.js`
    (the context's links, the appended feature), the inventories, design-people (header, §1.2, §1.4, §3, §9, §13),
    design-accounting (header, §5), design-drawers-commons (header, §1.5);
  - acceptance to run with the full suites: PeopleExpensesUsable (new);
  - for the user's call: whether expenses need a permission of their own (an expense approver or expense HR authority) rather than
    PEOPLE_HR_EDIT and PAYROLL_VIEW; whether finance pays advances in Expense posting at once (built) or through payment runs and
    payment authorization; whether Read receipt should read photos (a framework ask); whether a notice may name the claim's total.

**Review Nov 12 (P15).** A fresh review of `git diff master...ppl/p15` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §9 ExpenseClaims, ExpenseClaimDetail and EmployeeAdvances, §13 InvoiceDetail, §15, design-accounting §5 and F21, F65, with
`create#ProjectExpenseInvoice`'s callers first; the user's four calls of Nov 12 built or recorded in §4; fixes committed apart per
repository ("People P15 review: …"). Both branches were rebased onto master after P14's merge: mr-mantle cleanly; mr-boss with the
appended BossSetupData blocks, People.xml's header, key and topics, PeopleSelfService's header, ContextServices' and People.js's
links, PeopleSpecLib's keys, PeopleAccess's header and two features, design-people's header and §3, and the inventories each kept
both sides; ExpenseClaims, PeopleExpenses, PeopleAccess and PeopleRoster passed after it (32 of 32).
- Checked and found sound:
  - `create#ProjectExpenseInvoice`: without `expenseClaim` its path is unchanged; its callers are Mantle's WorkPlanToCashBasicFlow
    and Marble's MyAccount/Expense (`in-map="context"`, so a request naming `expenseClaim` takes the claim path and its own checks),
    no BOSS caller; Projects' expenses do not call it. InvoiceWorkflow.js `issue` calls `financeApproval`, which passes an invoice
    that is no claim; the expenses queue keeps a person's other bills; Payables.js's other hunks are Prettier's reflow only.
  - Self scope: the claimant is `fromPartyId` only when it is the caller's party; anyone else's claim (and advance) is refused for
    the permission before anything of the person is read; a named employment must be the claimant's; `find#Claims`' and
    `find#Advances`' `partyId` only narrows; the HR employee picker's choices are HR's scope.
  - No self-approval: `record#Decision` refuses the claimant (`SELF_APPROVAL`, ExpenseClaims) and the one who made the claim for
    them is its requester; withdrawal is the claimant's or the maker's.
  - Business approval leaves the invoice `InvoiceReceived`; `issue` refuses a claim before it (`CLAIM_NOT_APPROVED`) or reserved
    for payroll (`CLAIM_RESERVED`) and reserves an approved one for accounts payable; a claim reserved for one route is refused by
    the other.
  - Mail intake: authorization off, it rechecks the sender as exactly one person's current work address and one current
    employment (the rule's employer when several), and adds at most one draft line of amount 0, waiting for review (submit
    refuses it until reviewed), once per message; a stranger's message adds nothing.
  - Read receipt saves nothing: it locks the claim, reads the receipt's text and calls `run#Extract` in its own transaction.
  - Approval notice titles name the claim, person and employer, never an amount, line or purpose.
- Fixes:
  - **R1 (the user's call of Nov 12).** Expenses get their own permission, `PEOPLE_EXPENSE_MANAGE`: Mantle seeds it to `ADMIN`;
    People.js's capabilities read it (`expenseManage`, not a staff read, so it opens no person's People record); Expense.js's
    `expenseScope` reads the holder's organizations (or every internal one with PEOPLE_ALL_ORGANIZATIONS) and the access kind
    `manage` replaces `hr`, `hrEdit` and `payroll`: reading every claim and advance of the employer and making, changing,
    submitting or cancelling a claim or asking an advance for an employee. The claimant's own and the approvers' route are
    unchanged; `reserve#ClaimSettlement`'s payroll route stays a payroll editor's. BossSetupData grants it to `BOSS_PEOPLE_HR` and
    `BOSS_ACCOUNTING_AP` (the group that holds Expense posting) and adds it to both bundles; Expense claims, Advances, the claim's
    Payroll link and Payroll's InvoiceDetail (People's branch) follow `manage`. Specs: ExpenseClaims (HR of A without it refused
    the claim HR is accepted with, and refused reading it; a payroll reader refused reading it); PeopleAccess (`expenseManage` held
    by HR alone among the groups; HR reads Tomas's claim and claims for him; a spec-local HR account without it and the payroll
    operator refused the same with the same parameters); PeopleExpenses (Payroll's InvoiceDetail rendered for the payroll operator
    given the permission by a spec-local group inside the feature). ExpenseClaims' and PeopleAccess's new checks fail on the
    phase's code, where HR view and edit alone was accepted and a payroll reader read the claim.
  - **R2 (the user's call of Nov 12).** An approved advance is a payable: its last approval makes a bill from the employee to the
    employer (one `ItemAdvancePay` line, posted to the employee advances account 151400000 by DefaultSettings, due when the advance
    is needed, `InvoiceReceived`; `EmployeeAdvance.invoiceId` replaces `paymentId`), listed in Expense posting's queue for finance's
    approval and paid by a payment run; `pay#Advance` and Expense posting's Pay are gone. Delivered is what delivered payments paid
    of the bill; `apply#Advance` issues a credit from the employer against the claim on that account (`create#InvoiceCreditMemo`
    with the account, finalized at once, as a run's discount credit is) and applies it (`apply#InvoiceToInvoice`), recorded in
    `EmployeeAdvanceApplication`; outstanding is delivered less those credits. A payment run neither selects nor pays an expense
    claim reserved for payroll (`PaymentRuns.js` select, paySupplier `BILL_RESERVED`; Expense.js `payrollReserved`). Specs:
    ExpenseClaims (the bill's parties, line, due day and posting; listed for finance and approved; a run takes the bill and the
    AP claim and leaves out the payroll claim approved as P27 would; paid, applied to the 100 claim, 60 left, the credit posted to
    the advances account); acceptance PeopleExpensesUsable changed (the bill approved in Expense posting, the run's check stands in).
  - **R3 (the user's call of Nov 12).** An expense approval notice's message carries the claim's total (`amount`, `currencyUomId`,
    `summary` "Claim total"), which Commons' notification lists show as the approval's summary; the title stays without an amount.
    Spec: PeopleExpenses (the title without it, the tray row's summary with "100.00").
  - **R4 (medium, security).** A receipt was sent inline with the type its name gives, and a receipt's name was not checked: an
    upload named `.html` declaring `text/plain`, an SVG (an `image/*` type), or any mail or chat attachment became a page served
    from the app's origin to the manager, finance or the claimant who opened it, a forged mail included. A receipt must now be a
    photo, PDF or text file by its name too (uploads refused `RECEIPT_INVALID`, SVG too; mail and chat intake leave other files
    out, logged) and `get#ClaimReceipt` answers inline only for those names. Spec: ExpenseClaims (`receipt.html` declared
    `text/plain` refused).
  - **R5 (low, confidentiality).** Read receipt carried its proposal (the receipt's day, amount, tax, merchant and description) in
    the redirect's page parameters, so into the address, the browser's history and access logs; it is now kept in the session for
    the next render of that claim and read once. No regression spec (a redirect's session is not in a screen test); the
    acceptance walk drives Read receipt.
  - **R6 (low).** The evidence bundle was written under `runtime://tmp/people-claims/<invoice>-<millis>` on each request and never
    cleaned up; each bundle now has a folder of a random name, its printed page is deleted once zipped, and a bundle older than an
    hour is deleted when the next is made. `runtime://tmp` is served by no URL.
- Findings, numbered by the lead F264 to F271 in order:
  - a forged From that matches an employee's work address still adds a zero-amount draft line (and a draft claim when there is
    none) with photo, PDF or text receipts; it blocks that claim's submit until the employee reviews or removes it, and reads
    nothing back; `EmailMessage` carries no sender authentication (SPF/DKIM) to check, which would be a framework ask;
  - with `pay#Advance` gone, an employee's cash repayment of an advance has no path (the phase counted one applied to the advance's
    payment); it waits for final settlement and recovery (P24, a localization);
  - a payment run pays an approved claim in full even while the employee has an advance outstanding, unless finance applies the
    advance first; nothing holds the claim;
  - an expense manager claiming for a person employed only elsewhere is told `PERMISSION_DENIED`, and for one with no current
    employment `NOT_EMPLOYED`: whether a party is employed somewhere;
  - Payroll's InvoiceDetail shows a claim only to a holder of PEOPLE_EXPENSE_MANAGE who opens Payroll; no demo payroll user holds
    it, so P27 decides payroll's read of the claims reserved for its route;
  - the New claim and Request advance employee pickers are People's HR choices (PEOPLE_HR_VIEW and PEOPLE_HR_EDIT); a holder of
    PEOPLE_EXPENSE_MANAGE in People without them sees an empty picker;
  - the advance approval notice shows no amount in its detail (the user's call named claims);
  - other apps send user files inline the same way (Chatter, RecordFiles, Commons Files, Purchasing's documents), and the
    framework's `sendResourceResponse` sends an inline file that is not the app's with neither `nosniff` nor a CSP sandbox (a
    framework ask).
- Tests (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle ExpenseClaims, AccountingPaymentRuns,
  AccountingPaymentRunControls, AccountingPayables, PeopleApprovals, WorkPlanToCashBasicFlow and HumanResServices with their
  fixtures 116 of 116, then ExpenseClaims after the last change 6 of 6 (3.3 s of features: 0.61, 0.61, 0.58, 0.43, 0.83, 0.22);
  BOSS PeopleExpenses, PeopleAccess, PeopleRoster, PeopleSelfService, PeopleApprovals, AccountingPayables, AccountingAccess,
  QuickCreate and Chat 94 of 94 (one assertion fixed between runs), then PeopleExpenses and PeopleAccess 24 of 24 (PeopleExpenses
  2.1 s: 0.56, 0.26, 1.00, 0.10 and setup; PeopleAccess's expenses feature 0.56 s); acceptance PeopleExpensesUsable (changed) 3 of 3
  (22 s with load); after Prettier, a last run of ExpenseClaims 6 of 6, PeopleExpenses, PeopleAccess and PeopleRoster 26 of 26 and
  PeopleExpensesUsable 3 of 3. `moqui lint --screens` (release binary): 135 flagged sites as before, none in the screens touched. Prettier
  clean on the changed JavaScript. Not run: `./moq test-apps`, mr-boss's whole acceptance suite.
- For the lead:
  - budget share beside the Built note's: mr-mantle about +0.7 s (ExpenseClaims' new checks); mr-boss about +0.4 s (PeopleExpenses'
    spec-local grant and tray row, PeopleAccess's holder and non-holder);
  - merge hot spots beside the Built note's: mr-mantle `MantleSetupData.xml` (the People permissions), `People.js`
    (`capabilityPermissions`, the export), `PaymentRuns.js` (select, paySupplier), `PeopleExpenseEntities.xml`; mr-boss
    `BossSetupData.xml` (the P15 block's grants and bundles), `PeopleAccess.spec.js` (the setup's spec-local account, the capability
    list, the expenses feature), `Shared/InvoiceDetail.xml`, §4 and §7 here, design-people §9, design-accounting §5;
  - mr-moqui `plans/Remaining-Work.md`, framework asks, a line to add: "Image input for `run#Extract` (or an OCR text of an image),
    so People's Read receipt reads a photo of a receipt (impl-people P15; the user's call of Nov 12, 2026)."; and, if wanted, a
    second: "`sendResourceResponse` inline for a file that is not the app's: `X-Content-Type-Options: nosniff` and
    `Content-Security-Policy: sandbox`, as the XMPP uploads have";
  - the user's four calls of Nov 12 are in §4 (three built, one recorded in §7); nothing waits on the user.

### P16 — Openings and applicants

Design §5 Openings, ApplicantPipeline, ApplicantDetail, §13 InterviewsCalendar and Forms; PE-04, PE-24
(`createApplication`).

- **Mantle** JobOpening, the Applicant role and the application status flow (F9, F11), the application's opening
  link and content host, and `mantle.humanres.RecruitingServices`: `find#Openings`, `store#Opening`,
  `find#Applications`, `create#Application`, `get#Application`, `store#Application`, `change#ApplicationStage`
  (Hired never by a stage change), `schedule#Interview` (a private Event with a CallLink and an iMIP invitation),
  `submit#Scorecard` (a response of a form of the scorecard purpose, its text opted out of AI, P12),
  `create#ApplicationFromEmail`, the service of an `EmailRuleAction` Enumeration `createApplication` (F65): its
  opening from the rule's value or a plus tag set on the opening, since `createRequest`'s plus tag maps to a project
  only; it checks itself what the rule's owner may do and answers a message once. My interviews, for panel members, is
  a projected calendar (P12).
- **The survey builder for a second app** (owner contract with Commons and Customer Service; F51, §4):
  - the four shared screens (`Shared/SurveyForms`, `SurveyFormDetail`, `SurveyResponses`, `SurveyResponseDetail`)
    take their context from the mounting app's registration and no longer from a Customer Service branch: the
    purposes the app offers, the default form of each, the service that lists its forms and the one that reads its
    responses, the capabilities that edit and read, and the links. Customer Service's is the first registration,
    with its behavior and specs unchanged; People's is the second; Marketing's plan adds its own;
  - the builder's form definition services move from `mantle.request.CaseFeedbackServices` to
    `mantle.party.FormDefinitionServices` (`create#Form`, `get#Form`, `rename#Form`, `save#FormField`,
    `save#FormCondition`, `end#FormPart`, `publish#Form`), each checking the permission its purpose names. They
    take the builder of mr-mantle service/mantle/request/CaseTemplates.js (dated fields, conditions and parts, and
    their checks), with the permission from the purpose's registration where it checks `SUPPORT_POLICY_EDIT` and
    admits two purposes; case templates call the same module. `CaseFeedbackServices` keeps its names as callers of
    them with the case defaults: the purpose, the rating field, the customer audience and `SUPPORT_POLICY_EDIT`
    (F62);
  - People's purposes on FormPublication (interview scorecard, review, training assessment, exit interview): a
    form of one is answered only by the respondents a People service assigns, has no public or invitation link,
    and its responses are read through the People service of the record they belong to (the scorecard's own
    reviewer here; P19's trainer, P20's review step), never through another app's registration. A response is a
    `FormInvitation` naming the respondent and its People record; the framework's `get#FormResponse` checks no reader
    (F62), so no People screen calls it except through that record's service.
- **Screens:** Openings, ApplicantPipeline (`view-board` and its list), ApplicantDetail, InterviewsCalendar (Commons'
  Calendar and EventDetail mounted, with the interview invitation and `.ics` of design §15),
  `People/Settings/Forms` and its form detail (the builder with People's registration); the palette's openings and
  applications, the EmploymentApplication `record-lookup`, "Create application" `create-from`; the
  `people-job-description` skill and its prompt. A checklist step's exit-interview link (P7) opens a form of that
  purpose.
- **Specs:** Mantle `test/humanres/Recruiting` (an opening only on an approved active seat; an interviewer reads
  their own scorecard only; a bulk stage change names its failure); `test/party/FormDefinitions` (a form of a
  People purpose refused a public publication; a holder of one purpose's permission refused another's form);
  BOSS `PeopleRecruiting` (the board's one qvt render; People's forms list holds no feedback form, read from the
  service); CaseFeedback's and Customer Service's survey specs unchanged.
- **Usable when** (`acceptance/People/PeopleRecruitingUsable`): `people.admin` builds a scorecard form under
  People's Forms while Customer Service's feedback forms work as before; a recruiter opens a seat, receives an
  application by mail with its resume, schedules a video interview, and two panel members score it without seeing
  each other's scorecards or another opening's candidates.

**Built Nov 12 (P16).** mr-mantle f0c6605d, mr-boss (branch `ppl/p16`).
- Checked first (the code over the plan): F9 and F11 (EmploymentApplication's position, status, referral fields and approver, its
  status type with no item; no Applicant role); F51 and F62 against the four shared screens (each branching on
  `appRoot == 'CustomerService'` for its services, links, words and access rows) and CaseTemplates.js (the builder: `formAt`,
  `checkValues`, `problemsOf`, `keepValid`, `saveField`, `saveCondition`, `endPart`, admitting two purposes and checking
  `SUPPORT_POLICY_EDIT`), CaseFeedback.js (its rating, customer audience and permission), the FormPublication model and the
  FormInvitation link kind in ExternalAccess.js; F65 (`run#EmailRules`' five parameters, authorization off; `createRequest`'s plus
  tag and its account-or-owner rule); P4's positions (`EmpsActive` the approved state, vacancy computed), P6's person search rule
  (a person chosen by id only when related), P12's projected kind (`CalendarProjection`, `define#ProjectionOwner`) and AI opt-out,
  `CallServices.create#CallLink` (its token only in the answer, the path `/call/<token>`), `EventServices.create#Event`,
  `check#EventAccess` (an attendee or the owner) and `send#EventInvitations`; Commons' Calendar.qvue (its transitions found by a
  path segment `Calendar` or `ResourceCalendar` only); the feedback send job's queries (FinScheduled due and FinSent with a reminder
  due, so an assigned invitation with neither is never picked up).
- Mantle:
  - the survey builder for a second app (F51, F62): `mantle.party.FormPurpose` (`FormPublicationEntities.xml`), a purpose's
    registration: its edit and view permissions, its organization scope service (empty: the user's own internal organizations), its
    publication access kinds and the word its messages use; seeded for case templates and case feedback (Customer Service's) and
    People's four purposes; `mantle.party.FormDefinitions` (`FormDefinitions.js`, the builder moved out of CaseTemplates.js:
    `formOf` by registration, `formAt`, `checkValues`, `answersOf`, `problemsOf`, `editRows`, `saveFieldOf`, `saveConditionOf`,
    `endPartOf`, `publishOf`, `makeForm`, `publishedFormFor`, `recordAnswer`) and `FormDefinitionServices` (`find#Forms`,
    `create#Form`, `get#Form`, `rename#Form`, `save#FormField`, `save#FormCondition`, `end#FormPart`, `publish#Form`, each checking
    the purpose's permission and organization: `PURPOSE_UNAVAILABLE`, `PERMISSION_DENIED`, `RECORD_UNAVAILABLE`, `FORM_INVALID`);
    CaseTemplates.js keeps the case's (its queues and types, a case's values) and calls the builder with the case defaults, and
    CaseFeedback.js's form services call it with the purpose, rating, customer audience and `SUPPORT_POLICY_EDIT`, their names
    and codes unchanged; FormPublication.js: a publication only of an access kind the purpose admits (`publicationFor` checks it,
    `FormPublicationServices.open#Publication` refuses `PUBLICATION_NOT_OFFERED`), and ExternalAccess.js's FormInvitation kind
    makes no link for a purpose that admits no invited recipients;
  - `entity/PeopleRecruitingEntities.xml`: `JobOpening` (employer, title, description, recruiting owner, state Draft, Open, Closed,
    internal only, dates, mail plus tag and account, default scorecard), `JobOpeningPosition`, EmploymentApplication extended (its
    opening, employer, contact permission, the message it came from, a possible duplicate, notes), `EmploymentApplicationContent`
    (the application's content host) and `ApplicationInterview` (the event, the application, the scorecard form, the call link);
  - `data/PeopleRecruitingSetupData.xml`: the Applicant role, the stages and their flow, the Email and Careers page sources,
    People's four form purposes and their registrations (PEOPLE_CONFIGURE edits; PEOPLE_RECRUIT_VIEW, PEOPLE_DEVELOP_VIEW and
    PEOPLE_HR_VIEW read; scope `PeopleServices.get#Scope`; no publication access), the `createApplication` mail rule action and the
    My interviews projection;
  - `mantle.humanres.RecruitingServices` over `Recruiting.js`: `find#Openings`, `store#Opening` (approved active seats of the
    employer only: `POSITION_NOT_APPROVED`, `POSITION_UNAVAILABLE`, `POSITION_REQUIRED`; `OWNER_INVALID`, `TAG_INVALID`, `TAG_TAKEN`,
    `DATES_INVALID`, `REVISION_CHANGED`; open, close, reopen), `find#Applications` (with the board's stages), `create#Application`
    (an open opening, `OPENING_CLOSED`; a person chosen only when related to the employer, else by exact email, else new with the
    Applicant role; a possible duplicate flagged), `get#Application` (a recruiter's whole record, a panel member's own interviews
    and scorecard), `store#Application`, `change#ApplicationStage` (each in its own transaction, failures named: `HIRED_BY_OFFER`,
    `INTERVIEW_REQUIRED`, `OFFER_REQUIRED`, `STAGE_INVALID`, `SAME_STAGE`, `APPLICATION_CLOSED`), `schedule#Interview` (a private
    WetEvent with the panel and the candidate as attendees, a lobby call link in its location, each panel member a FormInvitation
    of the scorecard with no link, the application moved to Interview, `send#EventInvitations` after, a failure to send named and
    the interview kept: `PANEL_INVALID`, `SCORECARD_REQUIRED`, `CANDIDATE_NO_EMAIL`, `DATE_PAST`, `DURATION_INVALID`),
    `submit#Scorecard` (the caller's own assignment once: `ALREADY_ANSWERED`, `FORM_VALUES_INVALID`), `find#Interviews`,
    `get#InterviewProjection`, `check#ApplicationAccess`, `create#ApplicationContent` and `create#ApplicationFromEmail` (once per
    message; the opening by the rule's value or a plus tag; the opening's intake account or its recruiting owner's rule with
    PEOPLE_RECRUIT_EDIT; the sender the applicant, the attachments its files, the first its resume); `get#RecordLinkInfo`'s
    content map and visibility admit the application host by `check#ApplicationAccess`.
- BOSS:
  - the survey builder's registration (`service/ironstone/shared/SurveyApps.js`): Customer Service's row (its services, words and
    access rows as built) and People's; Shared/SurveyForms, SurveyFormDetail, SurveyResponses and SurveyResponseDetail read it in
    place of the Customer Service branch (services by `${}` names, the edit capability of the app's context, the routes as its
    sharedLinks keys, the words); a registration with no responses service (People's) shows "not available" there;
  - `People/Settings/Forms` and `FormDetail` (the People administrator's tab, the shared screens with People's registration);
  - `People/Staffing/Openings` (menu 4, `g n`), `ApplicantPipeline` (menu 5 "Applicants": the board by stage with `moveStage`,
    Move to stage on the selected rows, Add application with a resume), `ApplicantDetail` (header, Schedule interview, Move to
    stage, Edit application, Application, Files (`record-files` on the application host), Interviews, Your scorecard over the
    DbForm, Scorecards; the scorecard sections `ai-opt-out`) and `InterviewsCalendar` (menu 6, `g v`: Commons' Calendar.qvue in
    resource mode over `find#Interviews`, Commons' EventDetail mounted as its subscreen; InterviewsCalendarTui);
  - People.js: link paths, the choices `approvedSeats`, `scorecardForms`, `openings`, `applicants` and `applicationSources`, the
    palette's openings and applications, the EmploymentApplication record-lookup; People.xml: the panels admit the application
    host, the keys, the assist-prompt "Draft a job description" on JobClassDetail and Openings; `skill/people-job-description.md`;
    RecordFilesServices.xml: the application host (`create#ApplicationContent`, a recruiter changes); Commons' Calendar.qvue
    (owner contract with Commons): its serving screen is also a path segment ending in `Calendar` (TeamCalendar, InterviewsCalendar).
- Specs: Mantle `test/humanres/Recruiting` (4 features, stepwise, 1.9 s: 0.52, 0.41, 0.77, 0.24: an opening on a planned seat and on
  another employer's refused, a reader refused, a draft taking no application, a tag taken, another employer's recruiter refused;
  a duplicate flagged, a bulk move naming the closed one, Hired and Interview refused, a reader refused, the Applicant role and no
  account; a video interview with two panel members, private, its call link, each answering once, another's scorecard refused, a
  missing required answer refused, each reading their own only, the recruiter both, another candidate refused, the projection and
  the calendar; mail intake once, refused for a rule not the owner's, with its resume) and `test/party/FormDefinitions` (2
  features, 0.9 s: a scorecard built and published by PEOPLE_CONFIGURE, an empty one refused, refused to a SUPPORT_POLICY_EDIT
  holder and another employer, a case feedback form refused to the People holder, an unregistered purpose refused, a reader
  reading and not editing; a People form refused a public and an invited publication and a link, a case feedback form an invited
  publication only; each user's find#Forms). BOSS `test/People/PeopleRecruiting` (2 features, 0.8 s: People's Forms from the
  service with no feedback form and its one qvt render; the applicant board's one qvt render). PeopleAccess gains one feature (0.46
  s: the applications of Retail's opening read by its recruiter, the HR officer refused with the same parameters, Services' opening
  refused to Retail's recruiter, an application refused to the HR officer; Forms the administrator's, the HR officer refused) and
  its menus and keys (`settingsMenu` Forms, `staffingMenu` Openings, Applicants, Interviews, `g n`, `g v`). Acceptance, written and
  not run: `acceptance/People/PeopleRecruitingUsable` (3 features: people.admin builds and publishes a scorecard through Forms'
  transitions while Customer Service's FeedbackForms shows its feedback form and not the scorecard; the recruiter opens Retail's
  vacant seat with a tag and the scorecard, an application arrives by mail with its resume and shows on the board; a video
  interview with Hannah and Ines (a spec-local account), each submitting through ApplicantDetail, Ines reading only hers, the
  recruiter both, another candidate not available to Ines).
- Tests run (release binary, `--nobuild`, this phase's runtime): Mantle Recruiting, FormDefinitions, CaseFeedback, SupportTemplates,
  SupportWarranty, SupportPortal, SupportCases, PeoplePositions, Dav and PeopleScope 57 of 57 (mr-mantle 25.6 s of features); BOSS
  PeopleRecruiting, PeopleAccess, PeoplePositions, PeopleLeave, PeopleEmployees, CustomerServiceFeedback, CustomerServiceReports,
  CustomerServiceTemplates, CustomerServiceAccess, RecordFiles and Chatter 98 of 98 (mr-boss 26.4 s). One-off checks, not kept:
  FormDetail (qvt, tui), Openings (qvt, tui), ApplicantPipeline (tui), ApplicantDetail (a recruiter's and a panel member's, with
  Your scorecard), InterviewsCalendar (tui) and InterviewsCalendarTui rendered with no error; a scheduled interview's invitations
  sent. `moqui lint --screens`: 136 flagged sites, none in the screens P16 touched, no TUI worklist entry for them. Prettier clean on
  the new and changed JavaScript (ExternalAccess.js was not clean on master and is left so). Not run: `./moq test-apps`, the client
  specs (Calendar.qvue's change is its serving-screen lookup alone), the acceptance suite.
- Inventories: usl-inventory's People rows (RecruitingServices' thirteen, FormDefinitionServices', open#Publication) and
  CaseFeedbackServices' builder row; ss-inventory's P16 note (no baseline form is mapped).
- Design edits: design-people (header; §5 Openings, ApplicantPipeline, ApplicantDetail as built; §13 InterviewsCalendar and Forms
  as built); design-crosscut's SurveyForms row.
- Findings, numbered by the lead F272 to F281 in order:
  - People's TeamCalendar (P12) called Commons' Calendar transitions: Calendar.qvue found its serving screen only by a `Calendar` or
    `ResourceCalendar` path segment, so under `People/Time/TeamCalendar` it read the user's Commons calendar; P16's change (a
    segment ending in `Calendar`) fixes both mounts; the client walks were not run;
  - an interview panel member is an employee of the employer with an account, but answering needs People (ApplicantDetail under
    People's root): a self-service employee (BOSS_PEOPLE_SELF alone) can be put on a panel and cannot open their scorecard; the
    acceptance gives Ines a People account. Whether interviewers answer from SelfService (or Commons) is for the user's call;
  - not built: the "Create application" `create-from` (a chat message names no opening and its sender is usually a user; mail
    intake is the plus tag's rule action), the checklist step's exit-interview link to a form of that purpose (an exit interview
    needs its own assigned respondent and record service, as the scorecard has; the purpose and its registration exist), and
    openings joining People's lifecycle participant (an owner who leaves keeps their openings);
  - People's four purposes are all edited with PEOPLE_CONFIGURE (Forms is under the administrator's Settings); P19 and P20 may name
    PEOPLE_DEVELOP_EDIT for the review and training assessment in their registrations;
  - the scorecard text is opted out of AI on ApplicantDetail's sections and answer field; the framework's FormResponseAnswer rows
    are every form's, so no entity field is opted out;
  - the Offer stage is unreachable until P17 (`OFFER_REQUIRED`); Hired never by a move;
  - the call link's token is in the interview's location, so every attendee (the panel and the candidate) holds it; the link is a
    lobby link, a guest waiting until someone in the call admits them, valid until a day after the interview (at most 90 days);
  - mail intake by account: any rule on the opening's intake account files into it, as createRequest's projects do; by owner, only
    the opening's recruiting owner's rule with PEOPLE_RECRUIT_EDIT;
  - a possible duplicate is the same person (one exact email address) with another open application at the employer; two
    addresses of one person are two applicants;
  - an opening's description is a text area, not the rich text with inline text actions of design §5;
  - People.js adds P16's choices and palette finds by assignments to its tables at the module's top level (the tables stay the
    extension point; the module is then evaluated on each load).
- For the lead:
  - budget share: mr-mantle about 2.8 s (Recruiting 1.9 s, FormDefinitions 0.9 s); mr-boss about 1.3 s (PeopleRecruiting 0.8 s,
    PeopleAccess's feature 0.5 s);
  - merge hot spots (P15 runs beside): mr-boss `service/ironstone/people/People.js` (linkPaths' end, the P16 choices block before
    `choices`, the palette push after `searchFinds`, `applicationCard` and the lookup branches), `screen/People.xml` (the header, the
    panel allowlist, the keys, the assist-prompts after P14's topic), `test/People/PeopleSpecLib.js` (`settingsMenu`, `staffingMenu`,
    `keys`, the P16 ids), `PeopleAccess.spec.js` (the header, the appended feature), `screen/People/Settings.xml`,
    `screen/People/Staffing.xml`, `screen/Commons/Calendar.qvue` (`calIndex`), `service/ironstone/shared/RecordFilesServices.xml`,
    the four `screen/Shared/Survey*.xml`, the inventories, design-people (header, §5, §13), this file; mr-mantle
    `service/mantle/party/CommunicationServices.xml` (`get#RecordLinkInfo`'s map, visibility and description),
    `request/CaseTemplates.js` and `CaseFeedback.js` (the builder moved), `party/FormPublication.js`, `FormPublicationServices.xml`,
    `ExternalAccess.js`, `entity/FormPublicationEntities.xml`. BossSetupData.xml and MantleSetupData.xml are not touched;
  - acceptance to run with the full suites: PeopleRecruitingUsable (new), CustomerServiceFeedbackWalk and
    CustomerServiceTemplatesWalk (the survey builder and the case template builder changed under them), PeopleLeaveUsable (the team
    calendar's component);
  - for the user's call: whether an interviewer without People answers their scorecard from SelfService (the second finding).

**Review Nov 12 (P16).** A fresh review of `git diff master...ppl/p16` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §5 Openings, ApplicantPipeline, ApplicantDetail, §13 InterviewsCalendar and Forms, F51, F62 and F65, the survey builder's
generalization first; the user's call of Nov 12 built and recorded in §4; fixes committed apart per repository ("People P16 review:
…"). Both branches were rebased onto master after P15's merge: mr-mantle cleanly; mr-boss with People.js's linkPaths, People.xml's
keys and its assist-prompts beside P15's topics, PeopleSpecLib's keys, PeopleAccess's header and its P15 and P16 features,
design-people's header and usl-inventory each keeping both sides; Recruiting, FormDefinitions, CaseFeedback (11 of 11) and
PeopleRecruiting, PeopleAccess, PeopleExpenses (27 of 27) passed after it.
- Checked and found sound:
  - Customer Service's survey screens: the four shared screens take Customer Service's registration (SurveyApps.js) with its
    services, words, links and access rows as they were; CaseFeedback.js keeps its names and codes and adds the customer audience
    and SUPPORT_POLICY_EDIT itself; CaseTemplates.js's `templateOf` admits the same two purposes with the same organization rule
    (`facilityScope`), its saves still check SUPPORT_POLICY_EDIT. CaseFeedback, SupportTemplates, SupportPortal, SupportCases and
    CustomerServiceFeedback, CustomerServiceTemplates, CustomerServiceAccess pass unchanged.
  - Every FormDefinitionServices call checks its purpose's registration: `find#Forms` the view permission per purpose, `create#Form`
    the edit permission and organization, the others through `formOf`. People's purposes take no publication on any path:
    `publicationFor` (Customer Service's invitations) and `open#Publication` need an access kind the registration lists, and
    ExternalAccess's FormInvitation kind resolves no link for a purpose without invited recipients, so the send job's link, the
    Support app's Feedback page and its submit refuse one; the send job picks no scorecard (FinSent with no reminder or expiry).
  - A bulk stage change runs each application in its own transaction and names each failure; Hired is never a move
    (`HIRED_BY_OFFER`), Offer waits for P17.
  - Commons' Calendar.qvue: `calIndex` finds the `Calendar` segment first as before, so Commons' calendar, a project's Plan and
    Manufacturing's ResourceCalendar resolve as they did; only a path with neither now takes a segment ending in `Calendar`
    (TeamCalendar, InterviewsCalendar) in place of falling back to Commons' transitions.
- Fixes:
  - **R1 (high, confidentiality).** Customer Service's `FeedbackServices.get#CaseResponse` read any FormInvitation's response of an
    organization the user serves: a Customer Service manager of Retail read an interview scorecard's answers by its response id.
    It now reads a case feedback form's response alone. Spec: PeopleRecruiting (the scorecard's response refused to
    `customerservice.manager`; read on the phase's code).
  - **R2 (the user's call of Nov 12; medium, confidentiality).** A panel member read through `get#Application` the stage, source,
    owner, duplicate flag and every interview of the application, and through `check#ApplicationAccess` its record host: every
    file (the resume included) and the recruiters' notes in its Chatter. A panel member now reads the applicant's name, the opening
    and employer, the interviews they are on the panel of with their own scorecard, and the files a recruiter shared with the panel
    (`EmploymentApplicationContent.panelShared`, audit-logged; `share#ApplicationContent`; `get#ApplicationFile`); the record host is
    the recruiters'. Built for the user's call: My interviews on SelfService (`find#MyInterviews`, no party) and
    `Shared/PeopleMyInterview.xml` at `People/MyInterview` and `Commons/People/MyInterview` (`get#MyInterview`: the caller's own
    panel; the scorecard over `submit#Scorecard`), `BOSS_PPL_INTERVIEW_SELF` (F28: the screen, its two transitions, four services,
    for `BOSS_PEOPLE_SELF`); ApplicantDetail's Shared with the panel box (a recruiter's Choose what the panel reads), no stage chip,
    Application or Files host for a panel member. The interview invitation links Commons' EventDetail, which a self-service
    interviewer opens. Specs: Recruiting (a panel member's view without stage, source or files, no record host, the shared file
    alone and only once shared, My interviews and MyInterview, another employer and a non-member refused), PeopleAccess (the
    self-service employee's MyInterview accepted, the reader refused with the same parameters, the record host the recruiter's
    alone), PeopleRecruiting (MyInterview's one qvt render under Commons as `people.employee`: the applicant, the opening and the
    shared file, never the other; the scorecard submitted with authorization on).
  - **R3 (medium).** Customer Service's case template and feedback purposes could be made and changed through the generic
    FormDefinitionServices by a SUPPORT_POLICY_EDIT holder, skipping CaseFeedback's rules (every field customer-visible, the
    rating): an internal field on a feedback form. `FormPurpose.ownServices` (Y for both) makes the generic services refuse them
    (`PURPOSE_UNAVAILABLE`); reading stays. Spec: FormDefinitions.
  - **R4 (low).** `formOf` answered PERMISSION_DENIED for an existing form of a purpose the user does not read and
    RECORD_UNAVAILABLE for a missing one; both are now RECORD_UNAVAILABLE (a reader's change stays PERMISSION_DENIED). Spec:
    FormDefinitions (its two expectations changed).
  - **R5 (medium).** The mail rule action filed by the rule's owner on `ownerPartyId` and a group permission alone: an owner who
    left (employment ended, account disabled) kept filing into the opening by their old rules. Now the owner must be the opening's
    owner now, with an enabled account, PEOPLE_RECRUIT_EDIT and a current employment or agency at the employer. Spec: Recruiting.
  - **R6 (the lead's ask; low).** Scorecard text was opted out of AI on screens only. Mantle's `extend-entity` marks
    `FormResponseAnswer.valueText` `ai-opt-out`, so every form answer (scorecards, exit interviews, reviews, case feedback
    comments, tax statement answers) is left out of Assist's data reads and refused by Update with AI. Spec: Recruiting
    (`propose#AiFieldValue` on it refused).
  - **R7 (left out of the phase, built).** "Create application" from a chat message: `create#ApplicationFromChat` and Chat's
    message action (`ChatServices.create#FromChat` kind application): a recruiter makes the sender's application to the room's
    opening (a JobOpening's room), else the open opening whose plus tag the message names (+tag), else the one open opening they
    own; once per message (`EmploymentApplication.sourceKey`); never the recruiter's own message (`NOT_AN_APPLICANT`); the message's
    files the application's files, none shared. Spec: Recruiting (made once, a reader and a non-member refused, the own message
    refused).
  - **R8 (left out of the phase, built).** Openings join People's lifecycle participant: `find#OwnedApprovals` lists the draft and
    open openings the user owns (`opening:id`, transferable) and `transfer#ApprovalOwner` hands one to a new owner who works for the
    employer with an enabled account (`NOT_EMPLOYED`, `OWNER_INVALID`), audit-logged with the reason; the offboarding operator or a
    recruiter who changes the employer's openings. Spec: Recruiting.
  - **R9 (left out of the phase, built).** The exit interview a checklist step links: `PeopleServices.submit#ExitInterview` (one of
    the task's people records the leaver's answers once on the employer's published exit interview form, a FormInvitation naming
    the leaver and the task, no link) and `get#ChecklistTask`'s `exitInterview` (the answers for the task's people and HR of the
    employer, never the leaver); WorkItemDetail's People box shows it (template/PeopleWorkItem.xml, `submitExitInterview`), opted out
    of AI. Spec: PeopleChecklists.
- Findings, numbered by the lead F282 to F287 in order:
  - a recruiter's `create#Application` by email, and mail or chat intake, attach the application to the existing person of that
    exact address (any person not disabled or private, an employee or a customer of another organization too), whose name the
    recruiter then reads: whether an address belongs to someone, and their name;
  - a forged mail sender still files an application in a real person's name (and gives them the Applicant role) when the opening
    takes mail on its intake account; the same sender authentication ask as P15's;
  - FormResponseAnswer's opt-out covers every app's form answers, case feedback comments and tax statement answers included: an
    instance-wide choice Mantle makes, recorded here for the user;
  - an exit interview has one form per employer (the only published one) and one recorder per task; a leaver answering
    themselves needs the step assigned to the Employee role, which the protected step's rule hides from them;
  - My interviews keeps a cancelled or scored interview 30 days; an interviewer reads the interview's attendees (the candidate
    too, when invited) on Commons' EventDetail, as any attendee does;
  - a self-service interviewer's scorecard link is SelfService alone; no notification names the scorecard to submit (the event's
    invitation does).
- Tests (release binary from the main checkout, `--nobuild`, this phase's runtime): after the rebase Recruiting, FormDefinitions,
  CaseFeedback 11 of 11 and PeopleRecruiting, PeopleAccess, PeopleExpenses 27 of 27; Mantle Recruiting, FormDefinitions,
  PeopleChecklists, PeopleApprovals, CaseFeedback, SupportTemplates, SupportPortal, SupportCases 41 and 8 of their features, then
  Recruiting, FormDefinitions, CaseFeedback, PeopleChecklists, PeopleApprovals, SupportTemplates 29 of 29 after the last change
  (Recruiting 2.7 s: 0.47, 0.38, 0.68, 0.21, 0.47, 0.45; FormDefinitions 0.97 s; PeopleChecklists' exit interview 0.51 s); BOSS
  PeopleAccess, PeopleSelfService, PeopleLifecycle, PeopleExpenses, CustomerServiceFeedback, CustomerServiceReports,
  CustomerServiceTemplates, CustomerServiceAccess, RecordFiles, Chatter, WorkItemDetail and Chat 130 of 130, then PeopleRecruiting,
  PeopleAccess, PeopleExpenses, PeopleSelfService, CustomerServiceFeedback, CustomerServiceAccess, CustomerServiceTemplates and Chat
  77 of 78 (PeopleRecruiting's My interviews count assumed it ran alone; fixed) and PeopleAccess with PeopleRecruiting 24 of 24
  (PeopleRecruiting 0.52 s: 0.08, 0.12, 0.32; PeopleAccess's P16 feature 0.56 s). One-off renders, not kept: ApplicantDetail as the
  recruiter (Choose what the panel reads) and as a panel member (the shared file, not the other, Your scorecard, no stage; qvt and
  tui), SelfService under Commons with My interviews, MyInterview in tui and refused content to a reader, WorkItemDetail with an
  exit interview to record and recorded (qvt, tui). `moqui lint --screens` (release binary): 136 flagged sites, none in the screens
  touched. Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, the acceptance suite (PeopleRecruitingUsable's
  panel checks, read and not run, hold on the panel projection: Ines's own interview first, her scorecard alone).
- For the lead:
  - budget share beside the Built note's: mr-mantle about +1.4 s (Recruiting's two features and checks +0.9, FormDefinitions +0.05,
    PeopleChecklists' exit interview +0.5); mr-boss about +0.4 s (PeopleRecruiting's MyInterview feature 0.32, PeopleAccess's P16
    feature +0.2);
  - merge hot spots beside the Built note's (P18 runs beside): mr-mantle `Recruiting.js`, `RecruitingServices.xml`,
    `Checklists.js` (`isTaskParty`, the exit interview before equipment), `PeopleServices.xml` (`get#ChecklistTask`'s out-parameters,
    `submit#ExitInterview`), `Approvals.js` (`findOwnedApprovals`, `transferApprovalOwner`), `PeopleApprovalServices.xml`,
    `FormDefinitions.js`, `FormPublicationEntities.xml`, `PeopleRecruitingEntities.xml`; mr-boss `BossSetupData.xml` (after
    BOSS_PPL_SELF; the lifecycle participant's description), `screen/People.xml` and `screen/Commons/People.xml` (MyInterview),
    `Shared/PeopleSelfService.xml` (header, actions' end, dashboard, the box before My tasks), `Shared/WorkItemDetail.xml` (the
    transition-include), `template/PeopleWorkItem.xml`, `screen-extend/basic-comms/.../Chat.xml`, `ChatServices.xml`,
    `customerservice/Feedback.js`, `ApplicantDetail.xml`, the specs, design-people §3, §5, §12 and usl-inventory;
  - the acceptance PeopleRecruitingUsable and CustomerServiceFeedbackWalk to run with the full suites (panel members now read only
    the shared files; Customer Service's response reader by purpose);
  - for the user's calls: whether opting every form answer out of AI (R6) is wanted beyond People's forms; whether a recruiter
    shares the resume with the panel by default.

### P17 — Offers and hire from an offer

Design §5 OfferDetail, §15 (the offer letter); PE-04, PE-02.

- **Mantle** EmploymentOffer and RecruitingServices `store#Offer` and `change#OfferState` on `PeopleOfferApproval`
  (changed terms invalidate approval; the issued PDF stored); `hire#Employee` consumes an accepted offer once.
- **Screens:** OfferDetail (Offer, OfferDecision), the offer letter in `html-print`, and on the same template
  EmploymentChange's lifecycle letters (design §15), each stored when issued; HireEmployee prefilled from an
  accepted offer.
- **Specs:** Mantle `test/humanres/Offers` (pay terms absent without the grant; an accepted offer hires once; a
  recruiter's offer grants no account or payroll right).
- **Usable when** (`acceptance/People/PeopleOffersUsable`): a recruiter drafts an offer, HR approves, the candidate's
  acceptance is recorded, and HR hires from it; a second hire from the same offer is refused.

**Built Nov 12 (P17).** mr-mantle b2b73796, mr-boss (branch `ppl/p17`).
- Checked first (the code over the plan): P5's approval pattern (one approve and one refuse handler per topic over the domain's
  decision, F110; `record#Decision`'s revision and self checks; routing by `chooseRules`), P6's hire (`planHire`, `hire#Employee`'s
  operation key, `personAdmitted`, the draft record's whitelist), P9's `assign#Schedule` (a schedule from the hire's first day
  changes that assignment in place), P15's printed claim (`ec.resource.xslFoTransform`, with the html page where there is no PDF
  engine) and P16's applications and sharing. Found: with no rule a request about a person routes to their manager, so an offer
  (about an applicant, who has none) would wait unresolved; P16's applications name their employer and not a position, so P6's
  person search and admission (an applicant "to one of their positions", by `EmploymentApplication.emplPositionId`) found none of
  P16's applicants by name and refused them by id; the test runtime has a PDF engine (a stored letter is a PDF, its text read with
  `ec.resource.extractText`).
- Mantle:
  - `entity/PeopleRecruitingEntities.xml`: `mantle.humanres.recruitment.EmploymentOffer` (the dated terms of one application: a seat
    of its opening, the department, manager, work location, working schedule, start, optional end, expiry and a note; the pay
    amount, currency and payroll frequency; the state Draft, Waiting for approval, Approved, Issued, Accepted, Declined, Hired,
    Withdrawn with its flow, an issued one past its expiry read as Expired; the answer, the signed acceptance, the hire it made; key
    fields audit-logged) and `mantle.humanres.employment.EmploymentLetter` (a letter issued: of an offer or an employment change, its
    stored file, type, whether it holds pay, who issued it and when); the kind `PakOffer`; `data/PeopleRecruitingSetupData.xml` the
    topic `PeopleOfferApproval` (`approve#Offer`, `refuse#Offer`; its title names the position, never the person or pay);
  - `RecruitingServices` over a new module `Offers.js`: `find#Offers`, `get#Offer` (the approval summary, the opening's seats for an
    editor, an accepted offer's hireTerms for an HR editor), `store#Offer` (a recruiter with PEOPLE_RECRUIT_EDIT or an HR editor
    drafts and changes the terms, checked as the hire checks them (Employment.js `checkTerms`, exported) and the seat one of the
    opening's; the pay only a payroll editor's; changed terms make a waiting or approved offer a draft again and supersede its
    approval; `APPLICATION_STAGE`, `OFFER_OPEN`, `OFFER_LOCKED`, `POSITION_NOT_OF_OPENING`, `PAY_INCOMPLETE` and the pay checks),
    `change#OfferState` (submit, approve, refuse, withdraw, issue, accept, decline under the offer's lock; an action done answers as
    it is), `approve#Offer` and `refuse#Offer`, `get#OfferLetter` (the stored letter, the one with pay for a payroll reader alone; the
    preview before) and `get#OfferEvidence`. Readers: a recruiter, an HR reader and a payroll reader of the employer, and the
    approver of the step waiting (without pay). Pay is absent without PAYROLL_VIEW on every path (the offer, the list, the
    preview, the stored letter, the notice, the summary, the hire's terms);
  - a new module `Letters.js`: the one letter template (the employer, date, reference, addressee, title, paragraphs, terms,
    closing and signer, every value escaped; a preview marked as a draft), its storage (rendered once when issued, stored as the PDF
    or the html-print page, read from storage after) and the lifecycle letters of an applied change (a hire's confirmation, a
    transfer, a manager change, a leave of absence, a return, a separation; never the change's reason): `PeopleServices`
    `get#EmploymentLetter` (an HR reader's: the stored letter or the preview) and `issue#EmploymentLetter` (an HR editor's, once per
    change, the change locked; `CHANGE_NOT_APPLIED`, `LETTER_NOT_OFFERED`); `find#EmploymentChanges`' rows say whether a change's
    letter is offered and issued;
  - Approvals.js: the kind `PakOffer` and a kind's own default route (`defaultRole`): with no rule an offer goes to the employer's HR
    officers (`ParHr`, "No rule: HR decides"), never the recruiter who submitted it or the applicant;
  - Employment.js: `hire#Employee` and `preview#Hire` take `employmentOfferId` (the HireTerms interface and the draft whitelist):
    the offer locked for the hire, its employer and applicant (admitted by the offer), its terms where none is given, its working
    schedule from the first day (`assign#Schedule`), and consumed exactly once (`OFFER_USED`, `OFFER_NOT_ACCEPTED`, `OFFER_PERSON`,
    `OFFER_EMPLOYER`, `OFFER_APPLICATION_CLOSED`; the offer and its application Hired; no pay and no account but HR's own Request an
    account); the hire's person search and admission read P16's applications by employer as well as by position;
  - Recruiting.js: Offer as a stage needs an open offer (drafting one moves the application there); `get#Application` answers a
    recruiter the open offer, whether a new one is made and the opening's seats; the user's call of Nov 12 (§4): a resume is shared
    with the interview panel when attached (`create#ApplicationContent` shares an `EactResume` file unless told not to; mail and
    chat intake share the resume they keep), another file only when a recruiter shares it, and the recruiter can stop sharing it.
- BOSS:
  - `People/Staffing/OfferDetail` (out of the menu): the record header with one primary by state (Submit, Approve, Issue, Record
    acceptance, Hire), under More Refuse, Declined by the candidate, Edit terms, Set pay (payroll's), Preview the letter, the issued
    letter and Withdraw; Terms (the pay a payroll reader's, else "Set by payroll"), the candidate's answer with the signed letter,
    Letter and Approval; `People/Staffing/OfferLetter` (the offer letter's html-print preview); `People/Employees/EmploymentLetter`
    (a change's lifecycle letter's html-print preview, HR's: a member of `BOSS_PPL_EMPLOYMENT`);
  - ApplicantDetail: Create offer (the primary once a scorecard is in, Schedule interview the primary before) and Offers; Shared with
    the panel's wording for the resume default;
  - HireEmployee: Identity's Accepted offers to hire from and Start from the offer (the draft from the offer's hireTerms), the steps
    passing `employmentOfferId` to `preview#Hire` and `hire#Employee`; OfferDetail's Hire opens Identity with the offer;
  - Employee360's Employment changes: Issue letter (with its preview) and Letter (the stored one), HR's under People
    (`issueLetter`, `employmentLetter`);
  - People.js link paths; People.xml's notification topic; Approvals lists `PeopleOfferApproval`; BossSetupData the topic's link to
    OfferDetail and the EmploymentLetter screen in `BOSS_PPL_EMPLOYMENT`.
- Specs: Mantle `test/humanres/Offers` (4 features, stepwise, 3.7 s: 0.74, 0.48, 1.90, 0.58: a recruiter's draft without pay, the
  reader and another employer refused, a seat not of the opening refused, the pay payroll's alone and absent from the recruiter's
  and HR's offer, the list and the letter's preview; the approval to HR, the recruiter's own decision `SELF_APPROVAL`, changed terms
  a draft again and the old notice no longer decided, a refusal with its reason, the approval; the issued letter stored once, the
  recruiter refused the letter holding pay, the payroll reader's letter unchanged in bytes after the opening and the person changed,
  `OFFER_LOCKED` after issue, the acceptance, the recruiter refused the hire, `OFFER_PERSON`, the preview from the offer, the hire,
  its retry, `OFFER_USED`, one employment, no account, no salary row, no account asked, the offer's schedule on the assignment; the
  hire's lifecycle letter previewed, issued once and read from storage, refused to the recruiter); Recruiting gains one feature (0.10
  s: a resume shared when attached, a cover letter not, the recruiter stopping it) and its mail feature the resume shared. BOSS
  `test/People/PeopleOffers` (2 features, 1.75 s: OfferDetail's one qvt render as the recruiter (Submit, "Set by payroll", the
  amount absent); ConfirmHire's one qvt render as the HR officer from the accepted offer's draft (the applicant, From the accepted
  offer, no pay), the draft discarded and no hire made, so Retail's vacant seat stays vacant). `PeopleAccess` gains one feature (0.34
  s: an offer read by Retail's recruiter and refused to the reader with the same parameters and to Retail's recruiter for Services'
  offer; the pay refused to the HR officer with the parameters payroll is answered; the employment letter print HR's, the reader
  refused). Acceptance, written and not run: `acceptance/People/PeopleOffersUsable` (3 features: the recruiter's offer from
  ApplicantDetail, payroll's pay on OfferDetail, submit and the recruiter's own approval refused; HR's approval, the issue with the
  letter payroll's, the acceptance; the hire through Identity's Start from the offer and ConfirmHire's Hire, the second hire
  `OFFER_USED`, no account or salary, the application Hired; on a spec-local seat of Store Operations).
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle Offers, Recruiting, PeopleApprovals,
  PeopleEmployment, PeopleScope, PeopleDirectory, PeopleScheduledChanges, PeopleSchedules, HumanResServices, PeopleChecklists and
  FormDefinitions 60 of 60 (28.1 s of features), then Offers, Recruiting, PeopleApprovals, PeopleEmployment 26 of 26 and
  ExpenseClaims, LeaveRequests, Attendance, PeopleScope, PeopleChecklists 26 of 26 after the last changes; BOSS PeopleOffers,
  PeopleAccess, PeopleRecruiting, PeopleHire, PeopleEmployees, PeopleApprovals, PeopleSelfService, PeopleLifecycle, RecordFiles and
  AdminLifecycle 60 of 60, then PeopleOffers, PeopleAccess, PeopleRecruiting, PeopleHire, PeopleEmployees, PeopleApprovals,
  PeopleExpenses, PeopleSelfService, RecordFiles and Chat 76 of 76. One-off renders, not kept: ApplicantDetail before and after the
  offer (qvt), OfferDetail as the recruiter (tui, html) and HR (qvt, waiting and accepted), OfferLetter (html-print, qvt, tui),
  Identity with the accepted offer (qvt), EmploymentLetter for a manager change (html-print, tui) and Employee360 with Issue letter
  (qvt, tui): no error. `moqui lint --screens` (release binary): 136 flagged sites, none in the People screens. Prettier clean on the
  new and changed JavaScript (People.js was not clean on master and is left so). Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People rows (RecruitingServices' offer services, `get#`/`issue#EmploymentLetter`, `preview#Hire`,
  `hire#Employee` and `find#EmploymentChanges` from an offer and with letters); ss-inventory's P17 note (no baseline form).
- Design edits: design-people (header; §3 SelfService's sharing; §4 HireEmployee and EmploymentChange as built; §5 ApplicantDetail
  and OfferDetail as built; §12 the topic's handlers; §15 the letters row); design-drawers-commons §4 (the `PeopleOfferApproval`
  row: its approve and refuse handlers); §4's resume row notes it is built.
- Findings, numbered by the lead F305 to F315 in order:
  - with no rule an offer is decided by the employer's HR officers (a kind's own default route, `PakOffer`'s `ParHr`): the default of
    a request about a person, their manager, leaves an applicant's offer unresolved; an employer's rules for the kind still route it;
  - a payroll reader of the employer (PAYROLL_VIEW) reads its offers, the applicant's name and terms with the pay, since a payroll
    editor sets the pay on OfferDetail; design §5 said "compensation terms by grant";
  - an issued letter holding pay is read with PAYROLL_VIEW alone, so a recruiter without it issues the letter but cannot open it:
    payroll (or HR holding PAYROLL_VIEW) hands it to the candidate; no delivery of a letter by mail or to the employee's
    self-service is built (design §15 "restricted delivery");
  - expiry is read, not stored: an issued offer past its date reads Expired and takes no answer; nothing moves it and no one is told;
  - the candidate's refusal is Declined (`OfrDeclined`), apart from an approver's refusal, which makes the offer a draft again;
    design §5's "refused";
  - P6 and P16 left a gap this phase closes: P6's person search and admission read applications by position, and P16's name their
    employer; the hire's search now reads both;
  - a hire from an offer takes the offer's terms only where the wizard gives none, and HR may change them in the steps: the hire
    records what HR confirmed, the offer what was offered; the offer's working schedule makes an `EckSchedule` change beside the hire;
  - a withdrawn or declined offer leaves its application at Offer, for the recruiter to refuse or withdraw it; an offer of an
    application closed since is not hired from (`OFFER_APPLICATION_CLOSED`) but stays accepted until withdrawn;
  - one letter per offer or change: a letter is not issued again (a corrected offer is a new offer after a withdrawal); a change
    withdrawn after its letter was issued keeps the letter; a change dated later has its letter issued before its date;
  - HR finds the accepted offers to hire on the hire wizard's Identity; no notice tells HR an offer was accepted, and there is no
    list of offers apart from an application's;
  - an offer's issue renders its PDF in the request (about a second in the spec).
- For the lead:
  - budget share: mr-mantle about 3.8 s (Offers 3.7 s, Recruiting's new feature 0.1 s); mr-boss about 2.1 s (PeopleOffers 1.75 s,
    PeopleAccess's P17 feature 0.34 s); no client spec;
  - merge hot spots (P18 runs beside): mr-mantle `entity/PeopleRecruitingEntities.xml` (appended), `data/PeopleRecruitingSetupData.xml`
    (appended), `Approvals.js` (the kinds table's end, `chooseRules`, `basisTexts`, the loaders), `Employment.js` (the loaders,
    `draftFields.hire`, `relatedByName`, `personAdmitted`, `planHire`, `hireEmployee`, `findEmploymentChanges`, `changeRow`, the
    exports), `Recruiting.js` (`stageProblem`, `getApplication`'s recruiter branch, `keepFiles`, the header), `PeopleServices.xml`
    (HireTerms, hire#Employee's description, two services appended), `RecruitingServices.xml` (appended, `create#ApplicationContent`);
    mr-boss `data/BossSetupData.xml` (appended at its end), `screen/People.xml` (the providers' end), `People/Approvals.xml`,
    `People/Staffing.xml`, `Staffing/ApplicantDetail.xml`, `Employees/HireEmployee.xml` and its three steps, `Shared/Employee360.xml`
    (two transitions, the change rows, the row actions), `service/ironstone/people/People.js` (linkPaths' end),
    `test/People/PeopleAccess.spec.js` (the header, the appended feature), the inventories, design-people (header, §3, §4, §5, §12,
    §15), design-drawers-commons §4, this file (§4's resume row);
  - acceptance to run with the full suites: PeopleOffersUsable (new), PeopleRecruitingUsable (a mail application's resume is now
    shared with the panel; read, it asserts nothing of the sharing) and PeopleHireUsable (the hire's code changed);
  - for the user's call: who decides an offer when no rule names anyone (built: the employer's HR); whether payroll readers read
    offers (built) or pay goes in by another path; who delivers an issued letter holding pay (built: payroll, no mail delivery);
    whether employees read their own lifecycle letters in self-service (not built).

**Review Nov 12 (P17).** A fresh review of `git diff master...ppl/p17` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §5 OfferDetail and ApplicantDetail, §4 HireEmployee, §12's `PeopleOfferApproval` and §15 the letters; the user's four calls of
Nov 12 built and recorded in §4; fixes committed apart per repository ("People P17 review: …"; mr-mantle beef6ee5). Both branches were
first rebased onto master after P18 and P15's follow-up merged: mr-mantle cleanly (HumanResourcesEntities' EmplPositionClassSkill key,
Approvals.js, Employment.js, Recruiting.js and PeopleServices.xml merged without a conflict); mr-boss with BossSetupData (P18's
Development grants and P17's topic and EmploymentLetter member), People.xml's notification topics, People.js linkPaths, Employee360's
header, PeopleAccess's header and a P17 feature apart from P18's, design-people's header and §4's resume row (P17's built version
beside P18's three rows), each keeping both sides; Offers, Recruiting, PeopleEmployment (18 of 18) and PeopleOffers, PeopleAccess,
PeopleHire, PeopleSkills (31 of 31) passed after it.
- Checked and found sound:
  - pay terms: `offerRow` (get#Offer and find#Offers), the letter's preview, the stored letter (PERMISSION_DENIED without
    PAYROLL_VIEW), the approval's notice, title and summary (position, opening, names; never pay), `hireTerms` and the hire (no
    salary row) carry pay only for a payroll reader of the employer; offers are in no palette, export, Chatter or record panel
    (`EmploymentOffer` is no People record host), and the raw entity stays refused (PeopleAccess's mantle.humanres paths);
  - an accepted offer hires once: `offerForHire` locks the offer, `hireProblem` refuses OFFER_USED, OFFER_NOT_ACCEPTED, OFFER_PERSON,
    OFFER_EMPLOYER and OFFER_APPLICATION_CLOSED, `consumeOffer` marks it Hired with the hire's employment; hire#Employee is still
    `editorScope("Hiring")`'s (a recruiter is refused); P6's rules and specs hold (PeopleEmployment, PeopleHire pass; the hire's
    working schedule an `EckSchedule` beside it);
  - changed terms (pay included) make a waiting or approved offer a draft and `sourceChanged` supersedes the approval, and
    `record#Decision` refuses a decision on a superseded or earlier revision; the decision is taken under the offer's lock;
  - a recruiter's offer grants no account or payroll right: no account is asked but by HR's own Request an account, no
    `EmploymentSalary`; a recruiter sets no pay (PERMISSION_DENIED) and reads none;
  - the issued letter is rendered once under the offer's (or the change's) lock and read from storage after (the spec's digest
    unchanged after the opening and person change);
  - the hire's person search (P6's call of Nov 11: names only for people related to the employer, exact email otherwise): the change
    adds the applicants of the employer's own applications (`EmploymentApplication.organizationPartyId`, P16), who are applicants to
    it as P6's position applicants were; nobody outside the employer is found by name, and a person chosen by id is admitted by
    the same rule or as the offer's applicant;
  - with no rule a `PakOffer` request goes to the employer's HR officers (`defaultRole`, basis "No rule: HR decides"); other
    kinds' defaults are unchanged.
- Fixes:
  - **R1 (the user's call of Nov 12; medium).** No delivery of an issued letter was built: a recruiter without PAYROLL_VIEW issued a
    letter holding pay and could not hand it over. Issuing now emails the stored letter to the applicant's address as an attachment
    once the issue commits: `RecruitingServices.send#OfferLetter`, run by the tx-commit rule `PeopleOfferLetterEmail`
    (`service/PeopleRecruiting.secas.xml`) as the issuer, who need not read it; template `PEOPLE_OFFER_LETTER` from the employer's
    address (EmailPrimary, else EmailWork), the message naming the position and expiry, never pay; once (a letter sent or waiting
    in the mail queue answers repeated; the offer locked while sending). The outcome is on the offer (`letterSendStatus` sent,
    queued or failed, `letterSendDate`, `letterSentTo`, `letterEmailMessageId`, `letterSendError`) and on OfferDetail's Letter box
    without the content (the address for recruiters and HR); a failure (no applicant address, no sender, a failed send) is
    recorded and logged, never undoing the issue, and Send the letter again (an offer editor's) retries it. Spec: Offers (the
    send failing without the employer's address with the offer still issued, the reader refused, the recruiter's send queued and
    a second answered repeated, the message's address and subject and no pay in its body).
  - **R2 (the user's call of Nov 12; medium).** Employees did not see their own letters. SelfService's My letters (both mounts):
    `PeopleServices.find#MyLetters` (no party: the caller's own issued lifecycle letters) and `get#MyLetter` (the stored file,
    whole, pay included; another person's or an offer's letter RECORD_UNAVAILABLE), the transition `myLetter` and both services in
    `BOSS_PPL_SELF` (F28's non-inheritable pattern). Specs: Offers (the hired person's one letter listed and read, the offer's
    letter and another employee's view refused), PeopleAccess (Tomas's letter by the services and the Commons transition with
    artifact authorization on, Ines's refused to him, the reader refused his).
  - **R3 (high, confidentiality).** `get#OfferEvidence` gave the candidate's signed letter (a copy of the letter holding pay) to
    every reader of the offer: the recruiter, HR and the approver read the pay that `get#OfferLetter` refused them. It is now
    PAYROLL_VIEW's when the offer holds pay (`evidenceRestricted`; OfferDetail says payroll reads it), and the file downloads as an
    attachment rather than inline (an uploaded HTML file was served inline in the app's origin); a name loses leading dots. Spec:
    Offers (the recruiter refused, payroll read).
  - **R4 (medium, no self-approval).** Only who submitted an offer and the applicant were kept from deciding it: an HR officer who
    drafted an offer that a recruiter submitted approved their own. Approvals.js takes a kind's `selfPartyIds` (PakOffer: the
    offer's creator) into the route's exclusions and `record#Decision`'s SELF_APPROVAL. Spec: Offers (HR's draft submitted by the
    recruiter, HR's approval SELF_APPROVAL).
  - **R5 (medium, P16's, found here).** A self-service panel member could not download a file shared with the panel:
    MyInterview's `sharedFile` sent the file with authorization on, and the non-inheritable `BOSS_PPL_INTERVIEW_SELF` does not reach
    `moqui.resource.DbResource` (a 500). It and My letters send the file Mantle admitted with authorization off. Spec:
    PeopleRecruiting (the shared file downloaded as the employee under Commons; a 500 on the phase's code).
  - **R6 (low).** A Hire sent twice at once from an accepted offer: the second waited on the offer and answered OFFER_USED, not the
    first hire, since its operation key was checked before the lock. hire#Employee locks the offer first.
  - **R7 (low).** `get#EmploymentLetter` read a lifecycle letter holding pay without PAYROLL_VIEW (none holds pay today); it now
    refuses one as `get#OfferLetter` does.
- Findings, numbered by the lead F316 to F319 in order:
  - the email goes from the employer's EmailPrimary (else EmailWork) address; an employer with neither, as the demo employers may
    be, records "no email address to send from" and the recruiter sends it again once one is added; a reply goes to that address;
  - Send the letter again follows a failure only: a letter sent or queued is not sent again (a candidate who lost it is sent a copy
    by payroll, or a new offer);
  - My letters lists the lifecycle letters alone; a hired person's offer letter (addressed to them as an applicant) is not in it;
  - an HR officer reads an employment's lifecycle letters under Employee360 and the employee in self-service; the letter is
    never on the person's Party record or files;
  - R5's pattern: a screen under a non-inheritable self-service grant that sends a stored file needs the file sent with
    authorization off after its service's check; the P15 and P18 self-service files go through inheritable grants and are not
    affected.
- Tests (release binary from the main checkout, `--nobuild`, this phase's runtime): after the rebase Offers, Recruiting,
  PeopleEmployment 18 of 18 and PeopleOffers, PeopleAccess, PeopleHire, PeopleSkills 31 of 31; after the fixes Offers, Recruiting,
  PeopleEmployment, PeopleApprovals, ExpenseClaims 32 of 32 (Offers 4.3 s: 0.73, 0.66, 2.07, 0.81) and PeopleOffers, PeopleAccess,
  PeopleHire, PeopleSkills, PeopleRecruiting, PeopleSelfService, PeopleApprovals 43 of 43 (PeopleAccess's new feature 0.26 s).
  `moqui lint --screens` (release binary): none flagged in the People screens. Prettier clean on the changed JavaScript. Not run:
  `./moq test-apps`, the acceptance suite (PeopleOffersUsable unchanged; its issue now sends the letter, which it does not assert)
  and the client walk PeopleHireWalk (Identity's Accepted offers box shows only with an accepted offer).
- For the lead:
  - budget share beside the Built note's: mr-mantle about +0.6 s (Offers' new checks and the issue's worker wait); mr-boss about
    +0.3 s (PeopleAccess's my-letters feature 0.26 s, PeopleRecruiting's download);
  - merge hot spots beside the Built note's (P19 runs beside): mr-mantle `Approvals.js` (`requestOf`, `selfOfSource`, `resolve`'s
    self, `recordDecision`), `Offers.js`, `Letters.js`, `Recruiting.js`'s exports, `PeopleServices.xml` (two services appended),
    `RecruitingServices.xml` (send#OfferLetter appended), `PeopleRecruitingEntities.xml`, `PeopleRecruitingSetupData.xml`, the new
    `service/PeopleRecruiting.secas.xml`; mr-boss `BossSetupData.xml` (`BOSS_PPL_SELF`'s artifacts), `Shared/PeopleSelfService.xml`
    (header, a transition, the actions' end, a section before the emergency contacts), `Shared/PeopleMyInterview.xml`,
    `Staffing/OfferDetail.xml`, PeopleAccess (header, an appended feature), PeopleRecruiting, design-people §3, §5, §15,
    usl-inventory and §4 here;
  - the user's calls of Nov 12 (§4): with no rule HR decides an offer and payroll readers read offers (as built); the letter
    emailed to the applicant (R1); employees' own letters in self-service (R2).

### P18 — Skills and qualifications

Design §10 SkillsMatrix, Qualifications, JobClassDetail's Requirements (levels), Employee360's SkillsAndReviews
(skills, qualifications, resume); PE-14, PE-20 (the matrix).

- **Mantle** PartySkillEvaluation, the refined PartyQualification (identity-document and work-permit types with a
  required expiry) and PartyResume from the commented sketches (F6), `EmplPositionClassSkill`'s level, required
  flag and dates and `WorkEffortSkillStandard.minimumSkillLevel` (F7, F8), and
  `mantle.humanres.DevelopmentServices`: `get#SkillsMatrix`, `store#Skill`,
  `find#Qualifications`, `store#Qualification`, `verify#Qualification`, `check#Qualifications` (qualified,
  expiring, missing or expired at a date, with no certificate data), `get#PersonDevelopment`; expiry reminders;
  the qualification's content host (PE-01). `check#Qualifications` and the skill standard's level are what
  Maintenance's assignment reads (§7).
- **Screens:** SkillsMatrix (`.qvue` matrix with its TUI list; FindAvailable over `find#StaffingCandidates`),
  Qualifications; the topic `QualificationExpiring` and the Today source "my qualification expiring".
- **Specs:** Mantle `test/humanres/Qualifications` (an expired or unverified certificate fails a verified
  requirement; a self-declared skill does not satisfy one; the staffing answer holds no number or file); BOSS
  `PeopleSkills` (the matrix and its TUI twin).
- **Usable when** (`acceptance/People/PeopleSkillsUsable`; design §14.3 "Qualifications and reviews", its first
  half): an employee submits a certificate, a verifier accepts it, the matrix shows the gap closed, and a staffing
  reader sees valid or expiring and nothing else.

**Built Nov 12 (P18).** mr-mantle 74a7d62f, mr-boss (branch `ppl/p18`).
- Checked first (the code over the plan): F6 (PartyQualification, PartyResume and the review and training sketches inside one XML
  comment, the qualification keyed by person, type and date with a two-value verification status), F7 (`WorkEffortSkillStandard`
  skill, people, duration and cost), F8 (`EmplPositionClassSkill` class and skill only; PartySkill rating, level, start and
  experience), P4's `store#JobRequirement` (a delete on remove) and `classRows`' count of every row, P5's `SkillLevel` values (their
  number in `enumCode`) and `Enumeration.thruDate`, P2's employment host (F66: `get#RecordLinkInfo`'s map and visibility branch,
  RecordFiles' `get#ContentType`, no Records-drive folder) and P13's Today on both roots; Projects' `find#StaffingCandidates` (its
  pool every time keeper, skill holder and role holder, its rating `rating ?? skillLevel`, open to whoever calls it); the demo's
  `people.develop` (BOSS_PEOPLE_DEVELOP, an agent of Retail, PEOPLE_DEVELOP_VIEW and _EDIT) and its four skills and four classes.
  Also: there was no Development area; a self-service employee reaches People's time area by its own grant but not People's
  RecordFiles panel; design §10 names `store#WorkEffortReminders` for expiry and the plan a `QualificationExpiring` topic.
- Mantle:
  - `entity/HumanResourcesEntities.xml`: PartySkill gains `sourceEnumId` (`SkillSource`: `SksSelfDeclared`, `SksEvaluated`; empty
    for a level recorded before People), `partySkillEvaluationId` and `evaluatedDate`; `PartySkillEvaluation` (each self-declaration
    and evaluation: level, date, assessor, evaluating user, evidence, a qualification it rests on; kept, never changed);
    `PartyQualification` refined (its own id; type, title, issuer, reference, issued and expiry dates, `verificationStatusId`
    audit-logged: `QlVerPending`, `QlVerVerified`, `QlVerRejected`, `QlVerRevoked`; who submitted and verified it and when, the
    decision's reason, the qualification it renews, the expiry last reminded; the types Degree, Certification, Licence, Work
    experience, Identity document, Work permit); `PartyQualificationContent` (the content host, `QualificationContentType`);
    `PartyResume` refined to resume lines (`ResumeLineType`, organization, role, dates); `EmplPositionClassSkill.minimumLevel`,
    `qualificationTypeEnumId`, `requiredFlag`, `fromDate`, `thruDate`; `entity/WorkEffortEntities.xml`:
    `WorkEffortSkillStandard.minimumSkillLevel`. The review and training sketches stay commented for P19 and P20;
  - `mantle.humanres.DevelopmentServices` over a new module `Development.js`: `find#Qualifications` (mine, a person, one, or everyone
    the scope reaches; by state waiting, valid, expiring within thirty days, expired, attention (verified, expiring or expired, not
    renewed), type with its child types and name; paged with an export; each row at the reader's level: the person and HR of an
    employer of theirs every field, development all but an identity document's or work permit's reference, a manager and other
    staff readers verified ones only as type, dates and validity), `store#Qualification` (the person, an HR editor, or a development
    editor for a type not restricted; `TYPE_REQUIRED`, `TYPE_INVALID`, `VALUE_ENDED`, `EXPIRY_REQUIRED` for a restricted type,
    `DATES_INVALID`, `RENEWAL_INVALID`, `QUALIFICATION_DECIDED` (a verified one is renewed, never edited), `REVISION_CHANGED`),
    `verify#Qualification` (verify, reject, revoke at the revision read; an HR editor, or a development editor for a type not
    restricted; `SELF_APPROVAL`, `NOT_PENDING`, `NOT_VERIFIED`, `REASON_REQUIRED`), `check#QualificationAccess`,
    `create#QualificationContent` and `save#QualificationContentFile` (the content host: the person and HR read the files; the
    person while it waits or was rejected and an HR editor add them), `check#Qualifications` (the staffing answer: per requirement of
    a job class, a work effort's skill standards or one skill and type, else each person's own class's, at the planned date,
    qualified, expiring, missing or expired with why, and the person's worst required state; a self-declared level and an
    unverified, rejected or revoked certificate meet nothing; a certificate requirement with no least level is met by the valid
    verified certificate alone; no reference, issuer, title, decision reason or file; a person outside the caller's People scope
    `unavailable` and nothing else), `store#Skill` (a self-declaration, or an evaluation by a development editor reading the person
    as development or manager; `LEVEL_INVALID`, `DATE_INVALID`, `QUALIFICATION_INVALID`, `REVISION_CHANGED`; PartySkill takes an
    evaluation, and a self-declaration only over another or none), `get#SkillsMatrix` (development's and HR's employers' current
    employees and a manager's reports, by employer, unit and the units under it, job class, skill and name, paged by person; columns
    the class's requirements, else the page's classes' and the skills held; each cell's level and met, gap, held or none with why;
    `scopePartyIds` for a staffing search), `get#PersonDevelopment` (Employee360's region: skills, qualifications at the reader's
    level, resume lines for the person, HR and development, what the caller may change; `checkOnly`), `store#ResumeLine` and
    `send#ExpiryReminders` (the daily job `send_QualificationExpiryReminders`: once per expiry, a verified qualification expiring
    within thirty days and not renewed, the `QualificationExpiring` topic to the person's accounts, never the reference; each in its
    own transaction, a failure logged and the rest going on);
  - `PositionServices.store#JobRequirement` (Positions.js): a requirement's least level (`LEVEL_INVALID`), qualification type
    (`TYPE_INVALID`, `VALUE_ENDED`), required or desired and start; `change` at the requirement's revision; remove ends it (kept),
    a skill required again reopens its row; `get#JobClass` lists the requirements in effect with their terms and revision and
    `find#JobClasses` counts only those; `Employees.js titlesOf` also answers the seat's job class;
  - `get#RecordLinkInfo` (CommunicationServices.xml): the qualification host's content map entry and its visibility branch (the
    person and HR, for every caller); `Lookups.js`: the `QualificationType` family; `data/PeopleDevelopmentSetupData.xml`: the
    `QualificationExpiring` topic ("Your {type} expires {date}") and the job;
  - owner contract with Projects: `ResourceServices.find#StaffingCandidates` takes `partyIdList` (the pool bounded to it) and
    answers `skillSelfDeclared`; Projects' callers pass neither.
- BOSS:
  - Screens: `People/Development` (menu 12, "Skills & training", `sym_o_school`): `Development/SkillsMatrix` (the default; a
    `.qvue` matrix, SkillsMatrix.qvue, over the transitions `matrix` (get#SkillsMatrix), `evaluateSkill` (store#Skill, a cell's
    dialog) and `findAvailable`; a list of cards on a phone; the terminal twin `Development/SkillsMatrixTui`, a row per person and
    skill with Evaluate a skill and Find available) and `Development/Qualifications` (FindQualifications, QualificationList with the
    state chips, Add qualification the primary, a row's Verify, Reject, Revoke, Change, Renew and Files, the Files box the
    qualification's RecordFiles); JobClassDetail's Requirements gain At least, Proved by, Required or Desired, From, Change and Remove
    (ended) and the header links the skills matrix; Employee360's Skills and reviews under People (skills, qualifications, resume
    lines with Add resume line and Remove); SelfService's My qualifications; the root: the keys `g k` and `g q`, the
    `QualificationExpiring` topic, the record panels admitting `PartyQualification`;
  - `ironstone.people`: Today's my qualification expiring (`find#Qualifications`' attention, the user's own, PEOPLE_SELF_SERVICE,
    opening Qualifications; on both roots), `find#AvailablePeople` (Find available: the staffing search bounded to the matrix's
    people, the cost rate only for PAYROLL_VIEW), the choices `skillTypes`, `skillLevels` and `qualificationTypes`, the links,
    `get#SelfServiceContext`'s `qualificationsUrl`, `get#Employee360Context`'s `showsDevelopment`; Commons' `get#RecordLink`
    (People.js `qualificationLink`), RecordFiles' `get#ContentType` and Chatter's record title for a qualification;
  - `data/BossSetupData.xml` (appended): `BOSS_PPL_DEVELOPMENT` (the area, an inheritable ALLOW for self-service), `BOSS_PPL_SKILLS`
    (the matrix and its twin: ALWAYS for develop, HR and the managers, DENY for the root user group and self-service),
    `BOSS_PPL_FILES_SELF` (Shared/RecordFiles.xml for self-service, so the employee attaches a certificate under People), the topic's
    link; demo (`BossPeopleDemoData.xml`, appended): the first aid skill, the first aid and electrical safety certificate types, the
    classes' requirements with levels and certificates, evaluations and levels of Tomas (point of sale self-declared, no first aid
    certificate: his gaps), Rafael (with a verified first aid certificate and work permit), Hannah and Kenji (a verified electrical
    safety certificate).
- Specs: Mantle `test/humanres/Qualifications` (4 features, stepwise, 2.4 s: 0.48, 0.77, 0.65, 0.48: a requirement's level,
  certificate, desired, change at its revision and end kept; a self-declared skill, a missing and a waiting certificate missing, an
  evaluation and a verified certificate qualified, expiring at 185 days and expired at 220, the person's own verification
  `SELF_APPROVAL`, a work effort's level, the staffing answer holding no number, issuer, title or file, another employer's caller
  `unavailable`; a work permit's expiry required, its number the person's and HR's and not development's or the manager's, only HR
  verifying it, its files the person's and HR's, `get#RecordLinkInfo`; the matrix against the class, the reader refused, the
  manager's reports, a reminder sent once, a renewal ending the attention, the manager's part of the development record). BOSS
  `test/People/PeopleSkills` (3 features, 0.65 s: 0.29, 0.08, 0.28: SkillsMatrix's one qvue render and its transitions' contract as
  the learning administrator, Tomas's two gaps, an evaluation closing one, Find available bounded to Retail; SkillsMatrixTui's one
  tui render as HR; Qualifications' one qvt render as HR with the work permit's number, the three choices with a selected value off
  the page, the manager's development record). `PeopleAccess` gains one feature (0.51 s: the matrix opened by develop, HR and the
  manager and refused to the reader and the employee; a verified qualification revoked by the development administrator, the reader
  refused `PERMISSION_DENIED` with the same parameters, Services' refused to Retail's development administrator; the employee's
  Qualifications by the area's grant), its menu feature the Development group and the employee's context the new link (PeopleSpecLib:
  the menus, `developmentMenu`, `readerDevelopmentMenu`, the keys, the P18 ids); PeopleEmployees' Employee360 render checks Skills and
  reviews; Mantle PeopleApprovals' families list gains `QualificationType`. Acceptance, written and not run:
  `acceptance/People/PeopleSkillsUsable` (3 features: Tomas submits his first aid certificate from Qualifications and his gap
  stays, waiting; the learning administrator verifies it from Qualifications, Tomas refused his own, and the matrix shows it met; his
  manager reads its kind and validity without number or issuer, on the service and the page, and the directory reader's staffing
  check answers qualified with no number, issuer or title).
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle Qualifications, PeoplePositions,
  PeopleApprovals, WorkResources, HumanResServices, PeopleDirectory, RecordLinks and RecordVisibility 62 of 62 (mr-mantle 14.6 s of
  features), and after formatting Qualifications, PeopleApprovals, PeoplePositions, WorkResources and RecordLinks 42 of 42 (11.4 s);
  BOSS PeopleSkills, PeopleAccess and PeopleEmployees 27 of 27 (10.5 s), then PeopleSkills, PeoplePositions, PeopleApprovals,
  PeopleSelfService, PeopleTime, PeopleLeave, Resources, ProjectsAccess, TodayPanel, RecordFiles, Chatter and InsightsRecords 93 of
  93 (15.4 s), and after the last changes PeopleSkills, PeopleAccess, PeopleEmployees, PeopleSelfService, TodayPanel, RecordFiles,
  PeopleApprovals and PeoplePositions 58 of 58 (15.2 s). A one-off spec (not kept): Tomas's submission through Qualifications'
  transition, his Qualifications, People's and Commons' RecordFiles for his certificate (refused under People before
  `BOSS_PPL_FILES_SELF`, open after; HR's open, development's not visible), his Today item, SelfService's link, the record link,
  development's and the manager's Qualifications (the work permit's number absent for both). `moqui lint --screens`: 135 flagged
  sites as before, none in the screens P18 touched, no TUI worklist entry. Prettier clean on the new and changed JavaScript. Not
  run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added table (the DevelopmentServices rows), `store#JobRequirement`'s,
  `find#StaffingCandidates`' and `store#WorkEffortReminders`' Implemented in; ss-inventory's P18 note (no baseline form is mapped).
- Design edits: design-people (header; §1.2 Skills & training; §1.4 Today and the topic; §4 Employee360's Skills and reviews; §5
  JobClassDetail; §10, SkillsMatrix and Qualifications as built; §13 RecordFiles); design-projects (header; §15 StaffAllocation's owner
  contract).
- Findings, numbered by the lead F288 to F297 in order:
  - `EmplPositionClassSkill` keeps its key (class and skill), so a removed requirement is ended in place and a skill required again
    reopens the same row from the new date: the earlier period's dates are not kept; a requirement's dated history needs `fromDate`
    in the key (an entity change);
  - an evaluation needs PEOPLE_DEVELOP_EDIT beside a development reader's or manager's scope; the demo manager holds no
    PEOPLE_DEVELOP_EDIT, so a manager reads their reports' skills and evaluates none (design §10's EvaluateSkill is under "manager
    scope"); whether managers evaluate (the permission in BOSS_PEOPLE_MANAGER, or one of their own) is open;
  - a qualification's files are the person's and HR's (as the phase's brief says), so a development editor verifies a certificate
    whose file they may not open; an identity document or work permit is HR's alone to verify;
  - `check#Qualifications` admits every caller whose People scope admits the person (a directory reader, a manager, the person),
    with the staffing projection; no staffing permission of its own was added, so Maintenance's dispatchers, who hold no People
    permission, need one (or a path of Maintenance's) when its technician assignment adopts it (§7);
  - a requirement with a certificate and no least level is met by the valid verified certificate alone; with a least level the
    level must be evaluated too;
  - a PartySkill level with no source (recorded before People: Projects' skill rows, a rating with no level) counts as recorded by
    staff and meets a requirement at its level; Projects' screens still write PartySkill directly, with no evaluation history;
  - the person is not told when their qualification is verified, rejected or revoked (no topic); Qualifications and Today show it;
  - the expiry reminder is its own topic, not Commons' `WorkEffortReminder` (design §10 and §1.4 changed): a qualification is no
    work effort;
  - Find available's pool is the staffing search's (time keepers, skill holders and role holders) bounded to the scope, so an
    employee who keeps no time and lacks the skill is not proposed;
  - `BOSS_PPL_FILES_SELF` grants Shared/RecordFiles.xml by location, the panel every app mounts; what it shows is decided per record
    by `get#RecordLinkInfo`, so the employee reaches nothing Commons' panel would not show them;
  - a reader who sees no waiting qualification (a manager, a directory reader) is answered `RECORD_UNAVAILABLE` for its decision,
    not `PERMISSION_DENIED`; PeopleAccess checks the permission on revoking a verified one;
  - an HR reader's list across people reads current employees; a former employee's qualifications are read by naming the person;
  - the restricted kinds are fixed in code (`QualIdentityDocument`, `QualWorkPermit` and the types under them): a new restricted
    kind is added under one of them;
  - Home has no expiring-qualifications count (design §1.2's Home list; P29's reports and alerts);
  - the matrix shows at most 24 columns when no class or skill narrows it, reads at most 2000 people, and the staffing check 500.
- For the lead:
  - budget share: mr-mantle about 2.4 s (Qualifications); mr-boss about 1.2 s (PeopleSkills 0.65 s, PeopleAccess's feature 0.51 s);
    no client spec;
  - merge hot spots (P15 and P16 touch several): mr-mantle `entity/HumanResourcesEntities.xml` (the ability entities, the
    `EmplPositionClassSkill` fields; P16 refines the recruitment sketch in the same file), `entity/WorkEffortEntities.xml`,
    `service/mantle/party/CommunicationServices.xml` (the content map and visibility branch beside the employment's; P15 and P16 add
    hosts there too), `Lookups.js` (the families; P16 may add applicant stages), `Positions.js`, `PositionServices.xml`,
    `Employees.js` (`titlesOf`), `ResourceServices.xml` (find#StaffingCandidates), `PeopleServices.xml` (find#Lookups' description),
    `test/humanres/PeopleApprovals.spec.js` (the families list); mr-boss `service/ironstone/people/People.js` (`linkPaths`, the
    self-service links, `choiceSources`, `developmentApps`, `today`, `selfServiceContext`, `availablePeople`, the exports),
    `ContextServices.xml`, `screen/People.xml` (header, panel check, keys, topic), `screen/Shared/Employee360.xml`,
    `screen/Shared/PeopleSelfService.xml`, `screen/People/Staffing/JobClassDetail.xml`, `screen/People/Settings/Lookups.xml`
    (header), `service/ironstone/shared/RecordFilesServices.xml`, `ChatterServices.xml`, `service/ironstone/commons/PaletteServices.xml`,
    `data/BossSetupData.xml` and `data/BossPeopleDemoData.xml` (appended at their ends), `test/People/PeopleSpecLib.js` (the menus,
    keys and ids: a new top-level menu entry in every list), `PeopleAccess.spec.js` (header, menu feature, the employee's links, the
    appended feature), `PeopleEmployees.spec.js`, the inventories, design-people (header, §1.2, §1.4, §4, §5, §10, §13),
    design-projects (header, §15);
  - for the user's call: whether managers evaluate their reports' skills (the second finding); and whether a requirement's history
    needs the key change (the first). Nothing else waits on the user.

**Review Nov 12 (P18).** A fresh review of `git diff master...ppl/p18` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §10 SkillsMatrix and Qualifications, §4 Employee360, §5 JobClassDetail, PE-01 and PE-14, confidentiality first; the user's
two calls of Nov 12 built and recorded in §4; fixes committed apart per repository ("People P18 review: …"). Both branches were
rebased onto master after P15's and P16's merges: mr-mantle with one conflict, CommunicationServices.xml's `get#RecordLinkInfo`
(the application host's and the qualification host's content map entries, visibility branches and description, all kept);
mr-boss with BossSetupData (P18's groups after P15's permissions), People.xml (header, the panel check admitting the employment,
application and qualification hosts, keys, topics after P16's prompts), PeopleSelfService (header, My expenses and My
qualifications), ContextServices, People.js (`linkPaths`, the self-service links, `developmentAreaOpens` beside
`expensesAreaOpens`), RecordFilesServices (both hosts), PeopleSpecLib (Expenses then Development in every menu, P15's, P16's and
P18's keys), PeopleAccess (header, the employee's links, the P15, P16 and P18 features), design-people, ss- and usl-inventory,
each keeping both sides. The phase commits are now mr-mantle 034017cd and mr-boss 6e73bb39. Qualifications (4 of 4) and
PeopleSkills, PeopleAccess, PeopleRecruiting, PeopleExpenses (32 of 32) passed after it.
- Checked and found sound:
  - Confidentiality on every path: an identity document's or work permit's number is read only at the full level (the person and
    HR of an employer of theirs: `accessTo` from People.js `checkedAccess`, staff kinds limited to the caller's employers);
    development reads it as null, a manager and other staff readers read verified qualifications only as kind, dates and
    validity (no title, issuer, number, reason or file). The same projection serves find#Qualifications (lists, the export of
    Qualifications' form-list, the Files box), get#PersonDevelopment (Employee360's Skills and reviews, People's row alone:
    `developmentApps`, so Commons', Insights' and an app with no row show nothing), Today (the user's own, kind and expiry), the
    `QualificationExpiring` notice (kind and expiry, private), the palette's record link (People.js `qualificationLink`, the person
    and HR), RecordFiles and Chatter (`get#RecordLinkInfo`'s branch for every caller, authorization off or not, and People's root
    check). No dataset, search document or Assist tool reads the qualification entities.
  - `check#Qualifications` answers no number, issuer, title, decision reason or file to any caller; a self-declared level, a
    waiting, rejected or revoked certificate and one not yet valid meet nothing, an expired one answers expired and one inside
    thirty days expiring; a person outside the caller's scope answers `unavailable` alone.
  - Verification: at the revision read, a reason for reject and revoke, the state audit-logged with it (`verificationStatusId`
    `enable-audit-log`, `_changeReason`); an identity document or work permit is HR's alone to verify; a verified one is renewed,
    never changed.
  - `send#ExpiryReminders`: verified, expiring within thirty days and not renewed, once per expiry (`reminderThruDate`), each in its
    own transaction, a failure logged by the qualification's id and the rest going on.
  - Projects' `find#StaffingCandidates`: `partyIdList` is optional and only narrows the pool (an empty list leaves no one),
    `skillSelfDeclared` is an added field; Projects' callers pass neither and WorkResources, Resources and ProjectsAccess pass
    unchanged. Find available bounds it to the matrix's `scopePartyIds` (the user's scope and filters).
  - `BOSS_PPL_FILES_SELF` (a one-off probe, not kept, as the demo employee through each root's RecordFiles `filesData`): under
    People the root's check admits the People hosts alone and the employee sees their own qualification, not their employment's
    files nor Rafael's permit; under Commons, Admin and Projects the panel answers exactly what Commons' does (their own
    qualification, a directory person; never an employment's or another's qualification), and Accounting's root refuses it. The
    grant shows nothing beyond what Commons' panel shows a BOSS user (the provisional finding below names the routes it opens).
- Fixed:
  - R1 (high): an HR or development editor reached their own record through their own employment (People's staff admission) and,
    holding no PEOPLE_SELF_SERVICE, was not "the person": an HR editor verified their own qualification (SELF_APPROVAL only
    checked the self kind), a development editor recorded their own skill as an evaluation (meeting a requirement), and an HR
    editor changed their own verified qualification's files. Development.js `accessOf` answers `own` by party; `verify#Qualification`
    refuses SELF_APPROVAL for it and `canVerify` follows, `store#Skill` records a self-declaration, `check#QualificationAccess`
    lets an HR editor change their own files only while it waits or was rejected. Spec Qualifications (an HR editor's own
    verification refused, a development editor's own skill self-declared; both fail on the code as it was).
  - R2 (the user's call): a manager of a live reporting line evaluates that report's skills without PEOPLE_DEVELOP_EDIT, recorded as
    the manager's evaluation (`SkillSource` `SksManagerEvaluated`, the manager its assessor), meeting a requirement as an
    evaluation does; `accessOf`'s `evaluates` and `evaluationSource`, the matrix's and Employee360's `canEvaluate`; verification
    unchanged. The demo's evaluations (their managers') carry the new source. Specs Qualifications (Max evaluates his report, it
    meets the requirement, he is refused another person) and PeopleAccess (the manager evaluates Tomas, the reader is refused the
    same parameters, the manager Services' Kenji); PeopleSkills' manager development record now offers the evaluation.
  - R3 (the user's call): `EmplPositionClassSkill`'s key gains `fromDate`; `store#JobRequirement` ends the period in effect on a
    change and starts a new one (a period not started yet changed in place; a change before its start DATES_INVALID), ends every
    open period on remove, and starts a new period when the skill is required again, never before the last ended (DATES_INVALID);
    `get#JobClass` and `classRows` read the latest open period of each skill (counted once), Development.js `classRequirements`
    the period in effect at its date. Every reader and writer checked: Mantle's Positions.js, Development.js and Lookups.js (its use
    count), BOSS's JobClassDetail through the services and the demo rows (P4's dated to match P18's); Marble's HumanRes screens, the
    other components and the data files hold none. Spec Qualifications (the change's and removal's periods kept, a change from a
    later date read at its date).
  - R4 (medium): a qualification's number reached the model tools (Assist's screen reads of Qualifications for HR):
    `PartyQualification.referenceNumber` and Qualifications' number fields are `ai-opt-out` (PE-21).
- Findings, numbered by the lead F298 to F304 in order:
  - `BOSS_PPL_FILES_SELF` grants Shared/RecordFiles.xml by location, so a self-service employee opens the panel under every app
    root that mounts it (Admin, Projects, Sales and the rest; each root's always-actions run, Accounting's refuses), showing what
    Commons' panel shows them; a grant for People's mount alone needs the record-files element to name the mounting app, or a
    People panel location of its own;
  - a staff reader of the employer (a directory reader, a manager) reads whether a person's work permit or identity document is
    valid, expiring or expired, and its dates (the staffing projection of find#Qualifications and check#Qualifications); only the
    number is withheld. Whether right-to-work validity is HR's alone is open;
  - a verifier may verify a qualification they themselves submitted for the person (an HR or development editor entering and
    verifying a certificate); only the person's own is refused;
  - a manager's evaluation and development's replace each other (the latest sets the level); no precedence between sources;
  - ContactBookServices' party merge map moves PartySkill but not PartySkillEvaluation, PartyQualification or PartyResume, which stay
    on the merged-away person;
  - a database with requirement rows written before the key change needs them dated (`fromDate`) before the new key applies; BOSS's
    demo carries its dates, and no other data file holds any;
  - mr-boss People.js on master is not Prettier-clean (P16's `openingOptions`); left as merged.
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): after the rebase, Mantle Qualifications 4 of
  4 and BOSS PeopleSkills, PeopleAccess, PeopleRecruiting, PeopleExpenses 32 of 32 (PeopleAccess's spec 24.4 s under a load average
  of 16; 9.8 s of features later at a load of 4, so the 15 s limit was the load's); after the fixes, Mantle Qualifications and
  PeoplePositions 9 of 9 (Qualifications 2.9 s: 0.73, 0.86, 0.68, 0.63), BOSS PeopleSkills, PeopleAccess, PeopleEmployees and
  PeoplePositions 32 of 32 (PeopleAccess 9.8 s of features, its P18 feature 0.54 s; PeopleSkills 0.58 s), then Mantle WorkResources,
  PeopleApprovals and RecordLinks 33 of 33 and BOSS Resources, ProjectsAccess, PeopleRecruiting, PeopleExpenses, PeopleSelfService
  and TodayPanel 34 of 34. `moqui lint --screens` (release binary): 136 flagged sites, none in the screens P18 or this review
  touched, no TUI worklist entry for them. Prettier clean on the changed JavaScript but People.js (above). Not run: test-apps, the
  acceptance suite (PeopleSkillsUsable's manager steps read and do not evaluate, so R2 leaves them as written).
- For the lead:
  - budget share beside the Built note's: mr-mantle about +0.5 s (Qualifications' new checks); mr-boss about +0.05 s (PeopleAccess's
    two evaluations);
  - merge hot spots beside the Built note's (P17 rebases onto these): mr-mantle `HumanResourcesEntities.xml` (EmplPositionClassSkill's
    key, SkillSource's values), `Positions.js` (`openRequirements`, `store#JobRequirement`), `Development.js` (`accessOf`,
    `classRequirements`), `PositionServices.xml`, `DevelopmentServices.xml`; mr-boss `BossPeopleDemoData.xml` (P4's requirement rows
    now dated; the P18 block), `PeopleAccess.spec.js` (the P18 feature), `PeopleSkills.spec.js`, design-people §5 and §10, §4 here;
  - for the user's calls: none open; the provisional findings above on `BOSS_PPL_FILES_SELF` and right-to-work validity may want
    one.

### P19 — Training

Design §10 Training, TrainingDetail, §15 (the completion certificate); PE-14. After P16 (the assessment form) and
P18.

- **Mantle** TrainingClass and PersonTraining refined (F6), and DevelopmentServices `find#Training`,
  `store#Training` (a WepTraining event), `enroll#Training`, `decide#Enrollment` on `PeopleTrainingApproval` and
  `complete#Training` (a qualification granted once per enrollment, by an authorized assessment).
- **Screens:** Training, TrainingDetail (Enrollment, Results with a response of a training-assessment form, the
  completion certificate); the Today source "training due".
- **Specs:** Mantle `test/humanres/Training` (completion retried grants once; a failed assessment kept).
- **Usable when** (`acceptance/People/PeopleTrainingUsable`): a session is scheduled, employees enroll, the trainer
  records results, and those who passed hold the qualification with its expiry.

**Built Nov 12 (P19).** mr-mantle ce41a51d, mr-boss (branch `ppl/p19`).
- Checked first (the code over the plan): F6 (the PersonTraining and TrainingClass sketches inside the review sketch's XML comment:
  a training keyed by person, class and date with a Y/N approved flag, a class with a type and a description); P5's approvals
  (`Approvals.js` kinds, `request`, `sourceChanged`, `sourceSummary`, `record#Decision` refusing without PEOPLE_REQUEST_APPROVE before
  anything else, the topic's separate approve and refuse handlers, F110) and P15's advance as the nearest pattern; P16's survey builder
  (the `DbfpTrainingAssessment` purpose and its registration, edited with PEOPLE_CONFIGURE and read with PEOPLE_DEVELOP_VIEW;
  `FormDefinitions.publishedFormFor` and `recordAnswer`; the exit interview's FormInvitation with no link; FormPublication.eecas
  locking an invited response) and P18's `Development.js` (`isRestricted`, the levels of projection, `check#Qualifications` reading
  any verified qualification), the Development area and its grants (`BOSS_PPL_DEVELOPMENT` an inheritable ALLOW for self-service)
  and Today's source on both roots (P8). Also: `WorkEffort`'s purpose field is `purposeEnumId` (`WepTraining` seeded);
  `EventServices.create#Event` makes the event and `store#WorkEffortReminders` sets only the caller's own reminders; the
  `PeopleApprovalKind` enumeration type is seeded after HumanResourcesEntities.xml, so a kind seeded in that file's seed-data fails
  the whole file (the kind is in PeopleDevelopmentSetupData.xml).
- Mantle:
  - `entity/HumanResourcesEntities.xml`: the training sketches out of the comment (the review sketches stay in it for P20) and
    refined: `TrainingClass` (a course of an employer: title, kind `TrainingClassType`, description, the qualification type passing
    grants and its `validityMonths`, `assessmentRequired`, a default `assessmentFormId`, ended by `thruDate`), `TrainingSession` (the
    facts of a WepTraining event keyed by its workEffortId: course, employer, trainer, capacity, assessment form), `PersonTraining`
    (a place with its own id: person, employment, employer, department, session, course, `statusEnumId` audit-logged:
    `PersonTrainingStatus` PtsRequested, PtsEnrolled, PtsCompleted, PtsRefused, PtsWithdrawn, PtsCancelled; reason, decision,
    `attendedFlag` audit-logged and hours, completion, the qualification granted, the certificate's stored page and PDF and when it
    was issued, an operation key) and `PersonTrainingResult` (each assessment, kept: `TrainingResult` TrrPassed or TrrFailed, score,
    assessor, evidence opted out of AI, the form, its response and invitation, an operation key);
  - `mantle.humanres.DevelopmentServices` over a new module `Training.js`: `find#Training`, `get#Training`, `store#TrainingClass`,
    `store#Training`, `enroll#Training`, `decide#Enrollment`, `approve#Enrollment`, `refuse#Enrollment`, `mark#TrainingAttendance`,
    `complete#Training` and `get#TrainingCertificate`, each with its reason codes (the service descriptions list them). Who: a
    development reader (PEOPLE_DEVELOP_VIEW) of the employer reads every session, place and assessment, a development editor
    (PEOPLE_DEVELOP_EDIT) changes courses and sessions, enrolls people, marks attendance and assesses; the session's trainer (a
    person working for the employer, assigned by development) reads their session's places and assessments and no other's, marks
    attendance and assesses; a self-service employee of the employer reads its sessions, asks for and withdraws their own place and
    reads their own outcome (never the assessor's answers or evidence) and certificate; an approver of a waiting place reads that
    place. No one marks or assesses their own place (`SELF_APPROVAL`); missing and unauthorized alike `RECORD_UNAVAILABLE`;
  - the session is a private event made through Commons' `EventServices.create#Event` (`WetEvent`, `WepTraining`, `WevRestricted`,
    owned by the scheduler), its trainer and each person enrolled a current `WorkEffortParty`, and each person enrolled a
    `WorkEffortReminder` of their own a day before (written by the service: `store#WorkEffortReminders` sets only the caller's); a
    change moves the event and the trainer's attendance, a cancellation cancels the event and every place (a waiting approval
    superseded through `sourceChanged`);
  - a place the person asks for waits for a People approval of kind `PakTraining` (Approvals.js's new kind; the notice names the
    person, the course and the day, never the reason), routed as every People approval (no rule: the manager); the last approval
    enrolls (refused `SESSION_FULL` with no seat), a refusal keeps its reason; a development editor's enrollment of a current
    employee is made at once; seats count the places waiting and enrolled; the trainer holds no place in their own session;
  - `complete#Training` locks the place: attendance first (`ATTENDANCE_REQUIRED`); with the session's form, the answers are checked
    and kept as a FormResponse its FormInvitation locks (naming the person, the assessor, the session and the place; no link); a
    failure is kept and the place stays enrolled; the pass completes it once, grants the course's qualification once (a verified
    `PartyQualification` valid the course's months, the reference the place's id, renewing the person's latest verified one of the
    type, so `check#Qualifications`, the skills matrix and the expiry reminder count it) and issues the completion certificate
    (Mantle's `template/humanres/TrainingCertificate.print.html.fancy`, stored as its page and PDF under the place, never rendered
    again; a PDF that fails is logged and the page kept); a completion retried, or a retry of its operation key, answers the first;
  - `data/PeopleDevelopmentSetupData.xml`: the `PakTraining` kind and the `PeopleTrainingApproval` topic (approve and refuse
    handlers, refusal reason required, a title naming the person, course and day).
- BOSS:
  - Screens: `People/Development/Training` (menu 3 of Skills & training: FindTraining (Upcoming, Mine, I train, Past, All, by course),
    SessionList with the state and the user's own place as chips and a row's Ask for a place; Schedule session the one primary and
    the Courses box (New course, Change, End) for a development editor), `Development/TrainingDetail` (out of the menu: the record
    header with Ask for a place or Enroll a person as the primary and More's Change session and Cancel session; Enrollment with
    Approve, Refuse, Withdraw, Attendance, Assess, Certificate and PDF per place; Record a result over the session's assessment form
    as a dynamic form of its DbForm; Results, the answers and evidence opted out of AI; a not-available state) and
    `Development/TrainingCertificate` (out of the menu: the stored page in html-print);
  - `ironstone.people` People.js: the links, the self-service links (the three screens), the choices `trainers` (the employees and
    agents of a development reader's employers) and `trainingForms` (an employer's published training assessments, or every
    employer's), `decisionUrl` for PakTraining (TrainingDetail by the place) and Today's training due (`find#Training`'s due: the
    user's own enrolled sessions and those they train, within seven days, opening the session); ContextServices' descriptions;
    People.xml: the `PeopleTrainingApproval` topic; People/Approvals: the topic among `notificationTopics`; BossSetupData (appended):
    the topic's link to TrainingDetail; BossPeopleDemoData (appended): Retail's fire warden course (`BOSS_PPL_TC_FIREWARDEN`, assessed,
    granting `BOSS_PPL_QT_FIREWARDEN` for 24 months), no session. No new grant: the screens are under the Development area's.
- Specs: Mantle `test/humanres/Training` (4 features, stepwise, 2.9 s: 0.57, 0.62, 1.33, 0.35: a restricted type and a validity
  refused, a self-service employee and another employer refused a course, a past start, a missing form and a trainer of another
  employer refused, the event's purpose and visibility, the trainer an attendee, the self-service employee's list and its Ask for
  a place, another employer's development seeing none; a place asked waits, a retry by its key answers it, a second place, another
  person's place, the trainer's place and the person's own and HR's decisions refused, the manager reading the place and its reason
  and approving it, development enrolling Bo at once, the session full, the attendee and its reminder, Today's due; attendance before
  the start, by HR and over the session's length refused, an absent person's assessment refused, no answers and invalid answers
  refused, a failure kept with the place enrolled, the pass completing it and granting the qualification, the retry answering the
  first, a failure after completion refused, one qualification valid 24 months, the staffing check qualified, the certificate read by
  the person and refused to another, two locked responses; the trainer reading their session's assessments with the answers and
  none of another session, the person their own outcomes without answers or evidence, another employer's development refused,
  development reading the evidence, the trainer refused a cancellation, the cancellation cancelling a waiting place and superseding
  its approval). BOSS `test/People/PeopleTraining` (3 features, 1.2 s: 0.23, 0.97, 0.04: Training's one qvt render as the learning
  administrator with the session, Schedule session, New course, seats and what passing grants, the choices `trainers` and
  `trainingForms` with a selected value off the page, Tomas's Today item; TrainingDetail's one qvt render as the trainer with Tomas's
  place to assess over the form's field, the result posted through completeTraining with authorization on completing the place;
  TrainingCertificate's one html-print render as Tomas). `PeopleAccess` gains one feature (0.48 s: a session scheduled by the
  development administrator and refused to the HR officer with the same parameters, an assessment accepted for the trainer and
  refused to the reader with the same parameters, Services' session refused to Retail's development administrator, the employee's
  Training by the area's own grant), its menu feature's Development group (PeopleSpecLib `developmentMenu`, `readerDevelopmentMenu`,
  the P19 ids) and the employee's context links. Acceptance, written and not run: `acceptance/People/PeopleTrainingUsable` (4
  features: the learning administrator schedules a fire warden session from Training trained by Hannah; Tomas asks for a place from
  Training, Hannah approves it on TrainingDetail, the learning administrator enrolls Rafael; after the session Hannah marks both
  attended, Tomas passes, Rafael fails and passes a second attempt; both hold the fire warden certificate, verified, about two years,
  the staffing check qualified, Tomas reads his own outcome without the answers and prints his certificate).
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle Training, PeopleApprovals,
  Qualifications, HumanResServices, ExpenseClaims and Recruiting 36 of 36 (mr-mantle 16.1 s of features); BOSS PeopleTraining,
  PeopleAccess, PeopleApprovals, PeopleSkills, PeopleSelfService, TodayPanel and PeopleRecruiting 49 of 49 (mr-boss 17.4 s). One-off
  renders (a spec not kept): Training in tui and html as the self-service employee (Ask for a place), TrainingDetail in tui as him
  after asking, in html as his manager (the place to decide, Approve and Refuse) and as the learning administrator (Enroll a person,
  Change session), People's Approvals as the manager with the training place, and her Today's decision opening TrainingDetail; all
  without error. `moqui lint --screens` (release binary): 136 flagged sites as before, none in the screens P19 added or touched, no
  TUI worklist entry for them. Prettier clean on the new and changed JavaScript (People.js's earlier `openingOptions` lines left as
  merged). Not run: `./moq test-apps`, the acceptance suite.
- Inventories: usl-inventory's People Added table (the eleven DevelopmentServices of P19), `create#Event`'s and
  `store#WorkEffortReminders`' Implemented in; ss-inventory's P19 note (no baseline form is mapped).
- Design edits: design-people (header; §1.2 Training; §1.4 Today and the topic; §10 Training and TrainingDetail as built; §12 the
  topic's handlers; §15 the completion certificate); design-drawers-commons §4 (the `PeopleTrainingApproval` row).
- Findings, numbered by the lead F320 to F329 in order:
  - the training assessment purpose stays edited with PEOPLE_CONFIGURE (P16's registration; Forms is under the People
    administrator's Settings), so the learning administrator builds no assessment form; P16's finding offered PEOPLE_DEVELOP_EDIT;
  - a trainer is any person working for the employer whom development assigns (an employee or agent, a self-service employee too);
    their passing assessment grants a verified qualification although they are no qualification verifier (HR or development):
    the authority is the assignment; a development editor assesses too;
  - the person reads their own outcome, score, date and assessor, never the assessor's answers or evidence; HR readers read a
    certificate (`get#TrainingCertificate`) but no session or place; a manager reads a report's place only as its approver;
  - a development editor's enrollment of another person is made at once, with no approval (an assignment, not a request); the
    person's own request always waits, whatever the person's permissions;
  - the person is not told when their place is approved or refused (no decision topic, as leave's `PeopleLeaveDecision`); Today,
    Training and the calendar's attendance show it;
  - Sessions do not list due recertification (design §10's Sessions): nothing links a qualification expiring to a session that
    renews it; Today's my qualification expiring (P18) and training due are separate items;
  - a session's time changed on Commons' EventDetail by the event's owner (the scheduler) bypasses `store#Training`'s checks and
    revision; a session is one occurrence (no series or multi-day schedule);
  - attendance and assessment wait for the session's start; a place may be approved after the session started (only a request
    is refused once it starts);
  - `TrainingClassType` is not among Lookups' HR families, and courses are per employer (no shared course);
  - a revoked granted qualification leaves the issued certificate as it was; no certificate is ever issued again;
  - no key for Training, and SelfService has no training link (Today and the area cover it).
- For the lead:
  - budget share: mr-mantle about 2.9 s (Training); mr-boss about 1.7 s (PeopleTraining 1.2 s, PeopleAccess's feature 0.5 s); the
    certificate's PDF is most of each completing feature; no client spec;
  - merge hot spots (P17 runs beside): mr-mantle `Approvals.js` (the `PakTraining` kind after `PakAdvance`, where P17's offer kind
    goes too), `entity/HumanResourcesEntities.xml` (the training entities after the review sketch's comment; P20 refines the review
    sketch there), `data/PeopleDevelopmentSetupData.xml`, `DevelopmentServices.xml` (appended; P20 adds its services here);
    mr-boss `service/ironstone/people/People.js` (`linkPaths`' end, the self-service links, the P19 choices block after P16's,
    `decisionUrl`, Today's training due before the weeks to submit, `trainingDetailPath`), `ContextServices.xml` (two
    descriptions), `screen/People.xml` (header, the topic after QualificationExpiring), `screen/People/Approvals.xml`
    (`notificationTopics` and its comment; P17 adds its offer topic there), `screen/People/Development.xml`,
    `data/BossSetupData.xml` and `data/BossPeopleDemoData.xml` (appended at their ends), `test/People/PeopleSpecLib.js` (the
    Development menus, the P19 ids), `PeopleAccess.spec.js` (header, the employee's context links, the appended feature), the
    inventories, design-people (header, §1.2, §1.4, §10, §12, §15), design-drawers-commons §4, this file;
  - acceptance to run with the full suites: PeopleTrainingUsable (new), PeopleApprovalsUsable (a new approval kind and topic on
    Approvals), PeopleSkillsUsable (the qualification a training grants is a verified PartyQualification as the matrix reads it);
  - for the user's call: whether a trainer's passing assessment may grant a verified qualification (the second finding), and
    whether the person reads the assessor's answers (the third). Nothing else waits on the user.

**Review Nov 12 (P19).** A fresh review of `git diff master...ppl/p19` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §10 Training and TrainingDetail, §15 and PE-14, confidentiality first; the user's two calls of Nov 12 recorded in §4 (both as
built); fixes committed apart per repository ("People P19 review: …"). Both branches were rebased onto master after P17's merge:
mr-mantle with one conflict, `Approvals.js` (P17's `EMPLOYMENT_OFFER` and `PakOffer` with its `selfPartyIds`, then P19's
`PERSON_TRAINING` and `PakTraining`, both kept); mr-boss with BossSetupData (P17's offer topic and EmploymentLetter grant, then the
training topic), People.xml (both topics), People/Approvals (both topics in `notificationTopics` and the header), People.js
(`linkPaths`: P17's offer screens, then training's) and PeopleAccess (header, P17's offer feature, its review's letters feature, then
P19's training feature), each keeping both sides. The phase commits are now mr-mantle caaaf46c and mr-boss f316b1e4. Training,
Qualifications, PeopleApprovals and Offers (20 of 20) and PeopleTraining, PeopleAccess, PeopleSkills, PeopleOffers and
PeopleApprovals (36 of 36) passed after it.
- Checked and found sound:
  - Completion: `complete#Training` locks the place before its operation key's retry check and the completed check, so a completion
    sent twice at once grants one qualification and answers the first (`repeated`, the same result and qualification); a failure is
    its own result row, kept, with the place enrolled; a failure after completion is refused; the qualification is created only on
    the pass, verified, the trainer its verifier (`verifiedByUserId`), the place its reference and the session in its comment, and
    development (a qualification verifier of the employer) revokes it through `verify#Qualification`.
  - The trainer reads the assessments (answers and evidence) of their own session alone: `sessionAccess` is computed per session
    from `TrainingSession.trainerPartyId`; the trainer of another session reads it as any employee (their own place only, no
    result). The person reads their own results with outcome, score, date and assessor, `evidence` null and no answers, on every
    path (`get#Training` by session or by place); the certificate holds neither.
  - The assessment's response: Training.js reads `FormResponse` and its answers only in `get#Training`, for development and the
    trainer. No other path reaches it in the apps: People's survey registration has no responses screens (`responses: null`), its
    purposes admit no publication access kind, so `ExternalAccess` makes no link for their invitations, the invitation key is an
    idempotency key and no token, no self-service list reads `FormInvitation` by party, and `FormResponseAnswer.valueText` is opted
    out of AI. What remains is the framework's `get#FormResponse` (no reader check, F62; artifact authorization guards its remote
    use) and Marble's SimpleScreens Survey screens, which list every response to ADMIN alone (`SimpleScreensSurvey` has no other
    grant).
  - The certificate is rendered once, by the passing completion, stored as its page and PDF under the place, and read back as
    stored (`get#TrainingCertificate`: the person, development and HR readers of the employer); its PDF downloads for the person
    with artifact authorization on (now checked in PeopleTraining).
  - No self-approval: the person's own request goes to People's approvals with the person as subject and requester, which
    `record#Decision` refuses (`SELF_APPROVAL`) and the spec checks; no one marks or assesses their own place; a development
    editor's enrollment of another is made at once, their own place waits.
  - Scope by employer: development's reach is `PEOPLE_DEVELOP_VIEW` over the user's People organizations; a self-service employee
    reads the sessions of their current employers; courses, sessions, enrollments and assessments are refused across employers
    (Training and PeopleAccess); `trainers` and `trainingForms` choices are bounded the same way; Today's training due reads
    `find#Training` as the user.
- Fixed:
  - R1 (medium): a session's time, status and attendees could be changed outside `store#Training`: its organizer (the scheduler)
    through Commons' EventDetail (`update#EventOccurrence`, `cancel#EventOccurrence`, attendees), and any attendee (the trainer or a
    person enrolled) by putting the event in a calendar of their own (`add#CalendarEvent` needed only view of the event), which made
    them its editor (`check#EventAccess`'s calendar edit) and let CalDAV write it, bypassing the dates, the closed-session check, the
    revision and the places. Commons' `check#EventAccess` now answers `managedBy` for a WepTraining event with a `TrainingSession`,
    whose edit it refuses ("is changed on its People training session") while its view stands, and `add#CalendarEvent` refuses
    such an event. Spec Training (the organizer's `check#EventAccess` and `update#EventOccurrence`, the trainer's
    `add#CalendarEvent`; fails on the code as it was).
  - R2 (low; worker's finding): a place could be approved after the session started; `decide#Enrollment` refuses an approval then
    (`SESSION_CLOSED`); a refusal may still follow. Spec Training (Cy's late approval refused, his refusal recorded).
  - R3 (low; worker's finding): the person was not told when their place was approved or refused; the new `PeopleTrainingDecision`
    topic (Mantle's PeopleDevelopmentSetupData: private, "Your place in {course} on {day}: approved|refused", the message the
    place, session, course, day and outcome, never the reason), sent by `decide#Enrollment` on the last approval or a refusal to
    the person and who asked, failure-tolerant; BOSS links it to TrainingDetail and declares it on People's root. Spec Training (Ana
    told of her approval, Cy of his refusal, neither reason in the message or title).
  - R4 (low; worker's finding): the learning administrator could not build an assessment form. Mantle's training assessment
    `FormPurpose` admits `PEOPLE_DEVELOP_EDIT` beside `PEOPLE_CONFIGURE` (FormDefinitions reads an edit or view permission as a
    comma list, any one admitting); BOSS mounts the builder again as Skills & training › Assessment forms
    (`People/Development/AssessmentForms`, menu 4, its List and FormDetail the shared SurveyForms and SurveyFormDetail) through a
    `mounts.Development` entry of People's survey registration (the training purpose alone, edit by `developEdit` or `configure`,
    its routes and words; the screen's always-actions set `surveyMount`), granted by `BOSS_PPL_ASSESSMENT_FORMS` (ALWAYS for
    BOSS_PEOPLE_DEVELOP, denied to BOSS_PEOPLE and BOSS_PEOPLE_SELF; the People administrator and ADMIN through the root), so
    Settings stays the People administrator's. Specs Training (a development editor's training assessment made, a review form
    refused) and PeopleAccess (the learning administrator opens Assessment forms, the HR officer and the employee are refused). A
    one-off probe, not kept: as the learning administrator the list offers New form for the training assessment alone, creating
    one opens its FormDetail under Development with Add question.
  - R5 (low): a trainer kept reading their session's places and assessments after leaving the employer; the trainer's access now
    needs a current employee or agent relationship with the session's employer (`trainsIt`; find#Training's I train the same).
    Spec Training (Tia, ended, refused the session and listing none).
  - R6 (low): why a place was refused (`decisionReason`) was shown to every reader of the place, the trainer included; now as the
    reason asked: development's, the person's and the approver's. Spec Training.
  - R7 (worker's finding): SelfService links My training (`get#SelfServiceContext`'s `trainingUrl`, Training's Mine, on both
    mounts when the area opens to the user) and the key `g i` opens Training. Spec PeopleAccess (the employee's link, the HR
    officer's keys).
- Findings, numbered by the lead F330 to F335 in order:
  - Commons-wide: `check#EventAccess` makes an editor of anyone with edit on a calendar the event is in, and `add#CalendarEvent`
    asks only that the user may see the event, so an attendee of any private event (a meeting, P16's interview) who puts it in a
    calendar of their own may move, change or cancel it, and CalDAV may write it; R1 closes it for training sessions only. An
    interview's event (owned by the recruiter) is also changed on EventDetail outside the interview's services;
  - Commons' calendar data (`ironstone.commons.CalendarServices` get#CalendarData) computes `canEdit` itself from ownership and
    calendars, so the calendar still offers dragging a training session to its organizer; the move is refused by
    `update#EventOccurrence`;
  - a place still waiting when its session starts stays waiting until refused (the approver sees Approve, which is refused);
  - a session cancelled tells no one but through the event's state and Today (no decision topic for a cancellation);
  - the worker's findings that stand: courses per employer and `TrainingClassType` outside Lookups; Sessions do not list due
    recertification; a session is one occurrence; a development editor's enrollment needs no approval; a revoked qualification
    leaves its certificate; HR readers read a certificate but no session; a manager reads a report's place only as its approver;
  - mr-boss People.js on master is still not Prettier-clean (P16's `openingOptions`); left as merged.
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): after the rebase, 20 of 20 and 36 of 36
  (above); after the fixes, Mantle Training, Qualifications, PeopleApprovals, Offers, FormDefinitions and LeaveRequests 27 of 27
  (mr-mantle 17.6 s of features) and BOSS PeopleTraining, PeopleAccess, PeopleSkills, PeopleOffers, PeopleApprovals,
  PeopleSelfService, PeopleRecruiting and PeopleTime 49 of 49 (mr-boss 16.1 s); Training last 3.3 s (0.81, 0.60, 1.45, 0.43),
  PeopleTraining 0.65 s (0.25, 0.32, 0.08), PeopleAccess 11.0 s of features (its training feature 0.57 s). The new Training checks
  were run on the unfixed code (the event's check failed first). `moqui lint --screens` (release binary): 136 flagged sites as
  before, none in the screens P19 or this review touched. Prettier clean on the changed JavaScript but People.js (above). Not run:
  test-apps, the acceptance suite.
- For the lead:
  - budget share beside the Built note's: mr-mantle about +0.4 s (Training's new checks); mr-boss about +0.1 s (PeopleAccess's
    assessment forms and link checks, the PDF download);
  - merge hot spots beside the Built note's (P21 rebases onto these): mr-mantle `work/EventServices.xml` (`check#EventAccess`),
    `work/CalendarServices.xml` (`add#CalendarEvent`), `party/FormDefinitions.js` (`canEdit`, `canView`), `data/PeopleRecruitingSetupData.xml`
    (the training purpose), `data/PeopleDevelopmentSetupData.xml` (the decision topic), `Training.js`; mr-boss
    `service/ironstone/shared/SurveyApps.js` (People's `mounts`, `context`), `screen/People/Development/AssessmentForms.xml` (new),
    `screen/People.xml` (the key and topic), `screen/Shared/PeopleSelfService.xml` and ContextServices (`trainingUrl`),
    BossSetupData (the decision topic and `BOSS_PPL_ASSESSMENT_FORMS` after the training topic), PeopleSpecLib (`keys`),
    PeopleAccess's training feature, design-people (header, §1.2, §10, §12, §13 Forms), usl-inventory, §4 here;
  - acceptance: PeopleTrainingUsable, as written, approves Tomas's place before the session and is unaffected by R2; to run with the
    full suites as the Built note says;
  - the user's calls: both recorded in §4 as built; the Commons-wide calendar finding above may want one.

**Follow-up Nov 12 (Commons calendar editors).** The user's call (§4): F330, the Commons-wide hole, is fixed in Commons now,
generally. mr-mantle b936d768 and mr-boss (this commit), branch `ppl/cal`.
- Putting an event in a calendar gives its editors no more than the one who put it there: `CalendarWorkEffort.viewOnly` (new) is Y
  when `add#CalendarEvent` puts an event the user may not change (an attendee's invitation) in a calendar, and `check#EventAccess`
  makes no editor through such a link (the attendee, nor a delegate who edits their calendar); feeds, `import#Calendar` and CalDAV
  writes (`store#CalendarFeedEvents`) neither change nor cancel it, and a split series copies the flag. The organizer, editors of a
  calendar that holds the event for its editors (a delegate of the organizer's calendar, a team calendar it was made in) and their
  own events are as before.
- An event an application keeps: R1's hard-coded training check is now the `EventManager` entity (an entity whose row names the
  event, optionally a purpose, and where it changes), seeded beside its entity: `PeopleTrainingSession` (TrainingSession,
  WepTraining) and `PeopleInterview` (ApplicationInterview); any app's event declares one the same way. `check#EventAccess` answers
  `managedBy` and `eventManagerId` (`get#ManagedEvents`, a batch) and refuses the edit to every user ("X is changed on its
  application's interviews in People"); the owner's services write the event themselves or call the event services as the system
  (`runAsSystem`, admitted with no user and authorization off).
- Interviews change only through RecruitingServices: `change#Interview` (start from now on, length, place unless a video call, whose
  link is kept open past the new end, note) and `cancel#Interview` (the scorecards stay), a recruiter of the employer's; the
  invitations of schedule, change and cancel go as the system. ApplicantDetail's Interviews rows have Change and Cancel (danger,
  confirmed); Commons' EventDetail shows a kept event read-only with "This event is changed on …", and `get#EventAccessInfo`'s
  edit refusal names where.
- CalDAV: `put#DavObject` refuses (403) a write to an event of the calendar the user may not change, under its name or another
  with its UID, and `delete#DavObject` its delete; the organizer's delete cancels the event though an attendee's calendar shows it
  (a viewOnly link is not "elsewhere"). The tasks branch is untouched.
- Commons' calendar data (`get#CalendarEvents`) computes `canEdit` with the same rule (viewOnly links, kept events), so the grid
  offers no drag of an invitation the user put in their calendar, nor of a session or interview to its organizer (F331).
- Specs (each new check fails on the code as it was): Mantle CalendarServices (Ben's invitation in his calendar, viewOnly, he and
  Cy, his calendar's editor, refused a move, a cancel and a booking; Dee, an editor of Ada's calendar, still changes it), Dav (the
  attendee's phone reads it and is refused a change, under its name and another with its UID, and a delete; the organizer's delete
  cancels it), Recruiting (the organizer refused update and cancel on Commons with where it changes, the panel member refused a
  calendar, a reader and another employer's recruiter refused, the change, the cancel, then INTERVIEW_CANCELLED); BOSS Calendar
  (Joe's planning in john.doe's own calendar: no canEdit on the grid or the popover, the move refused) and PeopleRecruiting (the
  recruiter's changeInterview on ApplicantDetail; EventDetail's save refused naming People). Training unchanged and passing.
- Tests run (release binary from the main checkout, `--nobuild`, this runtime): Mantle Training, Recruiting, Dav, CalendarServices,
  CalendarChanges, CommonsToday, LeaveRequests, ShiftRoster, PeopleChecklists, Qualifications, Offers, BusinessTime 89 of 89; BOSS
  Calendar, EventDetail, Schedules, CalendarSettings, PublishedCalendar, SyncSettings, TodayPanel, QuickCreate, PeopleRecruiting,
  PeopleTraining, PeopleLeave, PeopleRoster, PeopleTime, ManufacturingAccess 115 of 115, PeopleAccess and PeopleSelfService 30 of
  30. Budget share: mr-mantle about +0.9 s (CalendarServices 0.42, Dav 0.12, Recruiting 0.37), mr-boss about +0.2 s. `moqui lint
  --screens`: 136 flagged sites as before, none in ApplicantDetail or EventDetail. Prettier clean on Recruiting.js, Recruiting.spec
  and PeopleRecruiting.spec (CalendarServices, Dav and Calendar specs were not Prettier-formatted before; left in their style). Not
  run: test-apps, the acceptance suite.
- Findings, numbered by the lead F354 to F357 in order:
  - an attendee's link made before this fix has no viewOnly and still makes its calendar's editors the event's; no data upgrade
    marks them (a personal calendar of an attendee who is not the organizer is the likely set);
  - a phone's change of an event made in the app (no `universalId`; served as `mantle-{id}`) is stored as a new event beside it,
    since `store#CalendarFeedEvents` matches by `universalId` only: a duplicate, before and after this fix;
  - an interview's panel is fixed once scheduled (EventDetail's attendees are refused on a kept event): cancel and schedule again;
    a cancelled interview's call link stays open until it expires (`revoke#CallLink` is its owner's);
  - by the rule, an attendee who may already change an event (an editor of its team calendar) makes their own calendar's editors
    its editors too when they put it there.

**Review Nov 12 (calendar follow-up).** Every write path was walked against the rule: Mantle EventServices (update, cancel and
restore#EventOccurrence, store#EventRecurrence, send#EventInvitations, remove#EventAttendee, book#Resource, cancel and
check#ResourceBookings all check `check#EventAccess` edit), CalendarServices (`add#CalendarEvent` marks, `store#CalendarFeedEvents`
skips viewOnly and kept events for feeds, `import#Calendar` and CalDAV), CalendarDavServices (PUT by name and by UID, DELETE), the
BOSS Commons event and calendar services and screens (every change behind `get#EventAccessInfo` edit; `duplicate#Event` and
`save#EventOverview` add through `add#CalendarEvent`), Projects' calendar (a WetEvent through the same check, other items through
`move#TimelineItem`'s task and project access), Manufacturing (runs are not events to `get#EventAccessInfo`, F39), ShiftRoster
(ShiftAssignment rows, no events) and holidays (no organizer, no calendar). Sound: an attendee, their delegates, a shared calendar's
editors and a phone change or cancel no invitation they did not organize; kept events change only in People; the organizer's own,
the delegate of the organizer's calendar and the team calendar it was made in are as before (CalendarServices' Dee, Calendar spec).
The system scope (no user, authorization off) is reached only by `runAsSystem`, scheduler jobs, data loads and the mail sync;
the anonymous services and screens (PublishedCalendar, `fetch#CalendarSubscriptions`, `send#DueReminders`, the call link token
routes, `create#ApplicationFromEmail`) pass no request-chosen event to an event write service, so it is safe as built.
- R1 (High; the follow-up's first finding): attendee links made before the fix still gave edit. `migrate#CalendarViewOnlyLinks`
  (CalendarServices, run from the new seed file `data/CalendarSeedData.xml`, as P10's `migrate#ProductionCostRates`) marks each
  link with no viewOnly: Y when the event has an organizer who neither owns nor edits the calendar and the calendar's owner could
  not change the event through another calendar link, else N (the organizer's own, a delegate's or team member's, an event with
  no organizer, a feed's). Each link in its own transaction, a failure logged and counted. `add#CalendarEvent` now writes N for
  an editor's link, so a later load judges no new link again. Spec: CalendarServices (Ben's old link Y, he and Cy refused;
  Ada's own, Dee's delegated call, the all-hands Ben edits through the team calendar and an event with no organizer N; a second
  run does nothing).
- R2 (Medium; the follow-up's third finding, in part): `cancel#Interview` closes the interview's video call link: the recruiter
  who scheduled it through the framework's `revoke#CallLink` (guests removed at once), another recruiter of the employer as the
  system (the link revoked, so its token and guests are refused, and the guests' credentials ended for `expire#Calls`), with
  `revoke#CallLink`'s preconditions checked first so no error rolls the cancel back. Spec: Recruiting (both paths: the link
  revoked, the token refused, the guest out).
- R3 (Low): a phone's delete of an invitation the attendee's calendar only shows was refused (403), so it came back on the phone
  with no way to drop it there (before the follow-up the delete took it out of that calendar); it now takes it out of that
  calendar and leaves the event as it was. A kept event's delete is still 403. Spec: Dav (204, the calendar empty, the event
  unchanged; the organizer's delete still cancels it).
- Findings, numbered by the lead F358 to F362 in order:
  - `tellAttendees` (schedule, change and cancel#Interview) catches a failing `send#EventInvitations`, but the failure has
    already marked the transaction rollback-only (docs/logic/Services.md), so the interview change rolls back while the screen
    says it was made and the attendees were not told; the invitations want to go after commit (pre-existing in schedule since P16);
  - Leave's WetTimeOff projections are owned by the employee, so Mantle's event services (update, cancel and restore#EventOccurrence,
    `add#CalendarEvent` and then CalDAV) let the employee move or cancel their approved leave's "Out of office" on a direct call;
    the BOSS screens refuse it (`get#EventAccessInfo` is WetEvent only) and no remote endpoint reaches it today. An EventManager
    row on LeaveRequestSegment.workEffortId (with an index) would close it; production runs (WepProductionRun, guarded in BOSS
    only, F39) likewise by an EventManager on WorkEffort with that purpose;
  - as the system, `send#EventInvitations` no longer leaves out the acting user, so a recruiter on the panel who changes or
    cancels an interview is notified of their own change;
  - a cancelled interview's scorecards stay open to submit (`submit#Scorecard` does not look at the event);
  - the migration errs toward view only on a shared calendar: a link an editor of the event (not its organizer) put in a shared
    calendar is marked Y unless the calendar's owner edits the event through another calendar; the organizer and that other
    calendar's editors still change it.
- Tests run (release binary from the main checkout, `--nobuild`, this runtime): Mantle Training, Recruiting, Dav,
  CalendarServices, CalendarChanges, CommonsToday, LeaveRequests, ShiftRoster, PeopleChecklists, Qualifications, Offers,
  BusinessTime 91 of 91 (52.5 s, features 28.1 s); BOSS Calendar, EventDetail, Schedules, CalendarSettings, PublishedCalendar,
  SyncSettings, TodayPanel, QuickCreate, PeopleRecruiting, PeopleTraining, PeopleLeave, PeopleRoster, PeopleTime,
  ManufacturingAccess, PeopleAccess, PeopleSelfService 145 of 145 (48.5 s, features 24.9 s). New checks: the migration feature
  0.42 s, the call link feature 0.22 s, the changed Dav feature 0.12 s; each fails on the code before the fixes. Prettier clean on
  Recruiting.js and Recruiting.spec. The seed file was not loaded into a database here (the service is spec'd directly).
- For the lead: budget share mr-mantle about +0.65 s, mr-boss none. Merge hot spots: CalendarServices.xml, CalendarDavServices.xml,
  Recruiting.js, Recruiting.spec, impl-people.md; nothing in P21's files. R3 departs from the follow-up's "DELETE refused to
  non-editors" for a link the calendar only shows (it changes the user's calendar, never the event): the user may want to confirm.

### P20 — Reviews and goals

Design §11 ReviewCycles, Reviews, ReviewDetail, Goals; PE-16. After P16 (an assessment is a response of a review
form) and P18.

- **Mantle** ReviewCycle, ReviewTemplate and the refined PerformanceReview family (F6), the `WepGoal` purpose, and
  `mantle.humanres.ReviewServices`: `find#Cycles`, `store#Cycle`, `start#Cycle`, `find#Reviews`,
  `store#Assessment`, `submit#Feedback`, `change#ReviewState` on `PeopleReviewStep`, `find#Goals`, `store#Goal`.
  Goals stay out of the CalDAV Tasks collection, Today's tasks and project rollups.
- **Screens:** ReviewCycles, Reviews, ReviewDetail (the text fields opted out of AI, P12), Goals; the review's
  content host and the release PDF.
- **Specs:** Mantle `test/humanres/Reviews` (private notes absent from the employee's answer before and after
  release; a new manager does not read the earlier manager's notes; a goal is in no task list).
- **Usable when** (`acceptance/People/PeopleReviewsUsable`; design §14.3 "Qualifications and reviews", its second
  half): a cycle starts for a team, an employee and their manager assess, the review is released and acknowledged,
  and the manager's private notes appear in no export or Chatter.

### P21 — Grievances

Design §4 Grievances, §13 RequestDetail; PE-01 (participants), PE-21. Ends stage 3.

- **Mantle** the HR-confidential request type and RequestServices `find#PeopleCases` and `create#PeopleCase`, with
  the explicit participant and handler check on every read, search, file, message and notification of the request.
  The Request rules conditioned for the type: the triage notice, the support-case, customer and service-level
  rules, and `complete#RequestFromWork` (F20). The topic `PeopleCaseUpdate`, with no push and a title that names
  nothing. A task linked to a case is left out of the CalDAV Tasks collection, as P7's protected tasks are.
- **Screens:** Grievances (Cases, SubmitCase), `People/Employees/RequestDetail` with People's context branch (F19),
  its text fields opted out of AI.
- **Specs:** Mantle `test/request/PeopleCases` (a manager, an HR officer without the case and a linked-task assignee
  each refused with a valid id; no triage notice, case profile or completion from work); BOSS `PeopleAccess` gains
  the case rule.
- **Usable when** (`acceptance/People/PeopleCasesUsable`; design §14.3 "Confidentiality across every path", its case
  half): an employee files a case; only the intake handler sees it, in the list, the palette, search, files and
  Assist; assigning a task to IT opens nothing of the case to its assignee.

**Built Nov 12 (P21).** mr-mantle a82a3456, mr-boss (branch `ppl/p21`).
- Checked first (the code over the plan): F19 (Shared/RequestDetail branches by `appRoot`, each app's section in a template, the
  Commerce and Purchasing pattern), F20 (RequestTriageNotice, SupportCaseRule, SupportCaseCustomerRule and SupportCaseSlaRule on
  every request; `complete#RequestFromWork` knowing no HR type), P2's F66 (`get#RecordLinkInfo`'s visibility branches, RecordFiles'
  `get#ContentType`, the Records drive's folder map), P7's `hiddenTaskIds` and its seven call sites (each prefiltering on
  `ChecklistStep.isProtected`), P12's opt-out and its uncovered paths (a service tool's result, the search index, a `section-include`
  of an opted-out section, a `go` query), P16's `get#CaseResponse` fix (one app's service reading another's records). A survey of
  every reader of requests found a case would have surfaced, with its name or comments, through: Commons' request list, Home's
  assigned requests, request detail and access check; a contact's Requests tab; a call's screen pop; a task's linked records
  (Commons' TaskDetail, Projects' WorkItemDetail, Today's record caption); Admin's open assignments; `lookup#ById` (the palette's
  Go to id, Comms' link search, Assist mentions); `search#Universal` and the MantleRequest and MantleCommunicationEvent documents
  (which index comment bodies); a party's Chatter timeline (`find#PartyCommunicationEvents`, every note's text); the record
  notices (`notify#RecordMention`, `notify#RecordFollowers`: the record's name and the start of the text, to anyone made a
  follower); `get#RecordLinkInfo`'s staff, no-organization-filter and authorization-off paths, and its communication event bypasses.
  Customer Service, Commerce, Warehouse, Purchasing, Manufacturing and Insights read requests by a case profile, store, facility,
  type or dataset a case never has. The data tool reads `moqui.basic` alone; no agent tool reads requests.
- Mantle:
  - `entity/PeopleCaseEntities.xml`: the type `RqtHrCase`, an Enumeration of its own type `RequestConfidentialType` (not a
    `RequestType`: no request type list offers it and every type check that asks for a RequestType refuses it), and `PeopleCase`
    (the employer, the employment, subject, details, the day, how to contact the employee, the outcome note, opted out of AI; an
    operation key). The case's Request row says nothing: "Confidential case", no description, project, store, facility, category,
    customer or organization party; its people are its RequestParty rows, the employee (Reporter) and the handlers (Assignee);
  - `data/PeopleCaseSetupData.xml`: the topic `PeopleCaseUpdate` (no push, `titleTemplate` a fixed sentence: "A confidential case
    was filed with you", "… assigned to you", "… you are on was updated") and the PartySetting type `PeopleCaseIntake` (the
    employer's designated intake handlers, party ids);
  - `RequestServices` (`PeopleCaseServices.xml`, included by `service-include`; `PeopleCases.js`): `create#PeopleCase`,
    `find#PeopleCases`, `get#PeopleCase`, `change#PeopleCase`, `assign#PeopleCaseHandler`, `add#PeopleCaseTask`,
    `check#PeopleCaseAccess`, `notify#PeopleCaseUpdate`, `get#CaseDocumentData` (their codes in the descriptions). A handler is an
    Assignee of the case holding PEOPLE_CASE_HANDLE; filing needs a current employment of the employee's and no permission (as a
    claim); the intake handlers must hold PEOPLE_CASE_HANDLE through an enabled account and work for the employer, never the
    employee; the case's people follow it from filing, so a note tells them;
  - the rule other readers apply, in `PeopleCases.js` (`caseIds`, `hiddenRequestIds`, `caseEvents`, `caseTaskIds`,
    `protectedTaskIds`): `get#RecordLinkInfo` admits a case, its files (`RequestContent`) and a communication event filed on one
    (the event or its thread's root, by RequestCommEvent or a CommunicationEventRecord) to its people alone, for every caller,
    authorization disabled or not, ADMIN and the staff rule included, before the client and finance rules; a task linked to a case
    to its current assignee alone, the same way. `Checklists.js protectedTaskIds` takes case tasks too, so the seven P7 call sites
    (CalDAV's Tasks, `get#MyTasks`, `get#FullCalendarData`, Today, search, Commons' task list, the record rule) leave them out;
  - the Request rules (F20): RequestTriageNotice, SupportCaseRule and SupportCaseSlaRule are conditioned on the type;
    `notify#RequestTriage`, `ensure#CaseProfile` (`CONFIDENTIAL_CASE`, so SupportCaseCustomerRule and the message and work clock
    rules find no profile) and `complete#RequestFromWork` leave a case alone; `create#Request` and `update#Request` refuse the type
    (`CASE_TYPE_RESERVED`) and `update#Request` a case ("not found");
  - the other readers: `notify#RecordMention` and `notify#RecordFollowers` send a case's notice on PeopleCaseUpdate to its people
    alone; `follow#Record` refuses a follower who is not one of them; `find#PartyCommunicationEvents` leaves out a note filed on a
    case; `search#Universal` drops a case and a note on one; `lookup#ById` finds no case; Today's record caption names no case;
    MantleRequest and MantleCommunicationEvent have `get#CaseDocumentData` as their manual data service and a post-query
    condition, so a case and its notes are never indexed; `save#RequestContentFile` keeps a case's files under `peoplecase/`, a
    folder the Records drive does not map (as an employment's).
- BOSS:
  - Screens: `People/Employees/Grievances` (menu 4 of Employees, every People user's and a self-service employee's by
    `BOSS_PPL_CASES_SELF`; the screen `ai-opt-out`): the user's cases (Show open, closed, all; phone columns; the state chip with its
    tui text) and Raise a concern (SubmitCase, the primary); `People/Employees/RequestDetail`: Shared/RequestDetail with People's
    branch (`template/PeopleCaseDetail.xml`, inside a section `ai-opt-out`, since a section-include does not carry an included
    section's): the record header with one primary by state (Start, Resolve, Reopen; the employee's Withdraw), a handler's More
    (Close without action, Add a handler, Remove a handler, Ask for work), the case, its people, the work asked of others, the
    conversation (Chatter of the request) and its files; no shell record context. SelfService links Grievances ("Raise a concern");
  - the People root's panels serve a case (and no other request) beside the HR hosts; the topic is declared there, its link
    (BossSetupData) opens RequestDetail; RecordFiles' change right on a case is `check#PeopleCaseAccess`'s; `get#RecordLink` opens a
    case under People for its people (`People.js caseLink`), else nowhere; Chatter's `send#Message` refuses a case;
  - every other app leaves a case out for everyone: Commons' `get#RequestAccess` ("not available", as an RFQ, so Commons' and
    Projects' request detail and services and Manufacturing's), `find#RequestRows`, Home's assigned requests, a contact's Requests
    tab, a call's screen pop, Commons' TaskDetail and Projects' WorkItemDetail linked records, Admin's open assignments
    (`Lifecycle.js`, an owner contract: design-admin's Offboarding preview says so);
  - grants: `BOSS_PPL_CASES_SELF` (Grievances, Shared/RequestDetail and Shared/Chatter by location for `BOSS_PEOPLE_SELF`, on
    `BOSS_PPL_FILES_SELF`'s ground); demo: Retail's intake handler is people.case (`BossPeopleDemoData.xml`); Services has none.
- Specs: Mantle `test/request/PeopleCases` (5 features, 2.5 s feature time: filing with the intake handler, its people reading it
  and the manager, HR without it, another employer's handler, ADMIN and the task's assignee refused its valid id, a retry, no
  employment and no handler refused, the notice's fixed title and no push; no triage notice, case profile or completion from work,
  the generic create and update refused; the record rule for the case, a note and a file with authorization disabled and a call
  with no user, the note telling its people alone and absent from the timeline, no outside follower, the search documents left out
  as the feed assembles them; the protected task out of CalDAV and other lists, its assignee refused the case; the moves at their
  revision, the last handler kept, the withdrawal). BOSS `PeopleAccess` gains the case rule (0.5 s: the handler and employee read it,
  the manager, HR, the People administrator and ADMIN refused with the same parameters; no Commons list, access check or lookup
  holds it; RequestDetail's one qvt render as the handler inside the opt-out, and its html render as the employee, opened by their own
  grant; Grievances by its own grant, refused another app's user; the Employees group with Grievances). Acceptance, written and not run:
  `acceptance/People/PeopleCasesUsable` (3 features: Tomas raises a concern from Grievances; only people.case sees it, through the
  list, the detail, its notes and files, and the manager, HR, the People administrator and ADMIN see nothing of it in Grievances,
  RequestDetail, the record rule, Commons' list and detail, the lookup and search, nor an agent's render of the handler's page; the
  handler asks IT for work, and IT reads the task and nothing of the case, the task out of their CalDAV and everyone else's reach).
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): Mantle PeopleCases 5 of 5 (2.5 s); the
  readers and Request rules it changed: CalendarChanges, CalendarServices, CommonsToday, ContactBooks, CrmMiscServices,
  InboxThreads, InternalMessages, Mailboxes, MantleSearch, PeopleChecklists, PeopleDirectory, RecordLinks, RecordVisibility,
  ReportLookups, StaffIdentity, SupportCases, SupportSla, UniversalSearch, WorkGitReview, WorkMyTasks, WorkProjectClients,
  WorkProjectPlan, WorkProjectRequests, WorkProjectServices, WorkTimesheets, CaseFeedback, SupportAssignment, SupportChannels,
  Recruiting, LeaveRequests (306 of 306), PurchaseRequests, RecordNotes, ReplenishmentRoutes, SupportRelations, WarehouseTransfers,
  WorkPlanToCashBasicFlow, WorkTimeEntries, SupportKnowledge, SupportPortal, SupportReplies, SupportTemplates, SupportWarranty (136
  of 136). BOSS PeopleAccess 23 of 23 (the new feature 0.5 s); the Commons, Comms, Projects, Purchasing, Customer Service,
  Commerce, Warehouse, Manufacturing, Admin, Insights and People specs over the changed readers (AccountingAccess, AdminAccess,
  AdminLifecycle, Calendar, Chat, Chatter, ClientBilling, CommerceAccess, CommonsSettings, CommsHome, Compose, Contacts,
  CustomerServiceAccess, CustomerServiceCases, CustomerServiceChannels, CustomerServiceWarranty, EventDetail, Files,
  InsightsRecords, ManufacturingAccess, ManufacturingDowntime, Notifications, PeopleAttendance, PeopleLeave, PeopleLifecycle,
  PeopleSelfService, PeopleTime, PeopleEmployees, PeopleSkills, PeopleExpenses, PeopleRecruiting, ProjectDetail, ProjectRequests,
  ProjectsAccess, PurchasingAccess, PurchasingRequests, PurchasingSourcing, QuickCreate, RecordFiles, Requests, Tasks, TodayPanel,
  WarehouseAccess, WarehouseTransfers, WorkItemDetail, WorkItems: 482 of 482). `moqui lint --screens`: 136 flagged sites, none in
  the changed screens; no TUI-text finding in them. Prettier clean on the new and changed JavaScript but People.js, which was not
  clean on master (its additions are). Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- Inventories: usl-inventory's People rows gain the case services with their screens; ss-inventory notes no baseline form maps to
  Grievances or People's RequestDetail.
- Design edits: design-people (header, §4 Grievances and §13 RequestDetail as built), design-crosscut §3.11's People row,
  design-admin's Offboarding preview (a case is no open assignment).
- Findings, numbered by the lead F336 to F346 in order:
  - The intake handlers are designated by the employer's PartySetting `PeopleCaseIntake` (seeded for Retail in the demo); there is
    no screen to set it until P29's Settings, and an employer with none refuses a filing (`NO_CASE_HANDLER`) rather than sending it
    to every holder of PEOPLE_CASE_HANDLE there (ADMIN holds it, so "every holder" would make the instance administrator a handler).
  - The phase's "usable when" says only the intake handler sees the case "in the list, the palette, search, files and Assist". As
    built, the list, files and notes are its people's, and the palette, universal search, the id lookup, record-lookup and Assist
    answer a case to nobody, its people included (design §2's Grievances and RequestDetail rows: no `Request requestId` exposed to
    Assist, and Assist's search reuses the palette's rows). The acceptance test checks nobody else finds it there.
  - The confidential type is an Enumeration of its own type, not a `RequestType`, so no type list or type check of another app
    takes it; `Request.requestTypeEnumId`'s relationship names the Enumeration by id alone, so nothing else changes.
  - A task linked to a case is reached only by its current assignee for every caller, authorization disabled too: stricter than
    P7's protected tasks (whose rule holds with authorization on). Its assignee is told on PeopleTaskAssigned, whose link opens the
    task in Commons, where its linked records leave the case out.
  - A party's timeline drops a case's notes after its query's page, so that page can show fewer rows than its size.
  - A message a case's people link to the case (Comms' Link to record) then follows the case: its own sender and recipients no
    longer see it outside People. The participants decide that; linking is not refused.
  - A Chatter or RecordFiles panel of a case requested under another root (Commons') still answers its people, by the record rule;
    only People's screens link a case. The panel check of each other root is not changed.
  - A handler who leaves keeps their Assignee row (reading needs PEOPLE_CASE_HANDLE as well, which an access end removes), Admin's
    lifecycle does not move cases, and nothing re-routes a case whose only handler left: its employee still reads it and nobody
    handles it. A re-route like P6's for approvals waits on the user's call.
  - `get#RecordLinkInfo` on a communication event now reads its case links (up to three queries) for every caller.
  - SupportCaseCustomerReply, SupportCaseSlaMessage and SupportCaseSlaWork still run on a case's messages and work; each finds no
    case profile and does nothing.
  - `BOSS_PPL_CASES_SELF` grants Shared/RequestDetail and Shared/Chatter by location (as `BOSS_PPL_FILES_SELF` grants RecordFiles),
    so a self-service employee may open them under any root whose path admits it; what they show is decided per record.
- For the lead:
  - budget share: mr-mantle about 2.5 s (PeopleCases); mr-boss about 0.5 s (PeopleAccess's feature); no client spec;
  - merge hot spots (P17 and P19 touch Approvals.js, People.js, People.xml, PeopleSpecLib.js, PeopleAccess.spec.js,
    BossSetupData.xml, Approvals.xml and Employee360.xml): mr-mantle `service/mantle/party/CommunicationServices.xml`
    (`get#RecordLinkInfo`'s case rule before the client rule, `protectedHidden`, the description; `find#PartyCommunicationEvents`,
    `notify#RecordMention`, `notify#RecordFollowers`, `follow#Record`), `service/mantle/request/RequestServices.xml` (the guards in
    create, update, triage, save of a file and complete from work; the includes at its end), `Checklists.js` (`protectedTaskIds`),
    `service/mantle/work/TaskServices.xml`, `WorkEffortServices.xml`, `CalendarDavServices.xml`, `search/UniversalSearchServices.xml`,
    `GeneralServices.xml`, `SupportCaseServices.xml`, `entity/Request.eecas.xml`, `data/MantleDocumentData.xml`,
    `MantleDocumentWorkData.xml`; mr-boss `service/ironstone/people/People.js` (the grievances location, `grievancesOpen`,
    `caseLink`, `selfServiceContext`, the exports), `ContextServices.xml` (self-service links), `screen/People.xml` (header, panel
    check, topic), `screen/People/Employees.xml`, `screen/Shared/RequestDetail.xml` (the transition-includes, the People branch of
    its actions, the wrapped section-include and RequestNotFound's condition), `screen/Shared/PeopleSelfService.xml`,
    `data/BossSetupData.xml` and `data/BossPeopleDemoData.xml` (appended at their ends), `test/People/PeopleSpecLib.js` (the
    Employees menus, the ids' end), `PeopleAccess.spec.js` (header, appended feature), `service/ironstone/commons/RequestServices.xml`,
    `TaskServices.xml`, `ContactServices.xml`, `PaletteServices.xml`, `screen/Commons/Home.xml`, `comms/ComposeServices.xml`,
    `projects/WorkItemServices.xml`, `shared/ChatterServices.xml`, `shared/RecordFilesServices.xml`, `admin/Lifecycle.js`, the
    inventories, design-people (header, §4, §13), design-crosscut §3.11, design-admin;
  - for the user's call: how an employer's intake handlers are designated (a setting, as built, or every case handler working
    there) and what happens to a case whose last handler leaves; and whether a case's people should find it in the palette and
    search (built: nobody does).

**Review Nov 12 (P21).** A fresh review of `git diff master...ppl/p21` in mr-mantle and mr-boss against the phase's text, §2, §4,
design §4 Grievances, §13 RequestDetail, crosscut §3.11, PE-01 and PE-21, confidentiality first and adversarially (as the manager,
an HR officer without the case, the People administrator, ADMIN, a linked task's assignee, a colleague and other apps' staff, each
with a valid id, through every app's request screens and services, the record rule, Chatter, RecordFiles, notices, search, the
palette, Assist and the lifecycle); the user's three calls of Nov 12 recorded in §4; fixes committed apart per repository ("People
P21 review: …"). Both branches were rebased onto master after P17's and P19's merges: mr-mantle with no conflict (P19's
EventServices and CalendarServices changes untouched); mr-boss with BossPeopleDemoData (P19's fire warden course, then Retail's
intake handler), BossSetupData (P17's offer topic and letter grant, P19's training topics and Assessment forms, then
`BOSS_PPL_CASES_SELF` and the case topic), People.xml (header and topics), PeopleSelfService (My training, then Raise a concern),
ContextServices and People.js (`trainingUrl`, then `grievancesUrl`), PeopleSpecLib (the course ids, then the handler), PeopleAccess
(header, P17's and P19's features, then the case feature, appended), design-people's header and usl-inventory, each keeping both
sides; the phase commits are now mr-mantle 5b92eeeb and mr-boss b58793c0. PeopleCases, Training, Offers, SupportCases and WorkProjectRequests (37 of 37) and PeopleAccess, Requests, ProjectRequests,
CustomerServiceCases and PurchasingRequests (61 of 61) passed after it.
- Checked and found sound:
  - The case services take the caller's own party and never a supplied one: filing under a current employment of the caller's
    (another's is RECORD_UNAVAILABLE), the intake handlers from the employer's setting, each eligible (an enabled account holding
    PEOPLE_CASE_HANDLE, working for the employer, never the employee); a handler is an Assignee row and the permission, the
    employee their Reporter row; anyone else, a missing case alike, is RECORD_UNAVAILABLE on get, change, assign, task and the
    list's id; the moves name the revision, the last handler stays, the employee only withdraws.
  - The record rule: `get#RecordLinkInfo` admits a case, its RequestContent and a note or message filed on it (the event or its
    thread's root, by RequestCommEvent or CommunicationEventRecord) to its people alone before every other branch (staff, client,
    ADMIN, authorization disabled, no user), and a task linked to a case to its current assignee alone; RecordFiles, Chatter's
    reads, Comms' links, Commons' event and knowledge links and the Records drive below the manage level all go through it.
  - Other apps (F20): RequestTriageNotice, SupportCaseRule and SupportCaseSlaRule are conditioned on the type alone (every other
    request takes the same branch as before); `ensure#CaseProfile` answers CONFIDENTIAL_CASE, so the customer, message and work
    clock rules find no profile; `notify#RequestTriage` and `complete#RequestFromWork` skip it; `create#Request` and
    `update#Request` refuse the type, `update#Request` a case. Customer Service, Commerce, Purchasing, Warehouse, Manufacturing,
    Insights (its RequestDetail source is the service clocks) and Projects (a project or a triaged RequestType) read requests by
    something a case never has; Commons' and Projects' detail go through `get#RequestAccess`. Their specs pass unchanged.
  - The AI opt-out: PeopleCase's subject, details, contact preference and outcome are `ai-opt-out`; Grievances is opted out as a
    screen and RequestDetail's People branch as a section (an agent render runs nothing of it); the data tool reads no request
    entity; MantleRequest and MantleCommunicationEvent mark a case and its notes out of the index (their manual data service and a
    post-query condition), and `search#Universal` drops an older hit; the notice's title is a fixed sentence and holds no text.
  - The palette, search, the id lookup, record-lookup and Assist answer no case for anyone (the user's call, as built); Today's
    record caption, a party's timeline, Home, a contact's Requests tab, a call's screen pop, TaskDetail, WorkItemDetail and Admin's
    open assignments leave it out; CalDAV's Tasks and every task list but its assignee's leave out a task linked to a case, and
    TaskDetail and WorkItemDetail show its assignee no case.
- Fixed:
  - R1 (high): a note on a case was reachable through its author's party record, where the record rule is not asked of the event:
    Chatter's `check#CommEventOnRecord` (an attachment of the note downloaded, a reply posted into the case's thread copying its
    subject, its unlink's answer telling it is there) and Mantle's `check#RecordNoteAccess` (ADMIN deleted a case note by the
    handler's party; its errors told whether a note was there); `reply#CommunicationEvent` checked a Message parent's visibility
    but not a Comment's; `link#CommunicationEventRecord` linked any event to a record the caller sees (its subject and text then
    on that record's timeline and in its followers' notices); the request comment services (`add#RequestComment`,
    `check#RequestComment` for update and ADMIN's delete), `get#RequestContentLocation` and `replace#RequestParty` (which could make
    anyone a handler) did not know a case. `PeopleCases.js hiddenEventIds` (the events filed on a case the caller is no part of)
    now answers such a note as missing in each, the request services refuse a case to anyone but its people, and
    `replace#RequestParty` refuses a case for everyone (its people change through `assign#PeopleCaseHandler`). Specs PeopleCases
    (the administrator's delete by party, the manager's reply and link, ADMIN's comment delete, HR's comment, ADMIN's party change
    refused; the handler's edit kept) and PeopleAccess (the administrator's Chatter reply on the handler's party record refused);
    each fails on the code as it was.
  - R2 (high, PE-21): an agent's render of the case's Chatter or Files panel as its handler (Assist's screen session going to
    `People/Chatter` or `RecordFiles` with the case, whose tui twins render the timeline's text and the file names) sent the
    case's notes to a model: RequestDetail's opted-out section does not cover the panels, which load as their own requests.
    ChatterTui and RecordFilesTui now answer a case as not available to an agent's render (`sri.isAgentRender()`). Spec
    PeopleAccess (the handler's agent render of the case's Chatter shows no note; fails on the code as it was).
  - R3 (low): Commons' `get#RequestAccess` answered a case `found` (then refused), which Projects' `get#ProjectRequestAccess` and
    `get#RequestDetail` pass on: a case is now answered as a missing request. Spec PeopleAccess (the manager's check).
  - R4 (the user's call of Nov 12, 2026; the worker's finding of a case whose only handler left): a handler who leaves the
    employer is taken off its open cases, and a case left with no handler goes back to the employer's intake handlers, who are
    told on PeopleCaseUpdate ("A confidential case was assigned to you"). `PeopleCases.js rerouteCases` (each open case of the
    employer: a handler who no longer handles cases there, or a named leaver, has their Assignee row ended and stops following
    it; with none left, the eligible intake handlers but the employee are added, follow it and are told; with no intake handler
    the case waits, logged, and the next call routes it; each case failure-tolerant) runs from Employment.js when a separation
    is applied in effect (the leaver named, in the apply's transaction) and from the daily job's `rerouteDueChanges` for the
    employers of the changes come since (their separations' people named). People's lifecycle participant
    (`find#OwnedApprovals`) lists the user's open cases as `case:<id>`, "Confidential case", not transferable, with no subject,
    employee or employer (`ownedCases`); `transfer#ApprovalOwner` refuses one (NOT_TRANSFERABLE); BossSetupData's participant
    description and design-admin's Offboarding preview say so. Spec PeopleCases (Hope, the case's only handler, lists it by name
    alone, is refused its transfer, leaves; the daily job takes her off, the case goes back to Hal, who is told once and reads it,
    and she reads it no more).
- Findings, numbered by the lead F347 to F353 in order:
  - The instance administrator's own tools read a case whole: Tools' Data (browse, grid, export, documents) and SQL, System's
    Resource (the `peoplecase/` files) and Audit (the request's status rows), Mantle's REST (`/rest/s1/mantle`, ADMIN's: its
    communication event and work effort reads); `/rest/e1` is refused for want of an entity grant on `mantle.*`. Attack-Surface
    keeps the designed admin tools privileged on purpose; adding `mantle.request.PeopleCase` (and the case's note bodies) to the
    framework's restricted entities, and `peoplecase/` to the Records drive's managed exclusion, is a framework change for the
    user to decide.
  - A NotificationTopicUser row with `allNotifications` on PeopleCaseUpdate (an instance administrator's, set in Tools) would
    receive every case notice (the case's id, a fixed title). The framework's notification has `direct_only`, which the JS API
    does not expose; once it does, `PeopleCases.js tell` sends direct-only.
  - Chatter's and RecordFiles' JSON transitions (the browser's panel) do not ask `isAgentRender()`; an agent's screen session
    renders tui, where R2 holds. The same panels of an employment's or a qualification's notes (P2, P18) are not opted out for an
    agent render either.
  - A message a case's people link to the case stays readable to its own sender and recipients in Comms through their party
    (the record rule now answers it as the case's): the worker's finding, unchanged.
  - `merge#Parties` reports a count of moved request parties that includes cases, and `delete#Contact` names a RequestParty or
    `Request.filedByPartyId` reference; both are a contact administrator's and say no more than that a case row exists.
  - A Records drive manager (`RdpManage` of `BOSS_RECORDS`, none seeded) sees the `peoplecase/` folder.
  - The search index's case mark on a message is computed when it is indexed; a message filed onto a case later stays indexed
    until reindexed (`search#Universal` drops it when read; a dataset over the `mantle` index would not).
- Tests run (release binary from the main checkout, `--nobuild`, this phase's runtime): after the rebase, as above; after the
  fixes, Mantle PeopleCases 7 of 7 (3.3 s feature time; the two new features 0.6 s), and the specs over what the fixes changed,
  RecordNotes, RecordLinks, InboxThreads, InternalMessages, PeopleEmployment, PeopleScheduledChanges, PeopleApprovals,
  PeopleChecklists, SupportCases, WorkProjectRequests, CaseFeedback, Training and Offers (115 of 115); BOSS PeopleAccess 26 of 26
  (the case feature 0.7 s), Chatter, RecordFiles, Requests, ProjectRequests, AdminLifecycle, PeopleLifecycle, PeopleApprovals,
  Inbox, CustomerServiceCases and PurchasingRequests (97 of 97). `moqui lint --screens`: 136 flagged sites as before, none new.
  Prettier clean on the changed JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about 3.3 s (PeopleCases, up 0.8 s from the Built note); mr-boss about 0.7 s (PeopleAccess's case
    feature, up 0.2 s); no client spec;
  - merge hot spots beyond the Built note's: mr-mantle `humanres/Employment.js` (the apply's reroute and `rerouteDueChanges`),
    `humanres/Approvals.js` (`findOwnedApprovals`, `transferApprovalOwner`), `PeopleApprovalServices.xml`,
    `party/CommunicationServices.xml` (`reply#CommunicationEvent`, `link#CommunicationEventRecord`, `check#RecordNoteAccess`),
    `request/RequestServices.xml` (`replace#RequestParty`, the comment services, `get#RequestContentLocation`); mr-boss
    `shared/ChatterServices.xml` (`check#CommEventOnRecord`), `Shared/ChatterTui.xml`, `Shared/RecordFilesTui.xml`,
    `commons/RequestServices.xml` (`get#RequestAccess`), `data/BossSetupData.xml` (People's lifecycle participant), design-admin,
    design-people §4 Grievances, P29's section (the intake setting's screen);
  - the user's calls (§4, Nov 12): intake by the `PeopleCaseIntake` setting with P29's screen (as built); a leaver's cases back
    to the intake handlers and listed in Admin's lifecycle (built here, R4); no palette, search, record-lookup or Assist for
    anyone (as built). For the user: the instance administrator's tools and the `allNotifications` subscription (the first two
    findings) need a framework decision. Gate 3 is the lead's to mark.

**Follow-up Nov 12 (follow-up 1).** After gate 3: the user's calls of Nov 12 (§4) on P21's review findings F347 and F348 and the
calendar follow-up's R3, and the calendar review's F358 and F359. mr-moqui 03f1b5d0, mr-mantle d13c2e1b and mr-boss (this commit),
branch `ppl/fix1`.
- Checked first (the code over the plan): the framework's `NotificationMessage::direct_only` (crates/moqui-core/src/notify/message.rs:
  `resolve_users` adds the `allNotifications` subscribers unless it is set; only moqui-report's business alerts set it) and the JS
  builder (script/host/notification.rs), which had no member for it; every `makeNotificationMessage` of People (eight senders) and the
  topics they use; Recruiting.js `tellAttendees` (a failing `send#EventInvitations` marks the interview's transaction rollback-only
  however the errors are taken back, docs/logic/Services.md) and the tx-commit pattern of P17's offer letter (PeopleRecruiting.secas.xml);
  Leave.js `project` (WetTimeOff written by entity-auto CRUD, owned by the employee, with no EventManager) and the production run's
  guard (BOSS `get#EventAccessInfo` only: a run is a WetEvent of purpose WepProductionRun owned by its organization, in no calendar, written
  by Manufacturing's own services, which call no event service).
- mr-moqui: `ec.makeNotificationMessage().directOnly(flag)` (no argument is true), documented in JS-Core-API and typed in
  `moqui-host.d.ts` and its golden (which also gain the documented `reason`, `record`, `actorUserId` and `appName` members they had left
  out); Attack-Surface's topic note names it, and its Tools note records the user's call on F347 (the instance administrator's own data
  tools read a confidential record whole: privileged by design). Spec EcApi (a direct-only notice to its named user alone; without it
  and with `directOnly(false)` the subscriber is told).
- Direct-only, decided per topic by whether its notice concerns a confidential record: PeopleCaseUpdate (`PeopleCases.js tell`, so the
  record notices of a case's notes too); every approval topic (`Approvals.js notify`: PeoplePositionApproval,
  PeopleEmploymentChangeApproval, PeopleLeaveApproval, PeopleAttendanceApproval, PeopleExpenseApproval, PeopleAdvanceApproval,
  PeopleOfferApproval, PeopleTrainingApproval, each to the step's deciders); PeopleLeaveDecision and PeopleTrainingDecision (the
  person's own decision); QualificationExpiring (the person's own document or permit); PeopleTaskAssigned (a protected checklist step,
  a separation's before it is announced, or a case's task). Left open: PeopleShiftChange (a roster the team sees), the shared
  EventInvitation, EventInvitationResponse and WorkEffortReminder topics (an interview's title names the opening, never the applicant; a
  leave reminder says "Out of office"), and the generic record notices of other People records (below).
- F358: schedule, change and cancel#Interview send nothing in their own transaction. Three tx-commit rules (PeopleRecruiting.secas.xml)
  run `RecruitingServices.send#InterviewInvitations` (new, not remote) once they commit, as the recruiter on a service worker: it sends
  `send#EventInvitations` as the system in a transaction of its own, so a failure is logged and answered (`invitationsSent` false,
  `invitationProblem`) and adds no error; another event is not sent. The three services lose `invitationsSent` and
  `invitationProblem`; ApplicantDetail says "the invitations are on their way" and "the attendees are being told".
- F359: the EventManager `PeopleLeave` (LeaveRequestSegment, its `workEffortId` now indexed `LEAVE_SEG_EVENT`; "its leave request in
  People") keeps approved leave's "Out of office" from update, cancel and restore#EventOccurrence, `add#CalendarEvent` and CalDAV for
  its employee and everyone; Leave.js writes and cancels it directly, as before. Production runs have the same gap closed by the
  EventManager `ProductionRun` (`mantle.work.effort.WorkEffort` of purpose WepProductionRun, seeded beside ProductionRunLine; "its
  production run in Manufacturing"): no user had a path to edit one (its organizer is the organization and runs are in no calendar),
  so it is defensive, for every caller of Mantle's event services rather than BOSS's alone.
- §4 records the user's three calls: CalDAV's delete of a view-only invitation (204, the event unchanged; as the calendar review built
  it), the admin tools reading a case whole (accepted), and case and other confidential notices direct-only (this follow-up).
  design-people §5's interview note and design-drawers-commons's editor rule say what was built.
- Specs (each new check fails on the code before): mr-moqui EcApi (the direct-only feature 0.00 s); Mantle Recruiting (F358: the
  change read inside its own transaction has sent nothing, the attendee is told after the commit, a send of no interview answers so
  with no error; 0.36 s), LeaveRequests (Ana refused the move and cancel of her approved afternoon, managed by PeopleLeave, HR's cancel
  still cancels it; in the cancellation feature, 0.98 s), CalendarServices (a run's organizer refused its move and cancel; 0.15 s),
  PeopleCases (ADMIN subscribed to every PeopleCaseUpdate message is not told of a filing; in the filing feature, 0.83 s).
- Tests run (the Debug build of mr-moqui `ppl/fix1`, `--debug --nobuild`, this runtime; the shared release binary has no
  `directOnly`): framework EcApi 7 of 7; `cargo test -p moqui-devkit typegen` 8 of 8; Mantle Recruiting and PeopleCases 17 of 17,
  LeaveRequests, LeaveLedger, CalendarServices, CalendarChanges, Dav, Training, Offers, PeopleApprovals, ExpenseClaims,
  Qualifications, PeopleChecklists, ShiftRoster, CommonsToday, Attendance, PeopleEmployment, ManufacturingServices,
  ProductionShopFloor, WarehouseProduction, ProductionDowntime 143 of 143; BOSS PeopleRecruiting, PeopleLeave, Calendar, EventDetail,
  PeopleAccess, PeopleApprovals, PeopleExpenses, PeopleTraining, PeopleSkills, PeopleLifecycle, PeopleSelfService,
  ManufacturingAccess, ManufacturingPlanning, TodayPanel, Notifications, PeopleTime, PeopleRoster 130 of 130 (PeopleAccess named over
  15 s in Debug, 15.12 s; unchanged here). `moqui lint --screens`: 136 flagged sites as before, none in ApplicantDetail. Prettier
  clean on the changed JavaScript but CalendarServices.spec, which was not Prettier-formatted before (left in its style). Not run:
  test-apps, test-framework, the acceptance suite.
- Findings (provisional, numbered by the lead):
  - The generic record notices still reach a subscriber to every message of their topic: `notify#RecordMention` (ChatterMention) and
    `notify#RecordFollowers` (RecordFollow) carry the record's name and the start of the note's text for an employment's,
    qualification's or applicant's notes (P2, P18, P16); only a case's notes go direct-only (PeopleCaseUpdate). Making them direct-only
    for People's records (or for every record) is a Mantle change for the user to decide.
  - Tools' TopicDetail calls a private topic (`isPrivate` Y) "only those a notification is sent to receive it", but the resolution
    adds `allNotifications` subscribers to a private topic's messages too (as Attack-Surface says, and as Java does); every People topic
    above is private, so the screen's word was wrong for them until now and still is for a private topic sent without `directOnly`.
  - A failed after-commit interview invitation is logged only: the recruiter is not told and there is no "send again" (the old message
    pointed at one that was never built); `send#EventInvitations` sends again whoever was not told at the next change. F358's spec
    reaches the failure path only through an event that is not an interview (a real send failure cannot be made from a spec).
  - get#ManagedEvents now reads LeaveRequestSegment (an indexed `in` query) and, for events of purpose WepProductionRun, WorkEffort on
    every page of calendar data and every event write.
  - PeopleAccess's spec time is at the 15 s cap in a Debug run (15.12 s; not measured on a release binary here, which has no
    `directOnly` until the framework merges).
- For the lead:
  - budget share: mr-mantle about +0.6 s (Recruiting's new feature 0.36 s, CalendarServices' 0.15 s, the checks added to LeaveRequests'
    and PeopleCases' features); mr-moqui server about +0.0 s; mr-boss none;
  - merge hot spots (P20, reviews and goals, is built beside this): mr-mantle `humanres/Approvals.js` (`notify`: one line and its
    comment; a review or goal approval kind added there is direct-only with the rest), `PeopleServices.xml` (`notify#PeopleTaskAssigned`),
    `Leave.js`, `Training.js`, `Development.js` (one line each), `Recruiting.js`, `RecruitingServices.xml`, `PeopleRecruiting.secas.xml`,
    `entity/PeopleLeaveEntities.xml`, `entity/ProductionEntities.xml`, `request/PeopleCases.js`, the specs Recruiting, LeaveRequests,
    CalendarServices and PeopleCases; mr-boss `screen/People/Staffing/ApplicantDetail.xml`, design-people §5, design-drawers-commons,
    usl-inventory (the RecruitingServices rows), impl-people (§4's last rows, this note); mr-moqui `script/host/notification.rs`, `moqui-host.d.ts` and its golden, JS-Core-API,
    Attack-Surface, EcApi.spec. P20's own notices (a review's, a goal's) concern confidential records and want `directOnly()` too;
  - the follow-up needs a framework merge with the apps: Mantle's People code calls `directOnly()`, which the release binary before
    mr-moqui 03f1b5d0 does not have (every People notice would fail, logged, and the change stay);
  - for the user's call: the generic record notices of People records (the first finding).

**Review Nov 12 (follow-up 1).** The fresh review of `ppl/fix1` (master had not moved in the three repositories; no rebase):
mr-moqui d623c7ab, mr-mantle 0e9267ea and mr-boss (this commit).
- Checked and found sound: `directOnly()` (script/host/notification.rs; no argument and any non-boolean are true, as
  `persistOnSend`) reaches `NotificationMessage::direct_only`, and every delivery path takes the one list `resolve_users` makes,
  which leaves out the `allNotifications` subscribers of a direct-only message: the persisted `NotificationMessageUser` rows (the
  tray, the inbox and `send#NotificationDigests`, which reads those rows only), the cluster topic's `userIds` that `/notws` and the
  TUI route by, the immediate email (`send_emails` over the resolved users) and Web Push; no other reader adds a topic's
  subscribers. The eight People senders call it after `userIds`, inside their try, so a failure is still logged and the change
  stays. F358: the tx-commit rules fire only on commit, so a failed or rolled-back schedule, change or cancel sends nothing; the
  send runs `send#EventInvitations` as the system with `requireNewTransaction`, its messages absorbed (`as_system`) and popped, so a
  failure marks nothing of the rule's own transaction; schedule, change and cancel#Interview are called only from ApplicantDetail.
  F359: no Leave, Manufacturing or BOSS code calls Mantle's event services on a leave event or a run (Leave.js and the
  production services write the WorkEffort directly), so the EventManager rows refuse only the calendar, Commons and CalDAV paths;
  `get#ManagedEvents`' added reads are by the page's own ids (`LeaveRequestSegment.workEffortId in`, indexed `LEAVE_SEG_EVENT`; the
  purpose map was already read for PeopleTrainingSession), bounded by its caller's list (a calendar page's events, a CalDAV write's).
- Fixed:
  - R1 (medium, mr-moqui): Tools' TopicDetail said a private topic reaches "only those a notification is sent to"; the resolution
    adds the `allNotifications` subscribers to a private topic's messages unless direct-only (the follow-up's second finding).
    The Kind row now says so.
  - R2 (the user's call, below; mr-mantle): `notify#RecordMention` and `notify#RecordFollowers` send direct-only for a record whose
    type is registered in the new `mantle.party.communication.ConfidentialRecordType` (`check#ConfidentialRecordType`: the full
    entity name, or the full name of a short one; `disabled` Y leaves it out), seeded beside People's hosts in
    HumanResourcesEntities: Employment, EmploymentApplication, PartyQualification. A case's notes already go to PeopleCaseUpdate
    (`isCase`, before the registration is read); P20's review host joins with a row. Other apps' notes are unchanged (the
    follow-up's first finding).
  - R3 (medium, mr-mantle and mr-boss): a failed after-commit invitation send was logged only (the follow-up's third finding).
    `send#InterviewInvitations` records its outcome on `ApplicationInterview` (`invitationSendStatus` failed, `invitationSendDate`,
    `invitationSendError`: an error, or an attendee `send#EventInvitations` skipped, by name and reason; a later send that tells
    everyone marks it sent, and nothing is written while none has failed); `get#Application` gives the application's recruiters
    alone `invitationsFailed` and `invitationProblemText`; ApplicantDetail shows the line under the interview's time with Send again
    (the `sendInterviewInvitations` transition; a cancelled interview's failed cancel too, where Change and Cancel are not shown).
    The service now checks its caller, a recruiter (PEOPLE_RECRUIT_EDIT) of the employer, since Send again reaches it from a screen
    (the rules run as the one who made the change, who passed the same check); another caller and an event that is not an
    interview are both RECORD_UNAVAILABLE (it had answered "Not an interview" without an error, which named what an id is).
    An attendee told already is not told again (the digest), so Send again tells only who was missed.
  - R4 (low, mr-mantle): `get#ManagedEvents` no longer reads WorkEffort a second time for a manager of a purpose whose entity is
    WorkEffort itself (ProductionRun): the purpose read is the row.
- The user's call (§4, Nov 12): People's confidential record notes notified direct-only (R2).
- Provisional findings (for the lead to number):
  - F358's real failure path was reached in a spec only now, through a skipped attendee (the recruiter has no address to email the
    candidate from); a whole-send error (an exception in `send#EventInvitations`) is still reached by no spec.
  - `EventInvitation` (an interview's invitation to the panel: its title names the opening and links the event), the reminder
    topics and PeopleShiftChange still reach an `allNotifications` subscriber, as the follow-up left them; a decision for the user
    if an instance administrator's subscription to those topics should not see interviews.
- Tests (the Debug build of mr-moqui `ppl/fix1`, `--debug --nobuild`, this runtime): framework AdminJobs and EcApi 11 of 11; Mantle
  Recruiting, CalendarServices, LeaveRequests, PeopleCases, RecordNotes, RecordLinks, Dav, CalendarChanges, CommonsToday,
  Qualifications, PeopleEmployment, ManufacturingServices 124 of 124 (RecordNotes' new feature 0.02 s, failing with the check
  answering false; Recruiting's F358 feature 0.71 s, was 0.36 s); BOSS PeopleRecruiting, Chatter, Calendar, EventDetail,
  ProjectsAccess, PeopleEmployees, PeopleSkills, PeopleLeave, ManufacturingPlanning 92 of 92 (PeopleRecruiting's change feature
  0.18 s, now posting Send again). `moqui lint --screens`: the same flagged sites before and after. Prettier clean on Recruiting.js
  and Recruiting.spec (RecordNotes.spec was not Prettier-formatted before; left in its style). Not run: test-apps, test-framework,
  the acceptance suite.
- For the lead:
  - budget share: mr-mantle about +0.4 s over the follow-up's (Recruiting +0.35 s, RecordNotes +0.02 s); mr-boss and mr-moqui about 0;
  - merge order: mr-moqui (d623c7ab and the follow-up's 03f1b5d0) before or with mr-mantle, whose People code calls `directOnly()`;
  - merge hot spots beside P20: mr-mantle `entity/PartyEntities.xml` (ConfidentialRecordType after RecordFollower),
    `HumanResourcesEntities.xml` (three seed rows), `PeopleRecruitingEntities.xml` (ApplicationInterview's fields),
    `CommunicationServices.xml` (the two notify services and the new check), `Recruiting.js` (`sendInterviewInvitations`,
    `interviewRows`), `EventServices.xml` (`get#ManagedEvents`), the specs Recruiting and RecordNotes; mr-boss ApplicantDetail
    (the transition and the Interviews row), PeopleRecruiting.spec, design-people §5, usl-inventory, impl-people (§4's last row, this
    note); mr-moqui TopicDetail. P20's review (and goal, if confidential) host wants a ConfidentialRecordType row beside its entity.

### P22 — Pay components, structures and groups

Design §8.1, §8.4 (the legacy disposition), PayComponents, PayComponentDetail, PayStructures, PayStructureDetail,
PayGroups; PE-08, PE-09 (the evaluator), PE-12 (the registration).

- **Framework PE-09** (mr-moqui, Remaining-Work's ask; F24): `org.moqui.impl.ExpressionServices`
  `validate#DecimalExpression` and `evaluate#DecimalExpression`, a declared grammar over named decimal inputs with an
  allowlist of functions, exact decimal, with no context, entity, I/O or service access by construction.
- **Mantle `mantle.humanres.payroll`:** PayrollComponent and its dated terms and account mappings,
  PayrollStructure and its components, PayrollGroup; PayrollSetupServices `find#Components`, `store#Component`,
  `preview#Component`, `publish#Component`, `find#Structures`, `store#Structure`, `store#StructureComponent`,
  `preview#Structure`, `publish#Structure`, `find#Groups`, `store#Group`, `prepare#Periods`. Configuration needs
  `PAYROLL_EDIT` and `PEOPLE_CONFIGURE`. The localization registration and `PayrollLocalizationServices`'
  calculation interface, with one synthetic, non-statutory demonstration localization that can never be live.
- **Screens:** the five screens, the constrained formula editor, examples before publish.
- **Specs:** framework `DecimalExpression` (exact decimals; an unknown name, function or anything outside the
  grammar refused); Mantle `test/humanres/PayConfiguration` (a cyclic or missing dependency blocks publish;
  overlapping published terms refused; a statistical component enters no total; no implicit currency or divisor).
- **Usable when** (`acceptance/People/PeoplePayConfigurationUsable`; design §14.3 "Localization readiness", its
  configuration half): `people.payroll` with `PEOPLE_CONFIGURE` builds a salary, an hourly and a deduction
  component with examples, composes a structure, previews gross to net, publishes, and sets up a monthly group
  whose readiness says it is preview only.

### P23 — Pay assignments and compensation

Design §8 PayAssignments, Employee360's Compensation; PE-08, PE-12 (profiles).

- **Mantle** PayrollAssignment and PayrollTaxProfile, PayrollSetupServices `find#Assignments`,
  `assign#PayStructure` (one primary per employment and date), `store#PayrollProfile` (fields only from installed
  localizations; bank changes through Accounting's payment-method services) and `get#Compensation`;
  `create#EmploymentSalary` extended to check `PAYROLL_EDIT` and end the row it replaces (F4).
- **Screens:** PayAssignments (Assignments, AssignPay, TaxAndBenefits); Employee360's Compensation, absent from
  the answer without `PAYROLL_VIEW`; EmploymentChange's pay change, payroll's part of a change, decided on
  `PeopleEmploymentChangeApproval`.
- **Specs:** Mantle `test/humanres/PayAssignments` (overlapping primaries refused; a salary change dated, the old
  row ended; compensation absent for HR without the grant, with the same parameters).
- **Usable when** (`acceptance/People/PeoplePayAssignmentsUsable`): `people.payroll` gives an employee a salary and
  a structure from a date and sees the readiness clear; `people.hr` opens the same Employee360 with no Compensation
  region.

### P24 — Pay inputs and hours for pay

Design §6 HoursForPay, §8 PayAdjustments, §8.1 (inputs); PE-09, PE-07 and PE-05 (their pay inputs).

- **Mantle** PayrollInput and PayrollInputSource and `mantle.humanres.PayrollInputServices`:
  `get#Reconciliation`, `prepare#Inputs` (idempotent per source entitlement; the group's time basis decides which
  stream pays), `store#Adjustment`, `find#Adjustments`, `decide#Adjustment` on `PeoplePayAdjustmentApproval`.
  The source-consumption guards in the owners' writers (owner contract): a worker invoice and payroll cannot both
  take a time entry (`vendorInvoiceId`), a consumed timesheet's reopen is refused once finalized, an authorized rate
  change invalidates an unfinalized approval (F44).
- **Screens:** HoursForPay (Reconciliation, PrepareInputs, ResolveInput), PayAdjustments; TimesheetDetail's refused
  reopen under People.
- **Specs:** Mantle `test/humanres/PayInputs` (preparing twice makes each input once; attendance and timesheet
  evidence pay an entitlement once; a time entry on a worker invoice is refused as a pay source, and the reverse).
- **Usable when** (`acceptance/People/PeoplePayInputsUsable`; design §14.3 "Source lock and worker invoice
  collision"): a period's approved weeks, leave and an approved bonus become inputs once; an unapproved week blocks
  its employee only; a worker invoice for a consumed entry is refused.

### P25 — Pay runs

Design §8.2 (steps 1–5), PayRuns, PayRunDetail (Population, Inputs, CalculateAndReview, Approval); PE-10.

- **Mantle** PayrollRun, PayrollRunEmployment and draft results, and `mantle.humanres.PayrollRunServices`:
  `find#Runs`, `create#Run`, `select#Employments`, `calculate#Run` (each employment in its own transaction, in
  bounded jobs that resume pending and failed units; the calculation sequence of design §8.1), `get#Run`,
  `approve#Run` and `return#Run` on `PayrollRunApproval` (a distinct approver; the exact population, amounts and
  revisions). No invoice or payment is made.
- **Screens:** PayRuns, PayRunDetail's first four steps with progress; the Today source of payroll exceptions for
  payroll operators only.
- **Specs:** Mantle `test/humanres/PayRuns` (one bad worker leaves the others calculated; a resumed run makes no
  second result; a mid-period salary change splits; the preparer cannot approve; a changed input invalidates the
  approval; a second regular run over consumed inputs refused).
- **Usable when** (`acceptance/People/PeoplePayRunsUsable`; design §14.3 "Salary/rate change and mixed pay",
  "Failure and restart", "Approval and concurrent finalization", its approval half): `people.payroll` runs the
  demo group's month with a salaried, an hourly and a piece-quantity worker and one with missing setup, fixes it
  and retries only that one; `people.payapprover` approves the exact totals.

### P26 — Payslips and corrections

Design §8.2 (corrections), Payslips, PayslipDetail, §15 (the payslip); PE-10, PE-17.

- **Mantle** Payslip and PayslipItem with their own identities, derived accumulators, the payslip content host,
  and `mantle.humanres.PayrollResultServices`: `find#Payslips`, `get#Payslip`, `issue#Payslip` (the stored PDF and
  an authenticated notice on `PayslipIssued`, no amount in it); `PayrollRunServices.create#Correction`. In preview
  mode a run's approved results become preview slips, marked as such and never issued as pay (§5 Q3). The legacy
  `EmploymentPayHistory` rows read only, by their own key, never recalculated; the demo has none, so the spec makes
  its own (F71).
- **Screens:** Payslips, PayslipDetail (PayBreakdown, StatementOutput, CorrectPay); SelfService's payslips card;
  the `people-payslip-explain` skill and prompt; `get#Payslip` exposed to the Assistant for own issued slips.
- **Specs:** Mantle `test/humanres/Payslips` (self reads own issued slips only; a correction is a new linked slip
  and the original stays; an off-cycle slip on the same date keeps its own identity).
- **Usable when** (`acceptance/People/PeoplePayslipsUsable`; design §14.3 "Regular, off-cycle and correction
  runs"): a preview slip explains each line from its source; a correction run links to it with the net effect;
  the employee sees neither until a slip is issued.

### P27 — Accounting handoff and settlement

Design §8.2 (steps 6–7), §8.3, §9 (the payroll route), PayRunDetail's Finalize and Settlement, §13 InvoiceDetail
(payroll); PE-11, AC-23 (built here, §4).

- **Mantle** PayrollObligation and `PayrollRunServices.finalize#Run` (under locks; draft invoices through
  `mantle.account` services, one per source and payee bucket, per-unit retry; refused for a group that is not
  live-enabled, which is every group in this build) and `get#Settlement`; the claim's payroll route (the original
  invoice reserved, a settlement line and no second expense) and an advance's recovery input.
- **Accounting** (owner contracts): `approve#Payable`, `change#InvoiceState` and `PaymentRunServices` require a
  completed finalization for a payroll-origin invoice. A payment run selects any approved invoice to the
  organization, so payroll and tax obligations reach it, and pays every one as `PtInvoicePayment` from the payee's
  newest bank account (F69): this phase has it take the payment type from the invoice type, as `create#InvoicePayment`
  does (`PtPayrollPayment`), and a payroll payee's `PmpPayroll` account first; its ACH file is PPD, so a tax
  authority is paid by check or its own channel in this build. And AC-23, built here following design-accounting (§4):
  the payroll-origin test over PayrollObligation in `ironstone.accounting.AccessServices` and the Mantle services
  behind the finance screens, search and exports, so per-person payroll documents need `PAYROLL_VIEW`. Native
  finalization and P28's external processing are both refused for an organization until the projection is in
  place.
- **Screens:** PayRunDetail's Finalize (showing why a group is not live) and Settlement; InvoiceDetail's payroll
  branch.
- **Specs:** Mantle `test/humanres/PayObligations` (with a spec-local live localization: obligations once per key;
  an incomplete finalization releases nothing; a claim on the payroll route makes no second expense; the design's
  1,000 + 100 − 40 example delivers 1,060); BOSS `AccountingPayrollOrigin` (a finance user without `PAYROLL_VIEW`
  sees the aggregate and no payroll invoice, with the same parameters as one who does).
- **Usable when** (`acceptance/People/PeoplePayHandoffUsable`; design §14.3 "Accounting and posting", "Payment and
  bank changes", "Localization readiness"): the demo group's finalize is refused with its two reasons; under the
  acceptance test's own live fixture a run finalizes once, Accounting posts and pays it, and a general ledger
  reader cannot open a worker's payroll invoice.

### P28 — Payroll exchange

Design §8.4 (external processing, migration), PayrollExchange, §15; PE-19. Ends stage 4.

- **Mantle** PayrollExchangeBatch and `mantle.humanres.PayrollExchangeServices` `preview#Batch`,
  `reconcile#Batch` and `execute#Batch`: export of approved inputs with a manifest; import of history (no
  obligations, no double count with opening balances); import of an external processor's results through the same
  slip and obligation path, native calculation refused for that scope, and live results refused until P27's
  payroll-origin projection is in place, as finalization is (§4, F30): they create the same payroll invoices.
- **Admin's registrations** (owner contracts, F16): the payroll exchange export target (a `file` target on the
  pattern of mr-mantle data/PartyContactExportData.xml:25-34, each field with its permission) and the exchange
  wizard as an import target with its `findService`.
- **Screens:** PayrollExchange (Exchange, Reconcile, CommitExchange).
- **Specs:** Mantle `test/humanres/PayrollExchange` (a file replayed adds nothing; history makes no invoice; a
  group in external mode refuses native calculation; live external results refused without the projection; a bad
  row reported, the rest applied).
- **Usable when** (`acceptance/People/PeoplePayrollExchangeUsable`; design §14.3 "History and provider exchange"):
  `people.payroll` exports a period's approved inputs, imports last year's history with one unknown worker named,
  and Admin's Exports and Imports list both.

### P29 — Reports, Insights and settings

Design §12 Reports and Settings (PeoplePreferences), §1.4 (shipped reports, Assist), §15; PE-17, PE-24.

- **Mantle `mantle.humanres.PeopleReportServices`** `get#Options` and `run#Report` over registered reports
  (headcount, joins, exits and turnover with its denominator; vacancies and the hiring funnel; attendance
  exceptions; leave balances; expenses; qualification expiry; review completion; the payroll register for payroll
  only), CSV-injection safe, exports from the same projection. PeopleServices `store#Settings`, which writes an employer's
  clocking default (§4, Nov 12): the employer's `PartySetting` `PeopleClocking`, Y or N (its type seeded in P13's review with
  `PeopleAttendanceEntities.xml`), audit-logged as a change of the employer's preferences, by a People administrator or an HR editor
  of the employer; P13's `Attendance.js isClockingOn` stays the one reader (an employment's own Y or N first), so the self-service
  clock, the + menu's Clock in and Who clocks follow it with no change. Should PeoplePreferences be one JSON setting as Projects'
  settings are, `isClockingOn` reads its key instead and the `PeopleClocking` rows move into it. The employer's confidential case
  intake handlers (P21; the user's call of Nov 12, 2026): `store#Settings` writes the `PartySetting` `PeopleCaseIntake` (party
  ids) by the People administrator of the employer, each checked as `create#PeopleCase` reads it (an enabled account holding
  PEOPLE_CASE_HANDLE, working for the employer), audit-logged; PeoplePreferences shows it with the handlers' names (never a case),
  and SetupReadiness warns for an employer with employees and no eligible intake handler (a filing there is refused,
  `NO_CASE_HANDLER`).
- **Insights' registrations** (owner contracts, F27): `report/boss-people-*.json` (a headcount and turnover dataset, a
  leave-balance dataset, a dashboard and the alert templates), each dataset's class row (`InsDcPeople`), catalog
  entries, metrics and attention providers on the built patterns, and the People step of the internal flow map
  given its targets. No shipped dataset carries pay. Each dataset also needs what any business dataset does (F70):
  a registered row-filter policy, its data feed and index, an admitted `BusinessDataset` row, its
  `org.moqui.report.dataset.<id>` artifact granted to People's Insights bundle only, and a readiness row for
  DataReadiness. Assist and MCP admit only the operations and cost classes, so an `InsDcPeople` dataset is refused
  to both with no code (F70).
- **Assist:** `skill/people-hire.md` and `people-policy-question.md`, `skill/aliases.json`'s rows, the root's
  response actions.
- **Screens:** Reports, Settings complete (SetupReadiness with every phase's checks, PeoplePreferences).
- **Specs:** Mantle `test/humanres/PeopleReports` (headcount as of a date; a pay report refused without the
  grant); BOSS `PeopleInsights` (the registrations resolve; an Assist or MCP question on a People dataset is
  refused).
- **Usable when** (`acceptance/People/PeopleReportsUsable`): `people.hr` runs headcount and turnover and exports
  it; an Insights reader with the People grant opens the dashboard and schedules the monthly report; an alert fires
  for a qualification expiring within thirty days.

### P30 — Clocking kiosk

Design §6 ClockingKiosk, §1.4 (devices), §15 (the badge); PE-05 (kiosk identity), PE-22. After P13 (punches) and on
Admin P18's device credential, built (F55); Insights P11's wall display is the pattern.

- **What a kiosk reads as** (impl-admin P18; F55): a device's request runs as a display account, a UserAccount nothing
  signs in, whose Person is a member of the employer it serves; the identity operator makes it in Admin's Users, the
  access administrator registers the device in Security › Devices. The display account is the request's user only,
  never a session's, and a revoked device's next request is refused. The worker is never the request's user: each
  punch names them by badge and PIN.
- **Mantle** kiosk identity: revocable opaque badge tokens and PINs (stored hashed, attempts rate-limited), the
  permission `PEOPLE_KIOSK_PUNCH` (granted to `ADMIN`, as P1's are), `AttendanceServices.record#KioskPunch` (only in
  a device's request, `UserSecurityChecks.currentDevice()`, with the permission; the device and its site from the
  registration; the worker from badge and PIN, whose employment must be with an organization of the display
  account's; an event key for retry) and the badge print over `ec.resource.barcodeSvg`.
- **The route group** (owner contract with Admin; F55): a `moqui.security.DeviceRouteGroup` row `PEOPLE_CLOCKING`
  (owner People, no fixed parameter, `homePath` `/apps/People/Time/ClockingKiosk`, the default idle timeout of a
  week) and its artifact group, an allow-list that grants nothing: ClockingKiosk's render and its punch transition, by
  name and not inheritable, as `BOSS_DEV_INS_WALL` names WallDisplay's (BossSetupData.xml:5008-5015).
- **The kiosk bundle:** a user group for display accounts, `BOSS_PEOPLE_KIOSK`, that opens the kiosk's page and
  transition alone, with `MANTLE_USER_ORG`, holds `PEOPLE_KIOSK_PUNCH`, and is a capability bundle the access
  administrator assigns (Insights' `BOSS_INSIGHTS_DISPLAY` is the pattern; P3's delegation rules decide whether a
  bundle with a permission needs more). It reaches no directory, payslip or search.
- **Screens:** ClockingKiosk, a page of its own, since a device cannot load the `/qapps` shell (impl-admin F285): a
  bare document with the screen as an island, as Insights' WallDisplay is, hidden from the menu. IdentifyAndClock at
  `density="handheld"` with `scan-input`, cleared after each confirmation and on idle; its tui render the screen's
  own. The People root calls no `get#SharedContext` for a device's request (screen/Insights.xml:49's pattern), since a
  display account holds no People root grant. Employee360's badge action.
- **Specs:** Mantle `test/humanres/KioskIdentity` (a wrong PIN refused and limited; a revoked badge refused; a
  retry with the key records once; a punch outside a device's request refused); BOSS `PeopleKiosk` (a display
  account with the kiosk bundle registered and redeemed; as the device, the page and a punch by badge and PIN, and
  People's other screens, the `/qapps` shell and the directory refused by the route group; the page's one render).
- **Usable when** (`acceptance/People/PeopleKioskUsable`): the identity operator makes a display account for
  ORG_ZIZI_RETAIL with the kiosk bundle and the access administrator registers a tablet for the kiosk; two workers
  clock in by badge and PIN, and a worker of ORG_ZIZI_SERVICES is refused; the tablet opens nothing else; revoking it
  refuses its next request.

### P31 — Finish

- The tui and server-static screen sweeps of People, one acceptance test per mode (each screen's twin is built in
  its phase).
- The design §14.3 review, acceptance tests (§8): "Confidentiality across every path" and "Navigation and devices"
  as walks of a user of each People group with no other launcher, through URLs, transitions, imports, exports, the
  palette, choices, Assist tools, files, Chatter, notifications and direct services; the phone-width checks.
- A check that each output of design §15 has its phase's screen action; none is built here.
- The inventories' **Implemented in** columns, the design's Impl column and crosscut's People rows,
  Remaining-Work (PE-21 and PE-09 built), the mr-boss README's People line.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into design-people.md or
the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 11, 2026 | The four apps are built People, Maintenance, Sales, Marketing, each with its own plan and order, not one shared order as Admin and Insights had. People is first and may use nothing from the other three | The user's call (the planning request) |
| Nov 11, 2026 | A connection between two of the four apps is built in the plan of the app built later; the earlier app's plan lists it in §7, naming the plan that picks it up. People's links to Maintenance, Sales and Marketing are in §7 | The user's call |
| Nov 11, 2026 | People's plan picks up what the built apps left waiting on People, each in the phase where its records exist (§1 scope) | The user's call. The privacy provider is the exception: it waits on Admin's own later PrivacyServices (F47) |
| Nov 11, 2026 | Scope is every `parity` and `new` row of design-people §2 and the needs they use; `later` rows and later capabilities go to §7 | The user's call |
| Nov 11, 2026 | The order of §1: the employee record; time and leave; expenses, recruiting, development and cases; payroll in preview mode; reports, the kiosk and the finish | The plan's choice, on design §14.4. Payroll is last because it reads every other stream and no group can be live in this build |
| Nov 11, 2026 | People builds the part of MT-03 it needs, under MT-03's names: `WorkEffortProcessPolicy` and `WorkEffortStepPolicy`, minimal (the using policy and a guards-execution flag; a step's role, due offset and required flag), `mantle.work.ProcessServices.store#ProcessStep` and `instantiate#WorkProcess` (the two-pass copy, in its own module), and People's policy, which asks for no evidence, readings or waivers and whose flag is false (P7). Maintenance's P6 extends both records (evidence, readings, waivers, publication, the checked path of design-maintenance §4.2) and sets the flag for its procedures. `WorkEffortSkillStandard.minimumSkillLevel` is People's too (P18) | The plan's choice, corrected in review (F54) and reconciled with impl-maintenance §4: People is first and ProcessServices does not exist (F14). Maintenance extends the same records and services and does not replace them. The managed-work rule, in the same words there: the generic task and work-effort services refuse a root that has a MaintenanceWorkOrder row and its steps, and work whose process policy guards execution; People's checklist tasks stay ordinary tasks. `test/work/WorkProcess` must pass unchanged after Maintenance's P6 |
| Nov 11, 2026 (review) | People makes the survey builder work for a second app (P16): the four shared screens read a per-app registration, the form definition services move to `mantle.party.FormDefinitionServices`, and People's purposes are private to assigned respondents. Marketing's plan adds its registration and the public purposes | The rule above: People is the earlier of the two apps that mount it after Customer Service (F51). impl-marketing P12 builds on it: Marketing's registration, the lead and registration purposes, and the publication services in `mantle.party.FormPublicationServices` (its §4) |
| Nov 11, 2026 (review) | People builds the projected calendar kind in `get#DavCollections` (P12), generic over an owner service; Maintenance's two collections (its P19) and Marketing's campaign calendar (its P21) register on it | CX-SYNC names one kind; People needs it first (F22) |
| Nov 11, 2026 | Mantle seeds the `PEOPLE_*` permissions and `PAYROLL_APPROVE`, each granted to `ADMIN`; BossSetupData grants them to the groups of design §1.1 | The plan's choice, as `PAYROLL_VIEW` and `PAYROLL_EDIT` are seeded (F2): Mantle's services check them and Mantle may not depend on BOSS data |
| Nov 11, 2026 | People's import targets name the app's own import permission, `PEOPLE_IMPORT`, with the People permissions they named and no `ADMIN_*` permission: `employees` asks `PEOPLE_IMPORT` and `PEOPLE_HR_EDIT` to import and `PEOPLE_HR_VIEW` to view (P7), and the time-and-attendance wizard target names `PEOPLE_IMPORT`, which its wizard services check (P13). Mantle seeds the permission, BossSetupData grants it to `BOSS_PEOPLE_HR`, and it is in the HR capability bundle (P1) | The user's call, one answer for the four apps (impl-sales §4): each app has an import permission of its own. A target's permissions are all required (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82), so `ADMIN_TRANSFER_RUN` beside them, as staff invitations have, would shut HR out of its own import; Admin's Imports lists a run for a data operator who also holds `PEOPLE_HR_VIEW` |
| Nov 11, 2026 | Projects' time screens and Rates are mounted under People as they are, made to read their context from the mount; they are not copied or moved to `screen/Shared/` | The plan's choice (F17): one definition, the owner's services; Projects' routes do not move. P0 found the change larger than "small" (F57): links from the mount, permissions for the group-name checks, line reports in the pickers, Rates' pay rows; P10 lists it |
| Nov 11, 2026 | A department carries the `OrgDepartment` role and a `PrtOrgRollup` to its parent, never `OrgInternal`; Admin's Organizations keeps the legal organizations | F11, F12; design-admin §7 already says so; design-people §4 changed |
| Nov 11, 2026 | The framework's per-field AI opt-out (PE-21) is built in P12 and the decimal evaluator (PE-09) in P22, by this plan | The plan's choice: both are Remaining-Work asks only People needs now (F24) |
| Nov 11, 2026 | Self-service clocking (P13) does not wait for the kiosk; ClockingKiosk and kiosk identity (P30) are built in stage 5 on Admin P18's device credential, which is built: a page of its own that a device reads as a display account, People's route group and a kiosk bundle (F55) | The plan's choice: the device credential is Admin's (F24). Corrected in P0: P30 no longer waits and stays before the finish |
| Nov 11, 2026 | Each People approval topic is seeded in Mantle with the phase that builds its decision service, not all in P5 | The plan's choice: a topic that names a missing service would be a broken approval |
| Nov 11, 2026 | People's lifecycle participant is the user's open People decisions and the approval rules that name them (P5), with openings and review steps joining it | The plan's choice: design-admin §14 names People's entry, not what People owns per user |
| Nov 11, 2026 | The regression budgets may be raised by this plan's estimates as its phases land, each raise by the phase's measured share: about 60 s on mr-mantle, 20 s on mr-boss's server budget, 8 s on its client budget and a second or two on the framework's. A raise beyond an estimate needs the user's agreement again. No spec may pass 15 seconds, as before | The user's call (AGENTS.md: a budget is raised only with the user's agreement). The estimate: about thirty Mantle specs, eighteen BOSS specs, one client walk and two framework specs, at the earlier apps' measure (about two seconds a Mantle spec, about 20 s of server budget and 5 to 8 s of client budget an app). Today mr-boss is 264 s server and 57 s client, mr-mantle 393 s (F37). A phase that would pass an estimate cuts a duplicate or moves a scenario to acceptance |
| Nov 11, 2026 | One golden-path client walk, `PeopleHireWalk` (P6); every other walk is an acceptance test | Build-Test's rule |
| Nov 11, 2026 | There is one labor costing purpose, `RaprCost`. P10 seeds it, builds `get#CostingRate`, and changes Manufacturing's built code and data to it: the `RaprProductionCost` rows become `RaprCost` and the lookup in mr-mantle `ProductionShopFloor.js` calls `get#CostingRate`. Maintenance reads `get#CostingRate` only | The user's call. An owner contract with Manufacturing, whose specs are kept passing (F34); two purposes would leave Accounting's LaborCostingRates form editing rates production does not read. Projects' cost reports switch in its owner's later work (§7). impl-maintenance §4, impl-manufacturing §7 and the designs say the same |
| Nov 11, 2026 | P27 builds Accounting's payroll-origin projection (AC-23), following design-accounting, and external payroll processing (P28's live results) is gated on it as native finalization is | The user's call: there is an Accounting app, but accounting functionality is in practice spread among the other apps, so the app that needs a piece builds it, as an owner contract following design-accounting. AC-23 was designed and in no plan (F29), and external results create the same payroll invoices (F30). Maintenance builds AC-24 on the same ground (impl-maintenance §4) |
| Nov 11, 2026 | A hire's provisioning proposes `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default, and the account request is optional on ConfirmHire | The user's call, as recommended. Design: no login merely for payroll. Anything more is chosen by HR from the bundles HR may grant, and Admin's delegation rules decide (P7) |
| Nov 11, 2026 | Payroll stays generic in this build: no country localization, only the synthetic demonstration localization (P22). The phase order of §1 stands as written | The user's call. A real deployment needs a localized configuration and, in some cases, service changes as well; live finalization, full and final settlement, compensatory leave and overtime follow the first real localization (§7) |
| Nov 11, 2026 | §5 Q3, Q6, Q7 and Q8 are taken as recommended: a payslip in preview mode is a preview slip for payroll only (P26); Mantle's `OrgInternal` demo departments stay as they are (P3); mileage and per-diem lines are later (§7); legacy leave and pay rows are read only and labelled historical, with no migration (P11, P26; §7) | The user's call |
| Nov 11, 2026 | The People acceptance tests (each phase's "usable when", the §8 scenarios and P31's sweeps and walks) are written in their phases and run once, after the full suites at the end of the build | The user's call, as for Admin and Insights; a phase runs only its own regression specs (§2 Done) |
| Nov 11, 2026 | `PEOPLE_ALL_ORGANIZATIONS`, as Commerce's and Warehouse's `*_ALL_ORGANIZATIONS`: Mantle seeds it granted to `ADMIN`; `PeopleServices.get#Scope` makes a staff reader's employers every internal organization, or the active one, for its holder (it reads nothing by itself); BossSetupData grants it to `BOSS_PEOPLE_ADMIN` and puts it in that group's capability bundle | The user's call on P1's question (built in P1's review, R1). The People administrator, an agent of some organizations, works every employer as the Commerce and Warehouse administrators do; design §1.1 and crosscut §1.4 changed |
| Nov 11, 2026 | An internal child organization with no employees (Warehouse's `BOSS_WH_RETURNS` under Retail, among a Retail reader's organizations by F49's one level of children) stays an employer choice | The user's call on P1's question: left as built. It counts nothing and has no readiness check; P3's OrgStructure shows it as a legal organization under Retail |
| Nov 11, 2026 | Projects' time screens are mounted under People as the row above says; P10 changes Projects' `TimeServices` and time screens as an owner contract to read their context from the mount (F57's list), and sets the `line` `ProjTimesheetPolicy` on People's demo employers | The user's call (from P0's F57), for P10: P10's text already lists the changes; nothing changes in P1 |
| Nov 11, 2026 | At most two phase workers run at once, and only as a pair §1 lets run side by side: P9 with P10; in stage 3 two of the tracks P15, P16–P17, P18 and P21 (P19 and P20 after both P16 and P18); P22–P23 beside a stage 3 track. Every other phase runs alone, in §1's order | The user's call. A pair that appends to the same file rebases before merging (§1) |
| Nov 11, 2026 | Mantle seeds an `EmailWork` contact purpose; the directory and every People projection of a work email (the list, the export, Employee360's Overview, the palette and the record-lookup card) show only `EmailWork`, never `EmailPrimary`; People's demo stores its employees' work emails under `EmailWork` | The user's call on P2's question (built in P2's review, R1). `EmailPrimary` may be a person's own address. No other app's spec or screen reads the demo employees' emails; a purpose drop-down offers "Email - Work" |
| Nov 11, 2026 | An employment's files and activity stay HR's (an HR reader of its employer, as built in P2): the person does not read the files on their own employment | The user's call on P2's question: left as built (design §4 Employee360) |
| Nov 12, 2026 | The Commons-wide calendar editor hole of P19's review (F330) is fixed in Commons now, generally: putting an event in a calendar gives view only to whoever could not change it, and an event an app keeps (People's training sessions and interviews, any app's through `EventManager`) changes only through that app; interviews get `change#Interview` and `cancel#Interview` | The user's call; built in P19's follow-up (Commons calendar editors) |
| Nov 11, 2026 | A user's organizations (`PartyServices.get#PartyInternalOrgIds`, so `userOrgIds` and `filterOrgIds`) admit an internal organization's rollup children only when they are internal (`OrgInternal`) themselves: a department or team is never an organization in any app's scope, and People walks its units itself (F49). Admin's Organizations counts and lists only internal child organizations, and Accounting's and Purchasing's cost centres are the internal ones (the ledger's dimension rule) | The user's call on P3's question: kept as built in P3; P3's review carried it to the readers of rollup children that assumed every child internal |
| Nov 11, 2026 | Department memberships stay open in P3 (`store#Membership` writes a department's members as a team's). P6 makes the employment assignment write the department membership and makes OrgStructure read only for a department's members, a team's staying editable | The user's call on P3's question; P6's text gains it |
| Nov 11, 2026 | An emergency contact is a Person party per contact, linked from the employee by a dated `PartyRelationship` of a new type; built in P8 (PersonalInfo and SelfService) | The user's call on P2's F80; P8's text gains it |
| Nov 11, 2026 | A pay grade has an optional owner, `PayGrade.organizationPartyId` (a Mantle entity field): a grade owned by an employer is read by that employer's staff readers and changed only by a payroll editor of that employer, and is a missing grade to every other employer; a shared grade (no owner) is read by every staff reader and changed only by a holder of `PEOPLE_ALL_ORGANIZATIONS` (ADMIN holds it); a band's amounts stay `PAYROLL_VIEW`'s. A position takes its employer's grades and the shared ones. Job classes stay shared by every employer, changed by HR editors. People's demo grades get owners where they are one employer's (Associate and Manager Retail's; Lead shared) | The user's call on P4's question (built in P4's review, R1; design §5, §5 PayGrades) |
| Nov 11, 2026 | Changing a pay grade or its bands needs `PAYROLL_VIEW` and `PAYROLL_EDIT` only, as built in P4; `PEOPLE_CONFIGURE` stays for P22's pay components, structures and groups | The user's call on P4's question; design §1.1 says so |
| Nov 11, 2026 | An HR vocabulary value is ended through Mantle's extension of the framework's `Enumeration` (`thruDate`), as built in P5, not a People record of its own; People's choices that offer an HR vocabulary leave ended values out and its services refuse one for a new record (JobClassDetail's skill types and `store#JobRequirement` in P5's review; each later phase's vocabulary choice the same) | The user's call on P5's question. Other apps' choices of the same families (Projects' and Products' skill drop-downs, Manufacturing's routing skills) are theirs and still list every value |
| Nov 11, 2026 | When an approver leaves, P6's separation routes each People decision waiting on them again (the step's alternate, then the HR fallback, else it waits) and notifies the new approver; Admin's lifecycle transfer stays for an explicit hand-over of a rule | The user's call on P5's question. P5's review made routing skip one who no longer works for the employer and exported `Approvals.js`'s `reroute(organizationPartyId[, approvalKindEnumId])` for P6 (P6's text gains it) |
| Nov 11, 2026 | Deciding a People approval step needs `PEOPLE_REQUEST_APPROVE` for everyone, HR-routed steps included (`PEOPLE_HR_EDIT` decides nothing); BossSetupData grants `PEOPLE_REQUEST_APPROVE` to `BOSS_PEOPLE_HR` (and its capability bundle), so the demo HR still decides HR steps | The user's call on P5's question (built in P5's review, R1; design §1.1 and §12 changed) |
| Nov 11, 2026 | Of the employment changes only a transfer and a separation wait for approval, as built in P6; a manager change, a leave of absence and a return are HR's at once. The pay change joins the `PeopleEmploymentChangeApproval` topic in P23 | The user's call on P6's question (design §12's topic names transfer, pay change and separation; design-people §4 EmploymentChange) |
| Nov 11, 2026 | `Employment.emplPositionId` holds the seat in effect: a change in effect now sets it at once, and one dated later only on its date, through a daily ServiceJob (`apply_EmploymentDueAssignments`, `PeopleServices.apply#DueAssignments`: each employment in its own transaction, a failure logged and the rest going on, a rerun changing nothing). The occupancy rows stay the dated truth | The user's call on P6's question (built in P6's review, R2; design-people §4). TimeServices' rate lookup and the contact card no longer read a seat before its date |
| Nov 11, 2026 | The hire and change wizards keep their unfinished drafts in a draft record (style-guide §3.10), not the session: `mantle.humanres.employment.EmploymentDraft`, a dated row owned by its HR user, resumed when the wizard is opened again, discarded when the hire or change is made or given up, and read only by its owner | The user's call on P6's question (built in P6's review, R3; design-people HireEmployee and EmploymentChange) |
| Nov 11, 2026 | The hire's person search finds by name only the people with a relationship to the HR officer's employers (employees, contractors, contacts, applicants and the like); anyone else is found only by an exact email, to avoid making a duplicate. Answers stay names and public identity, and a person chosen by id is refused as missing unless related or matched by the email given | The user's call on P6's question (built in P6's review, R1; design-people HireEmployee). Narrows F59's search: a person another employer employs is found by their email |
| Nov 11, 2026 | HR's own editors move out of Settings: ChecklistTemplates and EmployeeImport are under Employees (HR's area, `People/Employees/ChecklistTemplates` and `People/Employees/EmployeeImport`, with their grant `BOSS_PPL_HR_AREA`), and People Settings stays the People administrator's: HR does not open it | The user's call on P7's question (built in P7's review, R7; design-people §12 ChecklistTemplates and EmployeeImport). The menus, link keys, the import's owner route and mount, PeopleAccess and the acceptance test's paths follow |
| Nov 11, 2026 | A hire's provisioning still waits for an identity operator (Admin's rule stands), and the request notifies the employer's identity operators through a notification topic, `IdentityOperatorRequest`, seeded in Mantle with the service that owns it (`IdentityServices.request#Provisioning`; `request#AccessEnd` the same), its title naming only the person and employer an operator sees on the operation, so they act from the tray or LifecycleOperations | The user's call on P7's question (built in P7's review, R8; design-admin §4.1). BossSetupData links it to LifecycleDetail |
| Nov 11, 2026 | An equipment return task is assigned to the leaver's manager at that employment (from the assignment the separation ends), falling back to the HR officer who asked for the separation | The user's call on P7's question (built in P7's review, R9; design-people §4). An offboarding step of the Manager role is assigned the same way |
| Nov 11, 2026 | A scheduled (later-dated) separation is withdrawable by HR like the other scheduled changes: no access end and no return tasks follow, and its checklist tasks are cancelled | The user's call on P7's question (built in P7's review, R10, with a spec; design-people §4, design-admin §4.1) |
| Nov 11, 2026 | Emergency contacts are hidden through the disabled system account `_PEOPLE_PRIVATE_` as each contact party's `privateOwnerUserId` (no one signs in as it, it holds no group, so every reader that hides a personal contact shows the party to no one, and People's services show it to the person and HR of their employer), not a party-level private flag | The user's call on P8's question (built in P8; P8's review makes the account with the first contact rather than seeding it, R1) |
| Nov 11, 2026 | HolidayCalendars stays under Time & leave as HR's own screen (`People/Time/HolidayCalendars`, `BOSS_PPL_HOLIDAYS`), not under People Settings as design §7 placed it | The lead's call, following the user's call of Nov 11 that moved HR's editors out of Settings (P7's review); as built in P9 (design-people §2, §7) |
| Nov 11, 2026 | The four timesheet notification topics link through a neutral record-link resolver, so a notice opens People's or Projects' screen for whichever the user may open, as the tray does, a TimesheetMissing week with no timesheet included; Projects users' links keep opening Projects | The user's call on P10's question (built in P10's review, R2: Commons' `openRecord` over `get#RecordLink`, the docType `MantleTimesheetWeek`; design-projects §8, design-people §13) |
| Nov 11, 2026 | My team's Last week lists only reports who keep time: those who kept time in recent weeks (the last eight) or whose employer's timesheet policy requires it; the others show nothing | The user's call on P10's question (built in P10's review, R3: `get#LineReports`' `keeperIdList`, the policy key `rq`; design-people §3, §13) |
| Nov 11, 2026 | `RateAmount` gains an optional `organizationPartyId`, used for `RaprCost` rows: `get#CostingRate` prefers the employer's row, then a shared one; `store#`/`end#CostingRate` and Accounting's Labor costing box are scoped by organization (a shared row needs an all-organizations grant to change, as pay grades do); Projects' rate rows unchanged | The user's call on P10's finding (built in P10's review, R4, with LaborCostingRate's spec; design-accounting §15, design-people PE-23) |
| Nov 11, 2026 | A shared (no-organization) costing rate is changed by an Accounting administrator working with no active organization chosen, or by ADMIN, as P10's review built it; there is no `ACCOUNTING_ALL_ORGANIZATIONS` permission | The user's call on P10's first finding (F190): kept as built (design-accounting §15) |
| Nov 11, 2026 | Leave policies (with LeavePolicyDetail) and Allocations stay under Time & leave as HR's own screens (`People/Time/LeavePolicies`, `LeavePolicyDetail`, `LeaveAllocations`, `BOSS_PPL_LEAVE`), not under People Settings as design §7 placed them, as Holidays | The lead's call, following the user's call of Nov 11 that moved HR's editors out of Settings (P7's review); as built in P11 (design-people §2, §7) |
| Nov 11, 2026 | The team calendar (and its Team absence CalDAV collection) shows an employee their own team's absences: the approved leave of the people who share their department, one of their teams or their manager, at an employer of both, as the days alone ("{person} · Out", a morning or an afternoon said so), never the leave type, the reason or a waiting request, and never opening the request; managers and HR see what P12 built (their reports', their employers'). MyTeam's Who is out and Today's leave starting for my team stay a manager's reports' | The user's call on P12's finding (built in P12's review: `Leave.js colleaguesOf`, LeaveRequests checks a colleague by manager and by team; design-people §13 TeamCalendar, §3, §1.4) |
| Nov 11, 2026 | A leave ledger allocation's or adjustment's reason is HR's working note, shown only to HR of the employer (`find#Ledger`), as P12 built it (F202) | The user's call on F202, as built; LeaveLedger checks the person does not read it and HR does (P12's review) |
| Nov 12, 2026 | A quick create can carry a condition the shell checks: the framework's `quick-create` takes a `condition-service`, a service (the interface `org.moqui.ui.ShellServices.offer#QuickCreate`) the shell calls as the app root that declares the kind, in a transaction of its own, whose `offer` true offers the kind to the session's user; false, no answer or a failing or missing service leaves out that kind alone, logged. People's Clock in uses it (`AttendanceServices.get#ClockOffer`): offered only to a user who clocks for a current employment of their own | The user's call on P13's finding (built in P13's review: mr-moqui `screen/shell.rs`, xml-screen-3.xsd, ShellServices.xml, docs/ui/Qvt-Client.md, the gallery's galleryTask; framework spec ShellQuickCreate and cargo's shell test; design-people §1.4, design-drawers-commons §1.5) |
| Nov 12, 2026 | Clocking is an employer's default with per-employment exceptions: the employer's `PartySetting` `PeopleClocking` (Y on; none or N off) unless the employment's `clockingEnabled` says Y or N (empty follows the employer); `Attendance.js isClockingOn` is the one rule every reader uses (record#Punch, get#MyClock, find#Clocking, get#ClockOffer, and later the kiosk and hours for pay). P29 builds the employer setting's screen | The user's call on P13's finding (the rule built in P13's review; Who clocks shows each employment's own setting or the default, with Turn off and Follow the employer; P29's text gains the screen; design-people §6) |
| Nov 12, 2026 | Rostering has its own permission, `PEOPLE_ROSTER_EDIT`: Mantle seeds it granted to `ADMIN`; `ScheduleServices.store#Shift` (its preview too) and `publish#Shifts` require it of managers and HR alike, on top of their scope (a manager's live line at the employer; an HR editor's employer with PEOPLE_HR_VIEW and PEOPLE_HR_EDIT), refusing `PERMISSION_DENIED` without it; `get#Roster` answers every lane read only to the manager or HR without it, so ShiftRoster's and ShiftRosterTui's actions (Add shift, Save shift, Remove shift, Publish) are not offered. BossSetupData grants it to `BOSS_PEOPLE_MANAGER` and `BOSS_PEOPLE_HR` and puts it in both capability bundles | The user's call on P14's first finding (built in P14's review, R1: People.js `rosterEdit`, Shifts.js `rosters`; Mantle's ShiftRoster and PeopleAccess's roster feature check the holder and the non-holder; design-people §1.1 and §6 ShiftRoster) |
| Nov 12, 2026 | Expenses have their own permission, `PEOPLE_EXPENSE_MANAGE`: it reads every expense claim and advance of the user's employers and acts for an employee (a claim made, changed, submitted or cancelled, an advance asked for them). Mantle seeds it granted to `ADMIN`; BossSetupData grants it to `BOSS_PEOPLE_HR` and to Accounting's payables group `BOSS_ACCOUNTING_AP` (which holds Expense posting) and adds it to both capability bundles. It replaces the PEOPLE_HR_VIEW with PEOPLE_HR_EDIT and the PAYROLL_VIEW uses in `ExpenseServices`; the claimant's own and the approvers' route are unchanged | The user's call on P15's question (built in P15's review, R1: Expense.js `expenseScope`, People.js `expenseManage`, not a staff read; PeopleAccess's holder and non-holder; design-people §9) |
| Nov 12, 2026 | An approved employee advance is paid through Accounting's payment authorization and payment runs like other payables, not as a prepayment made at once in Expense posting: its last approval makes a bill from the employee to the employer (one `ItemAdvancePay` line on the employee advances account, due when the advance is needed, received), which finance approves for payment and a payment run pays; `apply#Advance` applies the paid advance to a claim. A payment run leaves out an expense claim reserved for payroll (P27 finishes the payroll route) | The user's call on P15's question (built in P15's review, R2: no `pay#Advance`; `apply#Advance` issues a credit on the employee advances account and applies it to the claim; `PaymentRuns.js` select and paySupplier; design-people §9, design-accounting §5) |
| Nov 12, 2026 | "Read receipt" reading photos (an image or OCR input to `run#Extract`) is a framework ask for later; today a PDF's or text file's receipt is read and a photo's text is typed or pasted | The user's call on P15's question (§7; mr-moqui `plans/Remaining-Work.md`'s framework asks, added by the lead) |
| Nov 12, 2026 | An expense approval notice names no amount in its title; its detail shows the approver the claim's total (the notice's `amount` and `currencyUomId`, which the notification lists show as the approval's summary) | The user's call on P15's question (built in P15's review, R3: Approvals.js `PakExpenseClaim`; PeopleExpenses) |
| Nov 12, 2026 | An interviewer with self-service only answers their scorecard from SelfService: My interviews on SelfService (People/SelfService and Commons/People/SelfService) lists the interviews the user is on the panel of, each opening MyInterview beside it (People/MyInterview, Commons/People/MyInterview), where the panel member reads their own interview, the candidate's name, the opening and the materials HR shares with the panel, and submits their scorecard once. "Shared with the panel" is a file of the application a recruiter marks shared on ApplicantDetail (none by default, the resume either); a panel member reads nothing else of the application (its stage, source, contact, notes, other files or record host) there or in People. Grants on F28's non-inheritable pattern (`BOSS_PPL_INTERVIEW_SELF`) | The user's call (P16's review). Built in P16's review: `RecruitingServices.find#MyInterviews`, `get#MyInterview`, `share#ApplicationContent`, `get#ApplicationFile`, `EmploymentApplicationContent.panelShared`; design §3 SelfService, §5 ApplicantDetail |
| Nov 12, 2026 | Free-text form answers (`FormResponseAnswer.valueText`) are opted out of AI for every app's forms, as P16's review built it, not only People's purposes | The user's call: respondents' words reach no model in any app (case feedback comments and tax statement answers included) |
| Nov 12, 2026 | An applicant's resume is shared with the interview panel by default when attached; other files only when the recruiter marks them; the recruiter can unshare it | The user's call, after P16's review shared nothing by default; P17 builds it (built in P17: `create#ApplicationContent` shares an `EactResume` file unless told not to, mail and chat intake share the resume they keep; Mantle Recruiting's spec; design-people §3, §5 ApplicantDetail) |
| Nov 12, 2026 | A manager with a live reporting line evaluates that report's skills without `PEOPLE_DEVELOP_EDIT`: `store#Skill` records it as the manager's evaluation (`SkillSource` `SksManagerEvaluated`, the manager its assessor), which sets the accepted level and meets a requirement as an evaluation does; the matrix, its terminal twin and Employee360 offer it on the manager's reports. Certificate verification stays the development and HR verifiers' (`verify#Qualification` unchanged) | The user's call on P18's question (built in P18's review, R2; design-people §10 SkillsMatrix; Qualifications and PeopleAccess check a manager evaluating their report and refused another's) |
| Nov 12, 2026 | A job requirement keeps its dated history: `EmplPositionClassSkill`'s primary key gains `fromDate` (a Mantle entity change), so each period is its own row and readers take the row in effect at their date; removing ends the row, a change ends the period in effect and starts a new one (a period not started yet is changed in place), and requiring the skill again starts a new row, never before the last one ended | The user's call on P18's question (built in P18's review, R3: Positions.js `store#JobRequirement`, `get#JobClass`, `classRows`; Development.js `classRequirements`; BossPeopleDemoData's requirement rows; design-people §5 JobClassDetail). No other reader or writer exists: Marble's HumanRes screens and the data files hold none beyond BOSS's demo |
| Nov 12, 2026 | A staff reader of the employer sees whether a person's identity document or work permit is valid, expiring or expired, with its dates; only its number and file are the person's and HR's (as P18 built it) | The user's call, on P18's review finding |
| Nov 12, 2026 | With no approval rule, the employer's HR officers decide an offer (a kind's own default route, `PakOffer`'s `ParHr`); an employer's rules for the kind still route it; never the recruiter who submitted or drafted it, nor the applicant | The user's call on P17's question (as built; the drafter excluded in P17's review, R4) |
| Nov 12, 2026 | Payroll readers (PAYROLL_VIEW) of the employer read its offers, the applicant's name and terms with the pay, to set the pay on OfferDetail | The user's call on P17's question (as built) |
| Nov 12, 2026 | Issuing an offer emails its stored letter to the applicant's address as an attachment; the issuer need not be able to open it; the send is recorded on the offer, its outcome visible to recruiters without the letter's content; sent by Mantle's mail (an EmailTemplate), failure tolerant: a failed send is recorded and can be sent again, never undoing the issue | The user's call on P17's question (built in P17's review, R1: `send#OfferLetter`, template `PEOPLE_OFFER_LETTER`, the issue's tx-commit rule; design-people §5 OfferDetail, §15) |
| Nov 12, 2026 | Employees see their own issued lifecycle letters (hire, transfer, manager change, leave, return, separation) in SelfService's My letters under both self-service mounts (People and Commons), whole, pay included since the letter is theirs; another person's letter is refused; grants on F28's non-inheritable pattern | The user's call on P17's question (built in P17's review, R2: `find#MyLetters`, `get#MyLetter`, `BOSS_PPL_SELF`; design-people §3 SelfService, §15) |
| Nov 12, 2026 | A trainer's passing assessment grants the course's qualification as verified: the course is the authority (not the trainer's own verification rights); the grant is recorded with the trainer (its verifier) and the session (the place its reference); development can revoke it | The user's call on P19's question (as built: `complete#Training`'s grant; revoked by `verify#Qualification`, which leaves the issued certificate as it was) |
| Nov 12, 2026 | A trainee sees only the outcome and score of their own assessment (with its date and assessor); the assessor's answers and evidence stay with development and the session's trainer | The user's call on P19's question (as built: `get#Training`'s results; the assessment's response read only through it) |
| Nov 12, 2026 | An employer's confidential case intake handlers are named by its `PartySetting` `PeopleCaseIntake` (as built in P21); an employer with none refuses a filing with a clear message (`NO_CASE_HANDLER`: "Your employer has nobody to take confidential cases yet; ask HR who handles them"); P29's Settings gives the setting a screen | The user's call on P21's question (as built; P29's section names the screen) |
| Nov 12, 2026 | When a case's last handler leaves the employer (a separation), the case goes back to the employer's intake handlers, who are told on `PeopleCaseUpdate` with a title naming nothing; Admin's lifecycle lists the leaver's open cases as an owned resource of People's lifecycle participant, without their content | The user's call on P21's question (built in P21's review: `PeopleCases.js rerouteCases` from the separation's apply and the daily job, the leaver taken off every open case of the employer; `ownedCases` in `find#OwnedApprovals`, "Confidential case", not transferable; spec PeopleCases) |
| Nov 12, 2026 | Confidential cases reach no palette, search, record-lookup or Assist for anyone, their people included; people open them from Grievances | The user's call on P21's question (as built) |
| Nov 12, 2026 | A phone's CalDAV delete of an invitation the attendee's calendar only shows (`viewOnly`) takes it out of that calendar (204) and never changes the event; a kept event's delete is still 403, and the organizer's delete cancels the event | The user's call on the calendar follow-up's review question (as built: its R3, `delete#DavObject`; Dav spec) |
| Nov 12, 2026 | The instance administrator's own data tools reading a confidential case whole (Tools' Data and SQL, System's Resource and Audit, Mantle's REST) is accepted: the admin tools are privileged by design; no framework restriction of `PeopleCase` or of `peoplecase/` is added | The user's call on P21's review finding F347 (mr-moqui docs/security/Attack-Surface.md, Tools and System, says so) |
| Nov 12, 2026 | People's confidential notices go to their named recipients only: a subscription to every message of a topic (`NotificationTopicUser.allNotifications`, set in Tools) receives none. The framework exposes it to scripts as `directOnly()` on `ec.makeNotificationMessage()`; People sends direct-only on PeopleCaseUpdate, every approval topic (Approvals.js `notify`: positions, employment changes, leave, attendance, expenses, advances, offers, training), PeopleLeaveDecision, PeopleTrainingDecision, QualificationExpiring and PeopleTaskAssigned | The user's call on P21's review finding F348 (built in People follow-up 1); PeopleShiftChange and the shared EventInvitation and reminder topics stay open (follow-up 1's note) |
| Nov 12, 2026 | The notes and messages on People's confidential records are told to their named users alone: `notify#RecordMention` (ChatterMention) and `notify#RecordFollowers` (RecordFollow) send direct-only for a record type registered in `mantle.party.communication.ConfidentialRecordType`, which People's hosts join with a seed row (employment, application, qualification; a case through PeopleCaseUpdate; P20's review once built); other apps' notes are unchanged | The user's call on People follow-up 1's first finding (built in its review, R2; spec RecordNotes) |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Q2. (answered Nov 11, §4) One labor costing purpose, `RaprCost`; P10 moves Manufacturing's rows and lookup to it | P10 | Nothing is open |
| Q3. (answered Nov 11, §4) What is a payslip in preview mode? | P26 | As recommended: an approved preview run's results are kept as preview slips, visible to payroll only, never issued to an employee and never an obligation; SelfService shows issued slips only, so none in this build outside the acceptance fixture |
| Q6. (answered Nov 11, §4) Mantle's demo departments are `OrgInternal` parties (ORG_ZIZI_HR, ORG_ZIZI_SALES) | P3 | As recommended: leave Mantle's demo as it is; OrgStructure shows them as legal organizations under their parent, and People's demo adds `OrgDepartment` units under the BOSS employers |
| Q7. (answered Nov 11, §4) Mileage and per-diem claim lines (design §18) | P15 | As recommended: later (§7), unless a launch deployment reimburses mileage |
| Q8. (answered Nov 11, §4) Legacy leave and pay rows (EmploymentLeave, EmploymentPayHistory) | P12, P26 | As recommended: read only, labelled historical; no migration in this build (§7) |
| Q9. (answered Nov 11, §4) The budgets may be raised by the plan's estimates, by each phase's measured share | every phase's Done | Nothing is open; a raise beyond the estimates is asked of the user again |
| Q10. (answered Nov 11, §4) People's import targets name `PEOPLE_IMPORT` | P7, P13 | Nothing is open |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F48 were found on Nov 11, 2026, while writing this plan, F49–F54 in its review the same day,
which also corrected F19, F26, F33, F34, F39 and F46, and F55–F71 in P0's last checks the same day. P1's F72 to F78 (Nov 11, 2026) are in its Built and Review notes. P2's F79 to F88 (Nov 11, 2026) are in its Built and Review notes. P3's F89 to F99 (Nov 11, 2026) are in its Built and Review notes. P4's F100 to F109 (Nov 11, 2026) are in its Built and Review notes. P5's F110 to F120 (Nov 11, 2026) are in its Built and Review notes. P6's F121 to F136 (Nov 11, 2026) are in its Built and Review notes. P7's F137 to F155 (Nov 11, 2026) are in its Built and Review notes. P8's F156 to F168 (Nov 11, 2026) are in its Built and Review notes. P9's F169 to F179 (Nov 11, 2026) are in its Built and Review notes. P10's F180 to F193 (Nov 11, 2026) are in its Built and Review notes. P11's F194 to F205 (Nov 11, 2026) are in its Built and Review notes. P12's F206 to F220 (Nov 11, 2026) are in its Built and Review notes. P13's F221 to F235 (Nov 11, 2026) are in its Built and Review notes. P14's F236 to F252 (Nov 11, 2026) are in its Built and Review notes. P15's F253 to F271 (Nov 11, 2026) are in its Built and Review notes. P16's F272 to F287 (Nov 11, 2026) are in its Built and Review notes. P18's F288 to F304 (Nov 11, 2026) are in its Built and Review notes. P17's F305 to F319 (Nov 11, 2026) are in its Built and Review notes. P19's F320 to F335 (Nov 11, 2026) are in its Built and Review notes. P21's F336 to F353 (Nov 11, 2026) are in its Built and Review notes. The Commons calendar follow-up's F354 to F362 (Nov 12, 2026) are in its note under P19. Mantle paths are
under `runtime/component/mr-mantle/`, BOSS paths under `runtime/component/mr-boss/`.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/People/` has eight flat placeholders and the root mounts only Chatter and RecordFiles, with no `<shell-providers>`. Its comment says the grant is commented out (People.xml:15-17); in fact `BOSS_PEOPLE` gives `ADMIN` and `BOSS_PEOPLE_ADMIN` `AUTHZT_ALWAYS` on the root with `MANTLE_ACTIVE_ORG` (BossSetupData.xml:237-244). There is no root user group or other People group | P1 |
| F2 | P0: `PAYROLL_VIEW` and `PAYROLL_EDIT` are seeded in Mantle and granted to `ADMIN` (data/MantleSetupData.xml:181-184) and to `BOSS_PEOPLE_ADMIN` (BossSetupData.xml:570-571). No `PEOPLE_*` permission and no `PAYROLL_APPROVE` exists | P1 seeds them in Mantle (§4) |
| F3 | P0: `create#Employment` (service/mantle/humanres/EmploymentServices.xml:75-121) checks no permission or organization; its overlap check is any relationship of the two parties (:88-103), as the design says; `update#Employment` repeats it (:160-176); `delete#Employment` deletes the rows (:195-221) | P6 narrows both checks to `PrtEmployee`; PeopleServices is the guarded entry; People never deletes an employment |
| F4 | P0: `create#EmploymentSalary` (:222-259) checks no permission, only warns outside the grade's band (:250-253) and does not end the row in effect. PayGradeSalary has `amount`, `minAmount` and `maxAmount` (entity/HumanResourcesEntities.xml:906-914): the design's "reference" is `amount` | P23 extends the service; P4 uses `amount` |
| F5 | P0: `create#PersonEmployee` (service/mantle/party/PartyServices.xml:1055) makes a person, contact info and optionally an account, and no Employment, as design §1.3 says | P6: `hire#Employee` does not call it |
| F6 | P0: PartyQualification, PartyResume, PerformanceReview and its items and notes, PersonTraining and TrainingClass are inside an XML comment (HumanResourcesEntities.xml:46-172), and JobRequisition and JobInterview in another (:1073-1140), as design §1.3 says | P18–P20 refine and activate; the requisition sketch stays off |
| F7 | P0: `WorkEffortSkillStandard` is active, with a skill, people, duration and cost and no level (entity/WorkEffortEntities.xml:1057-1063), as design §10 says; its `minimumSkillLevel` is shared with Maintenance's MT-03 | P18 adds the field with PE-14's other levels, since `check#Qualifications` reads it; Maintenance's plan uses it (§7) |
| F8 | P0: `EmplPositionClassSkill` is class and skill only (HumanResourcesEntities.xml:827-833); PartySkill has rating, level and experience (:29-35) | P18 as designed |
| F9 | P0: EmploymentApplication has a position, a status, the referral fields and an approver (:355-363); its status type is seeded with no status item (:378) | P16 seeds the flow and adds the opening link |
| F10 | P0: EmplPosition has `organizationPartyId`, the three statuses and no department (:736-771) | P4 adds `departmentPartyId` |
| F11 | P0: there is no Applicant role type. The `OrgDepartment` role exists (entity/PartyEntities.xml:719), which design-people §4 did not name, though design-admin §7 does | P16 seeds the role; P3 uses `OrgDepartment` (§4); design-people §4 changed |
| F12 | P0: Mantle's demo has ORG_ZIZI_SALES and ORG_ZIZI_HR as `OrgInternal` parties rolling up to ORG_ZIZI_CORP (data/ZbaOrganizationDemoData.xml:33-47), two `OrgTeam` teams (:85-89) and two `PrtEmployee` relationships (:118, :136); BOSS has one `PrtManager` row (data/BossDemoData.xml:203) and one employee, in Projects' demo (data/BossProjectsDemoDataTimeResources.xml:35-39) | P1 and P3 add People's demo; §5 Q6 |
| F13 | P0: the demo's team memberships are `PrtMember` rows from role `Assignee` to `OrgTeam` (ZbaOrganizationDemoData.xml:121-123), and `OrgTeam` is in the project role group (WorkEffortEntities.xml:877) | P3's `store#Membership` writes the role Projects reads (P0 check) |
| F14 | P0: `mantle.work.ProcessServices` does not exist; MT-03 is Maintenance's need. `isTemplate` marks a project template copied by `clone#Project` (WorkEffortEntities.xml:192-193; service/mantle/work/ProjectServices.xml:17, :3263, :3285) | §4: P7 builds the two services People needs |
| F15 | P0: the lifecycle operation's kinds are Disable, Organization removal and Restore (data/PartyLifecycleData.xml:19-22), and `ironstone.admin.LifecycleServices` has only the owned-resource and assignment services (service/ironstone/admin/LifecycleServices.xml:22-68): no provisioning kind, `request#Provisioning` or `request#AccessEnd` | P7 |
| F16 | P0: a transfer target is a `moqui.server.TransferTarget` row its owner seeds (framework entity/ServerEntities.xml:690): a `rows` import with validate, apply and scope services (data/PartyInvitationData.xml:48-61), an owner wizard with a `findService` (data/AccountingSetupData.xml:33-38), a `file` export (data/PartyContactExportData.xml:25-34). An owner's place is a key in Data.js (service/ironstone/admin/Data.js:15-23), and the import mount knows Admin and the catalog apps only (service/ironstone/shared/DataImport.js:7-8, :39-59) | P7, P13, P28 |
| F17 | P0: no screen outside Projects mounts a Projects screen; Timesheets links its sibling by a relative path (screen/Projects/Time/Timesheets.xml:31) and Rates is screen/Projects/Billing/Rates.xml; Manufacturing built its own ProductionTime because TimeServices checks the Projects app (plan/impl-manufacturing.md:356) | §4; P10, with P0's check |
| F18 | P0: an app's Approvals is Commons' Notifications mounted with the app's topics (screen/Accounting/Approvals.xml:28-36) | P5 |
| F19 | P0: the shared screens branch on `appRoot` for each app that mounts them: EquipmentDetail (screen/Shared/EquipmentDetail.xml:79-89), RequestDetail (:304-351), InvoiceDetail (:103-105), WorkItemDetail (:68, :79). SurveyForms is not such a branch (F51) | Each People mount adds its branch in its phase (P7, P15, P21); the survey builder is P16's change |
| F20 | P0: the Request rules have grown since the design: SupportCaseRule, SupportCaseCustomerRule and SupportCaseSlaRule run on every request (entity/Request.eecas.xml:29-34, :35-38, :47); RequestTriageNotice leaves out only the purchase RFQ (:19-24); `complete#RequestFromWork` leaves purchase requests and support cases alone and knows no HR type (service/mantle/request/RequestServices.xml:1499-1512) | P21 conditions each for the confidential type; design-people §8.3's register gained the support-case rules |
| F21 | P0: `create#ProjectExpenseInvoice` requires `fromPartyId`, takes `toPartyId` without a project, defaults the type to InvoiceSales and checks no employment or self scope (service/mantle/account/InvoiceServices.xml:1614-1643), as the design says | P15 |
| F22 | P0: `get#DavCollections` lists the user's calendars and Tasks only (service/mantle/work/CalendarDavServices.xml:137-163), and `get#TaskObjectTags` every task the user is assigned (:97-100) | P7 leaves protected tasks out; P12 adds the projected collections (P0 check) |
| F23 | P0: ResourceServices already says People's schedule replaces the WetAvailable source in `get#PartyCapacity` and nothing else changes (service/mantle/work/ResourceServices.xml:18-24) | P9 as designed |
| F24 | P0: the per-field AI switch, the decimal evaluator and the device credential are unbuilt framework asks (mr-moqui plans/Remaining-Work.md:208-210); there is no `ExpressionServices` or `DeviceServices` | P12, P22; P30 waits on Admin P18 |
| F25 | P0: the built framework pieces the design uses exist: `scan-input` (xml-form-3.xsd:1368), `view-tree` (:350), `view-board` (:247), `density` handheld (xml-screen-3.xsd:128), `record-lookup` (:600), `create-from` (:604), `quick-create` (:681), `today-source` (:694), `palette-source` (:714), `assist-prompt` (:762), `response-action` (:774), tx-commit SECAs (service-eca-3.xsd:83), `run#Extract` (AiTaskServices.xml:85), `create#CallLink` (CallServices.xml:304), mail rule actions as Mantle's `createRequest` (BasicEntities.xml:1162-1163; data/MantleSetupData.xml:464). There is no `view-timeline` element | As designed; P14 checks the timeline |
| F26 | P0: the client deny pattern names each `ironstone` package; its longest row is 237 characters (BossSetupData.xml:445) and ProjectsAccess fails on a write verb it does not deny (test/Projects/ProjectsAccess.spec.js:637) | P1 adds `people`: the longest rows become 244 (:445) and 240 (:459), and none is split. `maintenance` then takes them to 256 and 252, so Maintenance's P1 splits both rows as it adds its name. Sales' P1 and Marketing's P1 add theirs and split a row only if it would pass 255; after Maintenance's split none should (the longest is 254 with `marketing`). A write verb new to the `ironstone` packages is added to a row by the phase that adds it |
| F27 | P0: the registries' built contracts (since Nov 11, 2026 ReadinessProvider and SettingsEntry are the framework's `moqui.server` entities, impl-admin §9): ReadinessProvider (read at entity/AdminEntities.xml:21-50, now mr-moqui framework/entity/ServerEntities.xml:856; Products' row BossSetupData.xml:2557-2560; an adapter or the contract's checks list, service/ironstone/admin/Registry.js:145, :684), SettingsEntry (:2553-2556), capability bundles (:2676-2687; People left out, plan/impl-admin.md:932), LifecycleParticipant (:4041-4044), ReportCatalogEntry (:3438-3446), MetricRegistration (:3741-3753), AttentionProvider (:3863-3868), FlowTarget (:4545-4548), DatasetClass with `InsDcPeople` already seeded (:4782-4785); the internal flow map's People step is information only (report/insights-flowmap-internal.json:208) | P1, P5, P29 |
| F28 | P0: a screen for users without its app's launcher is a non-inheritable grant on that screen and its context service (BossSetupData.xml:2528-2535) | P8's self-service grants |
| F29 | P0: AC-23 is designed (plan/design-accounting.md:818-831, :2991) and is in no phase of impl-accounting | P27 builds it, as an owner contract (§4) |
| F30 | P0: design §8 gates native finalization on AC-23 but names PayrollExchange's external processing as the live path until then, though its results create the same payroll invoices (§8.3 makes the projection a prerequisite of payroll exposure) | §4: P28's live external results are gated on AC-23 as finalization is; design-accounting's AC-23 row says so, and design-people §8, §8.3, §8.4 and §14.4 changed |
| F31 | P0: ZapPayrollTaxInstallData is `install` data that calls itself demo and testing material (data/ZapPayrollTaxInstallData.xml:15, :18); PayrollData is seed (data/PayrollData.xml:15); HolidayUsaData is install (data/HolidayUsaData.xml:15) | The new engine reads none of it (§2); P9 assigns no seeded holiday category by default |
| F32 | P0: the historical payroll is as design §1.3 says: `process#TimePeriodPay` (service/mantle/humanres/PayrollServices.xml:41), a currency TODO (:87), the regular-rate TODO (:831-836), `reopen#PayrollPeriod` (:203). Its specs are test/humanres/PayrollServices, PayrollAdjustments and HumanResServices | §2: not called; the specs stay passing |
| F33 | P0: Employment carries US tax fields (HumanResourcesEntities.xml:261-263), and the active `Employee` entity, keyed by party, more of them (:193-246); EmploymentLeave is keyed by employment and start day (:400-402); EmploymentPayHistory by employment and pay date (:430-432) | As designed (P11, P23, P26); P23's profile writes neither entity's tax fields |
| F34 | P0, corrected in review: HumanResourcesEntities seeds the client and vendor rate purposes (:1058-1059), and Manufacturing a third, `RaprProductionCost` (data/ProductionShopFloorData.xml:27), which its shop floor reads by position class and work type (service/mantle/work/ProductionShopFloor.js:1129-1134) and its demo sets (mr-boss data/BossManufacturingDemoData.xml:274). There is no `RaprCost`. RateServices has `create#` and `update#RateAmount` only (service/mantle/humanres/RateServices.xml:17, :47), and Manufacturing deferred its LaborCostingRates form on `get#CostingRate` (plan/impl-manufacturing.md:2488) | P10 seeds `RaprCost` and moves Manufacturing's rows and lookup to it (§4, the user's call); design-people PE-23 and §18 say so |
| F35 | P0: PositionServices has one service, `get#PartyEmployersAndPositionClasses` (service/mantle/humanres/PositionServices.xml:17) | P4 extends the file |
| F36 | P0: the payroll invoice types exist (entity/AccountingAccountEntities.xml:418-421) | P27 as designed |
| F37 | P0: the regression budgets are mr-boss 264 s server and 57 s client (test/budget) and mr-mantle 393 s | §4: the user approved raises up to the plan's estimates |
| F38 | P0: ss-inventory's HumanRes forms name People/Payroll/Rates (plan/ss-inventory.md:489-494), FindParty's CreateEmployeeForm HireEmployee (:633) and PartyTimeEntries People/Time/TimeEntries (:660-662); usl-inventory has a HumanRes section of 38 services (plan/usl-inventory.md:447) | Each phase fills **Implemented in** |
| F39 | P0, corrected in review: `MANTLE_USER_ORG` does not filter PartyRelationship. The filter that would show a `PrtEmployee` relationship only for the user's organizations is commented out as too costly for every app (data/MantleSetupData.xml:267-271); the set filters Party by `ownerPartyId` (:273-274) | The filter stays off. The ordinary People groups carry the set as every app's do (P1), and employment scope is `PeopleServices.get#Scope`'s, in each service (§2) |
| F40 | P0: Insights mounts the shared record screens under Insights/Records (screen/Insights/Records.xml:36-45), and none for a person | P2 adds Employee360 |
| F41 | P0: Admin's UserDetail has no Employee360 link | P2 (owner contract) |
| F42 | P0: a topic names its `approveServiceName` and `refuseServiceName` (framework entity/SecurityEntities.xml:636-640), seeded by Mantle beside the service (data/SourcingAwardSetupData.xml:27); WorkEffortReminder, WorkItemAssigned and TimesheetApproval are seeded (data/MantleSetupData.xml:389, :395, :425) | P5 and later seed People's topics in Mantle |
| F43 | P0: `get#PayRateAccess` is built as design §1.1 says, one query for all the people, with employment read without the user's filters (EmploymentServices.xml:17-73); BOSS grants `TIME_ENTRY_RATE` to the Projects managers (BossSetupData.xml:566) | P10 as designed |
| F44 | P0: TimeEntry has `vendorHourRate`, `pieceCount` and `vendorInvoiceId` (WorkEffortEntities.xml:1336, :1341, :1352); timesheets have `approve#` and `reopen#Timesheet` (service/mantle/work/TimesheetServices.xml:551, :609) | P24's guards |
| F45 | P0: AssetPartyAssignment is keyed by asset, party, role and from date (entity/ProductAssetEntities.xml:461-473); `replace#AssetPartyAssignment` exists (service/mantle/product/AssetServices.xml:3232) | P7 as designed |
| F46 | P0: Commons has no People area: its root mounts its own screens, Chatter and RecordFiles (screen/Commons.xml:35-36; screen/Commons/) | P2 starts Commons' People area with `Commons/People/Employee360`, out of the menu; P8 adds `Commons/People/SelfService` |
| F47 | P0: Admin's PrivacyServices and its providers are Admin's later work (plan/impl-admin.md:4705-4710) | People's privacy provider is §7 |
| F48 | P0: the baseline forms design §14.2 maps exist in mr-marble: HumanRes/dashboard and EditRateAmounts, and MyAccount/Expense's three screens | As designed |
| F49 | P0 (review): a user's organizations are the targets of their agent, employee and member relationships that hold the `OrgInternal` role, whatever the relationship's own role (employment rows use `OrgEmployer`), and each one's direct `PrtOrgRollup` children of any role, one level down (service/mantle/party/PartyServices.xml:563-603). So a hire puts the employer in the employee's organization scope in every app, a department directly under an employer is in `filterOrgIds`, and a department under a department is not | The employment is the employee's organization membership: P7's provisioning step checks it and adds no second relationship. People's unit scope walks the rollup itself (`get#Scope`) and does not lean on `filterOrgIds`; this answers P0's department question |
| F50 | P0 (review): a `PrtManager` relationship runs from the manager to the report: the time services read the reports of `fromPartyId` (service/mantle/work/TimeServices.xml:1551), and BOSS's demo row is written that way (data/BossDemoData.xml:203) | P3's `change#Manager` and `get#ReportingTree`, P5's manager route and P8's `get#Team` use that direction |
| F51 | P0 (review): the survey builder's four shared screens answer Customer Service alone. SurveyForms calls `mantle.request.CaseFeedbackServices.create#FeedbackForm` and `ironstone.customerservice.FeedbackServices.find#FeedbackForms` only under that root (screen/Shared/SurveyForms.xml:31, :40-43) and tells any other root the forms are not available (:55); its header leaves the other contexts to Marketing and People (:15-21). The form services are case feedback's (service/mantle/request/CaseFeedbackServices.xml:24-119), and FormPublication's purposes are case feedback and survey, its access kinds invited, anonymous and account (entity/FormPublicationEntities.xml:58-63) | P16 makes the context a registration and moves the form definition services (§4); design-people §13 Forms says so; impl-marketing P12 builds on it |
| F52 | P0 (review): `replace#AssetPartyAssignment` requires `newPartyId`, ends every other holder of the role now and checks no permission or organization (service/mantle/product/AssetServices.xml:3232-3255); it knows of no task | P7: a return names the receiving custodian; People checks scope before the call; a Mantle rule on the assignment's end completes its return task (P0 settles the link) |
| F53 | P0 (review): the shared resource-lane timeline of crosscut M11 is Projects' `Timeline.qvue` in its resource mode, which Manufacturing's ProductionSchedule mounts with its own transitions and a TUI twin, ProductionScheduleTui (screen/Manufacturing/Planning/ProductionSchedule.xml:16, :99) | P14 mounts it the same way, with people as lanes; P0 reads the contract |
| F54 | P0 (review): design-maintenance §4.1 puts a step's assignable role, due offset and required flag on `WorkEffortStepPolicy`, which ChecklistTasks sets (design §12), and Maintenance's plan refuses generic task writes, from its P3, on a root that has a MaintenanceWorkOrder row and its steps and on work whose process policy guards execution. The plan as written left both records to Maintenance | P7 builds both records with the fields a checklist needs, the guards-execution flag and People's policy, whose flag is false (§4) |
| F55 | P0: Admin P18 is built (impl-admin.md:4781-5036; design-admin §6 "As built"). A device's request runs as a display account, a UserAccount nothing signs in, whose Person is a member of each organization it shows and which holds the bundles its registrar may assign; the account is the request's user only, never a session's, and revocation refuses the next request (impl-admin F278, F281). A route group is a `moqui.security.DeviceRouteGroup` row its owner seeds (framework entity/SecurityEntities.xml:472-498): an artifact group as an allow-list that grants nothing (a non-inheritable screen member admits its render only, a transition member that transition), `homePath`, one fixed parameter, an idle timeout (a week when empty) and a lifetime. A device cannot load the `/qapps` shell (F285), so Insights' wall display is a page of its own, `/apps/Insights/WallDisplay`, with a display bundle that opens it alone, and the Insights root calls no context service for a device's request (screen/Insights.xml:49; BossSetupData.xml:5008-5015; impl-insights F149, F150). The identity operator makes the display account, the access administrator registers the device (F284) | P30 replanned on it and no longer waits (§1, §4): ClockingKiosk a page of its own; People's route group of the page and its punch transition by name; a kiosk bundle with `PEOPLE_KIOSK_PUNCH`; the People root skipping `get#SharedContext` for a device; `record#KioskPunch` only in a device's request, the worker by badge and PIN. Design §1.4 Devices and ClockingKiosk changed |
| F56 | P0: Admin P17 is built: `AuditServices.find#Changes` reads only the entities with a registered `moqui.server.AuditProjection` (framework entity/ServerEntities.xml:816; impl-admin F257), shows a value only by a `show` registration and never an encrypted field's (F258), and reads an organization's records through its owner's source (Mantle's `find#IdentityChanges`, data/PartyAuditData.xml). No `mantle.humanres` or `mantle.request` entity is registered, so no salary, tax election or case change is in AuditChanges; Tools' audit log reads `EntityAuditLog` whole, for `ADMIN` only (impl-admin.md:4461-4465) | People registers no projection, in P21, P23 or later: those histories are People's screens. Whether a business entity belongs in AuditChanges is Admin's F257, the user's call (§7) |
| F57 | P0: Projects' time screens assume Projects beyond the route. `ironstone.projects.TimeServices` checks the group name `BOSS_PROJECT_MANAGER` in ten places (TimeServices.xml:113-116, :375, :491, :728, :822, :856, :903, :987, :1000, :1021) where §2 asks a permission (Mantle reads `TIME_ENTRY_RATE`, service/mantle/work/TimeServices.xml:1526), builds 17 links to `/qapps/Projects/...` (e.g. :60-61, :505-506), and lists people from the time keepers of the projects the user manages (`get#MyWeek` :73-79, `get#TimePeople` :663-668; Mantle's missing list, TimesheetServices.xml:1110-1118), never a manager's reports. MyTime.qvue finds its path by `lastIndexOf('MyTime')` (:318-320) and works mounted; MyTime.xml's tui container (:116), TimeEntries' import (:93), EditEntry's responses (:40, :53, :65) and the print URLs (TimesheetDetail.xml:55, TimeEntries.xml:140) name `Projects/Time`, and no time screen reads `appRoot`. A line manager approves a week only under the organization's `line` policy (TimesheetServices.xml:430-433), whose default is `project` (:54) and which no demo sets; TimeEntries reads `PrtManager` with no policy (TimeServices.xml:1551). Rates needs `check#Money` (`ADMIN` or `TIME_ENTRY_RATE`, BillingServices.xml:27-36), lists RaprClient and RaprVendor only (:912) and shows pay by `get#PayRateAccess` (:927-929). `check#TimeItem`'s `get#TaskAccess` with app `projects` (TimeServices.xml:121) concerns the work item and stays | P10's owner contract is larger than §4 had: links from the mount, the group-name checks as permissions, a manager's reports in the pickers and the missing list, the `Projects/Time` paths relative, Rates' pay rows for `PAYROLL_VIEW` and its read-only `RaprCost` rows, and the `line` policy on People's demo employers; Projects' specs unchanged. P10 and §4's row changed |
| F58 | P0: a readiness provider with no adapter answers the registry's contract (service/ironstone/admin/Registry.js:139-143, :351-357, :684): called with `providerKey`, and `organizationPartyId` once per organization for `AdmScOrganization` (:112-135), it returns `checks` [{checkKey, title, state ready, warning, failed or unavailable, reasonCode, message, fixPath, watermark, coverage}]; a refusal by reason code is left out and any other failure is a `PROVIDER_FAILED` row (:685-700); the organizations are the Admin user's (:84-88). Accounting's and Products' services have adapters (Products' row is BossSetupData.xml:2559-2562); Insights' datasets and Admin's checks answer the contract | P1: `get#Readiness` answers the contract, organization-scoped, with no adapter, and refuses an organization outside the caller's scope by reason code. P1 changed. Since Nov 11, 2026 the contract is the framework's (impl-admin §9): the service is called once with the scope parameters and answers each employer's checks with `subject`, `scope` and a `fixRoute` key in place of `fixPath` |
| F59 | P0: a person is in every organization's Party finds: `Party.ownerPartyId` defaults to `_NA_` (entity/PartyEntities.xml:36), which `MANTLE_USER_ORG_9` admits (`ownerPartyId` in `_NA_` and `filterOrgIds`, data/MantleSetupData.xml:273-274; a null is excluded, :276-277), and neither `create#Person` nor `create#PersonEmployee` sets an owner (service/mantle/party/PartyServices.xml:956-972, :1055-1120). Commons' quick create to the directory sets it to the active organization (mr-boss service/ironstone/commons/QuickCreateServices.xml:285), which hides that person from another employer's filtered finds. With the relationship filter off (F39), no Party filter tells employments apart | P2: People reads Party with the filters off after `get#Scope` and answers by employment, so a reader of one employer sees that employment and the work identity, nothing of the other. P6: `hire#Employee` leaves `ownerPartyId` as it is, and `preview#Hire`'s person match is People's own, so a second employer finds the person and makes no second one. P2, P6 changed |
| F60 | P0: AssetPartyAssignment is keyed by asset, party, role and from date (entity/ProductAssetEntities.xml:461-473), so neither `WorkEffortRecord` nor `get#RecordLinkInfo` (one key field only, CommunicationServices.xml:2175-2179) can name it; `WorkEffortAssetAssign` links a task to an asset (WorkEffortEntities.xml:526-548). `replace#AssetPartyAssignment` ends a row by setting `thruDate`, never deleting (AssetServices.xml:3232-3255). No ECA on AssetPartyAssignment exists | P7: a return task names its assignment by a `WorkEffortAssetAssign` row of the asset and a `WorkEffortParty` of the holder in the assignment's role; a Mantle EECA on the update that sets `thruDate` completes the open return tasks of that asset, party and role. P7 changed |
| F61 | P0: `RaprProductionCost` is in Manufacturing's seed (data/ProductionShopFloorData.xml:27), its demo rate (mr-boss data/BossManufacturingDemoData.xml:273-275), the lookup (service/mantle/work/ProductionShopFloor.js:1131-1144), a description (ProductionServices.xml:2222) and one spec (test/work/ProductionShopFloor.spec.js:226; mr-boss ManufacturingShopFloor names the demo rate's id only, :318). The lookup takes rows with no party or work effort whose work type and position class match or are empty, most specific first, then newest, with no organization or currency; `laborFits` re-checks a frozen rate by its id (:1167-1181). `RaprCost` and `get#CostingRate` exist nowhere | As §4: `get#CostingRate` takes the lookup's rules unchanged, and the move is the seed, the demo row, the call and the one spec's purpose; `laborFits` stays. P10 changed (the spec named) |
| F62 | P0: CaseFeedbackServices are wrappers over CaseFeedback.js, whose case rules are the fixed purpose `DbfpCaseFeedback` (:43, :82-92), the rating (:95-153, :191-200, :238-243), the customer audience on every field (:49, :187, :213) and `SUPPORT_POLICY_EDIT` (:157, :203, :225). The builder itself is service/mantle/request/CaseTemplates.js (`formAt`, `saveField`, `saveCondition`, `endPart`, `problemsOf`, `checkValues`), which checks `SUPPORT_POLICY_EDIT` (:431, :717, :815, :880) and admits two purposes (:114). A response is read by Customer Service's `get#CaseResponse` (mr-boss service/ironstone/customerservice/Feedback.js:339-424), which checks the reader before the framework's `get#FormResponse`, which checks none (framework ScreenServices.xml:253-293); `FormInvitation` names a party, a record and a context (entity/FormPublicationEntities.xml:72-108) | P16: FormDefinitionServices takes CaseTemplates.js's builder, the permission from the purpose's registration; CaseFeedback keeps the purpose, rating, audience and its permission. A People response is a FormInvitation on its People record, read only through that record's service. P16 changed |
| F63 | P0: one reader checks a from-role on a relationship: BusinessTime.js `requireHoursAccess` looks for `fromRoleTypeId` `Manager` (service/mantle/work/BusinessTime.js:293). Projects' team planner and every reader of a user's organizations ignore both roles (ResourceServices.xml:943-946; PartyServices.xml:571-575); `store#WorkEffortPartyTime` writes `Worker` (TimeServices.xml:650-662) and the demo `Assignee` (data/ZbaOrganizationDemoData.xml:121-123 and four more rows) | P3: `store#Membership` writes `Assignee` for a member and `Manager` for the team's lead; the `Worker` rows stay. P3 changed |
| F64 | P0: Commons Home has fixed sections and no card registry (mr-boss screen/Commons/Home.xml:15-20). Another app's items reach Home and Today only as `today-source`s of its own root (xml-screen-3.xsd:694-701), gathered from the roots the user may open (crates/moqui-core/src/screen/shell.rs:16-21, :931-942; Home.xml:33-41), each answering `get#UserTodayItems`' item shape. `BOSS_PEOPLE_SELF` opens no People root (P1), so no People root source reaches a self-service employee. Commons' menu is its directory subscreens; there is no Commons/People | P8: People's self source is declared on Commons' root too, answering nothing without `PEOPLE_SELF_SERVICE`; Commons Home gains one People card over `get#SelfService` (owner contract); `Commons/People` stays out of the menu, reached by the card and Today. P8 changed |
| F65 | P0: a mail rule action is an `EmailRuleAction` Enumeration whose `optionValue` names its service (data/MantleSetupData.xml:464-467); `run#EmailRules` calls it with `emailMessageId`, `emailAccountId`, `emailRuleId`, `ruleOwnerUserId` and `value`, in its own transaction with authorization off (framework EmailClientServices.xml:4570-4581). `createRequest`'s plus tag maps only to a project, through the `WstIntakePlusTag` setting (service/mantle/request/RequestServices.xml:1110-1156) | P15, P16 each seed an action and a service on that contract that checks what it does itself and answers a message once: `createApplication` finds its opening from the rule's value or a plus tag set on the opening; `createExpenseLine` takes the claimant from their employment's work address and adds a draft line only. P15, P16 changed; design §1.4 Mail intake changed |
| F66 | P0: `get#RecordLinkInfo`'s hosts are a literal map with a visibility branch per entity (service/mantle/party/CommunicationServices.xml:2126-2151); BOSS's RecordFiles keeps a second map (mr-boss service/ironstone/shared/RecordFilesServices.xml:43-66). There is no "protected purpose". RecordFiles shares nothing (screen/Shared/RecordFiles.xml:31-148); a link share is Files' `share#Resource` (framework FileServices.xml:1852-1913), and on the Records drive a path outside the folder map is refused below the manage level (:141-150), where employments are left out on purpose (BossSetupData.xml:640-654) | P2 and each host's phase: an entry in both maps, a visibility branch by People's scope, no Records-drive folder; that is "public sharing off". P2 changed; design §13 RecordFiles and PE-01 changed |
| F67 | P0: the DAV server routes `/dav/calendars/<user>/<collection>/` to Mantle's four services (crates/moqui-dav/src/dav/pim.rs:15-29, :143-166); a collection row has `readOnly`, and the server refuses a PUT or DELETE on one before the adapter (:573-576, :618-621). `get#DavCollections` lists the user's calendars and a fixed `tasks` collection, on which the other three branch (CalendarDavServices.xml:137-164, :185, :280, :440): there is no registry | P12: the projected kind is a registration Mantle seeds naming the owner service, and a branch on its own collection-id prefix in `get#DavCollections` and `get#DavObjects`; no Rust. P12 changed |
| F68 | P0: Timeline.qvue enters its resource mode only under a path segment `ProductionSchedule` (mr-boss screen/Projects/WorkItems/Timeline.qvue:455-456), calls the mount's `schedule`, `moveOperation` and `decideOverride` with production parameters (:1085, :1134-1138, :1199-1202), keys lanes by `facilityId` with plant and work-center wording (:39-41, :89-95, :166-173) and bars by operation fields (:741-756). ProductionScheduleTui is its own table, not the qvue (ProductionScheduleTui.xml:37-53) | P14 makes the mode the mount's, with generic lane and bar keys and the wording from the answer (owner contract; Manufacturing's specs unchanged); ShiftRoster's TUI twin is its own table. P14 changed |
| F69 | P0: a payment run selects every approved invoice to the organization with an unpaid total but credit memos, with no payee role check (service/mantle/account/PaymentRuns.js:148-155), so payroll and tax invoices reach it once approved. It pays each as `PtInvoicePayment` (:542-554), where payroll's own path takes the type from the invoice type (`PtPayrollPayment`, PaymentServices.xml:607-611), from the payee's newest bank account whatever its purpose (:64-69), where payroll asks `PmpPayroll` (PayrollServices.xml:330-336); its ACH file is PPD (service/mantle/ext/account/NachaServices.xml:203-204) | P27's owner contract adds the payment type from the invoice type and a payroll payee's `PmpPayroll` account first; a tax authority is paid by check or its own channel in this build. P27 changed |
| F70 | P0: Insights admits a dataset to Assist or MCP only if its `DatasetClass` is `InsDcOperations` or `InsDcCost` (mr-boss service/ironstone/insights/Assist.js:72-84, :95-113, :212-234), so an `InsDcPeople` dataset is refused and listed nowhere, as an unclassified one; the class has no flag to set (entity/AdminEntities.xml:287-299). A business dataset needs a registered row-filter policy, its data feed and index, an admitted `BusinessDataset` row (BossSetupData.xml:3282-3286), the reader's grant on `org.moqui.report.dataset.<id>` and a readiness row for DataReadiness (:3347-3351) | P29 seeds these for each People dataset, its artifact granted to People's Insights bundle only; the Assist and MCP refusal holds with no code. P29 changed |
| F71 | P0: no data file of Mantle, BOSS or Marble makes an `EmploymentPayHistory` or `EmploymentLeave` row; `PayrollAdjustment` has 18 global tax rows with no employment, in install data (data/ZapPayrollTaxInstallData.xml:70 on), which the new engine never reads (§2); nothing at load runs `process#TimePeriodPay`, whose job has no schedule (data/MantleSetupData.xml:600-601) | §5 Q8 as answered: the historical views are empty on the demo; P11's and P26's specs make their own legacy rows. P26 changed |

## 7. Later

Designed, not in this build:

- **The design's later rows** (§2, §17): TalentPool and talent tags; TravelRequests; PayrollStatements and
  `PayrollLocalizationServices`' statement methods.
- **What waits on a localization** (design §18; §4): payroll is generic in this build, with no country's rules and
  only the synthetic demonstration localization. A real deployment needs a localized configuration and, in some
  cases, service changes as well. What waits on the first one: live finalization of any pay group, a
  jurisdiction's calculation and tax profile fields, statutory outputs, full and final settlement, compensatory
  leave and overtime from attendance, garnishments, named provider and bank connectors.
- **Links to Maintenance, built by impl-maintenance** (what it finds built here is in the phase named):
  - the rest of MT-03 on P7's two policy records and `ProcessServices` (its P6, P7): publication, approval and
    effectivity, step responses, evidence, readings and waivers, the guards-execution flag set for its procedures,
    and the refusal of managed work in the generic task services (its P3), which leaves People's checklist tasks
    alone (F54); its step requirements on P18's `WorkEffortSkillStandard.minimumSkillLevel` (F7);
  - Maintenance Teams over P3's `OrgTeam` teams and dated `PrtMember` rows, with its dispatch defaults (its P8);
  - `DevelopmentServices.check#Qualifications` (P18) and `get#PartyCapacity` with People's schedules, leave and
    shifts (P9, P12, P14) in technician assignment (its P8);
  - Employee360's Maintenance row in P2's context table, and `Maintenance/Equipment/Employee360` (its P2);
  - the guard and effective date of its custody change on `replace#AssetPartyAssignment` (its P2); P7's Mantle
    rule on the assignment's end completes the return task for it as for People and Warehouse (F52);
  - its labor cost on P10's `RateServices.get#CostingRate`, which it only reads (its P11; §4);
  - its two projected calendars, registered on P12's projected kind (its P19).

  TechnicianKiosk, on P30's kiosk identity and Admin P18, is later in Maintenance's plan too (its §7).
- **Links to Sales, built by impl-sales:**
  - TeamMembers' employee lookup over `mantle.humanres.PeopleServices.find#Employees` (P2), with a member's link to
    `People/Employees/Employee360` for a People user and `Commons/People/Employee360` otherwise, for a viewer
    `get#Employee360` admits (impl-sales P2; Employee360 has no Sales context row);
  - Sales' lifecycle participant, which answers the access-end entry People asks of Admin's lifecycle for a
    separation (`ironstone.admin.LifecycleServices.request#AccessEnd`, P7; impl-sales P6).

  The sales commission as a PayrollInputSource type fed by Sales (review X16) is later in Sales' plan too (its §5
  Q4 and §7), a phase of its own over P24's sources; customer retainers and prepaid hours are Sales' and never
  employee advances (design §9).
- **Links to Marketing, built by impl-marketing:** its P12 builds on the survey builder P16 generalizes (F51):
  Marketing's context registration, its public purposes (lead, registration), option scores where P16 did not need
  them, and the publication services (`store#`, `publish#` and `close#Publication`, `create#Invitations`,
  `accept#Submission`, FormSubmission) in `mantle.party.FormPublicationServices`, beside P16's
  `FormDefinitionServices`. Its campaign calendar registers on P12's projected kind (its P21). Marketing's CheckIn
  route group is Marketing's and Admin P18's.
- **Owners' later work found here:** Projects' cost reports switching to the costing rate (§4), and its leave
  marker in MyTime and planner by team over P12's and P3's records (impl-projects §7); Manufacturing's
  shared-station operator switch on People's kiosk identity (impl-manufacturing §7); Projects' StaffAllocation
  adopting `check#Qualifications`; People's privacy provider and retention purposes, when Admin builds
  PrivacyServices and Retention (F47); whether People's changes belong in Admin's AuditChanges at all, Admin's F257
  (People registers no audit projection, F56).
- **Read receipt from a photo** (P15; the user's call, §4, Nov 12, 2026): `run#Extract` takes text only, so a photo's receipt
  is read only once the framework offers an image or OCR input (a framework ask in mr-moqui's `plans/Remaining-Work.md`);
  `read#Receipt` would then pass the receipt file itself.
- **Design §17's later capabilities and §18:** the PASS careers page and public registration; full LMS delivery;
  roster optimization and swaps; offline kiosk drafts; a graphic org chart; a CardDAV company directory; mileage and
  per-diem claim lines (§5 Q7); migration of legacy leave and pay history into the new records (§5 Q8); advanced
  agricultural operations and a measured workload target; anonymous feedback.

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo People user, and walk each built phase's "usable when" in
  order; open SelfService from Commons as an employee with no People launcher.
- **Design §14.3 scenarios,** each an acceptance test (`./moq accept mr-boss`, when asked):

| Scenario | Phase |
| --- | --- |
| Hire, complete a legacy relationship and rehire | P6; P7 (the optional login) |
| Transfer, manager change and separation | P3, P6; P7 (tasks and access requests) |
| Confidentiality across every path | P2 (directory), P21 (cases), P23 and P27 (pay and finance); P31's walk |
| Pay rates and phones | P10 (rates), P7 (the Tasks collection) |
| Separation and equipment | P7 |
| Partial-day leave and simultaneous requests | P12 |
| Accrual and schedule changes | P11; P9 (schedules) |
| Attendance, timesheets and DST | P13; P9 (DST), P24 (paid once) |
| Source lock and worker invoice collision | P24 |
| Salary/rate change and mixed pay | P25 |
| Regular, off-cycle and correction runs | P26 |
| Failure and restart | P25; P27 (obligations) |
| Approval and concurrent finalization | P25 (approval), P27 (finalization, under the acceptance fixture) |
| Localization readiness | P22, P27 |
| Accounting and posting | P27 |
| Payment and bank changes | P27 |
| Expense reimbursement and advances | P15 (AP), P27 (the payroll route) |
| History and provider exchange | P28 |
| Qualifications and reviews | P18, P19, P20 |
| Navigation and devices | each phase; P30 (the kiosk); P31's sweeps |

- **Design-admin §15.3 "Hire and invitation",** its People half: P7.
- **Walks.** One golden-path client walk for People in the regression suite (PeopleHireWalk, from P6); the others
  are acceptance tests. No screenshots.
