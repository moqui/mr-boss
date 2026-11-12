// Maintenance's parts and stock (impl-maintenance P9, F31; design-maintenance §3 MaterialIssueReceipt's mount row, crosscut §3.9):
// a work order as Shared/MaterialIssueReceipt shows it under Maintenance/WorkOrders/MaterialIssueReceipt, Maintenance's own pair of
// services as Manufacturing's is (MaterialIssueReceipt.xml takes the source from the mounting app). The lines are the work order's
// planned parts (Mantle's get#MaintenanceMaterials: needed, issued, returned and left, the stock to issue from), Return unused lists
// the issues with something left to return, and History the issues and returns once each (value only with
// MAINTENANCE_COST_VIEW). Each posting runs after check#Record of the work order and through its Mantle guard
// (MaintenanceExecutionServices issue# and return#MaintenanceMaterial: STOCK_ISSUE in the stock's facility, the assigned technician
// or a supervisor), which checks everything again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenance = ec.resource.script("component://mr-boss/service/ironstone/maintenance/Maintenance.js")
const {call, denied} = lib
const M = "mantle.work.MaintenanceExecutionServices."

const number = value => (value == null || value === "" ? 0 : Number(String(value)))

function materialSource(p) {
    const workEffortId = p.sourceId || p.workEffortId
    if (!workEffortId) denied("RECORD_REQUIRED", "Choose the work order")
    const found = maintenance.execute("checkRecord", {recordType: "workOrder", recordId: workEffortId})
    const rootId = found.rootWorkEffortId || workEffortId
    const order = call("mantle.work.MaintenanceServices.get#MaintenanceWorkOrder", {workEffortId: rootId}).workOrder
    const parts = call(M + "get#MaintenanceMaterials", {workEffortId: rootId, withStock: true})
    const materialRows = Array.from(parts.plannedList || []).map(row => {
        const left = number(row.left)
        const canAct = !!parts.canIssue && left > 0 && row.stockOptions.length > 0
        return {
            lineKey: row.lineKey,
            lineTitle: row.productName,
            productName: row.productName,
            assemblyName: row.stepName,
            required: number(row.quantity),
            issued: number(row.issued),
            returned: number(row.returned),
            left,
            shortText: parts.canIssue && left > 0 && !row.stockOptions.length ? "No free stock in your facilities" : "",
            heldText: "",
            stagedText: "",
            canAct,
            assetOptions: canAct ? row.stockOptions : []
        }
    })
    const issuances = Array.from(parts.issuanceList || [])
    const returnRows = issuances
        .filter(row => number(row.returnable) > 0)
        .map(row => ({
            assetIssuanceId: row.assetIssuanceId,
            productName: row.productName,
            assetId: row.assetId,
            lotId: row.lotId || "",
            operationName: row.stepName,
            issued: number(row.quantity),
            returnable: number(row.returnable),
            canReturn: !!row.canReturn
        }))
    const movementRows = issuances
        .map(row => ({
            kind: "Issue" + (row.workEffortId !== rootId ? " · " + row.stepName : ""),
            productName: row.productName,
            assetId: row.assetId,
            lotId: row.lotId || "",
            quantity: number(row.quantity),
            sortKey: lib.ms(row.issuedDate) ?? 0,
            dateText: row.issuedDateText,
            valueText: row.valueText
        }))
        .concat(
            Array.from(parts.receiptList || []).map(row => ({
                kind: "Unused return" + (row.reason ? " · " + row.reason : ""),
                productName: row.productName,
                assetId: row.assetId,
                lotId: row.lotId || "",
                quantity: number(row.quantity),
                sortKey: lib.ms(row.receivedDate) ?? 0,
                dateText: row.receivedDateText,
                valueText: row.valueText
            }))
        )
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(row => {
            delete row.sortKey
            return row
        })
    return {
        found: true,
        sourceType: "maintenanceWork",
        source: {
            sourceId: rootId,
            title: "Parts of work order " + rootId,
            caption: [order.workEffortName, order.targetName, order.organizationName].filter(Boolean).join(" · "),
            statusText: order.statusText,
            detailText: parts.stockIssue
                ? parts.canIssue
                    ? ""
                    : "Parts are issued by the technician assigned to the work or a supervisor, to approved or started work"
                : "Issuing and returning parts needs the stock issue permission",
            emptyText: "No parts are planned for this work order; plan them on its Parts tab.",
            actionText: "Issue",
            submitText: "Issue part",
            actionField: "asset",
            words: {
                groupTitle: "Step",
                doneTitle: "Issued",
                historyTitle: "Issues and returns",
                historyEmpty: "Nothing is issued to this work order yet."
            },
            links: [
                {
                    text: "Back to the work order",
                    path: "WorkOrders/WorkOrderDetail",
                    icon: "sym_o_handyman",
                    primary: false,
                    parameters: {workEffortId: rootId}
                }
            ]
        },
        materialRows,
        outputRows: [],
        returnRows,
        trackingRows: [],
        movementRows,
        filesRecordId: null,
        financialRead: !!parts.costRead,
        canPack: false,
        packageOptions: [],
        activePackageSeqId: null
    }
}

// The posting a form asks for: issue a planned line (its node and product from lineKey) from the chosen stock, or return part of
// an issuance (lineKey). The record check is of the work order (a step reads as its work order); the Mantle entry point checks
// the stock permission, the assignment and everything else again.
function materialAction(p) {
    const workEffortId = p.workEffortId || p.sourceId
    const kind = p.actionKind || "issue"
    if (kind === "return")
        return {
            recordType: "workOrder",
            recordId: workEffortId,
            capability: null,
            serviceName: M + "return#MaintenanceMaterial",
            parameters: {
                operationKey: p.operationKey,
                assetIssuanceId: p.lineKey,
                quantity: p.quantity,
                toLocationSeqId: p.toLocationSeqId || null
            },
            doneText: "Returned " + p.quantity + " unused"
        }
    if (kind !== "issue") denied("ACTION_INVALID", "This action is not available for maintenance work")
    const [nodeId, productId] = String(p.lineKey || "").split("__")
    if (!nodeId || !productId) denied("LINE_INVALID", "Choose a planned part")
    return {
        recordType: "workOrder",
        recordId: nodeId,
        capability: null,
        serviceName: M + "issue#MaintenanceMaterial",
        parameters: {operationKey: p.operationKey, workEffortId: nodeId, productId, assetId: p.assetId, quantity: p.quantity},
        doneText: "Issued " + p.quantity
    }
}

const operations = {materialSource, materialAction}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Maintenance materials operation " + op)
        return operations[op](parameters)
    }
})
