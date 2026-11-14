// The quote-expiring alert template (impl-sales P20, §4 Nov 14 the user's call; design-sales §1.4 CX-OPS-REPORTS L6, §16;
// report/boss-sales-quotes-expiring.json over Mantle's quote dataset mantle-sales-quotes, granted and admitted in
// data/BossSetupSalesData.xml): a Sales user's copy of the template, evaluated as its owner over the quotes of their sales scope,
// fires for the owner of an open quote valid through the next 7 days; another rep's copy (West, the quote not theirs) does not count
// it, and neither copy counts a quote valid through a later date. The dataset's row filter is Mantle's SalesQuoteDataset; copying in
// Insights is the acceptance SalesReportsUsable's pattern.
// Run: ./moq test mr-boss --spec SalesQuoteAlert
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const R = "org.moqui.report.ReportServices."
const dayMs = 24 * 60 * 60 * 1000
const shared = {rules: {}, quotes: {}}

// the user's copy of the shipped template, active: copied as its owner, then its pause lifted (an Insights activation)
function copyOf(username, key) {
    const definitionId = "sal-qexp-" + key + "-" + String(Date.now()).slice(-6)
    asUser(username, () =>
        system(() =>
            invoke(R + "copy#Definition", {
                definitionId: "boss-sales-quotes-expiring",
                newDefinitionId: definitionId,
                title: "Quotes expiring " + key
            })
        )
    )
    system(() => {
        const row = ec.entity.find("moqui.report.Definition").condition("definitionId", definitionId).useCache(false).one()
        const body = JSON.parse(String(row.bodyJson))
        body.paused = false
        delete body.pausedReason
        row.set("bodyJson", JSON.stringify(body)).update()
    })
    return definitionId
}
// the rule's series as plain rows ({labels, state, value})
function seriesOf(username, definitionId) {
    const state = asUser(username, () => system(() => invoke(R + "get#AlertState", {definitionId})))
    return JSON.parse(JSON.stringify(state.instances || []))
}

spec({
    setupSpec() {
        login("john.doe")
        const create = (orderName, days) =>
            asUser(users.rep, () =>
                system(() =>
                    invoke("mantle.order.SalesQuoteServices.create#Quote", {
                        organizationPartyId: ids.organizationId,
                        customerPartyId: ids.accounts.wingtip,
                        currencyUomId: "USD",
                        orderName,
                        validThruDate: new Date(Date.now() + days * dayMs)
                    })
                )
            ).orderId
        shared.quotes.soon = create("Expiring quote", 3)
        shared.quotes.later = create("Later quote", 30)
        system(() => {
            for (const orderId of Object.values(shared.quotes))
                ec.search.indexDocuments(ec.entity.getDataDocuments("MantleSalesQuote", {orderId}))
        })
        shared.repPartyId = system(
            () => ec.entity.find("moqui.security.UserAccount").condition("username", users.rep).one().partyId
        )
        shared.rules.rep = copyOf(users.rep, "rep")
        shared.rules.rep2 = copyOf(users.rep2, "rep2")
    },
    cleanupSpec() {
        login("john.doe")
        // each copy deleted by its owner, as the engine deletes a definition (its versions, references and alert state)
        for (const [key, definitionId] of Object.entries(shared.rules))
            asUser(users[key], () => system(() => invoke(R + "delete#Definition", {definitionId})))
    }
})

feature("a rep's copy fires for their quote expiring within 7 days, not the later one; another rep's copy does not count it", {
    when() {
        // the engine's evaluation of one rule, as its owner (the minute job's pass runs each rule so)
        const evaluated = Object.fromEntries(
            Object.entries(shared.rules).map(([key, definitionId]) => [
                key,
                asUser(users[key], () => system(() => invoke(R + "evaluate#Alerts", {definitionId})))
            ])
        )
        return {
            evaluated: JSON.parse(JSON.stringify(evaluated)),
            rep: seriesOf(users.rep, shared.rules.rep),
            rep2: seriesOf(users.rep2, shared.rules.rep2)
        }
    },
    then({evaluated, rep, rep2}) {
        evaluated.rep.failed == 0 && evaluated.rep2.failed == 0
        const own = rep.find(series => series.labels?.owner === shared.repPartyId) || {}
        own.state == "Firing"
        // the quote valid through 3 days; the one valid through 30 is outside the window
        own.value == 1
        rep2.filter(series => series.labels?.owner === shared.repPartyId) == []
    }
})
