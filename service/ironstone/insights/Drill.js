// Insights' drill (ironstone.insights.DrillServices; design-insights §4 Drill; impl-insights P6, INS-04): from a value of a saved
// panel to its meaning, a breakdown and the records behind it. The request names the definition, the panel, one of its queries
// and the buckets chosen, as the panel showed them; the report engine's get#Drill (mr-moqui docs/tools/Monitoring.md "Drill")
// reads the saved panel again as the viewer and computes every predicate itself, so nothing here or in the request is a query,
// an entity or a service. The page itself is the framework's (mr-moqui tools/template/ReportDrill.js view, which asks the
// engine as the viewer and presents its answer: the buckets, the breakdown, the records' rows and the links' parameters);
// what is here is Insights' own, given to it as options and decided here, never by a request: its fixed scope (the
// organization in scope, as Insights › Dashboard fixes it: a request's variable never replaces it), its default range, the
// cost filter, the measure's meaning (the owner's registration) and, for each record, the Insights record screen that shows
// it read only (design §10). A record's columns are the query's own time, groups and measured fields, never the whole
// document. A viewer who reads the totals and not the records is told so and gets no record.
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib
const generic = ec.resource.script("component://tools/template/ReportDrill.js")

const ENGINE = "org.moqui.report.ReportServices."
// The Insights record screen of a dataset document's record (design §10), by the document: the screen under Insights/Records
// and the document field that holds the record's key.
const recordScreens = {
    MantleSalesOrderPart: {screen: "OrderDetail", parameter: "orderId", field: "orderId"},
    MantleSalesOrderItem: {screen: "OrderDetail", parameter: "orderId", field: "orderId"},
    MantleInventoryAsset: {screen: "Product360", parameter: "productId", field: "productId"},
    BossServiceClock: {screen: "RequestDetail", parameter: "requestId", field: "requestId"}
}
// Costs and margins stay on the server (impl-insights §2 "Restricted values"; the P6 review, F-P6-9): a record's cost or margin
// is not a drill column and not a breakdown dimension unless the viewer reads product costs (PRODUCT_COST_VIEW), whatever
// the saved query measures. An admitted dataset has no field classes yet (F58), so the fields are known by their names.
const restrictedField = name => /cost|margin/i.test(String(name || ""))

function drill(p) {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "A drill needs Insights read")
    const found = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const readsCosts = ec.user.hasPermission("PRODUCT_COST_VIEW")
    // the definition as the viewer, for the scope its variables are fixed to: one they may not read answers as one that does
    // not exist (the framework's page says so)
    let definition = null
    ec.message.pushErrors()
    try {
        definition = insights.asViewerApart(ENGINE + "get#Definition", {definitionId: p.definitionId}).definition
    } catch (error) {
        ec.logger.info("Drill definition " + p.definitionId + " not read: " + String(error.message || error))
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    const page = generic.view(p, {
        definition,
        // the organization in scope over whatever the request carries, as the dashboard fixes it
        fixedVariables: definition ? insights.scopeVariables(found, definition) : {},
        range: {from: found.defaults.from, thru: found.defaults.thru},
        permitted: name => readsCosts || !restrictedField(name),
        carry: ["organizationPartyId"],
        // the record's Insights screen (its key, and this drill to return to)
        row: (source, row, carry) => {
            const record = recordScreens[source.documentId]
            const key = record ? (source.body || {})[record.field] : null
            if (!record || !key) return row
            return Object.assign(row, {
                recordScreen: record.screen,
                recordUrl: found.sharedLinks["Records/" + record.screen],
                recordParameters: Object.assign({}, carry, {[record.parameter]: String(key)})
            })
        }
    })
    if (!page.available) return page
    // DrillMeaning: the owner's registration of the panel's measure, when it names one
    let meaning = null
    ec.message.pushErrors()
    try {
        const metric = ec.service
            .sync()
            .name("ironstone.insights.RegistryServices.get#Metric")
            .parameters({definitionId: p.definitionId, panelId: definition.type === "dashboard" ? p.panelId : null})
            .requireNewTransaction(true)
            .call()
        if (!ec.message.hasError() && metric?.available)
            meaning = Object.assign({rules: Array.from(metric.rules || [])}, metric.metric)
    } catch (error) {
        ec.logger.info("Drill meaning of " + p.definitionId + " not read: " + String(error.message || error))
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    return Object.assign(page, {organizationPartyId: found.organizationPartyId, meaning})
}

const operations = {drill}
;({
    recordScreens,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights drill operation " + op)
        return operations[op](parameters)
    }
})
