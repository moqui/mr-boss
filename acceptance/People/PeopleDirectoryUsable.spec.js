// People P2's "usable when" (impl-people P2; design-people §14.3 "Confidentiality across every path", its directory half), as an
// acceptance walk with artifact authorization on: people.reader finds a colleague and sees their work identity only, through the
// list, the palette, the export and a forged Employee360 link; people.hr corrects a home address; the employee corrects their own
// preferred name and not their legal name; Insights opens a person's Overview from a drill-down, read only; Admin's UserDetail and
// Projects' PersonDetail link Employee360 only for a user who may read it. The rules themselves are Mantle's PeopleDirectory and
// mr-boss's PeopleEmployees and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleDirectoryUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const webroot = "component://webroot/screen/webroot.xml"
// Ines Varga, Retail's employee and Tomas's colleague, with a private phone and a passport the directory must never show
const colleague = "BOSS_PPL_INES"
const colleagueEmployment = "BOSS_PPL_INES_EMP"
const privatePhone = "555-0999"
const passport = "PDIR0042"
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const revisionOf = (user, partyId) =>
    asUser(user, () => system(() => invoke("mantle.humanres.PeopleServices.get#Employee360", {partyId}))).personalInfo?.revision

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("mantle.party.ContactServices.store#PartyContactInfo", {
                partyId: colleague,
                replaceByPurpose: true,
                telecomContactMechPurposeId: "PhoneHome",
                contactNumber: privatePhone
            })
            call("store#mantle.party.PartyIdentification", {
                partyId: colleague,
                partyIdTypeEnumId: "PtidPassport",
                idValue: passport
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "people.reader finds a colleague by their work identity only, through the list, the palette, the export and a forged Employee360 link",
    {
        when() {
            const problems = []
            const leaks = (label, text) => {
                for (const secret of [privatePhone, passport, "0042"])
                    if (text.includes(secret)) problems.push(`${label} shows ${secret}`)
            }
            const list = asUser(users.reader, () => page("Employees", {term: "Varga"}, "html"))
            if (!opened(list) || !list.output.includes("Ines Varga") || !list.output.includes("ines.varga@ziziwork.example"))
                problems.push(`the list: ${list.status} ${list.errors}`)
            leaks("the list", list.output)
            const palette = asUser(users.reader, () => invoke("ironstone.people.ContextServices.search#Records", {text: "Varga"}))
            if (!Array.from(palette.rows || []).some(row => row.recordId === colleague))
                problems.push("the palette does not find Ines")
            leaks("the palette", JSON.stringify(palette))
            const csv = asUser(users.reader, () => page("Employees", {term: "Varga", pageNoLimit: "true"}, "csv"))
            if (!csv.output.includes("Ines Varga")) problems.push(`the export: ${csv.status} ${csv.errors}`)
            leaks("the export", csv.output)
            // a forged link naming her employment: the Overview alone
            const forged = asUser(users.reader, () =>
                page("Employees/Employee360", {partyId: colleague, partyRelationshipId: colleagueEmployment}, "html")
            )
            if (!opened(forged) || !forged.output.includes("Ines Varga"))
                problems.push(`the forged link: ${forged.status} ${forged.errors}`)
            if (forged.output.includes("Personal information") || forged.output.includes("Files and activity"))
                problems.push("the forged link shows a private region")
            leaks("the forged link", forged.output)
            // Services' employee is not available to Retail's reader
            const other = asUser(users.reader, () => page("Employees/Employee360", {partyId: ids.otherEmployeePartyId}, "html"))
            if (!other.output.includes("Not available") || other.output.includes("Kenji Arakawa"))
                problems.push("Services' employee is shown to Retail's reader")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("people.hr corrects a colleague's home address, and the record shows it", {
    when() {
        const saved = request(
            users.hr,
            "apps/People/Employees/Employee360/storePersonalInfo",
            {
                partyId: colleague,
                expectedRevision: revisionOf(users.hr, colleague),
                address1: "12 Fjord Street",
                city: "Bergen",
                postalCode: "5003",
                countryGeoId: "NOR"
            },
            "post"
        )
        const record = asUser(users.hr, () => page("Employees/Employee360", {partyId: colleague}, "html"))
        return {saved, record}
    },
    then({saved, record}) {
        saved.errors == ""
        record.errors.length == 0
        record.output.includes("12 Fjord Street")
        record.output.includes("Personal information")
    }
})

feature("the employee corrects their own preferred name in Commons and not their legal name", {
    when() {
        const path = "apps/Commons/People/Employee360/storePersonalInfo"
        const preferred = request(
            users.employee,
            path,
            {
                partyId: ids.employeePartyId,
                expectedRevision: revisionOf(users.employee, ids.employeePartyId),
                preferredName: "Tom"
            },
            "post"
        )
        const legal = request(
            users.employee,
            path,
            {
                partyId: ids.employeePartyId,
                expectedRevision: revisionOf(users.employee, ids.employeePartyId),
                firstName: "Thomas"
            },
            "post"
        )
        const record = asUser(users.employee, () => page("People/Employee360", {partyId: ids.employeePartyId}, "html", "Commons"))
        return {preferred, legal, record}
    },
    then({preferred, legal, record}) {
        preferred.errors == ""
        legal.errors.includes("FIELD_NOT_PERMITTED")
        record.output.includes("Tomas Lindqvist (Tom)")
    }
})

feature("Insights opens a person's Overview from a drill-down, read only, with the return to the report", {
    when() {
        const drill = {partyId: ids.employeePartyId, definitionId: "BOSS_PEOPLE_DRILL_SAMPLE", panelId: "headcount"}
        const overview = asUser(users.system, () => page("Records/Employee360", drill, "html", "Insights"))
        const store = request(
            users.system,
            "apps/Insights/Records/Employee360/storePersonalInfo",
            {partyId: ids.employeePartyId, expectedRevision: "x", preferredName: "X"},
            "post"
        )
        return {overview, store}
    },
    then({overview, store}) {
        overview.errors.length == 0
        overview.output.includes("Tomas Lindqvist")
        overview.output.includes("Back to the report")
        !overview.output.includes("Personal information")
        !overview.output.includes("Edit personal information")
        store.errors.includes("RECORD_READ_ONLY")
    }
})

feature("Admin's UserDetail and Projects' PersonDetail link Employee360 only for a user who may read it", {
    when() {
        const problems = []
        const userDetail = user =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Admin.xml")
                    .renderMode("html")
                    .render("Users/UserDetail", {userId: "BOSS_PPL_EMPLOYEE", lastStandalone: "-2"}, null)
                ec.message.clearErrors()
                return String(result.output || "")
            })
        if (!userDetail(users.system).includes("Employee record")) problems.push("ADMIN's UserDetail has no Employee360 link")
        if (userDetail("admin.identity").includes("Employee record"))
            problems.push("the identity operator gets an Employee360 link")
        const personDetail = user =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Projects.xml")
                    .renderMode("html")
                    .render("Resources/PersonDetail", {partyId: ids.employeePartyId, lastStandalone: "-2"}, null)
                ec.message.clearErrors()
                return String(result.output || "")
            })
        if (!personDetail(users.system).includes("Employee record")) problems.push("ADMIN's PersonDetail has no Employee360 link")
        if (personDetail(users.otherApp).includes("Employee record")) problems.push("another app's user gets an Employee360 link")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
