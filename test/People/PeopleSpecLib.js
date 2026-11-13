// Helpers the People specs share: the demo ids (data/BossPeopleDemoData.xml, data/BossUsersDemoData.xml), the demo users by
// group, a block run as a user with artifact authorization on, a call's refusal message, a People page render and the shell's menu
// and providers. Later phases add their ids and users here. P31 adds the acceptance sweeps' and review walks' helpers at the end (the
// mounts, their tabs and records, a kiosk tablet), which no regression spec calls.
const ids = {
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // Retail's employees: Hannah (people.manager) leads Tomas (people.employee), Ines and Rafael; Leon has no manager; Walter's
    // employment ended; Priya is employed by Retail and Services
    managerPartyId: "BOSS_PPL_HANNAH",
    employeePartyId: "BOSS_PPL_TOMAS",
    reportPartyId: "BOSS_PPL_INES",
    unmanagedPartyId: "BOSS_PPL_LEON",
    endedPartyId: "BOSS_PPL_WALTER",
    dualPartyId: "BOSS_PPL_PRIYA",
    // Services' employee, and Retail's contractor (an agent, not an employee)
    otherEmployeePartyId: "BOSS_PPL_KENJI",
    contractorPartyId: "BOSS_PPL_NADIA",
    // P2: the employments of Tomas (Retail) and Kenji (Services), the employment content hosts
    employmentId: "BOSS_PPL_TOMAS_EMP",
    otherEmploymentId: "BOSS_PPL_KENJI_EMP",
    // P3: Retail's Store Operations department with its Sales Floor team (lead Ines; Tomas), Services' Service Delivery
    // department; Priya reports to Greta at Retail and to Amara at Services
    departmentId: "BOSS_PPL_D_STORE",
    teamId: "BOSS_PPL_T_FLOOR",
    otherDepartmentId: "BOSS_PPL_D_DELIVERY",
    // P4: Retail's sales associate seats in Store Operations (Tomas holds the first, the third is vacant), Services' technician
    // seat (Kenji's), the sales associate class and the Associate grade (Retail's)
    positionId: "BOSS_PPL_P_ASSOC1",
    vacantPositionId: "BOSS_PPL_P_ASSOC3",
    merchPositionId: "BOSS_PPL_P_MERCH",
    otherPositionId: "BOSS_PPL_P_TECH1",
    jobClassId: "BOSS_PPL_JC_ASSOC",
    payGradeId: "BOSS_PPL_PG_ASSOC",
    // the Lead grade, shared by Retail and Services (Associate and Manager are Retail's)
    sharedPayGradeId: "BOSS_PPL_PG_LEAD",
    // the menu of design §1.2 built so far: every People user's, and with Settings the People administrator's; Employees holds
    // the directory, Organization and Org chart; Staffing (Positions & recruiting) the positions, job classes and pay grades; P5:
    // Approvals (every People user's own), and Settings' tabs the approval rules and lookups; P10: Time & leave (every People
    // user's) and Payroll (the payroll groups', and the administrator's through the root's ALWAYS); P15: Expenses (every People
    // user's); P18: Skills & training (Development, every People user's); P20: Reviews & goals (Performance, every People user's)
    staffMenu: ["Home", "Approvals", "Employees", "Staffing", "Time", "Expenses", "Development", "Performance"],
    adminMenu: [
        "Home",
        "MyTeam",
        "Approvals",
        "Employees",
        "Staffing",
        "Time",
        "Payroll",
        "Expenses",
        "Development",
        "Performance",
        "Reports",
        "Settings"
    ],
    // P8: My team, the managers' (and the administrator's, through the root's ALWAYS)
    managerMenu: ["Home", "MyTeam", "Approvals", "Employees", "Staffing", "Time", "Expenses", "Development", "Performance"],
    // P29: Reports, the readers of a report's (HR, recruiting, development, payroll; BOSS_PPL_REPORTS)
    hrMenu: ["Home", "Approvals", "Employees", "Staffing", "Time", "Expenses", "Development", "Performance", "Reports"],
    payrollMenu: [
        "Home",
        "Approvals",
        "Employees",
        "Staffing",
        "Time",
        "Payroll",
        "Expenses",
        "Development",
        "Performance",
        "Reports"
    ],
    // P15: Expenses' menu, every People user's (and a self-service employee's by the area's own grant)
    expensesMenu: ["ExpenseClaims", "EmployeeAdvances"],
    // P18: Skills & training's menu: the skills matrix development's, HR's and the managers', the qualifications every People user's;
    // P19: training every People user's
    developmentMenu: ["SkillsMatrix", "Qualifications", "Training"],
    readerDevelopmentMenu: ["Qualifications", "Training"],
    // P20: Reviews & goals' menu: the reviews and goals every People user's, the review cycles and review forms the review
    // administrator's
    performanceMenu: ["Reviews", "Goals"],
    developPerformanceMenu: ["Reviews", "Goals", "ReviewCycles", "ReviewForms"],
    // Time & leave's menu: P10's time screens (Projects' mounted, every People user's); P9's working schedules (HR's and the
    // managers') and holidays (HR's); P11's leave balances (HR's and the managers'), leave policies and allocations (HR's); P12's
    // leave requests and team calendar (every People user's); P13's attendance (every People user's); P14's shift roster (HR's and
    // the managers')
    timeMenu: ["Timesheets", "MyTime", "TimeEntries", "LeaveRequests", "TeamCalendar", "Attendance"],
    hrTimeMenu: [
        "Timesheets",
        "MyTime",
        "TimeEntries",
        "LeaveRequests",
        "WorkingSchedules",
        "TeamCalendar",
        "LeaveBalances",
        "Attendance",
        "HolidayCalendars",
        "LeavePolicies",
        "LeaveAllocations",
        "ShiftRoster"
    ],
    // P24: the managers' Hours for pay (their reports' hours), after the shift roster
    managerTimeMenu: [
        "Timesheets",
        "MyTime",
        "TimeEntries",
        "LeaveRequests",
        "WorkingSchedules",
        "TeamCalendar",
        "LeaveBalances",
        "Attendance",
        "ShiftRoster",
        "HoursForPay"
    ],
    // P16: Forms, the survey builder with People's registration
    settingsMenu: ["SettingsHome", "ApprovalPolicies", "Lookups", "Forms", "Preferences"],
    // P10: Rates; P22 (its review's call of Nov 12, 2026): payroll configuration's components, structures and groups, payroll's;
    // P23: pay assignments, before Rates; P24: pay adjustments, after them
    // P25: pay runs first; P26: payslips after them; the P27 review (the user's call of Nov 13, 2026): overpayment recovery after
    // pay groups; P28: the payroll exchange after it
    payrollGroupMenu: [
        "PayRuns",
        "Payslips",
        "PayAssignments",
        "PayAdjustments",
        "Rates",
        "PayComponents",
        "PayStructures",
        "PayGroups",
        "PayRecovery",
        "PayrollExchange"
    ],
    // P21: Grievances, every People user's
    employeesMenu: ["List", "OrgStructure", "OrgChart", "Grievances"],
    // P7 (the user's call, Nov 11): HR's Checklists and Employee import are in Employees, HR's area, not in Settings
    hrEmployeesMenu: ["List", "OrgStructure", "OrgChart", "Grievances", "ChecklistTemplates", "EmployeeImport"],
    // P16: Openings, Applicants and Interviews, every People user's (Mantle decides what each reads)
    staffingMenu: ["Positions", "JobClasses", "PayGrades", "Openings", "ApplicantPipeline", "InterviewsCalendar"],
    // the HR officer's keys (P8's g m, My team, is shown only to whom My team opens; P9's g w, Working schedules, to HR and managers;
    // P10's g t, Timesheets, to every People user, and g r, Rates, to payroll; P11's g b, Leave balances, to HR and managers; P12's
    // g l, Leave requests, to every People user; P13's g d, Attendance, to every People user; P14's g h, Shift roster, to HR and
    // managers; P15's g x, Expense claims, and P16's g n, Openings, and g v, Interviews, to every People user; P18's g k, Skills
    // matrix, to development, HR and managers, and g q, Qualifications, to every People user; P19's g i, Training, to every People
    // user; P20's g f, Reviews, to every People user)
    keys: [
        "g p",
        "g e",
        "g o",
        "g c",
        "g s",
        "g a",
        "g w",
        "g t",
        "g b",
        "g l",
        "g d",
        "g h",
        "g x",
        "g n",
        "g v",
        "g k",
        "g q",
        "g i",
        "g f"
    ],
    // P5: Retail's planned seasonal seat in Store Operations (led by Hannah, people.manager), which the acceptance asks to activate
    plannedPositionId: "BOSS_PPL_P_ASSOC4",
    // P16: an approved active seat of Retail (vacant) and one of Services, the seats the recruiting specs open openings on
    openingSeatId: "BOSS_PPL_P_ASSOC3",
    otherOpeningSeatId: "BOSS_PPL_P_TECH2",
    // P7: Retail's onboarding and offboarding checklists, and the laptop Ines holds
    onboardingId: "BOSS_PPL_CHK_START",
    offboardingId: "BOSS_PPL_CHK_LEAVE",
    laptopAssetId: "BOSS_PPL_LAPTOP_INES",
    // P9: Retail's store week (America/Chicago, followed by nobody in the demo) and Retail's holiday calendar
    scheduleId: "BOSS_PPL_WS_STORE",
    holidayCalendarId: "BOSS_PPL_HOL_RETAIL",
    // P10: Manufacturing's demo labor costing rate (RaprCost since P10), which People's Rates shows read only
    costingRateId: "BOSS_MFG_RATE_RUN",
    // P11: Retail's annual leave policy (monthly accrual, nobody under it in the demo)
    leavePolicyId: "BOSS_PPL_LP_ANNUAL",
    // P12: Ines's employment (Retail), whose leave requests her manager Hannah does not decide (Ines leads the floor team)
    reportEmploymentId: "BOSS_PPL_INES_EMP",
    // P13: the time-and-attendance import target (Mantle's TransferTarget) and its owner route
    timeImportTargetId: "timeAndAttendance",
    // P18: first aid (a sales associate's requirement, proved by a first aid certificate; Tomas lacks it), Rafael (a sales associate
    // with a verified first aid certificate and a verified work permit, whose number is HR's and his alone) and Kenji's electrical
    // safety certificate (Services')
    firstAidSkillId: "BOSS_PPL_SK_FIRSTAID",
    firstAidTypeId: "BOSS_PPL_QT_FIRSTAID",
    posSkillId: "BOSS_PPL_SK_POS",
    serviceSkillId: "BOSS_PPL_SK_SERVICE",
    associatePartyId: "BOSS_PPL_RAFAEL",
    workPermitId: "BOSS_PPL_QL_RAFAEL_PERMIT",
    firstAidId: "BOSS_PPL_QL_RAFAEL_AID",
    otherQualificationId: "BOSS_PPL_QL_KENJI_ELEC",
    // P19: Retail's fire warden course (assessed, granting the fire warden certificate for 24 months)
    fireWardenCourseId: "BOSS_PPL_TC_FIREWARDEN",
    fireWardenTypeId: "BOSS_PPL_QT_FIREWARDEN",
    // P21: Retail's confidential case intake handler (people.case; Retail's PartySetting PeopleCaseIntake)
    caseHandlerPartyId: "BOSS_PPL_CASE",
    // P20: Retail's annual review template (a self assessment and the reviewer's, no approval, no form)
    reviewTemplateId: "BOSS_PPL_RT_ANNUAL"
}
// The demo users of each group (each but the administrator and the employee also in BOSS_PEOPLE), agents of Ziziwork Retail but
// the manager and the employee (Retail's employees) and the administrator (Retail and Services), none in ADMIN; a Projects client
// contact, a PASS public account and another app's user; and an instance administrator (ADMIN).
const users = {
    reader: "people.reader",
    employee: "people.employee",
    manager: "people.manager",
    hr: "people.hr",
    recruiter: "people.recruiter",
    payroll: "people.payroll",
    payApprover: "people.payapprover",
    develop: "people.develop",
    caseHandler: "people.case",
    admin: "people.admin",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    // P27 review: Accounting's payroll finance (BOSS_ACCOUNTING_PAYROLL, PAYROLL_VIEW), an agent of Accounting's demo organization;
    // P31 review: it reads nothing of People (PAYROLL_VIEW alone is no People read)
    financePayroll: "finance.payroll",
    system: "john.doe"
}

// Run action as username with artifact authorization enabled, then sign in again as the user before.
function asUser(username, action) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A People screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a widget's
// render error counted among the errors; root names another app's root for a shared screen's mount (Commons, Insights).
function page(path, parameters = {}, mode = "qvt", root = "People") {
    const renderer = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a refusal
// name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// A path under the web root as the user (the REST APIs, menu and shell data): its status, output and whether it was refused.
function hit(path, parameters = {}) {
    const result = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, null)
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
    }
}
// The shell's menu of People and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data
// (the launcher and providers). path and group give another level of the menu (P3: Employees' group).
function shell(user, menuOnly = false, path = "Home", group = "People") {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen
            .makeTest()
            .rootScreen(root)
            .render("menuData/apps/People/" + path, {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === group) : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "People")?.providers
        }
    })
}

// ===== P31: the screen sweeps' helpers (acceptance/People/PeopleTui and PeopleServerStatic; the review walks' kiosk) =====
// The screens People's files mount from elsewhere, as [path under the People root, location]: a subscreens-item of a People file whose
// location is not under screen/People (the Shared screens, Projects' time screens and Rates, Commons' Notifications and EventDetail)
function mountedScreens() {
    const files = []
    ec.resource.getLocationReference("component://mr-boss/screen/People.xml").walkChildTree(files, null)
    const found = []
    for (const file of files) {
        if (!file.location.endsWith(".xml")) continue
        const parent = file.path === "People" ? "" : file.path.substring("People/".length) + "/"
        const text = String(ec.resource.getLocationReference(file.location).getText())
        const item = /<subscreens-item name="([^"]+)" location="(component:\/\/mr-boss\/screen\/(?!People\/)[^"]+\.xml)"/g
        for (let match = item.exec(text); match; match = item.exec(text)) found.push([parent + match[1], match[2]])
    }
    return found
}
// The tabs of a mounted screen that the current user's menu shows under People (a shared screen's tabs of another app's context are
// not offered there), as paths under the root; none when its menu names none
function mountTabs(path, parameters = {}) {
    const name = path.substring(path.lastIndexOf("/") + 1)
    const query = Object.entries(parameters)
        .map(([key, value]) => key + "=" + encodeURIComponent(value))
        .join("&")
    const menu = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("menuData/apps/People/" + path + (query ? "?" + query : ""), {}, null)
    ec.message.clearErrors()
    if (menu.status != 200) return []
    const level = JSON.parse(menu.output)
        .filter(level => level.name === name)
        .pop()
    return (level?.subscreens || []).filter(item => item.menuInclude).map(item => path + "/" + item.name)
}
// The record a swept screen opens on: the demo's fixed ids, else the first record of its kind (made by the demo or by the specs that
// ran before; "NONE" when there is none, which renders the screen's own "not available" state, a render too). Read once per spec.
let sweepRecordsMade = null
function sweepRecords() {
    if (sweepRecordsMade) return sweepRecordsMade
    const first = (entity, field, conditions = {}) =>
        system(
            () =>
                Array.from(ec.entity.find(entity).condition(conditions).selectField(field).orderBy(field).limit(1).list())[0]?.[
                    field
                ] || "NONE"
        )
    const org = {organizationPartyId: ids.organizationId}
    const employment = {recordEntity: "mantle.humanres.employment.Employment", recordId: ids.employmentId}
    const applicationId = first("mantle.humanres.employment.EmploymentApplication", "employmentApplicationId")
    const claimId = first("mantle.humanres.expense.ExpenseClaim", "invoiceId")
    const offerId = first("mantle.humanres.recruitment.EmploymentOffer", "employmentOfferId")
    const reviewId = first("mantle.humanres.ability.PerformanceReview", "performanceReviewId")
    const timesheetId = first("mantle.work.time.Timesheet", "timesheetId")
    sweepRecordsMade = {
        Home: org,
        Chatter: employment,
        RecordFiles: employment,
        // the Assist answers' response actions open on an application (Log as note) and from any page (Send as message)
        LogNote: {entityName: "mantle.humanres.employment.EmploymentApplication", recordId: applicationId},
        SendMessage: {entityName: "mantle.humanres.employment.EmploymentApplication", recordId: applicationId},
        "Employees/List": org,
        "Employees/Employee360": {partyId: ids.employeePartyId, partyRelationshipId: ids.employmentId},
        "Employees/EquipmentDetail": {assetId: ids.laptopAssetId},
        "Employees/RequestDetail": {requestId: first("mantle.request.Request", "requestId", {requestTypeEnumId: "RqtHrCase"})},
        "Employees/EmploymentChange": {partyRelationshipId: ids.employmentId},
        "Employees/EmploymentLetter": {
            employmentChangeId: first("mantle.humanres.employment.EmploymentChange", "employmentChangeId")
        },
        "Employees/BadgePrint": {kioskBadgeId: first("mantle.humanres.attendance.KioskBadge", "kioskBadgeId")},
        "Employees/ChecklistTemplates": {organizationPartyId: ids.organizationId, workEffortId: ids.onboardingId},
        "Employees/OrgStructure": {organizationPartyId: ids.organizationId, unitPartyId: ids.departmentId},
        "Employees/OrgChart": org,
        "Staffing/Positions": org,
        "Staffing/PositionDetail": {emplPositionId: ids.positionId},
        "Staffing/JobClassDetail": {emplPositionClassId: ids.jobClassId},
        "Staffing/PayGrades": {payGradeId: ids.payGradeId},
        "Staffing/Openings": org,
        "Staffing/ApplicantDetail": {employmentApplicationId: applicationId},
        "Staffing/OfferDetail": {employmentOfferId: offerId},
        "Staffing/OfferLetter": {employmentOfferId: offerId},
        "Time/LeavePolicyDetail": {leavePolicyId: ids.leavePolicyId},
        "Time/LeaveRequestDetail": {leaveRequestId: first("mantle.humanres.leave.LeaveRequest", "leaveRequestId")},
        "Time/LeaveBalances": org,
        "Time/WorkingScheduleDetail": {workingScheduleId: ids.scheduleId},
        "Time/HolidayCalendars": {holidayCategoryId: ids.holidayCalendarId},
        "Time/ShiftRoster": org,
        "Time/ShiftRosterTui": org,
        "Time/ShiftRosterPrint": org,
        "Time/TimesheetDetail": {timesheetId},
        "Time/TimesheetPrint": {timesheetId},
        "Time/TimeImport": {attendanceImportId: first("mantle.humanres.attendance.AttendanceImport", "attendanceImportId")},
        "Payroll/PayComponentDetail": {
            payrollComponentId: first("mantle.humanres.payroll.PayrollComponent", "payrollComponentId")
        },
        "Payroll/PayStructureDetail": {
            payrollStructureId: first("mantle.humanres.payroll.PayrollStructure", "payrollStructureId")
        },
        "Payroll/PayRunDetail": {payrollRunId: first("mantle.humanres.payroll.PayrollRun", "payrollRunId")},
        "Payroll/PayslipDetail": {payslipId: first("mantle.humanres.payroll.Payslip", "payslipId")},
        "Payroll/PayrollExchange": {
            payrollExchangeBatchId: first("mantle.humanres.payroll.PayrollExchangeBatch", "payrollExchangeBatchId")
        },
        "Payroll/PayRecovery": org,
        "Payroll/InvoiceDetail": {invoiceId: claimId},
        "Expenses/ExpenseClaimDetail": {invoiceId: claimId},
        "Expenses/ExpenseClaimPrint": {invoiceId: claimId},
        "Development/SkillsMatrix": org,
        "Development/SkillsMatrixTui": org,
        "Development/TrainingDetail": {workEffortId: first("mantle.humanres.ability.PersonTraining", "workEffortId")},
        "Development/TrainingCertificate": {
            personTrainingId: first("mantle.humanres.ability.PersonTraining", "personTrainingId")
        },
        "Performance/ReviewDetail": {performanceReviewId: reviewId},
        "Performance/ReviewRelease": {performanceReviewId: reviewId},
        "Settings/SettingsHome": org,
        "Settings/ApprovalPolicies": org,
        "Settings/Preferences": org,
        // Tasks opens its WorkItemDetail by default; an interview's event under the interviews calendar
        Tasks: {workEffortId: ids.onboardingId},
        "Staffing/InterviewsCalendar/EventDetail": {
            workEffortId: first("mantle.humanres.recruitment.ApplicationInterview", "workEffortId")
        }
    }
    return sweepRecordsMade
}
// The parameters of a swept screen: the entry of the screen or its nearest parent (a tab takes its record's)
function sweepParameters(path) {
    const records = sweepRecords()
    const key = Object.keys(records)
        .filter(key => path === key || path.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0]
    return key ? records[key] : {}
}
// The paths under the People root to sweep: its own screen files, then each screen its files mount from elsewhere and the tabs of it
// that People's menu shows the current user
function sweepScreens() {
    const files = []
    ec.resource.getLocationReference("component://mr-boss/screen/People.xml").walkChildTree(files, null)
    const own = files
        .filter(file => file.path !== "People" && file.location.endsWith(".xml"))
        .map(file => file.path.substring("People/".length))
    const mounts = []
    for (const [path] of mountedScreens()) {
        if (!mounts.includes(path)) mounts.push(path)
        for (const tab of mountTabs(path, sweepParameters(path))) if (!mounts.includes(tab)) mounts.push(tab)
    }
    return own.concat(mounts.filter(path => !own.includes(path)))
}
// People's shared screens under Commons' root, as the self-service employee opens them, each with its parameters
const commonsMounts = {
    "People/SelfService": {},
    "People/MyPayslip": {},
    "People/MyInterview": {},
    "People/Employee360": {partyId: ids.employeePartyId}
}
// A tablet for Retail's clocking kiosk (impl-people P30, PeopleKiosk's setup): a display account of Retail holding the kiosk bundle
// alone, made once, and a device registered for the PEOPLE_CLOCKING route group and redeemed; its cookie value and device id. Run as
// an identity and access administrator (john.doe); revoke it with revoke#SharedDevice when done.
function kioskTablet(name) {
    const username = "display." + name.toLowerCase().replace(/[^a-z0-9]+/g, ".")
    const account = () => system(() => ec.entity.find("moqui.security.UserAccount").condition("username", username).one())
    if (!account())
        invoke("mantle.party.IdentityServices.create#DisplayAccount", {
            displayName: name,
            username,
            organizationPartyId: ids.organizationId,
            bundleGroupIdList: ["BOSS_PEOPLE_KIOSK"]
        })
    const displayUserId = account()?.userId
    const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {
        deviceName: name + " " + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS"),
        routeGroupId: "PEOPLE_CLOCKING",
        displayUserId,
        issueCode: false
    })
    const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {deviceId: registered.deviceId}).registrationCode
    const redeemed = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("Device/redeem", {code}, "post")
    const cookie = String(redeemed.header("Set-Cookie") || "")
        .split(";")[0]
        .replace("moqui.device=", "")
    ec.message.clearErrors()
    return {cookie, deviceId: registered.deviceId, displayUserId}
}
// The annual leave policy an employment follows on a day (yyyy-MM-dd), or null: Retail's annual leave, or another a spec put it under
// (an acceptance walk's leave requests are charged to it)
function annualPolicyOn(partyRelationshipId, day) {
    const at = Date.parse(day + "T12:00:00Z")
    const time = value => (value == null ? null : ec.user.timestampMillis(value))
    const open = row => {
        const from = time(row.fromDate)
        const thru = time(row.thruDate)
        if (thru != null && thru <= (from ?? -Infinity)) return false
        return (from ?? -Infinity) <= at && (thru ?? Infinity) > at
    }
    const rows = system(() =>
        Array.from(
            ec.entity
                .find("mantle.humanres.leave.LeavePolicyAssignment")
                .condition({partyRelationshipId, leaveTypeEnumId: "PltAnnual"})
                .list()
        )
    )
    return rows.find(open)?.leavePolicyId || null
}
// A request of a browser at the web root, as the device when a cookie is given (whoever is signed in on this thread), in a render
// mode: its status, output and errors
function deviceRequest(path, parameters, cookie, mode, method) {
    let test = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml")
    if (mode) test = test.renderMode(mode)
    if (cookie) test = test.header("cookie", "moqui.device=" + cookie)
    const out = test.render(path, parameters || {}, method || "get")
    const errors = Array.from(out.errorMessages || []).join("\n")
    ec.message.clearAll()
    return {status: out.status, output: String(out.output || ""), errors}
}

;({
    ids,
    users,
    asUser,
    system,
    refusal,
    invoke,
    page,
    screenRefusal,
    hit,
    shell,
    mountedScreens,
    mountTabs,
    sweepRecords,
    sweepParameters,
    sweepScreens,
    commonsMounts,
    kioskTablet,
    deviceRequest,
    annualPolicyOn
})
