// Manufacturing access (impl-manufacturing §2, §4, P1): who may open Manufacturing, the organization and plant scope through
// the organization filters, the capabilities from the Mantle permissions, the record checks against forged ids, the plant
// preference, and the paths around the production services the Manufacturing and other groups do not reach: the Mantle
// REST run paths (F10, F37), a run's operations as Commons and Projects tasks (F38) and a run as a Commons event (F39). With
// artifact authorization enabled and disabled: the scope is read from the root grants, so disabling authorization widens
// nothing. Later phases add their services and mounts here, each in a section named for its phase.
// Run: ./moq test mr-boss --spec ManufacturingAccess
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const access = "ironstone.manufacturing.AccessServices."
const both = [{enabled: true}, {enabled: false}]
// a refusal of a user without Manufacturing: with authorization enabled the service is not authorized for them, and with it
// disabled the service refuses them
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

// ===== P1: who opens Manufacturing, and the capabilities =====
feature("a Manufacturing user gets the context and others are refused with authz #enabled", {
    where: both,
    when({enabled}) {
        const context = user => asUser(user, () => refusal(access + "get#SharedContext", {}), enabled)
        return {
            reader: context(users.read),
            admin: context(users.admin),
            services: context(users.services),
            display: context(users.display),
            finance: context("finance.read"),
            warehouse: context("warehouse.read"),
            method: context("catalog.method"),
            other: asUser(users.read, () => refusal(access + "get#SharedContext", {appRoot: "Warehouse"}), enabled)
        }
    },
    then({reader, admin, services, display, finance, warehouse, method, other}) {
        reader == ""
        admin == ""
        services == ""
        refused(display)
        refused(finance)
        refused(warehouse)
        // Products' method engineer holds a Manufacturing capability group but not the root user group
        refused(method)
        other.includes("MANUFACTURING_CONTEXT")
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
feature("#user holds exactly the capabilities of its group's permissions", {
    where: capabilityUsers,
    when({user}) {
        return asUser(user, () => ({capabilities: invoke(access + "get#SharedContext", {}).capabilities}))
    },
    then({capabilities, granted}) {
        capabilities.read == true
        productionCapabilities.filter(name => capabilities[name]) == granted
        capabilities.financialRead == false
        capabilities.issue == false
    }
})
feature("the administrator holds every production capability and works in every organization's plants", {
    when() {
        return asUser(users.admin, () => ({
            context: invoke(access + "get#SharedContext", {}),
            other: refusal(access + "check#Record", {recordType: "run", recordId: ids.otherRunId}),
            plants: invoke(access + "get#Choices", {choice: "plants"}).options.map(row => row.value)
        }))
    },
    then({context, other, plants}) {
        productionCapabilities.every(name => context.capabilities[name])
        context.allPlants == true
        other == ""
        plants.includes(ids.plantId)
        plants.includes(ids.otherPlantId)
    }
})
feature("the plant display holds no production permission and opens nothing yet (§7 WallDisplay)", {
    when() {
        return asUser(users.display, () => ({
            view: ec.user.hasPermission("PRODUCTION_VIEW"),
            method: ec.user.hasPermission("METHOD_VIEW"),
            record: refusal(access + "check#Record", {recordType: "run", recordId: ids.runId})
        }))
    },
    then({view, method, record}) {
        view == false
        method == false
        refused(record)
    }
})

// ===== P1: organization and plant scope =====
feature("a reader's plants and work centers are their organization's, with authz #enabled", {
    where: both,
    when({enabled}) {
        return asUser(
            users.read,
            () => ({
                context: invoke(access + "get#SharedContext", {}),
                plants: invoke(access + "get#Choices", {choice: "plants", term: ""}).options.map(row => row.value),
                selected: invoke(access + "get#Choices", {choice: "plants", selected: ids.otherPlantId}).options.map(
                    row => row.value
                ),
                centers: invoke(access + "get#Choices", {choice: "workCenters", plantId: ids.plantId}).options.map(
                    row => row.value
                ),
                searched: invoke(access + "get#Choices", {choice: "workCenters", term: "line b"}).options.map(row => row.value),
                otherCenter: invoke(access + "get#Choices", {choice: "workCenters", selected: ids.otherLineId}).options.map(
                    row => row.value
                ),
                unknown: refusal(access + "get#Choices", {choice: "everything"})
            }),
            enabled
        )
    },
    then({context, plants, selected, centers, searched, otherCenter, unknown}) {
        context.allPlants == false
        // Retail's only plant is selected without a preference
        context.plantId == ids.plantId
        context.plantCount == 1
        plants == [ids.plantId]
        !selected.includes(ids.otherPlantId)
        centers.includes(ids.lineId)
        centers.includes(ids.lineBId)
        searched == [ids.lineBId]
        !otherCenter.includes(ids.otherLineId)
        unknown.includes("Unknown Manufacturing choice")
    }
})
feature("the plant preference keeps the user's own plant and never widens the scope", {
    when() {
        return asUser(users.services, () => {
            const own = refusal(access + "select#Plant", {plantId: ids.otherPlantId})
            const forged = refusal(access + "select#Plant", {plantId: ids.plantId})
            const kept = invoke(access + "get#SharedContext", {}).plantId
            const given = refusal(access + "get#SharedContext", {plantId: ids.plantId})
            // a preference set outside the service (a stale or forged one) is ignored where it is read
            ec.user.setPreference("ManufacturingPlantActive", ids.plantId)
            const stale = invoke(access + "get#SharedContext", {}).plantId
            invoke(access + "select#Plant", {})
            return {own, forged, kept, given, stale}
        })
    },
    then({own, forged, kept, given, stale}) {
        own == ""
        forged.includes("PLANT_UNAVAILABLE")
        kept == ids.otherPlantId
        given.includes("PLANT_UNAVAILABLE")
        stale == ids.otherPlantId
    }
})
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
    {recordType: "facility", own: ids.lineId, other: ids.otherFacilityId}
]
feature("a forged #recordType id is refused like a missing one, with authz #enabled", {
    where: () => both.flatMap(row => records.map(record => Object.assign({}, record, row))),
    when({recordType, own, other, enabled}) {
        return asUser(
            users.read,
            () => ({
                own: refusal(access + "check#Record", {recordType, recordId: own}),
                other: refusal(access + "check#Record", {recordType, recordId: other}),
                missing: refusal(access + "check#Record", {recordType, recordId: "BOSS_MFG_FORGED"})
            }),
            enabled
        )
    },
    then({own, other, missing}) {
        own == ""
        other.includes("RECORD_UNAVAILABLE")
        missing.includes("RECORD_UNAVAILABLE")
    }
})
feature("the other organization's reader sees its own run and none of Retail's", {
    when() {
        return asUser(users.services, () => ({
            own: refusal(access + "check#Record", {recordType: "run", recordId: ids.otherRunId}),
            retail: refusal(access + "check#Record", {recordType: "run", recordId: ids.runId}),
            method: refusal(access + "check#Record", {recordType: "method", recordId: fixture.methodId}),
            unknown: refusal(access + "check#Record", {recordType: "everything", recordId: ids.runId})
        }))
    },
    then({own, retail, method, unknown}) {
        own == ""
        retail.includes("RECORD_UNAVAILABLE")
        method.includes("RECORD_UNAVAILABLE")
        unknown.includes("RECORD_UNAVAILABLE")
    }
})
feature("a named capability is refused for a user without its permission, on the same record", {
    when() {
        const check = user =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "run", recordId: ids.runId, capability: "plan"}))
        return {
            planner: check(users.plan),
            reader: check(users.read),
            unknown: asUser(users.plan, () =>
                refusal(access + "check#Record", {recordType: "run", recordId: ids.runId, capability: "everything"})
            )
        }
    },
    then({planner, reader, unknown}) {
        planner == ""
        reader.includes("PERMISSION_DENIED")
        reader.includes("PRODUCTION_PLAN")
        unknown.includes("Unknown Manufacturing capability")
    }
})

// ===== P1: the paths around the production services (F10, F37, F38, F39) =====
feature("the Manufacturing and Projects groups reach no Mantle REST run path (F10, F37)", {
    where: [{user: users.plan}, {user: users.supervise}, {user: users.admin}, {user: fixture.assignee}],
    when({user}) {
        return asUser(user, () => {
            const failures = []
            for (const [path, method] of [
                ["s1/mantle/workEfforts", "get"],
                ["s1/mantle/workEfforts/" + ids.runId, "patch"],
                ["s1/mantle/workEfforts/productionRuns", "post"]
            ]) {
                const rendered = ec.screen
                    .makeTest()
                    .rootScreen("component://webroot/screen/webroot/rest.xml")
                    .render(path, {statusId: "WeComplete", facilityId: ids.lineId}, method)
                if (![401, 403].includes(rendered.status)) failures.push(path + " " + method + ": " + rendered.status)
                ec.message.clearErrors()
            }
            return {failures}
        })
    },
    then({failures}) {
        failures == []
    }
})
feature("a run's operation is no task: Commons refuses its changes and Projects does not find it (F38)", {
    when() {
        return asUser(
            fixture.assignee,
            () => {
                const commons = invoke("ironstone.commons.TaskServices.get#TaskAccess", {
                    workEffortId: fixture.operationId,
                    need: "check"
                })
                const projects = invoke("ironstone.commons.TaskServices.get#TaskAccess", {
                    workEffortId: fixture.operationId,
                    need: "check",
                    app: "projects"
                })
                // the Commons list and TaskDetail rows offer no change of the operation, and the task row of their own does
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
                const rowUpdate = Object.fromEntries(Array.from(taskRows).map(row => [row.workEffortId, row.canUpdate]))
                return {
                    commons,
                    projects,
                    rowUpdate,
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
                    }),
                    status: system(
                        () =>
                            ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", fixture.operationId).one()
                                .statusId
                    )
                }
            },
            false
        )
    },
    then({commons, projects, rowUpdate, ownTask, todayCheck, markDone, update, workItem, status}) {
        // the same user changes a task of their own, so the refusals are for the operation
        ownTask == ""
        commons.found == true
        commons.canUpdate == false
        // no cost of the operation (the task roll-up's, F36)
        commons.workEffort.actualCost == null
        rowUpdate[fixture.operationId] == false
        rowUpdate[fixture.taskId] == true
        projects.found == false
        todayCheck.includes("production work")
        markDone.includes("production work")
        update.includes("production work")
        workItem.includes("is not available")
        status == "WeApproved"
    }
})
feature("a run is no event: EventDetail's access refuses it and it cannot be duplicated (F39)", {
    when() {
        const runCount = () =>
            system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("purposeEnumId", "WepProductionRun").count())
        const before = runCount()
        const result = asUser(
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
        return Object.assign(result, {added: runCount() - before})
    },
    then({event, run, duplicate, added}) {
        event == ""
        run.includes("is not available")
        duplicate.includes("is not available")
        added == 0
    }
})

// ===== P4: the production policy and reason codes =====
// The policy changes here start a year ahead, so they change nothing the other specs read now.
const production = "mantle.work.ProductionServices."
const ahead = offsetDays => new Date(Date.now() + offsetDays * 86400000).toISOString()
feature(
    "the resource administrator sets an organization default and a plant override; a reader cannot, another organization reads none",
    {
        when() {
            const defaultRow = {
                organizationPartyId: "ORG_ZIZI_RETAIL",
                fromDate: ahead(365),
                overProducePercent: 4,
                changeReason: "Spec organization default"
            }
            const plantRow = {
                facilityId: ids.plantId,
                fromDate: ahead(366),
                overProducePercent: 9,
                changeReason: "Spec plant override"
            }
            // the negative cases first, with the parameters that then succeed
            const reader = asUser(users.read, () => refusal(production + "store#ProductionPolicy", plantRow), false)
            const otherRead = asUser(
                users.services,
                () => refusal(production + "get#ProductionPolicy", {facilityId: ids.plantId}),
                false
            )
            const stored = asUser(
                users.resource,
                () => [
                    refusal(production + "store#ProductionPolicy", defaultRow),
                    refusal(production + "store#ProductionPolicy", plantRow)
                ],
                false
            )
            const resolved = asUser(
                users.read,
                () => invoke(production + "get#ProductionPolicy", {facilityId: ids.lineId, asOfDate: ahead(367)}),
                false
            )
            const source = (resolved.traceRows || []).find(row => row.field === "overProducePercent") || {}
            return {reader, otherRead, stored, value: Number(String(resolved.policy.overProducePercent)), source}
        },
        then({reader, otherRead, stored, value, source}) {
            reader.includes("PERMISSION_DENIED")
            otherRead.includes("RECORD_UNAVAILABLE")
            stored == ["", ""]
            value == 9
            source.level == "facility"
            source.sourceFacilityId == ids.plantId
        }
    }
)
feature("reason codes are kept by the resource administrator and read by a reader; a reader cannot change them", {
    when() {
        const reason = {
            organizationPartyId: "ORG_ZIZI_RETAIL",
            changeReason: "Spec reasons",
            reasons: [
                {reasonCode: "SPEC_P4_JAM", reasonName: "Spec jam", reasonCategoryEnumId: "PrcDowntime", equipmentFault: "Y"}
            ]
        }
        const reader = asUser(users.read, () => refusal(production + "store#ProductionReasons", reason), false)
        const stored = asUser(users.resource, () => refusal(production + "store#ProductionReasons", reason), false)
        const listed = asUser(
            users.read,
            () => invoke(production + "find#ProductionReasons", {organizationPartyId: "ORG_ZIZI_RETAIL"}),
            false
        )
        const other = asUser(
            users.services,
            () => refusal(production + "find#ProductionReasons", {organizationPartyId: "ORG_ZIZI_RETAIL"}),
            false
        )
        return {reader, stored, codes: listed.reasons.map(row => row.reasonCode), canEdit: listed.canEdit, other}
    },
    then({reader, stored, codes, canEdit, other}) {
        reader.includes("PERMISSION_DENIED")
        stored == ""
        codes.includes("SPEC_P4_JAM")
        canEdit == false
        other.includes("RECORD_UNAVAILABLE")
    }
})
feature("Settings opens for the resource administrator with its change actions, and not for a reader, with authz enabled", {
    when() {
        const resource = asUser(users.resource, () => ({
            settings: lib.page("Settings/ProductionSettings"),
            plant: lib.page("Settings/ProductionSettings", {plantId: ids.plantId}),
            reasons: lib.page("Settings/ReasonCodes")
        }))
        const reader = asUser(users.read, () => lib.page("Settings/ProductionSettings"))
        const otherPlant = asUser(users.resource, () => lib.page("Settings/ProductionSettings", {plantId: ids.otherPlantId}))
        return {resource, reader, otherPlant}
    },
    then({resource, reader, otherPlant}) {
        resource.settings.status == 200
        resource.settings.errors.length == 0
        resource.settings.output.includes("Change consumption")
        resource.settings.output.includes("Organization default")
        resource.plant.output.includes("Plant override at")
        resource.reasons.errors.length == 0
        resource.reasons.output.includes("Add reason")
        resource.reasons.output.includes("SPEC_P4_JAM")
        reader.status != 200 || !reader.output.includes("Change consumption")
        otherPlant.output.includes("This production policy is not available to you.")
    }
})

// ===== P3: work centers and equipment =====
const workCenters = "ironstone.manufacturing.WorkCenterServices."
feature("each Work centers drop-down answers the user's options and a selected value of theirs, and not another organization's", {
    when() {
        const options = (choice, extra = {}) =>
            invoke(access + "get#Choices", Object.assign({choice}, extra)).options.map(row => row.value)
        return asUser(users.resource, () => ({
            facilities: options("centerFacilities", {term: "retail"}),
            facilityLine: options("centerFacilities", {selected: ids.lineId}),
            calendars: options("calendars", {selected: ids.lineCalendarId}),
            products: options("products", {term: "DEMO_1_1", selected: "DEMO_1_1"}),
            quantityUnits: options("quantityUnits", {term: "each", selected: "OTH_ea"}),
            timeUnits: options("timeUnits", {selected: "TF_hr"}),
            policies: options("schedulingPolicies", {selected: "WcspBackward"}),
            bases: options("capacityBases", {selected: "WccbSlots"}),
            equipmentTypes: options("equipmentTypes", {term: "", selected: "AstTpEquipment"}),
            components: options("rateComponents", {selected: "PccMachine"}),
            currencies: options("currencies", {term: "USD", selected: "USD"}),
            notAPolicy: options("schedulingPolicies", {selected: "WccbSlots"}),
            otherCalendar: asUser(users.services, () => options("calendars", {selected: ids.lineCalendarId}))
        }))
    },
    then({
        facilities,
        facilityLine,
        calendars,
        products,
        quantityUnits,
        timeUnits,
        policies,
        bases,
        equipmentTypes,
        components,
        currencies,
        notAPolicy,
        otherCalendar
    }) {
        // the warehouse is not a work center, line A is
        facilities.includes(ids.plantId)
        !facilityLine.includes(ids.lineId)
        calendars.includes(ids.lineCalendarId)
        products.includes("DEMO_1_1")
        quantityUnits.includes("OTH_ea")
        timeUnits.includes("TF_hr")
        policies.includes("WcspBackward")
        bases == ["WccbRate", "WccbSlots"]
        equipmentTypes.includes("AstTpEquipment")
        !equipmentTypes.includes("AstTpInventory")
        components == ["PccLabor", "PccMachine", "PccOverhead"]
        currencies.includes("USD")
        !notAPolicy.includes("WccbSlots")
        !otherCalendar.includes(ids.lineCalendarId)
    }
})
feature("the Work centers reads keep to the user's organization, with authz #enabled", {
    where: both,
    when({enabled}) {
        const reads = user =>
            asUser(
                user,
                () => ({
                    facility: refusal(workCenters + "get#FacilityDetail", {facilityId: ids.lineId}),
                    equipment: refusal(workCenters + "get#Equipment", {assetId: ids.equipmentId}),
                    stock: refusal(workCenters + "get#Equipment", {assetId: "BOSS_WH_LOT_QUARANTINE"}),
                    list: invoke(workCenters + "find#Equipment", {}).equipmentList.map(row => row.assetId),
                    forged: refusal(workCenters + "find#Equipment", {facilityId: ids.otherLineId}),
                    calendar: invoke(workCenters + "get#ResourceCalendarEvents", {
                        start: "2026-11-23",
                        end: "2026-11-30"
                    }).eventList.map(row => row.title)
                }),
                enabled
            )
        // the Mantle reads the screens call after the check (inheriting the screen's authorization), each checking its own
        // permission and organization
        const mantle = user =>
            asUser(
                user,
                () => ({
                    center: refusal("mantle.work.WorkCenterServices.get#WorkCenter", {facilityId: ids.lineId}),
                    load: invoke("mantle.work.ProductionPlanningServices.get#WorkCenterLoad", {}).centerList.map(
                        row => row.facilityId
                    )
                }),
                false
            )
        return {
            reader: Object.assign(reads(users.read), mantle(users.read)),
            services: Object.assign(reads(users.services), mantle(users.services))
        }
    },
    then({reader, services}) {
        reader.facility == ""
        reader.equipment == ""
        reader.stock.includes("RECORD_UNAVAILABLE")
        reader.list.includes(ids.equipmentId)
        reader.forged.includes("RECORD_UNAVAILABLE")
        reader.calendar.some(title => title.includes("Assembly line A"))
        reader.center == ""
        reader.load.includes(ids.lineId)
        !reader.load.includes(ids.otherLineId)
        services.facility.includes("RECORD_UNAVAILABLE")
        services.equipment.includes("RECORD_UNAVAILABLE")
        !services.list.includes(ids.equipmentId)
        !services.calendar.some(title => title.includes("Assembly line A"))
        services.center.includes("RECORD_UNAVAILABLE")
        services.load.includes(ids.otherLineId)
        !services.load.includes(ids.lineId)
    }
})
feature("a work-center change needs METHOD_RESOURCES: the reader is refused what the resource administrator may do", {
    when() {
        // the same request for both: the end of line A's alternate as of tomorrow, which the administrator then undoes
        const tomorrow = new Date(Date.now() + 86400000).toISOString()
        const parameters = {workCenterAlternateId: "BOSS_MFG_LINE_A_ALT_B", thruDate: tomorrow, changeReason: "Access probe"}
        // with artifact authorization disabled, as a screen's transition inherits it: the Mantle service refuses by permission
        const store = user =>
            asUser(user, () => refusal("mantle.work.WorkCenterServices.store#WorkCenterAlternate", parameters), false)
        const reader = store(users.read)
        const method = store(users.method)
        const resource = store(users.resource)
        system(() =>
            ec.service
                .sync()
                .name("update#mantle.work.production.WorkCenterAlternate")
                .parameters({workCenterAlternateId: "BOSS_MFG_LINE_A_ALT_B", thruDate: null})
                .call()
        )
        return {reader, method, resource}
    },
    then({reader, method, resource}) {
        reader.includes("resources authority is required")
        method.includes("resources authority is required")
        resource == ""
    }
})

// ===== P2: the method services, the shared method context, Approvals, the palette and record links =====
// the Mantle verbs and Products' shared-screen services are run as the screens run them: their screen's authorization is
// inherited, so here artifact authorization is off and each service's own permission check is what refuses
const asService = (user, action) => asUser(user, action, false)
const P2 = {
    template: {
        organizationPartyId: "ORG_ZIZI_RETAIL",
        workEffortName: "Spec access template",
        timeUomId: "TF_hr",
        methodBatchQuantity: 1,
        methodQuantityUomId: "OTH_ea",
        changeReason: "Spec access"
    }
}
feature("the method verbs check METHOD_EDIT and METHOD_APPROVE through MethodPolicy, on the same parameters", {
    when() {
        const store = user => asService(user, () => refusal("mantle.work.RoutingServices.store#OperationTemplate", P2.template))
        const release = user =>
            asService(user, () => {
                const detail = invoke("mantle.work.RoutingServices.get#RoutingDetail", {workEffortId: ids.routingId})
                return refusal("mantle.work.RoutingServices.release#RoutingDraft", {
                    workEffortId: ids.routingId,
                    expectedRevision: detail.expectedRevision,
                    changeReason: "Spec access"
                })
            })
        return {
            engineer: store(users.method),
            reader: store(users.read),
            approverStore: store(users.methodApprove),
            engineerRelease: release(users.method),
            readerRelease: release(users.read)
        }
    },
    then({engineer, reader, approverStore, engineerRelease, readerRelease}) {
        engineer == ""
        reader.includes("edit authority")
        approverStore.includes("edit authority")
        engineerRelease.includes("approve authority")
        readerRelease.includes("approve authority")
    }
})
feature("another organization's reader reaches none of Retail's methods, routings or templates", {
    when() {
        return asService(users.services, () => ({
            method: refusal(access + "check#Record", {recordType: "method", recordId: ids.methodId}),
            routing: refusal(access + "check#Record", {recordType: "routing", recordId: ids.routingId}),
            template: refusal(access + "check#Record", {recordType: "routing", recordId: ids.templateIds[0]}),
            templates: refusal("mantle.work.RoutingServices.find#OperationTemplates", {workEffortId: ids.templateIds[0]}),
            list: invoke("ironstone.manufacturing.MethodServices.get#BomList", {organizationPartyId: "ORG_ZIZI_RETAIL"})
        }))
    },
    then({method, routing, template, templates, list}) {
        method.includes("RECORD_UNAVAILABLE")
        routing.includes("RECORD_UNAVAILABLE")
        template.includes("RECORD_UNAVAILABLE")
        templates.includes("not available")
        !list.bomRows.some(row => row.productBomId === ids.methodId)
    }
})
feature("the Manufacturing context of the shared method screens: #user's tabs and capabilities", {
    where: [
        {user: users.read, costs: false, edit: false},
        {user: users.method, costs: false, edit: true},
        {user: users.cost, costs: true, edit: false}
    ],
    when({user}) {
        return asService(user, () => invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Manufacturing"}))
    },
    then({productTabs, capabilities, sharedLinks, costs, edit}) {
        productTabs.includes("BOM")
        productTabs.includes("KitComponents")
        productTabs.includes("Costs") == costs
        capabilities.read == true
        capabilities.catalogEdit == false
        capabilities.priceRead == false
        capabilities.methodEdit == edit
        sharedLinks["Products/Product360"] == "//Manufacturing/BillsOfMaterials/Product360"
    }
})
feature("a user without Manufacturing gets no Manufacturing context for the shared screens", {
    when() {
        return {
            warehouse: asService("warehouse.read", () =>
                refusal("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Manufacturing"})
            ),
            products: asService("catalog.method", () =>
                refusal("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Manufacturing"})
            )
        }
    },
    then({warehouse, products}) {
        warehouse != ""
        products != ""
    }
})
feature("Approvals opens for the method approver only, and lists the method release topics", {
    when() {
        return {
            approver: asUser(users.methodApprove, () => lib.page("Approvals", {}, "html")),
            engineer: asUser(users.method, () => lib.page("Approvals", {}, "html"))
        }
    },
    then({approver, engineer}) {
        approver.status == 200
        approver.errors.length == 0
        engineer.status != 200
    }
})
feature("the palette and record links open methods and routings under Manufacturing for its users only", {
    when() {
        const search = (user, text) =>
            asUser(user, () => invoke(access + "search#Records", {text, limit: 10}).rows.map(row => row.url))
        const link = (user, recordEntityName, recordId) =>
            asUser(user, () => invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id: recordId}).url)
        return {
            method: search(users.method, "pilot"),
            routing: search(users.method, "Line A assembly"),
            other: search(users.services, "pilot"),
            bomLink: link(users.method, "mantle.product.bom.ProductBom", ids.methodId),
            operationLink: link(users.method, "mantle.work.effort.WorkEffort", ids.routingOperationIds[1]),
            templateLink: link(users.method, "mantle.work.effort.WorkEffort", ids.templateIds[0]),
            productsLink: link("catalog.method", "mantle.product.bom.ProductBom", ids.methodId)
        }
    },
    then({method, routing, other, bomLink, operationLink, templateLink, productsLink}) {
        method.some(url => url == "/qapps/Manufacturing/BillsOfMaterials/BillOfMaterialsDetail?productBomId=" + ids.methodId)
        routing.some(url => url == "/qapps/Manufacturing/Routings/RoutingDetail?workEffortId=" + ids.routingId)
        !other.some(url => url.includes(ids.methodId))
        bomLink == "/qapps/Manufacturing/BillsOfMaterials/BillOfMaterialsDetail?productBomId=" + ids.methodId
        operationLink.includes("Routings/RoutingDetail?workEffortId=" + ids.routingId)
        templateLink == "/qapps/Manufacturing/Routings/OperationTemplates?workEffortId=" + ids.templateIds[0]
        !String(productsLink || "").includes("/Manufacturing/")
    }
})

// ===== P6: cost evidence =====
// The spec run's costs: an approved estimate of 4 a unit frozen on it, an output line of 5 and one material cost event,
// written once by the first feature that needs them.
const costFixture = {standardId: "BOSS_MFG_SPEC_STD", outputLineId: "BOSS_MFG_SPEC_RUN_OUT", eventId: "BOSS_MFG_SPEC_COST"}
function costedRun() {
    system(() => {
        store("mantle.product.cost.ProductStandardCost", {
            productStandardCostId: costFixture.standardId,
            productId: fixture.productId,
            organizationPartyId: "ORG_ZIZI_RETAIL",
            state: "approved",
            fromDate: "2026-01-01 00:00:00",
            quantity: 1,
            quantityUomId: "OTH_ea",
            priceUomId: "USD",
            unitCost: 4,
            totalCost: 4,
            materialCost: 4,
            complete: "Y"
        })
        store("mantle.work.effort.WorkEffort", {workEffortId: fixture.runId, productStandardCostId: costFixture.standardId})
        store("mantle.work.production.ProductionRunLine", {
            productionRunLineId: costFixture.outputLineId,
            workEffortId: fixture.runId,
            lineRoleEnumId: "PrlrOutput",
            productId: fixture.productId,
            quantity: 5,
            quantityUomId: "OTH_ea",
            stockQuantity: 5,
            stockUomId: "OTH_ea"
        })
        store("mantle.work.production.ProductionCostEvent", {
            productionCostEventId: costFixture.eventId,
            organizationPartyId: "ORG_ZIZI_RETAIL",
            workEffortId: fixture.runId,
            costEventTypeEnumId: "PcetMaterialIssue",
            costComponentEnumId: "PrcMaterial",
            sourceEntityName: "mantle.product.issuance.AssetIssuance",
            sourceId: "BOSS_MFG_SPEC_ISSUE",
            sourceRevision: 1,
            productId: fixture.productId,
            quantity: 2,
            quantityUomId: "OTH_ea",
            rateAmount: 3,
            amount: 6,
            amountUomId: "USD",
            valuationStatusEnumId: "PcvValued",
            ledgerStatusEnumId: "PclNotPosted",
            eventDate: ec.user.nowTimestamp,
            afterClose: "N"
        })
    })
    return fixture.runId
}
feature("a work order's costs: the estimator reads the estimate and no actuals, the finance reader both, a reader neither", {
    when() {
        const workEffortId = costedRun()
        // the Mantle read the screen calls after the check (inheriting the screen's authorization), and the screen itself
        // with authorization enabled
        const read = user => asUser(user, () => invoke(production + "get#ProductionCosts", {workEffortId}), false)
        const screen = user => asUser(user, () => lib.page("WorkOrders/WorkOrderDetail/ProductionCosts", {workEffortId, lastStandalone: "true"}))
        return {
            cost: read(users.cost),
            finance: read(users.finance),
            reader: read(users.read),
            services: asUser(users.services, () => refusal(production + "get#ProductionCosts", {workEffortId}), false),
            costPage: screen(users.cost),
            financePage: screen(users.finance),
            readerPage: screen(users.read),
            servicesPage: screen(users.services)
        }
    },
    then({cost, finance, reader, services, costPage, financePage, readerPage, servicesPage}) {
        cost.estimate.unitCost == "4"
        cost.estimate.totalCost == "20"
        cost.actuals == null
        !Object.keys(cost.events[0]).includes("amount")
        finance.estimate.unitCost == "4"
        finance.actuals.issued == "6"
        finance.events[0].amount == "6"
        reader.estimate == null
        reader.actuals == null
        reader.events.length == 1
        services.includes("RECORD_UNAVAILABLE")
        costPage.errors.length == 0
        costPage.output.includes("Frozen estimate")
        !costPage.output.includes("Actual cost")
        costPage.output.includes("Request cost review")
        financePage.errors.length == 0
        financePage.output.includes("Frozen estimate")
        financePage.output.includes("Actual cost")
        !financePage.output.includes("Request cost review")
        readerPage.errors.length == 0
        readerPage.output.includes("Cost events")
        !readerPage.output.includes("Frozen estimate")
        !readerPage.output.includes("Actual cost")
        !readerPage.output.includes("Request cost review")
        servicesPage.output.includes("This work order is not available.")
    }
})
feature("the cost estimator requests a work order's cost review; a reader is refused the same request", {
    when() {
        const workEffortId = costedRun()
        const request = {
            operationKey: "spec-p6-review",
            workEffortId,
            expectedRevision: 0,
            note: "Spec review"
        }
        // as the screen's transition: the record check with the capability, then the Mantle verb
        const check = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "run", recordId: workEffortId, capability: "costReview"})
            )
        const review = user => asUser(user, () => refusal(production + "review#ProductionCosts", request), false)
        const readerCheck = check(users.read)
        const reader = review(users.read)
        const costCheck = check(users.cost)
        const cost = review(users.cost)
        const run = system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId}).one())
        const after = asUser(users.cost, () => lib.page("WorkOrders/WorkOrderDetail/ProductionCosts", {workEffortId, lastStandalone: "true"}))
        return {readerCheck, reader, costCheck, cost, run, after}
    },
    then({readerCheck, reader, costCheck, cost, run, after}) {
        readerCheck.includes("PERMISSION_DENIED")
        reader.includes("PERMISSION_DENIED")
        costCheck == ""
        cost == ""
        run.productionCostReviewStatusId == "PcrRequested"
        run.productionCostReviewNote == "Spec review"
        after.output.includes("Review requested")
        !after.output.includes("Request cost review")
    }
})

// ===== P5a: work orders =====
// the Mantle run verbs as the screens run them (artifact authorization off, F-P3-2), and the screens with it enabled
const P5 = {
    draft: user =>
        asService(user, () =>
            refusal("mantle.work.ProductionServices.create#ProductionOrder", {
                operationKey: "spec-p5-" + user + "-" + Date.now(),
                organizationPartyId: "ORG_ZIZI_RETAIL",
                productId: ids.productId,
                productBomId: ids.methodId,
                quantity: 1,
                facilityId: ids.lineId
            })
        ),
    transition: (user, workEffortId, action) =>
        asService(user, () =>
            refusal("mantle.work.ProductionServices.transition#ProductionOrder", {
                operationKey: "spec-p5-" + action + "-" + Date.now(),
                workEffortId,
                action,
                expectedRevision: Number(
                    system(() => ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortId}).one())
                        .productionRevision || 0
                )
            })
        )
}
feature("a run's actions check their own permission: the supervisor cannot release, the planner cannot start, a reader neither", {
    when() {
        const created = asService(users.plan, () =>
            invoke("mantle.work.ProductionServices.create#ProductionOrder", {
                operationKey: "spec-p5-perm-" + Date.now(),
                organizationPartyId: "ORG_ZIZI_RETAIL",
                productId: ids.productId,
                productBomId: ids.methodId,
                quantity: 1,
                facilityId: ids.lineId
            })
        )
        const workEffortId = created.workEffortId
        return {
            readerDraft: P5.draft(users.read),
            supervisorRelease: P5.transition(users.supervise, workEffortId, "release"),
            readerRelease: P5.transition(users.read, workEffortId, "release"),
            plannerRelease: P5.transition(users.plan, workEffortId, "release"),
            plannerStart: P5.transition(users.plan, workEffortId, "start"),
            supervisorStart: P5.transition(users.supervise, workEffortId, "start")
        }
    },
    then(r) {
        r.readerDraft.includes("PERMISSION_DENIED")
        r.supervisorRelease.includes("PERMISSION_DENIED")
        r.readerRelease.includes("PERMISSION_DENIED")
        r.plannerRelease == ""
        r.plannerStart.includes("PERMISSION_DENIED")
        r.supervisorStart == ""
    }
})
feature("another organization's reader reaches none of Retail's runs, and Retail's none of its", {
    when() {
        return {
            check: asUser(users.services, () =>
                refusal(access + "check#Record", {recordType: "run", recordId: ids.runId})
            ),
            lifecycle: asService(users.services, () =>
                refusal("mantle.work.ProductionServices.get#ProductionLifecycle", {workEffortId: ids.runId})
            ),
            servicesList: asService(users.services, () =>
                invoke("mantle.work.ProductionServices.find#ProductionOrders", {statusId: "all", pageSize: 100})
            ),
            retailList: asService(users.read, () =>
                invoke("mantle.work.ProductionServices.find#ProductionOrders", {statusId: "all", pageSize: 100})
            ),
            page: asUser(users.services, () => lib.page("WorkOrders/WorkOrderDetail", {workEffortId: ids.runId}, "html"))
        }
    },
    then({check, lifecycle, servicesList, retailList, page}) {
        check.includes("RECORD_UNAVAILABLE")
        lifecycle.includes("RECORD_UNAVAILABLE")
        !servicesList.orderRows.some(row => row.workEffortId === ids.runId)
        servicesList.orderRows.some(row => row.workEffortId === ids.otherRunId)
        !retailList.orderRows.some(row => row.workEffortId === ids.otherRunId)
        page.output.includes("is not available")
    }
})
feature("New work order and its quick create open for a planner only; a reader's work order shows no lifecycle form", {
    when() {
        const open = (user, path) => asUser(user, () => lib.page(path, {}, "html")).status
        return {
            plannerNew: open(users.plan, "WorkOrders/NewWorkOrder"),
            plannerQuick: open(users.plan, "WorkOrders/QuickCreate"),
            readerNew: open(users.read, "WorkOrders/NewWorkOrder"),
            supervisorQuick: open(users.supervise, "WorkOrders/QuickCreate"),
            readerDetail: asUser(users.read, () => lib.page("WorkOrders/WorkOrderDetail", {workEffortId: ids.runId}, "html")),
            plannerDetail: asUser(users.plan, () => lib.page("WorkOrders/WorkOrderDetail", {workEffortId: ids.runId}, "html")),
            readerList: asUser(users.read, () => lib.page("WorkOrders/Find", {}, "html")),
            plannerList: asUser(users.plan, () => lib.page("WorkOrders/Find", {}, "html"))
        }
    },
    then(r) {
        r.plannerNew == 200
        r.plannerQuick == 200
        r.readerNew != 200
        r.supervisorQuick != 200
        r.readerDetail.errors.length == 0
        r.readerDetail.output.includes("Demo assemblies")
        !r.readerDetail.output.includes("PrimaryLifecycle")
        r.plannerDetail.output.includes("PrimaryLifecycle")
        !r.readerList.output.includes("New work order")
        r.plannerList.output.includes("New work order")
    }
})
feature("each work order drop-down answers the user's options and a selected value of theirs, and not another organization's", {
    when() {
        const options = (user, choice, extra = {}) =>
            asUser(user, () => invoke(access + "get#Choices", Object.assign({choice}, extra)).options.map(row => row.value))
        return {
            products: options(users.plan, "madeProducts"),
            selectedProduct: options(users.plan, "madeProducts", {term: "zzz-none", selected: ids.productId}),
            otherProducts: options(users.services, "madeProducts"),
            boms: options(users.plan, "releasedBoms", {productId: ids.productId}),
            otherBoms: options(users.services, "releasedBoms", {productId: ids.productId}),
            facilities: options(users.plan, "runFacilities"),
            otherFacilities: options(users.services, "runFacilities"),
            equipment: options(users.plan, "runEquipment", {term: "zzz-none", selected: ids.equipmentId}),
            people: options(users.plan, "runPeople"),
            reasons: options(users.supervise, "holdReasons")
        }
    },
    then(r) {
        r.products.includes(ids.productId)
        r.selectedProduct.includes(ids.productId)
        !r.otherProducts.includes(ids.productId)
        r.boms.includes(ids.methodId)
        r.otherBoms.length == 0
        r.facilities.includes(ids.lineId)
        !r.otherFacilities.includes(ids.lineId)
        r.equipment.includes(ids.equipmentId)
        r.people.length > 0
        r.reasons.includes("MATERIAL_HOLD")
    }
})
// ===== P13: supply planning =====
// The shared plan of Retail's plant, read and run with the same parameters by each user; the plan is limited to a product
// with no demand so it changes nothing another spec reads.
const planning = "mantle.product.SupplyPlanningServices."
const planRequest = {facilityIds: [ids.plantId], productIds: [fixture.productId]}
feature("the planner runs the plan; the scheduler only reads it; the display user and another organization are refused", {
    when() {
        // the negative cases first, with the parameters that then succeed
        const scheduler = asUser(users.schedule, () => refusal(planning + "run#SupplyPlan", planRequest), false)
        const reader = asUser(users.display, () => refusal(planning + "get#SupplyPlan", planRequest), false)
        const other = asUser(users.services, () => refusal(planning + "get#SupplyPlan", planRequest), false)
        const otherAccess = asUser(users.services, () =>
            refusal(access + "check#Record", {recordType: "facility", recordId: ids.plantId})
        )
        const planner = asUser(users.plan, () => refusal(planning + "run#SupplyPlan", planRequest), false)
        const schedulerRead = asUser(users.schedule, () => refusal(planning + "get#SupplyPlan", planRequest), false)
        const scheduleStore = asUser(
            users.schedule,
            () => refusal(planning + "store#PlanSchedule", {facilityIds: [ids.plantId], netHeldQuantity: "N"}),
            false
        )
        const plannerAccess = asUser(users.plan, () =>
            refusal(access + "check#Record", {recordType: "facility", recordId: ids.plantId, capability: "supplyPlan"})
        )
        const scheduleAccess = asUser(users.schedule, () =>
            refusal(access + "check#Record", {recordType: "facility", recordId: ids.plantId, capability: "plan"})
        )
        return {scheduler, reader, other, otherAccess, planner, schedulerRead, scheduleStore, plannerAccess, scheduleAccess}
    },
    then({scheduler, reader, other, otherAccess, planner, schedulerRead, scheduleStore, plannerAccess, scheduleAccess}) {
        scheduler.includes("PERMISSION_DENIED")
        reader.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        otherAccess.includes("RECORD_UNAVAILABLE")
        planner == ""
        schedulerRead == ""
        scheduleStore.includes("PERMISSION_DENIED")
        plannerAccess == ""
        scheduleAccess.includes("PERMISSION_DENIED")
    }
})
feature("Planning opens for the planner with its actions and not for a reader or the other organization, with authz enabled", {
    when() {
        return {
            planner: asUser(users.plan, () => lib.page("Planning/SupplyPlanning", {plantId: ids.plantId})),
            reader: asUser(users.read, () => lib.page("Planning/SupplyPlanning", {plantId: ids.plantId})),
            other: asUser(users.services, () => lib.page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        }
    },
    then({planner, reader, other}) {
        planner.status == 200
        planner.errors.length == 0
        planner.output.includes("Recalculate")
        planner.output.includes("Schedule")
        reader.status != 200 || !reader.output.includes("Recalculate")
        other.status != 200 || !other.output.includes("Recalculate")
    }
})

// ===== P11: downtime and maintenance =====
// Each refusal on the parameters a permitted user passes with: the reader may not report or ask for maintenance, the operator
// may not correct, and the other organization's user reaches no Retail stop, center, robot or request.
const downtimeKey = () => "spec-p11-access-" + Date.now() + "-" + Math.floor(Math.random() * 1000000)
const reportOn = (user, facilityId = ids.lineBId) =>
    asUser(
        user,
        () =>
            refusal(production + "store#ProductionDowntime", {
                operationKey: downtimeKey(),
                action: "open",
                facilityId,
                reasonCode: "MATERIAL_HOLD"
            }),
        false
    )
feature("reporting a stop needs PRODUCTION_OPERATE or PRODUCTION_SUPERVISE; a correction PRODUCTION_SUPERVISE", {
    when() {
        const stopId = asUser(
            users.operate,
            () =>
                invoke(production + "store#ProductionDowntime", {
                    operationKey: downtimeKey(),
                    action: "open",
                    facilityId: ids.lineBId,
                    reasonCode: "MATERIAL_HOLD",
                    fromDate: new Date(Date.now() - 20 * 60000),
                    thruDate: new Date(Date.now() - 10 * 60000)
                }).result.productionDowntimeId,
            false
        )
        const correction = {action: "correct", productionDowntimeId: stopId, expectedRevision: 1, changeReason: "Spec correction"}
        const correct = user =>
            asUser(
                user,
                () => refusal(production + "store#ProductionDowntime", Object.assign({operationKey: downtimeKey()}, correction)),
                false
            )
        const maintenance = user =>
            asUser(
                user,
                () =>
                    refusal(production + "request#ProductionMaintenance", {
                        operationKey: downtimeKey(),
                        assetId: ids.equipmentId,
                        problem: "Spec noise"
                    }),
                false
            )
        const check = user =>
            asUser(user, () =>
                refusal(access + "check#Record", {recordType: "downtime", recordId: stopId, capability: "supervise"})
            )
        return {
            operator: reportOn(users.operate),
            supervisor: reportOn(users.supervise),
            reader: reportOn(users.read),
            // the other organization's reader is refused the line by the screens' check (Mantle's spec refuses an operator of
            // another organization the same way)
            services: asUser(users.services, () => refusal(access + "check#Record", {recordType: "workCenter", recordId: ids.lineBId})),
            operatorCorrect: correct(users.operate),
            operatorCheck: check(users.operate),
            supervisorCheck: check(users.supervise),
            supervisorCorrect: correct(users.supervise),
            readerMaintenance: maintenance(users.read),
            operatorMaintenance: maintenance(users.operate)
        }
    },
    then(r) {
        r.operator == ""
        r.supervisor == ""
        r.reader.includes("PERMISSION_DENIED")
        r.services.includes("RECORD_UNAVAILABLE")
        r.operatorCorrect.includes("PERMISSION_DENIED")
        r.operatorCheck.includes("PERMISSION_DENIED")
        r.supervisorCheck == ""
        r.supervisorCorrect == ""
        r.readerMaintenance.includes("PERMISSION_DENIED")
        r.operatorMaintenance == ""
    }
})
feature("the other organization's user reads none of Retail's stops, reasons, equipment or maintenance requests", {
    when() {
        const choices = (user, choice) =>
            asUser(user, () => invoke(access + "get#Choices", {choice, facilityId: ids.lineId, selected: null}).options)
        const requestId = system(
            () =>
                Array.from(
                    ec.entity.find("mantle.request.Request").condition({requestTypeEnumId: "RqtMaintenance"}).limit(1).list()
                )[0]?.requestId
        )
        return {
            retailStops: asUser(
                users.read,
                () => invoke(production + "find#ProductionDowntime", {facilityId: ids.lineId}),
                false
            ),
            servicesStops: asUser(
                users.services,
                () => invoke(production + "find#ProductionDowntime", {facilityId: ids.lineId}),
                false
            ),
            servicesDemo: asUser(
                users.services,
                () => refusal(production + "find#ProductionDowntime", {productionDowntimeId: ids.downtimeId}),
                false
            ),
            retailReasons: choices(users.operate, "downtimeReasons"),
            servicesReasons: choices(users.services, "downtimeReasons"),
            retailEquipment: choices(users.operate, "equipment"),
            servicesEquipment: choices(users.services, "equipment"),
            requestId,
            servicesRequest: requestId ? asUser(users.services, () => lib.page("WorkCenters/RequestDetail", {requestId})) : null,
            servicesDowntime: asUser(users.services, () => lib.page("WorkCenters/Downtime"))
        }
    },
    then(r) {
        r.retailStops.downtimeList.some(row => row.productionDowntimeId == ids.downtimeId)
        r.servicesStops.downtimeList.length == 0
        r.servicesDemo.includes("RECORD_UNAVAILABLE")
        r.retailReasons.some(option => option.value == "ROBOT_FAULT")
        !r.retailReasons.some(option => option.value == "SCRAP_DAMAGE")
        r.servicesReasons.length == 0
        r.retailEquipment.some(option => option.value == ids.equipmentId)
        r.servicesEquipment.length == 0
        r.requestId == null || r.servicesRequest.output.includes("not available")
        r.servicesDowntime.errors.length == 0
        !r.servicesDowntime.output.includes("Changeover")
    }
})
feature("quick create's downtime report opens for the operator and the supervisor, and not for a reader, with authz enabled", {
    when() {
        return {
            operator: asUser(users.operate, () => lib.page("ReportDowntime")),
            supervisor: asUser(users.supervise, () => lib.page("ReportDowntime")),
            reader: asUser(users.read, () => lib.page("ReportDowntime")),
            readerList: asUser(users.read, () => lib.page("WorkCenters/Downtime")),
            operatorList: asUser(users.operate, () => lib.page("WorkCenters/Downtime"))
        }
    },
    then({operator, supervisor, reader, readerList, operatorList}) {
        operator.errors.length == 0
        operator.output.includes("Report stop")
        supervisor.output.includes("Report stop")
        reader.status != 200 || !reader.output.includes("Report stop")
        readerList.errors.length == 0
        readerList.output.includes("Changeover")
        !readerList.output.includes("Report stop")
        operatorList.output.includes("Report stop")
    }
})

// ===== P14: subcontracting =====
// The capabilities of a request (plan) and a conversion (buy), each refused on the parameters a permitted user passes with;
// the other organization's reader is refused the demo's subcontract; the Subcontracting area and Planning open for the planner
// and the buyer, and not for a reader, with authz enabled.
feature("the planner holds plan and not buy, the buyer buy and not plan; another organization's reader is refused", {
    when() {
        const capability = (username, capability) =>
            asUser(username, () =>
                refusal(access + "check#Record", {recordType: "operation", recordId: ids.operationId, capability})
            )
        const status = username =>
            asUser(
                username,
                () => refusal("mantle.work.ProductionServices.get#SubcontractStatus", {operationWorkEffortId: ids.operationId}),
                false
            )
        return {
            plannerPlan: capability(users.plan, "plan"),
            plannerBuy: capability(users.plan, "buy"),
            buyerBuy: capability(users.buyer, "buy"),
            buyerPlan: capability(users.buyer, "plan"),
            reader: status(users.read),
            display: status(users.display),
            other: status(users.services),
            otherOrder: asUser(
                users.services,
                () => refusal("mantle.work.ProductionServices.get#SubcontractOrder", {orderId: ids.serviceOrderId}),
                false
            )
        }
    },
    then({plannerPlan, plannerBuy, buyerBuy, buyerPlan, reader, display, other, otherOrder}) {
        plannerPlan == ""
        plannerBuy.includes("PERMISSION_DENIED")
        buyerBuy == ""
        buyerPlan.includes("PERMISSION_DENIED")
        reader == ""
        display.includes("PERMISSION_DENIED")
        other.includes("RECORD_UNAVAILABLE")
        otherOrder.includes("RECORD_UNAVAILABLE")
    }
})
feature(
    "Subcontracting opens for the planner and the buyer, Planning for the buyer, and neither for a reader, with authz enabled",
    {
        when() {
            const open = (username, path, parameters = {}) => asUser(username, () => lib.page(path, parameters))
            return {
                planner: open(users.plan, "Subcontracting/SubcontractOperations"),
                buyer: open(users.buyer, "Subcontracting/SubcontractOperations"),
                reader: open(users.read, "Subcontracting/SubcontractOperations"),
                buyerPlanning: open(users.buyer, "Planning/SupplyPlanning", {plantId: ids.plantId}),
                readerPlanning: open(users.read, "Planning/SupplyPlanning", {plantId: ids.plantId})
            }
        },
        then({planner, buyer, reader, buyerPlanning, readerPlanning}) {
            planner.errors.length == 0
            planner.output.includes("New outside processing")
            buyer.errors.length == 0
            buyer.output.includes("Outside processing")
            !buyer.output.includes("New outside processing")
            reader.status != 200 || !reader.output.includes("Outside processing")
            buyerPlanning.errors.length == 0
            buyerPlanning.output.includes("Supply planning")
            readerPlanning.status != 200 || !readerPlanning.output.includes("Recalculate")
        }
    }
)
