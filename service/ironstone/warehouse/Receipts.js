// The Warehouse receiving screens' reads (impl-warehouse P7, design-warehouse §4 and crosscut §3.3, §3.8): the receipts of
// the user's facilities (ReceiptFind and ReceiptList as list, board and calendar), one receipt with its lines and receipts
// (ReceiptDetail's Warehouse branch of Shared/ShipmentDetail, the Receive task and the receipt documents), the choices of
// NewReceipt and Receive, and a supplier's receiving (Supplier360's Warehouse branch). Every read is limited to the user's
// Warehouse facilities in the query (a receipt by its route segment's destination, F55); the postings are Mantle's guarded
// WarehouseTaskServices entry points, which the screens call after AccessServices.check#Record. No cost is read here.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, denied, dateText} = lib
const cf = () => ec.entity.conditionFactory

const kinds = {purchase: "ShpTpPurchase", return: "ShpTpSalesReturn", transfer: "ShpTpTransfer"}
const kindTexts = {ShpTpPurchase: "Purchase receipt", ShpTpSalesReturn: "Customer return", ShpTpTransfer: "Transfer in"}
const openStatuses = ["ShipInput", "ShipScheduled", "ShipShipped"]
const statusColors = {
    ShipInput: "grey-8",
    ShipScheduled: "primary",
    ShipShipped: "info",
    ShipDelivered: "positive",
    ShipCancelled: "negative"
}
const choiceLimit = 30
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const like = term => "%" + String(term).replace(/[\\%_]/g, character => "\\" + character) + "%"

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
function todayText() {
    return ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
}
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}

// ===== ReceiptFind and ReceiptList =====
function receiptQuery(userScope, p) {
    const facility = facilityOf(userScope, p.facilityId)
    const facilityIds = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let query = find("mantle.shipment.ShipmentAndRouteSegment")
        .condition("shipmentTypeEnumId", "in", kinds[p.sourceType] ? [kinds[p.sourceType]] : Object.values(kinds))
        .condition("destinationFacilityId", facilityIds ? "in" : "is-not-null", facilityIds ? facilityIds : null)
    if (p.statusId === "all") {
        // every status
    } else if (p.statusId) query = query.condition("statusId", p.statusId)
    else query = query.condition("statusId", "in", openStatuses)
    if (p.supplierPartyId) query = query.condition("fromPartyId", p.supplierPartyId)
    if (p.overdue === "Y" || p.overdue === true)
        query = query.condition("statusId", "in", openStatuses).condition("estimatedArrivalDate", "less", ec.user.nowTimestamp)
    if (p.text && String(p.text).trim())
        query = query.condition(
            cf().makeCondition(
                [
                    cf()
                        .makeCondition("shipmentId", "like", like(String(p.text).trim()))
                        .ignoreCase(),
                    cf()
                        .makeCondition("otherPartyOrderId", "like", like(String(p.text).trim()))
                        .ignoreCase()
                ],
                "or"
            )
        )
    return query
}
// Each receipt's expected, accepted, rejected and due quantity and its orders, from its sources and receipts in two queries.
function progressOf(shipmentIds) {
    const progress = new Map(shipmentIds.map(id => [id, {expected: 0, accepted: 0, rejected: 0, orderIds: new Set()}]))
    if (!shipmentIds.length) return progress
    for (const source of Array.from(
        find("mantle.shipment.ShipmentItemSource").condition("shipmentId", "in", shipmentIds).list()
    )) {
        if (source.statusId === "SisCancelled") continue
        const row = progress.get(source.shipmentId)
        row.expected += number(source.quantity)
        if (source.orderId) row.orderIds.add(source.orderId)
        if (source.returnId) row.orderIds.add(source.returnId)
    }
    for (const receipt of Array.from(
        find("mantle.product.receipt.AssetReceipt").condition("shipmentId", "in", shipmentIds).list()
    )) {
        const row = progress.get(receipt.shipmentId)
        row.accepted += number(receipt.quantityAccepted)
        row.rejected += number(receipt.quantityRejected)
    }
    return progress
}
function receiptRow(shipment, progress, names, statuses, facilityNames, today) {
    const expectedDay = shipment.estimatedArrivalDate ? lib.bookDay(null, shipment.estimatedArrivalDate) : ""
    const due = Math.max(0, progress.expected - progress.accepted - progress.rejected)
    const open = openStatuses.includes(shipment.statusId)
    return {
        shipmentId: shipment.shipmentId,
        kindText: kindTexts[shipment.shipmentTypeEnumId] || shipment.shipmentTypeEnumId,
        supplierPartyId: shipment.fromPartyId,
        supplierName: names[shipment.fromPartyId] || shipment.fromPartyId || "",
        facilityId: shipment.destinationFacilityId,
        facilityName: facilityNames.get(shipment.destinationFacilityId) || shipment.destinationFacilityId || "",
        statusId: shipment.statusId,
        statusText: statuses.get(shipment.statusId) || shipment.statusId,
        statusColor: statusColors[shipment.statusId] || "grey",
        sourceText: [...progress.orderIds].join(", "),
        expectedDay,
        expectedText: expectedDay || "Not set",
        allDay: true,
        calendarTitle: shipment.shipmentId + " · " + (names[shipment.fromPartyId] || shipment.fromPartyId || ""),
        overdue: open && !!expectedDay && expectedDay < today,
        expectedQuantity: progress.expected,
        acceptedQuantity: progress.accepted,
        rejectedQuantity: progress.rejected,
        dueQuantity: due,
        progressText: quantityText(progress.accepted + progress.rejected) + " of " + quantityText(progress.expected)
    }
}
function receipts(p) {
    const userScope = warehouse.required(warehouse.scope())
    const query = receiptQuery(userScope, p)
        .selectField("shipmentId,shipmentTypeEnumId,statusId,fromPartyId,estimatedArrivalDate,destinationFacilityId")
        .distinct(true)
        .orderBy("estimatedArrivalDate,shipmentId")
    const count = receiptQuery(userScope, p).selectField("shipmentId").distinct(true).count()
    const paged = lib.page(query, p, "receiptRows", count)
    const progress = progressOf(paged.rows.map(row => row.shipmentId))
    const names = lib.partyNames(paged.rows.map(row => row.fromPartyId))
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        paged.rows.map(row => row.statusId)
    )
    const facilityNames = namesOf(
        "mantle.facility.Facility",
        "facilityId",
        "facilityName",
        paged.rows.map(row => row.destinationFacilityId)
    )
    const today = todayText()
    const out = Object.assign({}, paged)
    delete out.rows
    out.receiptRows = paged.rows.map(row => receiptRow(row, progress.get(row.shipmentId), names, statuses, facilityNames, today))
    out.canReceive = !!userScope.capabilities.receive
    return out
}

// ===== one receipt =====
function shipmentOf(userScope, shipmentId) {
    const record = warehouse.recordOf(userScope, "shipment", shipmentId)
    const shipment = one("mantle.shipment.Shipment", {shipmentId})
    if (!kindTexts[shipment.shipmentTypeEnumId]) denied("RECORD_UNAVAILABLE", "Shipment " + shipmentId + " is not a receipt")
    const segment = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId})
        .filter(row => row.destinationFacilityId)
        .sort((a, b) => String(b.shipmentRouteSegmentSeqId).localeCompare(String(a.shipmentRouteSegmentSeqId)))[0]
    const facility = segment ? one("mantle.facility.Facility", {facilityId: segment.destinationFacilityId}) : null
    if (!warehouse.inScope(userScope, facility)) denied("RECORD_UNAVAILABLE", "Shipment " + shipmentId + " is not received here")
    return {record, shipment, facility}
}
// The receipt's lines (a product of an order line or return line) with what is expected, accepted, rejected and due.
function linesOf(shipmentId) {
    const sources = rows("mantle.shipment.ShipmentItemSource", {shipmentId}).filter(row => row.statusId !== "SisCancelled")
    const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId})
    const products = new Map(
        Array.from(
            find("mantle.product.Product")
                .condition("productId", "in", unique(sources.map(row => row.productId).concat(receipts.map(r => r.productId))))
                .list()
        ).map(row => [row.productId, row])
    )
    const lines = new Map()
    for (const source of sources) {
        const line = lines.get(source.productId) || {
            productId: source.productId,
            productName: products.get(source.productId)?.productName || source.productId,
            amountUomId: products.get(source.productId)?.amountUomId || null,
            orderIds: new Set(),
            expected: 0,
            accepted: 0,
            rejected: 0
        }
        line.expected += number(source.quantity)
        if (source.orderId) line.orderIds.add(source.orderId + ":" + source.orderItemSeqId)
        if (source.returnId) line.orderIds.add(source.returnId + ":" + source.returnItemSeqId)
        lines.set(source.productId, line)
    }
    for (const receipt of receipts) {
        const line = lines.get(receipt.productId) || {
            productId: receipt.productId,
            productName: products.get(receipt.productId)?.productName || receipt.productId,
            amountUomId: products.get(receipt.productId)?.amountUomId || null,
            orderIds: new Set(),
            expected: 0,
            accepted: 0,
            rejected: 0
        }
        line.accepted += number(receipt.quantityAccepted)
        line.rejected += number(receipt.quantityRejected)
        lines.set(receipt.productId, line)
    }
    const units = namesOf(
        "moqui.basic.Uom",
        "uomId",
        "abbreviation",
        [...lines.values()].map(line => line.amountUomId)
    )
    return [...lines.values()].map(line => ({
        productId: line.productId,
        productName: line.productName,
        unitText: units.get(line.amountUomId) || line.amountUomId || "",
        sourceText: [...line.orderIds].join(", "),
        expectedQuantity: line.expected,
        acceptedQuantity: line.accepted,
        rejectedQuantity: line.rejected,
        dueQuantity: Math.max(0, line.expected - line.accepted - line.rejected)
    }))
}
// Each receipt written on the shipment: when, by whom, what, the stock it made (lot, serial, location, status), accepted
// and rejected with the reason, and the quantity as entered.
function receiptRowsOf(shipmentId) {
    const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId}).sort(
        (a, b) => lib.ms(a.receivedDate) - lib.ms(b.receivedDate) || String(a.assetReceiptId).localeCompare(b.assetReceiptId)
    )
    const assets = new Map(
        Array.from(
            find("mantle.product.asset.Asset")
                .condition("assetId", "in", unique(receipts.map(row => row.assetId)).concat(["_none_"]))
                .list()
        ).map(row => [row.assetId, row])
    )
    const lots = namesOf(
        "mantle.product.asset.Lot",
        "lotId",
        "lotNumber",
        [...assets.values()].map(asset => asset.lotId)
    )
    const products = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        receipts.map(row => row.productId)
    )
    const reasons = namesOf(
        "moqui.basic.Enumeration",
        "enumId",
        "description",
        receipts.map(row => row.rejectionReasonEnumId)
    )
    const units = namesOf(
        "moqui.basic.Uom",
        "uomId",
        "abbreviation",
        receipts.map(row => row.enteredQuantityUomId)
    )
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        [...assets.values()].map(asset => asset.statusId)
    )
    const users = namesOf(
        "moqui.security.UserAccount",
        "userId",
        "username",
        receipts.map(row => row.receivedByUserId)
    )
    return receipts.map(row => {
        const asset = row.assetId ? assets.get(row.assetId) : null
        const entered =
            row.enteredQuantity == null
                ? ""
                : quantityText(row.enteredQuantity) +
                  " " +
                  (units.get(row.enteredQuantityUomId) || row.enteredQuantityUomId || "packs") +
                  (number(row.appliedConversionFactor) !== 1 ? " × " + quantityText(row.appliedConversionFactor) : "")
        return {
            assetReceiptId: row.assetReceiptId,
            receivedText: dateText(row.receivedDate),
            receivedBy: users.get(row.receivedByUserId) || row.receivedByUserId || "",
            productId: row.productId,
            productName: products.get(row.productId) || row.productId || "",
            assetId: row.assetId || null,
            identityText: [
                asset?.serialNumber ? "Serial " + asset.serialNumber : "",
                asset?.lotId ? "Lot " + (lots.get(asset.lotId) || asset.lotId) : ""
            ]
                .filter(Boolean)
                .join(" · "),
            placeText: asset?.locationSeqId || "",
            statusText: asset ? statuses.get(asset.statusId) || asset.statusId : "No stock",
            acceptedQuantity: number(row.quantityAccepted),
            rejectedQuantity: number(row.quantityRejected),
            rejectionText: number(row.quantityRejected)
                ? reasons.get(row.rejectionReasonEnumId) || row.rejectionReasonEnumId || "Rejected"
                : "",
            enteredText: entered
        }
    })
}
// The receipt step the facility receives into now, as words (P3's operation policy).
function stepTextOf(facility) {
    try {
        const policy = lib.call("mantle.facility.WarehousePolicyServices.resolve#WarehousePolicy", {
            facilityId: facility.facilityId
        }).operationPolicy
        const steps = Number(policy?.receiptSteps) || 1
        return {
            receiptSteps: steps,
            stepText:
                steps === 3
                    ? "Received into quarantine" +
                      (policy.quarantineLocationSeqId ? " (" + policy.quarantineLocationSeqId + ")" : "")
                    : steps === 2
                      ? "Received to receiving" +
                        (policy.receivingLocationSeqId ? " (" + policy.receivingLocationSeqId + ")" : "")
                      : "Received to each product's location"
        }
    } catch (error) {
        ec.logger.warn("Receipt step of facility " + facility.facilityId + ": " + error.message)
        return {receiptSteps: null, stepText: ""}
    }
}
function receiptDetail(p) {
    const userScope = warehouse.required(warehouse.scope())
    const {shipment, facility} = shipmentOf(userScope, p.shipmentId)
    const names = lib.partyNames([shipment.fromPartyId, shipment.toPartyId])
    const lineRows = linesOf(shipment.shipmentId)
    const receiptRows = receiptRowsOf(shipment.shipmentId)
    const open = openStatuses.includes(shipment.statusId)
    const purchase = shipment.shipmentTypeEnumId === "ShpTpPurchase"
    const canReceive = !!userScope.capabilities.receive && open && purchase
    const due = lineRows.reduce((total, line) => total + line.dueQuantity, 0)
    const status = one("moqui.basic.StatusItem", {statusId: shipment.statusId})
    const returnIds = unique(rows("mantle.shipment.ShipmentItemSource", {shipmentId: shipment.shipmentId}).map(r => r.returnId))
    const expectedDay = shipment.estimatedArrivalDate ? lib.bookDay(null, shipment.estimatedArrivalDate) : ""
    return Object.assign(
        {
            receiptFound: true,
            shipmentId: shipment.shipmentId,
            receipt: {
                shipmentId: shipment.shipmentId,
                shipmentTypeEnumId: shipment.shipmentTypeEnumId,
                kindText: kindTexts[shipment.shipmentTypeEnumId],
                supplierPartyId: shipment.fromPartyId,
                supplierName: names[shipment.fromPartyId] || shipment.fromPartyId || "",
                organizationName: names[shipment.toPartyId] || shipment.toPartyId || "",
                facilityId: facility.facilityId,
                facilityName: facility.facilityName || facility.facilityId,
                statusId: shipment.statusId,
                statusText: status?.description || shipment.statusId,
                statusColor: statusColors[shipment.statusId] || "grey",
                expectedText: expectedDay || "Not set",
                overdue: open && !!expectedDay && expectedDay < todayText(),
                reference: shipment.otherPartyOrderId || "",
                orderIds: unique(
                    rows("mantle.shipment.ShipmentItemSource", {shipmentId: shipment.shipmentId}).map(row => row.orderId)
                ),
                returnIds,
                open,
                purchase,
                dueQuantity: due,
                receivedAny: receiptRows.length > 0,
                rejectedAny: receiptRows.some(row => row.rejectedQuantity > 0),
                canReceive,
                canFinish: canReceive,
                printedText: dateText(ec.user.nowTimestamp)
            },
            lineRows,
            receiptRows
        },
        stepTextOf(facility)
    )
}

// ===== the Receive task =====
// The receipt, its lines, the chosen line with its units, tracking and remaining quantity, and the receipt step.
function receiveContext(p) {
    const detail = receiptDetail(p)
    const line = p.productId ? detail.lineRows.find(row => row.productId === p.productId) : null
    let selectedLine = null
    if (line) {
        const product = one("mantle.product.Product", {productId: line.productId})
        let tracking = {}
        try {
            tracking =
                lib.call("mantle.facility.WarehousePolicyServices.resolve#WarehousePolicy", {
                    facilityId: detail.receipt.facilityId,
                    productId: line.productId
                }).trackingPolicy || {}
        } catch (error) {
            ec.logger.warn("Tracking policy of " + line.productId + ": " + error.message)
        }
        const orderUnits = unique(
            rows("mantle.shipment.ShipmentItemSource", {shipmentId: detail.shipmentId, productId: line.productId})
                .filter(source => source.orderId)
                .map(source => one("mantle.order.OrderItem", {orderId: source.orderId, orderItemSeqId: source.orderItemSeqId}))
                .map(item => item?.quantityUomId)
        )
        selectedLine = Object.assign({}, line, {
            amountUomId: product?.amountUomId || null,
            defaultUnitId: orderUnits[0] || product?.amountUomId || null,
            unitIds: unique([orderUnits[0], product?.amountUomId]),
            lotRequired: tracking.lotRequired === "Y",
            serialRequired: tracking.serialRequired === "Y",
            trackingText: [
                tracking.serialRequired === "Y" ? "one serial per unit" : "",
                tracking.lotRequired === "Y" ? "lot required" : "",
                Number(tracking.shelfLifeDays) > 0 ? "shelf life " + tracking.shelfLifeDays + " days" : ""
            ]
                .filter(Boolean)
                .join(" · ")
        })
    }
    return Object.assign(detail, {selectedLine})
}

// ===== choices (NewReceipt, Receive) =====
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim()
    const selected = p.selected ? String(p.selected) : null
    const organizations = userScope.facilityOwnerIds
    const sources = {
        // open purchase order parts of the user's organizations: value orderId:orderPartSeqId
        purchaseParts() {
            let query = find("mantle.order.OrderPart").condition("statusId", "in", ["OrderApproved", "OrderSent"])
            if (organizations) query = query.condition("customerPartyId", "in", organizations.length ? organizations : ["_none_"])
            if (term) query = query.condition(cf().makeCondition("orderId", "like", like(term)).ignoreCase())
            const found = Array.from(query.orderBy("-orderId,orderPartSeqId").limit(choiceLimit).list()).filter(part =>
                one("mantle.party.PartyRole", {partyId: part.customerPartyId, roleTypeId: "OrgInternal"})
            )
            const names = lib.partyNames(found.map(part => part.vendorPartyId))
            const options = found.map(part => ({
                value: part.orderId + ":" + part.orderPartSeqId,
                label:
                    "PO " +
                    part.orderId +
                    " · part " +
                    part.orderPartSeqId +
                    " · " +
                    (names[part.vendorPartyId] || part.vendorPartyId)
            }))
            if (selected && !options.some(option => option.value === selected)) {
                const [orderId, orderPartSeqId] = selected.split(":")
                const part = one("mantle.order.OrderPart", {orderId, orderPartSeqId})
                if (part && (!organizations || organizations.includes(part.customerPartyId)))
                    options.unshift({value: selected, label: "PO " + orderId + " · part " + orderPartSeqId})
            }
            return options
        },
        // customer returns received at one of the user's facilities
        returns() {
            let query = find("mantle.order.return.ReturnHeader").condition("statusId", "in", [
                "ReturnRequested",
                "ReturnApproved",
                "ReturnShipped"
            ])
            const ids = warehouse.facilityIds(userScope)
            if (ids) query = query.condition("facilityId", "in", ids.length ? ids : ["_none_"])
            if (term) query = query.condition(cf().makeCondition("returnId", "like", like(term)).ignoreCase())
            const options = Array.from(query.orderBy("-returnId").limit(choiceLimit).list()).map(row => ({
                value: row.returnId,
                label: "Return " + row.returnId
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
        // the products on a receipt
        receiptProducts() {
            if (!p.shipmentId) return []
            shipmentOf(userScope, p.shipmentId)
            const lines = linesOf(p.shipmentId).filter(
                line => !term || (line.productId + " " + line.productName).toLowerCase().includes(term.toLowerCase())
            )
            return lines.map(line => ({value: line.productId, label: line.productName + " (" + line.productId + ")"}))
        },
        rejectionReasons() {
            return Array.from(find("moqui.basic.Enumeration", {enumTypeId: "RejectionReason"}).orderBy("description").list()).map(
                row => ({value: row.enumId, label: row.description})
            )
        },
        // a product's stock unit and the units with a conversion to it
        units() {
            const product = p.productId ? one("mantle.product.Product", {productId: p.productId}) : null
            const ids = unique(
                [product?.amountUomId, p.defaultUnitId].concat(
                    product?.amountUomId
                        ? Array.from(find("moqui.basic.UomConversion", {toUomId: product.amountUomId}).list()).map(
                              row => row.uomId
                          )
                        : []
                )
            )
            const units = namesOf("moqui.basic.Uom", "uomId", "description", ids)
            return ids.map(id => ({value: id, label: units.get(id) || id}))
        },
        // stocked products for an ad hoc receipt, by id or name
        products() {
            let query = find("mantle.product.Product").condition("productTypeEnumId", "in", ["PtAsset", "PtPickAssembly"])
            if (term)
                query = query.condition(
                    cf().makeCondition(
                        [
                            cf().makeCondition("productId", "like", like(term)).ignoreCase(),
                            cf().makeCondition("productName", "like", like(term)).ignoreCase()
                        ],
                        "or"
                    )
                )
            const options = Array.from(query.orderBy("productName").limit(choiceLimit).list()).map(row => ({
                value: row.productId,
                label: (row.productName || row.productId) + " (" + row.productId + ")"
            }))
            if (selected && !options.some(option => option.value === selected)) {
                const product = one("mantle.product.Product", {productId: selected})
                if (product) options.unshift({value: selected, label: (product.productName || selected) + " (" + selected + ")"})
            }
            return options
        }
    }
    if (!sources[p.choice]) throw new Error("Unknown receipt choice " + p.choice)
    return {resultList: sources[p.choice]()}
}

// NewReceipt for a return: the shipment its approval created (ReturnApprovedProcess), never a second one.
function returnReceipt(p) {
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "return", p.returnId)
    const source = Array.from(
        find("mantle.shipment.ShipmentItemSource", {returnId: p.returnId}).orderBy("-shipmentItemSourceId").limit(1).list()
    )[0]
    if (!source)
        denied("RETURN_NO_SHIPMENT", "Return " + p.returnId + " has no shipment yet: it is made when the return is approved")
    return {shipmentId: source.shipmentId}
}

// ===== Supplier360's Warehouse branch =====
function supplierReceiving(p) {
    const userScope = warehouse.required(warehouse.scope())
    const partyId = p.vendorPartyId
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    const visible =
        party &&
        party.disabled !== "Y" &&
        (!party.privateOwnerUserId || party.privateOwnerUserId === ec.user.userId) &&
        !!one("mantle.party.PartyRole", {partyId, roleTypeId: "Supplier"}) &&
        !one("mantle.party.PartyRole", {partyId, roleTypeId: "OrgInternal"})
    if (!visible) denied("SUPPLIER_UNAVAILABLE", "Supplier is not available")
    const organizations = userScope.facilityOwnerIds
    let contacts = {}
    try {
        contacts = lib.call("ironstone.commons.ContactServices.get#ContactRecord", {partyId})
    } catch (error) {
        ec.logger.warn("Supplier " + partyId + " contact record: " + error.message)
    }
    // the open orders of the user's organizations from the supplier
    let orderQuery = find("mantle.order.OrderPart", {vendorPartyId: partyId}).condition("statusId", "in", [
        "OrderPlaced",
        "OrderApproved",
        "OrderSent"
    ])
    if (organizations)
        orderQuery = orderQuery.condition("customerPartyId", "in", organizations.length ? organizations : ["_none_"])
    const parts = Array.from(orderQuery.orderBy("-orderId").limit(50).list())
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        parts.map(part => part.statusId)
    )
    const orderRows = parts.map(part => {
        const items = rows("mantle.order.OrderItem", {orderId: part.orderId, orderPartSeqId: part.orderPartSeqId}).filter(
            item => item.productId
        )
        const ordered = items.reduce((total, item) => total + number(item.quantity), 0)
        const received = items.reduce(
            (total, item) =>
                total +
                rows("mantle.product.receipt.AssetReceipt", {orderId: part.orderId, orderItemSeqId: item.orderItemSeqId}).reduce(
                    (sum, row) => sum + number(row.quantityAccepted) + number(row.quantityRejected),
                    0
                ),
            0
        )
        const expectedDay = part.estimatedDeliveryDate ? lib.bookDay(null, part.estimatedDeliveryDate) : ""
        return {
            orderId: part.orderId,
            orderPartSeqId: part.orderPartSeqId,
            statusText: statuses.get(part.statusId) || part.statusId,
            expectedText: expectedDay || "Not set",
            late: !!expectedDay && expectedDay < todayText(),
            orderedQuantity: ordered,
            receivedQuantity: received,
            outstandingQuantity: Math.max(0, ordered - received)
        }
    })
    // the supplier's receipts at the user's facilities
    const ids = warehouse.facilityIds(userScope)
    const shipmentIds = Array.from(
        find("mantle.shipment.ShipmentAndRouteSegment", {fromPartyId: partyId, shipmentTypeEnumId: "ShpTpPurchase"})
            .condition("destinationFacilityId", ids ? "in" : "is-not-null", ids ? (ids.length ? ids : ["_none_"]) : null)
            .selectField("shipmentId")
            .distinct(true)
            .orderBy("-shipmentId")
            .limit(20)
            .list()
    ).map(row => row.shipmentId)
    const receiptRows = shipmentIds.length
        ? receiptRowsOfShipments(shipmentIds)
              .sort((a, b) => b.receivedSort - a.receivedSort)
              .slice(0, 200)
        : []
    // returns of the user's organizations to the supplier
    let returnQuery = find("mantle.order.return.ReturnHeader", {vendorPartyId: partyId})
    if (organizations)
        returnQuery = returnQuery.condition("customerPartyId", "in", organizations.length ? organizations : ["_none_"])
    const returnStatuses = new Map()
    const returnRows = Array.from(returnQuery.orderBy("-returnId").limit(50).list()).map(row => {
        if (!returnStatuses.has(row.statusId))
            returnStatuses.set(row.statusId, one("moqui.basic.StatusItem", {statusId: row.statusId}))
        return {
            returnId: row.returnId,
            statusText: returnStatuses.get(row.statusId)?.description || row.statusId,
            entryText: dateText(row.entryDate)
        }
    })
    return {
        supplier: {
            partyId,
            supplierName: lib.partyNames([partyId])[partyId] || partyId,
            canEditContact: false
        },
        contactRows: contacts.contactMechList || [],
        addressRows: contacts.addressList || [],
        roleRows: rows("mantle.party.PartyRole", {partyId}).map(role => ({roleTypeId: role.roleTypeId})),
        orderRows,
        receiptRows,
        rejectionRows: receiptRows.filter(row => row.rejectedQuantity > 0),
        returnRows
    }
}
function receiptRowsOfShipments(shipmentIds) {
    return shipmentIds.flatMap(shipmentId =>
        receiptRowsOf(shipmentId).map(row => {
            const receipt = one("mantle.product.receipt.AssetReceipt", {assetReceiptId: row.assetReceiptId})
            return Object.assign(row, {shipmentId, receivedSort: lib.ms(receipt.receivedDate) || 0})
        })
    )
}

const operations = {receipts, receiptDetail, receiveContext, choices, returnReceipt, supplierReceiving}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse receipt operation " + op)
        return operations[op](parameters)
    }
})
