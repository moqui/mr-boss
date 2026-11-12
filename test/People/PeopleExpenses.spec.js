// People's expense claims and advances screens (impl-people P15; design-people §9 ExpenseClaims, ExpenseClaimDetail and
// EmployeeAdvances, §13 InvoiceDetail, §15, §1.4 Quick create): Tomas's claim, submitted through Mantle, in ExpenseClaimDetail's one
// qvt render as his manager deciding it (the expenses, Approve and Return, the finance box), approved from her notice through the
// tray's approve service (the notice naming no amount), the invoice left received for finance; Expense claims' one html render as
// the employee with the new claim's form and his claim approved and with finance; Advances' one html render as the manager with his
// advance to decide; Payroll's InvoiceDetail in People's context, its one html render as the payroll operator; the claim's printed
// page and its evidence bundle (a zip) for a reader of the claim; and the New claim quick create, offered from Commons to the
// employee and not to a People user without self-service. The rules are Mantle's ExpenseClaims; access is PeopleAccess's.
// Run: ./moq test mr-boss --spec PeopleExpenses
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const E = "mantle.humanres.ExpenseServices."
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // Tomas (people.employee) claims a customer lunch and a taxi under his Retail employment and asks an advance, through
        // Mantle's own checks (the screens' transitions are the expenses area's grant); Hannah (people.manager) decides them
        asUser(users.employee, () =>
            system(() => {
                state.claim = invoke("mantle.account.InvoiceServices.create#ProjectExpenseInvoice", {
                    expenseClaim: true,
                    fromPartyId: ids.employeePartyId,
                    purpose: "Store opening visit"
                }).invoiceId
                for (const [type, description, amount] of [
                    ["ItemExpTravMealsEnt", "Lunch with the landlord", "64.20"],
                    ["ItemExpTravLocal", "Taxi to the new store", "35.80"]
                ])
                    invoke(E + "store#ClaimItem", {
                        invoiceId: state.claim,
                        itemTypeEnumId: type,
                        description,
                        itemDate: "2026-10-06",
                        amount,
                        merchantName: "Spec merchant"
                    })
                state.submitted = invoke(E + "submit#Claim", {invoiceId: state.claim})
                state.advance = invoke(E + "request#Advance", {purpose: "Trade fair stand", amount: "150"}).employeeAdvanceId
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature(
    "ExpenseClaimDetail as the manager deciding it: the expenses, Approve and Return, finance's part; approved from her notice, the invoice stays received",
    {
        when() {
            const rendered = asUser(users.manager, () => page("Expenses/ExpenseClaimDetail", {invoiceId: state.claim}))
            const notice = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("moqui.security.user.NotificationMessage")
                            .condition({topic: "PeopleExpenseApproval", recordId: state.claim})
                            .list()
                    )[0]
            )
            const approved = asUser(users.manager, () =>
                system(() =>
                    invoke("org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                        notificationMessageId: notice?.notificationMessageId
                    })
                )
            )
            const after = system(() => ({
                claim: ec.entity.find("mantle.humanres.expense.ExpenseClaim").condition("invoiceId", state.claim).one(),
                invoice: ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", state.claim).one()
            }))
            return {rendered, notice, approved, after}
        },
        then({rendered, notice, after}) {
            state.submitted.statusEnumId == "EcsSubmitted" && state.submitted.receiptsMissing == 2
            rendered.status == 200 && rendered.errors.length == 0
            rendered.output.includes("Claim " + state.claim + ": Store opening visit")
            rendered.output.includes("Lunch with the landlord") && rendered.output.includes("Taxi to the new store")
            rendered.output.includes("Approve") &&
                rendered.output.includes("Return") &&
                rendered.output.includes("Finance and settlement")
            rendered.output.includes("Waiting for approval")
            // the notice names the claim, the person and the employer, never an amount
            String(notice.titleText).includes("expense claim " + state.claim + " of Tomas Lindqvist")
            !String(notice.titleText).includes("100.00") && !String(notice.messageJson).includes("64.2")
            after.claim.statusEnumId == "EcsApproved" && after.invoice.statusId == "InvoiceReceived"
        }
    }
)

feature(
    "Expense claims as the employee: the new claim's form and his claim with finance; Advances as the manager: his advance to decide",
    {
        when() {
            const claims = asUser(users.employee, () => page("Expenses/ExpenseClaims", {show: "mine", newClaim: "Y"}, "html"))
            const advances = asUser(users.manager, () => page("Expenses/EmployeeAdvances", {show: "decide"}, "html"))
            return {claims, advances}
        },
        then({claims, advances}) {
            claims.status == 200 && claims.errors.length == 0
            claims.output.includes("New claim") && claims.output.includes("Make the claim") && claims.output.includes("Purpose")
            claims.output.includes(state.claim) && claims.output.includes("Approved: with finance")
            advances.status == 200 && advances.errors.length == 0
            advances.output.includes(state.advance) &&
                advances.output.includes("Trade fair stand") &&
                advances.output.includes("Tomas Lindqvist")
            advances.output.includes("Waiting for approval") && advances.output.includes("Approve")
        }
    }
)

feature(
    "Payroll's InvoiceDetail shows the claim's invoice to the payroll operator; the claim's print and evidence bundle for a reader of it",
    {
        when() {
            const invoice = asUser(users.payroll, () => page("Payroll/InvoiceDetail", {invoiceId: state.claim}, "html"))
            const printed = asUser(users.employee, () =>
                page("Expenses/ExpenseClaimPrint", {invoiceId: state.claim, renderMode: "html-print"}, "html-print")
            )
            const bundle = asUser(users.manager, () => {
                const out = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/People.xml")
                    .render("Expenses/ExpenseClaimDetail/evidence", {invoiceId: state.claim}, null)
                ec.message.clearErrors()
                return {status: out.status, output: String(out.output || "")}
            })
            return {invoice, printed, bundle}
        },
        then({invoice, printed, bundle}) {
            invoice.status == 200 && invoice.errors.length == 0
            invoice.output.includes("Expense claim invoice " + state.claim) && invoice.output.includes("Taxi to the new store")
            invoice.output.includes("Received: finance codes and approves it")
            printed.status == 200 && printed.output.includes("Expense claim " + state.claim + " · Tomas Lindqvist")
            printed.output.includes("Lunch with the landlord") && printed.output.includes("Hannah")
            bundle.status == 200 && bundle.output.startsWith("PK")
        }
    }
)

// the quick create kinds the user's shell offers from Commons
const newClaimOffered = username =>
    asUser(username, () => {
        const shell = JSON.parse(
            ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null).output
        )
        const commons = Array.from(shell.apps || []).find(app => app.name === "Commons")
        return Array.from(commons?.providers?.quickCreate || []).some(
            entry => entry.kind === "peopleNewClaim" && String(entry.url).includes("People/Expenses/ExpenseClaims")
        )
    })

feature("the New claim quick create: offered to the employee from Commons, not to a People user without self-service", {
    when() {
        return {offered: newClaimOffered(users.employee), notOffered: newClaimOffered(users.reader)}
    },
    then({offered, notOffered}) {
        offered && !notOffered
    }
})
