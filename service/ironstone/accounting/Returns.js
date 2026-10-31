// Screen context for ReturnDetail's Accounting context (design-accounting §14 ReturnDetail; crosscut §3.18): a return's
// authorization, what was received, accepted and rejected, what was settled and how, and what may be settled now, as
// Mantle's preview#ReturnSettlement answers it. Mantle's services own every read of eligibility and every settlement and
// their authorization; this adds the screen's names, links and states.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const {policy, array, money} = lib
const sum = (list, field) => list.reduce((total, row) => total.add(row[field] ?? 0), toDecimal(0))
const quantity = value => ec.l10n.format(toDecimal(value ?? 0), "#,##0.###")
const statusColors = {
    ReturnApproved: "primary",
    ReturnShipped: "primary",
    ReturnReceived: "warning",
    ReturnManResp: "negative",
    ReturnCompleted: "positive",
    ReturnCancelled: "grey-7"
}

function organizationOf(scope, partyId) {
    const allowed = scope.organizationPartyId ? [scope.organizationPartyId] : array(scope.allowedOrganizationPartyIds)
    return allowed.includes(partyId) ? partyId : null
}
// Mantle's preview, or its refusal as text: a preview that cannot run names why.
function previewOf(parameters) {
    try {
        return {preview: policy.probe("mantle.order.ReturnServices.preview#ReturnSettlement", parameters), message: null}
    } catch (error) {
        return {
            preview: null,
            message: String(error.message)
                .replace(/^Error: /, "")
                .replace(/^[A-Z_]+: /, "")
        }
    }
}

function returnContext(parameters) {
    const scope = lib.access(parameters)
    const returnId = parameters.returnId
    const header = returnId ? policy.one("mantle.order.return.ReturnHeader", {returnId}) : null
    if (!header) return {returnFound: false, returnId}
    const supplierReturn = !!policy.one("mantle.party.PartyRole", {partyId: header.customerPartyId, roleTypeId: "OrgInternal"})
    const organizationPartyId = organizationOf(scope, supplierReturn ? header.customerPartyId : header.vendorPartyId)
    const c = scope.capabilities
    const canRead = supplierReturn ? c.apRead || c.reportRead || c.admin : c.arRead || c.reportRead || c.admin
    if (!organizationPartyId || !(canRead || c.systemAdmin)) return {returnFound: false, returnId}
    const counterpartyId = supplierReturn ? header.vendorPartyId : header.customerPartyId
    const names = policy.lib.partyNames([counterpartyId])
    const currencyUomId = header.currencyUomId

    const items = array(policy.find("mantle.order.return.ReturnItem", {returnId}).orderBy("returnItemSeqId").list())
    const receipts = policy.rows("mantle.product.receipt.AssetReceipt", {returnId})
    const productIds = [...new Set(items.map(row => row.productId).filter(Boolean))]
    const products = productIds.length
        ? Object.fromEntries(
              array(policy.find("mantle.product.Product").condition("productId", "in", productIds).list()).map(row => [
                  row.productId,
                  row.productName || row.productId
              ])
          )
        : {}
    const {preview, message} = previewOf({returnId})
    const eligible = Object.fromEntries(array(preview?.itemRows).map(row => [row.returnItemSeqId, row]))
    const itemRows = items.map(item => {
        const mine = receipts.filter(row => row.returnItemSeqId === item.returnItemSeqId)
        const planned = eligible[item.returnItemSeqId]
        return Object.assign(policy.display(item), {
            productName: products[item.productId] || item.description || item.productId,
            responseName: responseName(item.returnResponseEnumId),
            statusDescription: lib.statusText(item.statusId),
            acceptedQuantity: sum(mine, "quantityAccepted"),
            rejectedQuantity: sum(mine, "quantityRejected"),
            settledQuantity: planned ? planned.settledQuantity : null,
            eligibleQuantity: planned ? planned.eligibleQuantity : null,
            orderParameters: {orderId: item.orderId, organizationPartyId}
        })
    })

    const billings = policy.rows("mantle.order.return.ReturnItemBilling", {returnId})
    const invoiceIds = [...new Set(billings.flatMap(row => [row.invoiceId, row.originalInvoiceId]).filter(Boolean))]
    const invoices = invoiceIds.length
        ? Object.fromEntries(
              array(policy.find("mantle.account.invoice.Invoice").condition("invoiceId", "in", invoiceIds).list()).map(row => [
                  row.invoiceId,
                  row
              ])
          )
        : {}
    const invoiceRoute = invoiceId => {
        const invoice = invoices[invoiceId]
        if (!invoice) return null
        const payable = invoice.financeDirection
            ? invoice.financeDirection === "payable"
            : invoice.toPartyId === organizationPartyId
        return payable ? "Payables/BillDetail" : "Receivables/InvoiceDetail"
    }
    const billingRows = billings.map(row =>
        Object.assign(policy.display(row), {
            productName: products[items.find(item => item.returnItemSeqId === row.returnItemSeqId)?.productId] || "",
            lineAmount: toDecimal(row.quantity ?? 1).multiply(row.amount ?? 0),
            currencyUomId,
            creditPath: invoiceRoute(row.invoiceId),
            creditParameters: lib.recordParameters(organizationPartyId, row.invoiceId),
            originalPath: invoiceRoute(row.originalInvoiceId),
            originalParameters: lib.recordParameters(organizationPartyId, row.originalInvoiceId),
            creditStatus: lib.statusText(invoices[row.invoiceId]?.statusId),
            kindText: row.receiptless === "Y" ? "Without receipt" : "Received"
        })
    )
    // every refund and credit of the return: those paying its credit memos, and those its items name
    const memoIds = [...new Set(billings.map(row => row.invoiceId).filter(Boolean))]
    const memoPayments = memoIds.length
        ? array(policy.find("mantle.account.payment.Payment").condition("forInvoiceId", "in", memoIds).list())
        : []
    const paymentIds = [
        ...new Set(items.map(row => row.refundPaymentId).concat(memoPayments.map(row => row.paymentId)).filter(Boolean))
    ]
    const paymentRows = paymentIds.length
        ? array(policy.find("mantle.account.payment.Payment").condition("paymentId", "in", paymentIds).list()).map(row =>
              Object.assign(policy.display(row), {
                  kindText: row.paymentTypeEnumId === "PtRefund" ? "Refund" : "Customer credit",
                  statusDescription: lib.statusText(row.statusId),
                  paymentParameters: lib.recordParameters(organizationPartyId, row.paymentId)
              })
          )
        : []

    // what may be settled now, and a credit without receipt for an approver of a customer return
    const canWrite = supplierReturn ? c.apEdit : c.arEdit
    const receiptless =
        !supplierReturn && c.returnCreditApprove && c.approve && c.arEdit ? previewOf({returnId, receiptless: true}).preview : null
    const receiptlessLines = array(receiptless?.lineRows)
    return {
        returnFound: true,
        returnId,
        organizationPartyId,
        returnDetail: Object.assign(policy.display(header), {
            supplierReturn,
            kindText: supplierReturn ? "Supplier return" : "Customer return",
            counterpartyId,
            counterpartyName: names[counterpartyId] || counterpartyId,
            statusDescription: lib.statusText(header.statusId),
            statusColor: statusColors[header.statusId] || "grey-7",
            counterpartyPath: supplierReturn ? "Payables/Supplier360" : "Receivables/Customer360",
            counterpartyParameters: supplierReturn
                ? {supplierPartyId: counterpartyId, organizationPartyId}
                : {customerPartyId: counterpartyId, organizationPartyId},
            items: itemRows,
            billings: billingRows,
            payments: paymentRows,
            manualCount: items.filter(row => row.statusId === "ReturnManResp").length
        }),
        settlement: {
            lineRows: array(preview?.lineRows).map(row =>
                Object.assign({}, row, {quantityText: quantity(row.quantity), currencyUomId})
            ),
            creditTotalText: money(preview?.creditTotal ?? 0, currencyUomId),
            refundTotalText: money(preview?.refundTotal ?? 0, currencyUomId),
            replaceQuantityText: quantity(preview?.replaceQuantity ?? 0),
            previewVersion: preview?.previewVersion || "",
            canSettle: !!preview?.canSettle && !!canWrite,
            reasonText: preview
                ? preview.reasonText || (canWrite ? "" : "Settling this return is for its side's finance users")
                : message || "",
            hasLines: array(preview?.lineRows).length > 0,
            receiptlessVersion: receiptless?.previewVersion || "",
            receiptlessTotalText: money(
                receiptlessLines.reduce((total, row) => total.add(row.amount ?? 0), toDecimal(0)),
                currencyUomId
            ),
            canSettleReceiptless:
                !!receiptless && receiptlessLines.length > 0 && ["REASON_REQUIRED", null].includes(receiptless.reasonCode),
            operationKey: lib.operationKey("RS")
        }
    }
}
function responseName(returnResponseEnumId) {
    return returnResponseEnumId ? policy.one("moqui.basic.Enumeration", {enumId: returnResponseEnumId})?.description || "" : ""
}

const operations = {returnContext}
;({
    execute: (operation, parameters) => {
        if (!operations[operation]) throw new Error("Unknown return screen operation " + operation)
        return operations[operation](parameters)
    }
})
