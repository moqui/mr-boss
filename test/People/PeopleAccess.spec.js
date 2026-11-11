// People access (impl-people §2, P1; design-people §1.1, §1.2): who may open People and the context they get (a self-service
// employee, another app's user, a client and a PASS account refused), the menu, keys and launcher per group, each group's
// capabilities from its permissions (an edit permission alone reading nothing), an HR officer of one employer refused the other's
// employee and employer with the same parameters, the raw mantle.humanres entity and REST paths refused, Home's one qvt render
// (an HR officer's counts and due work of their employer only; the other employer's refusal is check#Record's) and Settings'
// one html render (the People administrator's setup checks; the HR officer's html render a refusal), and People's rows in
// Admin's readiness and settings registries. One feature per rule, each case of it a line of its problems, with artifact
// authorization enabled. Mantle's scope rules (employment dates, reporting lines, self) are Mantle's PeopleScope. The access
// and isolation walk is the acceptance PeopleFoundationWalk. A later phase adds a case only for an access rule it adds.
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
            const admin = asUser(users.admin, () => invoke(context, {}))
            if (![ids.organizationId, ids.otherOrganizationId].every(id => admin.organizationPartyIds.includes(id)))
                problems.push(`the administrator's employers: ${admin.organizationPartyIds}`)
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
        if (JSON.stringify(keys) !== JSON.stringify(["g p"])) problems.push(`the HR officer's people keys: ${keys}`)
        if ((hr.providers?.quickCreate || []).length) problems.push("the HR officer is offered quick create")
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
    {user: users.admin, granted: ["configure", "payrollView", "payrollEdit", "staff", "settings"]},
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
                if (result.status == 200) problems.push(`${path} is open: ${result.output.slice(0, 120)}`)
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
            settings.output.includes("No department is set up")
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
            checks.sort() == ["people.departments warning NO_DEPARTMENT", "people.managers warning EMPLOYEE_NO_MANAGER"]
            admin.includes("people.settings")
            !hr.includes("people.settings")
        }
    }
)
