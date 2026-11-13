// Insights P9's "usable when" (impl-insights P9; design-insights §9 and §13.3 "Editable map copies"), server side through the
// screens on the demo data, with artifact authorization on: the flow editor of Ziziwork Retail copies the suite's customer
// flow for their organization, renames a step and links a Knowledge page they read; a system administrator, who opens every
// app, sees the step's count equal to Commerce's own and opens Commerce's orders with the filter that is counted; an Insights
// reader who is a Customer Service manager opens Customer Service's cases from the map and the step's procedure in
// ProcessStory, and is given no link into Commerce; a plain reader reads the map with no link at all; the Sales and Marketing
// steps read as information; a later version of the template leaves the copy as it is and says so; and the copy is removed
// at the end, so the demo data is left as it was. The rules are the regression InsightsFlowMaps. Written with P9, not run as
// part of it.
// Run: ./moq accept mr-boss --spec InsightsFlowMapsUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const F = "ironstone.insights.FlowMapServices."
const webroot = "component://webroot/screen/webroot.xml"
const template = "insights-flowmap-customer"
const title = "Retail customer flow " + String(Date.now()).slice(-6)
let mapId
let pageId

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).useCache(false).one())
const body = () => JSON.parse(String(one("moqui.report.Definition", {definitionId: mapId}).bodyJson))
const stepOf = (map, stepId) => Array.from(map.steps || []).find(step => step.stepId === stepId) || {}
// a screen or a transition as the user: a page in qvt (html for another app's list), a transition as a post or a get
function screen(user, path, parameters = {}, method = null, mode = "qvt") {
    return asUser(user, () => {
        const test = ec.screen.makeTest().rootScreen(webroot)
        if (!method) {
            test.renderMode(mode)
            if (mode === "qvt") test.withStaticData()
        }
        const result = test.render(
            "apps/" + path,
            Object.assign(!method && mode === "qvt" ? {lastStandalone: "true"} : {}, parameters),
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
// a link the map answers, opened as the user in its owner's app
function open(user, url) {
    const [path, query] = String(url).replace("/qapps/", "").split("?")
    const parameters = Object.fromEntries(
        String(query || "")
            .split("&")
            .filter(Boolean)
            .map(pair => pair.split("=").map(decodeURIComponent))
    )
    return screen(user, path, parameters, null, "html")
}

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        if (mapId && one("moqui.report.Definition", {definitionId: mapId}))
            asUser(users.flow, () => invoke(F + "delete#Map", {definitionId: mapId}))
        system(() => ec.entity.find("moqui.security.UserPreference").condition("preferenceKey", "InsightsFlowMap").deleteAll())
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the flow editor copies the customer flow for Ziziwork Retail, and the copy records its source", {
    when() {
        const maps = screen(users.flow, "Insights/Flows/FlowMaps")
        const copied = screen(
            users.flow,
            "Insights/Flows/FlowMaps/copyMap",
            // shared with the BOSS users' group, so every Retail user of Insights reads it
            {
                sourceDefinitionId: template,
                sourceVersion: 1,
                copyOrganizationPartyId: ids.organizationId,
                copyTitle: title,
                copyUserGroupId: "BOSS_USERS"
            },
            "post"
        )
        mapId = one("moqui.report.Definition", {title, ownerId: "BOSS_INS_FLOW"})?.definitionId
        return {
            maps,
            copied,
            saved: mapId ? body() : {},
            editor: screen(users.flow, "Insights/Flows/FlowMapEditor", {definitionId: mapId})
        }
    },
    then({maps, copied, saved, editor}) {
        maps.status == 200
        maps.errors == ""
        maps.output.includes("Customer flow")
        maps.output.includes("Suite template")
        copied.errors == ""
        mapId != null
        saved.sourceDefinitionId == "insights-flowmap-customer"
        saved.sourceVersion == 1
        saved.organizationPartyId == "ORG_ZIZI_RETAIL"
        editor.status == 200
        editor.errors == ""
        editor.output.includes("Copied from Customer flow, version 1")
        editor.output.includes("Ziziwork Retail")
    }
})

feature("they rename a step and link a Knowledge page they read", {
    when() {
        const pages = asUser(users.flow, () => invoke(F + "find#MapPages", {term: "Returns policy"})).pages
        pageId = pages.length ? pages[0].value : null
        const step = body().steps.find(row => row.stepId === "approve")
        const saved = screen(
            users.flow,
            "Insights/Flows/FlowMapEditor/storeStep",
            {
                definitionId: mapId,
                expectedVersion: 1,
                storeStepId: "approve",
                laneId: step.laneId,
                stepTitle: "Manager approves the order",
                stepDescription: step.description,
                targetRegistrationId: step.targetRegistrationId,
                targetParametersText: "statusId=OrderPlaced",
                countProviderKey: step.countProviderKey,
                wikiPageId: pageId,
                nextStepIds: "pick"
            },
            "post"
        )
        // a second editor's page, read before that save
        const stale = asUser(users.flow, () =>
            invoke(F + "store#MapStep", {
                definitionId: mapId,
                expectedVersion: 1,
                stepId: "approve",
                laneId: step.laneId,
                title: "Late"
            })
        )
        return {
            saved,
            stale,
            step: body().steps.find(row => row.stepId === "approve"),
            version: Number(one("moqui.report.Definition", {definitionId: mapId}).versionNumber)
        }
    },
    then({saved, stale, step, version}) {
        pageId != null
        saved.errors == ""
        version == 2
        step.title == "Manager approves the order"
        step.wikiPageId == pageId
        step.targetParameters.statusId == "OrderPlaced"
        stale.applied == false
        stale.reasonCode == "MAP_CHANGED"
    }
})

feature("a reader of every app sees the step's count, Commerce's own, and opens Commerce's orders from it", {
    when() {
        const map = asUser(users.system, () => invoke(F + "get#Map", {definitionId: mapId}))
        const approve = stepOf(map, "approve")
        // Commerce's own count, as Commerce Home reads it for him: the service is Commerce Home's, granted through its screen
        // and not to a direct call, and scopes itself by the user's stores (COMMERCE_VIEW and the store scope), so it is
        // called as him with the artifact check off
        const own = asUser(users.system, () => system(() => invoke("mantle.order.StoreOperationsServices.get#StoreWorkSummary", {})))
        return {
            approve,
            expected: Number(own.counts.toApprove),
            orders: open(users.system, approve.url),
            counted: open(users.system, approve.countUrl),
            quote: stepOf(map, "quote"),
            findUs: stepOf(map, "find-us"),
            page: screen(users.system, "Insights/Flows/FlowMap", {definitionId: mapId, stepId: "approve"})
        }
    },
    then({approve, expected, orders, counted, quote, findUs, page}) {
        approve.title == "Manager approves the order"
        approve.url == "/qapps/Commerce/Orders/Orders?statusId=OrderPlaced"
        approve.countText == String(expected)
        orders.status == 200
        orders.errors == ""
        counted.status == 200
        // the Sales and Marketing steps, whose apps are not built
        quote.stateText == "Information"
        quote.url == null
        findUs.stateText == "Information"
        page.status == 200
        page.errors == ""
        page.output.includes("Manager approves the order")
        page.output.includes("Read procedure")
        page.output.includes("Copied from Customer flow, version 1")
    }
})

feature(
    "a Customer Service manager opens the cases and the procedure from the map, and nothing of Commerce; a plain reader no link",
    {
        when() {
            const map = asUser(users.serviceManager, () => invoke(F + "get#Map", {definitionId: mapId, stepId: "approve"}))
            const cases = stepOf(map, "case")
            const approve = stepOf(map, "approve")
            const reader = asUser(users.reader, () => invoke(F + "get#Map", {definitionId: mapId}))
            return {
                cases,
                approve,
                opened: open(users.serviceManager, cases.url),
                // its own level and below, as the shell loads it (lastStandalone -4: from the webroot, past apps, Insights and
                // Flows); its default subscreen, Knowledge, is a .qvue screen with no qvt, which the shell loads apart in qvue
                story: screen(users.serviceManager, "Insights/Flows/ProcessStory", {
                    wikiPageId: pageId,
                    definitionId: mapId,
                    stepId: "approve",
                    lastStandalone: "-4"
                }),
                page: screen(users.serviceManager, "Insights/Flows/ProcessStory/Knowledge/page", {wikiPageId: pageId}, "get"),
                readerLinks: Array.from(reader.steps).filter(step => step.url || step.countText).length,
                readerTitle: stepOf(reader, "approve").title,
                // another organization's reader, in the group the map is shared with
                services: asUser(users.services, () => invoke(F + "find#Maps", {})).maps.map(row => row.definitionId)
            }
        },
        then({cases, approve, opened, story, page, readerLinks, readerTitle, services}) {
            cases.url == "/qapps/CustomerService/Cases/Cases"
            opened.status == 200
            opened.errors == ""
            // the order step keeps its explanation and its procedure, with no link into Commerce and no count of it
            approve.url == null
            approve.countText == ""
            approve.articleUrl.includes("/qapps/Insights/Flows/ProcessStory/Knowledge?wikiPageId=" + pageId)
            story.status == 200
            story.errors == ""
            story.output.includes("Back to " + title)
            page.status == 200
            page.output.includes("Returns policy")
            readerLinks == 0
            readerTitle == "Manager approves the order"
            !services.includes(mapId)
        }
    }
)

feature("a later version of the template leaves the copy as it is, and the map says its source has changed", {
    when() {
        // as if the suite had since raised the template from the version this copy was made from
        system(() => {
            const row = ec.entity.find("moqui.report.Definition").condition("definitionId", mapId).one()
            const stored = JSON.parse(String(row.bodyJson))
            stored.sourceVersion = 0
            row.bodyJson = JSON.stringify(stored)
            row.update()
        })
        const map = asUser(users.flow, () => invoke(F + "get#Map", {definitionId: mapId}))
        return {map, approve: stepOf(map, "approve")}
    },
    then({map, approve}) {
        map.map.sourceChangedText.includes("now version 1")
        map.map.version == 2
        approve.title == "Manager approves the order"
        map.steps.length == 14
    }
})

feature("the flow editor removes the copy; the template stays", {
    when() {
        const removed = screen(
            users.flow,
            "Insights/Flows/FlowMaps/deleteMap",
            {deleteDefinitionId: mapId, expectedVersion: 2},
            "post"
        )
        return {
            removed,
            left: one("moqui.report.Definition", {definitionId: mapId}),
            template: asUser(users.reader, () => invoke(F + "get#Map", {definitionId: template})).map.title
        }
    },
    then({removed, left, template}) {
        removed.errors == ""
        left == null
        template == "Customer flow"
    }
})
