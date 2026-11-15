// Marketing P13's "usable when" (impl-marketing P13; design-marketing §16.3 scenario 11, its lead half), as an acceptance scenario
// through the screens' transitions with artifact authorization on: marketing.author builds a lead form, publishes its questions and
// publishes it on the shop for the running campaign, routes its answers to Sales' Retail East queue with a lead rule and opens it; a
// visitor's lead form posted twice (one request key) becomes one lead in East's queue with the campaign as its source; with Sales'
// intake failing (East's team ended for a moment) a second visitor's answer is kept, its handoff fails, and the author's Try again makes
// the one lead once the team is back; neither visitor is on any list. The rules are Mantle's LeadCapture, the renders MarketingLeads.
// Run: ./moq accept mr-boss --spec MarketingLeadScenario
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const F = "mantle.party.FormDefinitionServices."
const PORTAL = "mantle.marketing.MarketingPortalServices."
const settle = () => ec.factory.waitWorkerPoolEmpty(50)
const site = "ZIZI_SHOP"
const state = {}
const key = () => "mls" + ec.user.randomString(12).replace(/[^A-Za-z0-9]/g, "x")
const CAPTURE = "mantle.marketing.lead.MarketingLeadCapture"
const INTAKE = "mantle.sales.opportunity.SalesLeadIntake"

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const update = (entity, fields) =>
    system(() =>
        ec.service
            .sync()
            .name("update#" + entity)
            .parameters(fields)
            .call()
    )
// a PASS operation's service as an anonymous visitor
function visitor(service, input) {
    logout()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(PORTAL + service)
            .parameters({input})
            .requireNewTransaction(true)
            .call().result
    } catch (error) {
        return {kind: error.moquiErrorKind || "Error", error: String(error.message).split("\n")[0]}
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}
const answer = (values, operationId) =>
    visitor("submit#Form", {siteId: site, publicationId: state.publicationId, values: JSON.stringify(values), operationId})
const capturesOf = email =>
    all(INTAKE, {organizationPartyId: ids.organizationId, submittedEmail: email}).map(row => row.salesOpportunityId)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the shop's site is published for the scenario (the demo leaves it to be published)
        system(() =>
            ec.service.sync().name("update#mantle.public.PublicSite").parameters({siteId: site, state: "published"}).call()
        )
    },
    cleanupSpec() {
        settle()
    }
})

feature("an author builds a lead form, routes it to Retail East with a lead rule and opens it on the shop", {
    when() {
        const formId = (state.formId = as(users.author, F + "create#Form", {
            purposeEnumId: "DbfpLead",
            organizationPartyId: ids.organizationId,
            description: "Shade garden enquiry"
        }).formId)
        for (const [title, fieldTypeEnumId, more] of [
            ["Your name", "DBFFT_text-line", {isRequired: "Y"}],
            ["Email", "DBFFT_text-line", {isRequired: "Y"}],
            ["Garden size", "DBFFT_radio", {optionText: "small | Small\nlarge | Large"}]
        ])
            asUser(users.author, () =>
                post("Surveys/SurveyDetail/saveField", Object.assign({formId, title, fieldTypeEnumId}, more))
            )
        const published = asUser(users.author, () => post("Surveys/SurveyDetail/publishForm", {formId}))
        const stored = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/storePublication", {
                formId,
                accessEnumId: "FpaAnonymous",
                repeatEnumId: "FprMany",
                siteId: site,
                marketingCampaignId: ids.runningCampaignId,
                titleText: "Plan a shade garden"
            })
        )
        state.publicationId = all("mantle.party.FormPublication", {formId})[0]?.publicationId
        const unrouted = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/publishPublication", {publicationId: state.publicationId})
        )
        const fields = all("moqui.screen.form.DbFormField", {formId})
        const fieldOf = title => fields.find(field => field.title === title)?.fieldName
        const route = () =>
            asUser(users.author, () =>
                post("Leads/LeadRuleDetail/storeLeadRule", {
                    publicationId: state.publicationId,
                    teamPartyId: ids.eastTeamId,
                    dataSourceId: "BOSS_SAL_SRC_WEB",
                    nameFieldName: fieldOf("Your name"),
                    emailFieldName: fieldOf("Email"),
                    noteFieldNames: fieldOf("Garden size"),
                    noticeText: "Retail East will call you about your shade garden."
                })
            )
        // the team is a sales manager's choice (SALES_TEAM_MANAGE; the user's call of Nov 14, 2026): the author alone is refused East,
        // and routes it while also a Retail sales manager (for this step only)
        const unmanaged = route()
        const membership = {userGroupId: "BOSS_SALES_MANAGER", userId: "BOSS_MKT_AUTHOR", fromDate: new Date(Date.now() - 1000)}
        system(() => ec.service.sync().name("create#moqui.security.UserGroupMember").parameters(membership).call())
        let routed
        try {
            routed = route()
        } finally {
            update("moqui.security.UserGroupMember", Object.assign({thruDate: new Date()}, membership))
        }
        const opened = asUser(users.author, () =>
            post("Surveys/SurveyDistribution/publishPublication", {publicationId: state.publicationId})
        )
        state.fields = {name: fieldOf("Your name"), email: fieldOf("Email"), size: fieldOf("Garden size")}
        return {published, stored, unrouted, unmanaged, routed, opened}
    },
    then(r) {
        r.published.errors === "" && r.stored.errors === "" && state.publicationId != null
        r.unrouted.errors.includes("NOT_READY")
        r.unmanaged.errors.includes("TEAM_PERMISSION")
        r.routed.errors === "" && r.opened.errors === ""
        one("mantle.party.FormPublication", {publicationId: state.publicationId}).fromDate != null
    }
})

feature("a visitor's lead form posted twice is one lead in East's queue with the campaign as its source", {
    when() {
        const page = visitor("get#Form", {siteId: site, publicationId: state.publicationId})
        const values = {[state.fields.name]: "Rowan Ash", [state.fields.email]: "rowan@ash.example", [state.fields.size]: "large"}
        const operationId = key()
        const first = answer(values, operationId)
        const again = answer(values, operationId)
        settle()
        const leads = capturesOf("rowan@ash.example")
        const lead = leads[0] ? one("mantle.sales.opportunity.SalesOpportunity", {salesOpportunityId: leads[0]}) : null
        const queue = leads[0]
            ? all("mantle.sales.opportunity.SalesOpportunityParty", {salesOpportunityId: leads[0], partyId: ids.eastTeamId})
            : []
        const lists = all("mantle.marketing.contact.SubscriptionRequest", {}).filter(row =>
            JSON.stringify(row.getMap ? row.getMap() : row).includes("rowan@ash.example")
        )
        return {page, first, again, leads, lead, queue, lists}
    },
    then(r) {
        r.page.form.notice === "Retail East will call you about your shade garden."
        r.first.receipt && r.again.receipt
        r.leads.length === 1 && r.lead.marketingCampaignId === ids.runningCampaignId
        r.lead.dataSourceId === "BOSS_SAL_SRC_WEB" && r.queue.length === 1
        r.lead.description === "Garden size: Large"
        r.lists.length === 0
    }
})

feature("with Sales' intake failing the answer is kept, and the author's Try again makes the one lead", {
    when() {
        update("mantle.party.PartyRelationship", {
            partyRelationshipId: "BOSS_SAL_TEAM_EAST_OF",
            thruDate: new Date(Date.now() - 60000)
        })
        answer({[state.fields.name]: "Sky Fern", [state.fields.email]: "sky@fern.example", [state.fields.size]: "small"}, key())
        settle()
        const failed = all(CAPTURE, {publicationId: state.publicationId}).filter(row => row.statusEnumId === "MlcFailed")
        const kept = failed[0] ? one("moqui.screen.form.FormResponse", {formResponseId: failed[0].formResponseId}) : null
        update("mantle.party.PartyRelationship", {partyRelationshipId: "BOSS_SAL_TEAM_EAST_OF", thruDate: null})
        const rule = all("mantle.marketing.lead.MarketingLeadRule", {sourceId: state.publicationId})[0]
        const retried = asUser(users.author, () =>
            post("Leads/LeadRuleDetail/processLeadCaptures", {
                leadRuleId: rule.leadRuleId,
                selectedKeys: failed.map(row => row.leadCaptureId),
                reason: "Retail East is back"
            })
        )
        const again = asUser(users.author, () =>
            post("Leads/LeadRuleDetail/processLeadCaptures", {
                leadRuleId: rule.leadRuleId,
                selectedKeys: failed.map(row => row.leadCaptureId),
                reason: "Once more"
            })
        )
        const leads = capturesOf("sky@fern.example")
        const counts = as(users.reader, "mantle.marketing.MarketingFormServices.get#LeadHandoffs", {
            publicationId: state.publicationId
        })
        return {failed, kept, retried, again, leads, counts}
    },
    then(r) {
        r.failed.length === 1 && r.failed[0].errorText.includes("TEAM_UNAVAILABLE") && r.kept != null
        r.retried.errors === "" && r.again.errors === ""
        r.leads.length === 1
        r.counts.handoffs.newLeads === 2 && r.counts.handoffs.failed === 0
    }
})
