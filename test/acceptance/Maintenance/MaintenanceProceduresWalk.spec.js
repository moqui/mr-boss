// Maintenance P6's "usable when" (impl-maintenance P6; design-maintenance §11.2 "Repeat a procedure", "Interrupted creation/retry",
// "Template isolation" and "Publication and amendment" in its publication half), as an acceptance walk through the screens'
// transitions with artifact authorization on: maint.author builds a compressor service (a Prepare group of two steps, an oil change
// waiting for it with its part and an instruction, a discharge pressure reading) on ProcedureDetail and asks for approval; maint.approver
// publishes it from Commons' approvals inbox (the WorkProcessApproval card); maint.planner makes two work orders of it on the
// compressor with New work order (a resubmitted form answering the first); the author then changes the procedure, and neither work
// order changes: their steps, step policies and the instruction they resolve stay as made; the changed procedure makes no work until
// it is approved again; the template is in no technician's Tasks and takes no time. The rules are Mantle's MaintenanceProcesses and
// BOSS's MaintenanceProcedures and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenanceProceduresWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const state = {}

// A transition of a Maintenance screen posted as the user: its status, its errors and where it sent the user.
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {
            status: result.status,
            errors,
            location: String(result.header("Location") || ""),
            output: String(result.output || "")
        }
    })
}
// A Mantle read as the user under the root's inheritable grant (the artifact check aside; the service's own scope decides).
function read(user, service, parameters) {
    return asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
}
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const basedOn = workEffortId =>
    rows("mantle.work.effort.WorkEffortAssoc", {workEffortId, workEffortAssocTypeEnumId: "WeatBasedOn"})[0]
const stepOf = (rootId, templateStepId) =>
    rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: rootId}).find(
        row => basedOn(row.workEffortId)?.toWorkEffortId === templateStepId
    )

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the author builds the compressor service on ProcedureDetail and asks for approval", {
    when() {
        const created = post(users.author, "Procedures/Find/storeProcedure", {
            workEffortName: "Walk compressor service",
            organizationPartyId: ids.organizationId,
            maintenanceTypeEnumId: "MntTpPreventive",
            applicableProductId: ids.modelId
        })
        const procedure = rows("mantle.work.effort.WorkEffort", {workEffortName: "Walk compressor service", isTemplate: "Y"})[0]
        state.procedure = procedure.workEffortId
        const steps = "Procedures/ProcedureDetail/Steps/storeStep"
        const add = parameters => post(users.author, steps, Object.assign({rootWorkEffortId: state.procedure}, parameters))
        const named = name =>
            rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: state.procedure, workEffortName: name})[0]?.workEffortId
        add({workEffortName: "Prepare"})
        state.prepare = named("Prepare")
        add({
            workEffortName: "Isolate the compressor",
            parentWorkEffortId: state.prepare,
            responseKindEnumId: "WsrCheckOff",
            estimatedWorkTime: 0.5
        })
        add({
            workEffortName: "Drain the receiver",
            parentWorkEffortId: state.prepare,
            responseKindEnumId: "WsrCheckOff",
            estimatedWorkTime: 0.5
        })
        add({workEffortName: "Change the oil", responseKindEnumId: "WsrCheckOff", evidenceRequired: "Y", estimatedWorkTime: 1})
        state.oil = named("Change the oil")
        add({
            workEffortName: "Read the discharge pressure",
            responseKindEnumId: "WsrReading",
            measurementTypeId: "AtmosphericPressure",
            measurementUomId: "PRES_bar",
            minimumValue: 7,
            maximumValue: 9,
            waiverAllowed: "Y",
            estimatedWorkTime: 0.25
        })
        state.pressure = named("Read the discharge pressure")
        const waits = post(users.author, steps, {
            rootWorkEffortId: state.procedure,
            stepWorkEffortId: state.oil,
            dependencyForm: "Y",
            dependsOnIds: [state.prepare]
        })
        const part = post(users.author, "Procedures/ProcedureDetail/Resources/storeRequirement", {
            rootWorkEffortId: state.procedure,
            stepWorkEffortId: state.oil,
            kind: "product",
            productId: "BOSS_MNT_PART_FILTER",
            estimatedQuantity: 1
        })
        const instruction = post(users.author, "Procedures/ProcedureDetail/Instructions/storeInstruction", {
            rootWorkEffortId: state.procedure,
            stepWorkEffortId: state.oil,
            contentText: "Drain warm; refill with 2 l of ISO 46."
        })
        const requested = post(users.author, "Procedures/ProcedureDetail/requestApproval", {workEffortId: state.procedure})
        const detail = asUser(users.author, () => page("Procedures/ProcedureDetail/Steps", {workEffortId: state.procedure, lastStandalone: "true"}))
        return {created, waits, part, instruction, requested, detail}
    },
    then({created, waits, part, instruction, requested, detail}) {
        created.errors.length == 0 && state.procedure != null
        waits.errors.length == 0 && part.errors.length == 0 && instruction.errors.length == 0
        requested.errors.length == 0
        opened(detail)
        detail.output.includes("waits for Prepare")
        rows("mantle.work.effort.WorkEffortApproval", {workEffortId: state.procedure, statusId: "WeaRequested"}).length == 1
    }
})

feature("the approver publishes it from Commons' approvals inbox", {
    when() {
        const notice = rows("moqui.security.user.NotificationMessage", {
            topic: "WorkProcessApproval",
            recordId: state.procedure
        })[0]
        const inbox = asUser(users.approver, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Commons.xml")
                .render("Notifications/approve", {notificationMessageId: notice.notificationMessageId}, "post")
        )
        const errors = Array.from(inbox.errorMessages || [])
        ec.message.clearErrors()
        const procedure = one("mantle.work.effort.WorkEffort", {workEffortId: state.procedure})
        return {errors, procedure}
    },
    then({errors, procedure}) {
        errors.length == 0
        procedure.statusId == "WeApproved"
        rows("mantle.work.effort.WorkEffortContent", {workEffortId: state.oil, contentTypeEnumId: "WectInstruction"}).length == 1
        rows("mantle.work.effort.WorkEffortContent", {workEffortId: state.procedure, contentTypeEnumId: "WectPublishedProcedure"})
            .length == 1
    }
})

feature("the planner makes two work orders of it with New work order; a resubmitted form answers the first", {
    when() {
        const create = (name, key) =>
            post(users.planner, "WorkOrders/NewWorkOrder/createWorkOrder", {
                targetKind: "equipment",
                assetId: ids.compressorId,
                templateWorkEffortId: state.procedure,
                workEffortName: name,
                maintenanceKindEnumId: "MkPreventive",
                priority: "5",
                operationKey: key
            })
        const form = asUser(users.planner, () =>
            page("WorkOrders/NewWorkOrder", {assetId: ids.compressorId, templateWorkEffortId: state.procedure})
        )
        create("Walk service, first", "walk-proc-first")
        const again = create("Walk service, first", "walk-proc-first")
        create("Walk service, second", "walk-proc-second")
        const orders = rows("mantle.work.maintenance.MaintenanceWorkOrder", {procedureWorkEffortId: state.procedure})
        state.orders = orders.map(row => row.workEffortId)
        return {form, again, orders}
    },
    then({form, again, orders}) {
        opened(form) && form.output.includes("Procedure")
        again.errors.length == 0
        orders.length == 2
        state.orders.every(id => rows("mantle.work.effort.WorkEffort", {rootWorkEffortId: id}).length == 5)
        // their own steps, none shared, each linked once to its template step
        stepOf(state.orders[0], state.oil).workEffortId != stepOf(state.orders[1], state.oil).workEffortId
        // planned work over the threshold waits for a supervisor
        state.orders.every(id => one("mantle.work.effort.WorkEffort", {workEffortId: id}).statusId == "WeInPlanning")
    }
})

feature(
    "editing the procedure afterwards changes neither work order; the changed procedure makes no work until it is approved again",
    {
        when() {
            const steps = "Procedures/ProcedureDetail/Steps/storeStep"
            post(users.author, steps, {
                rootWorkEffortId: state.procedure,
                stepWorkEffortId: state.pressure,
                workEffortName: "Read the pressure at full load",
                minimumValue: 8
            })
            post(users.author, "Procedures/ProcedureDetail/Instructions/storeInstruction", {
                rootWorkEffortId: state.procedure,
                stepWorkEffortId: state.oil,
                contentText: "Drain warm; refill with 2.5 l of ISO 68."
            })
            const blocked = post(users.planner, "WorkOrders/NewWorkOrder/createWorkOrder", {
                targetKind: "equipment",
                assetId: ids.compressorId,
                templateWorkEffortId: state.procedure,
                operationKey: "walk-proc-third"
            })
            const firstPressure = stepOf(state.orders[0], state.pressure)
            const firstOil = stepOf(state.orders[0], state.oil)
            const instruction = read(users.planner, "mantle.work.ProcessServices.find#ProcessInstructions", {
                workEffortId: firstOil.workEffortId
            })
            const policy = rows("mantle.work.effort.WorkEffortStepPolicy", {workEffortId: firstPressure.workEffortId})[0]
            // the template is no technician's task and takes no time
            const tags = Array.from(read(users.tech, "mantle.work.CalendarDavServices.get#TaskObjectTags", {}).objectList || [])
            const time = asUser(users.tech, () =>
                lib.refusal("mantle.work.MaintenanceServices.record#MaintenanceTime", {
                    workEffortId: state.oil,
                    fromDate: new Date(Date.now() - 3600000),
                    hours: 1
                })
            )
            return {blocked, firstPressure, instruction, policy, tags, time}
        },
        then({blocked, firstPressure, instruction, policy, tags, time}) {
            one("mantle.work.effort.WorkEffort", {workEffortId: state.procedure}).statusId == "WeInPlanning"
            blocked.errors.join(" ").includes("PROCESS_NOT_APPROVED")
            firstPressure.workEffortName == "Read the discharge pressure"
            Number(String(policy.minimumValue)) == 7
            instruction.instructionList[0].text.includes("ISO 46")
            !tags.some(object => object.workEffortId == state.procedure || object.workEffortId == state.oil)
            time != ""
        }
    }
)
