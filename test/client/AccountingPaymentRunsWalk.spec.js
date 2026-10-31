// One pass through the live client for payment runs (impl-accounting P8, design §16.3 procure-to-pay and batch): AP starts
// a run from the New run dialog and the held bill is left out with its reason, AP sends it for approval, an approver
// approves it and treasury executes it. The rules and refusals are mr-mantle's AccountingPaymentRuns and mr-boss's
// AccountingPaymentRuns and AccountingAccess specs.
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
function waitStatus(page, text) {
    page.waitFor(text => document.querySelector(".m-record-status")?.innerText.includes(text), {arg: text})
}

feature("AP starts and sends a run, an approver approves it and treasury executes it", {
    expect() {
        const ap = financePage("finance.ap")
        assert(ap.goto("/qapps/Accounting/Payables/PaymentRuns?organizationPartyId=BOSS_ACCT_ORG").status === 200, "Runs open")
        ap.getByRole("button", {name: "New run", exact: true}).click()
        const dialog = ap.getByRole("dialog")
        dialog.getByLabel("Pay from", {exact: true}).click()
        ap.getByRole("option", {name: "Operating account · •••• 2345", exact: true}).click()
        dialog.getByRole("button", {name: "Start run", exact: true}).click()
        ap.waitForURL(/PaymentRunDetail.*paymentRunId=/)
        const runUrl = ap.evaluate(() => location.pathname + location.search)
        waitText(ap, "SUPP-1004")
        waitText(ap, "On hold: Supplier dispute")
        waitStatus(ap, "Proposed")
        confirmDialogs(ap)
        ap.getByRole("button", {name: "Send for approval", exact: true}).click()
        waitText(ap, "sent for approval")

        const approver = financePage("finance.approve")
        assert(approver.goto(runUrl).status === 200, "Run opens for the approver")
        confirmDialogs(approver)
        approver.getByRole("button", {name: "Approve run", exact: true}).click()
        waitStatus(approver, "Approved")

        const treasury = financePage("finance.treasury")
        assert(treasury.goto(runUrl).status === 200, "Run opens for treasury")
        confirmDialogs(treasury)
        treasury.getByRole("button", {name: "Execute run", exact: true}).click()
        waitStatus(treasury, "Executed")
        waitText(treasury, "Paid")
        // the header's More menu offers the bank file of the executed run
        treasury.evaluate(() => {
            Array.from(document.querySelectorAll(".m-record-header .m-record-actions button"))
                .find(button => /More/.test(button.innerText))
                .click()
            return true
        })
        treasury.waitFor(() =>
            Array.from(document.querySelectorAll(".q-menu button,.q-menu a")).some(item =>
                item.innerText.includes("Download bank file")
            )
        )
    }
})
