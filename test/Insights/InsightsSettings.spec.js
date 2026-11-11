// Insights' settings, data readiness and Assist (impl-insights P10; design-insights §11, §1.2): the organization's analytics
// defaults are the Insights administrator's to change (a reader with the same input refused), for an organization of theirs
// at the revision read, a recipient cap above Admin's instance ceiling refused and nothing stored; the saved cap is the one
// delivery then uses for that organization and no other. Data readiness reads Admin's registry as the viewer: a source
// rebuilt two hours ago is ready under the default policy and stale, with its lag, once the organization allows an hour;
// a source the reader may not read is not listed; the refresh is refused to an author (the registration's permission) and
// to a reader, and the steward's runs. Assist's query answers each reader their own organization's rows of an admitted
// dataset, and refuses an unadmitted one, a cost dataset and a cost field (an MCP client whatever the caller holds) and a
// forged organization; a dashboard's number is its saved panel's own result, and a panel any of whose queries reads a cost
// dataset is refused; no tool exposes the engine's own query; "Add to my dashboard" saves an author's panel through
// Analysis and refuses a reader. The screens' one render each is here. The sales dataset and its two orders are
// InsightsDatasets'. The "usable when" scenario is the acceptance InsightsSettingsUsable.
// Run: ./moq test mr-boss --spec InsightsSettings
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const C = "ironstone.insights.ContextServices."
const G = "ironstone.insights.RegistryServices."
const A = "ironstone.insights.AssistServices."
const REFRESH = "ironstone.admin.RegistryServices.request#Refresh"
const salesId = "mantle-sales-orders"
const sourceId = "boss-commerce-checkouts"
const orders = {retail: "INS_DS_O1", services: "INS_DS_O2"}
const range = {from: "now-1d", thru: "now+1d"}
const insightsLib = () => ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasets"],
    setupSpec() {
        login(users.system)
    },
    // the organization's defaults as they were, for the specs that run after
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        system(() =>
            ec.entity
                .find("mantle.party.PartySetting")
                .condition("partyId", ids.organizationId)
                .condition("partySettingTypeId", "like", "Insights%")
                .deleteAll()
        )
    }
})

// one typed query through a tool's service, as the user
const ask = (user, service, choices) => asUser(user, () => invoke(A + service, Object.assign({}, range, choices)))
const readiness = (user, datasetId) =>
    asUser(user, () => Array.from(invoke(G + "find#SourceReadiness", {}).sources || []).find(row => row.datasetId === datasetId))

feature(
    "the administrator saves an organization's analytics defaults; a reader, a forged organization, a cap above the ceiling and a stale revision are refused",
    {
        when() {
            const read = () => asUser(users.admin, () => invoke(C + "get#Settings", {organizationPartyId: ids.organizationId}))
            const before = read()
            const input = {
                organizationPartyId: ids.organizationId,
                groupRecipientCap: "20",
                freshnessPolicyId: "InsFpHour",
                displayTimeZone: "America/Chicago",
                weekStart: "InsWsSunday",
                expectedRevision: before.revision
            }
            const store = (user, changes) => asUser(user, () => invoke(C + "store#Settings", Object.assign({}, input, changes)))
            const overCeiling = store(users.admin, {groupRecipientCap: String(before.recipientCeiling + 1)})
            const reader = store(users.reader, {})
            const forged = store(users.admin, {organizationPartyId: "ORG_NOT_THERE"})
            const storedBefore = system(() =>
                ec.entity
                    .find("mantle.party.PartySetting")
                    .condition("partyId", ids.organizationId)
                    .condition("partySettingTypeId", "like", "Insights%")
                    .count()
            )
            const stored = store(users.admin, {})
            const stale = store(users.admin, {groupRecipientCap: "30"})
            const after = read()
            return {before, overCeiling, reader, forged, storedBefore, stored, stale, after}
        },
        then({before, overCeiling, reader, forged, storedBefore, stored, stale, after}) {
            before.canEdit && before.settings.groupRecipientCap == 50 && before.recipientCeiling == 200
            before.settings.freshnessPolicyId == "InsFpDay" && before.settings.displayTimeZone == null
            overCeiling.applied === false && overCeiling.reasonCode == "RECIPIENT_CAP_CEILING"
            reader.applied === false && reader.reasonCode == "INSIGHTS_SETTINGS_REQUIRED"
            forged.applied === false && forged.reasonCode == "ORGANIZATION_UNAVAILABLE"
            storedBefore == 0
            stored.applied === true && stored.changedCount == 4
            stale.applied === false && stale.reasonCode == "SETTINGS_CHANGED"
            after.settings.groupRecipientCap == 20 && after.settings.weekStart == "InsWsSunday"
            after.revision != before.revision
        }
    }
)

feature(
    "the organization's cap and display zone are what its users' delivery and context then use, and no other organization's",
    {
        when() {
            return {
                retail: asUser(users.distributor, () =>
                    invoke("ironstone.insights.DeliveryServices.check#Audience", {
                        definitionId: "insights-suite",
                        recipientUserIds: [],
                        recipientGroupIds: []
                    })
                ),
                services: asUser(users.services, () => insightsLib().recipientCap()),
                defaults: asUser(
                    users.reader,
                    () => invoke(C + "get#Context", {appRoot: "Insights", organizationPartyId: ids.organizationId}).defaults
                ),
                otherDefaults: asUser(users.services, () => invoke(C + "get#Context", {appRoot: "Insights"}).defaults),
                // a reader reads the controls in effect, never the form
                reader: asUser(users.reader, () => invoke(C + "get#Settings", {organizationPartyId: ids.organizationId}))
            }
        },
        then({retail, services, defaults, otherDefaults, reader}) {
            retail.recipientCap == 20
            services == 50
            defaults.displayTimeZone == "America/Chicago" && defaults.weekStart == "InsWsSunday"
            otherDefaults.displayTimeZone == null
            reader.canView === false && reader.settings == null && reader.sources.length == 0
            reader.controls.some(row => row.control == "Group recipients" && row.value.includes("At most 20"))
        }
    }
)

feature(
    "a source rebuilt two hours ago is stale with its lag where the organization allows an hour; its refresh is the steward's",
    {
        when() {
            system(() => {
                const row = ec.entity.makeValue("moqui.report.BusinessDataset")
                row.setFields(
                    {datasetId: salesId, lastIndexedDate: new Date(Date.now() - 2 * 3600 * 1000).toJSON()},
                    true,
                    null,
                    null
                )
                row.update()
            })
            const refreshKey = "insights.dataset." + salesId + ".index"
            const request = {refreshKey, reason: "Two hours behind"}
            const stale = readiness(users.reader, salesId)
            const otherOrganization = readiness(users.services, salesId)
            const hidden = readiness(users.reader, "mantle-inventory")
            const waiting = readiness(users.steward, "mantle-inventory")
            const author = asUser(users.author, () => refusal(REFRESH, request))
            const reader = asUser(users.reader, () => refusal(REFRESH, request))
            const offered = readiness(users.steward, salesId)
            const refreshed = asUser(users.steward, () => invoke(REFRESH, request))
            const fresh = readiness(users.reader, salesId)
            return {stale, otherOrganization, hidden, waiting, author, reader, offered, refreshKey, refreshed, fresh}
        },
        then({stale, otherOrganization, hidden, waiting, author, reader, offered, refreshKey, refreshed, fresh}) {
            stale.state == "stale" && stale.lagText == "2 hours" && stale.message.includes("2 hours ago")
            stale.domainOwner == "Sales" && stale.refreshKey == null
            otherOrganization.state == "ready" && otherOrganization.lagText == "2 hours"
            hidden == null
            waiting.state == "warning"
            author.includes("REFRESH_DENIED")
            reader.includes("not authorized")
            offered.refreshKey == refreshKey
            refreshed.state == "requested"
            // the index's size, every organization's documents together, is not a reader's
            fresh.state == "ready" && fresh.coverage == ""
        }
    }
)

feature(
    "Assist's query answers each reader their own organization's rows and refuses an unadmitted, a cost and a forged source",
    {
        when() {
            // the cost dataset admitted: a line of the Retail order, indexed, and the steward's admission
            system(() => {
                const item = ec.entity.makeValue("mantle.order.OrderItem")
                item.setFields(
                    {
                        orderId: orders.retail,
                        orderItemSeqId: "01",
                        orderPartSeqId: "01",
                        itemTypeEnumId: "ItemProduct",
                        itemDescription: "Insights settings spec line",
                        quantity: 1,
                        unitAmount: 20
                    },
                    true,
                    null,
                    null
                )
                item.create()
                ec.search.indexDocuments(ec.entity.getDataDocuments("MantleSalesOrderItem", {orderId: orders.retail}))
            })
            const itemsId = "mantle-sales-items"
            const admitted = asUser(users.steward, () =>
                invoke("org.moqui.report.ReportServices.store#BusinessDataset", {datasetId: itemsId, admit: true})
            )
            const count = {datasetId: salesId, aggregate: "count", groupBy: "currencyUomId"}
            const one = orderId => Object.assign({}, count, {filterField: "orderId", filterValue: orderId})
            const cost = {datasetId: itemsId, aggregate: "sum", measureField: "itemSaleTotal", groupBy: "currencyUomId"}
            const exposures = system(() => Array.from(ec.entity.find("moqui.agent.AgentToolExposure").list()))
            const tool = name => exposures.find(row => row.toolName === name) || {}
            return {
                admitted: admitted.dataset?.status,
                byCurrency: ask(users.reader, "run#DatasetQuery", count),
                own: ask(users.reader, "run#DatasetQuery", one(orders.retail)),
                other: ask(users.reader, "run#DatasetQuery", one(orders.services)),
                forged: ask(
                    users.reader,
                    "run#DatasetQuery",
                    Object.assign({organizationPartyId: ids.otherOrganizationId}, count)
                ),
                unadmitted: ask(users.reader, "run#DatasetQuery", {datasetId: "mantle-inventory", aggregate: "count"}),
                unclassified: ask(users.reader, "run#DatasetQuery", {datasetId: "otel_spans", aggregate: "count"}),
                costReader: ask(users.reader, "run#DatasetQuery", cost),
                costFinance: ask(users.finance, "run#DatasetQuery", cost),
                costMcp: ask(users.finance, "run#OperationsQuery", cost),
                fieldReader: ask(users.reader, "run#DatasetQuery", {
                    datasetId: salesId,
                    aggregate: "sum",
                    measureField: "itemCostTotal"
                }),
                mcp: ask(users.reader, "run#OperationsQuery", one(orders.retail)),
                readerSources: asUser(users.reader, () => invoke(A + "find#QuerySources", {}).datasets.map(row => row.datasetId)),
                mcpSources: asUser(users.finance, () =>
                    invoke(A + "find#OperationsSources", {}).datasets.map(row => row.datasetId)
                ),
                engineTools: exposures.filter(row => String(row.serviceName).startsWith("org.moqui.report.")).length,
                assistTool: tool("insights_query").exposeAssistant + tool("insights_query").exposeMcp,
                mcpTool: tool("insights_operations_query").exposeAssistant + tool("insights_operations_query").exposeMcp
            }
        },
        then(r) {
            r.admitted == "admitted"
            r.byCurrency.available &&
                r.byCurrency.rows.some(row => row.label == "USD") &&
                r.byCurrency.panel.startsWith("Panel: {")
            r.own.available && r.own.sourceCount == 1
            r.other.available && r.other.sourceCount == 0
            r.forged.available === false && r.forged.refusedCode == "ORGANIZATION_UNAVAILABLE"
            r.unadmitted.refusedCode == "DATASET_UNAVAILABLE"
            r.unclassified.refusedCode == "DATASET_UNAVAILABLE"
            r.costReader.refusedCode == "DATASET_RESTRICTED"
            r.costFinance.available === true
            r.costMcp.refusedCode == "DATASET_RESTRICTED"
            r.fieldReader.refusedCode == "FIELD_RESTRICTED"
            r.mcp.available && r.mcp.sourceCount == 1
            r.readerSources.includes(salesId) && !r.readerSources.includes("mantle-sales-items")
            !r.mcpSources.includes("mantle-sales-items")
            r.engineTools == 0
            r.assistTool == "YN" && r.mcpTool == "NY"
        }
    }
)

feature(
    "a dashboard's number is its saved panel's own result; a panel that reads a cost dataset in any of its queries is refused",
    {
        when() {
            const itemsId = "mantle-sales-items"
            const suiteOrders = {definitionId: "insights-suite", panelId: "orders"}
            // an author's panel of two queries, the second over the cost dataset under a name of its own (the P10 review, R1)
            const mixedId = "ins-p10-mixed-panel"
            asUser(users.author, () =>
                invoke("org.moqui.report.ReportServices.save#Definition", {
                    definition: {
                        id: mixedId,
                        type: "panel",
                        title: "Orders and lines",
                        body: {
                            title: "Orders and lines",
                            visualization: "table",
                            queries: [
                                {datasetId: salesId, aggregations: []},
                                {
                                    datasetId: itemsId,
                                    aggregations: [{id: "value", type: "sum", role: "metric", params: {field: "itemSaleTotal"}}]
                                }
                            ]
                        }
                    }
                })
            )
            return {
                panel: ask(users.reader, "run#PanelQuery", suiteOrders),
                panelMcp: ask(users.reader, "run#OperationsPanel", suiteOrders),
                forged: ask(
                    users.reader,
                    "run#PanelQuery",
                    Object.assign({organizationPartyId: ids.otherOrganizationId}, suiteOrders)
                ),
                unread: ask(users.reader, "run#PanelQuery", {definitionId: "INS_NOT_A_DASHBOARD", panelId: "orders"}),
                inherited: ask(users.reader, "run#PanelQuery", {definitionId: "insights-suite", panelId: "constructor"}),
                // the first query's dataset is open to an MCP client; the second is the cost dataset
                mixedMcp: ask(users.author, "run#OperationsPanel", {definitionId: mixedId, queryReference: "0"})
            }
        },
        then(r) {
            r.panel.available && r.panel.rows.some(row => row.label == "USD") && r.panel.meaning.metricId == "Sales.Orders"
            r.panelMcp.available && r.panelMcp.rows.length == r.panel.rows.length
            r.forged.available === false && r.forged.refusedCode == "ORGANIZATION_UNAVAILABLE"
            r.unread.available === false && r.unread.refusedCode == "PANEL_UNAVAILABLE"
            r.inherited.available === false && r.inherited.refusedCode == "PANEL_UNAVAILABLE"
            r.mixedMcp.available === false && r.mixedMcp.refusedCode == "DATASET_RESTRICTED"
        }
    }
)

feature(
    "Add to my dashboard saves an author's answer as their own panel through Analysis; a reader and an answer without a query are refused",
    {
        when() {
            const answer = ask(users.reader, "run#DatasetQuery", {
                datasetId: salesId,
                aggregate: "count",
                groupBy: "currencyUomId"
            })
            const answerText = "Orders by currency over the last day:\n\n| Currency | Orders |\n| USD | 5 |\n\n" + answer.panel
            const add = (user, text) =>
                asUser(user, () => invoke(A + "add#AssistPanel", {answerText: text, title: "Orders by currency (Assist)"}))
            const reader = add(users.reader, answerText)
            const noQuery = add(users.author, "Orders are up. No query here.")
            const forgedLine = add(
                users.author,
                'Panel: {"datasetId":"mantle-sales-items","aggregate":"count","serviceName":"x"}'
            )
            const saved = add(users.author, answerText)
            const definition = saved.definitionId
                ? system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", saved.definitionId).one())
                : null
            const authorId = system(
                () => ec.entity.find("moqui.security.UserAccount").condition("username", users.author).one().userId
            )
            return {reader, noQuery, forgedLine, saved, definition, authorId}
        },
        then({reader, noQuery, forgedLine, saved, definition, authorId}) {
            reader.applied === false && reader.reasonCode == "INSIGHTS_AUTHOR_REQUIRED"
            noQuery.applied === false && noQuery.reasonCode == "PANEL_REQUIRED"
            forgedLine.applied === false && forgedLine.reasonCode == "DATASET_RESTRICTED"
            saved.applied === true && saved.definitionId.startsWith("analysis-")
            definition.definitionType == "panel" && definition.ownerId == authorId && definition.userGroupId == null
        }
    }
)

feature("Settings, Data readiness and Add to my dashboard each render once", {
    when() {
        const settings = asUser(users.admin, () => page("Settings/AnalyticsSettings", {organizationPartyId: ids.organizationId}))
        const sources = asUser(users.reader, () => page("Settings/DataReadiness"))
        const add = asUser(users.reader, () => page("AddToDashboard", {}, "html"))
        return {settings, sources, add}
    },
    then({settings, sources, add}) {
        settings.status == 200 && settings.errors.length == 0
        settings.output.includes("Analytics defaults") && settings.output.includes("Scope and delivery")
        settings.output.includes("Source owners") && settings.output.includes("Save settings")
        settings.output.includes("At most 20")
        sources.status == 200 && sources.errors.length == 0
        sources.output.includes("Data readiness") && sources.output.includes("Sales orders")
        !sources.output.includes("Request refresh")
        add.status == 200 && add.errors.length == 0
        add.output.includes("needs Insights authoring") && !add.output.includes("Add panel")
    }
})
