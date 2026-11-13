// Maintenance P11's "usable when" (impl-maintenance P11; design-maintenance §11.2 "Labor cost and qualification", its cost half, and
// "Reports and scope" in part; §3 WorkCosts, §8 MaintenanceCostReport, "Charging a project"), as an acceptance walk with artifact
// authorization on: the compressor's motor repair (the demo's held work order with the rewind on order) is resumed and started,
// charged to the support project, a drive belt issued to it, two hours of the technician's time approved and the rewind accepted;
// maint.cost reads its parts, labor and outside service with their sources on WorkOrderDetail's Costs tab and in
// MaintenanceCostReport (with its CSV), labor at Services' costing rate of the technician's class and never the person's own rate;
// the planner's WorkOrderDetail has no Costs tab and the tab and the report are refused to them; and the support project's money
// shows the repair as a project cost. The rules are Mantle's MaintenanceCosts and BOSS's MaintenanceCosts and MaintenanceAccess.
// Run: ./moq accept mr-boss --spec MaintenanceCostWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page, screenRefusal, shell} = lib
const state = {}
const project = "SUPP"
let keySeq = 0
const key = name => name + "-" + Date.now() + "-" + ++keySeq
const S = "mantle.work.MaintenanceServices."
const hoursAgo = hours => new Date(Date.now() - hours * 3600000)

// a Mantle service as the user, with the artifact check aside (the steps before the walk's reads; their own checks decide)
const as = (user, service, parameters) =>
    asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(service, parameters)
    })
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const revision = workEffortId => rows("mantle.work.maintenance.MaintenanceWorkOrder", {workEffortId})[0].revision

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        state.work = ids.heldOrderId
        // the motor waits for its rewind: the supervisor resumes it, the planner adds maint.tech (who issues stock) beside maint.tech2
        // and charges it to the support project, and maint.tech2 starts it
        as(users.supervisor, S + "transition#MaintenanceWorkOrder", {workEffortId: state.work, action: "resume"})
        as(users.planner, S + "schedule#MaintenanceWorkOrder", {
            workEffortId: state.work,
            assigneePartyIds: [ids.techPartyId, ids.tech2PartyId]
        })
        as(users.planner, S + "store#MaintenanceWorkOrder", {
            workEffortId: state.work,
            expectedRevision: revision(state.work),
            projectWorkEffortId: project
        })
        as(users.tech2, S + "transition#MaintenanceWorkOrder", {workEffortId: state.work, action: "start"})
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a belt is issued to the repair, the technician's two hours are approved and the rewind is accepted", {
    when() {
        // the belt planned and issued from Services' stock warehouse by maint.tech
        as(users.planner, "mantle.work.MaintenanceExecutionServices.store#MaintenanceMaterial", {
            workEffortId: state.work,
            productId: "BOSS_MNT_PART_BELT",
            estimatedQuantity: 1
        })
        const issued = as(users.tech, "mantle.work.MaintenanceExecutionServices.issue#MaintenanceMaterial", {
            operationKey: key("cost-walk-belt"),
            workEffortId: state.work,
            productId: "BOSS_MNT_PART_BELT",
            assetId: "BOSS_MNT_STOCK_BELT",
            quantity: 1
        }).result
        // two hours of maint.tech2 (a service technician, People's class) on the motor, the timesheet approved; a vendor rate
        // written on the entry is never read
        const time = as(users.tech2, S + "record#MaintenanceTime", {
            workEffortId: state.work,
            fromDate: hoursAgo(3),
            thruDate: hoursAgo(1),
            comments: "Pulled the motor for the rewind"
        })
        state.timeEntryId = time.timeEntryId
        system(() => {
            const entry = ec.entity.find("mantle.work.time.TimeEntry").condition("timeEntryId", state.timeEntryId).one()
            let timesheetId = entry.timesheetId
            if (!timesheetId)
                timesheetId = invoke("create#mantle.work.time.Timesheet", {
                    partyId: entry.partyId,
                    statusId: "TmshInProcess"
                }).timesheetId
            invoke("update#mantle.work.time.TimeEntry", {
                timeEntryId: state.timeEntryId,
                timesheetId,
                emplPositionClassId: "BOSS_PPL_JC_TECH",
                vendorHourRate: 77
            })
            invoke("update#mantle.work.time.Timesheet", {timesheetId, statusId: "TmshApproved"})
        })
        // the supervisor (Warehouse's receiver) accepts the rewind
        const accepted = as(users.supervisor, S + "accept#MaintenanceService", {
            workEffortId: state.work,
            orderId: ids.rewindOrderId,
            orderItemSeqId: "01",
            acceptedQuantity: 1,
            operationKey: key("cost-walk-rewind")
        })
        return {issued, accepted}
    },
    then({issued, accepted}) {
        issued.resultCode == "ISSUED"
        !!state.timeEntryId
        !!accepted.serviceAcceptanceId || accepted.alreadyApplied == true
    }
})

feature("maint.cost reads the repair's parts, labor and outside service with their sources, never a person's rate", {
    when() {
        const tab = asUser(users.cost, () =>
            page("WorkOrders/WorkOrderDetail/Costs", {workEffortId: state.work, lastStandalone: "true"})
        )
        const report = asUser(users.cost, () => page("Reports/MaintenanceCostReport", {assetId: ids.motorId}))
        const csv = asUser(users.cost, () =>
            String(
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Maintenance.xml")
                    .render("Reports/MaintenanceCostReport/exportCsv", {assetId: ids.motorId}, null).output || ""
            )
        )
        return {tab, report, csv}
    },
    then({tab, report, csv}) {
        tab.errors.length == 0
        // the belt at its cost, two hours at 48 USD of the service technicians' class, the rewind as accepted
        tab.output.includes("Part issued")
        tab.output.includes("$42.00")
        tab.output.includes("$96.00")
        tab.output.includes("$48.00/h · Service technician")
        tab.output.includes("Service accepted")
        tab.output.includes("$480.00")
        tab.output.includes("IronStone support desk")
        !tab.output.includes("$77")
        report.errors.length == 0
        report.output.includes(state.work)
        report.output.includes("$618.00")
        csv.includes('"' + state.timeEntryId + '"')
        csv.includes('"Motor rewind (outside service)"')
        !csv.includes("77")
    }
})

feature("the planner's WorkOrderDetail has no Costs tab, and the tab and the report are refused to them", {
    when() {
        const tabs = user =>
            shell(user, true, "WorkOrders/WorkOrderDetail/Overview?workEffortId=" + state.work, "WorkOrderDetail").names
        return {
            plannerTabs: tabs(users.planner),
            costTabs: tabs(users.cost),
            plannerTab: screenRefusal(users.planner, "WorkOrders/WorkOrderDetail/Costs", {workEffortId: state.work}),
            plannerReport: screenRefusal(users.planner, "Reports/MaintenanceCostReport")
        }
    },
    then({plannerTabs, costTabs, plannerTab, plannerReport}) {
        plannerTabs.includes("Overview")
        !plannerTabs.includes("Costs")
        costTabs.includes("Costs")
        plannerTab != ""
        plannerReport != ""
    }
})

feature("the support project's money shows the repair as a project cost", {
    when() {
        return page("Projects/ProjectDetail/Money", {workEffortId: project, lastStandalone: "true"}, "qvt", "Projects")
    },
    then(money) {
        money.errors.length == 0
        money.output.includes("Maintenance · 1")
        money.output.includes("Compressor motor vibration")
        money.output.includes("$618.00")
    }
})
