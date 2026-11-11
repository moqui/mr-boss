// Insights' scheduled delivery and management digests, ironstone.insights.DeliveryServices (impl-insights P7; design-insights
// §7.1, §7.3, ScheduledReports, ScheduledReportDetail, ReportDelivery, ManagementDigest, §3 DigestPreview; INS-06, INS-11).
//
// The delivery itself is the framework's (mr-moqui crates/moqui-report/src/delivery.rs, docs/tools/Monitoring.md "Report
// delivery"): a schedule renders as its owner, goes to another user only when their scope fingerprint for the definition equals
// the owner's (check#ReportAudience at save, at resume and before each message), each recipient gets a message and an outcome
// of their own, and no row keeps a report. This module is Insights' side of it:
// - who may do what, from the INSIGHTS_* permissions: reading (INSIGHTS_VIEW) sees what one received; INSIGHTS_SCHEDULE
//   schedules a report for oneself; INSIGHTS_DISTRIBUTE adds other people and groups (the engine checks its own group delivery
//   artifact as well, and each recipient's scope);
// - the recipient cap, 50 until Insights Settings holds it (P10), which the engine keeps under the instance ceiling
//   (Admin's report.groupRecipientCeiling);
// - display rows: names for ids, dates as text in the user's zone, states and safe reason codes in words;
// - a refusal as an answer (applied false with reasonCode and reason), so a screen shows it; nothing is thrown at a transition
//   for a refusal the user can act on;
// - the copied personal scheduled finds (design §13.2): a screen schedule the user set up for themselves is listed and its
//   timing changed here, its row kept; it stays personal (a group only through a registered adapter, the framework's rule);
// - a management digest: a report definition (kind digest) over dashboards the composer reads, with a period and a short
//   commentary, saved through the engine as its owner; its schedule is an ordinary schedule of it.
// A preview is always the caller's own render. Another recipient's content is never read here: the engine holds none.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const {find, denied, reasonCode} = lib

const ENGINE = "org.moqui.report.ReportServices."
// the group recipient cap until P10's Insights Settings (impl-insights §4); the engine holds it under the instance ceiling
const RECIPIENT_CAP = 50
const TEMPLATE = "BOSS_INSIGHTS_REPORT"
const DIGEST_PREFERENCE = "InsightsDigest"
const SCHEDULE = "moqui.screen.ScreenScheduled"
const formats = [
    {value: "pdf", label: "PDF"},
    {value: "xlsx", label: "Excel workbook"},
    {value: "csv", label: "CSV"},
    {value: "png", label: "Picture"}
]
const legacyFormats = [
    {value: "xlsx", label: "Excel workbook"},
    {value: "csv", label: "CSV"},
    {value: "xsl-fo", label: "PDF"}
]
const cronPresets = [
    {value: "0 0 6 ? * *", label: "Daily at 6 AM"},
    {value: "0 0 6 ? * MON-FRI", label: "Weekdays at 6 AM"},
    {value: "0 0 6 ? * MON", label: "Weekly on Monday at 6 AM"},
    {value: "0 0 6 1 * ?", label: "Monthly on the 1st at 6 AM"}
]
const periods = [
    {value: "now-7d", label: "The last 7 days"},
    {value: "now-30d", label: "The last 30 days"},
    {value: "now-90d", label: "The last 90 days"}
]
const deliveryStates = {
    RptDlvPending: ["Pending", "grey-7"],
    RptDlvSending: ["Sending", "info"],
    RptDlvSent: ["Sent", "positive"],
    RptDlvSkipped: ["Skipped", "grey-7"],
    RptDlvFailed: ["Failed", "negative"],
    RptDlvUncertain: ["Not known", "warning"]
}
const occurrenceStates = {
    RptOccRunning: ["Running", "info"],
    RptOccComplete: ["Complete", "positive"],
    RptOccIncomplete: ["Incomplete", "warning"],
    RptOccSkipped: ["Skipped", "grey-7"],
    RptOccFailed: ["Failed", "negative"]
}
const occurrenceReasons = {
    empty: "The report had no data, so nothing was sent",
    "owner-inactive": "Its owner is not active, so it was paused",
    "source-failure": "The report could not be rendered",
    "run-ended": "The run ended before it finished",
    skipped: "Nothing was due"
}
const pauseReasons = {
    "owner-disabled": "Paused until a new owner takes it",
    "transfer-pending": "Paused until its new owner resumes it"
}

const text = value => String(value ?? "").trim()
const idList = value =>
    (Array.isArray(value)
        ? value
        : value == null || value === ""
          ? []
          : Array.from(typeof value === "string" ? value.split(",") : value)
    )
        .map(text)
        .filter(Boolean)
const dateText = millis => (millis == null || millis === "" ? "" : ec.l10n.format(new Date(Number(millis)), "yyyy-MM-dd HH:mm"))
function cronText(cron) {
    if (!cron) return ""
    try {
        return String(ec.service.getCronDescription(String(cron), ec.user.getLocale(), true))
    } catch (error) {
        return String(cron)
    }
}

// ===== access =====
function reader() {
    const capabilities = insights.required().capabilities
    if (!capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Reading Insights is required")
    return capabilities
}
function scheduler() {
    const capabilities = reader()
    if (!capabilities.schedule) denied("INSIGHTS_SCHEDULE_REQUIRED", "Scheduling a report needs the schedule permission")
    return capabilities
}
function distributor() {
    const capabilities = scheduler()
    if (!capabilities.distribute)
        denied("INSIGHTS_DISTRIBUTE_REQUIRED", "Delivering a report to other people needs the distribute permission")
    return capabilities
}
function composer() {
    const capabilities = reader()
    if (!capabilities.author && !capabilities.distribute)
        denied("INSIGHTS_DIGEST_REQUIRED", "Composing a digest needs authoring or the distribute permission")
    return capabilities
}

// ===== the engine =====
// A report engine operation as the viewer, in a transaction and an error frame of its own: the engine's checks apply (the
// operation's grant, the owner, each dataset, each recipient), and its refusal is an error here, not a mark on the page.
function engine(name, parameters = {}) {
    ec.message.pushErrors()
    try {
        const result =
            ec.service
                .sync()
                .name(ENGINE + name)
                .parameters(parameters)
                .requireNewTransaction(true)
                .call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// A write's answer: applied with what it returns, or the refusal as a code and a reason to show. A refusal without a code
// (an authorization, a fault) is logged and shown as the fallback, so nothing internal reaches the page.
function attempt(action, fallback) {
    try {
        return Object.assign({applied: true, reasonCode: "", reason: ""}, action())
    } catch (error) {
        const code = reasonCode(error)
        const message = String(error?.message ?? error)
        if (!code) {
            ec.logger.error("Insights delivery: " + message)
            return {applied: false, reasonCode: "NOT_AVAILABLE", reason: fallback}
        }
        return {applied: false, reasonCode: code, reason: message.replace(/^[A-Z][A-Z0-9_]+:\s*/, "")}
    }
}

// ===== names =====
function userNames(userIds) {
    const names = {}
    if (!userIds.length) return names
    for (const row of find("moqui.security.UserAccount")
        .condition("userId", "in", userIds)
        .selectField("userId,username,userFullName")
        .list())
        names[row.userId] = row.userFullName || row.username || row.userId
    return names
}
function groupNames(groupIds) {
    const names = {}
    if (!groupIds.length) return names
    for (const row of find("moqui.security.UserGroup").condition("userGroupId", "in", groupIds).list())
        names[row.userGroupId] = row.description || row.userGroupId
    return names
}

// ===== what may be scheduled =====
// The dashboards and digests the viewer reads; Tools' telemetry dashboards and the wall display playlists are not offered.
function definitions() {
    return Array.from(engine("list#Definitions").definitions || []).filter(
        definition =>
            definition.component !== "tools" &&
            (definition.type === "dashboard" || (definition.type === "report" && definition.body?.kind === "digest"))
    )
}
const definitionOptions = () =>
    definitions().map(definition => ({
        value: definition.id,
        label: definition.title + (definition.type === "report" ? " (digest)" : "")
    }))

// ===== schedules =====
const personalOnly = row => row.deliveryMode !== "group"
function audienceText(row, names) {
    const users = Array.from(row.recipientUserIds || [])
    const groups = Array.from(row.recipientGroupIds || [])
    if (row.deliveryMode !== "group")
        return users.length && users[0] !== ec.user.userId ? names.users[users[0]] || users[0] : "You"
    const parts = []
    if (users.length) parts.push(users.length === 1 ? names.users[users[0]] || "1 person" : users.length + " people")
    if (groups.length) parts.push(groups.map(groupId => names.groups[groupId] || groupId).join(", "))
    return parts.join(" and ")
}
function scheduleRow(row, last, names) {
    const stateText = row.paused ? pauseReasons[row.pausedReason] || "Paused" : "Active"
    const lastState = last ? occurrenceStates[last.statusId] || [last.statusId, "grey-7"] : null
    return {
        screenScheduledId: row.screenScheduledId,
        legacy: false,
        title: row.emailSubject || row.definitionTitle || row.definitionId,
        definitionId: row.definitionId,
        definitionTitle: row.definitionTitle || "A report you no longer read",
        modeText: row.deliveryMode === "group" ? "Group" : "Personal",
        audienceText: audienceText(row, names),
        cronText: cronText(row.cronExpression),
        formatText: formats.find(format => format.value === row.renderMode)?.label || row.renderMode,
        paused: !!row.paused,
        stateText,
        stateColor: row.paused ? (row.pausedReason ? "warning" : "grey-7") : "positive",
        lastText: last
            ? dateText(last.occurrenceDate) + " · " + lastState[0]
            : row.lastRunTime
              ? dateText(row.lastRunTime)
              : "Not yet run",
        lastOccurrenceId: last?.occurrenceId || null,
        revision: row.revision
    }
}
// A screen schedule the user set up for themselves (MyAccount's scheduled finds, design §13.2): theirs alone, its row kept.
function legacyRows() {
    const schedules = Array.from(
        find(SCHEDULE)
            .condition("userId", ec.user.userId)
            .condition("reportDefinitionId", "is-null", null)
            .orderBy("screenPath")
            .limit(200)
            .list()
    ).map(lib.map)
    const findIds = Array.from(new Set(schedules.map(row => row.formListFindId).filter(Boolean)))
    const descriptions = {}
    if (findIds.length)
        for (const saved of find("moqui.screen.form.FormListFind").condition("formListFindId", "in", findIds).list())
            descriptions[saved.formListFindId] = saved.description
    return schedules.map(row => Object.assign(row, {description: descriptions[row.formListFindId] || ""}))
}
function legacyRow(row) {
    const path = text(row.screenPath)
    const name = row.description || path.split("/").filter(Boolean).pop() || path
    const ended = row.thruDate && lib.ms(row.thruDate) <= Date.now()
    const paused = row.paused === "Y" || ended || !row.cronExpression
    return {
        screenScheduledId: row.screenScheduledId,
        legacy: true,
        title: row.emailSubject || name,
        definitionTitle: name + " (saved list)",
        modeText: "Personal",
        audienceText: "You",
        cronText: cronText(row.cronExpression),
        formatText: legacyFormats.find(format => format.value === (row.renderMode || "csv"))?.label || row.renderMode,
        paused,
        stateText: paused ? "Paused" : "Active",
        stateColor: paused ? "grey-7" : "positive",
        lastText: "",
        lastOccurrenceId: null,
        // a group on a screen schedule is sent to only through a registered adapter (the framework's rule)
        groupNote: row.userGroupId ? "Its group is not sent to: this list is not admitted for group delivery" : ""
    }
}
function recipientNames(rows) {
    return {
        users: userNames(Array.from(new Set(rows.flatMap(row => Array.from(row.recipientUserIds || []))))),
        groups: groupNames(Array.from(new Set(rows.flatMap(row => Array.from(row.recipientGroupIds || [])))))
    }
}
function pageFields(out, field, total, pageIndex, pageSize) {
    out[field + "Count"] = total
    out[field + "PageIndex"] = pageIndex
    out[field + "PageSize"] = pageSize
    out[field + "PageMaxIndex"] = Math.max(0, Math.ceil(total / pageSize) - 1)
    out[field + "PageRangeLow"] = total ? pageIndex * pageSize + 1 : 0
    out[field + "PageRangeHigh"] = Math.min(total, (pageIndex + 1) * pageSize)
    return out
}
function deliveryRow(delivery) {
    const state = deliveryStates[delivery.statusId] || [delivery.statusId, "grey-7"]
    return {
        deliveryId: delivery.deliveryId,
        userId: delivery.userId,
        recipientName: delivery.userFullName || delivery.username || delivery.userId,
        statusId: delivery.statusId,
        stateText: state[0],
        stateColor: state[1],
        reasonCode: delivery.reasonCode || "",
        reasonText: delivery.reason || "",
        attemptText: dateText(delivery.attemptDate),
        attemptCount: delivery.attemptCount || 0,
        retryable: delivery.retryable === true,
        uncertain: delivery.uncertain === true,
        sent: delivery.statusId === "RptDlvSent"
    }
}
// find#Schedules: Mine (the personal schedules, the copied scheduled finds among them), Shared administration (the group
// schedules the distributor owns) and Received (the deliveries to the viewer, whatever they may schedule).
function findSchedules(p) {
    const capabilities = reader()
    const view = ["mine", "shared", "received"].includes(p.view) ? p.view : capabilities.schedule ? "mine" : "received"
    const out = {
        view,
        schedules: [],
        received: [],
        canSchedule: capabilities.schedule,
        canDistribute: capabilities.distribute,
        definitionOptions: capabilities.schedule ? definitionOptions() : [],
        formatOptions: formats,
        cronOptions: cronPresets
    }
    if (view === "received") {
        const found = engine("find#ReportOccurrences", {received: true, pageIndex: Number(p.pageIndex) || 0, pageSize: 20})
        out.received = Array.from(found.occurrences || []).map(occurrence => {
            const delivery = deliveryRow(occurrence.ownDelivery || {})
            return Object.assign(delivery, {
                occurrenceId: occurrence.occurrenceId,
                title: occurrence.title || "A report you no longer read",
                dateText: dateText(occurrence.occurrenceDate)
            })
        })
        return pageFields(out, "received", Number(found.total) || 0, Number(found.pageIndex) || 0, Number(found.pageSize) || 20)
    }
    scheduler()
    if (view === "shared" && !capabilities.distribute) return out
    const owned = Array.from(engine("list#Schedules").schedules || []).filter(row => (view === "shared") !== personalOnly(row))
    const last = {}
    for (const occurrence of Array.from(engine("find#ReportOccurrences", {pageSize: 100}).occurrences || []))
        if (!last[occurrence.screenScheduledId]) last[occurrence.screenScheduledId] = occurrence
    const names = recipientNames(owned)
    out.schedules = owned.map(row => scheduleRow(row, last[row.screenScheduledId], names))
    if (view === "mine") out.schedules = out.schedules.concat(legacyRows().map(legacyRow))
    if (p.definitionId) out.schedules = out.schedules.filter(row => row.definitionId === p.definitionId)
    if (p.state === "active" || p.state === "paused")
        out.schedules = out.schedules.filter(row => row.paused === (p.state === "paused"))
    return out
}

// The panels of a dashboard, or of each dashboard of a digest, to show as the caller's own preview (each a report-embed,
// rendered as the viewer); a section the viewer may not read is counted, not named.
function sections(definition) {
    const specs = definition.type === "report" ? Array.from(definition.body?.dashboards || []) : [{dashboardRef: definition.id}]
    return specs.map(spec => {
        const id = spec.dashboardRef || spec.definitionId
        const range = {from: spec.from || "now-7d", thru: spec.thru || "now"}
        try {
            const dashboard = engine("get#Definition", {definitionId: id}).definition
            if (dashboard.type !== "dashboard") throw new Error("not a dashboard")
            return Object.assign(range, {
                definitionId: id,
                title: dashboard.title,
                available: true,
                panels: Object.keys(dashboard.body?.panels || {})
                    .slice(0, 6)
                    .map(panelId => Object.assign({panelId, definitionId: id}, range))
            })
        } catch (error) {
            return Object.assign(range, {definitionId: null, title: "", available: false, panels: []})
        }
    })
}
function audienceRows(checked) {
    return Array.from(checked.recipients || []).map(recipient => ({
        userId: recipient.userId,
        recipientName: recipient.userFullName || recipient.username || recipient.userId,
        viaText: Array.from(recipient.viaGroupIds || []).length ? "In a group" : "Named",
        eligible: recipient.eligible === true,
        blocking: recipient.blocking === true,
        resultText: recipient.eligible ? "May receive it" : recipient.reason,
        resultColor: recipient.eligible ? "positive" : recipient.blocking ? "negative" : "warning",
        reasonCode: recipient.reasonCode || ""
    }))
}
function ownLegacy(screenScheduledId) {
    return legacyRows().find(row => row.screenScheduledId === screenScheduledId) || null
}
// get#Schedule: one schedule of the viewer's with its recipients and their check, its runs and the caller's own preview.
function getSchedule(p) {
    const capabilities = scheduler()
    const options = {
        formats,
        cronPresets,
        definitions: definitionOptions(),
        groups: capabilities.distribute ? insights.execute("shareGroups", {}).groups : []
    }
    const unavailable = () => denied("SCHEDULE_UNAVAILABLE", "This schedule is not available")
    const row = Array.from(engine("list#Schedules", {screenScheduledId: p.screenScheduledId}).schedules || [])[0]
    if (!row) {
        const legacy = p.screenScheduledId ? ownLegacy(p.screenScheduledId) : null
        if (!legacy) unavailable()
        return {
            schedule: Object.assign(legacyRow(legacy), {
                cronExpression: legacy.cronExpression,
                renderMode: legacy.renderMode || "csv",
                noResultsAbort: legacy.noResultsAbort === "Y" ? "Y" : "N",
                fromDate: legacy.fromDate,
                thruDate: legacy.thruDate,
                emailSubject: legacy.emailSubject,
                screenPath: legacy.screenPath,
                formListFindId: legacy.formListFindId
            }),
            options: Object.assign(options, {formats: legacyFormats}),
            recipients: [],
            audience: [],
            runs: [],
            sections: [],
            canDistribute: false
        }
    }
    const names = recipientNames([row])
    const schedule = Object.assign(scheduleRow(row, null, names), {
        cronExpression: row.cronExpression,
        renderMode: row.renderMode,
        noResultsAbort: row.noResultsAbort ? "Y" : "N",
        fromDate: row.fromDate == null ? null : new Date(Number(row.fromDate)),
        thruDate: row.thruDate == null ? null : new Date(Number(row.thruDate)),
        emailSubject: row.emailSubject,
        deliveryMode: row.deliveryMode,
        group: row.deliveryMode === "group",
        recipientUserIds: row.deliveryMode === "group" ? Array.from(row.recipientUserIds || []) : [],
        recipientGroupIds: Array.from(row.recipientGroupIds || []),
        recipientCap: row.recipientCap || RECIPIENT_CAP,
        expectedRevision: row.revision
    })
    const recipients = schedule.recipientUserIds
        .map(userId => ({kind: "Person", name: names.users[userId] || userId}))
        .concat(schedule.recipientGroupIds.map(groupId => ({kind: "Group", name: names.groups[groupId] || groupId})))
    // each recipient's result, for the one who may distribute: eligibility, never the other person's grants
    let audience = []
    let audienceNote = ""
    if (schedule.group && capabilities.distribute) {
        try {
            const checked = engine("check#ReportAudience", {
                definitionId: row.definitionId,
                recipientUserIds: schedule.recipientUserIds,
                recipientGroupIds: schedule.recipientGroupIds,
                recipientCap: schedule.recipientCap
            })
            audience = audienceRows(checked)
            audienceNote =
                checked.eligibleCount +
                " of " +
                checked.recipientCount +
                " may receive it; at most " +
                checked.recipientCap +
                " recipients."
        } catch (error) {
            ec.logger.error("Insights delivery: audience of " + row.screenScheduledId + ": " + error.message)
            audienceNote = "The recipients could not be checked just now."
        }
    }
    const runs = Array.from(
        engine("find#ReportOccurrences", {screenScheduledId: row.screenScheduledId, pageSize: 20}).occurrences || []
    ).map(occurrenceRow)
    let preview = []
    try {
        preview = sections(engine("get#Definition", {definitionId: row.definitionId}).definition)
    } catch (error) {
        // the owner no longer reads the definition: the header says so, and there is nothing to preview
    }
    return {
        schedule,
        options,
        recipients,
        audience,
        audienceNote,
        runs,
        sections: preview,
        canDistribute: capabilities.distribute
    }
}
function occurrenceRow(occurrence) {
    const state = occurrenceStates[occurrence.statusId] || [occurrence.statusId, "grey-7"]
    return {
        occurrenceId: occurrence.occurrenceId,
        screenScheduledId: occurrence.screenScheduledId,
        dateText: dateText(occurrence.occurrenceDate),
        kindText: occurrence.occurrenceKind === "manual" ? "Sent now" : "Scheduled",
        stateText: state[0],
        stateColor: state[1],
        reasonText: occurrenceReasons[occurrence.reasonCode] || "",
        countsText:
            occurrence.sentCount +
            " sent" +
            (occurrence.skippedCount ? ", " + occurrence.skippedCount + " skipped" : "") +
            (occurrence.failedCount ? ", " + occurrence.failedCount + " failed" : "") +
            (occurrence.uncertainCount ? ", " + occurrence.uncertainCount + " not known" : ""),
        sentCount: occurrence.sentCount,
        skippedCount: occurrence.skippedCount,
        failedCount: occurrence.failedCount,
        uncertainCount: occurrence.uncertainCount
    }
}

// store#Schedule: a schedule for oneself, or with INSIGHTS_DISTRIBUTE for people and for groups the distributor belongs to.
// The engine sets the mode and refuses a recipient whose scope differs, with the reason; a screen schedule of the user's own
// (legacy) changes only its timing, format and subject.
function storeSchedule(p) {
    const capabilities = scheduler()
    return attempt(() => {
        const cron = text(p.cronSelected) || text(p.cronExpression)
        if (
            p.screenScheduledId &&
            !Array.from(engine("list#Schedules", {screenScheduledId: p.screenScheduledId}).schedules || []).length
        )
            return storeLegacy(p, cron)
        const recipientsGiven = p.recipientsGiven === "Y" || p.recipientUserIds != null || p.recipientGroupIds != null
        const users = idList(p.recipientUserIds)
        const groups = idList(p.recipientGroupIds)
        if (recipientsGiven && (groups.length || users.some(userId => userId !== ec.user.userId))) {
            if (!capabilities.distribute)
                denied("INSIGHTS_DISTRIBUTE_REQUIRED", "Delivering a report to other people needs the distribute permission")
            // bounded delegation: a group the distributor belongs to, never one named by id alone
            const own = insights.shareGroupIds()
            if (groups.some(groupId => !own.includes(groupId)))
                denied("RECIPIENT_GROUP_UNAVAILABLE", "Deliver only to a group you belong to")
            proposable(users)
        }
        const parameters = {
            screenScheduledId: p.screenScheduledId || null,
            definitionId: p.definitionId || null,
            cronExpression: cron || null,
            renderMode: p.renderMode || null,
            noResultsAbort: p.noResultsAbort || null,
            fromDate: p.fromDate ?? null,
            thruDate: p.thruDate ?? null,
            emailTemplateId: TEMPLATE,
            emailSubject: p.emailSubject ?? null,
            recipientCap: RECIPIENT_CAP,
            expectedRevision: p.expectedRevision == null || p.expectedRevision === "" ? null : Number(p.expectedRevision)
        }
        if (recipientsGiven) Object.assign(parameters, {recipientUserIds: users, recipientGroupIds: groups})
        // the timing form posts all three: one left empty is cleared, where a value not sent would be kept
        if (p.timingGiven === "Y")
            parameters.clearFields = ["emailSubject", "fromDate", "thruDate"].filter(name => p[name] == null || p[name] === "")
        if (p.paused != null && p.paused !== "") parameters.paused = p.paused === true || p.paused === "true" || p.paused === "Y"
        const stored = engine("store#Schedule", parameters)
        return {
            screenScheduledId: stored.screenScheduledId,
            deliveryMode: stored.deliveryMode,
            revision: stored.revision,
            recipientCount: stored.recipientCount
        }
    }, "The schedule could not be saved")
}
function storeLegacy(p, cron) {
    const legacy = ownLegacy(p.screenScheduledId)
    if (!legacy) denied("SCHEDULE_UNAVAILABLE", "This schedule is not available")
    if (idList(p.recipientGroupIds).length || idList(p.recipientUserIds).some(userId => userId !== ec.user.userId))
        denied("LEGACY_PERSONAL", "A saved list's schedule goes to you alone; schedule a dashboard or digest for other people")
    if (cron) {
        try {
            ec.service.nextCronExecution(cron)
        } catch (error) {
            denied("VALUE_INVALID", "The schedule is not a time pattern")
        }
    }
    if (p.renderMode && !legacyFormats.some(format => format.value === p.renderMode)) denied("VALUE_INVALID", "Choose a format")
    // the framework's screen schedule expands its subject when it runs (org.moqui.impl.ScreenServices render#ScheduledScreen,
    // ec.resource.expand), so a subject set here is plain text: one that holds an expression is refused, as the expander
    // reads it. A subject the row already has is left as it is (a pause changes none).
    const subject = text(p.emailSubject)
    if (subject !== text(legacy.emailSubject) && (subject.includes("${") || subject.length > 255))
        denied("VALUE_INVALID", "A subject is plain text of at most 255 characters, without ${ }")
    // the user's own row, already checked: its timing, format and subject, never its screen, find, user or group
    const row = find(SCHEDULE).condition("screenScheduledId", legacy.screenScheduledId).one()
    row.cronExpression = cron || null
    if (p.renderMode) row.renderMode = p.renderMode
    if (p.noResultsAbort === "Y" || p.noResultsAbort === "N") row.noResultsAbort = p.noResultsAbort
    row.fromDate = p.fromDate || null
    row.thruDate = p.thruDate || null
    row.emailSubject = text(p.emailSubject) || null
    if (p.paused != null && p.paused !== "") row.paused = p.paused === true || p.paused === "true" || p.paused === "Y" ? "Y" : "N"
    ec.artifactExecution.runAsSystem(() => row.update())
    return {screenScheduledId: legacy.screenScheduledId, deliveryMode: "personal", recipientCount: 1}
}
function pauseOne(screenScheduledId, paused) {
    return attempt(
        () => {
            if (Array.from(engine("list#Schedules", {screenScheduledId}).schedules || []).length)
                engine("pause#Schedule", {screenScheduledId, paused})
            else
                storeLegacy(
                    Object.assign({}, ownLegacy(screenScheduledId) || {}, {screenScheduledId, paused}),
                    ownLegacy(screenScheduledId)?.cronExpression
                )
            return {screenScheduledId, paused}
        },
        "The schedule could not be " + (paused ? "paused" : "resumed")
    )
}
// pause#Schedules: one schedule or several, each with its own result; a resume the engine refuses (a recipient whose scope
// differs, a schedule waiting for its new owner's check) says why and the others go on.
function pauseSchedules(p) {
    scheduler()
    const paused = !(p.paused === false || p.paused === "false" || p.paused === "N")
    const results = idList(p.screenScheduledIds).map(screenScheduledId =>
        Object.assign({screenScheduledId}, pauseOne(screenScheduledId, paused))
    )
    return {results, appliedCount: results.filter(result => result.applied).length, paused}
}
// send#Schedule: Send now, a new occurrence of its own; each recipient is checked as at any run.
function sendSchedule(p) {
    scheduler()
    return attempt(() => {
        const sent = engine("send#Report", {screenScheduledId: p.screenScheduledId})
        return {sent: sent.sent === true, skipped: sent.skipped === true, skippedReason: text(sent.reason)}
    }, "Not every recipient was delivered: open the run for each recipient's result")
}
// check#Audience: each proposed recipient's result for the distributor, before saving.
function checkAudience(p) {
    distributor()
    return attempt(() => {
        const own = insights.shareGroupIds()
        if (idList(p.recipientGroupIds).some(groupId => !own.includes(groupId)))
            denied("RECIPIENT_GROUP_UNAVAILABLE", "Deliver only to a group you belong to")
        proposable(idList(p.recipientUserIds))
        const checked = engine("check#ReportAudience", {
            definitionId: p.definitionId,
            recipientUserIds: idList(p.recipientUserIds),
            recipientGroupIds: idList(p.recipientGroupIds),
            recipientCap: RECIPIENT_CAP
        })
        return {
            recipients: audienceRows(checked),
            recipientCount: checked.recipientCount,
            eligibleCount: checked.eligibleCount,
            refusedCount: checked.refusedCount,
            recipientCap: checked.recipientCap,
            overCap: checked.overCap === true
        }
    }, "The recipients could not be checked")
}
// The people who may be proposed as recipients: the holders of INSIGHTS_VIEW, by their groups' permission rows in date. A
// user id that is not one of them is refused before the engine is asked, so the audience check says nothing of an account
// outside Insights.
function readerIds() {
    const groupIds = lib
        .rows("moqui.security.UserGroupPermission", {userPermissionId: "INSIGHTS_VIEW"})
        .filter(row => lib.active(row))
        .map(row => row.userGroupId)
    if (!groupIds.length) return []
    return Array.from(
        new Set(
            Array.from(find("moqui.security.UserGroupMember").condition("userGroupId", "in", groupIds).list())
                .filter(row => lib.active(row))
                .map(row => row.userId)
        )
    )
}
function proposable(userIds) {
    const others = userIds.filter(userId => userId !== ec.user.userId)
    if (!others.length) return
    const readers = readerIds()
    if (others.some(userId => !readers.includes(userId)))
        denied("RECIPIENT_UNAVAILABLE", "Choose recipients among Insights' readers")
}
// find#RecipientChoices: the internal people a distributor may propose, Insights' readers (holders of INSIGHTS_VIEW), searched
// by name in the query; a selected value outside the page is read on its own. Choosing one grants nothing: the check decides.
function recipientChoices(p) {
    distributor()
    const memberIds = readerIds()
    const label = row => ({value: row.userId, label: row.userFullName || row.username})
    const accounts = ids =>
        find("moqui.security.UserAccount").condition("userId", "in", ids).selectField("userId,username,userFullName,disabled")
    const options = []
    if (memberIds.length) {
        let query = accounts(memberIds)
        const term = text(p.term)
        if (term)
            query = query.condition(
                ec.entity.conditionFactory.makeCondition(
                    [
                        ec.entity.conditionFactory.makeCondition("userFullName", "like", "%" + term + "%").ignoreCase(),
                        ec.entity.conditionFactory.makeCondition("username", "like", "%" + term + "%").ignoreCase()
                    ],
                    "or"
                )
            )
        for (const row of query.orderBy("userFullName").limit(20).list()) if (row.disabled !== "Y") options.push(label(row))
    }
    const missing = idList(p.selected).filter(
        userId => memberIds.includes(userId) && !options.some(option => option.value === userId)
    )
    if (missing.length) for (const row of accounts(missing).list()) options.push(label(row))
    return {options}
}

// ===== deliveries =====
// get#Delivery: an occurrence for its schedule's owner (what ran and each recipient's outcome) or for a recipient (their own
// delivery alone). Missing and someone else's read alike.
function getDelivery(p) {
    const capabilities = reader()
    let found
    try {
        found = engine("get#ReportOccurrence", {occurrenceId: p.occurrenceId})
    } catch (error) {
        denied("DELIVERY_UNAVAILABLE", "This delivery is not available")
    }
    const occurrence = found.occurrence || {}
    const administers = found.administers === true
    const state = occurrenceStates[occurrence.statusId] || ["", "grey-7"]
    const owner = occurrence.ownerUserId ? userNames([occurrence.ownerUserId])[occurrence.ownerUserId] : ""
    return {
        administers,
        canRetry: administers && capabilities.schedule,
        occurrence: Object.assign(administers ? occurrenceRow(occurrence) : {}, {
            occurrenceId: occurrence.occurrenceId,
            screenScheduledId: administers ? occurrence.screenScheduledId : null,
            title: occurrence.title || "A report you no longer read",
            dateText: dateText(occurrence.occurrenceDate),
            formatText: formats.find(format => format.value === occurrence.renderMode)?.label || occurrence.renderMode || "",
            stateText: state[0],
            stateColor: state[1],
            ownerName: owner || "",
            versionText: administers
                ? "Schedule revision " +
                  (occurrence.scheduleRevision ?? "–") +
                  ", report version " +
                  (occurrence.definitionVersion ?? "–")
                : "",
            modeText: occurrence.deliveryMode === "group" ? "Group" : "Personal",
            rendersText:
                administers && occurrence.renderCount
                    ? occurrence.renderCount + (occurrence.renderCount === 1 ? " render" : " renders")
                    : "",
            revision: occurrence.revision
        }),
        deliveries: Array.from(found.deliveries || []).map(deliveryRow),
        ownDelivery: found.ownDelivery ? deliveryRow(found.ownDelivery) : null
    }
}
// retry#Recipients: the failed deliveries chosen, each with its own outcome; a sent one is never replayed and an uncertain
// one waits to be reconciled (the engine's rules).
function retryRecipients(p) {
    scheduler()
    return attempt(() => {
        const retried = engine("retry#ReportRecipients", {
            occurrenceId: p.occurrenceId,
            deliveryIds: idList(p.deliveryIds),
            expectedRevision: p.expectedRevision == null || p.expectedRevision === "" ? null : Number(p.expectedRevision),
            reason: text(p.reason)
        })
        const results = Array.from(retried.results || [])
        return {
            sentCount: retried.sentCount || 0,
            results: results.map(result => ({
                deliveryId: result.deliveryId,
                retried: result.retried === true,
                statusId: result.statusId || "",
                reason: result.reason || ""
            })),
            notSentCount: results.filter(result => result.statusId !== "RptDlvSent").length
        }
    }, "The retry could not run")
}
function reconcileRecipient(p) {
    scheduler()
    return attempt(
        () => ({
            statusId: engine("reconcile#ReportRecipient", {deliveryId: p.deliveryId, outcome: p.outcome, reason: text(p.reason)})
                .statusId
        }),
        "The delivery could not be settled"
    )
}
// get#OwnReport: the caller's own delivered report, rendered again as themselves by the engine, or why it is not released.
function ownReport(p) {
    reader()
    let report
    try {
        report = engine("get#RecipientReport", {deliveryId: p.deliveryId})
    } catch (error) {
        denied("DELIVERY_UNAVAILABLE", "This delivery is not available")
    }
    if (!report.available)
        return {
            available: false,
            reasonCode: report.reasonCode || "",
            reason: "Your access to this report's data changed since it was sent, so the sent report is not released. Open the report to see what you may read now."
        }
    return {
        available: true,
        contentBase64: report.contentBase64,
        contentType: report.contentType,
        filename: report.filename,
        title: report.title,
        generatedText: dateText(report.generatedDate)
    }
}
// preview#Report: the caller's own render of a dashboard or digest they read, as a file.
function previewReport(p) {
    reader()
    const mode = formats.some(format => format.value === p.renderMode) ? p.renderMode : "pdf"
    return attempt(() => {
        const preview = engine("preview#Report", {definitionId: p.definitionId, renderMode: mode})
        return {
            contentBase64: preview.contentBase64,
            contentType: preview.contentType,
            filename: preview.filename,
            empty: preview.empty === true
        }
    }, "The preview could not be rendered")
}

// ===== management digests =====
function digestRow(definition) {
    const first = Array.from(definition.body?.dashboards || [])[0] || {}
    return {
        definitionId: definition.id,
        title: definition.title,
        own: definition.ownerId === ec.user.userId && !definition.readOnly,
        sharedText: definition.userGroupId ? "Shared" : "Private",
        periodText: periods.find(period => period.value === first.from)?.label || first.from || "",
        dashboardCount: Array.from(definition.body?.dashboards || []).length,
        version: definition.version
    }
}
const digests = () => definitions().filter(definition => definition.type === "report")
const defaultDigestId = () => text(ec.user.getPreference(DIGEST_PREFERENCE)) || null
// get#Digest: the digests the viewer reads, the one chosen with the caller's own preview of it, and the composer's choices.
function getDigest(p) {
    const capabilities = reader()
    const composes = capabilities.author || capabilities.distribute
    const all = digests()
    const chosen = p.definitionId ? all.find(definition => definition.id === p.definitionId) : null
    if (p.definitionId && !chosen) denied("DIGEST_UNAVAILABLE", "This digest is not available")
    const dashboards = Array.from(chosen?.body?.dashboards || [])
    const preview = chosen ? sections(chosen) : []
    return {
        canCompose: composes,
        canSchedule: capabilities.schedule,
        defaultDigestId: defaultDigestId(),
        digests: all.map(digestRow).sort((a, b) => a.title.localeCompare(b.title)),
        digest: chosen
            ? Object.assign(digestRow(chosen), {
                  commentary: chosen.body?.commentary || "",
                  period: dashboards[0]?.from || "now-7d",
                  dashboardIds: dashboards.map(spec => spec.dashboardRef || spec.definitionId),
                  userGroupId: chosen.userGroupId || "",
                  expectedVersion: chosen.version,
                  isDefault: defaultDigestId() === chosen.id
              })
            : null,
        sections: preview.filter(section => section.available),
        missingCount: preview.filter(section => !section.available).length,
        options: {
            dashboards: composes
                ? definitions()
                      .filter(definition => definition.type === "dashboard")
                      .map(definition => ({value: definition.id, label: definition.title}))
                : [],
            periods,
            groups: composes ? insights.execute("shareGroups", {}).groups : []
        }
    }
}
// store#Digest: a digest the composer owns, over dashboards they read, in order, with one period and a short commentary;
// private or shared with one of their own groups, which shares the definition and no data.
function storeDigest(p) {
    composer()
    return attempt(() => {
        const title = text(p.title)
        if (!title || title.length > 120) denied("VALUE_INVALID", "Name the digest in at most 120 characters")
        const dashboardIds = Array.from(new Set(idList(p.dashboardIds)))
        if (!dashboardIds.length || dashboardIds.length > 6) denied("VALUE_INVALID", "Choose one to six dashboards")
        const period = text(p.period) || "now-7d"
        if (!periods.some(option => option.value === period)) denied("VALUE_INVALID", "Choose a period")
        const commentary = text(p.commentary)
        if (commentary.length > 2000) denied("VALUE_INVALID", "Keep the commentary to 2000 characters")
        const group = text(p.userGroupId) || null
        if (group && !insights.shareGroupIds().includes(group))
            denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
        const readable = definitions().filter(definition => definition.type === "dashboard")
        for (const dashboardId of dashboardIds)
            if (!readable.some(definition => definition.id === dashboardId))
                denied("DASHBOARD_UNAVAILABLE", "Choose dashboards you may read")
        let definitionId = text(p.definitionId)
        let version = null
        if (definitionId) {
            const existing = digests().find(definition => definition.id === definitionId)
            if (!existing || existing.readOnly || existing.ownerId !== ec.user.userId)
                denied("DIGEST_NOT_OWNED", "Only its owner changes a digest; compose your own")
            version = p.expectedVersion == null || p.expectedVersion === "" ? existing.version : Number(p.expectedVersion)
        } else {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 40)
            definitionId =
                "digest-" +
                (slug || "summary") +
                "-" +
                ec.user.userId.toLowerCase().replace(/[^a-z0-9]+/g, "") +
                "-" +
                Date.now().toString(36)
        }
        const definition = {
            id: definitionId,
            type: "report",
            title,
            userGroupId: group,
            body: {
                kind: "digest",
                folder: "Insights",
                commentary,
                layout: "rows",
                dashboards: dashboardIds.map(dashboardRef => ({dashboardRef, from: period, thru: "now"}))
            }
        }
        if (version != null) definition.version = version
        const saved = engine("save#Definition", {
            definition,
            note: version == null ? "Composed in Insights" : "Changed in Insights"
        }).definition
        return {definitionId: saved.id, version: saved.version}
    }, "The digest could not be saved")
}
// store#DefaultDigest: the digest Home previews for this user (a preference; it grants nothing), or none.
function storeDefaultDigest(p) {
    reader()
    return attempt(() => {
        const definitionId = text(p.definitionId)
        if (definitionId && !digests().some(definition => definition.id === definitionId))
            denied("DIGEST_UNAVAILABLE", "This digest is not available")
        ec.user.setPreference(DIGEST_PREFERENCE, definitionId || null)
        return {definitionId: definitionId || null}
    }, "The Home digest could not be set")
}
// get#DigestPreview: Home's card, the user's default digest as their own preview; nothing when none is set or it is gone.
function digestPreview() {
    reader()
    const definitionId = defaultDigestId()
    const chosen = definitionId ? digests().find(definition => definition.id === definitionId) : null
    if (!chosen) return {digest: null, sections: [], missingCount: 0}
    const preview = sections(chosen)
    return {
        digest: Object.assign(digestRow(chosen), {commentary: chosen.body?.commentary || ""}),
        sections: preview
            .filter(section => section.available)
            .map(section => Object.assign({}, section, {panels: section.panels.slice(0, 2)})),
        missingCount: preview.filter(section => !section.available).length
    }
}

const operations = {
    findSchedules,
    getSchedule,
    storeSchedule,
    pauseSchedules,
    sendSchedule,
    checkAudience,
    recipientChoices,
    getDelivery,
    retryRecipients,
    reconcileRecipient,
    ownReport,
    previewReport,
    getDigest,
    storeDigest,
    storeDefaultDigest,
    digestPreview
}
;({
    // P8: the engine call, a write's answer, the proposable recipients and the display helpers, for Alerts.js
    engine,
    attempt,
    proposable,
    userNames,
    groupNames,
    dateText,
    deliveryStates,
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Insights delivery operation " + op)
        return operations[op](parameters || {})
    }
})
