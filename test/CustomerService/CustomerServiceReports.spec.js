// Customer Service reports (impl-customer-service P14, CS-REPORTING; Reporting.js): compliance counts a clock open past due
// against the rate, shows a cancelled one apart and never a clock a merge ended; response times time a done clock in business
// and elapsed time, and a small case by hand (a weekend and a pause on a spec calendar: median and p90); the export is the same
// rows; return amounts only for a price or accounting reader; the catalogue offers CSAT results to service management only; the
// shipped service dataset and its breach alert template load; and one qvt render of each report screen and Customer360's
// Service tab. The access rules are CustomerServiceAccess's; the scenarios (a merge counted once, a manager of one team, open
// returns) CustomerServiceReportsWalk (acceptance).
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceReports
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const R = "ironstone.customerservice.ReportingServices."
const EPISODE = "mantle.request.support.CaseSlaEpisode"
const madeIds = []
// a clock on Joe's thermostat case (the Support queue), started an hour or more ago, around the clock
function clock(id, fields) {
    system(() => {
        const nowMs = Number(entityLib.ms(ec.user.nowTimestamp))
        const at = offsetMs => new Date(nowMs - offsetMs)
        const fieldMap = Object.assign(
            {
                caseSlaEpisodeId: id,
                requestId: ids.thermostatCaseId,
                clockEnumId: "SlcFirstResponse",
                sequenceNum: 9,
                organizationPartyId: ids.organizationId,
                priorityBandEnumId: "CpbHigh",
                targetMinutes: 30,
                startDate: at(3 * 3600000),
                dueDate: at(2.5 * 3600000),
                pausedMinutes: 0
            },
            fields(at)
        )
        ec.service
            .sync()
            .name("create#" + EPISODE)
            .parameters(fieldMap)
            .call()
        madeIds.push(id)
    })
}
const compliance = (user, extra = {}) =>
    asUser(
        user,
        () => invoke(R + "get#SlaCompliance", Object.assign({appRoot: "CustomerService", groupBy: "queue"}, extra)).answer
    )

// a spec calendar: Monday to Friday 9:00-17:00 in Chicago from Monday 5 Jan 2026 (its series, as store#WorkingHours makes it)
const calendarId = "BOSS_CS_SPEC_RPT_CAL",
    hoursId = "BOSS_CS_SPEC_RPT_HOURS"
const chicago = text => new Date(Date.parse(text + "-05:00"))
function calendar() {
    system(() => {
        const create = (entity, fields) =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(fields)
                .call()
        create("mantle.work.calendar.Calendar", {
            calendarId,
            calendarName: "Reports spec hours",
            calendarKindEnumId: "CalkResource",
            ownerPartyId: ids.organizationId,
            timeZone: "America/Chicago",
            isDefault: "N"
        })
        create("mantle.work.effort.WorkEffort", {
            workEffortId: hoursId,
            workEffortTypeEnumId: "WetAvailable",
            workEffortName: "Working hours",
            statusId: "WeApproved",
            ownerPartyId: ids.organizationId,
            estimatedStartDate: new Date(Date.parse("2026-01-05T09:00:00-06:00")),
            estimatedCompletionDate: new Date(Date.parse("2026-01-05T17:00:00-06:00")),
            estimatedWorkDuration: 8,
            timeUomId: "TF_hr",
            sourceReferenceId: "WorkingHours",
            visibilityEnumId: "WevRestricted"
        })
        create("mantle.work.calendar.CalendarWorkEffort", {calendarId, workEffortId: hoursId})
        create("mantle.work.effort.WorkEffortRecurrence", {
            workEffortId: hoursId,
            rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
            timeZone: "America/Chicago"
        })
    })
}

spec({
    cleanupSpec() {
        system(() => {
            for (const id of madeIds) ec.entity.find(EPISODE).condition({caseSlaEpisodeId: id}).deleteAll()
            for (const [entity, conditions] of [
                ["mantle.work.effort.WorkEffortRecurrence", {workEffortId: hoursId}],
                ["mantle.work.calendar.CalendarWorkEffort", {calendarId}],
                ["mantle.work.effort.WorkEffort", {workEffortId: hoursId}],
                ["mantle.work.calendar.Calendar", {calendarId}]
            ])
                ec.entity.find(entity).condition(conditions).deleteAll()
        })
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("compliance, response times, the export, return amounts, the catalogue and the shipped dataset", {
    when() {
        const before = compliance(users.manager)
        const timesBefore = asUser(users.manager, () => invoke(R + "get#ResponseTimes", {appRoot: "CustomerService"}).answer)
        clock("BOSS_CS_SPEC_RPT_MERGED", () => ({stateEnumId: "SlsMerged"}))
        clock("BOSS_CS_SPEC_RPT_CANCELLED", () => ({stateEnumId: "SlsCancelled"}))
        clock("BOSS_CS_SPEC_RPT_OPEN", () => ({stateEnumId: "SlsRunning", clockEnumId: "SlcResolution"}))
        clock("BOSS_CS_SPEC_RPT_MET", at => ({stateEnumId: "SlsMet", actualDate: at(3600000)}))
        const after = compliance(users.manager)
        const exported = asUser(
            users.manager,
            () => invoke(R + "get#SlaCompliance", {appRoot: "CustomerService", groupBy: "queue", output: "csv"}).answer
        )
        const times = asUser(users.manager, () => invoke(R + "get#ResponseTimes", {appRoot: "CustomerService"}).answer)
        const managerReturns = asUser(users.manager, () => invoke(R + "get#ReturnAnalysis", {appRoot: "CustomerService"}).answer)
        const authorizerReturns = asUser(
            users.returns,
            () => invoke(R + "get#ReturnAnalysis", {appRoot: "CustomerService"}).answer
        )
        const managerReports = asUser(
            users.manager,
            () => invoke(R + "get#ReportCatalogue", {appRoot: "CustomerService"}).reports
        )
        const agentReports = asUser(users.agent, () => invoke(R + "get#ReportCatalogue", {appRoot: "CustomerService"}).reports)
        // F112: the views by clock and Home's counts read the cases with their clocks in one query
        const C = "ironstone.customerservice.CaseServices."
        const risk = asUser(users.manager, () =>
            invoke(C + "find#Cases", {appRoot: "CustomerService", view: "slaRisk", pageSize: 100})
        )
        const awaiting = asUser(users.manager, () =>
            invoke(C + "find#Cases", {appRoot: "CustomerService", view: "needsResponse", pageSize: 100})
        )
        const counts = asUser(users.manager, () => invoke(C + "get#QueueCounts", {appRoot: "CustomerService"}))
        const definitions = ["boss-service-clocks", "boss-service-breaches", "boss-service-sla-breach"].map(
            definitionId => invoke("org.moqui.report.ReportServices.get#Definition", {definitionId}).definition
        )
        return {
            before,
            after,
            exported,
            timesBefore,
            times,
            managerReturns,
            authorizerReturns,
            managerReports,
            agentReports,
            definitions,
            risk,
            awaiting,
            counts
        }
    },
    then({
        before,
        after,
        exported,
        timesBefore,
        times,
        managerReturns,
        authorizerReturns,
        managerReports,
        agentReports,
        definitions,
        risk,
        awaiting,
        counts
    }) {
        risk.cases.filter(row => row.requestId == ids.thermostatCaseId).length == 1
        risk.casesCount == risk.cases.length
        awaiting.cases.some(row => row.requestId == ids.filtersCaseId)
        counts.queueRows.find(row => row.requestCategoryId == ids.supportQueueId).breachedCount >= 1
        // the manager of the Support team reads its queue only
        after.groupRows.every(row => row.groupKey == ids.supportQueueId)
        // the merged clock is never counted, the cancelled one apart, the open one past due against the rate, the met one met
        after.total.eligibleCount == before.total.eligibleCount + 2
        after.total.cancelledCount == before.total.cancelledCount + 1
        after.total.openPastDueCount == before.total.openPastDueCount + 1
        after.total.metCount == before.total.metCount + 1
        after.total.denominator ==
            after.total.metCount + after.total.missedCount + after.total.unmetCount + after.total.openPastDueCount
        // the export is the same rows, with its frame
        exported.csvText.includes("Service level compliance")
        exported.csvText.includes("As of")
        exported.groupRows.every(row => exported.csvText.includes(row.groupText + "," + row.eligibleCount + ","))
        exported.fileName.startsWith("ServiceLevelCompliance-")
        // the met first response timed: two hours elapsed and, around the clock, in business time
        times.total.count == timesBefore.total.count + 1
        times.total.businessMedianText != ""
        times.total.elapsedMedianText != ""
        // amounts for a price reader, withheld from the return authorizer; an open return counts as requested
        managerReturns.amountsWithheld == false
        authorizerReturns.amountsWithheld == true
        authorizerReturns.amountRows.every(row => row.requestedText == "Withheld")
        managerReturns.total.openReturnCount >= 0
        managerReports.some(row => row.entryId == "CustomerService.SatisfactionResults")
        !agentReports.some(row => row.entryId == "CustomerService.SatisfactionResults")
        agentReports.some(row => row.entryId == "CustomerService.ReturnAnalysis")
        definitions.every(definition => definition.readOnly == true && definition.component == "mr-boss")
        definitions[2].type == "alert"
    }
})

feature("response times by hand: median and p90 in business time (the clock's calendar less its pauses) and elapsed time", {
    when() {
        calendar()
        const band = {priorityBandEnumId: "BOSS_CS_SPEC_RPT_BAND", calendarId, timeZone: "America/Chicago"}
        const timed = (id, stateEnumId, start, actual, pausedMinutes = 0) =>
            clock(id, () =>
                Object.assign({}, band, {
                    stateEnumId,
                    startDate: chicago(start),
                    dueDate: chicago(start),
                    actualDate: chicago(actual),
                    pausedMinutes
                })
            )
        // Friday 16:00 to Monday 10:00: an hour each day, 120 business minutes; 66 hours elapsed
        timed("BOSS_CS_SPEC_RPT_T1", "SlsMet", "2026-10-02T16:00:00", "2026-10-05T10:00:00")
        // Wednesday 9:00 to 17:00 with an hour paused: 420; 480 elapsed
        timed("BOSS_CS_SPEC_RPT_T2", "SlsMissed", "2026-10-07T09:00:00", "2026-10-07T17:00:00", 60)
        // Thursday 12:00 to 12:30: 30 either way
        timed("BOSS_CS_SPEC_RPT_T3", "SlsMet", "2026-10-08T12:00:00", "2026-10-08T12:30:00")
        // a clock a merge ended is never timed
        timed("BOSS_CS_SPEC_RPT_T4", "SlsMerged", "2026-10-06T09:00:00", "2026-10-06T09:05:00")
        return asUser(
            users.manager,
            () =>
                invoke(R + "get#ResponseTimes", {
                    appRoot: "CustomerService",
                    bandEnumId: band.priorityBandEnumId,
                    fromDate: "2026-10-01",
                    thruDate: "2026-10-09",
                    groupBy: "none"
                }).answer.total
        )
    },
    then(total) {
        total.count == 3
        // business [30, 120, 420]: the nearest-rank median 120, p90 420, mean 190
        total.businessMedianMinutes == 120
        total.businessP90Minutes == 420
        total.businessMeanMinutes == 190
        total.businessMeanText == "3 h 10 min"
        // elapsed [30, 480, 3960]
        total.elapsedMedianMinutes == 480
        total.elapsedP90Minutes == 3960
        total.elapsedP90Text == "2 d 18 h"
        total.openCount == 0
    }
})

feature("ReportsHome, the four reports and Customer360's Service tab render (qvt)", {
    when() {
        const pages = asUser(users.manager, () =>
            Object.fromEntries(
                [
                    "Reports/ReportsHome",
                    "Reports/ServiceLevelCompliance",
                    "Reports/ResponseTimes",
                    "Reports/CaseVolumes",
                    "Reports/ReturnAnalysis"
                ].map(path => [path, lib.page(path, {})])
            )
        )
        const service = asUser(users.admin, () =>
            lib.page("Customers/Customer360/ServiceStatistics", {customerPartyId: ids.customerId, lastStandalone: "true"})
        )
        return {pages, service}
    },
    then({pages, service}) {
        Object.values(pages).every(page => page.errors.length == 0)
        pages["Reports/ReportsHome"].output.includes("Service level compliance")
        pages["Reports/ReportsHome"].output.includes("CSAT results")
        pages["Reports/ServiceLevelCompliance"].output.includes("Open past due")
        pages["Reports/ResponseTimes"].output.includes("p90 (business)")
        pages["Reports/CaseVolumes"].output.includes("Open at the as-of time")
        pages["Reports/ReturnAnalysis"].output.includes("Amounts per currency")
        service.errors.length == 0
        service.output.includes("Service agreements")
        service.output.includes("Failed service levels")
        service.output.includes("New agreement")
    }
})
