// Purchasing's performance and report reads (design-purchasing §11; impl-purchasing P15, §2): the supplier scorecards and an
// evaluation's measures, evidence and risks (Mantle's SupplierScorecard records), spend, budget commitments, the
// procurement tracker, purchase history and the supplier statement. Each checks the user's Purchasing scope (the buying
// lists, their organizations and suppliers, the record checks of Purchasing.js), reads only the user's organizations, and
// answers its snapshot time, its filters and what it left out. A value the user may not read is left out of the answer and
// named as withheld, never shown as zero (§2): supplier prices (ordered and received amounts) to whoever works the orders
// or reads supplier prices or the books (Orders.js's rule), bill amounts also to a payables reader (Bills.js's rule),
// payments to a finance reader (ACCOUNTING_VIEW or PAYABLE_VIEW), budget commitments to a financial reader (ACCOUNTING_VIEW
// or ACCOUNTING_ADMIN, Mantle's budget read). The supplier statement is a finance reader's only. Each report's export
// (output csv) is the same rows with its filters, snapshot time and omitted-data warning, text that a spreadsheet would read
// as a formula guarded.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, denied, access} = lib

const SCORECARD = "mantle.party.supplier.SupplierScorecard",
    MEASURE = "mantle.party.supplier.SupplierScorecardMeasure",
    EVIDENCE = "mantle.party.supplier.SupplierScorecardEvidence",
    RISK = "mantle.party.supplier.SupplierRisk",
    COMMITMENT = "mantle.other.budget.BudgetCommitment",
    RECEIPT = "mantle.product.receipt.AssetReceipt",
    ORDER = "mantle.order.OrderHeader",
    REQUEST = "mantle.request.Request",
    INVOICE = "mantle.account.invoice.Invoice"
const dayMs = 86400000
const readCap = 5000
const withheld = "Withheld"
const quoteStatuses = ["OrderRequested", "OrderProposed"]
const deadOrderStatuses = ["OrderCancelled", "OrderRejected"]
const metricNames = {
    SsmOnTime: "On-time delivery",
    SsmQuality: "Quality acceptance",
    SsmPriceVariance: "Price variance",
    SsmResponse: "RFQ response"
}
const resultColors = {SsrScored: "positive", SsrInsufficient: "grey-8"}
const effectColors = {SseWarn: "warning", SseReview: "warning", SseBlock: "negative"}
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value ?? 0)
const zero = () => toDecimal(0)
const ms = lib.ms
const now = () => ms(ec.user.nowTimestamp)
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const plain = (value, scale = 2) => (value == null ? null : ec.l10n.format(dec(value), scale ? "0." + "0".repeat(scale) : "0"))
const quantityText = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const percentText = value => (value == null ? "" : ec.l10n.format(dec(value), "0.#") + "%")
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const dayOf = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "yyyy-MM-dd"))
const monthOf = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "yyyy-MM"))
function chunks(list, size = 500) {
    const out = []
    for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size))
    return out
}
function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return {}
    const out = {}
    for (const part of chunks(ids))
        for (const row of find(entity).condition(field, "in", part).list()) out[row[field]] = row[nameField] || row[field]
    return out
}
function productNames(ids) {
    const out = {}
    for (const part of chunks(unique(ids)))
        for (const row of find("mantle.product.Product").condition("productId", "in", part).list())
            out[row.productId] = (row.pseudoId || row.productId) + (row.productName ? " · " + row.productName : "")
    return out
}

// ===== scope, period and the answer's frame =====
// The reader's scope: Purchasing with the buying lists, the organizations asked for (one of the user's) or every one of
// theirs, and the supplier and product asked for, each checked by Purchasing.js; what the user may read.
function scopeOf(p) {
    const userScope = purchasing.required()
    const can = userScope.capabilities
    if (!can.listRead) denied("PERMISSION_DENIED", "Purchasing reports are not available")
    let organizationPartyIds
    if (blank(p.organizationPartyId)) organizationPartyIds = purchasing.buyerIds(userScope)
    else {
        if (!purchasing.owns(userScope, String(p.organizationPartyId)))
            denied("RECORD_UNAVAILABLE", "Organization " + p.organizationPartyId + " is not available")
        organizationPartyIds = [String(p.organizationPartyId)]
    }
    if (!blank(p.supplierPartyId)) purchasing.recordOf(userScope, "supplier", String(p.supplierPartyId))
    if (!blank(p.productId)) purchasing.recordOf(userScope, "product", String(p.productId))
    return {
        userScope,
        can,
        organizationPartyIds: organizationPartyIds.length ? organizationPartyIds : ["_NA_"],
        priceRead: !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead),
        billRead: !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead || can.payableRead),
        financeRead: !!(can.financialRead || can.payableRead),
        budgetRead: !!(can.financialRead || access.has("ACCOUNTING_ADMIN"))
    }
}
// The start of a day (yyyy-MM-dd) in the user's time zone, in milliseconds.
const dayStart = day => ms(ec.l10n.parseTimestamp(String(day).slice(0, 10), "yyyy-MM-dd"))
// The period [from, thru) of a report: the days given, the through day included whole, else defaultDays to the end of today.
// Refuses one that ends before it starts or is longer than two years (PERIOD_INVALID).
function periodOf(p, defaultDays) {
    const dayOrStamp = value => (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim()) ? dayStart(value) : ms(value))
    const thruDay = blank(p.thruDate)
        ? dayOf(now())
        : /^\d{4}-\d{2}-\d{2}/.test(String(p.thruDate))
          ? String(p.thruDate).slice(0, 10)
          : dayOf(p.thruDate)
    const thru = dayStart(ec.l10n.format(new Date(dayStart(thruDay) + dayMs + 3 * 3600000), "yyyy-MM-dd"))
    const from = blank(p.fromDate) ? thru - defaultDays * dayMs : dayOrStamp(p.fromDate)
    if (!Number.isFinite(from) || !Number.isFinite(thru) || thru <= from)
        denied("PERIOD_INVALID", "Choose a period that ends after it starts")
    if (thru - from > 731 * dayMs) denied("PERIOD_INVALID", "A report period is at most two years")
    return {from, thru, text: dayOf(from) + " to " + thruDay}
}
// The frame every report answers: the snapshot time, the filters in words and what it left out (each a sentence).
function frame(scope, filters, omitted) {
    const names = lib.partyNames(scope.organizationPartyIds)
    const filterParts = [
        "Organizations: " + scope.organizationPartyIds.map(id => names[id] || id).join(", "),
        ...filters.filter(Boolean)
    ]
    const omittedList = unique(omitted)
    return {
        asOf: ec.user.nowTimestamp,
        asOfText: lib.dateText(ec.user.nowTimestamp),
        filtersText: filterParts.join(" · "),
        omittedText: omittedList.join(" "),
        complete: !omittedList.length,
        canExport: true
    }
}
const supplierFilter = p =>
    blank(p.supplierPartyId) ? null : "Supplier: " + (lib.partyNames([p.supplierPartyId])[p.supplierPartyId] || p.supplierPartyId)
const productFilter = p => (blank(p.productId) ? null : "Product: " + (productNames([p.productId])[p.productId] || p.productId))

// ===== the export =====
// A cell for a spreadsheet: a number column's value as a plain number; any other text that a spreadsheet would read as a
// formula (starting =, +, -, @, a tab or a carriage return) behind an apostrophe; quoted when it holds a comma, a quote
// or a line break.
function csvCell(value, numeric) {
    let text = value == null ? "" : String(value)
    if (!(numeric && /^-?\d+(\.\d+)?$/.test(text)) && /^[=+\-@\t\r]/.test(text)) text = "'" + text
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}
// The export: the report's title, filters, snapshot time and what it left out, then the columns and rows.
function csvOf(title, answer, columns, list) {
    const lines = [
        [title],
        ["Filters", answer.filtersText],
        ["As of", answer.asOfText],
        ["Left out", answer.omittedText || "Nothing"],
        []
    ].map(cells => cells.map(cell => csvCell(cell, false)).join(","))
    lines.push(columns.map(column => csvCell(column.title, false)).join(","))
    for (const row of list) lines.push(columns.map(column => csvCell(row[column.field], !!column.number)).join(","))
    return lines.join("\r\n") + "\r\n"
}
function exported(p, answer, title, fileBase, columns, list) {
    if (p.output !== "csv") return answer
    return Object.assign(answer, {
        csvText: csvOf(title, answer, columns, list),
        fileName: fileBase + "-" + dayOf(now()) + ".csv"
    })
}
function page(list, p, field) {
    return lib.pageList(list, p, field, {noLimitCap: readCap})
}

// ===== the purchase orders read =====
// The placed purchase order lines of the organizations (never a quote that was not placed), by supplier, product, placed
// date and facility; at most readCap, with truncated set when more.
function orderLines(scope, p, period, options = {}) {
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", scope.organizationPartyIds)
        .condition("placedDate", "is-not-null", null)
        .condition("statusId", "not-in", quoteStatuses.concat(options.withCancelled ? [] : deadOrderStatuses))
    if (period) {
        query = query.condition("placedDate", "greater-equals", new Date(period.from))
        query = query.condition("placedDate", "less-than", new Date(period.thru))
    }
    if (!blank(p.supplierPartyId)) query = query.condition("vendorPartyId", String(p.supplierPartyId))
    if (!blank(p.facilityId)) query = query.condition("facilityId", String(p.facilityId))
    if (options.orderIds) query = query.condition("orderId", "in", options.orderIds.length ? options.orderIds : ["_NA_"])
    const internal = rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    const parts = Array.from(
        query
            .orderBy("-placedDate")
            .limit(readCap + 1)
            .list()
    ).filter(part => !internal.includes(part.vendorPartyId))
    const truncated = parts.length > readCap
    const byOrder = Object.fromEntries(parts.slice(0, readCap).map(part => [part.orderId + ":" + part.orderPartSeqId, part]))
    const lines = []
    for (const ids of chunks(unique(Object.values(byOrder).map(part => part.orderId)))) {
        let itemQuery = find("mantle.order.OrderItem").condition("orderId", "in", ids)
        if (!blank(p.productId)) itemQuery = itemQuery.condition("productId", String(p.productId))
        for (const item of itemQuery.list()) {
            const part = byOrder[item.orderId + ":" + item.orderPartSeqId]
            if (part) lines.push({item, part})
        }
    }
    return {lines, truncated}
}

// ===== scorecards =====
function measureText(measure, scope) {
    if (!measure) return ""
    if (measure.measureValue == null) return "No data"
    const value = percentText(measure.measureValue)
    if (measure.metricEnumId === "SsmPriceVariance")
        return scope.priceRead ? value + " (" + plain(measure.numerator) + " of " + plain(measure.denominator) + ")" : value
    return value + " (" + quantityText(measure.numerator) + " of " + quantityText(measure.denominator) + ")"
}
function scorecardRow(row, measures, names, scope) {
    const insufficient = row.resultEnumId === "SsrInsufficient"
    const byMetric = Object.fromEntries(measures.map(measure => [measure.metricEnumId, measure]))
    return {
        supplierScorecardId: row.supplierScorecardId,
        supplierPartyId: row.supplierPartyId,
        supplierName: names[row.supplierPartyId] || row.supplierPartyId,
        organizationPartyId: row.organizationPartyId,
        organizationName: names[row.organizationPartyId] || row.organizationPartyId,
        periodText: dayOf(row.periodFromDate) + " to " + dayOf(ms(row.periodThruDate) - 1),
        resultEnumId: row.resultEnumId,
        resultText: enumText(row.resultEnumId),
        resultColor: resultColors[row.resultEnumId] || "grey-8",
        score: row.score == null ? null : plain(row.score, 1),
        scoreText: insufficient ? "Insufficient data" : row.score == null ? "Not scored" : plain(row.score, 1),
        eligibleText: row.eligibleCount + " of " + row.minimumSample + " receipts",
        onTimeText: measureText(byMetric.SsmOnTime, scope),
        qualityText: measureText(byMetric.SsmQuality, scope),
        priceText: measureText(byMetric.SsmPriceVariance, scope),
        responseText: measureText(byMetric.SsmResponse, scope),
        effectText: enumText(row.effectEnumId) || "None",
        effectColor: effectColors[row.effectEnumId] || "grey-8",
        evaluatedText: lib.dateText(row.evaluatedDate),
        missingDataText: row.missingDataText || "",
        url: "/qapps/Purchasing/Performance/ScorecardDetail?supplierScorecardId=" + encodeURIComponent(row.supplierScorecardId)
    }
}
const scorecardColumns = [
    {field: "supplierName", title: "Supplier"},
    {field: "organizationName", title: "Organization"},
    {field: "periodText", title: "Period"},
    {field: "resultText", title: "Result"},
    {field: "score", title: "Score", number: true},
    {field: "eligibleText", title: "Eligible receipts"},
    {field: "onTimeText", title: "On-time delivery"},
    {field: "qualityText", title: "Quality acceptance"},
    {field: "priceText", title: "Price variance"},
    {field: "responseText", title: "RFQ response"},
    {field: "effectText", title: "Response"},
    {field: "evaluatedText", title: "Evaluated"},
    {field: "missingDataText", title: "Missing data"}
]
// find#SupplierScorecards: the evaluations of the user's organizations, the latest of each supplier by default (view all
// for every one), by supplier, result and a score below, newest first.
function findScorecards(p) {
    const scope = scopeOf(p)
    let query = find(SCORECARD).condition("organizationPartyId", "in", scope.organizationPartyIds).orderBy("-evaluatedDate")
    if (!blank(p.supplierPartyId)) query = query.condition("supplierPartyId", String(p.supplierPartyId))
    // the result and score filters apply to the latest evaluation of each supplier (or to every one, view all), so an older
    // evaluation never stands in for a supplier's latest
    if (p.view === "all") {
        if (!blank(p.resultEnumId)) query = query.condition("resultEnumId", String(p.resultEnumId))
        if (!blank(p.scoreBelow)) query = query.condition("score", "less-than", dec(p.scoreBelow))
    }
    const found = Array.from(query.limit(readCap + 1).list())
    const omitted = []
    if (found.length > readCap) omitted.push("Only the newest " + readCap + " evaluations are read.")
    const seen = new Set()
    const list = found
        .slice(0, readCap)
        .filter(row => {
            if (p.view === "all") return true
            const key = row.organizationPartyId + ":" + row.supplierPartyId
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .filter(
            row =>
                p.view === "all" ||
                ((blank(p.resultEnumId) || row.resultEnumId === String(p.resultEnumId)) &&
                    (blank(p.scoreBelow) || (row.score != null && dec(row.score).compare(dec(p.scoreBelow)) < 0)))
        )
    // only the suppliers the user may work with
    const suppliers = {}
    const visible = list.filter(
        row => (suppliers[row.supplierPartyId] ??= !!purchasing.supplierOf(scope.userScope, row.supplierPartyId))
    )
    if (visible.length < list.length) omitted.push("Evaluations of suppliers outside your scope are left out.")
    const paged = page(visible, p, "scorecardRows")
    const ids = paged.scorecardRows.map(row => row.supplierScorecardId)
    const measures = ids.length ? Array.from(find(MEASURE).condition("supplierScorecardId", "in", ids).list()) : []
    const names = lib.partyNames(paged.scorecardRows.flatMap(row => [row.supplierPartyId, row.organizationPartyId]))
    if (!scope.priceRead) omitted.push("Price variance amounts are withheld; the percentage shows.")
    paged.scorecardRows = paged.scorecardRows.map(row =>
        scorecardRow(
            row,
            measures.filter(measure => measure.supplierScorecardId === row.supplierScorecardId),
            names,
            scope
        )
    )
    const answer = Object.assign(
        frame(
            scope,
            [supplierFilter(p), p.view === "all" ? "Every evaluation" : "The latest evaluation of each supplier"],
            omitted
        ),
        paged,
        {canEvaluate: !!scope.can.scorecardEdit}
    )
    return exported(p, answer, "Supplier scorecards", "Supplier-scorecards", scorecardColumns, paged.scorecardRows)
}
// The evaluation asked for, of one of the user's organizations and a supplier in scope (RECORD_UNAVAILABLE otherwise).
function scorecardOf(scope, supplierScorecardId) {
    const row = blank(supplierScorecardId) ? null : one(SCORECARD, {supplierScorecardId: String(supplierScorecardId)})
    if (
        !row ||
        !scope.organizationPartyIds.includes(row.organizationPartyId) ||
        !purchasing.supplierOf(scope.userScope, row.supplierPartyId)
    )
        denied("RECORD_UNAVAILABLE", "Evaluation " + (supplierScorecardId || "") + " is not available")
    return row
}
const evidenceColumns = [
    {field: "metricText", title: "Measure"},
    {field: "sourceText", title: "Source"},
    {field: "dueText", title: "Due"},
    {field: "dueBasisText", title: "Due basis"},
    {field: "promisedText", title: "Latest promise"},
    {field: "eventText", title: "Received or answered"},
    {field: "quantity", title: "Quantity", number: true},
    {field: "numerator", title: "Counted", number: true},
    {field: "denominator", title: "Of", number: true},
    {field: "exceptionText", title: "Exception"},
    {field: "excludedReason", title: "Left out because"}
]
// get#SupplierScorecard: one evaluation with its measures (numerators, denominators, weights, the criterion it applied),
// its evidence, the supplier's risks with the organization and its other evaluations.
function getScorecard(p) {
    const scope = scopeOf({})
    const row = scorecardOf(scope, p.supplierScorecardId)
    const names = lib.partyNames([row.supplierPartyId, row.organizationPartyId])
    const measures = rows(MEASURE, {supplierScorecardId: row.supplierScorecardId})
    const omitted = []
    if (!scope.priceRead) omitted.push("Price variance amounts are withheld; the percentage shows.")
    const priceHidden = metricEnumId => metricEnumId === "SsmPriceVariance" && !scope.priceRead
    const measureRows = Object.keys(metricNames)
        .map(metricEnumId => measures.find(measure => measure.metricEnumId === metricEnumId))
        .filter(Boolean)
        .map(measure => ({
            metricEnumId: measure.metricEnumId,
            metricText: metricNames[measure.metricEnumId],
            numerator: priceHidden(measure.metricEnumId) ? null : plain(measure.numerator, 3),
            denominator: priceHidden(measure.metricEnumId) ? null : plain(measure.denominator, 3),
            countText: priceHidden(measure.metricEnumId)
                ? withheld
                : quantityText(measure.numerator) + " of " + quantityText(measure.denominator),
            eligibleCount: measure.eligibleCount,
            excludedCount: measure.excludedCount,
            valueText: measure.measureValue == null ? "No data" : percentText(measure.measureValue),
            scoreText: measure.score == null ? "" : plain(measure.score, 1),
            weightText: plain(measure.weight, 0),
            rangeText:
                (measure.metricEnumId === "SsmPriceVariance" ? "Target at most " : "Target ") +
                plain(measure.targetValue, 1) +
                "%, floor " +
                plain(measure.floorValue, 1) +
                "%",
            criterionText: measure.criterionFromDate ? "Since " + lib.dateText(measure.criterionFromDate) : "Built-in",
            missingText: measure.missingText || ""
        }))
    const evidence = Array.from(find(EVIDENCE, {supplierScorecardId: row.supplierScorecardId}).orderBy("evidenceSeqId").list())
    const evidenceRows = evidence
        .filter(each => blank(p.metricEnumId) || each.metricEnumId === p.metricEnumId)
        .map(each => ({
            evidenceSeqId: each.evidenceSeqId,
            metricEnumId: each.metricEnumId,
            metricText: metricNames[each.metricEnumId] || each.metricEnumId,
            orderId: each.orderId,
            sourceText: each.requestId
                ? "RFQ " + each.requestId + " · quote " + each.orderId
                : each.orderId
                  ? "Order " +
                    each.orderId +
                    (each.orderItemSeqId ? ":" + each.orderItemSeqId : "") +
                    (each.assetReceiptId ? " · receipt " + each.assetReceiptId : "") +
                    (each.invoiceId ? " · bill " + each.invoiceId : "")
                  : "",
            orderUrl: each.orderId ? purchasing.recordUrl(each.requestId ? "quote" : "order", each.orderId) : null,
            dueText: lib.dateText(each.dueDate),
            dueBasisText: each.dueBasisText || "",
            promisedText: lib.dateText(each.promisedDate),
            eventText: lib.dateText(each.eventDate),
            quantity: each.quantity == null ? null : plain(each.quantity, 3),
            numerator: priceHidden(each.metricEnumId) || each.numerator == null ? null : plain(each.numerator, 3),
            denominator: priceHidden(each.metricEnumId) || each.denominator == null ? null : plain(each.denominator, 3),
            exceptionText: each.exceptionText || "",
            excludedReason: each.excludedReason || "",
            counted: !each.excludedReason
        }))
    const at = now()
    const riskRows = rows(RISK, {organizationPartyId: row.organizationPartyId, supplierPartyId: row.supplierPartyId})
        .sort((a, b) => ms(b.fromDate) - ms(a.fromDate))
        .map(risk => ({
            supplierRiskId: risk.supplierRiskId,
            severityText: enumText(risk.severityEnumId),
            severityColor: ["SrsHigh", "SrsCritical"].includes(risk.severityEnumId) ? "negative" : "warning",
            categoryText: enumText(risk.categoryEnumId),
            description: risk.description || "",
            responseText: risk.responseText || "",
            ownerName: risk.ownerPartyId ? lib.partyNames([risk.ownerPartyId])[risk.ownerPartyId] || risk.ownerPartyId : "",
            fromText: lib.dateText(risk.fromDate),
            thruText: lib.dateText(risk.thruDate),
            active: lib.active(risk, ec.user.nowTimestamp),
            stateText: lib.active(risk, ec.user.nowTimestamp) ? "Active" : ms(risk.fromDate) > at ? "Starts later" : "Ended"
        }))
    const history = Array.from(
        find(SCORECARD, {organizationPartyId: row.organizationPartyId, supplierPartyId: row.supplierPartyId})
            .orderBy("-evaluatedDate")
            .limit(21)
            .list()
    )
    const historyMeasures = history.length
        ? Array.from(
              find(MEASURE)
                  .condition(
                      "supplierScorecardId",
                      "in",
                      history.map(each => each.supplierScorecardId)
                  )
                  .list()
          )
        : []
    const paged = page(evidenceRows, p, "evidenceRows")
    const answer = Object.assign(
        frame(scope, ["Evaluation " + row.supplierScorecardId], omitted),
        {
            scorecard: Object.assign(scorecardRow(row, measures, names, scope), {
                policyText: row.policyFromDate
                    ? "Scorecard policy since " + lib.dateText(row.policyFromDate)
                    : "Built-in scorecard policy",
                dueDateBasisText: enumText(row.dueDateBasisEnumId),
                evaluatedByText: row.evaluatedByUserId || "",
                previousScorecardId: row.previousScorecardId || null,
                previousUrl: row.previousScorecardId
                    ? "/qapps/Purchasing/Performance/ScorecardDetail?supplierScorecardId=" + row.previousScorecardId
                    : null,
                supplierUrl: purchasing.recordUrl("supplier", row.supplierPartyId)
            }),
            measureRows,
            riskRows,
            historyRows: history
                .filter(each => each.supplierScorecardId !== row.supplierScorecardId)
                .slice(0, 20)
                .map(each =>
                    scorecardRow(
                        each,
                        historyMeasures.filter(measure => measure.supplierScorecardId === each.supplierScorecardId),
                        names,
                        scope
                    )
                ),
            canEvaluate: !!scope.can.scorecardEdit,
            canRecordRisk: !!scope.can.profileEdit
        },
        paged
    )
    return exported(
        p,
        answer,
        "Evaluation " + row.supplierScorecardId + " evidence",
        "Scorecard-" + row.supplierScorecardId,
        evidenceColumns,
        evidenceRows
    )
}
// A supplier's performance for Supplier360's tab: its latest evaluation with the organization and its active risks.
function supplierPerformance(p) {
    const scope = scopeOf({organizationPartyId: p.organizationPartyId, supplierPartyId: p.supplierPartyId})
    const latest = Array.from(
        find(SCORECARD)
            .condition("organizationPartyId", "in", scope.organizationPartyIds)
            .condition("supplierPartyId", String(p.supplierPartyId))
            .orderBy("-evaluatedDate")
            .limit(1)
            .list()
    )[0]
    const names = lib.partyNames([p.supplierPartyId].concat(scope.organizationPartyIds))
    const measures = latest ? rows(MEASURE, {supplierScorecardId: latest.supplierScorecardId}) : []
    const risks = Array.from(
        find(RISK)
            .condition("organizationPartyId", "in", scope.organizationPartyIds)
            .condition("supplierPartyId", String(p.supplierPartyId))
            .list()
    ).filter(risk => lib.active(risk, ec.user.nowTimestamp))
    return {
        latest: latest ? scorecardRow(latest, measures, names, scope) : null,
        measureRows: measures
            .filter(measure => metricNames[measure.metricEnumId])
            .map(measure => ({
                metricText: metricNames[measure.metricEnumId],
                valueText: measureText(measure, scope),
                scoreText: measure.score == null ? "" : plain(measure.score, 1),
                missingText: measure.missingText || ""
            })),
        riskRows: risks.map(risk => ({
            supplierRiskId: risk.supplierRiskId,
            severityText: enumText(risk.severityEnumId),
            categoryText: enumText(risk.categoryEnumId),
            description: risk.description || "",
            responseText: risk.responseText || "",
            fromText: lib.dateText(risk.fromDate)
        })),
        canEvaluate: !!scope.can.scorecardEdit,
        canRecordRisk: !!scope.can.profileEdit
    }
}

// ===== spend =====
const spendGroups = {
    supplier: {label: "Supplier"},
    product: {label: "Product"},
    month: {label: "Month"}
}
const spendColumns = [
    {field: "groupText", title: "Group"},
    {field: "currencyUomId", title: "Currency"},
    {field: "committed", title: "Committed (ordered)", number: true},
    {field: "received", title: "Received at order price", number: true},
    {field: "billed", title: "Billed", number: true},
    {field: "paid", title: "Paid", number: true}
]
// get#PurchaseSpend: four measures kept apart, never added together: committed (the placed purchase order lines by their
// placed date, less what was cancelled), received (the receipts at the order's price, by received date), billed (the
// supplier bills by bill date) and paid (the payments applied to them by applied date), each per group (supplier, product or
// month) and currency. A measure the user may not read is withheld and named; landed costs are Accounting's. only: the
// measures to read (Home's summary reads committed and billed alone), every one by default.
function spend(p, only = null) {
    const scope = scopeOf(p)
    const wanted = measure => !only || only.includes(measure)
    const groupBy = Object.hasOwn(spendGroups, p.groupBy || "") ? p.groupBy : "supplier"
    const period = periodOf(p, 90)
    const omitted = []
    const groups = {}
    const supplierIds = [],
        productIds = []
    const add = (key, currencyUomId, measure, amount) => {
        if (amount == null) return
        const id = (key || "_none_") + "|" + (currencyUomId || "")
        groups[id] ??= {
            groupKey: key || "",
            currencyUomId: currencyUomId || "",
            committed: zero(),
            received: zero(),
            billed: zero(),
            paid: zero(),
            seen: {}
        }
        groups[id][measure] = groups[id][measure].add(amount)
        groups[id].seen[measure] = true
    }
    const keyOf = (supplierPartyId, productId, date) => {
        if (groupBy === "supplier") {
            supplierIds.push(supplierPartyId)
            return supplierPartyId
        }
        if (groupBy === "product") {
            productIds.push(productId)
            return productId || ""
        }
        return monthOf(date)
    }
    // committed: the placed lines of the period
    // the groups are read for every reader, so a withheld measure shows as withheld on its group's row; the amounts leave only
    // for a reader of them
    if (!scope.priceRead) omitted.push("Committed and received amounts are withheld: they are supplier prices.")
    const placed = orderLines(scope, p, period)
    if (placed.truncated) omitted.push("Only the newest " + readCap + " purchase orders of the period are counted as committed.")
    for (const {item, part} of placed.lines) {
        const quantity = dec(item.quantity).subtract(dec(item.quantityCancelled))
        if (quantity.compare(0) <= 0) continue
        add(
            keyOf(part.vendorPartyId, item.productId, part.placedDate),
            part.currencyUomId,
            "committed",
            quantity.multiply(dec(item.unitAmount))
        )
    }
    // received: the receipts of the period, at their order line's price
    const receipts = []
    if (wanted("received")) {
        let receiptQuery = find(RECEIPT)
            .condition("receivedDate", "greater-equals", new Date(period.from))
            .condition("receivedDate", "less-than", new Date(period.thru))
            .condition("orderId", "is-not-null", null)
        if (!blank(p.productId)) receiptQuery = receiptQuery.condition("productId", String(p.productId))
        receipts.push(...Array.from(receiptQuery.limit(readCap + 1).list()))
        if (receipts.length > readCap) omitted.push("Only " + readCap + " receipts of the period are counted as received.")
        const receivedLines = orderLines(scope, p, null, {
            orderIds: unique(receipts.slice(0, readCap).map(row => row.orderId)),
            withCancelled: true
        })
        const lineOf = Object.fromEntries(
            receivedLines.lines.map(line => [line.item.orderId + ":" + line.item.orderItemSeqId, line])
        )
        for (const receipt of receipts.slice(0, readCap)) {
            const line = lineOf[receipt.orderId + ":" + receipt.orderItemSeqId]
            if (!line) continue
            const quantity = dec(receipt.quantityAccepted).add(dec(receipt.quantityRejected))
            add(
                keyOf(line.part.vendorPartyId, line.item.productId, receipt.receivedDate),
                line.part.currencyUomId,
                "received",
                quantity.multiply(dec(line.item.unitAmount))
            )
        }
    }
    // billed and paid: the supplier bills of the period
    if (!scope.billRead) omitted.push("Billed amounts are withheld.")
    const internal = rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    let billQuery = find(INVOICE)
        .condition("toPartyId", "in", scope.organizationPartyIds)
        .condition("fromPartyId", "not-in", internal)
        .condition("statusId", "not-in", ["InvoiceCancelled"])
        .condition("invoiceDate", "greater-equals", new Date(period.from))
        .condition("invoiceDate", "less-than", new Date(period.thru))
    // People P27 review (AC-23): a payroll-origin bill (a person's net pay, its payrollOrigin mark) is no supplier spend for a
    // user without PAYROLL_VIEW
    const payrollHidden = ec.resource.script("component://mr-mantle/service/mantle/account/PayrollOrigin.js").invoiceCondition()
    if (payrollHidden) billQuery = billQuery.condition(payrollHidden)
    if (!blank(p.supplierPartyId)) billQuery = billQuery.condition("fromPartyId", String(p.supplierPartyId))
    const bills = Array.from(billQuery.limit(readCap + 1).list())
    if (bills.length > readCap) omitted.push("Only " + readCap + " bills of the period are counted as billed.")
    const billById = Object.fromEntries(bills.slice(0, readCap).map(bill => [bill.invoiceId, bill]))
    for (const ids of chunks(Object.keys(billById))) {
        let itemQuery = find("mantle.account.invoice.InvoiceItem").condition("invoiceId", "in", ids)
        if (!blank(p.productId)) itemQuery = itemQuery.condition("productId", String(p.productId))
        for (const item of itemQuery.list()) {
            const bill = billById[item.invoiceId]
            add(
                keyOf(bill.fromPartyId, item.productId, bill.invoiceDate),
                bill.currencyUomId,
                "billed",
                dec(item.quantity ?? 1).multiply(dec(item.amount))
            )
        }
    }
    if (!wanted("paid")) {
        // not asked for
    } else if (scope.financeRead) {
        if (groupBy === "product" || !blank(p.productId)) omitted.push("Payments are not by product: paid is left out.")
        else {
            let applicationQuery = find("mantle.account.payment.PaymentApplication")
                .condition("appliedDate", "greater-equals", new Date(period.from))
                .condition("appliedDate", "less-than", new Date(period.thru))
                .condition("invoiceId", "is-not-null", null)
            const applications = Array.from(applicationQuery.limit(readCap + 1).list())
            if (applications.length > readCap)
                omitted.push("Only " + readCap + " payment applications of the period are counted as paid.")
            const invoiceIds = unique(applications.map(row => row.invoiceId))
            const paidBills = {}
            for (const ids of chunks(invoiceIds))
                for (const bill of (payrollHidden ? find(INVOICE).condition(payrollHidden) : find(INVOICE))
                    .condition("invoiceId", "in", ids)
                    .condition("toPartyId", "in", scope.organizationPartyIds)
                    .condition("fromPartyId", "not-in", internal)
                    .list())
                    paidBills[bill.invoiceId] = bill
            for (const application of applications.slice(0, readCap)) {
                const bill = paidBills[application.invoiceId]
                if (!bill || (!blank(p.supplierPartyId) && bill.fromPartyId !== p.supplierPartyId)) continue
                add(
                    keyOf(bill.fromPartyId, null, application.appliedDate),
                    bill.currencyUomId,
                    "paid",
                    dec(application.amountApplied)
                )
            }
        }
    } else omitted.push("Payments are withheld: they need finance read.")
    omitted.push("Landed costs are not in these amounts until Accounting allocates them.")
    const supplierNames = lib.partyNames(supplierIds)
    const products = productNames(productIds)
    const measureShown = {
        committed: scope.priceRead,
        received: scope.priceRead && wanted("received"),
        billed: scope.billRead,
        paid: scope.financeRead && groupBy !== "product" && blank(p.productId) && wanted("paid")
    }
    const shownValue = (group, measure, currencyUomId) =>
        measureShown[measure] ? plain(lib.money(group[measure], currencyUomId)) : null
    const spendRows = Object.values(groups)
        .map(group => {
            const out = {
                groupKey: group.groupKey,
                groupText:
                    groupBy === "supplier"
                        ? supplierNames[group.groupKey] || group.groupKey
                        : groupBy === "product"
                          ? products[group.groupKey] || group.groupKey || "Not a product line"
                          : group.groupKey,
                currencyUomId: group.currencyUomId
            }
            for (const measure of Object.keys(measureShown)) {
                out[measure] = shownValue(group, measure, group.currencyUomId)
                out[measure + "Text"] = measureShown[measure] ? money(group[measure], group.currencyUomId) : withheld
            }
            return out
        })
        .sort((a, b) =>
            String(groupBy === "month" ? b.groupText : a.groupText).localeCompare(
                String(groupBy === "month" ? a.groupText : b.groupText)
            )
        )
    // totals per currency, each measure apart
    const totals = {}
    for (const group of Object.values(groups)) {
        totals[group.currencyUomId] ??= {
            currencyUomId: group.currencyUomId,
            committed: zero(),
            received: zero(),
            billed: zero(),
            paid: zero()
        }
        for (const measure of Object.keys(measureShown))
            totals[group.currencyUomId][measure] = totals[group.currencyUomId][measure].add(group[measure])
    }
    const totalRows = Object.values(totals).map(total => {
        const out = {currencyUomId: total.currencyUomId}
        for (const measure of Object.keys(measureShown)) {
            out[measure] = measureShown[measure] ? plain(lib.money(total[measure], total.currencyUomId)) : null
            out[measure + "Text"] = measureShown[measure] ? money(total[measure], total.currencyUomId) : withheld
        }
        return out
    })
    const paged = page(spendRows, p, "spendRows")
    const answer = Object.assign(
        frame(
            scope,
            ["Period: " + period.text, "By " + spendGroups[groupBy].label.toLowerCase(), supplierFilter(p), productFilter(p)],
            omitted
        ),
        paged,
        {
            groupBy,
            groupLabel: spendGroups[groupBy].label,
            totalRows,
            measuresShown: measureShown,
            landedCostsUrl: scope.can.landedCost ? "/qapps/Accounting/Payables/LandedCosts" : null
        }
    )
    return exported(p, answer, "Purchase spend", "Purchase-spend", spendColumns, spendRows)
}
// Home's SpendSummary: committed and billed of the last three months by month and currency.
function spendSummary(p) {
    const scope = scopeOf({})
    const first = new Date(now())
    const fromDay = ec.l10n.format(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 2, 1)), "yyyy-MM-dd")
    // committed and billed only: Home is opened often, so it reads no receipts or payments
    const answer = spend({groupBy: "month", fromDate: fromDay, pageSize: 12}, ["committed", "billed"])
    return {
        asOfText: answer.asOfText,
        omittedText: answer.omittedText,
        summaryRows: answer.spendRows.map(row => ({
            monthText: row.groupText,
            currencyUomId: row.currencyUomId,
            committedText: row.committedText,
            billedText: row.billedText
        })),
        priceRead: scope.priceRead
    }
}

// ===== commitments =====
const stageLabels = {BcsRequest: "Request", BcsOrder: "Purchase order", BcsExpense: "Actual"}
const commitmentColumns = [
    {field: "stageText", title: "Stage"},
    {field: "sourceText", title: "Source"},
    {field: "supplierName", title: "Supplier"},
    {field: "glAccountId", title: "Account"},
    {field: "budgetId", title: "Budget"},
    {field: "commitmentDateText", title: "Date"},
    {field: "statusText", title: "Status"},
    {field: "currencyUomId", title: "Currency"},
    {field: "amount", title: "Amount", number: true},
    {field: "openAmount", title: "Open", number: true},
    {field: "actualAmount", title: "Actual", number: true},
    {field: "decisionText", title: "Decision"}
]
// get#PurchaseCommitments: the budget commitments of the organizations' purchase requests, purchase orders and bills, each
// stage once: a reservation's open part (less what its purchase order converted), the order's open part (less what its
// bill's actual converted) and the actual, so a reservation, its order and its actual are counted once. By supplier, stage,
// date and view (open, the default: what is still open or actual; all). Amounts need a financial reader; others see the rows
// with the amounts withheld.
function commitments(p) {
    const scope = scopeOf(p)
    const period = blank(p.fromDate) && blank(p.thruDate) ? null : periodOf(p, 365)
    const omitted = []
    let query = find(COMMITMENT)
        .condition("organizationPartyId", "in", scope.organizationPartyIds)
        .condition("stageEnumId", "in", Object.keys(stageLabels))
        .condition("statusId", "not-in", ["BcBlocked"])
        .orderBy("-createdDate")
    if (period) {
        query = query.condition("commitmentDate", "greater-equals", dayOf(period.from))
        query = query.condition("commitmentDate", "less-equals", dayOf(period.thru - 1))
    }
    if (!blank(p.stageEnumId)) query = query.condition("stageEnumId", String(p.stageEnumId))
    const found = Array.from(query.limit(readCap + 1).list())
    if (found.length > readCap) omitted.push("Only the newest " + readCap + " commitments are read.")
    const list = found.slice(0, readCap)
    // what later stages took of each commitment
    const consumed = {}
    for (const ids of chunks(list.map(row => row.budgetCommitmentId)))
        for (const child of find(COMMITMENT)
            .condition("convertedFromId", "in", ids)
            .condition("statusId", "not-in", ["BcBlocked", "BcReversed"])
            .list())
            consumed[child.convertedFromId] = (consumed[child.convertedFromId] || zero()).add(dec(child.amount))
    // each source's supplier: an order's vendor, a bill's sender, a request line's supplier
    const orderVendors = {}
    for (const ids of chunks(unique(list.filter(row => row.sourceEntityName === ORDER).map(row => row.sourceId))))
        for (const part of find("mantle.order.OrderPart").condition("orderId", "in", ids).list())
            orderVendors[part.orderId] = part.vendorPartyId
    const billSenders = namesOf(
        INVOICE,
        "invoiceId",
        "fromPartyId",
        list.filter(row => row.sourceEntityName === INVOICE).map(row => row.sourceId)
    )
    // a request line's supplier, read per 500 requests
    const requestSuppliers = {}
    for (const ids of chunks(unique(list.filter(row => row.sourceEntityName === REQUEST).map(row => row.sourceId))))
        for (const item of find("mantle.request.RequestItem").condition("requestId", "in", ids).list())
            requestSuppliers[item.requestId + ":" + item.requestItemSeqId] = item.supplierPartyId || null
    const requestSupplierOf = row => (row.sourceItemId ? requestSuppliers[row.sourceId + ":" + row.sourceItemId] || null : null)
    const supplierOfRow = row =>
        row.sourceEntityName === ORDER
            ? orderVendors[row.sourceId] || null
            : row.sourceEntityName === INVOICE
              ? billSenders[row.sourceId] || null
              : requestSupplierOf(row)
    const open = row => {
        if (row.statusId !== "BcReserved") return zero()
        const left = dec(row.amount).subtract(consumed[row.budgetCommitmentId] || zero())
        return left.compare(0) > 0 ? left : zero()
    }
    const built = []
    for (const row of list) {
        const supplierPartyId = supplierOfRow(row)
        if (!blank(p.supplierPartyId) && supplierPartyId !== p.supplierPartyId) continue
        const openAmount = open(row),
            actualAmount = row.statusId === "BcActual" ? dec(row.amount) : zero()
        if (p.view !== "all" && openAmount.compare(0) <= 0 && actualAmount.compare(0) <= 0) continue
        built.push({row, supplierPartyId, openAmount, actualAmount})
    }
    const supplierNames = lib.partyNames(built.map(each => each.supplierPartyId))
    const totals = {}
    const commitmentRows = built.map(({row, supplierPartyId, openAmount, actualAmount}) => {
        const currencyUomId = row.currencyUomId || ""
        totals[currencyUomId] ??= {currencyUomId, reserved: zero(), ordered: zero(), actual: zero()}
        if (row.stageEnumId === "BcsRequest") totals[currencyUomId].reserved = totals[currencyUomId].reserved.add(openAmount)
        if (row.stageEnumId === "BcsOrder") totals[currencyUomId].ordered = totals[currencyUomId].ordered.add(openAmount)
        totals[currencyUomId].actual = totals[currencyUomId].actual.add(actualAmount)
        const kind =
            row.sourceEntityName === ORDER
                ? "order"
                : row.sourceEntityName === REQUEST
                  ? "request"
                  : row.sourceEntityName === INVOICE
                    ? "bill"
                    : null
        return {
            budgetCommitmentId: row.budgetCommitmentId,
            stageEnumId: row.stageEnumId,
            stageText: stageLabels[row.stageEnumId] || enumText(row.stageEnumId),
            sourceText:
                (kind === "order"
                    ? "Purchase order "
                    : kind === "request"
                      ? "Purchase request "
                      : kind === "bill"
                        ? "Bill "
                        : "") +
                row.sourceId +
                (row.sourceItemId ? ":" + row.sourceItemId : ""),
            sourceUrl: kind ? purchasing.recordUrl(kind, row.sourceId) : null,
            supplierName: supplierPartyId ? supplierNames[supplierPartyId] || supplierPartyId : "",
            glAccountId: row.glAccountId || "",
            budgetId: row.budgetId || "",
            commitmentDateText: row.commitmentDate ? String(row.commitmentDate).slice(0, 10) : "",
            statusText: statusText(row.statusId),
            convertedFromId: row.convertedFromId || "",
            currencyUomId,
            amount: scope.budgetRead ? plain(row.amount) : null,
            openAmount: scope.budgetRead ? plain(openAmount) : null,
            actualAmount: scope.budgetRead ? plain(actualAmount) : null,
            openText: scope.budgetRead ? money(openAmount, currencyUomId) : withheld,
            actualText: scope.budgetRead ? money(actualAmount, currencyUomId) : withheld,
            decisionText: enumText(row.decisionEnumId)
        }
    })
    if (!scope.budgetRead) omitted.push("Commitment amounts are withheld: they need financial read.")
    const totalRows = Object.values(totals).map(total => ({
        currencyUomId: total.currencyUomId,
        reservedText: scope.budgetRead ? money(total.reserved, total.currencyUomId) : withheld,
        orderedText: scope.budgetRead ? money(total.ordered, total.currencyUomId) : withheld,
        actualText: scope.budgetRead ? money(total.actual, total.currencyUomId) : withheld,
        reserved: scope.budgetRead ? plain(total.reserved) : null,
        ordered: scope.budgetRead ? plain(total.ordered) : null,
        actual: scope.budgetRead ? plain(total.actual) : null
    }))
    const paged = page(commitmentRows, p, "commitmentRows")
    const answer = Object.assign(
        frame(
            scope,
            [
                period ? "Period: " + period.text : "Every date",
                p.view === "all" ? "Every commitment" : "Open and actual",
                p.stageEnumId ? "Stage: " + (stageLabels[p.stageEnumId] || p.stageEnumId) : null,
                supplierFilter(p)
            ],
            omitted
        ),
        paged,
        {totalRows, budgetRead: scope.budgetRead}
    )
    return exported(p, answer, "Purchase commitments", "Purchase-commitments", commitmentColumns, commitmentRows)
}

// ===== procurement tracker =====
const trackerColumns = [
    {field: "requestText", title: "Request"},
    {field: "requirementText", title: "Requirement"},
    {field: "rfqText", title: "RFQ"},
    {field: "quoteText", title: "Quotes"},
    {field: "awardText", title: "Award"},
    {field: "orderText", title: "Purchase order"},
    {field: "supplierName", title: "Supplier"},
    {field: "orderedText", title: "Ordered"},
    {field: "receiptText", title: "Received"},
    {field: "inspectionText", title: "Inspection"},
    {field: "billText", title: "Bills"},
    {field: "matchText", title: "Match"},
    {field: "paymentText", title: "Payment"}
]
// get#ProcurementTracker: each purchase request line through its RFQ, quotes and award to its purchase order lines, and each
// order line through its receipts, inspections, bills, match and payment; a line split across suppliers, orders or bills
// keeps a row per order line. For a request, an order, or the period's requests and orders (by date and supplier). The
// payment of a bill shows to a finance reader only, withheld (never unpaid) for anyone else.
function tracker(p) {
    const scope = scopeOf(p)
    const omitted = []
    let requestIds = [],
        orderIds = []
    if (!blank(p.requestId)) {
        purchasing.recordOf(scope.userScope, "request", String(p.requestId))
        requestIds = [String(p.requestId)]
    }
    if (!blank(p.orderId)) {
        purchasing.recordOf(scope.userScope, "order", String(p.orderId))
        orderIds = [String(p.orderId)]
    }
    let period = null
    if (!requestIds.length && !orderIds.length) {
        period = periodOf(p, 90)
        requestIds = Array.from(
            find("mantle.request.RequestAndParty", {requestTypeEnumId: "RqtPurchase", roleTypeId: "OrgInternal"})
                .condition("partyId", "in", scope.organizationPartyIds)
                .condition("requestDate", "greater-equals", new Date(period.from))
                .condition("requestDate", "less-than", new Date(period.thru))
                .selectField("requestId")
                .limit(201)
                .list()
        ).map(row => row.requestId)
        const placed = orderLines(scope, p, period, {withCancelled: true})
        orderIds = unique(placed.lines.map(line => line.item.orderId))
        if (requestIds.length > 200 || orderIds.length > 200)
            omitted.push("Only 200 requests and 200 orders of the period are traced.")
        requestIds = requestIds.slice(0, 200)
        orderIds = orderIds.slice(0, 200)
    }
    const trackerRows = []
    const tracedLines = new Set()
    const lineRow = (orderId, orderItemSeqId, base) => {
        tracedLines.add(orderId + ":" + orderItemSeqId)
        return Object.assign({}, base, orderLineTrace(scope, orderId, orderItemSeqId))
    }
    for (const requestId of requestIds) {
        const request = one(REQUEST, {requestId})
        if (!request) continue
        for (const item of rows("mantle.request.RequestItem", {requestId}).sort((a, b) =>
            String(a.requestItemSeqId).localeCompare(String(b.requestItemSeqId))
        )) {
            const requirement = rows("mantle.request.requirement.RequirementRequestItem", {
                requestId,
                requestItemSeqId: item.requestItemSeqId
            })[0]
            const rfqItems = rows("mantle.request.RequestItemAssoc", {
                otherRequestId: requestId,
                otherRequestItemSeqId: item.requestItemSeqId
            })
            const quotes = []
            for (const rfqItem of rfqItems)
                for (const link of rows("mantle.request.RequestItemOrder", {
                    requestId: rfqItem.requestId,
                    requestItemSeqId: rfqItem.requestItemSeqId
                }))
                    quotes.push(link)
            const quoteOrders = unique(quotes.map(link => link.orderId))
                .map(orderId => one(ORDER, {orderId}))
                .filter(Boolean)
            const awarded = quoteOrders.filter(order => order.placedDate)
            const base = {
                requestId,
                requestText:
                    "Purchase request " +
                    requestId +
                    ":" +
                    item.requestItemSeqId +
                    (request.requestName ? " · " + request.requestName : ""),
                requestUrl: purchasing.recordUrl("request", requestId),
                requestStatusText: statusText(request.statusId),
                requirementText: requirement ? requirement.requirementId : "",
                rfqText: unique(rfqItems.map(row => row.requestId))
                    .map(id => "RFQ " + id)
                    .join(", "),
                quoteText: quoteOrders.map(order => order.orderId + " (" + statusText(order.statusId) + ")").join(", "),
                awardText: awarded.length
                    ? "Awarded: " + awarded.map(order => order.orderId).join(", ")
                    : quoteOrders.length
                      ? "Not awarded yet"
                      : ""
            }
            const directLinks = rows("mantle.request.RequestItemOrder", {requestId, requestItemSeqId: item.requestItemSeqId})
            const orderLinks = directLinks.concat(quotes.filter(link => awarded.some(order => order.orderId === link.orderId)))
            // the supplier filter holds for a request's rows too: its order lines' supplier, else the line's suggested one
            const ofSupplier = row => blank(p.supplierPartyId) || row.supplierPartyId === String(p.supplierPartyId)
            if (!orderLinks.length) {
                const empty = Object.assign(base, emptyOrderTrace(item.supplierPartyId))
                if (ofSupplier(empty)) trackerRows.push(empty)
            }
            for (const link of orderLinks) {
                const traced = lineRow(link.orderId, link.orderItemSeqId, base)
                if (ofSupplier(traced)) trackerRows.push(traced)
            }
        }
    }
    for (const orderId of orderIds)
        for (const item of rows("mantle.order.OrderItem", {orderId}).sort((a, b) =>
            String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId))
        )) {
            if (tracedLines.has(orderId + ":" + item.orderItemSeqId)) continue
            if (
                !blank(p.supplierPartyId) &&
                one("mantle.order.OrderPart", {orderId, orderPartSeqId: item.orderPartSeqId})?.vendorPartyId !== p.supplierPartyId
            )
                continue
            trackerRows.push(
                lineRow(orderId, item.orderItemSeqId, {
                    requestId: null,
                    requestText: "",
                    requestUrl: null,
                    requestStatusText: "",
                    requirementText: "",
                    rfqText: "",
                    quoteText: "",
                    awardText: ""
                })
            )
        }
    if (!scope.financeRead) omitted.push("Payments are withheld: they need finance read.")
    if (!scope.billRead) omitted.push("Bill amounts are withheld.")
    const paged = page(trackerRows, p, "trackerRows")
    const answer = Object.assign(
        frame(
            scope,
            [
                p.requestId ? "Purchase request " + p.requestId : null,
                p.orderId ? "Purchase order " + p.orderId : null,
                period ? "Period: " + period.text : null,
                supplierFilter(p)
            ],
            omitted
        ),
        paged,
        {financeRead: scope.financeRead}
    )
    return exported(p, answer, "Procurement tracker", "Procurement-tracker", trackerColumns, trackerRows)
}
function emptyOrderTrace(supplierPartyId) {
    return {
        orderId: null,
        supplierPartyId: supplierPartyId || null,
        orderText: "Not ordered yet",
        orderUrl: null,
        supplierName: supplierPartyId ? lib.partyNames([supplierPartyId])[supplierPartyId] || supplierPartyId : "",
        orderedText: "",
        receiptText: "",
        inspectionText: "",
        billText: "",
        matchText: "",
        paymentText: ""
    }
}
// One order line's way from its order to its payment: its status, quantities received, inspections, bills with their
// match, and the bills' payment (a finance reader's) or withheld.
function orderLineTrace(scope, orderId, orderItemSeqId) {
    const order = one(ORDER, {orderId})
    const item = one("mantle.order.OrderItem", {orderId, orderItemSeqId})
    const part = item ? one("mantle.order.OrderPart", {orderId, orderPartSeqId: item.orderPartSeqId}) : null
    const receipts = rows(RECEIPT, {orderId, orderItemSeqId})
    const received = receipts.reduce((sum, row) => sum.add(dec(row.quantityAccepted)).add(dec(row.quantityRejected)), zero())
    const ordered = item ? dec(item.quantity).subtract(dec(item.quantityCancelled)) : zero()
    const inspections = rows("mantle.product.quality.QualityInspection", {orderId, orderItemSeqId}).filter(
        row => row.statusId !== "QiCancelled"
    )
    const billings = rows("mantle.order.OrderItemBilling", {orderId, orderItemSeqId})
    const bills = unique(billings.map(row => row.invoiceId))
        .map(invoiceId => one(INVOICE, {invoiceId}))
        .filter(Boolean)
    const matches = bills.length
        ? Array.from(
              find("mantle.account.invoice.InvoiceMatch")
                  .condition(
                      "invoiceId",
                      "in",
                      bills.map(bill => bill.invoiceId)
                  )
                  .condition("statusId", "ImApplied")
                  .list()
          )
        : []
    let paymentText = ""
    if (bills.length)
        paymentText = !scope.financeRead
            ? withheld
            : bills
                  .map(bill => {
                      const unpaid = dec(bill.unpaidTotal ?? bill.invoiceTotal)
                      const state =
                          bill.statusId === "InvoicePmtSent" || unpaid.compare(0) <= 0
                              ? "Paid"
                              : dec(bill.appliedPaymentsTotal).compare(0) > 0
                                ? "Partly paid"
                                : "Not paid"
                      return (
                          bill.invoiceId +
                          ": " +
                          state +
                          (state === "Paid" ? "" : " (" + money(unpaid, bill.currencyUomId) + " open)")
                      )
                  })
                  .join("; ")
    const inspectionStates = {}
    for (const inspection of inspections) {
        const label = ["QiDraft", "QiSubmitted"].includes(inspection.statusId) ? "open" : "decided"
        inspectionStates[label] = (inspectionStates[label] || 0) + 1
    }
    return {
        orderId,
        supplierPartyId: part?.vendorPartyId || null,
        orderText: "Purchase order " + orderId + ":" + orderItemSeqId + (order ? " (" + statusText(order.statusId) + ")" : ""),
        orderUrl: purchasing.recordUrl("order", orderId),
        supplierName: part?.vendorPartyId ? lib.partyNames([part.vendorPartyId])[part.vendorPartyId] || part.vendorPartyId : "",
        orderedText: quantityText(ordered),
        receiptText: receipts.length
            ? quantityText(received) +
              " in " +
              receipts.length +
              (receipts.length === 1 ? " receipt" : " receipts") +
              (received.compare(ordered) < 0 ? ", partly received" : "")
            : "Nothing received",
        inspectionText: Object.entries(inspectionStates)
            .map(([label, count]) => count + " " + label)
            .join(", "),
        billText: bills
            .map(
                bill =>
                    bill.invoiceId +
                    " (" +
                    statusText(bill.statusId) +
                    (scope.billRead ? ", " + money(bill.invoiceTotal, bill.currencyUomId) : "") +
                    ")"
            )
            .join("; "),
        matchText: bills.length
            ? matches.length
                ? matches.map(match => enumText(match.resultEnumId)).join(", ")
                : "Not matched"
            : "",
        paymentText
    }
}
// The purchase requests a tracker may follow, by id or name, for its drop-down.
function requestChoices(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.request.RequestAndParty", {requestTypeEnumId: "RqtPurchase", roleTypeId: "OrgInternal"})
        .condition("partyId", "in", purchasing.buyerIds(userScope).length ? purchasing.buyerIds(userScope) : ["_NA_"])
        .orderBy("-requestDate")
        .limit(30)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["requestId", "requestName"].map(field =>
                    factory.makeCondition(field, "like", "%" + String(term).replace(/[\\%_]/g, c => "\\" + c) + "%").ignoreCase()
                ),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({
        value: row.requestId,
        label: row.requestId + " · " + (row.requestName || "")
    }))
    if (selected && !options.some(option => option.value === selected)) {
        try {
            const record = purchasing.recordOf(userScope, "request", selected)
            options.push({value: selected, label: selected + " · " + (record.label || "")})
        } catch (_) {
            // not the user's: left out
        }
    }
    return options
}

// ===== purchase history =====
const historyColumns = [
    {field: "kindText", title: "Price"},
    {field: "dateText", title: "Date"},
    {field: "productText", title: "Product"},
    {field: "supplierName", title: "Supplier"},
    {field: "facilityName", title: "Facility"},
    {field: "documentText", title: "Document"},
    {field: "quantity", title: "Quantity", number: true},
    {field: "uomText", title: "Unit"},
    {field: "currencyUomId", title: "Currency"},
    {field: "quotedPrice", title: "Quoted unit price", number: true},
    {field: "orderedPrice", title: "Ordered unit price", number: true},
    {field: "invoicedPrice", title: "Billed unit price", number: true},
    {field: "leadDays", title: "Lead days", number: true}
]
// get#PurchaseHistory: the product's buying history in the period (a year by default), the quoted, ordered and billed unit
// prices kept apart in their own currency and the line's unit: the quotes' lines (a quote never placed), and each placed
// purchase order line with its billed price and lead time (placed to first receipt). By product, supplier and facility.
// Prices need a supplier-price reader (as Orders.js); others see them withheld.
function history(p) {
    const scope = scopeOf(p)
    const period = periodOf(p, 365)
    const omitted = []
    const placed = orderLines(scope, p, period)
    if (placed.truncated) omitted.push("Only the newest " + readCap + " purchase orders of the period are read.")
    // the quotes of the period (not placed): their own lines
    let quoteQuery = find("mantle.order.OrderHeaderAndPart", {supplierQuote: "Y"})
        .condition("customerPartyId", "in", scope.organizationPartyIds)
        .condition("placedDate", "is-null", null)
        .condition("entryDate", "greater-equals", new Date(period.from))
        .condition("entryDate", "less-than", new Date(period.thru))
    if (!blank(p.supplierPartyId)) quoteQuery = quoteQuery.condition("vendorPartyId", String(p.supplierPartyId))
    const quoteParts = Array.from(quoteQuery.limit(1001).list())
    if (quoteParts.length > 1000) omitted.push("Only 1000 quotes of the period are read.")
    quoteParts.length = Math.min(quoteParts.length, 1000)
    const quoteLines = []
    for (const ids of chunks(unique(quoteParts.map(part => part.orderId)))) {
        let itemQuery = find("mantle.order.OrderItem")
            .condition("orderId", "in", ids)
            .condition("itemTypeEnumId", "not-equals", "ItemShipping")
        if (!blank(p.productId)) itemQuery = itemQuery.condition("productId", String(p.productId))
        for (const item of itemQuery.list()) {
            const part = quoteParts.find(each => each.orderId === item.orderId)
            if (part && dec(item.unitAmount).compare(0) > 0) quoteLines.push({item, part})
        }
    }
    const lines = placed.lines.filter(line => line.item.productId && line.item.itemTypeEnumId !== "ItemShipping")
    const productIds = lines.concat(quoteLines).map(line => line.item.productId)
    const products = productNames(productIds)
    const productRows = {}
    for (const id of unique(productIds)) productRows[id] = one("mantle.product.Product", {productId: id})
    const uoms = namesOf(
        "moqui.basic.Uom",
        "uomId",
        "description",
        lines.concat(quoteLines).map(line => line.item.quantityUomId || productRows[line.item.productId]?.amountUomId)
    )
    const suppliers = lib.partyNames(lines.concat(quoteLines).map(line => line.part.vendorPartyId))
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        lines.map(line => line.part.facilityId)
    )
    const priceOf = value => (scope.priceRead && value != null ? plain(value, 4) : null)
    const priceText = (value, currencyUomId) =>
        !scope.priceRead ? withheld : value == null ? "" : ec.l10n.formatCurrency(dec(value), currencyUomId)
    const historyRows = []
    for (const {item, part} of quoteLines) {
        const uomId = item.quantityUomId || productRows[item.productId]?.amountUomId
        historyRows.push({
            kind: "quote",
            kindText: "Quoted",
            sortDate: ms(part.entryDate),
            dateText: lib.dateText(part.entryDate),
            productText: products[item.productId] || item.itemDescription || "",
            supplierName: suppliers[part.vendorPartyId] || part.vendorPartyId,
            facilityName: "",
            documentText: "Quote " + part.orderId + ":" + item.orderItemSeqId + " (" + statusText(part.statusId) + ")",
            documentUrl: purchasing.recordUrl("quote", part.orderId),
            quantity: plain(item.quantity, 3),
            uomText: uoms[uomId] || uomId || "",
            currencyUomId: part.currencyUomId,
            quotedPrice: priceOf(item.unitAmount),
            orderedPrice: null,
            invoicedPrice: null,
            quotedText: priceText(item.unitAmount, part.currencyUomId),
            orderedText: "",
            invoicedText: "",
            leadDays: null
        })
    }
    // the lines' billings, billed prices and first receipts, read per 500 orders rather than per line
    const lineKey = (orderId, orderItemSeqId) => orderId + ":" + orderItemSeqId
    const billingsOf = {},
        invoiceItems = {},
        firstReceipts = {}
    for (const ids of chunks(unique(lines.map(line => line.item.orderId)))) {
        const billingRows = Array.from(find("mantle.order.OrderItemBilling").condition("orderId", "in", ids).list())
        for (const billing of billingRows) (billingsOf[lineKey(billing.orderId, billing.orderItemSeqId)] ??= []).push(billing)
        for (const invoiceIds of chunks(unique(billingRows.map(billing => billing.invoiceId))))
            for (const invoiceItem of find("mantle.account.invoice.InvoiceItem").condition("invoiceId", "in", invoiceIds).list())
                invoiceItems[lineKey(invoiceItem.invoiceId, invoiceItem.invoiceItemSeqId)] = invoiceItem
        for (const receipt of find(RECEIPT).condition("orderId", "in", ids).orderBy("receivedDate").list())
            firstReceipts[lineKey(receipt.orderId, receipt.orderItemSeqId)] ??= receipt
    }
    for (const {item, part} of lines) {
        const uomId = item.quantityUomId || productRows[item.productId]?.amountUomId
        const billings = billingsOf[lineKey(item.orderId, item.orderItemSeqId)] || []
        let billedQuantity = zero(),
            billedAmount = zero()
        for (const billing of billings) {
            const invoiceItem = invoiceItems[lineKey(billing.invoiceId, billing.invoiceItemSeqId)]
            if (!invoiceItem) continue
            billedQuantity = billedQuantity.add(dec(billing.quantity))
            billedAmount = billedAmount.add(dec(billing.quantity).multiply(dec(invoiceItem.amount)))
        }
        const invoiced = billedQuantity.compare(0) > 0 ? billedAmount.divide(billedQuantity, 6, "HALF_UP") : null
        const firstReceipt = firstReceipts[lineKey(item.orderId, item.orderItemSeqId)]
        const leadDays =
            firstReceipt && part.placedDate
                ? Math.max(0, Math.round((ms(firstReceipt.receivedDate) - ms(part.placedDate)) / dayMs))
                : null
        historyRows.push({
            kind: "order",
            kindText: "Ordered",
            sortDate: ms(part.placedDate),
            dateText: lib.dateText(part.placedDate),
            productText: products[item.productId] || "",
            supplierName: suppliers[part.vendorPartyId] || part.vendorPartyId,
            facilityName: facilities[part.facilityId] || part.facilityId || "",
            documentText:
                "Purchase order " +
                item.orderId +
                ":" +
                item.orderItemSeqId +
                (part.supplierQuote === "Y" ? " (awarded quote)" : ""),
            documentUrl: purchasing.recordUrl("order", item.orderId),
            quantity: plain(item.quantity, 3),
            uomText: uoms[uomId] || uomId || "",
            currencyUomId: part.currencyUomId,
            quotedPrice: null,
            orderedPrice: priceOf(item.unitAmount),
            invoicedPrice: priceOf(invoiced),
            quotedText: "",
            orderedText: priceText(item.unitAmount, part.currencyUomId),
            invoicedText:
                invoiced == null ? (scope.priceRead ? "Not billed" : withheld) : priceText(invoiced, part.currencyUomId),
            leadDays,
            leadText: leadDays == null ? "Not received" : leadDays + (leadDays === 1 ? " day" : " days")
        })
    }
    historyRows.sort((a, b) => (b.sortDate || 0) - (a.sortDate || 0))
    if (!scope.priceRead) omitted.push("Prices are withheld: they are supplier prices.")
    omitted.push("Prices are in each document's currency and unit; nothing is converted.")
    const paged = page(historyRows, p, "historyRows")
    const answer = Object.assign(
        frame(
            scope,
            ["Period: " + period.text, productFilter(p), supplierFilter(p), p.facilityId ? "Facility: " + p.facilityId : null],
            omitted
        ),
        paged,
        {priceRead: scope.priceRead}
    )
    return exported(p, answer, "Purchase history", "Purchase-history", historyColumns, historyRows)
}

// ===== supplier statement =====
const statementColumns = [
    {field: "dateText", title: "Date"},
    {field: "kindText", title: "Kind"},
    {field: "documentText", title: "Document"},
    {field: "referenceNumber", title: "Supplier reference"},
    {field: "currencyUomId", title: "Currency"},
    {field: "billed", title: "Bills and credits", number: true},
    {field: "paid", title: "Payments", number: true},
    {field: "balance", title: "Balance", number: true}
]
// get#SupplierStatement: a finance reader's reconciled account with a supplier over a period (90 days by default), per
// currency: the opening balance (bills and credits less payments before it), each bill, credit and payment in date order
// with the running balance, and the closing balance. No bank details. Refuses anyone without finance read
// (PERMISSION_DENIED) and needs a supplier in scope.
function statement(p) {
    const scope = scopeOf(p)
    if (!scope.financeRead) denied("PERMISSION_DENIED", "The supplier statement needs finance read")
    if (blank(p.supplierPartyId)) denied("SUPPLIER_REQUIRED", "Choose a supplier")
    const period = periodOf(p, 90)
    const supplierPartyId = String(p.supplierPartyId)
    const omitted = []
    let billQuery = find(INVOICE)
        .condition("toPartyId", "in", scope.organizationPartyIds)
        .condition("fromPartyId", supplierPartyId)
        .condition("statusId", "not-in", ["InvoiceCancelled", "InvoiceIncoming"])
        .condition("invoiceDate", "less-than", new Date(period.thru))
    if (!blank(p.currencyUomId)) billQuery = billQuery.condition("currencyUomId", String(p.currencyUomId))
    // People P27 review (AC-23): payroll-origin bills and payments (their payrollOrigin mark) for a reader of payroll alone
    const origin = ec.resource.script("component://mr-mantle/service/mantle/account/PayrollOrigin.js")
    if (origin.invoiceCondition()) billQuery = billQuery.condition(origin.invoiceCondition())
    const bills = Array.from(
        billQuery
            .orderBy("invoiceDate")
            .limit(readCap + 1)
            .list()
    )
    let paymentQuery = find("mantle.account.payment.Payment")
        .condition("fromPartyId", "in", scope.organizationPartyIds)
        .condition("toPartyId", supplierPartyId)
        .condition("statusId", "in", ["PmntDelivered", "PmntConfirmed"])
        .condition("effectiveDate", "less-than", new Date(period.thru))
    if (!blank(p.currencyUomId)) paymentQuery = paymentQuery.condition("amountUomId", String(p.currencyUomId))
    if (origin.paymentCondition()) paymentQuery = paymentQuery.condition(origin.paymentCondition())
    const payments = Array.from(
        paymentQuery
            .orderBy("effectiveDate")
            .limit(readCap + 1)
            .list()
    )
    if (bills.length > readCap || payments.length > readCap)
        omitted.push("Only " + readCap + " bills and payments are read; the balances are incomplete.")
    omitted.push("Bills not yet received for review (Incoming) are left out.")
    const credit = bill => ["InvoiceCreditMemo", "InvoiceReturn"].includes(bill.invoiceTypeEnumId)
    const entries = bills
        .slice(0, readCap)
        .map(bill => ({
            at: ms(bill.invoiceDate),
            kindText: credit(bill) ? "Credit" : "Bill",
            documentText: (credit(bill) ? "Credit " : "Bill ") + bill.invoiceId,
            documentUrl: purchasing.recordUrl("bill", bill.invoiceId),
            referenceNumber: bill.referenceNumber || "",
            currencyUomId: bill.currencyUomId,
            billed: credit(bill)
                ? zero().subtract(
                      dec(bill.invoiceTotal).compare(0) < 0 ? zero().subtract(dec(bill.invoiceTotal)) : dec(bill.invoiceTotal)
                  )
                : dec(bill.invoiceTotal),
            paid: null
        }))
        .concat(
            payments.slice(0, readCap).map(payment => ({
                at: ms(payment.effectiveDate),
                kindText: "Payment",
                documentText: "Payment " + payment.paymentId,
                documentUrl: null,
                referenceNumber: payment.paymentRefNum || "",
                currencyUomId: payment.amountUomId,
                billed: null,
                paid: dec(payment.amount)
            }))
        )
        .sort((a, b) => a.at - b.at)
    const balances = {}
    const opening = {}
    const statementRows = []
    for (const entry of entries) {
        const currencyUomId = entry.currencyUomId || ""
        balances[currencyUomId] ??= zero()
        const change = entry.billed != null ? entry.billed : zero().subtract(entry.paid)
        if (entry.at < period.from) {
            balances[currencyUomId] = balances[currencyUomId].add(change)
            opening[currencyUomId] = balances[currencyUomId]
            continue
        }
        opening[currencyUomId] ??= zero()
        balances[currencyUomId] = balances[currencyUomId].add(change)
        statementRows.push({
            dateText: lib.dateText(entry.at),
            kindText: entry.kindText,
            documentText: entry.documentText,
            documentUrl: entry.documentUrl,
            referenceNumber: entry.referenceNumber,
            currencyUomId,
            billed: entry.billed == null ? null : plain(lib.money(entry.billed, currencyUomId)),
            paid: entry.paid == null ? null : plain(lib.money(entry.paid, currencyUomId)),
            balance: plain(lib.money(balances[currencyUomId], currencyUomId)),
            billedText: entry.billed == null ? "" : money(entry.billed, currencyUomId),
            paidText: entry.paid == null ? "" : money(entry.paid, currencyUomId),
            balanceText: money(balances[currencyUomId], currencyUomId)
        })
    }
    const balanceRows = Object.keys(balances).map(currencyUomId => ({
        currencyUomId,
        openingText: money(opening[currencyUomId] || zero(), currencyUomId),
        closingText: money(balances[currencyUomId], currencyUomId),
        opening: plain(lib.money(opening[currencyUomId] || zero(), currencyUomId)),
        closing: plain(lib.money(balances[currencyUomId], currencyUomId))
    }))
    const paged = page(statementRows, p, "statementRows")
    const supplierName = lib.partyNames([supplierPartyId])[supplierPartyId] || supplierPartyId
    const answer = Object.assign(
        frame(
            scope,
            ["Supplier: " + supplierName, "Period: " + period.text, p.currencyUomId ? "Currency: " + p.currencyUomId : null],
            omitted
        ),
        paged,
        {supplierName, balanceRows}
    )
    if (p.output === "csv") {
        // the export ends with each currency's opening and closing balance
        const lines = statementRows.concat(
            balanceRows.flatMap(row => [
                {kindText: "Opening balance", currencyUomId: row.currencyUomId, balance: row.opening},
                {kindText: "Closing balance", currencyUomId: row.currencyUomId, balance: row.closing}
            ])
        )
        return exported(
            p,
            answer,
            "Statement of " + supplierName,
            "Supplier-statement-" + supplierPartyId,
            statementColumns,
            lines
        )
    }
    return answer
}

// ===== Home =====
// Home's quotes-to-compare count: the open RFQs of the user's organizations with a proposed quote not expired, for the buying
// lists' groups.
function compareCount(userScope) {
    if (!userScope.read || !userScope.capabilities.listRead) return {quoteCompareCount: null}
    const buyers = purchasing.buyerIds(userScope)
    if (!buyers.length) return {quoteCompareCount: 0}
    // a bounded count for Home: the proposed quotes not expired (one read), their RFQs (one read per 500), and those RFQs
    // still open
    const at = new Date(now())
    const factory = ec.entity.conditionFactory
    const quotes = Array.from(
        find("mantle.order.OrderHeaderAndPart", {statusId: "OrderProposed"})
            .condition("customerPartyId", "in", buyers)
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("validThruDate", "is-null", null),
                        factory.makeCondition("validThruDate", "greater-than", at)
                    ],
                    "or"
                )
            )
            .selectField("orderId")
            .limit(2000)
            .list()
    ).map(row => row.orderId)
    const rfqIds = new Set()
    for (const ids of chunks(unique(quotes)))
        for (const link of find("mantle.request.RequestItemOrder")
            .condition("orderId", "in", ids)
            .selectField("requestId")
            .list())
            rfqIds.add(link.requestId)
    let count = 0
    for (const ids of chunks(Array.from(rfqIds)))
        count += Array.from(
            find(REQUEST, {requestTypeEnumId: "RqtPurchaseRfq"})
                .condition("requestId", "in", ids)
                .condition("statusId", "in", ["ReqSubmitted", "ReqReviewed", "ReqInProgress"])
                .selectField("requestId")
                .list()
        ).length
    return {quoteCompareCount: count}
}
// Home's BuyerWork sources beyond P3's orders to send: the approvals waiting for the user, the approved requests to source, the
// RFQs whose responses are due and the acknowledgements overdue, each from its module's Today source (due within a week),
// by due date. A source that fails is logged and left out.
const workSources = [
    ["Approvals.js", "Decide"],
    ["Requests.js", "Source the request"],
    ["Sourcing.js", "Chase the quotes"],
    ["Revisions.js", "Chase the acknowledgement"]
]
function buyerWork(limit) {
    const until = new Date(now() + 7 * dayMs)
    const found = []
    for (const [module, nextAction] of workSources) {
        try {
            const today = ec.resource
                .script("component://mr-boss/service/ironstone/purchasing/" + module)
                .execute("today", {thruDate: until})
            for (const item of today.items || [])
                found.push({
                    sortDate: ms(item.dueDate) ?? 0,
                    documentText: item.title,
                    url: item.url,
                    supplierName: "",
                    ownerName: "",
                    dueText: lib.dateText(item.dueDate),
                    amountText: "",
                    nextAction
                })
        } catch (error) {
            ec.logger.error("Purchasing Home work from " + module + " failed: " + error.message)
        }
    }
    return found
        .sort((a, b) => a.sortDate - b.sortDate)
        .slice(0, Math.max(1, Math.min(50, Number(limit) || 20)))
        .map(({sortDate, ...row}) => row)
}

const operations = {
    findScorecards,
    getScorecard,
    supplierPerformance,
    spend,
    spendSummary,
    commitments,
    tracker,
    history,
    statement
}
;({
    requestChoices,
    compareCount,
    buyerWork,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing report operation " + op)
        return operations[op](parameters || {})
    }
})
