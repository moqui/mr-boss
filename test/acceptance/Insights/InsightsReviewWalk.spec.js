// Insights' review walk (impl-insights P12; design-insights §13.3 "Reader versus author/steward/distributor" and "Two
// organizations and confidential fields", §8 Verification): with artifact authorization on, a user of each Insights group with
// no other launcher (insights.reader, .author, .steward, .distributor, .flow, .admin, .finance of Ziziwork Retail, and the
// Ziziwork Services reader) is refused another organization's rows, and costs where they hold no PRODUCT_COST_VIEW, through
// every surface Insights has: Explore and its value suggestions, the engine's direct query and aggregates, exports, dashboards
// and their embeds, Home, drill and the record contexts, schedules and alerts, the palette and saved reports, flow maps, Assist
// and the MCP tools, and Insights' services called directly. Two attacks the build closed are walked again: a steward's dataset
// alias over the log index or over a business document without its filter (the P3 follow-up, impl-admin F277), and a wall
// display's device confined to its playlist and its organization's numbers (P11). The phases' own walks hold each surface's
// usable-when (InsightsDatasetsUsable, InsightsDrillUsable, InsightsDeliveryUsable, InsightsAlertsUsable,
// InsightsFlowMapsUsable, InsightsSettingsUsable, InsightsWallDisplayUsable); this walk is the cross-cutting review, written
// once. Not asserted, recorded open (impl-insights F83, F58): an admitted mantle-sales-items gives every reader its cost and
// margin fields in Explore and a direct query, since a dataset has no field classes; Assist, MCP and drill refuse them.
// Run: ./moq accept mr-boss --spec InsightsReviewWalk
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke, transition} = lib
const R = "org.moqui.report.ReportServices."
const G = "ironstone.insights.RegistryServices."
const A = "ironstone.insights.AssistServices."
const F = "ironstone.insights.FlowMapServices."
const webroot = "component://webroot/screen/webroot.xml"
const range = {from: "now-10y", thru: "now+1d"}
const salesId = "mantle-sales-orders"
const run = String(Date.now()).slice(-7)
const own = ids.organizationId
const other = ids.otherOrganizationId
// the Retail users of each group, and the Services reader; the administrator reads no business dataset
const retailUsers = [users.reader, users.author, users.steward, users.distributor, users.flow, users.finance]
const people = {reader: "BOSS_INS_READER", services: "BOSS_INS_SERVICES"}
const suitePanel = Object.assign({definitionId: "insights-suite", panelId: "orders"}, range)

// a page of Insights as the shell asks for it, as the user
function page(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .renderMode("qvt")
            .withStaticData()
            .render("apps/Insights/" + path, Object.assign({lastStandalone: "true"}, parameters || {}), null)
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        return {status: result.status, output, errors: Array.from(result.errorMessages || []).concat(failed).join(" | ")}
    })
}
// a call as the user, made once (a copy or a save is not made twice): its answer, or {refused: the message}
function attempt(user, service, parameters) {
    return asUser(user, () => {
        ec.message.pushErrors()
        try {
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            return ec.message.hasError() ? {refused: ec.message.getErrorsString()} : out
        } catch (error) {
            return {refused: String(error.message)}
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
// every value of every frame field under a result (the engine's frames: {fields: [{name, values}]}), by field name
function frameValues(value, names, found = []) {
    if (Array.isArray(value)) for (const item of value) frameValues(item, names, found)
    else if (value && typeof value === "object") {
        if (Array.isArray(value.fields))
            for (const field of value.fields)
                if (field && names.includes(field.name)) for (const v of Array.from(field.values || [])) found.push(String(v))
        for (const key of Object.keys(value)) if (key !== "fields" && key !== "variables") frameValues(value[key], names, found)
    }
    return found
}
// the vendors of the sales order rows the user reads through the engine (refused: null)
function vendors(user, extra) {
    const out = attempt(user, R + "query#Documents", Object.assign({datasetId: salesId, pageSize: 500}, range, extra || {}))
    return out.refused ? null : Array.from(out.hits || []).map(hit => String(hit.body?.vendorPartyId))
}
const orgFields = ["vendorPartyId", "organizationPartyId", "customerPartyId"]

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        ec.artifactExecution.enableAuthz()
    }
})

feature("rows: Explore, its suggestions, the direct query, aggregates and exports answer each user their own organization's", {
    when() {
        const problems = []
        for (const user of retailUsers.concat([users.services, users.admin])) {
            const theirs = user === users.services ? other : own
            const notTheirs = user === users.services ? own : other
            const read = vendors(user)
            const forged = vendors(user, {queryString: "vendorPartyId:" + notTheirs})
            if (user === users.admin) {
                if (read && read.length) problems.push(`the administrator reads sales rows: ${read.length}`)
                continue
            }
            if (!read || !read.length) problems.push(`${user} reads no sales rows`)
            else if (read.some(vendor => vendor !== theirs)) problems.push(`${user} reads another organization's rows`)
            if (forged && forged.length) problems.push(`${user}'s forged filter reads ${forged.length} rows`)
            // the aggregates and the value suggestions (Explore's value counts are terms buckets of the same query)
            const counted = attempt(user, R + "run#Query", {
                query: Object.assign(
                    {datasetId: salesId, aggregations: [{id: "v", type: "terms", role: "split-rows", params: {field: "vendorPartyId"}}]},
                    range
                )
            })
            if (counted.refused) problems.push(`${user} is refused the terms query: ${counted.refused}`)
            else if (frameValues(counted, ["vendorPartyId"]).includes(notTheirs)) problems.push(`${user}'s terms name ${notTheirs}`)
            // Explore's page, with its suggestions and value counts, as the user
            const explore = page(user, "ReportBuilder/Explore", Object.assign({datasetId: salesId}, range))
            if (explore.status != 200 || explore.errors) problems.push(`${user}'s Explore: ${explore.status} ${explore.errors}`)
            else if (explore.output.includes(notTheirs)) problems.push(`${user}'s Explore shows ${notTheirs}`)
            // the export, DatasetView's transition (the framework's screen at Insights' location): the author's and the
            // steward's, the same rows; the others refused the screen
            const exported = asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen(webroot)
                    .render(
                        "apps/Insights/ReportBuilder/DatasetView/exportDocuments",
                        Object.assign({datasetId: salesId, format: "csv", requestedRowLimit: 10000}, range),
                        null
                    )
                const errors = Array.from(result.errorMessages || []).join(" | ")
                return {
                    refused: errors || (result.status == 200 ? "" : String(result.status)),
                    content: String(result.output || "")
                }
            })
            const exports = user === users.author || user === users.steward
            if (exports && exported.refused) problems.push(`${user} is refused the export: ${exported.refused}`)
            if (!exports && !exported.refused) problems.push(`${user} exports the dataset`)
            if (exported.content.includes(notTheirs)) problems.push(`${user}'s export holds ${notTheirs}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("dashboards, their embeds and Home keep the organization in scope over any variable a request sends", {
    when() {
        const problems = []
        for (const user of retailUsers.concat([users.services])) {
            const notTheirs = user === users.services ? own : other
            // the Sales dashboard with a forged organization variable: the fixed scope replaces it
            const board = page(user, "Dashboard", Object.assign({definitionId: "mantle-sales", "var-organizationPartyId": notTheirs}, range))
            if (board.status != 200 || board.errors) problems.push(`${user}'s dashboard: ${board.status} ${board.errors}`)
            else if (user !== users.services && board.output.includes(notTheirs)) problems.push(`${user}'s dashboard shows ${notTheirs}`)
            // an embed (Home's report-embed, the engine's render of one panel) with the forged variables
            const embed = attempt(
                user,
                R + "render#Dashboard",
                Object.assign({variables: {organizationPartyId: notTheirs, vendorPartyId: notTheirs}}, suitePanel)
            )
            if (!embed.refused && frameValues(embed.dashboard, orgFields).includes(notTheirs)) problems.push(`${user}'s embed holds ${notTheirs}`)
            // Home for another organization: refused, with its reason as an answer (P12, impl-admin F129)
            const home = attempt(user, G + "get#Home", {organizationPartyId: notTheirs, answerRefusal: true})
            if (home.refusalCode !== "ORGANIZATION_UNAVAILABLE") problems.push(`${user}'s Home of ${notTheirs}: ${JSON.stringify(home).substring(0, 160)}`)
            const layout = attempt(user, G + "store#HomeLayout", {organizationPartyId: notTheirs})
            if (!String(layout.refused || "").includes("ORGANIZATION_UNAVAILABLE")) problems.push(`${user} arranges ${notTheirs}'s Home`)
            const context = attempt(user, "ironstone.insights.ContextServices.get#Context", {appRoot: "Insights", organizationPartyId: notTheirs})
            if (!String(context.refused || "").includes("ORGANIZATION_UNAVAILABLE")) problems.push(`${user} gets ${notTheirs}'s context`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("drill and the record contexts answer the viewer's own organization's records; another's is not available", {
    when() {
        const problems = []
        const servicesOrders = Array.from(
            attempt(users.services, R + "query#Documents", Object.assign({datasetId: salesId, pageSize: 20}, range)).hits || []
        ).map(hit => String(hit.body?.orderId))
        const vendorOf = orderId =>
            system(() => (ec.entity.find("mantle.order.OrderPart").condition("orderId", orderId).list()[0] || {}).vendorPartyId)
        for (const user of retailUsers) {
            const refused = attempt(user, "ironstone.insights.DrillServices.get#Drill", Object.assign({organizationPartyId: other, answerRefusal: true}, suitePanel))
            if (refused.refusalCode !== "ORGANIZATION_UNAVAILABLE") problems.push(`${user} drills ${other}: ${JSON.stringify(refused).substring(0, 160)}`)
            const forged = attempt(
                user,
                "ironstone.insights.DrillServices.get#Drill",
                Object.assign({variablesJson: JSON.stringify({organizationPartyId: other, vendorPartyId: other})}, suitePanel)
            )
            const drilled = Array.from(forged.drill?.rows || []).map(row => row.recordParameters?.orderId).filter(Boolean)
            if (drilled.some(orderId => vendorOf(orderId) === other)) problems.push(`${user}'s drill reaches ${other}'s orders`)
            if (servicesOrders.length) {
                const record = attempt(user, "ironstone.insights.DrillServices.get#Record", {recordType: "OrderDetail", recordId: servicesOrders[0]})
                if (record.record?.recordFound) problems.push(`${user} reads ${other}'s order ${servicesOrders[0]}`)
            }
        }
        const servicesOwn = servicesOrders.length
            ? attempt(users.services, "ironstone.insights.DrillServices.get#Record", {recordType: "OrderDetail", recordId: servicesOrders[0]})
            : {record: {recordFound: true}}
        return {problems, servicesOrders: servicesOrders.length, servicesOwn: !!servicesOwn.record?.recordFound}
    },
    then({problems, servicesOrders, servicesOwn}) {
        problems.join("\n") == ""
        servicesOrders > 0
        servicesOwn
    }
})

feature("costs: Assist refuses the cost dataset to a reader without PRODUCT_COST_VIEW, and every MCP client whatever it holds", {
    when() {
        const cost = Object.assign({datasetId: "mantle-sales-items", aggregate: "sum", measureField: "itemCostTotal", groupBy: "currencyUomId"}, range)
        const out = {}
        for (const user of [users.reader, users.author, users.distributor, users.services]) out[user] = attempt(user, A + "run#DatasetQuery", cost)
        out.finance = attempt(users.finance, A + "run#DatasetQuery", cost)
        out.mcp = attempt(users.finance, A + "run#OperationsQuery", cost)
        out.mcpSources = Array.from(attempt(users.finance, A + "find#OperationsSources", {}).datasets || []).map(row => row.datasetId)
        return {out}
    },
    then({out}) {
        [users.reader, users.author, users.distributor, users.services].every(
            user => out[user].available === false && out[user].refusedCode == "DATASET_RESTRICTED"
        )
        out.finance.available === true
        out.mcp.available === false && out.mcp.refusedCode == "DATASET_RESTRICTED"
        !out.mcpSources.includes("mantle-sales-items")
    }
})

feature("Assist answers from the same scoped query as the page; another organization is refused with its reason", {
    when() {
        const problems = []
        for (const user of retailUsers) {
            const refused = attempt(user, A + "run#PanelQuery", Object.assign({organizationPartyId: other}, suitePanel))
            if (!(refused.available === false && refused.refusedCode == "ORGANIZATION_UNAVAILABLE"))
                problems.push(`${user} asks Assist of ${other}: ${JSON.stringify(refused).substring(0, 160)}`)
            const typed = attempt(
                user,
                A + "run#DatasetQuery",
                Object.assign({datasetId: salesId, aggregate: "cardinality", measureField: "orderId", groupBy: "vendorPartyId"}, range)
            )
            if (typed.available && Array.from(typed.rows || []).some(row => String(row.label).includes("Services")))
                problems.push(`${user}'s typed answer names Ziziwork Services`)
        }
        const services = attempt(users.services, A + "run#PanelQuery", suitePanel)
        return {problems, services}
    },
    then({problems, services}) {
        problems.join("\n") == ""
        services.available === true
    }
})

feature("schedules and alerts reach only owner-equivalent recipients, each refusal named without the other's data", {
    when() {
        // the engine's own audience check, which Scheduled reports' screens (the framework's) ask as the viewer: the
        // distributor's, and not a reader's
        const audience = attempt(users.distributor, R + "check#ReportAudience", {
            definitionId: "mantle-sales",
            recipientUserIds: [people.reader, people.services]
        })
        const readerAudience = attempt(users.reader, R + "check#ReportAudience", {definitionId: "mantle-sales", recipientUserIds: [people.services]})
        const title = "Review walk breaches " + run
        // Business alerts' screens (the framework's, at Insights' locations), by the transitions a browser posts
        const post = (path, parameters) => transition(users.distributor, webroot, "apps/Insights/Alerts/" + path, parameters)
        const copied = post("Rules/copyAlert", {sourceDefinitionId: "boss-service-sla-breach", title})
        const copiedId = String(
            system(() => ec.entity.find("moqui.report.Definition").condition({title, definitionType: "alert"}).one())?.definitionId || ""
        )
        let draft = {}
        let alert = {}
        let stored = {}
        try {
            // a copy is paused (not validated): its audience is a draft that tells nobody, and activating it is the engine's
            // check of every recipient, which refuses the Services reader
            draft = post("AlertDetail/storeAudience", {
                definitionId: copiedId,
                audienceKind: "group",
                recipientUserIds: [people.reader, people.services].join(","),
                userGroupId: "BOSS_INSIGHTS"
            })
            alert = post("AlertDetail/pauseAlert", {definitionId: copiedId, paused: "false"})
            stored = system(() => JSON.parse(String(ec.entity.find("moqui.report.Definition").condition("definitionId", copiedId).one().bodyJson)))
        } finally {
            if (copiedId) post("AlertDetail/deleteAlert", {definitionId: copiedId})
        }
        return {audience, readerAudience, copied, copiedId, draft, alert, stored}
    },
    then({audience, readerAudience, copied, copiedId, draft, alert, stored}) {
        audience.eligibleCount == 1 && audience.refusedCount == 1
        !JSON.stringify(audience).includes(ids.otherOrganizationId)
        !!readerAudience.refused
        copied.errors == "" && copiedId != ""
        draft.errors == ""
        alert.errors.includes("Insights Services reader (scope-differs)")
        !alert.errors.includes(ids.otherOrganizationId)
        // the refused activation left the rule paused: it tells nobody
        stored.paused == true
    }
})

feature("the palette, saved reports and flow maps show no other organization's map, and its map is refused by id", {
    when() {
        const template = attempt(users.flow, F + "get#Map", {definitionId: "insights-flowmap-customer", counts: "N"}).map || {}
        const title = "Review walk flow " + run
        const copied = attempt(users.flow, F + "copy#Map", {
            sourceDefinitionId: "insights-flowmap-customer",
            sourceVersion: template.version,
            organizationPartyId: own,
            title,
            userGroupId: "BOSS_INSIGHTS"
        })
        const out = {copied}
        try {
            const titles = rows => Array.from(rows || []).filter(row => row.title === title).length
            out.readerPalette = titles(attempt(users.reader, "ironstone.insights.ContextServices.search#Records", {text: title}).rows)
            out.servicesPalette = titles(attempt(users.services, "ironstone.insights.ContextServices.search#Records", {text: title}).rows)
            out.servicesSaved = titles(attempt(users.services, G + "find#SavedReports", {text: title}).savedReports)
            out.servicesMaps = Array.from(attempt(users.services, F + "find#Maps", {}).maps || []).filter(row => row.title === title).length
            out.servicesMap = attempt(users.services, F + "get#Map", {definitionId: copied.definitionId}).refused || ""
            out.servicesCounts = attempt(users.reader, F + "get#Map", {definitionId: "insights-flowmap-customer", organizationPartyId: other}).refused || ""
        } finally {
            if (copied.definitionId)
                attempt(users.flow, F + "delete#Map", {definitionId: copied.definitionId, expectedVersion: copied.version})
        }
        return out
    },
    then({copied, readerPalette, servicesPalette, servicesSaved, servicesMaps, servicesMap, servicesCounts}) {
        copied.applied == true
        readerPalette == 1
        servicesPalette == 0 && servicesSaved == 0 && servicesMaps == 0
        servicesMap.includes("MAP_UNAVAILABLE")
        servicesCounts.includes("ORGANIZATION_UNAVAILABLE") || servicesCounts.includes("MAP_UNAVAILABLE")
    }
})

feature("editing grants no source: a steward's alias over the log index or a business document is refused, and nothing is kept", {
    when() {
        const save = (id, body) =>
            attempt(users.steward, R + "save#Definition", {definition: {id, type: "dataset", title: id, body}}).refused || ""
        const logs = save("insights-review-logs-" + run, {indexName: "otel_logs", timeField: "timestamp", rowFilter: {match_all: {}}})
        const raw = save("insights-review-raw-" + run, {documentType: "MantleSalesOrderPart", timeField: "_timestamp"})
        const signal = save("insights-review-signal-" + run, {documentType: "otel_logs", timeField: "timestamp", signal: "business"})
        const authorAlias = attempt(users.author, R + "save#Definition", {
            definition: {id: "insights-review-author-" + run, type: "dataset", title: "x", body: {indexName: "otel_logs", timeField: "timestamp"}}
        }).refused || ""
        const direct = attempt(users.steward, R + "query#Documents", Object.assign({datasetId: "otel_logs", pageSize: 1}, range)).refused || ""
        const kept = system(() =>
            ec.entity.find("moqui.report.Definition").condition("definitionId", "like", "insights-review-%" + run).count()
        )
        return {logs, raw, signal, authorAlias, direct, kept}
    },
    then({logs, raw, signal, authorAlias, direct, kept}) {
        logs != "" && raw != "" && signal != "" && authorAlias != "" && direct != ""
        logs.includes("org.moqui.report.dataset.otel_logs")
        raw.includes("a business dataset's document")
        kept == 0
    }
})

feature("a wall display opens its registered playlist alone, as its display account, and reads its organization's numbers only", {
    when() {
        const playlistId = "REVIEW_WALL_" + run
        const boardId = "REVIEW_WALL_BOARD_" + run
        asUser(users.system, () => {
            // shared with the wall displays as they are saved (the instance administrator names any group; an author shares
            // through Dashboard's and Playlists' share)
            invoke(R + "save#Definition", {definition: {id: boardId, type: "dashboard", title: "Review wall " + run, userGroupId: "BOSS_INSIGHTS_DISPLAY", body: {
                panels: {orders: {title: "Orders by vendor", visualization: "table", queries: [{datasetId: salesId,
                    aggregations: [{id: "v", type: "terms", role: "group", params: {field: "vendorPartyId", size: 20}}, {id: "n", type: "count", role: "metric"}]}]}},
                layout: {type: "autoGrid"}}}, note: "Review walk"})
            invoke(R + "save#Definition", {definition: {id: playlistId, type: "report", title: "Review wall " + run, userGroupId: "BOSS_INSIGHTS_DISPLAY",
                body: {kind: "playlist", seconds: 30, playlist: [{definitionId: boardId}]}}, note: "Review walk"})
        })
        const display = invoke("mantle.party.IdentityServices.create#DisplayAccount", {displayName: "Review wall display " + run,
            organizationPartyId: own, bundleGroupIdList: ["BOSS_INSIGHTS_READ", "BOSS_INSIGHTS_DISPLAY"]})
        const registered = invoke("mantle.party.IdentityServices.register#SharedDevice", {deviceName: "Review wall " + run,
            routeGroupId: "INSIGHTS_PLAYLISTS", displayUserId: display.userId, parameterValue: playlistId, issueCode: false})
        const code = invoke("mantle.party.IdentityServices.reveal#SharedDeviceCode", {deviceId: registered.deviceId}).registrationCode
        const redeemed = ec.screen.makeTest().rootScreen(webroot).render("Device/redeem", {code}, "post")
        const cookie = String(redeemed.header("Set-Cookie") || "").split(";")[0].replace("moqui.device=", "")
        login(users.system)
        const request = (path, parameters, mode, method) => {
            let test = ec.screen.makeTest().rootScreen(webroot)
            if (mode) test = test.renderMode(mode)
            const out = test.header("cookie", "moqui.device=" + cookie).render(path, parameters || {}, method || "get")
            ec.message.clearErrors()
            return {status: out.status, output: String(out.output || ""), errors: Array.from(out.errorMessages || []).join("\n")}
        }
        const outside = out => out.errors.includes("This device opens only INSIGHTS_PLAYLISTS")
        const out = {}
        try {
            const data = request("apps/Insights/WallDisplay/data", {index: "0", definitionId: "insights-suite"})
            out.data = data.status == 200 ? JSON.parse(data.output) : {}
            out.island = request("apps/Insights/WallDisplay", {definitionId: "insights-suite"}, "qvt").output
            const paths = ["apps/Insights/Home", "apps/Insights/Dashboard", "apps/Insights/ReportBuilder/Explore", "apps/Insights/Playlists",
                "apps/Insights/Chatter/chatterData", "apps/Insights/Records/OrderDetail", "apps/Insights/Flows/FlowMap",
                "apps/Insights/ScheduledReports", "qapps/Insights/Home"]
            out.opened = paths.filter(path => !outside(request(path, {definitionId: "mantle-sales"})))
        } finally {
            invoke("mantle.party.IdentityServices.revoke#SharedDevice", {deviceId: registered.deviceId, reason: "Review walk"})
        }
        out.afterRevoke = request("apps/Insights/WallDisplay/data", {index: "0"})
        out.playlistId = playlistId
        out.boardId = boardId
        return out
    },
    then({data, island, opened, afterRevoke, playlistId, boardId}) {
        data.dashboard.definitionId == boardId
        !frameValues(data, ["vendorPartyId"]).includes(ids.otherOrganizationId)
        island.includes(boardId) && !island.includes("insights-suite")
        opened.join(", ") == ""
        afterRevoke.errors.includes("registration was revoked")
    }
})
