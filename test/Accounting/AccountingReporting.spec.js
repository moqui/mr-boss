// The Accounting reports (design-accounting §13, AC-12) over the demo organization: the catalog per role and its quick
// options, each statement and analysis report run, drilled to its source, printed with the rows it shows; a reader of
// one organization refused another's balances through every report; and Home's money cards and the user's work. The
// rules are mr-mantle's AccountingStatements spec.
const helper = () => ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
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
                print: helper().page("Reports/" + screen, options, "html-print"),
                csv: helper().page("Reports/" + screen, Object.assign({pageNoLimit: "true"}, options), "csv")
            }
        })
    },
    then({line, report, html, print, csv}) {
        report.asOf != null
        report.statementRows.length > 0
        line == null || labels(report.statementRows).includes(line)
        html.errors == []
        print.errors == []
        labels(report.statementRows).every(label => text(html.output).includes(label) && text(print.output).includes(label))
        // the print names what it covers instead of printing the options form (ACC-UI-011)
        !text(print.output).includes("Compare with") && text(print.output).includes("Accounting Demo Company")
        // the export carries the rows the screen shows
        labels(report.statementRows).every(label => csv.output.includes(label))
    }
})

// ACC-UI-011: the trial balance's print has the ledger reports' caption in place of their options form
feature("the trial balance prints its organization by name and its period, without the options form", {
    when() {
        return as("finance.read", () => {
            const report = helper().call("ironstone.accounting.ReportServices.get#Statement", {organizationPartyId: org, statement: "balanceSheet"})
            return helper().page("Reports/TrialBalance", {organizationPartyId: org, timePeriodId: report.timePeriodId}, "html-print")
        })
    },
    then({errors, output}) {
        errors == []
        !text(output).includes("Compare from") && !output.includes(">Print<")
        text(output).includes("Accounting Demo Company")
    }
})

// ACC-UI-029: an account opened from the general ledger goes back to the report as it was run, not narrowed to the account
// (the drill carries the row's account as glAccountId, which AccountDetail declares)
feature("an account's Back to report keeps the report's own account filter, not the account opened", {
    when() {
        // from the webroot, as a request is, so the link's //Accounting path resolves
        return as("finance.read", () => {
            const out = ec.screen
                .makeTest()
                .rootScreen("component://webroot/screen/webroot.xml")
                .renderMode("html")
                .render(
                    "apps/Accounting/GeneralLedger/AccountDetail",
                    {
                        organizationPartyId: org,
                        recordId: "111100000",
                        glAccountId: "111100000",
                        reportReturn: "GeneralLedger",
                        fromDate: "2026-10-01"
                    },
                    null
                )
            const output = String(out.output || "")
            // the Back to report link itself (Open account ledger rightly names the account)
            const anchor = output.slice(output.lastIndexOf("<a ", output.indexOf("Back to report")), output.indexOf("Back to report"))
            return {errors: Array.from(out.errorMessages || []), backLink: anchor}
        })
    },
    then({errors, backLink}) {
        errors == []
        backLink.includes("Reports/GeneralLedger") && backLink.includes("fromDate=2026-10-01")
        !backLink.includes("glAccountId=111100000")
    }
})

// ACC-UI-030: with a comparison, the export is one list under one header, each row naming its period
feature("the general ledger's export with a comparison is one list with one header, each row naming its period", {
    when() {
        const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
        const monthStart = today.slice(0, 8) + "01"
        const options = {organizationPartyId: org, fromDate: monthStart, thruDate: today, compareFromDate: "2000-01-01", compareThruDate: today}
        const csv = as("finance.read", () => helper().page("Reports/GeneralLedger", Object.assign({pageNoLimit: "true"}, options), "csv"))
        return {csv: csv.output, errors: csv.errors, primary: monthStart + " to " + today, comparison: "2000-01-01 to " + today}
    },
    then({csv, errors, primary, comparison}) {
        errors == []
        csv.split("\n")[0].includes("Period")
        csv.split("\n").filter(line => line === csv.split("\n")[0]).length == 1
        csv.includes(primary)
        csv.includes(comparison)
        csv.lastIndexOf(primary) < csv.indexOf(comparison)
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
        // Sales' report mounted under Accounting (impl-sales P19): a report reader is shown the finance columns
        sales.output.includes("Cost of shipped")
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
            zone: as("finance.admin", () => String(ec.user.timeZone || "")),
            page: as("finance.admin", () => helper().page("Home", {}, "html")),
            reader: as("finance.read", () => helper().page("Home", {}, "html"))
        }
    },
    then({admin, zone, page, reader}) {
        admin.summary.arDue != null
        admin.summary.apDue != null
        admin.summary.bankBalance != null
        admin.summary.unpostedDocuments != null
        // the as-of time names its zone (ACC-UI-002)
        zone != "" && admin.summary.asOf.endsWith(" " + zone)
        admin.workRows.some(row => row.title == "Bills awaiting approval")
        page.errors == []
        page.output.includes("Receivables due")
        page.output.includes("Your work")
        reader.errors == []
        reader.output.includes("Payables due")
        !reader.output.includes("Unposted documents this year")
    }
})

feature("the cash flow's net change in cash is the change of the cash accounts (F336)", {
    when() {
        const fixtures = ec.resource.script("component://mr-mantle/test/ledger/AccountingReceivablesFixtures.js")
        login("john.doe")
        ec.artifactExecution.disableAuthz()
        const f = fixtures.fixtures("BOSS_CASHFLOW")
        const acctgTransId = fixtures.call("mantle.ledger.LedgerServices.create#AcctgTrans", {
            organizationPartyId: f.org,
            amountUomId: "USD",
            acctgTransTypeEnumId: "AttInternal"
        }).acctgTransId
        for (const [glAccountId, debitCreditFlag] of [
            ["111100000", "D"],
            ["331100000", "C"]
        ])
            fixtures.call("mantle.ledger.LedgerServices.create#AcctgTransEntry", {acctgTransId, glAccountId, debitCreditFlag, amount: 1000})
        fixtures.call("mantle.ledger.LedgerServices.post#AcctgTrans", {acctgTransId})
        login(f.users.read)
        const report = ec.service
            .sync()
            .name("ironstone.accounting.ReportServices.get#Statement")
            .parameters({organizationPartyId: f.org, statement: "cashFlow"})
            .disableAuthz()
            .throwOnError(true)
            .call()
        login("john.doe")
        const amount = label => report.statementRows.find(row => String(row.label).trim() == label)?.amount?.toNumber()
        return {
            change: amount("Net change in cash"),
            operating: amount("Net cash from operating activities"),
            financing: amount("Net cash from financing activities"),
            cashRows: report.statementRows.filter(row => String(row.label).includes("Cash and Equivalent")).length
        }
    },
    then({change, operating, financing, cashRows}) {
        change == 1000
        operating == 0
        financing == 1000
        cashRows == 0
    }
})
