// Insights' business datasets in the framework's readiness and refresh registries (impl-insights P3, INS-03, INS-09; impl-admin F50, F53): each dataset's
// readiness provider and index refresh, over the framework's business dataset services (org.moqui.report.ReportServices
// find#BusinessDatasets and index#BusinessDataset), each called as the viewer so the engine checks the dataset's own artifact
// (view to read, update to steward). The report builder's dataset screens (Datasets, DatasetDetail, DatasetFields, DatasetView)
// are the framework's Dashboards screens, shown under Insights' mount (mr-moqui plans/archive/Admin-Screens-Down.md, Track I): what they
// read is the framework's (get#BusinessDataset, get#BusinessDatasetOptions; tools template/ReportDatasets.js), and what a
// dataset created in Insights is named with and the words of its organization field are Insights' reportPolicy (Insights.js).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, denied} = lib
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")

const R = "org.moqui.report.ReportServices."
const providerPrefix = "insights.dataset."
const statusNames = {admitted: "Admitted", review: "Needs review", retired: "Retired", unavailable: "Unavailable"}

const timeText = ms => (ms == null || ms === "" ? "" : ec.l10n.format(new Date(Number(ms)), "yyyy-MM-dd HH:mm"))
// a report engine call as the viewer: the engine's own checks apply, and its refusal is the caller's error
function asViewer(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// One dataset as the engine answers it to the viewer (read or stewarded), with what its readiness says of it.
function described(datasetId) {
    const row = Array.from(asViewer(R + "find#BusinessDatasets", {datasetId: datasetId || "_NA_"}).datasets || [])[0]
    if (!row) denied("RECORD_UNAVAILABLE", "Dataset " + (datasetId || "") + " is not available")
    return {
        title: row.title || row.datasetId,
        status: row.status,
        failedText: Array.from(row.checks || [])
            .filter(check => check.passed !== true)
            .map(check => check.message || "")
            .join("; "),
        lastIndexedText: timeText(row.lastIndexedDate),
        lastIndexedCount: row.lastIndexedCount ?? null
    }
}

// ===== readiness and refresh (the framework's registries, first Admin's; impl-admin F50, F53) =====
// check#DatasetReadiness: the readiness contract for one dataset's provider (insights.dataset.<id>): admitted with its checks
// passing is ready, waiting for review a warning naming what fails, unavailable unavailable; the watermark is its index's last
// build. A dataset the viewer may neither read nor steward is refused, so the registry leaves it out.
function readiness(p) {
    const can = insights.required().capabilities
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
                // the index's last build, as the stamp the framework's own providers answer
                watermark: lastIndexed(datasetId),
                // the index's size is every organization's documents together: the author's and the steward's to read, not
                // a reader's, who reads the source's freshness (the P10 review, R4)
                coverage:
                    row.lastIndexedCount != null && (can.author || can.datasetView || can.datasetEdit)
                        ? row.lastIndexedCount + " documents at the last rebuild"
                        : ""
            }
        ]
    }
}
function lastIndexed(datasetId) {
    return one("moqui.report.BusinessDataset", {datasetId})?.lastIndexedDate ?? null
}
// refresh#DatasetIndex: the framework's request#Refresh of a registered Insights refresh (insights.dataset.<id>.index): the dataset is the
// registration's source, never a name from the request, and index#BusinessDataset runs as the viewer, so the dataset's own update
// artifact guards it.
function refresh(p) {
    insights.required()
    const operation = one("moqui.server.RefreshOperation", {refreshKey: p.refreshKey || "_NA_"})
    if (!operation || operation.ownerApp !== "Insights" || operation.sourceKindEnumId !== "AdmRsIndex" || !operation.sourceName)
        denied("REFRESH_UNAVAILABLE", "Refresh " + (p.refreshKey || "") + " is not available")
    // the registration's permission again here: the registry asks it before it calls, and a direct call asks it too
    if (operation.requiredPermission && !lib.access.has(operation.requiredPermission))
        denied("REFRESH_DENIED", operation.requiredPermission + " is required to refresh " + operation.title)
    const out = asViewer(R + "index#BusinessDataset", {datasetId: operation.sourceName})
    return {documentsIndexed: out.documentsIndexed ?? 0}
}

const operations = {readiness, refresh}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights dataset operation " + op)
        return operations[op](parameters)
    }
})
