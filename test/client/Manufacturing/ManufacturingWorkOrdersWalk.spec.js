// Manufacturing P5a in the live client (impl-manufacturing P5a "usable when"): a planner walks New work order for DEMO_1_1
// (Identity, Method, Review with what is producible now), creates the draft and releases it from its primary action; the
// work order shows Released and its operations. The list and the work order at 390 px are the acceptance walk
// ManufacturingWorkOrdersPhone. The release gate, the staged release, the board, bulk, hold, unrelease and cancel are
// Mantle's ProductionOrders spec and ManufacturingWorkOrders.
let page
spec({
    setupSpec() {
        page = browser.newPage({user: "manufacturing.plan", viewport: {width: 1280, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
const base = "/qapps/Manufacturing/WorkOrders/"
let created = null

feature("a planner walks New work order for DEMO_1_1, creates the draft and releases it", {
    expect() {
        // the method is chosen at the Method step; the demo method is given so other specs' methods do not make it ambiguous
        page.goto(base + "NewWorkOrder?productId=DEMO_1_1&quantity=1&facilityId=BOSS_MFG_LINE_A&productBomId=BOSS_MFG_BOM_PILOT")
            .status == 200
        waitForText(page, "What to make")
        page.getByRole("button", {name: "Next: method", exact: true}).click()
        waitForText(page, "The method of")
        page.text().includes("BOSS_MFG_ROUTING_A")
        page.getByRole("button", {name: "Next: review", exact: true}).click()
        waitForText(page, "Producible now")
        page.text().includes("Demo Raw Material 1")
        page.getByRole("button", {name: "Create draft", exact: true}).click()
        page.waitFor(() => location.pathname.includes("WorkOrderDetail"))
        waitForText(page, "Lifecycle")
        created = page.evaluate(() => new URLSearchParams(location.search).get("workEffortId"))
        !!created
        page.getByRole("button", {name: "Release", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.getByRole("button", {name: "Release", exact: true}).click()
        waitForText(page, "Released 20")
        page.text().includes("Approved")
        page.goto(base + "WorkOrderDetail/Operations?workEffortId=" + created).status == 200
        waitForText(page, "Assemble")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
