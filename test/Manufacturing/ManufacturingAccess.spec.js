// Manufacturing access (impl-manufacturing §2, §4, P1): who may open Manufacturing, the capabilities from the Mantle
// permissions, the organization and plant scope through the organization filters, the record check against another
// organization's and forged ids and against a missing capability, the screens a group guards, one refused write, and the
// paths around the production services the Manufacturing and other groups do not reach: the Mantle REST run paths (F10, F37),
// a run's operations as Commons and Projects tasks (F38) and a run as a Commons event (F39). One feature per rule, each case
// of it a line of its problems, with artifact authorization enabled. The Mantle verbs' own permission checks are Mantle's
// (mr-mantle test/work, test/ledger and test/product); the screens' content is their logic specs'. The access and isolation
// walk over every route is the acceptance ManufacturingAccessWalk.
// Run: ./moq test mr-boss --spec ManufacturingAccess
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const access = "ironstone.manufacturing.AccessServices."
// a refusal of a user without Manufacturing: the service is not authorized for them, or it refuses them
const refused = message => /MANUFACTURING_UNAVAILABLE|is not authorized/.test(message)
// this spec's records (setupSpec): a method and a routing of each organization, and a run of Retail's with an operation that
// a Projects team member is assigned, beside a task of their own
const fixture = {
    productId: "BOSS_MFG_SPEC_PRD",
    methodId: "BOSS_MFG_SPEC_BOM",
    otherMethodId: "BOSS_MFG_SPEC_BOM_SVC",
    routingId: "BOSS_MFG_SPEC_ROUTING",
    otherRoutingId: "BOSS_MFG_SPEC_ROUTING_SVC",
    runId: "BOSS_MFG_SPEC_RUN",
    operationId: "BOSS_MFG_SPEC_OP",
    taskId: "BOSS_MFG_SPEC_TASK",
    assignee: "joe.developer",
    assigneePartyId: "ORG_ZIZI_JD"
}
const store = (entity, fields) =>
    ec.service
        .sync()
        .name("store#" + entity)
        .parameters(fields)
        .call()
const values = result => Array.from(result.options || []).map(row => row.value)
// Run each [user, action] as its user, signing in once for each user, and answer the results in their order.
function asEach(calls) {
    const results = new Array(calls.length)
    for (const user of new Set(calls.map(([user]) => user)))
        asUser(user, () =>
            calls.forEach(([each, action], index) => {
                if (each === user) results[index] = action()
            })
        )
    return results
}

spec({
    setupSpec() {
        system(() => {
            store("mantle.product.Product", {
                productId: fixture.productId,
                productTypeEnumId: "PtAsset",
                assetTypeEnumId: "AstTpInventory",
                productName: "Spec assembly",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
            store("mantle.product.bom.ProductBom", {
                productBomId: fixture.methodId,
                productId: fixture.productId,
                organizationPartyId: "ORG_ZIZI_RETAIL",
                methodCode: "SPEC_P1",
                bomName: "Spec assembly method"
            })
            store("mantle.product.bom.ProductBom", {
                productBomId: fixture.otherMethodId,
                productId: fixture.productId,
                organizationPartyId: "ORG_ZIZI_SERVICES",
                methodCode: "SPEC_P1",
                bomName: "Services spec method"
            })
            for (const [workEffortId, ownerPartyId] of [
                [fixture.routingId, "ORG_ZIZI_RETAIL"],
                [fixture.otherRoutingId, "ORG_ZIZI_SERVICES"]
            ])
                store("mantle.work.effort.WorkEffort", {
                    workEffortId,
                    workEffortTypeEnumId: "WetTask",
                    purposeEnumId: "WepRouting",
                    statusId: "WeInPlanning",
                    workEffortName: "Spec routing",
                    ownerPartyId
                })
            store("mantle.work.effort.WorkEffort", {
                workEffortId: fixture.runId,
                workEffortTypeEnumId: "WetEvent",
                purposeEnumId: "WepProductionRun",
                statusId: "WeApproved",
                facilityId: ids.lineId,
                workEffortName: "Spec run",
                ownerPartyId: "ORG_ZIZI_RETAIL"
            })
            store("mantle.work.effort.WorkEffort", {
                workEffortId: fixture.operationId,
                workEffortTypeEnumId: "WetTask",
                parentWorkEffortId: fixture.runId,
                rootWorkEffortId: fixture.runId,
                statusId: "WeApproved",
                workEffortName: "Spec assembly step",
                ownerPartyId: "ORG_ZIZI_RETAIL",
                actualCost: 12,
                estimatedCompletionDate: ec.user.nowTimestamp
            })
            store("mantle.work.effort.WorkEffort", {
                workEffortId: fixture.taskId,
                workEffortTypeEnumId: "WetTask",
                statusId: "WeInPlanning",
                workEffortName: "Spec own task",
                ownerPartyId: fixture.assigneePartyId
            })
            for (const [workEffortId, roleTypeId] of [
                [fixture.operationId, "Assignee"],
                [fixture.runId, "Manager"]
            ])
                store("mantle.work.effort.WorkEffortParty", {
                    workEffortId,
                    partyId: fixture.assigneePartyId,
                    roleTypeId,
                    fromDate: ec.user.nowTimestamp,
                    statusId: "WeptAssigned"
                })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// A screen render's refusal as the user, nothing of its content (the refusals of screens other specs render): "" when it opens,
// else its status and errors, which for a refusal name the authorization
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => lib.page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
const unauthorized = message => /^40[13] |is not authorized/.test(message)

feature("a Manufacturing user gets the context; a user without the root group is refused it, the app and its shared screens", {
    when() {
        const problems = []
        const context = user => asUser(user, () => refusal(access + "get#SharedContext", {}))
        for (const user of [users.read, users.admin, users.services]) {
            const message = context(user)
            if (message !== "") problems.push(`${user} is refused the context: ${message}`)
        }
        // the plant display holds no root group; Products' method engineer holds a Manufacturing capability group but not the
        // root group
        for (const user of [users.display, "finance.read", "warehouse.read", "catalog.method"]) {
            const message = context(user)
            if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
        }
        const otherRoot = asUser(users.read, () => refusal(access + "get#SharedContext", {appRoot: "Warehouse"}))
        if (!otherRoot.includes("MANUFACTURING_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
        // the app itself
        const home = screenRefusal("warehouse.read", "Home")
        if (!unauthorized(home)) problems.push(`warehouse.read opens Home: ${home || "opened"}`)
        // Products' shared screens give a Manufacturing context only to Manufacturing users (as the screens call it)
        const shared = user =>
            asUser(user, () => refusal("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Manufacturing"}), false)
        const readerShared = shared(users.read)
        if (readerShared !== "") problems.push(`the reader is refused the shared screens' context: ${readerShared}`)
        for (const user of ["warehouse.read", "catalog.method"])
            if (shared(user) === "") problems.push(`${user} gets the shared screens' Manufacturing context`)
        // the record links: a method opens under Manufacturing for its users only
        const link = user =>
            String(
                asUser(user, () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                        recordEntityName: "mantle.product.bom.ProductBom",
                        id: ids.methodId
                    })
                ).url || ""
            )
        const methodLink = link(users.method)
        if (methodLink !== "/qapps/Manufacturing/BillsOfMaterials/BillOfMaterialsDetail?productBomId=" + ids.methodId)
            problems.push(`the method engineer's link is ${methodLink}`)
        const productsLink = link("catalog.method")
        if (productsLink.includes("/Manufacturing/")) problems.push(`catalog.method's link is ${productsLink}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const productionCapabilities = [
    "productionRead",
    "plan",
    "schedule",
    "operate",
    "supervise",
    "costReview",
    "policyEdit",
    "supplyPlan",
    "methodRead",
    "methodEdit",
    "methodApprove",
    "methodResources",
    "costRead",
    "inspect",
    "qualityVerify",
    "qualityDispose",
    "qualityTemplateEdit"
]
const read = ["productionRead", "methodRead"]
const capabilityUsers = [
    {user: users.read, granted: read},
    {user: users.plan, granted: ["productionRead", "plan", "supplyPlan", "methodRead"]},
    {user: users.schedule, granted: ["productionRead", "schedule", "methodRead"]},
    {user: users.method, granted: ["productionRead", "methodRead", "methodEdit"]},
    {user: users.methodApprove, granted: ["productionRead", "methodRead", "methodApprove"]},
    {user: users.operate, granted: ["productionRead", "operate", "methodRead"]},
    {user: users.supervise, granted: ["productionRead", "supervise", "methodRead"]},
    {user: users.inspect, granted: ["productionRead", "methodRead", "inspect"]},
    {user: users.verify, granted: ["productionRead", "methodRead", "qualityVerify", "qualityDispose"]},
    {user: users.qualityAdmin, granted: ["productionRead", "methodRead", "qualityTemplateEdit"]},
    {user: users.cost, granted: ["productionRead", "costReview", "methodRead", "costRead"]},
    {user: users.resource, granted: ["productionRead", "policyEdit", "methodRead", "methodResources"]},
    {user: users.services, granted: read}
]
feature("each group holds exactly the capabilities of its permissions, the administrator every one in every plant", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(access + "get#SharedContext", {}).capabilities)
            const held = productionCapabilities.filter(name => capabilities[name])
            if (JSON.stringify(held) !== JSON.stringify(granted)) problems.push(`${user} holds ${held}, not ${granted}`)
            if (capabilities.read !== true) problems.push(`${user} does not read`)
            if (capabilities.financialRead !== false || capabilities.issue !== false)
                problems.push(`${user} holds financial read or issue`)
        }
        const admin = asUser(users.admin, () => ({
            context: invoke(access + "get#SharedContext", {}),
            other: refusal(access + "check#Record", {recordType: "run", recordId: ids.otherRunId}),
            plants: values(invoke(access + "get#Choices", {choice: "plants"}))
        }))
        const missing = productionCapabilities.filter(name => !admin.context.capabilities[name])
        if (missing.length) problems.push(`the administrator lacks ${missing}`)
        if (admin.context.allPlants !== true) problems.push("the administrator is not in every plant")
        if (admin.other !== "") problems.push(`the administrator is refused the other organization's run: ${admin.other}`)
        if (!admin.plants.includes(ids.plantId) || !admin.plants.includes(ids.otherPlantId))
            problems.push(`the administrator's plants: ${admin.plants}`)
        // the plant display holds no production permission
        const display = asUser(users.display, () => [
            ec.user.hasPermission("PRODUCTION_VIEW"),
            ec.user.hasPermission("METHOD_VIEW")
        ])
        if (display.some(held => held)) problems.push(`the plant display holds a production permission: ${display}`)
        // the Manufacturing context of Products' shared method screens: the tabs and capabilities by group
        for (const {user, costs, edit} of [
            {user: users.read, costs: false, edit: false},
            {user: users.method, costs: false, edit: true},
            {user: users.cost, costs: true, edit: false}
        ]) {
            const shared = asUser(
                user,
                () => invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Manufacturing"}),
                false
            )
            const tabs = Array.from(shared.productTabs || [])
            if (!tabs.includes("BOM") || tabs.includes("Costs") !== costs) problems.push(`${user}'s shared tabs: ${tabs}`)
            if (shared.capabilities.methodEdit !== edit || shared.capabilities.catalogEdit || shared.capabilities.priceRead)
                problems.push(`${user}'s shared capabilities: ${JSON.stringify(shared.capabilities)}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a user's plants, work centers and drop-downs are their organization's, and the plant preference never widens them", {
    when() {
        const problems = []
        const choices = (user, choice, extra = {}) =>
            asUser(user, () => values(invoke(access + "get#Choices", Object.assign({choice}, extra))))
        const context = asUser(users.read, () => invoke(access + "get#SharedContext", {}))
        // Retail's only plant is selected without a preference
        if (context.allPlants !== false || context.plantId !== ids.plantId || context.plantCount !== 1)
            problems.push(`the reader's plant context: ${context.allPlants} ${context.plantId} ${context.plantCount}`)
        const plants = choices(users.read, "plants", {term: ""})
        if (JSON.stringify(plants) !== JSON.stringify([ids.plantId])) problems.push(`the reader's plants: ${plants}`)
        const centers = choices(users.read, "workCenters", {plantId: ids.plantId})
        if (!centers.includes(ids.lineId) || !centers.includes(ids.lineBId)) problems.push(`the reader's centers: ${centers}`)
        const unknown = asUser(users.read, () => refusal(access + "get#Choices", {choice: "everything"}))
        if (!unknown.includes("Unknown Manufacturing choice")) problems.push(`an unknown choice: ${unknown || "accepted"}`)
        // each drop-down answers a value of Retail's to Retail's user, and not to the other organization's on the same request
        const offered = [
            [users.read, "plants", {selected: ids.plantId}, ids.plantId],
            [users.read, "workCenters", {selected: ids.lineId}, ids.lineId],
            [users.resource, "calendars", {selected: ids.lineCalendarId}, ids.lineCalendarId],
            [users.plan, "madeProducts", {term: "zzz-none", selected: ids.productId}, ids.productId],
            [users.plan, "releasedBoms", {productId: ids.productId}, ids.methodId],
            [users.plan, "runFacilities", {}, ids.lineId],
            [users.plan, "materialProducts", {term: "zzz-none", selected: "BOSS_WH_COATED"}, "BOSS_WH_COATED"],
            [users.plan, "stockFacilities", {term: "zzz-none", selected: ids.plantId}, ids.plantId],
            [users.operate, "downtimeReasons", {facilityId: ids.lineId}, "ROBOT_FAULT"],
            [users.operate, "equipment", {facilityId: ids.lineId}, ids.equipmentId],
            [users.read, "workOrders", {term: "no such work order", selected: ids.runId}, ids.runId]
        ]
        const choice = (choice, extra) => () => values(invoke(access + "get#Choices", Object.assign({choice}, extra)))
        const answers = asEach(
            offered.flatMap(([user, name, extra]) => [
                [user, choice(name, extra)],
                [users.services, choice(name, extra)]
            ])
        )
        offered.forEach(([user, name, , value], index) => {
            if (!answers[2 * index].includes(value)) problems.push(`${user} is not offered ${name} ${value}`)
            if (answers[2 * index + 1].includes(value)) problems.push(`the other organization is offered ${name} ${value}`)
        })
        // the plant preference: the other organization's user selects its own plant, and Retail's is refused, given or stale
        asUser(users.services, () => {
            const own = refusal(access + "select#Plant", {plantId: ids.otherPlantId})
            const forged = refusal(access + "select#Plant", {plantId: ids.plantId})
            const kept = invoke(access + "get#SharedContext", {}).plantId
            const given = refusal(access + "get#SharedContext", {plantId: ids.plantId})
            // a preference set outside the service (a stale or forged one) is ignored where it is read
            ec.user.setPreference("ManufacturingPlantActive", ids.plantId)
            const stale = invoke(access + "get#SharedContext", {}).plantId
            invoke(access + "select#Plant", {})
            if (own !== "") problems.push(`the own plant is refused: ${own}`)
            if (!forged.includes("PLANT_UNAVAILABLE")) problems.push(`Retail's plant is selected: ${forged || "accepted"}`)
            if (!given.includes("PLANT_UNAVAILABLE")) problems.push(`Retail's plant is given: ${given || "accepted"}`)
            if (kept !== ids.otherPlantId || stale !== ids.otherPlantId) problems.push(`the plant kept: ${kept}, stale: ${stale}`)
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// each record type: a record of Retail's and one it does not reach (another organization's, or a record of another type)
const records = [
    {recordType: "run", own: ids.runId, other: ids.otherRunId},
    {recordType: "run", own: ids.releasedRunId, other: ids.operationId},
    {recordType: "operation", own: ids.operationId, other: ids.runId},
    {recordType: "method", own: fixture.methodId, other: fixture.otherMethodId},
    {recordType: "routing", own: fixture.routingId, other: fixture.otherRoutingId},
    {recordType: "workCenter", own: ids.lineId, other: ids.otherLineId},
    {recordType: "workCenter", own: ids.lineBId, other: ids.plantId},
    {recordType: "asset", own: ids.equipmentId, other: "BOSS_PRD_STOCK"},
    {recordType: "facility", own: ids.plantId, other: ids.otherPlantId},
    {recordType: "facility", own: ids.lineId, other: ids.otherFacilityId},
    // a receipt inspection is Warehouse's, not a Manufacturing record
    {recordType: "inspection", own: ids.inspectionId, other: "BOSS_WH_INSP"},
    {recordType: "downtime", own: ids.downtimeId, other: "BOSS_MFG_FORGED"}
]
feature("another organization's or a forged record is refused like a missing one, by the record check and the reads", {
    when() {
        const problems = []
        const check = (recordType, recordId) => refusal(access + "check#Record", {recordType, recordId})
        asUser(users.read, () => {
            for (const {recordType, own, other} of records) {
                const ownMessage = check(recordType, own)
                if (ownMessage !== "") problems.push(`the reader is refused its ${recordType} ${own}: ${ownMessage}`)
                for (const recordId of [other, "BOSS_MFG_FORGED"]) {
                    const message = check(recordType, recordId)
                    if (!message.includes("RECORD_UNAVAILABLE"))
                        problems.push(`the reader reaches ${recordType} ${recordId}: ${message}`)
                }
            }
        })
        asUser(users.services, () => {
            // the other organization's reader on the same records of Retail's
            for (const {recordType, own} of records) {
                const message = check(recordType, own)
                if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`services reaches ${recordType} ${own}: ${message}`)
            }
            const servicesOwn = check("run", ids.otherRunId)
            if (servicesOwn !== "") problems.push(`services is refused its own run: ${servicesOwn}`)
            const unknown = check("everything", ids.runId)
            if (!unknown.includes("RECORD_UNAVAILABLE")) problems.push(`an unknown record type: ${unknown}`)
        })
        // the Manufacturing reads on the same parameters for each side
        const workCenters = "ironstone.manufacturing.WorkCenterServices."
        const reads = user =>
            asUser(user, () => ({
                facility: refusal(workCenters + "get#FacilityDetail", {facilityId: ids.lineId}),
                equipment: refusal(workCenters + "get#Equipment", {assetId: ids.equipmentId}),
                list: invoke(workCenters + "find#Equipment", {}).equipmentList.map(row => row.assetId),
                forged: refusal(workCenters + "find#Equipment", {facilityId: ids.otherLineId}),
                calendar: invoke(workCenters + "get#ResourceCalendarEvents", {start: "2026-11-23", end: "2026-11-30"})
                    .eventList.map(row => row.title)
                    .some(title => title.includes("Assembly line A")),
                search: invoke(access + "search#Records", {text: "pilot", limit: 10}).rows.some(row =>
                    String(row.url).includes(ids.methodId)
                ),
                boms: asUser(
                    user,
                    () =>
                        invoke("ironstone.manufacturing.MethodServices.get#BomList", {
                            organizationPartyId: "ORG_ZIZI_RETAIL"
                        }).bomRows.some(row => row.productBomId === ids.methodId),
                    false
                )
            }))
        const retail = reads(users.method)
        const other = reads(users.services)
        if (retail.facility !== "" || retail.equipment !== "")
            problems.push(`Retail's reads refused: ${retail.facility} ${retail.equipment}`)
        if (!other.facility.includes("RECORD_UNAVAILABLE")) problems.push(`services reads line A: ${other.facility}`)
        if (!other.equipment.includes("RECORD_UNAVAILABLE")) problems.push(`services reads the equipment: ${other.equipment}`)
        if (!retail.forged.includes("RECORD_UNAVAILABLE"))
            problems.push(`Retail lists the other line's equipment: ${retail.forged}`)
        for (const name of ["calendar", "search", "boms"]) {
            if (!retail[name]) problems.push(`Retail's user does not see its ${name}`)
            if (other[name]) problems.push(`the other organization sees Retail's ${name}`)
        }
        if (!retail.list.includes(ids.equipmentId) || other.list.includes(ids.equipmentId))
            problems.push(`the equipment lists: ${retail.list} / ${other.list}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a capability on a record is refused for a user without its permission and passes for one with it, on the same record", {
    when() {
        const problems = []
        const check = (user, recordType, recordId, capability) =>
            asUser(user, () => refusal(access + "check#Record", {recordType, recordId, capability}))
        const cases = [
            ["plan", "run", ids.runId, users.plan, users.read],
            ["costReview", "run", ids.runId, users.cost, users.read],
            ["operate", "run", ids.releasedRunId, users.operate, users.read],
            ["issue", "run", ids.releasedRunId, users.material, users.operate],
            ["supplyPlan", "facility", ids.plantId, users.plan, users.schedule],
            ["schedule", "operation", ids.operationId, users.schedule, users.plan],
            ["buy", "operation", ids.operationId, users.buyer, users.plan],
            ["supervise", "downtime", ids.downtimeId, users.supervise, users.operate],
            ["inspect", "inspection", ids.inspectionId, users.inspect, users.read]
        ]
        const recordCheck = (recordType, recordId, capability) => () =>
            refusal(access + "check#Record", {recordType, recordId, capability})
        const answers = asEach(
            cases.flatMap(([capability, recordType, recordId, holder, without]) => [
                [holder, recordCheck(recordType, recordId, capability)],
                [without, recordCheck(recordType, recordId, capability)]
            ])
        )
        cases.forEach(([capability, , recordId, holder, without], index) => {
            const held = answers[2 * index]
            if (held !== "") problems.push(`${holder} is refused ${capability} on ${recordId}: ${held}`)
            const refusedMessage = answers[2 * index + 1]
            if (!refusedMessage.includes("PERMISSION_DENIED"))
                problems.push(`${without} is not refused ${capability} on ${recordId}: ${refusedMessage || "accepted"}`)
        })
        const named = check(users.read, "run", ids.runId, "plan")
        if (!named.includes("PRODUCTION_PLAN")) problems.push(`the refusal does not name the permission: ${named}`)
        const unknown = check(users.plan, "run", ids.runId, "everything")
        if (!unknown.includes("Unknown Manufacturing capability"))
            problems.push(`an unknown capability: ${unknown || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the screens a group guards refuse a Manufacturing user without it", {
    when() {
        // each screen's refusal for a Manufacturing user without the screen's group: the refusal names a screen's authorization
        // (the screen, its area or the shared screen it mounts), not a service it calls, so it is the group that refuses
        const refusals = [
            [users.method, "Approvals", {}],
            [users.read, "WorkOrders/NewWorkOrder", {}],
            [users.supervise, "WorkOrders/QuickCreate", {}],
            [users.read, "Settings/ProductionSettings", {}],
            [users.read, "ReportDowntime", {}],
            [users.operate, "Quality/Inspections", {}],
            [users.operate, "Quality/ScrapLoss", {workEffortId: ids.qualityRunId}],
            [users.read, "Subcontracting/SubcontractOperations", {}],
            [users.read, "Planning/SupplyPlanning", {plantId: ids.plantId}],
            [users.read, "Planning/Capacity", {plantId: ids.plantId}],
            [users.read, "ShopFloor/OperationExecution", {operationWorkEffortId: ids.operationId}]
        ]
        const problems = []
        for (const [user, path, parameters] of refusals) {
            const got = screenRefusal(user, path, parameters)
            if (!unauthorized(got) || !got.includes("AT_XML_SCREEN [")) problems.push(`${user} ${path}: ${got || "opened"}`)
        }
        if (problems.length) log.warn("Manufacturing screen refusals:\n" + problems.join("\n"))
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the reader is refused the reason codes' save by the screen transition the resource administrator saves with", {
    when() {
        // the same request for both, the reader's first
        const parameters = {
            organizationPartyId: "ORG_ZIZI_RETAIL",
            changeReason: "Spec reasons",
            reasonCode: "SPEC_P4_JAM",
            reasonName: "Spec jam",
            reasonCategoryEnumId: "PrcDowntime",
            equipmentFault: "Y"
        }
        const post = user =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Manufacturing.xml")
                    .render("Settings/ReasonCodes/storeReason", parameters, "post")
                const errors = Array.from(result.errorMessages || []).join(" | ")
                ec.message.clearErrors()
                return errors
            })
        const codes = () =>
            asUser(
                users.read,
                () =>
                    invoke("mantle.work.ProductionServices.find#ProductionReasons", {
                        organizationPartyId: "ORG_ZIZI_RETAIL"
                    }).reasons.map(row => row.reasonCode),
                false
            )
        const before = codes().includes("SPEC_P4_JAM")
        const reader = post(users.read)
        const afterReader = codes().includes("SPEC_P4_JAM")
        const resource = post(users.resource)
        return {before, reader, afterReader, resource, after: codes().includes("SPEC_P4_JAM")}
    },
    then({before, reader, afterReader, resource, after}) {
        ;/not authorized|PERMISSION_DENIED/.test(reader)
        afterReader == before
        resource == ""
        after == true
    }
})

// ===== the paths around the production services (F10, F37, F38, F39) =====
feature("no Mantle REST run path, no Commons or Projects task change of a run's operation and no event of a run (F10, F37-F39)", {
    when() {
        const problems = []
        // the Mantle REST run paths, for a Manufacturing planner and a Projects team member
        for (const user of [users.plan, fixture.assignee])
            asUser(user, () => {
                for (const [path, method] of [
                    ["s1/mantle/workEfforts", "get"],
                    ["s1/mantle/workEfforts/" + ids.runId, "patch"],
                    ["s1/mantle/workEfforts/productionRuns", "post"]
                ]) {
                    const rendered = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot/rest.xml")
                        .render(path, {statusId: "WeComplete", facilityId: ids.lineId}, method)
                    if (![401, 403].includes(rendered.status)) problems.push(`${user} ${path} ${method}: ${rendered.status}`)
                    ec.message.clearErrors()
                }
            })
        // a run's operation is no task (F38): Commons refuses its changes and Projects does not find it, while the same user
        // changes a task of their own; the services as the screens call them
        const task = asUser(
            fixture.assignee,
            () => {
                const taskRows = invoke("ironstone.commons.TaskServices.decorate#TaskRows", {
                    taskList: system(() =>
                        Array.from(
                            ec.entity
                                .find("mantle.work.effort.WorkEffort")
                                .condition("workEffortId", "in", [fixture.operationId, fixture.taskId])
                                .list()
                        ).map(row => row.getMap())
                    )
                }).rowList
                return {
                    commons: invoke("ironstone.commons.TaskServices.get#TaskAccess", {
                        workEffortId: fixture.operationId,
                        need: "check"
                    }),
                    projects: invoke("ironstone.commons.TaskServices.get#TaskAccess", {
                        workEffortId: fixture.operationId,
                        need: "check",
                        app: "projects"
                    }),
                    rowUpdate: Object.fromEntries(Array.from(taskRows).map(row => [row.workEffortId, row.canUpdate])),
                    ownTask: refusal("ironstone.commons.CommonsServices.check#TaskUpdate", {workEffortId: fixture.taskId}),
                    todayCheck: refusal("ironstone.commons.CommonsServices.check#TaskUpdate", {
                        workEffortId: fixture.operationId
                    }),
                    markDone: refusal("ironstone.commons.CommonsServices.complete#TodayItem", {
                        workEffortId: fixture.operationId
                    }),
                    update: refusal("ironstone.commons.TaskServices.get#TaskAccess", {
                        workEffortId: fixture.operationId,
                        need: "update"
                    }),
                    workItem: refusal("ironstone.commons.TaskServices.get#TaskAccess", {
                        workEffortId: fixture.operationId,
                        need: "update",
                        app: "projects"
                    })
                }
            },
            false
        )
        if (task.ownTask !== "") problems.push(`the assignee is refused a task of their own: ${task.ownTask}`)
        if (task.commons.found !== true || task.commons.canUpdate !== false)
            problems.push("Commons offers the operation's change")
        // no cost of the operation (the task roll-up's, F36)
        if (task.commons.workEffort.actualCost != null) problems.push("Commons shows the operation's cost")
        if (task.rowUpdate[fixture.operationId] !== false || task.rowUpdate[fixture.taskId] !== true)
            problems.push(`the task rows' updates: ${JSON.stringify(task.rowUpdate)}`)
        if (task.projects.found !== false) problems.push("Projects finds the operation")
        for (const name of ["todayCheck", "markDone", "update"])
            if (!task[name].includes("production work")) problems.push(`Commons ${name}: ${task[name] || "accepted"}`)
        if (!task.workItem.includes("is not available")) problems.push(`Projects' work item: ${task.workItem || "accepted"}`)
        // a run is no event (F39): EventDetail's access refuses it, a demo event passes, and it cannot be duplicated
        const runCount = () =>
            system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("purposeEnumId", "WepProductionRun").count())
        const before = runCount()
        const event = asUser(
            "john.doe",
            () => ({
                event: refusal("ironstone.commons.CalendarServices.get#EventAccessInfo", {
                    workEffortId: "BOSS_DEMO_EVENT",
                    need: "view"
                }),
                run: refusal("ironstone.commons.CalendarServices.get#EventAccessInfo", {workEffortId: ids.runId, need: "view"}),
                duplicate: refusal("ironstone.commons.EventServices.duplicate#Event", {workEffortId: fixture.runId})
            }),
            false
        )
        if (event.event !== "") problems.push(`the demo event is refused: ${event.event}`)
        if (!event.run.includes("is not available")) problems.push(`a run is an event: ${event.run || "accepted"}`)
        if (!event.duplicate.includes("is not available")) problems.push(`a run is duplicated: ${event.duplicate || "accepted"}`)
        if (runCount() !== before) problems.push("a run was added")
        const operationStatus = system(
            () => ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", fixture.operationId).one().statusId
        )
        if (operationStatus !== "WeApproved") problems.push(`the operation is ${operationStatus}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
