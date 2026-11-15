// Marketing's golden path in the live client (impl-marketing P9, §2: the app's one regression walk): an author makes a send from the
// Garden newsletter template (its Use: the New send dialog with the template chosen), prepares it and asks for approval; the approver
// approves it; the dispatcher releases it and sees it delivered (the Delivery box's one sent, the server's mail capture holding it).
// The rules (the release's separation, the dispatch's checks and idempotency, the ledger's consent) are mr-mantle's Sends and Dispatch
// and mr-boss's MarketingSends and MarketingDelivery; the "usable when" scenarios are the acceptance MarketingComposeWalk and
// MarketingDispatchScenario. Retail's profile has no quiet hours on the walk's server (MarketingClientFixtures, follow-up 7), so the
// delivery does not wait for the morning when the suite runs at night.
let pages = {}
const name = "Walk: garden news " + String(Date.now()).slice(-6)
spec({
    setupSpec() {
        for (const user of ["marketing.author", "marketing.approver", "marketing.dispatch"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
function waitForStatus(page, text) {
    page.waitFor(text => (document.querySelector(".m-record-status")?.innerText || "").trim() === text, {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
function confirmAction(page) {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
// a drop-down of the open dialog: open it, type, choose the option, and leave the field
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}
// the header's primary action by its text: its dialog opens
function headerButton(page, label) {
    page.locator(".m-record-actions").getByRole("button", {name: label, exact: true}).first().click()
}

feature("an author makes a send from a template, the approver approves it, the dispatcher releases it and it is delivered", {
    expect() {
        const author = pages["marketing.author"]
        // a template's Use, from the campaign's sends: Sends with its New send dialog open, the template and the campaign chosen
        author.goto(
            "/qapps/Marketing/Sends/Sends?marketingCampaignId=BOSS_MKT_CMP_SPRING&messageTemplateId=BOSS_MKT_TPL_NEWS" +
                "&organizationPartyId=ORG_ZIZI_RETAIL&_openDialog=NewSendDialog"
        ).status == 200
        const draft = author.getByRole("dialog")
        draft.getByLabel("Name", {exact: true}).fill(name)
        choose(author, draft, "Topic", null, /^Garden newsletter/)
        // Retail's one promotional sending profile, chosen for it
        draft.getByRole("button", {name: "Start the draft", exact: true}).click()
        author.waitForURL(/Compose/)
        const campaignSendId = /campaignSendId=([^&]+)/.exec(author.url())[1]
        const detailUrl = "/qapps/Marketing/Sends/SendDetail?campaignSendId=" + campaignSendId
        author.goto(detailUrl).status == 200
        waitForStatus(author, "Draft")
        headerButton(author, "Prepare")
        author.getByRole("dialog").getByRole("button", {name: "Prepare", exact: true}).click()
        confirmAction(author)
        waitForText(author, "1 eligible")
        headerButton(author, "Request approval")
        author.getByRole("dialog").getByRole("button", {name: "Request approval", exact: true}).click()
        waitForStatus(author, "Awaiting approval")

        const approver = pages["marketing.approver"]
        approver.goto(detailUrl).status == 200
        headerButton(approver, "Approve")
        const decision = approver.getByRole("dialog")
        decision.getByRole("radio", {name: "Approve"}).click()
        decision.getByRole("button", {name: "Decide", exact: true}).click()
        confirmAction(approver)
        waitForStatus(approver, "Approved")

        const dispatcher = pages["marketing.dispatch"]
        dispatcher.goto(detailUrl).status == 200
        headerButton(dispatcher, "Release")
        dispatcher.getByRole("dialog").getByRole("button", {name: "Release", exact: true}).click()
        confirmAction(dispatcher)
        // handed to the delivery service once the release commits: the Delivery box counts it sent and the send completes
        waitForText(dispatcher, "Released")
        let shown = dispatcher.text()
        for (let tries = 0; tries < 20 && !shown.includes("1 sent"); tries++) {
            dispatcher.goto(detailUrl)
            shown = dispatcher.text()
        }
        shown.includes("1 sent")
        !/Error rendering|Exception in render/.test(shown)
        waitForStatus(dispatcher, "Completed")
    }
})
