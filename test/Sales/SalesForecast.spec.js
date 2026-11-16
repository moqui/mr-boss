// Sales' forecast screen (impl-sales P18; design-sales §8 Forecast): Forecast's one qvt render as sales.rep for Retail's 2026 Q4 (their
// own key: the quota and its basis, the weighted pipeline of Wingtip's refit, the won Kim Park renewal, the submitted forecast beside
// them, the deals with whether each counts, Submit forecast; not sales.rep2's Contoso pilot nor the maintenance plan closing next
// year); with no organization chosen, a manager of two organizations is asked to choose one, not told the forecast is unavailable.
// The rules (the weighted amount, the reasons, the roll-up, the refusals, attainment by basis) are Mantle's SalesForecasts;
// the target's access case is SalesAccess'. Demo data: data/BossZSalesDemoData.xml (P4 and P18 blocks).
// Run: ./moq test mr-boss --spec SalesForecast
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, page} = lib

feature("Forecast shows a rep's calculated pipeline beside their submitted forecast, with the deals behind it", {
    when() {
        return asUser(users.rep, () =>
            page("Pipeline/Forecast", {
                organizationPartyId: ids.organizationId,
                timePeriodId: ids.periods.q4,
                currencyUomId: "USD"
            })
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Ziziwork Retail 2026 Q4")
        rendered.output.includes("Weighted pipeline")
        rendered.output.includes("Won opportunity value")
        rendered.output.includes("30,000.00")
        rendered.output.includes("24,000.00")
        rendered.output.includes("40,000.00")
        rendered.output.includes("Wingtip stores refit")
        rendered.output.includes("Kim Park renewal")
        rendered.output.includes("5,000.00")
        rendered.output.includes("Submit forecast")
        !rendered.output.includes("Contoso lab pilot")
        !rendered.output.includes("Wingtip maintenance plan")
    }
})

feature("Forecast with no organization asks a user of several organizations to choose one", {
    when() {
        return asUser(users.bothManager, () => page("Pipeline/Forecast", {}, "html"))
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Choose an organization to see its forecast.")
        !rendered.output.includes("This forecast is not available to you.")
    }
})

feature("Forecast's find keeps the chosen period and person named when they are not among the choices searched", {
    when() {
        const choices = "ironstone.sales.ContextServices.get#Choices"
        const options = (choice, selected) =>
            asUser(users.rep, () =>
                lib.invoke(choices, {choice, organizationPartyId: ids.organizationId, term: "no such name", selected}).options || []
            )
        return {
            period: options("salesPeriods", ids.periods.q4),
            subject: options("forecastSubjects", "BOSS_SAL_REP"),
            unknown: options("salesPeriods", "NO_SUCH_PERIOD")
        }
    },
    then({period, subject, unknown}) {
        period.length == 1 && period[0].value == ids.periods.q4 && period[0].label != ids.periods.q4
        subject.length == 1 && subject[0].value == "BOSS_SAL_REP" && subject[0].label != "BOSS_SAL_REP"
        unknown.length == 0
    }
})
