// The Warehouse access walk (design-warehouse §19 and crosscut §6 standalone operation, impl-warehouse P18): an organization
// with no ProductStore, BOSS_P18_ORG, and Warehouse users of one capability each with no other launcher (spec users in the
// root group and one capability group, agents of that organization) run receive to ship on its facility: a purchase receipt
// into quarantine, the inspection submitted, verified and released, putaway to the pick face, the sales order's shipment
// picked, packed and shipped with a manual tracking code. The organization's records carry "P18 secret" in a text the
// screens show; Retail's demo Warehouse users (BossUsersDemoData.xml) never see them, through URLs, the shared mounts, the
// Handheld mounts, exports, the palette, search and the drop-downs, and the P18 users never see Retail's. Neither side reads
// cost or value without financial read, or settles: Accounting's settlement and release refuse them.
// Run: ./moq test mr-boss --spec WarehouseAccessWalk
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
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
    "p18.ship": ["BOSS_WAREHOUSE_SHIP"]
}
// Retail's demo Warehouse users of each capability (not the administrator, who works in every organization's facilities)
const retailUsers = ["warehouse.read", "warehouse.receive", "warehouse.inspect", "warehouse.quality", "warehouse.move",
    "warehouse.picksupervisor", "warehouse.pick", "warehouse.pack", "warehouse.ship", "warehouse.count", "warehouse.adjust"]
const otherRoots = ["Products", "Accounting", "Sales", "Purchasing", "Manufacturing", "CustomerService", "Projects", "Admin"]
// the P18 records, set by the receive-to-ship feature
const p18 = {}
let keySeq = 0
const key = () => "p18-walk-" + ++keySeq

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
    for (const userGroupId of ["BOSS_WAREHOUSE"].concat(groups))
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
// what a list of renders shows that it may not, as problem lines; a pattern may be a function of the render's name
function leaks(username, renders, pattern) {
    const of = name => (typeof pattern === "function" ? pattern(name) : pattern)
    return renders.filter(([name, got]) => of(name).test(got.output)).map(([name]) => `${username} sees ${name}`)
}
const retailPattern = name => (name.startsWith("Receiving/Supplier360") ? RETAIL_RECORDS : RETAIL)

spec({
    setupSpec() {
        login("john.doe")
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
            ["PICK1", "FltPick"]])
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
        store("mantle.facility.ProductFacilityLocation", {productId: PRODUCT, facilityId: FACILITY, locationSeqId: "PICK1"})
        // receipts go to quarantine for inspection (receipt step 3), and the gasket needs one
        store("mantle.facility.WarehousePolicy", {warehousePolicyId: "BOSS_P18_OPERATION", organizationPartyId: ORG,
            policyType: "operation", facilityId: FACILITY, productId: "_NA_", fromDate: since, receiptSteps: 3,
            receivingLocationSeqId: "RECV", quarantineLocationSeqId: "QUAR"})
        store("mantle.facility.WarehousePolicy", {warehousePolicyId: "BOSS_P18_TRACKING", organizationPartyId: ORG,
            policyType: "tracking", facilityId: "_NA_", productId: PRODUCT, fromDate: since, inspectionRequired: "Y"})
        ec.artifactExecution.enableAuthz()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("an organization with no ProductStore runs receive to ship, each step by a user of its capability alone", {
    when() {
        const steps = {}
        // the receipt: a purchase order of the supplier's, its open receipt, the gasket received into quarantine
        p18.purchaseOrderId = asUser("john.doe", () => order(SUPPLIER, ORG, COST, 6, false), false)
        const ensured = run("p18.receive", T + "ensure#PurchaseReceipt", {operationKey: key(), orderId: p18.purchaseOrderId,
            orderPartSeqId: "01", facilityId: FACILITY})
        steps.ensure = ensured.error
        p18.receiptId = ensured.result?.shipmentId
        const received = run("p18.receive", T + "receive#ShipmentStock", {operationKey: key(), shipmentId: p18.receiptId,
            productId: PRODUCT, quantityAccepted: 6})
        steps.receive = received.error
        p18.assetId = received.result?.assetIds?.[0]
        steps.quarantined = one("mantle.product.asset.Asset", {assetId: p18.assetId})?.statusId
        steps.receiptPage = asUser("p18.receive", () => page("Receiving/ReceiptDetail", {shipmentId: p18.receiptId}, "html"))
        // the inspection: submitted by the inspector, verified and released to receiving by the quality manager
        p18.inspectionId = rows("mantle.product.quality.QualityInspection", {productId: PRODUCT})[0]?.qualityInspectionId
        steps.queue = asUser("p18.inspect", () => page("Inspection/Inspections", {}, "html"))
        steps.submit = run("p18.inspect", Q + "submit#Inspection", {qualityInspectionId: p18.inspectionId,
            quantityAccepted: 6}).error
        steps.verify = run("p18.quality", Q + "verify#Inspection", {qualityInspectionId: p18.inspectionId}).error
        steps.release = run("p18.quality", Q + "dispose#Inspection", {operationKey: key(),
            qualityInspectionId: p18.inspectionId, dispositionEnumId: "QdRelease", quantity: 6, toLocationSeqId: "RECV"}).error
        // putaway to the product's pick face, the suggestion
        const released = rows("mantle.product.asset.Asset", {productId: PRODUCT, facilityId: FACILITY})
            .find(asset => asset.statusId === "AstAvailable" && Number(String(asset.quantityOnHandTotal)) > 0)
        steps.putawayPage = asUser("p18.move", () => page("Receiving/Putaway", {facilityId: FACILITY}, "html"))
        const putaway = run("p18.move", T + "putaway#Stock", {operationKey: key(), assetId: released?.assetId})
        steps.putaway = putaway.error
        steps.putawayTo = putaway.result?.toLocationSeqId
        // the sales order (no store), its shipment by the pick supervisor, picked, packed and shipped
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
        const packed = run("p18.pack", T + "pack#ShipmentStock", {operationKey: key(), shipmentId: p18.shipmentId,
            shipmentItemSourceId: line?.shipmentItemSourceId, quantity: 4})
        steps.pack = packed.error
        // no box type to weigh it by: the packer enters the weight
        steps.weigh = run("p18.pack", T + "edit#ShipmentPackage", {operationKey: key(), shipmentId: p18.shipmentId,
            action: "update", shipmentPackageSeqId: packed.result?.shipmentPackageSeqId, weight: 8, weightUomId: "WT_lb"}).error
        steps.complete = run("p18.pack", T + "complete#Pack", {operationKey: key(), shipmentId: p18.shipmentId}).error
        steps.shipPage = asUser("p18.ship", () => page("Shipping/Ship", {shipmentId: p18.shipmentId}, "html"))
        steps.tracking = run("p18.ship", T + "record#ManualTracking", {operationKey: key(), shipmentId: p18.shipmentId,
            trackingCode: "P18-COURIER-1"}).error
        steps.ship = run("p18.ship", T + "ship#OutgoingShipment", {operationKey: key(), shipmentId: p18.shipmentId}).error
        p18.invoiceId = rows("mantle.order.OrderItemBilling", {shipmentId: p18.shipmentId})[0]?.invoiceId
        return {
            steps,
            stores: rows("mantle.product.store.ProductStore", {organizationPartyId: ORG}).length,
            receipt: one("mantle.shipment.Shipment", {shipmentId: p18.receiptId}),
            inspection: one("mantle.product.quality.QualityInspection", {qualityInspectionId: p18.inspectionId}),
            shipment: one("mantle.shipment.Shipment", {shipmentId: p18.shipmentId}),
            onHand: rows("mantle.product.asset.Asset", {productId: PRODUCT, facilityId: FACILITY})
                .reduce((sum, row) => sum + Number(String(row.quantityOnHandTotal)), 0)
        }
    },
    then({steps, stores, receipt, inspection, shipment, onHand}) {
        stores == 0
        steps.ensure == ""
        steps.receive == ""
        steps.quarantined == "AstQuarantine"
        steps.receiptPage.errors == []
        steps.receiptPage.output.includes("P18 secret gasket")
        receipt != null
        steps.queue.output.includes(p18.inspectionId)
        steps.submit == ""
        steps.verify == ""
        steps.release == ""
        inspection.statusId == "QiDisposed"
        steps.putawayPage.errors == []
        steps.putaway == ""
        steps.putawayTo == "PICK1"
        steps.reserved == 4
        steps.shipment == ""
        steps.pick == ""
        steps.finishPick == ""
        steps.packPage.output.includes("P18 secret gasket")
        steps.pack == ""
        steps.weigh == ""
        steps.complete == ""
        steps.shipPage.output.includes("P18 secret gasket")
        steps.tracking == ""
        steps.ship == ""
        shipment.statusId == "ShipShipped"
        onHand == 2
    }
})

feature("each Warehouse user opens Warehouse and no other app root", {
    when() {
        const problems = []
        for (const username of Object.keys(p18Users).concat(retailUsers))
            asUser(username, () => {
                const home = page("Home", {}, "html")
                if (home.status != 200 || home.errors.length) problems.push(`${username} cannot open Warehouse: ${home.errors}`)
                for (const root of otherRoots) {
                    const other = render(root, "", {})
                    if (other.status == 200 && !other.errors) problems.push(`${username} opens the ${root} app`)
                }
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// the P18 records on the detail, task, Handheld and report screens, and the shared mounts
function p18Routes() {
    return [
        ["Home", {facilityId: FACILITY}],
        ["Receiving/ReceiptDetail", {shipmentId: p18.receiptId}],
        ["Receiving/Receive", {shipmentId: p18.receiptId}],
        ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}],
        ["Receiving/Putaway", {facilityId: FACILITY, assetId: p18.assetId}],
        ["Receiving/Supplier360", {vendorPartyId: SUPPLIER}],
        ["Handheld/Home", {lookupId: p18.assetId}],
        ["Handheld/Receive", {shipmentId: p18.receiptId}],
        ["Handheld/Putaway", {facilityId: FACILITY}],
        ["Handheld/Pack", {shipmentId: p18.shipmentId}],
        ["Handheld/Move", {facilityId: FACILITY}],
        ["Handheld/PickFace", {facilityId: FACILITY}],
        ["Inventory/Assets", {facilityId: FACILITY}],
        ["Inventory/AssetDetail", {assetId: p18.assetId}],
        ["Inventory/AssetDetail/Ledger", {assetId: p18.assetId, lastStandalone: "true"}],
        ["Inventory/Movements", {facilityId: FACILITY}],
        ["Inventory/Availability", {productId: PRODUCT}],
        ["Inventory/Product360", {productId: PRODUCT}],
        ["Inventory/Traceability", {rootType: "asset", rootId: p18.assetId}],
        ["Inventory/Adjustments", {assetId: p18.assetId}],
        ["Transfers/Move", {facilityId: FACILITY, assetId: p18.assetId}],
        ["Locations/FacilityDetail", {facilityId: FACILITY}],
        ["Locations/FacilityDetail/Locations", {facilityId: FACILITY, lastStandalone: "true"}],
        ["Locations/PutawayRules", {facilityId: FACILITY}],
        ["QualityInspection", {qualityInspectionId: p18.inspectionId}],
        ["InspectionCertificate", {qualityInspectionId: p18.inspectionId}],
        ["Inspection/Inspections", {facilityId: FACILITY}],
        ["Counts/Counts", {facilityId: FACILITY}],
        ["Shipping/Shipments", {facilityId: FACILITY}],
        ["Shipping/ShipmentDetail", {shipmentId: p18.shipmentId}],
        ["Shipping/Pack", {shipmentId: p18.shipmentId}],
        ["Shipping/PackingSlip", {shipmentId: p18.shipmentId}],
        ["Shipping/Ship", {shipmentId: p18.shipmentId}],
        ["Shipping/PackageTracking", {facilityId: FACILITY, show: "all"}],
        ["Shipping/Manifest", {facilityId: FACILITY}],
        ["Orders/OrderDetail", {orderId: p18.salesOrderId}],
        ["Orders/OrderDetail", {orderId: p18.purchaseOrderId}],
        ["Orders/InvoiceDetail", {invoiceId: p18.invoiceId}],
        ["Reports/StockAtDate", {facilityId: FACILITY, productId: PRODUCT}],
        ["Reports/OperationsHistory", {facilityId: FACILITY}],
        ["Reports/InventoryValuation", {facilityId: FACILITY, productId: PRODUCT}]
    ]
}
feature("Retail's Warehouse users see nothing of the other organization by URL, shared and Handheld mounts, html and terminal", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const records = [["mantle.shipment.Shipment", p18.receiptId], ["mantle.shipment.Shipment", p18.shipmentId],
            ["mantle.product.asset.Asset", p18.assetId], ["mantle.facility.Facility", FACILITY]]
        for (const username of retailUsers)
            asUser(username, () => {
                // the terminal twins for the reader, html for every capability
                const modes = username === "warehouse.read" ? ["html", "tui"] : ["html"]
                const renders = []
                for (const [path, parameters] of p18Routes())
                    for (const mode of modes) renders.push([`${path} (${mode})`, page(path, parameters, mode)])
                for (const [recordEntity, recordId] of records)
                    for (const twin of ["RecordFiles/RecordFilesTui", "Chatter/ChatterTui"])
                        renders.push([`${twin} of ${recordId}`, page(twin, {recordEntity, recordId}, "tui")])
                problems.push(...leaks(username, renders, SECRET))
            })
        // the same routes show the records to the organization's own reader, so a failing page is not taken for a refusal
        const ownShown = asUser("p18.read", () =>
            p18Routes().filter(([path, parameters]) => SECRET.test(page(path, parameters, "html").output)).length)
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, ownShown}
    },
    then({problems, ownShown}) {
        problems.join("\n") == ""
        ownShown > 20
    }
})

feature("the other organization's Warehouse users see nothing of Retail's records on any Warehouse route", {
    when() {
        const problems = []
        const routes = Object.entries(lib.routeFixtures().routes).filter(([, fixture]) => fixture.parameters)
        for (const username of ["p18.read", "p18.receive", "p18.pick", "p18.quality"])
            asUser(username, () => {
                const renders = routes.map(([path, fixture]) => [path, page(path, fixture.parameters, "html")])
                problems.push(...leaks(username, renders, retailPattern))
                // and their own records show, so a page that fails is not taken for a refusal
                const own = page("Inventory/AssetDetail", {assetId: p18.assetId}, "html")
                if (!SECRET.test(own.output)) problems.push(`${username} does not see its own asset`)
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, count: routes.length}
    },
    then({problems, count}) {
        count > 60
        problems.join("\n") == ""
    }
})

feature("exports and prints of each side hold only its organization's rows", {
    when() {
        const problems = []
        const exported = Object.entries(lib.routeFixtures().routes).filter(([path]) => {
            const location = `component://mr-boss/screen/Warehouse/${path}.xml`
            const reference = ec.resource.getLocationReference(location)
            return reference.getExists() && /show-csv-button="true"/.test(reference.getText())
        })
        const sides = [["warehouse.read", FACILITY, SECRET], ["warehouse.receive", FACILITY, SECRET],
            ["p18.read", "ZIRET_WH", retailPattern], ["p18.receive", "ZIRET_WH", retailPattern]]
        for (const [username, facilityId, pattern] of sides)
            asUser(username, () => {
                const renders = []
                for (const [path, fixture] of exported)
                    for (const parameters of [fixture.parameters || {}, {facilityId}])
                        renders.push([`${path} csv ${JSON.stringify(parameters)}`, page(path, parameters, "csv")])
                for (const [path, parameters] of [["Shipping/PackingSlip", {shipmentId: p18.shipmentId}],
                    ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}], ["Shipping/Manifest", {facilityId: FACILITY}],
                    ["Receiving/PutawaySheet", {facilityId: FACILITY}], ["Picking/PickSheet", {workEffortId: "BOSS_WH_LOAD"}],
                    ["Shipping/PackingSlip", {shipmentId: "BOSS_WH_SHIP_PACK"}], ["Shipping/Manifest", {facilityId: "ZIRET_WH"}]])
                    renders.push([`${path} print ${JSON.stringify(parameters)}`, page(path, parameters, "html-print")])
                problems.push(...leaks(username, renders, pattern))
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, count: exported.length}
    },
    then({problems, count}) {
        count >= 8
        problems.join("\n") == ""
    }
})

feature("the palette, scans, record links, search and drop-downs keep each side to its records", {
    when() {
        const problems = []
        const p18Ids = [[ "MantleShipment", p18.receiptId], ["MantleShipment", p18.shipmentId], ["MantleAsset", p18.assetId],
            ["MantleFacility", FACILITY]]
        const retailIds = [["MantleShipment", "BOSS_WH_SHIP_IN"], ["MantleAsset", "BOSS_WH_LOT_AVAIL"],
            ["MantleFacility", "ZIRET_WH"]]
        const found = {}
        for (const [username, foreign, own] of [["warehouse.read", p18Ids, retailIds], ["warehouse.pick", p18Ids, retailIds],
            ["p18.read", retailIds, p18Ids], ["p18.ship", retailIds, p18Ids]])
            asUser(username, () => {
                for (const [docType, id] of foreign) {
                    const palette = read("ironstone.warehouse.AccessServices.search#Records", {text: id, limit: 20})
                    if ((palette.rows || []).some(row => JSON.stringify(row).includes(id)))
                        problems.push(`${username} finds ${id} in the palette`)
                    const scanned = read("ironstone.warehouse.AccessServices.get#ScannedRecord", {scanText: id})
                    if ((scanned.matches || []).length) problems.push(`${username} scans ${id}`)
                    const link = read("ironstone.commons.PaletteServices.get#RecordLink", {docType, id})
                    if (link.url) problems.push(`${username} has a link to ${id}`)
                    // the palette's search runs with the user's authorization and organization filters
                    const universal = asUser(username, () => {
                        try {
                            return ec.service.sync().name("mantle.search.UniversalSearchServices.search#Universal")
                                .parameters({q: id, entityType: docType}).call() || {}
                        } catch (error) {
                            return {}
                        }
                    })
                    if (Array.from(universal.results || []).length) problems.push(`${username} finds ${id} in search`)
                }
                // the user's own facility is found and linked, so an empty answer is not taken for a refusal
                const [, ownFacility] = own.find(([docType]) => docType === "MantleFacility")
                found[username] = {
                    palette: (read("ironstone.warehouse.AccessServices.search#Records", {text: ownFacility, limit: 20}).rows || [])
                        .length,
                    link: read("ironstone.commons.PaletteServices.get#RecordLink", {docType: "MantleFacility", id: ownFacility}).url
                }
                for (const extra of [{term: "P18"}, {term: "Retail"}, {selected: FACILITY}, {selected: "ZIRET_WH"}]) {
                    const options = read("ironstone.warehouse.AccessServices.get#Choices",
                        Object.assign({choice: "facilities"}, extra)).options || []
                    const text = JSON.stringify(Array.from(options))
                    const pattern = username.startsWith("p18.") ? RETAIL : SECRET
                    if (pattern.test(text)) problems.push(`${username} gets facilities ${JSON.stringify(extra)}: ${text.substring(0, 120)}`)
                }
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, found}
    },
    then({problems, found}) {
        problems.join("\n") == ""
        found["warehouse.read"].palette > 0
        found["p18.read"].palette > 0
        !!found["warehouse.read"].link
        !!found["p18.read"].link
    }
})

feature("without financial read no cost or price shows, and settlement, release and revaluation are refused", {
    when() {
        const problems = []
        const money = new RegExp([COST, PRICE, "43.86", "77.88"].map(value => value.replace(".", "\\.")).join("|"))
        const routes = [["Inventory/AssetDetail", {assetId: p18.assetId}], ["Inventory/AssetDetail/Ledger",
            {assetId: p18.assetId, lastStandalone: "true"}], ["Inventory/Movements", {facilityId: FACILITY}],
            ["Receiving/ReceiptDetail", {shipmentId: p18.receiptId}], ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}],
            ["Orders/OrderDetail", {orderId: p18.salesOrderId}], ["Orders/OrderDetail", {orderId: p18.purchaseOrderId}],
            ["Orders/InvoiceDetail", {invoiceId: p18.invoiceId}], ["Shipping/ShipmentDetail", {shipmentId: p18.shipmentId}],
            ["Shipping/PackingSlip", {shipmentId: p18.shipmentId}], ["Reports/StockAtDate", {facilityId: FACILITY}],
            ["Reports/InventoryValuation", {facilityId: FACILITY, productId: PRODUCT}],
            ["Inventory/Traceability", {rootType: "asset", rootId: p18.assetId}]]
        const refusals = {}
        for (const username of Object.keys(p18Users))
            asUser(username, () => {
                const renders = []
                for (const [path, parameters] of routes)
                    for (const mode of username === "p18.read" ? ["html", "csv"] : ["html"])
                        renders.push([`${path} (${mode}) money`, page(path, parameters, mode)])
                problems.push(...leaks(username, renders, money))
            })
        for (const username of ["p18.read", "p18.ship", "p18.quality", "warehouse.read", "warehouse.ship"]) {
            refusals[username] = [
                run(username, "mantle.order.ReturnServices.settle#Return", {returnId: "BOSS_WH_RMA", previewVersion: "x",
                    operationKey: key()}).error,
                run(username, "mantle.account.InvoiceServices.release#ShipmentDraftInvoice", {shipmentId: p18.shipmentId,
                    reason: "P18 walk", operationKey: key()}).error,
                run(username, "mantle.ledger.AssetBookServices.preview#Revaluation", {productId: PRODUCT,
                    organizationPartyId: ORG, facilityId: FACILITY, changeReason: "P18 walk"}).error
            ]
            refusals[username].forEach((message, index) => {
                if (!refusedFor(message)) problems.push(`${username} is not refused settlement call ${index}: ${message}`)
            })
        }
        // a user with financial read sees the receipt's cost on the same routes
        const costShown = asUser("john.doe", () =>
            routes.filter(([path, parameters]) => money.test(page(path, parameters, "html").output)).length)
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, refusals, costShown}
    },
    then({problems, costShown}) {
        problems.join("\n") == ""
        costShown > 0
    }
})
