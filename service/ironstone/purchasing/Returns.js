// Purchasing's supplier return reads (design-purchasing §9 Returns and ReturnDetail; impl-purchasing P8, §2): ReturnFind and
// SupplierReturnList (the supplier returns of the buying organizations, with the authorization, physical and credit or
// replacement states apart), OrderDetail's Returns and Supplier360's Returns (the same list for one order or supplier), the
// Purchasing context of Shared/ReturnDetail (crosscut §3.18 Purchasing row: authorization and RMA, the source receipts and
// lots, the outbound shipment, the replacement and the credit read only), the supplier return authorization print, and the
// drop-downs of NewSupplierReturn (the orders a supplier return may come from, their eligible receipts by receipt and lot).
// The writes are Mantle's: create#ReturnFromOrder and add#ReceiptToReturn (Warehouse P14's eligibility), authorize#SupplierReturn
// and create#ReplacementOrder (P8), which the screens call after AccessServices.check#Record; Warehouse ships the return
// (ship#SupplierReturn) and Accounting settles its billed part (settle#Return). A credit's amount shows to a finance reader
// only (ACCOUNTING_VIEW or PAYABLE_VIEW), "Withheld" to anyone else, never zero (§2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, denied} = lib

const HEADER = "mantle.order.return.ReturnHeader",
    ITEM = "mantle.order.return.ReturnItem"
const choiceLimit = 30
const withheld = "Withheld"
const openStatuses = ["ReturnCreated", "ReturnRequested"]
const authorizedStatuses = ["ReturnApproved", "ReturnShipped", "ReturnReceived", "ReturnManResp"]
const returnableOrderStatuses = ["OrderApproved", "OrderSent", "OrderProcessing", "OrderCompleted"]
const views = {
    open: {label: "Open", statuses: openStatuses.concat(authorizedStatuses)},
    authorize: {label: "To authorize", statuses: openStatuses},
    dispatch: {label: "To dispatch", statuses: ["ReturnApproved"]},
    settle: {label: "Awaiting credit or replacement", statuses: ["ReturnShipped", "ReturnReceived", "ReturnManResp"]},
    completed: {label: "Completed", statuses: ["ReturnCompleted"]},
    cancelled: {label: "Cancelled", statuses: ["ReturnCancelled"]}
}
const statusColors = {
    ReturnCreated: "grey-8",
    ReturnRequested: "warning",
    ReturnApproved: "primary",
    ReturnShipped: "info",
    ReturnReceived: "info",
    ReturnManResp: "warning",
    ReturnCompleted: "positive",
    ReturnCancelled: "grey-8"
}
const blank = value => value == null || String(value).trim() === ""
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const sumOf = (list, field) => list.reduce((total, row) => total + number(row[field]), 0)
const financeReader = can => !!(can.financialRead || can.payableRead)
const money = (value, currencyUomId) => ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)
const internalIds = () => rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
function namesOf(entity, field, nameField, values) {
    const wanted = unique(values)
    if (!wanted.length) return new Map()
    return new Map(
        Array.from(find(entity).condition(field, "in", wanted).list()).map(row => [row[field], row[nameField] || row[field]])
    )
}
const statusNames = ids => namesOf("moqui.basic.StatusItem", "statusId", "description", ids)
const enumNames = ids => namesOf("moqui.basic.Enumeration", "enumId", "description", ids)
function buyersFor(userScope, organizationPartyId) {
    if (blank(organizationPartyId)) return userScope.ownerIds || internalIds()
    if (!purchasing.owns(userScope, organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
    return [String(organizationPartyId)]
}

// ===== progress =====
// Each return's items with what was authorized, sent back (issued to its sources), credited (billing links of credits not
// cancelled, with their amount) and replaced, and its shipments and replacement orders, read together.
function progressOf(returnIds) {
    const progress = new Map(
        returnIds.map(id => [
            id,
            {items: [], sent: 0, credited: 0, creditAmount: 0, replaced: 0, orderIds: new Set(), shipments: [], replacements: []}
        ])
    )
    if (!returnIds.length) return progress
    const items = Array.from(find(ITEM).condition("returnId", "in", returnIds).list()).filter(
        item => !item.parentItemSeqId && item.productId && item.statusId !== "ReturnCancelled"
    )
    for (const item of items) {
        const row = progress.get(item.returnId)
        row.items.push(item)
        row.replaced += number(item.replacedQuantity)
        if (item.orderId) row.orderIds.add(item.orderId)
        if (item.replacementOrderId && !row.replacements.includes(item.replacementOrderId))
            row.replacements.push(item.replacementOrderId)
    }
    const billings = Array.from(find("mantle.order.return.ReturnItemBilling").condition("returnId", "in", returnIds).list())
    const invoiceIds = unique(billings.map(row => row.invoiceId))
    const cancelled = new Set(
        invoiceIds.length
            ? Array.from(
                  find("mantle.account.invoice.Invoice")
                      .condition("invoiceId", "in", invoiceIds)
                      .condition("statusId", "InvoiceCancelled")
                      .list()
              ).map(row => row.invoiceId)
            : []
    )
    for (const billing of billings.filter(row => !cancelled.has(row.invoiceId))) {
        const row = progress.get(billing.returnId)
        row.credited += number(billing.quantity)
        row.creditAmount += number(billing.quantity) * number(billing.amount)
    }
    const sources = Array.from(find("mantle.shipment.ShipmentItemSource").condition("returnId", "in", returnIds).list())
    const sourceReturn = new Map(sources.map(row => [row.shipmentItemSourceId, row.returnId]))
    if (sources.length)
        for (const issuance of Array.from(
            find("mantle.product.issuance.AssetIssuance")
                .condition("shipmentItemSourceId", "in", [...sourceReturn.keys()])
                .list()
        ))
            progress.get(sourceReturn.get(issuance.shipmentItemSourceId)).sent += number(issuance.quantity)
    const shipmentIds = unique(sources.map(row => row.shipmentId))
    const shipments = shipmentIds.length
        ? Array.from(find("mantle.shipment.Shipment").condition("shipmentId", "in", shipmentIds).list())
        : []
    for (const source of sources) {
        const row = progress.get(source.returnId)
        const shipment = shipments.find(candidate => candidate.shipmentId === source.shipmentId)
        if (shipment && !row.shipments.some(candidate => candidate.shipmentId === shipment.shipmentId))
            row.shipments.push(shipment)
    }
    return progress
}
// The physical state of a supplier return: what its outbound shipment did.
function physicalText(header, row, shipmentStatuses) {
    if (header.statusId === "ReturnCancelled") return "Cancelled"
    if (!row.shipments.length) return openStatuses.includes(header.statusId) ? "Not authorized yet" : "No shipment"
    const shipment = row.shipments[0]
    const authorized = sumOf(row.items, "returnQuantity")
    return (
        (shipmentStatuses.get(shipment.statusId) || shipment.statusId) +
        " · sent " +
        quantityText(row.sent) +
        " of " +
        quantityText(authorized)
    )
}
// The credit and replacement state: what was credited (with its amount for a finance reader) and replaced, and what is left.
function settlementText(header, row, can) {
    const authorized = sumOf(row.items, "returnQuantity")
    const parts = []
    if (row.credited)
        parts.push(
            "Credited " +
                quantityText(row.credited) +
                (financeReader(can) ? " (" + money(row.creditAmount, header.currencyUomId) + ")" : " (amount " + withheld + ")")
        )
    if (row.replaced) parts.push("Replaced " + quantityText(row.replaced))
    const left = authorized - row.credited - row.replaced
    if (header.statusId === "ReturnCompleted") parts.push("Settled")
    else if (left > 0 && !openStatuses.includes(header.statusId) && header.statusId !== "ReturnCancelled")
        parts.push(quantityText(left) + " open")
    return parts.join(" · ") || (openStatuses.includes(header.statusId) ? "" : "Nothing credited yet")
}

// ===== ReturnFind and SupplierReturnList; OrderDetail's and Supplier360's returns =====
function findSupplierReturns(p) {
    const userScope = purchasing.required()
    const can = userScope.capabilities
    if (!can.listRead) denied("PERMISSION_DENIED", "Supplier returns are not available")
    if (!blank(p.orderId)) purchasing.recordOf(userScope, "order", String(p.orderId))
    if (!blank(p.vendorPartyId) && !purchasing.supplierOf(userScope, String(p.vendorPartyId)))
        denied("RECORD_UNAVAILABLE", "Supplier " + p.vendorPartyId + " is not available")
    const buyers = buyersFor(userScope, p.organizationPartyId)
    const view = Object.hasOwn(views, p.view || "") ? views[p.view] : null
    const factory = ec.entity.conditionFactory
    // a return of an order or receipt: its items name them
    let sourceIds = null
    const itemKey = !blank(p.assetReceiptId)
        ? {assetReceiptId: String(p.assetReceiptId)}
        : !blank(p.orderId)
          ? {orderId: String(p.orderId)}
          : null
    if (itemKey) sourceIds = unique(rows(ITEM, itemKey).map(row => row.returnId))
    const build = () => {
        let query = find(HEADER)
            .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
            .condition("vendorPartyId", "not-in", internalIds())
        if (view) query = query.condition("statusId", "in", view.statuses)
        if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
        if (!blank(p.vendorPartyId)) query = query.condition("vendorPartyId", String(p.vendorPartyId))
        if (sourceIds) query = query.condition("returnId", "in", sourceIds.length ? sourceIds : ["_NA_"])
        if (!blank(p.text))
            query = query.condition(
                factory.makeCondition(
                    ["returnId", "supplierRmaId", "displayId"].map(field =>
                        factory.makeCondition(field, "like", likeText(String(p.text).trim())).ignoreCase()
                    ),
                    "or"
                )
            )
        return query
    }
    const paged = lib.page(build().orderBy("-entryDate").orderBy("-returnId"), p, "returnRows", build().count())
    const headers = Array.from(paged.rows)
    const progress = progressOf(headers.map(row => row.returnId))
    const parties = lib.partyNames(headers.flatMap(row => [row.vendorPartyId, row.customerPartyId]))
    const statuses = statusNames(
        headers
            .map(row => row.statusId)
            .concat([...progress.values()].flatMap(row => row.shipments.map(shipment => shipment.statusId)))
    )
    const returnRows = headers.map(header => {
        const row = progress.get(header.returnId)
        return {
            returnId: header.returnId,
            supplierRmaId: header.supplierRmaId || "",
            displayId: header.displayId || "",
            vendorPartyId: header.vendorPartyId,
            supplierName: parties[header.vendorPartyId] || header.vendorPartyId,
            organizationName: parties[header.customerPartyId] || header.customerPartyId,
            orderText: [...row.orderIds].join(", "),
            statusId: header.statusId,
            statusText: statuses.get(header.statusId) || header.statusId,
            statusColor: statusColors[header.statusId] || "grey-8",
            entryText: lib.dateText(header.entryDate),
            authorizedText: quantityText(sumOf(row.items, "returnQuantity")),
            sentText: quantityText(row.sent),
            physicalText: physicalText(header, row, statuses),
            settlementText: settlementText(header, row, can),
            replacementText: row.replacements.join(", ")
        }
    })
    const result = Object.assign({}, paged, {returnRows, viewLabel: view ? view.label : "All"})
    delete result.rows
    return result
}

// ===== ReturnDetail's Purchasing context =====
// The receipts the return may still take from its supplier, by receipt and lot (find#ReturnableReceipts), as a probe so a
// user who may not read them gets none and the page still shows.
function eligibleRowsOf(header) {
    try {
        const found = lib.probe("mantle.order.ReturnServices.find#ReturnableReceipts", {
            vendorPartyId: header.vendorPartyId,
            facilityId: header.facilityId || null
        })
        const receiptRows = Array.from(found.receiptRows || []).filter(row => row.organizationPartyId === header.customerPartyId)
        const products = namesOf(
            "mantle.product.Product",
            "productId",
            "productName",
            receiptRows.map(row => row.productId)
        )
        const lots = namesOf(
            "mantle.product.asset.Lot",
            "lotId",
            "lotNumber",
            receiptRows.map(row => row.lotId)
        )
        return receiptRows.map(row => ({
            assetReceiptId: row.assetReceiptId,
            orderId: row.orderId,
            productName: products.get(row.productId) || row.productId,
            sourceText: "Receipt " + row.assetReceiptId + " · order " + row.orderId,
            lotText: row.lotId ? lots.get(row.lotId) || row.lotId : "",
            receivedText: row.receivedText || "",
            acceptedText: quantityText(row.acceptedQuantity),
            heldText: quantityText(row.quarantinedQuantity),
            returnedText: quantityText(row.returnedQuantity),
            eligibleQuantity: number(row.eligibleQuantity),
            eligibleText:
                quantityText(row.eligibleQuantity) +
                (number(row.issuableQuantity) < number(row.eligibleQuantity)
                    ? " (" + quantityText(row.issuableQuantity) + " on hand)"
                    : "")
        }))
    } catch (error) {
        ec.logger.info("Eligible receipts of supplier return " + header.returnId + ": " + error.message)
        return []
    }
}
// The settlement Accounting would make now, for a finance reader (preview#ReturnSettlement, read only): per item what is
// billed, what credit it is eligible for and what needs none (unbilled); null for anyone else or when it is refused.
function settlementPreview(returnId, can) {
    if (!financeReader(can)) return null
    try {
        return lib.probe("mantle.order.ReturnServices.preview#ReturnSettlement", {returnId})
    } catch (error) {
        ec.logger.info("Settlement preview of supplier return " + returnId + ": " + error.message)
        return null
    }
}
function returnDetail(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "supplierReturn", p.returnId)
    const can = userScope.capabilities
    const header = one(HEADER, {returnId: record.recordId})
    const progress = progressOf([header.returnId]).get(header.returnId)
    const items = progress.items.sort((a, b) => String(a.returnItemSeqId).localeCompare(String(b.returnItemSeqId)))
    const parties = lib.partyNames([header.vendorPartyId, header.customerPartyId])
    const facility = header.facilityId ? one("mantle.facility.Facility", {facilityId: header.facilityId}) : null
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        items.map(row => row.productId)
    )
    const receipts = namesOf(
        "mantle.product.receipt.AssetReceipt",
        "assetReceiptId",
        "assetId",
        items.map(row => row.assetReceiptId)
    )
    const assets = new Map(
        unique(items.map(row => row.assetId).concat([...receipts.values()])).map(assetId => [
            assetId,
            one("mantle.product.asset.Asset", {assetId})
        ])
    )
    const lots = namesOf(
        "mantle.product.asset.Lot",
        "lotId",
        "lotNumber",
        [...assets.values()].map(asset => asset?.lotId)
    )
    const enums = enumNames(items.flatMap(row => [row.returnReasonEnumId, row.returnResponseEnumId]))
    const statuses = statusNames(
        items
            .map(row => row.statusId)
            .concat([header.statusId])
            .concat(progress.shipments.map(row => row.statusId))
    )
    // what each item sent back: the issuances of its sources
    const sources = rows("mantle.shipment.ShipmentItemSource", {returnId: header.returnId})
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
    const finance = financeReader(can)
    const preview = settlementPreview(header.returnId, can)
    const previewItems = new Map(Array.from(preview?.itemRows || []).map(row => [row.returnItemSeqId, row]))
    const itemRows = items.map(item => {
        const mySources = sources.filter(row => row.returnItemSeqId === item.returnItemSeqId).map(row => row.shipmentItemSourceId)
        const sent = sumOf(
            issuances.filter(row => mySources.includes(row.shipmentItemSourceId)),
            "quantity"
        )
        const myBillings = billings.filter(row => row.returnItemSeqId === item.returnItemSeqId)
        const credited = sumOf(myBillings, "quantity")
        const creditAmount = myBillings.reduce((total, row) => total + number(row.quantity) * number(row.amount), 0)
        const asset = assets.get(item.assetId || receipts.get(item.assetReceiptId))
        const open = Math.max(0, number(item.returnQuantity) - credited - number(item.replacedQuantity))
        const planned = previewItems.get(item.returnItemSeqId)
        return {
            returnItemSeqId: item.returnItemSeqId,
            productName: products.get(item.productId) || item.description || item.productId,
            sourceText: [
                item.assetReceiptId ? "Receipt " + item.assetReceiptId : "",
                item.orderId ? "order " + item.orderId + ":" + item.orderItemSeqId : ""
            ]
                .filter(Boolean)
                .join(" · "),
            lotText: asset?.lotId ? lots.get(asset.lotId) || asset.lotId : "",
            reasonText: enums.get(item.returnReasonEnumId) || "",
            responseId: item.returnResponseEnumId,
            responseText: enums.get(item.returnResponseEnumId) || "",
            statusText: statuses.get(item.statusId) || item.statusId,
            authorizedQuantity: number(item.returnQuantity),
            sentQuantity: sent,
            creditedQuantity: credited,
            replacedQuantity: number(item.replacedQuantity),
            openQuantity: open,
            replacementOrderId: item.replacementOrderId || null,
            creditText: !myBillings.length ? "" : finance ? money(creditAmount, header.currencyUomId) : withheld,
            unbilledText: planned ? quantityText(planned.unbilledQuantity) : "",
            canReplace:
                !!can.buy && authorizedStatuses.includes(header.statusId) && open > 0 && item.statusId !== "ReturnCompleted"
        }
    })
    const shipmentRows = progress.shipments.map(shipment => {
        const packages = rows("mantle.shipment.ShipmentPackageRouteSeg", {shipmentId: shipment.shipmentId})
        return {
            shipmentId: shipment.shipmentId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            sentText: "Sent " + quantityText(progress.sent) + " of " + quantityText(sumOf(items, "returnQuantity")),
            trackingText: unique(packages.map(row => row.trackingCode)).join(", ") || "",
            shippedText: lib.dateText(shipment.shipDate || shipment.estimatedShipDate)
        }
    })
    const replacementRows = progress.replacements.map(orderId => {
        const order = one("mantle.order.OrderHeader", {orderId})
        const receipt = unique(rows("mantle.shipment.ShipmentItemSource", {orderId}).map(row => row.shipmentId))
            .map(shipmentId => one("mantle.shipment.Shipment", {shipmentId}))
            .find(shipment => shipment && shipment.shipmentTypeEnumId === "ShpTpPurchase")
        const received = sumOf(rows("mantle.product.receipt.AssetReceipt", {orderId}), "quantityAccepted")
        const ordered = sumOf(rows("mantle.order.OrderItem", {orderId}), "quantity")
        return {
            orderId,
            statusText: order ? statusNames([order.statusId]).get(order.statusId) || order.statusId : "",
            receiptId: receipt?.shipmentId || null,
            receiptText: receipt
                ? "Expected receipt " +
                  receipt.shipmentId +
                  " · received " +
                  quantityText(received) +
                  " of " +
                  quantityText(ordered)
                : "No expected receipt",
            replacedText: quantityText(
                sumOf(
                    items.filter(item => item.replacementOrderId === orderId),
                    "replacedQuantity"
                )
            )
        }
    })
    const open = openStatuses.includes(header.statusId)
    const authorized = authorizedStatuses.includes(header.statusId)
    const shipment = progress.shipments[0] || null
    return {
        returnFound: true,
        returnId: header.returnId,
        returnHeader: {
            returnId: header.returnId,
            vendorPartyId: header.vendorPartyId,
            supplierName: parties[header.vendorPartyId] || header.vendorPartyId,
            organizationPartyId: header.customerPartyId,
            organizationName: parties[header.customerPartyId] || header.customerPartyId,
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            statusId: header.statusId,
            statusText: statuses.get(header.statusId) || header.statusId,
            statusColor: statusColors[header.statusId] || "grey-8",
            entryText: lib.dateText(header.entryDate),
            supplierRmaId: header.supplierRmaId || "",
            displayId: header.displayId || "",
            orderIds: [...progress.orderIds],
            authorizedText: quantityText(sumOf(items, "returnQuantity")),
            sentText: quantityText(progress.sent),
            physicalText: physicalText(header, progress, statuses),
            settlementText: settlementText(header, progress, can),
            shipmentId: shipment?.shipmentId || null,
            financeReader: finance,
            creditTotalText: finance && progress.credited ? money(progress.creditAmount, header.currencyUomId) : "",
            previewText: preview
                ? "Accounting may credit " +
                  money(preview.creditTotal, header.currencyUomId) +
                  " now; " +
                  quantityText(
                      Array.from(preview.itemRows || []).reduce((total, row) => total + number(row.unbilledQuantity), 0)
                  ) +
                  " not billed needs no credit"
                : "",
            canAddItems: open && !!can.buy,
            canAuthorize: open && !!can.returnAuthorize && items.length > 0,
            canRecordRma: authorized && !!can.returnAuthorize,
            canCancel: open && !!(can.buy || can.returnAuthorize),
            canReplace: itemRows.some(row => row.canReplace)
        },
        itemRows,
        shipmentRows,
        replacementRows,
        eligibleRows: open && can.buy ? eligibleRowsOf(header) : []
    }
}

// ===== drop-downs =====
// The purchase orders of the user's organizations a supplier return may come from (approved, sent, processing or completed,
// with a receipt), of the supplier when partyId is given.
function orderChoices(userScope, term, selected, p) {
    const factory = ec.entity.conditionFactory
    const buyers = userScope.ownerIds || internalIds()
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internalIds())
        .condition("statusId", "in", returnableOrderStatuses)
        .orderBy("-orderId")
        .limit(choiceLimit * 3)
    if (!blank(p?.partyId)) query = query.condition("vendorPartyId", String(p.partyId))
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["orderId", "orderName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const found = Array.from(query.list()).filter(
        (row, index, list) => list.findIndex(other => other.orderId === row.orderId) === index
    )
    const received = new Set(
        found.length
            ? Array.from(
                  find("mantle.product.receipt.AssetReceipt")
                      .condition(
                          "orderId",
                          "in",
                          found.map(row => row.orderId)
                      )
                      .selectField("orderId")
                      .list()
              ).map(row => row.orderId)
            : []
    )
    const names = lib.partyNames(found.map(row => row.vendorPartyId))
    const options = found
        .filter(row => received.has(row.orderId))
        .slice(0, choiceLimit)
        .map(row => ({
            value: row.orderId,
            label: row.orderId + (row.orderName ? " · " + row.orderName : "") + " · " + (names[row.vendorPartyId] || "")
        }))
    if (selected && !options.some(option => option.value === selected)) {
        try {
            const record = purchasing.recordOf(userScope, "order", selected)
            options.push({value: selected, label: selected + " · " + record.label})
        } catch (error) {
            // not the user's: not offered
        }
    }
    return options
}
// The receipts of an order a supplier return may take now, by receipt and lot with what each still allows
// (find#ReturnableReceipts); none without the order or a user who may not read them.
function receiptChoices(userScope, p) {
    if (blank(p?.orderId)) return []
    try {
        purchasing.recordOf(userScope, "order", String(p.orderId))
        const found = lib.probe("mantle.order.ReturnServices.find#ReturnableReceipts", {orderId: String(p.orderId)})
        const receiptRows = Array.from(found.receiptRows || [])
        const products = namesOf(
            "mantle.product.Product",
            "productId",
            "productName",
            receiptRows.map(row => row.productId)
        )
        const lots = namesOf(
            "mantle.product.asset.Lot",
            "lotId",
            "lotNumber",
            receiptRows.map(row => row.lotId)
        )
        return receiptRows.map(row => ({
            value: row.assetReceiptId,
            label:
                "Receipt " +
                row.assetReceiptId +
                " · " +
                (products.get(row.productId) || row.productId) +
                (row.lotId ? " · lot " + (lots.get(row.lotId) || row.lotId) : "") +
                " · " +
                quantityText(row.eligibleQuantity) +
                " eligible"
        }))
    } catch (error) {
        ec.logger.info("Returnable receipts of order " + p.orderId + ": " + error.message)
        return []
    }
}
const reasonChoices = () =>
    rows("moqui.basic.Enumeration", {enumTypeId: "ReturnReason"})
        .sort((a, b) => number(a.sequenceNum) - number(b.sequenceNum))
        .map(row => ({value: row.enumId, label: row.description || row.enumId}))
// A supplier return asks for a credit (Accounting's settlement) or a replacement (create#ReplacementOrder).
const responseChoices = () =>
    ["RrspCredit", "RrspReplace"].map(enumId => ({
        value: enumId,
        label: one("moqui.basic.Enumeration", {enumId})?.description || enumId
    }))

const operations = {findSupplierReturns, returnDetail}
;({
    orderChoices,
    receiptChoices,
    reasonChoices,
    responseChoices,
    execute: (operation, parameters) => {
        if (!operations[operation]) throw new Error("Unknown Purchasing returns operation " + operation)
        return operations[operation](parameters)
    }
})
