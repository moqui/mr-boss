// Insights' Analysis (ironstone.insights.AnalysisServices; design-insights §5 Analysis; impl-insights P6, INS-03, INS-04): an
// author builds an aggregate over an admitted dataset from typed choices (the dataset, a measure and how it is aggregated, up to
// two groups, a time grain, one filter), runs it through the report engine as themself and saves it as an ordinary library
// panel, which the framework definition editor (Insights › PanelDetail) then refines. No query language is added: the choices
// become the engine's own query, each field checked against the dataset's fields, and the engine's semantic guards
// (mr-moqui docs/tools/Monitoring.md "Semantic guards") refuse what does not mean anything: an amount across currencies until
// it is grouped by its currency or filtered to one, a ratio averaged, a balance summed across its dates, a total of a bounded
// page. A refusal is shown as its reason; nothing is computed around it. Every result is the viewer's own: the dataset's
// admission and row filter decide the rows, and the organization in scope narrows a dataset that names it.
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib

const ENGINE = "org.moqui.report.ReportServices."
const aggregates = [
    {value: "count", label: "Count of records"},
    {value: "sum", label: "Sum"},
    {value: "avg", label: "Average"},
    {value: "min", label: "Least"},
    {value: "max", label: "Greatest"},
    {value: "cardinality", label: "Distinct values"}
]
const grains = [
    {value: "day", label: "Day"},
    {value: "week", label: "Week"},
    {value: "month", label: "Month"},
    {value: "quarter", label: "Quarter"},
    {value: "year", label: "Year"}
]
const visualizations = ["table", "bar", "line", "stat"]
const guardCode = /\b(UNIT_MIXED|RATIO_AGGREGATE|NONADDITIVE|BOUNDED_RESULT|ROWS_RESTRICTED)\b/

function author() {
    const userScope = insights.required()
    if (!userScope.capabilities.author && !userScope.capabilities.datasetEdit)
        denied("INSIGHTS_AUTHOR_REQUIRED", "An analysis needs Insights authoring")
    return userScope
}
// The admitted business datasets the author reads, and the chosen one's fields with what each declares (its unit field, a
// ratio, the dimensions it is not added across).
function sources(datasetId) {
    const datasets = Array.from(insights.asViewer(ENGINE + "find#BusinessDatasets", {status: "admitted"}).datasets || [])
        .map(row => ({value: row.datasetId, label: row.title || row.datasetId, timeField: row.timeField}))
        .sort((a, b) => a.label.localeCompare(b.label))
    const chosen = datasetId ? datasets.find(row => row.value === datasetId) : null
    if (datasetId && !chosen) denied("DATASET_UNAVAILABLE", "Choose an admitted dataset you may read")
    if (!chosen) return {datasets, dataset: null, fields: []}
    const found = insights.asViewer(ENGINE + "get#Dataset", {datasetId}).dataset || {}
    const body = insights.asViewer(ENGINE + "get#Definition", {definitionId: datasetId}).definition?.body || {}
    const defaults = body.fieldDefaults || {}
    const fields = Array.from(found.fields || [])
        .filter(field => !String(field.name).startsWith("_"))
        .map(field => {
            const declared = defaults[field.name] || {}
            const notes = []
            if (declared.unitField) notes.push("in its " + declared.unitField)
            if (declared.ratio) notes.push("a ratio")
            if (declared.nonAdditive) notes.push("not added across " + Array.from(declared.nonAdditive).join(", "))
            return {
                value: field.name,
                label: (declared.displayName || field.name) + (notes.length ? " (" + notes.join("; ") + ")" : ""),
                type: field.type,
                aggregatable: field.aggregatable !== false,
                unitField: declared.unitField || null
            }
        })
        .sort((a, b) => a.value.localeCompare(b.value))
    return {
        datasets,
        dataset: Object.assign(
            {
                timeField: found.timeField || chosen.timeField,
                // the field its row filter scopes by, where it names one (the organization filter's)
                organizationField: body.rowFilterParameters?.organizationField || null
            },
            chosen
        ),
        fields
    }
}
function options(p) {
    author()
    const found = sources(p.datasetId || null)
    return {
        datasets: found.datasets,
        measureFields: found.fields.filter(field => field.type === "number"),
        groupFields: found.fields.filter(field => field.aggregatable && field.type !== "number"),
        filterFields: found.fields.filter(field => field.aggregatable),
        aggregates,
        grains,
        visualizations: visualizations.map(value => ({value, label: value.charAt(0).toUpperCase() + value.slice(1)}))
    }
}
// The engine's query of the typed choices: every field one of the dataset's own. A time grain's buckets follow the display
// zone and week start of the organization in scope where it set them (Insights Settings, P10), else the viewer's.
function queryOf(p, found, organizationPartyId) {
    const named = (value, list, what) => {
        if (!value) return null
        const field = list.find(row => row.value === value)
        if (!field) denied("FIELD_UNAVAILABLE", what + " " + value + " is not a field of this dataset")
        return field
    }
    const aggregate = p.aggregate || "count"
    if (!aggregates.some(row => row.value === aggregate)) denied("VALUE_INVALID", "Choose how the measure is aggregated")
    const measure = named(p.measureField, found.fields, "Measure")
    if (aggregate !== "count" && !measure) denied("VALUE_INVALID", "Choose the field to " + aggregate)
    if (measure && !["count", "cardinality"].includes(aggregate) && measure.type !== "number")
        denied("VALUE_INVALID", measure.value + " is not a number")
    const aggregations = []
    if (p.timeGrain) {
        if (!grains.some(row => row.value === p.timeGrain)) denied("VALUE_INVALID", "Choose a time grain")
        aggregations.push({
            id: "period",
            type: "date_histogram",
            role: "x-axis",
            params: Object.assign(
                {field: found.dataset.timeField, calendar_interval: p.timeGrain},
                organizationPartyId ? insights.calendarParameters(organizationPartyId, p.timeGrain) : {}
            )
        })
    }
    for (const value of [p.groupBy, p.groupBy2].filter(Boolean)) {
        const group = named(value, found.fields, "Group")
        if (!group.aggregatable) denied("FIELD_UNAVAILABLE", value + " cannot be grouped by")
        if (aggregations.some(aggregation => aggregation.id === value)) continue
        aggregations.push({
            id: value,
            type: "terms",
            role: aggregations.length ? "split-rows" : "x-axis",
            params: {field: value, size: 20, other_bucket: true, other_bucket_key: "Other"}
        })
    }
    if (aggregate !== "count") aggregations.push({id: "value", type: aggregate, role: "metric", params: {field: measure.value}})
    const query = {datasetId: found.dataset.value, aggregations}
    const filters = []
    const filter = named(p.filterField, found.fields, "Filter")
    if (filter && p.filterValue != null && String(p.filterValue) !== "")
        filters.push({
            query: {field: {name: filter.value, op: "eq", value: String(p.filterValue)}},
            label: filter.value + ": " + p.filterValue
        })
    if (filters.length) query.filters = filters
    return query
}
function shown(field, value) {
    if (value == null) return ""
    if (field.type === "time") {
        const millis = /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
        if (!Number.isNaN(millis)) return ec.l10n.format(new Date(millis), "yyyy-MM-dd")
    }
    return String(value)
}
// get#AnalysisResult: the choices run as the viewer. A guard's refusal is the answer's reason, with its code.
function result(p) {
    author()
    return run(p)
}
// The typed choices run as the viewer, for one whose right to ask the caller has checked (Analysis' author; Assist's reader of
// a dataset its class opens, Assist.js): the dataset an admitted one the viewer reads, every field its own, the engine's
// admission, row filter and guards as for any query.
function run(p) {
    const context = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const found = sources(p.datasetId)
    if (!found.dataset) denied("DATASET_UNAVAILABLE", "Choose an admitted dataset you may read")
    const query = queryOf(p, found, context.organizationPartyId)
    // one organization asked for by name (Assist): the dataset narrowed to it on the field its row filter scopes by, under
    // the row filter, which still decides what the viewer reads
    if (p.narrowOrganization && p.organizationPartyId && found.dataset.organizationField)
        query.filters = (query.filters || []).concat([
            {
                query: {field: {name: found.dataset.organizationField, op: "eq", value: String(p.organizationPartyId)}},
                label: "Organization: " + p.organizationPartyId
            }
        ])
    const range = {from: p.from || context.defaults.from, thru: p.thru || context.defaults.thru}
    let answer
    ec.message.pushErrors()
    try {
        answer = insights.asViewerApart(ENGINE + "run#Query", {query: Object.assign({}, query, range)})
    } catch (error) {
        const message = String(error.message || error).replace(/^.*failed: /, "")
        const code = message.match(guardCode)
        return {
            available: false,
            refusedCode: code ? code[1] : "QUERY_FAILED",
            reason: message.replace(/^[A-Z_]+: /, ""),
            query,
            rows: [],
            columns: []
        }
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    const frame = Array.from(answer.frames || [])[0] || {fields: []}
    const fields = Array.from(frame.fields || [])
    const length = Math.max(0, ...fields.map(field => Array.from(field.values || []).length))
    // the engine's flags of a bucket (the rest, a missing value) are not measures
    const flags = ["other", "missing"]
    const flagged = (name, index) => fields.find(field => field.name === name)?.values?.[index] === true
    const count = fields.find(field => field.name === "count")
    const rows = []
    for (let index = 0; index < length && rows.length < 500; index++) {
        // an empty rest is not a row
        if (flagged("other", index) && count && Number(count.values[index] || 0) === 0) continue
        rows.push({
            label: fields
                .filter(field => field.config?.bucket)
                .map(field => shown(field, field.config.bucket.labels?.[index] ?? field.values[index]))
                .join(" · "),
            valuesText: fields
                .filter(field => !field.config?.bucket && !flags.includes(field.name))
                .map(field => {
                    // an amount's unit is its row's (grouped by its unit field) or the one unit of the result
                    const unit = flagged("other", index) ? "" : field.config?.units?.[index] || field.unit || ""
                    return field.name + " " + shown(field, field.values[index]) + (unit ? " " + unit : "")
                })
                .join(", ")
        })
    }
    return {
        available: true,
        query,
        range: answer.range || range,
        columns: fields.map(field => field.name),
        rows,
        // the records the result is computed from, the engine's own count: never the number of rows shown
        sourceCount: answer.sourceCount == null ? null : Number(answer.sourceCount),
        notices: Array.from(answer.notices || [])
            .map(notice => notice.message)
            .filter(Boolean)
    }
}
// store#Analysis: the choices saved as a library panel the author owns, private or shared with one of their own groups (as
// ShareDashboard), and optionally placed on one of their own dashboards by reference. The engine checks the dataset again.
function store(p) {
    author()
    const title = String(p.title || "").trim()
    if (!title || title.length > 120) denied("VALUE_INVALID", "Name the analysis in at most 120 characters")
    const group = p.userGroupId || null
    if (group && !insights.shareGroupIds().includes(group))
        denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
    const visualization = p.visualization || "table"
    if (!visualizations.includes(visualization)) denied("VALUE_INVALID", "Choose how the analysis is shown")
    const found = sources(p.datasetId)
    if (!found.dataset) denied("DATASET_UNAVAILABLE", "Choose an admitted dataset you may read")
    const query = queryOf(
        p,
        found,
        insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null}).organizationPartyId
    )
    // refused now, as it would be on every render (an amount across currencies, a ratio averaged)
    const checked = result(p)
    if (!checked.available) denied(checked.refusedCode, checked.reason)
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    const definitionId =
        "analysis-" +
        (slug || "panel") +
        "-" +
        ec.user.userId.toLowerCase().replace(/[^a-z0-9]+/g, "") +
        "-" +
        Date.now().toString(36)
    const saved = insights.asViewer(ENGINE + "save#Definition", {
        definition: {id: definitionId, type: "panel", title, userGroupId: group, body: {title, visualization, queries: [query]}},
        note: "Saved from Analysis"
    }).definition
    let dashboardId = null
    if (p.dashboardId) {
        const dashboard = insights.asViewer(ENGINE + "get#Definition", {definitionId: p.dashboardId}).definition
        if (dashboard.type !== "dashboard" || dashboard.readOnly || dashboard.ownerId !== ec.user.userId)
            denied("DASHBOARD_NOT_OWNED", "Place the analysis on a dashboard of your own; save a copy of a shared one first")
        const body = dashboard.body || {}
        body.panels = body.panels || {}
        body.panels[saved.id] = {panelRef: saved.id}
        const layout = body.layout && Array.isArray(body.layout.items) ? body.layout : {type: "autoGrid", items: []}
        layout.items.push({panelId: saved.id})
        body.layout = layout
        insights.asViewer(ENGINE + "save#Definition", {
            definition: {
                id: dashboard.id,
                type: "dashboard",
                title: dashboard.title,
                body,
                version: dashboard.version,
                userGroupId: dashboard.userGroupId || null
            },
            note: "Added analysis " + title
        })
        dashboardId = dashboard.id
    }
    return {definitionId: saved.id, dashboardId}
}
// The author's own dashboards, for SaveAnalysis' dashboard target.
function ownDashboards() {
    author()
    return {
        dashboards: Array.from(insights.asViewer(ENGINE + "list#Definitions", {definitionType: "dashboard"}).definitions || [])
            .filter(row => !row.readOnly && row.ownerId === ec.user.userId)
            .map(row => ({value: row.id, label: row.title || row.id}))
    }
}

const operations = {options, result, store, ownDashboards}
;({
    // P10: the admitted sources and a typed query run as the viewer, for Assist.js after its own checks
    sources,
    run,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights analysis operation " + op)
        return operations[op](parameters)
    }
})
