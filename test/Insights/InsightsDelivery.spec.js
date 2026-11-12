// Insights' scheduled delivery and digests (impl-insights P7; design-insights §7.1, §7.3, ScheduledReports, ScheduledReportDetail,
// ReportDelivery, ManagementDigest). Scheduled reports' three screens are the framework's Dashboards screens, mounted by
// location with Insights' policy (mr-moqui plans/archive/Admin-Screens-Down.md, Track I), so the rules are held through Insights'
// route, by the transitions a browser posts: a reader schedules a report for themselves and not for others; a distributor's
// recipients are Insights' readers and groups of their own, checked by the report engine, so the Retail agents pass and the
// Services reader is refused with the reason; a schedule saved there carries Insights' message and the organization's
// recipient cap, past which it is refused; Tools' dashboards are not scheduled there and Tools' owner-mode form is not on
// the route, where Tools' own route takes both and accepts a recipient by the engine's rule alone. Send now gives each
// recipient a message of their own, linking to Insights, and each reads their own delivery and their own report, never
// another's, and its status export (P12) the same rows; ScheduledReportDetail renders once (qvt) with each recipient's
// result and no payload; a digest is composed by a distributor over dashboards they read; and Admin's lifecycle finds the
// distributor's schedule through Insights' participant and hands it only to an owner who qualifies, paused until the
// recipients pass the new owner's check. The engine's rules and what the screens read and write are the framework's
// ReportAudience; the admitted sales dataset and its orders are InsightsDatasets'. The "usable when" scenario is the
// acceptance InsightsDeliveryUsable.
// Run: ./moq test mr-boss --spec InsightsDelivery
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, transition} = lib
const R = "org.moqui.report.ReportServices."
const D = "ironstone.insights.DeliveryServices."
const boardId = "ins-dlv-orders"
const webroot = "component://webroot/screen/webroot.xml"
const insightsRoot = "component://mr-boss/screen/Insights.xml"
const capture = ec.factory.getTool("MailCapture")
const people = {
    reader: "BOSS_INS_READER",
    author: "BOSS_INS_AUTHOR",
    services: "BOSS_INS_SERVICES",
    distributor: "BOSS_INS_DISTRIBUTOR",
    admin: "BOSS_INS_ADMIN"
}
// NewSchedule's form, and the screens' transitions through Insights' route and through Tools' own
const form = extra => Object.assign({newDefinitionId: boardId, cronSelected: "0 0 6 ? * MON", renderMode: "csv"}, extra)
const insights = (user, path, parameters, method) =>
    transition(user, insightsRoot, "ScheduledReports/" + path, parameters, method)
const tools = (path, parameters) => transition(users.system, webroot, "apps/dashboards/" + path, parameters)
const one = (entityName, fields) => system(() => ec.entity.find(entityName).condition(fields).useCache(false).one())
const schedulesOf = (reportOwnerId, more) =>
    system(() =>
        Array.from(
            ec.entity
                .find("moqui.screen.ScreenScheduled")
                .condition(Object.assign({reportOwnerId}, more || {}))
                .useCache(false)
                .list()
        )
    )
function removeSchedules(reportOwnerId) {
    system(() => {
        for (const row of schedulesOf(reportOwnerId)) {
            const key = {screenScheduledId: row.screenScheduledId}
            ec.entity.find("moqui.report.ReportScheduleRecipient").condition(key).deleteAll()
            ec.entity.find("moqui.screen.ScreenScheduledLock").condition(key).deleteAll()
            row.delete()
        }
    })
}

spec({
    stepwise: true,
    dependsOn: ["InsightsDatasets"],
    setupSpec() {
        login(users.system)
        capture.enable()
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "through Insights' route a reader schedules for themselves; a distributor's recipients are Insights' readers, checked by the engine, within the organization's cap",
    {
        when() {
            system(() => {
                // a server the report template can send through (captured, never connected)
                ec.service
                    .sync()
                    .name("create#moqui.basic.email.EmailServer")
                    .parameters({emailServerId: "INS_DLV_MAIL", smtpHost: "127.0.0.1", smtpPort: "25"})
                    .call()
                ec.service
                    .sync()
                    .name("update#moqui.basic.email.EmailTemplate")
                    .parameters({
                        emailTemplateId: "BOSS_INSIGHTS_REPORT",
                        emailServerId: "INS_DLV_MAIL",
                        fromAddress: "insights@ziziwork.example"
                    })
                    .call()
            })
            // a dashboard over the admitted sales dataset, shared with every Insights user
            invoke(R + "save#Definition", {
                definition: {
                    id: boardId,
                    type: "dashboard",
                    title: "Orders to deliver",
                    userGroupId: "BOSS_INSIGHTS",
                    body: {
                        panels: {
                            orders: {
                                title: "Orders",
                                visualization: "table",
                                queries: [
                                    {
                                        datasetId: "mantle-sales-orders",
                                        from: "now-1d",
                                        thru: "now+1d",
                                        aggregations: [{id: "currency", type: "terms", params: {field: "currencyUomId"}}]
                                    }
                                ]
                            }
                        },
                        layout: {type: "autoGrid", items: [{panelId: "orders"}]}
                    }
                }
            })
            const create = (user, extra) => insights(user, "Schedules/createSchedule", form(extra))
            const others = {audienceKind: "group", recipientUserIds: [people.reader, people.author]}
            // what a request sends of the policy is not taken: the template, the cap and the map itself are the mount's
            const forged = {emailTemplateId: "DASHBOARD_REPORT", recipientCap: 9999, reportPolicy: {recipientCap: 9999}}
            const personal = create(users.reader, Object.assign({audienceKind: "personal"}, forged))
            // the same save with other people: refused to the reader, who may not deliver to others
            const readerOthers = create(users.reader, others)
            const readerRows = schedulesOf(people.reader)
            // past the organization's recipient cap, which the area adds to Insights' policy: refused, and saved within it
            const setCap = value =>
                system(() => {
                    const key = {partyId: ids.organizationId, partySettingTypeId: "InsightsGroupRecipientCap"}
                    ec.entity.find("mantle.party.PartySetting").condition(key).deleteAll()
                    if (value) {
                        const row = ec.entity.makeValue("mantle.party.PartySetting")
                        row.setAll(Object.assign({settingValue: value}, key))
                        row.create()
                    }
                })
            setCap("1")
            const overCap = create(users.distributor, Object.assign({}, others, forged))
            setCap(null)
            const group = create(users.distributor, others)
            const stored = schedulesOf(people.distributor)
            const narrower = create(users.distributor, {
                audienceKind: "group",
                recipientUserIds: [people.reader, people.services]
            })
            const foreignGroup = create(users.distributor, {audienceKind: "group", recipientGroupIds: ["BOSS_ADMIN"]})
            // a person who is not an Insights reader is not accepted, so the check says nothing of their account; Tools' own
            // route (ADMIN) accepts the same person by the engine's rule, and the engine then judges their scope
            const outsider = {audienceKind: "group", recipientUserIds: ["BOSS_ADM_IDENTITY"]}
            const notReader = create(users.distributor, outsider)
            const toolsOutsider = tools("Schedules/createSchedule", form(outsider))
            // one of Tools' own dashboards is not scheduled under Insights, which hides them; Tools' route schedules it
            const hidden = create(users.distributor, {newDefinitionId: "monitor-overview", audienceKind: "personal"})
            const toolsHidden = tools(
                "Schedules/createSchedule",
                form({newDefinitionId: "monitor-overview", audienceKind: "personal"})
            )
            // Tools' owner-mode form is not on Insights' route, for the distributor and for ADMIN; it is on Tools' own
            const ownerMode = {definitionId: boardId, cronExpression: "0 0 6 ? * MON", renderMode: "csv", delivery: "email"}
            const trims = [users.distributor, users.system]
                .map(user => insights(user, "Reports/createSchedule", ownerMode))
                .filter(asked => asked.location || !asked.errors.includes("screen path not found"))
                .map(asked => asked.location + " " + asked.errors)
            const toolsOwnerMode = tools("Reports/createSchedule", ownerMode)
            const toolsRows = schedulesOf("EX_JOHN_DOE")
            removeSchedules("EX_JOHN_DOE")
            // the administrator reads no business data and schedules nothing: the board is not theirs to read, and the
            // engine's operations are not theirs (the distributor's own Send now of the same schedule is the next feature's)
            const administrator = create(users.admin, {audienceKind: "personal"})
            const adminSend = insights(users.admin, "Schedules/sendNow", {
                screenScheduledId: String(stored[0]?.screenScheduledId)
            })
            // a copied screen schedule's subject is expanded when it runs, so one that holds an expression is refused
            const legacySubject = insights(users.system, "ScheduledReportDetail/storeSchedule", {
                screenScheduledId: "BOSS_DEMO_MY_TASKS",
                emailSubject: "Tasks ${ec.user.userId}"
            })
            // the people a distributor is offered: Insights' readers by name, and the selected one outside the page
            const choices = insights(users.distributor, "Schedules/recipientChoices", {
                term: "insights r",
                selected: people.author
            })
            const readerChoices = insights(users.reader, "Schedules/recipientChoices", {term: "insights"})
            return {
                personal,
                readerOthers,
                readerRows,
                overCap,
                group,
                stored,
                recipients: system(() =>
                    ec.entity
                        .find("moqui.report.ReportScheduleRecipient")
                        .condition("screenScheduledId", String(stored[0]?.screenScheduledId))
                        .count()
                ),
                narrower,
                foreignGroup,
                notReader,
                toolsOutsider,
                hidden,
                toolsHidden,
                trims,
                toolsOwnerMode,
                toolsRows,
                administrator,
                adminSend,
                adminRows: schedulesOf(people.admin).length,
                legacySubject,
                legacyRow: String(one("moqui.screen.ScreenScheduled", {screenScheduledId: "BOSS_DEMO_MY_TASKS"}).emailSubject),
                choices: Array.from(JSON.parse(choices.output || "[]"))
                    .map(option => option.value)
                    .sort()
                    .join(","),
                readerChoices: readerChoices.output.replace(/\s/g, "")
            }
        },
        then({
            personal,
            readerOthers,
            readerRows,
            overCap,
            group,
            stored,
            recipients,
            narrower,
            foreignGroup,
            notReader,
            toolsOutsider,
            hidden,
            toolsHidden,
            trims,
            toolsOwnerMode,
            toolsRows,
            administrator,
            adminSend,
            adminRows,
            legacySubject,
            legacyRow,
            choices,
            readerChoices
        }) {
            personal.errors == ""
            personal.location.includes("ScheduledReports/ScheduledReportDetail?screenScheduledId=")
            readerOthers.errors.includes("Delivering a report to other people needs the group delivery grant")
            // the reader's one schedule: personal, with Insights' message and the organization's cap, whatever was posted
            readerRows.length == 1
            readerRows[0].deliveryMode == "personal" && readerRows[0].emailTemplateId == "BOSS_INSIGHTS_REPORT"
            readerRows[0].recipientCap == 50
            overCap.errors.includes("2 recipients are more than the cap of 1")
            group.errors == ""
            stored.length == 1
            stored[0].deliveryMode == "group" && stored[0].emailTemplateId == "BOSS_INSIGHTS_REPORT"
            recipients == 2
            // a refusal names the recipient and why, never their grants
            narrower.errors.includes("Insights Services reader (scope-differs)")
            !narrower.errors.includes("ORG_ZIZI")
            foreignGroup.errors.includes("Deliver only to a group you belong to")
            notReader.errors.includes("Choose recipients among the people who may receive reports here")
            !toolsOutsider.errors.includes("Choose recipients")
            toolsOutsider.errors == "" || toolsOutsider.errors.includes("may not go to")
            hidden.errors.includes("Choose a dashboard or report you may read")
            toolsHidden.errors == ""
            trims.join("\n") == ""
            toolsOwnerMode.errors == "" && toolsOwnerMode.location.includes("/apps/dashboards/Schedules")
            // Tools' own saves: the engine's template, and the owner-mode schedule with no delivery mode
            toolsRows.some(row => row.reportDefinitionId == "monitor-overview" && row.emailTemplateId == "DASHBOARD_REPORT")
            toolsRows.some(row => row.reportDefinitionId == boardId && !row.deliveryMode)
            administrator.errors.includes("Choose a dashboard or report you may read")
            adminSend.errors.includes("is not authorized")
            adminRows == 0
            legacySubject.errors.includes("A subject is plain text")
            legacyRow == "Open tasks"
            // the name search, and the selected value read outside the page
            choices == [people.author, people.reader].sort().join(",")
            readerChoices == "[]"
        }
    }
)

feature(
    "Send now gives each recipient their own message; each reads their own delivery and report; ScheduledReportDetail renders once",
    {
        when() {
            const scheduleId = String(
                one("moqui.screen.ScreenScheduled", {reportOwnerId: people.distributor, deliveryMode: "group"}).screenScheduledId
            )
            capture.clear()
            const sent = insights(users.distributor, "ScheduledReportDetail/sendNow", {screenScheduledId: scheduleId})
            const messages = Array.from(capture.getMessages())
            const occurrenceId = String(one("moqui.report.ReportOccurrence", {screenScheduledId: scheduleId})?.occurrenceId)
            const idOf = userId => String(one("moqui.report.ReportRecipientDelivery", {occurrenceId, userId})?.deliveryId || "")
            // the reader: their own report rendered again as themselves; the author's delivery and the schedule refused
            const ownReport = insights(users.reader, "ReportDelivery/ownReportFile", {deliveryId: idOf(people.reader)}, null)
            const anothers = insights(users.reader, "ReportDelivery/ownReportFile", {deliveryId: idOf(people.author)}, null)
            const revision = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId}).versionNumber
            const notMine = insights(users.reader, "ScheduledReportDetail/storeSchedule", {
                screenScheduledId: scheduleId,
                cronSelected: "0 0 6 ? * *",
                expectedRevision: revision
            })
            // P12 (design §14 Delivery audit): the run's status as CSV, the owner's every recipient, the reader's own row
            // alone, and nothing for one who is neither
            const audit = user => insights(user, "ReportDelivery/exportAudit", {occurrenceId}, null)
            const ownerAudit = audit(users.distributor)
            const readerAudit = audit(users.reader)
            const outsiderAudit = audit(users.services)
            // the one qvt render: the header, each recipient's result, the run; no payload of anyone's
            const page = asUser(users.distributor, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen(webroot)
                    .renderMode("qvt")
                    .withStaticData()
                    .render(
                        "apps/Insights/ScheduledReports/ScheduledReportDetail",
                        {lastStandalone: "true", screenScheduledId: scheduleId},
                        null
                    )
                const output = String(result.output || "")
                return {
                    status: result.status,
                    output,
                    errors: Array.from(result.errorMessages || []).concat(
                        output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
                    )
                }
            })
            return {
                sent,
                toLists: messages
                    .map(message => Array.from(message.toList).join("+"))
                    .sort()
                    .join(","),
                link: String(messages[0]?.body || ""),
                ownReport,
                anothers,
                notMine,
                cron: String(one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId}).cronExpression),
                ownerAudit,
                ownerRows: ownerAudit.output.trim().split(/\r?\n/).length - 1,
                readerAudit,
                readerRows: readerAudit.output.trim().split(/\r?\n/).length - 1,
                outsiderAudit,
                page
            }
        },
        then({
            sent,
            toLists,
            link,
            ownReport,
            anothers,
            notMine,
            cron,
            ownerAudit,
            ownerRows,
            readerAudit,
            readerRows,
            outsiderAudit,
            page
        }) {
            sent.errors == ""
            toLists == "insights.author@ziziwork.example,insights.reader@ziziwork.example"
            // the message opens Insights' Dashboard, not Tools'
            link.includes("/qapps/Insights/Dashboard?definitionId=" + boardId)
            !link.includes("/apps/dashboards/")
            ownReport.errors == ""
            ownReport.output.includes("Download Orders to deliver") && ownReport.output.includes("base64,")
            anothers.output.includes("This delivery is not available") && !anothers.output.includes("base64,")
            // another's schedule is refused as one that is not there, and is unchanged
            notMine.errors.includes("is not available")
            cron == "0 0 6 ? * MON"
            ownerAudit.errors == ""
            ownerRows == 2
            ownerAudit.output.includes("Insights Author") && ownerAudit.output.includes("Insights Reader")
            ownerAudit.output.includes("Complete") && ownerAudit.output.includes(",Sent,")
            !/@ziziwork|contentBase64/.test(ownerAudit.output)
            readerRows == 1
            readerAudit.output.includes("Insights Reader") && !readerAudit.output.includes("Insights Author")
            // a recipient is told their own result, not the run's state
            !readerAudit.output.includes("Complete")
            outsiderAudit.errors.includes("This delivery is not available")
            !outsiderAudit.output.includes("Insights Reader")
            page.status == 200
            page.errors.join(" | ") == ""
            page.output.includes("Orders to deliver")
            // the header names the schedule's audience and its last run
            page.output.includes("Group, to 2 people")
            page.output.includes("Insights Author")
            page.output.includes("May receive it")
            page.output.includes("at most 50 recipients")
            page.output.includes("Send now")
            page.output.includes("2 sent")
            // the schedule's own recipients, not the engine's fingerprints or anyone's rows
            !/scopeHash|contentBase64/.test(page.output)
        }
    }
)

feature("a distributor composes a digest of dashboards they read and shows it on Home; a reader composes none", {
    when() {
        const digest = {title: "Weekly orders", dashboardIds: [boardId], period: "now-7d", commentary: "Orders are steady."}
        const composed = asUser(users.distributor, () => invoke(D + "store#Digest", digest))
        const reader = asUser(users.reader, () => refusal(D + "store#Digest", digest))
        const unread = asUser(users.distributor, () =>
            invoke(D + "store#Digest", Object.assign({}, digest, {dashboardIds: ["monitor-overview"]}))
        )
        const foreignGroup = asUser(users.distributor, () =>
            invoke(D + "store#Digest", Object.assign({}, digest, {userGroupId: "BOSS_ADMIN"}))
        )
        const home = asUser(users.distributor, () => {
            const stored = invoke(D + "store#DefaultDigest", {definitionId: composed.definitionId})
            return {stored, preview: invoke(D + "get#DigestPreview", {})}
        })
        const found = asUser(users.distributor, () => invoke(D + "get#Digest", {definitionId: composed.definitionId}))
        // private to its composer: another reader does not find it
        const private_ = asUser(users.reader, () => refusal(D + "get#Digest", {definitionId: composed.definitionId}))
        const saved = one("moqui.report.Definition", {definitionId: composed.definitionId})
        return {
            composed,
            reader,
            unread,
            foreignGroup,
            home,
            found,
            private_,
            owner: String(saved?.ownerId),
            kind: JSON.parse(String(saved?.bodyJson || "{}")).kind
        }
    },
    then({composed, reader, unread, foreignGroup, home, found, private_, owner, kind}) {
        composed.applied == true
        owner == people.distributor
        kind == "digest"
        reader.includes("INSIGHTS_DIGEST_REQUIRED")
        unread.reasonCode == "DASHBOARD_UNAVAILABLE"
        foreignGroup.reasonCode == "SHARE_GROUP_UNAVAILABLE"
        home.stored.applied == true
        home.preview.digest.title == "Weekly orders"
        home.preview.digest.commentary == "Orders are steady."
        Array.from(home.preview.sections).length == 1
        home.preview.sections[0].panels[0].panelId == "orders"
        found.digest.own == true
        found.digest.isDefault == true
        found.missingCount == 0
        private_.includes("DIGEST_UNAVAILABLE")
    }
})

feature("Admin's lifecycle finds the schedule through Insights' participant and hands it only to an owner who qualifies", {
    when() {
        const scheduleId = String(
            one("moqui.screen.ScreenScheduled", {reportOwnerId: people.distributor, deliveryMode: "group"}).screenScheduledId
        )
        const owned = asUser("admin.identity", () =>
            invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {appRoot: "Admin", userId: people.distributor})
        )
        const participant =
            Array.from(owned.participantList || []).find(entry => entry.participantKey === "insights.schedules") || {}
        const steps = Array.from(owned.participantSteps || []).filter(step => step.providerKey === "insights.schedules")
        // the operator, who holds no Insights group, calls the participant's own services; an Insights reader does not
        const transfer = toUserId => ({
            screenScheduledId: scheduleId,
            fromUserId: people.distributor,
            toUserId,
            reason: "Offboarding"
        })
        const noPermission = asUser(users.reader, () => refusal(R + "pause#OwnedSchedules", {userId: people.distributor}))
        const paused = asUser("admin.identity", () =>
            invoke(R + "pause#OwnedSchedules", {userId: people.distributor, reason: "Offboarding"})
        )
        // a reader may schedule for themselves but not deliver to a group, so cannot take a group schedule
        const unqualified = asUser("admin.identity", () => refusal(R + "transfer#DefinitionOwner", transfer(people.reader)))
        const atPause = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId})
        const resumed = insights(users.distributor, "Schedules/pauseSchedules", {screenScheduledIds: scheduleId, paused: "false"})
        const afterResume = one("moqui.screen.ScreenScheduled", {screenScheduledId: scheduleId})
        return {
            participant,
            resources: Array.from(participant.resourceList || []).map(resource => resource.resourceId),
            stepActions: steps
                .map(step => step.action)
                .sort()
                .join(","),
            scheduleId,
            noPermission,
            pausedCount: paused.pausedCount,
            unqualified,
            atPause: [atPause.reportOwnerId, atPause.paused, atPause.pausedReason].join(","),
            resumed,
            afterResume: [afterResume.reportOwnerId, afterResume.paused, afterResume.pausedReason || ""].join(",")
        }
    },
    then({
        participant,
        resources,
        stepActions,
        scheduleId,
        noPermission,
        pausedCount,
        unqualified,
        atPause,
        resumed,
        afterResume
    }) {
        participant.state == "ready"
        participant.pauses == true
        resources.includes(scheduleId)
        // a pause for the participant and a transfer for each schedule the distributor owns
        stepActions.startsWith("pause,transfer")
        // the participant's operations are the operator's (the permission itself is the framework's ReportAudience)
        noPermission.includes("is not authorized")
        pausedCount >= 1
        unqualified.includes("NEW_OWNER_REFUSED")
        atPause == people.distributor + ",Y,owner-disabled"
        // the owner themselves resumes it, through the list's transition, once the recipients pass again: still theirs,
        // nothing transferred
        resumed.errors == ""
        afterResume == people.distributor + ",N,"
    }
})
