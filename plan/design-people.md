# IronStone BOSS — People design

Nov 13, 2026 — impl-people P31 review, the lead's call (impl-people §4, open to the user's override): PAYROLL_VIEW alone is no People staff read (§1.1): a payroll reader reads People's employees and pay only with a People read permission beside it, so the payroll operator and approver hold PEOPLE_DIRECTORY_VIEW, and Accounting's Payroll finance (`BOSS_ACCOUNTING_PAYROLL`), whose PAYROLL_VIEW opens payroll-origin documents in Accounting, reads no People employee, compensation, pay run or payslip.

Nov 13, 2026 — impl-people P31 (finish): §2's Impl column names the phase that built each screen (TalentPool, TravelRequests and PayrollStatements stay later, impl-people §7); §16.1 marks the needs built; every People list of more than two fields has its two phone columns (§1.1's mobile columns: the approval steps and decisions of ExpenseClaimDetail, LeaveRequestDetail, PayComponentDetail, PayStructureDetail, ReviewDetail and OfferDetail, LeaveRequestDetail's blocked days, ExpenseClaimDetail's payments, PayAssignments' profile, PayslipDetail's year to date, PayRunDetail's inputs taken, ReviewDetail's notes, Employee360's pay changes waiting and MyPayslip's corrections); §14.3's "Confidentiality across every path" and "Navigation and devices" are acceptance walks (PeopleReviewWalk, PeopleNavigationWalk, PeoplePhoneWalk) and the screens' tui and server-static sweeps PeopleTui and PeopleServerStatic.

Nov 13, 2026 — impl-people P28 as built: the payroll exchange (§8.4's as-built paragraph, PayrollExchange, PayGroups, §15): `PayrollExchangeBatch` and `PayrollExchangeRow` (Mantle `PeoplePayrollExchangeEntities.xml`) and `PayrollExchangeServices` (`preview#Batch`, `reconcile#Batch`, `execute#Batch`, `get#Batch`, `find#Batches`): an export of a pay group's period's approved inputs with its manifest through Admin's export target `payrollExchangeInputs`; an import of payroll history as historical pay records (`EmploymentPayHistory`, never an obligation, a day People paid refused); an import of an external processor's results for a group in external processing (`PayrollGroup.externalProcessing`, never calculated here) as the period's pay run, approved and finalized as any run, refused until the group is live and the payroll-origin projection is in place; the import target `payrollExchange` with its `findService`. The user's calls of Nov 13, 2026: the qualifications dataset leaves out identity documents and work permits (§1.4); employer contributions post when Accounting approves the payee's invoice, People making no ledger entry (§8.2, as built); a percentage recovery cap with no earlier net waits a period or takes an amount cap, never uncapped, and (P28's review) the amount and the percentage may be set together, the amount bounding the percentage (§8.2).

Nov 13, 2026 — impl-people P27 review, on the user's calls of Nov 13, 2026 (§8.2's review paragraph after P27's as built): Accounting's new Payroll finance group (`BOSS_ACCOUNTING_PAYROLL`, demo `finance.payroll`) approves and pays payroll invoices, no other finance group holding PAYROLL_VIEW; Overpayment recovery (PayRecovery, beside Pay groups) sets the recovery deduction and the cap, an amount or a percentage of net pay; a deduction's or employer contribution's term names its payee, and finalization makes one invoice for each payee and liability account, employer contributions included; finalizing issues each final slip's statement. Also in the review: each finalization step commits on its own (the run never goes back to Approved behind a final employment); the payroll-origin mark on Invoice, Payment and AcctgTrans (a payment made by hand and applied to a payroll invoice hidden too) and the projection on the remaining finance paths (design-accounting ExpensePosting); a leaver's receivable posts.

Nov 12, 2026 — impl-people P27 as built: the Accounting handoff and settlement (§8.2 steps 6 and 7, §8.3, §9's payroll route, §8 PayRunDetail's Finalize and Settlement, PayGroups' localization binding and live pay, §13 InvoiceDetail's payroll branch): `PayrollObligation` and `PayrollRecovery` (Mantle `PeoplePayrollObligationEntities.xml`); `finalize#Run` (refused for a group that is not live, which every group of this build is: the demonstration localization is never live), `get#Settlement` and `get#Obligation`; payslips made final at finalization; a claim on the payroll route linked as it is; an advance's recovery reconciled to the advance; an overpayment recovered by capped deductions on the next regular runs or from a leaver as a receivable (`NOT_IN_GROUP` lifted for an employment ended by the period's last day); Accounting's payroll-origin projection (AC-23) built as its owner contract (design-accounting ExpensePosting).

Nov 12, 2026 — impl-people P29 review, on the user's calls of Nov 12, 2026: People's datasets keep Mantle's organization row filter with People's Insights bundle as the grant; the Insights data steward stewards them (admission and index refresh) without reading their rows; Reports stays hidden from managers; ending an employment updates or removes its holder's qualification documents (§1.4 Shipped reports). Also in the review: an expense manager reads the expense claims report for the employers they manage, and a change of the confidential case intake names the settings revision it read (§12 Settings).

Nov 12, 2026 — impl-people P29 as built: reports, Insights and settings (§12 Reports and Settings, §1.4 Shipped reports and Assist, §1.2): People's Reports (menu 14, the readers of a report's: HR, recruiting, development and payroll, `BOSS_PPL_REPORTS`) over Mantle's `PeopleReportServices` (`get#Options`, `run#Report`: headcount as of a date with joins, exits and turnover over the average headcount with its denominator said, by employer or department; vacancies and the hiring funnel by opening and source; attendance exceptions; leave balances from the ledger; expense claims and the payroll register in each currency apart, the register a payroll reader's alone; qualification expiry; review completion), each exported as CSV from the same projection, safe from spreadsheet formulas; Settings' readiness with every phase's checks, each linking the place that sets it up; Preferences (PeoplePreferences: the employer's clocking default and its confidential case intake handlers, `PeopleServices.get#Settings` and `store#Settings`, each change audit-logged with its reason; an HR editor sets the clocking default from Who clocks); three shipped datasets (`InsDcPeople`: employments, the leave ledger, qualifications; no pay), a workforce dashboard and the qualifications expiring alert template, read in Insights with People's Insights bundle (`BOSS_PEOPLE_INSIGHTS`); People's eight catalog entries, two measures, three attention providers and the internal flow map's People step; the `people-hire` and `people-policy-question` skills, aliases, and the root's "Log as note" (an application) and "Send as message".

Nov 12, 2026 — impl-people P26 review, on the user's calls of Nov 12, 2026: the self-only `people_my_payslip` tool returns the person's own issued slip with its amounts and names no stored statement's location (§1.1 "Pay and AI"); employees see their own legacy pay history in My payslips, historical and read only (§3 SelfService); a negative correction or a backdated separation is recovered in P27 (§8.2). Also built in the review: a corrected run keeps its approval and a correction of an off-cycle slip pays its adjustments' change alone (§8.2).

Nov 12, 2026 — impl-people P26 as built: payslips and corrections (§8 Payslips, PayslipDetail, §8.1 Payslip and PayslipItem, §8.2 corrections, §3 SelfService, §15 the payslip, §1.2, §1.4): an approved run's calculated employments become payslips with identities of their own (`Payslip`, one a run's employment, never keyed by employment and pay date; `PayslipItem`, each line with its rule and explanation), preview slips while the group is in preview mode (payroll's alone, never issued, withdrawn when the run's approval is taken back); a final slip (P27's) is issued once, its statement stored and the person told on `PayslipIssued` with no amount; a correction is a run of its own (`create#Correction`) whose slip pays the change and links to the original, which stays, with the net effect; an off-cycle run pays the period's approved adjustments no run took, on its own slip; year to date is derived from final and issued slips; the legacy pay history is read by its own key, never recalculated; the payslip content host (payroll's files); the person's own issued slips on SelfService's My payslips and `MyPayslip`, and the Assistant's `people_my_payslip` tool, the person's own amounts to their own session (the user's call, §1.1). Carried from P25's review: preparing inputs takes every employment of the period (more than 10,000 refused), nobody whose pay a run holds decides it, and calculating an approved run with nothing changed keeps its approval.

Nov 12, 2026 — impl-people P25 review, on the user's calls of Nov 12, 2026: a fixed amount's proration in a part period is its term's setting (PayComponentDetail's Prorated in a part period; yes by default for an earning, a deduction and an employer contribution, no for a statistical value; a one-off amount is an adjustment, never prorated) (§8 PayComponentDetail, PayRunDetail); a staged `employees` import row's salary is shown only to a PAYROLL_VIEW holder and cleared once the row is applied (§12 EmployeeImport; design-admin §11.1's restricted columns); Projects' Profitability worker cost is opted out of AI (§1.1 "Pay and AI"; design-projects §11). Also built in the review: a period splits where a structure line or a component term changes too, a draft or calculated run not approved is cancelled with its reason (`cancel#Run`, its inputs released), and a run's population is never cut short (§8 PayRunDetail).

Nov 12, 2026 — impl-people P25 as built: pay runs (§8 PayRuns and PayRunDetail's first four steps, §8.1's calculation sequence, §8.2 steps 1 to 5, §12's `PayrollRunApproval`, §1.2): a pay group's regular run for a prepared period, its population per employment, each employment calculated in its own transaction in bounded calls that resume pending, failed and changed ones (the period split where the assignment, salary or pay rates change, prorated by the group's policy, each money line rounded to the currency once), and approval by a payroll approver who neither selected nor calculated it, bound to the exact population, amounts and source revisions; no invoice or payment. The user's calls of Nov 12, 2026 carried in it: the `employees` import takes a first salary for an importer who holds PAYROLL_EDIT (§12 EmployeeImport), the worker rates on a time entry are opted out of AI (§1.1 "Pay and AI"), and a worker invoice refuses an employee's time (design-projects §8).

Nov 12, 2026 — impl-people follow-up 4, on the user's calls of Nov 12, 2026: the badge lock grows (each lockout twice as long as the one before, 15 minutes first, until a right PIN) and twenty wrong PINs within a day stop the badge until HR resets its PIN or issues a new one, telling the employer's HR editors (`PeopleKioskBadgeDisabled`) and the worker (`PeopleMyKioskBadgeDisabled`, opening their SelfService), no number or PIN; the kiosk refusals notice goes to the access administrators whose scope covers the device's display account too, and opens the device in Admin's Security › Devices for a recipient who may open it there, no link for the others (§6 ClockingKiosk); printing a badge is a POST from Employee360 answered with the printable badge, and BadgePrint's page makes nothing (§4 Employee360, §15 Badge).

Nov 12, 2026 — impl-people P30 review, on the user's calls of Nov 12, 2026: the worker sets their own badge PIN in SelfService's My clocking badge (HR issues a badge with a one-time PIN or none, resets a forgotten PIN the same way, and never learns the worker's; the badge works at no kiosk until the worker has set theirs), §3 SelfService, §4 Employee360's Clocking badge, §6 ClockingKiosk; a device with many refusals checks its next proof after a pause of at most a few seconds instead of refusing everyone, a burst tells the device's HR editors at most hourly (`PeopleKioskRefusals`), and refused attempts are kept 90 days (§6 ClockingKiosk); issuing again is the reprint (§15 Badge).

Nov 12, 2026 — impl-people P30 as built: the clocking kiosk (§6 ClockingKiosk, §1.4 Devices, §4 Employee360's Clocking badge, §15 Badge): `People/Time/ClockingKiosk`, a page of its own that a registered device opens as its display account (route group `PEOPLE_CLOCKING`, the kiosk bundle `BOSS_PEOPLE_KIOSK` with `PEOPLE_KIOSK_PUNCH`); a worker clocks by a badge's number (scanned or typed) and a PIN, both kept only as hashes, wrong PINs counted and limited (`AttendanceServices.record#KioskPunch`, only in a device's request, Mantle's `KioskIdentity.js`); HR issues a badge with the worker's PIN from Employee360 and its issuer prints it once (`Employees/BadgePrint`).

Nov 12, 2026 — impl-people P24 review, on the user's calls of Nov 12, 2026: a first salary asked directly through `create#EmploymentSalary` waits as a pay change for the employer's payroll approvers (only a `PAYROLL_REPAIR` holder writes at once; a hire from an approved offer records its pay); pay amounts are opted out of AI (§1.1 "Pay and AI"); hours for pay show a manager their reports' time inputs alone; pieces are payroll's on any time basis, an invoiced or unapproved week of them blocking the employee; Projects' bulk rate reset keeps a worker rate a finalized input paid and voids an input not finalized whose rate it changes; preparation locks the time entries it consumes against a worker invoice; an advance recovery is checked against what the advance has left again when approved.

Nov 12, 2026 — impl-people P24 as built: pay inputs and hours for pay (§6 HoursForPay, §8 PayAdjustments, §8.1 PayrollInput and PayrollInputSource, §12's `PeoplePayAdjustmentApproval`, §1.2): a pay group's period reconciled and prepared per employment, the group's time basis deciding which stream pays a worked day, each entitlement paid once and each source consumed once; payroll's adjustments approved by a payroll approver; the source guards in Mantle's time and invoice writers (owner contract, design-projects §8). Hours for pay under Time & leave (payroll's and the managers', no amount), Pay adjustments under Payroll.

Nov 12, 2026 — impl-people P23 review, on the user's calls of Nov 12, 2026: a pay change (the first salary too) waits for a People approval of its own kind, `PakPayChange`, on PeopleEmploymentChangeApproval, decided by the employer's payroll approvers (PAYROLL_APPROVE with PAYROLL_VIEW) unless an employer's rule of the kind routes it (to the manager, who then reads that change's salary alone), never by who asked; a hire from an accepted offer records the offer's approved pay as the first salary; `create#EmploymentSalary` sets only a first salary, a later one only through the approved pay change or by an audited repair with PAYROLL_REPAIR (ADMIN's) (§1.1, §4 Employee360 and EmploymentChange, §5 HireEmployee from an offer, §12).

Nov 12, 2026 — impl-people P23 as built: pay assignments and compensation (§8 PayAssignments, §4 Employee360's Compensation and EmploymentChange's pay change, §8.1, §1.2, §12): an employment's dated `PayrollAssignment` (a published structure and a pay group of its employer in one currency, one primary per employment and date across every group, its own input values and the elective lines it takes), its `PayrollTaxProfile` (the values of the fields its group's localization declares, `PayrollLocalizationField`; the demonstration's alone), its benefits (Mantle's EmploymentBenefit) and a masked reference to its bank accounts, changed through Accounting; PayAssignments under Payroll (menu 3) with each employment's readiness; Employee360's Compensation, a payroll reader's alone; `create#EmploymentSalary` checking PAYROLL_EDIT and ending the row in effect; and the pay change, payroll's part of a change, on the PeopleEmploymentChangeApproval topic (the manager by default; the first salary set at once). A structure line's eligibility (every assignment, or one that elects it) and a structure's assignment count join PayStructureDetail and PayStructures; People's setup readiness gains a payroll check.
Nov 12, 2026 — impl-people P22 review, on the user's calls: payroll configuration (components, structures, groups and localizations) is changed with PAYROLL_EDIT and a permission of its own, PAYROLL_CONFIGURE, in place of PEOPLE_CONFIGURE (Mantle seeds it to ADMIN; BOSS grants it to the payroll operator and the People administrator); its five screens are under Payroll beside Rates, so Settings stays the People administrator's (§1.1, §1.2, §8); publishing a pay component's term or a pay structure's lines takes effect on a People approval of kind `PakPayrollConfig` (`PeoplePayrollConfigApproval`), decided by the employer's payroll approvers (or an HR editor who reads payroll), never one who drafted it or asked, and a changed draft supersedes the request (§8 PayComponentDetail, PayStructureDetail; §12).
Nov 12, 2026 — impl-people P22 as built: pay components, structures and groups (§8 PayComponents, PayComponentDetail, PayStructures, PayStructureDetail, PayGroups; §8.1; §8.4; §1.2): an employer's `PayrollComponent` (a code its formulas name, one of four kinds) with dated `PayrollComponentTerm`s (a fixed amount or a formula of the framework's decimal evaluator, PE-09, over declared inputs and other components' codes, its currency or a statistical value's unit, an optional rounding stage, payslip visibility and the account mapping on the term) verified by named `PayrollComponentExample`s and published with a reason, then only ended; `PayrollStructure`s in one currency with dated `PayrollStructureComponent` lines and a gross-to-net preview; `PayrollGroup`s with their periods (Mantle's `TimePeriod` and a pay date); the `PayrollLocalization` registration with the synthetic demonstration alone. All under Settings, the People administrator's; read with PAYROLL_VIEW, changed with PAYROLL_EDIT and PEOPLE_CONFIGURE (the review moved them to Payroll, changed with PAYROLL_CONFIGURE, and put publishing behind an approval, above).
Nov 12, 2026 — impl-people follow-up 3 (the user's calls on the Maintenance merge review's F390 and F393): §4 OrgStructure's teams take contractors (an agent of the employer) and a team's employer is read by one rule with Maintenance (its rollups, else its internal owner); §5 ApplicantDetail's interviews and §10 Training's sessions take a meeting room booked through Maintenance's resource booking (refused on a clash or blackout, moved and cancelled with the event); a session's time is off its people's availability for dispatch and staffing, not off a timesheet's expected hours; a team made outside People (no rollup) is read here and changed only where it was made; an agency's end ends the contractor's team memberships (follow-up 3's review, the user's calls of Nov 12).
Nov 12, 2026 — impl-people P20 as built: reviews and goals (§11 ReviewCycles, Reviews, ReviewDetail, Goals; §15 the review release; §12 the PeopleReviewStep topic; §1.2, §1.4): a dated review template of an employer (the self assessment, the reviewer's assessment, feedback the reviewer may ask for, the review form of each step, approval before release and whether feedback is shared), a cycle of an employer or a unit started into one review per person (the reviewer the manager of the live line; a person with none named and left out), each step answered once on its review form (People's `DbfpReview` purpose, now also a development editor's to build) and locked, the reviewer's private notes their author's alone (never released, exported, in Chatter, a notice or search), finalizing after a `PakReview` approval when the template asks, the release stored once as its page and PDF, the person's acknowledgment; goals are WorkEfforts of the new `WetGoal` type and `WepGoal` purpose with their measure (`PersonGoal`), in no task list; review steps join People's lifecycle participant and follow the separation's re-route. Review topics' titles name no person.
Nov 12, 2026 — impl-people P21 as built: grievances (§4 Grievances; §13 RequestDetail; §8.3's register; §1.4): a confidential case is a `Request` of the type `RqtHrCase`, an Enumeration of its own type (`RequestConfidentialType`, not a `RequestType`, so no other app offers or accepts it), whose row says nothing ("Confidential case", no description, project, store, facility, category, customer or organization party); what the employee wrote is on `PeopleCase` (subject, details, day, how to contact them, the outcome), opted out of AI. Its people are the employee who filed it (Reporter) and its handlers (Assignee, holding PEOPLE_CASE_HANDLE), the employer's designated intake handlers (the PartySetting `PeopleCaseIntake`) at filing; nobody else reads it, the manager, HR and ADMIN included, through any path (§4 Grievances "As built").
Nov 12, 2026 — impl-people P19 review: a session's event is changed on TrainingDetail alone (Commons' `check#EventAccess` leaves a training session's event uneditable and `add#CalendarEvent` refuses it); a place is approved before its session starts; the person is told the decision (`PeopleTrainingDecision`); a trainer reads their session while they work for its employer; Assessment forms under Skills & training, the learning administrator's (`PEOPLE_DEVELOP_EDIT` edits the training assessment purpose); SelfService's My training; the key `g i`; the user's two calls (§10: the course is the authority for a trainer's passing grant; the person reads only the outcome and score of their own assessment).
Nov 12, 2026 — impl-people P19 as built: training (§10 Training, TrainingDetail; §15 the completion certificate; §12 the PeopleTrainingApproval topic; §1.2, §1.4): a course (`TrainingClass`, an employer's, granting a qualification type for a number of months, never an identity document or work permit, and needing an assessment or not), its sessions (`TrainingSession` over a private WepTraining event made through Commons' `EventServices.create#Event`, its trainer and the people enrolled its attendees, each reminded a day before), a person's place (`PersonTraining`: asked for by the person and approved through People's approvals, the manager by default, or made at once by a development editor), the trainer's attendance and each assessment kept (`PersonTrainingResult`, its answers a response of a training assessment form locked by its FormInvitation); the passing assessment completes the place once, grants the qualification once (verified, the assessor its verifier) and issues the completion certificate, stored when issued (its page and PDF, never rendered again); the trainer reads only their session's assessments, the person their own outcome; Today's training due.
Nov 12, 2026 — impl-people P18 as built: skills and qualifications (§10 SkillsMatrix, Qualifications; §4 Employee360's Skills and reviews; §5 JobClassDetail's Requirements; §1.2, §1.4, §13 RecordFiles): each self-declaration and evaluation kept as a `PartySkillEvaluation`, PartySkill holding the accepted level and its source, a self-declared level satisfying no requirement; a `PartyQualification` of its own id (submitted by the person or an editor, verified, rejected or revoked by someone else, renewed by a new row), an identity document's or work permit's expiry required and its number the person's and HR's alone; job class requirements with a least level, the qualification type that proves them, required or desired and dates, ended when removed; `check#Qualifications` as the staffing answer with no number, issuer or file; the qualification's content host; the `QualificationExpiring` reminder and Today's item; Skills & training (Development) with the skills matrix (`.qvue` with its terminal twin) and Qualifications.
Nov 12, 2026 — impl-people P17 as built: offers and hire from an offer (§5 OfferDetail and ApplicantDetail, §4 HireEmployee and EmploymentChange, §12's `PeopleOfferApproval`, §15 the letters): an offer of employment (`EmploymentOffer`) of an interviewed application on a seat of its opening, drafted by a recruiter or HR, its pay set by payroll alone and read with PAYROLL_VIEW alone on every path, approved by the employer's HR unless a rule says otherwise (never its recruiter; changed terms make it a draft again and supersede the approval), issued with its letter stored once and never rendered again, accepted or declined, and hired from once by HR through the hire wizard (a second hire from it refused; it grants no account or pay record); the lifecycle letters of applied employment changes on the same template, each stored when issued; an applicant's resume shared with the interview panel when attached (the user's call of Nov 12, 2026).
Nov 12, 2026 — impl-people P16 as built: openings and applicants (§5 Openings, ApplicantPipeline, ApplicantDetail; §13 InterviewsCalendar and Forms; §1.4): an opening (`JobOpening`) of an employer's approved active seats, applications (`EmploymentApplication` with its opening, the Applicant role and the stages Received, Screening, Interview, Offer, Hired, Refused, Withdrawn; Hired never a move), mail intake by an opening's plus tag (`createApplication`), the application's private files, interviews as private events with a call link, the iMIP invitation and each panel member's scorecard (a form of the private interview scorecard purpose, read by its reviewer and the recruiters alone, opted out of AI), the interviews calendar (Commons' calendar and EventDetail mounted) and My interviews; the survey builder made any app's (a per-app registration, the form definition services in `mantle.party.FormDefinitionServices`) with People's Forms under Settings.
Nov 12, 2026 — impl-people P15 as built: expense claims and advances (§9 ExpenseClaims, ExpenseClaimDetail, EmployeeAdvances; §13 InvoiceDetail; §15; §1.2, §1.4, §3 SelfService): a claim is the employee-from Invoice made by `create#ProjectExpenseInvoice`'s claim write (`expenseClaim`: the claimant's own under a current employment, or an HR editor's for them; a project only one the claimant works on) and an `ExpenseClaim` keyed by it (employment, department, purpose, business state, route and reservation), its lines ItemExpense-family invoice lines with an `ExpenseClaimItem` (merchant, tax included, receipt, source, to review); submitted, the invoice is received and a People approval of kind `PakExpenseClaim` waits (`PeopleExpenseApproval`); approve, return for correction or refuse (the invoice cancelled); business approval leaves the invoice received and finance's `approve#Payable` approves only an approved claim not reserved for payroll, reserving it for accounts payable (`reserve#ClaimSettlement` is the payroll route's, P27); "Read receipt" proposes values from the receipt's text through `run#Extract` (a PDF's or text file's, or typed: a photo's text is not read), saved only by the claimant's line; the claim's PDF and an evidence bundle (the PDF and the receipts in a zip). An advance (`EmployeeAdvance`, `PakAdvance`, `PeopleAdvanceApproval`) is paid by finance as a prepayment and applied to the employee's finance-approved claims in Accounting's Expense posting; delivered, applied and outstanding are read from its payment. Mail intake `createExpenseLine` and the chat's "Add to my claim" add a draft line to review. Expenses is every People user's and a self-service employee's by its area grant; the quick create New claim on Commons' root, offered to whom has a current employment of their own.
Nov 12, 2026 — impl-people P14 as built: the shift roster (§6 ShiftRoster; §3 SelfService; §13 TeamCalendar; §15; §1.2, §1.4): an employment's dated `ShiftAssignment` (draft, published, removed), rostered by the person's manager (a live line at the employer) or an HR editor of the employer over the shared resource-lane timeline (Projects' Timeline.qvue in its resource mode, now a contract any mount answers, crosscut M11) with a person and day table in the terminal and a roster print; overlaps, ended employments, past starts and approved leave refused; publishing tells each worker once, and a published shift takes its day's planned hours in capacity in place of the schedule's (once, no holiday taking it), shows on the team calendar, SelfService's My shifts and the My shifts projected calendar. Reviewed: rostering has its own permission, `PEOPLE_ROSTER_EDIT` (the user's call, impl-people §4, Nov 12, 2026; §1.1, §6 ShiftRoster).
Nov 11, 2026 — impl-people P13 as built: attendance (§6 Attendance, TimeImport; §3 SelfService's Clock; §1.2, §1.4): raw `AttendancePunch` rows of an employment, recorded once by a unique source key and never changed, counted on the employment's `AttendanceDay` in the zone of its working schedule (an out-punch on the day of the in-punch it closes, so a night shift is its start day's), with what the punches lack; `AttendanceCorrection` with its intervals for a day, approved through a People approval (`PakAttendance`, the `PeopleAttendanceApproval` topic), the punches kept; clocking an employer's default with per-employment exceptions (the employer's `PartySetting` `PeopleClocking`, People Settings' in P29; `Employment.clockingEnabled` Y or N set apart by HR, empty following the employer; `Attendance.js isClockingOn`; P13's review); the self-service clock (`record#Punch`: the session's worker, the server's time); Time import with its own batch (`AttendanceImport`, rows previewed then recorded each in its own transaction) registered as the `wizard` transfer target `timeAndAttendance`; the quick create Clock in on Commons' root.
Nov 11, 2026 — impl-people P12 as built: leave requests (§7 LeaveRequests, LeaveRequestDetail): a `LeaveRequest` of its own id with segments (whole days, or a morning or an afternoon of one day), charged from the employment's working schedule less holidays, waiting for a People approval of kind `PakLeave` (the `PeopleLeaveApproval` topic), reserving its amount while it waits, the last approval recounting and checking the balance with the other reservations under the employment's lock and posting the leave taken once, a cancellation (asked by the person and approved, or HR's at once) reversing it once, approved leave projected as "Out of office" WetTimeOff work efforts that capacity reads, with a leave-start reminder; the reason read on the request alone and opted out of AI (PE-21, built in the framework); Team calendar, Commons' Calendar in its read-only resource mode over the team's absences, and the Team absence projected CalDAV collection, the first of a generic `CalendarProjection` kind (§13 TeamCalendar, §1.4); SelfService's My leave requests and MyTeam's Who is out (§3); an allocation's reason HR's to read (§7 LeaveBalances, F202).
Nov 11, 2026 — impl-people P11 as built: leave policies, allocations and balances. A leave type is an HR vocabulary (`PeopleLeaveType`, Lookups) and an employer's dated LeavePolicy carries the unit, paid meaning, entitlement requirement, negative limit, evidence and accrual frequency, with dated accrual steps, dated assignments to employments, blocked and mandatory days, allocations and the append-only LeaveLedgerEntry every balance is read from (§7); Leave policies, a policy's detail and Allocations are HR's under Time & leave rather than Settings, as Holidays, and Leave balances are HR's and the managers' (§1.2, §2); the Assistant's own-balance tool is `get#MyBalances`, the self-scope form of `get#Balances` (§1.4); SelfService shows the user's own balances (§3).
Nov 11, 2026 — impl-people P9 as built: Time & leave with Working schedules and Holidays, HR's and the managers', Holidays HR's own under Time rather than Settings (the user's call on HR's editors, §1.2, §2); a working schedule as an employer's dated week in a time zone with dated weekly intervals, followed by an employment from a date through its assignment, a change of its own (§4, §6, WorkingSchedules, WorkingScheduleDetail); holiday calendars as WcatHoliday categories whose holidays take only the days of the schedules naming them (§7 HolidayCalendars); Projects' capacity and timesheets' expected hours reading a person's schedule first, by actual instants and the schedule's days (§6; design-projects §9, §15).
Nov 11, 2026 — impl-people P10 as built: Projects' time screens and Rates mounted as they are at People/Time and People/Payroll/Rates, reading their context from the mount, with Time & leave every People user's and a self-service employee's by the area's own grant and Payroll the payroll groups' (§1.2, §13 MyTime, Timesheets, TimesheetDetail, TimeEntries and Rates); Rates admits payroll for the employees' pay rates of their employers and lists the labor costing rates read only; `RaprCost` the one labor costing purpose with `RateServices.get#CostingRate`, Manufacturing's rows and lookup moved to it and Accounting's LaborCostingRates on CostingPolicies (PE-23); MyTeam's last week and Remind missing time, Home's Weeks not submitted, SelfService's My time and Weeks to submit, Today's my week not submitted (§3, §1.4); Retail's `line` timesheet policy in the demo.
Nov 11, 2026 — impl-people P8 as built: SelfService at People/SelfService and Commons/People/SelfService, the user's own party only, opened by a self-service employee without the launcher through a non-inheritable grant (§1.1, §3 SelfService); MyTeam, the managers' (§1.2, §3 MyTeam); Home completed for the phases built and its paged due work (§3 Home); Today's decisions waiting on People's and Commons' roots and the PeopleTaskAssigned topic (§1.4); the emergency contact as a Person party per contact, private contact data (§4 Employee360).
Nov 11, 2026 — impl-people P7 as built: MT-03's first part (the two policy records, `store#ProcessStep`, `instantiate#WorkProcess` and the managed-work rule) and People's lifecycle checklists, started after a hire or an applied transfer or separation (§4, §12 ChecklistTemplates); a separation's equipment return, completed by a holding's end (§4, Employee360's AssignedEquipment, §13 EquipmentDetail); a checklist task's People mount (§13 WorkItemDetail); the hire's optional account request and a separation's access end through Admin's lifecycle, waiting for an identity operator unless HR is one (§4, ConfirmHire; design-admin §4.1); the `employees` import (§12 EmployeeImport); a change set for a later date withdrawn by HR or superseded by an earlier separation or return (§4, EmploymentChange).
Nov 11, 2026 — impl-people P6 as built: an employment's dated `EmploymentAssignment` (department, primary position, manager, work location, working or on leave) and each hire or change a fact of its own, `EmploymentChange` (§4); the assignment the source of the manager per employment (a line an assignment names is that employment's alone, and every manager change through People, OrgChart's too, is an assignment's), of the department membership (OrgStructure read only for a department's members, a unit closed with its people reassigned) and of the seat held (§4 OrgStructure, OrgChart); HireEmployee and EmploymentChange as wizards, HR's, and the quick create Hire employee (§1.4, §4); a transfer and a separation approved on the `PeopleEmploymentChangeApproval` topic, a separation routing the leaver's waiting decisions again (§12); Employee360's employment changes, department and assignments (§4 Employee360).
Nov 11, 2026 — impl-people P5 as built: Approvals (the Commons Notifications list of People's topics) and the key `g a`, and Settings' Approval rules and Lookups tabs (§1.2); a planned seat's activation asked for and decided on PositionDetail (§5 PositionDetail); dated approval rules routed employee override, nearest department, employer, manager or department head, with the step's alternate and an HR fallback, never the requester, an unresolved route waiting, new terms superseding a waiting request and a retried decision answering the first; the `PeoplePositionApproval` topic's approve and refuse handlers (§12 ApprovalPolicies); HR vocabularies ended, never deleted (§12 Lookups); People's lifecycle participant (design-admin §14).
Nov 11, 2026 — impl-people P4's review, on the user's calls: a pay grade is owned by an employer or shared by every employer, an owned one read by that employer's readers and changed by its payroll editors, a shared one changed only with `PEOPLE_ALL_ORGANIZATIONS` (§5, §5 PayGrades); a pay grade is changed with `PAYROLL_VIEW` and `PAYROLL_EDIT`, and `PEOPLE_CONFIGURE` stays for pay components, structures and groups (§1.1).
Nov 11, 2026 — impl-people P4 as built: Positions & recruiting (Staffing) with Positions, Job classes and Pay grades and the key `g s` (§1.2); a seat's holders are dated occupancy rows, one at a time, and vacancy is computed from them; a job class is ended, never deleted; a pay grade's band is payroll's alone, every other reader getting its name (§5 JobClasses, JobClassDetail, Positions, PositionDetail, PayGrades).
Nov 11, 2026 — impl-people P3 as built and reviewed: OrgStructure and OrgChart under Employees (§1.2, §4 OrgStructure and OrgChart); a reporting line is per employment, the manager's line at the employers that employ both, changed only by an editor who reads each of them (§4, §4 Employees); a department or team is never one of a user's organizations, Admin's child organizations or a cost centre (§4); the department memberships P6 makes the assignments' and the emergency contact P8 adds (§4 OrgStructure, Employee360).
Nov 11, 2026 — impl-people P2's review, on the user's call: the work email is Mantle's new `EmailWork` purpose, never `EmailPrimary`; a manager shown is one of that employment's employer (§4 Employees).
Nov 11, 2026 — impl-people P2 as built: the directory and Employee360 (§4 Employees, Employee360 and its per-app context), the palette's Employees group and the Person record-lookup (§1.4), the employment content host and People's record panels (§13 Chatter, RecordFiles), the directory export (§15); the owner designs' links (crosscut §3.4, design-admin UserDetail, design-projects PersonDetail, design-insights §10, design-drawers-commons).
Nov 11, 2026 — impl-people P1 as built: the root user group `BOSS_PEOPLE` and the Settings area (§1.1), the `people` keymap (§1.2), Home's counts and due work from `get#Home` (§3 Home). Its review, on the user's call: `PEOPLE_ALL_ORGANIZATIONS`, the People administrator's (§1.1).
Nov 11, 2026 — impl-people P0's last checks (impl-people F55, F65, F66): ClockingKiosk on Admin's built device credential, a page of its own that a device reads as a display account (§1.4 Devices, ClockingKiosk); each mail intake action finds its own target (§1.4 Mail intake); an HR host's files have no Records-drive folder and so no public sharing (§13 RecordFiles, PE-01).
Nov 11, 2026 — implementation plan written ([impl-people.md](impl-people.md)) and its open questions answered; its decisions and findings are made here (impl-people §4; F11, F20, F30, F34, F42, F51, F52, F54): the import permission `PEOPLE_IMPORT` and the import targets as built registrations (§1.1, §6 TimeImport, §12 EmployeeImport, PE-19); a hire's provisioning proposal (§1.1, §4); the process engine's split with Maintenance and the equipment return (§4, PE-02); payroll generic in the build and external processing gated on AC-23, which People builds (§8, §8.3, §8.4, §14.4, PE-11); approval topics seeded in Mantle (§12, PE-15); the survey builder's generalization (§13 Forms, PE-18); the projected calendar kind (PE-24); one costing purpose `RaprCost` (PE-23, §17).
Nov 1, 2026 — draft; reviewed against research-people.md, the reference apps and the other designs (the suite-app review, since removed from the tree; read it with `git show bd74564^:plan/review-suite-apps.md`); consistency pass.

IronStone People serves HR officers, managers, recruiters, payroll specialists and employees. It covers employees and organization structure, positions and recruiting, time and leave, payroll and expenses, skills and training, and reviews. People owns the HR record and payroll calculation; Commons supplies personal self-service and collaboration, Projects supplies tasks and timesheets, Admin supplies account provisioning and shared import, and Accounting supplies posting and settlement.

**Inputs.** [research-people.md](research-people.md), [initial-design.md](initial-design.md), [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md), [design-crosscut.md](design-crosscut.md), [design-drawers-commons.md](design-drawers-commons.md), [design-projects.md](design-projects.md), [design-accounting.md](design-accounting.md), [design-admin.md](design-admin.md), [design-maintenance.md](design-maintenance.md), the suite-app review (removed from the tree; read it with `git show bd74564^:plan/review-suite-apps.md`), [ss-inventory.md](ss-inventory.md), [usl-inventory.md](usl-inventory.md), and the active Mantle/Marble sources. The [application practices](../../../../../docs/dev/Practices-App-Dev.md) govern implementation.

**Payroll correction to the research.** The available payroll services, entities and data are an incomplete historical implementation, not simply a complete engine needing screens and updated rates. A later, unavailable commercial version processed payroll for approximately 10,000 agricultural workers and smaller numbers of varied staff; those capabilities cannot be attributed to this checkout or reconstructed from that history. This design supersedes the research’s payroll reuse, readiness and sequencing conclusions (§9 and §18). It designs a native, country-neutral core for a broad workforce, informed by open-source references and retaining suitable Mantle foundations. Release 1 ships that engine in preview mode, generic, with no country localization; live finalization waits on a chosen localization and on Accounting's payroll-origin projection (§8, §14.4, review Y7). No first country, current tax pack, legal filing support or demonstrated throughput is claimed.

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home-and-self-service) · [4 employees](#4-employees-and-organization) · [5 recruiting](#5-positions-and-recruiting) · [6 time](#6-time-and-attendance) · [7 leave](#7-leave) · [8 payroll](#8-payroll-and-compensation) · [9 expenses](#9-expenses-and-advances) · [10 skills](#10-skills-and-training) · [11 reviews](#11-reviews-and-goals) · [12 settings](#12-reports-and-settings) · [13 shared screens](#13-shared-screens) · [14 coverage](#14-baseline-coverage-and-acceptance) · [15 outputs](#15-documents-and-outputs) · [16 needs](#16-framework-and-data-needs) · [17 decided](#17-decided) · [18 open](#18-open)

## 1. Shell

### 1.1 Root, authority and presentation

Root `screen/People.xml`, mounted as `People`, uses artifact group `BOSS_PEOPLE` and icon `sym_o_groups`. `BOSS_PEOPLE_ADMIN` already exists. Add the following proposed capability groups and permissions in setup data, without checking group names inside services; PAYROLL_VIEW and PAYROLL_EDIT exist (Mantle seeds them, Nov 1, 2026). Mantle seeds the `PEOPLE_*` permissions and PAYROLL_APPROVE too, each granted to `ADMIN`, because Mantle's services check them and Mantle may not depend on BOSS data; BossSetupData grants them to the groups below (impl-people §4). Self-service mounts under Commons use their own underlying permissions and do not require the HR app root grant. Grant only the required self-service People routes and parent context artifacts to the self group; keep the staff launcher and unrelated People routes restricted. Do not grant inherited access to the whole People tree to make a payslip link work.

| Audience / proposed group | Proposed permissions | Scope |
| --- | --- | --- |
| Directory reader / BOSS_PEOPLE_READ | PEOPLE_DIRECTORY_VIEW | Public work identity in authorized organizations; no private contact, employment documents or compensation |
| Employee / BOSS_PEOPLE_SELF | PEOPLE_SELF_SERVICE | Own party and eligible employments, issued payslips, requests and permitted personal corrections; no arbitrary partyId override |
| Manager / BOSS_PEOPLE_MANAGER | PEOPLE_TEAM_VIEW, PEOPLE_REQUEST_APPROVE, PEOPLE_ROSTER_EDIT | Effective reporting relationships and explicitly assigned approval steps; no implicit compensation or grievance access (a pay change an employer's rule routes to the manager shows them that change's salary alone; impl-people P23 review) |
| HR officer / BOSS_PEOPLE_HR | PEOPLE_HR_VIEW, PEOPLE_HR_EDIT, PEOPLE_IMPORT, PEOPLE_REQUEST_APPROVE, PEOPLE_ROSTER_EDIT | Employment and private-person data in granted organizations; compensation separately granted; People's own imports (below); the approval steps routed to HR, which need PEOPLE_REQUEST_APPROVE as every step does (impl-people §4, the user's call, Nov 11, 2026) |
| Recruiter / BOSS_PEOPLE_RECRUIT | PEOPLE_RECRUIT_VIEW, PEOPLE_RECRUIT_EDIT | Assigned openings, applications and offers; interviewer sees assigned interviews and scorecards only |
| Payroll operator / BOSS_PEOPLE_PAYROLL | PEOPLE_DIRECTORY_VIEW (impl-people P31), PAYROLL_VIEW, PAYROLL_EDIT (both existing), PAYROLL_CONFIGURE (impl-people P22 review) | Compensation and payroll preparation in granted employers, and their payroll configuration (pay components, structures, groups), published on a payroll approver's approval; cannot authorize bank payments |
| Payroll approver / BOSS_PEOPLE_PAYROLL_APPROVE | PEOPLE_DIRECTORY_VIEW (impl-people P31), PAYROLL_VIEW (existing), PAYROLL_APPROVE | Review exact run population and calculated results; cannot approve own prepared run; approves publishing payroll configuration they did not draft or ask for (impl-people P22 review) |
| Learning/review administrator / BOSS_PEOPLE_DEVELOP | PEOPLE_DEVELOP_VIEW, PEOPLE_DEVELOP_EDIT | Skills, training and review administration; private review text still respects participant/reviewer scope |
| Confidential case handler / BOSS_PEOPLE_CASE | PEOPLE_CASE_HANDLE | Explicit case assignment, not every HR grievance |
| People administrator / existing BOSS_PEOPLE_ADMIN | PEOPLE_CONFIGURE and PEOPLE_ALL_ORGANIZATIONS plus explicit domain grants (PAYROLL_VIEW, PAYROLL_EDIT and PAYROLL_CONFIGURE among them, impl-people P22 review) | Policy and setup in every internal organization (or the active one); organization scope still checked by services; no implied bank/gateway administration |

**Root user group (as built, impl-people P1).** On Commerce's pattern, `BOSS_PEOPLE` is the root user group: it opens the People root (ALLOW, with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`) and the `ironstone.people` services, and each user of a capability group above but `BOSS_PEOPLE_SELF` is also in it; the root grant opens navigation only. `BOSS_PEOPLE_ADMIN` keeps its ALWAYS on the root. An area only some groups see denies the root user group and allows its groups: Settings is the People administrator's in P1. A staff reader's employers are the internal organizations among their own (the active one when it is theirs), and the units under them are walked by `PrtOrgRollup` (`mantle.humanres.PeopleServices.get#Scope`); an edit, import or approve permission alone reads no employer. `PEOPLE_ALL_ORGANIZATIONS` (the user's call, Nov 11, 2026; Mantle grants it to `ADMIN`, BossSetupData to `BOSS_PEOPLE_ADMIN`), as Commerce's and Warehouse's `*_ALL_ORGANIZATIONS`, makes a staff reader's employers every internal organization, or the active one; it reads nothing by itself.

Payroll configuration (pay components, structures, groups and localizations, P22) requires PAYROLL_VIEW, PAYROLL_EDIT and PAYROLL_CONFIGURE, a payroll permission of its own (the user's call of Nov 12, 2026, in place of PEOPLE_CONFIGURE: the payroll operator and the People administrator hold it in BOSS); operational preparation alone cannot publish configuration, and publishing a component's term or a structure takes effect only on a People approval (`PakPayrollConfig`) by a payroll approver, or an HR editor who reads payroll, who did not draft it or ask for it. A pay grade and its bands are changed with PAYROLL_VIEW and PAYROLL_EDIT alone, by a payroll editor of the employer that owns the grade (a grade shared by every employer also needs PEOPLE_ALL_ORGANIZATIONS; impl-people §4). Permissions are intersected with organization, employment, relationship dates, record participation and field category. Separate view and edit grants. PAYROLL_VIEW reads People's employees and pay only beside a People read permission (PEOPLE_DIRECTORY_VIEW for the payroll groups): by itself it reads nothing of People (impl-people P31 review, the lead's call). Employee and manager access never inherit private pay data merely from a Party or Project grant. Missing and unauthorized records both show “Not available”. Reject self-approval for leave, expenses, offers/pay changes and payroll; a configured alternate approver handles an absent or conflicted manager, and unresolved routing stays waiting rather than auto-approving.

**Roster permission (decided Nov 12, 2026; impl-people §4).** Saving and publishing shifts (§6 ShiftRoster) needs `PEOPLE_ROSTER_EDIT` beside the rosterer's own scope: a manager's live reporting line at the employer, or an HR editor's employer (PEOPLE_HR_VIEW and PEOPLE_HR_EDIT). Without it the manager and HR read the roster of the same people. Mantle seeds it granted to ADMIN; it is in the manager's and the HR officer's groups and capability bundles.

**Import permission (decided Nov 11, 2026; impl-people §4).** People's imports need the app's own import permission, `PEOPLE_IMPORT`, beside the People permission the target already names, and no `ADMIN_*` permission: a transfer target's permissions are all required, so Admin's transfer permission beside them would shut HR out of its own import. The `employees` target asks `PEOPLE_IMPORT` and PEOPLE_HR_EDIT to import and PEOPLE_HR_VIEW to view; the time-and-attendance target names `PEOPLE_IMPORT`, which its wizard services check beside People's own permission and scope. `PEOPLE_IMPORT` is in the HR capability bundle. Admin's Imports lists a People run for a data operator who also holds PEOPLE_HR_VIEW.

**Access for a new hire (decided Nov 11, 2026; impl-people §4).** A hire's provisioning request proposes the groups `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default, and the account request itself is optional on ConfirmHire: nobody gets a login merely to be paid. Anything more is chosen by HR from the capability bundles HR may grant, and Admin's delegation rules decide (§4).

**Employee pay rates (review Y2).** Reading an employee's pay rate needs PAYROLL_VIEW and setting it needs PAYROLL_EDIT. An employee pay rate is the vendor rate on a `TimeEntry` (`vendorHourRate`) or a `RaprVendor` `RateAmount` of an employee, and the `costRate` that `mantle.work.ResourceServices.find#StaffingCandidates` returns for an employee. A worker is an employee (a `PrtEmployee` relationship) for a time entry when employed on the entry's date or now, and for rates and staffing when employed now (`mantle.humanres.EmploymentServices.get#PayRateAccess`). `TIME_ENTRY_RATE`, which BossSetupData grants to `BOSS_PROJECT_MANAGER`, keeps client rates, contractor rates and project money. The masking is a Mantle code fix in this pass, which also seeds PAYROLL_VIEW and PAYROLL_EDIT. Labor cost in Projects, Maintenance and Manufacturing reports uses class and work-type costing rates (PE-23), never a person's pay rate.

**Pay and AI (decided Nov 12, 2026; impl-people §4).** Pay amounts are opted out of AI (PE-21): the salary, pay rates (`RateAmount.rateAmount`, which client billing and labor costing rates share), pay assignments' input values, pay inputs' amounts, pay components' term amounts and examples, pay grade bands, an offer's pay, a pay change's salary and a benefit's cost are never read by a model tool, and the screens that show them (Employee360's Compensation, PayAssignments, Rates' worker pay, PayAdjustments, OfferDetail's pay, PayGrades, PayComponentDetail, PayComponents' and PayStructureDetail's fixed amounts and the structure's preview) show an agent's render "Not shared with AI". The person's own browser shows them as before. As built (impl-people P25): a pay run's amounts (`PayrollRunEmployment`'s totals and split, `PayrollRunResult`'s amount and explanation; PayRuns' gross and net, PayRunDetail's totals, employees' amounts and opened lines) and, on the user's call of Nov 12, 2026, a time entry's worker rates (`TimeEntry.vendorHourRate` and `vendorPieceRate`, TimeEntries' worker rate, amount and cost, EditEntry's worker rate, WorkItemDetail's worker amount) are opted out too; formulas and structure parameters stay readable. As built in P25's review (the user's call of Nov 12, 2026): Projects' Profitability report's worker cost (its Cost card and column, the margin and margin % that give it back, and the chart drawing them) is opted out too (design-projects §11). As built (impl-people P26): a payslip's totals, split, lines' amounts, previous amounts and explanations (`Payslip`, `PayslipItem`), the legacy pay history's amounts (`EmploymentPayHistory`, `EmploymentPayDetail`) and the screens that show them (Payslips' gross and net, PayslipDetail's breakdown, year to date, chain and inputs, MyPayslip's, SelfService's My payslips net) are opted out too. The one exception, the user's call of Nov 12, 2026: the Assistant's `people_my_payslip` tool (`get#MyPayslip`, self-scope, the caller's own issued slips and their own legacy pay records alone, `exposeMcp` N) returns the person's own amounts to their own session, since "Explain this payslip" is the design's own use (§1.4) and the opt-out keeps pay out of screens' agent renders and the generic data tool, where a model reads other people's pay; a payroll reader's own slip is answered by it only as the person. No argument points it at another person's slip or record or at a preview, and it never names where a statement is stored (P26 review: the screen's download asks `get#MyPayslipStatement`, which is no tool).

Public directory projections omit private addresses, tax identifiers, bank information, pay, reviews and case existence. Sensitive children use canonical employment, application, review, payslip or request identities for files and Chatter; never attach their contents to a broadly visible Party timeline. Record links, counts, search, exports, notifications, Assist responses and financial drill-downs apply the same checks. Generic entity REST and alternate Mantle entrypoints must not bypass these rules (PE-01). Assist cannot reveal confidential text only once the framework can turn off inline text actions, dictation and Update with AI per field or screen (PE-21); grievance text, review notes, leave reasons and scorecards carry that opt-out.

XML screens use standard record headers, one status-dependent primary action, server-search choices, mobile columns and paginated service results. End/delete/approve/finalize actions confirm the named record or selected count. Shared calendars, files and Chatter retain their owners’ custom implementations. OrgChart and the department tree use the built XML `view-tree` with lazy children; recruitment uses `view-board`. ShiftRoster uses the shared resource-lane timeline (crosscut M11) and SkillsMatrix is a `.qvue` matrix, each with an equivalent TUI list or form (PE-20).

### 1.2 Menu

Menu entries name the landing screens; detail routes are in §2 and reached from records. A section with no available capability is omitted. The `people` keymap scope has `g p` for People home (as built, impl-people P1), `g e` for Employees (P2), `g o` and `g c` for Organization and Org chart (P3), `g s` for Positions (P4) and `g a` for Approvals (P5); each phase adds the keys of its screens. Approvals is every People user's: it lists only the user's own notices (as built, impl-people P5). Settings' tabs are Settings (the readiness), Approval rules and Lookups, the People administrator's (P5). Employees is a menu group: Employees (the directory), Organization and Org chart (as built, impl-people P3). Positions & recruiting is a menu group, `People/Staffing`: Positions, Job classes and Pay grades (as built, impl-people P4); Openings, Applicants and Interviews join it with P16.

- Home — `Home`; My team — `MyTeam`; Approvals — `Approvals`. As built (impl-people P8): My team is the managers' (its area denies the root user group and opens to `BOSS_PEOPLE_MANAGER`; the key `g m`); SelfService is out of the menu, linked from Home ("My self-service") and Commons Home.
- Employees — `Employees`; Organization — `OrgStructure`; Org chart — `OrgChart`; Grievances — `Grievances`.
- Positions & recruiting — `Positions`; Job classes — `JobClasses`; Pay grades — `PayGrades`; Openings — `Openings`; Applicants — `ApplicantPipeline`; Interviews — `InterviewsCalendar`.
- Time & leave — `Attendance`; Working schedules — `WorkingSchedules`; Shift roster — `ShiftRoster`; Timesheets — `Timesheets`; Hours for pay — `HoursForPay`; Leave requests — `LeaveRequests`; Leave balances — `LeaveBalances`; Team calendar — `TeamCalendar`. As built (impl-people P9 and P10): the group `People/Time` (menu 7), every People user's and a self-service employee's by the area's own grant (`BOSS_PPL_TIME`), its default Timesheets, then My time and Time entries (P10: Projects' screens mounted, §13); Working schedules (P9: HR's and the managers', `BOSS_PPL_SCHEDULES`, denied to the root user group and to self-service) and Holidays (HolidayCalendars, moved here from Settings: HR's own editor, as the user's call of Nov 11 put HR's editors out of the People administrator's Settings; HR's alone, `BOSS_PPL_HOLIDAYS`); the keys `g t` and `g w`. As built (impl-people P11): Leave balances (`LeaveBalances`, menu 7, HR's and the managers', `BOSS_PPL_LEAVE_BALANCES`, denied to self-service, whose own balances are SelfService's; the key `g b`), and HR's Leave policies and Allocations (`LeavePolicies`, `LeaveAllocations`, menus 10 and 11, with `LeavePolicyDetail` out of the menu; `BOSS_PPL_LEAVE`, denied to the root user group and to self-service) under Time & leave rather than Settings, as Holidays. As built (impl-people P13): Attendance (`Attendance`, menu 8, every People user's and a self-service employee's by the area's grant; the key `g d`), with Clock in (`Clock`, the quick create's screen) and HR's Time import (`TimeImport`, `BOSS_PPL_TIME_IMPORT`) out of the menu. P14: Shift roster (menu 12, `g h`), HR's and the managers' with the working schedules, ShiftRosterTui and ShiftRosterPrint out of the menu. P24: Hours for pay (menu 13), payroll's and the managers' (`BOSS_PPL_HOURS_FOR_PAY`, denied to the root user group and to self-service).
- Payroll — `PayRuns`; Payslips — `Payslips`; Pay assignments — `PayAssignments`; Pay adjustments — `PayAdjustments`; Rates — `Rates`; Data exchange — `PayrollExchange`. As built (impl-people P10): the group `People/Payroll` (menu 10) with Rates, the payroll groups' area (`BOSS_PPL_PAYROLL`: denied to the root user group, ALWAYS for the payroll operator and approver); the key `g r`. As built (impl-people P23): Pay assignments (`People/Payroll/PayAssignments`, menu 3, before Rates), in the same area. P24: Pay adjustments (`PayAdjustments`, menu 4, after Pay assignments), payroll's. P25: Pay runs (`PayRuns`, menu 1, the area's default) with PayRunDetail out of the menu, payroll's. P26: Payslips (`Payslips`, menu 2) with PayslipDetail out of the menu, payroll's; the person's own issued slip is `People/MyPayslip` (and `Commons/People/MyPayslip`) beside SelfService.
- Expenses — `ExpenseClaims`; Advances — `EmployeeAdvances`. As built (impl-people P15): the group `People/Expenses` (menu 11, after Payroll), every People user's and a self-service employee's by the area's own grant (`BOSS_PPL_EXPENSES`, as Time & leave's), with Expense claims (the default; ExpenseClaimDetail and its print out of the menu) and Advances; the key `g x`. People's InvoiceDetail is under Payroll, out of the menu (`People/Payroll/InvoiceDetail`).
- Skills & training — `SkillsMatrix`; Qualifications — `Qualifications`; Training — `Training`. As built (impl-people P18): the group
  `People/Development` (menu 12, "Skills & training"), its default the skills matrix (`SkillsMatrix`, with its terminal twin
  `SkillsMatrixTui` out of the menu: development's, HR's and the managers', `BOSS_PPL_SKILLS`, denied to the root user group and to
  self-service) and Qualifications (every People user's, and a self-service employee's by the area's own grant,
  `BOSS_PPL_DEVELOPMENT`, for their own); the keys `g k` and `g q`. As built (impl-people P19): Training (`Training`, menu 3 of the
  group, every People user's and a self-service employee's by the same grant), with `TrainingDetail` and `TrainingCertificate` out
  of the menu; its review: the key `g i`, and Assessment forms (`AssessmentForms`, menu 4: the survey builder with People's
  Development mount, the training assessments; the learning administrator's and the People administrator's,
  `BOSS_PPL_ASSESSMENT_FORMS`).
- Review cycles — `ReviewCycles`; Reviews — `Reviews`; Goals — `Goals`. As built (impl-people P20): the group `People/Performance`
  (menu 13, "Reviews & goals", `sym_o_rate_review`), its default Reviews, then Goals (every People user's, and a self-service
  employee's by the area's own grant, `BOSS_PPL_PERFORMANCE`), Review cycles and Review forms (`ReviewForms`, the survey builder with
  People's Performance mount: the review forms; the review administrator's, `BOSS_PPL_REVIEW_ADMIN`: `BOSS_PEOPLE_DEVELOP`, the People
  administrator and ADMIN), with `ReviewDetail` and `ReviewRelease` out of the menu; the key `g f`; SelfService's My reviews and My
  goals.
- Reports — `Reports`. As built (impl-people P29): one screen, `People/Reports` (menu 14), the readers of a report's (HR, recruiting,
  development and payroll, `BOSS_PPL_REPORTS`, denied to the root user group; the People administrator through the root), each report
  chosen by `reportId`.
- Settings — `Settings`; Payroll components — `PayComponents`; Pay structures — `PayStructures`; Pay groups — `PayGroups` (under Payroll as built, below); Leave policies — `LeavePolicies`; Allocations — `LeaveAllocations`; Holidays — `HolidayCalendars`; Approval rules — `ApprovalPolicies`; Checklists — `ChecklistTemplates`; Forms — `Forms`; Lookups — `Lookups`. As built (impl-people P22 and its review, the user's call of Nov 12, 2026): Pay components, Pay structures and Pay groups are under Payroll (`People/Payroll/PayComponents`, `PayStructures`, `PayGroups`, menu 6 to 8 after Rates), the payroll groups' area (the payroll operator, the payroll approver, and the People administrator and ADMIN through the root), so Settings stays the People administrator's; PayComponentDetail and PayStructureDetail are out of the menu.

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

### 1.4 Shell and stack contributions

People plugs into the shell and the stack through the contracts of crosscut §1.5 (review L1–L9). What is not built is a need in §16.1.

| Contribution | People entries |
| --- | --- |
| Today | Decisions waiting on me (the People approval topics of §12 ApprovalPolicies); leave starting for my team; my week not submitted (Projects timesheet); training due; my qualification expiring; payroll exceptions for payroll operators only. Each item opens its owner screen. As built (impl-people P8): one source, `ironstone.people.ContextServices.get#TodayItems`, declared on the People root and on Commons' root (a self-service employee opens no People root, F64; Home and the panel take each service once), answering the decisions waiting on the user (a request whose step waiting they may decide now, `find#DueWork`'s decision, `PEOPLE_REQUEST_APPROVE`), each opening PositionDetail or the person's Employee360; the later items join it with their phases. As built (impl-people P10): my week not submitted, the user's own weeks to submit (`mantle.work.TimesheetServices.find#WeeksToSubmit`, the rule of Projects' Today: this week's from its last working day, an older In-Process week with time on it), for one who keeps time under People (a People user or a self-service employee) and does not open Projects, whose own source answers it, each opening the week in People's My time; and the timesheet topics on the People root. As built (impl-people P12): leave starting today or tomorrow of a manager's live reports (kind leave, who is out, never why), opening the request; a colleague's day is on the team calendar only. As built (impl-people P18): my qualification expiring, the user's own verified qualifications expiring within thirty days or expired and not renewed (kind qualification: its type and expiry, never its number), for a self-service employee whose Skills & training opens to them, opening their qualifications. As built (impl-people P19): training due, the user's own enrolled training sessions and those they train starting within seven days (`DevelopmentServices.find#Training`'s due), each opening the session; and a place to approve among the decisions (the `PeopleTrainingApproval` topic), opening TrainingDetail. |
| Quick create | Request leave; New claim; Clock in, when clocking is enabled for the user's employment; Hire employee for HR (as built, impl-people P6: `peopleHireEmployee`, shown to whom the hire wizard's grant opens, the HR officers). As built (impl-people P12): `peopleRequestLeave`, Leave requests' first step, every People user's. As built (impl-people P13): `peopleClockIn`, declared on Commons' root (a self-service employee opens no People root), opening People/Time/Clock: the user's own clock, or, where their employment has no clocking, why, with Request leave. Offered only to a user who clocks for a current employment of their own: the quick create's `condition-service`
(`AttendanceServices.get#ClockOffer`), the framework's condition on a quick create built in P13's review. As built (impl-people P15): `peopleNewClaim`, New claim, declared on Commons' root as Clock in, opening People/Expenses/ExpenseClaims with the new claim's form, offered only to a user with a current employment of their own (`ExpenseServices.get#ClaimOffer`). |
| Palette | Public directory (Person, public work identity), openings, own leave requests, and applications for recruiters. Rows carry `recordEntity` and `recordId`, so Assist `search` reuses them. As built (impl-people P2): the directory is the group "Employees" (Commons' "People" group is its contacts), the people `find#Employees` reaches for the user, each once, opening Employee360. As built (impl-people P12): the user's own leave requests whose days, type or state hold the text (any for "leave"), opening LeaveRequestDetail. |
| Notification topics | As built (impl-people P8): `PeopleTaskAssigned`, seeded in Mantle with its sender `PeopleServices.notify#PeopleTaskAssigned`, to which `TaskServices.notify#TaskAssigned` hands an assignment of People's lifecycle work (a checklist step, an equipment return; its root's process policy People's), so the generic `WorkItemAssigned` title naming the task and its root ("Offboarding: <person>") is never sent for it; its title names who assigned it and when it is due, and its link (BossSetupData) opens the task in Commons. The approval topics of §12 ApprovalPolicies, plus proposed `PeopleTaskAssigned`, `PayslipIssued`, `QualificationExpiring` and `PeopleCaseUpdate`. Leave-start and training reminders use the Commons `WorkEffortReminder` topic. As built (impl-people P18): the qualification-expiry reminder is its own topic, `QualificationExpiring`, seeded in Mantle with the daily job `send_QualificationExpiryReminders` (`DevelopmentServices.send#ExpiryReminders`): a person is told once per expiry that a verified qualification of theirs expires within thirty days and was not renewed ("Your first aid certificate expires on …", never its number); its link (BossSetupData) opens their qualifications, since a qualification is no work effort to remind of. Payroll, review and grievance topics carry lock-screen-safe titles that name no person, amount or subject; `PeopleCaseUpdate` has `pushNotifications` N. As built (impl-people P19): `PeopleTrainingApproval`, a place in a training session to approve (its title names the person, the course and the day; never the reason), its link (BossSetupData) opening TrainingDetail; a person enrolled is reminded of the session by a Commons `WorkEffortReminder` of their own, a day before. As built (impl-people P20): `PeopleReviewStep`, a review's finalizing to approve (its title names the cycle, the employer and the step, never the person), and `PeopleReviewUpdate`, a review step given or returned and a review released (a sentence naming the cycle and a date, never the person, a rating, an answer or a note), each opening ReviewDetail. As built (impl-people P26): `PayslipIssued`, seeded in Mantle, a final slip issued to its person alone (direct only): "Your payslip from <employer> for <period> is available", never an amount; its link (BossSetupData) opens their own slip under Commons (`Commons/People/MyPayslip`). |
| Assist (CX-ASSIST) | Proposed skills in `skill/`: `people-leave-balance`, `people-payslip-explain`, `people-hire`, `people-policy-question` (over Commons Knowledge) and `people-job-description`, with `skill/aliases.json`. `assist-prompt` chips: "Explain my balance" on LeaveBalances and LeaveRequestDetail, "Explain this payslip" on PayslipDetail (own issued slips), "Draft a job description" on JobClassDetail. `response-action`s "Log as note" and "Send as message". `AgentToolExposure` rows only for self-scope reads that no screen covers (proposed `mantle.humanres.LeaveServices.get#Balances`, as built (impl-people P11) its self-scope form `get#MyBalances`, the tool `people_my_leave_balances`, since a tool's parameters are the model's and `get#Balances` answers HR and managers about others, and `mantle.humanres.PayrollResultServices.get#Payslip` for own issued slips, as built (impl-people P26) its self-scope form `get#MyPayslip`, the tool `people_my_payslip`, with the prompt "Explain this payslip" on MyPayslip, the person's own slip page, and the skill `people-payslip-explain`), with `exposeAssistant` Y and `exposeMcp` N; no HR, payroll or grievance service has `exposeMcp` Y. `data-entity` patterns never name a `mantle.humanres` package. Opening and job texts use the built inline text actions (Rewrite, Shorten, Translate), not a drafting need. Prerequisites: the per-field AI opt-out (PE-21) and the Mantle active-organization user-facts provider (crosscut CX-ASSIST). As built (impl-people P29): `skill/people-hire.md` (the hire wizard filled to its last step, never Hire pressed; no pay or private detail asked) and `people-policy-question.md` (Commons Knowledge's pages found by `search`, the page named, never a guess), the aliases `employee`, `hire`, `policy` and `headcount`; the root's "Log as note" (People/LogNote: an application's note, a recruiter's, the only People record Assist files a note on) and "Send as message" (People/SendMessage: an internal message through Comms, filed on the page's application when the user is its recruiter). |
| Comms hooks | As built (impl-people P2): `people.records`, the Person over the directory projection (search, info, card, links); P12: a LeaveRequest the user reads (info and card: person, days, charge and state, never the type or reason). `record-lookup` for Person (directory projection), EmploymentApplication (recruiters) and LeaveRequest (own and assigned). `create-from` and `ext-action`s in the message and chat slots: "Create application" from a mail or chat that carries a resume, "Add to my claim" from a receipt photo. As built (impl-people P15): "Add to my claim" is an `ext-action` on the BasicComms chat's message actions (screen-extend `Chat.xml`), the create-from kind `claimLine` of `ironstone.comms.ChatServices.create#FromChat` over `ExpenseServices.create#ClaimLineFromChat`: the user's own message in a room they read (not an encrypted room) becomes a draft line to review, its files the receipts, once. No `call-context` answer: a screen pop shows no HR record. HR calls and interviews keep no captions or transcripts unless `speech-local` is used. |
| Sync (CX-SYNC) | Projected read-only CalDAV collections answered by People services: team absence and published shifts (the TeamCalendar projection, reasons omitted) and my interviews (panel members only). Task exposure follows review Y1 (§12 ChecklistTemplates, §11 Goals). A CardDAV company directory is `later` (§17). |
| Mail intake (CX-MAIL-INTAKE) | `EmailRuleAction` actions `createApplication` and `createExpenseLine` (PE-24), each an Enumeration naming its service, as Projects' `createRequest` is. Each finds its own target, since `createRequest`'s plus tag names a project only: `createApplication` an opening by the rule's value or the opening's plus tag, `createExpenseLine` the claimant by their employment's work address, adding a draft line only (impl-people F65). As built (impl-people P15): `ErActCreateExpenseLine` (`ExpenseServices.create#ClaimLineFromEmail`): the sender's current `EmailWork` address names one person employed now (the rule's value names the employer of one employed by several); the message's files, else its text, become the receipts of one draft line to review on their open draft claim, or a new one; a message makes one line once; anyone else adds nothing, logged. |
| Shipped reports (CX-OPS-REPORTS) | Proposed `report/boss-people-*.json`: a headcount and turnover dataset (as-of, no pay), a leave-balance dataset, a People dashboard and alert templates (payroll run with failed units, qualifications expiring within 30 days, timesheets missing). Payroll calculation, finalization, accrual and exchange jobs mark `operation` and `operation-ref`. Monthly headcount and turnover go to HR managers as Insights schedules. As built (impl-people P29): `boss-people-headcount` (employments: employer, start, end, position class and how one ended), `boss-people-leave-balances` (the leave ledger: type, kind, signed quantity, date) and `boss-people-qualifications` (current employees' qualifications with their employers, a list), each class `InsDcPeople`, over Mantle's organization row filter, read in Insights only with People's Insights bundle (`BOSS_PEOPLE_INSIGHTS`), never an identity document or a work permit (P28, the user's call of Nov 13, 2026: left out of the qualifications document, so an index built before is rebuilt once); the dashboard `boss-people-workforce` and the alert template `boss-people-qualification-expiring`; the pay run and missing timesheet templates need datasets of their own, not built. As built (P29's review, the user's calls of Nov 12, 2026): the Insights data steward stewards the three datasets (their update artifact alone: admission, checks, the index refresh) and reads no row without the bundle; a qualification document carries its holder's employments not ended, so ending one drops its employer and a holder with none has no document (the feed deletes it); a revocation is the document's verification and an expiry its end date. |
| Devices (CX-DEVICE) | ClockingKiosk runs on a revocable device credential limited to the People kiosk route group (Admin ADM-DEVICES, built; People's PE-22 points to it). As built, a device signs nothing in: its requests run as a display account, a UserAccount with no sign-in that is a member of the employer it serves and holds only the kiosk bundle, and the route group admits the kiosk's page and its punch transition alone (as built, impl-people P30: `PEOPLE_CLOCKING`, the page, its punch and its scan resolver; the bundle `BOSS_PEOPLE_KIOSK`). ClockingKiosk is therefore a page of its own outside the `/qapps` shell, as Insights' WallDisplay is (impl-people F55). Each action identifies the worker by badge `scan-input` and PIN, with `density="handheld"` and an idle timeout. Admin registers and revokes devices; People PE-05 owns kiosk identity, which Maintenance TechnicianKiosk and the Manufacturing shop floor reuse. Offline is drafts only on moqui-browser, later. |
| Meetings | An interview is a Commons Event with a `CallLink` (EventDetail's "Add video call", `org.moqui.call.CallServices.create#CallLink`). Outside candidates are invited by iMIP through `mantle.work.EventServices.send#EventInvitations`, and the interview offers `.ics` export. People has no guest-link need. |

## 2. Screens

Every service in a form is fully qualified at its first use or in §16.2; **proposed** marks a new service or a named extension. Display and list services enforce access before returning data. Tabs listed as forms are included regions of the owning screen; separate navigable records have their own rows. The domain configuration screens under `People/Settings/` (leave policies and allocations, holidays, pay components, structures and groups) are designed in their domain sections (§7, §8), beside the rules they configure; the Settings menu lists them. As built, HR's own editors are under their area rather than Settings (the user's call of Nov 11): holidays (P9) and leave policies and allocations (P11) under `People/Time/`. Context cells name the record keys the shell reads; pay amounts never enter shell context.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | People/Home | landing | xml (built P1, P8) | Show the organization’s people work. | authorized HR summary | own | HR; payroll counters payroll only | new | filters `organizationPartyId`, `asOfDate`; no record |
| MyTeam | People/MyTeam | landing | xml (built P8) | Review the team’s availability and decisions. | authorized reporting relationships | own | manager | new | manager `Person partyId`; team and date filters |
| SelfService | People/SelfService | landing | xml (built P8: Shared/PeopleSelfService, mounted at People/SelfService and Commons/People/SelfService) | Provide personal HR actions inside Commons. | own Person and employments | own | self | new | own `Person partyId` and selected `Employment partyRelationshipId`; no pay values |
| Employees | People/Employees | list | xml (built P2: People/Employees/List) | Find employees and their public work context. | mantle.party.Person | own | directory; HR columns HR only | parity | list find parameters; selected `Person partyId` rows |
| Employee360 | People/Employees/Employee360 | 360 | xml (built P2: Shared/Employee360, mounted under People, Commons, Insights and Maintenance) | Read and maintain one person’s authorized employment context. | mantle.party.Person + mantle.humanres.employment.Employment | own | directory, self, HR, payroll and review scopes | parity | `Person partyId`; `Employment partyRelationshipId` |
| HireEmployee | People/Employees/HireEmployee | wizard | xml (built P6) | Create or complete a person’s employment. | Person + Employment + proposed EmploymentAssignment | own | HR | parity | `Person partyId` once chosen; employer `organizationPartyId` |
| EmploymentChange | People/Employees/EmploymentChange | wizard | xml (built P6) | Apply a dated transfer, leave of absence or separation. | Employment + proposed EmploymentAssignment | own | HR; pay change payroll | new | `Employment partyRelationshipId`; proposed `EmploymentAssignment employmentAssignmentId` |
| OrgStructure | People/Employees/OrgStructure | tree list | xml (built P3) | Maintain departments and teams. | Organization + PartyRelationship | own | directory; structural edits HR | parity | selected unit `Organization partyId`; tree find parameters |
| OrgChart | People/Employees/OrgChart | tree list | xml (built P3) | Explore reporting lines. | authorized manager relationships | own | directory; edits HR | new | focused `Person partyId`; `organizationPartyId` |
| Grievances | People/Employees/Grievances | list | xml (built P21) | Find only confidential cases the actor may know about. | mantle.request.Request (proposed HR-confidential type) | own | self submitter; explicit case participants | new | list find parameters only; no `Request requestId` is exposed to Assist |
| JobClasses | People/Staffing/JobClasses | list | xml (built P4) | Find reusable job profiles. | mantle.humanres.position.EmplPositionClass | own | HR; directory reads | new | list find parameters; selected `EmplPositionClass emplPositionClassId` rows |
| JobClassDetail | People/Staffing/JobClassDetail | detail | xml (built P4) | Define skills and responsibilities for a job. | EmplPositionClass and requirements | own | HR; directory reads | new | `EmplPositionClass emplPositionClassId` |
| Positions | People/Staffing/Positions | list | xml (built P4) | Plan seats and inspect vacancies. | mantle.humanres.position.EmplPosition | own | HR; manager scoped reads | new | list find parameters; selected `EmplPosition emplPositionId` rows |
| PositionDetail | People/Staffing/PositionDetail | detail | xml (built P4, P5) | Approve and fill one position. | EmplPosition + EmplPositionParty | own | HR; assigned approver | new | `EmplPosition emplPositionId` |
| PayGrades | People/Staffing/PayGrades | list | xml (built P4) | Maintain dated compensation bands. | mantle.humanres.rate.PayGrade + PayGradeSalary | own | payroll; HR with compensation grant | new | selected `PayGrade payGradeId` rows; no amounts |
| Openings | People/Staffing/Openings | list | xml (built P16) | Manage approved recruiting openings. | proposed JobOpening | own | recruiter; assigned hiring manager | new | list find parameters; selected proposed `JobOpening jobOpeningId` rows |
| ApplicantPipeline | People/Staffing/ApplicantPipeline | board | xml (built P16) | Move applications through reviewed stages. | mantle.humanres.employment.EmploymentApplication | own | recruiter; hiring manager scoped | new | list find parameters; selected `EmploymentApplication employmentApplicationId` rows |
| ApplicantDetail | People/Staffing/ApplicantDetail | 360 | xml (built P16) | Review a candidate without creating an employee. | EmploymentApplication + Person | own | recruiter; assigned reviewers | new | `EmploymentApplication employmentApplicationId`; applicant `Person partyId` |
| OfferDetail | People/Staffing/OfferDetail | detail | xml (built P17) | Approve and accept employment terms. | proposed EmploymentOffer | own | recruiter; HR; compensation terms by grant | new | proposed `EmploymentOffer employmentOfferId`; no pay values |
| TalentPool | People/Staffing/TalentPool | list | later (impl-people §7) | Keep tagged candidates for later openings. | EmploymentApplication + proposed talent tag | own | recruiter | later | list find parameters; selected `EmploymentApplication employmentApplicationId` rows |
| Attendance | People/Time/Attendance | list | xml (built P13) | Review attendance evidence and corrections. | proposed AttendancePunch + AttendanceDay | own | self; manager; HR | new | list find parameters; selected proposed `AttendanceDay` rows (`partyRelationshipId`, `attendanceDate`) |
| ClockingKiosk | People/Time/ClockingKiosk | task | xml (built P30: a bare page, its tui render the screen's own) | Record attendance on a shared device. | proposed AttendancePunch | own | kiosk device credential (ADM-DEVICES); worker proof | new | none: device session, no worker context |
| WorkingSchedules | People/Time/WorkingSchedules | list | xml (built P9) | Find working-week definitions. | proposed WorkingSchedule | own | HR; manager scoped reads | new | selected proposed `WorkingSchedule workingScheduleId` rows |
| WorkingScheduleDetail | People/Time/WorkingScheduleDetail | detail | xml (built P9) | Maintain intervals and dated assignments. | proposed WorkingSchedule + WorkingScheduleLine | own | HR | new | proposed `WorkingSchedule workingScheduleId` |
| ShiftRoster | People/Time/ShiftRoster | calendar | xml with a qvue mode (built P14; terminal twin ShiftRosterTui) | Assign basic shifts and resolve coverage conflicts. | proposed ShiftAssignment | own | scheduler via HR; manager scoped; self own | new | team `Organization partyId` and date range; selected proposed `ShiftAssignment shiftAssignmentId` |
| HoursForPay | People/Time/HoursForPay | task | xml (built P24) | Resolve period pay inputs before calculation. | proposed PayrollInput and source reconciliation | own | payroll; time approvers without amounts | new | proposed `PayrollGroup payrollGroupId`; `TimePeriod timePeriodId`; no amounts |
| TimeImport | People/Time/TimeImport | wizard | xml (built P13) | Import clock events, approved quantities or work time. | TimeEntry or proposed AttendancePunch staging | own; registered Shared/DataImport target | HR/timekeeper with `PEOPLE_IMPORT` | parity | import batch key and employer `organizationPartyId` |
| LeaveRequests | People/Time/LeaveRequests | list | xml (built P12) | Submit and track time-off requests. | proposed LeaveRequest | own | self; manager; HR | new | list find parameters; selected proposed `LeaveRequest leaveRequestId` rows |
| LeaveRequestDetail | People/Time/LeaveRequestDetail | detail | xml (built P12) | Review entitlement and decide a request. | proposed LeaveRequest + LeaveLedgerEntry | own | requester; assigned approver; HR | new | proposed `LeaveRequest leaveRequestId`; reason text excluded |
| LeaveBalances | People/Time/LeaveBalances | report | xml (built P11) | Explain available and used leave. | proposed LeaveLedgerEntry | own | self; manager aggregates; HR | new | `Employment partyRelationshipId` or team; proposed `leaveTypeId`; `asOfDate` |
| LeaveAllocations | People/Time/LeaveAllocations (as built, impl-people P11; designed under Settings) | task | xml (built P11) | Grant and adjust entitlements in controlled batches. | proposed LeaveAllocation + LeaveLedgerEntry | own | HR; assigned approver | new | proposed `LeaveAllocation leaveAllocationId` |
| LeavePolicies | People/Time/LeavePolicies (as built, impl-people P11; designed under Settings) | list | xml (built P11) | Find leave policies and their effective periods. | proposed LeaveType + LeavePolicy | own | HR configuration | new | selected proposed `LeavePolicy leavePolicyId` rows |
| LeavePolicyDetail | People/Time/LeavePolicyDetail (as built, impl-people P11; designed under Settings) | settings | xml (built P11) | Define entitlement and accrual behavior. | proposed LeavePolicy + accrual lines | own | HR configuration | new | proposed `LeavePolicy leavePolicyId` |
| HolidayCalendars | People/Time/HolidayCalendars (as built, impl-people P9; designed under Settings) | settings | xml (built P9) | Maintain calendars used by schedules and leave. | WorkEffortCategory + WetEvent/WepHoliday | own | HR configuration | new | holiday calendar `WorkEffortCategory workEffortCategoryId` |
| PayComponents | People/Payroll/PayComponents (as built, impl-people P22 review; designed under Settings) | list | xml (built P22) | Find earning, deduction and contribution definitions. | proposed PayrollComponent | own | payroll configuration | new | selected proposed `PayrollComponent payrollComponentId` rows |
| PayComponentDetail | People/Payroll/PayComponentDetail (as built, impl-people P22 review; designed under Settings) | detail | xml (built P22) | Define and explain one pay calculation component. | proposed PayrollComponent terms | own | payroll configuration | new | proposed `PayrollComponent payrollComponentId` |
| PayStructures | People/Payroll/PayStructures (as built, impl-people P22 review; designed under Settings) | list | xml (built P22) | Find reusable pay packages. | proposed PayrollStructure | own | payroll configuration | new | selected proposed `PayrollStructure payrollStructureId` rows |
| PayStructureDetail | People/Payroll/PayStructureDetail (as built, impl-people P22 review; designed under Settings) | detail | xml (built P22) | Compose a reusable pay calculation. | proposed PayrollStructureComponent | own | payroll configuration | new | proposed `PayrollStructure payrollStructureId` |
| PayAssignments | People/Payroll/PayAssignments | list | xml (built P23) | Assign structures and inspect employee payroll readiness. | proposed PayrollAssignment | own | payroll | new | `Employment partyRelationshipId` filter; selected proposed `PayrollAssignment payrollAssignmentId` rows |
| PayGroups | People/Payroll/PayGroups (as built, impl-people P22 review; designed under Settings) | settings | xml (built P22) | Configure pay calendars and processing policy. | proposed PayrollGroup + TimePeriod | own | payroll configuration | new | proposed `PayrollGroup payrollGroupId` |
| PayRuns | People/Payroll/PayRuns | list | xml (built P25) | Find payroll runs and unresolved work. | proposed PayrollRun | own | payroll; payroll approver | new | selected proposed `PayrollRun payrollRunId` rows; no amounts |
| PayRunDetail | People/Payroll/PayRunDetail | wizard | xml (built P25, P27) | Prepare, calculate, approve and finalize a payroll. | proposed PayrollRun + PayrollRunEmployment | own | payroll; distinct approver | new | proposed `PayrollRun payrollRunId`; no amounts |
| Payslips | People/Payroll/Payslips | list | xml (built P26) | Find current and historical pay statements. | proposed Payslip; legacy EmploymentPayHistory | own | self issued; payroll | new | selected proposed `Payslip payslipId` rows; no amounts |
| PayslipDetail | People/Payroll/PayslipDetail | detail | xml (built P26) | Explain and print one pay result. | proposed Payslip + PayslipItem | own | self issued; payroll | new | proposed `Payslip payslipId`; no amounts |
| PayAdjustments | People/Payroll/PayAdjustments | list | xml (built P24) | Approve additional pay, deductions and corrections. | proposed PayrollInput | own | payroll; assigned approver | new | selected proposed `PayrollInput payrollInputId` rows; no amounts |
| PayrollExchange | People/Payroll/PayrollExchange | wizard | xml (built P28) | Reconcile provider or historical payroll data. | proposed PayrollExchangeBatch | own; registered Shared/DataImport target | payroll import/export grant | new | proposed `PayrollExchangeBatch payrollExchangeBatchId` |
| PayrollStatements | People/Payroll/PayrollStatements | report | later (impl-people §7) | Prepare supported statutory-period outputs. | localization statement output | own | payroll | later | statement kind, employer `organizationPartyId` and reporting period |
| ExpenseClaims | People/Expenses/ExpenseClaims | list | xml (built P15) | Capture and track employee expenses. | Invoice + proposed ExpenseClaim | own | self; assigned approver; finance by grant | parity | list find parameters; selected `Invoice invoiceId` rows |
| ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail | detail | xml (built P15) | Submit receipts and review a claim. | Invoice/InvoiceItem + proposed ExpenseClaim | own | claimant; assigned approver; finance | parity | `Invoice invoiceId` (proposed ExpenseClaim keyed by it) |
| EmployeeAdvances | People/Expenses/EmployeeAdvances | list | xml (built P15) | Request and reconcile employee advances. | proposed EmployeeAdvance linked to Payment | own | self; approver; finance | new | selected proposed `EmployeeAdvance employeeAdvanceId` rows |
| TravelRequests | People/Expenses/TravelRequests | list | later (impl-people §7) | Request approval for business travel that can feed an advance. | Request (proposed travel type) | own | self; approver | later | selected `Request requestId` rows |
| SkillsMatrix | People/Development/SkillsMatrix | report | xml with a qvue mode (built P18; terminal twin SkillsMatrixTui) | Compare people’s capabilities with job requirements. | PartySkill + EmplPositionClassSkill | own | development; manager scope; staffing readers | new | team or `emplPositionClassId` filter; selected `PartySkill` (`partyId`, `skillTypeEnumId`) |
| Qualifications | People/Development/Qualifications | list | xml (built P18) | Verify qualifications and track expiry. | proposed refined PartyQualification | own | self; development; staffing projection | new | selected proposed `PartyQualification partyQualificationId` rows |
| Training | People/Development/Training | list | xml (built P19) | Find training sessions and requirements. | proposed refined TrainingClass; training WetEvent | own | development; self eligible sessions | new | selected training `WorkEffort workEffortId` rows |
| TrainingDetail | People/Development/TrainingDetail | detail | xml (built P19) | Enroll, assess and record training completion. | proposed refined PersonTraining + training event | own | development; assigned trainer; self enrollment | new | training `WorkEffort workEffortId` |
| ReviewCycles | People/Performance/ReviewCycles | list | xml (built P20) | Set up review periods and participants. | proposed ReviewCycle + ReviewTemplate | own | review administrator | new | selected proposed `ReviewCycle reviewCycleId` rows |
| Reviews | People/Performance/Reviews | list | xml (built P20) | Find assessments waiting for action. | proposed refined PerformanceReview | own | self; assigned reviewer; review administrator | new | selected proposed `PerformanceReview performanceReviewId` rows |
| ReviewDetail | People/Performance/ReviewDetail | detail | xml (built P20) | Assess performance and agree development actions. | proposed PerformanceReview/items/notes | own | review participants by step | new | proposed `PerformanceReview performanceReviewId`; private notes excluded |
| Goals | People/Performance/Goals | list | xml (built P20) | Track agreed development and performance objectives. | mantle.work.effort.WorkEffort with proposed goal fields | own | self; manager; review participants | new | selected goal `WorkEffort workEffortId` rows (purpose proposed `WepGoal`) |
| Reports | People/Reports | report | xml (built P29) | Analyze people operations with traceable totals. | authorized People reporting services | own | domain view permissions | new | report name and authorized filters; no private result values in shell context |
| Settings | People/Settings | settings | xml (built P1, P29: People/Settings/SettingsHome and Preferences) | Configure capabilities and inspect readiness. | effective People policy and readiness | own | People administrator; payroll settings separately | new | `organizationPartyId` |
| EmployeeImport | People/Employees/EmployeeImport | wizard | xml (built P7: Shared/DataImport mounted) | Import employees and employments through the shared import. | registered import target over `hire#Employee` | DataImport, Admin §11 | HR with `PEOPLE_IMPORT` and PEOPLE_HR_EDIT | new | `targetId`, `batchId`, employer `organizationPartyId` |
| ApprovalPolicies | People/Settings/ApprovalPolicies | settings | xml (built P5) | Route and explain domain approvals. | proposed PeopleApprovalPolicy + approval decisions | own | People configuration; payroll policies payroll admin | new | selected proposed `PeopleApprovalPolicy peopleApprovalPolicyId` |
| ChecklistTemplates | People/Employees/ChecklistTemplates | settings | xml (built P7) | Prepare onboarding and offboarding task sets. | template WorkEffort tree (MT-03) | own | HR configuration | new | template `WorkEffort workEffortId` |
| Lookups | People/Settings/Lookups | settings | xml (built P5) | Maintain allowed HR vocabularies. | Enumeration + BenefitType | own | People configuration; tax values localization controlled | new | lookup family `enumTypeId` |
| MyTime | People/Time/MyTime | list | qvue (Projects' screen, mounted P10) | Enter and submit own weekly work time. | TimeEntry + Timesheet | Projects §8 MyTime | self | new | current user `Person partyId`; week `Timesheet timesheetId` |
| Timesheets | People/Time/Timesheets | list | xml (Projects' screen, mounted P10) | Review weekly submitted time. | Timesheet | Projects §8 Timesheets | time approver; self | new | employee or team and period filters; selected `Timesheet timesheetId` rows; no pay amounts |
| TimesheetDetail | People/Time/TimesheetDetail | detail | xml (Projects' screen, mounted P10) | Approve, return or inspect a weekly timesheet. | Timesheet + TimeEntry | Projects §8 TimesheetDetail | owner; time approver | new | `Timesheet timesheetId` |
| TimeEntries | People/Time/TimeEntries | list | xml (Projects' screen, mounted P10) | Inspect work-time entries and source links. | TimeEntry | Projects §8 TimeEntries | timekeeper; self | parity | party, period and employer filters; selected `TimeEntry timeEntryId` rows |
| Rates | People/Payroll/Rates | list | xml (Projects' screen, mounted P10) | Maintain dated employment pay rates. | mantle.humanres.rate.RateAmount | Projects §10 Rates | payroll | parity | selected `RateAmount rateAmountId` rows; no amounts |
| TeamCalendar | People/Time/TeamCalendar | calendar | xml with a qvue mode (built P12; terminal twin TeamCalendarTui) | Show authorized absence and shifts. | WorkEffort calendar projections | Commons §7 Calendar | self; manager; HR | parity | team `Organization partyId` and date range |
| InterviewsCalendar | People/Staffing/InterviewsCalendar | calendar | xml with a qvue mode (built P16; terminal twin InterviewsCalendarTui) | Schedule and inspect interviews. | private WetEvent interviews | Commons §7 Calendar and EventDetail | assigned panel; recruiter | parity | `EmploymentApplication employmentApplicationId` filter; selected interview `WorkEffort workEffortId` |
| Approvals | People/Approvals | list | xml (built P5: Commons' Notifications mounted) | Clear People decisions in the shared inbox. | NotificationMessage + domain decisions | Commons §4 Notifications; crosscut §3.15 | assigned approver | parity | People approval topics; selected `NotificationMessage` rows with their `recordEntityName` and `recordId` |
| WorkItemDetail | People/Tasks/WorkItemDetail | detail | xml (Shared, mounted P7) | Complete lifecycle and development tasks. | WorkEffort | Projects §5 WorkItemDetail | task assignee; scoped reader | parity | `WorkEffort workEffortId`; sanitized lifecycle or goal link |
| RequestDetail | People/Employees/RequestDetail | detail | xml (Shared, mounted P21) | Handle a confidential grievance. | Request | Projects §6 RequestDetail; crosscut §3.11 | explicit HR-case participants | parity | `Request requestId` for case participants only; not exposed to Assist |
| EquipmentDetail | People/Employees/EquipmentDetail | detail | xml (Shared, mounted P7) | Review assigned equipment and return work. | Asset | crosscut §3.10 EquipmentDetail | equipment custodian; HR scoped | parity | `Asset assetId`; custodian `Person partyId` |
| InvoiceDetail | People/Payroll/InvoiceDetail | detail | xml (Shared, mounted P15, P27) | Inspect payroll obligations and settlement. | Invoice | crosscut §3.16 InvoiceDetail; Accounting BillDetail | payroll-finance | parity | `Invoice invoiceId` of a payroll or claim obligation; no amounts |
| Forms | People/Settings/Forms | settings | xml (Shared/SurveyForms, mounted P16) | Configure interview, review, training and exit-interview questionnaires. | DbForm + FormResponse | Shared/SurveyForms (Commons owner); crosscut §2 | HR/recruiting/review configuration | new | People form purpose; selected `DbForm formId` |
| Chatter | People/Chatter | panel | qvue (Shared, mounted P2) | Discuss an authorized HR record. | canonical authorized host | Commons §15 Chatter; crosscut §3.14 | host reader | parity | host `recordEntityName` and `recordId`, with its privacy class |
| RecordFiles | People/RecordFiles | panel | qvue (Shared, mounted P2) | Read or attach authorized HR evidence. | canonical authorized host | Commons §9 RecordFiles; crosscut §3.14 | host reader | parity | host `recordEntityName` and `recordId`, with its content purpose |

## 3. Home and self-service

### Home

**Layout:** landing.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Summary | display | Link counts to work queues | organization, as-of date, headcount (distinct people), employments, joins, exits, out, vacancies, decisions | dashboard, number cards | `mantle.humanres.PeopleServices.get#Home` (built in impl-people P1: headcount and employments for a staff reader, joins and exits of 30 days for an HR reader) | Frappe HR workspaces; HumanRes/dashboard |
| DueWork | list, read | Surface exceptions and due work | employee, event, due date, assignee, state | record links | `get#Home`'s due work (built in impl-people P1: an HR reader's employees with no manager); proposed `mantle.humanres.PeopleServices.find#DueWork` when the list needs paging | Frappe HR number cards |

**Actions and states:** Hire employee is primary for HR; otherwise open the first authorized queue. Empty setup links to Settings; no inaccessible totals or salary charts.

**As built (impl-people P8).** Summary adds Vacant positions (P4's seats in effect with no holder, for a position reader, opening Positions' vacant ones) and Decisions waiting (the user's, opening Approvals) to P1's counts; a count that cannot be read is left out. DueWork is `mantle.humanres.PeopleServices.find#DueWork` (paged): an HR reader's employees with no manager and the open lifecycle tasks (checklist steps, equipment returns) of the employers in scope, each opening the person or the task, never a protected task about the reader themselves. Hire employee is the primary action for HR; a People user who reads no employer (a manager) sees their decisions waiting and My team; a user with self-service has My self-service. People out, payroll exceptions and expiring qualifications join with P12, P25 and P18. As built (impl-people P10): Weeks not submitted, last week's missing weeks of the people whose time a manager or time approver follows (their live reports and the time keepers of the projects they manage), opening Timesheets' Missing.

**Source:** research §1; Frappe HR workspaces

**Needs:** PE-01; PE-02; PE-18.

### MyTeam

**Layout:** landing.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Team | list, read | Show current reports and coverage | person, job, location, schedule, available/out, missing time | list links | proposed `mantle.humanres.PeopleServices.get#Team` | Odoo department counters; Frappe Team Requests |
| Decisions | component | Include assigned approvals | requester, type, dates, due, safe summary | shared Approvals form | Commons approvals provider contract; domain decision services in §16.2 | design-crosscut §3.15 |

**Actions and states:** Open request or review; approval actions recheck assignment and source state. "Remind missing time" on the selected people whose week is not submitted calls `mantle.work.TimesheetServices.send#MissingTimeReminders` with their `partyIds`; it checks per person that the manager may approve that week and reports the skipped count. The reporting hierarchy can be expanded only within granted team scope. Leave reasons and private notes do not appear in availability.

**As built (impl-people P8).** The managers' area (`BOSS_PPL_TEAM`). Team is `mantle.humanres.PeopleServices.get#Team` (`PEOPLE_TEAM_VIEW`): the people of the manager's live reporting lines, one row per employment at an employer the line is at (never a report's employment at another employer), their public work identity with the department, work location and Working or On leave (the assignment's state), no employment id; the service takes no manager or party. Decisions is `find#DueWork`'s decision (the requests whose step waiting the manager may decide now), each opening where it is decided, with All approvals. Only direct reports are listed (the expansion of the hierarchy is later); who is out and reviews due join with P12 and P20. As built (impl-people P9): Team shows the working schedule each report follows now at that employment. As built (impl-people P10): each report's last week, Submitted or Not submitted (`mantle.work.TimesheetServices.find#Timesheets`' missing list, which holds the manager's live reports), a missing one opening the week in People's My time, and nothing for a report who keeps no time (as reviewed, the user's call of Nov 11, 2026: `get#LineReports`' `keeperIdList`); Remind missing time on the selected people over `send#MissingTimeReminders`, which reminds those whose week the manager approves (under the organization's `line` policy) and counts the others as skipped. As built (impl-people P12): Who is out, the next two weeks of the reports' approved leave (`LeaveServices.get#TeamAbsences`: "{person} · Out", never the type or reason; the manager's own colleagues left to the team calendar), each opening the request, with the team calendar; a leave decision waiting opens LeaveRequestDetail.

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

**As built (impl-people P13).** Clock (template/PeopleClock.xml, also People/Time/Clock): shown only where an employment of the user has clocking on (`AttendanceServices.get#MyClock`, which takes no party), one row per such employment (the employer named when there are several) with Clocked in since or Clocked out, today's time and Clock in or Clock out (`record#Punch`: the worker is the session's, never a parameter; the time is the server's; the employment only chooses among the user's own; clocking in twice or out while out refused); with it the clock is the page's primary action and Open my employee record a plain one (with none, Open my employee record stays primary, as P8 built it). My attendance opens People's Attendance on the user's own days. A self-service employee clocks by its own grant (`BOSS_PPL_CLOCK_SELF`: the transition and the two services).

**As built (impl-people P14).** My shifts: the user's own published shifts of the next two weeks (`ScheduleServices.get#MyShifts`, which takes no party; `BOSS_PPL_SHIFTS_SELF` opens it under either root), shown when there are any, linking the team calendar. MySummary's "next shift" is that list's first.

**As built (impl-people P15).** My expenses and My advances link People's Expense claims and Advances (the user's own), when the expenses area opens to the user (a People user, or a self-service employee by its own grant); the quick create New claim opens the new claim's form.

**Devices:** phone. **Per-app context:** Commons mounts at `Commons/People/SelfService` and contributes Home/Today cards; People mounts this same definition at `People/SelfService`. Both fix the current user’s party and permitted employments. Employee360 self view permits own contact corrections, requests and issued statements; payroll settings remain payroll-controlled.

**As built (impl-people P8).** `Shared/PeopleSelfService.xml`, at both mounts, out of both menus. `mantle.humanres.PeopleServices.get#SelfService` (`PEOPLE_SELF_SERVICE`) takes no party: the user's own current and coming employments (employer, job title, department, manager, work location, dates, state), emergency contacts and the counts of their open requests and People tasks. MySummary shows them; My People tasks is `find#DueWork`'s myTask (the open lifecycle tasks assigned to the user, a protected task about them left out by P7's rule), each opened as a Commons task; MyRequests is `find#MyRequests` (the People requests the user made: kind, what, asked, state, who decides the step waiting or that no one may yet, a refusal's reason; leave and claims join with their phases); Emergency contacts are the user's own, added, changed and ended there. Open my employee record is the primary action (Commons' Employee360 for an employee without People). A self-service employee without the launcher opens it under either root by a non-inheritable grant on the screen, its contact transition, the People root's context (which answers them their own employments and this link alone) and the Mantle services it calls (`BOSS_PPL_SELF`, as Admin's settings index, F28); every other People screen stays refused to them. Commons Home's People card and Today reach it (design-drawers-commons §5). As built (impl-people P10): My time in the header (People's My time, which the self-service employee opens by the time area's own grant) and the missing-week card, Weeks to submit (`get#SelfService`'s `weeksToSubmit`), opening the oldest week. P11 adds My leave balances: the user's own, by `LeaveServices.get#MyBalances` (no party parameter; `BOSS_PPL_LEAVE_SELF` grants it to the self-service group under the screen's non-inheritable grant), each leave type's available and balance by the policy in effect. As built (impl-people P12): Request leave in the header (People's Leave requests, by the time area's grant) and My leave requests, the user's own newest (`LeaveServices.find#Requests` with mine: days, type, charge, state; never a reason), each opening the request.

**As built (impl-people P16 review, the user's call of Nov 12, 2026).** An interview panel member answers their scorecard from self-service: My interviews on SelfService (shown when the user is on any panel: `mantle.humanres.RecruitingServices.find#MyInterviews`, which takes no party: the coming interviews and those of the last 30 days, and any older one still to score, each with when, the applicant, the opening and the scorecard's state; "Scorecards to submit" in MySummary), each opening `Shared/PeopleMyInterview.xml`, mounted beside SelfService at `People/MyInterview` and `Commons/People/MyInterview` (`get#MyInterview`: the caller's own panel alone; when and where with Join the video call, the note, the panel, the applicant's name, the opening and its employer, the materials shared with the panel, and their scorecard to submit once or read back, opted out of AI). "Shared with the panel" means a file of the application a recruiter marked shared on ApplicantDetail (`EmploymentApplicationContent.panelShared`, `share#ApplicationContent`); a resume is shared when attached and another file only when a recruiter shares it (the user's call of Nov 12, 2026, built in impl-people P17; the recruiter can stop sharing the resume); a panel member downloads only those (`get#ApplicationFile`) and never reads the application's stage, source, contact, notes or other files. A self-service employee opens it by `BOSS_PPL_INTERVIEW_SELF` (F28's non-inheritable pattern: the screen, its two transitions and the four services).

**As built (impl-people P26 review, the user's call of Nov 12, 2026).** My payslips also lists the user's own legacy pay history (`EmploymentPayHistory` of their own employments, by its key), labelled "Historical (read only)", each opening `MyPayslip` with its `legacyKey`: the record as it was recorded (its lines, gross, net, taxable and taxable year to date as stored), never recalculated.

**As built (impl-people P26).** My payslips on SelfService (shown when the user has any): the user's own issued payslips (`PayrollResultServices.find#Payslips` with mine: never a preview, a slip not issued or another person's), each with its pay date, period, kind (a correction says so) and net (opted out of AI), opening `MyPayslip` beside SelfService (`Shared/PeopleMyPayslip.xml` at `People/MyPayslip` and `Commons/People/MyPayslip`): the slip as `get#MyPayslip` answers it (the caller's own issued slip, no party taken), its lines by group with how each was worked out (a line its term keeps off the payslip left out), the totals, the year to date, its issued corrections with the net effect, the inputs it paid, and Download statement (the statement as issued, never rendered again). None shows in this build outside a live payroll, since every pay group is in preview mode (§5 Q3). Its own non-inheritable grant (`BOSS_PPL_PAYSLIP_SELF`).

**As built (impl-people P17 review, the user's call of Nov 12, 2026).** My letters on SelfService (shown when the user has any): the issued lifecycle letters addressed to the user (a hire's confirmation, a transfer, a manager change, a leave of absence, a return, a separation), by `mantle.humanres.PeopleServices.find#MyLetters`, which takes no party, each with its title, employer and issue date, opened as it was stored and whole, pay included since the letter is theirs (`get#MyLetter`: another person's letter, or an offer's, is a missing one). A self-service employee opens it by `BOSS_PPL_SELF` (the transition and the two services, F28's non-inheritable pattern); the file is sent as Mantle admitted it, since such a grant does not reach the content store (MyInterview's shared file the same).

**As built (impl-people P30 review, the user's call of Nov 12, 2026).** My clocking badge on SelfService (shown when the user has a badge in use): each of their own badges with its employer, state, when its PIN was set and last used (`AttendanceServices.get#MyKioskBadges`, which takes no party; never a number or a PIN), and Set my PIN, or Change my PIN once set (`set#MyKioskPin`, the `setMyPin` transition): the new PIN of 4 to 8 digits, never the one-time PIN HR gave, with the PIN they have (their own, or HR's one-time PIN when HR gave one; none when HR gave none and they have not set one), a wrong one counted on the badge as at a kiosk. The PIN is the worker's alone: the badge works at no kiosk until they set it, and HR never learns it. A self-service employee reaches it under either root by `BOSS_PPL_CLOCK_SELF` (the transition and the two services, F28's pattern).

**Source:** research §1; Frappe employee PWA

**Needs:** PE-01; PE-05; PE-18.

## 4. Employees and organization

Employment is a person-to-legal-employer `PrtEmployee` relationship and its `Employment` extension. A department assignment is not a second legal employer. Departments use Organization with the existing `OrgDepartment` role (never `OrgInternal`) and `PrtOrgRollup`; reporting uses `PrtManager`; positions use `EmplPosition` and dated `EmplPositionParty`. A team is an Organization with the `OrgTeam` role and `PrtMember` relationships, written only by People `OrganizationServices`; Maintenance Teams and Projects read it and add their own dispatch defaults (review Y4). Admin Organizations lists `OrgInternal` parties only; departments and teams stay with People (review Z6), and a department or team is never one of a user's organizations: `mantle.party.PartyServices.get#PartyInternalOrgIds` takes an internal organization's direct children only when they are internal organizations too (as built, impl-people P3; the user's call, Nov 11, 2026), so a department under an employer widens no app's organization scope; nor is it one of Admin's child organizations or an Accounting or Purchasing cost centre, each of which is an internal organization (P3's review). One non-overlapping employment per person and employer: `mantle.humanres.EmploymentServices.create#Employment` today refuses any overlapping PartyRelationship between the two, of any type, so a contractor or contact cannot be hired; PE-02 narrows that check to `relationshipTypeEnumId` `PrtEmployee`, and the HireEmployee preview lists the other relationships. Multiple seats or rates are assignments within that employment. Other employers and a later rehire can have separate relationships. A proposed dated EmploymentAssignment carries department, primary position, manager, work location and schedule together so a transfer does not overwrite history or split payroll identity. Its period must be inside the employment; one primary assignment at a time. Existing role/relationship projections are maintained by the same service, not separate editable sources.

**As built (impl-people P6).** `mantle.humanres.employment.EmploymentAssignment` holds an employment's department, primary position, manager, work location (a facility of the employer) and state (working, or on a leave of absence) from a date; a change ends the one in effect and starts the next, inside the employment. It is the source of three projections the same service writes: the department membership (a dated `PrtMember` row from role `Assignee`), the seat held (a dated `EmplPositionParty` row; `Employment.emplPositionId` holds the seat in effect for its legacy readers, TimeServices' rates and the contact card: a change in effect now sets it at once, one dated later on its date through the daily job `apply#DueAssignments`, and a separation keeps the last one; the user's call, Nov 11, 2026) and the reporting line (a `PrtManager` row from the manager, ended only when no other employment of the person still uses it). The manager is per employment: a line is at an employer whose employment has an assignment only when the assignment names its manager, and a line an assignment names is that employment's alone (F81, F86, F91). Each hire and change is a `mantle.humanres.employment.EmploymentChange` row (kind, date, the new terms, why, who asked, its operation key, its state). `create#Employment` and `update#Employment` refuse an overlapping employment, a `PrtEmployee` relationship, and no other relationship between the two (F3); People never calls `create#PersonEmployee` (F5) nor deletes an employment, and leaves a hired person's Party owner as it is (F59). A separation ends the employment (its reason and type), its assignment and projections, the person's lead and team memberships at the employer and the lines they manage there (each report's assignment continues with no manager), leaves another employer's employment alone, and routes the employer's waiting People decisions again (a leaver decides nothing).

Hire is one transaction for person selection/creation, employee role, exactly one employment relationship and extension, initial assignment, position occupancy and required policy selections. Optional salary/pay assignment requires payroll permission. Existing orphan employee relationships are offered for explicit completion rather than duplicated. An approved offer can supply inputs, but a recruiter cannot thereby grant payroll or account privileges. Onboarding tasks and account provisioning run after the hire commits with independent outcomes and safe retry; provisioning stays Admin-owned (review Z3). The call is made after commit by a proposed mr-boss SECA (`when="tx-commit"`) on Mantle `mantle.humanres.PeopleServices.hire#Employee` and `apply#EmploymentChange`, as Admin §4.1 designs it, so Mantle does not depend on BOSS. For a hire it calls proposed `ironstone.admin.LifecycleServices.request#Provisioning`, keyed by party, employer organization, employment (`partyRelationshipId`), grant proposal and operation key. The grant proposal is BOSS's: `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default, with the account request optional on ConfirmHire; anything more is chosen by HR from the bundles HR may grant, and Admin's delegation rules decide (§1.1; impl-people §4, Nov 11, 2026). The employment is the employee's organization membership, so provisioning checks it and adds no second relationship. For a separation or an employer change it calls proposed `request#AccessEnd` with the same keys. The IT checklist task carries the returned lifecycle `operationId`, so the task shows Admin's outcome instead of repeating it. A failed call is logged against the employment and retried; it never undoes the hire.

Transfers, salary changes and separation use effective dates and reasoned audit entries. End rather than delete historical relationships. A separation closes future assignments, raises final-pay work and requests access end; it never erases posted payroll or assumes another active employment should lose its login. For equipment (review Y6), the separation raises one return task per current `mantle.product.asset.AssetPartyAssignment` of the person, assigned to the asset's custodian role and naming its assignment; the custodian ends the assignment with `mantle.product.AssetServices.replace#AssetPartyAssignment` from EquipmentDetail. That service requires the new holder and checks no permission or organization, so a return names the receiving custodian and People checks scope before the call; a Mantle rule on the end of an AssetPartyAssignment completes the return task that names it, so a custody change made in Warehouse or Maintenance completes it too (impl-people F52). Retroactive changes identify affected payroll/time periods and require correction workflows.

Lifecycle checklists (review Y5) are template WorkEffort trees instantiated by proposed `mantle.work.ProcessServices.instantiate#WorkProcess` (Maintenance MT-03) with a People policy: no step evidence, readings or waivers. The root is a lifecycle-event WorkEffort with purpose `WepPrOrgMgmt` and no documentation space, so `WorkEffortPartyDocsUsers` adds nobody and `mantle.work.TaskServices.notify#TaskAssigned` has a root to name.

People is built before Maintenance, so it builds the part of MT-03 it needs, under MT-03's names (decided Nov 11, 2026; impl-people §4, F54): `WorkEffortProcessPolicy` and `WorkEffortStepPolicy`, dated and minimal (on the process the using policy and a guards-execution flag; on the step the required flag, the assignable role and the due offset), `mantle.work.ProcessServices.store#ProcessStep` and `instantiate#WorkProcess` (the two-pass copy of design-maintenance §4.2), and People's policy, whose guards-execution flag is false. Maintenance extends the same records and services (publication, approval and applicability; response kinds, evidence, readings and waivers; the checked path) and sets the flag for its procedures; it does not replace them. The generic task and work-effort services refuse a root that has a MaintenanceWorkOrder row and its steps, and work whose process policy guards execution; People's checklist tasks stay ordinary tasks, completed by `update#Task` and `set#TaskStatus` from a screen or a phone.

**As built (impl-people P7).** MT-03's first part is Mantle's `mantle.work.effort.WorkEffortProcessPolicy` (dated: the using policy `WppPeopleChecklist`, `guardsExecution` N for People, an execution's operation key) and `WorkEffortStepPolicy` (dated: required, the role it is assigned by, `dueOffsetDays`), with `mantle.work.ProcessServices` `store#ProcessStep`, `instantiate#WorkProcess` (the two-pass copy in `WorkProcesses.js`: definition fields only, the template flag, status and actuals reset, due dates from the offsets after the change's date, the `WeatDependsOn` edges remapped, one `WeatBasedOn` link from each new node to its template node, the policies copied, each step assigned to the party named for its role; one tree in one transaction; an operation key answering the first root) and `check#ManagedWork`, which `update#Task`, `set#TaskDates`, `set#TaskStatus`, `move#Task`, `set#TaskRecurrence`, `delete#WorkEffort` and the WorkEffortParty writers call to refuse work whose process policy (its own, its root's or its parent's) guards execution, and a root with a MaintenanceWorkOrder row once Maintenance defines it (`MANAGED_WORK`). A checklist root is a `WetTask` of purpose `WepPrOrgMgmt` with no documentation space (a `WetProject` root would list in Projects for an all-projects reader). People's facts are `mantle.humanres.checklist` `ChecklistTemplate` (the employer, onboarding, transfer or offboarding, the dates), `ChecklistStep` (the source link, visibility, protected flag and a named assignee; copied to each task, which also carries the Admin operation of its IT access request) and `EmploymentChecklist` (each execution's employment and change). Mantle's tx-commit rules on `hire#Employee` and an applied `apply#`, `decide#` or `approve#EmploymentChange` call `start#Checklists`: each template of the employer and kind in its own transaction, assigned by role (the employee, their manager, the HR officer who asked, else the step's named person), a failure logged by employment and template; offboarding tasks are protected and left out of `get#TaskObjectTags`, `get#MyTasks` and the task calendar, and reached by a generic listing or record rule (Commons' Tasks and Today, a contact's tasks, search, `get#RecordLinkInfo`) only by a current assignee who is not the person it is about; checklist work has no owning organization (review of P7). A separation raises one return task per `AssetPartyAssignment` the person holds on its date (under a root of its own, assigned to the leaver's manager of that employment from its assignment, else the HR officer who asked (the user's call, Nov 11), naming the holding by a `WorkEffortAssetAssign` and a `WorkEffortParty` of the holder in its role), and Mantle's EECA on an `AssetPartyAssignment` update that sets `thruDate` completes them (`complete#ReturnTasks`), so Warehouse's `replace#AssetPartyAssignment` completes them as People's `return#Equipment` does. Provisioning: `hire#Employee` takes `requestAccount` (ConfirmHire's Request an account) and records it; the mr-boss tx-commit rules call `ironstone.admin.LifecycleServices.request#Provisioning` for such a hire and `request#AccessEnd` for an applied separation, with BOSS's proposal (`BOSS_USERS`, `BOSS_PEOPLE_SELF`, any other bundle only one the caller may give), over Mantle's `IdentityServices.request#Provisioning` and `request#AccessEnd`, which record a lifecycle operation keyed by the change (Provisioning: membership, invitation, grants, notice; access end: the employer's other relationships and, when no internal organization is left, the sessions and memberships), run its steps for an identity operator of the employer and otherwise leave them waiting for one (`OPERATOR_REQUIRED`), who runs them from LifecycleDetail under Admin's delegation rules. The employment is the membership (F49). A request whose steps wait for an operator notifies the employer's identity operators on Mantle's `IdentityOperatorRequest` topic (the person and employer only), opening LifecycleDetail (the user's call, Nov 11). A failed request is noted on the change (`note#AccessRequestFailure`), shown on Employee360 with Request access again, and never undoes the hire. A scheduled change (applied for a date still to come) is withdrawn by HR (`withdraw#EmploymentChange`: its assignments end on their own start and the projections stay as they were; a separation set for later too, the user's call of Nov 11: the employment, its terms and its reports' manager go on, its access end is Withdrawn and its checklist and return tasks cancelled), a separation dated before scheduled changes withdraws them and records itself on them, a return withdraws the leave's scheduled return, and the daily `apply#DueAssignments` routes an employer's waiting decisions on the date a later separation or manager change comes (F131, F134).

### Employees

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FindEmployees | find | Narrow the directory | name, employer, department, manager, location, active/as-of | server-search choices | none | Odoo employee search |
| EmployeeList | list | Browse permitted work identities | person, title, employer, department, manager, location, work contact, state | list/board by department | proposed `mantle.humanres.PeopleServices.find#Employees` | Party/FindParty OuterSearchForm and PartyListForm; Odoo directory |

**Actions and states:** Hire employee opens HireEmployee for HR. Open Employee360; public readers receive public fields only. Archived employment is an explicit HR filter, not a reason to delete the Person.

**As built (impl-people P2).** `People/Employees` (every People user's) with the list as its default subscreen, `Employees/List`. One row per employment `find#Employees` reaches: an employment by an employer a staff reader sees, a live report's, and the user's own with self-service. The public work identity is the name and preferred name (`Person.nickname`), employer, job title (the position's class title, once P4 has positions), manager (the reporting line at that row's employer, below: a reader of one employer sees nothing of another's reporting line), work location (the `PostalWork` city), work email (`EmailWork`, which Mantle seeds; never `EmailPrimary`, which may be a personal address: the user's call, Nov 11, 2026) and work phone (`PhoneWork`), and the state; an HR reader also gets the dates of the employments by an employer in their scope (not of a report's elsewhere) and, as the "Ended employments" filter, the ended ones. FindEmployees narrows by name, employer, manager and as-of date (a date alone is the end of that day, so an employment starting or ending that day counts on it; Home reads it so too). P6 adds each row's department (its assignment's) and Hire employee (the one primary, HR's); the department and location filters are not built yet. The CSV is the same projection, every row up to 2000.



**Source:** research §2

**Needs:** PE-01; PE-02.

### Employee360

**Shared maps (proposed, CX-MAPS):** readable address/coordinate fields use the framework dialog from
[crosscut §3.32](design-crosscut.md#332-maps-and-record-location-dialogs). Work-location maps follow directory scope;
personal/home-address maps require the same self/HR access as their source fields. No hidden address, cached geocode
or approximate postal location reaches a public directory layer, report or map search. Choosing a point remains
an authorized personal-information edit; Maps access alone grants neither HR access nor employee tracking.

**Layout:** 360.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Overview | display | Show work identity and reporting | person, employer, job, department, manager, location, work contacts | record header; employment selector | proposed `mantle.humanres.PeopleServices.get#Employee360` | Party/EditParty EditPersonForm; Odoo employee public |
| EmploymentHistory | list, read | Explain dated employment changes | employment, assignment dates, position, reason, state | dated history | proposed `mantle.humanres.PeopleServices.get#EmploymentHistory` | Frappe internal history; Odoo employee versions |
| PersonalInfo | single | Maintain private identity/contact information | personal contacts, emergency contact, identifications, preferred name | purpose-aware contact inputs | proposed `mantle.humanres.PeopleServices.store#PersonalInfo` | Party/EditParty identification/contact forms; Frappe Employee |
| Compensation | list | Review salary, rates, benefits and assignments | employment, effective dates, salary, currency, frequency, grade, benefit, pay structure | salary change dialog; links to Rates and PayAssignments | proposed `mantle.humanres.PayrollSetupServices.get#Compensation`; extended `mantle.humanres.EmploymentServices.create#EmploymentSalary` | Frappe salary assignment; EmploymentSalary baseline |
| TimeAndLeave | display | Summarize own/authorized time and balances | period, approved hours, requests, available balance | links to owner screens | proposed `mantle.humanres.LeaveServices.get#Balances`; `mantle.work.TimesheetServices.get#TimesheetSummary` | Frappe connections; Projects PersonDetail |
| SkillsAndReviews | list, read | Link development records and the person's resume | skills with level and source, qualifications, expiries, resume lines (employer, role, dates), review dates and states | qualification/review links | proposed `mantle.humanres.DevelopmentServices.get#PersonDevelopment` | Odoo skills and `hr_resume_line`; Frappe appraisal |
| AssignedEquipment | list, read | Show the equipment the person holds | asset, product, serial, role, from date, open return task | EquipmentDetail link | proposed `mantle.humanres.PeopleServices.get#AssignedEquipment` (scoped read of current `AssetPartyAssignment` rows) | Odoo `hr_maintenance` equipment tab; Frappe `full_and_final_asset` |
| FilesAndActivity | component | Show documents and actions within each record’s scope | canonical record, content purpose, action, date | Shared/RecordFiles and Chatter | canonical host providers (PE-01, PE-18) | Party/EditParty content/note forms |

**Actions and states:** Change employment opens EmploymentChange. Payroll may add dated salary; end/replace overlapping salary rows in the extended service rather than silently choosing one. Self edits only permitted personal fields; tax/bank changes use reviewed payroll setup. Sensitive tabs are omitted by the service, not merely hidden. User-account administration is an authorized link to Admin; no groups/password editor is copied here. AssignedEquipment shows no asset cost; its return actions stay on EquipmentDetail. Files on HR records live on their own content hosts (review Y9, PE-01): the application, the employment, a leave request, a payslip, a qualification and a review each hold their own files.

**Per-app context:**

| App | Regions | Fixed scope | Actions | Emphasis |
| --- | --- | --- | --- | --- |
| People | All authorized regions | selected person and employment; organization grants | lifecycle, personal, compensation and development by separate permissions | HR work |
| Commons | Overview; own Personal, TimeAndLeave and issued payslip links | public directory or current user | own permitted corrections and requests | personal service |
| Projects | Overview, SkillsAndReviews qualifications only; links to existing PersonDetail | permitted project/resource person | existing allocation/time actions remain in PersonDetail | staffing without compensation disclosure |
| Maintenance | Overview (public work identity) and AssignedEquipment; qualification validity for technicians | the custodian or technician of work in maintenance scope | open EquipmentDetail and the return task; no HR actions | custody and technician qualification |
| Insights | Overview only, read | the person behind a report drill-down the reader may see | none | report drill-through without private regions |

Admin reaches the person through its own Users screens and an authorized link to Employee360; it has no context row (review Z10).

**As built (impl-people P2).** One page of boxes, in the order Overview, Personal information, Employment history, Files and activity, under the record header (name and preferred name; employments and managers; the opened employment's state; Edit personal information). `get#Employee360` answers the regions the viewer's People scope admits, each other region absent: Overview for any reader it admits (the work identity, the employments it shows, with dates and ids those of HR's own employers, and the managers of those employments' employers); Personal information and Employment history for the person and HR of an employer of theirs; Files and activity for HR of the opened employment's employer (the employment content host), and for nobody else: a person does not read the files of their own employment (the user's call, Nov 11, 2026). A caller that shows the record only when readable (a link, a card) asks with `checkOnly` and is answered no region rather than a refusal. Personal information is the preferred name, home and mobile phones (`PhoneHome`, `PhoneMobile`), home address (`PostalHome`), birth date and gender, and for HR the identifications other than tax ones (SSN, FEIN, FUID), values masked to the last four; `store#PersonalInfo` lets the person change their preferred name and phones and HR editors these and the legal names, birth date, gender and home address, at the revision read, contacts by date; tax and bank fields are payroll setup's (P23). As built in P8 (the user's call, Nov 11, 2026): each emergency contact is a Person party of its own with its names and its own phone, linked from the employee by a dated `PrtEmergencyContact` relationship (the relation, such as spouse or parent, in its `relationshipName`), shown with Personal information to the person and HR of their employer, and added, changed at its revision and ended (never deleted) by the person and an HR editor of their employer (`store#EmergencyContact`, at most five), here and in SelfService. It is private contact data: the contact party is held by Mantle's `_PEOPLE_PRIVATE_` account (`Party.privateOwnerUserId`, an account no one signs in as: disabled, with no password or group, made with the first contact rather than seeded, so a fresh install still offers its first administrator) and owned by the employee; only such a party is an emergency contact (a `PrtEmergencyContact` row another writer makes names nothing `store#EmergencyContact` reads or changes), so every reader that hides a personal contact from all but its owner (the entity filters, the party finds, contact books, Commons' contacts, the palette, search and record links) shows it to no one, and no directory, team or palette answer of People includes it. The per-app table is People.js `employee360Apps`: People (every admitted region; the person's corrections and HR's), Commons (the Overview, and the user's own personal information with their own corrections), Insights (the Overview, read only, with the return to the report). Projects has no row: as Admin, PersonDetail links the People mount for a People user whose scope admits the person and the Commons mount for the person themselves (`get#Employee360Link`); Maintenance's row came with its mount (impl-maintenance P2, F62): the Overview, read only, returning to Maintenance's Equipment, and AssignedEquipment read by Maintenance's own `ironstone.maintenance.EquipmentServices.get#AssignedEquipment` in Maintenance's scope, not People's; qualification validity waits for P18. The employment selector is a row of the employments the person or HR may open when there is more than one. As built in P6, under People: the Overview's employments show their department (the assignment's), Employment history lists the dated assignments (department, position, manager, work location, state, the change that started each), an HR editor of the opened employment's employer has Change employment (EmploymentChange's kinds), and Employment changes lists the changes HR sees and a waiting one its approver decides, with Approve (the primary) and Refuse (`decide#EmploymentChange`).

**As built (impl-people P18).** Under People, Skills and reviews (`DevelopmentServices.get#PersonDevelopment`; People.js `developmentApps`): the person's skills with their level and source (self-declared, evaluated or a manager's evaluation) and date, their qualifications as the reader may see them (the person and HR every field, development all but an identity document's or work permit's number, a manager and other staff readers only verified ones' validity) with their expiry, and their resume lines (`PartyResume`: kind, organization, role, dates) for the person, HR and development, with Add resume line and Remove for the person and an HR or development editor (`store#ResumeLine`) and links to Qualifications and the skills matrix. Reviews join with P20. Commons, Insights and an app with no row show no Skills and reviews.

**As built (impl-people P23).** Under People, Compensation: Mantle's `get#Employee360` admits the region `compensation` only to a payroll reader (PAYROLL_VIEW) of the opened employment's employer, and People.js `employee360Apps` shows it in People's row alone (Commons, Insights and Maintenance have none), so `get#Employee360Context` answers it to payroll and leaves it out for anyone else, HR included, with the same parameters. Its content is `PayrollSetupServices.get#Compensation`: the salary in effect and the salaries before it (amount, currency, frequency, grade, dates), the pay rates in effect, the pay assignments (the primary in effect or next), the benefits, the tax profile of the primary group's localization, the bank accounts as masked references, the pay changes waiting and the employment's payroll readiness. A payroll editor (PAYROLL_EDIT) has Set salary (the employment's first) or Change salary, each a pay change waiting for approval (EmploymentChange below; P23 review, the user's call of Nov 12, 2026: the first salary too), and links to Pay assignments and Rates. A first salary asked through `create#EmploymentSalary` directly is a pay change waiting for approval too (P24 review, the user's call of Nov 12, 2026); only a `PAYROLL_REPAIR` holder (ADMIN) writes one at once. Compensation is opted out of AI (§1.1 "Pay and AI"). A payroll reader opens the employment's id (Mantle shows it to payroll as to HR), so the employment selector works for them.

**As built (impl-people P30).** Under People, Clocking badge, before Compensation, for an HR editor of the opened employment's employer (`AttendanceServices.get#KioskBadge`: the latest badge's state, issued, printed and last used, never its number or PIN): Issue badge (Issue a new badge while one is in use, which it revokes) takes an optional one-time PIN of 4 to 8 digits (P30 review, the user's call of Nov 12, 2026: the worker sets their own PIN in SelfService, typing the one-time PIN once if HR gave one; it never works at a kiosk, and the badge works at none until the worker has set theirs); Print badge, the primary while the new badge is printable, posts to `Employees/BadgePrint`'s print with the page's session token and opens the printable badge in a window of its own, once, for its issuer within 15 minutes (issuing again is the reprint; follow-up 4: a POST, so no link prints a badge); Reset PIN for a forgotten PIN (`reset#KioskPin`: a new one-time PIN or none; the badge stops until the worker sets a new one); Revoke badge (danger, confirmed, with a reason). The state shows Waiting for the worker to set their PIN until they have, and Stopped after 20 wrong PINs (follow-up 4) until HR resets its PIN or issues a new badge. Every kiosk refuses a revoked badge from then on.

Canonical definition is proposed `Shared/Employee360.xml`, owned here and registered in crosscut §3.4. Projects PersonDetail stays the resource workbench, not a second HR record.

**Source:** research §2, §6, §16; baseline Party/EditParty; Odoo `hr_skills` resume lines

**Needs:** PE-01; PE-02; PE-08; PE-14; PE-16; PE-18.

### HireEmployee

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | wizard step | Select an existing person or create one | person, legal/preferred name, work contacts, duplicate match | authorized person search | proposed `mantle.humanres.PeopleServices.preview#Hire` | Party/FindParty CreateEmployeeForm; Frappe Employee |
| EmploymentTerms | wizard step | Establish the legal employment and assignment | employer, start, optional end, position, department, manager, location, schedule | dated record choices | proposed `mantle.humanres.PeopleServices.preview#Hire` | Odoo work information; Mantle Employment |
| ConfirmHire | wizard step | Commit reviewed terms and start onboarding | reviewed inputs, reason, checklist, optional account request | summary and confirm | proposed `mantle.humanres.PeopleServices.hire#Employee`; after commit proposed `ironstone.admin.LifecycleServices.request#Provisioning` | Frappe onboarding |

**Actions and states:** Preview lists duplicates, existing relationships of any type (contractor, contact) and position conflicts; confirmation creates once using an operation key. The position's department must roll up to the employer. Missing payroll setup creates a visible payroll-readiness exception, not an invented salary/country/currency. A failed account/task action does not undo a valid employment.

**As built (impl-people P6).** `People/Employees/HireEmployee`, a `subscreens-panel type="wizard"` over Identity, EmploymentTerms and ConfirmHire, opened by the directory's Hire employee (the one primary) and the quick create; HR's by the grant `BOSS_PPL_EMPLOYMENT` (denied to the root user group, ALWAYS for `BOSS_PEOPLE_HR`). Identity takes the employer (the active one, else the first of the officer's with someone employed) and the person: one People already knows (the `hirePeople` choice over `mantle.humanres.PeopleServices.preview#Hire`, public identity and the relationships with this employer only), found by name among the people related to the officer's employers (employees, contractors, contacts, applicants) and anyone else only by their exact email, so a person employed by another employer is found and not made again (the user's call, Nov 11, 2026), or a new one with work email and phone; a new person whose names or email someone matches is refused until chosen or confirmed new. EmploymentTerms takes the start, an optional end and the first assignment (department, a seat of the employer, vacant ones first, manager, work location); ConfirmHire shows the plan (a new employment, an orphan employee relationship completed, or a rehire beside the ended one), the terms by name, the person's other relationships with the employer and the warnings (no manager, no seat, pay set by payroll). Hire (`hire#Employee`) makes it in one transaction with the draft's operation key and opens Employee360. Each step's transition checks its part with `preview#Hire` and keeps the draft in a draft record, `mantle.humanres.employment.EmploymentDraft` (dated, its HR user's alone, resumed when the wizard is opened again or discarded, and discarded when the hire is made; the user's call, Nov 11, 2026). As built in P7: ConfirmHire notes the onboarding checklists that start once hired and offers Request an account (off by default; the hire's provisioning request after commit, the user's call, Nov 11, 2026). As built in P17: a hire from an accepted offer. Identity lists the accepted offers of the officer's employers ("Accepted offers to hire from", `find#Offers`; OfferDetail's Hire opens it with its offer) and Start from the offer keeps a draft of the offer's employer, applicant and terms (`get#Offer`'s hireTerms, never pay), which HR may change in the steps; `hire#Employee` with `employmentOfferId` locks the offer, admits its applicant as the person, takes its terms where none is given and its working schedule from the first day, and consumes it exactly once (the offer Hired, its application Hired; a second hire from it is refused, `OFFER_USED`, a retry with the draft's key answering the first). The offer asks for no account but as HR chooses on ConfirmHire; its pay, approved with the offer, becomes the employment's first salary from its first day (impl-people P23 review, the user's call of Nov 12, 2026; ConfirmHire's finding says so without the amount).

**Source:** research §2, §6, §17

**Needs:** PE-01; PE-02; PE-03; PE-15; MT-03.

### EmploymentChange

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Change | wizard step | Choose event and new terms | employment, event, effective date, position/department, manager, reason, end date | conditional fields | proposed `mantle.humanres.PeopleServices.preview#EmploymentChange` | Frappe promotion, transfer and separation |
| ImpactAndConfirm | wizard step | Review dependencies and commit approved change | occupied seat, schedule, pay impact, leave, outstanding advances, assigned equipment, tasks, access end | impact list and confirmation | proposed `mantle.humanres.PeopleServices.apply#EmploymentChange`; after commit proposed `ironstone.admin.LifecycleServices.request#AccessEnd` | Odoo departure; Frappe full and final settlement |

**Actions and states:** Submit required approval before apply; source changes invalidate approval. Overlapping primary assignments and occupied single-holder seats fail. Separation creates final settlement work and one equipment return task per current AssetPartyAssignment; it does not mark pay paid, cancel pending claims or disable an account unconditionally. A full settlement statement is an Open item (§18).

**As built (impl-people P6).** `People/Employees/EmploymentChange` (`partyRelationshipId`, `changeKind`), a wizard over Change and ImpactAndConfirm, opened from Employee360's Change employment (Transfer, Manager change, Leave of absence, Return from leave, Separation) by an HR editor of the employment's employer; HR's by the same grant as HireEmployee. Change takes the date and the kind's terms (a transfer's department, position, manager and work location, filled with the terms now; a manager; a leave's return; a separation's type and reason from People's lookups) and why; ImpactAndConfirm shows the terms now and after, what else moves (the seat vacated and taken, the department and line; for a separation the employment's end, reports left with no manager, units left with no lead, another employment that continues, approvals routed again) and who decides. A transfer and a separation wait for approval (`apply#EmploymentChange` asks for it on `PeopleEmploymentChangeApproval`; the person's manager by default) and are applied by the last approval; a manager change, a leave and a return are applied at once. Each change is an `EmploymentChange` row with its operation key, bound with the employment's revision, so a change of the employment meanwhile supersedes a waiting one. The wizard keeps its draft in the HR user's `EmploymentDraft` of the employment and kind, as HireEmployee does. Only a transfer and a separation wait for approval; the pay change joins the topic in P23 (the user's call, Nov 11, 2026). As built in P23: the pay change (`changeKind` pay, `EckPayChange`), payroll's part of a change, asked by a payroll editor of the employer (PAYROLL_VIEW and PAYROLL_EDIT, not HR) from Employee360's Compensation: a new salary from a date (amount in the currency's precision, currency, pay frequency, an optional grade of the employer, a note when outside the grade's band) at the salary revision read; it waits for approval on `PeopleEmploymentChangeApproval`, the first salary too, a request of its own kind, `PakPayChange` (P23 review, the user's calls of Nov 12, 2026: the employer's payroll approvers, PAYROLL_APPROVE with PAYROLL_VIEW, by default, as §1.1 gives managers no compensation; an employer's rule of the kind may route a step to the manager or another approver, who then reads that change's salary alone; never the asker or the person); applied, the salary in effect ends on its date and the new one starts (`EmploymentSalary`, through the same writer as `create#EmploymentSalary`). Its request is bound to the change and the salary rows, so a transfer meanwhile neither supersedes nor invalidates it; it supersedes only a pay change waiting, and a separation supersedes it. Its salary is read by a payroll reader of the employer and the approver of its step alone; HR without PAYROLL_VIEW does not see a pay change; its notice says "a pay change" and names no one and no amount. As built in P7: a separation starts the offboarding checklists and the equipment returns and requests the access end after it is applied (its impact lists them), withdraws the changes set for its date or later, and a return withdraws the leave's scheduled return; Employee360's Employment changes offers HR Withdraw (or Withdraw the return) for a change set for a later date. The pay change and the settlement work join with P23 and P27. As built in P17 (§15): an applied hire, transfer, manager change, leave of absence, return or separation has its lifecycle letter on the offer letter's template (`mantle.humanres.PeopleServices.get#EmploymentLetter` and `issue#EmploymentLetter`, `Letters.js`): Employee360's Employment changes offers an HR editor Issue letter with its preview (`People/Employees/EmploymentLetter`, html-print, marked as a draft), which stores it once (an `EmploymentLetter`), then Letter, the stored one; it names the person, the employer, the date and the terms, never the change's reason.

**Source:** research §6, §16

**Needs:** PE-02; PE-03; PE-15; MT-03.

### OrgStructure

**Layout:** tree list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationTree | list | Browse organization rollups | organization, parent, type, head, active dates, headcount | XML view-tree | proposed `mantle.humanres.OrganizationServices.find#Units` | Party/PartyRelated relationship forms; Carbon departments |
| EditUnit | dialog | Create or reparent a dated unit | organization, name, kind (department or team), parent, effective date, head, reason | parent search | proposed `mantle.humanres.OrganizationServices.store#Unit` | OpenProject departments; Frappe Department |
| TeamMembers | list, editable rows | Maintain dated team membership | team, person, member role, from, through | People-safe person search | proposed `mantle.humanres.OrganizationServices.store#Membership` (`PrtMember` relationship) | Odoo maintenance teams; Projects OrgTeam members |

**Actions and states:** Reparent requires confirmation and rejects cycles, cross-legal-employer moves and stale dates. A department closure requires reassignment of affected employees and approvals; counts show as-of dates. A team is an Organization with the `OrgTeam` role; membership is a dated `PrtMember` relationship and never changes employment. Maintenance and Projects mount teams read-only and keep their own dispatch defaults.

**As built (impl-people P3).** `People/Employees/OrgStructure` (menu "Organization", every People user's; a reader of no employer is told nothing of it is open to them). OrganizationTree is a `form-list` with `views="tree,list"` over `mantle.humanres.OrganizationServices.find#Units` as of a date: the top is each employer the reader reads whose parent they do not read, and a row's next level comes from the `unitChildren` transition (its departments, teams and the internal organizations the reader reads, these shown as legal organizations kept by Admin, as Mantle's demo departments and Warehouse's returns center are, §5 Q6 of the plan); each row has its kind (a chip with its tui text), lead, people (an employer's current employees, a unit's current members), the date it has belonged to its parent and its employer, and a search by unit name lists the matches. A unit opened from a row (`unitPartyId`) shows its facts, its dated parents with their reasons (`get#Unit`) and, for a department or team, TeamMembers. An HR editor (PEOPLE_HR_VIEW and PEOPLE_HR_EDIT) has New unit (the one primary: a department or team under an employer or unit, a lead, a start date and a reason), Edit on the unit (EditUnit: its name, a move under another unit of the same employer from a date, a new lead, with a confirmation; a stale revision refused, the revision covering the lead so an edit read before a new lead does not put the old one back) and Add member and End on TeamMembers (`store#Membership`). A department may belong to an employer or a department, a team to any of these or a team. A membership is a member (from role `Assignee`) or the lead (`Manager`, F63); a new lead's predecessor stays on as a member, a person already in the unit in the other role changes role from the date, and a member must be employed by the unit's employer then. Memberships are open to departments as well as teams in this phase; P6's assignments carry an employee's department and write its member row, and OrgStructure then shows a department's members read only, a team's staying editable (the user's call, Nov 11, 2026). A unit's dates take effect from the start of the day in the user's zone, and every row ends rather than being deleted. As built in P6, a department's members are its employees' assignments' (the assignment writes the Assignee row): OrgStructure shows them read only, and Add member and End are a team's; a department's lead stays the unit's (EditUnit). Close unit (an HR editor's, from a date no earlier than today) ends the unit's rollup and memberships, moves a department's people to another department of the employer (each a reorganization of their assignment), and is refused while units or positions are under it or a membership starts later. A tree row fetched as its parent opens shows its text only (the framework's tree gives a fetched row no links), so a unit is opened from a row of the page or found by name.

**As built (impl-people follow-up 3, the user's call of Nov 12, 2026).** A team may hold contractors: Add member chooses among the employer's current employees and agents (the `staff` choice), and `store#Membership` admits an agent of the team's employer as its member or lead; a department stays employees only (its members are assignments', its lead an employee). A team's employer is the organization its rollups reach, or, for a team made outside People with no rollup at all, its internal owner (Mantle `UnitEmployers.js`, the rule Maintenance's team readers share), so such a team opens here though the tree, which walks rollups, does not list it; it is read only (`NOT_A_UNIT` on a rename, lead or member: a Customer Service service team, say, is that app's; follow-up 3's review). Maintenance's demo team Facilities maintenance has its rollup under Services. An agent's agency ending (a `PrtAgent` row's `thruDate`, whoever sets it) ends their memberships and leads of the employer's teams on its date, unless they still work there (the `AgentEndsMemberships` EECA, `end#AgentMemberships`; the user's call of Nov 12, as a separation does).



**Source:** research §3

**Needs:** PE-01; PE-03.

### OrgChart

**Layout:** tree list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportingTree | list, read | Navigate the reporting hierarchy | person, title, manager, department, work contact, direct-report count | `form-list` `views="tree,list"` with `view-tree` lazy children (the built widget and its TUI twin) | proposed `mantle.humanres.OrganizationServices.get#ReportingTree` | Odoo hierarchy; Frappe org chart |
| ChangeManager | dialog | Make a dated reporting change | person, manager, effective date, reason | person search | proposed `mantle.humanres.OrganizationServices.change#Manager` | Odoo employee work information |

**Actions and states:** Open Employee360 or load one level of reports. Reject self/cyclic reporting and expose unassigned people rather than losing them. TUI offers the same navigation and change form; no drag-only operation. A graphic chart is `later`; the tree view is the first-release chart.

**As built (impl-people P3).** `People/Employees/OrgChart` (menu "Org chart", every staff reader's). ReportingTree is a `form-list` with `views="tree,list"` over `mantle.humanres.OrganizationServices.get#ReportingTree`, paged: a node is a person's current employment by an employer the reader reads, placed under the manager of its line at that employer. A reporting line is a dated `PrtManager` from the manager to the report (F50) and names no employer, so its employers are read from the employments: the report's employers that employ the manager too (a manager employed by no one, a line written before People, is a line at each of the report's employers). A person employed by two employers is a node at each, under that employer's manager, and so are the directory's manager column, Employee360's managers, a manager's team reach (a team reader sees a report's employments at the employers of their line only) and Home's due work (an employment with no manager at its employer). The top is each employer's people with no manager there, the heads and anyone not yet given one, marked "No manager" and listed rather than lost. A person's reports count opens the next level (`managerPartyId`, with Up to their manager and Top), in the browser and the terminal alike; the tree's `reportChildren` transition gives a level as the tree opens a row, which, as in OrgStructure, shows the row's text only. Each node is the directory's public work identity, its manager and its count of direct reports. An HR editor's row has Change manager (ChangeManager over `change#Manager`, at the row's employer: a new manager among that employer's employees, or none, from a date, with a reason and a confirmation); the line in effect ends on the date and the new one starts, both kept; self and cyclic reporting, a manager the employer does not employ on the date, the manager already in place, a later change already set, a line ended or started that would also be the line at an employer the editor does not read (the manager and the person both employed there), and a stale line (the revision the row was read at) are refused. After a change the chart opens on the new manager's reports. As built in P6, the manager is per employment: an employment's assignment names it, a line an assignment names is that employment's alone (never also the line at another employer with no assignment), and Change manager is the employment's manager change from the date (a new assignment, the line its projection, ended only where no other employment of the person uses it; the row's revision the employment's); the "line shared" refusal is left for an employee relationship with no employment record.

**Source:** research §3

**Needs:** PE-01; PE-03.

### Grievances

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Cases | list | List authorized grievances | safe reference, subject, state, assigned handler, submitted date | restricted record links | proposed extension `mantle.request.RequestServices.find#PeopleCases` | Frappe Employee Grievance; Projects requests |
| SubmitCase | dialog | File a confidential case | subject, description, incident date, requested contact, private attachments | restricted upload | proposed extension `mantle.request.RequestServices.create#PeopleCase` | Frappe grievance |

**Actions and states:** Submit records the requester and designated confidential intake handlers. A line manager, general HR group, case watcher or linked-task assignee gains no access automatically. RequestDetail is reused only with PE-01’s explicit participant/handler check on reads, search, files, messages and notifications.

**Existing automation (conditioned).** `RequestTriageNotice` (entity/Request.eecas.xml) runs on every submitted Request and, through `mantle.request.RequestServices.queue#RequestTriage` and `notify#RequestTriage`, sends the request name and the filer to an organization's triage parties or a root work effort's project managers. The HR-confidential type is never in an organization's triaged types and never gets a `rootWorkEffortId`, and `notify#RequestTriage` skips it. `WorkEffortRequestFromWork` (entity/Work.eecas.xml) calls `complete#RequestFromWork` when a linked task changes status; through crosscut's type-aware guard it never resolves an HR case. Both rules are in the §8.3 register and crosscut §1.3.



**Source:** research §6, §18

**As built (impl-people P21).** At `People/Employees/Grievances` (menu 4 of Employees, every People user's and a self-service employee's by its own grant, linked from SelfService as "Raise a concern"; the screen opted out of AI): the user's cases, filed and handled (`mantle.request.RequestServices.find#PeopleCases`), open, closed or all, and Raise a concern (`create#PeopleCase`: the employer's employment, what it is about, what happened, the day and how to contact them; files are attached on the case). Intake: the employer's designated handlers are its PartySetting `PeopleCaseIntake` (party ids; each must hold PEOPLE_CASE_HANDLE through an enabled account and work for the employer, never the employee; none: `NO_CASE_HANDLER`); its settings screen is P29's. A handler adds another eligible handler or takes one off (never the last), and asks someone for work on the case (a task linked by RequestWorkEffort, protected: out of CalDAV and every list but its assignee's, whose assignee reads nothing of the case). Every reader of requests leaves a case out for everyone (Commons' list, Home, request detail and access check, a contact's tab, a call's screen pop, a task's linked records, Admin's open assignments, the id lookup, search and its index, a party's timeline); `get#RecordLinkInfo` admits a case, its files and a note on it to its people alone, for every caller, authorization disabled or not; a note tells its people on `PeopleCaseUpdate` and nobody else may follow it or be sent a message from it. The palette, search, record-lookup and Assist answer no case, for anyone, its people included (§1.4; the user's call of Nov 12, 2026: people open their cases from Grievances). A handler who leaves (P21 review, the user's call of Nov 12, 2026): at the separation, once in effect (or the daily job on its date), they are taken off the employer's open cases, and a case left with no handler goes back to the employer's intake handlers, who are told on `PeopleCaseUpdate` (a title naming nothing); with no intake handler it waits, its employee still reading it. People's lifecycle participant lists a handler's open cases by name alone ("Confidential case", not transferable). An employer with no intake handler refuses a filing (`NO_CASE_HANDLER`, "ask HR who handles them"); P29's Settings sets `PeopleCaseIntake`. A case's notes and files reach no model: an agent's render of its Chatter or Files panel is told it is not available.

**Needs:** PE-01; PE-15; PE-18; PE-21.

## 5. Positions and recruiting

A job class describes work; a position is a dated seat; vacancy derives from current holders rather than a separate “filled” status. `EmplPosition.organizationPartyId` is the legal employer, because `create#Employment` refuses a position whose organization is not the employer. A proposed `EmplPosition.departmentPartyId` carries the department, and `hire#Employee` and the position services check that the department rolls up (`PrtOrgRollup`) to the employer. Retain active `EmpsPlanned`, `EmpsActive`, `EmpsInactive`. A requisition is approval to activate/open/backfill a position, recorded as an approval decision; do not enable the obsolete JobRequisition sketch or its age/gender criteria. A proposed JobOpening records publication text, recruiting owner and opening/closing dates, linked to one or more approved positions; this is distinct from the internal seat. Public publishing is later PASS work.

**As built (impl-people P4).** A position's holders are dated `EmplPositionParty` rows in role `Employee` (the occupancy a hire and an employment change write, `mantle.humanres.PositionServices.store#PositionHolder`), and an employment that names the position (`Employment.emplPositionId`, over the employment's dates) for a person with no such row; a seat has one holder at a time, so an overlapping holder is refused, and a seat cannot end before its holder's last day. Vacancy is computed from the holders at a date: a seat in effect (planned or active) is filled or vacant, never stored. The department is checked to roll up to the employer through the rollups in effect from the later of the seat's start and today. A new seat is planned; its activation is P5's approval. The directory's job title is the class title of the seat a person holds at that employer on the date. Positions are read by an HR, recruiting, payroll or People configuration reader of the employer and by a manager (`PEOPLE_TEAM_VIEW`) for the units they lead and those under them; a directory reader reads none. Job classes are shared by every employer, read by every staff reader and changed by an HR editor; a used class is ended (`EmplPositionClass.thruDate`, added), keeps its positions and is offered for no new one. A pay grade is owned by an employer (`PayGrade.organizationPartyId`, added) or shared by every employer (no owner; impl-people §4, the user's call): an owned grade is read by that employer's staff readers and changed by its payroll editors, and is a missing grade to every other employer; a shared grade is read by every staff reader and changed only by a payroll editor who also holds `PEOPLE_ALL_ORGANIZATIONS`; a position takes its employer's grades and the shared ones. A grade's name is every reader's, a band's amounts, currency and frequency only a `PAYROLL_VIEW` holder's, on every path (the grades, a position's grade, the choices), and a grade or band is changed with `PAYROLL_VIEW` and `PAYROLL_EDIT` (`mantle.humanres.PayrollSetupServices`).

Applicants remain Person parties with a proposed Applicant role, separate from employee roles and user accounts. Existing EmploymentApplication gets the opening link and a seeded flow: Received → Screening → Interview → Offer → Hired, with Refused/Withdrawn terminal alternatives; these labels and status IDs are proposed. Interviews are private WetEvent records linked to the application and assigned panel. Offer is a separately identified decision/document with employment terms, approvals, expiry and acceptance; accepted is not hired. Hire consumes it exactly once. Reviewer scorecards use the shared form engine with explicit reviewer access and release timing, not public survey links.

### JobClasses

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Classes | list | List job profiles and requirements | title, description, skill count, responsibilities, active state | search | proposed extension `mantle.humanres.PositionServices.find#JobClasses` | Dolibarr job profiles |
| NewClass | dialog | Start a job profile | title, description | text | proposed extension `mantle.humanres.PositionServices.store#JobClass` | Dolibarr job profile |

**Actions and states:** Create opens JobClassDetail. End a used class rather than deleting staffing evidence.



**As built (impl-people P4).** `People/Staffing/JobClasses` (menu "Job classes", every People user's; a reader of no employer is told it is not open to them): FindJobClasses (title, ended classes) and JobClassList over `find#JobClasses` (title, a summary of the description, skills, the positions of it the reader reads, the state chip), paged; New job class (the one primary, an HR editor's: title and description) opens JobClassDetail.

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



**As built (impl-people P4).** `People/Staffing/JobClassDetail` (out of the menu): the record header (title, skills and positions counts, state; Job classes and "Positions of this class" links), Job profile (the description and work types) and Requirements (the required skills, class and skill only until P18 adds levels and dates). An HR editor has Edit profile (the one primary: title, description, work types, at the revision read), Add skill and Remove, and End job class under More (a danger link with a confirmation). Classifications are not edited here. The assist-prompt "Draft a job description" waits for P16's skill file.

**As built (impl-people P18).** Requirements list each skill required now with its least level ("At least", a SkillLevel value's number and name, or Any), the qualification type a verified, valid qualification of which proves it ("Proved by"), Required or Desired and its start; Add skill takes them, each row's Change edits them at the requirement's revision and Remove ends the requirement (kept, never deleted). Each period of a requirement is its own `EmplPositionClassSkill` row keyed by its start (`fromDate` in the key, the user's call of Nov 12, 2026, built in P18's review): a change ends the period in effect and starts a new one (a period not started yet is changed in place), and a skill required again starts a new period, never before the last one ended; readers take the period in effect at their date. The header links the skills matrix on the class's people.

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



**As built (impl-people P4).** `People/Staffing/Positions` (the group's default, menu "Positions", every People user's): FindPositions (name, employer, department of that employer, job class, status, vacancy, as of, ended positions) and PositionList over `find#Positions`, as a list or a board by status (no drag: activation is an approval), each seat's name, class, employer, department, grade name, dates, state and vacancy chips and holder, paged, with the CSV; New position (the one primary, an HR editor's: employer, department, class, grade by name, name, dates, hours a week, full time) plans a seat and opens it. No cost estimate is shown: compensation is P23's.

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



**As built (impl-people P4).** `People/Staffing/PositionDetail` (out of the menu): the record header (name; class, department and employer; state and vacancy chips), Terms (employer, department, class, grade by name, dates, hours a week, full time, temporary, salaried, paid overtime; a link to the class) and Holders (every dated holding, read only, with its state and the person's Employee360 on that employment). An HR editor has Edit terms (the one primary; the department, class and grade audited with the reason) and End position under More (refused before a holder's last day). A seat is filled by P6's hire and employment change. The budget reference is not built.

**As built (impl-people P5).** The Requisition: an HR editor asks for a planned seat's activation (Request activation, the primary while the seat is planned and nothing waits; the effective date and why it is needed; `mantle.humanres.PositionServices.request#PositionApproval` at the revision read), routed by the employer's approval rules for the seat's department (§12 ApprovalPolicies) and never to the requester; with no rule the head of its department decides. The Approval box shows the latest request: its state, who asked and why, each step with who decides it and why, and the decisions. An approver of the step waiting decides here (Approve, the primary; Refuse with a reason under More) as from Approvals or the notification tray; the last approval activates the seat (`EmpsActive`), a refusal leaves it planned, and new terms supersede a request waiting (asked for again). Backfill (a vacant active seat refilled) waits for openings (P16).

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



**As built (impl-people P4).** `People/Staffing/PayGrades` (menu "Pay grades", every People user's): Grades over `find#PayGrades`; a `PAYROLL_VIEW` holder sees each grade's band in effect (frequency, minimum, reference, maximum in its currency, from) and opens a grade for every dated band, an HR officer or other staff reader sees the names and is told the amounts are payroll's. Each grade shows its employer, or "Shared". A payroll editor has New pay grade (the one primary: a name, the employer that owns it, or none for a shared grade, a People administrator's, comments and its first band) and New band on each grade they change (from a date; it ends the band before it and changes no salary). A band needs a currency, a Payroll frequency and its three amounts in order.

**Source:** research §4, §9

**Needs:** PE-03; PE-08.

### Openings

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Openings | list | Show recruiting workload | title, employer, positions, owner, open/close, applicants, state | list/board by state | proposed `mantle.humanres.RecruitingServices.find#Openings` | Odoo job kanban; Frappe Job Opening |
| Opening | dialog | Maintain opening text and intake | positions, title, description, owner, dates, internal visibility, intake address | rich text with the built inline text actions; position lookup | proposed `mantle.humanres.RecruitingServices.store#Opening` | Odoo recruitment job; Frappe Job Opening |

**Actions and states:** Open only approved active seats; close stops intake but preserves applications. Email intake is an `EmailRuleAction` `createApplication` (PE-24) on a Comms mail rule, reached by the opening's plus-tag address on the recruiting mailbox. Its service, proposed `mantle.humanres.RecruitingServices.create#ApplicationFromEmail`, makes a Received application for the opening with the sender as applicant and the attachments as private application files, and flags a possible duplicate for review. No public URL is implied before PASS careers exists.

**As built (impl-people P16).** `People/Staffing/Openings` (menu "Openings", key `g n`): FindOpenings (title, employer, state, closed ones when asked) and OpeningList over `mantle.humanres.RecruitingServices.find#Openings`, a list or a board by state (Draft, Open, Closed; an open one past its closing shows closed), each with its employer, seats, owner, dates and open applications, opening its applicants; a recruiter who edits (PEOPLE_RECRUIT_EDIT) has New opening (the one primary: employer, approved active seats, title, owner, dates, mail tag, scorecard, internal only, description; open now or a draft) and per row Edit, Open and Close (`store#Opening`: a planned, ended or another employer's seat refused, the tag unique among draft and open openings). Read by a recruiter of the employer (PEOPLE_RECRUIT_VIEW in People's scope). The description is a text area (no inline text actions); "Draft a job description" is an assist-prompt here and on JobClassDetail (the `people-job-description` skill). Mail intake: `RecruitingServices.create#ApplicationFromEmail`, the `createApplication` rule action, takes the opening from the rule's value or the message's plus tag when the opening's intake account is the message's or the rule's owner is its recruiting owner holding PEOPLE_RECRUIT_EDIT; the sender is the applicant (by address, else a new person with the Applicant role), the attachments the application's files (the first its resume), once per message.



**Source:** research §5

**Needs:** PE-04; PE-18; PE-24.

### ApplicantPipeline

**Layout:** board.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Applications | list | Compare applications | applicant, opening, stage, owner, applied date, next interview | XML view-board by status; list twin | proposed `mantle.humanres.RecruitingServices.find#Applications` | Odoo applicant pipeline |
| AddApplication | dialog | Record a candidate/application | person or identity, opening, source, referral source (`referredByEnumId`), referring employee (`referredByPartyId`), resume, contact permission | duplicate search, private upload, employee search for the referrer | proposed `mantle.humanres.RecruitingServices.create#Application` | Frappe Job Applicant; existing `EmploymentApplication` referral fields |
| StageChange | list, bulk | Apply allowed stage changes | selection, target stage, reason | row selection | proposed `mantle.humanres.RecruitingServices.change#ApplicationStage` | Odoo recruitment stages |

**Actions and states:** Drag invokes the same guarded transition as the list. Interview, offer and hire transitions require their records; Hired cannot be set by dragging. Each bulk failure names the application.

**As built (impl-people P16).** `People/Staffing/ApplicantPipeline` (menu "Applicants"): a recruiter's applications (`find#Applications`), the board by stage (Received, Screening, Interview, Offer) with its list (applicant, opening, applied, next interview, source, owner, the stage chip and a possible duplicate); a card dragged (`moveStage`) and Move to stage on the selected rows (`moveSelected`, a reason) go through `change#ApplicationStage`, each application in its own transaction, the refused ones named (Interview needs a scheduled interview, Offer an offer, P17; Hired is never a move; a closed application does not move). Add application (the one primary): an open opening, a person chosen (an employee, agent or earlier applicant of the employer) or named (an address someone has finds them), source and referring employee, contact permission, notes and a resume (`create#Application`, `create#ApplicationContent`); another open application of the person to the employer is flagged, never merged. Panel members do not read this list.



**Source:** research §5

**Needs:** PE-01; PE-04; PE-15.

### ApplicantDetail

**Layout:** 360.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Application | single | Maintain candidature | person, opening, source, owner, stage, resume | record header; file preview | proposed `mantle.humanres.RecruitingServices.get#Application`; proposed `mantle.humanres.RecruitingServices.store#Application` | Odoo applicant; Frappe Job Applicant |
| Interview | dialog | Arrange a private interview | application, dates, panel, location or call link, scorecard template, invite candidate | calendar availability; "Add video call" | proposed `mantle.humanres.RecruitingServices.schedule#Interview` (a private Event; `org.moqui.call.CallServices.create#CallLink` for a call; `mantle.work.EventServices.send#EventInvitations` for the candidate's iMIP invitation) | Frappe Interview; Gauzy panel; Commons EventDetail call link |
| Scorecards | list | Capture assigned evaluations | interview, reviewer, criteria, rating, evidence, recommendation | shared form response | proposed `mantle.humanres.RecruitingServices.submit#Scorecard` | Frappe Interview Feedback; Odoo surveys |

**Actions and states:** Schedule interview is primary before an offer; Create offer when assessment permits. Resume files and feedback remain application-scoped, on the application's own content host (Y9). A video interview is an Event with a CallLink; the candidate joins as a guest through the link in the iMIP invitation, and the call keeps no captions or transcript unless `speech-local` is used. Rejected candidates keep retention-controlled records without gaining employee roles.

**As built (impl-people P16).** `People/Staffing/ApplicantDetail` (out of the menu) over `get#Application`: a recruiter of the employer reads everything, a panel member of one of its interviews the applicant's name, opening, stage, files and their own interviews and scorecard (never another reviewer's, never another candidate); anyone else "Not available". The header (applicant; opening, employer, applied; stage and possible duplicate chips) with Schedule interview (the primary before an offer: starts, minutes, the panel (employees of the employer with an account), the scorecard (the opening's by default), a video call, a location, the candidate invited by email; `schedule#Interview`: a private `WetEvent`, `WevRestricted`, owned by the recruiter, the call link `org.moqui.call.CallServices.create#CallLink` in its location, the panel and the candidate its attendees, `send#EventInvitations` after, each panel member a `FormInvitation` of the scorecard naming them and the application, with no link; a received or screening application moves to Interview) and under More Move to stage and Edit application. Boxes: Application (a recruiter's: email, source, referral, contact permission, notes, owner), Files (the application's `record-files` host, `EmploymentApplicationContent`), Interviews (each opening its event under Interviews), Your scorecard (the panel member's form to answer once, `submit#Scorecard`) and Scorecards (a recruiter's every one, a panel member's own), both opted out of AI. As built in P17: Create offer (a recruiter's, for an application at Interview or Offer with no open offer: the seat of the opening, the start, an end, the date it is open until and a note; `store#Offer`, opening OfferDetail), the primary once a scorecard is in (Schedule interview the primary before), and Offers (the application's offers with their states, each opening OfferDetail). An applicant's resume is shared with the interview panel when attached (by a recruiter, by mail, from a chat message), another file only when a recruiter shares it, and a recruiter can stop sharing the resume (the user's call of Nov 12, 2026).

**As built (impl-people P16 review).** A panel member reads what their self-service MyInterview shows (§3 SelfService, the user's call of Nov 12, 2026): the applicant's name, the opening and employer, their own interviews and scorecard and the files shared with the panel; no stage chip, Application box or Files host (the application's notes and files are the recruiters': `check#ApplicationAccess` answers recordVisible for a recruiter alone). A new box, Shared with the panel, lists the shared files (opened through `get#ApplicationFile`) and gives a recruiter who changes the application "Choose what the panel reads" (`share#ApplicationContent` per file). The interview invitation's link is Commons' EventDetail, which every attendee opens. "Create application" is a chat message action (Commons' Chat create-from, `create#ApplicationFromChat`): a recruiter makes the sender's application to the room's opening (a JobOpening's room) or to the open opening whose plus tag the message names (+tag), else to the one open opening they own; once per message, never from the recruiter's own message, the message's files the application's files.

**As built (Commons calendar editors, Nov 12, 2026).** An interview's event is People's (`EventManager` PeopleInterview): its
recruiter changes its time, length, place or note (`change#Interview`) and cancels it (`cancel#Interview`) from its row in the
Interviews box, the attendees told; Commons' EventDetail shows it read-only, saying it is changed here, and no attendee puts it in a
calendar. The invitations of a schedule, change or cancel go once it commits (People follow-up 1, F358: a tx-commit rule runs
`send#InterviewInvitations` as the system in a transaction of its own), so a failed send is logged and never undoes the interview;
the screen says they are on their way, and a failed send (an error, or an attendee not told) shows on the interview's row to its
recruiters with Send again, which tells only who was missed (follow-up 1's review). Approved leave's "Out of office" is People's the same way (`EventManager` PeopleLeave): it
changes only with its request, never by its employee on the calendar or a phone.

**As built (impl-maintenance F356, F360; owner contracts, Nov 12, 2026).** The organizer of an interview or a training session
books its rooms and equipment through Commons' booking services (a kept event's organizer books, `check#EventAccess` `canBook`);
an attendee cannot. `change#Interview` and `store#Training` that move the event recheck its bookings (Mantle's
`ResourceBookingDecisions.js` `keptEventMoved`, as the system: a clash with another booking, an outage or a block refuses the
change, an approved booking needing approval is asked again and its approvers told); `cancel#Interview`, a session's cancel and
a leave request's cancel withdraw the event's requested and assigned bookings with their approval notices (`keptEventCancelled`).
Training.js answers `sessionHours` (a person's hours in sessions they are enrolled in or train, not cancelled, overlaps once),
which Maintenance's technician picker takes off the free hours of the work's days.
**As built (impl-people follow-up 3, the user's call of Nov 12, 2026).** An interview takes a meeting room (Schedule interview's and Change's Room, the `rooms` choice: a bookable room, FcTpRoom, not closed): `schedule#Interview` and `change#Interview` book it through Maintenance's resource booking as the system after the recruiter's check (Mantle `EventRooms.js`; impl-maintenance F356), so the room's policy, its other bookings (named Busy) and its blackouts refuse the interview or the change (`ROOM_UNAVAILABLE`), a booking that needs approval waits for the room's approvers (the row says so), a move rechecks every booking of the interview and `cancel#Interview` withdraws them (Maintenance's `keptEventMoved` and `keptEventCancelled`, above). A room is the interview's place unless it is a video call; free text stays for a place that is no room.



**Source:** research §5

**Needs:** PE-01; PE-04; PE-18; PE-21.

### OfferDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Offer | single | Prepare dated terms | applicant, position, employer, start/end, schedule, proposed pay, currency, expiry | controlled document template | proposed `mantle.humanres.RecruitingServices.store#Offer` | Frappe Job Offer |
| OfferDecision | dialog | Submit, approve, issue or record response | offer, action, reason, approver, accepted date, evidence | confirm; restricted file | proposed `mantle.humanres.RecruitingServices.change#OfferState` | Frappe Job Offer workflow |

**Actions and states:** Draft → submitted → approved → issued → accepted/refused/expired are proposed states. Changed terms invalidate approval; store the issued PDF. An accepted offer links to HireEmployee for HR to commit employment once.

**As built (impl-people P17).** `People/Staffing/OfferDetail` (out of the menu) over `mantle.humanres.RecruitingServices.get#Offer`: an offer (`mantle.humanres.recruitment.EmploymentOffer`, a record of its own) of one application at Interview or Offer, one open at a time, read by a recruiter, an HR reader and a payroll reader of the employer and by the approver of the step waiting; anyone else "Not available". Its terms: a seat of the opening (checked as a hire checks it: in effect, active, free then), its department, a manager employed by the employer, a work location of the employer, a working schedule, the start and an optional end, the date it is open until and a note for the letter; its pay (amount, currency, a payroll frequency) is set by a payroll editor (PAYROLL_VIEW and PAYROLL_EDIT) and read by a payroll reader alone, on every path (the offer, the list, the letter's preview, the stored letter holding it, the approval's notice and summary, the hire's terms); others read that it has pay terms. The states as built: Draft, Waiting for approval, Approved, Issued (an issued offer past its expiry reads Expired and takes no answer), Accepted, Declined (the candidate's refusal), Hired and Withdrawn; an approver's refusal makes it a draft again with the reason. `store#Offer` drafts it (a recruiter with PEOPLE_RECRUIT_EDIT or an HR editor; ApplicantDetail's Create offer, which moves the application to Offer) and changes its terms at the revision read while a draft, waiting or approved: changed terms (pay included) make it a draft again and supersede its approval. `change#OfferState` (the OfferDecision): submit (a People approval of kind `PakOffer` on `PeopleOfferApproval`; with no rule the employer's HR officers decide it, never who submitted it or the applicant), approve and refuse (the topic's `approve#Offer` and `refuse#Offer`, over `record#Decision` at the offer's revision), issue (its letter rendered once and stored as an `EmploymentLetter`, the PDF or, where the server has no PDF engine, its html-print page; never rendered again), accept (the date, a note, the signed letter kept) and decline, withdraw. The record header's one primary by state: Submit, Approve, Issue, Record acceptance, Hire (an HR editor of an accepted offer: HireEmployee's Identity with the offer, §4); under More Refuse, Declined by the candidate, Edit terms, Set pay, Preview the letter (`People/Staffing/OfferLetter`, html-print), the issued letter and Withdraw. Boxes: Terms, the candidate's answer, Letter (the issued one, or that payroll reads it when it holds pay) and Approval (the route and decisions). As built (impl-people P17 review, the user's calls of Nov 12, 2026): with no rule the employer's HR officers decide an offer, and who drafted it decides it no more than who submitted it or the applicant; payroll readers of the employer read its offers to set the pay; issuing emails the stored letter to the applicant's address as an attachment once the issue commits (`send#OfferLetter`, template `PEOPLE_OFFER_LETTER`, from the employer's address; the issuer need not be able to open it), the outcome recorded on the offer and shown in the Letter box without the letter's content (emailed, waiting in the mail queue or not emailed, the address, why not), a failed send never undoing the issue and sent again from Send the letter again; the candidate's signed copy of a letter holding pay is payroll's, as the letter, and downloads as a file.



**Source:** research §5, §6

**Needs:** PE-02; PE-04; PE-15; PE-17.

### TalentPool

**Layout:** list; `later`.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PoolMembers | list | Find tagged candidates for a new opening | applicant, tags, last opening, last stage, contact permission, retention date | tag filter; record links | proposed `mantle.humanres.RecruitingServices.find#TalentPool` | Odoo `hr_talent_pool` |
| AddToOpening | dialog | Reuse a pooled candidate | applicant, target opening, reason | opening lookup | proposed `mantle.humanres.RecruitingServices.create#Application` | Odoo talent pool to job |

**Actions and states:** Tagging needs the candidate's contact permission and respects the retention date; a pooled candidate gets a new application per opening, not a reopened one.

**Source:** review R-PPL-F06

**Needs:** PE-04.

## 6. Time and attendance

Attendance is evidence of presence, distinct from work allocation and payable time. Add AttendancePunch and approved AttendanceDay/correction records; do not reuse Projects’ single work timer as a second attendance clock. Preserve imported raw events with source/device identity, worker, local-zone timestamp and direction. Reject duplicate external IDs; flag missing, reversed and overlapping punches for review. Kiosk credentials identify a worker for a narrow action and never grant their session access to payslips or directory searches. Geolocation is off by default and is not required to record time.

WorkingSchedule and dated assignments define local working intervals, breaks, timezone and holiday category; ShiftAssignment supplies explicit dated overrides. Approved leave reduces availability, while attendance does not rewrite the planned schedule. Extend `mantle.work.ResourceServices.get#PartyCapacity` and `mantle.work.TimesheetServices.get#WeekDays` to use People schedules first, retaining the existing WetAvailable/default-week fallback for people with no People assignment. Count an approved leave request once even if it has a WetTimeOff calendar projection. Cross-midnight/DST shifts use actual instants for elapsed time and the configured schedule zone for day/workweek attribution.

**As built (impl-people P9).** `mantle.humanres.schedule.WorkingSchedule` is an employer's dated week (name, IANA time zone, holiday calendar, from and through; a copy is a new schedule, and the zone no longer changes once anyone has followed it) and `WorkingScheduleLine` its dated weekly intervals (ISO day, local start and end, an end at or before the start ending the next day, unpaid break); lines in effect together never overlap, across midnight and the week's end too, and a change from a date ends a line and starts another. An employment follows a schedule through its assignment (`EmploymentAssignment.workingScheduleId`, with `holidayCategoryId` in place of the schedule's calendar), set by `ScheduleServices.assign#Schedule` as a change of its own (`EckSchedule`, applied at once by HR, withdrawable while to come; from the day the assignment in effect starts, a hire's first day, it changes that assignment), so a transfer or leave carries it. A schedule assigned beside a transfer or separation waiting for approval leaves it waiting with its approval (the approvers notified again), and the transfer applies the schedule in effect on its date; one from the waiting change's date or later is refused. A followed schedule's lines change from today on, so a planned week keeps its hours. `ResourceServices.get#PartyCapacity` reads it first (`Schedules.js scheduledDays`): each day is planned by the schedule in effect at noon of that day in its zone, an interval's hours are the instants between its start and end less the break and count on the day it starts, two employments' overlapping intervals count once; the days a schedule plans replace the WetAvailable and policy hours, the policy organization's holidays still apply and the schedule's calendar adds its own; a person with no schedule keeps today's capacity (F23). `TimesheetServices.get#WeekDays` reads it through `get#PartyCapacity`. Approved leave (P12) and shifts (P14) join with their phases.

HoursForPay reconciles all evidence but each pay-group assignment declares a time basis: approved timesheets or approved attendance. The other stream is comparison evidence, not additional paid hours. Approved paid leave supplies distinct inputs; salary proration follows explicit policy. Work quantities can add piece/production inputs independently of time, with source identity and unit. Customer billing and employee pay are separate dimensions: preserve `TimeEntry.invoiceId` and worker-side `vendorInvoiceId`, and prevent a worker invoice and payroll both compensating the same worker-side source. A finalized pay-input link also prevents reopening its source timesheet for destructive edits; a correction supplies a linked delta.

Pay rates on time follow review Y2 (§1.1). Every TimeEntry stores the worker's own rate in `vendorHourRate`, and `TIME_ENTRY_RATE`, granted to `BOSS_PROJECT_MANAGER`, returns and edits rates on submitted weeks. The shared time and rate readers and writers (`mantle.work.TimeServices`, `ResourceServices.find#StaffingCandidates`, the Rates services and the BOSS presentation services) therefore mask and refuse an employee's pay rate without PAYROLL_VIEW and PAYROLL_EDIT; contractors keep today's behavior under `TIME_ENTRY_RATE`. A People screen filter alone cannot close this route; the Mantle fix does. An authorized source-rate change invalidates unfinalized payroll approvals, and a change to a consumed finalized pay source is refused. Labor cost in reports is approved hours times a class and work-type costing rate (PE-23), so project, maintenance and production cost readers never need a pay grant.

### Attendance

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AttendanceDays | list | Find missing or inconsistent punches | person, day, shift, first/last punch, breaks, approved hours, flags | list/calendar | proposed `mantle.humanres.AttendanceServices.find#Attendance` | Odoo attendance list; Frappe Attendance |
| CorrectAttendance | dialog | Propose a reasoned correction | person, employment, date, original punches, corrected intervals, reason | interval editor | proposed `mantle.humanres.AttendanceServices.request#Correction` | Frappe Attendance Request |
| AttendanceDecision | list, bulk | Review explicit corrections | selected requests, action, reason | shared approval actions | proposed `mantle.humanres.AttendanceServices.decide#Correction` | Frappe team requests |

**Actions and states:** Submit correction preserves raw punches; an assigned non-self approver produces approved attendance. Invalid days stay excluded from payable inputs until resolved. Phone lists retain employee and exception text.

**As built (impl-people P13).** `People/Time/Attendance` (menu 8, key `g d`; every People user's and a self-service employee's by the time area's grant). AttendanceDays is `AttendanceServices.find#Attendance`: the user's own days, a manager's reports' at the line's employers, an HR reader's employers' (Mine, To decide, All I see; days; Missing punches only), each with first in, last out (an overnight shift's out marked +1), time worked, what is missing in words (Missing out-punch, Out-punch with no in, Repeated punch; a young open shift is Clocked in) and the state chip, and the list's CSV export (every row up to 5000: the attendance export of §15). A day opens above the list (`get#Day`): its raw punches (direction, time, source, the device or system and its event id) and its corrections with their approval. CorrectAttendance (`request#Correction`): up to two intervals of the day (a To at or before the From ends the next day) and a reason, asked by the person, their manager or an HR editor while no correction waits; Correct a missed day asks it for a day of the user's own with no punch. AttendanceDecision: the To decide view (the corrections whose step waiting the user decides, `Approvals.js waitingFor`), Approve and Refuse (a reason) on the day, Approve selected on the list (each on its own, a refusal named), Withdraw for the person or who asked (`decide#Correction`); the `PeopleAttendanceApproval` topic (People's Approvals and the tray) names the person, the day and the hours, never the reason. Who clocks (HR): the employments that clock, by their own setting or the employer's default, and those set apart from it (`find#Clocking`), each turned on or off, or set to follow the employer again, by an HR editor with a reason (`store#Clocking`, `Employment.clockingEnabled` Y, N or empty, audit-logged). Clocking is an employer's default with per-employment exceptions (P13's review, the user's call of Nov 12): the employer's `PartySetting` `PeopleClocking` (Y on; none or N off), which PeoplePreferences sets (P29), unless the employment says Y or N; `Attendance.js isClockingOn` is the one rule every reader uses. A day is attributed in the zone of the employment's working schedule, else the recorder's (the user's, or the file's), and an out-punch counts on the day of the in-punch it closes within a day; a correction approved is the day's time and the punches stay as they came. Not built: overlapping punches across two employments, a decision notice to the person, a punch's work context and geolocation.



**Source:** research §7

**Needs:** PE-01; PE-05; PE-15.

### ClockingKiosk

**Layout:** task.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| IdentifyAndClock | single | Identify worker and record one action | device, badge/token, PIN when configured, action, facility, observed time | the built `scan-input` for the badge (keyboard-wedge or typed); large confirmation | proposed `mantle.humanres.AttendanceServices.record#KioskPunch` | Odoo kiosk; Carbon timecard toggle |

**Actions and states:** Show only the identified worker’s name and action confirmation, then clear the screen. Rate-limit proof attempts; revoke devices centrally in Admin. Online recording only in the first release; a network failure says not recorded and retries with the same event key. No biometric matching, camera scanning or offline sync is assumed.

**Devices:** shared tablet or phone at `density="handheld"` (built), registered with the device credential of Admin ADM-DEVICES (PE-22; crosscut CX-DEVICE), which gates this screen: a page of its own at `/apps/People/Time/ClockingKiosk`, outside the `/qapps` shell, read as the kiosk's display account, with `record#KioskPunch` refused outside a device's request (impl-people F55, P30). The screen clears after each confirmation and on idle; a device unused past its route group's idle timeout is registered again. TUI uses credential/scan entry without a directory picker.

**As built (impl-people P30):** a standalone, hidden screen whose html mode is a bare page (the qvt client's files and the screen as an island, no navigation, menu or account; Insights' WallDisplay pattern) and whose qvt and tui renders are IdentifyAndClock at `density="handheld"`: the employer's name; Badge, a `scan-input` whose resolver (`resolve#KioskBadge`) answers the scanned or typed number as "Badge read" with nothing looked up, so a scan names no one (`auto-submit` off: the PIN follows); PIN (a password field); Action (in or out as the worker is, Clock in, Clock out); Clock in or out. The scan's id is the punch's event key, so a resubmission after a lost answer records once. The answer is a message naming the worker, the action and the time ("Tomas Lindqvist: clocked in at 08:02"), or why nothing was recorded (the badge not recognized or revoked, its PIN not set by the worker yet, the PIN wrong, too many wrong PINs, another employer's badge, clocking off, already in, not in, one moment); a refusal is a message and never an error response, so nothing typed is kept in the browser's session, and the screen loads again empty either way. The page empties a half-typed form after a minute without input and reloads itself after half an hour idle (a revoked device then shows the server's refusal page, and a quiet one stays seen within its week's idle timeout). Mantle's `record#KioskPunch` records a punch only in a registered device's request whose display account holds `PEOPLE_KIOSK_PUNCH`; the worker is the badge's employment, which must be current, with an organization of the display account's, and clock (`isClockingOn`); the punch is at the device's site and names the device and the badge (`AttendancePunch.deviceId`, `kioskBadgeId`, source Clocking kiosk). A badge (`KioskBadge`) is an employment's: an HR editor issues it with a one-time PIN or none (the badge before it revoked), its number (20 random digits) is made when its issuer prints it, once, within 15 minutes, and the worker sets their own PIN of 4 to 8 digits in SelfService (P30 review, the user's call of Nov 12, 2026), all kept only as hashes (the PIN argon2); the badge's state and PIN are checked and its count written under its row lock, so proofs at once are counted one by one, and the fifth wrong PIN in a row locks the badge for 15 minutes, each lockout after twice as long until a right PIN; the twentieth wrong PIN within a day (at kiosks and in SelfService alike, since HR last reset the PIN) stops the badge until HR resets its PIN or issues a new one, and tells the HR editors of its employer, to them alone, naming the person and never the number or a PIN (`PeopleKioskBadgeDisabled`, its record the employment, opening Employee360), and the worker, to them alone, that their badge is stopped and HR must reset its PIN (`PeopleMyKioskBadgeDisabled`, opening their SelfService under Commons, where My clocking badge shows it stopped; follow-up 4, the user's calls of Nov 12, 2026). A device's refused proofs are `KioskAttempt`s: from 5 in 10 minutes its next proof is checked only once a pause after the last refusal has passed (1 second, doubling with each refusal, at most 5; sooner it answers "one moment" and counts nothing), so a run of bad scans slows the device and never shuts a worker out for longer (the user's call of Nov 12, 2026, in place of P30's ten-minute refusal of everyone); from 10 in 10 minutes the HR editors of the device's organizations and the access administrators (`ADMIN_ACCESS_MANAGE`) on their staff, whose scope covers the device's display account (follow-up 4), are told, at most once an hour per device (`PeopleKioskRefusals`, to them alone, naming the device and the count; its record is the device, which opens Admin's Security › Devices with that device, where it is revoked, for a recipient who may read it there and whose groups open the screen, and no link for the others, follow-up 4); attempts are kept 90 days (`prune#KioskAttempts`, a daily job). A signed-in person who opens the page sees that it records punches only on a registered clocking device.

**Source:** research §7

**Needs:** PE-01; PE-05; PE-22.

### WorkingSchedules

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Schedules | list | List schedules and usage | name, employer, timezone, weekly hours, holiday calendar, effective dates | search | proposed `mantle.humanres.ScheduleServices.find#Schedules` | Odoo working schedules |
| NewSchedule | dialog | Start a dated schedule | name, employer, timezone, start date, holiday category | timezone/calendar choices | proposed `mantle.humanres.ScheduleServices.store#Schedule` | Odoo resource calendar |

**Actions and states:** Open WorkingScheduleDetail; duplicate creates a new schedule identity. No hard-coded five-day week or US holidays.

**As built (impl-people P9).** `ScheduleServices.find#Schedules`: a staff reader's employers' schedules and those a manager's reports follow, with weekly hours, calendar, dates, state and, for HR, how many follow each. New schedule (the primary, HR editors) takes the name, employer, zone (the user's by default), calendar and start; Copy makes a new schedule of the same employer with the copied lines from its start. A schedule is an employer's; there is no shared schedule.



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

**As built (impl-people P9).** One detail screen with the record header and three boxes, not tabs. Week lists every dated line (in effect, coming, ended) with Add working hours, Change and End from a date. Assignments lists who follows the schedule now or later (every one for HR, a manager their reports) with Assign (the primary: an employee of the employer, a date, an optional holiday calendar, a reason) and End for employee. Capacity preview is `ScheduleServices.get#CapacityPreview` over `get#PartyCapacity` (a person HR reads or a manager's report, up to 62 days): each day's planned hours, holiday, leave, available hours and schedule, and where the hours come from, as Projects' PersonDetail shows them. The impact on leave and shifts waits for P11, P12 and P14.



**Source:** research §7; Projects §15

**Needs:** PE-06; PE-07.

### ShiftRoster

**Layout:** calendar.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Roster | component | Display people against dates | person, employment, date, shift, facility, availability, exception | the shared resource-lane timeline (crosscut M11, one lane per person); TUI person/date table | proposed `mantle.humanres.ScheduleServices.get#Roster` | Frappe roster; Projects WorkItems Timeline |
| AssignShift | dialog | Set or move one dated shift | employment, local start/end, timezone, facility, schedule, reason | date/time fields | proposed `mantle.humanres.ScheduleServices.store#Shift` | Frappe Shift Assignment |

**Actions and states:** Drag shows a preview and the dialog commits, through the same service; reject overlaps, ended employments and approved leave conflicts. Publishing notifies affected workers, updates capacity and refreshes the projected shift calendar on their phones (CX-SYNC). Optimization, swaps and offline rosters are later.

**As built (impl-people P14).** `People/Time/ShiftRoster` (menu 12, key `g h`), HR's and the managers' with the working schedules (`BOSS_PPL_SCHEDULES`), is Projects' Timeline.qvue in its resource mode, whose lanes, bars, wording and transitions are the mount's answer (design-projects §5 Timeline "Resource mode as a contract", crosscut M11): one lane per employment the user reads (a manager's live reports at their lines' employers, an HR reader's employers' employees, an employer filter when there are several; at most 200), shaded with the working schedule's hours, holidays and approved leave (a whole day or a half, never the type or reason), the shifts as bars (a draft dashed, a conflict found since in the warning color). Roster is `mantle.humanres.ScheduleServices.get#Roster`; AssignShift is the timeline's dialog over `store#Shift` (person, start, end, break, work location, reason; preview writes nothing, Save shift commits a draft or the change at its revision with an operation key; Remove shift cancels): a drag or a click on a free time only opens the dialog previewed. `mantle.humanres.schedule.ShiftAssignment` is an employment's shift: its instants, the zone its day is attributed in (the employment's working schedule's, else the rosterer's) and that day, its break and work location; it ends after it starts, lasts at most a day, starts after now, lies within the employment (`EMPLOYMENT_ENDED`, `DATE_OUTSIDE`) and overlaps no other shift of the person in any employment (`OVERLAP`) or their approved leave (`LEAVE_CONFLICT`, the half day it touches); leave still waiting and a holiday are warnings; a work location is the employer's own or the assignment's (`FACILITY_INVALID`), and an overlap with a shift at an employer the rosterer does not read is named without its times. A manager rosters their reports, an HR editor the employer's employees, each with `PEOPLE_ROSTER_EDIT` (§1.1; without it they read the roster, every lane read only); an HR reader reads the roster. The rosterer's comments (the dialog's reason) stay the roster's: the worker's My shifts and the team calendar never show them, and a colleague's shift on the team calendar is its times alone (the work location is the person's, their manager's and HR's). Publish (the primary while drafts wait) is `publish#Shifts`: the drafts of the days, each assessed again in its own transaction (one refused since is named and stays a draft), each worker told once (`PeopleShiftChange`, opening the team calendar); a published shift changed or removed is told too and does not move to another person. Capacity (`get#PartyCapacity` through `Schedules.js scheduledDays`): a published shift's hours replace the schedule's (or the policy's) that day, once, and no holiday takes the day; leave approved later still takes its hours, once. The terminal is ShiftRosterTui (a person and day table a week, the shifts of the days, Shift with its preview box and Save shift, Remove shift, Publish); the print is ShiftRosterPrint (§15). Optimization, swaps, open shifts and templates are later.



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

**As built (impl-people P24).** `People/Time/HoursForPay` (menu 13 of Time & leave; payroll's and the managers', `BOSS_PPL_HOURS_FOR_PAY`, denied to the root user group and to self-service). A pay group and one of its prepared periods are chosen (the choices `hoursGroups`, `payPeriods`); the employments are those whose primary pay assignment puts them in the group on a day of the period. Reconciliation (`get#Reconciliation`): per employment the hours scheduled (the working schedule), present (attendance), submitted and approved (timesheets) and payable by the group's time basis, paid and unpaid leave, pieces, the claims reserved for payroll (a count), the other stream's difference, its state (ready, blocked, changed since prepared, prepared, nothing to pay) and what stops it; the counts of each state; an employment opened shows its days, its timesheets (linked to TimesheetDetail), the attendance to resolve (a link to Attendance), its leave (linked to LeaveRequestDetail) and its prepared inputs. Hours and counts only, never an amount: a manager reads their reports' rows with the same answer. PrepareInputs (the one primary, a payroll editor's; `prepare#Inputs`): previewed first, with a source cutoff and some employees; each employment in its own transaction under its lock. What a period pays: the worked hours of each day from the group's time basis alone (`PtbTimesheets`: the approved weeks' entries; `PtbAttendance`: a corrected day, or a past day recorded with no flag, what P13 left to this phase; `PtbSchedule`: no time), so the other stream is comparison only; a time entry's pieces on an approved week whatever the basis; each working day of approved leave, paid or unpaid as its policy says, in the hours the employment's schedule plans for it; and an approved claim reserved for payroll, in the group's currency. Each input is one entitlement (a worked day of the employment, whichever stream or adjustment pays it; a leave day; an entry's pieces; a claim) held once (`PayrollInput.activeEntitlementKey`, unique), and each source record consumed once (`PayrollInputSource.activeSourceKey`, unique); inputs from approved sources are approved. Preparing again makes nothing twice; an input whose sources changed (a fingerprint of the hours, rates, minutes or state) or no longer pay is voided and prepared again, a finalized one only noted. An unapproved week (timesheet basis), unresolved attendance (attendance basis), an entry on a worker invoice, time of another employment no entry's employer settles, a conflicting claim or a source another input holds blocks that employment alone, named. ResolveInput (Resolve a day, a payroll editor's; `store#Adjustment`): the hours (or pieces) payroll pays for a day, with the reason and evidence, an adjustment a payroll approver approves; a resolved worked day is that day's entitlement, so it blocks nothing and its stream pays nothing more. The source guards (owner contracts, design-projects §8 "As built for People's payroll"): a worker invoice refuses a consumed time entry and payroll refuses an entry on a worker invoice; a week a finalized input paid is not reopened and its entries are not changed (`PAY_FINALIZED`), and reopening a week or an authorized change of an entry's hours or rates voids an input not finalized; a payroll claim's reservation released frees its input.



**Source:** research §7, §9

**Needs:** PE-05; PE-07; PE-09; PE-10.

### TimeImport

**Layout:** wizard.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FileAndMapping | wizard step | Identify the import format and employer | file, kind, employer, timezone, identifier mapping, source system | upload; mapping preview | proposed `mantle.humanres.AttendanceServices.preview#Import` | Mantle TimeSummary/TimeDetail imports; Frappe check-in |
| ImportResults | list | Commit valid rows and explain failures | row, source key, worker, action, result, error | download error rows | proposed `mantle.humanres.AttendanceServices.import#Records`; existing `mantle.work.TimeServices.import#TimeEntryCsv` for project-time format | Projects ImportTime |

**Actions and states:** Do not send raw punches into the Projects CSV importer. Resolve employment and units; preview exposes duplicates and invalid periods. Each independent row commits separately, and retries skip known source keys. Import does not approve timesheets or attendance. Legacy TimeSummary/TimeDetail formats require an explicit adapter to this staging path. TimeImport keeps its own wizard because punches need device and zone mapping, and registers as a `wizard`-mode transfer target with its `findService`, as Accounting's statement imports do (review Z2), so Admin's import list shows its batches. The target names `PEOPLE_IMPORT` and no Admin permission: `preview#Import` and `import#Records` check it beside People's own permission and scope, and the `findService` answers by People's view permission and scope (§1.1; impl-people §4, P13).

**As built (impl-people P13).** `People/Time/TimeImport`, out of the menu, opened from Attendance and from Admin's Imports (owner route `peopleTimeImport`), HR's own (`BOSS_PPL_TIME_IMPORT`). FileAndMapping: the employer, the file (or the rows pasted), the device or system it comes from, the zone of its times, how workers are named (People id or work email) and the columns (worker, time, in or out, an optional event id and device; comma, semicolon or tab); `AttendanceServices.preview#Import` (`PEOPLE_IMPORT`, `PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT` of the employer; at most 5000 rows and 1 MiB, read by the framework's transfer reader) keeps an `AttendanceImport` with each row resolved to the worker's employment at that time and its source key (the employer, the source system and the event id, else the worker, instant and direction) and its outcome: ready, already recorded, repeated in the file, or refused with its reason (unknown or ambiguous worker, not employed or two employments then, a bad or future time, a bad direction). ImportResults: the counts, Import (`import#Records`: the ready rows in time order by employment, each in its own transaction, a key recorded meanwhile skipped, a failure named; an import done answers as it ended) and the rows, all or the problems, with their CSV export. Mantle registers the `wizard` target `timeAndAttendance` (`importPermission` `PEOPLE_IMPORT`, `viewPermission` `PEOPLE_HR_VIEW`, `findService` `AttendanceServices.find#ImportRuns`: the imports of an HR reader's employers with the place that opens each). Project time stays Projects' importer under Time entries.



**Source:** research §7, §17

**Needs:** PE-05; PE-09; PE-19.

## 7. Leave

A proposed LeaveRequest has its own ID and interval/segment lines, avoiding EmploymentLeave’s employment/start-day key. One person may make distinct morning and afternoon requests on the same date. LeaveType defines unit, paid/unpaid meaning and required evidence; dated LeavePolicy and assignments define allocation, accrual, carry-over, expiry, negative-balance limit and approval steps. LeaveLedgerEntry records grants, accruals, consumption, expiry, adjustment and reversal, each with source identity; posted entries are append-only. Pending requests reserve displayed availability separately from approved consumption.

Requested → approved/refused → cancellation-requested → cancelled is the proposed request flow; withdrawal is available before approval. Under lock, approval recomputes schedule-derived duration, checks overlaps and available balance including other reservations, then posts the consumption once. Cancellation reverses the original consumption; it does not delete ledger entries. Accrual jobs use a unique employment/policy/accrual-period key, isolate failures and retain progress. Effective-date policy changes preserve historical ledger meaning.

A policy can name dated blocked intervals (busy seasons, stocktakes) for an employer, department or leave type; the preview refuses a request that overlaps one, or warns where the policy allows an approver override. Approved leave publishes a minimal WetTimeOff projection linked to the request and creates distinct paid/unpaid payroll inputs. The projection gets a leave-start reminder through `mantle.work.EventServices.store#WorkEffortReminders`, sent by the existing `send#DueReminders` job on the Commons `WorkEffortReminder` topic. Shared calendars expose absence and dates without diagnosis or evidence; attachments remain request-scoped. If payroll has already finalized the leave, cancellation/reclassification creates a next-run correction, not a source rewrite. Legacy EmploymentLeave remains readable; migration creates explicit requests/ledger openings only after reconciliation and never double-counts legacy rows and new projections.

**As built (impl-people P11).** `entity/PeopleLeaveEntities.xml` (package `mantle.humanres.leave`) and `mantle.humanres.LeaveServices` over `Leave.js`. A leave type is an HR vocabulary, the Enumeration family `PeopleLeaveType` (Annual, Sick, Parental, Bereavement, Unpaid; People's Lookups), not a record of its own: the unit (days or hours), paid meaning and evidence are the policy's. `LeavePolicy` is an employer's, for one leave type, dated (closed, never deleted; a closed policy takes no assignment and accrues nothing from then), with its entitlement requirement, negative limit and accrual frequency (monthly, quarterly, yearly, or none: allocations only); its terms are audited and its type, employer, and, once posted, unit and frequency are fixed. `LeaveAccrualRule` steps are dated, by months of service (the step with the most months reached applies), with an amount a period, a cap, a carry-over limit at a year's end and a rounding step; a change from a date ends a step and starts another, and once accruals are posted a step changes from today on. `LeavePolicyAssignment` puts an employment under one policy of a leave type at a time, from a date, with an opening balance posted once. `LeaveBlockedInterval` holds blocked or mandatory days of the employer, a department or a leave type, entered on a policy, with whether an approver may override; it cancels nothing (requests come with P12). `LeaveAllocation` is a grant for an entitlement period, refused for a second overlapping period of the policy, or a reasoned adjustment. `LeaveLedgerEntry` holds every movement (opening, grant, accrual, consumption, expiry, adjustment, reversal) with its source and a unique source key; it is never changed or deleted, and a balance as of a date sums the entries effective by then. The accrual (`run#AccrualJob`, the daily `run_LeaveAccrual` job, and `run#Accrual` for HR) takes each assignment in its own transaction (`accrue#Assignment`, the operation `people.leave.accrual`), a failure logged by employment and policy: each ended calendar period posts once in arrears (keyed by employment, policy and period), in proportion to the days covered, rounded and capped; at a year's end the balance above the carry-over limit expires once, and what is left of a grant after its expiry day expires once, as far as the balance holds it. Every write to an employment's entitlement locks its employment relationship row. Legacy `EmploymentLeave` rows are read only, listed as historical (dates, type, approval; never the reason) beside an employment's movements and counted in no balance (§5 Q8 of impl-people). Durations from schedules and holidays, reservations and consumption are P12's.

### LeaveRequests

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Requests | list | Find own or assigned leave | person, type, interval, charged hours/days, state, approver | list/calendar; mobile columns | proposed `mantle.humanres.LeaveServices.find#Requests` | Frappe leave applications; Odoo time off |
| RequestLeave | dialog | Preview and submit time off | employment, type, segments, reason, supporting file | duration/balance preview; blocked-day finding | proposed `mantle.humanres.LeaveServices.preview#Request`; proposed `mantle.humanres.LeaveServices.submit#Request` | Frappe PWA Leave Form; Odoo hours/half-day request |

**Actions and states:** Request leave is primary; preview shows duration, holidays, blocked days, reserved balance and expected remainder. The holiday-aware duration counts the employment's schedule days and skips the WepHoliday categories of its holiday calendar, as `mantle.work.EventServices.get#NextBusinessDay` and `get#FutureBusinessDay` do. No allocation or approver means a clear block, not zero-cost leave or automatic approval. The reason field carries the AI opt-out (PE-21).

**Devices:** phone; SelfService fixes the current party.

**As built (impl-people P12).** At `People/Time/LeaveRequests` (menu 4, key `g l`), every People user's and a self-service employee's by the time area's grant. `mantle.humanres.LeaveServices.find#Requests`: Mine, To decide (the step waiting is the user's, `PEOPLE_REQUEST_APPROVE`) and All I see (a manager's live reports, an HR reader's employers); by state, type and days; never a reason. Request leave in two steps: the type, the days (a run of whole days, or the morning or the afternoon of one day; one segment per request, so a morning and an afternoon of a day are two requests) and, for an HR editor, the employee; then `preview#Request` (each day with its planned hours, holiday and charge; no schedule counts Monday to Friday, 8 hours; the balance, the other reservations and what is left; blocked and mandatory days; the approvers; what blocks it: no policy, nothing charged, not enough balance when the policy needs an entitlement, another request of the day and part, a blocked day, outside the employment, no approver), where the reason is written (opted out of AI, PE-21; never carried in the URL) and `submit#Request` makes it. A supporting file is not built (an evidence policy is a warning to give it to HR).

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

**As built (impl-people P12).** At `People/Time/LeaveRequestDetail`, from `get#Request`: the person, who asked, HR of the employer, the person's manager and its approvers read it (another is told it is not available). The header (days, type, what it charges, state), the decision notice once decided (outcome, who, when, a refusal's reason; the person and who asked are also told by `PeopleLeaveDecision`), Request and balance (the balance now, what the other requests waiting reserve, this request reserved or taken, what is left; each day's planned hours, holiday and charge; blocked days on it), the reason in a section and field opted out of AI (read by the person, who asked, the approvers and HR), and the approval (steps, decisions). Actions by what the user may do (`decide#Request` checks again): Approve (primary) and Refuse with a reason for an approver of the step waiting, also from Approvals; Withdraw while it waits (the person or who asked); Ask to cancel approved leave (the person; decided by the same route); Cancel leave at once with a reason (an HR editor). The last approval recounts the days and checks overlaps and the balance with the other reservations under the employment's lock, then posts the leave taken once (only when the policy needs an entitlement) and projects the leave; a cancellation reverses it once. The payroll correction of a cancellation after a finalized run waits for P24 and P26.



**Source:** research §8, §13

**Needs:** PE-07; PE-09; PE-15; PE-21.

### LeaveBalances

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BalanceFind | find | Select an entitlement view | employment/team, type, as-of date | authorized choices | none | Frappe leave balance report |
| BalancesAndLedger | list, read | Reconcile balance movements | opening, grant, accrual, consumed, expired, adjustments, pending, available | drill-down by source | proposed `mantle.humanres.LeaveServices.get#Balances`; proposed `mantle.humanres.LeaveServices.find#Ledger` | Frappe leave ledger; Dolibarr modification log |

**Actions and states:** Export only authorized rows; clicking a movement opens its request/allocation. Historical balances use movement effective dates and retain reversal evidence.



**As built (impl-people P11).** At `People/Time/LeaveBalances` (menu 7), HR's and the managers' (`BOSS_PPL_LEAVE_BALANCES`). `get#Balances` as of a date: an HR reader's employers' employments current then, a manager's live reports at the line's employers, the person's own; by employer, department (with the units under it), person and leave type; one row per employment and leave type with its policy in effect, opening, granted, accrued, taken, expired and adjusted, the balance, pending (none until P12) and available; paged by employment. An HR reader (and the person) opens an employment's movements (`find#Ledger`: date, kind, amount, balance after, what it came from, posted; newest first; the CSV export is the same rows) and its historical leave; a manager reads balances alone. The employee's own balances are on SelfService.

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



**As built (impl-people P11).** At `People/Time/LeaveAllocations` (menu 11), HR's (`BOSS_PPL_LEAVE`). Choose a policy, then an employee, a department and the units under it, or every current employee of the employer, and a grant (amount, entitlement period, optional expiry day) or a reasoned adjustment; Preview (`preview#Allocation`, nothing written) lists each with their balance now and outcome (ready, or refused and why: not under the policy in the period, a grant for the period already, below the negative limit), the count and total; Allocate (the primary, confirmed with the count and total) posts it once under the preview's operation key (`allocate#Leave`), each employee in their own transaction, a double submit answering "already done" and the refused named. Row selection on the preview is not built: an employee is chosen in the form.

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



**As built (impl-people P11).** At `People/Time/LeavePolicies` (menu 10), HR's (`BOSS_PPL_LEAVE`). `find#Policies`: an HR reader's employers' policies by name, employer and leave type, closed ones on request, each with its accrual in words, dates, employees now or to come and state; New policy (the primary) takes the name, employer, leave type, unit, accrual frequency, paid and entitlement flags and start.

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
| BlockedDays | list, editable rows | Block or require days for leave | scope (employer, department, leave type), from, through, kind (blocked or mandatory), approver override allowed, reason | date-period | proposed `mantle.humanres.LeaveServices.store#BlockedInterval` | Frappe Leave Block List; Odoo `hr_leave_mandatory_day` |

**Actions and states:** Validate against explicit examples before publish; overlaps and incompatible units fail. An assignment change does not recalculate already-posted accruals. A new blocked interval does not cancel approved leave; it lists the approved requests it overlaps for review.

**As built (impl-people P11).** At `People/Time/LeavePolicyDetail`, out of the menu, HR's. Record header (Assign the primary: an employee, a department's or the employer's employees from a date with an opening balance, each refusal named; More: Allocate leave, Run accrual, Edit terms, Close policy), Policy terms, Accrual and carry-over (steps with Add step, Change and End from a date), Assignments (End for an employee) and Blocked days (Add blocked days, Cancel). The schedule preview of AccrualAndCarry and the validation against explicit examples are not built; the steps say what they post in words, and the ledger shows what was posted. A new blocked interval lists no overlapping approved request until P12 builds requests.

**Source:** research §8; review R-PPL-F02

**Needs:** PE-07; PE-15.

### HolidayCalendars

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Holidays | list | Review dated non-working days | category, date/interval, name, organization, timezone | calendar/list | proposed `mantle.humanres.ScheduleServices.get#Holidays` | ERPNext Holiday List; Mantle HolidayUsaData |
| Holiday | dialog | Add or change a holiday | category, name, dates, local zone, applicable organization | event date inputs | proposed `mantle.humanres.ScheduleServices.store#Holiday` | Commons Calendar; Frappe holiday assignment |

**Actions and states:** Use WepHoliday event categories and Commons event services internally. Seed US categories are examples, not automatic employer assignments. A retrospective edit reports affected leave/pay calculations and uses corrections.

**As built (impl-people P9).** At `People/Time/HolidayCalendars`, HR's (§1.2). A calendar is a `WorkEffortCategory` of type `WcatHoliday`, an employer's (`ownerPartyId`, changed by its HR editors) or shared (no owner, changed only with `PEOPLE_ALL_ORGANIZATIONS`; Mantle's US examples are shared and followed by nobody until a schedule names them, F31). A holiday is an all-day `WepHoliday` work effort on its day in the calendar with no owner, written by `ScheduleServices.store#Holiday` directly rather than through Commons' event services, so the employer-owned holiday convention (a `WepHoliday` owned by the organization, every employee's) does not read it: a calendar's holidays take only the days of the schedules naming it. A day is a calendar's holiday once; a holiday whose day has passed stays as it was, and none is added on a past day (the report on affected leave and pay waits for P11 and P25). The applicable organization of the design is the calendar's employer.



**Source:** research §7, §8

**Needs:** PE-06; PE-07; PE-18.

## 8. Payroll and compensation

**Release 1 (decided Nov 1, 2026; review R-PPL-15).** The native engine of this section ships in the first release, and its screens stay `new`. It runs in preview mode: components, structures, assignments, inputs, calculation, review, approval and payslip explanation all work, and finalization cannot create payable obligations. Live finalization is enabled per pay group only when both gates hold: a chosen and maintained localization covers the group (§8.4, §18), and Accounting's payroll-origin projection (review Y7, §8.3) restricts payroll invoices, payments and ledger lines on the built finance screens. PayrollExchange's external-processing mode needs no native localization for its group, and its results pass the same review and Accounting handoff; because they create the same payroll invoices, its live results are gated on the payroll-origin projection as native finalization is (decided Nov 11, 2026; impl-people §4, F30). People builds that projection, Accounting's AC-23, as an owner contract following design-accounting (impl-people P27).

**Generic payroll in the build (decided Nov 11, 2026; impl-people §4).** The build has no country localization, only the synthetic demonstration localization of §8.4, so no pay group is live in it. A real deployment needs a localized configuration and, in some cases, service changes as well.

### 8.1 Core model and calculation contract

The core is native Mantle business logic, not a BOSS-only schema or a replacement accounting engine. Frappe’s component → structure → dated assignment → run → payslip pattern is the primary reference. Keep Mantle’s employment, salary, RateAmount, BenefitType/EmploymentBenefit, TimePeriod, TaxAuthority, invoice and payment foundations where their semantics fit. A component is not a renamed PayrollAdjustment with all historical US fields exposed.

| Proposed record family (`mantle.humanres.payroll`) | Identity and purpose |
| --- | --- |
| PayrollComponent and dated component terms/account mappings | Stable component ID; dated earning, deduction, employer-contribution or statistical definition, amount/quantity/formula, dependencies, payslip visibility and accounting treatment. Currency and unit are explicit. Statistical values never enter gross/net or GL merely because they are visible. |
| PayrollStructure, dated PayrollStructureComponent | Reusable component composition, eligibility and pay basis; component dependencies determine calculation order. Published effective intervals cannot overlap. |
| PayrollAssignment | Employment, structure, pay group, effective interval and declared variable inputs. EmploymentSalary remains salary truth; RateAmount remains hourly/piece-rate truth. An assignment references these rather than maintaining another base-salary history. One applicable primary payroll assignment per employment and date across all groups; extra earning sources are components/inputs, not a second primary assignment. |
| PayrollGroup | Employer, currency, pay-frequency/TimePeriod configuration, schedule/workweek, time-source basis, rounding/proration policy, localization bindings and approval rule. A run is one employer and currency. Different currencies are separate runs; conversion occurs only at Accounting’s established boundary. |
| PayrollInput and PayrollInputSource | Identified, approved earning/deduction/reimbursement input or source entitlement: employment, date/period, component, quantity/unit or amount/currency, source record/line, dimensions and approval. A correction links to the original input/result. Unique source-consumption keys prevent ordinary inputs being paid twice. Salary/recurring entitlements also track consumed service intervals per employment/component across groups and runs; a frequency change splits at its effective date instead of regenerating overlapping salary. A sales commission for an employee is a PayrollInputSource type fed by Sales; a partner's commission goes to Accounting payable intake instead (review X16). |
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

As built (impl-people P26): a correction is a run of kind correction (`create#Correction`) recalculating the original slip's employment; its slip carries the change line by line and names the original (`correctsPayslipId`), which is never changed; the net effect is the original's net plus its standing corrections'. An off-cycle run pays the period's approved adjustments no run took on its own slip. Reversal with Accounting credits waits on P27's obligations. P26 review: once a correction (not cancelled) corrects a slip, the slip's run keeps its approval (calculating it with work to do or selecting it is refused, `RUN_CORRECTED`), so a later change is another correction; a correction of an off-cycle slip recalculates its adjustments alone. A negative correction (an overpayment) and a backdated separation are recovered in P27 (the user's call of Nov 12, 2026): a recovery deduction input on the employee's next regular run, capped per period by a setting, or a receivable from the person when they have left.

As built (impl-people P27; Mantle `PayrollObligations.js`): **Finalize** (`finalize#Run`, a payroll editor's) takes an approved run of a live group: the group's readiness allows live pay (a localization that is not the demonstration, covering today, and Accounting's payroll-origin projection in place, which P27 builds) and the group is enabled for it (`PayrollGroup.liveEnabled`, set by `store#Group` only where the readiness allows; refused otherwise, `LIVE_NOT_AVAILABLE`); a group that is not live is refused `NOT_LIVE` naming each reason, which for the demonstration group is `PREVIEW_ONLY` and `LIVE_NOT_ENABLED`. Under the run's no-key-update lock it checks the approval still holds (`APPROVAL_NO_LONGER_HOLDS`) and every amount's account (`ACCOUNT_MAPPING_MISSING`: an earning's term expense account, a deduction's liability account, the group's localization binding), then finalizes each employee in its own transaction under the employment's lock: the slip made final (`PssFinal`, not a preview), the inputs it took finalized, and its obligations, each keyed (`NET:<slip>`, `CLAIM:<invoice>`, `RECEIVABLE:<slip>`, `PAYEE:<run>:<payee>`) so a retry makes nothing twice: the net pay (the slip's net less what it reimburses) as a draft `InvoicePayroll` from the person (each earning on its expense account, each deduction and the localization's employee amount withheld on its liability account, as negative lines); each expense claim it reimburses linked as it is (§9); an overpayment recovered (below). One that fails stays pending with its reason while the others go on. Once every employee is final, the localization's employee and employer amounts of the final slips become one `InvoiceTax` from the group's localization payee (a payee only where configured, §8.3), then the run's payables are released to Accounting (received) and the run is Finalized; until then nothing is released, approved or paid (Accounting's guard, §8.3). Issuing statements stays PayslipDetail's own step (the review's call: Finalize issues them, below). **Settle** (`get#Settlement`): each obligation's invoice with its state, posting, unpaid amount and payments (a returned payment shown as Accounting has it); each person's wage net, the reimbursement still due on their claims and the payment instruction (their sum); the overpayments with what is recovered and what remains. **Recovery** (`PayrollRecovery`, keyed by the correction slip): a correction whose wage net is negative is, for a person who has left (their employment ended by now), a receivable through Accounting (an `InvoicePayroll` from the employer to the person, the slip's lines reversed on their own accounts); else the employer's recovery deduction (PartySetting `PayrollRecoveryComponent`; `RECOVERY_SETUP_MISSING` leaves that employee pending) on the next regular runs: `prepare#Inputs` makes a `PitOverpaymentRecovery` input a period of at most the employer's cap (PartySetting `PayrollRecoveryCap`, an amount; none, the whole rest), the rest carried on, never taken by an off-cycle run; what is recovered is its finalized inputs' sum, readable on the correction's slip. A correction of an employment that ended by the period's last day (a backdated separation) is no longer `NOT_IN_GROUP`: it pays nothing now, so it recovers what was paid. A correction counts the finalized inputs its original took as its own.

Review (impl-people P27 review, the user's calls of Nov 13, 2026): every step of **Finalize** commits in a transaction of its own (the service holds none): the checks and Finalizing under the run's lock, each employee, each payee bucket, then the release and Finalized together under the run's lock, then each final slip's statement issued (`issue#Payslip`: the stored PDF and the person's direct-only notice; one that fails is counted and stays final for PayslipDetail's Issue statement or Finalize again). A deduction's or employer contribution's term may name a payee (`PayrollComponentTerm.payeePartyId`, `store#Component`; `PAYEE_NOT_FOR_KIND` for an earning): the payee buckets are one invoice for each payee and liability account (key `PAYEE:<run>:<payee>:<liability>`), the withheld amounts on the liability account and the employer's on their expense account, the localization's an `InvoiceTax` and any other payee's an `InvoicePayroll`, so an employer contribution posts with the run's invoices; a contribution with no payee is `ACCOUNT_MAPPING_MISSING`. The recovery settings are People › Payroll › Overpayment recovery (`get#RecoverySettings`, `store#RecoverySettings`, PAYROLL_CONFIGURE at the revision read): the deduction and the cap, an amount (`PayrollRecoveryCap`), a percentage of net pay (`PayrollRecoveryCapPercent`: of the employee's wage net on their latest finalized regular run, the net known when a period's inputs are prepared), or both: the percentage of the last net applies, at most the amount; before the employee's first finalized regular pay the amount applies, or with no amount the recovery waits a period, never uncapped (impl-people P28 and its review, the user's calls of Nov 13, 2026). An employer contribution posts when Accounting approves its payee's invoice, as every finalization invoice does: People makes no ledger entry (the user's call of Nov 13, 2026, confirming the review's reading). A leaver's receivable posts to accounts receivable (InvoicePayroll's receivable mapping; an existing database gets it and `PtPayrollPayment`'s from `migrate#PayrollOrigin` on a seed load).

The design supports bounded database queries, progress counts, job cancellation between units, controlled concurrency and resumable processing. Approximately 10,000 workers describes the unavailable commercial deployment; it is not a performance result or required load-test fixture for this implementation.

### 8.3 Accounting and confidentiality

The handoff keeps `InvoicePayroll`, `InvoicePayrollOther`, `InvoiceTax` and `InvoiceGarnishment` where applicable. Employee invoices represent net payable, retaining explainable earning/deduction lines and source links. Third-party obligations are generated only for configured payees. Per-component mappings must reconcile gross expense, employee deductions, employer contribution expense, net payable and third-party liabilities: withheld sums use clearing/liability accounts so paying a tax invoice does not expense the same wages twice. Statistical components post nothing. Reimbursements and advances follow §9’s single-settlement rule. Carry known project, work effort, facility and cost-centre dimensions; no new percentage distribution engine is introduced.

Proposed `mantle.humanres.PayrollRunServices.finalize#Run` creates uniquely linked draft invoices through Mantle services; it does not directly create GL entries, auto-approve payables or execute bank transfers. Accounting’s `mantle.account.InvoiceServices.approve#Payable`, `change#InvoiceState`, and `mantle.account.PaymentRunServices` own approval/payment processing. Extend their source checks to require completed payroll finalization, current holds and appropriate payroll-finance access. Current supplier payment-run assumptions (supplier grouping, employer currency, supported instruments) must be explicitly validated/extended for employee and statutory payees; there is no claim that every country’s bank format already works.

Payroll-origin restriction propagates to Invoice/InvoiceItem, Payment/Application, AcctgTrans/Entry, content, print data, exports, search and notifications. General finance users may receive permitted aggregate expense/liability reports; per-person amounts, payee identifiers and source drill-down require payroll-finance authority. Masking a Payslip while exposing its Invoice or ledger entries is not sufficient. Authorized bank operators necessarily receive required employee payment details. Proposed service-level projections and artifact/filter coverage are prerequisites for payroll exposure, including generic entity access. No salary details go into general Chatter or payment notification emails.

Accounting owns this restriction (review Y7) as AC-23, the payroll-origin projection (design-accounting §18): it restricts payroll-origin invoices, payments and ledger lines on the built finance screens (BillDetail, ExpensePosting, PaymentRuns and PaymentRunDetail, the ledger and journal screens), in search and in exports, and lets general finance users see permitted aggregates only. People PE-11 uses it; payroll finalization and PayrollExchange's live external results both stay off until it lands (§8 Release 1). The design is Accounting's and the build is People's: AC-23 was in no Accounting phase, so impl-people P27 builds it as an owner contract following design-accounting (decided Nov 11, 2026; impl-people §4, F29).

**Existing automation register (also crosscut §1.3):** Accounting rules first, then the rules on People's task, request and sync paths (review R-PPL-01, R-PPL-14, Y1).

| Existing rule / source | Treatment on People paths |
| --- | --- |
| `InvoiceGlPost`, `PaymentGlPost`, `PaymentApplicationGlPost` in `AccountingLedger.secas.xml` | Kept. Approving/finalizing an invoice, delivering a payment and applying a payment trigger the owner’s posting path. Payroll does not post a second journal; posting error records remain visible in reconciliation. |
| `InvoiceAdjustGlPost`, `InvoiceAdjustUpdateGlPost`, `InvoiceCancelRevertGlPost`, `InvoiceResumeChangeRevertGlPost` in the same file | Kept for Accounting’s guarded operations. People refuses edits, resume and cancellation of finalized payroll source invoices; changes use linked correction obligations. No direct invoice-item edit to correct wages. |
| `InvoiceCheckNegativeTotalMarkPaid`, `InvoiceCheckFullyPaid`, `InvoiceApplyForPayments`, `InvoiceIssuedDueSchedule`, `InvoiceResumedDueSchedule` in `AccountingInvoice.secas.xml` | Kept within the native state flow. Manager expense approval must not set InvoiceApproved. Negative pay is blocked before obligation creation; credits follow Accounting’s credit flow. Respect existing matching/payment holds and due-schedule rules. |
| `PaymentCheckEffectiveDate`, `PaymentApplyForInvoice`, `PaymentCancelledCleanup`, `PaymentUnDeliverCleanup`, `RunPaymentReturned` in `AccountingPayment.secas.xml` | Kept under Accounting authority. Effective dates, settlement application, voiding and return status are not reimplemented in People. An unknown bank outcome stays unresolved until reconciled. |
| `PaymentRunBankChangeVoid`, `PaymentRunBankAddVoid`, `PaymentRunBankEndVoid` in `AccountingPayment.secas.xml` | Kept. Changed employee/other-payee bank details invalidate affected payment-run approvals through the same payment-method services. Payroll calculation approval is not bank authorization. |
| `PaymentDraftValidationNotice`, `PaymentEditValidationNotice` in `PaymentValidation.secas.xml` | Conditioned: retain payment validation but payroll-origin messages use restricted recipients and safe summaries, without salary/bank details in broad feeds. |
| `RequestTriageNotice` in entity/Request.eecas.xml (calls `queue#RequestTriage`, then `notify#RequestTriage`) | Conditioned: the HR-confidential request type is never in an organization's triaged types and never gets a `rootWorkEffortId`, and `notify#RequestTriage` skips it, so no grievance name or filer reaches a triage party or project manager. |
| `WorkEffortRequestFromWork` in entity/Work.eecas.xml (calls `complete#RequestFromWork`) | Conditioned: through crosscut's type-aware guard, a linked task's status never resolves an HR-confidential request; only its case handler decides it. |
| `SupportCaseRule`, `SupportCaseCustomerRule` and `SupportCaseSlaRule` in entity/Request.eecas.xml (Customer Service's, built after this design; they call `SupportCaseServices.queue#CaseProfile` and `SlaServices.record#CaseEvent`) | Conditioned (impl-people F20): an HR-confidential request never gets a case profile or a service-level clock, whatever the organization's service policy. |
| `WorkEffortPartyAssignedNotify` in service/WorkEffort.secas.xml (calls `notify#TaskAssigned`, topic WorkItemAssigned) | Kept for checklist and goal assignments: the notice carries the sanitized task name and the lifecycle root's name, never a separation reason or case subject. |
| `WorkEffortPartyDocsUsers` in entity/Work.eecas.xml | Kept: a lifecycle root has purpose `WepPrOrgMgmt` and no documentation space, so it adds no assignee to a project space. |
| `TimeEntryUpdateTask` in entity/Work.eecas.xml | Kept: time logged on a lifecycle task updates that task only. |
| `WorkEffortStartCompleteDates` and `WorkEffortRecurringTaskNext` in service/WorkEffort.secas.xml | Kept: they set a task's actual dates and make the next recurring task; goals and checklist tasks carry no recurrence, so the second never fires on them. |
| `WorkEffortPartyShellCounts`, `WorkEffortShellCounts` in entity/ShellCounts.eecas.xml | Kept: they publish counts to the assignee's own header, with no task names. |
| CalDAV Tasks collection and VTODO PUT (`mantle.work.CalendarDavServices.get#TaskObjectTags`, `put#DavObject`) | Replaced on its write path by the Mantle fix of review Y1: a phone's change to a task goes through `mantle.work.TaskServices.update#Task` and `set#TaskStatus`, so status follows the task's flow and the process guard. Offboarding, separation, grievance-linked and goal tasks are left out of the Tasks collection. Onboarding and training tasks stay, with their sanitized names. |

### 8.4 Localization, external processing and legacy disposition

A localization binding declares jurisdiction(s), effective coverage, required employer/employee setup, input/base types, calculation service, reporting calendar and supported outputs. Calculation receives declared pay facts and accumulator bases and returns itemized employee/employer amounts, bases, explanations and warnings/errors; it cannot write invoices, payments or arbitrary employee data. Rule sets use effective dates and controlled release metadata. Missing, expired or incomplete required coverage blocks live finalization. A synthetic non-statutory demonstration mode can preview examples but cannot produce payable obligations. No country’s laws or forms are implemented by this design, and the build stays generic: it ships that demonstration localization alone. A real deployment needs a localized configuration and, in some cases, service changes as well (§8; impl-people §4, Nov 11, 2026).

PayrollExchange permits an explicitly configured external-processing mode: export approved inputs with manifest/source identities, import signed-off provider results and reconcile employee amounts, currencies and totals through the same Payslip/PayrollObligation path. Do not also run native gross-to-net for that group/period. Live external results are refused until the payroll-origin projection (AC-23) is in place, as finalization is, since they create the same payroll invoices (§8 Release 1). Credentials and transport are Admin-owned; CSV is the first interchange, with named provider/bank connectors later. Statutory documents and e-filing are localization outputs, not automatic W-2/1099 promises.

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

As built (impl-people P28; Mantle `PayrollExchange.js`, People › Payroll › Payroll exchange). External processing is a pay group's setting (`PayrollGroup.externalProcessing`, PayGroups' Calculated: here or by an external processor; changed only while none of its runs is open, `RUN_OPEN`): such a group is never calculated here (`create#Run`, `select#Employments`, `calculate#Run` and `create#Correction` refuse it, `EXTERNAL_PROCESSING`) and needs no localization to be live: its readiness waits only on the payroll-origin projection and its live switch. Every exchange is a batch (`PayrollExchangeBatch`, its rows `PayrollExchangeRow`), previewed, reconciled at a revision against what its sender signed off, then executed, each row (or each employee's rows) in a transaction of its own; a file replayed (the same kind, scope and content) answers its batch. *Export* (PAYROLL_VIEW, PAYROLL_EDIT): a group's period's approved inputs, each with its source key (its entitlement), written through Admin's export target `payrollExchangeInputs` (so Admin's Exports lists it) and stored with its manifest (rows, employees, totals, the source keys and the file's SHA-256), both downloaded from the exchange. *History* (PEOPLE_IMPORT, PAYROLL_VIEW, PAYROLL_EDIT): worker, pay date, gross, net and an optional currency, before the cutover day; each row a historical pay record (`EmploymentPayHistory`, internal payroll N; Payslips' Historical pay records, read only and never recalculated), no invoice or obligation; a day on or after the start of the first period People paid the employment (a final or issued slip's period or pay day, P28's review) is refused (`PAID_HERE`), a record of the day with other amounts too (`CONFLICT`) and one with the same amounts is known, so history and People's own pay never count a period twice; amounts are plain numbers, commas only as thousands separators; an unknown worker is named (`WORKER_UNKNOWN`) and the rest applied. *Results* (the same permissions; with the employees, net and gross the processor signed off): worker, component and amount, for a group in external processing (`NOT_EXTERNAL` otherwise), each line a published component of the employer on the pay date; an employee with a refused line is refused whole (`EMPLOYEE_INCOMPLETE`), with a negative net (`NEGATIVE_NET`) or an invoice of the period already (`ALREADY_PAID`) too; executed only for a live group with the projection in place (`requireLive`, `requireProjection`: `NOT_LIVE`, `PROJECTION_PENDING`), as finalization is; it makes the period's pay run (`PayrollRun.exchangeBatchId`, the one live regular run of the group and period: `RUN_EXISTS` beside a run calculated here, `RUN_CLOSED` once approved) whose employments carry the provider's lines and totals and take the period's approved inputs of the employment; the run's approval binds the results as imported, and Ask for approval, Approve and Finalize then make the same slips, statements, obligations and Accounting handoff as native pay (§8.2, §8.3). Whoever imports into the run prepared it, so never approves it, and a request waiting when employees are added is superseded (P28's review). The export file is written as the framework writes delimited text (`DataTransferLib.writeDelimited`): a plain number as that number (a negative amount `-10`; impl-people P31 made the framework's writer leave a plain number unescaped, as the screen CSV writer does, in place of P28's own number columns), a formula as text.

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

**As built (impl-people P22; PayComponents).** `find#Components` answers a payroll reader (PAYROLL_VIEW) of the employers in scope: each component's code, name, kind, employer and the term in effect (else the next, else the draft) with its calculation, currency or unit, start and state; ended ones only when the state filter asks. A component is one employer's (there is no shared component, as there are shared pay grades); its code is a formula name (letters, digits and underscores, not a word the grammar keeps) unique in the employer. New component (PAYROLL_EDIT and PAYROLL_CONFIGURE, the review's call) takes the code, name, kind and employer and opens the component; its calculation is set there.

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

**As built (impl-people P22; PayComponentDetail).** The term opened (the draft, else the one in effect) as rows of facts: basis, the formula or amount, the declared inputs, the components it reads (every name the formula reads that is not a declared input is another component's code, a dependency), currency (required for money; a statistical value's currency or unit), the rounding stage (places and a direction, or none: precision kept), payslip visibility, the account mapping on the term (an earning's expense account, a deduction's liability account, a contribution's both, a statistical value's none; each one of the employer's), dates and who published it. The constrained formula editor is the Edit calculation form: the formula is checked on the server by the framework's evaluator (`org.moqui.impl.ExpressionServices`, PE-09), whose grammar the dialog states, and refused with its message and character position; no script runs. Examples are named rows of `name = value` inputs and an expected amount, computed by `preview#Component` beside it (passing, giving another amount, or refused, such as a missing input: nothing is assumed, not even a divisor); Try values computes typed values. Publish takes a date and a reason and asks for a People approval of kind `PakPayrollConfig` (the review's call of Nov 12, 2026: the employer's payroll approvers, or HR editors who read payroll, unless a rule routes it; never one who drafted the term or its examples, or asked; the Approval box shows the request, and its approver approves or refuses with a reason here or from the `PeoplePayrollConfigApproval` notice, which names the component and no amount; a change of the draft meanwhile supersedes the request); the term is published when approved, checked again, from its date (from the approval when that has passed and a term was in effect then). It is refused unless every example gives its amount, the components it reads are published then and without a cycle (on that date and on each later date the employer's published terms change before the term ends), the mapping its kind needs is set, and no published term starts on or after the date; the term in effect then ends on it, never in the past. A published term is not changed: Start a draft copies it from a later date. End component ends it once no structure uses it after that date. As built in P25's review (the user's call of Nov 12, 2026): a fixed amount's term says whether a pay run prorates it in a part period (Prorated in a part period, shown as "In a part period"; on by default for an earning, a deduction and an employer contribution, off for a statistical value; a formula prorates by reading `periodFraction`).

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

**As built (impl-people P22; PayStructures).** `find#Structures`, a payroll reader's: each structure's employer, currency, pay basis, the count of its components today, its dates and state (P23: and the count of its pay assignments in effect, Assigned; a structure, or a group, still used by an assignment from a date is not ended then, `STILL_ASSIGNED`). New structure needs the currency (never assumed) and a pay basis. Copy is on the structure (a new structure of the same employer with the source's current lines as drafts). No assignment count yet: assignments are P23's.

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

**As built (impl-people P22; PayStructureDetail).** Composition lists the lines in payslip order (a line's order, dates, the structure's values of the component's declared inputs as `name = value`, the term it calculates with, its state) with the calculation order its dependencies decide beside it and the findings that block one (a dependency the structure lacks, a cycle, no terms). A line's eligibility (as built in P23): every assignment of the structure, or only an assignment that elects it (`PleElected`, such as a voluntary pension), set on a draft line (Add component, Edit) and shown in Composition. Add component makes a draft line (one draft line of a component at a time); a draft line is changed or removed, a published one only ended. Preview gross to net (`preview#Structure`) computes the lines on a date with their draft lines and the components' draft terms, so a structure is seen before it is published: each component in dependency order, rounded by its own stage, with its explanation or what blocks it; totals (gross, deductions, the localization's employee items, net, net payable rounded to the currency, employer contributions, the localization's employer items, employer cost; a statistical value enters none); a pay group gives its periods a year as the input `periodsPerYear` and its localization; nothing is written. Publish takes a date and a reason and asks for a People approval of kind `PakPayrollConfig`, as a component's (its approver approves or refuses on the structure; a changed structure or line supersedes it); it is refused, and checked again on approval, for a line whose component has no published term then, a money component in another currency, two lines of one component at once, a missing dependency or a cycle, on its date and on each later date a line or a term of its components changes; the first publish starts the structure, and no employee is reassigned.

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

**As built (impl-people P23; PayAssignments).** `People/Payroll/PayAssignments` (menu 3 under Payroll, payroll's area). Assignments (`find#Assignments`, a payroll reader's): the employments current on a date at the employers in scope, found by name and filtered by employer and readiness, each with its primary assignment in effect (or the next), structure, group, dates, salary and pay rate references and its readiness, never anything but payroll's (`NO_ASSIGNMENT`, `STRUCTURE_NOT_IN_EFFECT`, `GROUP_ENDED`, `SALARY_MISSING` for a salaried or mixed structure, `RATE_MISSING` for an hourly or mixed one, `CURRENCY_MISMATCH`, `PROFILE_MISSING` and `PROFILE_INCOMPLETE` for the group's localization's required fields, else ready for a preview run; the group's own readiness, preview only, stays on PayGroups). AssignPay (the one primary, a payroll editor's: `assign#PayStructure`): employees of one employer, a published structure in effect on the date and a group of that employer in the same currency, from a date (through one), primary or secondary, the employment's own values of inputs the structure's components declare (no name that is a component code), the elective lines it takes, replacing the assignment in effect with a reason; previewed first (who would be assigned, who not and why), each employee then on their own, a refusal named and the rest going on; one primary per employment and date (`PRIMARY_OVERLAP`); no salary or rate changes. An employment opened shows its assignments, each ended from a date (never in the past), and TaxAndBenefits (`store#PayrollProfile`): the tax profile of its group's localization from a date, the fields that localization declares alone (`PayrollLocalizationField`: the demonstration's synthetic levy region, required, and exemption; a field it does not declare is refused), the benefits (Mantle's `EmploymentBenefit`: a type from a date, its cost and the employer's share; added and ended), and the bank accounts as masked references with the note that they change through Accounting's payment-method services. Employment's and Employee's historical US tax fields are neither read nor written (impl-people F33).



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

**As built (impl-people P22; PayGroups).** Groups list each group's employer, currency, frequency, pay date, localization and readiness, which is preview only in this build with its reason (`NO_LOCALIZATION`; `PREVIEW_ONLY` for the demonstration localization; `COVERAGE_MISSING` and `PROJECTION_PENDING` for a registered one, of which there is none): the readiness is on the group (`find#Groups`), not in People's setup readiness provider. GroupTerms: the currency, the frequency (a Payroll month, semi-month, bi-week or week) and the first period's start, the periods a year (the annual divisor), the pay date (days after a period's last day), the proration (calendar days, working days or hours), where hours come from (timesheets, attendance or the working schedule), an optional workweek time zone and the localization binding; each required but the last two, each change audited with its reason, and the currency, frequency and first period fixed once periods exist; live finalization is refused (`LIVE_NOT_AVAILABLE`). The approval rule is the runs' (P25). Periods: `prepare#Periods` makes the next periods once (Mantle's `TimePeriod` of the employer and frequency, shared with its other groups of that frequency, and the group's pay date); Preview the next periods computes them without writing; a period's processing state is Open until runs exist. The registered localizations are seed data (`PayrollLocalization`, the demonstration alone), never named in a form.

As built (impl-people P28; PayGroups): Calculated, here or by an external processor (`externalProcessing`, in New pay group and Edit policy, audited; changed only while none of the group's runs is open): an external group's runs are its processor's imported results (PayrollExchange), its readiness needs no localization (live once enabled and the payroll-origin projection is in place), and the group's facts say how it is calculated.

**Needs:** PE-08; PE-10; PE-12.

### PayRuns

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Runs | list | Track calculation and settlement separately | group, period, pay date, kind, worker count, gross/net, errors, state | status chips; paginated totals | proposed `mantle.humanres.PayrollRunServices.find#Runs` | Frappe Payroll Entry |
| NewRun | dialog | Create a run without posting | group, period, pay date, kind, selected scope, correction reference | period lookup | proposed `mantle.humanres.PayrollRunServices.create#Run` | Frappe Payroll Entry |

**Actions and states:** Create opens PayRunDetail. A second regular run covering already-consumed inputs is refused; off-cycle/correction kinds need distinct entitlements or original-result references.

**As built (impl-people P25; PayRuns).** `People/Payroll/PayRuns` (menu 1, the Payroll area's default). Runs (`find#Runs`, a payroll reader's): each run of the employers in scope with its group, period, pay date, kind, employees, errors, the gross and net of its calculated employees and its state chip (Returned, Approval no longer holds), filtered by group and state or Needs attention. NewRun (the one primary, a payroll editor's; `create#Run`): a group and one of its prepared periods, the pay date (the period's when empty), a source cutoff and a note; a regular run alone (P26: or an off-cycle run, below; a correction is made from its payslip, `KIND_NOT_AVAILABLE` here); refused when a live run took the period's inputs (`INPUTS_CONSUMED`) or the period has a live regular run (`RUN_EXISTS`, one live regular run a group and period); its population selected at once; it opens PayRunDetail. People's Today gives the payroll operator (PAYROLL_VIEW with PAYROLL_EDIT) alone each run that needs work, naming the group, the period and what is wrong, never a person or an amount. As built (impl-people P26): NewRun's Kind, Regular or Off-cycle: an off-cycle run (any number a period, on any pay date) pays the period's approved adjustments no run took (its population the employments that have them; `NOTHING_TO_PAY` when none), each to its component's line, with no salary or structure line, rounded, localized and approved as any run; its slip keeps its own identity beside the regular slip of the same day. Inputs a live run of another kind took are that run's: a regular run neither pays them nor is blocked by them (`INPUTS_CONSUMED` is a live regular run's alone).


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

**As built (impl-people P25; PayRunDetail's first four steps).** A detail with its steps (style-guide §3.10's alternative to the stepper: the steps' actions are calculations and decisions, not forms to fill), the step in the URL (`step`), each step link marked done, and the progress cards (employees, calculated, to calculate, in error, excluded, percent). Records: `PayrollRun` (one live regular run a group and period, `activeRunKey`; Draft, Calculating, Review, Approved, then P27's Finalizing and Finalized; who prepared it), `PayrollRunEmployment` (each employment a unit: pending, calculated, error with its reason code and message, excluded with its reason; its totals, its split and the fingerprint of the sources and rules it came from) and `PayrollRunResult` (a draft line: a component's amount or a localization's item, with its explanation); an input a calculation takes carries the run (`PayrollInput.payrollRunId`). Population (`select#Employments`): the employees the group pays in the period, brought in step with the group, excluded with a reason (kept in the run and the approval, out of its totals) or included again, and the pay date. Inputs: the period's hours for pay in counts (`get#Reconciliation`), Prepare inputs (`prepare#Inputs`), Hours for pay and Pay adjustments linked. Calculate and review (`calculate#Run`, `get#Run`): each pending, failed or changed employee in its own transaction under the employment's lock, at most 100 a call and a minute (the rest stay pending; calling again resumes), one that fails left in error while the others go on, one calculated and unchanged never calculated again; each employee's gross, deductions, net, employer cost, the change from the group's previous run and the reason; an employee opened shows its lines with their explanations, how its period was split and the inputs it took. The calculation (§8.1's sequence, Mantle `PayrollRuns.js`): the employee's days in the group split where the primary assignment, the salary or the pay rates change; each part prorated by the group's policy (calendar days, or the schedule's working days or hours; a part period with no schedule or no policy blocks, `NO_SCHEDULE`, `PRORATION_REQUIRED`); each part's published structure lines computed in dependency order over the named inputs `periodsPerYear`, `periodFraction`, `annualSalary` (the salary made annual by its frequency, a week-based one only in a group of that frequency, and multiplied by the part's share), `fullAnnualSalary`, `hourlyRate`, `pieceRate` and the part's approved `workedHours`, `paidLeaveHours`, `unpaidLeaveHours`, `pieces` and `reimbursement` (these win over an assignment's own values and a line's parameters); a component reading a part's input summed over the parts, another taken once; approved adjustments and advance recoveries added to their component; each money line rounded to the currency once, after its parts and adjustments, so the totals are sums of rounded lines (a statistical value keeps its unit and enters none); the localization once over the period's lines; a negative net blocks (`NEGATIVE_NET`); missing setup blocks with its code (`SALARY_MISSING`, `RATE_MISSING`, `NO_ASSIGNMENT`, `MISSING_INPUT`, `CURRENCY_MISMATCH`, `CYCLIC_DEPENDENCY`). Approval (`submit#Run`, `approve#Run`, `return#Run`): the totals by type, the counts, the exclusions with their reasons and the warnings; Ask for approval (a payroll editor's, once nothing is pending, in error or changed) asks a People approval of kind `PakPayrollRun` at the run's revision (its pay date, each employee's state, exclusion, totals and source fingerprint against the sources now); with no rule the employer's payroll approvers decide, never one who selected or calculated it or asked; Approve confirms the count and net, Return needs a reason and shows it on the run. A changed input, salary, rate, assignment, rule or profile makes another revision: a waiting request is superseded and an approval no longer holds (the run shows it and the employee as changed; calculating again recalculates only them). No invoice or payment is made; Finalize and Settlement are P27's. As built in P25's review: a period splits where a structure line or a component term changes as well as the assignment, salary or rates; a fixed amount is prorated by the part's share in a part period when its term says so (the user's call of Nov 12, 2026; PayComponentDetail below), and one paid whole is taken once; an hour or a piece on a day the group does not pay the employee blocks (`INPUT_OUTSIDE_DAYS`) and a reimbursement is paid with the period's last part whatever its day; the revision also covers the employee's days in the group (an employment's end), and a part period's scheduled hours when the group prorates by the schedule; a group paying more than 10,000 employees in the period is refused (`POPULATION_TOO_LARGE`), never paid in part; the revision is read for the whole run in a few queries (about 0.1 s for 500 employees). Cancel run (`cancel#Run`, a payroll editor's, with a reason): a run not approved (draft, calculating or in review; an approved one is selected or calculated again first) is kept as cancelled, its inputs released, its request superseded and the period free for a new run.

As built (impl-people P27; PayRunDetail's Finalize and Settlement). Two more steps: 5 Finalize (the group's live reasons when it is not live, each in words with its code; Finalize, the one primary of the step, a payroll editor's, confirming the count; a pending finalization's reason and Finalize again; Finalized and its day, linking Settlement) and 6 Settlement (`get#Settlement`: Payment instructions, each person's wage net, reimbursement due and what to pay now; Obligations, each invoice linked to Payroll's InvoiceDetail with its kind, payee, amount, state, posting, unpaid and payments; Overpayments to recover with what is recovered and left; amounts opted out of AI). A finalizing run opens on Finalize, a finalized one on Settlement. PayslipDetail adds a Settlement box: the slip's obligations with their invoices and an overpayment it recovers, with what is left. PayGroups' Edit policy adds the localization binding (its payee, an organization; its liability and expense accounts) and Live pay, which `store#Group` takes only where the group's readiness allows it (§8.4); the group's facts show both.


**Source:** research §9; Frappe payroll_entry source

**Needs:** PE-09; PE-10; PE-11; PE-12; PE-15.

### Payslips

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Slips | list | Browse authorized pay results | worker, employer, period, pay date, run kind, gross/net, issued/correction state | source-kind filter; no private shell amounts | proposed `mantle.humanres.PayrollResultServices.find#Payslips` | Frappe PWA salary-slip dashboard |

**Actions and states:** Self sees only own issued statements, not every draft calculation. Historical rows retain legacy identifiers and a historical-source label; opening one never regenerates its tax calculation.

**As built (impl-people P26; Payslips).** `People/Payroll/Payslips` (menu 2, payroll's). Slips (`PayrollResultServices.find#Payslips`, a payroll reader's of the employers in scope): each slip with its person (the link to PayslipDetail), period, pay date, kind (a correction names the slip it corrects), gross and net (opted out of AI), the state chip (Preview, Final, Issued; Withdrawn when asked), its count of corrections, group and employer; filtered by group, period, state, kind, or Corrections and Historical pay records (the legacy `EmploymentPayHistory` rows, labelled historical, opened by their own key `partyRelationshipId|payDate`, never recalculated); a run's slips from PayRunDetail's header. Phone columns: the person and pay date, the state and net. A slip is made when its run is approved: one a run's employment (`Payslip`, its own identity), so a regular, an off-cycle and a correction slip of one day are three. In this build every group is in preview mode, so slips are previews, payroll's alone, never issued and never an obligation (§5 Q3); a run whose approval is taken back (selected or calculated again) withdraws its preview slips, and approving it again makes them again in place. The person's own issued slips are not this list but SelfService's (§3).

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

**As built (impl-people P26; PayslipDetail).** `People/Payroll/PayslipDetail` (out of the menu) over `PayrollResultServices.get#Payslip`, a payroll reader's of the slip's employer; anyone else "Not available". The record header: the person, period, pay date, kind, employer and currency; the state chip (Preview: payroll's alone, never issued as pay; "changed since its run was approved" when its sources changed; Final; Issued); links to its pay run, the original slip (a correction) and a correction in progress. PayBreakdown (an AI opt-out section): the lines by group (earnings; deductions with the localization's employee items; employer costs; other values), each its amount, its rule (the component term's dates) and how it was worked out (the run's explanation: each part's formula and values, the proration, adjustments, the rounding); a line whose term keeps it off the payslip (`payslipVisible` N) marked "not on the employee's payslip", in the totals; on a correction the change with what was paid before and now; the totals and how the period was split. Year to date: derived on read from the person's final and issued slips of the employer in the slip's year (the employer's fiscal year holding the pay date, else the calendar year) up to its pay date, by line, this slip added (a preview counts for no other slip); nothing is stored. Original and corrections: the chain with each slip's kind, pay date, state, net and what changed, and the net effect of those standing. Inputs paid: the inputs its run took for the employment, each with its sources (a time entry, a leave request, a claim, an advance). StatementOutput: Issue statement (the primary, a payroll editor's, for a final slip alone; a preview is refused, `PREVIEW_ONLY`): `issue#Payslip` renders the statement once as the person reads it (their lines, totals, year to date, a correction's original and reason), stores it (its PDF, or its html-print page where the server has no PDF engine) and tells the person on `PayslipIssued` (direct only, their own accounts; a title naming the employer and the period, never an amount; its link needs a sign-in; nothing is attached); Download statement serves the stored file, never rendered again. CorrectPay: Correct pay (a payroll editor's; the primary unless the slip can be issued) asks what changed (the source or rule), a pay date (the original's when empty) and a note; `PayrollRunServices.create#Correction` makes a run of its own of kind correction for the slip's group, period and employment (one open at a time a slip, `CORRECTION_EXISTS`; a withdrawn original refused, `SLIP_WITHDRAWN`) and opens it in PayRunDetail, where it is calculated (the employment as it is now, with the inputs the original and its corrections took and those approved since, less what they paid: `NO_CHANGE` when nothing changed; a line no longer paid recovered whole; a negative change is to recover), asked and approved as any run; its slip links to the original, which stays as it was. A legacy pay record (`legacyKey`) shows as it was recorded, with the year-to-date figures it stored. Files: the slip's content host (`PayslipContent`, `check#PayslipAccess`), payroll's alone and never shown to the employee; no notes, which would reach the person once issued. The person's own issued slip is `MyPayslip` (§3), the same lines without the lines kept off the payslip and without payroll's actions, with "Explain this payslip".



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

**As built (impl-people P24).** `People/Payroll/PayAdjustments` (menu 4 of Payroll, payroll's area). Adjustments (`find#Adjustments`, a payroll reader's: show To decide, employer, state, name): each adjustment input with its employee, kind and component, date, recurrence place, amount (or quantity for a resolved day), source (an advance, the input it corrects, the evidence), reason, state chip and approval, phone columns. Adjustment (New adjustment, the one primary, a payroll editor's; `store#Adjustment`): employer, employee, an earning or a deduction of the employer with a published term on the date in the pay group's currency, or the recovery of an approved advance through a deduction (never past what the advance has outstanding less the recoveries made), date (its prepared period of the employment's primary group), amount, an optional recurrence end (one dated input in each prepared period through it, at most 24, sharing a series), reason and evidence; each waits for a People approval of kind `PakPayAdjustment`. A row's More: Edit (a waiting one: amount or quantity, reason, evidence; asked for again), Withdraw (a live one, with a reason: voided, its request superseded) and Correct (a finalized one: a new input of the difference linked to it). ApproveAdjustment: a row's Approve and Refuse (a reason) and Approve selected on To decide (`decide#Adjustment`; the last approval approves every input of the series, a refusal refuses them and frees their entitlement). Amounts only to a payroll reader. Garnishments and mandated deductions are not built (they wait on a localization).



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

**Actions and states:** Historical import creates no payable obligations. External live results pass the same approval/finalization checks as native results, with native calculation disabled for their scope, and are refused until Accounting's payroll-origin projection (AC-23) is in place (§8 Release 1). File replay is idempotent; unrecognized workers or unsupported bases remain errors.

**As built (impl-people P28; PayrollExchange).** `People/Payroll/PayrollExchange` (menu 10, after Overpayment recovery, payroll's area) over Mantle's `PayrollExchangeServices` (§8.4's as-built paragraph). Exchange: Export inputs, Import history or Import results, each with its scope (a pay group and its prepared period; an employer and the cutover day; a group in external processing and its period), the source system, the file (or pasted rows), how workers are named (People id or work email), the separator and what was signed off (the count, gross and net: required for results); Preview resolves every row and opens the exchange; Recent exchanges below. Reconcile (the one primary while previewed, a dialog that may give the signed-off totals again): the rows checked again, the differences from what was signed off, a results group's live reasons, the totals and each employee's (history by year). Commit: Export, Record or Import, confirming the count, once reconciled with no difference and a ready row; then what it made: the stored file and manifest (Download file, Download manifest), the historical records, or the pay run (linked to PayRunDetail, which says the run carries an external processor's results). Rows: every row or the problems, with its outcome and why, and CSV. Amounts opted out of AI. Admin's Imports lists the history and results imports (target `payrollExchange`, owner route `peoplePayrollExchange`) and Admin's Exports the exports (target `payrollExchangeInputs`). The payroll operator holds `PEOPLE_IMPORT` for it (BossSetupData, the bundle).



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

Advances here are employee expenses or payroll-related obligations. Customer retainers and prepaid
service hours belong to the later [Sales contract](design-sales.md#contractschedules), Projects usage
and Accounting billing/settlement integration; they do not create employee advances or payroll inputs.

An expense claim remains an employee-from Invoice with ItemExpense-family items, not a parallel claim ledger. Add an ExpenseClaim extension keyed by invoiceId for employment, business-approval state, approver rule, reimbursement route and source reservations; InvoiceContent holds receipts with claim-specific access. `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` already accepts a `toPartyId` with no `workEffortId`, so a claim needs no project. Its extension is employer authorization (the claimant's active employment with that employer), self scope (a claimant creates only their own claim unless HR expense authority acts for them) and writing the ExpenseClaim record; its project behavior is unchanged. A claim can retain work-effort links for rebilling; do not turn employee payroll into customer billing.

A receipt can arrive by mail: the `EmailRuleAction` `createExpenseLine` (PE-24) on the expenses plus-tag address calls proposed `mantle.humanres.ExpenseServices.create#ClaimLineFromEmail`, which adds a line to the sender's open draft claim (or a new draft) with the attachment as its receipt. A photo from chat does the same through the "Add to my claim" `create-from`. Amount, date, merchant and tax are proposed from the receipt by `org.moqui.agent.AiTaskServices.run#Extract`, with the receipt text wrapped as untrusted; the claimant reviews the proposed values before the line is saved (review L9).

Draft uses InvoiceIncoming and submission InvoiceReceived. Business approval is a separate ExpenseClaim decision and leaves the invoice received. Finance then checks receipt/tax/coding and calls `approve#Payable`; only that financial step reaches InvoiceApproved and its posting automation. A returned claim can be corrected only before financial approval/consumption; later changes use the Accounting credit/correction path. Self-service claim services enforce ownership and do not require or grant broad PAYABLE_EDIT.

An approved claim has exactly one settlement route: ordinary AP or a specified payroll run. Both use the original claim invoice; the payroll route reserves it against ordinary payment-run selection and includes a reimbursement settlement line in the payslip. It must **not** copy the expense into a second payroll invoice. A combined employee payment applies separately to the payroll invoice and original claim invoice. PayrollObligation links an existing claim invoice for this purpose; it does not create another obligation. Payroll result displays distinguish wage net, linked reimbursement due and total payment instruction. A cancelled draft payroll releases the reservation; a finalized or paid claim cannot change route without the owner’s reversal/reallocation process.

For example, 1,000 wage net plus a 100 approved claim produces 1,100 to deliver, applied 1,000 to the payroll invoice and 100 to the claim invoice. If a 40 advance has already been applied to the claim, only 60 remains for reimbursement and delivery is 1,060. Those are illustrative amounts in one configured currency, not legal rules. Do not expense the claim again through a payroll component or deduct the advance twice.

As built (impl-people P27): a claim reserved for payroll (`reserve#ClaimSettlement`) is prepared as a reimbursement input of the claim's total and paid by a component reading `reimbursement` (its line, and only such a line, is the reimbursement: `REIMBURSEMENT_MISMATCH` otherwise; a localization levies no reimbursement); finalization links the claim's own invoice (`PokClaim`) and leaves the reimbursement out of the net pay invoice, so no second expense is made. Finance then approves the claim (no longer `CLAIM_RESERVED` once a finalized run settles it), may apply an advance to it, approves the net pay, and a payment run pays the person both with one payroll payment applied to each: 1,000 wage net and a 100 claim with 40 of an advance applied deliver 1,060 (Mantle PayObligations). An advance's recovery deduction, once finalized, counts toward the advance (its outstanding is delivered less applied credits less finalized recoveries), on the deduction component's account.

Employee advances use an approved advance request linked to native Payment and application/recovery records. Approval to advance is distinct from payment authorization; outstanding derives from delivered amounts less actual applications/returns, not a manually editable balance. Payroll deductions for recovery require an explicit approved recovery input and applicable localization support; deduction and payment application reconcile to the same advance source. Ending employment exposes outstanding advances for final settlement rather than automatically deducting them.

### ExpenseClaims

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Claims | list | Find authorized claims | employee, employer, project, dates, currency, total, business/finance states, route | mobile amount/status columns | proposed `mantle.humanres.ExpenseServices.find#Claims` | MyAccount/Expense/FindExpenseInvoice InvoiceList |
| NewClaim | dialog | Create an employee claim | employer, optional project, incurred date, currency, description | employer/project choices | extended `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` | MyAccount/Expense/FindExpenseInvoice CreateInvoice |

**Actions and states:** Create opens ExpenseClaimDetail. Self is fixed to the actor’s party; acting for another worker requires HR expense authority and records the actor. Draft, business-approved, finance-approved and paid are distinct labels.

**Devices:** phone; receipt-first entry, by photo, mail or chat. Accounting does not mount the claim screens: its ExpensePosting queue reads claims whose proposed ExpenseClaim business state is approved and does its finance actions through its own services (an Accounting change).

**As built (impl-people P15):** `People/Expenses/ExpenseClaims` over `ExpenseServices.find#Claims` (Mine, To decide, All I see; by state; each with its stage: draft, waiting for approval, returned for correction, approved: with finance, finance approved, paid, refused, cancelled) and New claim, the primary (and the quick create New claim): the claimant's own (the employer when they have several, a project they work on, the day, the purpose), or an HR editor's for an employee, made by `create#ProjectExpenseInvoice` with `expenseClaim`. Accounting's Expense posting lists a claim once its business approval is done, on the accounts payable route (design-accounting §5).

**Source:** research §10, §17

**Needs:** PE-01; PE-13; PE-15.

### ExpenseClaimDetail

**Layout:** detail.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ClaimHeader | single | Maintain draft claim context | employer, project, currency, dates, purpose, route | authorized choices | proposed `mantle.humanres.ExpenseServices.store#Claim` | MyAccount/Expense/EditExpenseInvoice EditInvoice |
| ClaimItems | list, editable rows | Record receipt-supported expenses | date, expense type, description, quantity, amount/tax, currency, project, receipt | private receipt upload; "Read receipt" proposes values for review; decimals | proposed `mantle.humanres.ExpenseServices.store#ClaimItem`; `org.moqui.agent.AiTaskServices.run#Extract` for the proposal | MyAccount/Expense/EditExpenseInvoiceItems CreateInvoiceItem and EditInvoiceItems |
| SubmitOrDecide | dialog | Submit or decide business justification | claim, action, reason, approval rule, route | confirm; receipt completeness | proposed `mantle.humanres.ExpenseServices.submit#Claim`; proposed `mantle.humanres.ExpenseServices.decide#Claim` | Odoo expenses; Frappe Expense Claim |
| FinanceAndSettlement | display | Explain posting and reimbursement | invoice, coding issues, finance state, advance applications, payroll reservation, paid/outstanding | authorized InvoiceDetail link | proposed `mantle.humanres.ExpenseServices.get#Claim` | Accounting ExpensePosting |

**Actions and states:** Submit locks claimant edits. Business approver can return/refuse/approve, not post. Finance opens Accounting ExpensePosting/BillDetail for coding and payable approval. Selecting payroll reserves the original invoice; no repeated expense item is created on the payroll invoice.

**As built (impl-people P15):** `People/Expenses/ExpenseClaimDetail` over `ExpenseServices.get#Claim` (the claimant, their manager at the employer, HR and payroll readers of the employer, the approvers; anyone else "Not available"): the record header and stage; ClaimHeader (purpose, project, day) and ClaimItems (Add expense with a receipt file: a photo, PDF or text file of at most 10 MB; Edit, Remove; a line from mail or chat marked to review; `store#Claim`, `store#ClaimItem`) while it is a draft or returned for correction, by the claimant or an HR editor; Read receipt (`read#Receipt` over `run#Extract`: the receipt file's text when it is a PDF or text file, else the text typed; the proposal is put in the line's form, never saved by itself); Submit (`submit#Claim`: lines, none to review, each with an amount; lines without a receipt counted) and for an approver Approve (the primary), Return for correction and Refuse with a reason, Withdraw and Cancel claim (`decide#Claim`); FinanceAndSettlement (the invoice's state for finance, the route, total, applied and unpaid, the payments applied: an advance or a reimbursement, the claimant's advances outstanding, and for a payroll reader the claim's invoice under People's Payroll); Print, Download PDF (`ExpenseClaimPrint`) and Evidence bundle (the PDF and the receipts in a zip). The payroll route is P27's: in this build a claim's route is accounts payable.



**Source:** research §10; design-accounting §5

**Needs:** PE-01; PE-11; PE-13; PE-15; PE-24.

### EmployeeAdvances

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Advances | list | Show requested and outstanding advances | employee, purpose, currency, requested, delivered, applied, outstanding, state | payment/claim links | proposed `mantle.humanres.ExpenseServices.find#Advances` | Frappe Employee Advance |
| RequestAdvance | dialog | Request funds for expenses | employment, employer, purpose, currency, amount, required date, expected settlement | money/date inputs | proposed `mantle.humanres.ExpenseServices.request#Advance` | Frappe Employee Advance |
| AdvanceDecision | dialog | Approve business purpose or propose recovery | advance, action, reason, claim allocation/recovery reference | reconcile preview | proposed `mantle.humanres.ExpenseServices.decide#Advance` | Frappe advance allocation |

**Actions and states:** Approved advances hand off to Accounting’s Payment services. People reads payment/application outcomes; undelivered or returned payments do not count as delivered cash. Recovery needs approval and cannot exceed outstanding.

**As built (impl-people P15):** Advances (`People/Expenses/EmployeeAdvances`) lists the advances the user reads (`ExpenseServices.find#Advances`: their own, those they decide now, a manager's reports' and an HR or payroll reader's employers'), each with what was asked, delivered, applied and outstanding and its stage (waiting, approved: to pay, paid: outstanding, settled, refused, withdrawn); Request advance (`request#Advance`: the employee's own employment, or HR's for an employee; purpose, amount, currency defaulting to the employer's, needed by, settled by) waits for a People approval of kind `PakAdvance` (`PeopleAdvanceApproval`, decided in the row or from Approvals, `decide#Advance`). Finance pays an approved advance (`pay#Advance`: a `PtPrePayment` from the employer to the employee, delivered) and applies it to the employee's claim approved for payment (`apply#Advance`, through `apply#InvoicePayment`), both in Accounting's Expense posting (its Employee advances tab, PAYMENT_EDIT). Delivered is the payment's amount once delivered or confirmed; outstanding is delivered less its applications to invoices and returns. Recovery by payroll deduction is not built (it waits on P24 and a localization).

**As changed in P15's review (the user's calls, impl-people §4, Nov 12, 2026):** an approved advance is a payable: its last approval makes a bill from the employee to the employer (one `ItemAdvancePay` line on the employee advances account, due when the advance is needed, received), which finance approves for payment in Accounting's Expense posting and a payment run pays like any other bill (no `pay#Advance`); delivered is what delivered payments paid of the bill, and `apply#Advance` applies the paid advance to a claim approved for payment as a credit the employer issues against the claim on that account (`EmployeeAdvanceApplication`), so outstanding is delivered less those credits. A payment run leaves out a claim reserved for payroll. Expenses have their own permission, `PEOPLE_EXPENSE_MANAGE` (BOSS: HR and Accounting's payables group): it reads every claim and advance of the user's employers and acts for an employee, in place of PEOPLE_HR_VIEW with PEOPLE_HR_EDIT and PAYROLL_VIEW; the claimant's own and the approvers' route are unchanged, and Payroll's InvoiceDetail shows a claim to a holder of it. An expense approval notice's title names no amount; its detail (the notification lists' approval summary) shows the claim's total to the approver.

**Source:** research §10

**Needs:** PE-11; PE-13; PE-15.

### TravelRequests

**Layout:** list; `later`.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Trips | list | Find own or assigned travel requests | traveller, purpose, destination, dates, estimated cost, state, linked advance | record links | proposed `mantle.humanres.ExpenseServices.find#TravelRequests` | Frappe `travel_request` |
| RequestTravel | dialog | Ask approval for a trip | employment, purpose, itinerary lines, dates, estimated cost, advance needed | date-period; money | proposed `mantle.humanres.ExpenseServices.request#Travel` (a Request of a proposed travel type) | Frappe Travel Request |

**Actions and states:** Approval routes as an expense; an approved trip can open RequestAdvance prefilled and links the trip's later claim.

**Source:** review R-PPL-F09

**Needs:** PE-13; PE-15.

## 10. Skills and training

Keep PartySkill and EmplPositionClassSkill for declared/evaluated proficiency, extended because today they hold too little (PE-14). PartySkill is keyed by party and skill with only rating, level and experience fields; a proposed `PartySkillEvaluation` fact records each evaluation's source (self-declared or evaluated), level, date, assessor and evidence content, and PartySkill keeps the current accepted level. `EmplPositionClassSkill` (class and skill only) gains proposed `minimumLevel`, `requiredFlag`, `fromDate` and `thruDate`. `WorkEffortSkillStandard` gains proposed `minimumSkillLevel`, shared with Maintenance MT-03 step requirements. Refine and activate qualification/training concepts in Mantle with stable certificate and training-enrollment identities, verified-by/date, validity and evidence. Identity documents and work permits are qualification types with a required expiry and verification, so staffing and Today see expiry without the document number. A claimed skill is not proof of a valid qualification. Proposed `mantle.humanres.DevelopmentServices.check#Qualifications` returns qualified/expiring/missing/expired at the planned work date and job requirements, with permitted explanations; Maintenance consumes it, and Projects StaffAllocation and Manufacturing may adopt it, without private certificates or review comments (review Y8). Training-due reminders use `mantle.work.EventServices.store#WorkEffortReminders`; qualification-expiry reminders are their own topic, `QualificationExpiring` (as built, impl-people P18: a qualification is no work effort). A training completion can grant a qualification only through an authorized assessment decision and once per enrollment. Full course authoring, SCORM/content delivery and external learner portals are later integrations.

### SkillsMatrix

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Matrix | component | Find skill coverage and gaps | team/person, job class, skill, required/actual level, qualification state | matrix; TUI person-skill list | proposed `mantle.humanres.DevelopmentServices.get#SkillsMatrix` | Dolibarr compare; Frappe skill map |
| FindAvailable | dialog | Find who has a skill and is free | skill (`skillTypeEnumId`), date range, hours per week, role; ranked results with free hours and skill rating | skill lookup; date-period | `mantle.work.ResourceServices.find#StaffingCandidates` | Projects staffing; Frappe skill map |
| EvaluateSkill | dialog | Record a supported skill evaluation | person, skill, level, evaluation date, assessor, evidence | level choices | proposed `mantle.humanres.DevelopmentServices.store#Skill` | Frappe Employee Skill Map |

**Actions and states:** Filter before loading; large populations page by person. A self-declared skill is labelled as such and cannot satisfy a verified-certificate requirement. FindAvailable ranks people by skill and free hours; its `costRate` column follows Y2 and shows only to PAYROLL_VIEW holders for employees.

**As built (impl-people P18).** `People/Development/SkillsMatrix`, a `.qvue` component (SkillsMatrix.qvue) over its `matrix` transition (`DevelopmentServices.get#SkillsMatrix`): the people a development or HR reader's employers employ now and a manager's live reports, by employer, department or team (current memberships of it and the units under it), job class, skill and name, twenty a page; the columns the job class's requirements, else the requirements of the page's people's classes and the skills they hold (at most 24); each cell the person's level (self-declared marked so) and Met, Gap (with why: "Self-declared only", a level below the least, "Waiting for verification", "No verified qualification", "Expired …") or Held, and a requirement a certificate proves with its validity (expiring within thirty days a warning); a row's gap count is of its required requirements. A self-declared level and an unverified, rejected or revoked certificate meet nothing; a requirement with a certificate and no least level is met by the valid verified certificate alone. A development editor (PEOPLE_DEVELOP_EDIT, the person in their scope as development reader or manager), or a manager of a live reporting line for that report without PEOPLE_DEVELOP_EDIT (recorded as the manager's evaluation, `SksManagerEvaluated`, which meets a requirement as an evaluation does; the user's call of Nov 12, 2026, built in P18's review), clicks a cell to evaluate (`store#Skill`: level, date, evidence; each evaluation and self-declaration kept as a `PartySkillEvaluation`, an evaluation setting the level). No one evaluates their own skill (it is a self-declaration) or verifies their own qualification, whatever admits them to their record. Certificate verification stays development's and HR's. Find available is `ironstone.people.ContextServices.find#AvailablePeople`: Projects' `find#StaffingCandidates` (owner contract: `partyIdList`, `skillSelfDeclared`) bounded to the people the matrix's filters keep, its cost rate only for PAYROLL_VIEW. The terminal twin `SkillsMatrixTui` lists a row per person and skill with the requirement and state, with Evaluate a skill and Find available. Development's, HR's and the managers' (`BOSS_PPL_SKILLS`).



**Source:** research §11

**Needs:** PE-01; PE-14; PE-20.

### Qualifications

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Qualifications | list | Find valid and expiring evidence | person, qualification type, issuer, issued/expiry, verification state | expiry filters | proposed `mantle.humanres.DevelopmentServices.find#Qualifications` | Carbon abilities; Odoo certifications |
| Qualification | dialog | Submit or verify evidence | person, type (including identity document and work permit), issuer, reference, valid dates, attachment, verifier decision | private upload; dates | proposed `mantle.humanres.DevelopmentServices.store#Qualification`; proposed `mantle.humanres.DevelopmentServices.verify#Qualification` | Odoo skill certificates; Frappe `identification_document_type` |

**Actions and states:** Self submits; an authorized verifier accepts/rejects. Revocation/renewal preserves prior evidence; staffing sees validity and requirement outcome, not identification numbers or files. Reminders are based on effective expiry and deduplicated.

**As built (impl-people P18).** `People/Development/Qualifications` over `DevelopmentServices.find#Qualifications`: Mine, or All I see (an employer's employees for a staff reader, a manager's reports), by state (waiting, valid, expiring within thirty days, expired, expiring or expired and not renewed), kind and name; each row at the reader's level: the person and HR of an employer of theirs every field (an identity document's or work permit's number theirs alone; every qualification's number opted out of AI, PE-21, P18's review), development every other field, a manager and the other staff readers verified qualifications only, as their kind, dates and validity. Add qualification (the primary; `store#Qualification`) is the person's, an HR editor's, or a development editor's for a kind that is not restricted; an identity document or work permit (`QualIdentityDocument`, `QualWorkPermit` and the kinds under them) needs its expiry. A row has Verify, Reject and Revoke (`verify#Qualification`, a reason for the last two, the state audit-logged with it) for an HR editor, or a development editor for a kind not restricted, never the person; Change (submitted again) for one waiting or rejected; Renew (a new qualification naming it) for the person's verified one; and Files, the qualification's content host (`PartyQualificationContent`, the person's and HR's), shown below the list. `check#Qualifications` is the staffing answer: per requirement of a job class, a work effort's skill standards (`minimumSkillLevel`) or one skill and kind asked, at the planned date, qualified, expiring, missing or expired with why, and no number, issuer, title, decision reason or file, to whoever's People scope admits the person. The person is reminded once per expiry (`QualificationExpiring`) and Today shows their own expiring ones (§1.4). A self-service employee opens the screen by the area's own grant (`BOSS_PPL_DEVELOPMENT`) and People's record files panel by its own (`BOSS_PPL_FILES_SELF`).



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

**As built (impl-people P19).** `People/Development/Training` over `DevelopmentServices.find#Training`: the sessions of a development reader's employers, of a self-service employee's employers, the ones the user trains and the ones they hold a place in; Upcoming (the default), Mine, I train, Past and All, by course; each row the course, when, where, the trainer, the seats taken, what passing grants, the state and the user's own place, with Ask for a place (`enroll#Training`, waiting for approval) while seats are left. A development editor (PEOPLE_DEVELOP_EDIT) of the employer has Schedule session (the one primary; `store#Training`: a course of the employer, start and end, place, trainer working for the employer, seats, the assessment form, a published form of the training assessment purpose, the course's by default and needed when the course needs an assessment) and the Courses box (`store#TrainingClass`: New course, Change, End; what passing grants and for how many months). A session is a `TrainingSession` over a private WepTraining event made through Commons' `EventServices.create#Event`, so it shows in its trainer's and the enrolled people's calendars (each reminded a day before by a `WorkEffortReminder` of their own) rather than a calendar of its own.



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

**As built (impl-people P19).** `People/Development/TrainingDetail` over `DevelopmentServices.get#Training` (by session, or by a place, as its approval notice opens it): the record header (the course, employer, time, place, trainer, seats, what passing grants, the state) with one primary, Ask for a place for a self-service employee of the employer or Enroll a person for a development editor (`enroll#Training`: the person's own request waits for a People approval of kind PakTraining, the `PeopleTrainingApproval` topic, routed as every People approval, the manager by default; a development editor's enrollment of a current employee is made at once), and under More Change session and Cancel session (every place cancelled, a waiting approval superseded). Enrollment lists the places the user reads (development and the trainer every one, an approver the one they decide, the person their own) with Approve and Refuse (`decide#Enrollment`, also from Approvals and the tray), Withdraw (the person, who asked or development), Attendance once the session started and Assess once attended (`mark#TrainingAttendance`, `complete#Training`: the session's trainer or a development editor, never on their own place), and the certificate. Record a result: passed or failed, a score, evidence and the session's assessment form (its answers a FormResponse its FormInvitation locks); a failure is kept and the person stays enrolled for another attempt; the pass completes the place once, grants the course's qualification once (a verified `PartyQualification`, valid the course's months, renewing the person's earlier one, so `check#Qualifications` and the skills matrix count it) and issues the completion certificate (§15), and a retried completion answers the first. Results: the trainer and development read every assessment of the session with the assessor's answers and evidence (opted out of AI); the person reads their own outcome, score, date and assessor; the trainer of one session reads no other session's. Seats count the places waiting and enrolled; the trainer holds no place in their own session.

**As built (impl-people follow-up 3, the user's call of Nov 12, 2026).** A session takes a meeting room (Schedule session's and Change session's Room, the `rooms` choice) booked through Maintenance's resource booking as the system after the development editor's check (Mantle `EventRooms.js`; impl-maintenance F356): a clash (named Busy), a blackout, an outage or the room's policy refuses the schedule or the change (`ROOM_UNAVAILABLE`); a move rechecks every booking of the session and its cancel withdraws them (Maintenance's `keptEventMoved` and `keptEventCancelled`); the header names a room waiting for its approver or refused. The room is the session's place; free text stays for a place off site. Its organizer may also book or cancel its rooms on Commons (`canBook`, impl-maintenance F356, F357). A session's time (its trainer's, and that of those holding a place enrolled or completed and not marked absent) is off availability for dispatch and staffing only (Training.js `sessionTimesOf`: `get#PartyCapacity` with `lessTraining`, which Projects' and People's staffing pass, and Maintenance's `sessionHours`), each moment once with leave; a timesheet's expected hours keep it, as worked time (the user's call of Nov 12).

**Review (impl-people P19).** The user's calls of Nov 12, 2026: a trainer's passing assessment grants the course's qualification as verified (the course is the authority; the grant names the trainer, as its verifier, and the session; development can revoke it), and the person assessed reads only the outcome and score of their own assessment (with its date and assessor), never the assessor's answers or evidence, which stay with development and the trainer. A trainer reads their session while they work for its employer. A place is approved before the session starts (`SESSION_CLOSED` after; a refusal may follow), and the person, and who asked for them, is told the outcome (`PeopleTrainingDecision`: the course, the day and approved or refused, never the reason; opening their place). The session's event is changed only here: Commons' EventDetail, calendar moves and CalDAV do not change it (`check#EventAccess` answers `managedBy`, and `add#CalendarEvent` puts it in no calendar). The training assessment forms are built under Skills & training › Assessment forms by the learning administrator (`PEOPLE_DEVELOP_EDIT`, which the purpose's registration admits beside `PEOPLE_CONFIGURE`). SelfService links My training (Training's Mine).



**Source:** research §11

**Needs:** PE-14; PE-15; PE-18.

## 11. Reviews and goals

Refine the commented PerformanceReview family in Mantle rather than exposing its sketches unchanged. Add ReviewCycle and dated ReviewTemplate with explicit participants, review steps and release policy. Separate self assessment, manager assessment and peer feedback visibility; private manager notes are not employee-visible Chatter. No anonymous-feedback promise is made unless a later design supplies aggregation and inference protection. Goals use WorkEffort and relationships; add typed target/actual/unit fields or an extension only where the existing percentComplete is insufficient, not a parallel goal/task store. A goal is a WorkEffort with a proposed `WepGoal` purpose (Mantle has no goal enumeration); goals are left out of the CalDAV Tasks collection, Today's task list and project time rollups, so a goal never reads as an ordinary task (PE-16).

### ReviewCycles

**Layout:** list.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Cycles | list | Track review completion | name, employer/team, period, due dates, template, counts, state | progress counts | proposed `mantle.humanres.ReviewServices.find#Cycles` | Frappe Appraisal Cycle |
| CycleSetup | dialog | Create a cycle and preview participants | scope, period, template, self/manager dates, reviewer rule, release policy | preview participant list | proposed `mantle.humanres.ReviewServices.store#Cycle`; proposed `mantle.humanres.ReviewServices.start#Cycle` | Frappe Appraisal Cycle |

**Actions and states:** Start creates one review per intended person/cycle with independent results. Changed reporting lines do not silently disclose earlier feedback; reviewer reassignment is audited. (As built: the feedback given on a review is the review's, so a new reviewer reads it; the user's call of Nov 12, 2026, impl-people §4.) Close only with explicit completion/exclusion outcomes.



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

**Needs:** PE-01; PE-15; PE-16; PE-18; PE-21.

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

**As built (impl-people P20).** The records are Mantle's `mantle.humanres.ability.ReviewTemplate` (dated, an employer's: the self
assessment, the reviewer's assessment always, feedback allowed and whether it is shared, approval before release, the review form of
each step), `ReviewCycle` (an employer or a unit and the units under it, the template, the period, the self and reviewer due dates;
draft, in progress, closed), `PerformanceReview` (a person's review of one employment; its reviewer and state audit-logged, the
overall rating, the release and acknowledgment), `PerformanceReviewStep` (the self assessment, the reviewer's assessment and each
feedback asked, each with its assignee, due date, review-form response, summary, rating and returns), `PerformanceNote` (the
reviewer's private notes) and `PerformanceReviewContent` (the review's files), over `mantle.humanres.ReviewServices` (Reviews.js). The
criteria of an assessment are the questions of the step's review form (`DbfpReview`), so the sketch's PerformanceReviewItem is not
built; a step with no form is a written summary (and, for the reviewer, the overall rating).
- **ReviewCycles** (`People/Performance/ReviewCycles`, the review administrator's): Open, Closed and All cycles with their scope,
  template, period, due dates, progress (reviews, assessed, released, acknowledged, excluded) and state; New cycle (the one primary);
  a draft's Change, Preview (who it reviews and who has no manager to review them) and Start reviews (one review per person, each in
  its own transaction, the failures named; a later start adds the people left out); a started cycle's Close (only when every review
  is released or excluded, or the open ones excluded with the reason). Templates: New template, Change (only while no started cycle
  uses it), End.
- **Reviews** (`People/Performance/Reviews`): To do (the user's step waiting, a decision, a release, an acknowledgment), Mine, I
  review and All (a development reader's employers', never their own); the person, cycle, reviewer, the steps' states, due date and
  state; never a rating, and the person is not shown who was asked for feedback.
- **ReviewDetail** (`People/Performance/ReviewDetail`): the record header with one primary by state (Acknowledge, Approve, Release,
  Finalize) and More (Ask for feedback, Return the self assessment, Return the reviewer's assessment, Refuse, Change reviewer,
  Exclude); Steps (what the user reads of each: the person their self assessment and, once released, the reviewer's and the shared
  feedback; a giver their own; the reviewer, development and an approver every step, the feedback an earlier reviewer asked for
  included); Your self assessment, Your assessment of, Your feedback on (the step's review form as a dynamic form of its DbForm, a summary
  and the reviewer's rating, submitted once); Your private notes (their author's alone, never released); the approval (its decisions
  and reasons the full readers' alone, never the person's; a return's reason the step's assignee's and the full readers'); the goals
  of the review; Files (the review's content host: the reviewer's, development's and, once released, the person's). The review's
  notes and messages (People's record panel) open once it is released, when they are the person's too: nothing is filed on it
  before (`link#CommunicationEventRecord` refuses `REVIEW_NOT_RELEASED`), and their mention and follower notices go to their named
  recipients alone (`ConfidentialRecordType`). Every assessment's
  text, note and acknowledgment is opted out of AI. A new reviewer (development's reassignment, or the separation's re-route when the
  reviewer leaves or the line changes while the assessment waits) reads the feedback already given on the review and withdraws what
  still waits (it belongs to the review; the user's call of Nov 12, 2026), never an earlier reviewer's note, and never decides the
  review's approval; the reassignment is audit-logged with its reason. The re-route decides each review in the caller's transaction
  (which holds the separation or the line change) and changes it in a transaction of its own, so one review's failure is logged and
  the rest and the caller's work stand (People's follow-up 2).
- **Today, MyTeam and Employee360** (P20's review): People's Today source answers the user's review steps due (their self
  assessment, the assessment of a person they review, feedback asked of them), each opening the review; MyTeam's Reviews due lists
  the open reviews the manager gives (the person, the cycle, what waits, the due day); Employee360's Reviews (SkillsAndReviews'
  second half, under People) lists the person's reviews the user reads as the person, the reviewer or development, with the state
  and, once released, the overall rating, each opening ReviewDetail.
- **Goals** (`People/Performance/Goals`): Mine, My team and All, open or closed, or a person's or a review's goals; Add goal (the one
  primary: the user's own, a report's for their manager, an employee's for a development editor; agreed in a review when opened from
  one), a row's Update progress, Change, Close (with its outcome: met, partly met, not met) and Cancel goal. A goal is a WorkEffort of
  the `WetGoal` type and `WepGoal` purpose with `PersonGoal`'s measure, target, actual value and unit; the type keeps it out of every
  task list (CalDAV Tasks, Today's and My tasks), project rollups and the search index, and `get#RecordLinkInfo` admits it only to its
  person, their manager, its review's reviewer and development readers of its employer. People's follow-up 2: it is no work either;
  Mantle's REST `/workEfforts` lists and reads it nowhere and does not change or copy it, the work services refuse it
  (`check#WorkEffortOpen`, `GOAL_NOT_WORK`), no task goes under it (a task's parent is a task, `PARENT_NOT_TASK`), and Chatter calls it
  a goal.

## 12. Reports and settings

### Reports

**Layout:** report.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportOptions | single | Choose a report and permitted dimensions | report, employer/team, date range/as-of, employment type, group/type, currency | report picker; saved finds | proposed `mantle.humanres.PeopleReportServices.get#Options` | Frappe HR report catalogue |
| ReportResults | list, read | Present authorized rows and aggregates | selected dimensions, counts/amounts, denominator, source reference | grouped table; CSV/XLSX | proposed `mantle.humanres.PeopleReportServices.run#Report` | Frappe headcount, leave, attendance, recruitment and salary reports |

**Actions and states:** One registered report service family covers headcount/joins/exits/turnover, vacancies/funnel/time-to-hire, referral funnel (by `referredByEnumId` and referring employee), attendance exceptions, leave balance/ledger, payroll register/variance/liabilities, expenses/advances, qualification expiry and review completion. Distinct people and employments are labelled; headcount is as-of and turnover exposes its denominator. Pay reports group currency and require payroll permission. Exports use the same projection and filters. The shipped `report/people-*.json` datasets, dashboard and alert templates of §1.4 register with Insights; a monthly headcount and turnover schedule to HR managers is an Insights report schedule, not a People job. No shipped dataset carries pay.



**As built (impl-people P29).** ReportOptions is the reports the user reads (`get#Options`: headcount and turnover for an HR reader or
the People administrator; vacancies and the hiring funnel for a recruiter or HR; attendance exceptions and leave balances for HR;
expense claims for HR or a holder of PEOPLE_EXPENSE_MANAGE, over the employers whose claims they manage; qualification expiry and review completion for development or HR; the
payroll register for a payroll reader alone), the employer (every one of the user's when empty), the period (from the first of the
month through today when empty; through is the as-of date of headcount and leave balances) and, for headcount, by employer,
department or all together. ReportResults is one section per report: headcount at the start and the end (distinct people),
employments at the end, joins and exits (employments) and turnover, with the denominator said (exits ÷ (start + end) / 2); the
funnel's applications received in the period by their stage now, by opening and by source, with the vacant seats now; the days with
a missing clock in or out or a repeated punch; each employment's leave by type from the ledger; claims by employer and state and
the payroll register's employees, each currency apart; qualifications expired and not renewed or expiring in the window (90 days by
default), never a number; each review cycle's reviews by state and the share completed, never a rating or a note. Export CSV is the
same rows with the options, the basis and the denominator, each cell a spreadsheet would read as a formula behind an apostrophe. The
time-to-hire, the payroll variance and liabilities and the advances are not built (§17 if wanted). Insights' catalog opens each report
here with it chosen.

**Source:** research §14

**Needs:** PE-01; PE-17; PE-24.

### Settings

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SetupReadiness | list, read | Identify missing dependencies | employer, module, required setup, missing policy, permission, localization coverage | links to owning settings | proposed `mantle.humanres.PeopleServices.get#Readiness` | Frappe HR Settings |
| PeoplePreferences | single | Set dated organization preferences | self-service features, clocking, attendance zone policy, retention purposes and defaults, notification choices | toggles and policy links | proposed `mantle.humanres.PeopleServices.store#Settings` | Frappe HR Settings; Carbon people config |

**Actions and states:** Settings link to domain editors rather than arbitrary JSON/PartySetting entry. Enabling payroll requires readiness, including confidentiality coverage and localization for live runs. People supplies the retention purposes and defaults for recruitment, leave evidence and identity data; Admin owns retention schedules and holds and runs reviewed deletion or anonymization, which never touches accounting history or records under a hold. Import employees opens EmployeeImport.

**As built (impl-people P29).** SetupReadiness answers every phase's checks for an employer with employees (departments,
managers, payroll, positions, an HR fallback among the approval rules, an onboarding checklist, a working schedule, a leave policy and
someone to take confidential cases), each linking the place that sets it up, as Admin's Health shows them. PeoplePreferences is the
Preferences tab, an employer's: Clocking (its default, the PartySetting `PeopleClocking`; an employee set apart in Who clocks keeps
their own setting) and Confidential cases (its intake handlers, `PeopleCaseIntake`, by name, each an enabled account holding
PEOPLE_CASE_HANDLE who works for it; with nobody a filing there is refused), each change audit-logged with its reason
(PartySetting.settingValue is audit-logged) and refused when the settings changed since they were read (a change of the intake
handlers, which replaces the whole list, always names the revision it read; Who clocks' Employer's default sets one value). The People administrator's;
an HR editor sets the clocking default from Who clocks too. The other preferences link to their own editors (leave policies,
holidays, working schedules, approval rules, checklists); the attendance zone policy, the self-service features and notification
choices are not settings (a schedule's zone decides the day; the features follow the capabilities), and the retention purposes wait
on Admin's PrivacyServices (§7 of impl-people).

**Source:** research §15

**Needs:** PE-01; PE-08; PE-12; PE-18.

### EmployeeImport (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Employees/EmployeeImport` mounts `Shared/DataImport.xml` (Admin §11) with the target `employees` of Admin §11 | Upload, Map and preview, Apply, Results | the employer `organizationPartyId`; `PEOPLE_IMPORT` with PEOPLE_HR_EDIT | stage, map, validate, apply, download error rows | person matching and employment start per row |

The target is a `rows`-mode `moqui.server.TransferTarget` that Mantle seeds, on the pattern of the staff invitations target; its import permissions are `PEOPLE_IMPORT` and PEOPLE_HR_EDIT, its view permission PEOPLE_HR_VIEW, and it names no `ADMIN_*` permission (§1.1). Its row services call proposed `mantle.humanres.PeopleServices.preview#Hire` to validate a row and `hire#Employee` to apply it, with the HireEmployee identity and employment rules per independent row, stable external source keys and an approved mapping. It cannot import passwords, grant user groups or silently overwrite pay or tax history (password, group and pay columns are refused); provisioning follows the hire through the same tx-commit SECA as in §4 (review Z2, Z3, R-PPL-12).

**Source:** research §15, §17; Frappe employee data import; Admin §11 DataImport

**As built (impl-people P7).** `People/Employees/EmployeeImport` mounts `Shared/DataImport.xml`; `ironstone.shared.DataImportServices.get#ImportMount` gives People the `employees` target alone (an HR reader's; run by an HR editor with `PEOPLE_IMPORT`), and its owner route `peopleEmployeeImport` opens it from Admin's Imports. Mantle seeds the target (`data/PeopleLifecycleSetupData.xml`): the person (an existing one by id, else first and last name and work email), the start and end and the first assignment by id, keyed by person and work email (a repeated row is named, not hired twice); `password`, `group`, `permission`, `userid`, salary, wage, pay, tax, bank and IBAN columns refuse the file; its row services `PeopleServices.validate#`, `apply#EmployeeImportRow` and `find#EmployeeImportScopes` (callable by any user, each checking `PEOPLE_IMPORT` and the hire's permissions and scope) validate with `preview#Hire` and hire with `hire#Employee` under the row's key, requesting no account.

**As built (impl-people P25, the user's call of Nov 12, 2026).** The `employees` target takes a first salary (Salary, its currency, Salary frequency and Salary from, the employment's start when empty): for an importer who also holds PAYROLL_EDIT and PAYROLL_VIEW at the employer it is checked as a pay change's terms and written at once, audited as "Employee import" and logged without its amount (the import's exception to first-salary approval); for anyone else the salary columns alone are refused and the rest of the row applied; a salary in place is never changed by an import (`PAY_CHANGE_REQUIRED`). As built in P25's review (the user's call of Nov 12, 2026): the salary columns name PAYROLL_VIEW, so a staged row's salary values are shown only to a holder (masked "Restricted" for the batch's other readers: an HR importer, an HR reader, Admin's Imports, in the rows and the report) and cleared from the staged row once it is applied.

**Needs:** PE-02; PE-19.

### ApprovalPolicies

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Policies | list | Find dated rules | employer, transaction kind, scope, steps, effective dates, alternate | filters | proposed `mantle.humanres.PeopleApprovalServices.find#Policies` | Odoo validation types; Frappe department approvers |
| ApprovalRule | single | Set explicit approval steps | type, scope, employee override, department role, manager/HR route, alternate, effective dates | rule summary | proposed `mantle.humanres.PeopleApprovalServices.store#Policy` | Frappe approvers; Gauzy approval policy |
| ResolvePreview | display | Explain routing for an example | requester, employment, kind, amount/context, resolved approvers, conflicts | explanation list | proposed `mantle.humanres.PeopleApprovalServices.resolve#Approvers` | Frappe team requests |

**Actions and states:** Resolve employee override → matching department/type rule → manager → designated HR fallback; explicit multi-step rules require every step. No self-approval or automatic approval on missing approver. Decisions store actor, step, source revision, time and reason; changed terms invalidate pending approvals. Generic Commons notifications invoke domain decisions rather than changing statuses themselves.

**Approval topics (review R-PPL-17).** Each proposed `NotificationTopic` names its decision service as `approveServiceName` and `refuseServiceName`; the service takes the action and rechecks authority and live state. The topics are seeded in Mantle, each beside its decision service and with the phase that builds that service, as Mantle's other approval topics are, not in Commons' seed: a topic that names a missing service would be a broken approval (impl-people §4, F42). Commons §4 lists them and supplies the Notifications list People mounts as Approvals.

| Topic (proposed) | Decision service |
| --- | --- |
| `PeopleLeaveApproval` | `mantle.humanres.LeaveServices.decide#Request` |
| `PeopleAttendanceApproval` | `mantle.humanres.AttendanceServices.decide#Correction` |
| `PeopleExpenseApproval` | `mantle.humanres.ExpenseServices.decide#Claim` |
| `PeopleAdvanceApproval` | `mantle.humanres.ExpenseServices.decide#Advance` |
| `PeoplePositionApproval` | `mantle.humanres.PositionServices.decide#PositionApproval`, through the topic's `approve#PositionApproval` and `refuse#PositionApproval` (as built, P5) |
| `PeopleOfferApproval` | `mantle.humanres.RecruitingServices.change#OfferState`, through the topic's `approve#Offer` and `refuse#Offer` (as built, P17: with no rule the employer's HR officers decide it, the kind's default route; a refusal makes the offer a draft again) |
| `PeopleEmploymentChangeApproval` (transfer, pay change, separation) | `mantle.humanres.PeopleServices.decide#EmploymentChange`, through the topic's `approve#EmploymentChange` and `refuse#EmploymentChange` (as built, P6: a transfer and a separation; P23: the pay change, asked by a payroll editor, its request of its own kind `PakPayChange` bound to the salary rows and decided by the employer's payroll approvers unless a rule of the kind routes it; the first salary waits too (P23 review); its notice names no one and no amount) |
| `PayrollRunApproval` | `mantle.humanres.PayrollRunServices.approve#Run` and `return#Run`, the topic's approve and refuse services (as built, P25: kind `PakPayrollRun`, a calculated pay run asked by a payroll editor, bound to its population, amounts and source revisions; with no rule the employer's payroll approvers decide, never one who selected or calculated it or asked; the notice names the group and the period, never a person or an amount, direct-only; it opens PayRunDetail; P26: nobody whose own pay the run holds decides it, a payroll approver employed in the group among them, and the approval makes the run's calculated employments payslips) |
| `PeoplePayAdjustmentApproval` | `mantle.humanres.PayrollInputServices.decide#Adjustment`, through the topic's `approve#Adjustment` and `refuse#Adjustment` (as built, P24: kind `PakPayAdjustment`, a payroll editor's adjustment; with no rule the employer's payroll approvers decide, who hold PAYROLL_VIEW and PAYROLL_APPROVE; never one who made or changed it, nor the person it pays; a changed adjustment supersedes it; the notice is direct-only and names "a pay adjustment" and the employer, never a person or an amount) |
| `PeopleTrainingApproval` | `mantle.humanres.DevelopmentServices.decide#Enrollment`, through the topic's `approve#Enrollment` and `refuse#Enrollment` (P19's review: before the session starts; the person told by `PeopleTrainingDecision`) (as built, P19: a place the person asked for in a training session) |
| `PeopleReviewStep` | `mantle.humanres.ReviewServices.change#ReviewState`, through the topic's `approve#ReviewStep` and `refuse#ReviewStep` (as built, P20: the finalizing of a review whose template asks for approval; with no rule the employer's HR officers decide it, never the reviewer who asks or the person; a refusal returns the reviewer's assessment) |
| `PeoplePayrollConfigApproval` | `mantle.humanres.PayrollSetupServices.decide#Publication`, through the topic's `approve#Publication` and `refuse#Publication` (as built, P22's review, the user's call of Nov 12, 2026: kind `PakPayrollConfig`, publishing a pay component's term or a pay structure's lines, which takes effect on approval; with no rule the employer's payroll approvers and HR editors are the candidates, and whoever decides holds PAYROLL_VIEW and PAYROLL_APPROVE or PEOPLE_REQUEST_APPROVE; never one who drafted it or asked; a changed draft supersedes it; the notice names the component or structure and the employer, never an amount) |
| `PayrollRunApproval` | `mantle.humanres.PayrollRunServices.approve#Run`; refuse returns the run to Review through proposed `return#Run` |

These topics have lock-screen-safe titles (§1.4).

**As built (impl-people P5).** `People/Settings/ApprovalPolicies` (tab "Approval rules", the People administrator's): Policies (employer, kind, the scope it applies to, step, who decides, the person, the alternate, from, state; ended rows when asked), New rule (the one primary), and each row's Change (dated: the row in effect ends and the next starts, with the reason in the audit log) and End; ResolvePreview ("Who would decide": employer, kind, department, the employee it is about and who asks, answered step by step with who decides and why). The records are `mantle.humanres.approval.PeopleApprovalPolicy` (a dated step of an employer and a kind, `PeopleApprovalKind`, for the whole employer, a department or one employee, decided by a role, `PeopleApproverRole`: department head, manager, named person or HR officer, with an alternate; a `ParHrFallback` row names the employer's HR fallback for the kind), `PeopleApproval` (a request bound to its source's revision: waiting, approved, refused or superseded) and `PeopleApprovalDecision` (actor, step, rule row, role, revision, time, reason), over `mantle.humanres.PeopleApprovalServices` (find#Policies, store#Policy, resolve#Approvers, record#Decision). Routing: the rules naming the request's employee, else those of the nearest department at or above the source's, else the employer's; with none, the person's manager (the head of the department for a position). A step's approvers are those of its role who hold `PEOPLE_REQUEST_APPROVE`, HR-routed steps too (an HR editor without it decides none; impl-people §4, the user's call), and work for the employer now, never the requester or the person the request is about, nor one who decided another step; when none may, the alternate, then the HR fallback, else the request waits and nothing is approved. A rule change routes the waiting requests again, and an approver's separation does too (P6). A rule's change or end takes effect from its date and never before now. An approval rule is handed to a new approver by the offboarding operator (`PEOPLE_APPROVAL_OWNER_CHANGE`) or the People administrator, not by its approver alone. A decision rechecks the approver and the source's revision; new terms supersede a request waiting (`SOURCE_CHANGED` when changed outside the domain's service), and a decision retried by the same user answers the first. Rules are read by the People administrator and an HR reader and changed with `PEOPLE_CONFIGURE`. Each kind and topic is seeded with the phase that builds its decision service: P5's is the position's activation. The framework passes no action to a topic's service, so each People topic names an approve and a refuse handler over the decision service.



**Source:** research §13

**Needs:** PE-01; PE-15; PE-18.

### ChecklistTemplates

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Templates | list | List role-based task templates | name, lifecycle kind, tasks, due offsets, active dates | template links | proposed `mantle.humanres.PeopleServices.find#Checklists` | Frappe Employee Boarding |
| ChecklistTasks | list, editable rows | Assign lifecycle work by role | task template, role, due offset, required flag, source link (exit-interview form, equipment return, IT access), visibility, protected flag | task/role choices | proposed `mantle.humanres.PeopleServices.store#Checklist` over proposed `mantle.work.ProcessServices.store#ProcessStep` | Frappe boarding activities; Projects task templates |

**Actions and states:** A template is an `isTemplate` WorkEffort tree (review Y5). Hire and EmploymentChange instantiate it through proposed `mantle.work.ProcessServices.instantiate#WorkProcess` with a People policy (no evidence, readings or waivers), under a lifecycle-event root with purpose `WepPrOrgMgmt` and no documentation space. Task text carries only what that role needs; IT receives access work, not salary or separation case notes, and its task carries the Admin lifecycle `operationId` that the mr-boss tx-commit SECA on `hire#Employee` or `apply#EmploymentChange` returns from `request#Provisioning` or `request#AccessEnd` (review Z3, §4). A separation adds one equipment return task per current AssetPartyAssignment (review Y6), and an offboarding template can include an exit-interview task that opens a Forms questionnaire of the exit-interview purpose. Required completion is tracked explicitly.

**Phones (review Y1).** Offboarding, separation and grievance-linked tasks are protected: they are left out of the CalDAV Tasks collection. Onboarding and training tasks appear there with their sanitized names, and a phone's change to one goes through `mantle.work.TaskServices.update#Task` and `set#TaskStatus`, so it follows the task's flow and the process guard.

**Source:** research §6, §16; review R-PPL-W03

**As built (impl-people P7).** `People/Employees/ChecklistTemplates` (Employees' Checklists, HR's area with Employee import, by `BOSS_PPL_HR_AREA`; Settings stays the People administrator's and HR does not open it, the user's call of Nov 11): Templates (the employer's checklists with what starts them, their steps and state; New checklist, the one primary, and each one's Rename and End) and, for the one opened, ChecklistTasks (task, who does it, due, details; Add step, Edit, End), over `PeopleServices.find#Checklists`, `store#Checklist` and `store#ChecklistStep`. An HR reader reads them, an HR editor of the employer changes them; nothing is deleted. A checklist's tasks are ordinary tasks (People's policy guards nothing), opened at `People/Tasks/WorkItemDetail`. The exit-interview link names the task's purpose; its questionnaire joins with P16's forms.

**As built (impl-people P16 review).** A step linking an exit interview (`ClsExitInterview`) opens a form of that purpose on its task: WorkItemDetail's People box shows "Exit interview" with the employer's only published exit interview form (People's Forms) for one of the task's people to record the leaver's answers once (`mantle.humanres.PeopleServices.submit#ExitInterview`: a `FormInvitation` naming the leaver and the task, with no link), and the answers to the task's people and the employer's HR readers (`get#ChecklistTask`'s `exitInterview`), never the leaver; opted out of AI.

**Needs:** PE-02; PE-15; PE-18; MT-03.

### Lookups

**Layout:** settings.

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Lookups | list | Inspect approved vocabulary families | family, code, description, order, active use | family dropdown | proposed `mantle.humanres.PeopleServices.find#Lookups` | Frappe HR Setup; Mantle Enumeration |
| Lookup | dialog | Add or end a permitted value | family, code, description, sequence, effective state | controlled fields | proposed `mantle.humanres.PeopleServices.store#Lookup` | Mantle SkillType, TerminationReason and BenefitType |

**Actions and states:** Whitelist HR-owned families; do not expose arbitrary enum/status/service editing. Required seeds include applicant role/stages, skill types/levels, termination reasons and new domain status flows. Referenced values are ended, not deleted; localization-owned statutory codes are read-only here.

**As built (impl-people P5).** `People/Settings/Lookups` (the People administrator's): a vocabulary chosen from the whitelist (termination reasons, termination types, skill types and skill levels, Mantle's `SkillLevel` seeded 1 Basic to 5 Expert; later phases add theirs), its values in order with how many records hold each, Add value (the one primary), Edit (name, code, order) and End per value; ended values listed when asked. A value is ended by `Enumeration.thruDate` (a Mantle extension of the framework's entity), never deleted, over `mantle.humanres.PeopleServices.find#Lookups` and `store#Lookup` (read by the administrator and an HR reader, changed with `PEOPLE_CONFIGURE`); People's choices of an HR vocabulary leave ended values out and its services refuse one for a new record (JobClassDetail's skills, `store#JobRequirement`; impl-people §4, the user's call). BenefitType is not among the families yet.



**Source:** research §15

**Needs:** PE-03; PE-04; PE-07; PE-14; PE-16.

## 13. Shared screens

These mounts reuse their owner’s forms and services. Crosscut §3.4 registers People-owned Employee360 and its limited projections; the other owners retain their definitions. Existing TimeEntry forms do not gain attendance authority or compensation access from this app’s mount. A shared list/action always receives a server-derived capability set and safe display values. Each block below is People's row of the owner's per-app context table; a mount narrows the owner's authorized data and actions and adds no authority. The owners' tables gain these rows (review R-PPL-06): crosscut §2 registers the five Projects time screens, and crosscut §3.10, §3.11, §3.16, Commons §7 and Projects §8 carry People rows.

### MyTime (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Time/MyTime` → Projects §8 MyTime | week grid, timer, submit | current user party; the employers and projects the user may log to | log time, start and stop the timer, submit the week | own weekly time; no rate columns |

**Source:** Projects §8 MyTime; research §16.

**Needs:** PE-01; PE-18.

### Timesheets (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Time/Timesheets` → Projects §8 Timesheets | submitted and missing weeks | the employees and teams whose weeks the user may approve (TIMESHEET_APPROVE plus approver resolution) | approve, return, remind missing time (`send#MissingTimeReminders`) | hours and state; no pay amounts |

**Source:** Projects §8 Timesheets; research §16.

**Needs:** PE-01; PE-18.

### TimesheetDetail (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Time/TimesheetDetail` → Projects §8 TimesheetDetail | week entries, totals, history | the one timesheet | submit, approve, return; reopen refused once a finalized pay input consumed it (PE-09) | payable hours and their sources; no rates without PAYROLL_VIEW |

**Source:** Projects §8 TimesheetDetail; research §16.

**Needs:** PE-01; PE-18.

### TimeEntries (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Time/TimeEntries` → Projects §8 TimeEntries | entry list with source links | party, period and employer the user may see | store and delete under the owner's guards; CSV import; payroll consumption blocks a duplicate worker invoice (PE-09) | worker-side sources for pay; employee rates masked without PAYROLL_VIEW (Y2) |

**Source:** Projects §8 TimeEntries; research §16.

**Needs:** PE-01; PE-18.

### Rates (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Payroll/Rates` → Projects §10 Rates | Worker pay (`RaprVendor`) and, once seeded, Labor costing (proposed `RaprCost`, PE-23) read-only | party, position class, work type and effective dates; client rates (`RaprClient`) hidden without Projects billing grants | `mantle.humanres.RateServices.create#RateAmount`, `update#RateAmount` with PAYROLL_EDIT for employee pay rates; costing rates are maintained by Accounting | dated pay rates |

**Source:** Projects §10 Rates; research §16.

**As built (impl-people P10; MyTime, Timesheets, TimesheetDetail, TimeEntries and Rates).** Projects' screens mounted as they are (`screen/People/Time.xml`, `screen/People/Payroll.xml`), with their print, terminal twin, team timesheet and import beside them, reading the mount from `appRoot` for their links only (design-projects §8 "As built for People"); no rate column without `PAYROLL_VIEW` (Mantle's masking, review Y2) and no money without `TIME_ENTRY_RATE`. Timesheets lists the weeks the user may approve: a line manager's reports under the organization's `line` policy (People's demo sets it on Retail; a deployment chooses it in Projects' settings) and, under `any`, every week for `TIMESHEET_APPROVE`; Missing adds the user's live reports who keep time (as reviewed, the user's call of Nov 11, 2026: `get#LineReports`' `keeperIdList`, time kept this week or in the eight before, or the employer's policy `rq`, every employee keeps a weekly timesheet; Retail's demo sets it). The four timesheet topics link through Commons' record-link resolver (`/apps/Commons/openRecord`), so a notice opens People's screen for one who keeps time under People and Projects' for a Projects user, a missing week with no timesheet too. Rates for a payroll user without money: Worker pay lists the pay rates of the employees of their People employers (another employer's employees and contractors' rates are not shown), added and changed with `PAYROLL_EDIT` on no project; Labor costing lists the `RaprCost` rows read only; client billing and Which rate are hidden. The reopen guard for a consumed pay input waits on P24 (PE-09).

**Needs:** PE-01; PE-18; PE-23.

### TeamCalendar (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Time/TeamCalendar` → Commons §7 Calendar | month, week and list views; the team's absence and shift projection | the team and date range the user may see; WetTimeOff and shift projections only; reasons and files omitted | open the request or shift; edits go to LeaveRequestDetail or ShiftRoster; `.ics` export; the same projection as a read-only CalDAV collection (CX-SYNC) | who is out and who is on shift |

**As built (impl-people P12).** `People/Time/TeamCalendar` (menu 6, with TeamCalendarTui, an agenda of two weeks): Commons' `Calendar.qvue` in its read-only resource mode, its transitions answered by `LeaveServices.get#TeamAbsences`: the approved leave of the user's own, their colleagues' (an employee's: the people who share a department, a team or a manager with them at an employer of both; the user's call of Nov 11, 2026, in P12's review), a manager's live reports' and an HR reader's employers' people, each as "{person} · Out" (a morning or an afternoon said so), never the type, the reason or a refused or waiting request, opening LeaveRequestDetail when the user reads it (never a colleague's). The `.ics` export of the view is not built; the same absences are the Team absence projected CalDAV collection (`projected-PeopleTeamAbsence`, read only): a `mantle.work.calendar.CalendarProjection` row Mantle seeds names its owner service (`LeaveServices.get#AbsenceProjection`, `define#ProjectionOwner`), and `CalendarDavServices` lists and answers it with no People record read of its own. Shifts join with P14. As built (impl-people P14): the published shifts of the same people (`ScheduleServices.get#TeamShifts`: "{person} · Shift", with its work location for the user's own, a report's or an HR reader's, a colleague's its times alone, as work hours; never a draft or the rosterer's comments), so a worker sees their shifts and their colleagues' beside who is out; the terminal agenda lists both. A worker's own shifts are the My shifts projected collection (`projected-PeopleMyShifts`, `get#ShiftProjection`).

**Source:** Commons §7 Calendar; research §16.

**Needs:** PE-01; PE-18; PE-24.

### InterviewsCalendar (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Staffing/InterviewsCalendar` → Commons §7 Calendar and EventDetail | week and list views; EventDetail with participants and call link | private interview events of the user's panels or recruiting scope; application and date filters | schedule, move, add a video call, invite the candidate by iMIP, RSVP, `.ics` export; open the scorecard (assigned reviewers only) | the interview and its application, never other candidates |

**As built (impl-people P16).** `People/Staffing/InterviewsCalendar` (menu "Interviews", key `g v`, with InterviewsCalendarTui, an agenda of two weeks): Commons' `Calendar.qvue` in its read-only resource mode, its transitions answered by `RecruitingServices.find#Interviews` (the interviews of the user's panels and, for a recruiter, of the employers in scope; "{applicant} · {opening}"); an interview the user attends or scheduled opens Commons' EventDetail mounted as its subscreen (attendees, RSVP, Send invitations, Export .ics; its own access check), any other its ApplicantDetail. Scheduling and the call link are ApplicantDetail's; moving an interview is EventDetail's (the scorecards stay). Calendar.qvue now finds its serving screen by a path segment ending in Calendar, so TeamCalendar's transitions are its own too (it had called Commons' Calendar's, a P16 finding). The panel's interviews are the My interviews projected CalDAV collection (`projected-PeopleMyInterviews`, "Interview · {opening}", never the candidate).

**Source:** Commons §7 Calendar and EventDetail; research §16.

**Needs:** PE-01; PE-04; PE-18; PE-24.

### Approvals (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Approvals` → Commons §4 Approvals; crosscut §3.15 | the Approvals list with balance or amount context | the People approval topics of §12 ApprovalPolicies addressed to the user | approve, refuse with reason, bulk approve (each record through its decision service), open | leave balance, claim total and request dates |

As built (impl-people P5): `People/Approvals` (menu index 3, key `g a`, every People user's) mounts `Commons/Notifications.xml` with `notificationTopics` `PeoplePositionApproval` (P6: and `PeopleEmploymentChangeApproval`, whose row opens the person's Employee360) and the title Approvals, as Accounting's and Purchasing's do; the root's shell providers register the topic. A row opens PositionDetail (BossSetupData's link); approve and refuse go through the topic's handlers, as from the notification tray.

**Source:** Commons §4 Notifications; crosscut §3.15; research §16.

**Needs:** PE-01; PE-18.

### WorkItemDetail (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Tasks/WorkItemDetail` → Projects §5 WorkItemDetail | Overview, Files, Conversation; no Time or money panes | lifecycle and development tasks assigned to or readable by the user | start, complete, comment, attach, through the process guard; a task permission alone opens no confidential source | the sanitized lifecycle or goal link and the next step |

**As built (impl-people P7).** `People/Tasks/WorkItemDetail` (out of the menu) mounts the shared WorkItemDetail with People's branch: a checklist or equipment return task People admits (`PeopleServices.get#ChecklistTask`: its people, an HR reader of the employment's employer, the employee when the step is theirs to see), on the Commons task rule (Overview, Files and Chatter; no sub-task, time or money pane, no clone, request or delete), with the People box: the person, employer, checklist and kind, the equipment (EquipmentDetail) or the Admin outcome of the IT access request (the operation's state and its steps' states), and the checklist's other tasks. An HR reader who is none of its people sees the box alone, read only.

**Source:** Projects §5 WorkItemDetail; research §16.

**Needs:** PE-01; PE-18.

### RequestDetail (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Employees/RequestDetail` → Projects §6 RequestDetail; crosscut §3.11 | Overview, Conversation, Files | the proposed HR-confidential type; explicit case participants only (PE-01); ordinary manager and request-reader grants are not enough | triage and decide by the case handler; comment and attach for participants; no Work link completion, no triage notice | confidentiality; text fields carry the AI opt-out (PE-21) |

**Source:** Projects §6 RequestDetail; crosscut §3.11; research §16.

**As built (impl-people P21).** `People/Employees/RequestDetail` is Shared/RequestDetail with People's branch (`template/PeopleCaseDetail.xml`, inside a section opted out of AI): the case's record header (its subject, the caller's part, the employer, the day filed, the state) with one primary by state (a handler's Start, Resolve with an outcome note, Reopen; the employee's Withdraw), a handler's More (Close without action, Add a handler, Remove a handler, Ask for work), the case, its people, the work asked of others (handlers), the conversation (Chatter of the request: notes, which tell its people on PeopleCaseUpdate) and its files (RecordFiles, kept outside the Records drive). No shell record context, so no quick create or Today activity attaches to it. Any other request, and a case to anyone but its people, is "not available"; a case is not available in any other app's RequestDetail.

**Needs:** PE-01; PE-18; PE-21.

### EquipmentDetail (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Employees/EquipmentDetail` → crosscut §3.10 EquipmentDetail | Identity and Assignments (custody history) | assets the person holds or held; no Book pane or asset cost | open the return task; the custodian ends the assignment with `replace#AssetPartyAssignment` (review Y6); other custody actions stay Warehouse- and Maintenance-owned | custody and return at separation |

**As built (impl-people P7).** `People/Employees/EquipmentDetail` mounts the shared EquipmentDetail with People's context (`template/PeopleEquipment.xml`): an asset a person the user reads as HR holds or held (`PeopleServices.get#EquipmentCustody`), its header (no cost) and Custody (holders, dates, open return task, End assignment for an HR editor: `return#Equipment` to a receiving custodian employed by the employer, over `replace#AssetPartyAssignment`, which completes the return task); no files, notes or other custody action. Employee360's Assigned equipment (`get#AssignedEquipment`, the person's and HR's) links it.

**Source:** crosscut §3.10 EquipmentDetail; research §16; review Y6.

**Needs:** PE-01; PE-02; PE-18.

### InvoiceDetail (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Payroll/InvoiceDetail` → crosscut §3.16 InvoiceDetail; Accounting BillDetail | header, net and obligation lines, settlement | payroll-origin and claim invoices only; payroll-finance grant (Accounting's payroll-origin projection, Y7) | read and reconcile; financial edits and approval stay Accounting-owned | payroll obligation to payment |

As built (impl-people P15): People's branch of the shared InvoiceDetail (`template/PeopleInvoiceDetail.xml`, appRoot People) shows an expense claim's invoice to a payroll reader of the employer (`ExpenseServices.get#Claim`'s payroll access): the header, the settlement (route, total, applied, unpaid, the payments applied) and the lines, with the claim's link; anyone else is told it is not available. As built (impl-people P27): a payroll reader of the employer also reads an invoice a pay run's obligation names (`PayrollRunServices.get#Obligation`: net pay, a payee's amounts, a receivable from a person who left, a claim a run settled): the obligation with its run and payslip, the invoice's state and posting, its lines with their accounts and the payments applied, amounts opted out of AI; read and reconcile only.

**Source:** crosscut §3.16 InvoiceDetail; Accounting BillDetail; research §16.

**Needs:** PE-01; PE-18.

### Forms (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Settings/Forms` → Shared/SurveyForms (Commons owner; crosscut §2) | form list and builder | People purposes: interview scorecard, review, training assessment, exit interview; organization | build, publish to assigned respondents only, read responses by reviewer scope; no public links for private assessments | private questionnaires |

As built, Shared/SurveyForms and its three companion screens answer Customer Service alone (impl-people F51). People is the second app to mount them, so People makes the survey builder work for a second app (decided Nov 11, 2026; impl-people §4, P16): the four screens take their context from the mounting app's registration, with Customer Service's the first, the form definition services move from case feedback to `mantle.party.FormDefinitionServices`, and the People purposes go to assigned respondents only. Marketing adds its registration, the public purposes and the publication services (`mantle.party.FormPublicationServices`) after.

**As built (impl-people P16).** The four shared screens read the mounting app's registration (`service/ironstone/shared/SurveyApps.js`: the purposes, the list, create, get and change services, the condition-values and responses services, the edit capability, the routes and the words); Customer Service's is the first, its screens' text and specs unchanged; People's mounts `People/Settings/Forms` and `Settings/FormDetail` (the People administrator's tab) over `mantle.party.FormDefinitionServices` (`find#Forms`, `create#Form`, `get#Form`, `rename#Form`, `save#FormField`, `save#FormCondition`, `end#FormPart`, `publish#Form`): a form of one of People's four purposes (interview scorecard, review, training assessment, exit interview) of an employer in the administrator's scope. A purpose's registration (`mantle.party.FormPurpose`) names its permissions (People's: PEOPLE_CONFIGURE edits, the purpose's People view permission reads), its organization scope service and its publication access kinds: People's admit none, so a People form has no publication and its invitations no link (`FormPublicationServices.open#Publication` refuses `PUBLICATION_NOT_OFFERED`, `ExternalAccess` makes no link). Its responses are read through the People service of their record (the scorecard's `get#Application`); People mounts no responses screen. The exit-interview link of a checklist step is not built yet (impl-people P16's findings). P19's review: the training assessment's registration also admits `PEOPLE_DEVELOP_EDIT` (an edit or view permission may be a comma list), and the registration's Development mount puts the builder for that purpose alone under Skills & training › Assessment forms, the learning administrator's.

**Source:** Shared/SurveyForms; Customer Service FeedbackForms/FeedbackFormDetail reference; research §16; review R-PPL-W03.

**Needs:** PE-01; PE-18.

### Chatter (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/Chatter` → Commons §15 Chatter; crosscut §3.14 | the host's conversation | the canonical People host and its privacy class; visibility follows that class and the host's participants, never broad Party visibility | log note, message participants, mention participants only | the HR record's own discussion |

As built (impl-people P2): the People root serves its Chatter and RecordFiles panels for People's own hosts only (the employment, `mantle.humanres.employment.Employment`, keyed by `partyRelationshipId`; each later host with its phase); a panel request naming another record is refused (`RECORD_PANEL_UNAVAILABLE`), its notes and files being kept in their own app. `get#RecordLinkInfo` admits the employment and its files to an HR reader of its employer in People's scope only (`check#EmploymentAccess`), for every caller.

**Source:** Commons §15 Chatter; crosscut §3.14; research §16.

**Needs:** PE-01; PE-18.

### RecordFiles (Context passed)

| Mount | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| `People/RecordFiles` → Commons §9 RecordFiles; crosscut §3.14 | the host's files | the canonical People content host (review Y9: application, employment, leave request, payslip, qualification, review) and its protected purpose | upload, preview and download with the host's authorization; no public sharing: RecordFiles shares nothing, and an HR host has no Records-drive folder for Files to share (impl-people F66) | HR evidence on its own record |

As built (impl-people P2): the employment's files are `EmploymentContent` rows (`create#EmploymentContent`, an HR editor of the employer), in RecordFiles' content types and `get#RecordLinkInfo`'s content map, with no Records-drive folder. As built (impl-people P18): a qualification's files are `PartyQualificationContent` rows (`DevelopmentServices.create#QualificationContent`: the person while it waits or was rejected, an HR editor of an employer of theirs), read by the person and HR alone (`check#QualificationAccess`, in `get#RecordLinkInfo`'s visibility branch for every caller), never development, a manager or a staffing reader; the panel's record title is the person and the kind, never the number; a self-service employee opens People's panel by its own grant (`BOSS_PPL_FILES_SELF`).

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
| Lifecycle actions, checklists, equipment and grievances | HireEmployee, EmploymentChange, ChecklistTemplates (on the shared process engine), WorkItemDetail, Employee360 AssignedEquipment, EquipmentDetail with one return task per assignment at separation, Grievances and restricted RequestDetail. |
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
| Reports and settings | Reports with shipped report definitions, Settings, EmployeeImport (Shared/DataImport), ApprovalPolicies, Lookups, ChecklistTemplates and the domain policy editors. |

### 14.2 Baseline forms and service coverage

Baseline XML paths below are under `mr-marble/screen/SimpleScreens`, except `MyAccount/...`. Shared forms keep their owner’s direct service coverage.

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

Direct existing service calls additionally include `mantle.humanres.EmploymentServices.create#EmploymentSalary` (extended guard), `mantle.work.TimesheetServices.get#TimesheetSummary`, `mantle.work.ResourceServices.get#PartyCapacity` (extended schedule source), `mantle.work.TimeServices.import#TimeEntryCsv` and `mantle.account.InvoiceServices.create#ProjectExpenseInvoice` (extended with employer authorization and self scope). The review fixes add `mantle.work.TimesheetServices.send#MissingTimeReminders` (MyTeam, Timesheets), `mantle.work.ResourceServices.find#StaffingCandidates` (SkillsMatrix), `mantle.product.AssetServices.replace#AssetPartyAssignment` (EquipmentDetail return), `mantle.work.EventServices.store#WorkEffortReminders`, `send#EventInvitations` and `get#NextBusinessDay`/`get#FutureBusinessDay` (leave, training, interviews), `mantle.work.TaskServices.update#Task` and `set#TaskStatus` (the CalDAV path), `mantle.humanres.RateServices.create#RateAmount` and `update#RateAmount` (Rates), `org.moqui.call.CallServices.create#CallLink` (interviews) and `org.moqui.agent.AiTaskServices.run#Extract` (receipts). The inherited time mounts use their existing `find#TimeEntries`, `store#TimeEntry`, `delete#TimeEntry`, `find#Timesheets`, `get#PartyWeek`, `get#PartyTimesheet`, `submit#Timesheet`, `approve#Timesheet`, `return#Timesheet`, `reopen#Timesheet` and timer services. Proposed domain APIs and internal legacy helpers are distinguished in §16.2 and the §8.4 disposition table; a legacy payroll service mentioned for comparison is not marked as a designed screen call.

### 14.3 Acceptance walkthroughs

The scenarios each part must satisfy. Core payroll scenarios use synthetic non-statutory rules; real-jurisdiction cases need the chosen localization.

| Scenario | Required result |
| --- | --- |
| Hire, complete a legacy relationship and rehire | Exactly one Person and appropriate Employment per transaction; no duplicate PrtEmployee link; rejected overlapping employment; rehire retains previous employment and payroll history; login optional. |
| Transfer, manager change and separation | Dated assignments and seat occupancy remain coherent; hierarchy cycles and stale writes fail; final-pay/tasks and access requests are independently visible; another active employment is respected. |
| Confidentiality across every path | Self, manager, recruiter, interviewer, payroll and finance receive only their fields/records. Negative cases use valid IDs/parameters. Direct service/entity APIs, files/preview, Chatter, search, counts, exports, Assist and invoice/payment/GL drill-down cannot reveal protected data. |
| Pay rates and phones | A project manager with `TIME_ENTRY_RATE` and no PAYROLL_VIEW sees contractor rates but no employee pay rate in time entries, staffing candidates or exports; a phone's Tasks collection lists no offboarding, separation, grievance-linked or goal task, and completing an onboarding task from a phone runs `set#TaskStatus`. |
| Separation and equipment | A separation raises one return task per current AssetPartyAssignment; ending the assignment from EquipmentDetail completes the task; Admin's access end carries the operation key and the IT task shows its outcome. |
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

Implement privacy/access and complete employment first, then organization/positions and shared self-service; add schedules/leave/attendance over existing time; add components/assignments/inputs, calculation and independent result identities; finish Accounting/privacy/source-consumption integration before any live payroll. Recruiting, development and reviews can proceed on the common employment/approval foundation.

Release 1 ships the native payroll engine in preview mode (§8, decided Nov 1, 2026). Live finalization is enabled per pay group only when a chosen, maintained localization covers it and Accounting's payroll-origin projection (review Y7) is in place; production activation also needs migration reconciliation and acceptance of the supported operating scope. PayrollExchange's external processing is the live path for a group with no localization, once the payroll-origin projection is in place: its live results are gated on that projection as finalization is. People builds the projection (AC-23, impl-people P27), and the build itself stays generic, with no country localization (§8; impl-people §4, Nov 11, 2026). No payroll UI enables the legacy destructive services as a temporary shortcut.

## 15. Documents and outputs

All print documents use `html-print` and the existing PDF tool. Issued documents store their rendering timestamp and canonical record link; later downloads preserve the issued statement rather than silently re-rendering changed policy. Locale, language, currency and timezone come from authorized organization/user settings.

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Employment/offer and lifecycle letters | html-print/PDF; restricted delivery | OfferDetail, EmploymentChange | Frappe Job Offer; record document templates; as built (impl-people P17) one template in Mantle (`Letters.js`): the offer letter (`People/Staffing/OfferLetter`'s preview) and an applied change's lifecycle letter (`People/Employees/EmploymentLetter`'s preview), each rendered once when issued and stored as an `EmploymentLetter` (its PDF, or its html-print page where the server has no PDF engine), read from storage after; an offer letter holding pay is read with PAYROLL_VIEW alone. Delivery as built (P17 review, the user's calls of Nov 12, 2026): an issued offer's letter is emailed to the applicant as an attachment (`send#OfferLetter`); the person reads their own issued lifecycle letters in SelfService's My letters |
| Employee directory | scoped CSV/XLSX/print | Employees | public directory projection only; as built (impl-people P2) the list's CSV, the same projection as the list, every row up to 2000 |
| Badge | print with revocable opaque token as a QR or barcode (`ec.resource.barcodeSvg`) | Employee360; kiosk provisioning | Odoo employee badge; framework barcode support; never tax ID or reusable login password; as built (impl-people P30, follow-up 4) Employee360's Print badge posts, with the page's session token and in a window of its own, to `People/Employees/BadgePrint`'s print, which answers the printable badge: the employer, the person, the badge's number as a Code 128 barcode and in groups of four, made then, once, by the badge's issuer within 15 minutes of the issue and kept only as its hash; a GET of BadgePrint makes nothing (it says when the badge was printed, or refuses), so a link from another site spends no badge; so a lost badge is revoked and another issued; there is no reprint: issuing again is the reprint (the user's call of Nov 12, 2026); the PIN is the worker's, set in SelfService, and never printed |
| Interview invitation | iMIP invitation with the call link; `.ics` | ApplicantDetail, InterviewsCalendar | `mantle.work.EventServices.send#EventInvitations`; Commons EventDetail |
| Leave decision/balance statement | notification; PDF/CSV | LeaveRequestDetail, LeaveBalances | Frappe leave ledger; Commons domain notifications |
| Shift/attendance/timesheet | PDF/CSV/XLSX | ShiftRoster, Attendance, shared TimesheetDetail | Frappe roster; Projects TimesheetPrint; as built (impl-people P14) the roster print `People/Time/ShiftRosterPrint` (html-print, a person and day table a week, as of now), with Attendance's CSV (P13) |
| Payslip | issued restricted PDF and authenticated availability notice | PayslipDetail | Frappe salary-slip layouts; historical Mantle check stub; as built (impl-people P26) Mantle's `PayrollResults.js` renders a final slip's statement once when issued (`issue#Payslip`), as the person reads it (their lines by group with how each was worked out, the totals, the year to date, a correction's original and reason), stores it as its PDF (its html-print page where the server has no PDF engine) on the slip and serves it after from storage (PayslipDetail's and MyPayslip's Download statement); the person is told on `PayslipIssued`, direct only, a title naming the employer and the period, never an amount, nothing attached; a preview slip is never issued |
| Payroll register and reconciliation | restricted CSV/XLSX/PDF | Reports, PayRunDetail | Frappe salary register; historical CheckReceiptRegister template |
| Payment/bank files | Accounting-owned output, link only | PayRunDetail settlement | Mantle PaymentRun/Nacha/PositivePay services where supported; no second People exporter |
| Statutory statement/file | later localization output | PayrollStatements | validated localization; historical PayrollDocumentServices reference only |
| Expense claim and receipts | PDF; scoped evidence bundle | ExpenseClaimDetail | MyAccount expense invoice; Frappe Expense Claim |
| Qualification/training completion | restricted certificate/PDF | TrainingDetail, Qualifications | Carbon qualifications; Frappe training results; as built (impl-people P19) the completion certificate issued once by the passing assessment (Mantle's template `TrainingCertificate.print.html.fancy`), stored then as its page and PDF on the place (`PersonTraining.certificateHtmlLocation`, `certificateLocation`) and shown as stored by `People/Development/TrainingCertificate` (html-print) and TrainingDetail's PDF, to the person and development and HR readers of the employer; no score, answer or evidence on it |
| Review release | restricted PDF and availability notice | ReviewDetail | Frappe appraisal; no private manager notes in employee copy; as built (impl-people P20) rendered once when the review is released (Mantle's template `ReviewRelease.print.html.fancy`: the person, cycle, reviewer, overall rating, the self and reviewer's assessments with their form answers, the feedback only when the template shares it, never a private note), stored as its page and PDF on the review (`PerformanceReview.releaseHtmlLocation`, `releaseLocation`) and shown as stored by `People/Performance/ReviewRelease` (html-print) and ReviewDetail's PDF, to the person, the reviewer and development readers of the employer; the person is told (PeopleReviewUpdate) |
| Employee/employment setup import | staged CSV/XLSX preview/commit through Shared/DataImport | EmployeeImport | Frappe employee import; Admin §11 DataImport; PE-19 target adapter |
| Time/attendance import | staged CSV/device records | TimeImport | Mantle time imports; Frappe check-ins |
| Payroll history/provider exchange | manifest plus CSV input/output and row-result file | PayrollExchange | Odoo work-entry export; Mantle historical external pay; as built (impl-people P28) an export's CSV written through Admin's export target `payrollExchangeInputs` and stored with its JSON manifest (rows, employees, totals, source keys, the file's SHA-256), downloaded from the exchange, never made again; an import's row results are the exchange's rows (the problems as CSV) |

Exports are jobs when bounded synchronous output would be too large, use short-lived authorized downloads, and recheck access at retrieval. Salary files, resumes, reviews and grievance evidence cannot be publicly shared through generic RecordFiles links. Delivery notifications carry safe labels and record links, not pay amounts, medical reasons or confidential subjects.

## 16. Framework and data needs

### 16.1 Needs register

All additions below were proposed; they are built (impl-people P1–P30, Nov 11–13, 2026), PE-01's employee pay-rate masking with the seeded PAYROLL_VIEW and PAYROLL_EDIT and the CalDAV write path of review Y1 first (Mantle fix, Nov 1, 2026), PE-21 and PE-09's decimal evaluator in the framework (P12, P22) and PE-22 by Admin P18. Later (impl-people §7): talent tags (PE-04), travel requests (PE-13), statutory statements and live finalization, which wait on a real localization (PE-10, PE-12), and an image or OCR input for reading a receipt from a photo (PE-13, a framework ask). Business records, domain validation, money and approval decisions belong to Mantle; BOSS supplies access context, screens and app-specific presentation. Existing services are extended where their semantics match. No BOSS pass-through service layer or second HR copy of Party/Invoice/WorkEffort is introduced. Each need is also registered in crosscut §7.5.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| PE-01 People access and confidential projections | service type, data model, seed data | Scoped domain permissions; protected HR host/content and payroll-origin financial links; explicit participant checks; employee pay-rate masking (review Y2: PAYROLL_VIEW to read, PAYROLL_EDIT to set; built, Mantle fix of Nov 1, 2026); CalDAV task exposure (review Y1: the write path through `update#Task` and `set#TaskStatus` built; leaving tasks out of the Tasks collection still to build); a content entity per HR host (review Y9: proposed `EmploymentApplicationContent`, employment content keyed by `partyRelationshipId`, and content for LeaveRequest, Payslip, PartyQualification and PerformanceReview) registered in `mantle.party.CommunicationServices.get#RecordLinkInfo` (an entry in its content map and a visibility branch by People's scope) and in RecordFiles' content types, with no Records-drive folder (impl-people F66: there is no purpose flag; this is the protection) | All screens, shared mounts, files and financial drill-down | Check organization/self/team/participant and field category at read/write; restrict generic entity access and every alternate output; no broad Party grant leaks child HR data; offboarding, separation, grievance-linked and goal tasks stay out of the CalDAV Tasks collection. |
| PE-02 Employment lifecycle | data model, service type | Dated EmploymentAssignment; guarded PeopleServices hire/change/history; extend EmploymentServices salary access; narrow `create#Employment`'s overlap check to `PrtEmployee`; `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd` called by the mr-boss tx-commit SECA on `hire#Employee` and `apply#EmploymentChange` (Admin ADM-LIFECYCLE; review Z3); one equipment return task per AssetPartyAssignment at separation (review Y6); checklists on MT-03 (review Y5), of which People builds the two policy records in minimal form, `store#ProcessStep`, `instantiate#WorkProcess` and its own non-guarding policy, and Maintenance extends them (§4; impl-people §4) | Employee360, HireEmployee, EmploymentChange, checklists, EmployeeImport | Reuse identities; atomic employment/assignment write, optional account, idempotent post-commit tasks and lifecycle calls keyed by party, organization, employment, grant proposal and operation key; the default proposal is `BOSS_USERS` and `BOSS_PEOPLE_SELF`; a return names the receiving custodian and a Mantle rule on the assignment's end completes its task; effective history and rehire preserved; a contractor relationship does not block a hire. |
| PE-03 Organization and positions | data model, service type, seed data | OrganizationServices (units, `OrgTeam` teams and `PrtMember` membership, review Y4); PositionServices extensions; proposed `EmplPosition.departmentPartyId`; dated seat/requirement guards; HR lookup seeds | OrgStructure, OrgChart, job classes, positions, grades; Maintenance Teams and Projects read teams | Cycle/occupancy/organization/date validation; department rolls up to the employer; planned-position approval; computed vacancy; salary bands do not rewrite pay. |
| PE-04 Recruiting and offers | data model, service type, seed data | JobOpening, EmploymentOffer, application opening/event/form links using the existing `referredByEnumId` and `referredByPartyId`; Applicant role and status flow; RecruitingServices; talent tags (`later`) | Openings, ApplicantPipeline/Detail, OfferDetail, InterviewsCalendar, TalentPool | Approved positions feed openings; private panel/scorecards; interviews are Events with a CallLink; accepted offer consumed once into hire; no obsolete requisition sketch. |
| PE-05 Attendance and kiosk | data model, service type, seed data | AttendancePunch, AttendanceDay/correction; kiosk identity (badge tokens and PINs) over the PE-22 device credential; AttendanceServices | SelfService, Attendance, ClockingKiosk, TimeImport; Maintenance TechnicianKiosk and the Manufacturing shop floor reuse the identity | Raw evidence immutable, duplicate key guarded, corrections approved, online kiosk identity minimal by badge `scan-input` and PIN; geo off by default. |
| PE-06 Working schedules and capacity | data model, service type | WorkingSchedule/Line, dated assignments, ShiftAssignment; ScheduleServices; extend ResourceServices and TimesheetServices | schedules, roster, leave, Projects capacity | People schedule before existing fallback; holidays/leave once; timezone/DST/cross-midnight handling; no capacity fork. |
| PE-07 Leave entitlement ledger | data model, service type, seed data | LeaveType/Policy/Assignment, LeaveRequest/segments, LeaveAllocation, LeaveLedgerEntry, accrual rules, blocked and mandatory intervals; LeaveServices | Leave screens, SelfService, HoursForPay | Ledger/reversal and request IDs; concurrency-safe balance/reservation; idempotent accrual; holiday-aware duration; blocked days refuse or warn; calendar/pay input projections carry source IDs and leave-start reminders. |
| PE-08 Pay configuration | data model, service type, seed data | PayrollComponent/terms/account mappings, PayrollStructure/Component, PayrollAssignment, PayrollGroup; PayrollSetupServices | compensation, components, structures, assignments, groups | Effective configurations; salary/rates remain their existing records; guarded formula terms and readiness; no implicit country/currency. |
| PE-09 Pay input and calculation | data model, service type, tool | PayrollInput/Source (a sales commission is one source type, review X16); PayrollInputServices; source-consumption guards in time/invoice writers; the decimal formula evaluator as a framework tool, proposed `org.moqui.impl.ExpressionServices.validate#DecimalExpression` and `evaluate#DecimalExpression` | HoursForPay, PayAdjustments, PayRunDetail, PayComponentDetail | Approved authoritative inputs; component dependency/unit checks; explanation and decimal rounding; worker invoice/payroll collision prevented. The evaluator parses a declared grammar over named decimal inputs with an allowlist of functions, has no ExecutionContext, entity, I/O or service access by construction, and computes in exact decimal; Mantle keeps formula records, units, dependencies and rounding stages. |
| PE-10 Payroll runs and results | data model, service type, seed data | PayrollRun/Employment, Payslip/Item, derived accumulators; PayrollRunServices and PayrollResultServices | PayRuns, Payslips, correction flows | Independent IDs, per-worker transactions/retry, stale approval protection, same-day off-cycle, immutable final results and linked corrections; finalization creates obligations only for a live-enabled pay group (§8 Release 1). |
| PE-11 Accounting handoff | data model, service type | PayrollObligation links; native Invoice/Payment/PaymentRun extensions; uses Accounting's AC-23 payroll-origin projection (review Y7), which impl-people P27 builds as an owner contract following design-accounting | PayRunDetail, InvoiceDetail, ExpenseClaimDetail | One obligation per source/payee bucket; finance release only after complete run; native posting once; preserve source dimensions and settlement states; live finalization and PayrollExchange's live external results off until AC-23 lands. |
| PE-12 Payroll localization | data model, service type, seed data | Dated PayrollTaxProfile and localization registration/coverage; PayrollLocalizationServices interfaces | PayAssignments, PayGroups, PayrollStatements | Curated calculation/report modules and declared bases; unavailable statutory coverage blocks live finalization; historical fixtures never auto-activate. The build ships the synthetic demonstration localization only; a real deployment needs a localized configuration and, in some cases, service changes (§8.4). |
| PE-13 Expenses and advances | data model, service type | ExpenseClaim extension/decisions/reservation; EmployeeAdvance references; ExpenseServices; `create#ProjectExpenseInvoice` gains employer authorization, self scope and the ExpenseClaim write (it already needs no project); travel requests (`later`) | claims, advances, Accounting ExpensePosting, TravelRequests | Manager approval distinct from InvoiceApproved; original invoice settled once through AP or payroll; advance applications reconcile; receipt values proposed by `run#Extract` and reviewed before save. |
| PE-14 Skills and qualifications | data model, service type, seed data | Refined PartyQualification (identity-document and work-permit types with required expiry), TrainingClass, PersonTraining, PartyResume (resume lines); proposed `PartySkillEvaluation`; `EmplPositionClassSkill.minimumLevel`, `requiredFlag`, `fromDate`, `thruDate`; `WorkEffortSkillStandard.minimumSkillLevel` (shared with MT-03); DevelopmentServices including `check#Qualifications` | SkillsMatrix, Qualifications, Training, Employee360; staffing in Projects, Manufacturing and Maintenance | Verified evidence, validity dates, evaluation history, source-linked training grant; no private certificate data in staffing responses. |
| PE-15 Domain approval policy | data model, service type, seed data | PeopleApprovalPolicy and explicit decisions; PeopleApprovalServices; the approval topics of §12 seeded in Mantle, each beside its decision service and with the phase that builds it (impl-people §4, F42) | People Approvals, leave/expense/pay/recruiting actions | Dated routing with alternate, no self-approval, source revision and per-step outcomes; domain action rechecks authority; independent bulk failures. |
| PE-16 Reviews and goals | data model, service type, seed data | Refined PerformanceReview/Item/Note, ReviewCycle/Template; WorkEffort goal metrics; proposed `WepGoal` purpose; ReviewServices | review cycle/detail, Goals | Participant/step visibility, controlled release and acknowledgment; goals remain WorkEffort and stay out of CalDAV, Today and project rollups; private notes never public Chatter. |
| PE-17 People outputs and reporting | service type, render mode | PeopleReportServices, restricted print templates, stored issued PDFs and export jobs | Reports, payslips, offers, claims and reviews | Scoped projections, declared denominators/currencies, historical rendering and access-checked download. |
| PE-18 Shared mounts and shell providers | shell item, service type, seed data | Employee360/PeopleSelfService registry; the Today, quick-create, palette (rows with `recordEntity` and `recordId`) and notification providers of §1.4; topic push policy; shared form/calendar/content contexts; the survey builder's per-app context registration and `mantle.party.FormDefinitionServices`, which People builds as the second app to mount it (§13 Forms) | Commons, Projects, Maintenance, Insights, Accounting and People | Context narrows but grants no authority; Commons owns personal area and forms; private content stays on canonical sensitive host; payroll, review and grievance topics have lock-screen-safe titles. |
| PE-19 Imports and migration | data model, service type | Transfer targets registered with Admin §11 (the `rows`-mode target `employees`, its row services over `preview#Hire` and `hire#Employee`; TimeImport and PayrollExchange as `wizard`-mode targets with their own wizards, batches and `findService`, review Z2; the payroll exchange export as a `file` target); the import permission `PEOPLE_IMPORT` with People's own permissions and no `ADMIN_*` permission (§1.1); PayrollExchange manifest and source mapping | EmployeeImport, TimeImport, PayrollExchange | Preview/reconcile/approve; independent row outcomes and source-key replay; historical import never creates obligations or doubles opening balances; no People-owned import batch where Admin's or the owner's exists. |
| PE-20 HR visual screens | Vue component | SkillsMatrix `.qvue` matrix; ShiftRoster over the shared resource-lane timeline (crosscut M11, one component with Manufacturing's ProductionSchedule) | SkillsMatrix, ShiftRoster | Bounded/pageable data; keyboard/list action parity; no graph/drag-only mutation or private overfetch. OrgChart uses the built `view-tree` and needs nothing here. |
| PE-21 Per-field AI opt-out | XML Form element | Framework attribute on a field or screen that turns off inline text actions, dictation and Update with AI there, or routes them to a local model (crosscut CX-ASSIST) | Grievances, grievance RequestDetail, ReviewDetail, LeaveRequestDetail reasons, ApplicantDetail scorecards | Text in an opted-out field never reaches a remote model; the m-rich-text toolbar hides the actions; Assist's screen and data tools respect it. People's "Assist cannot reveal" acceptance depends on it. As built (impl-people P12, mr-moqui; docs/ai/Assist.md "AI opt-out"): `ai-opt-out="true"` on a form field, a section, a screen and an entity field; LeaveRequest's reason and LeaveRequests' and LeaveRequestDetail's reason fields carry it. Routing to a local model is not built. |
| PE-22 Shared-device credential (see Admin ADM-DEVICES) | data model, service type | The framework device credential and `org.moqui.admin.DeviceServices` register, find and revoke, owned by [Admin ADM-DEVICES](design-admin.md#17-framework-and-data-needs) (crosscut CX-DEVICE); People registers its kiosk route group and owns kiosk identity (PE-05) | ClockingKiosk (gated on it); Maintenance TechnicianKiosk | One need with ADM-DEVICES, listed here only as People's dependency: a device signs in without a person's password, only its route group is reachable, and badge and PIN identify the person per action (Nov 1, 2026). |
| PE-23 Labor costing rate | seed data, service type | RatePurpose `RaprCost`, the one labor costing purpose, on `RateAmount` by `emplPositionClassId` and `workTypeEnumId`, maintained by Accounting (crosscut §8) and read by People; proposed `mantle.humanres.RateServices.get#CostingRate` | Rates (read-only); Projects money reports; Maintenance MT-08 and MaintenanceCostReport; Manufacturing labor cost | Resolves the most specific dated cost rate for a class and work type; never reads a person's `vendorHourRate`; hours with no costing rate report as unpriced. Projects' cost reports switch in its owner's later work; until then Projects money totals keep today's basis (review Y2). `RaprCost` is the one labor costing purpose: impl-people P10 seeds it, builds `get#CostingRate`, and moves Manufacturing's built `RaprProductionCost` rows and lookup to it; Maintenance reads `get#CostingRate` only (Nov 11, 2026). As built (P10): `get#CostingRate` (a class and work type, or a person's class, at a date; no organization, currency or rate type narrows it, as Manufacturing's lookup), `find#`, `store#` and `end#CostingRate` (finance administration, `ACCOUNTING_ADMIN`; a change ends the row in effect), `migrate#ProductionCostRates` (the old purpose's rows moved on a load and the value removed). As reviewed (the user's call of Nov 11, 2026): a row carries an optional organization (`RateAmount.organizationPartyId`), `get#CostingRate` prefers the employer's rows (the organization given, else the person's employers at the date) and then the shared ones, and `find#`, `store#` and `end#CostingRate` and `create#`/`update#RateAmount` scope the rows by organization as Accounting scopes finance administration, a shared row changed only working for every organization (design-accounting §15). |
| PE-24 People stack contributions | seed data, shell item, service type | `EmailRuleAction` `createApplication` and `createExpenseLine` with proposed `RecruitingServices.create#ApplicationFromEmail` and `ExpenseServices.create#ClaimLineFromEmail`; `skill/people-*.md` and `skill/aliases.json`; `assist-prompt` and `response-action` providers; `AgentToolExposure` rows (exposeMcp N); `record-lookup` and `create-from` providers; projected CalDAV collections answered by People services; `report/people-*.json` with alert templates | §1.4; Openings, ExpenseClaimDetail, TeamCalendar, InterviewsCalendar, Reports | Each contribution goes through the owner service and its checks; a projected collection is read-only; intake mail text is untrusted. Needs crosscut's projected calendar kind in `get#DavCollections` (CX-SYNC), which People builds first, generic over an owner service; Maintenance's and Marketing's collections register on it (impl-people §4, P12). |

No new protocol, PDF engine, general approval inbox, calendar store, survey engine or task system is required. Shared questionnaire ownership is Commons, with the existing Customer Service form design as the initial pattern; People must register any private-response access extension before using it. The decimal formula evaluator is a framework tool (PE-09), decided now (review R-LV-N20) because its safety must hold for user-written text whatever script engine runs Mantle, its arithmetic must be exact decimal (script numbers are binary floats), and pricing, commission and Insights measures can reuse it.

### 16.2 Proposed interfaces and invariants

The form tables name the intended operations; this table fixes the service-family contracts. All domain prefixes below are `mantle.humanres`, except the existing `mantle.work` capacity/time and `mantle.account` financial APIs; all are proposed. XML Actions handle entity/service orchestration; complex calculation, scheduling, CSV and reporting can use per-area script modules as the application practices prescribe.

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

Expected independent failures run in separate transactions with isolated message/error state, as [Services](../../../../../docs/logic/Services.md) describes. Strictness remains at the employee’s pay transaction, balance reservation, security check and financial integrity boundary. File/worker iteration logs the source identity and continues; a failed job does not clear another worker’s successful result. Operation keys identify actual business attempts and source facts, not caller names or random client retries.

## 17. Decided

| Decision | Notes |
| --- | --- |
| Full People design on Mantle | All research candidates are accounted for in §14.1, with concrete screens, forms and model/service needs. |
| Payroll release 1 (Nov 1, 2026; user decision on review R-PPL-15) | The native payroll engine and its screens stay first-release (`new`) and ship in preview mode. Live finalization is enabled per pay group only when a chosen localization covers it and Accounting's payroll-origin projection (Y7) exists; PayrollExchange external processing is the live path for a group with no localization, gated on the same projection (§8, §14.4; Nov 11, 2026 below). |
| Sync writes go through services (Nov 1, 2026; review Y1) | A phone's change to a task goes through `TaskServices.update#Task` and `set#TaskStatus` (Mantle fix in this pass). Offboarding, separation, grievance-linked and goal tasks are left out of the CalDAV Tasks collection; onboarding and training tasks appear with sanitized names. |
| Pay rate vs labor costing (Nov 1, 2026; review Y2) | Reading an employee's pay rate needs PAYROLL_VIEW and setting it PAYROLL_EDIT (Mantle fix in this pass); `TIME_ENTRY_RATE` keeps client rates, contractor rates and project money. Labor cost uses class and work-type costing rates (PE-23), the remaining work. |
| Team model (Nov 1, 2026; review Y4) | A team is an Organization with the `OrgTeam` role and `PrtMember` relationships, written by People OrganizationServices; Maintenance and Projects read it and add dispatch defaults. |
| Checklist engine (Nov 1, 2026; review Y5) | Lifecycle checklists are template WorkEffort trees instantiated by `ProcessServices.instantiate#WorkProcess` (MT-03) with a People policy, under a `WepPrOrgMgmt` lifecycle root with no documentation space. People builds the part of MT-03 it needs and Maintenance extends it (Nov 11, 2026 below). |
| Separation and equipment (Nov 1, 2026; review Y6) | Employee360 gets AssignedEquipment; separation raises one return task per current AssetPartyAssignment; the custodian ends it with `replace#AssetPartyAssignment` from EquipmentDetail, naming the receiving custodian; a Mantle rule on the assignment's end completes the task (impl-people F52). |
| Payroll-origin restriction (Nov 1, 2026; review Y7) | Accounting owns the payroll-origin projection over its built screens, search and exports as an Accounting need; payroll finalization stays off until it lands. People builds it (Nov 11, 2026 below). |
| Technician qualification (Nov 1, 2026; review Y8) | Maintenance consumes `check#Qualifications` and People-extended `get#PartyCapacity`; Projects StaffAllocation and Manufacturing may adopt `check#Qualifications`. As built (impl-maintenance P8, Nov 12, 2026): a work effort's skill standard names the qualification that proves it (`WorkEffortSkillStandard.qualificationTypeEnumId`), which `check#Qualifications` reads with its level; Maintenance's dispatchers, who hold no People reach, get the same staffing answer through Development.js `staffingAnswer` after Maintenance's own check. |
| HR files (Nov 1, 2026; review Y9) | A content entity per HR host (application, employment, leave request, payslip, qualification, review), registered in `get#RecordLinkInfo` with a protected purpose (PE-01). |
| Imports (Nov 1, 2026; review Z2) | Employee import mounts Shared/DataImport with Admin §11's `employees` target; TimeImport and PayrollExchange keep their wizards and register as targets. People's own import preview and result forms are dropped. The targets' permissions are People's (Nov 11, 2026 below). |
| Account lifecycle (Nov 1, 2026; review Z3) | A proposed mr-boss tx-commit SECA on Mantle `PeopleServices.hire#Employee` and `apply#EmploymentChange` calls `ironstone.admin.LifecycleServices.request#Provisioning` for a hire and `request#AccessEnd` for a separation or employer change (Admin §4.1), keyed by party, organization, employment, grant proposal and operation key; the IT checklist task carries the operation ID. |
| Organizations vs departments (Nov 1, 2026; review Z6) | Admin Organizations lists `OrgInternal` parties only; departments and teams stay with People. |
| Employee360 per-app rows (Nov 1, 2026; review Z10) | Employee360's context table drops Admin and adds Insights (read-only) and Maintenance (custody and qualification). |
| Stack contributions (Nov 1, 2026; review L1–L9) | §1.4: Assist skills and prompts with HR, payroll and grievance services at `exposeMcp` N; Comms hooks with no HR transcripts without `speech-local`; projected calendars; `createApplication` and `createExpenseLine` mail intake; shipped report definitions and alerts; ClockingKiosk on the device credential (PE-22); interviews as Events with a CallLink. |
| Decimal evaluator (Nov 1, 2026; review R-LV-N20) | Framework tool, not Mantle script (PE-09): exact decimal arithmetic and a sandbox that holds by construction. |
| Positions and departments (review R-PPL-09) | `EmplPosition.organizationPartyId` is the legal employer; proposed `departmentPartyId` carries the department, checked to roll up to the employer. |
| Grievance automation (review R-PPL-01) | `RequestTriageNotice` and `WorkEffortRequestFromWork` are conditioned: the HR-confidential type is never triaged and never completed from linked work (§4 Grievances, §8.3). |
| Goals purpose (review R-PPL-16) | Goals are WorkEfforts with a proposed `WepGoal` purpose, outside CalDAV, Today and project rollups. |
| Reference features added (review §6) | Leave blocked and mandatory days (F02), resume lines on Employee360 (F05), identity-document and work-permit expiry as qualification types (F08), referral source and funnel (W02), exit interview (W03). |
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
| Grievances (research open) | Shared Request with an explicit confidential type/participant policy across every read/write/output. No general HR or manager access; linked tasks do not widen case ACL, never complete the case and never trigger a triage notice. |
| Goals (research open) | Dedicated People goal view over WorkEffort, with typed metrics when needed; reuse tasks and relationships rather than another task system. |
| Attendance and time | Presence evidence is separate from project work; explicit pay source avoids double-counting. Reuse Projects’ weekly approval/locks and capacity contract. |
| Expense approval and reimbursement | Manager decision does not reach InvoiceApproved. One original claim invoice, one settlement route; payroll displays/reconciles its reimbursement without recreating expense/payable lines. |
| Accounting owns money movement | Preserve native invoice/payment automation; no direct payroll journals or period-wide legacy payment actions. Payroll-finance privacy must cover ledger/payment outputs as well as payslips. |
| Dates and documents | Effective rows, audit log and issued PDFs; run, payslip and decision records are independent business facts, not generic snapshot/version tables. |
| Later capabilities | PASS careers, full LMS delivery, roster optimization/swaps, offline kiosk drafts on moqui-browser, advanced industry operations, country statutory packs, provider-specific filing/bank connectors, a graphic org chart, a CardDAV company directory (public work identity only), the talent pool (F06) and travel requests (F09). PayrollStatements, TalentPool and TravelRequests have explicit later screens; the other deferred candidates are not placeholder menu entries. |
| Baseline actions not copied | Arbitrary Party roles/settings/group/account editors stay with their owner applications; worker/customer invoicing remains Projects/Accounting. Legacy payroll processing/reopen/year-end services are not new People form calls. |
| Import permission (Nov 11, 2026; impl-people §4, the user's call) | Each app has an import permission of its own; People's is `PEOPLE_IMPORT`, granted to `BOSS_PEOPLE_HR`. The `rows`-mode `employees` target asks it with PEOPLE_HR_EDIT to import and PEOPLE_HR_VIEW to view; the `wizard`-mode time-and-attendance target names it; neither names an `ADMIN_*` permission, since a target's permissions are all required (§1.1, §6 TimeImport, §12 EmployeeImport). |
| Access for a new hire (Nov 11, 2026; impl-people §4, the user's call) | Provisioning proposes `BOSS_USERS` and `BOSS_PEOPLE_SELF` by default and the account request is optional on ConfirmHire; more is chosen by HR from the bundles HR may grant, under Admin's delegation rules (§1.1, §4). |
| Generic payroll in the build (Nov 11, 2026; impl-people §4, the user's call) | No country localization is built, only the synthetic demonstration localization. A real deployment needs a localized configuration and, in some cases, service changes as well; live finalization, full and final settlement, compensatory leave and overtime follow the first real localization (§8, §8.4, §18). |
| Who builds AC-23; external processing (Nov 11, 2026; impl-people §4, the user's call) | People builds Accounting's payroll-origin projection (AC-23) as an owner contract following design-accounting (impl-people P27). PayrollExchange's live external results are gated on it as native finalization is, since they create the same payroll invoices (§8, §8.3, §8.4, §14.4). |
| One labor costing purpose (Nov 11, 2026; impl-people §4, the user's call) | `RaprCost`, resolved by `emplPositionClassId` and `workTypeEnumId` through `RateServices.get#CostingRate`; Accounting maintains the rates and People reads them. impl-people P10 seeds it and moves Manufacturing's built `RaprProductionCost` rows and lookup to it; Maintenance reads `get#CostingRate` only; Projects' cost reports switch in its owner's later work (PE-23). |
| Process engine split with Maintenance (Nov 11, 2026; impl-people §4) | People, built first, builds `WorkEffortProcessPolicy` and `WorkEffortStepPolicy` in minimal form, `ProcessServices.store#ProcessStep` and `instantiate#WorkProcess`, and its own policy, whose guards-execution flag is false; Maintenance extends the same records and services. The generic task services refuse managed maintenance work and work whose policy guards execution, and leave People's checklist tasks ordinary tasks (§4). `WorkEffortSkillStandard.minimumSkillLevel` is People's too. |
| Survey builder for a second app (Nov 11, 2026; impl-people §4) | People makes the shared survey builder read a per-app context registration and moves the form definition services to `mantle.party.FormDefinitionServices`; People's purposes are private to assigned respondents; Marketing adds its registration and the public purposes (§13 Forms). |
| Approval topics seeded in Mantle (Nov 11, 2026; impl-people §4) | Each People approval topic is seeded in Mantle beside its decision service, with the phase that builds that service, not in Commons' seed (§12 ApprovalPolicies, PE-15). |
| Departments (Nov 11, 2026; impl-people §4) | A department carries the existing `OrgDepartment` role and a `PrtOrgRollup` to its parent, never `OrgInternal` (§4). |
| Projected calendar kind (Nov 11, 2026; impl-people §4) | People builds the projected kind in `get#DavCollections`, generic over an owner service; Maintenance's and Marketing's collections register on it (PE-24). |
| Device credential has one owner (Nov 1, 2026; review L5) | The shared-device credential is Admin's ADM-DEVICES; PE-22 stays only as People's pointer to it, and ClockingKiosk is gated on it. |

## 18. Open

Each item has the answer this design recommends.

- **First operational localization and its maintainer.** No country is chosen, and release 1 ships the native engine in preview mode (§8, decided Nov 1, 2026). Live finalization for a pay group needs both this localization and Accounting's payroll-origin projection (Y7). Recommended: choose one bounded employer and jurisdiction scope with a named maintainer, authoritative rule sources, effective-date updates, certification fixtures and a supported output list; enable live finalization for that scope only, and keep PayrollExchange external processing as the live path elsewhere, once the payroll-origin projection is in place. Decided Nov 11, 2026 (impl-people §4): the build chooses none and stays generic; a real deployment needs a localized configuration and, in some cases, service changes as well.
- **First external payroll connector.** Recommended: begin with the CSV manifest and reconciliation contract, then add a named provider against documented idempotency, result and return handling. Bank files stay Accounting's existing `mantle.ext.account.NachaServices` and `PositivePayServices` through payment runs; People only provides the obligations.
- **Retention and sensitive fields.** Admin owns retention schedules and holds (crosscut §6.4); People supplies the purposes and default periods per record type. Recommended: People seeds purposes for recruitment, leave evidence, identity documents, grievances and payroll, with no country's periods hard-coded; a deployment sets the periods in Admin before importing live applicant, medical or identity records.
- **Advanced agricultural operations and measured scale.** TimeEntry already holds piece counts and client and vendor piece rates. Recommended: collect concrete crew, piece-rate, seasonal, contractor and jurisdiction scenarios before extending the general inputs model, and agree a workload target only when a deployment needs one.
- **Full and final settlement (R-PPL-F01).** Recommended: a settlement view on EmploymentChange for a separation that gathers outstanding advances, the leave balance to pay out, assigned equipment and the final pay input, built when the first localization lands, since leave payout and final pay rules are jurisdictional. Until then ImpactAndConfirm lists the same items.
- **Compensatory leave and overtime from attendance (R-PPL-F03, F04).** Recommended: compensatory leave as a LeaveLedgerEntry grant from approved extra attendance under a leave policy rule, and overtime as typed pay inputs from approved attendance against the schedule, with rates from the localization. Both follow the first localization.
- **Mileage and per-diem rules (R-PPL-F07).** Recommended: a claim-line type with a dated rate times a quantity (distance or days) per employer, in ExpenseClaimDetail; build it in release 1 only if a launch deployment reimburses mileage, otherwise right after.
