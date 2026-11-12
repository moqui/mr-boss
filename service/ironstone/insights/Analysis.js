// Insights' Analysis (ironstone.insights.AnalysisServices; design-insights §5 Analysis; impl-insights P6, INS-03, INS-04): an
// author builds an aggregate over an admitted dataset from typed choices (the dataset, a measure and how it is aggregated, up to
// two groups, a time grain, one filter), runs it through the report engine as themself and saves it as an ordinary library
// panel, which the framework definition editor (Insights › PanelDetail) then refines. No query language is added: the choices
// become the engine's own query, each field checked against the dataset's fields, and the engine's semantic guards
// (mr-moqui docs/tools/Monitoring.md "Semantic guards") refuse what does not mean anything: an amount across currencies until
// it is grouped by its currency or filtered to one, a ratio averaged, a balance summed across its dates, a total of a bounded
// page. A refusal is shown as its reason; nothing is computed around it. Every result is the viewer's own: the dataset's
// admission and row filter decide the rows, and the organization in scope narrows a dataset that names it.
// The choices' lists, a dataset's fields as choices, the engine's query of the choices and a result's rows are the
// framework's (mr-moqui tools/template/ReportAnalysis.js, which Tools' own Analysis screen is built on). What is here is
// Insights' own: who may build one (an author or a steward), which datasets are offered (the admitted business datasets),
// the calendar of the organization in scope for a time grain's buckets, the narrowing to one organization (Assist), the
// reason codes of its refusals and the save.
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {denied} = lib

const ENGINE = "org.moqui.report.ReportServices."
const generic = ec.resource.script("component://tools/template/ReportAnalysis.js")
const {visualizations} = generic

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
    const fields = generic.fieldsOf(found.fields, body.fieldDefaults)
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
    return generic.choicesOf(sources(p.datasetId || null))
}
// The engine's query of the typed choices (the framework's queryOf, with Insights' reason codes): every field one of the
// dataset's own. A time grain's buckets follow the display zone and week start of the organization in scope where it set
// them (Insights Settings, P10), else the viewer's.
function queryOf(p, found, organizationPartyId) {
    return generic.queryOf(p, found, organizationPartyId ? insights.calendarParameters(organizationPartyId, p.timeGrain) : {}, denied)
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
        // a guard's refusal is the answer, with its code
        return generic.refusedOf(String(error.message || error), query)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    // the rows, the engine's own count of the records they are computed from and its notices
    return generic.resultOf(answer, query, range)
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
    const definitionId = generic.panelId(title)
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
