// People P3's "usable when" (impl-people P3; design-people §4 OrgStructure and OrgChart), as an acceptance walk with artifact
// authorization on: people.hr adds a department and a team through OrgStructure, moves the department under another from next
// month and sees both parents by as-of date; people.hr changes a manager from next month through OrgChart and sees the old line
// now and the new one then; people.reader walks the chart one level at a time, in the browser (qvt) and the terminal (tui), and
// edits nothing (no change action shown, and a forged change refused). The rules themselves are Mantle's PeopleOrganization and
// mr-boss's PeopleOrganization and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleOrganizationUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const O = "mantle.humanres.OrganizationServices."
const webroot = "component://webroot/screen/webroot.xml"
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const day = 24 * 60 * 60 * 1000
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle read as the user, for the walk's checks (the screens show the same answer)
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(O + service, parameters)))
const state = {}

spec({
    setupSpec() {
        login("john.doe")
        // next month, a day in the user's zone
        state.nextMonth = ec.l10n.format(new Date(ec.user.timestampMillis(ec.user.nowTimestamp) + 31 * day), "yyyy-MM-dd")
        state.afterNextMonth = ec.l10n.format(new Date(ec.user.timestampMillis(ec.user.nowTimestamp) + 33 * day), "yyyy-MM-dd")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.hr adds a department and a team, moves the department from next month and sees both parents by as-of date", {
    when() {
        const problems = []
        const store = parameters => request(users.hr, "apps/People/Employees/OrgStructure/storeUnit", parameters, "post")
        const department = store({unitKind: "department", organizationName: "Pricing", parentPartyId: ids.organizationId})
        if (department.errors) problems.push(`the department: ${department.errors}`)
        const pricing = read(users.hr, "find#Units", {term: "Pricing"}).units.find(row => row.unitKind === "department")
        const team = store({unitKind: "team", organizationName: "Pricing Analysts", parentPartyId: pricing?.partyId})
        if (team.errors) problems.push(`the team: ${team.errors}`)
        // the move: Pricing goes under Merchandising from next month
        const moved = store({
            partyId: pricing?.partyId,
            parentPartyId: "BOSS_PPL_D_MERCH",
            fromDate: state.nextMonth,
            changeReason: "Pricing joins Merchandising",
            expectedRevision: pricing?.revision
        })
        if (moved.errors) problems.push(`the move: ${moved.errors}`)
        const now = read(users.hr, "find#Units", {parentPartyId: ids.organizationId}).units.map(row => row.partyId)
        const then = read(users.hr, "find#Units", {parentPartyId: "BOSS_PPL_D_MERCH", asOfDate: state.afterNextMonth}).units.map(
            row => row.partyId
        )
        if (!now.includes(pricing?.partyId)) problems.push("Pricing is not under Retail now")
        if (!then.includes(pricing?.partyId)) problems.push("Pricing is not under Merchandising next month")
        // the screen with the department open shows both parents, dated
        const rendered = asUser(users.hr, () => page("Employees/OrgStructure", {unitPartyId: pricing?.partyId}, "html"))
        if (!opened(rendered)) problems.push(`OrgStructure: ${rendered.status} ${rendered.errors}`)
        for (const text of ["Pricing", "Merchandising", "Ziziwork Retail", "Pricing joins Merchandising", "Current", "From "])
            if (!rendered.output.includes(text)) problems.push(`OrgStructure does not show ${text}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("people.hr changes a manager from next month; the chart shows the old line now and the new one then", {
    when() {
        const problems = []
        // Rafael reports to Hannah; from next month to Ines
        const node = read(users.hr, "get#ReportingTree", {organizationPartyId: ids.organizationId, partyId: "BOSS_PPL_RAFAEL"})
            .nodes[0]
        const changed = request(
            users.hr,
            "apps/People/Employees/OrgChart/changeManager",
            {
                partyId: "BOSS_PPL_RAFAEL",
                lineOrganizationPartyId: ids.organizationId,
                newManagerPartyId: ids.reportPartyId,
                fromDate: state.nextMonth,
                changeReason: "Joins Ines's shift",
                expectedRevision: node?.lineRevision
            },
            "post"
        )
        if (changed.errors) problems.push(`the change: ${changed.errors}`)
        const reportsOf = (managerPartyId, asOfDate) =>
            read(users.hr, "get#ReportingTree", {organizationPartyId: ids.organizationId, managerPartyId, asOfDate}).nodes.map(
                row => row.partyId
            )
        if (!reportsOf(ids.managerPartyId).includes("BOSS_PPL_RAFAEL")) problems.push("Rafael is not Hannah's report now")
        if (!reportsOf(ids.reportPartyId, state.afterNextMonth).includes("BOSS_PPL_RAFAEL"))
            problems.push("Rafael is not Ines's report next month")
        if (reportsOf(ids.managerPartyId, state.afterNextMonth).includes("BOSS_PPL_RAFAEL"))
            problems.push("Rafael is still Hannah's report next month")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("people.reader walks the chart one level at a time in the browser and the terminal and edits nothing", {
    when() {
        const problems = []
        // the levels: the top, Greta's reports, Hannah's reports, each by the link a person's reports count opens
        // Priya reports to Greta while she is employed by Retail (PeopleHireUsable separates her from Retail in a whole run)
        const priyaRetail = system(() =>
            ec.entity
                .find("mantle.party.PartyRelationship")
                .condition({fromPartyId: ids.dualPartyId, toPartyId: ids.organizationId, relationshipTypeEnumId: "PrtEmployee"})
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .count()
        )
        const priya = priyaRetail > 0 ? {shows: ["Priya Natarajan"], hides: []} : {shows: [], hides: ["Priya Natarajan"]}
        const levels = [
            {parameters: {}, shows: ["Greta Haugen", "Leon Ferreira"], hides: ["Hannah Okafor"]},
            {
                parameters: {managerPartyId: "BOSS_PPL_GRETA", organizationPartyId: ids.organizationId},
                shows: ["Hannah Okafor"].concat(priya.shows),
                hides: ["Tomas Lindqvist"].concat(priya.hides)
            },
            {
                parameters: {managerPartyId: ids.managerPartyId, organizationPartyId: ids.organizationId},
                shows: ["Tomas Lindqvist", "Ines Varga", "Up to Greta Haugen"],
                hides: ["Kenji Arakawa"]
            }
        ]
        for (const mode of ["qvt", "tui"])
            for (const level of levels) {
                const rendered = asUser(users.reader, () => page("Employees/OrgChart", level.parameters, mode))
                const label = mode + " " + JSON.stringify(level.parameters)
                if (!opened(rendered)) problems.push(`${label}: ${rendered.status} ${rendered.errors}`)
                for (const text of level.shows)
                    if (!rendered.output.includes(text)) problems.push(`${label} does not show ${text}`)
                for (const text of level.hides) if (rendered.output.includes(text)) problems.push(`${label} shows ${text}`)
                if (rendered.output.includes("Change manager")) problems.push(`${label} offers Change manager`)
            }
        // a forged change and a forged unit are refused
        const forged = request(
            users.reader,
            "apps/People/Employees/OrgChart/changeManager",
            {partyId: ids.employeePartyId, lineOrganizationPartyId: ids.organizationId, newManagerPartyId: ids.reportPartyId},
            "post"
        )
        if (!forged.errors.includes("PERMISSION_DENIED")) problems.push(`the forged change: ${forged.errors || "accepted"}`)
        const forgedUnit = request(
            users.reader,
            "apps/People/Employees/OrgStructure/storeUnit",
            {unitKind: "team", organizationName: "Forged", parentPartyId: ids.organizationId},
            "post"
        )
        if (!forgedUnit.errors.includes("PERMISSION_DENIED")) problems.push(`the forged unit: ${forgedUnit.errors || "accepted"}`)
        const structure = asUser(users.reader, () => page("Employees/OrgStructure", {unitPartyId: ids.departmentId}, "tui"))
        if (!opened(structure) || !structure.output.includes("Store Operations"))
            problems.push(`OrgStructure in the terminal: ${structure.status} ${structure.errors}`)
        for (const text of ["New unit", "Add member", "End membership"])
            if (structure.output.includes(text)) problems.push(`the reader's OrgStructure offers ${text}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
