// The Warehouse transfer and stock request screens' reads (impl-warehouse P15, design-warehouse §8, crosscut §3.8 transfer and
// subcontract rows, §3.11 InventoryRequestProgress): the transfers of the user's facilities (TransferFind and TransferList,
// with the custody at supplier filter and the company stock suppliers hold), one transfer with its lines, issuances, moves and
// receipts (TransferShipmentDetail and SubcontractShipmentDetail, Shared/ShipmentDetail's transfer branch, and the transfer
// sheet), the choices of NewTransfer and the allocation, the stock requests of the user's facilities (StockRequestFind and
// StockRequestList) and one request with Mantle's progress (Shared/RequestDetail's Warehouse branch). Every read is limited to
// the user's Warehouse facilities in the query (a transfer by its route segment's origin or destination, F55); a line's sent
// and received quantities are summed apart (F37). The postings are Mantle's guarded entry points, which the screens call after
// AccessServices.check#Record. No cost is read here: a receipt's cost is carried by Mantle and shown nowhere on these screens.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, call, denied, dateText} = lib
const cf = () => ec.entity.conditionFactory

const openStatuses = ["ShipInput", "ShipScheduled", "ShipPicked", "ShipPacked", "ShipShipped"]
const sendingStatuses = ["ShipInput", "ShipScheduled", "ShipPicked"]
const statusColors = {
    ShipInput: "grey-8",
    ShipScheduled: "primary",
    ShipPicked: "primary",
    ShipPacked: "primary",
    ShipShipped: "info",
    ShipDelivered: "positive",
    ShipCancelled: "negative"
}
const requestOpenStatuses = ["ReqDraft", "ReqSubmitted", "ReqReviewed", "ReqInProgress"]
const requestColors = {ReqDraft: "grey-8", ReqSubmitted: "primary", ReqReviewed: "primary", ReqInProgress: "info",
    ReqCompleted: "positive", ReqCancelled: "negative"}
const candidateLimit = 2000
const choiceLimit = 30
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const like = term => "%" + String(term).replace(/[\\%_]/g, character => "\\" + character) + "%"

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(
        Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField] || row[field]])
    )
}
function statusText(statusId) {
    return statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : ""
}
function startOfToday() {
    return ec.l10n.parseTimestamp(ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd") + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
}
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
// The vendor-custody facilities (a Custodian facility party in effect) with their custodians.
function custodians(facilityIds = null) {
    let query = find("mantle.facility.FacilityParty", {roleTypeId: "Custodian"})
    if (facilityIds) query = query.condition("facilityId", "in", facilityIds.length ? facilityIds : ["_none_"])
    const out = new Map()
    for (const row of Array.from(query.list())) if (lib.active(row)) out.set(row.facilityId, row.partyId)
    return out
}

// ===== a transfer's movements, each summed apart (F37) =====
// By shipment and by line: quantity (lines not cancelled), picked, issued, moved (direct subcontract moves), accepted and
// rejected.
function movementsOf(shipmentIds) {
    const byShipment = new Map(shipmentIds.map(id => [id, emptyTotals()]))
    const byLine = new Map()
    if (!shipmentIds.length) return {byShipment, byLine}
    const sources = Array.from(find("mantle.shipment.ShipmentItemSource").condition("shipmentId", "in", shipmentIds).list())
    const line = source => {
        if (!byLine.has(source.shipmentItemSourceId))
            byLine.set(source.shipmentItemSourceId, emptyTotals())
        return byLine.get(source.shipmentItemSourceId)
    }
    const sourceIds = []
    for (const source of sources) {
        sourceIds.push(source.shipmentItemSourceId)
        if (source.statusId === "SisCancelled") continue
        const totals = byShipment.get(source.shipmentId)
        totals.quantity += number(source.quantity)
        totals.picked += number(source.quantityPicked)
        line(source).quantity += number(source.quantity)
        line(source).picked += number(source.quantityPicked)
    }
    const add = (row, field, value) => {
        byShipment.get(row.shipmentId)[field] += value
        if (row.shipmentItemSourceId && byLine.has(row.shipmentItemSourceId)) byLine.get(row.shipmentItemSourceId)[field] += value
    }
    for (const issuance of Array.from(
        find("mantle.product.issuance.AssetIssuance").condition("shipmentId", "in", shipmentIds).list()
    ))
        add(issuance, "issued", Math.max(0, number(issuance.quantity) - number(issuance.quantityCancelled)))
    const receipts = find("mantle.product.receipt.AssetReceipt").condition("shipmentId", "in", shipmentIds).list()
    for (const receipt of Array.from(receipts)) {
        add(receipt, "accepted", number(receipt.quantityAccepted))
        add(receipt, "rejected", number(receipt.quantityRejected))
    }
    if (sourceIds.length)
        for (const operation of Array.from(
            find("mantle.ledger.transaction.PostingOperation", {operationType: "SubcontractDispatch"})
                .condition("resultId", "in", sourceIds)
                .list()
        )) {
            const answer = lib.json(operation.resultJson, {})
            if (answer.shipmentId) add(answer, "moved", number(answer.quantity))
        }
    return {byShipment, byLine}
}
const emptyTotals = () => ({quantity: 0, picked: 0, issued: 0, moved: 0, accepted: 0, rejected: 0})
const sentOf = totals => totals.issued + totals.moved
const inTransitOf = totals => Math.max(0, totals.issued - totals.accepted - totals.rejected)

// ===== TransferFind and TransferList =====
function candidates(userScope, p) {
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let query = find("mantle.shipment.ShipmentAndRouteSegment").condition("shipmentTypeEnumId", "ShpTpTransfer")
    if (ids)
        query = query.condition(
            cf().makeCondition(
                [cf().makeCondition("originFacilityId", "in", ids.length ? ids : ["_none_"]),
                    cf().makeCondition("destinationFacilityId", "in", ids.length ? ids : ["_none_"])],
                "or"
            )
        )
    if (p.originFacilityId) query = query.condition("originFacilityId", p.originFacilityId)
    if (p.destinationFacilityId) query = query.condition("destinationFacilityId", p.destinationFacilityId)
    if (p.statusId === "all") {
        // every status
    } else if (p.statusId) query = query.condition("statusId", p.statusId)
    else query = query.condition("statusId", "in", openStatuses)
    if (p.overdue === "Y" || p.overdue === true)
        query = query.condition("statusId", "in", openStatuses).condition("estimatedArrivalDate", "less", startOfToday())
    if (p.custody === "Y" || p.custody === true) {
        const custodyIds = [...custodians(warehouse.facilityIds(userScope)).keys()]
        query = query.condition(
            cf().makeCondition(
                [cf().makeCondition("originFacilityId", "in", custodyIds.length ? custodyIds : ["_none_"]),
                    cf().makeCondition("destinationFacilityId", "in", custodyIds.length ? custodyIds : ["_none_"])],
                "or"
            )
        )
    }
    if (p.text && String(p.text).trim())
        query = query.condition(cf().makeCondition("shipmentId", "like", like(String(p.text).trim())).ignoreCase())
    const shipmentIds = Array.from(
        query.selectField("shipmentId").distinct(true).orderBy("shipmentId").limit(candidateLimit).list()
    ).map(row => row.shipmentId)
    return {shipmentIds, truncated: shipmentIds.length >= candidateLimit}
}
// The route of each transfer: its first segment's origin and its last segment's destination.
function routesOf(shipmentIds) {
    const routes = new Map()
    if (!shipmentIds.length) return routes
    for (const segment of Array.from(
        find("mantle.shipment.ShipmentRouteSegment")
            .condition("shipmentId", "in", shipmentIds)
            .orderBy("shipmentId,shipmentRouteSegmentSeqId")
            .list()
    )) {
        const route = routes.get(segment.shipmentId) || {originFacilityId: null, destinationFacilityId: null}
        if (!route.originFacilityId) route.originFacilityId = segment.originFacilityId
        if (segment.destinationFacilityId) route.destinationFacilityId = segment.destinationFacilityId
        routes.set(segment.shipmentId, route)
    }
    return routes
}
function kindOf(shipment, route, custody) {
    if (!shipment.subcontractWorkEffortId) return {kind: "transfer", kindText: "Transfer"}
    return custody.has(route?.originFacilityId)
        ? {kind: "return", kindText: "Subcontract return"}
        : {kind: "dispatch", kindText: "Subcontract dispatch"}
}
function transfers(p) {
    const userScope = warehouse.required(warehouse.scope())
    const {shipmentIds, truncated} = candidates(userScope, p)
    const query = () => {
        let built = find("mantle.shipment.Shipment")
            .condition("shipmentId", "in", shipmentIds.length ? shipmentIds : ["_none_"])
            .orderBy("estimatedArrivalDate,shipmentId")
        if (p.workEffortId) built = built.condition("subcontractWorkEffortId", p.workEffortId)
        if (p.orderId) built = built.condition("subcontractOrderId", p.orderId)
        return built
    }
    const paged = lib.page(query(), p, "transferRows", query().count())
    const pageRows = paged.rows.map(lib.map)
    const ids = pageRows.map(row => row.shipmentId)
    const routes = routesOf(ids)
    const custody = custodians()
    const {byShipment} = movementsOf(ids)
    const facilityNames = namesOf("mantle.facility.Facility", "facilityId", "facilityName",
        [...routes.values()].flatMap(route => [route.originFacilityId, route.destinationFacilityId]))
    const statuses = namesOf("moqui.basic.StatusItem", "statusId", "description", pageRows.map(row => row.statusId))
    const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    const out = Object.assign({}, paged)
    delete out.rows
    out.transferRows = pageRows.map(shipment => {
        const route = routes.get(shipment.shipmentId) || {}
        const totals = byShipment.get(shipment.shipmentId)
        const kind = kindOf(shipment, route, custody)
        const dueDay = shipment.estimatedArrivalDate ? lib.bookDay(null, shipment.estimatedArrivalDate) : ""
        const sent = sentOf(totals)
        return {
            shipmentId: shipment.shipmentId,
            kind: kind.kind,
            kindText: kind.kindText,
            detailScreen: kind.kind === "transfer" ? "TransferShipmentDetail" : "SubcontractShipmentDetail",
            originFacilityId: route.originFacilityId,
            originName: facilityNames.get(route.originFacilityId) || route.originFacilityId || "",
            destinationFacilityId: route.destinationFacilityId,
            destinationName: facilityNames.get(route.destinationFacilityId) || route.destinationFacilityId || "",
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            statusColor: statusColors[shipment.statusId] || "grey",
            quantity: totals.quantity,
            sent,
            inTransit: inTransitOf(totals),
            received: totals.accepted + totals.moved,
            shipText: "Sent " + quantityText(sent) + " of " + quantityText(totals.quantity),
            receiveText: "Received " + quantityText(totals.accepted + totals.moved) + " of " + quantityText(sent),
            progressText: quantityText(sent) + " sent · " + quantityText(totals.accepted + totals.moved) + " received",
            dueDay,
            dueText: dueDay || "Not set",
            allDay: true,
            calendarTitle: shipment.shipmentId + " · " + (facilityNames.get(route.destinationFacilityId) || ""),
            overdue: openStatuses.includes(shipment.statusId) && !!dueDay && dueDay < today,
            workText: shipment.subcontractWorkEffortId
                ? shipment.subcontractWorkEffortId + " · " + shipment.subcontractOrderId + ":" +
                  shipment.subcontractOrderItemSeqId
                : ""
        }
    })
    out.transferRowsTruncated = truncated
    out.custodyRows = p.custody === "Y" || p.custody === true ? custodyStock(userScope) : []
    out.canCreate = !!userScope.capabilities.move
    return out
}
// The organization's stock held by suppliers: on hand at the vendor-custody facilities of the user's facilities.
function custodyStock(userScope) {
    const custody = custodians(warehouse.facilityIds(userScope))
    const ids = [...custody.keys()]
    if (!ids.length) return []
    const assets = Array.from(
        find("mantle.product.asset.Asset")
            .condition("facilityId", "in", ids)
            .condition("quantityOnHandTotal", "greater", 0)
            .orderBy("facilityId,productId,assetId")
            .limit(500)
            .list()
    )
    const facilityNames = namesOf("mantle.facility.Facility", "facilityId", "facilityName", ids)
    const products = namesOf("mantle.product.Product", "productId", "productName", assets.map(row => row.productId))
    const parties = lib.partyNames(unique([...custody.values()].concat(assets.map(row => row.ownerPartyId))))
    return assets.map(row => ({
        assetId: row.assetId,
        facilityId: row.facilityId,
        facilityName: facilityNames.get(row.facilityId) || row.facilityId,
        custodianName: parties[custody.get(row.facilityId)] || custody.get(row.facilityId) || "",
        productId: row.productId,
        productName: products.get(row.productId) || row.productId,
        ownerName: parties[row.ownerPartyId] || row.ownerPartyId || "",
        quantity: number(row.quantityOnHandTotal),
        locationSeqId: row.locationSeqId || ""
    }))
}

// ===== one transfer =====
const transferRules = ec.resource.script("component://mr-mantle/service/mantle/shipment/Transfers.js")
// The net debit of the transfer accounts (each issuance posting's debit account) over the transfer's issuance and receipt
// postings: what is in transit, and what rejected pieces left there; "" when nothing posted. For financial read only.
function transferAccountText(shipmentId) {
    const ids = (entity, field) => rows(entity, {shipmentId}).map(row => row[field])
    const transOf = (field, values) =>
        values.length
            ? Array.from(find("mantle.ledger.transaction.AcctgTrans").condition(field, "in", values).list())
            : []
    const issuanceTrans = transOf("assetIssuanceId", ids("mantle.product.issuance.AssetIssuance", "assetIssuanceId"))
    const receiptTrans = transOf("assetReceiptId", ids("mantle.product.receipt.AssetReceipt", "assetReceiptId"))
    const entriesOf = trans =>
        trans.length
            ? Array.from(
                  find("mantle.ledger.transaction.AcctgTransEntry")
                      .condition("acctgTransId", "in", trans.map(row => row.acctgTransId))
                      .list()
              )
            : []
    const issuanceEntries = entriesOf(issuanceTrans)
    const accounts = new Set(issuanceEntries.filter(entry => entry.debitCreditFlag === "D").map(entry => entry.glAccountId))
    if (!accounts.size) return ""
    const net = issuanceEntries
        .concat(entriesOf(receiptTrans))
        .filter(entry => accounts.has(entry.glAccountId))
        .reduce((sum, entry) => sum + (entry.debitCreditFlag === "D" ? 1 : -1) * number(entry.amount), 0)
    const currency = issuanceTrans[0]?.amountUomId || ""
    return ec.l10n.format(net, "#,##0.00") + (currency ? " " + currency : "") + " at " + [...accounts].join(", ")
}
function stockOptions(facilityId, productId) {
    if (!facilityId) return []
    return Array.from(
        find("mantle.product.asset.Asset", {facilityId, productId})
            .condition("availableToPromiseTotal", "greater", 0)
            .condition("statusId", "in", ["AstAvailable", "AstOnHold"])
            .orderBy("assetId")
            .limit(choiceLimit)
            .list()
    ).map(row => {
        const lot = row.lotId ? one("mantle.product.asset.Lot", {lotId: row.lotId}) : null
        return {
            key: row.assetId,
            text: [row.assetId, row.locationSeqId || "no location", lot ? "lot " + (lot.lotNumber || lot.lotId) : null,
                row.serialNumber ? "serial " + row.serialNumber : null, quantityText(row.availableToPromiseTotal) + " available"]
                .filter(Boolean)
                .join(" · ")
        }
    })
}
function locationOptions(facilityId) {
    if (!facilityId) return []
    return Array.from(
        find("mantle.facility.FacilityLocation", {facilityId})
            .condition("thruDate", "is-null", null)
            .orderBy("locationSeqId")
            .limit(200)
            .list()
    ).map(row => ({key: row.locationSeqId, text: row.locationSeqId + (row.description ? " · " + row.description : "")}))
}
function transferDetail(p) {
    const shipment = p.shipmentId ? one("mantle.shipment.Shipment", {shipmentId: p.shipmentId}) : null
    if (!shipment || shipment.shipmentTypeEnumId !== "ShpTpTransfer") return {transferFound: false}
    const userScope = warehouse.required(warehouse.scope())
    warehouse.recordOf(userScope, "shipment", p.shipmentId)
    const shipmentId = shipment.shipmentId
    const route = routesOf([shipmentId]).get(shipmentId) || {}
    const origin = route.originFacilityId ? one("mantle.facility.Facility", {facilityId: route.originFacilityId}) : null
    const destination = route.destinationFacilityId
        ? one("mantle.facility.Facility", {facilityId: route.destinationFacilityId})
        : null
    const custody = custodians()
    const kind = kindOf(shipment, route, custody)
    const custodianPartyId = custody.get(route.destinationFacilityId) || custody.get(route.originFacilityId) || null
    const atOrigin = warehouse.inScope(userScope, origin)
    const atDestination = warehouse.inScope(userScope, destination)
    const caps = userScope.capabilities
    const sending = sendingStatuses.includes(shipment.statusId)
    // a line's movements as Mantle defines them (Transfers.js lineOf: in transit per issuance less its receipts, F37), the
    // one definition the entry points refuse by; the list's batch read (movementsOf) sums the same rows per shipment
    const mantleLines = new Map(
        rows("mantle.shipment.ShipmentItemSource", {shipmentId})
            .filter(source => source.statusId !== "SisCancelled")
            .map(source => [source.shipmentItemSourceId, transferRules.lineOf(source)])
    )
    const sources = rows("mantle.shipment.ShipmentItemSource", {shipmentId}).sort((a, b) =>
        String(a.shipmentItemSourceId).localeCompare(String(b.shipmentItemSourceId))
    )
    const products = namesOf("mantle.product.Product", "productId", "productName", sources.map(row => row.productId))
    const statuses = namesOf("moqui.basic.StatusItem", "statusId", "description",
        sources.map(row => row.statusId).concat([shipment.statusId]))
    const canIssue = atOrigin && sending && !!caps.issue
    const canDispatch = atOrigin && atDestination && sending && !!caps.move && kind.kind !== "transfer"
    const lineRows = sources.map(source => {
        const line = mantleLines.get(source.shipmentItemSourceId)
        const cancelled = !line
        const toSend = cancelled ? 0 : number(line.toSend)
        return {
            shipmentItemSourceId: source.shipmentItemSourceId,
            productId: source.productId,
            productName: products.get(source.productId) || source.productId,
            quantity: cancelled ? 0 : number(source.quantity),
            picked: number(source.quantityPicked),
            sent: cancelled ? 0 : number(line.issued) + number(line.moved),
            inTransit: cancelled ? 0 : number(line.inTransit),
            accepted: cancelled ? 0 : number(line.accepted) + number(line.moved),
            rejected: cancelled ? 0 : number(line.rejected),
            toSend,
            statusText: cancelled ? "Cancelled" : statuses.get(source.statusId) || "",
            stockOptions: (canIssue || canDispatch) && toSend > 0 ? stockOptions(route.originFacilityId, source.productId) : []
        }
    })
    const issuances = rows("mantle.product.issuance.AssetIssuance", {shipmentId}).sort((a, b) =>
        String(a.assetIssuanceId).localeCompare(String(b.assetIssuanceId))
    )
    const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId}).sort((a, b) =>
        String(a.assetReceiptId).localeCompare(String(b.assetReceiptId))
    )
    const assets = new Map(
        unique(issuances.map(row => row.assetId).concat(receipts.map(row => row.assetId))).map(assetId => [
            assetId,
            one("mantle.product.asset.Asset", {assetId})
        ])
    )
    const lotText = asset => {
        if (!asset?.lotId) return ""
        const lot = one("mantle.product.asset.Lot", {lotId: asset.lotId})
        return lot?.lotNumber || asset.lotId
    }
    const userNames = namesOf("moqui.security.UserAccount", "userId", "userFullName",
        issuances.map(row => row.issuedByUserId).concat(receipts.map(row => row.receivedByUserId)))
    const issueRows = issuances.map(row => ({
        assetIssuanceId: row.assetIssuanceId,
        assetId: row.assetId,
        productName: products.get(row.productId) || row.productId,
        lotText: lotText(assets.get(row.assetId)),
        serialNumber: assets.get(row.assetId)?.serialNumber || "",
        quantity: Math.max(0, number(row.quantity) - number(row.quantityCancelled)),
        issuedText: dateText(row.issuedDate),
        byName: userNames.get(row.issuedByUserId) || row.issuedByUserId || ""
    }))
    const moveRows = sources.length
        ? Array.from(
              find("mantle.ledger.transaction.PostingOperation", {operationType: "SubcontractDispatch"})
                  .condition("resultId", "in", sources.map(row => row.shipmentItemSourceId))
                  .orderBy("completedDate")
                  .list()
          ).map(operation => {
              const answer = lib.json(operation.resultJson, {})
              return {
                  assetId: answer.assetId,
                  toAssetId: answer.toAssetId,
                  productName: products.get(answer.productId) || answer.productId,
                  quantity: number(answer.quantity),
                  toLocationSeqId: answer.toLocationSeqId || "",
                  movedText: dateText(operation.completedDate)
              }
          })
        : []
    const reasons = namesOf("moqui.basic.Enumeration", "enumId", "description", receipts.map(row => row.rejectionReasonEnumId))
    const receiptRows = receipts.map(row => {
        const asset = assets.get(row.assetId)
        return {
            assetReceiptId: row.assetReceiptId,
            assetId: row.assetId || "",
            productName: products.get(row.productId) || row.productId,
            lotText: lotText(asset),
            serialNumber: asset?.serialNumber || "",
            accepted: number(row.quantityAccepted),
            rejected: number(row.quantityRejected),
            reasonText: reasons.get(row.rejectionReasonEnumId) || "",
            locationSeqId: asset?.locationSeqId || "",
            statusText: statusText(asset?.statusId),
            receivedText: dateText(row.receivedDate),
            byName: userNames.get(row.receivedByUserId) || row.receivedByUserId || ""
        }
    })
    const work = shipment.subcontractWorkEffortId
        ? one("mantle.work.effort.WorkEffort", {workEffortId: shipment.subcontractWorkEffortId})
        : null
    const run = work?.purposeEnumId === "WepProductionRun"
        ? work
        : work?.parentWorkEffortId
          ? one("mantle.work.effort.WorkEffort", {workEffortId: work.parentWorkEffortId})
          : null
    const parties = lib.partyNames(unique([custodianPartyId, shipment.fromPartyId]))
    const sumOf = field => lineRows.reduce((sum, row) => sum + row[field], 0)
    const totals = {quantity: sumOf("quantity"), sent: sumOf("sent"), inTransit: sumOf("inTransit"),
        received: sumOf("accepted"), rejected: sumOf("rejected")}
    const transfer = {
        kind: kind.kind,
        typeText: kind.kindText,
        subcontract: kind.kind !== "transfer",
        originFacilityId: route.originFacilityId,
        originName: origin ? origin.facilityName || origin.facilityId : "",
        destinationFacilityId: route.destinationFacilityId,
        destinationName: destination ? destination.facilityName || destination.facilityId : "",
        ownerName: parties[shipment.fromPartyId] || shipment.fromPartyId || "",
        custodianName: custodianPartyId ? parties[custodianPartyId] || custodianPartyId : "",
        statusId: shipment.statusId,
        statusText: statuses.get(shipment.statusId) || shipment.statusId,
        statusColor: statusColors[shipment.statusId] || "grey",
        shipText: shipment.estimatedShipDate ? lib.bookDay(null, shipment.estimatedShipDate) : "not set",
        arrivalText: shipment.estimatedArrivalDate ? lib.bookDay(null, shipment.estimatedArrivalDate) : "not set",
        reference: shipment.handlingInstructions || "",
        runId: run?.workEffortId || null,
        runText: run ? (run.workEffortName || run.workEffortId) + " (" + run.workEffortId + ")" : "",
        operationText: work && work !== run ? (work.workEffortName || work.workEffortId) + " (" + work.workEffortId + ")" : "",
        serviceText: shipment.subcontractOrderId ? shipment.subcontractOrderId + ":" + shipment.subcontractOrderItemSeqId : "",
        quantity: totals.quantity,
        sent: totals.sent,
        inTransit: totals.inTransit,
        received: totals.received,
        rejected: totals.rejected,
        // the value still at the transfer account (in transit, and rejected pieces until a write-off, §5): only with
        // financial read, read only then (P15 review B5)
        financialRead: !!caps.financialRead,
        transferAccountText: caps.financialRead ? transferAccountText(shipmentId) : null,
        canPick: atOrigin && ["ShipInput", "ShipScheduled"].includes(shipment.statusId) && !!caps.pick,
        canIssue,
        canShip: atOrigin && sending && (!!caps.ship || !!caps.issue) && totals.sent > 0,
        canReceive: atDestination && shipment.statusId === "ShipShipped" && !!caps.receive,
        canDispatch,
        atOrigin,
        atDestination
    }
    return {
        transferFound: true,
        shipmentId,
        transfer,
        lineRows,
        issueRows,
        moveRows,
        receiptRows,
        destinationLocations: transfer.canReceive || canDispatch ? locationOptions(route.destinationFacilityId) : [],
        rejectionReasons: transfer.canReceive
            ? Array.from(find("moqui.basic.Enumeration", {enumTypeId: "RejectionReason"}).orderBy("description").list())
                  .map(row => ({key: row.enumId, text: row.description || row.enumId}))
            : []
    }
}

// ===== choices =====
// facilities (the user's, with custody marked), products (stocked, by id or name), serviceItems (the service order items
// linked to production work whose supplier is the custodian of one of the user's vendor-custody facilities), stock (of a
// product at a facility), locations (of a facility).
const choiceFinds = {
    facilities(userScope, p) {
        const custody = custodians()
        let query = find("mantle.facility.Facility").orderBy("facilityName").limit(choiceLimit)
        if (userScope.facilityOwnerIds) query = query.condition("ownerPartyId", "in", userScope.facilityOwnerIds)
        if (p.term)
            query = query.condition(
                cf().makeCondition(
                    [cf().makeCondition("facilityId", "like", like(p.term)).ignoreCase(),
                        cf().makeCondition("facilityName", "like", like(p.term)).ignoreCase()],
                    "or"
                )
            )
        return Array.from(query.list()).map(row => ({
            value: row.facilityId,
            label: (row.facilityName || row.facilityId) + (custody.has(row.facilityId) ? " (vendor custody)" : "")
        }))
    },
    products(userScope, p) {
        let query = find("mantle.product.Product", {productTypeEnumId: "PtAsset"}).orderBy("productName").limit(choiceLimit)
        if (p.term)
            query = query.condition(
                cf().makeCondition(
                    [cf().makeCondition("productId", "like", like(p.term)).ignoreCase(),
                        cf().makeCondition("productName", "like", like(p.term)).ignoreCase(),
                        cf().makeCondition("pseudoId", "like", like(p.term)).ignoreCase()],
                    "or"
                )
            )
        return Array.from(query.list()).map(row => ({
            value: row.productId,
            label: (row.productName || row.productId) + " (" + row.productId + ")"
        }))
    },
    serviceItems(userScope) {
        const custody = custodians(warehouse.facilityIds(userScope))
        const suppliers = unique([...custody.values()])
        if (!suppliers.length) return []
        const out = []
        for (const link of Array.from(find("mantle.order.OrderItemWorkEffort").limit(500).list())) {
            const item = one("mantle.order.OrderItem", {orderId: link.orderId, orderItemSeqId: link.orderItemSeqId})
            const part = item ? one("mantle.order.OrderPart", {orderId: item.orderId, orderPartSeqId: item.orderPartSeqId}) : null
            if (!part || !suppliers.includes(part.vendorPartyId)) continue
            const work = one("mantle.work.effort.WorkEffort", {workEffortId: link.workEffortId})
            out.push({
                value: [link.orderId, link.orderItemSeqId, link.workEffortId].join(":"),
                label: link.orderId + ":" + link.orderItemSeqId + " · " + (work?.workEffortName || link.workEffortId)
            })
            if (out.length >= choiceLimit) break
        }
        return out
    },
    stock(userScope, p) {
        facilityOf(userScope, p.facilityId)
        return p.productId ? stockOptions(p.facilityId, p.productId).map(row => ({value: row.key, label: row.text})) : []
    },
    // the origin's available stock of a transfer line's product (the line checked to be on a transfer in scope)
    lineStock(userScope, p) {
        const source = p.shipmentItemSourceId
            ? one("mantle.shipment.ShipmentItemSource", {shipmentItemSourceId: p.shipmentItemSourceId})
            : null
        if (!source || (p.shipmentId && source.shipmentId !== p.shipmentId)) return []
        warehouse.recordOf(userScope, "shipment", source.shipmentId)
        const route = routesOf([source.shipmentId]).get(source.shipmentId) || {}
        const origin = route.originFacilityId ? one("mantle.facility.Facility", {facilityId: route.originFacilityId}) : null
        if (!warehouse.inScope(userScope, origin)) return []
        return stockOptions(origin.facilityId, source.productId).map(row => ({value: row.key, label: row.text}))
    },
    // a stock request item's product available at the facility chosen to allocate from (the request checked in scope)
    requestStock(userScope, p) {
        const request = p.requestId ? one("mantle.request.Request", {requestId: p.requestId}) : null
        const item = request
            ? one("mantle.request.RequestItem", {requestId: request.requestId, requestItemSeqId: p.requestItemSeqId})
            : null
        const home = request?.facilityId ? one("mantle.facility.Facility", {facilityId: request.facilityId}) : null
        if (!item || !warehouse.inScope(userScope, home) || !p.facilityId) return []
        facilityOf(userScope, p.facilityId)
        return stockOptions(p.facilityId, item.productId).map(row => ({value: row.key, label: row.text}))
    },
    locations(userScope, p) {
        facilityOf(userScope, p.facilityId)
        return locationOptions(p.facilityId).map(row => ({value: row.key, label: row.text}))
    }
}
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const choice = choiceFinds[p.choice]
    if (!choice) throw new Error("Unknown transfer choice " + p.choice)
    return {resultList: choice(userScope, p)}
}

// ===== stock requests =====
function stockRequests(p) {
    const userScope = warehouse.required(warehouse.scope())
    const query = () => requestQuery(userScope, p)
    const paged = lib.page(query(), p, "requestRows", query().count())
    const pageRows = paged.rows.map(lib.map)
    return requestPage(paged, pageRows)
}
function requestQuery(userScope, p) {
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let query = find("mantle.request.Request", {requestTypeEnumId: "RqtInventory"}).orderBy("-requestDate,requestId")
    query = ids
        ? query.condition("facilityId", "in", ids.length ? ids : ["_none_"])
        : query.condition("facilityId", "is-not-null", null)
    if (p.statusId === "all") {
        // every status
    } else if (p.statusId) query = query.condition("statusId", p.statusId)
    else query = query.condition("statusId", "in", requestOpenStatuses)
    if (p.requesterPartyId) query = query.condition("filedByPartyId", p.requesterPartyId)
    if (p.productId) {
        const items = find("mantle.request.RequestItem", {productId: p.productId}).selectField("requestId").limit(candidateLimit)
        const requestIds = unique(Array.from(items.list()).map(row => row.requestId))
        query = query.condition("requestId", "in", requestIds.length ? requestIds : ["_none_"])
    }
    if (p.overdue === "Y" || p.overdue === true)
        query = query.condition("statusId", "in", requestOpenStatuses).condition("responseRequiredDate", "less", startOfToday())
    if (p.text && String(p.text).trim())
        query = query.condition(
            cf().makeCondition(
                [cf().makeCondition("requestId", "like", like(String(p.text).trim())).ignoreCase(),
                    cf().makeCondition("requestName", "like", like(String(p.text).trim())).ignoreCase()],
                "or"
            )
        )
    return query
}
function requestPage(paged, pageRows) {
    const facilityNames = namesOf("mantle.facility.Facility", "facilityId", "facilityName", pageRows.map(row => row.facilityId))
    const parties = lib.partyNames(pageRows.map(row => row.filedByPartyId))
    const statuses = namesOf("moqui.basic.StatusItem", "statusId", "description", pageRows.map(row => row.statusId))
    const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    const out = Object.assign({}, paged)
    delete out.rows
    out.requestRows = pageRows.map(request => {
        let progress = null
        try {
            progress = lib.probe("mantle.request.RequestServices.get#InventoryRequestProgress", {requestId: request.requestId})
        } catch (error) {
            ec.logger.warn("Stock request " + request.requestId + " progress: " + error.message)
        }
        const itemRows = Array.from(progress?.itemRows || [])
        const total = field => itemRows.reduce((sum, row) => sum + number(row[field]), 0)
        const dueDay = request.responseRequiredDate ? lib.bookDay(null, request.responseRequiredDate) : ""
        return {
            requestId: request.requestId,
            requestName: request.requestName || request.requestId,
            facilityId: request.facilityId,
            facilityName: facilityNames.get(request.facilityId) || request.facilityId,
            requesterName: parties[request.filedByPartyId] || request.filedByPartyId || "",
            statusId: request.statusId,
            statusText: statuses.get(request.statusId) || request.statusId,
            statusColor: requestColors[request.statusId] || "grey",
            dueDay,
            dueText: dueDay || "Not set",
            overdue: requestOpenStatuses.includes(request.statusId) && !!dueDay && dueDay < today,
            itemsText: itemRows.map(row => row.productName + " " + quantityText(row.requested)).join(", "),
            requested: total("requested"),
            allocated: progress ? total("allocated") : null,
            received: progress ? total("received") : null,
            progressText: progress
                ? quantityText(total("received")) + " of " + quantityText(total("requested")) + " received"
                : "Unavailable"
        }
    })
    return out
}
function requestDetail(p) {
    const request = p.requestId ? one("mantle.request.Request", {requestId: p.requestId}) : null
    if (!request || request.requestTypeEnumId !== "RqtInventory") return {requestFound: false}
    const userScope = warehouse.required(warehouse.scope())
    const facility = request.facilityId ? one("mantle.facility.Facility", {facilityId: request.facilityId}) : null
    if (!warehouse.inScope(userScope, facility)) return {requestFound: false}
    const progress = call("mantle.request.RequestServices.get#InventoryRequestProgress", {requestId: request.requestId})
    const caps = userScope.capabilities
    const parties = lib.partyNames([request.filedByPartyId])
    const draft = request.statusId === "ReqDraft"
    const inProgress = request.statusId === "ReqInProgress"
    const itemRows = Array.from(progress.itemRows || []).map(row =>
        Object.assign({}, row, {
            open: Math.max(0, number(row.approved) - number(row.allocated)),
            linksText: Array.from(row.links || []).map(link =>
                link.kind === "move" ? "Moved " + link.quantity + " into " + link.assetId
                    : link.shipmentId + ": sent " + link.sent + ", received " + link.received +
                      (link.cancelled ? " (cancelled)" : "")
            ).join("; "),
            requirementText: Array.from(row.requirementIds || []).join(", ")
        })
    )
    const allReceived = itemRows.length > 0 && itemRows.every(row => number(row.remaining) === 0)
    // the facilities stock may come from: the request's facility (a move) and its owner's other facilities in scope
    const fromFacilities = Array.from(
        find("mantle.facility.Facility", {ownerPartyId: facility.ownerPartyId}).orderBy("facilityName").limit(choiceLimit).list()
    )
        .filter(row => warehouse.inScope(userScope, row))
        .filter(row => !(row.closedDate && lib.ms(row.closedDate) <= lib.ms(ec.user.nowTimestamp)))
        .map(row => ({
            key: row.facilityId,
            text: (row.facilityName || row.facilityId) + (row.facilityId === facility.facilityId ? " (move here)" : "")
        }))
    return {
        requestFound: true,
        requestId: request.requestId,
        stockRequest: {
            requestName: request.requestName || request.requestId,
            description: request.description || "",
            facilityId: facility.facilityId,
            facilityName: facility.facilityName || facility.facilityId,
            requesterName: parties[request.filedByPartyId] || request.filedByPartyId || "",
            statusId: request.statusId,
            statusText: statusText(request.statusId),
            statusColor: requestColors[request.statusId] || "grey",
            dueText: request.responseRequiredDate ? lib.bookDay(null, request.responseRequiredDate) : "not set",
            requestDateText: dateText(request.requestDate),
            canAddItem: ["ReqDraft", "ReqSubmitted"].includes(request.statusId),
            canSubmit: draft && itemRows.length > 0,
            canApprove: ["ReqSubmitted", "ReqReviewed"].includes(request.statusId) && !!caps.policyPlan,
            canAllocate: inProgress && !!caps.move,
            canComplete: inProgress && allReceived,
            canCancel: ["ReqDraft", "ReqSubmitted", "ReqReviewed"].includes(request.statusId)
        },
        itemRows,
        fromFacilities
    }
}

// Home's transfers queue: transfers from the facility still to send (ready), in transit to it (waiting) and, of either,
// those due before today (late).
function transferQueue(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const count = (field, statuses, late) => {
        let query = find("mantle.shipment.ShipmentAndRouteSegment", {shipmentTypeEnumId: "ShpTpTransfer"})
            .condition(field, facility.facilityId)
            .condition("statusId", "in", statuses)
        if (late) query = query.condition("estimatedArrivalDate", "less", startOfToday())
        return query.selectField("shipmentId").distinct(true).count()
    }
    return {
        readyCount: count("originFacilityId", sendingStatuses, false),
        waitingCount: count("destinationFacilityId", ["ShipShipped"], false),
        lateCount: count("originFacilityId", sendingStatuses, true) + count("destinationFacilityId", ["ShipShipped"], true)
    }
}

const operations = {transfers, transferDetail, choices, stockRequests, requestDetail, transferQueue}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse transfer operation " + op)
        return operations[op](parameters)
    }
})
