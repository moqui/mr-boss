// Insights dashboards (impl-insights P2; design-insights §4 Dashboard, DashboardEditor, ShareDashboard): the framework report
// screens mounted under Insights (INS-04). Dashboard's one qvt render: the organization in scope fixed over a forged variable,
// its links (appLinks) under Insights, a library panel over a dataset the author may not read said to be not available (Mantle's
// sales orders wait for the steward's admission, P3), Share for the owner and the panel's measure meaning (P4); a panel inspect
// keeps the scope. The mounted editor copies and
// saves under Insights, keeps the group over a posted one and takes only its own types. Sharing is the framework Dashboard's
// share transition through Insights' route, under Insights' policy: the owner, an author, shares with their own group and
// makes the dashboard private again; a distributor, who holds the engine's save and not the policy's share feature, is
// refused the same request on a dashboard of their own; a group that is neither the owner's nor the policy's, a reader, a
// shipped dashboard and a stale version are refused, by the transition and by the engine's save itself. The access
// rules of the editors and the engine are InsightsAccess's; the golden walk is the client InsightsDashboardsWalk; the "usable
// when" scenario is the acceptance InsightsDashboardsUsable.
// Run: ./moq test mr-boss --spec InsightsDashboards
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const reports = "org.moqui.report.ReportServices."
// the spec's definitions: a library panel over Mantle's sales orders (not readable by the Insights groups until P3), shared with
// the Insights users by ADMIN, and the author's own dashboard over it with an organization variable
const panelId = "INS_DASH_SPEC_PANEL"
const boardId = "INS_DASH_SPEC_BOARD"
const copyId = "INS_DASH_SPEC_COPY"
// a distributor's own dashboard (the engine's save is theirs, for digests; sharing is not)
const distributorBoardId = "INS_DASH_SPEC_DISTRIBUTOR"
const definitionIds = [panelId, boardId, copyId, copyId + "_S", copyId + "_A", distributorBoardId]
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
                    // P4: the panel names Sales' registered orders measure, which Dashboard's MeasureMeaning explains
                    business: {metricId: "Sales.Orders", metricVersion: 1},
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
            // a panel inspect keeps the scope over the variables it is sent (the transitions read it from always-actions)
            const inspect = render(users.author, "Dashboard/inspectPanel", {
                definitionId: boardId,
                panelId: "note",
                variables: JSON.stringify({organizationPartyId: ids.otherOrganizationId})
            })
            return {board, inspect}
        },
        then({board, inspect}) {
            board.status == 200
            board.errors == []
            // BusinessContext and ShareDashboard (the owner, an author)
            board.output.includes("Organization")
            board.output.includes("Ziziwork Retail")
            board.output.includes("Share")
            // the fixed organization, never the forged one
            board.output.includes(ids.organizationId)
            !board.output.includes(ids.otherOrganizationId)
            // the dashboard's links are Insights' screens, never the Tools Dashboards app or its alert rules
            board.output.includes("/Insights/DashboardEditor")
            board.output.includes("/Insights/ReportBuilder/Explore")
            !board.output.includes("/dashboards/Definition")
            !board.output.includes("/dashboards/AlertRule")
            // the library panel over sales orders: refused until the steward admits the dataset (P3), shown as such
            board.output.includes("mantle-sales-orders is not admitted")
            board.output.includes("Spec board")
            // P4 MeasureMeaning: the library panel's registered measure, its basis and the base-order exclusion
            board.output.includes("What the measures mean")
            board.output.includes("Orders (Sales, version 1)")
            board.output.includes("Recurring base orders are templates")
            inspect.errors == []
            inspect.output.includes(ids.organizationId)
            !inspect.output.includes(ids.otherOrganizationId)
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
        // a crafted group (F-P2-4: sharing is ShareDashboard's) is not taken; a type outside the editor's is refused, saved or copied
        const regrouped = post(users.author, "DashboardEditor/save", {
            definitionId: copyId,
            definitionType: "dashboard",
            definitionTitle: "Spec copy",
            definitionVersion: "2",
            definitionJson: body,
            definitionUserGroupId: "BOSS_ADMIN_ADMIN"
        })
        const search = post(users.author, "DashboardEditor/save", {
            definitionId: copyId + "_S",
            definitionType: "search",
            definitionTitle: "S",
            definitionJson: "{}"
        })
        const alert = post(users.author, "DashboardEditor/copy", {
            definitionId: "boss-commerce-checkout-failures",
            copyId: copyId + "_A"
        })
        const stored = system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", copyId).one())
        return {
            copied,
            saved,
            regrouped,
            search,
            alert,
            owner: stored?.ownerId,
            version: stored?.versionNumber,
            group: stored?.userGroupId
        }
    },
    then({copied, saved, regrouped, search, alert, owner, version, group}) {
        copied.errors == ""
        copied.location.includes("/Insights/DashboardEditor?definitionId=" + copyId)
        saved.errors == ""
        saved.location.includes("/Insights/DashboardEditor?definitionId=" + copyId)
        owner == "BOSS_INS_AUTHOR"
        regrouped.errors == ""
        version == 3
        group == null
        search.errors.includes("This editor saves only dashboard, report definitions")
        alert.errors.includes("This editor copies only dashboard, report definitions")
    }
})

feature("the owner, an author, shares a dashboard with their group and makes it private; a distributor, another group, a reader and a shipped one refused", {
    when() {
        const problems = []
        const group = id => system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", id).one())?.userGroupId || null
        const board = definitionId => asUser(users.author, () => invoke(reports + "get#Definition", {definitionId}).definition)
        // the author's own dashboard and one of their own groups, through Insights' route
        const shared = post(users.author, "Dashboard/share", {definitionId: boardId, userGroupId: "BOSS_INSIGHTS"})
        if (shared.errors !== "" || group(boardId) !== "BOSS_INSIGHTS") problems.push(`shared: ${shared.errors} ${group(boardId)}`)
        if (!shared.location.includes("/Insights/Dashboard?definitionId=" + boardId)) problems.push(`shared goes to ${shared.location}`)
        const readerSees = asUser(users.reader, () => refusal(reports + "get#Definition", {definitionId: boardId}))
        if (readerSees !== "") problems.push(`the reader does not read the shared dashboard: ${readerSees}`)
        // the same request by a distributor on a dashboard of their own: the engine's save is theirs, the share feature is not
        asUser(users.distributor, () =>
            invoke(reports + "save#Definition", {
                definition: {id: distributorBoardId, type: "dashboard", title: "Spec distributor board", body: {panels: {}}},
                note: "spec"
            })
        )
        const distributor = post(users.distributor, "Dashboard/share", {definitionId: distributorBoardId, userGroupId: "BOSS_INSIGHTS"})
        if (!distributor.errors.includes("Sharing is not offered to you here") || group(distributorBoardId) !== null)
            problems.push(`the distributor shares: ${distributor.errors || "accepted"} ${group(distributorBoardId)}`)
        // a group that is neither the owner's nor the policy's: refused by the transition, and by the engine's save itself
        const other = post(users.author, "Dashboard/share", {definitionId: boardId, userGroupId: "BOSS_ADMIN_ADMIN"})
        if (!other.errors.includes("Share only with a group you belong to")) problems.push(`another group: ${other.errors || "accepted"}`)
        const current = board(boardId)
        const direct = asUser(users.author, () =>
            refusal(reports + "save#Definition", {
                definition: {id: boardId, type: "dashboard", title: current.title, body: current.body, userGroupId: "BOSS_ADMIN_ADMIN"}
            })
        )
        if (!direct.includes("SHARE_GROUP_UNAVAILABLE")) problems.push(`another group by the engine's save: ${direct || "accepted"}`)
        if (group(boardId) !== "BOSS_INSIGHTS") problems.push(`the group after the refusals: ${group(boardId)}`)
        const reader = post(users.reader, "Dashboard/share", {definitionId: boardId, userGroupId: "BOSS_INSIGHTS"})
        if (!reader.errors.includes("Sharing is not offered to you here")) problems.push(`the reader shares: ${reader.errors || "accepted"}`)
        const shipped = post(users.author, "Dashboard/share", {definitionId: "boss-commerce-store-operations", userGroupId: "BOSS_INSIGHTS"})
        if (!shipped.errors.includes("Only the owner shares a dashboard")) problems.push(`a shipped dashboard: ${shipped.errors || "accepted"}`)
        const stale = post(users.author, "Dashboard/share", {definitionId: boardId, expectedVersion: "1"})
        if (!/changed since it was read/i.test(stale.errors)) problems.push(`a stale version: ${stale.errors || "accepted"}`)
        const privateAgain = post(users.author, "Dashboard/share", {definitionId: boardId})
        if (privateAgain.errors !== "" || group(boardId) !== null) problems.push(`made private: ${privateAgain.errors} ${group(boardId)}`)
        const hidden = asUser(users.reader, () => refusal(reports + "get#Definition", {definitionId: boardId}))
        if (hidden === "") problems.push("the reader still reads the private dashboard")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
