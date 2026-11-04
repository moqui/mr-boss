// Helpers the Manufacturing specs share: the demo ids (data/BossManufacturingDemoData.xml, BossUsersDemoData.xml), the demo
// users by capability, a block run as a user with artifact authorization on or off, a call's refusal message, a Manufacturing
// page render and the route fixtures AppStructure and TuiRender render. Later phases add their ids, users and routes here.
const ids = {
    // Retail's plant (Mantle's warehouse, with the demo lines under it), its lines and its draft run
    plantId: "ZIRET_WH",
    lineId: "BOSS_MFG_LINE_A",
    lineBId: "BOSS_MFG_LINE_B",
    runId: "BOSS_MFG_RUN_A",
    // the Warehouse demo's released run and its operation (BossWarehouseDemoData.xml)
    releasedRunId: "BOSS_WH_RUN",
    operationId: "BOSS_WH_RUN_OP",
    equipmentId: "EQUIP_AB4_1",
    // P3: line A's calendar, capacities, alternate and machine rate (BossManufacturingDemoData.xml)
    lineCalendarId: "BOSS_MFG_CAL_LINE_A",
    lineRateId: "BOSS_MFG_LINE_A_MACHINE",
    // the other organization's (ORG_ZIZI_SERVICES) plant, line and run
    otherPlantId: "BOSS_MFG_SVC_PLANT",
    otherLineId: "BOSS_MFG_SVC_LINE",
    otherRunId: "BOSS_MFG_SVC_RUN",
    otherFacilityId: "BOSS_PRD_WH",
    // P2: the released demo method of DEMO_1_1 (method code PILOT), its routing, operations and the operation templates
    productId: "DEMO_1_1",
    methodId: "BOSS_MFG_BOM_PILOT",
    routingId: "BOSS_MFG_ROUTING_A",
    routingOperationIds: ["BOSS_MFG_ROUTING_A_10", "BOSS_MFG_ROUTING_A_20"],
    templateIds: ["BOSS_MFG_OPT_ASSEMBLE", "BOSS_MFG_OPT_TEST"],
    componentId: "DEMO_RM_1",
    kitId: "DEMO_PA"
}
// The demo users of each capability group (each also in BOSS_MANUFACTURING), the administrator, the plant display (no
// root) and the other organization's reader.
const users = {
    read: "manufacturing.read",
    plan: "manufacturing.plan",
    schedule: "manufacturing.schedule",
    method: "manufacturing.method",
    methodApprove: "manufacturing.methodapprove",
    operate: "manufacturing.operate",
    supervise: "manufacturing.supervise",
    inspect: "manufacturing.inspect",
    verify: "manufacturing.verify",
    qualityAdmin: "manufacturing.qualityadmin",
    cost: "manufacturing.cost",
    resource: "manufacturing.resource",
    admin: "manufacturing.admin",
    display: "manufacturing.display",
    services: "manufacturing.services",
    // P6: a production reader with Accounting's ACCOUNTING_VIEW
    finance: "manufacturing.finance",
    // P5b: an operator who issues and moves stock (Warehouse's issue and move groups)
    material: "manufacturing.material"
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

// A Manufacturing screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with
// a widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Manufacturing.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}

// The route fixtures of the Manufacturing screens that are not placeholders, for AppStructure and TuiRender: by path under
// the root, the demo record's parameters and a text the screen shows in every data state; and the shared screens mounted
// under the root that the screen file walk does not find, as [path, screen location]. Each phase adds its routes.
function routeFixtures() {
    const routes = {
        // P1: Home's Summary (counted by later phases) and the lookup of the demo draft run
        Home: {parameters: {lookupType: "run", lookupId: ids.runId}, text: "Demo assemblies"},
        // P4: the production policy (the organization's default) and the reason codes
        Settings: {text: "Show policy"},
        "Settings/ProductionSettings": {text: "Show policy"},
        "Settings/ReasonCodes": {text: "Show reasons"}
    }
    // P3: the Work centers area (Centers by default) on Retail's demo lines and robot, the calendar (a .qvue: its component)
    // and its terminal twin, and the shared facility and equipment screens with the Manufacturing context and FacilityDetail's
    // Manufacturing tabs on line A
    Object.assign(routes, {
        WorkCenters: {text: "Assembly line A"},
        "WorkCenters/Centers": {text: "Assembly line A"},
        "WorkCenters/Equipment": {text: "Assembly Bot 4 1234"},
        "WorkCenters/ResourceCalendar": {},
        "WorkCenters/ResourceCalendarTui": {parameters: {date: "2026-11-02"}, text: "Work centers"},
        "WorkCenters/FacilityDetail": {parameters: {facilityId: ids.lineId}, text: "Assembly line A"},
        "WorkCenters/EquipmentDetail": {parameters: {assetId: ids.equipmentId}, text: "Assembly Bot 4 1234"}
    })
    const shared = "component://mr-boss/screen/Shared/"
    const mounts = [
        ["WorkCenters/FacilityDetail", shared + "FacilityDetail.xml"],
        ["WorkCenters/EquipmentDetail", shared + "EquipmentDetail.xml"]
    ]
    for (const tab of ["Overview", "WorkCenter", "Files", "Conversation"]) {
        mounts.push(["WorkCenters/FacilityDetail/" + tab, shared + "FacilityDetail/" + tab + ".xml"])
        routes["WorkCenters/FacilityDetail/" + tab] = {parameters: {facilityId: ids.lineId}, text: "Assembly line A"}
    }
    // P2: the method lists, the demo method and routing in the shared method screens, a template and Approvals
    Object.assign(routes, {
        BillsOfMaterials: {text: "BOMs"},
        "BillsOfMaterials/Find": {text: "BOMs"},
        "BillsOfMaterials/BillOfMaterialsDetail": {parameters: {productBomId: ids.methodId}, text: "Line A pilot assembly"},
        "BillsOfMaterials/WhereUsed": {parameters: {productId: ids.componentId}, text: "Where used"},
        "BillsOfMaterials/Product360": {parameters: {productId: ids.productId}, text: "Demo Product One-One"},
        "BillsOfMaterials/CostRollup": {parameters: {productId: ids.productId}, text: "Cost roll-up"},
        Routings: {text: "Routings"},
        "Routings/Find": {text: "Routings"},
        "Routings/RoutingDetail": {parameters: {workEffortId: ids.routingId}, text: "Line A assembly"},
        "Routings/OperationTemplates": {parameters: {workEffortId: ids.templateIds[0]}, text: "Photo of the fastened assembly"},
        Approvals: {text: "Approvals"}
    })
    mounts.push(
        // P2: Products' shared method and product screens under BillsOfMaterials and Routings
        ["BillsOfMaterials/BillOfMaterialsDetail", shared + "BillOfMaterialsDetail.xml"],
        ["BillsOfMaterials/WhereUsed", shared + "WhereUsed.xml"],
        ["BillsOfMaterials/Product360", shared + "Product360.xml"],
        ["BillsOfMaterials/CostRollup", shared + "CostRollup.xml"],
        ["Routings/RoutingDetail", shared + "RoutingDetail.xml"]
    )
    // P5a: the Work orders area (Find by default), New work order, the quick create, and the demo draft run's detail, tabs and
    // prints (a draft with no lines yet)
    const run = {workEffortId: ids.runId}
    Object.assign(routes, {
        WorkOrders: {text: "Work orders"},
        "WorkOrders/Find": {text: "Work orders"},
        "WorkOrders/NewWorkOrder": {text: "New work order"},
        "WorkOrders/QuickCreate": {text: "New work order"},
        "WorkOrders/WorkOrderDetail": {parameters: run, text: "Demo assemblies"},
        "WorkOrders/WorkOrderDetail/Overview": {parameters: run, text: "Demo assemblies"},
        "WorkOrders/WorkOrderDetail/Operations": {parameters: run, text: "Demo assemblies"},
        "WorkOrders/WorkOrderDetail/Notes": {parameters: run, text: "Demo assemblies"},
        "WorkOrders/WorkOrderDetail/Traveler": {parameters: run, text: "Demo assemblies"},
        "WorkOrders/WorkOrderDetail/PickSheet": {parameters: run, text: "Demo assemblies"}
    })
    // P6: the Costs tab on the Warehouse demo's released run
    routes["WorkOrders/WorkOrderDetail/ProductionCosts"] = {parameters: {workEffortId: ids.releasedRunId}, text: "Coated filters"}
    // P13: the Planning area (SupplyPlanning by default), the shared supply plan with the Manufacturing context on Retail's
    // plant
    Object.assign(routes, {
        Planning: {text: "Supply planning"},
        "Planning/SupplyPlanning": {parameters: {plantId: ids.plantId}, text: "Supply planning"}
    })
    mounts.push(["Planning/SupplyPlanning", shared + "SupplyPlanning.xml"])
    // P5b: the Components and Materials tabs (Shared/MaterialIssueReceipt) on the Warehouse demo's released run, and the
    // Planning area's shared InventoryAvailability with the Manufacturing context on its output at Retail's plant
    const stockProduct = {productId: "BOSS_WH_COATED", facilityId: ids.plantId}
    Object.assign(routes, {
        "WorkOrders/WorkOrderDetail/Components": {parameters: {workEffortId: ids.releasedRunId}, text: "Coated filters"},
        "WorkOrders/WorkOrderDetail/MaterialIssueReceipt": {
            parameters: {workEffortId: ids.releasedRunId},
            text: "Coated filters"
        },
        "Planning/InventoryAvailability": {parameters: stockProduct, text: "Coated filter"},
        "Planning/InventoryAvailability/Projection": {parameters: stockProduct, text: "Coated filter"}
    })
    mounts.push(
        ["WorkOrders/WorkOrderDetail/MaterialIssueReceipt", shared + "MaterialIssueReceipt.xml"],
        ["Planning/InventoryAvailability", shared + "InventoryAvailability.xml"],
        ["Planning/InventoryAvailability/Projection", shared + "InventoryAvailability/Projection.xml"]
    )
    return {routes, mounts}
}

// P13: a made product of Retail's with a component bought from a supplier, its BOM (three of the component, two lead days)
// drafted by the method engineer and released by the approver, and a sales order of four at Retail's plant due in a week:
// the demand of ManufacturingPlanning and of the planning walk (ManufacturingPlanningFixtures), each with its own ids.
const B = "mantle.product.BomServices."
function planningFixture(fixture) {
    const organizationPartyId = fixture.organizationPartyId || "ORG_ZIZI_RETAIL"
    system(() => {
        for (const [productId, productName] of [
            [fixture.finId, fixture.finName],
            [fixture.componentId, fixture.componentName]
        ])
            invoke("store#mantle.product.Product", {
                productId,
                pseudoId: productId,
                productName,
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                amountUomId: "OTH_ea",
                ownerPartyId: organizationPartyId,
                statusId: "PrdActive"
            })
        invoke("store#mantle.product.ProductPrice", {
            productPriceId: fixture.componentId + "_BUY",
            productId: fixture.componentId,
            vendorPartyId: "ZiddlemanInc",
            pricePurposeEnumId: "PppPurchase",
            priceTypeEnumId: "PptCurrent",
            fromDate: 0,
            price: 2,
            priceUomId: "USD"
        })
    })
    const productBomId = asUser(
        users.method,
        () => {
            const created = invoke(B + "store#Bom", {
                productId: fixture.finId,
                organizationPartyId,
                leadTimeDays: 2,
                changeReason: "Planning fixture method"
            })
            const id = created.productBom.productBomId
            invoke(B + "store#BomItem", {productBomId: id, productId: fixture.componentId, quantity: 3, changeReason: "Fixture"})
            return id
        },
        false
    )
    asUser(
        users.methodApprove,
        () => {
            const detail = invoke(B + "get#BomDetail", {productBomId})
            invoke(B + "release#BomDraft", {productBomId, expectedRevision: detail.expectedRevision, changeReason: "Fixture"})
        },
        false
    )
    system(() => {
        invoke("store#mantle.order.OrderHeader", {orderId: fixture.orderId, statusId: "OrderApproved", currencyUomId: "USD"})
        invoke("store#mantle.order.OrderPart", {
            orderId: fixture.orderId,
            orderPartSeqId: "01",
            vendorPartyId: organizationPartyId,
            customerPartyId: "CustJqp",
            facilityId: ids.plantId,
            statusId: "OrderApproved"
        })
        invoke("store#mantle.order.OrderItem", {
            orderId: fixture.orderId,
            orderPartSeqId: "01",
            orderItemSeqId: "01",
            productId: fixture.finId,
            quantity: 4,
            unitAmount: 20,
            requiredByDate: new Date(Date.now() + 7 * 86400000)
        })
    })
    return productBomId
}

;({ids, users, asUser, system, refusal, invoke, page, routeFixtures, planningFixture})
