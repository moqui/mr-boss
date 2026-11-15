// Sales P19's "usable when" (impl-sales P19; design-sales §8 Reports, SalesSummary, SalesAnalysis, PipelineAnalysis, WinLoss,
// TargetAttainment, §13.2 shipped definitions), server side through the screens on the demo data, with artifact authorization on:
// sales.reader opens each report for Ziziwork Retail from All reports, each drill-down list's export agreeing with the screen's
// count (Pipeline analysis' open deals, Win/loss' closed deals, the service's own count); Accounting's Sales analysis, the mount of
// the same definition, shows its finance columns over the same rows as Sales' for a reader of both; and a sales manager given
// Insights' distributor grant here subscribes to the weekly pipeline digest and copies the stalled-deal alert, which fires once a
// deal of theirs has sat in its stage past the alert's days. The manager's Insights memberships, the schedule, the alert and the
// deal's backdated stage are removed or put back at the end. The rules are Mantle's SalesPipelineReports and the regression
// SalesReports and SalesReportCatalog. Written with P19, not run as part of it.
// Run: ./moq accept mr-boss --spec SalesReportsUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const F = "mantle.sales.ForecastServices."
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const managerId = "BOSS_SAL_MANAGER"
const memberships = [
    [managerId, "BOSS_INSIGHTS"],
    [managerId, "BOSS_INSIGHTS_DISTRIBUTE"]
]
const title = "Stalled Retail deals " + String(Date.now()).slice(-6)
const shared = {}

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
// the rows of one list in a screen's CSV, which writes each of its lists in turn (a header line, then its rows): those after the
// list's header, the deals lists being their screens' last
const csvRows = (output, header) => {
    const lines = String(output || "")
        .split(/\r?\n/)
        .filter(line => line.trim())
    const at = header ? lines.findIndex(line => line.startsWith(header)) : 0
    return at < 0 ? -1 : lines.length - at - 1
}
function removeMemberships() {
    system(() => {
        for (const [userId, userGroupId] of memberships)
            ec.entity.find("moqui.security.UserGroupMember").condition({userId, userGroupId}).deleteAll()
    })
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        removeMemberships()
        system(() => {
            for (const [userId, userGroupId] of memberships)
                ec.service
                    .sync()
                    .name("create#moqui.security.UserGroupMember")
                    .parameters({userId, userGroupId, fromDate: 0})
                    .call()
            // a personal schedule's result goes to its owner's address, which the demo manager has none of
            const account = ec.entity.find("moqui.security.UserAccount").condition("userId", managerId).one()
            shared.managerEmail = account.emailAddress ?? null
            if (!shared.managerEmail) account.set("emailAddress", "sales.manager@ziziwork.example").update()
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the copied alert deleted as Insights deletes it (its versions with it)
        if (
            shared.ruleId &&
            system(() => ec.entity.find("moqui.report.Definition").condition("definitionId", shared.ruleId).one())
        )
            insights(users.manager, "Alerts/AlertDetail/deleteAlert", {definitionId: shared.ruleId}, "post")
        ec.message.clearErrors()
        system(() => {
            if (!shared.managerEmail)
                ec.entity
                    .find("moqui.security.UserAccount")
                    .condition("userId", managerId)
                    .one()
                    ?.set("emailAddress", null)
                    .update()
            for (const schedule of Array.from(
                ec.entity.find("moqui.screen.ScreenScheduled").condition("reportOwnerId", managerId).list()
            )) {
                ec.entity
                    .find("moqui.screen.ScreenScheduledLock")
                    .condition("screenScheduledId", schedule.screenScheduledId)
                    .deleteAll()
                schedule.delete()
            }
            if (shared.stalled)
                ec.entity
                    .find("mantle.sales.opportunity.SalesOpportunity")
                    .condition("salesOpportunityId", shared.stalled.salesOpportunityId)
                    .one()
                    ?.set("stageEnteredDate", shared.stalled.stageEnteredDate)
                    .update()
        })
        removeMemberships()
    }
})

feature("the reader opens each report for Retail from All reports; each export agrees with the screen's count", {
    when() {
        const org = {organizationPartyId: ids.organizationId}
        const allDates = Object.assign({fromDate: "2000-01-01", thruDate: "2100-01-01"}, org)
        return asUser(users.reader, () => ({
            catalogue: page("Reports/Catalogue", org),
            summary: page("Reports/SalesSummary", org),
            analysis: page("Reports/SalesAnalysis", allDates),
            pipeline: page("Reports/PipelineAnalysis", org),
            winLoss: page("Reports/WinLoss", allDates),
            attainment: page("Reports/TargetAttainment", org),
            pipelineCsv: page("Reports/PipelineAnalysis", Object.assign({pageNoLimit: "true"}, org), "csv"),
            pipelineCount: system(() => invoke(F + "get#PipelineAnalysis", org).dealListCount),
            winLossCsv: page("Reports/WinLoss", Object.assign({pageNoLimit: "true"}, allDates), "csv"),
            winLossCount: system(() => invoke(F + "get#WinLoss", allDates).dealListCount)
        }))
    },
    then(found) {
        for (const name of ["catalogue", "summary", "analysis", "pipeline", "winLoss", "attainment"])
            found[name].errors.length == 0
        found.catalogue.output.includes("Pipeline analysis")
        found.summary.output.includes("Orders by placed date")
        found.analysis.output.includes("Net invoiced")
        found.pipeline.output.includes("Time in each stage")
        found.winLoss.output.includes("Win rate")
        csvRows(found.pipelineCsv.output, "Opportunity,Stage,Owner") == found.pipelineCount
        csvRows(found.winLossCsv.output, "Opportunity,Outcome,Closed") == found.winLossCount
    }
})

feature("Accounting's Sales analysis shows its finance columns over the same rows as Sales'", {
    when() {
        const options = {
            organizationPartyId: ids.organizationId,
            fromDate: "2000-01-01",
            thruDate: "2100-01-01",
            groupBy: "customer"
        }
        return {
            sales: page("Reports/SalesAnalysis", options, "csv"),
            accounting: page("Reports/SalesAnalysis", options, "csv", "Accounting"),
            rows: system(() => invoke("mantle.sales.SalesReportServices.run#SalesAnalysis", options)).analysisRows.length
        }
    },
    then({sales, accounting, rows}) {
        sales.errors.length == 0
        accounting.errors.length == 0
        csvRows(sales.output) == rows
        csvRows(accounting.output) == rows
        accounting.output.includes("Cost of shipped")
    }
})

feature("a manager subscribes to the weekly pipeline digest and copies the stalled-deal alert, which fires on a stalled deal", {
    when() {
        const subscribed = insights(
            users.manager,
            "ScheduledReports/Schedules/createSchedule",
            {
                newDefinitionId: "boss-sales-weekly-digest",
                cronSelected: "0 0 6 ? * MON",
                renderMode: "csv",
                audienceKind: "personal"
            },
            "post"
        )
        const schedules = system(() =>
            Array.from(ec.entity.find("moqui.screen.ScreenScheduled").condition("reportOwnerId", managerId).list())
        ).length
        const copied = insights(
            users.manager,
            "Alerts/Rules/copyAlert",
            {sourceDefinitionId: "boss-sales-stalled-deals", title},
            "post"
        )
        shared.ruleId = system(() =>
            ec.entity.find("moqui.report.Definition").condition({title, ownerId: managerId}).one()
        )?.definitionId
        const activated = insights(
            users.manager,
            "Alerts/AlertDetail/pauseAlert",
            {definitionId: shared.ruleId, paused: "false"},
            "post"
        )
        // the rep's open Wingtip refit has sat in its stage for 30 days; the pipeline's index is refreshed so the dataset reads it
        system(() => {
            const deal = ec.entity
                .find("mantle.sales.opportunity.SalesOpportunity")
                .condition("salesOpportunityId", ids.deals.wingtip)
                .one()
            shared.stalled = {salesOpportunityId: deal.salesOpportunityId, stageEnteredDate: deal.stageEnteredDate}
            deal.set("stageEnteredDate", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).update()
            // the stage-age dataset reads the pipeline dataset's index (the same document): its registered refresh
            invoke("ironstone.insights.DatasetServices.refresh#DatasetIndex", {
                refreshKey: "insights.dataset.mantle-sales-pipeline.index"
            })
        })
        system(() => invoke(R + "evaluate#Alerts", {}))
        const state = asUser(users.manager, () => invoke(R + "get#AlertState", {definitionId: shared.ruleId}))
        // each series' state (get#AlertState's instances)
        return {subscribed, schedules, copied, activated, states: Array.from(state.instances || []).map(row => String(row.state))}
    },
    then({subscribed, schedules, copied, activated, states}) {
        subscribed.errors == ""
        schedules == 1
        copied.errors == ""
        shared.ruleId != null
        activated.errors == ""
        states.includes("Firing")
    }
})
