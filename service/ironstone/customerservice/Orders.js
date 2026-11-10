// Customer Service's order, shipment and invoice reads (impl-customer-service P3; design-customer-service §4 Orders,
// OrderDetail, ShipmentDetail, InvoiceDetail; crosscut §3.6, §3.8, §3.16; CaseServices.xml find#ServiceOrders,
// OrderServices.xml): every read is limited by CustomerService.js's scope (the selling organizations the user works in and
// the customers they serve) in the query, and each record is checked again by recordOf, so a missing record and another
// organization's give the same answer (F30). The audience rule of §2 holds in each answer: a payment's details are never in
// it; an order's line prices and totals (and its stored confirmation) only for a holder of PRICE_VIEW, ACCOUNTING_VIEW or
// RECEIVABLE_VIEW, and invoice amounts, balances and payments only for a holder of ACCOUNTING_VIEW or RECEIVABLE_VIEW
// (withheld, never zero); a credit hold, its type and reason, only for a holder of CUSTOMER_CREDIT_VIEW. The writes are Mantle's: the confirmation resend
// (mantle.order.OrderConfirmationServices), a case link (link#RequestRecord), an invoice copy (send#Invoice), called by the
// screens after check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const {find, one, rows, ms} = lib

const ORDER_PART = "mantle.order.OrderHeaderAndPart"
const openOrderStatuses = ["OrderPlaced", "OrderProcessing", "OrderApproved", "OrderSent", "OrderHold"]
const caseOpenStatuses = ["ReqSubmitted", "ReqReviewed", "ReqInProgress", "ReqWaitingCustomer", "ReqOnHold"]
const findCap = 200
const factory = () => ec.entity.conditionFactory
const blank = value => value == null || String(value).trim() === ""
const L = text => ec.l10n.localize(text)
const textOf = value => (value == null || value === "" ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy HH:mm"))
const dayText = value => (value == null || value === "" ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const quantityText = value => (value == null ? "" : ec.l10n.format(toDecimal(value), "#,##0.###"))
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(ec.l10n.roundCurrency(toDecimal(value), currencyUomId), currencyUomId)
const withheld = () => L("Withheld")
const productName = productId => {
    const product = productId ? one("mantle.product.Product", {productId}) : null
    return product ? product.productName || product.pseudoId || productId : ""
}
// the §2 audience: who reads invoice amounts and payments, who reads an order's prices and totals (a price reader or a
// finance reader; the service reader is neither), and credit facts
const moneyRead = () => lib.access.has("ACCOUNTING_VIEW") || lib.access.has("RECEIVABLE_VIEW")
const amountRead = () => lib.access.has("PRICE_VIEW") || moneyRead()
const creditRead = userScope => !!userScope.capabilities.creditRead
// a record's Customer Service link for the user, or null
function linkOf(userScope, kind, recordId) {
    try {
        cs.recordOf(userScope, kind, recordId)
        return cs.recordUrl(kind, recordId)
    } catch (error) {
        return null
    }
}

// ===== find#ServiceOrders (F30) =====
// Exact first: an order id, the order's external id or the customer's reference (otherPartyOrderId); then the order name and
// the customers the user serves by name, id, email or phone; narrowed by customer, product, status and the entry date.
// A missing id and another organization's both find nothing ("No order matches").
function exactIds(userScope, term) {
    const vendors = cs.vendorIds(userScope)
    const ids = new Set()
    for (const field of ["orderId", "externalId", "otherPartyOrderId"])
        for (const row of find(ORDER_PART)
            .condition("vendorPartyId", "in", vendors)
            .condition(field, term)
            .selectField("orderId")
            .limit(10)
            .list())
            ids.add(row.orderId)
    return Array.from(ids)
}
function customersMatching(userScope, term) {
    const found = lib.call("ironstone.customerservice.CaseServices.find#ServiceCustomers", {term})
    return Array.from(found.customers || []).map(row => row.partyId)
}
function serviceOrders(p) {
    const userScope = cs.required()
    const term = String(p.term || "").trim()
    const narrowed = !blank(p.customerPartyId) || !blank(p.productId) || !blank(p.statusId) || p.fromDate || p.thruDate
    if (!term && !narrowed)
        return {orders: [], exact: false, truncated: false, message: L("Enter an order id, customer, email or phone")}
    let exact = false
    let ids = term ? exactIds(userScope, term) : []
    if (ids.length) exact = true
    if (!exact) {
        let query = find(ORDER_PART)
            .condition("vendorPartyId", "in", cs.vendorIds(userScope))
            .selectField("orderId")
            .distinct(true)
            .orderBy("-entryDate")
        if (term) {
            const customers = customersMatching(userScope, term)
            const byTerm = [factory().makeCondition("orderName", "like", cs.likeText(term)).ignoreCase()]
            if (customers.length) byTerm.push(factory().makeCondition("customerPartyId", "in", customers))
            query = query.condition(factory().makeCondition(byTerm, "or"))
        }
        if (!blank(p.customerPartyId)) query = query.condition("customerPartyId", p.customerPartyId)
        if (!blank(p.statusId)) query = query.condition("statusId", p.statusId)
        if (p.fromDate) query = query.condition("entryDate", ">=", p.fromDate)
        if (p.thruDate) query = query.condition("entryDate", "<", p.thruDate)
        if (!blank(p.productId)) {
            const withProduct = Array.from(
                find("mantle.order.OrderItem", {productId: p.productId})
                    .selectField("orderId")
                    .distinct(true)
                    .limit(findCap)
                    .list()
            ).map(row => row.orderId)
            query = query.condition("orderId", "in", withProduct.length ? withProduct : ["_NA_"])
        }
        ids = Array.from(
            query
                .selectField("entryDate")
                .limit(findCap + 1)
                .list()
        ).map(row => row.orderId)
        ids = Array.from(new Set(ids))
    }
    const truncated = ids.length > findCap
    const orders = []
    for (const orderId of ids.slice(0, findCap)) {
        // each order on its own: one out of scope is left out, one that fails to read is named in the log
        try {
            cs.recordOf(userScope, "order", orderId)
            orders.push(orderRow(orderId))
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                ec.logger.error("Customer Service order " + orderId + " was not read: " + error.message)
        }
    }
    const paged = lib.pageList(orders, p, "orders")
    return Object.assign(paged, {
        exact,
        truncated,
        message: orders.length ? "" : L("No order matches")
    })
}
// An order's row for OrderResults: customer, dates, total, the order, fulfillment and payment states and the next delivery.
function orderRow(orderId) {
    const order = one("mantle.order.OrderHeader", {orderId})
    const parts = rows("mantle.order.OrderPart", {orderId})
    const customerIds = Array.from(new Set(parts.map(part => part.customerPartyId).filter(Boolean)))
    const shipments = shipmentsOf(orderId)
    const fulfillment = fulfillmentText(order, shipments)
    const next = shipments
        .filter(row => !["ShipDelivered", "ShipCancelled"].includes(row.statusId) && row.estimatedArrivalDate)
        .sort((a, b) => ms(a.estimatedArrivalDate) - ms(b.estimatedArrivalDate))[0]
    return {
        orderId,
        orderName: order.orderName || "",
        customerPartyId: customerIds[0] || null,
        customerName: customerIds.map(cs.partyName).join(", "),
        entryText: dayText(order.entryDate),
        placedText: dayText(order.placedDate),
        grandTotal: order.grandTotal,
        currencyUomId: order.currencyUomId,
        totalText: amountRead() ? money(order.grandTotal ?? 0, order.currencyUomId) : withheld(),
        statusId: order.statusId,
        statusText: cs.statusText(order.statusId),
        statusColor: order.statusId === "OrderHold" ? "warning" : order.statusId === "OrderCancelled" ? "grey-7" : "primary",
        fulfillmentText: fulfillment,
        paymentText: paymentText(orderId),
        nextDeliveryText: next ? dayText(next.estimatedArrivalDate) : "",
        url: cs.recordUrl("order", orderId)
    }
}
// The shipments of an order's items (ShipmentItemSource), oldest first.
function shipmentsOf(orderId) {
    const ids = Array.from(
        new Set(
            rows("mantle.shipment.ShipmentItemSource", {orderId})
                .map(row => row.shipmentId)
                .filter(Boolean)
        )
    )
    return ids.length
        ? Array.from(find("mantle.shipment.Shipment").condition("shipmentId", "in", ids).orderBy("entryDate").list())
        : []
}
function fulfillmentText(order, shipments) {
    if (!shipments.length) return openOrderStatuses.includes(order.statusId) ? L("Not shipped") : ""
    const statuses = shipments.map(row => row.statusId)
    if (statuses.every(statusId => statusId === "ShipDelivered")) return L("Delivered")
    if (statuses.some(statusId => statusId === "ShipShipped" || statusId === "ShipDelivered")) return L("Shipped")
    if (statuses.some(statusId => statusId === "ShipPacked")) return L("Packed")
    return L("Preparing")
}
// The invoices billing an order (OrderItemBilling).
function invoiceIdsOf(orderId) {
    return Array.from(
        new Set(
            rows("mantle.order.OrderItemBilling", {orderId})
                .map(row => row.invoiceId)
                .filter(Boolean)
        )
    )
}
// Paid, not paid or not invoiced: a state, never an amount.
function paymentText(orderId) {
    const ids = invoiceIdsOf(orderId)
    if (!ids.length) return L("Not invoiced")
    const invoices = Array.from(find("mantle.account.invoice.Invoice").condition("invoiceId", "in", ids).list()).filter(
        row => row.statusId !== "InvoiceCancelled"
    )
    if (!invoices.length) return L("Not invoiced")
    return invoices.every(row => row.statusId === "InvoicePmtRecvd") ? L("Paid") : L("Not paid")
}

// ===== OrderDetail's Customer Service branch (crosscut §3.6) =====
function orderDetail(p) {
    const userScope = cs.required()
    cs.recordOf(userScope, "order", p.orderId)
    const orderId = String(p.orderId)
    const order = one("mantle.order.OrderHeader", {orderId})
    const parts = rows("mantle.order.OrderPart", {orderId})
    const customerIds = Array.from(new Set(parts.map(part => part.customerPartyId).filter(Boolean)))
    const currencyUomId = order.currencyUomId
    const amounts = amountRead()
    const shipments = shipmentsOf(orderId)
    const sources = rows("mantle.shipment.ShipmentItemSource", {orderId})
    const issued = rows("mantle.product.issuance.AssetIssuance", {orderId})
    const itemRows = rows("mantle.order.OrderItem", {orderId})
        .sort((a, b) => String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId)))
        .map(item => {
            const shippedQuantity = issued
                .filter(row => row.orderItemSeqId === item.orderItemSeqId)
                .reduce((total, row) => total.add(toDecimal(row.quantity ?? 0)), toDecimal(0))
            const cancelled = toDecimal(item.quantityCancelled ?? 0)
            const amount = toDecimal(item.quantity ?? 0)
                .subtract(cancelled)
                .multiply(toDecimal(item.unitAmount ?? 0))
            return {
                orderItemSeqId: item.orderItemSeqId,
                productId: item.productId,
                description: item.productId ? productName(item.productId) : item.itemDescription || "",
                quantityText: quantityText(item.quantity),
                cancelledText: cancelled.isZero() ? "" : quantityText(cancelled),
                shippedText: item.productId ? quantityText(shippedQuantity) : "",
                priceText: amounts ? money(item.unitAmount ?? 0, currencyUomId) : withheld(),
                amountText: amounts ? money(amount, currencyUomId) : withheld(),
                productUrl: item.productId
                    ? "/qapps/CustomerService/Availability/Product360?productId=" + encodeURIComponent(item.productId)
                    : null
            }
        })
    const shipmentRows = shipments.map(shipment => shipmentRow(userScope, shipment, sources))
    const invoiceRows = invoiceIdsOf(orderId)
        .map(invoiceId => one("mantle.account.invoice.Invoice", {invoiceId}))
        .filter(Boolean)
        .map(invoice => invoiceRow(userScope, invoice))
    const confirmation = confirmationOf(orderId)
    const holds = holdRows(userScope, orderId)
    const recipients = recipientOptions(customerIds)
    return {
        order: {
            orderId,
            orderName: order.orderName || "",
            customerPartyId: customerIds[0] || null,
            customerName: customerIds.map(cs.partyName).join(", "),
            customerUrl: customerIds[0] ? linkOf(userScope, "customer", customerIds[0]) : null,
            organizationName: Array.from(new Set(parts.map(part => part.vendorPartyId)))
                .map(cs.partyName)
                .join(", "),
            statusId: order.statusId,
            statusText: cs.statusText(order.statusId),
            held: order.statusId === "OrderHold" || holds.length > 0,
            entryText: textOf(order.entryDate),
            placedText: textOf(order.placedDate),
            placed: !!order.placedDate,
            customerReference: parts
                .map(part => part.otherPartyOrderId)
                .filter(Boolean)
                .join(", "),
            totalText: amounts ? money(order.grandTotal ?? 0, currencyUomId) : withheld(),
            currencyUomId,
            fulfillmentText: fulfillmentText(order, shipments),
            paymentText: paymentText(orderId)
        },
        holds,
        itemRows,
        shipmentRows,
        invoiceRows,
        moneyRead: moneyRead(),
        amountRead: amounts,
        historyRows: statusHistory(orderId),
        caseRows: casesOf(userScope, "mantle.order.OrderHeader", orderId),
        confirmation,
        recipientOptions: recipients,
        senderOptions: senderOptions(),
        canResend: !!userScope.capabilities.caseEdit && !!order.placedDate && recipients.length > 0,
        canLinkCase: !!userScope.capabilities.caseEdit,
        newCaseUrl: customerIds[0]
            ? "/qapps/CustomerService/Cases/NewCase?customerPartyId=" +
              encodeURIComponent(customerIds[0]) +
              "&orderId=" +
              encodeURIComponent(orderId)
            : null
    }
}
// An order's open holds; a credit hold's type and reason only for a credit reader (that it is a credit hold is a credit
// fact), as find#Customers says "On hold".
function holdRows(userScope, orderId) {
    return rows("mantle.order.OrderHoldReason", {orderId})
        .filter(row => !row.releasedDate)
        .map(row => {
            const shown = row.holdTypeEnumId !== "OhtCredit" || creditRead(userScope)
            return {
                typeText: shown ? cs.enumText(row.holdTypeEnumId) : L("On hold"),
                reasonText: shown ? row.holdComment || "" : withheld(),
                placedText: textOf(row.placedDate)
            }
        })
}
// The order's status changes (the audit log), newest first.
function statusHistory(orderId) {
    return Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", "mantle.order.OrderHeader")
            .condition("changedFieldName", "statusId")
            .condition("pkPrimaryValue", orderId)
            .orderBy("-changedDate")
            .limit(30)
            .list()
    ).map(row => ({
        dateText: textOf(row.changedDate),
        fromText: row.oldValueText ? cs.statusText(row.oldValueText) : "",
        toText: cs.statusText(row.newValueText)
    }))
}
// The cases the user sees that are linked to a record (RequestRecord).
function casesOf(userScope, recordEntityName, recordId) {
    const out = []
    for (const link of rows("mantle.request.RequestRecord", {recordEntityName, recordId})) {
        const url = linkOf(userScope, "case", link.requestId)
        if (!url) continue
        const request = one("mantle.request.Request", {requestId: link.requestId})
        out.push({
            requestId: link.requestId,
            requestName: request?.requestName || link.requestId,
            statusText: cs.statusText(request?.statusId),
            open: caseOpenStatuses.includes(request?.statusId),
            linkedText: textOf(link.linkedDate),
            url
        })
    }
    return out
}
// The stored confirmation and its sends: each with its recipient, when, and the result on its message.
function confirmationOf(orderId) {
    const stored =
        rows("mantle.order.OrderContent", {orderId, orderContentTypeEnumId: "OctOrderConfirmation"}).sort(
            (a, b) => ms(a.contentDate) - ms(b.contentDate)
        )[0] || null
    const sends = rows("mantle.order.OrderEmailMessage", {orderId})
        .filter(row => row.orderContentId)
        .map(row => {
            const message = one("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId})
            return {
                emailMessageId: row.emailMessageId,
                recipient: message?.toAddresses || "",
                recipientName: row.partyId ? cs.partyName(row.partyId) : "",
                sentText: textOf(message?.sentDate || message?.messageDate),
                sortDate: ms(message?.sentDate || message?.messageDate) || 0,
                statusText: message ? cs.statusText(message.statusId) : "",
                versionText: row.orderContentId === stored?.orderContentId ? L("As placed") : row.orderContentId
            }
        })
        .sort((a, b) => b.sortDate - a.sortDate)
    return {
        stored: !!stored,
        storedText: stored ? textOf(stored.contentDate) : "",
        description: stored?.description || "",
        sends
    }
}
// The addresses a confirmation may go to (Mantle's check, OrderConfirmations.js), with their parties' names.
function recipientOptions(customerIds) {
    const allowed = ec.resource
        .script("component://mr-mantle/service/mantle/order/OrderConfirmations.js")
        .allowedRecipients(customerIds)
    return Array.from(allowed.entries()).map(([address, partyId]) => ({
        value: address,
        label: address + " · " + cs.partyName(partyId)
    }))
}
// The mail accounts the user may send from.
function senderOptions() {
    try {
        const access = lib.call("org.moqui.mail.EmailClientServices.get#EmailAccountAccess")
        return Array.from(access.accountList || [])
            .filter(account => account.canSend)
            .map(account => ({value: account.emailAccountId, label: account.accountName || account.emailAddress}))
    } catch (error) {
        ec.logger.warn("Customer Service sender accounts: " + error.message)
        return []
    }
}

// ===== shipments =====
function trackingOf(shipmentId) {
    const segments = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId})
    const packages = rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId})
    return segments.map(segment => {
        const codes = packages
            .filter(row => row.shipmentRouteSegmentSeqId === segment.shipmentRouteSegmentSeqId && row.trackingCode)
            .map(row => ({code: row.trackingCode, url: row.trackingUrl || null}))
        if (segment.masterTrackingCode) codes.unshift({code: segment.masterTrackingCode, url: segment.masterTrackingUrl || null})
        return {
            carrierName: segment.carrierPartyId && segment.carrierPartyId !== "_NA_" ? cs.partyName(segment.carrierPartyId) : "",
            methodText: cs.enumText(segment.shipmentMethodEnumId),
            statusText: cs.statusText(segment.statusId),
            codes,
            trackingText: codes.map(row => row.code).join(", "),
            trackingUrl: codes.find(row => row.url)?.url || null,
            arrivalText: dayText(segment.actualArrivalDate || segment.estimatedArrivalDate)
        }
    })
}
function shipmentRow(userScope, shipment, sources) {
    const tracking = trackingOf(shipment.shipmentId)
    return {
        shipmentId: shipment.shipmentId,
        statusText: cs.statusText(shipment.statusId),
        quantityText: quantityText(
            sources
                .filter(row => row.shipmentId === shipment.shipmentId)
                .reduce((total, row) => total.add(toDecimal(row.quantity ?? 0)), toDecimal(0))
        ),
        trackingText: tracking
            .map(row => row.trackingText)
            .filter(Boolean)
            .join(", "),
        trackingUrl: tracking.find(row => row.trackingUrl)?.trackingUrl || null,
        arrivalText: dayText(shipment.estimatedArrivalDate),
        url: linkOf(userScope, "shipment", shipment.shipmentId)
    }
}
// ShipmentDetail's Customer Service branch (crosscut §3.8): items, tracking, packages, the orders and returns it carries
// and the cases linked; no stock action.
function shipmentDetail(p) {
    const userScope = cs.required()
    cs.recordOf(userScope, "shipment", p.shipmentId)
    const shipmentId = String(p.shipmentId)
    const shipment = one("mantle.shipment.Shipment", {shipmentId})
    const items = rows("mantle.shipment.ShipmentItem", {shipmentId})
    const sources = rows("mantle.shipment.ShipmentItemSource", {shipmentId})
    const orderIds = Array.from(new Set(sources.map(row => row.orderId).filter(Boolean)))
    const returnIds = Array.from(new Set(sources.map(row => row.returnId).filter(Boolean)))
    const tracking = trackingOf(shipmentId)
    const incoming = cs.isInternal(shipment.toPartyId)
    const customerPartyId = incoming ? shipment.fromPartyId : shipment.toPartyId
    return {
        shipment: {
            shipmentId,
            kindText: incoming ? L("Return from the customer") : L("Shipment to the customer"),
            typeText: cs.enumText(shipment.shipmentTypeEnumId),
            statusText: cs.statusText(shipment.statusId),
            customerName: cs.partyName(customerPartyId),
            customerUrl: linkOf(userScope, "customer", customerPartyId),
            shipText: dayText(shipment.estimatedShipDate),
            arrivalText: dayText(shipment.estimatedArrivalDate),
            trackingText: tracking
                .map(row => row.trackingText)
                .filter(Boolean)
                .join(", "),
            trackingUrl: tracking.find(row => row.trackingUrl)?.trackingUrl || null
        },
        itemRows: items.map(item => ({
            productId: item.productId,
            productName: productName(item.productId),
            quantityText: quantityText(item.quantity)
        })),
        trackingRows: tracking,
        packageRows: rows("mantle.shipment.ShipmentPackage", {shipmentId}).map(row => ({
            shipmentPackageSeqId: row.shipmentPackageSeqId,
            weightText: row.weight == null ? "" : quantityText(row.weight) + " " + (row.weightUomId || "")
        })),
        orderRows: orderIds.map(orderId => ({orderId, url: linkOf(userScope, "order", orderId)})),
        returnRows: returnIds.map(returnId => ({
            returnId,
            statusText: cs.statusText(one("mantle.order.return.ReturnHeader", {returnId})?.statusId)
        })),
        caseRows: casesOf(userScope, "mantle.shipment.Shipment", shipmentId),
        updateText: updateText(shipment, tracking)
    }
}
// A plain-text delivery update an agent copies into a reply: status, tracking and expected arrival.
function updateText(shipment, tracking) {
    const parts = [L("Shipment") + " " + shipment.shipmentId + ": " + cs.statusText(shipment.statusId)]
    for (const row of tracking)
        if (row.trackingText)
            parts.push([row.carrierName, L("tracking") + " " + row.trackingText, row.trackingUrl].filter(Boolean).join(" · "))
    if (shipment.estimatedArrivalDate) parts.push(L("Expected") + " " + dayText(shipment.estimatedArrivalDate))
    return parts.join("\n")
}

// ===== invoices =====
function invoiceRow(userScope, invoice) {
    const read = moneyRead()
    return {
        invoiceId: invoice.invoiceId,
        statusText: cs.statusText(invoice.statusId),
        dateText: dayText(invoice.invoiceDate),
        dueText: dayText(invoice.dueDate),
        totalText: read ? money(invoice.invoiceTotal ?? 0, invoice.currencyUomId) : withheld(),
        unpaidText: read ? money(invoice.unpaidTotal ?? 0, invoice.currencyUomId) : withheld(),
        paid: invoice.statusId === "InvoicePmtRecvd",
        url: linkOf(userScope, "invoice", invoice.invoiceId)
    }
}
// InvoiceDetail's Customer Service branch (crosscut §3.16, F53): the customer-safe header and lines, payment status, the
// orders it bills and the cases linked; amounts and payments only for a holder of ACCOUNTING_VIEW or RECEIVABLE_VIEW; Send a
// copy for a holder of RECEIVABLE_EDIT (Accounting's send#Invoice), a finalized or sent invoice only. No correction.
function invoiceDetail(p) {
    const userScope = cs.required()
    cs.recordOf(userScope, "invoice", p.invoiceId)
    const invoiceId = String(p.invoiceId)
    const invoice = one("mantle.account.invoice.Invoice", {invoiceId})
    const read = moneyRead()
    const currencyUomId = invoice.currencyUomId
    const lines = rows("mantle.account.invoice.InvoiceItem", {invoiceId})
        .sort((a, b) => String(a.invoiceItemSeqId).localeCompare(String(b.invoiceItemSeqId)))
        .map(item => ({
            invoiceItemSeqId: item.invoiceItemSeqId,
            description: item.description || productName(item.productId) || cs.enumText(item.itemTypeEnumId),
            quantityText: quantityText(item.quantity ?? 1),
            amountText: read ? money(item.amount ?? 0, currencyUomId) : withheld(),
            lineTotalText: read
                ? money(toDecimal(item.quantity ?? 1).multiply(toDecimal(item.amount ?? 0)), currencyUomId)
                : withheld()
        }))
    const orderIds = Array.from(
        new Set(
            rows("mantle.order.OrderItemBilling", {invoiceId})
                .map(row => row.orderId)
                .filter(Boolean)
        )
    )
    const payments = read
        ? rows("mantle.account.payment.PaymentApplication", {invoiceId}).map(row => ({
              appliedText: money(row.amountApplied ?? 0, currencyUomId),
              dateText: dayText(row.appliedDate)
          }))
        : []
    return {
        invoice: {
            invoiceId,
            statusId: invoice.statusId,
            statusText: cs.statusText(invoice.statusId),
            customerName: cs.partyName(invoice.toPartyId),
            customerUrl: linkOf(userScope, "customer", invoice.toPartyId),
            organizationName: cs.partyName(invoice.fromPartyId),
            organizationPartyId: invoice.fromPartyId,
            dateText: dayText(invoice.invoiceDate),
            dueText: dayText(invoice.dueDate),
            referenceNumber: invoice.referenceNumber || "",
            paid: invoice.statusId === "InvoicePmtRecvd",
            totalText: read ? money(invoice.invoiceTotal ?? 0, currencyUomId) : withheld(),
            unpaidText: read ? money(invoice.unpaidTotal ?? 0, currencyUomId) : withheld(),
            lastUpdatedStamp: invoice.lastUpdatedStamp
        },
        lineRows: lines,
        paymentRows: payments,
        moneyRead: read,
        orderRows: orderIds.map(orderId => ({orderId, url: linkOf(userScope, "order", orderId)})),
        caseRows: casesOf(userScope, "mantle.account.invoice.Invoice", invoiceId),
        canSendCopy:
            !!userScope.capabilities.invoiceCredit &&
            ["InvoiceFinalized", "InvoiceSent", "InvoicePmtRecvd"].includes(invoice.statusId)
    }
}

const operations = {serviceOrders, orderDetail, shipmentDetail, invoiceDetail}
;({
    orderRow,
    shipmentsOf,
    invoiceRow,
    casesOf,
    linkOf,
    moneyRead,
    amountRead,
    // P9: ReturnDetail's RMA mail (Returns.js)
    recipientOptions,
    senderOptions,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service order operation " + op)
        return operations[op](parameters || {})
    }
})
