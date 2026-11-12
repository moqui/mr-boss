// Maintenance's requests (impl-maintenance P4; design-maintenance §3 Requests and the RequestDetail mount row): the list's shape over
// Mantle's find#MaintenanceRequests (the state colors and the links of a row) and RequestDetail's Maintenance context (the request
// checked as Maintenance's record, its target, its work order and what the planner may decide). The records and every decision are
// Mantle's mantle.work.MaintenanceServices, which checks the permission and the organization again; a requester follows their own
// reports in Commons and holds no grant here (impl-maintenance F78).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenance = ec.resource.script("component://mr-boss/service/ironstone/maintenance/Maintenance.js")

const statusColors = {
    ReqSubmitted: "warning",
    ReqReviewed: "primary",
    ReqInProgress: "positive",
    ReqCompleted: "teal",
    ReqCancelled: "grey-7"
}
const base = "/qapps/Maintenance/"
const link = (path, parameter, id) => (id ? base + path + "?" + parameter + "=" + encodeURIComponent(id) : null)
const text = value => (value == null || String(value).trim() === "" ? null : String(value).trim())

// A row of find#MaintenanceRequests with its color and links (the request, its target and its work order under Maintenance).
function shape(row) {
    return Object.assign({}, row, {
        statusColor: statusColors[row.statusId] || "grey-8",
        stateText: row.statusText + (row.resolutionText ? " · " + row.resolutionText : ""),
        requestUrl: link("Requests/RequestDetail", "requestId", row.requestId),
        targetUrl:
            row.targetKind === "asset"
                ? link("Equipment/EquipmentDetail", "assetId", row.targetId)
                : link("Facilities/FacilityDetail", "facilityId", row.targetId),
        workOrderUrl: link("WorkOrders/WorkOrderDetail", "workEffortId", row.workEffortId),
        workText: row.workEffortId ? row.workEffortName + " · " + row.workStatusText : ""
    })
}
// find#RequestRows: Requests' list, Mantle's find with each row shaped.
function rows(p) {
    const found =
        ec.service
            .sync()
            .name("mantle.work.MaintenanceServices.find#MaintenanceRequests")
            .parameters({
                text: text(p.text),
                organizationPartyId: text(p.organizationPartyId),
                statusId: text(p.statusId),
                pageIndex: p.pageIndex,
                pageSize: p.pageSize
            })
            .call() || {}
    return Object.assign({}, found, {requestList: Array.from(found.requestList || []).map(shape)})
}
// get#RequestContext: RequestDetail's Maintenance context of one request, after Maintenance's record check (a planner or
// supervisor of its organization).
function context(p) {
    const record = maintenance.execute("checkRecord", {appRoot: "Maintenance", recordType: "request", recordId: p.requestId})
    const found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceRequests", {
        requestId: record.recordId,
        statusId: "all"
    })
    const row = Array.from(found.requestList || [])[0]
    if (!row) return {available: false}
    const shaped = shape(row)
    const open = ["ReqSubmitted", "ReqReviewed", "ReqInProgress"].includes(row.statusId)
    return {
        available: true,
        request: shaped,
        organizationPartyId: record.organizationPartyId,
        canTriage: !!found.canTriage && open && !row.workEffortId,
        canAssign: !!found.canTriage && open,
        triageValues: {
            requestId: row.requestId,
            decision: "create",
            workEffortName: row.requestName,
            priority: String(row.priority ?? 5),
            organizationPartyId: record.organizationPartyId,
            operationKey: "triage-" + ec.user.randomString(24)
        }
    }
}

const operations = {rows, context}
;({
    execute: (op, p) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance request operation " + op)
        return operations[op](p || {})
    }
})
