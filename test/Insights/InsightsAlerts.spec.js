// Insights' business alerts (impl-insights P8; design-insights §8, Alerts, AlertDetail; INS-07): an author sets an alert over a
// panel's saved query for themselves and not for others; a reader sets none; a distributor's audience is
// checked by the report engine, so the Retail agents pass and the Services reader is refused with the reason, as an answer a
// screen shows; a rule starts inactive and Activate validates it; one evaluation tells each recipient separately on Insights'
// private topic, linking to AlertDetail, with the value; each recipient reads their own state and delivery, and a reader of the
// rule outside its audience reads no state; AlertDetail renders once (qvt) with each recipient's result; a shipped template is
// copied only over a dataset the caller reads, and a copy waits to be activated; and Admin's lifecycle finds the distributor's
// rule through Insights' participant. The engine's rules are the framework's BusinessAlerts; the admitted sales dataset and its
// orders are InsightsDatasets'. The "usable when" scenario is the acceptance InsightsAlertsUsable.
// Run: ./moq test mr-boss --spec InsightsAlerts
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const A = "ironstone.insights.AlertServices."
const boardId = "ins-alr-orders"
const webroot = "component://webroot/screen/webroot.xml"
const notes = ec.factory.getTool("NotificationCapture")
const people = {
    reader: "BOSS_INS_READER",
    author: "BOSS_INS_AUTHOR",
    services: "BOSS_INS_SERVICES",
    distributor: "BOSS_INS_DISTRIBUTOR"
}
const one = (entityName, fields) => system(() => ec.entity.find(entityName).condition(fields).useCache(false).one())
const fromPanel = extra =>
    Object.assign(
        {
            dashboardId: boardId,
            panelId: "orders",
            title: "Orders watch",
            valueField: "orders",
            conditionType: "above",
            threshold: "0",
            window: "now-30d",
            intervalSeconds: "300"
        },
        extra
    )
// the audience form's post: the people and groups, and the group the rule is shared with so they can open it
const audience = (definitionId, extra) =>
    Object.assign({definitionId, audienceGiven: "Y", audienceKind: "group", userGroupId: "BOSS_INSIGHTS"}, extra)
let ruleId
let authorRuleId

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasets"],
    setupSpec() {
        login(users.system)
        notes.enable()
    },
    cleanupSpec() {
        notes.disable()
        notes.clear()
        ec.user.setEffectiveTime(null)
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "an author sets an alert over a panel for themselves; a distributor's audience is checked, and the Services reader is refused",
    {
        when() {
            // a dashboard over the admitted sales dataset with a measured panel, shared with every Insights user
            invoke(R + "save#Definition", {
                definition: {
                    id: boardId,
                    type: "dashboard",
                    title: "Orders to watch",
                    userGroupId: "BOSS_INSIGHTS",
                    body: {
                        panels: {
                            orders: {
                                title: "Orders",
                                visualization: "table",
                                queries: [
                                    {
                                        datasetId: "mantle-sales-orders",
                                        aggregations: [
                                            {id: "currency", type: "terms", role: "split-rows", params: {field: "currencyUomId"}},
                                            {id: "orders", type: "cardinality", role: "metric", params: {field: "orderId"}}
                                        ]
                                    }
                                ]
                            }
                        },
                        layout: {type: "autoGrid", items: [{panelId: "orders"}]}
                    }
                }
            })
            const readerStore = asUser(users.reader, () => refusal(A + "store#Alert", fromPanel({})))
            const draft = asUser(users.author, () => invoke(A + "get#Alert", {dashboardId: boardId, panelId: "orders"}))
            const own = asUser(users.author, () => invoke(A + "store#Alert", fromPanel({})))
            authorRuleId = own.definitionId
            // the same rule for another person: the author's permission stops it before the engine is asked
            const authorOthers = asUser(users.author, () =>
                invoke(A + "store#Alert", audience(authorRuleId, {recipientUserIds: [people.reader]}))
            )
            const others = {audienceKind: "group", recipientUserIds: [people.reader, people.author], userGroupId: "BOSS_INSIGHTS"}
            const created = asUser(users.distributor, () => invoke(A + "store#Alert", fromPanel(others)))
            ruleId = created.definitionId
            const activated = asUser(users.distributor, () =>
                invoke(A + "pause#Alerts", {definitionIds: [ruleId], paused: false})
            )
            const narrower = asUser(users.distributor, () =>
                invoke(A + "store#Alert", audience(ruleId, {recipientUserIds: [people.reader, people.services]}))
            )
            const foreignGroup = asUser(users.distributor, () =>
                invoke(A + "store#Alert", audience(ruleId, {recipientGroupIds: ["BOSS_ADMIN"]}))
            )
            // another's rule is not the author's to change, and a private one is not a reader's to open
            const notOwned = asUser(users.author, () =>
                invoke(A + "store#Alert", fromPanel({definitionId: ruleId, basisGiven: "Y"}))
            )
            const privateRule = asUser(users.reader, () => refusal(A + "get#Alert", {definitionId: authorRuleId}))
            const stored = system(() => JSON.parse(String(one("moqui.report.Definition", {definitionId: ruleId}).bodyJson)))
            return {
                readerStore,
                draft,
                own,
                authorOthers,
                created,
                activated: Array.from(activated.results || [])[0] || {},
                narrower,
                foreignGroup,
                notOwned,
                privateRule,
                stored
            }
        },
        then({readerStore, draft, own, authorOthers, created, activated, narrower, foreignGroup, notOwned, privateRule, stored}) {
            readerStore.includes("INSIGHTS_ALERT_REQUIRED")
            draft.creating == true
            Array.from(draft.options.measures).map(option => option.value) == ["orders"]
            own.applied == true
            // a new rule tells nobody until it is activated
            own.paused == true
            own.deliveryMode == "personal"
            authorOthers.applied == false
            authorOthers.reasonCode == "INSIGHTS_DISTRIBUTE_REQUIRED"
            created.applied == true
            created.deliveryMode == "group"
            activated.applied == true
            // the rule's fixed parts are Insights': its topic, its link and the cap, and no contact point
            stored.audience.topic == "InsightsBusinessAlert"
            stored.audience.recipientCap == 50
            stored.detailLink == "/qapps/Insights/Alerts/AlertDetail"
            stored.contactPoints == undefined
            stored.paused == false
            // a refusal is an answer with its code and a reason to show, naming the recipient and why, never their grants
            narrower.applied == false
            narrower.reasonCode == "RECIPIENT_REFUSED"
            narrower.reason.includes("Insights Services reader (scope-differs)")
            !narrower.reason.includes("ORG_ZIZI")
            foreignGroup.reasonCode == "RECIPIENT_GROUP_UNAVAILABLE"
            notOwned.reasonCode == "ALERT_NOT_OWNED"
            privateRule.includes("ALERT_UNAVAILABLE")
        }
    }
)

feature("one evaluation tells each recipient separately with the value; each reads their own state; AlertDetail renders once", {
    when() {
        notes.clear()
        // the engine's minute job, as the system: every active rule, each as its owner
        const pass = invoke(R + "evaluate#Alerts", {})
        const messages = Array.from(notes.getMessages("InsightsBusinessAlert")).map(message => ({
            to: Array.from(message.userIds || []).join("+"),
            link: String(message.link),
            body: typeof message.message === "string" ? JSON.parse(message.message) : message.message
        }))
        const mine = asUser(users.distributor, () => invoke(A + "find#Alerts", {view: "mine"}))
        const readerView = asUser(users.reader, () => invoke(A + "get#Alert", {definitionId: ruleId}))
        const received = asUser(users.reader, () => invoke(A + "find#Alerts", {}))
        // the Services reader opens the shared rule and reads no state: not in its audience, and not what its owner reads
        const outsider = asUser(users.services, () => invoke(A + "get#Alert", {definitionId: ruleId}))
        const outsiderReceived = asUser(users.services, () => invoke(A + "find#Alerts", {view: "received"}))
        // the one qvt render: the header, the audience with each recipient's result, the state and the deliveries
        const page = asUser(users.distributor, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen(webroot)
                .renderMode("qvt")
                .withStaticData()
                .render("apps/Insights/Alerts/AlertDetail", {lastStandalone: "true", definitionId: ruleId}, null)
            const output = String(result.output || "")
            return {
                status: result.status,
                output,
                errors: Array.from(result.errorMessages || []).concat(
                    output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
                )
            }
        })
        return {pass, messages, mine, readerView, received, outsider, outsiderReceived, page}
    },
    then({pass, messages, mine, readerView, received, outsider, outsiderReceived, page}) {
        pass.failed == 0
        // one notification a recipient a series, each to one user: the two named, nobody else
        Array.from(new Set(messages.map(message => message.to)))
            .sort()
            .join() == [people.author, people.reader].sort().join()
        messages.every(message => message.link == "/qapps/Insights/Alerts/AlertDetail?definitionId=" + ruleId)
        messages.every(message => message.body.ruleId == ruleId && Number(String(message.body.events[0].value)) > 0)
        const row = Array.from(mine.alerts).find(alert => alert.definitionId == ruleId)
        row.stateText == "Firing"
        row.audienceText == "2 people"
        // the paused rule of the author's was not evaluated
        Array.from(mine.alerts).length == 1
        readerView.canEdit == false
        Array.from(readerView.states).length >= 1
        readerView.states[0].stateText == "Firing"
        readerView.states[0].valueText != "–"
        // a recipient's deliveries are their own
        Array.from(readerView.deliveries).length >= 1
        Array.from(readerView.audience).length == 0
        received.view == "received"
        Array.from(received.received).map(entry => entry.definitionId) == [ruleId]
        received.received[0].toldText == "Firing"
        Array.from(outsider.states).length == 0
        outsider.stateNote.includes("not in this alert's audience")
        Array.from(outsider.deliveries).length == 0
        Array.from(outsiderReceived.received).length == 0
        page.status == 200
        page.errors == []
        page.output.includes("Orders watch")
        page.output.includes("May be told")
        page.output.includes("Insights Reader")
        page.output.includes("Firing")
        page.output.includes("Change audience")
        !page.output.includes("Insights Services reader")
    }
})

feature(
    "a template is copied only over a dataset the caller reads, a copy waits to be activated, and Admin's lifecycle finds the rule",
    {
        when() {
            const templates = asUser(users.distributor, () => invoke(A + "find#Alerts", {view: "templates"}))
            // Mantle's sales items wait for the steward's admission; a reader who is a Customer Service manager sets no alert
            const unread = asUser(users.distributor, () => invoke(A + "copy#Alert", {definitionId: "mantle-sales-daily-floor"}))
            const manager = asUser(users.serviceManager, () =>
                refusal(A + "copy#Alert", {definitionId: "boss-service-sla-breach"})
            )
            // the distributor's own copy of Customer Service's template: theirs alone, inactive, without its contact points
            const copied = asUser(users.distributor, () =>
                invoke(A + "copy#Alert", {definitionId: "boss-service-sla-breach", title: "My queue's breaches"})
            )
            const body = () => JSON.parse(String(one("moqui.report.Definition", {definitionId: copied.definitionId}).bodyJson))
            const copy = body()
            const fraction = asUser(users.distributor, () =>
                invoke(A + "store#Alert", {
                    definitionId: copied.definitionId,
                    basisGiven: "Y",
                    title: "My queue's breaches",
                    valueField: "cases",
                    conditionType: "above",
                    threshold: "0.5",
                    intervalSeconds: "300"
                })
            )
            const activated = asUser(users.distributor, () =>
                invoke(A + "pause#Alerts", {definitionIds: [copied.definitionId], paused: false})
            )
            const shown =
                asUser(users.distributor, () => invoke(A + "get#Alert", {definitionId: copied.definitionId})).alert || {}
            const threshold = body().condition.threshold
            const owned = asUser("admin.identity", () =>
                invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {appRoot: "Admin", userId: people.distributor})
            )
            const participant =
                Array.from(owned.participantList || []).find(entry => entry.participantKey === "insights.alerts") || {}
            const noPermission = asUser(users.reader, () => refusal(R + "pause#OwnedAlertRules", {userId: people.distributor}))
            // a reader holds no engine save, so cannot take the rule
            const unqualified = asUser("admin.identity", () =>
                refusal(R + "transfer#AlertRuleOwner", {
                    definitionId: ruleId,
                    fromUserId: people.distributor,
                    toUserId: people.reader,
                    reason: "Offboarding"
                })
            )
            const deleted = asUser(users.distributor, () => invoke(A + "delete#Alert", {definitionId: copied.definitionId}))
            return {
                templates: Array.from(templates.templates || []),
                unread,
                manager,
                copied,
                copy,
                fraction,
                shown,
                threshold,
                activated: Array.from(activated.results || [])[0] || {},
                participant,
                resources: Array.from(participant.resourceList || []).map(resource => resource.resourceId),
                noPermission,
                unqualified,
                deleted,
                left: one("moqui.report.Definition", {definitionId: copied.definitionId})
            }
        },
        then({
            templates,
            unread,
            manager,
            copied,
            copy,
            fraction,
            shown,
            threshold,
            activated,
            participant,
            resources,
            noPermission,
            unqualified,
            deleted,
            left
        }) {
            // the shipped rules: Mantle's daily sales floor, Customer Service's breaches and Commerce's three
            templates.map(template => template.definitionId).sort() ==
                [
                    "boss-commerce-checkout-failures",
                    "boss-commerce-feed-build-failures",
                    "boss-commerce-payment-unresolved",
                    "boss-service-sla-breach",
                    "mantle-sales-daily-floor"
                ]
            templates.find(template => template.definitionId == "boss-service-sla-breach").available == true
            templates.find(template => template.definitionId == "mantle-sales-daily-floor").available == false
            unread.applied == false
            unread.reasonCode == "DATASET_UNAVAILABLE"
            manager.includes("INSIGHTS_ALERT_REQUIRED")
            copied.applied == true
            copy.paused == true
            copy.pausedReason == "not-validated"
            copy.copiedFrom == "boss-service-sla-breach"
            copy.contactPoints == undefined
            copy.audience.deliveryMode == "personal"
            copy.audience.topic == "InsightsBusinessAlert"
            // Activate runs the reading as the owner and has the engine check the audience; a fractional threshold stays a number
            fraction.applied == true
            activated.applied == true
            threshold === 0.5
            shown.conditionText == "cases above 0.5"
            shown.paused == false
            participant.state == "ready"
            participant.pauses == true
            resources.includes(ruleId)
            noPermission.includes("is not authorized")
            unqualified.includes("NEW_OWNER_REFUSED")
            deleted.applied == true
            left == null
        }
    }
)
