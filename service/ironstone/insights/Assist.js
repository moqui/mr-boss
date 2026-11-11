// Insights for Assist and MCP (ironstone.insights.AssistServices; impl-insights P10; design-insights §1.2 "Assist and MCP
// analytics", INS-10; design-crosscut §1.5 CX-ASSIST): the tools behind the insights-analyst skill. Each runs as the signed-in
// user, so a tool never reads more than the user's own screens do, and each is a read: the framework runs it under its read
// fence.
//
// A number already on a dashboard is asked of its saved panel, by the dashboard's definition and the panel's id, never a
// query: Drill.js runs the panel as the dashboard does (the engine's get#Drill: the saved variables, the organization in
// scope, each dataset's admission and row filter) and the panel's own result is the answer, with its registered meaning. So
// "orders last month" is the dashboard's number, exclusions included.
//
// Any other question about a number is a typed query, the same choices Insights › Analysis offers (a dataset, a measure and how it
// is aggregated, up to two groups, a time grain, one filter, a range), never a query language, a service, an index or an
// entity. Analysis.js turns the choices into the report engine's own query with every field checked against the dataset, and
// the engine runs it as the viewer: the dataset must be admitted and theirs to read, its row filter decides the rows (another
// organization's are never in the result, whatever the request names), and its semantic guards refuse a total that means
// nothing (an amount across currencies). So the answer is the dashboard's: the same engine, dataset, scope and guards.
//
// What may be asked at all is decided by the dataset's class (ironstone.insights.DatasetClass, each owner's seed row):
// - business operations: Assist and MCP; a field that names a cost or a margin is left out of the choices and refused as a
//   measure, group or filter, and a saved panel that reads one is refused, for an MCP client always and for Assist unless
//   the viewer holds PRODUCT_COST_VIEW;
// - costs and margins: Assist only, for a viewer who holds PRODUCT_COST_VIEW; never an MCP client (design §1.2: "an MCP tool
//   never reads a cost or People dataset");
// - People and payroll: neither;
// - no class: neither, as if the dataset were not there (a steward's new dataset is closed until its owner classes it).
// The two surfaces are two services over the one function, since a tool exposure is offered to Assist or to MCP by its row
// (exposeAssistant, exposeMcp) and a service cannot tell which called it: find#QuerySources, run#DatasetQuery and
// run#PanelQuery are Assist's, find#OperationsSources, run#OperationsQuery and run#OperationsPanel MCP's. The report engine's
// own run#Query is not exposed as a tool.
//
// "Add to my dashboard" (the root's response-action, AddToDashboard): an answer's query, as the Panel line the skill has
// Assist end a number with, is saved through Analysis' own checked service (store#Analysis: an author's library panel,
// placed on a dashboard of their own), so it needs Insights authoring and writes nothing a reader could not write there.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const analysis = ec.resource.script("component://mr-boss/service/ironstone/insights/Analysis.js")
const drill = ec.resource.script("component://mr-boss/service/ironstone/insights/Drill.js")
const {one, rows, denied, reasonCode} = lib

const ENGINE = "org.moqui.report.ReportServices."
const CLASS = "ironstone.insights.DatasetClass"
const OPERATIONS = "InsDcOperations"
const COST = "InsDcCost"
// a cost or margin field by its name, as Drill.js reads one (impl-insights F83): a dataset has no field classes yet (F58)
const restrictedField = /cost|margin/i
// the typed choices, the only names read from a request or an answer's Panel line
const choiceNames = [
    "datasetId",
    "aggregate",
    "measureField",
    "groupBy",
    "groupBy2",
    "timeGrain",
    "filterField",
    "filterValue",
    "from",
    "thru",
    "organizationPartyId"
]
const fieldChoices = ["measureField", "groupBy", "groupBy2", "filterField"]
const text = value => String(value ?? "").trim()

function reader() {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Insights read is required")
    return userScope
}
// Whether the surface reads costs for this viewer: Assist as the user with PRODUCT_COST_VIEW, an MCP client never.
const readsCosts = surface => surface === "assist" && lib.access.has("PRODUCT_COST_VIEW")
// The dataset's class for the surface, refused where the class closes it. A dataset without a class answers as one that is
// not there, so an id learns nothing.
function classed(datasetId, surface) {
    const registered = datasetId ? one(CLASS, {datasetId}) : null
    if (!registered || registered.disabled === "Y" || ![OPERATIONS, COST].includes(registered.classEnumId))
        denied("DATASET_UNAVAILABLE", "Choose an admitted dataset you may read")
    if (registered.classEnumId === COST && !readsCosts(surface))
        denied(
            "DATASET_RESTRICTED",
            surface === "mcp"
                ? "This dataset holds costs and margins, which are not read over MCP"
                : "This dataset holds costs and margins; reading it needs PRODUCT_COST_VIEW"
        )
    return registered
}
const open = (field, surface) => readsCosts(surface) || !restrictedField.test(String(field))

// ===== the sources =====
// find#QuerySources, find#OperationsSources: the admitted datasets the viewer reads that the surface may ask, each with its
// class and domain owner; with a datasetId, its measures, groups and filters as Analysis offers them, a restricted field left
// out. Nothing is run.
function sources(p, surface) {
    reader()
    const classes = Object.fromEntries(
        rows(CLASS, {})
            .filter(row => row.disabled !== "Y")
            .map(row => [row.datasetId, row])
    )
    const usable = row =>
        classes[row.value] &&
        (classes[row.value].classEnumId === OPERATIONS || (classes[row.value].classEnumId === COST && readsCosts(surface)))
    const datasetId = text(p.datasetId) || null
    if (datasetId) classed(datasetId, surface)
    const found = analysis.sources(datasetId)
    const fields = found.fields.filter(field => open(field.value, surface))
    const named = list => list.map(field => ({name: field.value, label: field.label, type: field.type}))
    return {
        datasets: found.datasets.filter(usable).map(row => ({
            datasetId: row.value,
            title: row.label,
            timeField: row.timeField || null,
            domainOwner: classes[row.value].domainOwner || "",
            costs: classes[row.value].classEnumId === COST
        })),
        dataset: found.dataset
            ? {datasetId: found.dataset.value, title: found.dataset.label, timeField: found.dataset.timeField}
            : null,
        measureFields: named(fields.filter(field => field.type === "number")),
        groupFields: named(fields.filter(field => field.aggregatable && field.type !== "number")),
        filterFields: named(fields.filter(field => field.aggregatable)),
        aggregates: ["count", "sum", "avg", "min", "max", "cardinality"],
        timeGrains: ["day", "week", "month", "quarter", "year"]
    }
}

// ===== the query =====
// run#DatasetQuery, run#OperationsQuery: the typed choices run as the viewer. A refusal the asker can act on (the dataset's
// class, a restricted field, a guard) is the answer, with its code; nothing is computed around it.
function query(p, surface) {
    reader()
    const choices = Object.fromEntries(choiceNames.filter(name => text(p[name]) !== "").map(name => [name, text(p[name])]))
    const refused = (refusedCode, reason) => ({available: false, refusedCode, reason, rows: [], columns: [], notices: []})
    try {
        classed(choices.datasetId, surface)
        const restricted = fieldChoices.map(name => choices[name]).find(field => field && !open(field, surface))
        if (restricted) denied("FIELD_RESTRICTED", restricted + " is a cost or margin field, which is not read here")
    } catch (error) {
        const code = reasonCode(error)
        if (!code) throw error
        return refused(code, String(error.message).replace(/^[A-Z][A-Z0-9_]+: /, ""))
    }
    let answer
    try {
        // the organization named, one of the viewer's (refused otherwise), narrows the result under the row filter
        answer = analysis.run(Object.assign({}, choices, {narrowOrganization: true}))
    } catch (error) {
        const code = reasonCode(error)
        if (!code) throw error
        return refused(code, String(error.message).replace(/^[A-Z][A-Z0-9_]+: /, ""))
    }
    if (!answer.available) return refused(answer.refusedCode, answer.reason)
    return {
        available: true,
        datasetId: choices.datasetId,
        from: answer.range?.from == null ? null : String(answer.range.from),
        thru: answer.range?.thru == null ? null : String(answer.range.thru),
        columns: answer.columns,
        rows: answer.rows,
        sourceCount: answer.sourceCount,
        notices: answer.notices,
        // the choices as the Panel line an answer ends with, which Add to my dashboard reads back
        panel: "Panel: " + JSON.stringify(choices)
    }
}

// ===== a saved panel =====
const valueText = (field, value) => {
    if (value == null) return ""
    if (field.type === "time") {
        const millis = /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
        if (!Number.isNaN(millis)) return ec.l10n.format(new Date(millis), "yyyy-MM-dd")
    }
    return String(value)
}
// The saved panel a request names, as the engine will read it: a library panel's body, or a dashboard's panel by its own key
// (the library panel it references, read as the viewer). A dashboard that repeats panels has copies only once it renders, so
// its panels are not read here.
function readDefinition(definitionId) {
    ec.message.pushErrors()
    try {
        return insights.asViewerApart(ENGINE + "get#Definition", {definitionId}).definition || null
    } catch (error) {
        // one the viewer does not read answers as one that is not there
        return null
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function savedPanel(definitionId, panelId) {
    const definition = definitionId ? readDefinition(definitionId) : null
    let body = null
    let dashboard = null
    if (definition?.type === "panel") body = definition.body
    else if (definition?.type === "dashboard") {
        dashboard = definition.body || {}
        if (/"repeat"\s*:/.test(JSON.stringify([dashboard.panels, dashboard.layout]) || ""))
            denied("PANEL_UNAVAILABLE", "A repeated panel is not read here; open its dashboard")
        const panels = dashboard.panels
        const entry = panels && typeof panels === "object" && panelId && Object.hasOwn(panels, panelId) ? panels[panelId] : null
        body = entry && typeof entry.panelRef === "string" ? readDefinition(entry.panelRef)?.body : entry
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
        denied("PANEL_UNAVAILABLE", "This panel is not available to you")
    return {body, dashboard}
}
// What a saved panel reads, checked before it is run (the P10 review, R1). A panel's result is the frames of every one of its
// queries together, renamed as its author chose (an aggregation's id, a transformation's name), so neither the one dataset a
// drill answers nor a frame's field names say what was read: every dataset any of its queries names is held to its class,
// and a panel that names a cost or margin field anywhere in its queries, transformations or its dashboard's filters and
// variables is refused unless the surface reads costs for the viewer. A query that names no dataset (the engine's telemetry
// default) or takes a name from a variable is not a business panel.
function checkPanel(saved, surface) {
    const queries = Array.isArray(saved.body.queries) ? saved.body.queries : []
    const datasetIds = new Set()
    const walk = (query, depth) => {
        if (!query || typeof query !== "object" || Array.isArray(query) || depth > 8)
            denied("PANEL_UNAVAILABLE", "This panel's query cannot be read here")
        const composed = Array.isArray(query.queries)
        if (query.datasetId != null || !composed) {
            if (typeof query.datasetId !== "string" || !query.datasetId) classed(null, surface)
            datasetIds.add(query.datasetId)
        }
        if (composed) for (const child of query.queries) walk(child, depth + 1)
    }
    for (const query of queries) walk(query, 0)
    if (!datasetIds.size) classed(null, surface)
    const read = JSON.stringify([queries, saved.body.transformations, saved.body.footer]) || ""
    // "$name" anywhere a query reads is a variable's value at run time: a dataset or a field that cannot be checked here
    if (/"\$/.test(read)) denied("PANEL_UNAVAILABLE", "This panel's query takes a name from a variable, so it is not read here")
    for (const datasetId of datasetIds) classed(datasetId, surface)
    const scoped = JSON.stringify([saved.dashboard?.filters, saved.dashboard?.variables]) || ""
    if (!readsCosts(surface) && (restrictedField.test(read) || restrictedField.test(scoped)))
        denied("FIELD_RESTRICTED", "This panel reads a cost or margin field, which is not read here")
}
// run#PanelQuery, run#OperationsPanel: a saved panel's own result as its dashboard shows it to the viewer, by the
// definition (a dashboard with panelId, or a library panel) and the range; nothing else is taken. Every dataset the panel's
// queries name is held to its class and a panel that reads a cost or margin field is refused unless the surface reads costs
// for the viewer (checkPanel), before anything is run.
function panel(p, surface) {
    reader()
    const refused = (refusedCode, reason) => ({available: false, refusedCode, reason, rows: [], notices: []})
    let answer
    try {
        // the organization first, so a forged one is refused as such whatever the panel
        insights.context({appRoot: "Insights", organizationPartyId: text(p.organizationPartyId) || null})
        checkPanel(savedPanel(text(p.definitionId), text(p.panelId)), surface)
        answer = drill.execute("drill", {
            definitionId: text(p.definitionId),
            panelId: text(p.panelId) || null,
            queryReference: text(p.queryReference) || null,
            from: text(p.from) || null,
            thru: text(p.thru) || null,
            organizationPartyId: text(p.organizationPartyId) || null
        })
        if (!answer.available) return refused("PANEL_UNAVAILABLE", answer.reason || "This panel is not available to you")
        classed(answer.datasetId, surface)
    } catch (error) {
        const code = reasonCode(error)
        if (!code) throw error
        return refused(code, String(error.message).replace(/^[A-Z][A-Z0-9_]+: /, ""))
    }
    const rowsOut = []
    for (const frame of answer.panelFrames) {
        const fields = Array.from(frame.fields || [])
        const groups = fields.filter(field => field.config?.bucket)
        const measures = fields.filter(field => !field.config?.bucket && !["other", "missing"].includes(field.name))
        const length = Math.max(0, ...fields.map(field => Array.from(field.values || []).length))
        for (let index = 0; index < length && rowsOut.length < 200; index++)
            rowsOut.push({
                label: groups
                    .map(field => valueText(field, field.config.bucket.labels?.[index] ?? field.values[index]))
                    .join(" · "),
                valuesText: measures
                    .map(field => {
                        const unit = field.config?.units?.[index] || field.unit || ""
                        return field.name + " " + valueText(field, field.values[index]) + (unit ? " " + unit : "")
                    })
                    .join(", ")
            })
    }
    const meaning = answer.meaning
    return {
        available: true,
        title: answer.title || null,
        datasetId: answer.datasetId || null,
        from: answer.range?.from == null ? null : String(answer.range.from),
        thru: answer.range?.thru == null ? null : String(answer.range.thru),
        organizationPartyId: answer.organizationPartyId || null,
        rows: rowsOut,
        sourceCount: answer.rowsAvailable ? answer.total : null,
        meaning: meaning
            ? {
                  metricId: meaning.metricId,
                  title: meaning.title,
                  ownerApp: meaning.ownerApp,
                  basis: meaning.basis,
                  unitPolicy: meaning.unitPolicy,
                  exclusions: meaning.exclusions,
                  rules: meaning.rules
              }
            : null,
        notices: []
    }
}

// ===== add#AssistPanel =====
// The typed choices of an answer's last Panel line: own names of the list only, each a short text. Anything else in the
// answer is ignored; the choices are then checked as any typed query's.
function panelChoices(answerText) {
    const lines = String(answerText ?? "")
        .split(/\r?\n/)
        .map(line => line.trim().replace(/^`+|`+$/g, ""))
        .filter(line => /^Panel:\s*\{/.test(line))
    if (!lines.length) denied("PANEL_REQUIRED", "This answer names no query to save. Ask Assist for a number first.")
    let parsed
    try {
        parsed = JSON.parse(lines[lines.length - 1].replace(/^Panel:\s*/, ""))
    } catch (error) {
        denied("PANEL_REQUIRED", "The answer's Panel line could not be read")
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        denied("PANEL_REQUIRED", "The answer's Panel line could not be read")
    const choices = {}
    for (const name of choiceNames) {
        if (!Object.hasOwn(parsed, name) || parsed[name] == null || typeof parsed[name] === "object") continue
        const value = text(parsed[name])
        if (value && value.length <= 120) choices[name] = value
    }
    return choices
}
// add#AssistPanel: the answer's query saved as the caller's own library panel and, when one is chosen, placed on a dashboard
// of their own, through AnalysisServices.store#Analysis called as the caller: its author check, the dataset, every field and
// the engine's guards and saves apply as from Analysis. The dataset's class is checked as for the answer.
function addPanel(p) {
    reader()
    try {
        const choices = panelChoices(p.answerText)
        classed(choices.datasetId, "assist")
        const restricted = fieldChoices.map(name => choices[name]).find(field => field && !open(field, "assist"))
        if (restricted) denied("FIELD_RESTRICTED", restricted + " is a cost or margin field, which is not read here")
        // in a transaction of its own, so its refusal is this answer's reason and not a rollback of the caller's
        let saved
        ec.message.pushErrors()
        try {
            saved = insights.asViewerApart(
                "ironstone.insights.AnalysisServices.store#Analysis",
                Object.assign({}, choices, {
                    title: text(p.title),
                    visualization: text(p.visualization) || "table",
                    dashboardId: text(p.dashboardId) || null
                })
            )
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
        return {
            applied: true,
            reasonCode: null,
            reason: null,
            definitionId: saved.definitionId,
            dashboardId: saved.dashboardId || null
        }
    } catch (error) {
        const code = reasonCode(error) || (String(error.message).match(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/) || [])[1]
        if (!code) ec.logger.error("Insights Add to my dashboard: " + error.message)
        return {
            applied: false,
            reasonCode: code || "PANEL_FAILED",
            reason: code ? String(error.message).replace(/^.*?[A-Z][A-Z0-9_]+: /, "") : "The panel could not be saved"
        }
    }
}

const operations = {
    assistSources: p => sources(p, "assist"),
    operationsSources: p => sources(p, "mcp"),
    assistQuery: p => query(p, "assist"),
    operationsQuery: p => query(p, "mcp"),
    assistPanel: p => panel(p, "assist"),
    operationsPanel: p => panel(p, "mcp"),
    addPanel
}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Insights assist operation " + op)
        return operations[op](parameters)
    }
})
