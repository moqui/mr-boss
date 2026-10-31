// Screen context for payables: the bills list and its queues, the bill exceptions, a supplier's finance, an order's and a
// shipment's finance view. Mantle's services own every financial read and change and their
// authorization; this adds the screen's labels, links and paging names.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const {policy, array, money} = lib
const plainRows = lib.rows
const statusColors = {
    InvoiceIncoming: "grey-7",
    InvoiceReceived: "warning",
    InvoiceApproved: "primary",
    InvoicePmtSent: "positive",
    InvoiceCancelled: "negative",
    InvoiceInProcess: "grey-7",
    InvoiceFinalized: "primary"
}
const statusColor = statusId => statusColors[statusId] || "grey-7"
const refused = error => String(error.message).includes("PERMISSION_DENIED")
const readsPayables = scope =>
    scope.capabilities.apRead || scope.capabilities.reportRead || scope.capabilities.admin || scope.capabilities.systemAdmin

function counterpart(row, organizationPartyId) {
    return row.fromPartyId === organizationPartyId
        ? {supplierPartyId: row.toPartyId, supplierName: row.toName}
        : {supplierPartyId: row.fromPartyId, supplierName: row.fromName}
}

// A page of the bills queue (find#Payables) with its queue tabs, each row with its supplier, link and status color.
function bills(parameters) {
    const scope = lib.access(parameters)
    const organizationPartyId = scope.organizationPartyId
    const output = policy.call(
        "mantle.account.InvoiceServices.find#Payables",
        Object.assign({}, parameters, {organizationPartyId})
    )
    const records = plainRows(output.records).map(row =>
        Object.assign(row, counterpart(row, organizationPartyId), {
            routeParameters: {organizationPartyId, recordId: row.invoiceId},
            statusColor: statusColor(row.statusId)
        })
    )
    const queue = parameters.queue || "all"
    const tabs = [
        ["incoming", "Incoming"],
        ["review", "Awaiting approval"],
        ["held", "Held"],
        ["approved", "Approved"],
        ["due", "Due"],
        ["overdue", "Overdue"],
        ["credits", "Credits"],
        ["all", "All"]
    ]
    return Object.assign({}, output, {
        records,
        queue,
        queueTabs: tabs.map(([key, title]) => ({
            key,
            title,
            active: key === queue,
            parameters: {organizationPartyId, queue: key, pageIndex: 0}
        })),
        billCapabilities: scope.capabilities
    })
}

// The open holds of the organization's bills (find#BillExceptions): each with its bill, supplier, reason, who placed it
// and when, and a release asked for; private suppliers of other users left out. A page at a time.
function exceptions(parameters) {
    const scope = lib.access(parameters)
    if (!readsPayables(scope)) throw new Error("PERMISSION_DENIED: Payables read authority is required")
    const organizationPartyId = policy.organization(parameters).organizationPartyId
    const cf = ec.entity.conditionFactory
    // a find runs once: one for the count, one for the page
    const holds = () => {
        let query = policy
            .find("mantle.account.invoice.InvoiceHoldDetail", {toPartyId: organizationPartyId})
            .condition("releasedDate", "is-null", null)
        if (!scope.capabilities.systemAdmin)
            query = query.condition(
                cf.makeCondition(
                    [
                        cf.makeCondition("fromPrivateOwnerUserId", "is-null", null),
                        cf.makeCondition("fromPrivateOwnerUserId", "equals", ec.user.userId)
                    ],
                    "or"
                )
            )
        if (parameters.invoiceId) query = query.condition("invoiceId", parameters.invoiceId)
        if (parameters.text)
            query = query.condition(
                cf.makeCondition(
                    ["invoiceId", "referenceNumber", "holdComment"].map(field =>
                        cf.makeCondition(field, "like", "%" + parameters.text + "%").ignoreCase()
                    ),
                    "or"
                )
            )
        return query
    }
    const page = policy.lib.page(holds().orderBy("placedDate"), parameters, "exceptions", holds().count())
    const holdRows = array(page.rows)
    const names = policy.lib.partyNames(holdRows.map(row => row.fromPartyId))
    const reasons = Object.fromEntries(
        policy.rows("moqui.basic.Enumeration", {enumTypeId: "InvoiceHoldReason"}).map(row => [row.enumId, row.description])
    )
    const userIds = [...new Set(holdRows.flatMap(row => [row.placedByUserId, row.releaseRequestedByUserId]).filter(Boolean))]
    const users = userIds.length
        ? Object.fromEntries(
              array(policy.find("moqui.security.UserAccount").condition("userId", "in", userIds).list()).map(row => [
                  row.userId,
                  row.userFullName || row.username
              ])
          )
        : {}
    return Object.assign(lib.paging(page, "exceptions"), {
        exceptions: holdRows.map(row => ({
            invoiceHoldId: row.invoiceHoldId,
            invoiceId: row.invoiceId,
            referenceNumber: row.referenceNumber,
            supplierPartyId: row.fromPartyId,
            supplierName: names[row.fromPartyId] || row.fromPartyId,
            reasonText: reasons[row.holdReasonEnumId] || row.holdReasonEnumId,
            holdComment: row.holdComment,
            placedByName: users[row.placedByUserId] || row.placedByUserId,
            placedDateText: policy.dateText(row.placedDate),
            reviewDateText: policy.dateText(row.reviewDate),
            releaseRequested: !!row.releaseRequestedDate,
            releaseRequestText: row.releaseRequestedDate
                ? "Asked by " + (users[row.releaseRequestedByUserId] || row.releaseRequestedByUserId)
                : "",
            unpaidTotal: row.unpaidTotal,
            currencyUomId: row.currencyUomId,
            routeParameters: {organizationPartyId, recordId: row.invoiceId}
        }))
    })
}

// A supplier of the organization for Supplier360 (get#SupplierFinance), with every list present: a supplier that does
// not exist or the user may not read has supplierFound false.
function supplierContext(parameters) {
    const scope = lib.access(parameters)
    const supplierPartyId = parameters.supplierPartyId
    let output = {}
    if (supplierPartyId && scope.organizationPartyId) {
        try {
            output = policy.probe("mantle.party.SupplierServices.get#SupplierFinance", {
                organizationPartyId: scope.organizationPartyId,
                supplierPartyId
            })
        } catch (error) {
            if (refused(error)) throw error
            ec.logger.info("Supplier " + supplierPartyId + " is not available: " + error.message)
        }
    }
    const supplier = output.supplier || {}
    const allowed = output.capabilities || {}
    const profile = output.profile ? policy.display(output.profile) : null
    const terms = Object.fromEntries(
        policy.rows("mantle.account.invoice.SettlementTerm").map(row => [row.settlementTermId, row.description])
    )
    const profileRow = row =>
        Object.assign(policy.display(row), {
            termText: row.settlementTermId ? terms[row.settlementTermId] || row.settlementTermId : "Organization's default",
            selfBillingText: row.selfBillingIndicator === "Y" ? "Self-billed" : "Supplier bills"
        })
    const supplierDetail = {
        supplierPartyId,
        supplierName:
            supplier.organizationName || [supplier.firstName, supplier.lastName].filter(Boolean).join(" ") || supplierPartyId,
        bills: plainRows(output.bills).map(row =>
            Object.assign(row, {routeParameters: {organizationPartyId: scope.organizationPartyId, recordId: row.invoiceId}})
        ),
        payments: plainRows(output.payments).map(row => Object.assign(row, {currencyUomId: row.amountUomId})),
        agreements: plainRows(output.agreements),
        profile: profile ? profileRow(output.profile) : null,
        profileRows: array(output.profileRows).map(profileRow),
        paymentMethods: plainRows(output.paymentMethods),
        identifications: plainRows(output.identifications),
        taxRegistrations: plainRows(output.taxRegistrations),
        summaryRows: plainRows(output.summaryRows).map(row =>
            Object.assign(row, {
                openPayableText: money(row.openPayable, row.currencyUomId),
                inReviewText: money(row.inReview, row.currencyUomId),
                heldText: money(row.heldTotal, row.currencyUomId),
                overdueText: money(row.overdue, row.currencyUomId)
            })
        ),
        incomplete: !!output.incomplete,
        // the names the shared finance details read (template/AccountingFinanceDetails.xml), as Customer360's
        capabilities: Object.assign({}, allowed, {
            holdPlace: !!scope.capabilities.holdPlace,
            bankEdit: !!allowed.canEditPaymentMethods,
            identificationEdit: !!allowed.canEditIdentifications,
            taxEdit: !!allowed.canEditTaxRegistrations
        })
    }
    return {
        supplierDetail,
        supplierFound: !!supplier.partyId,
        supplierPartyId,
        organizationPartyId: scope.organizationPartyId,
        supplierLinkParameters: {organizationPartyId: scope.organizationPartyId, supplierPartyId},
        termsValue: {
            settlementTermId: profile?.settlementTermId || "",
            selfBillingIndicator: profile?.selfBillingIndicator || "N"
        }
    }
}

// The organization of an order or shipment between it and another party, checked against the user's scope; null when
// neither party is an organization the user works in.
function sourceOrganization(scope, partyIds) {
    const allowed = scope.organizationPartyId ? [scope.organizationPartyId] : array(scope.allowedOrganizationPartyIds)
    return partyIds.find(partyId => allowed.includes(partyId)) || null
}
function invoiceRows(invoiceIds, organizationPartyId) {
    const ids = [...new Set(invoiceIds.filter(Boolean))]
    if (!ids.length) return []
    const records = array(
        policy.find("mantle.account.invoice.Invoice").condition("invoiceId", "in", ids).orderBy("invoiceId").list()
    )
    const statuses = Object.fromEntries(
        records.map(row => [row.statusId, lib.statusText(row.statusId)]).filter(([statusId]) => statusId)
    )
    return records.map(row =>
        Object.assign(policy.display(row), {
            payable: row.toPartyId === organizationPartyId,
            detailPath: row.toPartyId === organizationPartyId ? "Payables/BillDetail" : "Receivables/InvoiceDetail",
            statusDescription: statuses[row.statusId],
            statusColor: statusColor(row.statusId),
            routeParameters: {organizationPartyId, recordId: row.invoiceId}
        })
    )
}
// An order part for OrderDetail's Accounting context: its lines with what was billed and received, its invoices or bills,
// its payments, its shipments and its status history, and whether the user may invoice it (InvoiceFromSource). An order
// of no organization the user works in, or of a side the user may not read, has orderFound false.
function orderContext(parameters) {
    const scope = lib.access(parameters)
    const orderId = parameters.orderId
    const header = orderId ? policy.one("mantle.order.OrderHeader", {orderId}) : null
    const parts = header ? policy.rows("mantle.order.OrderPart", {orderId}) : []
    const part = parts.find(row => row.orderPartSeqId === (parameters.orderPartSeqId || "01")) || parts[0]
    const organizationPartyId = part ? sourceOrganization(scope, [part.customerPartyId, part.vendorPartyId]) : null
    const payable = !!part && organizationPartyId === part.customerPartyId
    const c = scope.capabilities
    const canRead = payable ? c.apRead || c.reportRead || c.admin : c.arRead || c.reportRead || c.admin
    if (!part || !organizationPartyId || !(canRead || c.systemAdmin)) return {orderFound: false, orderId}
    const counterpartyId = payable ? part.vendorPartyId : part.customerPartyId
    const names = policy.lib.partyNames([counterpartyId])
    const items = policy.rows("mantle.order.OrderItem", {orderId, orderPartSeqId: part.orderPartSeqId})
    const billings = policy.rows("mantle.order.OrderItemBilling", {orderId})
    const sources = policy.rows("mantle.shipment.ShipmentItemSource", {orderId})
    const receipts = policy.rows("mantle.product.receipt.AssetReceipt", {orderId})
    const sum = (list, field) => list.reduce((total, row) => total.add(row[field] ?? 0), toDecimal(0))
    const lines = items.map(item => {
        const mine = row => row.orderItemSeqId === item.orderItemSeqId
        return Object.assign(policy.display(item), {
            quantity: item.quantity ?? toDecimal(1),
            lineTotal: ec.l10n.roundCurrency(toDecimal(item.quantity ?? 1).multiply(item.unitAmount ?? 0), header.currencyUomId),
            currencyUomId: header.currencyUomId,
            billedQuantity: sum(billings.filter(mine), "quantity"),
            acceptedQuantity: sum(receipts.filter(mine), "quantityAccepted"),
            rejectedQuantity: sum(receipts.filter(mine), "quantityRejected")
        })
    })
    const invoiceIds = billings.map(row => row.invoiceId)
    const payments = policy.rows("mantle.account.payment.Payment", {orderId}).map(row =>
        Object.assign(policy.display(row), {
            statusDescription: lib.statusText(row.statusId),
            routeParameters: {organizationPartyId, recordId: row.paymentId}
        })
    )
    invoiceIds.push(...payments.map(row => row.forInvoiceId))
    const shipmentIds = [...new Set(sources.map(row => row.shipmentId).filter(Boolean))]
    const shipments = shipmentIds.length
        ? array(policy.find("mantle.shipment.Shipment").condition("shipmentId", "in", shipmentIds).list()).map(row =>
              Object.assign(policy.display(row), {
                  statusDescription: lib.statusText(row.statusId),
                  routeParameters: {organizationPartyId, shipmentId: row.shipmentId}
              })
          )
        : []
    const history = array(
        policy
            .find("moqui.entity.EntityAuditLog", {changedEntityName: "mantle.order.OrderHeader", pkPrimaryValue: orderId})
            .condition("changedFieldName", "statusId")
            .orderBy("-changedDate")
            .limit(50)
            .list()
    ).map(row => ({
        changedDateText: policy.dateText(row.changedDate),
        fromText: lib.statusText(row.oldValueText),
        toText: lib.statusText(row.newValueText),
        changeReason: row.changeReason || ""
    }))
    const unbilled = lines.some(line => toDecimal(line.quantity).compare(line.billedQuantity) > 0)
    const delivered = shipments.some(row => row.statusId === "ShipDelivered")
    const approved = ["OrderApproved", "OrderSent", "OrderProcessing", "OrderCompleted"].includes(header.statusId)
    return {
        orderFound: true,
        orderId,
        organizationPartyId,
        orderDetail: Object.assign(policy.display(header), {
            orderPartSeqId: part.orderPartSeqId,
            payable,
            kindText: payable ? "Purchase order" : "Sales order",
            counterpartyId,
            counterpartyName: names[counterpartyId] || counterpartyId,
            statusDescription: lib.statusText(header.statusId),
            totalText: money(header.grandTotal, header.currencyUomId),
            lines,
            invoices: invoiceRows(invoiceIds, organizationPartyId),
            payments,
            shipments,
            history,
            canInvoice: approved && unbilled && (payable ? c.apEdit : c.arEdit),
            canBillReceived: approved && payable && delivered && !!c.apEdit,
            canUploadBill: payable && !!c.payableImport,
            // the supplier's bill link: the order's BillUpload page on the organization's published Supplier site
            canIssueSupplierLink: approved && payable && !!c.apEdit && supplierSites(organizationPartyId).length > 0
        }),
        sourceValue: {
            orderId,
            orderPartSeqId: part.orderPartSeqId,
            organizationPartyId,
            basis: "ordered",
            operationKey: lib.operationKey("source")
        }
    }
}

// The organization's published sites with a Supplier app, where a purchase order's bill link opens.
function supplierSites(organizationPartyId) {
    const apps = ec.resource.script("component://mr-mantle/service/mantle/public/PublicApps.js")
    return apps.sitesFor("supplier", organizationPartyId)
}

// A shipment for ShipmentDetail's Accounting context: its items with their order sources and what was received,
// accepted and billed, its receipts and issues, the invoices of its items, and whether the user may bill its accepted
// receipts. A shipment of no organization the user works in has shipmentFound false.
function shipmentContext(parameters) {
    const scope = lib.access(parameters)
    const shipmentId = parameters.shipmentId
    const shipment = shipmentId ? policy.one("mantle.shipment.Shipment", {shipmentId}) : null
    const organizationPartyId = shipment ? sourceOrganization(scope, [shipment.toPartyId, shipment.fromPartyId]) : null
    const c = scope.capabilities
    const incoming = !!shipment && organizationPartyId === shipment.toPartyId
    const canRead = incoming ? c.apRead || c.reportRead || c.admin : c.arRead || c.reportRead || c.admin
    if (!shipment || !organizationPartyId || !(canRead || c.systemAdmin)) return {shipmentFound: false, shipmentId}
    const counterpartyId = incoming ? shipment.fromPartyId : shipment.toPartyId
    const names = policy.lib.partyNames([counterpartyId])
    const sources = policy.rows("mantle.shipment.ShipmentItemSource", {shipmentId})
    const receipts = policy.rows("mantle.product.receipt.AssetReceipt", {shipmentId})
    const issues = policy.rows("mantle.product.issuance.AssetIssuance", {shipmentId})
    const productIds = [...new Set(sources.map(row => row.productId).filter(Boolean))]
    const products = productIds.length
        ? Object.fromEntries(
              array(policy.find("mantle.product.Product").condition("productId", "in", productIds).list()).map(row => [
                  row.productId,
                  row.productName || row.productId
              ])
          )
        : {}
    const sum = (list, field) => list.reduce((total, row) => total.add(row[field] ?? 0), toDecimal(0))
    const itemRows = sources.map(source => {
        const mine = row => row.orderId === source.orderId && row.orderItemSeqId === source.orderItemSeqId
        return Object.assign(policy.display(source), {
            productName: products[source.productId] || source.productId,
            acceptedQuantity: sum(receipts.filter(mine), "quantityAccepted"),
            rejectedQuantity: sum(receipts.filter(mine), "quantityRejected"),
            issuedQuantity: sum(issues.filter(mine), "quantity"),
            orderParameters: {orderId: source.orderId, organizationPartyId}
        })
    })
    const orderIds = [...new Set(sources.map(row => row.orderId).filter(Boolean))]
    const invoices = invoiceRows(
        sources.map(row => row.invoiceId).concat(receipts.map(row => row.invoiceId)),
        organizationPartyId
    )
    const unbilledAccepted = receipts.some(row => !row.invoiceId && toDecimal(row.quantityAccepted ?? 0).compare(0) > 0)
    return {
        shipmentFound: true,
        shipmentId,
        organizationPartyId,
        shipmentDetail: Object.assign(policy.display(shipment), {
            incoming,
            kindText: incoming ? "Receipt" : "Shipment",
            counterpartyId,
            counterpartyName: names[counterpartyId] || counterpartyId,
            statusDescription: lib.statusText(shipment.statusId),
            items: itemRows,
            receipts: receipts.map(row =>
                Object.assign(policy.display(row), {productName: products[row.productId] || row.productId})
            ),
            invoices,
            orderIds,
            canBillReceived:
                incoming && shipment.statusId === "ShipDelivered" && unbilledAccepted && orderIds.length === 1 && !!c.apEdit
        }),
        sourceValue: {
            orderId: orderIds[0] || "",
            shipmentId,
            organizationPartyId,
            basis: "received",
            operationKey: lib.operationKey("source")
        }
    }
}

const operations = {bills, exceptions, supplierContext, orderContext, shipmentContext}
;({
    execute: (operation, parameters) => {
        if (!operations[operation]) throw new Error("Unknown payables screen operation " + operation)
        return operations[operation](parameters)
    }
})
