// The design §14.3 review of People, "Navigation and devices" (impl-people P31, §8; design-people §1.1, §1.2, §1.4 Devices, §14.3;
// Practices-App-Dev "Lists"), as an acceptance walk with artifact authorization on, for a user of each People group with no other
// launcher (people.reader, .manager, .hr, .recruiter, .payroll, .payapprover, .develop, .case, .admin; people.employee, the
// self-service employee, has no People launcher; finance.payroll none either):
// - every screen is reachable for its role: each launcher shows People beside what every staff user has, and each entry of the
//   user's People menu, at the root and in each of its groups, opens; an entry the user's menu leaves out is refused by URL, or opens
//   with its services refusing (logged: the services' refusals are PeopleReviewWalk's and the access specs');
// - a refused deep link (Services' employee, Services' seat) shows "Not available" and names nothing of the record;
// - phone lists: every People list with more than two shown fields has two phone columns (`columns type="mobile"`: the name, and the
//   state or amount); the lists at 390 px are PeoplePhoneWalk's;
// - the custom chart, roster, matrix, board and calendars have a terminal action path: each twin renders for its role as a TUI
//   document with no error node and with its actions (ShiftRosterTui, TeamCalendarTui, InterviewsCalendarTui, SkillsMatrixTui, the
//   org chart's tree and the applicant pipeline's board in tui);
// - the self-service employee reaches People's shared screens under Commons (SelfService, MyPayslip, MyInterview, their own
//   Employee360) and no People screen; the manager, also self-service, the same under Commons;
// - devices: the kiosk display account, as Retail's registered tablet, opens its page and no other People screen, menu, shell or
//   Commons; a person off a device is told the page records nothing.
// The menus per group are PeopleFoundationWalk's and PeopleAccess's; confidentiality is PeopleReviewWalk's.
// Run: ./moq accept mr-boss --spec PeopleNavigationWalk
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page, shell} = lib
const groupUsers = [
    users.reader,
    users.manager,
    users.hr,
    users.recruiter,
    users.payroll,
    users.payApprover,
    users.develop,
    users.caseHandler,
    users.admin
]
// the root's menu groups (a group's own menu is its subscreens)
const groups = ["Employees", "Staffing", "Time", "Payroll", "Expenses", "Development", "Performance", "Settings"]
const opened = got => got.status == 200 && got.errors.length == 0
// a screen as the user opens it: html, or qvue for a .qvue screen with no html (the team and interviews calendars), as the shell
// loads it
function view(user, path, parameters = {}) {
    const got = asUser(user, () => page(path, parameters, "html"))
    if (!got.errors.some(error => /render mode html is not supported/.test(error))) return got
    return asUser(user, () => page(path, parameters, "qvue"))
}
const failedRender = got => /Error rendering|Exception in render/.test(got.output)

// the error nodes and node types of a TUI document
function walk(nodes, found) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        found.types.add(node.t)
        if (node.t === "error") found.errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        if (node.t === "formList")
            for (const row of node.rows || [])
                for (const cell of row.cells || []) walk(Array.isArray(cell) ? cell : [cell], found)
        walk(node.c, found)
    }
    return found
}
function tui(user, path, parameters = {}) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/People.xml")
            .renderMode("tui")
            .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        let doc = null
        try {
            doc = JSON.parse(String(result.output || ""))
        } catch (error) {
            doc = null
        }
        const found = walk(doc?.c, {types: new Set(), errors: []})
        return {status: result.status, errors, doc, nodeErrors: found.errors, types: Array.from(found.types)}
    })
}
// a user's People menu: the root's entries and each group's, as [path, in the menu]
function menuOf(user) {
    const root = shell(user, true).names
    const entries = root.map(name => name)
    for (const group of groups.filter(group => root.includes(group)))
        for (const name of shell(user, true, group, group).names) entries.push(group + "/" + name)
    return entries
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "each group's launcher has People and no other app; every entry of its People menu opens, and one it leaves out is refused or opens empty-handed",
    {
        when() {
            const problems = []
            const outOfMenu = []
            // what every staff user's launcher has: the self-service employee's (BOSS_USERS and People's self-service)
            const baseline = shell(users.employee).apps
            const full = menuOf(users.system)
            for (const user of groupUsers) {
                const apps = shell(user).apps
                const extra = apps.filter(app => !baseline.includes(app) && app !== "People")
                if (!apps.includes("People")) problems.push(`${user}'s launcher has no People`)
                if (extra.length) problems.push(`${user}'s launcher has ${extra.join(", ")}`)
                const mine = menuOf(user)
                for (const path of mine) {
                    const got = view(user, path)
                    if (!opened(got) || failedRender(got))
                        problems.push(`${user}: ${path} in their menu does not open: ${got.status} ${got.errors}`)
                }
                for (const path of full.filter(path => !mine.includes(path))) {
                    const got = view(user, path)
                    if (failedRender(got)) problems.push(`${user}: ${path} fails to render: ${got.errors}`)
                    else if (opened(got)) outOfMenu.push(`${user}: ${path}`)
                }
            }
            if (outOfMenu.length)
                log.info(`People entries out of a user's menu that open by URL (their services decide):\n${outOfMenu.join("\n")}`)
            return {problems, full}
        },
        then({problems, full}) {
            full.includes("Employees/List")
            full.includes("Payroll/PayRuns")
            full.includes("Time/LeaveRequests")
            problems.join("\n") == ""
        }
    }
)

feature("a refused deep link shows Not available and names nothing of the record", {
    when() {
        const problems = []
        const links = [
            ["Employees/Employee360", {partyId: ids.otherEmployeePartyId}, "Kenji"],
            ["Staffing/PositionDetail", {emplPositionId: ids.otherPositionId}, null]
        ]
        // the People administrator reads every employer
        for (const user of groupUsers.filter(user => user !== users.admin)) {
            for (const [path, parameters, name] of links) {
                const got = asUser(user, () => page(path, parameters, "html"))
                if (failedRender(got)) problems.push(`${user}: ${path} fails to render`)
                else if (opened(got) && !/not available/i.test(got.output))
                    problems.push(`${user}: ${path} of Services is not "Not available"`)
                if (name && got.output.includes(name)) problems.push(`${user}: ${path} names ${name}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("every People list with more than two shown fields has two phone columns: the name, and the state or amount", {
    when() {
        const files = []
        ec.resource.getLocationReference("component://mr-boss/screen/People.xml").walkChildTree(files, null)
        const locations = files.filter(file => file.location.endsWith(".xml")).map(file => file.location)
        for (const name of ["Employee360", "PeopleSelfService", "PeopleMyPayslip", "PeopleMyInterview"])
            locations.push(`component://mr-boss/screen/Shared/${name}.xml`)
        const missing = []
        let lists = 0
        for (const location of locations) {
            const text = String(ec.resource.getLocationReference(location).getText())
            for (const match of text.matchAll(/<form-list\b([^>]*)>([\s\S]*?)<\/form-list>/g)) {
                lists++
                const name = (/name="([^"]+)"/.exec(match[1]) || [])[1]
                const body = match[2]
                const shown = body
                    .split(/<field name="/)
                    .slice(1)
                    .filter(field => !/^[^>]*>\s*<(default-field|conditional-field)[^>]*>\s*<hidden/.test(field))
                const mobile = /<columns type="mobile">([\s\S]*?)<\/columns>/.exec(body)
                const columns = mobile ? (mobile[1].match(/<column>[\s\S]*?<field-ref/g) || []).length : 0
                if (shown.length > 2 && columns != 2)
                    missing.push(
                        `${location.replace("component://mr-boss/screen/", "")} ${name} (${shown.length} fields, ${columns} phone columns)`
                    )
            }
        }
        if (missing.length) log.warn(`People lists without two phone columns:\n${missing.join("\n")}`)
        return {missing, lists}
    },
    then({missing, lists}) {
        lists > 150
        missing == []
    }
})

feature("the custom chart, roster, matrix, board and calendars have a terminal action path for their roles", {
    when() {
        const twins = [
            [users.hr, "Time/ShiftRosterTui", {organizationPartyId: ids.organizationId}],
            [users.manager, "Time/TeamCalendarTui", {}],
            [users.recruiter, "Staffing/InterviewsCalendarTui", {}],
            [users.develop, "Development/SkillsMatrixTui", {organizationPartyId: ids.organizationId}],
            [users.reader, "Employees/OrgChart", {organizationPartyId: ids.organizationId}],
            [users.recruiter, "Staffing/ApplicantPipeline", {}]
        ]
        const problems = []
        for (const [user, path, parameters] of twins) {
            const got = tui(user, path, parameters)
            if (got.status != 200 || got.errors) problems.push(`${user}: ${path} in tui: ${got.status} ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) problems.push(`${user}: ${path} is not a TUI document`)
            else if (got.nodeErrors.length) problems.push(`${user}: ${path}: ${got.nodeErrors.join(" | ")}`)
            else if (!got.types.some(type => ["form", "link", "dialog", "dynamicDialog", "buttonMenu"].includes(type)))
                problems.push(`${user}: ${path} in tui has no action (${got.types.join(", ")})`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the self-service employee reaches People's shared screens under Commons and no People screen; the manager the same under Commons",
    {
        when() {
            const problems = []
            for (const user of [users.employee, users.manager]) {
                for (const [path, parameters] of Object.entries(lib.commonsMounts)) {
                    const got = asUser(user, () =>
                        page(
                            path,
                            path.endsWith("Employee360") ? {partyId: system(() => partyOf(user))} : parameters,
                            "html",
                            "Commons"
                        )
                    )
                    if (!opened(got) || failedRender(got)) problems.push(`${user}: Commons/${path}: ${got.status} ${got.errors}`)
                }
            }
            if (shell(users.employee).apps.includes("People")) problems.push("the employee's launcher has People")
            for (const path of ["Home", "Employees/List", "Staffing/Positions", "Payroll/PayRuns", "Settings"]) {
                const got = asUser(users.employee, () => page(path, {}, "html"))
                if (opened(got)) problems.push(`the employee opens People's ${path}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
function partyOf(username) {
    return ec.entity.find("moqui.security.UserAccount").condition("username", username).one()?.partyId
}

feature(
    "the kiosk tablet opens its page and nothing else of People, the shell or Commons; a person off a device is told it records nothing",
    {
        when() {
            const tablet = system(() => lib.kioskTablet("People navigation clock"))
            const outside = got => /This device opens only PEOPLE_CLOCKING/.test(got.errors)
            const problems = []
            const kiosk = lib.deviceRequest("apps/People/Time/ClockingKiosk", {}, tablet.cookie)
            if (kiosk.status != 200 || kiosk.errors) problems.push(`the tablet's kiosk page: ${kiosk.status} ${kiosk.errors}`)
            const paths = menuOf(users.system)
                .map(path => "apps/People/" + path)
                .concat([
                    "apps/People/SelfService",
                    "apps/People/Employees/BadgePrint",
                    "apps/Commons/Home",
                    "apps/Commons/People/SelfService",
                    "qapps/People/Time/ClockingKiosk",
                    "menuData/apps/People/Home",
                    "shellData"
                ])
            for (const path of paths) {
                const got = lib.deviceRequest(path, {}, tablet.cookie)
                if (!outside(got)) problems.push(`the tablet opens ${path}: ${got.status}`)
            }
            const person = asUser(users.hr, () => lib.deviceRequest("apps/People/Time/ClockingKiosk", {}, null, "tui"))
            system(() =>
                invoke("mantle.party.IdentityServices.revoke#SharedDevice", {
                    deviceId: tablet.deviceId,
                    reason: "Navigation walk done"
                })
            )
            return {problems, person, checked: paths.length}
        },
        then({problems, person, checked}) {
            checked > 40
            problems.join("\n") == ""
            person.output.includes("Not a clocking device")
        }
    }
)
