// People access (impl-people §2, P1; design-people §1.1, §1.2): who may open People and the context they get (a self-service
// employee, another app's user, a client and a PASS account refused), the menu, keys and launcher per group, each group's
// capabilities from its permissions (an edit permission alone reading nothing), an HR officer of one employer refused the other's
// employee and employer with the same parameters, the raw mantle.humanres entity and REST paths refused, Home's one qvt render
// (an HR officer's counts and due work of their employer only; the other employer's refusal is check#Record's) and Settings'
// one html render (the People administrator's setup checks; the HR officer's html render a refusal), and People's rows in
// Admin's readiness and settings registries. One feature per rule, each case of it a line of its problems, with artifact
// authorization enabled. Mantle's scope rules (employment dates, reporting lines, self) are Mantle's PeopleScope. The access
// and isolation walk is the acceptance PeopleFoundationWalk. This spec holds P1 to P10's features (foundation, employees,
// organization, positions, approvals, hire, lifecycle, self-service, schedules, time); P11 on are PeopleAccessLater's, which
// shares PeopleSpecLib. The context, menu and capability features here hold every phase's links, menu groups and capabilities.
// A later phase adds a case only for an access rule it adds. P2: the
// employment content host (its notes and files an HR officer's of its employer, through the shared panels' record check) and
// the People panels serving no other record. P3: a change of a unit's members and of a reporting line, an HR editor's of its
// employer (Mantle's own check, as the HR officer of Retail and the directory reader with the same parameters, and Services'
// unit and employee refused to Retail's HR officer), and the Employees menu group. P4: a position's and a job class's changes, an
// HR editor's of the employer (the directory reader refused with the same parameters, Services' position refused to Retail's HR),
// a manager reading the seats of the department they lead and not another's, a pay grade's amounts and changes payroll's (the HR
// officer answered the grade's name alone and refused its change; a shared grade changed by the People administrator and not by
// Retail's payroll), and the Staffing menu group. P5: approval rules and HR vocabularies the People administrator's (the HR
// officer refused with the same parameters), a route read by an HR reader of the employer (the directory reader refused, Services'
// position refused to Retail's HR), a decision asked of an approver (the directory reader refused), and Settings' tabs. P6: the
// hire and employment change wizards and their quick create the HR officer's (the directory reader refused the screen and not
// offered it), a hire and an employment change an HR editor's of the employer (the directory reader refused with the same
// parameters, Services' employer and employment refused to Retail's HR). P7: the HR officer's Checklists and Employee import in
// Employees, HR's area (the user's call, Nov 11; Settings stays the People administrator's), a checklist template and a person's equipment HR's of the employer (the
// directory reader refused with the same parameters, Services' template and holder refused to Retail's HR), the employee import's
// mount HR's. P8: the self-service employee's context their own (no People capability but self-service) and their self-service
// opened under People by its own grant while every other People screen is refused them; My team the managers' (the directory
// reader refused it), and the managers' menu. P9: Time & leave's working schedules HR's and the managers' (the reader's Time
// group without them), its Holidays HR's (the manager refused it); a working schedule changed by an HR editor of the employer
// (the directory reader refused with the same parameters, Services' schedule refused to Retail's HR), WorkingSchedules' one html
// render (the HR officer's), the capability schedules. P10: Time & leave opened to the self-service employee by its own grant
// (Payroll and Employees still refused them), Payroll the payroll groups' (the HR officer refused Rates; the Payroll capability;
// the payroll operator's menu and the Time group), and the employee's context linking their own My time. P22 review: the payroll
// operator's Payroll group (Rates and payroll configuration) and the capability payrollConfigure (PAYROLL_CONFIGURE).
// Run: ./moq test mr-boss --spec PeopleAccess
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit, shell} = lib
const context = "ironstone.people.ContextServices.get#SharedContext"
const checkRecord = "ironstone.people.ContextServices.check#Record"
const choices = "ironstone.people.ContextServices.get#Choices"
const registry = "org.moqui.admin.ReadinessServices."
// a refusal of a user without People: the service is not authorized for them, or it refuses them
const refused = message => /PEOPLE_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// a spec-local People user whose only capability group holds PEOPLE_HR_EDIT, an agent of Retail
const editOnly = "PPL_SPEC_EDIT_ONLY"

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#moqui.security.UserGroup", {userGroupId: editOnly, description: "People spec: HR edit alone"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: editOnly,
                userPermissionId: "PEOPLE_HR_EDIT",
                fromDate: 0
            })
            call("create#mantle.party.Party", {partyId: editOnly, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: editOnly, firstName: "People spec", lastName: "Edit only"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: editOnly,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: editOnly,
                username: "people.spec.editonly",
                partyId: editOnly,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_PEOPLE", editOnly])
                call("create#moqui.security.UserGroupMember", {userId: editOnly, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the spec user's memberships end, so no later spec meets a People user it does not know
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", "in", [editOnly])
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a People user gets their context; another root, a self-service employee, another app's user, a client and a PASS account are refused",
    {
        when() {
            const problems = []
            const hr = asUser(users.hr, () => invoke(context, {}))
            // Retail and the internal organizations under it (Warehouse's returns organization), not Services
            if (
                !hr.organizationPartyIds.includes(ids.organizationId) ||
                hr.organizationPartyIds.includes(ids.otherOrganizationId)
            )
                problems.push(`the HR officer's employers: ${hr.organizationPartyIds}`)
            if (hr.appRoot !== "People" || hr.sharedLinks?.Home !== "//People/Home" || hr.allOrganizations)
                problems.push(`the HR officer's context: ${JSON.stringify(hr)}`)
            // the administrator, an agent of Retail and Services, reads every employer (PEOPLE_ALL_ORGANIZATIONS)
            const admin = asUser(users.admin, () => invoke(context, {}))
            if (![ids.organizationId, ids.otherOrganizationId].every(id => admin.organizationPartyIds.includes(id)))
                problems.push(`the administrator's employers: ${admin.organizationPartyIds}`)
            if (!admin.allOrganizations) problems.push("the administrator does not read every employer")
            // the manager reads no employer; their own employment is Retail's
            const manager = asUser(users.manager, () => invoke(context, {}))
            if (manager.organizationPartyIds.length || manager.employments?.[0]?.organizationPartyId !== ids.organizationId)
                problems.push(`the manager's scope: ${manager.organizationPartyIds} ${JSON.stringify(manager.employments)}`)
            const otherRoot = asUser(users.hr, () => refusal(context, {appRoot: "Warehouse"}))
            if (!otherRoot.includes("PEOPLE_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
            // P8: the self-service employee's context is their own: self-service and its link, no People capability or employer (P10,
            // P12, P13: and their own time, leave, attendance and clock links; P15: their expense claims and advances; P18: their
            // qualifications; P19: training, a session and a certificate; P26: their own payslip)
            const employee = asUser(users.employee, () => invoke(context, {}))
            if (
                employee.capabilities?.read !== false ||
                employee.capabilities?.self !== true ||
                Object.keys(employee.sharedLinks || {}).join() !==
                    "SelfService,MyPayslip,Time/MyTime,Time/LeaveRequests,Time/LeaveRequestDetail,Time/TeamCalendar,Time/Attendance,Time/Clock," +
                        "Expenses/ExpenseClaims,Expenses/ExpenseClaimDetail,Expenses/EmployeeAdvances,Development/Qualifications," +
                        "Development/Training,Development/TrainingDetail,Development/TrainingCertificate" ||
                employee.organizationPartyIds?.length ||
                employee.employments?.[0]?.organizationPartyId !== ids.organizationId
            )
                problems.push(`the employee's context: ${JSON.stringify(employee)}`)
            for (const user of [users.otherApp, users.client, users.pass]) {
                const message = asUser(user, () => refusal(context, {}))
                if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
            }
            for (const user of [users.employee, users.client, users.pass]) {
                const home = screenRefusal(user, "Home")
                if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the People menu and keys follow the groups; the launcher shows People to its users only", {
    when() {
        const problems = []
        const hr = shell(users.hr)
        if (hr.status != 200 || JSON.stringify(hr.names) !== JSON.stringify(ids.hrMenu))
            problems.push(`the HR officer's menu: ${hr.status} ${hr.names}`)
        const keymap = (hr.providers?.keymaps || []).find(keymap => keymap.scope === "people")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.keys)) problems.push(`the HR officer's people keys: ${keys}`)
        // P6: the HR officer's quick create is Hire employee (the wizard's grant); a directory reader is offered none of HR's; P12:
        // Request leave is every People user's (Leave requests opens to them)
        const quick = shell => (shell.providers?.quickCreate || []).map(entry => entry.kind).join()
        if (quick(hr) !== "peopleHireEmployee,peopleRequestLeave") problems.push(`the HR officer's quick create: ${quick(hr)}`)
        const reader = shell(users.reader)
        if (quick(reader) !== "peopleRequestLeave") problems.push(`the reader's quick create: ${quick(reader)}`)
        // P3: Employees is a menu group of the directory, Organization and Org chart; P7: and, for HR, Checklists and Employee import
        const group = shell(users.hr, true, "Employees/OrgChart", "Employees")
        if (JSON.stringify(group.names) !== JSON.stringify(ids.hrEmployeesMenu))
            problems.push(`the HR officer's Employees group: ${group.status} ${group.names}`)
        const readerGroup = shell(users.reader, true, "Employees/OrgChart", "Employees")
        if (JSON.stringify(readerGroup.names) !== JSON.stringify(ids.employeesMenu))
            problems.push(`the reader's Employees group: ${readerGroup.status} ${readerGroup.names}`)
        // the People administrator opens Checklists through the root, but reads no HR record: Employee import is not in their menu
        const adminGroup = shell(users.admin, true, "Employees/OrgChart", "Employees")
        if (!adminGroup.names.includes("ChecklistTemplates") || adminGroup.names.includes("EmployeeImport"))
            problems.push(`the administrator's Employees group: ${adminGroup.status} ${adminGroup.names}`)
        // P4: Positions & recruiting is a menu group of the positions, job classes and pay grades
        const staffing = shell(users.hr, true, "Staffing/Positions", "Staffing")
        if (JSON.stringify(staffing.names) !== JSON.stringify(ids.staffingMenu))
            problems.push(`the HR officer's Staffing group: ${staffing.status} ${staffing.names}`)
        if (!hr.apps.includes("People")) problems.push(`the HR officer's launcher has no People: ${hr.apps}`)
        for (const user of [users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.adminMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        // P8: My team is the manager's
        const manager = shell(users.manager, true).names
        if (JSON.stringify(manager) !== JSON.stringify(ids.managerMenu)) problems.push(`the manager's menu: ${manager}`)
        // P9 and P10: Time & leave is every People user's, its time screens Projects' mounted; its working schedules HR's and the
        // managers', its Holidays HR's alone; Payroll is the payroll groups'
        const readerMenu = shell(users.reader, true).names
        if (JSON.stringify(readerMenu) !== JSON.stringify(ids.staffMenu)) problems.push(`the reader's menu: ${readerMenu}`)
        const payroll = shell(users.payroll, true).names
        if (JSON.stringify(payroll) !== JSON.stringify(ids.payrollMenu)) problems.push(`the payroll operator's menu: ${payroll}`)
        for (const [user, menu, label] of [
            [users.hr, ids.hrTimeMenu, "the HR officer's"],
            [users.manager, ids.managerTimeMenu, "the manager's"],
            [users.reader, ids.timeMenu, "the reader's"]
        ]) {
            const time = shell(user, true, "Time/Timesheets", "Time")
            if (JSON.stringify(time.names) !== JSON.stringify(menu))
                problems.push(`${label} Time group: ${time.status} ${time.names}`)
        }
        // P18: Skills & training's matrix and qualifications; the reader's qualifications alone
        for (const [user, menu, label] of [
            [users.hr, ids.developmentMenu, "the HR officer's"],
            [users.reader, ids.readerDevelopmentMenu, "the reader's"]
        ]) {
            const development = shell(user, true, "Development/Qualifications", "Development")
            if (JSON.stringify(development.names) !== JSON.stringify(menu))
                problems.push(`${label} Development group: ${development.status} ${development.names}`)
        }
        // the area's menu entry opens for the reader, on Qualifications (its default, the matrix, is denied to them)
        const readerDevelopment = screenRefusal(users.reader, "Development")
        if (readerDevelopment) problems.push(`the reader's Development: ${readerDevelopment}`)
        // P20: Reviews & goals' reviews and goals every People user's; its review cycles and forms the review administrator's
        for (const [user, menu, label] of [
            [users.develop, ids.developPerformanceMenu, "the review administrator's"],
            [users.reader, ids.performanceMenu, "the reader's"]
        ]) {
            const performance = shell(user, true, "Performance/Reviews", "Performance")
            if (JSON.stringify(performance.names) !== JSON.stringify(menu))
                problems.push(`${label} Performance group: ${performance.status} ${performance.names}`)
        }
        // P22 review: Payroll's Rates and payroll configuration, the payroll operator's
        const payrollGroup = shell(users.payroll, true, "Payroll/Rates", "Payroll")
        if (JSON.stringify(payrollGroup.names) !== JSON.stringify(ids.payrollGroupMenu))
            problems.push(`the payroll operator's Payroll group: ${payrollGroup.status} ${payrollGroup.names}`)
        // P5: Settings' tabs, the readiness, the approval rules and the lookups
        const settings = shell(users.admin, true, "Settings/SettingsHome", "Settings")
        if (JSON.stringify(settings.names) !== JSON.stringify(ids.settingsMenu))
            problems.push(`the administrator's Settings tabs: ${settings.status} ${settings.names}`)
        for (const user of [users.employee, users.otherApp])
            if (shell(user).apps.includes("People")) problems.push(`${user} has People`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "directory",
    "self",
    "team",
    "requestApprove",
    "hrView",
    "hrEdit",
    // P14: saving and publishing shifts (PEOPLE_ROSTER_EDIT), the managers' and HR's
    "rosterEdit",
    // P15: every expense claim and advance of the employers (PEOPLE_EXPENSE_MANAGE), HR's
    "expenseManage",
    "recruitView",
    "recruitEdit",
    "developView",
    "developEdit",
    "caseHandle",
    "import",
    "configure",
    "payrollView",
    "payrollEdit",
    "payrollApprove",
    // P22 review: payroll configuration (PAYROLL_CONFIGURE), the payroll operator's and the People administrator's
    "payrollConfigure",
    // a read's employers every internal organization (PEOPLE_ALL_ORGANIZATIONS)
    "allOrganizations",
    // a reader of an employer, from the view capabilities
    "staff",
    // the Settings area, the People administrator's
    "settings",
    // P6: the hire and employment change wizards, the HR officer's
    "employment",
    // P9: Time & leave's working schedules, the HR officers' and the managers'
    "schedules",
    // P10: the Payroll area (Rates), the payroll groups'
    "payroll"
]
// design §1.1's table
const capabilityUsers = [
    {user: users.reader, granted: ["directory", "staff"]},
    // the manager is an employee too: BOSS_PEOPLE_SELF beside BOSS_PEOPLE_MANAGER (groups are not nested; P8's review)
    {user: users.manager, granted: ["self", "team", "requestApprove", "rosterEdit", "schedules"]},
    // HR decides the approval steps routed to it with PEOPLE_REQUEST_APPROVE, as everyone does (impl-people §4, P5's review)
    {
        user: users.hr,
        granted: [
            "requestApprove",
            "hrView",
            "hrEdit",
            "rosterEdit",
            "expenseManage",
            "import",
            "staff",
            "employment",
            "schedules"
        ]
    },
    {user: users.recruiter, granted: ["recruitView", "recruitEdit", "staff"]},
    // P28: PEOPLE_IMPORT for the payroll exchange's imports; P31 review: PEOPLE_DIRECTORY_VIEW, the People read of the payroll groups
    // (PAYROLL_VIEW alone reads nothing of People, the lead's call of Nov 13, 2026)
    {user: users.payroll, granted: ["directory", "import", "payrollView", "payrollEdit", "payrollConfigure", "staff", "payroll"]},
    {user: users.payApprover, granted: ["directory", "payrollView", "payrollApprove", "staff", "payroll"]},
    {user: users.develop, granted: ["developView", "developEdit", "staff"]},
    {user: users.caseHandler, granted: ["caseHandle", "staff"]},
    {
        user: users.admin,
        granted: [
            "configure",
            "payrollView",
            "payrollEdit",
            "payrollConfigure",
            "allOrganizations",
            "staff",
            "settings",
            "employment",
            "schedules",
            "payroll"
        ]
    },
    {user: "people.spec.editonly", granted: ["hrEdit"]},
    {user: users.system, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions; an edit permission alone reads nothing", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(context, {})).capabilities || {}
            const held = capabilityNames.filter(name => capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (capabilities.read !== true) problems.push(`${user} does not open People`)
        }
        // the edit-only user reads no employer, no person and no choice
        const editor = asUser("people.spec.editonly", () => ({
            context: invoke(context, {}),
            person: refusal(checkRecord, {recordType: "person", recordId: ids.reportPartyId}),
            people: invoke(choices, {choice: "people"}).options
        }))
        if (editor.context.organizationPartyIds.length)
            problems.push(`the editor's employers: ${editor.context.organizationPartyIds}`)
        if (!editor.person.includes("RECORD_UNAVAILABLE")) problems.push(`the editor reads a person: ${editor.person || "given"}`)
        if (editor.people.length) problems.push(`the editor's people: ${JSON.stringify(editor.people)}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("an HR officer of Retail is refused Services' employee and employer with the parameters Retail's are given with", {
    when() {
        const problems = []
        const expect = (label, message, refusalText) => {
            if (refusalText ? !message.includes(refusalText) : message !== "") problems.push(`${label}: ${message || "accepted"}`)
        }
        asUser(users.hr, () => {
            expect("Retail's employee", refusal(checkRecord, {recordType: "person", recordId: ids.reportPartyId}))
            expect(
                "Services' employee",
                refusal(checkRecord, {recordType: "person", recordId: ids.otherEmployeePartyId}),
                "RECORD_UNAVAILABLE"
            )
            expect("Retail", refusal(checkRecord, {recordType: "organization", recordId: ids.organizationId}))
            expect(
                "Services",
                refusal(checkRecord, {recordType: "organization", recordId: ids.otherOrganizationId}),
                "RECORD_UNAVAILABLE"
            )
            // the choices hold Retail's employees, Priya once though Services employs her too, and none of Services' own
            const people = invoke(choices, {choice: "people"}).options.map(option => option.value)
            if (!people.includes(ids.reportPartyId) || people.filter(id => id === ids.dualPartyId).length !== 1)
                problems.push(`the HR officer's people: ${people}`)
            if (people.includes(ids.otherEmployeePartyId) || people.includes(ids.contractorPartyId))
                problems.push(`the HR officer's people hold Services' employee or the contractor: ${people}`)
            const employers = invoke(choices, {choice: "employers"}).options.map(option => option.value)
            if (!employers.includes(ids.organizationId) || employers.includes(ids.otherOrganizationId))
                problems.push(`the employers: ${employers}`)
        })
        // the manager: their report, not another employee of their employer
        asUser(users.manager, () => {
            expect("the manager's report", refusal(checkRecord, {recordType: "person", recordId: ids.employeePartyId}))
            expect(
                "the manager's colleague",
                refusal(checkRecord, {recordType: "person", recordId: ids.unmanagedPartyId}),
                "RECORD_UNAVAILABLE"
            )
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the raw mantle.humanres entity and REST paths and People's Mantle services called directly are refused", {
    when() {
        const problems = []
        asUser(users.hr, () => {
            for (const path of [
                "rest/e1/mantle.humanres.employment.Employment",
                "rest/e1/mantle.humanres.employment.EmploymentSalary",
                "rest/e1/mantle.humanres.position.EmplPosition"
            ]) {
                const result = hit(path)
                if (!result.refused) problems.push(`${path} is not refused: ${result.status} ${result.output.slice(0, 120)}`)
            }
            const home = refusal("mantle.humanres.PeopleServices.get#Home", {})
            if (!/is not authorized/.test(home)) problems.push(`get#Home called directly: ${home || "given"}`)
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "Home shows an HR officer their employer's counts and due work, not another's; Settings shows the administrator the setup checks",
    {
        when() {
            const hrHome = asUser(users.hr, () => page("Home"))
            const settings = asUser(users.admin, () => page("Settings", {}, "html"))
            // P7 (the user's call, Nov 11): Settings stays the People administrator's; HR's editors are under Employees
            return {
                hrHome,
                settings,
                hrSettings: screenRefusal(users.hr, "Settings"),
                readerSettings: screenRefusal(users.reader, "Settings")
            }
        },
        then({hrHome, settings, hrSettings, readerSettings}) {
            hrHome.errors.length == 0
            hrHome.output.includes("Headcount")
            hrHome.output.includes("Joined, last 30 days")
            hrHome.output.includes("Due work")
            // Retail's employee with no manager, not Services' lead with none
            hrHome.output.includes("Leon Ferreira")
            !hrHome.output.includes("Amara Diallo")
            settings.errors.length == 0
            settings.output.includes("Setup readiness")
            // the administrator reads every employer, spec-local ones of the shared test database among them, so the demo
            // employers' department checks are read per employer in the next feature (impl-maintenance F353)
            settings.output.includes("Ziziwork Services")
            unauthorized(hrSettings)
            unauthorized(readerSettings)
        }
    }
)

feature(
    "Admin's registries read People's setup checks per employer and show People's settings entry to the People administrator only",
    {
        when() {
            const readinessOf = organizationPartyId =>
                asUser(users.system, () =>
                    invoke(registry + "get#Readiness", {providerKey: "people.setup", scopeParameters: {organizationPartyId}})
                )
            const readiness = readinessOf(ids.organizationId)
            // P3's demo departments: Services' department check is ready too (Retail's below)
            const otherDepartments = Array.from(readinessOf(ids.otherOrganizationId).checks || [])
                .filter(row => row.checkKey === "people.departments")
                .map(row => row.state)
            const settingsKeys = user =>
                Array.from(asUser(user, () => invoke(registry + "find#Settings", {})).entries || []).map(
                    entry => entry.settingsKey
                )
            return {
                checks: Array.from(readiness.checks || []).map(row => [row.checkKey, row.state, row.reasonCode].join(" ")),
                otherDepartments,
                admin: settingsKeys(users.admin),
                hr: settingsKeys(users.hr)
            }
        },
        then({checks, otherDepartments, admin, hr}) {
            checks.filter(check => /^people\.(departments|managers) /.test(check)).sort() ==
                ["people.departments ready ", "people.managers warning EMPLOYEE_NO_MANAGER"]
            // P29: every phase's checks join them (their rules are Mantle's PeopleReports)
            checks.length == 9
            // P23: the payroll check, a warning while Retail has no pay group or an employee without a pay assignment
            checks.filter(check => check.startsWith("people.payroll warning ")).length == 1
            otherDepartments.join(",") == "ready"
            admin.includes("people.settings")
            !hr.includes("people.settings")
        }
    }
)

feature(
    "an employment's notes and files open to an HR officer of its employer, not to a directory reader or another employer's employment; People's panels serve no other record",
    {
        when() {
            const problems = []
            // the shared panels' record check (Mantle's get#RecordLinkInfo), whose HR host rule holds with authorization off too
            const visible = (user, recordId) =>
                asUser(user, () =>
                    system(() =>
                        invoke("ironstone.shared.ChatterServices.get#RecordInfo", {
                            recordEntityName: "mantle.humanres.employment.Employment",
                            recordId
                        })
                    )
                ).visible === true
            if (!visible(users.hr, ids.employmentId)) problems.push("the HR officer does not see Retail's employment")
            if (visible(users.reader, ids.employmentId)) problems.push("the directory reader sees Retail's employment")
            if (visible(users.hr, ids.otherEmploymentId)) problems.push("the HR officer sees Services' employment")
            // the panels under People (their files' data, as the record-files element fetches it): the employment opens, a
            // person's Party record is kept in its own app
            const filesData = (recordEntity, recordId) =>
                asUser(users.hr, () => {
                    const result = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot.xml")
                        .render("apps/People/RecordFiles/filesData", {recordEntity, recordId}, "get")
                    const errors = Array.from(result.errorMessages || []).join(" | ")
                    ec.message.clearErrors()
                    return {output: String(result.output || ""), errors}
                })
            const employment = filesData("mantle.humanres.employment.Employment", ids.employmentId)
            const employmentFiles = employment.errors ? {} : JSON.parse(employment.output)
            if (
                !employmentFiles.visible ||
                !employmentFiles.canUpload ||
                !String(employmentFiles.record?.title).startsWith("Tomas Lindqvist at")
            )
                problems.push(`the employment's files under People: ${employment.errors} ${employment.output.slice(0, 200)}`)
            const party = filesData("mantle.party.Party", ids.employeePartyId)
            if (!party.errors.includes("RECORD_PANEL_UNAVAILABLE"))
                problems.push(`a Party's files under People: ${party.errors} ${party.output.slice(0, 160)}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "a unit's members and a reporting line change for an HR editor of its employer; a directory reader and another employer's unit or person are refused",
    {
        when() {
            // Mantle's own checks with the user's identity (a People screen's grant opens the services): a change that passes the
            // permission and scope checks is refused for what it asks (Tomas is a member and reports to Hannah already), so the
            // same parameters show the permission's refusal, and nothing in the demo changes
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres.OrganizationServices." + service, parameters)))
            const member = {unitPartyId: ids.teamId, partyId: ids.employeePartyId, memberRole: "member"}
            const otherMember = {unitPartyId: ids.otherDepartmentId, partyId: ids.otherEmployeePartyId, memberRole: "member"}
            const line = asUser(users.hr, () =>
                system(() =>
                    invoke("mantle.humanres.OrganizationServices.get#ReportingTree", {
                        organizationPartyId: ids.organizationId,
                        partyId: ids.employeePartyId
                    })
                )
            ).nodes[0]
            const manager = {
                partyId: ids.employeePartyId,
                organizationPartyId: ids.organizationId,
                managerPartyId: ids.managerPartyId,
                expectedRevision: line.lineRevision
            }
            const otherManager = {partyId: ids.otherEmployeePartyId, managerPartyId: "BOSS_PPL_AMARA", expectedRevision: ""}
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            return {
                codes: {
                    hrMember: code(as(users.hr, "store#Membership", member)),
                    readerMember: code(as(users.reader, "store#Membership", member)),
                    hrOtherMember: code(as(users.hr, "store#Membership", otherMember)),
                    hrManager: code(as(users.hr, "change#Manager", manager)),
                    readerManager: code(as(users.reader, "change#Manager", manager)),
                    hrOtherManager: code(as(users.hr, "change#Manager", otherManager))
                }
            }
        },
        then({codes}) {
            codes ==
                {
                    hrMember: "ALREADY_MEMBER",
                    readerMember: "PERMISSION_DENIED",
                    hrOtherMember: "RECORD_UNAVAILABLE",
                    hrManager: "MANAGER_UNCHANGED",
                    readerManager: "PERMISSION_DENIED",
                    hrOtherManager: "RECORD_UNAVAILABLE"
                }
        }
    }
)

feature(
    "positions and job classes change for an HR editor of the employer, a manager reads the seats of their department, and a grade's amounts and changes are payroll's",
    {
        when() {
            // Mantle's own checks with the user's identity (a People screen's grant opens the services): a change that passes the
            // permission and scope checks is refused for what it asks (no class, no title, no name), so the same parameters show
            // the permission's refusal, and nothing in the demo changes
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres." + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const position = {organizationPartyId: ids.organizationId, emplPositionClassId: ""}
            const otherPosition = {organizationPartyId: ids.otherOrganizationId, emplPositionClassId: ids.jobClassId}
            const ownedGrade = {gradeName: " ", organizationPartyId: ids.organizationId}
            const sharedGrade = {payGradeId: ids.sharedPayGradeId, gradeName: " "}
            const grades = user =>
                asUser(user, () =>
                    system(() => invoke("mantle.humanres.PayrollSetupServices.find#PayGrades", {payGradeId: ids.payGradeId}))
                )
            const payroll = grades(users.payroll)
            const hr = grades(users.hr)
            return {
                codes: {
                    hrPosition: code(as(users.hr, "PositionServices.store#Position", position)),
                    readerPosition: code(as(users.reader, "PositionServices.store#Position", position)),
                    hrOtherPosition: code(as(users.hr, "PositionServices.store#Position", otherPosition)),
                    hrRead: code(as(users.hr, "PositionServices.get#Position", {emplPositionId: ids.positionId})),
                    readerRead: code(as(users.reader, "PositionServices.get#Position", {emplPositionId: ids.positionId})),
                    hrOtherRead: code(as(users.hr, "PositionServices.get#Position", {emplPositionId: ids.otherPositionId})),
                    managerRead: code(as(users.manager, "PositionServices.get#Position", {emplPositionId: ids.positionId})),
                    managerOtherRead: code(
                        as(users.manager, "PositionServices.get#Position", {emplPositionId: ids.merchPositionId})
                    ),
                    hrClass: code(as(users.hr, "PositionServices.store#JobClass", {title: " "})),
                    readerClass: code(as(users.reader, "PositionServices.store#JobClass", {title: " "})),
                    payrollGrade: code(as(users.payroll, "PayrollSetupServices.store#PayGrade", ownedGrade)),
                    hrGrade: code(as(users.hr, "PayrollSetupServices.store#PayGrade", ownedGrade)),
                    // the shared grade (Lead): Retail's payroll refused, the People administrator (PEOPLE_ALL_ORGANIZATIONS)
                    // answered for the revision it does not name
                    payrollShared: code(as(users.payroll, "PayrollSetupServices.store#PayGrade", sharedGrade)),
                    adminShared: code(as(users.admin, "PayrollSetupServices.store#PayGrade", sharedGrade))
                },
                payroll: [payroll.amountsShown, String(payroll.payGrades[0].band?.amount)],
                hr: [hr.amountsShown, hr.payGrades[0].gradeName, Object.hasOwn(hr.payGrades[0], "band"), hr.bands.length]
            }
        },
        then({codes, payroll, hr}) {
            codes ==
                {
                    hrPosition: "CLASS_REQUIRED",
                    readerPosition: "PERMISSION_DENIED",
                    hrOtherPosition: "ORGANIZATION_DENIED",
                    hrRead: "accepted",
                    readerRead: "PERMISSION_DENIED",
                    hrOtherRead: "RECORD_UNAVAILABLE",
                    managerRead: "accepted",
                    managerOtherRead: "RECORD_UNAVAILABLE",
                    hrClass: "TITLE_REQUIRED",
                    readerClass: "PERMISSION_DENIED",
                    payrollGrade: "NAME_REQUIRED",
                    hrGrade: "PERMISSION_DENIED",
                    payrollShared: "PERMISSION_DENIED",
                    adminShared: "REVISION_CHANGED"
                }
            payroll == [true, "3000"]
            hr == [false, "Associate", false, 0]
        }
    }
)

feature(
    "approval rules and HR vocabularies are the People administrator's; a route is read by an HR reader of the employer; a decision needs an approver's permission",
    {
        when() {
            // Mantle's own checks with the user's identity: a change that passes the permission check is refused for what it asks
            // (a role that is not one, a value with no name), so the same parameters show the permission's refusal, and nothing
            // in the demo changes
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres." + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const rule = {
                organizationPartyId: ids.organizationId,
                approvalKindEnumId: "PakPosition",
                approverRoleEnumId: "ParNobody"
            }
            const lookup = {enumTypeId: "TerminationReason", description: " "}
            const route = {emplPositionId: ids.positionId}
            const otherRoute = {emplPositionId: ids.otherPositionId}
            // a decision of a seat with no request: past the permission, nothing to decide
            const decision = {emplPositionId: ids.positionId}
            return {
                codes: {
                    adminRule: code(as(users.admin, "PeopleApprovalServices.store#Policy", rule)),
                    hrRule: code(as(users.hr, "PeopleApprovalServices.store#Policy", rule)),
                    adminLookup: code(as(users.admin, "PeopleServices.store#Lookup", lookup)),
                    hrLookup: code(as(users.hr, "PeopleServices.store#Lookup", lookup)),
                    hrRoute: code(as(users.hr, "PeopleApprovalServices.resolve#Approvers", route)),
                    readerRoute: code(as(users.reader, "PeopleApprovalServices.resolve#Approvers", route)),
                    hrOtherRoute: code(as(users.hr, "PeopleApprovalServices.resolve#Approvers", otherRoute)),
                    managerDecision: code(as(users.manager, "PositionServices.decide#PositionApproval", decision)),
                    readerDecision: code(as(users.reader, "PositionServices.decide#PositionApproval", decision))
                }
            }
        },
        then({codes}) {
            codes ==
                {
                    adminRule: "ROLE_INVALID",
                    hrRule: "PERMISSION_DENIED",
                    adminLookup: "DESCRIPTION_REQUIRED",
                    hrLookup: "PERMISSION_DENIED",
                    hrRoute: "accepted",
                    readerRoute: "PERMISSION_DENIED",
                    hrOtherRoute: "RECORD_UNAVAILABLE",
                    managerDecision: "RECORD_UNAVAILABLE",
                    readerDecision: "PERMISSION_DENIED"
                }
        }
    }
)

feature(
    "the hire and employment change are the HR officer's: the wizards and a hire's or change's check, Services' employer and employment refused to Retail's HR",
    {
        when() {
            // Mantle's own checks with the user's identity: the previews change nothing, so the same parameters show the
            // permission's refusal; Services' employer and Kenji's employment are outside Retail's HR officer's scope
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres.PeopleServices." + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const hire = {organizationPartyId: ids.organizationId, partyId: ids.contractorPartyId}
            const otherHire = {organizationPartyId: ids.otherOrganizationId, partyId: ids.contractorPartyId}
            const change = {partyRelationshipId: ids.employmentId, changeKind: "manager", managerPartyId: ids.managerPartyId}
            const otherChange = {partyRelationshipId: ids.otherEmploymentId, changeKind: "manager"}
            return {
                screens: {
                    hr: screenRefusal(users.hr, "Employees/HireEmployee"),
                    reader: screenRefusal(users.reader, "Employees/HireEmployee") ? "refused" : "opened",
                    readerChange: screenRefusal(users.reader, "Employees/EmploymentChange", change) ? "refused" : "opened"
                },
                codes: {
                    hrHire: code(as(users.hr, "preview#Hire", hire)),
                    readerHire: code(as(users.reader, "preview#Hire", hire)),
                    hrOtherHire: code(as(users.hr, "preview#Hire", otherHire)),
                    hrChange: code(as(users.hr, "preview#EmploymentChange", change)),
                    readerChange: code(as(users.reader, "preview#EmploymentChange", change)),
                    hrOtherChange: code(as(users.hr, "preview#EmploymentChange", otherChange))
                }
            }
        },
        then({screens, codes}) {
            screens == {hr: "", reader: "refused", readerChange: "refused"}
            codes ==
                {
                    hrHire: "accepted",
                    readerHire: "PERMISSION_DENIED",
                    hrOtherHire: "ORGANIZATION_DENIED",
                    hrChange: "accepted",
                    readerChange: "PERMISSION_DENIED",
                    hrOtherChange: "RECORD_UNAVAILABLE"
                }
        }
    }
)

feature(
    "checklists and equipment are HR's of the employer: Retail's checklist and Ines's laptop read and changed by Retail's HR officer, the directory reader refused with the same parameters, Services' refused to Retail's HR; the employee import is HR's",
    {
        when() {
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres.PeopleServices." + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            // a Services checklist, for Retail's HR to be refused
            const other = system(() =>
                invoke("mantle.humanres.PeopleServices.store#Checklist", {
                    organizationPartyId: ids.otherOrganizationId,
                    lifecycleKindEnumId: "ClkOnboarding",
                    workEffortName: "Services access spec"
                })
            )
            const step = {templateWorkEffortId: ids.onboardingId, workEffortId: ids.onboardingId + "_3", dueOffsetDays: 3}
            return {
                screens: {
                    hr: screenRefusal(users.hr, "Employees/ChecklistTemplates"),
                    reader: screenRefusal(users.reader, "Employees/ChecklistTemplates") ? "refused" : "opened",
                    hrImport: screenRefusal(users.hr, "Employees/EmployeeImport"),
                    readerImport: screenRefusal(users.reader, "Employees/EmployeeImport") ? "refused" : "opened"
                },
                codes: {
                    hrStep: code(as(users.hr, "store#ChecklistStep", step)),
                    readerStep: code(as(users.reader, "store#ChecklistStep", step)),
                    hrOtherStep: code(
                        as(users.hr, "store#ChecklistStep", Object.assign({}, step, {templateWorkEffortId: other.workEffortId}))
                    ),
                    hrEquipment: code(as(users.hr, "get#AssignedEquipment", {partyId: ids.reportPartyId})),
                    readerEquipment: code(as(users.reader, "get#AssignedEquipment", {partyId: ids.reportPartyId})),
                    hrOtherEquipment: code(as(users.hr, "get#AssignedEquipment", {partyId: ids.otherEmployeePartyId}))
                }
            }
        },
        then({screens, codes}) {
            screens == {hr: "", reader: "refused", hrImport: "", readerImport: "refused"}
            codes ==
                {
                    hrStep: "accepted",
                    readerStep: "PERMISSION_DENIED",
                    hrOtherStep: "RECORD_UNAVAILABLE",
                    hrEquipment: "accepted",
                    readerEquipment: "RECORD_UNAVAILABLE",
                    hrOtherEquipment: "RECORD_UNAVAILABLE"
                }
        }
    }
)

feature(
    "the self-service employee opens their self-service under People by its own grant and no other People screen; My team is the manager's, the directory reader refused it",
    {
        when() {
            const problems = []
            // the employee's self-service under People (its one html render), every other People screen refused
            const self = screenRefusal(users.employee, "SelfService")
            if (self) problems.push(`the employee is refused SelfService: ${self}`)
            for (const path of ["Home", "Employees", "Employees/Employee360", "MyTeam", "Approvals"]) {
                const refused = screenRefusal(users.employee, path, {partyId: ids.employeePartyId})
                if (!unauthorized(refused)) problems.push(`the employee opens ${path}: ${refused || "opened"}`)
            }
            // (P8 review) their own record's transitions under People and People's other services called directly stay refused:
            // the self grant opens the self-service screen, its transition and the services it calls alone
            const transition = asUser(users.employee, () =>
                hit("apps/People/Employees/Employee360/storeEmergencyContact", {
                    partyId: ids.employeePartyId,
                    firstName: "Not",
                    lastName: "Added",
                    phone: "555 0103"
                })
            )
            if (!transition.refused) problems.push(`the employee posts to Employee360 under People: ${transition.status}`)
            for (const service of ["get#Team", "get#Employee360", "get#Home"]) {
                const message = asUser(users.employee, () =>
                    refusal("mantle.humanres.PeopleServices." + service, {partyId: ids.employeePartyId})
                )
                if (!unauthorized(message)) problems.push(`the employee calls ${service}: ${message || "accepted"}`)
            }
            // My team: the manager's (its one html render), not the directory reader's
            const manager = screenRefusal(users.manager, "MyTeam")
            if (manager) problems.push(`the manager is refused My team: ${manager}`)
            const reader = screenRefusal(users.reader, "MyTeam")
            if (!unauthorized(reader)) problems.push(`the reader opens My team: ${reader || "opened"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "working schedules are HR's of the employer: Retail's store week changed by Retail's HR officer, the directory reader refused with the same parameters and the screen, Services' schedule refused to Retail's HR; Holidays HR's, the manager refused it",
    {
        when() {
            const as = (user, service, parameters) =>
                asUser(user, () => system(() => refusal("mantle.humanres.ScheduleServices." + service, parameters)))
            const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"
            const revision = workingScheduleId =>
                system(() => invoke("mantle.humanres.ScheduleServices.get#Schedule", {workingScheduleId})).schedule.revision
            // a Services schedule, for Retail's HR to be refused
            const other = system(() =>
                invoke("mantle.humanres.ScheduleServices.store#Schedule", {
                    organizationPartyId: ids.otherOrganizationId,
                    scheduleName: "Services access spec week",
                    timeZone: "America/Chicago"
                })
            ).workingScheduleId
            const same = {
                workingScheduleId: ids.scheduleId,
                expectedRevision: revision(ids.scheduleId),
                scheduleName: "Store week"
            }
            const codes = {
                reader: code(as(users.reader, "store#Schedule", same)),
                hr: code(as(users.hr, "store#Schedule", same)),
                hrOther: code(
                    as(users.hr, "store#Schedule", {
                        workingScheduleId: other,
                        expectedRevision: revision(other),
                        scheduleName: "Not mine"
                    })
                )
            }
            // the HR officer's one html render of WorkingSchedules: Retail's week, not Services'
            const list = asUser(users.hr, () => page("Time/WorkingSchedules", {}, "html"))
            const problems = []
            if (
                list.status != 200 ||
                list.errors.length ||
                !list.output.includes("Store week") ||
                !list.output.includes("New schedule")
            )
                problems.push(`the HR officer's WorkingSchedules: ${list.status} ${list.errors}`)
            if (list.output.includes("Services access spec week"))
                problems.push("the HR officer's WorkingSchedules lists Services' week")
            const reader = screenRefusal(users.reader, "Time/WorkingSchedules")
            if (!unauthorized(reader)) problems.push(`the reader opens WorkingSchedules: ${reader || "opened"}`)
            const holidays = screenRefusal(users.manager, "Time/HolidayCalendars")
            if (!unauthorized(holidays)) problems.push(`the manager opens Holidays: ${holidays || "opened"}`)
            return {codes, problems}
        },
        then({codes, problems}) {
            codes == {reader: "PERMISSION_DENIED", hr: "accepted", hrOther: "RECORD_UNAVAILABLE"}
            problems.join("\n") == ""
        }
    }
)

feature(
    "Time & leave opens to the self-service employee by its own grant and nothing else of People; Payroll is the payroll groups', the HR officer refused it",
    {
        when() {
            const problems = []
            // P10: the employee keeps their own week under People (My time's one html render); Payroll, Employees and Time & leave's
            // working schedules and Holidays (P9's, HR's and the managers') stay refused
            const myTime = screenRefusal(users.employee, "Time/MyTime")
            if (myTime) problems.push(`the employee is refused My time: ${myTime}`)
            for (const path of ["Payroll/Rates", "Employees", "Time/WorkingSchedules", "Time/HolidayCalendars"]) {
                const refused = screenRefusal(users.employee, path)
                if (!unauthorized(refused)) problems.push(`the employee opens ${path}: ${refused || "opened"}`)
            }
            // Payroll's Rates: the payroll operator's, the HR officer refused with the same parameters (PeopleTime renders it)
            const hrRates = screenRefusal(users.hr, "Payroll/Rates", {purpose: "RaprVendor"})
            if (!unauthorized(hrRates)) problems.push(`the HR officer opens Rates: ${hrRates || "opened"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
