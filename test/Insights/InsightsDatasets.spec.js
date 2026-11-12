// Insights' business datasets (impl-insights P3; design-insights §5 Datasets, DatasetDetail, DatasetView): the steward admits
// Mantle's sales orders once their row filter is bound and their index built, which a reader and an author cannot; a reader of
// ORG_ZIZI_SERVICES then reads only its own organization's sales rows and a Retail reader only Retail's, whatever filter either
// sends; DatasetView's one qvt render (the author's, Retail's rows only) and its scoped export, the same rows; the dataset's
// readiness and its index refresh through Admin's registries, the refresh the steward's; the steward's own dataset names
// neither the log index nor the sales document without its filter (impl-admin F277). The four dataset screens are the
// framework's Dashboards screens at Insights' locations (mr-moqui plans/Admin-Screens-Down.md, Track I): through Insights'
// route a dataset the steward creates is named insights- and scoped on its organization field (Insights' reportPolicy), an
// author creates none, and the Dashboards screens' own transitions, which Insights does not take in, are not on the route.
// The engine's admission rules and what the screens read are the framework's BusinessDatasets, and the organization filter
// Mantle's OrganizationRowFilter; the screens' access is InsightsAccess's.
// The "usable when" scenario is the acceptance InsightsDatasetsUsable. Run: ./moq test mr-boss --spec InsightsDatasets
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const salesId = "mantle-sales-orders"
const orders = {retail: "INS_DS_O1", services: "INS_DS_O2"}
const range = {from: "now-1d", thru: "now+1d"}
const webroot = "component://webroot/screen/webroot.xml"
const insightsRoot = "component://mr-boss/screen/Insights.xml"
// the dataset the steward creates through Insights' route, by its form's short name
const created = {name: "INS DS route", datasetId: "insights-ins-ds-route"}

function make(entityName, fields) {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}
// A transition asked as the user (no page is rendered), posted unless it is a read: where it sends the browser, its errors
// and what it answered.
function transition(user, root, path, parameters, method = "post") {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(root).render(path, parameters, method)
        const out = {
            status: result.status,
            location: String(result.header("Location") || ""),
            errors: Array.from(result.errorMessages || []).join(" | "),
            output: String(result.output || "")
        }
        ec.message.clearErrors()
        return out
    })
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
                    // a page of this list, which the link to Explore does not carry (Explore's list has its own)
                    Object.assign(
                        {lastStandalone: "true", datasetId: salesId, queryString: "orderId:INS_DS_*", pageIndex: "0"},
                        range
                    ),
                    null
                )
            const output = String(result.output || "")
            const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
            return {status: result.status, output, errors: Array.from(result.errorMessages || []).concat(failed)}
        })
        // the export is the screen's transition, through Insights' route: the author's rows as CSV, and refused to a reader
        const exportOf = user =>
            transition(
                user,
                insightsRoot,
                "ReportBuilder/DatasetView/exportDocuments",
                Object.assign({datasetId: salesId, queryString: "orderId:INS_DS_*", format: "csv"}, range),
                null
            )
        const exported = exportOf(users.author)
        const readerExport = exportOf(users.reader)
        const explore = (rendered.output.match(/href="([^"]*ReportBuilder\/Explore\?[^"]*)"/) || [])[1] || ""
        return {rendered, explore, exported, exportedRows: exported.output.trim().split(/\r?\n/).length - 1, readerExport}
    },
    then({rendered, explore, exported, exportedRows, readerExport}) {
        rendered.status == 200
        rendered.errors.length == 0
        rendered.output.includes("Sales orders")
        rendered.output.includes(orders.retail)
        !rendered.output.includes(orders.services)
        rendered.output.includes("Export")
        // the dataset opens in Insights' Explore with the range and the query, without this list's page
        explore.includes("datasetId=" + salesId) && explore.includes("queryString=")
        !explore.includes("pageIndex")
        exported.errors == ""
        exportedRows == 1
        exported.output.includes(orders.retail)
        !exported.output.includes(orders.services)
        readerExport.errors.includes("is not authorized")
        !readerExport.output.includes(orders.retail)
    }
})

feature(
    "through Insights' route the steward's new dataset is named insights- and scoped on its organization field; the Dashboards screens' own transitions are not there",
    {
        when() {
            const form = {
                title: "Spec route orders",
                name: created.name,
                dataDocumentId: "MantleSalesOrderPart",
                scopePolicyId: "MantleOrganization",
                scopeField: "vendorPartyId"
            }
            const stored = () =>
                system(() => {
                    const row = ec.entity.find("moqui.report.Definition").condition("definitionId", created.datasetId).one()
                    return row ? JSON.parse(row.bodyJson) : null
                })
            // an author opens the list and reaches its transition, and is not granted the engine's create
            const author = transition(users.author, insightsRoot, "ReportBuilder/Datasets/createDataset", form)
            const authorMade = stored()
            const made = transition(users.steward, insightsRoot, "ReportBuilder/Datasets/createDataset", form)
            const first = stored()
            const state = asUser(
                users.steward,
                () => invoke(R + "find#BusinessDatasets", {datasetId: created.datasetId}).datasets[0]
            )
            // the organization field changed in DatasetDetail's form: the same parameter of Mantle's policy
            const changed = transition(users.steward, insightsRoot, "ReportBuilder/DatasetDetail/storeDataset", {
                datasetId: created.datasetId,
                title: form.title,
                scopePolicyId: form.scopePolicyId,
                scopeField: "customerPartyId",
                expectedVersion: state?.version
            })
            const second = stored()
            // the Dashboards screens' own transitions (the other datasets' Explore and definition editor, a dataset's
            // definition) are not taken in, so they are not on Insights' route: for the steward and for ADMIN
            const trims = []
            for (const user of [users.steward, users.system])
                for (const [path, parameters] of [
                    ["ReportBuilder/Datasets/definition", {definitionType: "dataset"}],
                    ["ReportBuilder/Datasets/explore", {datasetId: created.datasetId}],
                    ["ReportBuilder/DatasetDetail/definition", {datasetId: created.datasetId, definitionId: created.datasetId}]
                ]) {
                    const asked = transition(user, insightsRoot, path, parameters)
                    if (asked.location || !asked.errors.includes("screen path not found"))
                        trims.push(`${user} ${path}: ${asked.location} ${asked.errors}`)
                }
            // and the same post under Tools' own root goes to its definition editor
            const tools = transition(users.system, webroot, "apps/dashboards/Datasets/definition", {definitionType: "dataset"})
            asUser(users.steward, () => invoke(R + "delete#Definition", {definitionId: created.datasetId}))
            return {author, authorMade, made, first, state, changed, second, trims, tools, after: stored()}
        },
        then({author, authorMade, made, first, state, changed, second, trims, tools, after}) {
            author.errors.includes("is not authorized")
            authorMade == null
            made.errors == ""
            made.location.includes("ReportBuilder/DatasetDetail?datasetId=" + created.datasetId)
            first.signal == "business"
            JSON.stringify(first.rowFilterParameters) == '{"organizationField":"vendorPartyId"}'
            state.status == "review"
            state.stewarded == true
            changed.errors == ""
            JSON.stringify(second.rowFilterParameters) == '{"organizationField":"customerPartyId"}'
            trims.join("\n") == ""
            tools.location.includes("/apps/dashboards/Definition")
            after == null
        }
    }
)

feature("the steward's own dataset is no way to the log index or past the sales rows' filter (impl-admin F277)", {
    when() {
        // an insights-* dataset's artifact is the steward's by pattern; the log index's and the sales document's own are not
        const save = (id, body) =>
            asUser(users.steward, () => refusal(R + "save#Definition", {definition: {id, type: "dataset", title: id, body}}))
        return {
            logs: save("insights-spec-logs", {indexName: "otel_logs", timeField: "timestamp", rowFilter: {match_all: {}}}),
            raw: save("insights-spec-raw", {documentType: "MantleSalesOrderPart", timeField: "_timestamp"}),
            // nor with the business signal and no registered scope policy, which the steward would read before admission
            unbound: save("insights-spec-unbound", {
                documentType: "MantleSalesOrderPart",
                timeField: "_timestamp",
                signal: "business"
            }),
            kept: system(() =>
                ec.entity.find("moqui.report.Definition").condition("definitionId", "like", "insights-spec-%").count()
            )
        }
    },
    then({logs, raw, unbound, kept}) {
        logs.includes("needs its own grant (org.moqui.report.dataset.otel_logs)")
        raw.includes("a business dataset's document")
        unbound.includes("a business dataset's document")
        kept == 0
    }
})

feature("the dataset's readiness and index refresh are in Admin's registries, the refresh the steward's", {
    when() {
        const providerKey = "insights.dataset." + salesId
        const readiness = asUser(users.steward, () =>
            Array.from(invoke("org.moqui.admin.ReadinessServices.get#Readiness", {providerKey}).checks || [])
        )
        const refused = asUser(users.author, () =>
            refusal("org.moqui.admin.ReadinessServices.request#Refresh", {refreshKey: providerKey + ".index"})
        )
        const refreshed = asUser(users.steward, () =>
            invoke("org.moqui.admin.ReadinessServices.request#Refresh", {refreshKey: providerKey + ".index", reason: "spec"})
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
