// Helpers the Purchasing specs share: the demo ids (data/BossPurchasingDemoData.xml, BossUsersDemoData.xml), the demo users
// by group, a block run as a user with artifact authorization on or off, a call's refusal message, a Purchasing page render
// and the route fixtures the acceptance AppStructure renders. Later phases add their ids, users and routes here.
const ids = {
    // Retail's draft purchase order from Brightline, and the Warehouse demo's approved one from Ziddleman
    orderId: "BOSS_PUR_PO_A",
    approvedOrderId: "BOSS_WH_PO",
    // Ziziwork Services' purchase order and supplier
    otherOrderId: "BOSS_PUR_PO_SVC",
    otherSupplierId: "BOSS_PUR_SUP_SVC_ORG",
    // Retail's supplier, and the shared ones (Mantle's Ziddleman, given the shared owner, and Common Fasteners)
    supplierId: "BOSS_PUR_SUP_B",
    sharedSupplierId: "ZiddlemanInc",
    commonSupplierId: "BOSS_PUR_SUP_C",
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // P14a: Retail's warehouse, the facility Replenishment plans
    facilityId: "ZIRET_WH",
    // P2: Retail's supplier awaiting approval and its blocked one (BossPurchasingDemoData.xml's buying profiles)
    pendingSupplierId: "BOSS_PUR_SUP_PENDING",
    blockedSupplierId: "BOSS_PUR_SUP_BLOCKED",
    // P4: Retail's approval policy steps (BossPurchasingDemoData.xml): up to $5,000 one step, from $5,000 two
    approvalPolicyIds: ["BOSS_PUR_APR_SMALL", "BOSS_PUR_APR_LARGE_1", "BOSS_PUR_APR_LARGE_2"],
    // P5: Retail's approved order from Ziddleman, late, with its expected receipt (nothing received)
    receiptOrderId: "BOSS_PUR_PO_RCV",
    receiptId: "BOSS_PUR_RCV_SHIP"
}
// The demo users of each group (each also in BOSS_PURCHASING but the administrator), and the other organization's reader.
const users = {
    requester: "purchasing.requester",
    buyer: "purchasing.buyer",
    planner: "purchasing.planner",
    approve: "purchasing.approve",
    read: "purchasing.read",
    admin: "purchasing.admin",
    buyMatch: "purchasing.buymatch",
    buyReceive: "purchasing.buyreceive",
    services: "purchasing.services"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Purchasing screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a
// widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Purchasing.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Purchasing and the launcher's apps for the user, as the shell fetches them.
function shell(user) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/Purchasing/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "Purchasing") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Purchasing")?.providers
        }
    })
}

// The route fixtures of the Purchasing screens that are not placeholders, for the acceptance AppStructure: by path under the
// root, the demo record's parameters and a text the screen shows in every data state; and the shared screens mounted under
// the root that the screen file walk does not find, as [path, screen location]. Each phase adds its routes.
function routeFixtures() {
    const routes = {
        // P1: Home's counters (counted by later phases) and the lookup of the demo purchase order
        Home: {parameters: {lookupType: "order", lookupId: ids.orderId}, text: "Brightline restock"},
        // P14a: Replenishment's supply plan of Retail's warehouse, its availability of a demo product, the reorder rules
        Replenishment: {parameters: {planFacilityId: ids.facilityId}, text: "Supply planning"},
        "Replenishment/SupplyPlanning": {parameters: {planFacilityId: ids.facilityId}, text: "Supply planning"},
        "Replenishment/InventoryAvailability": {parameters: {productId: "DEMO_1_1", facilityId: ids.facilityId}, text: "Stock"},
        // the tabs and their parent, whose fragment the shell renders with the tab menu (the tab's own content is
        // PurchasingReplenishment's and the walk's)
        "Replenishment/ReorderRules": {},
        "Replenishment/ReorderRules/Rules": {},
        "Replenishment/ReorderRules/SuggestLevels": {parameters: {planFacilityId: ids.facilityId}},
        "Replenishment/ReorderRules/PlanSchedule": {parameters: {planFacilityId: ids.facilityId}},
        // P2: the suppliers, a supplier's 360, Product360, and the settings with the buying policy
        "Suppliers/SupplierList": {parameters: {}, text: "Suppliers"},
        "Suppliers/Supplier360": {parameters: {vendorPartyId: ids.blockedSupplierId}, text: "Halvorsen Metals"},
        "Suppliers/SupplierPrices": {parameters: {}, text: "Supplier offers"},
        "Suppliers/PriceExplain": {
            parameters: {productId: "DEMO_1_1", vendorPartyId: ids.sharedSupplierId},
            text: "Transaction price context"
        },
        "Products/ProductFind": {parameters: {}, text: "Find a product"},
        "Products/Product360": {parameters: {productId: "DEMO_1_1"}, text: "DEMO_1_1"},
        "Settings/SettingsHome": {parameters: {}, text: "Supplier categories"},
        "Settings/PurchasePolicy": {parameters: {}, text: "Purchase controls"},
        // P3: the purchase orders, Retail's draft in OrderDetail and the quick create
        "Orders/PurchaseOrders": {parameters: {}, text: "Purchase orders"},
        "Orders/OrderDetail": {parameters: {orderId: ids.orderId}, text: "Brightline restock"},
        NewPurchaseOrder: {parameters: {}, text: "New purchase order"},
        // P4: the approvals waiting (Commons Notifications with Purchasing's topics) and the approval policies
        Approvals: {parameters: {}, text: "Approvals"},
        "Settings/ApprovalPolicies": {parameters: {}, text: "Approval steps"},
        // P5: the receipts, the late order's receipt in ShipmentDetail, the inspections and the receipt templates
        "Receiving/Receipts": {parameters: {view: "late"}, text: "Receipts"},
        "Receiving/ShipmentDetail": {parameters: {shipmentId: ids.receiptId}, text: "Receipt " + ids.receiptId},
        "Receiving/Inspections": {parameters: {}, text: "Inspections"},
        "Receiving/InspectionTemplates": {parameters: {}, text: "Inspection templates"},
        // P6: the bills, the match exceptions, and the shared InvoiceDetail and InvoiceMatch (no demo bill: not available)
        "Bills/BillList": {parameters: {}, text: "Supplier bills"},
        "Bills/MatchExceptions": {parameters: {}, text: "Match exceptions"},
        "Bills/InvoiceDetail": {parameters: {invoiceId: "BOSS_PUR_NO_BILL"}, text: "not available"},
        "Bills/InvoiceMatch": {parameters: {invoiceId: "BOSS_PUR_NO_BILL"}, text: "not available"}
    }
    // P2: Products' shared supplier, price and product screens under Suppliers and Products
    const mounts = [
        ["Replenishment/SupplyPlanning", "component://mr-boss/screen/Shared/SupplyPlanning.xml"],
        ["Replenishment/InventoryAvailability", "component://mr-boss/screen/Shared/InventoryAvailability.xml"],
        ["Suppliers/Supplier360", "component://mr-boss/screen/Shared/Supplier360.xml"],
        ["Suppliers/SupplierPrices", "component://mr-boss/screen/Shared/SupplierPrices.xml"],
        ["Suppliers/PriceExplain", "component://mr-boss/screen/Shared/PriceExplain.xml"],
        ["Products/Product360", "component://mr-boss/screen/Shared/Product360.xml"],
        // P3: Projects' shared OrderDetail under Orders
        ["Orders/OrderDetail", "component://mr-boss/screen/Shared/OrderDetail.xml"],
        // P5: Accounting's ShipmentDetail and Warehouse's QualityInspection and InspectionTemplates under Receiving
        ["Receiving/ShipmentDetail", "component://mr-boss/screen/Shared/ShipmentDetail.xml"],
        ["Receiving/QualityInspection", "component://mr-boss/screen/Shared/QualityInspection.xml"],
        ["Receiving/InspectionTemplates", "component://mr-boss/screen/Shared/InspectionTemplates.xml"],
        // P6: Projects' shared InvoiceDetail and Accounting's shared InvoiceMatch under Bills
        ["Bills/InvoiceDetail", "component://mr-boss/screen/Shared/InvoiceDetail.xml"],
        ["Bills/InvoiceMatch", "component://mr-boss/screen/Shared/InvoiceMatch.xml"]
    ]
    return {routes, mounts}
}

// P14a: a bought product of Retail's with Ziddleman's purchase price and a sales order for it at ZIRET_WH, so a spec plans
// its own shortage (Replenishment's specs and walk); the order id is new on each call when the database outlives a run.
function replenishmentFixture(fixture) {
    system(() => {
        invoke("store#mantle.product.Product", {
            productId: fixture.productId,
            pseudoId: fixture.productId,
            productName: fixture.productName,
            productTypeEnumId: "PtAsset",
            assetTypeEnumId: "AstTpInventory",
            amountUomId: "OTH_ea",
            ownerPartyId: ids.organizationId,
            statusId: "PrdActive"
        })
        invoke("store#mantle.product.ProductPrice", {
            productPriceId: fixture.productId + "_BUY",
            productId: fixture.productId,
            vendorPartyId: ids.sharedSupplierId,
            pricePurposeEnumId: "PppPurchase",
            priceTypeEnumId: "PptCurrent",
            fromDate: 0,
            price: 4,
            priceUomId: "USD"
        })
        if (!fixture.orderId) return
        invoke("store#mantle.order.OrderHeader", {orderId: fixture.orderId, statusId: "OrderApproved", currencyUomId: "USD"})
        invoke("store#mantle.order.OrderPart", {
            orderId: fixture.orderId,
            orderPartSeqId: "01",
            vendorPartyId: ids.organizationId,
            customerPartyId: "CustJqp",
            facilityId: ids.facilityId,
            statusId: "OrderApproved"
        })
        invoke("store#mantle.order.OrderItem", {
            orderId: fixture.orderId,
            orderPartSeqId: "01",
            orderItemSeqId: "01",
            productId: fixture.productId,
            quantity: fixture.quantity || 6,
            unitAmount: 20,
            requiredByDate: new Date(Date.now() + 7 * 86400000)
        })
    })
}

// P6: an approved purchase order of Retail's from Ziddleman for ten of DEMO_1_1 at 9.00, eight received of which seven
// accepted and one rejected (received, not delivered, so no receipt bill), and the supplier's bill for eight at 9.50 uploaded
// by the buyer (import#Bill) with its product line keyed in by AP; with match, the buyer who holds the match group applies
// the seven, which holds the bill on its price. Each call makes a new order and bill (the reference is the run's).
function billFixture(name, match = true) {
    const fixture = {}
    system(() => {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const order = invoke("mantle.order.OrderServices.create#Order", {
            customerPartyId: ids.organizationId,
            vendorPartyId: ids.sharedSupplierId,
            currencyUomId: "USD",
            facilityId: ids.facilityId,
            orderName: name
        })
        fixture.orderId = order.orderId
        fixture.orderItemSeqId = invoke("mantle.order.OrderServices.add#OrderProductQuantity", {
            orderId: order.orderId,
            orderPartSeqId: order.orderPartSeqId,
            productId: "DEMO_1_1",
            quantity: 10,
            unitAmount: 9,
            itemTypeEnumId: "ItemInventory"
        }).orderItemSeqId
        invoke("mantle.order.OrderServices.place#Order", {orderId: order.orderId})
        invoke("mantle.order.OrderServices.approve#Order", {orderId: order.orderId})
        const shipment = invoke("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
            orderId: order.orderId,
            orderPartSeqId: order.orderPartSeqId,
            destinationFacilityId: ids.facilityId
        })
        invoke("mantle.shipment.ShipmentServices.receive#ShipmentProduct", {
            shipmentId: shipment.shipmentId,
            productId: "DEMO_1_1",
            quantityAccepted: 7,
            quantityRejected: 1,
            facilityId: ids.facilityId
        })
        fixture.shipmentId = shipment.shipmentId
        fixture.assetReceiptId = Array.from(
            ec.entity
                .find("mantle.product.receipt.AssetReceipt")
                .condition("shipmentId", shipment.shipmentId)
                .disableAuthz()
                .list()
        )[0].assetReceiptId
    })
    fixture.reference = name + "-" + Date.now()
    fixture.invoiceId = asUser(
        users.buyer,
        () =>
            invoke("mantle.account.InvoiceServices.import#Bill", {
                organizationPartyId: ids.organizationId,
                supplierPartyId: ids.sharedSupplierId,
                referenceNumber: fixture.reference,
                orderId: fixture.orderId
            }).invoiceId,
        false
    )
    system(() =>
        invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
            invoiceId: fixture.invoiceId,
            itemTypeEnumId: "ItemInventory",
            productId: "DEMO_1_1",
            quantity: 8,
            amount: "9.50"
        })
    )
    if (match) {
        const invoiceItemSeqId = Array.from(
            ec.entity.find("mantle.account.invoice.InvoiceItem").condition("invoiceId", fixture.invoiceId).disableAuthz().list()
        )[0].invoiceItemSeqId
        fixture.applied = asUser(
            users.buyMatch,
            () =>
                invoke("mantle.account.InvoiceMatchServices.apply#InvoiceMatch", {
                    invoiceId: fixture.invoiceId,
                    allocationList: [
                        {
                            invoiceItemSeqId,
                            orderId: fixture.orderId,
                            orderItemSeqId: fixture.orderItemSeqId,
                            assetReceiptId: fixture.assetReceiptId,
                            quantity: "7"
                        }
                    ]
                }),
            false
        )
    }
    return fixture
}

;({ids, users, asUser, system, refusal, invoke, page, shell, routeFixtures, replenishmentFixture, billFixture})
