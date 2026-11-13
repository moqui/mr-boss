// The subcontracting walk's fixture (impl-manufacturing P14): a released work order of Retail's demo method of DEMO_1_1 at its
// plant, whose operation ManufacturingSubcontractWalk asks to be done by a supplier, and a current supply plan of the plant
// for the buyer to convert it in. A new work order each load: the walks' database outlives a run (F60). Nothing here is in
// data/, where a production load could reach it.
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, invoke} = lib
const P = "mantle.work.ProductionServices."
spec({
    cleanup() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})
feature("the subcontracting walk's work order is released with its operations, and the plant has a current plan", {
    expect() {
        const stamp = Date.now()
        const made = asUser(
            users.plan,
            () => {
                const created = invoke(P + "create#ProductionOrder", {
                    operationKey: "walk-p14-run-" + stamp,
                    organizationPartyId: "ORG_ZIZI_RETAIL",
                    productId: ids.productId,
                    productBomId: ids.methodId,
                    quantity: 2,
                    facilityId: ids.plantId,
                    workEffortName: "Walk subcontracted assemblies"
                })
                const released = invoke(P + "release#ProductionOrder", {
                    operationKey: "walk-p14-release-" + stamp,
                    workEffortId: created.workEffortId
                })
                const plan = invoke("mantle.product.SupplyPlanningServices.run#SupplyPlan", {
                    facilityIds: [ids.plantId],
                    productIds: [ids.serviceProductId]
                })
                return {operations: released.result.operationWorkEffortIds || [], planningRunId: plan.planningRunId}
            },
            false
        )
        made.operations.length > 0
        made.planningRunId != null
    }
})
