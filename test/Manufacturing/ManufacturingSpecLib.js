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
    services: "manufacturing.services"
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
        // P2: the method lists, the demo method and routing in the shared method screens, a template and Approvals
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
    }
    const shared = "component://mr-boss/screen/Shared/"
    const mounts = [
        // P2: Products' shared method and product screens under BillsOfMaterials and Routings
        ["BillsOfMaterials/BillOfMaterialsDetail", shared + "BillOfMaterialsDetail.xml"],
        ["BillsOfMaterials/WhereUsed", shared + "WhereUsed.xml"],
        ["BillsOfMaterials/Product360", shared + "Product360.xml"],
        ["BillsOfMaterials/CostRollup", shared + "CostRollup.xml"],
        ["Routings/RoutingDetail", shared + "RoutingDetail.xml"]
    ]
    return {routes, mounts}
}

;({ids, users, asUser, system, refusal, invoke, page, routeFixtures})
