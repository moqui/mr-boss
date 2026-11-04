// Manufacturing reports (impl-manufacturing P16, design-manufacturing §9 and Home's Kpis): Home shows the plant's Kpis this
// month, each opening its report with the same filters, and counts the work orders completed this month; a production reader
// gets the cost report's quantities and no money columns on screen and in the export, a financial reader the amounts; each
// report renders with its scope and as-of time; a source this build does not have (P10's machine runtime) is named on the
// performance report as incomplete. On the demo data (BossManufacturingDemoData.xml, BossWarehouseDemoData.xml).
// Run: ./moq test mr-boss --spec ManufacturingReports
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, invoke} = lib
const reports = [
    "WorkOrderStatusReport",
    "MaterialReport",
    "OperationPerformanceReport",
    "LossReport",
    "QualityReport",
    "ProductionCostReport",
    "BillOfMaterialsVarianceReport",
    "PlanningReport"
]
const plant = {facilityId: ids.plantId}
const home = user => asUser(user, () => invoke("ironstone.manufacturing.HomeServices.get#Home", {appRoot: "Manufacturing"}))
// the header of the export's work order rows (the totals come first)
const header = csv =>
    (
        String(csv.output || "")
            .split("\n")
            .find(line => line.startsWith("Work order,")) || ""
    ).split(",")

spec({
    setup() {
        ec.artifactExecution.disableAuthz()
    },
    cleanup() {
        ec.artifactExecution.enableAuthz()
    }
})

feature("Home shows the plant's Kpis this month, each opening its report with the same filters, and counts the completed", {
    when() {
        const reader = home(users.read)
        const finance = home(users.finance)
        const page = asUser(users.read, () => lib.page("Home", {}, "html"))
        const oee = (reader.kpis || []).find(kpi => kpi.kpiId == "oee") || {}
        return {reader, finance, page, oee}
    },
    then({reader, finance, page, oee}) {
        reader.kpis.map(kpi => kpi.kpiId) == ["completed", "onTime", "oee", "utilization", "scrapRate"]
        reader.kpis.every(kpi => kpi.url.startsWith("/qapps/Manufacturing/Reports/") && kpi.valueText != "")
        oee.url.startsWith("/qapps/Manufacturing/Reports/OperationPerformanceReport?")
        !reader.plantId || oee.url.includes("facilityId=" + reader.plantId)
        oee.url.includes("fromDate=") && oee.url.includes("thruDate=")
        reader.summary.completedCount != null
        reader.completedLink.includes("WorkOrderStatusReport") && reader.completedLink.includes("completedFrom=")
        reader.kpiStatus.withheldText.includes("WIP value")
        // WIP value is the financial reader's only, never a zero for others
        finance.kpis.some(kpi => kpi.kpiId == "wipValue")
        page.errors == []
        page.output.includes("On-time completion")
        page.output.includes("Scrap rate")
        page.output.includes("Left out without financial read: WIP value")
    }
})

feature(
    "a reader gets the cost report's quantities and no money columns, on screen and in the export; a financial reader the amounts",
    {
        when() {
            const parameters = Object.assign({basis: "open"}, plant)
            const render = (user, mode) =>
                asUser(user, () =>
                    lib.page("Reports/ProductionCostReport", Object.assign({pageNoLimit: "true"}, parameters), mode)
                )
            return {
                readerHtml: render(users.read, "html"),
                financeHtml: render(users.finance, "html"),
                readerCsv: render(users.read, "csv"),
                financeCsv: render(users.finance, "csv")
            }
        },
        then({readerHtml, financeHtml, readerCsv, financeCsv}) {
            readerHtml.errors == []
            readerHtml.output.includes("Cost close")
            !readerHtml.output.includes("Allocated to output")
            readerHtml.output.includes("Left out without financial read")
            financeHtml.errors == []
            financeHtml.output.includes("Allocated to output")
            // the export: the same columns as the screen
            readerCsv.errors == []
            header(readerCsv).includes("Good") && header(readerCsv).includes("Cost close")
            !header(readerCsv).includes("Material") &&
                !header(readerCsv).includes("WIP") &&
                !header(readerCsv).includes("Variance")
            header(financeCsv).includes("Material") &&
                header(financeCsv).includes("WIP") &&
                header(financeCsv).includes("Variance")
        }
    }
)

feature("each report renders for a reader with its scope and as-of time, and a source not in this build is named", {
    when() {
        const failures = []
        for (const name of reports) {
            const page = asUser(users.read, () => lib.page("Reports/" + name, plant, "html"))
            if (page.errors.length || !page.output.includes("As of") || !page.output.includes("Show report"))
                failures.push(name + ": " + (page.errors.join(" | ") || "no scope or parameters"))
        }
        const performance = asUser(users.read, () => lib.page("Reports/OperationPerformanceReport", plant, "html"))
        const index = asUser(users.read, () => lib.page("Reports/ReportIndex", {}, "html"))
        return {failures, performance, index, runtime: ec.entity.isEntityDefined("mantle.work.production.MachineRuntimeEvent")}
    },
    then({failures, performance, index, runtime}) {
        failures.join("\n") == ""
        performance.output.includes("Availability")
        runtime || performance.output.includes("Incomplete: Machine runtime (shop floor)")
        index.errors == []
        reports.length == 8
        index.output.includes("BOM variance") && index.output.includes("their cost needs financial read")
    }
})
