// One pass through the live client for matching (impl-accounting P7, design §16.3 procure-to-pay, matching): a match
// operator applies the proposed match of a bill against its accepted receipt from BillDetail's Match tab; AP applies the
// match of a bill priced outside the policy, which puts it on hold naming the rule; the approver sees the match exception
// hold to release; the finance administrator sees the match policy. The rules and refusals are mr-mantle's
// AccountingMatching and mr-boss's AccountingMatching and AccountingAccess specs.
function financePage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    confirmDialogs(page)
    return page
}
function confirmDialogs(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    })
}
function waitText(page, text) {
    page.waitFor(text => document.body.innerText.includes(text), {arg: text})
}
function openMatch(page, invoiceId) {
    assert(
        page.goto("/qapps/Accounting/Payables/BillDetail?organizationPartyId=BOSS_ACCT_ORG&recordId=" + invoiceId).status === 200,
        "Bill " + invoiceId + " opens"
    )
    page.getByRole("tab", {name: "Match", exact: true}).click()
    waitText(page, "Order and receipt sources")
}

feature("a bill matches its accepted receipt; one priced outside the policy goes on hold for an approver to release", {
    expect() {
        // the match operator applies the proposal: six against the received purchase order, at the order price
        const matcher = financePage("finance.match")
        openMatch(matcher, "BOSS_ACCT_BILL_MATCH")
        waitText(matcher, "Proposed · Matched")
        confirmDialogs(matcher)
        matcher.getByRole("button", {name: "Apply match", exact: true}).click()
        waitText(matcher, "Applied match")
        waitText(matcher, "Applied · Matched")

        // AP applies the match of a bill priced over the order: the bill goes on hold, naming the policy
        const ap = financePage("finance.ap")
        openMatch(ap, "BOSS_ACCT_BILL_PRICE")
        waitText(ap, "Holds the bill")
        confirmDialogs(ap)
        ap.getByRole("button", {name: "Apply match", exact: true}).click()
        waitText(ap, "Applied · Exception")
        ap.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("On hold"))

        // the approver, who did not apply the match, is offered the release on the Holds tab
        const approver = financePage("finance.approve")
        assert(
            approver.goto(
                "/qapps/Accounting/Payables/BillDetail/Holds?organizationPartyId=BOSS_ACCT_ORG&recordId=BOSS_ACCT_BILL_PRICE"
            ).status === 200
        )
        waitText(approver, "Match exception")
        approver.getByRole("button", {name: "Release", exact: true}).count() == 1

        // the finance administrator sees the organization's match policy
        const admin = financePage("finance.admin")
        assert(admin.goto("/qapps/Accounting/Settings/MatchPolicies?organizationPartyId=BOSS_ACCT_ORG").status === 200)
        waitText(admin, "Accepted receipts (three-way)")
    }
})
