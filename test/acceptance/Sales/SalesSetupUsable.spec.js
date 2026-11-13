// Sales P2's "usable when" (impl-sales P2), as an acceptance walk with artifact authorization on, through the Settings screens'
// transitions: sales.admin adds a stage to West's pipeline, moves it up and retires another, its open deals moved; sales.manager
// adds a representative to a team from a date, and is refused the pipeline settings; Admin's Health names a pipeline without
// stages with its fix place, which Admin's mount resolves to Sales' Stages; and Admin's settings index opens Sales' settings for
// the administrator. The rules themselves are Mantle's SalesPipelineSetup and BOSS SalesSettings.
// Run: ./moq accept mr-boss --spec SalesSetupUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const S = "mantle.sales.OpportunityServices."
const westPipeline = "BOSS_SAL_PL_WEST"
const state = {}

// a transition of a Sales screen posted as the user: its status, errors and messages
function post(user, path, parameters) {
    return asUser(user, () => {
        ec.message.clearAll()
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.messageInfos || []).map(info => String(info.message ?? info))
        ec.message.clearAll()
        return {status: result.status, errors, messages}
    })
}
// the organization's setup as the user reads it, with authorization aside (Mantle's own checks decide)
const setupOf = (user, organizationPartyId) =>
    asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(S + "get#SalesSetup", {organizationPartyId, includeEnded: true})
    })
const westStages = () =>
    setupOf(users.admin, ids.organizationId).pipelines.find(row => row.salesPipelineId === westPipeline).stages

feature("sales.admin adds a stage to a pipeline, moves it up and retires another, its open deals moved", {
    when() {
        system(() =>
            call("create#mantle.sales.opportunity.SalesOpportunity", {
                salesOpportunityId: "ACC_SAL_SETUP_OPP",
                opportunityName: "Setup walk deal",
                organizationPartyId: ids.organizationId,
                opportunityStageId: "BOSS_SAL_PL_WEST_TRIAL",
                statusId: "SalesOppOpen"
            })
        )
        const base = {organizationPartyId: ids.organizationId, salesPipelineId: westPipeline}
        const added = post(
            users.admin,
            "Settings/Stages/storeStage",
            Object.assign({description: "Pilot", defaultProbability: "60"}, base)
        )
        const pilot = westStages().find(row => row.description === "Pilot")
        const moved = post(
            users.admin,
            "Settings/Stages/storeStage",
            Object.assign({opportunityStageId: pilot?.opportunityStageId, expectedRevision: pilot?.revision, move: "up"}, base)
        )
        const trial = westStages().find(row => row.opportunityStageId === "BOSS_SAL_PL_WEST_TRIAL")
        const retired = post(
            users.admin,
            "Settings/Stages/storeStage",
            Object.assign(
                {
                    opportunityStageId: trial.opportunityStageId,
                    expectedRevision: trial.revision,
                    retireStage: "Y",
                    reassignStageId: pilot?.opportunityStageId
                },
                base
            )
        )
        const order = westStages()
            .filter(row => !row.ended)
            .map(row => row.description)
        const deal = system(() =>
            ec.entity.find("mantle.sales.opportunity.SalesOpportunity").condition("salesOpportunityId", "ACC_SAL_SETUP_OPP").one()
        )
        state.pilotId = pilot?.opportunityStageId
        return {added, moved, retired, order, dealStage: deal.opportunityStageId, pilotId: pilot?.opportunityStageId}
    },
    then({added, moved, retired, order, dealStage, pilotId}) {
        added.errors.length == 0
        moved.errors.length == 0
        retired.errors.length == 0
        retired.messages.some(message => message.includes("1 open deals moved"))
        // Pilot moved above Contract; Trial retired
        JSON.stringify(order) == JSON.stringify(["Qualified", "Demonstration", "Pilot", "Contract"])
        dealStage == pilotId
    }
})

feature("sales.manager adds a representative to a team from a date, and is refused the pipeline settings", {
    when() {
        const from = ec.l10n.format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd HH:mm:ss")
        const added = post(users.manager, "Settings/Teams/storeMember", {
            organizationPartyId: ids.organizationId,
            teamPartyId: "BOSS_SAL_TEAM_WEST",
            partyId: "BOSS_SAL_REP",
            roleTypeId: "SalesRepresentative",
            fromDate: from
        })
        const west = setupOf(users.manager, ids.organizationId).teams.find(row => row.teamPartyId === "BOSS_SAL_TEAM_WEST")
        const membership = west.members.find(row => row.partyId === "BOSS_SAL_REP")
        const stages = post(users.manager, "Settings/Stages/storeStage", {
            organizationPartyId: ids.organizationId,
            salesPipelineId: westPipeline,
            description: "Manager's stage"
        })
        return {added, membership, stages}
    },
    then({added, membership, stages}) {
        added.errors.length == 0
        membership != null
        membership.stateText.startsWith("From ")
        // the membership starts later: it changes nothing now
        membership.current == false
        stages.errors.length > 0 || stages.status != 200
    }
})

feature("Admin's Health names a pipeline without stages with its fix place; the settings index opens Sales' settings", {
    when() {
        const created = asUser(users.admin, () => {
            ec.artifactExecution.disableAuthz()
            return invoke(S + "store#Pipeline", {organizationPartyId: ids.otherOrganizationId, pipelineName: "Walk pipeline"})
        })
        const health = asUser(users.admin, () =>
            invoke("org.moqui.admin.ReadinessServices.get#Readiness", {
                providerKey: "sales.readiness",
                scopeParameters: {organizationPartyId: ids.otherOrganizationId}
            })
        )
        const check = Array.from(health.checks || []).find(row => row.checkKey === "sales.pipelineStages")
        const index = asUser(users.admin, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Admin.xml")
                .renderMode("html")
                .render("Settings/SettingsHome", {}, null)
        )
        return {created, check, index: {status: index.status, output: String(index.output || "")}}
    },
    then({created, check, index}) {
        check != null
        check.state == "failed"
        check.fixRoute == "salesStages"
        check.fixId == created.salesPipelineId
        index.status == 200
        index.output.includes("Sales settings")
        index.output.includes("/qapps/Sales/Settings")
    }
})
