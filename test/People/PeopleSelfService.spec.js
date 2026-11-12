// People self-service, the manager's team and Today (impl-people P8; design-people §3 SelfService, MyTeam, §1.4 Today; F28, F64):
// SelfService's one qvt render, under Commons, as the self-service employee (their employment, People tasks, requests and
// emergency contacts, and their record's link), with a supplied partyId changing nothing there or in Mantle's self-service and
// another person's emergency contacts refused; Commons Home's People card for them; My team's one qvt render as the manager (their
// reports and no one else; P10: their last week and Remind missing time); and People's Today source, the decisions waiting on a
// decider and nothing for the employee (P10: their weeks to submit are PeopleTime's). P10: SelfService's My time and missing-week card. The access
// cases (the self-service grant, which opens SelfService and nothing else of People, and My team the managers') are PeopleAccess's;
// Mantle's rules (the team's employments, self-service's own party, due work, emergency contacts) are Mantle's PeopleScope,
// PeopleDirectory, PeopleApprovals and PeopleChecklists. The usable-when walk is the acceptance PeopleSelfServiceUsable.
// Run: ./moq test mr-boss --spec PeopleSelfService
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const S = "mantle.humanres.PeopleServices."
// a Commons screen as the shell fetches it, in html (the People card is plain widgets)
function commonsPage(path) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/Commons.xml")
        .renderMode("html")
        .render(path, {lastStandalone: "-2"}, null)
    const output = String(result.output || "")
    const errors = Array.from(result.errorMessages || []).concat(
        output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    )
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the emergency contact the spec added ends, so no later spec meets it
        system(() =>
            ec.entity
                .find("mantle.party.PartyRelationship")
                .condition({relationshipTypeEnumId: "PrtEmergencyContact", fromPartyId: ids.employeePartyId})
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a supplied partyId changes nothing: self-service is the employee's own, and another person's emergency contacts are refused",
    {
        when() {
            return asUser(users.employee, () => ({
                self: invoke(S + "get#SelfService", {partyId: ids.reportPartyId}),
                other: refusal(S + "store#EmergencyContact", {
                    partyId: ids.reportPartyId,
                    firstName: "Not",
                    lastName: "Added",
                    phone: "555 0102"
                }),
                own: refusal(S + "store#EmergencyContact", {
                    partyId: ids.employeePartyId,
                    firstName: "Maja",
                    lastName: "Lindqvist",
                    relationshipName: "Sister",
                    phone: "555 0177"
                })
            }))
        },
        then({self, other, own}) {
            self.partyId == ids.employeePartyId
            self.personName == "Tomas Lindqvist"
            self.employments.map(row => row.organizationPartyId) == [ids.organizationId]
            self.employments[0].managerName == "Hannah Okafor"
            other.includes("RECORD_UNAVAILABLE")
            own == ""
        }
    }
)

feature(
    "SelfService under Commons shows the employee their employment, People tasks, requests and emergency contacts, and opens their record; another person's partyId changes nothing",
    {
        when() {
            return {
                rendered: asUser(users.employee, () => page("People/SelfService", {partyId: ids.reportPartyId}, "qvt", "Commons"))
            }
        },
        then({rendered}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Tomas Lindqvist")
            !rendered.output.includes("Ines Varga")
            rendered.output.includes("My employment")
            rendered.output.includes("Store Operations")
            rendered.output.includes("Hannah Okafor")
            rendered.output.includes("My People tasks")
            rendered.output.includes("My requests")
            // the emergency contact added above, with its actions, the employee's own to change
            rendered.output.includes("Maja Lindqvist")
            rendered.output.includes("Sister")
            rendered.output.includes("EditEmergencyContact_")
            rendered.output.includes("Add contact")
            // the primary action: their own record, under Commons (they open no People screen)
            rendered.output.includes("Open my employee record")
            rendered.output.includes("Commons/People/Employee360")
            // P10: their own week, under People's time area (its own grant), and the missing-week card
            rendered.output.includes("Weeks to submit")
            rendered.output.includes("/qapps/People/Time/MyTime")
        }
    }
)

feature("Commons Home shows the self-service employee People's card, which a user without self-service is not answered", {
    when() {
        return {
            home: asUser(users.employee, () => commonsPage("Home")),
            reader: asUser(users.reader, () => system(() => invoke(S + "get#SelfService", {checkOnly: true}))).available
        }
    },
    then({home, reader}) {
        home.status == 200
        home.errors.length == 0
        home.output.includes("My employment")
        home.output.includes("Ziziwork Retail")
        home.output.includes("People/SelfService")
        reader == false
    }
})

feature("My team shows the manager their reports and the decisions waiting on them, no one else's", {
    when() {
        return {rendered: asUser(users.manager, () => page("MyTeam"))}
    },
    then({rendered}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Tomas Lindqvist")
        rendered.output.includes("Ines Varga")
        rendered.output.includes("Rafael Mbeki")
        // Retail's employee with no manager and Services' employee are not hers
        !rendered.output.includes("Leon Ferreira")
        !rendered.output.includes("Kenji Arakawa")
        rendered.output.includes("Decisions waiting on you")
        // P10: each report's last week, and Remind missing time on the selected people
        rendered.output.includes("Last week")
        rendered.output.includes("Remind missing time")
    }
})

feature("People's Today source answers a decider their decisions waiting and the employee nothing", {
    when() {
        const today = user => asUser(user, () => system(() => invoke("ironstone.people.ContextServices.get#TodayItems", {})))
        return {employee: today(users.employee), manager: today(users.manager)}
    },
    then({employee, manager}) {
        employee.label == "People"
        employee.items == []
        manager.label == "People"
        manager.items != null
    }
})
