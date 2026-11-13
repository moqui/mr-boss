// The Warehouse app's access (impl-warehouse §2, §4): the user's organizations, the facilities they may work in and their
// capabilities, the record checks every Warehouse screen and shared mount runs before a Mantle service, the facility
// preference, the palette and record links, and the Home lookup. Mantle's stock services check their own permissions
// again; nothing here grants what Mantle refuses.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Warehouse.xml"
// the user preference of the selected facility, the one Mantle's get#ScannedIdGeneral reads
const facilityPreference = "FacilityActive"
const choiceLimit = 30

// Each capability from the Moqui permission the Mantle services check (§4); financial read is Accounting's.
const capabilityPermissions = {
    receive: "STOCK_RECEIVE",
    issue: "STOCK_ISSUE",
    move: "STOCK_MOVE",
    adjust: "STOCK_ADJUST",
    count: "STOCK_COUNT",
    countReview: "STOCK_COUNT_REVIEW",
    lotExpiryExtend: "LOT_EXPIRY_EXTEND",
    pick: "SHIPMENT_PICK",
    loadEdit: "SHIPMENT_LOAD_EDIT",
    pack: "SHIPMENT_PACK",
    ship: "SHIPMENT_SHIP",
    facilityEdit: "FACILITY_EDIT",
    inspect: "QUALITY_INSPECT",
    qualityVerify: "QUALITY_VERIFY",
    qualityDispose: "QUALITY_DISPOSE",
    qualityTemplateEdit: "QUALITY_TEMPLATE_EDIT",
    policyPlan: "STOCK_POLICY_PLAN",
    policyManage: "STOCK_POLICY_MANAGE",
    // P13: carrier methods and gateway bindings (Carriers)
    carrierEdit: "SHIPPING_CARRIER_EDIT",
    financialRead: "ACCOUNTING_VIEW"
}

// The Warehouse screen of each record kind, under the app root, once its phase builds it. A kind without one opens Home's
// lookup of the record, which names it and where it is.
const destinations = {
    facility: "Locations/FacilityDetail?facilityId=",
    asset: "Inventory/AssetDetail?assetId=",
    lot: "Inventory/Lots?lotId=",
    container: "Inventory/ContainerDetail?containerId=",
    product: "Inventory/Product360?productId=",
    count: "Counts/CountDetail?physicalInventoryId=",
    // P11: a picklist (shipment load) opens PicklistDetail, for the Picking area's groups only
    load: "Picking/PicklistDetail?workEffortId=",
    // P8: an inspection opens the shared QualityInspection, open to every Warehouse user with its facility
    inspection: "QualityInspection?qualityInspectionId=",
    // P14: a return opens the shared ReturnDetail, open to every Warehouse user
    return: "Returns/ReturnDetail?returnId=",
    // P16: a production run opens the shared MaterialIssueReceipt with the run as its source
    run: "Inventory/MaterialIssueReceipt?sourceType=productionRun&sourceId="
}
const kindIcons = {
    facility: "sym_o_warehouse",
    location: "sym_o_shelves",
    asset: "sym_o_package_2",
    container: "sym_o_pallet",
    lot: "sym_o_barcode",
    shipment: "sym_o_local_shipping",
    return: "sym_o_assignment_return",
    count: "sym_o_fact_check",
    product: "sym_o_inventory_2",
    load: "sym_o_shopping_cart",
    inspection: "sym_o_verified",
    run: "sym_o_precision_manufacturing"
}
const kindNames = {
    facility: "Facility",
    location: "Location",
    asset: "Asset",
    container: "Container",
    lot: "Lot",
    shipment: "Shipment",
    return: "Return",
    count: "Count",
    product: "Product",
    load: "Picklist",
    inspection: "Inspection",
    run: "Production run"
}

// The user's authorizations on the Warehouse root, read directly so disabled or inherited artifact authorization cannot
// widen them: whether they may open Warehouse and whether they work in every facility. Only a system administrator, or
// an authorization whose filter sets name MANTLE_ACTIVE_ORG and have no Facility filter (the admin group's), reaches
// every facility; any other grant is limited to the user's organizations (MANTLE_USER_ORG's ownerPartyId in
// filterOrgIds), so a grant set up without filters fails closed.
function rootGrants() {
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return {read: false, unrestricted: false}
    if (access.systemAdmin()) return {read: true, unrestricted: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return {read: false, unrestricted: false}
    const grants = Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    ).filter(row =>
        row.nameIsPattern === "Y"
            ? new RegExp("^(?:" + row.artifactName + ")$").test(rootLocation)
            : row.artifactName === rootLocation
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    if (!allowed.length) return {read: false, unrestricted: false}
    const everyFacility = authzId => {
        const setIds = rows("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authzId}).map(row => row.entityFilterSetId)
        return (
            setIds.includes("MANTLE_ACTIVE_ORG") &&
            find("moqui.security.EntityFilter")
                .condition("entityFilterSetId", "in", setIds)
                .condition("entityName", "mantle.facility.Facility")
                .count() === 0
        )
    }
    return {read: true, unrestricted: allowed.some(row => everyFacility(row.artifactAuthzId))}
}

// The scope of the current user: their organizations, the owners of the facilities they may work in (null for every
// owner) and their capabilities. A user in no organization whose authorization has the Facility filter works in none.
// The owners are filterOrgIds kept to the organizations the user belongs to: an administrator of another app (ADMIN or
// ACCOUNTING_ADMIN) may make any internal organization active, and with the Facility filter that organization alone
// would be the scope, so an active organization the user does not belong to is set aside for their own (§4).
function scope() {
    const grants = rootGrants()
    const organization = ec.user.userId ? call("mantle.party.PartyServices.get#PartyOrganizationInfo") : {}
    const memberIds = Array.from(organization.userOrgIds || [])
    const filterIds = Array.from(organization.filterOrgIds || []).filter(partyId => memberIds.includes(partyId))
    const ownerIds = filterIds.length ? filterIds : memberIds
    const capabilities = {read: grants.read}
    for (const [name, permission] of Object.entries(capabilityPermissions))
        capabilities[name] = grants.read && access.has(permission)
    return {
        read: grants.read,
        unrestricted: grants.unrestricted,
        organizationPartyIds: memberIds,
        // the organizations a shipment or return with no facility is matched by: the active one when it is the user's
        partyOwnerIds: ownerIds,
        activeOrganizationPartyId: memberIds.includes(organization.activeOrgId) ? organization.activeOrgId : null,
        facilityOwnerIds: grants.unrestricted ? null : ownerIds,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("WAREHOUSE_UNAVAILABLE", "Warehouse is not available")
    return userScope
}

// A Facility find limited to the user's facilities.
function facilityFind(userScope) {
    const query = find("mantle.facility.Facility")
    return userScope.facilityOwnerIds ? query.condition("ownerPartyId", "in", userScope.facilityOwnerIds) : query
}
function inScope(userScope, facility) {
    return !!facility && (!userScope.facilityOwnerIds || userScope.facilityOwnerIds.includes(facility.ownerPartyId))
}
// The ids of the user's facilities, for the conditions of stock row finds; null for every facility.
function facilityIds(userScope) {
    if (!userScope.facilityOwnerIds) return null
    return Array.from(facilityFind(userScope).selectField("facilityId").list()).map(row => row.facilityId)
}
function facilityName(facility) {
    return facility ? facility.facilityName || facility.facilityId : ""
}
function statusText(statusId) {
    return statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : ""
}

// The selected facility: the user's preference when it is one of their facilities, else their only facility, else none.
// The preference never widens the scope.
function selectedFacility(userScope) {
    const preferred = ec.user.getPreference(facilityPreference)
    if (preferred) {
        const facility = one("mantle.facility.Facility", {facilityId: preferred})
        if (inScope(userScope, facility)) return facility
    }
    const firstTwo = Array.from(facilityFind(userScope).orderBy("facilityName").limit(2).list())
    return firstTwo.length === 1 ? firstTwo[0] : null
}

function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Warehouse") denied("WAREHOUSE_CONTEXT", "Warehouse context is not available")
    const userScope = required()
    let facility = selectedFacility(userScope)
    if (p.facilityId) {
        facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
        if (!inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
    }
    const linkPaths = [
        "Home",
        "Locations/Facilities",
        "Locations/FacilityDetail",
        "Locations/EquipmentDetail",
        "Transfers/Move",
        "Counts/Counts",
        "Counts/CountDetail",
        "Transfers/Repack",
        "Inventory/Adjustments",
        // P7: the receiving screens
        "Receiving/Receipts",
        "Receiving/ReceiptDetail",
        "Receiving/Receive",
        "Receiving/Supplier360",
        // P9: putaway
        "Receiving/Putaway",
        "Locations/PutawayRules",
        // P11: picking and outgoing shipments
        "Picking/Picklists",
        "Picking/PicklistDetail",
        "Picking/CreatePicklists",
        "Picking/Pick",
        "Picking/PickLocationMoves",
        "Shipping/Shipments",
        "Shipping/ShipmentDetail",
        "Orders/OrderDetail",
        // P12: packing, box types and the kit's material screen
        "Shipping/Pack",
        "Shipping/PackingSlip",
        "Locations/BoxTypes",
        "Inventory/MaterialIssueReceipt",
        "Inventory/AssetDetail",
        // P15: transfers, subcontract dispatches and stock requests
        "Transfers/Transfers",
        "Transfers/TransferShipmentDetail",
        "Transfers/SubcontractShipmentDetail",
        "Transfers/StockRequests",
        "Transfers/RequestDetail",
        // P8: the inspection screens
        "Inspection/Inspections",
        "QualityInspection",
        "Inspection/InspectionTemplates",
        // P14: the returns screens
        "Returns/Returns",
        "Returns/ReturnDetail",
        "Returns/ReturnReceipt",
        "Returns/SupplierReturnShipment",
        // P13: shipping, labels and printers
        "Shipping/Ship",
        "Shipping/PackageTracking",
        "Shipping/LabelSheet",
        "Shipping/Manifest",
        "Locations/Carriers",
        "Locations/Printers",
        "Orders/InvoiceDetail",
        // P17: the reports, and the inventory screens they link
        "Reports/ReportIndex",
        "Reports/StockAtDate",
        "Reports/OperationsHistory",
        "Reports/InventoryValuation",
        "Reports/CountVariance",
        "Inventory/Assets",
        "Inventory/Movements",
        "Inventory/Traceability",
        "Inventory/Product360"
    ]
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: userScope.organizationPartyIds,
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        // a new record's organization: the active, the only, or the user's own (impl-sales F111)
        defaultOrganizationPartyId: ec.resource
            .script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
            .defaultOrganization(userScope),
        allFacilities: !userScope.facilityOwnerIds,
        facilityCount: facilityFind(userScope).count(),
        facilityId: facility?.facilityId || null,
        facilityName: facilityName(facility),
        appRoot: "Warehouse",
        linkBase: "//Warehouse",
        webBase: "/qapps/Warehouse",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Warehouse/" + path]))
    }
}

function selectFacility(p) {
    const userScope = required()
    const facilityId = p.facilityId || null
    if (facilityId && !inScope(userScope, one("mantle.facility.Facility", {facilityId})))
        denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    ec.user.setPreference(facilityPreference, facilityId)
    return {facilityId}
}

// A record the user may work with, by kind: its facility is one of theirs (the origin or destination of a shipment's
// route, a return's facility, a lot's stock), or, for a shipment or return with no facility, one of its parties is their
// organization.
// A missing record and one outside the scope are refused alike, so a forged id learns nothing.
function recordOf(userScope, kind, recordId, p = {}) {
    const unavailable = () => denied("RECORD_UNAVAILABLE", (kindNames[kind] || "Record") + " " + recordId + " is not available")
    if (!recordId || !kindNames[kind]) unavailable()
    const facilityById = facilityId => (facilityId ? one("mantle.facility.Facility", {facilityId}) : null)
    const ownParty = partyIds => partyIds.some(partyId => partyId && userScope.partyOwnerIds.includes(partyId))
    const answer = (row, facilities, label, detail) => {
        const scoped = facilities.filter(facility => inScope(userScope, facility))
        if (!row || (!scoped.length && !(userScope.unrestricted && facilities.length === 0))) return null
        return {
            recordType: kind,
            recordId,
            facilityId: scoped[0]?.facilityId || null,
            facilityIds: scoped.map(facility => facility.facilityId),
            facilityName: facilityName(scoped[0]),
            label,
            detail
        }
    }
    let found = null
    if (kind === "facility") {
        const facility = facilityById(recordId)
        found = answer(facility, facility ? [facility] : [], facilityName(facility), facility?.ownerPartyId || "")
    } else if (kind === "location") {
        const facilityId = p.facilityId
        const location = facilityId ? one("mantle.facility.FacilityLocation", {facilityId, locationSeqId: recordId}) : null
        const facility = location ? facilityById(facilityId) : null
        const type = location?.locationTypeEnumId ? one("moqui.basic.Enumeration", {enumId: location.locationTypeEnumId}) : null
        found = answer(location, facility ? [facility] : [], recordId, type?.description || "")
    } else if (kind === "asset") {
        const asset = one("mantle.product.asset.Asset", {assetId: recordId})
        const facility = facilityById(asset?.facilityId)
        const product = asset?.productId ? one("mantle.product.Product", {productId: asset.productId}) : null
        const quantity = asset?.quantityOnHandTotal == null ? "" : String(asset.quantityOnHandTotal)
        found = answer(
            asset,
            facility ? [facility] : [],
            product?.productName || asset?.assetName || recordId,
            [
                asset?.serialNumber ? "Serial " + asset.serialNumber : quantity ? "On hand " + quantity : "",
                asset?.locationSeqId ? "at " + asset.locationSeqId : "",
                statusText(asset?.statusId)
            ]
                .filter(Boolean)
                .join(" · ")
        )
    } else if (kind === "container") {
        const container = one("mantle.product.asset.Container", {containerId: recordId})
        const facility = facilityById(container?.facilityId)
        found = answer(
            container,
            facility ? [facility] : [],
            container?.description || recordId,
            container?.locationSeqId ? "at " + container.locationSeqId : ""
        )
    } else if (kind === "lot") {
        const lot = one("mantle.product.asset.Lot", {lotId: recordId})
        const stockFacilityIds = lot
            ? Array.from(
                  find("mantle.product.asset.Asset")
                      .condition("lotId", recordId)
                      .condition("facilityId", "is-not-null", null)
                      .selectField("facilityId")
                      .distinct(true)
                      .list()
              ).map(row => row.facilityId)
            : []
        const facilities = stockFacilityIds.map(facilityById).filter(Boolean)
        const lotDetail = lot?.expirationDate ? "Expires " + lib.calendarDateText(lot.expirationDate) : ""
        found = answer(lot, facilities, lot?.lotNumber || recordId, lotDetail)
        // a lot with no stock anywhere (a new lot) names no organization's stock: every Warehouse user may open it (P4)
        if (!found && lot && !stockFacilityIds.length && !find("mantle.product.asset.Asset").condition("lotId", recordId).count())
            found = {
                recordType: kind,
                recordId,
                facilityId: null,
                facilityIds: [],
                facilityName: "",
                label: lot.lotNumber || recordId,
                detail: lotDetail
            }
    } else if (kind === "shipment") {
        const shipment = one("mantle.shipment.Shipment", {shipmentId: recordId})
        // a shipment's facilities are on its route segments (impl-warehouse F55)
        const segments = shipment ? rows("mantle.shipment.ShipmentRouteSegment", {shipmentId: recordId}) : []
        const facilityIdSet = new Set(segments.flatMap(segment => [segment.originFacilityId, segment.destinationFacilityId]))
        const facilities = Array.from(facilityIdSet).map(facilityById).filter(Boolean)
        const type = shipment?.shipmentTypeEnumId ? one("moqui.basic.Enumeration", {enumId: shipment.shipmentTypeEnumId}) : null
        const label = [type?.description, statusText(shipment?.statusId)].filter(Boolean).join(" · ")
        found = answer(shipment, facilities, recordId, label)
        if (!found && shipment && !facilities.length && ownParty([shipment.fromPartyId, shipment.toPartyId]))
            found = {
                recordType: kind,
                recordId,
                facilityId: null,
                facilityIds: [],
                facilityName: "",
                label: recordId,
                detail: label
            }
    } else if (kind === "return") {
        const header = one("mantle.order.return.ReturnHeader", {returnId: recordId})
        const facility = facilityById(header?.facilityId)
        found = answer(header, facility ? [facility] : [], recordId, statusText(header?.statusId))
        if (!found && header && !facility && ownParty([header.vendorPartyId, header.customerPartyId]))
            found = {
                recordType: kind,
                recordId,
                facilityId: null,
                facilityIds: [],
                facilityName: "",
                label: recordId,
                detail: statusText(header.statusId)
            }
    } else if (kind === "product") {
        // a product of the user's organizations or the shared catalog, for a catalog reader (Warehouse's Product360, P4)
        const product = one("mantle.product.Product", {productId: recordId})
        const owner = product?.ownerPartyId
        const ownProduct =
            !!product && (userScope.unrestricted || !owner || owner === "_NA_" || userScope.organizationPartyIds.includes(owner))
        if (ownProduct && ["PRODUCT_CATALOG_VIEW", "PRODUCT_CATALOG_EDIT", "PRODUCT_CATALOG_ADMIN"].some(access.has))
            found = {
                recordType: kind,
                recordId,
                facilityId: null,
                facilityIds: [],
                facilityName: "",
                label: product.productName || recordId,
                detail: product.pseudoId || ""
            }
    } else if (kind === "count") {
        const inventory = one("mantle.product.asset.PhysicalInventory", {physicalInventoryId: recordId})
        // a count has a count mode (P10): a scrap's PhysicalInventory (P6, WH-SCRAP), an adjustment's and Mantle's immediate
        // postings are not counts
        const count = inventory?.scrapIndicator === "Y" || !inventory?.countModeEnumId ? null : inventory
        const facility = facilityById(count?.facilityId)
        found = answer(count, facility ? [facility] : [], recordId, statusText(count?.statusId))
    } else if (kind === "load") {
        // a picklist is a shipment load (WetEvent of purpose WepShipmentShip) of a facility (P11)
        const effort = one("mantle.work.effort.WorkEffort", {workEffortId: recordId})
        const load = effort?.purposeEnumId === "WepShipmentShip" ? effort : null
        const facility = facilityById(load?.facilityId)
        found = answer(load, facility ? [facility] : [], load?.workEffortName || recordId, statusText(load?.statusId))
    } else if (kind === "run") {
        // a production run (P16) by its facility
        const effort = one("mantle.work.effort.WorkEffort", {workEffortId: recordId})
        const production = effort?.purposeEnumId === "WepProductionRun" ? effort : null
        const facility = facilityById(production?.facilityId)
        const label = production?.workEffortName || recordId
        found = answer(production, facility ? [facility] : [], label, statusText(production?.statusId))
    } else if (kind === "inspection") {
        // a quality inspection (P8) by its facility
        const inspection = one("mantle.product.quality.QualityInspection", {qualityInspectionId: recordId})
        const facility = facilityById(inspection?.facilityId)
        const product = inspection?.productId ? one("mantle.product.Product", {productId: inspection.productId}) : null
        found = answer(inspection, facility ? [facility] : [], product?.productName || recordId, statusText(inspection?.statusId))
    }
    return found || unavailable()
}

// check#Record: a record a Warehouse screen or mount was given, refused unless the user may work with it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability)) throw new Error("Unknown Warehouse capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId, p)
}

// equipment (an asset that is not inventory or supplies) opens EquipmentDetail; stock opens AssetDetail (P4, §4)
const stockAssetTypes = ["AstTpInventory", "AstTpSupplies"]
// the Counts area opens for the count, count review and adjust groups only (P1): anyone else gets the lookup of a count
const countAreaOpen = userScope => !!userScope && ["count", "countReview", "adjust"].some(name => userScope.capabilities[name])
// the Picking area opens for the pick, pick supervisor and move groups only (P1, F60): anyone else gets no picklist link
const pickingAreaOpen = userScope => !!userScope && ["pick", "loadEdit", "move"].some(name => userScope.capabilities[name])
function recordUrl(kind, recordId, facilityId, userScope = null) {
    if (kind === "asset") {
        const asset = one("mantle.product.asset.Asset", {assetId: recordId})
        if (asset && asset.assetTypeEnumId && !stockAssetTypes.includes(asset.assetTypeEnumId))
            return "/qapps/Warehouse/Locations/EquipmentDetail?assetId=" + encodeURIComponent(recordId)
    }
    // a purchase or customer return receipt opens ReceiptDetail (P7)
    if (kind === "shipment") {
        const shipment = one("mantle.shipment.Shipment", {shipmentId: recordId})
        // a customer return's shipment opens ReturnReceipt and a supplier return's SupplierReturnShipment (P14)
        if (shipment?.shipmentTypeEnumId === "ShpTpSalesReturn")
            return "/qapps/Warehouse/Returns/ReturnReceipt?shipmentId=" + encodeURIComponent(recordId)
        if (shipment?.shipmentTypeEnumId === "ShpTpPurchaseReturn")
            return "/qapps/Warehouse/Returns/SupplierReturnShipment?shipmentId=" + encodeURIComponent(recordId)
        if (shipment?.shipmentTypeEnumId === "ShpTpPurchase")
            return "/qapps/Warehouse/Receiving/ReceiptDetail?shipmentId=" + encodeURIComponent(recordId)
        // an outgoing shipment opens ShipmentDetail (P11)
        if (shipment && shipment.shipmentTypeEnumId !== "ShpTpTransfer")
            return "/qapps/Warehouse/Shipping/ShipmentDetail?shipmentId=" + encodeURIComponent(recordId)
        // a transfer opens TransferShipmentDetail, a subcontract dispatch or return SubcontractShipmentDetail (P15)
        if (shipment)
            return "/qapps/Warehouse/Transfers/" + (shipment.subcontractWorkEffortId ? "Subcontract" : "Transfer") +
                "ShipmentDetail?shipmentId=" + encodeURIComponent(recordId)
    }
    if (kind === "load")
        return pickingAreaOpen(userScope) ? "/qapps/Warehouse/" + destinations.load + encodeURIComponent(recordId) : null
    if (destinations[kind] && (kind !== "count" || countAreaOpen(userScope)))
        return "/qapps/Warehouse/" + destinations[kind] + encodeURIComponent(recordId)
    const facility = facilityId && kind === "location" ? "&lookupFacilityId=" + encodeURIComponent(facilityId) : ""
    return "/qapps/Warehouse/Home?lookupType=" + kind + "&lookupId=" + encodeURIComponent(recordId) + facility
}
// The Warehouse link of a record the user may work with, else null (get#RecordLink).
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read) return null
        const record = recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId, record.facilityId, userScope)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Warehouse link of " + kind + " " + recordId + ": " + error.message)
        return null
    }
}

// The finds of the palette: each record kind by its id, ignoring case, limited in the query to the user's facilities (or,
// for a shipment with no route segment, to their organizations' parties). Each entry: the kind, its entity, id field,
// scope fields and text fields; a scope of "party" uses the organizations instead of the facilities.
const searchFinds = {
    facility: ["mantle.facility.Facility", "facilityId", ["facilityId"], ["facilityId", "facilityName"]],
    shipment: [
        "mantle.shipment.ShipmentRouteSegment",
        "shipmentId",
        ["originFacilityId", "destinationFacilityId"],
        ["shipmentId"]
    ],
    shipmentParty: ["mantle.shipment.Shipment", "shipmentId", ["fromPartyId", "toPartyId"], ["shipmentId"], "party"],
    asset: ["mantle.product.asset.Asset", "assetId", ["facilityId"], ["assetId", "serialNumber"]],
    lot: ["mantle.product.asset.Asset", "lotId", ["facilityId"], ["lotId"]],
    // a lot by its printed number, or one with no stock: each row checked by recordOf (P4)
    lotNumber: ["mantle.product.asset.Lot", "lotId", [], ["lotId", "lotNumber"], "record"],
    container: ["mantle.product.asset.Container", "containerId", ["facilityId"], ["containerId", "serialNumber"]],
    return: ["mantle.order.return.ReturnHeader", "returnId", ["facilityId"], ["returnId"]],
    count: ["mantle.product.asset.PhysicalInventory", "physicalInventoryId", ["facilityId"], ["physicalInventoryId"]],
    // P11: picklists by id or name; each row checked by recordOf (a load, a facility of the user's)
    load: ["mantle.work.effort.WorkEffort", "workEffortId", ["facilityId"], ["workEffortId", "workEffortName"]],
    inspection: ["mantle.product.quality.QualityInspection", "qualityInspectionId", ["facilityId"], ["qualityInspectionId"]]
}
const searchKinds = {shipmentParty: "shipment", lotNumber: "lot"}
function searchFind(kind, text, ids) {
    const [entity, idField, facilityFields, textFields] = searchFinds[kind]
    const factory = ec.entity.conditionFactory
    const anyOf = conditions => (conditions.length === 1 ? conditions[0] : factory.makeCondition(conditions, "or"))
    // the text matched literally: % and _ in it are escaped for LIKE
    const pattern = "%" + text.replace(/[\\%_]/g, character => "\\" + character) + "%"
    let query = find(entity)
        .condition(anyOf(textFields.map(field => factory.makeCondition(field, "like", pattern).ignoreCase())))
        .selectField(idField)
        .distinct(true)
        .orderBy(idField)
    if (ids) query = query.condition(anyOf(facilityFields.map(field => factory.makeCondition(field, "in", ids))))
    return query
}

function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const ids = facilityIds(userScope)
    const found = new Map()
    for (const [searchKind, definition] of Object.entries(searchFinds)) {
        const kind = searchKinds[searchKind] || searchKind
        const scopeIds =
            definition[4] === "party"
                ? userScope.facilityOwnerIds
                    ? userScope.partyOwnerIds
                    : null
                : definition[4] === "record"
                  ? null
                  : ids
        let rowsFound = []
        try {
            rowsFound = Array.from(searchFind(searchKind, text, scopeIds).limit(limit).list())
        } catch (error) {
            ec.logger.error("Warehouse palette " + searchKind + " search failed: " + error.message)
        }
        // each row on its own: one that fails or is out of scope is left out and the others still show
        for (const row of rowsFound) {
            const recordId = row[definition[1]]
            try {
                const record = recordOf(userScope, kind, recordId)
                const url = recordUrl(kind, recordId, record.facilityId, userScope)
                if (url && !found.has(url))
                    found.set(url, {
                        title: (record.label && record.label !== recordId ? record.label + " · " : "") + recordId,
                        subtitle: [kindNames[kind], record.detail, record.facilityName].filter(Boolean).join(" · "),
                        icon: kindIcons[kind],
                        url
                    })
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.error("Warehouse palette " + kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// The options of a Warehouse drop-down, searched by term, with the selected value's label. Refuses an unknown choice.
function choices(p) {
    const userScope = required()
    const term = String(p.term || "").trim()
    const sources = {
        facilities: () => {
            const factory = ec.entity.conditionFactory
            let query = facilityFind(userScope).orderBy("facilityName").limit(choiceLimit)
            if (term)
                query = query.condition(
                    factory.makeCondition(
                        [
                            factory.makeCondition("facilityId", "like", "%" + term + "%").ignoreCase(),
                            factory.makeCondition("facilityName", "like", "%" + term + "%").ignoreCase()
                        ],
                        "or"
                    )
                )
            const options = Array.from(query.list()).map(row => ({value: row.facilityId, label: facilityName(row)}))
            if (p.selected && !options.some(option => option.value === p.selected)) {
                const selected = one("mantle.facility.Facility", {facilityId: p.selected})
                if (inScope(userScope, selected)) options.push({value: selected.facilityId, label: facilityName(selected)})
            }
            return options
        }
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Warehouse choice " + p.choice)
    return {options: sources[p.choice]()}
}

// get#ScannedRecord: what a scanned or typed code is among the user's records, as Home's lookup shows it. Mantle's
// get#ScannedIdGeneral resolves an asset, container, location or product in the facility; a serial number matches its
// unit, and shipments, returns, lots, counts and facilities match by id. Records outside the scope are left out. Reads only.
function scannedRecord(p) {
    const userScope = required()
    const text = String(p.scanText || "").trim()
    if (!text) return {matches: [], facilityId: null}
    let facility = null
    if (p.facilityId) {
        facility = one("mantle.facility.Facility", {facilityId: p.facilityId})
        if (!inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + p.facilityId + " is not available")
    } else facility = selectedFacility(userScope)
    const matches = []
    const add = (kind, recordId, extra = {}) => {
        try {
            const record = recordOf(userScope, kind, recordId, extra)
            matches.push(Object.assign(record, {icon: kindIcons[kind], kindName: kindNames[kind]}))
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        }
    }
    if (p.recordType) {
        add(p.recordType, text, {facilityId: facility?.facilityId})
        return {matches, facilityId: facility?.facilityId || null}
    }
    // in its own transaction and error frame: when Mantle's lookup fails, the matches by id still show
    let scanned = {}
    try {
        scanned = lib.probe("mantle.facility.FacilityServices.get#ScannedIdGeneral", {
            facilityId: facility?.facilityId || "_NA_",
            scanId: text
        })
    } catch (error) {
        ec.logger.warn("Warehouse lookup of " + text + ": " + error.message)
    }
    if (scanned.assetId) add("asset", scanned.assetId)
    if (scanned.containerId) add("container", scanned.containerId)
    if (scanned.locationSeqId && facility) add("location", scanned.locationSeqId, {facilityId: facility.facilityId})
    if (scanned.productId) {
        const product = one("mantle.product.Product", {productId: scanned.productId})
        const owner = product?.ownerPartyId
        if (product && (userScope.unrestricted || !owner || owner === "_NA_" || userScope.organizationPartyIds.includes(owner)))
            matches.push({
                recordType: "product",
                recordId: product.productId,
                label: product.productName || product.productId,
                detail: product.pseudoId || "",
                facilityId: null,
                facilityName: "",
                icon: kindIcons.product,
                kindName: kindNames.product
            })
    }
    // a serialized unit by its serial number, in the user's facilities
    const ids = facilityIds(userScope)
    let serialFind = find("mantle.product.asset.Asset").condition("serialNumber", text).selectField("assetId").limit(5)
    if (ids) serialFind = serialFind.condition("facilityId", "in", ids)
    for (const row of Array.from(serialFind.list())) if (row.assetId !== scanned.assetId) add("asset", row.assetId)
    for (const kind of ["shipment", "return", "count", "inspection", "lot", "facility"]) add(kind, text)
    return {matches, facilityId: facility?.facilityId || null}
}

const operations = {sharedContext, selectFacility, checkRecord, search, choices, scannedRecord}
;({
    recordLink,
    // the scope for a phase's own module and the shared mounts' Warehouse branch (SharedContext.js): the user's scope,
    // the same refusing a user without Warehouse, a facility's check, the ids of their facilities for a stock row find (null
    // for every facility), a record's check and its Warehouse link
    scope,
    required,
    inScope,
    facilityIds,
    recordOf,
    recordUrl,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse operation " + op)
        return operations[op](parameters)
    }
})
