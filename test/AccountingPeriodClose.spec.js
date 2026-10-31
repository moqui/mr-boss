// Period close screens over the demo's last month (BOSS_ACCT_CLOSE_PERIOD): the checklist names its draft invoice and
// its unfinished bank statement (AccountingCloseWalk follows their links); the period runs list starts a run and shows
// its results; the invoice reconciliation report runs for the period. The close, reopen and runs themselves are tested
// in mr-mantle's AccountingPeriodClose and AccountingProjectCost.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const period = {timePeriodId: "BOSS_ACCT_CLOSE_PERIOD"}

feature("the close checklist names the draft invoice and the unfinished statement and offers no close", {
    when() {
        return {
            approver: helper().asUser("finance.approve", () => helper().page("PeriodClose/PeriodCloseDetail", period), false),
            reader: helper().asUser("finance.read", () => helper().page("PeriodClose/PeriodCloseDetail", period), false),
            missing: helper().asUser(
                "finance.approve",
                () => helper().page("PeriodClose/PeriodCloseDetail", {timePeriodId: "NO_SUCH_PERIOD"}),
                false
            ),
            periods: helper().asUser("finance.gl", () => helper().page("PeriodClose/Periods", {}, "html"), false)
        }
    },
    then({approver, reader, missing, periods}) {
        approver.errors.length == 0
        approver.output.includes("Last month") && approver.output.includes("checks keep the period from closing")
        approver.output.includes("BOSS_ACCT_CLOSE_INVOICE · Last month's services")
        approver.output.includes("Payroll account: 1 lines not on a finished statement")
        approver.output.includes("Invoice reconciliation") && !approver.output.includes("ClosePeriodDialog")
        reader.errors.length == 0 && reader.output.includes("BOSS_ACCT_CLOSE_INVOICE")
        missing.output.includes("This fiscal period is not available.")
        periods.output.includes("PeriodCloseDetail")
    }
})
feature("a period run starts from its dialog's service and shows its results; the list shows it", {
    when() {
        return helper().asUser(
            "finance.gl",
            () => {
                const run = helper().call("mantle.ledger.PeriodRunServices.preview#Run", {
                    runKindEnumId: "PrkProjectCost",
                    organizationPartyId: helper().ids.organizationPartyId,
                    timePeriodId: period.timePeriodId
                })
                return {
                    list: helper().page("PeriodClose/PeriodRuns", {}, "html"),
                    selected: helper().page("PeriodClose/PeriodRuns", {periodRunId: run.periodRunId}),
                    tui: helper().page("PeriodClose/PeriodRuns", {periodRunId: run.periodRunId}, "tui")
                }
            },
            false
        )
    },
    then({list, selected, tui}) {
        list.errors.length == 0 && list.output.includes("Project cost") && list.output.includes("Preview")
        selected.errors.length == 0 && selected.output.includes("This run has no results")
        selected.output.includes("Start a run")
        tui.errors.length == 0 && tui.output.includes("Project cost")
    }
})
feature("the invoice reconciliation report runs for the period and compares the aging with the ledger", {
    when() {
        return helper().asUser(
            "finance.read",
            () => ({
                empty: helper().page("Reports/InvoiceReconciliation", {}),
                report: helper().page("Reports/InvoiceReconciliation", period),
                payables: helper().page("Reports/InvoiceReconciliation", Object.assign({invoiceType: "payable"}, period), "tui")
            }),
            false
        )
    },
    then({empty, report, payables}) {
        empty.errors.length == 0 && empty.output.includes("Choose an organization and a fiscal period")
        report.errors.length == 0 && report.output.includes("Aging open") && report.output.includes("Ledger balance")
        payables.errors.length == 0 && payables.output.includes("Aging open")
    }
})
