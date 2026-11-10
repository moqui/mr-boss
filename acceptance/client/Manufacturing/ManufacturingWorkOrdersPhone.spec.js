// Manufacturing P5a at phone width (impl-manufacturing P5a "usable when"): the work order list and a work order fit 390 px
// for a reader. The golden path, New work order through release, is test/client ManufacturingWorkOrdersWalk.
let page
spec({
    setupSpec() {
        page = browser.newPage({user: "manufacturing.read", viewport: {width: 390, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    }
})
function waitForText(text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
const base = "/qapps/Manufacturing/WorkOrders/"

feature("the work order list and a work order fit 390 px", {
    expect() {
        page.goto(base + "Find").status == 200
        waitForText("Work orders")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto(base + "WorkOrderDetail?workEffortId=BOSS_MFG_RUN_A").status == 200
        waitForText("Demo assemblies")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
