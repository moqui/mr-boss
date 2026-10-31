// Banking screens over the demo's operating account (BOSS_ACCT_BANK): what each page shows for treasury, from the
// statement review to a finished statement, the open lines with the rules' suggestions, a rule's test and a
// stored-value account. The rules themselves are tested in mr-mantle's AccountingBankReconciliation.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const rec = "mantle.account.ReconciliationServices."
const bank = "BOSS_ACCT_BANK"
function asTreasury(run) {
    return helper().asUser("finance.treasury", run, false)
}
function call(service, parameters) {
    return helper().call(service, parameters)
}

feature("a reviewed statement shows its new, duplicate and rejected rows and the import of the new ones", {
    when() {
        return asTreasury(() => {
            const text = ["Date,Description,Amount", "2025-01-10,Screen review deposit,40.00", "not a day,Broken,1.00"].join("\n")
            const first = call(rec + "review#StatementImport", {
                paymentMethodId: bank,
                formatEnumId: "SifCsv",
                statementText: text
            })
            const review = helper().page("Banking/StatementImport", {statementImportId: first.statementImportId})
            call(rec + "commit#StatementImport", {statementImportId: first.statementImportId})
            const again = call(rec + "review#StatementImport", {
                paymentMethodId: bank,
                formatEnumId: "SifCsv",
                statementText: text
            })
            return {
                review,
                imported: helper().page("Banking/StatementImport", {statementImportId: first.statementImportId}),
                again: helper().page("Banking/StatementImport", {statementImportId: again.statementImportId}),
                start: helper().page("Banking/StatementImport", {paymentMethodId: bank})
            }
        })
    },
    then({review, imported, again, start}) {
        review.errors.length == 0
        review.output.includes("Review the statement") && review.output.includes("Import 1 new lines")
        review.output.includes("Screen review deposit") && review.output.includes("is not a date")
        imported.output.includes("1 lines were imported") && imported.output.includes("Open the bank account")
        again.output.includes("Duplicate") && !again.output.includes("Import 1 new lines")
        start.output.includes("Statement file") && start.output.includes("Or paste the statement")
    }
})
feature("a statement session shows its figures and lines, and finishes at zero difference", {
    when() {
        return asTreasury(() => {
            const day = n => new Date(2025, 1, n, 12).getTime()
            for (const [fitId, amount, n] of [
                ["SCREEN-FEB-1", "30", 3],
                ["SCREEN-FEB-2", "-5", 4]
            ])
                call(rec + "create#PaymentMethodTrans", {paymentMethodId: bank, fitId, transAmount: amount, postedDate: day(n)})
            const session = call(rec + "create#Reconciliation", {
                paymentMethodId: bank,
                statementReference: "February screen statement",
                statementFromDate: "2025-02-01",
                statementThruDate: "2025-02-28",
                openingBalance: 100,
                closingBalance: 125
            })
            const parameters = {bankReconciliationId: session.bankReconciliationId}
            const open = helper().page("Banking/ReconciliationDetail", parameters)
            for (const fitId of ["SCREEN-FEB-1", "SCREEN-FEB-2"])
                call(rec + "noReconcile#PaymentMethodTrans", {paymentMethodId: bank, fitId, noReconcileReason: "Screen spec"})
            call(rec + "store#Reconciliation", {
                bankReconciliationId: session.bankReconciliationId,
                clearFitIdList: ["SCREEN-FEB-1", "SCREEN-FEB-2"]
            })
            const cleared = helper().page("Banking/ReconciliationDetail", parameters)
            call(rec + "finish#Reconciliation", parameters)
            const list = call("ironstone.accounting.BankServices.find#Reconciliations", {
                organizationPartyId: helper().ids.organizationPartyId,
                paymentMethodId: bank
            })
            return {
                open,
                cleared,
                finished: helper().page("Banking/ReconciliationDetail", parameters),
                row: list.records.find(row => row.bankReconciliationId === session.bankReconciliationId),
                listPage: helper().page("Banking/Reconciliations", {paymentMethodId: bank})
            }
        })
    },
    then({open, cleared, finished, row, listPage}) {
        open.errors.length == 0
        open.output.includes("February screen statement") && open.output.includes("Finish statement")
        open.output.includes("Match") && open.output.includes("Not reconciled") && open.output.includes("Clear selected")
        cleared.output.includes("Unclear")
        finished.output.includes("Finished") && !finished.output.includes("Edit statement")
        row.statusText == "Finished" && toDecimal(row.difference).isZero() && toDecimal(row.clearedTotal).eq(25)
        listPage.output.includes("February screen statement")
    }
})
feature("open lines show the rules' suggestions, and a rule's test names what it would do", {
    when() {
        return asTreasury(() => {
            const organizationPartyId = helper().ids.organizationPartyId
            return {
                open: helper().page("Banking/UnmatchedTransactions"),
                detail: helper().page("Banking/BankAccountDetail", {paymentMethodId: bank, lineState: "open"}),
                test: helper().page("Banking/BankRules", {testRuleId: "BOSS_ACCT_RULE_CUSTOMER"}),
                accounts: helper().page("Banking/BankAccounts"),
                organizationPartyId
            }
        })
    },
    then({open, detail, test, accounts}) {
        open.errors.length == 0
        open.output.includes("PAYMENT CUSTOMER WIRE") && open.output.includes("Payment customer receipts")
        open.output.includes("Apply rules")
        detail.output.includes("MONTHLY SERVICE FEE") && detail.output.includes("Reconcile")
        test.output.includes("Test of Payment customer receipts") && test.output.includes("Nothing was changed")
        accounts.output.includes("Operating account") && accounts.output.includes("Add bank account")
    }
})
feature("a stored-value account is created and its deposit shows in its transactions", {
    when() {
        return asTreasury(() => {
            const finAccountId = call("mantle.account.FinancialAccountServices.create#FinancialAccount", {
                organizationPartyId: helper().ids.organizationPartyId,
                finAccountTypeId: "CustomerCredit",
                finAccountName: "Screen store credit",
                ownerPartyId: "BOSS_ACCT_PAY_CUSTOMER"
            }).finAccountId
            call("mantle.account.FinancialAccountServices.deposit#FinancialAccount", {finAccountId, amount: "25"})
            return {
                list: helper().page("Banking/FinancialAccounts"),
                detail: helper().page("Banking/FinancialAccountDetail", {finAccountId})
            }
        })
    },
    then({list, detail}) {
        list.errors.length == 0 && list.output.includes("Screen store credit") && list.output.includes("New account")
        detail.errors.length == 0 && detail.output.includes("Screen store credit") && detail.output.includes("Deposit")
        detail.output.includes("Balance after")
    }
})
