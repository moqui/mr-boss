// One pass through the live client for the reports (impl-accounting P16, AC-12) over the demo organization: a reader opens
// the balance sheet from the catalog's quick options for a fiscal period, drills an account into the general ledger with
// the report's organization and period, and has its print and export; the partner ledger opens an invoice; Home shows the
// money cards and the user's work. The rules and refusals are mr-mantle's AccountingStatements and mr-boss's
// AccountingReporting and AccountingAccess specs.
function financePage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    return page
}
// The page shows the text.
function waitText(page, text) {
    page.waitFor(text => document.body.innerText.includes(text), {arg: text})
}
const reports = path => "/qapps/Accounting/Reports/" + path + "?organizationPartyId=BOSS_ACCT_ORG"

feature("a reader opens the balance sheet for a period from the catalog and drills an account into the ledger", {
    expect() {
        const reader = financePage("finance.read")
        reader.goto(reports("Reports")).status == 200
        waitText(reader, "Sales analysis")
        // the Balance sheet row's quick options: the first ancestor of an Options button that shows the row's text
        reader.evaluate(() => {
            const row = button => {
                let element = button.parentElement
                while (element && !element.innerText.includes("Assets, liabilities")) element = element.parentElement
                return element
            }
            const options = Array.from(document.querySelectorAll("button")).filter(button => button.innerText.includes("Options"))
            options.find(button => row(button) && !options.some(other => other !== button && row(button).contains(other))).click()
            return true
        }) == true
        const dialog = reader.getByRole("dialog")
        dialog.getByLabel("Fiscal period", {exact: true}).click()
        reader.getByRole("option").first().click()
        reader.waitFor(() => !document.querySelector(".q-menu"))
        dialog.getByRole("button", {name: "Open report", exact: true}).click()
        reader.waitForURL(/BalanceSheet.*timePeriodId=/)
        waitText(reader, "Total assets")
        waitText(reader, "As of")
        // the print and the CSV export carry the rows the page shows
        const printed = reader.evaluate(async () => {
            const print = Array.from(document.querySelectorAll("a")).find(a => a.href.includes("renderMode=html-print"))
            const csv = print.href.replace("renderMode=html-print", "renderMode=csv&pageNoLimit=true&saveFilename=StatementRows.csv")
            return {print: await (await fetch(print.href)).text(), csv: await (await fetch(csv)).text()}
        })
        printed.print.includes("Total assets") == true
        printed.print.includes("Accounts Receivable") == true
        printed.csv.includes("Total assets") == true
        printed.csv.includes("Accounts Receivable") == true
        reader.evaluate(() => {
            Array.from(document.querySelectorAll("a"))
                .find(a => a.href.includes("Reports/GeneralLedger") && a.href.includes("glAccountId="))
                .click()
            return true
        }) == true
        reader.waitForURL(/GeneralLedger.*glAccountId=/)
        reader.url().includes("timePeriodId=") == true
        reader.url().includes("organizationPartyId=BOSS_ACCT_ORG") == true
        waitText(reader, "Balance")
    }
})

feature("the partner ledger opens a customer's invoice with the report's organization", {
    expect() {
        const reader = financePage("finance.read")
        reader.goto(reports("PartnerLedger")).status == 200
        waitText(reader, "Opening balance")
        reader.evaluate(() => {
            Array.from(document.querySelectorAll("a"))
                .find(a => a.href.includes("Receivables/InvoiceDetail") && a.href.includes("recordId="))
                .click()
            return true
        }) == true
        reader.waitForURL(/InvoiceDetail.*recordId=/)
        reader.url().includes("organizationPartyId=BOSS_ACCT_ORG") == true
    }
})

feature("Home shows the money cards and the work waiting for a finance administrator", {
    expect() {
        const admin = financePage("finance.admin")
        admin.goto("/qapps/Accounting/Home?organizationPartyId=BOSS_ACCT_ORG").status == 200
        waitText(admin, "Receivables due")
        waitText(admin, "Payables due")
        waitText(admin, "Bank balance")
        waitText(admin, "Your work")
    }
})
