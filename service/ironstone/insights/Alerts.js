// Insights' business alerts, ironstone.insights.AlertServices (impl-insights P8; design-insights §8, Alerts, AlertDetail; INS-07,
// INS-03).
//
// The alerting itself is the framework's (mr-moqui crates/moqui-report/src/alert.rs and alert_delivery.rs, docs/tools/
// Monitoring.md "Business alerts"): a rule over business data is evaluated once, as its owner; it has an audience of internal
// users and groups in place of contact points; each recipient is checked as a schedule's (check#ReportAudience: their scope
// fingerprint for the rule equals the owner's) when the rule is saved active and again before each notification, and is told
// separately in the app or at their account's address; No Data and Error are never Normal; no delivery row keeps a value.
// This module is Insights' side of it:
// - who may do what, from the INSIGHTS_* permissions (design §1.1, §2): reading (INSIGHTS_VIEW) sees the alerts one receives and
//   one's own state of them; INSIGHTS_AUTHOR or INSIGHTS_DISTRIBUTE sets a rule for oneself (from a panel, or a copy of a
//   shipped rule); INSIGHTS_DISTRIBUTE adds other people and groups (the engine checks its own group delivery artifact as
//   well, and each recipient's scope);
// - the rule's fixed parts: Insights' private topic, its email template, the link to AlertDetail and the recipient cap (50
//   until Insights Settings holds it, P10), none of them a caller's to name;
// - a new rule and a copy start paused (not validated); Activate runs the rule's reading as the caller first, then saves it
//   active, which is the engine's check of the owner's sources and every recipient;
// - display rows: names for ids, dates as text, states and safe reason codes in words; a refusal is an answer (applied false
//   with reasonCode and reason), so a screen shows it.
// A state and its values are read through the engine's get#AlertState, which answers them to the owner and to a recipient
// whose scope is the owner's now; nothing here reads a rule's state or a delivery row itself.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const delivery = ec.resource.script("component://mr-boss/service/ironstone/insights/Delivery.js")
const {denied} = lib
const {engine, attempt, proposable, userNames, groupNames, dateText, deliveryStates} = delivery

const TOPIC = "InsightsBusinessAlert"
const TEMPLATE = "BOSS_INSIGHTS_ALERT"
const DETAIL_LINK = "/qapps/Insights/Alerts/AlertDetail"
// the group recipient cap until P10's Insights Settings (impl-insights §4); the engine holds it under the instance ceiling
const RECIPIENT_CAP = 50
// most severe first; No data and Error say the health is not known
const stateWords = {
    Error: ["Error (not known)", "warning"],
    Firing: ["Firing", "negative"],
    NoData: ["No data (not known)", "warning"],
    Pending: ["Pending", "warning"],
    Recovering: ["Recovering", "warning"],
    Normal: ["Normal", "positive"]
}
const pauseReasons = {
    "owner-disabled": "Paused until a new owner takes it",
    "transfer-pending": "Paused until its new owner resumes it",
    "not-validated": "Not active yet"
}
const conditions = [
    {value: "above", label: "Above"},
    {value: "below", label: "Below"},
    {value: "within", label: "Inside a range"},
    {value: "outside", label: "Outside a range"}
]
const reductions = [
    {value: "last", label: "Latest value"},
    {value: "max", label: "Highest"},
    {value: "min", label: "Lowest"},
    {value: "mean", label: "Average"},
    {value: "sum", label: "Total"}
]
const windows = [
    {value: "now-1h", label: "The last hour"},
    {value: "now-1d", label: "The last day"},
    {value: "now-7d", label: "The last 7 days"},
    {value: "now-30d", label: "The last 30 days"}
]
const intervals = [
    {value: "300", label: "Every 5 minutes"},
    {value: "900", label: "Every 15 minutes"},
    {value: "3600", label: "Hourly"},
    {value: "86400", label: "Daily"}
]
const channelWords = {notification: "In the app", email: "Email"}

const text = value => String(value ?? "").trim()
// a word by a key that came from a rule's body or the engine: own names only, so a key such as constructor finds nothing
const pick = (map, key, fallback) => (map && Object.hasOwn(map, String(key ?? "")) ? map[String(key)] : fallback)
const idList = value =>
    (Array.isArray(value)
        ? value
        : value == null || value === ""
          ? []
          : Array.from(typeof value === "string" ? value.split(",") : value)
    )
        .map(text)
        .filter(Boolean)
const number = (value, name) => {
    const parsed = Number(value)
    if (value == null || value === "" || !Number.isFinite(parsed)) denied("VALUE_INVALID", name + " must be a number")
    return parsed
}
// a number as the engine answers it: a fractional one arrives as a decimal, which is read through its text
const plain = value => (value == null || value === "" ? null : Number(String(value)))
const valueText = value => (plain(value) == null ? "–" : String(Math.round(plain(value) * 100) / 100))
// a definition's body as plain JSON to change and save again, its numbers numbers
const clone = value =>
    JSON.parse(
        JSON.stringify(value ?? {}, (key, item) =>
            item != null && typeof item === "object" && !Array.isArray(item) && typeof item.toNumber === "function"
                ? plain(item)
                : item
        )
    )

// ===== access =====
function reader() {
    const capabilities = insights.required().capabilities
    if (!capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Reading Insights is required")
    return capabilities
}
// design §2: Alerts and AlertDetail are edited by the author and the distributor; a reader has their own state
function author() {
    const capabilities = reader()
    if (!capabilities.author && !capabilities.distribute)
        denied("INSIGHTS_ALERT_REQUIRED", "Setting a business alert needs authoring or the distribute permission")
    return capabilities
}

// ===== rules =====
// The alert rules the viewer reads; Tools' telemetry rules are not Insights'.
function rules() {
    return Array.from(engine("list#Definitions", {definitionType: "alert"}).definitions || []).filter(
        definition => definition.component !== "tools"
    )
}
function readRule(definitionId) {
    let definition
    try {
        definition = engine("get#Definition", {definitionId: text(definitionId) || "_NA_"}).definition
    } catch (error) {
        definition = null
    }
    if (!definition || definition.type !== "alert" || definition.component === "tools")
        denied("ALERT_UNAVAILABLE", "This alert is not available")
    return definition
}
const owns = definition => definition.ownerId === ec.user.userId && !definition.readOnly
function ownRule(definitionId) {
    const definition = readRule(definitionId)
    if (!owns(definition)) denied("ALERT_NOT_OWNED", "Only its owner changes an alert; copy it to set your own")
    return definition
}
// Whether the caller reads a dataset's records now (its artifact, its admission and its documents): the engine's own answer,
// asked once a dataset a call.
function datasetReader() {
    const known = new Map()
    return datasetId => {
        const id = text(datasetId)
        if (!known.has(id)) {
            let reads = false
            try {
                reads = !!id && !!engine("get#Dataset", {datasetId: id}).dataset
            } catch (error) {
                reads = false
            }
            known.set(id, reads)
        }
        return known.get(id)
    }
}
function leafQuery(query) {
    return query && Array.isArray(query.queries) ? leafQuery(query.queries[0]) : query || {}
}
function conditionText(body) {
    const condition = body.condition || {}
    const kind = condition.type || "above"
    const field = body.field ? body.field + " " : ""
    if (kind === "within" || kind === "outside")
        return field + (kind === "within" ? "inside " : "outside ") + valueText(condition.min) + " to " + valueText(condition.max)
    return field + kind + " " + valueText(condition.threshold ?? 0)
}
// Who a rule tells, by name for its owner; anyone else learns only that it has an audience.
function audienceText(definition, names) {
    const audience = definition.body?.audience || {}
    if (audience.deliveryMode !== "group") return "Its owner"
    if (!owns(definition)) return "Its audience"
    const users = Array.from(audience.recipientUserIds || [])
    const groups = Array.from(audience.recipientGroupIds || [])
    const parts = []
    if (users.length) parts.push(users.length === 1 ? pick(names.users, users[0], "1 person") : users.length + " people")
    if (groups.length) parts.push(groups.map(groupId => pick(names.groups, groupId, groupId)).join(", "))
    return parts.join(" and ") || "Its owner"
}
function namesOf(definitions) {
    const all = key =>
        Array.from(new Set(definitions.filter(owns).flatMap(definition => Array.from(definition.body?.audience?.[key] || []))))
    return {users: userNames(all("recipientUserIds")), groups: groupNames(all("recipientGroupIds"))}
}
// The engine's answer for one rule: the state of each series for the owner or an equivalent recipient, or why not.
function stateOf(definitionId) {
    try {
        return engine("get#AlertState", {definitionId})
    } catch (error) {
        ec.logger.error("Insights alerts: state of " + definitionId + ": " + error.message)
        return {available: false, reason: "Its state could not be read just now", instances: []}
    }
}
// The rule's state in words: paused, not evaluated, not the viewer's to read, or the most severe state of its series.
function summary(definition, state) {
    const body = definition.body || {}
    if (definition.readOnly) return ["Template", "grey-7"]
    if (body.paused) return [pick(pauseReasons, body.pausedReason, "Paused"), body.pausedReason ? "warning" : "grey-7"]
    if (!state.available) return ["Not shown to you", "grey-7"]
    const found = Array.from(state.instances || []).map(instance => instance.state)
    for (const name of Object.keys(stateWords)) if (found.includes(name)) return stateWords[name]
    if (found.length) return ["Not known", "warning"]
    return ["Not evaluated yet", "grey-7"]
}
function ruleRow(definition, state, names) {
    const body = definition.body || {}
    const words = summary(definition, state)
    return {
        definitionId: definition.id,
        title: definition.title,
        own: owns(definition),
        template: !!definition.readOnly,
        conditionText: conditionText(body),
        audienceText: audienceText(definition, names),
        paused: !!body.paused,
        stateText: words[0],
        stateColor: words[1],
        lastText: dateText(state.lastEvaluated),
        version: definition.version
    }
}
function ownDelivery(delivery) {
    const state = pick(deliveryStates, delivery.statusId, [text(delivery.statusId), "grey-7"])
    return {
        deliveryId: delivery.deliveryId,
        definitionId: delivery.definitionId,
        recipientName: delivery.userFullName || delivery.username || "You",
        channelText: pick(channelWords, delivery.channel, text(delivery.channel)),
        // one skipped was told nothing, and the engine keeps no state for them
        toldText: text(delivery.alertState)
            ? text(delivery.alertState)
                  .split(", ")
                  .map(name => pick(stateWords, name, [name])[0])
                  .join(", ")
            : "Nothing",
        stateText: state[0],
        stateColor: state[1],
        reasonText: delivery.reason || "",
        attemptText: dateText(delivery.attemptDate)
    }
}

// find#Alerts: Mine (the rules the caller owns), Received (the rules that told the caller, with the caller's own delivery) and
// Templates (the shipped rules to copy, each over a dataset the caller reads or not).
function findAlerts(p) {
    const capabilities = reader()
    const authors = !!(capabilities.author || capabilities.distribute)
    const view =
        ["mine", "received", "templates"].includes(p.view) && (authors || p.view === "received")
            ? p.view
            : authors
              ? "mine"
              : "received"
    const out = {view, alerts: [], received: [], templates: [], canAuthor: authors, canDistribute: !!capabilities.distribute}
    const all = rules()
    if (view === "mine") {
        const mine = all.filter(owns)
        const names = namesOf(mine)
        out.alerts = mine.map(definition => ruleRow(definition, stateOf(definition.id), names))
        if (p.state === "active" || p.state === "paused")
            out.alerts = out.alerts.filter(row => row.paused === (p.state === "paused"))
    } else if (view === "received") {
        const deliveries = Array.from(engine("find#AlertDeliveries", {received: true, pageSize: 100}).deliveries || [])
        const seen = new Set()
        for (const row of deliveries) {
            if (seen.has(row.definitionId) || seen.size >= 20) continue
            seen.add(row.definitionId)
            const definition = all.find(candidate => candidate.id === row.definitionId)
            const state = definition ? stateOf(definition.id) : {available: false, instances: []}
            const words = definition ? summary(definition, state) : ["Not shown to you", "grey-7"]
            out.received.push(
                Object.assign(ownDelivery(row), {
                    title: definition?.title || row.title || "An alert you no longer read",
                    readable: !!definition,
                    ruleStateText: words[0],
                    ruleStateColor: words[1]
                })
            )
        }
    } else {
        const reads = datasetReader()
        out.templates = all
            .filter(definition => definition.readOnly)
            .map(definition => {
                const datasetId = leafQuery(definition.body?.query).datasetId
                return {
                    definitionId: definition.id,
                    title: definition.title,
                    description: definition.body?.description || "",
                    conditionText: conditionText(definition.body || {}),
                    available: reads(datasetId),
                    availableText: reads(datasetId) ? "" : "Its dataset is not admitted for you to read"
                }
            })
    }
    return out
}

// The queries of a dashboard's panel that have a measure, for New alert from a panel: each the saved query, never one typed.
function panelSource(dashboardId, panelId) {
    let panel = null
    let title = ""
    try {
        const dashboard = engine("get#Definition", {definitionId: text(dashboardId) || "_NA_"}).definition
        const placed = dashboard.type === "panel" ? dashboard.body : pick(dashboard.body?.panels, text(panelId), null)
        if (placed?.panelRef) {
            const library = engine("get#Definition", {definitionId: placed.panelRef}).definition
            panel = Object.assign({}, library.body, {title: placed.title || library.title})
        } else panel = placed
        title = dashboard.title
    } catch (error) {
        panel = null
    }
    if (!panel) denied("PANEL_UNAVAILABLE", "This panel is not available")
    const queries = Array.from(panel.queries || [])
        .map((query, index) => ({query, index}))
        .filter(entry => Array.from(entry.query.aggregations || []).some(aggregation => aggregation.role === "metric"))
    if (!queries.length) denied("PANEL_NOT_MEASURED", "This panel has no measure an alert could watch")
    return {panel, dashboardTitle: title, queries}
}
function measures(query) {
    return Array.from(query?.aggregations || [])
        .filter(aggregation => aggregation.role === "metric")
        .map(aggregation => ({value: aggregation.id, label: aggregation.id}))
}

// get#Alert: one rule with its basis, its audience and each recipient's result (the owner who may distribute), the caller's
// own state of it and the deliveries (each recipient's for the owner, the caller's own otherwise); or, with a dashboard and
// a panel, the draft of a new rule over that panel's saved query.
function getAlert(p) {
    const capabilities = reader()
    const authors = !!(capabilities.author || capabilities.distribute)
    const options = {
        conditions,
        reductions,
        windows,
        intervals,
        groups: capabilities.distribute ? insights.execute("shareGroups", {}).groups : [],
        measures: [],
        queries: []
    }
    if (!text(p.definitionId)) {
        author()
        const source = panelSource(p.dashboardId, p.panelId)
        const chosen = source.queries.find(entry => String(entry.index) === text(p.queryIndex)) || source.queries[0]
        options.measures = measures(chosen.query)
        options.queries = source.queries.map(entry => ({
            value: String(entry.index),
            label: "Query " + (entry.index + 1) + " (" + (entry.query.datasetId || "") + ")"
        }))
        return {
            creating: true,
            canEdit: true,
            canDistribute: !!capabilities.distribute,
            options,
            alert: {
                definitionId: "",
                title: (source.panel.title || "Panel") + " alert",
                sourceText: source.dashboardTitle + " › " + (source.panel.title || text(p.panelId)),
                dashboardId: text(p.dashboardId),
                panelId: text(p.panelId),
                queryIndex: String(chosen.index),
                valueField: options.measures[0]?.value || "",
                reduce: "last",
                conditionType: "above",
                threshold: 0,
                window: "now-1d",
                intervalSeconds: "3600",
                pendingSeconds: 0,
                keepFiringSeconds: 0,
                audienceKind: "personal",
                emailChannel: "N",
                paused: true,
                stateText: "New",
                stateColor: "grey-7"
            },
            audience: [],
            audienceNote: "",
            states: [],
            stateNote: "",
            deliveries: []
        }
    }
    const definition = readRule(p.definitionId)
    const body = definition.body || {}
    const own = owns(definition)
    const state = stateOf(definition.id)
    const names = namesOf([definition])
    const query = leafQuery(body.query)
    const audience = body.audience || {}
    options.measures = measures(query)
    const words = summary(definition, state)
    const alert = Object.assign(ruleRow(definition, state, names), {
        description: body.description || "",
        sourceText: (query.datasetId || "") + (body.panelId ? " · from the panel " + body.panelId : ""),
        ownerName: definition.readOnly ? "" : pick(userNames([definition.ownerId]), definition.ownerId, ""),
        valueField: body.field || "",
        reduce: body.reduce || "last",
        conditionType: body.condition?.type || "above",
        threshold: plain(body.condition?.threshold) ?? 0,
        minimum: plain(body.condition?.min),
        maximum: plain(body.condition?.max),
        recoveryThreshold: plain(body.condition?.recoveryThreshold),
        window: windows.some(option => option.value === query.from) ? query.from : "",
        windowText: (query.from || "") + " to " + (query.thru || "now"),
        intervalSeconds: String(plain(body.intervalSeconds) || 60),
        pendingSeconds: plain(body.pendingSeconds) || 0,
        keepFiringSeconds: plain(body.keepFiringSeconds) || 0,
        audienceKind: audience.deliveryMode === "group" ? "group" : "personal",
        recipientUserIds: own ? Array.from(audience.recipientUserIds || []) : [],
        recipientGroupIds: own ? Array.from(audience.recipientGroupIds || []) : [],
        emailChannel: Array.from(audience.channels || []).includes("email") ? "Y" : "N",
        userGroupId: definition.userGroupId || "",
        expectedVersion: definition.version,
        pausedReason: body.pausedReason || "",
        stateText: words[0],
        stateColor: words[1]
    })
    // each recipient's result, for the owner who may distribute: eligibility in words, never the other person's grants
    let audienceRows = []
    let audienceNote = ""
    if (own && audience.deliveryMode === "group" && capabilities.distribute) {
        try {
            const checked = engine("check#ReportAudience", {
                definitionId: definition.id,
                recipientUserIds: alert.recipientUserIds,
                recipientGroupIds: alert.recipientGroupIds,
                recipientCap: audience.recipientCap || RECIPIENT_CAP
            })
            audienceRows = Array.from(checked.recipients || []).map(recipient => ({
                userId: recipient.userId,
                recipientName: recipient.userFullName || recipient.username || recipient.userId,
                viaText: Array.from(recipient.viaGroupIds || []).length ? "In a group" : "Named",
                // the in-app notification needs no address
                eligible: recipient.eligible === true || (recipient.reasonCode === "no-address" && alert.emailChannel !== "Y"),
                resultText:
                    recipient.eligible || (recipient.reasonCode === "no-address" && alert.emailChannel !== "Y")
                        ? "May be told"
                        : recipient.reason,
                reasonCode: recipient.reasonCode || ""
            }))
            for (const row of audienceRows) row.resultColor = row.eligible ? "positive" : "negative"
            audienceNote =
                audienceRows.filter(row => row.eligible).length +
                " of " +
                checked.recipientCount +
                " may be told; at most " +
                checked.recipientCap +
                " recipients."
        } catch (error) {
            ec.logger.error("Insights alerts: audience of " + definition.id + ": " + error.message)
            audienceNote = "The recipients could not be checked just now."
        }
    }
    const states = Array.from(state.instances || []).map(instance => {
        const stateWord = pick(stateWords, instance.state, [text(instance.state), "grey-7"])
        const labels = Object.entries(instance.labels || {})
            .filter(([name]) => name !== "field" && name !== "rule" && !Object.hasOwn(body.labels || {}, name))
            .map(([name, value]) => name + " " + value)
        return {
            seriesId: instance.seriesId,
            seriesText: labels.join(", ") || (instance.labels?.field ? String(instance.labels.field) : "The rule"),
            stateText: stateWord[0],
            stateColor: stateWord[1],
            // a state that is not a reading shows no value
            valueText: instance.state === "NoData" || instance.state === "Error" ? "–" : valueText(instance.value),
            sinceText: dateText(instance.stateSince),
            evaluatedText: dateText(instance.lastEvaluated)
        }
    })
    let deliveries = []
    try {
        deliveries = Array.from(
            engine("find#AlertDeliveries", own ? {definitionId: definition.id} : {definitionId: definition.id, received: true})
                .deliveries || []
        ).map(ownDelivery)
    } catch (error) {
        ec.logger.error("Insights alerts: deliveries of " + definition.id + ": " + error.message)
    }
    return {
        creating: false,
        canEdit: own && authors,
        canCopy: authors,
        canDistribute: !!capabilities.distribute,
        options,
        alert,
        audience: audienceRows,
        audienceNote,
        states,
        stateNote: definition.readOnly
            ? "A shipped alert is a template: copy it to set your own."
            : state.available
              ? states.length
                  ? ""
                  : "Not evaluated yet."
              : state.reason || "Its state is not shown to you.",
        deliveries
    }
}

// ===== writes =====
function newId(title) {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
    return (
        "alert-" +
        (slug || "rule") +
        "-" +
        ec.user.userId.toLowerCase().replace(/[^a-z0-9]+/g, "") +
        "-" +
        Date.now().toString(36)
    )
}
// The audience as Insights writes it: the people and groups the caller may propose (a distributor's: Insights readers, and
// groups the distributor belongs to), the channels, and Insights' own topic, template and cap.
function audienceOf(p, capabilities, existing) {
    const group = p.audienceKind === "group"
    const users = group ? idList(p.recipientUserIds) : []
    const groups = group ? idList(p.recipientGroupIds) : []
    if (groups.length || users.some(userId => userId !== ec.user.userId)) {
        if (!capabilities.distribute)
            denied("INSIGHTS_DISTRIBUTE_REQUIRED", "Telling other people of an alert needs the distribute permission")
        // bounded delegation: a group the distributor belongs to, never one named by id alone
        const own = insights.shareGroupIds()
        if (groups.some(groupId => !own.includes(groupId)))
            denied("RECIPIENT_GROUP_UNAVAILABLE", "Tell only a group you belong to")
        proposable(users)
    }
    const email = p.emailChannel === "Y" || p.emailChannel === true || p.emailChannel === "true"
    const audience = {
        recipientUserIds: users,
        recipientGroupIds: groups,
        channels: email ? ["notification", "email"] : ["notification"],
        topic: TOPIC,
        recipientCap: RECIPIENT_CAP
    }
    if (email) audience.emailTemplateId = TEMPLATE
    // each series is its own notification (no grouping across series), so nothing is gained by waiting to group; a state
    // still firing is told again after the engine's repeat interval
    audience.groupWaitSeconds = existing?.groupWaitSeconds ?? 0
    if (existing?.repeatSeconds != null) audience.repeatSeconds = existing.repeatSeconds
    return audience
}
// The rule's reading run now as the caller, never sent: whether it can be evaluated, and how many series it has.
function reading(body) {
    try {
        const result = engine("run#Query", {query: body.query})
        const incomplete = Array.from(result.notices || []).find(notice => notice.complete === false)
        if (incomplete) return {ok: false, reason: "Its source did not answer completely just now"}
        const rows = Array.from(result.frames || []).reduce(
            (count, frame) => Math.max(count, Array.from(frame.fields?.[0]?.values || []).length),
            0
        )
        return {ok: true, seriesCount: rows}
    } catch (error) {
        ec.logger.error("Insights alerts: reading: " + error.message)
        return {ok: false, reason: "You may not read its source, or it did not answer"}
    }
}
function basis(p, body) {
    const kind = conditions.some(option => option.value === p.conditionType) ? p.conditionType : "above"
    const condition = {type: kind}
    if (kind === "within" || kind === "outside") {
        condition.min = number(p.minimum, "The range's lowest value")
        condition.max = number(p.maximum, "The range's highest value")
        if (condition.min > condition.max) denied("VALUE_INVALID", "The range's highest value must be at least its lowest")
    } else {
        condition.threshold = number(p.threshold, "The threshold")
        if (text(p.recoveryThreshold)) condition.recoveryThreshold = number(p.recoveryThreshold, "The recovery threshold")
    }
    body.condition = condition
    body.reduce = reductions.some(option => option.value === p.reduce) ? p.reduce : "last"
    const query = leafQuery(body.query)
    const field = text(p.valueField)
    if (field && !measures(query).some(option => option.value === field))
        denied("VALUE_INVALID", "Choose one of the query's measures")
    body.field = field || null
    const interval = intervals.find(option => option.value === text(p.intervalSeconds))
    body.intervalSeconds = Number(interval?.value || body.intervalSeconds || 3600)
    for (const name of ["pendingSeconds", "keepFiringSeconds"]) {
        const seconds = text(p[name]) ? number(p[name], "A duration") : 0
        if (seconds < 0 || seconds > 604800) denied("VALUE_INVALID", "A duration is 0 to 604800 seconds")
        body[name] = Math.round(seconds)
    }
    // the range read at each evaluation; a compound query keeps its own
    const window = windows.find(option => option.value === text(p.window))
    if (window && body.query && !Array.isArray(body.query.queries)) Object.assign(body.query, {from: window.value, thru: "now"})
    return body
}
// store#Alert: a rule of the caller's own. New from a panel (its saved query), or with basisGiven Y a change of the basis,
// and with audienceGiven Y of the audience and the share group; what a form did not post is kept. A new rule is saved paused;
// Activate is pause#Alerts with paused false.
function storeAlert(p) {
    const capabilities = author()
    return attempt(() => {
        const creating = !text(p.definitionId)
        const basisGiven = creating || p.basisGiven === "Y"
        let title = text(p.title)
        if (basisGiven && (!title || title.length > 120)) denied("VALUE_INVALID", "Name the alert in at most 120 characters")
        let definition
        if (!creating) {
            const existing = ownRule(p.definitionId)
            if (!basisGiven) title = existing.title
            definition = {
                id: existing.id,
                type: "alert",
                title,
                userGroupId: existing.userGroupId || null,
                body: clone(existing.body),
                version: p.expectedVersion == null || p.expectedVersion === "" ? existing.version : Number(p.expectedVersion)
            }
        } else {
            const source = panelSource(p.dashboardId, p.panelId)
            const chosen = source.queries.find(entry => String(entry.index) === text(p.queryIndex)) || source.queries[0]
            const query = clone(chosen.query)
            delete query.ignoreVariables
            Object.assign(query, {from: source.panel.time?.from || "now-1d", thru: "now"})
            definition = {
                id: newId(title),
                type: "alert",
                title,
                userGroupId: null,
                body: {
                    query,
                    dashboardId: text(p.dashboardId),
                    panelId: text(p.panelId),
                    paused: true,
                    pausedReason: "not-validated"
                }
            }
            if (source.panel.business) definition.body.business = clone(source.panel.business)
        }
        const body = basisGiven ? basis(p, definition.body) : definition.body
        const audienceGiven = p.audienceGiven === "Y" || creating
        if (audienceGiven) {
            body.audience = audienceOf(p, capabilities, body.audience)
            // the rule shared with one of the caller's own groups, so its recipients read it; sharing gives no data
            const group = text(p.userGroupId) || null
            if (group && !insights.shareGroupIds().includes(group))
                denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
            definition.userGroupId = group
        } else
            body.audience = Object.assign({}, body.audience, {
                topic: TOPIC,
                recipientCap: body.audience?.recipientCap || RECIPIENT_CAP
            })
        body.detailLink = DETAIL_LINK
        delete body.contactPoints
        delete body.contactPointRefs
        const saved = engine("save#Definition", {
            definition,
            note: creating ? "Set in Insights" : "Changed in Insights"
        }).definition
        return {
            definitionId: saved.id,
            version: saved.version,
            paused: !!saved.body?.paused,
            deliveryMode: saved.body?.audience?.deliveryMode || "personal"
        }
    }, "The alert could not be saved")
}
// copy#Alert: the caller's own copy of a shipped rule, or of one shared with them: for themselves alone, without the
// source's contact points, paused until they activate it.
function copyAlert(p) {
    author()
    return attempt(() => {
        const source = readRule(p.definitionId)
        const query = leafQuery(source.body?.query)
        if (!datasetReader()(query.datasetId)) denied("DATASET_UNAVAILABLE", "Its dataset is not admitted for you to read")
        const title = text(p.title) || source.title
        if (title.length > 120) denied("VALUE_INVALID", "Name the alert in at most 120 characters")
        const body = clone(source.body)
        delete body.contactPoints
        delete body.contactPointRefs
        Object.assign(body, {
            paused: true,
            pausedReason: "not-validated",
            detailLink: DETAIL_LINK,
            copiedFrom: source.id,
            copiedVersion: source.version ?? 0,
            audience: {
                recipientUserIds: [],
                recipientGroupIds: [],
                channels: ["notification"],
                topic: TOPIC,
                recipientCap: RECIPIENT_CAP,
                groupWaitSeconds: 0
            }
        })
        const saved = engine("save#Definition", {
            definition: {id: newId(title), type: "alert", title, userGroupId: null, body},
            note: "Copied from " + source.id + " in Insights"
        }).definition
        return {definitionId: saved.id, version: saved.version}
    }, "The alert could not be copied")
}
function pauseOne(definitionId, paused) {
    return attempt(
        () => {
            const existing = ownRule(definitionId)
            const body = clone(existing.body)
            if (!paused) {
                // validated first: the reading runs as the owner; then the engine checks the sources and every recipient
                const read = reading(body)
                if (!read.ok) denied("ALERT_READING_UNAVAILABLE", read.reason)
            }
            body.paused = paused
            delete body.pausedReason
            const saved = engine("save#Definition", {
                definition: {
                    id: existing.id,
                    type: "alert",
                    title: existing.title,
                    userGroupId: existing.userGroupId || null,
                    body,
                    version: existing.version
                },
                note: paused ? "Paused in Insights" : "Activated in Insights"
            }).definition
            return {definitionId: saved.id, paused: !!saved.body?.paused}
        },
        "The alert could not be " + (paused ? "paused" : "activated")
    )
}
// pause#Alerts: one rule or several, each with its own result; an activation the engine refuses (a recipient whose access
// differs, a source the owner may not read) says why and the others go on.
function pauseAlerts(p) {
    author()
    const paused = !(p.paused === false || p.paused === "false" || p.paused === "N")
    const results = idList(p.definitionIds).map(definitionId => Object.assign({definitionId}, pauseOne(definitionId, paused)))
    return {results, appliedCount: results.filter(result => result.applied).length, paused}
}
// test#Alert: the rule's reading as the caller now; it changes no state and tells nobody.
function testAlert(p) {
    author()
    return attempt(() => {
        const definition = readRule(p.definitionId)
        const read = reading(definition.body || {})
        if (!read.ok) denied("ALERT_READING_UNAVAILABLE", read.reason)
        return {seriesCount: read.seriesCount}
    }, "The reading could not be run")
}
function deleteAlert(p) {
    author()
    return attempt(() => {
        const existing = ownRule(p.definitionId)
        engine("delete#Definition", {definitionId: existing.id})
        return {definitionId: existing.id}
    }, "The alert could not be deleted")
}

const operations = {findAlerts, getAlert, storeAlert, copyAlert, pauseAlerts, testAlert, deleteAlert}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Insights alert operation " + op)
        return operations[op](parameters || {})
    }
})
