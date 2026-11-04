// Manufacturing P5a in the live client (impl-manufacturing P5a "usable when"): a planner walks New work order for DEMO_1_1
// (Identity, Method, Review with what is producible now), creates the draft and releases it from its primary action; the
// work order shows Released and its operations; the list and the work order fit 390 px for a reader. The release gate, the
// staged release, the board, bulk, hold, unrelease and cancel are Mantle's ProductionOrders spec and ManufacturingWorkOrders.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.plan", 1280],
            ["manufacturing.read", 390]
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
const base = "/qapps/Manufacturing/WorkOrders/"
let created = null

feature("a planner walks New work order for DEMO_1_1, creates the draft and releases it", {
    expect() {
        const page = pages["manufacturing.plan:1280"]
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
feature("the work order list and a work order fit 390 px", {
    expect() {
        const page = pages["manufacturing.read:390"]
        page.goto(base + "Find").status == 200
        waitForText(page, "Work orders")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto(base + "WorkOrderDetail?workEffortId=BOSS_MFG_RUN_A").status == 200
        waitForText(page, "Demo assemblies")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
