// The public unsubscribe page of a list email (screen/Unsubscribe.xml and Unsubscribe.qvue at /u/<token>, the token-route "u" of
// MoquiConf.xml; design-drawers-commons.md §16 Unsubscribe; impl-drawers-commons.md R16, M11), as a visitor who is not signed in,
// on the demo links (data/BossConsentDemoData.xml): the route's token check (mantle.party.ConsentServices.check#UnsubscribeToken),
// the page's state with the token the route gives (the organization, the list, the masked address and the lists, nothing of the
// party beyond that; an unknown or ended token reads nothing), unsubscribing from this list with a reason and from all marketing
// email, the lists one by one, Resubscribe, the RFC 8058 one-click POST to the page's own URL /u/<token> (the route's
// post-transition oneClick, which /u/<token>/oneClick of the emails sent before runs too; again changing nothing, a GET of
// /oneClick going to the page), and the confirmation an unsubscribe waits for on a list that requires it. The token route itself
// (the 404 page, the public shell, a POST to /u/<token> running its post-transition) is the framework's:
// crates/moqui-host/tests/gate3.rs; a spec renders the screen, so a POST to /u/<token> is the oneClick transition it runs.
// Run: ./moq test mr-boss --spec Unsubscribe
const page = "component://mr-boss/screen/Unsubscribe.xml"
const CONSENT = "mantle.party.ConsentServices"
const NEWS = "BossDemoUnsubNews2026", UPDATES = "BossDemoUnsubUpdates2026", ENDED = "BossDemoUnsubExpired2026"
const ALEX = "BOSS_DEMO_CON_ALEX", TAYLOR = "BOSS_DEMO_CON_TAYLOR"
const LIST_NEWS = "BOSS_DEMO_LIST_NEWS", LIST_EVENTS = "BOSS_DEMO_LIST_EVENTS", LIST_UPDATES = "BOSS_DEMO_LIST_UPDATES"

// a transition of the page as the route calls it: the token and tokenRoute are the route's
function visit(name, token, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(page).render(name, Object.assign({ token, tokenRoute: { name: "u", token, basePath: `/u/${token}` } },
        parameters || {}), method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, output: String(str.output || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const statusOf = (contactListId, partyId) => sys(() => {
    const rows = Array.from(ec.entity.find("mantle.marketing.contact.ContactListParty").condition({ contactListId, partyId }).orderBy("-fromDate").list())
    return rows.length ? rows[0].statusId : null
})
const lastListConsent = (contactListId, partyId) => sys(() => Array.from(ec.entity.find("mantle.party.PartyConsent").condition({ contactListId, partyId }).list())
        .sort((a, b) => Number(b.consentDate) - Number(a.consentDate) || (String(b.partyConsentId).length - String(a.partyConsentId).length)
            || (String(b.partyConsentId) > String(a.partyConsentId) ? 1 : -1))[0])

spec({
    stepwise: true,
    setupSpec() { logout() },
    cleanupSpec() { login("john.doe") },
})

feature("the route's token check: a current link tells the page the organization and list, an ended one only that it ended, a bad one nothing", {
    when() {
        return { news: call(`${CONSENT}.check#UnsubscribeToken`, { token: NEWS, routeName: "u" }), ended: call(`${CONSENT}.check#UnsubscribeToken`, { token: ENDED, routeName: "u" }),
            bad: call(`${CONSENT}.check#UnsubscribeToken`, { token: "NoSuchUnsubscribeToken00", routeName: "u" }), user: ec.user.userId }
    },
    then({ news, ended, bad, user }) {
        user == null
        news.valid
        news.routeContext.expired == false
        news.routeContext.organizationName == "Ziziwork Retail & Wholesale"
        news.routeContext.contactListName == "Ziziwork News"
        Object.keys(news.routeContext).sort() == ["contactListName", "expired", "organizationName"]
        ended.valid
        ended.routeContext.expired == true
        Object.keys(ended.routeContext) == ["expired"]
        !bad.valid
        bad.routeContext == null
    },
})

feature("the page is its component in the public shell, and its state shows the list, the masked address and the lists, nothing more of the party", {
    when() {
        const component = ec.screen.makeTest().rootScreen(page).renderMode("qvue").render("", { token: NEWS }, null)
        const state = visit("state", NEWS, {}, "get")
        return { component: String(component.output || ""), componentStatus: component.status, state }
    },
    then({ component, componentStatus, state }) {
        componentStatus == 200
        component.includes("module.exports")
        component.includes("BossUnsubscribe")
        state.status == 200
        state.json.valid
        state.json.organizationName == "Ziziwork Retail & Wholesale"
        state.json.contactListId == LIST_NEWS
        state.json.contactListName == "Ziziwork News"
        state.json.subscribed
        state.json.maskedAddress == "a***@example.com"
        state.json.listList.map((list) => list.contactListId).sort() == [LIST_EVENTS, LIST_NEWS, LIST_UPDATES].sort()
        state.json.listList[0].isTokenList
        !state.output.includes(ALEX)
        !state.output.includes("alex.rivera")
        !state.output.includes("Rivera")
    },
})

feature("an unknown or ended link reads nothing and changes nothing", {
    allowMessageErrors: true,
    when() {
        return { unknown: visit("state", "NoSuchUnsubscribeToken00", {}, "get"),
            endedPost: visit("unsubscribe", ENDED, { choice: "list" }, "post"), endedOneClick: visit("oneClick", ENDED, { "List-Unsubscribe": "One-Click" }, "post"),
            jordan: statusOf(LIST_NEWS, "BOSS_DEMO_CON_JORDAN") }
    },
    then({ unknown, endedPost, endedOneClick, jordan }) {
        !unknown.json.valid
        unknown.errors.includes("not valid or has expired")
        unknown.json.contactListName == null
        endedPost.errors.includes("not valid or has expired")
        endedOneClick.status == 410
        jordan == "CLPT_UNSUBSCRIBED"
    },
})

feature("Unsubscribe from this list with a reason: the list only, the withdrawal from the email link with the reason; Resubscribe undoes it", {
    when() {
        // a GET (a link scanner's, another site's) changes nothing: the page's own Confirm posts (SEC-BOS-04)
        const byGet = visit("unsubscribe", NEWS, { choice: "list" }, "get")
        const afterGet = statusOf(LIST_NEWS, ALEX)
        const done = visit("unsubscribe", NEWS, { choice: "list", reasonText: "I get too many emails" }, "post")
        const afterNews = statusOf(LIST_NEWS, ALEX)
        const afterEvents = statusOf(LIST_EVENTS, ALEX)
        const withdrawal = lastListConsent(LIST_NEWS, ALEX)
        const again = visit("unsubscribe", NEWS, { choice: "list" }, "post")
        const undo = visit("preferences", NEWS, { listChoices: JSON.stringify([{ contactListId: LIST_NEWS, subscribed: true }]) }, "post")
        return { byGet, afterGet, done, afterNews, afterEvents, withdrawal, again, undo, resubscribed: statusOf(LIST_NEWS, ALEX), grant: lastListConsent(LIST_NEWS, ALEX) }
    },
    then({ byGet, afterGet, done, afterNews, afterEvents, withdrawal, again, undo, resubscribed, grant }) {
        byGet.json.statusId == null
        afterGet == "CLPT_ACCEPTED"
        done.status == 200
        done.json.statusId == "CLPT_UNSUBSCRIBED"
        done.json.changedList.map((change) => change.contactListId) == [LIST_NEWS]
        afterNews == "CLPT_UNSUBSCRIBED"
        afterEvents == "CLPT_ACCEPTED"
        withdrawal.statusId == "PconWithdrawn"
        withdrawal.sourceEnumId == "PcsEmailLink"
        withdrawal.comments == "I get too many emails"
        withdrawal.userId == null
        again.json.changedList.length == 0
        undo.json.changedList.map((change) => change.contactListId) == [LIST_NEWS]
        resubscribed == "CLPT_ACCEPTED"
        grant.statusId == "PconGranted"
        grant.sourceEnumId == "PcsEmailLink"
    },
})

feature("the lists one by one: one left, the others kept; a list the link does not offer is refused", {
    when() {
        const saved = visit("preferences", NEWS, { listChoices: JSON.stringify([{ contactListId: LIST_NEWS, subscribed: true },
            { contactListId: LIST_EVENTS, subscribed: false }, { contactListId: "BOSS_DEMO_NO_SUCH_LIST", subscribed: false }]), reasonText: "Not relevant" }, "post")
        return { saved, news: statusOf(LIST_NEWS, ALEX), events: statusOf(LIST_EVENTS, ALEX), consent: lastListConsent(LIST_EVENTS, ALEX) }
    },
    then({ saved, news, events, consent }) {
        saved.json.changedList.map((change) => change.contactListId) == [LIST_EVENTS]
        saved.json.failedContactListIds == ["BOSS_DEMO_NO_SUCH_LIST"]
        news == "CLPT_ACCEPTED"
        events == "CLPT_UNSUBSCRIBED"
        consent.comments == "Not relevant"
    },
})

feature("the RFC 8058 one-click POST to /u/<token> unsubscribes at once with a line of text, again changes nothing; without the field it is refused; a GET goes to the page", {
    allowMessageErrors: true,
    when() {
        // the u route runs oneClick for a POST to the page's URL itself, the List-Unsubscribe URL (create#UnsubscribeToken)
        const conf = String(ec.resource.getLocationText("component://mr-boss/MoquiConf.xml") || "")
        const route = (conf.match(/<token-route\s+name="u"[^>]*>/) || [""])[0]
        // the link of a new list email (a signed-in send makes it), its List-Unsubscribe the page's URL
        login("john.doe")
        let link = null
        try { link = sys(() => call(`${CONSENT}.create#UnsubscribeToken`, { contactListId: LIST_NEWS, partyId: ALEX, baseUrl: "https://shop.example.com" })) } finally { logout() }
        const first = visit("oneClick", NEWS, { "List-Unsubscribe": "One-Click" }, "post")
        const status = statusOf(LIST_NEWS, ALEX)
        const again = visit("oneClick", NEWS, { "List-Unsubscribe": "One-Click" }, "post")
        const noField = visit("oneClick", NEWS, {}, "post")
        const viewed = visit("oneClick", NEWS, {}, "get")
        return { route, link, first, status, again, noField, viewed, consent: lastListConsent(LIST_NEWS, ALEX) }
    },
    then({ route, link, first, status, again, noField, viewed, consent }) {
        route.includes('post-transition="oneClick"')
        route.includes('screen-location="component://mr-boss/screen/Unsubscribe.xml"')
        link.listUnsubscribeHeaders["List-Unsubscribe"] == `<https://shop.example.com/u/${link.token}>`
        link.oneClickUrl == link.unsubscribeUrl
        first.status == 200
        first.output.includes("You are unsubscribed.")
        status == "CLPT_UNSUBSCRIBED"
        consent.evidenceText.includes("One-click unsubscribe (RFC 8058)")
        again.status == 200
        noField.status == 400
        viewed.status != 200 || viewed.output.includes(`/u/${NEWS}`)
    },
})

feature("Unsubscribe from all marketing email: the organization's lists and the address withdrawn; the list that asks to confirm waits", {
    when() {
        const done = visit("unsubscribe", NEWS, { choice: "all" }, "post")
        const flags = sys(() => Array.from(ec.entity.find("mantle.party.contact.PartyContactMech").condition({ partyId: ALEX, contactMechId: `${ALEX}_EM` }).list())
                .map((row) => row.allowSolicitation))
        return { done, events: statusOf(LIST_EVENTS, ALEX), updates: statusOf(LIST_UPDATES, ALEX), flags }
    },
    then({ done, events, updates, flags }) {
        done.status == 200
        done.json.marketingWithdrawn
        done.json.unsubscribePending
        done.json.changedList.map((change) => change.contactListId) == [LIST_UPDATES]
        events == "CLPT_UNSUBSCRIBED"
        updates == "CLPT_UNSUBS_PENDING"
        flags.every((flag) => flag == "N")
    },
})

feature("the verification email's link: the page shows the unsubscribe that waits, a wrong code is refused, the right one completes it", {
    allowMessageErrors: true,
    when() {
        const state = visit("state", UPDATES, { verifyCode: "BossDemoVerify2026" }, "get")
        const wrong = visit("unsubscribe", UPDATES, { choice: "list", verifyCode: "NotTheCode" }, "post")
        const waiting = statusOf(LIST_UPDATES, TAYLOR)
        const confirmed = visit("unsubscribe", UPDATES, { choice: "list", verifyCode: "BossDemoVerify2026" }, "post")
        return { state, wrong, waiting, confirmed, status: statusOf(LIST_UPDATES, TAYLOR), news: statusOf(LIST_NEWS, TAYLOR) }
    },
    then({ state, wrong, waiting, confirmed, status, news }) {
        state.json.unsubscribePending
        state.json.contactListName == "Product updates"
        state.json.maskedAddress == "t***@example.com"
        wrong.errors.includes("The confirmation code does not match")
        waiting == "CLPT_UNSUBS_PENDING"
        confirmed.json.statusId == "CLPT_UNSUBSCRIBED"
        status == "CLPT_UNSUBSCRIBED"
        news == "CLPT_ACCEPTED"
    },
})
