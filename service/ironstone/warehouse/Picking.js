// The Warehouse picking and outgoing shipment screens' reads (impl-warehouse P11, design-warehouse §9, §10 and crosscut §3.6,
// §3.8): Picklists, PicklistDetail, the Pick task (desk and handheld), PickLocationMoves' needs, Shipments, ShipmentDetail's
// outbound branch, OrderDetail's Warehouse branch, the pick sheets and the Today source of the user's overdue picks. Every
// read is limited in the query to the user's Warehouse facilities (a shipment by its first route segment's origin, F55; a
// load and an order part by their facility); the postings are Mantle's (WarehouseTaskServices pick#ShipmentStock,
// record#ShortPick, reverse#Pick, finish#Pick, move#Stock, create#OutgoingShipment; ShipmentWorkServices' wave and load
// edits), which the screens call after AccessServices.check#Record. Order amounts are read only with financial read.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, denied, dateText} = lib
const cf = () => ec.entity.conditionFactory

const LOAD = "mantle.work.effort.WorkEffort",
    SHIPMENT = "mantle.shipment.Shipment",
    SOURCE = "mantle.shipment.ShipmentItemSource",
    EXCEPTION = "mantle.shipment.ShipmentPickException"
const openLoad = ["WeInPlanning", "WeApproved", "WeInProgress"]
const openShipment = ["ShipInput", "ShipScheduled", "ShipPicked", "ShipPacked"]
const pickable = ["ShipInput", "ShipScheduled"]
const incoming = ["ShpTpPurchase", "ShpTpSalesReturn"]
const statusColors = {
    WeInPlanning: "grey-8",
    WeApproved: "primary",
    WeInProgress: "info",
    WeComplete: "positive",
    WeClosed: "positive",
    WeCancelled: "negative",
    ShipInput: "grey-8",
    ShipScheduled: "primary",
    ShipPicked: "info",
    ShipPacked: "info",
    ShipShipped: "positive",
    ShipDelivered: "positive",
    ShipCancelled: "negative"
}
const candidateLimit = 2000
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const like = term => "%" + String(term).replace(/[\\%_]/g, character => "\\" + character) + "%"
const todayText = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const startOfToday = () => ec.l10n.parseTimestamp(todayText() + " 00:00:00", "yyyy-MM-dd HH:mm:ss")

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
const statusTexts = ids => namesOf("moqui.basic.StatusItem", "statusId", "description", ids)
const facilityNames = ids => namesOf("mantle.facility.Facility", "facilityId", "facilityName", ids)
const productNames = ids => namesOf("mantle.product.Product", "productId", "productName", ids)
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
const facilityIdsOf = (userScope, p) => {
    const facility = facilityOf(userScope, p.facilityId)
    return facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
}
const inFacilities = (query, field, ids) => query.condition(field, ids ? "in" : "is-not-null", ids || null)
const pickingOpen = userScope => ["pick", "loadEdit", "move"].some(name => userScope.capabilities[name])

// Each source line's quantity, picked, packed (issued), short and put back, for the shipments given.
function progressOf(shipmentIds) {
    const progress = new Map(shipmentIds.map(id => [id, {quantity: 0, picked: 0, packed: 0, short: 0, putBack: 0, orderIds: new Set()}]))
    if (!shipmentIds.length) return progress
    for (const source of Array.from(find(SOURCE).condition("shipmentId", "in", shipmentIds).list())) {
        if (source.statusId === "SisCancelled") continue
        const row = progress.get(source.shipmentId)
        row.quantity += number(source.quantity)
        row.picked += number(source.quantityPicked)
        row.packed += Math.max(0, number(source.quantity) - number(source.quantityNotHandled))
        row.putBack += number(source.putBackQuantity)
        if (source.orderId) row.orderIds.add(source.orderId)
    }
    for (const exception of Array.from(find(EXCEPTION).condition("shipmentId", "in", shipmentIds).list()))
        progress.get(exception.shipmentId).short += number(exception.quantityShort)
    return progress
}
// The staging bin of a shipment: a line's own bin wins over the shipment's (F18).
function binOf(shipment, sources) {
    const lineBin = sources.find(row => row.binLocationNumber != null)?.binLocationNumber
    return lineBin != null
        ? {bin: number(lineBin), binSource: "line"}
        : {bin: shipment.binLocationNumber == null ? null : number(shipment.binLocationNumber), binSource: "shipment"}
}

// ===== Picklists =====
function picklists(p) {
    const userScope = warehouse.required(warehouse.scope())
    if (!pickingOpen(userScope)) return {picklistRows: [], picklistRowsCount: 0}
    const facilityIds = facilityIdsOf(userScope, p)
    const assigned = p.assigneePartyId
        ? rows("mantle.work.effort.WorkEffortParty", {partyId: p.assigneePartyId}).map(row => row.workEffortId)
        : null
    // a find is used once: the count and the page each make their own
    const loadQuery = () => {
        let query = inFacilities(find(LOAD, {purposeEnumId: "WepShipmentShip"}), "facilityId", facilityIds)
        if (p.statusId === "all") {
            // every status
        } else if (p.statusId) query = query.condition("statusId", p.statusId)
        else query = query.condition("statusId", "in", openLoad)
        if (p.overdue === "Y") query = query.condition("statusId", "in", openLoad).condition("estimatedStartDate", "less", startOfToday())
        if (assigned) query = query.condition("workEffortId", "in", assigned.length ? assigned : ["_none_"])
        if (p.text && String(p.text).trim())
            query = query.condition(cf().makeCondition([
                cf().makeCondition("workEffortId", "like", like(String(p.text).trim())).ignoreCase(),
                cf().makeCondition("workEffortName", "like", like(String(p.text).trim())).ignoreCase()
            ], "or"))
        return query
    }
    const paged = lib.page(loadQuery().orderBy("-estimatedStartDate,workEffortId"), p, "picklistRows", loadQuery().count())
    const loads = paged.rows
    const loadIds = loads.map(row => row.workEffortId)
    const shipments = loadIds.length ? Array.from(find(SHIPMENT).condition("shipWorkEffortId", "in", loadIds).list()) : []
    const progress = progressOf(shipments.map(row => row.shipmentId))
    const people = loadIds.length
        ? Array.from(find("mantle.work.effort.WorkEffortParty").condition("workEffortId", "in", loadIds).list()).filter(row =>
              lib.active(row))
        : []
    const names = lib.partyNames(people.map(row => row.partyId))
    const statuses = statusTexts(loads.map(row => row.statusId))
    const facilities = facilityNames(loads.map(row => row.facilityId))
    const today = todayText()
    const out = Object.assign({}, paged)
    delete out.rows
    out.picklistRows = loads.map(load => {
        const members = shipments.filter(row => row.shipWorkEffortId === load.workEffortId)
        const totals = members.reduce((sum, row) => {
            const one = progress.get(row.shipmentId)
            return {quantity: sum.quantity + one.quantity, picked: sum.picked + one.picked, short: sum.short + one.short}
        }, {quantity: 0, picked: 0, short: 0})
        const startDay = load.estimatedStartDate ? lib.bookDay(null, load.estimatedStartDate) : ""
        return {
            workEffortId: load.workEffortId,
            workEffortName: load.workEffortName || load.workEffortId,
            facilityId: load.facilityId,
            facilityName: facilities.get(load.facilityId) || load.facilityId,
            assigneeText: people.filter(row => row.workEffortId === load.workEffortId).map(row => names[row.partyId] || row.partyId)
                .join(", "),
            startDay,
            startText: startDay || "Not set",
            allDay: true,
            statusId: load.statusId,
            statusText: statuses.get(load.statusId) || load.statusId,
            statusColor: statusColors[load.statusId] || "grey",
            shipmentCount: members.length,
            pickedText: quantityText(totals.picked) + " of " + quantityText(totals.quantity),
            shortQuantity: totals.short,
            overdue: openLoad.includes(load.statusId) && !!startDay && startDay < today,
            calendarTitle: (load.workEffortName || load.workEffortId) + " · " + members.length + " shipments"
        }
    })
    out.canEdit = !!userScope.capabilities.loadEdit
    return out
}

// ===== PicklistDetail =====
function picklistDetail(p) {
    const userScope = warehouse.required(warehouse.scope())
    if (!pickingOpen(userScope)) denied("RECORD_UNAVAILABLE", "Picklist " + p.workEffortId + " is not available")
    const record = warehouse.recordOf(userScope, "load", p.workEffortId)
    const load = one(LOAD, {workEffortId: p.workEffortId})
    const shipments = rows(SHIPMENT, {shipWorkEffortId: load.workEffortId}).sort((a, b) =>
        String(a.shipmentId).localeCompare(String(b.shipmentId)))
    const progress = progressOf(shipments.map(row => row.shipmentId))
    const segments = shipments.length
        ? Array.from(find("mantle.shipment.ShipmentRouteSegment").condition("shipmentId", "in", shipments.map(r => r.shipmentId))
            .orderBy("shipmentId,shipmentRouteSegmentSeqId").list())
        : []
    const names = lib.partyNames(shipments.map(row => row.toPartyId))
    const statuses = statusTexts(shipments.map(row => row.statusId).concat([load.statusId]))
    const shipmentRows = shipments.map(shipment => {
        const sources = rows(SOURCE, {shipmentId: shipment.shipmentId})
        const segment = segments.find(row => row.shipmentId === shipment.shipmentId)
        const totals = progress.get(shipment.shipmentId)
        return Object.assign(binOf(shipment, sources), {
            shipmentId: shipment.shipmentId,
            customerName: names[shipment.toPartyId] || shipment.toPartyId || "",
            orderText: [...totals.orderIds].join(", "),
            carrierText: [segment?.carrierPartyId && segment.carrierPartyId !== "_NA_" ? segment.carrierPartyId : "",
                segment?.shipmentMethodEnumId || ""].filter(Boolean).join(" · "),
            dueText: shipment.estimatedShipDate ? lib.bookDay(null, shipment.estimatedShipDate) : "",
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            statusColor: statusColors[shipment.statusId] || "grey",
            quantity: totals.quantity,
            picked: totals.picked,
            short: totals.short,
            readiness: totals.quantity > 0 && totals.picked >= totals.quantity ? "Picked"
                : totals.short > 0 ? "Short" : totals.picked > 0 ? "Picking" : "Not started",
            canRemove: pickable.includes(shipment.statusId) && totals.picked === 0
        })
    })
    const people = rows("mantle.work.effort.WorkEffortParty", {workEffortId: load.workEffortId})
    const peopleNames = lib.partyNames(people.map(row => row.partyId))
    const equipment = rows("mantle.work.effort.WorkEffortAssetAssign", {workEffortId: load.workEffortId})
    const assets = namesOf("mantle.product.asset.Asset", "assetId", "assetName", equipment.map(row => row.assetId))
    const outstanding = shipmentRows.filter(row => pickable.includes(row.statusId))
    const startDay = load.estimatedStartDate ? lib.bookDay(null, load.estimatedStartDate) : ""
    const closed = !openLoad.includes(load.statusId)
    return {
        found: true,
        load: {
            workEffortId: load.workEffortId,
            workEffortName: load.workEffortName || load.workEffortId,
            description: load.description || "",
            facilityId: load.facilityId,
            facilityName: record.facilityName,
            statusId: load.statusId,
            statusText: statuses.get(load.statusId) || load.statusId,
            statusColor: statusColors[load.statusId] || "grey",
            startText: startDay || "Not set",
            endText: load.estimatedCompletionDate ? lib.bookDay(null, load.estimatedCompletionDate) : "",
            estimatedStartDate: load.estimatedStartDate,
            estimatedCompletionDate: load.estimatedCompletionDate,
            overdue: !closed && !!startDay && startDay < todayText(),
            closed
        },
        shipmentRows,
        peopleRows: people.map(row => ({
            partyId: row.partyId,
            partyName: peopleNames[row.partyId] || row.partyId,
            roleTypeId: row.roleTypeId,
            roleText: row.roleTypeId === "Manager" ? "Supervisor" : row.roleTypeId === "Worker" ? "Picker" : row.roleTypeId,
            fromDate: row.fromDate,
            fromText: dateText(row.fromDate),
            thruText: row.thruDate ? dateText(row.thruDate) : "",
            active: lib.active(row)
        })),
        equipmentRows: equipment.map(row => ({
            assetId: row.assetId,
            assetName: assets.get(row.assetId) || row.assetId,
            fromDate: row.fromDate,
            fromText: dateText(row.fromDate),
            thruText: row.thruDate ? dateText(row.thruDate) : "",
            statusText: row.statusId === "WeaaAssigned" ? "Assigned" : row.statusId || "",
            active: lib.active(row)
        })),
        outstandingText: outstanding.map(row => row.shipmentId + " (" + row.readiness.toLowerCase() + ")").join(", "),
        completion: {
            shipments: shipmentRows.length,
            picked: shipmentRows.filter(row => !pickable.includes(row.statusId)).length,
            short: shipmentRows.reduce((sum, row) => sum + row.short, 0),
            remaining: outstanding.length
        },
        canEdit: !!userScope.capabilities.loadEdit && !closed,
        canPick: !!userScope.capabilities.pick && !closed
    }
}

// ===== the Pick task =====
// The lines to pick of a load (its shipments not picked yet) or of one shipment, in pick-location order: each line's
// product, the locations its reservations hold stock at, its staging bin, what is left to pick, picked, short, and the
// quantity flagged to put back. currentLine is the first line with something left that is not short.
function pickContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const out = {lines: [], putBackRows: [], currentLine: null, found: false, canPick: !!userScope.capabilities.pick}
    if (!p.workEffortId && !p.shipmentId) return out
    // the Picking area's groups only, also through Handheld/Pick, which is open to every Warehouse user (P11 review A2)
    if (!pickingOpen(userScope)) denied("PERMISSION_DENIED", "Picking needs the pick, pick supervisor or move permission")
    let shipments
    let facilityId
    if (p.workEffortId) {
        const record = warehouse.recordOf(userScope, "load", p.workEffortId)
        const load = one(LOAD, {workEffortId: p.workEffortId})
        facilityId = load.facilityId
        out.title = (load.workEffortName || load.workEffortId) + " · " + record.facilityName
        out.workEffortId = load.workEffortId
        shipments = rows(SHIPMENT, {shipWorkEffortId: load.workEffortId}).filter(row => openShipment.includes(row.statusId))
    } else {
        warehouse.recordOf(userScope, "shipment", p.shipmentId)
        const shipment = one(SHIPMENT, {shipmentId: p.shipmentId})
        const segment = Array.from(find("mantle.shipment.ShipmentRouteSegment", {shipmentId: p.shipmentId})
            .orderBy("shipmentRouteSegmentSeqId").limit(1).list())[0]
        const facility = segment?.originFacilityId ? one("mantle.facility.Facility", {facilityId: segment.originFacilityId}) : null
        if (incoming.includes(shipment.shipmentTypeEnumId) || shipment.shipmentTypeEnumId === "ShpTpDrop" ||
            !warehouse.inScope(userScope, facility))
            denied("RECORD_UNAVAILABLE", "Shipment " + p.shipmentId + " is not picked here")
        facilityId = facility.facilityId
        out.title = "Shipment " + shipment.shipmentId + " · " + facility.facilityName
        out.shipmentId = shipment.shipmentId
        shipments = [shipment]
    }
    out.found = true
    out.facilityId = facilityId
    const locations = new Map(rows("mantle.facility.FacilityLocation", {facilityId}).map(row => [row.locationSeqId, row]))
    const products = productNames(shipments.flatMap(row => rows(SOURCE, {shipmentId: row.shipmentId}).map(s => s.productId)))
    for (const shipment of shipments) {
        const sources = rows(SOURCE, {shipmentId: shipment.shipmentId}).filter(row => row.statusId !== "SisCancelled")
        const shipmentBin = binOf(shipment, [])
        for (const source of sources) {
            const reservations = source.orderId
                ? rows("mantle.product.issuance.AssetReservation", {orderId: source.orderId, orderItemSeqId: source.orderItemSeqId})
                    .filter(row => number(row.quantityNotIssued) > 0)
                : []
            const held = new Map()
            for (const reservation of reservations) {
                const asset = one("mantle.product.asset.Asset", {assetId: reservation.assetId})
                if (!asset || asset.facilityId !== facilityId || (shipment.pickContainerId && asset.containerId === shipment.pickContainerId))
                    continue
                const keyOf = asset.locationSeqId || ""
                const row = held.get(keyOf) || {locationSeqId: asset.locationSeqId || null, quantity: 0, lotId: asset.lotId || null,
                    assetId: asset.assetId}
                row.quantity += Math.max(0, number(reservation.quantityNotIssued) - number(reservation.quantityNotAvailable))
                held.set(keyOf, row)
            }
            const heldRows = [...held.values()].filter(row => row.quantity > 0).sort((a, b) =>
                number(locations.get(a.locationSeqId)?.sequenceNum) - number(locations.get(b.locationSeqId)?.sequenceNum) ||
                String(a.locationSeqId).localeCompare(String(b.locationSeqId)))
            const short = rows(EXCEPTION, {shipmentItemSourceId: source.shipmentItemSourceId})
                .reduce((sum, row) => sum + number(row.quantityShort), 0)
            const toPick = Math.max(0, number(source.quantity) - number(source.quantityPicked))
            const first = heldRows[0]
            const line = {
                shipmentId: shipment.shipmentId,
                shipmentItemSourceId: source.shipmentItemSourceId,
                productId: source.productId,
                productName: products.get(source.productId) || source.productId,
                orderId: source.orderId || "",
                locationSeqId: first?.locationSeqId || null,
                locationText: heldRows.map(row => (row.locationSeqId || "no location") + " (" + quantityText(row.quantity) + ")")
                    .join(", ") || "Not reserved",
                assetId: first?.assetId || null,
                lotId: first?.lotId || null,
                bin: source.binLocationNumber != null ? number(source.binLocationNumber) : shipmentBin.bin,
                containerId: shipment.pickContainerId || null,
                quantity: number(source.quantity),
                toPick,
                picked: number(source.quantityPicked),
                short,
                open: Math.max(0, toPick - short),
                putBack: number(source.putBackQuantity),
                pickable: pickable.includes(shipment.statusId),
                sequence: number(locations.get(first?.locationSeqId)?.sequenceNum),
                statusText: toPick === 0 ? "Picked" : short >= toPick ? "Short" : short > 0 ? "Part short" : "To pick"
            }
            out.lines.push(line)
            if (line.putBack > 0) out.putBackRows.push(line)
        }
    }
    out.lines.sort((a, b) => a.sequence - b.sequence || String(a.locationSeqId).localeCompare(String(b.locationSeqId)) ||
        String(a.shipmentItemSourceId).localeCompare(String(b.shipmentItemSourceId)))
    out.currentLine = out.lines.find(line => line.pickable && line.open > 0) || null
    out.remainingLines = out.lines.filter(line => line.open > 0).length
    out.shortReasons = rows("moqui.basic.Enumeration", {enumTypeId: "ShortPickReason"})
        .sort((a, b) => number(a.sequenceNum) - number(b.sequenceNum)).map(row => ({value: row.enumId, label: row.description}))
    out.resolutions = rows("moqui.basic.Enumeration", {enumTypeId: "ShortPickResolution"})
        .sort((a, b) => number(a.sequenceNum) - number(b.sequenceNum)).map(row => ({value: row.enumId, label: row.description}))
    out.finishable = shipments.filter(row => pickable.includes(row.statusId)).map(row => row.shipmentId)
    return out
}

// ===== PickLocationMoves =====
// PickFaceNeeds: reservations of the facility's open orders on stock outside pick locations, with the product's pick face
// and its stock there; BelowMinimum is Mantle's find#PickFaceReplenishment, run as a probe (its refusal is the message).
const needLimit = 200
function pickFaceNeeds(p) {
    const userScope = warehouse.required(warehouse.scope())
    // the Picking area's groups only, also through Handheld/PickFace (P11 review A2)
    if (!pickingOpen(userScope)) denied("PERMISSION_DENIED", "Pick-face moves need the pick, pick supervisor or move permission")
    const facility = facilityOf(userScope, p.facilityId)
    const out = {needRows: [], faceRows: [], sourceRows: [], faceError: null, facilityId: facility?.facilityId || null,
        canMove: !!userScope.capabilities.move}
    if (!facility) return out
    const locations = new Map(rows("mantle.facility.FacilityLocation", {facilityId: facility.facilityId}).map(row =>
        [row.locationSeqId, row]))
    const isOpen = row => !row.thruDate || lib.ms(row.thruDate) > lib.ms(ec.user.nowTimestamp)
    const notPick = [...locations.values()].filter(row => row.locationTypeEnumId !== "FltPick" && isOpen(row))
        .map(row => row.locationSeqId)
    // the reservations on stock at the facility's open locations that are not pick locations, in one query
    const reservations = notPick.length
        ? Array.from(find("mantle.product.issuance.AssetAndReservation", {facilityId: facility.facilityId})
            .condition("locationSeqId", "in", notPick).condition("quantityNotIssued", "greater", 0)
            .orderBy("reservedDate,assetReservationId").limit(needLimit + 1).list())
        : []
    out.needTruncated = reservations.length > needLimit
    const products = productNames(reservations.map(row => row.productId))
    for (const reservation of reservations.slice(0, needLimit)) {
        const asset = reservation
        const face = rows("mantle.facility.ProductFacilityLocation", {productId: reservation.productId, facilityId: facility.facilityId})
            .find(row => locations.get(row.locationSeqId)?.locationTypeEnumId === "FltPick" && isOpen(locations.get(row.locationSeqId)))
        const faceStock = face
            ? rows("mantle.product.asset.Asset", {productId: reservation.productId, facilityId: facility.facilityId,
                locationSeqId: face.locationSeqId}).reduce((sum, row) => sum + number(row.quantityOnHandTotal), 0)
            : 0
        out.needRows.push({
            assetReservationId: reservation.assetReservationId,
            orderId: reservation.orderId,
            productId: reservation.productId,
            productName: products.get(reservation.productId) || reservation.productId,
            assetId: asset.assetId,
            fromLocationSeqId: asset.locationSeqId,
            toLocationSeqId: face?.locationSeqId || null,
            pickStock: faceStock,
            quantity: number(reservation.quantityNotIssued)
        })
    }
    try {
        const found = lib.probe("mantle.shipment.WarehouseTaskServices.find#PickFaceReplenishment", {facilityId: facility.facilityId})
        out.faceRows = Array.from(found.faceRows || [])
        // one Replenish per bulk source, each its share of the suggestion within that asset's stock (P11 review A1)
        out.sourceRows = out.faceRows.flatMap(face => Array.from(face.sources || [])
            .filter(source => number(source.moveQuantity) > 0)
            .map(source => ({
                productId: face.productId,
                productName: face.productName,
                locationSeqId: face.locationSeqId,
                currentQuantity: face.currentQuantity,
                minimumStock: face.minimumStock,
                suggestedQuantity: face.suggestedQuantity,
                sourceAssetId: source.assetId,
                sourceLocationSeqId: source.locationSeqId,
                sourceLotId: source.lotId,
                available: source.available,
                moveQuantity: source.moveQuantity
            })))
        out.faceTruncated = !!found.truncated
    } catch (error) {
        out.faceError = String(error.message || error).replace(/^(Error: )+/, "")
    }
    return out
}

// ===== Shipments =====
function shipmentQuery(userScope, p) {
    const ids = facilityIdsOf(userScope, p)
    let query = inFacilities(find("mantle.shipment.ShipmentAndRouteSegment"), "originFacilityId", ids)
        .condition("shipmentTypeEnumId", "not-in", incoming)
    // drop shipments show only under the type filter (Purchasing and Sales own them; read only here)
    if (p.shipmentTypeEnumId) query = query.condition("shipmentTypeEnumId", p.shipmentTypeEnumId)
    else query = query.condition("shipmentTypeEnumId", "not-equals", "ShpTpDrop")
    if (p.statusId === "all") {
        // every status
    } else if (p.statusId) query = query.condition("statusId", p.statusId)
    else query = query.condition("statusId", "in", openShipment)
    if (p.customerPartyId) query = query.condition("toPartyId", p.customerPartyId)
    if (p.carrierPartyId) query = query.condition("carrierPartyId", p.carrierPartyId)
    if (p.overdue === "Y")
        query = query.condition("statusId", "in", openShipment).condition("estimatedShipDate", "less", startOfToday())
    if (p.text && String(p.text).trim()) query = query.condition(cf().makeCondition("shipmentId", "like", like(String(p.text).trim())).ignoreCase())
    return query
}
function shipmentList(p) {
    const userScope = warehouse.required(warehouse.scope())
    // the newest candidates when more match than are read (P11 review C)
    const candidates = Array.from(shipmentQuery(userScope, p).selectField("shipmentId").distinct(true).orderBy("-shipmentId")
        .limit(candidateLimit).list()).map(row => row.shipmentId)
    // the first route segment is the shipment's origin (F55): keep those that leave from the user's facilities
    const ids = facilityIdsOf(userScope, p)
    const origins = new Map()
    if (candidates.length)
        for (const segment of Array.from(find("mantle.shipment.ShipmentRouteSegment").condition("shipmentId", "in", candidates)
            .orderBy("shipmentId,-shipmentRouteSegmentSeqId").list()))
            origins.set(segment.shipmentId, segment)
    const kept = candidates.filter(id => origins.get(id)?.originFacilityId && (!ids || ids.includes(origins.get(id).originFacilityId)))
    const query = find(SHIPMENT).condition("shipmentId", "in", kept.length ? kept : ["_none_"])
        .orderBy("estimatedShipDate,shipmentId")
    const paged = lib.page(query, p, "shipmentRows", kept.length)
    const progress = progressOf(paged.rows.map(row => row.shipmentId))
    const names = lib.partyNames(paged.rows.map(row => row.toPartyId))
    const statuses = statusTexts(paged.rows.map(row => row.statusId))
    const types = namesOf("moqui.basic.Enumeration", "enumId", "description", paged.rows.map(row => row.shipmentTypeEnumId))
    const facilities = facilityNames(paged.rows.map(row => origins.get(row.shipmentId)?.originFacilityId))
    const today = todayText()
    const out = Object.assign({}, paged)
    delete out.rows
    out.shipmentRows = paged.rows.map(shipment => {
        const totals = progress.get(shipment.shipmentId)
        const origin = origins.get(shipment.shipmentId)
        const day = shipment.estimatedShipDate ? lib.bookDay(null, shipment.estimatedShipDate) : ""
        return {
            shipmentId: shipment.shipmentId,
            typeText: types.get(shipment.shipmentTypeEnumId) || shipment.shipmentTypeEnumId,
            dropShip: shipment.shipmentTypeEnumId === "ShpTpDrop",
            partyName: names[shipment.toPartyId] || shipment.toPartyId || "",
            sourceText: [...totals.orderIds].join(", "),
            facilityName: facilities.get(origin?.originFacilityId) || origin?.originFacilityId || "",
            scheduledDay: day,
            scheduledText: day || "Not set",
            allDay: true,
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            statusColor: statusColors[shipment.statusId] || "grey",
            pickedText: quantityText(totals.picked) + " of " + quantityText(totals.quantity),
            packedText: quantityText(totals.packed) + " of " + quantityText(totals.quantity),
            shipped: ["ShipShipped", "ShipDelivered"].includes(shipment.statusId),
            exceptionText: [totals.short > 0 ? "Short " + quantityText(totals.short) : "",
                totals.putBack > 0 ? "Put back " + quantityText(totals.putBack) : ""].filter(Boolean).join(" · "),
            loadId: shipment.shipWorkEffortId || "",
            overdue: openShipment.includes(shipment.statusId) && !!day && day < today,
            calendarTitle: shipment.shipmentId + " · " + (names[shipment.toPartyId] || shipment.toPartyId || "")
        }
    })
    out.shipmentRowsTruncated = candidates.length >= candidateLimit
    return out
}

// ===== ShipmentDetail's outbound branch =====
function outboundDetail(p) {
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "shipment", p.shipmentId)
    const shipment = one(SHIPMENT, {shipmentId: p.shipmentId})
    const segments = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: p.shipmentId}).sort((a, b) =>
        String(a.shipmentRouteSegmentSeqId).localeCompare(String(b.shipmentRouteSegmentSeqId)))
    const facility = segments[0]?.originFacilityId ? one("mantle.facility.Facility", {facilityId: segments[0].originFacilityId}) : null
    if (incoming.includes(shipment.shipmentTypeEnumId) || !warehouse.inScope(userScope, facility))
        denied("RECORD_UNAVAILABLE", "Shipment " + p.shipmentId + " does not leave from a facility you work in")
    const sources = rows(SOURCE, {shipmentId: shipment.shipmentId}).filter(row => row.statusId !== "SisCancelled")
    const products = productNames(sources.map(row => row.productId))
    const exceptions = rows(EXCEPTION, {shipmentId: shipment.shipmentId})
    const issuances = rows("mantle.product.issuance.AssetIssuance", {shipmentId: shipment.shipmentId})
    const can = userScope.capabilities
    const financial = !!can.financialRead
    const dropShip = shipment.shipmentTypeEnumId === "ShpTpDrop"
    const lineRows = sources.map(source => {
        const item = source.orderId ? one("mantle.order.OrderItem", {orderId: source.orderId, orderItemSeqId: source.orderItemSeqId}) : null
        const reserved = source.orderId
            ? rows("mantle.product.issuance.AssetReservation", {orderId: source.orderId, orderItemSeqId: source.orderItemSeqId})
                .reduce((sum, row) => sum + number(row.quantityNotIssued), 0)
            : 0
        const short = exceptions.filter(row => row.shipmentItemSourceId === source.shipmentItemSourceId)
            .reduce((sum, row) => sum + number(row.quantityShort), 0)
        return {
            shipmentItemSourceId: source.shipmentItemSourceId,
            productId: source.productId,
            productName: products.get(source.productId) || source.productId,
            sourceText: source.orderId ? source.orderId + ":" + source.orderItemSeqId : source.returnId || "",
            orderId: source.orderId || null,
            quantity: number(source.quantity),
            reserved,
            picked: number(source.quantityPicked),
            packed: Math.max(0, number(source.quantity) - number(source.quantityNotHandled)),
            short,
            putBack: number(source.putBackQuantity),
            bin: source.binLocationNumber == null ? null : number(source.binLocationNumber),
            // money only with financial read, left out of the answer otherwise (§2)
            unitAmountText: financial && item?.unitAmount != null ? ec.l10n.formatCurrency(item.unitAmount, null) : null
        }
    })
    const packages = rows("mantle.shipment.ShipmentPackage", {shipmentId: shipment.shipmentId})
    const statuses = statusTexts([shipment.statusId])
    const type = one("moqui.basic.Enumeration", {enumId: shipment.shipmentTypeEnumId})
    const names = lib.partyNames([shipment.toPartyId, shipment.fromPartyId])
    return {
        outboundFound: true,
        outbound: {
            shipmentId: shipment.shipmentId,
            typeText: type?.description || shipment.shipmentTypeEnumId,
            dropShip,
            toName: names[shipment.toPartyId] || shipment.toPartyId || "",
            fromName: names[shipment.fromPartyId] || shipment.fromPartyId || "",
            facilityId: facility.facilityId,
            facilityName: facility.facilityName || facility.facilityId,
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            statusColor: statusColors[shipment.statusId] || "grey",
            scheduledText: shipment.estimatedShipDate ? lib.bookDay(null, shipment.estimatedShipDate) : "Not set",
            loadId: shipment.shipWorkEffortId || null,
            bin: binOf(shipment, sources).bin,
            pickContainerId: shipment.pickContainerId || null,
            orderIds: unique(sources.map(row => row.orderId)),
            canPick: !!can.pick && !dropShip && pickable.includes(shipment.statusId),
            canPutBack: !!can.pick && !dropShip && lineRows.some(row => row.putBack > 0),
            financialRead: financial
        },
        lineRows,
        packageRows: packages.map(row => ({
            shipmentPackageSeqId: row.shipmentPackageSeqId,
            weightText: row.weight == null ? "" : quantityText(row.weight),
            boxTypeEnumId: row.boxTypeEnumId || ""
        })),
        routeRows: segments.map(row => ({
            shipmentRouteSegmentSeqId: row.shipmentRouteSegmentSeqId,
            carrierText: row.carrierPartyId && row.carrierPartyId !== "_NA_" ? row.carrierPartyId : "No carrier",
            methodText: row.shipmentMethodEnumId || "",
            trackingText: row.trackingIdNumber || "",
            originFacilityId: row.originFacilityId || "",
            // freight cost only with financial read
            costText: financial && row.actualCost != null ? ec.l10n.formatCurrency(row.actualCost, row.costUomId) : null
        })),
        issuanceCount: issuances.length
    }
}

// ===== OrderDetail's Warehouse branch =====
// An order with a part shipping from one of the user's facilities: its header, open holds, the parts at those facilities
// with each line's ordered, reserved, on shipments, picked and shipped quantities, its shipments, and (financial read
// only) the amounts. A held order gets no new shipment (canCreateShipment false).
function orderFulfillment(p) {
    const userScope = warehouse.required(warehouse.scope())
    const header = p.orderId ? one("mantle.order.OrderHeader", {orderId: p.orderId}) : null
    const parts = header ? rows("mantle.order.OrderPart", {orderId: p.orderId}) : []
    const ownParts = parts.filter(part => part.facilityId && warehouse.inScope(userScope,
        one("mantle.facility.Facility", {facilityId: part.facilityId})))
    if (!header || !ownParts.length) denied("RECORD_UNAVAILABLE", "Order " + (p.orderId || "") + " is not available")
    const financial = !!userScope.capabilities.financialRead
    const holds = rows("mantle.order.OrderHoldReason", {orderId: p.orderId}).filter(row => !row.releasedDate)
    const holdTypes = namesOf("moqui.basic.Enumeration", "enumId", "description", holds.map(row => row.holdTypeEnumId))
    const held = header.statusId === "OrderHold" || holds.length > 0
    const partIds = ownParts.map(part => part.orderPartSeqId)
    const items = rows("mantle.order.OrderItem", {orderId: p.orderId}).filter(item => partIds.includes(item.orderPartSeqId) &&
        item.productId)
    const products = productNames(items.map(row => row.productId))
    const sources = rows(SOURCE, {orderId: p.orderId})
    const shipmentIds = unique(sources.map(row => row.shipmentId))
    // only the shipments that leave from or reach one of the user's facilities (F55)
    const shipmentFacilities = new Map()
    if (shipmentIds.length)
        for (const segment of Array.from(find("mantle.shipment.ShipmentRouteSegment").condition("shipmentId", "in", shipmentIds).list()))
            shipmentFacilities.set(segment.shipmentId, (shipmentFacilities.get(segment.shipmentId) || [])
                .concat([segment.originFacilityId, segment.destinationFacilityId].filter(Boolean)))
    const ownShipmentIds = shipmentIds.filter(id => (shipmentFacilities.get(id) || []).some(facilityId =>
        warehouse.inScope(userScope, one("mantle.facility.Facility", {facilityId}))))
    const shipments = ownShipmentIds.length ? Array.from(find(SHIPMENT).condition("shipmentId", "in", ownShipmentIds).list()) : []
    const statuses = statusTexts(shipments.map(row => row.statusId).concat([header.statusId]))
    const names = lib.partyNames(ownParts.map(part => part.customerPartyId))
    return {
        orderFound: true,
        order: {
            orderId: header.orderId,
            orderName: header.orderName || "",
            statusId: header.statusId,
            statusText: statuses.get(header.statusId) || header.statusId,
            customerName: names[ownParts[0].customerPartyId] || ownParts[0].customerPartyId || "",
            entryText: header.entryDate ? lib.bookDay(null, header.entryDate) : "",
            held,
            holdText: holds.map(row => (holdTypes.get(row.holdTypeEnumId) || row.holdTypeEnumId) +
                (row.holdComment ? ": " + row.holdComment : "")).join("; "),
            totalText: financial && header.grandTotal != null ? ec.l10n.formatCurrency(header.grandTotal, header.currencyUomId) : null,
            financialRead: financial
        },
        partRows: ownParts.map(part => ({
            orderPartSeqId: part.orderPartSeqId,
            facilityId: part.facilityId,
            statusId: part.statusId,
            canCreateShipment: !held && part.statusId === "OrderApproved" && !!userScope.capabilities.loadEdit
        })),
        itemRows: items.map(item => {
            // reservations, sources and issuances are in the stock unit, the line in its own (F186)
            const factor = number(lib.call("mantle.order.OrderServices.get#OrderItemStockFactor", {orderItem: item}).stockFactor) || 1
            const itemSources = sources.filter(row => row.orderItemSeqId === item.orderItemSeqId)
            const reserved = rows("mantle.product.issuance.AssetReservation", {orderId: item.orderId, orderItemSeqId: item.orderItemSeqId})
                .reduce((sum, row) => sum + number(row.quantityNotIssued), 0)
            const issued = rows("mantle.product.issuance.AssetIssuance", {orderId: item.orderId, orderItemSeqId: item.orderItemSeqId})
                .reduce((sum, row) => sum + number(row.quantity), 0)
            return {
                orderItemSeqId: item.orderItemSeqId,
                orderPartSeqId: item.orderPartSeqId,
                productId: item.productId,
                productName: products.get(item.productId) || item.itemDescription || item.productId,
                quantity: number(item.quantity),
                cancelled: number(item.quantityCancelled),
                reserved: reserved / factor,
                onShipments: itemSources.reduce((sum, row) => sum + number(row.quantity), 0) / factor,
                picked: itemSources.reduce((sum, row) => sum + number(row.quantityPicked), 0) / factor,
                shipped: issued / factor,
                outstanding: Math.max(0, number(item.quantity) - issued / factor),
                amountText: financial && item.unitAmount != null
                    ? ec.l10n.formatCurrency(number(item.unitAmount) * number(item.quantity), header.currencyUomId) : null
            }
        }),
        shipmentRows: shipments.map(row => ({
            shipmentId: row.shipmentId,
            statusText: statuses.get(row.statusId) || row.statusId,
            statusColor: statusColors[row.statusId] || "grey",
            loadId: row.shipWorkEffortId || ""
        }))
    }
}

// ===== choices =====
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim().toLowerCase()
    const matches = label => !term || String(label).toLowerCase().includes(term)
    const facility = facilityOf(userScope, p.facilityId)
    const sources = {
        // people of the facility owner's organization (pickers and supervisors)
        people: () => {
            if (!facility) return []
            const related = rows("mantle.party.PartyRelationship", {toPartyId: facility.ownerPartyId}).filter(row => lib.active(row))
            const names = lib.partyNames(related.map(row => row.fromPartyId))
            return unique(related.map(row => row.fromPartyId)).filter(id => one("mantle.party.Person", {partyId: id}))
                .map(id => ({value: id, label: names[id] || id})).filter(row => matches(row.label)).slice(0, 30)
        },
        // equipment at the facility that has not left
        equipment: () => facility
            ? rows("mantle.product.asset.Asset", {facilityId: facility.facilityId})
                .filter(row => row.assetTypeEnumId && !["AstTpInventory", "AstTpSupplies"].includes(row.assetTypeEnumId) &&
                    !["AstDeactivated", "AstDelivered"].includes(row.statusId) && !row.actualEndOfLife)
                .map(row => ({value: row.assetId, label: (row.assetName || row.assetId) + " · " + row.assetId}))
                .filter(row => matches(row.label)).slice(0, 30)
            : [],
        locations: () => facility
            ? rows("mantle.facility.FacilityLocation", {facilityId: facility.facilityId}).filter(row => !row.thruDate)
                .map(row => ({value: row.locationSeqId, label: row.locationSeqId + (row.description ? " · " + row.description : "")}))
                .filter(row => matches(row.label)).slice(0, 50)
            : [],
        shortReasons: () => rows("moqui.basic.Enumeration", {enumTypeId: "ShortPickReason"})
            .map(row => ({value: row.enumId, label: row.description})),
        resolutions: () => rows("moqui.basic.Enumeration", {enumTypeId: "ShortPickResolution"})
            .map(row => ({value: row.enumId, label: row.description}))
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Warehouse picking choice " + p.choice)
    return {options: sources[p.choice]()}
}

// ===== Today and Home =====
// The loads assigned to the user (WorkEffortParty) that are still open from an earlier day: the shell's Today shows a load
// as an event on its start day only (F42), so these are the overdue picks.
function todayLoads() {
    const userScope = warehouse.scope()
    const partyId = ec.user.userAccount?.partyId
    if (!userScope.read || !partyId || !pickingOpen(userScope)) return []
    const assigned = rows("mantle.work.effort.WorkEffortParty", {partyId}).filter(row => lib.active(row)).map(row => row.workEffortId)
    if (!assigned.length) return []
    const ids = warehouse.facilityIds(userScope)
    const loads = Array.from(inFacilities(find(LOAD, {purposeEnumId: "WepShipmentShip"}), "facilityId", ids)
        .condition("workEffortId", "in", unique(assigned)).condition("statusId", "in", openLoad)
        .condition("estimatedStartDate", "less", startOfToday()).orderBy("estimatedStartDate").limit(50).list())
    return loads.map(load => ({
        kind: "warehousePick",
        title: "Pick " + (load.workEffortName || load.workEffortId) + " (from " + lib.bookDay(null, load.estimatedStartDate) + ")",
        url: "/qapps/Warehouse/Picking/PicklistDetail?workEffortId=" + encodeURIComponent(load.workEffortId),
        dueDate: load.estimatedStartDate
    }))
}
// Home's picking queue at the facility: ready (open loads), waiting (unpicked shipments on no load), late (open loads from
// an earlier day).
function homeQueue(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) return {}
    const loads = find(LOAD, {purposeEnumId: "WepShipmentShip", facilityId: facility.facilityId}).condition("statusId", "in", openLoad)
    const ready = loads.count()
    const late = find(LOAD, {purposeEnumId: "WepShipmentShip", facilityId: facility.facilityId}).condition("statusId", "in", openLoad)
        .condition("estimatedStartDate", "less", startOfToday()).count()
    const waiting = Array.from(find("mantle.shipment.ShipmentAndRouteSegment", {originFacilityId: facility.facilityId})
        .condition("statusId", "in", pickable).condition("shipmentTypeEnumId", "not-in", incoming.concat(["ShpTpDrop"]))
        .condition("shipWorkEffortId", "is-null", null).selectField("shipmentId").distinct(true).limit(candidateLimit).list()).length
    return {readyCount: ready, waitingCount: waiting, lateCount: late}
}

const operations = {picklists, picklistDetail, pickContext, pickFaceNeeds, shipmentList, outboundDetail, orderFulfillment,
    choices, todayLoads, homeQueue}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse picking operation " + op)
        return operations[op](parameters)
    }
})
