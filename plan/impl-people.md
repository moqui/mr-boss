# IronStone BOSS — People implementation

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
    (registries), P3 and P9 (capability bundles), P6 (lifecycle), P15 and P16 (transfer targets); P18 (shared devices,
    not built).
  - [impl-insights.md](impl-insights.md) §7 "What waits on People" and the Built notes of its registries.
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
  and P22–P23 beside stage 3, since pay configuration needs only employment and P4's grades. The dependencies that
  fix the rest: P4 needs P3's departments (a position's department and its choices); P6 needs P3's units, P4's
  positions and P5's approvals; P7 needs P6's services and Admin P6 and P15 (built); P11 and P12 need P9's schedules
  for durations; P13's corrections and P15's claims need P5; P17 consumes P6's hire; P19 grants P18's
  qualifications; P19's results and P20's assessments are responses of P16's forms; P16's scorecards, P20's review
  text and P21's cases need P12's AI opt-out; P24 needs P10–P13 and P15 (the sources it reserves); P27 needs P15
  (the claim's payroll route) and P25–P26; P30 waits for Admin P18 and may move after gate 5 if P18 has not landed;
  P29's datasets wait for nothing in Insights P11–P12. A phase of a side-by-side pair that appends to the same file
  as the other (BossSetupData.xml, BossUsersDemoData.xml, mr-mantle's setup data) rebases on it before merging.

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
| P0 Checks | all (read) | — | partly done Nov 11 (§6 F1–F54); the checks below left |
| P1 Foundation | Mantle, BOSS | the People root and menu, Home (frame), Settings (frame) | — |
| P2 Employees and Employee360 | Mantle, BOSS | Employees, Employee360, Chatter, RecordFiles; Insights' and Admin's links | — |
| P3 Organization and reporting | Mantle, BOSS | OrgStructure, OrgChart | — |
| P4 Job classes, positions and pay grades | Mantle, BOSS | JobClasses, JobClassDetail, Positions, PositionDetail, PayGrades | — |
| P5 Approval rules and Approvals | Mantle, BOSS | ApprovalPolicies, Approvals, Lookups | — |
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
| P30 Clocking kiosk | Mantle, BOSS | ClockingKiosk | — (waits on Admin P18) |
| P31 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F54 were found on Nov 11 while writing and reviewing this plan; the design
edits they call for in design-people were made then (F11, F20, F34, F51). Still to check:

- **Admin P18, when it lands** (planned from the design, F24): the device credential's principal (a display account,
  impl-admin P18's proposal), the route-group registration's fields, how a route group that is one screen
  (`People/Time/ClockingKiosk`) is granted, and the idle timeout; P30 is replanned on the Built note.
- **Admin P17, when it lands:** which People entities need a registered safe projection in
  `AuditServices.find#Changes` so a salary, tax election or case change is not disclosed by its audit row
  (impl-admin P17 names payroll); People registers them in P23 and P21, or right after P17.
- **The Projects time screens under another root** (F17): which of `ironstone.projects.TimeServices`' checks assume
  the Projects app (`get#TaskAccess` with app `projects`, impl-manufacturing.md:356), what MyTime.qvue reads from its
  route, and whether a time approver who is not a Projects user gets the weeks of the people they manage
  (`PrtManager` is read at TimeServices.xml:1551).
- **The readiness contract:** the checks list `RegistryServices` reads from a provider with no adapter
  (Registry.js:684), for the shape `PeopleServices.get#Readiness` answers.
- **The directory across employers** (F39, F49): what a directory reader of one organization sees of a person
  employed by two; the Party filter goes by `ownerPartyId`, which a person hired by a second employer keeps.
- **The return task's link to its assignment** (F52): how a task names an AssetPartyAssignment (a
  WorkEffortAssetAssign row, or the asset and custodian on the task), so that ending the assignment finds its task;
  Maintenance's custody change (its P2) ends the assignment through the same service, so the same rule completes it.
- **The costing purpose** (F34, §4): Manufacturing's `RaprProductionCost` rows and its lookup in
  ProductionShopFloor.js, for the move to the one purpose, `RaprCost`.
- **The survey builder's generic part** (F51): which of `CaseFeedbackServices`' form services hold case rules (the
  default rating, `SUPPORT_POLICY_EDIT`) and which are the builder's own, and what a response's reader check needs
  for a private purpose.
- **The team's from-role** (F13): which roles Projects and Maintenance read on a `PrtMember` row before
  `store#Membership` fixes one.
- **Commons' Home and Today card contract** for another app's cards, and whether `Commons/People/SelfService` needs
  a Commons menu entry (design §1.2) or only the cards' links.
- **Mail rule actions:** how Mantle's `createRequest` action resolves its plus-tag address to a target
  (MantleSetupData.xml:464), for `createApplication` and `createExpenseLine`.
- **`get#RecordLinkInfo`'s registration** of a content entity and a protected purpose
  (CommunicationServices.xml:2005), for the six HR hosts of PE-01, and what Shared/RecordFiles does with public
  sharing for a protected purpose.
- **The projected calendar kind** in `CalendarDavServices.get#DavCollections` (CX-SYNC, design PE-24): it lists the
  user's calendars and Tasks only (F22); whether a read-only projected collection is a calendar of a new kind or a
  provider.
- **The resource-lane timeline** (crosscut M11, F53): which transitions and lane and bar fields Projects'
  Timeline.qvue asks of a mounting screen in its resource mode, as ProductionSchedule answers them, for ShiftRoster's
  person lanes.
- **Payment runs for employee payees** (design §8.3): what `PaymentRunServices` assumes of a supplier payee that an
  employee or tax authority does not have.
- **Insights' dataset admission** for a dataset of class `InsDcPeople`: what admission asks of a dataset no Assist
  or MCP surface may read (impl-insights P3 and P10 Built notes).
- **Legacy rows on the demo instance:** whether any demo or install data makes `EmploymentPayHistory`,
  `EmploymentLeave` or `PayrollAdjustment` rows that Payslips' historical view or LeaveBalances would show (F31).

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
  employee with no manager; later phases add theirs).
- **Admin's registries** (owner contracts, F27): People's capability bundles from crosscut §1.4's rows, as the
  built apps' are (BossSetupData.xml:2676-2687), `PEOPLE_IMPORT` in the HR bundle; the settings entry
  `people.settings` to `People/Settings` (the pattern of :2553-2556) and the readiness provider `people.setup` over
  `get#Readiness` with `PEOPLE_CONFIGURE` and `fixPath` People/Settings (the pattern of :2557-2560).
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

### P2 — Employees and Employee360

Design §4 Employees and Employee360 (Overview, EmploymentHistory, PersonalInfo, FilesAndActivity), §15 (the
directory export); PE-01 (projections, the employment content host), PE-02 (history), PE-18 (the registry).

- **Mantle PeopleServices:** `find#Employees` (the public work projection; HR columns with `PEOPLE_HR_VIEW`; search
  in the query, ignoring case; paged), `get#Employee360` (regions by capability, an omitted region absent from the
  answer), `get#EmploymentHistory` and `store#PersonalInfo` (self for the permitted fields, HR for the rest; tax and
  bank fields refused here). The employment content host (employment content keyed by `partyRelationshipId`) and
  its registration in `get#RecordLinkInfo` with a protected purpose (P0). `get#EmploymentHistory` lists employments
  until P6 adds their assignments.
- **`Shared/Employee360.xml`** (crosscut §3.4): takes `partyId`, an optional employment and `appRoot`; capabilities
  from the service; regions, fixed scope and actions from a per-app context table in People.js keyed by `appRoot`,
  which a later app adds its row to. Mounted at `People/Employees/Employee360`, at `Commons/People/Employee360` (own
  or public card; the first screen of Commons' People area, F46), and at `Insights/Records/Employee360` (Overview
  only, read), beside the record screens Insights mounts (F40). Projects' PersonDetail and Admin's UserDetail gain
  a link for the audience `get#Employee360` admits (F41); they and any app with no row link the People mount for a
  People user and the Commons mount otherwise. Each is an owner contract.
- **Chatter and RecordFiles** (design §13): the root's two mounts stay; under People they open only a host the
  HR services admit (the employment here, each later host with its phase), with public sharing off for a protected
  purpose (P0), and a person's Party timeline carries no HR child's content.
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

### P3 — Organization and reporting

Design §4 OrgStructure and OrgChart; PE-03 (units, teams, reporting).

- **Mantle `mantle.humanres.OrganizationServices`:** `find#Units` (the tree, lazy children, as-of counts),
  `store#Unit` (a department with the `OrgDepartment` role or a team with `OrgTeam`, a dated `PrtOrgRollup` to its
  parent; cycles, moves across legal employers and stale dates refused; F11), `store#Membership` (a dated
  `PrtMember` row; never an employment; the from-role P0 settles, F13), `get#ReportingTree` and `change#Manager`
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

### P6 — Hire and employment change

Design §4 (the employment model), HireEmployee, EmploymentChange; PE-02.

- **Mantle `EmploymentAssignment`** (dated: department, primary position, manager, work location, schedule; inside
  the employment; one primary at a time) and PeopleServices `preview#Hire`, `hire#Employee` (one transaction: person
  chosen or created, the Employee role, exactly one employment through `create#Employment`, the first assignment,
  position occupancy; an orphan `PrtEmployee` relationship completed, not duplicated; an operation key),
  `preview#EmploymentChange`, `apply#EmploymentChange` (transfer, manager change, leave of absence, separation; the
  role and relationship projections maintained by the same service) and `decide#EmploymentChange` on
  `PeopleEmploymentChangeApproval`.
- **`create#Employment` and `update#Employment`** narrow their overlap check to `PrtEmployee` (F3); every other
  caller keeps its behavior. People calls neither `delete#Employment` nor `create#PersonEmployee` (F5).
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
  AssetPartyAssignment, each naming its assignment (P0). The return is `replace#AssetPartyAssignment` to the
  receiving custodian, which the service requires (F52), after People's scope check; a Mantle rule on the
  end of an AssetPartyAssignment completes the return task that names it, so Warehouse's and, later, Maintenance's
  custody changes complete it too (F45). Maintenance's P2 adds only its guard and an effective date to
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
- **Shell:** the Today source (decisions waiting on me), Commons Home's People cards (P0), the notification topic
  `PeopleTaskAssigned`.
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
  Billing/Rates at `People/Payroll/Rates`, the screens reading their context from the mount (P0), with People's
  filters: no rate column without `PAYROLL_VIEW`, client rates hidden without Projects' billing grants.
- **PE-23:** RatePurpose `RaprCost` seeded, the one labor costing purpose (§4);
  `RateServices.get#CostingRate` (the most specific dated rate by position class and work type; never a person's
  rate; none answers unpriced), Rates' read-only Labor costing rows, and Accounting's LaborCostingRates form on
  CostingPolicies, which Manufacturing deferred (F34; owner contract). Manufacturing values production labor from a
  purpose of its own, `RaprProductionCost` (F34), and this phase changes its built code and data to the one purpose
  (owner contract, §4): the `RaprProductionCost` rows (the seed in mr-mantle data/ProductionShopFloorData.xml, the
  demo's rates in mr-boss data/BossManufacturingDemoData.xml, and rows a deployment holds, by a data update) become
  `RaprCost`, the `RaprProductionCost` value is removed, and the lookup in mr-mantle
  service/mantle/work/ProductionShopFloor.js calls `get#CostingRate`, so the form's rates are the ones every app
  reads. Manufacturing's specs are kept passing, changed only where they name the purpose. Maintenance reads
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
  it admits, and the kind itself reads no People record. Team absence is the first; published shifts (P14), my
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
  ProductionSchedule mounts it (F53, P0), one lane per person, with its TUI person and date table; drag previews
  and the dialog commits.
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
  `create#ApplicationFromEmail`. My interviews, for panel members, is a projected calendar (P12).
- **The survey builder for a second app** (owner contract with Commons and Customer Service; F51, §4):
  - the four shared screens (`Shared/SurveyForms`, `SurveyFormDetail`, `SurveyResponses`, `SurveyResponseDetail`)
    take their context from the mounting app's registration and no longer from a Customer Service branch: the
    purposes the app offers, the default form of each, the service that lists its forms and the one that reads its
    responses, the capabilities that edit and read, and the links. Customer Service's is the first registration,
    with its behavior and specs unchanged; People's is the second; Marketing's plan adds its own;
  - the builder's form definition services move from `mantle.request.CaseFeedbackServices` to
    `mantle.party.FormDefinitionServices` (`create#Form`, `get#Form`, `rename#Form`, `save#FormField`,
    `save#FormCondition`, `end#FormPart`, `publish#Form`), each checking the permission its purpose names;
    `CaseFeedbackServices` keeps its names as callers of them with the case defaults (P0);
  - People's purposes on FormPublication (interview scorecard, review, training assessment, exit interview): a
    form of one is answered only by the respondents a People service assigns, has no public or invitation link,
    and its responses are read through the People service of the record they belong to (the scorecard's own
    reviewer here; P19's trainer, P20's review step), never through another app's registration.
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
  `EmploymentPayHistory` rows read only, by their own key, never recalculated.
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
  completed finalization for a payroll-origin invoice; and AC-23, built here following design-accounting (§4):
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
  given its targets. No shipped dataset carries pay.
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

Design §6 ClockingKiosk, §1.4 (devices), §15 (the badge); PE-05 (kiosk identity), PE-22. Planned from the design:
Admin P18 is not built, and this phase is replanned on its Built note (P0).

- **Mantle** kiosk identity: revocable opaque badge tokens and PINs (stored hashed, attempts rate-limited),
  `AttendanceServices.record#KioskPunch` (the device from the session, the worker from badge and PIN, an event key
  for retry) and the badge print over `ec.resource.barcodeSvg`.
- **The route group** (owner contract with Admin P18): `People/Time/ClockingKiosk` registered as a device route
  group; the device's account holds only the kiosk permission and reaches no directory, payslip or search.
- **Screens:** ClockingKiosk (IdentifyAndClock at `density="handheld"` with `scan-input`, cleared on idle), its TUI
  twin; Employee360's badge action.
- **Specs:** Mantle `test/humanres/KioskIdentity` (a wrong PIN refused and limited; a revoked badge refused; a
  retry with the key records once); BOSS `PeopleKiosk`.
- **Usable when** (`acceptance/People/PeopleKioskUsable`): Admin registers a tablet for the kiosk; two workers
  clock in by badge and PIN; the tablet opens nothing else; revoking it ends its session.

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
| Nov 11, 2026 | Projects' time screens and Rates are mounted under People as they are, made to read their context from the mount; they are not copied or moved to `screen/Shared/` | The plan's choice (F17): one definition, the owner's services; the change is small and Projects' routes do not move |
| Nov 11, 2026 | A department carries the `OrgDepartment` role and a `PrtOrgRollup` to its parent, never `OrgInternal`; Admin's Organizations keeps the legal organizations | F11, F12; design-admin §7 already says so; design-people §4 changed |
| Nov 11, 2026 | The framework's per-field AI opt-out (PE-21) is built in P12 and the decimal evaluator (PE-09) in P22, by this plan | The plan's choice: both are Remaining-Work asks only People needs now (F24) |
| Nov 11, 2026 | Self-service clocking (P13) does not wait for the kiosk; ClockingKiosk and kiosk identity (P30) wait for Admin P18 and may follow gate 5 | The plan's choice: the device credential is Admin's and unbuilt (F24) |
| Nov 11, 2026 | Each People approval topic is seeded in Mantle with the phase that builds its decision service, not all in P5 | The plan's choice: a topic that names a missing service would be a broken approval |
| Nov 11, 2026 | People's lifecycle participant is the user's open People decisions and the approval rules that name them (P5), with openings and review steps joining it | The plan's choice: design-admin §14 names People's entry, not what People owns per user |
| Nov 11, 2026 | The regression budgets may be raised by this plan's estimates as its phases land, each raise by the phase's measured share: about 60 s on mr-mantle, 20 s on mr-boss's server budget, 8 s on its client budget and a second or two on the framework's. A raise beyond an estimate needs the user's agreement again. No spec may pass 15 seconds, as before | The user's call (AGENTS.md: a budget is raised only with the user's agreement). The estimate: about thirty Mantle specs, eighteen BOSS specs, one client walk and two framework specs, at the earlier apps' measure (about two seconds a Mantle spec, about 20 s of server budget and 5 to 8 s of client budget an app). Today mr-boss is 264 s server and 57 s client, mr-mantle 393 s (F37). A phase that would pass an estimate cuts a duplicate or moves a scenario to acceptance |
| Nov 11, 2026 | One golden-path client walk, `PeopleHireWalk` (P6); every other walk is an acceptance test | Build-Test's rule |
| Nov 11, 2026 | There is one labor costing purpose, `RaprCost`. P10 seeds it, builds `get#CostingRate`, and changes Manufacturing's built code and data to it: the `RaprProductionCost` rows become `RaprCost` and the lookup in mr-mantle `ProductionShopFloor.js` calls `get#CostingRate`. Maintenance reads `get#CostingRate` only | The user's call. An owner contract with Manufacturing, whose specs are kept passing (F34); two purposes would leave Accounting's LaborCostingRates form editing rates production does not read. Projects' cost reports switch in its owner's later work (§7). impl-maintenance §4, impl-manufacturing §7 and the designs say the same |
| Nov 11, 2026 | P27 builds Accounting's payroll-origin projection (AC-23), following design-accounting, and external payroll processing (P28's live results) is gated on it as native finalization is | The user's call: there is an Accounting app, but accounting functionality is in practice spread among the other apps, so the app that needs a piece builds it, as an owner contract following design-accounting. AC-23 was designed and in no plan (F29), and external results create the same payroll invoices (F30). Maintenance builds AC-24 on the same ground (impl-maintenance §4) |
| Nov 11, 2026 | A hire's provisioning proposes `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default, and the account request is optional on ConfirmHire | The user's call, as recommended. Design: no login merely for payroll. Anything more is chosen by HR from the bundles HR may grant, and Admin's delegation rules decide (P7) |
| Nov 11, 2026 | Payroll stays generic in this build: no country localization, only the synthetic demonstration localization (P22). The phase order of §1 stands as written | The user's call. A real deployment needs a localized configuration and, in some cases, service changes as well; live finalization, full and final settlement, compensatory leave and overtime follow the first real localization (§7) |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Q2. (answered Nov 11, §4) One labor costing purpose, `RaprCost`; P10 moves Manufacturing's rows and lookup to it | P10 | Nothing is open |
| Q3. What is a payslip in preview mode? | P26 | Recommended: an approved preview run's results are kept as preview slips, visible to payroll only, never issued to an employee and never an obligation; SelfService shows issued slips only, so none in this build outside the acceptance fixture |
| Q6. Mantle's demo departments are `OrgInternal` parties (ORG_ZIZI_HR, ORG_ZIZI_SALES) | P3 | Recommended: leave Mantle's demo as it is; OrgStructure shows them as legal organizations under their parent, and People's demo adds `OrgDepartment` units under the BOSS employers |
| Q7. Mileage and per-diem claim lines (design §18) | P15 | Recommended: later (§7), unless a launch deployment reimburses mileage |
| Q8. Legacy leave and pay rows (EmploymentLeave, EmploymentPayHistory) | P12, P26 | Recommended: read only, labelled historical; no migration in this build (§7) |
| Q9. (answered Nov 11, §4) The budgets may be raised by the plan's estimates, by each phase's measured share | every phase's Done | Nothing is open; a raise beyond the estimates is asked of the user again |
| Q10. (answered Nov 11, §4) People's import targets name `PEOPLE_IMPORT` | P7, P13 | Nothing is open |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F48 were found on Nov 11, 2026, while writing this plan, and F49–F54 in its review the same
day, which also corrected F19, F26, F33, F34, F39 and F46. Mantle paths are under
`runtime/component/mr-mantle/`, BOSS paths under `runtime/component/mr-boss/`.

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
  PrivacyServices and Retention (F47); the safe audit projections of People's entities, when Admin P17 lands (P0).
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
