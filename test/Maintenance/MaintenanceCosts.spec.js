// Maintenance costs in BOSS (impl-maintenance P11; design-maintenance §3 WorkCosts, §8 MaintenanceCostReport, "Charging a project"):
// WorkOrderDetail's Costs tab's one qvt render for the cost reader (the compressor belt's two approved hours at Services' costing rate
// of its service technicians, 48 USD an hour, its estimate; no pay rate), MaintenanceCostReport's one qvt render (the scope's totals
// by currency, the air handler's gaskets at cost, the hours not approved apart, the motor's rewind pending), its CSV export (the
// options and the same sources) and its print (html-print, its own template); and Projects' money (an owner contract): a repair
// charged to the support project shows there as a cost. Who reads costs is MaintenanceAccess' (the cost reader's tab, the
// planner's none); the rules are Mantle's MaintenanceCosts; the "usable when" is the acceptance MaintenanceCostWalk.
// Run: ./moq test mr-boss --spec MaintenanceCosts
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const project = "SUPP"
const ORDER = "mantle.work.maintenance.MaintenanceWorkOrder"

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the cost reader's Costs tab prices the belt's approved hours at the class's costing rate, and shows its estimate", {
    when() {
        return asUser(users.cost, () =>
            page("WorkOrders/WorkOrderDetail/Costs", {workEffortId: ids.beltOrderId, lastStandalone: "true"})
        )
    },
    then(tab) {
        tab.errors.length == 0
        tab.output.includes("Cost by currency")
        tab.output.includes("$96.00")
        tab.output.includes("$48.00/h · Service technician")
        tab.output.includes("Estimate")
        tab.output.includes("Time " + "BOSS_MNT_TE_BELT1")
        tab.output.includes("Approved")
    }
})

feature(
    "the cost report shows the scope's costs by currency with the hours apart and the rewind pending; its CSV and print carry the same",
    {
        when() {
            const options = {organizationPartyId: ids.organizationId}
            const report = asUser(users.cost, () => page("WorkOrders/MaintenanceCostReport", options))
            const csv = asUser(users.cost, () => ({
                output: String(
                    ec.screen
                        .makeTest()
                        .rootScreen("component://mr-boss/screen/Maintenance.xml")
                        .render("WorkOrders/MaintenanceCostReport/exportCsv", options, null).output || ""
                )
            }))
            const printed = asUser(users.cost, () =>
                page("WorkOrders/MaintenanceCostReport", Object.assign({lastStandalone: "true"}, options), "html-print")
            )
            return {report, csv, printed}
        },
        then({report, csv, printed}) {
            report.errors.length == 0
            report.output.includes("Maintenance costs")
            report.output.includes("USD")
            report.output.includes("h not approved yet")
            report.output.includes("Air handler coil leak")
            report.output.includes("AHU-2 coil gasket")
            report.output.includes("Ordered, not accepted")
            report.output.includes("Export CSV")
            csv.output.includes('"Maintenance costs"')
            csv.output.includes('"organizationPartyId=' + ids.organizationId + '"')
            csv.output.includes('"BOSS_MNT_TE_BELT1"')
            csv.output.includes('"Motor rewind (outside service)"')
            printed.errors.length == 0
            printed.output.includes("Maintenance costs")
            printed.output.includes("BOSS_MNT_TE_BELT1")
            !printed.output.includes("Show report")
        }
    }
)

feature("a repair charged to a project shows in the project's money as a cost (Projects' owner contract)", {
    when() {
        system(() => invoke("update#" + ORDER, {workEffortId: ids.beltOrderId, projectWorkEffortId: project}))
        try {
            const summary = system(
                () => invoke("mantle.work.ProjectServices.get#ProjectMoneySummary", {workEffortId: project}).summary
            )
            const money = page("Projects/ProjectDetail/Money", {workEffortId: project, lastStandalone: "true"}, "qvt", "Projects")
            return {summary, money}
        } finally {
            system(() => invoke("update#" + ORDER, {workEffortId: ids.beltOrderId, projectWorkEffortId: null}))
        }
    },
    then({summary, money}) {
        summary.maintenanceList.length == 1
        summary.maintenanceList[0].workEffortId == ids.beltOrderId
        summary.maintenanceList[0].totalList[0].total.compare(96) == 0
        money.errors.length == 0
        money.output.includes("Maintenance · 1")
        money.output.includes("Compressor drive belt squeal")
        money.output.includes("$96.00")
    }
})
