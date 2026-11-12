// Maintenance preventive plans in BOSS (impl-maintenance P13; design-maintenance §5 Plans and PlanDetail, §1.2): Plans' and PlanDetail's
// one qvt render each and its Schedule tab's (the planner's: the demo's three draft plans with their due; the compressor plan's header,
// its explanation naming its last
// accepted reading, its increment over the model default and its next threshold, Activate offered), a reader's plan read with no
// write, the stale plan's due answered unknown with its count meter's unit read in its name, and the plan choices (each called once, with a selected value not on its page). The
// due rules are Mantle's MaintenanceDue; the access rule is MaintenanceAccess'; EquipmentDetail's plans pane is checked on its
// Maintenance tab's render in MaintenanceWorkOrders; the "usable when" is the acceptance MaintenancePlansWalk. P14: Due maintenance's,
// the filter plan's PlanDetail level and its Due history and Generated work tabs', PM compliance's and Work policy's one render each
// (the demo's active filter plan: November's due date ready for work, August on time, September late, October skipped; one of three
// on time; the job paused); generation's rules are Mantle's MaintenanceGeneration, its access MaintenanceAccess', and the
// "usable when" the acceptance MaintenancePreventiveWalk.
// Run: ./moq test mr-boss --spec MaintenancePlans
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const P = "mantle.work.MaintenancePlanServices."

// a call as the user with the artifact check aside (the Mantle service's own permission and scope checks decide)
const as = (user, service, parameters = {}) => asUser(user, () => system(() => invoke(service, parameters)))
const options = (user, parameters) =>
    asUser(
        user,
        () =>
            invoke("ironstone.maintenance.ContextServices.get#Choices", Object.assign({appRoot: "Maintenance"}, parameters))
                .options || []
    )

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "Plans lists the planner's plans with their due; PlanDetail explains the compressor's next threshold over the model default",
    {
        when() {
            const find = asUser(users.planner, () => page("Preventive/Plans/Find", {lastStandalone: "true"}))
            const plan = {maintenanceScheduleId: ids.compressorPlanId}
            // the record's own level (its header; the shell loads the tab as its own request), then the tab alone
            const detail = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail", Object.assign({lastStandalone: "-3"}, plan))
            )
            const schedule = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail/Schedule", Object.assign({lastStandalone: "true"}, plan))
            )
            const reader = as(users.reader, P + "get#MaintenanceSchedule", {maintenanceScheduleId: ids.compressorPlanId})
            const stale = as(users.planner, P + "get#MaintenanceDue", {maintenanceScheduleId: ids.stalePlanId}).due
            // a count meter with no unit reads in its name, in the terms as in the due
            const starts = as(users.planner, P + "get#MaintenanceSchedule", {maintenanceScheduleId: ids.stalePlanId})
            return {find, detail, schedule, reader, stale, starts}
        },
        then({find, detail, schedule, reader, stale, starts}) {
            find.errors.length == 0
            find.output.includes("Room 201 monthly inspection")
            find.output.includes("Compressor C-1 oil service every 250 hours")
            find.output.includes("Compressor C-1 contactor check every 500 starts")
            find.output.includes("Oil and filter every 500 run hours")
            find.output.includes("1450 hr")
            find.output.includes("Unknown: stale reading")
            find.output.includes("New plan")
            detail.errors.length == 0
            detail.output.includes("Compressor C-1 oil service every 250 hours")
            detail.output.includes("Follows Oil and filter every 500 run hours")
            detail.output.includes("Activate")
            schedule.errors.length == 0
            schedule.output.includes("Last accepted reading 1420 hr")
            schedule.output.includes("every 250 hr (this plan; the model default is 500 hr)")
            schedule.output.includes("Next threshold 1450 hr")
            schedule.output.includes("Model default")
            schedule.output.includes("Edit terms")
            // a reader reads the plan and may change nothing
            reader.schedule.maintenanceScheduleId == ids.compressorPlanId
            reader.canEdit == false && reader.canActivate == false && reader.canEnd == false
            stale.state == "unknown"
            stale.explanation.some(line => line.includes("Reading older than 30 days"))
            starts.terms[0].intervalText == "500 starts"
            starts.term.meterUnitText == "starts"
            stale.intervalText == "Every 500 starts"
        }
    }
)

feature("the plan choices offer the model's defaults and counting meters and the holiday calendars, each with a selected value", {
    when() {
        const choice = (choice, extra = {}) => options(users.planner, Object.assign({choice}, extra))
        return {
            defaults: choice("planDefaults", {assetId: ids.compressorId}),
            meters: choice("planMeters", {assetId: ids.compressorId}),
            // People's Retail holiday calendar: Retail's planner has it chosen though the search finds none; Services' planner not
            calendars: options(users.retailPlanner, {
                choice: "holidayCalendars",
                term: "no such calendar",
                selected: "BOSS_PPL_HOL_RETAIL"
            }),
            servicesCalendars: choice("holidayCalendars", {term: "no such calendar", selected: "BOSS_PPL_HOL_RETAIL"}),
            techCalendars: options(users.tech, {choice: "holidayCalendars"})
        }
    },
    then({defaults, meters, calendars, servicesCalendars, techCalendars}) {
        defaults.some(row => row.value == "BOSS_MNT_COMP_SERVICE")
        meters.length == 2
        meters.some(row => row.label == "Run hours") && meters.some(row => row.label == "Starts")
        calendars.length == 1 && calendars[0].value == "BOSS_PPL_HOL_RETAIL"
        servicesCalendars.length == 0
        techCalendars.length == 0
    }
})

feature(
    "Due maintenance offers November's filter change; the plan's history, its work, PM compliance and the job's state read as kept (P14)",
    {
        when() {
            const plan = {maintenanceScheduleId: ids.filterPlanId}
            const due = asUser(users.planner, () => page("Preventive/DueMaintenance", {lastStandalone: "true"}))
            // the record's own level (a three-level area, F183), then each tab alone
            const detail = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail", Object.assign({lastStandalone: "-3"}, plan))
            )
            const history = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail/DueHistory", Object.assign({lastStandalone: "true"}, plan))
            )
            const work = asUser(users.planner, () =>
                page("Preventive/Plans/PlanDetail/GeneratedWork", Object.assign({lastStandalone: "true"}, plan))
            )
            const report = asUser(users.planner, () =>
                page("Reports/PreventiveComplianceReport", {lastStandalone: "true", fromDate: "2026-08-01"})
            )
            const policy = asUser(users.admin, () =>
                page("Settings/WorkPolicy", {lastStandalone: "true", organizationPartyId: ids.organizationId})
            )
            return {due, detail, history, work, report, policy}
        },
        then({due, detail, history, work, report, policy}) {
            due.errors.length == 0
            due.output.includes("Air handler AHU-2 filter change")
            due.output.includes("Make work for 2026-11-14 09:00 America/Chicago (ad hoc: no procedure)")
            due.output.includes("Generate due work")
            due.output.includes("Resolve")
            detail.errors.length == 0
            detail.output.includes("Generate work")
            detail.output.includes("Make work for 2026-11-14 09:00 America/Chicago")
            history.errors.length == 0
            history.output.includes("Unit shut down for the coil cleaning")
            history.output.includes("Skipped")
            history.output.includes("On time")
            history.output.includes("Late")
            history.output.includes("by the job")
            work.errors.length == 0
            work.output.includes("BOSS_MNT_WO_FLT_AUG")
            work.output.includes("2026-09-14 09:00 America/Chicago")
            report.errors.length == 0
            report.output.includes("33.3% on time")
            report.output.includes("Unit shut down for the coil cleaning")
            report.output.includes("Skipped")
            policy.errors.length == 0
            policy.output.includes("Make preventive work ahead (days)")
            policy.output.includes("Preventive generation job")
            policy.output.includes("Paused")
        }
    }
)
