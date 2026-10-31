// Tax (impl-accounting P14) in the live client over the demo's Utah sales tax: a finance administrator versions a rate
// and simulates a sale; an AR user finalizes a product invoice to a Utah customer and sees its tax line; a tax user makes
// the month's sales tax statement with its invoice lines, and the year's 1099 data, which names the vendor without a
// taxpayer number. Authority and rate refusals, rounding and the statement export are the AccountingTax specs.
function financePage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
    return page
}
// Accept the confirmation of the next action, as the user does (after the page has loaded).
function acceptConfirm(page) {
    page.evaluate(() => {
        window.confirm = () => true
        return true
    }) == true
}
const tax = path => "/qapps/Accounting/Tax/" + path + "?organizationPartyId=BOSS_ACCT_ORG"
// Choose a drop-down option of the open dialog: type the search text, click the option, then close the menu as a user
// does by clicking the dialog's title.
function choose(page, dialog, label, search, option, title) {
    dialog.getByLabel(label, {exact: true}).click()
    if (search) dialog.getByLabel(label, {exact: true}).fill(search)
    page.getByRole("option", {name: option}).first().click()
    page.getByText(title, {exact: true}).click()
    page.waitFor(() => !document.querySelector(".q-menu"))
}

feature("a finance administrator starts a new rate version and simulates a Utah sale", {
    expect() {
        const page = financePage("finance.admin")
        page.goto(tax("TaxRates")).status == 200
        page.text().includes("Utah sales tax")
        page.getByRole("button", {name: "New version", exact: true}).first().click()
        let dialog = page.getByRole("dialog")
        dialog.locator("input[name=taxPercentage]").fill("6.35")
        dialog.locator("input[name=changeReason]").fill("Browser rate change")
        dialog.getByRole("button", {name: "Save version", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("6.35%"))
        page.text().includes("Ended")
        page.getByRole("button", {name: "Simulate", exact: true}).click()
        dialog = page.getByRole("dialog")
        choose(page, dialog, "Delivered to", "Utah", /^Utah$/, "Simulate a sale's tax")
        dialog.locator("input[name=amount]").fill("100")
        dialog.getByRole("button", {name: "Explain the tax", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Simulated tax"))
        page.text().includes("6.35%")
        page.text().includes("6.35")
    }
})

feature("an AR user finalizes a product invoice to a Utah customer and it gets its tax line", {
    expect() {
        const page = financePage("finance.ar")
        page.goto("/qapps/Accounting/Receivables/Invoices?organizationPartyId=BOSS_ACCT_ORG").status == 200
        page.getByRole("button", {name: "New invoice", exact: true}).click()
        let dialog = page.getByRole("dialog")
        choose(page, dialog, "Customer", "Wasatch", "Wasatch Outfitters", "New receivable")
        dialog.locator("input[name=description]").fill("Browser taxed sale")
        dialog.getByRole("button", {name: "Create receivable", exact: true}).click()
        page.waitForURL(/recordId=/)
        page.getByRole("tab", {name: "Items and taxes", exact: true}).click()
        page.getByRole("button", {name: "Add line", exact: true}).click()
        dialog = page.getByRole("dialog")
        choose(page, dialog, "Line type", "Product", /^Product$/, "Add invoice line")
        dialog.locator("input[name=description]").fill("Browser trail gear")
        dialog.locator("input[name=quantity]").fill("1")
        dialog.locator("input[name=amount]").fill("200")
        dialog.getByRole("button", {name: "Save line", exact: true}).click()
        page.waitFor(() => !document.querySelector("[role=dialog]"))
        acceptConfirm(page)
        page.getByRole("button", {name: "Finalize invoice", exact: true}).click()
        page.waitFor(() => document.querySelector(".m-record-status")?.innerText.includes("Finalized"))
        page.getByRole("tab", {name: "Items and taxes", exact: true}).click()
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Utah sales tax"))
        // 200.00 at the new 6.35% version
        page.text().includes("12.70")
    }
})

feature("a tax user makes the month's sales tax statement and the year's 1099 data", {
    expect() {
        const page = financePage("finance.tax")
        page.goto(tax("TaxStatements")).status == 200
        page.getByRole("button", {name: "New sales tax statement", exact: true}).click()
        let dialog = page.getByRole("dialog")
        choose(page, dialog, "Authority", "Utah", "Utah sales tax", "A sales tax statement")
        // the latest period that has begun is this month
        dialog.getByLabel("Period", {exact: true}).click()
        page.getByRole("option").first().click()
        page.getByText("A sales tax statement", {exact: true}).click()
        page.waitFor(() => !document.querySelector(".q-menu"))
        dialog.getByRole("button", {name: "Make statement", exact: true}).click()
        page.waitForURL(/TaxStatementDetail/)
        page.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Invoice tax lines"))
        page.text().includes("BOSS_ACCT_TAXED")
        page.text().includes("Wasatch Outfitters")
        page.text().includes("Not exported")
        page.goto(tax("TaxStatements")).status == 200
        page.getByRole("button", {name: "Make 1099 data", exact: true}).click()
        dialog = page.getByRole("dialog")
        const year = "FY" + new Date().getFullYear()
        choose(page, dialog, "Fiscal year", year, new RegExp(year + "$"), "Make the year's 1099-MISC data")
        acceptConfirm(page)
        dialog.getByRole("button", {name: "Make 1099 data", exact: true}).click()
        page.waitFor(() => document.body.innerText.includes("1099 data made for"))
        page.text().includes("no taxpayer identification number")
        page.text().includes("1099-MISC")
    }
})
