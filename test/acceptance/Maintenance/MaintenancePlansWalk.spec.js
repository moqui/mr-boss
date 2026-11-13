// Maintenance P13's "usable when" (impl-maintenance P13; design-maintenance §5.1, §11.2 "PM chronology"), as an acceptance walk through
// the screens' transitions with artifact authorization on: maint.planner opens Plans, finds the demo's three draft plans and activates
// each from PlanDetail; the compressor's DueExplanation names its last accepted reading, its increment over the AC-200 model's default and
// its next threshold, and the contactor check's start counter answers "reading older than 30 days" (unknown, not "not due") until the
// resource administrator records a reading, after which its threshold is known; Room 201's monthly inspection is due on November 30
// at 09:00 in the campus' time zone; a change of the room plan's interval needs a reason, starts the next term and keeps the earlier one
// in the history; a new plan for the van naming the room procedure is refused activation (the procedure does not apply) and, with no
// procedure, is activated (the user's call, Nov 12: P14 makes its work ad hoc from its name and estimate); a reader may open a plan but
// not activate it. The rules are Mantle's MaintenanceDue and BOSS's MaintenancePlans and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenancePlansWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const P = "mantle.work.MaintenancePlanServices."
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
const activate = (user, maintenanceScheduleId) =>
    post(user, "Preventive/Plans/PlanDetail/planAction", {
        maintenanceScheduleId,
        expectedRevision: Number(plan(maintenanceScheduleId).revision),
        planAction: "activate"
    })

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        state.startedAt = Date.now()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        // the start counter's reading this walk recorded is removed, so the contactor check's reading is stale again for later
        // walks (MaintenancePreventiveWalk's generation is blocked on it)
        system(() =>
            ec.entity
                .find("mantle.product.maintenance.AssetMeter")
                .condition({assetId: ids.compressorId, productMeterId: "BOSS_MNT_COMP_STARTS"})
                .condition("readingDate", ">=", new Date(state.startedAt))
                .deleteAll()
        )
        login("john.doe")
    }
})

feature("the planner finds the three draft plans and activates each from PlanDetail; a reader may not activate one", {
    when() {
        const find = asUser(users.planner, () => page("Preventive/Plans/Find", {lastStandalone: "true"}))
        const detail = asUser(users.planner, () =>
            page("Preventive/Plans/PlanDetail", {maintenanceScheduleId: ids.roomPlanId, lastStandalone: "-3"})
        )
        const readerActivates = activate(users.reader, ids.roomPlanId)
        const activated = [ids.roomPlanId, ids.compressorPlanId, ids.stalePlanId].map(id => activate(users.planner, id))
        return {
            find,
            detail,
            readerActivates,
            activated,
            states: [ids.roomPlanId, ids.compressorPlanId, ids.stalePlanId].map(id => plan(id).statusId)
        }
    },
    then({find, detail, readerActivates, activated, states}) {
        opened(find)
        find.output.includes("Room 201 monthly inspection")
        find.output.includes("Compressor C-1 oil service every 250 hours")
        find.output.includes("Compressor C-1 contactor check every 500 starts")
        opened(detail)
        detail.output.includes("Activate")
        detail.output.includes("America/Chicago (inherited)")
        readerActivates.errors.join(" ").includes("PERMISSION_DENIED")
        activated.every(result => result.errors.length == 0)
        states.every(statusId => statusId == "MschActive")
    }
})

feature("DueExplanation names the compressor's last reading, increment and next threshold, and the stale counter's age", {
    when() {
        const tab = maintenanceScheduleId =>
            asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail/Schedule", {maintenanceScheduleId, lastStandalone: "true"})
            )
        const compressor = tab(ids.compressorPlanId)
        const stale = tab(ids.stalePlanId)
        const room = read(users.planner, P + "get#MaintenanceDue", {maintenanceScheduleId: ids.roomPlanId}).due
        // the resource administrator reads the start counter: the contactor check's due is known again
        const recorded = post(users.resources, "Equipment/EquipmentDetail/Meters/recordMeter", {
            assetId: ids.compressorId,
            meterChoice: "BOSS_MNT_COMP_STARTS",
            meterValue: 4630
        })
        const known = read(users.planner, P + "get#MaintenanceDue", {maintenanceScheduleId: ids.stalePlanId}).due
        return {compressor, stale, room, recorded, known}
    },
    then({compressor, stale, room, recorded, known}) {
        opened(compressor)
        compressor.output.includes("Last accepted reading 1420 hr")
        compressor.output.includes("every 250 hr (this plan; the model default is 500 hr)")
        compressor.output.includes("Next threshold 1450 hr")
        opened(stale)
        stale.output.includes("Reading older than 30 days")
        stale.output.includes("Unknown: stale reading")
        room.dueDateText == "2026-11-30 09:00 America/Chicago"
        recorded.errors.length == 0
        known.state == "upcoming"
        known.lastReadingValue == 4630
        known.nextThreshold == 4700
    }
})

feature("a change of the room plan's interval needs a reason, starts the next term and keeps the earlier one", {
    when() {
        const stored = read(users.planner, P + "get#MaintenanceSchedule", {maintenanceScheduleId: ids.roomPlanId}).storedTerm
        const change = Object.assign({}, stored, {
            maintenanceScheduleId: ids.roomPlanId,
            expectedRevision: Number(plan(ids.roomPlanId).revision),
            scheduleName: plan(ids.roomPlanId).scheduleName,
            intervalQuantity: 2
        })
        const noReason = post(users.planner, "Preventive/Plans/PlanDetail/Schedule/storePlan", change)
        const changed = post(
            users.planner,
            "Preventive/Plans/PlanDetail/Schedule/storePlan",
            Object.assign({}, change, {changeReason: "Every other month from now"})
        )
        const terms = rows("mantle.work.maintenance.MaintenanceScheduleTerm", {maintenanceScheduleId: ids.roomPlanId})
        const tab = asUser(users.planner, () =>
            page("Preventive/Plans/PlanDetail/Schedule", {maintenanceScheduleId: ids.roomPlanId, lastStandalone: "true"})
        )
        return {noReason, changed, terms, tab}
    },
    then({noReason, changed, terms, tab}) {
        noReason.errors.join(" ").includes("REASON_REQUIRED")
        changed.errors.length == 0
        terms.length == 2
        terms.filter(row => row.thruDate == null).length == 1
        opened(tab)
        tab.output.includes("Earlier terms")
        tab.output.includes("Every other month from now")
        tab.output.includes("Every 2 months")
    }
})

feature(
    "a new plan for the van names a procedure that does not apply and is refused activation; with no procedure it is activated",
    {
        when() {
            const created = post(users.planner, "Preventive/Plans/Find/storePlan", {
                operationKey: "walk-plan-van",
                targetKind: "equipment",
                assetId: ids.vanId,
                scheduleName: "Van 3 six-monthly service",
                triggerEnumId: "MstCalendar",
                intervalQuantity: 6,
                intervalUomId: "TF_mon",
                firstDueLocal: "2027-01-15 08:00",
                templateWorkEffortId: ids.roomProcedureId,
                estimatedWorkTime: 3
            })
            const van = rows("mantle.work.maintenance.MaintenanceSchedule", {assetId: ids.vanId}).find(
                row => row.scheduleName === "Van 3 six-monthly service"
            )
            state.van = van?.maintenanceScheduleId
            const detail = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail", {maintenanceScheduleId: state.van, lastStandalone: "-3"})
            )
            const refused = activate(users.planner, state.van)
            // the procedure taken out: the work is ad hoc, from the plan's name and estimate
            const stored = read(users.planner, P + "get#MaintenanceSchedule", {maintenanceScheduleId: state.van}).storedTerm
            const cleared = post(
                users.planner,
                "Preventive/Plans/PlanDetail/Schedule/storePlan",
                Object.assign({}, stored, {
                    maintenanceScheduleId: state.van,
                    expectedRevision: Number(plan(state.van).revision),
                    scheduleName: "Van 3 six-monthly service",
                    templateWorkEffortId: null
                })
            )
            const activated = activate(users.planner, state.van)
            return {created, van, detail, refused, cleared, activated, after: plan(state.van)}
        },
        then({created, van, detail, refused, cleared, activated, after}) {
            created.errors.length == 0
            van.statusId == "MschDraft"
            opened(detail)
            detail.output.includes("Before it can be activated")
            detail.output.includes("The procedure does not apply")
            refused.errors.join(" ").includes("PROCEDURE_NOT_QUALIFIED")
            cleared.errors.length == 0
            activated.errors.length == 0
            after.statusId == "MschActive"
        }
    }
)
