// Sales P18's "usable when" (impl-sales P18; design-sales §14.3 scenario 11; §8 Forecast and TargetAttainment, §9 Targets): sales.rep
// submits their forecast for Retail's 2026 Q4 through Forecast's Submit forecast beside the calculated pipeline; sales.manager's
// roll-up (Retail East's forecast) drills to the same deals the rep's weighted pipeline counts, each once, and never adds the rep's
// entered forecast to its own; a manager's new target for sales.rep2 measured on placed orders is set through Targets; and Target
// attainment compares the won-deal targets with the won amount alone, never adding order or invoice amounts, while the order target
// counts placed orders. Every write through the screens' transitions; the rules are Mantle's SalesForecasts. Demo data:
// data/BossZSalesDemoData.xml (P4 and P18 blocks).
// Run: ./moq accept mr-boss --spec SalesForecastScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const F = "mantle.sales.ForecastServices."
const asService = (user, action) => asUser(user, () => system(action))
// a screen transition as the user: the render's errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "POST")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return errors
    })
}
const forecastOf = (user, salesForecastId) => asService(user, () => invoke(F + "get#Forecast", {salesForecastId, pageSize: 100}))
const amountOf = (found, measureKey) =>
    Number(String(Array.from(found.measures || []).find(row => row.measureKey === measureKey)?.amount ?? "NaN"))
const dealIds = found =>
    Array.from(found.dealList || [])
        .filter(row => row.included)
        .map(row => row.salesOpportunityId)
const shared = {}

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("a rep submits a forecast for the quarter beside the calculated pipeline", {
    when() {
        const before = forecastOf(users.rep, ids.forecasts.rep)
        const errors = post(users.rep, "Pipeline/Forecast/storeForecast", {
            salesForecastId: ids.forecasts.rep,
            forecastAmount: "26000",
            bestCaseAmount: "42000",
            reason: "Wingtip's refit is close",
            expectedRevision: before.forecast.revision
        })
        const after = forecastOf(users.rep, ids.forecasts.rep)
        shared.repDeals = dealIds(after)
        shared.repWeighted = amountOf(after, "weighted")
        return {errors, before, after}
    },
    then({errors, before, after}) {
        errors.length == 0
        Number(String(after.forecast.forecastAmount)) == 26000
        Number(String(after.forecast.bestCaseAmount)) == 42000
        // the judgement changed; the calculated pipeline did not
        amountOf(after, "weighted") == amountOf(before, "weighted")
        shared.repDeals.includes(ids.deals.wingtip)
        shared.repDeals.includes(ids.deals.kim)
    }
})

feature("the manager's roll-up drills to the same deals, each once, and never adds the rep's forecast to its own", {
    when() {
        const east = forecastOf(users.manager, ids.forecasts.east)
        return {east, deals: Array.from(east.dealList || [])}
    },
    then({east, deals}) {
        shared.repDeals.every(id => dealIds(east).includes(id))
        deals.length == new Set(deals.map(row => row.salesOpportunityId)).size
        amountOf(east, "weighted") >= shared.repWeighted
        east.forecast.forecastAmount == null
        east.children.some(row => row.forecastText.includes("26,000"))
    }
})

feature("a manager sets a target measured on placed orders through Targets", {
    when() {
        const target = asService(users.manager, () =>
            Array.from(invoke(F + "find#Targets", {organizationPartyId: ids.organizationId}).targetList || []).find(
                row => row.salesForecastId === ids.forecasts.rep2
            )
        )
        const errors = post(users.manager, "Settings/Targets/storeTarget", {
            salesForecastId: ids.forecasts.rep2,
            quotaAmount: "45000",
            basisEnumId: "SfbPlacedOrder",
            reason: "Raised for the quarter",
            expectedRevision: target.revision
        })
        return {errors, after: forecastOf(users.manager, ids.forecasts.rep2)}
    },
    then({errors, after}) {
        errors.length == 0
        Number(String(after.forecast.quotaAmount)) == 45000
        after.forecast.basisEnumId == "SfbPlacedOrder"
    }
})

feature("attainment against a won-deal target never adds order or invoice amounts to it", {
    when() {
        const found = asService(users.manager, () =>
            invoke(F + "get#TargetAttainment", {
                organizationPartyId: ids.organizationId,
                timePeriodId: ids.periods.q4,
                currencyUomId: "USD"
            })
        )
        const rows = Array.from(found.resultList || [])
        const retail = forecastOf(users.manager, ids.forecasts.retail)
        return {
            rows,
            east: rows.find(row => row.salesForecastId === ids.forecasts.east),
            rep2: rows.find(row => row.salesForecastId === ids.forecasts.rep2),
            eastWon: amountOf(forecastOf(users.manager, ids.forecasts.east), "won"),
            retailOrders: amountOf(retail, "orders"),
            retailInvoices: amountOf(retail, "invoices")
        }
    },
    then(r) {
        r.east.basisEnumId == "SfbWonOpportunity"
        Number(String(r.east.actualAmount)) == r.eastWon
        r.rep2.basisEnumId == "SfbPlacedOrder"
        r.rows.filter(row => row.basisEnumId === "SfbWonOpportunity").every(row => !row.basisText.includes("order"))
        r.retailOrders >= 0 && r.retailInvoices >= 0
    }
})
