// Purchasing's receiving reads (design-purchasing §9 Receipts, ShipmentDetail, Inspections, QualityInspection,
// InspectionTemplates; impl-purchasing P5): the expected receipts of the user's purchase orders with expected, received,
// accepted, rejected and held quantities apart (Mantle's PurchaseReceipts.js computes them), the purchase inspections, a
// purchase receipt's detail for Shared/ShipmentDetail's Purchasing branch, an inspection's for Shared/QualityInspection, the
// receipt templates for Shared/InspectionTemplates, Home's late count, the late orders of PurchaseOrders' Late view, and the
// receiving drop-downs. Purchasing posts no stock: a receiver's receipt, finish and bill are the Mantle services
// (mantle.shipment.WarehouseTaskServices through the receive guard, mantle.account.InvoiceServices), which check their own
// permission and organization again; an inspector's actions are Warehouse's transitions, offered where Warehouse's scope
// covers the inspection's facility.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const progress = ec.resource.script("component://mr-mantle/service/mantle/order/PurchaseReceipts.js")
const {find, one, rows, denied, call} = lib

const SHIPMENT = "mantle.shipment.Shipment",
    SOURCE = "mantle.shipment.ShipmentItemSource",
    RECEIPT = "mantle.product.receipt.AssetReceipt",
    INSPECTION = "mantle.product.quality.QualityInspection",
    Q = "mantle.product.QualityServices."
const choiceLimit = 30
const openReceiptStatuses = ["ShipInput", "ShipScheduled", "ShipShipped"]
const openInspectionStatuses = ["QiDraft", "QiSubmitted", "QiVerified"]
// the Receipts list's views (design §9 Receipts: expected, partial, late, held and completed)
const views = {
    open: {label: "Expected", test: line => line.open},
    partial: {label: "Partly received", test: line => line.open && line.receivedQuantity.compare(0) > 0},
    late: {label: "Late", test: line => line.late},
    held: {label: "Held", test: line => line.heldQuantity != null && line.heldQuantity.compare(0) > 0},
    completed: {label: "Completed", closed: true, test: line => !line.open},
    all: {label: "All", closed: true, test: () => true}
}
const stateColors = {late: "negative", held: "warning", partial: "primary", expected: "grey-8", completed: "positive"}
const receiptColors = {
    ShipInput: "grey-8",
    ShipScheduled: "primary",
    ShipShipped: "primary",
    ShipDelivered: "positive",
    ShipCancelled: "grey"
}
const inspectionColors = {
    QiDraft: "grey-8",
    QiSubmitted: "warning",
    QiVerified: "primary",
    QiDisposed: "positive",
    QiCancelled: "grey"
}
const blank = value => value == null || String(value).trim() === ""
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const dec = value => toDecimal(value ?? 0)
const qty = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return {}
    return Object.fromEntries(
        Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField] || row[field]])
    )
}

// ===== scope =====
function listScope() {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Receiving is not available")
    return userScope
}
const internalIds = () => rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
// The buying organizations a list may show: the user's (every one for the administrator with none active), or the one given.
function buyersOf(userScope, organizationPartyId) {
    const all = userScope.ownerIds || internalIds()
    if (blank(organizationPartyId)) return all
    if (!purchasing.owns(userScope, organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
    return [String(organizationPartyId)]
}
// The suppliers the user may not work with (owned by another organization, or by none), left out of every list in the query.
function excludedVendors(userScope) {
    if (!userScope.ownerIds) return []
    const factory = ec.entity.conditionFactory
    return Array.from(
        find("mantle.party.PartyDetailAndRole", {roleTypeId: "Supplier"})
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("ownerPartyId", "is-null", null),
                        factory.makeCondition("ownerPartyId", "not-in", ["_NA_"].concat(userScope.ownerIds))
                    ],
                    "or"
                )
            )
            .selectField("partyId")
            .distinct(true)
            .list()
    ).map(row => row.partyId)
}
function supplierFilter(userScope, supplierPartyId) {
    if (blank(supplierPartyId)) return null
    if (!purchasing.supplierOf(userScope, String(supplierPartyId)))
        denied("RECORD_UNAVAILABLE", "Supplier " + supplierPartyId + " is not available")
    return String(supplierPartyId)
}

// ===== record kinds (Purchasing.js recordKinds) =====
// A purchase order's buyers and suppliers, or null when an order is not a purchase.
function orderParties(orderIds) {
    const parts = orderIds.length ? Array.from(find("mantle.order.OrderPart").condition("orderId", "in", orderIds).list()) : []
    const internal = new Set(internalIds())
    if (!parts.length || !parts.every(part => internal.has(part.customerPartyId))) return null
    return {owners: unique(parts.map(part => part.customerPartyId)), suppliers: unique(parts.map(part => part.vendorPartyId))}
}
// A purchase receipt (ShpTpPurchase): its orders' buyers are the owners and their vendors the suppliers.
function readReceipt(shipmentId) {
    const shipment = one(SHIPMENT, {shipmentId})
    if (!shipment || shipment.shipmentTypeEnumId !== "ShpTpPurchase") return null
    const orderIds = unique(rows(SOURCE, {shipmentId}).map(row => row.orderId))
    const parties = orderParties(orderIds)
    if (!parties) return null
    const names = lib.partyNames(parties.suppliers)
    return Object.assign(parties, {
        label: "Receipt " + shipmentId,
        detail: [parties.suppliers.map(id => names[id] || id).join(", "), statusText(shipment.statusId)]
            .filter(Boolean)
            .join(" · ")
    })
}
// An inspection of a purchase receipt: its order's buyers and supplier.
function readInspection(qualityInspectionId) {
    const inspection = one(INSPECTION, {qualityInspectionId})
    if (!inspection || !inspection.orderId) return null
    const parties = orderParties([inspection.orderId])
    if (!parties) return null
    const product = inspection.productId ? one("mantle.product.Product", {productId: inspection.productId}) : null
    return Object.assign(parties, {
        label: "Inspection " + qualityInspectionId,
        detail: [product?.productName || inspection.productId, statusText(inspection.statusId)].filter(Boolean).join(" · ")
    })
}

// ===== expected receipts =====
// The lines of the user's purchase orders in a view, with names and display texts.
function lineRows(userScope, p, view) {
    const found = progress.lines({
        organizationPartyIds: buyersOf(userScope, p.organizationPartyId),
        vendorPartyId: supplierFilter(userScope, p.supplierPartyId),
        orderId: blank(p.orderId) ? null : String(p.orderId),
        facilityId: blank(p.facilityId) ? null : String(p.facilityId),
        excludedVendorIds: excludedVendors(userScope),
        includeClosed: !!view.closed
    })
    let lines = found.lines.filter(view.test)
    if (!blank(p.dueFrom)) lines = lines.filter(line => line.dueDate && lib.ms(line.dueDate) >= lib.ms(p.dueFrom))
    if (!blank(p.dueThru)) lines = lines.filter(line => line.dueDate && lib.ms(line.dueDate) <= lib.ms(p.dueThru))
    // the nearest due first, the undated last
    lines.sort(
        (a, b) =>
            (a.dueDate ? lib.ms(a.dueDate) : Infinity) - (b.dueDate ? lib.ms(b.dueDate) : Infinity) ||
            String(a.orderId + a.orderItemSeqId).localeCompare(String(b.orderId + b.orderItemSeqId))
    )
    return {lines, truncated: found.truncated}
}
function shapeLines(lines) {
    const names = lib.partyNames(lines.map(line => line.supplierPartyId))
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        lines.map(line => line.productId)
    )
    const facilities = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        lines.map(line => line.facilityId)
    )
    const units = namesOf(
        "moqui.basic.Uom",
        "uomId",
        "abbreviation",
        lines.flatMap(line => [line.stockUomId, line.orderUomId])
    )
    return lines.map(line => {
        const held = line.heldQuantity != null && line.heldQuantity.compare(0) > 0
        const state = line.late
            ? "late"
            : held
              ? "held"
              : !line.open
                ? "completed"
                : line.receivedQuantity.compare(0) > 0
                  ? "partial"
                  : "expected"
        return {
            orderId: line.orderId,
            orderPartSeqId: line.orderPartSeqId,
            orderItemSeqId: line.orderItemSeqId,
            lineText: line.orderId + ":" + line.orderItemSeqId,
            supplierPartyId: line.supplierPartyId,
            supplierName: names[line.supplierPartyId] || line.supplierPartyId,
            productId: line.productId,
            productName: products[line.productId] || line.itemDescription || line.productId,
            facilityName: facilities[line.facilityId] || line.facilityId || "",
            unitText: units[line.stockUomId] || line.stockUomId || "",
            orderedText:
                line.orderUomId && line.orderUomId !== line.stockUomId
                    ? qty(line.orderedQuantity) + " " + (units[line.orderUomId] || line.orderUomId)
                    : "",
            expectedQuantity: qty(line.expectedQuantity),
            receivedQuantity: qty(line.receivedQuantity),
            acceptedQuantity: qty(line.acceptedQuantity),
            rejectedQuantity: qty(line.rejectedQuantity),
            heldQuantity: line.heldQuantity == null ? "Unavailable" : qty(line.heldQuantity),
            remainingQuantity: qty(line.remainingQuantity),
            dueText: line.dueDate ? lib.dateText(line.dueDate) : "",
            arrivalText: line.estimatedArrivalDate ? lib.dateText(line.estimatedArrivalDate) : "",
            shipmentId: line.openShipmentId || line.shipmentIds[line.shipmentIds.length - 1] || null,
            stateText: {
                late: "Late",
                held: "Held",
                completed: "Completed",
                partial: "Partly received",
                expected: "Expected"
            }[state],
            stateColor: stateColors[state],
            late: line.late
        }
    })
}
// find#ExpectedReceipts: one page of the lines of the user's purchase orders in a view (open by default), by supplier,
// order, facility and due dates, the nearest due first.
function expectedReceipts(p) {
    const userScope = listScope()
    const view = Object.hasOwn(views, p.view || "") ? views[p.view] : views.open
    const found = lineRows(userScope, p, view)
    const paged = lib.pageList(found.lines, p, "receiptRows")
    paged.receiptRows = shapeLines(paged.receiptRows)
    return Object.assign(paged, {
        viewLabel: view.label,
        truncated: found.truncated,
        canPrepare: !!(userScope.capabilities.buy || userScope.capabilities.receive)
    })
}
// Home's late receipts: the lines of the Late view (null for a user without the buying lists).
function lateCount(userScope) {
    if (!userScope.capabilities.listRead) return null
    return lineRows(userScope, {}, views.late).lines.length
}
// The purchase orders with a late line among the given buyers' (PurchaseOrders' Late view).
function lateOrderIds(userScope, buyers) {
    return unique(
        progress
            .lines({organizationPartyIds: buyers, excludedVendorIds: excludedVendors(userScope)})
            .lines.filter(line => line.late)
            .map(line => line.orderId)
    )
}

// ===== purchase inspections =====
// find#PurchaseInspections: one page of the inspections of the user's purchase receipts (open by default, by status,
// supplier, order and product), the nearest due first, each with its receipt, supplier and held quantity.
function purchaseInspections(p) {
    const userScope = listScope()
    const buyers = buyersOf(userScope, p.organizationPartyId)
    const supplierPartyId = supplierFilter(userScope, p.supplierPartyId)
    const excluded = excludedVendors(userScope)
    // the purchase orders the list may name: of the buyers, from the supplier given, never from an excluded one
    const orderFind = () => {
        let query = find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
            .condition("vendorPartyId", "not-in", internalIds())
            .selectField("orderId")
            .distinct(true)
        if (supplierPartyId) query = query.condition("vendorPartyId", supplierPartyId)
        return query
    }
    const excludedOrderIds = excluded.length
        ? Array.from(orderFind().condition("vendorPartyId", "in", excluded).list()).map(row => row.orderId)
        : []
    const supplierOrderIds = supplierPartyId ? Array.from(orderFind().list()).map(row => row.orderId) : null
    const build = () => {
        let query = find(INSPECTION)
            .condition("orderId", "is-not-null", null)
            .condition("organizationPartyId", "in", buyers.length ? buyers : ["_NA_"])
        if (excludedOrderIds.length) query = query.condition("orderId", "not-in", excludedOrderIds)
        if (supplierOrderIds) query = query.condition("orderId", "in", supplierOrderIds.length ? supplierOrderIds : ["_NA_"])
        if (!blank(p.orderId)) query = query.condition("orderId", String(p.orderId))
        if (!blank(p.productId)) query = query.condition("productId", String(p.productId))
        if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
        else if (p.view !== "all") query = query.condition("statusId", "in", openInspectionStatuses)
        return query
    }
    const paged = lib.page(build().orderBy("dueDate").orderBy("-createdDate"), p, "inspectionRows", build().count())
    const found = paged.rows
    const parts = found.length
        ? Array.from(
              find("mantle.order.OrderPart")
                  .condition("orderId", "in", unique(found.map(row => row.orderId)))
                  .list()
          )
        : []
    const vendorOf = orderId => parts.find(part => part.orderId === orderId)?.vendorPartyId || null
    const names = lib.partyNames(found.map(row => vendorOf(row.orderId)).concat(found.map(row => row.inspectorPartyId)))
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
    const now = lib.ms(ec.user.nowTimestamp)
    const inspectionRows = found.map(row => {
        const open = openInspectionStatuses.includes(row.statusId)
        const overdue = open && row.dueDate != null && lib.ms(row.dueDate) < now
        return {
            qualityInspectionId: row.qualityInspectionId,
            shipmentId: row.shipmentId || null,
            orderId: row.orderId,
            lineText: row.orderId + ":" + (row.orderItemSeqId || ""),
            supplierPartyId: vendorOf(row.orderId),
            supplierName: names[vendorOf(row.orderId)] || vendorOf(row.orderId) || "",
            productName: products[row.productId] || row.productId || "",
            quantityText: qty(row.quantity),
            heldText: qty(row.heldQuantity),
            statusText: statusText(row.statusId),
            statusColor: inspectionColors[row.statusId] || "grey",
            resultText: results[row.resultEnumId] || "",
            outcomeText:
                row.quantityAccepted != null || row.quantityRejected != null
                    ? qty(row.quantityAccepted) + " accepted · " + qty(row.quantityRejected) + " rejected"
                    : "",
            dueText: row.dueDate ? lib.dateText(row.dueDate) + (overdue ? " (overdue)" : "") : "",
            inspectorName: row.inspectorPartyId ? names[row.inspectorPartyId] || row.inspectorPartyId : "",
            overdue
        }
    })
    const result = Object.assign({}, paged, {inspectionRows})
    delete result.rows
    return result
}

// ===== a purchase receipt (Shared/ShipmentDetail's Purchasing branch) =====
// The receipt of the user's purchase orders: its header, each order line on it with what it expects and what was received,
// accepted, rejected and held on it, its receipts and inspections, and what the user may do: receive, finish and receive all
// as expected for a holder of Warehouse's receive permission (STOCK_RECEIVE) while it is open; a bill from its accepted
// receipts for AP intake (PAYABLE_EDIT) once it is delivered. Anyone else sees the progress only.
function receiptDetail(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "receipt", p.shipmentId)
    const shipment = one(SHIPMENT, {shipmentId: p.shipmentId})
    const can = userScope.capabilities
    const sources = rows(SOURCE, {shipmentId: shipment.shipmentId}).filter(row => row.statusId !== "SisCancelled")
    const receipts = rows(RECEIPT, {shipmentId: shipment.shipmentId})
    const split = progress.inspectionSplit(receipts)
    let held = {}
    try {
        const status = call(Q + "get#SourceInspectionStatus", {shipmentId: shipment.shipmentId})
        for (const row of Array.from(status.receiptRows || [])) {
            const key = row.orderId + ":" + row.orderItemSeqId
            held[key] = (held[key] || toDecimal(0)).add(dec(row.heldQuantity))
        }
    } catch (error) {
        ec.logger.error("Held quantities of receipt " + shipment.shipmentId + ": " + error.message)
        held = null
    }
    const orderIds = unique(sources.map(row => row.orderId))
    const items = orderIds.length ? Array.from(find("mantle.order.OrderItem").condition("orderId", "in", orderIds).list()) : []
    const parts = orderIds.length ? Array.from(find("mantle.order.OrderPart").condition("orderId", "in", orderIds).list()) : []
    const products = Object.fromEntries(
        (sources.length
            ? Array.from(
                  find("mantle.product.Product")
                      .condition("productId", "in", unique(sources.map(row => row.productId)))
                      .list()
              )
            : []
        ).map(row => [row.productId, row])
    )
    const units = namesOf(
        "moqui.basic.Uom",
        "uomId",
        "abbreviation",
        Object.values(products).map(row => row.amountUomId)
    )
    let dueTotal = toDecimal(0),
        acceptedTotal = toDecimal(0)
    const lineRows = sources.map(source => {
        const key = source.orderId + ":" + source.orderItemSeqId
        const own = receipts.filter(row => row.orderId === source.orderId && row.orderItemSeqId === source.orderItemSeqId)
        const dockAccepted = own.reduce((sum, row) => sum.add(dec(row.quantityAccepted)), toDecimal(0))
        const dockRejected = own.reduce((sum, row) => sum.add(dec(row.quantityRejected)), toDecimal(0))
        const inspected = split[key] || {rejected: toDecimal(0), undecided: toDecimal(0)}
        let accepted = dockAccepted.subtract(inspected.rejected).subtract(inspected.undecided)
        if (accepted.compare(0) < 0) accepted = toDecimal(0)
        const received = dockAccepted.add(dockRejected)
        let due = dec(source.quantity).subtract(received)
        if (due.compare(0) < 0) due = toDecimal(0)
        dueTotal = dueTotal.add(due)
        acceptedTotal = acceptedTotal.add(accepted)
        const item = items.find(row => row.orderId === source.orderId && row.orderItemSeqId === source.orderItemSeqId)
        const product = products[source.productId]
        return {
            shipmentItemSourceId: source.shipmentItemSourceId,
            orderId: source.orderId,
            orderItemSeqId: source.orderItemSeqId,
            lineText: key,
            productId: source.productId,
            productName: product?.productName || item?.itemDescription || source.productId,
            unitText: units[product?.amountUomId] || product?.amountUomId || "",
            expectedQuantity: qty(source.quantity),
            receivedQuantity: qty(received),
            acceptedQuantity: qty(accepted),
            rejectedQuantity: qty(dockRejected.add(inspected.rejected)),
            heldQuantity: held ? qty(held[key] || 0) : "Unavailable",
            dueQuantity: qty(due),
            dueValue: due.compare(0) > 0 ? String(due.toNumber()) : "0",
            dueText: item?.requiredByDate ? lib.dateText(item.requiredByDate) : ""
        }
    })
    const reasons = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        receipts.map(row => row.rejectionReasonEnumId)
    )
    const users = namesOf(
        "moqui.security.UserAccount",
        "userId",
        "userFullName",
        receipts.map(row => row.receivedByUserId)
    )
    const receiptRows = receipts
        .sort((a, b) => lib.ms(a.receivedDate) - lib.ms(b.receivedDate))
        .map(row => ({
            assetReceiptId: row.assetReceiptId,
            receivedText: lib.dateText(row.receivedDate),
            lineText: (row.orderId || "") + ":" + (row.orderItemSeqId || ""),
            productName: products[row.productId]?.productName || row.productId,
            acceptedQuantity: qty(row.quantityAccepted),
            rejectedQuantity: qty(row.quantityRejected),
            rejectionText: reasons[row.rejectionReasonEnumId] || "",
            receivedBy: users[row.receivedByUserId] || ""
        }))
    const inspections = Array.from(
        find(INSPECTION).condition("shipmentId", shipment.shipmentId).orderBy("createdDate").list()
    ).map(row => ({
        qualityInspectionId: row.qualityInspectionId,
        productName: products[row.productId]?.productName || row.productId || "",
        statusText: statusText(row.statusId),
        statusColor: inspectionColors[row.statusId] || "grey",
        quantityText: qty(row.quantity),
        heldText: qty(row.heldQuantity),
        outcomeText:
            row.quantityAccepted != null || row.quantityRejected != null
                ? qty(row.quantityAccepted) + " accepted · " + qty(row.quantityRejected) + " rejected"
                : ""
    }))
    const destination = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: shipment.shipmentId}).find(
        row => row.destinationFacilityId
    )?.destinationFacilityId
    const facility = destination ? one("mantle.facility.Facility", {facilityId: destination}) : null
    const vendorIds = unique(parts.map(part => part.vendorPartyId))
    const names = lib.partyNames(vendorIds.concat(unique(parts.map(part => part.customerPartyId))))
    const open = openReceiptStatuses.includes(shipment.statusId)
    const canReceive = !!can.receive && open
    const today = progress.startOfToday()
    return {
        receiptFound: true,
        receipt: {
            shipmentId: shipment.shipmentId,
            supplierPartyId: vendorIds[0] || null,
            supplierName: vendorIds.map(id => names[id] || id).join(", "),
            organizationName: unique(parts.map(part => part.customerPartyId))
                .map(id => names[id] || id)
                .join(", "),
            facilityId: facility?.facilityId || null,
            facilityName: facility?.facilityName || facility?.facilityId || "",
            statusId: shipment.statusId,
            statusText: statusText(shipment.statusId),
            statusColor: receiptColors[shipment.statusId] || "grey",
            expectedText: shipment.estimatedArrivalDate ? lib.dateText(shipment.estimatedArrivalDate) : "Not set",
            overdue: open && shipment.estimatedArrivalDate != null && lib.ms(shipment.estimatedArrivalDate) < today,
            orderIds,
            open,
            dueQuantity: qty(dueTotal),
            receivedAny: receipts.length > 0,
            canReceive,
            canFinish: canReceive && receipts.length > 0,
            canReceiveAll: canReceive && dueTotal.compare(0) > 0,
            canBill: !!can.payableEdit && shipment.statusId === "ShipDelivered" && acceptedTotal.compare(0) > 0,
            progressOnly: !can.receive
        },
        lineRows,
        receiptRows,
        inspectionRows: inspections
    }
}

// ===== an inspection (Shared/QualityInspection's Purchasing branch) =====
// An inspection of the user's purchase receipts: Mantle's read of it, its links under Purchasing, and the actions of the
// inspect, verify and dispose permissions, offered where Warehouse's scope also covers its facility (the actions are
// Warehouse's transitions and choices, which check that scope); anyone else reads it.
function inspectionDetail(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "inspection", p.qualityInspectionId)
    const found = call(Q + "get#Inspection", {qualityInspectionId: p.qualityInspectionId})
    const inspection = Object.assign({}, found.inspection, {
        statusColor: inspectionColors[found.inspection.statusId] || "grey"
    })
    const can = userScope.capabilities
    let warehouseActs = false
    if (can.inspect || can.qualityVerify || can.qualityDispose) {
        try {
            const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
            warehouse.execute("checkRecord", {recordType: "inspection", recordId: p.qualityInspectionId})
            warehouseActs = true
        } catch (error) {
            if (lib.reasonCode(error) == null)
                ec.logger.warn("Warehouse scope of " + p.qualityInspectionId + ": " + error.message)
        }
    }
    const mantleCan = found.capabilities || {}
    const links = {}
    if (inspection.shipmentId) links.shipment = "/qapps/Purchasing/Receiving/ShipmentDetail?shipmentId=" + inspection.shipmentId
    if (inspection.orderId) links.order = "/qapps/Purchasing/Orders/OrderDetail?orderId=" + inspection.orderId
    return Object.assign({}, found, {
        recordFound: true,
        inspection,
        links,
        items: Array.from(found.items || []).map(item =>
            Object.assign({}, item, {
                readingStateText: item.missing
                    ? "Reading needed"
                    : item.failCount
                      ? item.failCount + " failed"
                      : item.readingCount
                        ? "Read"
                        : "Optional",
                readingStateColor: item.missing
                    ? "warning"
                    : item.failCount
                      ? "negative"
                      : item.readingCount
                        ? "positive"
                        : "grey"
            })
        ),
        actions: {
            canSaveReadings: warehouseActs && !!can.inspect && !!mantleCan.canSaveReadings,
            canSubmit: warehouseActs && !!can.inspect && !!mantleCan.canSubmit,
            canVerify: warehouseActs && !!can.qualityVerify && !!mantleCan.canVerify,
            canDispose: warehouseActs && !!can.qualityDispose && !!mantleCan.canDispose,
            canAssign: false,
            canReinspect: warehouseActs && !!can.inspect && !!mantleCan.canReinspect,
            canCancel: false
        },
        submitDefaults: {quantityAccepted: inspection.quantity, quantityRejected: "0"},
        disposeDefaults: {
            dispositionEnumId: found.acceptedLeft && found.acceptedLeft !== "0" ? "QdRelease" : "QdScrap",
            quantity: found.acceptedLeft && found.acceptedLeft !== "0" ? found.acceptedLeft : found.rejectedLeft
        }
    })
}

// ===== receipt templates (Shared/InspectionTemplates' Purchasing branch) =====
// The receipt inspection templates of the user's organizations; a holder of QUALITY_TEMPLATE_EDIT with Warehouse's scope
// edits them there (the editor's choices are Warehouse's), others read.
function templateEditor(can) {
    if (!can.qualityTemplateEdit) return false
    try {
        const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
        return !!warehouse.scope().read
    } catch (error) {
        ec.logger.warn("Warehouse scope for the template editor: " + error.message)
        return false
    }
}
function templateList(p) {
    const userScope = listScope()
    const found = call(Q + "find#InspectionTemplates", {
        statusId: p.statusId || null,
        inspectionContextEnumId: "QicReceipt",
        templateName: p.templateName || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize
    })
    return Object.assign({}, found, {
        canEdit: templateEditor(userScope.capabilities),
        templates: Array.from(found.templates || []).map(row =>
            Object.assign({}, row, {statusColor: {QtDraft: "grey-8", QtPublished: "positive", QtRetired: "grey"}[row.statusId]})
        )
    })
}
function templateDetail(p) {
    const userScope = listScope()
    const found = call(Q + "get#InspectionTemplate", {inspectionTemplateId: p.inspectionTemplateId, asOfDate: p.asOfDate || null})
    const template = Object.assign({}, found.template, {
        statusColor: {QtDraft: "grey-8", QtPublished: "positive", QtRetired: "grey"}[found.template.statusId] || "grey"
    })
    const editable = templateEditor(userScope.capabilities) && template.statusId !== "QtRetired"
    return Object.assign({}, found, {
        recordFound: true,
        template,
        canEdit: editable,
        canPublish: editable && template.statusId === "QtDraft",
        canRetire: editable && template.statusId === "QtPublished",
        published: template.statusId === "QtPublished",
        editItems: Array.from(found.draftItems || []).concat(Array.from(found.items || []))
    })
}

// ===== choices (Purchasing.js choiceSources) =====
// The approved purchase order parts of the user's organizations a receipt may be prepared for (PrepareReceipt), as
// "orderId:orderPartSeqId", by order id or name.
function receiptParts(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    const excluded = excludedVendors(userScope)
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyersOf(userScope))
        .condition("vendorPartyId", "not-in", internalIds().concat(excluded))
        .condition("partStatusId", "in", ["OrderApproved", "OrderSent", "OrderProcessing"])
        .selectField("orderId,orderPartSeqId,orderName,vendorPartyId")
        .orderBy("-entryDate")
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["orderId", "orderName"].map(field =>
                    factory.makeCondition(field, "like", "%" + term.replace(/[\\%_]/g, c => "\\" + c) + "%").ignoreCase()
                ),
                "or"
            )
        )
    const found = Array.from(query.list())
    const names = lib.partyNames(found.map(row => row.vendorPartyId))
    const options = found.map(row => ({
        value: row.orderId + ":" + row.orderPartSeqId,
        label: [row.orderId, row.orderName, names[row.vendorPartyId]].filter(Boolean).join(" · ")
    }))
    if (selected && !options.some(option => option.value === selected)) {
        const orderId = String(selected).split(":")[0]
        try {
            const record = purchasing.recordOf(userScope, "order", orderId)
            options.push({value: selected, label: orderId + " · " + record.label})
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        }
    }
    return options
}
// The reasons a received unit is rejected.
function rejectionReasons() {
    return Array.from(find("moqui.basic.Enumeration", {enumTypeId: "RejectionReason"}).orderBy("description").list()).map(
        row => ({value: row.enumId, label: row.description || row.enumId})
    )
}
// The open locations of a receipt's facility (p.shipmentId), for the receiver's destination.
function receiptLocations(userScope, term, selected, p) {
    if (blank(p.shipmentId)) return []
    purchasing.recordOf(userScope, "receipt", String(p.shipmentId))
    const facilityId = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: String(p.shipmentId)}).find(
        row => row.destinationFacilityId
    )?.destinationFacilityId
    if (!facilityId) return []
    let query = find("mantle.facility.FacilityLocation", {facilityId})
        .condition("thruDate", "is-null", null)
        .orderBy("locationSeqId")
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            ec.entity.conditionFactory.makeCondition(
                ["locationSeqId", "description"].map(field =>
                    ec.entity.conditionFactory
                        .makeCondition(field, "like", "%" + term.replace(/[\\%_]/g, c => "\\" + c) + "%")
                        .ignoreCase()
                ),
                "or"
            )
        )
    return Array.from(query.list()).map(row => ({
        value: row.locationSeqId,
        label: row.locationSeqId + (row.description ? " · " + row.description : "")
    }))
}

// The shared inspection screens' drop-downs under Purchasing: the status filters a reader uses, and the editor's and
// actor's choices from Warehouse, whose service checks its scope (they are offered only where it covers the user).
const statusChoices = {statuses: "QualityInspection", templateStatuses: "InspectionTemplate"}
function inspectionChoices(p) {
    purchasing.required()
    if (Object.hasOwn(statusChoices, p.choice))
        return {
            options: Array.from(
                find("moqui.basic.StatusItem", {statusTypeId: statusChoices[p.choice]}).orderBy("sequenceNum").list()
            ).map(row => ({value: row.statusId, label: row.description}))
        }
    return call("ironstone.warehouse.InspectionServices.get#InspectionChoices", {
        choice: p.choice,
        term: p.term || null,
        selected: p.selected || null,
        facilityId: p.facilityId || null
    })
}

const operations = {
    expectedReceipts,
    purchaseInspections,
    receiptDetail,
    inspectionDetail,
    templateList,
    templateDetail,
    inspectionChoices
}
;({
    readReceipt,
    readInspection,
    lateCount,
    lateOrderIds,
    receiptParts,
    rejectionReasons,
    receiptLocations,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing receipt operation " + op)
        return operations[op](parameters)
    }
})
