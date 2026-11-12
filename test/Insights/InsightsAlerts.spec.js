// Insights' business alerts (impl-insights P8; design-insights §8, Alerts, AlertDetail; INS-07). Business alerts' two screens are
// the framework's Dashboards alert screens, included at Insights' own locations with the transitions Insights offers and
// its policy (mr-moqui plans/archive/Admin-Screens-Down.md, Track I), so the rules are held through Insights' route, by the
// transitions a browser posts: an author sets an alert over a panel's saved query for themselves and not for others; a
// reader sets none, and neither does a dataset steward, who holds the engine's save but not Insights' alert feature; a
// distributor's audience is Insights' readers and groups of their own, within the organization's recipient cap, checked by
// the report engine, so the Retail agents pass and the Services reader is refused with the reason; a rule saved there has
// Insights' topic, link and cap whatever is posted, and no contact point; Tools' contact point, silence, mute timing,
// shared item and evaluation transitions are not on the route, where Tools' own route takes them. A rule starts inactive
// and Activate validates it; one evaluation tells each recipient separately on Insights' private topic, linking to
// AlertDetail, with the value; each recipient reads their own state and delivery, and a reader of the rule outside its
// audience reads no state; AlertDetail renders once (qvt) with each recipient's result; a shipped template is copied only
// over a dataset the caller reads, and a copy waits to be activated; and Admin's lifecycle finds the distributor's rule
// through Insights' participant. The engine's rules are the framework's BusinessAlerts; the admitted sales dataset and its
// orders are InsightsDatasets'. The "usable when" scenario is the acceptance InsightsAlertsUsable.
// Run: ./moq test mr-boss --spec InsightsAlerts
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, transition} = lib
const R = "org.moqui.report.ReportServices."
const boardId = "ins-alr-orders"
const toolsRuleId = "ins-alr-tools"
const webroot = "component://webroot/screen/webroot.xml"
const notes = ec.factory.getTool("NotificationCapture")
const people = {
    reader: "BOSS_INS_READER",
    author: "BOSS_INS_AUTHOR",
    steward: "BOSS_INS_STEWARD",
    services: "BOSS_INS_SERVICES",
    distributor: "BOSS_INS_DISTRIBUTOR"
}
const notOffered = "Setting an alert is not offered to you here"
const one = (entityName, fields) => system(() => ec.entity.find(entityName).condition(fields).useCache(false).one())
const bodyOf = definitionId => JSON.parse(String(one("moqui.report.Definition", {definitionId})?.bodyJson || "{}"))
const rulesOf = ownerId =>
    system(() =>
        Array.from(
            ec.entity.find("moqui.report.Definition").condition({ownerId, definitionType: "alert"}).useCache(false).list()
        ).map(row => String(row.definitionId))
    )
// the screens' transitions through Insights' route and through Tools' own, each under the server's root, where a
// transition's answer by the mount's links (a copy opens AlertDetail, a delete the list) resolves as in the app
const insights = (user, path, parameters) => transition(user, webroot, "apps/Insights/Alerts/" + path, parameters)
const tools = (path, parameters) => transition(users.system, webroot, "apps/dashboards/" + path, parameters)
const idIn = location => decodeURIComponent((/[?&]definitionId=([^&]+)/.exec(location) || [])[1] || "")
// What the alert screens show a user under Insights, with no page rendered: the framework's presentation module with the
// links and the policy Insights' root and its Alerts area set (get#Context, get#DeliveryPolicy), as that user.
function shown(user, read) {
    return asUser(user, () => {
        const context = invoke("ironstone.insights.ContextServices.get#Context", {appRoot: "Insights"})
        const cap = invoke("ironstone.insights.ContextServices.get#DeliveryPolicy", {}).recipientCap
        ec.context.put("reportLinks", context.reportLinks)
        ec.context.put("reportPolicy", Object.assign({}, context.reportPolicy, {recipientCap: cap}))
        ec.context.put("reportHiddenComponents", ["tools"])
        try {
            return read(ec.resource.script("component://tools/template/ReportAlerts.js"))
        } finally {
            for (const name of ["reportLinks", "reportPolicy", "reportHiddenComponents"]) ec.context.put(name, null)
        }
    })
}
// AlertBasis' post over the dashboard's panel, and AlertAudience's: the people and groups, and the group the rule is
// shared with so they can open it
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
const audience = (definitionId, extra) =>
    Object.assign({definitionId, audienceKind: "group", userGroupId: "BOSS_INSIGHTS"}, extra)
function setCap(value) {
    system(() => {
        const key = {partyId: ids.organizationId, partySettingTypeId: "InsightsGroupRecipientCap"}
        ec.entity.find("mantle.party.PartySetting").condition(key).deleteAll()
        if (value) {
            const row = ec.entity.makeValue("mantle.party.PartySetting")
            row.setAll(Object.assign({settingValue: value}, key))
            row.create()
        }
    })
}
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
    "through Insights' route an author sets an alert over a panel for themselves, a steward and a reader set none; a distributor's audience is Insights' readers within the cap, checked by the engine; Tools' transitions are not on the route",
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
            const store = (user, extra) => insights(user, "AlertDetail/storeAlert", fromPanel(extra))
            const tell = (user, definitionId, extra) => insights(user, "AlertDetail/storeAudience", audience(definitionId, extra))
            // what a request sends of the policy and of a rule's fixed parts is not taken: the feature, the topic, the link
            // and the cap are the mount's
            const forged = {
                reportPolicy: {features: {alert: true}, recipientCap: 9999, alertAudience: {topic: "ReportAlert"}},
                topic: "ReportAlert",
                detailLink: "/apps/dashboards/Alerts",
                recipientCap: 9999
            }
            // the same request: refused to a reader and to the steward, who holds the engine's save and not the feature;
            // saved for the author
            const readerStore = store(users.reader, forged)
            const stewardStore = store(users.steward, forged)
            const stewardRules = rulesOf(people.steward).length
            const badMeasure = store(users.author, {valueField: "nope"})
            const own = store(users.author, forged)
            authorRuleId = idIn(own.location)
            const ownBody = bodyOf(authorRuleId)
            // the same rule for another person: the author may not deliver to others
            const authorOthers = tell(users.author, authorRuleId, {recipientUserIds: [people.reader]})
            const created = store(users.distributor, {})
            ruleId = idIn(created.location)
            const told = tell(
                users.distributor,
                ruleId,
                Object.assign({recipientUserIds: [people.reader, people.author]}, forged)
            )
            const activated = insights(users.distributor, "AlertDetail/pauseAlert", {definitionId: ruleId, paused: "false"})
            const stored = bodyOf(ruleId)
            // past the organization's recipient cap, which the area adds to Insights' policy: refused, whatever is posted
            setCap("1")
            const overCap = tell(
                users.distributor,
                ruleId,
                Object.assign({recipientUserIds: [people.reader, people.author]}, forged)
            )
            setCap(null)
            const narrower = tell(users.distributor, ruleId, {recipientUserIds: [people.reader, people.services]})
            const foreignGroup = tell(users.distributor, ruleId, {recipientGroupIds: ["BOSS_ADMIN"]})
            // a person who is not an Insights reader is not accepted, so the check says nothing of their account
            const notReader = tell(users.distributor, ruleId, {recipientUserIds: ["BOSS_ADM_IDENTITY"]})
            // another's rule is not the author's to change, and a private one is not there for anyone else
            const notOwned = store(users.author, {definitionId: ruleId})
            const privateRule = insights(users.distributor, "AlertDetail/testAlert", {definitionId: authorRuleId})
            // Tools' own transitions of the two screens are not on Insights' route, for the distributor and for ADMIN
            const contact = {contactType: "notification", topic: "ReportAlert", contactUserId: "EX_JOHN_DOE"}
            const trims = [users.distributor, users.system]
                .flatMap(user => [
                    insights(user, "AlertDetail/addContact", Object.assign({definitionId: ruleId}, contact)),
                    insights(user, "AlertDetail/addSilence", {definitionId: ruleId}),
                    insights(user, "AlertDetail/addMute", {definitionId: ruleId}),
                    insights(user, "AlertDetail/removeItem", {definitionId: ruleId, collection: "contactPoints", itemIndex: "0"}),
                    insights(user, "AlertDetail/addRef", {definitionId: ruleId, sharedRef: "none"}),
                    insights(user, "AlertDetail/removeRef", {definitionId: ruleId, refKey: "silenceRefs", refId: "none"}),
                    insights(user, "AlertDetail/evaluate", {definitionId: ruleId}),
                    insights(user, "Rules/evaluate", {definitionId: ruleId}),
                    insights(user, "Rules/deleteShared", {definitionId: ruleId})
                ])
                .filter(asked => asked.location || !asked.errors.includes("screen path not found"))
                .map(asked => asked.location + " " + asked.errors)
            // Tools' own route (ADMIN) takes them: a rule whose query is typed, with a contact point
            const toolsRule = tools("AlertRule/storeAlert", {
                ruleId: toolsRuleId,
                title: "Insights spec telemetry rule",
                queryJson: JSON.stringify({datasetId: "otel_metrics", from: "now-5m", thru: "now", aggregations: []}),
                conditionType: "above",
                threshold: "1",
                intervalSeconds: "60",
                paused: "Y",
                labelsJson: "{}"
            })
            const toolsContact = tools("AlertRule/addContact", Object.assign({definitionId: toolsRuleId}, contact))
            const toolsBody = bodyOf(toolsRuleId)
            const toolsDeleted = tools("AlertRule/deleteAlert", {definitionId: toolsRuleId})
            // the people a distributor is offered: Insights' readers by name
            const choices = insights(users.distributor, "AlertDetail/recipientChoices", {term: "insights r"})
            return {
                readerStore,
                stewardStore,
                stewardRules,
                badMeasure,
                own,
                ownBody,
                authorOthers,
                created,
                told,
                activated,
                stored,
                overCap,
                narrower,
                foreignGroup,
                notReader,
                notOwned,
                privateRule,
                trims,
                toolsRule,
                toolsContact,
                toolsBody,
                toolsDeleted,
                choices: Array.from(JSON.parse(choices.output || "[]"))
                    .map(option => option.value)
                    .join(",")
            }
        },
        then({
            readerStore,
            stewardStore,
            stewardRules,
            badMeasure,
            own,
            ownBody,
            authorOthers,
            created,
            told,
            activated,
            stored,
            overCap,
            narrower,
            foreignGroup,
            notReader,
            notOwned,
            privateRule,
            trims,
            toolsRule,
            toolsContact,
            toolsBody,
            toolsDeleted,
            choices
        }) {
            readerStore.errors.includes(notOffered)
            stewardStore.errors.includes(notOffered)
            stewardRules == 0
            badMeasure.errors.includes("Choose one of the query's measures")
            own.errors == ""
            own.location.includes("Alerts/AlertDetail?definitionId=alert-orders-watch-")
            // a new rule tells nobody until it is activated, and tells its owner alone
            ownBody.paused == true && ownBody.pausedReason == "not-validated"
            ownBody.audience.deliveryMode == "personal"
            // the saved query of the panel, never one a request names
            ownBody.query.datasetId == "mantle-sales-orders" && ownBody.panelId == "orders"
            authorOthers.errors.includes("Telling other people of an alert needs the group delivery grant")
            created.errors == ""
            told.errors == ""
            activated.errors == ""
            // the rule's fixed parts are Insights': its topic, its link and the cap, and no contact point, whatever was posted
            stored.audience.deliveryMode == "group"
            stored.audience.topic == "InsightsBusinessAlert"
            stored.audience.recipientCap == 50
            stored.detailLink == "/qapps/Insights/Alerts/AlertDetail"
            stored.contactPoints == undefined
            stored.paused == false
            overCap.errors.includes("2 recipients are more than the cap of 1")
            // a refusal names the recipient and why, never their grants
            narrower.errors.includes("Insights Services reader (scope-differs)")
            !narrower.errors.includes("ORG_ZIZI")
            foreignGroup.errors.includes("Tell only a group you belong to")
            notReader.errors.includes("Choose recipients among the people who may be told here")
            notOwned.errors.includes("Only its owner changes an alert")
            privateRule.errors.includes("This alert is not available")
            trims.join("\n") == ""
            toolsRule.errors == "" && toolsRule.location.includes("/apps/dashboards/AlertRule?definitionId=" + toolsRuleId)
            toolsContact.errors == ""
            // Tools' own save: the query typed, a contact point, no audience and none of Insights' parts
            toolsBody.contactPoints.length == 1 && toolsBody.contactPoints[0].topic == "ReportAlert"
            toolsBody.audience == undefined && toolsBody.detailLink == undefined
            toolsDeleted.errors == "" && toolsDeleted.location.includes("/apps/dashboards/Alerts")
            choices == people.reader
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
        const mine = shown(users.distributor, alerts => alerts.list({view: "mine"}))
        const readerView = shown(users.reader, alerts => alerts.detail({definitionId: ruleId}))
        // a reader may set no alert: their list is what they received, whatever view is asked
        const received = shown(users.reader, alerts => alerts.list({view: "mine"}))
        // the Services reader opens the shared rule and reads no state: not in its audience, and not what its owner reads
        const outsider = shown(users.services, alerts => alerts.detail({definitionId: ruleId}))
        const outsiderReceived = shown(users.services, alerts => alerts.list({view: "received"}))
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
        row.kindText == "Business"
        // the distributor's own rule alone: not the author's, and none of Tools' or the templates
        Array.from(mine.alerts).length == 1
        mine.viewOptions.map(option => option.value).join() == "mine,received,templates"
        readerView.found == true
        readerView.canEdit == false
        // the owner by name, from the engine's answer
        readerView.alert.ownerName == "Insights Distributor"
        Array.from(readerView.states).length >= 1
        readerView.states[0].stateText == "Firing"
        readerView.states[0].valueText != "–"
        // a recipient's deliveries are their own
        Array.from(readerView.deliveries).length >= 1
        Array.from(readerView.audience).length == 0
        received.view == "received"
        received.viewOptions.map(option => option.value).join() == "received"
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
        // nothing of Tools' own: no contact point, silence, mute timing, shared item or evaluation
        !/Contact points|Add silence|Add mute timing|Use shared item|Evaluate now/.test(page.output)
    }
})

feature(
    "a template is copied only over a dataset the caller reads, a copy waits to be activated, and Admin's lifecycle finds the rule",
    {
        when() {
            const templates = shown(users.distributor, alerts => alerts.list({view: "templates"}))
            const copyOf = (user, parameters) => insights(user, "Rules/copyAlert", parameters)
            // Mantle's sales items wait for the steward's admission; a reader who is a Customer Service manager sets no alert
            const unread = copyOf(users.distributor, {sourceDefinitionId: "mantle-sales-daily-floor"})
            const manager = copyOf(users.serviceManager, {sourceDefinitionId: "boss-service-sla-breach"})
            // the distributor's own copy of Customer Service's template: theirs alone, inactive, without its contact points
            const copied = copyOf(users.distributor, {
                sourceDefinitionId: "boss-service-sla-breach",
                title: "My queue's breaches"
            })
            const copiedId = idIn(copied.location)
            const copy = bodyOf(copiedId)
            const fraction = insights(users.distributor, "AlertDetail/storeAlert", {
                definitionId: copiedId,
                title: "My queue's breaches",
                valueField: "cases",
                conditionType: "above",
                threshold: "0.5",
                intervalSeconds: "300"
            })
            const activated = insights(users.distributor, "Rules/pauseAlerts", {definitionIds: copiedId, paused: "false"})
            const shownRule = shown(users.distributor, alerts => alerts.detail({definitionId: copiedId})).alert || {}
            const active = bodyOf(copiedId)
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
            const deleted = insights(users.distributor, "AlertDetail/deleteAlert", {definitionId: copiedId})
            return {
                templates: Array.from(templates.templates || []),
                unread,
                manager,
                copied,
                copy,
                fraction,
                activated,
                shownRule,
                active,
                participant,
                resources: Array.from(participant.resourceList || []).map(resource => resource.resourceId),
                noPermission,
                unqualified,
                deleted,
                left: one("moqui.report.Definition", {definitionId: copiedId})
            }
        },
        then({
            templates,
            unread,
            manager,
            copied,
            copy,
            fraction,
            activated,
            shownRule,
            active,
            participant,
            resources,
            noPermission,
            unqualified,
            deleted,
            left
        }) {
            // the shipped business rules: Mantle's daily sales floor, Customer Service's breaches, Commerce's three and Maintenance's overdue PM and resource down (impl-maintenance P17; its generation failure reads the server log); not
            // Tools' telemetry rules, nor Admin's over the job runs' spans
            templates.map(template => template.definitionId).sort() ==
                [
                    "boss-commerce-checkout-failures",
                    "boss-commerce-feed-build-failures",
                    "boss-commerce-payment-unresolved",
                    "boss-maintenance-overdue-pm",
                    "boss-maintenance-resource-down",
                    "boss-service-sla-breach",
                    "mantle-sales-daily-floor"
                ]
            templates.find(template => template.definitionId == "boss-service-sla-breach").available == true
            templates.find(template => template.definitionId == "mantle-sales-daily-floor").available == false
            unread.errors.includes("Its dataset is not yours to read")
            manager.errors.includes(notOffered)
            copied.errors == ""
            copied.location.includes("Alerts/AlertDetail?definitionId=alert-my-queue-s-breaches-")
            copy.paused == true
            copy.pausedReason == "not-validated"
            copy.copiedFrom == "boss-service-sla-breach"
            copy.contactPoints == undefined
            copy.audience.deliveryMode == "personal"
            copy.audience.topic == "InsightsBusinessAlert"
            // Activate runs the reading as the owner and has the engine check the audience; a fractional threshold stays a number
            fraction.errors == ""
            activated.errors == ""
            active.condition.threshold === 0.5
            active.paused == false
            shownRule.conditionText == "cases above 0.5"
            shownRule.paused == "N"
            participant.state == "ready"
            participant.pauses == true
            resources.includes(ruleId)
            noPermission.includes("is not authorized")
            unqualified.includes("NEW_OWNER_REFUSED")
            deleted.errors == ""
            deleted.location.includes("Alerts/Rules")
            left == null
        }
    }
)
