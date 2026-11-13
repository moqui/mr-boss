// Purchasing's bill and match reads (design-purchasing §10; impl-purchasing P6, §2): the Bills list of the buying
// organizations' supplier bills with their match and hold, the match exceptions (held bills, match variances, received
// not billed and billed not received), the Purchasing context of Shared/InvoiceDetail, OrderDetail's bills and money,
// Supplier360's bills and payment summary, Home's held-bill count, the bulk re-evaluation with a result per bill, and the
// order drop-down of the upload and the match. Accounting owns the bill: its intake (import#Bill), match
// (evaluate#/apply#InvoiceMatch), holds (request#HoldRelease), draft bill (create#InvoiceFromSource) and prepayment
// (mantle.order.PurchaseServices.request#SupplierPrepayment) are the Mantle services the screens call after
// AccessServices.check#Record, each checking its permission and the organization again. A bill's amounts show to a user
// who sees the orders' amounts (Orders.js) or reads payables; its payments only to a finance reader (PAYABLE_VIEW or
// ACCOUNTING_VIEW); anyone else sees them withheld, never zero (§2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, denied} = lib

const INVOICE = "mantle.account.invoice.Invoice",
    FINANCE = "mantle.account.invoice.InvoiceFinance"
const choiceLimit = 30
const lineLimit = 200
const stockTypes = ["PtAsset", "PtDigitalAsset", "PtAssetUse", "PtPickAssembly"]
const billedOrderStatuses = ["OrderApproved", "OrderSent", "OrderProcessing", "OrderCompleted"]
const views = {
    incoming: {label: "Incoming", statuses: ["InvoiceIncoming"]},
    review: {label: "Awaiting approval", statuses: ["InvoiceReceived"]},
    held: {label: "Held", held: true},
    unmatched: {label: "Not matched", unmatched: true},
    approved: {label: "Approved, not paid", statuses: ["InvoiceApproved"], unpaid: true},
    paid: {label: "Paid", statuses: ["InvoicePmtSent"]}
}
const exceptionViews = {
    held: "Held bills",
    variance: "Match variances",
    receivedNotBilled: "Received, not billed",
    billedNotReceived: "Billed, not received"
}
const statusColors = {
    InvoiceIncoming: "grey-8",
    InvoiceReceived: "warning",
    InvoiceApproved: "primary",
    InvoicePmtSent: "positive",
    InvoiceCancelled: "grey-8"
}
const resultColors = {ImrMatched: "positive", ImrPartial: "warning", ImrException: "negative"}
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value ?? 0)
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const quantityText = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)
const withheld = "Withheld"
// The amounts of a bill: to whoever sees the orders' amounts (a buyer, an approver, a supplier-price or finance reader) or
// reads payables (the match operator); its payments to a finance reader only.
const amountsVisible = can =>
    !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead || can.payableRead)
const paymentsVisible = can => !!(can.financialRead || can.payableRead)
// Asking for a hold's release: AP, a match operator or a buyer (mantle request#HoldRelease)
const mayRequestRelease = can => !!(can.payableEdit || can.match || can.buy)
const internalIds = () => rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
function buyerIdsOf(userScope) {
    return userScope.ownerIds || internalIds()
}
function names(entity, field, ids) {
    const wanted = [...new Set(ids.filter(Boolean))]
    if (!wanted.length) return {}
    return Object.fromEntries(
        Array.from(find(entity).condition(field, "in", wanted).list()).map(row => [row[field], row.description || row[field]])
    )
}
const statusNames = ids => names("moqui.basic.StatusItem", "statusId", ids)
const enumNames = ids => names("moqui.basic.Enumeration", "enumId", ids)
function userNames(ids) {
    const wanted = [...new Set(ids.filter(Boolean))]
    if (!wanted.length) return {}
    return Object.fromEntries(
        Array.from(find("moqui.security.UserAccount").condition("userId", "in", wanted).list()).map(row => [
            row.userId,
            row.userFullName || row.username
        ])
    )
}
function productLabels(ids) {
    const wanted = [...new Set(ids.filter(Boolean))]
    if (!wanted.length) return {}
    return Object.fromEntries(
        Array.from(find("mantle.product.Product").condition("productId", "in", wanted).list()).map(row => [
            row.productId,
            (row.pseudoId || row.productId) + (row.productName ? " · " + row.productName : "")
        ])
    )
}
const ageText = date => {
    if (!date) return ""
    const days = Math.floor((Number(ec.user.nowTimestamp) - lib.ms(date)) / 86400000)
    return days <= 0 ? "Today" : days === 1 ? "1 day" : days + " days"
}
const plain = message =>
    String(message || "")
        .split("\n")[0]
        .replace(/^Error: /, "")

// The buying organizations a list shows: the user's, or the one asked for when it is theirs.
function buyersFor(userScope, organizationPartyId) {
    if (blank(organizationPartyId)) return buyerIdsOf(userScope)
    if (!purchasing.owns(userScope, organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
    return [String(organizationPartyId)]
}
// The supplier bills of the buyers: to a buying organization from a party that is not internal, not a credit of another
// bill, private suppliers of other users left out.
function billFind(buyers) {
    const factory = ec.entity.conditionFactory
    // People P27 review (AC-23): a payroll-origin bill (a person's net pay, its payrollOrigin mark) is a reader of payroll's
    const payrollHidden = ec.resource.script("component://mr-mantle/service/mantle/account/PayrollOrigin.js").invoiceCondition()
    return (payrollHidden ? find(FINANCE).condition(payrollHidden) : find(FINANCE))
        .condition("toPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("fromPartyId", "not-in", internalIds())
        .condition("creditForInvoiceId", "is-null", null)
        .condition(
            factory.makeCondition(
                [
                    factory.makeCondition("fromPrivateOwnerUserId", "is-null", null),
                    factory.makeCondition("fromPrivateOwnerUserId", "equals", ec.user.userId || "_NA_")
                ],
                "or"
            )
        )
}
// The current (applied) match of each bill.
function currentMatches(invoiceIds) {
    if (!invoiceIds.length) return {}
    return Object.fromEntries(
        Array.from(
            find("mantle.account.invoice.InvoiceMatch")
                .condition("invoiceId", "in", invoiceIds)
                .condition("statusId", "ImApplied")
                .list()
        ).map(row => [row.invoiceId, row])
    )
}
function openHolds(invoiceIds) {
    if (!invoiceIds.length) return []
    return Array.from(
        find("mantle.account.invoice.InvoiceHold")
            .condition("invoiceId", "in", invoiceIds)
            .condition("releasedDate", "is-null", null)
            .orderBy("placedDate")
            .list()
    )
}
// The purchase orders each bill bills (its billing links).
function billedOrders(invoiceIds) {
    const byInvoice = {}
    if (!invoiceIds.length) return byInvoice
    for (const row of find("mantle.order.OrderItemBilling").condition("invoiceId", "in", invoiceIds).list())
        (byInvoice[row.invoiceId] = byInvoice[row.invoiceId] || new Set()).add(row.orderId)
    return byInvoice
}
// A bill row for a list: its supplier, status, dates, amounts (withheld as above), match result and open holds.
function billRows(records, can) {
    const invoiceIds = records.map(row => row.invoiceId)
    const partyNames = lib.partyNames(records.flatMap(row => [row.fromPartyId, row.toPartyId]))
    const statuses = statusNames(records.map(row => row.statusId))
    const matches = currentMatches(invoiceIds)
    const results = enumNames(Object.values(matches).map(row => row.resultEnumId))
    const holds = openHolds(invoiceIds)
    const reasons = enumNames(holds.map(row => row.holdReasonEnumId))
    const orders = billedOrders(invoiceIds)
    const showAmounts = amountsVisible(can)
    const showPayments = paymentsVisible(can)
    return records.map(row => {
        const match = matches[row.invoiceId]
        const billHolds = holds.filter(hold => hold.invoiceId === row.invoiceId)
        return {
            invoiceId: row.invoiceId,
            referenceNumber: row.referenceNumber || "",
            supplierPartyId: row.fromPartyId,
            supplierName: partyNames[row.fromPartyId] || row.fromPartyId,
            organizationPartyId: row.toPartyId,
            organizationName: partyNames[row.toPartyId] || row.toPartyId,
            statusId: row.statusId,
            statusText: statuses[row.statusId] || row.statusId,
            statusColor: statusColors[row.statusId] || "grey-8",
            invoiceDateText: lib.dateText(row.invoiceDate),
            dueDateText: lib.dateText(row.dueDate),
            currencyUomId: row.currencyUomId,
            totalText: showAmounts ? money(row.invoiceTotal, row.currencyUomId) : withheld,
            unpaidText: showPayments ? money(row.unpaidTotal, row.currencyUomId) : withheld,
            matchText: match ? results[match.resultEnumId] || match.resultEnumId : "Not matched",
            matchColor: match ? resultColors[match.resultEnumId] || "grey-8" : "grey-8",
            matchStale: !!match?.staleDate,
            held: billHolds.length > 0,
            holdText: billHolds.map(hold => reasons[hold.holdReasonEnumId] || hold.holdReasonEnumId).join(", "),
            orderText: [...(orders[row.invoiceId] || [])].sort().join(", ")
        }
    })
}

// ===== Bills =====
// find#Bills: one page of the buying organizations' supplier bills, newest first, by view, supplier, purchase order,
// status and text (bill, supplier reference or description, ignoring case).
function findBills(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Supplier bills are not available")
    const buyers = buyersFor(userScope, p.organizationPartyId)
    const view = Object.hasOwn(views, p.view || "") ? views[p.view] : null
    const factory = ec.entity.conditionFactory
    let orderBills = null
    if (!blank(p.orderId)) {
        purchasing.recordOf(userScope, "order", String(p.orderId))
        orderBills = [...new Set(rows("mantle.order.OrderItemBilling", {orderId: String(p.orderId)}).map(row => row.invoiceId))]
    }
    let matched = null
    if (view?.unmatched)
        matched = Array.from(
            find("mantle.account.invoice.InvoiceMatch")
                .condition("organizationPartyId", "in", buyers.length ? buyers : ["_NA_"])
                .condition("statusId", "ImApplied")
                .selectField("invoiceId")
                .list()
        ).map(row => row.invoiceId)
    const build = () => {
        let query = billFind(buyers)
        if (view?.statuses) query = query.condition("statusId", "in", view.statuses)
        if (view?.unpaid) query = query.condition("unpaidTotal", "greater", 0)
        if (view?.held) query = query.condition("heldInvoiceId", "is-not-null", null)
        if (view?.unmatched) {
            query = query.condition("statusId", "not-in", ["InvoiceCancelled", "InvoicePmtSent"])
            if (matched.length) query = query.condition("invoiceId", "not-in", matched)
        }
        if (orderBills) query = query.condition("invoiceId", "in", orderBills.length ? orderBills : ["_NA_"])
        if (!blank(p.vendorPartyId)) query = query.condition("fromPartyId", String(p.vendorPartyId))
        if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
        if (!blank(p.text))
            query = query.condition(
                factory.makeCondition(
                    ["invoiceId", "referenceNumber", "description"].map(field =>
                        factory.makeCondition(field, "like", likeText(String(p.text).trim())).ignoreCase()
                    ),
                    "or"
                )
            )
        return query
    }
    const paged = lib.page(build().orderBy("-invoiceDate").orderBy("-invoiceId"), p, "billRows", build().count())
    const result = Object.assign({}, paged, {
        billRows: billRows(paged.rows, userScope.capabilities),
        viewLabel: view ? view.label : "All"
    })
    delete result.rows
    return result
}

// ===== Match exceptions =====
// The purchase order lines of the buyers' approved orders (newest orders first, up to lineLimit lines), by supplier and
// order, with what was ordered, accepted (receipts, service acceptances for a service line, the confirmed delivery for a
// drop-ship line) and billed.
function orderLines(userScope, buyers, p) {
    let orderQuery = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internalIds())
        .condition("statusId", "in", billedOrderStatuses)
    if (!blank(p.vendorPartyId)) orderQuery = orderQuery.condition("vendorPartyId", String(p.vendorPartyId))
    if (!blank(p.orderId)) orderQuery = orderQuery.condition("orderId", String(p.orderId))
    const orders = Array.from(orderQuery.orderBy("-entryDate").limit(100).list())
    if (!orders.length) return []
    const orderIds = orders.map(row => row.orderId)
    const items = Array.from(
        find("mantle.order.OrderItem").condition("orderId", "in", orderIds).condition("parentItemSeqId", "is-null", null).list()
    ).filter(item => item.productId)
    const products = Object.fromEntries(
        Array.from(
            find("mantle.product.Product")
                .condition("productId", "in", [...new Set(items.map(item => item.productId))])
                .list()
        ).map(row => [row.productId, row])
    )
    const sums = (entity, field) => {
        const out = {}
        for (const row of find(entity).condition("orderId", "in", orderIds).list()) {
            const key = row.orderId + ":" + row.orderItemSeqId
            out[key] = (out[key] || toDecimal(0)).add(dec(row[field]))
        }
        return out
    }
    const received = sums("mantle.product.receipt.AssetReceipt", "quantityAccepted")
    const accepted = sums("mantle.order.purchase.ServiceAcceptance", "acceptedQuantity")
    const billed = sums("mantle.order.OrderItemBilling", "quantity")
    // P7: a drop-ship line is never received; its evidence is the supplier's confirmed delivery (shipped purchase shipments)
    const delivered = {}
    if (items.some(item => item.salesOrderId))
        for (const row of find("mantle.shipment.ShipmentAndItemSource")
            .condition("orderId", "in", orderIds)
            .condition("shipmentTypeEnumId", "ShpTpPurchase")
            .condition("shipmentStatusId", "in", ["ShipShipped", "ShipDelivered"])
            .list()) {
            const key = row.orderId + ":" + row.orderItemSeqId
            delivered[key] = (delivered[key] || toDecimal(0)).add(dec(row.quantity))
        }
    const lastReceipt = {}
    for (const row of find("mantle.product.receipt.AssetReceipt").condition("orderId", "in", orderIds).list()) {
        const key = row.orderId + ":" + row.orderItemSeqId
        if (!lastReceipt[key] || lib.ms(row.receivedDate) > lib.ms(lastReceipt[key])) lastReceipt[key] = row.receivedDate
    }
    const byOrder = Object.fromEntries(orders.map(row => [row.orderId, row]))
    const partyNames = lib.partyNames(orders.map(row => row.vendorPartyId))
    return items.slice(0, lineLimit).map(item => {
        const key = item.orderId + ":" + item.orderItemSeqId
        const product = products[item.productId]
        const service = !!product && !stockTypes.includes(product.productTypeEnumId)
        const order = byOrder[item.orderId]
        return {
            orderId: item.orderId,
            orderItemSeqId: item.orderItemSeqId,
            supplierPartyId: order.vendorPartyId,
            supplierName: partyNames[order.vendorPartyId] || order.vendorPartyId,
            productText: product ? (product.pseudoId || product.productId) + " · " + (product.productName || "") : "",
            service,
            ordered: dec(item.quantity).subtract(dec(item.quantityCancelled)),
            accepted: (item.salesOrderId ? delivered[key] : service ? accepted[key] : received[key]) || toDecimal(0),
            billed: billed[key] || toDecimal(0),
            lastReceiptDate: lastReceipt[key] || null,
            entryDate: order.entryDate
        }
    })
}
// find#MatchExceptions: the view's rows. Held bills: the open holds of the buyers' bills with their reason, who placed
// them, the release asked for and the match's exception lines; match variances: the applied matches that are partial or
// exceptions, or wait for re-evaluation; received not billed and billed not received: the order lines whose accepted
// quantity and billed quantity differ.
function findExceptions(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Match exceptions are not available")
    const can = userScope.capabilities
    const buyers = buyersFor(userScope, p.organizationPartyId)
    const view = Object.hasOwn(exceptionViews, p.view || "") ? p.view : "held"
    if (!blank(p.orderId)) purchasing.recordOf(userScope, "order", String(p.orderId))
    const out = {view, viewLabel: exceptionViews[view], billRows: [], lineRows: []}
    if (view === "receivedNotBilled" || view === "billedNotReceived") {
        const lines = orderLines(userScope, buyers, p).filter(line =>
            view === "receivedNotBilled" ? line.accepted.compare(line.billed) > 0 : line.billed.compare(line.accepted) > 0
        )
        const rowsOut = lines.map(line => ({
            orderId: line.orderId,
            orderItemSeqId: line.orderItemSeqId,
            supplierName: line.supplierName,
            productText: line.productText,
            orderedText: quantityText(line.ordered),
            acceptedText: quantityText(line.accepted),
            billedText: quantityText(line.billed),
            differenceText: quantityText(
                view === "receivedNotBilled" ? line.accepted.subtract(line.billed) : line.billed.subtract(line.accepted)
            ),
            ageText: ageText(view === "receivedNotBilled" ? line.lastReceiptDate : line.entryDate),
            ownerText:
                view === "receivedNotBilled"
                    ? "Supplier: send the bill"
                    : line.service
                      ? "Buyer: record the acceptance"
                      : "Warehouse: receive or correct the receipt"
        }))
        return Object.assign(out, lib.pageList(rowsOut, p, "lineRows"))
    }
    const buildBills = () => {
        let query = billFind(buyers)
        if (view === "held") query = query.condition("heldInvoiceId", "is-not-null", null)
        else {
            const variances = Array.from(
                find("mantle.account.invoice.InvoiceMatch")
                    .condition("organizationPartyId", "in", buyers.length ? buyers : ["_NA_"])
                    .condition("statusId", "ImApplied")
                    .condition(
                        ec.entity.conditionFactory.makeCondition(
                            [
                                ec.entity.conditionFactory.makeCondition("resultEnumId", "in", ["ImrPartial", "ImrException"]),
                                ec.entity.conditionFactory.makeCondition("staleDate", "is-not-null", null)
                            ],
                            "or"
                        )
                    )
                    .selectField("invoiceId")
                    .list()
            ).map(row => row.invoiceId)
            query = query.condition("invoiceId", "in", variances.length ? variances : ["_NA_"])
        }
        if (!blank(p.vendorPartyId)) query = query.condition("fromPartyId", String(p.vendorPartyId))
        if (!blank(p.invoiceId)) query = query.condition("invoiceId", String(p.invoiceId))
        if (!blank(p.orderId)) {
            const billed = [
                ...new Set(rows("mantle.order.OrderItemBilling", {orderId: String(p.orderId)}).map(row => row.invoiceId))
            ]
            query = query.condition("invoiceId", "in", billed.length ? billed : ["_NA_"])
        }
        return query
    }
    const paged = lib.page(buildBills().orderBy("invoiceDate").orderBy("invoiceId"), p, "billRows", buildBills().count())
    const bills = billRows(paged.rows, can)
    const invoiceIds = bills.map(row => row.invoiceId)
    const holds = openHolds(invoiceIds)
    const reasons = enumNames(holds.map(row => row.holdReasonEnumId))
    const users = userNames(holds.flatMap(row => [row.placedByUserId, row.releaseRequestedByUserId]))
    const matches = currentMatches(invoiceIds)
    const matchLines = Object.keys(matches).length
        ? Array.from(
              find("mantle.account.invoice.InvoiceMatchLine")
                  .condition(
                      "invoiceMatchId",
                      "in",
                      Object.values(matches).map(row => row.invoiceMatchId)
                  )
                  .condition("exceptionEnumId", "is-not-null", null)
                  .list()
          )
        : []
    const exceptionNames = enumNames(matchLines.map(row => row.exceptionEnumId))
    const requestable = mayRequestRelease(can)
    const billRowsOut = bills.map(row => {
        const billHolds = holds.filter(hold => hold.invoiceId === row.invoiceId)
        const hold = billHolds[0] || null
        const match = matches[row.invoiceId]
        const lineTexts = match
            ? matchLines
                  .filter(line => line.invoiceMatchId === match.invoiceMatchId)
                  .map(
                      line =>
                          "Line " +
                          line.invoiceItemSeqId +
                          ": " +
                          (exceptionNames[line.exceptionEnumId] || line.exceptionEnumId) +
                          (line.exceptionText ? " (" + line.exceptionText + ")" : "")
                  )
            : []
        return Object.assign(row, {
            invoiceHoldId: hold?.invoiceHoldId || null,
            reasonText: hold ? reasons[hold.holdReasonEnumId] || hold.holdReasonEnumId : row.matchText,
            holdComment: hold?.holdComment || "",
            exceptionText: lineTexts.join("; ") || (match?.staleReason ? match.staleReason : match?.resultText || ""),
            placedText: hold
                ? [lib.dateText(hold.placedDate), users[hold.placedByUserId] || hold.placedByUserId].filter(Boolean).join(" · ")
                : "",
            ageText: ageText(hold?.placedDate || match?.appliedDate),
            ownerText: hold ? "Finance releases the hold" : "Buyer: correct the source or the bill",
            releaseRequestText: hold?.releaseRequestedDate
                ? "Asked by " + (users[hold.releaseRequestedByUserId] || hold.releaseRequestedByUserId)
                : "",
            canRequestRelease: !!hold && !hold.releaseRequestedDate && requestable,
            canReevaluate: !!can.match
        })
    })
    const result = Object.assign(out, paged, {billRows: billRowsOut})
    delete result.rows
    return result
}

// ===== one bill =====
// get#BillDetail: one supplier bill of the buying organizations (crosscut §3.16 Purchasing row): its header, lines, the
// orders and receipts it bills, its holds with the release asked for, the applied match and its exceptions, its payments
// (to a finance reader) and documents, and the actions the user's capabilities allow.
function billDetail(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "bill", p.invoiceId)
    const can = userScope.capabilities
    const invoiceId = record.recordId
    const bill = one(INVOICE, {invoiceId})
    const currency = bill.currencyUomId
    const showAmounts = amountsVisible(can)
    const showPayments = paymentsVisible(can)
    const partyNames = lib.partyNames([bill.fromPartyId, bill.toPartyId])
    const statuses = statusNames([bill.statusId])
    const items = rows("mantle.account.invoice.InvoiceItem", {invoiceId}).sort((a, b) =>
        String(a.invoiceItemSeqId).localeCompare(String(b.invoiceItemSeqId))
    )
    const products = productLabels(items.map(item => item.productId))
    const itemTypes = enumNames(items.map(item => item.itemTypeEnumId))
    const itemRows = items.map(item => ({
        invoiceItemSeqId: item.invoiceItemSeqId,
        description: item.description || products[item.productId] || itemTypes[item.itemTypeEnumId] || "",
        productText: item.productId ? products[item.productId] || item.productId : "",
        quantityText: quantityText(item.quantity ?? 1),
        priceText: showAmounts ? money(item.amount, currency) : withheld,
        amountText: showAmounts ? money(dec(item.quantity ?? 1).multiply(dec(item.amount)), currency) : withheld
    }))
    const billings = rows("mantle.order.OrderItemBilling", {invoiceId})
    const receipts = billings.filter(row => row.assetReceiptId).map(row => row.assetReceiptId)
    const receiptDates = receipts.length
        ? Object.fromEntries(
              Array.from(find("mantle.product.receipt.AssetReceipt").condition("assetReceiptId", "in", receipts).list()).map(
                  row => [row.assetReceiptId, row.receivedDate]
              )
          )
        : {}
    const sourceRows = billings.map(row => ({
        invoiceItemSeqId: row.invoiceItemSeqId,
        orderId: row.orderId,
        orderItemSeqId: row.orderItemSeqId,
        orderUrl: purchasing.recordUrl("order", row.orderId),
        receiptText: row.assetReceiptId
            ? row.assetReceiptId +
              (receiptDates[row.assetReceiptId] ? " · " + lib.dateText(receiptDates[row.assetReceiptId]) : "")
            : "Ordered quantity",
        quantityText: quantityText(row.quantity),
        amountText: showAmounts ? money(row.amount, currency) : withheld
    }))
    const holds = rows("mantle.account.invoice.InvoiceHold", {invoiceId}).sort(
        (a, b) => lib.ms(b.placedDate) - lib.ms(a.placedDate)
    )
    const reasons = enumNames(holds.map(row => row.holdReasonEnumId))
    const users = userNames(holds.flatMap(row => [row.placedByUserId, row.releaseRequestedByUserId, row.releasedByUserId]))
    const requestable = mayRequestRelease(can)
    const holdRows = holds.map(hold => ({
        invoiceHoldId: hold.invoiceHoldId,
        reasonText: reasons[hold.holdReasonEnumId] || hold.holdReasonEnumId,
        comment: hold.holdComment || "",
        placedText: [lib.dateText(hold.placedDate), users[hold.placedByUserId] || hold.placedByUserId]
            .filter(Boolean)
            .join(" · "),
        requestText: hold.releaseRequestedDate
            ? "Asked by " +
              (users[hold.releaseRequestedByUserId] || hold.releaseRequestedByUserId) +
              (hold.releaseRequestNote ? ": " + hold.releaseRequestNote : "")
            : "",
        releasedText: hold.releasedDate
            ? [lib.dateText(hold.releasedDate), users[hold.releasedByUserId] || "", hold.releaseComment || ""]
                  .filter(Boolean)
                  .join(" · ")
            : "",
        open: !hold.releasedDate,
        canRequestRelease: !hold.releasedDate && !hold.releaseRequestedDate && requestable
    }))
    const match = currentMatches([invoiceId])[invoiceId] || null
    const matchLines = match
        ? rows("mantle.account.invoice.InvoiceMatchLine", {invoiceMatchId: match.invoiceMatchId}).filter(
              line => line.exceptionEnumId
          )
        : []
    const exceptionNames = enumNames(matchLines.map(line => line.exceptionEnumId))
    const matchResult = match ? enumNames([match.resultEnumId])[match.resultEnumId] || match.resultEnumId : "Not matched"
    // People P27 review (AC-23): a payroll payment applied to the bill (one paying a claim with net pay) is a reader of payroll's
    const payments = showPayments
        ? ec.resource
              .script("component://mr-mantle/service/mantle/account/PayrollOrigin.js")
              .visibleRows(rows("mantle.account.payment.PaymentApplication", {invoiceId}), {payment: ["paymentId"]})
        : []
    const paymentRows = payments.map(row => ({
        paymentId: row.paymentId,
        appliedText: lib.dateText(row.appliedDate),
        amountText: money(row.amountApplied, currency)
    }))
    const documentRows = rows("mantle.account.invoice.InvoiceContent", {invoiceId}).map(row => ({
        description:
            row.description ||
            String(row.contentLocation || "")
                .split("/")
                .pop(),
        dateText: lib.dateText(row.contentDate)
    }))
    const open = holdRows.filter(row => row.open)
    const closed = ["InvoiceCancelled", "InvoicePmtSent"].includes(bill.statusId)
    const organizationPartyId = bill.toPartyId
    return {
        bill: {
            invoiceId,
            referenceNumber: bill.referenceNumber || "",
            description: bill.description || "",
            supplierPartyId: bill.fromPartyId,
            supplierName: partyNames[bill.fromPartyId] || bill.fromPartyId,
            organizationPartyId,
            organizationName: partyNames[organizationPartyId] || organizationPartyId,
            statusId: bill.statusId,
            statusText: statuses[bill.statusId] || bill.statusId,
            statusColor: statusColors[bill.statusId] || "grey-8",
            invoiceDateText: lib.dateText(bill.invoiceDate),
            dueDateText: lib.dateText(bill.dueDate),
            currencyUomId: currency,
            totalText: showAmounts ? money(bill.invoiceTotal, currency) : withheld,
            unpaidText: showPayments ? money(bill.unpaidTotal, currency) : withheld,
            held: open.length > 0,
            holdText: open.map(row => row.reasonText + (row.comment ? ": " + row.comment : "")).join("; "),
            matchText: matchResult,
            matchColor: match ? resultColors[match.resultEnumId] || "grey-8" : "grey-8",
            matchDetail: match
                ? (match.staleDate ? "Waiting for re-evaluation: " + (match.staleReason || "a source changed") + ". " : "") +
                  (match.resultText || "")
                : "",
            exceptionRows: matchLines.map(line => ({
                invoiceItemSeqId: line.invoiceItemSeqId,
                exceptionText: exceptionNames[line.exceptionEnumId] || line.exceptionEnumId,
                detail: line.exceptionText || ""
            })),
            itemRows,
            sourceRows,
            holdRows,
            paymentsVisible: showPayments,
            paymentRows,
            documentRows,
            actions: {
                // the match is the match operator's (BOSS_ACCOUNTING_MATCH's INVOICE_MATCH), on the shared InvoiceMatch
                match: !!can.match && !closed,
                requestRelease: requestable && holdRows.some(row => row.canRequestRelease),
                // a freight, duty or broker bill's charges onto receipts, Accounting's LandedCosts (ACCOUNTING_GL_POST)
                landedCosts: !!can.landedCost && !closed && bill.statusId !== "InvoiceIncoming"
            },
            landedCostUrl:
                "/qapps/Accounting/Payables/LandedCosts?invoiceId=" +
                encodeURIComponent(invoiceId) +
                "&organizationPartyId=" +
                encodeURIComponent(organizationPartyId)
        }
    }
}

// ===== OrderDetail and Supplier360 =====
// get#OrderBills: a purchase order's bills (its billing links) with their match and hold, its payments (to a finance
// reader), and whether the user may create a draft bill (AP: PAYABLE_EDIT, an approved order) or ask for a prepayment.
function orderBills(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "order", p.orderId)
    const can = userScope.capabilities
    const orderId = record.recordId
    const order = one("mantle.order.OrderHeader", {orderId})
    const part = rows("mantle.order.OrderPart", {orderId})[0]
    const invoiceIds = [...new Set(rows("mantle.order.OrderItemBilling", {orderId}).map(row => row.invoiceId))]
    const bills = invoiceIds.length
        ? Array.from(find(FINANCE).condition("invoiceId", "in", invoiceIds).orderBy("-invoiceDate").list())
        : []
    const showPayments = paymentsVisible(can)
    const payments = showPayments ? rows("mantle.account.payment.Payment", {orderId}) : []
    const paymentStatuses = statusNames(payments.map(row => row.statusId))
    const prepayable = ["OrderPlaced", "OrderApproved", "OrderSent", "OrderProcessing", "OrderHold"].includes(order.statusId)
    return {
        orderBills: {
            billRows: billRows(bills, can),
            paymentsVisible: showPayments,
            paymentRows: payments.map(row => ({
                paymentId: row.paymentId,
                statusText: paymentStatuses[row.statusId] || row.statusId,
                dateText: lib.dateText(row.effectiveDate),
                amountText: money(row.amount, row.amountUomId || order.currencyUomId),
                comments: row.comments || ""
            })),
            organizationPartyId: part.customerPartyId,
            supplierPartyId: part.vendorPartyId,
            currencyUomId: order.currencyUomId,
            actions: {
                draftBill: !!can.payableEdit && billedOrderStatuses.includes(order.statusId),
                prepayment: !!can.payableEdit && prepayable,
                uploadBill: !!can.billImport && billedOrderStatuses.concat(["OrderPlaced"]).includes(order.statusId)
            }
        }
    }
}
// get#SupplierBills: the supplier's bills to the buying organizations, newest first (the last 50), with the summary of
// open, held and, for a finance reader, unpaid amounts by currency.
function supplierBills(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "supplier", p.vendorPartyId)
    const can = userScope.capabilities
    if (!can.listRead) denied("PERMISSION_DENIED", "Supplier bills are not available")
    const buyers = buyersFor(userScope, p.organizationPartyId)
    const supplierPartyId = record.recordId
    const recent = Array.from(
        billFind(buyers).condition("fromPartyId", supplierPartyId).orderBy("-invoiceDate").orderBy("-invoiceId").limit(50).list()
    )
    const openCount = billFind(buyers)
        .condition("fromPartyId", supplierPartyId)
        .condition("statusId", "in", ["InvoiceIncoming", "InvoiceReceived", "InvoiceApproved"])
        .count()
    const heldCount = billFind(buyers)
        .condition("fromPartyId", supplierPartyId)
        .condition("heldInvoiceId", "is-not-null", null)
        .count()
    let unpaidText = withheld
    if (paymentsVisible(can)) {
        const unpaid = {}
        for (const row of billFind(buyers)
            .condition("fromPartyId", supplierPartyId)
            .condition("statusId", "in", ["InvoiceReceived", "InvoiceApproved"])
            .condition("unpaidTotal", "greater", 0)
            .list())
            unpaid[row.currencyUomId] = (unpaid[row.currencyUomId] || toDecimal(0)).add(dec(row.unpaidTotal))
        // each currency apart, never combined
        unpaidText =
            Object.entries(unpaid)
                .map(([currencyUomId, value]) => money(value, currencyUomId))
                .join(" · ") || "Nothing unpaid"
    }
    return {
        supplierBills: {
            billRows: billRows(recent, can),
            openCount,
            heldCount,
            unpaidText,
            paymentsVisible: paymentsVisible(can)
        }
    }
}

// ===== bulk re-evaluation =====
// reevaluate#Matches (ReevaluateMatch): each selected bill evaluated against its sources as they are now
// (evaluate#InvoiceMatch); a bill whose applied match waits for re-evaluation (a source changed) is re-evaluated at once
// (reevaluate#InvoiceMatch, which records the result and may hold the bill, never releases a hold). Each bill in its own
// transaction, a result per bill; a refusal is named and the others go on.
function reevaluate(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.match) denied("PERMISSION_DENIED", "INVOICE_MATCH is required")
    const invoiceIds = [...new Set(Array.from(p.invoiceIds || []).map(String))].filter(Boolean)
    if (!invoiceIds.length || invoiceIds.length > 100) denied("SELECTION_INVALID", "Select between one and 100 bills")
    const results = []
    for (const invoiceId of invoiceIds) {
        ec.message.pushErrors()
        try {
            purchasing.recordOf(userScope, "bill", invoiceId)
            const organizationPartyId = one(INVOICE, {invoiceId}).toPartyId
            const evaluated =
                ec.service
                    .sync()
                    .name("mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch")
                    .parameters({invoiceId, organizationPartyId})
                    .requireNewTransaction(true)
                    .call() || {}
            if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
            let message = (evaluated.resultName || "") + (evaluated.resultText ? ": " + evaluated.resultText : "")
            const current = evaluated.currentMatch
            if (current?.isStale) {
                const again =
                    ec.service
                        .sync()
                        .name("mantle.account.InvoiceMatchServices.reevaluate#InvoiceMatch")
                        .parameters({invoiceMatchId: current.invoiceMatchId})
                        .requireNewTransaction(true)
                        .call() || {}
                if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
                message = "Re-evaluated: " + (again.resultText || "") + (again.held ? " The bill is held." : "")
            } else if (current) message = "Matched as applied: " + (current.resultText || current.resultName || "")
            results.push({invoiceId, resultCode: "DONE", message})
        } catch (error) {
            const message = plain(error.message || error)
            results.push({invoiceId, resultCode: lib.reasonCode({message}) || "REFUSED", message})
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    const done = results.filter(row => row.resultCode === "DONE").length
    return {
        results,
        summary:
            done +
            " of " +
            results.length +
            " evaluated" +
            (done < results.length
                ? "; " +
                  results
                      .filter(row => row.resultCode !== "DONE")
                      .map(row => row.invoiceId + ": " + row.message)
                      .join("; ")
                : "")
    }
}

// ===== Home and choices =====
// Home's held bills (P6): the buyers' supplier bills with an open hold, for the buying lists' groups.
function homeCounts(userScope) {
    if (!userScope.capabilities.listRead) return {heldCount: null}
    return {heldCount: billFind(buyerIdsOf(userScope)).condition("heldInvoiceId", "is-not-null", null).count()}
}
// The purchase orders a bill may be for: the buyers' approved orders (placed too, for an upload), from the supplier when
// one is given, by id and name.
function orderChoices(userScope, term, selected, p) {
    const factory = ec.entity.conditionFactory
    const buyers = buyerIdsOf(userScope)
    const statuses = billedOrderStatuses.concat(["OrderPlaced"])
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internalIds())
        .condition("statusId", "in", statuses)
        .orderBy("-entryDate")
        .limit(choiceLimit)
    if (!blank(p?.partyId)) query = query.condition("vendorPartyId", String(p.partyId))
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["orderId", "orderName", "otherPartyOrderId"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const label = row => row.orderId + (row.orderName ? " · " + row.orderName : "")
    const options = Array.from(query.list()).map(row => ({value: row.orderId, label: label(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const row = rows("mantle.order.OrderHeaderAndPart", {orderId: selected})[0]
        if (row && buyers.includes(row.customerPartyId) && statuses.includes(row.statusId))
            options.push({value: selected, label: label(row)})
    }
    return options
}

const operations = {findBills, findExceptions, billDetail, orderBills, supplierBills, reevaluate}
;({
    homeCounts,
    orderChoices,
    views,
    exceptionViews,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing bill operation " + op)
        return operations[op](parameters)
    }
})
