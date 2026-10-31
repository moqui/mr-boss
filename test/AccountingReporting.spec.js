// The Accounting reports (design-accounting §13, AC-12) over the demo organization: the catalog per role and its quick
// options, each statement and analysis report run, drilled to its source, printed with the rows it shows; a reader of
// one organization refused another's balances through every report; and Home's money cards and the user's work. The
// rules are mr-mantle's AccountingStatements spec.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
const as = (user, run) => helper().asUser(user, run)
const org = "BOSS_ACCT_ORG"
const foreign = "ORG_ZIZI_SERVICES"
// The labels of a statement's rows, as its screen lists them.
const labels = rows => rows.map(row => String(row.label).trim())
// A report page under the web root, where its links to other apps' paths resolve.
const webPage = (path, parameters) =>
    String(
        ec.screen
            .makeTest()
            .rootScreen("component://webroot/screen/webroot.xml")
            .renderMode("html")
            .render("apps/Accounting/" + path, parameters, null).output || ""
    )
// Page text with the entities a label may be escaped to put back.
const text = output => output.replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("the catalog lists the reports a role may run; quick options open only those", {
    when() {
        const run = user =>
            as(user, () => ({
                reports: helper()
                    .call("ironstone.accounting.ReportServices.get#Catalog", {organizationPartyId: org})
                    .reports.map(row => row.reportId),
                refused: helper().refusal("ironstone.accounting.ReportServices.check#ReportChoice", {
                    organizationPartyId: org,
                    reportId: "BalanceSheet"
                })
            }))
        return {reader: run("finance.read"), ar: run("finance.ar")}
    },
    then({reader, ar}) {
        reader.reports.length == 15
        reader.reports.includes("SalesAnalysis")
        reader.refused == ""
        ar.reports.join(",") == "Aging"
        ar.refused.includes("REPORT_UNAVAILABLE")
    }
})

feature("each statement of the demo organization runs with its as-of time, and its print shows the same rows", {
    where: [
        {statement: "balanceSheet", screen: "BalanceSheet", line: "Total assets"},
        {statement: "incomeStatement", screen: "IncomeStatement", line: "Net income"},
        {statement: "cashFlow", screen: "CashFlow", line: "Net change in cash"},
        {statement: "retainedEarnings", screen: "RetainedEarnings", line: "Retained earnings at the end"},
        {statement: "financialRatios", screen: "FinancialRatios", line: "Current ratio"},
        {statement: "accountBalance", screen: "AccountBalance", line: null}
    ],
    when({statement, screen}) {
        return as("finance.read", () => {
            const report = helper().call("ironstone.accounting.ReportServices.get#Statement", {organizationPartyId: org, statement})
            const options = {organizationPartyId: org, timePeriodId: report.timePeriodId}
            return {
                report,
                html: helper().page("Reports/" + screen, options, "html"),
                print: helper().page("Reports/" + screen, options, "html-print")
            }
        })
    },
    then({line, report, html, print}) {
        report.asOf != null
        report.statementRows.length > 0
        line == null || labels(report.statementRows).includes(line)
        html.errors == []
        print.errors == []
        labels(report.statementRows).every(label => text(html.output).includes(label) && text(print.output).includes(label))
    }
})

feature("a balance sheet account opens the general ledger with the report's organization, period and currency", {
    when() {
        return as("finance.read", () => {
            const report = helper().call("ironstone.accounting.ReportServices.get#Statement", {
                organizationPartyId: org,
                statement: "balanceSheet"
            })
            const page = webPage("Reports/BalanceSheet", {organizationPartyId: org, timePeriodId: report.timePeriodId})
            const account = report.statementRows.find(row => row.glAccountId)
            return {report, account, link: text((page.match(/href="([^"]*Reports\/GeneralLedger\?[^"]*glAccountId=[^"]*)"/) || [])[1] || "")}
        })
    },
    then({report, account, link}) {
        account != null
        link.includes("organizationPartyId=" + org)
        link.includes("timePeriodId=" + report.timePeriodId)
        link.includes("glAccountId=")
        link.includes("amountUomId=" + report.currencyUomId)
    }
})

feature("the partner ledger, posted amounts and sales analysis run for the demo organization and link their sources", {
    when() {
        return as("finance.read", () => ({
            partners: helper().page("Reports/PartnerLedger", {organizationPartyId: org}, "html"),
            partnerLinks: webPage("Reports/PartnerLedger", {organizationPartyId: org}),
            posted: helper().page("Reports/PostedSummary", {organizationPartyId: org}, "html"),
            postedPrint: helper().page("Reports/PostedSummary", {organizationPartyId: org}, "html-print"),
            sales: helper().page("Reports/SalesAnalysis", {organizationPartyId: org, groupBy: "customer"}, "html"),
            ledger: helper().call("mantle.ledger.LedgerReportServices.run#PartnerLedger", {organizationPartyId: org})
        }))
    },
    then({partners, partnerLinks, posted, postedPrint, sales, ledger}) {
        partners.errors == []
        ledger.complete == true
        ledger.partyRows.length > 0
        partners.output.includes("Opening balance")
        /Receivables\/InvoiceDetail[^"]*recordId=/.test(partnerLinks)
        posted.errors == []
        postedPrint.errors == []
        posted.output.includes("Reports/GeneralLedger")
        postedPrint.output.includes("Accounts Receivable")
        sales.errors == []
        sales.output.includes("Net invoiced")
    }
})

feature("a reader of one organization sees no other organization's balances through any report", {
    when() {
        return as("finance.read", () => {
            const refused = (service, parameters) => helper().refusal(service, Object.assign({organizationPartyId: foreign}, parameters))
            return {
                statement: refused("ironstone.accounting.ReportServices.get#Statement", {statement: "balanceSheet"}),
                partners: refused("mantle.ledger.LedgerReportServices.run#PartnerLedger", {}),
                posted: refused("mantle.ledger.LedgerReportServices.run#PostedAmountSummary", {}),
                sales: refused("mantle.sales.SalesReportServices.run#SalesAnalysis", {}),
                trial: refused("mantle.ledger.FinanceReportServices.run#TrialBalance", {}),
                page: helper().page("Reports/BalanceSheet", {organizationPartyId: foreign}, "html")
            }
        })
    },
    then({statement, partners, posted, sales, trial, page}) {
        statement.includes("ORGANIZATION_DENIED") || statement.includes("not available")
        partners.includes("ORGANIZATION_DENIED")
        posted.includes("ORGANIZATION_DENIED")
        sales.includes("ORGANIZATION_DENIED")
        trial.includes("ORGANIZATION_DENIED")
        !page.output.includes("Total assets")
    }
})

feature("Home shows the money cards and the work waiting for the user", {
    when() {
        return {
            admin: as("finance.admin", () => helper().call("ironstone.accounting.HomeServices.get#Summary", {organizationPartyId: org})),
            page: as("finance.admin", () => helper().page("Home", {}, "html")),
            reader: as("finance.read", () => helper().page("Home", {}, "html"))
        }
    },
    then({admin, page, reader}) {
        admin.summary.arDue != null
        admin.summary.apDue != null
        admin.summary.bankBalance != null
        admin.summary.unpostedDocuments != null
        admin.workRows.some(row => row.title == "Bills awaiting approval")
        page.errors == []
        page.output.includes("Receivables due")
        page.output.includes("Your work")
        reader.errors == []
        reader.output.includes("Payables due")
        !reader.output.includes("Unposted documents this year")
    }
})
