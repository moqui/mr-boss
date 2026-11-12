// Insights' management digests, and what its alert rules still share with delivery, ironstone.insights.DeliveryServices
// (impl-insights P7; design-insights §7.1, §7.3 ManagementDigest, §3 DigestPreview; INS-06, INS-11).
//
// The delivery itself is the framework's (mr-moqui crates/moqui-report/src/delivery.rs, docs/tools/Monitoring.md "Report
// delivery"), and so are the screens of Scheduled reports (the framework's Dashboards screens Schedules, ScheduledReportDetail
// and ReportDelivery, mounted by location under Insights with its reportPolicy: mr-moqui plans/Admin-Screens-Down.md,
// Track I), which read and write through org.moqui.report.ReportServices as the viewer. What stays here is Insights' own:
// - a management digest: a report definition (kind digest) over dashboards the composer reads, with a period and a short
//   commentary, saved through the engine as its owner; its schedule is an ordinary schedule of it, made in Scheduled reports;
//   who may compose one is the INSIGHTS_* permissions' (authoring or distribution);
// - the caller's own preview of a digest or a dashboard as a file (ManagementDigest's previewFile);
// - for the alert rules (Alerts.js, until they move to the framework's screens too): the engine call and a write's answer,
//   the recipients a distributor may propose (Insights' readers) with their choices, and the display helpers.
// A preview is always the caller's own render. Another recipient's content is never read here: the engine holds none.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const {find, denied, reasonCode} = lib

const ENGINE = "org.moqui.report.ReportServices."
const DIGEST_PREFERENCE = "InsightsDigest"
const formats = [
    {value: "pdf", label: "PDF"},
    {value: "xlsx", label: "Excel workbook"},
    {value: "csv", label: "CSV"},
    {value: "png", label: "Picture"}
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

// ===== what a digest is made of =====
// The dashboards and digests the viewer reads; Tools' telemetry dashboards and the wall display playlists are not offered.
function definitions() {
    return Array.from(engine("list#Definitions").definitions || []).filter(
        definition =>
            definition.component !== "tools" &&
            (definition.type === "dashboard" || (definition.type === "report" && definition.body?.kind === "digest"))
    )
}

// ===== a digest's preview =====
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
// ===== an alert rule's recipients (Alerts.js) =====
// The people who may be proposed as recipients: Insights' readers (the holders of the permission the root's reportPolicy
// names, Insights.js recipientPermissionId), by their groups' permission rows in date. A user id that is not one of them is
// refused before the engine is asked, so the audience check says nothing of an account outside Insights.
function readerIds() {
    const groupIds = lib
        .rows("moqui.security.UserGroupPermission", {userPermissionId: insights.recipientPermissionId})
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
// get#DigestPreview: Home's card, the user's default digest as their own preview, else the default digest of the organization
// in scope (Insights Settings, P10) when they read it; nothing when neither is set or it is gone.
function digestPreview() {
    reader()
    const all = digests()
    const organizationPartyId = insights.context({appRoot: "Insights"}).organizationPartyId
    const organizationDefault = organizationPartyId
        ? insights.organizationSettings(organizationPartyId).values.defaultDigestDefinitionId
        : null
    const chosen =
        all.find(definition => definition.id === defaultDigestId()) ||
        all.find(definition => definition.id === organizationDefault) ||
        null
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
    recipientChoices,
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
