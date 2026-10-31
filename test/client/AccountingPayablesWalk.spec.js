// One pass through the live client for payables (impl-accounting P6, design §16.3 procure-to-pay, intake and holds): the
// upload dialog posts and a repeat names the first bill, the hold dialog and the hold banner, the approver's release from
// the Holds tab and approval, and a bill from a purchase order on the supplier's terms. The rules and refusals are
// mr-mantle's AccountingPayables and mr-boss's AccountingPayables and AccountingAccess specs.
function financePage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.evaluate(() => {
        window.confirm = () => true
        return true
    })
    return page
}
function confirmDialogs(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    }) == true
}
function uploadBill(page, reference) {
    assert(page.goto("/qapps/Accounting/Payables/Bills?organizationPartyId=BOSS_ACCT_ORG").status === 200, "Bills open")
    page.getByRole("button", {name: "Upload bill", exact: true}).click()
    const dialog = page.getByRole("dialog")
    dialog.getByLabel("Supplier", {exact: true}).click()
    page.getByRole("option", {name: "Accounting Demo Supplier", exact: true}).click()
    dialog.locator("input[name=referenceNumber]").fill(reference)
    dialog.locator("input[name=amount]").fill("75")
    dialog.getByRole("button", {name: "Upload bill", exact: true}).click()
}
// The page shows the text, in its text or in a field's value.
function waitText(page, text) {
    page.waitFor(
        text =>
            document.body.innerText.includes(text) ||
            Array.from(document.querySelectorAll("input")).some(input => input.value.includes(text)),
        {arg: text}
    )
}

feature("AP uploads and holds a bill, the approver releases and approves it, and a bill from an order takes its terms", {
    expect() {
        const reference = "SUPP-WALK-" + Date.now()
        const ap = financePage("finance.ap")
        uploadBill(ap, reference)
        ap.waitForURL(/BillDetail.*recordId=/)
        const billId = ap.evaluate(() => new URL(location.href).searchParams.get("recordId"))
        waitText(ap, reference)
        // the same supplier reference again is refused, naming the first bill
        ap.allowProblems(/BILL_DUPLICATE|uploadBill/)
        uploadBill(ap, reference)
        ap.waitFor(text => document.body.innerText.includes(text), {arg: "already recorded as " + billId})

        // AP holds the bill and sends it for approval
        assert(
            ap.goto("/qapps/Accounting/Payables/BillDetail?organizationPartyId=BOSS_ACCT_ORG&recordId=" + billId).status === 200
        )
        confirmDialogs(ap)
        ap.getByRole("button", {name: "Place hold", exact: true}).click()
        const holdDialog = ap.getByRole("dialog")
        holdDialog.getByLabel("Reason", {exact: true}).click()
        ap.getByRole("option", {name: "Supplier dispute", exact: true}).click()
        holdDialog.getByRole("button", {name: "Place hold", exact: true}).click()
        ap.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("On hold"))
        confirmDialogs(ap)
        ap.getByRole("button", {name: "Send for approval", exact: true}).click()
        ap.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Received"))

        // the approver cannot approve a held bill; it releases the hold from the Holds tab, then approves
        const approver = financePage("finance.approve")
        assert(
            approver.goto("/qapps/Accounting/Payables/BillDetail?organizationPartyId=BOSS_ACCT_ORG&recordId=" + billId).status ===
                200
        )
        waitText(approver, "is not approved or paid until each hold is released")
        approver.getByRole("button", {name: "Approve bill", exact: true}).count() == 0
        approver.getByRole("tab", {name: "Holds", exact: true}).click()
        approver.getByRole("button", {name: "Release", exact: true}).click()
        const releaseDialog = approver.getByRole("dialog")
        releaseDialog.locator("textarea[name=releaseComment]").fill("Delivery note confirmed")
        confirmDialogs(approver)
        releaseDialog.getByRole("button", {name: "Release hold", exact: true}).click()
        waitText(approver, "Delivery note confirmed")
        confirmDialogs(approver)
        approver.getByRole("button", {name: "Approve bill", exact: true}).click()
        approver.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Approved"))

        // a bill from the approved purchase order takes the supplier's 30-day terms
        assert(
            ap.goto("/qapps/Accounting/Records/OrderDetail?organizationPartyId=BOSS_ACCT_ORG&orderId=BOSS_ACCT_PO").status === 200
        )
        ap.getByRole("button", {name: "Bill from order", exact: true}).click()
        confirmDialogs(ap)
        ap.getByRole("dialog").getByRole("button", {name: "Create bill", exact: true}).click()
        ap.waitForURL(/BillDetail.*recordId=/)
        ap.waitFor(() => document.querySelector(".m-record-header")?.innerText.includes("Net 30 days"))
    }
})
