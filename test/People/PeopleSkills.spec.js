// People's skills matrix and qualifications screens (impl-people P18; design-people §10 SkillsMatrix and Qualifications, PE-20):
// SkillsMatrix's qvue template is its own component, rendered once in qvue mode; its content is its transitions' answer: as the
// learning administrator, the sales associates against their job class (Tomas's self-declared point of sale and missing first aid
// certificate his gaps, Rafael's every requirement met), an evaluation through evaluateSkill closing the point of sale gap, and Find
// available bounded to the people of the user's scope (no one of Services); the terminal twin's one tui render (SkillsMatrixTui, its
// own template) as HR with the person and skill rows and the commands; Qualifications' one qvt render as HR (Rafael's work permit
// number shown to HR) and the choices skillTypes, skillLevels and qualificationTypes, each with a selected value off the page; the
// manager's part of Employee360's Skills and reviews (Tomas's skills and verified qualifications, no resume; his skills hers to
// evaluate, the user's call of Nov 12, 2026; the region's render is PeopleEmployees' qvt render of Employee360). The rules are Mantle's Qualifications; access is
// PeopleAccess's.
// Run: ./moq test mr-boss --spec PeopleSkills
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const matrixPath = "apps/People/Development/SkillsMatrix/"

// a screen transition as the client calls it (its JSON answer), as the user with artifact authorization on
function call(user, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method === "post" ? "post" : null)
        let json = null
        try {
            json = JSON.parse(String(result.output || ""))
        } catch (error) {
            json = null
        }
        return {status: result.status, json, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}
const cellOf = (matrix, partyId, skillTypeEnumId) =>
    matrix?.rows?.find(row => row.partyId === partyId)?.cells.find(cell => cell.skillTypeEnumId === skillTypeEnumId)

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "the skills matrix as the learning administrator: the sales associates' gaps, an evaluation closing one, Find available",
    {
        when() {
            const out = {}
            const component = asUser(users.develop, () =>
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .renderMode("qvue")
                    .render("Development/SkillsMatrix", {lastStandalone: "-2"}, null)
            )
            out.component = {status: component.status, output: String(component.output || "")}
            const filter = {organizationPartyId: ids.organizationId, emplPositionClassId: ids.jobClassId}
            out.before = call(users.develop, matrixPath + "matrix", filter, "get").json
            const pos = cellOf(out.before.matrix, ids.employeePartyId, ids.posSkillId)
            out.saved = call(users.develop, matrixPath + "evaluateSkill", {
                partyId: ids.employeePartyId,
                skillTypeEnumId: ids.posSkillId,
                skillLevel: "2",
                evidence: "Ran the till alone for a week",
                expectedRevision: pos?.revision || ""
            }).json
            out.after = call(users.develop, matrixPath + "matrix", filter, "get").json
            const day = offset => ec.l10n.format(new Date(Date.now() + offset * 86400000), "yyyy-MM-dd", null, "America/Chicago")
            out.available = call(
                users.develop,
                matrixPath + "findAvailable",
                {skillTypeEnumId: ids.serviceSkillId, fromDate: day(30), thruDate: day(43), hoursPerWeek: "8"},
                "get"
            ).json
            return out
        },
        then({component, before, saved, after, available}) {
            component.status == 200 &&
                component.output.includes("module.exports") &&
                component.output.includes("data-skills-matrix")
            // the class's requirements as columns, by name
            before.matrix.columns.map(column => column.skillName) == ["Customer service", "First aid", "Point of sale"]
            before.matrix.columns.find(column => column.skillName == "First aid").qualificationTypeName == "First aid certificate"
            before.matrix.canEvaluate
            const tomas = before.matrix.rows.find(row => row.partyId == ids.employeePartyId)
            tomas.gapCount == 2 && tomas.canEvaluate
            cellOf(before.matrix, ids.employeePartyId, ids.posSkillId).stateText == "Gap · Self-declared only"
            cellOf(before.matrix, ids.employeePartyId, ids.firstAidSkillId).stateText == "Gap · No verified qualification"
            cellOf(before.matrix, ids.employeePartyId, ids.serviceSkillId).state == "met"
            before.matrix.rows.find(row => row.partyId == ids.associatePartyId).gapCount == 0
            before.matrix.scopePartyIds == null
            saved.messageInfos[0].message == "Evaluation saved"
            cellOf(after.matrix, ids.employeePartyId, ids.posSkillId).levelText == "2 Working"
            cellOf(after.matrix, ids.employeePartyId, ids.posSkillId).state == "met"
            after.matrix.rows.find(row => row.partyId == ids.employeePartyId).gapCount == 1
            // Find available: Retail's people with customer service, none of Services
            available.candidates.some(row => row.partyId == ids.employeePartyId && row.skillText.startsWith("Level 3"))
            !available.candidates.some(row => row.partyId == ids.otherEmployeePartyId)
        }
    }
)

feature("the terminal twin as HR: the person and skill rows with their requirement and state, and the commands", {
    when() {
        return {
            rendered: asUser(users.hr, () =>
                page(
                    "Development/SkillsMatrixTui",
                    {organizationPartyId: ids.organizationId, emplPositionClassId: ids.jobClassId},
                    "tui"
                )
            )
        }
    },
    then({rendered}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Tomas Lindqvist") && rendered.output.includes("First aid")
        rendered.output.includes("No verified qualification") && rendered.output.includes("at least 2")
        rendered.output.includes("Find available") && !rendered.output.includes("Evaluate a skill")
    }
})

feature("Qualifications as HR shows a work permit's number; the choices of skills, levels and qualification types", {
    when() {
        const rendered = asUser(users.hr, () => page("Development/Qualifications", {show: "all", state: "valid"}))
        const choice = (name, selected) =>
            asUser(users.hr, () =>
                invoke("ironstone.people.ContextServices.get#Choices", {appRoot: "People", choice: name, term: "", selected})
            ).options
        // a skill type and a qualification type off the first page (the term finds none), and a level by its number
        const choose = (name, term, selected) =>
            asUser(users.hr, () =>
                invoke("ironstone.people.ContextServices.get#Choices", {appRoot: "People", choice: name, term, selected})
            ).options.map(option => option.value)
        return {
            rendered,
            skills: choose("skillTypes", "zzz", ids.firstAidSkillId),
            types: choose("qualificationTypes", "zzz", ids.firstAidTypeId),
            levels: choice("skillLevels", "3").map(option => option.label),
            development: asUser(users.manager, () =>
                system(() => invoke("mantle.humanres.DevelopmentServices.get#PersonDevelopment", {partyId: ids.employeePartyId}))
            )
        }
    },
    then({rendered, skills, types, levels, development}) {
        rendered.status == 200 && rendered.errors.length == 0
        rendered.output.includes("Rafael Mbeki") && rendered.output.includes("WP-RET-2041")
        rendered.output.includes("Add qualification")
        skills == [ids.firstAidSkillId] && types == [ids.firstAidTypeId]
        levels == ["1 Basic", "2 Working", "3 Proficient", "4 Advanced", "5 Expert"]
        development.showsSkills && !development.showsResume && development.canEvaluate && !development.canEditResume
        development.skills.map(row => row.skillName).includes("Customer service")
        development.qualifications.every(row => row.verificationStatusId == "QlVerVerified" && row.referenceNumber === undefined)
    }
})
