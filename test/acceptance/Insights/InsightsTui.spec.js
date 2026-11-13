// Insights' terminal sweep (impl-insights P12; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance):
// every Insights screen, its own files, the framework's report screens it mounts by location (InsightsSpecLib.mountedScreens)
// and the shared record screens its Records area mounts (read only, each as its Insights
// context), renders in the tui render mode as a document of the TUI model (v 1) with no error node, on the demo's records, as
// john.doe (ADMIN, who holds every INSIGHTS_* permission) with artifact authorization on. TuiRender no longer sweeps Insights.
// WallDisplay is left to its own specs (the regression InsightsWallDisplay and the acceptance InsightsWallDisplayUsable): it is
// a device's bare page, not a screen of the shell, and has no terminal twin. Each screen's own render checks are the phases'
// regression specs.
// Run: ./moq accept mr-boss --spec InsightsTui
const root = "component://mr-boss/screen/Insights.xml"
const insightsLib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
let screens
// the sweep's renders of the twins the second feature reads, so no screen is rendered twice in tui
const twins = ["Flows/FlowMap", "Alerts/AlertDetail", "Settings"]
const kept = {}

// the id parameters of the screens that open on one demo record (as AppStructure's demoRecords)
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
    "Settings/AnalyticsSettings": {organizationPartyId: "ORG_ZIZI_RETAIL"},
    // the record mounts (impl-insights P6), each on a demo record; the tabbed ones by their InsightsRecord subscreen, as
    // Insights' links name them
    "Records/OrderDetail": {orderId: "BOSS_CS_SO_DELIVERED"},
    "Records/Customer360/InsightsRecord": {customerPartyId: "JoeDist"},
    "Records/Supplier360/InsightsRecord": {vendorPartyId: "BOSS_PRD_SUPPLIER"},
    "Records/Product360/InsightsRecord": {productId: "BOSS_PRD_OWN"},
    "Records/RequestDetail": {requestId: "BOSS_DEMO_REQUEST"},
    "Records/WorkItemDetail": {workEffortId: "BOSS_DEMO_TASK_PLAN"},
    "Records/ShipmentDetail": {shipmentId: "BOSS_ACCT_NO_SHIPMENT"},
    "Records/FacilityDetail/InsightsRecord": {facilityId: "ZIRET_WH"},
    "Records/EquipmentDetail": {assetId: "BOSS_ACCT_FA_VAN"},
    "Records/InvoiceDetail": {invoiceId: "BOSS_ACCT_INVOICE"}
}

// the paths under the Insights root of its own screen files (not WallDisplay, not Records itself, whose record screens are
// the mounts above), then the framework's report screens mounted by location and the record mounts
function sweepScreens() {
    const files = []
    ec.resource.getLocationReference(root).walkChildTree(files, null)
    const paths = files
        .filter(file => file.path !== "Insights" && file.location.endsWith(".xml"))
        .map(file => file.path.substring("Insights/".length))
        .filter(path => path !== "WallDisplay" && path !== "Records")
    return paths
        .concat(insightsLib.mountedScreens().map(([path]) => path))
        .concat(Object.keys(parameters).filter(path => path.startsWith("Records/")))
}
// the error nodes of a TUI document and the texts it shows, walking its nodes (TuiRender's walk)
function walk(nodes, errors, texts) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        for (const key of ["text", "title", "value"]) if (typeof node[key] === "string") texts.push(node[key])
        if (node.t === "formList")
            for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors, texts)
        walk(node.c, errors, texts)
    }
}
function cellWalk(cell, errors, texts) {
    if (typeof cell === "string") texts.push(cell)
    else if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors, texts)
    else if (cell) walk([cell], errors, texts)
}
function tui(path, values) {
    const rendered = ec.screen
        .makeTest()
        .rootScreen(root)
        .renderMode("tui")
        .render(path, Object.assign({lastStandalone: "-2"}, values || {}), null)
    let doc = null
    try {
        doc = JSON.parse(rendered.output)
    } catch (error) {
        doc = null
    }
    const nodeErrors = [],
        texts = []
    if (doc) walk(doc.c, nodeErrors, texts)
    const errors = Array.from(rendered.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: rendered.status, errors, doc, nodeErrors, texts, output: String(rendered.output || "")}
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        screens = sweepScreens()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Insights screen and record mount renders in tui as a model document with no error node, on the demo's records", {
    when() {
        const failures = []
        for (const path of screens) {
            const got = tui(path, parameters[path])
            if (twins.includes(path)) kept[path] = got
            if (got.status != 200 || got.errors) failures.push(`${path}: status ${got.status}, ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) failures.push(`${path}: not a TUI document: ${got.output.substring(0, 160)}`)
            else if (got.nodeErrors.length) failures.push(`${path}: ${got.nodeErrors.join(" | ")}`)
        }
        if (failures.length) log.warn(`Insights TUI failures:\n${failures.join("\n")}`)
        return {failures, count: screens.length}
    },
    then({failures, count}) {
        count > 40
        failures.join("\n") == ""
    }
})

// the twins show their data: a flow map's lanes and steps, the alert list's heading and template, the organization's settings
// (read from the sweep's renders above)
feature("the twins show the demo's data: the supplier flow's steps, the shipped alert rule, Retail's settings", {
    when() {
        const none = {nodeErrors: ["not rendered by the sweep"], output: ""}
        return {
            flow: kept["Flows/FlowMap"] || none,
            alert: kept["Alerts/AlertDetail"] || none,
            settings: kept.Settings || none
        }
    },
    then({flow, alert, settings}) {
        flow.nodeErrors.length == 0
        flow.output.includes("Raise the order")
        flow.output.includes("Steps in order")
        alert.nodeErrors.length == 0
        alert.output.includes("Service level breaches")
        settings.nodeErrors.length == 0
        settings.output.includes("Scope and delivery")
    }
})
