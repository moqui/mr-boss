// The Accounting landing (design-accounting §3): AccountingSummary and MoneyCards, the counts and amounts the user may read
// for the active organization, and MyFinanceWork, the work waiting for this user. Every figure comes from a Mantle service
// that checks the organization; one that fails is null and named in the findings, never shown as zero.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const accounting = ec.resource.script("component://mr-boss/service/ironstone/accounting/Accounting.js")
const policy = lib.policy
const probe = policy.probe
const BANK_PAGE = 100

// A figure's read in its own transaction: its value, or null with the failure named in findings.
function measured(findings, label, read) {
    try {
        return read()
    } catch (error) {
        ec.logger.error("Accounting Home " + label + ": " + error.message)
        findings.push(label + " is unavailable")
        return null
    }
}
function ledgerCounts(scope, counts, findings) {
    for (const [counter, kind, extra, label] of [
        ["unposted", "journals", {isPosted: "N"}, "Draft entries"],
        ["posted", "journals", {isPosted: "Y"}, "Posted entries"],
        ["accounts", "accounts", {}, "Chart accounts"],
        ["periods", "periods", {}, "Fiscal periods"]
    ])
        counts[counter] = measured(
            findings,
            label,
            () =>
                probe(
                    "mantle.ledger.AccountingServices.find#Records",
                    Object.assign({kind, organizationPartyId: scope.organizationPartyId, pageSize: 1}, extra)
                ).recordCount
        )
}
// The organization's fiscal period of a type holding today.
function currentPeriod(organizationPartyId, timePeriodTypeId) {
    const found = policy.call("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {
        organizationPartyId,
        filterDate: ec.user.nowTimestamp,
        timePeriodTypeId
    }).timePeriodList
    return lib.array(found)[0] || null
}
// Receivables or payables open today in the base currency (run#Aging): the total, and what is past due.
function openAmounts(org, invoiceType, currencyUomId) {
    const out = probe("mantle.ledger.LedgerReportServices.run#Aging", {
        organizationPartyId: org,
        asOfDate: lib.today(),
        invoiceType
    })
    if (!out.complete) throw new Error(out.incompleteReason || "the aging could not read every open invoice")
    const total = lib.array(out.totals).find(row => row.currencyUomId === currencyUomId)
    const due = toDecimal(total?.total ?? 0)
    return {due, overdue: due.subtract(toDecimal(total?.current ?? 0))}
}
function moneyCards(scope, counts, findings) {
    const org = scope.organizationPartyId
    const c = scope.capabilities
    const currencyUomId = policy.preference(org).baseCurrencyUomId
    counts.currencyUomId = currencyUomId
    if (c.reportRead || c.arRead || c.admin) {
        const ar = measured(findings, "Receivables due", () => openAmounts(org, "receivable", currencyUomId))
        counts.arDue = ar?.due ?? null
        counts.arOverdue = ar?.overdue ?? null
    }
    if (c.reportRead || c.apRead || c.admin)
        counts.apDue = measured(findings, "Payables due", () => openAmounts(org, "payable", currencyUomId))?.due ?? null
    if (c.reportRead || c.bankReconcile || c.admin) {
        const bank = measured(findings, "Bank balances", () => {
            const out = probe("mantle.account.ReconciliationServices.find#BankAccounts", {
                organizationPartyId: org,
                pageSize: BANK_PAGE
            })
            if (out.recordCount > BANK_PAGE) throw new Error("more than " + BANK_PAGE + " bank accounts")
            const rows = lib.array(out.bankRows)
            if (rows.some(row => row.currencyUomId && row.currencyUomId !== currencyUomId))
                findings.push("Bank accounts in other currencies are left out of the bank balance")
            return {
                balance: rows
                    .filter(row => !row.currencyUomId || row.currencyUomId === currencyUomId)
                    .reduce((sum, row) => sum.add(toDecimal(row.ledgerBalance ?? 0)), toDecimal(0)),
                unmatched: rows.reduce((sum, row) => sum + Number(row.openCount || 0), 0)
            }
        })
        counts.bankBalance = bank?.balance ?? null
        counts.unmatched = bank?.unmatched ?? null
    }
    if (c.glPost || c.fiscalClose || c.admin)
        counts.unpostedDocuments = measured(findings, "Unposted documents", () => {
            const year = currentPeriod(org, "FiscalYear")
            if (!year) return 0
            counts.unpostedPeriodId = year.timePeriodId
            return probe("mantle.ledger.CloseServices.check#StandardClose", {
                organizationPartyId: org,
                timePeriodId: year.timePeriodId,
                checkEnumId: "PccUnpostedDocuments"
            }).count
        })
}

// MyFinanceWork: each source the user works on, with its count and the list that resolves it. A source that fails is
// listed as unavailable; one with nothing waiting is left out. Production runs awaiting cost close come with
// Manufacturing's cost close.
function work(scope) {
    const org = scope.organizationPartyId
    const c = scope.capabilities
    const links = scope.sharedLinks
    const rows = []
    const source = (title, path, parameters, read) => {
        let count = null
        try {
            count = Number(read())
        } catch (error) {
            ec.logger.error("Accounting Home work " + title + ": " + error.message)
        }
        if (count === 0) return
        rows.push({title, count, countText: count == null ? "Unavailable" : String(count), path, linkParameters: parameters})
    }
    const bills = queue =>
        probe("mantle.account.InvoiceServices.find#Payables", {organizationPartyId: org, queue, pageSize: 1}).recordsCount
    if (c.approve)
        source("Bills awaiting approval", links["Payables/Bills"], {organizationPartyId: org, queue: "review"}, () => bills("review"))
    if (c.apRead || c.holdRelease)
        source("Bills on hold", links["Payables/Bills"], {organizationPartyId: org, queue: "held"}, () => bills("held"))
    if (c.glPost)
        source("Journal batches with entries that did not post", links["GeneralLedger/JournalBatches"], {organizationPartyId: org}, () =>
            failedBatches(org)
        )
    if (c.fiscalClose) {
        const period = lastOpenMonth(org)
        if (period)
            source(
                "Blockers to closing " + (period.periodName || period.timePeriodId),
                links["PeriodClose/PeriodCloseDetail"],
                {organizationPartyId: org, timePeriodId: period.timePeriodId},
                () => probe("mantle.ledger.CloseServices.get#Checklist", {organizationPartyId: org, timePeriodId: period.timePeriodId}).blockerCount
            )
    }
    if (c.arRead || c.arEdit)
        source("Collection follow-ups assigned to you", links["Receivables/Collections"], {organizationPartyId: org}, () =>
            followUps(org)
        )
    return rows
}
// Open batches of the organization holding both posted entries and entries left unposted: a batch run that named failures.
function failedBatches(org) {
    const journals = posted =>
        new Set(
            lib
                .array(
                    policy
                        .find("mantle.ledger.transaction.AcctgTrans", {organizationPartyId: org, isPosted: posted})
                        .condition("glJournalId", "is-not-null", null)
                        .selectField("glJournalId")
                        .distinct(true)
                        .list()
                )
                .map(row => row.glJournalId)
        )
    const done = journals("Y"),
        left = journals("N")
    const both = [...done].filter(id => left.has(id))
    if (!both.length) return 0
    const cf = ec.entity.conditionFactory
    return policy
        .find("mantle.ledger.transaction.GlJournal")
        .condition("glJournalId", "in", both)
        .condition(cf.makeCondition([cf.makeCondition("isPosted", "is-null", null), cf.makeCondition("isPosted", "equals", "N")], "or"))
        .count()
}
// The organization's latest fiscal month that has ended and is not closed.
function lastOpenMonth(org) {
    const cf = ec.entity.conditionFactory
    return (
        policy
            .find("mantle.party.time.TimePeriod", {partyId: org, timePeriodTypeId: "FiscalMonth"})
            .condition("thruDate", "less", lib.today())
            .condition(cf.makeCondition([cf.makeCondition("isClosed", "is-null", null), cf.makeCondition("isClosed", "equals", "N")], "or"))
            .orderBy("-fromDate")
            .limit(1)
            .list()[0] || null
    )
}
// The user's open collection next actions of the organization (CollectionActivity CaoNextAction on an open task).
function followUps(org) {
    const partyId = ec.user.userAccount?.partyId
    if (!partyId) return 0
    const activities = lib
        .array(
            policy
                .find("mantle.account.invoice.CollectionActivity", {organizationPartyId: org, outcomeEnumId: "CaoNextAction"})
                .selectField("workEffortId")
                .limit(1000)
                .list()
        )
        .map(row => row.workEffortId)
    if (!activities.length) return 0
    const mine = lib
        .array(
            policy
                .find("mantle.work.effort.WorkEffortParty", {partyId})
                .condition("workEffortId", "in", activities)
                .condition("thruDate", "is-null", null)
                .selectField("workEffortId")
                .list()
        )
        .map(row => row.workEffortId)
    if (!mine.length) return 0
    return policy
        .find("mantle.work.effort.WorkEffort")
        .condition("workEffortId", "in", [...new Set(mine)])
        .condition("statusId", "not-in", ["WeComplete", "WeClosed", "WeCancelled"])
        .count()
}

function summary(parameters) {
    const scope = accounting.execute("access", parameters)
    const c = scope.capabilities
    const counts = {
        unposted: null,
        posted: null,
        accounts: null,
        periods: null,
        arDue: null,
        arOverdue: null,
        apDue: null,
        bankBalance: null,
        unmatched: null,
        unpostedDocuments: null,
        unpostedPeriodId: null,
        currencyUomId: null
    }
    const findings = []
    if (c.reportRead || c.glPost) ledgerCounts(scope, counts, findings)
    if (scope.organizationPartyId) moneyCards(scope, counts, findings)
    try {
        const out = probe("mantle.ledger.SetupServices.get#Readiness", {organizationPartyId: scope.organizationPartyId})
        findings.push(...lib.array(out.findings).map(row => row.code + ": " + row.message))
    } catch (error) {
        ec.logger.error("Accounting Home setup health: " + error.message)
        findings.push("Setup health is unavailable")
    }
    counts.asOf = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd HH:mm:ss")
    return {summary: counts, findings, workRows: scope.organizationPartyId ? work(scope) : []}
}

const operations = {summary}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Accounting Home operation " + op)
        return operations[op](parameters)
    }
})
