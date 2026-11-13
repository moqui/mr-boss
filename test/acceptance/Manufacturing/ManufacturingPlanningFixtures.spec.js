// The planning walk's fixture (impl-manufacturing P13): a made product of Retail's with its released BOM, a bought component
// and a sales order at Retail's plant (ManufacturingSpecLib.planningFixture), so ManufacturingPlanningWalk plans its own
// demand. Nothing here is in data/, where a production load could reach it.
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
spec({
    cleanup() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})
feature("the planning walk's product has a released BOM and a sales demand at Retail's plant", {
    expect() {
        const productBomId = lib.planningFixture({
            finId: "BOSS_MFG_WALK_FIN",
            finName: "Walk planned assembly",
            componentId: "BOSS_MFG_WALK_RM",
            componentName: "Walk planned part",
            // a new order each load: the walks' database outlives a run, and an earlier walk's draft work order covers the
            // order it planned (F-P4-3)
            orderId: "BOSS_MFG_WALK_SO_" + Date.now()
        })
        productBomId != null
    }
})
