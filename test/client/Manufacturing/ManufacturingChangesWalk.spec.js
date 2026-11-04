// Manufacturing P9 in the live client (impl-manufacturing P9): the planner opens the Warehouse demo run's Changes tab with its
// amendment remap, walks SplitWorkOrder's Allocation, Disposition and Confirm steps for one unit, and opens Components; the
// supervisor opens Disassembly; both fit 390 px. Nothing is confirmed here, since the demo run is shared with the other walks
// and their database outlives a run (F60); the substitutes, amendments, splits, cancellations, clones and kit reversals are
// ProductionChanges and SupportedAssembly (mr-mantle) and ManufacturingAccess (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.plan", 1280],
            ["manufacturing.supervise", 1280],
            ["manufacturing.plan", 390],
            ["manufacturing.supervise", 390]
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
const run = "BOSS_WH_RUN"
const changesUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/Changes?workEffortId=" + run
const splitUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/SplitWorkOrder?workEffortId=" + run
const kitsUrl = "/qapps/Manufacturing/WorkOrders/Disassembly"

feature("the planner reads the amendment remap and the amendments on the Changes tab", {
    expect() {
        const page = pages["manufacturing.plan:1280"]
        page.goto(changesUrl).status == 200
        waitForText(page, "Amendments")
        page.text().includes("Amendment to the method")
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("the planner walks a split's Allocation, Disposition and Confirm steps", {
    expect() {
        const page = pages["manufacturing.plan:1280"]
        page.goto(splitUrl).status == 200
        waitForText(page, "Allocate what is left")
        page.locator("input[name=quantity]").first().fill("1")
        page.locator("input[name=reason]").first().fill("Walk split")
        page.getByRole("button", {name: "Next", exact: true}).first().click()
        waitForText(page, "What moves")
        page.text().includes("Stays")
        page.getByRole("link", {name: "Next", exact: true}).first().click()
        waitForText(page, "Confirm the split of 1")
        page.getByRole("button", {name: "Confirm split", exact: true}).count() == 1
    }
})

feature("the supervisor opens Disassembly with its kit choice", {
    expect() {
        const page = pages["manufacturing.supervise:1280"]
        page.goto(kitsUrl).status == 200
        waitForText(page, "Reverses a pick assembly kit")
        page.getByRole("button", {name: "Preview", exact: true}).count() == 1
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("SplitWorkOrder and Disassembly fit 390 px", {
    expect() {
        const planner = pages["manufacturing.plan:390"]
        planner.goto(splitUrl).status == 200
        waitForText(planner, "Allocate what is left")
        planner.settle()
        planner.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        const supervisor = pages["manufacturing.supervise:390"]
        supervisor.goto(kitsUrl).status == 200
        waitForText(supervisor, "Reverses a pick assembly kit")
        supervisor.settle()
        supervisor.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
