// People's employee record (impl-people P2; design-people §4 Employees and Employee360, §15 the directory export, §1.4 the
// palette and record-lookup; crosscut §3.4): Employee360's one qvt render, as an HR officer of the employer, with every region
// HR reads; the directory export's columns, the public work identity for a directory reader and the HR columns for HR; the per-app
// context narrowing Mantle's answer (Commons the user's own personal information, Insights the Overview alone, another root
// refused); and the links of the apps with no context (Projects' PersonDetail, Admin's UserDetail), the palette's directory rows
// and the Person record-lookup, each for the audience Mantle admits, with Commons' mount rendered once in html for the employee's
// own record. Mantle's projection rules are Mantle's PeopleDirectory; the access case of the employment host is PeopleAccess's.
// The directory's usable-when walk is the acceptance PeopleDirectoryUsable.
// Run: ./moq test mr-boss --spec PeopleEmployees
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const C = "ironstone.people.ContextServices."
// a context service as the user, with artifact authorization off: its own rules are under test (a mounting root's grant opens it,
// as Commons' mount render below shows for the employee, who holds no People grant)
const asCaller = (user, service, parameters) => asUser(user, () => system(() => invoke(C + service, parameters)))
const context360 = (user, appRoot, partyId) => asCaller(user, "get#Employee360Context", {appRoot, partyId})

spec({
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
    "Employee360 under People shows an HR officer the employee's work identity, personal information, history and the employment's files",
    {
        when() {
            return {
                rendered: asUser(users.hr, () =>
                    page("Employees/Employee360", {partyId: ids.employeePartyId, partyRelationshipId: ids.employmentId})
                )
            }
        },
        then({rendered}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Tomas Lindqvist")
            rendered.output.includes("tomas.lindqvist@ziziwork.example")
            rendered.output.includes("Reports to Hannah Okafor")
            rendered.output.includes("Personal information")
            rendered.output.includes("Edit personal information")
            rendered.output.includes("Employment history")
            rendered.output.includes("Files and activity")
            rendered.output.includes("mantle.humanres.employment.Employment")
        }
    }
)

feature("the directory export is the public work identity for a directory reader and adds the employment's dates for HR", {
    when() {
        const csv = user => asUser(user, () => page("Employees/List", {pageNoLimit: "true", term: "Lindqvist"}, "csv"))
        return {reader: csv(users.reader), hr: csv(users.hr)}
    },
    then({reader, hr}) {
        reader.status == 200
        reader.errors.length == 0
        reader.output.includes("Tomas Lindqvist")
        reader.output.includes("Work email")
        reader.output.includes("tomas.lindqvist@ziziwork.example")
        reader.output.includes("Ziziwork Retail")
        !reader.output.includes("Started")
        hr.errors.length == 0
        hr.output.includes("Started")
        hr.output.includes("2023-06-12")
    }
})

feature(
    "Employee360's context narrows Mantle's answer per app: Commons shows a user's own personal information, Insights the Overview alone",
    {
        when() {
            return {
                ownCommons: context360(users.employee, "Commons", ids.employeePartyId),
                colleagueCommons: context360(users.employee, "Commons", ids.reportPartyId),
                hrCommons: context360(users.hr, "Commons", ids.employeePartyId),
                hrPeople: context360(users.hr, "People", ids.employeePartyId),
                readerInsights: context360(users.reader, "Insights", ids.employeePartyId),
                readerPeople: context360(users.reader, "People", ids.employeePartyId),
                otherRoot: asUser(users.hr, () =>
                    refusal(C + "get#Employee360Context", {appRoot: "Warehouse", partyId: ids.employeePartyId})
                )
            }
        },
        then({ownCommons, colleagueCommons, hrCommons, hrPeople, readerInsights, readerPeople, otherRoot}) {
            ownCommons.recordFound == true
            ownCommons.regions == ["overview", "personalInfo"]
            ownCommons.editableFields == ["preferredName", "homePhone", "mobilePhone"]
            colleagueCommons.recordFound == false
            hrCommons.regions == ["overview"]
            hrCommons.record.personalInfo == null
            hrCommons.editableFields == []
            hrPeople.regions == ["overview", "employmentHistory", "personalInfo", "filesAndActivity"]
            hrPeople.record.hostEmploymentId == ids.employmentId
            hrPeople.editableFields.includes("homeAddress")
            readerInsights.regions == ["overview"]
            readerInsights.editableFields == []
            readerPeople.regions == ["overview"]
            otherRoot.includes("PEOPLE_CONTEXT")
        }
    }
)

feature(
    "PersonDetail's and UserDetail's link, the palette's directory and the record-lookup reach Employee360 for whom Mantle admits; Commons' mount opens the employee's own record",
    {
        when() {
            const link = (user, partyId) => asCaller(user, "get#Employee360Link", {partyId}).url || ""
            const palette = asUser(users.reader, () => invoke(C + "search#Records", {text: "lindqvist", limit: 5}).rows)
            const lookup = asUser(
                users.reader,
                () => invoke(C + "lookup#Records", {operation: "search", text: "lindqvist"}).optionList
            )
            const card = asUser(
                users.reader,
                () =>
                    invoke(C + "lookup#Records", {
                        operation: "card",
                        recordEntityName: "mantle.party.Party",
                        recordId: ids.employeePartyId
                    }).card
            )
            const commons = asUser(users.employee, () =>
                page("People/Employee360", {partyId: ids.employeePartyId}, "html", "Commons")
            )
            return {
                hr: link(users.hr, ids.employeePartyId),
                own: link(users.employee, ids.employeePartyId),
                colleague: link(users.employee, ids.reportPartyId),
                otherApp: link(users.otherApp, ids.employeePartyId),
                otherEmployer: link(users.hr, ids.otherEmployeePartyId),
                palette,
                lookup,
                card,
                commons
            }
        },
        then({hr, own, colleague, otherApp, otherEmployer, palette, lookup, card, commons}) {
            hr == "/qapps/People/Employees/Employee360?partyId=" + ids.employeePartyId
            own == "/qapps/Commons/People/Employee360?partyId=" + ids.employeePartyId
            colleague == ""
            otherApp == ""
            otherEmployer == ""
            palette.map(row => [row.recordEntity, row.recordId].join(" ")) == ["mantle.party.Party " + ids.employeePartyId]
            palette[0].url == hr
            !JSON.stringify(palette).includes("@")
            lookup.map(option => option.value) == ["mantle.party.Party|" + ids.employeePartyId]
            card.title == "Tomas Lindqvist"
            card.lines.includes("tomas.lindqvist@ziziwork.example")
            commons.status == 200
            commons.errors.length == 0
            commons.output.includes("Personal information")
            commons.output.includes("Edit personal information")
            !commons.output.includes("Employment history")
        }
    }
)
