// The Warehouse returns screens' reads (impl-warehouse P14, design-warehouse §11, crosscut §3.8 and §3.18): ReturnFind and
// ReturnList (the customer and supplier returns of the user's facilities), ReturnDetail's Warehouse branch (the return, its
// items with authorized, received or sent, accepted, rejected and settled quantity, its shipments, inspections, the items it
// may still take and the settlement read only), ReturnReceipt's and SupplierReturnShipment's branch of Shared/ShipmentDetail
// (the return shipment's items, receipts or issues, inspections and packages), the returns drop-downs and Home's returns
// queue. Every read is limited to the user's Warehouse facilities in the query (a return by its facility, or with none by
// its parties; a shipment by its route segments); the postings are Mantle's: create#Return, create#ReturnFromOrder,
// add#OrderItemToReturn and add#ReceiptToReturn, request#Return, and the guarded WarehouseTaskServices entry points
// (receive#ReturnItems with an operation key, issue#SupplierReturnStock, ship#SupplierReturn), which the screens call after
// AccessServices.check#Record. Amounts only with financial read; Warehouse never settles.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, denied, dateText} = lib
const cf = () => ec.entity.conditionFactory

const openStatuses = ["ReturnCreated", "ReturnRequested", "ReturnApproved", "ReturnShipped", "ReturnReceived", "ReturnManResp"]
const statusColors = {
    ReturnCreated: "grey-8",
    ReturnRequested: "info",
    ReturnApproved: "primary",
    ReturnShipped: "primary",
    ReturnReceived: "warning",
    ReturnManResp: "warning",
    ReturnCompleted: "positive",
    ReturnCancelled: "grey-7"
}
const shipmentColors = {ShipInput: "grey-8", ShipScheduled: "primary", ShipPicked: "info", ShipPacked: "info"}
const choiceLimit = 30
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const like = term => "%" + String(term).replace(/[\\%_]/g, character => "\\" + character) + "%"
const sumOf = (list, field) => list.reduce((total, row) => total + number(row[field]), 0)

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
// The internal organizations of the user's returns: a customer return's vendor, a supplier return's customer.
function internalOrganizations(userScope) {
    if (userScope.facilityOwnerIds) return userScope.partyOwnerIds
    return Array.from(find("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).selectField("partyId").list()).map(
        r => r.partyId
    )
}
const isSupplierReturn = (header, internal) => internal.includes(header.customerPartyId)

// Mantle's settlement mode of a return: its organization and whether it settles returns separately (D11), as a probe.
function settlementOf(returnId) {
    try {
        return lib.probe("mantle.order.ReturnServices.get#ReturnSettlementMode", {returnId})
    } catch (error) {
        ec.logger.warn("Settlement mode of return " + returnId + ": " + error.message)
        return null
    }
}
function statusTextOf(statusId) {
    return statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : ""
}

// ===== ReturnFind and ReturnList =====
function returnQuery(userScope, p) {
    const facility = p.facilityId ? one("mantle.facility.Facility", {facilityId: p.facilityId}) : null
    if (p.facilityId && !warehouse.inScope(userScope, facility))
        denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
    const facilityIds = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    const internal = internalOrganizations(userScope)
    let query = find("mantle.order.return.ReturnHeader")
    if (facility) query = query.condition("facilityId", facility.facilityId)
    else if (facilityIds)
        // a return of one of the user's facilities, or with no facility one of their organizations'
        query = query.condition(
            cf().makeCondition(
                [
                    cf().makeCondition("facilityId", "in", facilityIds.length ? facilityIds : ["_none_"]),
                    cf().makeCondition(
                        [
                            cf().makeCondition("facilityId", "is-null", null),
                            cf().makeCondition(
                                [
                                    cf().makeCondition("vendorPartyId", "in", internal.length ? internal : ["_none_"]),
                                    cf().makeCondition("customerPartyId", "in", internal.length ? internal : ["_none_"])
                                ],
                                "or"
                            )
                        ],
                        "and"
                    )
                ],
                "or"
            )
        )
    if (p.direction === "supplier") query = query.condition("customerPartyId", "in", internal.length ? internal : ["_none_"])
    else if (p.direction === "customer") query = query.condition("vendorPartyId", "in", internal.length ? internal : ["_none_"])
    if (p.statusId === "all") {
        // every status
    } else if (p.statusId) query = query.condition("statusId", p.statusId)
    else query = query.condition("statusId", "in", openStatuses)
    if (p.partyId)
        query = query.condition(
            cf().makeCondition(
                [
                    cf().makeCondition("vendorPartyId", "equals", p.partyId),
                    cf().makeCondition("customerPartyId", "equals", p.partyId)
                ],
                "or"
            )
        )
    if (p.text && String(p.text).trim()) {
        const term = like(String(p.text).trim())
        query = query.condition(
            cf().makeCondition(
                [
                    cf().makeCondition("returnId", "like", term).ignoreCase(),
                    cf().makeCondition("displayId", "like", term).ignoreCase()
                ],
                "or"
            )
        )
    }
    return {query, internal}
}
// Each return's authorized, handled (received, or issued to a supplier), credited and inspection progress, read together.
function progressOf(returnIds) {
    const progress = new Map(
        returnIds.map(id => [id, {authorized: 0, handled: 0, settled: 0, orderIds: new Set(), inspections: 0, disposed: 0}])
    )
    if (!returnIds.length) return progress
    for (const item of Array.from(find("mantle.order.return.ReturnItem").condition("returnId", "in", returnIds).list())) {
        if (item.parentItemSeqId || !item.productId || item.statusId === "ReturnCancelled") continue
        const row = progress.get(item.returnId)
        row.authorized += number(item.returnQuantity)
        row.handled += number(item.receivedQuantity)
        row.settled += number(item.replacedQuantity)
        if (item.orderId) row.orderIds.add(item.orderId)
    }
    for (const billing of Array.from(find("mantle.order.return.ReturnItemBilling").condition("returnId", "in", returnIds).list()))
        progress.get(billing.returnId).settled += number(billing.quantity)
    // a supplier return's sent quantity is what was issued to its sources
    const sources = Array.from(find("mantle.shipment.ShipmentItemSource").condition("returnId", "in", returnIds).list())
    const sourceReturn = new Map(sources.map(row => [row.shipmentItemSourceId, row.returnId]))
    if (sources.length)
        for (const issuance of Array.from(
            find("mantle.product.issuance.AssetIssuance")
                .condition("shipmentItemSourceId", "in", [...sourceReturn.keys()])
                .list()
        ))
            progress.get(sourceReturn.get(issuance.shipmentItemSourceId)).handled += number(issuance.quantity)
    for (const inspection of Array.from(
        find("mantle.product.quality.QualityInspection").condition("returnId", "in", returnIds).list()
    )) {
        if (inspection.statusId === "QiCancelled") continue
        const row = progress.get(inspection.returnId)
        row.inspections += 1
        if (inspection.statusId === "QiDisposed") row.disposed += 1
    }
    return progress
}
function returns(p) {
    const userScope = warehouse.required(warehouse.scope())
    const internal = internalOrganizations(userScope)
    // a find is used once: one for the count, one for the page
    const count = returnQuery(userScope, p).query.count()
    const paged = lib.page(returnQuery(userScope, p).query.orderBy("-entryDate,-returnId"), p, "returnRows", count)
    const headers = paged.rows
    const progress = progressOf(headers.map(row => row.returnId))
    const names = lib.partyNames(headers.flatMap(row => [row.vendorPartyId, row.customerPartyId]))
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        headers.map(row => row.statusId)
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        headers.map(row => row.facilityId)
    )
    const out = Object.assign({}, paged)
    delete out.rows
    out.returnRows = headers.map(header => {
        const supplier = isSupplierReturn(header, internal)
        const partyId = supplier ? header.vendorPartyId : header.customerPartyId
        const row = progress.get(header.returnId)
        const dispositionText = row.inspections
            ? row.disposed + " of " + row.inspections + " inspection" + (row.inspections === 1 ? "" : "s") + " disposed"
            : ""
        return {
            returnId: header.returnId,
            directionText: supplier ? "To supplier" : "From customer",
            supplierReturn: supplier,
            partyId,
            partyName: names[partyId] || partyId || "",
            facilityName: facilities.get(header.facilityId) || header.facilityId || "",
            statusId: header.statusId,
            statusText: statuses.get(header.statusId) || header.statusId,
            statusColor: statusColors[header.statusId] || "grey",
            entryText: dateText(header.entryDate),
            sourceText: [...row.orderIds].join(", "),
            authorizedQuantity: row.authorized,
            handledQuantity: row.handled,
            handledText: (supplier ? "Sent " : "Received ") + quantityText(row.handled) + " of " + quantityText(row.authorized),
            settledQuantity: row.settled,
            dispositionText
        }
    })
    out.canReceive = !!userScope.capabilities.receive
    out.canSupplierReturn = !!userScope.capabilities.qualityDispose
    return out
}

// ===== one return =====
function inspectionRows(conditions) {
    const found = Array.from(conditions.list()).filter(row => row.statusId !== "QiCancelled")
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        found.map(row => row.statusId)
    )
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        found.map(row => row.productId)
    )
    const results = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        found.map(row => row.resultEnumId)
    )
    const dispositions = found.length
        ? Array.from(
              find("mantle.product.quality.QualityInspectionDisposition")
                  .condition(
                      "qualityInspectionId",
                      "in",
                      found.map(row => row.qualityInspectionId)
                  )
                  .list()
          )
        : []
    const decisions = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        dispositions.map(row => row.dispositionEnumId)
    )
    return found.map(row => ({
        qualityInspectionId: row.qualityInspectionId,
        productName: products.get(row.productId) || row.productId || "",
        statusText: statuses.get(row.statusId) || row.statusId,
        resultText: row.resultEnumId ? results.get(row.resultEnumId) || row.resultEnumId : "",
        quantityText: quantityText(row.quantity),
        heldText: quantityText(row.heldQuantity),
        dispositionText: dispositions
            .filter(disposition => disposition.qualityInspectionId === row.qualityInspectionId)
            .map(disposition => (decisions.get(disposition.dispositionEnumId) || "") + " " + quantityText(disposition.quantity))
            .join(", ")
    }))
}
// The items a return may still take: a customer return's invoiced order lines of its customer and vendor
// (find#ReturnableOrderItems), a supplier return's receipts from its supplier (find#ReturnableReceipts); each as a probe, so a
// user who may not read them gets none and the page still shows.
function eligibleRowsOf(header, supplier, userScope) {
    try {
        if (supplier) {
            const found = lib.probe("mantle.order.ReturnServices.find#ReturnableReceipts", {
                vendorPartyId: header.vendorPartyId,
                facilityId: header.facilityId || null
            })
            const products = namesOf(
                "mantle.product.Product",
                "productId",
                "productName",
                Array.from(found.receiptRows || []).map(row => row.productId)
            )
            const lots = namesOf(
                "mantle.product.asset.Lot",
                "lotId",
                "lotNumber",
                Array.from(found.receiptRows || []).map(row => row.lotId)
            )
            return Array.from(found.receiptRows || []).map(row => ({
                key: row.assetReceiptId,
                assetReceiptId: row.assetReceiptId,
                productName: products.get(row.productId) || row.productId,
                sourceText:
                    "Receipt " +
                    row.assetReceiptId +
                    " · order " +
                    row.orderId +
                    (row.lotId ? " · lot " + lots.get(row.lotId) : ""),
                acceptedText: quantityText(row.acceptedQuantity),
                heldText: quantityText(row.quarantinedQuantity),
                returnedText: quantityText(row.returnedQuantity),
                eligibleQuantity: number(row.eligibleQuantity),
                eligibleText:
                    quantityText(row.eligibleQuantity) +
                    (number(row.issuableQuantity) < number(row.eligibleQuantity)
                        ? " (" + quantityText(row.issuableQuantity) + " on hand)"
                        : ""),
                receivedText: row.receivedText
            }))
        }
        const found = lib.probe("mantle.order.ReturnServices.find#ReturnableOrderItems", {
            returnId: header.returnId,
            lookBackDays: 365
        })
        const items = Array.from(found.orderItemInfoList || []).filter(row => row.isProductItemType && row.isShippable)
        const products = namesOf(
            "mantle.product.Product",
            "productId",
            "productName",
            items.map(row => row.productId)
        )
        return items.map(row => ({
            key: row.orderId + ":" + row.orderItemSeqId,
            orderId: row.orderId,
            orderItemSeqId: row.orderItemSeqId,
            productName: products.get(row.productId) || row.productId,
            sourceText: "Order " + row.orderId + " line " + row.orderItemSeqId,
            acceptedText: quantityText(row.invoiceQuantity),
            heldText: "",
            returnedText: quantityText(row.returnedQuantity),
            eligibleQuantity: number(row.returnableQuantity),
            eligibleText: quantityText(row.returnableQuantity),
            receivedText: ""
        }))
    } catch (error) {
        ec.logger.info("Eligible items of return " + header.returnId + ": " + error.message)
        return []
    }
}
function returnDetail(p) {
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "return", p.returnId)
    const header = one("mantle.order.return.ReturnHeader", {returnId: p.returnId})
    const internal = internalOrganizations(userScope)
    const supplier =
        isSupplierReturn(header, internal) ||
        !!one("mantle.party.PartyRole", {partyId: header.customerPartyId, roleTypeId: "OrgInternal"})
    const partyId = supplier ? header.vendorPartyId : header.customerPartyId
    const names = lib.partyNames([partyId, supplier ? header.customerPartyId : header.vendorPartyId])
    const facility = header.facilityId ? one("mantle.facility.Facility", {facilityId: header.facilityId}) : null
    const can = userScope.capabilities
    const items = rows("mantle.order.return.ReturnItem", {returnId: header.returnId})
        .filter(item => !item.parentItemSeqId && item.productId)
        .sort((a, b) => String(a.returnItemSeqId).localeCompare(String(b.returnItemSeqId)))
    const receipts = rows("mantle.product.receipt.AssetReceipt", {returnId: header.returnId})
    const sources = rows("mantle.shipment.ShipmentItemSource", {returnId: header.returnId}).filter(
        r => r.statusId !== "SisCancelled"
    )
    const issuances = sources.length
        ? Array.from(
              find("mantle.product.issuance.AssetIssuance")
                  .condition(
                      "shipmentItemSourceId",
                      "in",
                      sources.map(row => row.shipmentItemSourceId)
                  )
                  .list()
          )
        : []
    const billings = rows("mantle.order.return.ReturnItemBilling", {returnId: header.returnId})
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        items.map(row => row.productId)
    )
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        items.map(row => row.statusId).concat([header.statusId])
    )
    const reasons = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        items.flatMap(r => [r.returnReasonEnumId, r.returnResponseEnumId])
    )
    const financial = !!can.financialRead
    const itemRows = items.map(item => {
        const mine = receipts.filter(row => row.returnItemSeqId === item.returnItemSeqId)
        const mySources = sources.filter(row => row.returnItemSeqId === item.returnItemSeqId).map(row => row.shipmentItemSourceId)
        const sent = issuances.filter(row => mySources.includes(row.shipmentItemSourceId))
        const myBillings = billings.filter(row => row.returnItemSeqId === item.returnItemSeqId)
        const settled = sumOf(myBillings, "quantity") + number(item.replacedQuantity)
        const credited = myBillings.reduce((total, row) => total + number(row.quantity) * number(row.amount), 0)
        return {
            returnItemSeqId: item.returnItemSeqId,
            productId: item.productId,
            productName: products.get(item.productId) || item.description || item.productId,
            sourceText: supplier
                ? item.assetReceiptId
                    ? "Receipt " + item.assetReceiptId + (item.assetId ? " · stock " + item.assetId : "")
                    : item.orderId
                      ? "Order " + item.orderId + ":" + item.orderItemSeqId
                      : ""
                : item.orderId
                  ? "Order " + item.orderId + ":" + item.orderItemSeqId
                  : "",
            reasonText: reasons.get(item.returnReasonEnumId) || "",
            responseText: reasons.get(item.returnResponseEnumId) || "",
            statusText: statuses.get(item.statusId) || item.statusId,
            authorizedQuantity: number(item.returnQuantity),
            handledQuantity: supplier ? sumOf(sent, "quantity") : number(item.receivedQuantity),
            acceptedQuantity: sumOf(mine, "quantityAccepted"),
            rejectedQuantity: sumOf(mine, "quantityRejected"),
            settledQuantity: settled,
            creditedText: financial && myBillings.length ? ec.l10n.formatCurrency(credited, header.currencyUomId) : ""
        }
    })
    // the shipments of the return: a customer return's receipt, a supplier return's shipment
    const shipmentIds = unique(sources.map(row => row.shipmentId))
    const shipments = shipmentIds.length
        ? Array.from(find("mantle.shipment.Shipment").condition("shipmentId", "in", shipmentIds).orderBy("shipmentId").list())
        : []
    const shipmentStatuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        shipments.map(row => row.statusId)
    )
    const shipmentRows = shipments.map(row => {
        const mine = sources.filter(source => source.shipmentId === row.shipmentId)
        const handled = supplier
            ? sumOf(
                  issuances.filter(issuance =>
                      mine.some(source => source.shipmentItemSourceId === issuance.shipmentItemSourceId)
                  ),
                  "quantity"
              )
            : sumOf(
                  receipts.filter(receipt => receipt.shipmentId === row.shipmentId),
                  "quantityAccepted"
              ) +
              sumOf(
                  receipts.filter(receipt => receipt.shipmentId === row.shipmentId),
                  "quantityRejected"
              )
        return {
            shipmentId: row.shipmentId,
            kindText: row.shipmentTypeEnumId === "ShpTpPurchaseReturn" ? "Supplier return shipment" : "Return receipt",
            linkPath:
                row.shipmentTypeEnumId === "ShpTpPurchaseReturn" ? "Returns/SupplierReturnShipment" : "Returns/ReturnReceipt",
            statusText: shipmentStatuses.get(row.statusId) || row.statusId,
            progressText:
                (supplier ? "Sent " : "Received ") + quantityText(handled) + " of " + quantityText(sumOf(mine, "quantity"))
        }
    })
    const receiptIds = unique(items.map(row => row.assetReceiptId))
    const inspectionFind = find("mantle.product.quality.QualityInspection").condition(
        receiptIds.length
            ? cf().makeCondition(
                  [
                      cf().makeCondition("returnId", "equals", header.returnId),
                      cf().makeCondition("assetReceiptId", "in", receiptIds)
                  ],
                  "or"
              )
            : cf().makeCondition("returnId", "equals", header.returnId)
    )
    const open = ["ReturnCreated", "ReturnRequested"].includes(header.statusId)
    const canAddItems = open && (supplier ? !!can.qualityDispose : !!can.receive)
    const openShipment = shipments.find(row => !["ShipDelivered", "ShipCancelled", "ShipShipped"].includes(row.statusId))
    const settlement = supplier ? null : settlementOf(header.returnId)
    const receiveBlocked =
        settlement && !settlement.settlementRequired
            ? (lib.partyNames([settlement.organizationPartyId])[settlement.organizationPartyId] || "This organization") +
              " does not settle returns separately: its returns are received when the shipment is delivered, so Warehouse" +
              " does not receive this one"
            : ""
    return {
        returnFound: true,
        returnId: header.returnId,
        returnHeader: {
            returnId: header.returnId,
            supplierReturn: supplier,
            directionText: supplier ? "Supplier return" : "Customer return",
            partyId,
            partyName: names[partyId] || partyId || "",
            organizationName: names[supplier ? header.customerPartyId : header.vendorPartyId] || "",
            facilityId: header.facilityId || null,
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            statusId: header.statusId,
            statusText: statuses.get(header.statusId) || header.statusId,
            statusColor: statusColors[header.statusId] || "grey",
            entryText: dateText(header.entryDate),
            reference: header.displayId || "",
            authorizedQuantity: sumOf(itemRows, "authorizedQuantity"),
            handledQuantity: sumOf(itemRows, "handledQuantity"),
            settledQuantity: sumOf(itemRows, "settledQuantity"),
            settlementText:
                billings.length || itemRows.some(row => row.settledQuantity)
                    ? "Settled " + quantityText(sumOf(itemRows, "settledQuantity")) + " by Accounting"
                    : "Not settled: Accounting settles after inspection",
            openShipmentId: openShipment?.shipmentId || null,
            openShipmentPath: openShipment ? (supplier ? "Returns/SupplierReturnShipment" : "Returns/ReturnReceipt") : null,
            receiveBlockedText: receiveBlocked,
            canAddItems,
            canRequest:
                header.statusId === "ReturnCreated" && items.length > 0 && (supplier ? !!can.qualityDispose : !!can.receive),
            canCreateShipment: header.statusId === "ReturnApproved" && !shipments.length && (can.receive || can.qualityDispose),
            financialRead: financial
        },
        itemRows,
        shipmentRows,
        inspectionRows: inspectionRows(inspectionFind),
        eligibleRows: canAddItems ? eligibleRowsOf(header, supplier, userScope) : []
    }
}

// ===== a return's shipment (ReturnReceipt, SupplierReturnShipment) =====
// For a shipment of another type: returnShipmentFound false, so Shared/ShipmentDetail shows its receipt or outbound branch.
function returnShipment(p) {
    const shipment = p.shipmentId ? one("mantle.shipment.Shipment", {shipmentId: p.shipmentId}) : null
    if (!shipment || !["ShpTpSalesReturn", "ShpTpPurchaseReturn"].includes(shipment.shipmentTypeEnumId))
        return {returnShipmentFound: false}
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "shipment", shipment.shipmentId)
    const supplier = shipment.shipmentTypeEnumId === "ShpTpPurchaseReturn"
    const segments = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: shipment.shipmentId}).sort((a, b) =>
        String(a.shipmentRouteSegmentSeqId).localeCompare(String(b.shipmentRouteSegmentSeqId))
    )
    const facilityId = supplier
        ? segments.find(row => row.originFacilityId)?.originFacilityId
        : [...segments].reverse().find(row => row.destinationFacilityId)?.destinationFacilityId
    const facility = facilityId ? one("mantle.facility.Facility", {facilityId}) : null
    if (!warehouse.inScope(userScope, facility))
        denied(
            "RECORD_UNAVAILABLE",
            "Shipment " + shipment.shipmentId + " is not " + (supplier ? "sent from" : "received at") + " your facilities"
        )
    const can = userScope.capabilities
    const sources = rows("mantle.shipment.ShipmentItemSource", {shipmentId: shipment.shipmentId})
        .filter(row => row.statusId !== "SisCancelled" && row.returnId)
        .sort((a, b) => String(a.shipmentItemSourceId).localeCompare(String(b.shipmentItemSourceId)))
    const returnIds = unique(sources.map(row => row.returnId))
    const items = returnIds.length
        ? Array.from(find("mantle.order.return.ReturnItem").condition("returnId", "in", returnIds).list())
        : []
    const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId: shipment.shipmentId}).sort(
        (a, b) => lib.ms(a.receivedDate) - lib.ms(b.receivedDate) || String(a.assetReceiptId).localeCompare(b.assetReceiptId)
    )
    const issuances = rows("mantle.product.issuance.AssetIssuance", {shipmentId: shipment.shipmentId})
    const assetIds = unique(
        receipts
            .map(row => row.assetId)
            .concat(
                issuances.map(row => row.assetId),
                items.map(row => row.assetId)
            )
    )
    const assets = new Map(
        assetIds.length
            ? Array.from(find("mantle.product.asset.Asset").condition("assetId", "in", assetIds).list()).map(row => [
                  row.assetId,
                  row
              ])
            : []
    )
    const lots = namesOf(
        "mantle.product.asset.Lot",
        "lotId",
        "lotNumber",
        [...assets.values()].map(row => row.lotId)
    )
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        sources.map(row => row.productId)
    )
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        [shipment.statusId].concat(
            [...assets.values()].map(row => row.statusId),
            items.map(row => row.statusId)
        )
    )
    const reasons = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        receipts.map(row => row.rejectionReasonEnumId)
    )
    const users = namesOf(
        "moqui.security.UserAccount",
        "userId",
        "username",
        receipts.map(row => row.receivedByUserId)
    )
    const identity = asset =>
        [
            asset?.serialNumber ? "Serial " + asset.serialNumber : "",
            asset?.lotId ? "Lot " + (lots.get(asset.lotId) || asset.lotId) : ""
        ]
            .filter(Boolean)
            .join(" · ")
    const open = supplier
        ? ["ShipInput", "ShipScheduled", "ShipPicked"].includes(shipment.statusId)
        : !["ShipDelivered", "ShipCancelled"].includes(shipment.statusId)
    // a customer return is received here only when its organization settles returns separately (D11); otherwise Mantle
    // receives it when the shipment is delivered, and Warehouse has no receipt for it (§5) (P14 review B2)
    const settlement = !supplier && returnIds.length ? settlementOf(returnIds[0]) : null
    const receiveBlockedText =
        settlement && !settlement.settlementRequired
            ? (lib.partyNames([settlement.organizationPartyId])[settlement.organizationPartyId] || "This organization") +
              " does not settle returns separately: its returns are received when the shipment is delivered, so there is no" +
              " Receive here"
            : ""
    // a supplier return item that names no stock: the product's stock at the facility the return ships from (P14 review B4)
    const returnHeaders = new Map(
        returnIds.length
            ? Array.from(find("mantle.order.return.ReturnHeader").condition("returnId", "in", returnIds).list()).map(r => [
                  r.returnId,
                  r
              ])
            : []
    )
    const stockOptions = (productId, ownerPartyId) =>
        Array.from(
            find("mantle.product.asset.Asset", {productId, facilityId: facility.facilityId, ownerPartyId})
                .condition("statusId", "in", ["AstAvailable", "AstOnHold", "AstQuarantine"])
                .condition("quantityOnHandTotal", "greater", 0)
                .orderBy("assetId")
                .limit(20)
                .list()
        ).map(row => ({
            assetId: row.assetId,
            label: [
                row.assetId,
                row.locationSeqId ? "at " + row.locationSeqId : "",
                statusTextOf(row.statusId),
                quantityText(row.quantityOnHandTotal) + " on hand"
            ]
                .filter(Boolean)
                .join(" · ")
        }))
    const lineRows = sources.map(source => {
        const item = items.find(row => row.returnId === source.returnId && row.returnItemSeqId === source.returnItemSeqId) || {}
        const assetOptions =
            supplier && !item.assetId ? stockOptions(source.productId, returnHeaders.get(source.returnId)?.customerPartyId) : []
        const mine = receipts.filter(row => row.shipmentItemSourceId === source.shipmentItemSourceId)
        const sent = sumOf(
            issuances.filter(row => row.shipmentItemSourceId === source.shipmentItemSourceId),
            "quantity"
        )
        const handled = supplier ? sent : sumOf(mine, "quantityAccepted") + sumOf(mine, "quantityRejected")
        const remaining = Math.max(0, number(source.quantity) - handled)
        const stock = item.assetId ? assets.get(item.assetId) : null
        return {
            key: source.returnId + ":" + source.returnItemSeqId,
            returnId: source.returnId,
            returnItemSeqId: source.returnItemSeqId,
            productId: source.productId,
            productName: products.get(source.productId) || source.productId,
            itemText: "Return " + source.returnId + " item " + source.returnItemSeqId,
            statusText: statuses.get(item.statusId) || item.statusId || "",
            authorizedQuantity: number(item.returnQuantity),
            quantity: number(source.quantity),
            acceptedQuantity: sumOf(mine, "quantityAccepted"),
            rejectedQuantity: sumOf(mine, "quantityRejected"),
            sentQuantity: sent,
            remainingQuantity: remaining,
            assetId: item.assetId || null,
            stockText: stock
                ? [
                      stock.assetId,
                      identity(stock),
                      stock.locationSeqId ? "at " + stock.locationSeqId : "",
                      statuses.get(stock.statusId) || stock.statusId,
                      quantityText(stock.quantityOnHandTotal) + " on hand"
                  ]
                      .filter(Boolean)
                      .join(" · ")
                : "",
            sourceText: item.assetReceiptId ? "Receipt " + item.assetReceiptId : item.orderId ? "Order " + item.orderId : "",
            canReceive: !supplier && open && !!can.receive && remaining > 0 && !receiveBlockedText,
            assetOptions,
            issueBlockedText:
                supplier && !item.assetId && !assetOptions.length && remaining > 0
                    ? "No stock of this product at " + (facility.facilityName || facility.facilityId) + " to send back"
                    : "",
            canIssue:
                supplier &&
                open &&
                (!!can.qualityDispose || !!can.issue) &&
                remaining > 0 &&
                item.statusId === "ReturnApproved" &&
                (!!item.assetId || assetOptions.length > 0)
        }
    })
    const receiptRows = receipts.map(row => {
        const asset = row.assetId ? assets.get(row.assetId) : null
        return {
            assetReceiptId: row.assetReceiptId,
            receivedText: dateText(row.receivedDate),
            receivedBy: users.get(row.receivedByUserId) || row.receivedByUserId || "",
            productName: products.get(row.productId) || row.productId || "",
            itemText: row.returnId ? row.returnId + ":" + row.returnItemSeqId : "",
            assetId: row.assetId || null,
            identityText: identity(asset),
            placeText: asset?.locationSeqId || "",
            statusText: asset ? statuses.get(asset.statusId) || asset.statusId : "No stock",
            acceptedQuantity: number(row.quantityAccepted),
            rejectedQuantity: number(row.quantityRejected),
            rejectionText: number(row.quantityRejected) ? reasons.get(row.rejectionReasonEnumId) || "Rejected" : ""
        }
    })
    const issuanceRows = issuances
        .sort((a, b) => lib.ms(a.issuedDate) - lib.ms(b.issuedDate))
        .map(row => {
            const asset = assets.get(row.assetId)
            return {
                assetIssuanceId: row.assetIssuanceId,
                issuedText: dateText(row.issuedDate),
                productName: products.get(row.productId) || row.productId || "",
                assetId: row.assetId,
                identityText: identity(asset),
                placeText: asset?.locationSeqId || "",
                quantity: number(row.quantity)
            }
        })
    const receiptIds = receipts.map(row => row.assetReceiptId).concat(unique(items.map(row => row.assetReceiptId)))
    const inspectionFind = find("mantle.product.quality.QualityInspection").condition(
        receiptIds.length
            ? cf().makeCondition(
                  [
                      cf().makeCondition("shipmentId", "equals", shipment.shipmentId),
                      cf().makeCondition("assetReceiptId", "in", receiptIds)
                  ],
                  "or"
              )
            : cf().makeCondition("shipmentId", "equals", shipment.shipmentId)
    )
    const packageRows = rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId: shipment.shipmentId}).map(row => ({
        shipmentPackageSeqId: row.shipmentPackageSeqId,
        shipmentRouteSegmentSeqId: row.shipmentRouteSegmentSeqId,
        trackingCode: row.trackingCode || row.returnTrackingCode || "",
        labelText: row.labelUrl || row.labelDate ? "Label " + (dateText(row.labelDate) || "ready") : "No label yet"
    }))
    const names = lib.partyNames([shipment.fromPartyId, shipment.toPartyId])
    const remaining = lineRows.reduce((total, row) => total + row.remainingQuantity, 0)
    const billed = returnIds.length
        ? sumOf(
              Array.from(find("mantle.order.return.ReturnItemBilling").condition("returnId", "in", returnIds).list()),
              "quantity"
          )
        : 0
    return {
        returnShipmentFound: true,
        shipmentId: shipment.shipmentId,
        returnShipment: {
            shipmentId: shipment.shipmentId,
            supplierReturn: supplier,
            kindText: supplier ? "Supplier return" : "Return receipt",
            partyName: supplier
                ? names[shipment.toPartyId] || shipment.toPartyId
                : names[shipment.fromPartyId] || shipment.fromPartyId,
            facilityId: facility.facilityId,
            facilityName: facility.facilityName || facility.facilityId,
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            statusColor: shipmentColors[shipment.statusId] || (shipment.statusId === "ShipCancelled" ? "negative" : "positive"),
            returnIds,
            open,
            remainingQuantity: remaining,
            receivedAny: receipts.length > 0,
            sentAny: issuances.length > 0,
            canReceive: lineRows.some(row => row.canReceive),
            receiveBlockedText,
            canIssue: lineRows.some(row => row.canIssue),
            canShip:
                supplier &&
                !!can.ship &&
                issuances.length > 0 &&
                remaining === 0 &&
                ["ShipInput", "ShipScheduled", "ShipPicked", "ShipPacked"].includes(shipment.statusId),
            creditText: billed ? "Settled " + quantityText(billed) + " by Accounting" : "Not settled yet",
            printedText: dateText(ec.user.nowTimestamp)
        },
        returnLineRows: lineRows,
        returnReceiptRows: receiptRows,
        issuanceRows,
        returnInspectionRows: inspectionRows(inspectionFind),
        packageRows
    }
}

// ===== drop-downs =====
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim()
    const selected = p.selected ? String(p.selected) : null
    const internal = internalOrganizations(userScope)
    const enumOptions = enumTypeId =>
        Array.from(find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum,description").list()).map(row => ({
            value: row.enumId,
            label: row.description
        }))
    const sources = {
        // sales order parts of the user's organizations, approved or complete: value orderId:orderPartSeqId
        salesOrders() {
            let query = find("mantle.order.OrderPart").condition("statusId", "in", [
                "OrderApproved",
                "OrderSent",
                "OrderCompleted"
            ])
            query = query.condition("vendorPartyId", "in", internal.length ? internal : ["_none_"])
            if (term) query = query.condition(cf().makeCondition("orderId", "like", like(term)).ignoreCase())
            const found = Array.from(query.orderBy("-orderId,orderPartSeqId").limit(choiceLimit).list())
            const names = lib.partyNames(found.map(part => part.customerPartyId))
            const options = found.map(part => ({
                value: part.orderId + ":" + part.orderPartSeqId,
                label:
                    "Order " +
                    part.orderId +
                    " · part " +
                    part.orderPartSeqId +
                    " · " +
                    (names[part.customerPartyId] || part.customerPartyId)
            }))
            if (selected && !options.some(option => option.value === selected))
                options.unshift({value: selected, label: selected})
            return options
        },
        suppliers() {
            let query = find("mantle.party.PartyDetailAndRole", {roleTypeId: "Supplier"})
            if (term) query = query.condition(cf().makeCondition("organizationName", "like", like(term)).ignoreCase())
            const options = Array.from(query.orderBy("organizationName").limit(choiceLimit).list())
                .filter(row => !row.privateOwnerUserId || row.privateOwnerUserId === ec.user.userId)
                .map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
            if (selected && !options.some(option => option.value === selected))
                options.unshift({value: selected, label: lib.partyNames([selected])[selected] || selected})
            return options
        },
        // the open quarantine locations of a facility of the user's
        quarantineLocations() {
            const facility = p.facilityId ? one("mantle.facility.Facility", {facilityId: p.facilityId}) : null
            if (!warehouse.inScope(userScope, facility)) return []
            return Array.from(
                find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId, locationTypeEnumId: "FltQuarantine"})
                    .orderBy("sequenceNum,locationSeqId")
                    .list()
            )
                .filter(row => !row.thruDate || lib.ms(row.thruDate) > lib.ms(ec.user.nowTimestamp))
                .map(row => ({
                    value: row.locationSeqId,
                    label: row.locationSeqId + (row.description ? " · " + row.description : "")
                }))
        },
        returnReasons: () => enumOptions("ReturnReason"),
        returnResponses: () => enumOptions("ReturnResponse").filter(option => option.value !== "RrspManual"),
        rejectionReasons: () => enumOptions("RejectionReason")
    }
    if (!sources[p.choice]) throw new Error("Unknown Warehouse return choice " + p.choice)
    return {resultList: sources[p.choice]()}
}

// ===== Home's returns queue =====
// Ready: return shipments to receive or send at the facility (approved, not yet delivered or shipped); waiting: returns
// created or requested there, waiting for authorization.
function returnQueue(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = p.facilityId ? one("mantle.facility.Facility", {facilityId: p.facilityId}) : null
    if (!warehouse.inScope(userScope, facility)) return {readyCount: null, waitingCount: null}
    const readyCount = find("mantle.order.return.ReturnHeader", {facilityId: facility.facilityId})
        .condition("statusId", "in", ["ReturnApproved"])
        .count()
    const waitingCount = find("mantle.order.return.ReturnHeader", {facilityId: facility.facilityId})
        .condition("statusId", "in", ["ReturnCreated", "ReturnRequested"])
        .count()
    return {readyCount, waitingCount}
}

const operations = {returns, returnDetail, returnShipment, choices, returnQueue}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse return operation " + op)
        return operations[op](parameters)
    }
})
