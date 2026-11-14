// Sales approvals (impl-sales P9; design-sales §5 Approvals, §9 SalesDefaults and ApprovalPolicies): the rep asks for the Wingtip
// draft's approval under Retail's demo discount rule; the sales approver's Approvals list (the Commons list with Sales' topics) has
// the quote's row, titled with the quote and its customer and no amount, in its one html render; the approver decides it at the
// quote's revision. OrderDetail's Approval box is checked on SalesQuotes' one render of the quote. The approval rules themselves (the
// revision binding, supersession, self-approval, the free line, the pre-approval warnings) are Mantle's SalesQuoteApprovals; who
// opens Approvals and may decide is SalesAccess'. The usable-when walk is the acceptance SalesApprovalUsable.
// Run: ./moq test mr-boss --spec SalesApprovals
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const quoteService = "mantle.order.SalesQuoteServices."
const approvalService = "mantle.order.SalesApprovalServices."
const orderId = ids.quotes.wingtip

feature("the approver's Approvals list has the asked quote with no amount in its title, and the approver decides it", {
    when() {
        // the services as each user, through no screen: authorization off, as the root's grant lets its screens call them; each checks
        // the user's permission and scope itself
        const as = (user, action) => asUser(user, () => system(action))
        const revision = () => as(users.rep, () => invoke(quoteService + "get#Quote", {orderId}).quote.orderRevision)
        const before = as(users.rep, () => invoke(approvalService + "preview#Quote", {orderId}).approval)
        const asked = as(users.rep, () =>
            refusal(approvalService + "request#QuoteApproval", {orderId, orderRevision: revision()})
        )
        const notice = system(() =>
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition({topic: "SalesQuoteApproval", recordId: orderId})
                .orderBy("-sentDate")
                .list()
        )[0]
        const list = asUser(users.approver, () => page("Quotes/Approvals", {}, "html"))
        const approved = as(users.approver, () =>
            refusal(approvalService + "decide#Quote", {
                orderId,
                orderRevision: revision(),
                salesApprovalPolicyId: ids.approvalRules.discount,
                reason: "Refit bundle"
            })
        )
        const after = as(users.rep, () => invoke(approvalService + "preview#Quote", {orderId}).approval)
        return {before, asked, notice, list, approved, after}
    },
    then({before, asked, notice, list, approved, after}) {
        Array.from(before.requirements).some(row => row.ruleTypeEnumId == "SarDiscount" && row.state != "approved")
        asked == ""
        String(notice.titleText).includes(orderId)
        String(notice.titleText).includes("Wingtip")
        !/10,?500|\$/.test(String(notice.titleText))
        list.status == 200
        list.errors.length == 0
        list.output.includes("Approvals")
        list.output.includes("Approve quote " + orderId)
        !/10,?500\.00/.test(list.output)
        approved == ""
        Array.from(after.requirements).find(row => row.ruleTypeEnumId == "SarDiscount").state == "approved"
    }
})

// F58: OrderChangeApproval's one link goes through Commons' openRecord and resolves per recipient: a commercial change opens Customer
// Service's OrderChangeDetail for its order desk and (impl-sales P14) Sales' OrderChangeDetail for a sales approver, nothing for a
// representative who does not see the order
feature("an order change's link opens Customer Service for its order desk and Sales' OrderChangeDetail for a sales approver", {
    when() {
        const requestId = system(
            () =>
                ec.service
                    .sync()
                    .name("create#mantle.request.Request")
                    .parameters({
                        requestTypeEnumId: "RqtOrderChange",
                        requestName: "Spec price change",
                        orderId: "BOSS_CS_SO_PICK",
                        orderChangeKindEnumId: "OckPrice",
                        statusId: "ReqSubmitted"
                    })
                    .call().requestId
        )
        const link = user =>
            asUser(user, () =>
                system(
                    () =>
                        invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                            recordEntityName: "mantle.request.Request",
                            id: requestId
                        }).url || ""
                )
            )
        const found = {
            topic: system(
                () =>
                    ec.entity.find("moqui.security.user.NotificationTopic").condition("topic", "OrderChangeApproval").one()
                        .linkTemplate
            ),
            approver: link(users.approver),
            orderDesk: link("customerservice.orderdesk"),
            rep: link(users.rep)
        }
        system(() => ec.entity.find("mantle.request.Request").condition("requestId", requestId).deleteAll())
        return found
    },
    then({topic, approver, orderDesk, rep}) {
        topic.startsWith("/apps/Commons/openRecord?recordEntityName=mantle.request.Request")
        approver.includes("/Sales/Orders/OrderChangeDetail")
        orderDesk.includes("/CustomerService/Orders/OrderChangeDetail")
        rep == ""
    }
})
