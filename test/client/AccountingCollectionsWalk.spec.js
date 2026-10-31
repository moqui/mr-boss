// Run send walks with mail_capture_sends=true (docs/Build-Test.md).
// One pass through the live client for collections and credit (impl-accounting P10, design §16.3 invoice-to-cash, overdue
// and credit): AR records a contact with an overdue customer from Collections, previews a reminder run that leaves out the
// disputed invoice and sends it; an approver releases the demo order held for credit with a reason on OrderDetail. The
// rules and refusals are mr-mantle's AccountingCredit, AccountingCollections and AccountingRecurringAging specs and
// mr-boss's AccountingCollections and AccountingAccess specs.
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

feature("AR records a contact with an overdue customer and sends the reminder run", {
    expect() {
        const ar = financePage("finance.ar")
        assert(
            ar.goto("/qapps/Accounting/Receivables/Collections?organizationPartyId=BOSS_ACCT_ORG").status === 200,
            "Collections"
        )
        waitText(ar, "Granite Peak Supply")
        // the customer's row action
        ar.evaluate(() => {
            const row = Array.from(document.querySelectorAll('[id^="CollectionWork"][id$="_table"] .tr')).find(tr =>
                tr.innerText.includes("Granite Peak Supply")
            )
            Array.from(row.querySelectorAll("button"))
                .find(button => button.innerText.includes("Record contact"))
                .click()
            return true
        })
        const dialog = ar.getByRole("dialog")
        dialog.locator("textarea[name=note]").fill("Will pay the installation invoice on Friday")
        dialog.getByRole("button", {name: "Record contact", exact: true}).click()
        waitText(ar, "Contact recorded")

        assert(ar.goto("/qapps/Accounting/Receivables/Dunning?organizationPartyId=BOSS_ACCT_ORG").status === 200, "Dunning")
        ar.getByRole("button", {name: "New reminder run", exact: true}).click()
        ar.getByRole("dialog").getByRole("button", {name: "Preview reminders", exact: true}).click()
        ar.waitForURL(/dunningRunId=/)
        waitText(ar, "Granite Peak Supply")
        waitText(ar, "Disputed")
        confirmDialogs(ar)
        ar.getByRole("button", {name: "Send reminders", exact: true}).click()
        ar.getByRole("dialog")
            .getByRole("button", {name: /^Send \d+ reminders$/})
            .click()
        waitText(ar, "reminders sent")
        ar.waitFor(() =>
            Array.from(document.querySelectorAll('[id^="DunningNotices"][id$="_table"] .tr')).some(
                tr => tr.innerText.includes("Granite Peak Supply") && tr.innerText.includes("Sent")
            )
        )
    }
})

feature("an approver releases the order held for credit with a reason, and it is placed again", {
    expect() {
        const approver = financePage("finance.approve")
        const route = "/qapps/Accounting/Records/OrderDetail?orderId=BOSS_ACCT_SO_HELD&organizationPartyId=BOSS_ACCT_ORG"
        assert(approver.goto(route).status === 200, "Order opens")
        waitText(approver, "On hold")
        waitText(approver, "exposure")
        approver.getByRole("button", {name: "Release hold", exact: true}).click()
        const dialog = approver.getByRole("dialog")
        dialog.locator("textarea[name=reason]").fill("Known customer; deposit received")
        confirmDialogs(approver)
        dialog.getByRole("button", {name: "Release hold", exact: true}).click()
        waitText(approver, "released")
        // held before its approval and without a payment, it is placed again for its approver
        approver.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Placed"))
    }
})
