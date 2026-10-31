// The Budgets screens (design-accounting §12) over the demo's operating budget: the list, the detail as of either revision
// with its stored PDFs, the controls with the demo's Stop and the purchase order commitment, the variance report's
// committed column, a bill's override action for the overriders only, and the budget choices. The rules are mr-mantle's
// AccountingBudgets spec.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const as = (user, run) => helper().asUser(user, run)
const budget = {organizationPartyId: "BOSS_ACCT_ORG", budgetId: "BOSS_ACCT_BUDGET"}
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("a reader finds the demo budget and reads it as revised and as approved", {
    when() {
        return as("finance.read", () => {
            const list = helper().call("ironstone.accounting.BudgetServices.find#Budgets", {organizationPartyId: "BOSS_ACCT_ORG"})
            const latest = helper().call("ironstone.accounting.BudgetServices.get#BudgetDetail", budget)
            const approved = helper().call("ironstone.accounting.BudgetServices.get#BudgetDetail", {
                ...budget,
                revisionSeqId: "000"
            })
            const missing = helper().call("ironstone.accounting.BudgetServices.get#BudgetDetail", {...budget, budgetId: "_NA_"})
            return {
                row: list.records.find(row => row.budgetId === "BOSS_ACCT_BUDGET"),
                latest,
                approved,
                missing,
                page: helper().page("Budgets/BudgetDetail", {budgetId: "BOSS_ACCT_BUDGET", revisionSeqId: "000"})
            }
        })
    },
    then({row, latest, approved, missing, page}) {
        row.statusText == "Approved"
        row.revisionText == "Revision 1"
        // the list's total is the latest revision's, as the detail's
        toDecimal(row.totalAmount).compare(latest.budget.totalAmount) == 0
        latest.recordFound == true
        latest.budget.isLatest == true
        latest.budget.canRevise == false
        latest.revisionRows.length == 2
        latest.revisionRows.every(revision => revision.budgetContentId)
        latest.accountRows.some(account => toDecimal(account.amountMain).compare(3200) == 0)
        approved.budget.isLatest == false
        approved.accountRows.some(account => toDecimal(account.amountMain).compare(3000) == 0)
        missing.recordFound == false
        page.errors == []
        page.output.includes("These are the amounts as approved")
    }
})

feature("a GL user revises and an approver approves; the reader does neither", {
    when() {
        const header = user =>
            as(user, () => helper().call("ironstone.accounting.BudgetServices.get#BudgetDetail", budget).budget)
        return {gl: header("finance.gl"), approver: header("finance.approve"), reader: header("finance.read")}
    },
    then({gl, approver, reader}) {
        gl.canRevise == true
        gl.canApprove == false
        approver.canRevise == false
        reader.canRevise == false
        reader.canClose == false
    }
})

feature("the controls show the Stop, the order commitment, and the variance report its committed amount", {
    when() {
        return as("finance.read", () => ({
            policies: helper().call("ironstone.accounting.BudgetServices.find#Policies", {organizationPartyId: "BOSS_ACCT_ORG"}),
            commitments: helper().call("ironstone.accounting.BudgetServices.find#Commitments", {
                organizationPartyId: "BOSS_ACCT_ORG",
                budgetId: "BOSS_ACCT_BUDGET"
            }),
            report: helper().call("mantle.other.BudgetReportServices.run#BudgetVariance", budget),
            asApproved: helper().call("mantle.other.BudgetReportServices.run#BudgetVariance", {...budget, revisionSeqId: "000"}),
            page: helper().page("Reports/BudgetVariance", {budgetId: "BOSS_ACCT_BUDGET"}, "html")
        }))
    },
    then({policies, commitments, report, asApproved, page}) {
        policies.canEdit == false
        policies.policyRows.some(row => row.actionText == "Stop" && row.stageText == "Expense")
        commitments.records.some(row => row.sourceId == "BOSS_ACCT_PO_BUDGET" && row.statusId == "BcReserved")
        report.varianceRows.some(row => toDecimal(row.committedAmount).compare(600) >= 0)
        report.varianceRows.some(row => toDecimal(row.approvedAmount).compare(3200) == 0)
        asApproved.varianceRows.some(row => toDecimal(row.approvedAmount).compare(3000) == 0)
        page.errors == []
        page.output.includes("Committed")
        page.output.includes("Operating budget")
    }
})

feature("an over-budget bill offers Approve over budget to an overrider only, and the budget choices list the demo's", {
    when() {
        const bill = user => as(user, () => helper().page("Payables/BillDetail", {recordId: "BOSS_ACCT_BILL_OVER"}))
        const choice = (choice, extra = {}) =>
            helper().call("ironstone.accounting.AccessServices.get#Choices", {
                organizationPartyId: "BOSS_ACCT_ORG",
                choice,
                ...extra
            }).options
        return {
            approver: bill("finance.approve"),
            ap: bill("finance.ap"),
            ...as("finance.read", () => ({
                budgets: choice("budgets", {term: "Operating"}),
                periods: choice("budgetPeriodsOf", {budgetId: "BOSS_ACCT_BUDGET"}),
                revisions: choice("budgetRevisions", {budgetId: "BOSS_ACCT_BUDGET", term: "_none_", selected: "000"}),
                foreign: choice("budgetRevisions", {budgetId: "_NA_"})
            }))
        }
    },
    then({approver, ap, budgets, periods, revisions, foreign}) {
        approver.errors == []
        approver.output.includes("Approve over budget")
        !ap.output.includes("Approve over budget")
        budgets.some(option => option.value == "BOSS_ACCT_BUDGET")
        periods.length > 1
        revisions.some(option => option.value == "000" && option.label.startsWith("Approved"))
        foreign == []
    }
})
