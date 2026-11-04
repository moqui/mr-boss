// Manufacturing P6 in the live client (impl-manufacturing P6 "usable when"): the cost estimator opens the Warehouse demo
// run's costs and sees the frozen estimate box and no actual cost, and requests the cost review when the run has costs (the
// Warehouse production walk issues to it first in the suite); the finance reader sees the actual cost and no review action;
// the page fits 390 px. The events, their ledger links, the refusals and the notice are ProductionCosts (mr-mantle) and
// ManufacturingAccess (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.cost", 1280],
            ["manufacturing.finance", 1280],
            ["manufacturing.cost", 390]
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
const costsUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts?workEffortId=BOSS_WH_RUN"

feature("the cost estimator sees the frozen estimate and no actual cost, and requests the review of a run with costs", {
    expect() {
        const page = pages["manufacturing.cost:1280"]
        page.goto(costsUrl).status == 200
        waitForText(page, "Cost events")
        page.text().includes("Coated filters")
        page.text().includes("Frozen estimate")
        !page.text().includes("Actual cost")
        !/Error rendering|Exception in render/.test(page.text())
        // the run's costs come from the Warehouse production walk; with none there is nothing to review yet
        const request = page.getByRole("button", {name: "Request cost review", exact: true})
        const canRequest = request.count() > 0
        if (canRequest) {
            request.first().click()
            const dialog = page.getByRole("dialog")
            dialog.locator("textarea[name=note]").fill("Walk: ready for the close")
            dialog.getByRole("button", {name: "Request cost review", exact: true}).click()
            waitForText(page, "Review requested")
        }
        const text = page.text()
        text.includes("Review requested") || text.includes("No costs yet")
    }
})

feature("the finance reader sees the actual cost and no review action", {
    expect() {
        const page = pages["manufacturing.finance:1280"]
        page.goto(costsUrl).status == 200
        waitForText(page, "Cost events")
        page.text().includes("Actual cost")
        page.text().includes("Frozen estimate")
        page.getByRole("button", {name: "Request cost review", exact: true}).count() == 0
    }
})

feature("a work order's costs fit 390 px", {
    expect() {
        const page = pages["manufacturing.cost:390"]
        page.goto(costsUrl).status == 200
        waitForText(page, "Cost events")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
