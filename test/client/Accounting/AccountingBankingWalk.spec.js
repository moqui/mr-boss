// One pass through the live client for Banking: a CSV statement is reviewed and imported, a second with a duplicate
// and a malformed row imports only its new line; a bank line is reconciled with its receipt from the row's dialog; two
// receipts go on a deposit slip whose one bank line reconciles them; a statement session clears its lines and finishes
// only at zero difference. The rules and refusals are tested in mr-mantle's AccountingBankReconciliation and mr-boss's
// AccountingBanking and AccountingAccess.
const org = "organizationPartyId=BOSS_ACCT_ORG"
const bank = "paymentMethodId=BOSS_ACCT_BANK"
function treasuryPage() {
    const page = browser.newPage({user: "finance.treasury", viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
    return page
}
function today(page) {
    return page.evaluate(() => {
        const now = new Date()
        return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
    })
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
// The header's More menu: open it and click the item's own button, not the menu row around it.
function headerAction(page, label) {
    page.evaluate(() => {
        Array.from(document.querySelectorAll(".m-record-actions button"))
            .find(button => button.innerText.includes("More"))
            .click()
        return true
    }) == true
    page.waitFor(label => Array.from(document.querySelectorAll(".q-menu button")).some(b => b.innerText.trim().endsWith(label)), {
        arg: label
    })
    page.evaluate(label => {
        Array.from(document.querySelectorAll(".q-menu button"))
            .find(b => b.innerText.trim().endsWith(label))
            .click()
        return true
    }, label) == true
}
function reviewStatement(page, text) {
    page.goto("/qapps/Accounting/Banking/StatementImport?" + org + "&" + bank).status == 200
    const form = page.locator(".q-page")
    chooseOption(page, form, "Format", "CSV", /^CSV$/)
    form.locator("textarea[name=statementText]").fill(text)
    form.getByRole("button", {name: "Review statement", exact: true}).click()
    page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Review the statement"))
}

feature("treasury imports a statement, then one with a duplicate and a malformed row adds only its new line", {
    expect() {
        const page = treasuryPage()
        const day = today(page)
        reviewStatement(
            page,
            ["Date,Description,Amount,Reference", `${day},Walk supplies,-42.10,W1`, `${day},Walk receipt,310.00,W2`].join("\n")
        )
        page.text().includes("Walk supplies")
        acceptConfirmations(page)
        page.getByRole("button", {name: "Import 2 new lines", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("2 lines were imported"))
        reviewStatement(
            page,
            [
                "Date,Description,Amount,Reference",
                `${day},Walk receipt,310.00,W2`,
                "not a day,Walk broken,1.00,W3",
                `${day},Walk fee,-3.00,W4`
            ].join("\n")
        )
        page.text().includes("Duplicate")
        page.text().includes("is not a date")
        acceptConfirmations(page)
        page.getByRole("button", {name: "Import 1 new lines", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("1 lines were imported"))
        page.getByRole("link", {name: "Open the bank account", exact: true}).click()
        page.waitForURL(/BankAccountDetail/)
        page.text().includes("Walk fee")
        page.text().includes("Walk broken") == false
    }
})
feature("a bank line is reconciled from its row, and a deposit slip's one bank line reconciles its receipts", {
    expect() {
        const page = treasuryPage()
        const detail = query => "/qapps/Accounting/Banking/BankAccountDetail?" + org + "&" + bank + query
        page.goto(detail("&text=BOSS-DEMO-WIRE")).status == 200
        page.getByRole("button", {name: "Reconcile", exact: true}).first().click()
        let dialog = page.getByRole("dialog")
        chooseOption(page, dialog, "Payment, deposit or ledger entry", "", /BOSS_ACCT_BANK_RCPT3/)
        dialog.getByRole("button", {name: "Reconcile line", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Payment BOSS_ACCT_BANK_RCPT3"))
        page.text().includes("Matched")
        // two receipts on one deposit slip
        page.goto(detail("")).status == 200
        headerAction(page, "Deposit slip")
        dialog = page.getByRole("dialog")
        for (const receipt of ["BOSS_ACCT_BANK_RCPT1", "BOSS_ACCT_BANK_RCPT2"])
            chooseOption(page, dialog, "Receipts", receipt, new RegExp(receipt))
        dialog.locator("input[name=referenceNumber]").fill("Walk slip")
        dialog.getByRole("button", {name: "Make deposit slip", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Walk slip"))
        page.text().includes("Not reconciled yet")
        // the bank reports the deposit as one line
        headerAction(page, "Add bank line")
        dialog = page.getByRole("dialog")
        dialog.locator("input[name=postedDate]").fill(today(page))
        dialog.locator("input[name=transAmount]").fill("200")
        dialog.locator("input[name=transName]").fill("Walk deposit")
        dialog.getByRole("button", {name: "Add bank line", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Walk deposit"))
        page.goto(detail("&text=Walk deposit")).status == 200
        page.getByRole("button", {name: "Reconcile", exact: true}).first().click()
        dialog = page.getByRole("dialog")
        chooseOption(page, dialog, "Payment, deposit or ledger entry", "", /^Deposit /)
        dialog.getByRole("button", {name: "Reconcile line", exact: true}).click()
        page.waitFor(() => /Deposit \d+/.test(document.querySelector(".q-page")?.innerText || ""))
        page.goto(detail("")).status == 200
        page.text().includes("Not reconciled yet") == false
    }
})
feature("a statement session clears a line left unmatched with its reason, and is not finished with a difference", {
    expect() {
        const page = treasuryPage()
        // the refusal of finishing is shown to the user as a notice, with the transition's error status
        page.allowProblems(/BANK_LINES_UNCLEARED|STATEMENT_DIFFERENCE/)
        page.allowProblems(/finishStatement/)
        const day = today(page)
        page.goto("/qapps/Accounting/Banking/Reconciliations?" + org).status == 200
        page.getByRole("button", {name: "Start a statement", exact: true}).click()
        let dialog = page.getByRole("dialog")
        chooseOption(page, dialog, "Bank account", "Operating", /Operating account/)
        dialog.locator("input[name=statementReference]").fill("Walk statement")
        dialog.locator("input[name=statementFromDate]").fill(day)
        dialog.locator("input[name=statementThruDate]").fill(day)
        dialog.locator("input[name=openingBalance]").fill("1000")
        dialog.locator("input[name=closingBalance]").fill("1000")
        dialog.getByRole("button", {name: "Start statement", exact: true}).click()
        page.waitForURL(/ReconciliationDetail/)
        page.text().includes("Walk statement")
        // leave the fee unmatched with a reason, which clears it
        page.goto(page.url().split("&lineState")[0] + "&lineState=open").status == 200
        page.getByRole("button", {name: "Not reconciled", exact: true}).first().click()
        dialog = page.getByRole("dialog")
        dialog.locator("input[name=noReconcileReason]").fill("Walk: booked at month end")
        dialog.getByRole("button", {name: "Clear without a match", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Cleared"))
        // finishing with lines still to clear or a difference is refused, and the refusal is shown
        acceptConfirmations(page)
        page.getByRole("button", {name: "Finish statement", exact: true}).first().click()
        dialog = page.getByRole("dialog")
        dialog.getByRole("button", {name: "Finish statement", exact: true}).click()
        page.waitFor(() => /not cleared|differs/.test(document.body.innerText))
        page.text().includes("In progress")
    }
})
