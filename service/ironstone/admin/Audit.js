// Admin's audit projections, ironstone.admin.AuditServices (design-admin §12 AuditChanges and AccessLog, §16 "Audit
// evidence"; impl-admin P17): what Admin › Audit's two screens show, and their print and CSV, which are the same lists.
//
// Change evidence is the framework's org.moqui.admin.AuditServices.find#Changes: only registered projections of the audit
// log, a record of an organization found by its owner (Mantle) within the user's organizations, a secret never a value.
// Nothing here reads the audit log or runs with authorization off; this adds a record's place in Admin as a route, only when
// that screen opens to the user.
//
// Access evidence is the report engine's own read of the shipped dataset admin-access-log (report/admin-access-log.json: the
// log lines of the two audit targets, moqui.report.audit and moqui.monitor.audit, by the dataset's fixed row filter), called as
// the user: the dataset's own artifact (granted to the audit reader and the administrator) and its row filters decide, in the
// engine, for every way the dataset is read. A line is answered here as the fields below and nothing else of it: a line's
// attributes may hold a setting's value or the addresses a report went to, and those are counted or left out. A request
// narrows the lines by structured filters of whole values, never by a query text.
//
// Whose lines. The dataset's row-filter service (accessLogRowFilter) keeps a reader to the lines written under a user who
// works for an organization the reader administers; a reader who administers every organization (the administrator with none
// active, an instance administrator) reads every line, the ones no user wrote too (a schedule's run, another server's change).
const adminLib = () => ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const DATASET = "admin-access-log"
const pageSize = 50
const exportRows = 1000
// the accounts whose lines a scoped reader reads; past it nothing is matched (a filter of more values is not built)
const maxUsers = 5000
const text = value => String(value ?? "").trim()
const lineText = (value, maxLength = 255) =>
    text(value)
        .replace(/[\u0000-\u001f\u007f]+/g, " ")
        .slice(0, maxLength)
function call(name, parameters = {}) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// The user's Admin scope, refusing one who may not read audit evidence.
function auditScope() {
    const userScope = adminLib().required()
    if (!userScope.capabilities.auditView) throw new Error("ADMIN_AUDIT_VIEW is required")
    return userScope
}
const scopeText = userScope =>
    userScope.ownerIds ? "The organizations you administer" : "Every organization, and what belongs to the whole instance"
const pagingOf = (name, count, pageIndex, size, shownCount) => ({
    [name + "Count"]: count,
    [name + "PageIndex"]: pageIndex,
    [name + "PageSize"]: size,
    [name + "PageMaxIndex"]: Math.max(Math.ceil(count / size) - 1, 0),
    [name + "PageRangeLow"]: shownCount ? pageIndex * size + 1 : 0,
    [name + "PageRangeHigh"]: pageIndex * size + shownCount
})

// ===== change evidence =====
// A registration's linkKey as a route under Admin, with the parameter its record's key goes in (none: the list or the area).
const recordRoutes = {
    adminGroup: ["Access/GroupDetail", "userGroupId"],
    adminUser: ["Users/UserDetail", "userId"],
    adminInvitations: ["Users/Invitations"],
    adminLifecycle: ["Users/LifecycleDetail", "operationId"],
    adminOrganization: ["Settings/OrganizationDetail", "organizationPartyId"],
    adminIdentityProvider: ["Security/IdentityProviderDetail", "authFlowId"],
    adminInstanceSettings: ["Settings/InstanceSettings"],
    adminLocalization: ["Settings/Localization"],
    adminMessageType: ["Integrations/MessageTypeDetail", "systemMessageTypeId"],
    adminConnection: ["Integrations/Connections"],
    adminMailRelay: ["Protocols/MailRelays"],
    adminSystemMessage: ["Integrations/SystemMessageDetail", "systemMessageId"],
    adminJob: ["Operations/JobDetail", "jobName"],
    adminTopic: ["Operations/TopicDetail", "topic"],
    adminExports: ["Data/Exports"],
    adminImport: ["Data/Imports"],
    adminBackups: ["Data/Backups"]
}
function changeEvidence(p) {
    const userScope = auditScope()
    const filters = {}
    for (const name of ["category", "auditProjectionId", "changedByUserId", "recordKey", "correlation", "fromDate", "thruDate"])
        if (text(p[name])) filters[name] = text(p[name])
    // by default what people changed: a data load's own rows, which name no user, are shown only when asked for
    if (text(p.madeBy) !== "all") filters.actorOnly = true
    const forExport = p.forExport === true
    const found = call(
        "org.moqui.admin.AuditServices.find#Changes",
        Object.assign(filters, forExport ? {forExport: true} : {pageIndex: Math.max(Number(p.pageIndex) || 0, 0), pageSize})
    )
    // a record's place only when its screen opens to the user: an audit reader is given no way into a screen they cannot open
    const opens = {}
    const recordUrl = change => {
        const route = Object.hasOwn(recordRoutes, text(change.linkKey)) ? recordRoutes[change.linkKey] : null
        if (!route) return ""
        if (!Object.hasOwn(opens, route[0])) opens[route[0]] = adminLib().destinationOpens(userScope.grants, "Admin/" + route[0])
        if (!opens[route[0]]) return ""
        return (
            "/qapps/Admin/" +
            route[0] +
            (route[1] && change.linkId ? "?" + route[1] + "=" + encodeURIComponent(change.linkId) : "")
        )
    }
    return {
        changeList: Array.from(found.changeList || []).map(change =>
            Object.assign({}, change, {
                recordUrl: recordUrl(change),
                beforeText: change.masked ? change.before || "" : (change.before ?? ""),
                afterText: change.masked ? change.after || "(" + change.marker + "; not shown)" : (change.after ?? "")
            })
        ),
        changeListCount: found.changeListCount,
        changeListPageIndex: found.changeListPageIndex,
        changeListPageSize: found.changeListPageSize,
        changeListPageMaxIndex: found.changeListPageMaxIndex,
        changeListPageRangeLow: found.changeListPageRangeLow,
        changeListPageRangeHigh: found.changeListPageRangeHigh,
        truncated: found.truncated === true,
        notice: found.notice || null,
        sourceProblems: Array.from(found.sourceProblems || []),
        projectionOptions: Array.from(found.projectionList || []).map(row => ({
            value: row.auditProjectionId,
            label: row.description
        })),
        categoryOptions: Array.from(found.categoryList || []).map(row => ({value: row.category, label: row.description})),
        exportRows: found.exportRows,
        scopeText: scopeText(userScope)
    }
}

// ===== access evidence =====
const sources = {reports: ["moqui.report.audit", "Reports"], monitoring: ["moqui.monitor.audit", "Monitoring"]}
// what a line is about, by the attribute that names it: the first one a line has
const subjectKinds = [
    ["definition", "Definition"],
    ["schedule", "Schedule"],
    ["occurrence", "Occurrence"],
    ["delivery", "Delivery"],
    ["rule", "Alert rule"],
    ["dataset", "Dataset"],
    ["incident", "Incident"],
    ["decision", "Recovery decision"],
    ["action", "Recovery action"],
    ["policy", "Recovery policy"],
    ["adapter", "Recovery adapter"],
    ["key", "Runtime setting"],
    ["owner", "Owner"]
]
const eq = (name, value) => ({field: {name, op: "eq", value}})
const plainFilter = (value, what, maxLength = 120) => {
    const found = text(value)
    if (found.length > maxLength || /[\u0000-\u001f\u007f]/.test(found)) throw new Error(what + " is not a value to find by")
    return found
}
function stamp(value, what) {
    if (value == null || value === "") return null
    const found =
        value instanceof Date ? value.getTime() : /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value))
    if (!Number.isFinite(found)) throw new Error(what + " is not a date")
    return new Date(found).toISOString()
}
// A count an attribute holds as a number, or how many addresses a list of them holds: never the list.
const countOf = value => {
    if (value == null || value === "") return null
    if (typeof value === "number") return value
    const found = text(value)
    return /^\d+$/.test(found) ? Number(found) : found.split(",").filter(part => text(part)).length
}
function accessLine(hit, userNames) {
    const body = hit.body || {}
    const attributes = body.attributes || {}
    const actorId = text(attributes.user || attributes.viewer || body["user.id"])
    const subject = subjectKinds.find(([name]) => text(attributes[name]))
    const source = Object.values(sources).find(([target]) => target === body.scope_name)
    const time = body.timestamp == null ? null : new Date(body.timestamp).getTime()
    const counts = [
        ["rows", "rows"],
        ["recipients", "recipients"],
        ["sent", "sent"],
        ["told", "told"],
        ["considered", "considered"],
        ["definitions", "definitions"],
        ["changes", "changes"]
    ]
        .map(([name, label]) => [label, countOf(attributes[name])])
        .filter(([, count]) => count != null)
    return {
        lineId: text(hit.id),
        time,
        timeText: Number.isFinite(time) ? ec.l10n.format(new Date(time), "yyyy-MM-dd HH:mm:ss") : "",
        sourceText: source ? source[1] : "",
        actionText: lineText(body.body, 200),
        actorUserId: actorId || null,
        actorName: actorId ? userNames.get(actorId) || actorId : "",
        subjectText: subject ? subject[1] + " " + lineText(attributes[subject[0]], 120) : "",
        subjectId: subject ? lineText(attributes[subject[0]], 120) : "",
        kindText: [attributes.kind, attributes.format, attributes.mode, attributes.channel]
            .map(value => lineText(value, 40))
            .filter(Boolean)
            .join(" · "),
        countText: counts.map(([label, count]) => count + " " + label).join(" · "),
        outcomeText: [attributes.outcome, attributes.status, attributes.result]
            .map(value => lineText(value, 40))
            .filter(Boolean)
            .join(" · "),
        reason: lineText(attributes.reason, 255),
        correlation: text(body.trace_id) || null
    }
}
function accessLog(p) {
    const userScope = auditScope()
    const forExport = p.forExport === true
    const size = forExport ? exportRows : pageSize
    const pageIndex = forExport ? 0 : Math.max(Number(p.pageIndex) || 0, 0)
    const sourceKey = text(p.source)
    if (sourceKey && !Object.hasOwn(sources, sourceKey)) throw new Error("Unknown access log source")
    const filters = []
    if (sourceKey) filters.push(eq("scope_name", sources[sourceKey][0]))
    const actor = plainFilter(p.actorUserId, "The user", 40)
    if (actor) filters.push({bool: {any: [eq("attributes.user", actor), eq("attributes.viewer", actor), eq("user.id", actor)]}})
    const subject = plainFilter(p.subject, "The subject")
    if (subject) filters.push({bool: {any: subjectKinds.map(([name]) => eq("attributes." + name, subject))}})
    const correlation = plainFilter(p.correlation, "The trace", 64)
    if (correlation) filters.push(eq("trace_id", correlation))
    const options = {
        sourceOptions: Object.entries(sources).map(([value, [, label]]) => ({value, label})),
        exportRows,
        scopeText: userScope.ownerIds
            ? "What the people of the organizations you administer did"
            : "Every line, the ones no person wrote too"
    }
    // the engine's own read, as the user: the dataset's artifact and its row filters decide there
    let found = null
    let failure = ""
    ec.message.pushErrors()
    try {
        found =
            ec.service
                .sync()
                .name("org.moqui.report.ReportServices.query#Documents")
                .parameters({
                    datasetId: DATASET,
                    filters,
                    from: stamp(p.fromDate, "From") || "now-30d",
                    thru: stamp(p.thruDate, "Before") || "now",
                    sort: ["-time"],
                    pageIndex,
                    pageSize: size
                })
                .call() || {}
        if (ec.message.hasError()) failure = ec.message.getErrorsString()
    } catch (error) {
        failure = String(error?.message ?? error)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
    if (failure) {
        // a refusal or a search that cannot be asked is said, not thrown: the screen shows it in place of the list
        ec.logger.warn("Access log not read for " + ec.user.username + ": " + lineText(failure, 500))
        return Object.assign(options, pagingOf("accessList", 0, pageIndex, size, 0), {
            accessList: [],
            truncated: false,
            unavailable: /not authorized|may not read/i.test(failure)
                ? "The access log is not available to you"
                : "The access log could not be read"
        })
    }
    const hits = Array.from(found.hits || [])
    const actorIds = Array.from(
        new Set(
            hits
                .map(hit => text(hit.body?.attributes?.user || hit.body?.attributes?.viewer || hit.body?.["user.id"]))
                .filter(Boolean)
        )
    )
    const userNames = new Map()
    if (actorIds.length)
        for (const row of Array.from(
            ec.entity
                .find("moqui.security.UserAccount")
                .condition("userId", "in", actorIds)
                .selectField("userId")
                .selectField("username")
                .selectField("userFullName")
                .disableAuthz()
                .list()
        ))
            userNames.set(
                row.userId,
                lineText([row.username, row.userFullName && "(" + row.userFullName + ")"].filter(Boolean).join(" "), 120)
            )
    const count = Number(found.total || 0)
    return Object.assign(options, pagingOf("accessList", count, pageIndex, size, hits.length), {
        accessList: hits.map(hit => accessLine(hit, userNames)),
        truncated: forExport && count > hits.length,
        unavailable: null
    })
}

// The dataset's row-filter service: every line for a reader of every organization, else the lines written under a user of the
// organizations administered; nothing for anyone else.
function accessLogRowFilter(p) {
    const nothing = {filter: {bool: {none: [{match_all: {}}]}}}
    if (!ec.user.userId) return nothing
    if (text(p.userId) && text(p.userId) !== ec.user.userId)
        throw new Error("The access log row filter is computed for the signed-in user only")
    const userScope = adminLib().scope()
    if (!userScope.read || !userScope.capabilities.auditView) return nothing
    if (!userScope.ownerIds) return {filter: {match_all: {}}}
    if (!userScope.ownerIds.length) return nothing
    const userIds = Array.from(
        new Set(
            Array.from(
                ec.entity
                    .find("mantle.party.UserAccountOrganization")
                    .condition("organizationPartyId", "in", userScope.ownerIds)
                    .selectField("userId")
                    .distinct(true)
                    .limit(maxUsers + 1)
                    .disableAuthz()
                    .list()
            ).map(row => row.userId)
        )
    )
    if (!userIds.length) return nothing
    if (userIds.length > maxUsers) {
        ec.logger.error(
            "Access log: more than " + maxUsers + " accounts in the scope of " + ec.user.username + "; no line is answered"
        )
        return nothing
    }
    return {filter: {field: {name: "user.id", op: "in", values: userIds}}}
}

const operations = {changeEvidence, accessLog, accessLogRowFilter}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown audit operation " + op)
        return operations[op](parameters)
    }
})
