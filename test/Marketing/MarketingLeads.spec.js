// Marketing's lead rules and the Sales handoff (impl-marketing P13; design-marketing §10 Leads, LeadRules, §12 LeadSources): LeadRules'
// and LeadRuleDetail's one qvt render each for Retail's author, with all of their checks on that render (the demo garden plan request
// routed to Retail East, its mapping and notice, the preview of a sample answer, the failed handoff with its reason and Try again); the
// Leads area of an author who reads no Sales (its one tab the lead rules, Sales' Leads telling them they read no leads, nothing of a
// lead shown); the campaign's handoff counts for a reader with MARKETING_VIEW alone; and Sales' lead forms' campaign choices, offered
// only to a user who reads Marketing. The rules are Mantle's (test/marketing/LeadCapture); the access rules MarketingAccess's. The lead
// scenario is the acceptance MarketingLeadScenario.
// Run: ./moq test mr-boss --spec MarketingLeads
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, shell, system} = lib

spec({})

feature("LeadRules and LeadRuleDetail show the demo lead form's routing, preview and failed handoff to its author", {
    when() {
        return {
            list: asUser(users.author, () => page("Leads/LeadRules")),
            detail: asUser(users.author, () => page("Leads/LeadRuleDetail", {leadRuleId: ids.leadRuleId}))
        }
    },
    then({list, detail}) {
        list.status == 200 && list.errors.length == 0
        list.output.includes("Ask for a garden plan") &&
            list.output.includes("Retail East") &&
            list.output.includes("Spring garden launch")
        list.output.includes("Website enquiry") && list.output.includes("NewLeadRuleDialog")
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Garden plans to Retail East") && detail.output.includes("Current")
        detail.output.includes("Garden plan request")
        // the rule's form at its revision, the notice, End in More
        detail.output.includes("A garden adviser from our Retail East team will contact you about your plan.")
        detail.output.includes("EndLeadRuleDialog") && detail.output.includes("storeLeadRule")
        // the preview: the author reads no audience, so a sample made of the questions, to East's queue
        detail.output.includes("A sample answer") && detail.output.includes("Retail East")
        detail.output.includes("An open lead of the organization with the same email")
        // the failed handoff, its reason, and Try again
        detail.output.includes(ids.failedCaptureId) && detail.output.includes("Handoff failed")
        detail.output.includes("TEAM_UNAVAILABLE") && detail.output.includes("Try again")
        // no answer's text is shown to the author
        !detail.output.includes("ivy@thornton-cafe.example") && !detail.output.includes("Thornton Cafe")
    }
})

feature(
    "an author who reads no Sales opens the lead rules, no lead; a reader sees the campaign's handoff counts; Sales offers campaigns to a Marketing reader only",
    {
        when() {
            const tabs = shell(users.author, true, "Leads/LeadRules", "Leads")
            const leads = asUser(users.author, () => page("Leads/Leads", {}, "html"))
            // the services as the user, their own checks deciding (as a screen calls them below the area's grant)
            const as = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
            const counts = as(users.reader, "mantle.marketing.MarketingFormServices.get#LeadHandoffs", {
                marketingCampaignId: ids.runningCampaignId
            })
            const choices = (user, choice, parameters) =>
                as(user, "ironstone.sales.ContextServices.get#Choices", Object.assign({appRoot: "Sales", choice}, parameters))
                    .options
            const marketingSeller = choices(users.salesAudience, "campaigns", {
                organizationPartyId: ids.organizationId,
                selected: ids.plannedCampaignId
            })
            const seller = choices(users.salesRep, "campaigns", {organizationPartyId: ids.organizationId})
            const codes = choices(users.salesAudience, "trackingCodes", {marketingCampaignId: ids.runningCampaignId})
            return {tabs, leads, counts, marketingSeller, seller, codes}
        },
        then({tabs, leads, counts, marketingSeller, seller, codes}) {
            JSON.stringify(tabs.names) === JSON.stringify(ids.authorLeadsMenu)
            leads.status == 200 && leads.output.includes("You do not read leads in Sales.") && !leads.output.includes("LeadList")
            counts.handoffs.captured === 1 && counts.handoffs.failed === 1 && counts.handoffs.handedOff === 0
            marketingSeller.some(option => option.value === ids.runningCampaignId)
            marketingSeller.some(option => option.value === ids.plannedCampaignId)
            seller.length === 0
            Array.isArray(codes)
        }
    }
)
