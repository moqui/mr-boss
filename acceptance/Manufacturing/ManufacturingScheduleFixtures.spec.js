// The schedule walk's fixture (impl-manufacturing P12): three released runs of DEMO_1_1 named "Schedule walk 1" to 3 with their
// operations placed on a Monday a week or more on (ManufacturingSpecLib.scheduleFixture), so ManufacturingScheduleWalk drags
// its own operations; the runs of an earlier load are taken off the schedule first. Nothing here is in data/, where a
// production load could reach it.
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
spec({
    cleanup() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})
feature("the schedule walk's runs are released with their operations on next week's Monday", {
    expect() {
        const fixture = lib.scheduleFixture("Schedule walk")
        fixture.runs.length == 3
        fixture.runs.every(run => run.assemble && run.test)
    }
})
