// Payment runs in the Accounting app: the runs list, a run's detail, the payables workbench and the payment terms render
// what each user may do; a run made by AP from the demo's due bills leaves out the held one with its reason, is approved
// by an approver and executed by treasury, and its bank file downloads the same again.
const lib = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const org = "BOSS_ACCT_ORG"
const supplier = "BOSS_ACCT_SUPPLIER"
const today = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
let runId

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("AP starts a run from the demo's due bills; the held bill is left out with its reason", {
    when() {
        const made = lib().asUser("finance.ap", () =>
            lib().call("mantle.account.PaymentRunServices.create#Run", {
                organizationPartyId: org,
                paymentMethodId: "BOSS_ACCT_RUN_BANK",
                paymentInstrumentEnumId: "PiAch",
                dueThroughDate: today(),
                payDate: today()
            })
        )
        runId = made.paymentRunId
        const detail = lib().asUser("finance.ap", () =>
            lib().call("ironstone.accounting.PaymentRunServices.get#RunContext", {organizationPartyId: org, paymentRunId: runId})
        )
        return {made, detail}
    },
    then({made, detail}) {
        made.selectedCount == 2
        detail.selectedItems
            .map(row => row.invoiceId)
            .sort()
            .join() == "BOSS_ACCT_BILL_DISCOUNT,BOSS_ACCT_BILL_DUE"
        detail.excludedItems.find(row => row.invoiceId === "BOSS_ACCT_BILL_DISPUTE").excludeText == "On hold: Supplier dispute"
        detail.excludedItems.find(row => row.invoiceId === "BOSS_ACCT_BILL_RUN").excludeText.startsWith("In another open run")
        String(detail.selectedItems.find(row => row.invoiceId === "BOSS_ACCT_BILL_DISCOUNT").discountAmount) == "10"
        detail.runCapabilities.canApprove == false
        detail.runCapabilities.canRequestApproval == true
    }
})

feature("the payment run screens render in #mode", {
    where: [{mode: "qvt"}, {mode: "tui"}],
    when({mode}) {
        const pages = [
            ["finance.ap", "Payables/PaymentRuns", {}, "Run " + runId],
            ["finance.ap", "Payables/PaymentRunDetail", {paymentRunId: runId}, "SUPP-1004"],
            ["finance.ap", "Payables/PaymentRunDetail", {paymentRunId: "BOSS_ACCT_NO_RUN"}, "Payment run not available"],
            ["finance.ap", "Payables/PayablesWorkbench", {partyId: supplier, currencyUomId: "USD"}, "Apply supplier credits"],
            ["finance.treasury", "Payables/PaymentRunDetail", {paymentRunId: runId}, "SUPP-1003"],
            ["finance.admin", "Settings/PaymentTerms", {}, "2% off within 10 days"]
        ]
        const rows = pages.map(([user, path, parameters, text]) =>
            lib().asUser(user, () => {
                const page = lib().page(path, parameters, mode)
                return {path, status: page.status, errors: page.errors, found: page.output.includes(text)}
            })
        )
        return {rows}
    },
    then({rows}) {
        rows.filter(row => row.status != 200 || row.errors.length || !row.found).map(row => row.path) == []
    }
})

feature("AP sends the run for approval; an approver approves it and treasury executes it with one file", {
    when() {
        const ap = lib().asUser("finance.ap", () => {
            lib().call("mantle.account.PaymentRunServices.request#RunApproval", {organizationPartyId: org, paymentRunId: runId})
            return lib().page("Payables/PaymentRunDetail", {paymentRunId: runId}, "qvt")
        })
        const approverPage = lib().asUser("finance.approve", () =>
            lib().page("Payables/PaymentRunDetail", {paymentRunId: runId}, "qvt")
        )
        const approved = lib().asUser("finance.approve", () => {
            const run = ec.entity.find("mantle.account.payment.PaymentRun").condition("paymentRunId", runId).disableAuthz().one()
            return lib().call("mantle.account.PaymentRunServices.approve#Run", {
                organizationPartyId: org,
                paymentRunId: runId,
                lastUpdatedStamp: run.lastUpdatedStamp
            })
        })
        const treasuryPage = lib().asUser("finance.treasury", () =>
            lib().page("Payables/PaymentRunDetail", {paymentRunId: runId}, "qvt")
        )
        const executed = lib().asUser("finance.treasury", () =>
            lib().call("mantle.account.PaymentRunServices.execute#Run", {
                organizationPartyId: org,
                paymentRunId: runId,
                operationKey: "BOSS-RUN-" + runId
            })
        )
        const files = lib().asUser("finance.treasury", () => [
            lib().call("mantle.account.PaymentRunServices.get#RunFile", {organizationPartyId: org, paymentRunId: runId}),
            lib().call("mantle.account.PaymentRunServices.generate#RunFile", {organizationPartyId: org, paymentRunId: runId})
        ])
        const apFile = lib().asUser("finance.ap", () =>
            lib().refusal("mantle.account.PaymentRunServices.get#RunFile", {organizationPartyId: org, paymentRunId: runId})
        )
        return {ap, approverPage, approved, treasuryPage, executed, files, apFile}
    },
    then({ap, approverPage, approved, treasuryPage, executed, files, apFile}) {
        !ap.output.includes("Approve run")
        approverPage.output.includes("Approve run")
        approved.statusId == "PrunApproved"
        treasuryPage.output.includes("Execute run")
        executed.paidCount == 2
        executed.failedCount == 0
        files[0].fileText.length > 0
        files[1].fileText == files[0].fileText
        apFile.includes("PERMISSION_DENIED")
    }
})
