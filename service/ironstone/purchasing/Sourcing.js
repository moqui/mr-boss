// Purchasing's RFQ and supplier quote reads (design-purchasing §5 QuoteRequests, QuoteRequestDetail, Quotes, QuoteDetail;
// impl-purchasing P11): the RFQ list (find#QuoteRequests: the RFQs of the user's organizations by view, with what was sent,
// invited and answered), QuoteRequestDetail (get#QuoteRequest: the header, items with their source requests, the invited
// suppliers' quotes with when each was sent the RFQ and whether it changed since, the responses, the published PDFs, the
// history from the audit log, and the actions the user's capabilities allow), the quote list (find#SupplierQuotes: the
// purchase orders in the quote statuses), QuoteDetail (get#SupplierQuote: the quote's header, terms, lines with their price
// history, evidence and RFQ), the Today source of RFQs due and Home's RFQs-due and quotes-expiring counts with the buying
// policy's warning days. Prices and amounts are left out for a user who neither buys nor reads supplier prices or the books.
// The writes are mantle.order.SourcingServices' (Sourcing.js in mr-mantle), called after AccessServices.check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const sourcing = ec.resource.script("component://mr-mantle/service/mantle/order/Sourcing.js")
const policy = ec.resource.script("component://mr-mantle/service/mantle/order/PurchasePolicy.js")
const {find, one, rows, ms, dateText, denied} = lib

const REQUEST = "mantle.request.Request",
    ITEM = "mantle.request.RequestItem",
    ITEM_ORDER = "mantle.request.RequestItemOrder",
    ORDER = "mantle.order.OrderHeader",
    PART = "mantle.order.OrderPart",
    ORDER_ITEM = "mantle.order.OrderItem"
const rfqType = sourcing.rfqType
const quoteStatuses = sourcing.quoteStatuses
const openStatuses = ["ReqDraft", "ReqSubmitted", "ReqReviewed", "ReqInProgress"]
const readLimit = 500
const dayMs = 24 * 60 * 60 * 1000
const rfqViews = {
    open: {label: "Open", statuses: openStatuses},
    draft: {label: "Drafts", statuses: ["ReqDraft"]},
    due: {label: "Responses due", statuses: ["ReqSubmitted", "ReqReviewed"], due: true},
    changed: {label: "Changed since sent", statuses: openStatuses, changed: true},
    closed: {label: "Closed", statuses: ["ReqCompleted", "ReqCancelled"]},
    all: {label: "All"}
}
const quoteViews = {
    requested: {label: "Awaiting the supplier", statuses: ["OrderRequested"]},
    proposed: {label: "Quoted", statuses: ["OrderProposed"]},
    expiring: {label: "Expiring", statuses: ["OrderProposed"], expiring: true},
    expired: {label: "Expired", statuses: ["OrderProposed"], expired: true},
    all: {label: "All", statuses: quoteStatuses.concat(["OrderRejected"])}
}
const requestColors = {
    ReqDraft: "grey-8",
    ReqSubmitted: "primary",
    ReqReviewed: "warning",
    ReqInProgress: "primary",
    ReqCompleted: "positive",
    ReqCancelled: "grey-8"
}
const quoteColors = {OrderRequested: "warning", OrderProposed: "primary", OrderRejected: "grey-8", OrderCancelled: "grey-8"}
const quoteStateText = {OrderRequested: "Awaiting the supplier", OrderProposed: "Quoted", OrderRejected: "Declined"}
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value == null || value === "" ? 0 : value)
const quantityText = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const uomText = uomId => (uomId ? one("moqui.basic.Uom", {uomId})?.abbreviation || uomId : "")
const now = () => Number(ec.user.nowTimestamp)
// Whether the user sees quoted prices and amounts: a buyer, an approver, a supplier-price reader or a finance reader.
const amountsVisible = can => !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead)
const money = (value, currencyUomId) =>
    value == null ? "" : currencyUomId ? ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId) : String(value)
const buyerIdsOf = userScope =>
    userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
const productText = productId => {
    if (!productId) return ""
    const product = one("mantle.product.Product", {productId})
    return product ? [product.pseudoId || productId, product.productName].filter(Boolean).join(" · ") : productId
}
function requireLists(userScope) {
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "RFQs and quotes are not available")
}

// ===== RFQs =====
// The RFQs of the buyers, newest first, at most readLimit, by status, organization, text and invited supplier.
function rfqsInScope(userScope, p = {}) {
    let buyers = buyerIdsOf(userScope)
    if (!blank(p.organizationPartyId)) {
        if (!purchasing.owns(userScope, p.organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
        buyers = [String(p.organizationPartyId)]
    }
    const factory = ec.entity.conditionFactory
    let query = find("mantle.request.RequestAndParty", {requestTypeEnumId: rfqType, roleTypeId: "OrgInternal"})
        .condition("partyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("thruDate", "is-null", null)
        .orderBy("-requestDate")
        .limit(readLimit + 1)
    if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
    else if (p.statuses) query = query.condition("statusId", "in", p.statuses)
    if (!blank(p.text))
        query = query.condition(
            factory.makeCondition(
                ["requestId", "requestName"].map(field => factory.makeCondition(field, "like", likeText(p.text)).ignoreCase()),
                "or"
            )
        )
    if (!blank(p.vendorPartyId)) {
        const orderIds = Array.from(
            find("mantle.order.OrderPart", {vendorPartyId: String(p.vendorPartyId)})
                .selectField("orderId")
                .limit(2000)
                .list()
        ).map(row => row.orderId)
        const requestIds = orderIds.length
            ? Array.from(
                  find(ITEM_ORDER).condition("orderId", "in", orderIds).selectField("requestId").distinct(true).list()
              ).map(row => row.requestId)
            : []
        query = query.condition("requestId", "in", requestIds.length ? requestIds : ["_NA_"])
    }
    const found = Array.from(query.list())
    return found.filter((row, index) => found.findIndex(other => other.requestId === row.requestId) === index)
}
// An RFQ's invitations with their state: the supplier, the quote's status, when it was last sent the RFQ and whether the RFQ
// changed since (a material change needs a new send).
function invitationRows(requestId, revision, can) {
    const showAmounts = amountsVisible(can)
    return sourcing.invitationsOf(requestId).map(invitation => {
        const sentAt = sourcing.sentAtOf(invitation.orderId)
        const live = quoteStatuses.includes(invitation.order.statusId)
        const part = invitation.part
        const expired = sourcing.expired(part)
        return {
            orderId: invitation.orderId,
            supplierPartyId: invitation.supplierPartyId,
            supplierName: lib.partyNames([invitation.supplierPartyId])[invitation.supplierPartyId] || invitation.supplierPartyId,
            statusId: invitation.order.statusId,
            statusText: quoteStateText[invitation.order.statusId] || statusText(invitation.order.statusId),
            statusColor: quoteColors[invitation.order.statusId] || "grey-8",
            sentText: sentAt ? dateText(sentAt) : "Not sent",
            sendState: !live ? "" : !sentAt ? "Not sent" : sentAt < revision ? "Changed since sent" : "Sent",
            needsSend: live && (sentAt ?? -1) < revision,
            proposed: invitation.order.statusId === "OrderProposed",
            receivedText: part.otherPartyOrderDate ? dateText(part.otherPartyOrderDate) : "",
            reference: part.otherPartyOrderId || "",
            validityText: validityText(part),
            expired,
            amountText:
                invitation.order.statusId === "OrderProposed"
                    ? showAmounts
                        ? money(invitation.order.grandTotal, invitation.order.currencyUomId)
                        : "Withheld"
                    : ""
        }
    })
}
const validityText = part =>
    part.validThruDate
        ? (part.validFromDate ? dateText(part.validFromDate) + " to " : "until ") + dateText(part.validThruDate)
        : part.validFromDate
          ? "from " + dateText(part.validFromDate)
          : ""
// find#QuoteRequests: one page of the RFQs of the user's organizations by view and filters, each with its due date,
// revision, items and its suppliers invited, sent and answered.
function findRfqs(p) {
    const userScope = purchasing.required()
    requireLists(userScope)
    const view = rfqViews[p.view] ? p.view : "open"
    const definition = rfqViews[view]
    const found = rfqsInScope(userScope, Object.assign({}, p, {statuses: definition.statuses}))
    const truncated = found.length > readLimit
    let list = found.slice(0, readLimit)
    const horizon = now() + dayMs
    if (definition.due) list = list.filter(row => row.responseRequiredDate && ms(row.responseRequiredDate) <= horizon)
    const names = lib.partyNames(list.map(row => row.partyId))
    const rowsOut = []
    for (const row of list) {
        const revision = sourcing.revisionOf(row.requestId)
        const invitations = invitationRows(row.requestId, revision, userScope.capabilities)
        const changed = invitations.some(invitation => invitation.needsSend)
        if (definition.changed && !changed) continue
        const live = invitations.filter(invitation => invitation.statusId !== "OrderRejected")
        rowsOut.push({
            requestId: row.requestId,
            requestName: row.requestName || row.requestId,
            organizationName: names[row.partyId] || row.partyId,
            statusId: row.statusId,
            statusText: row.statusId === "ReqSubmitted" ? "Sent" : statusText(row.statusId),
            statusColor: requestColors[row.statusId] || "grey-8",
            dueText: dateText(row.responseRequiredDate),
            overdue:
                !!row.responseRequiredDate &&
                ms(row.responseRequiredDate) < now() &&
                ["ReqSubmitted", "ReqReviewed"].includes(row.statusId),
            revisionText: revision ? dateText(revision) : "",
            itemsText: String(find(ITEM, {requestId: row.requestId}).condition("statusId", "not-equals", "ReqCancelled").count()),
            invitedText: String(live.length),
            respondedText: live.length ? live.filter(invitation => invitation.proposed).length + " of " + live.length : "",
            sendText: changed
                ? invitations.some(invitation => invitation.sentText !== "Not sent")
                    ? "Changed since sent"
                    : "Not sent"
                : ""
        })
    }
    if (truncated) ec.message.addMessage("Only the newest " + readLimit + " RFQs were read; narrow the filters", "warning")
    return Object.assign({viewLabel: definition.label, view}, lib.pageList(rowsOut, p, "rfqRows"))
}

// get#QuoteRequest: QuoteRequestDetail's read of an RFQ the user may work with.
function rfqDetail(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "rfq", p.requestId)
    const rfq = sourcing.rfqOf(String(p.requestId))
    const request = rfq.request
    const can = userScope.capabilities
    const revision = sourcing.revisionOf(rfq.requestId)
    const items = rows(ITEM, {requestId: rfq.requestId})
        .filter(item => item.statusId !== "ReqCancelled")
        .sort((a, b) => String(a.requestItemSeqId).localeCompare(String(b.requestItemSeqId)))
    const sources = rows("mantle.request.RequestItemAssoc", {requestId: rfq.requestId})
    const itemRows = items.map(item => ({
        requestItemSeqId: item.requestItemSeqId,
        productId: item.productId || null,
        productText: productText(item.productId),
        description: item.description || "",
        quantity: item.quantity,
        quantityText: quantityText(item.quantity),
        quantityUomId: item.quantityUomId || null,
        uomText: uomText(item.quantityUomId),
        requiredByDate: item.requiredByDate,
        requiredByText: dateText(item.requiredByDate),
        sourceText: sources
            .filter(row => row.requestItemSeqId === item.requestItemSeqId)
            .map(row => row.otherRequestId + ":" + row.otherRequestItemSeqId)
            .join(", ")
    }))
    const invitations = invitationRows(rfq.requestId, revision, can)
    const closed = ["ReqCompleted", "ReqCancelled"].includes(request.statusId)
    const facility = request.facilityId ? one("mantle.facility.Facility", {facilityId: request.facilityId}) : null
    const published = rows("mantle.request.RequestContent", {requestId: rfq.requestId, contentTypeEnumId: "RqCntRfqPublished"})
        .sort((a, b) => ms(b.contentDate) - ms(a.contentDate))
        .map(row => ({
            requestContentId: row.requestContentId,
            dateText: dateText(row.contentDate),
            description: row.description || ""
        }))
    const live = invitations.filter(row => row.statusId !== "OrderRejected")
    const sendCount = invitations.filter(row => row.needsSend).length
    const canWrite = !!can.buy && !closed
    return {
        rfq: {
            requestId: rfq.requestId,
            requestName: request.requestName || rfq.requestId,
            description: request.description || "",
            organizationPartyId: rfq.organizationPartyId,
            organizationName: lib.partyNames([rfq.organizationPartyId])[rfq.organizationPartyId] || rfq.organizationPartyId,
            filedByName: request.filedByPartyId ? lib.partyNames([request.filedByPartyId])[request.filedByPartyId] || "" : "",
            facilityId: request.facilityId || null,
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            currencyUomId: request.currencyUomId || null,
            responseRequiredDate: request.responseRequiredDate,
            dueText: dateText(request.responseRequiredDate),
            statusId: request.statusId,
            statusText: request.statusId === "ReqSubmitted" ? "Sent" : statusText(request.statusId),
            statusColor: requestColors[request.statusId] || "grey-8",
            revisionText: revision ? dateText(revision) : "",
            publishedText: published.length ? published[0].dateText : "",
            changedSinceSent: published.length > 0 && sendCount > 0,
            respondedText: live.length ? live.filter(row => row.proposed).length + " of " + live.length + " answered" : "",
            sendCount,
            canEdit: canWrite,
            canInvite: canWrite && items.length > 0,
            canSend: canWrite && items.length > 0 && sendCount > 0,
            canEnterQuote: canWrite,
            itemRows,
            invitationRows: invitations,
            responseRows: invitations.filter(row => row.proposed),
            publishedRows: published
        },
        historyRows: historyOf(rfq.requestId)
    }
}
// The RFQ's history: its items' and header's logged changes and its status, newest first.
function historyOf(requestId) {
    const labels = {
        productId: "product",
        quantity: "quantity",
        quantityUomId: "unit",
        requiredByDate: "required by",
        description: "description",
        statusId: "status",
        responseRequiredDate: "response date"
    }
    const audit = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", "in", [REQUEST, ITEM])
            .condition("pkPrimaryValue", requestId)
            .condition("changedFieldName", "in", Object.keys(labels))
            .orderBy("-changedDate")
            .limit(100)
            .list()
    )
    const users = {}
    const userName = userId =>
        userId ? (users[userId] ??= one("moqui.security.UserAccount", {userId})?.userFullName || userId) : ""
    const value = (field, text) => {
        if (text == null || text === "") return ""
        if (field === "statusId") return statusText(text)
        if (field === "productId") return productText(text)
        if (field === "requiredByDate" || field === "responseRequiredDate") return dateText(text)
        return String(text)
    }
    return audit.map(row => ({
        dateText: dateText(row.changedDate),
        whatText:
            (row.changedEntityName === ITEM ? "Item " + (row.pkSecondaryValue || "") + " " : "RFQ ") +
            labels[row.changedFieldName],
        fromText: value(row.changedFieldName, row.oldValueText),
        toText: value(row.changedFieldName, row.newValueText),
        byText: userName(row.changedByUserId),
        reason: row.changeReason || ""
    }))
}

// ===== supplier quotes =====
// The RFQ of a quote order (its lines' RequestItemOrder links), or null for an unsolicited quote.
function rfqIdOf(orderId) {
    const link = Array.from(find(ITEM_ORDER, {orderId}).limit(1).list())[0]
    if (!link) return null
    return one(REQUEST, {requestId: link.requestId})?.requestTypeEnumId === rfqType ? link.requestId : null
}
// find#SupplierQuotes: one page of the quotes of the user's organizations (the purchase orders in the quote statuses, and the
// declined ones in All), by view, supplier, RFQ, organization and text, newest first.
function findQuotes(p) {
    const userScope = purchasing.required()
    requireLists(userScope)
    const view = quoteViews[p.view] ? p.view : "all"
    const definition = quoteViews[view]
    let buyers = buyerIdsOf(userScope)
    if (!blank(p.organizationPartyId)) {
        if (!purchasing.owns(userScope, p.organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
        buyers = [String(p.organizationPartyId)]
    }
    const factory = ec.entity.conditionFactory
    const internal = rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internal)
        .condition("statusId", "in", definition.statuses)
        .orderBy("-orderId")
        .limit(readLimit + 1)
    if (!blank(p.vendorPartyId)) query = query.condition("vendorPartyId", String(p.vendorPartyId))
    if (!blank(p.requestId)) {
        const orderIds = Array.from(
            find(ITEM_ORDER, {requestId: String(p.requestId)})
                .selectField("orderId")
                .distinct(true)
                .list()
        ).map(row => row.orderId)
        query = query.condition("orderId", "in", orderIds.length ? orderIds : ["_NA_"])
    }
    if (!blank(p.text))
        query = query.condition(
            factory.makeCondition(
                ["orderId", "orderName", "otherPartyOrderId"].map(field =>
                    factory.makeCondition(field, "like", likeText(p.text)).ignoreCase()
                ),
                "or"
            )
        )
    const found = Array.from(query.list())
    const truncated = found.length > readLimit
    let list = found.slice(0, readLimit)
    if (definition.expired) list = list.filter(row => sourcing.expired(row))
    if (definition.expiring)
        list = list.filter(row => {
            if (!row.validThruDate || sourcing.expired(row)) return false
            const warnDays = Number(policy.effective(row.customerPartyId).policy.quoteExpiryWarnDays ?? 7)
            return ms(row.validThruDate) <= now() + warnDays * dayMs
        })
    const showAmounts = amountsVisible(userScope.capabilities)
    const names = lib.partyNames(list.flatMap(row => [row.vendorPartyId, row.customerPartyId]))
    const rowsOut = list
        .filter(row => !!purchasing.supplierOf(userScope, row.vendorPartyId))
        .map(row => {
            const expired = row.statusId === "OrderProposed" && sourcing.expired(row)
            return {
                orderId: row.orderId,
                supplierName: names[row.vendorPartyId] || row.vendorPartyId,
                organizationName: names[row.customerPartyId] || row.customerPartyId,
                reference: row.otherPartyOrderId || "",
                statusId: row.statusId,
                statusText: expired ? "Expired" : quoteStateText[row.statusId] || statusText(row.statusId),
                statusColor: expired ? "negative" : quoteColors[row.statusId] || "grey-8",
                currencyUomId: row.currencyUomId,
                validityText: validityText(row),
                expired,
                rfqId: rfqIdOf(row.orderId) || "",
                channelText: enumText(row.salesChannelEnumId),
                amountText:
                    row.statusId !== "OrderProposed" ? "" : showAmounts ? money(row.grandTotal, row.currencyUomId) : "Withheld"
            }
        })
    if (truncated) ec.message.addMessage("Only the newest " + readLimit + " quotes were read; narrow the filters", "warning")
    return Object.assign({viewLabel: definition.label, view}, lib.pageList(rowsOut, p, "quoteRows"))
}
// get#SupplierQuote: QuoteDetail's read of a quote the user may work with: its header and terms, lines with each one's price
// history (withheld from a user who may not see amounts), evidence, its RFQ and the actions.
function quoteDetail(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "order", p.orderId)
    const order = one(ORDER, {orderId: p.orderId})
    if (!order || !quoteStatuses.concat(["OrderRejected", "OrderCancelled"]).includes(order.statusId))
        denied("RECORD_UNAVAILABLE", "Quote " + p.orderId + " is not available")
    const part = rows(PART, {orderId: order.orderId})[0]
    const can = userScope.capabilities
    const showAmounts = amountsVisible(can)
    const currencyUomId = order.currencyUomId
    const priceLogs = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", ORDER_ITEM)
            .condition("pkPrimaryValue", order.orderId)
            .condition("changedFieldName", "in", ["unitAmount", "quantity", "promisedDate"])
            .orderBy("changedDate")
            .list()
    )
    const users = {}
    const userName = userId =>
        userId ? (users[userId] ??= one("moqui.security.UserAccount", {userId})?.userFullName || userId) : ""
    const links = rows(ITEM_ORDER, {orderId: order.orderId})
    const lineRows = rows(ORDER_ITEM, {orderId: order.orderId})
        .filter(item => !item.parentItemSeqId)
        .sort((a, b) => String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId)))
        .map(item => {
            const link = links.find(row => row.orderItemSeqId === item.orderItemSeqId)
            const history = priceLogs
                .filter(row => row.pkSecondaryValue === item.orderItemSeqId && row.oldValueText != null)
                .filter(row => showAmounts || row.changedFieldName !== "unitAmount")
                .map(row => ({
                    dateText: dateText(row.changedDate),
                    whatText: {unitAmount: "price", quantity: "quantity", promisedDate: "promised date"}[row.changedFieldName],
                    fromText:
                        row.changedFieldName === "unitAmount"
                            ? money(row.oldValueText, currencyUomId)
                            : row.changedFieldName === "promisedDate"
                              ? dateText(row.oldValueText)
                              : quantityText(row.oldValueText),
                    toText:
                        row.changedFieldName === "unitAmount"
                            ? money(row.newValueText, currencyUomId)
                            : row.changedFieldName === "promisedDate"
                              ? dateText(row.newValueText)
                              : quantityText(row.newValueText),
                    byText: userName(row.changedByUserId),
                    reason: row.changeReason || ""
                }))
            const amount = dec(item.quantity).multiply(dec(item.unitAmount))
            return {
                orderItemSeqId: item.orderItemSeqId,
                productId: item.productId || null,
                productText: productText(item.productId) || item.itemDescription || "",
                itemDescription: item.itemDescription || "",
                otherPartyProductId: item.otherPartyProductId || "",
                quantity: item.quantity,
                quantityText: quantityText(item.quantity),
                uomText: uomText(item.quantityUomId),
                requiredByText: dateText(item.requiredByDate),
                promisedDate: item.promisedDate,
                promisedText: dateText(item.promisedDate),
                unitAmount: showAmounts ? item.unitAmount : null,
                priceText: showAmounts
                    ? dec(item.unitAmount).isZero()
                        ? "Not quoted"
                        : money(item.unitAmount, currencyUomId)
                    : "Withheld",
                amountText: showAmounts ? money(amount, currencyUomId) : "Withheld",
                rfqLineText: link ? link.requestId + ":" + link.requestItemSeqId : "",
                historyRows: history,
                historyText: history
                    .map(row => row.dateText + " " + row.whatText + " " + row.fromText + " → " + row.toText)
                    .join("; ")
            }
        })
    const evidenceRows = rows("mantle.order.OrderContent", {orderId: order.orderId})
        .filter(row => row.orderContentTypeEnumId === "OctSupplierQuote")
        .sort((a, b) => ms(b.contentDate) - ms(a.contentDate))
        .map(row => ({
            orderContentId: row.orderContentId,
            dateText: dateText(row.contentDate),
            description: row.description || "",
            hasFile: !!row.contentLocation,
            byText: userName(row.userId)
        }))
    const term = part.settlementTermId
        ? one("mantle.account.invoice.SettlementTerm", {settlementTermId: part.settlementTermId})
        : null
    const partLogs = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", PART)
            .condition("pkPrimaryValue", order.orderId)
            .condition("changedFieldName", "in", [
                "validFromDate",
                "validThruDate",
                "otherPartyOrderId",
                "settlementTermId",
                "tradeTermEnumId",
                "estimatedDeliveryDate"
            ])
            .condition("oldValueText", "is-not-null", null)
            .orderBy("-changedDate")
            .limit(50)
            .list()
    ).map(row => ({
        dateText: dateText(row.changedDate),
        whatText: row.changedFieldName,
        fromText: /Date$/.test(row.changedFieldName) ? dateText(row.oldValueText) : row.oldValueText || "",
        toText: /Date$/.test(row.changedFieldName) ? dateText(row.newValueText) : row.newValueText || "",
        byText: userName(row.changedByUserId),
        reason: row.changeReason || ""
    }))
    const expired = order.statusId === "OrderProposed" && sourcing.expired(part)
    const live = quoteStatuses.includes(order.statusId)
    const rfqId = rfqIdOf(order.orderId)
    return {
        quote: {
            orderId: order.orderId,
            orderName: order.orderName || "",
            supplierPartyId: part.vendorPartyId,
            supplierName: lib.partyNames([part.vendorPartyId])[part.vendorPartyId] || part.vendorPartyId,
            organizationPartyId: part.customerPartyId,
            organizationName: lib.partyNames([part.customerPartyId])[part.customerPartyId] || part.customerPartyId,
            statusId: order.statusId,
            statusText: expired ? "Expired" : quoteStateText[order.statusId] || statusText(order.statusId),
            statusColor: expired ? "negative" : quoteColors[order.statusId] || "grey-8",
            expired,
            reference: part.otherPartyOrderId || "",
            quoteDateText: dateText(part.otherPartyOrderDate),
            validFromDate: part.validFromDate,
            validThruDate: part.validThruDate,
            validityText: validityText(part),
            deliveryText: dateText(part.estimatedDeliveryDate),
            estimatedDeliveryDate: part.estimatedDeliveryDate,
            settlementTermId: part.settlementTermId || null,
            termText: term ? term.description || term.settlementTermId : "",
            tradeTermEnumId: part.tradeTermEnumId || null,
            incotermText: enumText(part.tradeTermEnumId),
            channelText: enumText(order.salesChannelEnumId),
            salesChannelEnumId: order.salesChannelEnumId || null,
            currencyUomId: order.currencyUomId,
            revisionText: String(order.orderRevision ?? 1),
            totalText: showAmounts ? money(order.grandTotal, currencyUomId) : "Withheld",
            rfqId,
            canEdit: !!can.buy && live,
            canAnswer: !!can.buy && order.statusId === "OrderRequested",
            canPublish: !!can.supplierPriceEdit && order.statusId === "OrderProposed" && !expired,
            // an expired quote shows but cannot be placed (P12's award reads the same)
            canPlace: order.statusId === "OrderProposed" && !expired,
            lineRows,
            evidenceRows,
            termHistoryRows: partLogs
        }
    }
}

// ===== Home and Today =====
// Home's counts (P11): the RFQs sent whose response date has come with a supplier still to answer, and the proposed quotes
// expiring within the buying policy's warning days, for the buying lists' groups.
function homeCounts(userScope) {
    if (!userScope.read || !userScope.capabilities.listRead) return {quoteDueCount: null, quoteExpiringCount: null}
    return {quoteDueCount: dueRfqs(userScope, now() + dayMs).length, quoteExpiringCount: expiringQuotes(userScope).length}
}
// The sent RFQs due by a time with a quote still requested.
function dueRfqs(userScope, until) {
    return rfqsInScope(userScope, {statuses: ["ReqSubmitted", "ReqReviewed"]})
        .slice(0, readLimit)
        .filter(row => row.responseRequiredDate && ms(row.responseRequiredDate) <= until)
        .filter(row => sourcing.invitationsOf(row.requestId).some(invitation => invitation.order.statusId === "OrderRequested"))
}
function expiringQuotes(userScope) {
    const buyers = buyerIdsOf(userScope)
    const list = Array.from(
        find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
            .condition("statusId", "OrderProposed")
            .condition("validThruDate", "is-not-null", null)
            .limit(readLimit)
            .list()
    )
    const warnDays = {}
    return list.filter(row => {
        if (sourcing.expired(row)) return false
        warnDays[row.customerPartyId] ??= Number(policy.effective(row.customerPartyId).policy.quoteExpiryWarnDays ?? 7)
        return ms(row.validThruDate) <= now() + warnDays[row.customerPartyId] * dayMs
    })
}
// The Purchasing today-source of RFQs (P11): for a buyer, the sent RFQs due by the end of the range with a supplier still to
// answer, each opening QuoteRequestDetail. Another user's Today and a user who does not buy get none.
function today(p) {
    const label = "RFQs due"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = purchasing.scope()
    if (!userScope.read || !userScope.capabilities.buy || !userScope.capabilities.listRead) return {items: [], label}
    const until = p.thruDate ? ms(p.thruDate) : now() + dayMs
    return {
        label,
        items: dueRfqs(userScope, until)
            .slice(0, 50)
            .map(row => ({
                kind: "purchaseRfq",
                workEffortId: null,
                requestId: row.requestId,
                title: "Quotes due for RFQ " + row.requestId + " · " + (row.requestName || ""),
                dueDate: row.responseRequiredDate,
                startDate: null,
                endDate: null,
                allDay: true,
                priority: null,
                statusId: row.statusId,
                assignees: [],
                canUpdate: false,
                hasCallLink: false,
                url: purchasing.recordUrl("rfq", row.requestId),
                record: {recordEntityName: REQUEST, recordId: row.requestId, recordName: row.requestName || row.requestId}
            }))
    }
}

// ===== choices =====
// The open RFQs of the user's organizations a quote may answer (NewSupplierQuote), by id or name.
function rfqChoices(userScope, term, selected) {
    const options = rfqsInScope(userScope, {statuses: openStatuses, text: term || null})
        .slice(0, 30)
        .map(row => ({value: row.requestId, label: row.requestId + " · " + (row.requestName || "")}))
    if (selected && !options.some(option => option.value === selected)) {
        try {
            const record = purchasing.recordOf(userScope, "rfq", selected)
            options.push({value: selected, label: selected + " · " + record.label})
        } catch (_) {
            // not the user's: left out
        }
    }
    return options
}
// How a quote came (the SalesChannel enumeration's offline channels).
function channelChoices() {
    return ["ScEmail", "ScPhone", "ScFax", "ScPostal", "ScWeb", "ScEdi"].map(enumId => ({value: enumId, label: enumText(enumId)}))
}

const operations = {findRfqs, rfqDetail, findQuotes, quoteDetail, today}
;({
    homeCounts,
    rfqChoices,
    channelChoices,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing sourcing operation " + op)
        return operations[op](parameters || {})
    }
})
