// Purchasing's revision and acknowledgement reads (design-purchasing §6 OrderChanges, Acknowledgements and OrderDetail's
// revisions and acknowledgements; impl-purchasing P9): OrderDetail's Revisions section (each revision's time, its changes and
// reason from the audit log, and its stored PDF) and Acknowledgements section (the supplier's reference, the revision it
// acknowledged and the outcome, each line's requested and promised dates, the reminders and the history), the
// Acknowledgements list by view (unacknowledged, changed promise, overdue by the buying policy's reminder days, all), Home's
// unacknowledged count and the Today source of acknowledgements due. The writes are the Mantle services
// (mantle.order.OrderServices start#, cancel#, preview#, apply#PurchaseRevision, record#Acknowledgement,
// send#PurchaseReminder), which check their permissions and the organization again. A price change and the issued PDF are
// withheld from a user who sees no order amounts (§2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const revisions = () => ec.resource.script("component://mr-mantle/service/mantle/order/PurchaseRevisions.js")
const policy = () => ec.resource.script("component://mr-mantle/service/mantle/order/PurchasePolicy.js")
const {find, one, rows, denied, ms} = lib

const ORDER = "mantle.order.OrderHeader",
    PART = "mantle.order.OrderPart",
    ITEM = "mantle.order.OrderItem"
// the statuses a supplier acknowledges an order in (it went out), and those a buyer changes one in
const sentStatuses = ["OrderSent", "OrderProcessing"]
const acknowledgeStatuses = ["OrderApproved", "OrderSent", "OrderProcessing", "OrderHold"]
const revisableStatuses = ["OrderPlaced", "OrderProcessing", "OrderApproved", "OrderSent", "OrderHold"]
const views = {
    unacknowledged: "Unacknowledged",
    changed: "Changed promise",
    overdue: "Overdue",
    all: "All sent"
}
const outcomeColors = {PakAccepted: "positive", PakChanged: "warning", PakRejected: "negative"}
const blank = value => value == null || String(value).trim() === ""
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const quantityText = value => (value == null ? "" : ec.l10n.format(toDecimal(value), "#,##0.###"))
const amountsVisible = can => !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead)
const userName = userId => (userId ? one("moqui.security.UserAccount", {userId})?.userFullName || userId : "")
const dayMs = 24 * 60 * 60 * 1000

// The internal organizations a list may show (the user's, or every one for the administrator with none active).
function buyerIdsOf(userScope) {
    return userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}
// The open Change hold of an order and where its change stands: none, started or applied (waiting for its approval).
function changeState(order) {
    const hold = rows("mantle.order.OrderHoldReason", {orderId: order.orderId, holdTypeEnumId: "OhtChange"})
        .filter(row => !row.releasedDate)
        .sort((a, b) => ms(b.placedDate) - ms(a.placedDate))[0]
    if (!hold) return {state: "none", hold: null}
    return {state: Number(order.orderRevision ?? 1) > Number(hold.sourceId || 0) ? "applied" : "started", hold}
}
// When each revision of the order first went to the supplier: the order emails of the revision that are not reminders.
function sentDates(orderId) {
    const sent = {}
    for (const row of rows("mantle.order.OrderEmailMessage", {orderId}).filter(row => !row.reminderOccurrence)) {
        const message = one("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId})
        if (!message || !["ES_SENT", "ES_READY", "ES_SCHEDULED"].includes(message.statusId)) continue
        const at = ms(message.sentDate || message.lastUpdatedStamp)
        const revision = Number(row.orderRevision)
        if (!sent[revision] || at < sent[revision]) sent[revision] = at
    }
    return sent
}

// ===== OrderDetail's Revisions and Acknowledgements =====
// get#OrderRevisions: the order's revisions, acknowledgement and what the user may do with them.
function orderRevisions(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "order", p.orderId)
    const can = userScope.capabilities
    const orderId = record.recordId
    const order = one(ORDER, {orderId})
    const part = rows(PART, {orderId})[0]
    const revision = Number(order.orderRevision ?? 1)
    const showAmounts = amountsVisible(can)
    const issued = rows("mantle.order.OrderContent", {orderId, orderContentTypeEnumId: "OctPurchaseOrderIssued"})
    const issuedOf = number =>
        issued
            .filter(row => new RegExp("revision " + number + " as sent$").test(row.description || ""))
            .sort((a, b) => ms(b.contentDate) - ms(a.contentDate))[0] || null
    const sent = sentDates(orderId)
    const revisionRows = revisions()
        .revisionList(orderId)
        .map(row => {
            const pdf = issuedOf(row.revision)
            const reasons = [...new Set(row.changes.map(change => change.reason).filter(Boolean))]
            return {
                revision: row.revision,
                revisionText: "Revision " + row.revision + (row.revision === revision ? " (current)" : ""),
                dateText: lib.dateText(row.revisionDate),
                changeText: row.changes.length
                    ? row.changes
                          .map(
                              change =>
                                  change.whatText +
                                  ": " +
                                  (change.field === "unitAmount" && !showAmounts
                                      ? "withheld"
                                      : (change.fromText || "none") + " → " + (change.toText || "none"))
                          )
                          .join("; ")
                    : row.revision === 1
                      ? "As entered"
                      : "",
                reason: reasons.join("; "),
                sentText: sent[row.revision] ? "Sent " + lib.dateText(sent[row.revision]) : "",
                orderContentId: pdf?.orderContentId || null,
                canOpen: !!pdf && showAmounts
            }
        })
    const change = changeState(order)
    const acknowledged = part.acknowledgedRevision != null && Number(part.acknowledgedRevision) === revision
    const items = rows(ITEM, {orderId})
        .filter(item => !item.parentItemSeqId)
        .sort((a, b) => String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId)))
    const lineRows = items.map(item => {
        const product = item.productId ? one("mantle.product.Product", {productId: item.productId}) : null
        const late = item.promisedDate && item.requiredByDate && ms(item.promisedDate) > ms(item.requiredByDate)
        return {
            orderItemSeqId: item.orderItemSeqId,
            productText: product
                ? (product.pseudoId || product.productId) + " · " + (product.productName || "")
                : item.itemDescription || "",
            quantityText: quantityText(item.quantity),
            requiredText: lib.dateText(item.requiredByDate),
            promisedText: lib.dateText(item.promisedDate),
            promisedQuantityText: item.promisedQuantity == null ? "" : quantityText(item.promisedQuantity),
            promiseState: late ? "Later than required" : item.promisedDate ? "On time" : "",
            promiseColor: late ? "warning" : "positive"
        }
    })
    // the acknowledgement's history: its audit-logged fields, newest first
    const history = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", "in", [PART, ITEM])
            .condition("pkPrimaryValue", orderId)
            .condition("changedFieldName", "in", [
                "otherPartyOrderId",
                "acknowledgedRevision",
                "acknowledgementEnumId",
                "promisedDate",
                "promisedQuantity"
            ])
            .orderBy("-changedDate")
            .limit(100)
            .list()
    )
        .filter(row => row.newValueText != null)
        .map(row => ({
            changedText: lib.dateText(row.changedDate),
            whatText:
                (row.changedEntityName === ITEM ? "Line " + row.pkSecondaryValue + " " : "") +
                {
                    otherPartyOrderId: "Supplier reference",
                    acknowledgedRevision: "Acknowledged revision",
                    acknowledgementEnumId: "Response",
                    promisedDate: "Promised date",
                    promisedQuantity: "Promised quantity"
                }[row.changedFieldName],
            toText:
                row.changedFieldName === "acknowledgementEnumId"
                    ? enumText(row.newValueText)
                    : row.changedFieldName === "promisedDate"
                      ? lib.dateText(row.newValueText)
                      : row.changedFieldName === "promisedQuantity"
                        ? quantityText(row.newValueText)
                        : String(row.newValueText),
            reason: row.changeReason || "",
            byText: userName(row.changedByUserId)
        }))
    const reminderRows = rows("mantle.order.OrderEmailMessage", {orderId})
        .filter(row => row.reminderOccurrence)
        .map(row => {
            const message = one("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId})
            return {
                revisionText: "Revision " + row.orderRevision,
                toText: message?.toAddresses || "",
                sentText: lib.dateText(message?.sentDate || message?.lastUpdatedStamp),
                at: ms(message?.sentDate || message?.lastUpdatedStamp) || 0
            }
        })
        .sort((a, b) => b.at - a.at)
    const statusId = order.statusId
    return {
        orderRevisions: {
            orderId,
            orderRevision: revision,
            revisionState: change.state,
            revisionStateText:
                change.state === "started"
                    ? "A change of revision " + revision + " is open: the order is held until it is applied or let go"
                    : change.state === "applied"
                      ? "Revision " + revision + " waits for its approval; the order is held until then"
                      : "",
            revisionRows,
            acknowledgement: {
                acknowledged,
                acknowledgedRevision: part.acknowledgedRevision ?? null,
                stateText: acknowledged
                    ? "Revision " + revision + " acknowledged: " + enumText(part.acknowledgementEnumId)
                    : part.acknowledgedRevision != null
                      ? "Revision " + part.acknowledgedRevision + " was acknowledged; revision " + revision + " is not yet"
                      : "Not acknowledged yet",
                outcomeColor: acknowledged ? outcomeColors[part.acknowledgementEnumId] || "grey-8" : "grey-8",
                supplierReference: part.otherPartyOrderId || "",
                supplierDateText: lib.dateText(part.otherPartyOrderDate),
                recordedText: lib.dateText(part.acknowledgedDate),
                note: part.acknowledgementNote || ""
            },
            lineRows,
            historyRows: history,
            reminderRows: reminderRows.map(({at, ...row}) => row),
            actions: {
                change: !!can.buy && revisableStatuses.includes(statusId) && change.state === "none",
                continueChange: (!!can.buy || !!can.approve) && change.state !== "none",
                acknowledge: !!can.buy && acknowledgeStatuses.includes(statusId),
                remind: !!can.buy && acknowledgeStatuses.includes(statusId) && !acknowledged
            }
        }
    }
}

// ===== the Acknowledgements list =====
// find#Acknowledgements: the sent purchase orders of the user's organizations by view (unacknowledged at their current
// revision, a changed or rejected response or a promise later than required, unacknowledged past the buying policy's
// reminder days, all sent), by supplier and text, the oldest sent first: each with its revision, supplier, when it went out,
// the response, the latest promise beside the earliest requested date, and the last reminder.
function findAcknowledgements(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Acknowledgements are not available")
    const view = Object.hasOwn(views, p.view || "") ? p.view : "unacknowledged"
    let buyers = buyerIdsOf(userScope)
    if (!blank(p.organizationPartyId)) {
        if (!purchasing.owns(userScope, p.organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
        buyers = [String(p.organizationPartyId)]
    }
    const internal = rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    let query = find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internal)
        .condition("statusId", "in", sentStatuses)
        .orderBy("orderId")
        .limit(500)
    if (!blank(p.vendorPartyId)) query = query.condition("vendorPartyId", String(p.vendorPartyId))
    if (!blank(p.text)) {
        const factory = ec.entity.conditionFactory
        const like = "%" + String(p.text).replace(/[\\%_]/g, character => "\\" + character) + "%"
        query = query.condition(
            factory.makeCondition(
                ["orderId", "orderName", "otherPartyOrderId"].map(field =>
                    factory.makeCondition(field, "like", like).ignoreCase()
                ),
                "or"
            )
        )
    }
    const found = Array.from(query.list())
    const names = lib.partyNames(found.map(row => row.vendorPartyId))
    const now = Number(ec.user.nowTimestamp)
    const reminderDays = {}
    const reminderDaysOf = organizationPartyId =>
        (reminderDays[organizationPartyId] ??= Number(policy().effective(organizationPartyId).policy.reminderDays ?? 3))
    const ackRows = []
    for (const row of found) {
        const revision = Number(row.orderRevision ?? 1)
        const acknowledged = row.acknowledgedRevision != null && Number(row.acknowledgedRevision) === revision
        const sent = sentDates(row.orderId)
        const sentAt = sent[revision] ?? null
        const overdue = !acknowledged && sentAt != null && now - sentAt > reminderDaysOf(row.customerPartyId) * dayMs
        const items = rows(ITEM, {orderId: row.orderId}).filter(item => !item.parentItemSeqId)
        const promised = items.map(item => ms(item.promisedDate)).filter(Boolean)
        const required = items.map(item => ms(item.requiredByDate)).filter(Boolean)
        const latestPromise = promised.length ? Math.max(...promised) : null
        const earliestRequired = required.length ? Math.min(...required) : null
        const latePromise = items.some(
            item => item.promisedDate && item.requiredByDate && ms(item.promisedDate) > ms(item.requiredByDate)
        )
        const changed = acknowledged && (row.acknowledgementEnumId !== "PakAccepted" || latePromise)
        if (view === "unacknowledged" && acknowledged) continue
        if (view === "changed" && !changed) continue
        if (view === "overdue" && !overdue) continue
        const reminders = rows("mantle.order.OrderEmailMessage", {orderId: row.orderId}).filter(
            message => message.reminderOccurrence && Number(message.orderRevision) === revision
        )
        const lastReminder = reminders
            .map(message => one("moqui.basic.email.EmailMessage", {emailMessageId: message.emailMessageId}))
            .filter(Boolean)
            .map(message => ms(message.sentDate || message.lastUpdatedStamp))
            .sort((a, b) => b - a)[0]
        ackRows.push({
            orderId: row.orderId,
            orderName: row.orderName || "",
            orderRevision: revision,
            revisionText: "Revision " + revision,
            url: purchasing.recordUrl("order", row.orderId),
            supplierPartyId: row.vendorPartyId,
            supplierName: names[row.vendorPartyId] || row.vendorPartyId,
            sentText: sentAt ? lib.dateText(sentAt) : "",
            responseText: acknowledged
                ? enumText(row.acknowledgementEnumId)
                : row.acknowledgedRevision != null
                  ? "Revision " + row.acknowledgedRevision + " acknowledged"
                  : "None yet",
            responseColor: acknowledged ? outcomeColors[row.acknowledgementEnumId] || "grey-8" : overdue ? "negative" : "grey-8",
            supplierReference: row.otherPartyOrderId || "",
            requiredText: earliestRequired ? lib.dateText(earliestRequired) : "",
            promisedText: latestPromise ? lib.dateText(latestPromise) : "",
            lateReason: acknowledged && latePromise ? row.acknowledgementNote || "Later than required" : "",
            remindedText: lastReminder ? lib.dateText(lastReminder) : "",
            overdue,
            acknowledged,
            // when the acknowledgement is due: the reminder days after the revision went out
            dueDate: sentAt != null ? sentAt + reminderDaysOf(row.customerPartyId) * dayMs : null,
            sortAt: sentAt ?? Infinity
        })
    }
    ackRows.sort((a, b) => a.sortAt - b.sortAt)
    const listed = lib.pageList(
        ackRows.map(({sortAt, ...row}) => row),
        p,
        "ackRows"
    )
    return Object.assign(listed, {viewLabel: views[view], view})
}

// ===== Home and Today =====
// Home's unacknowledged count: the sent orders of the user's organizations not acknowledged at their current revision, for
// the buying lists' groups.
function homeCount(userScope) {
    if (!userScope.capabilities.listRead) return {unacknowledgedCount: null}
    const internal = rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    const found = Array.from(
        find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", "in", buyerIdsOf(userScope).length ? buyerIdsOf(userScope) : ["_NA_"])
            .condition("vendorPartyId", "not-in", internal)
            .condition("statusId", "in", sentStatuses)
            .selectField("orderId")
            .selectField("orderRevision")
            .selectField("acknowledgedRevision")
            .limit(5000)
            .list()
    )
    return {
        unacknowledgedCount: found.filter(
            row => row.acknowledgedRevision == null || Number(row.acknowledgedRevision) !== Number(row.orderRevision ?? 1)
        ).length
    }
}
// The Purchasing today-source of acknowledgements due: the user's organizations' sent orders unacknowledged past the buying
// policy's reminder days, for a buyer, due when the reminder days ran out.
function today(p) {
    const label = "Purchasing acknowledgements"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = purchasing.scope()
    if (!userScope.read || !userScope.capabilities.buy || !userScope.capabilities.listRead) return {items: [], label}
    const found = findAcknowledgements({view: "overdue", pageSize: 50})
    const items = found.ackRows.map(row => ({
        kind: "purchaseAcknowledgement",
        workEffortId: null,
        requestId: null,
        title: "Acknowledgement due: purchase order " + row.orderId + " · " + row.supplierName,
        dueDate: row.dueDate,
        startDate: null,
        endDate: null,
        allDay: false,
        priority: null,
        statusId: null,
        assignees: [],
        canUpdate: false,
        hasCallLink: false,
        url: row.url,
        record: {recordEntityName: ORDER, recordId: row.orderId, recordName: "Purchase order " + row.orderId}
    }))
    return {items, label}
}

const operations = {orderRevisions, findAcknowledgements, today}
;({
    homeCount,
    changeState,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing revision operation " + op)
        return operations[op](parameters)
    }
})
