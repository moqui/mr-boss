// People's organization and org chart (impl-people P3; design-people §4 OrgStructure and OrgChart): OrgStructure's one qvt render,
// as an HR officer with a department open (its facts, dated parent, members and the HR editor's actions); the tree's next level
// from its unitChildren transition, the employer's departments and its legal child organization, and another employer's refused;
// OrgChart's one qvt render, as a directory reader (each employer's top, the person with no manager listed, no change action), and
// its reportChildren level per employment (Priya under Greta at Retail; Services' level refused to a Retail reader). Mantle's
// rules (cycles, dates, revisions, memberships, the line per employment) are Mantle's PeopleOrganization; the access case of the
// changes is PeopleAccess's. The usable-when walk is the acceptance PeopleOrganizationUsable.
// Run: ./moq test mr-boss --spec PeopleOrganization
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const O = "mantle.humanres.OrganizationServices."
// a level of a tree as the browser asks for it: the transition's JSON answer under the People root, or its errors
function level(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://webroot/screen/webroot.xml")
            .render("apps/People/Employees/" + path, parameters, "get")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return errors ? {errors, rows: []} : {errors: "", rows: JSON.parse(String(result.output || "[]"))}
    })
}

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
    "OrgStructure shows an HR officer the employer's tree and an open department with its parent, members and the editor's actions",
    {
        when() {
            return {
                rendered: asUser(users.hr, () => page("Employees/OrgStructure", {unitPartyId: ids.departmentId})),
                readerUnit: asUser(users.reader, () => system(() => invoke(O + "get#Unit", {partyId: ids.departmentId}))).unit
            }
        },
        then({rendered, readerUnit}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Ziziwork Retail")
            rendered.output.includes("Store Operations")
            rendered.output.includes("Department of Ziziwork Retail")
            rendered.output.includes("lead Hannah Okafor")
            rendered.output.includes("Rafael Mbeki")
            rendered.output.includes("New unit")
            rendered.output.includes("Add member")
            rendered.output.includes("End membership")
            !rendered.output.includes("Service Delivery")
            // the reader reads the same unit and may change nothing (the screen's actions are conditioned on canEdit)
            readerUnit.organizationName == "Store Operations"
            readerUnit.canEdit == false
        }
    }
)

feature(
    "the organization tree's next level is the employer's departments and legal child organizations; another employer's is refused",
    {
        when() {
            const retail = level(users.hr, "OrgStructure/unitChildren", {parentPartyId: ids.organizationId})
            return {
                retail: retail.rows.map(row => [row.organizationName, row.unitKind].join(" ")).sort(),
                retailErrors: retail.errors,
                store: level(users.hr, "OrgStructure/unitChildren", {parentPartyId: ids.departmentId}).rows.map(
                    row => row.partyId
                ),
                services: level(users.hr, "OrgStructure/unitChildren", {parentPartyId: ids.otherOrganizationId}).errors
            }
        },
        then({retail, retailErrors, store, services}) {
            retailErrors == ""
            retail == ["Merchandising department", "Store Operations department", "Ziziwork Returns Center organization"]
            store == [ids.teamId]
            services.includes("RECORD_UNAVAILABLE")
        }
    }
)

feature("OrgChart shows a directory reader each employer's top and no change action; a level is per employment", {
    when() {
        return {
            rendered: asUser(users.reader, () => page("Employees/OrgChart")),
            greta: level(users.reader, "OrgChart/reportChildren", {parentNodeId: ids.organizationId + "/BOSS_PPL_GRETA"}).rows,
            amara: level(users.reader, "OrgChart/reportChildren", {parentNodeId: ids.otherOrganizationId + "/BOSS_PPL_AMARA"}),
            hrCanEdit: asUser(users.hr, () => system(() => invoke(O + "get#ReportingTree", {pageSize: 1}))).canEdit
        }
    },
    then({rendered, greta, amara, hrCanEdit}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Greta Haugen")
        // Leon has no manager: listed at the top, not lost
        rendered.output.includes("Leon Ferreira")
        rendered.output.includes("No manager")
        !rendered.output.includes("Tomas Lindqvist")
        !rendered.output.includes("Kenji Arakawa")
        !rendered.output.includes("Change manager")
        greta.map(row => row.personName).sort() == ["Hannah Okafor", "Priya Natarajan"]
        greta.every(row => row.lineRevision == null && row.organizationPartyId == ids.organizationId)
        amara.errors.includes("ORGANIZATION_DENIED")
        hrCanEdit == true
    }
})
