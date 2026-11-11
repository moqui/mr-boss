// Insights P4's "usable when" (impl-insights P4; design-insights §13.3 "Single report owner" and the dashboard half of "Same metric
// on many surfaces"), server side through the screens and their transitions on the demo data: a Customer Service manager finds
// Service level compliance in Reports, pins it and opens it in Customer Service with the organization in scope; a warehouse reader
// finds Stock at date and not the Accounting statements; SalesAnalysis is one entry, Sales'; the Store operations orders panel's
// meaning shows its basis and that recurring base orders are excluded, and its count of a store's orders in a month agrees with
// Commerce's OnlineSales for the same store and month. The rules are the regression InsightsCatalog; Mantle's sales datasets are
// admitted by InsightsDatasetsUsable first. Written with P4, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsCatalogUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const G = "ironstone.insights.RegistryServices."
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const storeId = "POPC_DEFAULT"

function render(user, path, parameters, method) {
    return asUser(user, () => {
        const test = ec.screen.makeTest().rootScreen(webroot)
        if (!method) test.renderMode("qvt").withStaticData()
        const result = test.render(
            "apps/Insights/" + path,
            Object.assign(method ? {} : {lastStandalone: "true"}, parameters),
            method || null
        )
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        return {
            status: result.status,
            output,
            location: String(result.header?.("Location") || ""),
            errors: Array.from(result.errorMessages || [])
                .concat(failed)
                .join(" | ")
        }
    })
}

spec({
    stepwise: true,
    // the sales datasets admitted by the steward (P3's "usable when")
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
        system(() =>
            ec.entity
                .find("moqui.security.UserPreference")
                .condition("userId", "BOSS_INS_SVC_MANAGER")
                .condition("preferenceKey", "InsightsHome")
                .deleteAll()
        )
    }
})

feature("a Customer Service manager finds Service level compliance, pins it and opens it in Customer Service", {
    when() {
        const found = render(users.serviceManager, "Reports", {text: "service level"})
        const pinned = render(
            users.serviceManager,
            "Reports/pin",
            {
                entryId: "CustomerService.ServiceLevelCompliance",
                pinned: "true",
                expectedRevision: "0"
            },
            "post"
        )
        const listed = render(users.serviceManager, "Reports", {pinnedOnly: "true"})
        const context = render(users.serviceManager, "Reports", {entryId: "CustomerService.ServiceLevelCompliance"})
        const opened = render(
            users.serviceManager,
            "Reports/openReport",
            {
                entryId: "CustomerService.ServiceLevelCompliance",
                organizationPartyId: ids.organizationId,
                fromDate: "2026-10-01",
                thruDate: "2026-10-31"
            },
            "post"
        )
        const owner = asUser(users.serviceManager, () =>
            ec.screen
                .makeTest()
                .rootScreen(webroot)
                .renderMode("qvt")
                .withStaticData()
                .render(
                    "apps/CustomerService/Reports/ServiceLevelCompliance",
                    {lastStandalone: "true", organizationPartyId: ids.organizationId},
                    null
                )
        )
        return {found, pinned, listed, context, opened, ownerStatus: owner.status}
    },
    then({found, pinned, listed, context, opened, ownerStatus}) {
        found.errors == ""
        found.output.includes("Service level compliance")
        found.output.includes("Customer Service")
        pinned.errors == ""
        listed.output.includes("Service level compliance")
        listed.output.includes("Unpin")
        context.output.includes("Open Service level compliance")
        context.output.includes("Ziziwork Retail")
        opened.errors == ""
        opened.location.includes("/qapps/CustomerService/Reports/ServiceLevelCompliance")
        opened.location.includes("organizationPartyId=" + ids.organizationId)
        ownerStatus == 200
    }
})

feature("a warehouse reader finds Stock at date and not the Accounting statements; SalesAnalysis is one entry", {
    when() {
        const warehouse = render(users.warehouse, "Reports", {})
        const finance = asUser(users.finance, () => invoke(G + "find#Reports", {text: "sales analysis"}).reports)
        return {warehouse, finance}
    },
    then({warehouse, finance}) {
        warehouse.errors == ""
        warehouse.output.includes("Stock at date")
        warehouse.output.includes("Operations history")
        !warehouse.output.includes("Balance sheet")
        !warehouse.output.includes("Trial balance")
        finance.map(row => row.entryId + " " + row.ownerApp + " " + row.url) ==
            ["Sales.SalesAnalysis Sales /qapps/Accounting/Reports/SalesAnalysis"]
    }
})

feature("the orders panel's meaning shows its basis and the base-order exclusion, and agrees with Commerce's OnlineSales", {
    when() {
        const board = render(users.reader, "Dashboard", {definitionId: "boss-commerce-store-operations"})
        // a month of the store's placed orders, by the dashboard's orders query (bases excluded) and by Commerce's report;
        // the month is the reporting user's calendar month (OnlineSales' period, in their time zone)
        const latest = system(() =>
            ec.entity
                .find("mantle.order.OrderHeader")
                .condition("productStoreId", storeId)
                .condition("placedDate", "is-not-null", null)
                .orderBy("-placedDate")
                .one()
        )
        if (!latest) return {board, month: null}
        const {month, from, thru} = asUser(users.system, () => {
            const range = ec.user.getPeriodRange("month", "0", String(Number(latest.placedDate)))
            return {
                month: ec.l10n.format(latest.placedDate, "yyyy-MM"),
                from: new Date(Number(range[0])).toISOString(),
                thru: new Date(Number(range[1])).toISOString()
            }
        })
        // both read the sales index (the panel its order parts, OnlineSales its order items): other walks write orders as
        // records (CommerceReviewsScenario's delivered orders) and the feed can leave an item document at a status the order
        // has left, so the month's sales documents are indexed again first and both count the orders as they are
        system(() =>
            ["MantleSalesOrderPart", "MantleSalesOrderItem"].forEach(dataDocumentId =>
                ec.service
                    .sync()
                    .name("org.moqui.search.SearchServices.index#DataFeedDocuments")
                    .parameters({dataFeedId: "MantleSales", dataDocumentId, fromUpdateStamp: new Date(Date.parse(from))})
                    .call()
            )
        )
        const panel = system(
            () => invoke(R + "get#Definition", {definitionId: "boss-commerce-store-operations"}).definition.body.panels.orders
        )
        const query = Object.assign({}, panel.queries[0], {
            filters: (panel.queries[0].filters || []).concat([
                {query: {field: {name: "productStoreId", op: "eq", value: storeId}}}
            ]),
            aggregations: [{id: "orders", type: "cardinality", role: "metric", params: {field: "orderId"}}]
        })
        // the range is the query's own (from and thru beside it were ignored, leaving the engine's default last 7 days)
        const frames = asUser(users.system, () => invoke(R + "run#Query", {query: Object.assign({}, query, {from, thru})}))
        const sales = asUser(
            users.system,
            () =>
                invoke("ironstone.commerce.ReportingServices.get#OnlineSales", {
                    appRoot: "Commerce",
                    productStoreId: storeId,
                    interval: "M",
                    periodDate: month + "-15",
                    periodCount: 1
                }).answer
        )
        return {board, month, frames, sales}
    },
    then({board, month, frames, sales}) {
        board.errors == ""
        board.output.includes("What the measures mean")
        board.output.includes("Placed date")
        board.output.includes("Recurring base orders are templates")
        month != null
        // the panel's count of the store's orders and OnlineSales' order count, each currency's together
        const panelCount = Number(JSON.stringify(frames).match(/"orders"[^0-9]*([0-9]+)/)?.[1] ?? -1)
        const reportCount = Array.from(sales.totalRows || []).reduce((sum, row) => sum + Number(row.orderCount || 0), 0)
        panelCount == reportCount
    }
})
