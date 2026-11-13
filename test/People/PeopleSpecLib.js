// Helpers the People specs share: the demo ids (data/BossPeopleDemoData.xml, data/BossUsersDemoData.xml), the demo users by
// group, a block run as a user with artifact authorization on, a call's refusal message, a People page render and the shell's menu
// and providers. Later phases add their ids and users here.
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
        "Settings"
    ],
    // P8: My team, the managers' (and the administrator's, through the root's ALWAYS)
    managerMenu: ["Home", "MyTeam", "Approvals", "Employees", "Staffing", "Time", "Expenses", "Development", "Performance"],
    hrMenu: ["Home", "Approvals", "Employees", "Staffing", "Time", "Expenses", "Development", "Performance"],
    payrollMenu: ["Home", "Approvals", "Employees", "Staffing", "Time", "Payroll", "Expenses", "Development", "Performance"],
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
    settingsMenu: ["SettingsHome", "ApprovalPolicies", "Lookups", "Forms"],
    // P10: Rates; P22 (its review's call of Nov 12, 2026): payroll configuration's components, structures and groups, payroll's;
    // P23: pay assignments, before Rates; P24: pay adjustments, after them
    // P25: pay runs first; P26: payslips after them
    payrollGroupMenu: [
        "PayRuns",
        "Payslips",
        "PayAssignments",
        "PayAdjustments",
        "Rates",
        "PayComponents",
        "PayStructures",
        "PayGroups"
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

;({ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit, shell})
