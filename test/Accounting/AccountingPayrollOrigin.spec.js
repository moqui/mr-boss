// Accounting's payroll-origin projection (design-accounting AC-23 and ExpensePosting's payroll paragraph, design-people §8.3; built by
// impl-people P27 as an owner contract): a payroll-origin invoice (one a pay run's finalization made: marked payrollOrigin), a
// payment applied to one (a payroll payment, or one made by hand) and their ledger lines are a reader of payroll's (PAYROLL_VIEW on
// top of the finance group). A finance user without it finds none of them, with the same parameters as one who reads payroll, and
// where a total must reconcile (the payables aging, the general ledger, the partner ledger) sees them as one masked "Payroll" amount.
// Payroll finance (BOSS_ACCOUNTING_PAYROLL, finance.payroll; the user's call of Nov 13, 2026) approves and pays a payroll invoice
// that finance.ap cannot see. The projection's rules are Mantle's (test/humanres/PayObligations); this checks the Accounting app's
// services over it. The payroll invoices and their obligations are made as data (only their mark and link matter here).
// Run: ./moq test mr-boss --spec AccountingPayrollOrigin
const lib = () => ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
const org = "BOSS_ACCT_ORG"
const prefix = "BOSS_ACCT_PPO"
const invoiceId = prefix + "_NETPAY"
const secondInvoiceId = prefix + "_NETPAY2"
const employee = prefix + "_EMPLOYEE"
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
let handPaymentId

function system(action) {
    const disabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!disabled) ec.artifactExecution.enableAuthz()
    }
}
// a pay run's net pay invoice from the employee, marked as the finalization marks it, with its obligation
function payrollInvoice(id, amount) {
    call("create#mantle.account.invoice.Invoice", {
        invoiceId: id,
        invoiceTypeEnumId: "InvoicePayroll",
        fromPartyId: employee,
        toPartyId: org,
        statusId: "InvoiceIncoming",
        invoiceDate: ec.user.nowTimestamp,
        accountingDate: today(),
        dueDate: ec.user.nowTimestamp,
        currencyUomId: "USD",
        description: "Pay of the month",
        payrollOrigin: "Y"
    })
    call("mantle.account.InvoiceServices.create#InvoiceItem", {
        invoiceId: id,
        itemTypeEnumId: "ItemPayrollIncome",
        overrideGlAccountId: "631100000",
        quantity: "1",
        amount,
        description: "Salary"
    })
    call("update#mantle.account.invoice.Invoice", {invoiceId: id, statusId: "InvoiceReceived"})
    call("create#mantle.humanres.payroll.PayrollObligation", {
        obligationKey: "NET:" + id,
        obligationKindEnumId: "PokNetPay",
        payrollRunId: prefix + "_RUN",
        organizationPartyId: org,
        partyId: employee,
        payeePartyId: employee,
        currencyUomId: "USD",
        invoiceId: id,
        amount
    })
}
const code = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message || "accepted"

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.party.Party", {partyId: employee, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: employee, firstName: "Payroll", lastName: "Origin"})
            call("create#mantle.humanres.payroll.PayrollRun", {
                payrollRunId: prefix + "_RUN",
                organizationPartyId: org,
                currencyUomId: "USD",
                runKindEnumId: "PrkRegular",
                statusId: "PrnFinalized"
            })
            payrollInvoice(invoiceId, "1000")
            // approved, so it is open in the payables aging
            call("update#mantle.account.invoice.Invoice", {invoiceId, statusId: "InvoiceApproved"})
            payrollInvoice(secondInvoiceId, "800")
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "a finance user without PAYROLL_VIEW finds no payroll invoice and sees its aggregate; payroll finance, with the same parameters, finds it",
    {
        when() {
            // the same calls for both users
            const read = username =>
                lib().asUser(username, () => ({
                    bills: lib().call("ironstone.accounting.PayableScreenServices.find#Bills", {
                        organizationPartyId: org,
                        queue: "all",
                        text: invoiceId
                    }),
                    palette: lib().call("ironstone.accounting.AccessServices.search#Records", {
                        organizationPartyId: org,
                        text: invoiceId,
                        limit: 20
                    }),
                    detail: lib().refusal("mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {
                        invoiceId,
                        organizationPartyId: org
                    }),
                    aging: lib().call("mantle.ledger.LedgerReportServices.run#Aging", {
                        organizationPartyId: org,
                        invoiceType: "payable",
                        currencyUomId: "USD"
                    })
                }))
            return {finance: read("finance.ap"), payroll: read("finance.payroll")}
        },
        then({finance, payroll}) {
            // without PAYROLL_VIEW: missing from the list, the palette and a read; one "Payroll" row in the aging, which reconciles
            !finance.bills.records.some(row => row.invoiceId == invoiceId)
            !finance.palette.rows.some(row => String(row.url).includes(invoiceId))
            finance.detail.includes("INVOICE_UNAVAILABLE")
            finance.aging.agingRows.some(row => row.partyId == "_PAYROLL_" && row.partyName == "Payroll")
            !finance.aging.agingRows.some(row => row.partyId == employee)
            String(finance.aging.totals[0].total) == String(payroll.aging.totals[0].total)
            // with it: the invoice and its person
            payroll.bills.records.some(row => row.invoiceId == invoiceId)
            payroll.palette.rows.some(row => String(row.url).includes(invoiceId))
            payroll.detail == ""
            payroll.aging.agingRows.some(row => row.partyId == employee)
            !payroll.aging.agingRows.some(row => row.partyId == "_PAYROLL_")
        }
    }
)

feature(
    "a payment made by hand and applied to a payroll invoice, and its ledger lines, are missing without PAYROLL_VIEW; the ledgers fold them into Payroll and reconcile",
    {
        when() {
            // a check of the invoice's type made by hand (not a payroll payment), applied to the payroll invoice
            const made = system(() =>
                lib().call("mantle.account.PaymentServices.create#InvoicePayment", {
                    invoiceId,
                    paymentTypeEnumId: "PtInvoicePayment",
                    paymentMethodId: "BOSS_ACCT_RUN_BANK",
                    paymentInstrumentEnumId: "PiCompanyCheck",
                    effectiveDate: ec.user.nowTimestamp
                })
            )
            handPaymentId = made.paymentId
            const marks = system(() => ({
                payment: ec.entity.find("mantle.account.payment.Payment").condition("paymentId", handPaymentId).one()
                    ?.payrollOrigin,
                transactions: Array.from(
                    ec.entity.find("mantle.ledger.transaction.AcctgTrans").condition("paymentId", handPaymentId).list()
                ).map(row => ({acctgTransId: row.acctgTransId, payrollOrigin: row.payrollOrigin}))
            }))
            const transactionIds = marks.transactions.map(row => row.acctgTransId)
            // the same instants for both users (each reads its own zone's days): a span around today
            const now = Number(ec.user.nowTimestamp)
            const span = {fromDate: new Date(now - 5 * 86400000), thruDate: new Date(now + 5 * 86400000)}
            // the reader with it is the administrator (ADMIN holds PAYROLL_VIEW); both read past the screens' artifact grants and
            // entity filters (a private contact's lines differ by user), so only the services' own checks and the projection differ
            const read = username =>
                lib().asUser(
                    username,
                    () => ({
                        payments: lib().call("mantle.account.PaymentServices.find#Payments", {
                            organizationPartyId: org,
                            text: handPaymentId
                        }).rows,
                        payment: code(
                            lib().refusal("mantle.account.PaymentServices.get#PaymentFinanceDetail", {
                                paymentId: handPaymentId,
                                organizationPartyId: org
                            })
                        ),
                        journals: transactionIds.filter(
                            id =>
                                lib().call("mantle.ledger.AccountingServices.find#Records", {
                                    kind: "journals",
                                    organizationPartyId: org,
                                    recordId: id
                                }).records.length > 0
                        ),
                        ledger: lib().call(
                            "mantle.ledger.FinanceReportServices.run#GeneralLedger",
                            Object.assign({organizationPartyId: org}, span)
                        ).reportRows,
                        partner: lib().call(
                            "mantle.ledger.LedgerReportServices.run#PartnerLedger",
                            Object.assign({organizationPartyId: org, invoiceType: "payable"}, span)
                        )
                    }),
                    false
                )
            const missing = lib().asUser("finance.read", () =>
                code(
                    lib().refusal("mantle.account.PaymentServices.get#PaymentFinanceDetail", {
                        paymentId: prefix + "_NO_PAYMENT",
                        organizationPartyId: org
                    })
                )
            )
            return {marks, transactionIds, finance: read("finance.read"), holder: read("john.doe"), missing}
        },
        then({marks, transactionIds, finance, holder, missing}) {
            // the application marked the payment and its transactions
            marks.payment == "Y"
            transactionIds.length > 0
            marks.transactions.every(row => row.payrollOrigin == "Y")
            // without PAYROLL_VIEW: the payment is missing from the list and as a record, as one that does not exist
            !finance.payments.some(row => row.paymentId == handPaymentId)
            finance.payment == missing
            finance.journals == []
            // the general ledger: none of its lines, one masked "Payroll" line of an account, and the same totals
            !finance.ledger.some(row => transactionIds.includes(row.acctgTransId))
            finance.ledger.some(row => row.payrollMasked && row.description == "Payroll" && !row.acctgTransId)
            const sum = (rows, field) => rows.reduce((total, row) => total.add(row[field] ?? 0), toDecimal(0)).toString()
            sum(finance.ledger, "debits") == sum(holder.ledger, "debits")
            sum(finance.ledger, "credits") == sum(holder.ledger, "credits")
            // the partner ledger: the employee's lines folded into one "Payroll" party, the closing balances reconciling
            !finance.partner.partyRows.some(row => row.partyId == employee)
            finance.partner.partyRows.some(row => row.partyName == "Payroll")
            !finance.partner.reportRows.some(row => transactionIds.includes(row.acctgTransId))
            sum(finance.partner.partyRows, "closing") == sum(holder.partner.partyRows, "closing")
            // with it: all of them
            holder.payments.some(row => row.paymentId == handPaymentId)
            holder.payment == "accepted"
            holder.journals.length == transactionIds.length
            holder.ledger.some(row => transactionIds.includes(row.acctgTransId))
            holder.partner.partyRows.some(row => row.partyId == employee)
        }
    }
)

feature("payroll finance approves and pays a payroll invoice that the AP clerk, without PAYROLL_VIEW, cannot see", {
    when() {
        const stamp = () =>
            system(() => ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", secondInvoiceId).one())
                .lastUpdatedStamp
        // the AP clerk: the same calls on the payroll invoice and on one that does not exist
        const clerk = id =>
            lib().asUser("finance.ap", () => ({
                listed: lib()
                    .call("ironstone.accounting.PayableScreenServices.find#Bills", {
                        organizationPartyId: org,
                        queue: "all",
                        text: id
                    })
                    .records.some(row => row.invoiceId == id),
                read: code(
                    lib().refusal("mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {
                        invoiceId: id,
                        organizationPartyId: org
                    })
                ),
                approve: code(
                    lib().refusal("mantle.account.InvoiceServices.approve#Payable", {
                        invoiceId: id,
                        organizationPartyId: org,
                        lastUpdatedStamp: ec.user.nowTimestamp
                    })
                )
            }))
        const apOnPayroll = clerk(secondInvoiceId)
        const apOnMissing = clerk(prefix + "_NO_INVOICE")
        // payroll finance approves it, starts a run with it alone and executes it once an approver approves the run
        const approved = lib().asUser("finance.payroll", () =>
            code(
                lib().refusal("mantle.account.InvoiceServices.approve#Payable", {
                    invoiceId: secondInvoiceId,
                    organizationPartyId: org,
                    lastUpdatedStamp: stamp()
                })
            )
        )
        const run = lib().asUser("finance.payroll", () => {
            const made = lib().call("mantle.account.PaymentRunServices.create#Run", {
                organizationPartyId: org,
                paymentMethodId: "BOSS_ACCT_RUN_BANK",
                paymentInstrumentEnumId: "PiCompanyCheck",
                dueThroughDate: today(),
                payDate: today(),
                description: "Payroll finance spec run"
            })
            const items = system(() =>
                Array.from(
                    ec.entity.find("mantle.account.payment.PaymentRunItem").condition("paymentRunId", made.paymentRunId).list()
                )
            )
            for (const item of items.filter(row => row.selectedIndicator == "Y" && row.invoiceId != secondInvoiceId))
                lib().call("mantle.account.PaymentRunServices.store#RunItem", {
                    organizationPartyId: org,
                    paymentRunId: made.paymentRunId,
                    paymentRunItemSeqId: item.paymentRunItemSeqId,
                    selectedIndicator: "N",
                    excludeComment: "Not this spec's"
                })
            return {paymentRunId: made.paymentRunId, selected: items.some(row => row.invoiceId == secondInvoiceId)}
        })
        lib().asUser("finance.approve", () =>
            lib().call("mantle.account.PaymentRunServices.approve#Run", {
                organizationPartyId: org,
                paymentRunId: run.paymentRunId,
                lastUpdatedStamp: system(() =>
                    ec.entity.find("mantle.account.payment.PaymentRun").condition("paymentRunId", run.paymentRunId).one()
                ).lastUpdatedStamp
            })
        )
        const executed = lib().asUser("finance.payroll", () =>
            lib().call("mantle.account.PaymentRunServices.execute#Run", {
                organizationPartyId: org,
                paymentRunId: run.paymentRunId,
                operationKey: "BOSS-PPO-" + run.paymentRunId
            })
        )
        const payment = system(() => {
            const application = ec.entity
                .find("mantle.account.payment.PaymentApplication")
                .condition("invoiceId", secondInvoiceId)
                .one()
            return application
                ? ec.entity.find("mantle.account.payment.Payment").condition("paymentId", application.paymentId).one()
                : null
        })
        const apPayments = lib().asUser(
            "finance.ap",
            () =>
                lib().call("mantle.account.PaymentServices.find#Payments", {
                    organizationPartyId: org,
                    text: payment?.paymentId || "-"
                }).rows
        )
        return {apOnPayroll, apOnMissing, approved, run, executed, payment, apPayments}
    },
    then({apOnPayroll, apOnMissing, approved, run, executed, payment, apPayments}) {
        // the AP clerk is answered as for an invoice that does not exist
        apOnPayroll.listed == false
        apOnPayroll == apOnMissing
        // payroll finance approves it and pays it in a run, as a payroll payment the AP clerk does not see
        approved == "accepted"
        run.selected
        executed.paidCount == 1
        executed.failedCount == 0
        payment.paymentTypeEnumId == "PtPayrollPayment"
        payment.payrollOrigin == "Y"
        String(payment.amount) == "800"
        !apPayments.some(row => row.paymentId == payment.paymentId)
    }
})
