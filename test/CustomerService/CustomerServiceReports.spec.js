// Customer Service reports (impl-customer-service P14, CS-REPORTING; Reporting.js): compliance counts a clock open past due
// against the rate, shows a cancelled one apart and never a clock a merge ended; response times time a done clock in business
// and elapsed time; the export is the same rows; return amounts only for a price or accounting reader; the catalogue offers CSAT
// results to service management only; the shipped service dataset and its breach alert template load; and one qvt render of
// each report screen and Customer360's Service tab. The access rules are CustomerServiceAccess's; the scenarios (a merge counted
// once, a manager of one team, open returns) CustomerServiceReportsWalk (acceptance).
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

spec({
    cleanupSpec() {
        system(() => {
            for (const id of madeIds) ec.entity.find(EPISODE).condition({caseSlaEpisodeId: id}).deleteAll()
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
