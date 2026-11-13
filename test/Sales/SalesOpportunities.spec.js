// Sales' pipeline screens (impl-sales P4; design-sales §3): Opportunities' one qvt render (the board of the default pipeline with its
// stage columns, empty ones too, the representative's and their team's deals and not another team's, the totals and the row's
// Change stage dialog), its board move by a column's stage name (moveCard), OpportunityDetail's one qvt render (the record header,
// people, competitors, activities, Conversation and Files) and its "Not available" for another team's rep, and Leads' one html
// render (the leads of the rep's team queue, the Qualify dialog; P5: the intake columns of the demo mail inquiry). The rules are
// Mantle's SalesOpportunities and SalesLeadQualify; the access rule is SalesAccess'. Demo data: data/BossZSalesDemoData.xml (P4 and
// P5 blocks).
// Run: ./moq test mr-boss --spec SalesOpportunities
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, page} = lib
const {deals} = ids

const stageOf = salesOpportunityId =>
    system(() =>
        ec.entity.find("mantle.sales.opportunity.SalesOpportunity").condition("salesOpportunityId", salesOpportunityId).one()
    ).opportunityStageId

feature("Opportunities' board shows the pipeline's stages and the rep's and team's deals; a card moves by its column's stage", {
    when() {
        // no organization asked: the board's columns are the pipeline of the one organization the rep works for (Retail, not its
        // Returns Center rollup child, which the rep's scope also holds)
        const board = asUser(users.rep, () => page("Pipeline/Opportunities"))
        const before = stageOf(deals.wingtipPlan)
        // the card's revision as the board's row carries it (Mantle's read, as the rep, its grant aside)
        const revision = asUser(users.rep, () =>
            system(
                () =>
                    ec.service
                        .sync()
                        .name("mantle.sales.OpportunityServices.get#Opportunity")
                        .parameters({salesOpportunityId: deals.wingtipPlan})
                        .call().opportunity.revision
            )
        )
        const moved = asUser(users.rep, () =>
            page(
                "Pipeline/Opportunities/moveCard",
                {salesOpportunityId: deals.wingtipPlan, stageText: "Discovery", revision},
                "html"
            )
        )
        return {board, before, after: stageOf(deals.wingtipPlan), moved}
    },
    then({board, before, after, moved}) {
        board.errors.length == 0
        board.output.includes("Wingtip stores refit")
        board.output.includes("Wingtip maintenance plan")
        // another team's deal is not on the rep's board, nor a lead
        !board.output.includes("Contoso lab pilot")
        !board.output.includes("Website enquiry")
        // the default pipeline's stages as the board's columns, by name, empty ones too
        board.output.includes("Negotiation")
        board.output.includes("Change the stage of Wingtip stores refit")
        board.output.includes("Total ")
        before == "SalesQualified"
        moved.errors.length == 0
        after == "SalesDiscovery"
    }
})

feature(
    "OpportunityDetail shows the deal with its people, competitor, activity and collaboration; another team's rep is told it is not available",
    {
        when() {
            return {
                own: asUser(users.rep, () => page("Pipeline/OpportunityDetail", {salesOpportunityId: deals.wingtip})),
                other: asUser(users.rep2, () => page("Pipeline/OpportunityDetail", {salesOpportunityId: deals.wingtip}, "html"))
            }
        },
        then({own, other}) {
            own.errors.length == 0
            own.output.includes("Wingtip stores refit")
            own.output.includes("Wingtip Traders")
            own.output.includes("Proposal")
            own.output.includes("Dana Morales")
            own.output.includes("Northgate Fixtures")
            own.output.includes("Send Wingtip the revised layout")
            own.output.includes("Schedule activity")
            own.output.includes("OpportunityChatter")
            own.output.includes("OpportunityFiles")
            // an open opportunity is closed from here, never qualified again
            own.output.includes("Close Wingtip stores refit")
            !own.output.includes("Qualify Wingtip")
            other.output.includes("is not available")
            !other.output.includes("Northgate Fixtures")
        }
    }
)

feature("Leads lists the rep's leads and their team's queue, not another team's; an open lead offers Qualify", {
    when() {
        return {leads: asUser(users.rep, () => page("Pipeline/Leads", {organizationPartyId: ids.organizationId}, "html"))}
    },
    then({leads}) {
        leads.errors.length == 0
        leads.output.includes("Website enquiry: checkout counters")
        leads.output.includes("Trade fair visitor: store shelving")
        !leads.output.includes("Contoso second site")
        !leads.output.includes("Wingtip stores refit")
        leads.output.includes("QualifyLead_" + deals.fairLead)
        leads.output.includes("Retail trade fair")
        // P5: the demo inquiry the intake mailbox's rule took, in East's queue, with its intake columns
        leads.output.includes("Shelving for three stores")
        leads.output.includes("Came by")
        leads.output.includes("Unverified")
    }
})
