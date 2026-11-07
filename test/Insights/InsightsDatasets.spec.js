// Insights' business datasets (impl-insights P3; design-insights §5 Datasets, DatasetDetail, DatasetView): the steward admits
// Mantle's sales orders once their row filter is bound and their index built, which a reader and an author cannot; a reader of
// ORG_ZIZI_SERVICES then reads only its own organization's sales rows and a Retail reader only Retail's, whatever filter either
// sends; DatasetView's one qvt render (the author's, Retail's rows only) and its scoped export, the same rows; the dataset's
// readiness and its index refresh through Admin's registries, the refresh the steward's. The engine's admission rules are the
// framework's BusinessDatasets and the organization filter Mantle's OrganizationRowFilter; the screens' access is InsightsAccess's.
// The "usable when" scenario is the acceptance InsightsDatasetsUsable. Run: ./moq test mr-boss --spec InsightsDatasets
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const D = "ironstone.insights.DatasetServices."
const salesId = "mantle-sales-orders"
const orders = {retail: "INS_DS_O1", services: "INS_DS_O2"}
const range = {from: "now-1d", thru: "now+1d"}
const webroot = "component://webroot/screen/webroot.xml"

function make(entityName, fields) {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}
// the spec's orders of a sales dataset the user reads, by id
function orderIds(user, extra) {
    return asUser(user, () => {
        const out = invoke(R + "query#Documents", Object.assign({datasetId: salesId, pageSize: 200}, range, extra || {}))
        return Array.from(out.hits || [])
            .map(hit => hit.body?.orderId)
            .filter(id => Object.values(orders).includes(id))
            .sort()
            .join(",")
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
    }
})

feature("a sales order of each organization, indexed in Mantle's sales feed", {
    when() {
        system(() => {
            for (const [orderId, vendorPartyId] of [
                [orders.retail, ids.organizationId],
                [orders.services, ids.otherOrganizationId]
            ]) {
                make("mantle.order.OrderHeader", {
                    orderId,
                    statusId: "OrderApproved",
                    currencyUomId: "USD",
                    entryDate: ec.user.nowTimestamp,
                    placedDate: ec.user.nowTimestamp,
                    grandTotal: 20
                })
                make("mantle.order.OrderPart", {
                    orderId,
                    orderPartSeqId: "01",
                    vendorPartyId,
                    customerPartyId: "JoeDist",
                    statusId: "OrderApproved",
                    partTotal: 20
                })
                ec.search.indexDocuments(ec.entity.getDataDocuments("MantleSalesOrderPart", {orderId}))
            }
        })
        return {searchAvailable: ec.search.isAvailable()}
    },
    then({searchAvailable}) {
        searchAvailable
    }
})

feature("the steward admits the sales orders once checked; a reader and an author cannot, and nobody reads them before", {
    when() {
        const before = asUser(users.reader, () => refusal(R + "query#Documents", Object.assign({datasetId: salesId}, range)))
        const state = asUser(users.steward, () => invoke(R + "validate#BusinessDataset", {datasetId: salesId}))
        const reader = asUser(users.reader, () => refusal(R + "store#BusinessDataset", {datasetId: salesId, admit: true}))
        const author = asUser(users.author, () => refusal(R + "store#BusinessDataset", {datasetId: salesId, admit: true}))
        const admitted = asUser(users.steward, () => invoke(R + "store#BusinessDataset", {datasetId: salesId, admit: true}))
        return {
            before,
            admissible: state.admissible,
            reader,
            author,
            status: admitted.dataset?.status,
            scope: admitted.dataset?.scopePolicyId
        }
    },
    then({before, admissible, reader, author, status, scope}) {
        before.includes("not admitted")
        admissible
        reader.includes("is not authorized")
        author.includes("is not authorized")
        status == "admitted"
        scope == "MantleOrganization"
    }
})

feature("a reader of ORG_ZIZI_SERVICES reads only its own sales rows, and a Retail reader only Retail's, whatever they send", {
    when() {
        return {
            services: orderIds(users.services),
            retail: orderIds(users.reader),
            forged: orderIds(users.services, {queryString: "vendorPartyId:" + ids.organizationId}),
            counts: asUser(users.services, () =>
                Array.from(
                    invoke(R + "run#Query", {
                        query: Object.assign(
                            {
                                datasetId: salesId,
                                queryString: "orderId:INS_DS_*",
                                aggregations: [
                                    {id: "vendor", type: "terms", role: "split-rows", params: {field: "vendorPartyId"}}
                                ]
                            },
                            range
                        )
                    }).frames || []
                )
                    .flatMap(frame => Array.from(frame.fields || []).flatMap(field => Array.from(field.values || [])))
                    .filter(value => String(value).startsWith("ORG_"))
                    .join(",")
            )
        }
    },
    then({services, retail, forged, counts}) {
        services == orders.services
        retail == orders.retail
        forged == ""
        !counts.includes(ids.organizationId)
    }
})

feature("DatasetView's one qvt render shows the author Retail's rows and its export the same rows, audited", {
    when() {
        const rendered = asUser(users.author, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen(webroot)
                .renderMode("qvt")
                .withStaticData()
                .render(
                    "apps/Insights/ReportBuilder/DatasetView",
                    Object.assign({lastStandalone: "true", datasetId: salesId, queryString: "orderId:INS_DS_*"}, range),
                    null
                )
            const output = String(result.output || "")
            const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
            return {status: result.status, output, errors: Array.from(result.errorMessages || []).concat(failed)}
        })
        const exported = asUser(users.author, () =>
            invoke(
                D + "export#Dataset",
                Object.assign({datasetId: salesId, queryString: "orderId:INS_DS_*", format: "csv"}, range)
            )
        )
        const readerExport = asUser(users.reader, () => refusal(D + "export#Dataset", Object.assign({datasetId: salesId}, range)))
        return {rendered, exported, readerExport}
    },
    then({rendered, exported, readerExport}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Sales orders")
        rendered.output.includes(orders.retail)
        !rendered.output.includes(orders.services)
        rendered.output.includes("Export")
        exported.rowCount == 1
        exported.content.includes(orders.retail)
        !exported.content.includes(orders.services)
        readerExport.includes("INSIGHTS_DATASETS_UNAVAILABLE") || readerExport.includes("authoring or stewardship")
    }
})

feature("the dataset's readiness and index refresh are in Admin's registries, the refresh the steward's", {
    when() {
        const providerKey = "insights.dataset." + salesId
        const readiness = asUser(users.steward, () =>
            Array.from(invoke("ironstone.admin.RegistryServices.get#Readiness", {providerKey}).checks || [])
        )
        const refused = asUser(users.author, () =>
            refusal("ironstone.admin.RegistryServices.request#Refresh", {refreshKey: providerKey + ".index"})
        )
        const refreshed = asUser(users.steward, () =>
            invoke("ironstone.admin.RegistryServices.request#Refresh", {refreshKey: providerKey + ".index", reason: "spec"})
        )
        const indexed = system(() => ec.entity.find("moqui.report.BusinessDataset").condition("datasetId", salesId).one())
        return {readiness, refused, refreshed, indexed: indexed?.lastIndexedCount}
    },
    then({readiness, refused, refreshed, indexed}) {
        readiness.length == 1
        readiness[0].state == "ready"
        readiness[0].refreshKey == "insights.dataset.mantle-sales-orders.index"
        refused.includes("REFRESH_DENIED") || refused.includes("INSIGHTS_DATASET_EDIT is required")
        refreshed.state == "requested"
        indexed >= 2
    }
})
