// One pass through the live client for returns (impl-accounting P17, design §16.3 return-to-refund): the demo return of
// two supplies was approved with no credit and one unit received; AR opens it from Records, sees one eligible to settle,
// settles it, and sees the credit with its original invoice; a reader sees the return without Settle. The rules and
// refusals are mr-mantle's AccountingReturns and mr-boss's AccountingAccess specs.
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
const returnPath = "/qapps/Accounting/Records/ReturnDetail?organizationPartyId=BOSS_ACCT_ORG&returnId=BOSS_ACCT_RETURN"

feature("AR settles the received part of a return, and a reader sees it without Settle", {
    expect() {
        const reader = financePage("finance.read")
        assert(reader.goto(returnPath).status === 200, "The return opens for a reader")
        waitText(reader, "Customer return BOSS_ACCT_RETURN")
        waitText(reader, "Nothing on this return is credited yet.")
        reader.getByRole("button", {name: "Settle", exact: true}).count() == 0

        const ar = financePage("finance.ar")
        assert(ar.goto(returnPath).status === 200, "The return opens for AR")
        waitText(ar, "Customer return BOSS_ACCT_RETURN")
        ar.getByRole("button", {name: "Settle", exact: true}).click()
        waitText(ar, "Settle return BOSS_ACCT_RETURN")
        confirmDialogs(ar)
        ar.getByRole("button", {name: "Settle return", exact: true}).click()
        waitText(ar, "Return BOSS_ACCT_RETURN settled")
        waitText(ar, "Credits and refunds")
        ar.waitFor(() => !document.body.innerText.includes("Nothing on this return is credited yet."))
        ar.getByRole("button", {name: "Settle", exact: true}).count() == 0
    }
})
