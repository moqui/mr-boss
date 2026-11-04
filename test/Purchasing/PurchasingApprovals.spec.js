// Purchasing's approvals (impl-purchasing P4; design-purchasing §12 ApprovalPolicies, §6 Approvals): ApprovalPolicies in its
// one render (html: Retail's demo steps by band and the preview of an amount over the first band, two steps with who may
// take each), and the Today source of the approvals waiting for a purchase approver and none for a buyer. The rules (the
// policies, steps, decisions, budget and supplier onboarding) are Mantle's (mr-mantle test/order/PurchaseApprovals); the
// access cases are PurchasingAccess's; the usable-when walk is the acceptance PurchasingApprovalsWalk.
// Run: ./moq test mr-boss --spec PurchasingApprovals
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke} = lib
const P = "mantle.order.PurchaseServices."
const state = {}

spec({
    setupSpec() {
        // a placed order of Retail's from Ziddleman, waiting for a purchase approver
        state.orderId = asUser(
            users.buyer,
            () => {
                const orderId = invoke(P + "create#PurchaseOrder", {
                    organizationPartyId: ids.organizationId,
                    vendorPartyId: ids.sharedSupplierId,
                    orderName: "Approvals spec order"
                }).orderId
                invoke(P + "store#PurchaseOrderItem", {orderId, productId: "DEMO_1_1", quantity: 1})
                invoke(P + "place#PurchaseOrder", {orderId})
                return orderId
            },
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("ApprovalPolicies lists Retail's steps by band and previews an amount over the first band in two steps", {
    when() {
        return asUser(users.admin, () =>
            lib.page(
                "Settings/ApprovalPolicies",
                {organizationPartyId: ids.organizationId, previewAmount: "6000", previewCurrencyUomId: "USD"},
                "html"
            )
        )
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("Approval steps · 3")
        output.includes("Up to $5,000: a purchase approver")
        output.includes("Another approver than the earlier steps")
        output.includes("New step")
        output.includes(": 2 steps")
        output.includes("Purchasing Administrator")
    }
})

feature("Today lists the approval waiting for a purchase approver, opening its order, and none for a buyer", {
    when() {
        const today = user =>
            asUser(user, () => Array.from(invoke("ironstone.purchasing.ApprovalServices.get#TodayItems", {}).items || []))
        return {approver: today(users.approve), buyer: today(users.buyer)}
    },
    then({approver, buyer}) {
        approver.some(item => item.url == "/qapps/Purchasing/Orders/OrderDetail?orderId=" + state.orderId)
        buyer.length == 0
    }
})
