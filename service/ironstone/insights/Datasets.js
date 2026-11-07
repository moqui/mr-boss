// Insights' business datasets (impl-insights P3, INS-03, INS-09; design-insights §5 Datasets, DatasetDetail, DatasetFields,
// DatasetView): the report builder's dataset screens and the datasets' readiness and refresh registrations, over the framework's
// business dataset services (org.moqui.report.ReportServices find#BusinessDatasets, create#, store#, validate#, index#BusinessDataset,
// store#BusinessDatasetFields and store#BusinessDatasetConditions), each called as the viewer so the engine checks the dataset's
// own artifact (view to read, update to steward) and its row filter scopes every row. The INSIGHTS_* permissions decide what the
// screens offer (the author's and the steward's lists, the steward's admission); they grant no dataset. Display values (state names,
// times in the user's zone, the lag since the last build) come from here.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied} = lib
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")

const R = "org.moqui.report.ReportServices."
const minute = 60 * 1000
// the steward's datasets are named so: the steward group's grant is on org.moqui.report.dataset.insights-* (BossSetupData)
const createdPrefix = "insights-"
const providerPrefix = "insights.dataset."
const statusNames = {admitted: "Admitted", review: "Needs review", retired: "Retired", unavailable: "Unavailable"}
const statusColors = {admitted: "positive", review: "warning", retired: "grey-8", unavailable: "negative"}
const checkNames = {feed: "Registered feed", index: "Index built", scope: "Row filter bound", document: "Source document"}
// the most rows one export holds, and its default
const exportCap = 10000
const exportDefault = 1000

const timeText = ms => (ms == null || ms === "" ? "" : ec.l10n.format(new Date(Number(ms)), "yyyy-MM-dd HH:mm"))
function lagText(ms) {
    if (ms == null || ms === "") return ""
    const minutes = Math.max(0, Math.round((Date.now() - Number(ms)) / minute))
    if (minutes < 120) return minutes + (minutes === 1 ? " minute" : " minutes")
    if (minutes < 48 * 60) return Math.round(minutes / 60) + " hours"
    return Math.round(minutes / (24 * 60)) + " days"
}
// a report engine call as the viewer: the engine's own checks apply, and its refusal is the caller's error
function asViewer(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
function capabilities() {
    return insights.required().capabilities
}
function needs(allowed, code, message) {
    if (!allowed) denied(code, message)
}

// ===== the list =====
// A dataset row as the screens show it.
function present(row) {
    const checks = Array.from(row.checks || []).map(check => ({
        check: check.check,
        name: checkNames[check.check] || check.check,
        passed: check.passed === true,
        passedText: check.passed === true ? "Passed" : "Not passed",
        message: check.message || ""
    }))
    return {
        datasetId: row.datasetId,
        title: row.title || row.datasetId,
        dataDocumentId: row.dataDocumentId || "",
        documentName: row.documentName || "",
        indexName: row.indexName || "",
        dataFeedId: row.dataFeedId || "",
        timeField: row.timeField || "",
        scopePolicyId: row.scopePolicyId || "",
        scopeText: row.scopePolicy
            ? row.scopePolicy +
              (row.rowFilterParameters?.organizationField ? " on " + row.rowFilterParameters.organizationField : "")
            : "Not bound",
        organizationField: row.rowFilterParameters?.organizationField || "",
        component: row.component || "",
        readOnly: row.readOnly === true,
        status: row.status,
        statusName: statusNames[row.status] || row.status,
        statusColor: statusColors[row.status] || "grey-8",
        admissible: row.admissible === true,
        checks,
        failedText: checks
            .filter(check => !check.passed)
            .map(check => check.message)
            .join("; "),
        admittedText: timeText(row.admittedDate),
        lastIndexedText: timeText(row.lastIndexedDate),
        lastIndexedCount: row.lastIndexedCount ?? null,
        lagText: lagText(row.lastIndexedDate),
        readable: row.readable === true,
        stewarded: row.stewarded === true,
        version: row.version ?? 0
    }
}
// find#Datasets: the datasets the author or steward may read (and the steward's waiting for review), narrowed by state and by
// text in the title or source, ignoring case.
function datasets(p) {
    const can = capabilities()
    needs(can.author || can.datasetView, "INSIGHTS_DATASETS_UNAVAILABLE", "Datasets need Insights authoring or stewardship")
    const found = Array.from(asViewer(R + "find#BusinessDatasets", {}).datasets || []).map(present)
    const text = String(p.text || "")
        .trim()
        .toLowerCase()
    const shown = found
        .filter(row => !p.status || row.status === p.status)
        .filter(row => !text || [row.title, row.datasetId, row.documentName].some(value => value.toLowerCase().includes(text)))
        .sort((a, b) => a.title.localeCompare(b.title))
    return {datasets: shown, canCreate: !!can.datasetEdit, canSteward: !!can.datasetEdit}
}

// ===== one dataset =====
function described(datasetId) {
    const row = Array.from(asViewer(R + "find#BusinessDatasets", {datasetId: datasetId || "_NA_"}).datasets || [])[0]
    if (!row) denied("RECORD_UNAVAILABLE", "Dataset " + (datasetId || "") + " is not available")
    return present(row)
}
// get#Dataset: one dataset for its steward with its fields, conditions and uses; the fields and conditions are the dataset's
// document's, read once the engine has answered the dataset to its steward.
function dataset(p) {
    const can = capabilities()
    needs(can.datasetView, "INSIGHTS_DATASET_VIEW_REQUIRED", "A dataset's details need Insights stewardship")
    const row = described(p.datasetId)
    if (!row.stewarded) denied("RECORD_UNAVAILABLE", "Dataset " + p.datasetId + " is not one you steward")
    const fields = rows("moqui.entity.document.DataDocumentField", {dataDocumentId: row.dataDocumentId})
        .map(field => ({
            fieldSeqId: field.fieldSeqId,
            fieldPath: field.fieldPath,
            fieldNameAlias: field.fieldNameAlias || "",
            fieldName:
                field.fieldNameAlias ||
                (String(field.fieldPath).includes(":") ? String(field.fieldPath).split(":").pop() : field.fieldPath),
            functionName: field.functionName || "",
            sequenceNum: field.sequenceNum ?? null,
            expression: !/^[A-Za-z0-9_:]+$/.test(String(field.fieldPath))
        }))
        .sort((a, b) => (a.sequenceNum ?? 999) - (b.sequenceNum ?? 999) || String(a.fieldSeqId).localeCompare(b.fieldSeqId))
    const conditions = rows("moqui.entity.document.DataDocumentCondition", {dataDocumentId: row.dataDocumentId}).map(
        condition => ({
            conditionSeqId: condition.conditionSeqId,
            fieldNameAlias: condition.fieldNameAlias || "",
            operator: condition.operator || "equals",
            fieldValue: condition.fieldValue || "",
            toFieldNameAlias: condition.toFieldNameAlias || "",
            postQuery: condition.postQuery === "Y"
        })
    )
    let uses = []
    try {
        uses = Array.from(asViewer(R + "find#DefinitionUses", {definitionId: row.datasetId}).usedIn || []).map(use => ({
            id: use.id,
            title: use.title || use.id,
            type: use.type,
            shipped: use.readOnly === true
        }))
    } catch (error) {
        ec.logger.error("Dataset " + row.datasetId + " uses were not read: " + error.message)
    }
    return {dataset: row, fields, conditions, uses, policies: policyChoices()}
}

// ===== choices =====
function policyChoices() {
    return rows("moqui.basic.Enumeration", {enumTypeId: "ReportScopePolicy"})
        .map(row => ({key: row.enumId, text: row.description || row.enumId}))
        .sort((a, b) => a.text.localeCompare(b.text))
}
// get#DatasetChoices: what CreateDataset offers the steward: the documents of registered feeds (never a telemetry index or an
// unregistered source) and the registered scope policies.
function choices() {
    const can = capabilities()
    needs(can.datasetEdit, "INSIGHTS_DATASET_EDIT_REQUIRED", "Creating a dataset needs Insights stewardship")
    const fed = Array.from(new Set(rows("moqui.entity.feed.DataFeedDocument", {}).map(row => row.dataDocumentId)))
    const documents = fed.length
        ? Array.from(
              find("moqui.entity.document.DataDocument").condition("dataDocumentId", "in", fed).orderBy("documentName").list()
          )
              .filter(row => row.indexName && !String(row.indexName).startsWith("otel_"))
              .map(row => ({
                  key: row.dataDocumentId,
                  text: (row.documentName || row.dataDocumentId) + " (" + row.indexName + ")"
              }))
        : []
    return {documents, policies: policyChoices()}
}

// ===== stewardship =====
function slug(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50)
}
// create#Dataset: the steward's new dataset, named insights-<name>, over a registered feed's document with a registered policy.
function create(p) {
    const can = capabilities()
    needs(can.datasetEdit, "INSIGHTS_DATASET_EDIT_REQUIRED", "Creating a dataset needs Insights stewardship")
    const name = slug(p.name || p.title)
    if (!name) denied("DATASET_NAME_REQUIRED", "Name the dataset")
    const parameters = {
        datasetId: createdPrefix + name,
        title: p.title || p.name,
        dataDocumentId: p.dataDocumentId,
        timeField: p.timeField || "_timestamp",
        scopePolicyId: p.scopePolicyId
    }
    if (p.organizationField) parameters.rowFilterParameters = {organizationField: p.organizationField}
    const out = asViewer(R + "create#BusinessDataset", parameters)
    return {datasetId: out.dataset?.datasetId || parameters.datasetId}
}

// ===== view and export =====
// The fields a document row shows, by name, leaving out the index's own (_id, _index, ...).
function summary(body) {
    return Object.entries(body || {})
        .filter(([name, value]) => !name.startsWith("_") && value != null && typeof value !== "object")
        .slice(0, 10)
        .map(([name, value]) => name + ": " + value)
        .join(" · ")
}
// Insights' default range (get#Context's) when none is chosen
function rangeOf(p) {
    return {from: p.from || "now-30d", thru: p.thru || "now"}
}
// get#DatasetView: a page of the dataset's rows as the viewer reads them (scoped by its row filter), newest first.
function view(p) {
    const can = capabilities()
    needs(can.author || can.datasetView, "INSIGHTS_DATASETS_UNAVAILABLE", "Datasets need Insights authoring or stewardship")
    const row = described(p.datasetId)
    if (!row.readable) denied("DATASET_UNREADABLE", "Dataset " + row.title + " is not admitted")
    const pageSize = 25
    const pageIndex = Math.max(0, Number(p.pageIndex || 0))
    const range = rangeOf(p)
    const out = asViewer(
        R + "query#Documents",
        Object.assign({datasetId: row.datasetId, queryString: p.queryString || null, pageSize, pageIndex}, range)
    )
    const hits = Array.from(out.hits || []).map(hit => ({
        documentId: hit.id,
        title: hit.documentTitle || hit.id,
        summary: summary(hit.body)
    }))
    const total = Number(out.total || 0)
    return {
        dataset: row,
        documentList: hits,
        documentListCount: total,
        documentListPageIndex: pageIndex,
        documentListPageSize: pageSize,
        documentListPageMaxIndex: Math.max(0, Math.ceil(total / pageSize) - 1),
        documentListPageRangeLow: total ? pageIndex * pageSize + 1 : 0,
        documentListPageRangeHigh: Math.min(total, (pageIndex + 1) * pageSize),
        totalText: out.totalRelation === "gte" ? "at least " + total : String(total)
    }
}
function csvCell(value) {
    const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value)
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}
// export#Dataset: the scoped export adapter (design §5 ExportDocuments): the same rows the viewer reads, through query#Documents
// with the dataset's row filter, to the server's cap, as CSV or JSON, audited through audit#Export.
function exportDataset(p) {
    const can = capabilities()
    needs(can.author || can.datasetView, "INSIGHTS_DATASETS_UNAVAILABLE", "Datasets need Insights authoring or stewardship")
    const row = described(p.datasetId)
    if (!row.readable) denied("DATASET_UNREADABLE", "Dataset " + row.title + " is not admitted")
    const format = p.format === "json" ? "json" : "csv"
    const limit = Math.min(exportCap, Math.max(1, Number(p.requestedRowLimit || exportDefault)))
    const range = rangeOf(p)
    const bodies = []
    let total = 0
    for (let pageIndex = 0; bodies.length < limit; pageIndex++) {
        const out = asViewer(
            R + "query#Documents",
            Object.assign({datasetId: row.datasetId, queryString: p.queryString || null, pageSize: 500, pageIndex}, range)
        )
        const hits = Array.from(out.hits || [])
        total = Number(out.total || 0)
        for (const hit of hits) if (bodies.length < limit) bodies.push(Object.assign({_id: hit.id}, hit.body || {}))
        if (hits.length < 500) break
    }
    let content
    if (format === "json") {
        content = p.prettyPrint === "true" || p.prettyPrint === true ? JSON.stringify(bodies, null, 2) : JSON.stringify(bodies)
    } else {
        const columns = Array.from(
            new Set(bodies.flatMap(body => Object.keys(body).filter(name => !name.startsWith("_") || name === "_id")))
        )
        content = [columns.map(csvCell).join(",")]
            .concat(bodies.map(body => columns.map(name => csvCell(body[name])).join(",")))
            .join("\r\n")
    }
    asViewer(R + "audit#Export", {kind: "documents", format, definitionId: row.datasetId, rowCount: bodies.length})
    return {
        content,
        contentType: format === "json" ? "application/json" : "text/csv",
        filename: row.datasetId + "." + format,
        rowCount: bodies.length,
        capped: total > bodies.length
    }
}

// ===== readiness and refresh (Admin's registries; impl-admin F50, F53) =====
// check#DatasetReadiness: the readiness contract for one dataset's provider (insights.dataset.<id>): admitted with its checks
// passing is ready, waiting for review a warning naming what fails, unavailable unavailable; the watermark is its index's last
// build. A dataset the viewer may neither read nor steward is refused, so the registry leaves it out.
function readiness(p) {
    insights.required()
    const datasetId = String(p.providerKey || "").startsWith(providerPrefix) ? p.providerKey.slice(providerPrefix.length) : ""
    const row = described(datasetId)
    const state = row.status === "admitted" ? "ready" : row.status === "unavailable" ? "unavailable" : "warning"
    const message =
        row.status === "admitted"
            ? "Admitted; " + (row.lastIndexedText ? "rebuilt " + row.lastIndexedText : "indexed as its records are written")
            : row.status === "retired"
              ? "Retired"
              : statusNames[row.status] + (row.failedText ? ": " + row.failedText : "")
    return {
        checks: [
            {
                checkKey: p.providerKey,
                title: row.title + " index",
                state,
                reasonCode: row.status === "admitted" ? null : "DATASET_" + String(row.status).toUpperCase(),
                message,
                // the index's last build, as the stamp Admin's providers answer
                watermark: lastIndexed(datasetId),
                coverage: row.lastIndexedCount != null ? row.lastIndexedCount + " documents at the last rebuild" : ""
            }
        ]
    }
}
function lastIndexed(datasetId) {
    return one("moqui.report.BusinessDataset", {datasetId})?.lastIndexedDate ?? null
}
// refresh#DatasetIndex: Admin's request#Refresh of a registered Insights refresh (insights.dataset.<id>.index): the dataset is the
// registration's source, never a name from the request, and index#BusinessDataset runs as the viewer, so the dataset's own update
// artifact guards it.
function refresh(p) {
    insights.required()
    const operation = one("ironstone.admin.RefreshOperation", {refreshKey: p.refreshKey || "_NA_"})
    if (!operation || operation.ownerApp !== "Insights" || operation.sourceKindEnumId !== "AdmRsIndex" || !operation.sourceName)
        denied("REFRESH_UNAVAILABLE", "Refresh " + (p.refreshKey || "") + " is not available")
    const out = asViewer(R + "index#BusinessDataset", {datasetId: operation.sourceName})
    return {documentsIndexed: out.documentsIndexed ?? 0}
}

const operations = {datasets, dataset, choices, create, view, exportDataset, readiness, refresh}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights dataset operation " + op)
        return operations[op](parameters)
    }
})
