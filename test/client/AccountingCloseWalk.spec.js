// Run with mail_capture_sends=true (docs/Build-Test.md): finalizing the invoice may send it.
// One pass through the live client for period close (design §16.3 bank-to-close): last month's checklist names the
// draft invoice and the unfinished bank statement, each linked, and offers no close; AR finalizes the invoice, treasury
// finishes the statement, and the approver closes the period. The rules and refusals (another organization's work,
// backdated postings after the close, the reopen) are tested in mr-mantle's AccountingPeriodClose and mr-boss's
// AccountingPeriodClose and AccountingAccess.
const org = "organizationPartyId=BOSS_ACCT_ORG"
const closeUrl = "/qapps/Accounting/PeriodClose/PeriodCloseDetail?" + org + "&timePeriodId=BOSS_ACCT_CLOSE_PERIOD"
function userPage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
    return page
}
function acceptConfirmations(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    })
}
function chooseOption(page, scope, label, search, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (search) scope.getByLabel(label, {exact: true}).fill(search)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Escape")
    page.settle()
}
// The link of the page whose text includes the given text.
function hrefOf(page, text) {
    return page.evaluate(
        text => Array.from(document.querySelectorAll(".q-page a")).find(a => a.innerText.includes(text))?.getAttribute("href") || "",
        text
    )
}
// Last month's first and last day, as the demo made its period.
function lastMonth(page) {
    return page.evaluate(() => {
        const now = new Date()
        const text = d =>
            [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-")
        return [text(new Date(now.getFullYear(), now.getMonth() - 1, 1)), text(new Date(now.getFullYear(), now.getMonth(), 0))]
    })
}

feature("close is blocked by the draft invoice and the unfinished statement; once both are dealt with the period closes", {
    expect() {
        const approver = userPage("finance.approve")
        approver.goto(closeUrl).status == 200
        approver.text().includes("checks keep the period from closing")
        approver.text().includes("Payroll account: 1 lines not on a finished statement")
        // each item links to the screen that resolves it
        hrefOf(approver, "BOSS_ACCT_CLOSE_INVOICE").includes("InvoiceDetail")
        // the bank item links where Banking is open (the finance admin); the approver, without Banking, sees it named
        hrefOf(approver, "Payroll account") == ""
        const admin = userPage("finance.admin")
        admin.goto(closeUrl).status == 200
        hrefOf(admin, "Payroll account").includes("BankAccountDetail")
        approver.getByRole("button", {name: "Close period", exact: true}).count() == 0
        // AR finalizes the invoice
        const ar = userPage("finance.ar")
        ar.goto("/qapps/Accounting/Receivables/InvoiceDetail?" + org + "&recordId=BOSS_ACCT_CLOSE_INVOICE").status == 200
        acceptConfirmations(ar)
        ar.getByRole("button", {name: "Finalize invoice", exact: true}).click()
        ar.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Finalized"))
        // treasury finishes last month's statement of the payroll account
        const treasury = userPage("finance.treasury")
        const [fromDay, thruDay] = lastMonth(treasury)
        treasury.goto("/qapps/Accounting/Banking/Reconciliations?" + org).status == 200
        treasury.getByRole("button", {name: "Start a statement", exact: true}).click()
        let dialog = treasury.getByRole("dialog")
        chooseOption(treasury, dialog, "Bank account", "Payroll", /Payroll account/)
        dialog.locator("input[name=statementReference]").fill("Close walk statement")
        dialog.locator("input[name=statementFromDate]").fill(fromDay)
        dialog.locator("input[name=statementThruDate]").fill(thruDay)
        dialog.locator("input[name=openingBalance]").fill("0")
        dialog.locator("input[name=closingBalance]").fill("-12")
        dialog.getByRole("button", {name: "Start statement", exact: true}).click()
        treasury.waitForURL(/ReconciliationDetail/)
        treasury.getByRole("button", {name: "Not reconciled", exact: true}).first().click()
        dialog = treasury.getByRole("dialog")
        dialog.locator("input[name=noReconcileReason]").fill("Close walk: fee booked by the bank")
        dialog.getByRole("button", {name: "Clear without a match", exact: true}).click()
        treasury.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Cleared"))
        acceptConfirmations(treasury)
        treasury.getByRole("button", {name: "Finish statement", exact: true}).first().click()
        dialog = treasury.getByRole("dialog")
        dialog.getByRole("button", {name: "Finish statement", exact: true}).click()
        treasury.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Finished"))
        // the approver checks again and closes
        approver.goto(closeUrl).status == 200
        approver.text().includes("Nothing keeps the period from closing")
        acceptConfirmations(approver)
        approver.getByRole("button", {name: "Close period", exact: true}).first().click()
        dialog = approver.getByRole("dialog")
        dialog.locator("input[name=changeReason]").fill("Close walk month end")
        dialog.getByRole("button", {name: "Close period", exact: true}).click()
        approver.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Closed"))
        approver.text().includes("This period is closed")
        approver.text().includes("Close walk month end")
    }
})
