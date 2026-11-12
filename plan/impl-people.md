# IronStone BOSS — People implementation

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
| P6 Hire and employment change | Mantle, BOSS | HireEmployee, EmploymentChange | — |
| P7 Checklists, equipment return, provisioning and employee import | Mantle, BOSS | ChecklistTemplates, WorkItemDetail, EquipmentDetail, EmployeeImport | — |
| P8 Self-service, MyTeam and Home | Mantle, BOSS | SelfService (People and Commons), MyTeam, Home | — |
| P9 Working schedules, holidays and capacity | Mantle, BOSS | WorkingSchedules, WorkingScheduleDetail, HolidayCalendars | — |
| P10 Time mounts, rates and labor costing | Mantle, BOSS | MyTime, Timesheets, TimesheetDetail, TimeEntries, Rates; Accounting's LaborCostingRates | — |
| P11 Leave policies, allocations and balances | Mantle, BOSS | LeavePolicies, LeavePolicyDetail, LeaveAllocations, LeaveBalances | — |
| P12 Leave requests and the team calendar | mr-moqui, Mantle, BOSS | LeaveRequests, LeaveRequestDetail, TeamCalendar | — |
| P13 Attendance and time import | Mantle, BOSS | Attendance, TimeImport; SelfService's Clock | — |
| P14 Shift roster | Mantle, BOSS | ShiftRoster | — |
| P15 Expense claims and advances | Mantle, BOSS | ExpenseClaims, ExpenseClaimDetail, EmployeeAdvances, InvoiceDetail; Accounting's ExpensePosting | — |
| P16 Openings and applicants | Mantle, BOSS | Openings, ApplicantPipeline, ApplicantDetail, InterviewsCalendar, Forms (the survey builder for a second app) | — |
| P17 Offers and hire from an offer | Mantle, BOSS | OfferDetail | — |
| P18 Skills and qualifications | Mantle, BOSS | SkillsMatrix, Qualifications | — |
| P19 Training | Mantle, BOSS | Training, TrainingDetail | — |
| P20 Reviews and goals | Mantle, BOSS | ReviewCycles, Reviews, ReviewDetail, Goals | — |
| P21 Grievances | Mantle, BOSS | Grievances, RequestDetail | — |
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
  `reasonCode`, `message` and `fixPath`, and refuses an organization outside the caller's scope by reason code.
- **Admin's registries** (owner contracts, F27): People's capability bundles from crosscut §1.4's rows, as the
  built apps' are (BossSetupData.xml:2676-2687), `PEOPLE_IMPORT` in the HR bundle; the settings entry
  `people.settings` to `People/Settings` (the pattern of :2553-2556) and the readiness provider `people.setup` over
  `get#Readiness`, scope `AdmScOrganization`, with `PEOPLE_CONFIGURE` and `fixPath` People/Settings (the row of
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
  (the readiness contract: Registry.js reads a provider with no adapter as the `checks` list and leaves out a refusal whose
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
    `NO_DEPARTMENT`) and `people.managers` (warning `EMPLOYEE_NO_MANAGER` with the count), `fixPath` People/Settings, each check
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
    by a code Registry.js leaves out (`refusalCodes`), and shows a failing check unavailable by name.
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
- Findings (provisional, numbered by the lead):
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
- Provisional findings (for the lead to number):
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
  only), CSV-injection safe, exports from the same projection. PeopleServices `store#Settings`.
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
which also corrected F19, F26, F33, F34, F39 and F46, and F55–F71 in P0's last checks the same day. P1's F72 to F78 (Nov 11, 2026) are in its Built and Review notes. P2's F79 to F88 (Nov 11, 2026) are in its Built and Review notes. P3's F89 to F99 (Nov 11, 2026) are in its Built and Review notes. P4's F100 to F109 (Nov 11, 2026) are in its Built and Review notes. P5's F110 to F120 (Nov 11, 2026) are in its Built and Review notes. Mantle paths are
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
| F27 | P0: the registries' built contracts: ReadinessProvider (entity/AdminEntities.xml:21-50; Products' row BossSetupData.xml:2557-2560; an adapter or the contract's checks list, service/ironstone/admin/Registry.js:145, :684), SettingsEntry (:2553-2556), capability bundles (:2676-2687; People left out, plan/impl-admin.md:932), LifecycleParticipant (:4041-4044), ReportCatalogEntry (:3438-3446), MetricRegistration (:3741-3753), AttentionProvider (:3863-3868), FlowTarget (:4545-4548), DatasetClass with `InsDcPeople` already seeded (:4782-4785); the internal flow map's People step is information only (report/insights-flowmap-internal.json:208) | P1, P5, P29 |
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
| F58 | P0: a readiness provider with no adapter answers the registry's contract (service/ironstone/admin/Registry.js:139-143, :351-357, :684): called with `providerKey`, and `organizationPartyId` once per organization for `AdmScOrganization` (:112-135), it returns `checks` [{checkKey, title, state ready, warning, failed or unavailable, reasonCode, message, fixPath, watermark, coverage}]; a refusal by reason code is left out and any other failure is a `PROVIDER_FAILED` row (:685-700); the organizations are the Admin user's (:84-88). Accounting's and Products' services have adapters (Products' row is BossSetupData.xml:2559-2562); Insights' datasets and Admin's checks answer the contract | P1: `get#Readiness` answers the contract, organization-scoped, with no adapter, and refuses an organization outside the caller's scope by reason code. P1 changed |
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
