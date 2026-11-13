// Accounting's payroll-origin projection (design-accounting AC-23 and ExpensePosting's payroll paragraph, design-people §8.3; built by
// impl-people P27 as an owner contract): a payroll-origin invoice (one a pay run's finalization made: a PayrollObligation names it)
// is a reader of payroll's (PAYROLL_VIEW on top of the finance group). A finance user without it finds no such invoice in the bills
// list, the palette or a bill's read, and sees the open payables' aging with the payroll invoices folded into one "Payroll" row
// whose totals reconcile; a finance user who holds it, with the same parameters, finds the invoice and its person. The projection's
// rules are Mantle's (test/humanres/PayObligations); this checks the Accounting app's services over it. The payroll invoice and its
// obligation are made as data (only their link matters here). Run: ./moq test mr-boss --spec AccountingPayrollOrigin
const lib = () => ec.resource.script("component://mr-boss/test/Accounting/AccountingSpecLib.js")
const org = "BOSS_ACCT_ORG"
const prefix = "BOSS_ACCT_PPO"
const invoiceId = prefix + "_NETPAY"
const employee = prefix + "_EMPLOYEE"
// a spec-local finance user like finance.ap who also reads payroll
const holder = prefix + "_HOLDER"

function system(action) {
    const disabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!disabled) ec.artifactExecution.enableAuthz()
    }
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            call("create#mantle.party.Party", {partyId: employee, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: employee, firstName: "Payroll", lastName: "Origin"})
            call("create#mantle.humanres.payroll.PayrollRun", {
                payrollRunId: prefix + "_RUN",
                organizationPartyId: org,
                currencyUomId: "USD",
                runKindEnumId: "PrkRegular",
                statusId: "PrnFinalized"
            })
            call("create#mantle.account.invoice.Invoice", {
                invoiceId,
                invoiceTypeEnumId: "InvoicePayroll",
                fromPartyId: employee,
                toPartyId: org,
                statusId: "InvoiceIncoming",
                invoiceDate: ec.user.nowTimestamp,
                accountingDate: ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd"),
                dueDate: ec.user.nowTimestamp,
                currencyUomId: "USD",
                description: "Pay of the month"
            })
            call("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId,
                itemTypeEnumId: "ItemPayrollIncome",
                overrideGlAccountId: "631100000",
                quantity: "1",
                amount: "1000",
                description: "Salary"
            })
            // approved, so it is open in the payables aging
            call("update#mantle.account.invoice.Invoice", {invoiceId, statusId: "InvoiceReceived"})
            call("update#mantle.account.invoice.Invoice", {invoiceId, statusId: "InvoiceApproved"})
            call("create#mantle.humanres.payroll.PayrollObligation", {
                obligationKey: "NET:" + prefix,
                obligationKindEnumId: "PokNetPay",
                payrollRunId: prefix + "_RUN",
                organizationPartyId: org,
                partyId: employee,
                payeePartyId: employee,
                currencyUomId: "USD",
                invoiceId,
                amount: "1000"
            })
            call("create#moqui.security.UserGroup", {userGroupId: holder, description: "Accounting spec: payroll finance"})
            call("create#moqui.security.UserGroupPermission", {
                userGroupId: holder,
                userPermissionId: "PAYROLL_VIEW",
                fromDate: 0
            })
            call("create#mantle.party.Party", {partyId: holder, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: holder, firstName: "Finance", lastName: "Payroll"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: holder,
                toPartyId: org,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: holder,
                username: "finance.payroll.spec",
                partyId: holder,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA",
                currencyUomId: "USD"
            })
            for (const userGroupId of ["BOSS_ACCOUNTING", "BOSS_ACCOUNTING_AP", holder])
                call("create#moqui.security.UserGroupMember", {userId: holder, userGroupId, fromDate: 0})
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        system(() =>
            ec.entity
                .find("moqui.security.UserGroupMember")
                .condition("userId", holder)
                .updateAll({thruDate: ec.user.nowTimestamp})
        )
    }
})

feature(
    "a finance user without PAYROLL_VIEW finds no payroll invoice and sees its aggregate; one with it, with the same parameters, finds it",
    {
        when() {
            // the same calls for both users
            const read = username =>
                lib().asUser(username, () => ({
                    bills: lib().call("ironstone.accounting.PayableScreenServices.find#Bills", {
                        organizationPartyId: org,
                        queue: "all",
                        text: invoiceId
                    }),
                    palette: lib().call("ironstone.accounting.AccessServices.search#Records", {
                        organizationPartyId: org,
                        text: invoiceId,
                        limit: 20
                    }),
                    detail: lib().refusal("mantle.account.InvoiceServices.get#InvoiceFinanceDetail", {
                        invoiceId,
                        organizationPartyId: org
                    }),
                    aging: lib().call("mantle.ledger.LedgerReportServices.run#Aging", {
                        organizationPartyId: org,
                        invoiceType: "payable",
                        currencyUomId: "USD"
                    })
                }))
            return {finance: read("finance.ap"), payroll: read("finance.payroll.spec")}
        },
        then({finance, payroll}) {
            // without PAYROLL_VIEW: missing from the list, the palette and a read; one "Payroll" row in the aging, which reconciles
            !finance.bills.records.some(row => row.invoiceId == invoiceId)
            !finance.palette.rows.some(row => String(row.url).includes(invoiceId))
            finance.detail.includes("INVOICE_UNAVAILABLE")
            finance.aging.agingRows.some(row => row.partyId == "_PAYROLL_" && row.partyName == "Payroll")
            !finance.aging.agingRows.some(row => row.partyId == employee)
            String(finance.aging.totals[0].total) == String(payroll.aging.totals[0].total)
            // with it: the invoice and its person
            payroll.bills.records.some(row => row.invoiceId == invoiceId)
            payroll.palette.rows.some(row => String(row.url).includes(invoiceId))
            payroll.detail == ""
            payroll.aging.agingRows.some(row => row.partyId == employee)
            !payroll.aging.agingRows.some(row => row.partyId == "_PAYROLL_")
        }
    }
)
