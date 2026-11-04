// Manufacturing's materials and stock (impl-manufacturing P5b; design-manufacturing Components and MaterialIssueReceipt,
// crosscut §3.9's Manufacturing row): the production run as Shared/MaterialIssueReceipt shows it under
// WorkOrders/WorkOrderDetail (Warehouse's production run source, Production.js runSource, read with Manufacturing's scope and
// record check, its material lines from mantle.work.ProductionServices.get#ProductionMaterials: required, issued, returned
// and left apart, what is short and held, the stock to issue from), the backflush preview when the run's policy backflushes,
// and the Mantle entry point of each posting (issue, return unused, receive output, confirm backflush), which the screen's
// materialAction runs after check#Record of the run with issue (STOCK_ISSUE). Home's work order counts, due work and
// shortages. Every Mantle verb checks its own permission, organization and facility again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")
const {call, denied} = lib
const P = "mantle.work.ProductionServices."

const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const released = ["WeApproved", "WeInProgress"]

// Manufacturing's app for Warehouse's run source: the Manufacturing scope (STOCK_ISSUE is its issue capability), the run's
// record check, and no stock options of its own (the lines' come from get#ProductionMaterials).
const manufacturingApp = {
    scope: () => manufacturing.required(manufacturing.scope()),
    recordOf: (userScope, workEffortId) => manufacturing.recordOf(userScope, "run", workEffortId),
    stockOptions: () => []
}

function materialSource(p) {
    const workEffortId = p.sourceId || p.workEffortId
    if (!workEffortId) denied("RECORD_REQUIRED", "Choose the work order")
    const production = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Production.js")
    const source = production.runSource({sourceId: workEffortId}, manufacturingApp)
    const userScope = manufacturing.scope()
    const materials = call(P + "get#ProductionMaterials", {workEffortId, withStock: true})
    const run = materials.run
    const canIssue = !!userScope.capabilities.issue && !!materials.canIssue
    source.materialRows = Array.from(materials.materialRows || []).map(row => ({
        lineKey: row.productionRunLineId,
        lineTitle: row.productName,
        productName: row.productName,
        assemblyName: row.operationName || "",
        required: number(row.required),
        issued: number(row.issued),
        returned: number(row.returned),
        left: number(row.remaining),
        shortText: row.short ? "Short " + quantityText(row.short) : "",
        heldText: number(row.held) > 0 ? "Held " + quantityText(row.held) : "",
        // a line released short is offered again once the free stock covers it: its first issue clears the block
        stagedText: row.stagedShort && row.short ? "Released short: issued once stock covers it" : "",
        canAct: canIssue && !!row.canIssue && !(row.stagedShort && row.short),
        assetOptions: canIssue && row.canIssue ? Array.from(row.stockOptions || []) : []
    }))
    // the source's words in Manufacturing; Stage opens Warehouse's Move with the run fixed for those who move stock (there
    // is no WIP location, R-MFG-03)
    source.source.title = "Materials of work order " + run.workEffortId
    source.source.links =
        userScope.capabilities.move && released.includes(run.statusId)
            ? [
                  {
                      text: "Stage stock",
                      url: "/qapps/Warehouse/Transfers/Move",
                      icon: "sym_o_move_down",
                      primary: false,
                      parameters: {workEffortId: run.workEffortId, facilityId: run.facilityId}
                  }
              ]
            : []
    source.source.policyText =
        materials.policy.consumptionText + (materials.policy.issuePointText ? " · " + materials.policy.issuePointText : "")
    // the backflush preview when the run's policy backflushes, for those who issue
    source.backflush = null
    if (canIssue && materials.policy.backflush) {
        try {
            const preview = lib.probe(P + "preview#ProductionBackflush", {workEffortId})
            source.backflush = {
                canConfirm: !!preview.canConfirm,
                previewKey: preview.previewKey,
                lineRows: Array.from(preview.lineRows || []).map(row => ({
                    productionRunLineId: row.productionRunLineId,
                    productName: row.productName,
                    quantity: number(row.quantity),
                    pickText: row.pickText || "",
                    shortText: row.short ? "Short " + quantityText(row.short) : ""
                })),
                findingText: Array.from(preview.findings || [])
                    .map(row => row.message)
                    .join("; ")
            }
        } catch (error) {
            ec.logger.error("Backflush preview of work order " + workEffortId + " failed: " + error.message)
        }
    }
    return source
}

// A posting of the run, each through its Mantle guard after check#Record of the run with issue; the guard checks
// everything again. Issue, return and receive are Warehouse's run actions; backflush confirms the preview shown.
function materialAction(p) {
    const workEffortId = p.sourceId || p.workEffortId
    const base = {recordType: "run", recordId: workEffortId, capability: "issue"}
    if (p.actionKind === "backflush")
        return Object.assign(base, {
            serviceName: P + "backflush#ProductionMaterials",
            parameters: {operationKey: p.operationKey, workEffortId, previewKey: p.previewKey},
            doneText: "Backflushed the material of work order " + workEffortId
        })
    const production = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Production.js")
    return production.runAction(Object.assign({}, p, {sourceId: workEffortId}))
}

// ===== Home =====
// The plant's open, in-progress and late work orders and those short of material (counted only for production readers:
// null shows "Unavailable"), and the queue of due work and shortages: the earliest due open runs and the short ones, each
// with its shortage, linking the run (its Components tab when short).
function home(p) {
    const can = manufacturing.scope().capabilities
    if (!can.productionRead) return {summary: {}, queueRows: []}
    const facilityId = p.plantId || null
    const count = filters => {
        try {
            return number(call(P + "find#ProductionOrders", Object.assign({facilityId, pageSize: 1}, filters)).orderRowsCount)
        } catch (error) {
            ec.logger.error("Work order count " + JSON.stringify(filters) + " failed: " + error.message)
            return null
        }
    }
    let shortages = {shortRows: [], shortRunCount: null}
    try {
        shortages = call(P + "get#ProductionShortages", {facilityId})
    } catch (error) {
        ec.logger.error("Work order shortages failed: " + error.message)
    }
    const due = Array.from(call(P + "find#ProductionOrders", {facilityId, orderByField: "due", pageSize: 10}).orderRows || [])
    const shortByRun = new Map(Array.from(shortages.shortRows || []).map(row => [row.workEffortId, row]))
    const rows = new Map()
    const base = "/qapps/Manufacturing/WorkOrders/WorkOrderDetail"
    for (const row of due)
        rows.set(row.workEffortId, {
            title: row.workEffortId + " · " + (row.workEffortName || ""),
            url: base + (shortByRun.has(row.workEffortId) ? "/Components" : "") + "?workEffortId=" + row.workEffortId,
            productName: row.productName || "",
            dueText: row.dueText || "",
            sortKey: lib.ms(row.estimatedCompletionDate) ?? Infinity,
            workCenterName: row.facilityName || "",
            statusText: row.statusText + (row.late ? " · late" : ""),
            shortageText: shortByRun.get(row.workEffortId)?.shortageText || ""
        })
    for (const row of Array.from(shortages.shortRows || []).slice(0, 10))
        if (!rows.has(row.workEffortId))
            rows.set(row.workEffortId, {
                title: row.workEffortId + " · " + (row.workEffortName || ""),
                url: base + "/Components?workEffortId=" + row.workEffortId,
                productName: "",
                dueText: row.dueText || "",
                sortKey: lib.ms(row.estimatedCompletionDate) ?? Infinity,
                workCenterName: "",
                statusText: row.statusText,
                shortageText: row.shortageText
            })
    return {
        summary: {
            openCount: count({}),
            inProgressCount: count({statusId: "WeInProgress"}),
            lateCount: count({late: "Y"}),
            shortCount: shortages.shortRunCount
        },
        queueRows: Array.from(rows.values())
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(row => {
                delete row.sortKey
                return row
            })
    }
}

const operations = {materialSource, materialAction, home}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Manufacturing materials operation " + op)
        return operations[op](parameters)
    }
})
