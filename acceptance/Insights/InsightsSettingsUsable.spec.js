// Insights P10's "usable when" (impl-insights P10; design-insights §11 and §13.3 "Source quality", "Assist and MCP"), server
// side through the screens and the tools' services on the demo data, with artifact authorization on: the Insights
// administrator allows Ziziwork Retail's sources an hour and is refused a recipient cap above the instance's ceiling; the
// dataset steward sees the inventory index an hour behind on Data readiness and requests its refresh, which a reader of the
// same page cannot; Assist's tools answer a reader "orders last month by currency" with the numbers of the suite dashboard's
// own panel, for their organization only; an MCP client is refused the cost dataset whatever its user holds; and an author
// keeps the answer with "Add to my dashboard". The settings are put back and the saved panel removed at the end, so the demo
// data is left as it was. It needs the sales and inventory datasets admitted, which InsightsDatasetsUsable does. The rules
// are the regression InsightsSettings. Written with P10, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsSettingsUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const C = "ironstone.insights.ContextServices."
const A = "ironstone.insights.AssistServices."
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const inventoryId = "mantle-inventory"
const lastMonth = {from: "now-1M/M", thru: "now/M"}
const panelTitle = "Orders last month by currency " + String(Date.now()).slice(-6)
let before
let panelId

// a screen or a transition as the user: a page in qvt, a transition as a post
function screen(user, path, parameters = {}, method = null) {
    return asUser(user, () => {
        const test = ec.screen.makeTest().rootScreen(webroot)
        if (!method) test.renderMode("qvt").withStaticData()
        const result = test.render(
            "apps/Insights/" + path,
            Object.assign(method ? {} : {lastStandalone: "true"}, parameters),
            method
        )
        const output = String(result.output || "")
        return {
            status: result.status,
            output,
            errors: Array.from(result.errorMessages || [])
                .concat(output.match(/(Error rendering|Exception in render)[^\n<]*/g) || [])
                .join(" | ")
        }
    })
}
const settings = () => asUser(users.admin, () => invoke(C + "get#Settings", {organizationPartyId: ids.organizationId}))
const form = (found, changes) =>
    Object.assign({settingsOrganizationPartyId: ids.organizationId, expectedRevision: found.revision}, found.settings, changes)
const source = (user, datasetId) =>
    asUser(user, () =>
        Array.from(
            invoke("ironstone.insights.RegistryServices.find#SourceReadiness", {organizationPartyId: ids.organizationId})
                .sources || []
        ).find(row => row.datasetId === datasetId)
    )
// each currency's value of a tool's rows, as text
const byCurrency = rows =>
    Array.from(rows || [])
        .map(row => row.label + " " + row.valuesText)
        .sort()
        .join("; ")

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        // the settings as they were, and the saved panel removed
        if (before) {
            const now = settings()
            asUser(users.admin, () =>
                invoke(
                    C + "store#Settings",
                    Object.assign({organizationPartyId: ids.organizationId, expectedRevision: now.revision}, before.settings)
                )
            )
        }
        if (panelId) asUser(users.author, () => invoke(R + "delete#Definition", {definitionId: panelId}))
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the administrator allows Retail's sources an hour; a cap above the instance's ceiling is refused and nothing changes", {
    when() {
        before = settings()
        const page = screen(users.admin, "Settings/AnalyticsSettings", {organizationPartyId: ids.organizationId})
        const tooMany = screen(
            users.admin,
            "Settings/AnalyticsSettings/storeSettings",
            form(before, {groupRecipientCap: String(before.recipientCeiling + 1), freshnessPolicyId: "InsFpHour"}),
            "post"
        )
        // the screen's post answers with a redirect and the refusal as its message; the service says why
        const refused = asUser(users.admin, () =>
            invoke(
                C + "store#Settings",
                Object.assign({organizationPartyId: ids.organizationId, expectedRevision: before.revision}, before.settings, {
                    groupRecipientCap: String(before.recipientCeiling + 1)
                })
            )
        )
        const afterRefusal = settings()
        const saved = screen(
            users.admin,
            "Settings/AnalyticsSettings/storeSettings",
            form(afterRefusal, {freshnessPolicyId: "InsFpHour"}),
            "post"
        )
        const reader = screen(users.reader, "Settings/AnalyticsSettings", {organizationPartyId: ids.organizationId})
        return {page, tooMany, refused, afterRefusal, saved, after: settings(), reader}
    },
    then({page, tooMany, refused, afterRefusal, saved, after, reader}) {
        page.status == 200 && page.errors == ""
        page.output.includes("Analytics defaults") && page.output.includes("Save settings")
        page.output.includes("Source owners") && page.output.includes("Scope and delivery")
        tooMany.status == 302 && tooMany.errors == ""
        refused.applied == false && refused.reasonCode == "RECIPIENT_CAP_CEILING"
        afterRefusal.revision == before.revision
        afterRefusal.settings.freshnessPolicyId == before.settings.freshnessPolicyId
        saved.errors == ""
        after.settings.freshnessPolicyId == "InsFpHour"
        after.settings.groupRecipientCap == before.settings.groupRecipientCap
        // a reader reads the controls in effect and no form
        reader.status == 200 && reader.errors == ""
        reader.output.includes("Scope and delivery") && reader.output.includes("A source is stale 1 hour after its last rebuild")
        !reader.output.includes("Save settings") && !reader.output.includes("Source owners")
    }
})

feature("the steward sees the inventory index an hour behind and requests its refresh; a reader sees it stale and cannot", {
    when() {
        // its last rebuild, 61 minutes ago
        system(() => {
            const row = ec.entity.makeValue("moqui.report.BusinessDataset")
            row.setFields(
                {datasetId: inventoryId, lastIndexedDate: new Date(Date.now() - 61 * 60 * 1000).toJSON()},
                true,
                null,
                null
            )
            row.update()
        })
        const behind = source(users.steward, inventoryId)
        const page = screen(users.steward, "Settings/DataReadiness", {
            organizationPartyId: ids.organizationId,
            source: inventoryId
        })
        const readerPage = screen(users.reader, "Settings/DataReadiness", {organizationPartyId: ids.organizationId})
        const request = {refreshKey: behind?.refreshKey || "insights.dataset." + inventoryId + ".index", reason: "An hour behind"}
        const readerRequest = screen(users.reader, "Settings/DataReadiness/requestRefresh", request, "post")
        const stillBehind = source(users.steward, inventoryId)
        const noReason = screen(users.steward, "Settings/DataReadiness/requestRefresh", {refreshKey: request.refreshKey}, "post")
        const requested = screen(users.steward, "Settings/DataReadiness/requestRefresh", request, "post")
        return {
            behind,
            page,
            readerPage,
            readerRequest,
            stillBehind,
            noReason,
            requested,
            fresh: source(users.steward, inventoryId)
        }
    },
    then({behind, page, readerPage, readerRequest, stillBehind, noReason, requested, fresh}) {
        behind.state == "stale" && behind.lagText == "61 minutes" && behind.domainOwner == "Warehouse"
        behind.refreshKey == "insights.dataset.mantle-inventory.index"
        page.status == 200 && page.errors == ""
        page.output.includes("Inventory") && page.output.includes("Stale") && page.output.includes("Request refresh")
        readerPage.status == 200 && readerPage.errors == ""
        readerPage.output.includes("Stale") && !readerPage.output.includes("Request refresh")
        readerRequest.errors != ""
        stillBehind.state == "stale"
        noReason.errors.includes("why the refresh is needed")
        requested.errors == ""
        fresh.state == "ready"
    }
})

feature(
    "Assist answers a reader orders last month by currency with the suite dashboard's own numbers, for their organization only",
    {
        when() {
            const suiteOrders = Object.assign({definitionId: "insights-suite", panelId: "orders"}, lastMonth)
            const dashboard = screen(users.reader, "Dashboard", Object.assign({definitionId: "insights-suite"}, lastMonth))
            // the panel's saved query, run by the engine as the reader for the same range: what the dashboard draws
            // (a shipped definition, read from the component's report directory, not a Definition row)
            const saved = asUser(users.reader, () => invoke(R + "get#Definition", {definitionId: "insights-suite-orders"})).definition.body
                .queries[0]
            const engine = asUser(users.reader, () => invoke(R + "run#Query", {query: Object.assign({}, saved, lastMonth)}))
            const frame = Array.from(engine.frames || [])[0] || {fields: []}
            const field = name => Array.from(frame.fields || []).find(row => row.name === name)
            // the frame's fields are named by the aggregations' ids (currency, orders)
            const engineOrders = Array.from(field("currency")?.values || [])
                .map((currency, index) => currency + " orders " + field("orders").values[index])
                .sort()
                .join("; ")
            const answer = asUser(users.reader, () => invoke(A + "run#PanelQuery", suiteOrders))
            const services = asUser(users.services, () => invoke(A + "run#PanelQuery", suiteOrders))
            const otherOrganization = asUser(users.reader, () =>
                invoke(A + "run#PanelQuery", Object.assign({organizationPartyId: ids.otherOrganizationId}, suiteOrders))
            )
            // a number no panel shows is a typed query, under the same row filter
            const typed = asUser(users.reader, () =>
                invoke(
                    A + "run#DatasetQuery",
                    Object.assign(
                        {
                            datasetId: "mantle-sales-orders",
                            aggregate: "cardinality",
                            measureField: "orderId",
                            groupBy: "vendorPartyId"
                        },
                        lastMonth
                    )
                )
            )
            return {dashboard, engineOrders, answer, services, otherOrganization, typed}
        },
        then({dashboard, engineOrders, answer, services, otherOrganization, typed}) {
            dashboard.status == 200 && dashboard.errors == ""
            engineOrders != ""
            answer.available === true
            byCurrency(
                answer.rows.map(row => ({label: row.label, valuesText: row.valuesText.replace(/^.*?(orders \S+).*$/, "$1")}))
            ) == engineOrders
            answer.meaning.metricId == "Sales.Orders"
            services.available === true
            otherOrganization.available === false && otherOrganization.refusedCode == "ORGANIZATION_UNAVAILABLE"
            typed.available === true
            typed.rows.every(row => !row.label.includes("Services"))
        }
    }
)

feature("an MCP client is refused the cost dataset whatever its user holds, and reads business operations", {
    when() {
        const cost = Object.assign(
            {datasetId: "mantle-sales-items", aggregate: "sum", measureField: "itemCostTotal", groupBy: "currencyUomId"},
            lastMonth
        )
        const exposures = system(() => Array.from(ec.entity.find("moqui.agent.AgentToolExposure").list()))
        const tools = flag =>
            exposures.filter(row => row[flag] === "Y" && String(row.toolName).startsWith("insights_")).map(row => row.toolName)
        return {
            mcpFinance: asUser(users.finance, () => invoke(A + "run#OperationsQuery", cost)),
            mcpSources: asUser(users.finance, () => invoke(A + "find#OperationsSources", {}).datasets.map(row => row.datasetId)),
            mcpOrders: asUser(users.reader, () =>
                invoke(
                    A + "run#OperationsQuery",
                    Object.assign({datasetId: "mantle-sales-orders", aggregate: "count", groupBy: "currencyUomId"}, lastMonth)
                )
            ),
            // Assist, as the user: the financial reader reads costs, the plain reader does not
            assistFinance: asUser(users.finance, () => invoke(A + "run#DatasetQuery", cost)),
            assistReader: asUser(users.reader, () => invoke(A + "run#DatasetQuery", cost)),
            mcpTools: tools("exposeMcp"),
            engineTools: exposures.filter(row => String(row.serviceName).startsWith("org.moqui.report.")).length
        }
    },
    then({mcpFinance, mcpSources, mcpOrders, assistFinance, assistReader, mcpTools, engineTools}) {
        mcpFinance.available === false && mcpFinance.refusedCode == "DATASET_RESTRICTED"
        !mcpSources.includes("mantle-sales-items") && mcpSources.includes("mantle-sales-orders")
        mcpOrders.available === true
        assistFinance.available === true
        assistReader.available === false && assistReader.refusedCode == "DATASET_RESTRICTED"
        !mcpTools.includes("insights_query") && !mcpTools.includes("insights_panel") && !mcpTools.includes("insights_datasets")
        mcpTools.includes("insights_operations_query")
        engineTools == 0
    }
})

feature("an author keeps the answer with Add to my dashboard; a reader is told it needs authoring", {
    when() {
        const answer = asUser(users.author, () =>
            invoke(
                A + "run#DatasetQuery",
                Object.assign({datasetId: "mantle-sales-orders", aggregate: "count", groupBy: "currencyUomId"}, lastMonth)
            )
        )
        const frame = screen(users.author, "AddToDashboard")
        const readerFrame = screen(users.reader, "AddToDashboard")
        const added = screen(
            users.author,
            "AddToDashboard/addPanel",
            {answerText: "Orders last month by currency.\n\n" + answer.panel, panelTitle, visualization: "table"},
            "post"
        )
        const saved = system(() =>
            ec.entity.find("moqui.report.Definition").condition({title: panelTitle, ownerId: "BOSS_INS_AUTHOR"}).one()
        )
        panelId = saved?.definitionId
        const readerAdd = asUser(users.reader, () => invoke(A + "add#AssistPanel", {answerText: answer.panel, title: panelTitle}))
        return {frame, readerFrame, added, saved, readerAdd}
    },
    then({frame, readerFrame, added, saved, readerAdd}) {
        frame.status == 200 && frame.errors == "" && frame.output.includes("Add panel")
        readerFrame.status == 200 &&
            readerFrame.output.includes("needs Insights authoring") &&
            !readerFrame.output.includes("Add panel")
        added.errors == ""
        saved != null && saved.definitionType == "panel"
        readerAdd.applied === false && readerAdd.reasonCode == "INSIGHTS_AUTHOR_REQUIRED"
    }
})
