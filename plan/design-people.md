# IronStone BOSS — People design

Oct 31, 2026 — draft; source-checked design, not an implementation record.

IronStone People serves HR officers, managers, recruiters, payroll specialists and employees. It covers employees and organization structure, positions and recruiting, time and leave, payroll and expenses, skills and training, and reviews. People owns the HR record and payroll calculation; Commons supplies personal self-service and collaboration, Projects supplies tasks and timesheets, and Accounting supplies posting and settlement.

**Inputs.** [research-people.md](research-people.md), [initial-design.md](initial-design.md), [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md), [design-crosscut.md](design-crosscut.md), [design-drawers-commons.md](design-drawers-commons.md), [design-projects.md](design-projects.md), [design-accounting.md](design-accounting.md), [ss-inventory.md](ss-inventory.md), [usl-inventory.md](usl-inventory.md), and the active Mantle/Marble sources. The [application practices](../../../../docs/dev/Practices-App-Dev.md) govern implementation.

**Payroll correction to the research.** The available payroll services, entities and data are an incomplete historical implementation, not simply a complete engine needing screens and updated rates. A later, unavailable commercial version processed payroll for approximately 10,000 agricultural workers and smaller numbers of varied staff; those capabilities cannot be attributed to this checkout or reconstructed from that history. This design supersedes the research’s payroll reuse, readiness and sequencing conclusions (§9 and §18). It designs a native, country-neutral core for a broad workforce, informed by open-source references and retaining suitable Mantle foundations. No first country, current tax pack, legal filing support or demonstrated throughput is claimed.

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home-and-self-service) · [4 employees](#4-employees-and-organization) · [5 recruiting](#5-positions-and-recruiting) · [6 time](#6-time-and-attendance) · [7 leave](#7-leave) · [8 payroll](#8-payroll-and-compensation) · [9 expenses](#9-expenses-and-advances) · [10 skills](#10-skills-and-training) · [11 reviews](#11-reviews-and-goals) · [12 settings](#12-reports-and-settings) · [13 shared screens](#13-shared-screens) · [14 coverage](#14-baseline-coverage-and-acceptance) · [15 outputs](#15-documents-and-outputs) · [16 needs](#16-framework-and-data-needs) · [17 decided](#17-decided) · [18 open](#18-open)

## 1. Shell

### 1.1 Root, authority and presentation

Root `screen/People.xml`, mounted as `People`, uses artifact group `BOSS_PEOPLE` and icon `sym_o_groups`. Root and section placeholders exist; application grants and workflows are not thereby implemented. `BOSS_PEOPLE_ADMIN` already exists. Add the following proposed capability groups and permissions in setup data, without checking group names inside services. Self-service mounts under Commons use their own underlying permissions and do not require the HR app root grant. Grant only the required self-service People routes and parent context artifacts to the self group; keep the staff launcher and unrelated People routes restricted. Do not grant inherited access to the whole People tree to make a payslip link work.

| Audience / proposed group | Proposed permissions | Scope |
| --- | --- | --- |
| Directory reader / BOSS_PEOPLE_READ | PEOPLE_DIRECTORY_VIEW | Public work identity in authorized organizations; no private contact, employment documents or compensation |
| Employee / BOSS_PEOPLE_SELF | PEOPLE_SELF_SERVICE | Own party and eligible employments, issued payslips, requests and permitted personal corrections; no arbitrary partyId override |
| Manager / BOSS_PEOPLE_MANAGER | PEOPLE_TEAM_VIEW, PEOPLE_REQUEST_APPROVE | Effective reporting relationships and explicitly assigned approval steps; no implicit compensation or grievance access |
| HR officer / BOSS_PEOPLE_HR | PEOPLE_HR_VIEW, PEOPLE_HR_EDIT | Employment and private-person data in granted organizations; compensation separately granted |
| Recruiter / BOSS_PEOPLE_RECRUIT | PEOPLE_RECRUIT_VIEW, PEOPLE_RECRUIT_EDIT | Assigned openings, applications and offers; interviewer sees assigned interviews and scorecards only |
| Payroll operator / BOSS_PEOPLE_PAYROLL | PAYROLL_VIEW, PAYROLL_EDIT | Compensation and payroll preparation in granted employers; cannot authorize bank payments |
| Payroll approver / BOSS_PEOPLE_PAYROLL_APPROVE | PAYROLL_VIEW, PAYROLL_APPROVE | Review exact run population and calculated results; cannot approve own prepared run |
| Learning/review administrator / BOSS_PEOPLE_DEVELOP | PEOPLE_DEVELOP_VIEW, PEOPLE_DEVELOP_EDIT | Skills, training and review administration; private review text still respects participant/reviewer scope |
| Confidential case handler / BOSS_PEOPLE_CASE | PEOPLE_CASE_HANDLE | Explicit case assignment, not every HR grievance |
| People administrator / existing BOSS_PEOPLE_ADMIN | PEOPLE_CONFIGURE plus explicit domain grants | Policy and setup; organization scope still checked by services; no implied bank/gateway administration |

Payroll configuration requires both PAYROLL_EDIT and PEOPLE_CONFIGURE; operational preparation alone cannot publish configuration. Permissions are intersected with organization, employment, relationship dates, record participation and field category. Separate view and edit grants. Employee and manager access never inherit private pay data merely from a Party or Project grant. Missing and unauthorized records both show “Not available”. Reject self-approval for leave, expenses, offers/pay changes and payroll; a configured alternate approver handles an absent or conflicted manager, and unresolved routing stays waiting rather than auto-approving.

Public directory projections omit private addresses, tax identifiers, bank information, pay, reviews and case existence. Sensitive children use canonical employment, application, review, payslip or request identities for files and Chatter; never attach their contents to a broadly visible Party timeline. Record links, counts, search, exports, notifications, Assist responses and financial drill-downs apply the same checks. Generic entity REST and alternate Mantle entrypoints must not bypass these rules (PE-01).

XML screens use standard record headers, one status-dependent primary action, server-search choices, mobile columns and paginated service results. End/delete/approve/finalize actions confirm the named record or selected count. Shared calendars, files and Chatter retain their owners’ custom implementations. OrgChart, ShiftRoster and SkillsMatrix need custom visualizations plus equivalent TUI lists/forms; board recruitment and department trees use existing XML widgets. No new general board/tree widget is requested.

### 1.2 Menu

Menu entries name the landing screens; detail routes are in §2 and reached from records. A section with no available capability is omitted.

- Home — `Home`; My team — `MyTeam`; Approvals — `Approvals`.
- Employees — `Employees`; Organization — `OrgStructure`; Org chart — `OrgChart`; Grievances — `Grievances`.
- Positions & recruiting — `Positions`; Job classes — `JobClasses`; Pay grades — `PayGrades`; Openings — `Openings`; Applicants — `ApplicantPipeline`; Interviews — `InterviewsCalendar`.
- Time & leave — `Attendance`; Working schedules — `WorkingSchedules`; Shift roster — `ShiftRoster`; Timesheets — `Timesheets`; Hours for pay — `HoursForPay`; Leave requests — `LeaveRequests`; Leave balances — `LeaveBalances`; Team calendar — `TeamCalendar`.
- Payroll — `PayRuns`; Payslips — `Payslips`; Pay assignments — `PayAssignments`; Pay adjustments — `PayAdjustments`; Rates — `Rates`; Data exchange — `PayrollExchange`.
- Expenses — `ExpenseClaims`; Advances — `EmployeeAdvances`.
- Skills & training — `SkillsMatrix`; Qualifications — `Qualifications`; Training — `Training`.
- Reviews — `ReviewCycles`; Reviews — `Reviews`; Goals — `Goals`.
- Reports — `Reports`.
- Settings — `Settings`; Payroll components — `PayComponents`; Pay structures — `PayStructures`; Pay groups — `PayGroups`; Leave policies — `LeavePolicies`; Allocations — `LeaveAllocations`; Holidays — `HolidayCalendars`; Approval rules — `ApprovalPolicies`; Checklists — `ChecklistTemplates`; Forms — `Forms`; Lookups — `Lookups`.

`Commons/Home` remains the personal landing, showing authorized People shortcuts and summaries. `Commons/People/SelfService` mounts the same `Shared/PeopleSelfService.xml` as `People/SelfService`. It links to owner routes for requests, time and payslips; it is not another HR dataset or a separate employee app. Account/password preferences stay in Commons. The kiosk is a separately authorized route, not a publicly reachable employee directory.

Home offers headcount, joiners/leavers, people out, vacancies, pending decisions, payroll exceptions and expiring qualifications, each a filtered-list link. MyTeam offers out-today, missing timesheets, assigned approvals and reviews due. Counts exclude inaccessible records and compensation is absent from general HR cards.

### 1.3 Verified baseline and reference use

| Source checked | Finding and design consequence |
| --- | --- |
| `mr-mantle/entity/HumanResourcesEntities.xml` and `HumanResourcesViewEntities.xml` | Employment, positions, rates, benefits, applications and PartySkill are active. Qualification, resume, training, review and requisition/interview sketches inside XML comments are not active entities. Their replacement/refinement is a need, not an entity API available today. |
| `mantle/humanres/EmploymentServices.xml`; `mantle/party/PartyServices.xml` | `create#Employment` creates relationship and Employment; `create#PersonEmployee` creates a person/relationship but no Employment. Hire must coordinate them without duplicating the relationship. |
| `mantle/humanres/PayrollServices.xml` | Period-centric processing creates financial documents while calculating; a TODO references an unavailable V2 regular-rate calculation; currency mixing is explicitly unresolved. `reopen#PayrollPeriod` deletes pay detail/history. Do not expose these operations as the new run lifecycle. |
| `HumanResourcesEntities.xml` pay history | `EmploymentPayHistory` is keyed by employment and pay date; it cannot identify multiple independent results on the same date. New payslip identities are required. |
| `data/ZapPayrollTaxInstallData.xml` | Install data explicitly identifies itself as demo/testing material; examples use 2015 tax assumptions with some effective dates through 2017. Historical fixtures are not active localization configuration. |
| `mantle/work/TimesheetServices.xml`, `TimeServices.xml`, `ResourceServices.xml` | Weekly approval, locks, timer, CSV import and capacity already exist. Extend these contracts instead of designing a second timesheet system. TimeEntry already has pieceCount and client/vendor piece rates; their presence does not establish complete piecework payroll. |
| Current Accounting sources and design’s implemented-contract addenda | Use native Mantle invoice, payable, payment and payment-run services, not superseded `ironstone.accounting.*` writer proposals. |

Reference code is under `3p_other/` in the workspace’s parent, using the research’s checkout prefixes. Frappe HR checkout `1f9c874` supplies `hrms/payroll/doctype/{salary_component,salary_structure,salary_structure_assignment,payroll_entry,salary_slip}/`: components, dated assignments, employee selection, separate slips and accounting handoff. Its [payroll entry](https://docs.frappe.io/hr/payroll-entry), [salary slip](https://docs.frappe.io/hr/salary-slip) and [payroll settings](https://docs.frappe.io/hr/payroll-settings) documentation corroborate these patterns. This design does not copy its country-specific rules, arithmetic implementation or journal architecture. Odoo community supplies employee/privacy, leave and recruitment patterns through the research; absent Enterprise payroll/appraisal modules are not references. Carbon informs qualifications; Dolibarr informs job/position and expense interactions.

## 2. Screens

Routes below are proposed unless the owner already implements the reused screen. `parity` identifies a baseline capability, not production readiness. Every unqualified service in a form is fully qualified there or in §16.2; **proposed** means a new service or an explicitly named extension, never a claim it exists. Display/list services enforce access before returning data. Tabs listed as forms are included regions of the owning screen; separate navigable records have their own rows.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | People/Home | landing | xml | Show the organization’s people work. | authorized HR summary | own | HR; payroll counters payroll only | new | organization and date filters |
| MyTeam | People/MyTeam | landing | xml | Review the team’s availability and decisions. | authorized reporting relationships | own | manager | new | manager party, team and date filters |
| SelfService | People/SelfService | landing | xml | Provide personal HR actions inside Commons. | own Person and employments | own | self | new | own party and selected employment; no pay values in shell context |
| Employees | People/Employees | list | xml | Find employees and their public work context. | mantle.party.Person | own | directory; HR columns HR only | parity | mantle.party.Person key; organization and authorized filters |
| Employee360 | People/Employees/Employee360 | 360 | xml | Read and maintain one person’s authorized employment context. | mantle.party.Person + mantle.humanres.employment.Employment | own | directory, self, HR, payroll and review scopes | parity | mantle.party.Person + mantle.humanres.employment.Employment key; organization and authorized filters |
| HireEmployee | People/Employees/HireEmployee | wizard | xml | Create or complete a person’s employment. | Person + Employment + proposed EmploymentAssignment | own | HR | parity | Person + Employment + proposed EmploymentAssignment key; organization and authorized filters |
| EmploymentChange | People/Employees/EmploymentChange | wizard | xml | Apply a dated transfer, leave of absence or separation. | Employment + proposed EmploymentAssignment | own | HR; pay change payroll | new | Employment + proposed EmploymentAssignment key; organization and authorized filters |
| OrgStructure | People/Employees/OrgStructure | tree list | xml | Maintain departments and teams. | Organization + PartyRelationship | own | directory; structural edits HR | parity | Organization + PartyRelationship key; organization and authorized filters |
| OrgChart | People/Employees/OrgChart | tree list | qvue | Explore reporting lines. | authorized manager relationships | own | directory; edits HR | new | authorized manager relationships key; organization and authorized filters |
| Grievances | People/Employees/Grievances | list | xml | Find only confidential cases the actor may know about. | mantle.request.Request (proposed HR-confidential type) | own | self submitter; explicit case participants | new | mantle.request.Request (proposed HR-confidential type) key; organization and authorized filters |
| JobClasses | People/Positions/JobClasses | list | xml | Find reusable job profiles. | mantle.humanres.position.EmplPositionClass | own | HR; directory reads | new | mantle.humanres.position.EmplPositionClass key; organization and authorized filters |
| JobClassDetail | People/Positions/JobClassDetail | detail | xml | Define skills and responsibilities for a job. | EmplPositionClass and requirements | own | HR; directory reads | new | EmplPositionClass and requirements key; organization and authorized filters |
| Positions | People/Positions/Positions | list | xml | Plan seats and inspect vacancies. | mantle.humanres.position.EmplPosition | own | HR; manager scoped reads | new | mantle.humanres.position.EmplPosition key; organization and authorized filters |
| PositionDetail | People/Positions/PositionDetail | detail | xml | Approve and fill one position. | EmplPosition + EmplPositionParty | own | HR; assigned approver | new | EmplPosition + EmplPositionParty key; organization and authorized filters |
| PayGrades | People/Positions/PayGrades | list | xml | Maintain dated compensation bands. | mantle.humanres.rate.PayGrade + PayGradeSalary | own | payroll; HR with compensation grant | new | mantle.humanres.rate.PayGrade + PayGradeSalary key; organization and authorized filters |
| Openings | People/Positions/Openings | list | xml | Manage approved recruiting openings. | proposed JobOpening | own | recruiter; assigned hiring manager | new | proposed JobOpening key; organization and authorized filters |
| ApplicantPipeline | People/Positions/ApplicantPipeline | board | xml | Move applications through reviewed stages. | mantle.humanres.employment.EmploymentApplication | own | recruiter; hiring manager scoped | new | mantle.humanres.employment.EmploymentApplication key; organization and authorized filters |
| ApplicantDetail | People/Positions/ApplicantDetail | 360 | xml | Review a candidate without creating an employee. | EmploymentApplication + Person | own | recruiter; assigned reviewers | new | EmploymentApplication + Person key; organization and authorized filters |
| OfferDetail | People/Positions/OfferDetail | detail | xml | Approve and accept employment terms. | proposed EmploymentOffer | own | recruiter; HR; compensation terms by grant | new | proposed EmploymentOffer key; organization and authorized filters |
| Attendance | People/Time/Attendance | list | xml | Review attendance evidence and corrections. | proposed AttendancePunch + AttendanceDay | own | self; manager; HR | new | proposed AttendancePunch + AttendanceDay key; organization and authorized filters |
| ClockingKiosk | People/Time/ClockingKiosk | task | xml | Record attendance on a shared device. | proposed AttendancePunch | own | kiosk device grant; worker proof | new | proposed AttendancePunch key; organization and authorized filters |
| WorkingSchedules | People/Time/WorkingSchedules | list | xml | Find working-week definitions. | proposed WorkingSchedule | own | HR; manager scoped reads | new | proposed WorkingSchedule key; organization and authorized filters |
| WorkingScheduleDetail | People/Time/WorkingScheduleDetail | detail | xml | Maintain intervals and dated assignments. | proposed WorkingSchedule + WorkingScheduleLine | own | HR | new | proposed WorkingSchedule + WorkingScheduleLine key; organization and authorized filters |
| ShiftRoster | People/Time/ShiftRoster | calendar | qvue | Assign basic shifts and resolve coverage conflicts. | proposed ShiftAssignment | own | scheduler via HR; manager scoped; self own | new | proposed ShiftAssignment key; organization and authorized filters |
| HoursForPay | People/Time/HoursForPay | task | xml | Resolve period pay inputs before calculation. | proposed PayrollInput and source reconciliation | own | payroll; time approvers without amounts | new | proposed PayrollInput and source reconciliation key; organization and authorized filters |
| TimeImport | People/Time/TimeImport | wizard | xml | Import clock events, approved quantities or work time. | TimeEntry or proposed AttendancePunch staging | own | HR/timekeeper | parity | TimeEntry or proposed AttendancePunch staging key; organization and authorized filters |
| LeaveRequests | People/Time/LeaveRequests | list | xml | Submit and track time-off requests. | proposed LeaveRequest | own | self; manager; HR | new | proposed LeaveRequest key; organization and authorized filters |
| LeaveRequestDetail | People/Time/LeaveRequestDetail | detail | xml | Review entitlement and decide a request. | proposed LeaveRequest + LeaveLedgerEntry | own | requester; assigned approver; HR | new | proposed LeaveRequest + LeaveLedgerEntry key; organization and authorized filters |
| LeaveBalances | People/Time/LeaveBalances | report | xml | Explain available and used leave. | proposed LeaveLedgerEntry | own | self; manager aggregates; HR | new | proposed LeaveLedgerEntry key; organization and authorized filters |
| LeaveAllocations | People/Settings/LeaveAllocations | task | xml | Grant and adjust entitlements in controlled batches. | proposed LeaveAllocation + LeaveLedgerEntry | own | HR; assigned approver | new | proposed LeaveAllocation + LeaveLedgerEntry key; organization and authorized filters |
| LeavePolicies | People/Settings/LeavePolicies | list | xml | Find leave policies and their effective periods. | proposed LeaveType + LeavePolicy | own | HR configuration | new | proposed LeaveType + LeavePolicy key; organization and authorized filters |
| LeavePolicyDetail | People/Settings/LeavePolicyDetail | settings | xml | Define entitlement and accrual behavior. | proposed LeavePolicy + accrual lines | own | HR configuration | new | proposed LeavePolicy + accrual lines key; organization and authorized filters |
| HolidayCalendars | People/Settings/HolidayCalendars | settings | xml | Maintain calendars used by schedules and leave. | WorkEffortCategory + WetEvent/WepHoliday | own | HR configuration | new | WorkEffortCategory + WetEvent/WepHoliday key; organization and authorized filters |
| PayComponents | People/Settings/PayComponents | list | xml | Find earning, deduction and contribution definitions. | proposed PayrollComponent | own | payroll configuration | new | proposed PayrollComponent key; organization and authorized filters |
| PayComponentDetail | People/Settings/PayComponentDetail | detail | xml | Define and explain one pay calculation component. | proposed PayrollComponent terms | own | payroll configuration | new | proposed PayrollComponent terms key; organization and authorized filters |
| PayStructures | People/Settings/PayStructures | list | xml | Find reusable pay packages. | proposed PayrollStructure | own | payroll configuration | new | proposed PayrollStructure key; organization and authorized filters |
| PayStructureDetail | People/Settings/PayStructureDetail | detail | xml | Compose a reusable pay calculation. | proposed PayrollStructureComponent | own | payroll configuration | new | proposed PayrollStructureComponent key; organization and authorized filters |
| PayAssignments | People/Payroll/PayAssignments | list | xml | Assign structures and inspect employee payroll readiness. | proposed PayrollAssignment | own | payroll | new | proposed PayrollAssignment key; organization and authorized filters |
| PayGroups | People/Settings/PayGroups | settings | xml | Configure pay calendars and processing policy. | proposed PayrollGroup + TimePeriod | own | payroll configuration | new | proposed PayrollGroup + TimePeriod key; organization and authorized filters |
| PayRuns | People/Payroll/PayRuns | list | xml | Find payroll runs and unresolved work. | proposed PayrollRun | own | payroll; payroll approver | new | proposed PayrollRun key; organization and authorized filters |
| PayRunDetail | People/Payroll/PayRunDetail | wizard | xml | Prepare, calculate, approve and finalize a payroll. | proposed PayrollRun + PayrollRunEmployment | own | payroll; distinct approver | new | proposed PayrollRun + PayrollRunEmployment key; organization and authorized filters |
| Payslips | People/Payroll/Payslips | list | xml | Find current and historical pay statements. | proposed Payslip; legacy EmploymentPayHistory | own | self issued; payroll | new | proposed Payslip; legacy EmploymentPayHistory key; organization and authorized filters |
| PayslipDetail | People/Payroll/PayslipDetail | detail | xml | Explain and print one pay result. | proposed Payslip + PayslipItem | own | self issued; payroll | new | proposed Payslip + PayslipItem key; organization and authorized filters |
| PayAdjustments | People/Payroll/PayAdjustments | list | xml | Approve additional pay, deductions and corrections. | proposed PayrollInput | own | payroll; assigned approver | new | proposed PayrollInput key; organization and authorized filters |
| PayrollExchange | People/Payroll/PayrollExchange | wizard | xml | Reconcile provider or historical payroll data. | proposed PayrollExchangeBatch | own | payroll import/export grant | new | proposed PayrollExchangeBatch key; organization and authorized filters |
| PayrollStatements | People/Payroll/PayrollStatements | report | xml | Prepare supported statutory-period outputs. | localization statement output | own | payroll | later | localization statement output key; organization and authorized filters |
| ExpenseClaims | People/Expenses/ExpenseClaims | list | xml | Capture and track employee expenses. | Invoice + proposed ExpenseClaim | own | self; assigned approver; finance by grant | parity | Invoice + proposed ExpenseClaim key; organization and authorized filters |
| ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail | detail | xml | Submit receipts and review a claim. | Invoice/InvoiceItem + proposed ExpenseClaim | own | claimant; assigned approver; finance | parity | Invoice/InvoiceItem + proposed ExpenseClaim key; organization and authorized filters |
| EmployeeAdvances | People/Expenses/EmployeeAdvances | list | xml | Request and reconcile employee advances. | proposed EmployeeAdvance linked to Payment | own | self; approver; finance | new | proposed EmployeeAdvance linked to Payment key; organization and authorized filters |
| SkillsMatrix | People/Training/SkillsMatrix | report | qvue | Compare people’s capabilities with job requirements. | PartySkill + EmplPositionClassSkill | own | development; manager scope; staffing readers | new | PartySkill + EmplPositionClassSkill key; organization and authorized filters |
| Qualifications | People/Training/Qualifications | list | xml | Verify qualifications and track expiry. | proposed refined PartyQualification | own | self; development; staffing projection | new | proposed refined PartyQualification key; organization and authorized filters |
| Training | People/Training/Training | list | xml | Find training sessions and requirements. | proposed refined TrainingClass; training WetEvent | own | development; self eligible sessions | new | proposed refined TrainingClass; training WetEvent key; organization and authorized filters |
| TrainingDetail | People/Training/TrainingDetail | detail | xml | Enroll, assess and record training completion. | proposed refined PersonTraining + training event | own | development; assigned trainer; self enrollment | new | proposed refined PersonTraining + training event key; organization and authorized filters |
| ReviewCycles | People/Reviews/ReviewCycles | list | xml | Set up review periods and participants. | proposed ReviewCycle + ReviewTemplate | own | review administrator | new | proposed ReviewCycle + ReviewTemplate key; organization and authorized filters |
| Reviews | People/Reviews/Reviews | list | xml | Find assessments waiting for action. | proposed refined PerformanceReview | own | self; assigned reviewer; review administrator | new | proposed refined PerformanceReview key; organization and authorized filters |
| ReviewDetail | People/Reviews/ReviewDetail | detail | xml | Assess performance and agree development actions. | proposed PerformanceReview/items/notes | own | review participants by step | new | proposed PerformanceReview/items/notes key; organization and authorized filters |
| Goals | People/Reviews/Goals | list | xml | Track agreed development and performance objectives. | mantle.work.effort.WorkEffort with proposed goal fields | own | self; manager; review participants | new | mantle.work.effort.WorkEffort with proposed goal fields key; organization and authorized filters |
| Reports | People/Reports | report | xml | Analyze people operations with traceable totals. | authorized People reporting services | own | domain view permissions | new | report name and authorized filters; no private result values in shell context |
| Settings | People/Settings | settings | xml | Configure capabilities and inspect readiness. | effective People policy and readiness | own | People administrator; payroll settings separately | new | effective People policy and readiness key; organization and authorized filters |
| ApprovalPolicies | People/Settings/ApprovalPolicies | settings | xml | Route and explain domain approvals. | proposed PeopleApprovalPolicy + approval decisions | own | People configuration; payroll policies payroll admin | new | proposed PeopleApprovalPolicy + approval decisions key; organization and authorized filters |
| ChecklistTemplates | People/Settings/ChecklistTemplates | settings | xml | Prepare onboarding and offboarding task sets. | WorkEffort task templates | own | HR configuration | new | WorkEffort task templates key; organization and authorized filters |
| Lookups | People/Settings/Lookups | settings | xml | Maintain allowed HR vocabularies. | Enumeration + BenefitType | own | People configuration; tax values localization controlled | new | Enumeration + BenefitType key; organization and authorized filters |
| MyTime | People/Time/MyTime | task | qvue | Enter and submit own weekly work time. | TimeEntry + Timesheet | Projects §8 MyTime | self | parity | current user party; employer/project choices; existing work timer and submit actions |
| Timesheets | People/Time/Timesheets | list | xml | Review weekly submitted time. | Timesheet | Projects §8 Timesheets | time approver; self | parity | employee/team and period; existing TIMESHEET_APPROVE plus approver resolution; no pay amounts |
| TimesheetDetail | People/Time/TimesheetDetail | detail | xml | Approve, return or inspect a weekly timesheet. | Timesheet + TimeEntry | Projects §8 TimesheetDetail | owner; time approver | parity | timesheetId; existing submit/approve/return rules; extend reopen guard to finalized pay-input consumption (PE-09) |
| TimeEntries | People/Time/TimeEntries | list | xml | Inspect work-time entries and source links. | TimeEntry | Projects §8 TimeEntries | timekeeper; self | parity | party/period/employer filters; existing store/delete and CSV-import guards; worker-side payroll consumption prevents duplicate worker invoices (PE-09) |
| Rates | People/Payroll/Rates | list | xml | Maintain dated employment pay rates. | mantle.humanres.rate.RateAmount | Projects §10 Rates | payroll | parity | employment party, position class, work type and effective dates; worker/pay purpose only; client rates require Projects billing grants |
| TeamCalendar | People/Time/TeamCalendar | calendar | qvue | Show authorized absence and shifts. | WorkEffort calendar projections | Commons §7 Calendar | self; manager; HR | parity | team/date range; linked WetTimeOff and shift projections; absence reasons/files omitted; edits return to LeaveRequestDetail or ShiftRoster |
| InterviewsCalendar | People/Positions/InterviewsCalendar | calendar | qvue | Schedule and inspect interviews. | private WetEvent interviews | Commons §7 Calendar and EventDetail | assigned panel; recruiter | parity | application/panel/date filters; private interview participants; scorecard links require assigned reviewer permission |
| Approvals | People/Approvals | list | xml | Clear People decisions in the shared inbox. | NotificationMessage + domain decisions | Commons §4 Notifications; crosscut §3.15 | assigned approver | parity | People leave/attendance/expense/position/offer/pay-change/training/review/payroll topics; recipient; bulk decisions run domain services per record |
| WorkItemDetail | People/Tasks/WorkItemDetail | detail | xml | Complete lifecycle and development tasks. | WorkEffort | Projects §5 WorkItemDetail | task assignee; scoped reader | parity | workEffortId and sanitized lifecycle/goal link; task permission alone cannot open a confidential source |
| RequestDetail | People/Employees/RequestDetail | detail | xml | Handle a confidential grievance. | Request | Projects §6 RequestDetail; crosscut §3.11 | explicit HR-case participants | parity | requestId; proposed HR-confidential type; explicit case ACL, restricted files and notifications; ordinary manager/request-reader grants are insufficient (PE-01) |
| EquipmentDetail | People/Employees/EquipmentDetail | detail | xml | Review assigned equipment and return work. | Asset | crosscut §3.10 EquipmentDetail | equipment custodian; HR scoped | parity | assetId and employee custody; custody/return actions remain Warehouse/Maintenance-owned; no automatic access to asset costs |
| InvoiceDetail | People/Payroll/InvoiceDetail | detail | xml | Inspect payroll obligations and settlement. | Invoice | crosscut §3.16 InvoiceDetail; Accounting BillDetail | payroll-finance | parity | invoiceId from a payroll/claim obligation; payroll-origin restrictions; financial edits/approval remain Accounting-owned |
| Forms | People/Settings/Forms | settings | xml | Configure interview, review and training questionnaires. | DbForm + FormResponse | Commons survey builder; Customer Service FeedbackForms/FeedbackFormDetail reference | HR/recruiting/review configuration | new | People form purpose and organization; respondent/reviewer scope; no public links for private assessments |
| Chatter | People/Chatter | panel | qvue | Discuss an authorized HR record. | canonical authorized host | Commons §15 Chatter; crosscut §3.14 | host reader | parity | host entity/key and privacy class; private child records never inherit broad Party visibility |
| RecordFiles | People/RecordFiles | panel | qvue | Read or attach authorized HR evidence. | canonical authorized host | Commons §9 RecordFiles; crosscut §3.14 | host reader | parity | host entity/key and content purpose; private download/preview/export authorization; public sharing disabled for protected HR purposes |

## 3. Home and self-service

### Home

**Layout:** landing.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Summary | display | Link counts to work queues | organization, as-of date, headcount, joins, exits, out, vacancies, decisions | dashboard, number cards | proposed `mantle.humanres.PeopleServices.get#Home` | Frappe HR workspaces; HumanRes/dashboard |
| DueWork | list, read | Surface exceptions and due work | employee, event, due date, assignee, state | record links | proposed `mantle.humanres.PeopleServices.find#DueWork` | Frappe HR number cards |

**Actions and states:** Hire employee is primary for HR; otherwise open the first authorized queue. Empty setup links to Settings; no inaccessible totals or salary charts.



**Source:** research §1; Frappe HR workspaces

**Needs:** PE-01; PE-02; PE-18.

### MyTeam

**Layout:** landing.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Team | list, read | Show current reports and coverage | person, job, location, schedule, available/out, missing time | list links | proposed `mantle.humanres.PeopleServices.get#Team` | Odoo department counters; Frappe Team Requests |
| Decisions | component | Include assigned approvals | requester, type, dates, due, safe summary | shared Approvals form | Commons approvals provider contract; domain decision services in §16.2 | design-crosscut §3.15 |

**Actions and states:** Open request or review; approval actions recheck assignment and source state. The reporting hierarchy can be expanded only within granted team scope. Leave reasons and private notes do not appear in availability.



**Source:** research §1, §13

**Needs:** PE-01; PE-15; PE-18.

### SelfService

**Layout:** landing.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MySummary | display | Show personal balances and requests | employment, leave available/pending, clock state, next shift, issued payslips | employment selector, number cards | proposed `mantle.humanres.PeopleServices.get#SelfService` | Frappe PWA Home |
| Clock | single | Check in or out | employment, facility, action, optional work context | large action button | proposed `mantle.humanres.AttendanceServices.record#Punch` | Frappe CheckInPanel; Odoo attendance menu |
| MyRequests | list, read | Track personal submissions | kind, dates, state, next approver, safe return reason | record links | proposed `mantle.humanres.PeopleServices.find#MyRequests` | Frappe RequestPanel |

**Actions and states:** Clock action is primary when clocking is enabled; otherwise Request leave. Links open LeaveRequests, ExpenseClaims, Payslips, Employee360 and shared MyTime in self scope. Several employments require a visible choice. No login is created merely to include a worker in payroll.

**Devices:** phone. **Per-app context:** Commons mounts at `Commons/People/SelfService` and contributes Home/Today cards; People mounts this same definition at `People/SelfService`. Both fix the current user’s party and permitted employments. Employee360 self view permits own contact corrections, requests and issued statements; payroll settings remain payroll-controlled.

**Source:** research §1; Frappe employee PWA

**Needs:** PE-01; PE-05; PE-18.

## 4. Employees and organization

Employment is a person-to-legal-employer `PrtEmployee` relationship and its `Employment` extension. A department assignment is not a second legal employer. Departments use Organization and `PrtOrgRollup`, teams use `PrtMember`, reporting uses `PrtManager`, positions use `EmplPosition` and dated `EmplPositionParty`. Retain the existing one-nonoverlapping-employment-per-person/employer rule; multiple seats or rates are assignments within that employment. Other employers and a later rehire can have separate relationships. A proposed dated EmploymentAssignment carries department, primary position, manager, work location and schedule together so a transfer does not overwrite history or split payroll identity. Its period must be inside the employment; one primary assignment at a time. Existing role/relationship projections are maintained by the same service, not separate editable sources.

Hire is one transaction for person selection/creation, employee role, exactly one employment relationship and extension, initial assignment, position occupancy and required policy selections. Optional salary/pay assignment requires payroll permission. Existing orphan employee relationships are offered for explicit completion rather than duplicated. An approved offer can supply inputs, but a recruiter cannot thereby grant payroll or account privileges. Onboarding tasks and account provisioning run after the hire commits with independent outcomes and safe retry; provisioning stays Admin-owned.

Transfers, salary changes and separation use effective dates and reasoned audit entries. End rather than delete historical relationships. A separation closes future assignments, raises final-pay and asset-return work and separately requests account/access action; it never erases posted payroll or assumes another active employment should lose its login. Retroactive changes identify affected payroll/time periods and require correction workflows.

### Employees

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FindEmployees | find | Narrow the directory | name, employer, department, manager, location, active/as-of | server-search choices | none | Odoo employee search |
| EmployeeList | list | Browse permitted work identities | person, title, employer, department, manager, location, work contact, state | list/board by department | proposed `mantle.humanres.PeopleServices.find#Employees` | Party/FindParty OuterSearchForm and PartyListForm; Odoo directory |

**Actions and states:** Hire employee opens HireEmployee for HR. Open Employee360; public readers receive public fields only. Archived employment is an explicit HR filter, not a reason to delete the Person.



**Source:** research §2

**Needs:** PE-01; PE-02.

### Employee360

**Layout:** 360.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Overview | display | Show work identity and reporting | person, employer, job, department, manager, location, work contacts | record header; employment selector | proposed `mantle.humanres.PeopleServices.get#Employee360` | Party/EditParty EditPersonForm; Odoo employee public |
| EmploymentHistory | list, read | Explain dated employment changes | employment, assignment dates, position, reason, state | dated history | proposed `mantle.humanres.PeopleServices.get#EmploymentHistory` | Frappe internal history; Odoo employee versions |
| PersonalInfo | single | Maintain private identity/contact information | personal contacts, emergency contact, identifications, preferred name | purpose-aware contact inputs | proposed `mantle.humanres.PeopleServices.store#PersonalInfo` | Party/EditParty identification/contact forms; Frappe Employee |
| Compensation | list | Review salary, rates, benefits and assignments | employment, effective dates, salary, currency, frequency, grade, benefit, pay structure | salary change dialog; links to Rates and PayAssignments | proposed `mantle.humanres.PayrollSetupServices.get#Compensation`; extended `mantle.humanres.EmploymentServices.create#EmploymentSalary` | Frappe salary assignment; EmploymentSalary baseline |
| TimeAndLeave | display | Summarize own/authorized time and balances | period, approved hours, requests, available balance | links to owner screens | proposed `mantle.humanres.LeaveServices.get#Balances`; `mantle.work.TimesheetServices.get#TimesheetSummary` | Frappe connections; Projects PersonDetail |
| SkillsAndReviews | list, read | Link development records | skills, qualifications, expiries, review dates and states | qualification/review links | proposed `mantle.humanres.DevelopmentServices.get#PersonDevelopment` | Odoo skills; Frappe appraisal |
| FilesAndActivity | component | Show documents and actions within each record’s scope | canonical record, content purpose, action, date | Shared/RecordFiles and Chatter | canonical host providers (PE-01, PE-18) | Party/EditParty content/note forms |

**Actions and states:** Change employment opens EmploymentChange. Payroll may add dated salary; end/replace overlapping salary rows in the extended service rather than silently choosing one. Self edits only permitted personal fields; tax/bank changes use reviewed payroll setup. Sensitive tabs are omitted by the service, not merely hidden. User-account administration is an authorized link to Admin; no groups/password editor is copied here.

**Per-app context:**

| App | Regions | Fixed scope | Actions | Emphasis |
| --- | --- | --- | --- | --- |
| People | All authorized regions | selected person and employment; organization grants | lifecycle, personal, compensation and development by separate permissions | HR work |
| Commons | Overview; own Personal, TimeAndLeave and issued payslip links | public directory or current user | own permitted corrections and requests | personal service |
| Projects | Overview, SkillsAndReviews qualifications only; links to existing PersonDetail | permitted project/resource person | existing allocation/time actions remain in PersonDetail | staffing without compensation disclosure |
| Admin | Overview and account links | authorized party/account | Admin account actions through their owner | identity and access |

Canonical definition is proposed `Shared/Employee360.xml`, owned here and registered in crosscut §3.4. Projects PersonDetail stays the resource workbench, not a second HR record.

**Source:** research §2, §6; baseline Party/EditParty

**Needs:** PE-01; PE-02; PE-08; PE-14; PE-16; PE-18.

### HireEmployee

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | wizard step | Select an existing person or create one | person, legal/preferred name, work contacts, duplicate match | authorized person search | proposed `mantle.humanres.PeopleServices.preview#Hire` | Party/FindParty CreateEmployeeForm; Frappe Employee |
| EmploymentTerms | wizard step | Establish the legal employment and assignment | employer, start, optional end, position, department, manager, location, schedule | dated record choices | proposed `mantle.humanres.PeopleServices.preview#Hire` | Odoo work information; Mantle Employment |
| ConfirmHire | wizard step | Commit reviewed terms and start onboarding | reviewed inputs, reason, checklist, optional account request | summary and confirm | proposed `mantle.humanres.PeopleServices.hire#Employee` | Frappe onboarding |

**Actions and states:** Preview lists duplicates, existing relationships and position conflicts; confirmation creates once using an operation key. Missing payroll setup creates a visible payroll-readiness exception, not an invented salary/country/currency. A failed account/task action does not undo a valid employment.



**Source:** research §2, §6, §17

**Needs:** PE-01; PE-02; PE-03; PE-15.

### EmploymentChange

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Change | wizard step | Choose event and new terms | employment, event, effective date, position/department, manager, reason, end date | conditional fields | proposed `mantle.humanres.PeopleServices.preview#EmploymentChange` | Frappe promotion, transfer and separation |
| ImpactAndConfirm | wizard step | Review dependencies and commit approved change | occupied seat, schedule, pay impact, leave, outstanding advances, tasks | impact list and confirmation | proposed `mantle.humanres.PeopleServices.apply#EmploymentChange` | Odoo departure; Frappe full and final settlement |

**Actions and states:** Submit required approval before apply; source changes invalidate approval. Overlapping primary assignments and occupied single-holder seats fail. Separation creates final settlement work; it does not mark pay paid, cancel pending claims or disable an account unconditionally.



**Source:** research §6

**Needs:** PE-02; PE-03; PE-15.

### OrgStructure

**Layout:** tree list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationTree | list | Browse organization rollups | organization, parent, type, head, active dates, headcount | XML view-tree | proposed `mantle.humanres.OrganizationServices.find#Units` | Party/PartyRelated relationship forms; Carbon departments |
| EditUnit | dialog | Create or reparent a dated unit | organization, name, parent, effective date, head, reason | parent search | proposed `mantle.humanres.OrganizationServices.store#Unit` | OpenProject departments; Frappe Department |

**Actions and states:** Reparent requires confirmation and rejects cycles, cross-legal-employer moves and stale dates. A department closure requires reassignment of affected employees and approvals; counts show as-of dates. Teams use membership without changing employment.



**Source:** research §3

**Needs:** PE-01; PE-03.

### OrgChart

**Layout:** tree list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportingTree | component | Navigate the reporting hierarchy | person, title, manager, department, work contact | expandable chart; TUI outline | proposed `mantle.humanres.OrganizationServices.get#ReportingTree` | Odoo hierarchy; Frappe org chart |
| ChangeManager | dialog | Make a dated reporting change | person, manager, effective date, reason | person search | proposed `mantle.humanres.OrganizationServices.change#Manager` | Odoo employee work information |

**Actions and states:** Open Employee360 or load one level of reports. Reject self/cyclic reporting and expose unassigned people rather than losing them. TUI offers the same navigation and change form; no drag-only operation.



**Source:** research §3

**Needs:** PE-01; PE-03; PE-20.

### Grievances

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Cases | list | List authorized grievances | safe reference, subject, state, assigned handler, submitted date | restricted record links | proposed extension `mantle.request.RequestServices.find#PeopleCases` | Frappe Employee Grievance; Projects requests |
| SubmitCase | dialog | File a confidential case | subject, description, incident date, requested contact, private attachments | restricted upload | proposed extension `mantle.request.RequestServices.create#PeopleCase` | Frappe grievance |

**Actions and states:** Submit records the requester and designated confidential intake handlers. A line manager, general HR group, case watcher or linked-task assignee gains no access automatically. RequestDetail is reused only with PE-01’s explicit participant/handler check on reads, search, files, messages and notifications.



**Source:** research §6, §18

**Needs:** PE-01; PE-15; PE-18.

## 5. Positions and recruiting

A job class describes work; a position is a dated seat in the employer/department; vacancy derives from current holders rather than a separate “filled” status. Retain active `EmpsPlanned`, `EmpsActive`, `EmpsInactive`. A requisition is approval to activate/open/backfill a position, recorded as an approval decision; do not enable the obsolete JobRequisition sketch or its age/gender criteria. A proposed JobOpening records publication text, recruiting owner and opening/closing dates, linked to one or more approved positions; this is distinct from the internal seat. Public publishing is later PASS work.

Applicants remain Person parties with a proposed Applicant role, separate from employee roles and user accounts. Existing EmploymentApplication gets the opening link and a seeded flow: Received → Screening → Interview → Offer → Hired, with Refused/Withdrawn terminal alternatives; these labels and status IDs are proposed. Interviews are private WetEvent records linked to the application and assigned panel. Offer is a separately identified decision/document with employment terms, approvals, expiry and acceptance; accepted is not hired. Hire consumes it exactly once. Reviewer scorecards use the shared form engine with explicit reviewer access and release timing, not public survey links.

### JobClasses

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Classes | list | List job profiles and requirements | title, description, skill count, responsibilities, active state | search | proposed extension `mantle.humanres.PositionServices.find#JobClasses` | Dolibarr job profiles |
| NewClass | dialog | Start a job profile | title, description | text | proposed extension `mantle.humanres.PositionServices.store#JobClass` | Dolibarr job profile |

**Actions and states:** Create opens JobClassDetail. End a used class rather than deleting staffing evidence.



**Source:** research §4

**Needs:** PE-03.

### JobClassDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| JobProfile | single | Maintain job description | title, description, work types, classifications | shared choices | proposed extension `mantle.humanres.PositionServices.store#JobClass` | Dolibarr job profile; WeCreate position classes |
| Requirements | list, editable rows | Maintain expected capabilities | skill, minimum level, qualification type, required/desired, responsibility, effective dates | skill lookup | proposed extension `mantle.humanres.PositionServices.store#JobRequirement` | EmplPositionClassSkill; Carbon abilities |

**Actions and states:** Save dated requirements; existing assignments retain historical evaluation evidence. Links open positions and skills gaps, with no pay bands for readers lacking pay access.



**Source:** research §4, §11

**Needs:** PE-03; PE-14.

### Positions

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PositionList | list | Compare planned and active seats | employer, department, class, grade, dates, state, holder | list/board by status | proposed extension `mantle.humanres.PositionServices.find#Positions` | Frappe staffing plan; Dolibarr positions |
| NewPosition | dialog | Create a planned seat | employer, department, class, grade, dates, budget reference | authorized choices | proposed extension `mantle.humanres.PositionServices.store#Position` | Mantle EmplPosition; Frappe staffing plan |

**Actions and states:** New starts Planned; vacant/filled is computed from holders at the chosen date. Cost estimates require compensation access.



**Source:** research §4

**Needs:** PE-03; PE-15.

### PositionDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PositionTerms | single | Maintain seat requirements | employer, department, job class, grade, dates, hours/week, employment flags, budget | lookup and date period | proposed extension `mantle.humanres.PositionServices.store#Position` | Mantle EmplPosition; Frappe staffing plan |
| Holders | list, read | Show dated occupancy | person, role, from, through, employment | Employee360 link | proposed extension `mantle.humanres.PositionServices.get#Position` | EmplPositionParty |
| Requisition | dialog | Request activation or backfill | position, effective date, justification, budget, approver | approval summary | proposed extension `mantle.humanres.PositionServices.request#PositionApproval` | Frappe Employee Requisition |

**Actions and states:** Request approval → activate → create opening or assign through Hire/EmploymentChange. Ending a position checks future occupancy. Single-holder seats reject overlap; pooled seasonal requirements are multiple seats or a later workforce extension, not an undocumented holder-count interpretation.



**Source:** research §4, §5

**Needs:** PE-03; PE-04; PE-15.

### PayGrades

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Grades | list | Read grade bands | grade, dates, currency, frequency, minimum, reference, maximum | amounts by currency | proposed `mantle.humanres.PayrollSetupServices.find#PayGrades` | Frappe Employee Grade; Mantle PayGradeSalary |
| GradeBand | dialog | Set a dated band | grade, title, dates, currency, frequency, minimum, reference, maximum | date period | proposed `mantle.humanres.PayrollSetupServices.store#PayGrade` | Mantle PayGrade/PayGradeSalary |

**Actions and states:** Check min ≤ reference ≤ max; require currency/frequency. Changing a band does not rewrite employment salaries.



**Source:** research §4, §9

**Needs:** PE-03; PE-08.

### Openings

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Openings | list | Show recruiting workload | title, employer, positions, owner, open/close, applicants, state | list/board by state | proposed `mantle.humanres.RecruitingServices.find#Openings` | Odoo job kanban; Frappe Job Opening |
| Opening | dialog | Maintain opening text and intake | positions, title, description, owner, dates, internal visibility, intake mailbox | rich text; position lookup | proposed `mantle.humanres.RecruitingServices.store#Opening` | Odoo recruitment job; Frappe Job Opening |

**Actions and states:** Open only approved active seats; close stops intake but preserves applications. Email intake is an explicit Comms mailbox binding with attachment checks and duplicate review. No public URL is implied before PASS careers exists.



**Source:** research §5

**Needs:** PE-04; PE-18.

### ApplicantPipeline

**Layout:** board.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Applications | list | Compare applications | applicant, opening, stage, owner, applied date, next interview | XML view-board by status; list twin | proposed `mantle.humanres.RecruitingServices.find#Applications` | Odoo applicant pipeline |
| AddApplication | dialog | Record a candidate/application | person or identity, opening, source, resume, contact permission | duplicate search, private upload | proposed `mantle.humanres.RecruitingServices.create#Application` | Frappe Job Applicant |
| StageChange | list, bulk | Apply allowed stage changes | selection, target stage, reason | row selection | proposed `mantle.humanres.RecruitingServices.change#ApplicationStage` | Odoo recruitment stages |

**Actions and states:** Drag invokes the same guarded transition as the list. Interview, offer and hire transitions require their records; Hired cannot be set by dragging. Each bulk failure names the application.



**Source:** research §5

**Needs:** PE-01; PE-04; PE-15.

### ApplicantDetail

**Layout:** 360.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Application | single | Maintain candidature | person, opening, source, owner, stage, resume | record header; file preview | proposed `mantle.humanres.RecruitingServices.get#Application`; proposed `mantle.humanres.RecruitingServices.store#Application` | Odoo applicant; Frappe Job Applicant |
| Interview | dialog | Arrange a private interview | application, dates, panel, location/call, scorecard template | calendar availability | proposed `mantle.humanres.RecruitingServices.schedule#Interview` | Frappe Interview; Gauzy panel |
| Scorecards | list | Capture assigned evaluations | interview, reviewer, criteria, rating, evidence, recommendation | shared form response | proposed `mantle.humanres.RecruitingServices.submit#Scorecard` | Frappe Interview Feedback; Odoo surveys |

**Actions and states:** Schedule interview is primary before an offer; Create offer when assessment permits. Resume files and feedback remain application-scoped. Rejected candidates keep retention-controlled records without gaining employee roles.



**Source:** research §5

**Needs:** PE-01; PE-04; PE-18.

### OfferDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Offer | single | Prepare dated terms | applicant, position, employer, start/end, schedule, proposed pay, currency, expiry | controlled document template | proposed `mantle.humanres.RecruitingServices.store#Offer` | Frappe Job Offer |
| OfferDecision | dialog | Submit, approve, issue or record response | offer, action, reason, approver, accepted date, evidence | confirm; restricted file | proposed `mantle.humanres.RecruitingServices.change#OfferState` | Frappe Job Offer workflow |

**Actions and states:** Draft → submitted → approved → issued → accepted/refused/expired are proposed states. Changed terms invalidate approval; store the issued PDF. An accepted offer links to HireEmployee for HR to commit employment once.



**Source:** research §5, §6

**Needs:** PE-02; PE-04; PE-15; PE-17.

## 6. Time and attendance

Attendance is evidence of presence, distinct from work allocation and payable time. Add AttendancePunch and approved AttendanceDay/correction records; do not reuse Projects’ single work timer as a second attendance clock. Preserve imported raw events with source/device identity, worker, local-zone timestamp and direction. Reject duplicate external IDs; flag missing, reversed and overlapping punches for review. Kiosk credentials identify a worker for a narrow action and never grant their session access to payslips or directory searches. Geolocation is off by default and is not required to record time.

WorkingSchedule and dated assignments define local working intervals, breaks, timezone and holiday category; ShiftAssignment supplies explicit dated overrides. Approved leave reduces availability, while attendance does not rewrite the planned schedule. Extend `mantle.work.ResourceServices.get#PartyCapacity` and `mantle.work.TimesheetServices.get#WeekDays` to use People schedules first, retaining the existing WetAvailable/default-week fallback for people with no People assignment. Count an approved leave request once even if it has a WetTimeOff calendar projection. Cross-midnight/DST shifts use actual instants for elapsed time and the configured schedule zone for day/workweek attribution.

HoursForPay reconciles all evidence but each pay-group assignment declares a time basis: approved timesheets or approved attendance. The other stream is comparison evidence, not additional paid hours. Approved paid leave supplies distinct inputs; salary proration follows explicit policy. Work quantities can add piece/production inputs independently of time, with source identity and unit. Customer billing and employee pay are separate dimensions: preserve `TimeEntry.invoiceId` and worker-side `vendorInvoiceId`, and prevent a worker invoice and payroll both compensating the same worker-side source. A finalized pay-input link also prevents reopening its source timesheet for destructive edits; a correction supplies a linked delta.

Current Projects TimeEntries permits money managers to edit rates/billable flags on submitted weeks and returns worker rates to those users. PE-01/PE-09 must therefore extend the shared time/rate readers and writers, including the BOSS presentation services: project financial authority alone cannot reveal or change employment compensation. Preserve authorized project estimates/client billing; require the appropriate employment-pay permission for actual worker pay, invalidate unfinalized payroll approvals when an authorized source rate changes, and refuse changes to consumed finalized pay sources. A People screen filter alone cannot close this existing route.

### Attendance

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AttendanceDays | list | Find missing or inconsistent punches | person, day, shift, first/last punch, breaks, approved hours, flags | list/calendar | proposed `mantle.humanres.AttendanceServices.find#Attendance` | Odoo attendance list; Frappe Attendance |
| CorrectAttendance | dialog | Propose a reasoned correction | person, employment, date, original punches, corrected intervals, reason | interval editor | proposed `mantle.humanres.AttendanceServices.request#Correction` | Frappe Attendance Request |
| AttendanceDecision | list, bulk | Review explicit corrections | selected requests, action, reason | shared approval actions | proposed `mantle.humanres.AttendanceServices.decide#Correction` | Frappe team requests |

**Actions and states:** Submit correction preserves raw punches; an assigned non-self approver produces approved attendance. Invalid days stay excluded from payable inputs until resolved. Phone lists retain employee and exception text.



**Source:** research §7

**Needs:** PE-01; PE-05; PE-15.

### ClockingKiosk

**Layout:** task.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| IdentifyAndClock | single | Identify worker and record one action | device, badge/token, PIN when configured, action, facility, observed time | scan input; large confirmation | proposed `mantle.humanres.AttendanceServices.record#KioskPunch` | Odoo kiosk; Carbon timecard toggle |

**Actions and states:** Show only the identified worker’s name and action confirmation, then clear the screen. Rate-limit proof attempts; revoke devices centrally. Online recording only in the first release; a network failure says not recorded and retries with the same event key. No biometric matching or offline sync is assumed.

**Devices:** shared tablet/phone; TUI uses credential/scan entry without a directory picker.

**Source:** research §7

**Needs:** PE-01; PE-05.

### WorkingSchedules

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Schedules | list | List schedules and usage | name, employer, timezone, weekly hours, holiday calendar, effective dates | search | proposed `mantle.humanres.ScheduleServices.find#Schedules` | Odoo working schedules |
| NewSchedule | dialog | Start a dated schedule | name, employer, timezone, start date, holiday category | timezone/calendar choices | proposed `mantle.humanres.ScheduleServices.store#Schedule` | Odoo resource calendar |

**Actions and states:** Open WorkingScheduleDetail; duplicate creates a new schedule identity. No hard-coded five-day week or US holidays.



**Source:** research §7

**Needs:** PE-06.

### WorkingScheduleDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Week | list, editable rows | Define weekly intervals | weekday, start/end local time, break, effective dates | interval inputs | proposed `mantle.humanres.ScheduleServices.store#ScheduleLine` | Odoo resource attendance lines |
| Assignments | list | Assign schedules by employment | employment, from/through, schedule, holiday override | employee search | proposed `mantle.humanres.ScheduleServices.assign#Schedule` | Frappe shift assignment |
| CapacityPreview | display | Explain a sample interval | person, range, base hours, holidays, leave, available hours | day table | extended `mantle.work.ResourceServices.get#PartyCapacity` | Projects PersonDetail capacity |

**Actions and states:** Validate nonoverlapping intervals and assignment dates; preview the impact on leave and future shifts before publishing dated changes. No historical pay is recomputed automatically.



**Source:** research §7; Projects §15

**Needs:** PE-06; PE-07.

### ShiftRoster

**Layout:** calendar.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Roster | component | Display people against dates | person, employment, date, shift, facility, availability, exception | virtualized roster grid; TUI list | proposed `mantle.humanres.ScheduleServices.get#Roster` | Frappe roster |
| AssignShift | dialog | Set or move one dated shift | employment, local start/end, timezone, facility, schedule, reason | date/time fields | proposed `mantle.humanres.ScheduleServices.store#Shift` | Frappe Shift Assignment |

**Actions and states:** Drag and dialog call the same service; reject overlaps, ended employments and approved leave conflicts. Publishing notifies affected workers and updates capacity. Optimization, swaps and offline rosters are later.



**Source:** research §7

**Needs:** PE-06; PE-18; PE-20.

### HoursForPay

**Layout:** task.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Reconciliation | list | Compare scheduled, present, submitted and payable time | employment, period, basis, hours by kind, quantities, duplicates, exceptions | links to source time/leave | proposed `mantle.humanres.PayrollInputServices.get#Reconciliation` | Frappe payroll attendance validation; Odoo work entries |
| PrepareInputs | single | Build approved pay inputs | pay group, period, source cutoff, selected employments | preview and confirm | proposed `mantle.humanres.PayrollInputServices.prepare#Inputs` | Frappe timesheet salary slips |
| ResolveInput | dialog | Resolve a discrepancy or approved adjustment | source key, decision, quantity/amount, unit, reason, evidence | source comparison | proposed `mantle.humanres.PayrollInputServices.store#Adjustment` | Frappe Additional Salary |

**Actions and states:** Preparation is idempotent per source entitlement; preview never posts. Unapproved timesheets, unresolved attendance, ambiguous employment and conflicting reimbursement reservations block affected inputs. An adjustment needs approval and does not edit the underlying time.



**Source:** research §7, §9

**Needs:** PE-05; PE-07; PE-09; PE-10.

### TimeImport

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FileAndMapping | wizard step | Identify the import format and employer | file, kind, employer, timezone, identifier mapping, source system | upload; mapping preview | proposed `mantle.humanres.AttendanceServices.preview#Import` | Mantle TimeSummary/TimeDetail imports; Frappe check-in |
| ImportResults | list | Commit valid rows and explain failures | row, source key, worker, action, result, error | download error rows | proposed `mantle.humanres.AttendanceServices.import#Records`; existing `mantle.work.TimeServices.import#TimeEntryCsv` for project-time format | Projects ImportTime |

**Actions and states:** Do not send raw punches into the Projects CSV importer. Resolve employment and units; preview exposes duplicates and invalid periods. Each independent row commits separately, and retries skip known source keys. Import does not approve timesheets or attendance. Legacy TimeSummary/TimeDetail formats require an explicit adapter to this staging path.



**Source:** research §7, §17

**Needs:** PE-05; PE-09; PE-19.

## 7. Leave

A proposed LeaveRequest has its own ID and interval/segment lines, avoiding EmploymentLeave’s employment/start-day key. One person may make distinct morning and afternoon requests on the same date. LeaveType defines unit, paid/unpaid meaning and required evidence; dated LeavePolicy and assignments define allocation, accrual, carry-over, expiry, negative-balance limit and approval steps. LeaveLedgerEntry records grants, accruals, consumption, expiry, adjustment and reversal, each with source identity; posted entries are append-only. Pending requests reserve displayed availability separately from approved consumption.

Requested → approved/refused → cancellation-requested → cancelled is the proposed request flow; withdrawal is available before approval. Under lock, approval recomputes schedule-derived duration, checks overlaps and available balance including other reservations, then posts the consumption once. Cancellation reverses the original consumption; it does not delete ledger entries. Accrual jobs use a unique employment/policy/accrual-period key, isolate failures and retain progress. Effective-date policy changes preserve historical ledger meaning.

Approved leave publishes a minimal WetTimeOff projection linked to the request and creates distinct paid/unpaid payroll inputs. Shared calendars expose absence and dates without diagnosis or evidence; attachments remain request-scoped. If payroll has already finalized the leave, cancellation/reclassification creates a next-run correction, not a source rewrite. Legacy EmploymentLeave remains readable; migration creates explicit requests/ledger openings only after reconciliation and never double-counts legacy rows and new projections.

### LeaveRequests

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Requests | list | Find own or assigned leave | person, type, interval, charged hours/days, state, approver | list/calendar; mobile columns | proposed `mantle.humanres.LeaveServices.find#Requests` | Frappe leave applications; Odoo time off |
| RequestLeave | dialog | Preview and submit time off | employment, type, segments, reason, supporting file | duration/balance preview | proposed `mantle.humanres.LeaveServices.preview#Request`; proposed `mantle.humanres.LeaveServices.submit#Request` | Frappe PWA Leave Form; Odoo hours/half-day request |

**Actions and states:** Request leave is primary; preview shows duration, holidays, reserved balance and expected remainder. No allocation or approver means a clear block, not zero-cost leave or automatic approval.

**Devices:** phone; SelfService fixes the current party.

**Source:** research §8

**Needs:** PE-07; PE-15.

### LeaveRequestDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RequestAndBalance | display | Explain charged duration | segments, schedule, holidays, ledger balance, pending reservations, approval steps | day breakdown | proposed `mantle.humanres.LeaveServices.get#Request` | Odoo leave stats; Frappe leave ledger |
| Decision | dialog | Approve, refuse, withdraw or cancel | request, action, reason, expected change stamp | confirmation | proposed `mantle.humanres.LeaveServices.decide#Request` | Frappe leave workflow |

**Actions and states:** Approve only with current authority and balance. Cancellation after payroll finalization reports the linked correction required. A denial is not disclosed on the team calendar.



**Source:** research §8, §13

**Needs:** PE-07; PE-09; PE-15.

### LeaveBalances

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BalanceFind | find | Select an entitlement view | employment/team, type, as-of date | authorized choices | none | Frappe leave balance report |
| BalancesAndLedger | list, read | Reconcile balance movements | opening, grant, accrual, consumed, expired, adjustments, pending, available | drill-down by source | proposed `mantle.humanres.LeaveServices.get#Balances`; proposed `mantle.humanres.LeaveServices.find#Ledger` | Frappe leave ledger; Dolibarr modification log |

**Actions and states:** Export only authorized rows; clicking a movement opens its request/allocation. Historical balances use movement effective dates and retain reversal evidence.



**Source:** research §8, §14

**Needs:** PE-01; PE-07; PE-17.

### LeaveAllocations

**Layout:** task.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AllocationPreview | single | Select eligible employees and policy | employer, department, policy, entitlement period, amount, expiry, reason | preview counts | proposed `mantle.humanres.LeaveServices.preview#Allocation` | Frappe Leave Control Panel |
| AllocationResults | list | Approve grants and inspect row outcomes | employment, amount, prior balance, source key, approval, result | row selection | proposed `mantle.humanres.LeaveServices.allocate#Leave` | Frappe Leave Allocation |

**Actions and states:** Bulk confirm names the count and total by unit. Duplicate period/policy grants are refused unless explicitly reasoned adjustment entries. Never overwrite a balance; reversal and adjustment remain auditable.



**Source:** research §8

**Needs:** PE-07; PE-15.

### LeavePolicies

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Policies | list | List policies and assignments | name, employer, type, unit, dates, approval rule, active count | list | proposed `mantle.humanres.LeaveServices.find#Policies` | Frappe Leave Policy; Odoo time types |
| NewPolicy | dialog | Start a dated policy | name, employer, leave type, unit, from date | lookup | proposed `mantle.humanres.LeaveServices.store#Policy` | Frappe Leave Policy |

**Actions and states:** Open LeavePolicyDetail. Closing a policy stops new assignments without discarding accrued entitlement.



**Source:** research §8, §15

**Needs:** PE-07.

### LeavePolicyDetail

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PolicyTerms | single | Define leave rules | unit, paid flag/component, allocation requirement, negative cap, approval rule, evidence, dates | conditional inputs | proposed `mantle.humanres.LeaveServices.store#Policy` | Odoo time types; Frappe Leave Type |
| AccrualAndCarry | list, editable rows | Configure dated accrual steps | service interval, frequency, amount, cap, carry limit, expiry, rounding | schedule preview | proposed `mantle.humanres.LeaveServices.store#AccrualRule` | Odoo accrual levels; Frappe earned leave |
| AssignPolicy | dialog | Assign a policy to employments | employment/selection, policy, from/through, opening reference | preview affected people | proposed `mantle.humanres.LeaveServices.assign#Policy` | Frappe Policy Assignment |

**Actions and states:** Validate against explicit examples before publish; overlaps and incompatible units fail. An assignment change does not recalculate already-posted accruals.



**Source:** research §8

**Needs:** PE-07; PE-15.

### HolidayCalendars

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Holidays | list | Review dated non-working days | category, date/interval, name, organization, timezone | calendar/list | proposed `mantle.humanres.ScheduleServices.get#Holidays` | ERPNext Holiday List; Mantle HolidayUsaData |
| Holiday | dialog | Add or change a holiday | category, name, dates, local zone, applicable organization | event date inputs | proposed `mantle.humanres.ScheduleServices.store#Holiday` | Commons Calendar; Frappe holiday assignment |

**Actions and states:** Use WepHoliday event categories and Commons event services internally. Seed US categories are examples, not automatic employer assignments. A retrospective edit reports affected leave/pay calculations and uses corrections.



**Source:** research §7, §8

**Needs:** PE-06; PE-07; PE-18.

## 8. Payroll and compensation

### 8.1 Core model and calculation contract

The core is native Mantle business logic, not a BOSS-only schema or a replacement accounting engine. Frappe’s component → structure → dated assignment → run → payslip pattern is the primary reference. Keep Mantle’s employment, salary, RateAmount, BenefitType/EmploymentBenefit, TimePeriod, TaxAuthority, invoice and payment foundations where their semantics fit. A component is not a renamed PayrollAdjustment with all historical US fields exposed.

| Proposed record family (`mantle.humanres.payroll`) | Identity and purpose |
| --- | --- |
| PayrollComponent and dated component terms/account mappings | Stable component ID; dated earning, deduction, employer-contribution or statistical definition, amount/quantity/formula, dependencies, payslip visibility and accounting treatment. Currency and unit are explicit. Statistical values never enter gross/net or GL merely because they are visible. |
| PayrollStructure, dated PayrollStructureComponent | Reusable component composition, eligibility and pay basis; component dependencies determine calculation order. Published effective intervals cannot overlap. |
| PayrollAssignment | Employment, structure, pay group, effective interval and declared variable inputs. EmploymentSalary remains salary truth; RateAmount remains hourly/piece-rate truth. An assignment references these rather than maintaining another base-salary history. One applicable primary payroll assignment per employment and date across all groups; extra earning sources are components/inputs, not a second primary assignment. |
| PayrollGroup | Employer, currency, pay-frequency/TimePeriod configuration, schedule/workweek, time-source basis, rounding/proration policy, localization bindings and approval rule. A run is one employer and currency. Different currencies are separate runs; conversion occurs only at Accounting’s established boundary. |
| PayrollInput and PayrollInputSource | Identified, approved earning/deduction/reimbursement input or source entitlement: employment, date/period, component, quantity/unit or amount/currency, source record/line, dimensions and approval. A correction links to the original input/result. Unique source-consumption keys prevent ordinary inputs being paid twice. Salary/recurring entitlements also track consumed service intervals per employment/component across groups and runs; a frequency change splits at its effective date instead of regenerating overlapping salary. |
| PayrollRun and PayrollRunEmployment | Run ID and employee-unit ID, period and pay date, kind (regular/off-cycle/correction), population, preparation cutoff, approval and independent outcome/progress. A period can have several runs. |
| Payslip and PayslipItem | Payslip ID, employment, run, pay date and period; calculated quantities, rates, amounts, gross/net, employer costs, component explanations and dated source/rule references. These are pay facts with their own identities, not parallel snapshots of Employment. Finalized slips are immutable; corrections/reversals are new linked facts. |
| PayrollObligation | Unique run/payslip or aggregate-payee bucket → invoice/line link, with employer, currency, dimensions and posting/settlement state. Provides reconciliation and retry identity, not another payable balance. |
| PayrollTaxProfile, PayrollAccumulator and localization bindings | Dated jurisdiction-specific employee/employer elections and declared accumulation bases; accumulators derive from finalized pay facts plus reconciled opening entries. Do not put US filing-status columns into the neutral core. |

**Calculation sequence:** resolve dated employment and pay assignments → collect approved inputs → split at relevant rate/salary/policy changes → calculate earnings → calculate configured pre-tax deductions and statutory bases → call applicable localization calculations → calculate post-tax deductions and reimbursements → round and reconcile → produce result explanations. Dependencies are explicit, including any statutory ordering; an unsatisfied or cyclic dependency blocks the affected result. Bonuses, piece quantities and premiums are typed inputs/components, not fields assumed to implement every agricultural rule. Jurisdiction-specific regular-rate, minimum-wage, overtime, garnishment and termination-pay rules belong to validated localization services.

The formula editor is a constrained decimal expression language with named inputs/components, comparisons, conditions and an allowlist of decimal functions. It has no ExecutionContext, entity access, I/O, arbitrary service names or general script evaluation. A published formula declares inputs, dependencies, units and rounding; preview includes worked examples and missing-input errors. Trusted localization implementations are deployed code registered by Admin, not code supplied in payroll forms. Complex legal logic should use that service interface rather than ever-larger user formulas.

Use BigDecimal throughout. Preserve calculation precision, apply the configured component/localization rounding stages, then currency-round the payable and explain any balancing adjustment. Defaults come from organization configuration; there is no implicit USD, calendar year, five-day week or fixed 30-day salary divisor. Salary proration uses the pay-group’s explicit calendar-day, working-day or hour basis with displayed numerator/denominator; absence of a required policy blocks calculation. Mid-period changes split inputs using effective intervals. Negative net pay is an exception requiring a supported recovery/adjustment process; do not silently make a negative bank instruction.

Accumulators identify employer, worker/tax identity, jurisdiction, base, currency and statutory period. Off-cycle runs consume the same finalized totals as regular runs; drafts do not contribute. Concurrent finalizations affecting the same accumulator serialize and revalidate before commit. Opening balances identify provenance and cutover date and must reconcile with any imported historical slips, so imported history and an opening entry cannot both contribute the same amounts. An employee’s rehire does not automatically reset employer/year accumulations.

### 8.2 Run lifecycle, failure and corrections

Proposed run states are Draft → Preparing → Calculating → Review → Approved → Finalizing → Finalized, with Failed/retryable worker outcomes, Cancelled before finalization, and Corrections linked after finalization. Worker states distinguish pending, calculated, error, explicitly excluded and finalized. Payment state is a separate projection from Accounting; Finalized does not mean Paid.

1. **Select:** record employer, group, period, pay date and kind; populate eligible employments with explicit exclusions. Require a reason to exclude an otherwise selected worker; exclusions and their totals remain in the approval view.
2. **Prepare:** reconcile time, leave, quantities, salary, benefits and claims. Lock/reserve source entitlements against competing payroll or worker-invoice processing; changes invalidate prepared inputs. Source cutoff is a time, not a second copy of every source record.
3. **Calculate:** commit each employment’s result independently in bounded jobs. One error logs its employment/input and persists its reason code, while other workers continue. An interrupted job resumes only pending/failed units; an operation key returns existing results instead of duplicating them.
4. **Review:** show earnings/deductions/net/employer cost, variance from prior comparable pay, missing setup, source conflicts, currency and payee reconciliation. Editing population, pay date, inputs or policy applicability invalidates calculation/approval as appropriate. No invoice or payment is created by preview/calculation.
5. **Approve:** a separate authorized person approves the exact population, amounts, source and effective-rule revisions, excluded workers and warnings. Errors must be resolved or workers explicitly excluded. A partial calculation is never silently presented as a complete payroll.
6. **Finalize:** recheck source revisions, approvals, accumulator state, organization/currency and account mappings under locks. Persist final pay facts and uniquely linked draft obligations, with per-unit retry state; finish aggregate tax/other-payee buckets only from finalized units. Incomplete finalization is visibly pending and does not release any draft obligation to Accounting approval/payment. Mark the run finalized only after every included worker and aggregate bucket reconciles. A retry finds existing obligation links and continues, without recalculating finalized workers.
7. **Settle:** Accounting reviews/codes, posts, authorizes and pays the finalized obligations through existing services. People displays posting failures, unapplied/partial payments, bank returns and settlement references without inventing a second payment status.

Cancel a draft run by releasing only unconsumed reservations and recording the reason. After any unit has finalized, finish/recover or use linked correction/reversal work; do not use legacy reopen to delete history. A correction identifies the original payslip/items, changed source or rule, reason and incremental amounts. It has its own run/slip identity even if period and pay date equal the original. An approved reversal creates offsetting pay facts and appropriate Accounting credits/reversals in an allowed period. Paid money remains paid until Accounting records recovery or refund; recalculation does not erase bank settlement. Issued original payslips remain retrievable beside their corrections.

The design supports bounded database queries, progress counts, job cancellation between units, controlled concurrency and resumable processing. Approximately 10,000 workers describes the unavailable commercial deployment; it is not a performance result or required load-test fixture for this implementation.

### 8.3 Accounting and confidentiality

The handoff keeps `InvoicePayroll`, `InvoicePayrollOther`, `InvoiceTax` and `InvoiceGarnishment` where applicable. Employee invoices represent net payable, retaining explainable earning/deduction lines and source links. Third-party obligations are generated only for configured payees. Per-component mappings must reconcile gross expense, employee deductions, employer contribution expense, net payable and third-party liabilities: withheld sums use clearing/liability accounts so paying a tax invoice does not expense the same wages twice. Statistical components post nothing. Reimbursements and advances follow §9’s single-settlement rule. Carry known project, work effort, facility and cost-centre dimensions; no new percentage distribution engine is introduced.

Proposed `mantle.humanres.PayrollRunServices.finalize#Run` creates uniquely linked draft invoices through Mantle services; it does not directly create GL entries, auto-approve payables or execute bank transfers. Accounting’s `mantle.account.InvoiceServices.approve#Payable`, `change#InvoiceState`, and `mantle.account.PaymentRunServices` own approval/payment processing. Extend their source checks to require completed payroll finalization, current holds and appropriate payroll-finance access. Current supplier payment-run assumptions (supplier grouping, employer currency, supported instruments) must be explicitly validated/extended for employee and statutory payees; there is no claim that every country’s bank format already works.

Payroll-origin restriction propagates to Invoice/InvoiceItem, Payment/Application, AcctgTrans/Entry, content, print data, exports, search and notifications. General finance users may receive permitted aggregate expense/liability reports; per-person amounts, payee identifiers and source drill-down require payroll-finance authority. Masking a Payslip while exposing its Invoice or ledger entries is not sufficient. Authorized bank operators necessarily receive required employee payment details. Proposed service-level projections and artifact/filter coverage are prerequisites for payroll exposure, including generic entity access. No salary details go into general Chatter or payment notification emails.

**Existing automation register (also crosscut §1.3):**

| Existing rule / source | Treatment on People paths |
| --- | --- |
| `InvoiceGlPost`, `PaymentGlPost`, `PaymentApplicationGlPost` in `AccountingLedger.secas.xml` | Kept. Approving/finalizing an invoice, delivering a payment and applying a payment trigger the owner’s posting path. Payroll does not post a second journal; posting error records remain visible in reconciliation. |
| `InvoiceAdjustGlPost`, `InvoiceAdjustUpdateGlPost`, `InvoiceCancelRevertGlPost`, `InvoiceResumeChangeRevertGlPost` in the same file | Kept for Accounting’s guarded operations. People refuses edits, resume and cancellation of finalized payroll source invoices; changes use linked correction obligations. No direct invoice-item edit to correct wages. |
| `InvoiceCheckNegativeTotalMarkPaid`, `InvoiceCheckFullyPaid`, `InvoiceApplyForPayments`, `InvoiceIssuedDueSchedule`, `InvoiceResumedDueSchedule` in `AccountingInvoice.secas.xml` | Kept within the native state flow. Manager expense approval must not set InvoiceApproved. Negative pay is blocked before obligation creation; credits follow Accounting’s credit flow. Respect existing matching/payment holds and due-schedule rules. |
| `PaymentCheckEffectiveDate`, `PaymentApplyForInvoice`, `PaymentCancelledCleanup`, `PaymentUnDeliverCleanup`, `RunPaymentReturned` in `AccountingPayment.secas.xml` | Kept under Accounting authority. Effective dates, settlement application, voiding and return status are not reimplemented in People. An unknown bank outcome stays unresolved until reconciled. |
| `PaymentRunBankChangeVoid`, `PaymentRunBankAddVoid`, `PaymentRunBankEndVoid` in `AccountingPayment.secas.xml` | Kept. Changed employee/other-payee bank details invalidate affected payment-run approvals through the same payment-method services. Payroll calculation approval is not bank authorization. |
| `PaymentDraftValidationNotice`, `PaymentEditValidationNotice` in `PaymentValidation.secas.xml` | Conditioned: retain payment validation but payroll-origin messages use restricted recipients and safe summaries, without salary/bank details in broad feeds. |

### 8.4 Localization, external processing and legacy disposition

A localization binding declares jurisdiction(s), effective coverage, required employer/employee setup, input/base types, calculation service, reporting calendar and supported outputs. Calculation receives declared pay facts and accumulator bases and returns itemized employee/employer amounts, bases, explanations and warnings/errors; it cannot write invoices, payments or arbitrary employee data. Rule sets use effective dates and controlled release metadata. Missing, expired or incomplete required coverage blocks live finalization. A synthetic non-statutory demonstration mode can preview examples but cannot produce payable obligations. No country’s laws or forms are implemented by this design.

PayrollExchange permits an explicitly configured external-processing mode: export approved inputs with manifest/source identities, import signed-off provider results and reconcile employee amounts, currencies and totals through the same Payslip/PayrollObligation path. Do not also run native gross-to-net for that group/period. Credentials and transport are Admin-owned; CSV is the first interchange, with named provider/bank connectors later. Statutory documents and e-filing are localization outputs, not automatic W-2/1099 promises.

| Existing artifact | Retain / extend / replace | Required treatment |
| --- | --- | --- |
| Person, Employment/PartyRelationship, EmplPosition/Class/Party, PayGrade/Salary | Retain/extend | Preserve identities and dated history; add guarded lifecycle and assignment services. |
| EmploymentSalary, RateAmount, EmploymentBenefit/BenefitType | Retain/extend | Keep actual salary, rate and benefit facts. Add effective policy, approval and mapping to new structures; no duplicate editable salary table. |
| Employee and Employment US tax/election fields | Retain for historical interpretation; replace for new neutral setup | Map explicitly into dated localization profiles where meaning is supported. A historical allowance/status value is not presumed valid under a new rule set. |
| PayrollAdjustment, Detail, Exempt, FedStts, StateStts, AdjCalcService/Parameter | Replace as new-run configuration; preserve old data | Map only supported earning/deduction/payee meaning to components/assignments/localization rules. Do not automatically activate arbitrary historical calculator service names. |
| PayrollAllowance, PayrollStdDeduction, PayrollGarnishMinWage, WorkTypeRiskClass/GlOverride | Retain evidence; selectively migrate | Current localization and account mappings must validate meaning, effectivity and units. Worker-risk and expense mappings can be reused where they still fit. |
| EmploymentPayHistory/EmploymentPayDetail | Preserve read-only; replace as new result identity | Historical viewer uses the old composite key. Import into new facts only with a durable old-to-new mapping and reconciliation; never double include old and imported totals. |
| `process#TimePeriodPay`, `process#EmploymentPay`, amount/detail helpers and `calculate#PayrollAdjustment` | Replace for new runs | Calculation and finalization become distinct APIs. Existing calculations are reference material to review, not a production-ready engine or hidden fallback. |
| `reopen#PayrollPeriod` | Exclude from new People workflows | No destructive pay-history deletion. Use draft cancellation or linked corrections/reversals. |
| Legacy `approve#PeriodInvoices`, `create#PeriodPayments`, set/authorize/deliver period payment services | Replace in the new workflow | Use PayrollRun identity plus Accounting’s current payable/payment services; period-only selection must not include unrelated runs. |
| `PayrollDocumentServices` US W-2/1099-MISC/EFW2 services | Preserve historical source; no new live form mapping | Validate/rebuild within a selected localization before use. Changing a year label is not modernization. |
| `PayrollData.xml`, `ZapPayrollTaxInstallData.xml` | Retain useful neutral types; quarantine historical tax fixtures | Separate demonstration/historical loads from operational localization installation. Explicit activation with current coverage is required; no automatic seed-to-live conversion. |

Migration is an explicit preview → map → reconcile → approve → import process. Keep source keys, employer/currency, period/pay date and provenance. Reconcile gross, deductions, net, employer cost, liabilities, YTD/opening bases and invoice/payment links. Unsupported rows remain historical-only with named findings; do not invent missing rules or detail. New source reservations are reconciled with existing worker invoices before cutover. Preserve old invoices and payments and their financial history; importing history does not create new obligations.

### PayComponents

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Components | list | Inspect components and effective coverage | code, name, kind, unit, dates, status, localization | type filters | proposed `mantle.humanres.PayrollSetupServices.find#Components` | Frappe Salary Component |
| NewComponent | dialog | Start a component | code, name, kind, unit/currency, from date | kind choices | proposed `mantle.humanres.PayrollSetupServices.store#Component` | Frappe Salary Component |

**Actions and states:** Open PayComponentDetail; end a used definition instead of deleting it. Historical source rules are never auto-published.



**Source:** research §9; Frappe salary_component source

**Needs:** PE-08; PE-12.

### PayComponentDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ComponentTerms | single | Configure calculation and accounting meaning | kind, basis, formula/amount, dependencies, unit, rounding, effective dates, GL mapping | constrained formula editor | proposed `mantle.humanres.PayrollSetupServices.store#Component` | Frappe Salary Component |
| Examples | list, editable rows | Verify named examples before release | input values, expected quantities/amounts, actual result, explanation | decimal comparison | proposed `mantle.humanres.PayrollSetupServices.preview#Component` | Frappe formula preview |
| PublishComponent | dialog | Release validated dated terms | effective date, reason, example results, approver | confirm | proposed `mantle.humanres.PayrollSetupServices.publish#Component` | Frappe component configuration; suite effective-date convention |

**Actions and states:** Publish requires examples, dependencies and mappings to validate. Taxability is a jurisdiction-specific base mapping, not one global boolean. Exclude statistical components from pay/GL and show that in preview.



**Source:** research §9

**Needs:** PE-08; PE-09; PE-12; PE-15.

### PayStructures

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Structures | list | List compositions and assignments | name, employer, currency, basis, dates, state, assignment count | filters | proposed `mantle.humanres.PayrollSetupServices.find#Structures` | Frappe Salary Structure |
| NewStructure | dialog | Start a package | name, employer, currency, pay basis, from date | organization choices | proposed `mantle.humanres.PayrollSetupServices.store#Structure` | Frappe Salary Structure |

**Actions and states:** Open PayStructureDetail; copying creates a new identity with draft terms and no employee assignments.



**Source:** research §9

**Needs:** PE-08.

### PayStructureDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Composition | list, editable rows | Select dated component terms | component, effective dates, eligibility, parameter bindings, payslip order | dependency preview | proposed `mantle.humanres.PayrollSetupServices.store#StructureComponent` | Frappe Salary Structure earnings/deductions |
| PreviewStructure | single | Explain sample gross-to-net | sample inputs, employment terms, period, pay date, rule coverage | result breakdown | proposed `mantle.humanres.PayrollSetupServices.preview#Structure` | Frappe salary structure preview |
| PublishStructure | dialog | Release a validated structure | dates, revision stamp, reason, approver | confirmation | proposed `mantle.humanres.PayrollSetupServices.publish#Structure` | Frappe Salary Structure |

**Actions and states:** Reject cyclic/missing component references and incompatible dimensions. Display order is independent of calculation dependency order. Publishing does not reassign existing employees or rewrite finalized slips.



**Source:** research §9

**Needs:** PE-08; PE-09; PE-15.

### PayAssignments

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Assignments | list | Show active and future assignments | employment, structure, group, salary/rate reference, dates, readiness | authorized employee search | proposed `mantle.humanres.PayrollSetupServices.find#Assignments` | Frappe Salary Structure Assignment |
| AssignPay | dialog | Set dated pay terms | employment/selection, group, structure, dates, variable inputs, reason | bulk preview | proposed `mantle.humanres.PayrollSetupServices.assign#PayStructure` | Frappe bulk salary assignment |
| TaxAndBenefits | dialog | Maintain restricted payroll setup | employment, jurisdiction, elections, effective dates, benefits, payment-method reference | module-supplied validated fields; masked bank reference | proposed `mantle.humanres.PayrollSetupServices.store#PayrollProfile` | Frappe tax/benefit setup; Mantle Employee/EmploymentBenefit |

**Actions and states:** Require employment and group consistency; forbid overlapping primary assignments. Structure assignment does not silently change actual salary. Bank changes route through Accounting payment-method services and their approval invalidation. Country fields appear only from installed localizations.



**Source:** research §9

**Needs:** PE-01; PE-08; PE-12; PE-15.

### PayGroups

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Groups | list | Find employer payroll groups | employer, name, currency, frequency, time basis, localization coverage | list | proposed `mantle.humanres.PayrollSetupServices.find#Groups` | Frappe payroll period/settings |
| GroupTerms | single | Maintain dated run policy | employer, currency, frequency, dates, time basis, workweek zone, proration, approval rule | policy fields | proposed `mantle.humanres.PayrollSetupServices.store#Group` | Frappe Payroll Settings; Mantle employer payroll settings |
| Periods | list | Generate and review periods | group, from/through, pay date, processing state | period preview | proposed `mantle.humanres.PayrollSetupServices.prepare#Periods` | Mantle check#NextPayrollTimePeriods |

**Actions and states:** No closing a TimePeriod merely to mark one run finished. Period generation is idempotent and its calendar/day policy is explicit. Required localization coverage/readiness is visible before live runs are allowed.



**Source:** research §9, §15

**Needs:** PE-08; PE-10; PE-12.

### PayRuns

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Runs | list | Track calculation and settlement separately | group, period, pay date, kind, worker count, gross/net, errors, state | status chips; paginated totals | proposed `mantle.humanres.PayrollRunServices.find#Runs` | Frappe Payroll Entry |
| NewRun | dialog | Create a run without posting | group, period, pay date, kind, selected scope, correction reference | period lookup | proposed `mantle.humanres.PayrollRunServices.create#Run` | Frappe Payroll Entry |

**Actions and states:** Create opens PayRunDetail. A second regular run covering already-consumed inputs is refused; off-cycle/correction kinds need distinct entitlements or original-result references.



**Source:** research §9

**Needs:** PE-09; PE-10; PE-11.

### PayRunDetail

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Population | wizard step | Review employee inclusion | employment, eligibility, pay assignment, exclusion reason | paginated selection | proposed `mantle.humanres.PayrollRunServices.select#Employments` | Frappe Get Employees |
| Inputs | wizard step | Resolve source readiness | employment, input totals, missing approvals, conflicts | HoursForPay links | proposed `mantle.humanres.PayrollInputServices.prepare#Inputs` | Frappe payroll validation |
| CalculateAndReview | wizard step | Run calculations and inspect outcomes | employment, progress, earnings, deductions, net, variance, reason code | asynchronous progress; result links | proposed `mantle.humanres.PayrollRunServices.calculate#Run`; proposed `mantle.humanres.PayrollRunServices.get#Run` | Frappe Create Salary Slips |
| Approval | wizard step | Approve exact results and exclusions | totals by type, worker counts, exclusions, warnings, approval stamp | confirm count/total | proposed `mantle.humanres.PayrollRunServices.approve#Run` | Frappe submit slips; suite approvals |
| Finalize | wizard step | Create durable pay facts and obligations | approval, included units, payees, dimensions, result links | finalization progress | proposed `mantle.humanres.PayrollRunServices.finalize#Run` | Frappe accrual step adapted to Mantle invoices |
| Settlement | list, read | Reconcile Accounting outcomes | obligation, invoice, posting state, payment, paid/unpaid, returns | authorized shared-record links | proposed `mantle.humanres.PayrollRunServices.get#Settlement` | Frappe bank remittance; Mantle payments |

**Actions and states:** Primary action follows §8.2 state. Retry only failed/pending units; show successful ones unchanged. Approval/finalization confirm exact scope. Payment actions link to Accounting and require its permissions. A stale source or accumulator returns a specific exception for review.



**Source:** research §9; Frappe payroll_entry source

**Needs:** PE-09; PE-10; PE-11; PE-12; PE-15.

### Payslips

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Slips | list | Browse authorized pay results | worker, employer, period, pay date, run kind, gross/net, issued/correction state | source-kind filter; no private shell amounts | proposed `mantle.humanres.PayrollResultServices.find#Payslips` | Frappe PWA salary-slip dashboard |

**Actions and states:** Self sees only own issued statements, not every draft calculation. Historical rows retain legacy identifiers and a historical-source label; opening one never regenerates its tax calculation.

**Devices:** phone. SelfService fixes the current user’s party.

**Source:** research §9

**Needs:** PE-01; PE-10; PE-17; PE-19.

### PayslipDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PayBreakdown | display | Explain result and year-to-date bases | employer, employment, period/date, quantities, rates, earnings, deductions, net, employer costs | grouped item table; source explanations | proposed `mantle.humanres.PayrollResultServices.get#Payslip` | Frappe Salary Slip |
| StatementOutput | dialog | Print or deliver the issued statement | slip, language, issued date, permitted destination | PDF/download; delivery confirmation | proposed `mantle.humanres.PayrollResultServices.issue#Payslip` | Frappe salary-slip print; payroll check stub |
| CorrectPay | dialog | Initiate a correction linked to this result | original slip, changed facts, effective date, reason, evidence | correction preview | proposed `mantle.humanres.PayrollRunServices.create#Correction` | Frappe Payroll Correction |

**Actions and states:** Employee can download an issued PDF; payroll controls issue/correction. Issued PDFs are stored with the result and issue timestamp. Notification links require authentication; no automatic emailing of sensitive attachments. Show original and correction separately with a reconciled net effect.



**Source:** research §9

**Needs:** PE-01; PE-10; PE-11; PE-17.

### PayAdjustments

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Adjustments | list | Find one-off or recurring inputs | employment, component, period, quantity/unit, amount/currency, source, state | filters | proposed `mantle.humanres.PayrollInputServices.find#Adjustments` | Frappe Additional Salary |
| Adjustment | dialog | Prepare a reasoned input | employment, component, dates, quantity/amount, source/evidence, recurrence end, reason | decimal inputs | proposed `mantle.humanres.PayrollInputServices.store#Adjustment` | Frappe additional salary and withholding |
| ApproveAdjustment | list, bulk | Approve eligible inputs | selection, decision, reason | confirm | proposed `mantle.humanres.PayrollInputServices.decide#Adjustment` | Frappe adjustment workflow |

**Actions and states:** Consumed inputs cannot be edited or deleted; create a linked delta. Garnishments and mandated deductions require supported localization policy, payee and authority evidence rather than a free-text legal rule. Recurrence produces uniquely identified dated inputs.



**Source:** research §9

**Needs:** PE-09; PE-12; PE-15.

### PayrollExchange

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Exchange | wizard step | Select direction and reviewed scope | mode, employer, group, period/cutover, source system, currency, file/map | file preview and manifest | proposed `mantle.humanres.PayrollExchangeServices.preview#Batch` | Odoo work-entry export; Frappe bank remittance |
| Reconcile | wizard step | Compare identities and financial totals | worker matches, source keys, gross/net, liabilities, YTD, existing invoices, errors | difference table | proposed `mantle.humanres.PayrollExchangeServices.reconcile#Batch` | Frappe opening payroll balances; Mantle external history |
| CommitExchange | wizard step | Export or import approved rows | manifest, mapping, approval, valid/error counts, output links | confirm; per-row results | proposed `mantle.humanres.PayrollExchangeServices.execute#Batch` | Mantle import patterns |

**Actions and states:** Historical import creates no payable obligations. External live results pass the same approval/finalization checks as native results, with native calculation disabled for their scope. File replay is idempotent; unrecognized workers or unsupported bases remain errors.



**Source:** research §9, §17

**Needs:** PE-01; PE-10; PE-12; PE-19.

### PayrollStatements

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| StatementScope | single | Select a supported output | employer, localization, reporting period, statement kind, amended reference | installed-output choices | proposed `mantle.humanres.PayrollLocalizationServices.preview#Statement` | Mantle PayrollDocumentServices; Frappe payroll reports |
| ValidationAndOutput | list | Reconcile and generate reviewed output | workers, bases, withheld/employer totals, validation errors, generated file | restricted download | proposed `mantle.humanres.PayrollLocalizationServices.generate#Statement` | Mantle W-2/EFW2 historical reference |

**Actions and states:** A future localization supplies the format and validation; no generic W-2/1099/EFW2 button is enabled from old services. Generating a file does not imply filing or acceptance; acknowledgments need a provider-specific integration.



**Source:** research §9; historical PayrollDocumentServices

**Needs:** PE-12; PE-17.

## 9. Expenses and advances

An expense claim remains an employee-from Invoice with ItemExpense-family items, not a parallel claim ledger. Add an ExpenseClaim extension keyed by invoiceId for employment, business-approval state, approver rule, reimbursement route and source reservations; InvoiceContent holds receipts with claim-specific access. Extend `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` to accept an explicit authorized employer without requiring a project, preserving its existing project behavior. A claim can retain work-effort links for rebilling; do not turn employee payroll into customer billing.

Draft uses InvoiceIncoming and submission InvoiceReceived. Business approval is a separate ExpenseClaim decision and leaves the invoice received. Finance then checks receipt/tax/coding and calls `approve#Payable`; only that financial step reaches InvoiceApproved and its posting automation. A returned claim can be corrected only before financial approval/consumption; later changes use the Accounting credit/correction path. Self-service claim services enforce ownership and do not require or grant broad PAYABLE_EDIT.

An approved claim has exactly one settlement route: ordinary AP or a specified payroll run. Both use the original claim invoice; the payroll route reserves it against ordinary payment-run selection and includes a reimbursement settlement line in the payslip. It must **not** copy the expense into a second payroll invoice. A combined employee payment applies separately to the payroll invoice and original claim invoice. PayrollObligation links an existing claim invoice for this purpose; it does not create another obligation. Payroll result displays distinguish wage net, linked reimbursement due and total payment instruction. A cancelled draft payroll releases the reservation; a finalized or paid claim cannot change route without the owner’s reversal/reallocation process.

For example, 1,000 wage net plus a 100 approved claim produces 1,100 to deliver, applied 1,000 to the payroll invoice and 100 to the claim invoice. If a 40 advance has already been applied to the claim, only 60 remains for reimbursement and delivery is 1,060. Those are illustrative amounts in one configured currency, not legal rules. Do not expense the claim again through a payroll component or deduct the advance twice.

Employee advances use an approved advance request linked to native Payment and application/recovery records. Approval to advance is distinct from payment authorization; outstanding derives from delivered amounts less actual applications/returns, not a manually editable balance. Payroll deductions for recovery require an explicit approved recovery input and applicable localization support; deduction and payment application reconcile to the same advance source. Ending employment exposes outstanding advances for final settlement rather than automatically deducting them.

### ExpenseClaims

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Claims | list | Find authorized claims | employee, employer, project, dates, currency, total, business/finance states, route | mobile amount/status columns | proposed `mantle.humanres.ExpenseServices.find#Claims` | MyAccount/Expense/FindExpenseInvoice InvoiceList |
| NewClaim | dialog | Create an employee claim | employer, optional project, incurred date, currency, description | employer/project choices | extended `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` | MyAccount/Expense/FindExpenseInvoice CreateInvoice |

**Actions and states:** Create opens ExpenseClaimDetail. Self is fixed to the actor’s party; acting for another worker requires HR expense authority and records the actor. Draft, business-approved, finance-approved and paid are distinct labels.

**Devices:** phone; receipt-first entry. Accounting mounts the same claim capture/detail, with finance actions through its own services.

**Source:** research §10, §17

**Needs:** PE-01; PE-13; PE-15.

### ExpenseClaimDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ClaimHeader | single | Maintain draft claim context | employer, project, currency, dates, purpose, route | authorized choices | proposed `mantle.humanres.ExpenseServices.store#Claim` | MyAccount/Expense/EditExpenseInvoice EditInvoice |
| ClaimItems | list, editable rows | Record receipt-supported expenses | date, expense type, description, quantity, amount/tax, currency, project, receipt | private receipt upload; decimals | proposed `mantle.humanres.ExpenseServices.store#ClaimItem` | MyAccount/Expense/EditExpenseInvoiceItems CreateInvoiceItem and EditInvoiceItems |
| SubmitOrDecide | dialog | Submit or decide business justification | claim, action, reason, approval rule, route | confirm; receipt completeness | proposed `mantle.humanres.ExpenseServices.submit#Claim`; proposed `mantle.humanres.ExpenseServices.decide#Claim` | Odoo expenses; Frappe Expense Claim |
| FinanceAndSettlement | display | Explain posting and reimbursement | invoice, coding issues, finance state, advance applications, payroll reservation, paid/outstanding | authorized InvoiceDetail link | proposed `mantle.humanres.ExpenseServices.get#Claim` | Accounting ExpensePosting |

**Actions and states:** Submit locks claimant edits. Business approver can return/refuse/approve, not post. Finance opens Accounting ExpensePosting/BillDetail for coding and payable approval. Selecting payroll reserves the original invoice; no repeated expense item is created on the payroll invoice.



**Source:** research §10; design-accounting §5

**Needs:** PE-01; PE-11; PE-13; PE-15.

### EmployeeAdvances

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Advances | list | Show requested and outstanding advances | employee, purpose, currency, requested, delivered, applied, outstanding, state | payment/claim links | proposed `mantle.humanres.ExpenseServices.find#Advances` | Frappe Employee Advance |
| RequestAdvance | dialog | Request funds for expenses | employment, employer, purpose, currency, amount, required date, expected settlement | money/date inputs | proposed `mantle.humanres.ExpenseServices.request#Advance` | Frappe Employee Advance |
| AdvanceDecision | dialog | Approve business purpose or propose recovery | advance, action, reason, claim allocation/recovery reference | reconcile preview | proposed `mantle.humanres.ExpenseServices.decide#Advance` | Frappe advance allocation |

**Actions and states:** Approved advances hand off to Accounting’s Payment services. People reads payment/application outcomes; undelivered or returned payments do not count as delivered cash. Recovery needs approval and cannot exceed outstanding.



**Source:** research §10

**Needs:** PE-11; PE-13; PE-15.

## 10. Skills and training

Keep PartySkill and EmplPositionClassSkill for declared/evaluated proficiency. Refine and activate qualification/training concepts in Mantle with stable certificate and training-enrollment identities, verified-by/date, validity and evidence. A claimed skill is not proof of a valid qualification. `check#Qualifications` returns qualified/expiring/missing/expired at the planned work date and job requirements, with permitted explanations; Manufacturing/Projects may consume this without private certificates or review comments. A training completion can grant a qualification only through an authorized assessment decision and once per enrollment. Full course authoring, SCORM/content delivery and external learner portals are later integrations.

### SkillsMatrix

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Matrix | component | Find skill coverage and gaps | team/person, job class, skill, required/actual level, qualification state | matrix; TUI person-skill list | proposed `mantle.humanres.DevelopmentServices.get#SkillsMatrix` | Dolibarr compare; Frappe skill map |
| EvaluateSkill | dialog | Record a supported skill evaluation | person, skill, level, evaluation date, assessor, evidence | level choices | proposed `mantle.humanres.DevelopmentServices.store#Skill` | Frappe Employee Skill Map |

**Actions and states:** Filter before loading; large populations page by person. A self-declared skill is labelled as such and cannot satisfy a verified-certificate requirement.



**Source:** research §11

**Needs:** PE-01; PE-14; PE-20.

### Qualifications

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Qualifications | list | Find valid and expiring evidence | person, qualification type, issuer, issued/expiry, verification state | expiry filters | proposed `mantle.humanres.DevelopmentServices.find#Qualifications` | Carbon abilities; Odoo certifications |
| Qualification | dialog | Submit or verify evidence | person, type, issuer, reference, valid dates, attachment, verifier decision | private upload; dates | proposed `mantle.humanres.DevelopmentServices.store#Qualification`; proposed `mantle.humanres.DevelopmentServices.verify#Qualification` | Odoo skill certificates |

**Actions and states:** Self submits; an authorized verifier accepts/rejects. Revocation/renewal preserves prior evidence; staffing sees validity and requirement outcome, not identification numbers or files. Reminders are based on effective expiry and deduplicated.



**Source:** research §11

**Needs:** PE-01; PE-14; PE-18.

### Training

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Sessions | list | Browse training and due recertification | title, course/type, date, trainer, location, seats, qualification | list/calendar | proposed `mantle.humanres.DevelopmentServices.find#Training` | Frappe Training Program/Event |
| NewSession | dialog | Schedule a training session | class, dates, trainer, location, capacity, qualification, assessment form | calendar availability | proposed `mantle.humanres.DevelopmentServices.store#Training` | Frappe Training Event |

**Actions and states:** Sessions link to a WepTraining event rather than duplicating calendars. Register/request a place through TrainingDetail; external public registration is later.



**Source:** research §11

**Needs:** PE-14; PE-18.

### TrainingDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Enrollment | list | Maintain attendance and approval | person, employment, requested/approved, attendance, assessment state | row actions | proposed `mantle.humanres.DevelopmentServices.enroll#Training` | Frappe training event employees |
| Results | list, editable rows | Record an assessed outcome | enrollment, attended hours, score/pass, assessor, completion date, evidence | shared quiz/form response | proposed `mantle.humanres.DevelopmentServices.complete#Training` | Frappe Training Result; Carbon training grants |

**Actions and states:** Completion checks attendance, required assessment and verifier authority before granting one qualification. Retry does not issue a duplicate certificate. A failed assessment is retained and can lead to a new attempt.



**Source:** research §11

**Needs:** PE-14; PE-15; PE-18.

## 11. Reviews and goals

Refine the commented PerformanceReview family in Mantle rather than exposing its sketches unchanged. Add ReviewCycle and dated ReviewTemplate with explicit participants, review steps and release policy. Separate self assessment, manager assessment and peer feedback visibility; private manager notes are not employee-visible Chatter. No anonymous-feedback promise is made unless a later design supplies aggregation and inference protection. Goals use WorkEffort and relationships; add typed target/actual/unit fields or an extension only where the existing percentComplete is insufficient, not a parallel goal/task store.

### ReviewCycles

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Cycles | list | Track review completion | name, employer/team, period, due dates, template, counts, state | progress counts | proposed `mantle.humanres.ReviewServices.find#Cycles` | Frappe Appraisal Cycle |
| CycleSetup | dialog | Create a cycle and preview participants | scope, period, template, self/manager dates, reviewer rule, release policy | preview participant list | proposed `mantle.humanres.ReviewServices.store#Cycle`; proposed `mantle.humanres.ReviewServices.start#Cycle` | Frappe Appraisal Cycle |

**Actions and states:** Start creates one review per intended person/cycle with independent results. Changed reporting lines do not silently disclose earlier feedback; reviewer reassignment is audited. Close only with explicit completion/exclusion outcomes.



**Source:** research §12

**Needs:** PE-01; PE-16.

### Reviews

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReviewList | list | Show actor-specific review work | person, cycle, period, self/manager state, due date, release state | filters; record links | proposed `mantle.humanres.ReviewServices.find#Reviews` | Frappe Appraisal |

**Actions and states:** Open ReviewDetail. Self sees permitted sections only; managers see assigned employees, not all department private notes. Ratings are absent from public directory and general team counts.



**Source:** research §12

**Needs:** PE-01; PE-16.

### ReviewDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Assessment | single | Complete the assigned review step | criteria, evidence, rating, goals, strengths, development actions | shared form/scorecard | proposed `mantle.humanres.ReviewServices.store#Assessment` | Frappe Appraisal and Employee Performance Feedback |
| Feedback | list | Collect explicitly assigned feedback | reviewer, requested criteria, response, visibility, submission date | private form response | proposed `mantle.humanres.ReviewServices.submit#Feedback` | Frappe 360 feedback |
| ReviewDecision | dialog | Submit, finalize, release or acknowledge | review, step/action, reason, expected stamp | confirmation | proposed `mantle.humanres.ReviewServices.change#ReviewState` | Frappe appraisal cycle |

**Actions and states:** Each step locks on submission; returns require reason. Finalization does not release private notes. Release produces the employee-visible assessment and acknowledgment records; compensation changes require their own workflow.



**Source:** research §12

**Needs:** PE-01; PE-15; PE-16; PE-18.

### Goals

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Goals | list | Show goals and progress | owner, parent goal, period, target/unit, actual/progress, due, state | list/tree | proposed `mantle.humanres.ReviewServices.find#Goals` | Gauzy goals; Projects WorkItemDetail |
| Goal | dialog | Agree a goal or record progress | owner, parent, title, measure, target, unit, period, progress evidence | decimal/percentage input | proposed `mantle.humanres.ReviewServices.store#Goal` | Frappe Goal; Gauzy key results |

**Actions and states:** Goal-specific services use WorkEffort state/assignment APIs and goal visibility. Link implementation tasks through existing work relationships; task completion is evidence, not automatic agreement that a performance target was met.



**Source:** research §12

**Needs:** PE-16; PE-18.

## 12. Reports and settings

### Reports

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportOptions | single | Choose a report and permitted dimensions | report, employer/team, date range/as-of, employment type, group/type, currency | report picker; saved finds | proposed `mantle.humanres.PeopleReportServices.get#Options` | Frappe HR report catalogue |
| ReportResults | list, read | Present authorized rows and aggregates | selected dimensions, counts/amounts, denominator, source reference | grouped table; CSV/XLSX | proposed `mantle.humanres.PeopleReportServices.run#Report` | Frappe headcount, leave, attendance, recruitment and salary reports |

**Actions and states:** One registered report service family covers headcount/joins/exits/turnover, vacancies/funnel/time-to-hire, attendance exceptions, leave balance/ledger, payroll register/variance/liabilities, expenses/advances, qualification expiry and review completion. Distinct people and employments are labelled; headcount is as-of and turnover exposes its denominator. Pay reports group currency and require payroll permission. Exports use the same projection and filters.



**Source:** research §14

**Needs:** PE-01; PE-17.

### Settings

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SetupReadiness | list, read | Identify missing dependencies | employer, module, required setup, missing policy, permission, localization coverage | links to owning settings | proposed `mantle.humanres.PeopleServices.get#Readiness` | Frappe HR Settings |
| PeoplePreferences | single | Set dated organization preferences | self-service features, clocking, attendance zone policy, privacy/retention policy, notification choices | toggles and policy links | proposed `mantle.humanres.PeopleServices.store#Settings` | Frappe HR Settings; Carbon people config |
| EmployeeImportPreview | dialog | Map employee/employment data and review matches | file, employer, external worker identifier, person match, employment start, field mapping, source system | upload and mapping preview | proposed `mantle.humanres.PeopleServices.preview#EmployeeImport` | Frappe employee data import |
| EmployeeImportResults | list | Confirm valid hires/updates and inspect row results | batch, row, matched person/employment, action, findings, result key | confirm selection; error-row download | proposed `mantle.humanres.PeopleServices.import#Employees` | Frappe employee data import; Mantle independent-row import pattern |

**Actions and states:** Settings link to domain editors rather than arbitrary JSON/PartySetting entry. Enabling payroll requires readiness, including confidentiality coverage and localization for live runs. Retention settings can schedule reviewed deletion/anonymization of eligible recruitment data; they never delete accounting history or records under a hold. Employee import uses HireEmployee’s identity and employment rules per independent row, with stable external source keys and an approved mapping; it cannot import passwords, grant user groups or silently overwrite pay/tax history.



**Source:** research §15

**Needs:** PE-01; PE-08; PE-12; PE-18.

### ApprovalPolicies

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Policies | list | Find dated rules | employer, transaction kind, scope, steps, effective dates, alternate | filters | proposed `mantle.humanres.PeopleApprovalServices.find#Policies` | Odoo validation types; Frappe department approvers |
| ApprovalRule | single | Set explicit approval steps | type, scope, employee override, department role, manager/HR route, alternate, effective dates | rule summary | proposed `mantle.humanres.PeopleApprovalServices.store#Policy` | Frappe approvers; Gauzy approval policy |
| ResolvePreview | display | Explain routing for an example | requester, employment, kind, amount/context, resolved approvers, conflicts | explanation list | proposed `mantle.humanres.PeopleApprovalServices.resolve#Approvers` | Frappe team requests |

**Actions and states:** Resolve employee override → matching department/type rule → manager → designated HR fallback; explicit multi-step rules require every step. No self-approval or automatic approval on missing approver. Decisions store actor, step, source revision, time and reason; changed terms invalidate pending approvals. Generic Commons notifications invoke domain decisions rather than changing statuses themselves.



**Source:** research §13

**Needs:** PE-01; PE-15; PE-18.

### ChecklistTemplates

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Templates | list | List role-based task templates | name, lifecycle kind, tasks, due offsets, active dates | template links | proposed `mantle.humanres.PeopleServices.find#Checklists` | Frappe Employee Boarding |
| ChecklistTasks | list, editable rows | Assign lifecycle work by role | task template, role, due offset, required flag, source link, visibility | task/role choices | proposed `mantle.humanres.PeopleServices.store#Checklist` | Frappe boarding activities; Projects task templates |

**Actions and states:** Instantiation uses existing WorkEffort task services, with a unique lifecycle-event/template-task link. Task text carries only what that role needs; IT receives access work, not salary or separation case notes. Required completion is tracked explicitly.



**Source:** research §6

**Needs:** PE-02; PE-15; PE-18.

### Lookups

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Lookups | list | Inspect approved vocabulary families | family, code, description, order, active use | family dropdown | proposed `mantle.humanres.PeopleServices.find#Lookups` | Frappe HR Setup; Mantle Enumeration |
| Lookup | dialog | Add or end a permitted value | family, code, description, sequence, effective state | controlled fields | proposed `mantle.humanres.PeopleServices.store#Lookup` | Mantle SkillType, TerminationReason and BenefitType |

**Actions and states:** Whitelist HR-owned families; do not expose arbitrary enum/status/service editing. Required seeds include applicant role/stages, skill types/levels, termination reasons and new domain status flows. Referenced values are ended, not deleted; localization-owned statutory codes are read-only here.



**Source:** research §15

**Needs:** PE-03; PE-04; PE-07; PE-14; PE-16.

## 13. Shared screens

These mounts reuse their owner’s forms and services. Crosscut §3.4 registers People-owned Employee360 and its limited projections; the other owners retain their definitions. Existing TimeEntry forms do not gain attendance authority or compensation access from this app’s mount. A shared list/action always receives a server-derived capability set and safe display values.

### MyTime (Context passed)

**Context passed:** `People/Time/MyTime` mounts Projects §8 MyTime. Enter and submit own weekly work time. current user party; employer/project choices; existing work timer and submit actions. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §8 MyTime; research §16.

**Needs:** PE-01; PE-18.

### Timesheets (Context passed)

**Context passed:** `People/Time/Timesheets` mounts Projects §8 Timesheets. Review weekly submitted time. employee/team and period; existing TIMESHEET_APPROVE plus approver resolution; no pay amounts. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §8 Timesheets; research §16.

**Needs:** PE-01; PE-18.

### TimesheetDetail (Context passed)

**Context passed:** `People/Time/TimesheetDetail` mounts Projects §8 TimesheetDetail. Approve, return or inspect a weekly timesheet. timesheetId; existing submit/approve/return rules; extend reopen guard to finalized pay-input consumption (PE-09). The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §8 TimesheetDetail; research §16.

**Needs:** PE-01; PE-18.

### TimeEntries (Context passed)

**Context passed:** `People/Time/TimeEntries` mounts Projects §8 TimeEntries. Inspect work-time entries and source links. party/period/employer filters; existing store/delete and CSV-import guards; worker-side payroll consumption prevents duplicate worker invoices (PE-09). The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §8 TimeEntries; research §16.

**Needs:** PE-01; PE-18.

### Rates (Context passed)

**Context passed:** `People/Payroll/Rates` mounts Projects §10 Rates. Maintain dated employment pay rates. employment party, position class, work type and effective dates; worker/pay purpose only; client rates require Projects billing grants. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §10 Rates; research §16.

**Needs:** PE-01; PE-18.

### TeamCalendar (Context passed)

**Context passed:** `People/Time/TeamCalendar` mounts Commons §7 Calendar. Show authorized absence and shifts. team/date range; linked WetTimeOff and shift projections; absence reasons/files omitted; edits return to LeaveRequestDetail or ShiftRoster. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons §7 Calendar; research §16.

**Needs:** PE-01; PE-18.

### InterviewsCalendar (Context passed)

**Context passed:** `People/Positions/InterviewsCalendar` mounts Commons §7 Calendar and EventDetail. Schedule and inspect interviews. application/panel/date filters; private interview participants; scorecard links require assigned reviewer permission. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons §7 Calendar and EventDetail; research §16.

**Needs:** PE-01; PE-18.

### Approvals (Context passed)

**Context passed:** `People/Approvals` mounts Commons §4 Notifications; crosscut §3.15. Clear People decisions in the shared inbox. People leave/attendance/expense/position/offer/pay-change/training/review/payroll topics; recipient; bulk decisions run domain services per record. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons §4 Notifications; crosscut §3.15; research §16.

**Needs:** PE-01; PE-18.

### WorkItemDetail (Context passed)

**Context passed:** `People/Tasks/WorkItemDetail` mounts Projects §5 WorkItemDetail. Complete lifecycle and development tasks. workEffortId and sanitized lifecycle/goal link; task permission alone cannot open a confidential source. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §5 WorkItemDetail; research §16.

**Needs:** PE-01; PE-18.

### RequestDetail (Context passed)

**Context passed:** `People/Employees/RequestDetail` mounts Projects §6 RequestDetail; crosscut §3.11. Handle a confidential grievance. requestId; proposed HR-confidential type; explicit case ACL, restricted files and notifications; ordinary manager/request-reader grants are insufficient (PE-01). The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Projects §6 RequestDetail; crosscut §3.11; research §16.

**Needs:** PE-01; PE-18.

### EquipmentDetail (Context passed)

**Context passed:** `People/Employees/EquipmentDetail` mounts crosscut §3.10 EquipmentDetail. Review assigned equipment and return work. assetId and employee custody; custody/return actions remain Warehouse/Maintenance-owned; no automatic access to asset costs. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** crosscut §3.10 EquipmentDetail; research §16.

**Needs:** PE-01; PE-18.

### InvoiceDetail (Context passed)

**Context passed:** `People/Payroll/InvoiceDetail` mounts crosscut §3.16 InvoiceDetail; Accounting BillDetail. Inspect payroll obligations and settlement. invoiceId from a payroll/claim obligation; payroll-origin restrictions; financial edits/approval remain Accounting-owned. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** crosscut §3.16 InvoiceDetail; Accounting BillDetail; research §16.

**Needs:** PE-01; PE-18.

### Forms (Context passed)

**Context passed:** `People/Settings/Forms` mounts Commons survey builder; Customer Service FeedbackForms/FeedbackFormDetail reference. Configure interview, review and training questionnaires. People form purpose and organization; respondent/reviewer scope; no public links for private assessments. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons survey builder; Customer Service FeedbackForms/FeedbackFormDetail reference; research §16.

**Needs:** PE-01; PE-18.

### Chatter (Context passed)

**Context passed:** `People/Chatter` mounts Commons §15 Chatter; crosscut §3.14. Discuss an authorized HR record. host entity/key and privacy class; private child records never inherit broad Party visibility. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons §15 Chatter; crosscut §3.14; research §16.

**Needs:** PE-01; PE-18.

### RecordFiles (Context passed)

**Context passed:** `People/RecordFiles` mounts Commons §9 RecordFiles; crosscut §3.14. Read or attach authorized HR evidence. host entity/key and content purpose; private download/preview/export authorization; public sharing disabled for protected HR purposes. The mount narrows the owner’s authorized data and actions; it adds no authority.

**Source:** Commons §9 RecordFiles; crosscut §3.14; research §16.

**Needs:** PE-01; PE-18.

## 14. Baseline coverage and acceptance

### 14.1 Research candidate coverage

| Research §18 candidate | Designed destination / disposition |
| --- | --- |
| People home and dashboard widgets | Home; the same authorized summary feeds Commons Home and Insights through PE-18. |
| My team and approvals waiting | MyTeam and shared Approvals; one domain decision service per request, not a second approval inbox implementation. |
| Me | SelfService mounted inside Commons personal area; own profile, time, leave, expenses and payslips link to the owner routes. |
| Employee360 and account details | Employee360; account administration remains an Admin link, preferences Commons. |
| Directory | Employees public projection plus Commons contact/directory integration; private fields never enter the public result. |
| Org structure and org chart | OrgStructure and OrgChart; departments, teams and reporting remain dated Party relationships. |
| Lifecycle actions, checklists, equipment and grievances | HireEmployee, EmploymentChange, ChecklistTemplates, WorkItemDetail, EquipmentDetail, Grievances and restricted RequestDetail. |
| Job classes, positions and grades | JobClasses/JobClassDetail, Positions/PositionDetail, PayGrades. |
| Openings and pipeline | Openings and ApplicantPipeline; planned position approval is the requisition. |
| Applicant360 and interviews | ApplicantDetail, OfferDetail, InterviewsCalendar and shared Forms. |
| Careers page | Deferred to PASS; Openings holds publication/intake data but does not mount an anonymous BOSS form. |
| Attendance and clocking | SelfService Clock, Attendance, ClockingKiosk and TimeImport. |
| Working schedules and shift roster | WorkingSchedules/WorkingScheduleDetail and ShiftRoster; one capacity source shared with Projects. |
| Hours for pay and timesheets | HoursForPay plus MyTime, Timesheets, TimesheetDetail, TimeEntries and Rates mounts. |
| Leave requests, allocations, calendar and holidays | LeaveRequests/LeaveRequestDetail, LeaveBalances, LeaveAllocations, LeavePolicies/LeavePolicyDetail, HolidayCalendars and TeamCalendar. |
| Compensation, pay runs and payroll setup | Employee360 Compensation, PayAssignments, PayAdjustments, PayGroups, PayComponents/PayComponentDetail, PayStructures/PayStructureDetail, PayRuns/PayRunDetail. |
| Payslips and year-end | Payslips/PayslipDetail; PayrollStatements is later and localization-dependent. PayrollExchange covers provider and historical exchange. |
| Expense claims and advances | ExpenseClaims/ExpenseClaimDetail and EmployeeAdvances, with Accounting capture/posting context. |
| Skills matrix and certifications | SkillsMatrix and Qualifications; shared qualification checks for staffing. |
| Training | Training/TrainingDetail and Forms; full LMS delivery deferred. |
| Reviews and goals | ReviewCycles, Reviews/ReviewDetail, Goals; shared form/questionnaire engine and WorkEffort goals. |
| Reports and settings | Reports, Settings, ApprovalPolicies, Lookups, ChecklistTemplates and the domain policy editors. |

### 14.2 Baseline forms and service coverage

Baseline XML paths below are under `mr-marble/screen/SimpleScreens`, except `MyAccount/...`. The inventories add People paths only to **Designed in**, preserving existing mappings and all **Implemented in** values. Shared forms retain their owner’s direct service coverage; proposed services are not inserted as existing Mantle services.

| Baseline screen / forms | Design destination | Treatment |
| --- | --- | --- |
| HumanRes/dashboard | Home | Replace two-link dashboard with authorized work queues. No form inventory row exists for those links. |
| HumanRes/EditRateAmounts: CreateRateAmount, EditRateAmounts | People/Payroll/Rates | Existing shared Rates forms; `mantle.humanres.RateServices.create#RateAmount` and `update#RateAmount`, with worker-pay scope and effective-date guards. |
| Party/FindParty: CreateEmployeeForm | HireEmployee | Complete Employment and initial assignment, not just a Person/relationship. `create#PersonEmployee` is a legacy helper to adapt, not the hire transaction by itself. |
| Party/FindParty: OuterSearchForm, PartyListForm | Employees | Public directory projection and HR filters. |
| Party/EditParty: EditPersonForm, AddIdentificationForm, IdentificationsForm; OtherCreateForm, PhonePurposeForm, EmailPurposeForm, WebPurposeForm, OtherUpdateForm, OtherPurposeForm, PostalPurposeForm | Employee360 | Separate public work and private personal/contact forms; service-enforced field permissions. |
| Party/EditParty: EditOrganizationForm; Party/PartyRelated: NewToRelForm, NewFromRelForm, ToRelationshipForm, FromRelationshipForm | OrgStructure | Typed organization/team/reporting actions rather than unrestricted relationship editors. |
| Party/EditParty: NewNoteForm, UpdateNoteForm, NewContentForm, UpdateContentForm | Employee360 via Shared/Chatter and Shared/RecordFiles | Host-specific sensitive content scopes, never blanket Party visibility. |
| Party/PartyTimeEntries: ClockInForm, TimeEntryList; Party/PartyTimeEntries/EditTimeEntry: AddTimeForm; MyAccount/User/TimeEntries: TimeEntryList | TimeEntries and MyTime | Preserve work-time entry under Projects’ services. Attendance punch capture is new; worker-invoice forms remain Projects-owned and gain shared duplicate-pay protection. |
| MyAccount/Expense/FindExpenseInvoice: CreateInvoice, InvoiceList | ExpenseClaims | Optional project; explicit employer and own-worker scope. |
| MyAccount/Expense/EditExpenseInvoice: EditInvoice; EditExpenseInvoiceItems: CreateInvoiceItem, EditInvoiceItems | ExpenseClaimDetail | Receipt lines and separate business/finance decisions. WorkerInvoice forms remain Projects/Time/MyTime, not payroll generation. |
| Accounting/Invoice/EditInvoiceItems payroll item types; PaymentCheck stub | InvoiceDetail and PayslipDetail | Reuse financial record presentation; new payslip result is not the editable Accounting invoice. Printing templates are references, not form-inventory additions. |
| Survey forms and task/case/calendar forms | Forms, WorkItemDetail, RequestDetail, TeamCalendar and InterviewsCalendar | Shared owner definitions and context; no copied HR survey/task/calendar subsystem. |

Direct existing service calls additionally include `mantle.humanres.EmploymentServices.create#EmploymentSalary` (extended guard), `mantle.work.TimesheetServices.get#TimesheetSummary`, `mantle.work.ResourceServices.get#PartyCapacity` (extended schedule source), `mantle.work.TimeServices.import#TimeEntryCsv` and `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` (extended non-project/employee scope). The inherited time mounts use their existing `find#TimeEntries`, `store#TimeEntry`, `delete#TimeEntry`, `find#Timesheets`, `get#PartyWeek`, `get#PartyTimesheet`, `submit#Timesheet`, `approve#Timesheet`, `return#Timesheet`, `reopen#Timesheet` and timer services. Proposed domain APIs and internal legacy helpers are distinguished in §16.2 and the §8.4 disposition table; a legacy payroll service mentioned for comparison is not marked as a designed screen call.

### 14.3 Acceptance walkthroughs

These are implementation acceptance scenarios, not claims that they were executed for this document. Use small deterministic fixtures and synthetic non-statutory rules for core tests. Real-jurisdiction fixtures require a chosen, maintained localization. Keep specs well under 15 seconds; volume/end-to-end tests exceeding the repository limit require explicit permission and are not run for this design.

| Scenario | Required result |
| --- | --- |
| Hire, complete a legacy relationship and rehire | Exactly one Person and appropriate Employment per transaction; no duplicate PrtEmployee link; rejected overlapping employment; rehire retains previous employment and payroll history; login optional. |
| Transfer, manager change and separation | Dated assignments and seat occupancy remain coherent; hierarchy cycles and stale writes fail; final-pay/tasks and access requests are independently visible; another active employment is respected. |
| Confidentiality across every path | Self, manager, recruiter, interviewer, payroll and finance receive only their fields/records. Negative cases use valid IDs/parameters. Direct service/entity APIs, files/preview, Chatter, search, counts, exports, Assist and invoice/payment/GL drill-down cannot reveal protected data. |
| Partial-day leave and simultaneous requests | Two distinct same-day requests work without key collision; charged duration reflects schedule/holidays; concurrent approval cannot overspend balance; cancellation reverses exactly once. |
| Accrual and schedule changes | Repeated accrual job is idempotent; employee failures do not block peers; changed schedule/carry-over dates preserve previous ledger facts and produce explained adjustments. |
| Attendance, timesheets and DST | Duplicate punches are ignored by source key; missing punches and employment ambiguity are exceptions; overnight/DST intervals are attributed correctly; attendance plus timesheet evidence pays each entitlement once. |
| Source lock and worker invoice collision | Submitted time locks remain; payroll and worker-invoice attempts against the same worker-side input cannot both consume it; customer billing is unaffected; finalized pay prevents destructive reopen. |
| Salary/rate change and mixed pay | Mid-period salary/rate change splits inputs; hourly, salaried, bonus and piece-quantity examples reconcile without assuming statutory agricultural rules; missing units/currency and dependency cycles fail clearly. |
| Regular, off-cycle and correction runs | Same period/pay date can have separately identified valid slips; consumed inputs cannot be paid again; corrections link original facts and reconcile YTD and open-period obligations. |
| Failure and restart | One bad worker leaves successful calculations durable; kill/resume and duplicate submit create no duplicate slips/obligations; explicit exclusions remain in totals and approval. |
| Approval and concurrent finalization | Self-approval and stale approvals fail; changed policy/input/pay date invalidates relevant approval; shared worker accumulators serialize and cause recalculation when stale. |
| Localization readiness | Missing/expired coverage blocks live finalization; preview-only demo cannot emit obligations; historical 2015 fixtures never activate because the group uses a US address. |
| Accounting and posting | Payroll creates draft linked obligations once; Accounting posts them once through SECAs. Gross/deduction/employer-cost/net/clearing totals reconcile; posting failures and incomplete run finalization block release. |
| Payment and bank changes | Calculation approval never authorizes payment; changed bank details invalidate payment-run approval; partial, unknown, returned and void/reissue outcomes preserve original references and reconcile. |
| Expense reimbursement and advances | Self claim → manager decision leaves InvoiceReceived → finance approves. AP and payroll cannot both reserve/pay. The §9 1,000 + 100 − 40 example delivers 1,060 with correct separate applications and no duplicated expense. |
| History and provider exchange | Reimport is idempotent; history import makes no invoices; legacy plus opening balances cannot double-count YTD; native and external processing cannot overlap; bad rows are reported independently. |
| Qualifications and reviews | Expired/unverified certificates cannot meet a verified staffing requirement; training retry grants once; private review notes remain private through release and exports. |
| Navigation and devices | Every screen/form is reachable for its role; refused deep links show Not available; phone lists contain name and state/amount; custom chart/roster/matrix has an equivalent TUI action path; no UI-only permission enforcement. |

### 14.4 Delivery dependencies

Implement privacy/access and complete employment first, then organization/positions and shared self-service; add schedules/leave/attendance over existing time; add components/assignments/inputs, calculation and independent result identities; finish Accounting/privacy/source-consumption integration before any live payroll. Recruiting, development and reviews can proceed on the common employment/approval foundation. A native core may ship in demonstrable preview mode without claiming operational statutory coverage; production activation requires a validated localization, migration reconciliation, financial integration and acceptance of the supported operating scope. No payroll UI should enable the legacy destructive services as a temporary shortcut.

## 15. Documents and outputs

All print documents use `html-print` and the existing PDF tool. Issued documents store their rendering timestamp and canonical record link; later downloads preserve the issued statement rather than silently re-rendering changed policy. Locale, language, currency and timezone come from authorized organization/user settings.

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Employment/offer and lifecycle letters | html-print/PDF; restricted delivery | OfferDetail, EmploymentChange | Frappe Job Offer; record document templates |
| Employee directory | scoped CSV/XLSX/print | Employees | public directory projection only |
| Badge | print with revocable opaque token | Employee360; kiosk provisioning | Odoo employee badge; framework barcode support; never tax ID or reusable login password |
| Leave decision/balance statement | notification; PDF/CSV | LeaveRequestDetail, LeaveBalances | Frappe leave ledger; Commons domain notifications |
| Shift/attendance/timesheet | PDF/CSV/XLSX | ShiftRoster, Attendance, shared TimesheetDetail | Frappe roster; Projects TimesheetPrint |
| Payslip | issued restricted PDF and authenticated availability notice | PayslipDetail | Frappe salary-slip layouts; historical Mantle check stub |
| Payroll register and reconciliation | restricted CSV/XLSX/PDF | Reports, PayRunDetail | Frappe salary register; historical CheckReceiptRegister template |
| Payment/bank files | Accounting-owned output, link only | PayRunDetail settlement | Mantle PaymentRun/Nacha/PositivePay services where supported; no second People exporter |
| Statutory statement/file | later localization output | PayrollStatements | validated localization; historical PayrollDocumentServices reference only |
| Expense claim and receipts | PDF; scoped evidence bundle | ExpenseClaimDetail | MyAccount expense invoice; Frappe Expense Claim |
| Qualification/training completion | restricted certificate/PDF | TrainingDetail, Qualifications | Carbon qualifications; Frappe training results |
| Review release | restricted PDF and availability notice | ReviewDetail | Frappe appraisal; no private manager notes in employee copy |
| Employee/employment setup import | staged CSV preview/commit | Settings, HireEmployee | Frappe employee import; proposed PE-19 mapping/identity reconciliation |
| Time/attendance import | staged CSV/device records | TimeImport | Mantle time imports; Frappe check-ins |
| Payroll history/provider exchange | manifest plus CSV input/output and row-result file | PayrollExchange | Odoo work-entry export; Mantle historical external pay |

Exports are jobs when bounded synchronous output would be too large, use short-lived authorized downloads, and recheck access at retrieval. Salary files, resumes, reviews and grievance evidence cannot be publicly shared through generic RecordFiles links. Delivery notifications carry safe labels and record links, not pay amounts, medical reasons or confidential subjects.

## 16. Framework and data needs

### 16.1 Needs register

All additions below are proposed. Business records, domain validation, money and approval decisions belong to Mantle; BOSS supplies access context, screens and app-specific presentation. Existing services are extended where their semantics match. No BOSS pass-through service layer or second HR copy of Party/Invoice/WorkEffort is introduced. Each need is also registered in crosscut §7.5.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| PE-01 People access and confidential projections | service type, data model, seed data | Scoped domain permissions; protected HR host/content and payroll-origin financial links; explicit participant checks | All screens, shared mounts and financial drill-down | Check organization/self/team/participant and field category at read/write; restrict generic entity access and every alternate output; no broad Party grant leaks child HR data. |
| PE-02 Employment lifecycle | data model, service type | Dated EmploymentAssignment; guarded PeopleServices hire/change/history; extend EmploymentServices salary access | Employee360, HireEmployee, EmploymentChange, checklists | Reuse identities; atomic employment/assignment write, optional account, idempotent post-commit tasks; effective history and rehire preserved. |
| PE-03 Organization and positions | data model, service type, seed data | OrganizationServices; PositionServices extensions; dated seat/requirement guards; HR lookup seeds | OrgStructure, OrgChart, job classes, positions, grades | Cycle/occupancy/organization/date validation; planned-position approval; computed vacancy; salary bands do not rewrite pay. |
| PE-04 Recruiting and offers | data model, service type, seed data | JobOpening, EmploymentOffer, application opening/event/form links; Applicant role and status flow; RecruitingServices | Openings, ApplicantPipeline/Detail, OfferDetail | Approved positions feed openings; private panel/scorecards; accepted offer consumed once into hire; no obsolete requisition sketch. |
| PE-05 Attendance and kiosk | data model, service type, seed data | AttendancePunch, AttendanceDay/correction; device grants; AttendanceServices | SelfService, Attendance, ClockingKiosk, TimeImport | Raw evidence immutable, duplicate key guarded, corrections approved, online kiosk identity minimal; geo off by default. |
| PE-06 Working schedules and capacity | data model, service type | WorkingSchedule/Line, dated assignments, ShiftAssignment; ScheduleServices; extend ResourceServices and TimesheetServices | schedules, roster, leave, Projects capacity | People schedule before existing fallback; holidays/leave once; timezone/DST/cross-midnight handling; no capacity fork. |
| PE-07 Leave entitlement ledger | data model, service type, seed data | LeaveType/Policy/Assignment, LeaveRequest/segments, LeaveAllocation, LeaveLedgerEntry, accrual rules; LeaveServices | Leave screens, SelfService, HoursForPay | Ledger/reversal and request IDs; concurrency-safe balance/reservation; idempotent accrual; calendar/pay input projections carry source IDs. |
| PE-08 Pay configuration | data model, service type, seed data | PayrollComponent/terms/account mappings, PayrollStructure/Component, PayrollAssignment, PayrollGroup; PayrollSetupServices | compensation, components, structures, assignments, groups | Effective configurations; salary/rates remain their existing records; guarded formula terms and readiness; no implicit country/currency. |
| PE-09 Pay input and calculation | data model, service type | PayrollInput/Source; PayrollInputServices; constrained decimal evaluator; source-consumption guards in time/invoice writers | HoursForPay, PayAdjustments, PayRunDetail | Approved authoritative inputs; component dependency/unit checks; explanation and decimal rounding; worker invoice/payroll collision prevented. |
| PE-10 Payroll runs and results | data model, service type, seed data | PayrollRun/Employment, Payslip/Item, derived accumulators; PayrollRunServices and PayrollResultServices | PayRuns, Payslips, correction flows | Independent IDs, per-worker transactions/retry, stale approval protection, same-day off-cycle, immutable final results and linked corrections. |
| PE-11 Accounting handoff | data model, service type | PayrollObligation links; native Invoice/Payment/PaymentRun extensions and payroll-finance projections | PayRunDetail, InvoiceDetail, ExpenseClaimDetail | One obligation per source/payee bucket; finance release only after complete run; native posting once; preserve source dimensions and settlement states. |
| PE-12 Payroll localization | data model, service type, seed data | Dated PayrollTaxProfile and localization registration/coverage; PayrollLocalizationServices interfaces | PayAssignments, PayGroups, PayrollStatements | Curated calculation/report modules and declared bases; unavailable statutory coverage blocks live finalization; historical fixtures never auto-activate. |
| PE-13 Expenses and advances | data model, service type | ExpenseClaim extension/decisions/reservation; EmployeeAdvance references; ExpenseServices; extend create#ProjectExpenseInvoice | claims, advances, Accounting ExpensePosting | Non-project employee claim; manager approval distinct from InvoiceApproved; original invoice settled once through AP or payroll; advance applications reconcile. |
| PE-14 Skills and qualifications | data model, service type, seed data | Refined PartyQualification, TrainingClass, PersonTraining; DevelopmentServices; qualification requirement extensions | SkillsMatrix, Qualifications, Training, staffing | Verified evidence, validity dates, source-linked training grant; no private certificate data in staffing responses. |
| PE-15 Domain approval policy | data model, service type, seed data | PeopleApprovalPolicy and explicit decisions; PeopleApprovalServices; domain notification topics | People Approvals, leave/expense/pay/recruiting actions | Dated routing with alternate, no self-approval, source revision and per-step outcomes; domain action rechecks authority; independent bulk failures. |
| PE-16 Reviews and goals | data model, service type, seed data | Refined PerformanceReview/Item/Note, ReviewCycle/Template; WorkEffort goal metrics; ReviewServices | review cycle/detail, Goals | Participant/step visibility, controlled release and acknowledgment; goals remain WorkEffort; private notes never public Chatter. |
| PE-17 People outputs and reporting | service type, render mode | PeopleReportServices, restricted print templates, stored issued PDFs and export jobs | Reports, payslips, offers, claims and reviews | Scoped projections, declared denominators/currencies, historical rendering and access-checked download. |
| PE-18 Shared mounts and shell providers | shell item, service type, seed data | Employee360/PeopleSelfService registry; authorized link/search/Today/quick-create/notification providers; shared form/calendar/content contexts | Commons, Projects, Admin, Accounting and People | Context narrows but grants no authority; Commons owns personal area and forms; private content stays on canonical sensitive host. |
| PE-19 Imports and migration | data model, service type | Import/exchange batches, source mapping/manifests; PayrollExchangeServices and employee/attendance staging | Settings, HireEmployee, TimeImport, PayrollExchange | Preview/reconcile/approve; independent row outcomes and source-key replay; historical import never creates obligations or doubles opening balances. |
| PE-20 HR visual screens | Vue component | OrgChart, ShiftRoster, SkillsMatrix qvue screens and TUI twins | three named screens | Bounded/pageable data; keyboard/list action parity; no graph/drag-only mutation or private overfetch. |

No new protocol, PDF engine, general approval inbox, calendar store, survey engine or task system is required. Shared questionnaire ownership is Commons, with the existing Customer Service form design as the initial pattern; People must register any private-response access extension before using it. The decimal formula evaluator is the only new calculation facility called out; whether its sandbox helper is implemented in framework Rust or a Mantle-native tool follows implementation profiling and the framework’s existing expression capabilities, with the above interface/security behavior fixed.

### 16.2 Proposed interfaces and invariants

The form tables name the intended operations; this table fixes the service-family contracts. All domain prefixes below are `mantle.humanres`, except the existing `mantle.work` capacity/time and `mantle.account` financial APIs. These are proposed interfaces, not services added by this documentation task. XML Actions handle entity/service orchestration; complex calculation, scheduling, CSV and reporting can use per-area script modules as the application practices prescribe.

| Service family | Inputs and outputs | Required behavior |
| --- | --- | --- |
| PeopleServices / OrganizationServices / PositionServices | Actor-derived scope plus employer, party/employment/position, effective date, declared changed fields, expected stamp; return keys, authorized display projections and impact/findings | Atomic lifecycle/assignment changes; known roles/options; no arbitrary context-map update. hire#Employee internally coordinates person/role plus EmploymentServices.create#Employment exactly once; it does not call both relationship-creating services blindly. |
| RecruitingServices | Opening/application/offer IDs, action, dates, participant/scorecard fields, expected stamp; return state, next actions and authorized links | Stage guards, panel-only feedback, approved offer terms and idempotent hire consumption. |
| AttendanceServices / ScheduleServices | Employment/device/source ID, timestamps and local zone, interval/schedule/shift, action/reason; return immutable event key or approved interval, flags and projection references | Raw/approved distinction; no client-supplied employee authority; ordered interval validation and replay-safe imports. |
| LeaveServices | Employment, policy/type, segments, as-of date, request/ledger source, decision and expected stamp; return duration/unit, ledger balances, pending reservation, state and findings | Allocation/accrual/request operations serialize affected entitlement; cancellation reverses once; date-derived duration and approved projections. |
| PayrollSetupServices | Employer/group/component/structure/assignment, effective interval, declared parameters, examples, account mapping; return readiness, validated dependency order, explanatory preview and published dates | Controlled decimals/formulas, no executable service configuration in forms; preserve salary/rate sources and audit history. |
| PayrollInputServices | Group/period/employment, cutoff, source keys, units/quantities/amounts, adjustment reason and approval; return input IDs, source reservations, reconciliation and errors | Approved authoritative inputs; per-source uniqueness and worker-side payment collision guard across all callers. |
| PayrollRunServices | create/select/prepare/calculate/get/approve/finalize/correct operations use run ID, explicit operation key, expected revision/stamp and actor scope; return run/worker IDs, counts, states, totals by currency, reason-coded findings and obligation links | No financial mutation during calculation; per-worker transaction/results; finalization and accumulators protected by locks; invoices linked uniquely and released only after reconciliation. |
| PayrollResultServices | Payslip ID or explicitly typed legacy key, authorized person/range, issue action and locale; return component explanations, declared totals, correction chain and permitted output link | Own-issued versus payroll-draft access; output remains stable after issue; no legacy recalculation fallback. |
| PayrollLocalizationServices | Registered jurisdiction/rule binding, effective/pay dates, declared employee/employer profile, pay facts and accumulators; return bases, amounts, explanation and blocking findings; statement methods take finalized scope | Side-effect-free calculation; no invoices/payments; explicit effective coverage; legal output/provider validation separate from native core tests. |
| ExpenseServices | Invoice/advance, employer/employment, claim lines/content, decision and route, expected stamp; return business/finance states, source reservations and native settlement references | Employee-scoped draft writes; business approval never calls financial approve; payroll reimbursement links the original invoice. |
| DevelopmentServices / ReviewServices | Party, requirement/as-of date, qualification/enrollment/review/goal, evidence, action and expected stamp; return scoped assessment/progress/validity and permitted next actions | Verified qualification checks have minimal staffing output; review steps and released text are separate from private notes; completion grants once. |
| PeopleApprovalServices | Transaction kind, canonical key, effective policy, employee/employer/context and decision; return steps/actors, source revision, state and reason | Resolve/preview cannot grant rights; domain decision services validate live state, no self-approval, durable decisions and alternate routing. |
| PeopleReportServices / PayrollExchangeServices | Registered report/exchange kind, authorized filters, manifest/mapping, file, cutoff, approval; return paginated safe rows or durable batch outcomes/output links | No unrestricted report/query names; inputs interpreted as data; CSV injection-safe exports; rows with failures do not discard successful independent rows. |

Every list returns normal pagination metadata and localized names/dates; service outputs are declared. Writes return stable keys, state and reason codes, not functions or arbitrary entity/context maps. Dates use employment/schedule zones where business-day meaning matters; user display uses localization helpers. Money values remain decimals and group by currency. A stale expected stamp/revision refuses the mutation with a retryable review requirement, never a silent overwrite.

Expected independent failures run in separate transactions with isolated message/error state, as [Services](../../../../docs/logic/Services.md) describes. Strictness remains at the employee’s pay transaction, balance reservation, security check and financial integrity boundary. File/worker iteration logs the source identity and continues; a failed job does not clear another worker’s successful result. Operation keys identify actual business attempts and source facts, not caller names or random client retries.

### 16.3 Validation of this design

Review the screen table against its sections and the research mapping, all Needs references against §16.1, existing names against active XML (excluding comments), and relative links/anchors against the current files. Inventory edits are additive only and leave implementation evidence unchanged. Runtime screens, permissions, entities, tax data and service implementations are deliberately untouched by this design pass. No build, server spec, browser spec or slow test is required to validate Markdown and source references.

## 17. Decided

| Decision | Notes |
| --- | --- |
| Full People design on Mantle | All research candidates are accounted for in §14.1. This is an application design, with concrete screens/forms and model/service needs, not a promise that existing placeholder screens implement it. |
| Incomplete historical payroll | Supersede research §9/§18’s “working US engine; UI plus tax data” assumption. The later commercial version is unavailable; its approximately 10,000 agricultural-worker history is context only. |
| Native, country-neutral payroll | Components, structures, assignments, runs and independent payslips; no first jurisdiction selected. Existing salary/rates and accounting integration retained where suitable. |
| Broad workforce | Hourly/salaried and configurable quantities/premiums/benefits; agricultural examples reveal extension points. No invented reconstruction of crew, seasonal, piecework or regulatory capabilities from the commercial product. |
| Payroll history and correction | Preserve historical data; migrate only with explicit mappings/reconciliation. New same-date off-cycle/correction results have identities; finalized results are not deleted by reopening a period. |
| Approvals inbox (research open) | One Commons Approvals mount filtered to People topics, also embedded on Home/MyTeam. Domain services own policy, balance and decision validation. |
| Requisitions (research open) | Planned EmplPosition plus recorded approval; JobOpening is recruiting publication/intake. Do not enable obsolete JobRequisition. |
| Commented HR entities (research open) | Refine skills/qualification/training/review models in Mantle, with proper identity, validation and visibility; never enable sketches unchanged or recreate the business model in BOSS. |
| Leave request identity (research open) | New identified request with segments and ledger; EmploymentLeave retained as legacy evidence, not extended into an inadequate start-day key. |
| Careers (research open) | PASS public layer, later; People owns staff opening/applicant records. No anonymous entrypoint under the BOSS root. |
| Personal Me (research open) | Commons personal surface hosts SelfService and Home/Today cards; one shared definition and owner routes, no separate employee database or standalone PWA. This supersedes the older Commons open recommendation. |
| Grievances (research open) | Shared Request with an explicit confidential type/participant policy across every read/write/output. No general HR or manager access; linked tasks do not widen case ACL. |
| Goals (research open) | Dedicated People goal view over WorkEffort, with typed metrics when needed; reuse tasks and relationships rather than another task system. |
| Attendance and time | Presence evidence is separate from project work; explicit pay source avoids double-counting. Reuse Projects’ weekly approval/locks and capacity contract. |
| Expense approval and reimbursement | Manager decision does not reach InvoiceApproved. One original claim invoice, one settlement route; payroll displays/reconciles its reimbursement without recreating expense/payable lines. |
| Accounting owns money movement | Preserve native invoice/payment automation; no direct payroll journals or period-wide legacy payment actions. Payroll-finance privacy must cover ledger/payment outputs as well as payslips. |
| Dates and documents | Effective rows, audit log and issued PDFs; run, payslip and decision records are independent business facts, not generic snapshot/version tables. |
| Later capabilities | PASS careers, full LMS delivery, roster optimization/swaps, offline kiosk synchronization, advanced industry operations, country statutory packs and provider-specific filing/bank connectors. PayrollStatements has an explicit later screen; the other deferred candidates are not placeholder menu entries. |
| Baseline actions not copied | Arbitrary Party roles/settings/group/account editors stay with their owner applications; worker/customer invoicing remains Projects/Accounting. Legacy payroll processing/reopen/year-end services are not new People form calls. |
| Documentation-only implementation | Update this design, crosscut/shared ownership, research correction and Designed-in traceability. No runtime artifact, fixture or historical record is changed by this document. |

## 18. Open

Core ownership and workflow choices are decided above. These release-specific questions do not authorize an implementer to enable incomplete behavior:

- **First operational localization and its maintenance owner.** No country is chosen. Recommended: select one bounded employer/jurisdiction scope with a named maintainer, authoritative rule sources, effective-date updates, certification fixtures and supported output list before enabling live payroll. Until then keep the core demonstrable in preview mode only.
- **First external payroll/bank connector.** Recommended: begin with the explicit CSV manifest/reconciliation contract, then add a named provider against documented idempotency, result and return handling. Do not infer connector availability from generic bank-file services.
- **Employer retention and sensitive-field requirements.** Recommended: document per-purpose retention, holds, authorized custodians and permitted self-service changes for the target deployment before importing live applicant/medical/identity records. Do not hard-code one country’s retention periods into the core.
- **Advanced agricultural operations and measured scale.** Recommended: collect concrete crew, piece-rate, seasonal, contractor and jurisdiction scenarios before extending the general inputs model. Agree a workload and performance target only when needed; the historical commercial deployment is not a benchmark of this code. Any slow scenario test remains opt-in under repository rules.
