// Insights P8's "usable when" (impl-insights P8; design-insights §8 and §13.3 "Business alert semantics"), server side through
// the screens on the demo data, with artifact authorization on: a distributor of Ziziwork Retail copies Customer Service's
// service level breach template, which stays inactive until they activate it; adds a Retail colleague who reads what they
// read, while the ORG_ZIZI_SERVICES reader cannot be added and learns the reason; a breach in a Retail queue then tells the
// two of them, each in a notification of their own on Insights' private topic with the value and a link to AlertDetail, where
// each reads their own state; the Services reader, who may open the shared rule, reads no state; and an outage of the source
// shows Error, which is not Normal and not a recovery. The breach is made here on a Retail case's clock and the rule is
// deleted at the end, so the demo data is left as it was. The rules are the framework's BusinessAlerts and the regression
// InsightsAlerts. Written with P8, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsAlertsUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const notes = ec.factory.getTool("NotificationCapture")
const TOPIC = "InsightsBusinessAlert"
const people = {manager: "BOSS_INS_DISTRIBUTOR", colleague: "BOSS_INS_READER", services: "BOSS_INS_SERVICES"}
const title = "Retail queue breaches " + String(Date.now()).slice(-6)
let ruleId
let clock
let clockBefore
let evaluations = 0

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).useCache(false).one())
const body = () => JSON.parse(String(one("moqui.report.Definition", {definitionId: ruleId}).bodyJson))
// a screen or a transition under Insights as the user: a page in qvt, a transition as a post
function insights(user, path, parameters = {}, method = null) {
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
// the engine's minute job as the system, some minutes after the pass before it
function evaluate() {
    evaluations += 1
    ec.user.setEffectiveTime(Date.now() + evaluations * 600000)
    try {
        return system(() => invoke(R + "evaluate#Alerts", {}))
    } finally {
        ec.user.setEffectiveTime(null)
    }
}
const told = () =>
    Array.from(notes.getMessages(TOPIC))
        .map(message => ({
            to: Array.from(message.userIds || []).join("+"),
            title: String(message.title),
            link: String(message.link),
            body: typeof message.message === "string" ? JSON.parse(message.message) : message.message
        }))
        .filter(message => message.body?.ruleId === ruleId)
const stale = on =>
    system(() => {
        const row = ec.entity.find("moqui.report.BusinessDataset").condition("datasetId", "boss-service-breaches").one()
        row.fieldsChangedDate = on ? new Date(Date.now() + 86400000) : null
        row.update()
    })

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
        notes.enable()
    },
    cleanupSpec() {
        notes.disable()
        notes.clear()
        ec.user.setEffectiveTime(null)
        system(() => {
            stale(false)
            if (clock && clockBefore) {
                const row = ec.entity.find("mantle.request.support.CaseSlaEpisode").condition("caseSlaEpisodeId", clock).one()
                if (row) {
                    row.breachedDate = clockBefore.breachedDate
                    row.update()
                }
            }
        })
        if (ruleId && one("moqui.report.Definition", {definitionId: ruleId}))
            insights(users.distributor, "Alerts/AlertDetail/deleteAlert", {definitionId: ruleId}, "post")
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the distributor copies the service level breach template, and the copy tells nobody until it is activated", {
    when() {
        const templates = insights(users.distributor, "Alerts/Rules", {view: "templates"})
        const copied = insights(
            users.distributor,
            "Alerts/Rules/copyAlert",
            {sourceDefinitionId: "boss-service-sla-breach", title},
            "post"
        )
        ruleId = one("moqui.report.Definition", {title, ownerId: people.manager})?.definitionId
        const detail = insights(users.distributor, "Alerts/AlertDetail", {definitionId: ruleId})
        // a reader, who may set no alert, is refused the same copy
        const reader = insights(
            users.reader,
            "Alerts/Rules/copyAlert",
            {sourceDefinitionId: "boss-service-sla-breach", title: title + " reader"},
            "post"
        )
        return {templates, copied, detail, reader, stored: ruleId ? body() : {}}
    },
    then({templates, copied, detail, reader, stored}) {
        templates.errors == ""
        templates.output.includes("Service level breaches")
        templates.output.includes("Daily sales below floor")
        copied.errors == ""
        ruleId != null
        stored.paused == true
        stored.pausedReason == "not-validated"
        stored.copiedFrom == "boss-service-sla-breach"
        // the template's contact point is not copied; the copy tells its owner alone, on Insights' topic
        stored.contactPoints == undefined
        stored.audience.deliveryMode == "personal"
        stored.audience.topic == TOPIC
        detail.errors == ""
        detail.output.includes(title)
        detail.output.includes("Not active yet")
        detail.output.includes("Activate")
        reader.errors.includes("Setting an alert is not offered to you here")
        one("moqui.report.Definition", {title: title + " reader"}) == null
    }
})

feature("an equivalent colleague is added and the rule activated; the Services reader cannot be added, with the reason", {
    when() {
        const added = insights(
            users.distributor,
            "Alerts/AlertDetail/storeAudience",
            {
                definitionId: ruleId,
                audienceKind: "group",
                recipientUserIds: [people.manager, people.colleague].join(","),
                userGroupId: "BOSS_INSIGHTS",
                emailChannel: "N"
            },
            "post"
        )
        const activated = insights(
            users.distributor,
            "Alerts/AlertDetail/pauseAlert",
            {definitionId: ruleId, paused: "false"},
            "post"
        )
        const active = body()
        // the same form with the Services reader: the screen's post changes nothing, and its error says why
        const posted = insights(
            users.distributor,
            "Alerts/AlertDetail/storeAudience",
            {
                definitionId: ruleId,
                audienceKind: "group",
                recipientUserIds: [people.manager, people.colleague, people.services].join(","),
                userGroupId: "BOSS_INSIGHTS"
            },
            "post"
        )
        const detail = insights(users.distributor, "Alerts/AlertDetail", {definitionId: ruleId})
        return {added, activated, active, posted, after: body(), detail}
    },
    then({added, activated, active, posted, after, detail}) {
        added.errors == ""
        activated.errors == ""
        active.paused == false
        active.audience.deliveryMode == "group"
        Array.from(active.audience.recipientUserIds).sort().join() == [people.colleague, people.manager].sort().join()
        posted.errors.includes("Insights Services reader (scope-differs)")
        !posted.errors.includes(ids.otherOrganizationId)
        // the refused save left the audience as it was
        Array.from(after.audience.recipientUserIds).sort().join() == [people.colleague, people.manager].sort().join()
        detail.errors == ""
        detail.output.includes("May be told")
        detail.output.includes("Insights Reader")
        !detail.output.includes("Insights Services reader")
    }
})

feature("a breach in a Retail queue tells the two of them separately with the value, and each reads their own state", {
    when() {
        // a Retail case's clock breached ten minutes ago, indexed as Customer Service's feed indexes it
        system(() => {
            const row = Array.from(
                ec.entity
                    .find("mantle.request.support.CaseSlaEpisode")
                    .condition("organizationPartyId", ids.organizationId)
                    .orderBy("caseSlaEpisodeId")
                    .limit(1)
                    .list()
            )[0]
            if (!row) return
            clock = String(row.caseSlaEpisodeId)
            clockBefore = {breachedDate: row.breachedDate}
            row.breachedDate = new Date(Date.now() - 600000)
            row.update()
            ec.service
                .sync()
                .name("org.moqui.search.SearchServices.index#DataFeedDocuments")
                .parameters({dataFeedId: "BossServiceClocks", dataDocumentId: "BossServiceClock"})
                .call()
        })
        notes.clear()
        const pass = evaluate()
        const messages = told()
        const managerView = insights(users.distributor, "Alerts/AlertDetail", {definitionId: ruleId})
        const colleagueView = insights(users.reader, "Alerts/AlertDetail", {definitionId: ruleId})
        const colleagueList = insights(users.reader, "Alerts/Rules", {})
        // the Services reader opens the shared rule and reads no state of it
        const outsider = insights(users.services, "Alerts/AlertDetail", {definitionId: ruleId})
        const outsiderState = asUser(users.services, () => invoke(R + "get#AlertState", {definitionId: ruleId}))
        return {pass, messages, managerView, colleagueView, colleagueList, outsider, outsiderState}
    },
    then({pass, messages, managerView, colleagueView, colleagueList, outsider, outsiderState}) {
        clock != null
        pass.failed == 0
        // one notification each, to one user each, and nobody else
        Array.from(new Set(messages.map(message => message.to)))
            .sort()
            .join() == [people.colleague, people.manager].sort().join()
        messages.every(message => !message.to.includes("+"))
        messages.every(message => message.title.includes("Firing"))
        messages.every(message => message.link == "/qapps/Insights/Alerts/AlertDetail?definitionId=" + ruleId)
        messages.every(message => Number(String(message.body.events[0].value)) >= 1)
        managerView.errors == ""
        managerView.output.includes("Firing")
        managerView.output.includes("Insights Reader")
        colleagueView.errors == ""
        colleagueView.output.includes("Firing")
        // a recipient sees their own notification, not the audience or another's delivery
        colleagueView.output.includes("Your own notifications of this alert")
        !colleagueView.output.includes("Change audience")
        colleagueList.errors == ""
        colleagueList.output.includes(title)
        outsider.errors == ""
        outsider.output.includes("not in this alert")
        !outsider.output.includes("Firing")
        outsiderState.available == false
        Array.from(outsiderState.instances).length == 0
    }
})

feature("an outage of the source shows Error, not Normal and not a recovery", {
    when() {
        // the dataset's fields changed after its index was built: it gives no valid reading until it is rebuilt
        stale(true)
        notes.clear()
        const pass = evaluate()
        const messages = told()
        const state = asUser(users.distributor, () => invoke(R + "get#AlertState", {definitionId: ruleId}))
        const detail = insights(users.distributor, "Alerts/AlertDetail", {definitionId: ruleId})
        const list = insights(users.distributor, "Alerts/Rules", {view: "mine"})
        stale(false)
        return {pass, messages, states: Array.from(state.instances || []).map(instance => String(instance.state)), detail, list}
    },
    then({pass, messages, states, detail, list}) {
        pass.failed == 0
        states.length >= 1
        states.every(state => state == "Error")
        // told as Error, never as Normal
        messages.length >= 2
        messages.every(message => message.title.includes("Error") && !message.title.includes("Normal"))
        detail.errors == ""
        detail.output.includes("Error (not known)")
        list.errors == ""
        list.output.includes("Error (not known)")
    }
})
