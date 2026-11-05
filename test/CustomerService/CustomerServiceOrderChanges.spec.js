// Customer Service order changes (impl-customer-service P10): OrderChangeDetail's one qvt render of an approved proposal for
// the order desk (its state, the impact with the line's reserved quantity, the decision and Apply as the one primary action)
// and OrderChanges' one qvt render listing it. The rules are Mantle's OrderChanges spec; the access rule is
// CustomerServiceAccess's; the usable-when is the acceptance CustomerServiceOrderChangesWalk. The proposal is the spec's own,
// removed at the end.
// Run: ./moq test mr-boss --spec CustomerServiceOrderChanges
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser} = lib

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("OrderChangeDetail shows the order desk an approved proposal with its impact and Apply; OrderChanges lists it", {
    when() {
        const saved = lib.orderChange(users.agent, {
            orderId: ids.pickOrderId,
            orderChangeKindEnumId: "OckCancel",
            reason: "Screen spec: the customer needs one filter less",
            lines: [{orderItemSeqId: "01", quantity: 1}]
        })
        try {
            const decided = asUser(
                users.manager,
                () =>
                    lib.refusal("mantle.order.OrderChangeServices.decide#OrderChange", {
                        requestId: saved.requestId,
                        sourceRevision: saved.sourceRevision
                    }),
                false
            )
            const detail = asUser(users.orderDesk, () => lib.page("Orders/OrderChangeDetail", {requestId: saved.requestId}))
            const list = asUser(users.manager, () => lib.page("Orders/OrderChanges", {orderId: ids.pickOrderId}))
            return {saved, decided, detail, list}
        } finally {
            lib.removeOrderChange(saved.requestId)
        }
    },
    then({saved, decided, detail, list}) {
        saved.error == ""
        decided == ""
        detail.errors == []
        detail.output.includes("Order change " + saved.requestId)
        detail.output.includes("Approved")
        detail.output.includes("Screen spec: the customer needs one filter less")
        detail.output.includes("Apply")
        !detail.output.includes("Order change not available")
        list.errors == []
        list.output.includes(saved.requestId)
    }
})
