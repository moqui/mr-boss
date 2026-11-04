// Manufacturing's supply planning (impl-manufacturing P13, design-manufacturing §7 SupplyPlanning and §10.3's shortage to
// finished stock), through the shared SupplyPlanning at Manufacturing/Planning/SupplyPlanning with the Manufacturing context:
// the planner recalculates Retail's plant for a sales demand of a made product and sees a make suggestion and a buy
// suggestion for its component; converting the make suggestion from the screen makes a draft work order with its supply
// // link, and converting it again answers the same work order; after a recalculation the last plan is stale and the draft
// work order's output nets the made product; the scheduler reads the plan without its actions; Home links the planner to it. The product, its released BOM and the
// order are this spec's (setupSpec), so the demo's other demand does not enter the plan (it is planned for this product).
// Run: ./moq test mr-boss --spec ManufacturingPlanning
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const S = "mantle.product.SupplyPlanningServices."
// this spec's product, component and sales order (ManufacturingSpecLib.planningFixture)
const fixture = {
    finId: "BOSS_MFG_SP_FIN",
    finName: "Spec planned assembly",
    componentId: "BOSS_MFG_SP_RM",
    componentName: "Spec planned part",
    orderId: "BOSS_MFG_SP_SO",
    organizationPartyId: "ORG_ZIZI_RETAIL"
}
const state = {}
// the plan of this spec's product at Retail's plant, as the planner, recalculated
const recalculate = () =>
    asUser(users.plan, () => invoke(S + "run#SupplyPlan", {facilityIds: [ids.plantId], productIds: [fixture.finId]}), false)
const planOf = (username, parameters = {}) =>
    asUser(username, () => invoke(S + "get#SupplyPlan", Object.assign({facilityIds: [ids.plantId]}, parameters)), false)
const suggestionOf = (plan, productId) => (plan.suggestions || []).find(row => row.productId === productId) || {}

spec({
    setupSpec() {
        lib.planningFixture(fixture)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a sales demand for a made product yields a make suggestion and a buy suggestion for its component", {
    when() {
        const ran = recalculate()
        const plan = planOf(users.plan)
        state.makeId = suggestionOf(plan, fixture.finId).planningSuggestionId
        const screen = asUser(users.plan, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        return {ran, plan, screen}
    },
    then({ran, plan, screen}) {
        ran.planningRunId != null
        suggestionOf(plan, fixture.finId).methodEnumId == "PsmMake"
        suggestionOf(plan, fixture.finId).quantity == "4"
        suggestionOf(plan, fixture.finId).canConvert == true
        suggestionOf(plan, fixture.componentId).methodEnumId == "PsmBuy"
        suggestionOf(plan, fixture.componentId).quantity == "12"
        suggestionOf(plan, fixture.componentId).canConvert == false
        screen.status == 200
        screen.errors.length == 0
        screen.output.includes("Recalculate")
        screen.output.includes("Spec planned assembly")
        screen.output.includes("Spec planned part")
        screen.output.includes("Make draft work orders")
    }
})

feature("converting the make suggestion from the screen makes a draft work order; converting it again answers it", {
    when() {
        const parameters = {plantId: ids.plantId, planningSuggestionIdList: [state.makeId]}
        const first = asUser(users.plan, () =>
            page("Planning/SupplyPlanning/convertSuggestions", Object.assign({operationKey: "spec-p13-first"}, parameters))
        )
        const again = asUser(users.plan, () =>
            page("Planning/SupplyPlanning/convertSuggestions", Object.assign({operationKey: "spec-p13-again"}, parameters))
        )
        const plan = planOf(users.plan)
        const make = suggestionOf(plan, fixture.finId)
        const supply = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.request.requirement.RequirementSupply")
                    .condition("requirementId", make.requirementId)
                    .list()
            )
        )
        const run = system(() =>
            ec.entity
                .find("mantle.work.effort.WorkEffort")
                .condition("workEffortId", supply[0]?.workEffortId || "_NA_")
                .one()
        )
        return {first, again, make, supply, run}
    },
    then({first, again, make, supply, run}) {
        first.errors.length == 0
        again.errors.length == 0
        supply.length == 1
        make.stateEnumId == "PssConverted"
        make.remainingQuantity == "0"
        make.supplies[0].workEffortId == supply[0].workEffortId
        run.statusId == "WeInPlanning"
        run.purposeEnumId == "WepProductionRun"
        run.ownerPartyId == fixture.organizationPartyId
    }
})

feature("after a recalculation the last plan is stale and nothing of it converts; the new plan nets the draft", {
    when() {
        const old = planOf(users.plan).run.planningRunId
        recalculate()
        const plan = planOf(users.plan)
        const stale = planOf(users.plan, {planningRunId: old})
        return {plan, stale}
    },
    then({plan, stale}) {
        stale.run.stale == true
        stale.run.staleReason == "A later plan replaced this one"
        stale.suggestions.every(row => row.canConvert == false)
        plan.run.stale == false
        suggestionOf(plan, fixture.finId).productId == null
        suggestionOf(plan, fixture.componentId).quantity == "12"
    }
})

feature("the scheduler reads the plan without its actions, and Home links the planner to it", {
    when() {
        const scheduler = asUser(users.schedule, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        const runBySchedule = asUser(
            users.schedule,
            () => refusal(S + "run#SupplyPlan", {facilityIds: [ids.plantId], productIds: [fixture.finId]}),
            false
        )
        const plannerHome = asUser(users.plan, () => page("Home", {}, "html"))
        const schedulerHome = asUser(users.schedule, () => page("Home", {}, "html"))
        return {scheduler, runBySchedule, plannerHome, schedulerHome}
    },
    then({scheduler, runBySchedule, plannerHome, schedulerHome}) {
        scheduler.status == 200
        scheduler.errors.length == 0
        scheduler.output.includes("Spec planned part")
        !scheduler.output.includes("Recalculate")
        !scheduler.output.includes("Make draft work orders")
        runBySchedule.includes("PERMISSION_DENIED")
        plannerHome.output.includes("Supply planning")
        !schedulerHome.output.includes("Supply planning")
    }
})

// P17 (design-manufacturing §11 "Reports and plan snapshots"): the plan's Snapshot, a print and CSV of its version and
// suggestions, for the Planning users of the plant only
feature("the plan snapshot prints the plan's version and suggestions, with CSV, for the plant's planning users only", {
    when() {
        const plant = {plantId: ids.plantId}
        return {
            screen: asUser(users.plan, () => page("Planning/SupplyPlanning", plant, "html")),
            print: asUser(users.plan, () => page("Planning/PlanSnapshot", plant, "html-print")),
            csv: asUser(users.schedule, () => page("Planning/PlanSnapshot", plant, "csv")),
            reader: asUser(users.read, () => page("Planning/PlanSnapshot", plant, "html")),
            other: asUser(users.services, () => page("Planning/PlanSnapshot", plant, "html"))
        }
    },
    then({screen, print, csv, reader, other}) {
        // the Snapshot link (its //Manufacturing route does not resolve under the test root, so its text)
        screen.output.includes("print</span> Snapshot")
        print.errors == []
        print.output.includes("Supply plan snapshot")
        print.output.includes("revision")
        print.output.includes("Spec planned part")
        csv.output.includes("Spec planned part")
        !reader.output.includes("Spec planned part")
        !other.output.includes("Spec planned part")
        other.output.includes("not available") || other.errors.length > 0
    }
})
