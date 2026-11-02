// The production walk's fixture (impl-warehouse P16a): after Products' method fixture releases DEMO_1_1's BOM and routing
// (ProductsMethodFixtures), an approved standard cost of DEMO_1_1 for ORG_ZIZI_RETAIL through Products' CostServices (when
// Chromium can render its approval PDF), then the Warehouse demo service makes and releases the demo run through Mantle's
// create#ProductionOrder and release#ProductionOrder. Nothing here is in data/, where a production load could reach it.
const C = "mantle.product.CostServices."
function as(user, fn) {
    login(user)
    ec.artifactExecution.disableAuthz()
    try {
        return fn()
    } finally {
        ec.message.clearErrors()
        login("john.doe")
    }
}
// whether Chromium renders the approval PDF here; without it the standard is left out and said so, never swallowed
function pdfAvailable() {
    try {
        ec.resource.xslFoTransform("<html><body>Production demo standard</body></html>", null, null, "application/pdf")
        return true
    } catch (error) {
        if (String(error).includes("PDF is not available")) return false
        throw error
    }
}
spec({
    dependsOn: ["ProductsMethodFixtures"],
    cleanup() {
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})
feature("the demo run of DEMO_1_1 is created from the released BOM and released with its lines and frozen standard", {
    expect() {
        const find = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz()
        const approved = find("mantle.product.cost.ProductStandardCost", {
            productId: "DEMO_1_1",
            organizationPartyId: "ORG_ZIZI_RETAIL",
            state: "approved"
        }).count()
        const withStandard = approved > 0 || pdfAvailable()
        if (!approved && withStandard) {
            const draft = as("john.doe", () => {
                const d = call(C + "store#ProductStandardCost", {
                    productId: "DEMO_1_1",
                    organizationPartyId: "ORG_ZIZI_RETAIL",
                    quantity: 1,
                    changeReason: "Production demo standard"
                })
                return call(C + "store#StandardCostComponent", {
                    productStandardCostId: d.standardCost.productStandardCostId,
                    quantity: 1,
                    quantityUomId: "OTH_ea",
                    rateAmount: 15,
                    description: "Planned unit cost",
                    changeReason: "Production demo basis"
                })
            })
            const done = as("catalog.method.walk", () =>
                call(C + "approve#ProductStandardCost", {
                    productStandardCostId: draft.standardCost.productStandardCostId,
                    expectedRevision: draft.estimateRevision,
                    changeReason: "Approved production demo standard"
                })
            )
            done.standardCost.state == "approved"
        }
        if (!withStandard) ec.logger.warn("No PDF renderer: the demo run of DEMO_1_1 has no frozen standard")
        const loaded = as("john.doe", () => call("ironstone.warehouse.DemoServices.load#ProductionDemo", {}))
        loaded.skipped == false
        const run = find("mantle.work.effort.WorkEffort", {workEffortId: loaded.workEffortId}).one()
        run.statusId == "WeApproved"
        run.ownerPartyId == "ORG_ZIZI_RETAIL"
        withStandard ? !!run.productStandardCostId : true
        const lines = Array.from(find("mantle.work.production.ProductionRunLine", {workEffortId: loaded.workEffortId}).list())
        lines.some(line => line.lineRoleEnumId === "PrlrOutput" && line.productId === "DEMO_1_1")
        lines.filter(line => line.lineRoleEnumId === "PrlrMaterial").length > 0
        lines.every(line => !!line.frozenDate)
        // a second load answers the same run
        as("john.doe", () => call("ironstone.warehouse.DemoServices.load#ProductionDemo", {})).workEffortId == loaded.workEffortId
    }
})
