// Maintenance P17's "usable when" (impl-maintenance P17; design-maintenance §8 Reports and WorkStatusReport, §1.4 Shipped reports,
// §11.2 "Reports and scope"), server side through the screens on the demo data, with artifact authorization on: maint.supervisor
// opens Reports and Work status for this month grouped by team, reads the team's backlog and drills to its work orders, whose rows
// are as many as the count; a technician gets no report. Insights' catalog (as the instance administrator, who reads both apps)
// lists Maintenance's work status entry and opens the same route with the same parameters, whose report answers the same numbers.
// The overdue preventive maintenance template, copied in Insights › Business alerts and activated, tells its owner once when an
// obligation of the air handler's filter plan is past due, and not again at the next check. The occurrence's due date (and, when
// the plan has none open, October's skipped one's status) is moved here and put back at the end, and the copied rule is deleted,
// so the demo data is left as it was. The rules are Mantle's MaintenanceReports and BOSS's MaintenanceReports and
// MaintenanceAccess. Written with P17, not run as part of it.
// Run: ./moq accept mr-boss --spec MaintenanceReportsWalk
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const R = "org.moqui.report.ReportServices."
const S = "mantle.work.MaintenanceReportServices.get#MaintenanceStatusReport"
const webroot = "component://webroot/screen/webroot.xml"
const notes = ec.factory.getTool("NotificationCapture")
const TOPIC = "InsightsBusinessAlert"
const title = "Overdue PM walk " + String(Date.now()).slice(-6)
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const monthStart = ec.l10n.format(new Date(), "yyyy-MM") + "-01"
const state = {}
let evaluations = 0

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).useCache(false).one())
// the report as the user, its own permission and scope deciding (the root's grant aside)
const statusAs = (user, parameters) =>
    asUser(user, () => {
        ec.artifactExecution.disableAuthz()
        return invoke(S, parameters)
    })
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
            .parameters({dataFeedId: "BossMaintenanceReports", dataDocumentId: "BossMaintenanceOccurrence"})
            .call()
    )

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
            if (state.occurrenceId) {
                const row = ec.entity
                    .find("mantle.work.maintenance.MaintenanceOccurrence")
                    .condition("maintenanceOccurrenceId", state.occurrenceId)
                    .one()
                if (row) {
                    row.dueDate = state.dueBefore
                    if (state.statusBefore) row.statusId = state.statusBefore
                    row.update()
                }
            }
        })
        reindex()
        if (state.ruleId && one("moqui.report.Definition", {definitionId: state.ruleId}))
            insights(users.system, "Alerts/AlertDetail/deleteAlert", {definitionId: state.ruleId}, "post")
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature("the supervisor reads this month's backlog by team and drills to the team's work orders; a technician gets no report", {
    when() {
        const options = {organizationPartyId: ids.organizationId, fromDate: monthStart, groupBy: "team"}
        const landing = asUser(users.supervisor, () => page("Reports", {lastStandalone: "true"}))
        const report = asUser(users.supervisor, () =>
            page("Reports/WorkStatusReport", Object.assign({lastStandalone: "true"}, options))
        )
        const totals = statusAs(users.supervisor, options)
        const team = Array.from(totals.groupList).find(group => group.groupKey === ids.teamId) || {}
        const drilled = asUser(users.supervisor, () =>
            page(
                "Reports/WorkStatusReport",
                Object.assign({lastStandalone: "true", groupKey: ids.teamId, measure: "backlog", pageSize: 100}, options)
            )
        )
        const rows = statusAs(users.supervisor, Object.assign({groupKey: ids.teamId, measure: "backlog", pageSize: 100}, options))
        const tech = asUser(users.tech, () => page("Reports/WorkStatusReport", {lastStandalone: "true"}))
        state.totals = totals.summary
        return {landing, report, team, drilled, rows, tech}
    },
    then({landing, report, team, drilled, rows, tech}) {
        opened(landing)
        landing.output.includes("Work status · backlog now")
        opened(report)
        report.output.includes("Facilities maintenance")
        team.backlogCount > 0
        opened(drilled)
        rows.statusList.length == team.backlogCount
        rows.statusList.every(row => row.backlog && row.teamName.includes("Facilities maintenance"))
        rows.statusList.every(row => drilled.output.includes(row.workEffortId))
        // the technician's assigned view reads no report: the page says so and shows no totals
        tech.output.includes("Maintenance view is required")
        !tech.output.includes("Totals")
    }
})

feature("Insights' catalog lists work status and opens the same report with the same numbers", {
    when() {
        const reports = asUser(users.system, () =>
            Array.from(invoke("ironstone.insights.RegistryServices.find#Reports", {}).reports || [])
        )
        const link = asUser(users.system, () =>
            invoke("ironstone.insights.RegistryServices.get#ReportLink", {
                entryId: "Maintenance.WorkStatus",
                organizationPartyId: ids.organizationId,
                fromDate: monthStart
            })
        )
        const query = Object.fromEntries(
            String(link.url || "")
                .split("?")[1]
                .split("&")
                .map(pair => pair.split("=").map(decodeURIComponent))
        )
        const same = statusAs(users.system, Object.assign({groupBy: "team"}, query))
        return {entry: reports.find(row => row.entryId === "Maintenance.WorkStatus") || {}, link, query, same}
    },
    then({entry, link, query, same}) {
        entry.title == "Work status"
        link.url.startsWith("/qapps/Maintenance/Reports/WorkStatusReport?")
        query.organizationPartyId == ids.organizationId
        query.fromDate == monthStart
        same.summary.openedCount == state.totals.openedCount
        same.summary.completedCount == state.totals.completedCount
        same.summary.backlogCount == state.totals.backlogCount
        same.summary.overdueCount == state.totals.overdueCount
    }
})

feature("an overdue PM alert copied from the template tells its owner once", {
    when() {
        // an obligation of the filter plan, generated and not done, moved two days past due and indexed; the demo's filter plan
        // has none open (its October obligation was skipped), so with none the walk opens October's and puts it back at the end
        system(() => {
            const occurrences = () =>
                ec.entity
                    .find("mantle.work.maintenance.MaintenanceOccurrence")
                    .condition("maintenanceScheduleId", ids.filterPlanId)
            let row = Array.from(
                occurrences().condition("statusId", "in", ["MocOpen", "MocGenerated"]).orderBy("-dueDate").limit(1).list()
            )[0]
            if (!row) {
                row = occurrences().condition("maintenanceOccurrenceId", "BOSS_MNT_OCC_FLT_OCT").one()
                if (!row) return
                state.statusBefore = row.statusId
                row.statusId = "MocOpen"
            }
            state.occurrenceId = String(row.maintenanceOccurrenceId)
            state.dueBefore = row.dueDate
            row.dueDate = new Date(Date.now() - 2 * 86400000)
            row.update()
        })
        reindex()
        const copied = insights(
            users.system,
            "Alerts/Rules/copyAlert",
            {sourceDefinitionId: "boss-maintenance-overdue-pm", title},
            "post"
        )
        state.ruleId = one("moqui.report.Definition", {title})?.definitionId
        const activated = insights(
            users.system,
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
        state.occurrenceId != null
        copied.errors == ""
        state.ruleId != null
        activated.errors == ""
        first.failed == 0
        firstMessages.length == 1
        firstMessages[0].title.includes("Firing")
        Number(String(firstMessages[0].body.events[0].value)) >= 1
        second.failed == 0
        secondMessages.length == 0
    }
})
