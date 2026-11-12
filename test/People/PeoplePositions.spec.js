// People's positions, job classes and pay grades (impl-people P4; design-people §5): PositionDetail's one qvt render, as an HR
// officer with a filled seat open (its header, terms with the grade's name, holder and the HR editor's actions, and no amount);
// the choices P4 adds (an employer's departments, the current job classes, the pay grades by name, an employer's own and the
// shared ones), each with a selected value
// that is not on the page; PayGrades' one html render as the HR officer (the grades' names, no band, amount or currency). Mantle's
// rules (departments, vacancy, holders, bands, the amounts' lane) are Mantle's PeoplePositions; the access cases are PeopleAccess's.
// The usable-when walk is the acceptance PeoplePositionsUsable.
// Run: ./moq test mr-boss --spec PeoplePositions
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const choices = "ironstone.people.ContextServices.get#Choices"
// a choice's labels as the user, with the selected value's label
const labels = (user, parameters) => asUser(user, () => invoke(choices, parameters)).options.map(option => option.label)

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
    "PositionDetail shows an HR officer a filled seat: its terms with the grade's name, its holder and the editor's actions",
    {
        when() {
            return {rendered: asUser(users.hr, () => page("Staffing/PositionDetail", {emplPositionId: ids.positionId}))}
        },
        then({rendered}) {
            rendered.status == 200
            rendered.errors.length == 0
            rendered.output.includes("Sales associate 1")
            rendered.output.includes("Store Operations")
            rendered.output.includes("Ziziwork Retail")
            rendered.output.includes("Associate")
            rendered.output.includes("Tomas Lindqvist")
            rendered.output.includes("Filled")
            rendered.output.includes("Edit terms")
            rendered.output.includes("End position")
            // a grade is its name here: the band's amounts are payroll's
            !/3,?000|2,?600|3,?500|USD/.test(rendered.output)
        }
    }
)

feature("the choices give an employer's departments, the current job classes and the pay grades by name", {
    when() {
        return {
            departments: labels(users.hr, {
                choice: "departments",
                organizationPartyId: ids.organizationId,
                term: "store",
                selected: "BOSS_PPL_D_MERCH"
            }),
            otherDepartments: labels(users.hr, {choice: "departments", organizationPartyId: ids.otherOrganizationId}),
            noEmployer: labels(users.hr, {choice: "departments"}),
            jobClasses: labels(users.hr, {choice: "jobClasses", term: "sales", selected: "BOSS_PPL_JC_TECH"}),
            payGrades: labels(users.hr, {choice: "payGrades", term: "assoc", selected: "BOSS_PPL_PG_MGR"}),
            // a Services seat's grades: Retail's own are not offered, the shared Lead is (of the demo's grades: a spec of the shared
            // test database may add a shared grade of its own, impl-maintenance F353's kind)
            otherPayGrades: labels(users.hr, {choice: "payGrades", organizationPartyId: ids.otherOrganizationId}).filter(name =>
                ["Associate", "Manager", "Lead"].includes(name)
            )
        }
    },
    then({departments, otherDepartments, noEmployer, jobClasses, payGrades, otherPayGrades}) {
        departments == ["Store Operations", "Merchandising"]
        otherDepartments == []
        noEmployer == []
        jobClasses == ["Sales associate", "Service technician"]
        payGrades == ["Associate", "Manager"]
        otherPayGrades == ["Lead"]
    }
})

feature("PayGrades shows an HR officer without PAYROLL_VIEW the grades' names and nothing of their bands", {
    when() {
        return {rendered: asUser(users.hr, () => page("Staffing/PayGrades", {}, "html"))}
    },
    then({rendered}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Associate")
        rendered.output.includes("Manager")
        rendered.output.includes("Their amounts are shown to payroll only")
        !rendered.output.includes("New pay grade")
        !rendered.output.includes("Reference")
        !/3,?000|6,?000|4,?200|USD/.test(rendered.output)
    }
})
