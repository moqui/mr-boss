// Customer Service's reports (design-customer-service §7, crosscut §3.2; impl-customer-service P14, CS-REPORTING;
// ReportingServices.xml): the report catalogue, service level compliance, response times, case volumes, return analysis, and
// Customer360's service statistics and service agreements. Each read is limited in the query by the reports' scope: the
// Reports area's grant, the user's organizations (one asked for, else every one of theirs), and the queues of the teams the
// user reports on (an administrator: every queue they see; a manager: the queues of the teams they manage; anyone else: the
// queues of their own teams), so a manager of one team sees only its queues, and the export is the same rows. Each answers its
// as-of time (now, or an earlier time asked for, which reads the facts recorded by then), its period and the time zone the
// days are in, its filters, what it left out and whether it read every row (each read is capped at readCap, a group list at
// groupCap). Amounts are per currency, never added across currencies, and only for a holder of PRICE_VIEW, ACCOUNTING_VIEW or
// RECEIVABLE_VIEW (P3's rule, Orders.js); a feedback comment never shows here (P13: service management's, on
// SatisfactionResults). Compliance and response times read the clocks Mantle's SlaServices recorded, never a clock a merge
// ended (SlsMerged, F137: its copy on the kept case counts), with cancelled cases' clocks shown apart. Each export (output csv)
// is the same rows with the filters, as-of time and what was left out, formula-like text guarded, and audited
// (org.moqui.report.ReportServices.audit#Export).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const cases = () => ec.resource.script("component://mr-boss/service/ironstone/customerservice/Cases.js")
const orders = () => ec.resource.script("component://mr-boss/service/ironstone/customerservice/Orders.js")
const time = () => ec.resource.script("component://mr-mantle/service/mantle/work/BusinessTime.js")
const {find, one, rows, denied, ms} = lib

const CLOCK = "mantle.request.support.CaseClockRequest",
    EPISODE = "mantle.request.support.CaseSlaEpisode",
    CASE = "mantle.request.support.CaseRequest",
    CASE_PARTY = "mantle.request.support.CaseRequestParty",
    RELATION = "mantle.request.support.CaseRelation",
    AUDIT = "moqui.entity.EntityAuditLog",
    REQUEST = "mantle.request.Request",
    HEADER = "mantle.order.return.ReturnHeader",
    ITEM = "mantle.order.return.ReturnItem",
    BILLING = "mantle.order.return.ReturnItemBilling",
    RECEIPT = "mantle.product.receipt.AssetReceipt",
    AGREEMENT = "mantle.party.agreement.Agreement",
    INVITATION = "mantle.party.FormInvitation"
const dayMs = 86400000
const readCap = 5000
const timedCap = 2000
const groupCap = 200
const withheld = "Withheld"
const openStatuses = ["ReqSubmitted", "ReqReviewed", "ReqInProgress", "ReqWaitingCustomer", "ReqOnHold"]
const closedReturnStatuses = ["ReturnCompleted", "ReturnCancelled"]
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value ?? 0)
const L = text => ec.l10n.localize(text)
const now = () => Number(ms(ec.user.nowTimestamp))
const msOf = value => (value == null || value === "" ? null : Number(ms(value)))
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const dayOf = value => (value == null ? "" : ec.l10n.format(new Date(Number(value)), "yyyy-MM-dd"))
const stampText = value => (value == null ? "" : ec.l10n.format(new Date(Number(value)), "d MMM yyyy HH:mm"))
const quantityText = value => ec.l10n.format(dec(value), "#,##0.###")
const percentOf = (part, whole) => (whole ? Math.round((1000 * part) / whole) / 10 : null)
const percentText = value => (value == null ? "" : ec.l10n.format(dec(value), "0.#") + "%")
const money = (value, currencyUomId) => ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)
function chunks(list, size = 500) {
    const out = []
    for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size))
    return out
}
// minutes as text: "45 min", "3 h 20 min", "2 d 4 h"
function minutesText(minutes) {
    if (minutes == null) return ""
    const total = Math.max(0, Math.round(minutes))
    if (total < 60) return total + " min"
    if (total < 24 * 60) return Math.floor(total / 60) + " h" + (total % 60 ? " " + (total % 60) + " min" : "")
    const hours = Math.round(total / 60)
    return Math.floor(hours / 24) + " d" + (hours % 24 ? " " + (hours % 24) + " h" : "")
}
// the nearest-rank percentile of sorted numbers
const percentile = (sorted, share) => (sorted.length ? sorted[Math.max(0, Math.ceil(share * sorted.length) - 1)] : null)
const mean = list => (list.length ? list.reduce((sum, value) => sum + value, 0) / list.length : null)
const fact = value => (value == null ? null : Math.round(value))

// ===== the scope =====
// The queues the user reports on: an administrator's every queue they see; a manager's, the queues of the teams they manage
// (else of their teams); anyone else's, the queues of their own teams. Each of an organization of the scope.
function reportQueues(userScope, organizationPartyIds) {
    const can = userScope.capabilities
    const seen = cs
        .currentQueues()
        .filter(
            queue =>
                userScope.queueIds.includes(queue.requestCategoryId) &&
                organizationPartyIds.includes(cs.queueOwner(queue.requestCategoryId))
        )
    if (can.policyEdit || userScope.unrestricted) return seen
    const teams = can.caseManage && userScope.managedTeamIds.length ? userScope.managedTeamIds : userScope.teamIds
    return seen.filter(queue => !!queue.responsibleTeamPartyId && teams.includes(queue.responsibleTeamPartyId))
}
// The scope of a report read: the area's grant, the organizations (one asked for must be the user's), the queues (one asked
// for, or a team's, must be among them); with the amounts rule. Refuses PERMISSION_DENIED and RECORD_UNAVAILABLE.
function scopeOf(p, options = {}) {
    const userScope = cs.required()
    const can = userScope.capabilities
    if (!can.reports && !options.customer) denied("PERMISSION_DENIED", "Customer Service reports are not available to you")
    const mine = cs.vendorIds(userScope)
    let organizationPartyIds = mine
    if (!blank(p.organizationPartyId)) {
        if (!mine.includes(String(p.organizationPartyId)))
            denied("RECORD_UNAVAILABLE", "Organization " + p.organizationPartyId + " is not available")
        organizationPartyIds = [String(p.organizationPartyId)]
    }
    let queues = reportQueues(userScope, organizationPartyIds)
    if (!blank(p.teamPartyId)) {
        const teamQueues = queues.filter(queue => queue.responsibleTeamPartyId === String(p.teamPartyId))
        if (!teamQueues.length) denied("RECORD_UNAVAILABLE", "Team " + p.teamPartyId + " is not available")
        queues = teamQueues
    }
    if (!blank(p.requestCategoryId)) {
        const queue = queues.filter(row => row.requestCategoryId === String(p.requestCategoryId))
        if (!queue.length) denied("RECORD_UNAVAILABLE", "Queue " + p.requestCategoryId + " is not available")
        queues = queue
    }
    return {
        userScope,
        can,
        organizationPartyIds: organizationPartyIds.length ? organizationPartyIds : ["_NA_"],
        queues,
        queueIds: queues.length ? queues.map(queue => queue.requestCategoryId) : ["_NA_"],
        teamOf: Object.fromEntries(queues.map(queue => [queue.requestCategoryId, queue.responsibleTeamPartyId || null])),
        amountRead: orders().amountRead()
    }
}
// The start of a day (yyyy-MM-dd) in the user's time zone, in milliseconds.
const dayStart = day => Number(ms(ec.l10n.parseTimestamp(String(day).slice(0, 10), "yyyy-MM-dd")))
// The period [from, thru) of a report, the through day whole, else defaultDays to the end of today; and the as-of time: now,
// or an earlier time asked for (the facts recorded by then), the period ending there at the latest. Refuses PERIOD_INVALID.
function periodOf(p, defaultDays = 30) {
    const asOf = blank(p.asOf) ? now() : Math.min(now(), msOf(p.asOf))
    if (!Number.isFinite(asOf)) denied("PERIOD_INVALID", "Choose a valid as-of time")
    const thruDay = blank(p.thruDate)
        ? dayOf(asOf)
        : /^\d{4}-\d{2}-\d{2}/.test(String(p.thruDate))
          ? String(p.thruDate).slice(0, 10)
          : dayOf(msOf(p.thruDate))
    const thru = dayStart(ec.l10n.format(new Date(dayStart(thruDay) + dayMs + 3 * 3600000), "yyyy-MM-dd"))
    const from = blank(p.fromDate)
        ? thru - defaultDays * dayMs
        : /^\d{4}-\d{2}-\d{2}$/.test(String(p.fromDate).trim())
          ? dayStart(p.fromDate)
          : msOf(p.fromDate)
    if (!Number.isFinite(from) || !Number.isFinite(thru) || thru <= from)
        denied("PERIOD_INVALID", "Choose a period that ends after it starts")
    if (thru - from > 731 * dayMs) denied("PERIOD_INVALID", "A report period is at most two years")
    return {from, thru: Math.min(thru, asOf + 1), asOf, text: dayOf(from) + " to " + thruDay}
}
// The frame every report answers: the as-of time, the period and time zone, the filters in words, what it left out.
function frame(scope, period, filters, omitted) {
    const names = lib.partyNames(scope.organizationPartyIds)
    const omittedList = unique(omitted)
    return {
        asOf: new Date(period.asOf),
        asOfText: stampText(period.asOf),
        periodText: period.text,
        timeZoneText: String(ec.user.timeZone?.getID?.() || ec.user.timeZone || ""),
        filtersText: [
            L("Organizations") + ": " + scope.organizationPartyIds.map(id => names[id] || id).join(", "),
            L("Queues") +
                ": " +
                (scope.queues.length ? scope.queues.map(queue => cs.queueName(queue.requestCategoryId)).join(", ") : L("none")),
            ...filters.filter(Boolean)
        ].join(" · "),
        omittedText: omittedList.join(" "),
        complete: !omittedList.length
    }
}
const filterText = (label, value, text) => (blank(value) ? null : label + ": " + (text || value))

// ===== groups =====
const bandRows = () => cases().bandRows()
function bandOfPriority(priority, bands) {
    const value = Number(priority ?? 5)
    return bands.find(row => value >= Number(row.enumCode) && value <= Number(row.optionValue)) || null
}
// A row's group key and label by the grouping asked for (an unknown grouping is the first one offered).
function grouper(groupBy, offered, scope) {
    const by = offered.includes(groupBy) ? groupBy : offered[0]
    const bands = bandRows()
    const labels = new Map()
    const label = (key, make) => {
        if (!labels.has(key)) labels.set(key, make())
        return labels.get(key)
    }
    const keyOf = row => {
        switch (by) {
            case "queue":
                return row.requestCategoryId || "_NA_"
            case "team":
                return scope.teamOf[row.requestCategoryId] || "_NA_"
            case "band":
                return row.priorityBandEnumId || bandOfPriority(row.priority, bands)?.enumId || "_NA_"
            case "policy":
                return row.serviceLevelPolicyId || "_NA_"
            case "channel":
                return row.salesChannelEnumId || "_NA_"
            case "clock":
                return row.clockEnumId || "_NA_"
            case "type":
                return row.requestTypeEnumId || "_NA_"
            case "day":
            case "week":
            case "month": {
                const at = row.groupDateMs
                if (at == null) return "_NA_"
                if (by === "month") return ec.l10n.format(new Date(at), "yyyy-MM")
                if (by === "day") return dayOf(at)
                // the Monday of the week, the day's noon read in UTC (any zone within 12 hours of it)
                const start = dayStart(dayOf(at))
                const weekday = (new Date(start + 12 * 3600000).getUTCDay() + 6) % 7
                return dayOf(start - weekday * dayMs + 12 * 3600000)
            }
            default:
                return "_ALL_"
        }
    }
    const labelOf = key => {
        if (key === "_ALL_") return L("All")
        if (key === "_NA_") return L("None")
        return label(key, () => {
            switch (by) {
                case "queue":
                    return cs.queueName(key)
                case "team":
                    return cs.partyName(key)
                case "policy": {
                    const policy = one("mantle.request.support.ServiceLevelPolicy", {serviceLevelPolicyId: key})
                    const calendar = policy?.calendarId
                        ? one("mantle.work.calendar.Calendar", {calendarId: policy.calendarId})
                        : null
                    return (
                        (policy?.policyName || key) +
                        " · " +
                        (calendar
                            ? calendar.description || calendar.calendarId
                            : L("around the clock") + (policy?.timeZone ? " " + policy.timeZone : ""))
                    )
                }
                case "week":
                    return L("Week of") + " " + key
                case "day":
                case "month":
                    return key
                default:
                    return cs.enumText(key)
            }
        })
    }
    return {by, keyOf, labelOf}
}
// The rows by group, at most groupCap groups (the rest named as left out), sorted by label (a date grouping by its key).
function grouped(list, group, make, add, omitted) {
    const byKey = new Map()
    for (const row of list) {
        const key = group.keyOf(row)
        if (!byKey.has(key)) {
            if (byKey.size >= groupCap) {
                omitted.push(L("Only the first") + " " + groupCap + " " + L("groups are shown; narrow the filters."))
                continue
            }
            byKey.set(key, make(key))
        }
        add(byKey.get(key), row)
    }
    const dated = ["day", "week", "month"].includes(group.by)
    return Array.from(byKey.entries())
        .map(([key, value]) => Object.assign(value, {groupKey: key, groupText: group.labelOf(key)}))
        .sort((a, b) => (dated ? a.groupKey.localeCompare(b.groupKey) : a.groupText.localeCompare(b.groupText)))
}
const groupLabels = {
    queue: "Queue",
    team: "Team",
    band: "Priority",
    policy: "Policy and calendar",
    channel: "Channel",
    clock: "Clock",
    type: "Type",
    day: "Day",
    week: "Week",
    month: "Month",
    reason: "Reason",
    product: "Product",
    response: "Response",
    customer: "Customer",
    disposition: "Received status",
    none: "All"
}
const groupOptions = offered => offered.map(value => ({value, label: L(groupLabels[value])}))

// ===== the export =====
// A cell for a spreadsheet: a number column's value as a plain number; other text a spreadsheet would read as a formula
// (starting =, +, -, @, a tab or a carriage return) behind an apostrophe; quoted when it holds a comma, quote or line break.
function csvCell(value, numeric) {
    let text = value == null ? "" : String(value)
    if (!(numeric && /^-?\d+(\.\d+)?$/.test(text)) && /^[=+\-@\t\r]/.test(text)) text = "'" + text
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}
function csvOf(title, answer, tables) {
    const lines = [
        [title],
        [L("Period"), answer.periodText + " (" + answer.timeZoneText + ")"],
        [L("Filters"), answer.filtersText],
        [L("As of"), answer.asOfText],
        [L("Left out"), answer.omittedText || L("Nothing")]
    ].map(cells => cells.map(cell => csvCell(cell, false)).join(","))
    for (const {columns, list} of tables) {
        lines.push("")
        lines.push(columns.map(column => csvCell(L(column.title), false)).join(","))
        for (const row of list) lines.push(columns.map(column => csvCell(row[column.field], !!column.number)).join(","))
    }
    return lines.join("\r\n") + "\r\n"
}
// With output csv: the report's CSV and file name, the export audited with its row count.
function exported(p, reportId, title, answer, tables) {
    if (p.output !== "csv") return answer
    const rowCount = tables.reduce((sum, table) => sum + table.list.length, 0)
    ec.service
        .sync()
        .name("org.moqui.report.ReportServices.audit#Export")
        .parameters({kind: "customerservice", format: "csv", definitionId: "CustomerService." + reportId, rowCount})
        .call()
    return Object.assign(answer, {csvText: csvOf(L(title), answer, tables), fileName: reportId + "-" + dayOf(now()) + ".csv"})
}

// ===== the clocks read =====
// The clocks of the scope's queues and organizations (Mantle's CaseClockRequest, with each case's queue, type, channel and
// priority), never a clock a merge ended, by the report's filters; at most cap, with truncated set when more.
function clocksOf(scope, p, conditions, cap = readCap) {
    let query = find(CLOCK)
        .condition("requestCategoryId", "in", scope.queueIds)
        .condition("organizationPartyId", "in", scope.organizationPartyIds)
        .condition("stateEnumId", "not-equals", "SlsMerged")
    for (const [field, value] of [
        ["priorityBandEnumId", p.bandEnumId],
        ["serviceLevelPolicyId", p.serviceLevelPolicyId],
        ["salesChannelEnumId", p.salesChannelEnumId],
        ["requestTypeEnumId", p.requestTypeEnumId],
        ["clockEnumId", p.clockEnumId]
    ])
        if (!blank(value)) query = query.condition(field, String(value))
    for (const condition of conditions) query = condition(query)
    const list = Array.from(
        query
            .orderBy("startDate")
            .limit(cap + 1)
            .list()
    )
    return {list: list.slice(0, cap), truncated: list.length > cap}
}
const inRange = (field, from, thru) => query =>
    query.condition(field, "greater-equals", new Date(from)).condition(field, "less", new Date(thru))
const clockFilters = (p, scope) => [
    filterText(L("Priority"), p.bandEnumId, cs.enumText(p.bandEnumId)),
    filterText(
        L("Policy"),
        p.serviceLevelPolicyId,
        one("mantle.request.support.ServiceLevelPolicy", {serviceLevelPolicyId: p.serviceLevelPolicyId || "_NA_"})?.policyName
    ),
    filterText(L("Channel"), p.salesChannelEnumId, cs.enumText(p.salesChannelEnumId)),
    filterText(L("Type"), p.requestTypeEnumId, cs.enumText(p.requestTypeEnumId)),
    filterText(L("Clock"), p.clockEnumId, cs.enumText(p.clockEnumId))
]

// ===== get#SlaCompliance =====
// The clocks started in the period (a case's receipt, or a reopen's new resolution clock), each as it stood at the as-of
// time: met, missed (done late), closed without it (unmet), open past its due time, open within it, or cancelled. The rate is
// met over met, missed, unmet and open past due: a case still open past due counts against it (no survivor bias), one open
// within its target is shown but not yet decided, and cancellations are left out of the rate and shown apart.
function classify(row, asOf) {
    if (row.stateEnumId === "SlsCancelled") return "cancelled"
    const actual = msOf(row.actualDate)
    if (actual != null && actual <= asOf && ["SlsMet", "SlsMissed", "SlsUnmet"].includes(row.stateEnumId))
        return {SlsMet: "met", SlsMissed: "missed", SlsUnmet: "unmet"}[row.stateEnumId]
    const due = msOf(row.dueDate)
    const breached = msOf(row.breachedDate)
    return (due != null && due < asOf) || (breached != null && breached <= asOf) ? "openPastDue" : "openInTarget"
}
const complianceColumns = [
    {field: "groupText", title: "Group"},
    {field: "eligibleCount", title: "Counted", number: true},
    {field: "metCount", title: "Met", number: true},
    {field: "missedCount", title: "Missed", number: true},
    {field: "unmetCount", title: "Closed without it", number: true},
    {field: "openPastDueCount", title: "Open past due", number: true},
    {field: "openInTargetCount", title: "Open within target", number: true},
    {field: "rateText", title: "Compliance"},
    {field: "denominator", title: "Decided", number: true},
    {field: "cancelledCount", title: "Cancelled (not in the rate)", number: true},
    {field: "pausedText", title: "Paused (business time)"}
]
function slaCompliance(p) {
    const scope = scopeOf(p)
    const period = periodOf(p)
    const omitted = []
    const read = clocksOf(scope, p, [inRange("startDate", period.from, period.thru)])
    if (read.truncated) omitted.push(L("Only the first") + " " + readCap + " " + L("clocks were read; narrow the period."))
    const offered = ["queue", "team", "band", "policy", "channel", "clock"]
    const group = grouper(p.groupBy, offered, scope)
    const blankRow = () => ({
        eligibleCount: 0,
        metCount: 0,
        missedCount: 0,
        unmetCount: 0,
        openPastDueCount: 0,
        openInTargetCount: 0,
        cancelledCount: 0,
        pausedMinutes: 0
    })
    const add = (target, row) => {
        const kind = classify(row, period.asOf)
        target[kind + "Count"] += 1
        if (kind !== "cancelled") target.eligibleCount += 1
        target.pausedMinutes += Number(row.pausedMinutes || 0)
    }
    const finish = row => {
        const denominator = row.metCount + row.missedCount + row.unmetCount + row.openPastDueCount
        const rate = percentOf(row.metCount, denominator)
        return Object.assign(row, {
            denominator,
            rate,
            rateText: rate == null ? L("None decided") : percentText(rate),
            pausedText: minutesText(row.pausedMinutes),
            casesUrl:
                group.by === "queue" && row.groupKey !== "_NA_"
                    ? "/qapps/CustomerService/Cases/Cases?view=all&requestCategoryId=" + encodeURIComponent(row.groupKey)
                    : null
        })
    }
    const groupRows = grouped(read.list, group, blankRow, add, omitted).map(finish)
    const total = finish(Object.assign(blankRow(), {groupKey: "_ALL_", groupText: L("All")}))
    for (const row of read.list) add(total, row)
    finish(total)
    const answer = Object.assign(frame(scope, period, clockFilters(p, scope), omitted), {
        groupBy: group.by,
        groupLabel: L(groupLabels[group.by]),
        groupOptions: groupOptions(offered),
        groupRows,
        total
    })
    return exported(p, "ServiceLevelCompliance", "Service level compliance", answer, [
        {columns: complianceColumns, list: groupRows.concat([total])}
    ])
}

// ===== get#ResponseTimes =====
// The clocks of a metric done in the period (first response: an outward response the channel accepted, P4's rule, never an
// acknowledgement or a note; resolution: each resolution episode, a reopen its own), with their count, median, p90 and mean in
// business time (the clock's calendar, less its pauses) and elapsed time; and the clocks of the metric still open at the
// as-of time with their median age. Business time is counted for at most timedCap clocks.
const responseColumns = [
    {field: "groupText", title: "Group"},
    {field: "count", title: "Count", number: true},
    {field: "businessMedianText", title: "Median (business)"},
    {field: "businessP90Text", title: "p90 (business)"},
    {field: "businessMeanText", title: "Mean (business)"},
    {field: "elapsedMedianText", title: "Median (elapsed)"},
    {field: "elapsedP90Text", title: "p90 (elapsed)"},
    {field: "elapsedMeanText", title: "Mean (elapsed)"},
    {field: "businessMedianMinutes", title: "Median business minutes", number: true},
    {field: "elapsedMedianMinutes", title: "Median elapsed minutes", number: true},
    {field: "openCount", title: "Open", number: true},
    {field: "openAgeText", title: "Median open age (elapsed)"}
]
function responseTimes(p) {
    const scope = scopeOf(p)
    const period = periodOf(p)
    const omitted = []
    const clockEnumId = p.metric === "resolution" ? "SlcResolution" : "SlcFirstResponse"
    const params = Object.assign({}, p, {clockEnumId})
    const done = clocksOf(
        scope,
        params,
        [inRange("actualDate", period.from, period.thru), query => query.condition("stateEnumId", "in", ["SlsMet", "SlsMissed"])],
        timedCap
    )
    if (done.truncated) omitted.push(L("Only the first") + " " + timedCap + " " + L("clocks were timed; narrow the period."))
    const open = clocksOf(scope, params, [
        query => query.condition("startDate", "less", new Date(period.asOf)),
        query =>
            query.condition(
                ec.entity.conditionFactory.makeCondition(
                    [
                        ec.entity.conditionFactory.makeCondition("stateEnumId", "in", ["SlsRunning", "SlsPaused"]),
                        ec.entity.conditionFactory.makeCondition("actualDate", "greater-equals", new Date(period.asOf))
                    ],
                    "or"
                )
            ),
        query => query.condition("stateEnumId", "not-equals", "SlsCancelled")
    ])
    if (open.truncated) omitted.push(L("Only the first") + " " + readCap + " " + L("open clocks were read."))
    const ctx = time().forCall()
    const timed = done.list.map(row => {
        const start = msOf(row.startDate),
            actual = msOf(row.actualDate)
        const schedule = {
            key: row.calendarId || "_NA_",
            calendarId: row.calendarId || null,
            timeZone: row.timeZone || null,
            organizationPartyId: row.organizationPartyId || null
        }
        const business = Math.max(0, time().elapsedMinutes(ctx, schedule, start, actual) - Number(row.pausedMinutes || 0))
        return Object.assign({}, lib.map(row), {elapsed: (actual - start) / 60000, business})
    })
    const ages = open.list.map(row =>
        Object.assign({}, lib.map(row), {age: (period.asOf - msOf(row.startDate)) / 60000, open: true})
    )
    const offered = ["queue", "team", "band", "channel", "none"]
    const group = grouper(p.groupBy, offered, scope)
    const blankRow = () => ({business: [], elapsed: [], ages: []})
    const add = (target, row) => {
        if (row.open) target.ages.push(row.age)
        else {
            target.business.push(row.business)
            target.elapsed.push(row.elapsed)
        }
    }
    const finish = row => {
        const business = row.business.sort((a, b) => a - b),
            elapsed = row.elapsed.sort((a, b) => a - b),
            ages = row.ages.sort((a, b) => a - b)
        const out = Object.assign(row, {
            count: business.length,
            businessMedianMinutes: fact(percentile(business, 0.5)),
            businessP90Minutes: fact(percentile(business, 0.9)),
            businessMeanMinutes: fact(mean(business)),
            elapsedMedianMinutes: fact(percentile(elapsed, 0.5)),
            elapsedP90Minutes: fact(percentile(elapsed, 0.9)),
            elapsedMeanMinutes: fact(mean(elapsed)),
            openCount: ages.length,
            openAgeText: minutesText(percentile(ages, 0.5))
        })
        for (const key of ["businessMedian", "businessP90", "businessMean", "elapsedMedian", "elapsedP90", "elapsedMean"])
            out[key + "Text"] = minutesText(out[key + "Minutes"])
        delete out.business
        delete out.elapsed
        delete out.ages
        return out
    }
    const all = timed.concat(ages)
    const groupRows = grouped(all, group, blankRow, add, omitted).map(finish)
    const total = blankRow()
    for (const row of all) add(total, row)
    finish(Object.assign(total, {groupKey: "_ALL_", groupText: L("All")}))
    const answer = Object.assign(
        frame(
            scope,
            period,
            clockFilters(p, scope).concat([
                L("Metric") + ": " + L(clockEnumId === "SlcResolution" ? "Resolution" : "First response")
            ]),
            omitted
        ),
        {
            metric: clockEnumId === "SlcResolution" ? "resolution" : "firstResponse",
            metricText: L(clockEnumId === "SlcResolution" ? "Resolution, each episode" : "First response"),
            groupBy: group.by,
            groupLabel: L(groupLabels[group.by]),
            groupOptions: groupOptions(offered),
            groupRows,
            total
        }
    )
    return exported(p, "ResponseTimes", "Response times", answer, [{columns: responseColumns, list: groupRows.concat([total])}])
}

// ===== get#CaseVolumes =====
// Intake and backlog of the scope's queues in the period: received (each case once, a merged one's intake kept), resolved,
// reopened and cancelled (the status changes of the audit log), merged (the merges, apart from the cancellations), split off
// (new cases split from another, their lineage), assignments made, and the backlog open at the as-of time, where a merged case
// (cancelled into the kept one) is not counted again.
const volumeColumns = [
    {field: "groupText", title: "Group"},
    {field: "receivedCount", title: "Received", number: true},
    {field: "splitCount", title: "Of which split off", number: true},
    {field: "resolvedCount", title: "Resolved", number: true},
    {field: "reopenedCount", title: "Reopened", number: true},
    {field: "cancelledCount", title: "Cancelled", number: true},
    {field: "mergedCount", title: "Merged", number: true},
    {field: "assignedCount", title: "Assignments", number: true},
    {field: "backlogCount", title: "Open at the as-of time", number: true}
]
function caseVolumes(p) {
    const scope = scopeOf(p)
    const period = periodOf(p)
    const omitted = []
    const capped = (list, what) => {
        if (list.length > readCap)
            omitted.push(L("Only the first") + " " + readCap + " " + L(what) + " " + L("were read; narrow the period."))
        return list.slice(0, readCap)
    }
    const filtered = query => {
        for (const [field, value] of [
            ["requestTypeEnumId", p.requestTypeEnumId],
            ["salesChannelEnumId", p.salesChannelEnumId]
        ])
            if (!blank(value)) query = query.condition(field, String(value))
        return query.condition("requestCategoryId", "in", scope.queueIds)
    }
    // the cases of the scope among ids, by id (their queue, type, channel)
    const caseFacts = ids => {
        const out = new Map()
        for (const part of chunks(unique(ids)))
            for (const row of filtered(find(CASE).condition("requestId", "in", part)).list()) out.set(row.requestId, row)
        return out
    }
    const received = capped(
        Array.from(
            filtered(find(CASE))
                .condition("requestDate", "greater-equals", new Date(period.from))
                .condition("requestDate", "less", new Date(period.thru))
                .orderBy("requestDate")
                .limit(readCap + 1)
                .list()
        ),
        "cases"
    )
    const audit = capped(
        Array.from(
            find(AUDIT, {changedEntityName: REQUEST, changedFieldName: "statusId"})
                .condition("changedDate", "greater-equals", new Date(period.from))
                .condition("changedDate", "less", new Date(period.thru))
                .condition(
                    ec.entity.conditionFactory.makeCondition(
                        [
                            ec.entity.conditionFactory.makeCondition("newValueText", "in", ["ReqCompleted", "ReqCancelled"]),
                            ec.entity.conditionFactory.makeCondition("oldValueText", "equals", "ReqCompleted")
                        ],
                        "or"
                    )
                )
                .orderBy("changedDate")
                .limit(readCap + 1)
                .list()
        ),
        "status changes"
    )
    const relations = capped(
        Array.from(
            find(RELATION)
                .condition("relationTypeEnumId", "in", ["CrtMerge", "CrtSplit"])
                .condition("organizationPartyId", "in", scope.organizationPartyIds)
                .condition("relationDate", "greater-equals", new Date(period.from))
                .condition("relationDate", "less", new Date(period.thru))
                .limit(readCap + 1)
                .list()
        ),
        "merges and splits"
    )
    const assignments = capped(
        Array.from(
            find(CASE_PARTY, {roleTypeId: "Assignee"})
                .condition("requestCategoryId", "in", scope.queueIds)
                .condition("fromDate", "greater-equals", new Date(period.from))
                .condition("fromDate", "less", new Date(period.thru))
                .limit(readCap + 1)
                .list()
        ),
        "assignments"
    )
    const backlogIds = capped(
        Array.from(
            filtered(find(CASE))
                .condition("statusId", "in", openStatuses)
                .condition("requestDate", "less", new Date(period.asOf))
                .selectField("requestId")
                .limit(readCap + 1)
                .list()
        ).map(row => row.requestId),
        "open cases"
    )
    const merged = relations.filter(row => row.relationTypeEnumId === "CrtMerge")
    const mergedSources = new Set(merged.map(row => row.fromRequestId))
    const facts = caseFacts(
        audit
            .map(row => row.pkPrimaryValue)
            .concat(relations.map(row => (row.relationTypeEnumId === "CrtMerge" ? row.fromRequestId : row.toRequestId)))
            .concat(assignments.map(row => row.requestId))
            .concat(backlogIds)
    )
    const events = []
    const at = (row, value) => Object.assign({}, lib.map(row), {groupDateMs: msOf(value)})
    for (const row of received) events.push(Object.assign(at(row, row.requestDate), {kind: "received"}))
    for (const row of audit) {
        const facts_ = facts.get(row.pkPrimaryValue)
        if (!facts_) continue
        const kind =
            row.newValueText === "ReqCompleted"
                ? "resolved"
                : row.newValueText === "ReqCancelled"
                  ? mergedSources.has(row.pkPrimaryValue)
                      ? null
                      : "cancelled"
                  : row.oldValueText === "ReqCompleted" && openStatuses.includes(row.newValueText)
                    ? "reopened"
                    : null
        if (kind) events.push(Object.assign(at(facts_, row.changedDate), {kind}))
    }
    for (const row of relations) {
        const facts_ = facts.get(row.relationTypeEnumId === "CrtMerge" ? row.fromRequestId : row.toRequestId)
        if (facts_)
            events.push(
                Object.assign(at(facts_, row.relationDate), {kind: row.relationTypeEnumId === "CrtMerge" ? "merged" : "split"})
            )
    }
    for (const row of assignments) {
        const facts_ = facts.get(row.requestId)
        if (facts_) events.push(Object.assign(at(facts_, row.fromDate), {kind: "assigned"}))
    }
    const offered = ["queue", "team", "type", "channel", "day", "week", "month"]
    const group = grouper(p.groupBy, offered, scope)
    const dated = ["day", "week", "month"].includes(group.by)
    for (const requestId of backlogIds) {
        const facts_ = facts.get(requestId)
        if (facts_ && !dated) events.push(Object.assign(at(facts_, null), {kind: "backlog"}))
    }
    const blankRow = () => ({
        receivedCount: 0,
        splitCount: 0,
        resolvedCount: 0,
        reopenedCount: 0,
        cancelledCount: 0,
        mergedCount: 0,
        assignedCount: 0,
        backlogCount: 0
    })
    const add = (target, row) => (target[row.kind + "Count"] += 1)
    const groupRows = grouped(events, group, blankRow, add, omitted)
    if (dated) for (const row of groupRows) row.backlogCount = null
    const total = Object.assign(blankRow(), {groupKey: "_ALL_", groupText: L("All")})
    for (const row of events) add(total, row)
    if (dated) total.backlogCount = backlogIds.filter(id => facts.has(id)).length
    const answer = Object.assign(
        frame(
            scope,
            period,
            [
                filterText(L("Type"), p.requestTypeEnumId, cs.enumText(p.requestTypeEnumId)),
                filterText(L("Channel"), p.salesChannelEnumId, cs.enumText(p.salesChannelEnumId))
            ],
            omitted
        ),
        {
            groupBy: group.by,
            groupLabel: L(groupLabels[group.by]),
            groupOptions: groupOptions(offered),
            groupRows,
            total
        }
    )
    return exported(p, "CaseVolumes", "Case volumes", answer, [{columns: volumeColumns, list: groupRows.concat([total])}])
}

// ===== get#ReturnAnalysis =====
// The customer returns of the scope's organizations entered in the period (a cancelled one counted apart), of customers the
// user serves, each item as it stood at the as-of time: requested (every return, an open one counted as requested, never as
// credited), received, accepted and rejected (its receipts by then), replaced, and credited (its billing links settled by
// then); amounts per currency, for a holder of the amounts rule only.
const returnColumns = [
    {field: "groupText", title: "Group"},
    {field: "returnCount", title: "Returns", number: true},
    {field: "openReturnCount", title: "Open returns", number: true},
    {field: "itemCount", title: "Items", number: true},
    {field: "requestedQuantity", title: "Requested", number: true},
    {field: "receivedQuantity", title: "Received", number: true},
    {field: "acceptedQuantity", title: "Accepted", number: true},
    {field: "rejectedQuantity", title: "Rejected", number: true},
    {field: "replacedQuantity", title: "Replaced", number: true},
    {field: "creditedQuantity", title: "Credited", number: true}
]
const returnAmountColumns = [
    {field: "groupText", title: "Group"},
    {field: "currencyUomId", title: "Currency"},
    {field: "requestedAmount", title: "Requested amount", number: true},
    {field: "creditedAmount", title: "Credited amount", number: true},
    {field: "openAmount", title: "Of which open returns", number: true}
]
function returnAnalysis(p) {
    const scope = scopeOf(p)
    const period = periodOf(p, 90)
    const omitted = []
    if (!blank(p.customerPartyId) && !cs.customerOf(scope.userScope, String(p.customerPartyId)))
        denied("CUSTOMER_UNAVAILABLE", "Customer " + p.customerPartyId + " is not available")
    let headerQuery = find(HEADER)
        .condition("vendorPartyId", "in", scope.organizationPartyIds)
        .condition("entryDate", "greater-equals", new Date(period.from))
        .condition("entryDate", "less", new Date(period.thru))
    if (!blank(p.customerPartyId)) headerQuery = headerQuery.condition("customerPartyId", String(p.customerPartyId))
    const headerRows = Array.from(
        headerQuery
            .orderBy("entryDate")
            .limit(readCap + 1)
            .list()
    )
    if (headerRows.length > readCap)
        omitted.push(L("Only the first") + " " + readCap + " " + L("returns were read; narrow the period."))
    const served = new Map()
    const headers = headerRows.slice(0, readCap).filter(row => {
        if (!served.has(row.customerPartyId))
            served.set(
                row.customerPartyId,
                !cs.isInternal(row.customerPartyId) && !!cs.customerOf(scope.userScope, row.customerPartyId)
            )
        return served.get(row.customerPartyId)
    })
    const cancelledCount = headers.filter(row => row.statusId === "ReturnCancelled").length
    const live = headers.filter(row => row.statusId !== "ReturnCancelled")
    const headerOf = new Map(live.map(row => [row.returnId, row]))
    const ids = live.map(row => row.returnId)
    const items = [],
        receipts = [],
        billings = []
    for (const part of chunks(ids)) {
        let itemQuery = find(ITEM).condition("returnId", "in", part).condition("parentItemSeqId", "is-null", null)
        for (const [field, value] of [
            ["returnReasonEnumId", p.returnReasonEnumId],
            ["returnResponseEnumId", p.returnResponseEnumId],
            ["productId", p.productId]
        ])
            if (!blank(value)) itemQuery = itemQuery.condition(field, String(value))
        items.push(...Array.from(itemQuery.list()))
        receipts.push(
            ...Array.from(
                find(RECEIPT)
                    .condition("returnId", "in", part)
                    .condition("receivedDate", "less-equals", new Date(period.asOf))
                    .list()
            )
        )
        billings.push(...Array.from(find(BILLING).condition("returnId", "in", part).list()))
    }
    const keyOf = row => row.returnId + ":" + row.returnItemSeqId
    const sum = (list, field) => list.reduce((total, row) => total.add(dec(row[field])), dec(0))
    const receiptsOf = new Map(),
        billingsOf = new Map()
    for (const row of receipts) receiptsOf.set(keyOf(row), (receiptsOf.get(keyOf(row)) || []).concat([row]))
    for (const row of billings) {
        const settled = msOf(row.settledDate)
        if (settled != null && settled > period.asOf) continue
        billingsOf.set(keyOf(row), (billingsOf.get(keyOf(row)) || []).concat([row]))
    }
    const offered = ["reason", "product", "response", "customer", "disposition", "month"]
    const by = offered.includes(p.groupBy) ? p.groupBy : "reason"
    const productNames = new Map()
    const productName = productId => {
        if (!productNames.has(productId)) {
            const product = one("mantle.product.Product", {productId})
            productNames.set(
                productId,
                product ? [product.pseudoId || productId, product.productName].filter(Boolean).join(" · ") : productId
            )
        }
        return productNames.get(productId)
    }
    const group = {
        by,
        keyOf: row =>
            ({
                reason: row.returnReasonEnumId,
                product: row.productId,
                response: row.returnResponseEnumId,
                customer: headerOf.get(row.returnId)?.customerPartyId,
                disposition: row.inventoryStatusId,
                month: dayOf(msOf(headerOf.get(row.returnId)?.entryDate)).slice(0, 7)
            })[by] || "_NA_",
        labelOf: key =>
            key === "_NA_"
                ? L("None")
                : by === "reason"
                  ? cs.enumText(key).replace(/^\d+ /, "")
                  : by === "response"
                    ? cs.enumText(key)
                    : by === "product"
                      ? productName(key)
                      : by === "customer"
                        ? cs.partyName(key)
                        : by === "disposition"
                          ? cs.statusText(key)
                          : key
    }
    const blankRow = () => ({
        returns: new Set(),
        openReturns: new Set(),
        itemCount: 0,
        requested: dec(0),
        received: dec(0),
        accepted: dec(0),
        rejected: dec(0),
        replaced: dec(0),
        credited: dec(0),
        amounts: new Map()
    })
    const add = (target, item) => {
        const header = headerOf.get(item.returnId)
        const open = !closedReturnStatuses.includes(header.statusId)
        const mine = receiptsOf.get(keyOf(item)) || []
        const billed = billingsOf.get(keyOf(item)) || []
        target.returns.add(item.returnId)
        if (open) target.openReturns.add(item.returnId)
        target.itemCount += 1
        target.requested = target.requested.add(dec(item.returnQuantity))
        const accepted = sum(mine, "quantityAccepted"),
            rejected = sum(mine, "quantityRejected")
        target.received = target.received.add(accepted.add(rejected))
        target.accepted = target.accepted.add(accepted)
        target.rejected = target.rejected.add(rejected)
        target.replaced = target.replaced.add(dec(item.replacedQuantity))
        target.credited = target.credited.add(sum(billed, "quantity"))
        const currency = header.currencyUomId || "_NA_"
        const amounts = target.amounts.get(currency) || {requested: dec(0), credited: dec(0), open: dec(0)}
        const requested = dec(item.returnQuantity).multiply(dec(item.returnPrice))
        amounts.requested = amounts.requested.add(requested)
        if (open) amounts.open = amounts.open.add(requested)
        for (const row of billed) amounts.credited = amounts.credited.add(dec(row.quantity || 1).multiply(dec(row.amount)))
        target.amounts.set(currency, amounts)
    }
    const amountRows = []
    const finish = row => {
        const out = Object.assign(row, {
            returnCount: row.returns.size,
            openReturnCount: row.openReturns.size,
            requestedQuantity: quantityText(row.requested),
            receivedQuantity: quantityText(row.received),
            acceptedQuantity: quantityText(row.accepted),
            rejectedQuantity: quantityText(row.rejected),
            replacedQuantity: quantityText(row.replaced),
            creditedQuantity: quantityText(row.credited)
        })
        for (const [currencyUomId, amounts] of row.amounts.entries())
            amountRows.push({
                groupKey: row.groupKey,
                groupText: row.groupText,
                currencyUomId,
                requestedAmount: scope.amountRead ? String(lib.money(amounts.requested, currencyUomId)) : withheld,
                creditedAmount: scope.amountRead ? String(lib.money(amounts.credited, currencyUomId)) : withheld,
                openAmount: scope.amountRead ? String(lib.money(amounts.open, currencyUomId)) : withheld,
                requestedText: scope.amountRead ? money(amounts.requested, currencyUomId) : L(withheld),
                creditedText: scope.amountRead ? money(amounts.credited, currencyUomId) : L(withheld),
                openText: scope.amountRead ? money(amounts.open, currencyUomId) : L(withheld)
            })
        for (const key of [
            "returns",
            "openReturns",
            "requested",
            "received",
            "accepted",
            "rejected",
            "replaced",
            "credited",
            "amounts"
        ])
            delete out[key]
        return out
    }
    const groupRows = grouped(items, group, blankRow, add, omitted).map(finish)
    const total = Object.assign(blankRow(), {groupKey: "_ALL_", groupText: L("All")})
    for (const item of items) add(total, item)
    finish(total)
    if (!scope.amountRead) omitted.push(L("Amounts are withheld: they need a price or accounting view."))
    const answer = Object.assign(
        frame(
            scope,
            period,
            [
                filterText(L("Customer"), p.customerPartyId, cs.partyName(p.customerPartyId)),
                filterText(L("Reason"), p.returnReasonEnumId, cs.enumText(p.returnReasonEnumId)),
                filterText(L("Response"), p.returnResponseEnumId, cs.enumText(p.returnResponseEnumId)),
                filterText(L("Product"), p.productId, blank(p.productId) ? null : productName(p.productId))
            ],
            omitted
        ),
        {
            groupBy: by,
            groupLabel: L(groupLabels[by]),
            groupOptions: groupOptions(offered),
            groupRows,
            amountRows,
            total,
            cancelledCount,
            amountsWithheld: !scope.amountRead
        }
    )
    return exported(p, "ReturnAnalysis", "Return analysis", answer, [
        {columns: returnColumns, list: groupRows.concat([total])},
        {columns: returnAmountColumns, list: amountRows}
    ])
}

// ===== get#CustomerServiceStatistics (crosscut §3.2) =====
// One customer's service measures over a period, of the user's organizations' cases (a shared customer's others' left out):
// open cases now, clocks failed in the period (missed, closed without, or breached while open), the mean first response and
// resolution in business time with their counts, and the satisfaction answers' mean score and count (no comment).
function customerStatistics(p) {
    const scope = scopeOf(p, {customer: true})
    if (!cs.customerOf(scope.userScope, p.customerPartyId))
        denied("CUSTOMER_UNAVAILABLE", "Customer " + (p.customerPartyId || "") + " is not available")
    const days = Math.max(1, Math.min(731, Number(p.periodDays) || 90))
    const nowMs = now()
    const fromMs = nowMs - days * dayMs
    const ofCustomer = Array.from(
        find(CASE_PARTY, {roleTypeId: "Customer", partyId: p.customerPartyId})
            .condition("thruDate", null)
            .selectField("requestId")
            .selectField("statusId")
            .limit(readCap)
            .list()
    )
    const ours = new Set()
    for (const part of chunks(unique(ofCustomer.map(row => row.requestId))))
        for (const row of find(CASE_PARTY, {roleTypeId: "OrgInternal"})
            .condition("requestId", "in", part)
            .condition("partyId", "in", scope.organizationPartyIds)
            .selectField("requestId")
            .list())
            ours.add(row.requestId)
    const caseRows = ofCustomer.filter(row => ours.has(row.requestId))
    const ids = Array.from(ours)
    const clocks = []
    for (const part of chunks(ids))
        clocks.push(
            ...Array.from(
                find(EPISODE)
                    .condition("requestId", "in", part)
                    .condition("stateEnumId", "not-equals", "SlsMerged")
                    .condition("startDate", "less", new Date(nowMs))
                    .list()
            )
        )
    const inPeriod = value => msOf(value) != null && msOf(value) >= fromMs && msOf(value) < nowMs
    const failed = clocks.filter(
        row =>
            (["SlsMissed", "SlsUnmet"].includes(row.stateEnumId) && inPeriod(row.actualDate)) ||
            (["SlsRunning", "SlsPaused"].includes(row.stateEnumId) && inPeriod(row.breachedDate))
    )
    const decided = clocks.filter(
        row => ["SlsMet", "SlsMissed", "SlsUnmet"].includes(row.stateEnumId) && inPeriod(row.actualDate)
    )
    const ctx = time().forCall()
    const businessOf = row =>
        Math.max(
            0,
            time().elapsedMinutes(
                ctx,
                {
                    key: row.calendarId || "_NA_",
                    calendarId: row.calendarId || null,
                    timeZone: row.timeZone || null,
                    organizationPartyId: row.organizationPartyId || null
                },
                msOf(row.startDate),
                msOf(row.actualDate)
            ) - Number(row.pausedMinutes || 0)
        )
    const timed = clockEnumId =>
        clocks
            .filter(
                row =>
                    row.clockEnumId === clockEnumId &&
                    ["SlsMet", "SlsMissed"].includes(row.stateEnumId) &&
                    inPeriod(row.actualDate)
            )
            .slice(0, timedCap)
            .map(businessOf)
    const first = timed("SlcFirstResponse"),
        resolution = timed("SlcResolution")
    const answers = []
    for (const part of chunks(ids))
        answers.push(
            ...Array.from(
                find(INVITATION, {recordEntityName: REQUEST, statusEnumId: "FinResponded"})
                    .condition("recordId", "in", part)
                    .condition("score", "is-not-null", null)
                    .condition("responseDate", "greater-equals", new Date(fromMs))
                    .selectField("score")
                    .list()
            )
        )
    const scoreMean = mean(answers.map(row => Number(row.score)))
    const openCount = caseRows.filter(row => openStatuses.includes(row.statusId)).length
    const measures = [
        {key: "open", label: L("Open cases"), valueText: String(openCount), denominatorText: L("now"), url: "ServiceCases"},
        {
            key: "failed",
            label: L("Failed service levels"),
            valueText: String(failed.length),
            denominatorText:
                decided.length + failed.filter(row => !decided.includes(row)).length + " " + L("clocks decided or breached")
        },
        {
            key: "firstResponse",
            label: L("Mean first response"),
            valueText: first.length ? minutesText(mean(first)) : L("None"),
            denominatorText: first.length + " " + L("responses, business time")
        },
        {
            key: "resolution",
            label: L("Mean resolution"),
            valueText: resolution.length ? minutesText(mean(resolution)) : L("None"),
            denominatorText: resolution.length + " " + L("resolutions, business time")
        },
        {
            key: "satisfaction",
            label: L("Satisfaction"),
            valueText: scoreMean == null ? L("No answers") : ec.l10n.format(dec(scoreMean), "0.0"),
            denominatorText: answers.length + " " + L("answers")
        }
    ]
    return {
        measures,
        periodDays: days,
        periodText: dayOf(fromMs) + " " + L("to") + " " + dayOf(nowMs),
        asOfText: stampText(nowMs),
        casesUrl: "/qapps/CustomerService/Cases/Cases?view=all&customerPartyId=" + encodeURIComponent(p.customerPartyId)
    }
}

// ===== get#ServiceAgreements (crosscut §3.2 ServiceAgreements) =====
// The customer's service agreements (AgrService) with the user's organizations: the period, status, the products covered
// (none: every product), the warranty terms and whether it covers now; with whether the user may store one
// (SUPPORT_POLICY_EDIT, mantle.request.WarrantyServices.store#ServiceAgreement).
function serviceAgreements(p) {
    const userScope = cs.required()
    if (!cs.customerOf(userScope, p.customerPartyId))
        denied("CUSTOMER_UNAVAILABLE", "Customer " + (p.customerPartyId || "") + " is not available")
    const nowMs = now()
    const list = Array.from(
        find(AGREEMENT, {agreementTypeEnumId: "AgrService", otherPartyId: p.customerPartyId})
            .condition("organizationPartyId", "in", cs.vendorIds(userScope).length ? cs.vendorIds(userScope) : ["_NA_"])
            .orderBy("-fromDate")
            .limit(100)
            .list()
    )
    const agreementRows = list.map(row => {
        const items = rows("mantle.party.agreement.AgreementItem", {agreementId: row.agreementId})
        const terms = rows("mantle.party.agreement.AgreementTerm", {agreementId: row.agreementId, termTypeEnumId: "TtWarranty"})
        const from = msOf(row.fromDate),
            thru = msOf(row.thruDate)
        const active = row.statusId === "AgmStActive" && (from == null || from <= nowMs) && (thru == null || thru > nowMs)
        const products = unique(items.map(item => item.productId))
        return {
            agreementId: row.agreementId,
            organizationPartyId: row.organizationPartyId,
            organizationName: cs.partyName(row.organizationPartyId),
            description: row.description || "",
            typeText: cs.enumText(row.agreementTypeEnumId),
            periodText: [lib.dateText(row.fromDate), thru == null ? L("open-ended") : lib.dateText(row.thruDate)].join(" – "),
            statusText: cs.statusText(row.statusId),
            statusId: row.statusId,
            coverageText: active
                ? L("Covers now")
                : thru != null && thru <= nowMs
                  ? L("Ended")
                  : from != null && from > nowMs
                    ? L("Not started")
                    : L("Not active"),
            coverageColor: active ? "positive" : "grey-7",
            productsText: products.length
                ? products
                      .map(productId => {
                          const product = one("mantle.product.Product", {productId})
                          return product?.productName || productId
                      })
                      .join(", ")
                : L("Every product"),
            productId: products[0] || null,
            termsText: terms
                .map(term => term.termText)
                .filter(Boolean)
                .join(" "),
            fromDate: row.fromDate,
            thruDate: row.thruDate
        }
    })
    return {agreementRows, canStore: !!userScope.capabilities.policyEdit}
}

// ===== get#ReportCatalogue (design §7 Reports ReportCatalogue; Insights' registration, Z10) =====
// The reports Customer Service owns, each in Insights' catalog contract (design-insights §6.1: a stable entry id, its one
// owner, title, description, route, parameters and the capability that reads it, whether it exports), for the reports the
// user may read: the Reports area's grant, and SatisfactionResults for service management (P13, F186). CaseAnalytics opens
// from a case. No background export from the catalogue.
const catalogueEntries = [
    {
        entryId: "CustomerService.ServiceLevelCompliance",
        title: "Service level compliance",
        description:
            "Clocks met, missed and still open past due, by queue, team, priority, policy or channel; cancellations apart.",
        path: "Reports/ServiceLevelCompliance",
        parameters: "period, organization, queue, team, priority, policy, channel, clock, grouping",
        read: can => can.reports,
        exports: true
    },
    {
        entryId: "CustomerService.ResponseTimes",
        title: "Response times",
        description: "First response and resolution: count, median, p90 and mean in business and elapsed time, and open age.",
        path: "Reports/ResponseTimes",
        parameters: "period, organization, queue, team, priority, channel, metric, grouping",
        read: can => can.reports,
        exports: true
    },
    {
        entryId: "CustomerService.CaseVolumes",
        title: "Case volumes",
        description: "Received, resolved, reopened, cancelled and merged cases, assignments and the open backlog.",
        path: "Reports/CaseVolumes",
        parameters: "period, organization, queue, team, type, channel, grouping",
        read: can => can.reports,
        exports: true
    },
    {
        entryId: "CustomerService.ReturnAnalysis",
        title: "Return analysis",
        description:
            "Returns by reason, product, response or customer: requested, received, accepted, credited, amounts per currency.",
        path: "Reports/ReturnAnalysis",
        parameters: "period, organization, customer, reason, response, product, grouping",
        read: can => can.reports,
        exports: true
    },
    {
        entryId: "CustomerService.SatisfactionResults",
        title: "CSAT results",
        description: "Feedback answers of one form and period: response rate, score distribution and the answers.",
        path: "Reports/SatisfactionResults",
        parameters: "form, period, queue, team, customer, score",
        read: can => can.reports && can.caseManage,
        exports: false
    },
    {
        entryId: "CustomerService.CaseAnalytics",
        title: "Case analytics",
        description: "One case's clocks and events; opened from a case's Service level tab.",
        path: null,
        parameters: "case",
        read: can => can.reports,
        exports: false
    }
]
function catalogue() {
    const userScope = cs.required()
    const can = userScope.capabilities
    return {
        reports: catalogueEntries
            .filter(entry => entry.read(can))
            .map(entry => ({
                entryId: entry.entryId,
                ownerApp: "CustomerService",
                title: L(entry.title),
                description: L(entry.description),
                path: entry.path,
                url: entry.path ? "/qapps/CustomerService/" + entry.path : null,
                parameters: entry.parameters,
                exports: entry.exports,
                exportText: entry.exports ? L("CSV") : ""
            }))
    }
}

const operations = {slaCompliance, responseTimes, caseVolumes, returnAnalysis, customerStatistics, serviceAgreements, catalogue}
;({
    catalogueEntries,
    reportQueues,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service report operation " + op)
        return operations[op](parameters || {})
    }
})
