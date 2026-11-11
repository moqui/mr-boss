// Insights' scheduled delivery and digests (impl-insights P7; design-insights §7.1, §7.3, ScheduledReports, ScheduledReportDetail,
// ReportDelivery, ManagementDigest): a reader schedules a report for themselves and not for others; a distributor's recipients
// are checked by the report engine, so the Retail agents pass and the Services reader is refused with the reason, as an
// answer a screen shows; Send now gives each recipient a message of their own, linking to Insights, and each reads their own
// delivery and their own report, never another's, and its status export (P12) the same rows; ScheduledReportDetail renders
// once (qvt) with each recipient's result and no
// payload; a digest is composed by a distributor over dashboards they read; and Admin's lifecycle finds the distributor's
// schedule through Insights' participant and hands it only to an owner who qualifies, paused until the recipients pass the
// new owner's check. The engine's rules are the framework's ReportAudience; the admitted sales dataset and its orders are
// InsightsDatasets'. The "usable when" scenario is the acceptance InsightsDeliveryUsable.
// Run: ./moq test mr-boss --spec InsightsDelivery
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {users, asUser, system, refusal, invoke} = lib
const R = "org.moqui.report.ReportServices."
const D = "ironstone.insights.DeliveryServices."
const boardId = "ins-dlv-orders"
const webroot = "component://webroot/screen/webroot.xml"
const capture = ec.factory.getTool("MailCapture")
const people = {
    reader: "BOSS_INS_READER",
    author: "BOSS_INS_AUTHOR",
    services: "BOSS_INS_SERVICES",
    distributor: "BOSS_INS_DISTRIBUTOR"
}
const schedule = extra => Object.assign({definitionId: boardId, cronSelected: "0 0 6 ? * MON", renderMode: "csv"}, extra)
const one = (entityName, fields) => system(() => ec.entity.find(entityName).condition(fields).useCache(false).one())

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
    "a reader schedules for themselves; a distributor's recipients are checked, and the Services reader is refused with the reason",
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
            const personal = asUser(users.reader, () => invoke(D + "store#Schedule", schedule({})))
            // the same save with another person: refused to the reader for the permission, checked for the distributor
            const others = {recipientUserIds: [people.reader, people.author]}
            const readerOthers = asUser(users.reader, () => invoke(D + "store#Schedule", schedule(others)))
            const group = asUser(users.distributor, () => invoke(D + "store#Schedule", schedule(others)))
            const narrower = asUser(users.distributor, () =>
                invoke(D + "store#Schedule", schedule({recipientUserIds: [people.reader, people.services]}))
            )
            const foreignGroup = asUser(users.distributor, () =>
                invoke(D + "store#Schedule", schedule({recipientGroupIds: ["BOSS_ADMIN"]}))
            )
            // a person who is not an Insights reader is not proposed, so the check says nothing of their account
            const notReader = asUser(users.distributor, () =>
                invoke(D + "store#Schedule", schedule({recipientUserIds: ["BOSS_ADM_IDENTITY"]}))
            )
            const administrator = asUser(users.admin, () => refusal(D + "store#Schedule", schedule({})))
            // a copied screen schedule's subject is expanded when it runs, so one that holds an expression is refused
            const legacySubject = asUser(users.system, () =>
                invoke(D + "store#Schedule", {screenScheduledId: "BOSS_DEMO_MY_TASKS", emailSubject: "Tasks ${ec.user.userId}"})
            )
            const checked = asUser(users.distributor, () =>
                invoke(D + "check#Audience", {definitionId: boardId, recipientUserIds: [people.author, people.services]})
            )
            const result = userId => Array.from(checked.recipients || []).find(row => row.userId === userId) || {}
            const choices = asUser(users.distributor, () =>
                invoke(D + "find#RecipientChoices", {term: "insights r", selected: [people.author]})
            )
            return {
                personal,
                readerOthers,
                group,
                narrower,
                foreignGroup,
                notReader,
                administrator,
                legacySubject,
                author: result(people.author),
                services: result(people.services),
                choices: Array.from(choices.options || [])
                    .map(option => option.value)
                    .sort()
                    .join(","),
                readerChoices: asUser(users.reader, () => refusal(D + "find#RecipientChoices", {term: ""}))
            }
        },
        then({
            personal,
            readerOthers,
            group,
            narrower,
            foreignGroup,
            notReader,
            administrator,
            legacySubject,
            author,
            services,
            choices,
            readerChoices
        }) {
            personal.applied == true
            personal.deliveryMode == "personal"
            readerOthers.applied == false
            readerOthers.reasonCode == "INSIGHTS_DISTRIBUTE_REQUIRED"
            group.applied == true
            group.deliveryMode == "group"
            group.recipientCount == 2
            // a refusal is an answer with its code and a reason to show, naming the recipient and why, never their grants
            narrower.applied == false
            narrower.reasonCode == "RECIPIENT_REFUSED"
            narrower.reason.includes("Insights Services reader (scope-differs)")
            !narrower.reason.includes("ORG_ZIZI")
            foreignGroup.applied == false
            foreignGroup.reasonCode == "RECIPIENT_GROUP_UNAVAILABLE"
            notReader.reasonCode == "RECIPIENT_UNAVAILABLE"
            administrator.includes("INSIGHTS_SCHEDULE_REQUIRED")
            legacySubject.applied == false
            legacySubject.reasonCode == "VALUE_INVALID"
            author.eligible == true
            services.eligible == false
            services.resultText.includes("differs")
            // the name search, and the selected value read outside the page
            choices == [people.author, people.reader].sort().join(",")
            readerChoices.includes("INSIGHTS_DISTRIBUTE_REQUIRED")
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
            const sent = asUser(users.distributor, () => invoke(D + "send#Schedule", {screenScheduledId: scheduleId}))
            const messages = Array.from(capture.getMessages())
            const mine = asUser(users.distributor, () => invoke(D + "find#Schedules", {view: "shared"}))
            const row = Array.from(mine.schedules || []).find(entry => entry.screenScheduledId === scheduleId) || {}
            const delivery = asUser(users.distributor, () => invoke(D + "get#Delivery", {occurrenceId: row.lastOccurrenceId}))
            const idOf = userId => (Array.from(delivery.deliveries || []).find(entry => entry.userId === userId) || {}).deliveryId
            // the reader: Received, their own delivery alone, their own report; the author's delivery and the schedule refused
            const received = asUser(users.reader, () => invoke(D + "find#Schedules", {view: "received"}))
            const readerView = asUser(users.reader, () => invoke(D + "get#Delivery", {occurrenceId: row.lastOccurrenceId}))
            const ownReport = asUser(users.reader, () => invoke(D + "get#OwnReport", {deliveryId: idOf(people.reader)}))
            const anothers = asUser(users.reader, () => refusal(D + "get#OwnReport", {deliveryId: idOf(people.author)}))
            const notMine = asUser(users.reader, () => refusal(D + "get#Schedule", {screenScheduledId: scheduleId}))
            const outsider = asUser(users.services, () => refusal(D + "get#Delivery", {occurrenceId: row.lastOccurrenceId}))
            // P12 (design §14 Delivery audit): the run's status as CSV, the owner's every recipient, the reader's own row alone
            const ownerAudit = asUser(users.distributor, () => invoke(D + "export#DeliveryAudit", {occurrenceId: row.lastOccurrenceId}))
            const readerAudit = asUser(users.reader, () => invoke(D + "export#DeliveryAudit", {occurrenceId: row.lastOccurrenceId}))
            const outsiderAudit = asUser(users.services, () =>
                refusal(D + "export#DeliveryAudit", {occurrenceId: row.lastOccurrenceId})
            )
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
                row,
                delivery,
                received: Array.from(received.received || [])
                    .map(entry => entry.deliveryId)
                    .join(","),
                readerId: idOf(people.reader),
                readerView,
                ownReport,
                anothers,
                notMine,
                outsider,
                ownerAudit,
                readerAudit,
                outsiderAudit,
                page
            }
        },
        then({sent, toLists, link, row, delivery, received, readerId, readerView, ownReport, anothers, notMine, outsider, ownerAudit,
              readerAudit, outsiderAudit, page}) {
            sent.applied == true
            sent.sent == true
            toLists == "insights.author@ziziwork.example,insights.reader@ziziwork.example"
            // the message opens Insights' Dashboard, not Tools'
            link.includes("/qapps/Insights/Dashboard?definitionId=" + boardId)
            !link.includes("/apps/dashboards/")
            row.audienceText == "2 people"
            row.lastText.includes("Complete")
            delivery.administers == true
            delivery.occurrence.countsText == "2 sent"
            Array.from(delivery.deliveries).every(entry => entry.stateText === "Sent")
            received == readerId
            readerView.administers == false
            Array.from(readerView.deliveries).length == 0
            readerView.ownDelivery.deliveryId == readerId
            readerView.occurrence.countsText == undefined
            ownReport.available == true
            String(ownReport.contentBase64 || "").length > 0
            anothers.includes("DELIVERY_UNAVAILABLE")
            notMine.includes("SCHEDULE_UNAVAILABLE")
            outsider.includes("DELIVERY_UNAVAILABLE")
            ownerAudit.rowCount == 2
            ownerAudit.csvText.includes("Insights Author") && ownerAudit.csvText.includes("Insights Reader")
            !/@ziziwork|contentBase64/.test(ownerAudit.csvText)
            readerAudit.rowCount == 1
            readerAudit.csvText.includes("Insights Reader") && !readerAudit.csvText.includes("Insights Author")
            outsiderAudit.includes("DELIVERY_UNAVAILABLE")
            page.status == 200
            page.errors.join(" | ") == ""
            page.output.includes("Orders to deliver")
            page.output.includes("Insights Author")
            page.output.includes("May receive it")
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
        const resumeRefused = asUser(users.distributor, () =>
            invoke(D + "pause#Schedules", {screenScheduledIds: [scheduleId], paused: false})
        )
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
            resumed: Array.from(resumeRefused.results || [])[0] || {}
        }
    },
    then({participant, resources, stepActions, scheduleId, noPermission, pausedCount, unqualified, atPause, resumed}) {
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
        // the owner themselves resumes it once the recipients pass again: still theirs, nothing transferred
        resumed.applied == true
    }
})
