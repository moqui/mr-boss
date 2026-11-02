// One pass through the live client for valuation and landed costs (design §16.3 production-to-GL, the valuation part):
// the GL user opens the carrier's freight bill, allocates its freight line by weight to the two supply receipts and posts
// it, and the line cannot be allocated again; the inventory valuation shows the stock beside the inventory account, and
// the product's Accounting context lists the landed cost. The allocation, revaluation and repair rules are tested in
// mr-mantle's AccountingValuation, the screens and permissions in mr-boss's AccountingValuation and AccountingAccess.
const org = "organizationPartyId=BOSS_ACCT_ORG"
function userPage(user) {
    const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
    page.allowProblems(/userPhoto\?userId=/)
    page.allowProblems(/Blocked script execution in 'about:srcdoc'.*sandboxed/)
    return page
}

feature("a freight line allocated by weight to two receipts posts once, and the valuation and the product show it", {
    expect() {
        const gl = userPage("finance.gl")
        gl.goto("/qapps/Accounting/Payables/BillDetail?" + org + "&recordId=BOSS_ACCT_BILL_FREIGHT").status == 200
        // the header's More menu: open it and click the item's own link, not the menu row around it
        gl.evaluate(() => {
            Array.from(document.querySelectorAll(".m-record-actions button"))
                .find(button => button.innerText.includes("More"))
                .click()
            return true
        }) == true
        gl.waitFor(() => Array.from(document.querySelectorAll(".q-menu a")).some(a => a.innerText.includes("Allocate landed")))
        gl.evaluate(() => {
            Array.from(document.querySelectorAll(".q-menu a"))
                .find(a => a.innerText.includes("Allocate landed cost"))
                .click()
            return true
        }) == true
        gl.waitForURL(/LandedCosts/)
        gl.text().includes("Landed costs of bill BOSS_ACCT_BILL_FREIGHT")
        gl.text().includes("Freight in")
        // spread by weight over the two receipts of the demo supplies
        gl.getByLabel("Spread by", {exact: true}).click()
        gl.getByRole("option", {name: "Weight", exact: true}).click()
        gl.settle()
        gl.getByLabel("Receipts", {exact: true}).click()
        gl.getByRole("option", {name: /Accounting demo office supplies/})
            .nth(0)
            .click()
        gl.getByRole("option", {name: /Accounting demo office supplies/})
            .nth(1)
            .click()
        gl.keyboard.press("Escape")
        gl.settle()
        gl.getByRole("button", {name: "Preview allocation", exact: true}).click()
        gl.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Allocation preview"))
        gl.text().includes("$28.00")
        gl.getByRole("button", {name: "Post landed cost", exact: true}).click()
        const dialog = gl.getByRole("dialog")
        dialog.locator("textarea[name=changeReason]").fill("Valuation walk: freight in on the supplies")
        dialog.getByRole("button", {name: "Confirm and post", exact: true}).click()
        gl.waitFor(() => document.querySelector(".q-page")?.innerText.includes("Allocated"))
        gl.text().includes("no charge line left to allocate")
        // the valuation sets the stock beside the inventory account
        gl.goto("/qapps/Accounting/Inventory/InventoryValuation?" + org).status == 200
        gl.text().includes("Stock value") && gl.text().includes("Inventory accounts")
        gl.text().includes("Accounting demo office supplies")
        // the product's Accounting context lists the landed cost
        gl.getByRole("link", {name: "Accounting demo office supplies", exact: true}).first().click()
        gl.waitForURL(/Records\/Product360/)
        gl.text().includes("Costs and history") && gl.text().includes("Landed cost")
        gl.text().includes("GL mappings")
    }
})
