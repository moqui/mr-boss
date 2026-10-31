// Shared Accounting spec identities, authorized-user scope and render checks. Tests run inside Moqui, without Node.
const ids = {
    organizationPartyId: "BOSS_ACCT_ORG",
    foreignOrganizationPartyId: "ORG_ZIZI_SERVICES",
    customerPartyId: "ORG_ACME",
    invoiceId: "BOSS_ACCT_INVOICE",
    finalizedInvoiceId: "BOSS_ACCT_AR_FINALIZED",
    settlementPartyId: "BOSS_ACCT_STL_CUSTOMER",
    settlementInvoiceId: "BOSS_ACCT_STL_INV100",
    settlementPaymentId: "BOSS_ACCT_STL_RECEIPT60",
    settlementCreditId: "BOSS_ACCT_STL_CREDIT25",
    paymentPartyId: "BOSS_ACCT_PAY_CUSTOMER",
    paymentDraftId: "BOSS_ACCT_PAY_DRAFT",
    paymentDeliveredId: "BOSS_ACCT_PAY_DELIVERED",
    bankPaymentMethodId: "BOSS_ACCT_BANK",
    closePeriodId: "BOSS_ACCT_CLOSE_PERIOD",
    closeInvoiceId: "BOSS_ACCT_CLOSE_INVOICE",
    closeBankPaymentMethodId: "BOSS_ACCT_CLOSE_BANK"
}

function selectOrganization(organizationPartyId) {
    ec.user.setPreference("ACTIVE_ORGANIZATION", organizationPartyId || null)
    ec.service.sync().name("mantle.party.PartyServices.setup#UserOrganizationInfo").disableAuthz().throwOnError(true).call()
}

function asUser(username, action, enabled = true, organizationPartyId = ids.organizationPartyId) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    const previousOrganizationPartyId = ec.user.getPreference("ACTIVE_ORGANIZATION")
    try {
        ec.artifactExecution.disableAuthz()
        selectOrganization(organizationPartyId)
        if (enabled) ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        ec.artifactExecution.disableAuthz()
        try {
            selectOrganization(previousOrganizationPartyId)
        } finally {
            if (!disabled) ec.artifactExecution.enableAuthz()
            login(previousUsername)
        }
    }
}

function call(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).throwOnError(true).call() || {}
}

function refusal(service, parameters) {
    ec.message.pushErrors()
    try {
        ec.service
            .sync()
            .name(service)
            .parameters(parameters)
            .disableAuthz()
            .requireNewTransaction(true)
            .throwOnError(true)
            .call()
        return ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Accounting.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(
        path,
        Object.assign(
            {
                organizationPartyId: ids.organizationPartyId,
                lastStandalone:
                    /^(?:Receivables\/(?:InvoiceDetail|Customer360)|Payments\/PaymentDetail|Payables\/(?:BillDetail|Supplier360))\//.test(
                        path
                    )
                        ? "true"
                        : "-2"
            },
            parameters
        ),
        null
    )
    const output = String(result.output || "")
    return {
        status: result.status,
        output,
        errors: Array.from(result.errorMessages || []).concat(
            output.match(/(?:Error rendering|Exception in render)[^\n<]*/g) || []
        )
    }
}

const invoiceTabs = [
    ["Overview", "Overview"],
    ["Items", "Items and taxes"],
    ["Payments", "Payments and credits"],
    ["Orders", "Orders"],
    ["Shipments", "Shipments"],
    ["Budget", "Budget details"],
    ["GeneralLedger", "General ledger"],
    ["Files", "Files"],
    ["Conversation", "Conversation"],
    ["History", "History"]
]
const customerTabs = [
    ["Contact", "Contact"],
    ["Orders", "Orders"],
    ["Money", "Invoices and payments"],
    ["Agreements", "Agreements"],
    ["FinanceDetails", "Finance details"],
    ["Files", "Files"]
]
const billTabs = [
    ["Overview", "Supplier reference"],
    ["Items", "Items and taxes"],
    ["Holds", "Holds"],
    ["Payments", "Payments and credits"],
    ["Orders", "Orders"],
    ["Shipments", "Shipments"],
    ["Budget", "Budget details"],
    ["GeneralLedger", "General ledger"],
    ["Files", "Files"],
    ["History", "History"]
]
const supplierTabs = [
    ["Bills", "Bills"],
    ["Terms", "Supplier terms"],
    ["FinanceDetails", "Payment details"]
]
const paymentTabs = [
    ["Overview", "Payment overview"],
    ["Applications", "Applications and open items"],
    ["Gateway", "Gateway answers"],
    ["Refunds", "Linked refunds"],
    ["GeneralLedger", "Payment ledger"],
    ["Files", "Payment files and issued documents"],
    ["History", "Payment history"]
]

// The customer's statements, so the statement routes render real content rather than an empty selection.
function statementPreview() {
    return ec.service
        .sync()
        .name("mantle.account.CollectionServices.get#Statements")
        .parameters({
            organizationPartyId: ids.organizationPartyId,
            customerPartyIdList: [ids.customerPartyId],
            asOfDate: ec.user.nowTimestamp,
            includeZeroBalance: true
        })
        .disableAuthz()
        .requireNewTransaction(true)
        .throwOnError(true)
        .call()
}

// The demo's delivered receipt of BOSS_ACCT_PO_RECEIVED, which waits for its bill (a sequenced id).
function receivedShipmentId() {
    const source = ec.entity
        .find("mantle.shipment.ShipmentItemSource")
        .condition("orderId", "BOSS_ACCT_PO_RECEIVED")
        .disableAuthz()
        .list()[0]
    if (!source) throw new Error("Accounting screen fixtures require the demo's delivered receipt")
    return source.shipmentId
}

// The demo's proposed payment run (Demo.js paymentRuns).
function demoRunId() {
    return ec.entity
        .find("mantle.account.payment.PaymentRun")
        .condition({organizationPartyId: ids.organizationPartyId, description: "Demo supplies run"})
        .disableAuthz()
        .one()?.paymentRunId
}
function routeFixtures() {
    const snapshot = statementPreview()
    if (!snapshot.statementRows?.some(row => row.invoiceRows?.some(invoice => invoice.invoiceId === ids.finalizedInvoiceId)))
        throw new Error("Accounting screen fixtures require the finalized customer invoice in the customer statement")
    const statementParameters = {customerPartyId: ids.customerPartyId, includeZeroBalance: "Y", showStatements: "Y"}
    const destinations = [
        ["Home", "Shortcuts"],
        ["Receivables/Invoices", "Invoices"],
        ["Payables/Bills", "Bills"],
        ["Payments/Payments", "Payments"],
        ["GeneralLedger/ChartOfAccounts", "Chart of accounts"],
        ["GeneralLedger/JournalEntries", "Journal entries"],
        ["GeneralLedger/TransactionEntries", "Transaction entries"],
        ["GeneralLedger/JournalBatches", "Journal batches"],
        ["GeneralLedger/JournalTemplates", "Journal templates"],
        ["PeriodClose/Periods", "Fiscal periods"],
        ["PeriodClose/PeriodLocks", "Posting locks"],
        ["PeriodClose/PeriodRuns", "Period runs"],
        ["PeriodClose/PeriodCloseDetail", "Last month", {timePeriodId: ids.closePeriodId}],
        ["Reports/TrialBalance", "Trial balance"],
        ["Reports/InvoiceReconciliation", "Aging open", {timePeriodId: ids.closePeriodId}],
        ["Reports/GeneralLedger", "General ledger"],
        ["Settings/Settings", "Accounting settings"],
        ["Settings/AccountingPreferences", "Accounting preferences"],
        ["Settings/PostingDefaults", "Posting defaults"],
        ["Settings/PaymentTerms", "Payment terms"],
        ["Settings/Currencies", "Currencies"],
        ["Settings/PaymentMethods", "Payment methods"],
        ["Settings/DocumentSettings", "Document settings"],
        ["Tax/TaxAuthorities", "Tax authorities"],
        ["Tax/TaxRates", "Tax rates"],
        ["Tax/TaxStatements", "Tax statements"],
        // without a statement: its not-available state
        ["Tax/TaxStatementDetail", "Tax statement not available", {taxStatementId: "_NA_"}],
        ["Budgets/Budgets", "Operating budget"],
        ["Budgets/BudgetDetail", "Added trade show travel", {budgetId: "BOSS_ACCT_BUDGET"}],
        ["Budgets/BudgetControls", "Policies"],
        ["Reports/BudgetVariance", "Committed", {budgetId: "BOSS_ACCT_BUDGET"}],
        ["Receivables/InvoiceDetail", "Accounting demo customer invoice", {recordId: ids.invoiceId}],
        ["Payables/BillDetail", "Accounting demo supplier bill", {recordId: "BOSS_ACCT_BILL"}],
        ["Payables/ExpensePosting", "Expense posting"],
        ["Payables/BillDetail/Match", "Bill lines", {recordId: "BOSS_ACCT_BILL_MATCH", lastStandalone: "true"}],
        ["Payables/LegacyMatches", "Lines to link", {showPreview: "Y"}],
        ["Settings/MatchPolicies", "Accepted receipts (three-way)"],
        ["Payables/Supplier360", "Accounting Demo Supplier", {supplierPartyId: "BOSS_ACCT_SUPPLIER"}],
        ...billTabs.map(([tab, text]) => [
            "Payables/BillDetail/" + tab,
            text,
            {recordId: "BOSS_ACCT_BILL_HELD", lastStandalone: "true"}
        ]),
        ...supplierTabs.map(([tab, text]) => [
            "Payables/Supplier360/" + tab,
            text,
            {supplierPartyId: "BOSS_ACCT_SUPPLIER", lastStandalone: "true"}
        ]),
        ["Records/OrderDetail", "Purchase order", {orderId: "BOSS_ACCT_PO"}],
        ["Records/ShipmentDetail", "From Accounting Demo Supplier", {shipmentId: receivedShipmentId()}],
        ["Records/ReturnDetail", "Customer return BOSS_ACCT_RETURN", {returnId: "BOSS_ACCT_RETURN"}],
        ["Approvals", "Approvals"],
        ["Payments/PaymentDetail", "Payment customer", {recordId: ids.paymentDraftId}],
        ["Payments/GatewayTransactions", "Gateway transactions", {paymentId: ids.paymentDeliveredId}],
        ["Payments/PaymentPrint", "Payment document", {paymentId: ids.paymentDeliveredId, outputType: "receipt"}],
        ["QuickCreate/NewPayment", "Create payment"],
        ["Banking/BankAccounts", "Operating account"],
        ["Banking/BankAccountDetail", "Operating account", {paymentMethodId: ids.bankPaymentMethodId}],
        ["Banking/StatementImport", "Import a bank statement"],
        ["Banking/Reconciliations", "Bank statements"],
        ["Banking/ReconciliationDetail", "This bank statement is not available", {bankReconciliationId: "_NA_"}],
        ["Banking/UnmatchedTransactions", "Open bank lines"],
        ["Banking/BankRules", "Bank rules"],
        ["Banking/FinancialAccounts", "Stored-value accounts"],
        ["Banking/FinancialAccountDetail", "This stored-value account is not available", {finAccountId: "_NA_"}],
        // the review screens without a review: their not-available state
        ["Payments/PaymentDetail/Review", "Review not available", {recordId: ids.paymentDraftId, lastStandalone: "true"}],
        ["Payments/TransferReview", "Transfer review not available"],
        ["Receivables/SettlementReview", "Settlement review not available"],
        ["Payables/SettlementReview", "Settlement review not available"],
        ["Payables/PayablesWorkbench", "Apply supplier credits and payments", {partyId: "BOSS_ACCT_SUPPLIER"}],
        ["Payables/PaymentRuns", "Demo supplies run"],
        ["Payables/PaymentRunDetail", "SUPP-1006", {paymentRunId: demoRunId()}],
        ...paymentTabs.map(([tab, text]) => [
            "Payments/PaymentDetail/" + tab,
            text,
            {
                recordId:
                    tab === "Applications"
                        ? "BOSS_ACCT_PAY_APPLIED"
                        : tab === "GeneralLedger"
                          ? ids.paymentDeliveredId
                          : tab === "Files"
                            ? "BOSS_ACCT_PAY_CHECK"
                            : ids.paymentDraftId,
                lastStandalone: "true"
            }
        ]),
        ["GeneralLedger/JournalEntryDetail", "Office expense review", {recordId: "BOSS_ACCT_ENTRY"}],
        ["GeneralLedger/AccountDetail", "Open account ledger", {recordId: "111100000"}],
        ["Receivables/BillingQueue", "Billing queue"],
        ["Receivables/ReceivablesWorkbench", "Allocate receipts and credits", {partyId: ids.settlementPartyId}],
        ["Receivables/InvoiceBatch", ids.invoiceId, {invoiceIdList: [ids.invoiceId, ids.finalizedInvoiceId]}],
        ["Receivables/Statements", "Print statements", statementParameters],
        ["Receivables/StatementPrint", "Customer statement", statementParameters],
        ["Receivables/InvoicePrint", "Open the printable invoice", {invoiceId: ids.finalizedInvoiceId}],
        ["Receivables/Customer360", "Another Company Making Everything", {customerPartyId: ids.customerPartyId}],
        ...invoiceTabs.map(([tab, text]) => [
            "Receivables/InvoiceDetail/" + tab,
            text,
            {recordId: tab === "GeneralLedger" ? ids.finalizedInvoiceId : ids.invoiceId, lastStandalone: "true"}
        ]),
        ...customerTabs.map(([tab, text]) => [
            "Receivables/Customer360/" + tab,
            text,
            {customerPartyId: ids.customerPartyId, lastStandalone: "true"}
        ])
    ]
    return Object.fromEntries(
        destinations.map(([path, text, parameters = {}]) => [
            path,
            {
                path,
                text,
                parameters: Object.assign({organizationPartyId: ids.organizationPartyId}, parameters)
            }
        ])
    )
}

;({
    ids,
    asUser,
    demoRunId,
    selectOrganization,
    call,
    refusal,
    page,
    invoiceTabs,
    customerTabs,
    paymentTabs,
    billTabs,
    supplierTabs,
    statementPreview,
    receivedShipmentId,
    routeFixtures
})
