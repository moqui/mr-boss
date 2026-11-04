// Purchasing's purchase order reads (design-purchasing §6 PurchaseOrders and OrderDetail; impl-purchasing P3, §2): the
// PurchaseOrders list with ordered, received, billed and balance kept apart, the OrderDetail of one purchase order (its
// header, holds, lines with what was received, accepted and billed, history from the audit log, stored documents, emails,
// approval decisions and the actions the user's capabilities and the order's status allow), Home's draft and unsent counts
// and work rows, the bulk approval and close with a result per order, and the order drop-downs (products, cost centres). The
// writes are the Mantle services (mantle.order.PurchaseServices, OrderServices), which check their permissions and the
// organization again. An amount (a supplier's price) shows only to a user who works the orders or reads supplier prices or
// the books; anyone else sees it withheld (§2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, denied} = lib

const ORDER = "mantle.order.OrderHeader",
    ITEM = "mantle.order.OrderItem"
const choiceLimit = 30
const quoteStatuses = ["OrderRequested", "OrderProposed"]
const openStatuses = ["OrderApproved", "OrderSent", "OrderProcessing", "OrderHold"]
const closedStatuses = ["OrderCompleted", "OrderCancelled", "OrderRejected"]
// the list's views (design §6 PurchaseOrders); late, received not billed and drop-ship come with receiving (P5), bills (P6)
// and drop-ship (P7)
const views = {
    draft: {label: "Draft", statuses: ["OrderOpen"]},
    approval: {label: "Awaiting approval", statuses: ["OrderPlaced"]},
    unsent: {label: "Approved, not sent", statuses: ["OrderApproved"]},
    open: {label: "Open", statuses: openStatuses},
    held: {label: "On hold", statuses: ["OrderHold"]},
    closed: {label: "Closed", statuses: closedStatuses}
}
const statusColors = {
    OrderOpen: "grey-8",
    OrderPlaced: "warning",
    OrderApproved: "primary",
    OrderSent: "positive",
    OrderProcessing: "primary",
    OrderHold: "negative",
    OrderCompleted: "positive",
    OrderCancelled: "grey-8",
    OrderRejected: "negative"
}
const blank = value => value == null || String(value).trim() === ""
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const quantityText = value => (value == null ? "" : ec.l10n.format(toDecimal(value), "#,##0.###"))
const dec = value => toDecimal(value ?? 0)
const sumBy = (list, key, value) => {
    const sums = {}
    for (const row of list) sums[key(row)] = (sums[key(row)] || toDecimal(0)).add(value(row))
    return sums
}
// Whether the user sees a purchase order's amounts: a buyer, an approver, a supplier-price reader or a finance reader.
const amountsVisible = can => !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead)
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)

// The internal organizations a list may show (the user's, or every one for the administrator with none active).
function buyerIdsOf(userScope) {
    return userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}
const internalIds = () => rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
// A find of the purchase parts of the buyers: an internal customer, a vendor that is not internal, no quote.
function purchaseFind(buyers) {
    return find("mantle.order.OrderHeaderAndPart")
        .condition("customerPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("vendorPartyId", "not-in", internalIds())
        .condition("statusId", "not-in", quoteStatuses)
}

// ===== the list =====
// find#PurchaseOrders: one page of the purchase orders of the user's organizations, by view, supplier, status, facility and
// text, newest first, each with its supplier, due date, total, ordered and received quantities, billed and balance.
function findOrders(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Purchase orders are not available")
    let buyers = buyerIdsOf(userScope)
    if (!blank(p.organizationPartyId)) {
        if (!purchasing.owns(userScope, p.organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
        buyers = [String(p.organizationPartyId)]
    }
    const factory = ec.entity.conditionFactory
    const view = Object.hasOwn(views, p.view || "") ? views[p.view] : null
    // a find for the count and another for the page (a find is used once)
    const build = () => {
        let query = purchaseFind(buyers)
        if (view) query = query.condition("statusId", "in", view.statuses)
        if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
        if (!blank(p.vendorPartyId)) query = query.condition("vendorPartyId", String(p.vendorPartyId))
        if (!blank(p.facilityId)) query = query.condition("facilityId", String(p.facilityId))
        if (!blank(p.text))
            query = query.condition(
                factory.makeCondition(
                    ["orderId", "orderName", "otherPartyOrderId", "externalId"].map(field =>
                        factory.makeCondition(field, "like", likeText(String(p.text).trim())).ignoreCase()
                    ),
                    "or"
                )
            )
        return query
    }
    const paged = lib.page(build().orderBy("-entryDate").orderBy("-orderId"), p, "orderRows", build().count())
    const pageRows = paged.rows
    const orderIds = pageRows.map(row => row.orderId)
    const names = lib.partyNames(pageRows.flatMap(row => [row.vendorPartyId, row.customerPartyId]))
    const items = orderIds.length ? Array.from(find(ITEM).condition("orderId", "in", orderIds).list()) : []
    const receipts = orderIds.length
        ? Array.from(find("mantle.product.receipt.AssetReceipt").condition("orderId", "in", orderIds).list())
        : []
    const billings = orderIds.length
        ? Array.from(find("mantle.order.OrderItemBilling").condition("orderId", "in", orderIds).list())
        : []
    const ordered = sumBy(
        items.filter(item => !item.parentItemSeqId),
        row => row.orderId,
        row => dec(row.quantity)
    )
    const received = sumBy(
        receipts,
        row => row.orderId,
        row => dec(row.quantityAccepted).add(dec(row.quantityRejected))
    )
    const billed = sumBy(
        billings,
        row => row.orderId,
        row => dec(row.quantity).multiply(dec(row.amount))
    )
    const due = {}
    for (const item of items)
        if (item.requiredByDate && (!due[item.orderId] || lib.ms(item.requiredByDate) < lib.ms(due[item.orderId])))
            due[item.orderId] = item.requiredByDate
    const showAmounts = amountsVisible(userScope.capabilities)
    const orderRows = pageRows.map(row => {
        const currency = row.currencyUomId
        const billedAmount = billed[row.orderId] || toDecimal(0)
        return {
            orderId: row.orderId,
            orderName: row.orderName || "",
            supplierPartyId: row.vendorPartyId,
            supplierName: names[row.vendorPartyId] || row.vendorPartyId,
            organizationName: names[row.customerPartyId] || row.customerPartyId,
            statusId: row.statusId,
            statusText: statusText(row.statusId),
            statusColor: statusColors[row.statusId] || "grey-8",
            entryText: lib.dateText(row.entryDate),
            dueText: due[row.orderId] ? lib.dateText(due[row.orderId]) : "",
            orderedText: quantityText(ordered[row.orderId] || 0),
            receivedText: quantityText(received[row.orderId] || 0),
            totalText: showAmounts ? money(row.grandTotal, currency) : "Withheld",
            billedText: showAmounts ? money(billedAmount, currency) : "Withheld",
            balanceText: showAmounts ? money(dec(row.grandTotal).subtract(billedAmount), currency) : "Withheld"
        }
    })
    const result = Object.assign({}, paged, {orderRows, viewLabel: view ? view.label : "All"})
    delete result.rows
    return result
}

// ===== one order =====
// The order's history from the audit log; a price change is withheld from a user who may not see amounts.
function auditRows(orderId, showAmounts) {
    const fieldLabels = {
        statusId: "Status",
        orderRevision: "Revision",
        productId: "Product",
        quantity: "Quantity",
        unitAmount: "Price",
        quantityUomId: "Unit",
        quantityCancelled: "Cancelled",
        itemDescription: "Description",
        requiredByDate: "Required by",
        costCenterId: "Cost centre"
    }
    const logs = Array.from(
        find("moqui.entity.EntityAuditLog")
            .condition("changedEntityName", "in", [ORDER, ITEM])
            .condition("pkPrimaryValue", orderId)
            .condition("changedFieldName", "in", Object.keys(fieldLabels))
            .orderBy("-changedDate")
            .limit(200)
            .list()
    )
    const users = {}
    for (const userId of new Set(logs.map(row => row.changedByUserId).filter(Boolean)))
        users[userId] = one("moqui.security.UserAccount", {userId})?.userFullName || userId
    const valueOf = (field, value) =>
        value == null
            ? ""
            : field === "statusId"
              ? statusText(value)
              : field === "requiredByDate"
                ? lib.dateText(value)
                : String(value)
    return logs.map(row => ({
        changedText: lib.dateText(row.changedDate),
        whatText:
            (row.changedEntityName === ITEM ? "Line " + row.pkSecondaryValue + " " : "") + fieldLabels[row.changedFieldName],
        fromText:
            row.changedFieldName === "unitAmount" && !showAmounts ? "Withheld" : valueOf(row.changedFieldName, row.oldValueText),
        toText:
            row.changedFieldName === "unitAmount" && !showAmounts ? "Withheld" : valueOf(row.changedFieldName, row.newValueText),
        byText: users[row.changedByUserId] || ""
    }))
}
// get#OrderDetail: one purchase order the user may work with, and what they may do with it.
function detail(p) {
    const userScope = purchasing.required()
    const record = purchasing.recordOf(userScope, "order", p.orderId)
    const can = userScope.capabilities
    const orderId = record.recordId
    const order = one(ORDER, {orderId})
    const part = rows("mantle.order.OrderPart", {orderId})[0]
    const currency = order.currencyUomId
    const showAmounts = amountsVisible(can)
    const names = lib.partyNames([part.vendorPartyId, part.customerPartyId])
    const statusId = order.statusId
    const items = rows(ITEM, {orderId})
        .filter(item => !item.parentItemSeqId)
        .sort((a, b) => String(a.orderItemSeqId).localeCompare(String(b.orderItemSeqId)))
    const products = {}
    for (const productId of new Set(items.map(item => item.productId).filter(Boolean)))
        products[productId] = one("mantle.product.Product", {productId})
    const receipts = rows("mantle.product.receipt.AssetReceipt", {orderId})
    const acceptances = rows("mantle.order.purchase.ServiceAcceptance", {orderId})
    const billings = rows("mantle.order.OrderItemBilling", {orderId})
    const costCenters = lib.partyNames(items.map(item => item.costCenterId))
    const stockTypes = ["PtAsset", "PtDigitalAsset", "PtAssetUse", "PtPickAssembly"]
    const itemRows = items.map(item => {
        const product = item.productId ? products[item.productId] : null
        const receivedQuantity = receipts
            .filter(row => row.orderItemSeqId === item.orderItemSeqId)
            .reduce((sum, row) => sum.add(dec(row.quantityAccepted)).add(dec(row.quantityRejected)), toDecimal(0))
        const acceptedQuantity = acceptances
            .filter(row => row.orderItemSeqId === item.orderItemSeqId)
            .reduce((sum, row) => sum.add(dec(row.acceptedQuantity)), toDecimal(0))
        const billedQuantity = billings
            .filter(row => row.orderItemSeqId === item.orderItemSeqId)
            .reduce((sum, row) => sum.add(dec(row.quantity)), toDecimal(0))
        const service = !!product && !stockTypes.includes(product.productTypeEnumId)
        const done = service ? acceptedQuantity : receivedQuantity
        const open = dec(item.quantity).subtract(done)
        return {
            orderItemSeqId: item.orderItemSeqId,
            productId: item.productId || "",
            productText: product ? (product.pseudoId || product.productId) + " · " + (product.productName || "") : "",
            // the description when it says more than the product's name (create#OrderItem copies the name)
            description: product && item.itemDescription === product.productName ? "" : item.itemDescription || "",
            quantity: item.quantity,
            quantityText: quantityText(item.quantity),
            unitText: item.quantityUomId
                ? one("moqui.basic.Uom", {uomId: item.quantityUomId})?.abbreviation || item.quantityUomId
                : "",
            quantityUomId: item.quantityUomId || "",
            cancelledText:
                item.quantityCancelled && !dec(item.quantityCancelled).isZero() ? quantityText(item.quantityCancelled) : "",
            receivedText: service ? "" : quantityText(receivedQuantity),
            acceptedText: service ? quantityText(acceptedQuantity) : "",
            billedText: quantityText(billedQuantity),
            openText: quantityText(open.compare(0) > 0 ? open : 0),
            unitAmount: showAmounts ? item.unitAmount : null,
            priceText: showAmounts ? money(item.unitAmount, currency) : "Withheld",
            amountText: showAmounts ? money(dec(item.quantity).multiply(dec(item.unitAmount)), currency) : "Withheld",
            requiredText: item.requiredByDate ? lib.dateText(item.requiredByDate) : "",
            requiredByDate: item.requiredByDate || null,
            costCenterId: item.costCenterId || "",
            costCenterText: item.costCenterId ? costCenters[item.costCenterId] || item.costCenterId : "",
            isService: service,
            canAccept: service && open.compare(0) > 0
        }
    })
    const holds = rows("mantle.order.OrderHoldReason", {orderId}).sort((a, b) => lib.ms(b.placedDate) - lib.ms(a.placedDate))
    const userName = userId => (userId ? one("moqui.security.UserAccount", {userId})?.userFullName || userId : "")
    const holdRows = holds.map(row => ({
        orderHoldReasonId: row.orderHoldReasonId,
        typeText: enumText(row.holdTypeEnumId),
        holdTypeEnumId: row.holdTypeEnumId,
        comment: row.holdComment || "",
        placedText: [lib.dateText(row.placedDate), userName(row.placedByUserId)].filter(Boolean).join(" · "),
        releasedText: row.releasedDate
            ? [lib.dateText(row.releasedDate), userName(row.releasedByUserId), row.releaseComment].filter(Boolean).join(" · ")
            : "",
        open: !row.releasedDate
    }))
    const openHolds = holdRows.filter(row => row.open)
    const purchaseHold = openHolds.find(row => row.holdTypeEnumId === "OhtPurchase") || null
    const contentRows = rows("mantle.order.OrderContent", {orderId})
        .sort((a, b) => lib.ms(b.contentDate) - lib.ms(a.contentDate))
        .map(row => ({
            orderContentId: row.orderContentId,
            description:
                row.description ||
                String(row.contentLocation || "")
                    .split("/")
                    .pop(),
            typeText: enumText(row.orderContentTypeEnumId),
            dateText: lib.dateText(row.contentDate),
            // the issued PDF shows the prices (contentReadable)
            canOpen: showAmounts || row.orderContentTypeEnumId !== "OctPurchaseOrderIssued"
        }))
    const emailRows = rows("mantle.order.OrderEmailMessage", {orderId}).map(row => {
        const message = one("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId})
        return {
            revisionText: row.orderRevision == null ? "" : "Revision " + row.orderRevision,
            toText: message?.toAddresses || "",
            statusText: statusText(message?.statusId),
            sentText: lib.dateText(message?.sentDate || message?.lastUpdatedStamp)
        }
    })
    const decisionRows = rows("mantle.order.purchase.PurchaseApprovalDecision", {sourceId: orderId})
        .filter(row => row.sourceEntityName === ORDER)
        .sort((a, b) => lib.ms(b.decisionDate) - lib.ms(a.decisionDate))
        .map(row => ({
            decisionText: enumText(row.decisionEnumId),
            revisionText: "Revision " + row.sourceRevision,
            byText: userName(row.decidedByUserId),
            dateText: lib.dateText(row.decisionDate),
            reason: row.reason || "",
            // P4: the policy step it decided, and a later revision that superseded it
            stepText: row.stepSeqId && row.approvalPolicyId ? "Step " + row.stepSeqId : "",
            supersededText: row.supersededDate ? "Superseded " + lib.dateText(row.supersededDate) : ""
        }))
    // P4: the approval's steps, who may decide the one waiting and the budget's decision (preview#PurchaseApproval), for a
    // buyer, an approver or the policy administrator; the budget is withheld from a buyer
    const approval = approvalPreview(orderId, can)
    const facility = part.facilityId ? one("mantle.facility.Facility", {facilityId: part.facilityId}) : null
    const received = receipts.length > 0
    const draft = statusId === "OrderOpen"
    const working = ["OrderApproved", "OrderSent", "OrderProcessing"].includes(statusId)
    const revision = Number(order.orderRevision ?? 1)
    const actions = {
        edit: draft && !!can.buy,
        place: draft && !!can.buy && itemRows.length > 0,
        approve: statusId === "OrderPlaced" && !!can.approve && !!can.orderApprove && (!approval || approval.canDecide),
        refuse: statusId === "OrderPlaced" && !!can.approve && (!approval || approval.canDecide),
        send: ["OrderApproved", "OrderSent"].includes(statusId) && !!can.buy,
        hold: ["OrderPlaced", "OrderProcessing", "OrderApproved", "OrderSent"].includes(statusId) && !!can.buy && !purchaseHold,
        release: !!purchaseHold && !!can.holdRelease,
        cancel: !!can.buy && !received && !["OrderCompleted", "OrderCancelled", "OrderRejected"].includes(statusId),
        close: !!can.buy && working,
        clone: !!can.buy,
        accept: (!!can.buy || !!can.receive) && working && itemRows.some(row => row.canAccept),
        print: !!(can.buy || can.approve || can.orderApprove)
    }
    const stages = ["OrderOpen", "OrderPlaced", "OrderApproved", "OrderSent", "OrderCompleted"]
    return {
        purchaseOrder: {
            orderId,
            orderName: order.orderName || "",
            statusId,
            statusText: statusText(statusId),
            statusColor: statusColors[statusId] || "grey-8",
            stageStatusIds: stages.includes(statusId) ? stages.join(",") : stages.concat([statusId]).join(","),
            orderRevision: revision,
            organizationPartyId: part.customerPartyId,
            organizationName: names[part.customerPartyId] || part.customerPartyId,
            supplierPartyId: part.vendorPartyId,
            supplierName: names[part.vendorPartyId] || part.vendorPartyId,
            supplierReference: part.otherPartyOrderId || "",
            facilityId: part.facilityId || "",
            facilityName: facility ? facility.facilityName || facility.facilityId : "",
            currencyUomId: currency,
            entryText: lib.dateText(order.entryDate),
            placedText: lib.dateText(order.placedDate),
            approvedText: lib.dateText(order.approvedDate),
            totalText: showAmounts ? money(order.grandTotal, currency) : "Withheld",
            held: openHolds.length > 0,
            holdText: openHolds.map(row => row.typeText + (row.comment ? ": " + row.comment : "")).join("; "),
            purchaseHoldId: purchaseHold?.orderHoldReasonId || null,
            itemRows,
            holdRows,
            contentRows,
            emailRows,
            decisionRows,
            approval,
            historyRows: auditRows(orderId, showAmounts),
            actions
        }
    }
}

// The order's approval preview (mantle.order.PurchaseServices.preview#PurchaseApproval) as a probe: null for a user it
// refuses or when it fails, which is logged.
function approvalPreview(orderId, can) {
    if (!(can.buy || can.approve || can.policyEdit)) return null
    ec.message.pushErrors()
    try {
        const out =
            ec.service
                .sync()
                .name("mantle.order.PurchaseServices.preview#PurchaseApproval")
                .parameters({orderId})
                .requireNewTransaction(true)
                .call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return out.preview || null
    } catch (error) {
        ec.logger.warn("Approval preview of purchase order " + orderId + ": " + error.message)
        return null
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== bulk =====
// bulk#PurchaseOrderActions: approve (decide#PurchaseApproval at each order's revision) or close the remainder
// (close#PurchaseRemainders with the reason) of each selected order, each in its own transaction: a refusal is named with its
// reason and the others go on.
function bulk(p) {
    const userScope = purchasing.required()
    const action = String(p.action || "")
    if (!["approve", "close"].includes(action)) denied("ACTION_INVALID", "Choose approve or close")
    const orderIds = [...new Set(Array.from(p.orderIds || []).map(String))].filter(Boolean)
    if (!orderIds.length || orderIds.length > 100) denied("SELECTION_INVALID", "Select between one and 100 purchase orders")
    if (action === "close" && blank(p.reason)) denied("REASON_REQUIRED", "Give a reason for closing the remainders")
    const results = []
    for (const orderId of orderIds) {
        ec.message.pushErrors()
        try {
            purchasing.recordOf(userScope, "order", orderId)
            const service =
                action === "approve"
                    ? "mantle.order.PurchaseServices.decide#PurchaseApproval"
                    : "mantle.order.OrderServices.close#PurchaseRemainders"
            const parameters =
                action === "approve"
                    ? {
                          orderId,
                          orderRevision: p.orderRevisions?.[orderId] ?? one(ORDER, {orderId})?.orderRevision ?? null,
                          reason: p.reason || null
                      }
                    : {orderId, reason: String(p.reason)}
            const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
            if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
            results.push({
                orderId,
                resultCode: "DONE",
                message:
                    action === "approve"
                        ? out.pendingStepText
                            ? "Approved; waiting for " + out.pendingStepText
                            : "Approved"
                        : "Closed; now " + statusText(out.orderStatusId)
            })
        } catch (error) {
            const message = String(error.message || error)
                .split("\n")[0]
                .replace(/^Error: /, "")
            results.push({orderId, resultCode: lib.reasonCode({message}) || "REFUSED", message})
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    const done = results.filter(row => row.resultCode === "DONE").length
    const verb = action === "approve" ? "approved" : "closed"
    return {
        results,
        summary:
            done +
            " of " +
            results.length +
            " " +
            verb +
            (done < results.length
                ? "; " +
                  results
                      .filter(row => row.resultCode !== "DONE")
                      .map(row => row.orderId + ": " + row.message)
                      .join("; ")
                : "")
    }
}

// ===== Home =====
// Home's purchase order counts (P3): drafts and approved orders not sent, of the user's organizations, for the list groups.
function homeCounts(userScope) {
    if (!userScope.capabilities.listRead) return {draftCount: null, unsentCount: null}
    const buyers = buyerIdsOf(userScope)
    return {
        draftCount: purchaseFind(buyers).condition("statusId", "OrderOpen").count(),
        unsentCount: purchaseFind(buyers).condition("statusId", "OrderApproved").count()
    }
}
// Home's work rows (P3): approved orders to send, for a buyer, oldest first.
function workRows(userScope, limit) {
    if (!userScope.capabilities.buy) return []
    const found = Array.from(
        purchaseFind(buyerIdsOf(userScope))
            .condition("statusId", "OrderApproved")
            .orderBy("approvedDate")
            .limit(Math.max(1, Math.min(50, Number(limit) || 20)))
            .list()
    )
    const names = lib.partyNames(found.map(row => row.vendorPartyId))
    const showAmounts = amountsVisible(userScope.capabilities)
    return found.map(row => ({
        documentText: "Purchase order " + row.orderId + (row.orderName ? " · " + row.orderName : ""),
        url: purchasing.recordUrl("order", row.orderId),
        supplierName: names[row.vendorPartyId] || row.vendorPartyId,
        ownerName: "",
        dueText: lib.dateText(row.approvedDate),
        amountText: showAmounts ? money(row.grandTotal, row.currencyUomId) : "",
        nextAction: "Send to the supplier"
    }))
}

// ===== choices =====
// The products a purchase order line may name: the user's organizations' and the shared catalog's, by id and name.
function productChoices(userScope, term, selected) {
    const factory = ec.entity.conditionFactory
    const owners = ["_NA_"].concat(buyerIdsOf(userScope))
    const ownerCondition = () =>
        factory.makeCondition(
            [factory.makeCondition("ownerPartyId", "is-null", null), factory.makeCondition("ownerPartyId", "in", owners)],
            "or"
        )
    let query = find("mantle.product.Product")
        .condition(ownerCondition())
        .condition("productTypeEnumId", "not-equals", "PtVirtual")
        .orderBy("pseudoId")
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["productId", "pseudoId", "productName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const label = row => (row.pseudoId || row.productId) + " · " + (row.productName || "")
    const options = Array.from(query.list()).map(row => ({value: row.productId, label: label(row)}))
    if (selected && !options.some(option => option.value === selected)) {
        const product = one("mantle.product.Product", {productId: selected})
        if (product && (!product.ownerPartyId || owners.includes(product.ownerPartyId)))
            options.push({value: selected, label: label(product)})
    }
    return options
}
// The cost centres of the user's organizations: each organization and those that roll up to it (as Accounting's).
function costCenterChoices(userScope, term, selected) {
    const buyers = buyerIdsOf(userScope)
    const ids = new Set(buyers)
    for (const row of find("mantle.party.PartyRelationship")
        .condition("toPartyId", "in", buyers.length ? buyers : ["_NA_"])
        .condition("relationshipTypeEnumId", "PrtOrgRollup")
        .list())
        if (lib.active(row)) ids.add(row.fromPartyId)
    const names = lib.partyNames([...ids])
    const options = [...ids]
        .map(partyId => ({value: partyId, label: names[partyId] || partyId}))
        .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label))
    const limited = options.slice(0, choiceLimit)
    if (selected && !limited.some(option => option.value === selected)) {
        const found = options.find(option => option.value === selected)
        if (found) limited.push(found)
    }
    return limited
}

// Whether the user may open an order's stored file (OrderDetail's orderContent): the issued PDF shows the prices, so only to
// a user who sees amounts.
const contentReadable = content =>
    content?.orderContentTypeEnumId !== "OctPurchaseOrderIssued" || amountsVisible(purchasing.required().capabilities)

const operations = {findOrders, detail, bulk}
;({
    contentReadable,
    homeCounts,
    workRows,
    productChoices,
    costCenterChoices,
    views,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing order operation " + op)
        return operations[op](parameters)
    }
})
