// Sales' report catalogue and its Insights registrations (impl-sales P19; design-sales §8 Reports; F3, F24, F59): Sales analysis is one
// Sales entry at Sales' route, read through Sales' catalogue (mantle.sales.SalesWorkspaceServices.get#SalesReports) by Sales' report
// readers, and Accounting's mount of it is Accounting's own entry under Accounting's catalogue, read by Accounting's report readers;
// Sales' other entries (summary, pipeline analysis, win/loss, target attainment, forecast) are the report reader's; a representative
// reads Forecast alone. All reports lists the reader's reports with their links. The Sales reader and representative read Insights'
// catalog through spec-local memberships of Insights' read group, removed at the end. The finance columns under Accounting's mount are
// AccountingReporting's render; the flow map's quote step, InsightsFlowMaps'.
// Run: ./moq test mr-boss --spec SalesReportCatalog
const {asUser, system, invoke, page} = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const G = "ironstone.insights.RegistryServices."
const memberships = [
    ["BOSS_SAL_READER", "BOSS_INSIGHTS"],
    ["BOSS_SAL_READER", "BOSS_INSIGHTS_READ"],
    ["BOSS_SAL_REP", "BOSS_INSIGHTS"],
    ["BOSS_SAL_REP", "BOSS_INSIGHTS_READ"]
]
function removeMemberships() {
    system(() => {
        for (const [userId, userGroupId] of memberships)
            ec.entity.find("moqui.security.UserGroupMember").condition({userId, userGroupId}).deleteAll()
    })
}
const entryIds = user =>
    asUser(user, () =>
        Array.from(invoke(G + "find#Reports", {}).reports || [])
            .map(row => row.entryId)
            .filter(id => id.startsWith("Sales.") || /SalesAnalysis/.test(id))
    )

spec({
    setupSpec() {
        login("john.doe")
        removeMemberships()
        system(() => {
            for (const [userId, userGroupId] of memberships)
                ec.service
                    .sync()
                    .name("create#moqui.security.UserGroupMember")
                    .parameters({userId, userGroupId, fromDate: 0})
                    .call()
        })
    },
    cleanupSpec() {
        login("john.doe")
        removeMemberships()
    }
})

feature("Sales analysis is Sales' entry at Sales' route for its report readers and Accounting's own entry for Accounting's", {
    when() {
        return {
            reader: entryIds("sales.reader"),
            rep: entryIds("sales.rep"),
            finance: entryIds("insights.finance"),
            route: asUser("sales.reader", () =>
                Array.from(invoke(G + "find#Reports", {text: "sales analysis"}).reports || []).map(
                    row => row.entryId + " " + row.url
                )
            )
        }
    },
    then({reader, rep, finance, route}) {
        reader.includes("Sales.SalesAnalysis")
        reader.includes("Sales.SalesSummary")
        reader.includes("Sales.PipelineAnalysis")
        reader.includes("Sales.WinLoss")
        reader.includes("Sales.TargetAttainment")
        reader.includes("Sales.Forecast")
        !reader.includes("Accounting.SalesAnalysis")
        route.includes("Sales.SalesAnalysis /qapps/Sales/Reports/SalesAnalysis")
        rep == ["Sales.Forecast"]
        finance == ["Accounting.SalesAnalysis"]
    }
})

feature("All reports lists the reader's reports with their links", {
    when() {
        return asUser("sales.reader", () => page("Reports/Catalogue", {}, "html"))
    },
    then({errors, output}) {
        errors.length == 0
        output.includes("Pipeline analysis")
        output.includes("Win/loss")
        output.includes("Target attainment")
        // each title is a link (resolved from the app root in the shell; this render's root is Sales itself)
        output.includes("SalesReportCatalogue_title_0_reportPath")
    }
})
