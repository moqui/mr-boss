// The production cost close queue (design-accounting ProductionCostClose, Home MyFinanceWork and CloseChecks; crosscut
// §3.24; impl-manufacturing P15): the organization's production runs waiting for Accounting, read for Accounting Home, the
// close checklist and ProductionCostClose's run lookup. A run is waiting when Manufacturing requested its cost review
// (review#ProductionCosts, the ProductionCostReview topic), when it is complete and not closed, or when it is closed and has
// cost events after the close (an adjustment). Mantle's mantle.ledger.ProductionCostServices previews and posts each.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const policy = lib.policy

const WORK = "mantle.work.effort.WorkEffort",
    EVENT = "mantle.work.production.ProductionCostEvent",
    LINE = "mantle.work.production.ProductionRunLine"
const LIMIT = 200
const kindTexts = {review: "Review requested", complete: "Complete, not cost closed", adjustment: "Cost events after the close"}
const kindColors = {review: "primary", complete: "warning", adjustment: "orange"}

function statusText(statusId) {
    return statusId ? policy.one("moqui.basic.StatusItem", {statusId})?.description || statusId : ""
}
// The runs of the organizations in scope that wait for the cost close, by kind: requested reviews first, then completed runs,
// then closed runs with late events; each with its product, review, accounting date and exception counts.
function queue(parameters) {
    const scope = lib.access(parameters)
    const c = scope.capabilities
    if (!c.reportRead && !c.glPost && !c.admin && !policy.lib.access.has("PRODUCTION_COST_POST"))
        throw new Error("Financial read authority is required")
    const organizationIds = scope.organizationPartyId ? [scope.organizationPartyId] : scope.allowedOrganizationPartyIds
    if (!organizationIds.length) return {queueRows: [], queueCount: 0, counts: {review: 0, complete: 0, adjustment: 0}}
    const runs = kind => {
        let query = policy.find(WORK, {purposeEnumId: "WepProductionRun"}).condition("ownerPartyId", "in", organizationIds)
        if (kind === "review") query = query.condition("productionCostReviewStatusId", "PcrRequested")
        else if (kind === "complete")
            query = query
                .condition("statusId", "WeComplete")
                .condition(
                    ec.entity.conditionFactory.makeCondition(
                        [
                            ec.entity.conditionFactory.makeCondition("productionCostReviewStatusId", "is-null", null),
                            ec.entity.conditionFactory.makeCondition("productionCostReviewStatusId", "not-equals", "PcrRequested")
                        ],
                        "or"
                    )
                )
        else query = query.condition("statusId", "WeClosed")
        return lib.array(query.orderBy("-lastUpdatedStamp").limit(LIMIT).list())
    }
    const closedIds = runs("adjustment").map(run => run.workEffortId)
    const late = closedIds.length
        ? new Set(
              lib
                  .array(
                      policy
                          .find(EVENT, {ledgerStatusEnumId: "PclAwaitingClose"})
                          .condition("workEffortId", "in", closedIds)
                          .selectField("workEffortId")
                          .distinct(true)
                          .list()
                  )
                  .map(row => row.workEffortId)
          )
        : new Set()
    const rows = []
    const seen = new Set()
    for (const [kind, list] of [
        ["review", runs("review")],
        ["complete", runs("complete")],
        ["adjustment", runs("adjustment").filter(run => late.has(run.workEffortId))]
    ])
        for (const run of list) {
            if (seen.has(run.workEffortId)) continue
            seen.add(run.workEffortId)
            rows.push(rowOf(run, kind))
        }
    const counts = {review: 0, complete: 0, adjustment: 0}
    for (const row of rows) counts[row.kind]++
    return {queueRows: rows, queueCount: rows.length, counts}
}
function rowOf(run, kind) {
    const output = policy.find(LINE, {workEffortId: run.workEffortId, lineRoleEnumId: "PrlrOutput"}).limit(1).list()[0]
    const product = output ? policy.one("mantle.product.Product", {productId: output.productId}) : null
    const events = lib.array(
        policy.find(EVENT, {workEffortId: run.workEffortId}).selectField("valuationStatusEnumId,ledgerStatusEnumId").list()
    )
    const unvalued = events.filter(event => event.valuationStatusEnumId === "PcvUnvalued").length
    const awaiting = events.filter(event => event.ledgerStatusEnumId === "PclAwaitingClose").length
    return {
        workEffortId: run.workEffortId,
        workEffortName: run.workEffortName || run.workEffortId,
        organizationPartyId: run.ownerPartyId,
        productId: output?.productId || null,
        productName: product?.productName || output?.productId || "",
        statusId: run.statusId,
        statusText: statusText(run.statusId),
        kind,
        kindText: kindTexts[kind],
        kindColor: kindColors[kind],
        reviewStatusText: statusText(run.productionCostReviewStatusId) || "Not requested",
        reviewDateText: lib.policy.lib.dateText(run.productionCostReviewDate),
        accountingDate: run.productionCostAccountingDate || null,
        reviewNote: run.productionCostReviewNote || null,
        unvaluedCount: unvalued,
        awaitingCount: awaiting,
        exceptionText: [unvalued ? unvalued + " not valued" : null, awaiting ? awaiting + " awaiting the close" : null]
            .filter(Boolean)
            .join(", ")
    }
}

const operations = {queue}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown production cost operation " + op)
        return operations[op](parameters)
    }
})
