// People P1's "usable when" (impl-people P1), as an acceptance walk with artifact authorization on: the menu renders for each group
// and each entry of it opens while the others are refused; people.hr opens Home with Ziziwork Retail's counts and due work and not
// Ziziwork Services'; people.employee is refused the root but for the areas their own grants open (from P10); a Projects client
// and a PASS public account are refused the root and every ironstone.people service; Admin's Health shows People's setup check and
// Admin's settings index People's entry, each only to a user who may open it. The rules themselves are PeopleAccess's and Mantle's
// PeopleScope.
// Run: ./moq accept mr-boss --spec PeopleFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, refusal, shell, page} = lib
const admin = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const selfServiceAreas = ["Time", "Expenses", "Development", "Performance"]
// every ironstone.people service a screen calls, with parameters it accepts from a user who has People
const peopleServices = [
    ["ironstone.people.ContextServices.get#SharedContext", {}],
    ["ironstone.people.ContextServices.check#Record", {recordType: "organization", recordId: ids.organizationId}],
    ["ironstone.people.ContextServices.get#Choices", {choice: "employers"}],
    ["ironstone.people.ContextServices.search#Records", {text: "Hannah"}]
]
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

feature("the menu renders for each group and each of its entries opens; the others are refused", {
    when() {
        const problems = []
        for (const user of groupUsers.concat([users.system])) {
            const found = shell(user, user === users.system)
            if (found.status != 200 || !found.names.includes("Home"))
                problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const entry of ids.adminMenu) {
                const expected = found.names.includes(entry)
                const rendered = asUser(user, () => page(entry, {}, "html"))
                if (opened(rendered) !== expected)
                    problems.push(`${user} ${expected ? "is refused" : "opens"} ${entry}: ${rendered.status} ${rendered.errors}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("people.hr opens Home with Retail's counts and due work and not Services'; people.employee is refused the root", {
    when() {
        const problems = []
        const home = asUser(users.hr, () => page("Home", {}, "html"))
        if (!opened(home) || !home.output.includes("Headcount") || !home.output.includes("Leon Ferreira"))
            problems.push(`the HR officer's Home: ${home.status} ${home.errors}`)
        if (home.output.includes("Amara Diallo") || home.output.includes("Kenji Arakawa"))
            problems.push("the HR officer's Home shows Services' employees")
        const retail = asUser(users.hr, () => page("Home", {organizationPartyId: ids.organizationId}, "html"))
        if (!retail.output.includes("Headcount")) problems.push("the HR officer's Home for Retail has no counts")
        const services = asUser(users.hr, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
        if (services.output.includes("Headcount") || !services.output.includes("This employer is not available to you."))
            problems.push("the HR officer's Home for Services is given")
        // the People administrator reads both employers' counts; a manager is told the summary is not theirs and given their own
        // work (P8: their decisions waiting and My team)
        const both = asUser(users.admin, () => page("Home", {organizationPartyId: ids.otherOrganizationId}, "html"))
        if (!both.output.includes("Headcount")) problems.push("the administrator's Home for Services has no counts")
        const manager = asUser(users.manager, () => page("Home", {}, "html"))
        if (!opened(manager) || !manager.output.includes("your own work is below") || !manager.output.includes("My team"))
            problems.push(`the manager's Home: ${manager.status} ${manager.errors}`)
        // the areas a self-service employee opens by their own grants (P10 Time, P15 Expenses, P18 Development, P20 Performance:
        // their own time, leave, claims, qualifications, training, reviews and goals); every other entry of the root is refused
        for (const entry of ids.adminMenu) {
            const rendered = asUser(users.employee, () => page(entry, {}, "html"))
            const ownArea = selfServiceAreas.includes(entry)
            if (opened(rendered) !== ownArea) problems.push(`people.employee ${ownArea ? "is refused" : "opens"} ${entry}`)
        }
        if (shell(users.employee).apps.includes("People")) problems.push("people.employee's launcher has People")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a Projects client and a PASS public account are refused the root and every ironstone.people service", {
    when() {
        const problems = []
        for (const user of [users.client, users.pass]) {
            for (const path of ids.adminMenu) {
                const rendered = asUser(user, () => page(path, {}, "html"))
                if (opened(rendered)) problems.push(`${user} opens ${path}`)
            }
            for (const [service, parameters] of peopleServices) {
                const message = asUser(user, () => refusal(service, parameters))
                if (!/PEOPLE_UNAVAILABLE|is not authorized/.test(message))
                    problems.push(`${user} gets ${service}: ${message || "accepted"}`)
            }
            if (shell(user).apps.includes("People")) problems.push(`${user}'s launcher has People`)
        }
        // the same services answer an HR officer, so the refusals above are for the user
        for (const [service, parameters] of peopleServices) {
            const message = asUser(users.hr, () => refusal(service, parameters))
            if (message !== "") problems.push(`the HR officer is refused ${service}: ${message}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Admin's Health shows People's setup check and the settings index People's entry, each only to a user who may open it", {
    when() {
        const problems = []
        const health = user => admin.asUser(user, () => admin.page("Operations/Health", {}, "html"))
        const settings = user => admin.asUser(user, () => admin.page("Settings/SettingsHome", {}, "html"))
        const systemHealth = health(admin.users.system)
        if (!opened(systemHealth) || !systemHealth.output.includes("People setup"))
            problems.push(`ADMIN's Health has no People setup: ${systemHealth.status} ${systemHealth.errors}`)
        const readerHealth = health(admin.users.reader)
        if (!opened(readerHealth) || readerHealth.output.includes("People setup"))
            problems.push(`the Admin reader's Health: ${readerHealth.status} ${readerHealth.errors}`)
        const systemSettings = settings(admin.users.system)
        if (!opened(systemSettings) || !systemSettings.output.includes("People settings"))
            problems.push(`ADMIN's settings index has no People: ${systemSettings.status} ${systemSettings.errors}`)
        const readerSettings = settings(admin.users.reader)
        if (readerSettings.output.includes("People settings")) problems.push("the Admin reader's settings index has People")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
