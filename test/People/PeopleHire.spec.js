// People's hire and employment change screens (impl-people P6; design-people §4 HireEmployee and EmploymentChange): the hire
// wizard's Identity step, one qvt render as Retail's HR officer (the employer and the person search), the hire's person search
// finding someone another employer employs (public identity only) and nothing for a directory reader, the employment change
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
    "HireEmployee shows the HR officer the hire wizard's first step; the person search finds someone another employer employs, by name alone, and nothing for a directory reader",
    {
        when() {
            return {
                rendered: asUser(users.hr, () => page("Employees/HireEmployee/Identity", {lastStandalone: "true"})),
                // Kenji is Services' employee, outside Retail's HR officer's directory: found to be hired, not made again
                found: choice(users.hr, {choice: "hirePeople", term: "Kenji", organizationPartyId: ids.organizationId}),
                reader: choice(users.reader, {choice: "hirePeople", term: "Kenji", organizationPartyId: ids.organizationId}),
                // the contractor: their contractor relationship with Retail is named
                contractor: choice(users.hr, {choice: "hirePeople", term: "Nadia", organizationPartyId: ids.organizationId})
            }
        },
        then({rendered, found, reader, contractor}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Who is hired")
            rendered.output.includes("Existing person")
            rendered.output.includes("A new person: none of the people found is them")
            found.map(option => option.value) == [ids.otherEmployeePartyId]
            found[0].label == "Kenji Arakawa"
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
            Array.isArray(reasons)
        }
    }
)
