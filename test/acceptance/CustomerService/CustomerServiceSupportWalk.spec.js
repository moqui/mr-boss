// Customer Service P15's "usable when" (impl-customer-service P15) on the BOSS demo, as the Support app's operations answer
// them for ZIZI_PORTAL (Retail's Support mount): Joe's Distributing's invited contact sees and replies on its own case, never a
// colleague's, and its customer administrator sees the customer's cases; Joe Q Public's own verified account sees only his
// cases; a signed-in customer reads Retail's customer help and rates an article once per view, and a visitor reads none of it;
// the Support queue's public form token files a request that reads no case; ContactDetail's Invite to support is offered to the
// manager; ServiceDefaults shows the Support app's settings (qvt). The pages themselves (390 px, the remote frontend) are mr-pass's
// SupportPagesHttp and RemoteHttp, the returns and cancel rules Mantle's SupportPortal spec.
// Run: ./moq accept mr-boss --spec CustomerServiceSupportWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {users, asUser, system, invoke} = lib
const S = "mantle.request.SupportCaseServices.",
    K = "mantle.request.KnowledgeServices."
const siteId = "ZIZI_PORTAL"
const contact = "dana@joesdist.example.com",
    administrator = "morgan@joesdist.example.com",
    joe = "joe@public.com"
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a Support operation as a public account (null: a visitor): its result, or its error kind
function page(username, service, input) {
    if (username) login(username)
    else logout()
    ec.message.pushErrors()
    try {
        return ec.service
            .sync()
            .throwOnError(true)
            .name(service)
            .parameters({input: Object.assign({siteId}, input)})
            .requireNewTransaction(true)
            .call().result
    } catch (error) {
        return {kind: error.moquiErrorKind || "Error", error: String(error.message)}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
        login("john.doe")
    }
}
const caseIds = out => (out.caseList || []).map(row => row.requestId)
const demoCase = () => rows("mantle.request.Request", {requestName: "Order of filters short by one box"})[0]?.requestId || null

feature("the JoeDist contact sees and replies on its own case; its administrator sees the customer's; Joe sees only his own", {
    when() {
        const own = demoCase()
        // the most rows a page gives: the walks before this one add cases of Joe's, newer than the demo's
        const asContact = page(contact, S + "find#CustomerCases", {limit: 100})
        const asAdministrator = page(administrator, S + "find#CustomerCases", {limit: 100})
        const asJoe = page(joe, S + "find#CustomerCases", {limit: 100})
        const reply = page(contact, S + "reply#CustomerCase", {
            requestId: own,
            body: "Any news on the missing box?",
            operationId: "SupportWalkReply" + Date.now()
        })
        const read = page(contact, S + "get#CustomerCase", {requestId: own})
        const colleague = page(contact, S + "get#CustomerCase", {requestId: "BOSS_CS_CASE_PICK"})
        const joeOther = page(joe, S + "get#CustomerCase", {requestId: own})
        return {own, asContact, asAdministrator, asJoe, reply, read, colleague, joeOther}
    },
    then(r) {
        !!r.own
        caseIds(r.asContact).includes(r.own)
        !caseIds(r.asContact).includes("BOSS_CS_CASE_PICK")
        caseIds(r.asAdministrator).includes(r.own) && caseIds(r.asAdministrator).includes("BOSS_CS_CASE_PICK")
        caseIds(r.asJoe).includes("BOSS_CS_CASE_FILTERS")
        !caseIds(r.asJoe).includes(r.own) && !caseIds(r.asJoe).includes("BOSS_CS_CASE_PICK")
        !!r.reply.messageId
        r.read.messageList.some(m => m.body === "Any news on the missing box?")
        r.colleague.kind === "NotFound"
        r.joeOther.kind === "NotFound"
    }
})

feature("a signed-in customer reads Retail's help and rates an article once per view; a visitor reads no customer article", {
    when() {
        const home = page(contact, S + "get#SupportHome", {query: "thermostat"})
        const article = home.articleList?.[0] || null
        const read = article ? page(contact, K + "get#CustomerArticle", {wikiPageId: article.wikiPageId}) : {}
        const rated = read.nonce
            ? page(contact, K + "rate#Article", {
                  wikiPageId: article.wikiPageId,
                  token: read.nonce,
                  helpful: "Y",
                  comment: "Clear"
              })
            : {}
        const repeat = read.nonce
            ? page(contact, K + "rate#Article", {wikiPageId: article.wikiPageId, token: read.nonce, helpful: "N"})
            : {}
        const visitorHome = page(null, S + "get#SupportHome", {query: "thermostat"})
        const visitorArticle = article ? page(null, K + "get#CustomerArticle", {wikiPageId: article.wikiPageId}) : {}
        const kept = article
            ? rows("mantle.request.support.ArticleFeedback", {wikiPageId: article.wikiPageId, sourceEnumId: "AfsCustomer"})
            : []
        return {home, article, read, rated, repeat, visitorHome, visitorArticle, kept}
    },
    then(r) {
        !!r.article
        r.read.article.body.length > 0
        r.read.capabilities.canCreateCase === true
        r.rated.alreadyApplied === false
        r.repeat.alreadyApplied === true
        r.kept.length >= 1
        r.visitorHome.articleList.length === 0
        r.visitorArticle.kind === "NotFound"
    }
})

feature("the Support queue's public form files a request that reads no case; the manager is offered Invite to support", {
    when() {
        const token = ec.resource.script("component://mr-boss/service/ironstone/customerservice/SupportDemo.js").SUPPORT_TOKENS
            .intake
        const sent = page(null, S + "create#CustomerCase", {
            token,
            firstName: "Walk",
            lastName: "Visitor",
            emailAddress: "walk.visitor@example.test",
            requestName: "Support walk: do you ship to Canada?",
            description: "Before I order",
            operationId: "SupportWalkIntake" + Date.now()
        })
        const invite = asUser(users.manager, () =>
            invoke("ironstone.customerservice.SupportAppServices.get#SupportInvite", {
                appRoot: "CustomerService",
                partyId: "BOSS_CS_JOEDIST_CONTACT"
            })
        )
        const mount = asUser(users.admin, () =>
            invoke("ironstone.customerservice.SupportAppServices.get#SupportMountSettings", {
                appRoot: "CustomerService",
                organizationPartyId: "ORG_ZIZI_RETAIL"
            })
        )
        const made = rows("mantle.request.Request", {requestName: "Support walk: do you ship to Canada?"})
        return {sent, invite, mount, made}
    },
    then({sent, invite, mount, made}) {
        sent.receipt.received === true
        sent.requestId == null
        made.length === 1
        invite.canInvite === true
        mount.setting.queueIds.includes("BOSS_CS_Q_SUPPORT")
        mount.sites.some(site => site.siteId === "ZIZI_PORTAL")
    }
})
