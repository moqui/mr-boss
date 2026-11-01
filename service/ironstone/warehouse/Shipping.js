// The Warehouse shipping screens' reads (impl-warehouse P13; design-warehouse §10 Ship, PackageTracking and InvoiceDetail,
// §12 Carriers and Printers, §16 labels and manifests): the Ship task (one packed shipment's addresses, packages and
// labels, its gateway and what blocks dispatch; or the shipments ready to ship), PackageTracking's list, Carriers' methods
// and gateway bindings (credentials masked), the printer index and FacilityDetail's Printers tab, the label sheets
// (location, lot, serial, container and box labels as Code 128 through the framework's barcodes), the carrier manifest,
// Home's shipping queue and InvoiceDetail's Warehouse context. Every read is limited to the user's Warehouse facilities (a
// shipment by its first route segment's origin, F55); the postings are Mantle's (WarehouseTaskServices request#PackageLabels,
// refund#PackageLabels, track#PackageLabels, record#ManualTracking, record#PackageDelivery, ship#OutgoingShipment;
// PrintServices; CarrierSetupServices), which the screens call after AccessServices.check#Record. Invoice amounts are read
// only with financial read.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, denied, call, probe} = lib

const SHIPMENT = "mantle.shipment.Shipment",
    SEGMENT = "mantle.shipment.ShipmentRouteSegment",
    PACKAGE = "mantle.shipment.ShipmentPackage",
    CONTENT = "mantle.shipment.ShipmentPackageContent",
    ROUTE_SEG = "mantle.shipment.ShipmentPackageRouteSeg",
    REQUEST = "mantle.shipment.carrier.ShippingGatewayRequest",
    GATEWAY = "mantle.shipment.carrier.ShippingGatewayConfig",
    METHOD = "mantle.shipment.carrier.CarrierShipmentMethod",
    TRACKING = "mantle.shipment.ShipmentPackageTracking",
    BINDING = "mantle.facility.FacilityPrinter",
    PRINTER = "moqui.basic.print.NetworkPrinter",
    JOB = "moqui.basic.print.PrintJob"
// shipments a facility receives, and drop shipments, are not shipped here
const notShipped = ["ShpTpPurchase", "ShpTpSalesReturn", "ShpTpDrop"]
const elsewhere = ["ShpTpTransfer", "ShpTpPurchaseReturn"]
const listLimit = 50
const blank = value => value == null || String(value).trim() === ""
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const todayText = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const startOfToday = () => ec.l10n.parseTimestamp(todayText() + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
const bySeq = field => (a, b) => String(a[field]).localeCompare(String(b[field]))
const inEffect = row =>
    (row.fromDate == null || lib.ms(row.fromDate) <= lib.ms(ec.user.nowTimestamp)) &&
    (row.thruDate == null || lib.ms(row.thruDate) > lib.ms(ec.user.nowTimestamp))

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
const enumTexts = ids => namesOf("moqui.basic.Enumeration", "enumId", "description", ids)
const statusTexts = ids => namesOf("moqui.basic.StatusItem", "statusId", "description", ids)
const uomTexts = ids => namesOf("moqui.basic.Uom", "uomId", "abbreviation", ids)
const carrierName = (names, partyId) => (partyId === "_NA_" ? "No carrier" : names[partyId] || partyId || "")
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
// An outgoing shipment leaving one of the user's facilities; another is refused as missing.
function outgoing(userScope, shipmentId) {
    warehouse.recordOf(userScope, "shipment", shipmentId)
    const shipment = one(SHIPMENT, {shipmentId})
    const segments = rows(SEGMENT, {shipmentId}).sort(bySeq("shipmentRouteSegmentSeqId"))
    const facility = segments[0]?.originFacilityId
        ? one("mantle.facility.Facility", {facilityId: segments[0].originFacilityId})
        : null
    if (!shipment || notShipped.includes(shipment.shipmentTypeEnumId) || !warehouse.inScope(userScope, facility))
        denied("RECORD_UNAVAILABLE", "Shipment " + shipmentId + " does not leave from a facility you work in")
    return {shipment, facility, segment: segments[0]}
}
function addressOf(contactMechId) {
    const address = blank(contactMechId) ? null : one("mantle.party.contact.PostalAddress", {contactMechId})
    if (!address) return null
    const mech = one("mantle.party.contact.ContactMech", {contactMechId})
    return {
        contactMechId,
        text: [
            address.toName,
            address.attnName,
            address.address1,
            address.address2,
            address.city,
            address.stateProvinceGeoId,
            address.postalCode,
            address.countryGeoId
        ]
            .filter(value => !blank(value))
            .join(", "),
        postalCode: address.postalCode || "",
        trustLevelEnumId: mech?.trustLevelEnumId || null,
        trustText: mech?.trustLevelEnumId ? enumTexts([mech.trustLevelEnumId]).get(mech.trustLevelEnumId) : "Not checked",
        validateMessage: mech?.validateMessage || null
    }
}
const originPostalOf = (segment, facilityId) =>
    segment?.originPostalContactMechId ||
    call("mantle.facility.ContactServices.get#FacilityDefaultShipOrigin", {facilityId}).postalContactMechId ||
    null
// The gateway that serves the shipment (Mantle's lookup, read in a probe), or null.
function gatewayOf(shipmentId, segment) {
    if (!segment) return null
    try {
        const out = probe("mantle.shipment.CarrierServices.get#ShipmentGatewayDetails", {
            shipmentId,
            shipmentRouteSegmentSeqId: segment.shipmentRouteSegmentSeqId
        })
        return out.shippingGatewayConfigId ? one(GATEWAY, {shippingGatewayConfigId: out.shippingGatewayConfigId}) : null
    } catch (error) {
        return null
    }
}
// The last print job of a package's label (its job name starts with the shipment and package), for a reprint.
function lastPrintOf(prefix) {
    const job = Array.from(
        find(JOB)
            .condition("jobName", "like", prefix + "-%")
            .orderBy("-createdDate")
            .limit(1)
            .list()
    )[0]
    if (!job) return null
    return {
        printJobId: job.printJobId,
        statusId: job.statusId,
        failed: job.statusId === "PtjSendFailed",
        statusText: statusTexts([job.statusId]).get(job.statusId) || job.statusId,
        errorMessage: job.errorMessage || null,
        dateText: lib.dateText(job.createdDate)
    }
}

// ===== the Ship task =====
function shipContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const can = userScope.capabilities
    if (!can.ship) denied("PERMISSION_DENIED", "Shipping needs the ship permission")
    if (blank(p.shipmentId)) return Object.assign({found: false}, shipmentsToShip(userScope, p))
    const sh = outgoing(userScope, p.shipmentId)
    const shipment = sh.shipment
    const segment = sh.segment
    const gateway = gatewayOf(shipment.shipmentId, segment)
    const packages = rows(PACKAGE, {shipmentId: shipment.shipmentId}).sort(bySeq("shipmentPackageSeqId"))
    const contents = rows(CONTENT, {shipmentId: shipment.shipmentId})
    const routeSegs = segment
        ? rows(ROUTE_SEG, {shipmentId: shipment.shipmentId, shipmentRouteSegmentSeqId: segment.shipmentRouteSegmentSeqId})
        : []
    const requests = rows(REQUEST, {shipmentId: shipment.shipmentId}).sort(
        (a, b) => lib.ms(b.requestDate) - lib.ms(a.requestDate)
    )
    const productNames = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        contents.map(row => row.productId)
    )
    const boxes = namesOf(
        "mantle.shipment.ShipmentBoxType",
        "shipmentBoxTypeId",
        "description",
        packages.map(row => row.shipmentBoxTypeId)
    )
    const units = uomTexts(packages.map(row => row.weightUomId))
    const requestStatuses = statusTexts(requests.map(row => row.statusId))
    const trackingTexts = enumTexts(routeSegs.map(row => row.trackingStatusEnumId))
    const packageRows = packages.map(row => {
        const routeSeg = routeSegs.find(item => item.shipmentPackageSeqId === row.shipmentPackageSeqId) || {}
        const last = requests.find(
            item => item.shipmentPackageSeqId === row.shipmentPackageSeqId && item.requestTypeEnumId === "SgrLabel"
        )
        const refunded = !blank(routeSeg.gatewayRefundStatus)
        const hasLabel = routeSeg.labelImage != null || !blank(routeSeg.labelUrl)
        return {
            shipmentPackageSeqId: row.shipmentPackageSeqId,
            boxText: boxes.get(row.shipmentBoxTypeId) || "No box type",
            weightText:
                number(row.weight) > 0 ? quantityText(row.weight) + " " + (units.get(row.weightUomId) || "") : "Not weighed",
            weighed: number(row.weight) > 0,
            contentsText: contents
                .filter(item => item.shipmentPackageSeqId === row.shipmentPackageSeqId)
                .map(item => quantityText(item.quantity) + " × " + (productNames.get(item.productId) || item.productId))
                .join(", "),
            trackingCode: routeSeg.trackingCode || null,
            labelState: refunded ? "Refunded" : hasLabel ? "Label" : routeSeg.trackingCode ? "Tracking by hand" : "No label",
            hasLabel: hasLabel && !refunded,
            refunded,
            returnTrackingCode: routeSeg.returnTrackingCode || null,
            hasReturnLabel: routeSeg.returnLabelImage != null,
            trackingText: routeSeg.trackingStatusEnumId ? trackingTexts.get(routeSeg.trackingStatusEnumId) : "",
            requestText: last
                ? (requestStatuses.get(last.statusId) || last.statusId) + (last.reasonCode ? " · " + last.reasonCode : "")
                : "",
            requestMessage: last?.resultMessage || null,
            lastPrint: lastPrintOf("ShipmentLabel" + shipment.shipmentId + "-" + row.shipmentPackageSeqId)
        }
    })
    const names = lib.partyNames([shipment.fromPartyId, shipment.toPartyId, segment?.carrierPartyId])
    const methods = Array.from(find(METHOD).orderBy("carrierPartyId,sequenceNum").list())
    const carrierNames = lib.partyNames(methods.map(row => row.carrierPartyId))
    const methodTexts = enumTexts(methods.map(row => row.shipmentMethodEnumId))
    const gatewayCarriers = gateway
        ? rows("mantle.shipment.carrier.ShippingGatewayCarrier", {shippingGatewayConfigId: gateway.shippingGatewayConfigId}).map(
              row => row.carrierPartyId
          )
        : []
    const labelsByGateway =
        !!gateway?.requestLabelsServiceName && (!gatewayCarriers.length || gatewayCarriers.includes(segment?.carrierPartyId))
    const readiness = probeOrNull("mantle.shipment.WarehouseTaskServices.get#ShipReadiness", {shipmentId: shipment.shipmentId})
    const methodOption = row => ({
        value: row.carrierPartyId + ":" + row.shipmentMethodEnumId,
        label:
            carrierName(carrierNames, row.carrierPartyId) + " · " + (row.description || methodTexts.get(row.shipmentMethodEnumId))
    })
    return {
        found: true,
        shipment: {
            shipmentId: shipment.shipmentId,
            statusId: shipment.statusId,
            statusText: statusTexts([shipment.statusId]).get(shipment.statusId) || shipment.statusId,
            typeId: shipment.shipmentTypeEnumId,
            toName: names[shipment.toPartyId] || shipment.toPartyId || "",
            fromName: names[shipment.fromPartyId] || shipment.fromPartyId || "",
            scheduledText: shipment.estimatedShipDate ? lib.bookDay(null, shipment.estimatedShipDate) : "Not set"
        },
        facilityId: sh.facility.facilityId,
        facilityName: sh.facility.facilityName || sh.facility.facilityId,
        segment: segment
            ? {
                  shipmentRouteSegmentSeqId: segment.shipmentRouteSegmentSeqId,
                  carrierPartyId: segment.carrierPartyId || null,
                  carrierName: carrierName(names, segment.carrierPartyId),
                  shipmentMethodEnumId: segment.shipmentMethodEnumId || null,
                  methodText: segment.shipmentMethodEnumId
                      ? enumTexts([segment.shipmentMethodEnumId]).get(segment.shipmentMethodEnumId)
                      : "Not chosen",
                  actualCostText: segment.actualCost != null ? String(segment.actualCost) + " " + (segment.costUomId || "") : null
              }
            : null,
        origin: addressOf(originPostalOf(segment, sh.facility.facilityId)),
        destination: addressOf(segment?.destPostalContactMechId),
        gateway: gateway
            ? {
                  shippingGatewayConfigId: gateway.shippingGatewayConfigId,
                  description: gateway.description || gateway.shippingGatewayConfigId,
                  testMode: gateway.testMode === "Y",
                  validates: !blank(gateway.validateAddressServiceName),
                  refunds: !blank(gateway.refundLabelsServiceName),
                  tracks: !blank(gateway.trackLabelsServiceName)
              }
            : null,
        labelsByGateway,
        packed: shipment.statusId === "ShipPacked",
        shipped: ["ShipShipped", "ShipDelivered"].includes(shipment.statusId),
        shipsElsewhere: elsewhere.includes(shipment.shipmentTypeEnumId),
        packageRows,
        labelCount: packageRows.filter(row => row.hasLabel).length,
        returnLabelCount: packageRows.filter(row => row.hasReturnLabel).length,
        canShip: !!readiness?.canShip,
        blockers: Array.from(readiness?.blockers || []),
        methodOptions: methods.map(methodOption),
        manualMethodOptions: methods
            .filter(row => !gatewayCarriers.includes(row.carrierPartyId) || !gateway?.requestLabelsServiceName)
            .map(methodOption),
        printerBound: !!one(BINDING, {facilityId: sh.facility.facilityId, printerPurposeEnumId: "PtpPackageLabel"})
    }
}
function probeOrNull(service, parameters) {
    try {
        return probe(service, parameters)
    } catch (error) {
        ec.logger.warn("Shipping read " + service + ": " + error.message)
        return null
    }
}
// The packed shipments of the facility (the chosen one, else the user's) waiting to ship.
function shipmentsToShip(userScope, p) {
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let query = find("mantle.shipment.ShipmentAndRouteSegment")
        .condition("statusId", "ShipPacked")
        .condition("shipmentTypeEnumId", "not-in", notShipped.concat(elsewhere))
    query = ids ? query.condition("originFacilityId", "in", ids) : query.condition("originFacilityId", "is-not-null", null)
    const found = Array.from(
        query
            .selectField("shipmentId,toPartyId,estimatedShipDate")
            .distinct(true)
            .orderBy("estimatedShipDate,shipmentId")
            .limit(listLimit)
            .list()
    )
    const names = lib.partyNames(found.map(row => row.toPartyId))
    return {
        shipmentRows: found.map(row => ({
            shipmentId: row.shipmentId,
            toName: names[row.toPartyId] || row.toPartyId || "",
            scheduledText: row.estimatedShipDate ? lib.bookDay(null, row.estimatedShipDate) : "Not set"
        }))
    }
}
// The label PDF of a package, for its preview: the bytes and a file name, the shipment checked first.
function labelDocument(p) {
    const userScope = warehouse.required(warehouse.scope())
    if (!userScope.capabilities.ship && !userScope.capabilities.pack)
        denied("PERMISSION_DENIED", "Labels need the ship permission")
    const sh = outgoing(userScope, p.shipmentId)
    const routeSeg = rows(ROUTE_SEG, {shipmentId: sh.shipment.shipmentId, shipmentPackageSeqId: p.shipmentPackageSeqId})[0]
    const bytes = p.returnLabel === "Y" ? routeSeg?.returnLabelImage : routeSeg?.labelImage
    if (bytes == null) denied("NO_LABEL", "Package " + p.shipmentPackageSeqId + " has no label")
    return {
        bytes,
        fileName:
            (p.returnLabel === "Y" ? "return-label-" : "label-") + sh.shipment.shipmentId + "-" + p.shipmentPackageSeqId + ".pdf"
    }
}

// ===== PackageTracking =====
// Outgoing packages of the user's facilities that shipped: in transit (due), with a failure (exception) or every one, by
// carrier, tracking code, shipment and ETA, filtered in the query and paged.
function tracking(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    const show = p.show || "due"
    // a find is used once: one for the count and one for the page
    const build = () => {
        let query = find(TRACKING).condition("shipmentTypeEnumId", "not-in", notShipped)
        query = ids ? query.condition("originFacilityId", "in", ids) : query.condition("originFacilityId", "is-not-null", null)
        if (show === "due")
            query = query
                .condition("statusId", "ShipShipped")
                .condition(
                    ec.entity.conditionFactory.makeCondition(
                        [
                            ec.entity.conditionFactory.makeCondition("trackingStatusEnumId", "is-null", null),
                            ec.entity.conditionFactory.makeCondition("trackingStatusEnumId", "not-equals", "ShTsDelivered")
                        ],
                        "or"
                    )
                )
        else if (show === "exception") query = query.condition("trackingStatusEnumId", "in", ["ShTsFailure", "ShTsReturned"])
        else query = query.condition("statusId", "in", ["ShipShipped", "ShipDelivered"])
        if (!blank(p.carrierPartyId)) query = query.condition("carrierPartyId", p.carrierPartyId)
        if (!blank(p.shipmentId)) query = query.condition("shipmentId", String(p.shipmentId).trim())
        if (!blank(p.trackingCode)) {
            const escaped = String(p.trackingCode)
                .trim()
                .replace(/[\\%_]/g, character => "\\" + character)
            query = query.condition(
                ec.entity.conditionFactory.makeCondition("trackingCode", "like", "%" + escaped + "%").ignoreCase()
            )
        }
        return query
    }
    const paged = lib.page(
        build().orderBy("trackingEta").orderBy("shipmentId").orderBy("shipmentPackageSeqId"),
        p,
        "trackingRows",
        build().count()
    )
    const found = Array.from(paged.trackingRows || [])
    const names = lib.partyNames(found.flatMap(row => [row.toPartyId, row.carrierPartyId]))
    const statuses = enumTexts(found.map(row => row.trackingStatusEnumId))
    paged.rows = undefined
    paged.trackingRows = found.map(row => ({
        shipmentId: row.shipmentId,
        shipmentPackageSeqId: row.shipmentPackageSeqId,
        toName: names[row.toPartyId] || row.toPartyId || "",
        carrierName: carrierName(names, row.carrierPartyId),
        trackingCode: row.trackingCode || "",
        trackingUrl: row.trackingUrl || null,
        statusText: row.trackingStatusEnumId ? statuses.get(row.trackingStatusEnumId) : "No event yet",
        subStatus: row.trackingSubStatus || "",
        delivered: row.trackingStatusEnumId === "ShTsDelivered",
        exception: ["ShTsFailure", "ShTsReturned"].includes(row.trackingStatusEnumId),
        etaText: row.trackingEta ? lib.bookDay(null, row.trackingEta) : "",
        shippedText: row.actualStartDate ? lib.bookDay(null, row.actualStartDate) : "",
        latestText: row.trackingStatusDate ? lib.dateText(row.trackingStatusDate) : "",
        recipientText: row.deliveryRecipientName || row.deliveryNote || "",
        shipped: row.statusId === "ShipShipped"
    }))
    const carriers = Array.from(find("mantle.party.PartyRole", {roleTypeId: "Carrier"}).list()).map(row => row.partyId)
    const carrierNames = lib.partyNames(carriers)
    return Object.assign(paged, {
        canShip: !!userScope.capabilities.ship,
        carrierOptions: carriers
            .map(id => ({value: id, label: carrierName(carrierNames, id)}))
            .sort((a, b) => a.label.localeCompare(b.label))
    })
}

// ===== Carriers =====
const mask = value => (blank(value) ? "" : String(value).length <= 4 ? "••••" : "••••" + String(value).slice(-4))
function carrierSetup(p) {
    const userScope = warehouse.required(warehouse.scope())
    const methods = Array.from(find(METHOD).orderBy("carrierPartyId,sequenceNum").list())
    const gateways = Array.from(find(GATEWAY).orderBy("shippingGatewayConfigId").list())
    const gatewayCarriers = rows("mantle.shipment.carrier.ShippingGatewayCarrier", {})
    const options = rows("mantle.shipment.carrier.ShippingGatewayOption", {})
    const carrierIds = unique(Array.from(find("mantle.party.PartyRole", {roleTypeId: "Carrier"}).list()).map(row => row.partyId))
    const names = lib.partyNames(carrierIds.concat(methods.map(row => row.carrierPartyId)))
    const methodTexts = enumTexts(methods.map(row => row.shipmentMethodEnumId))
    const optionTexts = enumTexts(options.map(row => row.optionEnumId))
    const methodRows = methods.map(row => {
        const served = gatewayCarriers.filter(item => item.carrierPartyId === row.carrierPartyId)
        return {
            carrierPartyId: row.carrierPartyId,
            carrierName: carrierName(names, row.carrierPartyId),
            shipmentMethodEnumId: row.shipmentMethodEnumId,
            methodText: methodTexts.get(row.shipmentMethodEnumId) || row.shipmentMethodEnumId,
            description: row.description || "",
            sequenceNum: row.sequenceNum,
            gatewayServiceCode: row.gatewayServiceCode || "",
            gatewayText: served.length
                ? served
                      .map(
                          item =>
                              gateways.find(g => g.shippingGatewayConfigId === item.shippingGatewayConfigId)?.description ||
                              item.shippingGatewayConfigId
                      )
                      .join(", ")
                : "No gateway: local rules and tracking by hand"
        }
    })
    const actions = g =>
        [
            ["Rates", g.getShippingRatesBulkName || g.getRateServiceName || g.getOrderRateServiceName],
            ["Labels", g.requestLabelsServiceName],
            ["Refunds", g.refundLabelsServiceName],
            ["Tracking", g.trackLabelsServiceName],
            ["Address check", g.validateAddressServiceName],
            ["Lookup after a timeout", g.findLabelServiceName]
        ]
            .filter(pair => !blank(pair[1]))
            .map(pair => pair[0])
            .join(", ")
    const gatewayRows = gateways.map(g => ({
        shippingGatewayConfigId: g.shippingGatewayConfigId,
        description: g.description || g.shippingGatewayConfigId,
        modeText: g.testMode === "Y" ? "Test" : "Live",
        actionsText: actions(g) || "None",
        carriersText: gatewayCarriers
            .filter(item => item.shippingGatewayConfigId === g.shippingGatewayConfigId)
            .map(
                item =>
                    carrierName(names, item.carrierPartyId) +
                    (item.gatewayAccountId ? " (account " + mask(item.gatewayAccountId) + ")" : "")
            )
            .join(", "),
        // credentials are never shown: each option says only that it is set, with its last characters masked
        credentialsText: options
            .filter(item => item.shippingGatewayConfigId === g.shippingGatewayConfigId)
            .map(
                item =>
                    (optionTexts.get(item.optionEnumId) || item.optionEnumId) +
                    " " +
                    (blank(item.optionValue) ? "not set" : mask(item.optionValue))
            )
            .join(", ")
    }))
    const bindingRows = gatewayCarriers.map(item => ({
        shippingGatewayConfigId: item.shippingGatewayConfigId,
        gatewayText:
            gateways.find(g => g.shippingGatewayConfigId === item.shippingGatewayConfigId)?.description ||
            item.shippingGatewayConfigId,
        carrierPartyId: item.carrierPartyId,
        carrierName: carrierName(names, item.carrierPartyId),
        accountText: mask(item.gatewayAccountId)
    }))
    // CarrierTest's shipments: the packed ones of the user's facilities
    const testShipments = shipmentsToShip(userScope, {facilityId: p.facilityId || null}).shipmentRows
    return {
        methodRows,
        gatewayRows,
        bindingRows,
        canEdit: !!userScope.capabilities.carrierEdit,
        canTest: !!(userScope.capabilities.ship || userScope.capabilities.carrierEdit || userScope.capabilities.facilityEdit),
        carrierOptions: carrierIds
            .map(id => ({value: id, label: carrierName(names, id)}))
            .sort((a, b) => a.label.localeCompare(b.label)),
        methodEnumOptions: Array.from(
            find("moqui.basic.Enumeration", {enumTypeId: "ShipmentMethod"}).orderBy("sequenceNum").list()
        ).map(row => ({
            value: row.enumId,
            label: row.description
        })),
        gatewayOptions: gateways.map(g => ({
            value: g.shippingGatewayConfigId,
            label: g.description || g.shippingGatewayConfigId
        })),
        testShipmentOptions: testShipments.map(row => ({value: row.shipmentId, label: row.shipmentId + " · " + row.toName}))
    }
}

// ===== printers =====
function bindingRowsOf(facilities, printerTexts, purposeTexts) {
    const facilityIds = facilities.map(row => row.facilityId)
    if (!facilityIds.length) return []
    return Array.from(
        find(BINDING).condition("facilityId", "in", facilityIds).orderBy("facilityId,printerPurposeEnumId").list()
    ).map(row => ({
        facilityId: row.facilityId,
        facilityName: facilities.find(item => item.facilityId === row.facilityId)?.facilityName || row.facilityId,
        printerPurposeEnumId: row.printerPurposeEnumId,
        purposeText: purposeTexts.get(row.printerPurposeEnumId) || row.printerPurposeEnumId,
        networkPrinterId: row.networkPrinterId,
        printerText: printerTexts.get(row.networkPrinterId) || row.networkPrinterId || "",
        copies: number(row.copies) || 1,
        fromText: row.fromDate ? lib.bookDay(null, row.fromDate) : "",
        thruText: row.thruDate ? lib.bookDay(null, row.thruDate) : "",
        inEffect: inEffect(row)
    }))
}
function printerIndex(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let facilityQuery = find("mantle.facility.Facility").selectField("facilityId,facilityName").orderBy("facilityName").limit(500)
    if (ids) facilityQuery = facilityQuery.condition("facilityId", "in", ids)
    const facilities = Array.from(facilityQuery.list())
    const printers = rows(PRINTER, {})
    const printerTexts = new Map(
        printers.map(row => [row.networkPrinterId, row.description || row.printerName || row.networkPrinterId])
    )
    const purposes = rows("moqui.basic.Enumeration", {enumTypeId: "PrinterPurpose"})
    const purposeTexts = new Map(purposes.map(row => [row.enumId, row.description]))
    const bindings = bindingRowsOf(facilities, printerTexts, purposeTexts)
    // what each printer takes, through Mantle (a reader with no warehouse permission sees none)
    const capabilities = probeOrNull("mantle.facility.PrintServices.get#PrinterCapabilities", {})
    const byPrinter = new Map(Array.from(capabilities?.printers || []).map(row => [row.networkPrinterId, row]))
    for (const row of bindings) {
        const capability = byPrinter.get(row.networkPrinterId)
        row.capabilityText = capability
            ? capability.formats.join(", ") +
              " · " +
              {used: "printing", failing: "last job failed", unavailable: "printing not installed", unknown: "not used yet"}[
                  capability.availability
              ]
            : ""
    }
    return {
        bindingRows: bindings,
        printerOptions: printers.map(row => ({value: row.networkPrinterId, label: printerTexts.get(row.networkPrinterId)})),
        purposeOptions: purposes
            .map(row => ({value: row.enumId, label: row.description}))
            .sort((a, b) => a.label.localeCompare(b.label)),
        facilityOptions: facilities.map(row => ({value: row.facilityId, label: row.facilityName || row.facilityId})),
        canEdit: !!userScope.capabilities.facilityEdit,
        canTest: Object.keys(userScope.capabilities).some(
            name => name !== "read" && name !== "financialRead" && userScope.capabilities[name]
        )
    }
}
function facilityPrinters(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) denied("FACILITY_UNAVAILABLE", "Choose a facility")
    const index = printerIndex({facilityId: facility.facilityId})
    return Object.assign(index, {facilityId: facility.facilityId, canEdit: !!userScope.capabilities.facilityEdit})
}

// ===== label sheets =====
// The labels of locations, lots, serials, containers or box types, each a Code 128 of the code the Warehouse scan resolver
// reads (a location's id in its facility, a lot's id, a unit's serial number, a container's id, a box type's id).
function labelSheet(p) {
    const userScope = warehouse.required(warehouse.scope())
    const ids = unique(String(p.ids || "").split(/[\s,]+/)).slice(0, 200)
    const facility = facilityOf(userScope, p.facilityId)
    const labels = []
    const add = (code, title, lines) => {
        try {
            labels.push({
                code,
                title,
                lines: lines.filter(value => !blank(value)).join(" · "),
                svg: ec.resource.barcodeSvg("Code128", code, {moduleWidth: 0.3, height: 14, quietZone: 10, humanReadable: true})
            })
        } catch (error) {
            ec.logger.warn("Label for " + code + ": " + error.message)
        }
    }
    const kind = p.kind
    if (kind === "location") {
        if (!facility) denied("FACILITY_UNAVAILABLE", "Choose a facility")
        let query = find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId}).condition(
            "thruDate",
            "is-null",
            null
        )
        if (ids.length) query = query.condition("locationSeqId", "in", ids)
        for (const row of Array.from(query.orderBy("sequenceNum,locationSeqId").limit(200).list()))
            add(row.locationSeqId, row.locationSeqId, [
                facility.facilityName || facility.facilityId,
                row.description,
                [row.areaId, row.aisleId, row.sectionId, row.levelId, row.positionId].filter(Boolean).join("-")
            ])
    } else if (kind === "lot") {
        for (const lotId of ids) {
            try {
                const record = warehouse.recordOf(userScope, "lot", lotId)
                const lot = one("mantle.product.asset.Lot", {lotId})
                add(lotId, "Lot " + (lot.lotNumber || lotId), [
                    record.label,
                    lot.expirationDate ? "Expires " + lib.bookDay(null, lot.expirationDate) : ""
                ])
            } catch (error) {
                ec.logger.info("Lot label " + lotId + ": " + error.message)
            }
        }
    } else if (kind === "serial" || kind === "container") {
        for (const id of ids) {
            try {
                warehouse.recordOf(userScope, kind === "serial" ? "asset" : "container", id)
                if (kind === "serial") {
                    const asset = one("mantle.product.asset.Asset", {assetId: id})
                    if (blank(asset.serialNumber)) continue
                    const product = asset.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
                    add(asset.serialNumber, "Serial " + asset.serialNumber, [product?.productName, asset.assetId])
                } else {
                    const box = one("mantle.product.asset.Container", {containerId: id})
                    add(id, "Container " + id, [box.serialNumber, box.locationSeqId])
                }
            } catch (error) {
                ec.logger.info("Label " + id + ": " + error.message)
            }
        }
    } else if (kind === "box") {
        let query = find("mantle.shipment.ShipmentBoxType")
        if (ids.length) query = query.condition("shipmentBoxTypeId", "in", ids)
        for (const row of Array.from(query.orderBy("description").limit(200).list())) {
            const dims = [row.boxLength, row.boxWidth, row.boxHeight].every(value => value != null)
                ? [row.boxLength, row.boxWidth, row.boxHeight].map(quantityText).join(" × ")
                : ""
            add(row.shipmentBoxTypeId, row.description || row.shipmentBoxTypeId, [
                dims,
                row.maxWeight != null ? "up to " + quantityText(row.maxWeight) : ""
            ])
        }
    } else denied("KIND_INVALID", "Choose a kind of label")
    const titles = {
        location: "Location labels",
        lot: "Lot labels",
        serial: "Serial labels",
        container: "Container labels",
        box: "Box labels"
    }
    return {kind, title: titles[kind], facilityId: facility?.facilityId || null, labels}
}

// ===== the carrier manifest =====
// The packages a carrier takes from the facility on a day: shipped that day, or packed and labelled waiting for pickup.
function manifest(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) denied("FACILITY_UNAVAILABLE", "Choose a facility")
    const day = blank(p.day) ? todayText() : String(p.day).slice(0, 10)
    const from = ec.l10n.parseTimestamp(day + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
    const thru = new Date(lib.ms(from) + 86400000)
    let shipped = find(TRACKING, {originFacilityId: facility.facilityId})
        .condition("shipmentTypeEnumId", "not-in", notShipped)
        .condition("actualStartDate", "greater-equals", from)
        .condition("actualStartDate", "less", thru)
    let waiting = find(TRACKING, {originFacilityId: facility.facilityId, statusId: "ShipPacked"})
        .condition("shipmentTypeEnumId", "not-in", notShipped)
        .condition("trackingCode", "is-not-null", null)
    if (!blank(p.carrierPartyId)) {
        shipped = shipped.condition("carrierPartyId", p.carrierPartyId)
        waiting = waiting.condition("carrierPartyId", p.carrierPartyId)
    }
    const found = Array.from(shipped.orderBy("shipmentId,shipmentPackageSeqId").limit(500).list()).concat(
        Array.from(waiting.orderBy("shipmentId,shipmentPackageSeqId").limit(500).list())
    )
    const packages = found.length
        ? Array.from(
              find(PACKAGE)
                  .condition("shipmentId", "in", unique(found.map(row => row.shipmentId)))
                  .list()
          )
        : []
    const names = lib.partyNames(found.flatMap(row => [row.toPartyId, row.carrierPartyId]).concat([p.carrierPartyId]))
    const units = uomTexts(packages.map(row => row.weightUomId))
    const methodTexts = enumTexts(found.map(row => row.shipmentMethodEnumId))
    const manifestRows = found.map(row => {
        const pkg = packages.find(
            item => item.shipmentId === row.shipmentId && item.shipmentPackageSeqId === row.shipmentPackageSeqId
        )
        return {
            shipmentId: row.shipmentId,
            shipmentPackageSeqId: row.shipmentPackageSeqId,
            toName: names[row.toPartyId] || row.toPartyId || "",
            carrierName: carrierName(names, row.carrierPartyId),
            methodText: methodTexts.get(row.shipmentMethodEnumId) || "",
            trackingCode: row.trackingCode || "",
            weightText: pkg?.weight != null ? quantityText(pkg.weight) + " " + (units.get(pkg.weightUomId) || "") : "",
            stateText: row.statusId === "ShipPacked" ? "Waiting for pickup" : "Shipped"
        }
    })
    return {
        facilityId: facility.facilityId,
        facilityName: facility.facilityName || facility.facilityId,
        day,
        carrierName: blank(p.carrierPartyId) ? "Every carrier" : carrierName(names, p.carrierPartyId),
        manifestRows,
        packageCount: manifestRows.length
    }
}

// ===== Home =====
// Home's shipping queue at the facility: ready (packed, waiting to ship), waiting (shipped, not delivered), late (packed
// from an earlier day's estimated ship date).
function homeQueue(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) return {}
    const base = status =>
        find("mantle.shipment.ShipmentAndRouteSegment", {originFacilityId: facility.facilityId})
            .condition("statusId", status)
            .condition("shipmentTypeEnumId", "not-in", notShipped.concat(elsewhere))
    const distinctCount = query => Array.from(query.selectField("shipmentId").distinct(true).limit(2000).list()).length
    return {
        readyCount: distinctCount(base("ShipPacked")),
        waitingCount: distinctCount(base("ShipShipped")),
        lateCount: distinctCount(base("ShipPacked").condition("estimatedShipDate", "less", startOfToday()))
    }
}

// ===== InvoiceDetail's Warehouse context (crosscut §3.16) =====
// An invoice linked to a shipment of the user's facilities: its header, its lines with their source shipments and
// quantities, the shipments, and its posting and payment summary; amounts only with financial read. Read and print only.
function invoiceEvidence(p) {
    const userScope = warehouse.required(warehouse.scope())
    const invoice = blank(p.invoiceId) ? null : one("mantle.account.invoice.Invoice", {invoiceId: p.invoiceId})
    const billings = invoice ? rows("mantle.order.OrderItemBilling", {invoiceId: invoice.invoiceId}) : []
    const sourceShipments = invoice
        ? rows("mantle.shipment.ShipmentItemSource", {invoiceId: invoice.invoiceId}).map(row => row.shipmentId)
        : []
    const shipmentIds = unique(billings.map(row => row.shipmentId).concat(sourceShipments)).sort()
    const visible = shipmentIds.filter(shipmentId => {
        try {
            warehouse.recordOf(userScope, "shipment", shipmentId)
            return true
        } catch (error) {
            return false
        }
    })
    if (!invoice || !visible.length) return {found: false}
    const financialRead = !!userScope.capabilities.financialRead
    const items = rows("mantle.account.invoice.InvoiceItem", {invoiceId: invoice.invoiceId}).sort(bySeq("invoiceItemSeqId"))
    const productNames = namesOf(
        "mantle.product.Product",
        "productId",
        "productName",
        items.map(row => row.productId)
    )
    const typeTexts = enumTexts(items.map(row => row.itemTypeEnumId).concat([invoice.invoiceTypeEnumId]))
    const names = lib.partyNames([invoice.fromPartyId, invoice.toPartyId])
    const shipments = Array.from(find(SHIPMENT).condition("shipmentId", "in", visible).list())
    const shipmentStatuses = statusTexts(shipments.map(row => row.statusId))
    const money = value => (value == null ? "" : ec.l10n.formatCurrency(value, invoice.currencyUomId))
    const lineRows = items.map(row => {
        const lineBillings = billings.filter(item => item.invoiceItemSeqId === row.invoiceItemSeqId)
        const lineShipments = unique(lineBillings.map(item => item.shipmentId)).filter(id => visible.includes(id))
        return Object.assign(
            {
                invoiceItemSeqId: row.invoiceItemSeqId,
                typeText: typeTexts.get(row.itemTypeEnumId) || row.itemTypeEnumId || "",
                productName: row.productId ? productNames.get(row.productId) || row.productId : row.description || "",
                quantity: row.quantity == null ? null : number(row.quantity),
                shipmentsText: lineShipments.join(", "),
                shippedQuantity: lineBillings.reduce((sum, item) => sum + number(item.quantity), 0)
            },
            financialRead ? {amountText: money(number(row.quantity ?? 1) * number(row.amount))} : {}
        )
    })
    const posted = rows("mantle.ledger.transaction.AcctgTrans", {invoiceId: invoice.invoiceId})
    const answer = {
        found: true,
        financialRead,
        invoice: {
            invoiceId: invoice.invoiceId,
            typeText: typeTexts.get(invoice.invoiceTypeEnumId) || "Invoice",
            statusText: statusTexts([invoice.statusId]).get(invoice.statusId) || invoice.statusId,
            fromName: names[invoice.fromPartyId] || invoice.fromPartyId || "",
            toName: names[invoice.toPartyId] || invoice.toPartyId || "",
            invoiceDateText: invoice.invoiceDate ? lib.bookDay(null, invoice.invoiceDate) : "",
            dueDateText: invoice.dueDate ? lib.bookDay(null, invoice.dueDate) : "",
            postedText: posted.some(row => row.isPosted === "Y") ? "Posted" : posted.length ? "Not posted yet" : "No posting"
        },
        lineRows,
        shipmentRows: shipments.map(row => ({
            shipmentId: row.shipmentId,
            statusText: shipmentStatuses.get(row.statusId) || row.statusId
        }))
    }
    if (financialRead)
        Object.assign(answer.invoice, {
            totalText: money(invoice.invoiceTotal),
            unpaidText: money(invoice.unpaidTotal),
            paidText:
                invoice.invoiceTotal != null && invoice.unpaidTotal != null
                    ? money(number(invoice.invoiceTotal) - number(invoice.unpaidTotal))
                    : ""
        })
    return answer
}

const operations = {
    shipContext,
    labelDocument,
    tracking,
    carrierSetup,
    printerIndex,
    facilityPrinters,
    labelSheet,
    manifest,
    homeQueue,
    invoiceEvidence
}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse shipping operation " + op)
        return operations[op](parameters)
    }
})
