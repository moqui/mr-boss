// Manufacturing P16 in the live client (impl-manufacturing P16 "usable when"): a production reader opens Home's OEE Kpi, which
// opens the performance report with the plant and this month, and sees the three factors; the reader's cost report has the
// quantities and no money columns, a financial reader's the amounts; a report fits 390 px. The figures, the partitions and
// the export are Mantle's ProductionReports spec, ManufacturingReports and ManufacturingAccess.
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.read", 1280],
            ["manufacturing.finance", 1280],
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
const reports = "/qapps/Manufacturing/Reports/"

feature("a reader opens Home's OEE Kpi and sees its three factors for the plant this month", {
    expect() {
        const page = pages["manufacturing.read:1280"]
        page.goto("/qapps/Manufacturing/Home").status == 200
        waitForText(page, "On-time completion")
        page.getByText("OEE", {exact: true}).first().click()
        waitForText(page, "Operation performance")
        waitForText(page, "Availability")
        page.url().includes("OperationPerformanceReport") && page.url().includes("fromDate=")
        page.text().includes("Performance") && page.text().includes("Quality")
        page.text().includes("As of")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
feature("a reader's cost report has the quantities and no money columns; a financial reader's has the amounts", {
    expect() {
        const reader = pages["manufacturing.read:1280"]
        reader.goto(reports + "ProductionCostReport?basis=open&facilityId=ZIRET_WH").status == 200
        waitForText(reader, "Cost close")
        !reader.text().includes("Allocated to output")
        reader.text().includes("Left out without financial read")
        const finance = pages["manufacturing.finance:1280"]
        finance.goto(reports + "ProductionCostReport?basis=open&facilityId=ZIRET_WH").status == 200
        waitForText(finance, "Allocated to output")
        finance.text().includes("Cost close")
    }
})
feature("a report fits 390 px", {
    expect() {
        const page = pages["manufacturing.read:390"]
        page.goto(reports + "LossReport").status == 200
        waitForText(page, "Trend by week")
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
