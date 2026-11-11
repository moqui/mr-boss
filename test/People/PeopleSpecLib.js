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
    // the directory, Organization and Org chart; Staffing (Positions & recruiting) the positions, job classes and pay grades
    staffMenu: ["Home", "Employees", "Staffing"],
    adminMenu: ["Home", "Employees", "Staffing", "Settings"],
    employeesMenu: ["List", "OrgStructure", "OrgChart"],
    staffingMenu: ["Positions", "JobClasses", "PayGrades"],
    keys: ["g p", "g e", "g o", "g c", "g s"]
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
