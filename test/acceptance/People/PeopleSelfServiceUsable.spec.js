// People P8's "usable when" (impl-people P8; design-people §3 SelfService, MyTeam, §1.4 Today), as an acceptance walk with
// artifact authorization on: people.employee, with no People launcher, opens SelfService from Commons Home's People card, sees
// their employment and requests, adds an emergency contact that no one else finds in the palette, Commons' contacts or search,
// and opens their own Employee360; people.manager sees their reports and the decision waiting on them in My team and Today, and
// no one else's. The rules themselves are Mantle's PeopleScope, PeopleDirectory and PeopleApprovals and mr-boss's
// PeopleSelfService and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleSelfServiceUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page, shell} = lib
const P = "mantle.humanres.PeopleServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const webroot = "component://webroot/screen/webroot.xml"
const day = 24 * 60 * 60 * 1000
const state = {}
// Ines Varga, Tomas's colleague, whose transfer HR asks for and Hannah decides
const colleagueEmployment = "BOSS_PPL_INES_EMP"
// a screen under the web root as the user (a page, or a transition's post), with its errors
function request(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).renderMode("html").render(path, parameters, method)
        const output = String(result.output || "")
        const errors = Array.from(result.errorMessages || [])
            .concat(output.match(/(Error rendering|Exception in render)[^\n<]*/g) || [])
            .join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output, errors}
    })
}
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))

spec({
    setupSpec() {
        login("john.doe")
        state.nextWeek = ec.l10n.format(new Date(ec.user.timestampMillis(ec.user.nowTimestamp) + 7 * day), "yyyy-MM-dd")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "people.employee, with no People launcher, opens SelfService from Commons Home, sees their employment and requests, keeps an emergency contact no one else finds, and opens their own Employee360",
    {
        when() {
            const problems = []
            if (shell(users.employee).apps.includes("People")) problems.push("the employee has the People launcher")
            const home = request(users.employee, "apps/Commons/Home")
            if (!opened(home) || !home.output.includes("My employment") || !home.output.includes("People/SelfService"))
                problems.push(`Commons Home's People card: ${home.status} ${home.errors}`)
            const self = request(users.employee, "apps/Commons/People/SelfService")
            for (const text of ["Tomas Lindqvist", "Store Operations", "Hannah Okafor", "My requests", "Emergency contacts"])
                if (!self.output.includes(text)) problems.push(`SelfService does not show ${text}`)
            if (!opened(self)) problems.push(`SelfService: ${self.status} ${self.errors}`)
            // an emergency contact added through the screen, then shown there
            const added = request(
                users.employee,
                "apps/Commons/People/SelfService/storeEmergencyContact",
                {
                    partyId: ids.employeePartyId,
                    firstName: "Elsa",
                    lastName: "Usableton",
                    relationshipName: "Mother",
                    phone: "555 0161"
                },
                "post"
            )
            if (added.errors) problems.push(`the contact was not added: ${added.errors}`)
            const after = request(users.employee, "apps/Commons/People/SelfService")
            if (!after.output.includes("Elsa Usableton") || !after.output.includes("Mother"))
                problems.push("SelfService does not show the contact added")
            // no one else finds the contact: HR's palette and Commons' contacts, and the universal search
            const palette = as(users.hr, "ironstone.commons.PaletteServices.search#People", {text: "Usableton"})
            // its rows (the answer's "more" link carries the text searched for)
            if (JSON.stringify(palette.rows || []).includes("Usableton"))
                problems.push("HR's palette finds the emergency contact")
            const contacts = request(users.hr, "apps/Commons/Contacts/List", {text: "Usableton", find: "Y"})
            if (contacts.output.includes("Elsa Usableton")) problems.push("HR's Commons contacts list the emergency contact")
            const found = as(users.hr, "mantle.party.PartyServices.find#Party", {lastName: "Usableton"})
            if (Array.from(found.partyIdList || []).length) problems.push("a party search finds the emergency contact")
            // the employee's own Employee360 under Commons, with their personal information and the contact
            const record = request(users.employee, "apps/Commons/People/Employee360", {partyId: ids.employeePartyId})
            if (!opened(record) || !record.output.includes("Personal information") || !record.output.includes("Elsa Usableton"))
                problems.push(`their Employee360: ${record.status} ${record.errors}`)
            // and nothing else of People
            const employees = request(users.employee, "apps/People/Employees")
            if (employees.status === 200 && !employees.errors) problems.push("the employee opens People's directory")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("people.manager sees their reports and the decision waiting on them in My team and Today, and no one else's", {
    when() {
        const problems = []
        // HR asks for Ines's transfer, which waits for Hannah, her manager
        const revision = as(users.hr, P + "preview#EmploymentChange", {
            partyRelationshipId: colleagueEmployment,
            changeKind: "transfer",
            effectiveDate: state.nextWeek,
            departmentPartyId: "BOSS_PPL_D_MERCH",
            emplPositionId: "",
            reason: "Joins merchandising"
        }).revision
        const asked = as(users.hr, P + "apply#EmploymentChange", {
            partyRelationshipId: colleagueEmployment,
            changeKind: "transfer",
            effectiveDate: state.nextWeek,
            departmentPartyId: "BOSS_PPL_D_MERCH",
            emplPositionId: "",
            reason: "Joins merchandising",
            expectedRevision: revision
        })
        if (asked.statusId !== "EchRequested") problems.push(`the transfer was not asked: ${JSON.stringify(asked)}`)
        const team = request(users.manager, "apps/People/MyTeam")
        if (!opened(team)) problems.push(`My team: ${team.status} ${team.errors}`)
        for (const text of ["Tomas Lindqvist", "Ines Varga", "Rafael Mbeki", "Approve the transfer of Ines Varga"])
            if (!team.output.includes(text)) problems.push(`My team does not show ${text}`)
        for (const text of ["Leon Ferreira", "Kenji Arakawa", "Sofia Brandt"])
            if (team.output.includes(text)) problems.push(`My team shows ${text}`)
        const today = as(users.manager, "ironstone.people.ContextServices.get#TodayItems")
        if (!Array.from(today.items || []).some(item => String(item.title).includes("Ines Varga")))
            problems.push("Hannah's Today does not list the transfer")
        const employeeToday = as(users.employee, "ironstone.people.ContextServices.get#TodayItems")
        // the employee's own items (their training, review steps, leave) may be there in a whole run; Ines's transfer is not theirs
        if (Array.from(employeeToday.items || []).some(item => String(item.title).includes("Ines Varga")))
            problems.push("the employee's Today lists the transfer")
        // HR reads the request among their own, waiting for Hannah
        const mine = as(users.hr, P + "find#MyRequests", {openOnly: true})
        if (!Array.from(mine.requests || []).some(row => row.nextApproverText.includes("Hannah Okafor")))
            problems.push("HR's requests do not show the transfer waiting for Hannah")
        // the directory reader opens no My team
        const reader = request(users.reader, "apps/People/MyTeam")
        if (reader.status === 200 && !reader.errors) problems.push("the directory reader opens My team")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
