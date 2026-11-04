// Purchasing's Replenishment (impl-purchasing P14a; design-purchasing §8): the shared SupplyPlanning with the Purchasing
// context (its one qvt render: the buying organization's warehouse, buy suggestions by default, the buyer's conversion
// action), the buyer's conversion through its transition into a draft purchase order, Home's shortfall count with the plan's
// date, ReorderRules' rule list (its one html render, with the stock planner's New rule and a snooze) and the Purchasing
// context of InventoryAvailability's Policy (its html render, with the snooze). The rules themselves are Mantle's
// (mr-mantle test/product/Replenishment); the facility's access rule is PurchasingAccess's; the usable-when walk is the
// acceptance PurchasingReplenishmentWalk.
// Run: ./moq test mr-boss --spec PurchasingReplenishment
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.product.SupplyPlanningServices."
const fixture = {
    productId: "BOSS_PUR_SPEC_RPL",
    productName: "Spec replenished part",
    orderId: "BOSS_PUR_SPEC_RPL_SO",
    quantity: 6,
    ruleProductId: "BOSS_PUR_SPEC_RULE",
    ruleProductName: "Spec reorder rule part"
}
const state = {}
const planOf = username =>
    asUser(username, () => invoke(S + "get#SupplyPlan", {facilityIds: [ids.facilityId], methodEnumId: "PsmBuy"}), false)
const suggestionOf = plan => (plan.suggestions || []).find(row => row.productId === fixture.productId) || {}

spec({
    setupSpec() {
        lib.replenishmentFixture(fixture)
        lib.replenishmentFixture({productId: fixture.ruleProductId, productName: fixture.ruleProductName})
        asUser(
            users.planner,
            () => invoke(S + "run#SupplyPlan", {facilityIds: [ids.facilityId], productIds: [fixture.productId]}),
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the buyer's plan shows buy suggestions of the warehouse by default, and Home counts them with the plan's date", {
    when() {
        const plan = planOf(users.buyer)
        state.suggestionId = suggestionOf(plan).planningSuggestionId
        const home = asUser(users.buyer, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {}))
        const screen = asUser(users.buyer, () => page("Replenishment/SupplyPlanning", {planFacilityId: ids.facilityId}))
        return {plan, home, screen}
    },
    then({plan, home, screen}) {
        suggestionOf(plan).methodEnumId == "PsmBuy"
        suggestionOf(plan).quantity == "6"
        suggestionOf(plan).canConvert == true
        home.counters.shortfallCount >= 1
        home.planRunText != null
        screen.status == 200
        screen.errors == []
        screen.output.includes("Spec replenished part")
        screen.output.includes("Make draft purchase orders")
        // the Purchasing context: the facility drop-down, not Manufacturing's plant
        !screen.output.includes("Choose a plant")
    }
})

feature("converting from the screen adds the suggestion to a draft purchase order of its supplier", {
    when() {
        const converted = asUser(users.buyer, () =>
            page("Replenishment/SupplyPlanning/convertSuggestions", {
                planFacilityId: ids.facilityId,
                planningSuggestionIdList: [state.suggestionId],
                operationKey: "spec-p14a-convert"
            })
        )
        const suggestion = suggestionOf(planOf(users.buyer))
        const orderId = suggestion.supplies?.[0]?.orderId || "_NA_"
        const part = system(() => ec.entity.find("mantle.order.OrderPart").condition("orderId", orderId).one())
        const header = system(() => ec.entity.find("mantle.order.OrderHeader").condition("orderId", orderId).one())
        return {converted, suggestion, part, header}
    },
    then({converted, suggestion, part, header}) {
        converted.errors == []
        suggestion.stateEnumId == "PssConverted"
        suggestion.remainingQuantity == "0"
        header.statusId == "OrderOpen"
        part.vendorPartyId == ids.sharedSupplierId
        part.customerPartyId == ids.organizationId
        part.facilityId == ids.facilityId
    }
})

feature("ReorderRules lists a snoozed rule with the planner's actions, and Policy offers the snooze in the Purchasing context", {
    when() {
        const stored = asUser(
            users.planner,
            () =>
                invoke("mantle.facility.FacilityServices.store#ProductFacilityPolicy", {
                    productId: fixture.ruleProductId,
                    facilityId: ids.facilityId,
                    minimumStock: 4,
                    maximumStock: 12,
                    reorderMethodEnumId: "RdmUpToMaximum",
                    snoozeThruDate: new Date(Date.now() + 5 * 86400000),
                    snoozeReason: "Spec supplier holiday",
                    changeReason: "Spec rule"
                }),
            false
        )
        const rules = asUser(users.planner, () =>
            page("Replenishment/ReorderRules/Rules", {productId: fixture.ruleProductId}, "html")
        )
        const reader = asUser(users.read, () =>
            page("Replenishment/ReorderRules/Rules", {productId: fixture.ruleProductId}, "html")
        )
        const policy = asUser(users.planner, () =>
            page(
                "Replenishment/InventoryAvailability/Policy",
                {productId: fixture.ruleProductId, facilityId: ids.facilityId},
                "html"
            )
        )
        return {stored, rules, reader, policy}
    },
    then({stored, rules, reader, policy}) {
        stored.facilityPolicy.snoozeReason == "Spec supplier holiday"
        rules.errors == []
        rules.output.includes("Spec reorder rule part")
        rules.output.includes("Spec supplier holiday")
        rules.output.includes("Snoozed")
        rules.output.includes("New rule")
        reader.errors == []
        reader.output.includes("Spec reorder rule part")
        !reader.output.includes("New rule")
        policy.errors == []
        policy.output.includes("Snooze reorder until")
        policy.output.includes("Save stock policy")
    }
})
