// Insights Home and attention (impl-insights P5; design-insights §3 Home): Home's one qvt render (the reader's scope, the
// first-use state, the suite dashboard's panels and the attention board, nothing from an app they cannot read); get#Attention
// calls each provider as the viewer, a failing provider affects its own card only, an unreadable or refusing one is left out
// and nothing is added into a total; the registered providers name existing services and owner screens (impl-insights F29)
// and an owner's user sees its cards; get#Home's arrangement is the InsightsHome preference only, over a dashboard and panels
// the user reads. The "usable when" scenario is the acceptance InsightsHomeUsable.
// Run: ./moq test mr-boss --spec InsightsHome
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const G = "ironstone.insights.RegistryServices."
const specOwner = "InsightsSpec"
const preferenceKeys = ["InsightsHome", "REPORT_STARRED", "REPORT_RECENT", "FacilityActive"]
const userIds = ["BOSS_INS_READER", "BOSS_INS_AUTHOR", "BOSS_INS_WAREHOUSE"]
// The F29 cards each owner's Home counts by its worklist's own query, and Monitor's Business operations dashboard (F19).
const registeredKeys = [
    "Commerce.ToApprove",
    "Commerce.PaymentHolds",
    "Commerce.PlacementsWaiting",
    "Commerce.OpenCarts",
    "Commerce.IntegrationErrors",
    "Accounting.DraftEntries",
    "Accounting.PostedEntries",
    "Accounting.BillsAwaitingApproval",
    "Accounting.BillsOnHold",
    "Accounting.CostClose",
    "Products.ActiveSkus",
    "Products.Variants",
    "Products.EndingSoon",
    "Purchasing.DraftOrders",
    "Purchasing.ApprovedNotSent",
    "Purchasing.Unacknowledged",
    "Purchasing.LateReceipts",
    "Purchasing.HeldBills",
    "Purchasing.QuotesExpiring",
    "Manufacturing.OpenOrders",
    "Manufacturing.InProgress",
    "Manufacturing.Late",
    "Projects.ReviewsWaiting",
    "Projects.ApproveTime",
    "Projects.AllocationRequests",
    "Warehouse.Receiving",
    "Monitor.OperationFailures",
    // Maintenance's (impl-maintenance P17)
    "Maintenance.Unassigned",
    "Maintenance.OverduePm",
    "Maintenance.ResourcesDown",
    // People's (impl-people P29)
    "People.NoManager",
    "People.Vacancies",
    "People.Decisions"
]
// The spec's own providers (owner InsightsSpec), over Insights' own services: one that answers, one whose answer lacks its
// count and one whose call fails (both failures), one whose owner refuses, one whose route the reader cannot open and one for
// authors only.
const specProviders = [
    {key: "Answers", service: G + "get#Home", field: "revision", route: "Insights/Reports", routeParameters: "pinnedOnly=true"},
    {key: "NoCount", service: G + "get#Home", field: "noSuchCount", route: "Insights/Reports"},
    {
        key: "Fails",
        service: G + "store#HomeLayout",
        parameters: {orderedPanelIds: ["a", "b", "c", "d", "e", "f", "g"]},
        field: "revision",
        route: "Insights/Reports"
    },
    {
        key: "Refuses",
        service: G + "get#Metric",
        parameters: {metricId: "InsightsSpec.None"},
        field: "metric",
        route: "Insights/Reports"
    },
    {
        key: "Unreadable",
        service: G + "store#HomeLayout",
        parameters: {orderedPanelIds: ["a", "b", "c", "d", "e", "f", "g"]},
        field: "revision",
        route: "Accounting/GeneralLedger/JournalEntries"
    },
    {key: "AuthorsOnly", service: G + "get#Home", field: "revision", route: "Insights/Reports", permission: "INSIGHTS_AUTHOR"}
]
function removeSpecData() {
    system(() => {
        ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", specOwner).deleteAll()
        ec.entity
            .find("moqui.security.UserPreference")
            .condition("userId", "in", userIds)
            .condition("preferenceKey", "in", preferenceKeys)
            .deleteAll()
    })
}
// Whether a route names a screen: its file, or a subscreens-item of its parent screen (a Shared screen mounted there).
function screenExists(route) {
    const base = route.startsWith("system/Monitor/") ? "component://tools/screen/System/Monitor/" : "component://mr-boss/screen/"
    const path = route.startsWith("system/Monitor/") ? route.substring(15) : route
    if (ec.resource.getLocationReference(base + path + ".xml").getExists()) return true
    const parts = path.split("/")
    const parent = ec.resource.getLocationReference(base + parts.slice(0, -1).join("/") + ".xml")
    return parent.getExists() && String(parent.getText()).includes('subscreens-item name="' + parts[parts.length - 1] + '"')
}
const cardKeys = answer =>
    Array.from(answer.groups || []).flatMap(group => group.cards.map(card => card.providerKey.replace(specOwner + ".", "")))

spec({
    stepwise: true,
    setupSpec() {
        removeSpecData()
        login(users.system)
        system(() =>
            specProviders.forEach((provider, index) =>
                ec.service
                    .sync()
                    .name("create#ironstone.insights.AttentionProvider")
                    .parameters({
                        providerKey: specOwner + "." + provider.key,
                        ownerApp: specOwner,
                        title: "Spec " + provider.key,
                        countService: provider.service,
                        countParameters: provider.parameters ? JSON.stringify(provider.parameters) : null,
                        countField: provider.field,
                        routePath: provider.route,
                        routeParameters: provider.routeParameters || null,
                        organizationParameter: "organizationPartyId",
                        requiredPermission: provider.permission || null,
                        sequenceNum: 9000 + index
                    })
                    .call()
            )
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
        ec.artifactExecution.enableAuthz()
    }
})

feature("Home's one render: the reader's scope, the first-use state, the suite panels and no app they cannot read", {
    when() {
        return {home: asUser(users.reader, () => page("Home"))}
    },
    then({home}) {
        home.status == 200
        home.errors == []
        home.output.includes("Scope: Ziziwork Retail")
        !home.output.includes("Ziziwork Services")
        home.output.includes("Getting started")
        home.output.includes("Suite overview")
        home.output.includes("Needs attention")
        home.output.includes("Counts are not added together")
        // the spec's providers: the failed count named on its own card beside the one that answers; the refusing and the
        // unreadable ones not shown; the reader works in no app, so no owner's count shows
        home.output.includes("Spec Answers")
        home.output.includes("Spec Fails: InsightsSpec did not answer this count just now")
        !home.output.includes("Spec Refuses")
        !home.output.includes("Spec Unreadable")
        home.output.includes("Orders by currency")
        !home.output.includes("Draft entries")
        !home.output.includes("Receiving")
        !home.output.includes("Operations rolled back")
        home.output.includes("Pin reports in Reports to keep them here.")
        !home.output.includes("Dashboards and reports are shown to Insights readers.")
        !home.output.includes("Placeholder")
    }
})

feature("a failing provider affects its own card; an unreadable or refusing one is left out; nothing is totalled", {
    when() {
        const reader = asUser(users.reader, () =>
            invoke(G + "get#Attention", {ownerApp: specOwner, organizationPartyId: ids.organizationId})
        )
        const author = asUser(users.author, () => invoke(G + "get#Attention", {ownerApp: specOwner}))
        const other = asUser(users.reader, () =>
            refusal(G + "get#Attention", {ownerApp: specOwner, organizationPartyId: ids.otherOrganizationId})
        )
        const cards = Object.fromEntries(Array.from(reader.groups?.[0]?.cards || []).map(card => [card.providerKey, card]))
        return {reader, author, other, cards}
    },
    then({reader, author, other, cards}) {
        cardKeys(reader) == ["Answers", "NoCount", "Fails"]
        cardKeys(author) == ["Answers", "NoCount", "Fails", "AuthorsOnly"]
        reader.groups.length == 1
        Object.keys(reader).includes("total") == false
        cards["InsightsSpec.Answers"].state == "available"
        typeof cards["InsightsSpec.Answers"].count == "number"
        cards["InsightsSpec.Answers"].url == "/qapps/Insights/Reports?pinnedOnly=true&organizationPartyId=ORG_ZIZI_RETAIL"
        cards["InsightsSpec.NoCount"].state == "failed"
        cards["InsightsSpec.Fails"].state == "failed"
        cards["InsightsSpec.Fails"].countText == "Unavailable"
        cards["InsightsSpec.Fails"].url == null
        cards["InsightsSpec.Fails"].message.includes("InsightsSpec did not answer")
        other.includes("ORGANIZATION_UNAVAILABLE")
    }
})

feature("the registered providers name existing services and owner screens, and an owner's user sees its cards", {
    when() {
        const rows = system(() =>
            Array.from(
                ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", "not-equals", specOwner).list()
            )
        )
        const problems = []
        for (const row of rows) {
            if (!ec.service.getServiceDefinition(row.countService)) problems.push(row.providerKey + " names " + row.countService)
            if (!screenExists(row.routePath)) problems.push(row.providerKey + " opens " + row.routePath)
        }
        // the Warehouse user's selected facility, as Warehouse Home's facility picker saves it
        const warehouse = asUser(users.warehouse, () => {
            ec.user.setPreference("FacilityActive", "BOSS_WH_EAST")
            return invoke(G + "get#Attention", {})
        })
        const cards = Array.from(warehouse.groups || [])
            .filter(group => group.ownerApp !== specOwner)
            .flatMap(group => group.cards)
        // Monitor's source runs the Business operations dashboard's own query: an administrator's count; a reader, who holds no
        // telemetry dataset, is refused by the report engine (and never shown it: Monitor's route does not open to them)
        const operations = asUser(users.system, () => invoke(G + "get#OperationFailures", {}))
        const readerOperations = asUser(users.reader, () => refusal(G + "get#OperationFailures", {}))
        return {
            operations,
            readerOperations,
            keys: rows.map(row => row.providerKey).sort(),
            problems,
            warehouseCards: cards.map(card => card.providerKey + " " + card.state + " " + card.message),
            receiving: cards.find(card => card.providerKey === "Warehouse.Receiving") || {}
        }
    },
    then({operations, readerOperations, keys, problems, warehouseCards, receiving}) {
        typeof operations.count == "number"
        readerOperations != ""
        keys == registeredKeys.slice().sort()
        problems == []
        warehouseCards == ["Warehouse.Receiving available "]
        receiving.url == "/qapps/Warehouse/Receiving/Receipts?facilityId=BOSS_WH_EAST"
        typeof receiving.count == "number"
        receiving.scopeText == "Your selected facility"
    }
})

feature("Home's arrangement is the InsightsHome preference, over a dashboard and panels the user reads", {
    when() {
        return asUser(users.reader, () => {
            const before = invoke(G + "get#Home", {})
            const stored = invoke(G + "store#HomeLayout", {
                dashboardDefinitionId: "insights-suite",
                orderedPanelIds: ["checkouts", "orders"],
                expectedRevision: before.revision
            })
            const after = invoke(G + "get#Home", {})
            return {
                before,
                after,
                stored,
                stale: refusal(G + "store#HomeLayout", {expectedRevision: before.revision}),
                notOnIt: refusal(G + "store#HomeLayout", {dashboardDefinitionId: "insights-suite", orderedPanelIds: ["nope"]}),
                unreadable: refusal(G + "store#HomeLayout", {dashboardDefinitionId: "insights-no-such-dashboard"}),
                tooMany: refusal(G + "store#HomeLayout", {orderedPanelIds: ["a", "b", "c", "d", "e", "f", "g"]}),
                otherOrganization: refusal(G + "store#HomeLayout", {organizationPartyId: ids.otherOrganizationId}),
                ownOrganization: refusal(G + "store#HomeLayout", {organizationPartyId: ids.organizationId})
            }
        })
    },
    then({before, after, stored, stale, notOnIt, unreadable, tooMany, otherOrganization, ownOrganization}) {
        before.firstUse == true
        before.dashboard.definitionId == "insights-suite"
        before.dashboard.available == true
        before.panels.map(panel => panel.panelId) == ["orders", "orderValue", "serviceBacklog", "checkouts"]
        // with no organization chosen, the panels keep to the reader's own organizations, by both fields the suite names
        JSON.stringify(before.scopeVariables.organizationPartyId).includes("ORG_ZIZI_RETAIL")
        !JSON.stringify(before.scopeVariables.organizationPartyId).includes("ORG_ZIZI_SERVICES")
        JSON.stringify(before.scopeVariables.vendorPartyId) == JSON.stringify(before.scopeVariables.organizationPartyId)
        stored.revision == before.revision + 1
        after.panels.map(panel => panel.panelId) == ["checkouts", "orders"]
        after.firstUse == false
        stale.includes("HOME_CHANGED")
        notOnIt.includes("PANEL_UNAVAILABLE")
        unreadable.includes("DASHBOARD_UNAVAILABLE")
        tooMany.includes("HOME_PANELS_LIMIT")
        otherOrganization.includes("ORGANIZATION_UNAVAILABLE")
        ownOrganization == ""
    }
})
