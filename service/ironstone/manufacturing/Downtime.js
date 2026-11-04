// The Manufacturing context of the shared request and work item screens (impl-manufacturing P11; design-manufacturing
// RequestDetail and WorkItemDetail, crosscut §3.11 and §3.12 Manufacturing rows): a maintenance request of one of the user's
// plants, with the stops it was asked for (mantle.work.ProductionServices.find#ProductionDowntime), its equipment, its
// corrective maintenance and the stopped run or operation; and a follow-up task of such a request. Each read checks the
// user's Manufacturing scope first (Manufacturing.js), and the stops come from the Mantle read, which checks its own
// permission. A request or task with no production context is not available here; a production operation is never a
// follow-up task (F38), and opens in Work orders.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, dateText, reasonCode} = lib
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")

const DOWNTIME = "mantle.work.production.ProductionDowntime",
    ASSET = "mantle.product.asset.Asset",
    MAINTENANCE = "mantle.product.maintenance.AssetMaintenance",
    WORK = "mantle.work.effort.WorkEffort",
    REQUEST = "mantle.request.Request"
const base = "/qapps/Manufacturing/"

const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
// the record of a kind the user may work with, else null (a record outside the scope is left out, not shown)
function visible(userScope, kind, recordId) {
    try {
        return manufacturing.recordOf(userScope, kind, recordId)
    } catch (error) {
        if (reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        return null
    }
}
// The stops a request was asked for, from the Mantle read (none for a user without its permission).
function stopsOf(requestId) {
    ec.message.pushErrors()
    try {
        return Array.from(
            lib.call("mantle.work.ProductionServices.find#ProductionDowntime", {requestId, pageSize: 20}).downtimeList || []
        )
    } catch (error) {
        ec.logger.info("Downtime of request " + requestId + " not read: " + error.message)
        return []
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
const recordIds = (requestId, recordEntityName) =>
    rows("mantle.request.RequestRecord", {requestId, recordEntityName}).map(row => row.recordId)

// ===== get#RequestContext =====
// A maintenance request of the user's plants: of type RqtMaintenance at one of their facilities, or asked for a stop of
// theirs. Its stops, equipment, maintenance and the run or operation it is on, each with its Manufacturing link.
function requestContext(p) {
    const userScope = manufacturing.required()
    const request = one(REQUEST, {requestId: p.requestId})
    if (!request) return {available: false}
    const facility = request.facilityId ? visible(userScope, "facility", request.facilityId) : null
    const stops = stopsOf(request.requestId)
    if (!stops.length && !(request.requestTypeEnumId === "RqtMaintenance" && facility)) return {available: false}
    const downtimeRows = stops.map(stop =>
        Object.assign({}, stop, {
            url: base + "WorkCenters/Downtime?productionDowntimeId=" + encodeURIComponent(stop.productionDowntimeId)
        })
    )
    const equipmentRows = recordIds(request.requestId, ASSET)
        .map(assetId => {
            const record = visible(userScope, "asset", assetId)
            return record
                ? {assetId, label: record.label, detail: record.detail, url: manufacturing.recordUrl("asset", assetId)}
                : null
        })
        .filter(Boolean)
    const maintenanceRows = recordIds(request.requestId, MAINTENANCE)
        .map(assetMaintenanceId => one(MAINTENANCE, {assetMaintenanceId}))
        .filter(row => row && visible(userScope, "asset", row.assetId))
        .map(row => ({
            assetMaintenanceId: row.assetMaintenanceId,
            typeText: enumText(row.maintenanceTypeEnumId),
            statusText: statusText(row.statusId),
            dateText: dateText(row.maintenanceDate),
            comments: row.comments || ""
        }))
    const workRows = rows("mantle.request.RequestWorkEffort", {requestId: request.requestId})
        .map(link => {
            const work = one(WORK, {workEffortId: link.workEffortId})
            const kind = work?.purposeEnumId === "WepProductionRun" ? "run" : "operation"
            const record = work ? visible(userScope, kind, work.workEffortId) : null
            return record
                ? {
                      workEffortId: work.workEffortId,
                      kindName: record.kindName,
                      label: record.label,
                      detail: record.detail,
                      url: manufacturing.recordUrl(kind, work.workEffortId)
                  }
                : null
        })
        .filter(Boolean)
    return {
        available: true,
        requestId: request.requestId,
        facilityId: facility?.recordId || null,
        facilityName: facility?.label || downtimeRows[0]?.facilityName || "",
        downtimeRows,
        equipmentRows,
        maintenanceRows,
        workRows,
        // the production records the request's task list shows: they open in Manufacturing, never as tasks (F38)
        productionWorkIds: workRows.map(row => row.workEffortId)
    }
}

// ===== get#WorkItemContext =====
// A follow-up task of a maintenance request of the user's plants (RequestWorkEffort), with those requests and their stops
// and equipment. A production run or operation is not a follow-up task: it is not available here (F38).
function workItemContext(p) {
    manufacturing.required()
    const task = one(WORK, {workEffortId: p.workEffortId})
    if (!task) return {available: false}
    const runId = task.rootWorkEffortId || task.parentWorkEffortId
    const run = runId ? one(WORK, {workEffortId: runId}) : null
    if (task.purposeEnumId === "WepProductionRun" || run?.purposeEnumId === "WepProductionRun")
        return {available: false, productionWork: true, url: manufacturing.recordLink("operation", task.workEffortId)}
    const requests = rows("mantle.request.RequestWorkEffort", {workEffortId: task.workEffortId})
        .map(link => requestContext({requestId: link.requestId}))
        .filter(context => context.available)
    if (!requests.length) return {available: false}
    const requestRows = requests.map(context => {
        const request = one(REQUEST, {requestId: context.requestId})
        return {
            requestId: request.requestId,
            requestName: request.requestName || request.requestId,
            statusText: statusText(request.statusId),
            url: base + "WorkCenters/RequestDetail?requestId=" + encodeURIComponent(request.requestId)
        }
    })
    const unique = (list, key) => list.filter((row, index) => list.findIndex(other => other[key] === row[key]) === index)
    return {
        available: true,
        requestRows,
        downtimeRows: unique(
            requests.flatMap(context => context.downtimeRows),
            "productionDowntimeId"
        ),
        equipmentRows: unique(
            requests.flatMap(context => context.equipmentRows),
            "assetId"
        )
    }
}

const operations = {requestContext, workItemContext}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing downtime operation " + op)
        return operations[op](parameters)
    }
})
