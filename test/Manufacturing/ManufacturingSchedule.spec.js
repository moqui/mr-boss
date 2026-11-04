// Manufacturing's scheduling and capacity (impl-manufacturing P12, its "usable when"; design-manufacturing ProductionSchedule,
// Capacity, Operations' Reschedule, FacilityDetail's offline change), through the screens' transitions and pages as the demo
// users with artifact authorization on: the scheduler's drag of run 1's Assemble to line B previews a capacity conflict with
// run 2's Test there, and the Move form commits it at a free time; a move over a conflict needs a supervisor, who approves
// the scheduler's request without changing line B's capacity; an offline time on line A previews the operation it moves;
// Capacity shows the hours and names line B's missing calendar and slots; the terminal twin previews and applies a move of
// run 3's Test; Reschedule on WorkOrderDetail's Operations previews a move. The runs are ManufacturingSpecLib's
// scheduleFixture ("Schedule spec"), placed on a Monday a week or more on. Refusals and the other organization are
// ManufacturingAccess's P12 section; the rules are mr-mantle's ProductionSchedule.
// Run: ./moq test mr-boss --spec ManufacturingSchedule
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const schedulePath = "apps/Manufacturing/Planning/ProductionSchedule/"
const state = {}
let keySeq = 0
const key = () => "spec-p12-" + Date.now() + "-" + ++keySeq
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const count = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).count())
// a screen transition as the client calls it (its JSON answer), as the user with artifact authorization on
function call(user, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method === "post" ? "post" : null)
        const output = String(result.output || "")
        let json = null
        try {
            json = JSON.parse(output)
        } catch (error) {
            json = null
        }
        return {status: result.status, json, output, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}
const operation = workEffortId => one("mantle.work.effort.WorkEffort", {workEffortId})
const wall = (user, value) => asUser(user, () => ec.l10n.format(value, "yyyy-MM-dd HH:mm"))
const codes = list => (list || []).map(row => row.code)
// the Move dialog's post for an operation at its current revisions
function moveParameters(workEffortId, extra) {
    const op = operation(workEffortId)
    const run = operation(op.rootWorkEffortId)
    return Object.assign(
        {
            operationWorkEffortId: workEffortId,
            expectedRevision: String(Number(op.scheduleRevision || 0)),
            expectedRunRevision: String(Number(run.productionRevision || 0)),
            operationKey: key()
        },
        extra
    )
}

spec({
    setupSpec() {
        Object.assign(state, lib.scheduleFixture("Schedule spec"))
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the scheduler's drag of an operation to line B previews its conflict, and the Move form commits it at a free time", {
    when() {
        const [run1, run2] = state.runs
        const read = call(
            users.schedule,
            schedulePath + "schedule",
            {plantId: ids.plantId, fromDay: state.monday, days: 7},
            "get"
        )
        // the drop on line B at 8:00, where run 2's Test runs on the line's one slot
        const dropped = call(
            users.schedule,
            schedulePath + "moveOperation",
            moveParameters(run1.assemble, {
                moveAction: "preview",
                targetFacilityId: ids.lineBId,
                startText: state.day(0) + " 08:00"
            })
        )
        const refused = call(
            users.schedule,
            schedulePath + "moveOperation",
            moveParameters(run1.assemble, {
                moveAction: "apply",
                targetFacilityId: ids.lineBId,
                startText: state.day(0) + " 08:00"
            })
        )
        // the Move form at 9:00, previewed, then applied with the previewed end
        const preview = call(
            users.schedule,
            schedulePath + "moveOperation",
            moveParameters(run1.assemble, {
                moveAction: "preview",
                targetFacilityId: ids.lineBId,
                startText: state.day(0) + " 09:00"
            })
        )
        const applied = call(
            users.schedule,
            schedulePath + "moveOperation",
            moveParameters(run1.assemble, {
                moveAction: "apply",
                targetFacilityId: ids.lineBId,
                startText: state.day(0) + " 09:00",
                endText: preview.json?.preview?.endText
            })
        )
        const moved = operation(run1.assemble)
        const reader = call(users.plan, schedulePath + "schedule", {plantId: ids.plantId, fromDay: state.monday, days: 7}, "get")
        return {read, dropped, refused, preview, applied, moved, reader, run2}
    },
    then({read, dropped, refused, preview, applied, moved, reader, run2}) {
        read.json.schedule.laneList.map(row => row.facilityId).includes(ids.lineBId)
        read.json.schedule.operationList.some(row => row.runName == "Schedule spec 1" && row.facilityId == ids.lineId)
        read.json.schedule.canSchedule == true
        codes(dropped.json.preview.conflicts).includes("CAPACITY")
        dropped.json.preview.conflictText.includes(run2.test)
        dropped.json.preview.canApply == false
        refused.json.failed == true
        refused.json.messageInfos[0].message.includes("SCHEDULE_CONFLICT")
        preview.json.preview.conflicts.length == 0
        preview.json.preview.canApply == true
        applied.json.result.resultCode == "SCHEDULED"
        moved.workCenterFacilityId == ids.lineBId
        wall(users.schedule, moved.estimatedStartDate) == state.day(0) + " 09:00"
        // a planner (no PRODUCTION_SCHEDULE) sees the schedule and may move nothing
        reader.json.schedule.canSchedule == false
        reader.json.schedule.operationList.every(row => row.canMove == false)
    }
})

feature(
    "a move over a conflict needs a supervisor: the scheduler asks, the supervisor approves, and line B's capacity is unchanged",
    {
        when() {
            const run2 = state.runs[1]
            const target = {targetFacilityId: ids.lineBId, startText: state.day(0) + " 08:00", reason: "Rush for a customer"}
            const override = call(
                users.schedule,
                schedulePath + "moveOperation",
                moveParameters(run2.assemble, Object.assign({moveAction: "apply", override: "Y"}, target))
            )
            const capacityBefore = count("mantle.work.production.WorkCenterCapacity", {facilityId: ids.lineBId})
            const requested = call(
                users.schedule,
                schedulePath + "moveOperation",
                moveParameters(run2.assemble, Object.assign({moveAction: "request"}, target))
            )
            const changeId = requested.json?.result?.scheduleChangeId
            const supervisorRead = call(
                users.supervise,
                schedulePath + "schedule",
                {plantId: ids.plantId, scheduleChangeId: changeId},
                "get"
            )
            const schedulerDecides = call(users.schedule, schedulePath + "decideOverride", {
                scheduleChangeId: changeId,
                decision: "approve",
                operationKey: key()
            })
            const approved = call(users.supervise, schedulePath + "decideOverride", {
                scheduleChangeId: changeId,
                decision: "approve",
                reason: "Customer rush",
                operationKey: key()
            })
            return {
                override,
                requested,
                supervisorRead,
                schedulerDecides,
                approved,
                change: one("mantle.work.production.ProductionScheduleChange", {scheduleChangeId: changeId || "_NA_"}),
                moved: operation(run2.assemble),
                capacityBefore,
                capacityAfter: count("mantle.work.production.WorkCenterCapacity", {facilityId: ids.lineBId})
            }
        },
        then(r) {
            r.override.json.failed == true
            r.override.json.messageInfos[0].message.includes("OVERRIDE_NOT_PERMITTED")
            r.requested.json.result.resultCode == "REQUESTED"
            r.supervisorRead.json.schedule.requestList.some(row => row.canDecide && row.reason == "Rush for a customer")
            r.supervisorRead.json.schedule.canOverride == true
            r.schedulerDecides.json.failed == true
            r.approved.json.result.resultCode == "OVERRIDDEN"
            r.change.statusId == "SchApplied"
            r.change.overrideApplied == "Y"
            r.moved.workCenterFacilityId == ids.lineBId
            r.capacityAfter == r.capacityBefore
        }
    }
)

feature("an offline time on line A previews the operation it moves in FacilityDetail", {
    when() {
        const run3 = state.runs[2]
        const from = state.day(1) + " 05:00"
        const thru = state.day(1) + " 07:00"
        const preview = asUser(users.schedule, () =>
            page(
                "WorkCenters/FacilityDetail/WorkCenter",
                {
                    facilityId: ids.lineId,
                    offlineFrom: from,
                    offlineThru: thru,
                    offlineReason: "Fixture change",
                    lastStandalone: "true"
                },
                "html"
            )
        )
        const reader = asUser(users.read, () =>
            page("WorkCenters/FacilityDetail/WorkCenter", {facilityId: ids.lineId, lastStandalone: "true"}, "html")
        )
        return {preview, reader, run3}
    },
    then({preview, reader}) {
        preview.errors.length == 0
        preview.output.includes("Offline preview")
        preview.output.includes("Schedule spec 3")
        preview.output.includes("Move them as previewed")
        preview.output.includes("Calendar-adjusted hours")
        !reader.output.includes("Take offline")
        reader.output.includes("Offline times")
    }
})

feature("Capacity shows nominal, calendar-adjusted, downtime, booked and available hours and names the missing data", {
    when() {
        return asUser(users.schedule, () =>
            page("Planning/Capacity", {plantId: ids.plantId, fromDay: state.day(0), thruDay: state.day(5), bucket: "day"}, "html")
        )
    },
    then(result) {
        result.errors.length == 0
        result.output.includes("Calendar-adjusted")
        result.output.includes("Downtime")
        result.output.includes("Booked")
        result.output.includes("Available")
        result.output.includes("not OEE")
        result.output.includes("Assembly line B")
        result.output.includes("No work calendar")
        result.output.includes("No parallel slots set")
    }
})

feature("the terminal twin previews and applies the same move", {
    when() {
        const run3 = state.runs[2]
        const tuiPreview = asUser(users.schedule, () =>
            page(
                "Planning/ProductionScheduleTui",
                {
                    plantId: ids.plantId,
                    fromDay: state.monday,
                    days: 7,
                    moveOperationId: run3.test,
                    moveFacilityId: ids.lineBId,
                    moveStart: state.day(3) + " 10:00"
                },
                "tui"
            )
        )
        const op = operation(run3.test)
        const run = operation(run3.runId)
        const applied = call(users.schedule, "apps/Manufacturing/Planning/ProductionScheduleTui/applyMove", {
            moveOperationId: run3.test,
            moveFacilityId: ids.lineBId,
            moveStart: state.day(3) + " 10:00",
            expectedRevision: String(Number(op.scheduleRevision || 0)),
            expectedRunRevision: String(Number(run.productionRevision || 0)),
            operationKey: key()
        })
        const after = asUser(users.schedule, () =>
            page(
                "Planning/ProductionScheduleTui",
                {plantId: ids.plantId, fromDay: state.monday, days: 7, showConflicts: "Y"},
                "tui"
            )
        )
        return {tuiPreview, applied, moved: operation(run3.test), after}
    },
    then({tuiPreview, applied, moved, after}) {
        tuiPreview.errors.length == 0
        tuiPreview.output.includes("Move preview")
        tuiPreview.output.includes("Apply")
        tuiPreview.output.includes("Operations by work center")
        applied.errors == ""
        wall(users.schedule, moved.estimatedStartDate) == state.day(3) + " 10:00"
        after.errors.length == 0
        after.output.includes("Conflicts")
    }
})

feature("Reschedule on WorkOrderDetail's Operations previews a move of an operation", {
    when() {
        const run3 = state.runs[2]
        // an hour into line A's day shift (its demo calendar, in the scheduler's zone)
        const shift = one("mantle.work.effort.WorkEffort", {workEffortId: "BOSS_MFG_LINE_A_SHIFT"})
        const clock = asUser(users.schedule, () => ec.l10n.format(shift.estimatedStartDate, "HH:mm"))
        const start = String(Number(clock.slice(0, 2)) + 1).padStart(2, "0") + clock.slice(2)
        return asUser(users.schedule, () =>
            page(
                "WorkOrders/WorkOrderDetail/Operations",
                {
                    workEffortId: run3.runId,
                    moveOperationId: run3.assemble,
                    moveFacilityId: ids.lineId,
                    moveStart: state.day(2) + " " + start,
                    lastStandalone: "true"
                },
                "html"
            )
        )
    },
    then(result) {
        result.errors.length == 0
        result.output.includes("Reschedule")
        result.output.includes("Move preview")
        result.output.includes("No conflict")
    }
})
