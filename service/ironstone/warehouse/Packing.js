// The Warehouse packing screens' reads (impl-warehouse P12, design-warehouse §10 Pack, §12 BoxTypes, §16 outputs and
// crosscut §3.9 MaterialIssueReceipt): the Pack task (desk and Handheld/Pack), the shipments ready to pack, BoxTypes,
// FacilityDetail's Box types tab, the packing slip with its package contents and inserts, MaterialIssueReceipt's shipment
// assembly source and Home's packing queue. Every read is limited to the user's Warehouse facilities (a shipment by its first
// route segment's origin, F55); the postings are Mantle's (WarehouseTaskServices pack#ShipmentStock, pack#ShipmentAssembly,
// edit#ShipmentPackage, complete#Pack, reopen#ShipmentPackage; PackagingServices for box types), which the screens call after
// AccessServices.check#Record. A kit's cost and a movement's value are read only with financial read; an invoice shows its
// status only.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, rows, denied} = lib

const SHIPMENT = "mantle.shipment.Shipment",
    SOURCE = "mantle.shipment.ShipmentItemSource",
    PACKAGE = "mantle.shipment.ShipmentPackage",
    CONTENT = "mantle.shipment.ShipmentPackageContent",
    ISSUANCE = "mantle.product.issuance.AssetIssuance",
    BOX = "mantle.shipment.ShipmentBoxType"
const packable = ["ShipInput", "ShipScheduled", "ShipPicked"]
const shipped = ["ShipShipped", "ShipDelivered"]
const notPacked = ["ShpTpPurchase", "ShpTpSalesReturn", "ShpTpDrop"]
const listLimit = 50
const number = value => (value == null || value === "" ? 0 : Number(String(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const quantityText = value => ec.l10n.format(number(value), "#,##0.###")
const todayText = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
const startOfToday = () => ec.l10n.parseTimestamp(todayText() + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
const retired = box => box?.thruDate != null && lib.ms(box.thruDate) <= lib.ms(ec.user.nowTimestamp)

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
const productNames = ids => namesOf("mantle.product.Product", "productId", "productName", ids)
const statusTexts = ids => namesOf("moqui.basic.StatusItem", "statusId", "description", ids)
const uomTexts = ids => namesOf("moqui.basic.Uom", "uomId", "abbreviation", ids)
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
// An outgoing shipment leaving one of the user's facilities, with that facility; another is refused as missing.
function outgoing(userScope, shipmentId) {
    warehouse.recordOf(userScope, "shipment", shipmentId)
    const shipment = one(SHIPMENT, {shipmentId})
    const segment = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId}).sort((a, b) =>
        String(a.shipmentRouteSegmentSeqId).localeCompare(String(b.shipmentRouteSegmentSeqId))
    )[0]
    const facility = segment?.originFacilityId ? one("mantle.facility.Facility", {facilityId: segment.originFacilityId}) : null
    if (!shipment || notPacked.includes(shipment.shipmentTypeEnumId) || !warehouse.inScope(userScope, facility))
        denied("RECORD_UNAVAILABLE", "Shipment " + shipmentId + " does not leave from a facility you work in")
    return {shipment, facility, segment}
}
// The box types a package at the facility may take: the facility's own, else every type in use.
function boxOptions(facilityId) {
    const own = rows("mantle.facility.FacilityBoxType", {facilityId}).map(row => row.shipmentBoxTypeId)
    const boxes = (own.length ? Array.from(find(BOX).condition("shipmentBoxTypeId", "in", own).list()) : rows(BOX, {}))
        .filter(box => !retired(box))
        .sort((a, b) => String(a.description || a.shipmentBoxTypeId).localeCompare(String(b.description || b.shipmentBoxTypeId)))
    return boxes.map(box => ({value: box.shipmentBoxTypeId, label: box.description || box.shipmentBoxTypeId}))
}
// Each package with its box, weight and contents.
function packagesOf(shipmentId) {
    const packages = rows(PACKAGE, {shipmentId}).sort((a, b) =>
        String(a.shipmentPackageSeqId).localeCompare(String(b.shipmentPackageSeqId))
    )
    const contents = rows(CONTENT, {shipmentId})
    const boxes = namesOf(
        BOX,
        "shipmentBoxTypeId",
        "description",
        packages.map(row => row.shipmentBoxTypeId)
    )
    const units = uomTexts(packages.map(row => row.weightUomId))
    const names = productNames(contents.map(row => row.productId))
    // the assets each product was packed from, for a reopen that names the stock that comes out (F287)
    const issued = rows(ISSUANCE, {shipmentId}).filter(row => number(row.quantity) > 0)
    const assetLabel = assetId => {
        const asset = one("mantle.product.asset.Asset", {assetId})
        const quantity = issued.filter(row => row.assetId === assetId).reduce((sum, row) => sum + number(row.quantity), 0)
        return [assetId, asset?.lotId ? "lot " + asset.lotId : "", asset?.serialNumber || "", quantityText(quantity) + " packed"]
            .filter(Boolean)
            .join(" · ")
    }
    return packages.map((row, index) => {
        const inside = contents.filter(
            content => content.shipmentPackageSeqId === row.shipmentPackageSeqId && number(content.quantity) > 0
        )
        return {
            shipmentPackageSeqId: row.shipmentPackageSeqId,
            packageNumber: index + 1,
            shipmentBoxTypeId: row.shipmentBoxTypeId || null,
            boxText: boxes.get(row.shipmentBoxTypeId) || row.shipmentBoxTypeId || "No box type",
            weight: row.weight == null ? null : number(row.weight),
            weightUomId: row.weightUomId || null,
            weightText:
                row.weight == null
                    ? "Not weighed"
                    : quantityText(row.weight) + " " + (units.get(row.weightUomId) || row.weightUomId || ""),
            contentRows: inside.map(content => ({
                shipmentPackageSeqId: row.shipmentPackageSeqId,
                productId: content.productId,
                productName: names.get(content.productId) || content.productId,
                quantity: number(content.quantity)
            })),
            assetOptions: unique(
                issued.filter(issue => inside.some(content => content.productId === issue.productId)).map(issue => issue.assetId)
            ).map(assetId => ({value: assetId, label: assetLabel(assetId)})),
            contentsText:
                inside
                    .map(content => quantityText(content.quantity) + " × " + (names.get(content.productId) || content.productId))
                    .join(", ") || "Empty"
        }
    })
}
// The shipment's invoices with their status only (amounts stay with Accounting).
function invoiceStates(shipmentId) {
    const ids = unique(rows("mantle.order.OrderItemBilling", {shipmentId}).map(row => row.invoiceId))
    const invoices = ids.map(invoiceId => one("mantle.account.invoice.Invoice", {invoiceId})).filter(Boolean)
    const statuses = statusTexts(invoices.map(row => row.statusId))
    return invoices.map(row => ({
        invoiceId: row.invoiceId,
        statusId: row.statusId,
        statusText: statuses.get(row.statusId) || row.statusId
    }))
}

// ===== the Pack task =====
// One outgoing shipment: its lines with picked, packed and left; its packages with their contents; the pick assemblies'
// components; the box types; the invoice states; what the packer may do. Without a shipment, the shipments to pack at the
// facility. RECORD_UNAVAILABLE for a shipment outside the scope.
// The Pack task's read: for the pack capability only, on the desk and the Handheld mount alike (F291, P11's F263 rule).
function packContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    if (!userScope.capabilities.pack) denied("PERMISSION_DENIED", "Packing needs the pack permission")
    return contextOf(p)
}
// What the packing slip and MaterialIssueReceipt read as well: the shipment's lines, packages and kits.
function contextOf(p) {
    const userScope = warehouse.required(warehouse.scope())
    const can = userScope.capabilities
    if (!p.shipmentId) return Object.assign({found: false, canPack: !!can.pack}, shipmentsToPack(userScope, p))
    const {shipment, facility} = outgoing(userScope, p.shipmentId)
    const sources = rows(SOURCE, {shipmentId: shipment.shipmentId}).filter(
        row => row.statusId !== "SisCancelled" && number(row.quantity) > 0
    )
    const names = productNames(sources.map(row => row.productId))
    const products = new Map(sources.map(row => [row.productId, one("mantle.product.Product", {productId: row.productId})]))
    const lines = sources.map(row => ({
        shipmentItemSourceId: row.shipmentItemSourceId,
        productId: row.productId,
        productName: names.get(row.productId) || row.productId,
        sourceText: row.orderId ? row.orderId + ":" + row.orderItemSeqId : row.returnId || "",
        quantity: number(row.quantity),
        picked: number(row.quantityPicked),
        packed: Math.max(0, number(row.quantity) - number(row.quantityNotHandled)),
        left: number(row.quantityNotHandled),
        putBack: number(row.putBackQuantity),
        assembly: products.get(row.productId)?.productTypeEnumId === "PtPickAssembly"
    }))
    const packages = packagesOf(shipment.shipmentId)
    const statuses = statusTexts([shipment.statusId])
    const names2 = lib.partyNames([shipment.toPartyId])
    const isPackable = packable.includes(shipment.statusId)
    const reopenable = isPackable || shipment.statusId === "ShipPacked"
    return {
        found: true,
        shipment: {
            shipmentId: shipment.shipmentId,
            toName: names2[shipment.toPartyId] || shipment.toPartyId || "",
            facilityId: facility.facilityId,
            facilityName: facility.facilityName || facility.facilityId,
            statusId: shipment.statusId,
            statusText: statuses.get(shipment.statusId) || shipment.statusId,
            assemblyWorkEffortId: shipment.assemblyWorkEffortId || null
        },
        facilityId: facility.facilityId,
        lines,
        openLines: lines.filter(row => row.left > 0),
        assemblyLines: assemblyRows(shipment, lines),
        packages,
        contentRows: packages.flatMap(row => row.contentRows),
        activePackageSeqId: packages.length ? packages[packages.length - 1].shipmentPackageSeqId : null,
        packageOptions: packages.map(row => ({
            value: row.shipmentPackageSeqId,
            label: "Package " + row.packageNumber + " · " + row.boxText
        })),
        boxOptions: boxOptions(facility.facilityId),
        invoices: invoiceStates(shipment.shipmentId),
        packCapability: !!can.pack,
        canPack: !!can.pack && isPackable,
        canReopen: !!can.pack && reopenable && packages.some(row => row.contentRows.length),
        canPick: !!can.pick,
        packedCount: lines.reduce((sum, row) => sum + row.packed, 0),
        leftCount: lines.reduce((sum, row) => sum + row.left, 0),
        putBackCount: lines.filter(row => row.putBack > 0 || row.picked > row.packed + row.left).length
    }
}
// A pick assembly line's components: required (line quantity × component quantity), issued to the shipment's assembly
// work effort, and the kits made so far.
function assemblyRows(shipment, lines) {
    const assemblies = lines.filter(row => row.assembly)
    if (!assemblies.length) return []
    const issuances = shipment.assemblyWorkEffortId ? rows(ISSUANCE, {workEffortId: shipment.assemblyWorkEffortId}) : []
    const result = []
    for (const line of assemblies) {
        const bom = Array.from(
            find("mantle.product.ProductAssoc", {productId: line.productId, productAssocTypeEnumId: "PatMfgBom"})
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .list()
        )
        const names = productNames(bom.map(row => row.toProductId))
        for (const component of bom)
            result.push({
                assemblyProductId: line.productId,
                assemblyName: line.productName,
                productId: component.toProductId,
                productName: names.get(component.toProductId) || component.toProductId,
                required: line.quantity * (number(component.quantity) || 1),
                issued: issuances
                    .filter(row => row.productId === component.toProductId)
                    .reduce((sum, row) => sum + number(row.quantity), 0)
            })
    }
    return result.map(row => Object.assign(row, {left: Math.max(0, row.required - row.issued)}))
}
// The shipments of the facility (the chosen one, else the user's) that can be packed, picked ones first.
function shipmentsToPack(userScope, p) {
    const facility = facilityOf(userScope, p.facilityId)
    const ids = facility ? [facility.facilityId] : warehouse.facilityIds(userScope)
    let query = find("mantle.shipment.ShipmentAndRouteSegment")
        .condition("statusId", "in", packable)
        .condition("shipmentTypeEnumId", "not-in", notPacked)
    query = ids ? query.condition("originFacilityId", "in", ids) : query.condition("originFacilityId", "is-not-null", null)
    const found = Array.from(
        query
            .selectField("shipmentId,statusId,toPartyId,estimatedShipDate,originFacilityId")
            .distinct(true)
            .orderBy("-statusId,estimatedShipDate,shipmentId")
            .limit(listLimit)
            .list()
    )
    const statuses = statusTexts(found.map(row => row.statusId))
    const names = lib.partyNames(found.map(row => row.toPartyId))
    return {
        shipmentRows: found.map(row => ({
            shipmentId: row.shipmentId,
            statusText: statuses.get(row.statusId) || row.statusId,
            toName: names[row.toPartyId] || row.toPartyId || "",
            scheduledText: row.estimatedShipDate ? lib.bookDay(null, row.estimatedShipDate) : "Not set"
        }))
    }
}

// ===== box types =====
// Every box type (retired ones with showRetired), its dimensions, weights, carrier codes and whether the facility uses it.
function boxTypes(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const boxes = rows(BOX, {})
        .filter(box => p.showRetired === "Y" || !retired(box))
        .sort((a, b) => String(a.description || a.shipmentBoxTypeId).localeCompare(String(b.description || b.shipmentBoxTypeId)))
    const units = uomTexts(boxes.flatMap(box => [box.dimensionUomId, box.weightUomId]))
    const codes = rows("mantle.shipment.carrier.CarrierShipmentBoxType", {})
    const carriers = lib.partyNames(codes.map(row => row.carrierPartyId))
    const used = facility
        ? rows("mantle.facility.FacilityBoxType", {facilityId: facility.facilityId}).map(row => row.shipmentBoxTypeId)
        : []
    const dims = box =>
        [box.boxLength, box.boxWidth, box.boxHeight].every(value => value != null)
            ? [box.boxLength, box.boxWidth, box.boxHeight].map(quantityText).join(" × ") +
              " " +
              (units.get(box.dimensionUomId) || "")
            : ""
    const weightText = (value, box) => (value == null ? "" : quantityText(value) + " " + (units.get(box.weightUomId) || ""))
    return {
        boxRows: boxes.map(box => ({
            shipmentBoxTypeId: box.shipmentBoxTypeId,
            description: box.description || box.shipmentBoxTypeId,
            dimensionsText: dims(box),
            boxWeightText: weightText(box.boxWeight, box),
            maxWeightText: weightText(box.maxWeight, box),
            stateText: retired(box) ? "Retired" : "In use",
            stateLabel: (retired(box) ? "Retired" : "In use") + (used.includes(box.shipmentBoxTypeId) ? " · used here" : ""),
            stateColor: retired(box) ? "grey-8" : "positive",
            retired: retired(box),
            usedHere: used.includes(box.shipmentBoxTypeId),
            dimensionUomId: box.dimensionUomId,
            boxLength: box.boxLength,
            boxWidth: box.boxWidth,
            boxHeight: box.boxHeight,
            weightUomId: box.weightUomId,
            boxWeight: box.boxWeight,
            maxWeight: box.maxWeight
        })),
        codeRows: codes.map(row => ({
            carrierPartyId: row.carrierPartyId,
            carrierName: carriers[row.carrierPartyId] || row.carrierPartyId,
            shipmentBoxTypeId: row.shipmentBoxTypeId,
            description: boxes.find(box => box.shipmentBoxTypeId === row.shipmentBoxTypeId)?.description || row.shipmentBoxTypeId,
            packagingTypeCode: row.packagingTypeCode,
            oversizeCode: row.oversizeCode || ""
        })),
        boxOptions: boxes
            .filter(box => !retired(box))
            .map(box => ({value: box.shipmentBoxTypeId, label: box.description || box.shipmentBoxTypeId})),
        carrierOptions: rows("mantle.party.PartyRole", {roleTypeId: "Carrier"})
            .map(row => row.partyId)
            .filter(id => id !== "_NA_")
            .map(id => ({value: id, label: lib.partyNames([id])[id] || id})),
        lengthUnits: unitOptions("UT_LENGTH_MEASURE"),
        weightUnits: unitOptions("UT_WEIGHT_MEASURE"),
        facilityId: facility?.facilityId || null,
        canEdit: !!userScope.capabilities.facilityEdit
    }
}
function unitOptions(uomTypeEnumId) {
    return rows("moqui.basic.Uom", {uomTypeEnumId})
        .sort((a, b) => String(a.description).localeCompare(String(b.description)))
        .map(row => ({value: row.uomId, label: row.description + (row.abbreviation ? " (" + row.abbreviation + ")" : "")}))
}
// FacilityDetail's Box types tab: the facility's box types and the types in use it could add.
function facilityBoxTypes(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) denied("FACILITY_UNAVAILABLE", "Choose a facility")
    const all = boxTypes({facilityId: facility.facilityId})
    return {
        facilityBoxRows: all.boxRows.filter(row => row.usedHere),
        addOptions: all.boxRows.filter(row => !row.usedHere).map(row => ({value: row.shipmentBoxTypeId, label: row.description})),
        canEdit: all.canEdit
    }
}

// ===== outputs =====
// The packing slip (the shipment's lines), each package's contents, and the insert of each package (ship-to, package n of
// m, contents); printing posts nothing.
function packingSlip(p) {
    const context = contextOf({shipmentId: p.shipmentId})
    const shipment = one(SHIPMENT, {shipmentId: p.shipmentId})
    const address = shipment ? addressText(shipment) : ""
    const count = context.packages.length
    return Object.assign(context, {
        shipToText: address,
        printedText: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd HH:mm"),
        insertRows: context.packages.map(row => Object.assign({}, row, {ofText: "Package " + row.packageNumber + " of " + count}))
    })
}
function addressText(shipment) {
    const segment = rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: shipment.shipmentId})[0]
    const address = segment?.destPostalContactMechId
        ? one("mantle.party.contact.PostalAddress", {contactMechId: segment.destPostalContactMechId})
        : null
    if (!address) return ""
    return [address.toName, address.address1, address.address2, [address.city, address.postalCode].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
}

// ===== MaterialIssueReceipt, the shipment assembly source =====
// A shipment's pick assembly work effort: the components required, issued and left, the kits received, and the issuances
// and receipts; costs and values only with financial read.
function assemblySource(p) {
    const userScope = warehouse.required(warehouse.scope())
    const {shipment, facility} = outgoing(userScope, p.sourceId)
    const financial = !!userScope.capabilities.financialRead
    const context = contextOf({shipmentId: shipment.shipmentId})
    const workEffortId = shipment.assemblyWorkEffortId || null
    const effort = workEffortId ? one("mantle.work.effort.WorkEffort", {workEffortId}) : null
    const issuances = workEffortId ? rows(ISSUANCE, {workEffortId}) : []
    const receipts = workEffortId ? rows("mantle.product.receipt.AssetReceipt", {workEffortId}) : []
    const names = productNames(issuances.map(row => row.productId).concat(receipts.map(row => row.productId)))
    const asset = assetId => (assetId ? one("mantle.product.asset.Asset", {assetId}) : null)
    const moneyText = (value, currency) => (financial && value != null ? ec.l10n.formatCurrency(value, currency || null) : null)
    const statuses = statusTexts([effort?.statusId])
    return {
        found: true,
        sourceType: "shipmentAssembly",
        // what the shared screen shows of the source: its title, caption, state, links and its line action's words
        source: {
            sourceId: shipment.shipmentId,
            title: "Kit assembly for shipment " + shipment.shipmentId,
            caption: (effort?.workEffortName || "No assembly work yet") + " · " + (facility.facilityName || facility.facilityId),
            statusText: effort ? statuses.get(effort.statusId) || effort.statusId : "Not started",
            emptyText: "This shipment has no kit to assemble.",
            actionText: "Pack",
            submitText: "Pack component",
            links: [
                {
                    text: "Pack",
                    path: "Shipping/Pack",
                    icon: "sym_o_inventory_2",
                    primary: true,
                    parameters: {shipmentId: shipment.shipmentId}
                },
                {
                    text: "Shipment",
                    path: "Shipping/ShipmentDetail",
                    icon: "sym_o_local_shipping",
                    primary: false,
                    parameters: {shipmentId: shipment.shipmentId}
                }
            ]
        },
        materialRows: context.assemblyLines.map(row =>
            Object.assign({}, row, {
                lineKey: row.productId,
                lineTitle: row.productName + " for " + row.assemblyName,
                canAct: context.canPack && row.left > 0
            })
        ),
        movementRows: issuances
            .map(row => {
                const stock = asset(row.assetId)
                return {
                    kind: "Issue",
                    productName: names.get(row.productId) || row.productId,
                    assetId: row.assetId,
                    lotId: stock?.lotId || "",
                    quantity: number(row.quantity),
                    dateText: row.issuedDate ? lib.bookDay(null, row.issuedDate) : "",
                    valueText: moneyText(number(row.quantity) * number(stock?.acquireCost), stock?.acquireCostUomId)
                }
            })
            .concat(
                receipts.map(row => {
                    const kit = asset(row.assetId)
                    return {
                        kind: "Kit received",
                        productName: names.get(row.productId) || row.productId,
                        assetId: row.assetId,
                        lotId: kit?.lotId || "",
                        quantity: number(row.quantityAccepted),
                        dateText: row.receivedDate ? lib.bookDay(null, row.receivedDate) : "",
                        valueText:
                            kit?.acquireCost == null
                                ? financial
                                    ? "No cost"
                                    : null
                                : moneyText(number(row.quantityAccepted) * number(kit.acquireCost), kit.acquireCostUomId)
                    }
                })
            ),
        financialRead: financial,
        canPack: context.canPack,
        packageOptions: context.packageOptions,
        activePackageSeqId: context.activePackageSeqId
    }
}
// A posted line of the shipment assembly: pack that component of the kit (WarehouseTaskServices.pack#ShipmentAssembly)
// after check#Record of the shipment with pack. The Mantle entry point checks everything again.
function assemblyAction(p) {
    return {
        recordType: "shipment",
        recordId: p.sourceId,
        capability: "pack",
        serviceName: "mantle.shipment.WarehouseTaskServices.pack#ShipmentAssembly",
        parameters: {
            operationKey: p.operationKey,
            shipmentId: p.sourceId,
            productId: p.lineKey,
            assemblyProductId: p.assemblyProductId || null,
            quantity: p.quantity,
            shipmentPackageSeqId: p.shipmentPackageSeqId || null
        },
        doneText: "Packed " + p.quantity + " of " + p.lineKey
    }
}
// MaterialIssueReceipt's sources, each its read (header, lines, movements) and its line action: the shipment assembly now;
// P16 adds the production work effort as one more entry here, with no change to the screen.
const sources = {shipmentAssembly: {read: assemblySource, action: assemblyAction}}
function sourceOf(p) {
    const type = p.sourceType || "shipmentAssembly"
    if (!sources[type]) denied("SOURCE_UNAVAILABLE", "This kind of material work is not available here")
    if (!p.sourceId) denied("RECORD_REQUIRED", "Choose the material work")
    return sources[type]
}
const materialSource = p => sourceOf(p).read(p)
const materialAction = p => {
    warehouse.required(warehouse.scope())
    return sourceOf(p).action(p)
}

// ===== Home =====
// Home's packing queue at the facility: ready (picked, not packed), waiting (scheduled, not picked), late (ready from an
// earlier day's estimated ship date).
function homeQueue(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) return {}
    const base = status =>
        find("mantle.shipment.ShipmentAndRouteSegment", {originFacilityId: facility.facilityId})
            .condition("statusId", status)
            .condition("shipmentTypeEnumId", "not-in", notPacked)
    const distinctCount = query => Array.from(query.selectField("shipmentId").distinct(true).limit(2000).list()).length
    return {
        readyCount: distinctCount(base("ShipPicked")),
        waitingCount: distinctCount(base("ShipScheduled")),
        lateCount: distinctCount(base("ShipPicked").condition("estimatedShipDate", "less", startOfToday()))
    }
}

const operations = {packContext, boxTypes, facilityBoxTypes, packingSlip, materialSource, materialAction, homeQueue}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse packing operation " + op)
        return operations[op](parameters)
    }
})
