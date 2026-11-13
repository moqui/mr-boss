// People P15's "usable when" (impl-people P15; design-people §9, §14.3 "Expense reimbursement and advances", its accounts payable
// half), as an acceptance walk with artifact authorization on, through the screens' transitions: Tomas (people.employee) asks an
// advance, which Hannah (people.manager) approves, making it a bill finance (finance.admin) approves for payment in Accounting's
// Expense posting and a payment run pays (the run's check stands in, applied as a run applies it; the user's call of Nov 12,
// 2026); on his phone he
// makes a claim, adds an expense with a photo of its receipt (and one from a receipt's text read and reviewed), and submits it;
// Hannah approves it from Approvals, which leaves it with finance; finance approves it for payment in Expense posting and applies
// the advance to it; People shows the advance settled and what is left to reimburse. The rules themselves are Mantle's
// ExpenseClaims and mr-boss's PeopleExpenses. The payroll route is P27's.
// Run: ./moq accept mr-boss --spec PeopleExpensesUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const E = "mantle.humanres.ExpenseServices."
const webroot = "component://webroot/screen/webroot.xml"
const finance = "finance.admin"
// a request under the web root as the user (a transition's post, a page), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .header("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
            .render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const claimRow = invoiceId =>
    system(() => ec.entity.find("mantle.humanres.expense.ExpenseClaim").condition("invoiceId", invoiceId).one())
const invoiceRow = invoiceId =>
    system(() => ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", invoiceId).one())
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "Tomas asks an advance; Hannah approves it from Approvals; finance approves its bill in Expense posting and a run pays it",
    {
        when() {
            const out = {}
            out.asked = request(
                users.employee,
                "apps/People/Expenses/EmployeeAdvances/requestAdvance",
                {purpose: "Trade fair stand", amount: "40", operationKey: "PPL_ACCEPT_ADVANCE"},
                "post"
            ).errors
            const mine = read(users.employee, E + "find#Advances", {mine: true}).advances || []
            state.advance = mine.find(row => row.purpose === "Trade fair stand")?.employeeAdvanceId
            out.approvals = request(users.manager, "apps/People/Approvals", {lastStandalone: "-2"})
            const notice = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("moqui.security.user.NotificationMessage")
                            .condition({topic: "PeopleAdvanceApproval", recordId: state.advance})
                            .list()
                    )[0]
            )
            out.approved = read(users.manager, "org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                notificationMessageId: notice?.notificationMessageId
            })
            out.queue = request(finance, "apps/Accounting/Payables/ExpensePosting", {
                organizationPartyId: ids.organizationId,
                view: "advances",
                lastStandalone: "-2"
            })
            const bill = system(
                () =>
                    ec.entity.find("mantle.humanres.expense.EmployeeAdvance").condition("employeeAdvanceId", state.advance).one()
                        ?.invoiceId
            )
            out.billQueue = request(finance, "apps/Accounting/Payables/ExpensePosting", {
                organizationPartyId: ids.organizationId,
                lastStandalone: "-2"
            })
            out.paid = request(
                finance,
                "apps/Accounting/Payables/ExpensePosting/approveExpense",
                {organizationPartyId: ids.organizationId, invoiceId: bill, lastUpdatedStamp: invoiceRow(bill).lastUpdatedStamp},
                "post"
            ).errors
            // the payment run's check to Tomas, delivered and applied to the bill as a run's paySupplier does
            system(() => {
                const payment = invoke("mantle.account.PaymentServices.create#Payment", {
                    paymentTypeEnumId: "PtInvoicePayment",
                    fromPartyId: ids.organizationId,
                    toPartyId: ids.employeePartyId,
                    amount: "40",
                    amountUomId: invoiceRow(bill).currencyUomId,
                    paymentInstrumentEnumId: "PiCompanyCheck",
                    statusId: "PmntDelivered",
                    effectiveDate: ec.user.nowTimestamp
                })
                invoke("mantle.account.PaymentServices.apply#InvoicePayment", {paymentId: payment.paymentId, invoiceId: bill})
            })
            out.bill = bill
            out.after = (read(users.employee, E + "find#Advances", {mine: true}).advances || []).find(
                row => row.employeeAdvanceId === state.advance
            )
            return out
        },
        then({asked, approvals, queue, billQueue, bill, paid, after}) {
            asked == "" && state.advance
            approvals.status == 200 && approvals.errors == ""
            queue.status == 200 && queue.errors == "" && queue.output.includes(state.advance)
            bill && billQueue.status == 200 && billQueue.output.includes(bill)
            paid == "" && after.stageText == "Paid: outstanding" && after.outstanding.compare(40) == 0
        }
    }
)

feature("Tomas makes a claim on his phone, adds an expense with its receipt photo and one read from a receipt, and submits it", {
    when() {
        const out = {}
        out.made = request(
            users.employee,
            "apps/People/Expenses/ExpenseClaims/createClaim",
            {ncPurpose: "Trade fair", operationKey: "PPL_ACCEPT_CLAIM"},
            "post"
        ).errors
        state.claim = (read(users.employee, E + "find#Claims", {mine: true}).claims || []).find(
            row => row.purpose === "Trade fair"
        )?.invoiceId
        out.page = request(users.employee, "apps/People/Expenses/ExpenseClaimDetail", {
            invoiceId: state.claim,
            lastStandalone: "-2"
        })
        // the expense with its receipt photo: the claim's line through Mantle (a spec cannot post a file through the screen)
        out.line = read(users.employee, E + "store#ClaimItem", {
            invoiceId: state.claim,
            itemTypeEnumId: "ItemExpTravLodging",
            description: "Hotel near the fair",
            itemDate: ec.user.nowTimestamp,
            amount: "80",
            merchantName: "Fair Hotel"
        }).invoiceItemSeqId
        // Read receipt on a typed receipt: proposes values (or says reading is not available), saving nothing
        out.read = request(
            users.employee,
            "apps/People/Expenses/ExpenseClaimDetail/readReceipt",
            {invoiceId: state.claim, receiptText: "City Taxi, total 20.00 USD"},
            "post"
        ).errors
        out.second = request(
            users.employee,
            "apps/People/Expenses/ExpenseClaimDetail/saveLine",
            {
                invoiceId: state.claim,
                itemTypeEnumId: "ItemExpTravLocal",
                description: "Taxi to the fair",
                amount: "20",
                merchantName: "City Taxi"
            },
            "post"
        ).errors
        out.submitted = request(
            users.employee,
            "apps/People/Expenses/ExpenseClaimDetail/submitClaim",
            {invoiceId: state.claim},
            "post"
        ).errors
        return out
    },
    then({made, page, line, read, second, submitted}) {
        made == "" && state.claim
        page.status == 200 && page.errors == "" && page.output.includes("Trade fair")
        line && read == "" && second == ""
        submitted == "" && claimRow(state.claim).statusEnumId == "EcsSubmitted"
        invoiceRow(state.claim).statusId == "InvoiceReceived"
    }
})

feature(
    "Hannah approves the claim from Approvals, leaving it with finance; finance approves it in Expense posting and applies the advance; People shows what is left",
    {
        when() {
            const out = {}
            const notice = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("moqui.security.user.NotificationMessage")
                            .condition({topic: "PeopleExpenseApproval", recordId: state.claim})
                            .list()
                    )[0]
            )
            out.approved = read(users.manager, "org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                notificationMessageId: notice?.notificationMessageId
            })
            out.businessOnly = invoiceRow(state.claim).statusId
            out.queue = request(finance, "apps/Accounting/Payables/ExpensePosting", {
                organizationPartyId: ids.organizationId,
                lastStandalone: "-2"
            })
            out.financeApproved = request(
                finance,
                "apps/Accounting/Payables/ExpensePosting/approveExpense",
                {
                    organizationPartyId: ids.organizationId,
                    invoiceId: state.claim,
                    lastUpdatedStamp: invoiceRow(state.claim).lastUpdatedStamp
                },
                "post"
            ).errors
            out.applied = request(
                finance,
                "apps/Accounting/Payables/ExpensePosting/applyAdvance",
                {organizationPartyId: ids.organizationId, employeeAdvanceId: state.advance, invoiceId: state.claim},
                "post"
            ).errors
            out.claim = read(users.employee, E + "get#Claim", {invoiceId: state.claim})
            out.advance = (read(users.employee, E + "find#Advances", {mine: true}).advances || []).find(
                row => row.employeeAdvanceId === state.advance
            )
            out.advancesPage = request(users.employee, "apps/People/Expenses/EmployeeAdvances", {
                show: "mine",
                lastStandalone: "-2"
            })
            return out
        },
        then({businessOnly, queue, financeApproved, applied, claim, advance, advancesPage}) {
            businessOnly == "InvoiceReceived" && claimRow(state.claim).statusEnumId == "EcsApproved"
            queue.status == 200 && queue.errors == "" && queue.output.includes(state.claim)
            financeApproved == "" && invoiceRow(state.claim).statusId == "InvoiceApproved"
            applied == ""
            // 100 claimed, the 40 advance applied: 60 left to reimburse, the advance settled
            claim.claim.unpaidTotal.compare(60) == 0 && claim.payments.some(row => row.employeeAdvanceId == state.advance)
            advance.stageText == "Settled" && advance.outstanding.compare(0) == 0
            advancesPage.status == 200 && advancesPage.output.includes("Settled")
        }
    }
)
