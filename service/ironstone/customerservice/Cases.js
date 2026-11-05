// Customer Service's case reads and batch (impl-customer-service P2; design-customer-service §3 Home, Cases, NewCase,
// CaseDetail; CaseServices.xml): every read is limited by CustomerService.js's scope (the user's organizations, the customers
// they serve, and the cases of their queues or assigned to them) in the query, and each row is checked again by recordOf; a
// missing case and a forbidden one are refused alike. The case's writes are Mantle's (mantle.request.SupportCaseServices),
// called after the check; apply#CaseBatch calls them per case in a transaction of its own and names each failure.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const {find, one, rows, denied, ms} = lib

const CASE = "mantle.request.support.CaseRequest",
    CASE_PARTY = "mantle.request.support.CaseRequestParty",
    REQUEST = "mantle.request.Request",
    PARTY = "mantle.request.RequestParty"
const openStatuses = ["ReqSubmitted", "ReqReviewed", "ReqInProgress", "ReqWaitingCustomer", "ReqOnHold"]
const dayMs = 86400000
const recentDays = 90
const factory = () => ec.entity.conditionFactory
const blank = value => value == null || String(value).trim() === ""
const listOf = value =>
    value == null
        ? []
        : (typeof value === "string" ? value.split(",") : Array.from(value))
              .map(String)
              .map(s => s.trim())
              .filter(Boolean)
const textOf = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy HH:mm"))
const dayText = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const L = text => ec.l10n.localize(text)

// ===== bands, statuses and colours =====
const bandRows = () =>
    rows("moqui.basic.Enumeration", {enumTypeId: "CasePriorityBand"}).sort((a, b) => (a.sequenceNum ?? 9) - (b.sequenceNum ?? 9))
const bandColors = {CpbUrgent: "negative", CpbHigh: "warning", CpbNormal: "primary", CpbLow: "grey-7"}
function bandOf(priority, bands = bandRows()) {
    const value = Number(priority ?? 5)
    return bands.find(row => value >= Number(row.enumCode) && value <= Number(row.optionValue)) || null
}
const categoryColors = {
    CscOpen: "primary",
    CscPaused: "warning",
    CscResolved: "positive",
    CscClosed: "grey-7",
    CscCancelled: "grey-7"
}
// The workflow's labels and categories by status (Mantle's mappings, the default workflow's where it maps none).
const mappingCache = {}
function mappingsOf(caseWorkflowId) {
    const key = caseWorkflowId || "CwfDefault"
    if (!mappingCache[key]) {
        const out = lib.call("mantle.request.SupportCaseServices.get#CaseStatusMappings", {caseWorkflowId: key})
        mappingCache[key] = {
            byStatus: Object.fromEntries(Array.from(out.mappingList || []).map(row => [row.statusId, row])),
            list: Array.from(out.mappingList || []),
            transitions: Array.from(out.transitionList || [])
        }
    }
    return mappingCache[key]
}
function statusFacts(caseWorkflowId, statusId) {
    const mapping = mappingsOf(caseWorkflowId).byStatus[statusId] || null
    return {
        statusLabel: mapping?.agentLabel || cs.statusText(statusId),
        customerStatusLabel: mapping?.customerLabel || cs.statusText(statusId),
        statusCategoryEnumId: mapping?.statusCategoryEnumId || null,
        statusColor: categoryColors[mapping?.statusCategoryEnumId] || "grey-7"
    }
}

// ===== the scope in a query =====
// The cases the user sees: in their queues, or assigned to them (restricted queues' only by their team, checked per row).
function assignedTo(partyId) {
    if (!partyId) return []
    return Array.from(
        find(CASE_PARTY, {partyId, roleTypeId: "Assignee"}).condition("thruDate", null).selectField("requestId").list()
    ).map(row => row.requestId)
}
function scopeCondition(userScope) {
    const conditions = []
    if (userScope.queueIds.length) conditions.push(factory().makeCondition("requestCategoryId", "in", userScope.queueIds))
    const mine = assignedTo(userScope.partyId)
    if (mine.length) conditions.push(factory().makeCondition("requestId", "in", mine))
    return conditions.length ? factory().makeCondition(conditions, "or") : factory().makeCondition("requestId", "equals", "_NA_")
}
// The case ids with a current party in a role (an assignee, a customer), for a filter.
const withParty = (roleTypeId, partyIds) =>
    Array.from(
        find(CASE_PARTY, {roleTypeId})
            .condition("partyId", "in", partyIds)
            .condition("thruDate", null)
            .selectField("requestId")
            .list()
    ).map(row => row.requestId)
const inIds = (field, ids) => factory().makeCondition(field, "in", ids.length ? ids : ["_NA_"])

// The saved views of design Cases: Assigned to me (the default), New/unassigned, Waiting for customer, Needs response (new
// and not yet answered), SLA risk (P4: none until service levels), Recently resolved (the last 7 days) and All permitted.
const views = {
    mine: "Assigned to me",
    unassigned: "New/unassigned",
    waiting: "Waiting for customer",
    needsResponse: "Needs response",
    slaRisk: "SLA risk",
    resolved: "Recently resolved",
    all: "All permitted"
}
function viewCondition(view, userScope) {
    switch (view) {
        case "mine":
            return inIds("requestId", assignedTo(userScope.partyId))
        case "unassigned": {
            const assigned = Array.from(
                find(CASE_PARTY, {roleTypeId: "Assignee"})
                    .condition("thruDate", null)
                    .condition("statusId", "in", openStatuses)
                    .condition("requestCategoryId", "in", userScope.queueIds.length ? userScope.queueIds : ["_NA_"])
                    .selectField("requestId")
                    .list()
            ).map(row => row.requestId)
            const open = factory().makeCondition("statusId", "in", openStatuses)
            return assigned.length
                ? factory().makeCondition([open, factory().makeCondition("requestId", "not-in", assigned)], "and")
                : open
        }
        case "waiting":
            return factory().makeCondition("statusId", "equals", "ReqWaitingCustomer")
        case "needsResponse":
            return factory().makeCondition("statusId", "equals", "ReqSubmitted")
        case "slaRisk":
            return factory().makeCondition("requestId", "equals", "_NA_")
        case "resolved":
            return factory().makeCondition(
                [
                    factory().makeCondition("statusId", "equals", "ReqCompleted"),
                    factory().makeCondition(
                        "lastUpdatedStamp",
                        "greater-equals",
                        new Date(Number(ms(ec.user.nowTimestamp)) - 7 * dayMs)
                    )
                ],
                "and"
            )
        default:
            return null
    }
}

// ===== rows =====
// The display of a page of cases, its parties, queues and tags read in one query each.
function decorate(list) {
    const ids = list.map(row => row.requestId)
    const parties = ids.length ? Array.from(find(PARTY).condition("requestId", "in", ids).condition("thruDate", null).list()) : []
    const roleOf = (requestId, roleTypeId) =>
        parties.find(row => row.requestId === requestId && row.roleTypeId === roleTypeId)?.partyId || null
    const names = lib.partyNames(parties.map(row => row.partyId))
    const tags = ids.length
        ? Array.from(find("mantle.request.RequestTag").condition("requestId", "in", ids).condition("thruDate", null).list())
        : []
    const bands = bandRows()
    // the revision Mantle checks (SupportCases.js revisionOf): the request's last change or its assignee's
    const assigneeStamps = {}
    if (ids.length)
        for (const party of find(PARTY).condition("requestId", "in", ids).condition("roleTypeId", "Assignee").list())
            assigneeStamps[party.requestId] = Math.max(
                assigneeStamps[party.requestId] || 0,
                Number(ms(party.lastUpdatedStamp) || 0)
            )
    return list.map(row => {
        const customerPartyId = roleOf(row.requestId, "Customer")
        const assigneePartyId = roleOf(row.requestId, "Assignee")
        const band = bandOf(row.priority, bands)
        const due = row.responseRequiredDate ? Number(ms(row.responseRequiredDate)) : null
        return Object.assign(
            {
                requestId: row.requestId,
                requestName: row.requestName || row.requestId,
                customerPartyId,
                customerName: names[customerPartyId] || "",
                organizationPartyId: roleOf(row.requestId, "OrgInternal"),
                assigneePartyId,
                assigneeName: assigneePartyId ? names[assigneePartyId] || assigneePartyId : "",
                requestCategoryId: row.requestCategoryId,
                queueName: cs.queueName(row.requestCategoryId),
                requestTypeEnumId: row.requestTypeEnumId,
                typeText: cs.enumText(row.requestTypeEnumId),
                statusId: row.statusId,
                priority: row.priority,
                bandEnumId: band?.enumId || null,
                bandText: band ? band.description + " (" + row.priority + ")" : String(row.priority ?? ""),
                bandColor: bandColors[band?.enumId] || "grey-7",
                channelText: cs.enumText(row.salesChannelEnumId),
                dueText: due ? textOf(due) : "",
                overdue: !!due && due < Number(ms(ec.user.nowTimestamp)) && openStatuses.includes(row.statusId),
                requestDateText: textOf(row.requestDate),
                updatedText: textOf(row.lastUpdatedStamp),
                tagText: tags
                    .filter(tag => tag.requestId === row.requestId)
                    .map(tag => cs.enumText(tag.tagEnumId))
                    .join(", "),
                caseRevision: Math.max(Number(ms(row.lastUpdatedStamp) || 0), assigneeStamps[row.requestId] || 0),
                url: "/qapps/CustomerService/Cases/CaseDetail?requestId=" + encodeURIComponent(row.requestId)
            },
            statusFacts(row.caseWorkflowId, row.statusId)
        )
    })
}

// ===== find#Cases =====
function casesQuery(userScope, p) {
    let query = find(CASE).condition(scopeCondition(userScope))
    const view = Object.hasOwn(views, p.view || "") ? p.view : p.recentFor ? "all" : "mine"
    const byView = viewCondition(view, userScope)
    if (byView) query = query.condition(byView)
    const term = String(p.text || "").trim()
    if (term)
        query = query.condition(
            factory().makeCondition(
                ["requestId", "requestName"].map(field => factory().makeCondition(field, "like", cs.likeText(term)).ignoreCase()),
                "or"
            )
        )
    for (const [field, value] of [
        ["requestTypeEnumId", p.requestTypeEnumId],
        ["requestCategoryId", p.requestCategoryId],
        ["salesChannelEnumId", p.salesChannelEnumId]
    ])
        if (!blank(value)) query = query.condition(field, "in", listOf(value))
    if (!blank(p.statusId)) query = query.condition("statusId", "in", listOf(p.statusId))
    if (!blank(p.statusCategoryEnumId)) {
        const categories = listOf(p.statusCategoryEnumId)
        const statuses = mappingsOf(null)
            .list.filter(row => categories.includes(row.statusCategoryEnumId))
            .map(row => row.statusId)
        query = query.condition(inIds("statusId", statuses))
    }
    if (!blank(p.bandEnumId)) {
        const band = bandRows().find(row => row.enumId === p.bandEnumId)
        if (band)
            query = query.condition(
                factory().makeCondition(
                    [
                        factory().makeCondition("priority", "greater-equals", Number(band.enumCode)),
                        factory().makeCondition("priority", "less-equals", Number(band.optionValue))
                    ],
                    "and"
                )
            )
    }
    if (!blank(p.customerPartyId)) query = query.condition(inIds("requestId", withParty("Customer", listOf(p.customerPartyId))))
    if (!blank(p.assigneePartyId)) query = query.condition(inIds("requestId", withParty("Assignee", listOf(p.assigneePartyId))))
    if (!blank(p.teamPartyId)) {
        const teamQueues = cs
            .currentQueues()
            .filter(row => listOf(p.teamPartyId).includes(row.responsibleTeamPartyId))
            .map(row => row.requestCategoryId)
        query = query.condition(inIds("requestCategoryId", teamQueues))
    }
    if (!blank(p.tagEnumId)) {
        const tagged = Array.from(
            find("mantle.request.RequestTag")
                .condition("tagEnumId", "in", listOf(p.tagEnumId))
                .condition("thruDate", null)
                .selectField("requestId")
                .list()
        ).map(row => row.requestId)
        query = query.condition(inIds("requestId", tagged))
    }
    if (p.fromDate) query = query.condition("requestDate", "greater-equals", p.fromDate)
    if (p.thruDate) query = query.condition("requestDate", "less", p.thruDate)
    // the Recent cases read (CaseDetail's pane, NewCase's duplicate warning): the customer's other cases open or changed in
    // the last 90 days
    if (p.recentFor) {
        query = query.condition(inIds("requestId", withParty("Customer", [p.recentFor])))
        query = query.condition(
            factory().makeCondition(
                [
                    factory().makeCondition("statusId", "in", openStatuses),
                    factory().makeCondition(
                        "lastUpdatedStamp",
                        "greater-equals",
                        new Date(Number(ms(ec.user.nowTimestamp)) - recentDays * dayMs)
                    )
                ],
                "or"
            )
        )
        if (p.excludeRequestId) query = query.condition(factory().makeCondition("requestId", "not-equals", p.excludeRequestId))
    }
    return {query, view}
}
function findCases(p) {
    const userScope = cs.required()
    if (p.recentFor && !cs.customerOf(userScope, p.recentFor)) return emptyPage(p)
    // a find is used once: one for the count, one for the page
    const {query: counted, view} = casesQuery(userScope, p)
    const count = counted.count()
    const found = lib.page(casesQuery(userScope, p).query.orderBy(p.orderByField || "-requestDate"), p, "cases", count)
    // each row checked again: one out of scope (a restricted queue's case assigned elsewhere) is left out, not shown
    const visible = found.rows.filter(row => {
        try {
            cs.recordOf(userScope, "case", row.requestId)
            return true
        } catch (error) {
            return false
        }
    })
    return Object.assign(pageFields(found), {
        cases: decorate(visible),
        view,
        viewText: views[view],
        views: Object.entries(views).map(([key, label]) => ({key, label, current: key === view}))
    })
}
const pageFields = found => ({
    casesCount: found.casesCount,
    casesPageIndex: found.casesPageIndex,
    casesPageSize: found.casesPageSize,
    casesPageMaxIndex: found.casesPageMaxIndex,
    casesPageRangeLow: found.casesPageRangeLow,
    casesPageRangeHigh: found.casesPageRangeHigh
})
const emptyPage = () => ({
    cases: [],
    casesCount: 0,
    casesPageIndex: 0,
    casesPageSize: 20,
    casesPageMaxIndex: 0,
    casesPageRangeLow: 0,
    casesPageRangeHigh: 0,
    view: "all",
    viewText: views.all,
    views: []
})

// ===== get#QueueCounts =====
// Per queue the user works: open and unassigned cases, and breached (P4, not configured until then); with the totals and
// the overdue count (Home's KPI strip).
function queueCounts() {
    const userScope = cs.required()
    const now = new Date(Number(ms(ec.user.nowTimestamp)))
    const queues = cs.currentQueues().filter(row => userScope.queueIds.includes(row.requestCategoryId))
    const assigned = new Set(
        userScope.queueIds.length
            ? Array.from(
                  find(CASE_PARTY, {roleTypeId: "Assignee"})
                      .condition("thruDate", null)
                      .condition("statusId", "in", openStatuses)
                      .condition("requestCategoryId", "in", userScope.queueIds)
                      .selectField("requestId")
                      .list()
              ).map(row => row.requestId)
            : []
    )
    const queueRows = queues
        .map(queue => {
            const open = Array.from(
                find(CASE, {requestCategoryId: queue.requestCategoryId})
                    .condition("statusId", "in", openStatuses)
                    .selectField("requestId")
                    .selectField("responseRequiredDate")
                    .list()
            )
            return {
                requestCategoryId: queue.requestCategoryId,
                queueName: cs.queueName(queue.requestCategoryId),
                teamName: queue.responsibleTeamPartyId ? cs.partyName(queue.responsibleTeamPartyId) : "",
                openCount: open.length,
                unassignedCount: open.filter(row => !assigned.has(row.requestId)).length,
                overdueCount: open.filter(row => row.responseRequiredDate && Number(ms(row.responseRequiredDate)) < Number(now))
                    .length,
                breachedText: L("Not configured"),
                url:
                    "/qapps/CustomerService/Cases/Cases?view=all&requestCategoryId=" + encodeURIComponent(queue.requestCategoryId)
            }
        })
        .sort((a, b) => a.queueName.localeCompare(b.queueName))
    const sum = field => queueRows.reduce((total, row) => total + row[field], 0)
    return {queueRows, openCount: sum("openCount"), unassignedCount: sum("unassignedCount"), overdueCount: sum("overdueCount")}
}

// ===== find#ServiceCustomers (F30) =====
// The customers the user serves by name or id, email or phone, in the query, each with its open case count.
function serviceCustomers(p) {
    const userScope = cs.required()
    const term = String(p.term || "").trim()
    if (!term) return {customers: []}
    const limit = 30
    const ids = new Set()
    for (const row of cs
        .customerFind(userScope)
        .condition(
            factory().makeCondition(
                ["partyId", "pseudoId", "organizationName", "firstName", "lastName"].map(field =>
                    factory().makeCondition(field, "like", cs.likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
        .selectField("partyId")
        .distinct(true)
        .limit(limit)
        .list())
        ids.add(row.partyId)
    // by email or phone: the contact mechanisms' parties, kept to the customers the user serves
    const mechIds = Array.from(
        find("mantle.party.contact.ContactMech")
            .condition(factory().makeCondition("infoString", "like", cs.likeText(term)).ignoreCase())
            .selectField("contactMechId")
            .limit(limit)
            .list()
    ).map(row => row.contactMechId)
    const digits = term.replace(/[^0-9]/g, "")
    // P3: the number as typed (with its separators, as contactNumber keeps them) or its digits alone
    if (digits.length >= 4)
        for (const row of find("mantle.party.contact.TelecomNumber")
            .condition(
                factory().makeCondition(
                    [
                        factory().makeCondition("contactNumber", "like", cs.likeText(term)),
                        factory().makeCondition("contactNumber", "like", "%" + digits + "%")
                    ],
                    "or"
                )
            )
            .selectField("contactMechId")
            .limit(limit)
            .list())
            mechIds.push(row.contactMechId)
    if (mechIds.length)
        for (const row of find("mantle.party.contact.PartyContactMech")
            .condition("contactMechId", "in", mechIds)
            .selectField("partyId")
            .list())
            if (ids.size < limit && cs.customerOf(userScope, row.partyId)) ids.add(row.partyId)
    const customerIds = Array.from(ids).filter(partyId => cs.customerOf(userScope, partyId))
    const contact = (partyId, type) => {
        const mech = rows("mantle.party.contact.PartyContactMech", {partyId})
            .filter(row => lib.active(row))
            .map(row => one("mantle.party.contact.ContactMech", {contactMechId: row.contactMechId}))
            .find(row => row?.contactMechTypeEnumId === type)
        if (!mech) return ""
        if (type === "CmtEmailAddress") return mech.infoString || ""
        const phone = one("mantle.party.contact.TelecomNumber", {contactMechId: mech.contactMechId})
        return phone ? [phone.areaCode, phone.contactNumber].filter(Boolean).join(" ") : ""
    }
    return {
        customers: customerIds.map(partyId => ({
            partyId,
            name: cs.partyName(partyId),
            email: contact(partyId, "CmtEmailAddress"),
            phone: contact(partyId, "CmtTelecomNumber"),
            openCaseCount: find(CASE)
                .condition(scopeCondition(userScope))
                .condition("statusId", "in", openStatuses)
                .condition(inIds("requestId", withParty("Customer", [partyId])))
                .count()
        }))
    }
}

// ===== prepare#Case (NewCase) =====
// What NewCase offers for the user and its choices so far: the organizations with Customer Service configured, the types
// the organization service-enables with their customer labels, the queues offering the type, the defaults (the type's
// queue and priority, else the policy's queue), the priority bands, and the customer's open or recent cases (the
// duplicate warning; another customer's are never shown).
function prepareCase(p) {
    const userScope = cs.required()
    const organizations = cs
        .vendorIds(userScope)
        .filter(hasPolicy)
        .map(partyId => ({value: partyId, label: cs.partyName(partyId)}))
    const organizationPartyId =
        organizations.find(row => row.value === p.organizationPartyId)?.value ||
        organizations.find(row => row.value === userScope.activeOrganizationPartyId)?.value ||
        organizations[0]?.value ||
        null
    const types = organizationPartyId ? currentTypes(organizationPartyId) : []
    const requestTypeEnumId =
        types.find(row => row.requestTypeEnumId === p.requestTypeEnumId)?.requestTypeEnumId || types[0]?.requestTypeEnumId || null
    const type = types.find(row => row.requestTypeEnumId === requestTypeEnumId) || null
    const policy = organizationPartyId ? currentPolicy(organizationPartyId) : null
    const queues = cs
        .currentQueues()
        .filter(
            row =>
                userScope.queueIds.includes(row.requestCategoryId) && cs.queueOwner(row.requestCategoryId) === organizationPartyId
        )
        .filter(row => {
            const offered = listOf(row.offeredTypeEnumIds)
            return !offered.length || offered.includes(requestTypeEnumId)
        })
        .map(row => ({value: row.requestCategoryId, label: cs.queueName(row.requestCategoryId)}))
    const preferred = [p.requestCategoryId, type?.defaultCategoryId, policy?.defaultCategoryId]
    const requestCategoryId = preferred.find(id => id && queues.some(row => row.value === id)) || queues[0]?.value || null
    const customer = p.customerPartyId ? cs.customerOf(userScope, p.customerPartyId) : null
    const duplicates = customer
        ? findCases({recentFor: p.customerPartyId, pageSize: 10}).cases.filter(row => openStatuses.includes(row.statusId))
        : []
    return {
        organizations,
        organizationPartyId,
        typeOptions: types.map(row => ({
            value: row.requestTypeEnumId,
            label: row.customerLabel || cs.enumText(row.requestTypeEnumId)
        })),
        requestTypeEnumId,
        queueOptions: queues,
        requestCategoryId,
        priority: String(type?.defaultPriority ?? 5),
        bandOptions: bandRows().map(row => ({
            value: row.enumCode,
            label: row.description + " (" + row.enumCode + "–" + row.optionValue + ")"
        })),
        customerFound: !!customer,
        customerName: customer ? cs.partyName(p.customerPartyId) : "",
        duplicates,
        configured: organizations.length > 0
    }
}
const currentRowsOf = (entity, conditions) =>
    Array.from(
        find(entity, conditions)
            .condition(factory().makeCondition("fromDate", "is-not-null", null))
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .orderBy("-fromDate")
            .list()
    )
const currentPolicy = organizationPartyId =>
    currentRowsOf("mantle.request.support.ServicePolicy", {organizationPartyId})[0] || null
const hasPolicy = organizationPartyId => !!currentPolicy(organizationPartyId)
function currentTypes(organizationPartyId) {
    const seen = new Set()
    return currentRowsOf("mantle.request.support.ServiceRequestType", {organizationPartyId, serviceEnabled: "Y"}).filter(
        row => !seen.has(row.requestTypeEnumId) && seen.add(row.requestTypeEnumId)
    )
}

// ===== get#CaseDetail (CaseDetail's Customer Service context) =====
function caseDetail(p) {
    const userScope = cs.required()
    cs.recordOf(userScope, "case", p.requestId)
    const row = one(CASE, {requestId: p.requestId})
    const [decorated] = decorate([row])
    const parties = rows(PARTY, {requestId: p.requestId}).filter(party => lib.active(party))
    const contactPartyId = parties.find(party => party.roleTypeId === "Reporter")?.partyId || null
    const me = userScope.partyId
    const mine = !decorated.assigneePartyId || decorated.assigneePartyId === me
    const canEdit = !!userScope.capabilities.caseEdit && (mine || !!userScope.capabilities.caseManage)
    const open = !["ReqCompleted", "ReqCancelled"].includes(row.statusId)
    const workflow = mappingsOf(row.caseWorkflowId)
    const moves = workflow.transitions
        .filter(move => move.statusId === row.statusId)
        .filter(move => move.manageRequired !== "Y" || userScope.capabilities.caseManage)
        .map(move => ({
            toStatusId: move.toStatusId,
            label: statusFacts(row.caseWorkflowId, move.toStatusId).statusLabel,
            resolutionRequired: move.resolutionRequired === "Y",
            reasonRequired: move.reasonRequired === "Y",
            closes: ["ReqCompleted", "ReqCancelled"].includes(move.toStatusId),
            reopens: row.statusId === "ReqCompleted"
        }))
    const work = rows("mantle.request.RequestWorkEffort", {requestId: p.requestId})
        .map(link => one("mantle.work.effort.WorkEffort", {workEffortId: link.workEffortId}))
        .filter(item => item && item.workEffortTypeEnumId === "WetTask")
        .map(item => ({
            workEffortId: item.workEffortId,
            workEffortName: item.workEffortName || item.workEffortId,
            statusText: cs.statusText(item.statusId),
            dueText: dayText(item.estimatedCompletionDate),
            url:
                "/qapps/CustomerService/Cases/WorkItemDetail?workEffortId=" +
                encodeURIComponent(item.workEffortId) +
                "&requestId=" +
                encodeURIComponent(p.requestId)
        }))
    // P3: each linked record with its kind and, when the user may work with it here, its Customer Service screen (an order,
    // shipment, invoice, customer or case); another record keeps its id only
    const links = rows("mantle.request.RequestRecord", {requestId: p.requestId}).map(link => {
        const kind = cs.kindOfEntity(link.recordEntityName)
        let url = null,
            label = null
        if (kind)
            try {
                const record = cs.recordOf(userScope, kind, link.recordId)
                url = cs.recordUrl(kind, link.recordId)
                label = record.kindName + " " + link.recordId + (record.detail ? " · " + record.detail : "")
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.warn("Case " + p.requestId + " link " + link.recordId + ": " + error.message)
            }
        return {
            recordEntityName: link.recordEntityName,
            recordId: link.recordId,
            recordText: label || link.recordEntityName.split(".").pop() + " " + link.recordId,
            url,
            linkedText: textOf(link.linkedDate)
        }
    })
    const tags = rows("mantle.request.RequestTag", {requestId: p.requestId})
        .filter(tag => !tag.thruDate)
        .map(tag => ({tagEnumId: tag.tagEnumId, label: cs.enumText(tag.tagEnumId)}))
    const recent = decorated.customerPartyId
        ? findCases({recentFor: decorated.customerPartyId, excludeRequestId: p.requestId, pageSize: 10}).cases
        : []
    const profile = one("mantle.request.support.CaseProfile", {requestId: p.requestId})
    return {
        theCase: Object.assign(decorated, {
            description: row.description || "",
            contactPartyId,
            contactName: contactPartyId ? cs.partyName(contactPartyId) : "",
            organizationName: cs.partyName(decorated.organizationPartyId),
            filedByName: row.filedByPartyId ? cs.partyName(row.filedByPartyId) : "",
            intakeText: textOf(profile?.intakeDate),
            resolutionText:
                row.requestResolutionEnumId && row.requestResolutionEnumId !== "RrUnresolved"
                    ? cs.enumText(row.requestResolutionEnumId)
                    : "",
            projectId: row.rootWorkEffortId || null,
            open
        }),
        moves,
        work,
        links,
        tags,
        recent,
        canEdit: canEdit && open,
        canTransition: canEdit,
        canManage: !!userScope.capabilities.caseManage
    }
}

// ===== apply#CaseBatch =====
// One change on each selected case (design BulkCaseAction): assign, status (with a resolution or reason), priority, queue or
// tags, each case checked and changed in a transaction of its own, with an outcome per case: Done, StaleCase,
// AssigneeUnavailable, Forbidden (another organization's, out of scope, or a permission the user lacks) or Failed with its
// message; the others go on. An operation key answers a retry with the first result (CX-POSTING).
const outcomeOf = {
    STALE_CASE: "StaleCase",
    ASSIGNEE_UNAVAILABLE: "AssigneeUnavailable",
    RECORD_UNAVAILABLE: "Forbidden",
    PERMISSION_DENIED: "Forbidden"
}
function applyBatch(p) {
    const userScope = cs.required()
    const ids = Array.from(new Set(listOf(p.requestIds))).slice(0, 200)
    if (!ids.length) denied("SELECTION_REQUIRED", "Select the cases first")
    const operation = String(p.operation || "")
    const services = {
        assign: "update#Case",
        priority: "update#Case",
        queue: "update#Case",
        status: "transition#Case",
        tags: "set#CaseTags"
    }
    if (!services[operation]) denied("OPERATION_UNKNOWN", "Unknown case change " + operation)
    const request = {
        ids,
        operation,
        assigneePartyId: p.assigneePartyId || null,
        toStatusId: p.toStatusId || null,
        priority: p.priority || null,
        requestCategoryId: p.requestCategoryId || null,
        tagEnumIds: listOf(p.tagEnumIds)
    }
    const organizationPartyId = userScope.activeOrganizationPartyId || userScope.organizationPartyIds[0] || "_NA_"
    const op = p.operationKey ? lib.operation(p, "CaseBatch", organizationPartyId, request) : null
    const earlier = op ? lib.previous(op) : null
    if (earlier) return earlier
    const revisions = p.revisions && typeof p.revisions === "object" ? p.revisions : {}
    const results = []
    for (const requestId of ids) {
        try {
            cs.recordOf(userScope, "case", requestId)
        } catch (error) {
            results.push({requestId, outcome: "Forbidden", message: L("Not available to you")})
            continue
        }
        const parameters = {requestId, caseRevision: revisions[requestId] ?? null}
        if (operation === "assign") parameters.assigneePartyId = p.assigneePartyId || ""
        if (operation === "priority") parameters.priority = p.priority
        if (operation === "queue") parameters.requestCategoryId = p.requestCategoryId
        if (operation === "status")
            Object.assign(parameters, {
                toStatusId: p.toStatusId,
                resolutionEnumId: p.resolutionEnumId || null,
                reason: p.reason || null
            })
        if (operation === "tags") Object.assign(parameters, {tagEnumIds: listOf(p.tagEnumIds), mode: p.tagMode || "add"})
        ec.message.pushErrors()
        try {
            ec.service
                .sync()
                .name("mantle.request.SupportCaseServices." + services[operation])
                .parameters(parameters)
                .requireNewTransaction(true)
                .call()
            if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
            results.push({requestId, outcome: "Done", message: ""})
        } catch (error) {
            const code = lib.reasonCode(error) || (/([A-Z][A-Z0-9_]+):/.exec(String(error.message || "")) || [])[1]
            results.push({
                requestId,
                outcome: outcomeOf[code] || "Failed",
                message: String(error.message || error).split("\n")[0]
            })
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    const done = results.filter(row => row.outcome === "Done").length
    const failed = results.filter(row => row.outcome !== "Done")
    const result = {
        results,
        doneCount: done,
        failedCount: failed.length,
        message: failed.length
            ? ec.resource.expand("${done} done, ${failed} not: ${list}", "", {
                  done,
                  failed: failed.length,
                  list: failed
                      .slice(0, 5)
                      .map(row => row.requestId + " " + row.outcome)
                      .join("; ")
              })
            : ec.resource.expand("${done} done", "", {done})
    }
    if (op) lib.complete(op, null, null, result)
    return result
}

// ===== get#TodayItems =====
// The user's own open cases due by the end of the range or overdue (Today, in place of Commons' request rows for a case,
// F9, F63), each opening CaseDetail. Another user's Today, and a user without Customer Service, get none.
function today(p) {
    const label = "Cases"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = cs.scope()
    if (!userScope.read || !userScope.partyId) return {items: [], label}
    const until = p.thruDate ? Number(ms(p.thruDate)) : Number(ms(ec.user.nowTimestamp)) + dayMs
    const from = p.fromDate ? Number(ms(p.fromDate)) : Number(ms(ec.user.nowTimestamp))
    const mine = assignedTo(userScope.partyId)
    if (!mine.length) return {items: [], label}
    const list = Array.from(
        find(CASE)
            .condition("requestId", "in", mine)
            .condition("statusId", "in", openStatuses)
            .condition("responseRequiredDate", "less", new Date(until))
            .orderBy("responseRequiredDate")
            .limit(50)
            .list()
    )
    return {
        label,
        items: list.map(row => ({
            kind: "case",
            workEffortId: null,
            requestId: row.requestId,
            title: "Case " + row.requestId + " · " + (row.requestName || ""),
            dueDate: row.responseRequiredDate,
            overdue: Number(ms(row.responseRequiredDate)) < from,
            startDate: null,
            endDate: null,
            allDay: false,
            priority: row.priority ?? null,
            statusId: row.statusId,
            assignees: [],
            canUpdate: false,
            hasCallLink: false,
            url: "/qapps/CustomerService/Cases/CaseDetail?requestId=" + encodeURIComponent(row.requestId),
            record: {
                recordEntityName: REQUEST,
                recordId: row.requestId,
                recordName: "Case " + row.requestId + " · " + (row.requestName || "")
            }
        }))
    }
}

const operations = {findCases, queueCounts, serviceCustomers, prepareCase, caseDetail, applyBatch, today}
;({
    openStatuses,
    bandRows,
    mappingsOf,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service case operation " + op)
        return operations[op](parameters || {})
    }
})
