// Maintenance P14's "usable when" (impl-maintenance P14; design-maintenance §5.1 occurrences and catch-up, DueMaintenance, §8
// PreventiveComplianceReport, §11.2 "PM concurrency and missed work"), as an acceptance walk through the screens' transitions with
// artifact authorization on: maint.planner activates the demo's three plans (those still drafts), opens Due maintenance and
// generates this month's work for them and the air handler's filter change: the filter change's work is made, the start counter's
// plan is blocked with "Request a reading", and the others are named not due (or made, once their dates come); a second generation
// makes nothing again. A new room plan whose first two monthly due dates have passed shows two missed due dates; the planner
// coalesces them into one catch-up with a reason, the supervisor approves, starts and completes the catch-up's work order, and PM
// compliance shows the two obligations late, none on time: not one compliant order. A reader opens Due maintenance and may not
// generate. The rules are Mantle's MaintenanceGeneration and BOSS's MaintenancePlans and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenancePreventiveWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const P = "mantle.work.MaintenancePlanServices."
const zone = "America/Chicago"
const dayMs = 24 * 3600 * 1000
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
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const plan = maintenanceScheduleId => one("mantle.work.maintenance.MaintenanceSchedule", {maintenanceScheduleId})
const orders = maintenanceScheduleId => rows("mantle.work.maintenance.MaintenanceWorkOrder", {maintenanceScheduleId})
const localDay = days => ec.l10n.format(new Date(Date.now() + days * dayMs), "yyyy-MM-dd", null, zone)
const activate = maintenanceScheduleId =>
    post(users.planner, "Preventive/Plans/PlanDetail/planAction", {
        maintenanceScheduleId,
        expectedRevision: Number(plan(maintenanceScheduleId).revision),
        planAction: "activate"
    })
const move = (workEffortId, action, extra = {}) =>
    post(
        users.supervisor,
        "WorkOrders/WorkOrderDetail/lifecycleAction",
        Object.assign({workEffortId, lifecycleAction: action}, extra)
    )
const demoPlans = [ids.roomPlanId, ids.compressorPlanId, ids.stalePlanId]

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

feature(
    "the planner generates this month's work: the filter change is made, the stale meter blocked with a request for a reading",
    {
        when() {
            // the demo's plans that are still drafts (MaintenancePlansWalk activates them too)
            for (const id of demoPlans) if (plan(id).statusId === "MschDraft") activate(id)
            const due = asUser(users.planner, () => page("Preventive/DueMaintenance", {lastStandalone: "true", state: "all"}))
            const readerDue = asUser(users.reader, () => page("Preventive/DueMaintenance", {lastStandalone: "true"}))
            const readerGenerates = post(users.reader, "Preventive/DueMaintenance/generateDue", {
                maintenanceScheduleIds: ids.filterPlanId
            })
            const filterBefore = orders(ids.filterPlanId).length
            const generated = post(users.planner, "Preventive/DueMaintenance/generateDue", {
                maintenanceScheduleIds: demoPlans.concat([ids.filterPlanId]).join(","),
                operationKey: "walk-generate-1"
            })
            const outcomes = read(users.planner, P + "generate#MaintenanceWorkOrders", {
                maintenanceScheduleIds: demoPlans.concat([ids.filterPlanId]),
                preview: true
            }).results
            const again = post(users.planner, "Preventive/DueMaintenance/generateDue", {
                maintenanceScheduleIds: ids.filterPlanId,
                operationKey: "walk-generate-2"
            })
            return {
                due,
                readerDue,
                readerGenerates,
                generated,
                outcomes,
                again,
                filterBefore,
                filterAfter: orders(ids.filterPlanId).length,
                staleOrders: orders(ids.stalePlanId).length,
                states: demoPlans.map(id => plan(id).statusId)
            }
        },
        then({due, readerDue, readerGenerates, generated, outcomes, again, filterBefore, filterAfter, staleOrders, states}) {
            states.every(state => state == "MschActive")
            opened(due)
            due.output.includes("Air handler AHU-2 filter change")
            due.output.includes("Compressor C-1 contactor check every 500 starts")
            opened(readerDue)
            !readerDue.output.includes("Generate due work")
            readerGenerates.errors.join(" ").includes("PERMISSION_DENIED") || readerGenerates.status != 200
            generated.errors.length == 0
            filterAfter == filterBefore + 1
            staleOrders == 0
            // after the generation: the filter change's work is open, the start counter's plan still blocked
            outcomes.find(row => row.maintenanceScheduleId == ids.filterPlanId).code == "WORK_OPEN"
            outcomes.find(row => row.maintenanceScheduleId == ids.stalePlanId).code == "READING_STALE"
            outcomes.find(row => row.maintenanceScheduleId == ids.stalePlanId).message.startsWith("Request a reading")
            outcomes.every(row => row.outcome != "failed")
            // a second generation makes nothing again
            again.errors.length == 0
            orders(ids.filterPlanId).length == filterAfter
        }
    }
)

feature("two missed months of a room plan are coalesced into one catch-up; its completion leaves both obligations late", {
    when() {
        // a monthly inspection of Room 102 whose first two due dates have passed
        const created = post(users.planner, "Preventive/Plans/Find/storePlan", {
            operationKey: "walk-room102-plan",
            targetKind: "facility",
            facilityId: ids.mechanicalRoomId,
            scheduleName: "Room 102 monthly walk-through",
            intervalQuantity: 1,
            intervalUomId: "TF_mon",
            firstDueLocal: localDay(-45) + " 09:00",
            estimatedWorkTime: 1
        })
        const id = rows("mantle.work.maintenance.MaintenanceSchedule", {scheduleName: "Room 102 monthly walk-through"})[0]
            ?.maintenanceScheduleId
        state.roomPlanId = id
        activate(id)
        const before = read(users.planner, P + "get#MaintenanceDue", {maintenanceScheduleId: id}).due
        const history = asUser(users.planner, () =>
            page("Preventive/Plans/PlanDetail/DueHistory", {lastStandalone: "true", maintenanceScheduleId: id})
        )
        const noReason = post(users.planner, "Preventive/DueMaintenance/resolveDue", {
            maintenanceScheduleId: id,
            decision: "coalesce"
        })
        const coalesced = post(users.planner, "Preventive/DueMaintenance/resolveDue", {
            maintenanceScheduleId: id,
            decision: "coalesce",
            changeReason: "The room was locked for the move"
        })
        const occurrences = rows("mantle.work.maintenance.MaintenanceOccurrence", {maintenanceScheduleId: id})
        const catchUp = occurrences.find(row => row.catchUp === "Y")
        const workEffortId = catchUp?.workEffortId
        const approved = move(workEffortId, "approve")
        const started = move(workEffortId, "start")
        const completed = move(workEffortId, "complete", {outcomeEnumId: "MoutDone"})
        const after = read(users.planner, P + "get#MaintenanceDue", {maintenanceScheduleId: id}).due
        const compliance = read(users.planner, "mantle.work.MaintenanceReportServices.get#MaintenanceCompliance", {
            maintenanceScheduleId: id,
            fromDate: new Date(Date.now() - 60 * dayMs)
        })
        const report = asUser(users.planner, () =>
            page("Reports/PreventiveComplianceReport", {
                lastStandalone: "true",
                facilityId: ids.mechanicalRoomId,
                fromDate: localDay(-60)
            })
        )
        return {
            created,
            before,
            history,
            noReason,
            coalesced,
            occurrences,
            catchUp,
            approved,
            started,
            completed,
            after,
            compliance,
            report
        }
    },
    then({
        created,
        before,
        history,
        noReason,
        coalesced,
        occurrences,
        catchUp,
        approved,
        started,
        completed,
        after,
        compliance,
        report
    }) {
        created.errors.length == 0
        before.overdueCount == 2
        opened(history)
        history.output.includes("2 due date(s) missed")
        noReason.errors.join(" ").includes("REASON_REQUIRED")
        coalesced.errors.length == 0
        occurrences.length == 2
        catchUp != null
        occurrences.find(row => row.catchUp !== "Y").statusId == "MocCoalesced"
        approved.errors.length == 0 && started.errors.length == 0 && completed.errors.length == 0
        after.overdueCount == 0
        compliance.summary.dueCount == 2
        compliance.summary.lateCount == 2
        compliance.summary.onTimeCount == 0
        opened(report)
        report.output.includes("0% on time")
        report.output.includes("Coalesced into the catch-up")
    }
})
