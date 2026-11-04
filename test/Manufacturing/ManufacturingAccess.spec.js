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
