// Maintenance's terminal sweep (impl-maintenance P20; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance):
// every Maintenance screen file under its root, the shared screens it mounts (MaintenanceSpecLib.mountedScreens: Chatter and
// RecordFiles, EquipmentDetail, Product360, Employee360, FacilityDetail, RequestDetail, WorkItemDetail, MaterialIssueReceipt,
// InventoryAvailability, OrderDetail and the equipment import's DataImport) and each tab of a mount that Maintenance's menu shows,
// renders in the tui render mode as a document of the TUI model (v 1) with no error node, on the demo's records
// (MaintenanceSpecLib.sweepParameters; the intervention report on MaintenanceSpecLib.customerRepair's repair), as john.doe (ADMIN, who holds every MAINTENANCE_* permission) with artifact authorization
// on. TuiRender does not sweep Maintenance. Each screen's own render checks are the phases' regression specs; the server-static
// sweep is MaintenanceServerStatic.
// Run: ./moq accept mr-boss --spec MaintenanceTui
const root = "component://mr-boss/screen/Maintenance.xml"
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
let screens, repair

// the paths under the Maintenance root of its own screen files, then the shared mounts and the tabs of each its menu shows
function sweepScreens() {
    const files = []
    ec.resource.getLocationReference(root).walkChildTree(files, null)
    const own = files
        .filter(file => file.path !== "Maintenance" && file.location.endsWith(".xml"))
        .map(file => file.path.substring("Maintenance/".length))
    const mounts = []
    for (const [path] of lib.mountedScreens()) {
        mounts.push(path)
        for (const tab of lib.mountTabs(path, lib.sweepParameters(path))) if (!mounts.includes(tab)) mounts.push(tab)
    }
    return own.concat(mounts.filter(path => !own.includes(path)))
}
// the error nodes of a TUI document, walking its nodes (TuiRender's walk)
function walk(nodes, errors) {
    for (const node of nodes || []) {
        if (!node || typeof node !== "object") continue
        if (node.t === "error") errors.push(node.text || node.message || JSON.stringify(node).substring(0, 200))
        if (node.t === "formList") for (const row of node.rows || []) for (const cell of row.cells || []) cellWalk(cell, errors)
        walk(node.c, errors)
    }
}
function cellWalk(cell, errors) {
    if (Array.isArray(cell)) for (const part of cell) cellWalk(part, errors)
    else if (cell && typeof cell === "object") walk([cell], errors)
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
    const nodeErrors = []
    if (doc) walk(doc.c, nodeErrors)
    const errors = Array.from(rendered.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: rendered.status, errors, doc, nodeErrors, output: String(rendered.output || "")}
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        // P12's intervention report opens on a customer repair, which no demo record is
        repair = lib.customerRepair("SWEEP")
        screens = sweepScreens()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Maintenance screen, shared mount and mounted tab renders in tui as a model document with no error node", {
    when() {
        const failures = []
        for (const path of screens) {
            const got = tui(path, lib.sweepParameters(path, repair))
            if (got.status != 200 || got.errors) failures.push(`${path}: status ${got.status}, ${got.errors}`)
            else if (!got.doc || got.doc.v != 1) failures.push(`${path}: not a TUI document: ${got.output.substring(0, 160)}`)
            else if (got.nodeErrors.length) failures.push(`${path}: ${got.nodeErrors.join(" | ")}`)
        }
        if (failures.length) log.warn(`Maintenance TUI failures:\n${failures.join("\n")}`)
        return {failures, screens}
    },
    then({failures, screens}) {
        // 60 screen files under the root and the shared mounts with their tabs
        screens.length > 75
        screens.includes("WorkOrders/WorkOrderDetail/Procedure")
        screens.includes("Equipment/EquipmentDetail")
        screens.includes("Equipment/EquipmentDetail/Meters")
        screens.includes("Facilities/FacilityDetail")
        screens.includes("Requests/RequestDetail")
        screens.includes("Chatter")
        screens.includes("WorkOrders/InterventionReport")
        screens.includes("Settings/Teams")
        !!repair.workEffortId
        failures.join("\n") == ""
    }
})
