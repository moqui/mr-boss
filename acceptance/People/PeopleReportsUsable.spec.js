// People P29's "usable when" (impl-people P29; design-people §12 Reports, §1.4 Shipped reports), server side through the screens on
// the demo data, with artifact authorization on: people.hr runs headcount and turnover for Ziziwork Retail this year and exports it,
// the export's totals the report's; people.analyst (an Insights author with People's Insights bundle, Retail's) opens the People
// workforce dashboard, whose panels answer, and schedules the monthly headcount report for themselves; and the qualifications
// expiring template, copied in Insights › Business alerts and activated, tells its owner once when a Retail employee's verified
// qualification expires within thirty days, and not again at the next check. Rafael's first aid certificate's expiry is moved here
// and put back at the end, and the copied rule and the schedule are deleted, so the demo data is left as it was. The rules are
// Mantle's PeopleReports and BOSS's PeopleInsights and PeopleAccessLater. Written with P29, not run as part of it.
// Run: ./moq accept mr-boss --spec PeopleReportsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const notes = ec.factory.getTool("NotificationCapture")
const TOPIC = "InsightsBusinessAlert"
const analyst = "people.analyst"
const analystId = "BOSS_PPL_ANALYST"
const title = "Qualifications walk " + String(Date.now()).slice(-6)
const yearStart = ec.l10n.format(new Date(), "yyyy") + "-01-01"
const state = {}
let evaluations = 0

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).useCache(false).one())
// an Insights screen or transition as the user: a page in qvt, a transition as a post
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
            body: typeof message.message === "string" ? JSON.parse(message.message) : message.message
        }))
        .filter(message => message.body?.ruleId === state.ruleId)
const reindex = () =>
    system(() =>
        ec.service
            .sync()
            .name("org.moqui.search.SearchServices.index#DataFeedDocuments")
            .parameters({dataFeedId: "BossPeopleReports"})
            .call()
    )

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
        notes.enable()
        reindex()
    },
    cleanupSpec() {
        notes.disable()
        notes.clear()
        ec.user.setEffectiveTime(null)
        system(() => {
            if (state.expiryBefore !== undefined) {
                const row = ec.entity
                    .find("mantle.humanres.ability.PartyQualification")
                    .condition("partyQualificationId", ids.firstAidId)
                    .one()
                if (row) {
                    row.thruDate = state.expiryBefore
                    row.update()
                }
            }
            if (state.scheduleId) {
                // the schedule's own rows first (its lock, recipients and occurrences), as Insights' delivery walk removes one
                const screenScheduledId = state.scheduleId
                for (const occurrence of ec.entity.find("moqui.report.ReportOccurrence").condition({screenScheduledId}).list())
                    ec.entity
                        .find("moqui.report.ReportRecipientDelivery")
                        .condition("occurrenceId", occurrence.occurrenceId)
                        .deleteAll()
                for (const entityName of [
                    "moqui.report.ReportOccurrence",
                    "moqui.report.ReportScheduleRecipient",
                    "moqui.screen.ScreenScheduledLock"
                ])
                    ec.entity.find(entityName).condition({screenScheduledId}).deleteAll()
                ec.entity.find("moqui.screen.ScreenScheduled").condition({screenScheduledId}).deleteAll()
            }
        })
        reindex()
        if (state.ruleId && one("moqui.report.Definition", {definitionId: state.ruleId}))
            insights(analyst, "Alerts/AlertDetail/deleteAlert", {definitionId: state.ruleId}, "post")
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.hr runs headcount and turnover for Retail this year and exports it, the export's totals the report's", {
    when() {
        const options = {reportId: "headcount", organizationPartyId: ids.organizationId, fromDate: yearStart}
        const report = asUser(users.hr, () => page("Reports", options))
        const answer = asUser(users.hr, () => {
            ec.artifactExecution.disableAuthz()
            return invoke("mantle.humanres.PeopleReportServices.run#Report", options)
        })
        const csv = asUser(users.hr, () =>
            String(
                ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .render("Reports/exportCsv", options, null).output || ""
            )
        )
        return {report, answer, lines: csv.split("\r\n")}
    },
    then({report, answer, lines}) {
        report.errors == []
        report.output.includes("Headcount and turnover")
        report.output.includes("Ziziwork Retail")
        report.output.includes(answer.denominatorText.split(":")[0])
        answer.totals.endHeadcount > 0
        lines[0] == "Headcount and turnover"
        lines.some(line => line.startsWith("Denominator,"))
        lines.some(line =>
            line.startsWith(
                ["Total", answer.totals.startHeadcount, answer.totals.endHeadcount, answer.totals.employmentCount].join(",") + ","
            )
        )
    }
})

feature("the analyst opens the People workforce dashboard and schedules the monthly headcount report", {
    when() {
        const board = insights(analyst, "Dashboard", {definitionId: "boss-people-workforce"})
        const saved = insights(
            analyst,
            "ScheduledReports/Schedules/createSchedule",
            {newDefinitionId: "boss-people-workforce", cronSelected: "0 0 7 1 * ?", renderMode: "csv", audienceKind: "personal"},
            "post"
        )
        const schedule = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.screen.ScreenScheduled")
                    .condition({reportOwnerId: analystId, reportDefinitionId: "boss-people-workforce"})
                    .useCache(false)
                    .list()
            )
        )[0]
        state.scheduleId = schedule ? String(schedule.screenScheduledId) : null
        // an Insights reader without People's bundle reads none of it
        const outsider = insights("insights.reader", "Dashboard", {definitionId: "boss-people-workforce"})
        return {board, saved, mode: schedule?.deliveryMode, outsider}
    },
    then({board, saved, mode, outsider}) {
        board.status == 200
        board.errors == ""
        board.output.includes("People workforce")
        board.output.includes("Employments in effect by employer")
        !board.output.includes("is not admitted")
        saved.errors == ""
        state.scheduleId != null
        mode == "personal"
        // the outsider gets the dashboard's frame with each panel's dataset refused, no rows: the People datasets are the bundle's
        !outsider.output.includes("Employments in effect by employer") ||
            ["boss-people-headcount", "boss-people-leave-balances", "boss-people-qualifications"].every(datasetId =>
                outsider.output.includes("is not authorized for AT_SERVICE [org.moqui.report.dataset." + datasetId + "]")
            )
    }
})

feature("a qualifications expiring alert copied from the template tells its owner once", {
    when() {
        // Rafael's first aid certificate (Retail) moved to expire in twenty days, and indexed
        system(() => {
            const row = ec.entity
                .find("mantle.humanres.ability.PartyQualification")
                .condition("partyQualificationId", ids.firstAidId)
                .one()
            state.expiryBefore = row.thruDate
            row.thruDate = new Date(Date.now() + 20 * 86400000)
            row.update()
        })
        reindex()
        const copied = insights(
            analyst,
            "Alerts/Rules/copyAlert",
            {sourceDefinitionId: "boss-people-qualification-expiring", title},
            "post"
        )
        state.ruleId = one("moqui.report.Definition", {title})?.definitionId
        const activated = insights(
            analyst,
            "Alerts/AlertDetail/pauseAlert",
            {definitionId: state.ruleId, paused: "false"},
            "post"
        )
        notes.clear()
        const first = evaluate()
        const firstMessages = told()
        notes.clear()
        const second = evaluate()
        const secondMessages = told()
        return {copied, activated, first, firstMessages, second, secondMessages}
    },
    then({copied, activated, first, firstMessages, second, secondMessages}) {
        copied.errors == ""
        state.ruleId != null
        activated.errors == ""
        first.failed == 0
        firstMessages.length == 1
        firstMessages[0].to == analystId
        firstMessages[0].title.includes("Firing")
        Number(String(firstMessages[0].body.events[0].value)) >= 1
        second.failed == 0
        secondMessages.length == 0
    }
})
