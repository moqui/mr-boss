// Purchasing's comparison and award reads (design-purchasing §5 QuoteComparison, Award and QuoteDetail's QuoteAwards;
// impl-purchasing P12): QuoteDetail's awards of a quote (get#QuoteAwards: what an award placed of it, line by line, with the
// purchase order, the RFQ item, the request's requirement and what is left of the demand, or that it was not awarded), and
// the Award screen's result of an award or close the user made (get#AwardResult: the operation's stored result, so a page
// reload or a retry shows the first result without placing anything). The rules (compare#SupplierQuotes, preview# and
// commit#Award, close#QuoteRequest) are mantle.order.SourcingServices' (Awards.js in mr-mantle), called by the screens after
// AccessServices.check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {one, rows, denied, dateText} = lib

const ORDER = "mantle.order.OrderHeader",
    ORDER_ITEM = "mantle.order.OrderItem",
    ITEM_ORDER = "mantle.request.RequestItemOrder",
    REQUEST = "mantle.request.Request",
    SUPPLY = "mantle.request.requirement.RequirementSupply"
const quoteStatuses = ["OrderRequested", "OrderProposed"]
const deadStatuses = ["OrderCancelled", "OrderRejected"]
const resultTypes = ["QuoteAward", "QuoteRequestClose"]
const dec = value => toDecimal(value == null || value === "" ? 0 : value)
const quantityText = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const uomText = uomId => (uomId ? one("moqui.basic.Uom", {uomId})?.abbreviation || uomId : "")
const productText = productId => {
    if (!productId) return ""
    const product = one("mantle.product.Product", {productId})
    return product ? [product.pseudoId || productId, product.productName].filter(Boolean).join(" · ") : productId
}
const amountsVisible = can => !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead)
const money = (value, currencyUomId) =>
    value == null ? "" : currencyUomId ? ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId) : String(value)

// get#QuoteAwards: QuoteAwards of a quote the user may read: placed by an award, each line with its RFQ item, the quantity
// awarded and its price (withheld from a user who may not see prices), the request line and requirement it supplies and the
// demand left; cancelled as Not awarded with the note's reason; else nothing awarded yet.
function quoteAwards(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "order", p.orderId)
    const order = one(ORDER, {orderId: p.orderId})
    const showAmounts = amountsVisible(userScope.capabilities)
    const notes = rows("mantle.order.OrderNote", {orderId: order.orderId}).sort((a, b) => lib.ms(b.noteDate) - lib.ms(a.noteDate))
    if (deadStatuses.includes(order.statusId)) {
        const note = notes.find(row => /^(Not awarded|Declined)/.test(String(row.noteText || "")))
        return {
            awardState: order.statusId === "OrderCancelled" ? "notAwarded" : "declined",
            awardText:
                (order.statusId === "OrderCancelled" ? "Not awarded" : "Declined by the supplier") +
                (note ? " · " + String(note.noteText).replace(/^(Not awarded|Declined): /, "") : ""),
            awardRows: [],
            purchaseOrderUrl: null
        }
    }
    if (quoteStatuses.includes(order.statusId))
        return {awardState: "open", awardText: "No part of this quote is awarded.", awardRows: [], purchaseOrderUrl: null}
    const links = rows(ITEM_ORDER, {orderId: order.orderId})
    const requestTypes = {}
    const typeOf = requestId => (requestTypes[requestId] ??= one(REQUEST, {requestId})?.requestTypeEnumId || null)
    const awardRows = rows(ORDER_ITEM, {orderId: order.orderId})
        .filter(item => item.productId && !item.parentItemSeqId)
        .sort((a, b) => String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId)))
        .map(item => {
            const itemLinks = links.filter(link => link.orderItemSeqId === item.orderItemSeqId)
            const rfqLink = itemLinks.find(link => typeOf(link.requestId) === "RqtPurchaseRfq")
            const requestLink = itemLinks.find(link => typeOf(link.requestId) !== "RqtPurchaseRfq")
            const supply = rows(SUPPLY, {orderId: order.orderId, orderItemSeqId: item.orderItemSeqId})[0] || null
            const requirement = supply
                ? one("mantle.request.requirement.Requirement", {requirementId: supply.requirementId})
                : null
            const rfqItem = rfqLink
                ? one("mantle.request.RequestItem", {requestId: rfqLink.requestId, requestItemSeqId: rfqLink.requestItemSeqId})
                : null
            const awarded = rfqLink ? dec(rfqLink.quantity) : dec(item.quantity)
            const remaining = rfqItem ? dec(rfqItem.quantity).subtract(awarded) : null
            return {
                orderItemSeqId: item.orderItemSeqId,
                productText: productText(item.productId),
                rfqLineText: rfqLink ? rfqLink.requestId + ":" + rfqLink.requestItemSeqId : "",
                awardedText: quantityText(awarded) + (rfqItem?.quantityUomId ? " " + uomText(rfqItem.quantityUomId) : ""),
                orderedText:
                    quantityText(dec(item.quantity).subtract(dec(item.quantityCancelled))) + " " + uomText(item.quantityUomId),
                priceText: showAmounts ? money(item.unitAmount, order.currencyUomId) : "Withheld",
                sourceText: requestLink ? "Purchase request " + requestLink.requestId + ":" + requestLink.requestItemSeqId : "",
                requirementText: requirement ? requirement.requirementId + " · " + statusText(requirement.statusId) : "",
                remainingText:
                    remaining == null ? "" : remaining.compare(0) > 0 ? quantityText(remaining) + " of the RFQ item left" : ""
            }
        })
    return {
        awardState: "awarded",
        awardText: "Awarded: purchase order " + order.orderId + " · " + statusText(order.statusId),
        awardRows,
        purchaseOrderUrl: purchasing.recordUrl("order", order.orderId)
    }
}

// get#AwardResult: the result of an award or a close of an RFQ the user may work with, as its operation stored it (a reload
// shows it, nothing is placed again); amounts withheld from a user who may not see prices.
function awardResult(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "rfq", p.requestId)
    const op = p.operationKey ? one(lib.operationEntity, {operationKey: String(p.operationKey)}) : null
    if (!op || !resultTypes.includes(op.operationType) || op.resultId !== String(p.requestId))
        denied("RECORD_UNAVAILABLE", "No result of that award of RFQ " + p.requestId)
    const result = lib.json(op.resultJson, {})
    const showAmounts = amountsVisible(userScope.capabilities)
    const groupRows = Array.from(result.groupRows || []).map(row =>
        Object.assign({}, row, {
            amountText: showAmounts ? row.amountText || "" : "Withheld",
            purchaseOrderUrl: ["PLACED", "EXISTING"].includes(row.resultStatus)
                ? purchasing.recordUrl("order", row.orderId)
                : null,
            lineText: Array.from(row.lineRows || [])
                .map(line => line.orderItemSeqId + " " + line.productText + " " + line.quantityText)
                .join("; ")
        })
    )
    // a failed group a new award may retry: its allocations again
    const retryText = groupRows
        .filter(row => row.resultStatus === "FAILED" && row.retryable)
        .flatMap(row =>
            Array.from(row.lineRows || []).map(
                line =>
                    row.orderId +
                    ":" +
                    line.orderItemSeqId +
                    ":" +
                    (line.requestItemSeqId || "") +
                    ":" +
                    String(line.quantityText).split(" ")[0].replace(/,/g, "")
            )
        )
        .join(";")
    return {
        kind: op.operationType === "QuoteAward" ? "award" : "close",
        status: op.status,
        resultStatus: result.resultStatus || (op.operationType === "QuoteRequestClose" ? "CLOSED" : ""),
        stepText: result.stepText || "",
        doneText: dateText(op.completedDate || op.submittedDate),
        groupRows,
        recipientRows: Array.from(result.recipientRows || []),
        closingRows: Array.from(result.closingRows || []),
        warningText: result.warningText || "",
        retryText
    }
}

const operations = {quoteAwards, awardResult}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing award operation " + op)
        return operations[op](parameters || {})
    }
})
