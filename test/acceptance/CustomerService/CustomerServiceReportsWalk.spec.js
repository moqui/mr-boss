// Customer Service P14's "usable when" (impl-customer-service P14, CS-REPORTING), as an acceptance walk with artifact
// authorization on: compliance leaves a cancelled case's clocks out of the rate and shows them apart, keeps an open case past
// due in it, and never counts the clocks a merge ended, while the kept case carries the source's; a merged case's intake stays
// in the volumes and it is not counted again in the backlog; response times give median and p90 in business and elapsed time
// with their counts; return analysis shows its amounts per currency and an open return as requested; a manager of the Support
// team sees only its queues where the administrator sees Privacy's too, and the export has the same rows. The rules are
// CustomerServiceReports' (regression).
// Run: ./moq accept mr-boss --spec CustomerServiceReportsWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const S = "mantle.request.SupportCaseServices."
const R = "ironstone.customerservice.ReportingServices."
const state = {names: 0}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
function newCase(subject) {
    const requestName = subject + " " + Date.now().toString(36) + "-" + ++state.names
    post(users.agent, "Cases/NewCase/createCase", {
        organizationPartyId: ids.organizationId,
        customerPartyId: ids.customerId,
        requestTypeEnumId: "RqtSupport",
        requestCategoryId: ids.supportQueueId,
        requestName,
        priority: "5"
    })
    return one("mantle.request.Request", {requestName})?.requestId
}
const report = (user, service, parameters = {}) =>
    asUser(user, () => invoke(R + service, Object.assign({appRoot: "CustomerService"}, parameters)).answer)
const firstClock = requestId =>
    rows("mantle.request.support.CaseSlaEpisode", {requestId, clockEnumId: "SlcFirstResponse"}).find(
        row => !row.carriedFromEpisodeId
    )

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("compliance and volumes: a cancelled case apart, an open one past due counted, a merged one counted once", {
    when() {
        const slaBefore = report(users.manager, "get#SlaCompliance")
        const volumesBefore = report(users.manager, "get#CaseVolumes")
        const kept = newCase("Reports walk kept")
        const source = newCase("Reports walk duplicate")
        const cancelled = newCase("Reports walk cancelled")
        // the kept case's and the source's first responses came due an hour ago: open past due
        system(() => {
            for (const requestId of [kept, source]) {
                const clock = firstClock(requestId)
                clock.set("dueDate", new Date(Date.now() - 3600000))
                clock.update()
            }
        })
        const cancel = post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId: cancelled,
            toStatusId: "ReqCancelled",
            resolutionEnumId: "RrWontFix",
            reason: "Reports walk"
        })
        const preview = asUser(
            users.manager,
            () => invoke(S + "preview#MergeCases", {targetRequestId: kept, sourceRequestIds: [source]}),
            false
        ).preview
        const merged = post(users.manager, "Cases/MergeCases/mergeCases", {
            targetRequestId: kept,
            sourceIdsText: source,
            reason: "The same question",
            operationKey: "walk-reports-merge-" + Date.now(),
            caseRevisions: preview.caseRevisions
        })
        const clocks = Object.fromEntries(
            [kept, source, cancelled].map(requestId => [requestId, rows("mantle.request.support.CaseSlaEpisode", {requestId})])
        )
        return {
            slaBefore,
            volumesBefore,
            cancel,
            merged,
            clocks,
            kept,
            source,
            cancelled,
            slaAfter: report(users.manager, "get#SlaCompliance"),
            volumesAfter: report(users.manager, "get#CaseVolumes")
        }
    },
    then(r) {
        r.cancel.errors == ""
        r.merged.errors == ""
        r.clocks[r.source].every(row => row.stateEnumId == "SlsMerged")
        r.clocks[r.cancelled].every(row => row.stateEnumId == "SlsCancelled")
        // counted: the kept case's two clocks and the two it carried from the source; never the source's own (merged)
        r.slaAfter.total.eligibleCount ==
            r.slaBefore.total.eligibleCount + 2 + r.clocks[r.kept].filter(row => row.carriedFromEpisodeId).length
        r.slaAfter.total.cancelledCount == r.slaBefore.total.cancelledCount + r.clocks[r.cancelled].length
        // the kept case's first response and the one carried from the source are open past due, in the rate
        r.slaAfter.total.openPastDueCount >= r.slaBefore.total.openPastDueCount + 2
        r.slaAfter.total.denominator ==
            r.slaAfter.total.metCount +
                r.slaAfter.total.missedCount +
                r.slaAfter.total.unmetCount +
                r.slaAfter.total.openPastDueCount
        // volumes: three received (the merged one's intake kept), one merged and one cancelled apart, the backlog once
        r.volumesAfter.total.receivedCount == r.volumesBefore.total.receivedCount + 3
        r.volumesAfter.total.mergedCount == r.volumesBefore.total.mergedCount + 1
        r.volumesAfter.total.cancelledCount == r.volumesBefore.total.cancelledCount + 1
        r.volumesAfter.total.backlogCount == r.volumesBefore.total.backlogCount + 1
    }
})

feature("response times give median and p90 in business and elapsed time with their counts", {
    when() {
        const before = report(users.manager, "get#ResponseTimes", {metric: "resolution"})
        const requestId = newCase("Reports walk resolved")
        const resolved = post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId,
            toStatusId: "ReqCompleted",
            resolutionEnumId: "RrCompleted"
        })
        const after = report(users.manager, "get#ResponseTimes", {metric: "resolution", groupBy: "queue"})
        const page = asUser(users.manager, () => lib.page("Reports/ResponseTimes", {metric: "resolution"}))
        return {before, resolved, after, page}
    },
    then({before, resolved, after, page}) {
        resolved.errors == ""
        after.total.count == before.total.count + 1
        after.total.businessMedianText != ""
        after.total.businessP90Text != ""
        after.total.elapsedMedianText != ""
        after.total.elapsedP90Text != ""
        after.groupRows.every(row => row.count >= 0)
        page.errors == []
        page.output.includes("Median (business)")
        page.output.includes("Median (elapsed)")
    }
})

feature("return analysis: amounts per currency, an open return counted as requested", {
    when() {
        const fromDate = ec.l10n.format(new Date(Date.now() - 700 * 86400000), "yyyy-MM-dd")
        const answer = report(users.manager, "get#ReturnAnalysis", {fromDate, groupBy: "reason"})
        const open = one("mantle.order.return.ReturnHeader", {returnId: ids.warehouseReturnId})
        return {answer, open}
    },
    then({answer, open}) {
        !["ReturnCompleted", "ReturnCancelled"].includes(open.statusId)
        answer.total.openReturnCount >= 1
        answer.total.returnCount >= answer.total.openReturnCount
        answer.amountsWithheld == false
        answer.amountRows.length >= 1
        answer.amountRows.every(row => !!row.currencyUomId && row.requestedText != "Withheld")
        // an open return is requested, not credited: the open returns' amount is part of the requested amount
        answer.amountRows.every(row => Number(row.openAmount) <= Number(row.requestedAmount))
    }
})

feature("a manager of the Support team sees only its queues, the administrator Privacy's too; the export has the same rows", {
    when() {
        const managerRows = report(users.manager, "get#CaseVolumes", {groupBy: "queue"})
        const managerCsv = report(users.manager, "get#CaseVolumes", {groupBy: "queue", output: "csv"})
        const adminRows = report(users.admin, "get#CaseVolumes", {groupBy: "queue"})
        // the Support team's queues: the demo's Support queue and those a walk before this one adds (AssignmentWalk's)
        const teamQueues = rows("mantle.request.support.ServiceQueue", {responsibleTeamPartyId: ids.supportTeamId}).map(
            row => row.requestCategoryId
        )
        return {managerRows, managerCsv, adminRows, teamQueues}
    },
    then({managerRows, managerCsv, adminRows, teamQueues}) {
        managerRows.groupRows.some(row => row.groupKey == ids.supportQueueId)
        managerRows.groupRows.every(row => teamQueues.includes(row.groupKey))
        !managerRows.groupRows.some(row => row.groupKey == ids.privacyQueueId)
        adminRows.groupRows.some(row => row.groupKey == ids.privacyQueueId)
        // the export: the same group rows and the total, after its frame
        managerCsv.csvText.split("\r\n").filter(line => managerRows.groupRows.some(row => line.startsWith(row.groupText + ",")))
            .length == managerRows.groupRows.length
        managerCsv.csvText.includes("All," + managerRows.total.receivedCount + ",")
    }
})
