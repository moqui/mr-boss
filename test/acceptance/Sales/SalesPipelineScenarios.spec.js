// Sales P4's "usable when" (impl-sales P4; design-sales §14.3 scenarios 1, 2 and 3), as an acceptance walk through the screens'
// transitions with artifact authorization on: sales.rep creates a lead with no account, finds an existing contact at qualification
// (Dana Morales of Wingtip Traders) and keeps the one record with its activity and file; the same stage move through the board's
// card, the row's Change stage and a direct service call gives the same result (the stage, the probability from the stage, the
// audit row); ending sales.rep2's West membership removes West's deals from their list from that date. The rules themselves are
// Mantle's SalesOpportunities and SalesLeadQualify and the BOSS SalesAccess and SalesOpportunities.
// Run: ./moq accept mr-boss --spec SalesPipelineScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, page} = lib
const {accounts, contacts, deals} = ids
const stamp = String(Date.now()).slice(-6)
// a transition of a Sales screen posted as the current user: its status and errors
function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || [])
    ec.message.clearErrors()
    return {status: result.status, errors, output: String(result.output || "")}
}
const deal = salesOpportunityId =>
    system(() =>
        ec.entity.find("mantle.sales.opportunity.SalesOpportunity").condition("salesOpportunityId", salesOpportunityId).one()
    )
// the deal's revision as the screens read it (Mantle's get#Opportunity)
const revision = salesOpportunityId =>
    system(
        () =>
            ec.service.sync().name("mantle.sales.OpportunityServices.get#Opportunity").parameters({salesOpportunityId}).call()
                .opportunity.revision
    )

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature(
    "scenario 1: a lead with no account is qualified on an existing contact's account as the same record, its activity and file kept",
    {
        when() {
            const name = "Usable lead " + stamp
            return asUser(users.rep, () => {
                const created = post("Pipeline/Leads/createOpportunity", {
                    typeEnumId: "SotLead",
                    organizationPartyId: ids.organizationId,
                    opportunityName: name
                })
                const leadId = system(
                    () =>
                        ec.entity.find("mantle.sales.opportunity.SalesOpportunity").condition("opportunityName", name).one()
                            ?.salesOpportunityId
                )
                const activity = post("Pipeline/OpportunityDetail/addActivity", {
                    salesOpportunityId: leadId,
                    workEffortName: "Call " + stamp
                })
                system(() =>
                    ec.service
                        .sync()
                        .name("mantle.sales.OpportunityServices.create#OpportunityContent")
                        .parameters({salesOpportunityId: leadId, contentTypeEnumId: "SocDocument", description: "Brief " + stamp})
                        .call()
                )
                const qualified = post("Pipeline/OpportunityDetail/qualifyLead", {
                    salesOpportunityId: leadId,
                    expectedRevision: revision(leadId),
                    accountPartyId: accounts.wingtip,
                    contactPartyId: contacts.dana
                })
                return {
                    created,
                    leadId,
                    activity,
                    qualified,
                    after: deal(leadId),
                    detail: page("Pipeline/OpportunityDetail", {salesOpportunityId: leadId}, "html"),
                    files: system(() =>
                        ec.entity
                            .find("mantle.sales.opportunity.SalesOpportunityContent")
                            .condition("salesOpportunityId", leadId)
                            .count()
                    )
                }
            })
        },
        then(r) {
            r.created.errors.length == 0
            r.leadId != null
            r.activity.errors.length == 0
            r.qualified.errors.length == 0
            r.after.typeEnumId == "SotOpportunity"
            r.after.accountPartyId == accounts.wingtip
            r.detail.output.includes("Dana Morales")
            r.detail.output.includes("Call " + stamp)
            r.files == 1
        }
    }
)

feature("scenario 2: the same stage move through the board, the row action and the service gives the same result", {
    when() {
        return asUser(users.rep, () => {
            const make = label =>
                post("Pipeline/Opportunities/createOpportunity", {
                    organizationPartyId: ids.organizationId,
                    opportunityName: "Move " + label + " " + stamp,
                    accountPartyId: accounts.wingtip
                }) &&
                system(
                    () =>
                        ec.entity
                            .find("mantle.sales.opportunity.SalesOpportunity")
                            .condition("opportunityName", "Move " + label + " " + stamp)
                            .one().salesOpportunityId
                )
            const [board, row, call] = ["board", "row", "call"].map(make)
            post("Pipeline/Opportunities/moveCard", {salesOpportunityId: board, stageText: "Proposal", revision: revision(board)})
            post("Pipeline/Opportunities/changeStage", {
                salesOpportunityId: row,
                opportunityStageId: "SalesProposal",
                expectedRevision: revision(row)
            })
            system(() =>
                ec.service
                    .sync()
                    .name("mantle.sales.OpportunityServices.move#Opportunity")
                    .parameters({salesOpportunityId: call, opportunityStageId: "SalesProposal", expectedRevision: revision(call)})
                    .call()
            )
            return [board, row, call].map(id => {
                const found = deal(id)
                return (
                    found.opportunityStageId +
                    ":" +
                    Number(String(found.estimatedProbability)) +
                    ":" +
                    found.probabilityModeEnumId
                )
            })
        })
    },
    then(results) {
        results[0] == "SalesProposal:50:SpmStage"
        results[1] == results[0]
        results[2] == results[0]
    }
})

feature("scenario 3: ending a rep's team membership removes the team's deals from their list from that date, their own kept", {
    when() {
        const listed = () =>
            asUser(users.rep2, () => page("Pipeline/Leads", {organizationPartyId: ids.organizationId}, "html").output)
        const before = listed()
        system(() =>
            ec.service
                .sync()
                .name("update#mantle.party.PartyRelationship")
                .parameters({partyRelationshipId: "BOSS_SAL_TM_WEST_REP2", thruDate: ec.user.nowTimestamp})
                .call()
        )
        const after = listed()
        // the demo membership restored for the walks after this one
        system(() =>
            ec.service
                .sync()
                .name("update#mantle.party.PartyRelationship")
                .parameters({partyRelationshipId: "BOSS_SAL_TM_WEST_REP2", thruDate: null})
                .call()
        )
        return {before, after}
    },
    then({before, after}) {
        // West's queue (no owner) is the team's: gone with the membership; sales.rep2's own lead stays
        before.includes("Partner referral: cafe fit-out")
        !after.includes("Partner referral: cafe fit-out")
        after.includes("Contoso second site")
    }
})
