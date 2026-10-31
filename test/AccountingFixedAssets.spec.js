// Fixed assets screens over the demo's assets (BOSS_ACCT_FA_*): the list with their book state, the asset classes with
// Add class for the finance administrator, EquipmentDetail's book with Capitalize for GL posting and Repair acquire cost
// for the finance administrator only, and a depreciation run's results with the printer that has no cost failing. The book
// services themselves are tested in mr-mantle's AccountingFixedAssets; the capitalize-and-post walk is
// test/client/AccountingFixedAssetsWalk.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const van = {assetId: "BOSS_ACCT_FA_VAN"}
const forklift = {assetId: "BOSS_ACCT_FA_FORKLIFT"}
// The demo organization's fiscal month of today.
function currentMonth() {
    const day = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    return ec.entity
        .find("mantle.party.time.TimePeriod")
        .condition({partyId: helper().ids.organizationPartyId, timePeriodTypeId: "FiscalMonth"})
        .condition("fromDate", "less-equals", day)
        .condition("thruDate", "greater-equals", day)
        .disableAuthz()
        .one().timePeriodId
}

feature("the asset list shows each asset's book state; GL posting may run depreciation and a reader may not", {
    when() {
        return {
            gl: helper().asUser("finance.gl", () => helper().page("FixedAssets/FixedAssets", {}, "html"), false),
            reader: helper().asUser("finance.read", () => helper().page("FixedAssets/FixedAssets", {}, "html"), false),
            classes: helper().asUser("finance.gl", () => helper().page("FixedAssets/AssetClasses", {}), false),
            adminClasses: helper().asUser("finance.admin", () => helper().page("FixedAssets/AssetClasses", {}), false)
        }
    },
    then({gl, reader, classes, adminClasses}) {
        gl.errors.length == 0 && gl.output.includes("Delivery van") && gl.output.includes("Warehouse forklift")
        gl.output.includes("In service") && gl.output.includes("Not capitalized") && gl.output.includes("Run depreciation")
        reader.errors.length == 0 && reader.output.includes("Delivery van") && !reader.output.includes("Run depreciation")
        classes.errors.length == 0 && classes.output.includes("Trucks") && !classes.output.includes("AddClassDialog")
        adminClasses.errors.length == 0 && adminClasses.output.includes("AddClassDialog")
    }
})
feature("EquipmentDetail shows the book; Capitalize for GL posting, Repair acquire cost for the finance administrator", {
    when() {
        return {
            glVan: helper().asUser("finance.gl", () => helper().page("FixedAssets/EquipmentDetail", van), false),
            readerVan: helper().asUser("finance.read", () => helper().page("FixedAssets/EquipmentDetail", van), false),
            adminForklift: helper().asUser("finance.admin", () => helper().page("FixedAssets/EquipmentDetail", forklift), false),
            tui: helper().asUser("finance.gl", () => helper().page("FixedAssets/EquipmentDetail", forklift, "tui"), false),
            missing: helper().asUser(
                "finance.gl",
                () => helper().page("FixedAssets/EquipmentDetail", {assetId: "NO_SUCH_ASSET"}),
                false
            )
        }
    },
    then({glVan, readerVan, adminForklift, tui, missing}) {
        glVan.errors.length == 0 && glVan.output.includes("Not capitalized") && glVan.output.includes("CapitalizeDialog")
        !glVan.output.includes("RepairCostDialog")
        readerVan.errors.length == 0 && readerVan.output.includes("Delivery van") && !readerVan.output.includes("CapitalizeDialog")
        adminForklift.errors.length == 0 && adminForklift.output.includes("In service")
        adminForklift.output.includes("AdjustBookDialog") && adminForklift.output.includes("RepairCostDialog")
        adminForklift.output.includes("Capitalized") && !adminForklift.output.includes("CapitalizeDialog")
        tui.errors.length == 0 && tui.output.includes("Warehouse forklift")
        missing.output.includes("This equipment is not available in this app.")
    }
})
feature("a depreciation preview shows each asset's month and the printer without a cost failing", {
    when() {
        return helper().asUser(
            "finance.gl",
            () => {
                const run = helper().call("mantle.ledger.AssetBookServices.preview#Depreciation", {
                    organizationPartyId: helper().ids.organizationPartyId,
                    timePeriodId: currentMonth()
                })
                return {
                    run,
                    scope: helper().page("FixedAssets/DepreciationRunDetail", {}),
                    detail: helper().page("FixedAssets/DepreciationRunDetail", {periodRunId: run.periodRunId}, "html"),
                    tui: helper().page("FixedAssets/DepreciationRunDetail", {periodRunId: run.periodRunId}, "tui"),
                    missing: helper().page("FixedAssets/DepreciationRunDetail", {periodRunId: "_NA_"})
                }
            },
            false
        )
    },
    then({run, scope, detail, tui, missing}) {
        run.failedCount == 1
        scope.errors.length == 0 && scope.output.includes("Calculate a month's depreciation")
        detail.errors.length == 0 && detail.output.includes("Warehouse forklift") && detail.output.includes("Label printer")
        detail.output.includes("has no Acquire Cost") && detail.output.includes("Post depreciation")
        tui.errors.length == 0 && tui.output.includes("Label printer")
        missing.output.includes("This depreciation run is not available.")
    }
})
