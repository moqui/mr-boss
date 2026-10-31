// The Budgets screens' reads (design-accounting §12): budgets with their totals and state, a budget's accounts by period
// as of a revision with its revisions, parties and commitments, the control policy rows, the exceptions and the
// commitments. Mantle's BudgetServices own the writes and the amounts as of a revision; these check the Accounting read
// and shape rows for the screens.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const policy = lib.policy
const {find, one} = policy
const COMMITMENT = "mantle.other.budget.BudgetCommitment"
const statusColors = {
    BudgetDraft: "grey",
    BudgetApproved: "positive",
    BudgetClosed: "info",
    BudgetCancelled: "negative",
    BcReserved: "info",
    BcConverted: "grey",
    BcActual: "positive",
    BcReleased: "grey",
    BcBlocked: "negative"
}
const sourceLabels = {
    "mantle.account.invoice.Invoice": "Bill",
    "mantle.order.OrderHeader": "Purchase order",
    "mantle.request.Request": "Request"
}

// The Budgets screens open for finance readers and administrators.
function access(p) {
    return lib.access(p, ["reportRead", "admin"], "Budget read authority is required")
}
function organizations(scope) {
    const ids = scope.organizationPartyId ? [scope.organizationPartyId] : scope.allowedOrganizationPartyIds
    return ids.length ? ids : ["_DENIED_"]
}
function byId(entity, field, ids) {
    const unique = [...new Set(ids.filter(Boolean))]
    if (!unique.length) return {}
    return Object.fromEntries(Array.from(find(entity).condition(field, "in", unique).list()).map(row => [row[field], row]))
}
function accountTexts(ids) {
    const accounts = byId("mantle.ledger.account.GlAccount", "glAccountId", ids)
    return Object.fromEntries(
        Object.entries(accounts).map(([id, row]) => [id, (row.accountCode || id) + " — " + (row.accountName || "")])
    )
}
function descriptions(entity, field, ids, label = "description") {
    return Object.fromEntries(Object.entries(byId(entity, field, ids)).map(([id, row]) => [id, row[label] || id]))
}
function statusOf(statusId) {
    return {statusText: lib.statusText(statusId || "BudgetDraft"), statusColor: statusColors[statusId || "BudgetDraft"] || "grey"}
}
function searched(query, fields, text) {
    if (!text) return query
    const conditions = ec.entity.conditionFactory
    return query.condition(
        conditions.makeCondition(
            fields.map(field => conditions.makeCondition(field, "like", "%" + text + "%").ignoreCase()),
            "or"
        )
    )
}
// The budgets' totals: each account's whole-period amount, else the sum of its sub period amounts.
function totals(budgetIds) {
    const out = {}
    if (!budgetIds.length) return out
    const byAccount = {}
    for (const item of find("mantle.other.budget.BudgetItem").condition("budgetId", "in", budgetIds).list()) {
        if (item.amount == null || !item.glAccountId) continue
        const key = item.budgetId + ":" + item.glAccountId
        const entry = (byAccount[key] ??= {budgetId: item.budgetId, main: null, subs: toDecimal(0)})
        if (item.subTimePeriodId) entry.subs = entry.subs.add(item.amount)
        else entry.main = toDecimal(item.amount)
    }
    for (const entry of Object.values(byAccount))
        out[entry.budgetId] = (out[entry.budgetId] || toDecimal(0)).add(entry.main ?? entry.subs)
    return out
}

function budgets(p) {
    const scope = access(p)
    const periods = Array.from(
        find("mantle.party.time.TimePeriod").condition("partyId", "in", organizations(scope)).selectField("timePeriodId").list()
    ).map(row => row.timePeriodId)
    const query = () => {
        let query = searched(
            find("mantle.other.budget.Budget").condition("timePeriodId", "in", periods.length ? periods : ["_DENIED_"]),
            ["budgetId", "description"],
            p.text
        )
        if (p.statusId) query = query.condition("statusId", p.statusId)
        if (p.timePeriodId) query = query.condition("timePeriodId", p.timePeriodId)
        return query
    }
    const page = policy.lib.page(query().orderBy("-budgetId"), p, "records", query().count())
    const periodRows = byId(
        "mantle.party.time.TimePeriod",
        "timePeriodId",
        page.rows.map(row => row.timePeriodId)
    )
    const types = descriptions(
        "moqui.basic.Enumeration",
        "enumId",
        page.rows.map(row => row.budgetTypeEnumId)
    )
    const sums = totals(page.rows.map(row => row.budgetId))
    const revisionCounts = {}
    if (page.rows.length)
        for (const row of find("mantle.other.budget.BudgetRevision")
            .condition(
                "budgetId",
                "in",
                page.rows.map(row => row.budgetId)
            )
            .list())
            revisionCounts[row.budgetId] = Math.max(revisionCounts[row.budgetId] ?? -1, Number(row.revisionSeqId))
    const names = policy.lib.partyNames(Object.values(periodRows).map(row => row.partyId))
    const records = page.rows.map(row => {
        const period = periodRows[row.timePeriodId]
        const revision = revisionCounts[row.budgetId]
        return Object.assign(lib.plain(row), statusOf(row.statusId), {
            title: row.description || row.budgetId,
            periodName: period?.periodName || row.timePeriodId,
            organizationPartyId: period?.partyId,
            organizationName: names[period?.partyId] || period?.partyId || "",
            typeText: types[row.budgetTypeEnumId] || "",
            totalAmount: sums[row.budgetId] ?? toDecimal(0),
            revisionText: revision == null ? "" : revision === 0 ? "Approved" : "Revision " + revision
        })
    })
    return Object.assign(lib.paging(page), {records, canEdit: !!scope.capabilities.budgetEdit})
}

// A budget for BudgetDetail, as of a revision (revisionSeqId; the last by default): its header, what the user may do, one
// row per account with its whole-period and sub period amounts, its revisions with their PDFs, parties and recent
// commitments. A budget that does not exist or is not in the user's organizations has recordFound false.
function budgetDetail(p) {
    const scope = access(p)
    const empty = {recordFound: false, budget: {}, accountRows: [], revisionRows: [], partyRows: [], commitmentRows: []}
    const budget = p.budgetId ? one("mantle.other.budget.Budget", {budgetId: p.budgetId}) : null
    const period = budget?.timePeriodId ? one("mantle.party.time.TimePeriod", {timePeriodId: budget.timePeriodId}) : null
    if (!budget || !period || !scope.allowedOrganizationPartyIds.includes(period.partyId)) return empty
    const amounts = policy.call("mantle.other.BudgetServices.get#BudgetAmounts", {
        budgetId: p.budgetId,
        revisionSeqId: p.revisionSeqId || null
    })
    const subs = Array.from(amounts.subTimePeriodList || [])
    const items = Array.from(amounts.itemList || [])
    const currencyUomId = budget.currencyUomId
    const texts = accountTexts(items.map(item => item.glAccountId))
    const accountRows = {}
    for (const item of items) {
        if (!item.glAccountId) continue
        const row = (accountRows[item.glAccountId] ??= {
            glAccountId: item.glAccountId,
            accountText: texts[item.glAccountId] || item.glAccountId,
            amountMain: null,
            currencyUomId
        })
        if (!item.subTimePeriodId) row.amountMain = item.amount
        else {
            const index = subs.findIndex(sub => sub.timePeriodId === item.subTimePeriodId)
            if (index >= 0) row["amountPer" + (index + 1)] = item.amount
        }
    }
    for (const row of Object.values(accountRows)) {
        const parts = subs
            .map((sub, index) => [sub, row["amountPer" + (index + 1)]])
            .filter(([, amount]) => amount != null)
            .map(([sub, amount]) => (sub.periodName || sub.timePeriodId) + " " + lib.money(amount, currencyUomId))
        row.periodsText = parts.join(" · ")
        if (row.amountMain == null)
            row.amountMain = subs.reduce(
                (sum, sub, index) => sum.add(toDecimal(row["amountPer" + (index + 1)] ?? 0)),
                toDecimal(0)
            )
    }
    const total = Object.values(accountRows).reduce((sum, row) => sum.add(toDecimal(row.amountMain ?? 0)), toDecimal(0))
    const contents = policy.rows("mantle.other.budget.BudgetContent", {budgetId: p.budgetId})
    const revisers = descriptions(
        "moqui.security.UserAccount",
        "userId",
        Array.from(amounts.revisionList || []).map(row => row.revisedByUserId),
        "userFullName"
    )
    const revisionRows = Array.from(amounts.revisionList || [])
        .map(row => {
            const content = contents.find(file => file.revisionSeqId === row.revisionSeqId)
            return {
                revisionSeqId: row.revisionSeqId,
                revisionText: Number(row.revisionSeqId) === 0 ? "Approved" : "Revision " + Number(row.revisionSeqId),
                dateRevisedText: row.dateRevisedText || "",
                description: row.description || "",
                revisedByName: revisers[row.revisedByUserId] || row.revisedByUserId || "",
                budgetContentId: content?.budgetContentId || null,
                isShown: amounts.revisionSeqId === row.revisionSeqId
            }
        })
        .reverse()
    const parties = policy.rows("mantle.other.budget.BudgetParty", {budgetId: p.budgetId})
    const partyNames = policy.lib.partyNames(parties.map(row => row.partyId))
    const roles = descriptions(
        "mantle.party.RoleType",
        "roleTypeId",
        parties.map(row => row.roleTypeId)
    )
    const partyRows = parties.map(row => ({
        partyId: row.partyId,
        roleTypeId: row.roleTypeId,
        partyName: partyNames[row.partyId] || row.partyId,
        roleText: roles[row.roleTypeId] || row.roleTypeId
    }))
    const commitmentRows = commitmentShapes(
        Array.from(find(COMMITMENT, {budgetId: p.budgetId}).orderBy("-createdDate").limit(50).list())
    )
    const c = scope.capabilities
    const statusId = budget.statusId || "BudgetDraft"
    const revisionNumber = amounts.revisionSeqId == null ? null : Number(amounts.revisionSeqId)
    const latest = revisionRows.length ? revisionRows[0].revisionSeqId : null
    const header = Object.assign(lib.plain(budget), statusOf(statusId), {
        title: budget.description || budget.budgetId,
        periodName: period.periodName || period.timePeriodId,
        organizationName: policy.lib.partyNames([period.partyId])[period.partyId] || period.partyId,
        typeText: budget.budgetTypeEnumId
            ? one("moqui.basic.Enumeration", {enumId: budget.budgetTypeEnumId})?.description || ""
            : "",
        currencyUomId,
        totalAmount: total,
        totalText: lib.money(total, currencyUomId),
        revisionSeqId: amounts.revisionSeqId,
        latestRevisionSeqId: latest,
        isLatest: amounts.revisionSeqId == null || amounts.revisionSeqId === latest,
        revisionText:
            revisionNumber == null ? "Draft" : revisionNumber === 0 ? "As approved" : "As of revision " + revisionNumber,
        canEdit: !!c.budgetEdit && statusId === "BudgetDraft",
        canApprove: !!c.budgetApprove && statusId === "BudgetDraft",
        canRevise:
            !!c.budgetEdit &&
            statusId === "BudgetApproved" &&
            (amounts.revisionSeqId == null || amounts.revisionSeqId === latest),
        canClose: !!c.budgetEdit && statusId === "BudgetApproved",
        canCancel: !!c.budgetEdit && statusId === "BudgetDraft",
        canEditParties: !!c.budgetEdit && !["BudgetClosed", "BudgetCancelled"].includes(statusId)
    })
    header.captionText = [header.organizationName, header.periodName, header.typeText, header.revisionText]
        .filter(Boolean)
        .join(" · ")
    return {
        recordFound: true,
        budget: header,
        accountRows: Object.values(accountRows).sort((a, b) => a.accountText.localeCompare(b.accountText)),
        subPeriodRows: subs.map((sub, index) => ({position: index + 1, periodName: sub.periodName || sub.timePeriodId})),
        revisionRows,
        partyRows,
        commitmentRows,
        organizationPartyId: period.partyId
    }
}

// Commitment rows for a list: source, budget, account, stage, amount, status, decision and who decided, with the source's
// Accounting link when it has one.
function commitmentShapes(found) {
    const budgetsById = byId(
        "mantle.other.budget.Budget",
        "budgetId",
        found.map(row => row.budgetId)
    )
    const texts = accountTexts(found.map(row => row.glAccountId))
    const enums = descriptions(
        "moqui.basic.Enumeration",
        "enumId",
        found.flatMap(row => [row.stageEnumId, row.decisionEnumId])
    )
    const users = descriptions(
        "moqui.security.UserAccount",
        "userId",
        found.flatMap(row => [row.createdByUserId, row.overrideByUserId]),
        "userFullName"
    )
    return found.map(row => {
        const out = lib.plain(row)
        const isBill = row.sourceEntityName === "mantle.account.invoice.Invoice"
        return Object.assign(out, statusOf(row.statusId), {
            sourceText:
                (sourceLabels[row.sourceEntityName] || "Document") +
                " " +
                row.sourceId +
                (row.sourceItemId ? " · " + row.sourceItemId : ""),
            sourceUrl: isBill
                ? "//Accounting/Payables/BillDetail"
                : row.sourceEntityName === "mantle.order.OrderHeader"
                  ? "//Accounting/Records/OrderDetail"
                  : "",
            sourceParameters: isBill ? {recordId: row.sourceId} : {orderId: row.sourceId},
            budgetText: budgetsById[row.budgetId]?.description || row.budgetId || "",
            accountText: texts[row.glAccountId] || row.glAccountId || "",
            stageText: enums[row.stageEnumId] || "",
            decisionText: enums[row.decisionEnumId] || "",
            createdByName: users[row.createdByUserId] || row.createdByUserId || "",
            overrideByName: users[row.overrideByUserId] || row.overrideByUserId || ""
        })
    })
}

function commitmentQuery(scope, p) {
    let query = find(COMMITMENT).condition("organizationPartyId", "in", organizations(scope))
    if (p.statusId) query = query.condition("statusId", p.statusId)
    if (p.budgetId) query = query.condition("budgetId", p.budgetId)
    if (p.budgetCommitmentId) query = query.condition("budgetCommitmentId", p.budgetCommitmentId)
    return searched(query, ["sourceId", "budgetCommitmentId"], p.text)
}
function commitments(p) {
    const scope = access(p)
    const query = () => commitmentQuery(scope, p).condition("statusId", "not-equals", "BcBlocked")
    const page = policy.lib.page(query().orderBy("-createdDate"), p, "records", query().count())
    return Object.assign(lib.paging(page), {records: commitmentShapes(page.rows)})
}
// The exceptions: spending a Stop refused (blocked) and spending an overrider let through, newest first, the last 50.
function exceptions(p) {
    const scope = access(p)
    const conditions = ec.entity.conditionFactory
    const found = Array.from(
        commitmentQuery(scope, p)
            .condition(
                conditions.makeCondition(
                    [
                        conditions.makeCondition("statusId", "equals", "BcBlocked"),
                        conditions.makeCondition("decisionEnumId", "equals", "BcdOverridden")
                    ],
                    "or"
                )
            )
            .orderBy("-createdDate")
            .limit(50)
            .list()
    )
    // a blocked attempt whose source later passed is resolved
    const passed = new Set(
        found.length
            ? Array.from(
                  find(COMMITMENT)
                      .condition("sourceId", "in", [...new Set(found.map(row => row.sourceId))])
                      .condition("statusId", "not-equals", "BcBlocked")
                      .list()
              ).map(row => row.sourceEntityName + ":" + row.sourceId)
            : []
    )
    const exceptionRows = commitmentShapes(found).map(row =>
        Object.assign(row, {
            resolvedText:
                row.statusId !== "BcBlocked"
                    ? "Overridden"
                    : passed.has(row.sourceEntityName + ":" + row.sourceId)
                      ? "Resolved"
                      : "Waiting"
        })
    )
    return {exceptionRows}
}

// The control policy rows of the organization, current by default (state all keeps ended ones), with their scope, action
// and threshold, and whether the user may change them (finance administration).
function policies(p) {
    const scope = access(p)
    const now = ec.user.nowTimestamp
    let query = find("mantle.other.budget.BudgetControlPolicy").condition("organizationPartyId", "in", organizations(scope))
    if (p.state !== "all") {
        const conditions = ec.entity.conditionFactory
        query = query.condition(
            conditions.makeCondition(
                [conditions.makeCondition("thruDate", "is-null", null), conditions.makeCondition("thruDate", "greater", now)],
                "or"
            )
        )
    }
    const found = Array.from(query.orderBy("-fromDate").limit(200).list())
    const budgetsById = byId(
        "mantle.other.budget.Budget",
        "budgetId",
        found.map(row => row.budgetId)
    )
    const texts = accountTexts(found.map(row => row.glAccountId))
    const enums = descriptions(
        "moqui.basic.Enumeration",
        "enumId",
        found.flatMap(row => [row.stageEnumId, row.actionEnumId])
    )
    const actionColors = {BcaIgnore: "grey", BcaWarn: "warning", BcaStop: "negative"}
    const policyRows = found.map(row => {
        const scheduled = policy.ms(row.fromDate) > policy.ms(now)
        const ended = row.thruDate != null && policy.ms(row.thruDate) <= policy.ms(now)
        return Object.assign(lib.plain(row), {
            budgetText: row.budgetId ? budgetsById[row.budgetId]?.description || row.budgetId : "Every budget",
            accountText: row.glAccountId ? texts[row.glAccountId] || row.glAccountId : "Every account",
            stageText: row.stageEnumId ? enums[row.stageEnumId] || row.stageEnumId : "Every stage",
            actionText: enums[row.actionEnumId] || row.actionEnumId,
            actionColor: actionColors[row.actionEnumId] || "grey",
            thresholdText: row.thresholdPercent == null ? "100%" : ec.l10n.format(row.thresholdPercent, "#,##0.##") + "%",
            stateText: scheduled ? "Scheduled" : ended ? "Ended" : "Current",
            canChange: !!scope.capabilities.admin && !ended
        })
    })
    return {policyRows, canEdit: !!scope.capabilities.admin}
}

const operations = {budgets, budgetDetail, commitments, exceptions, policies}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown budget screen operation " + op)
        return operations[op](parameters)
    }
})
