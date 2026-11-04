// Manufacturing's shop floor (impl-manufacturing P10; design-manufacturing ShopFloor, OperationExecution, Instructions and
// ProductionTime): the station's board (the queue of mantle.work.ProductionServices.get#ShopFloorQueue for the selected plant,
// as the board's groups and cards, with the plants to choose from), the scan resolver of an operation (its id, or a work
// order's open operations), and the Today source of the user's due operations (F41). Every read runs the Manufacturing scope
// and its record check (Manufacturing.js); the operation's verbs are Mantle's, called by the screens' transitions after
// AccessServices.check#Record, which check their permission and organization again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")
const {find, one, call, denied, ms} = lib
const WORK = "mantle.work.effort.WorkEffort"
const base = "/qapps/Manufacturing/"
const openStatuses = ["WeApproved", "WeInProgress", "WeOnHold"]
const blank = value => value == null || String(value).trim() === ""
const yes = value => value === true || value === "true" || value === "Y"
const operationUrl = id => base + "ShopFloor/OperationExecution?operationWorkEffortId=" + encodeURIComponent(id)
const shopFloorCapable = can => !!(can.operate || can.supervise || can.productionRead)

// ===== the station =====
// The board of the selected plant (or the plant given): its groups, the operations as cards with their links, the user's
// timer, the plants and what the user may do.
function station(p) {
    const userScope = manufacturing.required(manufacturing.scope())
    const can = userScope.capabilities
    if (!shopFloorCapable(can)) denied("PERMISSION_DENIED", "The shop floor is for production operators and supervisors")
    const plant = !blank(p.facilityId) ? null : manufacturing.selectedPlant(userScope)
    const plantId = !blank(p.facilityId) ? p.facilityId : plant?.facilityId || null
    const checked = plantId ? manufacturing.recordOf(userScope, "facility", plantId) : null
    const queue = call("mantle.work.ProductionServices.get#ShopFloorQueue", {
        facilityId: plantId,
        mine: yes(p.mine),
        includeDone: yes(p.includeDone)
    })
    const operationRows = Array.from(queue.operationRows || []).map(row =>
        Object.assign({}, row, {id: row.operationWorkEffortId, url: operationUrl(row.operationWorkEffortId)})
    )
    const plantOptions = Array.from(
        call("ironstone.manufacturing.AccessServices.get#Choices", {appRoot: "Manufacturing", choice: "plants"}).options || []
    )
    return {
        groups: Array.from(queue.groups || []),
        rows: operationRows,
        timer: queue.timer || null,
        truncated: !!queue.truncated,
        plantId,
        plantName: checked?.label || "",
        plantOptions,
        mine: yes(p.mine),
        can: {operate: !!can.operate, supervise: !!can.supervise}
    }
}

// ===== the scan =====
// The scan-input resolver (OperationExecution, Station): the user's operations a scanned or typed code names, an operation's
// id or a work order's id (its open operations), each checked again (the parameters are client input).
function scan(p) {
    const userScope = manufacturing.required(manufacturing.scope())
    const text = String(p.scanText || "").trim()
    if (!text) return {matches: []}
    const candidates = []
    const named = one(WORK, {workEffortId: text})
    if (named?.purposeEnumId === "WepProductionRun")
        for (const op of Array.from(
            find(WORK, {parentWorkEffortId: named.workEffortId})
                .condition("statusId", "in", openStatuses)
                .orderBy("operationSequenceNum")
                .limit(10)
                .list()
        ))
            candidates.push(op)
    else if (named?.workEffortTypeEnumId === "WetTask" && named.parentWorkEffortId) candidates.push(named)
    const matches = []
    for (const op of candidates)
        try {
            const checked = manufacturing.recordOf(userScope, "operation", op.workEffortId)
            matches.push({identityType: "operation", id: op.workEffortId, label: checked.label, detail: checked.detail})
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        }
    return {matches}
}

// ===== Today =====
// The user's due operations (design §1.2 Today; F41): the open operations of the work orders and operations they are assigned
// to, due by thruDate, each opening OperationExecution with its work order as the record. Mark done is not offered
// (canUpdate false): an operation completes on the shop floor. Another user's Today gets none, and so does a user without
// Manufacturing or a production permission.
function today(p) {
    const label = "Manufacturing"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = manufacturing.scope()
    if (!userScope.read || !shopFloorCapable(userScope.capabilities)) return {items: [], label}
    const thru = p.thruDate ? ms(p.thruDate) : null
    const queue = call("mantle.work.ProductionServices.get#ShopFloorQueue", {mine: true})
    const items = []
    for (const row of Array.from(queue.operationRows || [])) {
        const due = row.dueDate ? ms(row.dueDate) : null
        if (due == null || (thru != null && due >= thru)) continue
        items.push({
            kind: "productionOperation",
            workEffortId: row.operationWorkEffortId,
            requestId: null,
            title: row.operationName + " · " + row.runName,
            dueDate: new Date(due),
            startDate: null,
            endDate: null,
            allDay: false,
            priority: null,
            statusId: row.statusId,
            assignees: [],
            canUpdate: false,
            hasCallLink: false,
            url: operationUrl(row.operationWorkEffortId),
            record: {recordEntityName: WORK, recordId: row.workEffortId, recordName: row.runName}
        })
    }
    return {items, label}
}

const operations = {station, scan, today}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown shop floor operation " + op)
        return operations[op](parameters)
    }
})
