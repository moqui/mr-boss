// Sales' recurring orders and subscriptions (impl-sales P16; design-sales §7 RecurringOrders and Subscriptions): Recurring orders'
// one qvt render as the agreement keeper (a monthly base of Wingtip Traders made from an approved order: its schedule in its zone, the
// next order, the state chip, New recurring order and the row's Edit) and Subscriptions' one html render in Sales' context as the
// rep (a storeless subscription of the order with its billing "No billing link" and Follow up, and none of Commerce's find form). The rules are Mantle's SalesRecurrence; Commerce's own Subscriptions mount is CommerceSubscriptions'.
// Run: ./moq test mr-boss --spec SalesRecurrence
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page, recurringBase} = lib
let made

spec({
    setupSpec() {
        login("john.doe")
        made = recurringBase()
        // a subscription of the order with no store, as Mantle's fulfillment makes one for a subscribed product
        system(() =>
            invoke("create#mantle.product.subscription.Subscription", {
                subscriptionId: "SAL_SPEC_SUB_" + made.sourceOrderId,
                subscriberPartyId: ids.accounts.wingtip,
                orderId: made.sourceOrderId,
                orderItemSeqId: "01",
                productId: "DEMO_1_1",
                fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                thruDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            })
        )
    }
})

feature("Recurring orders shows a monthly base to its keeper; Subscriptions shows a storeless subscription to a rep", {
    when() {
        return {
            list: asUser(users.agreement, () => page("Agreements/RecurringOrders", {state: "all"})),
            subscriptions: asUser(users.rep, () => page("Agreements/Subscriptions", {kind: "storeless"}, "html")),
            // the three P16 choices, each with a selected value outside the page
            choices: asUser(users.agreement, () =>
                ["recurrenceSources", "agreements", "timeZones"].map(
                    choice =>
                        invoke("ironstone.sales.ContextServices.get#Choices", {
                            appRoot: "Sales",
                            choice,
                            term: "zzz-no-match",
                            selected: {
                                recurrenceSources: made.sourceOrderId,
                                agreements: ids.agreements.contoso,
                                timeZones: "America/Denver"
                            }[choice]
                        }).options || []
                )
            )
        }
    },
    then({list, subscriptions, choices}) {
        made.baseOrderId != null
        list.errors.length == 0
        list.output.includes("Recurring orders")
        list.output.includes("Monthly restock")
        list.output.includes("Wingtip Traders")
        list.output.includes("America/Denver")
        list.output.includes("New recurring order")
        list.output.includes("Make the due order now")
        subscriptions.errors.length == 0
        subscriptions.output.includes("Subscriptions")
        subscriptions.output.includes("Wingtip Traders")
        subscriptions.output.includes("No billing link")
        subscriptions.output.includes(made.sourceOrderId)
        !subscriptions.output.includes("Renews before")
        subscriptions.output.includes("Follow up")
        choices[0].some(option => option.value == made.sourceOrderId)
        choices[1].some(option => option.value == ids.agreements.contoso)
        choices[2].some(option => option.value == "America/Denver")
    }
})
