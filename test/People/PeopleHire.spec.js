// People's hire and employment change screens (impl-people P6; design-people §4 HireEmployee and EmploymentChange): the hire
// wizard's Identity step, one qvt render as Retail's HR officer (the employer and the person search, a draft left resumed), the hire's person search
// finding by name the people related to Retail (its contractor) and someone another employer employs only by their exact email
// (public identity only; the user's call), a supplied id of that person not named, and nothing for a directory reader, the employment change
// wizard's Change step, one qvt render for Tomas's transfer (his terms now; Services' employment not available), and the choices
// the wizards add, each with a selected value off the page. The rules are Mantle's PeopleEmployment; the access rule is PeopleAccess's; the golden path in the browser is
// the client walk PeopleHireWalk. Run: ./moq test mr-boss --spec PeopleHire
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const choices = "ironstone.people.ContextServices.get#Choices"
const choice = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options || []

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "HireEmployee shows the HR officer the hire wizard's first step; the person search finds by name the people related to the employer, someone another employer employs by their exact email alone, and nothing for a directory reader",
    {
        when() {
            // a hire the officer started and left: its draft record is resumed on the wizard's first step (the user's call)
            const draftService = "mantle.humanres.PeopleServices."
            const kept = asUser(users.hr, () =>
                system(() =>
                    invoke(draftService + "store#EmploymentDraft", {
                        draftKind: "hire",
                        draft: {organizationPartyId: ids.organizationId, firstName: "Resumedfirst", lastName: "Hire"}
                    })
                )
            )
            const rendered = asUser(users.hr, () => page("Employees/HireEmployee/Identity", {lastStandalone: "true"}))
            asUser(users.hr, () =>
                system(() => invoke(draftService + "delete#EmploymentDraft", {employmentDraftId: kept.employmentDraftId}))
            )
            return {
                rendered,
                // Kenji is Services' employee, with no relationship to Retail: not found by name, found by his exact email (to be
                // hired, not made again), and his id alone names no one
                byName: choice(users.hr, {choice: "hirePeople", term: "Kenji", organizationPartyId: ids.organizationId}),
                found: choice(users.hr, {
                    choice: "hirePeople",
                    term: "Kenji.Arakawa@ziziwork.example",
                    organizationPartyId: ids.organizationId
                }),
                byId: choice(users.hr, {
                    choice: "hirePeople",
                    term: "zzz",
                    selected: ids.otherEmployeePartyId,
                    organizationPartyId: ids.organizationId
                }),
                reader: choice(users.reader, {
                    choice: "hirePeople",
                    term: "kenji.arakawa@ziziwork.example",
                    organizationPartyId: ids.organizationId
                }),
                // the contractor: their contractor relationship with Retail is named
                contractor: choice(users.hr, {choice: "hirePeople", term: "Nadia", organizationPartyId: ids.organizationId})
            }
        },
        then({rendered, byName, found, byId, reader, contractor}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Who is hired")
            rendered.output.includes("Existing person")
            rendered.output.includes("A new person: none of the people found is them")
            rendered.output.includes("Resumedfirst")
            byName == []
            found.map(option => option.value) == [ids.otherEmployeePartyId]
            found[0].label == "Kenji Arakawa"
            byId == []
            reader == []
            contractor.map(option => option.label) == ["Nadia Kowal · Contractor (current)"]
        }
    }
)

feature("EmploymentChange shows the HR officer a transfer's first step with the employment's terms now", {
    when() {
        return {
            rendered: asUser(users.hr, () =>
                page("Employees/EmploymentChange/Change", {
                    partyRelationshipId: ids.employmentId,
                    changeKind: "transfer",
                    lastStandalone: "true"
                })
            ),
            other: asUser(users.hr, () =>
                system(() =>
                    lib.refusal("mantle.humanres.PeopleServices.preview#EmploymentChange", {
                        partyRelationshipId: ids.otherEmploymentId,
                        changeKind: "transfer"
                    })
                )
            )
        }
    },
    then({rendered, other}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Now: Store Operations · Sales associate 1 · manager Hannah Okafor")
        rendered.output.includes("It waits for approval")
        rendered.output.includes("Work location")
        // Services' employment is not Retail's HR officer's to change
        other.includes("RECORD_UNAVAILABLE")
    }
})

feature(
    "the wizards' choices offer the employer's positions, work locations and the termination vocabularies, each with its selected value",
    {
        when() {
            const options = parameters => choice(users.hr, parameters)
            return {
                positions: options({
                    choice: "positions",
                    organizationPartyId: ids.organizationId,
                    departmentPartyId: ids.departmentId
                }),
                selectedPosition: options({
                    choice: "positions",
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: ids.merchPositionId
                }),
                otherPositions: options({choice: "positions", organizationPartyId: ids.otherOrganizationId}),
                locations: options({
                    choice: "workLocations",
                    organizationPartyId: ids.organizationId,
                    term: "zzz",
                    selected: "BOSS_WH_EAST"
                }),
                types: options({choice: "terminationTypes", term: "zzz", selected: "TtResigned"}),
                reasons: options({choice: "terminationReasons"})
            }
        },
        then({positions, selectedPosition, otherPositions, locations, types, reasons}) {
            // Store Operations' seats in effect, the vacant ones first, none of Merchandising's
            positions.length >= 4
            positions[0].label.endsWith("(vacant)")
            !positions.some(option => option.value == ids.merchPositionId)
            selectedPosition.map(option => option.value) == [ids.merchPositionId]
            otherPositions == []
            locations.map(option => option.value) == ["BOSS_WH_EAST"]
            types.map(option => option.label) == ["Resigned"]
            // Mantle's seeded reasons for leaving
            reasons.map(option => option.label).slice(0, 5) ==
                ["Resignation", "End of contract", "Dismissal", "Retirement", "Redundancy"]
        }
    }
)
