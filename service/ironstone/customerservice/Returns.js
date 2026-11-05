// Customer Service's returns (impl-customer-service P9; design-customer-service §5 Returns, NewReturn, ReturnDetail,
// QualityInspection, Approvals, §9 ReturnPolicies; crosscut §3.18, §3.19): the reads of the Returns list, NewReturn, Home's
// panels, ReturnDetail's and QualityInspection's Customer Service branches, and the batch of authorizations and cancels. Every
// read is limited by CustomerService.js's scope (the user's organizations' customer returns of customers they serve) and the
// record checked by recordOf; Mantle's mantle.order.ReturnPolicyServices checks its permission and the organization again.
// The audience of §2 holds in each answer: a return's credit, refund and settlement amounts only for a holder of the borrowed
// settlement capability (F: invoiceCredit, paymentRefund, returnCredit), its prices only for PRICE_VIEW, ACCOUNTING_VIEW or
// RECEIVABLE_VIEW (Mantle's rule); W (receive, inspect, dispose) acts on receipt and inspection, A and R read them. The writes
// are Mantle's, called by the screens after check#Record: ReturnPolicyServices, Warehouse's receive#ReturnItems and
// request#ReturnLabel, Accounting's preview#ReturnSettlement and settle#Return.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const orders = () => ec.resource.script("component://mr-boss/service/ironstone/customerservice/Orders.js")
const {one, rows, call, denied, ms} = lib

const P = "mantle.order.ReturnPolicyServices."
const HEADER = "mantle.order.return.ReturnHeader"
const openStatuses = ["ReturnCreated", "ReturnRequested"]
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value ?? 0)
const qty = value => (dec(value).compare(0) === 0 ? "0" : ec.l10n.format(dec(value), "#,##0.###"))
const L = text => ec.l10n.localize(text)
const textOf = value => (value == null || value === "" ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy HH:mm"))
const urlOf = returnId => "/qapps/CustomerService/Returns/ReturnDetail?returnId=" + encodeURIComponent(returnId)
const settlementReader = can => !!(can.invoiceCredit || can.paymentRefund || can.returnCredit)

// The Returns area's own check: the area's grant (the agent, manager and return authorizer) and one of the permissions Mantle's
// reads take.
function returnsScope() {
    const userScope = cs.required()
    const can = userScope.capabilities
    if (!can.returns) denied("PERMISSION_DENIED", "Returns is not available to you")
    return userScope
}
// The customers a list may name: those the user serves among the rows' (a shared customer's other organizations' returns are
// left out by the vendor condition in Mantle).
function keepServed(userScope, returnRows) {
    const served = new Map()
    return returnRows.filter(row => {
        if (!served.has(row.customerPartyId)) served.set(row.customerPartyId, !!cs.customerOf(userScope, row.customerPartyId))
        return served.get(row.customerPartyId)
    })
}

// ===== the Returns list (ReturnFind, ReturnList) =====
const viewLabels = {
    requested: "Requested",
    awaiting: "Awaiting authorization",
    authorized: "Authorized, awaiting goods",
    received: "Received, awaiting disposition",
    manual: "Manual response",
    settlement: "Settlement pending",
    expiring: "Expiring",
    cancelled: "Cancelled",
    closed: "Closed",
    all: "All"
}
function findReturns(p) {
    const userScope = returnsScope()
    const view = Object.hasOwn(viewLabels, p.view || "") ? p.view : "awaiting"
    const found = call(P + "find#ServiceReturns", {
        view,
        text: p.text || null,
        customerPartyId: p.customerPartyId || null,
        orderId: p.orderId || null,
        statusId: p.statusId || null,
        assigneePartyId: p.assigneePartyId || null,
        pageIndex: p.pageIndex || 0,
        pageSize: p.pageSize || 25
    })
    const returnRows = keepServed(userScope, Array.from(found.returnRows || [])).map(row =>
        Object.assign(row, {
            url: urlOf(row.returnId),
            canAuthorize: !!userScope.capabilities.returnAuthorize && openStatuses.includes(row.statusId)
        })
    )
    return {
        view,
        viewLabel: viewLabels[view],
        views: Object.entries(viewLabels).map(([value, label]) => ({value, label})),
        returnRows,
        returnRowsCount: found.returnRowsCount,
        returnRowsPageIndex: found.returnRowsPageIndex,
        returnRowsPageSize: found.returnRowsPageSize,
        amountsWithheld: !!found.amountsWithheld,
        canAuthorize: !!userScope.capabilities.returnAuthorize,
        canEnter: !!(userScope.capabilities.caseEdit || userScope.capabilities.returnAuthorize)
    }
}

// The batch of Returns (authorize and cancel): each return in its own transaction, a result per return (Done, Forbidden,
// Refused with Mantle's code, Failed); one that fails names its reason and the others go on.
function applyBatch(p) {
    const userScope = returnsScope()
    const action = String(p.action || "")
    if (!["authorize", "cancel"].includes(action)) denied("ACTION_INVALID", "Authorize or cancel")
    const returnIds = Array.from(
        new Set(
            (Array.isArray(p.returnIds) ? p.returnIds : String(p.returnIds || "").split(","))
                .map(id => String(id).trim())
                .filter(Boolean)
        )
    )
    if (!returnIds.length) denied("SELECTION_REQUIRED", "Choose the returns")
    const results = []
    for (const returnId of returnIds) {
        try {
            cs.recordOf(userScope, "return", returnId)
        } catch (error) {
            results.push({returnId, result: "Forbidden", message: L("Not available to you")})
            continue
        }
        try {
            if (action === "authorize")
                lib.probe(P + "authorize#Return", {
                    operationKey: String(p.operationKey || "batch").substring(0, 24) + "-" + returnId,
                    returnId,
                    reason: p.reason || null
                })
            else lib.probe(P + "cancel#CustomerReturn", {returnId, reason: p.reason || null})
            results.push({returnId, result: "Done", message: action === "authorize" ? L("Authorized") : L("Cancelled")})
        } catch (error) {
            // the refusal's code: Mantle's "CODE: message", after the error's own prefix
            const code =
                lib.reasonCode(error) || (/^(?:Error: )?([A-Z][A-Z0-9_]+):/.exec(String(error.message || "")) || [])[1] || null
            if (!code) ec.logger.error("Return batch " + action + " of " + returnId + " failed: " + error.message)
            results.push({
                returnId,
                result: code === "PERMISSION_DENIED" ? "Forbidden" : code ? "Refused" : "Failed",
                code: code || null,
                message: String(error.message || "")
                    .replace(/^Error: /, "")
                    .replace(/^[A-Z][A-Z0-9_]+: /, "")
            })
        }
    }
    return {
        results,
        doneCount: results.filter(row => row.result === "Done").length,
        summary: results
            .map(row => row.returnId + ": " + row.result + (row.result === "Done" ? "" : " (" + row.message + ")"))
            .join("; ")
    }
}

// ===== NewReturn (ReturnSource, ReturnableLines, ReturnRequest) =====
// The source and its returnable lines with the policy preview: the customer (one the user serves), their sales orders a return
// may come from, and the chosen order's lines through Mantle's evaluate#ReturnPolicy; a case to link, when given, is one the
// user sees of that customer.
function prepareReturn(p) {
    const userScope = returnsScope()
    const can = userScope.capabilities
    if (!(can.caseEdit || can.returnAuthorize)) denied("PERMISSION_DENIED", "Entering a return is not available to you")
    let customerPartyId = p.customerPartyId || null
    let caseRow = null
    if (!blank(p.requestId)) {
        const record = cs.recordOf(userScope, "case", p.requestId)
        const customer = rows("mantle.request.RequestParty", {requestId: p.requestId, roleTypeId: "Customer"}).find(row =>
            lib.active(row)
        )
        customerPartyId = customerPartyId || customer?.partyId || null
        caseRow = {requestId: p.requestId, label: record.label}
    }
    if (!blank(p.orderId)) {
        const order = cs.recordOf(userScope, "order", p.orderId)
        const part = rows("mantle.order.OrderPart", {orderId: p.orderId})[0]
        customerPartyId = customerPartyId || part?.customerPartyId || null
        if (part && customerPartyId !== part.customerPartyId)
            denied("ORDER_MISMATCH", "Order " + p.orderId + " is not this customer's")
        void order
    }
    if (customerPartyId && !cs.customerOf(userScope, customerPartyId))
        denied("RECORD_UNAVAILABLE", "Customer " + customerPartyId + " is not available")
    const orderOptions = customerPartyId ? cs.execute("choices", {choice: "returnOrders", customerPartyId}).options : []
    let evaluation = null
    if (!blank(p.orderId)) evaluation = call(P + "evaluate#ReturnPolicy", {orderId: p.orderId})
    return {
        customerPartyId,
        customerName: customerPartyId ? cs.partyName(customerPartyId) : "",
        caseRow,
        orderOptions,
        orderId: p.orderId || null,
        evaluation,
        lineRows: evaluation
            ? Array.from(evaluation.lineRows).map(row =>
                  Object.assign({}, row, {returnable: dec(String(row.eligibleQuantity).replace(/,/g, "")).compare(0) > 0})
              )
            : []
    }
}

// ===== ReturnDetail's Customer Service branch =====
function shipmentRows(returnId) {
    const shipmentIds = Array.from(new Set(rows("mantle.shipment.ShipmentItemSource", {returnId}).map(row => row.shipmentId)))
    return shipmentIds.map(shipmentId => {
        const shipment = one("mantle.shipment.Shipment", {shipmentId})
        const packages = rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId})
        const labels = packages.filter(row => row.trackingCode || row.labelUrl || row.labelDate)
        return {
            shipmentId,
            statusId: shipment?.statusId,
            statusText: cs.statusText(shipment?.statusId),
            open: !!shipment && !["ShipDelivered", "ShipCancelled"].includes(shipment.statusId),
            labelText: labels.length ? labels.map(row => row.trackingCode || L("label")).join(", ") : L("No label yet"),
            labelUrl: labels.find(row => row.labelUrl)?.labelUrl || null,
            trackingUrl: labels.find(row => row.trackingUrl)?.trackingUrl || null,
            hasLabel: labels.length > 0,
            receivedText: qty(
                rows("mantle.product.receipt.AssetReceipt", {shipmentId}).reduce(
                    (sum, row) => sum.add(dec(row.quantityAccepted)).add(dec(row.quantityRejected)),
                    dec(0)
                )
            ),
            url: "/qapps/CustomerService/Orders/ShipmentDetail?shipmentId=" + encodeURIComponent(shipmentId)
        }
    })
}
function inspectionRows(returnId) {
    return rows("mantle.product.quality.QualityInspection", {returnId}).map(row => {
        const product = row.productId ? one("mantle.product.Product", {productId: row.productId}) : null
        return {
            qualityInspectionId: row.qualityInspectionId,
            returnItemSeqId: row.returnItemSeqId,
            productName: product?.productName || row.productId || "",
            statusText: cs.statusText(row.statusId),
            quantityText: qty(row.quantity),
            heldText: qty(row.heldQuantity),
            resultText: row.resultEnumId ? cs.enumText(row.resultEnumId) : "",
            dispositionText: rows("mantle.product.quality.QualityInspectionDisposition", {
                qualityInspectionId: row.qualityInspectionId
            })
                .map(disposition => qty(disposition.quantity) + " " + cs.enumText(disposition.dispositionEnumId))
                .join(", "),
            url:
                "/qapps/CustomerService/Returns/QualityInspection?qualityInspectionId=" +
                encodeURIComponent(row.qualityInspectionId)
        }
    })
}
function itemRows(returnId, amounts) {
    const all = rows("mantle.order.return.ReturnItem", {returnId})
    const receipts = rows("mantle.product.receipt.AssetReceipt", {returnId})
    const billings = rows("mantle.order.return.ReturnItemBilling", {returnId})
    return all
        .filter(item => !item.parentItemSeqId)
        .sort((a, b) => String(a.returnItemSeqId).localeCompare(String(b.returnItemSeqId)))
        .map(item => {
            const product = item.productId ? one("mantle.product.Product", {productId: item.productId}) : null
            const mine = receipts.filter(row => row.returnItemSeqId === item.returnItemSeqId)
            const accepted = mine.reduce((sum, row) => sum.add(dec(row.quantityAccepted)), dec(0))
            const rejected = mine.reduce((sum, row) => sum.add(dec(row.quantityRejected)), dec(0))
            const settled = billings
                .filter(row => row.returnItemSeqId === item.returnItemSeqId)
                .reduce((sum, row) => sum.add(dec(row.quantity)), dec(0))
                .add(dec(item.replacedQuantity))
            const waiting =
                ["ReturnApproved", "ReturnShipped"].includes(item.statusId) &&
                dec(item.receivedQuantity).compare(dec(item.returnQuantity)) < 0
            return {
                returnItemSeqId: item.returnItemSeqId,
                productName: product
                    ? [product.pseudoId || product.productId, product.productName].filter(Boolean).join(" · ")
                    : item.description || "",
                sourceText: item.orderId ? item.orderId + ":" + item.orderItemSeqId : L("No order line"),
                orderId: item.orderId || null,
                reasonText: cs.enumText(item.returnReasonEnumId).replace(/^\d+ /, ""),
                responseText: cs.enumText(item.returnResponseEnumId),
                returnReasonEnumId: item.returnReasonEnumId,
                returnResponseEnumId: item.returnResponseEnumId,
                statusText: cs.statusText(item.statusId),
                statusId: item.statusId,
                authorizedQuantity: qty(item.returnQuantity),
                receivedQuantity: qty(item.receivedQuantity),
                acceptedQuantity: qty(accepted),
                rejectedQuantity: qty(rejected),
                settledQuantity: qty(settled),
                remainderQuantity: waiting ? qty(dec(item.returnQuantity).subtract(dec(item.receivedQuantity))) : "",
                waiting,
                immediateText: item.responseImmediate === "Y" ? L("At authorization") : L("After receipt"),
                priceText:
                    amounts && item.returnPrice != null
                        ? ec.l10n.formatCurrency(dec(item.returnPrice), one(HEADER, {returnId})?.currencyUomId || "USD")
                        : null
            }
        })
}
// The settlement summary: the borrowed settlement capability reads Accounting's preview (amounts, eligibility, the version a
// settle needs); anyone else reads the settled quantities, amounts withheld.
function settlementOf(returnId, can) {
    const mode = call("mantle.order.ReturnServices.get#ReturnSettlementMode", {returnId})
    const out = {settlementRequired: !!mode.settlementRequired, reader: settlementReader(can), canSettle: false}
    if (!out.reader) return out
    try {
        const preview = lib.probe("mantle.order.ReturnServices.preview#ReturnSettlement", {returnId})
        Object.assign(out, {
            creditText: ec.l10n.formatCurrency(dec(preview.creditTotal), preview.currencyUomId || "USD"),
            refundText: ec.l10n.formatCurrency(dec(preview.refundTotal), preview.currencyUomId || "USD"),
            replaceText: qty(preview.replaceQuantity),
            previewVersion: preview.previewVersion,
            canSettle: !!preview.canSettle && !!can.invoiceCredit,
            reasonText: preview.reasonText || "",
            lineRows: Array.from(preview.itemRows || []).map(row => ({
                returnItemSeqId: row.returnItemSeqId,
                eligibleText: qty(row.eligibleQuantity),
                settledText: qty(row.settledQuantity),
                amountText:
                    row.eligibleAmount != null
                        ? ec.l10n.formatCurrency(dec(row.eligibleAmount), preview.currencyUomId || "USD")
                        : ""
            }))
        })
    } catch (error) {
        out.reasonText = String(error.message || "").replace(/^Error: /, "")
    }
    return out
}
function returnDetail(p) {
    const userScope = returnsScope()
    const can = userScope.capabilities
    const record = cs.recordOf(userScope, "return", p.returnId)
    const returnId = String(p.returnId)
    const header = one(HEADER, {returnId})
    const state = call(P + "get#ReturnState", {returnId})
    const row = state.returnRow
    const evaluation = state.evaluation || {}
    const open = openStatuses.includes(header.statusId)
    const shipments = shipmentRows(returnId)
    const openShipment = shipments.find(shipment => shipment.open) || null
    const items = itemRows(returnId, orders().amountRead())
    const effects = Array.from(state.effects || [])
    const exceptions = Array.from(evaluation.exceptions || [])
    const facility = header.facilityId ? one("mantle.facility.Facility", {facilityId: header.facilityId}) : null
    const settlement = settlementOf(returnId, can)
    const enter = !!(can.caseEdit || can.returnAuthorize)
    const authorized = ["ReturnApproved", "ReturnShipped", "ReturnReceived", "ReturnManResp", "ReturnCompleted"].includes(
        header.statusId
    )
    return {
        returnFound: true,
        rh: Object.assign({}, row, {
            label: record.label,
            organizationName: cs.partyName(header.vendorPartyId),
            facilityName: facility?.facilityName || header.facilityId || "",
            entryText: textOf(header.entryDate),
            evaluatedText: textOf(header.policyEvaluatedDate),
            outcome: evaluation.outcome || "",
            outcomeText: evaluation.outcomeText || "",
            exceptionText: evaluation.exceptionText || "",
            feeText: evaluation.feeText || "",
            instructions: evaluation.instructions || "",
            previewExpireText: evaluation.expireText || "",
            sourceRevision: state.sourceRevision,
            exceptionApproved: !!state.exceptionApproved,
            effectsText: effects.join(", "),
            settlementRequired: settlement.settlementRequired,
            canAuthorize: !!can.returnAuthorize && open && items.length > 0 && (!exceptions.length || !!state.exceptionApproved),
            needsReason: !!evaluation.manualReview,
            canRequestException: enter && open && exceptions.length > 0 && !row.exceptionAsked && !state.exceptionApproved,
            canDecideException: !!can.returnExceptionApprove && open && exceptions.length > 0,
            canEditLines: enter && open,
            canAssign: enter && !["ReturnCancelled", "ReturnCompleted"].includes(header.statusId),
            canIssueLabel:
                !!can.returnAuthorize && header.statusId === "ReturnApproved" && !!openShipment && !openShipment.hasLabel,
            canCloseRemainder:
                !!can.returnAuthorize &&
                ["ReturnApproved", "ReturnShipped"].includes(header.statusId) &&
                items.some(item => item.waiting),
            canCancel: !effects.length && (open ? enter : header.statusId === "ReturnApproved" && !!can.returnAuthorize),
            canReceive: !!can.receive && settlement.settlementRequired && !!openShipment,
            receiveNote:
                !settlement.settlementRequired && openShipment
                    ? L(
                          "Mantle receives this return when its shipment is delivered (the organization does not settle returns separately)."
                      )
                    : "",
            canSettle: settlement.canSettle,
            canSend: enter && authorized,
            canPrint: authorized,
            rmaContentId: state.rmaContentId || null,
            openShipmentId: openShipment?.shipmentId || null
        }),
        itemRows: items,
        shipmentRows: shipments,
        inspectionRows: inspectionRows(returnId),
        decisionRows: Array.from(state.decisions || []),
        lineRows: Array.from(evaluation.lineRows || []),
        settlement,
        caseRows: orders().casesOf(userScope, HEADER, returnId),
        recipientOptions: enter && authorized ? orders().recipientOptions([header.customerPartyId]) : [],
        senderOptions: enter && authorized ? orders().senderOptions() : [],
        amountsWithheld: !!row.amountsWithheld
    }
}

// ===== QualityInspection's Customer Service branch (F38) =====
// An inspection of a customer return the user may work with: Mantle's read, its return and order links under Customer
// Service, and the inspect, verify and dispose actions for W where Warehouse's scope also covers its facility (Warehouse's
// transitions); A and R read it.
function inspectionDetail(p) {
    const userScope = cs.required()
    const inspectionRow = one("mantle.product.quality.QualityInspection", {qualityInspectionId: p.qualityInspectionId || "_NA_"})
    if (!inspectionRow?.returnId)
        denied("RECORD_UNAVAILABLE", "Inspection " + (p.qualityInspectionId || "") + " is not available")
    cs.recordOf(userScope, "return", inspectionRow.returnId)
    const found = call("mantle.product.QualityServices.get#Inspection", {qualityInspectionId: p.qualityInspectionId})
    const can = userScope.capabilities
    // W acts here without the Warehouse root (check#ReturnInspection on the action); Mantle's quality services check the
    // permission and the organization again
    const warehouseActs = !!(can.inspect || can.dispose)
    const mantleCan = found.capabilities || {}
    return Object.assign({}, found, {
        recordFound: true,
        inspection: Object.assign({}, found.inspection, {statusColor: "primary"}),
        links: {
            returnUrl: urlOf(inspectionRow.returnId),
            order: inspectionRow.orderId ? "/qapps/CustomerService/Orders/OrderDetail?orderId=" + inspectionRow.orderId : null
        },
        actions: {
            canSaveReadings: warehouseActs && !!can.inspect && !!mantleCan.canSaveReadings,
            canSubmit: warehouseActs && !!can.inspect && !!mantleCan.canSubmit,
            canVerify: false,
            canDispose: warehouseActs && !!can.dispose && !!mantleCan.canDispose,
            canAssign: false,
            canReinspect: false,
            canCancel: false
        },
        submitDefaults: {quantityAccepted: found.inspection?.quantity, quantityRejected: "0"},
        disposeDefaults: {
            dispositionEnumId: found.acceptedLeft && found.acceptedLeft !== "0" ? "QdRelease" : "QdScrap",
            quantity: found.acceptedLeft && found.acceptedLeft !== "0" ? found.acceptedLeft : found.rejectedLeft
        }
    })
}

// check#ReturnInspection: an inspection of a customer return the user works with, and the borrowed W capability (inspect or
// dispose) the action needs; the shared inspection transitions call it in the Customer Service context.
function checkInspection(p) {
    const userScope = cs.required()
    const row = one("mantle.product.quality.QualityInspection", {qualityInspectionId: p.qualityInspectionId || "_NA_"})
    if (!row?.returnId) denied("RECORD_UNAVAILABLE", "Inspection " + (p.qualityInspectionId || "") + " is not available")
    cs.recordOf(userScope, "return", row.returnId)
    if (!["inspect", "dispose"].includes(p.capability)) throw new Error("Unknown inspection capability " + p.capability)
    if (!userScope.capabilities[p.capability])
        denied("PERMISSION_DENIED", (p.capability === "inspect" ? "QUALITY_INSPECT" : "QUALITY_DISPOSE") + " is required")
    return {returnId: row.returnId}
}

// ===== Home and Customer360 =====
// Home's Returns awaiting approval (R, M): Mantle's find#ReturnApprovals limited to the customers the user serves.
function awaitingReturns(p) {
    const userScope = cs.required()
    const can = userScope.capabilities
    if (!(can.returnAuthorize || can.returnExceptionApprove)) return {approvalRows: [], approvalCount: 0}
    const found = call(P + "find#ReturnApprovals", {limit: p.limit || 8})
    const approvalRows = keepServed(userScope, Array.from(found.approvalRows || [])).map(row =>
        Object.assign(row, {url: urlOf(row.returnId)})
    )
    return {approvalRows, approvalCount: found.approvalCount}
}
// Customer360's Returns tab: the customer's returns with the user's organizations, newest first.
function customerReturns(p) {
    const userScope = cs.required()
    if (!cs.customerOf(userScope, p.customerPartyId))
        denied("RECORD_UNAVAILABLE", "Customer " + p.customerPartyId + " is not available")
    if (!userScope.capabilities.returns) return {returnRows: [], available: false}
    const found = call(P + "find#ServiceReturns", {view: "all", customerPartyId: p.customerPartyId, pageSize: 50})
    return {
        available: true,
        returnRows: Array.from(found.returnRows || []).map(row => Object.assign(row, {url: urlOf(row.returnId)}))
    }
}

// ===== ReturnPolicies (settings) =====
// The settings organization (one Mantle's saves accept, Configuration.js) with its return policies and reason rows (Mantle's
// find#Policies), the options of the edit form, and whether the user may change them (RETURN_POLICY_EDIT).
function policySettings(p) {
    const userScope = cs.required()
    const configuration = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Configuration.js")
    const organizationPartyId = configuration.organizationOf(userScope, p.organizationPartyId || null)
    const found = call(P + "find#Policies", {
        organizationPartyId,
        includeEnded: p.includeEnded === true || p.includeEnded === "Y"
    })
    const enumOptions = enumTypeId =>
        rows("moqui.basic.Enumeration", {enumTypeId})
            .sort((a, b) => Number(a.sequenceNum || 0) - Number(b.sequenceNum || 0))
            .map(row => ({value: row.enumId, label: String(row.description || row.enumId).replace(/^\d+ /, "")}))
    let preview = null
    if (!blank(p.previewOrderId)) {
        cs.recordOf(userScope, "order", p.previewOrderId)
        preview = call(P + "evaluate#ReturnPolicy", {orderId: p.previewOrderId})
    }
    return {
        organizationPartyId,
        organizations: configuration.organizationOptions(userScope),
        policies: Array.from(found.policies || []),
        reasons: Array.from(found.reasons || []),
        reasonOptions: enumOptions("ReturnReason"),
        responseOptions: enumOptions("ReturnResponse").filter(row => row.value !== "RrspManual"),
        windowOptions: enumOptions("ReturnWindowFrom"),
        canEdit: !!userScope.capabilities.returnPolicyEdit,
        preview
    }
}

const operations = {
    findReturns,
    applyBatch,
    prepareReturn,
    returnDetail,
    inspectionDetail,
    checkInspection,
    awaitingReturns,
    customerReturns,
    policySettings
}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service return operation " + op)
        return operations[op](parameters || {})
    }
})
