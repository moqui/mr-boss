// Insights access (impl-insights §2, P1; design-insights §1.1, §1.2): who may open Insights and the context they get (another
// organization refused), the menu, providers and launcher per group (Home's one render is InsightsHome's), each group's capabilities from its
// permissions and the copied screens' area, the report engine's artifacts by capability (a reader cannot save, an author cannot
// save a dataset, the steward can; scheduling the distributor's; the root's inheritable grant opening no mutating operation from
// an Insights screen; telemetry and Tools' Dashboards no Insights group's), and the
// copied screens refused to the ordinary groups. P3 replaces the copied builder: Datasets the author's and steward's, DatasetDetail
// the steward's, both refused to a reader and the administrator. One feature per rule, each case of it a line of
// its problems, with artifact authorization enabled. P2 adds the dashboard and panel editors (the author's, refused to a reader),
// every ReportServices operation denied to the root user group and the administrator unless granted (a reader still reads from an
// Insights screen) and its menu entries. The access and isolation walk is the acceptance InsightsFoundationWalk. A
// later phase adds a case only for an access rule it adds, and its providers to the menu feature.
// Run: ./moq test mr-boss --spec InsightsAccess
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell, screenRefusal} = lib
const context = "ironstone.insights.ContextServices.get#Context"
const reports = "org.moqui.report.ReportServices."
// a refusal of a user without Insights: the service is not authorized for them, or it refuses them
const refused = message => /INSIGHTS_UNAVAILABLE|is not authorized/.test(message)
const unauthorized = message => /^40[13] |is not authorized/.test(message)
// the spec's own definitions, removed after the run
const dashboardId = "INS_SPEC_DASHBOARD"
const datasetId = "INS_SPEC_DATASET"

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() => {
            for (const entityName of [
                "moqui.report.DefinitionReference",
                "moqui.report.DefinitionVersion",
                "moqui.report.Definition"
            ])
                ec.entity.find(entityName).condition("definitionId", "in", [dashboardId, datasetId]).deleteAll()
            // a schedule the reader is refused, should a refusal regress
            ec.entity.find("moqui.screen.ScreenScheduled").condition("userId", "BOSS_INS_READER").deleteAll()
        })
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an Insights user gets their organizations; another organization, another app's user, a client and a PASS account are refused",
    {
        when() {
            const problems = []
            const reader = asUser(users.reader, () => invoke(context, {}))
            if (
                !reader.organizationPartyIds.includes(ids.organizationId) ||
                reader.organizationPartyIds.includes(ids.otherOrganizationId)
            )
                problems.push(`the reader's organizations: ${reader.organizationPartyIds}`)
            if (
                reader.allOrganizations ||
                reader.sharedLinks?.Home !== "//Insights/Home" ||
                reader.defaults?.currencyMode !== "native"
            )
                problems.push(`the reader's context: ${JSON.stringify(reader)}`)
            // the framework report screens' policy under Insights (reportPolicy, beside reportLinks): Insights' range and fixed
            // parts for everyone, and an alert or a share offered by the user's own permissions
            const policy = reader.reportPolicy || {}
            if (
                policy.range?.from !== "now-30d" ||
                policy.features?.alert !== false ||
                policy.features?.share !== false ||
                policy.recipientPermissionId !== "INSIGHTS_VIEW" ||
                policy.datasetIdPrefix !== "insights-" ||
                policy.alertAudience?.topic !== "InsightsBusinessAlert" ||
                reader.reportLinks?.alerts !== "//Insights/Alerts/Rules"
            )
                problems.push(`the reader's report policy: ${JSON.stringify(policy)}`)
            const authorFeatures = asUser(users.author, () => invoke(context, {})).reportPolicy?.features
            if (authorFeatures?.alert !== true || authorFeatures?.share !== true)
                problems.push(`the author's report features: ${JSON.stringify(authorFeatures)}`)
            // the Services reader: their own organization by request, Retail refused like a forged id
            const own = asUser(users.services, () => refusal(context, {organizationPartyId: ids.otherOrganizationId}))
            if (own !== "") problems.push(`the Services reader is refused Services: ${own}`)
            for (const organizationPartyId of [ids.organizationId, "INS_SPEC_FORGED"]) {
                const message = asUser(users.services, () => refusal(context, {organizationPartyId}))
                if (!message.includes("ORGANIZATION_UNAVAILABLE"))
                    problems.push(`the Services reader gets ${organizationPartyId}: ${message || "accepted"}`)
            }
            const services = asUser(users.services, () => invoke(context, {}))
            if (
                services.organizationPartyId !== ids.otherOrganizationId ||
                services.organizationPartyIds.includes(ids.organizationId)
            )
                problems.push(`the Services reader's scope: ${services.organizationPartyId} ${services.organizationPartyIds}`)
            if (asUser(users.admin, () => invoke(context, {})).allOrganizations !== true)
                problems.push("the administrator is not in every organization")
            const otherRoot = asUser(users.reader, () => refusal(context, {appRoot: "Warehouse"}))
            if (!otherRoot.includes("INSIGHTS_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
            for (const user of [users.otherApp, users.client, users.pass]) {
                const message = asUser(user, () => refusal(context, {}))
                if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
            }
            for (const user of [users.client, users.pass]) {
                const home = screenRefusal(user, "Home")
                if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// the menu of design §1.2 built so far, every Insights user's: Home, the dashboards, Report builder, Reports, Scheduled
// reports and Management digest (no copied screen is left, impl-insights F20)
feature("the Insights menu and keys follow the groups; the launcher shows Insights to its users only", {
    when() {
        const problems = []
        const reader = shell(users.reader)
        if (reader.status != 200 || JSON.stringify(reader.names) !== JSON.stringify(ids.readerMenu))
            problems.push(`the reader's menu: ${reader.status} ${reader.names}`)
        const keymap = (reader.providers?.keymaps || []).find(keymap => keymap.scope === "insights")
        const keys = (keymap?.keys || []).map(key => key.keys)
        if (JSON.stringify(keys) !== JSON.stringify(["g s", "g m"])) problems.push(`the reader's insights keys: ${keys}`)
        if ((reader.providers?.quickCreate || []).length) problems.push("the reader is offered quick create")
        if (!reader.apps.includes("Insights")) problems.push(`the reader's launcher has no Insights: ${reader.apps}`)
        const business = ["Products", "Accounting", "Commerce", "Warehouse", "Projects", "Purchasing", "CustomerService", "Admin"]
        const otherApps = reader.apps.filter(app => business.includes(app))
        if (otherApps.length) problems.push(`the reader's launcher has ${otherApps}`)
        for (const user of [users.admin, users.system]) {
            const names = shell(user, true).names
            if (JSON.stringify(names) !== JSON.stringify(ids.readerMenu)) problems.push(`${user}'s menu: ${names}`)
        }
        if (shell(users.otherApp).apps.includes("Insights")) problems.push(`${users.otherApp} has Insights`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

const capabilityNames = [
    "view",
    "author",
    "datasetView",
    "datasetEdit",
    "schedule",
    "distribute",
    "flowEdit",
    "settingsView",
    "settingsEdit",
    "datasets",
    "stewardship",
    // P6: Analysis, the author's and the steward's area
    "analysis"
]
// design §1.1's table; P3's dataset screens the author's and the steward's (datasets), DatasetDetail the steward's
// (stewardship); P7: every reading group schedules for itself (schedule), the distributor alone delivers to others, and the
// administrator, who reads no business data, schedules nothing
const capabilityUsers = [
    {user: users.reader, granted: ["view", "schedule"]},
    {user: users.author, granted: ["view", "author", "schedule", "datasets", "analysis"]},
    {user: users.steward, granted: ["view", "datasetView", "datasetEdit", "schedule", "datasets", "stewardship", "analysis"]},
    {user: users.distributor, granted: ["view", "schedule", "distribute"]},
    {user: users.flow, granted: ["view", "schedule", "flowEdit"]},
    {user: users.admin, granted: ["view", "settingsView", "settingsEdit"]},
    {user: users.services, granted: ["view", "schedule"]},
    {user: users.finance, granted: ["view", "schedule"]},
    {user: users.serviceManager, granted: ["view", "schedule"]},
    {user: users.warehouse, granted: ["view", "schedule"]},
    {user: users.system, granted: capabilityNames}
]
feature("each group holds exactly the capabilities of its permissions", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(context, {})).capabilities || {}
            const held = capabilityNames.filter(name => capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (capabilities.read !== true) problems.push(`${user} does not read`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the engine's artifacts follow the capability: save, dataset save and schedules by group; telemetry and Tools stay ADMIN's",
    {
        when() {
            const problems = []
            const expect = (label, message, refusalText) => {
                if (refusalText ? !message.includes(refusalText) : message !== "")
                    problems.push(`${label}: ${message || "accepted"}`)
            }
            const dashboard = {definition: {id: dashboardId, type: "dashboard", title: "Insights spec", body: {panels: []}}}
            const dataset = {definition: {id: datasetId, type: "dataset", title: "Insights spec", body: {}}}
            // every group reads definitions; a reader and the administrator do not save one, an author does
            for (const user of [users.reader, users.admin])
                expect(
                    `${user} lists definitions`,
                    asUser(user, () => refusal(reports + "list#Definitions", {}))
                )
            for (const user of [users.reader, users.admin])
                expect(
                    `${user} saves a dashboard`,
                    asUser(user, () => refusal(reports + "save#Definition", dashboard)),
                    "is not authorized"
                )
            expect(
                "the author saves a dashboard",
                asUser(users.author, () => refusal(reports + "save#Definition", dashboard))
            )
            // a dataset definition: the steward's, not the author's
            expect(
                "the author saves a dataset",
                asUser(users.author, () => refusal(reports + "save#Definition", dataset)),
                "org.moqui.report.dataset"
            )
            expect(
                "the steward saves a dataset",
                asUser(users.steward, () => refusal(reports + "save#Definition", dataset))
            )
            // schedules (P7): every reading group's own, not the administrator's; the audience check of a group delivery is
            // the distributor's, not the reader's
            for (const user of [users.distributor, users.reader])
                expect(
                    `${user} lists schedules`,
                    asUser(user, () => refusal(reports + "list#Schedules", {}))
                )
            expect(
                "the administrator lists schedules",
                asUser(users.admin, () => refusal(reports + "list#Schedules", {})),
                "is not authorized"
            )
            const audience = {definitionId: "insights-weekly-digest"}
            expect(
                "the distributor checks an audience",
                asUser(users.distributor, () => refusal(reports + "check#ReportAudience", audience))
            )
            expect(
                "the reader checks an audience",
                asUser(users.reader, () => refusal(reports + "check#ReportAudience", audience)),
                "is not authorized"
            )
            // alerts (P8): an alert's state is read through the engine by every reading group (it answers by owner and
            // scope); another user's rules are the lifecycle operator's to list, not the distributor's
            expect(
                "the reader reads an alert's state",
                asUser(users.reader, () => refusal(reports + "get#AlertState", {definitionId: "boss-service-sla-breach"}))
            )
            expect(
                "the distributor lists another user's alert rules",
                asUser(users.distributor, () => refusal(reports + "find#OwnedAlertRules", {userId: "BOSS_INS_READER"})),
                "is not authorized"
            )
            // flow maps (P9): the flow editor's maps are saved by FlowMapServices (InsightsFlowMaps); the group holds no
            // authoring operation of the engine, so no playlist, search or dashboard is theirs to save (the P9 review)
            expect(
                "the flow editor saves a playlist through the engine",
                asUser(users.flow, () =>
                    refusal(reports + "save#Definition", {
                        definition: {
                            id: dashboardId + "-flow",
                            type: "report",
                            title: "Flow editor's playlist",
                            body: {kind: "playlist", seconds: 30, playlist: [{definitionId: "insights-suite"}]}
                        }
                    })
                ),
                "is not authorized"
            )
            // a telemetry dataset and git sync: no Insights group, the steward neither
            expect(
                "the steward reads otel_spans",
                asUser(users.steward, () => refusal(reports + "get#Dataset", {datasetId: "otel_spans"})),
                "org.moqui.report.dataset.otel_spans"
            )
            expect(
                "ADMIN reads otel_spans",
                asUser(users.system, () => refusal(reports + "get#Dataset", {datasetId: "otel_spans"}))
            )
            expect(
                "the administrator lists git syncs",
                asUser(users.admin, () => refusal(reports + "list#DefinitionGitSyncs", {})),
                "is not authorized"
            )
            // under the Insights root, whose inheritable ALLOW reaches every service a screen calls (F-P1-1): the denies hold
            // for the reader and the administrator on each kind of mutating operation, and the author still saves
            const under = (location, user, service, parameters) =>
                asUser(user, () =>
                    ec.artifactExecution.runAsUser("component://mr-boss/screen/" + location, () => refusal(service, parameters))
                )
            const underRoot = (user, service, parameters) => under("Insights.xml", user, service, parameters)
            const mutating = {
                "save#Definition": dashboard,
                "create#Schedule": {definitionId: dashboardId, cronExpression: "0 0 6 * * ?"},
                "import#Definitions": {bundle: {definitions: []}},
                "pull#DefinitionGitSyncs": {repositoryId: "INS_SPEC", isDefaultBranch: false}
            }
            for (const [operation, parameters] of Object.entries(mutating))
                expect(
                    `the reader calls ${operation} from an Insights screen`,
                    underRoot(users.reader, reports + operation, parameters),
                    "is not authorized"
                )
            expect(
                "the administrator saves a dashboard from an Insights screen",
                underRoot(users.admin, reports + "save#Definition", dashboard),
                "is not authorized"
            )
            // P2: every operation is denied to the root user group unless granted, and the reading grants pass that deny
            expect(
                "the reader reads a definition from an Insights screen",
                underRoot(users.reader, reports + "get#Definition", {definitionId: "boss-commerce-store-operations"})
            )
            expect(
                "the author saves a dashboard from an Insights screen",
                underRoot(users.author, reports + "save#Definition", dashboard)
            )
            // Tools' Dashboards app: refused to the Insights administrator and the author
            for (const user of [users.admin, users.author]) {
                const rendered = asUser(user, () =>
                    ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot.xml")
                        .render("apps/dashboards/Home", {}, null)
                )
                if (rendered.status == 200) problems.push(`${user} opens Tools' Dashboards`)
            }
            const saved = system(() =>
                Array.from(
                    ec.entity.find("moqui.report.Definition").condition("definitionId", "in", [dashboardId, datasetId]).list()
                ).map(row => row.definitionId + " " + row.ownerId)
            )
            if (saved.sort().join(",") !== `${dashboardId} BOSS_INS_AUTHOR,${datasetId} BOSS_INS_STEWARD`)
                problems.push(`definitions stored: ${saved}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the dataset screens and the editors are refused to the ordinary groups; each opens to its group", {
    when() {
        const problems = []
        for (const path of ["ReportBuilder/Datasets"]) {
            const message = screenRefusal(users.reader, path)
            if (!unauthorized(message) || !message.includes("AT_XML_SCREEN"))
                problems.push(`the reader opens ${path}: ${message || "opened"}`)
        }
        // F74: the administrator reads no dataset, so Explore says so instead of Tools' log dataset and its refusal. Explore
        // is the framework's screen, mounted by location (mr-moqui plans/Admin-Screens-Down.md, I0): the sentence is its own,
        // and nothing of the search is shown or asked
        const explore = asUser(users.admin, () => lib.page("ReportBuilder/Explore", {}, "html"))
        if (
            explore.status !== 200 ||
            explore.errors.length ||
            !explore.output.includes("No dataset is available to you yet") ||
            !explore.output.includes("once its steward admits it") ||
            explore.output.includes("SearchOptions") ||
            explore.output.includes("otel_logs")
        )
            problems.push(`the administrator's Explore: ${explore.status} ${explore.errors.join(" | ")}`)
        // P3: the dataset list the author's, DatasetDetail the steward's, the administrator refused both (F20's raw entity
        // transitions are gone with the copied builder)
        const authorList = screenRefusal(users.author, "ReportBuilder/Datasets")
        if (authorList !== "") problems.push(`the author is refused Datasets: ${authorList}`)
        for (const user of [users.author, users.admin]) {
            const detail = screenRefusal(user, "ReportBuilder/DatasetDetail", {datasetId: "boss-service-clocks"})
            if (!unauthorized(detail)) problems.push(`${user} opens DatasetDetail: ${detail || "opened"}`)
        }
        const stewarded = screenRefusal(users.steward, "ReportBuilder/DatasetDetail", {datasetId: "boss-service-clocks"})
        if (stewarded !== "") problems.push(`the steward is refused DatasetDetail: ${stewarded}`)
        // P2: the dashboard editor is the author's (BOSS_INS_AUTHORING), refused to a reader and the administrator
        for (const user of [users.reader, users.admin]) {
            const editor = screenRefusal(user, "DashboardEditor", {definitionId: "boss-commerce-store-operations"})
            if (!unauthorized(editor)) problems.push(`${user} opens DashboardEditor: ${editor || "opened"}`)
        }
        const authored = screenRefusal(users.author, "DashboardEditor", {definitionId: "boss-commerce-store-operations"})
        if (authored !== "") problems.push(`the author is refused DashboardEditor: ${authored}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
