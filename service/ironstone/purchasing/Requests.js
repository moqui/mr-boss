// Purchasing's purchase request reads (design-purchasing §4 Requests, RequestDetail, RequestSourcing; crosscut §3.11;
// impl-purchasing P10): the Requests list (find#PurchaseRequests: the purchase requests of the user's organizations, a
// requester's own and assigned ones only, by view: My requests, Awaiting sourcing, Due, All, with what is approved, sourced
// and left of each), RequestDetail's Purchasing branch (get#RequestDetail: the Mantle progress with the history of its lines
// and the actions the user's capabilities allow), the Today source of requests due to source, Home's unsourced count, the
// Items tab rows and "Create purchase order" link of the other apps' RequestDetail, and OrderDetail's Sources. The writes
// are mantle.request.RequestServices' (create#PurchaseRequest, store# and delete#PurchaseRequestItem, submit#,
// decide#PurchaseRequestApproval, cancel#PurchaseRequest, preview# and convert#PurchaseSourcing), which check their
// permissions and the organization again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, ms, dateText} = lib

const REQUEST = "mantle.request.Request",
    ITEM = "mantle.request.RequestItem"
const purchaseType = "RqtPurchase"
const openStatuses = ["ReqDraft", "ReqSubmitted", "ReqReviewed", "ReqInProgress"]
const closedStatuses = ["ReqCompleted", "ReqCancelled"]
// at most this many requests are read for a list's view, newest first (a warning past it)
const readLimit = 500
const dueDays = 7
const dayMs = 24 * 60 * 60 * 1000
const views = {
    mine: {label: "My requests"},
    sourcing: {label: "Awaiting sourcing", statuses: ["ReqInProgress"], sourcing: true},
    due: {label: "Due", statuses: openStatuses, due: true},
    all: {label: "All"}
}
const statusColors = {
    ReqDraft: "grey-8",
    ReqSubmitted: "warning",
    ReqReviewed: "warning",
    ReqInProgress: "primary",
    ReqCompleted: "positive",
    ReqCancelled: "grey-8"
}
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value == null || value === "" ? 0 : value)
const zero = () => toDecimal(0)
const quantityText = value => (value == null ? "" : ec.l10n.format(dec(value), "#,##0.###"))
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")

// ===== the list =====
// The request ids the user is one of the people of (filed by, or a party other than the organization): a requester's scope.
function ownRequestIds(partyId) {
    if (!partyId) return []
    return [
        ...new Set(
            rows("mantle.request.RequestParty", {partyId})
                .filter(row => row.roleTypeId !== "OrgInternal" && lib.active(row))
                .map(row => row.requestId)
        )
    ]
}
// The purchase requests of the user's organizations (their OrgInternal RequestParty), newest first, at most readLimit; a
// requester's own and assigned ones only.
function requestsInScope(userScope, p = {}) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.request.RequestAndParty", {requestTypeEnumId: purchaseType, roleTypeId: "OrgInternal"})
        .condition("thruDate", "is-null", null)
        .orderBy("-requestDate")
        .limit(readLimit + 1)
    if (userScope.ownerIds) query = query.condition("partyId", "in", userScope.ownerIds.length ? userScope.ownerIds : ["_NA_"])
    if (!blank(p.organizationPartyId)) query = query.condition("partyId", String(p.organizationPartyId))
    if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
    else if (p.statuses) query = query.condition("statusId", "in", p.statuses)
    if (!blank(p.facilityId)) query = query.condition("facilityId", String(p.facilityId))
    if (!blank(p.text))
        query = query.condition(
            factory.makeCondition(
                ["requestId", "requestName"].map(field => factory.makeCondition(field, "like", likeText(p.text)).ignoreCase()),
                "or"
            )
        )
    const mine = p.mine || !userScope.capabilities.listRead
    if (mine) {
        const partyId = userScope.partyId || "_NA_"
        const conditions = [factory.makeCondition("filedByPartyId", "equals", partyId)]
        const assigned = ownRequestIds(userScope.partyId)
        if (assigned.length) conditions.push(factory.makeCondition("requestId", "in", assigned))
        query = query.condition(factory.makeCondition(conditions, "or"))
    }
    return Array.from(query.list())
}
// What each request's lines have approved, sourced and left, read for the requests together: the lines' requirements
// (RequirementRequestItem) and their covering supply (RequirementSupply, active).
function sourcingOf(requestIds) {
    const totals = Object.fromEntries(
        requestIds.map(id => [id, {approved: zero(), sourced: zero(), remaining: zero(), lines: 0}])
    )
    if (!requestIds.length) return totals
    const links = Array.from(
        find("mantle.request.requirement.RequirementRequestItem").condition("requestId", "in", requestIds).list()
    )
    for (const id of requestIds)
        totals[id].lines = find(ITEM, {requestId: id}).condition("statusId", "not-equals", "ReqCancelled").count()
    if (!links.length) return totals
    const requirementIds = [...new Set(links.map(row => row.requirementId))]
    const requirements = Object.fromEntries(
        Array.from(find("mantle.request.requirement.Requirement").condition("requirementId", "in", requirementIds).list()).map(
            row => [row.requirementId, row]
        )
    )
    const now = ms(ec.user.nowTimestamp)
    const covered = {}
    for (const row of find("mantle.request.requirement.RequirementSupply")
        .condition("requirementId", "in", requirementIds)
        .list())
        if (row.supplyTypeEnumId !== "RstOperationDemand" && (!row.thruDate || ms(row.thruDate) > now))
            covered[row.requirementId] = (covered[row.requirementId] || zero()).add(dec(row.quantity))
    for (const link of links) {
        const requirement = requirements[link.requirementId]
        if (!requirement || !["RqmtStApproved", "RqmtStOrdered"].includes(requirement.statusId)) continue
        const total = totals[link.requestId]
        const approved = dec(requirement.quantity)
        const sourced = covered[link.requirementId] || zero()
        total.approved = total.approved.add(approved)
        total.sourced = total.sourced.add(sourced)
        if (approved.compare(sourced) > 0) total.remaining = total.remaining.add(approved.subtract(sourced))
    }
    return totals
}
const approvalText = statusId =>
    ({
        ReqDraft: "Not submitted",
        ReqSubmitted: "Waiting for approval",
        ReqReviewed: "Waiting for approval",
        ReqInProgress: "Approved",
        ReqCompleted: "Approved",
        ReqCancelled: "Cancelled"
    })[statusId] || ""
// The Requests list (design §4 RequestFind and RequestList): the requests of a view and filters with their requester,
// organization, facility, due date, approval and the approved, sourced and remaining quantities of their lines.
function findRequests(p) {
    const userScope = purchasing.required()
    const view = views[p.view] ? p.view : "all"
    const definition = views[view]
    const found = requestsInScope(
        userScope,
        Object.assign({}, p, {statuses: definition.statuses, mine: view === "mine" || !userScope.capabilities.listRead})
    )
    const truncated = found.length > readLimit
    let list = found.slice(0, readLimit)
    // a request is read once even with two organization rows
    list = list.filter((row, index) => list.findIndex(other => other.requestId === row.requestId) === index)
    const totals = sourcingOf(list.map(row => row.requestId))
    const horizon = ms(ec.user.nowTimestamp) + dueDays * dayMs
    if (definition.sourcing) list = list.filter(row => totals[row.requestId].remaining.compare(0) > 0)
    if (definition.due) list = list.filter(row => row.responseRequiredDate && ms(row.responseRequiredDate) <= horizon)
    const names = lib.partyNames(list.flatMap(row => [row.filedByPartyId, row.partyId]))
    const rowsOut = list.map(row => {
        const total = totals[row.requestId]
        const facility = row.facilityId ? one("mantle.facility.Facility", {facilityId: row.facilityId}) : null
        return {
            requestId: row.requestId,
            requestName: row.requestName || row.requestId,
            requesterName: names[row.filedByPartyId] || row.filedByPartyId || "",
            organizationName: names[row.partyId] || row.partyId,
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            statusId: row.statusId,
            statusText: statusText(row.statusId),
            statusColor: statusColors[row.statusId] || "grey-8",
            dueText: dateText(row.responseRequiredDate),
            overdue:
                !!row.responseRequiredDate &&
                ms(row.responseRequiredDate) < ms(ec.user.nowTimestamp) &&
                !closedStatuses.includes(row.statusId),
            approvalText: approvalText(row.statusId),
            linesText: String(total.lines),
            sourcedText: total.approved.compare(0) > 0 ? quantityText(total.sourced) + " of " + quantityText(total.approved) : "",
            remainingText: total.approved.compare(0) > 0 ? quantityText(total.remaining) : "",
            remaining: total.remaining.toNumber()
        }
    })
    if (truncated)
        ec.message.addMessage("Only the newest " + readLimit + " purchase requests were read; narrow the filters", "warning")
    return Object.assign({viewLabel: definition.label, view}, lib.pageList(rowsOut, p, "requestRows"))
}

// ===== the detail =====
// The history of a request: its lines' audit-logged changes and its status changes, newest first.
function historyOf(requestId) {
    const fieldLabels = {
        productId: "Product",
        quantity: "Quantity",
        quantityUomId: "Unit",
        requiredByDate: "Required by",
        supplierPartyId: "Supplier",
        costCenterId: "Cost centre",
        statusId: "Status"
    }
    const audit = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", "in", [REQUEST, ITEM])
            .condition("pkPrimaryValue", requestId)
            .condition("changedFieldName", "in", Object.keys(fieldLabels))
            .orderBy("-changedDate")
            .limit(100)
            .list()
    )
    const users = {}
    const userName = userId =>
        userId ? (users[userId] ??= one("moqui.security.UserAccount", {userId})?.userFullName || userId) : ""
    const value = (field, text) => {
        if (text == null || text === "") return ""
        if (field === "statusId") return statusText(text)
        if (field === "supplierPartyId" || field === "costCenterId") return lib.partyNames([text])[text] || text
        if (field === "requiredByDate") return dateText(text)
        return String(text)
    }
    return audit.map(row => ({
        dateText: dateText(row.changedDate),
        whatText:
            (row.changedEntityName === ITEM ? "Line " + (row.pkSecondaryValue || "") + " " : "Request ") +
            fieldLabels[row.changedFieldName].toLowerCase(),
        fromText: value(row.changedFieldName, row.oldValueText),
        toText: value(row.changedFieldName, row.newValueText),
        byText: userName(row.changedByUserId),
        reason: row.changeReason || ""
    }))
}
// get#RequestDetail: the Purchasing branch of RequestDetail: the request checked (a requester's own only), its progress
// from Mantle (lines, approval, sourcing) and history, and what the user may do here.
function requestDetail(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "request", p.requestId)
    const progress = lib.call("mantle.request.RequestServices.get#PurchaseRequestProgress", {requestId: p.requestId}).progress
    const can = userScope.capabilities
    return {
        request: Object.assign({}, progress, {
            statusColor: statusColors[progress.statusId] || "grey-8",
            canSource: !!progress.canSource && can.buy && can.listRead,
            canChooseSupplier: !!progress.canChooseSupplier && can.buy
        }),
        historyRows: historyOf(String(p.requestId))
    }
}

// ===== the other apps' RequestDetail (Projects' contract, F6) =====
// The Items tab rows of a purchase request in another app's RequestDetail (Commons, Projects): each line's product, unit,
// required date, supplier, cost centre and what is approved and left to source. The request was found there under that
// app's visibility; nothing here reads beyond its lines.
function itemRows(requestId) {
    const request = one(REQUEST, {requestId})
    if (!request || request.requestTypeEnumId !== purchaseType) return []
    const items = rows(ITEM, {requestId})
        .filter(item => item.statusId !== "ReqCancelled")
        .sort((a, b) => String(a.requestItemSeqId).localeCompare(String(b.requestItemSeqId)))
    const names = lib.partyNames(items.flatMap(item => [item.supplierPartyId, item.costCenterId]))
    const totals = {}
    for (const item of items) {
        const link = rows("mantle.request.requirement.RequirementRequestItem", {
            requestId,
            requestItemSeqId: item.requestItemSeqId
        })[0]
        totals[item.requestItemSeqId] = link ? sourcingByRequirement(link.requirementId) : null
    }
    return items.map(item => {
        const product = item.productId ? one("mantle.product.Product", {productId: item.productId}) : null
        const total = totals[item.requestItemSeqId]
        return {
            requestItemSeqId: item.requestItemSeqId,
            productId: item.productId || null,
            productText: product ? (product.pseudoId || product.productId) + " · " + (product.productName || "") : "",
            description: item.description || "",
            quantityText:
                quantityText(item.quantity) +
                (item.quantityUomId
                    ? " " + (one("moqui.basic.Uom", {uomId: item.quantityUomId})?.abbreviation || item.quantityUomId)
                    : ""),
            requiredByText: dateText(item.requiredByDate),
            supplierName: names[item.supplierPartyId] || item.supplierPartyId || "",
            costCenterName: names[item.costCenterId] || item.costCenterId || "",
            // the most to pay, as Projects' Items tab showed it before
            maximumText:
                item.maximumAmount == null
                    ? ""
                    : request.currencyUomId
                      ? ec.l10n.formatCurrency(item.maximumAmount, request.currencyUomId)
                      : String(item.maximumAmount),
            remainingText: total ? quantityText(total.remaining) + " of " + quantityText(total.approved) + " to source" : ""
        }
    })
}
function sourcingByRequirement(requirementId) {
    const requirement = one("mantle.request.requirement.Requirement", {requirementId})
    if (!requirement || !["RqmtStApproved", "RqmtStOrdered"].includes(requirement.statusId)) return null
    const now = ms(ec.user.nowTimestamp)
    const sourced = rows("mantle.request.requirement.RequirementSupply", {requirementId})
        .filter(row => row.supplyTypeEnumId !== "RstOperationDemand" && (!row.thruDate || ms(row.thruDate) > now))
        .reduce((total, row) => total.add(dec(row.quantity)), zero())
    const approved = dec(requirement.quantity)
    return {approved, remaining: approved.compare(sourced) > 0 ? approved.subtract(sourced) : zero()}
}
// The "Create purchase order" of a purchase request's Items tab in any app (crosscut §3.11, R-PUR-01): Purchasing's
// RequestSourcing for the request, for a buyer (the buy capability) who may work with it under Purchasing; else null.
function sourcingUrl(requestId) {
    try {
        const userScope = purchasing.scope()
        if (!userScope.read || !userScope.capabilities.buy || !userScope.capabilities.listRead) return null
        purchasing.recordOf(userScope, "request", requestId)
        return "/qapps/Purchasing/Requests/RequestSourcing?requestId=" + encodeURIComponent(requestId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Sourcing link of request " + requestId + ": " + error.message)
        return null
    }
}

// ===== OrderDetail's Sources =====
// The request lines a purchase order's lines were sourced from, each with its request's link under Purchasing.
function orderSources(p) {
    const userScope = purchasing.required()
    purchasing.recordOf(userScope, "order", p.orderId)
    const sources = ec.resource
        .script("component://mr-mantle/service/mantle/request/PurchaseRequests.js")
        .orderSources(String(p.orderId))
    return {
        sourceRows: sources.map(row =>
            Object.assign({}, row, {
                requestUrl: row.requestTypeEnumId === purchaseType ? purchasing.recordLink("request", row.requestId) : null
            })
        )
    }
}

// ===== Home and Today =====
// Home's unsourced count (P10): the approved requests with quantity left to source, of the user's organizations (a
// requester's own).
function homeCount(userScope) {
    if (!userScope.read) return {unsourcedCount: null}
    const list = requestsInScope(userScope, {statuses: ["ReqInProgress"], mine: !userScope.capabilities.listRead}).slice(
        0,
        readLimit
    )
    const totals = sourcingOf([...new Set(list.map(row => row.requestId))])
    return {unsourcedCount: Object.values(totals).filter(total => total.remaining.compare(0) > 0).length}
}
// The Purchasing today-source of requests (P10): for a buyer, the approved requests left to source due by the end of the
// range (or overdue), each opening RequestDetail. Another user's Today and a user who does not buy get none.
function today(p) {
    const label = "Purchase requests"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = purchasing.scope()
    if (!userScope.read || !userScope.capabilities.buy || !userScope.capabilities.listRead) return {items: [], label}
    const until = p.thruDate ? ms(p.thruDate) : ms(ec.user.nowTimestamp) + dayMs
    const list = requestsInScope(userScope, {statuses: ["ReqInProgress"]})
        .slice(0, readLimit)
        .filter(row => row.responseRequiredDate && ms(row.responseRequiredDate) <= until)
    const totals = sourcingOf(list.map(row => row.requestId))
    return {
        label,
        items: list
            .filter(row => totals[row.requestId].remaining.compare(0) > 0)
            .slice(0, 50)
            .map(row => ({
                kind: "purchaseRequest",
                workEffortId: null,
                requestId: row.requestId,
                title: "Source purchase request " + row.requestId + " · " + (row.requestName || ""),
                dueDate: row.responseRequiredDate,
                startDate: null,
                endDate: null,
                allDay: true,
                priority: null,
                statusId: row.statusId,
                assignees: [],
                canUpdate: false,
                hasCallLink: false,
                url: purchasing.recordUrl("request", row.requestId),
                record: {recordEntityName: REQUEST, recordId: row.requestId, recordName: row.requestName || row.requestId}
            }))
    }
}

const operations = {findRequests, requestDetail, orderSources, today}
;({
    homeCount,
    itemRows,
    sourcingUrl,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown purchase request operation " + op)
        return operations[op](parameters || {})
    }
})
