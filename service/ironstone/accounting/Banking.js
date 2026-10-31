// Banking's routes and drop-downs. Mantle's bank services (mantle.account.ReconciliationServices and the deposit services
// of PaymentServices) check the bank account's organization and the user's authority; these shape their answers.
const policy = ec.resource.script("component://mr-mantle/service/mantle/ledger/AccountingPolicy.js")

const linkPaths = [
    "Banking/BankAccounts",
    "Banking/BankAccountDetail",
    "Banking/StatementImport",
    "Banking/Reconciliations",
    "Banking/ReconciliationDetail",
    "Banking/UnmatchedTransactions",
    "Banking/BankRules",
    "Banking/FinancialAccounts",
    "Banking/FinancialAccountDetail"
]
const choiceLimit = 30

function selectedIds(value) {
    if (value == null || value === "") return []
    const list = Array.isArray(value)
        ? value
        : String(value).startsWith("[")
          ? JSON.parse(String(value))
          : String(value).split(",")
    return [...new Set(Array.from(list).filter(Boolean).map(String))].slice(0, 200)
}
function term(parameters) {
    return String(parameters.term || "").trim()
}

// The organization's bank and cash accounts, searched by name; a selected one outside the page is read on its own.
function bankAccounts(parameters) {
    const find = text =>
        policy.call("mantle.account.ReconciliationServices.find#BankAccounts", {
            organizationPartyId: parameters.organizationPartyId,
            text,
            pageSize: choiceLimit
        }).bankRows
    const rows = Array.from(find(term(parameters)))
    for (const id of selectedIds(parameters.selected))
        if (!rows.some(row => row.paymentMethodId === id))
            rows.push(...Array.from(find(id)).filter(row => row.paymentMethodId === id))
    return rows.map(row => ({value: row.paymentMethodId, label: row.label}))
}
// What a bank line could be reconciled with.
function bankLineCandidates(parameters) {
    return Array.from(
        policy.call("mantle.account.ReconciliationServices.find#BankLineCandidates", {
            paymentMethodId: parameters.paymentMethodId,
            fitId: parameters.fitId,
            term: term(parameters)
        }).candidateRows
    ).map(row => ({value: row.value, label: row.label + " · " + ec.l10n.format(toDecimal(row.amount), "#,##0.00")}))
}
// The receipts a deposit slip of the bank account may group, with those already chosen.
function depositReceipts(parameters) {
    return Array.from(
        policy.call("mantle.account.PaymentServices.find#DepositReceipts", {
            paymentMethodId: parameters.paymentMethodId,
            text: term(parameters),
            selectedIdList: selectedIds(parameters.selected),
            pageSize: choiceLimit
        }).receiptRows
    ).map(row => ({value: row.paymentId, label: row.label}))
}
const sources = {bankAccounts, bankLineCandidates, depositReceipts}

// Rows of stored-value accounts for a list or a header: the owner's and type's names, the status chip and the link.
const statusColors = {FaActive: "positive", FaNegPendRepl: "warning", FaManFrozen: "negative", FaCancelled: "grey"}
function financialRows(accounts, organizationPartyId) {
    const list = Array.from(accounts || []).filter(Boolean)
    const names = policy.lib.partyNames(list.map(row => row.ownerPartyId))
    const typeIds = [...new Set(list.map(row => row.finAccountTypeId).filter(Boolean))]
    const types = typeIds.length
        ? policy.rows("mantle.account.financial.FinancialAccountType", {}).filter(row => typeIds.includes(row.finAccountTypeId))
        : []
    const statuses = policy.rows("moqui.basic.StatusItem", {statusTypeId: "FinancialAccount"})
    return list.map(row =>
        Object.assign(policy.display(row), {
            finAccountCode: null,
            finAccountPin: null,
            ownerName: names[row.ownerPartyId] || "",
            typeText: types.find(type => type.finAccountTypeId === row.finAccountTypeId)?.description || row.finAccountTypeId,
            statusText: statuses.find(status => status.statusId === row.statusId)?.description || row.statusId || "",
            statusColor: statusColors[row.statusId] || "grey",
            detailParameters: {finAccountId: row.finAccountId, organizationPartyId}
        })
    )
}

;({
    linkPaths,
    choiceNames: Object.keys(sources),
    financialRows,
    choices: parameters => {
        if (!sources[parameters.choice]) throw new Error("Unknown banking choice " + parameters.choice)
        return {options: sources[parameters.choice](parameters)}
    }
})
