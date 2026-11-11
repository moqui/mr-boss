// People access (impl-people §2, P1; design-people §1.1, §1.2): who may open People and the context they get (a self-service
// employee, another app's user, a client and a PASS account refused), the menu, keys and launcher per group, each group's
// capabilities from its permissions (an edit permission alone reading nothing), an HR officer of one employer refused the other's
// employee and employer with the same parameters, the raw mantle.humanres entity and REST paths refused, Home's one qvt render
// (an HR officer's counts and due work of their employer only; the other employer's refusal is check#Record's) and Settings'
// one html render (the People administrator's setup checks; the HR officer's html render a refusal), and People's rows in
// Admin's readiness and settings registries. One feature per rule, each case of it a line of its problems, with artifact
// authorization enabled. Mantle's scope rules (employment dates, reporting lines, self) are Mantle's PeopleScope. The access
// and isolation walk is the acceptance PeopleFoundationWalk. A later phase adds a case only for an access rule it adds. P2: the
// employment content host (its notes and files an HR officer's of its employer, through the shared panels' record check) and
// the People panels serving no other record. P3: a change of a unit's members and of a reporting line, an HR editor's of its
// employer (Mantle's own check, as the HR officer of Retail and the directory reader with the same parameters, and Services'
// unit and employee refused to Retail's HR officer), and the Employees menu group. P4: a position's and a job class's changes, an
// HR editor's of the employer (the directory reader refused with the same parameters, Services' position refused to Retail's HR),
// a manager reading the seats of the department they lead and not another's, a pay grade's amounts and changes payroll's (the HR
// officer answered the grade's name alone and refused its change; a shared grade changed by the People administrator and not by
// Retail's payroll), and the Staffing menu group.
// Run: ./moq test mr-boss --spec PeopleAccess
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit, shell} = lib
const context = "ironstone.people.ContextServices.get#SharedContext"
const checkRecord = "ironstone.people.ContextServices.check#Record"
const choices = "ironstone.people.ContextServices.get#Choices"
const registry = "ironstone.admin.RegistryServices."
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
                .condition("userId", editOnly)
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
            for (const user of [users.employee, users.otherApp, users.client, users.pass]) {
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
        if (hr.status != 200 || JSON.stringify(hr.names) !== JSON.stringify(ids.staffMenu))
            problems.push(`the HR officer's menu: ${hr.status} ${hr.names}`)
        const keymap = (hr.providers?.keymaps || []).find(keymap => keymap.scope === "people")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(ids.keys)) problems.push(`the HR officer's people keys: ${keys}`)
        if ((hr.providers?.quickCreate || []).length) problems.push("the HR officer is offered quick create")
        // P3: Employees is a menu group of the directory, Organization and Org chart
        const group = shell(users.hr, true, "Employees/OrgChart", "Employees")
        if (JSON.stringify(group.names) !== JSON.stringify(ids.employeesMenu))
            problems.push(`the HR officer's Employees group: ${group.status} ${group.names}`)
        // P4: Positions & recruiting is a menu group of the positions, job classes and pay grades
        const staffing = shell(users.hr, true, "Staffing/Positions", "Staffing")
        if (JSON.stringify(staffing.names) !== JSON.stringify(ids.staffingMenu))
            problems.push(`the HR officer's Staffing group: ${staffing.status} ${staffing.names}`)
        if (!hr.apps.includes("People")) problems.push(`the HR officer's launcher has no People: ${hr.apps}`)
        for (const user of [users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.adminMenu)) problems.push(`${user}'s menu: ${names}`)
        }
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
    // a read's employers every internal organization (PEOPLE_ALL_ORGANIZATIONS)
    "allOrganizations",
    // a reader of an employer, from the view capabilities
    "staff",
    // the Settings area, the People administrator's
    "settings"
]
// design §1.1's table
const capabilityUsers = [
    {user: users.reader, granted: ["directory", "staff"]},
    {user: users.manager, granted: ["team", "requestApprove"]},
    {user: users.hr, granted: ["hrView", "hrEdit", "import", "staff"]},
    {user: users.recruiter, granted: ["recruitView", "recruitEdit", "staff"]},
    {user: users.payroll, granted: ["payrollView", "payrollEdit", "staff"]},
    {user: users.payApprover, granted: ["payrollView", "payrollApprove", "staff"]},
    {user: users.develop, granted: ["developView", "developEdit", "staff"]},
    {user: users.caseHandler, granted: ["caseHandle", "staff"]},
    {user: users.admin, granted: ["configure", "payrollView", "payrollEdit", "allOrganizations", "staff", "settings"]},
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
            return {hrHome, settings, hrSettings: screenRefusal(users.hr, "Settings")}
        },
        then({hrHome, settings, hrSettings}) {
            hrHome.errors.length == 0
            hrHome.output.includes("Headcount")
            hrHome.output.includes("Joined, last 30 days")
            hrHome.output.includes("Due work")
            // Retail's employee with no manager, not Services' lead with none
            hrHome.output.includes("Leon Ferreira")
            !hrHome.output.includes("Amara Diallo")
            settings.errors.length == 0
            settings.output.includes("Setup readiness")
            // P3's demo departments: each employer's department check is ready
            !settings.output.includes("No department is set up")
            settings.output.includes("Ziziwork Services")
            unauthorized(hrSettings)
        }
    }
)

feature(
    "Admin's registries read People's setup checks per employer and show People's settings entry to the People administrator only",
    {
        when() {
            const readiness = asUser(users.system, () =>
                invoke(registry + "get#Readiness", {providerKey: "people.setup", organizationPartyId: ids.organizationId})
            )
            const settingsKeys = user =>
                Array.from(asUser(user, () => invoke(registry + "find#Settings", {})).entries || []).map(
                    entry => entry.settingsKey
                )
            return {
                checks: Array.from(readiness.checks || []).map(row => [row.checkKey, row.state, row.reasonCode].join(" ")),
                admin: settingsKeys(users.admin),
                hr: settingsKeys(users.hr)
            }
        },
        then({checks, admin, hr}) {
            checks.sort() == ["people.departments ready ", "people.managers warning EMPLOYEE_NO_MANAGER"]
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
