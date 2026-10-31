// Screen context for payment runs: the runs list with its totals and progress, and a run's detail shaped for
// PaymentRunDetail. Mantle's PaymentRunServices own every run read and change and their authorization (get#Run masks the
// bank accounts); this adds the screen's labels, colors, links and the operation key of the execute form.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const {policy, array, money} = lib
const statusColors = {PrunDraft: "grey-7", PrunApproved: "primary", PrunExecuted: "positive", PrunCancelled: "negative"}
const resultColors = {PrrPaid: "positive", PrrSent: "primary", PrrFailed: "negative", PrrReturned: "warning"}
const readsRuns = scope => ["apRead", "paymentRead", "reportRead", "admin", "systemAdmin"].some(name => scope.capabilities[name])

// A page of the organization's runs, newest first, each with its bank account (masked), dates, total and progress.
function runs(parameters) {
    const scope = lib.access(parameters)
    if (!readsRuns(scope)) throw new Error("PERMISSION_DENIED: Payables or payment read authority is required")
    const organizationPartyId = policy.organization(parameters).organizationPartyId
    const query = () => {
        let found = policy.find("mantle.account.payment.PaymentRun", {organizationPartyId})
        if (parameters.statusId) found = found.condition("statusId", parameters.statusId)
        return found
    }
    const page = policy.lib.page(query().orderBy("-createdDate,-paymentRunId"), parameters, "runs", query().count())
    const list = array(page.rows)
    const ids = list.map(row => row.paymentRunId)
    const items = ids.length
        ? array(
              policy
                  .find("mantle.account.payment.PaymentRunItem", {selectedIndicator: "Y"})
                  .condition("paymentRunId", "in", ids)
                  .list()
          )
        : []
    const methodIds = [...new Set(list.map(row => row.paymentMethodId).filter(Boolean))]
    const workflow = ec.resource.script("component://mr-mantle/service/mantle/account/PaymentWorkflow.js")
    const banks = Object.fromEntries(
        workflow
            .methodRows(
                methodIds.length
                    ? array(
                          policy.find("mantle.account.method.PaymentMethod").condition("paymentMethodId", "in", methodIds).list()
                      )
                    : []
            )
            .map(row => [row.paymentMethodId, row.label])
    )
    const instruments = {PiAch: "ACH", PiCompanyCheck: "Check"}
    return Object.assign(lib.paging(page, "runs"), {
        runs: list.map(row => {
            const own = items.filter(item => item.paymentRunId === row.paymentRunId)
            const total = own.reduce((sum, item) => sum.add(item.paymentAmount || 0), toDecimal(0))
            const count = enumId => own.filter(item => item.resultEnumId === enumId).length
            return Object.assign(policy.display(row), {
                statusText: lib.statusText(row.statusId),
                statusColor: statusColors[row.statusId] || "grey-7",
                bankText: banks[row.paymentMethodId] || "",
                instrumentText: instruments[row.paymentInstrumentEnumId] || row.paymentInstrumentEnumId,
                payDateText: row.payDate ? lib.day(row.payDate) : "",
                dueThroughDateText: row.dueThroughDate ? lib.day(row.dueThroughDate) : "",
                total: row.approvedTotal ?? total,
                billCount: own.length,
                progressText:
                    row.statusId === "PrunExecuted"
                        ? count("PrrPaid") + count("PrrSent") + " paid, " + count("PrrFailed") + " failed"
                        : own.length + " bills",
                routeParameters: {organizationPartyId, paymentRunId: row.paymentRunId}
            })
        }),
        runCapabilities: {canCreate: !!(scope.capabilities.apEdit || scope.capabilities.admin)}
    })
}

// A run for PaymentRunDetail, every part present: a run that does not exist or the user may not read has runFound false.
function runContext(parameters) {
    const scope = lib.access(parameters)
    const found = parameters.paymentRunId
        ? lib.optional(
              "mantle.account.PaymentRunServices.get#Run",
              {paymentRunId: parameters.paymentRunId, organizationPartyId: scope.organizationPartyId || null},
              "Payment run " + parameters.paymentRunId
          )
        : null
    const run = found?.run ? policy.display(found.run) : {}
    const capabilities = found?.capabilities || {}
    const items = array(found?.runItems).map(row =>
        Object.assign(policy.display(row), {
            resultColor: resultColors[row.resultEnumId] || "grey-7",
            billParameters: {organizationPartyId: run.organizationPartyId, recordId: row.invoiceId},
            paymentParameters: {organizationPartyId: run.organizationPartyId, recordId: row.paymentId},
            dialogKey: row.paymentRunItemSeqId
        })
    )
    return {
        runFound: !!found?.run,
        run: Object.assign(run, {
            statusColor: statusColors[run.statusId] || "grey-7",
            selectedTotalText: money(run.selectedTotal, run.currencyUomId),
            approvedTotalText: money(run.approvedTotal, run.currencyUomId),
            discountTotalText: money(run.discountTotal, run.currencyUomId)
        }),
        selectedItems: items.filter(row => row.selectedIndicator === "Y"),
        excludedItems: items.filter(row => row.selectedIndicator !== "Y"),
        runCapabilities: capabilities,
        // a form submitted once: a resubmitted execute is answered as the first
        executeOperationKey: lib.operationKey("RUN"),
        runParameters: {organizationPartyId: run.organizationPartyId, paymentRunId: run.paymentRunId}
    }
}

const operations = {runs, runContext}
function execute(op, parameters) {
    if (!operations[op]) throw new Error("Unknown payment run screen operation " + op)
    return operations[op](parameters)
}
;({execute})
