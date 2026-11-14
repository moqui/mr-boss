// Sales P9's "usable when" (impl-sales P9; design-sales §14.3 scenario 5, its approval half; §5 Approvals, §9 ApprovalPolicies):
// sales.admin publishes a discount rule through ApprovalPolicies; a rep's quote with an entered price over it waits for sales.approver,
// who approves it from Approvals; the rep cannot approve their own; a direct service call cannot propose the unapproved quote, and
// can once it is approved. The rules are Mantle's SalesQuoteApprovals and the BOSS SalesApprovals and SalesAccess.
// Run: ./moq accept mr-boss --spec SalesApprovalUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page, refusal} = lib
const run = String(Date.now()).slice(-6)
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const asService = (user, action) => asUser(user, () => system(action))
const quoteOf = orderId => asService(users.rep, () => invoke("mantle.order.SalesQuoteServices.get#Quote", {orderId}))
let orderId, ruleId

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        // the rule ends so the regression demo is as it was
        if (ruleId)
            asService(users.admin, () =>
                refusal("mantle.order.SalesApprovalServices.store#SalesApprovalPolicy", {
                    salesApprovalPolicyId: ruleId,
                    endPolicy: "Y",
                    changeReason: "Usable test done"
                })
            )
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("sales.admin publishes a discount rule for Retail's quotes through ApprovalPolicies", {
    when() {
        const stored = asUser(users.admin, () =>
            page(
                "Settings/ApprovalPolicies/storeRule",
                {
                    organizationPartyId: ids.organizationId,
                    purposeEnumId: "SapQuote",
                    ruleTypeEnumId: "SarDiscount",
                    discountPercent: "3",
                    description: "Usable " + run,
                    changeReason: "Usable " + run
                },
                "html"
            )
        )
        const rules = asService(users.admin, () =>
            invoke("mantle.order.SalesApprovalServices.find#SalesApprovalPolicies", {organizationPartyId: ids.organizationId})
        ).ruleList
        ruleId = Array.from(rules).find(rule => rule.description === "Usable " + run)?.salesApprovalPolicyId
        const screen = asUser(users.admin, () =>
            page("Settings/ApprovalPolicies", {organizationPartyId: ids.organizationId}, "html")
        )
        return {stored, ruleId, screen}
    },
    then({stored, ruleId, screen}) {
        stored.errors.length == 0
        ruleId != null
        opened(screen)
        screen.output.includes("Usable " + run)
    }
})

feature(
    "a rep's entered price over the rule waits for sales.approver; the rep cannot approve it; a direct call cannot propose it",
    {
        when() {
            asUser(users.rep, () =>
                page(
                    "Quotes/Quotes/createQuote",
                    {
                        organizationPartyId: ids.organizationId,
                        customerPartyId: ids.accounts.wingtip,
                        orderName: "Approval usable " + run
                    },
                    "html"
                )
            )
            orderId = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.order.OrderHeader")
                            .condition({orderName: "Approval usable " + run})
                            .orderBy("-entryDate")
                            .list()
                    )[0]?.orderId
            )
            // the customer's price of Demo Product One-One is 17.50; 16.00 is about 8.6 % under it
            asUser(users.rep, () =>
                page(
                    "Orders/OrderDetail/salesStoreLine",
                    {
                        orderId,
                        orderRevision: quoteOf(orderId).quote.orderRevision,
                        productId: "DEMO_1_1",
                        quantity: "4",
                        unitAmount: "16",
                        overrideReason: "Competitive offer"
                    },
                    "html"
                )
            )
            const needed = quoteOf(orderId).approval
            asUser(users.rep, () =>
                page("Orders/OrderDetail/salesRequestApproval", {orderId, orderRevision: needed.orderRevision}, "html")
            )
            const repDecides = asService(users.rep, () =>
                refusal("mantle.order.SalesApprovalServices.decide#Quote", {orderId, orderRevision: needed.orderRevision})
            )
            const repProposes = asService(users.rep, () =>
                refusal("mantle.order.SalesQuoteServices.propose#Quote", {orderId, orderRevision: needed.orderRevision})
            )
            const detail = asUser(users.rep, () => page("Orders/OrderDetail", {orderId}, "html"))
            return {needed, repDecides, repProposes, detail, after: quoteOf(orderId).approval}
        },
        then({needed, repDecides, repProposes, detail, after}) {
            orderId != null
            needed.needsApproval == true
            Array.from(needed.requirements).some(row => row.ruleTypeEnumId == "SarDiscount")
            repDecides.includes("PERMISSION_DENIED")
            repProposes.includes("APPROVAL_REQUIRED")
            opened(detail)
            detail.output.includes("Waiting for approval")
            after.requested == true
        }
    }
)

feature("sales.approver approves it from Approvals, and the quote can then be proposed", {
    when() {
        const list = asUser(users.approver, () => page("Quotes/Approvals", {}, "html"))
        const notificationMessageId = system(
            () =>
                Array.from(
                    ec.entity
                        .find("moqui.security.user.NotificationMessage")
                        .condition({topic: "SalesQuoteApproval", recordId: orderId})
                        .orderBy("-sentDate")
                        .list()
                )[0]?.notificationMessageId
        )
        const approved = asUser(users.approver, () =>
            page("Quotes/Approvals/Notifications/approve", {notificationMessageId}, "html")
        )
        const after = quoteOf(orderId).approval
        const proposed = asService(users.rep, () =>
            refusal("mantle.order.SalesQuoteServices.propose#Quote", {orderId, orderRevision: after.orderRevision})
        )
        const status = system(() => ec.entity.find("mantle.order.OrderHeader").condition({orderId}).one().statusId)
        return {list, notificationMessageId, approved, after, proposed, status}
    },
    then({list, notificationMessageId, approved, after, proposed, status}) {
        opened(list)
        list.output.includes("Approve quote " + orderId)
        notificationMessageId != null
        approved.errors.length == 0
        after.approved == true
        proposed == ""
        status == "OrderProposed"
    }
})
