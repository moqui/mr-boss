// Sales' order screens (impl-sales P11; design-sales §6 Orders and OrderDetail's sales-order context): a rep's direct order placed
// for Wingtip waits for approval (Retail approves as built: ORDER_APPROVE, its net-terms order never auto-approved); OrderDetail's
// one qvt render as the sales approver shows it in the order context (the header with Approve, the approval box, the lines, the
// fulfillment and the conversation and files), and Orders' one html render as the approver lists it under Awaiting approval with the
// customer's reference; follow-up 5: the order ships from Retail's default facility. The rules are Mantle's SalesOrderApproval and StorelessOrderConfirmation. Demo data: Retail East's Wingtip Traders.
// Run: ./moq test mr-boss --spec SalesOrders
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const O = "mantle.order.SalesOrderServices."
const capture = ec.factory.getTool("MailCapture")
let orderId

spec({
    setupSpec() {
        capture.enable()
        const revisionOf = id =>
            Number(ec.entity.find("mantle.order.OrderHeader").condition("orderId", id).disableAuthz().one().orderRevision)
        // the rep's own calls, as Sales' screens would make them (the services check the rep's permissions and scope themselves)
        orderId = asUser(users.rep, () =>
            lib.system(() => {
                const id = invoke(O + "create#SalesOrder", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName: "Wingtip direct shelving",
                    otherPartyOrderId: "WT-PO-2211"
                }).orderId
                invoke(O + "store#SalesOrderLine", {
                    orderId: id,
                    orderRevision: revisionOf(id),
                    productId: "DEMO_1_1",
                    quantity: 3
                })
                invoke(O + "place#SalesOrder", {orderId: id, orderRevision: revisionOf(id)})
                return id
            })
        )
    },
    cleanupSpec() {
        capture.reset()
    }
})

feature(
    "OrderDetail shows a placed direct order in the order context with Approve for the approver; Awaiting approval lists it",
    {
        when() {
            return {
                detail: asUser(users.approver, () => page("Orders/OrderDetail", {orderId})),
                awaiting: asUser(users.approver, () => page("Orders/Orders", {list: "awaiting"}, "html"))
            }
        },
        then({detail, awaiting}) {
            detail.errors.length == 0
            detail.output.includes("Order " + orderId)
            detail.output.includes("Wingtip direct shelving")
            detail.output.includes("PO WT-PO-2211")
            detail.output.includes("Approve")
            detail.output.includes("Approval")
            detail.output.includes("Demo Product One-One")
            detail.output.includes("Nothing shipped yet")
            detail.output.includes("SalesOrderChatter")
            detail.output.includes("SalesOrderFiles")
            // follow-up 5: the part ships from Retail's default facility
            detail.output.includes("Ships from") && detail.output.includes("Ziziwork Retail Warehouse")
            // an approver sees the order to decide it, not to change it: no line editing or copy
            !detail.output.includes("Copy as a new order")
            !detail.output.includes("Change ships from")
            !detail.output.includes("Propose")
            awaiting.errors.length == 0
            awaiting.output.includes("Wingtip direct shelving")
            awaiting.output.includes("Awaiting approval")
            awaiting.output.includes("Pre-approval warnings tell the person approving")
            awaiting.output.includes("WT-PO-2211")
        }
    }
)
