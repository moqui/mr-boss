// Settlement screen state is a draft only, kept by Mantle behind a draft ID. Mantle owns eligibility, previews, money,
// posting, confirmation and the operation key.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const {policy, array, plain, rows, day} = lib
const native = "mantle.account.PaymentServices."
const kinds = lib.settlementKinds
const maxDraftBytes = 262144
const adjustmentLabels = {ItemWriteOff: "Write-off", ItemPromptDiscount: "Discount"}

const itemToken = lib.settlementToken
// The two sides a workbench settles: a customer's receivables (Receivables/ReceivablesWorkbench) and a supplier's payables
// (Payables/PayablesWorkbench), each with its permissions, the names of its documents and its screens.
const sides = {
    receivable: {
        name: "Receivable",
        read: ["arRead", "paymentRead", "reportRead", "admin", "systemAdmin"],
        edit: "arEdit",
        party: "Customer",
        kinds: {invoice: "Invoice", credit: "Credit", payment: "Receipt", paymentTarget: "Payment"},
        invoiceDetail: "Receivables/InvoiceDetail",
        workbench: "Receivables/ReceivablesWorkbench",
        title: "Allocate receipts and credits",
        hint: "Choose a customer and currency. Balances are current; the dates limit the documents listed.",
        sources: "Available receipts and credits",
        sourceLabel: "Receipt or credit",
        targetLabel: "Invoice or payment",
        sourceRows: "Receipts",
        targetRows: "Invoices",
        targetPayments: "Payments",
        resetHint: "Changing the customer, currency or dates starts a new selection.",
        clearedHint: "The selection was cleared for the new customer, currency or dates."
    },
    payable: {
        name: "Payable",
        read: ["apRead", "paymentRead", "reportRead", "admin", "systemAdmin"],
        edit: "apEdit",
        party: "Supplier",
        kinds: {invoice: "Bill", credit: "Supplier credit", payment: "Payment", paymentTarget: "Supplier refund"},
        invoiceDetail: "Payables/BillDetail",
        workbench: "Payables/PayablesWorkbench",
        title: "Apply supplier credits and payments",
        hint: "Choose a supplier and currency. Balances are current; a bill's discount is open through its date.",
        sources: "Available payments and supplier credits",
        sourceLabel: "Payment or supplier credit",
        targetLabel: "Bill or supplier refund",
        sourceRows: "Payments",
        targetRows: "Bills",
        targetPayments: "Supplier refunds",
        resetHint: "Changing the supplier, currency or dates starts a new selection.",
        clearedHint: "The selection was cleared for the new supplier, currency or dates."
    }
}
const sideOf = direction => sides[direction] || sides.receivable
// The side a request names, receivables when it names none.
function directionOf(parameters) {
    const direction = parameters.direction || "receivable"
    if (!sides[direction]) throw new Error("Choose receivables or payables")
    return direction
}

function parseDraft(value) {
    if (value == null || value === "") return {allocations: [], adjustments: []}
    if (typeof value !== "string" || value.length > maxDraftBytes) throw new Error("The settlement selection is too large")
    const draft = JSON.parse(value)
    if (!draft || !Array.isArray(draft.allocations) || !Array.isArray(draft.adjustments))
        throw new Error("The settlement selection is not available; choose the open items again")
    if (draft.allocations.length > 200 || draft.adjustments.length > 50)
        throw new Error("Choose at most 200 allocations and 50 adjustments")
    return {
        scope: draft.scope,
        allocations: draft.allocations.map((row, index) => ({
            rowId: "allocation-" + index,
            sourceToken: String(row.sourceToken || ""),
            targetToken: String(row.targetToken || ""),
            amount: String(row.amount ?? "")
        })),
        adjustments: draft.adjustments.map((row, index) => ({
            rowId: "adjustment-" + index,
            targetToken: String(row.targetToken || ""),
            itemTypeEnumId: String(row.itemTypeEnumId || ""),
            amount: String(row.amount ?? ""),
            glAccountId: String(row.glAccountId || ""),
            reason: String(row.reason || "")
        }))
    }
}

function selection(draft) {
    const versions = new Map()
    const add = token => {
        const item = itemToken(token)
        if (versions.has(item.key) && versions.get(item.key) !== item.version)
            throw new Error("An item has different reviewed revisions. Choose it again in each allocation before previewing")
        versions.set(item.key, item.version)
        return item
    }
    const allocations = draft.allocations.map(row => {
        const source = add(row.sourceToken),
            target = add(row.targetToken)
        if (!["payment", "credit"].includes(source.kind) || !["invoice", "paymentTarget"].includes(target.kind))
            throw new Error("Choose a receipt or credit and an invoice or payment target")
        return {sourceKey: source.key, targetKey: target.key, amount: row.amount}
    })
    const adjustments = draft.adjustments.map(row => {
        const target = add(row.targetToken)
        if (target.kind !== "invoice") throw new Error("Choose an invoice for the adjustment")
        return {
            invoiceId: target.id,
            itemTypeEnumId: row.itemTypeEnumId,
            amount: row.amount,
            glAccountId: row.glAccountId,
            reason: row.reason
        }
    })
    if (versions.size > 200) throw new Error("Choose at most 200 distinct open items in one settlement")
    return {allocations, adjustments, sourceVersions: Object.fromEntries(versions)}
}

function scope(parameters, edit = false) {
    const direction = directionOf(parameters),
        side = sideOf(direction)
    const access = lib.access(parameters, side.read, side.name + " settlement read authority is required")
    const cap = access.capabilities
    if (edit && !cap[side.edit]) throw new Error(side.name + " editing authority is required")
    return {
        organizationPartyId: access.organizationPartyId,
        partyId: parameters.partyId || null,
        direction,
        currencyUomId:
            parameters.currencyUomId ||
            (access.organizationPartyId ? policy.preference(access.organizationPartyId).baseCurrencyUomId : null),
        asOfDate: day(parameters.asOfDate),
        effectiveDate: day(parameters.effectiveDate),
        capabilities: cap
    }
}

function draftScope(current) {
    return Object.fromEntries(
        ["organizationPartyId", "partyId", "direction", "currencyUomId", "asOfDate", "effectiveDate"].map(key => [
            key,
            current[key]
        ])
    )
}

function scopedDraft(value, current) {
    const draft = parseDraft(value)
    if (
        draft.scope &&
        Object.keys(draftScope(current)).some(key => String(draft.scope[key] || "") !== String(current[key] || ""))
    )
        throw new Error(
            "The selected items belong to another " +
                sideOf(current.direction).party.toLowerCase() +
                ", currency or date selection. Start a new selection"
        )
    draft.scope = draftScope(current)
    return draft
}

// The user's draft kept by Mantle, as JSON; none for a missing, expired or other user's draft.
function storedDraft(draftId) {
    return draftId ? policy.call(native + "get#SettlementDraft", {draftId}).draftJson || null : null
}
function editDraft(parameters) {
    const current = scope(parameters, true)
    const draft = scopedDraft(storedDraft(parameters.draftId), current)
    const action = parameters.draftAction
    const adjustment = /Adjustment$/.test(action || "")
    const list = adjustment ? draft.adjustments : draft.allocations
    const index = list.findIndex(row => row.rowId === parameters.rowId)
    if (/^remove/.test(action || "")) {
        if (index < 0) throw new Error("The selected allocation is not available")
        list.splice(index, 1)
    } else {
        const target = itemToken(parameters.targetToken)
        const row = adjustment
            ? {
                  targetToken: parameters.targetToken,
                  itemTypeEnumId: String(parameters.itemTypeEnumId || ""),
                  amount: String(parameters.amount ?? ""),
                  glAccountId: parameters.glAccountId || "",
                  reason: String(parameters.reason || "")
              }
            : {sourceToken: parameters.sourceToken, targetToken: parameters.targetToken, amount: String(parameters.amount ?? "")}
        if (adjustment && target.kind !== "invoice") throw new Error("Choose an invoice for the adjustment")
        if (
            !adjustment &&
            (!["payment", "credit"].includes(itemToken(parameters.sourceToken).kind) ||
                !["invoice", "paymentTarget"].includes(target.kind))
        )
            throw new Error("Choose a receipt or credit and an invoice or payment target")
        if (/^update/.test(action || "")) {
            if (index < 0) throw new Error("The selected allocation is not available")
            list[index] = row
        } else if (/^add/.test(action || "")) list.push(row)
        else throw new Error("Choose a settlement action")
    }
    if (draft.allocations.length > 200 || draft.adjustments.length > 50)
        throw new Error("Choose at most 200 allocations and 50 adjustments")
    const draftJson = JSON.stringify(draft)
    if (draftJson.length > maxDraftBytes) throw new Error("The settlement selection is too large")
    const stored = policy.call(native + "store#SettlementDraft", {
        draftId: parameters.draftId || null,
        organizationPartyId: current.organizationPartyId,
        direction: current.direction,
        draftJson
    })
    return {draftId: stored.draftId}
}

function previewRequest(parameters) {
    const current = scope(parameters, true)
    const draft = scopedDraft(storedDraft(parameters.draftId), current)
    return Object.assign(draftScope(current), selection(draft))
}

function retainedDraft(preview) {
    const versions = preview.sourceVersions || {}
    return {
        scope: draftScope({
            organizationPartyId: preview.organizationPartyId,
            partyId: preview.partyId,
            direction: preview.direction || "receivable",
            currencyUomId: preview.currencyUomId,
            asOfDate: preview.selectionThroughDateText || day(preview.selectionThroughDate || preview.asOfDate),
            effectiveDate: preview.accountingDateText || day(preview.effectiveDate)
        }),
        allocations: array(preview.allocationRows).map(row => ({
            sourceToken: row.sourceKey + "~" + versions[row.sourceKey],
            targetToken: row.targetKey + "~" + versions[row.targetKey],
            amount: String(row.amount)
        })),
        adjustments: array(preview.adjustmentRows).map(row => {
            const key = "invoice:" + encodeURIComponent(row.invoiceId)
            return {
                targetToken: key + "~" + versions[key],
                itemTypeEnumId: row.itemTypeEnumId,
                amount: String(row.amount),
                glAccountId: row.glAccountId,
                reason: row.reason
            }
        })
    }
}

// A settlement review for the side's SettlementReview, every part present; its ledger and posting rows are those of the
// review screens' shared sections.
function reviewPresentation(retained, organizationPartyId = retained.organizationPartyId, direction = "receivable") {
    const currencyUomId = retained.currencyUomId,
        side = sideOf(direction)
    const after = new Map(rows(retained.afterBalances).map(row => [row.sourceKey, row]))
    const labelFor = key => {
        const item = itemToken(key + "~retained")
        return (side.kinds[item.kind] || "Document") + " " + item.id
    }
    const results = {
        allocationResults: rows(retained.results?.allocationResults).map(row =>
            Object.assign(row, {currencyUomId, sourceLabel: labelFor(row.sourceKey), targetLabel: labelFor(row.targetKey)})
        ),
        adjustmentResults: rows(retained.results?.adjustmentResults).map(row => Object.assign(row, {currencyUomId})),
        remainingRows: rows(retained.results?.remainingRows).map(row =>
            Object.assign(row, {currencyUomId: row.currencyUomId || currencyUomId})
        ),
        settlementId: retained.results?.settlementId || null
    }
    const hasResults = !!results.settlementId
    const canReadLedger = retained.capabilities?.canReadLedger === true
    const shown = plain(retained)
    return Object.assign(shown, {
        selectionThroughDate: retained.selectionThroughDateText || day(retained.selectionThroughDate),
        allocationRows: rows(retained.allocationRows).map(row =>
            Object.assign(row, {
                sourceLabel: (side.kinds[row.sourceKind] || "Source") + " " + row.sourceId,
                targetLabel: (side.kinds[row.targetKind] || "Document") + " " + row.targetId
            })
        ),
        adjustmentRows: rows(retained.adjustmentRows).map(row =>
            Object.assign(row, {
                accountLabel: [row.accountCode, row.accountName].filter(Boolean).join(" · ") || row.glAccountId
            })
        ),
        balanceRows: rows(retained.beforeBalances).map(row => ({
            sourceKey: row.sourceKey,
            label: (side.kinds[row.sourceKind] || "Document") + " " + row.sourceId,
            currencyUomId,
            beforeRemaining: row.remaining,
            afterRemaining: after.get(row.sourceKey)?.remaining
        })),
        ledgerPreviewRows: lib.ledgerPreviewRows(retained.ledgerPreview, currencyUomId, retained.accountingDateText),
        hasResults,
        canReadLedger,
        canConfirm: retained.canApply === true && !hasResults,
        confirmation:
            "Apply this settlement for " +
            (retained.partyName || retained.partyId || "") +
            " on " +
            (retained.accountingDateText || "") +
            "?",
        factRows: lib.factRows([
            [side.party, retained.partyName || retained.partyId],
            ["Settlement date", retained.accountingDateText],
            ["Documents through", retained.selectionThroughDateText || shown.selectionThroughDateText],
            ["Expires", shown.expiresDateText]
        ]),
        confirmParameters: {
            organizationPartyId,
            previewId: retained.previewId,
            inputFingerprint: retained.inputFingerprint,
            operationKey: retained.operationKey
        },
        postingResultRows: lib.postingResultRows(
            [...results.allocationResults, ...results.adjustmentResults].flatMap(row => array(row.acctgTransIds)),
            canReadLedger
        ),
        outputResultRows: [],
        results
    })
}

// The workbench: the customer's open items, a page of each kind, and the user's draft of allocations and adjustments.
function workbench(parameters) {
    const current = scope(parameters)
    const stored = storedDraft(parameters.draftId)
    const incoming = parseDraft(stored)
    const changedScope =
        incoming.scope &&
        Object.keys(draftScope(current)).some(key => String(incoming.scope[key] || "") !== String(current[key] || ""))
    const selectionReset = !!changedScope && parameters.filterSubmit === "Y"
    const draft = scopedDraft(selectionReset ? null : stored, current)
    const pageByKind = Object.fromEntries(
        kinds.map(kind => [
            kind,
            {
                pageIndex: Number(parameters.pageIndex ?? parameters[kind + "RowsPageIndex"] ?? 0),
                pageSize: Number(parameters.pageSize ?? parameters[kind + "RowsPageSize"] ?? 10)
            }
        ])
    )
    const selectedKeys = Array.from(
        new Set([
            ...draft.allocations.flatMap(row => [itemToken(row.sourceToken).key, itemToken(row.targetToken).key]),
            ...draft.adjustments.map(row => itemToken(row.targetToken).key)
        ])
    )
    if (selectedKeys.length > 200) throw new Error("Choose at most 200 distinct open items in one settlement")
    const requested = !!(current.organizationPartyId && current.partyId && current.currencyUomId)
    const found = requested
        ? policy.call(
              native + "find#OpenItems",
              Object.assign(draftScope(current), {
                  dueBucket: parameters.dueBucket,
                  text: parameters.text,
                  pageByKind,
                  selectedKeyList: selectedKeys
              })
          )
        : {}
    const hasReadResult = found.capabilities?.canRead === true && typeof found.complete === "boolean"
    const rowMap = new Map()
    const output = {}
    const pageInfo = found.pageInfo || {}
    const route = row => {
        const parsed = itemToken(row.sourceKey + "~" + row.version)
        return Object.assign({}, row, {
            kindLabel: sideOf(current.direction).kinds[parsed.kind],
            label: row.description || row.sourceId || parsed.id,
            dateText: row.accountingDateText || row.dateText,
            holdText: array(row.reasons).includes("INVOICE_HELD") ? "On hold" : "",
            detailUrl:
                parsed.kind === "payment" || parsed.kind === "paymentTarget"
                    ? "Payments/PaymentDetail"
                    : sideOf(current.direction).invoiceDetail,
            routeParameters: lib.recordParameters(current.organizationPartyId, parsed.id)
        })
    }
    for (const kind of kinds) {
        const list = rows(found[kind + "Rows"]).map(route)
        for (const row of list) rowMap.set(row.sourceKey, row)
        output[kind + "Rows"] = list
        Object.assign(output, lib.paging(pageInfo[kind], kind + "Rows", null, pageByKind[kind].pageSize))
    }
    for (const row of rows(found.selectedRows)) rowMap.set(row.sourceKey, route(row))
    const tokenLabel = token => {
        const item = itemToken(token),
            row = rowMap.get(item.key)
        return {
            label: row ? row.kindLabel + " " + row.sourceId : item.id,
            changed: !!row && String(row.version) !== item.version,
            unavailable: !row,
            remaining: row?.remaining
        }
    }
    const allocations = draft.allocations.map((row, index) => {
        const source = tokenLabel(row.sourceToken),
            target = tokenLabel(row.targetToken)
        return Object.assign({}, row, {
            rowId: "allocation-" + index,
            draftAction: "updateAllocation",
            sourceLabel: source.label,
            targetLabel: target.label,
            reviewNote:
                source.unavailable || target.unavailable
                    ? "A selected item is no longer available"
                    : source.changed || target.changed
                      ? "An item changed; choose its current version before previewing"
                      : "",
            sourceRemaining: source.remaining,
            targetRemaining: target.remaining,
            currencyUomId: current.currencyUomId
        })
    })
    const accounts =
        draft.adjustments.length && current.capabilities[sideOf(current.direction).edit]
            ? policy.call(native + "find#SettlementAdjustmentAccounts", {
                  organizationPartyId: current.organizationPartyId,
                  direction: current.direction,
                  effectiveDate: current.effectiveDate,
                  selectedIdList: Array.from(new Set(draft.adjustments.map(row => row.glAccountId).filter(Boolean)))
              })
            : {}
    const accountLabels = Object.fromEntries(
        [...rows(accounts.accountRows || accounts.rows), ...rows(accounts.selectedRows)].map(row => [
            row.glAccountId,
            [row.accountCode || row.glAccountCode, row.accountName || row.glAccountName].filter(Boolean).join(" · ") ||
                row.glAccountId
        ])
    )
    const adjustments = draft.adjustments.map((row, index) =>
        Object.assign({}, row, {
            rowId: "adjustment-" + index,
            draftAction: "updateAdjustment",
            targetLabel: tokenLabel(row.targetToken).label,
            kindLabel: adjustmentLabels[row.itemTypeEnumId] || row.itemTypeEnumId,
            accountLabel: row.glAccountId ? accountLabels[row.glAccountId] || row.glAccountId : "Choose a posting account",
            currencyUomId: current.currencyUomId
        })
    )
    const draftId = selectionReset ? null : parameters.draftId || null
    const filters = Object.assign(draftScope(current), {text: parameters.text || "", dueBucket: parameters.dueBucket || ""})
    return Object.assign(output, filters, {
        draftId,
        draftAllocations: allocations,
        draftAdjustments: adjustments,
        workbenchLabels: labels(current.direction),
        workbench: {
            scope: filters,
            canEdit:
                !!current.capabilities[sideOf(current.direction).edit] && hasReadResult && found.capabilities?.canApply === true,
            ready: !!(current.organizationPartyId && current.partyId && current.currencyUomId),
            hasOpenItemResult: !requested || hasReadResult,
            unavailable: requested && !hasReadResult,
            complete: !requested || (hasReadResult && found.complete === true && !found.incomplete),
            errors: array(found.errors),
            selectionThroughDate: found.selectionThroughDateText || current.asOfDate,
            balanceAsOfDate: found.balanceAsOfDate || null,
            balanceBasis: found.balanceBasis || "current",
            hasDraft: !!(draft.allocations.length || draft.adjustments.length),
            selectionReset,
            filters,
            editParameters: Object.assign({}, filters, {draftId}),
            addAllocationParameters: Object.assign({}, filters, {draftId, draftAction: "addAllocation"}),
            addAdjustmentParameters: Object.assign({}, filters, {draftId, draftAction: "addAdjustment"}),
            scopeParameters: Object.assign({}, filters, {draftId: ""})
        }
    })
}

// The settlement review the side's SettlementReview shows, every part present: a review that does not exist, expired or
// is another user's has reviewFound false. The way back to the selection carries the review's party, currency and dates
// and the user's draft (draftId). Refuses a user without the side's read authority and a review of the other side.
function settlementReview(parameters) {
    const current = scope(parameters)
    const retained = parameters.previewId
        ? lib.optional(
              native + "get#SettlementPreview",
              {previewId: parameters.previewId, organizationPartyId: current.organizationPartyId},
              "Settlement review " + parameters.previewId
          )
        : null
    if (retained?.direction && retained.direction !== current.direction)
        throw new Error("This review belongs to the other workbench")
    const reviewFound = !!retained?.previewId
    const selection = reviewFound ? retainedDraft(retained).scope : draftScope(current)
    return {
        previewId: parameters.previewId || "",
        draftId: parameters.draftId || "",
        reviewFound,
        settlementReview: reviewPresentation(reviewFound ? retained : {}, current.organizationPartyId, current.direction),
        workbenchLabels: labels(current.direction),
        selectionParameters: Object.assign({}, selection, {draftId: parameters.draftId || ""}),
        newSelectionParameters: Object.assign({}, selection, {draftId: ""})
    }
}

// The texts and paths of a side's workbench and review screens (template/AccountingWorkbench.xml).
function labels(direction) {
    const side = sideOf(direction)
    return Object.assign({}, side, {direction, review: side.workbench.split("/")[0] + "/SettlementReview"})
}
// The workbench and review contexts, and the draft edit and preview request of the workbench's services.
const operations = {workbench, settlementReview, editDraft, previewRequest}
function execute(op, parameters) {
    if (!operations[op]) throw new Error("Unknown settlement screen operation " + op)
    return operations[op](parameters)
}
// The draft forms are also exported for the specs that check them.
;({execute, parseDraft, selection, retainedDraft})
