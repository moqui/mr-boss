// Purchasing P14a's "usable when" (impl-purchasing P14, the buy part of design-purchasing §14.4 #2), as an acceptance walk
// through Replenishment's screens and transitions with artifact authorization on, as the demo planner, buyer and
// administrator of Retail at ZIRET_WH:
// - a shortage of a purchased component shows as a buy suggestion on the Purchasing mount; the buyer converts it to a draft
//   purchase order from the screen; the planner may not convert it, and a second converter's conversion is
//   DEMAND_ALREADY_COVERED with no second order;
// - the planner sets a minimum and an up-to-maximum rule from ReorderRules and from InventoryAvailability's Policy, through
//   the same store#ProductFacilityPolicy, and the plan orders up to the maximum;
// - SuggestLevels names a product without demand history and applies the rest;
// - a snoozed rule still shows its shortage.
// The request route, the drop-ship route and the customer order's reservation offer are P14b's.
// Run: ./moq accept mr-boss --spec PurchasingReplenishmentWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const manufacturing = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.product.SupplyPlanningServices."
const run = Date.now()
const made = {
    finId: "BOSS_PUR_WALK_FIN",
    finName: "Walk replenished assembly",
    componentId: "BOSS_PUR_WALK_RM",
    componentName: "Walk bought component",
    orderId: "BOSS_PUR_WALK_SO_" + run
}
const rules = {
    maxId: "BOSS_PUR_WALK_MAX",
    policyId: "BOSS_PUR_WALK_POLICY",
    historyId: "BOSS_PUR_WALK_HIST",
    noHistoryId: "BOSS_PUR_WALK_NOHIST",
    snoozeId: "BOSS_PUR_WALK_SNOOZE"
}
const state = {}
const facility = {planFacilityId: ids.facilityId}
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const planOf = (username, productIds) =>
    asUser(
        username,
        () => {
            invoke(S + "run#SupplyPlan", {facilityIds: [ids.facilityId], productIds})
            return invoke(S + "get#SupplyPlan", {facilityIds: [ids.facilityId]})
        },
        false
    )
const suggestionOf = (plan, productId) => (plan.suggestions || []).find(row => row.productId === productId) || {}
const ruleOf = productId =>
    system(() => ec.entity.find("mantle.facility.ProductFacility").condition({productId, facilityId: ids.facilityId}).one())

spec({
    setupSpec() {
        manufacturing.planningFixture(made)
        for (const [productId, productName] of Object.entries({
            [rules.maxId]: "Walk up-to-maximum part",
            [rules.policyId]: "Walk policy part",
            [rules.historyId]: "Walk part with demand",
            [rules.noHistoryId]: "Walk part without demand",
            [rules.snoozeId]: "Walk snoozed part"
        }))
            lib.replenishmentFixture({productId, productName})
        system(() => {
            // 90 issued from the warehouse in the last 90 days, a supplier lead time of 4 days
            invoke("update#mantle.product.ProductPrice", {productPriceId: rules.historyId + "_BUY", standardLeadTimeDays: 4})
            const assetId = invoke("create#mantle.product.asset.Asset", {
                productId: rules.historyId,
                facilityId: ids.facilityId,
                ownerPartyId: ids.organizationId,
                assetTypeEnumId: "AstTpInventory",
                statusId: "AstAvailable",
                hasQuantity: "Y",
                quantityOnHandTotal: 0,
                availableToPromiseTotal: 0
            }).assetId
            for (const days of [5, 35, 65])
                invoke("create#mantle.product.issuance.AssetIssuance", {
                    assetId,
                    productId: rules.historyId,
                    facilityId: ids.facilityId,
                    issuedDate: new Date(run - days * 86400000),
                    quantity: 30
                })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a purchased component's shortage is a buy suggestion; the buyer converts it, the planner may not, a second is covered", {
    when() {
        // the planner recalculates from the Purchasing mount, for the made product and its component
        const recalculated = asUser(users.planner, () =>
            page("Replenishment/SupplyPlanning/runPlan", Object.assign({productId: made.finId}, facility))
        )
        const plan = planOf(users.planner, [made.finId])
        const buy = suggestionOf(plan, made.componentId)
        const screen = asUser(users.buyer, () => page("Replenishment/SupplyPlanning", facility))
        const convertParameters = Object.assign({planningSuggestionIdList: [buy.planningSuggestionId]}, facility)
        const planner = asUser(users.planner, () =>
            page(
                "Replenishment/SupplyPlanning/convertSuggestions",
                Object.assign({operationKey: "walk-p14a-planner"}, convertParameters)
            )
        )
        const converted = asUser(users.buyer, () =>
            page(
                "Replenishment/SupplyPlanning/convertSuggestions",
                Object.assign({operationKey: "walk-p14a-" + run}, convertParameters)
            )
        )
        const competing = asUser(
            users.admin,
            () =>
                invoke(S + "convert#PlanningSuggestions", {
                    operationKey: "walk-p14a-admin-" + run,
                    planningSuggestionIds: [buy.planningSuggestionId]
                }),
            false
        )
        const supply = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.request.requirement.RequirementSupply")
                    .condition("requirementId", buy.requirementId)
                    .list()
            )
        )
        return {recalculated, buy, screen, planner, converted, competing, supply}
    },
    then({recalculated, buy, screen, planner, converted, competing, supply}) {
        recalculated.errors == []
        buy.methodEnumId == "PsmBuy"
        buy.supplierPartyId == ids.sharedSupplierId
        buy.quantity == "12"
        opened(screen)
        screen.output.includes("Walk bought component")
        screen.output.includes("Make draft purchase orders")
        // the planner's conversion is refused by the buy capability's check
        planner.errors.join(" ").includes("PERMISSION_DENIED")
        converted.errors == []
        supply.length == 1
        supply[0].orderId != null
        competing.results[0].reasonCode == "DEMAND_ALREADY_COVERED"
        competing.results[0].message.includes(supply[0].orderId)
    }
})

feature("a planner sets a minimum and up-to-maximum rule from ReorderRules and from Policy, and the plan orders up to it", {
    when() {
        const fromRules = asUser(users.planner, () =>
            page("Replenishment/ReorderRules/Rules/storeRule", {
                productId: rules.maxId,
                facilityId: ids.facilityId,
                minimumStock: 5,
                maximumStock: 25,
                reorderMethodEnumId: "RdmUpToMaximum",
                changeReason: "Walk rule"
            })
        )
        const fromPolicy = asUser(users.planner, () =>
            page("Replenishment/InventoryAvailability/Policy/stockPolicy", {
                productId: rules.policyId,
                facilityId: ids.facilityId,
                minimumStock: 3,
                maximumStock: 9,
                reorderMethodEnumId: "RdmUpToMaximum",
                changeReason: "Walk policy"
            })
        )
        const plan = planOf(users.planner, [rules.maxId, rules.policyId])
        return {fromRules, fromPolicy, plan, maxRule: ruleOf(rules.maxId), policyRule: ruleOf(rules.policyId)}
    },
    then({fromRules, fromPolicy, plan, maxRule, policyRule}) {
        fromRules.errors == []
        fromPolicy.errors == []
        maxRule.reorderMethodEnumId == "RdmUpToMaximum"
        policyRule.reorderMethodEnumId == "RdmUpToMaximum"
        suggestionOf(plan, rules.maxId).quantity == "25"
        suggestionOf(plan, rules.policyId).quantity == "9"
    }
})

feature("SuggestLevels names a product without demand history and applies the rest", {
    when() {
        system(() => {
            for (const productId of [rules.historyId, rules.noHistoryId])
                invoke("store#mantle.facility.ProductFacility", {productId, facilityId: ids.facilityId, minimumStock: 1})
        })
        const levels = Object.assign({historyDays: 90, safetyDays: 3, coverDays: 30}, facility)
        const preview = asUser(users.planner, () =>
            page("Replenishment/ReorderRules/SuggestLevels", Object.assign({preview: "Y"}, levels), "html")
        )
        const applied = asUser(users.planner, () =>
            page(
                "Replenishment/ReorderRules/SuggestLevels/applyLevels",
                Object.assign({productIdList: [rules.historyId, rules.noHistoryId], changeReason: "Walk levels"}, levels)
            )
        )
        return {preview, applied, history: ruleOf(rules.historyId), noHistory: ruleOf(rules.noHistoryId)}
    },
    then({preview, applied, history, noHistory}) {
        opened(preview)
        preview.output.includes("Walk part without demand")
        preview.output.includes("was not issued")
        applied.errors == []
        // a daily demand of 1: 4 lead days + 3 safety days, and 30 days more at most
        Number(String(history.minimumStock)) == 7
        Number(String(history.maximumStock)) == 37
        Number(String(noHistory.minimumStock)) == 1
        noHistory.maximumStock == null
    }
})

feature("a snoozed rule still shows its shortage in the plan and the rule list", {
    when() {
        const snoozed = asUser(users.planner, () =>
            page("Replenishment/ReorderRules/Rules/storeRule", {
                productId: rules.snoozeId,
                facilityId: ids.facilityId,
                minimumStock: 4,
                snoozeThruDate: new Date(run + 10 * 86400000),
                snoozeReason: "Walk supplier shutdown",
                changeReason: "Walk snooze"
            })
        )
        const plan = planOf(users.planner, [rules.snoozeId])
        const list = asUser(users.read, () => page("Replenishment/ReorderRules/Rules", {snoozedOnly: "Y"}, "html"))
        return {snoozed, suggestion: suggestionOf(plan, rules.snoozeId), list}
    },
    then({snoozed, suggestion, list}) {
        snoozed.errors == []
        suggestion.quantity == "4"
        suggestion.snoozed == true
        suggestion.warningText.includes("Walk supplier shutdown")
        opened(list)
        list.output.includes("Walk snoozed part")
    }
})
