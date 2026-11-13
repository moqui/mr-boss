// Maintenance P4's "usable when" (impl-maintenance P4; design-maintenance §11.2 "Request and customer repair", its request half), as
// an acceptance walk through the screens' transitions with artifact authorization on: maint.requester reports a leaking compressor
// from Commons' Report a problem with a photo and follows it in Commons; a second person's report of the same fault is added to the
// same work order at triage; Manufacturing's operator stops a robot for a fault with a maintenance request, which appears in Retail's
// Requests and is made one work order; the requester never sees the work order's time. The rules are Mantle's MaintenanceIntake and
// BOSS's MaintenanceRequests and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenanceIntakeWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const state = {}
const robotId = "EQUIP_AB4_2"
const operator = "manufacturing.operate"
let keySeq = 0
const key = prefix => prefix + "-" + Date.now() + "-" + ++keySeq

// A transition posted as the user under an app root: its status, its errors, where it sent the user and its output (JSON for the
// dialogs' transitions).
function post(user, root, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/" + root + ".xml")
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
const request = requestId => system(() => ec.entity.find("mantle.request.Request").condition("requestId", requestId).one())
const workOf = requestId =>
    system(() =>
        Array.from(ec.entity.find("mantle.request.RequestWorkEffort").condition("requestId", requestId).list()).map(
            row => row.workEffortId
        )
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

feature("the requester reports the compressor's oil leak from Commons with a photo and follows it there", {
    when() {
        const reported = post(users.requester, "Commons", "ReportProblem/reportProblem", {
            targetKey: "asset:" + ids.compressorId,
            summary: "Compressor C-1 is leaking oil",
            description: "Oil on the floor of the mechanical room",
            priority: "2",
            contentFile: uploadedFile("leak.txt", "a photo of the leak", "text/plain"),
            operationKey: key("walk-report")
        })
        state.requestId = JSON.parse(reported.output || "{}").requestId
        const files = system(() =>
            ec.entity
                .find("mantle.request.RequestContent")
                .condition("requestId", state.requestId || "_NA_")
                .count()
        )
        const followed = asUser(users.requester, () =>
            page("Requests/RequestDetail", {requestId: state.requestId}, "qvt", "Commons")
        )
        return {reported, files, followed, row: request(state.requestId)}
    },
    then({reported, files, followed, row}) {
        reported.errors.length == 0
        !!state.requestId
        row.requestTypeEnumId == "RqtMaintenance"
        row.filedByPartyId == "BOSS_MNT_REQUESTER"
        files == 1
        followed.errors.length == 0
        followed.output.includes("Compressor C-1 is leaking oil")
        followed.output.includes("Your report")
        followed.output.includes("Not planned yet")
    }
})

feature("the planner creates the work order; a second report of the same fault is added to it at triage", {
    when() {
        const created = post(users.planner, "Maintenance", "Requests/RequestDetail/triageRequest", {
            requestId: state.requestId,
            decision: "create",
            priority: "2",
            operationKey: key("walk-triage")
        })
        state.workEffortId = workOf(state.requestId)[0]
        const second = asUser(users.requester, () => {
            ec.artifactExecution.disableAuthz()
            return invoke("mantle.work.MaintenanceServices.report#MaintenanceProblem", {
                assetId: ids.compressorId,
                summary: "Puddle under the compressor again"
            })
        })
        state.secondId = second.requestId
        const linked = post(users.planner, "Maintenance", "Requests/RequestDetail/triageRequest", {
            requestId: state.secondId,
            decision: "link",
            workEffortId: state.workEffortId
        })
        const detail = asUser(users.planner, () => page("Requests/RequestDetail", {requestId: state.secondId}))
        return {created, linked, detail, secondWork: workOf(state.secondId)}
    },
    then({created, linked, detail, secondWork}) {
        created.errors.length == 0
        !!state.workEffortId
        linked.errors.length == 0
        secondWork.length == 1
        secondWork[0] == state.workEffortId
        detail.output.includes(state.workEffortId)
        !detail.output.includes("Create work order")
    }
})

feature("an operator's equipment fault stop in Manufacturing appears in Retail's Requests and is made one work order", {
    when() {
        // as Manufacturing's Downtime transitions: the record check, then the Mantle verb, whose own checks decide
        const asTransition = action =>
            asUser(operator, () => {
                invoke("ironstone.manufacturing.AccessServices.check#Record", {recordType: "workCenter", recordId: "BOSS_MFG_LINE_A"})
                ec.artifactExecution.disableAuthz()
                return action()
            })
        const opened = asTransition(() =>
            invoke("mantle.work.ProductionServices.store#ProductionDowntime", {
                operationKey: key("walk-stop"),
                action: "open",
                facilityId: "BOSS_MFG_LINE_A",
                assetId: robotId,
                reasonCode: "ROBOT_FAULT",
                description: "Gripper jams"
            })
        ).result
        const requested = asTransition(() =>
            invoke("mantle.work.ProductionServices.request#ProductionMaintenance", {
                operationKey: key("walk-request"),
                productionDowntimeId: opened.productionDowntimeId,
                problem: "Gripper jams on every part",
                priority: 2,
                createRequest: true
            })
        ).result
        state.productionRequestId = requested.requestId
        const listed = asUser(users.retailPlanner, () => page("Requests/Find", {}))
        const adopted = post(users.retailPlanner, "Maintenance", "Requests/Find/triageRequest", {
            requestId: state.productionRequestId,
            decision: "create"
        })
        const again = post(users.retailPlanner, "Maintenance", "Requests/Find/triageRequest", {
            requestId: state.productionRequestId,
            decision: "create"
        })
        const roots = system(() =>
            ec.entity
                .find("mantle.work.maintenance.MaintenanceWorkOrder")
                .condition("assetMaintenanceId", requested.assetMaintenanceId)
                .count()
        )
        return {listed, adopted, again, roots, work: workOf(state.productionRequestId)}
    },
    then({listed, adopted, again, roots, work}) {
        listed.errors.length == 0
        listed.output.includes(state.productionRequestId)
        adopted.errors.length == 0
        again.errors.length == 0
        roots == 1
        work.length >= 1
    }
})

feature("the requester follows the work order's state in Commons and never sees its time", {
    when() {
        // the technician works the order and records time; the requester then reads the request
        system(() => {
            call("mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder", {
                workEffortId: state.workEffortId,
                assigneePartyIds: [ids.techPartyId]
            })
        })
        asUser(users.tech, () => {
            ec.artifactExecution.disableAuthz()
            invoke("mantle.work.MaintenanceServices.transition#MaintenanceWorkOrder", {
                workEffortId: state.workEffortId,
                action: "start"
            })
            invoke("mantle.work.MaintenanceServices.record#MaintenanceTime", {
                workEffortId: state.workEffortId,
                fromDate: new Date(Date.now() - 2 * 3600000),
                hours: 1.25,
                comments: "Walk: replaced the drain seal"
            })
        })
        const followed = asUser(users.requester, () =>
            page("Requests/RequestDetail", {requestId: state.requestId}, "qvt", "Commons")
        )
        const workOrder = asUser(users.requester, () =>
            lib.refusal("mantle.work.MaintenanceServices.get#MaintenanceWorkOrder", {workEffortId: state.workEffortId})
        )
        return {followed, workOrder}
    },
    then({followed, workOrder}) {
        followed.errors.length == 0
        followed.output.includes("In Progress")
        !followed.output.includes("Walk: replaced the drain seal")
        !followed.output.includes("1.25")
        !followed.output.includes("Puddle under the compressor again")
        workOrder != ""
    }
})
