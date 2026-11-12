// Insights' server-static sweep (impl-insights P12; README "Significant redesigns" 3, mr-moqui plans/archive/QvtServerStatic.md;
// AGENTS.md: one sweep per app per mode, in acceptance): ServerStaticLib's full check of each plain XML Insights screen, its
// own files and the framework's report screens it mounts by location (InsightsSpecLib.mountedScreens), on the
// demo's records, as john.doe. A screen marked server-static="qvt" must come back clean; the others and why are logged. No
// Insights screen is marked yet (its pages load their panels on the client). WallDisplay is left to its own specs (the regression
// InsightsWallDisplay and the acceptance InsightsWallDisplayUsable): it is a device's bare page, not a shell screen. The record
// mounts are the shared screens' (screen/Shared), checked with them.
// Run: ./moq accept mr-boss --spec InsightsServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
const insightsLib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
let screens

// the id parameters of the screens that open on one demo record (InsightsTui's)
const parameters = {
    Dashboard: {definitionId: "mantle-sales", from: "now-1y", thru: "now"},
    DashboardEditor: {definitionId: "insights-suite"},
    PanelDetail: {definitionId: "insights-suite-orders"},
    Drill: {definitionId: "insights-suite-orders", from: "now-1y", thru: "now"},
    "ReportBuilder/DatasetDetail": {datasetId: "boss-service-clocks"},
    "ReportBuilder/DatasetFields": {datasetId: "boss-service-clocks"},
    "ReportBuilder/DatasetView": {datasetId: "boss-service-clocks"},
    "ReportBuilder/Analysis": {datasetId: "boss-service-clocks"},
    "ScheduledReports/ScheduledReportDetail": {screenScheduledId: "BOSS_DEMO_MY_TASKS"},
    "ScheduledReports/ReportDelivery": {occurrenceId: "NONE"},
    "Alerts/AlertDetail": {definitionId: "boss-service-sla-breach"},
    "Flows/FlowMap": {definitionId: "insights-flowmap-supplier", stepId: "order"},
    "Flows/FlowMapEditor": {definitionId: "insights-flowmap-internal"},
    "Flows/ProcessStory": {definitionId: "insights-flowmap-customer", stepId: "order"},
    Settings: {organizationPartyId: "ORG_ZIZI_RETAIL"},
    "Settings/AnalyticsSettings": {organizationPartyId: "ORG_ZIZI_RETAIL"}
}

spec({
    setupSpec() {
        login("john.doe")
        screens = lib
            .screens(["Insights"])
            .filter(([, path]) => path !== "WallDisplay" && path !== "Records")
            .concat(
                insightsLib
                    .mountedScreens()
                    .map(([path, location]) => [
                        "Insights",
                        path,
                        /server-static="[^"]*\bqvt\b/.test(String(ec.resource.getLocationReference(location).getText()))
                    ])
            )
    }
})

feature("the full check of every Insights XML screen; each one marked server-static is clean", {
    when() {
        return {rows: lib.check(screens, (app, path) => parameters[path])}
    },
    then({rows}) {
        rows.length > 30
        rows.every(row => row.verdict !== "error")
        lib.unclean(rows) == ""
    }
})
