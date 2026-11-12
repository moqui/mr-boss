// WorkItemDetail's Maintenance context and a work order's follow-up tasks (impl-maintenance P7; design-maintenance §3 "Shared work
// and business screens", crosscut §3.12 Maintenance row; on Manufacturing's pattern, ironstone.manufacturing Downtime.js
// workItemContext). A follow-up task is an ordinary task (a Commons task, never managed work) linked to a work order's root by a
// current WorkEffortAssoc (Caused By or Relates To); at Maintenance/WorkOrders/WorkItemDetail it is the Commons task with its work
// orders, each one the user reads in Maintenance (Mantle's requireWork). A work order's root or a process step is no follow-up task:
// it is not available there, links to its WorkOrderDetail and offers no Complete (its status moves by its response, waiver or the
// work order's lifecycle, ProcessServices).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenanceAccess = ec.resource.script("component://mr-mantle/service/mantle/work/MaintenanceAccess.js")
const workProcesses = ec.resource.script("component://mr-mantle/service/mantle/work/WorkProcesses.js")
const {find, one, denied} = lib

const WORK = "mantle.work.effort.WorkEffort"
const ASSOC = "mantle.work.effort.WorkEffortAssoc"
const ORDER = "mantle.work.maintenance.MaintenanceWorkOrder"
const linkTypes = ["WeatCausedBy", "WeatRelatesTo"]
const detailPath = "/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId="
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")

function readerScope() {
    if (!ec.user.userId) denied("MAINTENANCE_UNAVAILABLE", "Maintenance is not available")
    const userScope = maintenanceAccess.scope()
    if (!userScope.capabilities.workRead) denied("MAINTENANCE_UNAVAILABLE", "Maintenance work is not available")
    return userScope
}
// The work orders the user reads that a task follows up (current links of its to a managed root), each with its link.
function parentOrders(userScope, taskId) {
    const links = Array.from(
        find(ASSOC, {workEffortId: taskId}).condition("workEffortAssocTypeEnumId", "in", linkTypes).conditionDate("fromDate", "thruDate", ec.user.nowTimestamp).list()
    )
    const out = []
    for (const link of links) {
        const order = one(ORDER, {workEffortId: link.toWorkEffortId})
        if (!order) continue
        try {
            maintenanceAccess.requireWork(userScope, order.workEffortId)
        } catch (error) {
            continue
        }
        const root = one(WORK, {workEffortId: order.workEffortId})
        out.push({
            workEffortId: root.workEffortId,
            workEffortName: root.workEffortName || root.workEffortId,
            statusText: statusText(root.statusId),
            url: detailPath + encodeURIComponent(root.workEffortId)
        })
    }
    return out
}
// get#WorkItemContext: a follow-up task of a work order the user reads (available, with its work orders), or a work order's root or
// step (processWork, with the link to its work order), or neither (not available).
function workItemContext(p) {
    const userScope = readerScope()
    const task = one(WORK, {workEffortId: p.workEffortId})
    if (!task) return {available: false}
    if (workProcesses.managedReason([task.workEffortId])) {
        const rootId = task.rootWorkEffortId || task.workEffortId
        let url = null
        try {
            maintenanceAccess.requireWork(userScope, task.workEffortId)
            if (one(ORDER, {workEffortId: rootId})) url = detailPath + encodeURIComponent(rootId)
        } catch (error) {
            url = null
        }
        return {available: false, processWork: true, url}
    }
    const orderRows = parentOrders(userScope, task.workEffortId)
    if (!orderRows.length) return {available: false}
    return {available: true, orderRows}
}
// find#FollowUpTasks: a work order's follow-up tasks (the tasks linked to its root), for a reader of the work order.
function followUpTasks(p) {
    const userScope = readerScope()
    const found = maintenanceAccess.requireWork(userScope, p.workEffortId)
    const links = Array.from(
        find(ASSOC, {toWorkEffortId: found.rootWorkEffortId})
            .condition("workEffortAssocTypeEnumId", "in", linkTypes)
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .list()
    )
    const out = []
    for (const link of links) {
        const task = one(WORK, {workEffortId: link.workEffortId})
        if (!task || task.workEffortTypeEnumId !== "WetTask" || workProcesses.managedReason([task.workEffortId])) continue
        out.push({
            workEffortId: task.workEffortId,
            workEffortName: task.workEffortName || task.workEffortId,
            statusText: statusText(task.statusId)
        })
    }
    return {taskList: out}
}

const operations = {workItemContext, followUpTasks}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance work item operation " + op)
        return operations[op](parameters || {})
    }
})
