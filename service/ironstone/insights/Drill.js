// Insights' drill (ironstone.insights.DrillServices; design-insights §4 Drill; impl-insights P6, INS-04): from a value of a saved
// panel to its meaning, a breakdown and the records behind it. The request names the definition, the panel, one of its queries
// and the buckets chosen, as the panel showed them; the report engine's get#Drill (mr-moqui docs/tools/Monitoring.md "Drill")
// reads the saved panel again as the viewer and computes every predicate itself, so nothing here or in the request is a query,
// an entity or a service. Insights adds its fixed scope (the organization in scope, as Insights › Dashboard fixes it: a request's
// variable never replaces it), the measure's meaning (the owner's registration) and, for each record, the Insights record screen
// that shows it read only (design §10). A record's columns are the query's own time, groups and measured fields, never the
// whole document. A viewer who reads the totals and not the records is told so and gets no record.
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib

const ENGINE = "org.moqui.report.ReportServices."
// The Insights record screen of a dataset document's record (design §10), by the document: the screen under Insights/Records
// and the document field that holds the record's key.
const recordScreens = {
    MantleSalesOrderPart: {screen: "OrderDetail", parameter: "orderId", field: "orderId"},
    MantleSalesOrderItem: {screen: "OrderDetail", parameter: "orderId", field: "orderId"},
    MantleInventoryAsset: {screen: "Product360", parameter: "productId", field: "productId"},
    BossServiceClock: {screen: "RequestDetail", parameter: "requestId", field: "requestId"}
}
const refusalText = /not authorized|may not read|is not admitted|does not exist|not available/i
// Costs and margins stay on the server (impl-insights §2 "Restricted values"; the P6 review, F-P6-9): a record's cost or margin
// is not a drill column and not a breakdown dimension unless the viewer reads product costs (PRODUCT_COST_VIEW), whatever
// the saved query measures. An admitted dataset has no field classes yet (F58), so the fields are known by their names.
const restrictedField = name => /cost|margin/i.test(String(name || ""))

function text(value) {
    if (value == null) return ""
    if (Array.isArray(value)) return value.map(text).join(", ")
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
}
// A value of a frame as the panel shows it: a time as a date and time in the user's zone, else its text.
function shown(field, value) {
    if (value == null) return ""
    if (field.type === "time" || field.kind === "time") {
        const millis = /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
        if (!Number.isNaN(millis)) return ec.l10n.format(new Date(millis), "yyyy-MM-dd HH:mm")
    }
    return text(value)
}
// The request's buckets: a list of {field, value}, also as the JSON text a link carries (bucketsJson).
function buckets(p) {
    let given = Array.from(p.selectedBuckets || [])
    if (p.bucketsJson) {
        try {
            const parsed = JSON.parse(String(p.bucketsJson))
            if (Array.isArray(parsed)) given = given.concat(parsed)
        } catch (error) {
            denied("VALUE_INVALID", "The chosen buckets are not readable")
        }
    }
    return given
        .filter(item => item && typeof item === "object")
        .map(item => ({field: String(item.field || ""), value: item.value == null ? null : item.value}))
}
function variablesOf(p) {
    if (p.variables && typeof p.variables === "object") return Object.assign({}, p.variables)
    if (!p.variablesJson) return {}
    try {
        const parsed = JSON.parse(String(p.variablesJson))
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
    } catch (error) {
        return {}
    }
}
// The rows of a breakdown or of the panel itself as a list: one row a bucket, its group values, its measures and, for a group,
// the bucket to choose.
function frameRows(frames, groupOnly) {
    const out = []
    for (const frame of Array.from(frames || [])) {
        const fields = Array.from(frame.fields || [])
        const groups = fields.filter(field => field.config?.bucket)
        if (groupOnly && !groups.length) continue
        const length = Math.max(0, ...fields.map(field => Array.from(field.values || []).length))
        for (let index = 0; index < length && out.length < 200; index++) {
            const group = groups[0]
            const label = group ? text(group.config.bucket.labels?.[index] ?? group.values[index]) : ""
            out.push({
                groupField: group?.name || "",
                groupValue: group ? text(group.values[index] ?? label) : "",
                label: groups.map(field => shown(field, field.config.bucket.labels?.[index] ?? field.values[index])).join(" · "),
                valuesText: fields
                    .filter(field => !field.config?.bucket && !["other", "missing"].includes(field.name))
                    .map(field => field.name + " " + shown(field, field.values[index]) + (field.unit ? " " + field.unit : ""))
                    .join(", ")
            })
        }
    }
    return out
}

function drill(p) {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "A drill needs Insights read")
    const found = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const selected = buckets(p)
    const readsCosts = ec.user.hasPermission("PRODUCT_COST_VIEW")
    const permitted = name => readsCosts || !restrictedField(name)
    const unavailable = reason => ({
        available: false,
        reason,
        selected: [],
        dimensions: [],
        breakdown: [],
        panelBuckets: [],
        rows: [],
        columns: [],
        carry: {definitionId: p.definitionId}
    })
    if (p.breakdownDimension && !permitted(p.breakdownDimension))
        return unavailable("A breakdown by " + p.breakdownDimension + " is not available to you")
    let definition
    let answer
    ec.message.pushErrors()
    try {
        definition = insights.asViewerApart(ENGINE + "get#Definition", {definitionId: p.definitionId}).definition
        // the organization in scope over whatever the request carries, as the dashboard fixes it
        const variables = Object.assign(variablesOf(p), insights.scopeVariables(found, definition))
        answer = insights.asViewerApart(ENGINE + "get#Drill", {
            definitionId: p.definitionId,
            panelId: p.panelId || null,
            queryReference: p.queryReference == null || p.queryReference === "" ? null : String(p.queryReference),
            range: {from: p.from || found.defaults.from, thru: p.thru || found.defaults.thru},
            variables,
            selectedBuckets: selected,
            breakdownDimension: p.breakdownDimension || null,
            pageIndex: p.pageIndex ? Number(p.pageIndex) : 0,
            pageSize: 20
        })
    } catch (error) {
        const message = String(error.message || error)
        // a definition or dataset the viewer may not read answers alike, whether or not it exists
        if (refusalText.test(message)) return unavailable("This value is not available to you")
        return unavailable(message.replace(/^.*failed: /, ""))
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    if (!answer.available)
        return Object.assign(unavailable(answer.reason || "This value is not available"), {title: answer.title})
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
    const columns = Array.from(answer.columns || []).filter(permitted)
    // what a link back to this drill carries: the request as it was, which the drill checks again when it is opened
    const carry = {definitionId: p.definitionId}
    for (const name of [
        "panelId",
        "queryReference",
        "organizationPartyId",
        "from",
        "thru",
        "variablesJson",
        "breakdownDimension"
    ])
        if (p[name] != null && String(p[name]) !== "") carry[name] = String(p[name])
    if (selected.length) carry.bucketsJson = JSON.stringify(selected)
    const withBucket = (field, value) =>
        Object.assign({}, carry, {bucketsJson: JSON.stringify(selected.concat([{field, value}])), breakdownDimension: ""})
    const rows = Array.from(answer.rows || []).map(row => {
        const body = row.body || {}
        const record = recordScreens[row.documentId]
        const key = record ? body[record.field] : null
        return {
            id: row.id,
            title: row.title || row.id,
            valuesText: columns
                .map(column => column + " " + shown({type: /date|time/i.test(column) ? "time" : ""}, body[column]))
                .join(", "),
            recordScreen: record && key ? record.screen : "",
            // the record's key, and this drill to return to
            recordParameters: record && key ? Object.assign({}, carry, {[record.parameter]: String(key)}) : null
        }
    })
    const pageSize = Number(answer.pageSize || 20)
    const total = Number(answer.total || 0)
    return {
        available: true,
        title: answer.title || definition.title,
        definitionType: definition.type,
        datasetId: answer.datasetId,
        range: answer.range,
        organizationPartyId: found.organizationPartyId,
        meaning,
        selected: Array.from(answer.selected || []),
        dimensions: Array.from(answer.dimensions || [])
            .filter(permitted)
            .map(name => ({value: name, label: name})),
        // the panel's own buckets to choose from (no breakdown asked), and the breakdown's
        panelBuckets: selected.length
            ? []
            : frameRows(answer.panelFrames, true).map(row =>
                  Object.assign(row, {chooseParameters: withBucket(row.groupField, row.groupValue)})
              ),
        breakdownDimension: answer.breakdown?.dimension || null,
        breakdownRefused: answer.breakdown?.refused || null,
        breakdown: frameRows(answer.breakdown?.frames, false),
        // the panel's own result as the engine answered it, for a module that presents it itself (Assist.js, which checks
        // the dataset's class and leaves restricted measures out); not an out-parameter of get#Drill
        panelFrames: selected.length ? [] : Array.from(answer.panelFrames || []),
        rowsAvailable: !!answer.rowsAvailable,
        rowsReason: answer.rowsAvailable ? null : "You may read this total, not the records behind it.",
        columns,
        rows,
        total,
        bounded: !!answer.bounded,
        pageIndex: Number(answer.pageIndex || 0),
        pageMaxIndex: Math.max(0, Math.ceil(total / pageSize) - 1),
        carry,
        clearParameters: Object.assign({}, carry, {bucketsJson: "", breakdownDimension: ""}),
        previousParameters: Object.assign({}, carry, {pageIndex: Math.max(0, Number(answer.pageIndex || 0) - 1)}),
        nextParameters: Object.assign({}, carry, {pageIndex: Number(answer.pageIndex || 0) + 1})
    }
}

const operations = {drill}
;({
    recordScreens,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights drill operation " + op)
        return operations[op](parameters)
    }
})
