// The Warehouse access walk's organization and flow (impl-warehouse P18; design-warehouse §19, crosscut §6), for the
// acceptance spec test/acceptance/Warehouse/WarehouseAccessWalk: BOSS_P18_ORG, an organization with no ProductStore, its facility, product,
// supplier and customer, and its Warehouse users of one capability each (spec users in the root group and one capability
// group, agents of the organization); receive to ship by those users; and the routes that show its records. Its records carry
// "P18 secret" in a text the screens show.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {asUser, page} = lib
const T = "mantle.shipment.WarehouseTaskServices.",
    Q = "mantle.product.QualityServices."
const ORG = "BOSS_P18_ORG",
    FACILITY = "BOSS_P18_WH",
    SUPPLIER = "BOSS_P18_SUPPLIER",
    CUSTOMER = "BOSS_P18_CUSTOMER",
    PRODUCT = "BOSS_P18_GASKET"
const SECRET = /P18 secret/
// Retail's demo records (data/BossWarehouseDemoData.xml) by the names its screens show; box types are shared by every
// organization (impl-warehouse §5), and a supplier is a party that organizations share, so Supplier360 of Retail's
// supplier may name it but none of Retail's records
const RETAIL = /Ziziwork Retail|Ziddleman|SEAL-2026|Lot-tracked sealant|demo bracket|demo hinge|East tote/
const RETAIL_RECORDS = /Ziziwork Retail|SEAL-2026|Lot-tracked sealant|demo bracket|demo hinge|East tote/
// an odd purchase and sales price that no screen may show without financial read
const COST = "7.31",
    PRICE = "19.47"
const since = "2000-01-01T00:00:00Z"
// the P18 organization's users: one capability group each, beside the Warehouse root group
const p18Users = {
    "p18.read": [],
    "p18.receive": ["BOSS_WAREHOUSE_RECEIVE"],
    "p18.inspect": ["BOSS_WAREHOUSE_INSPECT"],
    "p18.quality": ["BOSS_WAREHOUSE_QUALITY_MANAGER"],
    "p18.move": ["BOSS_WAREHOUSE_MOVE"],
    "p18.supervisor": ["BOSS_WAREHOUSE_PICK_SUPERVISOR"],
    "p18.pick": ["BOSS_WAREHOUSE_PICK"],
    "p18.pack": ["BOSS_WAREHOUSE_PACK"],
    "p18.ship": ["BOSS_WAREHOUSE_SHIP"],
    "p18.adjust": ["BOSS_WAREHOUSE_ADJUST"],
    "p18.count": ["BOSS_WAREHOUSE_COUNT"],
    "p18.manager": ["BOSS_WAREHOUSE_MANAGER"]
}
// Retail's demo Warehouse users of each capability (not the administrator, who works in every organization's facilities)
const retailUsers = ["warehouse.read", "warehouse.receive", "warehouse.inspect", "warehouse.quality", "warehouse.move",
    "warehouse.picksupervisor", "warehouse.pick", "warehouse.pack", "warehouse.ship", "warehouse.count", "warehouse.adjust"]
// the Retail users of the route sweeps: the reader and three task capabilities
const sweepUsers = ["warehouse.read", "warehouse.receive", "warehouse.pick", "warehouse.ship"]
const otherRoots = ["Products", "Accounting", "Sales", "Purchasing", "Manufacturing", "CustomerService", "Projects", "Admin"]
// operation keys of this evaluation of the library: each spec that runs the flow posts its own operations
const keyPrefix = "p18-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
let keySeq = 0
const key = () => keyPrefix + "-" + ++keySeq

const find = (entity, conditions = {}) => ec.entity.find(entity).condition(conditions).disableAuthz()
const one = (entity, conditions) => find(entity, conditions).one()
const rows = (entity, conditions) => Array.from(find(entity, conditions).list())
function store(entity, fields) {
    ec.service.sync().name("store#" + entity).parameters(fields).disableAuthz().call()
}
function call(service, parameters) {
    return ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}
}
// an entry point as the user calls it from a screen (authorization off, the Mantle service checks the permission), in its
// own transaction: its result with the error text, "" when it succeeds
function run(username, service, parameters) {
    return asUser(
        username,
        () => {
            ec.message.pushErrors()
            try {
                const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
                return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
            } catch (error) {
                return {error: String(error.message || error)}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        },
        false
    )
}
// a screen of another root as the user's shell requests it
function render(root, path, parameters = {}, mode = "html") {
    let result
    try {
        result = ec.screen
            .makeTest()
            .rootScreen(`component://mr-boss/screen/${root}.xml`)
            .renderMode(mode)
            .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    } catch (error) {
        result = {status: 0, output: "", errorMessages: [String(error.message)]}
    }
    ec.message.clearErrors()
    return {status: result.status, output: String(result.output || ""), errors: Array.from(result.errorMessages || []).join(" | ")}
}
// a read the screens and the palette make with authorization off
function read(service, parameters) {
    try {
        return ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}
    } catch (error) {
        return {}
    } finally {
        ec.message.clearErrors()
    }
}
// refused for want of the permission, or for the organization (before the permission is asked)
const refusedFor = message =>
    /PERMISSION_DENIED|ACCESS_DENIED|authority is required|is not authorized|FORBIDDEN|ORGANIZATION_DENIED/.test(message)
function user(username, groups) {
    const partyId = "BOSS_" + username.replace(".", "_").toUpperCase()
    store("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    store("mantle.party.Person", {partyId, firstName: "P18", lastName: username})
    store("moqui.security.UserAccount", {userId: partyId, username, partyId, userFullName: username,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394", passwordHashType: "SHA"})
    // every internal user is in BOSS_USERS (Commons and Comms)
    for (const userGroupId of ["BOSS_USERS", "BOSS_WAREHOUSE"].concat(groups))
        store("moqui.security.UserGroupMember", {userId: partyId, userGroupId, fromDate: since})
    store("mantle.party.PartyRelationship", {partyRelationshipId: partyId + "_ORG", fromPartyId: partyId, toPartyId: ORG,
        relationshipTypeEnumId: "PrtAgent", toRoleTypeId: "OrgInternal", fromDate: since})
}
function address(contactMechId, postalCode, owner) {
    store("mantle.party.contact.ContactMech", {contactMechId, contactMechTypeEnumId: "CmtPostalAddress"})
    store("mantle.party.contact.PostalAddress", {contactMechId, toName: "P18 " + postalCode, address1: "18 Test Way",
        city: "Testville", postalCode, countryGeoId: "USA", stateProvinceGeoId: "USA_UT"})
    if (owner.facilityId)
        store("mantle.facility.FacilityContactMech", {facilityId: owner.facilityId, contactMechId,
            contactMechPurposeId: "PostalShippingOrigin", fromDate: since})
    else
        store("mantle.party.contact.PartyContactMech", {partyId: owner.partyId, contactMechId,
            contactMechPurposeId: "PostalShippingDest", fromDate: since})
}
function order(vendorPartyId, customerPartyId, unitAmount, quantity, shipping) {
    const created = call("mantle.order.OrderServices.create#Order", {vendorPartyId, customerPartyId, currencyUomId: "USD",
        facilityId: FACILITY})
    call("mantle.order.OrderServices.add#OrderProductQuantity", {orderId: created.orderId,
        orderPartSeqId: created.orderPartSeqId, productId: PRODUCT, quantity, unitAmount, itemTypeEnumId: "ItemInventory"})
    if (shipping)
        call("mantle.order.OrderServices.set#OrderBillingShippingInfo", {orderId: created.orderId,
            orderPartSeqId: created.orderPartSeqId, shippingPostalContactMechId: "BOSS_P18_DEST", carrierPartyId: "_NA_",
            shipmentMethodEnumId: "ShMthGround"})
    call("mantle.order.OrderServices.place#Order", {orderId: created.orderId})
    call("mantle.order.OrderServices.approve#Order", {orderId: created.orderId})
    return created.orderId
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}
// what a list of renders shows that it may not, as problem lines; a pattern may be a function of the render's name
function leaks(username, renders, pattern) {
    const of = name => (typeof pattern === "function" ? pattern(name) : pattern)
    return renders.filter(([name, got]) => of(name).test(got.output)).map(([name]) => `${username} sees ${name}`)
}
const retailPattern = name => (name.startsWith("Receiving/Supplier360") ? RETAIL_RECORDS : RETAIL)
function onHandOf() {
    return rows("mantle.product.asset.Asset", {productId: PRODUCT, facilityId: FACILITY})
        .reduce((sum, row) => sum + Number(String(row.quantityOnHandTotal)), 0)
}
function setup() {
    ec.artifactExecution.disableAuthz()
    for (const [partyId, name, role] of [
        [ORG, "P18 secret Standalone Works", "OrgInternal"],
        [SUPPLIER, "P18 Supplier", "Supplier"],
        [CUSTOMER, "P18 Customer", "Customer"]
    ]) {
        store("mantle.party.Party", {partyId, partyTypeEnumId: "PtyOrganization"})
        store("mantle.party.Organization", {partyId, organizationName: name})
        store("mantle.party.PartyRole", {partyId, roleTypeId: role})
    }
    if (!one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId: ORG})) {
        call("mantle.ledger.LedgerServices.init#PartyAccountingConfiguration", {organizationPartyId: ORG,
            sourcePartyId: "DefaultSettings", baseCurrencyUomId: "USD"})
    }
    call("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {organizationPartyId: ORG,
        filterDate: ec.user.nowTimestamp})
    for (const [username, groups] of Object.entries(p18Users)) user(username, groups)
    store("mantle.facility.Facility", {facilityId: FACILITY, facilityTypeEnumId: "FcTpWarehouse", ownerPartyId: ORG,
        facilityName: "P18 secret warehouse"})
    for (const [locationSeqId, locationTypeEnumId] of [["RECV", "FltReceiving"], ["QUAR", "FltQuarantine"],
        ["PICK1", "FltPick"], ["BULK1", "FltBulk"]])
        store("mantle.facility.FacilityLocation", {facilityId: FACILITY, locationSeqId, locationTypeEnumId,
            description: "P18 secret " + locationSeqId})
    store("mantle.facility.FacilityLocationType", {facilityId: FACILITY, locationTypeEnumId: "FltQuarantine",
        autoStatusId: "AstQuarantine"})
    address("BOSS_P18_ORIGIN", "84101", {facilityId: FACILITY})
    address("BOSS_P18_DEST", "89119", {partyId: CUSTOMER})
    store("mantle.product.Product", {productId: PRODUCT, productName: "P18 secret gasket", productTypeEnumId: "PtAsset",
        assetTypeEnumId: "AstTpInventory", amountUomId: "OTH_ea", ownerPartyId: ORG})
    store("mantle.product.ProductDimension", {productId: PRODUCT, dimensionTypeId: "ShippingWeight", value: 2,
        valueUomId: "WT_lb"})
    // the pick face, below its minimum once the order ships, and a putaway rule to it
    store("mantle.facility.ProductFacilityLocation", {productId: PRODUCT, facilityId: FACILITY, locationSeqId: "PICK1",
        minimumStock: 5})
    store("mantle.facility.PutawayRule", {putawayRuleId: "BOSS_P18_RULE", organizationPartyId: ORG, facilityId: FACILITY,
        description: "P18 secret rule", productId: PRODUCT, toLocationSeqId: "PICK1", priority: 1, fromDate: since})
    // receipts go to quarantine for inspection (receipt step 3), and the gasket needs one
    store("mantle.facility.WarehousePolicy", {warehousePolicyId: "BOSS_P18_OPERATION", organizationPartyId: ORG,
        policyType: "operation", facilityId: FACILITY, productId: "_NA_", fromDate: since, receiptSteps: 3,
        receivingLocationSeqId: "RECV", quarantineLocationSeqId: "QUAR"})
    store("mantle.facility.WarehousePolicy", {warehousePolicyId: "BOSS_P18_TRACKING", organizationPartyId: ORG,
        policyType: "tracking", facilityId: "_NA_", productId: PRODUCT, fromDate: since, inspectionRequired: "Y"})
    ec.artifactExecution.enableAuthz()
}
// Receive to ship by the organization's users, each step by the user of its capability: the receipt through Receive's
// transition into quarantine with one unit rejected (the exception goes to the stock policy manager), the inspection
// submitted, verified and released to receiving, putaway (the suggestion), a sales order with no store, its shipment by the
// pick supervisor, picked, packed and shipped through Pack's and Ship's transitions (the weight entered: no box type), then
// a count of the pick face through the count quick create, started, and bulk stock to refill the face from. Answers the
// records (p18), each step's error text or render, and the on-hand change.
function receiveToShip() {
    const steps = {}
    const p18 = {}
    const onHandBefore = onHandOf()
    // the receipt: a purchase order of the supplier's, its open receipt, received through Receive's transition into
    // quarantine with one unit rejected (the receipt exception goes to the organization's stock policy manager)
    p18.purchaseOrderId = asUser("john.doe", () => order(SUPPLIER, ORG, COST, 6, false), false)
    const ensured = run("p18.receive", T + "ensure#PurchaseReceipt", {operationKey: key(), orderId: p18.purchaseOrderId,
        orderPartSeqId: "01", facilityId: FACILITY})
    steps.ensure = ensured.error
    p18.receiptId = ensured.result?.shipmentId
    steps.receivePage = asUser("p18.receive", () => page("Receiving/Receive", {shipmentId: p18.receiptId}, "html"))
    steps.receive = asUser("p18.receive", () => post("Receiving/Receive/receiveLine", {shipmentId: p18.receiptId,
        productId: PRODUCT, operationKey: key(), quantityAccepted: 5, quantityRejected: 1,
        rejectionReasonEnumId: "ArjDamaged"}))
    // the assets this receipt received (a second run of the flow in one database receives its own)
    const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId: p18.receiptId})
    const held = receipts.map(receipt => one("mantle.product.asset.Asset", {assetId: receipt.assetId})).filter(Boolean)
    p18.assetId = held[0]?.assetId
    steps.quarantined = held.map(asset => asset.statusId).join(",")
    steps.receiptPage = asUser("p18.receive", () => page("Receiving/ReceiptDetail", {shipmentId: p18.receiptId}, "html"))
    // the inspection: submitted by the inspector, verified and released to receiving by the quality manager
    p18.inspectionId = rows("mantle.product.quality.QualityInspection", {assetId: p18.assetId})[0]?.qualityInspectionId
    steps.queue = asUser("p18.inspect", () => page("Inspection/Inspections", {}, "html"))
    steps.submit = run("p18.inspect", Q + "submit#Inspection", {qualityInspectionId: p18.inspectionId,
        quantityAccepted: 5}).error
    steps.verify = run("p18.quality", Q + "verify#Inspection", {qualityInspectionId: p18.inspectionId}).error
    steps.release = run("p18.quality", Q + "dispose#Inspection", {operationKey: key(),
        qualityInspectionId: p18.inspectionId, dispositionEnumId: "QdRelease", quantity: 5, toLocationSeqId: "RECV"}).error
    // putaway to the product's pick face, the suggestion
    const released = rows("mantle.product.asset.Asset", {productId: PRODUCT, facilityId: FACILITY})
        .find(asset => asset.statusId === "AstAvailable" && Number(String(asset.quantityOnHandTotal)) > 0)
    steps.putawayPage = asUser("p18.move", () => page("Receiving/Putaway", {facilityId: FACILITY}, "html"))
    const putaway = run("p18.move", T + "putaway#Stock", {operationKey: key(), assetId: released?.assetId})
    steps.putaway = putaway.error
    steps.putawayTo = putaway.result?.toLocationSeqId
    // the sales order (no store), its shipment by the pick supervisor, picked, then packed and shipped through the
    // Pack and Ship transitions
    p18.salesOrderId = asUser("john.doe", () => order(ORG, CUSTOMER, PRICE, 4, true), false)
    steps.reserved = rows("mantle.product.issuance.AssetReservation", {orderId: p18.salesOrderId})
        .reduce((sum, row) => sum + Number(String(row.quantity)), 0)
    const created = run("p18.supervisor", T + "create#OutgoingShipment", {operationKey: key(), orderId: p18.salesOrderId})
    steps.shipment = created.error
    p18.shipmentId = created.result?.shipmentId
    const line = rows("mantle.shipment.ShipmentItemSource", {shipmentId: p18.shipmentId})[0]
    steps.pick = run("p18.pick", T + "pick#ShipmentStock", {operationKey: key(), shipmentId: p18.shipmentId,
        shipmentItemSourceId: line?.shipmentItemSourceId, quantity: 4, locationSeqId: "PICK1"}).error
    steps.finishPick = run("p18.pick", T + "finish#Pick", {operationKey: key(), shipmentId: p18.shipmentId}).error
    steps.packPage = asUser("p18.pack", () => page("Shipping/Pack", {shipmentId: p18.shipmentId}, "html"))
    steps.pack = asUser("p18.pack", () => post("Shipping/Pack/packStock", {shipmentId: p18.shipmentId,
        shipmentItemSourceId: line?.shipmentItemSourceId, quantity: 4, operationKey: key()}))
    const packageSeqId = rows("mantle.shipment.ShipmentPackage", {shipmentId: p18.shipmentId})[0]?.shipmentPackageSeqId
    // no box type to weigh it by: the packer enters the weight
    steps.weigh = asUser("p18.pack", () => post("Shipping/Pack/editPackage", {shipmentId: p18.shipmentId,
        packageAction: "update", shipmentPackageSeqId: packageSeqId, weight: 8, weightUomId: "WT_lb", operationKey: key()}))
    steps.complete = asUser("p18.pack", () => post("Shipping/Pack/completePack", {shipmentId: p18.shipmentId,
        operationKey: key()}))
    steps.shipPage = asUser("p18.ship", () => page("Shipping/Ship", {shipmentId: p18.shipmentId}, "html"))
    steps.tracking = asUser("p18.ship", () => post("Shipping/Ship/recordManualTracking", {shipmentId: p18.shipmentId,
        trackingCode: "P18-COURIER-1", operationKey: key()}))
    steps.ship = asUser("p18.ship", () => post("Shipping/Ship/shipShipment", {shipmentId: p18.shipmentId,
        operationKey: key()}))
    // the sales invoice Complete pack made
    p18.invoiceId = rows("mantle.order.OrderItemBilling", {orderId: p18.salesOrderId})[0]?.invoiceId
    const onHand = onHandOf() - onHandBefore
    // a count of the pick face, through the count quick create, started
    steps.count = asUser("p18.count", () => post("NewCount/createCount", {facilityId: FACILITY,
        countModeEnumId: "CntModeSpot", scopeLocationSeqId: "PICK1"}))
    p18.countId = Array.from(find("mantle.product.asset.PhysicalInventory", {facilityId: FACILITY})
        .orderBy("-physicalInventoryId").limit(1).list())[0]?.physicalInventoryId
    steps.startCount = asUser("p18.count", () => post("Counts/CountDetail/startCount", {physicalInventoryId: p18.countId}))
    // bulk stock to refill the pick face from (a fixture receipt), so the pick face shows below its minimum
    asUser("john.doe", () => call("mantle.product.AssetServices.receive#Asset", {productId: PRODUCT, quantity: 3,
        facilityId: FACILITY, locationSeqId: "BULK1", ownerPartyId: ORG, assetTypeEnumId: "AstTpInventory"}), false)
    return {
        p18,
        steps,
        stores: rows("mantle.product.store.ProductStore", {organizationPartyId: ORG}).length,
        inspection: one("mantle.product.quality.QualityInspection", {qualityInspectionId: p18.inspectionId}),
        shipment: one("mantle.shipment.Shipment", {shipmentId: p18.shipmentId}),
        onHand
    }
}
// the P18 records on the detail, task, Handheld and report screens and the shared mounts, each with the organization's own
// user who may open it (a task screen shows its records only to its capability) and the render mode
function p18Routes(p18) {
    const routes = [
        ["Home", {facilityId: FACILITY}],
        ["Receiving/ReceiptDetail", {shipmentId: p18.receiptId}],
        ["Receiving/Receive", {shipmentId: p18.receiptId}, "p18.receive"],
        ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}],
        ["Receiving/Putaway", {facilityId: FACILITY, assetId: p18.assetId}, "p18.move"],
        ["Receiving/PutawaySheet", {facilityId: FACILITY}],
        ["Receiving/Supplier360", {vendorPartyId: SUPPLIER}],
        ["Handheld/Home", {lookupId: p18.assetId}],
        ["Handheld/Receive", {shipmentId: p18.receiptId}, "p18.receive"],
        ["Handheld/Putaway", {facilityId: FACILITY}, "p18.move"],
        ["Handheld/Pack", {shipmentId: p18.shipmentId}, "p18.pack"],
        ["Handheld/Move", {facilityId: FACILITY, assetId: p18.assetId}, "p18.move"],
        ["Handheld/PickFace", {facilityId: FACILITY}, "p18.move"],
        ["Handheld/Count", {physicalInventoryId: p18.countId}, "p18.count"],
        ["Inventory/Assets", {facilityId: FACILITY}],
        ["Inventory/AssetDetail", {assetId: p18.assetId}],
        ["Inventory/AssetDetail/Ledger", {assetId: p18.assetId, lastStandalone: "true"}],
        ["Inventory/Movements", {facilityId: FACILITY}],
        ["Inventory/Availability", {productId: PRODUCT}],
        ["Inventory/Product360", {productId: PRODUCT}],
        ["Inventory/Traceability", {rootType: "asset", rootId: p18.assetId}],
        ["Inventory/Adjustments", {assetId: p18.assetId}, "p18.adjust"],
        ["Transfers/Move", {facilityId: FACILITY, assetId: p18.assetId}, "p18.move"],
        ["Locations/FacilityDetail", {facilityId: FACILITY}],
        ["Locations/FacilityDetail/Locations", {facilityId: FACILITY, lastStandalone: "true"}],
        ["Locations/PutawayRules", {facilityId: FACILITY}],
        ["QualityInspection", {qualityInspectionId: p18.inspectionId}],
        ["InspectionCertificate", {qualityInspectionId: p18.inspectionId}],
        ["Inspection/Inspections", {facilityId: FACILITY}, "p18.inspect"],
        ["Counts/Counts", {facilityId: FACILITY}, "p18.count"],
        ["Counts/CountDetail", {physicalInventoryId: p18.countId}, "p18.count"],
        ["Shipping/Shipments", {facilityId: FACILITY}],
        ["Shipping/ShipmentDetail", {shipmentId: p18.shipmentId}],
        ["Shipping/Pack", {shipmentId: p18.shipmentId}, "p18.pack"],
        ["Shipping/PackingSlip", {shipmentId: p18.shipmentId}],
        ["Shipping/Ship", {shipmentId: p18.shipmentId}, "p18.ship"],
        ["Shipping/PackageTracking", {facilityId: FACILITY, show: "all"}],
        ["Shipping/Manifest", {facilityId: FACILITY}],
        ["Orders/OrderDetail", {orderId: p18.salesOrderId}],
        ["Orders/OrderDetail", {orderId: p18.purchaseOrderId}],
        ["Orders/InvoiceDetail", {invoiceId: p18.invoiceId}],
        ["Reports/StockAtDate", {facilityId: FACILITY, productId: PRODUCT}],
        ["Reports/OperationsHistory", {facilityId: FACILITY}],
        ["Reports/InventoryValuation", {facilityId: FACILITY, productId: PRODUCT}]
    ].map(([path, parameters, owner]) => ({path, parameters, owner: owner || "p18.read", mode: "html"}))
    // the record panels' terminal twins on the organization's shipments, asset and facility
    for (const [recordEntity, recordId] of [["mantle.shipment.Shipment", p18.receiptId], ["mantle.shipment.Shipment",
        p18.shipmentId], ["mantle.product.asset.Asset", p18.assetId], ["mantle.facility.Facility", FACILITY]])
        for (const twin of ["RecordFiles/RecordFilesTui", "Chatter/ChatterTui"])
            routes.push({path: twin, parameters: {recordEntity, recordId}, owner: "p18.read", mode: "tui"})
    return routes
}
// the routes whose records the plan names (design §13's Handheld mounts, the shared screens, the record panels): each
// must show the organization's records to its own user, so a refusal of the other organization is not an empty page
const requiredShown = ["Receiving/ReceiptDetail", "Receiving/Receive", "Receiving/Putaway", "Handheld/Home",
    "Handheld/Receive", "Handheld/Putaway", "Handheld/Pack", "Handheld/Move", "Handheld/PickFace", "Handheld/Count",
    "Inventory/AssetDetail", "Inventory/Availability", "Inventory/Product360", "Locations/FacilityDetail",
    "Locations/PutawayRules", "QualityInspection", "Counts/Counts", "Shipping/ShipmentDetail", "Shipping/Pack",
    "Shipping/Ship", "Orders/OrderDetail", "Orders/InvoiceDetail", "Reports/StockAtDate", "Chatter/ChatterTui"]
const routeName = route => `${route.path} ${JSON.stringify(route.parameters)} (${route.mode})`

;({ORG, FACILITY, SUPPLIER, CUSTOMER, PRODUCT, SECRET, RETAIL, RETAIL_RECORDS, COST, PRICE, p18Users, retailUsers, sweepUsers,
    otherRoots, T, Q, key, find, one, rows, call, run, render, read, refusedFor, post, leaks, retailPattern, setup,
    receiveToShip, p18Routes, requiredShown, routeName})
