// The Accounting outputs of design-accounting §17 that P21 adds: the printed supplier bill (Payables/BillPrint, Mantle's
// get#InvoiceOutput with the supplier as the issuer, through AccountingDocuments.xml's DocumentPrint as the invoice's) and the
// evidence prints of the record screens (AccountingReportParts.xml's RecordPrint: the screen's own record in html-print).
// Run: ./moq test mr-boss --spec AccountingOutputs
const lib = ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const bill = {invoiceId: "BOSS_ACCT_BILL"}
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("AP prints a bill as the supplier issued it; the printed page has no forms, and AR is refused it", {
    when() {
        return lib.asUser("finance.ap", () => ({
            print: lib.page("Payables/BillPrint", bill, "html-print"),
            qvt: lib.page("Payables/BillPrint", bill, "qvt"),
            missing: lib.page("Payables/BillPrint", {invoiceId: "_NA_"}, "html"),
            detail: lib.page("Payables/BillDetail", {recordId: bill.invoiceId}, "html"),
            arPrint: lib.asUser("finance.ar", () => lib.page("Payables/BillPrint", bill, "html-print"))
        }))
    },
    then({print, qvt, missing, detail, arPrint}) {
        print.errors == []
        print.output.includes("BOSS_ACCT_BILL")
        print.output.includes("Another Company Making Everything")
        !print.output.includes("<form")
        qvt.output.includes("Open the printable bill")
        missing.output.includes("Bill not available")
        // BillDetail's Print and Download PDF open the bill's print
        detail.output.includes("Payables/BillPrint?invoiceId=BOSS_ACCT_BILL")
        detail.output.includes("/fop/Accounting/Payables/BillPrint")
        !arPrint.output.includes("Another Company Making Everything")
    }
})

feature("the record screens print their record as evidence: a journal entry and a period's close", {
    when() {
        return lib.asUser("finance.gl", () => ({
            entry: lib.page("GeneralLedger/JournalEntryDetail", {recordId: "BOSS_ACCT_ENTRY"}, "html"),
            entryPrint: lib.page("GeneralLedger/JournalEntryDetail", {recordId: "BOSS_ACCT_ENTRY"}, "html-print"),
            close: lib.page("PeriodClose/PeriodCloseDetail", {timePeriodId: lib.ids.closePeriodId}, "html"),
            closePrint: lib.page("PeriodClose/PeriodCloseDetail", {timePeriodId: lib.ids.closePeriodId}, "html-print")
        }))
    },
    then({entry, entryPrint, close, closePrint}) {
        entry.output.includes("GeneralLedger/JournalEntryDetail?renderMode=html-print&amp;recordId=BOSS_ACCT_ENTRY")
        entryPrint.errors == []
        entryPrint.output.includes("Office expense review")
        !entryPrint.output.includes("<form")
        close.output.includes("PeriodClose/PeriodCloseDetail?renderMode=html-print&amp;timePeriodId=" + lib.ids.closePeriodId)
        closePrint.errors == []
        closePrint.output.includes("Last month")
        !closePrint.output.includes("<form")
    }
})

feature("the evidence prints of a record that is not there print its not-available state, without an error", {
    where: [
        {path: "Banking/ReconciliationDetail", parameters: {bankReconciliationId: "_NA_"}, text: "This bank statement is not available"},
        {path: "Banking/FinancialAccountDetail", parameters: {finAccountId: "_NA_"}, text: "This stored-value account is not available"},
        {path: "Tax/TaxStatementDetail", parameters: {taxStatementId: "_NA_"}, text: "does not exist, or you may not see it"},
        {path: "FixedAssets/DepreciationRunDetail", parameters: {periodRunId: "_NA_"}, text: "not available"}
    ],
    when({path, parameters}) {
        return {page: lib.page(path, parameters, "html-print")}
    },
    then({page, text}) {
        page.errors == []
        page.output.includes(text)
    }
})
