// Manufacturing P5b in the live client (impl-manufacturing P5b "usable when"): a material handler (an operator in
// Warehouse's issue and move groups) opens a released work order's Components, with Stage stock to Warehouse's Move, then its
// Materials tab (Shared/MaterialIssueReceipt in the Manufacturing context) with what was issued and returned apart;
// both tabs fit 390 px. The postings, the backflush, the staged short line and the refusals are Mantle's
// ProductionMaterials spec and ManufacturingMaterials.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.material", 1280],
            ["manufacturing.material", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
const base = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/"
const run = "BOSS_WH_RUN"

feature("a material handler opens a work order's components and materials, with Stage stock", {
    expect() {
        const page = pages["manufacturing.material:1280"]
        page.goto(base + "Components?workEffortId=" + run).status == 200
        waitForText(page, "Coated filters")
        waitForText(page, "Remaining")
        page.text().includes("Stage stock")
        page.goto(base + "MaterialIssueReceipt?workEffortId=" + run).status == 200
        waitForText(page, "Posted issues and receipts")
        page.text().includes("Returned")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
feature("the components and materials of a work order fit 390 px", {
    expect() {
        const page = pages["manufacturing.material:390"]
        page.goto(base + "Components?workEffortId=" + run).status == 200
        waitForText(page, "Coated filters")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto(base + "MaterialIssueReceipt?workEffortId=" + run).status == 200
        waitForText(page, "Posted issues and receipts")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
