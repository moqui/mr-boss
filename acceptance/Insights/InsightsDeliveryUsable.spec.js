// Insights P7's "usable when" (impl-insights P7; design-insights §7.1, §7.3 and §13.3 "Owner equivalence", "Independent retry",
// "Lifecycle during rendering" and "Legacy schedule boundary"; impl-admin's Offboarding, its schedules half), server side through
// the screens on the demo data, with artifact authorization on: a distributor of Ziziwork Retail schedules the shipped weekly
// digest to two Retail colleagues, each of whom gets a message of their own, and the ORG_ZIZI_SERVICES reader is refused with the
// reason; one failed delivery is retried alone; disabling the distributor in Admin pauses the schedule, which waits in
// LifecycleDetail for a new owner, is refused to one who may not deliver to a group, and is delivered again only once a second
// distributor has taken it and resumed it; and john.doe's copied scheduled find is still his own, personal, with no group. The
// distributor who leaves and the one who takes over are made here, so the demo's insights.distributor is left as it is. The
// screens of Scheduled reports are the framework's Dashboards screens, mounted by location (mr-moqui
// plans/archive/Admin-Screens-Down.md, Track I), so every step is a transition of theirs through Insights' route. The
// rules are the framework's ReportAudience and the regression InsightsDelivery; Mantle's sales datasets, which the suite
// dashboard of the digest reads, are admitted by InsightsDatasetsUsable first. Written with P7, not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsDeliveryUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const adminLib = ec.resource.script("component://mr-boss/test/Admin/AdminSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const R = "org.moqui.report.ReportServices."
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const run = String(Date.now()).slice(-7)
const P = "INS_DLV_USABLE_"
const leaver = {userId: P + "LEAVER" + run, username: "insights.leaver" + run}
const successor = {userId: P + "NEXT" + run, username: "insights.successor" + run}
const digestId = "insights-weekly-digest"
const people = {reader: "BOSS_INS_READER", author: "BOSS_INS_AUTHOR", services: "BOSS_INS_SERVICES"}
let scheduleId
let occurrenceId
let operationId

const one = (entityName, conditions) => system(() => ec.entity.find(entityName).condition(conditions).useCache(false).one())
const list = (entityName, conditions) =>
    system(() => Array.from(ec.entity.find(entityName).condition(conditions).useCache(false).list()))
const make = (entityName, fields) => {
    const row = ec.entity.makeValue(entityName)
    row.setFields(fields, true, null, null)
    row.create()
}
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
const addresses = () =>
    Array.from(capture.getMessages())
        .map(message => Array.from(message.toList).join("+"))
        .sort()
        .join(",")
const schedulesOf = userId => list("moqui.screen.ScreenScheduled", {reportOwnerId: userId})
// a distributor of Ziziwork Retail: an agent of the organization in the Insights root and distributor groups, with an address
function distributor(person, lastName) {
    make("mantle.party.Party", {partyId: person.userId, partyTypeEnumId: "PtyPerson"})
    make("mantle.party.Person", {partyId: person.userId, firstName: "Insights", lastName})
    make("mantle.party.PartyRelationship", {
        partyRelationshipId: person.userId,
        relationshipTypeEnumId: "PrtAgent",
        fromPartyId: person.userId,
        toPartyId: ids.organizationId,
        toRoleTypeId: "OrgInternal",
        fromDate: new Date(0)
    })
    make("moqui.security.UserAccount", {
        userId: person.userId,
        username: person.username,
        userFullName: "Insights " + lastName,
        partyId: person.userId,
        emailAddress: person.username + "@ziziwork.example",
        // the demo users' password, so the walk signs in as them
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA",
        locale: "en_US",
        disabled: "N"
    })
    for (const userGroupId of ["BOSS_USERS", "BOSS_INSIGHTS", "BOSS_INSIGHTS_DISTRIBUTE"])
        make("moqui.security.UserGroupMember", {userGroupId, userId: person.userId, fromDate: new Date(0)})
}
function removeSpecData() {
    system(() => {
        for (const person of [leaver, successor]) {
            for (const schedule of ec.entity
                .find("moqui.screen.ScreenScheduled")
                .condition("reportOwnerId", person.userId)
                .list()) {
                const screenScheduledId = schedule.screenScheduledId
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
                schedule.delete()
            }
        }
    })
}

spec({
    stepwise: true,
    // the sales datasets admitted by the steward (P3's "usable when"), which the digest's suite dashboard reads
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
        capture.enable()
        system(() => {
            distributor(leaver, "Leaver")
            distributor(successor, "Successor")
            // a server the report template can send through (captured, never connected)
            if (
                !ec.entity
                    .find("moqui.basic.email.EmailServer")
                    .condition("emailServerId", P + "MAIL")
                    .one()
            )
                make("moqui.basic.email.EmailServer", {emailServerId: P + "MAIL", smtpHost: "127.0.0.1", smtpPort: "25"})
            const template = ec.entity
                .find("moqui.basic.email.EmailTemplate")
                .condition("emailTemplateId", "BOSS_INSIGHTS_REPORT")
                .one()
            template.emailServerId = P + "MAIL"
            template.fromAddress = "insights@ziziwork.example"
            template.update()
        })
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
        ec.artifactExecution.enableAuthz()
    }
})

feature("a distributor schedules the weekly digest to two Retail colleagues; the Services reader is refused with the reason", {
    when() {
        const form = recipients => ({
            newDefinitionId: digestId,
            cronSelected: "0 0 6 ? * MON",
            renderMode: "csv",
            audienceKind: "group",
            recipientUserIds: recipients.join(",")
        })
        // the Services reader among the recipients: nothing is saved, and the answer names them and why
        const refusedPost = insights(
            leaver.username,
            "ScheduledReports/Schedules/createSchedule",
            form([people.reader, people.services]),
            "post"
        )
        const afterRefusal = schedulesOf(leaver.userId).length
        const saved = insights(
            leaver.username,
            "ScheduledReports/Schedules/createSchedule",
            form([people.reader, people.author]),
            "post"
        )
        const schedule = schedulesOf(leaver.userId)[0]
        scheduleId = schedule ? String(schedule.screenScheduledId) : null
        // the page of the schedule: each recipient's result beside their name, no other's content
        const detail = insights(leaver.username, "ScheduledReports/ScheduledReportDetail", {screenScheduledId: scheduleId})
        // a reader of Retail schedules it for themselves, and is not offered other people
        const personal = insights(
            users.reader,
            "ScheduledReports/Schedules/createSchedule",
            {newDefinitionId: digestId, cronSelected: "0 0 6 ? * MON", renderMode: "csv", audienceKind: "personal"},
            "post"
        )
        const readerList = insights(users.reader, "ScheduledReports/Schedules", {view: "mine"})
        return {
            refusedPost,
            afterRefusal,
            saved,
            mode: schedule?.deliveryMode,
            recipients: list("moqui.report.ReportScheduleRecipient", {screenScheduledId: scheduleId})
                .map(row => row.recipientId)
                .sort()
                .join(","),
            detail,
            personal,
            readerOwn: schedulesOf(people.reader).filter(
                row => row.reportDefinitionId == digestId && row.deliveryMode == "personal"
            ).length,
            readerList
        }
    },
    then({refusedPost, afterRefusal, saved, mode, recipients, detail, personal, readerOwn, readerList}) {
        refusedPost.errors.includes("Insights Services reader (scope-differs)")
        afterRefusal == 0
        saved.errors == ""
        mode == "group"
        recipients == [people.author, people.reader].sort().join(",")
        detail.status == 200 && detail.errors == ""
        detail.output.includes("Weekly management digest")
        detail.output.includes("Insights Reader") && detail.output.includes("Insights Author")
        detail.output.includes("May receive it")
        personal.errors == ""
        readerOwn >= 1
        readerList.errors == ""
        readerList.output.includes("Weekly management digest")
        !readerList.output.includes("People and groups")
    }
})

feature("each recipient gets a message of their own and reads their own delivery; one failed delivery is retried alone", {
    when() {
        capture.clear()
        const sent = insights(
            leaver.username,
            "ScheduledReports/ScheduledReportDetail/sendNow",
            {screenScheduledId: scheduleId},
            "post"
        )
        const first = addresses()
        const messages = Array.from(capture.getMessages())
        const occurrence = one("moqui.report.ReportOccurrence", {screenScheduledId: scheduleId})
        occurrenceId = occurrence ? String(occurrence.occurrenceId) : null
        const delivery = userId => one("moqui.report.ReportRecipientDelivery", {occurrenceId, userId})
        // the reader's own delivery and report; the owner's page of every recipient's outcome
        const readerPage = insights(users.reader, "ScheduledReports/ReportDelivery", {occurrenceId})
        const readerFile = insights(
            users.reader,
            "ScheduledReports/ReportDelivery/ownReportFile",
            {occurrenceId, deliveryId: String(delivery(people.reader)?.deliveryId)},
            null
        )
        const authorsFile = insights(
            users.reader,
            "ScheduledReports/ReportDelivery/ownReportFile",
            {occurrenceId, deliveryId: String(delivery(people.author)?.deliveryId)},
            null
        )
        const servicesPage = insights(users.services, "ScheduledReports/ReportDelivery", {occurrenceId})
        // the transport's answer this walk cannot make: the reader's message failed
        system(() => {
            const failed = ec.entity
                .find("moqui.report.ReportRecipientDelivery")
                .condition({occurrenceId, userId: people.reader})
                .one()
            failed.statusId = "RptDlvFailed"
            failed.reasonCode = "transport-failure"
            failed.update()
        })
        const ownerPage = insights(leaver.username, "ScheduledReports/ReportDelivery", {occurrenceId})
        capture.clear()
        const retried = insights(
            leaver.username,
            "ScheduledReports/ReportDelivery/retryRecipients",
            {
                occurrenceId,
                // both chosen: only the failed one is sent again
                deliveryIds: [delivery(people.reader), delivery(people.author)].map(row => String(row.deliveryId)).join(","),
                expectedRevision: Number(one("moqui.report.ReportOccurrence", {occurrenceId}).versionNumber),
                reason: "Mailbox was full"
            },
            "post"
        )
        return {
            sent,
            first,
            shared: messages.filter(
                message =>
                    Array.from(message.toList).length !== 1 ||
                    Array.from(message.ccList).length ||
                    Array.from(message.bccList).length
            ).length,
            counts: [occurrence?.sentCount, occurrence?.skippedCount, occurrence?.renderCount].join(","),
            readerPage,
            readerFile,
            authorsFile,
            servicesPage,
            ownerPage,
            retried,
            second: addresses(),
            readerState: String(delivery(people.reader).statusId),
            readerAttempts: Number(delivery(people.reader).attemptCount),
            authorAttempts: Number(delivery(people.author).attemptCount)
        }
    },
    then({
        sent,
        first,
        shared,
        counts,
        readerPage,
        readerFile,
        authorsFile,
        servicesPage,
        ownerPage,
        retried,
        second,
        readerState,
        readerAttempts,
        authorAttempts
    }) {
        sent.errors == ""
        first == "insights.author@ziziwork.example,insights.reader@ziziwork.example"
        shared == 0
        // two sent, nobody skipped, one render for the two (one locale)
        counts == "2,0,1"
        readerPage.errors == ""
        readerPage.output.includes("Your delivery")
        !readerPage.output.includes("Insights Author")
        readerFile.output.includes("Download")
        !authorsFile.output.includes("Download")
        servicesPage.output.includes("Delivery not available")
        ownerPage.errors == ""
        ownerPage.output.includes("Insights Reader") && ownerPage.output.includes("Failed") && ownerPage.output.includes("Retry")
        retried.errors == ""
        second == "insights.reader@ziziwork.example"
        readerState == "RptDlvSent"
        readerAttempts == 2
        authorAttempts == 1
    }
})

feature("disabling the distributor in Admin pauses the schedule until a second distributor takes it and resumes it", {
    when() {
        // Admin's lifecycle: the participant pauses what the user owns and leaves each schedule waiting for a new owner
        const disabled = asUser(adminLib.users.admin, () =>
            adminLib.page(
                "Users/UserDetail/startLifecycle",
                {userId: leaver.userId, kind: "disable", reason: "Left", operationKey: P + "DISABLE" + run},
                "html"
            )
        )
        operationId = one("mantle.party.UserLifecycleOperation", {operationKey: P + "DISABLE" + run})?.operationId
        const atDisable = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId})
        // the schedule's next occurrence while its owner is gone: nothing is sent
        system(() => {
            const lock = ec.entity.find("moqui.screen.ScreenScheduledLock").condition("screenScheduledId", scheduleId).one()
            lock.lastRunTime = null
            lock.update()
        })
        capture.clear()
        const due = system(() =>
            ec.service
                .sync()
                .name(R + "run#ScheduledReport")
                .parameters({screenScheduledId: scheduleId})
                .call()
        )
        const whilePaused = capture.count()
        const lifecycle = asUser(adminLib.users.admin, () => adminLib.page("Users/LifecycleDetail", {operationId}, "html"))
        const step = list("mantle.party.UserLifecycleOperationStep", {operationId}).find(
            row => row.stepKind == "transfer" && String(row.actionService || "").endsWith("transfer#DefinitionOwner")
        )
        const transfer = toUserId =>
            asUser(adminLib.users.admin, () =>
                invoke("ironstone.admin.LifecycleServices.transfer#OwnedResource", {
                    appRoot: "Admin",
                    operationId,
                    stepSeqId: step?.stepSeqId,
                    toUserId,
                    reason: "Offboarding"
                })
            )
        // a reader schedules for themselves but may not deliver to a group: not a qualified owner
        const unqualified = transfer(people.reader)
        const accepted = transfer(successor.userId)
        const pending = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId})
        // the new owner: the schedule is theirs under Shared administration, paused; Send now is refused until they resume it
        const sendPaused = insights(
            successor.username,
            "ScheduledReports/ScheduledReportDetail/sendNow",
            {screenScheduledId: scheduleId},
            "post"
        )
        const resumed = insights(
            successor.username,
            "ScheduledReports/ScheduledReportDetail/pauseSchedule",
            {screenScheduledId: scheduleId, paused: "false"},
            "post"
        )
        const after = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId})
        capture.clear()
        const sentAgain = insights(
            successor.username,
            "ScheduledReports/ScheduledReportDetail/sendNow",
            {screenScheduledId: scheduleId},
            "post"
        )
        return {
            disabled,
            atDisable: [atDisable.paused, atDisable.pausedReason].join(","),
            due,
            whilePaused,
            lifecycle,
            unqualified,
            accepted,
            pending: [pending.reportOwnerId, pending.paused, pending.pausedReason].join(","),
            sendPaused,
            resumed,
            after: [after.reportOwnerId, after.paused, after.pausedReason || ""].join(","),
            sentAgain,
            delivered: addresses()
        }
    },
    then({
        disabled,
        atDisable,
        due,
        whilePaused,
        lifecycle,
        unqualified,
        accepted,
        pending,
        sendPaused,
        resumed,
        after,
        sentAgain,
        delivered
    }) {
        disabled.errors.length == 0 && operationId != null
        one("moqui.security.UserAccount", {userId: leaver.userId}).disabled == "Y"
        atDisable == "Y,owner-disabled"
        due.skipped == true
        whilePaused == 0
        lifecycle.errors.length == 0
        lifecycle.output.includes("Report schedules") && lifecycle.output.includes("Waiting for a new owner")
        unqualified.applied == false
        unqualified.reason.includes("may not deliver reports to other users")
        accepted.applied == true
        pending == successor.userId + ",Y,transfer-pending"
        sendPaused.errors.includes("until its new owner resumes it")
        resumed.errors == ""
        after == successor.userId + ",N,"
        sentAgain.errors == ""
        // the same two recipients, checked against the new owner's scope, each with their own message
        delivered == "insights.author@ziziwork.example,insights.reader@ziziwork.example"
    }
})

feature("a copied scheduled find stays its user's own: listed under Mine, personal, and nobody else's to open", {
    when() {
        // the demo's saved find of Commons Tasks, scheduled by john.doe before Insights replaced the copied screen
        const mine = insights(users.system, "ScheduledReports/Schedules", {view: "mine"})
        const detail = insights(users.system, "ScheduledReports/ScheduledReportDetail", {screenScheduledId: "BOSS_DEMO_MY_TASKS"})
        const others = insights(users.reader, "ScheduledReports/ScheduledReportDetail", {screenScheduledId: "BOSS_DEMO_MY_TASKS"})
        // a group cannot be put on it from Insights: a saved list's schedule is personal, and no report schedule's
        // recipients are saved on it
        const withGroup = insights(
            users.system,
            "ScheduledReports/ScheduledReportDetail/storeAudience",
            {screenScheduledId: "BOSS_DEMO_MY_TASKS", recipientGroupIds: "BOSS_USERS"},
            "post"
        )
        const row = one("moqui.screen.ScreenScheduled", {screenScheduledId: "BOSS_DEMO_MY_TASKS"})
        return {
            mine,
            detail,
            others,
            withGroup,
            row: [row.userId, row.userGroupId || "", row.screenPath, row.formListFindId].join(",")
        }
    },
    then({mine, detail, others, withGroup, row}) {
        mine.errors == "" && mine.output.includes("Open tasks")
        detail.errors == "" && detail.output.includes("Timing and output")
        !detail.output.includes("Change recipients")
        others.output.includes("Schedule not available")
        withGroup.errors.includes("schedule not found for this owner")
        // its row kept: the same screen and find, its user alone, no group
        row == "EX_JOHN_DOE,,/apps/Commons/Tasks,BOSS_DEMO_MY_TASKS"
    }
})
