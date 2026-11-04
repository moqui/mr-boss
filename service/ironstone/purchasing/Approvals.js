// Purchasing's approval reads (design-purchasing §12 ApprovalPolicies, §6 Approvals, §3 Home; impl-purchasing P4): the
// ApprovalPolicyList of an organization's approval policy rows, Home's approvals-waiting count and the Today source of the
// decisions waiting for the user. The rules (the policies' store, the steps, the decisions and the preview) are Mantle's
// mantle.order.PurchaseServices, which the screens call after AccessServices; nothing here decides.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const {find, one, rows, denied, ms} = lib

const POLICY = "mantle.order.purchase.PurchaseApprovalPolicy"
// the approval topics Purchasing lists (Approvals.xml); P10 and P12 add theirs
const topics = ["PurchaseOrderApproval", "PurchaseSupplierApproval"]
const blank = value => value == null || String(value).trim() === ""
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const userName = userId => (userId ? one("moqui.security.UserAccount", {userId})?.userFullName || userId : "")
const amountText = (value, currencyUomId) =>
    value == null ? "" : currencyUomId ? ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId) : String(value)

function organizationOf(userScope, organizationPartyId) {
    const ids = userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    if (!blank(organizationPartyId)) {
        if (!ids.includes(organizationPartyId)) denied("RECORD_UNAVAILABLE", "Organization is not available")
        return organizationPartyId
    }
    return userScope.activeOrganizationPartyId || userScope.organizationPartyIds[0] || ids[0] || null
}
// The band of a row as words: "From $100.00", "Under $100.00", "$0.00 to $100.00".
function bandText(row) {
    const from = row.fromAmount == null ? null : amountText(row.fromAmount, row.currencyUomId)
    const thru = row.thruAmount == null ? null : amountText(row.thruAmount, row.currencyUomId)
    if (thru) return (from ? from : amountText(0, row.currencyUomId)) + " to under " + thru
    return from ? "From " + from : "Any amount"
}

// find#PurchaseApprovalPolicies: the organization's approval policy rows of a source type (every type when empty), in effect
// now (inEffect Y, the default) or every row with its dates, by source, band and step; for the Settings area.
function findPolicies(p) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.settings) denied("PERMISSION_DENIED", "Purchasing settings are not available")
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const now = ms(ec.user.nowTimestamp)
    let query = find(POLICY, {organizationPartyId})
    if (!blank(p.sourceTypeEnumId)) query = query.condition("sourceTypeEnumId", p.sourceTypeEnumId)
    const all = Array.from(query.orderBy("sourceTypeEnumId").orderBy("fromAmount").orderBy("sequenceNum").limit(500).list())
    const effective = row => lib.active(row, now)
    const listed = p.inEffect === "N" ? all : all.filter(row => effective(row) || ms(row.fromDate) > now)
    const policyRows = listed.map(row => ({
        purchaseApprovalPolicyId: row.purchaseApprovalPolicyId,
        sourceTypeEnumId: row.sourceTypeEnumId,
        sourceText: enumText(row.sourceTypeEnumId),
        bandText: bandText(row),
        fromAmount: row.fromAmount,
        thruAmount: row.thruAmount,
        currencyUomId: row.currencyUomId || "",
        scopeText: [
            row.productCategoryId
                ? "Category " +
                  (one("mantle.product.category.ProductCategory", {productCategoryId: row.productCategoryId})?.categoryName ||
                      row.productCategoryId)
                : "",
            row.facilityId
                ? "Facility " + (one("mantle.facility.Facility", {facilityId: row.facilityId})?.facilityName || row.facilityId)
                : ""
        ]
            .filter(Boolean)
            .join(", "),
        productCategoryId: row.productCategoryId || "",
        facilityId: row.facilityId || "",
        sequenceNum: row.sequenceNum,
        stepText: "Step " + (row.sequenceNum || 1),
        approverText: row.approverUserId
            ? userName(row.approverUserId)
            : row.approverUserGroupId
              ? one("moqui.security.UserGroup", {userGroupId: row.approverUserGroupId})?.description || row.approverUserGroupId
              : "Any purchase approver",
        approverUserId: row.approverUserId || "",
        approverUserGroupId: row.approverUserGroupId || "",
        quorum: row.quorum || 1,
        rulesText: [
            (row.quorum || 1) > 1 ? row.quorum + " approvers" : "",
            row.separateApprover === "Y" ? "Another approver than the earlier steps'" : "",
            row.selfApprovalAllowed === "Y" ? "Self-approval allowed" : row.selfApprovalAllowed === "N" ? "No self-approval" : "",
            row.expiryDays ? "Good for " + row.expiryDays + " days" : ""
        ]
            .filter(Boolean)
            .join(" · "),
        selfApprovalAllowed: row.selfApprovalAllowed || "",
        separateApprover: row.separateApprover || "",
        expiryDays: row.expiryDays,
        description: row.description || "",
        fromDateText: lib.dateText(row.fromDate),
        thruDateText: lib.dateText(row.thruDate),
        inEffect: effective(row),
        stateText: effective(row) ? "In effect" : ms(row.fromDate) > now ? "From " + lib.dateText(row.fromDate) : "Ended",
        canChange: !!userScope.capabilities.policyEdit && (row.thruDate == null || ms(row.thruDate) > now)
    }))
    return {
        organizationPartyId,
        organizationName: lib.partyNames([organizationPartyId])[organizationPartyId] || organizationPartyId,
        policyRows,
        canEdit: !!userScope.capabilities.policyEdit
    }
}

// The user's approval messages waiting (unread, of Purchasing's topics), newest first.
function waiting(limit) {
    if (!ec.user.userId) return []
    return Array.from(
        find("moqui.security.user.NotificationMessageByUser", {userId: ec.user.userId})
            .condition("topic", "in", topics)
            .condition("viewedDate", "is-null", null)
            .orderBy("-sentDate")
            .limit(limit)
            .list()
    )
}
// Home's approvals-waiting count (P4): the user's decisions waiting, for a purchase approver (Approvals' groups).
function homeCount(userScope) {
    if (!userScope.capabilities.approvals || !userScope.capabilities.approve) return {approvalCount: null}
    return {
        approvalCount: find("moqui.security.user.NotificationMessageByUser", {userId: ec.user.userId})
            .condition("topic", "in", topics)
            .condition("viewedDate", "is-null", null)
            .count()
    }
}
// The Purchasing today-source (get#UserTodayItems calls it): the approval decisions waiting for the user, due from when they
// were sent, each opening its order or supplier. Another user's Today and a user without Purchasing's approvals get none.
function today(p) {
    const label = "Purchasing"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = purchasing.scope()
    if (!userScope.read || !userScope.capabilities.approvals || !userScope.capabilities.approve) return {items: [], label}
    const items = []
    for (const row of waiting(50)) {
        let message = {}
        try {
            message = JSON.parse(row.messageJson || "{}")
        } catch (error) {
            ec.logger.warn("Approval notification " + row.notificationMessageId + " message is not JSON: " + error.message)
        }
        const order = row.recordEntityName === "mantle.order.OrderHeader"
        const url = order
            ? purchasing.recordUrl("order", row.recordId)
            : purchasing.recordUrl("supplier", row.recordId) +
              (message.organizationPartyId ? "&organizationPartyId=" + encodeURIComponent(message.organizationPartyId) : "")
        items.push({
            kind: "purchaseApproval",
            workEffortId: null,
            requestId: null,
            title: order
                ? "Approve purchase order " + row.recordId + (message.supplierName ? " · " + message.supplierName : "")
                : "Approve supplier " + (message.supplierName || row.recordId),
            dueDate: row.sentDate,
            startDate: null,
            endDate: null,
            allDay: false,
            priority: null,
            statusId: null,
            assignees: [],
            canUpdate: false,
            hasCallLink: false,
            url,
            record: {
                recordEntityName: row.recordEntityName,
                recordId: row.recordId,
                recordName: order ? "Purchase order " + row.recordId : message.supplierName || row.recordId
            }
        })
    }
    return {items, label}
}

// ===== choices =====
const choiceLimit = 30
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const approveGroupIds = () =>
    rows("moqui.security.UserGroupPermission", {userPermissionId: "PURCHASE_APPROVE"})
        .filter(row => lib.active(row))
        .map(row => row.userGroupId)
// The users who may approve in the user's organizations: members of a group holding PURCHASE_APPROVE whose party works for one
// of them, by name.
function approverChoices(userScope, term, selected) {
    const groupIds = approveGroupIds()
    if (!groupIds.length) return []
    const userIds = [
        ...new Set(
            Array.from(find("moqui.security.UserGroupMember").condition("userGroupId", "in", groupIds).list())
                .filter(row => lib.active(row))
                .map(row => row.userId)
        )
    ]
    if (!userIds.length) return []
    const organizationIds =
        userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    const accounts = Array.from(find("moqui.security.UserAccount").condition("userId", "in", userIds).list()).filter(
        row => row.partyId && row.disabled !== "Y"
    )
    if (!accounts.length) return []
    const members = new Set(
        Array.from(
            find("mantle.party.PartyRelationship")
                .condition("toPartyId", "in", organizationIds)
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee", "PrtMember"])
                .condition(
                    "fromPartyId",
                    "in",
                    accounts.map(row => row.partyId)
                )
                .list()
        )
            .filter(row => lib.active(row))
            .map(row => row.fromPartyId)
    )
    const lower = term.toLowerCase()
    const options = accounts
        .filter(row => members.has(row.partyId))
        .map(row => ({value: row.userId, label: row.userFullName || row.username || row.userId}))
        .filter(option => !term || option.label.toLowerCase().includes(lower))
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, choiceLimit)
    if (selected && !options.some(option => option.value === selected) && accounts.some(row => row.userId === selected))
        options.push({value: selected, label: userName(selected)})
    return options
}
// The user groups holding PURCHASE_APPROVE.
function approverGroupChoices(term, selected) {
    const groupIds = approveGroupIds()
    if (!groupIds.length) return []
    const lower = term.toLowerCase()
    return Array.from(find("moqui.security.UserGroup").condition("userGroupId", "in", groupIds).list())
        .map(row => ({value: row.userGroupId, label: row.description || row.userGroupId}))
        .filter(option => !term || option.label.toLowerCase().includes(lower) || option.value === selected)
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, choiceLimit)
}
// The product categories a step may be limited to, by name or id.
function categoryChoices(term, selected) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.product.category.ProductCategory").orderBy("categoryName").limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["productCategoryId", "categoryName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({
        value: row.productCategoryId,
        label: row.categoryName || row.productCategoryId
    }))
    if (selected && !options.some(option => option.value === selected)) {
        const row = one("mantle.product.category.ProductCategory", {productCategoryId: selected})
        if (row) options.push({value: selected, label: row.categoryName || selected})
    }
    return options
}

const operations = {findPolicies, today}
;({
    homeCount,
    approverChoices,
    approverGroupChoices,
    categoryChoices,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing approval operation " + op)
        return operations[op](parameters)
    }
})
