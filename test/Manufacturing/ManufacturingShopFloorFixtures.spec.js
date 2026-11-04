// The shop floor walk's fixture (impl-manufacturing P10): a running work order of line A named "Shop floor walk <time>"
// (ManufacturingSpecLib.shopFloorFixture), its operations assigned to the material handler, who is taken off the work orders
// of an earlier load (the walks' database outlives a run, F60), so the station's My work shows this load's; the handler's
// week back in process, so the walk's time can go on it; and a timer of the handler's on no work, which Start switches from
// after the confirmation. Nothing here is in data/, where a production load could reach it.
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {users, asUser, system, invoke} = lib
const P = "mantle.work.ProductionServices."
const WORK = "mantle.work.effort.WorkEffort"
const find = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz()
const revision = workEffortId => Number(find(WORK, {workEffortId}).one().productionRevision || 0)
spec({
    cleanup() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})
feature("the shop floor walk's work order runs on line A, assigned to the material handler, whose timer runs on no work", {
    expect() {
        // an earlier load's walk work orders: the handler is taken off them
        const earlier = system(() =>
            Array.from(
                find(WORK, {purposeEnumId: "WepProductionRun"}).condition("workEffortName", "like", "Shop floor walk %").list()
            ).filter(run =>
                find("mantle.work.effort.WorkEffortParty", {workEffortId: run.workEffortId, partyId: "BOSS_MFG_MATERIAL"}).count()
            )
        )
        for (const run of earlier)
            if (["WeApproved", "WeInProgress", "WeOnHold"].includes(run.statusId))
                asUser(
                    users.plan,
                    () =>
                        invoke(P + "store#ProductionParty", {
                            operationKey: "sfw-remove-" + run.workEffortId + "-" + Date.now(),
                            workEffortId: run.workEffortId,
                            expectedRevision: revision(run.workEffortId),
                            partyId: "BOSS_MFG_MATERIAL",
                            roleTypeId: "Assignee",
                            remove: true
                        }),
                    false
                )
        const fixture = lib.shopFloorFixture("Shop floor walk")
        asUser(
            users.plan,
            () =>
                invoke(P + "store#ProductionParty", {
                    operationKey: "sfw-assign-" + fixture.runId,
                    workEffortId: fixture.runId,
                    expectedRevision: revision(fixture.runId),
                    partyId: "BOSS_MFG_MATERIAL",
                    roleTypeId: "Assignee"
                }),
            false
        )
        // the handler's week in process (an earlier load submitted or approved it), then a timer on no work
        system(() => {
            const sheet = invoke("mantle.work.TimesheetServices.get#PartyTimesheet", {partyId: "BOSS_MFG_MATERIAL"})
            const timesheetId = sheet.timesheetId || sheet.timesheet?.timesheetId
            if (timesheetId) invoke("update#mantle.work.time.Timesheet", {timesheetId, statusId: "TmshInProcess"})
        })
        // earlier time of the handler's on Assemble (a timer the walk starts and stops at once is under a minute: discarded)
        asUser(
            users.material,
            () =>
                invoke("mantle.work.TimeServices.store#TimeEntry", {
                    workEffortId: fixture.assemble,
                    workTypeEnumId: "WktpProductionSetup",
                    fromDate: new Date(Date.now() - 40 * 60000),
                    thruDate: new Date(Date.now() - 25 * 60000),
                    comments: "Set-up"
                }),
            false
        )
        asUser(users.material, () => invoke("mantle.work.TimesheetServices.start#Timer", {comments: "Walk sweeping"}), false)
        fixture.assemble != null
        fixture.test != null
    }
})
