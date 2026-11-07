// Insights dashboards (impl-insights P2; design-insights §4 Dashboard, DashboardEditor, ShareDashboard): the framework report
// screens mounted under Insights (INS-04). Dashboard's one qvt render: the organization in scope fixed over a forged variable,
// its links (appLinks) under Insights, a library panel over a dataset the author may not read said to be not available (the
// datasets wait for P3's admission), and Share for the owner. The mounted editor copies and saves under Insights. Sharing: the
// owner shares with their own group and makes the dashboard private again; another group, a reader and a shipped dashboard are
// refused. The access rules of the editors and the engine are InsightsAccess's; the golden walk is the client
// InsightsDashboardsWalk; the "usable when" scenario is the acceptance InsightsDashboardsUsable.
// Run: ./moq test mr-boss --spec InsightsDashboards
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const reports = "org.moqui.report.ReportServices."
const share = "ironstone.insights.DashboardServices.share#Dashboard"
// the spec's definitions: a library panel over Mantle's sales orders (not readable by the Insights groups until P3), shared with
// the Insights users by ADMIN, and the author's own dashboard over it with an organization variable
const panelId = "INS_DASH_SPEC_PANEL"
const boardId = "INS_DASH_SPEC_BOARD"
const copyId = "INS_DASH_SPEC_COPY"
const definitionIds = [panelId, boardId, copyId]
const insightsScreens = "component://mr-boss/screen/Insights.xml"

// Insights under the webroot, as the shell requests it, so its report links resolve to /apps/Insights/... as in the browser.
const webroot = "component://webroot/screen/webroot.xml"
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
// A transition posted as the user: its errors and where it sends the browser.
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Insights/" + path, parameters, "post")
        return {
            status: result.status,
            errors: Array.from(result.errorMessages || []).join(" | "),
            location: String(result.header("Location") || "")
        }
    })
}
function removeDefinitions() {
    system(() => {
        for (const entityName of [
            "moqui.report.DefinitionReference",
            "moqui.report.DefinitionVersion",
            "moqui.report.Definition"
        ])
            ec.entity.find(entityName).condition("definitionId", "in", definitionIds).deleteAll()
    })
}

spec({
    setupSpec() {
        removeDefinitions()
        login(users.system)
        invoke(reports + "save#Definition", {
            definition: {
                id: panelId,
                type: "panel",
                title: "Orders per day",
                userGroupId: "BOSS_INSIGHTS",
                body: {
                    title: "Orders per day",
                    visualization: "timeSeries",
                    queries: [
                        {
                            datasetId: "mantle-sales-orders",
                            aggregations: [
                                {
                                    id: "day",
                                    type: "date_histogram",
                                    role: "x-axis",
                                    params: {field: "placedDate", calendar_interval: "1d"}
                                },
                                {id: "orders", type: "cardinality", role: "metric", params: {field: "orderId"}}
                            ]
                        }
                    ]
                }
            }
        })
        asUser(users.author, () =>
            invoke(reports + "save#Definition", {
                definition: {
                    id: boardId,
                    type: "dashboard",
                    title: "Insights spec board",
                    body: {
                        variables: [{name: "organizationPartyId", label: "Organization", kind: "textbox"}],
                        panels: {note: {title: "Note", visualization: "text", text: "Spec board"}, orders: {panelRef: panelId}},
                        layout: {type: "autoGrid", items: [{panelId: "note"}, {panelId: "orders"}]}
                    }
                }
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeDefinitions()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "Dashboard in Insights fixes the organization in scope, links Insights' screens and says an unreadable panel is not available",
    {
        when() {
            // a forged organization variable: the scope (the author's Retail) replaces it
            const board = render(users.author, "Dashboard", {
                definitionId: boardId,
                "var-organizationPartyId": ids.otherOrganizationId
            })
            return {board}
        },
        then({board}) {
            board.status == 200
            board.errors == []
            // BusinessContext and ShareDashboard (the owner, an author)
            board.output.includes("Organization")
            board.output.includes("Ziziwork Retail")
            board.output.includes("Share")
            // the fixed organization, never the forged one
            board.output.includes(ids.organizationId)
            !board.output.includes(ids.otherOrganizationId)
            // the dashboard's links are Insights' screens, never the Tools Dashboards app; no alert rules in Insights
            board.output.includes("/Insights/DashboardEditor")
            board.output.includes("/Insights/ReportBuilder/Explore")
            !board.output.includes("/dashboards/Definition")
            !board.output.includes("/dashboards/AlertRule")
            // the library panel over sales orders: refused by the dataset's own grant, shown as such
            board.output.includes("org.moqui.report.dataset.mantle-sales-orders")
            board.output.includes("Spec board")
        }
    }
)

feature("the mounted editor saves a copy and a version and returns under Insights", {
    when() {
        const copied = post(users.author, "DashboardEditor/copy", {definitionId: boardId, copyId, copyTitle: "Spec copy"})
        const body = JSON.stringify({
            panels: {note: {title: "Note", visualization: "text", text: "Copied"}, orders: {panelRef: panelId}}
        })
        const saved = post(users.author, "DashboardEditor/save", {
            definitionId: copyId,
            definitionType: "dashboard",
            definitionTitle: "Spec copy",
            definitionVersion: "1",
            definitionJson: body,
            note: "spec"
        })
        const stored = system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", copyId).one())
        return {copied, saved, owner: stored?.ownerId, version: stored?.versionNumber}
    },
    then({copied, saved, owner, version}) {
        copied.errors == ""
        copied.location.includes("/Insights/DashboardEditor?definitionId=" + copyId)
        saved.errors == ""
        saved.location.includes("/Insights/DashboardEditor?definitionId=" + copyId)
        owner == "BOSS_INS_AUTHOR"
        version == 2
    }
})

feature("the owner shares a dashboard with their group and makes it private; another group, a reader and a shipped one refused", {
    when() {
        const problems = []
        const shared = asUser(users.author, () => invoke(share, {definitionId: boardId, userGroupId: "BOSS_INSIGHTS"}))
        if (shared.userGroupId !== "BOSS_INSIGHTS") problems.push(`shared: ${JSON.stringify(shared)}`)
        const readerSees = asUser(users.reader, () => refusal(reports + "get#Definition", {definitionId: boardId}))
        if (readerSees !== "") problems.push(`the reader does not read the shared dashboard: ${readerSees}`)
        const other = asUser(users.author, () => refusal(share, {definitionId: boardId, userGroupId: "BOSS_ADMIN_ADMIN"}))
        if (!other.includes("SHARE_GROUP_UNAVAILABLE")) problems.push(`another group: ${other || "accepted"}`)
        const reader = asUser(users.reader, () => refusal(share, {definitionId: boardId, userGroupId: "BOSS_INSIGHTS"}))
        if (!reader.includes("INSIGHTS_AUTHOR_REQUIRED")) problems.push(`the reader shares: ${reader || "accepted"}`)
        const shipped = asUser(users.author, () =>
            refusal(share, {definitionId: "boss-commerce-store-operations", userGroupId: "BOSS_INSIGHTS"})
        )
        if (!shipped.includes("DASHBOARD_NOT_OWNED")) problems.push(`a shipped dashboard: ${shipped || "accepted"}`)
        const stale = asUser(users.author, () => refusal(share, {definitionId: boardId, expectedVersion: 1}))
        if (!/changed since it was read/.test(stale)) problems.push(`a stale version: ${stale || "accepted"}`)
        const privateAgain = asUser(users.author, () => invoke(share, {definitionId: boardId}))
        if (privateAgain.userGroupId != null) problems.push(`made private: ${JSON.stringify(privateAgain)}`)
        const hidden = asUser(users.reader, () => refusal(reports + "get#Definition", {definitionId: boardId}))
        if (hidden === "") problems.push("the reader still reads the private dashboard")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
