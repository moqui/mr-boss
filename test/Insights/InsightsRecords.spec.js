// Insights' drill, record contexts, Analysis and business events (impl-insights P6; design-insights §4 Drill and business
// annotations, §5 Analysis, §10): a reader drills a saved panel's value to the orders of their own organization, whatever the
// request sends, and each opens Shared/OrderDetail under Insights, read only (its one qvt render: the admitted dataset's facts,
// the return to the report, no action); another organization's order is "not available" there, as a missing one is, and nothing
// below a record screen is served under Insights but its read-only context: no transition and no owner tab; the root's Chatter
// and RecordFiles panels answer only a user whose own grants open Commons (P12). An analysis summing
// amounts across currencies is refused with its reason until it is grouped by currency, and is saved as a library panel only
// by an author: Analysis' saveAnalysis on Insights' route is Insights' own (its author check and its grant), not the
// framework screen's, so a distributor, who holds the engine's save, saves none there. The drill's page and the analysis'
// query and rows are the framework's (tools/template/ReportDrill.js, ReportAnalysis.js), under Insights' scope, range, cost
// filter and reason codes. A business event of the reader's organization is a marker on the panel. The engine's rules are the framework's ReportDrill and ReportAnnotations, the events'
// records Mantle's BusinessEvents; the orders and the admitted sales dataset are InsightsDatasets'. The "usable when" scenario is
// the acceptance InsightsDrillUsable. Run: ./moq test mr-boss --spec InsightsRecords
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const DRILL = "ironstone.insights.DrillServices.get#Drill"
const RECORD = "ironstone.insights.DrillServices.get#Record"
const A = "ironstone.insights.AnalysisServices."
const panelId = "ins-rec-orders-by-currency"
const orders = {retail: "INS_DS_O1", services: "INS_DS_O2", euro: "INS_REC_O3"}
const range = {from: "now-1d", thru: "now+1d"}
const webroot = "component://webroot/screen/webroot.xml"

function make(entityName, fields) {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}
function render(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .renderMode("qvt")
            .withStaticData()
            .render("apps/Insights/" + path, Object.assign({lastStandalone: "true"}, parameters), null)
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        return {status: result.status, output, errors: Array.from(result.errorMessages || []).concat(failed)}
    })
}
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Insights/" + path, parameters, "post")
        return {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}
const drillAs = (user, extra) =>
    asUser(user, () => invoke(DRILL, Object.assign({definitionId: panelId}, range, extra || {})).drill)
const recordIds = drill =>
    Array.from(drill?.rows || [])
        .map(row => row.recordParameters?.orderId)
        // the spec's orders among the demo's
        .filter(orderId => Object.values(orders).includes(orderId))
        .sort()
        .join(",")
const usd = JSON.stringify([{field: "currency", value: "USD"}])

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasets"],
    setupSpec() {
        login(users.system)
    }
})

feature(
    "a euro order of Retail beside the dataset spec's orders, and a library panel of orders by currency shared with readers",
    {
        when() {
            system(() => {
                make("mantle.order.OrderHeader", {
                    orderId: orders.euro,
                    statusId: "OrderApproved",
                    currencyUomId: "EUR",
                    entryDate: ec.user.nowTimestamp,
                    placedDate: ec.user.nowTimestamp,
                    grandTotal: 30
                })
                make("mantle.order.OrderPart", {
                    orderId: orders.euro,
                    orderPartSeqId: "01",
                    vendorPartyId: ids.organizationId,
                    customerPartyId: "JoeDist",
                    statusId: "OrderApproved",
                    partTotal: 30
                })
                ec.search.indexDocuments(ec.entity.getDataDocuments("MantleSalesOrderPart", {orderId: orders.euro}))
            })
            const saved = invoke(R + "save#Definition", {
                definition: {
                    id: panelId,
                    type: "panel",
                    title: "Orders by currency",
                    userGroupId: "BOSS_INSIGHTS",
                    body: {
                        title: "Orders by currency",
                        visualization: "bar",
                        queries: [
                            {
                                datasetId: "mantle-sales-orders",
                                aggregations: [
                                    {id: "currency", type: "terms", role: "x-axis", params: {field: "currencyUomId", size: 10}}
                                ]
                            }
                        ]
                    }
                }
            })
            return {saved: saved.definition?.id}
        },
        then({saved}) {
            saved == panelId
        }
    }
)

feature("a drill answers the viewer's own organization's orders, whatever the request sends, each with its Insights record", {
    when() {
        const reader = drillAs(users.reader, {bucketsJson: usd})
        const services = drillAs(users.services, {bucketsJson: usd})
        // a forged scope variable does not replace the organization in scope, and another organization is refused
        const forged = drillAs(users.reader, {
            bucketsJson: usd,
            variablesJson: JSON.stringify({organizationPartyId: ids.otherOrganizationId, vendorPartyId: ids.otherOrganizationId})
        })
        const otherOrganization = asUser(users.reader, () =>
            refusal(DRILL, Object.assign({definitionId: panelId, organizationPartyId: ids.otherOrganizationId}, range))
        )
        // a screen's call answers the refusal instead of failing (P12, impl-admin F129: ignore-error clears the message)
        const answered = asUser(users.reader, () =>
            invoke(DRILL, Object.assign({definitionId: panelId, organizationPartyId: ids.otherOrganizationId, answerRefusal: true}, range))
        )
        // the administrator reads no business dataset; a user of another app has no Insights
        const admin = drillAs(users.admin, {})
        const otherApp = asUser(users.otherApp, () => refusal(DRILL, Object.assign({definitionId: panelId}, range)))
        const whole = drillAs(users.reader, {breakdownDimension: "statusId"})
        return {
            reader,
            readerIds: recordIds(reader),
            servicesIds: recordIds(services),
            forgedIds: recordIds(forged),
            otherOrganization,
            answered,
            admin,
            otherApp,
            buckets: Array.from(whole.panelBuckets || [])
                .map(row => row.groupValue)
                .sort()
                .join(","),
            breakdown: Array.from(whole.breakdown || []).length
        }
    },
    then({reader, readerIds, servicesIds, forgedIds, otherOrganization, answered, admin, otherApp, buckets, breakdown}) {
        reader.available
        reader.rowsAvailable
        readerIds == orders.retail
        reader.rows[0].recordScreen == "OrderDetail"
        reader.selected[0].label == "USD"
        servicesIds == orders.services
        forgedIds == orders.retail
        otherOrganization.includes("ORGANIZATION_UNAVAILABLE")
        answered.refusalCode == "ORGANIZATION_UNAVAILABLE"
        answered.refusal != "" && !answered.refusal.includes("ORGANIZATION_UNAVAILABLE")
        !answered.available
        admin.rows.length == 0
        otherApp.includes("is not authorized")
        buckets == "EUR,USD"
        breakdown >= 1
    }
})

feature("OrderDetail under Insights shows the order read only with its return; another organization's order is not available", {
    when() {
        const page = render(users.reader, "Records/OrderDetail", {
            orderId: orders.retail,
            definitionId: panelId,
            bucketsJson: usd
        })
        const record = (user, orderId) =>
            asUser(user, () => invoke(RECORD, {recordType: "OrderDetail", recordId: orderId}).record)
        const other = record(users.reader, orders.services)
        const missing = record(users.reader, "INS_REC_NONE")
        const own = record(users.services, orders.services)
        // the mount is read only by its path: a shared screen's transition and an owner's tab are refused before they run
        const approve = post(users.reader, "Records/OrderDetail/approveOrder", {orderId: orders.retail})
        const tab = post(users.reader, "Records/Customer360/Contact", {customerPartyId: "JoeDist"})
        const approved = system(
            () => ec.entity.find("mantle.order.OrderHeader").condition("orderId", orders.retail).one().statusId
        )
        // P12: the record panels mounted under the Insights root (Chatter, RecordFiles) answer only a user whose own grants
        // open Commons; with the reader's Commons membership ended a note and the files are refused before they run
        const panelRecord = {recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST"}
        const panel = (path, method) =>
            asUser(users.reader, () => {
                const result = ec.screen.makeTest().rootScreen(webroot).render("apps/Insights/" + path, panelRecord, method)
                return Array.from(result.errorMessages || []).join(" | ")
            })
        const panelOpen = panel("Chatter/chatterData", "get")
        const member = system(() =>
            ec.entity.find("moqui.security.UserGroupMember").condition({userGroupId: "BOSS_USERS", userId: "BOSS_INS_READER"}).one()
        )
        let panelNote, panelFiles
        try {
            system(() => member.set("thruDate", ec.user.nowTimestamp).update())
            panelNote = panel("Chatter/logNote", "post")
            panelFiles = panel("RecordFiles/filesData", "get")
        } finally {
            system(() => member.set("thruDate", null).update())
        }
        return {
            page,
            other,
            missing,
            own,
            approve: approve.errors,
            tab: tab.errors,
            approved,
            unknownType: asUser(users.reader, () => refusal(RECORD, {recordType: "Anything", recordId: "X"})),
            panelOpen,
            panelNote,
            panelFiles
        }
    },
    then({page, other, missing, own, approve, tab, approved, unknownType, panelOpen, panelNote, panelFiles}) {
        page.status == 200
        page.errors.join(" | ") == ""
        page.output.includes("Order " + orders.retail)
        page.output.includes("Order parts")
        page.output.includes("Back to the report")
        page.output.includes("Read only")
        // none of the owners' actions or contexts
        !/approveOrder|placeOrder|cancelOrder|Send estimate|m-form-single|<form/.test(page.output)
        !page.output.includes("Not available")
        !other.recordFound
        other.sources.length == 0
        other.owners.length == 0
        !missing.recordFound
        JSON.stringify(other.sources) == JSON.stringify(missing.sources)
        own.recordFound
        approve.includes("RECORD_READ_ONLY")
        tab.includes("RECORD_READ_ONLY")
        approved == "OrderApproved"
        unknownType.includes("RECORD_UNAVAILABLE")
        panelOpen == ""
        panelNote.includes("RECORD_PANEL_UNAVAILABLE")
        panelFiles.includes("RECORD_PANEL_UNAVAILABLE")
    }
})

feature("an analysis summing amounts across currencies is refused until grouped by currency; only an author runs and saves one", {
    when() {
        const choices = {
            datasetId: "mantle-sales-orders",
            aggregate: "sum",
            measureField: "partTotal",
            from: range.from,
            thru: range.thru
        }
        const run = extra =>
            asUser(users.author, () => invoke(A + "get#AnalysisResult", Object.assign({}, choices, extra || {})).result)
        const mixed = run()
        const grouped = run({groupBy: "currencyUomId"})
        const oneCurrency = run({filterField: "currencyUomId", filterValue: "EUR"})
        const page = render(users.author, "ReportBuilder/Analysis", Object.assign({run: "Run"}, choices))
        const reader = asUser(users.reader, () => refusal(A + "get#AnalysisResult", choices))
        const authorRuns = asUser(users.author, () => refusal(A + "get#AnalysisResult", choices))
        const notAField = asUser(users.author, () =>
            refusal(A + "get#AnalysisResult", Object.assign({}, choices, {groupBy: "noSuchField"}))
        )
        const save = extra =>
            asUser(users.author, () =>
                refusal(A + "store#Analysis", Object.assign({title: "Order value by currency"}, choices, extra))
            )
        const savedMixed = save({})
        const otherGroup = save({groupBy: "currencyUomId", userGroupId: "BOSS_ADMIN_ADMIN"})
        const saved = asUser(users.author, () =>
            invoke(A + "store#Analysis", Object.assign({title: "Order value by currency", groupBy: "currencyUomId"}, choices))
        )
        const definition = asUser(users.author, () => invoke(R + "get#Definition", {definitionId: saved.definitionId}).definition)
        // through Insights' route the save is Insights' own transition: the distributor, who holds the engine's save (the
        // framework screen's saveAnalysis would take it), saves nothing there; the same post by the author saves
        const routed = {title: "Routed analysis", groupBy: "currencyUomId"}
        const analyses = userId =>
            system(() =>
                ec.entity.find("moqui.report.Definition").condition("ownerId", userId).condition("title", routed.title).count()
            )
        const byDistributor = post(users.distributor, "ReportBuilder/Analysis/saveAnalysis", Object.assign({}, routed, choices))
        const byAuthor = post(users.author, "ReportBuilder/Analysis/saveAnalysis", Object.assign({}, routed, choices))
        return {
            byDistributor,
            byAuthor,
            distributorSaved: analyses("BOSS_INS_DISTRIBUTOR"),
            authorSaved: analyses("BOSS_INS_AUTHOR"),
            mixed,
            grouped,
            groupedText: Array.from(grouped.rows || [])
                .map(row => row.label + " " + row.valuesText)
                .sort()
                .join("|"),
            oneCurrency: Array.from(oneCurrency.rows || [])
                .map(row => row.valuesText)
                .join("|"),
            page,
            reader,
            authorRuns,
            notAField,
            savedMixed,
            otherGroup,
            definition
        }
    },
    then({mixed, grouped, groupedText, oneCurrency, page, reader, authorRuns, notAField, savedMixed, otherGroup, definition, byDistributor, byAuthor, distributorSaved, authorSaved}) {
        !mixed.available
        mixed.refusedCode == "UNIT_MIXED"
        mixed.reason.includes("currencyUomId")
        mixed.rows.length == 0
        grouped.available
        // each currency apart, the euro order in EUR
        groupedText.includes("value 30 EUR")
        groupedText.includes("USD count")
        !groupedText.includes("Other")
        oneCurrency.includes("30")
        page.status == 200
        page.errors.join(" | ") == ""
        page.output.includes("Not a meaningful result")
        !page.output.includes("Save analysis")
        reader.includes("INSIGHTS_AUTHOR_REQUIRED")
        authorRuns == ""
        notAField.includes("FIELD_UNAVAILABLE")
        savedMixed.includes("UNIT_MIXED")
        otherGroup.includes("SHARE_GROUP_UNAVAILABLE")
        definition.type == "panel"
        definition.ownerId != null
        definition.body.queries[0].datasetId == "mantle-sales-orders"
        byDistributor.errors != "" && distributorSaved == 0
        byAuthor.errors == "" && authorSaved == 1
    }
})

feature("a business event of the reader's organization is a marker on the panel, and no other organization's is", {
    when() {
        // an instant for the engine, never shown
        const at = new Date(Date.now() - 3600000).toISOString()
        system(() => {
            for (const [organizationPartyId, text, key] of [
                [ids.organizationId, "Price list published: Retail spring", "INS_REC_L1"],
                [ids.otherOrganizationId, "Price list published: Services spring", "INS_REC_L2"]
            ])
                invoke(R + "create#Annotation", {
                    source: "business",
                    event: "PriceListPublished",
                    eventKey: "PriceListPublished:" + key,
                    text,
                    time: at,
                    organizationPartyId,
                    recordType: "mantle.product.ProductPriceList",
                    recordId: key
                })
        })
        const markers = user =>
            asUser(user, () =>
                Array.from(
                    invoke(R + "render#Dashboard", Object.assign({definitionId: panelId}, range)).dashboard?.annotations || []
                )
                    .map(marker => marker.text)
                    .filter(text => String(text).includes("spring"))
                    .join("|")
            )
        return {
            reader: markers(users.reader),
            services: markers(users.services),
            // writing a business event is no Insights group's
            write: asUser(users.author, () =>
                refusal(R + "create#Annotation", {
                    source: "business",
                    event: "PriceListPublished",
                    text: "Not mine to write",
                    organizationPartyId: ids.organizationId
                })
            )
        }
    },
    then({reader, services, write}) {
        reader == "Price list published: Retail spring"
        services == "Price list published: Services spring"
        write.includes("not authorized")
    }
})
