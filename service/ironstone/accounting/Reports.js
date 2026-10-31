// The Accounting reports (design-accounting §13): the Reports catalog the user may run, and the statements' print and
// export shape. Mantle's report services check the organization and its periods and compute every figure; this turns
// their class trees and maps into the one list of rows a statement screen shows, prints and exports.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const policy = lib.policy
const ledger = name => "mantle.ledger.LedgerReportServices." + name

// The reports of the catalog, in the design's order: what each answers, its area, the capabilities that may run it, and
// whether its quick options take a fiscal period.
const catalogRows = [
    ["TrialBalance", "Trial balance", "Ledger", "Each account's beginning balance, debits, credits and ending balance."],
    ["GeneralLedger", "General ledger", "Ledger", "The posted lines of each account, with a running balance."],
    ["PartnerLedger", "Partner ledger", "Ledger", "Each customer's or supplier's movements and balance on its account."],
    ["BalanceSheet", "Balance sheet", "Statements", "Assets, liabilities and equity at the end of a period."],
    ["IncomeStatement", "Income statement", "Statements", "Income and expense of a period, to net income."],
    ["CashFlow", "Cash flow", "Statements", "Cash from operating, investing and financing activities."],
    ["RetainedEarnings", "Retained earnings", "Statements", "Retained earnings at the start, net income, distributions."],
    ["FinancialRatios", "Financial ratios", "Statements", "Liquidity, activity, leverage and profitability ratios."],
    ["AccountBalance", "Account balances", "Statements", "Balances and income of each month of a fiscal year."],
    ["PostedSummary", "Posted amounts", "Ledger", "Each account's posted debits, credits and balance between two days."],
    ["Aging", "Aging", "Receivables and payables", "Receivables or payables open on a day, by days past due."],
    ["InvoiceReconciliation", "Invoice reconciliation", "Close", "Invoices, payments and postings that disagree with the ledger."],
    ["BudgetVariance", "Budget variance", "Budgets", "Each account's budget, commitments, actual and what remains."],
    ["SalesAnalysis", "Sales analysis", "Sales", "Ordered, shipped, invoiced and returned, by product, customer or class."],
    ["StockTransactions", "Stock transactions", "Inventory", "The receipts, issues and count variances of a period."]
]
const ledgerReaders = ["reportRead", "admin"]
const runners = {Aging: ["reportRead", "admin", "arRead", "apRead"]}
// Reports whose quick options take a fiscal period; the others take the organization alone.
const periodReports = new Set([
    "TrialBalance",
    "GeneralLedger",
    "PartnerLedger",
    "BalanceSheet",
    "IncomeStatement",
    "CashFlow",
    "RetainedEarnings",
    "FinancialRatios",
    "AccountBalance",
    "PostedSummary",
    "InvoiceReconciliation",
    "SalesAnalysis",
    "StockTransactions"
])
const comparedReports = new Set(["BalanceSheet", "IncomeStatement", "CashFlow", "RetainedEarnings", "FinancialRatios"])

function catalog(parameters) {
    const scope = lib.access(parameters)
    const reports = catalogRows
        .filter(([reportId]) => (runners[reportId] || ledgerReaders).some(name => scope.capabilities[name]))
        .map(([reportId, title, area, description]) => ({
            reportId,
            title,
            area,
            description,
            usesPeriod: periodReports.has(reportId),
            usesComparison: comparedReports.has(reportId)
        }))
    return {reports, organizationPartyId: scope.organizationPartyId}
}
// The report a quick options form opens, refused unless it is in the user's catalog.
function openReport(parameters) {
    const found = catalog(parameters).reports.find(row => row.reportId === parameters.reportId)
    if (!found) throw new Error("REPORT_UNAVAILABLE: Choose a report from the list")
    return {reportId: found.reportId}
}

// A statement's row: its kind (class, account, total, ratio or period), indent level, label, the amount of the period and
// of the comparison period with the change, and what it opens.
function row(kind, level, label, amount, compareAmount, extra = {}) {
    const value = amount == null ? null : toDecimal(amount)
    const compare = compareAmount == null ? null : toDecimal(compareAmount)
    return Object.assign(
        {
            rowType: kind,
            level,
            label: " ".repeat(level) + label,
            amount: value,
            compareAmount: compare,
            change: value != null && compare != null ? value.subtract(compare) : null
        },
        extra
    )
}
// A class and, below it, its accounts and child classes, each with the total of the field given (balance, posted, or
// posted without closing entries) for the period and the comparison period.
function classRows(out, info, field, periods, level = 0) {
    if (!info) return
    const total = info["total" + field + "ByTimePeriod"] || {}
    const hasAmount = map => periods.some(id => id && map?.[id] != null && !toDecimal(map[id]).isZero())
    if (!hasAmount(total) && level > 0) return
    out.push(row("class", level, info.className || info.glAccountClassEnumId, total[periods[0]] ?? 0, periods[1] ? total[periods[1]] ?? 0 : null))
    const accountField = field.charAt(0).toLowerCase() + field.slice(1) + "ByTimePeriod"
    for (const account of Array.from(info.glAccountInfoList || [])) {
        const values = account[accountField] || {}
        if (!hasAmount(values)) continue
        out.push(
            row(
                "account",
                level + 1,
                [account.accountCode, account.accountName].filter(Boolean).join(" "),
                values[periods[0]] ?? 0,
                periods[1] ? values[periods[1]] ?? 0 : null,
                {glAccountId: account.glAccountId}
            )
        )
    }
    for (const child of Array.from(info.childClassInfoList || [])) classRows(out, child, field, periods, level + 1)
}
function total(label, map, periods) {
    return row("total", 0, label, map?.[periods[0]] ?? 0, periods[1] ? map?.[periods[1]] ?? 0 : null)
}

const statements = {
    balanceSheet(report, periods) {
        const out = []
        for (const classId of ["ASSET", "LIABILITY", "EQUITY", "DISTRIBUTION"])
            classRows(out, report.classInfoById[classId], "Balance", periods)
        const netIncome = report.netIncomeOut?.totalBalance || {}
        const liabilities = report.liabilityEquityTotalMap?.totalBalance || {}
        const withIncome = Object.fromEntries(
            periods.filter(Boolean).map(id => [id, toDecimal(liabilities[id] ?? 0).add(toDecimal(netIncome[id] ?? 0))])
        )
        out.push(total("Total assets", report.netAssetTotalMap?.totalBalance, periods))
        out.push(total("Net income not yet closed", netIncome, periods))
        out.push(total("Total liabilities, equity and net income", withIncome, periods))
        return out
    },
    incomeStatement(report, periods) {
        const out = []
        for (const classId of ["REVENUE", "COST_OF_SALES"]) classRows(out, report.classInfoById[classId], "PostedNoClosing", periods)
        out.push(total("Gross profit", report.grossProfitOnSalesMap, periods))
        classRows(out, report.classInfoById.EXPENSE, "PostedNoClosing", periods)
        out.push(total("Net operating income", report.netOperatingIncomeMap, periods))
        for (const classId of ["INCOME", "NON_OP_EXPENSE"]) classRows(out, report.classInfoById[classId], "PostedNoClosing", periods)
        out.push(total("Net non-operating income", report.netNonOperatingIncomeMap, periods))
        out.push(total("Net income", report.netIncomeMap, periods))
        return out
    },
    cashFlow(report, periods) {
        const out = [total("Net income", report.netIncomeMap, periods)]
        for (const classId of ["CURRENT_ASSET", "OTHER_ASSET", "CURRENT_LIABILITY"])
            classRows(out, report.classInfoById[classId], "Posted", periods, 1)
        out.push(total("Net cash from operating activities", report.netOperatingActivityMap, periods))
        classRows(out, report.classInfoById.LONG_TERM_ASSET, "Posted", periods, 1)
        out.push(total("Net cash from investing activities", report.netInvestingActivityMap, periods))
        for (const classId of ["DISTRIBUTION", "EQUITY", "LONG_TERM_LIABILITY"])
            classRows(out, report.classInfoById[classId], "Posted", periods, 1)
        out.push(total("Net cash from financing activities", report.netFinancingActivityMap, periods))
        const change = Object.fromEntries(
            periods
                .filter(Boolean)
                .map(id => [
                    id,
                    [report.netOperatingActivityMap, report.netInvestingActivityMap, report.netFinancingActivityMap].reduce(
                        (sum, map) => sum.add(toDecimal(map?.[id] ?? 0)),
                        toDecimal(0)
                    )
                ])
        )
        out.push(total("Net change in cash", change, periods))
        return out
    },
    retainedEarnings(report, periods) {
        const retained = report.classInfoById.RETAINED_EARNINGS || {}
        const distributions = report.classInfoById.DISTRIBUTION || {}
        const at = (map, id) => toDecimal(map?.[id] ?? 0)
        const start = Object.fromEntries(
            periods
                .filter(Boolean)
                .map(id => [id, at(retained.totalBalanceByTimePeriod, id).subtract(at(retained.totalPostedByTimePeriod, id))])
        )
        const end = Object.fromEntries(
            periods
                .filter(Boolean)
                .map(id => [
                    id,
                    start[id].add(at(report.netIncomeMap, id)).add(at(distributions.totalPostedByTimePeriod, id))
                ])
        )
        return [
            total("Retained earnings at the start", start, periods),
            total("Net income", report.netIncomeMap, periods),
            total("Distributions", distributions.totalPostedByTimePeriod, periods),
            total("Retained earnings at the end", end, periods)
        ]
    },
    financialRatios(report, periods) {
        // ratio, formula, numerator map, denominator map, result map
        const ratios = [
            ["Current ratio", "Current assets / current liabilities", "currentAssetsMap", "currentLiabilitiesMap", "currentLiquidityMap"],
            ["Debt ratio", "Total liabilities / total assets", "totalLiabilitiesMap", "totalAssetsMap", "debtRatioMap"],
            ["Debt to equity", "Long-term debt / equity", "longTermDebtMap", "equityMap", "debtToEquityMap"],
            ["Equity multiplier", "Total assets / equity", "totalAssetsMap", "equityMap", "equityMultiplierMap"],
            ["Inventory turnover", "Cost of goods sold / inventory", "cogsMap", "inventoryMap", "inventoryTurnoverMap"],
            ["Total asset turnover", "Sales / total assets", "salesMap", "totalAssetsMap", "totalAssetsTurnoverMap"],
            ["Fixed asset turnover", "Sales / net fixed assets", "salesMap", "netFixedAssetsMap", "fixedAssetTurnoverMap"],
            ["Gross profit margin", "Gross profit / sales", "grossProfitMap", "salesMap", "grossProfitMarginMap"],
            ["Net profit margin", "Net income / sales", "netIncomeMap", "salesMap", "netProfitMarginMap"],
            ["Return on assets", "Net income / total assets", "netIncomeMap", "totalAssetsMap", "returnOnAssetsMap"],
            ["Return on equity", "Net income / equity", "netIncomeMap", "equityMap", "returnOnEquityMap"],
            ["Times interest earned", "Earnings before interest and tax / interest expense", "ebitMap", "interestExpenseMap",
                "timesInterestEarnedMap"]
        ]
        const value = (map, id) => (id && report[map]?.[id] != null ? toDecimal(report[map][id]) : toDecimal(0))
        // a zero denominator makes the ratio unavailable, never zero or infinite
        const result = (name, denominator, id) => (!id || value(denominator, id).isZero() ? null : value(name, id))
        return ratios.map(([label, formula, numerator, denominator, name]) =>
            row("ratio", 0, label, result(name, denominator, periods[0]), periods[1] ? result(name, denominator, periods[1]) : null, {
                formula,
                numerator: value(numerator, periods[0]),
                denominator: value(denominator, periods[0])
            })
        )
    }
}
const services = {
    balanceSheet: "run#BalanceSheet",
    incomeStatement: "run#IncomeStatement",
    cashFlow: "run#CashFlowStatement",
    retainedEarnings: "run#RetainedEarningsStatement",
    financialRatios: "run#FinancialRatios"
}

// The organization's fiscal month holding today, the default period of a statement.
function currentPeriod(organizationPartyId, timePeriodTypeId = "FiscalMonth") {
    const found = policy.call("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {
        organizationPartyId,
        filterDate: ec.user.nowTimestamp,
        timePeriodTypeId
    }).timePeriodList
    return Array.from(found || [])[0]?.timePeriodId || null
}
function periodName(timePeriodId) {
    if (!timePeriodId) return ""
    const period = policy.one("mantle.party.time.TimePeriod", {timePeriodId})
    return period?.periodName || timePeriodId
}

// A statement's rows (balanceSheet, incomeStatement, cashFlow, retainedEarnings, financialRatios or accountBalance) for
// the organization's period, compared with another of its periods when one is given. The Mantle service checks the
// organization and that both periods are its own.
function statement(parameters) {
    const scope = lib.access(parameters, ledgerReaders)
    const organizationPartyId = scope.organizationPartyId
    if (!organizationPartyId) throw new Error("ORGANIZATION_REQUIRED: Choose an internal organization")
    if (parameters.statement === "accountBalance") return accountBalance(parameters, organizationPartyId)
    const shape = statements[parameters.statement]
    if (!shape) throw new Error("Unknown statement " + parameters.statement)
    const timePeriodId = parameters.timePeriodId || currentPeriod(organizationPartyId)
    if (!timePeriodId) throw new Error("PERIOD_REQUIRED: Choose a fiscal period")
    const periods = [timePeriodId, parameters.compareTimePeriodId || null]
    const report = policy.call(ledger(services[parameters.statement]), {
        organizationPartyId,
        timePeriodIdList: periods.filter(Boolean)
    })
    return {
        statementRows: shape(report, periods).map(row => Object.assign(row, {currencyUomId: report.currencyUomId})),
        organizationPartyId,
        timePeriodId,
        periodName: periodName(timePeriodId),
        compareTimePeriodId: periods[1],
        comparePeriodName: periodName(periods[1]),
        currencyUomId: report.currencyUomId,
        asOf: report.asOf,
        complete: report.complete,
        incompleteReasons: lib.array(report.incompleteReasons)
    }
}
// Account balances: each month of the fiscal year holding the period chosen (the current one by default), with the
// assets, liabilities and equity at its end and its revenue and expenses (get#PeriodSeriesSummary).
function accountBalance(parameters, organizationPartyId) {
    const chosen = parameters.timePeriodId || currentPeriod(organizationPartyId)
    if (!chosen) throw new Error("PERIOD_REQUIRED: Choose a fiscal period")
    let year = policy.one("mantle.party.time.TimePeriod", {timePeriodId: chosen})
    for (let depth = 0; year && year.timePeriodTypeId !== "FiscalYear" && year.parentPeriodId && depth < 5; depth++)
        year = policy.one("mantle.party.time.TimePeriod", {timePeriodId: year.parentPeriodId})
    // the organization's own year or that of an organization it rolls up to, whose periods it books in
    if (!year || !policy.organizationChain(organizationPartyId).includes(year.partyId))
        throw new Error("PERIOD_UNAVAILABLE: Choose a fiscal period of this organization")
    let months = policy
        .rows("mantle.party.time.TimePeriod", {partyId: year.partyId, timePeriodTypeId: "FiscalMonth"})
        .filter(row => ms(row.fromDate) >= ms(year.fromDate) && ms(row.thruDate) <= ms(year.thruDate))
        .sort((a, b) => ms(a.fromDate) - ms(b.fromDate))
    if (year.timePeriodTypeId !== "FiscalYear") months = [year]
    if (!months.length) months = [year]
    const series = policy.call(ledger("get#PeriodSeriesSummary"), {
        organizationPartyId,
        timePeriodGroups: months.map(row => [row.timePeriodId]),
        datasets: [
            {datasetId: "assets", classes: ["ASSET"], totalBasis: "Ending"},
            {datasetId: "liabilities", classes: ["LIABILITY"], totalBasis: "Ending"},
            {datasetId: "equity", classes: ["EQUITY"], totalBasis: "Ending"},
            {datasetId: "revenue", classes: ["REVENUE", "INCOME"]},
            {datasetId: "expenses", classes: ["COST_OF_SALES", "EXPENSE", "NON_OP_EXPENSE"]}
        ]
    })
    const data = id => lib.array(series.datasetsById?.[id]?.data)
    const currencyUomId = policy.preference(organizationPartyId).baseCurrencyUomId
    const balanceRows = months.map((month, index) => {
        const revenue = toDecimal(data("revenue")[index] ?? 0),
            expenses = toDecimal(data("expenses")[index] ?? 0)
        return {
            rowType: "period",
            currencyUomId,
            timePeriodId: month.timePeriodId,
            label: month.periodName || month.timePeriodId,
            assets: toDecimal(data("assets")[index] ?? 0),
            liabilities: toDecimal(data("liabilities")[index] ?? 0),
            equity: toDecimal(data("equity")[index] ?? 0),
            revenue,
            expenses,
            netIncome: revenue.subtract(expenses)
        }
    })
    return {
        statementRows: balanceRows,
        organizationPartyId,
        timePeriodId: chosen,
        periodName: year.periodName || year.timePeriodId,
        compareTimePeriodId: null,
        comparePeriodName: "",
        currencyUomId,
        asOf: series.asOf,
        complete: series.complete,
        incompleteReasons: lib.array(series.incompleteReasons)
    }
}
const ms = value => policy.ms(value)

const operations = {catalog, openReport, statement}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Accounting report operation " + op)
        return operations[op](parameters)
    }
})
