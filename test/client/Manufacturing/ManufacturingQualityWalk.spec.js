// Manufacturing P8 in the live client (impl-manufacturing P8): the inspector opens Quality's Inspections, the demo weld
// inspection in the shared QualityInspection (Submit result, no Verify), its work order's Quality tab with the gate that
// holds Pack, and the inspection station in operator mode with its first step's Pass and Fail; the station and the tab fit
// 390 px. Nothing is recorded here, since the demo inspection is shared with the other specs and their database outlives a
// run (F60); the gates, the held output, the inspector and verifier, the disposition and the template revision are
// ProductionQuality (mr-mantle) and ManufacturingAccess (BOSS).
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.inspect", 1280],
            ["manufacturing.inspect", 390]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user + ":" + width] = page
        }
    }
})
// a handheld-density screen is not under the desk layout's .q-page, so the text is the body's
function waitForText(page, text) {
    page.waitFor(text => (document.body?.innerText || "").includes(text), {arg: text})
}
const inspectionsUrl = "/qapps/Manufacturing/Quality/Inspections"
const inspectionUrl = "/qapps/Manufacturing/Quality/QualityInspection?qualityInspectionId=BOSS_MFG_INSP"
const gatesUrl = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail/Quality?workEffortId=BOSS_MFG_RUN_Q"
const stationUrl = "/qapps/Manufacturing/Quality/InspectionStation/Inspection?qualityInspectionId=BOSS_MFG_INSP"

feature("the inspector finds the weld inspection and opens it with Submit result and no Verify", {
    expect() {
        const page = pages["manufacturing.inspect:1280"]
        page.goto(inspectionsUrl).status == 200
        waitForText(page, "BOSS_MFG_INSP")
        !/Error rendering|Exception in render/.test(page.text())
        page.goto(inspectionUrl).status == 200
        waitForText(page, "Weld bead even")
        page.text().includes("Open the work order")
        page.getByRole("button", {name: "Submit result", exact: true}).count() == 1
        page.getByRole("button", {name: "Verify", exact: true}).count() == 0
    }
})

feature("the work order's Quality tab shows the weld gate pending and what it holds", {
    expect() {
        const page = pages["manufacturing.inspect:1280"]
        page.goto(gatesUrl).status == 200
        waitForText(page, "Weld check")
        page.text().includes("Pending")
        page.text().includes("BOSS_MFG_INSP")
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("the inspection station shows one step with Pass and Fail, and it and the Quality tab fit 390 px", {
    expect() {
        const page = pages["manufacturing.inspect:390"]
        page.goto(stationUrl).status == 200
        waitForText(page, "Step 1")
        page.getByRole("button", {name: "Pass", exact: true}).count() == 1
        page.getByRole("button", {name: "Fail", exact: true}).count() == 1
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        page.goto(gatesUrl).status == 200
        // the phone's columns: the gate, its inspection and state, and what it holds
        waitForText(page, "is pending")
        page.settle()
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
