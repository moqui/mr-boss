# mr-marble form inventory

Per-form inventory of the mr-marble component, for tracking form-level feature parity in IronStone BOSS.

- Source: `runtime/components/addon/mr-marble/screen/` (current working tree).
- Form: every `<form-single>` and `<form-list>` element, including forms nested in dialogs, sections and includes.
- The **Designed in** column is filled when a design file is reviewed with the IronStone screen path(s) whose forms cover it (`—` when deliberately not carried forward, with the reason in that design's Decided table); the **Implemented in** column is filled during implementation with the screen and form that exist. See [design-doc-guide.md](design-doc-guide.md) §9.
- **Implemented in** was filled on Oct 19, 2026 from the drawers-commons build, by the path of the built screen that carries each form of its **Designed in** cell: a designed screen built as a parent with subscreens is its default subscreen (`Commons/Tasks/List`, `Commons/Requests/List`, `Commons/Contacts/List`, `Comms/Inbox/Mail`); the contact record (`template/ContactRecord.xml`) is on both `Commons/Contacts/ContactDetail` and the main pane of `Commons/Contacts/List`; a space's settings are on `Commons/Knowledge/SpaceDetail`, and a page's attachments are Knowledge's own, not record files; a `—` row stays `—`. Filled: the 101 rows designed with a path (wiki `ClonePage` since Oct 19, Knowledge's Duplicate page), and the 5 `—` rows. The update note and comment forms the design gives to `Shared/Chatter` (`UpdateNoteForm`, the `…CommentUpdate` `ReplyCommentForm`) are Chatter's edit of a note in place (since Oct 19). Rows that other design files are to fill stay blank.
- **Designed in** for [design-projects.md](design-projects.md) was filled on Oct 21, 2026 from that design's §13.1 and the **Derived from** cells of its form summaries, each screen by the path the design gives it: a project's tab is a subscreen of `Projects/Projects/ProjectDetail`, and a screen the design mounts in a tab with the project fixed (WorkItems, Requests, TimeEntries) is listed by its own path. Paths are added after what an earlier design wrote. The rows of the git forms added to SimpleScreens on Oct 20 came with it: `Project/EditRepositories`, `ProjectSummary`'s `ViewGitRepositoryList` and `ViewGitTagList`, `Task/EditSource` and `MyAccount/User/GitAccess` (`Project/GitCommit` has no forms); their **Implemented in** is blank. The My Account expense forms other than the worker invoice stay blank for design-people.
- **Implemented in** for [design-projects.md](design-projects.md) was filled on Oct 22, 2026 at the end of the Projects build (impl-projects.md P11), by the path of the built screen that carries each form of its Projects **Designed in** paths, after what Commons wrote: a section designed as one screen is its default subscreen (`Projects/Projects/List`, `Projects/WorkItems/List`, `Projects/Requests/List`), the project form of QuickCreate is `Projects/QuickProject` (impl-projects.md F8), a tab mounted from another screen keeps the tab's path (`Projects/Projects/ProjectDetail/Time`, `…/Docs`), and the shared screens keep their Projects mount (`Projects/WorkItems/WorkItemDetail`, `Projects/Requests/RequestDetail`). Twelve rows stay blank for the parts impl-projects.md §7 leaves for later: the worker and contractor invoices (My Account's `WorkerInvoice` and Unbilled's worker forms), a manager's clock-in for another person (`PartyTimeEntries` `ClockInForm`), request items (`EditRequestItems`), and wiki pages linked to a work item or a request (`EditWikiPages` on WorkItemDetail and RequestDetail; the Docs tab links pages to a project).
- **Designed in** for the six core app drafts and [design-crosscut.md](design-crosscut.md) was extended on Oct 27, 2026 from their form/service coverage review. New mappings are additive to Commons and Projects; **Implemented in** is unchanged. Proposed services and definitions inside XML comments are not counted as active existing services.
- **Designed in** for the six core designs and [design-crosscut.md](design-crosscut.md) was updated on Oct 28, 2026 after their review ([review-core-apps.md](review-core-apps.md)). Paths of renamed or moved screens are replaced in place (for example `Manufacturing/Boms/BomDetail` → `Manufacturing/BillsOfMaterials/BillOfMaterialsDetail`, `CustomerService/Reports/CsatResults` → `CustomerService/Reports/SatisfactionResults`, `Accounting/GeneralLedger/GlAccountDetail` → `Accounting/GeneralLedger/AccountDetail`, `Accounting/FixedAssets/InventoryValuation` → `Accounting/Inventory/InventoryValuation`). Entries were added where the reviewed designs now carry a form (the Products stock tab, the Accounting cost repair dialogs, BankAccountDetail reconciliation, the Manufacturing notes tab, the handheld pick face). Facility box-type assignment is FacilityDetail only (R-WH-16). The ProductStore and Gateway forms stay blank; Products and Accounting Decided name the apps they are handed to. **Implemented in** is unchanged.

- **PASS design follow-up (Oct 27, 2026):** [design-forum.md](../../mr-pass/plan/design-forum.md) designs new public Forum screens over existing Mailbox services; there are no SimpleScreens Forum forms to map. WikiBlogs/EditWikiBlog remain future Blog/Publishing baselines, with full screen design deferred. Their Designed in and Implemented in cells remain unchanged; shared content ownership is described in Forum §13.3.
- **Implemented in** for [design-accounting.md](design-accounting.md) was filled on Oct 31, 2026 at the end of the Accounting build (impl-accounting.md P21), by the path of the built screen (and form or section) that carries each form of its Accounting **Designed in** paths, after what the earlier Accounting phases wrote; a shared screen goes by its Accounting mount (`Accounting/Receivables/Customer360`, `Accounting/Records/OrderDetail`, `Accounting/Payables/BillDetail/Match`). A form done another way names the screen that does it; a function left for later is `—` with its impl-accounting.md §7 item, and one not built is `—` with what the screen does instead. Party forms designed for Customer360 are other apps' contexts there (§7). Rows that name other apps keep their other paths blank, and rows designed only for the shared Order, Shipment, Return, Equipment and Product screens by other apps stay blank.
- **Implemented in** for [design-warehouse.md](design-warehouse.md) was filled on Oct 31, 2026 at the end of the Warehouse build (impl-warehouse.md P18), by the path of the built screen (and form or section) that carries each form of its Warehouse **Designed in** paths, after what the earlier Warehouse phases wrote; a shared screen goes by its Warehouse mount (`Warehouse/Receiving/ReceiptDetail` and `Warehouse/Shipping/ShipmentDetail` for `Shared/ShipmentDetail`, `Warehouse/Returns/ReturnDetail`, `Warehouse/Inventory/Availability/Summary`, `Warehouse/Inventory/MaterialIssueReceipt`), and a handheld task by its `Warehouse/Handheld/...` mount (the desk screen mounted again, the active facility being Handheld Home's FacilityPicker). A form done another way names the screen that does it; a function left for later is `—` with its impl-warehouse.md §7 item, and one not built is `—` with what the screen does instead (the shipment header, party, payment and email forms; return header and item edits, P14). 36 rows filled here; rows that name other apps keep their other paths as they were.
- **Implemented in** for [design-manufacturing.md](design-manufacturing.md) was filled phase by phase during the Manufacturing build and checked on Nov 4, 2026 at its end (impl-manufacturing.md P17): every one of the 23 Manufacturing forms, and each other section's form with a Manufacturing **Designed in** path, names the Manufacturing screen (and form or section) that carries it.
- **Implemented in** for [design-purchasing.md](design-purchasing.md) was filled phase by phase during the Purchasing build and completed on Nov 4, 2026 at its end (impl-purchasing.md P17): every form with a Purchasing **Designed in** path now names the Purchasing screen (and form) that carries it, or `—` with what Purchasing does instead and the phase.
- **Implemented in** for [design-admin.md](design-admin.md) was filled phase by phase during the Admin build and checked on Nov 11, 2026 at its end (impl-admin.md P19): every form with an Admin **Designed in** path names the Admin screen (and form or section) that carries it, or `—` with what Admin does instead and the phase; the gateway forms by the connection kind's fields in ConnectionDetail (P11), the party forms by OrganizationDetail's and UserDetail's sections (P4, P7). The forms of Tools' Security screens that Admin's Groups, GroupDetail, SignInPolicy and the identity providers derive from are outside this inventory (design-admin §15.2).
- **Implemented in** for [design-commerce.md](design-commerce.md) was filled phase by phase during the Commerce build and checked on Nov 7, 2026 at its end (impl-commerce.md P15): every form with a Commerce **Designed in** path names the Commerce screen (and form or section) that carries it; a shared screen goes by its Commerce mount. [design-shop.md](../../mr-pass/plan/design-shop.md)'s pages are new public screens with no staff form of their own to carry (impl-shop F59), so no row names Shop.
- **Implemented in** for [design-insights.md](design-insights.md) is filled phase by phase during the Insights build: on Nov 7, 2026 (impl-insights.md P3) the SimpleReport builder rows (EditReport, FieldList, FindReport, ViewReport) name the dataset screen and form that carries each; on Nov 7, 2026 (P4) QuickViewReport names the report catalog and SavedReports, which replaced the legacy picker; on Nov 10, 2026 (P7) the MyAccount scheduled finds name Scheduled reports; checked complete on Nov 11, 2026 at the end of the build (P12), when the legacy mapping of design §13.2 was added (a saved find of a replaced list moved by `migrate#LegacySavedFinds` or shown not valid).
- **Implemented in** for [design-maintenance.md](design-maintenance.md) was filled phase by phase during the Maintenance build and checked on Nov 12, 2026 at its end (impl-maintenance.md P20): every form with a Maintenance **Designed in** path names the Maintenance screen (and form or section) that carries it, or `—` with why. The check gave the Maintenance part of rows that named only Warehouse or Accounting: EquipmentDetail's move (Identity) and depreciation (Book, read only); the asset cost, audit and stock ledger forms and FacilityDetail's box type, location and product policy forms stay their owners' (`—`, Maintenance's contexts have no such tab). Dispatch's (P8) and customer repair's (P12) rows are filled by those phases, merged last.
- **Implemented in** for [design-people.md](design-people.md) was filled phase by phase during the People build and checked on Nov 13, 2026 at its end (impl-people.md P31): every form with a People **Designed in** path names the People screen (and form or region) that carries it, or `—` with why (the People P31 note below).
- **Implemented in** for [design-sales.md](design-sales.md) is filled phase by phase during the Sales build: on Nov 13, 2026 (impl-sales.md P3) the Customer, Party and FinancialInfo forms with a `Sales/Accounts/...` **Designed in** path name the Sales screen (and form or section) that carries each, or `—` with why (a role or classification edit, a later parent change, payments).

Products P1 (Oct 28): the shell, guarded read list and minimal product/category record routes are built. Catalog
form-parity cells remain blank until their full P2/P3 editors are implemented; these foundation screens do not claim
that parity.

Accounting P4 mappings name only built receivables forms. Payable, settlement, source-allocation and budget editors remain for their assigned phases; a read-only source tab does not claim their write forms.

**People design (Oct 31, 2026):** [design-people §14.2](design-people.md#142-baseline-forms-and-service-coverage) adds employee/lifecycle, organization, pay-rate, shared work-time and expense mappings to Designed in. Attendance and the new payroll core are proposed workflows, not implementation coverage. Existing mappings and Implemented in remain unchanged; account administration and worker-invoice forms stay with their owners.

**People P10 (Nov 11, 2026):** **Implemented in** of the shared work-time and pay-rate rows ([impl-people P10](impl-people.md#p10--time-mounts-rates-and-labor-costing)): Projects' time screens and Rates mounted under People as they are, so TimeEntries' and EditTimeEntry's forms name `People/Time/MyTime` and `People/Time/TimeEntries`, PartyTimeEntries' list `People/Time/TimeEntries`, and EditRateAmounts' two forms `People/Payroll/Rates` (an employee's pay rate, payroll's; the labor costing rates read only, which Accounting's CostingPolicies edits). PartyTimeEntries' ClockInForm stays blank, as for Projects (impl-projects §7).

**People P8 (Nov 11, 2026):** no baseline form is mapped to SelfService, MyTeam or Home's due work (new screens over new services); the emergency contacts are a People record of their own (a Person per contact linked by a dated relationship, private contact data), not EditParty's relationship form, which stays Commons' for directory parties. Their **Implemented in** is in usl-inventory's People rows.

**People P9 (Nov 11, 2026):** no baseline form is mapped to WorkingSchedules, WorkingScheduleDetail or HolidayCalendars (new
screens over Mantle's new ScheduleServices, design §6 and §7); a person's own weekly hours stay Commons' Preferences
(CalendarServices.store#WorkingHours), which a People schedule overrides in capacity. HolidayCalendars is at People/Time, HR's,
not People/Settings (the user's call of Nov 11 on HR's editors). Their **Implemented in** is in usl-inventory's People rows.

**People P11 (Nov 11, 2026):** no baseline form is mapped to LeavePolicies, LeavePolicyDetail, LeaveAllocations or LeaveBalances
(new screens over Mantle's new LeaveServices, design §7); Marble's HumanRes has no leave form, and the legacy EmploymentLeave rows
are read only, listed as historical leave on LeaveBalances (§5 Q8). LeavePolicies, LeavePolicyDetail and LeaveAllocations are at
People/Time, HR's, not People/Settings (the user's call of Nov 11 on HR's editors, as Holidays). Their **Implemented in** is in
usl-inventory's People rows.

**People P29 (Nov 12, 2026):** no baseline form maps to People's Reports or Settings' Preferences (new screens over Mantle's new
PeopleReportServices and PeopleServices get#Settings and store#Settings, design §12); Marble's HumanRes reports are none to carry
over. Their **Implemented in** is in usl-inventory's People rows, and People's report entries, measures, attention providers,
datasets and flow target are Insights' registries (BossSetupPeopleReportData.xml).

**Maintenance P7 (Nov 12, 2026):** no baseline form maps to the execution checklist (WorkOrderDetail's Procedure tab, StepResponse and ExecutionAmendment are new, design-maintenance §3, §4.3); their Implemented in is in usl-inventory's ProcessServices rows. WorkOrderDetail's Files keep a check's evidence (Mantle's evidence policy); Maintenance mounts WorkItemDetail for a work order's follow-up tasks.
**Maintenance P9 (Nov 12, 2026):** the baseline's run consumption forms (RunProducts, RunConsumed) map to WorkOrderDetail's Parts tab and Maintenance/WorkOrders/MaterialIssueReceipt (Shared, Maintenance's context); the services are in usl-inventory's MaintenanceExecutionServices rows. Accounting's PostingDefaults gains the Maintenance expense mapping kind (MaintenanceCostPolicy, AC-24).
**Maintenance P17 (Nov 12, 2026):** no baseline form maps to the reports (Reports, its Overview, WorkStatusReport and PreventiveComplianceReport are new, design-maintenance §8); their Implemented in is in usl-inventory's MaintenanceReportServices rows, and Maintenance's report entries, measures, attention providers, datasets and flow target are Insights' registries (BossSetupMaintenanceData.xml).
**Maintenance P14 (Nov 12, 2026):** AddPlannedMaintenance is DueMaintenance's generation: a plan's work order is made for its next obligation (MaintenanceOccurrence) with its primary AssetMaintenance, never by writing a future threshold as a meter reading; the job makes the same work.
**Maintenance P11 (Nov 12, 2026):** no baseline form maps to the costs (WorkOrderDetail's Costs tab and MaintenanceCostReport are new, design-maintenance §3 WorkCosts, §8); their Implemented in is in usl-inventory's MaintenanceReportServices rows. The report is at Maintenance/Reports/MaintenanceCostReport.

**Maintenance P13 (Nov 12, 2026):** the baseline's ProductMaintenanceList is Plans and EquipmentDetail's plans pane: a plan of a piece of equipment follows its model's maintenance default (ProductMaintenance), whose values it takes where it names none, without enrolling every piece of equipment of the model; AddPlannedMaintenance stays P14's DueMaintenance (generation).

**Maintenance P8 (Nov 12, 2026):** no baseline form maps to the dispatch (Teams, AssignSchedule's ranked technicians and BulkWork's Assign and Schedule are new, design-maintenance §3, §9 Teams); the run's AddPartyAssignForm and UpdateAssignForm rows below keep their Maintenance target, Overview's Assign and schedule, now with the ranked picker. Their Implemented in is in usl-inventory's MaintenanceServices and MaintenanceSettingsServices rows.
**Maintenance P6 (Nov 12, 2026):** no baseline form is mapped to the procedures (Procedures and ProcedureDetail are new, design-maintenance §4); their Implemented in is in usl-inventory's ProcessServices rows. Product360's maintenance default (CreateProductMaintenance) takes only a procedure the applicability check admits.

**People P13 (Nov 11, 2026):** no baseline form is mapped to Attendance, TimeImport or SelfService's Clock: attendance punches
are new records (`AttendancePunch`, design-people §14.2 "Attendance punch capture is new"), and PartyTimeEntries' ClockInForm is
Projects' work-time clock (a time entry on a work item), which stays blank as before (impl-projects §7); their Implemented in is in
usl-inventory's People rows.

**People P31 (Nov 13, 2026):** the People rows checked at the end of the build ([impl-people P31](impl-people.md#p31--finish)): every HumanRes, Party and MyAccount/Expense row with a People **Designed in** path names the People screen (and form or region) that carries it, or `—` with why; P31 filled EditParty's identification, email, web and other contact rows (People P2: read only, work contacts kept in Commons), PartyRelated's FromRelationshipForm (OrgStructure, P3) and PartyTimeEntries' ClockInForm (Projects' work-time clock). MyAccount/Expense's two WorkerInvoice rows are Projects' (InvoiceMyTime, impl-projects), not People's.

**People P30 (Nov 12, 2026):** no baseline form is mapped to ClockingKiosk, Employee360's Clocking badge or BadgePrint: kiosk
identity (badges, PINs and the kiosk punch) is new (design-people §14.2, PE-05); their Implemented in is in usl-inventory's People
rows. The P30 review's SelfService My clocking badge (the worker's own PIN) has no baseline form either. Follow-up 4 makes BadgePrint's print a POST transition (`print`) and adds none.

**People P17 (Nov 12, 2026):** no baseline form is mapped to OfferDetail, its letter or an employment change's lifecycle letter: the
baseline HumanRes screens have no offer (design-people §5, §14.2); their Implemented in is in usl-inventory's People rows.

**People P16 (Nov 12, 2026):** no baseline form is mapped to Openings, ApplicantPipeline, ApplicantDetail, InterviewsCalendar or
People's Forms: the baseline HumanRes screens have no recruiting forms (EmploymentApplication had only its fields, F9), and a job
opening, its interviews and scorecards are People's own records (design-people §5, §14.2); their Implemented in is in
usl-inventory's People rows (RecruitingServices, FormDefinitionServices).

**People P14 (Nov 12, 2026):** no baseline form is mapped to ShiftRoster, its terminal twin or its print, or to SelfService's My
shifts: shifts are new records (`ShiftAssignment`, design-people §6 ShiftRoster); their Implemented in is in usl-inventory's People
rows.

**People P15 (Nov 12, 2026):** MyAccount/Expense's five claim forms are People's expense claims: FindExpenseInvoice's
CreateInvoice and InvoiceList are People/Expenses/ExpenseClaims (NewClaim through create#ProjectExpenseInvoice's claim write,
the Claims list over find#Claims), EditExpenseInvoice's EditInvoice and EditExpenseInvoiceItems' two forms are
People/Expenses/ExpenseClaimDetail (ClaimHeader over store#Claim, ClaimItems over store#ClaimItem, with receipts and Read
receipt). The two WorkerInvoice forms stay Projects' MyTime and blank. No baseline form maps to EmployeeAdvances, Accounting's
Employee advances tab or People's InvoiceDetail.
**People P21 (Nov 12, 2026):** no baseline form is mapped to Grievances or People's RequestDetail branch: Marble has no grievance
screen, and a confidential case's forms (SubmitCase, the handler's moves, Add a handler, Ask for work) are People's own over the case
services; its notes and files are the shared Chatter and RecordFiles of the request (EditRequest's NewNoteForm and NewContentForm),
under People for the case's people alone. Their Implemented in is in usl-inventory's People rows.

**People P18 (Nov 12, 2026):** no baseline form is mapped to SkillsMatrix, its terminal twin, Qualifications or Employee360's Skills
and reviews: Marble's HumanRes has no skill, qualification or resume form, and qualifications, skill evaluations and resume lines are
new records (`PartyQualification`, `PartySkillEvaluation`, `PartyResume`, refined from Mantle's commented sketches, design-people §10);
their Implemented in is in usl-inventory's People rows.
**People P19 (Nov 12, 2026):** no baseline form is mapped to Training, TrainingDetail or the training certificate: Marble's
HumanRes has no training form, and courses, sessions, places and assessments are new records (`TrainingClass` and `PersonTraining`
refined from Mantle's commented sketches, `TrainingSession` and `PersonTrainingResult`, design-people §10); their Implemented in is in
usl-inventory's People rows.
**People P20 (Nov 12, 2026):** no baseline form is mapped to ReviewCycles, Reviews, ReviewDetail, Goals or the review release:
Marble's HumanRes has no review or goal form, and templates, cycles, reviews, their steps and notes and goals are new records
(`PerformanceReview` and `PerformanceNote` refined from Mantle's commented sketches, `ReviewTemplate`, `ReviewCycle`,
`PerformanceReviewStep`, `PerformanceReviewContent`, `PersonGoal` over a WetGoal WorkEffort, design-people §11); their Implemented in
is in usl-inventory's People rows.
**People P22 (Nov 12, 2026):** no baseline form is mapped to PayComponents, PayComponentDetail, PayStructures, PayStructureDetail or
PayGroups: Marble has no payroll configuration form (the legacy `PayrollAdjustment` rows had no screen, and People reads none of them,
design-people §8.4), and components, terms, examples, structures, groups and their periods are new records
(`mantle.humanres.payroll`); their Implemented in is in usl-inventory's People rows.
**People P23 (Nov 12, 2026):** no baseline form is mapped to PayAssignments or Employee360's Compensation: Marble's HumanRes has no
salary, benefit or pay assignment form (EmploymentSalary and EmploymentBenefit had only their fields), and pay assignments and tax
profiles are new records (`PayrollAssignment`, `PayrollTaxProfile`); their Implemented in is in usl-inventory's People rows
(create#EmploymentSalary's among them).
**People P24 (Nov 12, 2026):** no baseline form is mapped to HoursForPay or PayAdjustments: Marble's HumanRes has no pay input or
reconciliation form (the legacy `PayrollAdjustment` rows had no screen, and People reads none of them, design-people §8.4), and pay
inputs are new records (`PayrollInput`, `PayrollInputSource`); their Implemented in is in usl-inventory's People rows. TimesheetDetail's
refused reopen is Projects' screen, mounted under People (P10's row).
**People P25 (Nov 12, 2026):** no baseline form is mapped to PayRuns or PayRunDetail: Marble's HumanRes payroll screens ran the legacy
`process#TimePeriodPay` over `PayrollAdjustment` rows, which People neither calls nor reads (design-people §8.4); pay runs are new
records (`PayrollRun`, `PayrollRunEmployment`, `PayrollRunResult`); their Implemented in is in usl-inventory's People rows.
**People P26 (Nov 12, 2026):** no baseline form is mapped to Payslips, PayslipDetail or MyPayslip: Marble's HumanRes pay history
read `EmploymentPayHistory` by employment and pay date, which People reads only by its own key, labelled historical (design-people
§8.4, §5 Q8); payslips are new records (`Payslip`, `PayslipItem`, `PayslipContent`); design §14.2's PaymentCheck stub is a print
reference, not a form; their Implemented in is in usl-inventory's People rows.
**People P27 (Nov 12, 2026):** no baseline form is mapped to PayRunDetail's Finalize and Settlement or Payroll's InvoiceDetail
branch: Marble's HumanRes payroll approved period invoices and made period payments through the legacy services, which People
neither calls nor reads (design-people §8.4); obligations and recoveries are new records (`PayrollObligation`, `PayrollRecovery`);
their Implemented in is in usl-inventory's People rows. The P27 review's Overpayment recovery (PayRecovery) maps none either: its
settings are new PartySettings of People's recovery.
**People P28 (Nov 13, 2026):** no baseline form is mapped to PayrollExchange: Marble's HumanRes had no payroll exchange; history it
imports becomes `EmploymentPayHistory` rows (internal payroll N), which People reads only by their own key, labelled historical, as
P26 does; exchanges are new records (`PayrollExchangeBatch`, `PayrollExchangeRow`); their Implemented in is in usl-inventory's People
rows.

**People P12 (Nov 11, 2026):** no baseline form is mapped to LeaveRequests, LeaveRequestDetail or TeamCalendar either: the
legacy `EmploymentLeave` forms are not taken over (impl-people §5 Q8: read only, historical); a leave request is People's own
record (`LeaveRequest`).

**People P7 (Nov 11, 2026):** no baseline form is mapped to the lifecycle checklists (ChecklistTemplates is new), the equipment custody of People's EquipmentDetail (crosscut §3.10's People row) or the employees import (EmployeeImport, the shared DataImport); their Implemented in is in usl-inventory's People rows.

**People P2 (Nov 11, 2026):** **Implemented in** of the directory and Employee360 rows ([impl-people P2](impl-people.md#p2--employees-and-employee360)): FindParty's search and list forms name `People/Employees/List`; EditParty's person, identification (read, masked, no tax types), phone and postal purpose, note and content forms name `People/Employees/Employee360` and the region that carries each. AddIdentificationForm is not built (identifications are read only in P2), and the email, web and other purpose forms are not People's: a person's work contacts are kept in Commons.

**Maintenance design (Oct 31, 2026):** [design-maintenance](design-maintenance.md) maps the verified baseline forms and current services used by its own screens and contextual mounts. Procedures/checklists are core WorkEffort templates and independent executions. Mappings are additive; **Implemented in** is unchanged. Proposed services and helpers named only for internal implementation or limitation analysis are not active service-inventory claims.

**Commerce and Shop design (Oct 31, 2026):** [Commerce](design-commerce.md) maps all 34 ProductStore forms, including the one shared store-promotion/code definition, and adds its consumed catalog/content/price mounts. [Shop](../../mr-pass/plan/design-shop.md) defines new public screens; those are not parity claims over staff forms. Existing Designed in mappings and every Implemented in cell are preserved. Gateway definitions retain their domain owners; Commerce maps their store bindings only.

**Sales design (Oct 31, 2026):** [Sales](design-sales.md) adds account/contact, RFQ, quote/order,
agreement, pricing and report destinations to Designed in. Shared contexts retain their domain
permissions; public Sales pages are new surfaces, not staff-form parity claims. Previous mappings
and every Implemented in cell are unchanged. Party security, supplier/payable and return execution
remain with their existing owners; see Sales §14.2.

**Marketing design (Oct 31, 2026):** [Marketing §16.2](design-marketing.md#162-baseline-forms-and-service-coverage)
adds the shared store-promotion/code, survey, event, contact and wiki-body mounts to Designed in.
Campaign execution, automation and registration are new workflows, not baseline implementation.
WikiBlogs/EditWikiBlog full article/editorial forms remain future Publishing work. All earlier
mappings and Implemented in cells are preserved.

**Admin and Insights designs (Oct 31, 2026):** [Admin](design-admin.md) adds account/access,
internal-organization and infrastructure configuration destinations. [Insights](design-insights.md)
maps SimpleReport and scheduled-find forms to the approved dataset/report and recipient-delivery
surfaces. Existing Designed in mappings are retained and every Implemented in cell is unchanged.
Framework Tools screens are referenced in the designs; this remains the mr-marble form inventory.

**Design review fixes (Nov 1, 2026):** after [review-suite-apps.md](review-suite-apps.md),
Marketing designs blog posts itself, so the WikiBlogs forms map to `Marketing/Content/BlogPosts`
and the EditWikiBlog forms to its BlogPostDetail, whose body also derives from EditWikiPage
EditPageForm (this replaces the earlier notes that left them for future Publishing). The customer
pages are the PASS app Support, so `ServicePortal/*` paths are now `PASS:Support/*`. Maintenance
adds its WorkOrderDetail assignments, Facilities tree and DueMaintenance reading to the forms they
derive from. The People, Maintenance, Admin and Insights screen renames had no paths here; the
Marble dashboard has no form row (Insights maps it to `Insights/Flows/FlowMap`, built in impl-insights P9: its three
actors are the suite's customer, internal and supplier flow maps). **Implemented in**
is unchanged.

## MyAccount (49 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditExpenseInvoice | WorkerInvoice | Projects/Time/MyTime |  |
| EditExpenseInvoice | EditInvoice | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (ClaimHeader, People P15) |
| EditExpenseInvoiceItems | CreateInvoiceItem | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (Add expense, with its receipt; People P15) |
| EditExpenseInvoiceItems | EditInvoiceItems | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (ClaimItems: Edit, Remove, Read receipt; People P15) |
| FindExpenseInvoice | CreateInvoice | People/Expenses/ExpenseClaims | People/Expenses/ExpenseClaims (NewClaim, People P15) |
| FindExpenseInvoice | WorkerInvoice | Projects/Time/MyTime |  |
| FindExpenseInvoice | InvoiceList | People/Expenses/ExpenseClaims | People/Expenses/ExpenseClaims (Claims, People P15) |
| Account | ChangePasswordForm | Commons/Settings/Account | Commons/Settings/Account |
| Account | SecondFactorSendForm | Commons/Settings/Account | Commons/Settings/Account |
| Account | EditUser | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorTotp | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorSingleUse | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorEmail | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorSms | Commons/Settings/Account | Commons/Settings/Account |
| Account | UserAuthcFactorList | Commons/Settings/Account | Commons/Settings/Account |
| EventDetail | UpdateEvent | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | NewNoteForm | Commons/Calendar/EventDetail; Shared/Chatter; Marketing/Events/EventDetail | Commons/Calendar/EventDetail; Shared/Chatter |
| EventDetail | UpdateNoteForm | Commons/Calendar/EventDetail; Shared/Chatter; Marketing/Events/EventDetail | Commons/Calendar/EventDetail; Shared/Chatter |
| EventDetail | AddPartyAssignForm | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | UpdateAssignForm | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | AddEquipment | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | EquipmentList | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| MyCalendar | NewEventForm | Commons/Calendar; Commons/QuickCreate; Marketing/Calendar; Marketing/Events; Marketing/QuickCreate | Commons/Calendar; Commons/QuickCreate |
| UpdateContactInfo | ShippingInfo | Commons/Settings/Account | Commons/Settings/Account |
| GitAccess | CreateAccessTokenForm | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | AccessTokenList | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | AddSshKeyForm | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | SshKeyList | Projects/Code/GitAccess | Projects/Code/GitAccess |
| EditMessage | ReplyMessageForm | Comms/Inbox/Compose | Comms/Inbox/Compose |
| EditMessage | MessageForm | Comms/Inbox/Compose | Comms/Inbox/Compose |
| EditMessage | AddPurposeForm | — | — |
| EditMessage | PurposesForm | — | — |
| FindMessage | CreateMessage | Comms/Inbox/Compose | Comms/Inbox/Compose |
| FindMessage | MessageList | Comms/Inbox | Comms/Inbox/Mail |
| SingleMessage | ReplyMessageForm | Comms/Inbox/Compose; Shared/Chatter | Comms/Inbox/Compose; Shared/Chatter |
| Notifications | NotificationTopicList | Commons/Settings/Notifications | Commons/Settings/Notifications |
| Notifications | NotificationList | Commons/Notifications; Commons/Panel/Notifications | Commons/Notifications; Commons/Panel/Notifications |
| EditRequest | EditRequest | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase (Customer Service P15) |
| EditRequest | UpdatePartyForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase (Customer Service P15) |
| RequestCommentReply | ReplyCommentForm | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase (Customer Service P15) |
| RequestCommentUpdate | ReplyCommentForm | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase (Customer Service P15) |
| MyRequests | NewRequestForm | Commons/Requests; Commons/QuickCreate; PASS:Support/NewCustomerCase | Commons/Requests/List; Commons/QuickCreate; PASS:Support/NewCustomerCase (Customer Service P15) |
| MyRequests | ListRequests | Commons/Home; Commons/Requests; PASS:Support/MyCases | Commons/Home; Commons/Requests/List; PASS:Support/MyCases (Customer Service P15) |
| ScheduledFinds | ScreenScheduledList | Insights/ScheduledReports | Insights/ScheduledReports/Schedules, the framework's `Dashboards/Schedules.xml` mounted by location (impl-insights P7, §9) |
| EditScheduledFind | EditScreenScheduled | Insights/ScheduledReports/ScheduledReportDetail | Insights/ScheduledReports/ScheduledReportDetail, the framework's `Dashboards/ScheduledReportDetail.xml` mounted by location (impl-insights P7, §9) |
| MyTasks | NewTaskForm | Commons/Tasks; Commons/QuickCreate | Commons/Tasks/List; Commons/QuickCreate |
| MyTasks | MyTasks | Commons/Panel/Today; Commons/Home; Commons/Tasks; Projects/Home | Commons/Panel/Today; Commons/Home; Commons/Tasks/List; Projects/Home |
| TaskDetail | UpdateEvent | Commons/Tasks/TaskDetail | Commons/Tasks/TaskDetail |
| TimeEntries | TimeEntryList | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries |

## Accounting (166 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| BudgetAccountsEntry | GlAccountBudgetList | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#BudgetAccounts and AccountAmounts (by period, as of a revision) |
| BudgetReport | GlAccountBudgetList | Accounting/Reports/BudgetVariance | Accounting/Reports/BudgetVariance#VarianceRows (with committed, net actual) |
| EditBudget | UpdateBudgetForm | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail (header, state actions, AddPartyForm) |
| EditBudgetItems | AddItemForm | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#AddAccountForm |
| EditBudgetItems | BudgetItemList | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#BudgetAccounts (account totals; item details by asset or facility are §7) |
| FindBudget | NewBudgetForm | Accounting/Budgets/Budgets | Accounting/Budgets/Budgets#NewBudget |
| FindBudget | BudgetList | Accounting/Budgets/Budgets | Accounting/Budgets/Budgets#BudgetList |
| EditFinancialAccount | StatementForm | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail (Print: the account and its movements in html-print, P21; a dated statement by month is §7) |
| EditFinancialAccount | UpdateFinancialAccountForm | Accounting/Banking/FinancialAccountDetail | — (not built; FinancialAccountDetail edits no account header) |
| FinancialAccountTrans | AdjustFinancialAccount | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail#DepositValue, WithdrawValue and AdjustValue |
| FinancialAccountTrans | TransactionList | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail#FinancialTransactions |
| FindFinancialAccount | NewFinancialAccountForm | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#NewFinancialAccount |
| FindFinancialAccount | FinancialAccountList | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#FinancialAccounts |
| FindJournal | CreateGlJournal | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches#NewBatch |
| FindJournal | TransactionList | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches#Records |
| EditGlAccount | EditGlAccountForm | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#AccountHeader |
| EditGlAccount | NewGlAccountOrgForm | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#RequiredDimensions; Accounting/GeneralLedger/ChartOfAccounts#AssignExistingAccount |
| EditGlAccount | GlAccountOrgList | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#RequiredDimensions |
| FindGlAccount | NewGlAccountForm | Accounting/GeneralLedger/ChartOfAccounts | Accounting/GeneralLedger/ChartOfAccounts#NewAccount |
| FindGlAccount | GlAccountListForm | Accounting/GeneralLedger/ChartOfAccounts | Accounting/GeneralLedger/ChartOfAccounts#Records |
| Aging | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| Aging | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingRows |
| EditInvoice | AdjustInvoice | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceCreditMemo (a finalized invoice is corrected by a credit memo, not adjusted) |
| EditInvoice | OutSystemMessageList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (later: ElectronicInvoices, §7); — Purchasing: Accounting's (Purchasing P6) |
| EditInvoice | AuditLogList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/History#FinanceInvoiceHistory; Accounting/Payables/BillDetail/History; — Purchasing: the bill's history is Accounting's BillDetail (Purchasing P6) |
| EditInvoice | EditInvoice | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceInvoiceHeader; Accounting/Payables/BillDetail#BillHeader; Purchasing/Bills/InvoiceDetail (Shared/InvoiceDetail: the bill header and PurchasingBillDetails, read only) (Purchasing P6) |
| EditInvoice | NewContentForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Files#AccountingInvoiceFiles (shared record files); Accounting/Payables/BillDetail/Files; Purchasing/Bills/BillList (UploadSupplierBill: the bill's file through import#Bill); Purchasing/Bills/InvoiceDetail (PurchasingBillDocuments, read) (Purchasing P6) |
| EditInvoice | UpdateContentForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Files#AccountingInvoiceFiles (shared record files); Accounting/Payables/BillDetail/Files; — Purchasing reads the documents (PurchasingBillDocuments); AP changes them in BillDetail (Purchasing P6) |
| EditInvoice | SendPastDueEmailForm | Accounting/Receivables/InvoiceDetail; Accounting/Receivables/Dunning; Shared/InvoiceDetail | Accounting/Receivables/Dunning#SendDunningForm |
| EditInvoice | SendFinalizedEmailForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceSendInvoice |
| EditInvoice | EmailMessageList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Overview#InvoiceDeliveries; — Purchasing: Accounting's (Purchasing P6) |
| EditInvoice | NewCreditMemoForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceCreditMemo |
| EditInvoice | RecordPaymentForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payments/Payments#PaymentDraft, then Accounting/Receivables/ReceivablesWorkbench or Accounting/Payables/PayablesWorkbench (recorded, then settled) |
| EditInvoice | PaymentApplicationList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Payments#FinanceInvoicePayments; Accounting/Payables/BillDetail/Payments; Purchasing/Bills/InvoiceDetail (PurchasingBillPayments, a finance reader's; withheld otherwise) (Purchasing P6) |
| EditInvoice | OrderPromisedPaymentList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Records/OrderDetail#AccountingOrderPayments (from InvoiceDetail/Orders; no send and apply); Purchasing/Orders/OrderDetail (PurchaseOrderPayments, the order's payments for a finance reader) (Purchasing P6) |
| EditInvoice | UnappliedPaymentList | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems |
| EditInvoice | UnpaidInvoiceList | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Payments#FinanceApplyCredit; Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems |
| EditInvoice | InvoiceTxList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/GeneralLedger#FinanceInvoiceLedger; Accounting/Payables/BillDetail/GeneralLedger; — Purchasing: the ledger is finance's, in BillDetail (Purchasing P6) |
| EditInvoice | InvoiceGlaList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/GeneralLedger#FinanceInvoiceLedger (transactions; no per-account summary); Accounting/Payables/BillDetail/GeneralLedger; — Purchasing: the ledger is finance's, in BillDetail (Purchasing P6) |
| EditInvoiceItemDetails | AddDetailForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | AssetItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | FacilityItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | ItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemOrders | ApplyToOrder | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payables/BillDetail/Match#MatchSources; Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch MatchSources, apply#InvoiceMatch for the match group) (Purchasing P6) |
| EditInvoiceItemOrders | ApplyItemToOrder | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payables/BillDetail/Match#MatchSources; Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch MatchSources, apply#InvoiceMatch for the match group) (Purchasing P6) |
| EditInvoiceItemOrders | ItemBillingList | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Orders#FinanceInvoiceOrders; Accounting/Payables/BillDetail/Orders; Purchasing/Bills/InvoiceDetail (PurchasingBillSources); Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ApplyToShipment | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources: the Accounting P7 note); — Purchasing: a match links receipts (Purchasing/Bills/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ApplyItemToShipment | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources: the Accounting P7 note); — Purchasing: a match links receipts (Purchasing/Bills/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ItemSourceList | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Shipments#FinanceInvoiceShipments; Accounting/Payables/BillDetail/Shipments; Purchasing/Bills/InvoiceDetail (PurchasingBillSources, the receipts) (Purchasing P6) |
| EditInvoiceItems | CreateInvoiceItem | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items#FinanceAddInvoiceItem; Accounting/Payables/BillDetail/Items; — Purchasing: AP keys the lines in BillDetail (Purchasing P6) |
| EditInvoiceItems | EditInvoiceItems | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items#FinanceInvoiceItems; FinanceEditInvoiceItem; Accounting/Payables/BillDetail/Items; Purchasing/Bills/InvoiceDetail (PurchasingBillLines, read) (Purchasing P6) |
| FindInvoice | NewPayableForm | Accounting/Payables/Bills | Accounting/QuickCreate/NewBill#CreateDraft (draft only) |
| FindInvoice | NewReceivableForm | Accounting/Receivables/Invoices | Accounting/Receivables/Invoices#CreateReceivable; Accounting/QuickCreate/NewInvoice#CreateDraft (draft only) |
| FindInvoice | NewCustCreditForm | Accounting/Receivables/Invoices | Accounting/Receivables/Invoices#CreateReceivable (credit memo type) |
| FindInvoice | NewSupCreditForm | Accounting/Payables/Bills | — (not built; Bills takes supplier bills, not supplier credits) |
| FindInvoice | ProjectInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (receivable) |
| FindInvoice | ProjectWorkerInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (payable) |
| FindInvoice | WorkerInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (payable) |
| FindInvoice | CustomerStatementForm | Accounting/Receivables/Statements | Accounting/Receivables/Statements#StatementOptions; StatementInvoices; StatementDelivery |
| FindInvoice | MainOptions | Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceQueues and InvoiceList (header find); Accounting/Payables/Bills#BillQueues and BillList (header find) |
| FindInvoice | InvoiceList | Purchasing/Bills; Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceList; Accounting/Payables/Bills#BillList; Purchasing/Bills/BillList (SupplierBillList, views and saved finds); Purchasing/Bills/MatchExceptions (MatchExceptionBills) (Purchasing P6) |
| FindInvoice | AgingSummaryList | Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceSummaryView (open receivables by customer); Accounting/Reports/Aging#AgingRows |
| AcctgPreference | EditPapForm | Accounting/Settings/AccountingPreferences | Accounting/Settings/AccountingPreferences#Preferences |
| AcctgPreference | CloneAcctgSettingsForm | Accounting/Settings/AccountingPreferences | Accounting/Settings/AccountingPreferences#ClonePreferences |
| AssetTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Assets kind) |
| AssetTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Assets kind) |
| FinAcctReasons | AllTypesList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Financial account reasons kind) |
| FinAcctTypes | AllTypesList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Financial account types kind) |
| GlAccounts | NewGlAccountOrgForm | Accounting/Settings/PostingDefaults | Accounting/GeneralLedger/ChartOfAccounts#AssignExistingAccount |
| GlAccounts | GlAccountOrgList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings |
| InvoiceTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Invoice types kind) |
| InvoiceTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| InvoiceTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Invoice types kind) |
| ItemTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Invoice item types kind) |
| ItemTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| ItemTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Invoice item types kind) |
| PaymentInstruments | AllEnumList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Payment instruments kind) |
| PaymentTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Payment types kind) |
| PaymentTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| PaymentTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Payment types kind) |
| TypeDefaults | AllEnumList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Account types kind) |
| BulkPaymentCheck | PaymentList | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| BulkPaymentCheck | PaymentListAssignRef | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| BulkPaymentCheck | PaymentListActions | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| EditPayment | RefundPaymentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewManualRefund (reviewed native replacement) |
| EditPayment | AuditLogList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/History#PaymentHistory |
| EditPayment | EditPayment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentEditDraft (a draft; state changes are reviewed actions) |
| EditPayment | GatewayAuthorizeForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewGatewayAuthorize (reviewed native replacement) |
| EditPayment | GatewayCaptureForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewGatewayCapture (reviewed native replacement) |
| EditPayment | GatewayRefundForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewProviderRefund (original-capture native replacement) |
| EditPayment | SetRefundForForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Refunds#PaymentRefund (a reviewed refund records the link; no raw link writer) |
| EditPayment | GatewayRefundForForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewProviderRefund (reviewed draft conversion; no raw link writer) |
| EditPayment | RefundPaymentList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentRefunds |
| EditPayment | PaymentApplicationList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentApplications |
| EditPayment | UnpaidInvoiceList | Accounting/Payments/PaymentDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems (from PaymentDetail/Applications) |
| EditPayment | UnappliedPaymentList | Accounting/Payments/PaymentDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems (from PaymentDetail/Applications) |
| EditPayment | PaymentTxList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/GeneralLedger#PaymentLedger |
| EditPayment | InvoiceGlaList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/GeneralLedger#PaymentLedger (transactions; no per-account summary) |
| EditPayment | NewContentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Files#AccountingPaymentFiles (shared record files) |
| EditPayment | UpdateContentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Files#AccountingPaymentFiles (shared record files) |
| EditPayment | GatewayResponseList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentGatewayEvidence |
| FindPayment | NewInPaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#NewAccountingPayment; Accounting/QuickCreate/NewPayment#CreateDraft (reviewed native lifecycle) |
| FindPayment | NewOutPaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#NewAccountingPayment; Accounting/QuickCreate/NewPayment#CreateDraft (reviewed native lifecycle) |
| FindPayment | PaymentList | Accounting/Payments/Payments | Accounting/Payments/Payments#Records |
| AccountBalance | AccountBalanceHistory | Accounting/Reports/AccountBalance | Accounting/Reports/AccountBalance#BalanceRows |
| AccountLedger | AccountLedger | Accounting/Reports/GeneralLedger | Accounting/Reports/GeneralLedger#ReportRows |
| ArAgingSummary | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| ArAgingSummary | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingRows |
| AssetOnHand | AssetOnHandSummary | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetOnHandSummary | FieldDescriptions | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetOnHandSummary | AssetOnHandSummary | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetReceiptTransaction | AssetReceiptTxList | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Accounting/Reports/StockTransactions; Warehouse/Reports/OperationsHistory (HistoryReport) |
| AssetStatusByReceipt | FieldDescriptions | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetStatusByReceipt | AssetOnHandSummary | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Warehouse/Reports/OperationsHistory (HistoryTotals, per unit) |
| AssetValuation | AssetValuationSummary | Accounting/Inventory/InventoryValuation; Shared/InventoryValuation; Warehouse/Reports/InventoryValuation | Accounting/Inventory/InventoryValuation (Shared/InventoryValuation); Warehouse/Reports/InventoryValuation (with financial read) |
| InvoiceAgingDetail | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| InvoiceAgingDetail | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingDetailRows |
| InvoiceItemSummary | InvoiceItemSummary | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| InvoiceReconciliation | ReportOptions | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationOptions |
| InvoiceReconciliation | InvoiceVsGlList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | PaymentVsGlList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | NotPostedTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | CreditNeqDebitTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | NoInvoiceTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | ApplicationFutureInvoiceList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| OrderIssuedInvoiced | OrderIssuedInvoiced | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| OrderItemSummary | OrderItemSummary | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| PostedAmountSummary | ResultListForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedRows |
| PostedBalanceSummary | ResultList | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedRows |
| ReportList | BalanceSheetForm | Accounting/Reports/BalanceSheet | Accounting/Reports/BalanceSheet#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | IncomeStatementForm | Accounting/Reports/IncomeStatement | Accounting/Reports/IncomeStatement#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | CashFlowStatementForm | Accounting/Reports/CashFlow | Accounting/Reports/CashFlow#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | RetainedEarningsStatementForm | Accounting/Reports/RetainedEarnings | Accounting/Reports/RetainedEarnings#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | FinancialRatiosForm | Accounting/Reports/FinancialRatios | Accounting/Reports/FinancialRatios#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | CustomerStatementForm | Accounting/Receivables/Statements | Accounting/Receivables/Statements#StatementOptions; StatementInvoices; StatementDelivery |
| ReportList | AccountLedgerForm | Accounting/Reports/GeneralLedger | Accounting/Reports/GeneralLedger#ReportOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | AccountBalanceForm | Accounting/Reports/AccountBalance | Accounting/Reports/AccountBalance#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | PostedAmountSummaryForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedSummaryOptions |
| ReportList | PostedBalanceSummaryForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedSummaryOptions |
| SalesAnalysis | SalesAnalysis | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows; Sales/Reports/SalesAnalysis#SalesAnalysis (as ported, its dead links removed, Sales P1; rebuilt P19) |
| SalesInvoiceAnalysis | SalesInvoiceAnalysis | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| SalesSummary | SummaryOptions | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisOptions; Sales/Reports/SalesSummary#SummaryOptions (as ported, Sales P1: a SALES_REPORT_VIEW reader's organizations, costs withheld) |
| SalesSummary | TopProductList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (by product); Sales/Reports/SalesSummary#TopProductList (as ported, Sales P1: a SALES_REPORT_VIEW reader's organizations, costs withheld) |
| SalesSummary | SalesOrderSummaryList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (ordered); Sales/Reports/SalesSummary#SalesOrderSummaryList (as ported, Sales P1: a SALES_REPORT_VIEW reader's organizations, costs withheld) |
| SalesSummary | TopCustomerClassList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (by customer class); Sales/Reports/SalesSummary#TopCustomerClassList (as ported, Sales P1: a SALES_REPORT_VIEW reader's organizations, costs withheld) |
| SalesSummary | SalesInvoiceSummaryList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (invoiced); Sales/Reports/SalesSummary#SalesInvoiceSummaryList (as ported, Sales P1: a SALES_REPORT_VIEW reader's organizations, costs withheld) |
| ShipmentPackageSummary | ShipmentPackageSummary | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Warehouse/Reports/OperationsHistory (HistoryReport: picked, shipped, delivered; packages §7) |
| EditTimePeriod | CreateNextPeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods |
| EditTimePeriod | CreatePreviousPeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods (a day in the earlier year) |
| EditTimePeriod | ViewTimePeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/PeriodCloseDetail |
| EditTimePeriod | CreateChild | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods (the quarters and months of a year) |
| EditTimePeriod | TimePeriodList | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#Records |
| FindTimePeriod | CreatePeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods |
| FindTimePeriod | TimePeriodList | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#Records |
| ViewPeriodGlAccounts | ClosingTransForm | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail#ClosePeriod |
| ViewPeriodGlAccounts | PeriodGlAccountList | Accounting/PeriodClose/PeriodCloseDetail | Accounting/Reports/TrialBalance#ReportRows (the period's stored summaries, linked from PeriodCloseDetail) |
| EditTransaction | UpdateAcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#DraftHeader |
| EditTransaction | UpdateAcctgTransPosted | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#CorrectDescription and ReverseEntry (audited metadata and reversal; no amount edit) |
| EditTransaction | AddEntryForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#AddLine |
| EditTransaction | EntryListForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#TransactionLines |
| EditTransaction | AuditLogList | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#Audit |
| MoveEntry | ReceiveForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#MoveDraftLine (draft move; posted adjustment is not exposed) |
| FindTransaction | CreateAcctgTrans | Accounting/GeneralLedger/JournalEntries | Accounting/QuickCreate/NewEntry#CreateDraft |
| FindTransaction | TransactionList | Accounting/GeneralLedger/JournalEntries | Accounting/GeneralLedger/JournalEntries#Records |
| FindTransactionEntry | TransactionEntryList | Accounting/GeneralLedger/TransactionEntries | Accounting/GeneralLedger/TransactionEntries#Records |
| OrgInternalSummary | OrgInternalForm | Accounting/Home | Accounting/Home (money cards, MyFinanceWork) |

## Asset (65 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| AssetCalendar | NewEventForm | Commons/Calendar/Schedules; Maintenance/Scheduling/ResourceCalendar; Maintenance/Equipment/EquipmentDetail | Commons/Calendar/Schedules; Maintenance/Scheduling/ResourceCalendar (Commons' Book dialog, impl-maintenance P16) |
| AssetDetail | UpdateAssetAcquireCost | Accounting/FixedAssets/EquipmentDetail; Maintenance/Equipment/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail (Repair acquire cost); Maintenance: — (cost and book fields stay Accounting's, F17; its Book tab is read only) |
| AssetDetail | AuditLogList | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail/Audit; Maintenance: — (Warehouse's asset audit; Maintenance's history is a work order's History tab, F73) |
| AssetDetail | EditAsset | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail (Edit details: name and comments); Maintenance/Equipment/EquipmentDetail/Identity (Edit equipment, store#MaintenanceEquipment) |
| AssetDetail | ReservationsListForm | Warehouse/Inventory/AssetDetail | Warehouse/Inventory/AssetDetail/Reservations |
| AssetDetail | AssetDetailList | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail/Ledger; Maintenance: — (the stock ledger stays Warehouse's) |
| AssetDetail | AssetDepreciationList | Accounting/FixedAssets/EquipmentDetail; Accounting/FixedAssets/DepreciationRunDetail; Maintenance/Equipment/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail; Accounting/FixedAssets/DepreciationRunDetail; Maintenance/Equipment/EquipmentDetail/Book (EquipmentBook, read only, P2) |
| EditAssetMaintenance | UpdateMaintenanceForm | Maintenance/WorkOrders/WorkOrderDetail; Maintenance/Equipment/EquipmentDetail | Maintenance/WorkOrders/WorkOrderDetail/Overview (Edit: store#MaintenanceWorkOrder; the AssetMaintenance follows its work order, P3) |
| EditAssetMaintenance | NewContentForm | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Files (the work order's record files, P3) |
| EditAssetMaintenance | UpdateContentForm | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Files (the work order's record files, P3) |
| FindAssetMaintenance | AddPlannedMaintenance | Maintenance/Preventive/DueMaintenance; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/Preventive/DueMaintenance (GenerateWork: generate#MaintenanceWorkOrders; a plan's work order with its AssetMaintenance, no future threshold written as a reading) and PlanDetail (Generate work) (P14) |
| FindAssetMaintenance | AddOtherMaintenance | Maintenance/WorkOrders; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/NewWorkOrder (NewWork: create#MaintenanceWorkOrder, P3) |
| FindAssetMaintenance | ProductMaintenanceList | Maintenance/Preventive/Plans; Maintenance/Equipment/EquipmentDetail | Maintenance/Preventive/Plans/Find (PlanRows, with each plan's model default) and PlanDetail; Maintenance/Equipment/EquipmentDetail/Maintenance (Preventive plans) (P13) |
| FindAssetMaintenance | MaintenanceListForm | Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/Equipment/EquipmentDetail/Maintenance (work orders and maintenance records, with Adopt, P3) |
| AssetMeters | NewMeterForm | Maintenance/Equipment/EquipmentDetail; Maintenance/Preventive/DueMaintenance | Maintenance/Equipment/EquipmentDetail/Meters (Record a reading) |
| AssetMeters | MeterListForm | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Meters (Meters, Recent readings) |
| AssetParties | AddUserForm | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Assignments (Change custodian) |
| AssetParties | UpdateUserForm | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Assignments (the holding ended by Change custodian) |
| AssetRegistrations | NewRegistrationForm | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Registrations (Add registration) |
| AssetRegistrations | RegistrationsForm | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Registrations |
| DetailHistory | AssetDetailList | Warehouse/Inventory/Movements; Warehouse/Inventory/AssetDetail | Warehouse/Inventory/Movements; Warehouse/Inventory/AssetDetail/Ledger |
| FindAsset | UpdateProductCost | Accounting/Inventory/InventoryValuation | Accounting/Inventory/InventoryValuation (Repair product cost) |
| FindAsset | CreateEquipment | Maintenance/Equipment | Maintenance/Equipment/Find (CreateEquipment) |
| FindAsset | ListAssets | Warehouse/Inventory/Assets; Maintenance/Equipment | Warehouse/Inventory/Assets; Maintenance/Equipment/Find (EquipmentRows) |
| FindSummary | ReceiveAssetForm | Warehouse/Receiving/Receive; Warehouse/Inventory/MaterialIssueReceipt | Warehouse/Receiving/Receive (AdHocReceipt, receive#AdHocStock); Warehouse/Inventory/MaterialIssueReceipt (ReceiveOutputForm) |
| FindSummary | PhysicalManualChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, then Preview and PostAdjustment) |
| FindSummary | AssetSummary | Warehouse/Inventory/Availability | Warehouse/Inventory/Availability/Summary (InventorySummary, InventoryLots) |
| PhysicalChange | RecordChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, Enter: the change; PostAdjustment) |
| PhysicalQuantity | RecordQuantity | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, Enter: what is there, a count; PostAdjustment) |
| MoveAsset | AssetInfoForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (MoveConfirm); Maintenance/Equipment/EquipmentDetail/Identity (Move: MoveEquipmentPreview, MoveEquipment, P2) |
| MoveAsset | ScanMoveAssetForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (ScanSelect, MoveConfirm); Maintenance/Equipment/EquipmentDetail/Identity (Move by choice, no scan, P2) |
| MoveAsset | EnterMoveAssetForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (MoveConfirm); Maintenance/Equipment/EquipmentDetail/Identity (Move, its effect shown first) |
| SelectAsset | ScanAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (ScanSelect) |
| SelectAsset | ActiveFacilityForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | SelectAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | SelectLocationForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | ScanMoveAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveConfirm) |
| SelectAsset | EnterMoveAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveConfirm) |
| SelectAsset | ContainerAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | LocationAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | ProductNoLocAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | RecentMoveForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (RecentMoves) |
| SelectAsset | RecentContainerMoveForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (RecentMoves) |
| EditAssetPool | UpdateAssetPoolForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (EditPool) |
| EditAssetPool | AddPartyForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (AddParty) |
| EditAssetPool | PartyListForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (PoolPartys list) |
| EditAssetPool | AddStoreForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (AddStore) |
| EditAssetPool | StoreListForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (PoolStores) |
| FindAssetPool | CreateAssetPoolForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolList (NewPool) |
| FindAssetPool | AssetPoolList | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolList (PoolList) |
| EditContainer | PickScanForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (AddOrRemoveAsset, the scan; a pick movement is P11) |
| EditContainer | UpdateContainerForm | Warehouse/Inventory/ContainerDetail | — not built (P4): ContainerDetail's header is read only; type and place are set at Containers' New container, moves by MoveContainer |
| EditContainer | AddAssetForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (AddOrRemoveAsset, Take out) |
| EditContainer | AssetListForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (Contents) |
| FindContainer | CreateContainerForm | Warehouse/Inventory/Containers | Warehouse/Inventory/Containers (New container) |
| FindContainer | ContainerList | Warehouse/Inventory/Containers | Warehouse/Inventory/Containers |
| MoveContainer | ContainerInfoForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (header, MoveContainer) |
| MoveContainer | AssetListForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (Contents); Warehouse/Transfers/Move (MoveContents by container) |
| MoveContainer | ScanMoveContainerForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (MoveContainer) |
| MoveContainer | EnterMoveContainerForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (MoveContainer) |
| EditLots | CreateLot | Warehouse/Inventory/Lots | Warehouse/Inventory/Lots (New lot) |
| EditLots | LotList | Warehouse/Inventory/Lots | Warehouse/Inventory/Lots (Correct, through correct#LotMetadata, P6) |
| EditPhysicalInventory | UpdateMasterEntityValue | Warehouse/Counts/CountDetail | Warehouse/Counts/CountDetail (Edit count through update#Count, P10) |
| EditPhysicalInventory | AssetDetailList | Warehouse/Counts/CountDetail; Warehouse/Counts/CountReview; Warehouse/Reports/CountVariance | Warehouse/Counts/CountDetail (PostedAdjustments), CountReview (VarianceReview), Reports/CountVariance (P10) |
| FindPhysicalInventory | PhysicalInventoryList | Warehouse/Counts/Counts | Warehouse/Counts/Counts (CountList over find#Counts, P10) |

## Catalog (80 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| Category/Content/ContentDetail | UpdateContentForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| Category/Content/ContentDetail | UpdateTextForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| Category/Content/ContentList | NewContentForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| Category/Content/ContentList | NewLocationForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| Category/Content/ContentList | NewTextForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| Category/Content/ContentList | ContentList | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata); Commerce/Merchandising/CategoryDetail/Content (Shared/CategoryDetail) (P3) |
| EditCategory | EditCategoryForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Summary; Commerce/Merchandising/CategoryDetail/Summary (Shared/CategoryDetail) (P3) |
| EditCategory | AddChild | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents; Commerce/Merchandising/CategoryDetail/Parents (Shared/CategoryDetail) (P3) |
| EditCategory | ChildCategoriesForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents; Commerce/Merchandising/CategoryDetail/Parents (Shared/CategoryDetail) (P3) |
| EditCategory | GenerateCategoryIdent | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers; Commerce/Merchandising/CategoryDetail/Identifiers (Shared/CategoryDetail) (P3) |
| EditCategory | AddCategoryIdentForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers; Commerce/Merchandising/CategoryDetail/Identifiers (Shared/CategoryDetail) (P3) |
| EditCategory | CategoryIdentForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers; Commerce/Merchandising/CategoryDetail/Identifiers (Shared/CategoryDetail) (P3) |
| EditCategory | ParentCategoriesForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents; Commerce/Merchandising/CategoryDetail/Parents (Shared/CategoryDetail) (P3) |
| EditCategory | AddFeatureGroupForm | Products/Categories/CategoryDetail | Products/Categories/CategoryDetail/FeatureDefaults |
| EditCategory | FeatureGroupsForm | Products/Categories/CategoryDetail | Products/Categories/CategoryDetail/FeatureDefaults |
| EditProducts | AddProductForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Products; Commerce/Merchandising/CategoryDetail/Products (Shared/CategoryDetail) (P3) |
| EditProducts | ProductsForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Products; Commerce/Merchandising/CategoryDetail/Products (Shared/CategoryDetail) (P3) |
| FindCategory | NewCategoryForm | Products/Categories | Products/Categories/NewCategory |
| FindCategory | CategoriesForm | Products/Categories | Products/Categories/List (occurrences and guarded one-edge moves) |
| EditFeature | NewFeatureForm | Products/Features | Products/Features/NewFeature; Shared/Product360/Features (atomic create/apply) |
| EditFeature | EditFeatureForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Summary |
| EditFeature | AddFeatureGroupForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Groups |
| EditFeature | FeatureGroupsForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Groups |
| EditFeature | AddProductForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Products |
| EditFeature | ProductsForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Products |
| FindFeature | NewFeatureForm | Products/Features | Products/Features/NewFeature |
| FindFeature | FeaturesForm | Products/Features | Products/Features/List |
| EditFeatureGroup | EditFeatureGroupForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Summary |
| EditFeatureGroup | AddCategoryForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Categories |
| EditFeatureGroup | CategoriesForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Categories |
| EditFeatureGroup | AddFeatureForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Features |
| EditFeatureGroup | FeaturesForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Features |
| FindFeatureGroup | NewFeatureGroupForm | Products/Features/FeatureGroups | Products/Features/FeatureGroups/NewGroup |
| FindFeatureGroup | FeatureGroupsForm | Products/Features/FeatureGroups | Products/Features/FeatureGroups/List |
| Product/Content/ContentDetail | UpdateContentForm | Products/Documents/DocumentDetail; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents/DocumentDetail; Commerce/Merchandising/Product360 | Shared/Product360/Documents (guarded existing content service); Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents/DocumentDetail (P3) |
| Product/Content/ContentDetail | UpdateTextForm | Products/Documents/DocumentDetail; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents/DocumentDetail; Commerce/Merchandising/Product360 | Shared/Product360/Documents (guarded existing content service); Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents/DocumentDetail (P3) |
| Product/Content/ContentList | NewContentForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents; Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents (P3) |
| Product/Content/ContentList | NewLocationForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents; Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents (P3) |
| Product/Content/ContentList | NewTextForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents; Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents (P3) |
| Product/Content/ContentList | ContentList | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents; Commerce/Merchandising/Product360/Documents; Commerce/Merchandising/Documents (P3) |
| EditAssocs | AddAssocToForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/BillOfMaterialsDetail (the dated BOM lines of Shared/BillOfMaterialsDetail, P2) |
| EditAssocs | AssocToListForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/BillOfMaterialsDetail (the dated BOM lines of Shared/BillOfMaterialsDetail, P2) |
| EditAssocs | AssocFromListForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/WhereUsed; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/WhereUsed (Shared/WhereUsed, kits read only, P2) |
| EditAssocs | CreateVariantsForm | Products/Products/VariantBuilder; Shared/Product360 | Products/Products/VariantBuilder (qvue; VariantBuilderTui XML twin) |
| EditAssocs | AllSelectableFeaturesForm | Products/Products/VariantBuilder; Shared/Product360 | Products/Products/VariantBuilder (qvue; VariantBuilderTui XML twin) |
| EditCategories | AddCategoryForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Categories; Commerce/Merchandising/Product360/Categories (P3) |
| EditCategories | CategoriesForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Categories; Commerce/Merchandising/Product360/Categories (P3) |
| EditPrices | NewPriceForm | Products/Pricing/Prices; Products/Products/Product360; Products/Suppliers/SupplierPrices; Purchasing/Suppliers/SupplierPrices; Shared/Product360; Shared/SupplierPrices; Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices (NewSalesPrice, NewSupplierPrice, Prices); Shared/SupplierPrices (SupplierOffers and offer forms); Products mounts only; Purchasing/Suppliers/SupplierPrices (Shared/SupplierPrices); Commerce/Merchandising/Product360/Prices (P3) |
| EditPrices | PricesForm | Products/Pricing/Prices; Products/Products/Product360; Products/Suppliers/SupplierPrices; Purchasing/Suppliers/SupplierPrices; Shared/Product360; Shared/SupplierPrices; Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices (NewSalesPrice, NewSupplierPrice, Prices); Shared/SupplierPrices (SupplierOffers and offer forms); Products mounts only; Purchasing/Suppliers/SupplierPrices (Shared/SupplierPrices); Commerce/Merchandising/Product360/Prices (P3) |
| EditProduct | CloneProductForm | Products/Products/Product360; Shared/Product360 | Shared/Product360 |
| EditProduct | EditProductForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360; Commerce/Merchandising/Product360 (P3) |
| EditProduct | AddIdentificationForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers; Commerce/Merchandising/Product360/Identifiers (P3) |
| EditProduct | IdentificationsForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers; Commerce/Merchandising/Product360/Identifiers (P3) |
| EditProduct | GenerateOtherIdentification | Products/Products/Product360; Shared/Product360 | Shared/Product360/Identifiers (GenerateIdentifierPreview, AssignGeneratedIdentifier; explicit internal generation) |
| EditProduct | AddOtherIdentificationForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers; Commerce/Merchandising/Product360/Identifiers (P3) |
| EditProduct | OtherIdentificationsForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers; Commerce/Merchandising/Product360/Identifiers (P3) |
| EditProduct | NewFeatureForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (atomic create/apply) |
| EditProduct | AddFeatureForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (existing feature applications) |
| EditProduct | FeaturesForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (existing feature applications) |
| EditProduct | AddDimensionForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | DimensionsForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | AddUomDimensionForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | UomDimensionsForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | CreateProductLocation | Products/Products/Product360; Shared/Product360 | Shared/InventoryAvailability/Policy (LocationStockPolicy, LocationPolicies) |
| EditProduct | ProductLocationList | Products/Products/Product360; Shared/Product360 | Shared/InventoryAvailability/Policy (LocationStockPolicy, LocationPolicies) |
| EditProduct | CreateProductMeter | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment; Maintenance/Equipment/Product360/Equipment |
| EditProduct | ProductMeterList | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment; Maintenance/Equipment/Product360/Equipment |
| EditProduct | CreateProductMaintenance | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment; Maintenance/Equipment/Product360/Equipment (its work template a maintenance procedure the applicability check admits, impl-maintenance P6) |
| EditProduct | ProductMaintenanceList | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment; Maintenance/Equipment/Product360/Equipment |
| FindProduct | NewProductForm | Products/Products | Products/Products/NewProduct |
| FindProduct | ProductsForm | Products/Products | Products/Products/List |
| Search | AddCategoryForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveCategoryForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddFeatureForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveFeatureForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | ProductsForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddCategoryFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveCategoryFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddFeatureFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveFeatureFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |

## Customer (7 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| CustomerData | CustomerDataList | CustomerService/Customers/Customer360; Sales/Accounts/Accounts | CustomerService/Customers/Customer360 (ServiceOverview, ServiceOrders, ServiceBilling; Customer Service P3); Sales/Accounts/Accounts (AccountList; Sales P3) |
| FindCustomer | CreatePersonForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts | — CustomerService/Customers/Customer360 (no create here: the Commons contact record and Sales create parties; Customer Service P3); Sales/Accounts/Accounts (NewPerson: create#Account of a person; Sales P3) |
| FindCustomer | CreateOrganizationForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts | — CustomerService/Customers/Customer360 (no create here: the Commons contact record and Sales create parties; Customer Service P3); Sales/Accounts/Accounts (NewAccount; Sales P3) |
| FindCustomer | CreateAccountForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts | — CustomerService/Customers/Customer360 (no create here: Sales creates accounts; Customer Service P3); Sales/Accounts/Accounts (NewAccount; Sales P3) |
| FindCustomer | CreateContactForm | CustomerService/Customers/ContactDetail; Sales/Accounts/Contacts | CustomerService/Customers/ContactDetail (the Commons contact record, ContactRecordSection, for a served customer's contact; Customer Service P3); Sales/Accounts/Contacts (NewContact; Sales P3) |
| FindCustomer | OuterSearchForm | CustomerService/Customers; Sales/Accounts/Accounts | CustomerService/Customers/Customers (CustomerFind: find#Customers; Customer Service P3); Sales/Accounts/Accounts (AccountList header find; Sales P3) |
| FindCustomer | CustomerListForm | CustomerService/Customers; Sales/Accounts/Accounts | CustomerService/Customers/Customers (CustomerList; Customer Service P3); Sales/Accounts/Accounts (AccountList; Sales P3) |

## Facility (18 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| BoxTypes | CreateBoxType | Warehouse/Locations/BoxTypes | Warehouse/Locations/BoxTypes (NewBoxType) |
| BoxTypes | BoxTypeList | Warehouse/Locations/BoxTypes | Warehouse/Locations/BoxTypes (BoxTypeList, EditBoxType, Retire) |
| CarrierShipMethods | CreateCarrierShipmentMethod | Warehouse/Locations/Carriers | Warehouse/Locations/Carriers (Add method, P13) |
| CarrierShipMethods | CarrierShipmentMethodList | Warehouse/Locations/Carriers | Warehouse/Locations/Carriers (CarrierMethods, P13) |
| EditFacility | EditFacilityForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Edit facility; Overview); Maintenance/Facilities/FacilityDetail (Edit facility, with time zone, capacity and booking) |
| EditFacility | ChildListForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail; Maintenance/Facilities | Warehouse/Locations/FacilityDetail/Children; Maintenance/Facilities/FacilityDetail/Children; Maintenance/Facilities/Find (tree) |
| EditFacility | NewNoteForm | Warehouse/Locations/FacilityDetail; Shared/Chatter; Shared/FacilityDetail; Maintenance/Chatter; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Conversation (chatter); Maintenance/Facilities/FacilityDetail/Conversation (chatter) |
| EditFacility | UpdateNoteForm | Warehouse/Locations/FacilityDetail; Shared/Chatter; Shared/FacilityDetail; Maintenance/Chatter; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Conversation (chatter); Maintenance/Facilities/FacilityDetail/Conversation (chatter) |
| EditFacility | AddBoxTypeForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Box types tab: AddFacilityBoxType); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacility | BoxTypesForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Box types tab: FacilityBoxTypeList); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacility | AddLocationTypeForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Set status); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacility | LocationTypesForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Location types); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacilityLocations | NewLocationForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (New location); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacilityLocations | LocationsForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Locations, Edit, Close, Reopen); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacilityProducts | AddProductForm | Warehouse/Locations/FacilityDetail; Warehouse/Inventory/Product360; Purchasing/Replenishment/ReorderRules; Shared/FacilityDetail; Products/Products/Product360/Stock; Shared/InventoryAvailability; Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy (FacilityStockPolicy, FacilityPolicyRead); Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products; Purchasing/Replenishment/ReorderRules/Rules (NewReorderRuleForm, EditRule); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| EditFacilityProducts | ProductList | Warehouse/Locations/FacilityDetail; Warehouse/Inventory/Product360; Purchasing/Replenishment/ReorderRules; Shared/FacilityDetail; Products/Products/Product360/Stock; Shared/InventoryAvailability; Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy (FacilityStockPolicy, FacilityPolicyRead); Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products; Purchasing/Replenishment/ReorderRules/Rules (ReorderRuleList); Purchasing/Replenishment/ReorderRules/SuggestLevels; Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| FindFacility | NewFacilityForm | Warehouse/Locations/Facilities; Maintenance/Facilities | Warehouse/Locations/Facilities (New facility); Warehouse/Locations/FacilityDetail/Children; Maintenance/Facilities/Find (New facility); Maintenance/Facilities/FacilityDetail/Children |
| FindFacility | FacilityListForm | Warehouse/Locations/Facilities; Maintenance/Facilities | Warehouse/Locations/Facilities (list and tree); Maintenance/Facilities/Find (tree and list) |

## Gateway (6 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditPaymentGateway | EditPaymentGatewayForm | Admin/Integrations/ConnectionDetail |Admin/Integrations/ConnectionDetail#NativeConnection (the payment gateway kind's fields; service names are the provider type's, never entered) |
| FindPaymentGateway | NewPaymentGatewayForm | Admin/Integrations/Connections |Admin/Integrations/Connections#NewConnection (a registered provider type) |
| FindPaymentGateway | PaymentGatewaysForm | Admin/Integrations/Connections |Admin/Integrations/Connections#ConnectionList |
| EditShippingGateway | EditShippingGatewayForm | Admin/Integrations/ConnectionDetail |Admin/Integrations/ConnectionDetail#NativeConnection (the shipping gateway kind's fields; carriers, methods and options stay Warehouse's) |
| FindShippingGateway | NewShippingGatewayForm | Admin/Integrations/Connections |Admin/Integrations/Connections#NewConnection (a registered provider type) |
| FindShippingGateway | ShippingGatewaysForm | Admin/Integrations/Connections |Admin/Integrations/Connections#ConnectionList |

## HumanRes (2 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRateAmounts | CreateRateAmount | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates |
| EditRateAmounts | EditRateAmounts | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates |

## Manufacturing (23 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRun | UpdateRun | Manufacturing/WorkOrders/WorkOrderDetail; Manufacturing/WorkOrders/WorkOrderDetail/Overview | Manufacturing/WorkOrders/WorkOrderDetail/Overview (EditHeader: store#ProductionOrder, a draft only, P5a) |
| EditRun | NewNoteForm | Shared/Chatter; Manufacturing/Chatter; Manufacturing/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Notes (chatter on the run, P5a) |
| EditRun | UpdateNoteForm | Shared/Chatter; Manufacturing/Chatter; Manufacturing/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Notes (chatter on the run, P5a) |
| EditRun | AddEquipment | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Manufacturing/WorkCenters/Equipment | Manufacturing/WorkOrders/WorkOrderDetail/Overview (AssignEquipment: store#ProductionEquipment, P5a) |
| EditRun | EquipmentList | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Manufacturing/WorkCenters/Equipment | Manufacturing/WorkCenters/Equipment (the equipment at the user's facilities with its assigned operation); Manufacturing/WorkOrders/WorkOrderDetail/Overview (RunEquipment, with End, P5a) |
| EditRun | AddPartyAssignForm | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (AssignPerson: store#ProductionParty, P5a); Maintenance/WorkOrders/WorkOrderDetail/Overview (Assign and schedule: schedule#MaintenanceWorkOrder, Maintenance P3) |
| EditRun | UpdateAssignForm | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (RunPeople with Remove, P5a); Maintenance/WorkOrders/WorkOrderDetail/Overview (Team and technicians, Maintenance P3) |
| FindRun | NewRunForm | Manufacturing/WorkOrders/NewWorkOrder | Manufacturing/WorkOrders/NewWorkOrder (Identity, Method, Review: create#ProductionOrder); Manufacturing/WorkOrders/QuickCreate (P5a) |
| FindRun | RunList | Manufacturing/WorkOrders; Manufacturing/Home | Manufacturing/WorkOrders/Find (WorkOrderList: find#ProductionOrders, board, calendar, bulk, P5a); Manufacturing/Home (Summary, Queue and Kpis, P5b and P16); Manufacturing/Reports/WorkOrderStatusReport (StatusRows: get#ProductionStatusReport over find#ProductionOrders, with its CSV export, P16) |
| RunConsumed | IssueAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue: issue#ProductionMaterial, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue, and Backflush through issue#ProductionMaterial, Manufacturing P5b); Maintenance/WorkOrders/MaterialIssueReceipt (Issue: issue#MaintenanceMaterial to the root or step, Maintenance P9) |
| RunConsumed | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue from a chosen asset, P5b); Maintenance/WorkOrders/MaterialIssueReceipt (Issue from a chosen asset of the work organization, Maintenance P9) |
| RunConsumed | IssuedAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Posted issues and receipts, Unused returns, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Posted issues and receipts, Unused returns, Manufacturing P5b); Maintenance/WorkOrders/MaterialIssueReceipt (Issues and returns, Unused returns: return#MaintenanceMaterial, Maintenance P9) |
| RunProduced | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b); a by-product at its co-product share of the frozen estimate (Manufacturing P15) |
| RunProduced | ReceivedAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Tracking, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Tracking, Manufacturing P5b) |
| RunProducts | AddProduceForm | Manufacturing/WorkOrders/WorkOrderDetail/Quantities | Manufacturing/WorkOrders/WorkOrderDetail/Quantities AddOutput and ByProducts (a draft's secondary output or by-product: store#ProductionOutput, P7) |
| RunProducts | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b) |
| RunProducts | ProduceList | Manufacturing/WorkOrders/WorkOrderDetail/Quantities | Manufacturing/WorkOrders/WorkOrderDetail/Quantities OutputPlan (get#ProductionQuantities: target, good, held, loss, remaining, P7) |
| RunProducts | AddConsumeForm | Manufacturing/WorkOrders/WorkOrderDetail/Components; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components (AddMaterial: store#ProductionMaterial, P5b); Maintenance/WorkOrders/WorkOrderDetail/Parts (Add part, Add suggested parts: store#MaintenanceMaterial, Maintenance P9) |
| RunProducts | IssueAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue: issue#ProductionMaterial, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue, Manufacturing P5b); Maintenance/WorkOrders/MaterialIssueReceipt (Issue, Maintenance P9) |
| RunProducts | ConsumeList | Manufacturing/WorkOrders/WorkOrderDetail/Components; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components (ComponentLines: get#ProductionMaterials, P5b; its Substitute dialog and the substitution requests: substitute#ProductionMaterial, P9); Maintenance/WorkOrders/WorkOrderDetail/Parts (Planned parts with Edit and Remove, Parts used: get#MaintenanceMaterials, Maintenance P9) |
| ConsumeAsset | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue from a chosen asset, P5b) |
| ConsumeProduct | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Backflush: the lots chosen oldest expiry first, P5b) |
| ProduceAsset | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b) |

## Order (43 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindOrder | CreateSalesOrder | Sales/Quotes/Quotes; Sales/Orders/Orders |  |
| FindOrder | ApproveOrdersForm | Purchasing/Orders/PurchaseOrders; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (BulkApprove: decide#PurchaseApproval per order) (Purchasing P3) |
| FindOrder | CloseOrdersForm | Purchasing/Orders/PurchaseOrders; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (BulkClose: close#PurchaseRemainders per order) (Purchasing P3) |
| FindOrder | CreatePurchaseOrder | Purchasing/Orders/PurchaseOrders | Purchasing/Orders/PurchaseOrders (CreatePurchaseOrder); Purchasing/NewPurchaseOrder (quick create) (Purchasing P3) |
| FindOrder | OrderList | Purchasing/Orders/PurchaseOrders; CustomerService/Orders/Orders; Sales/Quotes/Quotes; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (PurchaseOrderList, views and saved finds) (Purchasing P3); Purchasing/Sourcing/Quotes (QuoteList, the quote statuses) (Purchasing P11); CustomerService/Orders/Orders (OrderLookup and OrderResults: find#ServiceOrders; Customer Service P3) |
| OrderDetail | CloseOrderPartItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: ClosePurchaseRemainder) (Purchasing P3) |
| OrderDetail | AddPartForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: one purchase part per order (impl-purchasing §4) (Purchasing P17) |
| OrderDetail | RecurOptions | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Sales/Agreements/RecurringOrders | — Purchasing: no recurring purchase order; recurring agreement releases are §7 (F134) (Purchasing P17) |
| OrderDetail | AuditLogList | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderHistory) (Purchasing P3); Shared/OrderDetail (Customer Service: ServiceOrderHistory; Customer Service P3) |
| OrderDetail | HeaderForm | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: the record header, EditPurchaseOrder) (Purchasing P3); Shared/OrderDetail (Customer Service: the record header, read only, with New case, Link to case and Resend confirmation; Customer Service P3) |
| OrderDetail | AddPromoCode | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | AddPartyPromoCode | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | OrderPromoCodeList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | ItemLimitForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: the order's lines are not paged (Purchasing P17) |
| OrderDetail | NewNoteForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/Chatter | Shared/Chatter (the order's record context on Purchasing/Orders/OrderDetail) (Purchasing P3) |
| OrderDetail | UpdateNoteForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/Chatter | Shared/Chatter (the order's record context on Purchasing/Orders/OrderDetail) (Purchasing P3) |
| OrderDetail | NewContentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/RecordFiles | Shared/RecordFiles (the order's record context); Shared/OrderDetail (Purchasing: PurchaseOrderDocuments) (Purchasing P3) |
| OrderDetail | UpdateContentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/RecordFiles | Shared/RecordFiles (the order's record context) (Purchasing P3) |
| OrderDetail | SendPlacedEmailForm | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: SendPurchaseOrder: send#PurchaseOrder) (Purchasing P3); Shared/OrderDetail (Customer Service: ServiceResendForm, resend#OrderConfirmation of the stored confirmation; Customer Service P3) |
| OrderDetail | EmailMessageList | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderEmails) (Purchasing P3); Shared/OrderDetail (Customer Service: ServiceOrderConfirmationSends; Customer Service P3) |
| OrderDetail | SystemMessageList | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: no EDI or system messages (impl-purchasing §7) (Purchasing P17) |
| OrderDetail | ChildOrderList | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: no child-order list; a drop-ship order's parent is its customer order (Purchasing P7) |
| OrderDetail | AddOrderPartToShipmentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Receiving/Receipts (PrepareReceipt, "Expected receipt (ASN)"); Purchasing/Orders/OrderDetail (Receipts and inspection) |
| OrderDetail | EditPartForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: EditPurchaseOrder: reference and receiving facility of a draft) (Purchasing P3) |
| OrderDetail | EditPartNonEdForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderChanges (ProposedOrder: delivery date and terms of a placed order); Shared/OrderDetail (Purchasing: RecordAcknowledgement, the supplier's reference and date) (Purchasing P9) |
| OrderDetail | CreateOrderPartParty | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: parties by role; the drop-ship customer is set by create#DropShipPurchaseOrder (Purchasing P7) |
| OrderDetail | CloseOrderPartItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: ClosePurchaseRemainder) (Purchasing P3) |
| OrderDetail | AddPaymentForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | UpdatePaymentForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | GatewayAuthorizeForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | GatewayResponseList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | SetOrderInfoForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderDetail (EditPurchaseOrder) (Purchasing P3) |
| OrderDetail | AddProductItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: AddPurchaseOrderLine) (Purchasing P3) |
| OrderDetail | AddOtherItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: product lines only (AddPurchaseOrderLine; a service is a product line) (Purchasing P3) |
| OrderDetail | OrderItems | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderLines) (Purchasing P3); Shared/OrderDetail (Customer Service: ServiceOrderItems, read only; Customer Service P3) |
| EditItem | EditOrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: EditPurchaseOrderLine) (Purchasing P3) |
| ItemReserve | ReserveItem | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| ReturnItem | ReturnItem | CustomerService/Returns/NewReturn; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | CustomerService/Returns/NewReturn, CustomerService/Returns/ReturnDetail (Customer Service P9) |
| OrderItems | AddProductItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: AddPurchaseOrderLine) (Purchasing P3) |
| OrderItems | AddOtherItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Purchasing: product lines only (AddPurchaseOrderLine; a service is a product line) (Purchasing P3) |
| OrderItems | OrderItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderLines) (Purchasing P3) |
| QuickItems | QuickItemOptions | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| QuickItems | QuickItemList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |

## Party (105 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditParty | CreateUserAccount | Admin/Users/Users | Admin/Users/Users (NewStaffAccount) (Admin P4) |
| EditParty | ConvertToPersonForm |  |  |
| EditParty | ConvertToOrganizationForm |  |  |
| EditParty | EditOrganizationForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; People/Employees/OrgStructure; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (Maintain contact opens Commons/Contacts/ContactDetail) (Purchasing P2); Admin/Settings/OrganizationDetail (Profile: OrganizationProfile) (Admin P7); People/Employees/OrgStructure (NewUnit and EditUnit: a department's or team's name, over mantle.humanres.OrganizationServices.store#Unit; a legal organization stays Admin's) (People P3); Sales/Accounts/ContactDetail (the Commons contact record, ContactRecordSection, under its own party checks; Sales P3) |
| EditParty | EditPersonForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (Maintain contact opens Commons/Contacts/ContactDetail) (Purchasing P2); People/Employees/Employee360 (Personal information: EditPersonalInfoForm over mantle.humanres.PeopleServices.store#PersonalInfo; Commons/People/Employee360 for the person's own preferred name and phones) (People P2); Sales/Accounts/ContactDetail (the Commons contact record, ContactRecordSection, under its own party checks; Sales P3) |
| EditParty | AddDirectRoleForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); — Purchasing: a supplier gets its role when created (SupplierList's New supplier dialogs); Supplier360/Overview lists its roles (Purchasing P2); — Sales/Accounts/Customer360 (an account's Customer or Prospect role is set when it is created, NewAccount; no role edit in P3, a finding; Sales P3) |
| EditParty | AddOtherRoleForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); — Purchasing: a supplier gets its role when created (SupplierList's New supplier dialogs); Supplier360/Overview lists its roles (Purchasing P2); — Sales/Accounts/Customer360 (no role edit in P3, a finding; Sales P3) |
| EditParty | RolesForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Purchasing/Suppliers/Supplier360/Overview (SupplierRoles, read) (Purchasing P2); Sales/Accounts/Accounts (AccountList's role, read; Sales P3) |
| EditParty | SetClassificationForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying (SupplierCategory); Purchasing/Suppliers/SupplierList (BulkCategory); — (other apps' contexts on Customer360, §7); — Sales/Accounts/Customer360 (no classification in P3, a finding; Sales P3) |
| EditParty | ClassificationsForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying (Category); — (other apps' contexts on Customer360, §7); Purchasing/Suppliers/Supplier360/Buying (SupplierCategory) (Purchasing P2); — Sales/Accounts/Customer360 (no classification in P3, a finding; Sales P3) |
| EditParty | AddIdentificationForm | Purchasing/Suppliers/Supplier360; People/Employees/Employee360 | — (Accounting/Payables/Supplier360 edits; Shared/Supplier360/Finance reads); — Purchasing: Supplier360's Payment details tab reads them (Purchasing P2); — People: Employee360's Personal information reads a person's identifications to HR, masked, no tax types, and adds none (People P2) |
| EditParty | IdentificationsForm | Purchasing/Suppliers/Supplier360; People/Employees/Employee360 | Shared/Supplier360/Finance (SupplierIdentifications); Purchasing/Suppliers/Supplier360/Finance (SupplierIdentifications, read) (Purchasing P2); People/Employees/Employee360 (Personal information: Identifications, HR only, read, values masked, no tax types) (People P2) |
| EditParty | AddSettingForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Defaults: OrganizationDefault, registered OrgInternal setting types only) (Admin P7) |
| EditParty | AddSettingTextForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Defaults: OrganizationDefault) (Admin P7) |
| EditParty | SettingsForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Defaults: OrganizationDefaults) (Admin P7) |
| EditParty | UpdateUserAccount | Admin/Users/UserDetail | Admin/Users/UserDetail (Account) (Admin P4) |
| EditParty | AddGroupForm | Admin/Users/UserDetail | Admin/Users/UserDetail (Access: AddMembership) (Admin P4) |
| EditParty | GroupsForm | Admin/Users/UserDetail | Admin/Users/UserDetail (Access: UserMemberships) (Admin P4) |
| EditParty | NewToRelForm | Shared/Customer360; Shared/Supplier360 | — (other apps' contexts on Customer360, §7) |
| EditParty | UserOrgRelList | Shared/Customer360; Shared/Supplier360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddSalesAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Sales/Accounts/ContactDetail (SalesContactAccounts: AddToAccount, add#Contact; Sales P3) |
| EditParty | AccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Sales/Accounts/ContactDetail (SalesContactAccounts: ContactAccounts, End; Sales P3) |
| EditParty | AddContactAssignForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); Sales/Accounts/Customer360/SalesContacts (AddAccountPerson, add#Contact; Sales P3) |
| EditParty | CreateContactForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); Sales/Accounts/Customer360/SalesContacts (NewAccountContact, create#Contact; Sales P3) |
| EditParty | ContactRelList | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Purchasing/Suppliers/Supplier360/Overview (SupplierContacts) (Purchasing P2); Sales/Accounts/Customer360/SalesContacts (SalesAccountContacts, End: delete#Contact; Sales P3) |
| EditParty | AddParentAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Sales/Accounts/Accounts (NewAccount's parent account; no later parent change in P3; Sales P3) |
| EditParty | ParentAccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Sales/Accounts/Customer360/SalesOverview (SalesAccountHierarchy, read; Sales P3) |
| EditParty | AddChildAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); — Sales/Accounts/Customer360 (a child account names its parent when it is created; Sales P3) |
| EditParty | ChildAccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7); Sales/Accounts/Customer360/SalesOverview (SalesAccountHierarchy, read; Sales P3) |
| EditParty | NewNoteForm | Commons/Contacts/ContactDetail; Shared/Chatter; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/Chatter; — Purchasing: Supplier360 has no notes; Commons/Contacts/ContactDetail keeps them (Purchasing P17); People/Employees/Employee360 (Files and activity: Shared/Chatter on the employment) (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | UpdateNoteForm | Commons/Contacts/ContactDetail; Shared/Chatter; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/Chatter; — Purchasing: Supplier360 has no notes; Commons/Contacts/ContactDetail keeps them (Purchasing P17); People/Employees/Employee360 (Files and activity: Shared/Chatter on the employment) (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | OtherCreateForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); — People: Employee360 shows the work email, phone and address read only and edits the private phones and home address alone; a person's work contacts are kept in Commons (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | PhonePurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); People/Employees/Employee360 (Personal information: home and mobile phones, dated, through store#PersonalInfo) (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | EmailPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); — People: Employee360 shows the work email, phone and address read only and edits the private phones and home address alone; a person's work contacts are kept in Commons (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | WebPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); — People: Employee360 shows the work email, phone and address read only and edits the private phones and home address alone; a person's work contacts are kept in Commons (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | OtherUpdateForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); — People: Employee360 shows the work email, phone and address read only and edits the private phones and home address alone; a person's work contacts are kept in Commons (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | OtherPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); — People: Employee360 shows the work email, phone and address read only and edits the private phones and home address alone; a person's work contacts are kept in Commons (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | PostalPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Purchasing/Suppliers/Supplier360/Overview (SupplierContacts, SupplierAddresses, read; Commons/Contacts/ContactDetail maintains) (Purchasing P2); People/Employees/Employee360 (Personal information: the home address, HR only, dated, through store#PersonalInfo) (People P2); Sales/Accounts/ContactDetail (ContactRecordSection, under the record's own party checks; Sales P3) |
| EditParty | FinancialAccountList | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#FinancialAccounts |
| EditParty | NewContentForm | Commons/Contacts/ContactDetail; Shared/RecordFiles; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/RecordFiles; — Purchasing: Supplier360 has no files; Commons/Contacts/ContactDetail keeps them (Purchasing P17); People/Employees/Employee360 (Files and activity: Shared/RecordFiles on the employment content host) (People P2); Sales/Accounts/Customer360/Files and Sales/Accounts/ContactDetail (record files; Sales P3) |
| EditParty | UpdateContentForm | Commons/Contacts/ContactDetail; Shared/RecordFiles; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/RecordFiles; — Purchasing: Supplier360 has no files; Commons/Contacts/ContactDetail keeps them (Purchasing P17); People/Employees/Employee360 (Files and activity: Shared/RecordFiles on the employment content host) (People P2); Sales/Accounts/Customer360/Files and Sales/Accounts/ContactDetail (record files; Sales P3) |
| ExpiredContactOther | PcmListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ExpiredContactOther | PcmTelecomListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ExpiredPostal | PcmListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| FindDuplicates | DupPartyList | Commons/Contacts/Duplicates; Sales/Accounts/MergeAccounts | Commons/Contacts/Duplicates; Sales/Accounts/MergeAccounts (DuplicateAccounts, MergeCompare; Sales P3) |
| UpdateContactInfo | UpdateContactInfo | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| UpdatePaymentMethodInfo | PaymentMethodInfoForm | Accounting/Settings/PaymentMethods | Accounting/Settings/PaymentMethods#NewMethod and EditMethod |
| FinancialInfo | UnpaidInvoiceList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerInvoices; Sales/Accounts/Customer360/SalesInvoices (SalesAccountInvoices, a finance reader's; Sales P3) |
| FinancialInfo | PaymentList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerReceipts; — Sales/Accounts/Customer360 (payments stay Accounting's; Sales P3) |
| FinancialInfo | OrderList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Orders#CustomerOrders; Sales/Accounts/Customer360/SalesOrders (SalesAccountOrders, an organization reader's until P11; Sales P3) |
| FinancialInfo | UnpaidPayablesList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierBills; Shared/Supplier360/Bills (SupplierBillRows; the unpaid summary for a finance reader) (Purchasing P6) |
| FinancialInfo | OutgoingPaymentList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierPayments; — Purchasing: the unpaid summary only (Shared/Supplier360/Bills); payments are Accounting's Supplier360 (Purchasing P6); Purchasing/Performance/SupplierStatement#SupplierStatementRows, a finance reader's (Purchasing P15) |
| FinancialInfo | PurchaseOrderList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | — (not built; Accounting/Payables/Supplier360 lists bills and payments, not purchase orders); Purchasing/Orders/PurchaseOrders (by supplier); Purchasing/Suppliers/Supplier360/PurchasingReceipts (its orders' receipts) (Purchasing P3, P5) |
| FinancialInfo | PaidInvoiceList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerInvoices; Sales/Accounts/Customer360/SalesInvoices (SalesAccountInvoices, a finance reader's; Sales P3) |
| FinancialInfo | PaidPayablesList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierBills; Shared/Supplier360/Bills (SupplierBillRows) (Purchasing P6); Purchasing/Performance/SupplierStatement#SupplierStatementRows (Purchasing P15) |
| FindParty | CreatePersonForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | CreatePersonCustForm |  |  |
| FindParty | CreateEmployeeForm | People/Employees/HireEmployee | People/Employees/HireEmployee (Identity: a person found, or a new one with work contacts; EmploymentTerms; ConfirmHire, over mantle.humanres.PeopleServices preview#Hire and hire#Employee, never create#PersonEmployee) (People P6) |
| FindParty | CreateOrganizationForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | CreateAccountForm |  |  |
| FindParty | CreateContactForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | OuterSearchForm | Commons/Contacts; People/Employees | Commons/Contacts/List; People/Employees/List (FindEmployees) (People P2) |
| FindParty | PartyListForm | Commons/Contacts; People/Employees | Commons/Contacts/List; People/Employees/List (EmployeeList, its CSV the directory export) (People P2) |
| EditAgreement | EditAgreement | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (EditAgreement) |
| EditAgreement | AddSettlementTerm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementTerm) |
| EditAgreement | AddOtherTerm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementTerm) |
| EditAgreement | AgreementTermList | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AgreementTerms) |
| EditAgreement | AddAgreementItem | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementItem) |
| EditAgreement | AgreementItemList | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AgreementItems) |
| EditAgreement | NewContentForm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail; Shared/RecordFiles | Purchasing/Agreements/AgreementDetail (AgreementUploadFile) |
| EditAgreement | UpdateContentForm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail; Shared/RecordFiles | — Purchasing: AgreementDetail's AgreementFiles uploads; a file is not edited after (F135) (Purchasing P13) |
| FindAgreement | NewAgreement | Purchasing/Agreements; Sales/Agreements/Agreements | Purchasing/Agreements/AgreementList (NewAgreement) |
| FindAgreement | AgreementList | Purchasing/Agreements; Sales/Agreements/Agreements | Purchasing/Agreements/AgreementList (AgreementFind, AgreementList) |
| PartyEmails | EmailMessageList | Comms/Inbox/MessageDetail; Shared/Chatter | Comms/Inbox/MessageDetail; Shared/Chatter |
| PartyProjects | AddUserAssignForm | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail |
| PartyProjects | UpdateUserAssignForm | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail |
| PartyRelated | NewToRelForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; People/Employees/OrgStructure (NewUnit and EditUnit: the unit's dated PrtOrgRollup to its parent; AddMember: a dated PrtMember, store#Unit and store#Membership) (People P3) |
| PartyRelated | NewFromRelForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; People/Employees/OrgStructure (EditUnit's lead and AddMember: dated PrtMember rows from the person, store#Membership); People/Employees/OrgChart (ChangeManager: a dated PrtManager line from the manager, change#Manager) (People P3) |
| PartyRelated | ToRelationshipForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; People/Employees/OrgStructure (UnitParents and TeamMembers: the dated rollups and memberships, ended by EndMember, never deleted) (People P3) |
| PartyRelated | FromRelationshipForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; People/Employees/OrgChart (ReportingTree: the dated reporting lines per employment, get#ReportingTree) (People P3); People/Employees/OrgStructure (AddMember, EndMember, UnitParents: a unit's dated memberships and place, People P3) |
| PartyRequests | AddUserForm | Projects/Requests/RequestDetail | Projects/Requests/RequestDetail |
| PartyRequests | UpdateUserForm | Projects/Requests/RequestDetail | Projects/Requests/RequestDetail |
| PartyTasks | AddUserAssignForm | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail |
| PartyTasks | UpdateUserAssignForm | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail |
| PartyTimeEntries | ClockInForm | Projects/Time/TimeEntries; People/Time/TimeEntries | — (Projects' work-time clock, impl-projects §7); People/Time/TimeEntries mounts Projects' screen as it is, and People's clock is SelfService's Clock over AttendancePunch (People P13) |
| PartyTimeEntries | WorkerInvoice | Projects/Billing/Unbilled |  |
| PartyTimeEntries | TimeEntryList | Projects/Time/TimeEntries; Projects/Resources/PersonDetail; People/Time/TimeEntries | Projects/Time/TimeEntries; Projects/Resources/PersonDetail; People/Time/TimeEntries |
| EditTimeEntry | AddTimeForm | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries |
| EditPaymentMethod | PaymentMethodInfoForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | Accounting/Banking/BankAccountDetail (record header) |
| EditPaymentMethod | NewContentForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; BankAccountDetail has no files) |
| EditPaymentMethod | UpdateContentForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; BankAccountDetail has no files) |
| EditPaymentMethod | UpdateBankAccountMutable | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; a bank account is described when added, Accounting/Banking/BankAccounts#AddBankAccount) |
| EditPaymentMethod | UpdatePaymentMethodMutable | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | Accounting/Settings/PaymentMethods#EditMethod |
| PaymentGatewayResponses | GatewayResponseList | Accounting/Payments/GatewayTransactions | Accounting/Payments/GatewayTransactions#GatewayTransactionResults |
| PaymentMethodChecks | CheckList | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | GenerateNachaFile | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | GeneratePosPayFile | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | FileList | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodTrans | AddTransForm | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail#AddBankLine |
| PaymentMethodTrans | UploadOfxV1Form | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport#StatementFile |
| PaymentMethodTrans | UploadBaiV2Form | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport#StatementFile |
| PaymentMethodTrans | AutoMatchReconcileForm | Accounting/Banking/ReconciliationDetail; Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail (Match automatically) |
| PaymentMethodTrans | TransList | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail#BankLines; Accounting/Banking/ReconciliationDetail#StatementLines |
| PaymentMethodTrans | ManRecForm | Accounting/Banking/ReconciliationDetail; Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail#ReconcileLine; Accounting/Banking/ReconciliationDetail#MatchLine |
| CreatePayment | CreatePaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#PaymentDraft; Accounting/QuickCreate/NewPayment#PaymentDraft |

## ProductStore (34 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditProductStore | CloneProductStoreForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail#CloneStoreForm |
| EditProductStore | EditStoreForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/General#StoreGeneral |
| EditProductStore | NewShippingOptionForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#AddShipOptionForm |
| EditProductStore | ShipOptionsForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#ShipOptions |
| EditProductStore | NewShippingGatewayForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#AddShipGatewayForm |
| EditProductStore | ShippingGatewaysForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#ShippingGateways |
| EditProductStore | NewPaymentGatewayForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#AddPaymentGatewayForm |
| EditProductStore | PaymentGatewayForm | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#PaymentGateways |
| EditProductStore | NewStoreDataDocumentForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/SearchContent#SetSearchDocumentForm |
| EditProductStore | StoreDataDocumentForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/SearchContent#SearchDocuments |
| FindProductStore | NewStoreForm | Commerce/Stores | Commerce/Stores/Stores#NewStoreForm |
| FindProductStore | StoresForm | Commerce/Stores | Commerce/Stores/Stores#StoreList |
| FindProductStoreCategory | NewStoreCategoryForm | Commerce/Merchandising/StoreCategories | Commerce/Merchandising/StoreCategoriesTui (StoreRoots); Commerce/Merchandising/StoreCategories (tree) (P3) |
| FindProductStoreCategory | StoreCategoriesForm | Commerce/Merchandising/StoreCategories | Commerce/Merchandising/StoreCategoriesTui (StoreRoots); Commerce/Merchandising/StoreCategories (tree) (P3) |
| FindProductStoreEmails | NewStoreEmailForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Emails#AddStoreEmailForm |
| FindProductStoreEmails | StoreEmailsForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Emails#StoreEmails |
| FindProductStoreFacility | NewStoreFacilityForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Facilities#AddStoreFacilityForm |
| FindProductStoreFacility | StoreFacilityFormList | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Facilities#StoreFacilities |
| FindProductStoreParty | NewStorePartyForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Staff#AddStoreStaffForm |
| FindProductStoreParty | StorePartyFormList | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Staff#StoreStaff |
| FindProductStoreSettings | SelectStoreSettingForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Settings#AddStoreSettingForm |
| FindProductStoreSettings | NewStoreSettingForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Settings#AddStoreSettingForm |
| FindProductStoreSettings | StoreSettingsForm | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail/Settings#StoreSettings |
| EditPromotion | EditPromotionForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail | Commerce/Promotions/PromotionDetail (Shared/PromotionDetail: PromotionForm) (P7) |
| EditPromotion | PromoParameterForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail | Commerce/Promotions/PromotionDetail (Shared/PromotionDetail: PromotionParameters, EditParameter) (P7) |
| EditPromotion | AddProductForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail | Commerce/Promotions/PromotionDetail (Shared/PromotionDetail: AddPromotionProductForm) (P7) |
| EditPromotion | ProductsForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail | Commerce/Promotions/PromotionDetail (Shared/PromotionDetail: PromotionProducts) (P7) |
| FindPromotion | NewPromotionForm | Shared/Promotions; Commerce/Promotions; Marketing/Promotions | Commerce/Promotions/Promotions (Shared/Promotions: NewPromotionForm) (P7) |
| FindPromotion | PromotionsForm | Shared/Promotions; Commerce/Promotions; Marketing/Promotions | Commerce/Promotions/Promotions (Shared/Promotions: PromotionFind, PromotionList) (P7) |
| EditPromoCode | EditPromoCodeForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail | Commerce/Promotions/PromoCodeDetail (Shared/PromoCodeDetail: CodeForm, Expire) (P7) |
| EditPromoCode | NewPromoCodePartyForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail | Commerce/Promotions/PromoCodeDetail (Shared/PromoCodeDetail: AddCodePartyForm) (P7) |
| EditPromoCode | PromoCodePartyForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail | Commerce/Promotions/PromoCodeDetail (Shared/PromoCodeDetail: CodeParties) (P7) |
| FindPromoCode | NewPromoCodeForm | Shared/PromoCodes; Commerce/Promotions/PromoCodes; Marketing/Promotions/PromoCodes | Commerce/Promotions/PromoCodes (Shared/PromoCodes: NewCodeForm, GenerateCodesForm) (P7) |
| FindPromoCode | PromoCodeForm | Shared/PromoCodes; Commerce/Promotions/PromoCodes; Marketing/Promotions/PromoCodes | Commerce/Promotions/PromoCodes (Shared/PromoCodes: CodeFind, CodeList) (P7) |

## Project (26 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditMilestones | CreateMilestoneForm | Projects/Projects/Roadmap | Projects/Projects/Roadmap |
| EditMilestones | MilestoneList | Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail | Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail |
| EditProject | CloneProject | Projects/Projects/NewProject; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Templates | Projects/Projects/NewProject; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Templates |
| EditProject | EditProject | Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings | Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings |
| EditRepositories | AddRepositoryForm | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | CreateRepositoryForm | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | RepositoryList | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | ProjectRefList | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags |
| EditUsers | AddUserAssignForm | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team |
| EditUsers | UpdateUserAssignForm | Projects/Projects/ProjectDetail/Team | Projects/Projects/ProjectDetail/Team |
| EditWikiPages | AddWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| EditWikiPages | DeleteWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| FindProject | NewProject | Projects/QuickCreate; Projects/Projects/NewProject | Projects/QuickProject; Projects/Projects/NewProject |
| FindProject | ListProjects | Projects/Projects | Projects/Projects/List |
| MilestoneSummary | InactiveTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| MilestoneSummary | ActiveTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| MilestoneSummary | DoneTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| ProjectProgressReport | ChildStatsListDays | Projects/Reports/Progress; Projects/Projects/ProjectDetail/Overview | Projects/Reports/Progress; Projects/Projects/ProjectDetail/Overview |
| ProjectProgressReport | MilestoneStatsList | Projects/Projects/MilestoneDetail; Projects/Reports/Progress | Projects/Projects/MilestoneDetail; Projects/Reports/Progress |
| ProjectSummary | ViewProject | Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | MilestoneList | Projects/Projects/ProjectDetail/Overview; Projects/Projects/Roadmap | Projects/Projects/ProjectDetail/Overview; Projects/Projects/Roadmap |
| ProjectSummary | ViewWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| ProjectSummary | ViewUserAssignForm | Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | ViewGitRepositoryList | Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | ViewGitTagList | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags |
| ProjectTimeEntries | TimeEntryListForm | Projects/Projects/ProjectDetail/Time; Projects/Time/TimeEntries | Projects/Projects/ProjectDetail/Time; Projects/Time/TimeEntries |

## Request (22 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRequest | EditRequest | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail (Shared/RequestDetail's Purchasing branch: the header and lines) (Purchasing P10); CustomerService/Cases/CaseDetail (header: Assign, Change priority, Move to queue, the moves; Customer Service P2); Maintenance/Requests/RequestDetail (the Commons header, Assign and the Maintenance box; Maintenance P4) |
| EditRequest | AddCommentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2); Maintenance/Requests/RequestDetail (Comment; Chatter under Maintenance; Maintenance P4) |
| EditRequest | AddPartyForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: the organization and requester are parties by role, set when filed (Purchasing P10); — Customer Service: the case's customer, contact and assignee are RequestParty roles, set by NewCase and CaseDetail's Assign (Customer Service P2); Maintenance/Requests/RequestDetail (Assign: triage#MaintenanceRequest; the reporter and organization are parties by role; Maintenance P4) |
| EditRequest | UpdatePartyForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: the organization and requester are parties by role, set when filed (Purchasing P10); — Customer Service: the case's customer, contact and assignee are RequestParty roles, set by NewCase and CaseDetail's Assign (Customer Service P2); Maintenance/Requests/RequestDetail (Assign; Maintenance P4) |
| EditRequest | NewNoteForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2); Maintenance/Requests/RequestDetail (Chatter under Maintenance; Maintenance P4) |
| EditRequest | UpdateNoteForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2); Maintenance/Requests/RequestDetail (Chatter under Maintenance; Maintenance P4) |
| EditRequest | NewContentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/RecordFiles; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/RecordFiles; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Files; Customer Service P2); Maintenance/Requests/RequestDetail (Files: RecordFiles under Maintenance; Commons/ReportProblem's photo; Maintenance P4) |
| EditRequest | UpdateContentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/RecordFiles; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/RecordFiles; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Files; Customer Service P2); Maintenance/Requests/RequestDetail (Files; Maintenance P4) |
| EditRequest | RequestTaskList | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; — Purchasing: a purchase request follows its sourcing, not linked work (CX-REQUEST) (Purchasing P10); CustomerService/Cases/CaseDetail (Work; Customer Service P2); Maintenance/Requests/RequestDetail (the request's work order, opening WorkOrderDetail; Maintenance P4) |
| RequestCommentReply | ReplyCommentForm | Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2) |
| RequestCommentUpdate | ReplyCommentForm | Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2) |
| EditRequestItems | NewRequestItemForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Purchasing/Requests/RequestDetail; Purchasing/Sourcing/QuoteRequestDetail (Add item, Purchasing P11); — Customer Service: a claim's product is set on Returns/WarrantyAssessment (P11) and an order change's lines on Orders/OrderChangeDetail (P10); CaseDetail adds no item |
| EditRequestItems | RequestItemListForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Purchasing/Requests/RequestDetail; Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Purchasing/Sourcing/QuoteRequestDetail (QuoteRequestItems, Purchasing P11); — Customer Service: CaseDetail has no Items tab (§7, F-P16-4); a claim's and an order change's items show on WarrantyAssessment and OrderChangeDetail (P10, P11) |
| EditTasks | AddRweForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: a purchase request follows its sourcing, not linked work (CX-REQUEST) (Purchasing P10); CustomerService/Cases/CaseDetail (Work tab: make or link work, Customer Service P2) |
| EditTasks | NewTaskForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: a purchase request follows its sourcing, not linked work (CX-REQUEST) (Purchasing P10); CustomerService/Cases/CaseDetail (Work, Add task; Customer Service P2) |
| EditTasks | UpdateRweForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: a purchase request follows its sourcing, not linked work (CX-REQUEST) (Purchasing P10); CustomerService/Cases/CaseDetail (Work tab, Customer Service P2) |
| EditUsers | AddUserForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: the requester and buyers by role, no request users (Purchasing P10); — Customer Service: the case's people by role (Assignee, Reporter), no request users (Customer Service P2) |
| EditUsers | UpdateUserForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; — Purchasing: the requester and buyers by role, no request users (Purchasing P10); — Customer Service: the case's people by role, no request users (Customer Service P2) |
| EditWikiPages | AddWprForm | Commons/Knowledge; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Knowledge | Commons/Knowledge; — Purchasing: no wiki pages on a purchase request (Purchasing P10); CustomerService/Cases/CaseDetail (template/CustomerServiceKnowledge.xml LinkSuggestedArticle (linkArticle); Customer Service P12); CustomerService/Knowledge/Knowledge (Link to case) |
| EditWikiPages | DeleteWprForm | Commons/Knowledge; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Knowledge | Commons/Knowledge; — Purchasing: no wiki pages on a purchase request (Purchasing P10); CustomerService/Cases/CaseDetail (template/CustomerServiceKnowledge.xml UnlinkLinkedArticle (unlinkArticle); Customer Service P12); CustomerService/Knowledge/Knowledge (Link to case) |
| FindRequest | NewRequestForm | Projects/Requests; Purchasing/Requests; CustomerService/Cases/NewCase; Maintenance/Requests; Sales/Quotes/QuoteRequests | Projects/Requests/List; Purchasing/Requests/PurchaseRequests; Purchasing/NewPurchaseRequest; Purchasing/Sourcing/QuoteRequests (NewQuoteRequest); Purchasing/NewQuoteRequest (Purchasing P11); CustomerService/Cases/NewCase (Customer Service P2; its template step, Customer Service P7); Commons/ReportProblem (Report a problem, from Maintenance/Requests and the + menu; Maintenance P4) |
| FindRequest | ListRequests | Commons/Requests; Projects/Requests; Purchasing/Requests; CustomerService/Cases/Cases; CustomerService/Home; Maintenance/Requests; Sales/Quotes/QuoteRequests | Commons/Requests/List; Projects/Requests/List; Purchasing/Requests/PurchaseRequests; CustomerService/Cases/Cases; CustomerService/Home (My cases; Customer Service P2); Maintenance/Requests/Find (Maintenance P4) |

## Return (8 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| AddOrderItems | LookBackDaysForm | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail#ReturnEligibleList (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#PurchasingReturnEligibleList (Shared/ReturnDetail); CustomerService/Returns/NewReturn (Customer Service P9); PASS:Support/RequestReturn (Customer Service P15) |
| AddOrderItems | AddOrderItemToReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail#AddReturnItem (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#AddReturnReceipt (Shared/ReturnDetail); CustomerService/Returns/NewReturn (Customer Service P9); PASS:Support/RequestReturn (Customer Service P15) |
| EditReturn | AuditLogList | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Conversation: the chatter's audited changes of the return; no item audit, P14); Purchasing/Returns/ReturnDetail (Conversation); CustomerService/Returns/ReturnDetail (Customer Service P9) |
| EditReturn | UpdateReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | — not built (P14): ReturnDetail edits a return only by adding eligible items; the header is set at Returns' New return; Purchasing/Returns/ReturnDetail (RecordSupplierRmaForm: the supplier's RMA) (Purchasing P8); CustomerService/Returns/ReturnDetail (Customer Service P9) |
| EditReturnItems | ReturnItemList | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail#AccountingReturnItems (Shared/ReturnDetail); Warehouse/Returns/ReturnDetail#ReturnItemList (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#PurchasingReturnItems (Shared/ReturnDetail); CustomerService/Returns/ReturnDetail (Customer Service P9) |
| FindReturn | CreateReturn | Warehouse/Returns/Returns; CustomerService/Returns/NewReturn | Warehouse/Returns/Returns#NewReturn; CustomerService/Returns/NewReturn (Customer Service P9) |
| FindReturn | CreateSupplierReturn | Warehouse/Returns/Returns; Purchasing/Returns | Warehouse/Returns/Returns#NewReturn; Purchasing/Returns/SupplierReturns#NewSupplierReturn |
| FindReturn | ReturnHeaderList | Warehouse/Returns/Returns; Purchasing/Returns; CustomerService/Returns/Returns; PASS:Support/MyReturns | Warehouse/Returns/Returns#ReturnList; Purchasing/Returns/SupplierReturns#SupplierReturnList; CustomerService/Returns/Returns (Customer Service P9); PASS:Support/MyReturns (Customer Service P15) |

## Shipment (46 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindShipment | NewOutgoingShipment | Warehouse/Shipping/Shipments | Warehouse/Shipping/Shipments (NewOutgoing, order parts) |
| FindShipment | NewIncomingShipment | Warehouse/Receiving/Receipts | Warehouse/Receiving/Receipts (NewReceipt); Warehouse/Receiving/NewReceipt |
| FindShipment | NewTransferShipment | Warehouse/Transfers/Transfers | Warehouse/Transfers/Transfers (NewTransfer); Warehouse/Transfers/NewTransfer (quick create) |
| FindShipment | ShipmentList | Warehouse/Receiving/Receipts; Warehouse/Shipping/Shipments; Warehouse/Transfers/Transfers; Purchasing/Receiving/Receipts | Warehouse/Receiving/Receipts (ReceiptList, incoming); Warehouse/Shipping/Shipments (ShipmentList, outgoing); Warehouse/Transfers/Transfers (TransferList, transfers and subcontract dispatches); Purchasing/Receiving/Receipts (ExpectedReceipts, the purchase order lines) |
| PackageTracking | EtaPackageList | Warehouse/Shipping/PackageTracking | Warehouse/Shipping/PackageTracking (TrackingList, P13) |
| ShipmentDetail | AuditLogList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Conversation: the chatter's audited changes of the shipment); Purchasing/Receiving/ShipmentDetail (Conversation) |
| ShipmentDetail | EditShipment | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — no header edit: Warehouse/Shipping/Ship checks the address (ValidateAddress), and a bought rate sets carrier and method (BuyRate); — Purchasing: no header edit; Receipts' PrepareReceipt makes the expected receipt (Purchasing P5) |
| ShipmentDetail | ItemLimitForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive (ReceiveSource, as designed); the detail mounts' lines are not paged; — Purchasing: the receipt's lines are not paged (Purchasing P5) |
| ShipmentDetail | PackScanForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackScan); Warehouse/Handheld/Pack (PackScan, the product scan); Shared/ShipmentDetail (outbound: Pack) |
| ShipmentDetail | PickScanForm | Warehouse/Picking/Pick; Warehouse/Handheld/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick (PickScan); Warehouse/Handheld/Pick (PickScan, the scans); Shared/ShipmentDetail (outbound: Pick) |
| ShipmentDetail | ShipmentOrderPaymentList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts show no payments; ShipmentDetail's OutboundLines show unit prices with financial read; — Purchasing: no payments on a receipt (Purchasing P5) |
| ShipmentDetail | ShipmentInvoicePaymentList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts show no payments; ShipmentDetail's OutboundLines show unit prices with financial read; — Purchasing: no payments on a receipt (Purchasing P5) |
| ShipmentDetail | AddParty | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts edit no shipment parties; the header names the supplier or the ship-to party; — Purchasing: no shipment parties (Purchasing P5) |
| ShipmentDetail | RolesForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts edit no shipment parties; the header names the supplier or the ship-to party; — Purchasing: no shipment parties (Purchasing P5) |
| ShipmentDetail | NewContentForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Shared/RecordFiles; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Files: shared record files); Purchasing/Receiving/ShipmentDetail (Files) |
| ShipmentDetail | UpdateContentForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Shared/RecordFiles; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Files: shared record files, a new version); Purchasing/Receiving/ShipmentDetail (Files) |
| ShipmentDetail | SendPlacedEmailForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts send no shipment email (P7: the receipt documents print instead); — Purchasing: no receipt email (Purchasing P5) |
| ShipmentDetail | EmailMessageList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: no shipment email list; the mounts' Conversation shows the shipment's messages; — Purchasing: no receipt email (Purchasing P5) |
| ShipmentDetail | ProduceAssembliesForm | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines, Pack component); Warehouse/Shipping/Pack (PackAssembly) |
| ShipmentDetail | AssemblyProduceProducts | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialHistory: kit receipts) |
| ShipmentDetail | AssemblyConsumeProducts | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines, MaterialHistory: issues) |
| ShipmentDetail | AddItemForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: lines come from the order (Receipts' NewReceipt, Shipments' NewOutgoing); Receive's AdHocReceipt takes stock with no order; — Purchasing: a receipt's lines come from its order part (ensure#PurchaseReceipt) (Purchasing P5) |
| ItemReserve | ReserveItem | Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered: reservation stays Mantle's order SECAs under P3's facility default; ShipmentDetail's OutboundLines show Reserved |
| ReceiveItem | ReceiveForm | Warehouse/Receiving/Receive; Warehouse/Handheld/Receive; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive (ReceiveLine); Warehouse/Handheld/Receive; Purchasing/Receiving/ShipmentDetail (PurchaseReceiveLine, through the receive guard) |
| UpdateItemAsset | UpdateForm | Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered (F36): a received asset's details are AssetDetail's Edit details and Lots' Correct (correct#LotMetadata) |
| ShipmentItems | AssemblyPackUnusedComponents | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (CompletePack: unused components return at complete#Pack) |
| ShipmentItems | SetPackedForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (CompletePack) |
| ShipmentItems | SetDeliveredForm | Warehouse/Shipping/PackageTracking; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/PackageTracking (RecordDelivery per package, P13) |
| ShipmentItems | AddItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: shipment lines come from order parts (Shipments' NewOutgoing, OrderDetail's Create shipment); — Purchasing: a receipt's lines come from its order part (ensure#PurchaseReceipt) (Purchasing P5) |
| ShipmentItems | ItemsOptionsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/ShipmentDetail (OutboundLines); Warehouse/Shipping/Pack (PackLines); Purchasing/Receiving/ShipmentDetail (PurchaseReceiptLines) (Purchasing P5) |
| ShipmentItems | PackItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackLines: Pack) |
| ShipmentItems | PackComponentsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (AssemblyComponents: Pack) |
| ShipmentItems | UpdateItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — no line edit: Warehouse/Picking/Pick (FinishPick, backorder) lowers each line to what was picked (update#ShipmentItem); — Purchasing: no line edit; a revision adjusts the expected receipt (adjust#ExpectedReceipt) (Purchasing P9) |
| ShipmentItems | AddItemToPackageForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackageContents: Move) |
| ShipmentItems | ItemSourceIssuanceList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/ShipmentDetail (OutboundLines: source, picked, packed); Warehouse/Shipping/Pack (PackLines: source, packed, Pack) |
| ShipmentItems | PaComponentPackForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (AssemblyComponents: Pack) |
| ShipmentItems | ItemAssetIssuanceList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | — no issuance list: Warehouse/Shipping/Pack (ReopenPackage names each packed asset, lot and serial); Inventory/Movements by shipment |
| ShipmentItems | ItemSourceReceiptList | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Returns/ReturnReceipt#ReturnShipmentLines (Shared/ShipmentDetail); Purchasing/Receiving/ShipmentDetail (PurchaseReceiptLines) |
| ShipmentItems | ItemAssetReceiptList | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Returns/ReturnReceipt#ReturnReceiptRows (Shared/ShipmentDetail); Purchasing/Receiving/ShipmentDetail (PurchaseReceiptRows) |
| ShipmentPackages | SetShippedForm | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (ShipConfirm, P13) |
| ShipmentPackages | PrintAllShipmentLabels | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Print labels, P13) |
| ShipmentPackages | PackageOptionsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Add package, Remove, Move) |
| ShipmentPackages | UpdatePackageForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| ShipmentPackages | RequestRetLabel | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Return labels, P13) |
| ShipmentPackages | PrintShipmentLabel | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Labels: View, Reprint, P13) |
| ShipmentPackages | ShipmentPackageContentList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackageContents, Reopen); Shared/ShipmentDetail (outbound: Packages) |

## Shipping (34 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| PackItems | ItemsOptionsForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines) |
| PackItems | PackItemForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines: Pack); Warehouse/Handheld/Pack (PackScan) |
| PackItems | UpdateItemForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | — no line edit: Warehouse/Picking/Pick (FinishPick, backorder) lowers each line to what was picked (update#ShipmentItem) |
| PackItems | AddItemToPackageForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackageContents: Move) |
| PackItems | ItemSourceIssuanceList | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines: source, picked, packed, Pack); Warehouse/Handheld/Pack (PackLines) |
| PackItems | ItemAssetIssuanceList | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | — no issuance list: Warehouse/Shipping/Pack (ReopenPackage names each packed asset, lot and serial); Inventory/Movements by shipment |
| PackPackages | PackageOptionsForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (Add package, Remove) |
| PackPackages | UpdatePackageForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| PackPackages | RequestRetLabel | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Return labels, P13) |
| PackPackages | PrintShipmentLabel | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Labels, P13) |
| PackPackages | ShipmentPackageContentList | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (PackageContents) |
| PackSummary | PrintAllShipmentLabels | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Ship (Print labels, P13) |
| PackSummary | SetShippedForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Ship (ShipConfirm, P13) |
| PackSummary | PackScanForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackScan); Warehouse/Handheld/Pack (PackScan) |
| PackSummary | ClosePackageForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| PackSummary | ShipmentPackageContentList | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackagesList, PackageContents) |
| PackCompleted | AssemblyPackUnusedComponents | Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack: unused components return) |
| PackCompleted | PackCompletedForm | Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack, no label) |
| PickLocationMoves | PickMoveList | Warehouse/Picking/PickLocationMoves | Warehouse/Picking/PickLocationMoves (PickFaceNeeds) |
| QuickMove | ScanMoveAssetForm | Warehouse/Picking/PickLocationMoves | Warehouse/Picking/PickLocationMoves (QuickPickMove) |
| AddOrder | AddOrderList | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AddOrderToPicklist) |
| AddShipment | AddShipmentList | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AddShipmentToPicklist) |
| BulkPicklist | CreatePicklistsForm | Warehouse/Picking/CreatePicklists | Warehouse/Picking/CreatePicklists (LoadSelection, LoadCreate) |
| BulkPicklist | AddOrderList | Warehouse/Picking/CreatePicklists | Warehouse/Picking/CreatePicklists (PreviewGroups, PreviewExcluded) |
| FindPicklist | NewPicklist | Warehouse/Picking/Picklists | Warehouse/Picking/Picklists (NewPicklist) |
| FindPicklist | PicklistList | Warehouse/Picking/Picklists | Warehouse/Picking/Picklists (PicklistList) |
| PicklistDetail | UpdateShipmentLoad | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (EditPicklist, CompletePicklist) |
| PicklistDetail | ListShipments | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadShipments) |
| PicklistDetail | AddPartyAssignForm | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AssignPerson) |
| PicklistDetail | UpdateAssignForm | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadPeople, End) |
| PicklistDetail | AddAsset | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AssignEquipment) |
| PicklistDetail | UpdateAssetAssign | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadEquipment, End) |
| dashboard | PackShipmentForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (ShipmentsToPack); Warehouse/Handheld/Pack (ScanWork) |
| dashboard | FacilitySummary | Warehouse/Home | Warehouse/Home (queue cards, QueueRows, stock indicators) |

## SimpleReport (9 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditReport | EditDataDocument | Insights/ReportBuilder/DatasetDetail | Insights/ReportBuilder/DatasetDetail (EditDataDocument) |
| FieldList | AddCondition | Insights/ReportBuilder/DatasetFields | Insights/ReportBuilder/DatasetFields (AddConditionForm) |
| FieldList | ConditionList | Insights/ReportBuilder/DatasetFields | Insights/ReportBuilder/DatasetFields (ConditionList) |
| FieldList | FieldList | Insights/ReportBuilder/DatasetFields | Insights/ReportBuilder/DatasetFields (FieldList, AddFieldForm) |
| FindReport | CreateDataDocument | Insights/ReportBuilder/Datasets | Insights/ReportBuilder/Datasets (CreateDatasetForm) |
| FindReport | DataDocumentList | Insights/ReportBuilder/Datasets | Insights/ReportBuilder/Datasets (DatasetFind, DatasetList) |
| QuickViewReport | DataDocumentList | Insights/Reports; Insights/SavedReports | Insights/Reports (ReportFind, ReportCatalog); Insights/SavedReports (SavedFind, SavedReportList) |
| ViewReport | ExportDocuments | Insights/ReportBuilder/DatasetView | Insights/ReportBuilder/DatasetView (ExportDocumentsForm) |
| ViewReport | DataViewList | Insights/ReportBuilder/DatasetView | Insights/ReportBuilder/DatasetView (DatasetOptions, DataViewList) |

## Supplier (4 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindSupplier | CreatePersonForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (CreateSupplierPerson) |
| FindSupplier | CreateOrganizationForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (CreateSupplierOrganization, DuplicateCandidates) |
| FindSupplier | OuterSearchForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (SupplierList find) |
| FindSupplier | SupplierListForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (SupplierList) |

## Survey (14 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditSurvey | EditSurveyForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (Shared/SurveyFormDetail: FeedbackFormHeader, Rename, Publish) (Customer Service P13) |
| EditSurvey | NewUserGroupForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | — CustomerService/Settings/FeedbackFormDetail (FormAccess: who may change and read it, from the permissions Mantle checks; no per-form group grant, F-P13-6) (Customer Service P13) |
| EditSurvey | UserGroupForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | — CustomerService/Settings/FeedbackFormDetail (FormAccess, read only, F-P13-6) (Customer Service P13) |
| Fields | NewDbFormFieldForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (FormFields: Add question, through mantle.request.CaseFeedbackServices.save#FeedbackFormField) (Customer Service P13) |
| Fields | SurveyPreview | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (FormPreview, drafts included); PASS:Support/Feedback (CaseFeedback) (Customer Service P13) |
| Fields | DbFormFieldList | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (FormFields: Edit, End; the rules) (Customer Service P13) |
| Fields | NewFieldOptionForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (a question's options as value | label lines; the value of the rating its score) (Customer Service P13) |
| Fields | FieldOptionForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail | CustomerService/Settings/FeedbackFormDetail (FieldOptions: the options and scores, End) (Customer Service P13) |
| FindSurvey | NewSurveyForm | CustomerService/Settings/FeedbackForms; Marketing/Surveys | CustomerService/Settings/FeedbackForms (Shared/SurveyForms: NewFeedbackForm, through create#FeedbackForm) (Customer Service P13) |
| FindSurvey | SurveyList | CustomerService/Settings/FeedbackForms; Marketing/Surveys | CustomerService/Settings/FeedbackForms (Shared/SurveyForms: FeedbackFormList) (Customer Service P13) |
| ResponseDetails | ResponseDetailsForm | CustomerService/Reports/ResponseDetail; Marketing/Surveys/ResponseDetail | CustomerService/Reports/ResponseDetail (Shared/SurveyResponseDetail: ResponseDetails, FeedbackFollowUp) (Customer Service P13) |
| ResponseStats | TextDbFormFieldResponseCountList | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses | CustomerService/Reports/SatisfactionResults (Shared/SurveyResponses: CsatStats, the comments counted) (Customer Service P13) |
| ResponseStats | FieldOptionForm | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses | CustomerService/Reports/SatisfactionResults (CsatStats: the score distribution of one period) (Customer Service P13) |
| Responses | ResponseListForm | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses | CustomerService/Reports/SatisfactionResults (CsatFind, CsatResponseList) (Customer Service P13) |

## Task (32 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRelated | AddRelatedToForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | AddRelatedFromForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | DeleteRelatedToForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | DeleteRelatedFromForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRequests | AddRweForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRequests | DeleteRweForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditSource | AddCommitForm | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail |
| EditSource | AddRefForm | Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail | Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail |
| EditSource | TaskCommitList | Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Commits | Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Commits |
| EditSource | TaskRefList | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTask | EditTask | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | ClockInForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | AddTaskTime | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | TimeEntryList | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditUsers | AddUserAssignForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditUsers | AddTeamAssignForm | Projects/Projects/ProjectDetail/Team; Projects/WorkItems/WorkItemDetail | Projects/Projects/ProjectDetail/Team; Projects/WorkItems/WorkItemDetail |
| EditUsers | UpdateAssignForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditWikiPages | AddWpweForm | Commons/Knowledge; Projects/WorkItems/WorkItemDetail | Commons/Knowledge |
| EditWikiPages | DeleteWpweForm | Commons/Knowledge; Projects/WorkItems/WorkItemDetail | Commons/Knowledge |
| FindTask | SearchOptions | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | NewTaskForm | Commons/Tasks; Projects/QuickCreate; Projects/WorkItems | Commons/Tasks/List; Projects/QuickCreate; Projects/WorkItems/List |
| FindTask | ListTasks | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | AssignTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | UnAssignTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | UpdateTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| TaskSummary | ClockInForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskSummary | AddCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |
| TaskSummary | NewChildTaskForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskSummary | NewContentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles | Commons/Tasks/TaskDetail; Shared/RecordFiles; Projects/WorkItems/WorkItemDetail |
| TaskSummary | UpdateContentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles | Commons/Tasks/TaskDetail; Shared/RecordFiles; Projects/WorkItems/WorkItemDetail |
| TaskCommentReply | ReplyCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |
| TaskCommentUpdate | ReplyCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |

## Vendor (10 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditUsers | AddUserRelationshipForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Members: AddMember) (Admin P7) |
| EditUsers | UpdateUserRelForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Members: OrganizationMembers, End) (Admin P7) |
| EditVendor | PaymentInfo | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Contacts: OrganizationContacts; payment instruments stay Accounting's) (Admin P7) |
| EditVendor | SetVendorRepForm | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Members: AddMember, Representative) (Admin P7) |
| EditVendor | BillingInfo | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Contacts: OrganizationContacts) (Admin P7) |
| EditVendor | EditVendor | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Profile: OrganizationProfile, OrganizationParent) (Admin P7) |
| EditVendor | RoleList | Admin/Settings/OrganizationDetail | — (Admin P7: OrganizationDetail shows the OrgInternal organization; other roles are their owners', design-admin §7) |
| FindVendor | FindVendor | Admin/Settings/Organizations | Admin/Settings/Organizations (OrganizationFind) (Admin P7) |
| FindVendor | CreateVendor | Admin/Settings/Organizations | Admin/Settings/Organizations (CreateOrganization) (Admin P7) |
| FindVendor | VendorList | Admin/Settings/Organizations | Admin/Settings/Organizations (OrganizationList) (Admin P7) |

## Wiki (18 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditWikiBlog | EditBlogForm | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiBlog | AddCategory | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiBlog | CategoriesForm | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiPage | EditPageForm | Commons/Knowledge; Marketing/Content/Knowledge; Marketing/Content/BlogPosts/BlogPostDetail | Commons/Knowledge |
| EditWikiSpace | CloneSpace | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| EditWikiSpace | EditSpace | Commons/Knowledge/Spaces | Commons/Knowledge/SpaceDetail |
| WikiBlogs | AddBlogPage | Marketing/Content/BlogPosts |  |
| WikiBlogs | AddBlogText | Marketing/Content/BlogPosts |  |
| WikiBlogs | WikiBlogList | Marketing/Content/BlogPosts |  |
| WikiSpaces | NewSpace | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| WikiSpaces | WikiSpaceList | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| wiki | AddPageForm | Commons/Knowledge | Commons/Knowledge |
| wiki | ClonePage | Commons/Knowledge | Commons/Knowledge |
| wiki | AddCommentForm | Commons/Knowledge; Shared/Chatter | Commons/Knowledge; Shared/Chatter |
| wiki | UploadAttachment | Commons/Knowledge; Shared/RecordFiles | Commons/Knowledge |
| wiki | AddCategory | Commons/Knowledge; Commons/Notes | Commons/Knowledge; Commons/Notes |
| wiki | CategoriesForm | Commons/Knowledge; Commons/Notes | Commons/Knowledge; Commons/Notes |
| WikiCommentReply | ReplyCommentForm | Commons/Knowledge; Shared/Chatter | Commons/Knowledge; Shared/Chatter |

## BasicHandheld (Warehouse handheld) (16 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| ReceiveAsset | ScanAssetForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Receive (ScanReceipt) |
| ReceiveAsset | ActiveFacilityForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Home (FacilityPicker) |
| ReceiveAsset | ReceiveAssetForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Receive (ReceiveLine; AdHocReceipt is the desk Receive's) |
| SelectAsset | ScanAssetForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (HandheldMoveForm) |
| SelectAsset | ActiveFacilityForm | Warehouse/Handheld/Move | Warehouse/Handheld/Home (FacilityPicker) |
| SelectAsset | ScanMoveAssetForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (HandheldMoveForm) |
| SelectAsset | ContainerAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | LocationAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | ProductNoLocAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | RecentMoveForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (RecentMoves) |
| SelectAsset | RecentContainerMoveForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (RecentMoves) |
| PickLocationMoves | ActiveFacilityForm | Warehouse/Picking/PickLocationMoves; Warehouse/Handheld/PickFace | Warehouse/Handheld/Home (FacilityPicker) |
| PickLocationMoves | PickMoveList | Warehouse/Picking/PickLocationMoves; Warehouse/Handheld/PickFace | Warehouse/Handheld/PickFace (BelowMinimum, QuickPickMove) |
| dashboard | ActiveFacilityForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (FacilityPicker) |
| dashboard | ScanAssetForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (ScanAnything) |
| dashboard | PackShipmentForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (ScanAnything: a shipment's Pack it) |

## Shared root screens (5 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| Search | SearchOptions | Commons/Search | Commons/Search |
| Search | SearchResults | Commons/Search | Commons/Search |
| QuickSearch | SearchOptions | — | — |
| QuickSearch | SearchResults | — | — |
| QuickLookup | QuickLookupForm | — | — |

Accounting P0–P3 (Oct 29): foundation lists/drafts, ledger/configuration editors, reports, batches/templates and files
are implemented. Coverage above names the built forms. Posted financial rewrite, arbitrary period editing/close,
full invoice/bill/payment workflows, gateway operations and banking remain outside this phase; those parity cells
remain blank. Numbering/templates, due-only terms and masked method metadata are documented in AccountingImplementation.

Accounting P4–P5 (reworked on Mantle's services in impl-accounting R2): invoice sending, batches and statements,
the shared customer and invoice contexts, settlement, payment state changes and unapplication, gateway actions and
lookup, manual and gateway refunds, and internal transfers are implemented. The internal transfer forms have no
SimpleScreens form to claim. The raw refund-link forms are not used: refunds go through `create#RefundPayment`.
Payable intake and holds, payment runs, bank sessions and the later phases' forms remain planned.

Accounting P6: bill intake (upload and from an order or receipt), holds and approval, expense posting, the supplier's
finance context, the order and shipment Accounting contexts and Approvals are implemented. BillDetail carries
InvoiceDetail's tabs, so the invoice tab forms name both. Matching (InvoiceMatch) is P7 and payment runs P8.

Accounting P7: bill matching is implemented as BillDetail's Match tab (Shared/InvoiceMatch), which applies a bill's lines
to purchase order lines and their receipts, so the order application forms of a bill name it; the shipment application
forms (ApplyToShipment, ApplyItemToShipment) stay open, since a match links receipts, not shipment item sources. The
match policy and the legacy backfill have no SimpleScreens form.
