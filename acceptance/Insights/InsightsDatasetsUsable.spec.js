// Insights P3's "usable when" (impl-insights P3; design-insights §13.3 "Dataset admission" and the dataset half of "Two
// organizations and confidential fields"), server side through the screens' transitions on the demo data: the steward finds the
// sales and inventory datasets waiting for review, is refused Admit for inventory while its index is not built, rebuilds it (its
// last build and lag then show on the dataset) and admits it, and admits the sales datasets, whose organization filter is bound;
// the Sales dashboard then reads for insights.reader only ORG_ZIZI_RETAIL's orders and for the ORG_ZIZI_SERVICES reader only theirs;
// the author's export (DatasetView's transition) holds the same rows they read. The rules are the framework's BusinessDatasets, Mantle's
// OrganizationRowFilter and the regression InsightsDatasets. Written with P3, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsDatasetsUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const range = {from: "now-10y", thru: "now"}

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
            errors: Array.from(result.errorMessages || [])
                .concat(failed)
                .join(" | ")
        }
    })
}
function state(datasetId) {
    return system(() => invoke(R + "find#BusinessDatasets", {datasetId}).datasets?.[0])
}
// the vendors of the sales order rows a user reads
function vendors(user) {
    return asUser(user, () =>
        Array.from(
            new Set(
                Array.from(
                    invoke(R + "query#Documents", Object.assign({datasetId: "mantle-sales-orders", pageSize: 500}, range)).hits ||
                        []
                ).map(hit => hit.body?.vendorPartyId)
            )
        ).sort()
    )
}

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
    }
})

feature("the steward finds the sales and inventory datasets waiting for review", {
    when() {
        return {list: render(users.steward, "ReportBuilder/Datasets", {status: "review"})}
    },
    then({list}) {
        list.status == 200
        list.errors == ""
        list.output.includes("Sales orders")
        list.output.includes("Sales items")
        list.output.includes("Inventory")
        list.output.includes("Needs review")
    }
})

feature("Admit is refused while the inventory index is not built; the steward rebuilds it, sees its lag and admits it", {
    when() {
        const built = Array.from(state("mantle-inventory").checks).find(check => check.check === "index").passed
        const refused = render(users.steward, "ReportBuilder/DatasetDetail/admitDataset", {datasetId: "mantle-inventory"}, "post")
        const rebuilt = render(users.steward, "ReportBuilder/DatasetDetail/rebuildIndex", {datasetId: "mantle-inventory"}, "post")
        const detail = render(users.steward, "ReportBuilder/DatasetDetail", {datasetId: "mantle-inventory"})
        const admitted = render(
            users.steward,
            "ReportBuilder/DatasetDetail/admitDataset",
            {datasetId: "mantle-inventory"},
            "post"
        )
        return {
            built,
            refused: refused.errors,
            rebuilt: rebuilt.errors,
            detail,
            admitted: admitted.errors,
            after: state("mantle-inventory")
        }
    },
    then({built, refused, rebuilt, detail, admitted, after}) {
        // a fresh instance may have built the index from its demo data: then the first Admit is not refused
        built || refused.includes("is not built")
        rebuilt == ""
        detail.output.includes("Last rebuilt")
        detail.output.includes("ago")
        admitted == ""
        after.status == "admitted"
    }
})

feature("the steward admits the sales datasets, whose organization filter is bound", {
    when() {
        const orders = render(
            users.steward,
            "ReportBuilder/DatasetDetail/admitDataset",
            {datasetId: "mantle-sales-orders"},
            "post"
        )
        const items = render(users.steward, "ReportBuilder/DatasetDetail/admitDataset", {datasetId: "mantle-sales-items"}, "post")
        return {orders: orders.errors, items: items.errors, state: state("mantle-sales-orders")}
    },
    then({orders, items, state}) {
        orders == ""
        items == ""
        state.status == "admitted"
        state.scopePolicyId == "MantleOrganization"
    }
})

feature("the Sales dashboard reads ORG_ZIZI_RETAIL's orders for insights.reader and only Services' for the Services reader", {
    when() {
        const dashboard = render(users.reader, "Dashboard", Object.assign({definitionId: "mantle-sales"}, range))
        return {dashboard, retail: vendors(users.reader), services: vendors(users.services)}
    },
    then({dashboard, retail, services}) {
        dashboard.status == 200
        dashboard.errors == ""
        !dashboard.output.includes("Not available")
        retail.length > 0
        !retail.includes(ids.otherOrganizationId)
        services.every(vendor => vendor === ids.otherOrganizationId)
    }
})

feature("the author's export of the sales orders holds the rows they read", {
    when() {
        const read = asUser(users.author, () =>
            invoke(R + "query#Documents", Object.assign({datasetId: "mantle-sales-orders", pageSize: 1}, range))
        )
        // DatasetView's export transition (the framework's screen at Insights' location), as JSON so that its rows are counted
        const exported = asUser(users.author, () =>
            String(
                ec.screen
                    .makeTest()
                    .rootScreen(webroot)
                    .render(
                        "apps/Insights/ReportBuilder/DatasetView/exportDocuments",
                        Object.assign({datasetId: "mantle-sales-orders", format: "json", requestedRowLimit: 10000}, range),
                        null
                    ).output || ""
            )
        )
        return {total: Number(read.total || 0), rows: JSON.parse(exported).length, content: exported}
    },
    then({total, rows, content}) {
        total > 0
        rows == Math.min(total, 10000)
        !content.includes(ids.otherOrganizationId)
    }
})
