// Insights P6's "usable when" (impl-insights P6; design-insights §4 Drill and business annotations, §5 Analysis, §10, §13.3
// "Reconcile domain results", "Money, units and calendars" and the drill part of "Two organizations and confidential fields"),
// server side through the screens on the demo data: insights.reader drills the suite dashboard's orders panel to
// ORG_ZIZI_RETAIL's orders (the same orders the dataset gives them, none of another organization) and opens one in Insights'
// OrderDetail, read only, with no Approve and with the return to the drill; insights.author's analysis summing order amounts
// across currencies is refused with its reason until it is grouped by currency, then saved as a library panel; a price list
// published for ORG_ZIZI_RETAIL shows as a marker on the suite's order value panel for the Retail reader and not for the
// ORG_ZIZI_SERVICES reader. The rules are the regression InsightsRecords and the framework's ReportDrill and ReportAnnotations;
// Mantle's sales datasets are admitted by InsightsDatasetsUsable first. Written with P6, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsDrillUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const R = "org.moqui.report.ReportServices."
const DRILL = "ironstone.insights.DrillServices.get#Drill"
const A = "ironstone.insights.AnalysisServices."
const webroot = "component://webroot/screen/webroot.xml"
const suite = {definitionId: "insights-suite", panelId: "orders"}
const range = {from: "now-365d", thru: "now+1d"}
const priceListId = "INS_DRILL_USABLE_LIST"

function render(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const test = ec.screen.makeTest().rootScreen(webroot)
        if (!method) test.renderMode("qvt").withStaticData()
        const result = test.render(path, Object.assign(method ? {} : {lastStandalone: "true"}, parameters), method)
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        return {
            status: result.status,
            output,
            location: String(result.header("Location") || ""),
            errors: Array.from(result.errorMessages || [])
                .concat(failed)
                .join(" | ")
        }
    })
}
function removeSpecData() {
    system(() => ec.entity.find("mantle.product.ProductPriceList").condition("priceListId", priceListId).deleteAll())
    // the analyses the author saved here, deleted as their owner
    const saved = system(() =>
        Array.from(
            ec.entity.find("moqui.report.Definition").condition("definitionId", "like", "analysis-usable-order-value%").list()
        ).map(row => row.definitionId)
    )
    for (const definitionId of saved) asUser(users.author, () => refusal(R + "delete#Definition", {definitionId}))
}

spec({
    stepwise: true,
    // the sales datasets admitted by the steward (P3's "usable when")
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
        removeSpecData()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
    }
})

feature(
    "insights.reader drills an orders bar to ORG_ZIZI_RETAIL's orders and opens one in Insights' OrderDetail, with no Approve",
    {
        when() {
            // the dashboard's Drill opens the page with the panel; the reader chooses the first bar
            const whole = asUser(users.reader, () => invoke(DRILL, Object.assign({}, suite, range)).drill)
            const bar = Array.from(whole.panelBuckets || [])[0] || {}
            const chosen = {bucketsJson: JSON.stringify([{field: bar.groupField, value: bar.groupValue}])}
            const page = render(users.reader, "apps/Insights/Drill", Object.assign({}, suite, range, chosen))
            const drilled = asUser(users.reader, () => invoke(DRILL, Object.assign({}, suite, range, chosen)).drill)
            const orderIds = Array.from(drilled.rows || []).map(row => row.recordParameters?.orderId)
            // the organizations of the orders drilled to, read by the system
            const vendors = system(() =>
                Array.from(
                    new Set(
                        Array.from(ec.entity.find("mantle.order.OrderPart").condition("orderId", "in", orderIds).list()).map(
                            part => part.vendorPartyId
                        )
                    )
                ).join(",")
            )
            const services = asUser(users.services, () => invoke(DRILL, Object.assign({}, suite, range, chosen)).drill)
            const servicesIds = Array.from(services.rows || []).map(row => row.recordParameters?.orderId)
            const order = render(
                users.reader,
                "apps/Insights/Records/OrderDetail",
                Object.assign({orderId: orderIds[0]}, suite, range, chosen)
            )
            const approve = render(users.reader, "apps/Insights/Records/OrderDetail/approveOrder", {orderId: orderIds[0]}, "post")
            return {
                whole,
                bar,
                page,
                drilled,
                orderIds,
                vendors,
                shared: orderIds.filter(orderId => servicesIds.includes(orderId)).length,
                order,
                approveRefused: approve.status >= 400 || approve.errors !== ""
            }
        },
        then({whole, bar, page, drilled, orderIds, vendors, shared, order, approveRefused}) {
            whole.available
            !!bar.groupField
            page.status == 200
            page.errors == ""
            page.output.includes("Source records")
            page.output.includes("/apps/Insights/Records/OrderDetail")
            drilled.rowsAvailable
            orderIds.length > 0
            // ORG_ZIZI_RETAIL's orders only, and none the Services reader drills to
            vendors == ids.organizationId
            shared == 0
            order.status == 200
            order.errors == ""
            order.output.includes("Order " + orderIds[0])
            order.output.includes("Back to the report")
            !/approveOrder|placeOrder|cancelOrder|<form|m-form-single/.test(order.output)
            approveRefused
        }
    }
)

feature("an analysis summing amounts across currencies is refused until grouped by currency, then saved as a library panel", {
    when() {
        const choices = {
            datasetId: "mantle-sales-orders",
            aggregate: "sum",
            measureField: "partTotal",
            from: range.from,
            thru: range.thru
        }
        // the demo's Retail orders are in one currency: an order of another makes the sum a mixed one
        const currencies = asUser(users.author, () =>
            Array.from(
                invoke(A + "get#AnalysisResult", Object.assign({}, choices, {aggregate: "count", groupBy: "currencyUomId"}))
                    .result.rows
            )
        )
        const mixedPage = render(users.author, "apps/Insights/ReportBuilder/Analysis", Object.assign({run: "Run"}, choices))
        const groupedPage = render(
            users.author,
            "apps/Insights/ReportBuilder/Analysis",
            Object.assign({run: "Run", groupBy: "currencyUomId"}, choices)
        )
        const refusedSave = asUser(users.author, () =>
            refusal(A + "store#Analysis", Object.assign({title: "Usable order value"}, choices))
        )
        const saved = render(
            users.author,
            "apps/Insights/ReportBuilder/Analysis/saveAnalysis",
            Object.assign({title: "Usable order value", groupBy: "currencyUomId", visualization: "table"}, choices),
            "post"
        )
        const readerPage = render(users.reader, "apps/Insights/ReportBuilder/Analysis", {})
        return {severalCurrencies: currencies.length > 1, mixedPage, groupedPage, refusedSave, saved, readerPage}
    },
    then({severalCurrencies, mixedPage, groupedPage, refusedSave, saved, readerPage}) {
        mixedPage.status == 200
        // refused only where the records are in several currencies; in one currency the sum is that currency's
        !severalCurrencies || mixedPage.output.includes("Not a meaningful result")
        !severalCurrencies || refusedSave.includes("UNIT_MIXED")
        groupedPage.status == 200
        groupedPage.errors == ""
        groupedPage.output.includes("Computed from")
        groupedPage.output.includes("Save analysis")
        saved.errors == ""
        saved.location.includes("/Insights/PanelDetail")
        saved.location.includes("definitionId=analysis-usable-order-value")
        // Analysis is the authors'
        readerPage.status != 200 || readerPage.errors != ""
    }
})

feature("a price list published for ORG_ZIZI_RETAIL is a marker on the suite's order value panel for its reader only", {
    when() {
        system(() => {
            const list = ec.entity.makeValue("mantle.product.ProductPriceList")
            list.setFields(
                {
                    priceListId,
                    listName: "Usable spring list",
                    organizationPartyId: ids.organizationId,
                    direction: "sales",
                    state: "published",
                    fromDate: ec.user.nowTimestamp
                },
                true,
                null,
                null
            )
            list.create()
            // what publish#ProductPriceList registers to run after its commit (Mantle's BusinessEvents spec)
            invoke("mantle.party.BusinessEventServices.record#BusinessEvent", {
                event: "PriceListPublished",
                recordId: priceListId
            })
        })
        const markers = user =>
            asUser(user, () => {
                const dashboard = invoke(
                    R + "render#Dashboard",
                    Object.assign({definitionId: suite.definitionId, panelId: "orderValue"}, range)
                ).dashboard
                return Array.from(Object.values(dashboard.panels || {})[0]?.annotations || [])
                    .map(marker => marker.text)
                    .filter(text => String(text).includes("Usable spring list"))
                    .join("|")
            })
        return {reader: markers(users.reader), services: markers(users.services)}
    },
    then({reader, services}) {
        reader == "Price list published: Usable spring list"
        services == ""
    }
})
