// Sales settings (impl-sales P2; design-sales §9 Settings, Stages, Teams, LeadSources, TypesAndReasons): the Settings area is the
// administrator's, a manager keeps Teams alone and a representative none, and Admin's settings index lists Sales' entry for its
// administrator only; TeamMembers' lookup offers the people who work for the manager's organization and nothing of another's;
// Stages' one qvt render (the shared and West's pipelines, a pipeline's stages with their open deals) and Teams' one html render
// (a team's dated members, the ended one among them). The setup rules themselves (retiring a stage in use, memberships ended, a
// source offered to one organization, the refusals) are Mantle's SalesPipelineSetup. The usable-when walk is the acceptance
// SalesSetupUsable.
// Run: ./moq test mr-boss --spec SalesSettings
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, invoke, page, screenRefusal, shell} = lib
const choices = "ironstone.sales.ContextServices.get#Choices"
const unauthorized = message => /^40[13] |is not authorized|PERMISSION_DENIED/.test(message)

feature("Settings is the administrator's, Teams also a manager's; Admin's index lists Sales' entry for its administrator only", {
    when() {
        const problems = []
        const tabs = user => shell(user, true, "Settings/Teams", "Settings").names
        if (JSON.stringify(tabs(users.admin)) !== JSON.stringify(ids.settingsMenu))
            problems.push(`the administrator's Settings tabs: ${tabs(users.admin)}`)
        if (JSON.stringify(tabs(users.manager)) !== '["Teams"]')
            problems.push(`the manager's Settings tabs: ${tabs(users.manager)}`)
        const managerStages = screenRefusal(users.manager, "Settings/Stages", {organizationPartyId: ids.organizationId})
        if (!unauthorized(managerStages)) problems.push(`the manager opens Stages: ${managerStages || "opened"}`)
        for (const user of [users.rep, users.reader]) {
            const teams = screenRefusal(user, "Settings/Teams")
            if (!unauthorized(teams)) problems.push(`${user} opens Teams: ${teams || "opened"}`)
        }
        const settingsKeys = user =>
            Array.from(asUser(user, () => invoke("org.moqui.admin.ReadinessServices.find#Settings", {})).entries || []).map(
                entry => entry.settingsKey
            )
        if (!settingsKeys(users.admin).includes("sales.settings")) problems.push("the administrator has no sales.settings")
        for (const user of [users.manager, users.rep])
            if (settingsKeys(user).includes("sales.settings")) problems.push(`${user} has sales.settings`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("TeamMembers' lookup offers the people who work for the manager's organization, none of another's", {
    when() {
        const people = (user, organizationPartyId, term = null) =>
            asUser(user, () => invoke(choices, {choice: "teamMembers", organizationPartyId, term}).options || []).map(
                option => option.value
            )
        return {
            // Retail has many people: the Sales users among them
            retail: people(users.manager, ids.organizationId, "Sales"),
            searched: people(users.manager, ids.organizationId, "Second"),
            other: people(users.manager, ids.otherOrganizationId),
            rep: people(users.rep, ids.organizationId),
            teams: asUser(users.manager, () =>
                invoke(choices, {choice: "teams", organizationPartyId: ids.organizationId}).options.map(option => option.label)
            )
        }
    },
    then({retail, searched, other, rep, teams}) {
        retail.includes("BOSS_SAL_REP") && retail.includes("BOSS_SAL_REP2")
        !retail.includes("BOSS_SAL_REP3")
        JSON.stringify(searched) == '["BOSS_SAL_REP2"]'
        other.length == 0
        // a representative keeps no team
        rep.length == 0
        JSON.stringify(teams) == '["Retail East","Retail West"]'
    }
})

feature("Stages renders once in qvt and Teams once in html: pipelines, stages with their open deals, a team's dated members", {
    when() {
        return {
            stages: asUser(users.admin, () =>
                page("Settings/Stages", {organizationPartyId: ids.organizationId, salesPipelineId: "BOSS_SAL_PL_WEST"})
            ),
            teams: asUser(users.manager, () =>
                page(
                    "Settings/Teams",
                    {organizationPartyId: ids.organizationId, teamPartyId: "BOSS_SAL_TEAM_EAST", includeEnded: "Y"},
                    "html"
                )
            )
        }
    },
    then({stages, teams}) {
        stages.status == 200 && stages.errors.length == 0
        stages.output.includes("Sales pipeline")
        stages.output.includes("Shared by every organization")
        stages.output.includes("West key accounts")
        stages.output.includes("Demonstration")
        stages.output.includes("Open deals")
        teams.status == 200 && teams.errors.length == 0
        teams.output.includes("Retail East: members")
        teams.output.includes("Sales Representative")
        // sales.rep2's ended membership of East, with its end
        teams.output.includes("Sales Second representative")
        teams.output.includes("Ended 2026-07-01")
    }
})
