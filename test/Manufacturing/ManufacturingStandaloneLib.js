// The Manufacturing standalone walks' organization and flow (impl-manufacturing P17; design-manufacturing §10.3 "Unauthorized
// action and standalone app", crosscut §6), shared by the acceptance ManufacturingAccessWalk: BOSS_P17_ORG,
// an organization with its own plant, line, made product, component, released routing and BOM and a sales demand, and its
// Manufacturing users of one capability each (spec users in the Manufacturing root group and one capability group, agents of
// the organization, no other launcher; the material handler holds Warehouse's issue group without the Warehouse root); plan to
// finished stock by those users through the Manufacturing screens and shared mounts; and the routes that show its records.
// Its records carry "P17 secret" in a text the screens show.
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, asUser} = lib
const P = "mantle.work.ProductionServices.",
    B = "mantle.product.BomServices.",
    R = "mantle.work.RoutingServices."
const ORG = "BOSS_P17_ORG",
    PLANT = "BOSS_P17_PLANT",
    LINE = "BOSS_P17_LINE",
    PART = "BOSS_P17_PART"
// each setup's own made product, method and sales demand (the walks' database outlives a run, and a completed run's stock
// nets the next plan): set by setup
const at = {product: null, order: null}
const SECRET = /P17 secret/
// Retail's demo Manufacturing records by the names its screens show (BossManufacturingDemoData.xml, BossWarehouseDemoData.xml);
// not their ids, which a refusal names back
const RETAIL =
    /Ziziwork Retail|Assembly line A|Assembly line B|Demo assemblies|Coated filters|Welded frames|Line A pilot assembly|Line A assembly/
// an odd component cost: no screen shows it, or the issue's value (3 × 7.31), without financial read
const COST = "7.31",
    ISSUED_VALUE = "21.93"
const since = "2000-01-01T00:00:00Z"
// the organization's users: one capability group each, beside the Manufacturing root group
const p17Users = {
    "p17.read": ["BOSS_MANUFACTURING_READ"],
    "p17.plan": ["BOSS_MANUFACTURING_PLAN"],
    "p17.schedule": ["BOSS_MANUFACTURING_SCHEDULE"],
    "p17.method": ["BOSS_MANUFACTURING_METHOD"],
    "p17.methodapprove": ["BOSS_MANUFACTURING_METHOD_APPROVE"],
    "p17.supervise": ["BOSS_MANUFACTURING_SUPERVISE"],
    "p17.operate": ["BOSS_MANUFACTURING_OPERATE"],
    "p17.cost": ["BOSS_MANUFACTURING_COST"],
    // STOCK_ISSUE from Warehouse's issue group, without the Warehouse root (no Warehouse launcher)
    "p17.material": ["BOSS_MANUFACTURING_OPERATE", "BOSS_WAREHOUSE_ISSUE"]
}
// Retail's demo Manufacturing users with no other launcher (BossUsersDemoData.xml), and those of the route sweeps
const retailUsers = [
    "manufacturing.read",
    "manufacturing.plan",
    "manufacturing.schedule",
    "manufacturing.method",
    "manufacturing.methodapprove",
    "manufacturing.operate",
    "manufacturing.supervise",
    "manufacturing.inspect",
    "manufacturing.verify",
    "manufacturing.qualityadmin",
    "manufacturing.cost",
    "manufacturing.resource"
]
const sweepUsers = ["manufacturing.read", "manufacturing.plan", "manufacturing.operate", "manufacturing.supervise"]
const otherRoots = ["Products", "Accounting", "Sales", "Purchasing", "Warehouse", "CustomerService", "Projects", "Admin"]
// operation keys of this evaluation of the library: each spec that runs the flow posts its own operations
const keyPrefix = "p17-" + ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
let keySeq = 0
const key = () => keyPrefix + "-" + ++keySeq

const find = (entity, conditions = {}) => ec.entity.find(entity).condition(conditions).disableAuthz()
const one = (entity, conditions) => find(entity, conditions).one()
const rows = (entity, conditions) => Array.from(find(entity, conditions).list())
function store(entity, fields) {
    ec.service
        .sync()
        .name("store#" + entity)
        .parameters(fields)
        .disableAuthz()
        .call()
}
function call(service, parameters) {
    return ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}
}
// a Mantle verb as the user calls it from a screen (authorization off: the service checks the permission), in its own
// transaction: its result with the error text, "" when it succeeds
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
// a Manufacturing screen as the shell fetches it, as the user, with authz enabled
const page = (username, path, parameters = {}, mode = "html") => asUser(username, () => lib.page(path, parameters, mode))
// a screen transition as the client posts it, as the user with authz enabled: its errors (and a JSON answer's refusal), ""
// when none
function post(username, path, parameters) {
    return asUser(username, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Manufacturing.xml")
            .render(path, parameters, "post")
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        // a transition that answers JSON (the station's) names its refusal in the answer
        let answer = null
        try {
            answer = output.startsWith("{") ? JSON.parse(output) : null
        } catch (error) {
            answer = null
        }
        if (answer && answer.failed)
            failed.push(
                Array.from(answer.messageInfos || [])
                    .map(info => info.message)
                    .join(" ")
            )
        const errors = Array.from(result.errorMessages || [])
            .concat(failed)
            .join(" | ")
        ec.message.clearErrors()
        return errors
    })
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
    return {
        status: result.status,
        output: String(result.output || ""),
        errors: Array.from(result.errorMessages || []).join(" | ")
    }
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
// refused for want of the permission, or for the organization or record (before the permission is asked)
const refusedFor = message =>
    /PERMISSION_DENIED|ACCESS_DENIED|authority is required|is not authorized|FORBIDDEN|RECORD_UNAVAILABLE|not available/.test(
        message
    )
// what a list of renders shows that it may not, as problem lines
function leaks(username, renders, pattern) {
    return renders.filter(([, got]) => pattern.test(got.output)).map(([name]) => `${username} sees ${name}`)
}
function user(username, groups, root = "BOSS_MANUFACTURING") {
    const partyId = "BOSS_" + username.replace(".", "_").toUpperCase()
    store("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    store("mantle.party.Person", {partyId, firstName: "P17", lastName: username})
    store("moqui.security.UserAccount", {
        userId: partyId,
        username,
        partyId,
        userFullName: username,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA"
    })
    for (const userGroupId of (root ? [root] : []).concat(groups))
        store("moqui.security.UserGroupMember", {userId: partyId, userGroupId, fromDate: since})
    store("mantle.party.PartyRelationship", {
        partyRelationshipId: partyId + "_ORG",
        fromPartyId: partyId,
        toPartyId: ORG,
        relationshipTypeEnumId: "PrtAgent",
        toRoleTypeId: "OrgInternal",
        fromDate: since
    })
}
const runOf = workEffortId => one("mantle.work.effort.WorkEffort", {workEffortId})
const revisionOf = workEffortId => Number(runOf(workEffortId)?.productionRevision || 0)

// The organization, its plant and line, products, users, more of the component's stock and a sales demand of a new made
// product; then that product's method: a
// routing of one operation on the line drafted by the method engineer, a BOM of one part a unit on it, both released by the
// approver. Answers the method's ids.
function setup() {
    const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS") + "_" + ++keySeq
    at.product = "BOSS_P17_WIDGET_" + stamp
    at.order = "BOSS_P17_SO_" + stamp
    ec.artifactExecution.disableAuthz()
    for (const [partyId, name, role] of [[ORG, "P17 secret Standalone Fabrication", "OrgInternal"]]) {
        store("mantle.party.Party", {partyId, partyTypeEnumId: "PtyOrganization"})
        store("mantle.party.Organization", {partyId, organizationName: name})
        store("mantle.party.PartyRole", {partyId, roleTypeId: role})
    }
    if (!one("mantle.ledger.config.PartyAcctgPreference", {organizationPartyId: ORG}))
        call("mantle.ledger.LedgerServices.init#PartyAccountingConfiguration", {
            organizationPartyId: ORG,
            sourcePartyId: "DefaultSettings",
            baseCurrencyUomId: "USD"
        })
    call("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {
        organizationPartyId: ORG,
        filterDate: ec.user.nowTimestamp
    })
    for (const [username, groups] of Object.entries(p17Users)) user(username, groups)
    // the plant's counter and count reviewer: Warehouse's count groups, no Manufacturing (design §10.3's count while
    // production issues and receives)
    user("p17.counter", ["BOSS_WAREHOUSE_COUNT", "BOSS_WAREHOUSE_COUNT_REVIEWER"], null)
    store("mantle.facility.Facility", {
        facilityId: PLANT,
        facilityTypeEnumId: "FcTpWarehouse",
        ownerPartyId: ORG,
        facilityName: "P17 secret plant"
    })
    store("mantle.facility.FacilityLocation", {
        facilityId: PLANT,
        locationSeqId: "PICK1",
        locationTypeEnumId: "FltPick",
        description: "P17 secret PICK1"
    })
    store("mantle.facility.Facility", {
        facilityId: LINE,
        facilityTypeEnumId: "FcTpLine",
        parentFacilityId: PLANT,
        ownerPartyId: ORG,
        facilityName: "P17 secret line"
    })
    store("mantle.work.production.WorkCenter", {
        facilityId: LINE,
        plantFacilityId: PLANT,
        efficiencyPercent: 100,
        changeReason: "P17 walk line"
    })
    for (const [productId, productName] of [
        [at.product, "P17 secret widget"],
        [PART, "P17 secret part"]
    ])
        store("mantle.product.Product", {
            productId,
            pseudoId: productId,
            productName,
            productTypeEnumId: "PtAsset",
            assetTypeEnumId: "AstTpInventory",
            amountUomId: "OTH_ea",
            ownerPartyId: ORG,
            statusId: "PrdActive"
        })
    // the component's stock at the plant, at the odd cost
    call("mantle.product.AssetServices.receive#Asset", {
        productId: PART,
        quantity: 20,
        facilityId: PLANT,
        locationSeqId: "PICK1",
        ownerPartyId: ORG,
        assetTypeEnumId: "AstTpInventory",
        statusId: "AstAvailable",
        acquireCost: Number(COST)
    })
    // the sales demand: three widgets at the plant due in a week (each run of the flow converts its own suggestion)
    store("mantle.order.OrderHeader", {orderId: at.order, statusId: "OrderApproved", currencyUomId: "USD"})
    store("mantle.order.OrderPart", {
        orderId: at.order,
        orderPartSeqId: "01",
        vendorPartyId: ORG,
        customerPartyId: "CustJqp",
        facilityId: PLANT,
        statusId: "OrderApproved"
    })
    store("mantle.order.OrderItem", {
        orderId: at.order,
        orderPartSeqId: "01",
        orderItemSeqId: "01",
        productId: at.product,
        quantity: 3,
        unitAmount: 20,
        requiredByDate: new Date(Date.now() + 7 * 86400000)
    })
    ec.artifactExecution.enableAuthz()
    // the method, drafted by the method engineer and released by the approver
    const method = run("p17.method", R + "store#Routing", {
        organizationPartyId: ORG,
        workEffortName: "P17 secret routing",
        changeReason: "P17 walk"
    })
    const routingId = method.routing?.workEffortId
    run("p17.method", R + "store#RoutingOperation", {
        workEffortId: routingId,
        workEffortName: "P17 secret assemble",
        sequenceNum: 10,
        estimatedWorkTime: 6,
        timeUomId: "TF_min",
        methodBatchQuantity: 1,
        methodQuantityUomId: "OTH_ea",
        methodWorkCenterId: LINE,
        changeReason: "P17 walk operation"
    })
    const operationId = rows("mantle.work.effort.WorkEffort", {parentWorkEffortId: routingId})[0]?.workEffortId
    const routing = run("p17.method", R + "get#RoutingDetail", {workEffortId: routingId})
    const routingReleased = run("p17.methodapprove", R + "release#RoutingDraft", {
        workEffortId: routingId,
        expectedRevision: routing.expectedRevision,
        changeReason: "P17 walk"
    }).error
    const bom = run("p17.method", B + "store#Bom", {
        productId: at.product,
        organizationPartyId: ORG,
        routingWorkEffortId: routingId,
        leadTimeDays: 1,
        changeReason: "P17 walk method"
    })
    const productBomId = bom.productBom?.productBomId
    run("p17.method", B + "store#BomItem", {
        productBomId,
        productId: PART,
        quantity: 1,
        operationWorkEffortId: operationId,
        changeReason: "P17 walk line"
    })
    const detail = run("p17.methodapprove", B + "get#BomDetail", {productBomId})
    const bomReleased = run("p17.methodapprove", B + "release#BomDraft", {
        productBomId,
        expectedRevision: detail.expectedRevision,
        changeReason: "P17 walk release"
    }).error
    if (routingReleased || bomReleased || !productBomId)
        ec.logger.warn(`P17 method: routing ${routingId} ${routingReleased}; BOM ${productBomId} ${bomReleased} ${bom.error}`)
    return {productBomId, routingId}
}

// Plan to finished stock by the organization's users through the Manufacturing screens: the planner recalculates the plant's
// supply plan (Planning/SupplyPlanning, the shared plan) and converts the make suggestion to a draft work order; releases it
// (WorkOrderDetail's lifecycle); the supervisor starts it; the operator, without STOCK_ISSUE, is refused the component's issue
// on the Materials tab (Shared/MaterialIssueReceipt) that the material handler then posts, while a blind count of that stock
// is open (its review finds the issue as a conflict); the operator starts the operation
// on the shop floor (OperationExecution), and completing it with two good, which receives them, is refused to the operator
// and done by the material handler (an operator with STOCK_ISSUE); the material handler receives
// the third on the Materials tab; the supervisor completes the work order (Quantities). Answers the records (p17) and each
// step's error text or render.
function planToStock() {
    const steps = {}
    const p17 = {}
    const plant = {plantId: PLANT}
    steps.runPlan = post("p17.plan", "Planning/SupplyPlanning/runPlan", {plantId: PLANT, productId: at.product})
    steps.planPage = page("p17.plan", "Planning/SupplyPlanning", plant)
    const plan = run("p17.plan", "mantle.product.SupplyPlanningServices.get#SupplyPlan", {facilityIds: [PLANT]})
    const make = Array.from(plan.suggestions || []).find(row => row.productId === at.product && row.canConvert)
    p17.suggestionId = make?.planningSuggestionId
    steps.convert = post("p17.plan", "Planning/SupplyPlanning/convertSuggestions", {
        plantId: PLANT,
        planningSuggestionIdList: [p17.suggestionId],
        operationKey: key()
    })
    const supply = p17.suggestionId
        ? rows("mantle.request.requirement.RequirementSupply", {requirementId: make.requirementId})
        : []
    p17.runId = supply
        .map(row => row.workEffortId)
        .filter(Boolean)
        .pop()
    const detail = "WorkOrders/WorkOrderDetail"
    const lifecycle = (username, action) =>
        post(username, detail + "/lifecycleAction", {
            workEffortId: p17.runId,
            lifecycleAction: action,
            expectedRevision: revisionOf(p17.runId),
            operationKey: key()
        })
    steps.release = lifecycle("p17.plan", "release")
    steps.start = lifecycle("p17.supervise", "start")
    p17.operationId = rows("mantle.work.effort.WorkEffort", {parentWorkEffortId: p17.runId || "_NA_"})[0]?.workEffortId
    const lines = rows("mantle.work.production.ProductionRunLine", {workEffortId: p17.runId || "_NA_"})
    const material = lines.find(line => line.lineRoleEnumId === "PrlrMaterial")
    const output = lines.find(line => line.lineRoleEnumId === "PrlrOutput")
    p17.assetId = rows("mantle.product.asset.Asset", {productId: PART, facilityId: PLANT}).find(
        asset => Number(String(asset.availableToPromiseTotal)) >= 3
    )?.assetId
    const materials = detail + "/MaterialIssueReceipt"
    steps.materialsPage = page("p17.material", materials, {workEffortId: p17.runId, lastStandalone: "true"})
    const issue = username =>
        post(username, materials + "/materialAction", {
            workEffortId: p17.runId,
            sourceId: p17.runId,
            lineKey: material?.productionRunLineId,
            assetId: p17.assetId,
            quantity: 3,
            operationKey: key()
        })
    // a blind count of the component's stock, started before the issue
    const C = "mantle.product.InventoryCountServices."
    const counted = run("p17.counter", C + "create#Count", {
        facilityId: PLANT,
        assetIds: [p17.assetId],
        countModeEnumId: "CntModeSpot",
        blindIndicator: "Y"
    })
    p17.countId = counted.physicalInventoryId
    steps.countStart = run("p17.counter", C + "start#Count", {physicalInventoryId: p17.countId}).error
    const countLine = one("mantle.product.asset.PhysicalInventoryCount", {
        physicalInventoryId: p17.countId || "_NA_",
        assetId: p17.assetId
    })
    steps.issueRefused = issue("p17.operate")
    steps.issue = issue("p17.material")
    // the counter counts what was there before the issue; the review finds the issue as a movement during the count, a
    // conflict, and posts nothing (production does not go around the count)
    steps.countLine = run("p17.counter", C + "record#CountLine", {
        physicalInventoryId: p17.countId,
        physicalInventoryCountId: countLine?.physicalInventoryCountId,
        quantity: Number(String(countLine?.snapshotQuantity || 0))
    }).error
    steps.countSubmit = run("p17.counter", C + "submit#Count", {physicalInventoryId: p17.countId}).error
    const reviewed = run("p17.counter", C + "review#Count", {physicalInventoryId: p17.countId})
    steps.countReview = reviewed.error
    steps.countConflicts = reviewed.conflictCount
    const countView = run("p17.counter", C + "get#Count", {physicalInventoryId: p17.countId})
    steps.countMovements = Array.from(countView.lines || []).reduce((sum, row) => sum + Array.from(row.movements || []).length, 0)
    // the shop floor: the operator starts the operation; completing it receives the output, which the operator without
    // STOCK_ISSUE is refused and the material handler (an operator with it) does with two good
    steps.executionPage = page("p17.operate", "ShopFloor/OperationExecution", {operationWorkEffortId: p17.operationId})
    steps.startOperation = post("p17.operate", "ShopFloor/OperationExecution/startOperation", {
        operationWorkEffortId: p17.operationId,
        operationKey: key()
    })
    const completion = username =>
        post(username, "ShopFloor/OperationExecution/completeOperation", {
            operationWorkEffortId: p17.operationId,
            productionRunLineId: output?.productionRunLineId,
            good: 2,
            stopTimer: "true",
            operationKey: key()
        })
    steps.completeRefused = completion("p17.operate")
    steps.completeOperation = completion("p17.material")
    // the third through the Materials tab's Receive
    steps.receive = post("p17.material", materials + "/materialAction", {
        workEffortId: p17.runId,
        sourceId: p17.runId,
        actionKind: "receive",
        lineKey: output?.productionRunLineId,
        quantity: 1,
        operationKey: key()
    })
    steps.complete = post("p17.supervise", detail + "/Quantities/completeRun", {
        workEffortId: p17.runId,
        expectedRevision: revisionOf(p17.runId),
        operationKey: key()
    })
    const received = rows("mantle.product.receipt.AssetReceipt", {workEffortId: p17.runId || "_NA_"})
    p17.outputAssetId = received[0]?.assetId
    return {
        p17,
        steps,
        run: p17.runId ? runOf(p17.runId) : null,
        issued: rows("mantle.product.issuance.AssetIssuance", {workEffortId: p17.runId || "_NA_"}).reduce(
            (sum, row) => sum + Number(String(row.quantity)),
            0
        ),
        received: received.reduce((sum, row) => sum + Number(String(row.quantityAccepted)), 0)
    }
}

// The organization's records on the Manufacturing routes, the shared mounts and the record panels, each with its own user who
// may open it (a task screen shows its record only to its capability) and the render mode.
function p17Routes(p17, method) {
    const run = {workEffortId: p17.runId}
    const routes = [
        ["Home", {plantId: PLANT}],
        ["WorkOrders/Find", {facilityId: PLANT}],
        ["WorkOrders/WorkOrderDetail", run],
        ["WorkOrders/WorkOrderDetail/Overview", run],
        ["WorkOrders/WorkOrderDetail/Components", run],
        ["WorkOrders/WorkOrderDetail/MaterialIssueReceipt", Object.assign({lastStandalone: "true"}, run)],
        ["WorkOrders/WorkOrderDetail/Operations", run],
        ["WorkOrders/WorkOrderDetail/Quantities", run],
        ["WorkOrders/WorkOrderDetail/ByProducts", run],
        ["WorkOrders/WorkOrderDetail/Quality", run],
        ["WorkOrders/WorkOrderDetail/ProductionCosts", run],
        ["WorkOrders/WorkOrderDetail/Changes", run],
        ["WorkOrders/WorkOrderDetail/Notes", run],
        ["WorkOrders/WorkOrderDetail/Traveler", run],
        ["WorkOrders/WorkOrderDetail/PickSheet", run],
        ["WorkOrders/WorkOrderDetail/OutputLabels", run],
        ["ShopFloor/OperationExecution", {operationWorkEffortId: p17.operationId}, "p17.operate"],
        ["ShopFloor/Instructions", {operationWorkEffortId: p17.operationId}, "p17.operate"],
        ["ShopFloor/InstructionsPrint", {operationWorkEffortId: p17.operationId}, "p17.operate"],
        ["ShopFloor/ProductionTime", run, "p17.supervise"],
        ["BillsOfMaterials/Find", {}],
        ["BillsOfMaterials/BillOfMaterialsDetail", {productBomId: method.productBomId}],
        ["BillsOfMaterials/WhereUsed", {productId: PART}],
        ["BillsOfMaterials/Product360", {productId: at.product}],
        ["Routings/Find", {}],
        ["Routings/RoutingDetail", {workEffortId: method.routingId}],
        ["WorkCenters/Centers", {plantId: PLANT}],
        ["WorkCenters/FacilityDetail", {facilityId: LINE}],
        ["Planning/SupplyPlanning", {plantId: PLANT}, "p17.plan"],
        ["Planning/InventoryAvailability", {productId: PART, facilityId: PLANT}, "p17.plan", "qvt"],
        ["Planning/ProductionScheduleTui", {plantId: PLANT}, "p17.schedule", "tui"],
        ["Planning/ScheduleSnapshot", {plantId: PLANT}, "p17.schedule"],
        ["Planning/Capacity", {plantId: PLANT}, "p17.schedule"],
        ["Reports/WorkOrderStatusReport", {facilityId: PLANT}],
        ["Reports/MaterialReport", {facilityId: PLANT}],
        ["Reports/ProductionCostReport", {facilityId: PLANT}]
    ].map(([path, parameters, owner, mode]) => ({path, parameters, owner: owner || "p17.read", mode: mode || "html"}))
    // the station's board, as its terminal twin's source answers it
    routes.push({path: "ShopFloor/Station/queueRows", parameters: {facilityId: PLANT}, owner: "p17.operate", mode: "json"})
    // the record panels' terminal twins on the organization's run, method and line
    for (const [recordEntity, recordId] of [
        ["mantle.work.effort.WorkEffort", p17.runId],
        ["mantle.product.bom.ProductBom", method.productBomId],
        ["mantle.facility.Facility", LINE]
    ])
        for (const twin of ["RecordFiles/RecordFilesTui", "Chatter/ChatterTui"])
            routes.push({path: twin, parameters: {recordEntity, recordId}, owner: "p17.read", mode: "tui"})
    return routes
}
// the routes whose records must show the organization's to its own user, so a refusal of the other organization is not an
// empty page
const requiredShown = [
    "WorkOrders/WorkOrderDetail",
    "WorkOrders/WorkOrderDetail/MaterialIssueReceipt",
    "WorkOrders/WorkOrderDetail/Components",
    "ShopFloor/OperationExecution",
    "BillsOfMaterials/BillOfMaterialsDetail",
    "Routings/RoutingDetail",
    "WorkCenters/FacilityDetail",
    "Planning/SupplyPlanning",
    "Planning/InventoryAvailability",
    "BillsOfMaterials/Product360",
    "Reports/WorkOrderStatusReport",
    "ShopFloor/Station/queueRows"
]
const routeName = route => `${route.path} ${JSON.stringify(route.parameters)} (${route.mode})`
// a route as its user's shell renders it (a transition answering JSON is fetched as the client does)
function show(username, route) {
    if (route.mode === "json")
        return asUser(username, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Manufacturing.xml")
                .render(route.path, route.parameters, "get")
            ec.message.clearErrors()
            return {status: result.status, output: String(result.output || ""), errors: Array.from(result.errorMessages || [])}
        })
    return page(username, route.path, route.parameters, route.mode)
}

;({
    ORG,
    PLANT,
    LINE,
    PART,
    at,
    SECRET,
    RETAIL,
    COST,
    ISSUED_VALUE,
    p17Users,
    retailUsers,
    sweepUsers,
    otherRoots,
    P,
    key,
    find,
    one,
    rows,
    call,
    run,
    page,
    post,
    render,
    read,
    refusedFor,
    leaks,
    setup,
    planToStock,
    p17Routes,
    requiredShown,
    routeName,
    show,
    ids,
    asUser
})
