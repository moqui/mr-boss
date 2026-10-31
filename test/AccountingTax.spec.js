// The Tax screens (design-accounting §11) over the demo's Utah sales tax: authorities and rates with their state, the
// simulation, a sales tax statement made from the taxed demo invoice with its lines, and the 1099 run's failures. The
// Tax area is the tax users' and finance administrators'.
const helper = () => ec.resource.script("component://mr-boss/test/AccountingSpecLib.js")
let statementId
// The demo organization's fiscal period of a type containing today, read as the spec's administrator.
function period(timePeriodTypeId) {
    const disabled = ec.artifactExecution.disableAuthz()
    try {
        return helper().call("mantle.ledger.LedgerServices.get#OrganizationFiscalTimePeriods", {
            organizationPartyId: "BOSS_ACCT_ORG",
            filterDate: ec.user.nowTimestamp,
            timePeriodTypeId
        }).timePeriodList[0].timePeriodId
    } finally {
        if (!disabled) ec.artifactExecution.enableAuthz()
    }
}
spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    }
})
feature("the demo invoice to a Utah customer has its tax line at the authority's rate version", {
    when() {
        const disabled = ec.artifactExecution.disableAuthz()
        try {
            return {
                lines: Array.from(
                    ec.entity
                        .find("mantle.account.invoice.InvoiceItem")
                        .condition({invoiceId: "BOSS_ACCT_TAXED", itemTypeEnumId: "ItemSalesTax"})
                        .list()
                ),
                invoice: ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", "BOSS_ACCT_TAXED").one()
            }
        } finally {
            if (!disabled) ec.artifactExecution.enableAuthz()
        }
    },
    then({lines, invoice}) {
        invoice.statusId == "InvoiceFinalized"
        lines.length == 1
        lines[0].taxAuthorityRateId == "BOSS_ACCT_UT_2020"
        toDecimal(lines[0].amount).eq(toDecimal("18.3"))
    }
})
feature("a finance administrator sees the authorities and rates with their actions; a tax user reads them", {
    when() {
        const admin = helper().asUser("finance.admin", () => ({
            authorities: helper().page("Tax/TaxAuthorities", {}, "html"),
            rates: helper().page("Tax/TaxRates", {}, "html")
        }))
        const tax = helper().asUser("finance.tax", () => ({
            authorities: helper().page("Tax/TaxAuthorities", {}, "html"),
            rates: helper().page("Tax/TaxRates", {}, "html")
        }))
        return {admin, tax}
    },
    then({admin, tax}) {
        admin.authorities.errors == []
        admin.authorities.output.includes("Utah sales tax")
        admin.authorities.output.includes("12345678-002-STC")
        admin.authorities.output.includes("Add authority")
        admin.rates.errors == []
        admin.rates.output.includes("6.1%")
        admin.rates.output.includes("Add rate")
        admin.rates.output.includes("New version")
        tax.authorities.errors == []
        tax.authorities.output.includes("Utah sales tax")
        !tax.authorities.output.includes("Add authority")
        tax.rates.errors == []
        !tax.rates.output.includes("New version")
    }
})
feature("the simulation explains a Utah sale's rate, base and rounding", {
    when() {
        return helper().asUser("finance.tax", () =>
            helper().page("Tax/TaxRates", {simulate: "Y", destinationGeoId: "USA_UT", amount: "33.33"}, "html")
        )
    },
    then(page) {
        page.errors == []
        page.output.includes("Simulated tax")
        page.output.includes("Utah sales tax")
        page.output.includes("2.03")
    }
})
feature("a tax user makes a sales tax statement for the month and sees its invoice lines", {
    when() {
        const month = period("FiscalMonth")
        return helper().asUser("finance.tax", () => {
            const periods = helper().call("ironstone.accounting.AccessServices.get#Choices", {
                organizationPartyId: "BOSS_ACCT_ORG",
                choice: "taxPeriods",
                term: ""
            }).options
            statementId = helper().call("mantle.other.TaxServices.create#SalesTaxStatement", {
                organizationPartyId: "BOSS_ACCT_ORG",
                taxAuthorityId: "BOSS_ACCT_UT",
                timePeriodId: month
            }).taxStatementId
            return {
                periods,
                month,
                list: helper().page("Tax/TaxStatements", {}, "html"),
                detail: helper().page("Tax/TaxStatementDetail", {taxStatementId: statementId}, "html"),
                tui: helper().page("Tax/TaxStatementDetail", {taxStatementId: statementId}, "tui")
            }
        })
    },
    then({periods, month, list, detail, tui}) {
        periods.some(option => option.value == month)
        list.errors == []
        list.output.includes(statementId)
        list.output.includes("Sales tax")
        detail.errors == []
        detail.output.includes("BOSS_ACCT_TAXED")
        detail.output.includes("Wasatch Outfitters")
        detail.output.includes("Export")
        detail.output.includes("Not exported")
        tui.errors == []
        tui.output.includes("BOSS_ACCT_TAXED")
    }
})
feature("the 1099 run names the vendor without a taxpayer number and makes the other's data", {
    when() {
        const year = period("FiscalYear")
        return helper().asUser("finance.tax", () => {
            const run = helper().call("mantle.other.TaxServices.run#Vendor1099Statements", {
                organizationPartyId: "BOSS_ACCT_ORG",
                timePeriodId: year
            })
            const made = run.created.find(row => row.partyId == "BOSS_ACCT_1099_VENDOR")
            return {
                run,
                detail: made ? helper().page("Tax/TaxStatementDetail", {taxStatementId: made.taxStatementId}, "html") : null
            }
        })
    },
    then({run, detail}) {
        run.created.some(row => row.partyId == "BOSS_ACCT_1099_VENDOR")
        run.failures.some(row => row.partyId == "BOSS_ACCT_1099_NOTIN" && row.reasonCode == "TIN_MISSING")
        detail.errors == []
        detail.output.includes("1099-MISC")
        detail.output.includes("750.00")
    }
})
feature("an AR user is refused the Tax screens", {
    when() {
        return helper().asUser("finance.ar", () => helper().page("Tax/TaxStatements", {}, "html"))
    },
    then(page) {
        !page.output.includes("New sales tax statement")
    }
})
