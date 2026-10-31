// One pass through the live client for budgets (impl-accounting P15, AC-14) over the demo's operating budget: a GL user
// starts a draft and adds an account, revises the approved budget with a reason and reads it as approved; an approver's
// over-budget bill is stopped and passes with an override reason; a reader's variance report shows the committed order.
// The rules and refusals are mr-mantle's AccountingBudgets and mr-boss's AccountingBudgets and AccountingAccess specs.
function financePage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    return page
}
function confirmDialogs(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    }) == true
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
const budgets = path => "/qapps/Accounting/Budgets/" + path + "?organizationPartyId=BOSS_ACCT_ORG"

feature("a GL user starts a draft budget, adds an account, and revises the approved budget with a reason", {
    expect() {
        const gl = financePage("finance.gl")
        gl.goto(budgets("Budgets")).status == 200
        waitText(gl, "Operating budget")
        gl.getByRole("button", {name: "New budget", exact: true}).click()
        let dialog = gl.getByRole("dialog")
        dialog.locator("input[name=description]").fill("Walk budget")
        dialog.getByLabel("Period", {exact: true}).click()
        gl.getByRole("option").first().click()
        gl.getByText("A new budget", {exact: true}).click()
        gl.waitFor(() => !document.querySelector(".q-menu"))
        dialog.getByRole("button", {name: "Start budget", exact: true}).click()
        gl.waitForURL(/BudgetDetail.*budgetId=/)
        waitText(gl, "Walk budget")
        gl.getByRole("button", {name: "Add account", exact: true}).click()
        dialog = gl.getByRole("dialog")
        dialog.getByLabel("Account", {exact: true}).click()
        gl.getByRole("option").first().click()
        gl.getByText("Add an account to budget", {exact: false}).first().click()
        gl.waitFor(() => !document.querySelector(".q-menu"))
        dialog.locator("input[name=amountMain]").fill("1200")
        dialog.getByRole("button", {name: "Add account", exact: true}).click()
        waitText(gl, "1,200.00")
        // the editor does not approve
        gl.getByRole("button", {name: "Approve budget", exact: true}).count() == 0

        // the demo budget is revised with a reason; the approved numbers stay readable
        gl.goto(budgets("BudgetDetail") + "&budgetId=BOSS_ACCT_BUDGET").status == 200
        waitText(gl, "Added trade show travel")
        // the expense account's row, the one at 3,200.00: the first ancestor of its button that shows an amount
        gl.evaluate(() => {
            const row = button => {
                let element = button.parentElement
                while (element && !/\d,\d{3}\.\d{2}/.test(element.innerText)) element = element.parentElement
                return element?.innerText || ""
            }
            Array.from(document.querySelectorAll("button"))
                .find(button => button.innerText.includes("Revise") && row(button).includes("3,200.00"))
                .click()
            return true
        }) == true
        dialog = gl.getByRole("dialog")
        dialog.locator("input[name=amountMain]").fill("3400")
        dialog.locator("input[name=changeReason]").fill("Walk revision")
        dialog.getByRole("button", {name: "Revise budget", exact: true}).click()
        waitText(gl, "Walk revision")
        gl.getByRole("link", {name: "Approved", exact: true}).click()
        waitText(gl, "These are the amounts as approved")
    }
})

feature("an approver's over-budget bill is stopped, then approved over budget with a reason", {
    expect() {
        const approver = financePage("finance.approve")
        approver.allowProblems(/BUDGET_EXCEEDED|approveBill/)
        approver.goto("/qapps/Accounting/Payables/BillDetail?organizationPartyId=BOSS_ACCT_ORG&recordId=BOSS_ACCT_BILL_OVER")
            .status == 200
        confirmDialogs(approver)
        approver.getByRole("button", {name: "Approve bill", exact: true}).click()
        waitText(approver, "Over budget (Stop)")
        confirmDialogs(approver)
        // the header's More menu: click the item's own button, not the menu row around it
        approver.evaluate(() => {
            Array.from(document.querySelectorAll(".m-record-actions button"))
                .find(button => button.innerText.includes("More"))
                .click()
            return true
        }) == true
        approver.waitFor(() =>
            Array.from(document.querySelectorAll(".q-menu button")).some(b => b.innerText.includes("Approve over budget"))
        )
        approver.evaluate(() => {
            Array.from(document.querySelectorAll(".q-menu button"))
                .find(b => b.innerText.includes("Approve over budget"))
                .click()
            return true
        }) == true
        const dialog = approver.getByRole("dialog")
        dialog.locator("input[name=budgetOverrideReason]").fill("Walk emergency repair")
        dialog.getByRole("button", {name: "Approve over budget", exact: true}).click()
        approver.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Approved"))
        approver.getByRole("tab", {name: "Budget details", exact: true}).click()
        waitText(approver, "Walk emergency repair")
    }
})

feature("a reader's budget variance shows the committed order and the controls its exception", {
    expect() {
        const reader = financePage("finance.read")
        reader.goto("/qapps/Accounting/Reports/BudgetVariance?organizationPartyId=BOSS_ACCT_ORG&budgetId=BOSS_ACCT_BUDGET")
            .status == 200
        waitText(reader, "Committed")
        waitText(reader, "600.00")
        reader.goto(budgets("BudgetControls")).status == 200
        waitText(reader, "BOSS_ACCT_BILL_OVER")
        waitText(reader, "Over budget, overridden")
        reader.getByRole("button", {name: "Add policy", exact: true}).count() == 0
    }
})
