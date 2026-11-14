// Sales' terminal sweep (impl-sales P20; style-guide §4.8, §8.1; AGENTS.md: one sweep per app per mode, in acceptance): every Sales
// screen file under its root, the shared screens its files mount (SalesSpecLib.mountedScreens: Chatter and RecordFiles,
// Customer360, WorkItemDetail, the opportunity import's DataImport, RequestDetail as QuoteRequestDetail, OrderDetail,
// OrderChangeDetail, ShipmentDetail, InvoiceDetail, Product360, InventoryAvailability, PriceExplain, AgreementDetail, Prices,
// PriceLists, PriceListDetail and Subscriptions) and each tab of a mount that Sales' menu shows, renders in the tui render mode as a
// document of the TUI model (v 1) with no error node, on the demo's records (SalesSpecLib.sweepParameters: a lead and an
// opportunity, an account and a contact, a quote, an RFQ, a template, an agreement; the order, its change, a shipment, an invoice
// and a recurring base, which the demo has none of, made by SalesSpecLib.sweepOrders), and OrderDetail again on the demo quote, the
// storeless seller's quote and the recurring base and OpportunityDetail on a lead (SalesSpecLib.sweepExtras), as john.doe (ADMIN,
// who holds every SALES_* permission in every organization) with artifact authorization on. Commons' Notifications under
// Quotes/Approvals is Commons'. TuiRender does not sweep Sales. Each screen's own render checks are the phases' regression specs;
// the server-static sweep is SalesServerStatic.
// Run: ./moq accept mr-boss --spec SalesTui
const root = "component://mr-boss/screen/Sales.xml"
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
let screens, made

// the paths under the Sales root of its own screen files, then the shared mounts and the tabs of each its menu shows
function sweepScreens() {
    const files = []
    ec.resource.getLocationReference(root).walkChildTree(files, null)
    const own = files
        .filter(file => file.path !== "Sales" && file.location.endsWith(".xml"))
        .map(file => file.path.substring("Sales/".length))
    const mounts = []
    for (const [path] of lib.mountedScreens()) {
        if (!mounts.includes(path)) mounts.push(path)
        for (const tab of lib.mountTabs(path, lib.sweepParameters(path, made))) if (!mounts.includes(tab)) mounts.push(tab)
    }
    return own.concat(mounts.filter(path => !own.includes(path)))
}
// the error nodes of a TUI document, walking its nodes and a form list's cells (TuiRender's walk)
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
// a render's failure line, or null when it is a TUI document with no error node
function failure(label, got) {
    if (got.status != 200 || got.errors) return `${label}: status ${got.status}, ${got.errors}`
    if (!got.doc || got.doc.v != 1) return `${label}: not a TUI document: ${got.output.substring(0, 160)}`
    if (got.nodeErrors.length) return `${label}: ${got.nodeErrors.join(" | ")}`
    return null
}

spec({
    setupSpec() {
        login("john.doe")
        // the order, its change, a shipment, an invoice and a recurring base: no demo record is one
        made = lib.sweepOrders()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        screens = sweepScreens()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("every Sales screen, shared mount and mounted tab renders in tui as a model document with no error node", {
    when() {
        const failures = []
        for (const path of screens) {
            const line = failure(path, tui(path, lib.sweepParameters(path, made)))
            if (line) failures.push(line)
        }
        for (const [path, parameters] of lib.sweepExtras(made)) {
            const line = failure(`${path} ${JSON.stringify(parameters)}`, tui(path, parameters))
            if (line) failures.push(line)
        }
        if (failures.length) log.warn(`Sales TUI failures:\n${failures.join("\n")}`)
        return {failures, screens}
    },
    then({failures, screens}) {
        // 55 screen files under the root, 18 shared mounts and the 50 tabs of Customer360, Product360 and InventoryAvailability
        screens.length > 110
        screens.includes("Pipeline/OpportunityDetail")
        screens.includes("Pipeline/WorkItemDetail")
        screens.includes("Pipeline/OpportunityImport/Index")
        screens.includes("Accounts/Customer360")
        screens.includes("Quotes/QuoteRequestDetail")
        screens.includes("Orders/OrderDetail")
        screens.includes("Orders/OrderChangeDetail")
        screens.includes("Orders/ShipmentDetail")
        screens.includes("Orders/InvoiceDetail")
        screens.includes("Products/Product360")
        screens.includes("Agreements/AgreementDetail")
        screens.includes("Agreements/PriceLists/PriceListDetail")
        screens.includes("Agreements/Subscriptions")
        screens.includes("Products/Product360/Prices")
        screens.includes("Accounts/Customer360/SalesOverview")
        screens.includes("Chatter")
        screens.includes("Settings/ApprovalPolicies")
        !!made.orderId && !!made.requestId && !!made.shipmentId && !!made.invoiceId && !!made.baseOrderId
        failures.join("\n") == ""
    }
})
