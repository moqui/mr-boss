// Manufacturing P7 in the live client (impl-manufacturing P7): the operator opens the Warehouse demo run's Quantities tab and
// its Record quantities dialog (good, pending, process loss, scrap and rework with a loss reason), the supervisor opens
// Quality's Scrap and loss, and both fit 390 px. Nothing is recorded here, since the demo run is shared with the other walks
// and their database outlives a run (F60); the quantities, losses, target change, overproduction and completion are
// ProductionQuantities (mr-mantle) and ManufacturingAccess (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.operate", 1280],
            ["manufacturing.supervise", 1280],
            ["manufacturing.operate", 390],
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
const quantitiesUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/Quantities?workEffortId=BOSS_WH_RUN"
const lossesUrl = "/qapps/Manufacturing/Quality/ScrapLoss"

feature("the operator sees the output plan and opens Record quantities with its fields", {
    expect() {
        const page = pages["manufacturing.operate:1280"]
        page.goto(quantitiesUrl).status == 200
        waitForText(page, "Output plan")
        page.text().includes("Coated filters")
        page.text().includes("Materials")
        !/Error rendering|Exception in render/.test(page.text())
        page.getByRole("button", {name: "Change quantity", exact: true}).count() == 0
        page.getByRole("button", {name: "Record quantities", exact: true}).first().click()
        const dialog = page.getByRole("dialog")
        dialog.locator("input[name=good]").count() == 1
        dialog.locator("input[name=processLoss]").count() == 1
        dialog.getByRole("button", {name: "Record", exact: true}).count() == 1
    }
})

feature("the supervisor opens Scrap and loss", {
    expect() {
        const page = pages["manufacturing.supervise:1280"]
        page.goto(lossesUrl).status == 200
        waitForText(page, "Scrap and loss")
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("Quantities and Scrap and loss fit 390 px", {
    expect() {
        const operator = pages["manufacturing.operate:390"]
        operator.goto(quantitiesUrl).status == 200
        waitForText(operator, "Output plan")
        operator.settle()
        operator.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        const supervisor = pages["manufacturing.supervise:390"]
        supervisor.goto(lossesUrl).status == 200
        waitForText(supervisor, "Scrap and loss")
        supervisor.settle()
        supervisor.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
